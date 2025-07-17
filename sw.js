const CACHE_NAME = 'todo-app-cache-v1';

// IMPORTANT : Ajoutez ici les chemins vers toutes vos icônes générées !
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './storage.js',
  './logo.jpg',
  './manifest.json',
  './android-chrome-192x192.png', // Exemple
  './android-chrome-512x512.png',  // Exemple
  './apple-touch-icon.png',         // Exemple
  './favicon-32x32.png',            // Exemple
  './favicon-16x16.png'             // Exemple
];

// Étape d'installation : mise en cache des fichiers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Étape de fetch : servir depuis le cache si possible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la ressource est dans le cache, on la sert
        if (response) {
          return response;
        }
        // Sinon, on la récupère sur le réseau
        return fetch(event.request);
      })
  );
});