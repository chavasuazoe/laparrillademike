/* PWA shell cache. Network-first for documents and code; never intercept Cloudflare. */
const CACHE = 'parrilla-shell-v10-finance-20261107';
const CORE = ["./", "./index.html", "./cocina.html", "./admin.html", "./assets/css/base.css", "./assets/css/waiter.css", "./assets/css/admin.css", "./assets/css/kitchen.css", "./assets/js/common.js", "./assets/js/menu.js", "./assets/js/config.js", "./assets/js/cloudflare.js", "./assets/js/icons.js", "./assets/js/waiter.js", "./assets/js/kitchen.js", "./assets/js/admin-finance.js", "./assets/js/admin.js", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png", "./assets/icons/icon.svg", "./assets/manifests/waiter.webmanifest", "./assets/manifests/kitchen.webmanifest", "./assets/manifests/admin.webmanifest"];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys
    .filter(key => (key.startsWith('parrilla-shell-') || key.startsWith('pedidos-mesas-')) && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const key = new Request(url.origin + url.pathname);
  const isAppAsset = request.mode === 'navigate' || /\.(html|js|css|webmanifest)$/i.test(url.pathname);
  if (isAppAsset) {
    event.respondWith(fetch(request, {cache:'no-store'}).then(response => {
      if (response.ok) { const copy=response.clone(); event.waitUntil(caches.open(CACHE).then(cache=>cache.put(key,copy))); }
      return response;
    }).catch(async () => await caches.match(key) || await caches.match(request) || Response.error()));
  } else {
    event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
  }
});
