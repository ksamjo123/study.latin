/* 서비스 워커 — 오프라인의 전부가 이 파일에 달려 있다.
 *
 * 단일 파일 빌드라 담을 것이 문서 하나뿐이다.
 * index.html 안에 CSS·JS·본문·아이콘이 모두 들어 있다.
 *
 * ⚠ index.html을 고쳐서 다시 올릴 때마다 아래 숫자를 올려야 한다.
 *   올리지 않으면 낡은 캐시가 계속 응답해서 "고쳤는데 안 바뀐다"가 된다.
 */
'use strict';

var CACHE = 'latin-v1';
var SHELL = ['./', './index.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // 오프라인에서는 어떤 이동 요청이든 문서를 돌려준다
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
