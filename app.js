// Application TO DO - JavaScript principal
class TodoApp {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.editingTaskId = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
    }

    bindEvents() {
        // Événements de connexion
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());
        document.getElementById('showRegisterBtn').addEventListener('click', () => this.showRegisterForm());
        document.getElementById('showLoginBtn').addEventListener('click', () => this.showLoginForm());

        // Événements de l'application
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('syncBtn').addEventListener('click', () => this.handleSync());
        document.getElementById('addTaskBtn').addEventListener('click', () => this.handleAddTask());

        // Événements clavier
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('registerPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });
        document.getElementById('newTaskText').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });

        // Définir la date par défaut à aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('newTaskDate').value = today;
    }

    checkAuthState() {
        const user = storageService.getCurrentUser();
        if (user) {
            this.currentUser = user;
            this.showApp();
            this.loadTasks();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('appScreen').style.display = 'none';
        this.clearMessages();
    }

    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        document.getElementById('currentUsername').textContent = this.currentUser.username;
        this.clearMessages();
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        this.clearMessages();
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        this.clearMessages();
    }

    clearMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.style.display = 'none');
    }

    showMessage(elementId, message, isError = false) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = 'block';
        
        // Masquer automatiquement après 5 secondes
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    setLoading(loading) {
        this.isLoading = loading;
        document.getElementById('loadingOverlay').style.display = loading ? 'flex' : 'none';
        
        // Désactiver les boutons pendant le chargement
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = loading);
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showMessage('loginError', 'Veuillez remplir tous les champs', true);
            return;
        }

        this.setLoading(true);

        try {
            const user = storageService.authenticateUser(username, password);
            storageService.setCurrentUser(user);
            this.currentUser = user;
            
            this.showMessage('loginSuccess', 'Connexion réussie !');
            
            setTimeout(() => {
                this.showApp();
                this.loadTasks();
            }, 1000);
            
        } catch (error) {
            this.showMessage('loginError', error.message, true);
        } finally {
            this.setLoading(false);
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;

        if (!username || !password) {
            this.showMessage('loginError', 'Veuillez remplir tous les champs', true);
            return;
        }

        if (username.length < 3) {
            this.showMessage('loginError', 'Le nom d\'utilisateur doit contenir au moins 3 caractères', true);
            return;
        }

        if (password.length < 6) {
            this.showMessage('loginError', 'Le mot de passe doit contenir au moins 6 caractères', true);
            return;
        }

        this.setLoading(true);

        try {
            const user = storageService.createUser(username, password);
            this.showMessage('loginSuccess', 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
            
            // Nettoyer les champs et revenir au formulaire de connexion
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            
            setTimeout(() => {
                this.showLoginForm();
            }, 2000);
            
        } catch (error) {
            this.showMessage('loginError', error.message, true);
        } finally {
            this.setLoading(false);
        }
    }

    handleLogout() {
        storageService.logout();
        this.currentUser = null;
        this.tasks = [];
        
        // Nettoyer les champs de connexion
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        
        this.showLogin();
        this.showLoginForm();
    }

    async handleSync() {
        if (!this.currentUser) return;

        this.setLoading(true);
        
        try {
            const result = await storageService.simulateSync(this.currentUser.username);
            this.showMessage('appSuccess', result.message);
            this.loadTasks(); // Recharger les tâches après la sync
        } catch (error) {
            this.showMessage('appError', 'Erreur lors de la synchronisation', true);
        } finally {
            this.setLoading(false);
        }
    }

    handleAddTask() {
        const taskText = document.getElementById('newTaskText').value.trim();
        const taskDate = document.getElementById('newTaskDate').value;

        if (!taskText) {
            this.showMessage('appError', 'Veuillez entrer une tâche', true);
            return;
        }

        try {
            const newTask = storageService.addTask(this.currentUser.username, taskText, taskDate);
            
            // Nettoyer le formulaire
            document.getElementById('newTaskText').value = '';
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('newTaskDate').value = today;
            
            this.loadTasks();
            this.showMessage('appSuccess', 'Tâche ajoutée avec succès !');
            
        } catch (error) {
            this.showMessage('appError', error.message, true);
        }
    }

    loadTasks() {
        if (!this.currentUser) return;

        this.tasks = storageService.getTasks(this.currentUser.username);
        this.renderTasks();
        this.updateStats();
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');

        if (this.tasks.length === 0) {
            emptyState.style.display = 'block';
            tasksList.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';

        // Trier les tâches : non terminées en premier, puis par priorité et date
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            if (!a.completed && !b.completed) {
                const priorityOrder = { 'overdue': 0, 'high': 1, 'medium': 2, 'low': 3 };
                const aPriority = priorityOrder[a.priority] || 3;
                const bPriority = priorityOrder[b.priority] || 3;
                
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                
                // Trier par date si même priorité
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        tasksList.innerHTML = sortedTasks.map(task => this.renderTask(task)).join('');
    }

    renderTask(task) {
        const isEditing = this.editingTaskId === task.id;
        const priorityLabels = {
            'low': 'Faible',
            'medium': 'Moyenne',
            'high': 'Élevée',
            'overdue': 'En retard'
        };

        const formattedDate = task.dueDate ? 
            new Date(task.dueDate).toLocaleDateString('fr-FR', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }) : 'Aucune date';

        if (isEditing) {
            return `
                <div class="task-item ${task.completed ? 'completed' : ''}">
                    <div class="task-content">
                        <input type="checkbox" 
                               class="task-checkbox" 
                               ${task.completed ? 'checked' : ''} 
                               onchange="app.toggleTask('${task.id}')">
                        <div class="task-details">
                            <div class="task-edit-form">
                                <input type="text" 
                                       id="editText_${task.id}" 
                                       value="${this.escapeHtml(task.text)}" 
                                       class="input-field"
                                       placeholder="Texte de la tâche">
                                <div class="task-edit-row">
                                    <input type="date" 
                                           id="editDate_${task.id}" 
                                           value="${task.dueDate || ''}" 
                                           class="input-field date-input">
                                    <div class="task-edit-actions">
                                        <button class="btn btn-primary btn-sm" onclick="app.saveTask('${task.id}')">
                                            💾 Sauvegarder
                                        </button>
                                        <button class="btn btn-secondary btn-sm" onclick="app.cancelEdit()">
                                            ❌ Annuler
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-content">
                    <input type="checkbox" 
                           class="task-checkbox" 
                           ${task.completed ? 'checked' : ''} 
                           onchange="app.toggleTask('${task.id}')">
                    <div class="task-details">
                        <div class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</div>
                        <div class="task-meta">
                            <div class="task-date">
                                📅 ${formattedDate}
                            </div>
                            <div class="task-priority priority-${task.priority}">
                                ${priorityLabels[task.priority] || 'Faible'}
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-outline btn-sm" onclick="app.editTask('${task.id}')" title="Modifier">
                            ✏️
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="app.deleteTask('${task.id}')" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    toggleTask(taskId) {
        try {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            storageService.updateTask(this.currentUser.username, taskId, {
                completed: !task.completed
            });

            this.loadTasks();
            
            const message = task.completed ? 'Tâche marquée comme non terminée' : 'Tâche terminée !';
            this.showMessage('appSuccess', message);
            
        } catch (error) {
            this.showMessage('appError', error.message, true);
        }
    }

    editTask(taskId) {
        this.editingTaskId = taskId;
        this.renderTasks();
        
        // Focus sur le champ de texte
        setTimeout(() => {
            const textInput = document.getElementById(`editText_${taskId}`);
            if (textInput) {
                textInput.focus();
                textInput.select();
            }
        }, 100);
    }

    saveTask(taskId) {
        const textInput = document.getElementById(`editText_${taskId}`);
        const dateInput = document.getElementById(`editDate_${taskId}`);
        
        const newText = textInput.value.trim();
        const newDate = dateInput.value;

        if (!newText) {
            this.showMessage('appError', 'Le texte de la tâche ne peut pas être vide', true);
            return;
        }

        try {
            storageService.updateTask(this.currentUser.username, taskId, {
                text: newText,
                dueDate: newDate
            });

            this.editingTaskId = null;
            this.loadTasks();
            this.showMessage('appSuccess', 'Tâche mise à jour !');
            
        } catch (error) {
            this.showMessage('appError', error.message, true);
        }
    }

    cancelEdit() {
        this.editingTaskId = null;
        this.renderTasks();
    }

    deleteTask(taskId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            return;
        }

        try {
            storageService.deleteTask(this.currentUser.username, taskId);
            this.loadTasks();
            this.showMessage('appSuccess', 'Tâche supprimée');
            
        } catch (error) {
            this.showMessage('appError', error.message, true);
        }
    }

    updateStats() {
        if (!this.currentUser) return;

        const stats = storageService.getTaskStats(this.currentUser.username);
        const statsCard = document.getElementById('statsCard');

        if (stats.total === 0) {
            statsCard.style.display = 'none';
            return;
        }

        statsCard.style.display = 'block';

        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('completedTasks').textContent = stats.completed;
        document.getElementById('urgentTasks').textContent = stats.urgent;
        document.getElementById('overdueTasks').textContent = stats.overdue;

        // Ajouter les classes CSS pour les couleurs
        document.getElementById('totalTasks').className = 'stat-number total';
        document.getElementById('completedTasks').className = 'stat-number completed';
        document.getElementById('urgentTasks').className = 'stat-number urgent';
        document.getElementById('overdueTasks').className = 'stat-number overdue';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialiser l'application et enregistrer le Service Worker quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();

    // Enregistrement du Service Worker pour la PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker enregistré avec succès:', registration);
            })
            .catch(error => {
                console.log('Échec de l\'enregistrement du Service Worker:', error);
            });
    }
});