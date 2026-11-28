/* 对话置顶 —— 独立补充脚本，不改动官方 bundle */
(function () {
  var KEY = 'chat-demo:pinned';
  var ITEM = '.item-ff6fc9';
  var LIST = '.list-ac14ac';

  function pins() {
    try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

  function fiberOf(el) {
    var k = Object.keys(el).filter(function (x) { return x.indexOf('__reactFiber') === 0; })[0];
    return k ? el[k] : null;
  }
  function sessionOf(el) {
    var f = fiberOf(el);
    for (var i = 0; i < 6 && f; i++) {
      var p = f.memoizedProps;
      if (p && p.session && p.session.id) return p.session;
      f = f.return;
    }
    return null;
  }
  function allItems() {
    return Array.prototype.slice.call(document.querySelectorAll(ITEM));
  }
  function itemById(id) {
    var list = allItems();
    for (var i = 0; i < list.length; i++) {
      var s = sessionOf(list[i]);
      if (s && s.id === id) return list[i];
    }
    return null;
  }
  function titleOf(item) {
    var t = item.querySelector('[class*="title"]');
    return (t && t.textContent.trim()) || '未命名对话';
  }
  function isPinned(id) {
    return pins().some(function (p) { return p.id === id; });
  }

  var PIN_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.5h6"/>' +
    '<path d="M10 3.5 9 10l-3 3.5h12L15 10l-1-6.5"/><path d="M12 13.5V21"/></svg>';

  var css = document.createElement('style');
  css.textContent = [
    '.pinbox{margin:0 0 6px 0;padding:0 0 6px 0;border-bottom:1px solid rgba(0,0,0,.06);}',
    '.pinhead{font-size:12px;line-height:18px;color:#8a8f99;padding:8px 12px 4px;}',
    '.pinrow{display:flex;align-items:center;gap:8px;padding:11px 6px 11px 12px;border-radius:16px;',
    'font-size:16px;color:var(--ds-pin-fg,#0f1115);cursor:pointer;height:44px;box-sizing:border-box;}',
    '.pinrow:active{background:rgba(0,0,0,.05);}',
    '@media (prefers-color-scheme: dark){',
    '.pinbox{border-bottom:1px solid rgba(255,255,255,.08);}',
    '.pinrow{color:var(--ds-pin-fg,#e8eaed);}',
    '.pinrow:active{background:rgba(255,255,255,.07);}',
    '.pin-toggle:active{background:rgba(255,255,255,.08);}',
    '}',
    '.pinrow .pintitle{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.pinrow .pinmark{flex:0 0 auto;color:#4d6bfe;display:flex;}',
    '.pin-toggle{flex:0 0 auto;width:26px;height:26px;display:flex;align-items:center;justify-content:center;',
    'border:0;background:transparent;padding:0;border-radius:8px;color:#9aa0a8;opacity:.75;}',
    '.pin-toggle.on{color:#4d6bfe;opacity:1;}',
    '.pin-toggle:active{background:rgba(0,0,0,.06);}',
    '.pinrow .pin-toggle{margin-right:52px;}',
    '.pin-hidden{display:none !important;}',
    '@keyframes dsPinIn{from{opacity:0;transform:translateY(-8px) scale(.985);}to{opacity:1;transform:none;}}',
    '@keyframes dsPinOut{to{opacity:0;transform:translateY(-6px) scale(.97);max-height:0;}}',
    '@keyframes dsItemOut{to{opacity:0;transform:scale(.985);}}',
    '.pinrow{overflow:hidden;transition:background .15s ease;}',
    '.pinrow.pin-enter{animation:dsPinIn .26s cubic-bezier(.22,.61,.36,1) both;}',
    '.pinrow.pin-leave{animation:dsPinOut .18s ease forwards;pointer-events:none;}',
    '.item-ff6fc9.pin-fading{animation:dsItemOut .16s ease forwards;pointer-events:none;}',
    '@media (prefers-reduced-motion: reduce){',
    '.pinrow.pin-enter,.pinrow.pin-leave,.item-ff6fc9.pin-fading{animation:none !important;}',
    '}'
  ].join('');
  document.head.appendChild(css);

  window.__dsPin = { pins: pins, toggle: toggle, refresh: refresh };

  function toggle(sess, title) {
    var a = pins();
    var i = -1;
    for (var j = 0; j < a.length; j++) { if (a[j].id === sess.id) { i = j; break; } }
    if (i >= 0) a.splice(i, 1);
    else a.unshift({ id: sess.id, title: title || '未命名对话', at: Date.now() });
    save(a);
    refresh();
  }

  function openSession(id) {
    var item = itemById(id);
    if (!item) return false;
    item.click();
    return true;
  }

  var lastIds = null;

  function render(list) {
    var ps = pins();
    var box = document.getElementById('ds-pinbox');
    if (!ps.length) {
      if (box && box.parentNode) box.parentNode.removeChild(box);
      return;
    }
    var sig = ps.map(function (p) { return p.id + '|' + (p.title || ''); }).join(',');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ds-pinbox';
      box.className = 'pinbox';
    } else if (box.getAttribute('data-sig') === sig && box.parentNode === list && list.firstChild === box) {
      return;
    }
    box.setAttribute('data-sig', sig);
    if (box.parentNode !== list) list.insertBefore(box, list.firstChild);
    else if (list.firstChild !== box) list.insertBefore(box, list.firstChild);

    box.textContent = '';
    var head = document.createElement('div');
    head.className = 'pinhead';
    head.textContent = '置顶';
    box.appendChild(head);

    ps.forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'pinrow';

      var mark = document.createElement('span');
      mark.className = 'pinmark';
      mark.innerHTML = PIN_SVG;
      mark.setAttribute('role', 'button');
      mark.setAttribute('aria-label', '取消置顶');
      mark.addEventListener('click', function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        if (row.classList.contains('pin-leave')) return;
        row.classList.add('pin-leave');
        setTimeout(function () {
          var a = pins().filter(function (x) { return x.id !== p.id; });
          save(a);
          refresh();
        }, 150);
      });

      var t = document.createElement('span');
      t.className = 'pintitle';
      t.textContent = p.title || '未命名对话';

      var had = lastIds ? lastIds[p.id] : true;
      if (!had) row.className = 'pinrow pin-enter';

      row.appendChild(t);
      row.appendChild(mark);
      row.addEventListener('click', function () { openSession(p.id); });
      box.appendChild(row);

      // 标题若被重命名，跟随原条目
      var orig = itemById(p.id);
      if (orig) {
        var real = titleOf(orig);
        if (real && real !== p.title) { p.title = real; save(pins()); t.textContent = real; }
      }
    });
    lastIds = {};
    ps.forEach(function (p) { lastIds[p.id] = true; });
  }

  function decorate() {
    var items = allItems();
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var sess = sessionOf(item);
        if (!sess || !sess.id) return;
        var pinned = isPinned(sess.id);
        if (pinned) {
          if (!item.classList.contains('pin-hidden') && !item.classList.contains('pin-fading')) {
            item.classList.add('pin-fading');
            setTimeout(function () {
              item.classList.remove('pin-fading');
              item.classList.add('pin-hidden');
            }, 150);
          }
        } else {
          item.classList.remove('pin-fading');
          item.classList.remove('pin-hidden');
        }

        var btn = item.querySelector('.pin-toggle');
        if (!btn) {
          var action = item.querySelector('[class*="action"]');
          if (!action) return;
          btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pin-toggle';
          btn.setAttribute('aria-label', '置顶对话');
          btn.innerHTML = PIN_SVG;
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var s = sessionOf(item);
            if (s && s.id) toggle(s, titleOf(item));
          });
          action.insertBefore(btn, action.firstChild);
        }
        btn.classList.toggle('on', pinned);
        btn.title = pinned ? '取消置顶' : '置顶';
      })(items[i]);
    }
  }

  var scheduled = false;
  function refresh() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      var list = document.querySelector(LIST);
      if (!list) return;
      decorate();
      render(list);
    }, 0);
  }

  function start() {
    refresh();
    var lastList = null;
    var ob = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        if (t && t.closest && t.closest('#ds-pinbox')) continue;
        refresh();
        return;
      }
    });
    setInterval(function () {
      var list = document.querySelector(LIST);
      if (!list) return;
      if (list !== lastList) {
        lastList = list;
        try { ob.disconnect(); } catch (e) {}
        ob.observe(list, { childList: true, subtree: true });
      }
      refresh();
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    setTimeout(start, 200);
  }
})();
