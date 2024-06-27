self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("tm-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/script.js",
        "/styles.css",
        "/cover-landscape.png",
        // Add other required assets, e.g., CSS, JavaScript, and image files
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
