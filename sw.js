// StudyFlow Service Worker - 通知クリックハンドラ & オフライン対応
const CACHE_NAME = 'studyflow-v8';

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
        return clients.openWindow('/');
      }
    })
  );
});

// Fetch: ネットワーク優先（オフラインフォールバック）
self.addEventListener('fetch', (event) => {
  // Firebase系、外部CDN、analytics は通さない
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});