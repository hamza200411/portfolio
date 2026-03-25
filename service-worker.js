const ONE_YEAR   = 31536000;
const CACHE_NAME = 'portfolio-cache-v2';

const ASSETS = [
  '/',
  '/index.html',
  '/images/favicon-96x96.png',
  '/images/favicon.svg',
  '/images/favicon.ico',
  '/images/apple-touch-icon.png',
  '/images/site.webmanifest',
  '/images/web-app-manifest-192x192.png',
  '/images/web-app-manifest-512x512.png',
  '/images/network-monitoring.png',
  '/images/chatroom.png',
  '/images/green-university-api.png',
  '/images/green-university-app.png',
  '/images/appointment-api.png',
  '/images/my-blog.png',
  '/images/prayer-times.png',
  '/images/ideas.png',
  '/images/csam.png',
  '/images/text-editor.png',
  '/images/blog-api.png',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);

  if (reqUrl.origin === 'https://fonts.googleapis.com' ||
      reqUrl.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open('fonts-cache-v2').then(cache =>
        cache.match(event.request).then(resp =>
          resp || fetch(event.request).then(fetchResp => {
            cache.put(event.request, fetchResp.clone());
            return fetchResp;
          })
        )
      )
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(fetchResp => {
          const clone   = fetchResp.clone();
          const headers = new Headers(clone.headers);
          headers.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, new Response(clone.body, {
              status: clone.status,
              statusText: clone.statusText,
              headers
            }))
          );
          return fetchResp;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(resp => {
      if (resp) return resp;
      return fetch(event.request).then(fetchResp =>
        caches.open(CACHE_NAME).then(cache => {
          if (event.request.method === 'GET' &&
              fetchResp && fetchResp.status === 200) {
            const clone   = fetchResp.clone();
            const headers = new Headers(clone.headers);
            headers.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
            cache.put(event.request, new Response(clone.body, {
              status: clone.status,
              statusText: clone.statusText,
              headers
            }));
          }
          return fetchResp;
        })
      );
    }).catch(() => caches.match('/index.html'))
  );
});
