/* 模型切换器 v2：不改 bundle，只在 fetch 层改写请求里的 model 字段
   交互：点右下胶囊 → 上方弹出候选菜单 → 点选即切换（可选「自定义 ID…」） */
(function () {
  'use strict';
  var KEY = 'chat-demo:model';
  var KEY_API = 'chat-demo:api-key';
  var DEF = 'deepseek-flash';
  var lastRewritten = null;
  window.__dsModelVer = 2;
  window.__dsModelReal = null; // 真实生效模型（来自响应的 model 字段）

  /* 本地已知模型（离线/无 Key 时也能选） */
  var KNOWN = [
    { id: 'deepseek-flash', note: '联网搜索 · 自动标题' },
    { id: 'deepseek-v4-pro', note: '基础对话 · 不联网' },
  ];
  var remote = null;      /* 从 /models 拉到的 id 列表 */
  var fetching = false;

  function apiKey() {
    try { return localStorage.getItem(KEY_API) || ''; } catch (e) { return ''; }
  }
  function cur() {
    try { return localStorage.getItem(KEY) || DEF; } catch (e) { return DEF; }
  }
  function set(m) {
    try { localStorage.setItem(KEY, m); } catch (e) {}
    paint();
  }

  /* ---------- fetch 层改写 ---------- */
  var orig = window.fetch;
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf('api.deepseek.com') >= 0 && init && typeof init.body === 'string') {
        var body = JSON.parse(init.body);
        if (body && typeof body === 'object' && ('model' in body)) {
          body.model = cur();
          // 服务端联网工具与自动标题只有 deepseek-flash 支持，切到其它模型必须剥离，否则 400
          if (body.model !== 'deepseek-flash') {
            if (Array.isArray(body.tools)) {
              body.tools = body.tools.filter(function (t) {
                var ty = t && (t.type || t.name);
                return ty !== 'deepseek_web_search' && ty !== 'deepseek_read_url';
              });
              if (!body.tools.length) delete body.tools;
            }
            if (body.title && typeof body.title === 'object') body.title.enabled = false;
            else if (body.title === true) body.title = false;
            // latest_reminder 也是 flash 专有的消息角色
            if (Array.isArray(body.messages)) {
              body.messages = body.messages.filter(function (m) {
                return !(m && (m.role === 'latest_reminder' || m.role === 'reminder'));
              });
            }
          }
          lastRewritten = JSON.stringify(body);
          init = Object.assign({}, init, { body: lastRewritten });
        }
      }
    } catch (e) {}
    return orig.apply(this, [input, init]);
  };

  window.__dsModel = {
    get: cur,
    set: set,
    refresh: loadRemote,
    get lastRewritten() { return lastRewritten; }
  };

  /* ---------- 拉取账户可用模型 ---------- */
  function loadRemote() {
    var k = apiKey();
    if (!k || fetching) return Promise.resolve(null);
    fetching = true;
    return orig('https://api.deepseek.com/models', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + k, Accept: 'application/json' }
    }).then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (j) {
      var list = (j && j.data) ? j.data.map(function (x) { return x && x.id; }).filter(Boolean) : null;
      if (list && list.length) { remote = list; if (menu) renderMenu(); }
      return remote;
    }).catch(function () { return null; })
      .then(function (v) { fetching = false; return v; });
  }

  /* ---------- 胶囊 ---------- */
  var el = null, menu = null, cur0 = cur();

  function paint() {
    if (el) el.textContent = '模型 · ' + cur();
  }

  function items() {
    var seen = {}, out = [];
    function push(id, note) {
      if (!id || seen[id]) return;
      seen[id] = 1;
      var n = note || '';
      // 只有 deepseek-flash 支持服务端联网搜索与自动标题
      if (id !== 'deepseek-flash') n = (n ? n + ' · ' : '') + '无联网';
      out.push({ id: id, note: n });
    }
    KNOWN.forEach(function (k) { push(k.id, k.note); });
    if (remote) remote.forEach(function (id) {
      push(id, KNOWN.some(function (k) { return k.id === id; }) ? '' : '来自账户');
    });
    push(cur(), '当前使用');
    return out;
  }

  function closeMenu() {
    if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
    menu = null;
  }

  function renderMenu() {
    if (!menu) return;
    var list = menu.querySelector('[data-role=list]');
    list.innerHTML = '';
    items().forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      var active = it.id === cur();
      b.style.cssText = 'display:flex;align-items:baseline;gap:8px;width:100%;text-align:left;' +
        'padding:11px 14px;border:0;background:' + (active ? 'rgba(77,107,254,.16)' : 'transparent') +
        ';color:#fff;font-size:14px;font-family:inherit;line-height:1.35';
      var name = document.createElement('span');
      name.textContent = it.id;
      name.style.cssText = 'font-weight:600;flex:0 0 auto';
      var note = document.createElement('span');
      note.textContent = active ? '✓ ' + (it.note || '当前') : it.note;
      note.style.cssText = 'font-size:11px;opacity:.55;flex:1 1 auto;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      b.appendChild(name); b.appendChild(note);
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        set(it.id); closeMenu();
      });
      list.appendChild(b);
    });
    if (!remote && !fetching) {
      var tip = document.createElement('div');
      tip.textContent = apiKey() ? '正在查询账户模型…' : '填好 API Key 后可自动读取可用模型';
      tip.style.cssText = 'padding:4px 14px 10px;font-size:11px;opacity:.45';
      list.appendChild(tip);
    }
  }

  function openMenu() {
    if (menu) { closeMenu(); return; }
    menu = document.createElement('div');
    menu.style.cssText = [
      'position:fixed', 'right:8px',
      'bottom:calc(env(safe-area-inset-bottom, 0px) + 186px)',
      'z-index:1001', 'width:242px', 'max-height:52vh', 'overflow:auto',
      '-webkit-overflow-scrolling:touch', 'border-radius:14px',
      'background:rgba(28,28,30,.97)', 'backdrop-filter:blur(18px)',
      'box-shadow:0 12px 40px rgba(0,0,0,.5)', 'border:1px solid rgba(255,255,255,.1)',
      'color:#fff', 'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif'
    ].join(';');

    var head = document.createElement('div');
    head.textContent = '切换请求档位（后端均为 deepseek-flash）';
    head.style.cssText = 'padding:11px 14px 6px;font-size:12px;opacity:.5;letter-spacing:.04em';
    var list = document.createElement('div');
    list.setAttribute('data-role', 'list');
    var foot = document.createElement('button');
    foot.type = 'button';
    foot.textContent = '自定义 ID…（列表以外的 ID 会被 API 静默回退）';
    foot.style.cssText = 'display:block;width:100%;text-align:left;padding:11px 14px;border:0;' +
      'border-top:1px solid rgba(255,255,255,.1);background:transparent;color:#7c9cff;' +
      'font-size:13px;font-family:inherit';
    foot.addEventListener('click', function (e) {
      e.stopPropagation();
      var v = window.prompt('输入模型 ID（仅这两个真实存在）（改完下次发消息立即生效）', cur());
      if (v && v.trim()) set(v.trim());
      closeMenu();
    });

    menu.appendChild(head); menu.appendChild(list); menu.appendChild(foot);
    document.body.appendChild(menu);
    renderMenu();
    loadRemote();
  }

  function mount() {
    if (el) return;
    // 加大全屏面板/抽屉头部按钮的热区，避免 iOS 上28px小按钮点不中
    if (!document.getElementById('ds-hit-fix')) {
      var st = document.createElement('style');
      st.id = 'ds-hit-fix';
      st.textContent = 'aside header button,[class*="header-"]>button{min-width:44px;min-height:44px;touch-action:manipulation;}';
      document.head.appendChild(st);
    }
    el = document.createElement('button');
    el.type = 'button';
    el.setAttribute('aria-label', '切换请求档位');
    el.setAttribute('aria-haspopup', 'menu');
    el.style.cssText = [
      'position:fixed', 'right:8px',
      'bottom:calc(env(safe-area-inset-bottom, 0px) + 152px)',
      'z-index:1000', 'padding:4px 9px', 'border:0', 'border-radius:999px',
      'background:rgba(20,20,20,.6)', 'color:#fff', 'font-size:11px',
      'line-height:1.5', 'opacity:.72', 'backdrop-filter:blur(6px)',
      'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif'
    ].join(';');
    el.addEventListener('click', function (ev) {
      ev.stopPropagation();
      openMenu();
    });
      document.body.appendChild(el);
    paint();
    loadRemote();
  }

  /* 点空白处关闭菜单 */
  document.addEventListener('click', function (e) {
    if (!menu) return;
    if (menu.contains(e.target) || (el && el.contains(e.target))) return;
    closeMenu();
  }, true);
  window.addEventListener('orientationchange', closeMenu);

  /* 当前值与外部改动同步 */
  setInterval(function () {
    var v = cur();
    if (v !== cur0) { cur0 = v; paint(); }
  }, 1200);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* 侧栏/搜索结果面板展开时隐藏模型胶囊与菜单，避免浮在抽屉/面板之上 */
(function () {
  function isSearchPanelOpen() {
    // 搜索来源面板：全屏 aside 或包含"搜索结果"标题的固定容器
    var frames = Array.from(document.querySelectorAll('aside, [class*="frame-"], [class*="Frame-"]'));
    return frames.some(function (el) {
      var r = el.getBoundingClientRect();
      var visible = r.width >= window.innerWidth * 0.85 && r.height >= window.innerHeight * 0.85;
      var hasTitle = (el.textContent || '').indexOf('搜索结果') !== -1;
      return visible && hasTitle;
    });
  }

  function tick() {
    var open = !!document.querySelector('[class*="drawerMask"]') || isSearchPanelOpen();
    var pill = document.querySelector('button[aria-label="切换请求档位"]');
    var list = document.querySelector('[data-role="list"]');
    if (pill) pill.style.visibility = open ? 'hidden' : '';
    if (list) list.style.visibility = open ? 'hidden' : '';
  }
  setInterval(tick, 400);

  // 为搜索来源面板增加"从左侧边缘向右滑"关闭手势，作为关闭按钮失灵时的兜底
  var swipedPanel = null;
  function attachSwipe() {
    var panel = Array.from(document.querySelectorAll('aside, [class*="frame-"], [class*="Frame-"]')).find(function (el) {
      return (el.textContent || '').indexOf('搜索结果') !== -1;
    });
    if (!panel || panel === swipedPanel) return;
    swipedPanel = panel;
    var sx = 0, sy = 0, tracking = false;
    panel.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      if (t.clientX < 50) { sx = t.clientX; sy = t.clientY; tracking = true; }
    }, { passive: true });
    panel.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      var t = e.touches[0];
      var dx = t.clientX - sx;
      var dy = t.clientY - sy;
      if (dx > 70 && Math.abs(dy) < 60) {
        tracking = false;
        var closeBtn = panel.querySelector('header button, .header- button, [class*="header-"] > button');
        if (closeBtn) closeBtn.click();
      }
    }, { passive: true });
    panel.addEventListener('touchend', function () { tracking = false; }, { passive: true });
  }
  setInterval(attachSwipe, 600);
})();


