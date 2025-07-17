// Service de stockage local pour l'application TO DO
class StorageService {
    constructor() {
        this.USERS_KEY = 'todo_users';
        this.CURRENT_USER_KEY = 'todo_current_user';
        this.TASKS_KEY_PREFIX = 'todo_tasks_';
    }

    // Gestion des utilisateurs
    getUsers() {
        try {
            const users = localStorage.getItem(this.USERS_KEY);
            return users ? JSON.parse(users) : {};
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            return {};
        }
    }

    saveUsers(users) {
        try {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
            return false;
        }
    }

    createUser(username, password) {
        const users = this.getUsers();
        
        if (users[username]) {
            throw new Error('Ce nom d\'utilisateur existe déjà');
        }

        // Hash simple du mot de passe (en production, utiliser bcrypt ou similaire)
        const hashedPassword = this.simpleHash(password);
        
        users[username] = {
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        if (this.saveUsers(users)) {
            return { username, createdAt: users[username].createdAt };
        } else {
            throw new Error('Erreur lors de la création du compte');
        }
    }

    authenticateUser(username, password) {
        const users = this.getUsers();
        const user = users[username];

        if (!user) {
            throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
        }

        const hashedPassword = this.simpleHash(password);
        if (user.password !== hashedPassword) {
            throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
        }

        // Mettre à jour la dernière connexion
        user.lastLogin = new Date().toISOString();
        this.saveUsers(users);

        return { username: user.username, lastLogin: user.lastLogin };
    }

    getCurrentUser() {
        try {
            const currentUser = localStorage.getItem(this.CURRENT_USER_KEY);
            return currentUser ? JSON.parse(currentUser) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
            return null;
        }
    }

    setCurrentUser(user) {
        try {
            if (user) {
                localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(this.CURRENT_USER_KEY);
            }
            return true;
        } catch (error) {
            console.error('Erreur lors de la définition de l\'utilisateur actuel:', error);
            return false;
        }
    }

    logout() {
        this.setCurrentUser(null);
    }

    // Gestion des tâches
    getTasksKey(username) {
        return this.TASKS_KEY_PREFIX + username;
    }

    getTasks(username) {
        try {
            const tasksKey = this.getTasksKey(username);
            const tasks = localStorage.getItem(tasksKey);
            const parsedTasks = tasks ? JSON.parse(tasks) : [];
            
            // Nettoyer les tâches terminées anciennes (plus de 7 jours)
            const cleanedTasks = this.cleanOldCompletedTasks(parsedTasks);
            if (cleanedTasks.length !== parsedTasks.length) {
                this.saveTasks(username, cleanedTasks);
            }
            
            return cleanedTasks;
        } catch (error) {
            console.error('Erreur lors de la récupération des tâches:', error);
            return [];
        }
    }

    saveTasks(username, tasks) {
        try {
            const tasksKey = this.getTasksKey(username);
            localStorage.setItem(tasksKey, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des tâches:', error);
            return false;
        }
    }

    addTask(username, taskText, dueDate) {
        const tasks = this.getTasks(username);
        const newTask = {
            id: this.generateId(),
            text: taskText.trim(),
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            priority: this.calculatePriority(dueDate)
        };

        tasks.push(newTask);
        
        if (this.saveTasks(username, tasks)) {
            return newTask;
        } else {
            throw new Error('Erreur lors de l\'ajout de la tâche');
        }
    }

    updateTask(username, taskId, updates) {
        const tasks = this.getTasks(username);
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            throw new Error('Tâche non trouvée');
        }

        const task = tasks[taskIndex];
        
        // Mettre à jour les champs
        if (updates.text !== undefined) {
            task.text = updates.text.trim();
        }
        
        if (updates.dueDate !== undefined) {
            task.dueDate = updates.dueDate;
            task.priority = this.calculatePriority(updates.dueDate);
        }
        
        if (updates.completed !== undefined) {
            task.completed = updates.completed;
            task.completedAt = updates.completed ? new Date().toISOString() : null;
        }

        task.updatedAt = new Date().toISOString();

        if (this.saveTasks(username, tasks)) {
            return task;
        } else {
            throw new Error('Erreur lors de la mise à jour de la tâche');
        }
    }

    deleteTask(username, taskId) {
        const tasks = this.getTasks(username);
        const filteredTasks = tasks.filter(task => task.id !== taskId);

        if (filteredTasks.length === tasks.length) {
            throw new Error('Tâche non trouvée');
        }

        if (this.saveTasks(username, filteredTasks)) {
            return true;
        } else {
            throw new Error('Erreur lors de la suppression de la tâche');
        }
    }

    // Utilitaires
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir en 32bit integer
        }
        return hash.toString();
    }

    calculatePriority(dueDate) {
        if (!dueDate) return 'low';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays === 0) return 'high';
        if (diffDays <= 2) return 'medium';
        return 'low';
    }

    cleanOldCompletedTasks(tasks) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return tasks.filter(task => {
            if (!task.completed) return true;
            if (!task.completedAt) return true;
            
            const completedDate = new Date(task.completedAt);
            return completedDate > sevenDaysAgo;
        });
    }

    getTaskStats(username) {
        const tasks = this.getTasks(username);
        
        const stats = {
            total: tasks.length,
            completed: 0,
            urgent: 0,
            overdue: 0
        };

        tasks.forEach(task => {
            if (task.completed) {
                stats.completed++;
            } else {
                if (task.priority === 'high' || task.priority === 'medium') {
                    stats.urgent++;
                }
                if (task.priority === 'overdue') {
                    stats.overdue++;
                }
            }
        });

        return stats;
    }

    // Simulation de synchronisation
    async simulateSync(username) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Synchronisation simulée pour ${username}`);
                resolve({ success: true, message: 'Données synchronisées' });
            }, 1000);
        });
    }

    // Export/Import des données (pour backup)
    exportUserData(username) {
        const tasks = this.getTasks(username);
        const userData = {
            username,
            tasks,
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(userData, null, 2);
    }

    importUserData(username, jsonData) {
        try {
            const userData = JSON.parse(jsonData);
            if (userData.tasks && Array.isArray(userData.tasks)) {
                return this.saveTasks(username, userData.tasks);
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            return false;
        }
    }
}

// Instance globale du service de stockage
window.storageService = new StorageService();