/* 侧栏搜索 —— 外挂脚本，不动官方 bundle */
(function () {
  var Q = '';

  var CSS = [
    '.ds-hide{display:none !important;}',
    '.ds-search-wrap{display:flex;align-items:center;gap:6px;margin:2px 10px 10px;}',
    '.ds-search{flex:1 1 auto;height:36px;border:0;border-radius:10px;background:#f2f3f5;',
    'color:#0f1115;font-size:15px;padding:0 34px 0 12px;outline:none;',
    '-webkit-appearance:none;box-sizing:border-box;}',
    '.ds-search::placeholder{color:#9aa0a6;}',
    '.ds-search-box{position:relative;flex:1 1 auto;display:flex;}',
    '.ds-search-clear{position:absolute;right:6px;top:50%;transform:translateY(-50%);',
    'width:24px;height:24px;border:0;border-radius:50%;background:transparent;',
    'color:#9aa0a6;font-size:15px;line-height:1;display:none;align-items:center;',
    'justify-content:center;padding:0;}',
    '.ds-search-clear.on{display:flex;}',
    '@media (prefers-color-scheme: dark){',
    '.ds-search{background:#1d1f22;color:#e8eaed;}',
    '}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('ds-search-style')) return;
    var s = document.createElement('style');
    s.id = 'ds-search-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function apply() {
    var q = Q.trim().toLowerCase();
    var list = document.querySelector('.list-ac14ac');
    if (!list) return;
    var items = list.querySelectorAll('.item-ff6fc9');
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var t = (it.innerText || '').toLowerCase();
      if (q && t.indexOf(q) < 0) it.classList.add('ds-hide');
      else it.classList.remove('ds-hide');
    }
    var secs = list.querySelectorAll('.section-ac14ac');
    for (var j = 0; j < secs.length; j++) {
      var s = secs[j], any = false;
      var its = s.querySelectorAll('.item-ff6fc9');
      for (var k = 0; k < its.length; k++) {
        if (!its[k].classList.contains('ds-hide')) { any = true; break; }
      }
      if (q && !any) s.classList.add('ds-hide');
      else s.classList.remove('ds-hide');
    }
    var box = document.getElementById('ds-pinbox');
    if (box) {
      var rows = box.querySelectorAll('.pinrow');
      for (var m = 0; m < rows.length; m++) {
        var r = rows[m];
        if (q && (r.innerText || '').toLowerCase().indexOf(q) < 0) r.classList.add('ds-hide');
        else r.classList.remove('ds-hide');
      }
    }
  }

  function mount() {
    injectStyle();
    var sider = document.querySelector('.sider-ac14ac');
    if (!sider) return;
    var list = sider.querySelector('.list-ac14ac');
    if (!list) return;
    if (document.getElementById('ds-search')) { apply(); return; }
    var wrap = document.createElement('div');
    wrap.id = 'ds-search';
    wrap.className = 'ds-search-wrap';
    var box = document.createElement('div');
    box.className = 'ds-search-box';
    var inp = document.createElement('input');
    inp.className = 'ds-search';
    inp.type = 'search';
    inp.autocomplete = 'off';
    inp.placeholder = '搜索对话内容';
    inp.setAttribute('aria-label', '搜索对话内容');
    var clr = document.createElement('button');
    clr.type = 'button';
    clr.className = 'ds-search-clear';
    clr.setAttribute('aria-label', '清除搜索');
    clr.textContent = '\u00d7';
    clr.addEventListener('click', function () {
      inp.value = '';
      Q = '';
      clr.classList.remove('on');
      apply();
      inp.focus();
    });
    inp.addEventListener('input', function () {
      Q = inp.value;
      clr.classList.toggle('on', Q.length > 0);
      apply();
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    });
    box.appendChild(inp);
    box.appendChild(clr);
    wrap.appendChild(box);
    var anchor = sider.querySelector('.listWrap-ac14ac');
    if (!anchor || anchor.parentElement !== sider) {
      anchor = null;
      for (var i = 0; i < sider.children.length; i++) {
        if (sider.children[i].contains(list)) { anchor = sider.children[i]; break; }
      }
    }
    if (anchor) sider.insertBefore(wrap, anchor);
    else sider.appendChild(wrap);
    apply();
  }

  function boot() {
    injectStyle();
    new MutationObserver(function () { mount(); }).observe(document.body, { childList: true, subtree: true });
    setInterval(mount, 900);
    mount();
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
