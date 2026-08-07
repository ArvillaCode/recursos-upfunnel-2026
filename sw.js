const CACHE_NAME = "upfunnel-recursos-v4";
const CRITICAL_SHELL = [
  "./",
  "./index.html",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./manifest.json",
  "./inter-latin.woff2",
];
const OPTIONAL_SHELL = [
  "./privacidad.html",
  "./logo-upfunnel-160.webp",
  "./logo-upfunnel-320.webp",
  "./snaprec-cover-480.webp",
  "./teleprompter-cover-480.webp",
  "./gabriel-320.webp",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CRITICAL_SHELL);
      await Promise.allSettled(OPTIONAL_SHELL.map((asset) => cache.add(asset)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response.ok) return response;
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("./index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const refresh = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      });
      if (!cached) return refresh;
      event.waitUntil(refresh.catch(() => undefined));
      return cached;
    }),
  );
});
