const CACHE_NAME = 'upfunnel-recursos-brand-2-1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './inter-latin.woff2',
  './logo-upfunnel.svg',
  './upfunnel-symbol.svg',
  './snaprec-cover-480.webp',
  './teleprompter-cover-480.webp',
  './gabriel-320.webp',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(APP_SHELL);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== CACHE_NAME;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put('./index.html', copy); });
      return response;
    }).catch(function () {
      return caches.match('./index.html');
    }));
    return;
  }

  event.respondWith(caches.match(request, {ignoreSearch:true}).then(function (cached) {
    return cached || fetch(request);
  }));
});

