const CACHE_NAME = "fixed-flow-v1";
const fromScope = (path) => new URL(path, self.registration.scope).toString();
const APP_SHELL = [
  fromScope("./"),
  fromScope("index.html"),
  fromScope("manifest.webmanifest"),
  fromScope("icons/icon.svg"),
  fromScope("icons/icon-192.png"),
  fromScope("icons/icon-512.png"),
  fromScope("icons/apple-touch-icon.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match(fromScope("index.html"))),
      ),
  );
});
