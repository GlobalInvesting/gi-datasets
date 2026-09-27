(function () {
  'use strict';

  var G10 = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'USD', 'NOK', 'SEK'];
  var TABS = ['overview', 'macro', 'session', 'strength', 'fairvalue'];
  var SESSIONS = [
    { name: 'Sydney',   start: 21, end: 6  },
    { name: 'Tokyo',    start: 0,  end: 9  },
    { name: 'London',   start: 7,  end: 16 },
    { name: 'New York', start: 12, end: 21 }
  ];
  var REFRESH_MS = 5 * 60 * 1000;
  var LEGACY_REFRESH_MS = 30 * 1000;
  var STALE_HOURS = (function () {
    var n = new Date(), wd = n.getUTCDay(), h = n.getUTCHours();
    return (wd === 0 || wd === 6 || (wd === 1 && h < 9)) ? 76 : 26;
  })();

  var root, tabsEl, subEl, toggleBtn, contentEl;
  var state = { pair: null, sym: null, tab: 'overview', open: true, data: null, loadedAt: 0, loading: null, legacyEl: null, legacyAt: 0, macroCcy: null };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function append(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }
  function safeUrl(u) {
    try {
      var p = new URL(u, location.href);
      return (p.protocol === 'https:' || p.protocol === 'http:') ? p.href : null;
    } catch (e) { return null; }
  }
  function fmtUtc(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d)) return null;
    return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC';
  }
  function ageHours(iso) {
    var d = new Date(iso);
    return isNaN(d) ? null : (Date.now() - d.getTime()) / 36e5;
  }
  function parseSym(sym) {
    var m = /:([A-Z]{6})$/.exec(sym || '');
    if (!m) return null;
    var base = m[1].slice(0, 3), quote = m[1].slice(3);
    if (G10.indexOf(base) < 0 || G10.indexOf(quote) < 0) return null;
    return { base: base, quote: quote, key: (base + quote).toLowerCase(), label: base + '/' + quote };
  }
  function decimals(pair) { return pair.quote === 'JPY' ? 3 : 5; }
  function signed(v, d) { return (v >= 0 ? '+' : '') + v.toFixed(d); }

  function note(msg) { return el('p', 'pdt-empty', msg); }
  function footer(source, iso) {
    var t = fmtUtc(iso);
    var txt = source + (t ? ' \u00b7 Updated ' + t : '');
    var f = el('div', 'pdt-foot', txt);
    var h = iso ? ageHours(iso) : null;
    if (h != null && h > STALE_HOURS) f.appendChild(el('span', 'pdt-stale', ' \u00b7 data older than ' + STALE_HOURS + 'h'));
    return f;
  }
  function sourcesLine(list) {
    if (!Array.isArray(list) || !list.length) return null;
    var wrap = el('div', 'pdt-sources', 'Sources: ');
    var n = 0;
    list.slice(0, 4).forEach(function (s) {
      var href = s && safeUrl(s.url);
      if (!href) return;
      if (n++) wrap.appendChild(document.createTextNode(' \u00b7 '));
      var a = el('a', null, String(s.title || s.url).slice(0, 40));
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      wrap.appendChild(a);
    });
    return n ? wrap : null;
  }
  function block(title, bodyNodes) {
    var s = el('section', 'pdt-block');
    s.appendChild(el('h3', 'pdt-h', title));
    bodyNodes.forEach(function (n) { if (n) s.appendChild(n); });
    return s;
  }
  function twoCol(a, b) { return append(el('div', 'pdt-cols'), a, b); }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }
  function load(force) {
    if (state.loading) return state.loading;
    if (!force && state.data && Date.now() - state.loadedAt < REFRESH_MS) return Promise.resolve(state.data);
    var urls = {
      catalysts: GI_DATA_BASE + 'ai-analysis/currency-catalysts.json',
      session:   GI_DATA_BASE + 'ai-analysis/session-context.json',
      drivers:   GI_DATA_BASE + 'ai-analysis/currency-drivers.json',
      fair:      GI_DATA_BASE + 'fair-value-data/summary.json'
    };
    var keys = Object.keys(urls);
    state.loading = Promise.all(keys.map(function (k) {
      return fetchJson(urls[k]).catch(function () { return null; });
    })).then(function (res) {
      var d = {};
      keys.forEach(function (k, i) { d[k] = res[i]; });
      state.data = d; state.loadedAt = Date.now(); state.loading = null;
      return d;
    });
    return state.loading;
  }

  function renderMacro(p, d) {
    var cat = d.catalysts;
    var c = (state.macroCcy === p.base || state.macroCcy === p.quote) ? state.macroCcy : p.base;
    var wrap = el('div', 'pdt-stack');
    var head = el('div', 'pdt-macro-head');
    head.appendChild(el('h3', 'pdt-sh', c + ' MACRO DRIVERS'));
    var seg = el('div', 'pdt-seg');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Currency');
    [p.base, p.quote].forEach(function (x) {
      var btn = el('button', null, x);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', x === c ? 'true' : 'false');
      btn.addEventListener('click', function () {
        if (state.macroCcy === x) return;
        state.macroCcy = x;
        renderTab('macro');
      });
      seg.appendChild(btn);
    });
    head.appendChild(seg);
    wrap.appendChild(head);
    var e = cat && cat.currencies && cat.currencies[c];
    if (!e || !e.catalyst) {
      wrap.appendChild(note('No macro driver data available yet.'));
    } else {
      wrap.appendChild(el('p', 'pdt-text', e.catalyst));
      wrap.appendChild(sourcesLine(e.sources));
      wrap.appendChild(footer('AI Analytics', e.updated));
    }
    return wrap;
  }

  var CYCLE_ANCHOR_H = 21;
  function cycleElapsedH(now) {
    return ((now.getUTCHours() + now.getUTCMinutes() / 60) - CYCLE_ANCHOR_H + 24) % 24;
  }
  function sessionOffsetH(s) { return (s.start - CYCLE_ANCHOR_H + 24) % 24; }
  function sessionLenH(s) { return (s.end - s.start + 24) % 24; }
  function sessionState(s, now) {
    var el_ = cycleElapsedH(now), off = sessionOffsetH(s);
    if (el_ >= off && el_ < off + sessionLenH(s)) return 'live';
    return el_ < off ? 'upcoming' : 'closed';
  }
  function opensInText(s, now) {
    var mins = Math.max(1, Math.round((sessionOffsetH(s) - cycleElapsedH(now)) * 60));
    var hh = Math.floor(mins / 60), mm = mins % 60;
    var when = String(s.start).padStart(2, '0') + ':00 UTC';
    return 'Opens in ' + (hh ? hh + 'h ' : '') + mm + 'm \u00b7 ' + when;
  }
  function sessionNote(p, sc, sessName) {
    var lines = [p.base, p.quote].map(function (c) {
      return sc.sessions && sc.sessions[c] && sc.sessions[c][sessName];
    }).filter(function (t) { return typeof t === 'string' && t; });
    if (!lines.length) return null;
    var fwd = p.base + '/' + p.quote, inv = p.quote + '/' + p.base;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf(fwd) >= 0 || lines[i].indexOf(inv) >= 0) return lines[i];
    }
    return lines[0];
  }
  function renderSession(p, d) {
    var sc = d.session;
    if (!sc || !sc.sessions) return block('SESSION CONTEXT', [note('Session context not available yet.')]);
    var fxClosed = typeof window.isFxMarketClosedNow === 'function' && window.isFxMarketClosedNow();
    if (sc.market_closed || fxClosed) {
      var wrap0 = el('div', 'pdt-stack');
      wrap0.appendChild(note('Market closed. Showing last session recap \u00b7 resumes Sunday 21:00 UTC.'));
      SESSIONS.forEach(function (sess) {
        var row0 = el('section', 'pdt-sess');
        var head0 = el('div', 'pdt-sess-head');
        head0.appendChild(el('h3', 'pdt-sess-name', sess.name.toUpperCase()));
        head0.appendChild(el('span', 'pdt-chip pdt-chip-closed', 'CLOSED'));
        row0.appendChild(head0);
        row0.appendChild(el('p', 'pdt-text', sessionNote(p, sc, sess.name) || '\u2014'));
        wrap0.appendChild(row0);
      });
      wrap0.appendChild(footer('AI Analytics \u00b7 last session recap', sc.generated_at));
      return wrap0;
    }
    var now = new Date();
    var wrap = el('div', 'pdt-stack');
    SESSIONS.forEach(function (sess) {
      var st = sessionState(sess, now);
      var row = el('section', 'pdt-sess' + (st === 'live' ? ' pdt-sess-live' : st === 'upcoming' ? ' pdt-sess-upcoming' : ''));
      var head = el('div', 'pdt-sess-head');
      head.appendChild(el('h3', 'pdt-sess-name', sess.name.toUpperCase()));
      if (st !== 'upcoming') head.appendChild(el('span', 'pdt-chip pdt-chip-' + st, st === 'live' ? 'LIVE' : 'CLOSED'));
      row.appendChild(head);
      row.appendChild(el('p', 'pdt-text', st === 'upcoming' ? opensInText(sess, now) : (sessionNote(p, sc, sess.name) || '\u2014')));
      wrap.appendChild(row);
    });
    wrap.appendChild(footer('AI Analytics \u00b7 session windows in UTC', sc.generated_at));
    return wrap;
  }

  function strengthNote(p, dr) {
    if (!dr) return null;
    var label = p.base + '/' + p.quote, inv = p.quote + '/' + p.base;
    var t = dr.pairs && (dr.pairs[label] || dr.pairs[inv]);
    if (t) return { txt: t, src: dr.pair_sources && (dr.pair_sources[label] || dr.pair_sources[inv]) };
    var ccys = [p.base, p.quote];
    for (var i = 0; i < ccys.length; i++) {
      var notes = dr.drivers && dr.drivers[ccys[i]];
      var n = notes && (notes[label] || notes[inv]);
      if (n) return { txt: n, src: dr.driver_sources && dr.driver_sources[ccys[i]] };
    }
    return null;
  }
  function renderStrength(p, d) {
    var dr = d.drivers, label = p.base + '/' + p.quote;
    var wrap = el('div', 'pdt-stack');
    var n = strengthNote(p, dr);
    if (n) {
      wrap.appendChild(el('p', 'pdt-text', n.txt));
      wrap.appendChild(sourcesLine(n.src));
    } else {
      wrap.appendChild(note('No strength-driver note for ' + label + ' today.'));
    }
    if (dr) wrap.appendChild(footer('AI Analytics', dr.generated_at));
    return wrap;
  }

  function statCell(label, value, cls, tip) {
    var c = el('div', 'pdt-stat');
    var l = el('div', 'pdt-stat-l', label);
    c.appendChild(l);
    c.appendChild(el('div', 'pdt-stat-v' + (cls ? ' ' + cls : ''), value));
    if (tip && typeof _fxTTAttach === 'function') _fxTTAttach(l, tip.title, tip.body);
    return c;
  }
  function fvNumbers(p, d) {
    var fv = d.fair && d.fair.pairs && d.fair.pairs[p.key];
    if (!fv || fv.accumulating || fv.fairValue == null || fv.z == null) return { fv: fv, ok: false };
    return { fv: fv, ok: true };
  }
  function gauge(z) {
    var clamped = Math.max(-3, Math.min(3, z));
    var g = el('div', 'pdt-gauge');
    g.setAttribute('role', 'img');
    g.setAttribute('aria-label', 'Deviation from model ' + signed(z, 2) + ' standard deviations, scale minus 3 to plus 3');
    g.appendChild(el('div', 'pdt-gauge-mid'));
    var m = el('div', 'pdt-gauge-mark');
    m.style.left = ((clamped + 3) / 6 * 100).toFixed(1) + '%';
    g.appendChild(m);
    return g;
  }
  function zClass(z) { return Math.abs(z) < 1 ? '' : (z > 0 ? 'pdt-down' : 'pdt-up'); }

  function renderFairValue(p, d) {
    var r = fvNumbers(p, d), fv = r.fv, dec = decimals(p);
    if (!fv) return block('FX FAIR VALUE \u00b7 ' + p.label, [note('No fair-value model output for this pair.')]);
    if (!r.ok) {
      return block('FX FAIR VALUE \u00b7 ' + p.label, [
        note('Model still accumulating history for this pair (' + fv.usableRows + ' usable rows).'),
        footer('Fair Value model', d.fair.generated_at)
      ]);
    }
    var grid = el('div', 'pdt-stats');
    grid.appendChild(statCell('Spot', fv.spot.toFixed(dec), '', {
      title: 'Spot',
      body: 'Current live market price for this pair.'
    }));
    grid.appendChild(statCell('Model fair value', fv.fairValue.toFixed(dec), '', {
      title: 'Model Fair Value',
      body: 'Ridge-regression BEER-model estimate of this pair\u2019s fundamental value, fit on rate, current-account and productivity differentials over a rolling ' + d.fair.rolling_window + '-day window.'
    }));
    grid.appendChild(statCell('Deviation', signed(fv.z, 2) + '\u03c3', zClass(fv.z), {
      title: 'Deviation',
      body: 'Spot vs. model fair value, in standard deviations of the fit\u2019s residuals. Descriptive, not a price forecast.'
    }));
    grid.appendChild(statCell('Rate diff', fv.rate_diff != null ? signed(fv.rate_diff, 2) : '\u2014', fv.rate_diff != null ? (fv.rate_diff >= 0 ? 'pdt-up' : 'pdt-down') : '', {
      title: 'Rate Differential',
      body: 'OIS/overnight rate differential between the pair\u2019s two legs \u2014 one of the model\u2019s regression inputs, shown standalone for reference.'
    }));
    var meta = el('p', 'pdt-text pdt-muted',
      'Fit: ' + (fv.identifiable ? 'Solid' : 'Regularized') +
      ' \u00b7 ' + fv.usableRows + ' of ' + fv.totalRows + ' rows usable' +
      ' \u00b7 rolling ' + d.fair.rolling_window + '-day window. ' +
      'Model estimate of where spot sits relative to its fundamentals; descriptive, not a price forecast.');
    return block('FX FAIR VALUE \u00b7 ' + p.label, [grid, gauge(fv.z), meta, footer('Fair Value model', d.fair.generated_at)]);
  }

  function kv(label, value, cls, tip) {
    var r = el('div', 'pdt-kv');
    var l = el('i', null, label);
    r.appendChild(l);
    r.appendChild(el('b', cls || '', value));
    if (tip && typeof _fxTTAttach === 'function') _fxTTAttach(l, tip.title, tip.body);
    return r;
  }
  function badge(text, val, cls, tip) {
    var b = el('span', 'pdt-hstat');
    b.appendChild(document.createTextNode(text));
    if (val) b.appendChild(el('b', cls || null, val));
    if (tip && typeof _fxTTAttach === 'function') _fxTTAttach(b, tip.title, tip.body);
    return b;
  }
  function clearNode(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  function cotTable(group, p) {
    var kids = Array.prototype.slice.call(group.children), blocks = [], cur = null;
    kids.forEach(function (k) {
      var t = (k.textContent || '').trim();
      if (/^COT [A-Z]{3}$/.test(t)) { cur = { ccy: t.slice(4), metrics: null, summary: null }; blocks.push(cur); return; }
      if (!cur) { if (k.classList.contains('pd-inline-metrics')) { cur = { ccy: p.base !== 'USD' ? p.base : p.quote, metrics: null, summary: null }; blocks.push(cur); } else return; }
      if (k.classList.contains('pd-inline-metrics')) cur.metrics = k; else cur.summary = k;
    });
    var wrap = el('div', 'pdt-tblwrap'), tbl = el('table', 'pdt-tbl');
    tbl.appendChild(el('caption', null, 'COT \u00b7 Leveraged Funds (LF) / Asset Managers (AM)'));
    var thead = el('thead'), hr = el('tr');
    ['CCY', 'LF net', 'LF WoW \u0394', 'AM net', 'LF % OI', 'Bias'].forEach(function (h) {
      var th = el('th', null, h); th.scope = 'col'; hr.appendChild(th);
    });
    thead.appendChild(hr); tbl.appendChild(thead);
    var tb = el('tbody');
    blocks.forEach(function (bk) {
      if (!bk.metrics) return;
      var tr = el('tr');
      tr.appendChild(el('td', null, bk.ccy));
      Array.prototype.slice.call(bk.metrics.children).forEach(function (m) {
        var td = el('td'); td.appendChild(m); tr.appendChild(td);
      });
      var tdb = el('td', 'pdt-bias');
      if (bk.summary) tdb.appendChild(bk.summary); else tdb.textContent = '\u2014';
      tr.appendChild(tdb);
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl);
    return blocks.length ? wrap : null;
  }

  function retailRows(g) {
    var lbl = g.querySelector('.pd-inline-group-lbl'), bar = g.querySelector('.pd-inline-retail-bar');
    var row = g.querySelector('.pd-inline-retail-row'), avg = g.querySelector('.pd-inline-retail-avg');
    var nums = row ? (row.textContent.match(/\d+(?=%)/g) || []) : [];
    var pairs = [];
    if (avg) {
      var l = avg.querySelectorAll('.pd-inline-lbl'), v = avg.querySelectorAll('.pd-inline-val');
      for (var i = 0; i < l.length && i < v.length; i++) {
        pairs.push([/L/.test(l[i].textContent) ? 'Avg long' : 'Avg short', v[i]]);
      }
    }
    clearNode(g);
    if (lbl) g.appendChild(lbl);
    g.appendChild(kv('Long / Short', nums.length >= 2 ? nums[0] + '% / ' + nums[1] + '%' : '\u2014'));
    if (bar) g.appendChild(bar);
    pairs.forEach(function (pr) {
      var r = el('div', 'pdt-kv');
      r.appendChild(el('i', null, pr[0]));
      r.appendChild(pr[1]);
      g.appendChild(r);
    });
  }
  function composeOverview(host) {
    var S = state.ov;
    if (!S || S.host !== host || !S.hero.isConnected) return;
    var price = host.querySelector('.pd-inline-price');
    var groups = host.querySelectorAll('.pd-inline-group');
    if (!price || groups.length < 4) return;
    var foot = host.querySelector('.pd-inline-footer');
    [S.main, S.s1, S.s2, S.s3, S.cot].forEach(clearNode);
    S.main.appendChild(price);
    S.s1.appendChild(groups[0]);
    S.s2.appendChild(groups[1]);
    var skewEl = groups[3].querySelector('.pd-inline-retail-skew');
    var skew = skewEl ? skewEl.textContent.trim() : '';
    var skewCls = skewEl && skewEl.classList.contains('pd-up') ? 'pdt-up'
      : skewEl && skewEl.classList.contains('pd-dn') ? 'pdt-down' : '';
    if (skewEl) skewEl.parentNode.removeChild(skewEl);
    retailRows(groups[3]);
    S.s3.appendChild(groups[3]);
    if (S.bRet && S.bRet.parentNode) S.bRet.parentNode.removeChild(S.bRet);
    S.bRet = skew ? badge('Retail ', skew, skewCls, {
      title: 'Retail Positioning',
      body: 'Aggregate retail trader long/short skew for this pair. Contrarian signal: retail crowds have historically tended to be positioned against the prevailing trend at extremes \u2014 colored by that contrarian read (majority/heavily long shown as bearish, majority/heavily short as bullish; Mixed stays neutral).'
    }) : null;
    if (S.bRet) S.badges.appendChild(S.bRet);
    var t = cotTable(groups[2], state.pair);
    if (t) S.cot.appendChild(t);
    S.foot.textContent = foot ? foot.textContent.trim() : '';
  }
  function runLegacy(host) {
    try {
      Promise.resolve(window.buildInlineDetail(state.sym, host))
        .then(function () { composeOverview(host); }, function () {});
    } catch (e) {  }
  }
  function refreshLegacy() {
    if (!state.open || state.tab !== 'overview' || !state.legacyEl || !state.legacyEl.isConnected) return;
    if (Date.now() - state.legacyAt < LEGACY_REFRESH_MS) return;
    state.legacyAt = Date.now();
    runLegacy(state.legacyEl);
  }

  function applyTick(pairId, price, chg, pct) {
    if (!state.open || state.tab !== 'overview' || !state.pair || state.pair.key !== pairId) return;
    if (typeof price !== 'number' || isNaN(price)) return;
    var rateEl = contentEl && contentEl.querySelector('.pdt-hero .pd-inline-rate');
    var chgEl = contentEl && contentEl.querySelector('.pdt-hero .pd-inline-chg');
    if (!rateEl && !chgEl) return;
    if (rateEl) rateEl.textContent = price.toFixed(decimals(state.pair));
    if (chgEl) {
      var dirCls = chg > 0 ? 'pd-up' : chg < 0 ? 'pd-dn' : '';
      chgEl.textContent = typeof pctStr === 'function' ? pctStr(pct) : '\u2014';
      chgEl.className = ('pd-inline-chg ' + dirCls).trim();
    }
  }
  window.giPairDetailApplyTick = applyTick;

  function fvSection(p, d) {
    var r = fvNumbers(p, d), dec = decimals(p);
    var sec = el('section', 'pdt-sec');
    sec.appendChild(el('h3', 'pdt-sh', 'FX Fair Value'));
    if (!r.ok) { sec.appendChild(note('Model output not available for this pair yet.')); return sec; }
    sec.appendChild(kv('Model', r.fv.fairValue.toFixed(dec), '', {
      title: 'Model Fair Value',
      body: 'Ridge-regression BEER-model estimate of this pair\u2019s fundamental value, fit on rate, current-account and productivity differentials over a rolling ' + d.fair.rolling_window + '-day window.'
    }));
    sec.appendChild(kv('Spot @ run', r.fv.spot.toFixed(dec), '', {
      title: 'Spot',
      body: 'Live market price for this pair at the time the model last ran.'
    }));
    sec.appendChild(kv('Deviation', signed(r.fv.z, 2) + '\u03c3', zClass(r.fv.z), {
      title: 'Deviation',
      body: 'Spot vs. model fair value, in standard deviations of the fit\u2019s residuals. Descriptive, not a price forecast.'
    }));
    sec.appendChild(kv('Fit', r.fv.identifiable ? 'Solid' : 'Regularized', '', {
      title: 'Model Fit',
      body: r.fv.identifiable
        ? 'The regression solves directly (OLS) for this pair \u2014 its regressors carry enough independent variation to identify the model without shrinkage.'
        : 'This pair\u2019s regressors are collinear enough that a plain regression can\u2019t solve uniquely, so the model falls back to ridge regularization (shrinkage across all coefficients, \u03bb selected by cross-validation). Still a valid fit, just less directly identified.'
    }));
    sec.appendChild(gauge(r.fv.z));
    var sc = el('div', 'pdt-scale');
    ['-3\u03c3', '0', '+3\u03c3'].forEach(function (t) { sc.appendChild(el('span', null, t)); });
    sec.appendChild(sc);
    return sec;
  }

  function sessionSection(p, d, S) {
    var sec = el('div', 'pdt-livesec');
    var nowS = new Date();
    var fxClosed = typeof window.isFxMarketClosedNow === 'function' && window.isFxMarketClosedNow();
    var marketClosed = fxClosed || (d.session && d.session.market_closed);
    var live = marketClosed ? null : SESSIONS.filter(function (x) { return sessionState(x, nowS) === 'live'; }).pop();
    var sc = !marketClosed && d.session && d.session.sessions;
    var head = el('h3', 'pdt-sh', marketClosed ? 'Market closed' : ('Live session' + (live ? ' \u00b7 ' + live.name : '')));
    if (live && sc) head.appendChild(el('span', 'pdt-chip pdt-chip-live', 'LIVE'));
    sec.appendChild(head);
    var t = sc && live ? sessionNote(p, d.session, live.name) : null;
    sec.appendChild(t ? el('p', 'pdt-text', t) : note(marketClosed ? 'Market closed. Resumes Sunday 21:00 UTC.' : 'No live-session note available.'));
    var f = el('div', 'pdt-foot pdt-srcs');
    S.foot = el('span');
    f.appendChild(S.foot);
    var r = fvNumbers(p, d), ft = r.ok && d.fair ? fmtUtc(d.fair.generated_at) : null;
    if (ft) f.appendChild(el('span', null, 'Fair value model run ' + ft + ' (estimate, not a forecast)'));
    var at = t && fmtUtc(d.session.generated_at);
    if (at) {
      var ai = el('span', null, 'AI Analytics ' + at);
      var age = ageHours(d.session.generated_at);
      if (age != null && age > STALE_HOURS) ai.appendChild(el('span', 'pdt-stale', ' \u00b7 data older than ' + STALE_HOURS + 'h'));
      f.appendChild(ai);
    }
    sec.appendChild(f);
    return sec;
  }

  function renderOverview(p, d) {
    var S = { host: el('div', 'pdt-src') };
    S.host.hidden = true;
    S.hero = el('div', 'pdt-hero');
    S.main = el('div', 'pdt-hero-main');
    S.badges = el('div', 'pdt-badges');
    append(S.hero, S.main, S.badges);
    S.s1 = el('section', 'pdt-sec'); S.s2 = el('section', 'pdt-sec'); S.s3 = el('section', 'pdt-sec');
    S.cot = el('div', 'pdt-cotbox');
    var r = fvNumbers(p, d);
    if (r.ok) {
      var z = r.fv.z, lbl = z >= 1 ? 'Above model ' : (z <= -1 ? 'Below model ' : 'In line with model ');
      S.badges.appendChild(badge(lbl, signed(z, 2) + '\u03c3', Math.abs(z) < 1 ? '' : (z > 0 ? 'pdt-down' : 'pdt-up'), {
        title: 'Deviation from Fair Value Model',
        body: 'Spot vs. the model\u2019s fair-value estimate, in standard deviations. Descriptive, not a price forecast \u2014 see the Fair Value tab for the full model.'
      }));
    }
    var grid = append(el('div', 'pdt-grid'), S.s1, S.s2, S.s3, fvSection(p, d));
    var right = sessionSection(p, d, S);
    var wrap = append(el('div', 'pdt-ov'), S.hero, append(el('div', 'pdt-ov-body'), grid, S.cot, right), S.host);
    S.main.appendChild(el('span', 'pdt-empty', 'Loading\u2026'));
    state.ov = S;
    state.legacyEl = S.host;
    if (typeof window.buildInlineDetail === 'function' && state.sym) {
      state.legacyAt = Date.now();
      runLegacy(S.host);
    }
    return wrap;
  }

  var RENDER = { overview: renderOverview, macro: renderMacro, session: renderSession, strength: renderStrength, fairvalue: renderFairValue };

  function panelEl(tab) { return document.getElementById('pdt-p-' + tab); }

  function renderTab(tab) {
    var host = panelEl(tab);
    if (!host) return;
    if (!state.open) return;
    host.textContent = '';
    if (!state.pair) { host.appendChild(note('Detail is available for G10 currency pairs.')); return; }
    if (!state.data) { host.appendChild(note('Loading\u2026')); return; }
    host.appendChild(RENDER[tab](state.pair, state.data));
  }

  function selectTab(tab, focus) {
    if (TABS.indexOf(tab) < 0) return;
    state.tab = tab;
    TABS.forEach(function (t) {
      var btn = document.getElementById('pdt-t-' + t), pnl = panelEl(t), on = t === tab;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
      btn.classList.toggle('on', on);
      pnl.hidden = !on;
    });
    if (focus) document.getElementById('pdt-t-' + tab).focus();
    renderTab(tab);
  }

  function setOpen(open) {
    var was = state.open;
    state.open = !!open;
    toggleBtn.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    contentEl.setAttribute('data-open', state.open ? 'true' : 'false');
    if (state.open) contentEl.removeAttribute('inert'); else contentEl.setAttribute('inert', '');
    if (state.open && !was) renderTab(state.tab);
  }

  function onRowToggle(e) {
    var sym = e.detail && e.detail.sym, p = parseSym(sym);
    if (!p) return;
    var same = state.pair && state.pair.key === p.key;
    if (same && state.open) { setOpen(false); return; }
    state.sym = sym;
    if (!same) setPair(sym, true);
    setOpen(true);
    if (root.scrollIntoView) {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function setPair(sym, force) {
    var p = parseSym(sym);
    var key = p ? p.key : null;
    if (!force && (state.pair && state.pair.key) === key && state.data) return;
    state.pair = p;
    state.sym = p ? sym : null;
    subEl.textContent = p ? p.label : '\u2014';
    var before = state.loadedAt;
    renderTab(state.tab);
    load(false).then(function () { if (state.loadedAt !== before) renderTab(state.tab); });
  }

  function currentSym() {
    var a = document.querySelector('#tv-pair-tabs .tv-tab.active');
    return a ? a.getAttribute('data-sym') : null;
  }

  function init() {
    root = document.getElementById('pdt-panel');
    toggleBtn = document.getElementById('pdt-toggle');
    contentEl = document.getElementById('pdt-content');
    tabsEl = document.getElementById('pdt-tabs');
    subEl = document.getElementById('pdt-sub');
    if (!root || !tabsEl || !subEl || !toggleBtn || !contentEl) return;

    toggleBtn.addEventListener('click', function () { setOpen(!state.open); });
    document.addEventListener('gi:pairDetailToggle', onRowToggle);

    tabsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pdt-tab]');
      if (b) selectTab(b.getAttribute('data-pdt-tab'), false);
    });
    tabsEl.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(state.tab), n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = TABS.length - 1;
      if (n == null) return;
      e.preventDefault();
      selectTab(TABS[n], true);
    });

    var chartTabs = document.getElementById('tv-pair-tabs');
    if (chartTabs && 'MutationObserver' in window) {
      new MutationObserver(function () { setPair(currentSym()); })
        .observe(chartTabs, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
    document.addEventListener('gi:quotesLoaded', function () { if (!state.pair) setPair(currentSym()); else refreshLegacy(); });

    setOpen(false);
    selectTab('overview', false);
    setPair(currentSym());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
