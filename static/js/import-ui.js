(function () {
  var KEY = 'chat-demo:import-progress:v2';
  var mem = null;

  function read() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { mem = null; }
    return mem;
  }
  function write(s) {
    mem = s;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function base(fp, totalSessions) {
    return {
      fp: fp,
      status: 'running',
      doneSessions: [],
      doneFiles: [],
      totalSessions: totalSessions || 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      error: ''
    };
  }

  window.__dsImport = {
    fingerprint: function (f) {
      return [f && f.name || '', f && f.size || 0, f && f.lastModified || 0].join('|');
    },
    load: function () { return read(); },
    reset: function (fp, meta) {
      var s = base(fp, meta && meta.totalSessions);
      write(s);
      return s;
    },
    setTotals: function (meta) {
      var s = read();
      if (!s) return;
      if (meta && typeof meta.totalSessions === 'number') s.totalSessions = meta.totalSessions;
      s.updatedAt = Date.now();
      write(s);
    },
    markSessions: function (ids) {
      var s = read();
      if (!s || !ids || !ids.length) return;
      for (var i = 0; i < ids.length; i++) {
        if (s.doneSessions.indexOf(ids[i]) < 0) s.doneSessions.push(ids[i]);
      }
      s.updatedAt = Date.now();
      write(s);
    },
    markFiles: function (paths) {
      var s = read();
      if (!s || !paths || !paths.length) return;
      for (var i = 0; i < paths.length; i++) {
        if (s.doneFiles.indexOf(paths[i]) < 0) s.doneFiles.push(paths[i]);
      }
      s.updatedAt = Date.now();
      write(s);
    },
    fail: function (msg) {
      var s = read();
      if (!s) s = base('', 0);
      s.status = 'failed';
      s.error = String(msg || '');
      s.updatedAt = Date.now();
      write(s);
    },
    complete: function () {
      var s = read();
      if (!s) return;
      s.status = 'done';
      s.error = '';
      s.updatedAt = Date.now();
      write(s);
    },
    clear: function () {
      mem = null;
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };

  var hud = null, last = { sessionsDone: 0, sessionsTotal: 0, filesDone: 0, current: '' };

  function makeHud() {
    if (hud) return hud;
    var box = document.createElement('div');
    box.id = 'ds-import-hud';
    box.setAttribute('role', 'status');
    box.style.cssText = [
      'position:fixed', 'left:12px', 'right:12px', 'bottom:calc(12px + env(safe-area-inset-bottom,0px))',
      'z-index:2147483647', 'display:none', 'box-sizing:border-box',
      'background:rgba(20,20,24,.96)', 'color:#fff', 'border:1px solid rgba(255,255,255,.14)',
      'border-radius:14px', 'padding:14px 16px', 'font:14px/1.45 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif',
      'box-shadow:0 10px 40px rgba(0,0,0,.45)', 'backdrop-filter:blur(18px)', '-webkit-backdrop-filter:blur(18px)',
      'pointer-events:none'
    ].join(';');
    box.innerHTML = [
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">',
      '<div id="ds-ih-title" style="font-weight:600">正在导入</div>',
      '<div id="ds-ih-pct" style="font-variant-numeric:tabular-nums;color:#9ad0ff">0%</div>',
      '</div>',
      '<div style="height:6px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden;margin:10px 0 8px">',
      '<div id="ds-ih-bar" style="height:100%;width:0;background:linear-gradient(90deg,#3d8bfd,#7ad0ff);border-radius:99px;transition:width .25s ease"></div>',
      '</div>',
      '<div id="ds-ih-meta" style="color:rgba(255,255,255,.7);font-size:12px"></div>',
      '<div id="ds-ih-cur" style="color:rgba(255,255,255,.55);font-size:12px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>',
      '<div id="ds-ih-note" style="color:rgba(255,255,255,.45);font-size:11px;margin-top:7px">导入期间请保持页面在前台，不要关闭或刷新。</div>'
    ].join('');
    document.body.appendChild(box);
    hud = box;
    return box;
  }

  function render() {
    var box = makeHud();
    var pct = last.sessionsTotal > 0 ? Math.min(100, Math.round(last.sessionsDone / last.sessionsTotal * 100)) : 0;
    box.querySelector('#ds-ih-pct').textContent = pct + '%';
    box.querySelector('#ds-ih-bar').style.width = pct + '%';
    box.querySelector('#ds-ih-meta').textContent =
      '会话 ' + last.sessionsDone + (last.sessionsTotal ? '/' + last.sessionsTotal : '') +
      ' · 附件 ' + last.filesDone;
    box.querySelector('#ds-ih-cur').textContent = last.current || '';
  }

  window.__dsImportHUD = {
    show: function (title) {
      var box = makeHud();
      box.style.display = 'block';
      box.style.borderColor = 'rgba(255,255,255,.14)';
      box.querySelector('#ds-ih-title').textContent = title || '正在导入';
      box.querySelector('#ds-ih-title').style.color = '#fff';
      box.querySelector('#ds-ih-note').textContent = '导入期间请保持页面在前台，不要关闭或刷新。';
      box.querySelector('#ds-ih-note').style.color = 'rgba(255,255,255,.45)';
      render();
    },
    update: function (x) {
      if (x) {
        if (typeof x.sessionsDone === 'number') last.sessionsDone = x.sessionsDone;
        if (typeof x.sessionsTotal === 'number') last.sessionsTotal = x.sessionsTotal;
        if (typeof x.filesDone === 'number') last.filesDone = x.filesDone;
        if (typeof x.current === 'string') last.current = x.current;
      }
      render();
    },
    fail: function (msg) {
      var box = makeHud();
      box.style.display = 'block';
      box.style.borderColor = 'rgba(255,110,110,.5)';
      box.querySelector('#ds-ih-title').textContent = '导入中断';
      box.querySelector('#ds-ih-title').style.color = '#ff8a8a';
      box.querySelector('#ds-ih-note').textContent = msg || '进度已保存，重新选择同一个 ZIP 可继续。';
      box.querySelector('#ds-ih-note').style.color = '#ffb3b3';
      render();
    },
    done: function () {
      var box = makeHud();
      box.style.borderColor = 'rgba(90,220,150,.45)';
      box.querySelector('#ds-ih-title').textContent = '导入完成';
      box.querySelector('#ds-ih-title').style.color = '#7ee2a8';
      box.querySelector('#ds-ih-pct').textContent = '100%';
      box.querySelector('#ds-ih-bar').style.width = '100%';
      box.querySelector('#ds-ih-note').textContent = '正在打开第一条对话…';
      box.querySelector('#ds-ih-note').style.color = 'rgba(255,255,255,.5)';
      setTimeout(function () { if (hud) hud.style.display = 'none'; }, 3500);
    }
  };
})();
