/* 版本自检：页面在后台被挂起后不会重新加载，靠它提示「有新版本」 */
(function () {
  var KEY = 'ds-chat:build';
  var shown = false;

  function toast() {
    if (shown || document.getElementById('ds-upd')) return;
    shown = true;
    var el = document.createElement('div');
    el.id = 'ds-upd';
    el.textContent = '有新版本 · 点此刷新';
    el.style.cssText = [
      'position:fixed', 'left:50%', 'transform:translateX(-50%)',
      'bottom:calc(env(safe-area-inset-bottom, 0px) + 96px)',
      'z-index:2147483600', 'padding:9px 16px', 'border-radius:999px',
      'background:rgba(28,31,38,.94)', 'color:#fff', 'font-size:13px',
      'box-shadow:0 6px 24px rgba(0,0,0,.28)', 'cursor:pointer',
      'animation:dsUpdIn .3s ease both'
    ].join(';');
    el.addEventListener('click', function () {
      try { localStorage.setItem(KEY, ''); } catch (e) {}
      location.reload();
    });
    document.body.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; }, 12000);
  }

  function check() {
    var req = new Request('build.json?_=' + Date.now(), { cache: 'no-store' });
    fetch(req).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.build) return;
      var b = String(j.build);
      var prev = null;
      try { prev = localStorage.getItem(KEY); } catch (e) {}
      if (prev && prev !== b) toast();
      try { localStorage.setItem(KEY, b); } catch (e) {}
    }).catch(function () {});
  }

  var st = document.createElement('style');
  st.textContent = '@keyframes dsUpdIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}';
  document.head.appendChild(st);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
  setInterval(check, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) check();
  });
})();
