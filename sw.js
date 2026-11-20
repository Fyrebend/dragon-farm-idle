// Service worker: lets the game install as an app and open offline.
// Strategy: try the network first (so updates show up right away), fall back to the saved copy offline.
const CACHE = "dragon-farm-idle-v1";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./main.js",
  "./lib/break_eternity.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Install: save the core files for offline play
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

// Activate: remove caches from older versions
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch: network first, update the saved copy, use the saved copy if offline
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
