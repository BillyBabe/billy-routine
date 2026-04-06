const CACHE_NAME = 'billy-glow-up-v2.4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './js/store.js',
  './profile.jpg',
  './inspiration.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
