// StudyFlow Service Worker - 通知クリックハンドラ & オフライン対応
const CACHE_NAME = 'studyflow-v13';

// Install: キャッシュは最小限に
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 通知がクリックされたとき
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data ? event.notification.data.url : '/';

  // アプリのウィンドウを探してフォーカスする、なければ開く
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 既に開いているタブがあればフォーカスする
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // タブがなければ新しく開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// バックグラウンドでのプッシュ通知受信イベント
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'StudyFlow Pro',
      body: event.data ? event.data.text() : '新着メッセージがあります。'
    };
  }

  const title = data.title || 'StudyFlow Pro';
  const options = {
    body: data.body || '新着メッセージがあります。',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png',
    badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/2436/2436874.png',
    data: {
      url: data.link || '/'
    },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Fetch: ネットワーク優先（オフラインフォールバック）
self.addEventListener('fetch', (event) => {
  // Firebase系、外部CDN、Vercel APIなどはキャッシュ対象外として直接フェッチする
  const bypassCache = 
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com') ||
    event.request.url.includes('vercel.app');

  if (bypassCache) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});