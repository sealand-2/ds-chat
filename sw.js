/* 自毁版：卸载自己并让已打开页面刷新，彻底摆脱旧缓存 */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(self.registration.unregister().then(function () {
    return self.clients.matchAll({ type: 'window' });
  }).then(function (cs) { cs.forEach(function (c) { try { c.navigate(c.url); } catch (x) {} }); }));
});
