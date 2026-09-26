
const CACHE_VERSION = 'gi-v8.542.32';
const CACHE_STATIC  = `${CACHE_VERSION}-static`;
const CACHE_DATA    = `${CACHE_VERSION}-data`;

const STATIC_PRECACHE = [
  '/assets/dashboard.css?v=8.540.3',
  '/assets/command-bar.css?v=8.491.5',
  '/assets/pair-detail.css?v=1.0.0',
  '/assets/dashboard.js?v=8.542.32',
  '/assets/pair-detail.js?v=1.0.2',
  '/assets/command-bar.js?v=8.491.4',
  '/assets/gi-auth.js?v=1.7.8',
  '/assets/gi-overview.js?v=2.0.1',
  '/assets/fx-websocket.js?v=1.0.6',
  '/assets/cot-modal-chart.js?v=7.99.1',
  '/assets/cb-rates-modal.js?v=8.0.8',
  '/assets/real-carry-modal.js?v=2.7.11',
  '/assets/corr-modal.js?v=2.7.0',
  '/assets/yc-modal.js?v=8.8.7',
  '/assets/heatmap-modal.js?v=2.6.8',
  '/assets/econ-surprises-modal.js?v=1.3.12',
  '/assets/onboarding.js?v=7.89.12',
  '/assets/layout-resizer.js?v=1.0.2',
  '/assets/feed.js?v=1.0.0',
  '/assets/share.js?v=1.1.0',
  '/assets/inline-panel.js?v=1.4.2',
  '/assets/calendar-panel.js?v=1.21.1',
  '/assets/econ-matrix.js?v=2.6.10',
  '/assets/capital-flows.js?v=2.2.1',
  '/assets/gdpr.js',
  '/assets/sw-register.js',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-192x192.png',
  '/apple-touch-icon.png',
  '/manifest.json',
];

const DATA_PATH_PREFIXES = [
  '/ai-analysis/',
  '/bond2y-data/',
  '/bond10y-data/',
  '/calendar-data/',
  '/capital-flows-data/',
  '/cot-data/',
  '/dtcc-data/',
  '/economic-data/',
  '/extended-data/',
  '/fair-value-data/',
  '/fx-data/',
  '/growth-differential-data/',
  '/intraday-data/',
  '/meetings-data/',
  '/news-data/',
  '/ohlc-data/',
  '/rates/',
  '/research-data/',
  '/rr-data/',
  '/seasonality-data/',
  '/sentiment-data/',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(STATIC_PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DATA)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isData = DATA_PATH_PREFIXES.some(p => url.pathname.startsWith(p));

  const isEntryPoint = url.pathname === '/' || url.pathname === '/index.html';

  if (isEntryPoint || isData) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            const cacheName = isData ? CACHE_DATA : CACHE_STATIC;
            caches.open(cacheName).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => {});
        return cached || networkFetch;
      })
    );
  }
});

self.addEventListener('push', event => {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {  }

  var title   = data.title   || 'COT Report Updated';
  var body    = data.body    || 'CFTC data for GBP, EUR, JPY & AUD is now live.';
  var url     = data.url     || '/';
  var icon    = data.icon    || '/favicon-192x192.png';
  var badge   = data.badge   || '/favicon-32x32.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body:  body,
      icon:  icon,
      badge: badge,
      tag:   'cot-update',
      renotify: false,
      data:  { url: url }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.includes('globalinvesting.github.io') && 'focus' in c) {
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
