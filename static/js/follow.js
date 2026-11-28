/* 思考完成后停止自动跟随 v4 —— 直接控制 bundle 里的开关 */
(function () {
  var FLAG = '__dsStopFollow';
  var STATE = 'idle';
  var BTN = null;
  var lastSc = null;
  window[FLAG] = false;

  function scroller() { return document.querySelector('.scroll-_7ccaf'); }
  function dist(el) { return el.scrollHeight - el.scrollTop - el.clientHeight; }

  function setStop(v) {
    window[FLAG] = v;
    var el = scroller();
    if (el) updateBtn(el);
  }

  function unlock() { STATE = 'idle'; if (window[FLAG]) setStop(false); }

  function makeBtn() {
    if (BTN) return BTN;
    BTN = document.createElement('button');
    BTN.type = 'button';
    BTN.setAttribute('aria-label', '回到底部');
    BTN.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></svg>';
    BTN.style.cssText = 'position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 200px);' +
      'width:36px;height:36px;border-radius:50%;border:0;display:none;align-items:center;' +
      'justify-content:center;background:rgba(255,255,255,.94);color:#0f1115;' +
      'box-shadow:0 2px 10px rgba(0,0,0,.2);z-index:2147482000;padding:0;';
    BTN.addEventListener('click', function () {
      var el = scroller();
      unlock();
      if (el) el.scrollTop = el.scrollHeight;
    });
    document.body.appendChild(BTN);
    return BTN;
  }

  function updateBtn(el) {
    var b = makeBtn();
    b.style.display = (window[FLAG] && el && dist(el) > 100) ? 'flex' : 'none';
  }

  var lockAt = 0;
  function inspect(txt) {
    if (!txt) return false;
    var s = String(txt).slice(0, 140);
    var thinking = s.indexOf('正在思考') >= 0;
    var done = s.indexOf('已思考（用时') >= 0 || s.indexOf('已思考(用时') >= 0;
    if (thinking && Date.now() - lockAt > 900) {
      STATE = 'thinking';
      if (window[FLAG]) setStop(false);
    }
    if (done && (STATE === 'thinking' || STATE === 'answered')) {
      if (STATE === 'thinking') { STATE = 'answered'; lockAt = Date.now(); setStop(true); }
    }
    return thinking || done;
  }

  function scan(muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'characterData') {
        inspect(m.target.textContent);
      } else if (m.addedNodes && m.addedNodes.length) {
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1) inspect(n.textContent);
          else if (n.nodeType === 3) inspect(n.textContent);
        }
      }
    }
    var el = scroller();
    if (el) updateBtn(el);
  }

  function patch(el) {
    if (el.__dsPatched) return;
    var d = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
    Object.defineProperty(el, 'scrollTop', {
      configurable: true,
      get: function () { return d.get.call(this); },
      set: function (v) {
        if (window[FLAG] && v > d.get.call(this) + 2) return;
        d.set.call(this, v);
      }
    });
    el.__dsPatched = true;
  }

  var ob = null;
  function bind(el) {
    patch(el);
    if (ob) ob.disconnect();
    ob = new MutationObserver(scan);
    ob.observe(el, { childList: true, subtree: true, characterData: true });
    lastSc = el;
    el.addEventListener('scroll', function () {
      if (window[FLAG] && dist(el) < 40) unlock();
      updateBtn(el);
    }, { passive: true });
  }

  function evaluate() {
    var el = scroller();
    if (!el) return;
    if (el !== lastSc) { unlock(); bind(el); }
    updateBtn(el);
  }

  function boot() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) unlock();
    }, true);
    document.addEventListener('pointerdown', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('textarea') || t.closest('[aria-label="发送"]') || t.closest('[contenteditable="true"]')) unlock();
    }, true);
    new MutationObserver(evaluate).observe(document.body, { childList: true, subtree: true });
    setInterval(evaluate, 1000);
    evaluate();
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
