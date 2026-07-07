// Pose Studio service worker — network-first. Same-origin requests bypass the
// HTTP cache entirely (stale Safari caches kept serving old builds); the CDN
// AI model stays normally cached because it is large and versioned.
const CACHE = 'pose-studio-v3';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  e.respondWith(
    fetch(req, sameOrigin ? { cache: 'no-store' } : undefined).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(req))
  );
});
