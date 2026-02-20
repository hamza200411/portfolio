const CACHE_NAME = 'portfolio-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/images/green-university-app.png',
  '/images/favicon-96x96.png',
  '/images/favicon.svg',
  '/images/favicon.ico',
  '/images/apple-touch-icon.png',
  '/images/site.webmanifest',
  '/images/laravel.png',
  '/images/filament.png',
  '/images/livewire.png',
  '/images/flutter.png',
  '/images/MySQL.png',
  '/images/Python.png',
  '/images/appointment-api.png',
  '/images/green-university-api.png',
  '/images/my-blog.png',
  '/images/prayer-times.png',
  '/images/blog-api.png',
  '/images/csam.png',
  '/images/text-editor.png',
  '/images/chatroom.png',
  '/images/ideas.png',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const reqUrl = new URL(event.request.url);

  if (reqUrl.origin === 'https://fonts.googleapis.com' || reqUrl.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open('fonts-cache').then(cache =>
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
      fetch(event.request).then(fetchResp => {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, fetchResp.clone()));
        return fetchResp;
      }).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request).then(fetchResp => {
        return caches.open(CACHE_NAME).then(cache => {
          if (event.request.method === 'GET' && fetchResp && fetchResp.status === 200) {
            cache.put(event.request, fetchResp.clone());
          }
          return fetchResp;
        });
      });
    }).catch(() => {
      return caches.match('/index.html');
    })
  );
});