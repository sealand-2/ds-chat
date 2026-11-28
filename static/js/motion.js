/* 可见动效 v1 —— 新消息入场 + 全局按压反馈 */
(function () {
  var seen = new WeakSet();

  function tag(el) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    el.classList.add('ds-in');
    el.addEventListener('animationend', function () { el.classList.remove('ds-in'); });
  }

  function scan() {
    var sc = document.querySelector('.scroll-_7ccaf');
    if (!sc) return;
    var msgs = sc.querySelectorAll('.message-e1faee');
    for (var i = 0; i < msgs.length; i++) tag(msgs[i]);
  }

  function boot() {
    scan();
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.addedNodes) {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.classList && n.classList.contains('message-e1faee')) tag(n);
            else if (n.querySelectorAll) {
              var inner = n.querySelectorAll('.message-e1faee');
              for (var k = 0; k < inner.length; k++) tag(inner[k]);
            }
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener('pointerdown', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var b = t.closest('button');
      if (b && !b.dataset.dsPress && !b.closest('#ds-pinbox')) {
        b.classList.add('ds-pressed');
        var up = function () {
          b.classList.remove('ds-pressed');
          document.removeEventListener('pointerup', up, true);
          document.removeEventListener('pointercancel', up, true);
        };
        document.addEventListener('pointerup', up, true);
        document.addEventListener('pointercancel', up, true);
      }
    }, { passive: true });
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
