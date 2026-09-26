if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

(function () {
  const STORAGE_KEY = 'gi_theme';
  const THEMES = ['dark', 'mt5'];

  function apply(theme) {
    if (!THEMES.includes(theme)) theme = 'dark';
    const prev = saved;
    saved = theme;
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    THEMES.forEach(t => {
      const btn = document.getElementById('gi-theme-' + t);
      if (btn) btn.classList.toggle('active', t === theme);
    });
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
    if (prev !== theme) {
      window.dispatchEvent(new CustomEvent('gi-theme-change', { detail: { theme, prev } }));
    }
  }

  let saved = 'dark';
  try { saved = localStorage.getItem(STORAGE_KEY) || 'dark'; } catch {}
  apply(saved);

  window.GI_THEME = { set: apply, current: () => saved };
})();

const STATE = {
  rates: {},      
  prevRates: {},  
  cbRates: {},    
  cotData: {},    
};

const PAIRS = [
  { id:'eurusd', base:'EUR', quote:'USD', invert:true,  dec:5, label:'EUR/USD' },
  { id:'gbpusd', base:'GBP', quote:'USD', invert:true,  dec:5, label:'GBP/USD' },
  { id:'usdjpy', base:'JPY', quote:'USD', invert:false, dec:3, label:'USD/JPY' },
  { id:'audusd', base:'AUD', quote:'USD', invert:true,  dec:5, label:'AUD/USD' },
  { id:'usdchf', base:'CHF', quote:'USD', invert:false, dec:5, label:'USD/CHF' },
  { id:'usdcad', base:'CAD', quote:'USD', invert:false, dec:5, label:'USD/CAD' },
  { id:'nzdusd', base:'NZD', quote:'USD', invert:true,  dec:5, label:'NZD/USD' },
  { id:'usdnok', base:'NOK', quote:'USD', invert:false, dec:4, label:'USD/NOK' },
  { id:'usdsek', base:'SEK', quote:'USD', invert:false, dec:4, label:'USD/SEK' },
  { id:'eurnok', base:'EUR', quote:'NOK', cross:['EUR','NOK'], dec:4, label:'EUR/NOK' },
  { id:'eursek', base:'EUR', quote:'SEK', cross:['EUR','SEK'], dec:4, label:'EUR/SEK' },
  { id:'eurgbp', base:'EUR', quote:'GBP', cross:['EUR','GBP'], dec:5 },
  { id:'eurjpy', base:'EUR', quote:'JPY', cross:['EUR','JPY'], dec:3 },
  { id:'eurchf', base:'EUR', quote:'CHF', cross:['EUR','CHF'], dec:5 },
  { id:'eurcad', base:'EUR', quote:'CAD', cross:['EUR','CAD'], dec:5 },
  { id:'euraud', base:'EUR', quote:'AUD', cross:['EUR','AUD'], dec:5 },
  { id:'gbpjpy', base:'GBP', quote:'JPY', cross:['GBP','JPY'], dec:3 },
  { id:'gbpchf', base:'GBP', quote:'CHF', cross:['GBP','CHF'], dec:5 },
  { id:'gbpcad', base:'GBP', quote:'CAD', cross:['GBP','CAD'], dec:5 },
  { id:'audjpy', base:'AUD', quote:'JPY', cross:['AUD','JPY'], dec:3 },
  { id:'audnzd', base:'AUD', quote:'NZD', cross:['AUD','NZD'], dec:5 },
  { id:'audchf', base:'AUD', quote:'CHF', cross:['AUD','CHF'], dec:5 },
  { id:'cadjpy', base:'CAD', quote:'JPY', cross:['CAD','JPY'], dec:3 },
  { id:'chfjpy', base:'CHF', quote:'JPY', cross:['CHF','JPY'], dec:3 },
  { id:'nzdjpy', base:'NZD', quote:'JPY', cross:['NZD','JPY'], dec:3 },
  { id:'eurnzd', base:'EUR', quote:'NZD', cross:['EUR','NZD'], dec:5 },
  { id:'gbpaud', base:'GBP', quote:'AUD', cross:['GBP','AUD'], dec:5 },
  { id:'gbpnzd', base:'GBP', quote:'NZD', cross:['GBP','NZD'], dec:5 },
  { id:'audcad', base:'AUD', quote:'CAD', cross:['AUD','CAD'], dec:5 },
  { id:'cadchf', base:'CAD', quote:'CHF', cross:['CAD','CHF'], dec:5 },
  { id:'nzdcad', base:'NZD', quote:'CAD', cross:['NZD','CAD'], dec:5 },
  { id:'nzdchf', base:'NZD', quote:'CHF', cross:['NZD','CHF'], dec:5 },
];
window.PAIRS = PAIRS;

async function renderFairValue() {
  const accWrap = document.getElementById('fv-accumulating');
  const tblWrap = document.getElementById('fv-wrap');
  const tbody   = document.getElementById('fv-tbody');
  if (!accWrap || !tblWrap || !tbody) return;

  let summary = null;
  try {
    const r = await _fetchWithRetry('./fair-value-data/summary.json');
    summary = r && r.ok ? await r.json() : null;
  } catch {
    summary = null;
  }
  if (!summary || !summary.pairs) return;

  const fvSub = document.getElementById('fv-sub');
  if (fvSub) {
    let label = 'Rate differential + risk sentiment \u00b7 60 business-day rolling regression';
    if (summary.generated_at) {
      const d = new Date(summary.generated_at);
      if (!isNaN(d)) {
        const tzAbbr = d.toLocaleTimeString('en', { timeZoneName: 'short' }).split(' ').pop() || 'LT';
        label += ' \u00b7 updated ' + d.toLocaleDateString([], { day: '2-digit', month: 'short' })
                + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                + ' ' + tzAbbr;
      }
    }
    fvSub.textContent = label;
  }

  const FV_MIN_ROWS = summary.min_rows;
  const pairsData = summary.pairs;
  const maxRows = summary.max_usable_rows || 0;

  if (maxRows < FV_MIN_ROWS) {
    accWrap.style.display = '';
    tblWrap.style.display = 'none';
    const pct = Math.min(100, Math.round((maxRows / FV_MIN_ROWS) * 100));
    setEl('fv-progress-text', `${maxRows}/${FV_MIN_ROWS}d`);
    const bar = document.getElementById('fv-progress-bar');
    if (bar) bar.style.width = pct + '%';
    return;
  }

  accWrap.style.display = 'none';
  tblWrap.style.display = '';

  const zEntries = [];

  let html = '';
  PAIRS.forEach(pair => {
    const d = pairsData[pair.id];
    if (!d || !d.totalRows) return;

    const spotTxt = d.spot != null ? d.spot.toFixed(pair.dec) : '—';
    const rdTxt   = d.rate_diff != null ? (d.rate_diff >= 0 ? '+' : '') + d.rate_diff.toFixed(2) : '—';
    const rdColor = d.rate_diff == null ? 'var(--text3)' : (d.rate_diff >= 0 ? 'var(--up)' : 'var(--down)');
    const stTxt   = d.stress != null ? d.stress.toFixed(0) : '—';

    let fvTxt = '—', zTxt = '—', zColor = 'var(--text3)';
    let fitTxt = '—', fitColor = 'var(--text3)', fitTitle = '';

    if (!d.accumulating && d.fairValue != null && d.z != null) {
      fvTxt = d.fairValue.toFixed(pair.dec);
      zTxt = (d.z >= 0 ? '+' : '') + d.z.toFixed(2) + '\u03c3';
      zColor = Math.abs(d.z) < 1 ? 'var(--text3)' : (d.z > 0 ? 'var(--down)' : 'var(--up)');

      if (d.identifiable) {
        fitTxt = 'Solid'; fitColor = 'var(--up)';
        fitTitle = `This pair's own data (rate differential, risk score, Current Account, Trade Balance, productivity) fully identifies the 6-variable model on its own — no genuine collinearity. Cross-validation additionally applies \u03bb=${d.lambda} of ridge shrinkage, the same routine bias/variance treatment used for every pair given how noisy daily FX spot is relative to 6 macro regressors — this is not a data-quality flag.`;
      } else {
        fitTxt = 'Regularized'; fitColor = 'var(--down)';
        fitTitle = `This pair's slower-moving inputs (Current Account, Trade Balance, and/or productivity differential — often sparse for EUR crosses or currencies with few recent releases) don't have enough real within-window variation to identify the 6-variable model without ridge regularization (\u03bb=${d.lambda}). The fit exists and is real, but leans more on regularization and less on this specific pair's own data than a pair marked Solid — treat Fair Value/Z-score here as lower-confidence.`;
      }

      zEntries.push({
        label: pair.label || (pair.base + '/' + pair.quote),
        z: d.z,
        regularized: !d.identifiable
      });
    }

    html += `<tr>
      <td>${pair.label || (pair.base + '/' + pair.quote)}</td>
      <td>${spotTxt}</td>
      <td style="color:${rdColor};">${rdTxt}</td>
      <td>${stTxt}</td>
      <td>${fvTxt}</td>
      <td style="color:${zColor};">${zTxt}</td>
      <td style="color:${fitColor};" title="${fitTitle}">${fitTxt}</td>
      <td style="color:var(--text3);">${d.totalRows}d</td>
    </tr>`;
  });
  tbody.innerHTML = html;
  _fvRenderZScoreChart(zEntries);
  _fvRenderCsvExport();
}

async function _fvRenderCsvExport() {
  const btn = document.getElementById('fv-csv-btn');
  if (!btn) return;

  let manifest = null;
  try {
    const r = await _fetchWithRetry('./fair-value-data/backtest/manifest.json');
    manifest = r && r.ok ? await r.json() : null;
  } catch {
    manifest = null;
  }

  if (!manifest || !manifest.total_computed_rows_all_pairs) {
    btn.style.display = 'none';
    return;
  }

  const pairsWithData = Object.values(manifest.pairs || {}).filter(p => p.computedRows > 0).length;
  const totalPairs = manifest.pairs_exported || 32;
  const totalRows = manifest.total_computed_rows_all_pairs;

  btn.href = './fair-value-data/backtest/all_pairs.csv';
  btn.title = `Download point-in-time CSV (raw inputs, all ${totalPairs} pairs) for independent backtesting — ` +
    `walk-forward Fair Value/Z-score computed for ${pairsWithData}/${totalPairs} pairs so far (${totalRows} rows total, ` +
    `growing by one row per pair per weekday session) · no lookahead: each computed row used only data available up to its own date.`;
  btn.style.display = '';
}

function _fvRenderZScoreChart(entries) {
  const wrap = document.getElementById('fv-zchart-wrap');
  if (!wrap) return;
  if (!entries.length) { wrap.innerHTML = ''; return; }

  const ordered = entries.slice();

  const barW = 30, gap = 10;
  const plotH = 170;   
  const labelH = 24;   
  const chartH = plotH + labelH;
  const chartW = Math.max(560, ordered.length * (barW + gap) + gap);
  const midY = plotH / 2;
  const maxAbs = Math.max(3.0, ...ordered.map(e => Math.abs(e.z)));
  const scale = (plotH / 2 - 16) / maxAbs; 

  function refLines(sigma) {
    const yTop = midY - sigma * scale;
    const yBot = midY + sigma * scale;
    return `<line x1="0" y1="${yTop}" x2="${chartW}" y2="${yTop}" stroke="var(--text3)" stroke-width="1" stroke-dasharray="3,3" opacity="0.55"/>` +
           `<line x1="0" y1="${yBot}" x2="${chartW}" y2="${yBot}" stroke="var(--text3)" stroke-width="1" stroke-dasharray="3,3" opacity="0.55"/>` +
           `<text x="2" y="${yTop - 3}" font-size="8" fill="var(--text3)" font-family="var(--font-ui)">+${sigma.toFixed(1)}\u03c3</text>` +
           `<text x="2" y="${yBot + 9}" font-size="8" fill="var(--text3)" font-family="var(--font-ui)">-${sigma.toFixed(1)}\u03c3</text>`;
  }

  let bars = '';
  ordered.forEach((e, i) => {
    const x = gap + i * (barW + gap);
    const len = Math.max(1, Math.abs(e.z) * scale);
    const y = e.z >= 0 ? midY - len : midY;
    const color = e.z >= 0 ? 'var(--down)' : 'var(--up)';
    const opacity = e.regularized ? 0.4 : 0.9;
    const zLabel = (e.z >= 0 ? '+' : '') + e.z.toFixed(2) + '\u03c3';
    const labelY = plotH + 12;
    bars += `<g>
      <rect x="${x}" y="${y}" width="${barW}" height="${len}" fill="${color}" opacity="${opacity}"><title>${e.label}: ${zLabel}${e.regularized ? ' \u2014 Regularized fit, lower confidence' : ''}</title></rect>
      <text x="${x + barW / 2}" y="${labelY}" font-size="7" fill="var(--text2)" font-family="var(--font-mono)" text-anchor="middle">${e.label}</text>
    </g>`;
  });

  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);font-family:var(--font-ui);margin-bottom:2px;">
      <span>Overvalued</span>
      <span>FX under/overvaluation \u2014 Z-scores</span>
      <span>Undervalued</span>
    </div>
    <div style="overflow-x:auto;overflow-y:hidden;">
      <svg width="${chartW}" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}" style="display:block;">
        ${refLines(2.0)}
        ${refLines(1.5)}
        <line x1="0" y1="${midY}" x2="${chartW}" y2="${midY}" stroke="var(--border)" stroke-width="1"/>
        ${bars}
      </svg>
    </div>
    <div style="font-size:8px;color:var(--text3);font-family:var(--font-ui);margin-top:2px;">Fixed pair order (same as the table below) \u00b7 dotted lines mark \u00b11.5\u03c3 and \u00b12.0\u03c3 \u00b7 faded bars = Regularized fit (see Fit column) \u00b7 hover a bar for the exact value</div>
  `;
}

const CB_CONFIG = [
  { id:'usd', file:'USD', label:'Fed (US)' },
  { id:'eur', file:'EUR', label:'ECB (EU)' },
  { id:'gbp', file:'GBP', label:'BoE (UK)' },
  { id:'jpy', file:'JPY', label:'BoJ (JP)' },
  { id:'aud', file:'AUD', label:'RBA (AU)' },
  { id:'chf', file:'CHF', label:'SNB (CH)' },
  { id:'cad', file:'CAD', label:'BoC (CA)' },
  { id:'nzd', file:'NZD', label:'RBNZ (NZ)' },
  { id:'nok', file:'NOK', label:'NB (NO)' },
  { id:'sek', file:'SEK', label:'Riksbank (SE)' },
];

const COT_CURRENCIES = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD']; 

function _themeColor(cssVar) {
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
}
function _themeColorAlpha(cssVar, alpha) {
  const hex = _themeColor(cssVar).replace('#', '');
  if (!hex || hex.length < 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(0,2), 16);
  const g = parseInt(hex.slice(2,4), 16);
  const b = parseInt(hex.slice(4,6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function _hexAlpha(hex, alpha) {
  const h = String(hex || '').replace('#', '');
  if (!h || h.length < 6) return `rgba(144,150,160,${alpha})`;
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function fmt(val, dec) {
  if (val == null || isNaN(val)) return '—';
  return Number(val).toFixed(dec);
}
function fmtDec(val, dec = 2) { return fmt(val, dec); }

function clsDir(val) {
  if (val > 0.0001) return 'up';
  if (val < -0.0001) return 'down';
  return 'flat';
}

function pctStr(val) {
  if (val == null || isNaN(val)) return '—';
  const sign = val >= 0 ? '+' : '';
  return sign + val.toFixed(2) + '%';
}

function setEl(id, text, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (cls) el.className = cls;
}

function updateClock() {
  const now = new Date();
  const lh = now.getHours(), lm = now.getMinutes(), ls = now.getSeconds();
  const localStr = [lh,lm,ls].map(n=>String(n).padStart(2,'0')).join(':');
  const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
  setEl('clock', localStr + ' ' + tzAbbr);
  setEl('footer-clock', localStr);
  updateSessions(now.getUTCHours(), now.getUTCMinutes());
}

function isOpen(openH, closeH, h) {
  return openH < closeH ? (h >= openH && h < closeH) : (h >= openH || h < closeH);
}

const SESSION_DEFS = [
  { id:'sydney',  zone:'Australia/Sydney', openLocal:8, closeLocal:17 },
  { id:'tokyo',   zone:'Asia/Tokyo',       openLocal:9, closeLocal:18 },
  { id:'london',  zone:'Europe/London',    openLocal:8, closeLocal:17 },
  { id:'newyork', zone:'America/New_York', openLocal:8, closeLocal:17 },
];

function getUTCOffsetHours(timeZone, now) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    const m = tzPart && tzPart.value.match(/GMT([+-]\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  } catch { return 0; } 
}

function localHourToUTC(timeZone, localHour, now) {
  const offset = getUTCOffsetHours(timeZone, now);
  return ((localHour - offset) % 24 + 24) % 24;
}

function isFxMarketClosedNow() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();
  return utcDay === 6
    || (utcDay === 0 && utcHour < 21)
    || (utcDay === 5 && utcHour >= 21);
}
window.isFxMarketClosedNow = isFxMarketClosedNow;

function updateSessions(h) {
  const now = new Date();
  const sessions = SESSION_DEFS.map(s => ({
    id: s.id,
    open: localHourToUTC(s.zone, s.openLocal, now),
    close: localHourToUTC(s.zone, s.closeLocal, now),
  }));

  const isWeekend = isFxMarketClosedNow();

  let activeLabel = isWeekend ? 'MARKET CLOSED' : 'INTER-SESSION';

  function utcHourToLocal(utcHour) {
    const d = new Date();
    d.setUTCHours(utcHour, 0, 0, 0);
    return d.toLocaleTimeString('en', {hour:'2-digit', minute:'2-digit', hour12:false});
  }

  const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'Local';
  const colOpen = document.getElementById('sess-col-open');
  const colClose = document.getElementById('sess-col-close');
  if (colOpen) colOpen.textContent = 'Open (' + tzAbbr + ')';
  if (colClose) colClose.textContent = 'Close (' + tzAbbr + ')';

  sessions.forEach(s => {
    const open = !isWeekend && isOpen(s.open, s.close, h);
    const badge = document.getElementById('sess-' + s.id);
    const status = document.getElementById('status-' + s.id);
    const openEl = document.getElementById('sess-open-' + s.id);
    const closeEl = document.getElementById('sess-close-' + s.id);
    if (badge) badge.classList.toggle('active', open);
    if (status) {
      status.textContent = isWeekend ? 'Weekend' : (open ? 'Open' : 'Closed');
      status.className = open ? 'up' : 'flat';
    }
    if (openEl) openEl.textContent = utcHourToLocal(s.open);
    if (closeEl) closeEl.textContent = utcHourToLocal(s.close);
    if (open) activeLabel = s.id.toUpperCase().replace('NEWYORK','NEW YORK');
  });

  const isInterSession = !isWeekend && activeLabel === 'INTER-SESSION';
  setEl('session-label', activeLabel + ((isWeekend || isInterSession) ? '' : ' SESSION'));
  setEl('session-status', (isWeekend || isInterSession) ? activeLabel : (activeLabel + ' · ACTIVE'));
}

setInterval(updateClock, 1000);
updateClock();

async function fetchFrankfurter() {
  try {
    const res = await fetch('/fx-data/frankfurter.json');
    if (!res.ok) return;
    const data = await res.json();

    STATE.rates = (data.today && data.today.rates) ? data.today.rates : {};
    STATE.prevRates = (data.prev && data.prev.rates) ? data.prev.rates : {};

    if (Object.keys(STOOQ_RT_CACHE).length === 0) {
      populateQuoteBar();
      populateFxPairsTable();
      populateHeatmap();
      populateCrossRows();
      const updEl = document.getElementById('fx-table-updated');
      if (updEl) updEl.textContent = 'ECB · updated ' + (data.today.date || '') + ' · daily rate';
    }
  } catch(e) {
    console.warn('FX rates cache fetch failed:', e);
  }
}

function getLatestBizDate() {
  const d = new Date();
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0,10);
}

function getPrevBizDate() {
  const d = new Date();
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0,10);
}

function computeRate(pair) {
  const r = STATE.rates;
  if (!r) return null;
  if (pair.cross) {
    const [base, quote] = pair.cross;
    const baseUSD = r[base]; 
    const quoteUSD = r[quote];
    if (!baseUSD || !quoteUSD) return null;
    return (1/baseUSD) / (1/quoteUSD);
  }
  if (pair.invert) {
    return r[pair.base] ? 1 / r[pair.base] : null;
  } else {
    return r[pair.base] || null;
  }
}

function computePrevRate(pair) {
  const r = STATE.prevRates;
  if (!r || !Object.keys(r).length) return null;
  const orig = STATE.rates;
  STATE.rates = r;
  const v = computeRate(pair);
  STATE.rates = orig;
  return v;
}

function populateQuoteBar() {
  PAIRS.slice(0,8).forEach(pair => {
    const rate = computeRate(pair);
    const prev = computePrevRate(pair);
    if (rate == null) return;
    const priceEl = document.getElementById('q-' + pair.id);
    const chgEl   = document.getElementById('qc-' + pair.id);
    if (!priceEl || !chgEl) return;
    priceEl.textContent = fmt(rate, pair.dec);
    if (prev && prev > 0) {
      const pct = (rate - prev) / prev * 100;
      chgEl.textContent  = pctStr(pct);
      const cls = clsDir(pct);
      priceEl.className  = 'q-price ' + cls;
      chgEl.className    = 'q-chg '  + cls;
    } else {
      chgEl.textContent = '+0.00%';
      priceEl.className = 'q-price flat';
      chgEl.className   = 'q-chg flat';
    }
  });

  const egPair = PAIRS.find(p=>p.id==='eurgbp');
  const eg     = computeRate(egPair);
  const egPrev = computePrevRate(egPair);
  const egEl   = document.getElementById('q-eurgbp');
  const egcEl  = document.getElementById('qc-eurgbp');
  if (eg && egEl) {
    egEl.textContent = fmt(eg, 5);
    if (egPrev && egPrev > 0) {
      const pct = (eg - egPrev) / egPrev * 100;
      const cls = clsDir(pct);
      egEl.className  = 'q-price ' + cls;
      if (egcEl) { egcEl.textContent = pctStr(pct); egcEl.className = 'q-chg ' + cls; }
    }
  }
}

function populateCrossRows() {
  const crossIds = ['eurgbp','eurjpy','eurchf','eurcad','euraud','gbpjpy','gbpchf','gbpcad','audjpy','audnzd','audchf','cadjpy','chfjpy','nzdjpy','eurnzd','gbpaud','gbpnzd','audcad','cadchf','nzdcad','nzdchf','eurnok','eursek'];
  crossIds.forEach(id => {
    const pair = PAIRS.find(p=>p.id===id);
    if (!pair) return;
    const rate = computeRate(pair);
    const prev = computePrevRate(pair);
    const priceEl = document.getElementById('sb-' + id);
    const chgEl   = document.getElementById('sbc-' + id);
    if (priceEl && rate != null) {
      priceEl.textContent = fmt(rate, pair.dec);
      if (prev && prev > 0) {
        const pct = (rate - prev) / prev * 100;
        const cls = clsDir(pct);
        priceEl.className = 'sb-price ' + cls;
        if (chgEl) { chgEl.textContent = pctStr(pct); chgEl.className = 'sb-chg ' + cls; }
      } else {
        priceEl.className = 'sb-price flat';
        if (chgEl) { chgEl.textContent = '+0.00%'; chgEl.className = 'sb-chg flat'; }
      }
    }
  });
}

const ECN_FLOOR_SPREADS = {
  eurusd:0.1, gbpusd:0.2, usdjpy:0.1, audusd:0.2,
  usdchf:0.2, usdcad:0.2, nzdusd:0.3, eurgbp:0.5,
  eurjpy:0.5, eurchf:1.0, eurcad:0.8, euraud:1.0,
  gbpjpy:1.2, gbpchf:1.2, gbpcad:1.5,
  audjpy:0.8, audnzd:1.5, audchf:1.5,
  cadjpy:1.0, chfjpy:1.5, nzdjpy:1.8,
  usdnok:2.0, usdsek:2.0,
  eurnok:3.5, eursek:3.5, eurnzd:1.8, gbpaud:2.2, gbpnzd:3.0,
  audcad:1.2, cadchf:1.5, nzdcad:2.0, nzdchf:2.0,
};
const LIVE_SPREADS = {};
const TYPICAL_SPREADS = new Proxy({}, {
  get(_, pair) {
    return LIVE_SPREADS[pair] ?? ECN_FLOOR_SPREADS[pair] ?? 0.5;
  }
});
const FX_PERF_CACHE = {};

let _corrWindow = 60;  
let _corrDataCache = []; 
window._corrDataCache = _corrDataCache; 

function setCorrWindow(w) {
  if (w === _corrWindow) return;
  _corrWindow = w;
  [30, 60, 90].forEach(n => {
    const btn = document.getElementById('corr-btn-' + n);
    if (!btn) return;
    btn.style.color = n === w ? '#fff' : 'var(--text3)';
  });
  const th = document.getElementById('corr-th-window');
  if (th) th.textContent = w + 'd';
  populateCorrelations();
  if (window._corrActiveView === 'matrix') renderCorrMatrix();
}

async function populateCorrelations() {
  try {
    _corrDataCache.length = 0; 
    const data = await loadIntradayQuotes();
    const tbody = document.getElementById('correlations-tbody');
    if (!tbody) return;
    const corrs = data?.correlations;
    if (!Array.isArray(corrs) || corrs.length === 0) return;

    tbody.innerHTML = corrs.map(c => {
      let v;
      if (_corrWindow === 30)      v = c.corr30 ?? c.corr ?? null;
      else if (_corrWindow === 90) v = c.corr90 ?? c.corr ?? null;
      else                         v = c.corr ?? null;

      const corrCell = v == null
        ? `<td style="color:var(--text3)">—</td>`
        : (() => {
            const sign = v >= 0 ? '+' : '';
            const cls = v >= 0.3 ? 'up' : v <= -0.3 ? 'down' : '';
            return `<td class="${cls}">${sign}${v.toFixed(2)}</td>`;
          })();

      const z = c.z_score;
      let normCell;
      if (z == null || c.norm == null) {
        normCell = `<td style="color:var(--text3)">—</td>`;
      } else {
        const absZ = Math.abs(z);
        const normSign = c.norm >= 0 ? '+' : '';
        let badgeCls, badgeLabel;
        if (absZ >= 2.5)      { badgeCls = 'down'; badgeLabel = '● break'; }
        else if (absZ >= 1.5) { badgeCls = 'warn'; badgeLabel = '~ stretched'; }
        else                  { badgeCls = 'flat'; badgeLabel = '● normal'; }
        const title = `Norm (252d): ${normSign}${c.norm.toFixed(2)} · Z-score: ${z >= 0 ? '+' : ''}${z.toFixed(2)}σ`;
        normCell = `<td class="${badgeCls}" title="${title}" style="font-size:9px;white-space:nowrap;">${badgeLabel}</td>`;
      }

      const corrIdx = _corrDataCache.length;
      _corrDataCache.push(c);
      return `<tr
        style="cursor:pointer;"
        title="Click to view correlation detail · ${c.a} vs ${c.b}"
        onclick="(function(el){ var idx=+el.dataset.corrIdx; var d=window._corrDataCache&&window._corrDataCache[idx]; if(d&&typeof window.openCorrModal==='function') window.openCorrModal(d); })(this)"
        data-corr-idx="${corrIdx}"
      ><td>${c.a}</td><td>${c.b}</td>${corrCell}${normCell}</tr>`;
    }).join('');
  } catch (e) {
    console.warn('[Correlations] Failed to load:', e);
  }
}

const CORR_MTX_CCYS = ['USD','EUR','JPY','GBP','AUD','CAD','CHF','SEK','NOK','NZD'];
const CORR_MTX_PAIRS = [
  ['eurusd','EUR','USD'], ['gbpusd','GBP','USD'], ['usdjpy','USD','JPY'], ['audusd','AUD','USD'],
  ['usdcad','USD','CAD'], ['usdchf','USD','CHF'], ['nzdusd','NZD','USD'], ['usdnok','USD','NOK'],
  ['usdsek','USD','SEK'], ['eurgbp','EUR','GBP'], ['eurjpy','EUR','JPY'], ['euraud','EUR','AUD'],
  ['eurcad','EUR','CAD'], ['eurchf','EUR','CHF'], ['eurnzd','EUR','NZD'], ['eurnok','EUR','NOK'],
  ['eursek','EUR','SEK'], ['gbpjpy','GBP','JPY'], ['gbpaud','GBP','AUD'], ['gbpcad','GBP','CAD'],
  ['gbpchf','GBP','CHF'], ['gbpnzd','GBP','NZD'], ['audjpy','AUD','JPY'], ['audcad','AUD','CAD'],
  ['audchf','AUD','CHF'], ['audnzd','AUD','NZD'], ['cadchf','CAD','CHF'], ['cadjpy','CAD','JPY'],
  ['chfjpy','CHF','JPY'], ['nzdcad','NZD','CAD'], ['nzdchf','NZD','CHF'], ['nzdjpy','NZD','JPY']
];

let _corrMtxPairCloses = null; 
let _corrMtxLoadPromise = null;

async function _fetchWithRetry(url, attempts = 3, delayMs = 400) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      lastErr = new Error('HTTP ' + r.status);
    } catch (e) {
      lastErr = e;
    }
    if (i < attempts - 1) await new Promise(res => setTimeout(res, delayMs * (i + 1)));
  }
  throw lastErr;
}

async function _corrMtxLoadPairData() {
  if (_corrMtxPairCloses) return _corrMtxPairCloses;
  if (_corrMtxLoadPromise) return _corrMtxLoadPromise;
  _corrMtxLoadPromise = (async () => {
    const out = {};
    await Promise.all(CORR_MTX_PAIRS.map(async ([id]) => {
      try {
        const r = await _fetchWithRetry('./ohlc-data/' + id + '.json');
        const bars = await r.json();
        if (Array.isArray(bars) && bars.length > 1) {
          const byDate = {};
          bars.forEach(b => { if (typeof b.close === 'number' && b.time) byDate[b.time] = b.close; });
          out[id] = byDate;
        }
      } catch (e) {  }
    }));
    _corrMtxPairCloses = out;
    return out;
  })();
  return _corrMtxLoadPromise;
}

function _pearsonCorr(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;
  a = a.slice(-n); b = b.slice(-n);
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const xa = a[i] - ma, xb = b[i] - mb; num += xa * xb; da += xa * xa; db += xb * xb; }
  if (da === 0 || db === 0) return null;
  return num / Math.sqrt(da * db);
}

function _logReturnsByDate(closesByDate) {
  if (!closesByDate) return null;
  const dates = _sortDateKeys(Object.keys(closesByDate));
  if (dates.length < 2) return null;
  const rets = {};
  for (let i = 1; i < dates.length; i++) {
    const prev = closesByDate[dates[i - 1]], cur = closesByDate[dates[i]];
    rets[dates[i]] = Math.log(cur / prev);
  }
  return rets;
}

function _sortDateKeys(keys) {
  return keys.sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function _pearsonCorrByDate(retsA, retsB, maxN) {
  if (!retsA || !retsB) return null;
  const shared = _sortDateKeys(Object.keys(retsA).filter(d => Object.prototype.hasOwnProperty.call(retsB, d)));
  if (shared.length < 5) return null;
  const window_ = maxN ? shared.slice(-maxN) : shared;
  if (window_.length < 5) return null;
  const a = window_.map(d => retsA[d]), b = window_.map(d => retsB[d]);
  return _pearsonCorr(a, b);
}

function _corrMtxBuildCcyReturns(pairCloses, windowDays) {
  const ccyRetsByDate = {}; 
  CORR_MTX_CCYS.forEach(c => ccyRetsByDate[c] = {});
  CORR_MTX_PAIRS.forEach(([id, base, quote]) => {
    const retsByDate = _logReturnsByDate(pairCloses[id]);
    if (!retsByDate) return;
    Object.keys(retsByDate).forEach(date => {
      const r = retsByDate[date];
      (ccyRetsByDate[base][date] || (ccyRetsByDate[base][date] = [])).push(r);
      (ccyRetsByDate[quote][date] || (ccyRetsByDate[quote][date] = [])).push(-r);
    });
  });
  const composite = {};
  CORR_MTX_CCYS.forEach(c => {
    const byDate = ccyRetsByDate[c];
    const dates = Object.keys(byDate);
    if (dates.length < windowDays + 1) { composite[c] = null; return; }
    const avg = {};
    dates.forEach(d => { const arr = byDate[d]; avg[d] = arr.reduce((s, x) => s + x, 0) / arr.length; });
    composite[c] = avg;
  });
  return composite;
}

function _corrMtxCellStyle(v) {
  if (v == null) return { bg: 'var(--bg2)', color: 'var(--text3)', txt: '—' };
  const a = Math.min(Math.abs(v), 1);
  const txt = (v * 100).toFixed(0);
  if (v >= 0) return { bg: `rgba(38,166,154,${(a * 0.35).toFixed(2)})`, color: 'var(--up)', txt };
  return { bg: `rgba(239,83,80,${(a * 0.35).toFixed(2)})`, color: 'var(--down)', txt };
}

async function renderCorrMatrix() {
  const table = document.getElementById('corr-matrix-table');
  if (!table) return;
  table.innerHTML = '<tr><td style="color:var(--text3);font-size:9px;padding:6px 2px;">Loading…</td></tr>';
  const pairCloses = await _corrMtxLoadPairData();
  const composite = _corrMtxBuildCcyReturns(pairCloses, _corrWindow);

  let html = '<tr><td style="background:var(--bg2);border:1px solid var(--border);"></td>' + CORR_MTX_CCYS.map(c =>
    `<th scope="col" style="font-size:8.5px;font-family:var(--font-mono);color:var(--text3);font-weight:400;text-align:center;padding:0 0 3px;background:var(--bg2);border:1px solid var(--border);">${c}</th>`
  ).join('') + '</tr>';

  CORR_MTX_CCYS.forEach(rowCcy => {
    html += `<tr><th scope="row" style="font-size:8.5px;font-family:var(--font-mono);color:var(--text3);font-weight:600;text-align:left;padding:0 4px 0 0;background:var(--bg2);border:1px solid var(--border);">${rowCcy}</th>`;
    CORR_MTX_CCYS.forEach(colCcy => {
      if (rowCcy === colCcy) {
        html += `<td style="height:20px;text-align:center;border:1px solid var(--border);background:var(--bg2);color:var(--text3);font-size:8.5px;font-family:var(--font-mono);">—</td>`;
        return;
      }
      const a = composite[rowCcy], b = composite[colCcy];
      const v = (a && b) ? _pearsonCorrByDate(a, b, _corrWindow) : null;
      const s = _corrMtxCellStyle(v);
      html += `<td title="${rowCcy}/${colCcy} · ${_corrWindow}d Pearson${v == null ? ' (insufficient data)' : ': ' + (v >= 0 ? '+' : '') + v.toFixed(2)}" style="height:20px;text-align:center;border:1px solid var(--border);background:${s.bg};color:${s.color};font-size:8.5px;font-family:var(--font-mono);">${s.txt}</td>`;
    });
    html += '</tr>';
  });
  table.innerHTML = html;
}

function _corrMtxWireHover() {
  const table = document.getElementById('corr-matrix-table');
  if (!table || table.dataset.hoverWired) return;
  table.dataset.hoverWired = '1';
  const applyHl = (td, on) => {
    if (!td || td.tagName !== 'TD') return;
    const tr = td.parentElement;
    if (!tr || tr.rowIndex === 0) return; 
    const rowTh = tr.cells[0];
    const colTh = table.rows[0]?.cells[td.cellIndex];
    [rowTh, colTh].forEach(th => {
      if (!th || th.tagName !== 'TH') return;
      if (on) {
        if (th.dataset._hlBg === undefined) { th.dataset._hlBg = th.style.background; th.dataset._hlFg = th.style.color; }
        th.style.background = 'var(--bg3)';
        th.style.color = '#fff';
      } else if (th.dataset._hlBg !== undefined) {
        th.style.background = th.dataset._hlBg;
        th.style.color = th.dataset._hlFg;
      }
    });
  };
  table.addEventListener('mouseover', e => applyHl(e.target.closest('td'), true));
  table.addEventListener('mouseout', e => applyHl(e.target.closest('td'), false));
}

function initCorrAssetTabs() {
  const tabBar = document.getElementById('corr-asset-tabs');
  if (!tabBar) return;
  window._corrActiveView = 'cross';
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.corr-view-tab');
    if (!btn) return;
    const view = btn.dataset.view;
    if (view === window._corrActiveView) return;
    window._corrActiveView = view;

    tabBar.querySelectorAll('.corr-view-tab').forEach(b => {
      const isActive = b === btn;
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.style.color = isActive ? '#fff' : 'var(--text3)';
      b.classList.toggle('active', isActive);
    });

    const crossWrap = document.getElementById('corr-cross-wrap');
    const matrixWrap = document.getElementById('corr-matrix-wrap');
    if (view === 'matrix') {
      if (crossWrap) crossWrap.style.display = 'none';
      if (matrixWrap) matrixWrap.style.display = '';
      renderCorrMatrix();
    } else {
      if (crossWrap) crossWrap.style.display = '';
      if (matrixWrap) matrixWrap.style.display = 'none';
    }
  });
}

const CORR_PAIRS_TF_CONFIG = {
  daily: { dir: '',   bars: 60   },
  '4h':  { dir: 'h4/', bars: 360  },
  '1h':  { dir: 'h1/', bars: 1440 },
};

let _corrPairsActiveTf = 'daily';
const _corrPairsCloseCache = {}; 

async function _corrPairsLoadCloses(tf) {
  if (_corrPairsCloseCache[tf] && !(_corrPairsCloseCache[tf] instanceof Promise)) {
    return _corrPairsCloseCache[tf];
  }
  if (_corrPairsCloseCache[tf] instanceof Promise) return _corrPairsCloseCache[tf];

  const dir = CORR_PAIRS_TF_CONFIG[tf].dir;
  const promise = (async () => {
    const out = {};
    await Promise.all(CORR_MTX_PAIRS.map(async ([id]) => {
      try {
        const r = await _fetchWithRetry('./ohlc-data/' + dir + id + '.json');
        const bars = await r.json();
        if (Array.isArray(bars) && bars.length > 1) {
          const byDate = {};
          bars.forEach(b => { if (typeof b.close === 'number' && b.time) byDate[b.time] = b.close; });
          out[id] = byDate;
        }
      } catch (e) {  }
    }));
    _corrPairsCloseCache[tf] = out;
    return out;
  })();
  _corrPairsCloseCache[tf] = promise;
  return promise;
}

function _pairsCorrMap(ids, retsById, maxN) {
  const map = {};
  ids.forEach(id => { map[id] = {}; });
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const v = _pearsonCorrByDate(retsById[ids[i]], retsById[ids[j]], maxN);
      map[ids[i]][ids[j]] = v;
      map[ids[j]][ids[i]] = v;
    }
  }
  return map;
}

function _pairsClusterOrder(ids, corrMap) {
  const n = ids.length;
  if (n <= 2) return ids.slice();
  const M = ids.map(r => ids.map(c => (r === c) ? 0 : (corrMap[r][c] ?? 0)));
  let v = new Array(n).fill(1 / Math.sqrt(n));
  for (let iter = 0; iter < 40; iter++) {
    const w = M.map(row => row.reduce((s, val, j) => s + val * v[j], 0));
    const norm = Math.sqrt(w.reduce((s, x) => s + x * x, 0)) || 1;
    v = w.map(x => x / norm);
  }
  return ids.map((id, i) => [id, v[i]]).sort((a, b) => a[1] - b[1]).map(p => p[0]);
}

async function renderCorrPairsMatrix(tf) {
  const inner = document.getElementById('corr-mtx-fullscreen-inner');
  if (!inner) return;
  inner.innerHTML = '<div style="color:var(--text3);font-size:11px;padding:8px 2px;">Loading…</div>';

  const closes = await _corrPairsLoadCloses(tf);
  const cfg = CORR_PAIRS_TF_CONFIG[tf];
  const rets = {};
  CORR_MTX_PAIRS.forEach(([id]) => {
    rets[id] = _logReturnsByDate(closes[id]);
  });

  const ids = CORR_MTX_PAIRS.map(([id]) => id);
  const lblById = {};
  CORR_MTX_PAIRS.forEach(([id, base, quote]) => { lblById[id] = base + quote; });
  const corrMap = _pairsCorrMap(ids, rets, cfg.bars);
  const orderedIds = _pairsClusterOrder(ids, corrMap);

  let bond2yByCcy = null, diffTagById = {};
  if (tf === 'daily') {
    bond2yByCcy = await _load2YDiffFactorSeries();
    CORR_MTX_PAIRS.forEach(([id, base, quote]) => {
      diffTagById[id] = _pairs2YDiffTag(base, quote, rets[id], bond2yByCcy);
    });
  }
  const diffTitle = id => {
    if (tf !== 'daily') return '';
    const t = diffTagById[id];
    if (!t || t.r == null) return ' · 2Y Diff factor: accumulating history (' + (t ? t.n : 0) + '/6 sessions min)';
    return ' · 2Y Diff factor: r=' + (t.r >= 0 ? '+' : '') + t.r.toFixed(2) + ' (n=' + t.n + ')';
  };

  let html = '<div id="corr-pairs-fs-wrap"><table id="corr-pairs-fs-table" aria-label="Pair correlation matrix, clustered by correlation"><thead><tr><th></th>' +
    orderedIds.map(id => `<th scope="col" title="${lblById[id]}${diffTitle(id)}">${lblById[id]}</th>`).join('') + '</tr></thead><tbody>';

  orderedIds.forEach(rowId => {
    html += `<tr><th scope="row" title="${lblById[rowId]}${diffTitle(rowId)}">${lblById[rowId]}</th>`;
    orderedIds.forEach(colId => {
      if (rowId === colId) {
        html += `<td style="background:var(--bg2);color:var(--text3);">—</td>`;
        return;
      }
      const v = corrMap[rowId][colId];
      const s = _corrMtxCellStyle(v);
      html += `<td title="${lblById[rowId]}/${lblById[colId]}${v == null ? ' (insufficient data)' : ': ' + (v >= 0 ? '+' : '') + v.toFixed(2)}" style="background:${s.bg};color:${s.color};">${s.txt}</td>`;
    });
    html += '</tr>';
  });
  const diffFootnote = tf === 'daily'
    ? ' · row/column headers carry a 2Y Diff factor tag (own FX return vs. change in that pair\'s 2Y yield spread, sourced from bond2y-data/, accumulated daily since 2026-09) — hover a header to see it; still accumulating history for most pairs'
    : ' · 2Y Diff factor not shown on this tab (bond2y-data/ is daily-only, not blended into 4h/1h)';
  html += '</tbody></table>' +
    `<div style="padding:8px 0 0;font-size:9px;color:var(--text3);">Pairwise Pearson · log-returns, last ${cfg.bars} ${tf === 'daily' ? 'daily closes' : tf + ' bars'} · rows/columns ordered by spectral seriation — pairs sorted by their loading on the correlation matrix's leading eigenvector, so the most strongly correlated pairs (positive or negative) cluster at the two edges and weakly-correlated pairs sit in the middle — not alphabetical${diffFootnote}</div></div>`;

  inner.innerHTML = html;
}

let _bond2yByCcyPromise = null;
async function _load2YDiffFactorSeries() {
  if (_bond2yByCcyPromise) return _bond2yByCcyPromise;
  _bond2yByCcyPromise = (async () => {
    const out = {};
    await Promise.all(CORR_MTX_CCYS.map(async ccy => {
      try {
        const r = await fetch('./bond2y-data/' + ccy + '.json', { cache: 'no-store' });
        const hist = r.ok ? await r.json() : null;
        if (Array.isArray(hist) && hist.length) {
          const byDate = {};
          hist.forEach(row => { if (row && row.date != null && typeof row.value === 'number') byDate[row.date] = row.value; });
          out[ccy] = byDate;
        }
      } catch (e) {  }
    }));
    return out;
  })();
  return _bond2yByCcyPromise;
}

function _diffByDate(seriesByDate) {
  if (!seriesByDate) return null;
  const dates = _sortDateKeys(Object.keys(seriesByDate));
  if (dates.length < 2) return null;
  const out = {};
  for (let i = 1; i < dates.length; i++) {
    out[dates[i]] = seriesByDate[dates[i]] - seriesByDate[dates[i - 1]];
  }
  return out;
}

function _pairs2YDiffTag(base, quote, fxRetsByDate, bond2yByCcy) {
  const baseHist = bond2yByCcy[base], quoteHist = bond2yByCcy[quote];
  if (!baseHist || !quoteHist || !fxRetsByDate) return { r: null, n: 0 };
  const sharedDates = _sortDateKeys(Object.keys(baseHist).filter(d => Object.prototype.hasOwnProperty.call(quoteHist, d)));
  if (sharedDates.length < 2) return { r: null, n: 0 };
  const spreadByDate = {};
  sharedDates.forEach(d => { spreadByDate[d] = baseHist[d] - quoteHist[d]; });
  const spreadChangeByDate = _diffByDate(spreadByDate);
  if (!spreadChangeByDate) return { r: null, n: 0 };
  const jointDates = _sortDateKeys(Object.keys(fxRetsByDate).filter(d => Object.prototype.hasOwnProperty.call(spreadChangeByDate, d)));
  const MIN_OBS = 6; 
  if (jointDates.length < MIN_OBS) return { r: null, n: jointDates.length };
  const a = jointDates.map(d => fxRetsByDate[d]), b = jointDates.map(d => spreadChangeByDate[d]);
  return { r: _pearsonCorr(a, b), n: jointDates.length };
}

function _corrPairsWireHover() {
  const inner = document.getElementById('corr-mtx-fullscreen-inner');
  if (!inner || inner.dataset.hoverWired) return;
  inner.dataset.hoverWired = '1';
  const applyHl = (td, on) => {
    if (!td || td.tagName !== 'TD') return;
    const table = td.closest('#corr-pairs-fs-table');
    if (!table) return;
    const tr = td.parentElement;
    if (!tr || tr.rowIndex === 0) return;
    const rowTh = tr.cells[0];
    const colTh = table.rows[0]?.cells[td.cellIndex];
    [rowTh, colTh].forEach(th => {
      if (th && th.tagName === 'TH') th.classList.toggle('corr-hl', on);
    });
  };
  inner.addEventListener('mouseover', e => applyHl(e.target.closest('td'), true));
  inner.addEventListener('mouseout', e => applyHl(e.target.closest('td'), false));
}

function _corrPairsSetTf(tf) {
  if (tf === _corrPairsActiveTf) return;
  _corrPairsActiveTf = tf;
  ['daily', '4h', '1h'].forEach(t => {
    const btn = document.getElementById('corr-pairs-tf-' + t);
    if (!btn) return;
    const active = t === tf;
    btn.classList.toggle('intel-fs-tab-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  renderCorrPairsMatrix(tf);
}

let _giFocusTrapEls = null;
let _giFocusTrapHandler = null;
let _giFocusTrapReturnEl = null;

function _giOpenFocusTrap(overlay) {
  if (!overlay) return;
  _giFocusTrapReturnEl = document.activeElement;
  const sel = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  _giFocusTrapEls = Array.prototype.slice.call(overlay.querySelectorAll(sel))
    .filter(el => el.offsetParent !== null);
  if (_giFocusTrapEls.length) _giFocusTrapEls[0].focus();
  else overlay.setAttribute('tabindex', '-1'), overlay.focus();
  _giFocusTrapHandler = function (e) {
    if (e.key !== 'Tab' || !_giFocusTrapEls || !_giFocusTrapEls.length) return;
    const first = _giFocusTrapEls[0];
    const last = _giFocusTrapEls[_giFocusTrapEls.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', _giFocusTrapHandler, true);
}

function _giCloseFocusTrap() {
  if (_giFocusTrapHandler) document.removeEventListener('keydown', _giFocusTrapHandler, true);
  _giFocusTrapHandler = null;
  _giFocusTrapEls = null;
  if (_giFocusTrapReturnEl && typeof _giFocusTrapReturnEl.focus === 'function') {
    _giFocusTrapReturnEl.focus();
  }
  _giFocusTrapReturnEl = null;
}

function openCorrMtxFullscreen() {
  const overlay = document.getElementById('corr-mtx-fullscreen-overlay');
  if (!overlay) return;
  if (overlay.classList.contains('corr-mtx-fs-active')) return;

  overlay.classList.add('corr-mtx-fs-active');
  document.body.style.overflow = 'hidden';
  renderCorrPairsMatrix(_corrPairsActiveTf);
  _giOpenFocusTrap(overlay);
}

function closeCorrMtxFullscreen() {
  const overlay = document.getElementById('corr-mtx-fullscreen-overlay');
  if (!overlay || !overlay.classList.contains('corr-mtx-fs-active')) return;

  overlay.classList.remove('corr-mtx-fs-active');
  document.body.style.overflow = '';
  _giCloseFocusTrap();
}

function _corrMtxFsWireUp() {
  _corrPairsWireHover();
  document.getElementById('corr-mtx-fs-btn')?.addEventListener('click', openCorrMtxFullscreen);
  document.getElementById('corr-mtx-fs-close')?.addEventListener('click', closeCorrMtxFullscreen);
  ['daily', '4h', '1h'].forEach(t => {
    document.getElementById('corr-pairs-tf-' + t)?.addEventListener('click', () => _corrPairsSetTf(t));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('corr-mtx-fullscreen-overlay')?.classList.contains('corr-mtx-fs-active')) {
      closeCorrMtxFullscreen();
    }
  });
}

async function loadFxPerfData() {
}

function populateFxPairsTable() {
  const tbody = document.getElementById('fx-pairs-tbody');
  if (!tbody) return;
  const _d = new Date().getUTCDay(), _h = new Date().getUTCHours();
  const isWeekend = _d === 6 || (_d === 0 && _h < 21) || (_d === 5 && _h >= 21);

  const rows = PAIRS.filter(p=>!p.cross).map(pair => {
    const rate = computeRate(pair);
    const prev = computePrevRate(pair);

    let chg1d = '—', cls1d = 'flat';
    const rtD1 = STOOQ_RT_CACHE[pair.id];
    if (rtD1?.pct != null) {
      chg1d = pctStr(rtD1.pct);
      cls1d = clsDir(rtD1.pct);
    } else if (rate != null && prev && prev > 0) {
      const pct = (rate - prev) / prev * 100;
      chg1d = pctStr(pct);
      cls1d = clsDir(pct);
    }

    let chg1w = '—', cls1w = 'flat';
    const rtD1w = STOOQ_RT_CACHE[pair.id];
    if (rtD1w?.pct1w != null) {
      chg1w = pctStr(rtD1w.pct1w);
      cls1w = clsDir(rtD1w.pct1w);
    }

    const pipVal = pair.dec === 3 ? 0.01 : 0.0001;
    const spreadPips = TYPICAL_SPREADS[pair.id] || 0.5;
    const halfSpread = spreadPips * pipVal / 2;
    const bid = rate != null ? fmt(rate - halfSpread, pair.dec) : '—';
    const ask = rate != null ? fmt(rate + halfSpread, pair.dec) : '—';
    const spreadStr = rate != null ? spreadPips.toFixed(1) : '—';

    const rtDhv = STOOQ_RT_CACHE[pair.id];
    const hv30val = rtDhv?.hv30 ?? null;
    const ivStr = hv30val != null ? hv30val.toFixed(1) + '%' : '—';

    const rtD = STOOQ_RT_CACHE[pair.id];
    const sessH = (rtD?.session_high != null) ? fmt(rtD.session_high, pair.dec) : (rtD?.high != null) ? fmt(rtD.high, pair.dec) : '—';
    const sessL = (rtD?.session_low  != null) ? fmt(rtD.session_low,  pair.dec) : (rtD?.low  != null) ? fmt(rtD.low,  pair.dec) : '—';
    const sessStyle = isWeekend ? 'color:var(--text3);font-size:10px' : 'color:var(--text1);font-size:10px';

    const rateFmt = rate != null ? fmt(rate, pair.dec) : '—';

    const tvSym = pair.invert
      ? `FX_IDC:${pair.base}${pair.quote}`
      : `FX_IDC:${pair.quote}${pair.base}`;
    return `<tr data-sym="${tvSym}" style="cursor:pointer;" title="Click: chart + expand detail · Click again: collapse">
      <td class="sym" style="font-weight:600">${pair.label || (pair.base+'/'+pair.quote)}</td>
      <td style="color:var(--text1)">${bid}</td>
      <td style="color:var(--text1)">${ask}</td>
      <td style="color:var(--text3);font-size:10px">${spreadStr}</td>
      <td class="${cls1d}">${chg1d}</td>
      <td class="${cls1w}">${chg1w}</td>
      <td style="color:var(--text2);font-size:10px">${ivStr}</td>
      <td style="color:var(--text3);font-size:10px">—</td>
      <td style="color:var(--text3);font-size:10px">—</td>
      <td style="color:var(--text3);font-size:10px">—</td>
      <td style="${sessStyle}">${sessH}</td>
      <td style="${sessStyle}">${sessL}</td>
    </tr>`;
  });
  tbody.innerHTML = rows.join('');
  const upd = document.getElementById('fx-table-updated');
  if (upd) {
    const now = new Date();
    const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
    upd.textContent = 'ECB · ' + now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}) + ' ' + tzAbbr + (isWeekend ? ' · Last close: Fri' : '');
  }
}

let _hmThrottleTimer = null;
const _HM_THROTTLE_MS = 800;

function populateHeatmap() {
  const ccys = ['EUR','GBP','JPY','AUD','CHF','CAD','NZD','USD','NOK','SEK'];

  const pairDefs = [
      { id: 'eurusd', base: 'EUR', quote: 'USD', sign: 1 },
      { id: 'gbpusd', base: 'GBP', quote: 'USD', sign: 1 },
      { id: 'audusd', base: 'AUD', quote: 'USD', sign: 1 },
      { id: 'nzdusd', base: 'NZD', quote: 'USD', sign: 1 },
      { id: 'usdjpy', base: 'USD', quote: 'JPY', sign: 1 },
      { id: 'usdchf', base: 'USD', quote: 'CHF', sign: 1 },
      { id: 'usdcad', base: 'USD', quote: 'CAD', sign: 1 },
      { id: 'eurgbp', base: 'EUR', quote: 'GBP', sign: 1 },
      { id: 'eurjpy', base: 'EUR', quote: 'JPY', sign: 1 },
      { id: 'eurchf', base: 'EUR', quote: 'CHF', sign: 1 },
      { id: 'eurcad', base: 'EUR', quote: 'CAD', sign: 1 },
      { id: 'euraud', base: 'EUR', quote: 'AUD', sign: 1 },
      { id: 'eurnzd', base: 'EUR', quote: 'NZD', sign: 1 },
      { id: 'gbpjpy', base: 'GBP', quote: 'JPY', sign: 1 },
      { id: 'gbpchf', base: 'GBP', quote: 'CHF', sign: 1 },
      { id: 'gbpcad', base: 'GBP', quote: 'CAD', sign: 1 },
      { id: 'gbpaud', base: 'GBP', quote: 'AUD', sign: 1 },
      { id: 'gbpnzd', base: 'GBP', quote: 'NZD', sign: 1 },
      { id: 'audjpy', base: 'AUD', quote: 'JPY', sign: 1 },
      { id: 'audchf', base: 'AUD', quote: 'CHF', sign: 1 },
      { id: 'audcad', base: 'AUD', quote: 'CAD', sign: 1 },
      { id: 'audnzd', base: 'AUD', quote: 'NZD', sign: 1 },
      { id: 'nzdjpy', base: 'NZD', quote: 'JPY', sign: 1 },
      { id: 'nzdchf', base: 'NZD', quote: 'CHF', sign: 1 },
      { id: 'nzdcad', base: 'NZD', quote: 'CAD', sign: 1 },
      { id: 'cadjpy', base: 'CAD', quote: 'JPY', sign: 1 },
      { id: 'cadchf', base: 'CAD', quote: 'CHF', sign: 1 },
      { id: 'chfjpy', base: 'CHF', quote: 'JPY', sign: 1 },
      { id: 'usdnok', base: 'USD', quote: 'NOK', sign:  1 },
      { id: 'usdsek', base: 'USD', quote: 'SEK', sign:  1 },
      { id: 'eurnok', base: 'EUR', quote: 'NOK', sign:  1 },
      { id: 'eursek', base: 'EUR', quote: 'SEK', sign:  1 },
    ];

  const _rtPairsLoaded = pairDefs.filter(p => STOOQ_RT_CACHE[p.id] != null).length;
  const rtAvailable = _rtPairsLoaded >= 24; 

  let strengths;
  if (rtAvailable) {
    const pctMap = { USD: 0, EUR: 0, GBP: 0, JPY: 0, AUD: 0, CHF: 0, CAD: 0, NZD: 0, NOK: 0, SEK: 0 };
    const countMap = { USD: 0, EUR: 0, GBP: 0, JPY: 0, AUD: 0, CHF: 0, CAD: 0, NZD: 0, NOK: 0, SEK: 0 };

    pairDefs.forEach(({ id, base, quote, sign }) => {
      const d = STOOQ_RT_CACHE[id];
      if (!d || !d.pct) return;
      const p = d.pct * sign;
      if (base in pctMap)  { pctMap[base]  += p;  countMap[base]++;  }
      if (quote in pctMap) { pctMap[quote] -= p;  countMap[quote]++; }
    });

    strengths = ccys.map(ccy => ({
      ccy,
      pct: countMap[ccy] > 0 ? pctMap[ccy] / countMap[ccy] : 0
    }));
  } else {
    const r = STATE.rates;
    const p = STATE.prevRates;
    strengths = ccys.map(ccy => {
      if (ccy === 'USD') return { ccy, pct: 0 };
      const cur  = r[ccy];
      const prev = p[ccy];
      if (!cur) return { ccy, pct: 0 };
      const rateCur  = 1 / cur;
      const ratePrev = prev ? 1 / prev : null;
      const pct = ratePrev ? (rateCur - ratePrev) / ratePrev * 100 : 0;
      return { ccy, pct };
    });
    const _nonUsd = strengths.filter(s=>s.ccy!=='USD');
    const _usdS = strengths.find(s=>s.ccy==='USD');
    if (_usdS) _usdS.pct = -_nonUsd.reduce((a,b)=>a+b.pct,0)/_nonUsd.length;
  }

  strengths.sort((a,b)=>b.pct-a.pct);

  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  window._hmStrengths = strengths;
  window._hmStrengthsLive = rtAvailable;
  const pairCountByCcy = {};
  ccys.forEach(c => {
    pairCountByCcy[c] = pairDefs.filter(p => p.base === c || p.quote === c).length;
  });
  grid.innerHTML = strengths.map(s => {
    let bg = 'h-flat';
    if (s.pct > 0.15) bg = 'h-s-up';
    else if (s.pct > 0.05) bg = 'h-up';
    else if (s.pct < -0.15) bg = 'h-s-down';
    else if (s.pct < -0.05) bg = 'h-down';
    const cls = s.pct > 0 ? 'up' : s.pct < 0 ? 'down' : 'flat';
    const sign = s.pct >= 0 ? '+' : '';
    const nPairs = pairCountByCcy[s.ccy] || 0;
    return `<div class="hm-cell ${bg}" role="button" tabindex="0" aria-label="${s.ccy} currency strength ${sign}${s.pct.toFixed(2)}%" style="cursor:pointer" title="Click to open ${s.ccy} breakdown · ${nPairs} direct pair${nPairs===1?'':'s'} · COT · vol · correlations" onclick="if(window.openHeatmapModal)openHeatmapModal('${s.ccy}',window._hmStrengths,STOOQ_RT_CACHE)">
      <span class="hm-sym">${s.ccy}</span>
      <span class="hm-val ${cls}">${sign}${s.pct.toFixed(2)}</span>
    </div>`;
  }).join('');

  const _hasLiveFeedHm = Object.values(STOOQ_RT_CACHE).some(e => e?.fromLiveFeed);
  const _hmSubEl = document.getElementById('hm-panel-sub');
  if (_hmSubEl) {
    _hmSubEl.textContent = isFxMarketClosedNow()
      ? 'Market Closed \u00b7 G10 composite \u00b7 32 pairs'
      : (_hasLiveFeedHm
        ? 'Live \u00b7 G10 composite \u00b7 32 pairs'
        : 'Delayed ~5min \u00b7 G10 composite \u00b7 32 pairs');
  }

  if (typeof window._hmRefreshIfOpen === 'function') {
    window._hmRefreshIfOpen(strengths, STOOQ_RT_CACHE);
  }
}

function populateHeatmapThrottled() {
  if (_hmThrottleTimer) return; 
  _hmThrottleTimer = setTimeout(() => {
    _hmThrottleTimer = null;
    populateHeatmap();
  }, _HM_THROTTLE_MS);
}

function computeCBTrend(obs) {
  if (!obs || obs.length < 2) return 'flat';
  const PAUSE_DAYS = 90;  
  const today = new Date();

  const latest = parseFloat(obs[0].value);
  if (isNaN(latest)) return 'flat';

  const d0 = new Date(obs[0].date);
  const dataAgeDays = (today - d0) / 86400000;

  const r1 = obs.length > 1 ? parseFloat(obs[1].value) : latest;
  const r2 = obs.length > 2 ? parseFloat(obs[2].value) : r1;

  if (dataAgeDays <= PAUSE_DAYS) {
    const recentUp   = latest > r1 || latest > r2;
    const recentDown = latest < r1 || latest < r2;
    if (recentUp  && !recentDown) return 'up';
    if (recentDown && !recentUp)  return 'down';
  }

  let flatMonths = 0;
  for (let i = 1; i < obs.length; i++) {
    if (parseFloat(obs[i].value) === latest) flatMonths++;
    else break;
  }
  const dataAgeMonths = Math.floor(dataAgeDays / 30);
  const effectiveFlat = Math.max(flatMonths, dataAgeMonths - 1);
  if (effectiveFlat >= 3) return 'flat';

  const oldest = parseFloat(obs[Math.min(5, obs.length - 1)].value);
  if (!isNaN(oldest)) {
    if (latest - oldest >=  0.05) return 'up';
    if (latest - oldest <= -0.05) return 'down';
  }
  return 'flat';
}

async function fetchCBRates() {
  const promises = CB_CONFIG.map(async cfg => {
    try {
      const r = await fetch('./rates/' + cfg.file + '.json', { cache: 'no-store' });
      if (!r.ok) return null;
      const data = await r.json();
      const obs = data.observations;
      if (!obs || !obs.length) return null;
      return { id: cfg.id, label: cfg.label, rate: parseFloat(obs[0].value), date: obs[0].date, obs };
    } catch { return null; }
  });

  const results = await Promise.all(promises);

  results.forEach(res => {
    if (!res) return;
    STATE.cbRates[res.id] = res;
    setEl('cbr-' + res.id, res.rate.toFixed(2) + '%');
  });

  window._STATE_cbRates = STATE.cbRates;

  const tbody = document.getElementById('cbrates-tbody');
  if (tbody) {
    const bankInfo = {
      usd: { flag: 'us', name: 'Federal Reserve',          short: 'Fed'  },
      eur: { flag: 'eu', name: 'European Central Bank',    short: 'ECB'  },
      gbp: { flag: 'gb', name: 'Bank of England',          short: 'BoE'  },
      jpy: { flag: 'jp', name: 'Bank of Japan',            short: 'BoJ'  },
      aud: { flag: 'au', name: 'Reserve Bank of Australia',short: 'RBA'  },
      chf: { flag: 'ch', name: 'Swiss National Bank',      short: 'SNB'  },
      cad: { flag: 'ca', name: 'Bank of Canada',           short: 'BoC'  },
      nzd: { flag: 'nz', name: 'Reserve Bank of NZ',       short: 'RBNZ' },
      nok: { flag: 'no', name: 'Norges Bank',              short: 'NB'   },
      sek: { flag: 'se', name: 'Sveriges Riksbank',        short: 'Riksbank' },
    };
    window._STATE_bankInfo = bankInfo;
    const trendMap = { up:'<span class="up">↑</span>', down:'<span class="down">↓</span>', flat:'<span class="flat">—</span>' };
    tbody.innerHTML = results.filter(Boolean).map(res => {
      const info      = bankInfo[res.id] || { flag: '', name: res.label, short: res.label };
      const trend     = computeCBTrend(res.obs);
      const flag      = info.flag ? `<span class="fi fi-${info.flag}" style="margin-right:5px;border-radius:2px;"></span>` : '';
      const rateClass = trend === 'up' ? 'up' : trend === 'down' ? 'down' : '';
      return `<tr
        title="Click to view rate history · ${info.name}"
        style="cursor:pointer;"
        data-cbr-id="${res.id}"
        onclick="(function(el){
          var id  = el.dataset.cbrId;
          var st  = window._STATE_cbRates;
          var r   = st && st[id];
          if (!r || typeof window.openCBRatesModal !== 'function') return;
          var bi  = (window._STATE_bankInfo && window._STATE_bankInfo[id]) || {};
          var mtg = window._STATE_meetings && window._STATE_meetings.meetings && window._STATE_meetings.meetings[id.toUpperCase()];
          window.openCBRatesModal(id.toUpperCase(), r.obs, bi, mtg);
        })(this)"
      >
        <td style="white-space:nowrap;">${flag}<span style="font-size:10px;">${info.short}</span></td>
        <td${rateClass ? ` class="${rateClass}"` : ''}>${res.rate.toFixed(2)}%</td>
        <td>${trendMap[trend]||'—'}</td>
      </tr>`;
    }).join('');
  }
}
const COT_TV_SYMBOLS = {
  EUR: 'COT3:099741_FO_LMP_L',
  GBP: 'COT3:096742_FO_LMP_L',
  JPY: 'COT3:097741_FO_LMP_L',
  AUD: 'COT3:232741_FO_LMP_L',
  CAD: 'COT3:090741_FO_LMP_L',
  CHF: 'COT3:092741_FO_LMP_L',
  NZD: 'COT3:112741_FO_LMP_L',
  USD: 'COT3:098662_FO_LMP_L',
};
const COT_TV_SYMBOLS_SHORT = {
  EUR: 'COT3:099741_FO_LMP_S',
  GBP: 'COT3:096742_FO_LMP_S',
  JPY: 'COT3:097741_FO_LMP_S',
  AUD: 'COT3:232741_FO_LMP_S',
  CAD: 'COT3:090741_FO_LMP_S',
  CHF: 'COT3:092741_FO_LMP_S',
  NZD: 'COT3:112741_FO_LMP_S',
  USD: 'COT3:098662_FO_LMP_S',
};

function fmtOI(n) {
  if (!n || n <= 0) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return n.toString();
}

function _cotReportMeta(rec) {
  if (rec && rec.assetClass === 'commodity') {
    return {
      report: 'Disaggregated',
      primaryLabel: 'Managed Money', primaryAbbr: 'MM',
      secondaryLabel: 'Swap Dealers', secondaryAbbr: 'SD',
      tertiaryLabel: 'Producer/Merchant', tertiaryAbbr: 'PM',
    };
  }
  return {
    report: 'TFF',
    primaryLabel: 'Leveraged Funds', primaryAbbr: 'LF',
    secondaryLabel: 'Asset Manager', secondaryAbbr: 'AM',
    tertiaryLabel: 'Dealers', tertiaryAbbr: 'DD',
  };
}

function _buildCOTUpdateLabel(latest) {
  const meta = _cotReportMeta(latest);
  const weekEnd = latest.weekEnding || latest.reportDate || '';
  let updLabel = meta.report + ' · ' + meta.primaryLabel + ' · week ending ' + weekEnd;
  if (latest.lastUpdate) {
    try {
      const d = new Date(latest.lastUpdate);
      if (!isNaN(d)) {
        updLabel += ' · updated ' + d.toLocaleDateString('en', { weekday: 'short', day: '2-digit', month: 'short' });
      }
    } catch {}
  }
  const _cotNow = new Date();
  const _cotHHMM = _cotNow.getHours().toString().padStart(2,'0') + ':' + _cotNow.getMinutes().toString().padStart(2,'0');
  const _cotTZ = _cotNow.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
  updLabel += ' · loaded ' + _cotHHMM + ' ' + _cotTZ;

  let lagHtml = '';
  if (weekEnd) {
    try {
      const msPerDay = 86400000;
      const lagDays  = Math.floor((_cotNow.getTime() - new Date(weekEnd + 'T00:00:00Z').getTime()) / msPerDay);
      if (lagDays >= 0) {
        const lagColor = lagDays <= 7 ? 'var(--up)' : lagDays <= 14 ? '#c8952a' : 'var(--down)';
        const lagDot   = lagDays <= 7 ? '●' : lagDays <= 14 ? '◐' : '○';
        lagHtml = ` · <span title="Days since week-ending date · CFTC publishes Fri, terminal updates Sat" style="color:${lagColor};font-variant-numeric:tabular-nums;">${lagDot} ${lagDays}d lag</span>`;
      }
    } catch {}
  }
  return updLabel + lagHtml;
}

function _renderCOTRows(results, symMap, dataStoreKey) {
  const container = document.getElementById('cot-rows');
  if (!container) return;

  results.sort((a, b) => {
    const totalA = (a.longPositions || 0) + (a.shortPositions || 0);
    const totalB = (b.longPositions || 0) + (b.shortPositions || 0);
    const pctA = totalA > 0 ? (a.longPositions || 0) / totalA : 0.5;
    const pctB = totalB > 0 ? (b.longPositions || 0) / totalB : 0.5;
    return pctB - pctA;
  });

  window[dataStoreKey] = window[dataStoreKey] || {};
  results.forEach(d => { window[dataStoreKey][d.ccy] = d; });

  container.innerHTML = results.map(d => {
    const meta = _cotReportMeta(d);
    const net   = d.netPosition || 0;
    const long  = d.longPositions || 0;
    const short = d.shortPositions || 0;
    const total = long + short;
    const longPct = total > 0 ? Math.round(long / total * 100) : 50;
    const cls   = net > 0 ? 'up' : net < 0 ? 'down' : 'flat';
    const netStr = (net >= 0 ? '+' : '') + net.toLocaleString();

    const amNet = d.assetManagerNet;
    let divHtml = '';
    if (amNet != null) {
      const lfDir = net > 0 ? 1 : net < 0 ? -1 : 0;
      const amDir = amNet > 0 ? 1 : amNet < 0 ? -1 : 0;
      if (lfDir !== 0 && amDir !== 0) {
        if (lfDir === amDir) {
          divHtml = '<span class="cot-div aligned" title="' + meta.primaryAbbr + ' + ' + meta.secondaryAbbr + ' aligned — ' + (lfDir > 0 ? 'both net long' : 'both net short') + '">●</span>';
        } else {
          divHtml = '<span class="cot-div diverge" title="' + meta.primaryAbbr + '/' + meta.secondaryAbbr + ' diverge — ' + meta.primaryAbbr + ' ' + (net > 0 ? 'long' : 'short') + ' · ' + meta.secondaryAbbr + ' ' + (amNet > 0 ? 'long' : 'short') + '">○</span>';
        }
      }
    }

    const oi    = long + short;
    const oiStr = fmtOI(oi);

    let oiArrow = '';
    if (d.history && d.history.length >= 2) {
      const prev = d.history[d.history.length - 2]; 
      const prevOI = (prev.levLong || 0) + (prev.levShort || 0);
      if (prevOI > 0) {
        const delta = oi - prevOI;
        if (delta > 0)       oiArrow = '<span class="oi-up">▲</span>';
        else if (delta < 0)  oiArrow = '<span class="oi-dn">▼</span>';
      }
    }

    let wow = d.wowNetChange ?? null;
    if (wow == null && d.history && d.history.length >= 2) {
      const prevSnap = d.history[d.history.length - 2];
      const prevNet  = prevSnap.levNet ?? ((prevSnap.levLong || 0) - (prevSnap.levShort || 0));
      wow = net - prevNet;
    }
    let wowHtml  = '<span class="cot-wow">—</span>';
    if (wow != null) {
      const wowCls = wow > 0 ? 'up' : wow < 0 ? 'down' : 'flat';
      const wowStr = (wow > 0 ? '+' : '') + (Math.abs(wow) >= 1000
        ? Math.round(wow / 1000) + 'k'
        : wow.toLocaleString());
      wowHtml = '<span class="cot-wow ' + wowCls + '" title="Week-over-week change in ' + meta.primaryAbbr + ' net contracts. Positive = specs adding longs/covering shorts. Negative = specs adding shorts/reducing longs.">' + wowStr + '</span>';
    }

    let pctOI = d.levNetPctOI ?? null;
    if (pctOI == null && oi > 0) {
      pctOI = Math.round(net / oi * 1000) / 10; 
    }
    let pctOIHtml  = '<span class="cot-pcoi">—</span>';
    if (pctOI != null) {
      const pctCls = pctOI > 0 ? 'up' : pctOI < 0 ? 'down' : 'flat';
      const pctStr = (pctOI > 0 ? '+' : '') + pctOI.toFixed(1) + '%';
      pctOIHtml = '<span class="cot-pcoi ' + pctCls + '" title="' + meta.primaryAbbr + ' net as % of ' + meta.primaryAbbr + ' Open Interest. Normalised across ' + (d.assetClass === 'commodity' ? 'commodities' : 'currencies') + ' — comparable regardless of contract size differences.">' + pctStr + '</span>';
    }

    const tvSym = (symMap && symMap[d.ccy]) || '';

    return '<div class="cot-row" style="cursor:pointer;" data-sym="' + tvSym + '" data-ccy="' + d.ccy + '" title="Click to open ' + d.ccy + ' COT positioning detail">'
      + '<span class="cot-sym">' + d.ccy + '</span>'
      + '<div class="cot-bar-outer">'
      + '<div class="cot-long-fill" style="width:' + longPct + '%"></div>'
      + '<div class="cot-short-fill" style="width:' + (100 - longPct) + '%"></div>'
      + '</div>'
      + '<span class="cot-pct ' + cls + '">' + longPct + '%</span>'
      + '<span class="cot-net ' + cls + '" title="' + meta.primaryAbbr + ' net contracts (longs minus shorts). Positive = net long speculative positioning; negative = net short. Primary directional signal from CFTC ' + meta.report + ' report.">' + netStr + '</span>'
      + wowHtml
      + divHtml
      + pctOIHtml
      + '<span class="cot-oi" title="' + meta.primaryAbbr + ' Open Interest: ' + oi.toLocaleString() + ' contracts (long + short). Rising OI signals new money; falling OI signals liquidation.">' + oiArrow + oiStr + '</span>'
      + '</div>';
  }).join('');

  container.querySelectorAll('.cot-row[data-sym]').forEach(row => {
    row.addEventListener('click', () => {
      const ccy  = row.dataset.ccy;
      const data = window[dataStoreKey] && window[dataStoreKey][ccy];
      if (ccy && data && typeof window.openCOTModal === 'function') {
        window.openCOTModal(ccy, data);
      } else {
        const sym = row.dataset.sym;
        if (sym) loadCOTChart(sym);
      }
    });
  });
}

async function fetchCOTData() {
  const promises = COT_CURRENCIES.map(async ccy => {
    try {
      const r = await fetch('./cot-data/' + ccy + '.json');
      if (!r.ok) return null;
      const data = await r.json();
      return { ccy, ...data };
    } catch { return null; }
  });

  const results = (await Promise.all(promises)).filter(Boolean);
  if (!results.length) return;

  window._cotFXResults = results;

  const subEl = document.getElementById('cot-date-sub');
  if (subEl && (!window._cotActiveAsset || window._cotActiveAsset === 'fx')) {
    subEl.innerHTML = _buildCOTUpdateLabel(results[0]);
  }

  if (!window._cotActiveAsset || window._cotActiveAsset === 'fx') {
    _renderCOTRows(results, COT_TV_SYMBOLS, 'COT_DATA_STORE');
  }
}

const COT_INDICES = ['SPX', 'NAS100', 'DJ30'];

async function fetchCOTIndicesData() {
  const container = document.getElementById('cot-rows');
  const subEl = document.getElementById('cot-date-sub');
  if (container) container.innerHTML = '<div class="cot-row" style="color:var(--text3);"><span>Loading index positioning data…</span></div>';

  const promises = COT_INDICES.map(async sym => {
    try {
      const r = await fetch('./cot-data/indices/' + sym + '.json');
      if (!r.ok) return null;
      const data = await r.json();
      return { ccy: sym, ...data };
    } catch { return null; }
  });

  const results = (await Promise.all(promises)).filter(Boolean);
  window._cotIndicesResults = results;

  if (!results.length) {
    if (container) container.innerHTML = '<div class="cot-row" style="color:var(--text3);"><span>Index positioning data not yet published — pending next CFTC TFF run.</span></div>';
    if (subEl) subEl.innerHTML = 'TFF · Leveraged Funds · S&amp;P 500 / Nasdaq-100 / DJIA futures';
    return;
  }

  if (subEl) subEl.innerHTML = _buildCOTUpdateLabel(results[0]);
  _renderCOTRows(results, {}, 'COT_DATA_STORE_INDICES');
}

const COT_COMMODITIES = ['XAU', 'XAG', 'COPPER', 'WTI'];

async function fetchCOTCommoditiesData() {
  const container = document.getElementById('cot-rows');
  const subEl = document.getElementById('cot-date-sub');
  if (container) container.innerHTML = '<div class="cot-row" style="color:var(--text3);"><span>Loading commodity positioning data…</span></div>';

  const promises = COT_COMMODITIES.map(async sym => {
    try {
      const r = await fetch('./cot-data/commodities/' + sym + '.json');
      if (!r.ok) return null;
      const data = await r.json();
      return { ccy: sym, ...data };
    } catch { return null; }
  });

  const results = (await Promise.all(promises)).filter(Boolean);
  window._cotCommoditiesResults = results;

  if (!results.length) {
    if (container) container.innerHTML = '<div class="cot-row" style="color:var(--text3);"><span>Commodity positioning data not yet published — pending next CFTC Disaggregated run.</span></div>';
    if (subEl) subEl.innerHTML = 'Disaggregated · Managed Money · Gold / Silver / Copper / WTI futures';
    return;
  }

  if (subEl) subEl.innerHTML = _buildCOTUpdateLabel(results[0]);
  _renderCOTRows(results, {}, 'COT_DATA_STORE_COMMODITIES');
}

const COT_BREAKDOWN_CCYS    = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD'];
const COT_BREAKDOWN_INDICES = ['SPX', 'NAS100', 'DJ30'];
const COT_BREAKDOWN_COMMODITIES = ['XAU', 'XAG', 'COPPER', 'WTI'];

function _cotStrengthPairList() {
  return CORR_MTX_PAIRS.filter(([, base, quote]) => base !== 'NOK' && base !== 'SEK' && quote !== 'NOK' && quote !== 'SEK');
}

function _cotNetPctLF(d) {
  const long = d.longPositions || 0, short = d.shortPositions || 0;
  const total = long + short;
  return total > 0 ? (d.netPosition || 0) / total : 0;
}

function _cotContractValueUSD(ccy, contracts, contractMultiplier) {
  if (contractMultiplier == null || contracts == null) return null;
  const baseValue = contracts * contractMultiplier; 
  if (ccy === 'USD') return baseValue;
  const rate = STATE.rates && STATE.rates[ccy]; 
  if (!rate) return null;
  return baseValue / rate;
}

const _COT_HEAT_BASE = [30, 34, 45];   
const _COT_HEAT_UP    = [38, 166, 154]; 
const _COT_HEAT_DOWN   = [239, 83, 80]; 

function _cotHeatColor(magnitude, isUp) {
  const m = Math.max(0, Math.min(1, magnitude));
  const t = 0.12 + m * 0.88;
  const target = isUp ? _COT_HEAT_UP : _COT_HEAT_DOWN;
  const r = Math.round(_COT_HEAT_BASE[0] + (target[0] - _COT_HEAT_BASE[0]) * t);
  const g = Math.round(_COT_HEAT_BASE[1] + (target[1] - _COT_HEAT_BASE[1]) * t);
  const b = Math.round(_COT_HEAT_BASE[2] + (target[2] - _COT_HEAT_BASE[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function _cotStrengthCellStyle(pct) {
  if (pct == null) return { bg: 'var(--bg2)', color: 'var(--text3)', txt: '—', bold: false };
  const txt = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
  const up = pct >= 0;
  const magnitude = Math.min(Math.abs(pct), 100) / 100;
  const bg = _cotHeatColor(magnitude, up);
  return { bg, color: up ? 'var(--up)' : 'var(--down)', txt, bold: Math.abs(pct) >= 50 };
}

let _cotBreakdownData = null; 

async function _fetchCotBreakdownData() {
  const ccyPromises = COT_BREAKDOWN_CCYS.map(async ccy => {
    try {
      const r = await fetch('./cot-data/' + ccy + '.json');
      if (!r.ok) return null;
      return { ccy, data: await r.json() };
    } catch { return null; }
  });
  const idxPromises = COT_BREAKDOWN_INDICES.map(async sym => {
    try {
      const r = await fetch('./cot-data/indices/' + sym + '.json');
      if (!r.ok) return null;
      return { sym, data: await r.json() };
    } catch { return null; }
  });
  const comPromises = COT_BREAKDOWN_COMMODITIES.map(async sym => {
    try {
      const r = await fetch('./cot-data/commodities/' + sym + '.json');
      if (!r.ok) return null;
      return { sym, data: await r.json() };
    } catch { return null; }
  });

  const [ccyResults, idxResults, comResults] = await Promise.all([Promise.all(ccyPromises), Promise.all(idxPromises), Promise.all(comPromises)]);
  const ccys = {}, indices = {}, commodities = {};
  ccyResults.filter(Boolean).forEach(({ ccy, data }) => { ccys[ccy] = data; });
  idxResults.filter(Boolean).forEach(({ sym, data }) => { indices[sym] = data; });
  comResults.filter(Boolean).forEach(({ sym, data }) => { commodities[sym] = data; });
  _cotBreakdownData = { ccys, indices, commodities };
  return _cotBreakdownData;
}

function _cotBreakdownRow(symbol, d, displayName, isUsdDenominated) {
  const long = d.longPositions || 0, short = d.shortPositions || 0;
  const net  = d.netPosition || 0;
  const oiLF = long + short;
  const oiTotal = d.openInterestTotal; 
  const contractMultiplier = d.contractMultiplier;
  const contractUnit = d.contractUnit;

  const usdCcy = isUsdDenominated || symbol === 'USD' ? 'USD' : (contractUnit || symbol);
  const oiTotalUSD   = _cotContractValueUSD(usdCcy, oiTotal, contractMultiplier);
  const oiLFUSD      = _cotContractValueUSD(usdCcy, oiLF, contractMultiplier);
  const longValue    = contractMultiplier != null ? long * contractMultiplier : null;
  const shortValue   = contractMultiplier != null ? short * contractMultiplier : null;
  const netValueBase = contractMultiplier != null ? net * contractMultiplier : null;
  const netValueUSD  = _cotContractValueUSD(usdCcy, net, contractMultiplier);

  const netPct   = (oiTotal != null && oiTotal > 0) ? (net / oiTotal) * 100 : null;
  const netPctLF = oiLF > 0 ? (net / oiLF) * 100 : null;
  const wowPP    = (() => {                                             
    if (!d.history || d.history.length < 2 || oiLF <= 0) return null;
    const prev = d.history[d.history.length - 2];
    const prevOI = (prev.levLong || 0) + (prev.levShort || 0);
    if (prevOI <= 0) return null;
    const prevPct = ((prev.levNet ?? ((prev.levLong || 0) - (prev.levShort || 0))) / prevOI) * 100;
    return netPctLF - prevPct;
  })();

  const fmt = n => n == null ? '—' : Math.round(n).toLocaleString();
  const fmtPct = n => n == null ? '—' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  const cls = n => n == null ? '' : (n >= 0 ? 'up' : 'down');

  return '<tr>'
    + `<td>${displayName || symbol}</td>`
    + `<td>${contractMultiplier != null ? contractMultiplier.toLocaleString() : '—'}</td>`
    + `<td>${fmt(oiTotal)}</td>`
    + `<td>${fmt(oiTotalUSD)}</td>`
    + `<td>${fmt(oiLF)}</td>`
    + `<td>${fmt(oiLFUSD)}</td>`
    + `<td>${fmt(long)}</td>`
    + `<td>${fmt(longValue)}</td>`
    + `<td>${fmt(short)}</td>`
    + `<td>${fmt(shortValue)}</td>`
    + `<td class="${cls(net)}">${net >= 0 ? '+' : ''}${fmt(net)}</td>`
    + `<td class="${cls(netPct)}" title="Net position as % of TOTAL Open Interest (all reporting categories)">${fmtPct(netPct)}</td>`
    + `<td class="${cls(netPctLF)}" title="Net position as % of Leveraged Funds' own Open Interest — matches the docked panel's NET%OI">${fmtPct(netPctLF)}</td>`
    + `<td class="${cls(wowPP)}">${wowPP == null ? '—' : (wowPP >= 0 ? '+' : '') + wowPP.toFixed(2) + 'pp'}</td>`
    + `<td class="${cls(netValueBase)}">${fmt(netValueBase)}</td>`
    + `<td class="${cls(netValueUSD)}">${fmt(netValueUSD)}</td>`
    + '</tr>';
}

const COT_BREAKDOWN_INDEX_DISPLAY = { SPX: 'SP500 (E-MINI)', NAS100: 'NAS100 (NQ MINI)', DJ30: 'US30 (YM)' };
const COT_BREAKDOWN_COMMODITY_DISPLAY = { XAU: 'GOLD', XAG: 'SILVER', COPPER: 'COPPER', WTI: 'WTI CRUDE OIL' };
const COT_BREAKDOWN_CCY_DISPLAY = { USD: 'USD INDEX' };

function _cotBreakdownTableHtml(store) {
  const head = [
    { h: 'Symbol' }, { h: 'Contract Value' }, { h: 'Open Interest TOTAL' }, { h: 'Open Interest TOTAL USD' },
    { h: 'Open Interest LF' }, { h: 'Open Interest LF USD' }, { h: 'Long Positions' }, { h: 'Long Value' },
    { h: 'Short Positions' }, { h: 'Short Value' }, { h: 'Net Positions' },
    { h: 'Net Percent', t: 'Net position as % of TOTAL Open Interest (every reporting category combined) — a different, smaller-magnitude denominator than Net Percent LF; does not match the docked panel.' },
    { h: 'Net Percent LF', t: 'Net position as % of Leveraged Funds\u2019 own Open Interest only — reconciles exactly with the docked COT panel\u2019s NET%OI column.' },
    { h: 'Net % LF Δ' }, { h: 'Net Value (Base Currency)' }, { h: 'Net Value USD' }
  ];
  let html = '<table id="cot-breakdown-fs-table"><thead><tr>' + head.map(c => `<th scope="col"${c.t ? ` title="${c.t}"` : ''}>${c.h}</th>`).join('') + '</tr></thead><tbody>';
  COT_BREAKDOWN_CCYS.forEach(ccy => {
    const d = store.ccys[ccy];
    if (d) html += _cotBreakdownRow(ccy, d, COT_BREAKDOWN_CCY_DISPLAY[ccy] || ccy);
  });
  COT_BREAKDOWN_INDICES.forEach(sym => {
    const d = store.indices[sym];
    if (d) html += _cotBreakdownRow(sym, d, COT_BREAKDOWN_INDEX_DISPLAY[sym] || sym);
  });
  COT_BREAKDOWN_COMMODITIES.forEach(sym => {
    const d = store.commodities && store.commodities[sym];
    if (d) html += _cotBreakdownRow(sym, d, COT_BREAKDOWN_COMMODITY_DISPLAY[sym] || sym, true);
  });
  html += '</tbody></table>';
  return html;
}

function _cotStrengthGridHtml(store) {
  const pctByCcy = {};
  COT_BREAKDOWN_CCYS.forEach(ccy => {
    const d = store.ccys[ccy];
    if (d) pctByCcy[ccy] = _cotNetPctLF(d) * 100;
  });

  const pairs = _cotStrengthPairList();
  const rows = pairs.map(([, base, quote]) => {
    const b = pctByCcy[base], q = pctByCcy[quote];
    const val = (b != null && q != null) ? (b - q) / 2 : null;
    return { base, quote, val };
  });
  rows.sort((a, b) => {
    if (a.val == null && b.val == null) return 0;
    if (a.val == null) return 1;
    if (b.val == null) return -1;
    return b.val - a.val;
  });

  let html = '<div id="cot-strength-grid">';
  rows.forEach(({ base, quote, val }) => {
    const s = _cotStrengthCellStyle(val);
    html += `<div style="background:${s.bg};" title="${base}${quote} LF Strength = (Net%LF(${base}) − Net%LF(${quote})) / 2${val == null ? ' (insufficient data)' : ''}">`
      + `<div class="cot-strength-pair">${base}${quote}</div>`
      + `<div class="cot-strength-val" style="color:${s.color};font-weight:${s.bold ? 700 : 600};">${s.txt}</div>`
      + '</div>';
  });
  const remainder = rows.length % 6;
  const emptySlots = remainder === 0 ? 0 : 6 - remainder;
  if (emptySlots > 0) {
    html += `<div class="cot-strength-empty" style="grid-column:span ${emptySlots};"></div>`;
  }
  html += '</div>';
  html += '<div class="cot-strength-legend">'
    + `<span><span class="cot-strength-swatch" style="background:${_cotHeatColor(0.15, true)};"></span>Net-long lean</span>`
    + `<span><span class="cot-strength-swatch" style="background:${_cotHeatColor(0.75, true)};"></span>Strong net-long lean</span>`
    + `<span><span class="cot-strength-swatch" style="background:${_cotHeatColor(0.15, false)};"></span>Net-short lean</span>`
    + `<span><span class="cot-strength-swatch" style="background:${_cotHeatColor(0.75, false)};"></span>Strong net-short lean</span>`
    + '</div>';
  return html;
}

function _cotNetExposureRankDetail(d) {
  const hist = (d && d.history) || [];
  const nets = hist.slice(-52).map(h => h.levNet).filter(n => n != null);
  if (nets.length < 2) return null;
  const lo = Math.min(...nets), hi = Math.max(...nets);
  if (hi === lo) return null;
  const current = nets[nets.length - 1];
  return { currentRank: ((current - lo) / (hi - lo)) * 100, weeks: nets.length };
}

function _cotNetExposureRank(d) {
  const detail = _cotNetExposureRankDetail(d);
  return detail ? detail.currentRank : null;
}

function _cotRankBarStyle(rank) {
  if (rank == null) return { bg: 'var(--bg2)', color: 'var(--text3)' };
  const magnitude = Math.abs(rank - 50) / 50; 
  return { bg: _cotHeatColor(magnitude, rank >= 50), color: '#f2f5f8' };
}

const _COT_RANK_BAND_BLUE = [79, 127, 255]; 
function _cotRankBandColor(target) {
  const t = 0.10;
  const r = Math.round(_COT_HEAT_BASE[0] + (target[0] - _COT_HEAT_BASE[0]) * t);
  const g = Math.round(_COT_HEAT_BASE[1] + (target[1] - _COT_HEAT_BASE[1]) * t);
  const b = Math.round(_COT_HEAT_BASE[2] + (target[2] - _COT_HEAT_BASE[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function _cotNetExposureRankChartHtml(store) {
  const rows = COT_BREAKDOWN_CCYS.map(ccy => {
    const d = store.ccys[ccy];
    const detail = d ? _cotNetExposureRankDetail(d) : null;
    return { ccy, detail };
  });

  const gridlines = [100, 75, 50, 25, 0];
  const bandHi = _cotRankBandColor(_COT_RANK_BAND_BLUE);
  const bandLo = _cotRankBandColor(_COT_HEAT_UP);
  let html = '<div class="cot-rank-legend">'
    + `<span><span class="cot-strength-swatch" style="background:${bandHi};"></span>Range highs</span>`
    + `<span><span class="cot-strength-swatch" style="background:${bandLo};"></span>Range lows</span>`
    + '</div>';
  html += '<div id="cot-rank-chart">'
    + '<div id="cot-rank-axis">' + gridlines.map(v => `<div class="cot-rank-axis-tick">${v}%</div>`).join('') + '</div>'
    + '<div id="cot-rank-plot">'
    + '<div id="cot-rank-bands">'
    + `<div class="cot-rank-band cot-rank-band-hi" style="bottom:90%;height:10%;background:${bandHi};"></div>`
    + `<div class="cot-rank-band cot-rank-band-lo" style="bottom:0;height:10%;background:${bandLo};"></div>`
    + '</div>'
    + '<div id="cot-rank-gridlines">' + gridlines.map(v => `<div class="cot-rank-gridline" style="bottom:${v}%;${v === 50 ? 'border-top-style:dashed;' : ''}"></div>`).join('') + '</div>'
    + '<div id="cot-rank-cols">';
  rows.forEach(({ ccy, detail }) => {
    const label = COT_BREAKDOWN_CCY_DISPLAY[ccy] || ccy;
    if (!detail) {
      html += '<div class="cot-rank-col">'
        + `<div class="cot-rank-col-bararea" title="${ccy}: not enough history yet for a range"></div>`
        + `<div class="cot-rank-col-ccy">${label}</div>`
        + '</div>';
      return;
    }
    const { currentRank, weeks } = detail;
    const r = Math.max(0, Math.min(100, currentRank));
    const s = _cotRankBarStyle(r);
    const barBottom = Math.min(r, 50);
    const barHeight = Math.max(Math.abs(r - 50), 1.5);
    const label3s = currentRank.toFixed(0) + '%';
    html += '<div class="cot-rank-col">'
      + `<div class="cot-rank-col-bararea" title="${ccy}: latest reading at ${label3s} of its own ${weeks}-week range">`
      + `<div class="cot-rank-col-bar" style="bottom:${barBottom}%;height:${barHeight}%;background:${s.bg};"></div>`
      + '</div>'
      + `<div class="cot-rank-col-ccy">${label}</div>`
      + '</div>';
  });
  html += '</div>'
    + '</div></div>';
  html += '<div style="padding:6px 0 0;font-size:9px;color:var(--text3);">Bar floats from the 50% (neutral) baseline to the latest reading, plotted against the symbol\'s trailing 52-week range (standard 52w-high/low convention, not the full multi-year history this data now stores) · shaded bands mark the top/bottom 10% of the 0-100% range · hover a bar for its exact reading</div>';
  return html;
}

function _cotPositioningVolDetail(d) {
  const hist = (d && d.history) || [];
  const nets = hist.map(h => h.levNet).filter(n => n != null);
  if (nets.length < 20) return null;

  const deltas = [];
  for (let i = 1; i < nets.length; i++) deltas.push(nets[i] - nets[i - 1]);

  const WIN = 8;
  if (deltas.length < WIN + 8) return null;

  const rollingVol = [];
  for (let i = WIN - 1; i < deltas.length; i++) {
    const win = deltas.slice(i - WIN + 1, i + 1);
    const mean = win.reduce((a, b) => a + b, 0) / win.length;
    const variance = win.reduce((a, b) => a + (b - mean) * (b - mean), 0) / win.length;
    rollingVol.push(Math.sqrt(variance));
  }

  const tail = rollingVol.slice(-52);
  if (tail.length < 8) return null;

  const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
  const variance = tail.reduce((a, b) => a + (b - mean) * (b - mean), 0) / tail.length;
  const sd = Math.sqrt(variance);
  const current = tail[tail.length - 1];
  const z = sd > 0 ? (current - mean) / sd : 0;
  return { z, weeks: tail.length };
}

function _cotPositioningVolChartHtml(store) {
  const rows = COT_BREAKDOWN_CCYS.map(ccy => {
    const d = store.ccys[ccy];
    const detail = d ? _cotPositioningVolDetail(d) : null;
    return { ccy, detail };
  });

  const gridlines = [3, 1.5, 0, -1.5, -3];
  let html = '<div id="cot-posvol-chart">'
    + '<div id="cot-posvol-axis">' + gridlines.map(v => `<div class="cot-rank-axis-tick">${v > 0 ? '+' : ''}${v}σ</div>`).join('') + '</div>'
    + '<div id="cot-posvol-plot">'
    + '<div id="cot-posvol-gridlines">' + gridlines.map(v => {
        const pct = ((v + 3) / 6) * 100;
        return `<div class="cot-rank-gridline" style="bottom:${pct}%;${v === 0 ? 'border-top-style:dashed;' : ''}"></div>`;
      }).join('') + '</div>'
    + '<div id="cot-posvol-cols">';
  rows.forEach(({ ccy, detail }) => {
    const label = COT_BREAKDOWN_CCY_DISPLAY[ccy] || ccy;
    if (!detail) {
      html += '<div class="cot-rank-col">'
        + `<div class="cot-rank-col-bararea" title="${ccy}: not enough history yet for this window"></div>`
        + `<div class="cot-rank-col-ccy">${label}</div>`
        + '</div>';
      return;
    }
    const { z, weeks } = detail;
    const zc = Math.max(-3, Math.min(3, z));
    const pct = ((zc + 3) / 6) * 100;
    const barBottom = Math.min(pct, 50);
    const barHeight = Math.max(Math.abs(pct - 50), 1.5);
    const unstable = Math.abs(z) > 1.5;
    const bg = unstable ? 'var(--orange)' : (z >= 0 ? _cotRankBandColor(_COT_RANK_BAND_BLUE) : 'var(--text3)');
    const zLabel = (z >= 0 ? '+' : '') + z.toFixed(2) + 'σ';
    html += '<div class="cot-rank-col">'
      + `<div class="cot-rank-col-bararea" title="${ccy}: positioning volatility at ${zLabel} vs its own trailing ${weeks}-week distribution">`
      + `<div class="cot-rank-col-bar" style="bottom:${barBottom}%;height:${barHeight}%;background:${bg};"></div>`
      + '</div>'
      + `<div class="cot-rank-col-ccy">${label}</div>`
      + '</div>';
  });
  html += '</div></div></div>';
  html += '<div style="padding:6px 0 0;font-size:9px;color:var(--text3);">Z-score of the rolling 8-week std. dev. of week-over-week changes in Leveraged Funds net position, vs its own trailing 52-week distribution · orange = |Z| &gt; 1.5σ (positioning unusually unstable, not just crowded) · proxy for total open-interest volatility since per-week OI isn\'t in this history series</div>';
  return html;
}

async function renderCotBreakdown() {
  const inner = document.getElementById('cot-breakdown-fullscreen-inner');
  if (!inner) return;
  inner.innerHTML = '<div style="color:var(--text3);font-size:11px;padding:8px 2px;">Loading…</div>';

  const store = await _fetchCotBreakdownData();
  const anyCcy = Object.values(store.ccys)[0];
  const subtitle = document.getElementById('cot-breakdown-fs-subtitle');
  if (subtitle) {
    subtitle.innerHTML = anyCcy
      ? 'CFTC TFF · Leveraged Funds · week ending ' + (anyCcy.weekEnding || '—') + ' · valid for trades from ' + _cotNextTradingDayLabel(anyCcy.weekEnding)
      : 'CFTC TFF · Leveraged Funds · weekly';
  }

  let html = '<div style="overflow-x:auto;">' + _cotBreakdownTableHtml(store) + '</div>';
  html += '<div style="margin-top:14px;font-size:11px;color:var(--text3);font-weight:600;">Currency Pairs — LF Strength Index</div>';
  html += '<div style="padding:2px 0 0;font-size:9px;color:var(--text3);">Strength Index = (Net%LF(base) − Net%LF(quote)) / 2, on a ±100% scale</div>';
  html += _cotStrengthGridHtml(store);
  html += '<div style="margin-top:16px;font-size:11px;color:var(--text3);font-weight:600;">Net Exposure % Rank — where current LF net position sits in its own trailing range (up to 52wk history)</div>';
  html += _cotNetExposureRankChartHtml(store);
  html += '<div style="padding:8px 0 14px;font-size:9px;color:var(--text3);">0% = most net-short leveraged-funds positioning in the lookback window, 100% = most net-long · lookback is the trailing 52 weeks per symbol (or however much history exists, if less) · Open Interest TOTAL / Contract Value columns come from the CFTC report\'s own header (TFF for FX and equity indices, Disaggregated for commodities)</div>';
  html += '<div style="margin-top:6px;font-size:11px;color:var(--text3);font-weight:600;">Positioning Volatility (Z-score)</div>';
  html += _cotPositioningVolChartHtml(store);
  inner.innerHTML = html;
}

function _cotNextTradingDayLabel(weekEndingStr) {
  if (!weekEndingStr) return '—';
  try {
    const d = new Date(weekEndingStr + 'T00:00:00Z');
    const day = d.getUTCDay(); 
    const addDays = (8 - day) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + addDays);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch { return '—'; }
}

function openCotBreakdownFullscreen() {
  const overlay = document.getElementById('cot-breakdown-fullscreen-overlay');
  if (!overlay) return;
  if (overlay.classList.contains('cot-breakdown-fs-active')) return;

  overlay.classList.add('cot-breakdown-fs-active');
  document.body.style.overflow = 'hidden';
  renderCotBreakdown();
  _giOpenFocusTrap(overlay);
}

function closeCotBreakdownFullscreen() {
  const overlay = document.getElementById('cot-breakdown-fullscreen-overlay');
  if (!overlay || !overlay.classList.contains('cot-breakdown-fs-active')) return;

  overlay.classList.remove('cot-breakdown-fs-active');
  document.body.style.overflow = '';
  _giCloseFocusTrap();
}

function _cotBreakdownFsWireUp() {
  document.getElementById('cot-breakdown-btn')?.addEventListener('click', openCotBreakdownFullscreen);
  document.getElementById('cot-breakdown-fs-close')?.addEventListener('click', closeCotBreakdownFullscreen);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('cot-breakdown-fullscreen-overlay')?.classList.contains('cot-breakdown-fs-active')) {
      closeCotBreakdownFullscreen();
    }
  });
}

function initCOTAssetTabs() {
  const tabBar = document.getElementById('cot-asset-tabs');
  if (!tabBar) return;
  window._cotActiveAsset = 'fx';
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.rates-ctab');
    if (!btn) return;
    const asset = btn.dataset.asset;
    if (asset === window._cotActiveAsset) return;
    window._cotActiveAsset = asset;

    tabBar.querySelectorAll('.rates-ctab').forEach(b => {
      const isActive = b === btn;
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.style.background = isActive ? 'var(--accent)' : 'none';
      b.style.color = isActive ? '#fff' : 'var(--text2)';
      b.style.border = isActive ? 'none' : '1px solid var(--border2)';
      b.style.fontWeight = isActive ? '600' : '400';
    });

    if (asset === 'fx') {
      const subEl = document.getElementById('cot-date-sub');
      if (window._cotFXResults && window._cotFXResults.length) {
        if (subEl) subEl.innerHTML = _buildCOTUpdateLabel(window._cotFXResults[0]);
        _renderCOTRows(window._cotFXResults.slice(), COT_TV_SYMBOLS, 'COT_DATA_STORE');
      } else {
        fetchCOTData();
      }
    } else if (asset === 'indices') {
      if (window._cotIndicesResults) {
        const subEl = document.getElementById('cot-date-sub');
        if (window._cotIndicesResults.length) {
          if (subEl) subEl.innerHTML = _buildCOTUpdateLabel(window._cotIndicesResults[0]);
          _renderCOTRows(window._cotIndicesResults.slice(), {}, 'COT_DATA_STORE_INDICES');
        } else {
          fetchCOTIndicesData();
        }
      } else {
        fetchCOTIndicesData();
      }
    } else if (asset === 'commodities') {
      if (window._cotCommoditiesResults) {
        const subEl = document.getElementById('cot-date-sub');
        if (window._cotCommoditiesResults.length) {
          if (subEl) subEl.innerHTML = _buildCOTUpdateLabel(window._cotCommoditiesResults[0]);
          _renderCOTRows(window._cotCommoditiesResults.slice(), {}, 'COT_DATA_STORE_COMMODITIES');
        } else {
          fetchCOTCommoditiesData();
        }
      } else {
        fetchCOTCommoditiesData();
      }
    }
  });
}

let _newsEtag = null;

async function fetchNewsData() {
  try {
    const headers = {};
    if (_newsEtag) headers['If-None-Match'] = _newsEtag;
    const r = await fetch('./news-data/news.json', { headers });
    if (r.status === 304) return;
    if (!r.ok) return;
    const etag = r.headers.get('ETag');
    if (etag) _newsEtag = etag;
    const data = await r.json();
    const items = Array.isArray(data) ? data : (data.articles || data.items || []);
    if (!items.length) return;

    const enItems = items.filter(i => !i.lang || i.lang === 'en');

    buildNewsTicker(enItems);

    renderNewsSection(enItems, data);

    const feedEl = document.getElementById('news-feed-items');
    if (feedEl) {
    feedEl.innerHTML = '';
    enItems.slice(0, 24).forEach(item => {
        let time = item.time || '--:--';
        if (item.ts) {
          const d = new Date(item.ts);
          time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } else if (item.datetime) {
          const d = new Date(item.datetime);
          if (!isNaN(d)) time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        const headline = item.title || '';
        const cur      = item.cur || item.currency || '';
        const source   = item.source || '';
        const rawLink  = item.link || '';
        const safeLink = rawLink.startsWith('https://') ? rawLink : '';
        const date     = item.date || '';
        const wrap = document.createElement('div');
        wrap.className = 'news-item';
        if (safeLink) {
          wrap.style.cursor = 'pointer';
          wrap.addEventListener('click', () => window.open(safeLink, '_blank', 'noopener,noreferrer'));
        }
        const timeEl = document.createElement('span');
        timeEl.className = 'news-time';
        timeEl.textContent = time;
        const bodyEl = document.createElement('div');
        bodyEl.className = 'news-body';
        const headEl = document.createElement('div');
        headEl.className = 'news-headline';
        headEl.textContent = headline;
        const metaEl = document.createElement('div');
        metaEl.className = 'news-meta';
        if (cur) { const s = document.createElement('span'); s.className = 'news-cur-tag'; s.textContent = cur; metaEl.appendChild(s); }
        if (source) { const s = document.createElement('span'); s.className = 'news-source'; s.textContent = source; metaEl.appendChild(s); }
        if (date) { const s = document.createElement('span'); s.style.color = 'var(--text3)'; s.textContent = date; metaEl.appendChild(s); }
        bodyEl.appendChild(headEl);
        bodyEl.appendChild(metaEl);
        wrap.appendChild(timeEl);
        wrap.appendChild(bodyEl);
        feedEl.appendChild(wrap);
      });

      const sub = document.getElementById('news-sub');
      if (sub && data.total) sub.textContent = `FX-relevant · ${data.total} stories · sorted by impact`;
    }
  } catch(e) {
    console.warn('News fetch failed:', e);
  }
}

function buildNewsTicker(items) {
  const track = document.getElementById('ticker-track');
  if (!track || !items.length) return;

  const src = items.slice(0, 15);
  window._tickerItemsData = src;
  const makeItem = (item, i) => {
    const cur   = item.cur || item.currency || '';
    const title = item.title || '';
    const short = title.length > 90 ? title.slice(0, 87) + '\u2026' : title;
    return '<span class="ticker-item" data-tk-idx="' + i + '">' +
      (cur ? '<span class="t-tag">' + giEscHtml(cur) + '</span> \u00b7 ' : '') +
      giEscHtml(short) + '</span>';
  };

  track.innerHTML = src.map(makeItem).join('') + src.map(makeItem).join('');
  _wireTickerTooltip(track);

  track.style.animation = 'none';
  track.style.transform = 'translateX(0)';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const halfW = track.scrollWidth / 2;
      if (!halfW) return;

      const speed    = 35;  
      const duration = Math.max(60, halfW / speed);

      const styleId = 'ticker-kf-style';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent =
        '@keyframes ticker-exact {' +
        '  0%   { transform: translateX(0); }' +
        '  100% { transform: translateX(-' + halfW + 'px); }' +
        '}';

      track.style.animation = 'ticker-exact ' + duration + 's linear infinite';

      if (window._tickerRO) window._tickerRO.disconnect();
      window._tickerRO = new ResizeObserver(() => {
        const newHalf = track.scrollWidth / 2;
        if (!newHalf || Math.abs(newHalf - halfW) < 2) return;
        buildNewsTicker(items);
      });
      window._tickerRO.observe(track.parentElement);
    });
  });
}

function _wireTickerTooltip(track) {
  if (track.dataset.tkWired) return;
  track.dataset.tkWired = '1';

  const tip = document.getElementById('ticker-tooltip');
  if (!tip) return;

  const hide = () => { tip.classList.remove('tk-open'); tip.setAttribute('aria-hidden', 'true'); };

  let closeTimer = null;
  const cancelClose = () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } };
  const scheduleClose = () => {
    cancelClose();
    closeTimer = setTimeout(() => {
      track.style.animationPlayState = 'running';
      hide();
    }, 150);
  };

  track.addEventListener('mouseover', (e) => {
    cancelClose();
    track.style.animationPlayState = 'paused';
    const el = e.target.closest('.ticker-item');
    if (!el || !track.contains(el)) return;
    const idx = parseInt(el.dataset.tkIdx, 10);
    const item = (window._tickerItemsData || [])[idx];
    if (!item) return;

    const cur    = item.cur || item.currency || '';
    const title  = item.title || '';
    const body   = item.expand || '';
    const source = item.source || '';
    const time   = item.date ? (item.date + (item.time ? ' \u00b7 ' + item.time : '')) : (item.time || '');
    const link   = (item.link || '').startsWith('https://') ? item.link : '';

    tip.innerHTML =
      '<div class="tk-tt-head">' +
        '<span class="tk-tt-src">' + (source ? giEscHtml(source) : 'News') + '</span>' +
        (time ? '<span class="tk-tt-time">' + giEscHtml(time) + '</span>' : '') +
      '</div>' +
      '<div class="tk-tt-title">' + giEscHtml(title) + '</div>' +
      (body ? '<div class="tk-tt-body">' + giEscHtml(body) + '</div>' : '') +
      (cur ? '<span class="tk-tt-cur">' + giEscHtml(cur) + '</span>' : '') +
      (link ? '<a class="tk-tt-link" href="' + link + '" target="_blank" rel="noopener noreferrer">Read full article \u2192</a>' : '');

    const r = el.getBoundingClientRect();
    const tw = 340;
    let left = Math.min(r.left, window.innerWidth - tw - 12);
    left = Math.max(12, left);
    let top = r.bottom + 6;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    tip.classList.add('tk-open');
    tip.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      const th = tip.getBoundingClientRect().height;
      if (top + th > window.innerHeight - 8) {
        tip.style.top = Math.max(8, r.top - th - 6) + 'px';
      }
    });
  });

  track.addEventListener('mouseleave', () => {
    scheduleClose();
  });

  tip.addEventListener('mouseenter', () => {
    cancelClose();
  });

  tip.addEventListener('mouseleave', () => {
    scheduleClose();
  });

  window.addEventListener('scroll', () => { cancelClose(); track.style.animationPlayState = 'running'; hide(); }, true);
}

const QB_STOOQ_PAIRS = [
  { sym: 'eurusd',  id: 'eurusd',  dec: 5 },
  { sym: 'usdjpy',  id: 'usdjpy',  dec: 3 },
  { sym: 'gbpusd',  id: 'gbpusd',  dec: 5 },
  { sym: 'audusd',  id: 'audusd',  dec: 5 },
  { sym: 'usdcad',  id: 'usdcad',  dec: 5 },
  { sym: 'usdchf',  id: 'usdchf',  dec: 5 },
  { sym: 'nzdusd',  id: 'nzdusd',  dec: 5 },
  { sym: 'eurgbp',  id: 'eurgbp',  dec: 5 },
  { sym: 'eurjpy',  id: 'eurjpy',  dec: 3 },
  { sym: 'eurchf',  id: 'eurchf',  dec: 5 },
  { sym: 'eurcad',  id: 'eurcad',  dec: 5 },
  { sym: 'euraud',  id: 'euraud',  dec: 5 },
  { sym: 'gbpjpy',  id: 'gbpjpy',  dec: 3 },
  { sym: 'gbpchf',  id: 'gbpchf',  dec: 5 },
  { sym: 'gbpcad',  id: 'gbpcad',  dec: 5 },
  { sym: 'audjpy',  id: 'audjpy',  dec: 3 },
  { sym: 'audnzd',  id: 'audnzd',  dec: 5 },
  { sym: 'audchf',  id: 'audchf',  dec: 5 },
  { sym: 'cadjpy',  id: 'cadjpy',  dec: 3 },
  { sym: 'chfjpy',  id: 'chfjpy',  dec: 3 },
  { sym: 'nzdjpy',  id: 'nzdjpy',  dec: 3 },
  { sym: 'eurnzd',  id: 'eurnzd',  dec: 5 },
  { sym: 'gbpaud',  id: 'gbpaud',  dec: 5 },
  { sym: 'gbpnzd',  id: 'gbpnzd',  dec: 5 },
  { sym: 'audcad',  id: 'audcad',  dec: 5 },
  { sym: 'cadchf',  id: 'cadchf',  dec: 5 },
  { sym: 'nzdcad',  id: 'nzdcad',  dec: 5 },
  { sym: 'nzdchf',  id: 'nzdchf',  dec: 5 },
  { sym: 'usdnok',  id: 'usdnok',  dec: 4 },
  { sym: 'usdsek',  id: 'usdsek',  dec: 4 },
  { sym: 'eurnok',  id: 'eurnok',  dec: 4 },
  { sym: 'eursek',  id: 'eursek',  dec: 4 },
];

let _intradayCacheTime  = 0;
let _intradayCache      = null;
let _intradayInFlight   = null;  

async function loadIntradayQuotes() {
  const now = Date.now();
  if (_intradayCache && (now - _intradayCacheTime) < 90_000) return _intradayCache;
  if (_intradayInFlight) return _intradayInFlight;

  _intradayInFlight = (async () => {
    try {
      const r = await fetch('./intraday-data/quotes.json?_=' + Math.floor(now / 60000), {
        signal: AbortSignal.timeout(5000)
      });
      if (!r.ok) return null;
      const data = await r.json();
      if (!data?.quotes) return null;

      if (data.updated) {
        const age = (now - new Date(data.updated).getTime()) / 60000;
        if (age > 35) {
          console.warn(`[Intraday] File is ${age.toFixed(0)}min old — treating as stale`);
          Object.values(data.quotes).forEach(q => q.stale = true);
        }
      }

      _intradayCache     = data;
      _intradayCacheTime = now;
      window._intradayQuotes = data;  
      document.dispatchEvent(new CustomEvent('gi:quotesLoaded'));
      console.log(`[Intraday] Loaded ${Object.keys(data.quotes).length} quotes — source: ${data.source}`);
      return data;
    } catch (e) {
      console.warn('[Intraday] Could not load quotes.json:', e.message);
      return null;
    } finally {
      _intradayInFlight = null;  
    }
  })();

  return _intradayInFlight;
}

function intradayQuote(cache, id) {
  if (!cache?.quotes?.[id]) return null;
  const q = cache.quotes[id];
  if (!q.close || isNaN(q.close) || q.close <= 0) return null;
  const hasPrev = q.prev_close != null && q.prev_close > 0;
  return {
    close:        q.close,
    prev_close:   q.prev_close ?? null,
    open:         (q.open != null && q.open > 0) ? q.open : (q.prev_close ?? q.close),
    high:         (q.high != null && q.high > 0) ? q.high : null,
    low:          (q.low  != null && q.low  > 0) ? q.low  : null,
    chg:          hasPrev ? (q.chg  ?? null) : null,
    pct:          hasPrev ? (q.pct  ?? null) : null,
    fromIntraday: true,
    stale:        q.stale ?? false,
    market_state: q.market_state ?? null,  
    market_time:  q.market_time  ?? null,  
  };
}

const STOOQ_RT_CACHE = {};  
window.STOOQ_RT_CACHE = STOOQ_RT_CACHE;  

let _CA_HOLIDAY_CCYS = new Set();

const CA_HOLIDAY_CCY_MAP = {
  nikkei: 'JPY', stoxx: 'EUR',
};

const CME_FULL_CLOSURE_DATES_USD = new Set([
  '2026-04-03',
  '2026-12-25',
]);
const CME_PARTIAL_PAUSE_USD = {
  '2026-01-19': ['18:00', '23:00', '19:30', '23:00'],
  '2026-02-16': ['18:00', '23:00', '19:30', '23:00'],
  '2026-05-25': ['17:00', '22:00', '18:30', '22:00'],
  '2026-09-07': ['17:00', '22:00', '18:30', '22:00'],
  '2026-11-26': ['18:00', '23:00', '19:30', '23:00'],
};
const CA_PARTIAL_PAUSE_GROUP = { spx: 'equityRate', us10y: 'equityRate', gold: 'energyMetal', wti: 'energyMetal' };

function _utcHHMMToday(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m);
}

function _caClosedCcy(id) {
  const ccy = CA_HOLIDAY_CCY_MAP[id];
  if (ccy && _CA_HOLIDAY_CCYS.has(ccy)) return ccy;

  const todayIso = new Date().toISOString().slice(0, 10);
  if (['gold', 'wti', 'spx', 'dxy', 'us10y'].includes(id) && _CA_HOLIDAY_CCYS.has('USD')) {
    if (CME_FULL_CLOSURE_DATES_USD.has(todayIso)) return 'USD';
    const group = CA_PARTIAL_PAUSE_GROUP[id];
    const pause = group && CME_PARTIAL_PAUSE_USD[todayIso];
    if (pause) {
      const [eqStart, eqEnd, enStart, enEnd] = pause;
      const [startHHMM, endHHMM] = group === 'equityRate' ? [eqStart, eqEnd] : [enStart, enEnd];
      const nowMs = Date.now();
      if (nowMs >= _utcHHMMToday(startHHMM) && nowMs < _utcHHMMToday(endHHMM)) return 'USD';
    }
  }
  return null;
}

async function fetchQuoteBarRT() {
  const intradayData = await loadIntradayQuotes();
  let updatedFromIntraday = 0;

  if (intradayData?.quotes) {
    for (const pair of QB_STOOQ_PAIRS) {
      const q = intradayData.quotes[pair.id];
      if (!q?.close || isNaN(q.close) || q.close <= 0) continue;
      const hasPrev = q.prev_close != null && q.prev_close > 0;
      const data = {
        close: q.close,
        open:  (q.open != null && q.open > 0) ? q.open : (q.prev_close ?? q.close),
        prev_close: q.prev_close ?? null,
        chg:   hasPrev ? (q.chg  ?? null) : null,
        pct:   hasPrev ? (q.pct  ?? null) : null,
        high:  (q.high  != null && q.high  > 0) ? q.high  : null,
        low:   (q.low   != null && q.low   > 0) ? q.low   : null,
        session_high: (q.session_high != null && q.session_high > 0) ? q.session_high : null,
        session_low:  (q.session_low  != null && q.session_low  > 0) ? q.session_low  : null,
        prev_bar: (q.prev_bar && q.prev_bar.close != null) ? q.prev_bar : null,
        hv30:  (q.hv30  != null) ? q.hv30 : (intradayData.hv30?.[pair.id] ?? null),
        pct1w: (q.pct1w != null) ? q.pct1w : null,
        pct1w_date: q.pct1w_date ?? null,
        fromIntraday: true,
        stale: q.stale ?? false,
      };
      STOOQ_RT_CACHE[pair.id] = data;

      const priceEl = document.getElementById('q-' + pair.id);
      const chgEl   = document.getElementById('qc-' + pair.id);
      if (priceEl) {
        priceEl.textContent = data.close.toFixed(pair.dec);
        priceEl.className   = 'q-price ' + clsDir(data.chg);
      }
      if (chgEl) { chgEl.textContent = pctStr(data.pct); chgEl.className = 'q-chg ' + clsDir(data.chg); }
      updatedFromIntraday++;
    }
  }

  const totalUpdated = Object.keys(STOOQ_RT_CACHE).length;
  if (totalUpdated > 0) {
    updateFxPairsTableRT();
    _lwUpdateTodayBar();   
    const now = new Date();
    const hh = now.getHours().toString().padStart(2,'0');
    const mm = now.getMinutes().toString().padStart(2,'0');
    const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
    const qbLabel = document.getElementById('qb-source-label');
    if (qbLabel) {
      if (isFxMarketClosedNow()) {
        qbLabel.textContent = 'Market Closed';
      } else {
        qbLabel.textContent = `Delayed ~5min · ${hh}:${mm} ${tzAbbr}`;
      }
    }
  }
}

function updateFxPairsTableRT() {
  const _rtDay2 = new Date().getUTCDay(), _rtH2 = new Date().getUTCHours();
  const _isWeekendRT = _rtDay2 === 6 || (_rtDay2 === 0 && _rtH2 < 21) || (_rtDay2 === 5 && _rtH2 >= 21);

  const tbody = document.getElementById('fx-pairs-tbody');
  if (tbody) {
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const symCell = row.querySelector('td.sym');
      if (!symCell) return;
      const symText = symCell.textContent.trim();
      const pairId = symText.replace('/', '').toLowerCase();
      const data = STOOQ_RT_CACHE[pairId];
      if (!data) return;
      const pairCfg = PAIRS.find(p => p.id === pairId);
      if (!pairCfg) return;
      const tds = row.querySelectorAll('td');
      if (tds.length < 6) return;
      const pipVal = pairCfg.dec === 3 ? 0.01 : 0.0001;
      const spreadPips = TYPICAL_SPREADS[pairId] || 0.5;
      const halfSpread = spreadPips * pipVal / 2;
      tds[1].textContent = fmt(data.close - halfSpread, pairCfg.dec);
      tds[2].textContent = fmt(data.close + halfSpread, pairCfg.dec);
      if (tds[3]) tds[3].textContent = spreadPips.toFixed(1);
      if (data.pct != null) {
        tds[4].textContent = pctStr(data.pct);
        tds[4].className   = clsDir(data.pct);
      } else {
        tds[4].textContent = '—';
        tds[4].className   = 'flat';
      }
      if (tds[5]) {
        if (data.pct1w != null) {
          tds[5].textContent = pctStr(data.pct1w);
          tds[5].className   = clsDir(data.pct1w);
        } else {
          tds[5].textContent = '—';
          tds[5].className   = 'flat';
        }
      }
      if (tds[6] && data.hv30 != null) {
        tds[6].textContent = data.hv30.toFixed(1) + '%';
      }
      const sessColor = _isWeekendRT ? 'var(--text3)' : 'var(--text1)';
      const _sessH = data.session_high ?? data.high;
      const _sessL = data.session_low  ?? data.low;
      if (tds[10]) { tds[10].textContent = (_sessH != null) ? fmt(_sessH, pairCfg.dec) : '—'; tds[10].style.color = sessColor; }
      if (tds[11]) { tds[11].textContent = (_sessL != null) ? fmt(_sessL, pairCfg.dec) : '—'; tds[11].style.color = sessColor; }
    });
  }

  const crossIds = ['eurgbp','eurjpy','eurchf','eurcad','euraud','gbpjpy','gbpchf','gbpcad','audjpy','audnzd','audchf','cadjpy','chfjpy','nzdjpy','eurnzd','gbpaud','gbpnzd','audcad','cadchf','nzdcad','nzdchf','eurnok','eursek'];
  crossIds.forEach(id => {
    const data = STOOQ_RT_CACHE[id];
    if (!data) return;
    const pairCfg = PAIRS.find(p => p.id === id);
    if (!pairCfg) return;
    const priceEl = document.getElementById('sb-' + id);
    const chgEl   = document.getElementById('sbc-' + id);
    if (priceEl) {
      priceEl.textContent = fmt(data.close, pairCfg.dec);
      priceEl.className = 'sb-price ' + clsDir(data.pct);
    }
    if (chgEl) {
      chgEl.textContent = pctStr(data.pct);
      chgEl.className = 'sb-chg ' + clsDir(data.pct);
    }
  });

  function setCA_rt(caId, data) {
    if (!data) return;
    const vEl = document.getElementById('ca-' + caId);
    const cEl = document.getElementById('cac-' + caId);
    if (!vEl || !cEl) return;
    const closedCcy = _caClosedCcy(caId);
    if (closedCcy) {
      vEl.textContent = data.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      vEl.className = 'ca-val flat';
      cEl.textContent = closedCcy + ' holiday — closed';
      cEl.className = 'ca-chg flat';
      cEl.style.opacity = '0.65';
      return;
    }
    cEl.style.removeProperty('opacity');
    const cls   = data.pct > 0.05 ? 'up' : data.pct < -0.05 ? 'down' : '';
    const arrow = data.pct > 0.05 ? '▲' : data.pct < -0.05 ? '▼' : '→';
    const sign  = data.pct >= 0 ? '+' : '';
    vEl.textContent = data.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    vEl.className = 'ca-val';
    if (data.chg != null) {
      const absSign = data.chg >= 0 ? '+' : '';
      const absFmt  = Math.abs(data.chg) >= 10 ? (absSign + data.chg.toFixed(1)) : (absSign + data.chg.toFixed(2));
      cEl.textContent = arrow + ' ' + absFmt + ' (' + sign + data.pct.toFixed(2) + '%)';
    } else {
      cEl.textContent = arrow + ' ' + sign + data.pct.toFixed(2) + '%';
    }
    cEl.className = 'ca-chg ' + cls;
  }
  setCA_rt('gold', STOOQ_RT_CACHE['xauusd']);
  setCA_rt('wti',  STOOQ_RT_CACHE['wti']);

  populateHeatmapThrottled();

  const upd = document.getElementById('fx-table-updated');
  if (upd) {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2,'0');
    const mm = now.getMinutes().toString().padStart(2,'0');
    const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
    const _rtDay = now.getUTCDay(), _rtH = now.getUTCHours();
    const _rtWeekend = _rtDay === 6 || (_rtDay === 0 && _rtH < 21) || (_rtDay === 5 && _rtH >= 21);
    const _hasLiveFeed = Object.values(STOOQ_RT_CACHE).some(e => e?.fromLiveFeed);
    upd.textContent = _rtWeekend
      ? `Last close: Fri · delayed`
      : _hasLiveFeed
        ? `Live`
        : `${hh}:${mm} ${tzAbbr} · delayed ~5min`;
  }

  const _chartSub = document.querySelector('#section-fxpairs .panel-sub');
  if (_chartSub && _chartSub.textContent !== 'TradingView \u00b7 live data') {
    const _hasLiveFeed = Object.values(STOOQ_RT_CACHE).some(e => e?.fromLiveFeed);
    _chartSub.textContent = isFxMarketClosedNow() ? 'Market Closed' : (_hasLiveFeed ? 'Live' : `Delayed ~5min`);
  }

  _throttledPairDetailRefresh();
}

let _pairDetailRefreshTimer = null;
function _throttledPairDetailRefresh() {
  if (_pairDetailRefreshTimer) return;
  _pairDetailRefreshTimer = setTimeout(() => {
    _pairDetailRefreshTimer = null;
    const pop = document.getElementById('pd-popover');
    if (!pop || pop.style.display === 'none') return;
    const sym = pop.dataset.sym;
    if (sym && typeof updatePairDetail === 'function') updatePairDetail(sym);
  }, 3000);
}

async function fetchCommodityQuotes() {
  const intraday = await loadIntradayQuotes();
  if (!intraday) return;

  const gold = intradayQuote(intraday, 'gold');
  const wti  = intradayQuote(intraday, 'wti');

  if (gold) {
    STOOQ_RT_CACHE['xauusd'] = gold;
    const el = document.getElementById('q-xauusd'), ce = document.getElementById('qc-xauusd');
    if (el) { el.textContent = gold.close.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); el.className = 'q-price ' + clsDir(gold.chg); }
    if (ce) { ce.textContent = pctStr(gold.pct); ce.className = 'q-chg ' + clsDir(gold.chg); }
  }
  if (wti) {
    STOOQ_RT_CACHE['wti'] = wti;
    const el = document.getElementById('q-wti'), ce = document.getElementById('qc-wti');
    if (el) { el.textContent = wti.close.toFixed(2); el.className = 'q-price ' + clsDir(wti.chg); }
    if (ce) { ce.textContent = pctStr(wti.pct); ce.className = 'q-chg ' + clsDir(wti.chg); }
  }
  updateFxPairsTableRT();
}

const COT_SENTIMENT_CACHE = {};
const RETAIL_SENTIMENT_CACHE = {};

function _sentimentSourceOneUsable(d, nowMs) {
  if (!d || !d.pairs || d.pairs.length < 5) return false;
  const updatedMs = d.updated ? new Date(d.updated).getTime() : 0;
  const ageMin = (nowMs - updatedMs) / 60000;
  return ageMin < 900;
}
const RETAIL_SENT_METAL_TV_SYM = { 'XAU/USD': 'OANDA:XAUUSD', 'XAG/USD': 'OANDA:XAGUSD' };
const SENTIMENT_FALLBACK = [
  { sym:'EUR/USD', buy:56, sell:44 }, { sym:'GBP/USD', buy:51, sell:49 },
  { sym:'USD/JPY', buy:35, sell:65 }, { sym:'AUD/USD', buy:46, sell:54 },
  { sym:'USD/CHF', buy:60, sell:40 }, { sym:'USD/CAD', buy:48, sell:52 },
  { sym:'NZD/USD', buy:54, sell:46 }, { sym:'EUR/GBP', buy:44, sell:56 },
  { sym:'EUR/JPY', buy:61, sell:39 }, { sym:'GBP/JPY', buy:57, sell:43 },
];

async function buildCOTSentiment() {
  const COT_CCYS = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD'];
  const results = {};
  await Promise.all(COT_CCYS.map(async ccy => {
    try {
      const r = await fetch('./cot-data/' + ccy + '.json');
      if (!r.ok) return;
      const d = await r.json();
      if (d.longPositions != null && d.shortPositions != null) {
        const total = d.longPositions + d.shortPositions;
        const buyPct = total > 0 ? Math.round(d.longPositions / total * 100) : 50;
        results[ccy] = { buy: buyPct, sell: 100 - buyPct, net: d.netPosition, date: d.reportDate };
      }
    } catch {}
  }));
  return results;
}

function _fxTTBootstrap() {
  if (document.getElementById('fx-tt-style')) return;

  const s = document.createElement('style');
  s.id = 'fx-tt-style';
  s.textContent = `
    #fx-tt {
      position:fixed;z-index:99999;
      width:min(240px, calc(100vw - 24px));
      background:var(--bg3);border:1px solid var(--border2);
      border-radius:4px;padding:9px 11px;
      font-size:11px;color:var(--text);line-height:1.55;
      pointer-events:none;display:none;font-family:var(--font-ui);
      box-sizing:border-box;
    }
    #fx-tt .tt-title { font-weight:700;font-size:11px;color:#fff;margin-bottom:3px; }
    #fx-tt .tt-ex { margin-top:5px;padding-top:5px;border-top:1px solid var(--border2);font-size:10px;color:var(--text2);font-style:italic; }
    .fx-tip { border-bottom:1px dashed rgba(255,255,255,0.2);cursor:help; }
  `;
  document.head.appendChild(s);

  const ttEl = document.createElement('div');
  ttEl.id = 'fx-tt';
  ttEl.innerHTML = '<div class="tt-title" id="fx-tt-title"></div><div id="fx-tt-body"></div><div class="tt-ex" id="fx-tt-ex"></div>';
  document.body.appendChild(ttEl);

  window._fxTTPos = function(cx, cy) {
    const tt = document.getElementById('fx-tt');
    if (!tt) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const ttW = Math.min(240, vw - 24);
    const ttH = tt.offsetHeight || 130;
    const PAD = 8;
    let x = cx + 14, y = cy + 14;
    if (x + ttW > vw - PAD) x = cx - ttW - 8;
    if (x < PAD) x = PAD;
    if (y + ttH > vh - PAD) y = cy - ttH - 8;
    if (y < PAD) y = PAD;
    tt.style.left = x + 'px';
    tt.style.top  = y + 'px';
  };

  function _hideTip() {
    const tt = document.getElementById('fx-tt');
    if (tt) tt.style.display = 'none';
  }

  document.addEventListener('mousemove', ev => {
    const tt = document.getElementById('fx-tt');
    if (tt && tt.style.display === 'block') window._fxTTPos(ev.clientX, ev.clientY);
  });

  document.addEventListener('touchstart', ev => {
    if (!ev.target.closest('.fx-tip')) _hideTip();
  }, { passive: true });

  document.addEventListener('scroll', _hideTip, { passive: true, capture: true });

  let _fxTTTouchOrigin = null;
  document.addEventListener('touchstart', ev => {
    const t = ev.touches && ev.touches[0];
    _fxTTTouchOrigin = t ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  document.addEventListener('touchmove', ev => {
    if (!_fxTTTouchOrigin) return;
    const t = ev.touches && ev.touches[0];
    if (!t) return;
    const dx = t.clientX - _fxTTTouchOrigin.x, dy = t.clientY - _fxTTTouchOrigin.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) { _hideTip(); _fxTTTouchOrigin = null; }
  }, { passive: true });
  document.addEventListener('touchend', () => { _fxTTTouchOrigin = null; }, { passive: true });
  document.addEventListener('touchcancel', _hideTip, { passive: true });
}

function _fxTTAttach(el, title, body, ex) {
  if (!el) return;
  _fxTTBootstrap();
  el.classList.add('fx-tip');

  function _showTip(cx, cy) {
    const tt = document.getElementById('fx-tt');
    document.getElementById('fx-tt-title').textContent = title;
    document.getElementById('fx-tt-body').textContent  = body;
    const exEl = document.getElementById('fx-tt-ex');
    exEl.textContent = ex || ''; exEl.style.display = ex ? 'block' : 'none';
    tt.style.display = 'block';
    requestAnimationFrame(() => window._fxTTPos(cx, cy));
  }

  el.addEventListener('mouseenter', ev => _showTip(ev.clientX, ev.clientY));
  el.addEventListener('mouseleave', () => { document.getElementById('fx-tt').style.display = 'none'; });

  el.addEventListener('touchstart', ev => {
    ev.stopPropagation();
    const t = ev.touches[0];
    _showTip(t.clientX, t.clientY);
  }, { passive: true });
}

function renderSentiment(pairs, sourceLabel, general) {
  const container = document.getElementById('sent-rows');
  if (!container) return;

  _fxTTBootstrap();
  const attachTip = _fxTTAttach;

  function fmtK(n) { return n >= 1000 ? (n/1000).toFixed(1) + 'K' : String(n); }

  const sorted = [...pairs].sort((a, b) =>
    (b.totalPos || 0) !== (a.totalPos || 0)
      ? (b.totalPos || 0) - (a.totalPos || 0)
      : Math.max(b.buy, b.sell) - Math.max(a.buy, a.sell)
  );

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:58px 1fr 38px 38px 12px 52px;align-items:center;gap:0;padding:3px 8px 3px;background:var(--head-bg);border-bottom:1px solid var(--border2);position:sticky;top:0;z-index:5;">
      <span style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-ui);">Pair</span>
      <span style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-ui);">Long / Short</span>
      <span style="font-size:9px;color:var(--up);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-ui);text-align:right;">L%</span>
      <span style="font-size:9px;color:var(--down);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-ui);text-align:right;">S%</span>
      <span style="font-size:9px;color:var(--text3);font-family:var(--font-ui);text-align:center;"> </span>
      <span style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-ui);text-align:right;">Pos</span>
    </div>`;

  sorted.forEach(p => {
    const hasRich = p.totalPos > 0 && p.avgL > 0 && p.avgS > 0;
    const domLong = p.buy >= p.sell;
    const biasCol = domLong ? 'var(--up)' : 'var(--down)';
    const biasLbl = domLong ? 'L' : 'S';

    let distPct = null, distPips = null, trapped = false, currentPrice = 0, domAvg = 0, decimals = 4;
    let tickPct = null;

    if (hasRich) {
      domAvg   = domLong ? p.avgL : p.avgS;
      decimals = domAvg > 20 ? 2 : 4;
      const qCache = (typeof intradayQuote === 'function' && _intradayCache)
        ? intradayQuote(_intradayCache, p.sym.replace('/', '').toLowerCase())
        : null;
      currentPrice = qCache ? qCache.close : 0;

      if (currentPrice > 0) {
        trapped   = domLong ? currentPrice < domAvg : currentPrice > domAvg;
        distPct   = (currentPrice - domAvg) / domAvg * 100;
        distPips  = Math.abs(Math.round((currentPrice - domAvg) * (domAvg > 20 ? 100 : 10000)));
        const lo    = Math.min(p.avgL, p.avgS);
        const hi    = Math.max(p.avgL, p.avgS);
        const range = (hi - lo) || domAvg * 0.01;
        tickPct = Math.min(98, Math.max(2,
          (currentPrice - (lo - range * 1.5)) / (range * 4) * 100
        ));
      }
    }

    const distSign = distPct !== null && distPct >= 0 ? '+' : '';
    const tvSym = RETAIL_SENT_METAL_TV_SYM[p.sym] || ('FX_IDC:' + p.sym.replace('/', ''));

    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:58px 1fr 38px 38px 12px 52px;align-items:center;gap:0;padding:3px 8px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;';
    row.setAttribute('aria-label', 'Click to open ' + p.sym + ' chart');
    row.addEventListener('mouseenter', () => row.style.background = 'var(--bg3)');
    row.addEventListener('mouseleave', () => row.style.background = '');
    row.addEventListener('click', () => loadTVChart(tvSym));

    const symDiv = document.createElement('div');
    symDiv.style.cssText = 'display:flex;flex-direction:column;gap:0;';
    const symSpan = document.createElement('span');
    symSpan.style.cssText = 'font-size:10px;font-weight:700;color:#fff;font-family:var(--font-ui);white-space:nowrap;line-height:1.2;';
    symSpan.textContent = p.sym;
    symDiv.appendChild(symSpan);
    if (hasRich) {
      const statusSpan = document.createElement('span');
      const distCol2 = distPct !== null ? (trapped ? 'var(--down)' : 'var(--up)') : 'var(--text3)';
      statusSpan.style.cssText = `font-size:8px;font-family:var(--font-mono);color:${distCol2};white-space:nowrap;line-height:1.2;`;
      const avgStr = domAvg.toFixed(decimals);
      const arrow = distPct !== null ? (trapped ? ' ▼' : ' ▲') : '';
      statusSpan.textContent = avgStr + arrow;
      symDiv.appendChild(statusSpan);
    }

    const barDiv = document.createElement('div');
    barDiv.style.cssText = 'position:relative;height:6px;background:var(--bg3);border-radius:1px;overflow:visible;margin:0 4px;cursor:help;';
    barDiv.innerHTML = `
      <div style="position:absolute;left:0;top:0;height:100%;width:${p.buy}%;background:var(--up);opacity:.85;border-radius:1px 0 0 1px;"></div>
      <div style="position:absolute;right:0;top:0;height:100%;width:${p.sell}%;background:var(--down);opacity:.85;border-radius:0 1px 1px 0;"></div>`;

    let tickEl = null;
    if (tickPct !== null) {
      tickEl = document.createElement('div');
      tickEl.style.cssText = `position:absolute;top:-3px;width:2px;height:12px;background:#fff;opacity:.9;border-radius:1px;left:${tickPct}%;transform:translateX(-1px);cursor:help;`;
      barDiv.appendChild(tickEl);
    }

    const buySpan = document.createElement('span');
    buySpan.style.cssText = 'font-size:10px;color:var(--up);font-family:var(--font-mono);text-align:right;cursor:help;';
    buySpan.textContent = p.buy + '%';

    const sellSpan = document.createElement('span');
    sellSpan.style.cssText = 'font-size:10px;color:var(--down);font-family:var(--font-mono);text-align:right;cursor:help;';
    sellSpan.textContent = p.sell + '%';

    const biasSpan = document.createElement('span');
    biasSpan.style.cssText = `font-size:9px;font-weight:700;color:${biasCol};font-family:var(--font-ui);text-align:center;`;
    biasSpan.textContent = biasLbl;

    const posSpan = document.createElement('span');
    posSpan.style.cssText = 'font-size:9px;color:var(--text3);font-family:var(--font-ui);text-align:right;white-space:nowrap;';
    posSpan.textContent = hasRich ? fmtK(p.totalPos) : '—';

    row.append(symDiv, barDiv, buySpan, sellSpan, biasSpan, posSpan);
    container.appendChild(row);

    const domSideTxt = domLong ? 'longs' : 'shorts';
    attachTip(symDiv,
      'Click to open ' + p.sym + ' chart',
      `Opens the ${p.sym} price chart. Retail positioning is most useful when cross-referenced with price action.`,
      null
    );
    attachTip(barDiv,
      'Long / Short bar',
      `Shows the split between retail buyers (green, left) and sellers (red, right). Extreme readings are often contrarian signals.`,
      `A nearly all-red bar means retail is heavily short — historically a bullish contrarian signal.`
    );
    if (tickEl) {
      attachTip(tickEl,
        'Current price (white line)',
        `The white bar shows where price is now relative to the retail average entry for the dominant side.`,
        `Line to the left of center = price fell below where retail longs entered — they are underwater.`
      );
    }
    attachTip(buySpan, '% Long',
      `Percentage of retail traders currently holding long (buy) positions in ${p.sym}.`,
      `Readings above 70% long are unusual and often precede a drop as crowded longs get squeezed.`
    );
    attachTip(sellSpan, '% Short',
      `Percentage of retail traders currently holding short (sell) positions in ${p.sym}.`,
      `Readings above 70% short are unusual and often precede a rally as crowded shorts get squeezed.`
    );
    if (hasRich) {
      attachTip(posSpan,
        'Open positions',
        `Number of Myfxbook traders with ${p.sym} open right now. Higher count = more statistically representative.`,
        `EUR/USD with 54K positions is the most-followed pair — mass stop-outs here move the market.`
      );
    }
    if (distPct !== null) {
      const distEl = symDiv.lastChild;
      const distTitle2 = trapped ? 'Retail trapped' : 'Retail in profit';
      const distBody2  = `The dominant side (${domSideTxt}) entered at avg ${domAvg.toFixed(decimals)}. Current price: ${currentPrice.toFixed(decimals)}. They are ${trapped ? 'underwater (losing)' : 'in profit'}.`;
      const distEx2    = trapped
        ? 'If price continues against them, mass stop-outs can trigger a sharp move.'
        : 'They may take profits soon, creating pressure in the opposite direction.';
      attachTip(distEl, distTitle2, distBody2, distEx2);
    }
  });

  const genEl = document.getElementById('sent-general');
  if (genEl && general) {
    const profPct   = general.profitablePercentage   || 0;
    const realPct   = general.realAccountsPercentage || 0;
    const funds     = general.totalFunds             || '';
    const avgDep    = general.averageDeposit         || '';
    const avgProfit = general.averageAccountProfit   || '';
    const avgLoss   = general.averageAccountLoss     || '';

    genEl.style.cssText = 'padding:5px 0 2px;border-top:1px solid var(--border);flex-shrink:0;';
    genEl.innerHTML = '';

    const profRow = document.createElement('div');
    profRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:help;';
    profRow.innerHTML = `
      <span style="font-size:9px;color:var(--text2);font-family:var(--font-ui);white-space:nowrap;">Profitable</span>
      <div style="flex:1;height:3px;background:var(--bg3);border-radius:1px;">
        <div style="height:3px;width:${profPct}%;background:var(--up);border-radius:1px;"></div>
      </div>
      <span style="font-size:9px;color:var(--up);font-family:var(--font-mono);">${profPct}%</span>
      <span style="font-size:9px;color:var(--text3);font-family:var(--font-ui);white-space:nowrap;">Real ${realPct}%</span>
    `;
    genEl.appendChild(profRow);

    const statsRow = document.createElement('div');
    statsRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;cursor:help;';
    statsRow.innerHTML = `
      <span style="font-size:9px;color:var(--text3);font-family:var(--font-ui);">Funds <span style="color:var(--text2);">$${funds}</span></span>
      <span style="font-size:9px;color:var(--text3);font-family:var(--font-ui);">Avg dep <span style="color:var(--text2);">$${avgDep}</span></span>
      <span style="font-size:9px;color:var(--text3);font-family:var(--font-ui);">P&amp;L <span style="color:var(--up);">+$${avgProfit}</span> <span style="color:var(--down);">${avgLoss}</span></span>
    `;
    genEl.appendChild(statsRow);

    attachTip(profRow,
      'Profitable accounts',
      'Percentage of Myfxbook accounts currently showing a positive balance. Above 60% is common in trending markets.',
      'Falls sharply during high-volatility periods — a rising profitable % can signal market stabilization.'
    );
    const statSpans = statsRow.querySelectorAll('span');
    attachTip(statSpans[0],
      'Total funds',
      'Sum of capital in all sampled Myfxbook accounts. Larger sample = more statistical weight.',
      'More total funds means the sentiment data better reflects real institutional-retail behavior.'
    );
    attachTip(statSpans[1],
      'Average deposit',
      'Average account size in the sample. Higher values indicate more experienced or semi-professional traders.',
      '$96K average suggests the sample skews toward serious traders, not micro accounts — data carries more weight.'
    );
    attachTip(statSpans[2],
      'Community P&L',
      'Average profit of winning accounts vs average loss of losing accounts.',
      'If avg loss exceeds avg profit, retail is in capitulation mode — often a contrarian signal for reversals.'
    );
    const realSpan = profRow.querySelector('span:last-child');
    attachTip(realSpan,
      'Real accounts %',
      'Share of accounts using real money (vs demo). Higher % = more meaningful signal.',
      'Above 50% real accounts means the data reflects actual capital at risk, not practice accounts.'
    );
  }

  const now = new Date();
  const lh = now.getHours().toString().padStart(2,'0');
  const lm = now.getMinutes().toString().padStart(2,'0');
  const tzAbbr2 = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
  setEl('sent-updated', (sourceLabel || '') + ' · ' + lh + ':' + lm + ' ' + tzAbbr2);

  const isCOT = sourceLabel && sourceLabel.includes('COT');
  const isHistorical = sourceLabel && sourceLabel.includes('Historical');
  const isAltFeed = sourceLabel && sourceLabel.includes('Retail \u00b7 live');
  const subEl = document.getElementById('sent-source-sub');
  if (subEl) {
    const _sentTime = lh + ':' + lm + ' ' + tzAbbr2;
    if (isCOT) subEl.textContent = `CFTC COT · speculative positioning · loaded ${_sentTime}`;
    else if (isHistorical) subEl.textContent = `Static fallback · live feeds unavailable · loaded ${_sentTime}`;
    else if (isAltFeed) subEl.textContent = `Retail positioning · live · updated ${_sentTime}`;
    else subEl.textContent = `Myfxbook · retail positioning · updated ${_sentTime}`;
  }
}

async function fetchSentiment() {
  await loadIntradayQuotes().catch(() => null);

  try {
    const r = await fetch('./sentiment-data/myfxbook.json');
    if (r.ok) {
      const d = await r.json();
      if (_sentimentSourceOneUsable(d, Date.now())) {
        const updatedMs = new Date(d.updated).getTime();
        const ageMin = (Date.now() - updatedMs) / 60000;
        const pairs = d.pairs.map(p => ({
          sym:      p.sym,
          buy:      p.long,
          sell:     p.short,
          totalPos: p.totalPos  || 0,
          longPos:  p.longPos   || 0,
          shortPos: p.shortPos  || 0,
          avgL:     p.avgLongPx || 0,
          avgS:     p.avgShortPx|| 0,
          assetClass: p.assetClass || 'fx',
        }));
        const ageLabel = ageMin < 60
          ? Math.round(ageMin) + 'min ago'
          : Math.round(ageMin / 60) + 'h ago';
        const general = d.general || null;
        pairs.forEach(p => {
          const key = (p.sym || '').toUpperCase().replace(/\./g, '/');
          RETAIL_SENTIMENT_CACHE[key] = {
            longPct:  p.buy  ?? null,
            shortPct: p.sell ?? null,
            longPos:  p.longPos  || 0,
            shortPos: p.shortPos || 0,
            avgL: p.avgL || 0,
            avgS: p.avgS || 0,
          };
        });
        const sourceLabel = d.apiBlocked
          ? 'Myfxbook · ' + ageLabel + ' (refresh pending)'
          : 'Myfxbook · ' + ageLabel;
        _setSentimentSource(pairs, sourceLabel, general);
        return;
      }
    }
  } catch {}

  try {
    const r = await fetch('https://freeserv.dukascopy.com/2.0/api?path=sentiment/list&prettyprint=true&jsonp=false', {mode:'cors'});
    if (r.ok) {
      const data = await r.json();
      if (data && data.data && data.data.length) {
        const mapped = data.data.slice(0,10).map(d => ({
          sym:  (d.instrument||d.sym||'').replace('_','/'),
          buy:  Math.round(d.longVolume ?? d.buy ?? 50),
          sell: Math.round(d.shortVolume ?? d.sell ?? 50),
          assetClass: 'fx',
        })).filter(d=>d.sym);
        const cachedMetals = (window._sentAllPairs || []).filter(p => p.assetClass === 'metal');
        if (mapped.length) { _setSentimentSource(mapped.concat(cachedMetals), 'Retail \u00b7 live'); return; }
      }
    }
  } catch {}

  const fallbackPairs = SENTIMENT_FALLBACK.map(p => ({ ...p, assetClass: 'fx' }));
  _setSentimentSource(fallbackPairs, 'Static fallback · live feeds unavailable');
}

function _setSentimentSource(pairs, sourceLabel, general) {
  window._sentAllPairs    = pairs;
  window._sentSourceLabel = sourceLabel;
  window._sentGeneral     = general || null;
  _renderSentimentForActiveTab();
}

const SENT_ASSET_CLASS_MAP = { fx: 'fx', metals: 'metal' };

function _renderSentimentForActiveTab() {
  const pairs = window._sentAllPairs || [];
  const asset = window._sentActiveAsset || 'fx';
  const targetClass = SENT_ASSET_CLASS_MAP[asset] || asset;
  const filtered = pairs.filter(p => (p.assetClass || 'fx') === targetClass);
  if (asset !== 'fx' && !filtered.length) {
    const container = document.getElementById('sent-rows');
    if (container) container.innerHTML = '<div style="color:var(--text3);font-size:11px;padding:8px 0;">Metals sentiment unavailable from the current source.</div>';
    return;
  }
  renderSentiment(filtered, window._sentSourceLabel, window._sentGeneral);
}

function initSentimentAssetTabs() {
  const tabBar = document.getElementById('sent-asset-tabs');
  if (!tabBar) return;
  window._sentActiveAsset = 'fx';
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.rates-ctab');
    if (!btn) return;
    const asset = btn.dataset.asset;
    if (asset === window._sentActiveAsset) return;
    window._sentActiveAsset = asset;

    tabBar.querySelectorAll('.rates-ctab').forEach(b => {
      const isActive = b === btn;
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.style.background = isActive ? 'var(--accent)' : 'none';
      b.style.color = isActive ? '#fff' : 'var(--text2)';
      b.style.border = isActive ? 'none' : '1px solid var(--border2)';
      b.style.fontWeight = isActive ? '600' : '400';
    });

    _renderSentimentForActiveTab();
  });
}

function attachRiskTip(el, title, body, ex) {
  _fxTTAttach(el, title, body, ex);
}

function attachRiskMonitorTooltips() {
  const vixCell = document.querySelector('#section-risk .risk-cell:nth-child(1)');
  if (vixCell) attachRiskTip(vixCell,
    'VIX — CBOE Volatility Index',
    'Measures expected 30-day volatility of the S&P 500 derived from options prices. Known as the "fear gauge." Above 30 = high stress. Below 18 = complacency.',
    'A VIX spike above 25 mid-session signals institutional hedging activity — often precedes sharp moves in risk assets and FX.'
  );

  const moveCell = document.querySelector('#section-risk .risk-cell:nth-child(2)');
  if (moveCell) attachRiskTip(moveCell,
    'MOVE Index — ICE BofA',
    'Bond market equivalent of VIX. Measures expected 30-day volatility across US Treasuries (1M, 3M, 6M, 1Y options). Elevated MOVE = bond market uncertainty.',
    'MOVE > 120 signals bond stress that typically spills into FX. USD pairs become erratic when MOVE is elevated because rate expectations are unstable.'
  );

  const hyOasCell = document.querySelector('#section-risk .risk-cell:nth-child(3)');
  if (hyOasCell) attachRiskTip(hyOasCell,
    'US HY OAS — ICE BofA High Yield Option-Adjusted Spread',
    'The extra yield below-investment-grade (BB+/Ba1 and lower) US corporate bonds pay over Treasuries, adjusted for embedded call options. The standard institutional gauge of corporate credit-market stress — a distinct risk-off channel from equity vol (VIX) or bond vol (MOVE), and one that has historically led both into genuine credit events.',
    'Below ~350bp is the historically tight zone seen in calm, risk-on markets. Sustained widening past ~500bp has coincided with credit-stress episodes (2015 energy HY, March 2020). Level alone can lag — pair with the HY OAS 20d Δ row below to catch the direction of travel.'
  );

  const igOasCell = document.querySelector('#section-risk .risk-cell:nth-child(4)');
  if (igOasCell) attachRiskTip(igOasCell,
    'US IG OAS — ICE BofA Investment Grade Option-Adjusted Spread',
    'The extra yield investment-grade (BBB-/Baa3 and higher) US corporate bonds pay over Treasuries, adjusted for embedded call options. The companion series to HY OAS — moves in IG confirm whether credit stress is broad-based or confined to junk-rated issuers.',
    'Below ~100bp is a historically tight reading (bottom-decile territory in the post-2009 era). Widening past ~150bp signals credit conditions tightening even for higher-quality issuers, typically alongside a rising HY-IG differential.'
  );

  const hvCell = document.querySelector('#section-risk .risk-cell:nth-child(5)');
  if (hvCell) attachRiskTip(hvCell,
    'EUR/USD Historical Volatility (30d)',
    'Realized volatility of EUR/USD over the past 30 days, calculated from daily log returns. Not a forecast — it measures what actually happened. Useful for sizing positions.',
    'If HV 30d is 8% and your stop is 100 pips on EUR/USD (≈0.86%), that stop is ~1σ for the current regime. Below 7% = quiet market, above 12% = trending/stressed.'
  );

  const regCell = document.querySelector('#section-risk .risk-cell:nth-child(6)');
  if (regCell) attachRiskTip(regCell,
    'Market Regime',
    'Composite live assessment: VIX level (primary driver), yield curve shape, gold intraday demand (>2% = stress signal), S&P 500 daily move (< -1.5% = stress), MOVE index (>100 = elevated per BofA/ICE), AUD/JPY intraday move (the canonical cross-asset risk barometer — sharp selloff >-1.5% = risk-off signal), USD/JPY (yen safe-haven bid), and HY OAS 20-day change (>+15bp widening = credit-market stress, often leads equity vol). Updates in real time.',
    'RISK-ON: VIX <18, no stress signals active. MIXED: 1 stress factor (e.g. VIX 18–25, or credit spreads widening while VIX stays calm). CAUTION: 2–3 factors. RISK-OFF: 4+ factors — high stress, USD/JPY/CHF bid, equities sold. Note: AUD/USD and NZD/USD falling modestly in isolation is normal when CBs diverge (RBA/RBNZ cuts) — AUD/JPY captures risk sentiment more cleanly.'
  );

  const riRows = document.querySelectorAll('#risk-indicators-tbody tr');
  const riTips = [
    {
      title: 'US–EU Spread 10Y',
      body:  'Difference between US 10-year Treasury yield and German 10-year Bund yield (in basis points). Measures relative monetary policy divergence between the Fed and ECB.',
      ex:    'Spread > +100bp historically supports USD. Narrowing spread (ECB hiking or Fed cutting) tends to push EUR/USD higher.'
    },
    {
      title: 'Gold / SPX Ratio',
      body:  'Price of gold divided by the S&P 500 level. Rising ratio = investors moving from risk assets to safe havens. Falling ratio = risk appetite dominant.',
      ex:    'Ratio > 0.8 and rising historically aligns with USD strength (safe-haven flows), JPY appreciation, and commodity currency weakness.'
    },
    {
      title: 'HY OAS 20-day Change',
      body:  'Change in the ICE BofA US High Yield Option-Adjusted Spread over the last ~20 trading days. Captures direction, not just level — spreads can be historically tight yet still be widening, which the level alone would miss. Widening >15bp feeds into the Regime score above as a stress point.',
      ex:    'Widening (positive Δ) while equities are calm is often an early credit-market warning that leads risk-off moves in FX by weeks. Narrowing confirms improving risk appetite alongside a low VIX.'
    },
    {
      title: 'USD/JPY vs VIX — 60d Correlation',
      body:  'Rolling 60-day Pearson correlation between USD/JPY and VIX, computed from real price data. Normally negative (−0.3 to −0.7): when VIX spikes (risk-off), JPY is bid and USD/JPY falls. A positive reading is unusual.',
      ex:    'Positive correlation means USD and volatility are rising together — typically a USD funding stress episode (2020, 2008). Neutral (near 0) means the relationship has broken down temporarily.'
    },
    {
      title: 'DXY vs SPX — 60d Correlation',
      body:  'Rolling 60-day Pearson correlation between the Dollar Index and S&P 500. The normal relationship is negative: risk-on rallies tend to weaken USD, risk-off bids USD as safe haven.',
      ex:    'Positive reading (both rising together) = USD funding stress or stagflation regime. Sustained positive correlation above +0.3 has preceded episodes of EM FX stress and sharp USD squeezes.'
    },
    {
      title: 'Gold vs DXY — 60d Correlation',
      body:  'Rolling 60-day Pearson correlation between Gold and the Dollar Index. The normal relationship is negative: Gold is priced in USD, so a stronger dollar typically suppresses gold prices.',
      ex:    'Persistent positive correlation means gold is rallying despite USD strength — a signal of real inflation demand, central bank buying, or deep safe-haven flows that override the USD pricing mechanism.'
    },
  ];
  riRows.forEach((row, i) => {
    if (riTips[i]) attachRiskTip(row, riTips[i].title, riTips[i].body, riTips[i].ex);
  });

  const ysRows = document.querySelectorAll('#yield-spreads-tbody tr');
  const ysTips = [
    {
      title: '2Y–10Y Spread (US)',
      body:  'Difference between US 10-year and 2-year Treasury yields. Positive = normal curve (growth expected). Negative = inverted curve (recession signal).',
      ex:    'Inversion sustained > 3 months has preceded every US recession since 1980. When disinversion begins (curve steepening), USD typically weakens as Fed cut bets increase.'
    },
    {
      title: 'US–DE 10Y Spread',
      body:  'Difference between US and German 10-year yields. Reflects Fed vs ECB policy divergence. Wide positive spread = USD yield advantage, typically bearish for EUR/USD.',
      ex:    'Spread above +150bp historically coincides with EUR/USD below 1.05. Compression below +100bp tends to support EUR/USD recovery.'
    },
    {
      title: 'US–JP 10Y Spread',
      body:  'Difference between US and Japanese 10-year yields. Wide spread = USD yield advantage over JPY. Drives carry trade flows into USD/JPY.',
      ex:    'Spread > +350bp = strong carry incentive to be long USD/JPY. BoJ YCC adjustments that lift JGB yields compress this spread rapidly, causing sharp JPY strength.'
    },
  ];
  ysRows.forEach((row, i) => {
    if (ysTips[i]) attachRiskTip(row, ysTips[i].title, ysTips[i].body, ysTips[i].ex);
  });

  const skewHead = document.querySelector('table[aria-label="COT-derived directional positioning bias per pair"] thead tr');
  if (skewHead) attachRiskTip(skewHead,
    'Positioning Bias — ETF IV + COT + 25d RR',
    'ATM implied volatility from CBOE-listed FX ETF options (FXE, FXB, FXY, FXA) — nearest expiry ≥4 days. ETF IV is the closest free proxy for OTC interbank implied vol (not publicly available). COT bias from CFTC TFF · Leveraged Funds · Options+Futures Combined. 25-delta Risk Reversal from Saxo Bank public options page (1M tenor, indicative mid) — positive = calls bid over puts (upside skew on base currency); negative = puts bid (downside protection dominant).',
    'ETF options are less liquid than OTC interbank FX options — ATM IV may diverge 1–5 vol points from true OTC levels. RR from Saxo is indicative mid-market, updated during European hours; treat as directional context, not a tradeable quote. Direction signal always comes from Leveraged Funds net positioning (most reactive speculative category in CFTC data).'
  );
  const skewRows = document.querySelectorAll('#skew-tbody tr');
  skewRows.forEach(row => {
    row.querySelectorAll('td').forEach(td => {
      const title = td.dataset.tipTitle || '';
      const body  = td.dataset.tipBody  || '';
      const ex    = td.dataset.tipEx    || '';
      if (!title && !body) return;
      attachRiskTip(td, title, body, ex);
    });

    const rrChip = row.querySelector('[data-rr-tip-title]');
    if (rrChip) {
      const rrTitle = rrChip.dataset.rrTipTitle || '';
      const rrBody  = rrChip.dataset.rrTipBody  || '';
      if (rrTitle || rrBody) attachRiskTip(rrChip, rrTitle, rrBody, '');
    }
  });
}

async function fetchRiskData() {
  const byId = {};
  try {
    const [usdExt, eurExt, jpyExt] = await Promise.all([
      fetch('./extended-data/USD.json').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('./extended-data/EUR.json').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('./extended-data/JPY.json').then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (usdExt?.data) {
      const d = usdExt.data;
      const repo = (v) => ({ close: v, open: v, chg: 0, pct: 0, fromRepo: true });
      if (d.vix    != null && d.vix > 5 && d.vix < 100)            byId.vix   = repo(d.vix);
      if (d.bond10y != null && !isNaN(d.bond10y))                   byId.us10y = repo(d.bond10y);
      if (d.bond2y  != null && !isNaN(d.bond2y)  && d.bond2y > 0)  byId.us2y  = repo(d.bond2y);
      if (d.bond5y  != null && !isNaN(d.bond5y)  && d.bond5y > 0)  byId.us5y  = repo(d.bond5y);
      if (d.hyOas != null && !isNaN(d.hyOas) && d.hyOas > 0)        byId.hyOas = repo(d.hyOas * 100);
      if (d.igOas != null && !isNaN(d.igOas) && d.igOas > 0)        byId.igOas = repo(d.igOas * 100);
      if (d.hyOasDelta20d != null && !isNaN(d.hyOasDelta20d))       byId.hyOasDelta20d = d.hyOasDelta20d * 100;
      if (d.igOasDelta20d != null && !isNaN(d.igOasDelta20d))       byId.igOasDelta20d = d.igOasDelta20d * 100;
    }
    if (eurExt?.data?.bond10y != null) byId.de10y = { close: eurExt.data.bond10y, chg: 0, pct: 0, fromRepo: true };
    if (jpyExt?.data?.bond10y != null) byId.jp10y = { close: jpyExt.data.bond10y, chg: 0, pct: 0, fromRepo: true };
  } catch {}

  const _intradayData = await loadIntradayQuotes();
  if (_intradayData) {
    const _iq = (id) => intradayQuote(_intradayData, id);
    const _set = (id, guard) => { const q = _iq(id); if (q && guard(q.close)) byId[id] = q; };
    _set('vix',   v => v > 5 && v < 100);
    _set('us10y', v => v > 0 && v < 20);
    _set('us3m',  v => v > 0 && v < 20);
    _set('us2y',  v => v > 0 && v < 20);
    _set('us5y',  v => v > 0 && v < 20);
    _set('us30y', v => v > 0 && v < 20);
    _set('dxy',   v => v > 50 && v < 130);
    _set('move',  v => v > 10 && v < 400);
    _set('gold',  v => v > 500 && v < 10000);
    _set('spx',   v => v > 1000 && v < 20000);
  }

  renderRiskData(byId);

  if (_intradayData) {
    const _enrich2 = (id, guard) => { const q = intradayQuote(_intradayData, id); if (q && guard(q.close)) byId[id] = q; };
    _enrich2('vix',    v => v > 5 && v < 100);
    _enrich2('us10y',  v => v > 0 && v < 20);
    _enrich2('us2y',   v => v > 0 && v < 20);
    _enrich2('us3m',   v => v > 0 && v < 20);
    _enrich2('us5y',   v => v > 0 && v < 20);
    _enrich2('us30y',  v => v > 0 && v < 20);
    _enrich2('dxy',    v => v > 50 && v < 130);
    _enrich2('move',   v => v > 10 && v < 400);
    _enrich2('gold',   v => v > 500 && v < 10000);
    _enrich2('spx',    v => v > 1000 && v < 20000);
    _enrich2('audjpy', v => v > 50 && v < 150);
    _enrich2('usdjpy', v => v > 80 && v < 200);
  }

  await renderRiskData(byId);
}

async function renderRiskData(byId) {
  const _rd = new Date().getUTCDay(), _rh = new Date().getUTCHours();
  const isWeekend = _rd === 6 || (_rd === 0 && _rh < 21) || (_rd === 5 && _rh >= 21);
  const weekendNote = isWeekend ? ' (last close)' : '';

  if (byId.vix) {
    const vix = byId.vix.close;
    const cls = vix > 30 ? 'risk-val down' : vix > 25 ? 'risk-val down' : vix > 18 ? 'risk-val warning' : 'risk-val up';  
    setEl('risk-vix', vix.toFixed(1), cls);
    const signal = vix > 30 ? 'High' : vix > 25 ? 'Elevated' : vix > 18 ? 'Moderate' : 'Low';
    const chg = byId.vix.chg || 0;
    const arrow = chg > 0 ? '▲' : chg < 0 ? '▼' : '→';
    const chgStr = (chg >= 0 ? ' +' : ' ') + chg.toFixed(1);
    const srcNote = byId.vix.fromRepo ? ' · FRED' : ' · CBOE';
    setEl('risk-vix-sub', arrow + chgStr + ' · ' + signal + srcNote);
    STOOQ_RT_CACHE['vix'] = {
      close:        byId.vix.close,
      open:         byId.vix.open  ?? (byId.vix.prev_close ?? byId.vix.close),
      high:         byId.vix.high  ?? byId.vix.close,
      low:          byId.vix.low   ?? byId.vix.close,
      prev_close:   byId.vix.prev_close ?? null,
      chg:          byId.vix.chg  ?? null,
      pct:          byId.vix.pct  ?? null,
      market_state: byId.vix.market_state ?? null,
      market_time:  byId.vix.market_time  ?? null,
    };
    _lwUpdateTodayBar();
  } else {
    setEl('risk-vix', '—', 'risk-val');
    setEl('risk-vix-sub', 'CBOE · unavailable');
  }

  const move = (byId.move && byId.move.close > 10) ? byId.move : null;

  {
    if (move && move.close > 10) {
      const cls = move.close > 120 ? 'risk-val down' : move.close > 100 ? 'risk-val warning' : 'risk-val up';
      setEl('risk-move', move.close.toFixed(1), cls);
      const signal = move.close > 120 ? 'High' : move.close > 100 ? 'Elevated' : 'Low';
      const arrow = move.chg > 0 ? '▲' : move.chg < 0 ? '▼' : '→';
      const chgStr = (move.chg >= 0 ? ' +' : ' ') + move.chg.toFixed(1);
      setEl('risk-move-sub', arrow + chgStr + ' · ' + signal + ' · ICE BofA');
      STOOQ_RT_CACHE['move'] = {
        close:        move.close,
        open:         move.open  ?? (move.prev_close ?? move.close),
        high:         move.high  ?? move.close,
        low:          move.low   ?? move.close,
        prev_close:   move.prev_close ?? null,
        chg:          move.chg  ?? null,
        pct:          move.pct  ?? null,
        market_state: move.market_state ?? null,
        market_time:  move.market_time  ?? null,
      };
      _lwUpdateTodayBar();
    } else if (byId.us10y) {
      const vixLevel = byId.vix ? byId.vix.close : 20;
      const approx = Math.round(vixLevel * 4.5);  
      const cls = approx > 150 ? 'risk-val down' : approx > 100 ? 'risk-val warning' : 'risk-val up';
      setEl('risk-move', approx.toString(), cls);
      setEl('risk-move-sub', 'Bond vol · estimated');
    } else {
      setEl('risk-move', '—', 'risk-val');
      setEl('risk-move-sub', 'ICE BofA · unavailable');
    }
  }

  if (byId.hyOas) {
    const hy = byId.hyOas.close;
    const cls = hy > 500 ? 'risk-val down' : hy > 350 ? 'risk-val warning' : 'risk-val up';
    setEl('risk-hyoas', Math.round(hy) + ' bp', cls);
    const signal = hy > 500 ? 'Wide' : hy > 350 ? 'Moderate' : 'Tight';
    if (byId.hyOasDelta20d != null) {
      const d = byId.hyOasDelta20d;
      const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '→';
      const dStr = (d >= 0 ? ' +' : ' ') + Math.round(d) + 'bp';
      setEl('risk-hyoas-sub', arrow + dStr + ' · ' + signal + ' · ICE BofA');
    } else {
      setEl('risk-hyoas-sub', signal + ' · ICE BofA');
    }
  } else {
    setEl('risk-hyoas', '—', 'risk-val');
    setEl('risk-hyoas-sub', 'ICE BofA · unavailable');
  }

  if (byId.igOas) {
    const ig = byId.igOas.close;
    const cls = ig > 150 ? 'risk-val down' : ig > 100 ? 'risk-val warning' : 'risk-val up';
    setEl('risk-igoas', Math.round(ig) + ' bp', cls);
    const signal = ig > 150 ? 'Wide' : ig > 100 ? 'Moderate' : 'Tight';
    if (byId.igOasDelta20d != null) {
      const d = byId.igOasDelta20d;
      const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '→';
      const dStr = (d >= 0 ? ' +' : ' ') + Math.round(d) + 'bp';
      setEl('risk-igoas-sub', arrow + dStr + ' · ' + signal + ' · ICE BofA');
    } else {
      setEl('risk-igoas-sub', signal + ' · ICE BofA');
    }
  } else {
    setEl('risk-igoas', '—', 'risk-val');
    setEl('risk-igoas-sub', 'ICE BofA · unavailable');
  }

  if (byId.hyOasDelta20d != null) {
    const delta = byId.hyOasDelta20d;
    const bp = Math.round(delta);
    const sign = bp >= 0 ? '+' : '';
    setEl('ri-hyoas-delta', sign + bp + 'bp');
    const sig = bp > 15 ? 'Widening (risk-off)' : bp < -15 ? 'Narrowing (risk-on)' : 'Stable';
    const cls = bp > 15 ? 'down' : bp < -15 ? 'up' : 'flat';
    setEl('ri-hyoas-delta-sig', sig, cls);
  } else {
    setEl('ri-hyoas-delta', '—');
    setEl('ri-hyoas-delta-sig', 'No data', 'flat');
  }

  {
    const eurusdHV = STOOQ_RT_CACHE['eurusd']?.hv30 ?? null;
    if (eurusdHV != null && eurusdHV > 1 && eurusdHV < 40) {
      const cls = eurusdHV > 10 ? 'risk-val down' : eurusdHV > 7 ? 'risk-val' : 'risk-val up';
      setEl('risk-eurusd-iv', eurusdHV.toFixed(1) + '%', cls);
      const signal = eurusdHV > 10 ? 'Stress elevated' : eurusdHV > 7 ? 'Moderate' : 'Low vol';
      setEl('risk-eurusd-iv-sub', signal + ' · HV 30d');
    } else if (byId.vix) {
      const estIV = (byId.vix.close * 0.22).toFixed(1);
      const fNum = parseFloat(estIV);
      const cls = fNum > 10 ? 'risk-val down' : fNum > 7 ? 'risk-val' : 'risk-val up';
      setEl('risk-eurusd-iv', estIV + '%', cls);
      const ivSig = fNum > 10 ? 'Stress elevated' : fNum > 7 ? 'Moderate' : 'Low vol';
      const vixSrc = byId.vix.fromRepo ? ' · est via FRED VIX' : ' · est via VIX';
      setEl('risk-eurusd-iv-sub', ivSig + vixSrc);
    } else {
      setEl('risk-eurusd-iv-sub', 'HV 30d · unavailable');
    }
  }

  if (byId.us10y) {
    const y10 = byId.us10y.close, chg = byId.us10y.chg;
    const _usEl = document.getElementById('q-us10y');
    const _uscEl = document.getElementById('qc-us10y');
    if (_usEl) { _usEl.textContent = y10.toFixed(2) + '%'; _usEl.className = 'q-price ' + (chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat'); }
    if (_uscEl) { _uscEl.textContent = byId.us10y.fromRepo ? '—' : pctStr(byId.us10y.pct); _uscEl.className = 'q-chg flat'; }
  }
  if (byId.dxy) {
    const dxy = byId.dxy.close, chg = byId.dxy.chg;
    const clsD = chg > 0.05 ? 'up' : chg < -0.05 ? 'down' : 'flat';
    const dEl = document.getElementById('q-dxy');
    const dcEl = document.getElementById('qc-dxy');
    if (dEl) { dEl.textContent = dxy.toFixed(1); dEl.className = 'q-price ' + clsDir(chg); }
    if (dcEl) { dcEl.textContent = pctStr(byId.dxy.pct); dcEl.className = 'q-chg ' + clsDir(chg); }
  }

  const short2 = byId.us2y || byId.us3m;
  if (byId.us10y && short2) {
    const y10  = byId.us10y.close;
    const y2   = short2.close;
    const spr  = y10 - y2;
    const bp   = (spr * 100).toFixed(0);
    const cls  = spr < 0 ? 'down' : 'up';
    const sign = spr >= 0 ? '+' : '';
    setEl('ys-2-10', sign + bp + 'bp', cls);
    setEl('ys-2-10-sig', spr < 0 ? 'Inverted' : 'Normal', cls);
  }

  if (byId.de10y && byId.us10y) {
    const spread = byId.us10y.close - byId.de10y.close;
    const bp2 = (spread * 100).toFixed(0);
    const sign2 = spread >= 0 ? '+' : '';
    setEl('ys-usde', sign2 + bp2 + 'bp');
    setEl('ys-usde-sig', spread > 0 ? 'US Premium' : 'DE Premium');
    setEl('ri-us-eu', sign2 + bp2 + 'bp');
    setEl('ri-us-eu-sig', spread > 100/100 ? 'USD+' : spread < -50/100 ? 'EUR+' : 'Neutral', spread > 1 ? 'up' : spread < -0.5 ? 'down' : 'flat');
  }

  if (byId.jp10y && byId.us10y) {
    const spreadJP = byId.us10y.close - byId.jp10y.close;
    const bpJP = (spreadJP * 100).toFixed(0);
    const signJP = spreadJP >= 0 ? '+' : '';
    setEl('ys-usjp', signJP + bpJP + 'bp');
    setEl('ys-usjp-sig', spreadJP > 0 ? 'US Premium' : 'JP Premium');
  }

  if (byId.us3m) {
    const v = byId.us3m.close, chg = byId.us3m.chg;
    setEl('rate-3m', v.toFixed(2) + '%', 'rate-val');
    setEl('rate-3m-chg', (chg >= 0 ? '+' : '') + (chg*100).toFixed(1) + 'bp', chg > 0 ? 'rate-chg up' : chg < 0 ? 'rate-chg down' : 'rate-chg flat');
  }
  if (byId.us2y) {
    const v = byId.us2y.close, chg = byId.us2y.chg;
    setEl('rate-2y', v.toFixed(2) + '%', 'rate-val');
    setEl('rate-2y-chg', byId.us2y.fromRepo ? '—' : (chg >= 0 ? '+' : '') + (chg*100).toFixed(1) + 'bp', chg > 0 ? 'rate-chg up' : chg < 0 ? 'rate-chg down' : 'rate-chg flat');
  }
  if (byId.us5y) {
    const v = byId.us5y.close, chg = byId.us5y.chg;
    setEl('rate-5y', v.toFixed(2) + '%', 'rate-val');
    setEl('rate-5y-chg', byId.us5y.fromRepo ? '—' : (chg >= 0 ? '+' : '') + (chg*100).toFixed(1) + 'bp', chg > 0 ? 'rate-chg up' : chg < 0 ? 'rate-chg down' : 'rate-chg flat');
  }
  if (byId.us10y) {
    const v = byId.us10y.close, chg = byId.us10y.chg;
    setEl('rate-10y', v.toFixed(2) + '%', 'rate-val');
    setEl('rate-10y-chg', byId.us10y.fromRepo ? '—' : (chg >= 0 ? '+' : '') + (chg*100).toFixed(1) + 'bp', chg > 0 ? 'rate-chg up' : chg < 0 ? 'rate-chg down' : 'rate-chg flat');
  }

  const REAL_TENORS = [
    { label:'3M',  key:'us3m'  },
    { label:'2Y',  key:'us2y'  },
    { label:'5Y',  key:'us5y'  },
    { label:'10Y', key:'us10y' },
    { label:'30Y', key:'us30y' },
  ];
  const realPoints = REAL_TENORS
    .map(t => ({ label: t.label, val: byId[t.key]?.close ?? null }))
    .filter(p => p.val !== null);

  const priorPoints = REAL_TENORS
    .map(t => {
      const q = byId[t.key];
      const prev = q?.prev_close ?? null;
      return prev != null ? { label: t.label, val: prev } : null;
    })
    .filter(Boolean);

  if (priorPoints.length >= 3 && STATIC_YIELDS === null) {
    const pLookup = {};
    priorPoints.forEach(p => { pLookup[p.label] = p.val; });
    STATIC_YIELDS = STATIC_LABELS.map(l => pLookup[l] ?? null);
  }

  window._STATE_ycTenors = REAL_TENORS.map(t => ({
    label:      t.label,
    close:      byId[t.key]?.close ?? null,
    prev_close: byId[t.key]?.prev_close ?? null,
    chg:        (byId[t.key]?.fromRepo || byId[t.key]?.prev_close == null) ? null : (byId[t.key]?.chg ?? null),
    fromRepo:   byId[t.key]?.fromRepo ?? false,
  })).filter(t => t.close !== null);

  if (realPoints.length >= 2) {
    drawYieldCurveAndCache(realPoints, priorPoints.length >= 2 ? priorPoints : null);
  } else {
    drawYieldCurveAndCache(null, null);
  }

  if (byId.vix) {
    const vix = byId.vix.close;
    const isInverted = byId.us10y && byId.us3m && (byId.us10y.close < byId.us3m.close);

    let stressScore = 0;
    if (vix > 30) stressScore += 3;
    else if (vix > 25) stressScore += 2;
    else if (vix > 18) stressScore += 1;
    if (isInverted) stressScore += 1;
    if (byId.gold && byId.gold.pct > 2.0) stressScore += 1;
    if (byId.spx && byId.spx.pct < -1.5) stressScore += 1;
    if (byId.move && byId.move.close > 100) stressScore += 1;
    if (byId.audjpy && byId.audjpy.pct < -1.5) stressScore += 1;
    if (byId.usdjpy && byId.usdjpy.pct < -1.0 && byId.audjpy && byId.audjpy.pct < -0.5) stressScore += 1;
    if (byId.hyOasDelta20d != null && byId.hyOasDelta20d > 15) stressScore += 1;

    let regime, regimeSub;
    if (stressScore >= 4)      { regime = 'RISK-OFF'; regimeSub = `High stress · VIX ${vix.toFixed(1)}`; }
    else if (stressScore >= 2) { regime = 'CAUTION';  regimeSub = `Elevated volatility · VIX ${vix.toFixed(1)}`; }
    else if (stressScore === 1){ regime = 'MIXED';    regimeSub = `Mixed signals · VIX ${vix.toFixed(1)}`; }
    else                       { regime = 'RISK-ON';  regimeSub = `Risk appetite active · VIX ${vix.toFixed(1)}`; }
    if (isInverted && regime !== 'RISK-OFF') regimeSub += ' · inverted curve';

    const regEl = document.getElementById('risk-regime');
    if (regEl) {
      regEl.textContent = regime;
      regEl.className = 'risk-val ' + (regime === 'RISK-ON' ? 'up' : regime === 'RISK-OFF' ? 'down' : '');
      regEl.style.opacity = '';
    }
    setEl('risk-regime-sub', regimeSub);

    const narrTextEl = document.getElementById('narrative-text');
    if (narrTextEl && _narrativeGeneratedAt) {
      const _narrTsD = new Date(_narrativeGeneratedAt);
      const _narrTz = _narrTsD.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
      const narrTsLabel = 'Updated ' + _narrTsD.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) + ' ' + _narrTz;
      const aiMismatchNote = (_narrativeAiRegime && _narrativeAiRegime !== regime)
        ? ` · Narrative written under ${_narrativeAiRegime} (conditions changed since generation)`
        : '';
      narrTextEl.title = narrTsLabel + aiMismatchNote;
    }
  }

  const yieldSub = document.getElementById('yield-panel-sub');
  if (yieldSub) {
    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
    const yieldSrc = (byId.us2y && !byId.us2y.fromRepo) ? 'Live ~5min delay' : 'FRED DGS2 · daily batch';
    yieldSub.textContent = 'Nominal yields · ' + yieldSrc + ' · updated ' + hhmm + ' ' + tzAbbr;
  }

  loadIntradayQuotes().then(_freshData => {
    try {
      const corrs = _freshData?.correlations;
      if (!Array.isArray(corrs)) return;
      const entry = corrs.find(c =>
        (c.a === 'USD/JPY' && c.b === 'VIX') || (c.a === 'VIX' && c.b === 'USD/JPY')
      );
      if (entry?.corr != null) {
        const v = entry.corr;
        const sign = v >= 0 ? '+' : '';
        const corrLabel = sign + v.toFixed(2) + 'r';
        const corrSig = v < -0.3 ? 'Normal (risk-off)' : v > 0.3 ? 'Unusual' : 'Neutral';
        const corrCls = v < -0.3 ? 'up' : v > 0.3 ? 'down' : 'flat';
        setEl('ri-usdjpy-nk', corrLabel);
        setEl('ri-usdjpy-nk-sig', corrSig, corrCls);
      } else {
        setEl('ri-usdjpy-nk', '—');
        setEl('ri-usdjpy-nk-sig', 'No data', 'flat');
      }

      const dxySpxEntry = corrs.find(c =>
        (c.a === 'DXY' && c.b === 'SPX') || (c.a === 'SPX' && c.b === 'DXY')
      );
      if (dxySpxEntry?.corr != null) {
        const v = dxySpxEntry.corr;
        const sign = v >= 0 ? '+' : '';
        const corrLabel = sign + v.toFixed(2) + 'r';
        const corrSig = v > 0.3 ? 'Stress break' : v < -0.3 ? 'Normal' : 'Neutral';
        const corrCls = v > 0.3 ? 'down' : v < -0.3 ? 'up' : 'flat';
        setEl('ri-dxy-spx', corrLabel);
        setEl('ri-dxy-spx-sig', corrSig, corrCls);
      } else {
        setEl('ri-dxy-spx', '—');
        setEl('ri-dxy-spx-sig', 'No data', 'flat');
      }

      const goldDxyEntry = corrs.find(c =>
        (c.a === 'Gold' && c.b === 'DXY') || (c.a === 'DXY' && c.b === 'Gold')
      );
      if (goldDxyEntry?.corr != null) {
        const v = goldDxyEntry.corr;
        const sign = v >= 0 ? '+' : '';
        const corrLabel = sign + v.toFixed(2) + 'r';
        const corrSig = v > 0.3 ? 'Inflation bid' : v < -0.3 ? 'Normal' : 'Neutral';  
        const corrCls = v > 0.3 ? 'down' : v < -0.3 ? 'up' : 'flat';
        setEl('ri-gold-dxy', corrLabel);
        setEl('ri-gold-dxy-sig', corrSig, corrCls);
      } else {
        setEl('ri-gold-dxy', '—');
        setEl('ri-gold-dxy-sig', 'No data', 'flat');
      }
    } catch {}
  }).catch(() => {});

  const riskSub = document.getElementById('risk-panel-sub');
  if (riskSub) {
    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
    riskSub.textContent = 'VIX · MOVE · HV30 · ~5min delay · updated ' + hhmm + ' ' + tzAbbr;
  }

  renderVarCvarPanel();
}

async function renderVarCvarPanel() {
  const container = document.getElementById('var-cvar-tbody');
  if (!container) return;

  const intra = await loadIntradayQuotes().catch(() => null);
  const vc = intra?.var_cvar;

  if (!vc || !Object.keys(vc).length) {
    container.innerHTML = '<tr style="display:table;width:100%;table-layout:fixed;"><td colspan="5" style="color:var(--text3);padding:6px 8px;font-size:10px;">VaR data not yet available — runs with daily engine update</td></tr>';
    return;
  }

  const ROWS = [
    { id:'eurusd', label:'EUR/USD',  pip: 0.0001, tip:'Most liquid FX pair. VaR reflects daily move risk in EUR terms. Benchmark for G10 vol regime.' },
    { id:'gbpusd', label:'GBP/USD',  pip: 0.0001, tip:'Cable. Higher vol than EUR/USD; sensitive to UK macro and BoE policy divergence vs Fed.' },
    { id:'usdjpy', label:'USD/JPY',  pip: 0.01,   tip:'Key risk-sentiment pair. Yen acts as safe-haven; elevated VaR signals risk-off pressure or BoJ intervention risk.' },
    { id:'audusd', label:'AUD/USD',  pip: 0.0001, tip:'Commodity and China-proxy currency. VaR spikes with commodity sell-offs or CNY stress.' },
    { id:'usdchf', label:'USD/CHF',  pip: 0.0001, tip:'Swiss franc is a safe-haven. Low VaR in calm markets; can gap sharply on SNB intervention or crisis flows.' },
    { id:'usdcad', label:'USD/CAD',  pip: 0.0001, tip:'Petro-currency pair. VaR driven by WTI moves and BoC vs Fed policy divergence.' },
    { id:'nzdusd', label:'NZD/USD',  pip: 0.0001, tip:'Highest-beta G10 pair. Sensitive to risk appetite, dairy prices, and RBNZ rate path.' },
    { id:'gold',   label:'XAU/USD',  pip: 0.1,    tip:'Safe-haven and inflation hedge. Tail events can move 2-3% in a session; ES/VaR ratio often elevated.' },
    { id:'spx',    label:'SPX',      pip: 1,       tip:'S&P 500 index. Cross-asset risk anchor - SPX vol regime drives correlated moves across G10 pairs.' },
    { id:'dxy',    label:'DXY',      pip: 0.01,   tip:'USD index vs G6 basket. VaR here captures broad dollar vol, useful as normalisation benchmark for FX pairs.' },
    { id:'vix',    label:'VIX',      pip: 0.01,   tip:'CBOE Volatility Index. VaR on VIX itself measures how much implied vol can move in a day - a vol-of-vol indicator.' },
  ];

  container.innerHTML = ROWS.map(row => {
    const d = vc[row.id];
    if (!d) return '';

    const var95  = d.var_pct;
    const cvar95 = d.cvar_pct;
    const v60    = d.var60_pct;

    const stressed = v60 != null && var95 > 0 && (v60 / var95) > 1.25;
    const ratio = (var95 > 0) ? (cvar95 / var95) : null;
    const ratioCls = ratio == null ? '' : ratio > 2 ? 'down' : ratio > 1.5 ? '' : 'up';

    const varCls = var95 > 1.0 ? 'down' : var95 > 0.5 ? '' : 'up';
    const stressFlag = stressed
      ? `<span title="60d VaR (${v60?.toFixed(3)}%) elevated vs 252d baseline — regime stress" style="color:var(--amber,#EF9F27);margin-left:3px;font-size:9px;">⚠</span>`
      : '';

    return `<tr style="display:table;width:100%;table-layout:fixed;">
      <td title="${row.tip}" style="font-family:var(--font-mono);font-size:10px;white-space:nowrap;cursor:default;">${row.label}</td>
      <td class="${varCls}" style="font-family:var(--font-mono);font-size:10px;text-align:right;">${var95.toFixed(3)}%${stressFlag}</td>
      <td style="font-family:var(--font-mono);font-size:10px;text-align:right;color:var(--text2);">${cvar95.toFixed(3)}%</td>
      <td class="${ratioCls}" style="font-family:var(--font-mono);font-size:10px;text-align:right;">${ratio != null ? ratio.toFixed(2) + 'x' : '—'}</td>
      <td style="font-family:var(--font-mono);font-size:10px;text-align:right;color:var(--text3);">${d.n}</td>
    </tr>`;
  }).filter(Boolean).join('');
}

const STATIC_LABELS = ['3M','2Y','5Y','10Y','30Y'];
let STATIC_YIELDS = null;
let _lastDrawnYields = null; 
let _lastDrawnPrior  = null; 

function _crSplinePath(ctx, pts) {
  if (pts.length < 2) return;
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) { ctx.lineTo(pts[1][0], pts[1][1]); return; }
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
  }
}

function drawYieldCurveAndCache(points, priorPoints) {
  _lastDrawnYields = points;
  _lastDrawnPrior  = priorPoints || null;
  drawYieldCurve(points, priorPoints);
}

function drawYieldCurve(points, priorPoints) {
  const canvas = document.getElementById('yield-canvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth - 20, H = 100;
  if (W <= 0) return;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  let labels, vals, isLive;
  if (points && points.length >= 2) {
    labels = points.map(p => p.label);
    vals   = points.map(p => p.val);
    isLive = true;
  } else if (STATIC_YIELDS) {
    labels = STATIC_LABELS;
    vals   = STATIC_YIELDS;
    isLive = false;
  } else {
    labels = STATIC_LABELS;
    vals   = [null, null, null, null, null];
    isLive = false;
  }

  let prevVals;
  if (priorPoints && priorPoints.length >= 2) {
    const priorLookup = {};
    priorPoints.forEach(p => { priorLookup[p.label] = p.val; });
    prevVals = labels.map(l => priorLookup[l] ?? null);
  } else {
    prevVals = labels.map(() => null);   
  }

  const n = labels.length;
  const validV = vals.filter(v => v != null && !isNaN(v));
  const rawMin = validV.length ? Math.min(...validV, ...prevVals.filter(Boolean)) : 4.10;
  const rawMax = validV.length ? Math.max(...validV, ...prevVals.filter(Boolean)) : 5.40;
  const minY = Math.floor(rawMin * 4) / 4 - 0.15;
  const maxY = Math.ceil(rawMax  * 4) / 4 + 0.15;
  const yRange = maxY - minY || 1;

  const PAD_L=32, PAD_R=8, PAD_T=12, PAD_B=20;
  const cW=W-PAD_L-PAD_R, cH=H-PAD_T-PAD_B;
  const px = i => PAD_L+(i/(n-1))*cW;
  const py = v => PAD_T+(1-(v-minY)/yRange)*cH;

  const _tc = v => _themeColor(v);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=_tc('--bg'); ctx.fillRect(0,0,W,H);

  const step = yRange <= 0.5 ? 0.1 : yRange <= 1 ? 0.25 : 0.5;
  const gridStart = Math.ceil(minY / step) * step;
  for (let v = gridStart; v <= maxY + 0.001; v = Math.round((v + step) * 1000) / 1000) {
    const y = py(v);
    ctx.strokeStyle=_tc('--border'); ctx.lineWidth=0.5; ctx.setLineDash([2,4]);
    ctx.beginPath(); ctx.moveTo(PAD_L,y); ctx.lineTo(W-PAD_R,y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=_tc('--text2'); ctx.font='bold 8px Courier New'; ctx.textAlign='right';
    ctx.fillText(v.toFixed(2)+'%', PAD_L-3, y+3);
  }

  const firstV = vals[0], lastV = vals[n-1];
  if (firstV != null && lastV != null && firstV > lastV) {
    ctx.fillStyle=_themeColorAlpha('--down', 0.07);
    ctx.fillRect(PAD_L, PAD_T, cW, cH);
  }

  const priorPts = prevVals.map((v,i) => v != null ? [px(i), py(v)] : null).filter(Boolean);
  if (priorPts.length >= 2) {
    ctx.beginPath(); ctx.strokeStyle=_tc('--text3'); ctx.lineWidth=1.3; ctx.setLineDash([4,3]);
    _crSplinePath(ctx, priorPts);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const curPts = vals.map((v,i) => v != null ? [px(i), py(v)] : null).filter(Boolean);
  if (curPts.length >= 2) {
    const grad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T+cH);
    grad.addColorStop(0,   _themeColorAlpha('--chart-line', 0.30));
    grad.addColorStop(0.7, _themeColorAlpha('--chart-line', 0.06));
    grad.addColorStop(1,   _themeColorAlpha('--chart-line', 0.00));
    ctx.beginPath();
    _crSplinePath(ctx, curPts);
    ctx.lineTo(curPts[curPts.length-1][0], PAD_T+cH);
    ctx.lineTo(PAD_L, PAD_T+cH);
    ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();

    ctx.beginPath();
    ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.strokeStyle=_tc('--chart-line'); ctx.lineWidth=2.2;
    _crSplinePath(ctx, curPts);
    ctx.stroke();

    vals.forEach((v, i) => {
      if (v == null) return;
      const x = px(i), y = py(v);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2);
      ctx.fillStyle=_tc('--chart-line'); ctx.fill();
      ctx.lineWidth=1.6; ctx.strokeStyle=_tc('--bg'); ctx.stroke();
    });
  }

  ctx.fillStyle=_tc('--text2'); ctx.font='bold 8.5px Courier New'; ctx.textAlign='center';
  labels.forEach((t,i) => ctx.fillText(t, px(i), H-5));

  ctx.textAlign='left';
  const legY = PAD_T-5;
  ctx.lineWidth=2; ctx.lineCap='round';
  ctx.strokeStyle=_tc('--chart-line'); ctx.beginPath(); ctx.moveTo(PAD_L,legY); ctx.lineTo(PAD_L+12,legY); ctx.stroke();
  ctx.fillStyle=_tc('--text2'); ctx.font='8px Courier New'; ctx.fillText('Current', PAD_L+16, legY+3);
  const legX2 = PAD_L+62;
  ctx.setLineDash([3,2]); ctx.lineWidth=1.3; ctx.strokeStyle=_tc('--text3');
  ctx.beginPath(); ctx.moveTo(legX2,legY); ctx.lineTo(legX2+12,legY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText('Prior', legX2+16, legY+3);
  if (!isLive) {
    ctx.fillStyle=_tc('--text3'); ctx.fillText('(static)', legX2+56, legY+3);
  } else {
    const spr = (vals[n-1] ?? 0) - (vals[0] ?? 0); 
    if (spr < 0) { ctx.fillStyle=_themeColorAlpha('--down', 0.7); ctx.fillText('■ Inverted', legX2+56, legY+3); }
  }

  const real2y  = vals[labels.indexOf('2Y')];
  const real3m  = vals[labels.indexOf('3M')];
  const real10y = vals[labels.indexOf('10Y')];
  const shortKey = real2y ?? real3m;
  if (shortKey != null && real10y != null) {
    const spread = real10y - shortKey;
    const bp = Math.round(spread * 100);
    const sign = bp >= 0 ? '+' : '';
    setEl('ys-2-10', sign + bp + 'bp', spread < 0 ? 'down' : 'up');
    setEl('ys-2-10-sig', spread < 0 ? 'Inverted' : 'Normal', spread < 0 ? 'down' : 'up');
  }
}

setTimeout(() => drawYieldCurveAndCache(null), 60);
window.addEventListener('resize', () => drawYieldCurve(_lastDrawnYields, _lastDrawnPrior));

const _OHLC_FULL_NAMES = {
  eurusd:'Euro / U.S. Dollar',   gbpusd:'British Pound / U.S. Dollar',
  usdjpy:'U.S. Dollar / Japanese Yen', audusd:'Australian Dollar / U.S. Dollar',
  usdcad:'U.S. Dollar / Canadian Dollar', usdchf:'U.S. Dollar / Swiss Franc',
  nzdusd:'New Zealand Dollar / U.S. Dollar', eurgbp:'Euro / British Pound',
  eurjpy:'Euro / Japanese Yen', eurchf:'Euro / Swiss Franc',
  eurcad:'Euro / Canadian Dollar', euraud:'Euro / Australian Dollar',
  eurnzd:'Euro / New Zealand Dollar', gbpjpy:'British Pound / Japanese Yen',
  gbpchf:'British Pound / Swiss Franc', gbpcad:'British Pound / Canadian Dollar',
  gbpaud:'British Pound / Australian Dollar', gbpnzd:'British Pound / New Zealand Dollar',
  audjpy:'Australian Dollar / Japanese Yen', audnzd:'Australian Dollar / New Zealand Dollar',
  audchf:'Australian Dollar / Swiss Franc', audcad:'Australian Dollar / Canadian Dollar',
  cadjpy:'Canadian Dollar / Japanese Yen', cadchf:'Canadian Dollar / Swiss Franc',
  nzdjpy:'New Zealand Dollar / Japanese Yen', nzdcad:'New Zealand Dollar / Canadian Dollar',
  nzdchf:'New Zealand Dollar / Swiss Franc', chfjpy:'Swiss Franc / Japanese Yen',
  gold:'Gold Futures', wti:'Crude Oil WTI Futures', btc:'Bitcoin / U.S. Dollar',
  us10y:'US 10Y Treasury Yield', spx:'S&P 500 Index', nasdaq:'Nasdaq Composite',
  nikkei:'Nikkei 225', stoxx:'Euro Stoxx 50', eth:'Ethereum / U.S. Dollar',
  dxy:'U.S. Dollar Index',
  vix:'CBOE Volatility Index',
  silver:'Silver Futures', brent:'Crude Oil Brent Futures',
  dax:'DAX Performance Index', ftse:'FTSE 100 Index',
  hsi:'Hang Seng Index', dji:'Dow Jones Industrial Average',
  usdnok:'U.S. Dollar / Norwegian Krone', usdsek:'U.S. Dollar / Swedish Krona',
  eurnok:'Euro / Norwegian Krone', eursek:'Euro / Swedish Krona',
  move:'ICE BofA MOVE Index',
  hyoas:'ICE BofA US High Yield Index OAS', igoas:'ICE BofA US Corporate Index OAS',
};

const _AREA_ONLY_IDS = new Set(['us10y', 'hyoas', 'igoas']);
function _effectiveChartType(ohlcId) {
  return _AREA_ONLY_IDS.has(ohlcId) ? 'area' : (window._lwChartType || 'candle');
}

const _TV_TO_OHLC = {
  'FX_IDC:EURUSD': 'eurusd',  'FX_IDC:USDJPY': 'usdjpy',
  'FX_IDC:GBPUSD': 'gbpusd',  'FX_IDC:AUDUSD': 'audusd',
  'FX_IDC:USDCAD': 'usdcad',  'FX_IDC:USDCHF': 'usdchf',
  'FX_IDC:NZDUSD': 'nzdusd',  'FX_IDC:EURGBP': 'eurgbp',
  'FX_IDC:EURJPY': 'eurjpy',  'FX_IDC:EURCHF': 'eurchf',
  'FX_IDC:EURCAD': 'eurcad',  'FX_IDC:EURAUD': 'euraud',
  'FX_IDC:EURNZD': 'eurnzd',  'FX_IDC:GBPJPY': 'gbpjpy',
  'FX_IDC:GBPCHF': 'gbpchf',  'FX_IDC:GBPCAD': 'gbpcad',
  'FX_IDC:GBPAUD': 'gbpaud',  'FX_IDC:GBPNZD': 'gbpnzd',
  'FX_IDC:AUDJPY': 'audjpy',  'FX_IDC:AUDNZD': 'audnzd',
  'FX_IDC:AUDCHF': 'audchf',  'FX_IDC:AUDCAD': 'audcad',
  'FX_IDC:CADJPY': 'cadjpy',  'FX_IDC:CADCHF': 'cadchf',
  'FX_IDC:NZDJPY': 'nzdjpy',  'FX_IDC:NZDCAD': 'nzdcad',
  'FX_IDC:NZDCHF': 'nzdchf',  'FX_IDC:CHFJPY': 'chfjpy',
  'FX_IDC:USDNOK': 'usdnok',  'FX_IDC:USDSEK': 'usdsek',
  'FX_IDC:EURNOK': 'eurnok',  'FX_IDC:EURSEK': 'eursek',
  'OANDA:XAUUSD':         'gold',
  'CMCMARKETS:GOLDM2026': 'gold',   
  'OANDA:XAGUSD':         'silver',
  'OANDA:WTICOUSD':       'wti',
  'FPMARKETS:WTI':        'wti',    
  'OANDA:BCOUSD':         'brent',
  'BITSTAMP:BTCUSD':      'btc',
  'COINBASE:BTCUSD':      'btc',
  'FRED:DGS10':           'us10y',
  'FOREXCOM:SPXUSD':      'spx',
  'CMCMARKETS:SPX500':    'spx',    
  'FOREXCOM:NSXUSD':      'nasdaq',
  'CFI:US100':            'nasdaq', 
  'INDEX:NI225':          'nikkei',
  'OSE:NK2251!':          'nikkei', 
  'FOREXCOM:EU50':        'stoxx',
  'GOMARKETS:STOXX50':    'stoxx',  
  'FOREXCOM:DJI':         'dji',
  'FOREXCOM:DEU40':       'dax',
  'FOREXCOM:UK100':       'ftse',
  'FOREXCOM:HKG33':       'hsi',
  'BITSTAMP:ETHUSD':      'eth',
  'COINBASE:ETHUSD':      'eth',
  'PEPPERSTONE:USDX':     'dxy',
  'CBOE:VIX':             'vix',
  'FRED:VIXCLS':          'vix',
  'TVC:MOVE':             'move',
  'FRED:BAMLH0A0HYM2':    'hyoas',
  'FRED:BAMLC0A0CM':      'igoas',
};

const _OHLC_LABELS = {
  gold: 'GC=F', wti: 'CL=F', btc: 'BTC-USD', us10y: '^TNX',
  spx: '^GSPC', nasdaq: '^NDX', nikkei: '^N225', stoxx: '^STOXX50E',
  eth: 'ETH-USD', dxy: 'DX-Y.NYB', vix: '^VIX', move: '^MOVE',
  silver: 'SI=F', brent: 'BZ=F', dax: '^GDAXI', ftse: '^FTSE', hsi: '^HSI', dji: '^DJI',
  hyoas: 'BAMLH0A0HYM2', igoas: 'BAMLC0A0CM',
};

let _lwChart = null;
let _lwResizeObs = null;
let _lwCandleSeries = null;   

let _chartMode = 'lw'; 
let _lwActiveOhlcId = null;   
let _lwActiveUpdateHeader = null; 
let _lwActivePrevCloseMap = null; 
let _lwLastJsonBarDate   = null; 

let _lwLibPromise = null;
function _ensureLWLib() {
  if (window.LightweightCharts) return Promise.resolve();
  if (_lwLibPromise) return _lwLibPromise;
  _lwLibPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lightweight-charts@5.0.7/dist/lightweight-charts.standalone.production.js';
    s.onload  = resolve;
    s.onerror = () => { _lwLibPromise = null; reject(new Error('LW lib load failed')); };
    document.head.appendChild(s);
  });
  return _lwLibPromise;
}

function _destroyLWChart() {
  if (_lwResizeObs)  { _lwResizeObs.disconnect(); _lwResizeObs = null; }
  if (_lwChart)      { try { _lwChart.remove(); } catch(_) {} _lwChart = null; }
  _lwCandleSeries = null;
  _lwActiveOhlcId = null;
  _lwActiveUpdateHeader = null;
  _lwActivePrevCloseMap = null;
  _lwLastJsonBarDate   = null;
  _lwPeriodOpen = null;
  _lwPeriodHigh = null;
  _lwPeriodLow  = null;
  window._lwRenderDrawings = null;
  _lwCompareSeriesMap = {};
  _lwCompareMeta = {}; 
}

function _calcMA(bars, n) {
  return bars.map((b, i) => {
    if (i < n - 1) return null;
    const sum = bars.slice(i - n + 1, i + 1).reduce((a, x) => a + x.close, 0);
    return { time: b.time, value: parseFloat((sum / n).toFixed(6)) };
  }).filter(Boolean);
}

const _LW_FX_IDS = new Set([
  'eurusd','gbpusd','usdjpy','audusd','usdcad','usdchf','nzdusd',
  'usdnok','usdsek',                               
  'eurgbp','eurjpy','eurchf','eurcad','euraud','eurnzd','gbpjpy',
  'gbpchf','gbpcad','gbpaud','gbpnzd','audjpy','audnzd','audchf',
  'audcad','cadjpy','cadchf','nzdjpy','nzdcad','nzdchf','chfjpy',
  'eurnok','eursek',                               
]);

function _lwBuildTodayBar(ohlcId) {
  const nowUTC = new Date();
  const dowUTC = nowUTC.getUTCDay(); 

  const hourUTC = nowUTC.getUTCHours();
  if (_LW_FX_IDS.has(ohlcId) && dowUTC === 6) return null;  
  if (_LW_FX_IDS.has(ohlcId) && dowUTC === 0 && hourUTC < 21) return null;  

  if (_LW_FX_IDS.has(ohlcId) && dowUTC === 5 && hourUTC >= 21) return null;

  const cacheKey = ohlcId === 'gold' ? 'xauusd' : ohlcId;
  const q = STOOQ_RT_CACHE[cacheKey];
  if (!q || !q.close || isNaN(q.close) || q.close <= 0) return null;

  const isFxBar = _LW_FX_IDS.has(ohlcId);

  let dateStr;
  if (isFxBar) {
    if (hourUTC >= 21) {
      const todayUtcStr = nowUTC.toISOString().slice(0, 10);
      const jsonIsStale = _lwLastJsonBarDate != null && _lwLastJsonBarDate < todayUtcStr;
      if (jsonIsStale) {
        dateStr = todayUtcStr;
      } else {
        const tomorrow = new Date(nowUTC);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        dateStr = tomorrow.toISOString().slice(0, 10);
      }
    } else {
      dateStr = nowUTC.toISOString().slice(0, 10);
    }
  } else if (q.market_time != null) {
    const _mtDate = new Date(q.market_time * 1000);
    dateStr = _mtDate.toISOString().slice(0, 10);
  } else {
    dateStr = nowUTC.toISOString().slice(0, 10);
  }

  if (!isFxBar && q.market_state != null && q.market_time != null) {
    const isClosed = (q.market_state === 'CLOSED' || q.market_state === 'POSTPOST'
                   || q.market_state === 'PREPRE');
    if (isClosed) {
      const lastTradeDate = new Date(q.market_time * 1000).toISOString().slice(0, 10);
      if (lastTradeDate < dateStr) {
        return null;
      }
    }
  }

  const dec = { eurusd:5,gbpusd:5,usdjpy:3,audusd:5,usdcad:5,usdchf:5,nzdusd:5,
                eurgbp:5,eurjpy:3,eurchf:5,eurcad:5,euraud:5,eurnzd:5,gbpjpy:3,
                gbpchf:5,gbpcad:5,gbpaud:5,gbpnzd:5,audjpy:3,audnzd:5,audchf:5,
                audcad:5,cadjpy:3,cadchf:5,nzdjpy:3,nzdcad:5,nzdchf:5,chfjpy:3,
                gold:2,wti:2,btc:2,us10y:4,spx:2,nasdaq:2,nikkei:2,stoxx:2,eth:2,dxy:3,
                silver:2,brent:2,dax:2,ftse:2,hsi:2,dji:2,hyoas:0,igoas:0 }[ohlcId] ?? 5;
  const c = parseFloat(q.close.toFixed(dec));
  const _isPlausibleAnchor = (v) => v != null && v > 0 && Math.abs(v - c) / c <= 0.02;
  let o;
  if (isFxBar) {
    o = _isPlausibleAnchor(q.prev_bar && q.prev_bar.close)
      ? parseFloat(q.prev_bar.close.toFixed(dec))
      : (_isPlausibleAnchor(q.prev_close)
          ? parseFloat(q.prev_close.toFixed(dec))
          : (_isPlausibleAnchor(q.open) ? parseFloat(q.open.toFixed(dec)) : c));
  } else {
    o = q.open != null && q.open > 0
      ? parseFloat(q.open.toFixed(dec))
      : (q.prev_close != null && q.prev_close > 0 ? parseFloat(q.prev_close.toFixed(dec)) : c);
  }
  let h, l;
  if (isFxBar) {
    if (_isPlausibleAnchor(q.session_high) && _isPlausibleAnchor(q.session_low)) {
      h = parseFloat(q.session_high.toFixed(dec));
      l = parseFloat(q.session_low.toFixed(dec));
    } else {
      h = Math.max(o, c);
      l = Math.min(o, c);
    }
  } else {
    if (_isPlausibleAnchor(q.session_high) && _isPlausibleAnchor(q.session_low)) {
      h = parseFloat(q.session_high.toFixed(dec));
      l = parseFloat(q.session_low.toFixed(dec));
    } else if (_isPlausibleAnchor(q.high) && _isPlausibleAnchor(q.low)) {
      h = parseFloat(q.high.toFixed(dec));
      l = parseFloat(q.low.toFixed(dec));
    } else {
      h = Math.max(o, c);
      l = Math.min(o, c);
    }
  }
  if ((_lwActiveTf === 'W1' || _lwActiveTf === 'MN') &&
      _lwPeriodOpen != null && _lwPeriodHigh != null && _lwPeriodLow != null) {
    o = parseFloat(_lwPeriodOpen.toFixed(dec));
    h = parseFloat(_lwPeriodHigh.toFixed(dec));
    l = parseFloat(_lwPeriodLow.toFixed(dec));
  }

  h = Math.max(h, o, c);
  l = Math.min(l, o, c);

  if (isFxBar && o === h && h === l && l === c) return null;

  let barTime = dateStr;
  if (_lwActiveTf === 'W1') {
    const _d = new Date(dateStr + 'T00:00:00Z');
    const _dow = _d.getUTCDay() || 7; 
    const _mon = new Date(_d);
    _mon.setUTCDate(_d.getUTCDate() - (_dow - 1));
    barTime = _mon.toISOString().slice(0, 10);
  } else if (_lwActiveTf === 'MN') {
    barTime = dateStr.slice(0, 7) + '-01';
  }

  return { time: barTime, open: o, high: h, low: l, close: c };
}

function _lwUpdateTodayBar() {
  if (!_lwCandleSeries || !_lwActiveOhlcId) return;

  if (_lwActiveTf === 'H1' || _lwActiveTf === 'H4') {
    const _isFxId = _LW_FX_IDS?.has(_lwActiveOhlcId) ?? false;
    const _ck = _lwActiveOhlcId === 'gold' ? 'xauusd' : _lwActiveOhlcId;
    const _rt = STOOQ_RT_CACHE[_ck];
    if (!_rt?.close || !(_rt.close > 0)) return;

    const _now = new Date();

    let _blockTs;
    if (_lwActiveTf === 'H1') {
      const _d = new Date(_now);
      _d.setUTCMinutes(0, 0, 0);
      _blockTs = Math.floor(_d.getTime() / 1000);
    } else {
      const _blockH = Math.floor(_now.getUTCHours() / 4) * 4;
      const _d = new Date(_now);
      _d.setUTCHours(_blockH, 0, 0, 0);
      _blockTs = Math.floor(_d.getTime() / 1000);
    }

    const _utcDay = _now.getUTCDay();
    const _utcH   = _now.getUTCHours();
    const _isFxWeekend = _isFxId && (
      _utcDay === 6 ||
      (_utcDay === 0 && _utcH < 21) ||
      (_utcDay === 5 && _utcH >= 21)
    );
    if (_isFxWeekend) return;

    const _c = _rt.close;
    const _o = (_lwLastIntradayBarClose != null && _lwLastIntradayBarClose > 0)
      ? _lwLastIntradayBarClose
      : _c;

    if (_lwBlockTs !== _blockTs) {
      if (_lwBlockTs !== null && _c > 0) {
        _lwLastIntradayBarClose = _c;
      }
      _lwBlockHigh = _c;
      _lwBlockLow  = _c;
      _lwBlockTs   = _blockTs;
    }
    _lwBlockHigh = Math.max(_lwBlockHigh ?? _c, _o, _c);
    _lwBlockLow  = Math.min(_lwBlockLow  ?? _c, _o, _c);
    const _h2 = _lwBlockHigh;
    const _l2 = _lwBlockLow;
    if (!(_h2 > 0 && _l2 > 0 && _h2 >= _l2)) return;

    const _liveBar = { time: _blockTs, open: _o, high: _h2, low: _l2, close: _c };
    try {
      const _isLA = (_effectiveChartType(_lwActiveOhlcId) === 'line' || _effectiveChartType(_lwActiveOhlcId) === 'area');
      _lwCandleSeries.update(_isLA ? { time: _blockTs, value: _c } : _liveBar);
    } catch(_) {}

    if (_lwActiveUpdateHeader) {
      _lwActiveUpdateHeader(_liveBar, null, (_rt.pct != null) ? { pct: _rt.pct, chg: _rt.chg } : null);
    }
    if (window._lwRenderDrawings) window._lwRenderDrawings();
    return;
  }

  const bar = _lwBuildTodayBar(_lwActiveOhlcId);
  if (!bar) return;
  try {
    const isLineArea = (_effectiveChartType(_lwActiveOhlcId) === 'line' || _effectiveChartType(_lwActiveOhlcId) === 'area');
    _lwCandleSeries.update(isLineArea ? { time: bar.time, value: bar.close } : bar);
  } catch(_) {}

  if (_lwActiveUpdateHeader) {
    const cacheKey = _lwActiveOhlcId === 'gold' ? 'xauusd' : _lwActiveOhlcId;
    const rt = STOOQ_RT_CACHE[cacheKey];
    if (rt?.pct != null && rt.pct !== undefined && _lwActivePrevCloseMap) {
      if (rt.open != null && rt.open > 0) {
        _lwActivePrevCloseMap.set(bar.time, rt.open);
      }
      _lwActiveUpdateHeader(bar, null, { pct: rt.pct, chg: rt.chg });
    } else {
      _lwActiveUpdateHeader(bar, null, null);
    }
  }
  if (window._lwRenderDrawings) window._lwRenderDrawings();
}

let _lwTotalBars = 0;  

function _lwSetRange(days, totalBars) {
  if (!_lwChart) return;
  if (totalBars != null) _lwTotalBars = totalBars;
  const n = _lwTotalBars;
  const ts = _lwChart.timeScale();

  if (days === 0) {
    ts.fitContent();
    document.querySelectorAll('.lw-range-btn').forEach(b => b.classList.toggle('active', b.dataset.days === '0'));
    _lwActiveDays = 0;
    return;
  }

  if (n < 1) { ts.fitContent(); return; }

  let barsPerDay;
  switch (_lwActiveTf) {
    case 'H1': barsPerDay = 17;      break; 
    case 'H4': barsPerDay = 4.25;    break; 
    case 'W1': barsPerDay = 1 / 7;   break; 
    case 'MN': barsPerDay = 1 / 30;  break; 
    default:   barsPerDay = 5 / 7;   break; 
  }
  const tradingBars = Math.round(days * barsPerDay);
  const rightPad    = 14;
  const from = n - tradingBars - 1;
  const to   = n + rightPad - 1;

  if (tradingBars >= n) { ts.fitContent(); _lwActiveDays = days; return; }

  setTimeout(() => {
    try { ts.setVisibleLogicalRange({ from: Math.max(0, from), to }); } catch (_) { ts.fitContent(); }
  }, 30);

  document.querySelectorAll('.lw-range-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.days) === days);
  });
  _lwActiveDays = days;
}

function _lwDefaultD1Days() { return (window.innerWidth <= 900) ? 91 : 182; }

let _lwActiveDays = _lwDefaultD1Days(); 
let _lwActiveTf   = 'D1'; 
let _lwCompareSeriesMap = {};
let _lwCompareMeta = {};
const _LS_COMPARE = 'gi_compare_list'; 
function _lsGetCompare() {
  try { const v = localStorage.getItem(_LS_COMPARE); return v ? JSON.parse(v) : []; }
  catch(_e) { return []; }
}
function _lsSetCompare(list) {
  try { localStorage.setItem(_LS_COMPARE, JSON.stringify(list)); } catch(_e) {}
}
if (typeof window._lwCompareList === 'undefined') window._lwCompareList = _lsGetCompare();

let _lwLastIntradayBarClose = null; 

let _lwBlockHigh      = null; 
let _lwBlockLow       = null; 
let _lwBlockTs        = null; 
let _lwPeriodOpen     = null; 
let _lwPeriodHigh     = null; 
let _lwPeriodLow      = null; 

async function _renderLWChart(ohlcId, label) {
  const wrap = document.getElementById('tv-chart-wrap');
  if (!wrap) return;

  _chartMode = 'lw'; 
  _destroyLWChart();
  wrap.innerHTML = '';

  const loader = document.createElement('div');
  loader.style.cssText = 'height:100%;display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:12px;font-family:var(--font-ui,sans-serif);';
  loader.textContent = 'Loading chart\u2026';
  wrap.appendChild(loader);

  await _ensureLWLib();

  if (typeof window._lwFvSummaryReq === 'undefined') {
    window._lwFvSummary = null;
    window._lwFvSummaryReq = _fetchWithRetry('./fair-value-data/summary.json')
      .then(res => res && res.ok ? res.json() : null)
      .then(d => { window._lwFvSummary = (d && d.pairs) ? d.pairs : {}; })
      .catch(() => { window._lwFvSummary = {}; });
  }

  const _activeTf = _lwActiveTf;
  const _isIntradayTf = (_activeTf === 'H1' || _activeTf === 'H4');
  let _jsonPath;
  if (_activeTf === 'H1')      _jsonPath = './ohlc-data/h1/' + ohlcId + '.json';
  else if (_activeTf === 'H4') _jsonPath = './ohlc-data/h4/' + ohlcId + '.json';
  else                         _jsonPath = './ohlc-data/' + ohlcId + '.json';

  const r = await fetch(_jsonPath, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  let bars = await r.json();
  if (!Array.isArray(bars) || bars.length < 10) throw new Error('insufficient data');

  if (_isIntradayTf && _LW_FX_IDS.has(ohlcId)) {
    try {
      const _resolutionSec  = (_activeTf === 'H1') ? 3600 : 14400;
      const _lastJsonTs     = bars[bars.length - 1].time;
      const _nowUTC2        = new Date();
      const _utcDow         = _nowUTC2.getUTCDay();
      const _utcHr          = _nowUTC2.getUTCHours();

      const _fxClosed = (
        _utcDow === 6 ||
        (_utcDow === 0 && _utcHr < 21) ||
        (_utcDow === 5 && _utcHr >= 21)
      );

      let _currentBlockTs;
      if (_activeTf === 'H1') {
        const _d = new Date(_nowUTC2);
        _d.setUTCMinutes(0, 0, 0);
        _currentBlockTs = Math.floor(_d.getTime() / 1000);
      } else {
        const _blockH = Math.floor(_nowUTC2.getUTCHours() / 4) * 4;
        const _d = new Date(_nowUTC2);
        _d.setUTCHours(_blockH, 0, 0, 0);
        _currentBlockTs = Math.floor(_d.getTime() / 1000);
      }

      if (!_fxClosed) {
        const _daysSinceSun = _utcDow;                  
        const _lastSun      = new Date(_nowUTC2);
        _lastSun.setUTCDate(_nowUTC2.getUTCDate() - _daysSinceSun);
        _lastSun.setUTCHours(21, 0, 0, 0);
        const _sessionStartTs = Math.floor(_lastSun.getTime() / 1000);

        const _sessionBarsInJson = bars.filter(b => b.time >= _sessionStartTs && b.time < _currentBlockTs);
        const _expectedNextTs    = _lastJsonTs + _resolutionSec;
        const _hasGap            = _expectedNextTs < _currentBlockTs;
        const _sessionHasData    = _sessionBarsInJson.length > 0;

        if (_sessionHasData || _hasGap) {
          const _wsUrl      = (typeof FX_PROXY_WS_URL !== 'undefined') ? FX_PROXY_WS_URL : '';
          const _candleBase = _wsUrl.replace(/^wss:\/\//, 'https://').replace(/\/ws$/, '');

          if (_candleBase) {
            const _resParam   = (_activeTf === 'H1') ? '60' : '240';
            const _candleUrl  = `${_candleBase}/candles?id=${encodeURIComponent(ohlcId)}&resolution=${_resParam}&from=${_sessionStartTs}&to=${_currentBlockTs}`;

            const _gapResp = await fetch(_candleUrl, { signal: AbortSignal.timeout(2000) });
            if (_gapResp.ok) {
              const _gapData = await _gapResp.json();
              if (Array.isArray(_gapData.bars) && _gapData.bars.length > 0) {
                const _finnhubBars = _gapData.bars.filter(b =>
                  b.time >= _sessionStartTs && b.time < _currentBlockTs &&
                  b.open > 0 && b.high > 0 && b.low > 0 && b.close > 0 &&
                  b.high >= b.open && b.high >= b.close &&
                  b.low  <= b.open && b.low  <= b.close
                );
                if (_finnhubBars.length > 0) {
                  _finnhubBars.sort((a, b) => a.time - b.time);
                  const _finnhubTs = new Set(_finnhubBars.map(b => b.time));
                  const _keptJsonBars = bars.filter(b =>
                    b.time < _sessionStartTs ||
                    (b.time >= _sessionStartTs && !_finnhubTs.has(b.time) && b.time < _currentBlockTs)
                  );
                  bars = [..._keptJsonBars, ..._finnhubBars].sort((a, b) => a.time - b.time);
                }
              }
            }
          }
        }
      }
    } catch (_gapErr) {
    }
  }

  if (_activeTf === 'W1' || _activeTf === 'MN') {
    const agg = {};
    for (const b of bars) {
      let key;
      if (_activeTf === 'W1') {
        const d   = new Date(b.time + 'T00:00:00Z');
        const dow = d.getUTCDay() || 7; 
        const mon = new Date(d);
        mon.setUTCDate(d.getUTCDate() - (dow - 1));
        key = mon.toISOString().slice(0, 10);
      } else {
        key = b.time.slice(0, 7) + '-01'; 
      }
      if (!agg[key]) {
        agg[key] = { time: key, open: b.open, high: b.high, low: b.low, close: b.close };
      } else {
        const a   = agg[key];
        a.high    = Math.max(a.high, b.high);
        a.low     = Math.min(a.low,  b.low);
        a.close   = b.close;
      }
    }
    bars = Object.values(agg).sort((a, b) => a.time < b.time ? -1 : 1);
    if (bars.length < 4) throw new Error('insufficient aggregated data');

    const _nowKeyD = new Date();
    let _currentPeriodKey;
    if (_activeTf === 'W1') {
      const _kDow = _nowKeyD.getUTCDay() || 7;
      const _kMon = new Date(_nowKeyD);
      _kMon.setUTCDate(_nowKeyD.getUTCDate() - (_kDow - 1));
      _currentPeriodKey = _kMon.toISOString().slice(0, 10);
    } else {
      _currentPeriodKey = _nowKeyD.toISOString().slice(0, 7) + '-01';
    }

    const _curPeriodBar = bars[bars.length - 1];
    if (_curPeriodBar && _curPeriodBar.time === _currentPeriodKey) {
      _lwPeriodOpen = _curPeriodBar.open;
      _lwPeriodHigh = _curPeriodBar.high;
      _lwPeriodLow  = _curPeriodBar.low;
    }
  }

  if (!_isIntradayTf) {
  if (_activeTf === 'D1') {
    _lwLastJsonBarDate = bars[bars.length - 1]?.time ?? null;
  }

  {
    const _isFxStrip = _LW_FX_IDS.has(ohlcId);
    const _nowUTC    = new Date();
    const _hourUTC   = _nowUTC.getUTCHours();
    let   _stripFrom;
    if (_isFxStrip && _hourUTC >= 21) {
      const _todayStr = _nowUTC.toISOString().slice(0, 10);
      const _jsonStale = _lwLastJsonBarDate != null && _lwLastJsonBarDate < _todayStr;
      if (_jsonStale) {
        _stripFrom = _todayStr;
      } else {
        const _tom = new Date(_nowUTC);
        _tom.setUTCDate(_tom.getUTCDate() + 1);
        _stripFrom = _tom.toISOString().slice(0, 10);
      }
    } else if (!_isFxStrip) {
      const _ck = ohlcId === 'gold' ? 'xauusd' : ohlcId;
      const _qt = STOOQ_RT_CACHE[_ck];
      if (_qt?.market_time != null) {
        const _mtDate = new Date(_qt.market_time * 1000);
        _stripFrom = _mtDate.toISOString().slice(0, 10);
      } else {
        _stripFrom = _nowUTC.toISOString().slice(0, 10);
      }
    } else {
      _stripFrom = _nowUTC.toISOString().slice(0, 10);
    }
    bars = bars.filter(b => b.time < _stripFrom);
    if (bars.length < 10) throw new Error('insufficient data after strip');

    if (_isFxStrip) {
      const _todayStr2     = _nowUTC.toISOString().slice(0, 10);
      const _yesterdayDate = new Date(_nowUTC);
      _yesterdayDate.setUTCDate(_yesterdayDate.getUTCDate() - 1);
      const _yesterdayStr2 = _yesterdayDate.toISOString().slice(0, 10);

      const _gapA = _hourUTC >= 21 && _lwLastJsonBarDate != null && _lwLastJsonBarDate < _todayStr2;
      const _gapB = _hourUTC < 21 && _lwLastJsonBarDate != null && _lwLastJsonBarDate < _yesterdayStr2;
      const _isGapWindow = _gapA || _gapB;

      if (_isGapWindow) {
        const _cacheKey = ohlcId === 'gold' ? 'xauusd' : ohlcId;
        const _q = STOOQ_RT_CACHE[_cacheKey];
        const _pb = _q?.prev_bar;
        if (_pb && _pb.time && _pb.open > 0 && _pb.high > 0 && _pb.low > 0 && _pb.close > 0) {
          const _lastBarTime = bars.length > 0 ? bars[bars.length - 1].time : null;
          const _pbInRange   = (!_lastBarTime || _pb.time > _lastBarTime) && _pb.time < _stripFrom;
          if (_pbInRange) {
            const _dec2 = { eurusd:5,gbpusd:5,usdjpy:3,audusd:5,usdcad:5,usdchf:5,nzdusd:5,
                            eurgbp:5,eurjpy:3,eurchf:5,eurcad:5,euraud:5,eurnzd:5,gbpjpy:3,
                            gbpchf:5,gbpcad:5,gbpaud:5,gbpnzd:5,audjpy:3,audnzd:5,audchf:5,
                            audcad:5,cadjpy:3,cadchf:5,nzdjpy:3,nzdcad:5,nzdchf:5,chfjpy:3 }[ohlcId] ?? 5;
            const _pbBar = {
              time:  _pb.time,
              open:  parseFloat(_pb.open.toFixed(_dec2)),
              high:  parseFloat(_pb.high.toFixed(_dec2)),
              low:   parseFloat(_pb.low.toFixed(_dec2)),
              close: parseFloat(_pb.close.toFixed(_dec2)),
            };
            bars.push(_pbBar);
          }
        }
      }
    }
  }
  } 

  wrap.innerHTML = '';

  wrap.style.marginBottom = '0';

  const chartDiv = document.createElement('div');
  chartDiv.style.cssText = 'width:100%;height:100%;touch-action:none;';
  wrap.appendChild(chartDiv);

  wrap.style.pointerEvents = 'auto';

  const dec = { eurusd:5,gbpusd:5,usdjpy:3,audusd:5,usdcad:5,usdchf:5,nzdusd:5,
                eurgbp:5,eurjpy:3,eurchf:5,eurcad:5,euraud:5,eurnzd:5,gbpjpy:3,
                gbpchf:5,gbpcad:5,gbpaud:5,gbpnzd:5,audjpy:3,audnzd:5,audchf:5,
                audcad:5,cadjpy:3,cadchf:5,nzdjpy:3,nzdcad:5,nzdchf:5,chfjpy:3,
                gold:2,wti:2,btc:2,us10y:4,spx:2,nasdaq:2,nikkei:2,stoxx:2,eth:2,dxy:3,
                silver:2,brent:2,dax:2,ftse:2,hsi:2,dji:2,hyoas:0,igoas:0 }[ohlcId] ?? 5;
  const minMove = parseFloat((1 / Math.pow(10, dec)).toFixed(dec));

  const LWC = window.LightweightCharts;
  const chartW = wrap.offsetWidth  || wrap.clientWidth  || 600;
  const chartH = wrap.offsetHeight || wrap.clientHeight || 290;

  const hasVolume = bars.length > 0 && typeof bars[0].volume === 'number' && bars[0].volume > 0;

  const mainScaleMargins = hasVolume
    ? { top: 0.08, bottom: 0.22 }
    : { top: 0.10, bottom: 0.08 };

  _lwChart = LWC.createChart(chartDiv, {
    layout:      { background: { color: _themeColor('--bg') }, textColor: _themeColor('--text'), attributionLogo: false,
                   panes: { separatorColor: _themeColorAlpha('--border', 0.6), separatorHoverColor: _themeColorAlpha('--text2', 0.25), enableResize: true } },
    grid:        { vertLines: { color: _themeColorAlpha('--border', 0.5) }, horzLines: { color: _themeColorAlpha('--border', 0.5) } },
    crosshair:   { mode: LWC.CrosshairMode.Normal,
                   vertLine: { color: _themeColorAlpha('--text2', 0.5), labelBackgroundColor: _themeColor('--bg3') },
                   horzLine: { color: _themeColorAlpha('--text2', 0.5), labelBackgroundColor: _themeColor('--bg3') } },
    rightPriceScale: { borderColor: _themeColor('--border'), minimumWidth: 65,
                       scaleMargins: mainScaleMargins },
    timeScale:   { borderColor: _themeColor('--border'), timeVisible: false, secondsVisible: false,
                   rightOffset: 14, minBarSpacing: 1,
                   fixLeftEdge: false, fixRightEdge: false },
    handleScroll:  { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale:   { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true } },
    localization: { priceFormatter: v => v.toFixed(dec) },
    width:  chartW,
    height: chartH,
  });

  const _wmLabel = (ohlcId === 'gold' ? 'XAUUSD' : ohlcId === 'wti' ? 'USOIL' : ohlcId.toUpperCase());
  if (typeof window._lwShowWm === 'undefined') window._lwShowWm = false;
  let _wmHandle = null;
  function _applyWatermark() {
    if (_wmHandle && typeof _wmHandle.detach === 'function') { try { _wmHandle.detach(); } catch(_) {} _wmHandle = null; }
    if (!window._lwShowWm) {
      const _domWm = document.getElementById('_lw-dom-watermark');
      if (_domWm) _domWm.remove();
      return;
    }
    try {
      const _domWm = document.getElementById('_lw-dom-watermark');
      if (_domWm) _domWm.remove();
      if (typeof LWC.createTextWatermark === 'function') {
        const _cw2 = chartW || 300;
        const _wmFs = Math.min(Math.max(Math.round(_cw2 * 0.15), 24), 96);
        _wmHandle = LWC.createTextWatermark(_lwChart.panes()[0], {
          horzAlign: 'center',
          vertAlign: 'center',
          lines: [
            { text: _wmLabel, color: 'rgba(209,212,220,0.08)', fontSize: _wmFs, fontWeight: 'bold', fontFamily: 'Inter,sans-serif' },
          ],
        });
      } else {
        const _chartWrap = document.getElementById('tv-chart-wrap');
        if (_chartWrap) {
          const _cw = _chartWrap.offsetWidth || chartW || 300;
          const _rawFs = Math.round(_cw * 0.15);
          const _fs = Math.min(Math.max(_rawFs, 24), 96);
          const _wm = document.createElement('div');
          _wm.id = '_lw-dom-watermark';
          _wm.textContent = _wmLabel;
          _wm.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${_fs}px;font-weight:700;font-family:var(--font-ui,sans-serif);color:rgba(255,255,255,0.10);pointer-events:none;user-select:none;z-index:1;white-space:nowrap;letter-spacing:${Math.round(_fs*0.05)}px;`;
          _chartWrap.style.position = 'relative';
          _chartWrap.appendChild(_wm);
        }
      }
    } catch(_wmErr) {}
  }
  _applyWatermark();
  const _wmBtn = document.getElementById('lw-wm-btn');
  if (_wmBtn) {
    _wmBtn.classList.toggle('on', window._lwShowWm);
    _wmBtn.setAttribute('aria-pressed', window._lwShowWm ? 'true' : 'false');
  }

  if (typeof window._lwChartType === 'undefined') window._lwChartType = 'candle';

  const _isAreaOnlyId = _AREA_ONLY_IDS.has(ohlcId);
  const _chartType = _effectiveChartType(ohlcId);

  document.querySelectorAll('[data-chart-type]').forEach(btn => {
    const _isCandleOrBar = (btn.dataset.chartType === 'candle' || btn.dataset.chartType === 'bar');
    const isActive = btn.dataset.chartType === _chartType;
    btn.classList.toggle('sel', isActive);
    btn.classList.remove('on');
    btn.disabled = _isAreaOnlyId && _isCandleOrBar;
    btn.title = (_isAreaOnlyId && _isCandleOrBar)
      ? 'Not available — this series has one print per day, no intraday range'
      : '';
  });

  const closeBars = bars.filter(b => b.close != null).map(b => ({ time: b.time, value: b.close }));

  let candleSeries;
  const _priceFormat = { type: 'price', precision: dec, minMove };

  if (_chartType === 'bar') {
    if (typeof LWC.BarSeries !== 'undefined') {
      candleSeries = _lwChart.addSeries(LWC.BarSeries, {
        upColor: _themeColor('--candle-up'), downColor: _themeColor('--candle-down'),
        openVisible: true, thinBars: false,
        priceFormat: _priceFormat,
      });
    } else {
      candleSeries = _lwChart.addBarSeries({
        upColor: _themeColor('--candle-up'), downColor: _themeColor('--candle-down'),
        priceFormat: _priceFormat,
      });
    }
    candleSeries.setData(bars);
  } else if (_chartType === 'line') {
    if (typeof LWC.LineSeries !== 'undefined') {
      candleSeries = _lwChart.addSeries(LWC.LineSeries, {
        color: _themeColor('--chart-line'), lineWidth: 2,
        priceLineVisible: false, lastValueVisible: true,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        priceFormat: _priceFormat,
      });
    } else {
      candleSeries = _lwChart.addLineSeries({ color: _themeColor('--chart-line'), lineWidth: 2, priceFormat: _priceFormat });
    }
    candleSeries.setData(closeBars);
  } else if (_chartType === 'area') {
    if (typeof LWC.AreaSeries !== 'undefined') {
      candleSeries = _lwChart.addSeries(LWC.AreaSeries, {
        lineColor: _themeColor('--chart-line'), lineWidth: 2,
        topColor: _themeColorAlpha('--chart-line', 0.28), bottomColor: _themeColorAlpha('--chart-line', 0.02),
        priceLineVisible: false, lastValueVisible: true,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        priceFormat: _priceFormat,
      });
    } else {
      candleSeries = _lwChart.addAreaSeries({ lineColor: _themeColor('--chart-line'), lineWidth: 2, priceFormat: _priceFormat });
    }
    candleSeries.setData(closeBars);
  } else {
    if (typeof LWC.CandlestickSeries !== 'undefined') {
      candleSeries = _lwChart.addSeries(LWC.CandlestickSeries, {
        upColor: _themeColor('--candle-up'), downColor: _themeColor('--candle-down'),
        borderUpColor: _themeColor('--candle-up'), borderDownColor: _themeColor('--candle-down'),
        wickUpColor: _themeColor('--candle-up'), wickDownColor: _themeColor('--candle-down'),
        priceFormat: _priceFormat,
      });
    } else {
      candleSeries = _lwChart.addCandlestickSeries({
        upColor: _themeColor('--candle-up'), downColor: _themeColor('--candle-down'),
        borderUpColor: _themeColor('--candle-up'), borderDownColor: _themeColor('--candle-down'),
        wickUpColor: _themeColor('--candle-up'), wickDownColor: _themeColor('--candle-down'),
        priceFormat: _priceFormat,
      });
    }
    candleSeries.setData(bars);
  }
  window._candleSeries = candleSeries;
  window._candleSeriesType = _chartType;

  if (_isIntradayTf && bars.length > 0) {
    _lwLastIntradayBarClose = bars[bars.length - 1].close;
  } else {
    _lwLastIntradayBarClose = null;
  }
  _lwBlockHigh  = null;
  _lwBlockLow   = null;
  _lwBlockTs    = null;

  if (typeof window._lwShowVol === 'undefined') window._lwShowVol = false;
  let volumeSeries = null;
  function _applyVolume() {
    if (volumeSeries) { try { _lwChart.removeSeries(volumeSeries); } catch(_) {} volumeSeries = null; }
    if (!hasVolume || !window._lwShowVol) {
      _lwChart.applyOptions({ layout: {}, timeScale: {} });
      _lwChart.priceScale('right').applyOptions({ scaleMargins: { top: 0.10, bottom: 0.08 } });
      return;
    }
    try {
      const volOpts = {
        priceScaleId: 'volume',
        priceFormat: { type: 'volume' },
        lastValueVisible: false,
        priceLineVisible: false,
      };
      if (typeof LWC.HistogramSeries !== 'undefined') {
        volumeSeries = _lwChart.addSeries(LWC.HistogramSeries, volOpts);
      } else if (typeof _lwChart.addHistogramSeries === 'function') {
        volumeSeries = _lwChart.addHistogramSeries(volOpts);
      }
      if (volumeSeries) {
        _lwChart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
          borderVisible: false,
          visible: false,
        });
        _lwChart.priceScale('right').applyOptions({ scaleMargins: { top: 0.08, bottom: 0.22 } });
        const volData = bars.map(b => ({
          time:  b.time,
          value: b.volume,
          color: (b.close >= b.open) ? 'rgba(38,166,154,0.30)' : 'rgba(239,83,80,0.30)',
        }));
        volumeSeries.setData(volData);
      }
    } catch(_volErr) { volumeSeries = null; }
  }
  _applyVolume();
  const _volBtn = document.getElementById('lw-vol-btn');
  if (_volBtn) {
    const _volActive = hasVolume && window._lwShowVol;
    _volBtn.classList.toggle('on', _volActive);
    _volBtn.style.opacity = hasVolume ? '1' : '0.4';
    _volBtn.title = hasVolume ? 'Volume histogram' : 'Volume (unavailable — no data)';
    _volBtn.setAttribute('aria-pressed', _volActive ? 'true' : 'false');
  }

  if (typeof window._lwShowPc === 'undefined') window._lwShowPc = true;
  let _prevCloseLine = null;
  const _lastHistClose = (() => {
    if (_activeTf === 'W1' || _activeTf === 'MN') {
      return bars.length > 2 ? bars[bars.length - 2].close : null;
    }
    return bars.length > 1 ? bars[bars.length - 1].close : null;
  })();
  function _applyPrevClose() {
    if (_prevCloseLine) { try { candleSeries.removePriceLine(_prevCloseLine); } catch(_) {} _prevCloseLine = null; }
    if (!window._lwShowPc || _lastHistClose == null) return;
    try {
      _prevCloseLine = candleSeries.createPriceLine({
        price: _lastHistClose,
        color: 'rgba(144,150,160,0.55)',
        lineWidth: 1,
        lineStyle: 2, 
        axisLabelVisible: true,
        axisLabelColor: _themeColor('--border'),
        axisLabelTextColor: _themeColor('--text3'),
        title: 'Prev C',
      });
    } catch(_plErr) {}
  }
  _applyPrevClose();
  const _pcBtn = document.getElementById('lw-pc-btn');
  if (_pcBtn) {
    _pcBtn.classList.toggle('on', window._lwShowPc);
    _pcBtn.setAttribute('aria-pressed', window._lwShowPc ? 'true' : 'false');
  }

  if (typeof window._lwLogScale === 'undefined') window._lwLogScale = false;
  if (window._lwLogScale) {
    try { _lwChart.priceScale('right').applyOptions({ mode: 1 }); } catch(_) {}
  }
  const _logBtn = document.getElementById('lw-log-btn');
  if (_logBtn) {
    _logBtn.classList.toggle('on', window._lwLogScale);
    _logBtn.setAttribute('aria-pressed', window._lwLogScale ? 'true' : 'false');
  }

  _lwCandleSeries = candleSeries;
  _lwActiveOhlcId = ohlcId;

  if (typeof window._sznOnSymbolChange === 'function') window._sznOnSymbolChange(ohlcId);

  let todayBar = null;
  if (_lwActiveTf === 'H1' || _lwActiveTf === 'H4') {
    _lwUpdateTodayBar();
  } else {
    todayBar = _lwBuildTodayBar(ohlcId);
    if (todayBar) {
      try {
        const _isLA = (_chartType === 'line' || _chartType === 'area');
        candleSeries.update(_isLA ? { time: todayBar.time, value: todayBar.close } : todayBar);
      } catch(_) {}
    }
  }

  if (window._lwMaState) window._lwMaState.forEach(m => { m.series = null; });

  if (typeof window._lwShowCb === 'undefined') window._lwShowCb = false;
  let _cbRafId = null;
  let _cbOverlay = null;   
  let _cbMeetingData = []; 

  function _drawCbLines() {
    if (_cbRafId) cancelAnimationFrame(_cbRafId);
    _cbRafId = requestAnimationFrame(() => {
      _cbRafId = null;
      if (!_cbOverlay || !_lwChart || !window._lwShowCb || _cbMeetingData.length === 0) {
        if (_cbOverlay) _cbOverlay.innerHTML = '';
        return;
      }
      const ts = _lwChart.timeScale();
      const chartH = chartDiv.offsetHeight;
      const labelZone = 18; 
      let svgContent = '';
      _cbMeetingData.forEach(ev => {
        try {
          const x = ts.timeToCoordinate(ev.date);
          if (x == null || x < 0 || x > chartDiv.offsetWidth) return;
          ev.cbs.forEach((cbItem, i) => {
            const col = cbItem.color;
            const solidCol = col.replace(/rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)/, 'rgba($1,0.55)');
            const labelCol = col.replace(/rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)/, 'rgba($1,0.9)');
            svgContent += `<line x1="${x.toFixed(1)}" y1="${labelZone}" x2="${x.toFixed(1)}" y2="${chartH - 28}" `
              + `stroke="${solidCol}" stroke-width="1" stroke-dasharray="3,3"/>`;
            const labelX = x + 3;
            const labelY = labelZone + i * 12;
            svgContent += `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" `
              + `font-size="9" font-family="var(--font-ui,sans-serif)" fill="${labelCol}" `
              + `font-weight="600">${cbItem.cb}</text>`;
          });
        } catch(_) {}
      });
      _cbOverlay.innerHTML = svgContent;
    });
  }

  async function _applyMarkers() {
    if (_cbOverlay) { _cbOverlay.innerHTML = ''; }
    _cbMeetingData = [];
    window._lwCbMarkerMap = {};
    if (!window._lwShowCb) return;
    try {
      const _CB_MAP = {
        eurusd:['EUR','USD'], gbpusd:['GBP','USD'], usdjpy:['USD','JPY'],
        audusd:['AUD','USD'], usdcad:['USD','CAD'], usdchf:['USD','CHF'],
        nzdusd:['NZD','USD'], eurgbp:['EUR','GBP'], eurjpy:['EUR','JPY'],
        eurchf:['EUR','CHF'], eurcad:['EUR','CAD'], euraud:['EUR','AUD'],
        eurnzd:['EUR','NZD'], gbpjpy:['GBP','JPY'], gbpchf:['GBP','CHF'],
        gbpcad:['GBP','CAD'], gbpaud:['GBP','AUD'], gbpnzd:['GBP','NZD'],
        audjpy:['AUD','JPY'], audnzd:['AUD','NZD'], audchf:['AUD','CHF'],
        audcad:['AUD','CAD'], cadjpy:['CAD','JPY'], cadchf:['CAD','CHF'],
        nzdjpy:['NZD','JPY'], nzdcad:['NZD','CAD'], nzdchf:['NZD','CHF'],
        chfjpy:['CHF','JPY'], gold:['USD'], wti:['USD'], btc:[], us10y:['USD'],
        spx:['USD'], nasdaq:['USD'], dxy:['USD'], nikkei:['JPY'], stoxx:['EUR'],
      };
      const relevantCBs = _CB_MAP[ohlcId] || [];
      if (relevantCBs.length === 0) return;
      const mtgData = window._STATE_meetings || await fetch('./meetings-data/meetings.json', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null).catch(() => null);
      if (!mtgData?.meetings) return;
      const barDates = new Set(bars.map(b => b.time));
      const firstDate = bars[0]?.time;
      const lastDate  = bars[bars.length - 1]?.time;
      const _CB_COLORS = { USD:'rgba(79,127,255,0.85)',  EUR:'rgba(246,148,28,0.85)',
                           GBP:'rgba(156,77,255,0.85)',  JPY:'rgba(255,213,0,0.85)',
                           AUD:'rgba(0,188,212,0.85)',   CAD:'rgba(255,87,34,0.85)',
                           CHF:'rgba(156,204,101,0.85)', NZD:'rgba(0,230,118,0.85)' };
      const dateMap = {};
      const barTimesSorted = bars.map(b => b.time);
      relevantCBs.forEach(cb => {
        const cbMtg = mtgData.meetings[cb];
        if (!cbMtg?.allMeetings) return;
        const color = _CB_COLORS[cb] || 'rgba(144,150,160,0.8)';
        cbMtg.allMeetings.forEach(dateStr => {
          if (dateStr < firstDate || dateStr > lastDate) return;
          let targetDate = barDates.has(dateStr) ? dateStr : null;
          if (!targetDate) {
            const d = new Date(dateStr + 'T12:00:00Z');
            d.setDate(d.getDate() + 1);
            const next = d.toISOString().slice(0, 10);
            if (barDates.has(next)) targetDate = next;
          }
          if (!targetDate) {
            for (let i = barTimesSorted.length - 1; i >= 0; i--) {
              if (barTimesSorted[i] <= dateStr) { targetDate = barTimesSorted[i]; break; }
            }
          }
          if (!targetDate) return;
          if (!dateMap[targetDate]) dateMap[targetDate] = [];
          if (!dateMap[targetDate].find(e => e.cb === cb)) {
            dateMap[targetDate].push({ cb, color });
          }
        });
      });
      Object.entries(dateMap).sort((a,b) => a[0] < b[0] ? -1 : 1).forEach(([date, cbs]) => {
        _cbMeetingData.push({ date, cbs });
        window._lwCbMarkerMap[date] = cbs.map(e => ({ cb: e.cb, color: e.color }));
      });
      if (!_cbOverlay) {
        _cbOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        _cbOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:visible;';
        chartDiv.style.position = 'relative';
        chartDiv.appendChild(_cbOverlay);
      }
      _drawCbLines();
      _lwChart.timeScale().subscribeVisibleTimeRangeChange(_drawCbLines);
    } catch(_cbErr) { console.warn('CB markers error:', _cbErr); }
  }
  const _cbBtn = document.getElementById('lw-cb-btn');
  if (_cbBtn) {
    _cbBtn.classList.toggle('on', window._lwShowCb);
    _cbBtn.setAttribute('aria-pressed', window._lwShowCb ? 'true' : 'false');
  }
  _applyMarkers();

  const _DRAW_LS_KEY  = 'gi_drawings';
  const _drawSymKey   = ohlcId;
  if (typeof window._lwDrawings === 'undefined') {
    try { const v = localStorage.getItem(_DRAW_LS_KEY); window._lwDrawings = v ? JSON.parse(v) : {}; }
    catch(_) { window._lwDrawings = {}; }
  }
  function _saveDrawings() {
    try { localStorage.setItem(_DRAW_LS_KEY, JSON.stringify(window._lwDrawings)); } catch(_) {}
  }
  function _curDrawings() {
    if (!window._lwDrawings[_drawSymKey]) window._lwDrawings[_drawSymKey] = [];
    return window._lwDrawings[_drawSymKey];
  }

  let _drawMode      = null;  
  let _drawAnchor    = null;  
  let _drawLiveEnd   = null;  
  let _isDragging    = false; 
  let _drawOverlay   = null;  
  let _drawRafId     = null;

  let _selectedIdx   = -1;    
  let _dragMode      = null;  
  let _dragStartPx   = null;  
  let _dragOrigP1    = null;  
  let _dragOrigP2    = null;  
  let _drawToolbarEl = null;  
  const _HANDLE_R    = 8;     

  (function _cleanupStaleToolbar() {
    const stale = document.getElementById('_lw-draw-toolbar');
    if (stale) stale.remove();
  })();

  const _DRAW_COLORS = { trend: 'rgba(79,127,255,0.9)', fib: 'rgba(255,193,7,0.9)', fibext: 'rgba(0,191,165,0.9)', rect: 'rgba(126,211,138,0.9)' };
  const _SWATCH_COLORS = [
    'rgba(79,127,255,0.9)',   
    'rgba(255,193,7,0.9)',    
    'rgba(126,211,138,0.9)',  
    'rgba(255,99,99,0.9)',    
    'rgba(186,133,255,0.9)',  
    'rgba(235,235,235,0.9)',  
  ];

  const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

  const FIB_EXT_LEVELS = [0, 0.382, 0.618, 1, 1.272, 1.618, 2, 2.618];

  function _updateDrawBtnState() {
    const b = document.getElementById('lw-draw-btn');
    if (b) b.classList.toggle('on', !!_drawMode);
    try { chartDiv.style.cursor = _drawMode ? 'crosshair' : ''; } catch(_) {}
  }

  const _panScrollOpts  = { mouseWheel: true, pressedMouseMove: true,  horzTouchDrag: true,  vertTouchDrag: false };
  const _panScaleOpts   = { mouseWheel: true, pinch: true,  axisPressedMouseMove: { time: true,  price: true  } };
  const _noPanScrollOpts = { mouseWheel: true, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false };
  const _noPanScaleOpts  = { mouseWheel: true, pinch: false, axisPressedMouseMove: { time: false, price: false } };
  function _setChartPannable(enabled) {
    try {
      _lwChart.applyOptions({
        handleScroll: enabled ? _panScrollOpts : _noPanScrollOpts,
        handleScale:  enabled ? _panScaleOpts  : _noPanScaleOpts,
      });
    } catch(_) {}
  }

  function _svgForDrawing(d, isPreview, isSelected) {
    const ts = _lwChart.timeScale();
    const x1 = _xForPoint(ts, d.p1), x2 = _xForPoint(ts, d.p2);
    const y1 = candleSeries.priceToCoordinate(d.p1.price), y2 = candleSeries.priceToCoordinate(d.p2.price);
    if (window._lwDebugDraw) {
      const _key = _lwActiveTf + '|' + d.type + '|' + x1 + '|' + x2 + '|' + y1 + '|' + y2;
      if (window._lwDebugLastKey !== _key) {
        window._lwDebugLastKey = _key;
        console.warn('[lw-draw] coords on', _lwActiveTf, {
          type: d.type, x1, x2, y1, y2,
          clipPath: _drawOverlay ? _drawOverlay.style.clipPath : null,
          chartDivW: chartDiv.clientWidth, chartDivH: chartDiv.clientHeight,
        });
      }
    }
    if (window._lwDebugDraw && (x1 == null || x2 == null || y1 == null || y2 == null)) {
      console.warn('[lw-draw] vanished on', _lwActiveTf, {
        type: d.type,
        p1: d.p1, p2: d.p2,
        x1, x2, y1, y2,
        dataLen: (candleSeries.data() || []).length,
        firstBar: (candleSeries.data() || [])[0]?.time,
        lastBar: (candleSeries.data() || []).slice(-1)[0]?.time,
      });
    }
    if (x1 == null || x2 == null || y1 == null || y2 == null) return '';
    const col = d.color || _DRAW_COLORS[d.type] || _DRAW_COLORS.trend;
    const previewDash = isPreview ? ' stroke-dasharray="3,3"' : '';
    const selW = isSelected ? 1 : 0; 
    let svg = '';
    if (d.type === 'trend') {
      if (isSelected) svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#fff" stroke-width="5" opacity="0.18"/>`;
      svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${(1.5 + selW).toFixed(1)}"${previewDash}/>`;
      svg += `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="3" fill="${col}"/>`;
      svg += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3" fill="${col}"/>`;
    } else if (d.type === 'rect') {
      const MIN_DIM = 2;
      let rx = Math.min(x1, x2), ry = Math.min(y1, y2);
      let rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
      if (rw < MIN_DIM) { const cx = (x1 + x2) / 2; rx = cx - MIN_DIM / 2; rw = MIN_DIM; }
      if (rh < MIN_DIM) { const cy = (y1 + y2) / 2; ry = cy - MIN_DIM / 2; rh = MIN_DIM; }
      const fillCol = col.replace(/[\d.]+\)$/, '0.14)');
      if (isSelected) svg += `<rect x="${(rx-2).toFixed(1)}" y="${(ry-2).toFixed(1)}" width="${(rw+4).toFixed(1)}" height="${(rh+4).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>`;
      svg += `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" fill="${fillCol}" stroke="${col}" stroke-width="${(1.25 + selW).toFixed(2)}"${previewDash}/>`;
    } else if (d.type === 'fib' || d.type === 'fibext') {
      svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="1" stroke-dasharray="4,3" opacity="0.55"/>`;
      const drawnHighFirst = d.p1.price >= d.p2.price;
      const priceHigh = Math.max(d.p1.price, d.p2.price);
      const priceLow  = Math.min(d.p1.price, d.p2.price);
      const range = priceHigh - priceLow || 1e-9;
      const xLeft  = Math.min(x1, x2);
      const xRight = Math.max(x1, x2);
      const levels = d.type === 'fibext' ? FIB_EXT_LEVELS : FIB_LEVELS;
      const isRetracement = d.type === 'fib';
      levels.forEach(lv => {
        const lvPrice = isRetracement
          ? (d.p2.price + lv * (d.p1.price - d.p2.price))
          : (drawnHighFirst ? (priceHigh - lv * range) : (priceLow + lv * range));
        const y = candleSeries.priceToCoordinate(lvPrice);
        if (y == null) return;
        const isAnchor = (lv === 0 || lv === 1);
        svg += `<line x1="${xLeft.toFixed(1)}" y1="${y.toFixed(1)}" x2="${xRight.toFixed(1)}" y2="${y.toFixed(1)}" `
             + `stroke="${col}" stroke-width="1" ${isAnchor ? '' : 'stroke-dasharray="2,2"'} opacity="0.9"${previewDash}/>`;
        svg += `<text x="${(xRight + 4).toFixed(1)}" y="${(y - 2).toFixed(1)}" text-anchor="start" `
             + `font-size="9" font-family="var(--font-ui,sans-serif)" fill="${col}">`
             + `${(lv * 100).toFixed(1)}% \u2013 ${lvPrice.toFixed(dec)}</text>`;
      });
    }
    return svg;
  }

  function _svgHandles(d) {
    if (!d) return '';
    const ts = _lwChart.timeScale();
    const x1 = _xForPoint(ts, d.p1), y1 = candleSeries.priceToCoordinate(d.p1.price);
    const x2 = _xForPoint(ts, d.p2), y2 = candleSeries.priceToCoordinate(d.p2.price);
    if (x1 == null || y1 == null || x2 == null || y2 == null) return '';
    const hs = 5;
    let svg = '';
    [[x1, y1], [x2, y2]].forEach(([hx, hy]) => {
      svg += `<rect x="${(hx - hs).toFixed(1)}" y="${(hy - hs).toFixed(1)}" width="${hs * 2}" height="${hs * 2}" `
           + `fill="var(--bg,#131722)" stroke="#ffffff" stroke-width="1.5" rx="1.5"/>`;
    });
    return svg;
  }

  function _renderDrawings() {
    if (_drawRafId) cancelAnimationFrame(_drawRafId);
    _drawRafId = requestAnimationFrame(() => {
      _drawRafId = null;
      if (!_drawOverlay || !_lwChart) return;
      if (window._lwDebugDraw) {
        const _rKey = 'run|' + _lwActiveTf + '|' + _curDrawings().length;
        if (window._lwDebugLastRunKey !== _rKey) {
          window._lwDebugLastRunKey = _rKey;
          console.warn('[lw-draw] _renderDrawings ran on', _lwActiveTf, 'count:', _curDrawings().length);
        }
      }
      try {
        const rightW = _lwChart.priceScale('right').width() || 0;
        let botH   = _lwChart.timeScale().height() || 0;
        const panes = _lwChart.panes();
        if (panes && panes.length > 1) {
          const mainPaneEl = panes[0].getHTMLElement && panes[0].getHTMLElement();
          const overlayH   = chartDiv.clientHeight || 0;
          const mainPaneH  = mainPaneEl ? mainPaneEl.clientHeight : 0;
          if (overlayH > 0 && mainPaneH > 0) botH = Math.max(botH, overlayH - mainPaneH);
        }
        _drawOverlay.style.clipPath = `inset(0 ${rightW}px ${botH}px 0)`;
      } catch(_) {}
      let svg = '';
      const arr = _curDrawings();
      arr.forEach((d, i) => {
        try { svg += _svgForDrawing(d, false, i === _selectedIdx); }
        catch(err) {
          if (window._lwDebugDraw) console.error('[lw-draw] _svgForDrawing threw on', _lwActiveTf, d.type, err);
        }
      });
      if (_isDragging && _drawAnchor && _drawLiveEnd) {
        try {
          svg += _svgForDrawing({ type: _drawMode, p1: _drawAnchor, p2: _drawLiveEnd, color: _DRAW_COLORS[_drawMode] }, true, false);
        } catch(_) {}
      }
      if (_selectedIdx >= 0 && arr[_selectedIdx] && !_isDragging) {
        try { svg += _svgHandles(arr[_selectedIdx]); } catch(_) {}
      }
      _drawOverlay.innerHTML = svg;
      if (_selectedIdx >= 0) _positionDrawToolbar();
    });
  }

  if (!_drawOverlay) {
    _drawOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    _drawOverlay.id = 'lw-draw-overlay';
    _drawOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3;overflow:visible;';
    chartDiv.style.position = 'relative';
    chartDiv.appendChild(_drawOverlay);
  }
  _renderDrawings();
  _lwChart.timeScale().subscribeVisibleTimeRangeChange(_renderDrawings);
  window._lwRenderDrawings = _renderDrawings;

  function _ptSegDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function _hitTestDrawing(x, y) {
    const ts = _lwChart.timeScale();
    const arr = _curDrawings();
    for (let i = arr.length - 1; i >= 0; i--) {
      const d = arr[i];
      const x1 = _xForPoint(ts, d.p1), x2 = _xForPoint(ts, d.p2);
      const y1 = candleSeries.priceToCoordinate(d.p1.price), y2 = candleSeries.priceToCoordinate(d.p2.price);
      if (x1 == null || x2 == null || y1 == null || y2 == null) continue;
      if (d.type === 'trend') {
        if (_ptSegDist(x, y, x1, y1, x2, y2) < 6) return i;
      } else if (d.type === 'rect') {
        const rx1 = Math.min(x1, x2) - 4, rx2 = Math.max(x1, x2) + 4;
        const ry1 = Math.min(y1, y2) - 4, ry2 = Math.max(y1, y2) + 4;
        if (x >= rx1 && x <= rx2 && y >= ry1 && y <= ry2) return i;
      } else if (d.type === 'fib' || d.type === 'fibext') {
        if (_ptSegDist(x, y, x1, y1, x2, y2) < 6) return i; 
        const drawnHighFirst = d.p1.price >= d.p2.price;
        const priceHigh = Math.max(d.p1.price, d.p2.price), priceLow = Math.min(d.p1.price, d.p2.price);
        const range = priceHigh - priceLow || 1e-9;
        const xLeft = Math.min(x1, x2) - 4, xRight = Math.max(x1, x2) + 4;
        const levels = d.type === 'fibext' ? FIB_EXT_LEVELS : FIB_LEVELS;
        const isRetracement = d.type === 'fib';
        for (const lv of levels) {
          const lvPrice = isRetracement
            ? (d.p2.price + lv * (d.p1.price - d.p2.price))
            : (drawnHighFirst ? (priceHigh - lv * range) : (priceLow + lv * range));
          const ly = candleSeries.priceToCoordinate(lvPrice);
          if (ly != null && x >= xLeft && x <= xRight && Math.abs(y - ly) < 5) return i;
        }
      }
    }
    return -1;
  }

  function _hitTestHandle(idx, x, y) {
    const d = _curDrawings()[idx];
    if (!d) return null;
    const ts = _lwChart.timeScale();
    const x1 = _xForPoint(ts, d.p1), y1 = candleSeries.priceToCoordinate(d.p1.price);
    const x2 = _xForPoint(ts, d.p2), y2 = candleSeries.priceToCoordinate(d.p2.price);
    if (x1 != null && y1 != null && Math.hypot(x - x1, y - y1) <= _HANDLE_R) return 'p1';
    if (x2 != null && y2 != null && Math.hypot(x - x2, y - y2) <= _HANDLE_R) return 'p2';
    return null;
  }

  function _hideDrawToolbar() {
    if (_drawToolbarEl) { _drawToolbarEl.remove(); _drawToolbarEl = null; }
  }

  function _positionDrawToolbar() {
    if (!_drawToolbarEl || _selectedIdx < 0) return;
    const d = _curDrawings()[_selectedIdx];
    if (!d) return;
    const ts = _lwChart.timeScale();
    const x1 = _xForPoint(ts, d.p1), y1 = candleSeries.priceToCoordinate(d.p1.price);
    const x2 = _xForPoint(ts, d.p2), y2 = candleSeries.priceToCoordinate(d.p2.price);
    if (x1 == null || y1 == null || x2 == null || y2 == null) return;
    const rect = chartDiv.getBoundingClientRect();
    const midX = (x1 + x2) / 2;
    const topY = Math.min(y1, y2);
    const bottomY = Math.max(y1, y2);
    const barW = _drawToolbarEl.offsetWidth || 200;
    const barH = _drawToolbarEl.offsetHeight || 32;
    let top = rect.top + topY - barH - 10;
    if (top < 8) top = rect.top + bottomY + 10; 
    let left = rect.left + midX - barW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - barW - 8));
    _drawToolbarEl.style.left = left + 'px';
    _drawToolbarEl.style.top  = top + 'px';
  }

  function _showDrawToolbar() {
    _hideDrawToolbar();
    if (_selectedIdx < 0) return;
    const d = _curDrawings()[_selectedIdx];
    if (!d) return;

    const bar = document.createElement('div');
    bar.id = '_lw-draw-toolbar';
    bar.style.cssText = [
      'position:fixed;z-index:9999;display:flex;align-items:center;gap:6px;',
      'background:var(--head-bg);border:1px solid var(--border);border-radius:6px;',
      'box-shadow:0 8px 32px rgba(0,0,0,.7);padding:5px 7px;',
    ].join('');

    _SWATCH_COLORS.forEach(c => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.title = 'Color';
      sw.style.cssText = 'width:14px;height:14px;border-radius:50%;cursor:pointer;padding:0;'
        + `background:${c};border:1px solid rgba(255,255,255,0.25);`
        + (d.color === c ? 'outline:2px solid var(--text,#e8e8e8);outline-offset:1px;' : '');
      sw.addEventListener('click', e => {
        e.stopPropagation();
        d.color = c;
        _saveDrawings();
        _renderDrawings();
        _showDrawToolbar();
      });
      bar.appendChild(sw);
    });

    const customWrap = document.createElement('label');
    customWrap.title = 'Custom color';
    customWrap.style.cssText = 'width:14px;height:14px;border-radius:50%;border:1px dashed var(--text3);'
      + 'position:relative;display:inline-block;cursor:pointer;overflow:hidden;';
    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.style.cssText = 'position:absolute;inset:-4px;width:22px;height:22px;border:none;padding:0;cursor:pointer;opacity:0;';
    customInput.addEventListener('input', e => {
      const hex = e.target.value;
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      d.color = `rgba(${r},${g},${b},0.9)`;
      _saveDrawings();
      _renderDrawings();
    });
    customWrap.appendChild(customInput);
    bar.appendChild(customWrap);

    const divider = document.createElement('div');
    divider.style.cssText = 'width:1px;height:16px;background:var(--border);margin:0 2px;';
    bar.appendChild(divider);

    const del = document.createElement('button');
    del.type = 'button';
    del.title = 'Delete';
    del.style.cssText = 'width:20px;height:20px;border:none;background:transparent;color:var(--text3);'
      + 'cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:4px;';
    del.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-.87 13.14A2 2 0 0 1 16.14 21H7.86a2 2 0 0 1-1.99-1.86L5 6"/></svg>';
    del.addEventListener('mouseenter', () => { del.style.background = 'rgba(255,99,99,0.15)'; del.style.color = '#ff6363'; });
    del.addEventListener('mouseleave', () => { del.style.background = 'transparent'; del.style.color = 'var(--text3)'; });
    del.addEventListener('click', e => {
      e.stopPropagation();
      _curDrawings().splice(_selectedIdx, 1);
      _selectedIdx = -1;
      _saveDrawings();
      _renderDrawings();
      _hideDrawToolbar();
    });
    bar.appendChild(del);

    bar.addEventListener('mousedown', e => e.stopPropagation());
    bar.addEventListener('click', e => e.stopPropagation());

    document.body.appendChild(bar);
    _drawToolbarEl = bar;
    _positionDrawToolbar();
  }

  function _cancelDrawMode() {
    _drawMode = null; _drawAnchor = null; _drawLiveEnd = null; _isDragging = false;
    _setChartPannable(true);
    _updateDrawBtnState();
    _renderDrawings();
  }

  function _clientToPixel(clientX, clientY) {
    try {
      const rect = chartDiv.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    } catch(_) { return null; }
  }
  function _extrapolateTimeForIndex(data, lastIdx, targetIdx) {
    const stepsAhead = targetIdx - lastIdx;
    if (stepsAhead <= 0) return null;
    const lastTime = data[lastIdx].time;
    if (_lwActiveTf === 'H1' || _lwActiveTf === 'H4') {
      const stepSec = _lwActiveTf === 'H1' ? 3600 : 14400;
      return lastTime + stepsAhead * stepSec;
    }
    if (typeof lastTime !== 'string') return null; 
    let d = new Date(lastTime + 'T00:00:00Z');
    for (let i = 0; i < stepsAhead; i++) {
      if (_lwActiveTf === 'MN') {
        d.setUTCMonth(d.getUTCMonth() + 1);
      } else if (_lwActiveTf === 'W1') {
        d.setUTCDate(d.getUTCDate() + 7);
      } else {
        do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
      }
    }
    return d.toISOString().slice(0, 10);
  }

  function _timeToEpoch(t) {
    if (t == null) return null;
    if (typeof t === 'number') return t; 
    if (typeof t === 'string') { const ms = Date.parse(t + 'T00:00:00Z'); return Number.isNaN(ms) ? null : Math.floor(ms / 1000); }
    return null;
  }
  function _epochToActiveTime(epochSec) {
    if (epochSec == null) return null;
    if (_lwActiveTf === 'H1' || _lwActiveTf === 'H4') return epochSec;
    return new Date(epochSec * 1000).toISOString().slice(0, 10);
  }

  function _resolveTimeAt(ts, x) {
    const time = ts.coordinateToTime(x);
    if (time != null) return { time: _timeToEpoch(time) };
    try {
      const logical = ts.coordinateToLogical(x);
      if (logical == null) return null;
      const data = candleSeries.data();
      if (!data || !data.length) return null;
      const lastIdx = data.length - 1;
      const futureIndex = Math.round(logical);
      if (futureIndex <= lastIdx) return null;
      const t = _extrapolateTimeForIndex(data, lastIdx, futureIndex);
      if (t == null) return null;
      return { time: _timeToEpoch(t), futureIndex };
    } catch(_) { return null; }
  }

  function _logicalToX(ts, logicalInt) {
    return ts.logicalToCoordinate(logicalInt);
  }
  function _interpX(ts, loIdx, hiIdx, frac) {
    const xLo = _logicalToX(ts, loIdx), xHi = _logicalToX(ts, hiIdx);
    if (xLo == null || xHi == null) return null;
    return xLo + (xHi - xLo) * frac;
  }
  function _epochToXInterpolated(ts, epochSec) {
    if (epochSec == null) return null;
    const direct = ts.timeToCoordinate(_epochToActiveTime(epochSec));
    if (direct != null) return direct;
    try {
      const data = candleSeries.data();
      if (!data || data.length < 2) return null;
      const n = data.length;
      const e0 = _timeToEpoch(data[0].time);
      const eN = _timeToEpoch(data[n - 1].time);
      if (epochSec <= e0) {
        const e1 = _timeToEpoch(data[1].time);
        const step = e1 - e0;
        if (!step) return null;
        return _interpX(ts, 0, 1, -(e0 - epochSec) / step);
      }
      if (epochSec >= eN) {
        const eNm1 = _timeToEpoch(data[n - 2].time);
        const step = eN - eNm1;
        if (!step) return _logicalToX(ts, n - 1);
        return _interpX(ts, n - 2, n - 1, 1 + (epochSec - eN) / step);
      }
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (_timeToEpoch(data[mid].time) <= epochSec) lo = mid; else hi = mid;
      }
      const eLo = _timeToEpoch(data[lo].time), eHi = _timeToEpoch(data[hi].time);
      const frac = eHi > eLo ? (epochSec - eLo) / (eHi - eLo) : 0;
      return _interpX(ts, lo, hi, frac);
    } catch (_) { return null; }
  }

  function _xForPoint(ts, pt) {
    if (!pt) return null;
    const x = _epochToXInterpolated(ts, pt.time);
    if (x != null) return x;
    if (pt.futureIndex != null) { try { return ts.logicalToCoordinate(pt.futureIndex); } catch(_) { return null; } }
    return null;
  }

  function _drawPointToTP(clientX, clientY) {
    const px = _clientToPixel(clientX, clientY);
    if (!px) return null;
    try {
      const ts    = _lwChart.timeScale();
      const price = candleSeries.coordinateToPrice(px.y);
      if (price == null) return null;
      const r = _resolveTimeAt(ts, px.x);
      if (!r) return null;
      return { time: r.time, price, futureIndex: r.futureIndex };
    } catch(_) { return null; }
  }

  chartDiv.addEventListener('pointerdown', e => {
    if (_drawMode) {
      const pt = _drawPointToTP(e.clientX, e.clientY);
      if (!pt) return;
      _drawAnchor  = pt;
      _drawLiveEnd = pt;
      _isDragging  = true;
      _setChartPannable(false); 
      try { e.preventDefault(); } catch(_) {}
      return;
    }

    const px = _clientToPixel(e.clientX, e.clientY);
    if (!px) return;
    const arr = _curDrawings();

    if (_selectedIdx >= 0 && arr[_selectedIdx]) {
      const handle = _hitTestHandle(_selectedIdx, px.x, px.y);
      if (handle) {
        _dragMode = 'resize-' + handle;
        _setChartPannable(false);
        try { e.preventDefault(); } catch(_) {}
        return;
      }
    }

    const hitIdx = _hitTestDrawing(px.x, px.y);
    if (hitIdx >= 0) {
      _selectedIdx = hitIdx;
      _dragMode    = 'move';
      _dragStartPx = px;
      _dragOrigP1  = { time: arr[hitIdx].p1.time, price: arr[hitIdx].p1.price, futureIndex: arr[hitIdx].p1.futureIndex };
      _dragOrigP2  = { time: arr[hitIdx].p2.time, price: arr[hitIdx].p2.price, futureIndex: arr[hitIdx].p2.futureIndex };
      _setChartPannable(false);
      _renderDrawings();
      _showDrawToolbar();
      try { e.preventDefault(); } catch(_) {}
    } else if (_selectedIdx >= 0) {
      _selectedIdx = -1;
      _renderDrawings();
      _hideDrawToolbar();
    }
  }, true); 

  if (window._lwDrawDocPointerMove) document.removeEventListener('pointermove', window._lwDrawDocPointerMove);
  window._lwDrawDocPointerMove = function(e) {
    if (_isDragging) {
      const pt = _drawPointToTP(e.clientX, e.clientY);
      if (!pt) return;
      _drawLiveEnd = pt;
      _renderDrawings();
      return;
    }
    if (!_dragMode || _selectedIdx < 0) return;
    const d = _curDrawings()[_selectedIdx];
    if (!d) { _dragMode = null; return; }
    const ts = _lwChart.timeScale();
    if (_dragMode === 'move') {
      const px = _clientToPixel(e.clientX, e.clientY);
      if (!px || !_dragStartPx || !_dragOrigP1 || !_dragOrigP2) return;
      const ox1 = _xForPoint(ts, _dragOrigP1), oy1 = candleSeries.priceToCoordinate(_dragOrigP1.price);
      const ox2 = _xForPoint(ts, _dragOrigP2), oy2 = candleSeries.priceToCoordinate(_dragOrigP2.price);
      if (ox1 == null || oy1 == null || ox2 == null || oy2 == null) return;
      const dx = px.x - _dragStartPx.x, dy = px.y - _dragStartPx.y;
      const r1 = _resolveTimeAt(ts, ox1 + dx), np1 = candleSeries.coordinateToPrice(oy1 + dy);
      const r2 = _resolveTimeAt(ts, ox2 + dx), np2 = candleSeries.coordinateToPrice(oy2 + dy);
      if (!r1 || !r2 || np1 == null || np2 == null) return;
      d.p1 = { time: r1.time, price: np1, futureIndex: r1.futureIndex };
      d.p2 = { time: r2.time, price: np2, futureIndex: r2.futureIndex };
      _renderDrawings();
    } else if (_dragMode === 'resize-p1' || _dragMode === 'resize-p2') {
      const pt = _drawPointToTP(e.clientX, e.clientY);
      if (!pt) return;
      if (_dragMode === 'resize-p1') d.p1 = pt; else d.p2 = pt;
      _renderDrawings();
    }
  };
  document.addEventListener('pointermove', window._lwDrawDocPointerMove);

  if (window._lwDrawDocPointerUp) document.removeEventListener('pointerup', window._lwDrawDocPointerUp);
  window._lwDrawDocPointerUp = function(e) {
    if (_dragMode) {
      _dragMode = null;
      _dragStartPx = null; _dragOrigP1 = null; _dragOrigP2 = null;
      _setChartPannable(true);
      _saveDrawings();
      _renderDrawings();
      if (_selectedIdx >= 0) _positionDrawToolbar();
      return;
    }
    if (!_isDragging) return;
    _isDragging = false;
    _setChartPannable(true);
    const anchor = _drawAnchor;
    const end = _drawPointToTP(e.clientX, e.clientY) || _drawLiveEnd;
    _drawAnchor = null; _drawLiveEnd = null;
    if (!anchor || !end) { _renderDrawings(); return; }
    try {
      const ts = _lwChart.timeScale();
      const ax = _xForPoint(ts, anchor), ay = candleSeries.priceToCoordinate(anchor.price);
      const bx = _xForPoint(ts, end),    by = candleSeries.priceToCoordinate(end.price);
      const dist = (ax != null && ay != null && bx != null && by != null) ? Math.hypot(bx - ax, by - ay) : 0;
      if (dist < 8) { _renderDrawings(); return; }
    } catch(_) {}
    _curDrawings().push({
      id: 'dr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: _drawMode,
      p1: anchor,
      p2: end,
      color: _DRAW_COLORS[_drawMode],
    });
    _saveDrawings();
    _drawMode = null;
    _updateDrawBtnState();
    _renderDrawings();
  };
  document.addEventListener('pointerup', window._lwDrawDocPointerUp);

  if (window._lwDrawEscHandler) document.removeEventListener('keydown', window._lwDrawEscHandler);
  window._lwDrawEscHandler = function(e) {
    if (e.key === 'Escape') {
      if (_drawMode) { _cancelDrawMode(); return; }
      if (_selectedIdx >= 0) { _selectedIdx = -1; _renderDrawings(); _hideDrawToolbar(); }
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (_selectedIdx < 0) return;
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
      _curDrawings().splice(_selectedIdx, 1);
      _selectedIdx = -1;
      _saveDrawings();
      _renderDrawings();
      _hideDrawToolbar();
      return;
    }
    if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
      if (_selectedIdx < 0) return;
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
      const d = _curDrawings()[_selectedIdx];
      if (!d) return;
      window._lwDrawClipboard = JSON.parse(JSON.stringify(d));
      e.preventDefault();
      return;
    }
    if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
      if (!window._lwDrawClipboard) return;
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
      const src = window._lwDrawClipboard;
      const ts  = _lwChart.timeScale();
      const PASTE_OFFSET_PX = 24;
      let p1 = { time: src.p1.time, price: src.p1.price, futureIndex: src.p1.futureIndex };
      let p2 = { time: src.p2.time, price: src.p2.price, futureIndex: src.p2.futureIndex };
      const x1 = _xForPoint(ts, src.p1), y1 = candleSeries.priceToCoordinate(src.p1.price);
      const x2 = _xForPoint(ts, src.p2), y2 = candleSeries.priceToCoordinate(src.p2.price);
      if (x1 != null && y1 != null && x2 != null && y2 != null) {
        const r1 = _resolveTimeAt(ts, x1 + PASTE_OFFSET_PX);
        const r2 = _resolveTimeAt(ts, x2 + PASTE_OFFSET_PX);
        const np1 = candleSeries.coordinateToPrice(y1 + PASTE_OFFSET_PX);
        const np2 = candleSeries.coordinateToPrice(y2 + PASTE_OFFSET_PX);
        if (r1 && r2 && np1 != null && np2 != null) {
          p1 = { time: r1.time, price: np1, futureIndex: r1.futureIndex };
          p2 = { time: r2.time, price: np2, futureIndex: r2.futureIndex };
        }
      }
      const copy = {
        id: 'dr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type: src.type,
        p1, p2,
        color: src.color,
      };
      _curDrawings().push(copy);
      _selectedIdx = _curDrawings().length - 1;
      _saveDrawings();
      _renderDrawings();
      _showDrawToolbar();
      e.preventDefault();
    }
  };
  document.addEventListener('keydown', window._lwDrawEscHandler);

  let _drawDropdownOpen = false;
  function _closeDrawDropdown() {
    const p = document.getElementById('_lw-draw-dropdown');
    if (p) p.remove();
    _drawDropdownOpen = false;
    const b = document.getElementById('lw-draw-btn');
    if (b) b.setAttribute('aria-expanded', 'false');
  }
  function _openDrawDropdown() {
    if (_drawDropdownOpen) { _closeDrawDropdown(); return; }
    _closeDrawDropdown();
    _drawDropdownOpen = true;
    const btn = document.getElementById('lw-draw-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');

    const pop = document.createElement('div');
    pop.id = '_lw-draw-dropdown';
    pop.style.cssText = [
      'position:fixed;z-index:9999;background:var(--head-bg);border:1px solid var(--border);',
      'border-radius:6px;box-shadow:0 8px 32px rgba(0,0,0,.7);',
      'font-size:11px;font-family:var(--font-ui,sans-serif);min-width:210px;max-width:260px;',
    ].join('');

    function _addOption(label, desc, onClick) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-direction:column;padding:7px 12px;cursor:pointer;border-bottom:1px solid rgba(42,46,57,0.3);';
      row.innerHTML = `<div style="color:var(--text);font-weight:600;font-size:11px">${label}</div>`
                     + `<div style="color:var(--text3);font-size:9px;margin-top:1px">${desc}</div>`;
      row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,0.04)');
      row.addEventListener('mouseleave', () => row.style.background = 'transparent');
      row.addEventListener('click', e => { e.stopPropagation(); onClick(); _closeDrawDropdown(); });
      pop.appendChild(row);
    }
    _addOption('Trend Line', 'Click and drag on the chart', () => {
      _selectedIdx = -1; _hideDrawToolbar();
      _drawMode = 'trend'; _drawAnchor = null; _drawLiveEnd = null; _updateDrawBtnState(); _renderDrawings();
    });
    _addOption('Fibonacci Retracement', 'Drag from the swing start to the swing end', () => {
      _selectedIdx = -1; _hideDrawToolbar();
      _drawMode = 'fib'; _drawAnchor = null; _drawLiveEnd = null; _updateDrawBtnState(); _renderDrawings();
    });
    _addOption('Fibonacci Extension', 'Drag from the swing start to the swing end — projects 127.2/161.8/200/261.8% continuation targets', () => {
      _selectedIdx = -1; _hideDrawToolbar();
      _drawMode = 'fibext'; _drawAnchor = null; _drawLiveEnd = null; _updateDrawBtnState(); _renderDrawings();
    });
    _addOption('Rectangle', 'Drag to mark a price/time zone', () => {
      _selectedIdx = -1; _hideDrawToolbar();
      _drawMode = 'rect'; _drawAnchor = null; _drawLiveEnd = null; _updateDrawBtnState(); _renderDrawings();
    });
    if (_curDrawings().length > 0) {
      _addOption('Clear All Drawings', `Remove ${_curDrawings().length} drawing(s) on this chart`, () => {
        window._lwDrawings[_drawSymKey] = [];
        _selectedIdx = -1;
        _hideDrawToolbar();
        _saveDrawings();
        _renderDrawings();
      });
    }

    const footer = document.createElement('div');
    footer.style.cssText = 'padding:6px 12px;color:var(--text3);font-size:9px;line-height:1.4;border-top:1px solid rgba(42,46,57,0.3);';
    footer.textContent = 'Click a drawing to select it. Drag its body to move, drag an endpoint to resize. Color and delete appear in a toolbar above the selection. Ctrl+C / Ctrl+V copies and pastes it.';
    pop.appendChild(footer);

    document.body.appendChild(pop);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const popW = pop.offsetWidth || 210;
      let left = rect.left;
      if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
      const popH = pop.offsetHeight || 130;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= popH + 8 ? rect.bottom + 4 : rect.top - popH - 4;
      pop.style.top  = Math.max(8, top) + 'px';
      pop.style.left = Math.max(8, left) + 'px';
    }
    pop.addEventListener('click',     e => e.stopPropagation());
    pop.addEventListener('mousedown', e => e.stopPropagation());
    setTimeout(() => {
      document.addEventListener('mousedown', function _outsideClose(e) {
        const b = document.getElementById('lw-draw-btn');
        if (b && b.contains(e.target)) return;
        _closeDrawDropdown();
      }, { once: true });
    }, 0);
  }

  (function _attachDrawBtn() {
    const btn = document.getElementById('lw-draw-btn');
    if (!btn) return;
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', e => { e.stopPropagation(); _openDrawDropdown(); });
  })();

  function _iSMA(src, n) {
    const out = [];
    for (let i = n - 1; i < src.length; i++) {
      let s = 0; for (let j = 0; j < n; j++) s += src[i - j];
      out.push(s / n);
    }
    return out;
  }
  function _iEMA(src, n) {
    const k = 2 / (n + 1); const out = [src[0]];
    for (let i = 1; i < src.length; i++) out.push(src[i] * k + out[i - 1] * (1 - k));
    return out;
  }
  function _iWMA(src, n) {
    const out = []; const denom = n * (n + 1) / 2;
    for (let i = n - 1; i < src.length; i++) {
      let s = 0; for (let j = 0; j < n; j++) s += src[i - j] * (n - j);
      out.push(s / denom);
    }
    return out;
  }
  function _iDEMA(src, n) { 
    const e1 = _iEMA(src, n);
    const e2 = _iEMA(e1, n);
    return e1.slice(e1.length - e2.length).map((v, i) => 2 * v - e2[i]);
  }
  function _iTEMA(src, n) { 
    const e1 = _iEMA(src, n);
    const e2 = _iEMA(e1, n);
    const e3 = _iEMA(e2, n);
    const off1 = e1.length - e3.length;
    const off2 = e2.length - e3.length;
    return e3.map((v3, i) => 3 * e1[off1 + i] - 3 * e2[off2 + i] + v3);
  }
  function _iVWMA(bars, n) { 
    const out = [];
    for (let i = n - 1; i < bars.length; i++) {
      let sumPV = 0, sumV = 0;
      for (let j = 0; j < n; j++) { sumPV += bars[i-j].close * (bars[i-j].volume||1); sumV += (bars[i-j].volume||1); }
      out.push(sumPV / sumV);
    }
    return out;
  }
  function _iMA(type, closes, bars, n) {
    switch (type) {
      case 'SMA':  return _iSMA(closes, n);
      case 'EMA':  return _iEMA(closes, n);
      case 'WMA':  return _iWMA(closes, n);
      case 'HMA': { const half=Math.round(n/2),sqrtp=Math.round(Math.sqrt(n));
                    const wH=_iWMA(closes,half),wP=_iWMA(closes,n);
                    const off=n-half;
                    const raw=wH.slice(off).map((v,i)=>2*v-wP[i+off]);
                    return _iWMA(raw,sqrtp); }
      case 'DEMA': return _iDEMA(closes, n);
      case 'TEMA': return _iTEMA(closes, n);
      case 'VWMA': return _iVWMA(bars, n);
      default:     return _iEMA(closes, n);
    }
  }
  function _iStdev(src, n) {
    const out = [];
    for (let i = n - 1; i < src.length; i++) {
      const slice = src.slice(i - n + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / n;
      const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
      out.push(Math.sqrt(variance));
    }
    return out;
  }
  function _iRMA(src, n) { 
    const k = 1 / n; const out = [src[0]];
    for (let i = 1; i < src.length; i++) out.push(src[i] * k + out[i - 1] * (1 - k));
    return out;
  }
  function _iTR(bars) { 
    return bars.map((b, i) => {
      if (i === 0) return b.high - b.low;
      const pc = bars[i - 1].close;
      return Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc));
    });
  }
  const _PIVOT_TF_RANK = { H1: 0, H4: 1, D1: 2, W1: 3, MN: 4 };
  const _PIVOT_MAX_TF  = { D: 1, W: 2, M: 3 }; 
  function _pivotTfOk(unit) {
    const rank = _PIVOT_TF_RANK[_lwActiveTf];
    return rank !== undefined && rank <= _PIVOT_MAX_TF[unit];
  }
  function _iPivotPeriodKey(rawT, unit) {
    const t = _timeToEpoch(rawT);
    const d = new Date(t * 1000);
    if (unit === 'D') return Math.floor(t / 86400);
    if (unit === 'M') return d.getUTCFullYear() * 12 + d.getUTCMonth();
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = (dt.getUTCDay() + 6) % 7; 
    dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
    const ftDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - ftDayNum + 3);
    const weekNum = 1 + Math.round((dt - firstThursday) / (7 * 86400000));
    return dt.getUTCFullYear() * 100 + weekNum;
  }
  function _iAggregatePeriods(bars, unit) {
    const periods = [];
    let cur = null;
    bars.forEach(b => {
      const key = _iPivotPeriodKey(b.time, unit);
      if (!cur || cur.key !== key) {
        cur = { key, high: b.high, low: b.low, close: b.close, count: 1 };
        periods.push(cur);
      } else {
        cur.high = Math.max(cur.high, b.high);
        cur.low = Math.min(cur.low, b.low);
        cur.close = b.close; 
        cur.count++;
      }
    });
    return periods;
  }
  function _iPivotLevels(H, L, C) {
    const PP = (H + L + C) / 3;
    return {
      R3: H + 2 * (PP - L), R2: PP + (H - L), R1: 2 * PP - L,
      PP,
      S1: 2 * PP - H, S2: PP - (H - L), S3: L - 2 * (H - PP),
    };
  }
  function _calcPivotSeries(bars, unit, id, dec) {
    if (!_pivotTfOk(unit)) return [];
    const periods = _iAggregatePeriods(bars, unit);
    if (periods.length < 2) return [];
    const levelsByKey = {}, countByKey = {};
    for (let i = 1; i < periods.length; i++) {
      levelsByKey[periods[i].key] = _iPivotLevels(periods[i-1].high, periods[i-1].low, periods[i-1].close);
      countByKey[periods[i].key] = periods[i].count;
    }
    const fields = ['R3','R2','R1','PP','S1','S2','S3'];
    const out = {}; fields.forEach(f => out[f] = []);
    let curKey = null;
    for (let i = 0; i < bars.length; i++) {
      const key = _iPivotPeriodKey(bars[i].time, unit);
      const lv = levelsByKey[key];
      if (!lv) continue; 
      if (curKey !== null && key !== curKey && countByKey[key] > 1) {
        fields.forEach(f => out[f].push({ time: bars[i].time }));
        curKey = key;
        continue;
      }
      fields.forEach(f => out[f].push({ time: bars[i].time, value: parseFloat(lv[f].toFixed(dec)) }));
      curKey = key;
    }
    const unitLabel = unit === 'D' ? 'D' : (unit === 'W' ? 'W' : 'M');
    const segStartsByField = {};
    fields.forEach(f => {
      const arr = out[f];
      let lastStart = null;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].value === undefined) continue;
        const prev = arr[i - 1];
        if (i === 0 || !prev || prev.value === undefined) {
          lastStart = { time: arr[i].time, value: arr[i].value };
        }
      }
      segStartsByField[f] = lastStart ? [lastStart] : [];
    });
    return fields.map((f, i) => ({
      data: out[f], color: _iC(id, i), lineWidth: 1, dashed: f === 'PP',
      label: `${unitLabel} ${f}`,
      title: `${unitLabel}${f}`,
      segStarts: segStartsByField[f],
    }));
  }

  function _iAlign(arr, bars) {
    const pad = bars.length - arr.length;
    return bars.map((b, i) => {
      const v = arr[i - pad];
      return { time: b.time, value: (v != null && !isNaN(v)) ? v : NaN };
    }).filter(d => !isNaN(d.value));
  }
  function _iZip(timesA, valA, valB) {
    return timesA.map((t, i) => ({ time: t, value: valB[i] })).filter(d => !isNaN(d.value));
  }

  const _IND_CATALOGUE = [
    { id:'ma',       group:'Moving Averages', label:'Moving Average',    desc:'Add configurable MAs (SMA/EMA/WMA/HMA/DEMA/TEMA/VWMA)', type:'overlay',    defaultParams:{},                              paramDefs:[], colors:[] },
    { id:'vwap',     group:'Overlays',        label:'VWAP',              desc:'Volume-Weighted Avg Price (daily sessions)',             type:'overlay',    defaultParams:{},                              paramDefs:[], colors:['#ff5722'], volRequired:true },
    { id:'bb',       group:'Overlays',        label:'Bollinger Bands',   desc:'Bollinger Bands',                                        type:'overlay',    defaultParams:{ period:20, mult:2 },           paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:500,step:1},{key:'mult',label:'Mult',type:'float',min:0.1,max:10,step:0.1}], colors:['rgba(33,150,243,0.5)','rgba(33,150,243,0.9)','rgba(33,150,243,0.9)'] },
    { id:'keltner',  group:'Overlays',        label:'Keltner Channel',   desc:'Keltner Channel',                                        type:'overlay',    defaultParams:{ period:20, mult:1.5 },         paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:500,step:1},{key:'mult',label:'Mult',type:'float',min:0.1,max:10,step:0.1}], colors:['rgba(255,152,0,0.5)','rgba(255,152,0,0.9)','rgba(255,152,0,0.9)'] },
    { id:'donchian', group:'Overlays',        label:'Donchian Channel',  desc:'Donchian Channel',                                       type:'overlay',    defaultParams:{ period:20 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:500,step:1}], colors:['rgba(156,39,176,0.8)','rgba(156,39,176,0.8)','rgba(156,39,176,0.4)'] },
    { id:'psar',     group:'Overlays',        label:'Parabolic SAR',     desc:'Parabolic SAR',                                          type:'overlay',    defaultParams:{ step:0.02, max:0.2 },          paramDefs:[{key:'step',label:'Step',type:'float',min:0.001,max:0.1,step:0.001},{key:'max',label:'Max AF',type:'float',min:0.01,max:0.5,step:0.01}], colors:['#f44336'] },
    { id:'ichimoku', group:'Overlays',        label:'Ichimoku Cloud',    desc:'Ichimoku Kinko Hyo · 9/26/52',                          type:'overlay',    defaultParams:{},                              paramDefs:[], colors:['#26a69a','#ef5350','rgba(38,166,154,0.3)','rgba(239,83,80,0.3)','rgba(120,123,134,0.4)'] },
    { id:'supertrend', group:'Overlays',      label:'Supertrend',       desc:'ATR-based trend-following overlay — flips support/resistance on trend change', type:'overlay', defaultParams:{ period:10, mult:3 }, paramDefs:[{key:'period',label:'ATR Period',type:'int',min:1,max:100,step:1},{key:'mult',label:'Multiplier',type:'float',min:0.5,max:10,step:0.1}], colors:['#26a69a','#ef5350'] },
    { id:'fxfv',     group:'Overlays',        label:'FX Fair Value',     desc:'Model fair value from the rate-differential + risk regression (60-day rolling)', type:'overlay', defaultParams:{}, paramDefs:[], colors:['#ba68c8'] },
    { id:'retailavg', group:'Overlays',       label:'Retail Avg Entry',  desc:'Myfxbook average entry price for the dominant retail long/short side', type:'overlay', defaultParams:{}, paramDefs:[], colors:['#ffca28'] },
    { id:'pivotd',   group:'Overlays',        label:'Pivot Points (Daily)',   desc:'Classic pivot, R1-R3 / S1-S3 — computed from the prior day\'s H/L/C', type:'overlay', defaultParams:{}, paramDefs:[], colors:['#ef5350','#ff7043','#ffab91','#9e9e9e','#a5d6a7','#66bb6a','#26a69a'] },
    { id:'pivotw',   group:'Overlays',        label:'Pivot Points (Weekly)',  desc:'Classic pivot, R1-R3 / S1-S3 — computed from the prior week\'s H/L/C', type:'overlay', defaultParams:{}, paramDefs:[], colors:['#ef5350','#ff7043','#ffab91','#9e9e9e','#a5d6a7','#66bb6a','#26a69a'] },
    { id:'pivotm',   group:'Overlays',        label:'Pivot Points (Monthly)', desc:'Classic pivot, R1-R3 / S1-S3 — computed from the prior month\'s H/L/C', type:'overlay', defaultParams:{}, paramDefs:[], colors:['#ef5350','#ff7043','#ffab91','#9e9e9e','#a5d6a7','#66bb6a','#26a69a'] },
    { id:'rsi',      group:'Oscillators',     label:'RSI',               desc:'Relative Strength Index',                                type:'oscillator', defaultParams:{ period:14 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:200,step:1}], colors:['#64b5f6'] },
    { id:'stoch',    group:'Oscillators',     label:'Stochastic',        desc:'Stochastic Oscillator',                                  type:'oscillator', defaultParams:{ k:14, d:3, smooth:3 },         paramDefs:[{key:'k',label:'%K',type:'int',min:1,max:100,step:1},{key:'smooth',label:'Smooth',type:'int',min:1,max:20,step:1},{key:'d',label:'%D',type:'int',min:1,max:20,step:1}], colors:['#2196f3','#ff9800'] },
    { id:'macd',     group:'Oscillators',     label:'MACD',              desc:'MACD',                                                   type:'oscillator', defaultParams:{ fast:12, slow:26, signal:9 },  paramDefs:[{key:'fast',label:'Fast',type:'int',min:2,max:100,step:1},{key:'slow',label:'Slow',type:'int',min:2,max:200,step:1},{key:'signal',label:'Signal',type:'int',min:1,max:50,step:1}], colors:['#26a69a','#2196f3','#ff9800'], histoIdx:[0] },
    { id:'cci',      group:'Oscillators',     label:'CCI',               desc:'Commodity Channel Index',                                type:'oscillator', defaultParams:{ period:20 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:200,step:1}], colors:['#64b5f6'] },
    { id:'willr',    group:'Oscillators',     label:'Williams %R',       desc:'Williams %R',                                            type:'oscillator', defaultParams:{ period:14 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:200,step:1}], colors:['#64b5f6'] },
    { id:'roc',      group:'Oscillators',     label:'ROC',               desc:'Rate of Change',                                         type:'oscillator', defaultParams:{ period:12 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:1,max:200,step:1}], colors:['#4caf50'] },
    { id:'mom',      group:'Oscillators',     label:'Momentum',          desc:'Momentum',                                               type:'oscillator', defaultParams:{ period:10 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:1,max:200,step:1}], colors:['#9c27b0'] },
    { id:'mfi',      group:'Oscillators',     label:'MFI',               desc:'Money Flow Index (uses volume)',                         type:'oscillator', defaultParams:{ period:14 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:100,step:1}], colors:['#03a9f4'], volRequired:true },
    { id:'ao',       group:'Oscillators',     label:'Awesome Oscillator',desc:'Awesome Oscillator · 5/34',                              type:'oscillator', defaultParams:{},                              paramDefs:[], colors:['#26a69a'], histoIdx:[0] },
    { id:'trix',     group:'Oscillators',     label:'TRIX',              desc:'Triple Smoothed EMA',                                    type:'oscillator', defaultParams:{ period:18 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:200,step:1}], colors:['#64b5f6'] },
    { id:'dpo',      group:'Oscillators',     label:'DPO',               desc:'Detrended Price Oscillator',                             type:'oscillator', defaultParams:{ period:21 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:200,step:1}], colors:['#64b5f6'] },
    { id:'uo',       group:'Oscillators',     label:'Ultimate Osc.',     desc:'Ultimate Oscillator · 7/14/28',                          type:'oscillator', defaultParams:{},                              paramDefs:[], colors:['#64b5f6'] },
    { id:'atr',      group:'Volatility',      label:'ATR',               desc:'Average True Range',                                     type:'oscillator', defaultParams:{ period:14 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:1,max:200,step:1}], colors:['#64b5f6'] },
    { id:'adx',      group:'Volatility',      label:'ADX / DMI',         desc:'Average Directional Index + DI±',                        type:'oscillator', defaultParams:{ period:14 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:100,step:1}], colors:['#64b5f6','#26a69a','#ef5350'] },
    { id:'aroon',    group:'Volatility',      label:'Aroon',             desc:'Aroon Up/Down',                                          type:'oscillator', defaultParams:{ period:25 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:200,step:1}], colors:['#26a69a','#ef5350'] },
    { id:'chop',     group:'Volatility',      label:'Choppiness',        desc:'Choppiness Index',                                       type:'oscillator', defaultParams:{ period:14 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:100,step:1}], colors:['#64b5f6'] },
    { id:'obv',      group:'Volume',          label:'OBV',               desc:'On-Balance Volume',                                      type:'oscillator', defaultParams:{},                              paramDefs:[], colors:['#64b5f6'], volRequired:true },
    { id:'cmf',      group:'Volume',          label:'CMF',               desc:'Chaikin Money Flow',                                     type:'oscillator', defaultParams:{ period:20 },                   paramDefs:[{key:'period',label:'Period',type:'int',min:2,max:100,step:1}], colors:['#00acc1'], volRequired:true },
  ];

  const _LS_IND   = 'gi_ind_state';   
  const _LS_PARAMS = 'gi_ind_params'; 
  const _LS_MA    = 'gi_ma_list';     
  const _LS_LEVELS = 'gi_ind_levels'; 

  const _IND_LEVEL_DEFAULTS = {
    rsi:[30,50,70], stoch:[20,50,80], cci:[-100,0,100], willr:[-80,-50,-20],
    mfi:[20,50,80], uo:[30,50,70], chop:[38.2,61.8],
    macd:[0], roc:[0], mom:[0], ao:[0], trix:[0], dpo:[0], cmf:[0],
    adx:[25], aroon:[50],
  };

  const _DEFAULT_MA_LIST = [
    { uid:'ma_sma20',  type:'SMA', period:20,  color:'#2196f3', lineWidth:1, lineStyle:0 },
  ];

  function _lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(_) { return fallback; }
  }
  function _lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(_) {}
  }

  if (typeof window._lwIndState  === 'undefined') window._lwIndState  = _lsGet(_LS_IND,    {});
  if (typeof window._lwIndParams === 'undefined') window._lwIndParams = _lsGet(_LS_PARAMS,  {});
  if (typeof window._lwMaList    === 'undefined') window._lwMaList    = _lsGet(_LS_MA,      _DEFAULT_MA_LIST);
  if (typeof window._lwIndLevels === 'undefined') window._lwIndLevels = _lsGet(_LS_LEVELS,  {});

  function _saveIndState()  { _lsSet(_LS_IND,    window._lwIndState);  }
  function _saveIndParams() { _lsSet(_LS_PARAMS,  window._lwIndParams); }
  function _saveMaList()    { _lsSet(_LS_MA,      window._lwMaList);    }
  function _saveIndLevels() { _lsSet(_LS_LEVELS,  window._lwIndLevels); }

  function _iLevels(id) {
    const defaults = _IND_LEVEL_DEFAULTS[id] || [];
    const ov = window._lwIndLevels[id];
    return (Array.isArray(ov) && ov.length === defaults.length) ? ov : defaults.slice();
  }
  function _mkRefs(id, colors) {
    return _iLevels(id).map((v, i) => ({ v, color: colors[i] }));
  }

  const _maSeries = {}; 
  const _indPaneIndex = {}; 
  window._indPaneIndex = _indPaneIndex;
  window._indSeries = {}; const _indSeries = window._indSeries;
  const _indRefSeries = {}; 
  const _indPriceLines = {}; 

  function _iP(id) {
    const cfg = _IND_CATALOGUE.find(c => c.id === id);
    return Object.assign({}, cfg?.defaultParams || {}, window._lwIndParams[id] || {});
  }
  function _iC(id, i) {
    const cfg = _IND_CATALOGUE.find(c => c.id === id);
    const defaults = cfg?.colors || [];
    const custom   = (window._lwIndParams[id] || {}).colors || [];
    return custom[i] || defaults[i] || _themeColor('--text3');
  }

  function _calcIndData(id, bars) {
    const closes = bars.map(b => b.close);
    const highs  = bars.map(b => b.high);
    const lows   = bars.map(b => b.low);
    const vols   = bars.map(b => b.volume || 0);
    const p      = _iP(id); 

    const _cfgVolReq = (_IND_CATALOGUE.find(c => c.id === id) || {}).volRequired;
    if (_cfgVolReq && !hasVolume) return [];

    switch (id) {
      case 'ma': {
        return [];
      }
      case 'vwap': {
        const typicals = bars.map((b, i) => ({ t: b.time, tp: (b.high+b.low+b.close)/3, v: vols[i] }));
        let cumTPV = 0, cumV = 0, curDay = null;
        const data = typicals.map(({ t, tp, v }) => {
          const day = Math.floor(t / 86400); 
          if (day !== curDay) { curDay = day; cumTPV = 0; cumV = 0; }
          cumTPV += tp*v; cumV += v;
          return { time:t, value: cumV>0 ? cumTPV/cumV : tp };
        });
        return [{ data, color:_iC(id,0), lineWidth:1, label:'VWAP', dashed:true }];
      }
      case 'bb': {
        const { period:n, mult } = p;
        const sma   = _iSMA(closes, n);
        const stdev = _iStdev(closes, n);
        const mid   = _iAlign(sma, bars);
        const upper = _iAlign(sma.map((v,i) => v + mult * stdev[i]), bars);
        const lower = _iAlign(sma.map((v,i) => v - mult * stdev[i]), bars);
        return [
          { data: mid,   color:_iC(id,0), lineWidth:1, label:`BB(${n}) Mid` },
          { data: upper, color:_iC(id,1), lineWidth:1, label:`+${mult}σ` },
          { data: lower, color:_iC(id,2), lineWidth:1, label:`-${mult}σ` },
        ];
      }
      case 'keltner': {
        const { period:n, mult } = p;
        const ema   = _iEMA(closes, n);
        const tr    = _iTR(bars);
        const atr   = _iRMA(tr, n);
        const upper = ema.map((v,i) => v + mult * atr[i]);
        const lower = ema.map((v,i) => v - mult * atr[i]);
        return [
          { data: _iAlign(ema,   bars), color:_iC(id,0), lineWidth:1, label:`KC(${n}) Mid` },
          { data: _iAlign(upper, bars), color:_iC(id,1), lineWidth:1, label:`+${mult}×ATR` },
          { data: _iAlign(lower, bars), color:_iC(id,2), lineWidth:1, label:`-${mult}×ATR` },
        ];
      }
      case 'donchian': {
        const n = p.period;
        const upper = [], lower = [], mid = [];
        for (let i = n-1; i < bars.length; i++) {
          const sl = bars.slice(i-n+1, i+1);
          const h = Math.max(...sl.map(b=>b.high)), l = Math.min(...sl.map(b=>b.low));
          upper.push({ time:bars[i].time, value:h });
          lower.push({ time:bars[i].time, value:l });
          mid.push(  { time:bars[i].time, value:(h+l)/2 });
        }
        return [
          { data:upper, color:_iC(id,0), lineWidth:1, label:`DC(${n}) Upper` },
          { data:lower, color:_iC(id,1), lineWidth:1, label:`DC Lower` },
          { data:mid,   color:_iC(id,2), lineWidth:1, label:`DC Mid`, dashed:true },
        ];
      }
      case 'psar': {
        const { step, max:maxAF } = p;
        let bull=true, ep=bars[0].high, af=step, sar=bars[0].low;
        const data=[];
        for(let i=1;i<bars.length;i++){
          const prev=bars[i-1];
          sar = sar + af*(ep-sar);
          if(bull){
            if(bars[i].low<sar){bull=false;sar=ep;ep=bars[i].low;af=step;}
            else{if(bars[i].high>ep){ep=bars[i].high;af=Math.min(af+step,maxAF);}}
            sar=Math.min(sar,prev.low,bars[Math.max(0,i-2)].low);
          } else {
            if(bars[i].high>sar){bull=true;sar=ep;ep=bars[i].high;af=step;}
            else{if(bars[i].low<ep){ep=bars[i].low;af=Math.min(af+step,maxAF);}}
            sar=Math.max(sar,prev.high,bars[Math.max(0,i-2)].high);
          }
          data.push({time:bars[i].time,value:parseFloat(sar.toFixed(dec))});
        }
        return [{ data, color:_iC(id,0), lineWidth:0, label:'PSAR', markers:true }];
      }
      case 'fxfv': {
        const fv = (window._lwFvSummary || {})[ohlcId];
        if (!fv || fv.accumulating || fv.fairValue == null) return [];
        const val = fv.fairValue;
        return [{ level:true, value: val, color:_iC(id,0), axisTitle:'FV', label:'FX Fair Value' }];
      }
      case 'retailavg': {
        const pm = (window.PAIRS || []).find(pp => pp.id === ohlcId);
        const key = pm ? (pm.label || (pm.base + '/' + pm.quote)).toUpperCase() : null;
        const ret = key ? RETAIL_SENTIMENT_CACHE[key] : null;
        if (!ret) return [];
        const dominant = (ret.longPct ?? 0) >= (ret.shortPct ?? 0) ? 'long' : 'short';
        const val = dominant === 'long' ? ret.avgL : ret.avgS;
        if (!val) return [];
        return [{ level:true, value: val, color:_iC(id,0), axisTitle:'Retail Avg', label:'Retail Avg ' + (dominant === 'long' ? 'Long' : 'Short') }];
      }
      case 'ichimoku': {
        function tenkan(i,n){const s=bars.slice(Math.max(0,i-n+1),i+1);return(Math.max(...s.map(b=>b.high))+Math.min(...s.map(b=>b.low)))/2;}
        const TK=9,KJ=26,SB2=52,DISP=26;
        const tLine=[],kLine=[],sa=[],sb=[],cl=[];
        for(let i=0;i<bars.length;i++){
          const tk=tenkan(i,TK),kj=tenkan(i,KJ);
          if(i>=TK-1) tLine.push({time:bars[i].time,value:tk});
          if(i>=KJ-1){
            kLine.push({time:bars[i].time,value:kj});
            if(i+DISP<bars.length) sa.push({time:bars[i+DISP].time,value:(tk+kj)/2});
          }
          if(i>=SB2-1&&i+DISP<bars.length) sb.push({time:bars[i+DISP].time,value:tenkan(i,SB2)});
          if(i>=KJ-1&&i>DISP) cl.push({time:bars[i-DISP].time,value:bars[i].close});
        }
        return [
          { data:tLine, color:_iC(id,0), lineWidth:1, label:'Tenkan' },
          { data:kLine, color:_iC(id,1), lineWidth:1, label:'Kijun' },
          { data:sa,    color:_iC(id,2), lineWidth:1, label:'Span A' },
          { data:sb,    color:_iC(id,3), lineWidth:1, label:'Span B' },
          { data:cl,    color:_iC(id,4), lineWidth:1, label:'Chikou', dashed:true },
        ];
      }
      case 'supertrend': {
        const { period:n, mult } = p;
        const tr  = _iTR(bars);
        const atr = _iRMA(tr, n); 
        let upBand = null, dnBand = null, trend = 1;
        const segments = [];
        let current = null;
        for (let i = 0; i < bars.length; i++) {
          const hl2  = (bars[i].high + bars[i].low) / 2;
          const rawUp = hl2 - mult * atr[i];
          const rawDn = hl2 + mult * atr[i];
          if (i === 0) {
            upBand = rawUp; dnBand = rawDn; trend = 1;
          } else {
            const prevUp = upBand, prevDn = dnBand;
            const newUp = (bars[i-1].close > prevUp) ? Math.max(rawUp, prevUp) : rawUp;
            const newDn = (bars[i-1].close < prevDn) ? Math.min(rawDn, prevDn) : rawDn;
            if (trend === -1 && bars[i].close > prevDn) trend = 1;
            else if (trend === 1 && bars[i].close < prevUp) trend = -1;
            upBand = newUp; dnBand = newDn;
          }
          const val = trend === 1 ? upBand : dnBand;
          const point = { time: bars[i].time, value: parseFloat(val.toFixed(dec)) };
          if (!current || current.trend !== trend) {
            current = { trend, points: [] };
            segments.push(current);
          }
          current.points.push(point);
        }
        return segments.map((seg, si) => ({
          data: seg.points,
          color: _iC(id, seg.trend === 1 ? 0 : 1),
          lineWidth: 2,
          label: `Supertrend(${n},${mult})`,
          lastValueVisible: si === segments.length - 1,
        }));
      }
      case 'pivotd': return _calcPivotSeries(bars, 'D', id, dec);
      case 'pivotw': return _calcPivotSeries(bars, 'W', id, dec);
      case 'pivotm': return _calcPivotSeries(bars, 'M', id, dec);
      case 'rsi': {
        const n = p.period;
        const gains=[], losses=[];
        for(let i=1;i<closes.length;i++){const d=closes[i]-closes[i-1];gains.push(d>0?d:0);losses.push(d<0?-d:0);}
        const avgG=_iRMA(gains,n), avgL=_iRMA(losses,n);
        const data=avgG.map((g,i)=>{const l=avgL[i];const rs=l===0?Infinity:g/l;return{time:bars[i+1].time,value:parseFloat((l===0?100:100-100/(1+rs)).toFixed(2))};});
        return [{data,color:_iC(id,0),lineWidth:1,label:`RSI(${n})`,
          refs:_mkRefs(id,['rgba(158,161,170,0.35)','rgba(120,123,134,0.2)','rgba(158,161,170,0.35)'])}];
      }
      case 'stoch': {
        const { k:kPer, d:dPer, smooth } = p;
        const rawK=[];
        for(let i=kPer-1;i<bars.length;i++){
          const s=bars.slice(i-kPer+1,i+1);
          const h=Math.max(...s.map(b=>b.high)),l=Math.min(...s.map(b=>b.low));
          rawK.push(h===l?50:((bars[i].close-l)/(h-l))*100);
        }
        const sK=_iSMA(rawK,smooth), sD=_iSMA(sK,dPer);
        const off=bars.length-rawK.length;
        const kData=sK.map((v,i)=>({time:bars[off+i+smooth-1].time,value:parseFloat(v.toFixed(2))}));
        const dData=sD.map((v,i)=>({time:bars[off+i+smooth-1+dPer-1].time,value:parseFloat(v.toFixed(2))}));
        return [
          {data:kData,color:_iC(id,0),lineWidth:1,label:`%K(${kPer},${smooth})`,refs:_mkRefs(id,['rgba(158,161,170,0.35)','rgba(120,123,134,0.2)','rgba(158,161,170,0.35)'])},
          {data:dData,color:_iC(id,1),lineWidth:1,label:`%D(${dPer})`},
        ];
      }
      case 'macd': {
        const { fast, slow, signal:sig } = p;
        const ef=_iEMA(closes,fast), es=_iEMA(closes,slow);
        const ml=ef.map((v,i)=>v-es[i]);
        const sl2=_iEMA(ml.slice(slow-1),sig);
        const offset=slow-1+sig-1;
        const macdD=[],sigD=[],histD=[];
        for(let i=offset;i<bars.length;i++){
          const si=i-(slow-1); 
          const m=ml[i],s=sl2[si],h=m-s;
          macdD.push({time:bars[i].time,value:parseFloat(m.toFixed(6))});
          sigD.push( {time:bars[i].time,value:parseFloat(s.toFixed(6))});
          const hBase=_iC(id,0);histD.push({time:bars[i].time,value:parseFloat(h.toFixed(6)),color:h>=0?hBase:'rgba(239,83,80,0.7)'});
        }
        return [
          {data:histD,color:_iC(id,0),lineWidth:0,label:'Hist',histogram:true,refs:_mkRefs(id,['rgba(120,123,134,0.2)'])},
          {data:macdD,color:_iC(id,1),lineWidth:1,label:`MACD(${fast},${slow})`},
          {data:sigD, color:_iC(id,2),lineWidth:1,label:`Sig(${sig})`},
        ];
      }
      case 'cci': {
        const n = p.period;
        const tp=bars.map(b=>(b.high+b.low+b.close)/3);
        const sma=_iSMA(tp,n);
        const data=sma.map((avg,i)=>{
          const slice=tp.slice(i,i+n);
          const meanDev=slice.reduce((s,v)=>s+Math.abs(v-avg),0)/n;
          return{time:bars[i+n-1].time,value:parseFloat((meanDev===0?0:(tp[i+n-1]-avg)/(0.015*meanDev)).toFixed(2))};
        });
        return [{data,color:_iC(id,0),lineWidth:1,label:`CCI(${n})`,
          refs:_mkRefs(id,['rgba(158,161,170,0.35)','rgba(120,123,134,0.2)','rgba(158,161,170,0.35)'])}];
      }
      case 'willr': {
        const n = p.period;
        const data=[];
        for(let i=n-1;i<bars.length;i++){
          const sl=bars.slice(i-n+1,i+1);
          const h=Math.max(...sl.map(b=>b.high)),l=Math.min(...sl.map(b=>b.low));
          data.push({time:bars[i].time,value:parseFloat((h===l?-50:((h-bars[i].close)/(h-l))*-100).toFixed(2))});
        }
        return [{data,color:_iC(id,0),lineWidth:1,label:`%R(${n})`,
          refs:_mkRefs(id,['rgba(158,161,170,0.35)','rgba(120,123,134,0.2)','rgba(158,161,170,0.35)'])}];
      }
      case 'roc': {
        const n = p.period;
        const data=bars.slice(n).map((b,i)=>({time:b.time,value:parseFloat(((b.close-bars[i].close)/bars[i].close*100).toFixed(4))}));
        return [{data,color:_iC(id,0),lineWidth:1,label:`ROC(${n})`,refs:_mkRefs(id,['rgba(120,123,134,0.3)'])}];
      }
      case 'mom': {
        const n = p.period;
        const data=bars.slice(n).map((b,i)=>({time:b.time,value:parseFloat((b.close-bars[i].close).toFixed(dec))}));
        return [{data,color:_iC(id,0),lineWidth:1,label:`Mom(${n})`,refs:_mkRefs(id,['rgba(120,123,134,0.3)'])}];
      }
      case 'mfi': {
        const n = p.period;
        const data=[];
        for(let i=n;i<bars.length;i++){
          let pmf=0,nmf=0;
          for(let j=i-n+1;j<=i;j++){
            const tp=(bars[j].high+bars[j].low+bars[j].close)/3;
            const prevTp=(bars[j-1].high+bars[j-1].low+bars[j-1].close)/3;
            const mf=tp*(bars[j].volume||1);
            if(tp>prevTp) pmf+=mf; else nmf+=mf;
          }
          data.push({time:bars[i].time,value:parseFloat((nmf===0?100:100-100/(1+pmf/nmf)).toFixed(2))});
        }
        return [{data,color:_iC(id,0),lineWidth:1,label:`MFI(${n})`,
          refs:_mkRefs(id,['rgba(158,161,170,0.35)','rgba(120,123,134,0.2)','rgba(158,161,170,0.35)'])}];
      }
      case 'ao': {
        const midAO=bars.map(b=>(b.high+b.low)/2);
        const s5=_iSMA(midAO,5),s34=_iSMA(midAO,34);
        const off=34-1;
        const data=s34.map((v,i)=>{
          const ao=s5[i+(34-5)]-v;
          const prev=i>0?s5[i+(34-5)-1]-s34[i-1]:ao;
          const aoBase=_iC(id,0);return{time:bars[off+i].time,value:parseFloat(ao.toFixed(6)),color:ao>=prev?aoBase:'rgba(239,83,80,0.7)'};
        });
        return [{data,color:_iC(id,0),lineWidth:0,label:'AO',histogram:true,refs:_mkRefs(id,['rgba(120,123,134,0.2)'])}];
      }
      case 'trix': {
        const n = p.period;
        const e1=_iEMA(closes,n),e2=_iEMA(e1,n),e3=_iEMA(e2,n);
        const data=e3.slice(1).map((v,i)=>({time:bars[bars.length-e3.length+i+1].time,value:parseFloat(((v-e3[i])/e3[i]*100).toFixed(6))}));
        return [{data,color:_iC(id,0),lineWidth:1,label:`TRIX(${n})`,refs:_mkRefs(id,['rgba(120,123,134,0.3)'])}];
      }
      case 'dpo': {
        const n = p.period; const disp=Math.floor(n/2)+1;
        const sma=_iSMA(closes,n);
        const data=sma.map((v,i)=>{
          const barIdx=i+n-1-disp;
          if(barIdx<0) return null;
          return{time:bars[i+n-1].time,value:parseFloat((closes[barIdx]-v).toFixed(dec))};
        }).filter(Boolean);
        return [{data,color:_iC(id,0),lineWidth:1,label:`DPO(${n})`,refs:_mkRefs(id,['rgba(120,123,134,0.3)'])}];
      }
      case 'uo': {
        const data=[];
        for(let i=28;i<bars.length;i++){
          function _uoBP(j){return bars[j].close-Math.min(bars[j].low,bars[j-1].close);}
          function _uoTR(j){return Math.max(bars[j].high,bars[j-1].close)-Math.min(bars[j].low,bars[j-1].close);}
          let [bp7,tr7,bp14,tr14,bp28,tr28]=[0,0,0,0,0,0];
          for(let j=i-6;j<=i;j++){bp7+=_uoBP(j);tr7+=_uoTR(j);}
          for(let j=i-13;j<=i;j++){bp14+=_uoBP(j);tr14+=_uoTR(j);}
          for(let j=i-27;j<=i;j++){bp28+=_uoBP(j);tr28+=_uoTR(j);}
          data.push({time:bars[i].time,value:parseFloat((100*(4*(bp7/tr7)+2*(bp14/tr14)+(bp28/tr28))/7).toFixed(2))});
        }
        return [{data,color:_iC(id,0),lineWidth:1,label:'UO(7,14,28)',
          refs:_mkRefs(id,['rgba(158,161,170,0.35)','rgba(120,123,134,0.2)','rgba(158,161,170,0.35)'])}];
      }
      case 'atr': {
        const n = p.period;
        const tr=_iTR(bars);
        const atr=_iRMA(tr,n);
        return [{data:bars.map((b,i)=>({time:b.time,value:parseFloat(atr[i].toFixed(dec))})),color:_iC(id,0),lineWidth:1,label:`ATR(${n})`}];
      }
      case 'adx': {
        const n = p.period;
        const plusDM=[],minusDM=[],tr=_iTR(bars);
        for(let i=1;i<bars.length;i++){
          const upMove=bars[i].high-bars[i-1].high,downMove=bars[i-1].low-bars[i].low;
          plusDM.push(upMove>downMove&&upMove>0?upMove:0);
          minusDM.push(downMove>upMove&&downMove>0?downMove:0);
        }
        const atr=_iRMA(tr.slice(1),n);
        const pDI=_iRMA(plusDM,n).map((v,i)=>100*v/atr[i]);
        const mDI=_iRMA(minusDM,n).map((v,i)=>100*v/atr[i]);
        const dx=pDI.map((p,i)=>{const s=p+mDI[i];return s===0?0:100*Math.abs(p-mDI[i])/s;});
        const adx=_iRMA(dx,n);
        const off=bars.length-adx.length;
        return [
          {data:adx.map((v,i)=>({time:bars[off+i].time,value:parseFloat(v.toFixed(2))})),color:_iC(id,0),lineWidth:1,label:`ADX(${n})`,refs:_mkRefs(id,['rgba(158,161,170,0.35)'])},
          {data:pDI.map((v,i)=>({time:bars[off+i].time,value:parseFloat(v.toFixed(2))})),color:_iC(id,1),lineWidth:1,label:'+DI'},
          {data:mDI.map((v,i)=>({time:bars[off+i].time,value:parseFloat(v.toFixed(2))})),color:_iC(id,2),lineWidth:1,label:'-DI'},
        ];
      }
      case 'aroon': {
        const n = p.period;
        const up=[],dn=[];
        for(let i=n;i<bars.length;i++){
          const sl=bars.slice(i-n,i+1);
          const hiIdx=sl.reduce((mi,b,j)=>b.high>sl[mi].high?j:mi,0);
          const loIdx=sl.reduce((mi,b,j)=>b.low<sl[mi].low?j:mi,0);
          up.push({time:bars[i].time,value:parseFloat(((hiIdx/n)*100).toFixed(2))});
          dn.push({time:bars[i].time,value:parseFloat(((loIdx/n)*100).toFixed(2))});
        }
        return [
          {data:up,color:_iC(id,0),lineWidth:1,label:`Aroon Up(${n})`,refs:_mkRefs(id,['rgba(120,123,134,0.2)'])},
          {data:dn,color:_iC(id,1),lineWidth:1,label:`Aroon Down`},
        ];
      }
      case 'chop': {
        const n = p.period;
        const tr=_iTR(bars);
        const data=[];
        for(let i=n-1;i<bars.length;i++){
          const atrSum=tr.slice(i-n+1,i+1).reduce((s,v)=>s+v,0);
          const sl=bars.slice(i-n+1,i+1);
          const hl=Math.max(...sl.map(b=>b.high))-Math.min(...sl.map(b=>b.low));
          data.push({time:bars[i].time,value:parseFloat((hl===0?100:(100*Math.log10(atrSum/hl)/Math.log10(n))).toFixed(2))});
        }
        return [{data,color:_iC(id,0),lineWidth:1,label:`Chop(${n})`,
          refs:_mkRefs(id,['rgba(38,166,154,0.3)','rgba(158,161,170,0.35)'])}];
      }
      case 'obv': {
        let obv=0;
        const data=bars.map((b,i)=>{
          if(i>0){if(b.close>bars[i-1].close)obv+=b.volume||0;else if(b.close<bars[i-1].close)obv-=b.volume||0;}
          return{time:b.time,value:obv};
        });
        return [{data,color:_iC(id,0),lineWidth:1,label:'OBV'}];
      }
      case 'cmf': {
        const n = p.period;
        const mfv=bars.map(b=>{const hl=b.high-b.low;return hl===0?0:((b.close-b.low)-(b.high-b.close))/hl*(b.volume||0);});
        const data=[];
        for(let i=n-1;i<bars.length;i++){
          const volSum=bars.slice(i-n+1,i+1).reduce((s,b)=>s+(b.volume||0),0);
          const mfvSum=mfv.slice(i-n+1,i+1).reduce((s,v)=>s+v,0);
          data.push({time:bars[i].time,value:parseFloat((volSum===0?0:mfvSum/volSum).toFixed(4))});
        }
        return [{data,color:_iC(id,0),lineWidth:1,label:`CMF(${n})`,refs:_mkRefs(id,['rgba(120,123,134,0.3)'])}];
      }
      default: return [];
    }
  }

  function _addPaneLegend(paneEl, id, html) {
    if (!paneEl) return;
    paneEl.style.position = 'relative';
    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position:absolute;top:4px;left:8px;z-index:3;pointer-events:none;'
      + 'font-size:10px;font-family:var(--font-mono,monospace);line-height:1.3;user-select:none;color:var(--text);';
    el.innerHTML = html;
    paneEl.appendChild(el);
  }

  let _pivotLabelOverlay = null;
  const _pivotLabelData = {}; 

  function _drawPivotLabels() {
    if (!_pivotLabelOverlay || !_lwChart) return;
    const ts = _lwChart.timeScale();
    let svgContent = '';
    Object.values(_pivotLabelData).forEach(entries => {
      entries.forEach(e => {
        try {
          const x = ts.timeToCoordinate(e.time);
          const y = candleSeries.priceToCoordinate(e.value);
          if (x == null || y == null || x < 0 || x > chartDiv.offsetWidth) return;
          svgContent += `<text x="${(x + 3).toFixed(1)}" y="${(y - 3).toFixed(1)}" `
            + `font-size="9" font-family="var(--font-mono,monospace)" fill="${e.color}" `
            + `font-weight="700">${e.text}</text>`;
        } catch(_) {}
      });
    });
    _pivotLabelOverlay.innerHTML = svgContent;
  }
  function _ensurePivotLabelOverlay() {
    if (_pivotLabelOverlay) return;
    _pivotLabelOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    _pivotLabelOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:visible;';
    chartDiv.style.position = 'relative';
    chartDiv.appendChild(_pivotLabelOverlay);
    _lwChart.timeScale().subscribeVisibleTimeRangeChange(_drawPivotLabels);
  }
  function _setPivotLabels(id, seriesList) {
    const withSeg = (seriesList || []).filter(s => s.segStarts && s.segStarts.length);
    if (withSeg.length === 0) { delete _pivotLabelData[id]; }
    else {
      _pivotLabelData[id] = [];
      withSeg.forEach(s => {
        s.segStarts.forEach(pt => {
          _pivotLabelData[id].push({ time: pt.time, value: pt.value, color: s.color, text: s.title });
        });
      });
    }
    _ensurePivotLabelOverlay();
    _drawPivotLabels();
  }

  function _addRefLines(paneIndex, refs, ownerSeries) {
    if (!refs || paneIndex === null || !ownerSeries) return;
    const lines = [];
    refs.forEach(ref => {
      try {
        const pl = ownerSeries.createPriceLine({
          price: ref.v, color: ref.color, lineWidth: 1, lineStyle: 2,
          axisLabelVisible: false, title: '',
        });
        lines.push(pl);
      } catch(_) {}
    });
    _indRefSeries[paneIndex] = { ownerSeries, lines };
  }

  function _calcMaData(cfg) {
    if (!bars || bars.length < 2) return [];
    const closes = bars.map(b => b.close);
    const raw = _iMA(cfg.type, closes, bars, cfg.period);
    return _iAlign(raw, bars);
  }
  function _buildMaSeries(cfg) {
    _destroyMaSeries(cfg.uid);
    if (!_lwChart) return;
    try {
      const s = _lwChart.addSeries(LWC.LineSeries, {
        color: cfg.color, lineWidth: cfg.lineWidth || 1, lineStyle: cfg.lineStyle || 0,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: dec, minMove },
      }, 0);
      s.setData(_calcMaData(cfg));
      _maSeries[cfg.uid] = s;
    } catch(e) { console.warn('MA series error', e); }
  }
  function _destroyMaSeries(uid) {
    if (_maSeries[uid]) { try { _lwChart.removeSeries(_maSeries[uid]); } catch(_) {} _maSeries[uid] = null; }
  }
  function _buildAllMaSeries() {
    Object.keys(_maSeries).forEach(uid => {
      if (!window._lwMaList.find(m => m.uid === uid)) _destroyMaSeries(uid);
    });
    window._lwMaList.forEach(cfg => _buildMaSeries(cfg));
  }
  function _genMaUid() { return 'ma_' + Date.now() + '_' + Math.floor(Math.random()*1000); }

  function _buildIndicatorPane(id) {
    const cfg = _IND_CATALOGUE.find(c => c.id === id);
    if (!cfg || !window._lwIndState[id]) return;

    _destroyIndicatorPane(id);

    try {
      const seriesList = _calcIndData(id, bars);
      if (!seriesList || seriesList.length === 0) return;

      const isOverlay = cfg.type === 'overlay';
      let paneIndex;

      if (isOverlay) {
        paneIndex = 0; 
      } else {
        paneIndex = _lwChart.panes().length;
        _indPaneIndex[id] = paneIndex;
        try { _lwChart.priceScale('right', paneIndex).applyOptions({ mode: 0, autoScale: true }); } catch(_) {}
      }

      _indSeries[id] = [];

      seriesList.forEach((s, si) => {
        try {
          if (s.level) {
            const pl = candleSeries.createPriceLine({
              price: s.value,
              color: s.color,
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              axisLabelColor: _themeColor('--bg'),
              axisLabelTextColor: s.color,
              title: s.axisTitle || s.label,
            });
            if (!_indPriceLines[id]) _indPriceLines[id] = [];
            _indPriceLines[id].push(pl);
            return;
          }
          let series;
          if (s.histogram) {
            series = _lwChart.addSeries(LWC.HistogramSeries, {
              priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
              priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
            }, paneIndex);
          } else if (s.markers) {
            series = _lwChart.addSeries(LWC.LineSeries, {
              color: s.color, lineVisible: false,
              pointMarkersVisible: true, pointMarkersRadius: 2,
              priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: true,
              priceFormat: { type: 'price', precision: dec, minMove },
            }, paneIndex);
          } else {
            series = _lwChart.addSeries(LWC.LineSeries, {
              color: s.color, lineWidth: s.lineWidth || 1,
              lineStyle: s.dashed ? 2 : 0,
              priceLineVisible: false,
              lastValueVisible: s.lastValueVisible !== undefined ? s.lastValueVisible : si === 0,
              crosshairMarkerVisible: false,
              priceFormat: { type: 'price', precision: (isOverlay ? dec : 2), minMove: (isOverlay ? minMove : 0.01) },
            }, paneIndex);
          }
          series.setData(s.data);
          _indSeries[id].push(series);

          if (!isOverlay && si === 0) {
            try {
              const paneH = (id === 'macd' || id === 'adx') ? 90 : 80;
              _lwChart.panes()[paneIndex]?.setHeight(paneH);
            } catch(_) {}
          }

          if (!isOverlay && si === 0 && s.refs) {
            _addRefLines(paneIndex, s.refs, series);
          }
        } catch(serErr) { console.warn('[LW] series error for', id, serErr); }
      });

      if (!isOverlay && _indPaneIndex[id] != null) {
        try {
          const paneEl = _lwChart.panes()[_indPaneIndex[id]]?.getHTMLElement();
          if (paneEl) {
            const labelHtml = seriesList.map(s => `<span style="color:${s.color}">${s.label}</span>`).join(' ');
            _addPaneLegend(paneEl, '_lw-ind-legend-' + id, labelHtml);
          }
        } catch(_) {}
      }

      _setPivotLabels(id, seriesList);
    } catch(e) { console.warn('[LW] indicator build error for', id, e); }
  }

  function _destroyIndicatorPane(id) {
    const cfg = _IND_CATALOGUE.find(c => c.id === id);
    const isOverlay = cfg && cfg.type === 'overlay';

    _setPivotLabels(id, []);

    if (_indSeries[id]) {
      _indSeries[id].forEach(s => {
        try { _lwChart.removeSeries(s); } catch(_) {}
      });
      _indSeries[id] = null;
    }

    if (_indPriceLines[id]) {
      _indPriceLines[id].forEach(pl => {
        try { candleSeries.removePriceLine(pl); } catch(_) {}
      });
      _indPriceLines[id] = null;
    }

    if (!isOverlay && _indPaneIndex[id] != null) {
      const refEntry = _indRefSeries[_indPaneIndex[id]];
      if (refEntry) {
        refEntry.lines.forEach(pl => { try { refEntry.ownerSeries.removePriceLine(pl); } catch(_) {} });
        _indRefSeries[_indPaneIndex[id]] = null;
      }
      try {
        const panes = _lwChart.panes();
        const pane = panes[_indPaneIndex[id]];
        if (pane && pane.getSeries().length === 0) {
          _lwChart.removePane(_indPaneIndex[id]);
        }
      } catch(_) {}
      _indPaneIndex[id] = null;
    }
  }

  (window._lwCompareList || []).slice().forEach(function (entry) {
    if (entry.cmpType === 'ohlc' && entry.cmpId === ohlcId) {
      document.querySelectorAll('.lw-cmp-pill').forEach(function (p) {
        if (p.dataset.uid === entry.uid) p.remove();
      });
      return;
    }
    _lwLoadCompare(entry.cmpId, entry.cmpLabel, entry.cmpType, true);
  });

  await window._lwFvSummaryReq;
  _IND_CATALOGUE.forEach(cfg => {
    if (window._lwIndState[cfg.id]) _buildIndicatorPane(cfg.id);
  });
  _buildAllMaSeries();

  function _renderIndPills() {
    const pillBar = document.getElementById('lw-ind-pills');
    if (!pillBar) return;
    pillBar.innerHTML = '';
    window._lwMaList.forEach(ma => {
      const pill = document.createElement('span');
      pill.style.cssText = 'display:inline-flex;align-items:center;gap:3px;background:var(--bg2);border:1px solid var(--border);border-radius:3px;padding:1px 5px;font-size:9px;font-family:var(--font-ui,sans-serif);white-space:nowrap;';
      const dot = `<span style="width:6px;height:6px;border-radius:50%;background:${ma.color};display:inline-block;flex-shrink:0"></span>`;
      pill.innerHTML = `${dot}<span style="color:var(--text2)">${ma.type} ${ma.period}</span>`;
      const rm = document.createElement('span');
      rm.textContent = '\u00d7';
      rm.style.cssText = 'color:var(--text3);cursor:pointer;font-size:10px;margin-left:1px;';
      rm.title = `Remove ${ma.type} ${ma.period}`;
      rm.addEventListener('click', e => {
        e.stopPropagation();
        window._lwMaList = window._lwMaList.filter(m => m.uid !== ma.uid);
        _saveMaList();
        _destroyMaSeries(ma.uid);
        _renderIndPills();
        _updateIndBtn();
      });
      pill.appendChild(rm);
      pillBar.appendChild(pill);
    });
    _IND_CATALOGUE.filter(c => c.id !== 'ma' && window._lwIndState[c.id]).forEach(cfg => {
      const pill = document.createElement('span');
      pill.style.cssText = 'display:inline-flex;align-items:center;gap:3px;background:var(--bg2);border:1px solid var(--border);border-radius:3px;padding:1px 5px;font-size:9px;font-family:var(--font-ui,sans-serif);white-space:nowrap;';
      pill.innerHTML = `<span style="color:var(--text2)">${cfg.label}</span>`;
      const rm = document.createElement('span');
      rm.textContent = '\u00d7';
      rm.style.cssText = 'color:var(--text3);cursor:pointer;font-size:10px;margin-left:1px;';
      rm.title = 'Remove ' + cfg.label;
      rm.addEventListener('click', e => {
        e.stopPropagation();
        window._lwIndState[cfg.id] = false;
        _saveIndState();
        _destroyIndicatorPane(cfg.id);
        _renderIndPills();
        _updateIndBtn();
      });
      pill.appendChild(rm);
      pillBar.appendChild(pill);
    });
  }

  function _updateIndBtn() {
    const btn = document.getElementById('lw-ind-btn');
    if (!btn) return;
    const anyOn = window._lwMaList.length > 0 || _IND_CATALOGUE.some(c => c.id !== 'ma' && window._lwIndState[c.id]);
    btn.classList.toggle('on', anyOn);
  }

  let _indDropdownOpen = false;

  function _closeIndDropdown() {
    const pop = document.getElementById('_lw-ind-dropdown');
    if (pop) pop.remove();
    _indDropdownOpen = false;
    const btn = document.getElementById('lw-ind-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function _openIndDropdown(preserveScrollTop) {
    if (_indDropdownOpen) { _closeIndDropdown(); return; }
    _closeIndDropdown();
    _indDropdownOpen = true;

    const btn = document.getElementById('lw-ind-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');

    const pop = document.createElement('div');
    pop.id = '_lw-ind-dropdown';
    pop.style.cssText = [
      'position:fixed;z-index:9999;background:var(--head-bg);border:1px solid var(--border);',
      'border-radius:6px;box-shadow:0 8px 32px rgba(0,0,0,.7);',
      'font-size:11px;font-family:var(--font-ui,sans-serif);',
      'min-width:300px;max-height:520px;overflow-y:auto;',
      'scrollbar-width:thin;scrollbar-color:var(--border) transparent;',
    ].join('');

    const MA_TYPES  = ['SMA','EMA','WMA','HMA','DEMA','TEMA','VWMA'];
    const MA_COLORS = ['#2196f3','#ff9800','#e91e63','#4caf50','#9c27b0','#00bcd4','#ff5722','#607d8b','#795548'];
    const LINE_STYLES = [ {v:0,l:'Solid'}, {v:1,l:'Dotted'}, {v:2,l:'Dashed'} ];

    function _nextColor() {
      const used = new Set(window._lwMaList.map(m => m.color));
      return MA_COLORS.find(c => !used.has(c)) || MA_COLORS[window._lwMaList.length % MA_COLORS.length];
    }

    const maHeader = document.createElement('div');
    maHeader.style.cssText = 'padding:8px 12px 4px;color:var(--text3);font-size:9px;letter-spacing:.08em;font-weight:700;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;';
    maHeader.innerHTML = '<span>MOVING AVERAGES</span>';

    const addMaBtn = document.createElement('button');
    addMaBtn.textContent = '+ Add MA';
    addMaBtn.style.cssText = 'background:var(--accent);color:#fff;border:none;border-radius:3px;padding:2px 7px;font-size:9px;font-weight:600;cursor:pointer;letter-spacing:.04em;';
    addMaBtn.addEventListener('mouseenter', () => addMaBtn.style.background = _themeColor('--chart-line') + 'cc');
    addMaBtn.addEventListener('mouseleave', () => addMaBtn.style.background = 'var(--accent)');
    addMaBtn.addEventListener('click', e => {
      e.stopPropagation();
      const newMa = { uid: _genMaUid(), type:'EMA', period:20, color:_nextColor(), lineWidth:1, lineStyle:0 };
      window._lwMaList.push(newMa);
      _saveMaList();
      _buildMaSeries(newMa);
      _renderIndPills();
      _updateIndBtn();
      { const _st = pop.scrollTop; pop.remove(); _indDropdownOpen = false; _openIndDropdown(_st); }
    });
    maHeader.appendChild(addMaBtn);
    pop.appendChild(maHeader);

    if (window._lwMaList.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:10px 12px;color:var(--text3);font-size:10px;font-style:italic;';
      empty.textContent = 'No moving averages — click "+ Add MA" to add one.';
      pop.appendChild(empty);
    }

    window._lwMaList.forEach((ma, idx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 10px 5px 12px;border-bottom:1px solid rgba(42,46,57,0.5);';

      const colorWrap = document.createElement('label');
      colorWrap.style.cssText = 'position:relative;cursor:pointer;flex-shrink:0;';
      const colorSwatch = document.createElement('span');
      colorSwatch.style.cssText = `display:inline-block;width:12px;height:12px;border-radius:50%;background:${ma.color};border:1px solid rgba(255,255,255,0.15);cursor:pointer;`;
      const colorInput = document.createElement('input');
      colorInput.type = 'color'; colorInput.value = ma.color;
      colorInput.style.cssText = 'position:absolute;opacity:0;width:0;height:0;';
      colorInput.addEventListener('input', e => {
        e.stopPropagation();
        ma.color = e.target.value;
        colorSwatch.style.background = ma.color;
        if (_maSeries[ma.uid]) { try { _maSeries[ma.uid].applyOptions({ color: ma.color }); } catch(_) {} }
        _saveMaList();
        _renderIndPills();
      });
      colorWrap.appendChild(colorSwatch);
      colorWrap.appendChild(colorInput);
      row.appendChild(colorWrap);

      const typeSelect = document.createElement('select');
      typeSelect.style.cssText = 'background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 4px;font-size:10px;cursor:pointer;flex-shrink:0;';
      MA_TYPES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        if (t === ma.type) opt.selected = true;
        typeSelect.appendChild(opt);
      });
      typeSelect.addEventListener('change', e => {
        e.stopPropagation();
        ma.type = e.target.value;
        _saveMaList();
        _buildMaSeries(ma);
        _renderIndPills();
      });
      row.appendChild(typeSelect);

      const periodInput = document.createElement('input');
      periodInput.type = 'number'; periodInput.value = ma.period; periodInput.min = 1; periodInput.max = 500;
      periodInput.style.cssText = 'width:44px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 4px;font-size:10px;text-align:center;';
      periodInput.addEventListener('click', e => e.stopPropagation());
      periodInput.addEventListener('change', e => {
        e.stopPropagation();
        const v = parseInt(e.target.value);
        if (v > 0 && v <= 500) { ma.period = v; _saveMaList(); _buildMaSeries(ma); _renderIndPills(); }
      });
      row.appendChild(periodInput);

      const styleSelect = document.createElement('select');
      styleSelect.style.cssText = 'background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 4px;font-size:10px;cursor:pointer;flex-shrink:0;';
      LINE_STYLES.forEach(ls => {
        const opt = document.createElement('option');
        opt.value = ls.v; opt.textContent = ls.l;
        if (ls.v === ma.lineStyle) opt.selected = true;
        styleSelect.appendChild(opt);
      });
      styleSelect.addEventListener('change', e => {
        e.stopPropagation();
        ma.lineStyle = parseInt(e.target.value);
        _saveMaList();
        if (_maSeries[ma.uid]) { try { _maSeries[ma.uid].applyOptions({ lineStyle: ma.lineStyle }); } catch(_) {} }
      });
      row.appendChild(styleSelect);

      const widthSelect = document.createElement('select');
      widthSelect.style.cssText = 'background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 4px;font-size:10px;cursor:pointer;flex-shrink:0;width:50px;';
      [1,2,3].forEach(w => {
        const opt = document.createElement('option');
        opt.value = w; opt.textContent = w + 'px';
        if (w === (ma.lineWidth||1)) opt.selected = true;
        widthSelect.appendChild(opt);
      });
      widthSelect.addEventListener('change', e => {
        e.stopPropagation();
        ma.lineWidth = parseInt(e.target.value);
        _saveMaList();
        if (_maSeries[ma.uid]) { try { _maSeries[ma.uid].applyOptions({ lineWidth: ma.lineWidth }); } catch(_) {} }
      });
      row.appendChild(widthSelect);

      const rmBtn = document.createElement('button');
      rmBtn.innerHTML = '&times;';
      rmBtn.style.cssText = 'background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;margin-left:auto;padding:0 2px;line-height:1;flex-shrink:0;';
      rmBtn.title = `Remove ${ma.type} ${ma.period}`;
      rmBtn.addEventListener('mouseenter', () => rmBtn.style.color = 'var(--down)');
      rmBtn.addEventListener('mouseleave', () => rmBtn.style.color = 'var(--text3)');
      rmBtn.addEventListener('click', e => {
        e.stopPropagation();
        window._lwMaList = window._lwMaList.filter(m => m.uid !== ma.uid);
        _saveMaList();
        _destroyMaSeries(ma.uid);
        _renderIndPills(); _updateIndBtn();
        { const _st = pop.scrollTop; pop.remove(); _indDropdownOpen = false; _openIndDropdown(_st); }
      });
      row.appendChild(rmBtn);

      pop.appendChild(row);
    });

    const groups = {};
    _IND_CATALOGUE.filter(c => c.id !== 'ma').forEach(cfg => {
      if (!groups[cfg.group]) groups[cfg.group] = [];
      groups[cfg.group].push(cfg);
    });

    function _makeColorSwatch(id, i, label) {
      const wrap = document.createElement('label');
      wrap.title = label;
      wrap.style.cssText = 'position:relative;cursor:pointer;flex-shrink:0;display:flex;align-items:center;gap:3px;';
      const swatch = document.createElement('span');
      const curColor = _iC(id, i);
      swatch.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:2px;background:${curColor};border:1px solid rgba(255,255,255,0.15);cursor:pointer;`;
      const inp = document.createElement('input');
      inp.type = 'color';
      const hexOnly = curColor.replace(/^rgba?\([^)]+\)$/, '#888888').replace(/^(#[0-9a-fA-F]{6}).*/, '$1');
      inp.value = hexOnly.startsWith('#') ? hexOnly : '#888888';
      inp.style.cssText = 'position:absolute;opacity:0;width:0;height:0;';
      inp.addEventListener('input', e => {
        e.stopPropagation();
        if (!window._lwIndParams[id]) window._lwIndParams[id] = {};
        if (!window._lwIndParams[id].colors) window._lwIndParams[id].colors = [...((_IND_CATALOGUE.find(c=>c.id===id)||{}).colors||[])];
        window._lwIndParams[id].colors[i] = e.target.value;
        swatch.style.background = e.target.value;
        _saveIndParams();
        if (window._lwIndState[id] && window._indSeries && window._indSeries[id] && window._indSeries[id][i]) {
          const cfg2 = _IND_CATALOGUE.find(c => c.id === id);
          if ((cfg2?.histoIdx || []).includes(i)) {
            try { _buildIndicatorPane(id); } catch(_) {}
          } else {
            try { window._indSeries[id][i].applyOptions({ color: e.target.value }); } catch(_) {}
          }
        }
      });
      wrap.appendChild(swatch);
      wrap.appendChild(inp);
      return wrap;
    }

    Object.entries(groups).forEach(([groupName, items]) => {
      const header = document.createElement('div');
      header.textContent = groupName.toUpperCase();
      header.style.cssText = 'padding:8px 12px 4px;color:var(--text3);font-size:9px;letter-spacing:.08em;font-weight:700;border-top:1px solid var(--border);';
      pop.appendChild(header);

      items.forEach(cfg => {
        const _pivotUnit = { pivotd: 'D', pivotw: 'W', pivotm: 'M' }[cfg.id];
        const pivotBlocked = !!_pivotUnit && !_pivotTfOk(_pivotUnit);
        const _PIVOT_TF_HINT = {
          D: 'Not available — Daily Pivots require an intraday timeframe (H1 or H4)',
          W: 'Not available — Weekly Pivots require H1, H4, or D1',
          M: 'Not available — Monthly Pivots require H1, H4, D1, or W1',
        };
        const volBlocked = !!cfg.volRequired && !hasVolume;
        const tfBlocked = pivotBlocked || volBlocked;
        const isOn = !!window._lwIndState[cfg.id] && !tfBlocked;
        const hasParams = cfg.paramDefs.length > 0;
        const hasColors = cfg.colors.length > 0;
        const hasLevels = !!_IND_LEVEL_DEFAULTS[cfg.id];
        const expandable = isOn && (hasParams || hasColors || hasLevels);

        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:${tfBlocked?'not-allowed':'pointer'};opacity:${tfBlocked?'0.45':'1'};background:${isOn?'rgba(79,127,255,0.08)':'transparent'};border-bottom:${expandable?'none':'1px solid rgba(42,46,57,0.3)'};`;
        if (volBlocked) row.title = 'Not available — this symbol has no volume data';
        else if (pivotBlocked) row.title = _PIVOT_TF_HINT[_pivotUnit];
        row.addEventListener('mouseenter', () => { if (!isOn && !tfBlocked) row.style.background='rgba(255,255,255,0.04)'; });
        row.addEventListener('mouseleave', () => { row.style.background=isOn?'rgba(79,127,255,0.08)':'transparent'; });

        const check = document.createElement('div');
        check.style.cssText = `width:14px;height:14px;border-radius:3px;border:1px solid ${isOn?_themeColor('--chart-line'):_themeColor('--border2')};background:${isOn?_themeColor('--chart-line'):'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;`;
        if (isOn) check.innerHTML = '<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><polyline points="1,3 3,5 7,1" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        const left = document.createElement('div');
        left.style.cssText = 'flex:1;min-width:0;';
        left.innerHTML = `<div style="color:${isOn?_themeColor('--text'):_themeColor('--text2')};font-weight:${isOn?'600':'400'};font-size:11px">${cfg.label}</div>`
          + `<div style="color:var(--text3);font-size:9px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cfg.desc}</div>`;

        row.appendChild(check);
        row.appendChild(left);

        row.addEventListener('click', e => {
          e.stopPropagation();
          if (tfBlocked) return;
          window._lwIndState[cfg.id] = !window._lwIndState[cfg.id];
          _saveIndState();
          if (window._lwIndState[cfg.id]) { _buildIndicatorPane(cfg.id); } else { _destroyIndicatorPane(cfg.id); }
          _renderIndPills(); _updateIndBtn();
          { const _st = pop.scrollTop; pop.remove(); _indDropdownOpen = false; _openIndDropdown(_st); }
        });

        pop.appendChild(row);

        if (expandable) {
          const paramRow = document.createElement('div');
          paramRow.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:4px 12px 7px 34px;background:rgba(79,127,255,0.05);border-bottom:1px solid rgba(42,46,57,0.5);';

          cfg.paramDefs.forEach(pd => {
            const lbl = document.createElement('label');
            lbl.style.cssText = 'display:flex;align-items:center;gap:3px;color:#6b7280;font-size:9px;font-weight:600;letter-spacing:.03em;';
            lbl.textContent = pd.label;

            const inp = document.createElement('input');
            inp.type = 'number';
            inp.value = _iP(cfg.id)[pd.key];
            inp.min = pd.min; inp.max = pd.max; inp.step = pd.step || 1;
            inp.style.cssText = 'width:46px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 4px;font-size:10px;text-align:center;';
            inp.addEventListener('click', e => e.stopPropagation());
            inp.addEventListener('change', e => {
              e.stopPropagation();
              const raw = pd.type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value);
              if (isNaN(raw) || raw < pd.min || raw > pd.max) return;
              if (!window._lwIndParams[cfg.id]) window._lwIndParams[cfg.id] = {};
              window._lwIndParams[cfg.id][pd.key] = raw;
              _saveIndParams();
              if (window._lwIndState[cfg.id]) {
                _destroyIndicatorPane(cfg.id);
                _buildIndicatorPane(cfg.id);
              }
            });
            lbl.appendChild(inp);
            paramRow.appendChild(lbl);
          });

          if (hasLevels) {
            const levels = _iLevels(cfg.id);
            levels.forEach((lv, li) => {
              const llbl = document.createElement('label');
              llbl.style.cssText = 'display:flex;align-items:center;gap:3px;color:#6b7280;font-size:9px;font-weight:600;letter-spacing:.03em;';
              llbl.textContent = levels.length > 1 ? `Lv${li + 1}` : 'Level';

              const linp = document.createElement('input');
              linp.type = 'number';
              linp.value = lv;
              linp.step = 'any';
              linp.title = 'Reference level — drawn as a dashed line across the full pane';
              linp.style.cssText = 'width:46px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 4px;font-size:10px;text-align:center;';
              linp.addEventListener('click', e => e.stopPropagation());
              linp.addEventListener('change', e => {
                e.stopPropagation();
                const raw = parseFloat(e.target.value);
                if (isNaN(raw)) return;
                const next = _iLevels(cfg.id);
                next[li] = raw;
                window._lwIndLevels[cfg.id] = next;
                _saveIndLevels();
                if (window._lwIndState[cfg.id]) {
                  _destroyIndicatorPane(cfg.id);
                  _buildIndicatorPane(cfg.id);
                }
              });
              llbl.appendChild(linp);
              paramRow.appendChild(llbl);
            });
          }

          const seriesLabels = {
            vwap:    ['Line'],
            bb:      ['Mid','Upper','Lower'],
            keltner: ['Mid','Upper','Lower'],
            donchian:['Upper','Lower','Mid'],
            psar:    ['Dots'],
            ichimoku:['Tenkan','Kijun','Span A','Span B','Chikou'],
            rsi:     ['Line'],
            stoch:   ['%K','%D'],
            macd:    ['Hist','MACD','Signal'],
            cci:     ['Line'],
            willr:   ['Line'],
            roc:     ['Line'],
            mom:     ['Line'],
            mfi:     ['Line'],
            ao:      ['Hist'],
            trix:    ['Line'],
            dpo:     ['Line'],
            uo:      ['Line'],
            atr:     ['Line'],
            adx:     ['ADX','+DI','-DI'],
            aroon:   ['Up','Down'],
            chop:    ['Line'],
            obv:     ['Line'],
            cmf:     ['Line'],
          };
          const labels = seriesLabels[cfg.id] || cfg.colors.map((_,i) => `S${i+1}`);
          cfg.colors.forEach((_, ci) => {
            const sw = _makeColorSwatch(cfg.id, ci, labels[ci] || `Series ${ci+1}`);
            const lbl = document.createElement('span');
            lbl.style.cssText = 'color:#6b7280;font-size:9px;';
            lbl.textContent = labels[ci] || `S${ci+1}`;
            const wrap2 = document.createElement('div');
            wrap2.style.cssText = 'display:flex;align-items:center;gap:2px;';
            wrap2.appendChild(sw);
            wrap2.appendChild(lbl);
            paramRow.appendChild(wrap2);
          });

          pop.appendChild(paramRow);
        }
      });
    });

    document.body.appendChild(pop);

    if (preserveScrollTop != null) pop.scrollTop = preserveScrollTop;

    if (btn) {
      const rect = btn.getBoundingClientRect();
      const popH = Math.min(520, pop.scrollHeight || 450);
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= 80 ? rect.bottom + 4 : rect.top - popH - 4;
      const popW = pop.offsetWidth || 300;
      let left = rect.left;
      if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
      pop.style.top  = Math.max(8, top) + 'px';
      pop.style.left = Math.max(8, left) + 'px';
    }

    pop.addEventListener('click',     e => e.stopPropagation());
    pop.addEventListener('mousedown', e => e.stopPropagation());

    setTimeout(() => {
      document.addEventListener('mousedown', function _outsideClose(e) {
        const b = document.getElementById('lw-ind-btn');
        if (b && b.contains(e.target)) return; 
        _closeIndDropdown();
      }, { once: true });
    }, 0);
  }

  (function _attachIndBtn() {
    const btn = document.getElementById('lw-ind-btn');
    if (!btn) return;
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', e => { e.stopPropagation(); _openIndDropdown(); });
  })();

  _renderIndPills();
  _updateIndBtn();

  function _fmtHdrVal(v) { return v != null && !isNaN(v) ? v.toFixed(dec) : '\u2014'; }

  function _updateAllMALegend() {}   
  function _updateMALegend() {}      

  const _prevCloseMap = new Map();
  for (let i = 1; i < bars.length; i++) {
    _prevCloseMap.set(bars[i].time, bars[i - 1].close);
  }
  _lwActivePrevCloseMap = _prevCloseMap;

  function _updateLWHeader(bar, maVal, rtOverride) {
    const symEl  = document.getElementById('lw-hdr-sym');
    const oEl    = document.getElementById('lw-hdr-o-val');
    const hEl    = document.getElementById('lw-hdr-h-val');
    const lEl    = document.getElementById('lw-hdr-l-val');
    const cEl    = document.getElementById('lw-hdr-c-val');
    const chgEl  = document.getElementById('lw-hdr-chg-val');
    if (symEl) symEl.textContent = (_OHLC_FULL_NAMES[ohlcId] || label) + ' \u00b7 ' + _lwActiveTf;
    if (bar) {
      let isUp;
      {
        let _pctForDir;
        if (rtOverride?.pct != null) {
          _pctForDir = rtOverride.pct;
        } else {
          const _pc = _prevCloseMap.get(bar.time) ?? bar.open;
          _pctForDir = (_pc != null && _pc > 0 && bar.close != null) ? ((bar.close - _pc) / _pc) * 100 : null;
        }
        isUp = _pctForDir != null ? _pctForDir >= 0 : (bar.close != null && bar.close >= (bar.open ?? bar.close));
      }
      const ohlcColor = isUp ? _themeColor('--up') : _themeColor('--down');
      const _isOHLCType = (_effectiveChartType(ohlcId) === 'candle' || _effectiveChartType(ohlcId) === 'bar');
      const _ohlcWrap = document.getElementById('lw-hdr-ohlc-wrap');
      if (_ohlcWrap) _ohlcWrap.style.display = _isOHLCType ? '' : 'none';
      if (oEl) { oEl.textContent = _fmtHdrVal(bar.open); oEl.style.color = ohlcColor; }
      if (hEl) { hEl.textContent = _fmtHdrVal(bar.high); hEl.style.color = ohlcColor; }
      if (lEl) { lEl.textContent = _fmtHdrVal(bar.low);  lEl.style.color = ohlcColor; }
      if (cEl) { cEl.textContent = _fmtHdrVal(bar.close); cEl.style.color = ohlcColor; }
      if (chgEl) {
        let chg, pct;
        if (rtOverride?.pct != null) {
          pct = rtOverride.pct;
          chg = rtOverride.chg ?? (bar.close != null && bar.open != null ? bar.close - bar.open : null);
        } else {
          const prevClose = _prevCloseMap.get(bar.time) ?? bar.open;
          chg = (prevClose != null && bar.close != null) ? bar.close - prevClose : null;
          pct = (prevClose != null && prevClose > 0 && bar.close != null) ? (chg / prevClose) * 100 : null;
        }
        if (pct != null && chg != null) {
          const sign = chg >= 0 ? '+' : '';
          chgEl.textContent = ' ' + sign + chg.toFixed(dec) + ' (' + sign + pct.toFixed(2) + '%)';
          chgEl.className = 'lw-hdr-chg ' + (chg >= 0 ? 'up' : 'dn');
        } else {
          chgEl.textContent = '';
        }
      }
    }
    _updateMALegend(maVal);
  }

  _lwActiveUpdateHeader = _updateLWHeader;

  function _getRtOverride() {
    const ck = ohlcId === 'gold' ? 'xauusd' : ohlcId;
    const rt = STOOQ_RT_CACHE[ck];
    return (rt?.pct != null) ? { pct: rt.pct, chg: rt.chg } : null;
  }

  const hdrEl = document.getElementById('lw-chart-header');
  if (hdrEl) hdrEl.style.display = 'flex';

  const lastBar = todayBar || (bars.length > 0 ? bars[bars.length - 1] : null);
  _updateLWHeader(lastBar, null, _getRtOverride());

  const panelSub = document.querySelector('#section-fxpairs .panel-sub');
  if (panelSub) {
    const _hasLiveFeedActive = Object.values(STOOQ_RT_CACHE).some(e => e?.fromLiveFeed);
    panelSub.textContent = isFxMarketClosedNow() ? 'Market Closed' : (_hasLiveFeedActive ? 'Live' : 'Delayed ~5min');
  }

  const _CB_NAMES = {
    USD:'Federal Reserve (FOMC)', EUR:'ECB Governing Council',
    GBP:'Bank of England',        JPY:'Bank of Japan',
    AUD:'Reserve Bank of Australia', CAD:'Bank of Canada',
    CHF:'Swiss National Bank',    NZD:'Reserve Bank of New Zealand',
  };
  const TOOLTIP_W  = 200; 
  const TOOLTIP_H  = 48;  
  const TOOLTIP_MARGIN = 12; 

  const _cbTooltip = document.createElement('div');
  _cbTooltip.id = '_lw-cb-tooltip';
  Object.assign(_cbTooltip.style, {
    position:       'absolute',
    display:        'none',
    pointerEvents:  'none',
    boxSizing:      'border-box',
    width:          TOOLTIP_W + 'px',
    background:     'var(--bg2)',
    border:         '1px solid var(--border2)',
    borderRadius:   '4px',
    padding:        '6px 10px',
    fontSize:       '11px',
    lineHeight:     '1.5',
    fontFamily:     'var(--font-ui,sans-serif)',
    color:          'var(--text)',
    zIndex:         '50',
    boxShadow:      '0 4px 12px rgba(0,0,0,.6)',
  });
  chartDiv.style.position = 'relative';
  chartDiv.appendChild(_cbTooltip);

  const _cmpTooltip = document.createElement('div');
  _cmpTooltip.id = '_lw-cmp-tooltip';
  Object.assign(_cmpTooltip.style, {
    position:       'absolute',
    display:        'none',
    pointerEvents:  'none',
    boxSizing:      'border-box',
    background:     'var(--bg2)',
    border:         '1px solid var(--border2)',
    borderRadius:   '4px',
    padding:        '6px 10px',
    fontSize:       '10px',
    lineHeight:     '1.5',
    fontFamily:     'var(--font-mono,monospace)',
    color:          'var(--text)',
    zIndex:         '50',
    boxShadow:      '0 4px 16px rgba(0,0,0,.4)',
    whiteSpace:     'nowrap',
  });
  chartDiv.appendChild(_cmpTooltip);

  _lwChart.subscribeCrosshairMove(param => {
    if (!param || !param.time || !param.seriesData) {
      _updateLWHeader(lastBar, null, _getRtOverride());
      _updateAllMALegend(null);
      _cbTooltip.style.display = 'none';
      _cmpTooltip.style.display = 'none';
      return;
    }
    const _rawSeriesData = param.seriesData.get(candleSeries);
    const candleData = _rawSeriesData
      ? (_rawSeriesData.close != null ? _rawSeriesData
         : { ..._rawSeriesData, open: _rawSeriesData.value, high: _rawSeriesData.value,
             low: _rawSeriesData.value, close: _rawSeriesData.value })
      : null;
    if (candleData) _updateAllMALegend(param.seriesData);
    const isCurrentBar = lastBar && candleData && candleData.time === lastBar.time;
    if (candleData) _updateLWHeader(candleData, null, isCurrentBar ? _getRtOverride() : null);

    const dateStr = typeof param.time === 'string' ? param.time
      : new Date(param.time * 1000).toISOString().slice(0, 10);

    const cmpUids = Object.keys(_lwCompareSeriesMap);
    if (cmpUids.length === 0) {
      _cmpTooltip.style.display = 'none';
    } else {
      const rows = [];
      cmpUids.forEach(uid => {
        const series = _lwCompareSeriesMap[uid];
        const meta   = _lwCompareMeta[uid];
        if (!series || !meta) return;
        const d = param.seriesData.get(series);
        if (!d || d.value == null) return;
        rows.push(`<div style="display:flex;align-items:center;gap:6px;${rows.length ? 'margin-top:2px;' : ''}">`
          + `<span style="width:8px;height:2px;background:${meta.color};display:inline-block;flex-shrink:0;border-radius:1px;"></span>`
          + `<span style="color:var(--text2);">${meta.cmpLabel}</span>`
          + `<span style="color:${meta.color};font-weight:700;margin-left:auto;padding-left:10px;">${meta.formatter(d.value)}</span>`
          + `</div>`);
        const dec = meta.decisions && meta.decisions[dateStr];
        if (dec) {
          const decCol = dec.delta > 0 ? 'var(--up)' : 'var(--down)';
          const sign   = dec.delta > 0 ? '+' : '';
          rows.push(`<div style="color:${decCol};font-weight:600;font-size:9px;margin-top:1px;">${sign}${Math.round(dec.delta * 100)}bp decision</div>`);
        }
      });
      if (rows.length === 0) {
        _cmpTooltip.style.display = 'none';
      } else {
        _cmpTooltip.innerHTML =
          `<div style="font-size:8px;color:var(--text2);letter-spacing:.05em;margin-bottom:3px;">${dateStr}</div>`
          + rows.join('');
        _cmpTooltip.style.display = 'block';
        const cW2 = chartDiv.offsetWidth;
        const cx2 = param.point?.x ?? 0, cy2 = param.point?.y ?? 0;
        const tw2 = _cmpTooltip.offsetWidth  || 140;
        const th2 = _cmpTooltip.offsetHeight || 40;
        const tx2 = (cx2 + TOOLTIP_MARGIN + tw2 <= cW2 - 4) ? cx2 + TOOLTIP_MARGIN : cx2 - TOOLTIP_MARGIN - tw2;
        const ty2 = (cy2 - th2 - TOOLTIP_MARGIN >= 4) ? cy2 - th2 - TOOLTIP_MARGIN : cy2 + TOOLTIP_MARGIN;
        _cmpTooltip.style.left = Math.max(0, tx2) + 'px';
        _cmpTooltip.style.top  = Math.max(0, ty2) + 'px';
      }
    }

    const cbEvents = window._lwShowCb && window._lwCbMarkerMap && window._lwCbMarkerMap[dateStr];
    if (!cbEvents || cbEvents.length === 0) {
      _cbTooltip.style.display = 'none';
      return;
    }

    const lines = cbEvents.map(ev => {
      const name = _CB_NAMES[ev.cb] || ev.cb;
      return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:1px;">`
        + `<span style="display:inline-block;width:3px;height:12px;background:${ev.color};border-radius:1px;flex-shrink:0;"></span>`
        + `<span><span style="color:${ev.color};font-weight:700;">${ev.cb}</span>`
        + ` <span style="color:var(--text3);font-size:10px;">${name}</span></span>`
        + `</div>`;
    }).join('');
    _cbTooltip.innerHTML =
      `<div style="font-size:9px;color:var(--text3);letter-spacing:.05em;margin-bottom:3px;">CB MEETING</div>`
      + lines;

    _cbTooltip.style.display = 'block';
    const cW = chartDiv.offsetWidth;
    const cH = chartDiv.offsetHeight;
    const cx = param.point?.x ?? 0;
    const cy = param.point?.y ?? 0;
    const tx = (cx + TOOLTIP_MARGIN + TOOLTIP_W <= cW - 4)
      ? cx + TOOLTIP_MARGIN
      : cx - TOOLTIP_MARGIN - TOOLTIP_W;
    const actualH = _cbTooltip.offsetHeight || TOOLTIP_H;
    const ty = (cy - actualH - TOOLTIP_MARGIN >= 4)
      ? cy - actualH - TOOLTIP_MARGIN
      : cy + TOOLTIP_MARGIN;
    _cbTooltip.style.left = Math.max(0, tx) + 'px';
    _cbTooltip.style.top  = Math.max(0, ty) + 'px';
  });

  _lwSetRange(_lwActiveDays, bars.length);

  const rangeBar = document.getElementById('lw-range-bar');
  if (rangeBar) {
    rangeBar.style.display = 'flex';
    rangeBar.querySelectorAll('.lw-tf-btn').forEach(b => {
      b.classList.toggle('sel', b.dataset.tf === _lwActiveTf);
    });
    _lwUpdateRangeBtns();
    rangeBar.querySelectorAll('.lw-range-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.days) === _lwActiveDays);
    });
  }

  if (typeof ResizeObserver !== 'undefined') {
    _lwResizeObs = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (_lwChart && width > 0 && height > 0) { _lwChart.resize(width, height); _lwReapplyPaneHeights(); _lwReprojectDrawings(); }
      }
    });
    _lwResizeObs.observe(chartDiv);
  }
}

function loadCOTChart(longSym) {
  const shortSym = longSym.replace(/_L$/, '_S');
  const wrap = document.getElementById('tv-chart-wrap');
  if (!wrap) return;
  _chartMode = 'tv'; 
  _destroyLWChart();
  wrap.innerHTML = '';
  wrap.style.pointerEvents = 'none';
  wrap.style.marginBottom = '-32px';
  const rangeBar = document.getElementById('lw-range-bar');
  if (rangeBar) rangeBar.style.display = 'none';
  const cotHdr = document.getElementById('lw-chart-header');
  if (cotHdr) cotHdr.style.display = 'none';
  const container = document.createElement('div');
  container.className = 'tradingview-widget-container';
  container.style.cssText = 'height:100%;width:100%;';
  const widget = document.createElement('div');
  widget.className = 'tradingview-widget-container__widget';
  widget.style.cssText = 'height:100%;width:100%;';
  container.appendChild(widget);
  const copyright = document.createElement('div');
  copyright.className = 'tradingview-widget-copyright';
  copyright.style.display = 'none';
  container.appendChild(copyright);
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async = true;
  script.text = JSON.stringify({
    allow_symbol_change: false, calendar: false, details: false,
    hide_side_toolbar: true, hide_top_toolbar: true, hide_legend: false,
    hide_volume: true, interval: 'W', locale: 'en', save_image: true,
    style: '2', symbol: longSym, theme: 'dark', timezone: 'Etc/UTC',
    backgroundColor: _themeColor('--bg'), gridColor: _themeColorAlpha('--border', 0.8),
    scaleMode: 2, studies: [], autosize: true,
  });
  container.appendChild(script);
  wrap.appendChild(container);
  const chartSection = document.getElementById('section-fxpairs') || wrap.closest('.panel') || wrap;
  chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _loadTVWidgetFallback(sym) {
  const wrap = document.getElementById('tv-chart-wrap');
  if (!wrap) return;
  _chartMode = 'tv'; 
  _destroyLWChart();
  wrap.innerHTML = '';
  wrap.style.pointerEvents = 'none';
  wrap.style.marginBottom = '-32px';
  const rangeBar = document.getElementById('lw-range-bar');
  if (rangeBar) rangeBar.style.display = 'none';
  const hdrEl = document.getElementById('lw-chart-header');
  if (hdrEl) hdrEl.style.display = 'none';
  const panelSub = document.querySelector('#section-fxpairs .panel-sub');
  if (panelSub) panelSub.textContent = 'TradingView \u00b7 live data';
  const container = document.createElement('div');
  container.className = 'tradingview-widget-container';
  container.style.cssText = 'height:100%;width:100%;';
  const widget = document.createElement('div');
  widget.id = 'tv-chart-widget';
  widget.className = 'tradingview-widget-container__widget';
  widget.style.cssText = 'height:100%;width:100%;';
  container.appendChild(widget);
  const copyright = document.createElement('div');
  copyright.className = 'tradingview-widget-copyright';
  copyright.style.display = 'none';
  container.appendChild(copyright);
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async = true;
  const _LINE_STYLE_SYMS = new Set(['FRED:DGS10', 'FRED:BAMLH0A0HYM2', 'FRED:BAMLC0A0CM']);
  const chartStyle = _LINE_STYLE_SYMS.has(sym) ? '3' : '1';
  script.text = JSON.stringify({
    allow_symbol_change:false, calendar:false, details:true,
    hide_side_toolbar:true, hide_top_toolbar:true, hide_legend:false,
    hide_volume:true, interval:'D', locale:'en', save_image:false,
    style:chartStyle, symbol:sym, theme:'dark', timezone:'Etc/UTC',
    backgroundColor:_themeColor('--bg'), gridColor:_themeColorAlpha('--border', 0.8),
    withdateranges:false, studies:[{id:'MASimple@tv-basicstudies',inputs:{length:20}}], autosize:true
  });
  container.appendChild(script);
  wrap.appendChild(container);
}

function loadTVChart(sym) {
  document.querySelectorAll('.tv-tab').forEach(t => {
    t.classList.remove('active');
    if (t.dataset.sym === sym) t.classList.add('active');
  });
  updatePairDetail(sym);
  const chartSection = document.getElementById('section-fxpairs') ||
    document.getElementById('tv-chart-wrap')?.closest('.panel') ||
    document.getElementById('tv-chart-wrap');
  const ohlcId = _TV_TO_OHLC[sym];
  if (ohlcId) {
    const label = sym.split(':').pop().replace(/[^A-Z0-9/]/gi, '');
    _renderLWChart(ohlcId, label)
      .then(() => { if (chartSection) chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); })
      .catch(err => {
        console.error('[LWChart] _renderLWChart failed for', ohlcId, '—', err);
        _loadTVWidgetFallback(sym);
        if (chartSection) chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
  } else {
    _loadTVWidgetFallback(sym);
    if (chartSection) chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.getElementById('quotebar-inner')?.addEventListener('click', e => {
  const item = e.target.closest('.q-item');
  if (!item) return;
  const sym = item.dataset.sym;
  if (sym) loadTVChart(sym);
});

document.getElementById('lw-range-bar')?.addEventListener('click', e => {
  const btn = e.target.closest('.lw-range-btn');
  if (!btn) return;
  _lwSetRange(parseInt(btn.dataset.days));
});

document.getElementById('lw-log-btn')?.addEventListener('click', function() {
  window._lwLogScale = !window._lwLogScale;
  this.classList.toggle('on', window._lwLogScale);
  this.setAttribute('aria-pressed', window._lwLogScale ? 'true' : 'false');
  if (_lwChart) {
    try { _lwChart.priceScale('right').applyOptions({ mode: window._lwLogScale ? 1 : 0 }); } catch(_) {}
  }
});

document.getElementById('lw-wm-btn')?.addEventListener('click', function() {
  window._lwShowWm = !window._lwShowWm;
  this.classList.toggle('on', window._lwShowWm);
  this.setAttribute('aria-pressed', window._lwShowWm ? 'true' : 'false');
  if (_lwActiveOhlcId) _renderLWChart(_lwActiveOhlcId);
});

document.getElementById('lw-pc-btn')?.addEventListener('click', function() {
  window._lwShowPc = !window._lwShowPc;
  this.classList.toggle('on', window._lwShowPc);
  this.setAttribute('aria-pressed', window._lwShowPc ? 'true' : 'false');
  if (_lwActiveOhlcId) _renderLWChart(_lwActiveOhlcId);
});

document.getElementById('lw-vol-btn')?.addEventListener('click', function() {
  window._lwShowVol = !window._lwShowVol;
  this.classList.toggle('on', window._lwShowVol);
  this.setAttribute('aria-pressed', window._lwShowVol ? 'true' : 'false');
  if (_lwActiveOhlcId) _renderLWChart(_lwActiveOhlcId);
});

document.getElementById('lw-cb-btn')?.addEventListener('click', function() {
  window._lwShowCb = !window._lwShowCb;
  this.classList.toggle('on', window._lwShowCb);
  this.setAttribute('aria-pressed', window._lwShowCb ? 'true' : 'false');
  if (_lwActiveOhlcId) _renderLWChart(_lwActiveOhlcId);
});

document.getElementById('lw-range-bar')?.addEventListener('click', function(e) {
  const typeBtn = e.target.closest('[data-chart-type]');
  if (!typeBtn || typeBtn.disabled) return;
  window._lwChartType = typeBtn.dataset.chartType;
  document.querySelectorAll('[data-chart-type]').forEach(b => {
    b.classList.toggle('sel', b === typeBtn);
    b.classList.remove('on');
  });
  const _effType = _effectiveChartType(_lwActiveOhlcId);
  const _ohlcWrap = document.getElementById('lw-hdr-ohlc-wrap');
  if (_ohlcWrap) _ohlcWrap.style.display = (_effType === 'candle' || _effType === 'bar') ? '' : 'none';
  if (_lwActiveOhlcId) _renderLWChart(_lwActiveOhlcId);
});

function _giUnifiedPairDetail(row) {
  if (document.documentElement.dataset.pairDetail !== 'unified') return false;
  document.dispatchEvent(new CustomEvent('gi:pairDetailToggle', { detail: { sym: row.dataset.sym } }));
  return true;
}

function toggleInlineDetail(row) {
  if (_giUnifiedPairDetail(row)) return;
  const tvSym = row.dataset.sym;
  const tbody = row.closest('tbody');
  if (!tbody) return;

  const existingExpand = tbody.querySelector('tr.pd-expand-row');
  const wasThisRow = existingExpand?.dataset.forSym === tvSym;

  if (existingExpand) {
    const inner = existingExpand.querySelector('td > div');
    if (inner) {
      inner.style.maxHeight = inner.scrollHeight + 'px';
      inner.style.overflow = 'hidden';
      requestAnimationFrame(() => { inner.style.maxHeight = '0'; });
    }
    setTimeout(() => existingExpand.remove(), 200);
    tbody.querySelector('tr.pd-selected')?.classList.remove('pd-selected');
  }

  if (wasThisRow) return; 

  row.classList.add('pd-selected');

  const expandRow = document.createElement('tr');
  expandRow.className = 'pd-expand-row';
  expandRow.dataset.forSym = tvSym;
  const td = document.createElement('td');
  td.colSpan = 12; 
  const inner = document.createElement('div');
  inner.innerHTML = '<div style="padding:6px 10px;font-size:10px;color:var(--text3);">Loading…</div>';
  td.appendChild(inner);
  expandRow.appendChild(td);
  row.after(expandRow);

  requestAnimationFrame(() => {
    expandRow.classList.add('pd-open');
    inner.style.maxHeight = '185px';
    setTimeout(() => {
      if (expandRow.classList.contains('pd-open')) {
        inner.style.maxHeight = 'none';
        inner.style.overflow  = 'visible';
      }
    }, 200); 
  });

  buildInlineDetail(tvSym, inner);
}

function _ivSourceLabel(raw) {
  if (!raw) return 'institutional options market';
  if (raw.startsWith('CBOE')) return raw.split(' ').slice(0, 2).join(' '); 
  if (raw.startsWith('Saxo Bank')) return 'Saxo Bank FX Options Analytics';
  if (raw.includes('Barchart') || raw.includes('CME')) return 'CME futures options market';
  if (raw.startsWith('PHLX')) return 'PHLX World Currency Options';
  if (raw.startsWith('est. AUD')) return 'AUD/USD-derived proxy';
  if (raw.startsWith('est.')) return 'estimated proxy';
  return 'exchange-listed options market'; 
}

async function buildInlineDetail(tvSym, container) {
  const meta   = pairMetaFromSym(tvSym);
  const label  = meta?.label || tvSym.replace(/^.*:/,'').replace(/(.{3})(.{3})/,'$1/$2').toUpperCase();
  const pairId = meta?.id || null;
  const base   = meta?.base  || null;
  const quote  = meta?.quote || null;
  const invert = meta?.invert ?? false;
  const dec    = meta?.dec   ?? 5;

  const rt    = pairId ? STOOQ_RT_CACHE[pairId] : null;
  const price = rt?.close ?? null;
  const pct1d = rt?.pct   ?? null;
  const pct1w = rt?.pct1w ?? null;
  const hv30  = rt?.hv30  ?? null;
  const sessH = rt?.session_high ?? rt?.high ?? null;
  const sessL = rt?.session_low  ?? rt?.low  ?? null;

  const pipVal     = dec === 3 ? 0.01 : 0.0001;
  const spreadPips = pairId ? (TYPICAL_SPREADS[pairId] || null) : null;
  let adr = null;
  if (hv30 != null && price != null) {
    adr = Math.round(price * (hv30 / 100) / Math.sqrt(252) / pipVal);
  }
  let adrPct = null;
  if (adr != null && adr > 0 && sessH != null && sessL != null) {
    adrPct = Math.round(((sessH - sessL) / pipVal / adr) * 100);
  }

  const CROSS_IV_RHO = {
    'eurgbp':0.65,'eurjpy':0.55,'eurchf':0.60,'eurcad':0.40,'euraud':0.35,'eurnzd':0.30,
    'gbpjpy':0.45,'gbpchf':0.55,'gbpcad':0.30,'gbpaud':0.25,'gbpnzd':0.20,
    'audjpy':0.40,'audnzd':0.55,'audchf':0.30,'audcad':0.50,
    'cadjpy':0.35,'cadchf':0.25,'chfjpy':0.40,'nzdjpy':0.35,'nzdcad':0.45,'nzdchf':0.20,
  };
  const USD_IV = {};
  let atmIv = null;
  let atmIvRank = null;
  let atmIvSource = null;
  try {
    const intra = await loadIntradayQuotes();
    const etfIv = intra?.fx_etf_iv || {};
    for (const [pid, entry] of Object.entries(etfIv)) {
      if (entry?.iv == null) continue;
      const p = PAIRS.find(x => x.id === pid);
      if (!p) continue;
      const nonUsd = p.base !== 'USD' ? p.base : p.quote;
      USD_IV[nonUsd] = entry.iv;
    }
    if (USD_IV['AUD'] != null && USD_IV['NZD'] == null) USD_IV['NZD'] = Math.round(USD_IV['AUD'] * 1.08 * 10) / 10;
    const ivEntry = etfIv[pairId];
    if (ivEntry?.iv != null) {
      atmIv = ivEntry.iv;
      atmIvRank = ivEntry.iv_rank ?? null;
      atmIvSource = ivEntry.source ?? null;
    } else if (pairId && meta?.cross) {
      const ivA = USD_IV[base] ?? null, ivB = USD_IV[quote] ?? null;
      if (ivA != null && ivB != null) {
        const rho = CROSS_IV_RHO[pairId] ?? 0.40;
        atmIv = Math.round(Math.sqrt(ivA*ivA + ivB*ivB - 2*rho*ivA*ivB) * 10) / 10;
      }
    }
  } catch {}

  const isCrossPair = !!meta?.cross;
  const cotCcy = base && base !== 'USD' ? base : (quote && quote !== 'USD' ? quote : base);
  const cotRaw = cotCcy ? (COT_DATA_CACHE[cotCcy] || null) : null;
  const cotCcy2 = isCrossPair && quote && quote !== cotCcy ? quote : null;
  const cotRaw2 = cotCcy2 ? (COT_DATA_CACHE[cotCcy2] || null) : null;
  let cotNet = null, cotAmNet = null, cotWow = null, cotPctOI = null, cotWeek = '';
  if (cotRaw) {
    const flip = (invert && cotCcy === quote) ? -1 : 1;
    cotNet   = cotRaw.net   != null ? cotRaw.net   * flip : null;
    cotAmNet = cotRaw.amNet != null ? cotRaw.amNet * flip : null;
    cotWow   = cotRaw.wowNetChange != null ? cotRaw.wowNetChange * flip : null;
    cotPctOI = cotRaw.levNetPctOI  != null ? cotRaw.levNetPctOI  * flip : null;
    cotWeek  = cotRaw.weekEnding || '';
  }
  let cot2Net = null, cot2AmNet = null, cot2Wow = null, cot2PctOI = null;
  if (cotRaw2) {
    cot2Net    = cotRaw2.net          ?? null;
    cot2AmNet  = cotRaw2.amNet        ?? null;
    cot2Wow    = cotRaw2.wowNetChange ?? null;
    cot2PctOI  = cotRaw2.levNetPctOI  ?? null;
    if (!cotWeek && cotRaw2.weekEnding) cotWeek = cotRaw2.weekEnding;
  }

  const [oisBase,  oisSrcBase]  = (typeof _resolveRate === 'function' && base)  ? _resolveRate(base)  : [null, null];
  const [oisQuote, oisSrcQuote] = (typeof _resolveRate === 'function' && quote) ? _resolveRate(quote) : [null, null];
  const cbBase  = oisBase  ?? (base  ? (STATE.cbRates?.[base.toLowerCase()]?.rate  ?? null) : null);
  const cbQuote = oisQuote ?? (quote ? (STATE.cbRates?.[quote.toLowerCase()]?.rate ?? null) : null);
  const carrySource = (oisBase != null || oisQuote != null) ? 'OIS' : 'policy rate';
  let carryDiff = null;
  if (cbBase != null && cbQuote != null) {
    carryDiff = meta?.cross ? cbBase - cbQuote : (invert ? cbBase - cbQuote : cbQuote - cbBase);
  }

  const bondBase  = base  ? (BOND_YIELD_CACHE[base]  || null) : null;
  const bondQuote = quote ? (BOND_YIELD_CACHE[quote] || null) : null;
  let bondTenor = null, bondDiff = null;
  if (bondBase && bondQuote) {
    const pick = (tenor) => (bondBase[tenor] != null && bondQuote[tenor] != null
      && !(tenor === 'y2' && (bondBase.y2Stale || bondQuote.y2Stale)))
      ? bondBase[tenor] - bondQuote[tenor] : null;
    const y2diff = pick('y2');
    if (y2diff != null) {
      bondTenor = '2Y'; bondDiff = y2diff;
    } else {
      const y10diff = pick('y10');
      if (y10diff != null) { bondTenor = '10Y'; bondDiff = y10diff; }
    }
    if (bondDiff != null && !meta?.cross) {
      bondDiff = invert ? bondDiff : -bondDiff;
    }
  }

  const rrKey = pairId ? pairId.toUpperCase() : null;
  const rrVal = rrKey ? (RR_DATA_CACHE[rrKey]?.rr25d ?? null) : null;

  const retKey = label.toUpperCase();
  const ret     = RETAIL_SENTIMENT_CACHE[retKey] || null;
  const retL    = ret?.longPct  ?? null;
  const retS    = ret?.shortPct ?? null;
  const retAvgL = ret?.avgL     ?? null;   
  const retAvgS = ret?.avgS     ?? null;   
  const retLPos = ret?.longPos  ?? null;   
  const retSPos = ret?.shortPos ?? null;   
  const retSkew = retL == null ? null
    : retL >= 75 ? 'Heavily Long'
    : retL >= 65 ? 'Majority Long'
    : retL <= 25 ? 'Heavily Short'
    : retL <= 35 ? 'Majority Short'
    : 'Mixed';
  const retSkewCls = retL == null ? ''
    : retL >= 65 ? 'pd-dn'   
    : retL <= 35 ? 'pd-up'   
    : 'pd-dim';
  const retLUnder = (retAvgL != null && price != null && retL != null && retL >= 50)
    ? price < retAvgL   
    : null;
  const retSUnder = (retAvgS != null && price != null && retS != null && retS > 50)
    ? price > retAvgS   
    : null;

  const fmtP  = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
  const fmtN  = v => v == null ? '—' : (v >= 0 ? '+' : '') + Math.round(v).toLocaleString();
  const cls   = v => v == null ? '' : v > 0 ? 'pd-up' : v < 0 ? 'pd-dn' : '';
  const clsI  = v => v == null ? '' : v > 0 ? 'pd-up' : v < 0 ? 'pd-dn' : '';
  const fmtV  = (v, suffix='') => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(2) + suffix;
  const ivCls = v => {
    if (v == null) return '';
    if (atmIvRank != null) return atmIvRank > 70 ? 'pd-dn' : atmIvRank < 30 ? 'pd-up' : '';
    return v > 12 ? 'pd-dn' : v < 7 ? 'pd-up' : '';
  };
  const hvCls = v => v == null ? '' : v > 12 ? 'pd-dn' : v < 7 ? 'pd-up' : '';

  let cotTag = '—';
  if (isCrossPair && cotCcy2) {
    const parts = [];
    for (const [ccy, net, amNet] of [[cotCcy, cotNet, cotAmNet], [cotCcy2, cot2Net, cot2AmNet]]) {
      if (net == null) continue;
      const lfD = net > 0 ? 'Long' : net < 0 ? 'Short' : null;
      const amD = amNet != null ? (amNet > 0 ? 'Long' : amNet < 0 ? 'Short' : null) : null;
      if (!lfD) continue;
      const lfC = net > 0 ? 'pd-up' : 'pd-dn';
      const amPart = amD ? ` · <span class="${amNet > 0 ? 'pd-up' : 'pd-dn'}">${amD}</span> <span style="color:var(--text3);font-size:8px;">AM</span>` : '';
      const alignedStr = lfD && amD ? (lfD === amD ? ' · <span style="color:var(--text3);font-size:8px;">aligned</span>' : ' · <span style="color:var(--text3);font-size:8px;">diverging</span>') : '';
      parts.push(`<span style="color:var(--text3);font-size:8px;text-transform:uppercase;">${ccy}</span> <span class="${lfC}">${lfD}</span> <span style="color:var(--text3);font-size:8px;">LF</span>${amPart}${alignedStr}`);
    }
    cotTag = parts.join('<span style="color:var(--text3);"> · </span>') || '—';
  } else {
    const lfDir = cotNet == null ? null : cotNet > 0 ? 'Long' : cotNet < 0 ? 'Short' : null;
    const amDir = cotAmNet == null ? null : cotAmNet > 0 ? 'Long' : cotAmNet < 0 ? 'Short' : null;
    const aligned = lfDir && amDir && lfDir === amDir;
    cotTag = lfDir && amDir
      ? `<span class="${clsI(cotNet)}">${lfDir}</span> <span style="color:var(--text3);font-size:8px;">LF · </span><span class="${clsI(cotAmNet)}">${amDir}</span> <span style="color:var(--text3);font-size:8px;">AM · ${aligned ? 'aligned' : 'diverging'}</span>`
      : '—';
  }

  const footerSources = [cotWeek ? 'COT ' + cotWeek : null, 'Myfxbook', rrVal != null ? 'Saxo RR' : null].filter(Boolean).join(' · ');

  container.innerHTML = `
    <div class="pd-inline-scroll">
    <div class="pd-inline">
      <div class="pd-inline-price">
        <div class="pd-inline-sym">${label}</div>
        <div class="pd-inline-rate">${price != null ? price.toFixed(dec) : '—'}</div>
        <div class="pd-inline-chg ${cls(pct1d)}">${fmtP(pct1d)}</div>
        ${sessH != null && sessL != null ? `<div class="pd-inline-meta">H ${sessH.toFixed(dec)} · L ${sessL.toFixed(dec)}</div>` : ''}
      </div>

      <div class="pd-inline-group">
        <div class="pd-inline-group-lbl">Price &amp; Spreads</div>
        <div class="pd-inline-metrics">
          <div class="pd-inline-metric fx-tip" data-tip-title="1-Week Change" data-tip-body="Weekly % change vs prior Friday close.">
            <div class="pd-inline-lbl">1W Chg</div><div class="pd-inline-val ${cls(pct1w)}">${fmtP(pct1w)}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="Carry Differential" data-tip-body="OIS/overnight rate differential (OIS preferred; falls back to CB policy rate). Positive = carry favours long base currency." data-tip-ex="Long the higher-yielding currency, short the lower-yielding currency. OIS reflects actual overnight funding cost; CB policy rate is the ceiling.">
            <div class="pd-inline-lbl">Carry</div><div class="pd-inline-val ${clsI(carryDiff)}">${carryDiff != null ? (carryDiff >= 0 ? '+' : '') + carryDiff.toFixed(2) + '%' : '—'}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="${bondTenor || '2Y'} Sovereign Bond Spread" data-tip-body="ΔY = Yield(${base || 'base'}) − Yield(${quote || 'quote'}) at the ${bondTenor || '2Y'} tenor. Short-end (2Y) yield differentials are the primary driver of sustained FX direction — they track near-term rate-expectations divergence more closely than 10Y, which reflects longer-run growth/inflation premia and duration flows.${bondTenor === '10Y' ? ' 2Y unavailable for one or both legs — showing 10Y as fallback.' : ''} Source: extended-data sovereign yield pipeline (FRED/ECB/BOE/BOC/SNB/DBnomics)." data-tip-ex="A rising ${bondTenor || '2Y'} spread in the base currency's favour has historically preceded sustained appreciation — it signals the market pricing in a widening policy-rate gap before central banks act.">
            <div class="pd-inline-lbl">${bondTenor || '2Y'} Spread</div><div class="pd-inline-val ${clsI(bondDiff)}">${bondDiff != null ? (bondDiff >= 0 ? '+' : '') + (bondDiff * 100).toFixed(0) + ' bp' : '—'}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="Average Daily Range" data-tip-body="Estimated avg daily range in pips from HV 30d, plus % of ADR already covered by today's session range (H−L). Useful for stop/target sizing and gauging how much of the day's typical move is left." data-tip-ex="ADR 85 pip (62%) means today's range has already covered 62% of the pair's average daily range.">
            <div class="pd-inline-lbl">ADR</div><div class="pd-inline-val ${adrPct != null && adrPct >= 100 ? 'pd-dn' : ''}">${adr != null ? adr + ' pip' : '—'}${adrPct != null ? ` <span style="color:var(--text3);font-size:9px;">(${adrPct}%)</span>` : ''}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="${base || 'Base'} Policy Rate" data-tip-body="${base || 'Base'} central bank policy rate (annualised).">
            <div class="pd-inline-lbl">${base || 'Base'} Rate</div><div class="pd-inline-val">${cbBase != null ? cbBase.toFixed(2) + '%' : '—'}</div>
          </div>
        </div>
      </div>

      <div class="pd-inline-group">
        <div class="pd-inline-group-lbl">Volatility</div>
        <div class="pd-inline-metrics">
          <div class="pd-inline-metric fx-tip" data-tip-title="Historical Volatility 30d" data-tip-body="30-day realised volatility, annualised — how much the pair has actually moved. Low HV = quiet market; high HV = volatile market. No 52-week percentile is computed for realised vol, so color uses a fixed band: green ≤7% (quiet), red >12% (volatile). Not a directional signal.">
            <div class="pd-inline-lbl">HV 30d</div><div class="pd-inline-val ${hvCls(hv30)}">${hv30 != null ? hv30.toFixed(1) + '%' : '—'}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="ATM Implied Volatility" data-tip-body="ATM (at-the-money) implied volatility — annualised, same variance-swap methodology as VIX where an exchange-computed index is available. Source: ${_ivSourceLabel(atmIvSource)}. ${atmIvRank != null ? 'Color = IV Rank vs 52-week range: green rank&lt;30 (historically cheap), red rank&gt;70 (historically expensive).' : 'Color = cost of hedging: green ≤7% (cheap), red >12% (expensive) — fixed band; IV Rank not yet available (needs ≥4 weeks history).'} Not a directional signal.">
            <div class="pd-inline-lbl">ATM IV</div><div class="pd-inline-val ${ivCls(atmIv)}">${atmIv != null ? atmIv.toFixed(1) + '%' : '—'}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="IV minus HV" data-tip-body="Implied vol minus realised vol — the volatility risk premium (VRP). Positive = options pricing in more than recent realised moves (expensive, red). Negative = options cheap vs realised (green). IV running above HV is the market's normal state, since option sellers demand a premium — a negative spread is comparatively rare. Not a directional signal.">
            <div class="pd-inline-lbl">IV − HV</div><div class="pd-inline-val ${atmIv != null && hv30 != null ? clsI(hv30 - atmIv) : ''}">${atmIv != null && hv30 != null ? (atmIv > hv30 ? '+' : '') + (atmIv - hv30).toFixed(1) + '%' : '—'}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="25d Risk Reversal · Saxo Bank (1M)" data-tip-body="25-delta Risk Reversal, 1M tenor: 25d call IV minus 25d put IV. Source: Saxo Bank public options page, indicative mid-market. Positive = calls bid over puts, upside skew on ${base || label.split('/')[0]}. Negative = puts bid, downside protection dominant. Directional skew signal, not a vol-level signal.">
            <div class="pd-inline-lbl">25d RR</div><div class="pd-inline-val ${clsI(rrVal)}">${rrVal != null ? (rrVal >= 0 ? '+' : '') + rrVal.toFixed(2) : '—'}</div>
          </div>
          <div class="pd-inline-metric fx-tip" data-tip-title="Bid-Ask Spread" data-tip-body="Estimated interbank ECN spread in pips.">
            <div class="pd-inline-lbl">Spread</div><div class="pd-inline-val">${spreadPips != null ? spreadPips.toFixed(1) + ' pip' : '—'}</div>
          </div>
        </div>
      </div>

      <div class="pd-inline-group">
        ${isCrossPair ? '' : '<div class="pd-inline-group-lbl">COT Positioning</div>'}
        ${(() => {
          const cotBlock = (ccy, net, wow, amNet, pctOI, isCross, addTopBorder) => {
            const crossNote = isCross ? ` CFTC tracks ${ccy} vs USD — use as ${ccy} sentiment proxy for this cross.` : '';
            const lfD = net == null ? null : net > 0 ? 'Long' : net < 0 ? 'Short' : null;
            const amD = amNet == null ? null : amNet > 0 ? 'Long' : amNet < 0 ? 'Short' : null;
            const alignedStr = lfD && amD ? (lfD === amD
              ? `<span style="color:var(--text3);font-size:8px;"> · aligned</span>`
              : `<span style="color:var(--text3);font-size:8px;"> · diverging</span>`) : '';
            const summaryLine = lfD
              ? `<div style="margin-top:4px;font-size:9px;font-family:var(--font-mono);">` +
                `<span class="${clsI(net)}">${lfD}</span><span style="color:var(--text3);font-size:8px;"> LF</span>` +
                (amD ? ` · <span class="${clsI(amNet)}">${amD}</span><span style="color:var(--text3);font-size:8px;"> AM</span>${alignedStr}` : '') +
                `</div>` : '';
            return `
            ${isCross ? `<div style="font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);padding:4px 0 3px;${addTopBorder ? 'border-top:1px solid var(--border);margin-top:4px;' : ''}">COT ${ccy}</div>` : (addTopBorder ? `<div style="border-top:1px solid var(--border);margin-top:4px;"></div>` : '')}
            <div class="pd-inline-metrics">
              <div class="pd-inline-metric fx-tip" data-tip-title="CFTC Leveraged Funds Net${isCross ? ` · ${ccy}` : ''}" data-tip-body="Net contracts (longs minus shorts) held by Leveraged Funds — hedge funds and CTAs.${crossNote}" data-tip-ex="Extreme net long historically precedes reversals as the speculative crowd becomes crowded.">
                <div class="pd-inline-lbl">LF Net</div><div class="pd-inline-val ${clsI(net)}">${fmtN(net)}</div>
              </div>
              <div class="pd-inline-metric fx-tip" data-tip-title="LF Week-over-Week Change${isCross ? ` · ${ccy}` : ''}" data-tip-body="Change in LF net contracts vs prior week. Primary momentum signal in institutional COT analysis." data-tip-ex="Reversal in WoW change is often the earliest signal of a positioning shift.">
                <div class="pd-inline-lbl">LF WoW Δ</div><div class="pd-inline-val ${clsI(wow)}">${fmtN(wow)}</div>
              </div>
              <div class="pd-inline-metric fx-tip" data-tip-title="Asset Managers Net${isCross ? ` · ${ccy}` : ''}" data-tip-body="Net contracts held by Asset Managers — pension funds, mutual funds. Structural positioning.${crossNote}" data-tip-ex="Divergence between LF and AM often signals a positioning squeeze.">
                <div class="pd-inline-lbl">AM Net</div><div class="pd-inline-val ${clsI(amNet)}">${fmtN(amNet)}</div>
              </div>
              <div class="pd-inline-metric fx-tip" data-tip-title="LF Net as % of OI${isCross ? ` · ${ccy}` : ''}" data-tip-body="LF net divided by LF Open Interest. Normalises positioning across currencies for direct comparison.${crossNote}" data-tip-ex="+15% = LF hold net long equivalent to 15% of total OI — historically a crowded position.">
                <div class="pd-inline-lbl">Net % OI</div><div class="pd-inline-val ${clsI(pctOI)}">${pctOI != null ? (pctOI > 0 ? '+' : '') + pctOI.toFixed(1) + '%' : '—'}</div>
              </div>
            </div>
            ${summaryLine}`;
          };

          if (isCrossPair && cotCcy2 && cotRaw2) {
            return `
            ${cotBlock(cotCcy, cotNet, cotWow, cotAmNet, cotPctOI, true, false)}
            ${cotBlock(cotCcy2, cot2Net, cot2Wow, cot2AmNet, cot2PctOI, true, true)}`;
          } else {
            return cotBlock(cotCcy, cotNet, cotWow, cotAmNet, cotPctOI, false, false);
          }
        })()}
      </div>

      <div class="pd-inline-group pd-inline-group--retail fx-tip"
        data-tip-title="Retail Client Positioning · Myfxbook"
        data-tip-body="Long/short % from Myfxbook community (retail traders only). Contrarian indicator — extreme retail long bias historically aligns with institutional short positioning. Avg entry shows where the dominant side opened; if price has moved against them, a stop-hunt or squeeze becomes more likely."
        data-tip-ex="Heavily Long (>65%) = contrarian bearish signal. Heavily Short (<35% long) = contrarian bullish signal. Avg entry underwater = retail under pressure, reversal risk elevated."
        style="border-right:none; justify-content:flex-start;">
        <div class="pd-inline-group-lbl">Retail <span class="pd-inline-retail-skew ${retSkewCls}">${retSkew || ''}</span></div>
        <div class="pd-inline-retail-bar" style="margin-bottom:3px;"><div class="pd-inline-retail-fill" style="width:${retL != null ? retL : 50}%"></div></div>
        <div class="pd-inline-retail-row">
          <span class="pd-inline-val ${retL != null && retL >= 65 ? 'pd-dn' : retL != null && retL <= 35 ? 'pd-up' : ''}">${retL != null ? retL + '% L' : '—'}</span>
          <span class="pd-dim"> / </span>
          <span>${retS != null ? retS + '% S' : '—'}</span>
        </div>
        ${retAvgL != null || retAvgS != null ? `<div class="pd-inline-retail-avg">
          ${retAvgL != null && retL != null && retL >= 50 ? `<span class="pd-inline-lbl">Avg L </span><span class="pd-inline-val ${retLUnder ? 'pd-dn' : 'pd-up'}">${retAvgL.toFixed(dec)}${retLUnder ? ' ▼' : ' ▲'}</span>` : ''}
          ${retAvgS != null && retS != null && retS >= 50 ? `<span class="pd-inline-lbl">Avg S </span><span class="pd-inline-val ${retSUnder ? 'pd-dn' : 'pd-up'}">${retAvgS.toFixed(dec)}${retSUnder ? ' ▼' : ' ▲'}</span>` : ''}
        </div>` : ''}
      </div>
    </div>
    </div>
    <div class="pd-inline-footer">${footerSources}</div>`;

  container.querySelectorAll('.fx-tip').forEach(cell => {
    const title = cell.dataset.tipTitle || '';
    const body  = cell.dataset.tipBody  || '';
    const ex    = cell.dataset.tipEx    || '';
    if (!title && !body) return;
    attachRiskTip(cell, title, body, ex);
  });
}

function openPairPopover(rowEl, tvSym) {
  const pop = document.getElementById('pd-popover');
  if (!pop) return;

  if (pop.dataset.sym === tvSym && pop.style.display !== 'none') {
    closePairPopover();
    return;
  }

  pop.dataset.sym = tvSym;

  pop.style.visibility = 'hidden';
  pop.style.display = 'block';
  pop.style.left = '0px';
  pop.style.top  = '0px';

  updatePairDetail(tvSym);

  requestAnimationFrame(() => {
    if (window.innerWidth <= 900) {
      pop.style.left = '';
      pop.style.top  = '';
      pop.style.visibility = 'visible';
      return;
    }

    const rect = rowEl.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    const pw = popRect.width  || 270;
    const ph = popRect.height || 400;
    const vw = window.innerWidth, vh = window.innerHeight;
    const GAP = 6, MARGIN = 8;

    let x = rect.right + GAP;
    if (x + pw > vw - MARGIN) x = rect.left - pw - GAP;
    if (x < MARGIN) x = MARGIN;

    let y = rect.top;
    if (y + ph > vh - MARGIN) y = vh - ph - MARGIN;
    if (y < MARGIN) y = MARGIN;

    pop.style.left = x + 'px';
    pop.style.top  = y + 'px';
    pop.style.visibility = 'visible';
  });
}

function closePairPopover() {
  const pop = document.getElementById('pd-popover');
  if (pop) { pop.style.display = 'none'; pop.dataset.sym = ''; }
}

document.addEventListener('click', e => {
  const pop = document.getElementById('pd-popover');
  if (!pop || pop.style.display === 'none') return;
  if (!pop.contains(e.target)) closePairPopover();
}, true);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePairPopover();
});

document.getElementById('sidebar')?.addEventListener('click', e => {
  const row = e.target.closest('.sb-row[data-sym]');
  if (!row) return;
  loadTVChart(row.dataset.sym);
  toggleSidebarDetail(row);
});

function toggleSidebarDetail(row) {
  if (_giUnifiedPairDetail(row)) return;
  const tvSym  = row.dataset.sym;
  const sidebar = row.closest('#sidebar');
  if (!sidebar) return;

  const existing   = sidebar.querySelector('.sb-expand-row');
  const wasThisRow = existing?.dataset.forSym === tvSym;

  if (existing) {
    const inner = existing.querySelector('.sb-expand-inner');
    if (inner) inner.style.maxHeight = '0';
    setTimeout(() => existing.remove(), 220);
    sidebar.querySelector('.sb-row.sb-selected')?.classList.remove('sb-selected');
  }
  if (wasThisRow) return;

  row.classList.add('sb-selected');

  const expandDiv = document.createElement('div');
  expandDiv.className = 'sb-expand-row';
  expandDiv.dataset.forSym = tvSym;
  const inner = document.createElement('div');
  inner.className = 'sb-expand-inner';
  inner.innerHTML = '<div style="padding:6px 8px;font-size:10px;color:var(--text3);">Loading…</div>';
  expandDiv.appendChild(inner);
  row.after(expandDiv);

  requestAnimationFrame(() => {
    inner.style.maxHeight = '600px'; 
  });

  buildInlineDetail(tvSym, inner);
}

document.getElementById('fx-pairs-tbody')?.addEventListener('click', e => {
  const row = e.target.closest('tr[data-sym]');
  if (!row) return;
  loadTVChart(row.dataset.sym);
  toggleInlineDetail(row);
});

document.querySelectorAll('#cross-asset-grid .ca-cell[data-sym]').forEach(cell => {
  cell.addEventListener('click', function() {
    loadTVChart(this.dataset.sym);
  });
});

document.getElementById('risk-vix')?.closest('.risk-cell')?.addEventListener('click', () => {
  loadTVChart('CBOE:VIX');
});

document.getElementById('risk-move')?.closest('.risk-cell')?.addEventListener('click', () => {
  loadTVChart('TVC:MOVE');
});

document.getElementById('risk-hyoas')?.closest('.risk-cell')?.addEventListener('click', () => {
  loadTVChart('FRED:BAMLH0A0HYM2');
});

document.getElementById('risk-igoas')?.closest('.risk-cell')?.addEventListener('click', () => {
  loadTVChart('FRED:BAMLC0A0CM');
});

const COT_DATA_CACHE = {};   
const RR_DATA_CACHE  = {};   
const BOND_YIELD_CACHE = {}; 

(async function prefetchBondYields() {
  const CCYS = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK'];
  await Promise.all(CCYS.map(async ccy => {
    try {
      const r = await fetch('./extended-data/' + ccy + '.json');
      if (!r.ok) return;
      const j = await r.json();
      const d = j?.data ?? j;
      BOND_YIELD_CACHE[ccy] = {
        y10: d?.bond10y ?? null,
        y2: d?.bond2y ?? null,
        y2Stale: j?.sources?.bond2y === 'stale-cached',
      };
    } catch {}
  }));
})();

(async function prefetchCOT() {
  const CCYS = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD','USD'];
  await Promise.all(CCYS.map(async ccy => {
    try {
      const r = await fetch('./cot-data/' + ccy + '.json');
      if (!r.ok) return;
      const d = await r.json();
      let prevOI = null;
      let wowNetChange = d.wowNetChange ?? null;
      if (Array.isArray(d.history) && d.history.length >= 2) {
        const prev = d.history[d.history.length - 2]; 
        if (prev.levLong != null && prev.levShort != null)
          prevOI = prev.levLong + prev.levShort;
        if (wowNetChange == null && d.netPosition != null) {
          const prevNet = prev.levNet ?? ((prev.levLong || 0) - (prev.levShort || 0));
          wowNetChange = d.netPosition - prevNet;
        }
      }
      const levOI = (d.longPositions || 0) + (d.shortPositions || 0);
      const levNetPctOI = d.levNetPctOI ?? (levOI > 0 ? Math.round(d.netPosition / levOI * 1000) / 10 : null);
      COT_DATA_CACHE[ccy] = {
        net:          d.netPosition    ?? null,
        long:         d.longPositions  ?? null,
        short:        d.shortPositions ?? null,
        amNet:        d.assetManagerNet ?? null,
        weekEnding:   d.weekEnding || d.reportDate || '',
        prevOI,
        wowNetChange,
        totalOI:       d.totalOpenInterest ?? null,
        levNetPctOI,
      };
    } catch {}
  }));
})();

function pairMetaFromSym(tvSym) {
  const raw = tvSym.replace(/^(FX_IDC:|FX:|CAPITALCOM:)/i, '').toLowerCase();
  return PAIRS.find(x => x.id === raw
    || (x.base + x.quote).toLowerCase() === raw
    || (x.quote + x.base).toLowerCase() === raw) || null;
}

async function updatePairDetail(tvSym) {
  const panel = document.getElementById('pd-popover');
  if (!panel) return;

  _fxTTBootstrap();

  const meta   = pairMetaFromSym(tvSym);
  const label  = meta?.label || tvSym.replace(/^.*:/,'').replace(/(.{3})(.{3})/,'$1/$2').toUpperCase();
  const pairId = meta?.id || null;
  const base   = meta?.base  || null;
  const quote  = meta?.quote || null;
  const invert = meta?.invert ?? false;
  const dec    = meta?.dec   ?? 5;

  const rt    = pairId ? STOOQ_RT_CACHE[pairId] : null;
  const price = rt?.close ?? null;
  const pct1d = rt?.pct   ?? null;
  const hv30  = rt?.hv30  ?? null;
  const sessH = rt?.session_high ?? rt?.high ?? null;
  const sessL = rt?.session_low  ?? rt?.low  ?? null;

  let pct1w = null;
  if (rt?.pct1w != null) {
    pct1w = rt.pct1w;
  }

  const CROSS_IV_RHO = {
    'eurgbp':0.65,'eurjpy':0.55,'eurchf':0.60,'eurcad':0.40,'euraud':0.35,'eurnzd':0.30,
    'gbpjpy':0.45,'gbpchf':0.55,'gbpcad':0.30,'gbpaud':0.25,'gbpnzd':0.20,
    'audjpy':0.40,'audnzd':0.55,'audchf':0.30,'audcad':0.50,
    'cadjpy':0.35,'cadchf':0.25,'chfjpy':0.40,
    'nzdjpy':0.35,'nzdcad':0.45,'nzdchf':0.20,
  };
  const USD_IV = {}; 
  let atmIv = null;
  let atmIvRank = null;
  let atmIvSource = null;
  let nzdProxy = false;
  try {
    const intra = await loadIntradayQuotes();
    const etfIv = intra?.fx_etf_iv || {};
    for (const [pid, entry] of Object.entries(etfIv)) {
      if (entry?.iv == null) continue;
      const p = PAIRS.find(x => x.id === pid);
      if (!p) continue;
      const nonUsd = p.base !== 'USD' ? p.base : p.quote;
      USD_IV[nonUsd] = entry.iv;
    }
    if (USD_IV['AUD'] != null && USD_IV['NZD'] == null) {
      USD_IV['NZD'] = Math.round(USD_IV['AUD'] * 1.08 * 10) / 10;
      nzdProxy = true;
    }

    const ivEntry = etfIv[pairId];
    if (ivEntry?.iv != null) {
      atmIv = ivEntry.iv;
      atmIvRank = ivEntry.iv_rank ?? null;
      atmIvSource = ivEntry.source ?? null;
    } else if (pairId && meta?.cross) {
      const ivA = USD_IV[base]  ?? null;
      const ivB = USD_IV[quote] ?? null;
      if (ivA != null && ivB != null) {
        const rho = CROSS_IV_RHO[pairId] ?? 0.40;
        atmIv = Math.round(Math.sqrt(ivA * ivA + ivB * ivB - 2 * rho * ivA * ivB) * 10) / 10;
      }
    }
  } catch {}

  const isCrossPair = !!meta?.cross;
  const cotCcy = base && base !== 'USD' ? base : (quote && quote !== 'USD' ? quote : base);
  const cotRaw = cotCcy ? (COT_DATA_CACHE[cotCcy] || null) : null;
  const cotCcy2 = isCrossPair && quote && quote !== cotCcy ? quote : null;
  const cotRaw2 = cotCcy2 ? (COT_DATA_CACHE[cotCcy2] || null) : null;
  let cotNet = null, cotAmNet = null, cotOI = null, cotPrevOI = null, cotWeek = '';
  let cotWow = null, cotPctOI = null, cotTotalOI = null;
  if (cotRaw) {
    const flip = (invert && cotCcy === quote) ? -1 : 1;
    cotNet      = cotRaw.net   != null ? cotRaw.net   * flip : null;
    cotAmNet    = cotRaw.amNet != null ? cotRaw.amNet * flip : null;
    cotWow      = cotRaw.wowNetChange != null ? cotRaw.wowNetChange * flip : null;
    cotPctOI    = cotRaw.levNetPctOI  != null ? cotRaw.levNetPctOI  * flip : null;
    cotTotalOI  = cotRaw.totalOI      ?? null;
    if (cotRaw.long != null && cotRaw.short != null)
      cotOI = cotRaw.long + cotRaw.short;
    cotPrevOI = cotRaw.prevOI ?? null;
    cotWeek   = cotRaw.weekEnding;
  }
  let cot2Net = null, cot2AmNet = null, cot2Wow = null, cot2PctOI = null, cot2OI = null;
  if (cotRaw2) {
    cot2Net    = cotRaw2.net          ?? null;
    cot2AmNet  = cotRaw2.amNet        ?? null;
    cot2Wow    = cotRaw2.wowNetChange ?? null;
    cot2PctOI  = cotRaw2.levNetPctOI  ?? null;
    if (cotRaw2.long != null && cotRaw2.short != null)
      cot2OI = cotRaw2.long + cotRaw2.short;
    if (!cotWeek && cotRaw2.weekEnding) cotWeek = cotRaw2.weekEnding;
  }

  const [_oisBase,  ]  = (typeof _resolveRate === 'function' && base)  ? _resolveRate(base)  : [null];
  const [_oisQuote, ]  = (typeof _resolveRate === 'function' && quote) ? _resolveRate(quote) : [null];
  const cbBase  = _oisBase  ?? (base  ? (STATE.cbRates?.[base.toLowerCase()]?.rate  ?? null) : null);
  const cbQuote = _oisQuote ?? (quote ? (STATE.cbRates?.[quote.toLowerCase()]?.rate ?? null) : null);
  let carryDiff = null;
  if (cbBase != null && cbQuote != null) {
    if (meta?.cross) {
      carryDiff = cbBase - cbQuote;
    } else {
      carryDiff = invert ? (cbBase - cbQuote) : (cbQuote - cbBase);
    }
  }

  const bondBase  = base  ? (BOND_YIELD_CACHE[base]  || null) : null;
  const bondQuote = quote ? (BOND_YIELD_CACHE[quote] || null) : null;
  let bondTenor = null, bondDiff = null;
  if (bondBase && bondQuote) {
    const pick = (tenor) => (bondBase[tenor] != null && bondQuote[tenor] != null
      && !(tenor === 'y2' && (bondBase.y2Stale || bondQuote.y2Stale)))
      ? bondBase[tenor] - bondQuote[tenor] : null;
    const y2diff = pick('y2');
    if (y2diff != null) {
      bondTenor = '2Y'; bondDiff = y2diff;
    } else {
      const y10diff = pick('y10');
      if (y10diff != null) { bondTenor = '10Y'; bondDiff = y10diff; }
    }
    if (bondDiff != null && meta && !meta.cross) {
      bondDiff = invert ? bondDiff : -bondDiff;
    }
  }

  const fmtPct = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
  const fmtNet = v => v == null ? '—' : (v >= 0 ? '+' : '') + Math.round(v).toLocaleString();
  const cls    = v => v == null ? '' : v > 0 ? 'pd-up' : v < 0 ? 'pd-dn' : '';

  const spreadPips = pairId ? TYPICAL_SPREADS[pairId] : null;

  let adr = null;
  const pipSize = dec === 3 ? 0.01 : 0.0001;
  if (hv30 != null && price != null) {
    adr = Math.round(price * (hv30 / 100) / Math.sqrt(252) / pipSize);
  }
  let adrPct = null;
  if (adr != null && adr > 0 && sessH != null && sessL != null) {
    adrPct = Math.round(((sessH - sessL) / pipSize / adr) * 100);
  }

  const retKey = label.replace('/', '/').toUpperCase();
  const ret = RETAIL_SENTIMENT_CACHE[retKey] || null;
  const retL = ret?.longPct ?? null;
  const retS = ret?.shortPct ?? null;
  const retBarL = retL != null ? retL : 50;

  const rrKey  = pairId ? pairId.toUpperCase() : null;
  const rrVal  = rrKey ? (RR_DATA_CACHE[rrKey]?.rr25d ?? null) : null;
  const rrBase = base || (label.split('/')[0] || '');

  let cotSummaryHtml = '';
  if (isCrossPair && cotCcy2) {
    const parts = [];
    for (const [ccy, net, amNet] of [[cotCcy, cotNet, cotAmNet], [cotCcy2, cot2Net, cot2AmNet]]) {
      if (net == null) continue;
      const lfDir = net > 0 ? 'Long' : net < 0 ? 'Short' : null;
      const amDir = amNet != null ? (amNet > 0 ? 'Long' : amNet < 0 ? 'Short' : null) : null;
      const lfCls = net > 0 ? 'pd-up' : 'pd-dn';
      const amCls = amNet != null ? (amNet > 0 ? 'pd-up' : 'pd-dn') : '';
      const amPart = amDir ? ` · AM <span class="${amCls}">${amDir}</span>` : '';
      const aligned = lfDir && amDir ? (lfDir === amDir ? ' · <span class="pd-dim">aligned</span>' : ' · <span class="pd-dim">diverging</span>') : '';
      if (lfDir) parts.push(`<span class="pd-dim" style="font-size:9px;text-transform:uppercase;letter-spacing:.04em;">${ccy}</span> LF <span class="${lfCls}">${lfDir}</span>${amPart}${aligned}`);
    }
    if (parts.length) cotSummaryHtml = `<div class="pd-cot-summary">${parts.join('<span class="pd-dim"> · </span>')}</div>`;
  } else if (cotNet != null && cotAmNet != null) {
    const lfDir = cotNet > 0 ? 'Long' : cotNet < 0 ? 'Short' : null;
    const amDir = cotAmNet > 0 ? 'Long' : cotAmNet < 0 ? 'Short' : null;
    if (lfDir && amDir) {
      const aligned = lfDir === amDir;
      const lfCls   = cotNet   > 0 ? 'pd-up' : 'pd-dn';
      const amCls   = cotAmNet > 0 ? 'pd-up' : 'pd-dn';
      const alignStr = aligned ? 'aligned' : 'diverging';
      cotSummaryHtml = `<div class="pd-cot-summary">LF <span class="${lfCls}">${lfDir}</span> · AM <span class="${amCls}">${amDir}</span> · <span class="pd-dim">${alignStr}</span></div>`;
    }
  }

  panel.innerHTML = `
    <div class="pd-header">
      <span class="pd-sym">${label}</span>
      <button class="pd-close" onclick="closePairPopover()" aria-label="Close pair detail">&#x2715;</button>
    </div>

    <div class="pd-price-block">
      <div class="pd-price-row">
        <div class="pd-price ${price == null ? 'pd-dim' : ''}">${price != null ? price.toFixed(dec) : '—'}</div>
        <span class="${cls(pct1d)} pd-chg">${fmtPct(pct1d)}</span>
      </div>
      ${sessH != null && sessL != null ? `<div class="pd-range">H ${sessH.toFixed(dec)} · L ${sessL.toFixed(dec)}</div>` : ''}
      <div class="pd-spread-row">${spreadPips != null ? 'Spread ' + spreadPips.toFixed(1) + ' pip' : ''}${spreadPips != null && adr != null ? ' · ' : ''}${adr != null ? 'ADR ' + adr + ' pip' + (adrPct != null ? ' (' + adrPct + '%)' : '') : ''}</div>
    </div>

    <div class="pd-section">
      <div class="pd-section-lbl">Price &amp; Spreads</div>
      <div class="pd-grid">
        <div class="pd-cell fx-tip" data-tip-title="1-Week Change" data-tip-body="Weekly % change vs prior Friday close. Source: FX performance cache."><div class="pd-lbl">1W Chg</div><div class="pd-val ${cls(pct1w)}">${fmtPct(pct1w)}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="Carry Differential" data-tip-body="OIS overnight rate differential (SOFR/€STR/SONIA/TONA/CORRA/SARON — institutional overnight benchmarks). Falls back to CB policy rate when OIS data unavailable. Positive = base currency yields more, carry favours long." data-tip-ex="Positive carry = the long leg earns more than it costs to fund the short. OIS reflects actual overnight funding cost — more accurate than CB policy rate for carry calculations. Carry is most reliable as a persistent trend signal; it can reverse quickly on policy surprises."><div class="pd-lbl">Carry</div><div class="pd-val ${cls(carryDiff)}">${carryDiff != null ? (carryDiff >= 0 ? '+' : '') + carryDiff.toFixed(2)+'%' : '—'}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="${bondTenor || '2Y'} Sovereign Bond Spread" data-tip-body="ΔY = Yield(${base || 'base'}) − Yield(${quote || 'quote'}) at the ${bondTenor || '2Y'} tenor. Short-end (2Y) yield differentials are the primary driver of sustained FX direction — they track near-term rate-expectations divergence more closely than 10Y, which reflects longer-run growth/inflation premia and duration flows.${bondTenor === '10Y' ? ' 2Y unavailable for one or both legs — showing 10Y as fallback.' : ''} Source: extended-data sovereign yield pipeline (FRED/ECB/BOE/BOC/SNB/DBnomics)." data-tip-ex="A rising ${bondTenor || '2Y'} spread in the base currency's favour has historically preceded sustained appreciation — it signals the market pricing in a widening policy-rate gap before central banks act."><div class="pd-lbl">${bondTenor || '2Y'} Spread</div><div class="pd-val ${cls(bondDiff)}">${bondDiff != null ? (bondDiff >= 0 ? '+' : '') + (bondDiff * 100).toFixed(0)+' bp' : '—'}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="Average Daily Range" data-tip-body="Estimated average daily range in pips, derived from HV 30d: close × (HV / √252). Also shows % of ADR already covered by today's session range (H−L) — useful for stop/target sizing and gauging how much of the day's typical move is left." data-tip-ex="ADR of 85 pip (62%) on EUR/USD means the pair moves ~85 pip on an average day, and today's range has already covered 62% of that."><div class="pd-lbl">ADR</div><div class="pd-val ${adrPct != null && adrPct >= 100 ? 'pd-dn' : ''}">${adr != null ? adr + ' pip' : '—'}${adrPct != null ? ` <span style="color:var(--text3);font-size:9px;">(${adrPct}%)</span>` : ''}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="${base || 'Base'} Policy Rate" data-tip-body="${base || 'Base'} central bank policy rate (annualised). Source: CB rates cache."><div class="pd-lbl">${base || 'Base'} Rate</div><div class="pd-val">${cbBase != null ? cbBase.toFixed(2)+'%' : '—'}</div></div>
      </div>
    </div>

    <div class="pd-section">
      <div class="pd-section-lbl">Volatility</div>
      <div class="pd-grid">
        <div class="pd-cell fx-tip" data-tip-title="Historical Volatility 30d" data-tip-body="30-day realised (historical) volatility, annualised. Measures how much the pair has actually moved recently. Low HV = quiet market; high HV = volatile market. No 52-week percentile is computed for realised vol, so color uses a fixed band: green ≤7% (quiet), red >12% (volatile). Not a directional signal."><div class="pd-lbl">HV 30d</div><div class="pd-val ${hv30 != null ? (hv30 > 12 ? 'pd-dn' : hv30 > 7 ? '' : 'pd-up') : ''}">${hv30 != null ? hv30.toFixed(1)+'%' : '—'}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="ATM Implied Volatility${(meta?.cross || nzdProxy) && atmIv != null ? ' (estimated)' : ''}" data-tip-body="${meta?.cross && atmIv != null ? 'Synthesised from component USD-pair implied vol values via triangulation: √(IVa²+IVb²−2ρ·IVa·IVb). Proxy for OTC interbank IV — indicative only.' : nzdProxy && atmIv != null ? 'Estimated from AUD/USD resolved implied vol × 1.08 (long-run NZD/AUD realised vol ratio), used only when the PHLX World Currency Options index (^XDZ) is unavailable. Treat as directional context only.' : `ATM (at-the-money) implied volatility — annualised, same variance-swap methodology as VIX where an exchange-computed index is available. Source: ${_ivSourceLabel(atmIvSource)}.` } ${atmIvRank != null ? 'Color = IV Rank vs 52-week range: green rank&lt;30 (historically cheap), red rank&gt;70 (historically expensive).' : 'Color = cost of hedging: green ≤7% (cheap), red >12% (expensive) — fixed band; IV Rank not available for this pair (synthesised/proxy or &lt;4 weeks history).'} Not a directional signal."><div class="pd-lbl">ATM IV${(meta?.cross || nzdProxy) && atmIv != null ? '<span style="font-size:8px;color:var(--text3);margin-left:2px;">~</span>' : ''}</div><div class="pd-val ${atmIv != null ? (atmIvRank != null ? (atmIvRank > 70 ? 'pd-dn' : atmIvRank < 30 ? 'pd-up' : '') : (atmIv > 12 ? 'pd-dn' : atmIv > 7 ? '' : 'pd-up')) : ''}">${atmIv != null ? atmIv.toFixed(1)+'%' : '—'}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="IV minus HV" data-tip-body="Implied vol minus realised vol — the volatility risk premium (VRP). Positive = options are expensive relative to recent moves (market pricing in a premium). Negative = options are cheap vs realised. IV running above HV is the market's normal state, since option sellers demand a premium — a negative spread is comparatively rare. Not a directional signal." data-tip-ex="IV−HV > +3% historically indicates options are pricing in a premium above recent realised moves — hedging costs are elevated relative to actual market movement. A persistently negative VRP (rare) has historically preceded vol-expansion events, as it signals options are underpricing risk relative to what's actually happening."><div class="pd-lbl">IV − HV</div><div class="pd-val ${atmIv != null && hv30 != null ? cls(hv30 - atmIv) : ''}">${atmIv != null && hv30 != null ? (atmIv > hv30 ? '+' : '') + (atmIv - hv30).toFixed(1)+'%' : '—'}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="25-delta Risk Reversal (1M) · Saxo Bank" data-tip-body="25d RR = 25d call IV minus 25d put IV. Positive = calls bid over puts — market skewed for upside on ${rrBase}. Negative = puts bid — downside protection dominant. Source: Saxo Bank public options page, 1M tenor, indicative mid-market. Updated during European hours." data-tip-ex="RR is a directional skew signal, not a vol-level signal. A strongly negative RR alongside high ATM IV = market pricing in both expensive hedging AND downside risk — historically a high-conviction bearish setup."><div class="pd-lbl">25d RR</div><div class="pd-val ${rrVal != null ? cls(rrVal) : ''}">${rrVal != null ? (rrVal >= 0 ? '+' : '') + rrVal.toFixed(2) : '—'}</div></div>
        <div class="pd-cell fx-tip" data-tip-title="Bid-Ask Spread" data-tip-body="Estimated interbank ECN spread in pips. Dynamically adjusted for current volatility conditions — wider during high-vol sessions and around news events. Lower spread = more liquid." data-tip-ex="EUR/USD typically trades 0.1–0.3 pip during London/NY overlap. Spreads widen significantly in the Asian session and around data releases."><div class="pd-lbl">Spread</div><div class="pd-val">${spreadPips != null ? spreadPips.toFixed(1) + ' pip' : '—'}</div></div>
      </div>
    </div>

    <div class="pd-section">
      ${isCrossPair ? '' : '<div class="pd-section-lbl">COT Positioning</div>'}
      ${(() => {
        const cotBlockGrid = (ccy, net, wow, amNet, pctOI, oi, prevOI, isCross, addTopBorder) => {
          const crossNote = isCross ? ` CFTC tracks ${ccy} futures vs USD — not this cross specifically. Use as ${ccy} sentiment proxy.` : '';
          const oiDelta    = (prevOI != null && oi != null) ? oi - prevOI : null;
          const oiArrow    = oiDelta == null ? '' : oiDelta > 0 ? '<span class="pd-oi-up">▲</span> ' : oiDelta < 0 ? '<span class="pd-oi-dn">▼</span> ' : '';
          const oiDeltaStr = oiDelta == null ? '' : ` <span class="pd-dim" style="font-size:9px;">(${oiDelta > 0 ? '+' : ''}${Math.round(oiDelta).toLocaleString()})</span>`;
          return `
            ${isCross ? `<div class="pd-cell pd-cell--wide pd-section-lbl" style="${addTopBorder ? 'border-top:1px solid var(--border);margin-top:2px;' : ''}">COT ${ccy}</div>` : ''}
            <div class="pd-cell fx-tip"
              data-tip-title="CFTC Leveraged Funds Net${isCross ? ` · ${ccy}` : ''}"
              data-tip-body="Net contracts (longs minus shorts) held by Leveraged Funds — hedge funds and CTAs. Speculative / trend-following positioning. Source: CFTC TFF report.${crossNote}"
              data-tip-ex="Extreme LF net long positioning has historically preceded reversals as the speculative crowd becomes crowded.">
              <div class="pd-lbl">LF Net</div>
              <div class="pd-val ${cls(net)}">${fmtNet(net)}</div>
            </div>
            <div class="pd-cell fx-tip"
              data-tip-title="LF WoW Change${isCross ? ` · ${ccy}` : ''}"
              data-tip-body="Week-over-week change in Leveraged Funds net contracts. Positive = specs adding longs or covering shorts. Negative = specs adding shorts or reducing longs. The primary momentum signal in institutional COT analysis.${crossNote}"
              data-tip-ex="A large positive WoW change alongside rising net = conviction build-up. A reversal in WoW change is often the earliest signal of a positioning shift.">
              <div class="pd-lbl">LF WoW Δ</div>
              <div class="pd-val ${cls(wow)}">${wow != null ? (wow > 0 ? '+' : '') + Math.round(wow).toLocaleString() : '—'}</div>
            </div>
            <div class="pd-cell fx-tip"
              data-tip-title="CFTC Asset Managers Net${isCross ? ` · ${ccy}` : ''}"
              data-tip-body="Net contracts held by Asset Managers — pension funds, mutual funds, and institutional investors. Structural / longer-term positioning. Source: CFTC TFF report.${crossNote}"
              data-tip-ex="AM positioning tends to be more persistent than LF. Divergence between LF and AM can signal a positioning squeeze.">
              <div class="pd-lbl">AM Net</div>
              <div class="pd-val ${cls(amNet)}">${fmtNet(amNet)}</div>
            </div>
            <div class="pd-cell fx-tip"
              data-tip-title="LF Net as % of Total OI${isCross ? ` · ${ccy}` : ''}"
              data-tip-body="LF net contracts divided by LF Open Interest (long + short). Normalises positioning across currencies — EUR and JPY have very different raw contract counts; this makes them directly comparable.${crossNote}"
              data-tip-ex="+15% means Leveraged Funds hold a net long equivalent to 15% of the entire market's open interest — a heavily crowded position historically associated with reversal risk.">
              <div class="pd-lbl">Net % OI</div>
              <div class="pd-val ${cls(pctOI)}">${pctOI != null ? (pctOI > 0 ? '+' : '') + pctOI.toFixed(1) + '%' : '—'}</div>
            </div>
            ${oi != null ? `<div class="pd-cell pd-cell--wide fx-tip" style="${isCross ? '' : 'border-bottom:none;'}"
              data-tip-title="LF Open Interest${isCross ? ` · ${ccy}` : ''}"
              data-tip-body="Total open interest in the Leveraged Funds category: long + short contracts. Rising OI = new money entering; falling OI = positions closing. Source: CFTC TFF report.${crossNote}"
              data-tip-ex="${oiDelta != null ? `This week: ${oiDelta > 0 ? '▲' : oiDelta < 0 ? '▼' : '='} ${Math.abs(Math.round(oiDelta)).toLocaleString()} vs prior week. ${oiDelta > 0 ? 'New money entering — expanding participation.' : 'Positions being closed — shrinking participation.'}` : 'Expanding OI alongside rising net long = conviction build-up. Falling OI alongside persistent net = position unwinding.'}">
              <div class="pd-lbl">LF Open Interest</div>
              <div class="pd-val">${oiArrow}${Math.round(oi).toLocaleString()}${oiDeltaStr}</div>
            </div>` : ''}`;
        };

        const gridHtml = isCrossPair && cotCcy2 && cotRaw2
          ? cotBlockGrid(cotCcy, cotNet, cotWow, cotAmNet, cotPctOI, cotOI, cotPrevOI, true, false) +
            cotBlockGrid(cotCcy2, cot2Net, cot2Wow, cot2AmNet, cot2PctOI, null, null, true, true)
          : cotBlockGrid(cotCcy, cotNet, cotWow, cotAmNet, cotPctOI, cotOI, cotPrevOI, false, false);

        return `<div class="pd-grid">${gridHtml}</div>`;
      })()}
      ${cotSummaryHtml}
    </div>

    <div class="pd-section pd-section--last">
      <div class="pd-section-lbl">Retail Sentiment</div>
      <div class="pd-cell pd-cell--wide fx-tip" data-tip-title="Retail Client Positioning" data-tip-body="Long/short ratio from Myfxbook community outlook — retail traders only, not institutional. Contrarian indicator: extreme retail long bias historically aligns with institutional short positioning. Source: Myfxbook, updated every hour." data-tip-ex="Extreme readings — above 70% long or below 30% long — have historically coincided with elevated positioning risk in the dominant direction. Retail extremes are one input among many; always cross-reference with COT and CB differential data.">
        <div class="pd-retail-bar"><div class="pd-retail-fill" style="width:${retBarL}%"></div></div>
        <div class="pd-retail-nums">${retL != null ? retL+'% L' : '—'}<span class="pd-retail-sep">/</span>${retS != null ? retS+'% S' : '—'}</div>
      </div>
    </div>

    <div class="pd-footer">
      ${cotWeek ? '<span class="pd-dim">COT ' + cotWeek + ' · Myfxbook' + (rrVal != null ? ' · Saxo RR' : '') + '</span>' : '<span class="pd-dim">Myfxbook' + (rrVal != null ? ' · Saxo RR' : '') + '</span>'}
    </div>`;

  if (window._fxTTPos) {
    panel.querySelectorAll('.fx-tip').forEach(cell => {
      const title = cell.dataset.tipTitle || '';
      const body  = cell.dataset.tipBody  || '';
      const ex    = cell.dataset.tipEx    || '';
      if (!title && !body) return;
      cell.addEventListener('mouseenter', ev => {
        const tt = document.getElementById('fx-tt');
        if (!tt) return;
        document.getElementById('fx-tt-title').textContent = title;
        document.getElementById('fx-tt-body').textContent  = body;
        const exEl = document.getElementById('fx-tt-ex');
        if (ex) { exEl.textContent = ex; exEl.style.display = 'block'; }
        else    { exEl.textContent = ''; exEl.style.display = 'none';  }
        tt.style.display = 'block';
        requestAnimationFrame(() => window._fxTTPos(ev.clientX, ev.clientY));
      });
      cell.addEventListener('mouseleave', () => {
        const tt = document.getElementById('fx-tt');
        if (tt) tt.style.display = 'none';
      });
    });
  }
}

document.querySelectorAll('.tv-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    loadTVChart(this.dataset.sym);
  });
});

function minimizeTVLegend() {
  const wrap = document.getElementById('tv-chart-wrap');
  if (!wrap) return;
  const iframe = wrap.querySelector('iframe');
  if (!iframe) return;
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;
    const btns = doc.querySelectorAll(
      '[data-name="legend-source-item"] button[aria-label], ' +
      '.legendItemControls button, ' +
      '[class*="minimizeButton"], ' +
      '[class*="collapseButton"]'
    );
    btns.forEach(btn => { try { btn.click(); } catch(_){} });
  } catch(_) {
  }
}
setTimeout(minimizeTVLegend, 4000);

(function() {
  function addWheelScroll(el) {
    if (!el) return;
    el.addEventListener('wheel', function(e) {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }, { passive: false });
  }
  addWheelScroll(document.getElementById('tv-pair-tabs'));
  addWheelScroll(document.getElementById('tv-ticker'));
  addWheelScroll(document.getElementById('quotebar-inner'));

  const tabs   = document.getElementById('tv-pair-tabs');
  const btnPrev = document.getElementById('tv-tabs-prev');
  const btnNext = document.getElementById('tv-tabs-next');
  function updateTabArrows() {
    if (!tabs || !btnPrev || !btnNext) return;
    const atStart = tabs.scrollLeft <= 2;
    const atEnd   = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 2;
    btnPrev.style.display = atStart ? 'none' : 'flex';
    btnNext.style.display = atEnd   ? 'none' : 'flex';
  }
  if (tabs) {
    tabs.addEventListener('scroll', updateTabArrows, { passive: true });
    setTimeout(updateTabArrows, 200);
  }

  const ticker   = document.getElementById('tv-ticker');
  const qbPrev   = document.getElementById('qb-prev');
  const qbNext   = document.getElementById('qb-next');
  function updateQbArrows() {
    if (!ticker || !qbPrev || !qbNext) return;
    const atStart = ticker.scrollLeft <= 2;
    const atEnd   = ticker.scrollLeft + ticker.clientWidth >= ticker.scrollWidth - 2;
    qbPrev.style.display = atStart ? 'none' : 'flex';
    qbNext.style.display = atEnd   ? 'none' : 'flex';
  }
  if (ticker) {
    ticker.addEventListener('scroll', updateQbArrows, { passive: true });
    setTimeout(updateQbArrows, 400);
  }

  if (btnPrev) btnPrev.addEventListener('click', () => tabs  && tabs.scrollBy({left: -200, behavior: 'smooth'}));
  if (btnNext) btnNext.addEventListener('click', () => tabs  && tabs.scrollBy({left:  200, behavior: 'smooth'}));
  if (qbPrev)  qbPrev.addEventListener('click',  () => ticker && ticker.scrollBy({left: -200, behavior: 'smooth'}));
  if (qbNext)  qbNext.addEventListener('click',  () => ticker && ticker.scrollBy({left:  200, behavior: 'smooth'}));
})();

document.querySelectorAll('.top-nav a').forEach(a => {
  a.addEventListener('click', function() {
    document.querySelectorAll('.top-nav a').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
  });
});

async function fetchCarryRanking() {
  const G8 = ['USD','EUR','GBP','JPY','AUD','CHF','CAD','NZD','NOK','SEK'];

  function pairId(a, b) {
    const HV30_PAIRS = new Set([
      'eurusd','gbpusd','usdjpy','audusd','usdchf','usdcad','nzdusd',
      'usdnok','usdsek','eurnok','eursek',
      'eurgbp','eurjpy','eurchf','eurcad','euraud',
      'gbpjpy','gbpchf','gbpcad',
      'audjpy','audnzd','audchf',
      'cadjpy','chfjpy','nzdjpy',
      'eurnzd','gbpaud','gbpnzd','audcad','cadchf','nzdcad','nzdchf',
    ]);
    const c1 = (a + b).toLowerCase();
    const c2 = (b + a).toLowerCase();
    if (HV30_PAIRS.has(c1)) return c1;
    if (HV30_PAIRS.has(c2)) return c2;
    return a < b ? c1 : c2;
  }

  const container = document.getElementById('carry-rank-rows');
  if (!container) return;

  try {
    const cbRates = {};
    await Promise.all(G8.map(async ccy => {
      const cached = STATE.cbRates?.[ccy.toLowerCase()];
      if (cached?.rate != null) { cbRates[ccy] = cached.rate; return; }
      try {
        const r = await fetch('./rates/' + ccy + '.json', { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (d.observations?.[0]?.value) cbRates[ccy] = parseFloat(d.observations[0].value);
      } catch {}
    }));

    if (Object.keys(cbRates).length < 4) {
      container.innerHTML = '<div style="padding:6px 8px;font-size:10px;color:var(--text3);">Rate data unavailable</div>';
      return;
    }

    const oisCache = window._OIS_RATES_CACHE || {};
    const oisSrcs  = window._OIS_RATE_SOURCES || {};
    let oisData = null;
    if (Object.keys(oisCache).length === 0) {
      try {
        const or = await fetch('./ois-rates/rates.json', { cache: 'no-store' });
        if (or.ok) oisData = await or.json();
      } catch {}
    }
    const rates       = {};
    const rateSource  = {}; 
    for (const ccy of G8) {
      const ois = oisCache[ccy] ?? oisData?.rates?.[ccy] ?? null;
      const src = oisSrcs[ccy]  ?? oisData?.sources?.[ccy] ?? null;
      if (ois != null) {
        rates[ccy]      = ois;
        rateSource[ccy] = src || 'OIS';
      } else if (cbRates[ccy] != null) {
        rates[ccy]      = cbRates[ccy];
        rateSource[ccy] = 'policy';
      }
    }

    const intra = await loadIntradayQuotes().catch(() => null);
    const hv30Map = {};
    if (intra?.hv30) Object.assign(hv30Map, intra.hv30);
    for (const [id, entry] of Object.entries(STOOQ_RT_CACHE)) {
      if (entry?.hv30 != null && hv30Map[id] == null) hv30Map[id] = entry.hv30;
    }

    const inflExp = {};
    await Promise.all(G8.map(async ccy => {
      if (typeof _rcmData !== 'undefined' && _rcmData?.inflExp?.[ccy]?.val != null) {
        inflExp[ccy] = _rcmData.inflExp[ccy].val;
        return;
      }
      try {
        const r = await fetch('./extended-data/' + ccy + '.json');
        if (!r.ok) return;
        const d = await r.json();
        const ie = d?.data?.inflationExpectations;
        if (ie != null && ie > -5 && ie < 20) inflExp[ccy] = ie; 
      } catch {}
    }));

    const allPairs = [];
    for (let i = 0; i < G8.length; i++) {
      for (let j = i + 1; j < G8.length; j++) {
        const a = G8[i], b = G8[j];
        const rA = rates[a] ?? null, rB = rates[b] ?? null;
        if (rA == null || rB == null) continue;

        const diff   = rA - rB;
        const long   = diff >= 0 ? a : b;
        const short  = diff >= 0 ? b : a;
        const rLong  = diff >= 0 ? rA : rB;
        const rShort = diff >= 0 ? rB : rA;
        const srcLong  = rateSource[long]  || 'OIS';
        const srcShort = rateSource[short] || 'OIS';
        const absDiff = Math.abs(diff);

        const pid  = pairId(long, short);
        const hv30 = hv30Map[pid] ?? null;

        const ieLong  = inflExp[long]  ?? null;
        const ieShort = inflExp[short] ?? null;
        const realCarry = (ieLong != null && ieShort != null)
          ? parseFloat((absDiff - (ieLong - ieShort)).toFixed(3))
          : null;

        const carryVol = (hv30 != null && hv30 > 0)
          ? (realCarry != null ? Math.abs(realCarry) : absDiff) / hv30
          : null;

        allPairs.push({ long, short, diff: absDiff, rLong, rShort, hv30, carryVol, realCarry, pid });
      }
    }

    const hasRealCarryData = allPairs.some(p => p.realCarry != null);

    _carryRankPairsCache = allPairs;
    _initCarryRankToggle();

    const headSpan = document.getElementById('carry-rank-subtitle');
    if (headSpan) {
      headSpan.textContent = hasRealCarryData
        ? 'G10 · real carry · annualised'
        : 'G10 · CB rate differential';
    }

    const sbHead = container.closest('.sb-section')?.querySelector('.sb-head');
    if (sbHead && !sbHead._carryTipAttached) {
      sbHead._carryTipAttached = true;
      sbHead.style.cursor = 'help';

      sbHead.addEventListener('mouseenter', ev => {
        const tt = document.getElementById('fx-tt');
        if (!tt) return;
        const { title, body, ex } = _carryTooltipContent();
        document.getElementById('fx-tt-title').textContent = title;
        document.getElementById('fx-tt-body').textContent  = body;
        const exEl = document.getElementById('fx-tt-ex');
        exEl.textContent = ex; exEl.style.display = 'block';
        tt.style.display = 'block';
        requestAnimationFrame(() => window._fxTTPos && window._fxTTPos(ev.clientX, ev.clientY));
      });
      sbHead.addEventListener('mouseleave', () => {
        const tt = document.getElementById('fx-tt');
        if (tt) tt.style.display = 'none';
      });
    }
    _carryRankHasRealData = hasRealCarryData;

    _renderCarryRankRows(_carryRankMode);

  } catch(e) {
    console.warn('[CarryRanking]', e);
    if (container) container.innerHTML = '<div style="padding:6px 8px;font-size:10px;color:var(--text3);">Unavailable</div>';
  }
}

function _carryTVSymbol(long, short) {
  if (short === 'USD') return 'FX_IDC:' + long + 'USD';
  if (long  === 'USD') return 'FX_IDC:USD' + short;
  return 'FX_IDC:' + long + short;
}

let _carryRankMode = 'carry';
let _carryRankPairsCache = null;
let _carryRankHasRealData = false;

function _carryTooltipContent() {
  if (!_carryRankHasRealData) {
    return {
      title: 'CB Rate Differential',
      body: 'CB policy rate differential (%) between the long and short leg. Real carry ranking requires inflation expectations data (unavailable). Click any row for real rate analysis.',
      ex: 'Example: AUD 4.35% − CHF 0.00% = +4.35% gross nominal differential.',
    };
  }
  if (_carryRankMode === 'carryVol') {
    return {
      title: 'Carry-to-Vol Ranking',
      body: 'Real carry ÷ HV30 — carry earned per unit of realized volatility, not the raw differential. Favors pairs that compensate for risk rather than just the highest spread; standard screening lens for institutional carry baskets. Toggle to Carry for the raw ranking.',
      ex: 'Example: NOK/EUR real carry ≈ +1.5% ÷ HV30 3.8% = 0.39 carry-to-vol. Higher = more carry earned per unit of realized risk.',
    };
  }
  return {
    title: 'Real Carry Ranking',
    body: 'Ranked by real carry: nominal OIS rate differential minus the inflation expectations differential between the two legs (= real rate long − real rate short). Toggle to Carry/Vol to scale the same ranking by HV30 risk instead. Industry standard per Bloomberg FXFR.',
    ex: 'Example: GBP/CHF nominal +3.77% − (BoE infl.exp 3.45% − SNB infl.exp 0.31%) = real carry +0.63%. Positive = long leg earns positive real carry after purchasing power adjustment.',
  };
}

function _renderCarryRankRows(mode) {
  const container = document.getElementById('carry-rank-rows');
  if (!container) return;
  const pairs = _carryRankPairsCache;
  if (!pairs || !pairs.length) return;

  const hasRealCarryData = pairs.some(p => p.realCarry != null);
  const hasVolData = pairs.some(p => p.carryVol != null);

  let top = pairs.slice();
  let hiddenNoVol = 0;
  if (mode === 'carryVol' && hasVolData) {
    const before = top.length;
    top = top.filter(p => p.carryVol != null);
    hiddenNoVol = before - top.length;
    top.sort((a, b) => (b.carryVol ?? -Infinity) - (a.carryVol ?? -Infinity));
  } else {
    top.sort((a, b) => {
      if (hasRealCarryData) {
        const cipA = a.realCarry ?? -Infinity;
        const cipB = b.realCarry ?? -Infinity;
        if (Math.abs(cipB - cipA) > 0.001) return cipB - cipA;
      }
      if (hasVolData) {
        const cvA = a.carryVol ?? -Infinity;
        const cvB = b.carryVol ?? -Infinity;
        return cvB - cvA;
      }
      return b.diff - a.diff;
    });
  }

  const btnCarry = document.getElementById('carry-mode-carry');
  const btnCV = document.getElementById('carry-mode-carryvol');
  if (btnCarry && btnCV) {
    const cvActive = mode === 'carryVol';
    btnCarry.setAttribute('aria-selected', cvActive ? 'false' : 'true');
    btnCV.setAttribute('aria-selected', cvActive ? 'true' : 'false');
    btnCarry.style.color = cvActive ? 'var(--text3)' : '#fff';
    btnCV.style.color = cvActive ? '#fff' : 'var(--text3)';
    btnCarry.classList.toggle('active', !cvActive);
    btnCV.classList.toggle('active', cvActive);
  }

  const headerEl = document.getElementById('carry-rank-header');
  if (headerEl) {
    const hdrCell = (txt, tip, align) => `<span class="pd-section-lbl" style="padding:0;${align ? 'text-align:' + align + ';' : ''}" title="${tip}">${txt}</span>`;
    headerEl.innerHTML = mode === 'carryVol'
      ? hdrCell('#', 'Rank by carry-to-vol') + hdrCell('PAIR', 'Long/Short leg') + hdrCell('HV30', '30-day historical volatility (annualised) of the pair — the risk denominator') + '<span></span>' + hdrCell('C/VOL', 'Real carry \u00f7 HV30 \u2014 carry earned per unit of realized volatility. >1 = carry compensates well for the pair\u2019s risk \u00b7 <0 = negative real carry despite the nominal spread', 'right')
      : hdrCell('#', 'Rank by real carry') + hdrCell('PAIR', 'Long/Short leg') + hdrCell('SPREAD', 'Gross nominal OIS/policy rate differential between the two legs') + '<span></span>' + hdrCell('CARRY', 'Real carry: nominal differential minus the inflation-expectations differential between the two legs', 'right');
  }

  const footEl = document.getElementById('carry-rank-footnote');
  if (footEl) {
    if (mode === 'carryVol' && hiddenNoVol > 0) {
      footEl.textContent = `${hiddenNoVol} pair${hiddenNoVol === 1 ? '' : 's'} hidden \u2014 no HV30 data available`;
      footEl.style.display = 'block';
    } else {
      footEl.style.display = 'none';
    }
  }

  if (mode === 'carryVol') {
    const cvDisplay = top.map(p => Math.max(p.carryVol ?? 0, 0));
    const maxCV = Math.max(...cvDisplay, 0.01);

    container.innerHTML = top.map((p, idx) => {
      const sym = _carryTVSymbol(p.long, p.short);
      const hvStr = p.hv30 != null ? p.hv30.toFixed(1) + '%' : 'n/a';
      const cv = p.carryVol;
      const cvStr = cv != null ? cv.toFixed(2) : '—';
      const barPct = cv != null ? Math.max(Math.round((Math.max(cv, 0) / maxCV) * 100), 4) : 4;
      const cls = cv != null ? (cv >= 1 ? 'pd-up' : cv < 0 ? 'down' : 'pd-dim') : 'pd-dim';
      const barBg = cv != null && cv < 0 ? 'var(--down)' : 'var(--up)';
      const realStr = p.realCarry != null ? (p.realCarry >= 0 ? '+' : '') + p.realCarry.toFixed(2) + '%' : '—';
      const tip = `${p.long}/${p.short} · Carry/Vol ${cvStr} · Real carry ${realStr} · HV30 ${hvStr} — carry earned per unit of realized volatility · Click for real rate analysis`;
      return `<div class="carry-rank-row" data-long="${p.long}" data-short="${p.short}" data-sym="${sym}" title="${tip}">
        <span class="cr-rank">${idx + 1}</span>
        <span class="cr-pair">${p.long}/${p.short}</span>
        <span class="cr-spread">${hvStr}</span>
        <div class="cr-bar-wrap"><div class="cr-bar" style="width:${barPct}%;background:${barBg};"></div></div>
        <span class="cr-diff ${cls}">${cvStr}</span>
      </div>`;
    }).join('');
  } else {
    const topDisplay = top.map(p => Math.max(p.realCarry ?? p.diff, 0));
    const maxDisplay = Math.max(...topDisplay, 0.01);

    container.innerHTML = top.map((p, idx) => {
      const sym = _carryTVSymbol(p.long, p.short);
      const spreadLabel = '+' + p.diff.toFixed(2) + '%';
      const realCarryVal = p.realCarry;
      const displayVal = realCarryVal != null
        ? (realCarryVal >= 0 ? '+' : '') + realCarryVal.toFixed(2)
        : '+' + p.diff.toFixed(2);
      const barRaw = realCarryVal != null ? Math.max(realCarryVal, 0) : p.diff;
      const barPct = Math.max(Math.round((barRaw / maxDisplay) * 100), 4);
      const cls = realCarryVal != null
        ? (realCarryVal >= 0.5 ? 'pd-up' : realCarryVal <= -0.1 ? 'pd-dim' : '')
        : (p.diff > 2 ? 'pd-up' : p.diff > 0.5 ? '' : 'pd-dim');
      const realStr = realCarryVal != null ? (realCarryVal >= 0 ? '+' : '') + realCarryVal.toFixed(2) + '%' : '—';
      const hvStr   = p.hv30 != null ? p.hv30.toFixed(1) + '%' : 'n/a';
      const tip = `${p.long}/${p.short} · Nominal ${spreadLabel} · Real carry ${realStr} · HV30 ${hvStr} — Click for real rate analysis`;
      return `<div class="carry-rank-row" data-long="${p.long}" data-short="${p.short}" data-sym="${sym}" title="${tip}">
        <span class="cr-rank">${idx + 1}</span>
        <span class="cr-pair">${p.long}/${p.short}</span>
        <span class="cr-spread">${spreadLabel}</span>
        <div class="cr-bar-wrap"><div class="cr-bar" style="width:${barPct}%"></div></div>
        <span class="cr-diff ${cls}">${displayVal}</span>
      </div>`;
    }).join('');
  }

  container.querySelectorAll('.carry-rank-row[data-long]').forEach(row => {
    row.addEventListener('click', () => {
      const longCcy  = row.dataset.long;
      const shortCcy = row.dataset.short;
      if (typeof window.openRealCarryModal === 'function') {
        window.openRealCarryModal(longCcy, shortCcy);
      } else {
        loadTVChart(row.dataset.sym);
      }
    });
  });
}

function _initCarryRankToggle() {
  const btnCarry = document.getElementById('carry-mode-carry');
  const btnCV = document.getElementById('carry-mode-carryvol');
  if (!btnCarry || !btnCV || btnCarry._carryToggleWired) return;
  btnCarry._carryToggleWired = true;
  btnCV._carryToggleWired = true;
  btnCarry.addEventListener('click', () => { _carryRankMode = 'carry'; _renderCarryRankRows('carry'); });
  btnCV.addEventListener('click', () => { _carryRankMode = 'carryVol'; _renderCarryRankRows('carryVol'); });
}

async function fetchVolLeaderboard() {
  const container = document.getElementById('vol-leaderboard-rows');
  if (!container) return;

  const CROSS_IV_RHO = {
    'eurgbp':0.65,'eurjpy':0.55,'eurchf':0.60,'eurcad':0.40,'euraud':0.35,'eurnzd':0.30,
    'gbpjpy':0.45,'gbpchf':0.55,'gbpcad':0.30,'gbpaud':0.25,'gbpnzd':0.20,
    'audjpy':0.40,'audnzd':0.55,'audchf':0.30,'audcad':0.50,
    'cadjpy':0.35,'cadchf':0.25,'chfjpy':0.40,'nzdjpy':0.35,'nzdcad':0.45,'nzdchf':0.20,
  };

  try {
    const intra = await loadIntradayQuotes();
    const etfIv = intra?.fx_etf_iv || {};

    const USD_IV = {};
    for (const [pid, entry] of Object.entries(etfIv)) {
      if (entry?.iv == null) continue;
      const p = PAIRS.find(x => x.id === pid);
      if (!p) continue;
      const nonUsd = p.base !== 'USD' ? p.base : p.quote;
      USD_IV[nonUsd] = entry.iv;
    }
    if (USD_IV['AUD'] != null && USD_IV['NZD'] == null) USD_IV['NZD'] = Math.round(USD_IV['AUD'] * 1.08 * 10) / 10;

    const rows = [];
    for (const p of PAIRS) {
      const ivEntry = etfIv[p.id];
      let atmIv = null, ivRank = null, estimated = false;
      if (ivEntry?.iv != null) {
        atmIv = ivEntry.iv;
        ivRank = ivEntry.iv_rank ?? null;
      } else if (p.cross) {
        const ivA = USD_IV[p.base] ?? null, ivB = USD_IV[p.quote] ?? null;
        if (ivA != null && ivB != null) {
          const rho = CROSS_IV_RHO[p.id] ?? 0.40;
          atmIv = Math.round(Math.sqrt(ivA * ivA + ivB * ivB - 2 * rho * ivA * ivB) * 10) / 10;
          estimated = true;
        }
      }
      if (atmIv == null) continue;
      const label = p.label || (p.id.slice(0, 3).toUpperCase() + '/' + p.id.slice(3).toUpperCase());
      rows.push({ id: p.id, label, atmIv, ivRank, estimated });
    }

    if (!rows.length) {
      container.innerHTML = '<div style="padding:6px 8px;font-size:10px;color:var(--text3);">Vol data unavailable</div>';
      return;
    }

    rows.sort((a, b) => b.atmIv - a.atmIv);
    const top = rows.slice(0, 5);
    _volLbTopCache = top; 

    const sbHead = container.closest('.sb-section')?.querySelector('.sb-head');
    if (sbHead && !sbHead._volLbTipAttached) {
      sbHead._volLbTipAttached = true;
      sbHead.style.cursor = 'help';
      const tipTitle = 'Volatility Leaderboard';
      const tipBody  = 'Ranks the 28 G10 pairs by current ATM implied volatility (6 USD majors from institutional options markets, then triangulated for crosses), showing the top 5 highest to lowest on a scale relative to this group, not fixed 0-100. Hover a row for IV Rank (52-week percentile, context only — not a buy/sell signal). ~ = triangulated cross value. NOK/SEK excluded (no vol index available). EUR/GBP/JPY use a different vol-index construction than AUD/CHF/CAD/NZD, so treat cross-family comparisons as directional, not exact.';
      const tipEx    = 'The best opportunity may not be your usual pair — it\u2019s wherever a catalyst is driving IV higher. A starting filter, not a standalone entry signal.';
      sbHead.addEventListener('mouseenter', ev => {
        const tt = document.getElementById('fx-tt');
        if (!tt) return;
        document.getElementById('fx-tt-title').textContent = tipTitle;
        document.getElementById('fx-tt-body').textContent  = tipBody;
        const exEl = document.getElementById('fx-tt-ex');
        exEl.textContent = tipEx; exEl.style.display = 'block';
        tt.style.display = 'block';
        requestAnimationFrame(() => window._fxTTPos && window._fxTTPos(ev.clientX, ev.clientY));
      });
      sbHead.addEventListener('mouseleave', () => {
        const tt = document.getElementById('fx-tt');
        if (tt) tt.style.display = 'none';
      });
    }

    renderVolRankList(container);

  } catch (e) {
    console.warn('[VolLeaderboard]', e);
    if (container) container.innerHTML = '<div style="padding:6px 8px;font-size:10px;color:var(--text3);">Unavailable</div>';
  }
}

let _volLbTopCache = [];

function renderVolRankList(container) {
  const top = _volLbTopCache;
  if (!container || !top.length) return;

  container.className = 'vol-lb-rows';

  const vals = top.map(r => r.atmIv);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min;

  container.innerHTML = top.map((r, idx) => {
    const sym = 'FX_IDC:' + r.id.toUpperCase();
    const tipRank = r.ivRank != null ? ` · IV Rank ${r.ivRank.toFixed(0)}` : '';
    const tip = `${r.label} · ATM IV ${r.atmIv.toFixed(1)}%${tipRank}${r.estimated ? ' (triangulated)' : ''} — Click for chart · detail`;
    const pct = span > 0 ? 15 + ((r.atmIv - min) / span) * 85 : 100;
    const valStr = (r.estimated ? '~' : '') + r.atmIv.toFixed(1) + '%';

    return `<div class="vol-lb-row" data-sym="${sym}" title="${tip}">
      <span class="vlr-rank">${idx + 1}</span>
      <span class="vlr-pair">${r.label}</span>
      <div class="vlr-bar-wrap"><div class="vlr-bar" style="width:${pct}%"></div></div>
      <span class="vlr-val">${valStr}</span>
    </div>`;
  }).join('');

  container.querySelectorAll('.vol-lb-row[data-sym]').forEach(row => {
    row.addEventListener('click', () => loadTVChart(row.dataset.sym));
  });
}

async function fetchCarryData() {
  const CURRENCIES = ['USD','EUR','GBP','JPY','AUD','CHF','CAD','NZD','NOK','SEK'];
  const LABELS = { USD:'USD Fed', EUR:'EUR ECB', GBP:'GBP BoE', JPY:'JPY BoJ',
                   AUD:'AUD RBA', CHF:'CHF SNB', CAD:'CAD BoC', NZD:'NZD RBNZ',
                   NOK:'NOK NB', SEK:'SEK Riksbank' };

  try {
    const rateData = {};
    await Promise.all(CURRENCIES.map(async ccy => {
      try {
        const r = await fetch('./rates/' + ccy + '.json', { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (d.observations && d.observations.length) {
          rateData[ccy] = parseFloat(d.observations[0].value);
        }
      } catch {}
    }));

    const carryPairs = [
      { long: 'AUD', short: 'JPY' },
      { long: 'NZD', short: 'JPY' },
      { long: 'GBP', short: 'JPY' },
      { long: 'AUD', short: 'CHF' },
      { long: 'NZD', short: 'CHF' },
      { long: 'USD', short: 'JPY' },
      { long: 'NOK', short: 'JPY' },
      { long: 'SEK', short: 'JPY' },
    ].map(p => {
      const diff = (rateData[p.long] ?? 0) - (rateData[p.short] ?? 0);
      return { ...p, diff };
    }).sort((a,b) => b.diff - a.diff);

    const container = document.getElementById('sb-carry-rows');
    if (!container) return;
    function carrySymbol(long, short) {
      if (short === 'USD') return 'FX_IDC:' + long + 'USD';
      if (long  === 'USD') return 'FX_IDC:USD' + short;
      return 'FX_IDC:' + long + short;
    }

    container.innerHTML = carryPairs.map(p => {
      const sign = p.diff >= 0 ? '+' : '';
      const cls = p.diff > 1 ? 'up' : p.diff < 0 ? 'down' : 'flat';
      const longRate = (rateData[p.long]??0).toFixed(2);
      const shortRate = (rateData[p.short]??0).toFixed(2);
      const sym = carrySymbol(p.long, p.short);
      return `<div class="sb-row" data-sym="${sym}" style="cursor:pointer;" title="Open ${p.long}/${p.short} chart">
        <span class="sb-sym">${p.long}/${p.short}</span>
        <span class="sb-price" style="font-size:8.5px;color:var(--text3);letter-spacing:-0.01em;">${longRate}% · ${shortRate}%</span>
        <span class="sb-chg ${cls}">${sign}${p.diff.toFixed(2)}%</span>
      </div>`;
    }).join('');
  } catch(e) { console.warn('Carry fetch failed:', e); }
}

async function fetchCrossAssetData() {

  try {
    const _cb = '?_=' + Math.floor(Date.now() / 120000);
    const _ffRes = await fetch('./calendar-data/economic-events.json' + _cb, { cache: 'no-store' });
    if (_ffRes.ok) {
      const _ffJson = await _ffRes.json();
      const _todayIso = new Date().toISOString().slice(0, 10);
      const _next = new Set();
      for (const h of (_ffJson?.holidays || [])) {
        if (h?.dateISO === _todayIso && h?.currency) _next.add(h.currency.toUpperCase());
      }
      _CA_HOLIDAY_CCYS = _next;
    }
  } catch {}

  function setCA(id, val, chgPct, isYield, chgAbs) {
    const vEl = document.getElementById('ca-' + id);
    const cEl = document.getElementById('cac-' + id);
    if (!vEl || !cEl) return;
    if (val == null) return;
    const closedCcy = _caClosedCcy(id);
    if (closedCcy) {
      vEl.textContent = isYield ? val.toFixed(2) + '%' : val.toLocaleString(undefined, { maximumFractionDigits: val > 100 ? 2 : 4 });
      vEl.className = 'ca-val flat';
      cEl.textContent = closedCcy + ' holiday — closed';
      cEl.className = 'ca-chg flat';
      cEl.style.opacity = '0.65';
      return;
    } else {
      cEl.style.removeProperty('opacity');
    }
    if (chgPct == null) {
      vEl.textContent = isYield ? val.toFixed(2) + '%' : val.toLocaleString(undefined, { maximumFractionDigits: val > 100 ? 2 : 4 });
      vEl.className = 'ca-val flat';
      cEl.textContent = '—'; cEl.className = 'ca-chg flat';
      return;
    }
    const cls   = chgPct > 0.05 ? 'up' : chgPct < -0.05 ? 'down' : '';
    const arrow = chgPct > 0.05 ? '▲' : chgPct < -0.05 ? '▼' : '→';
    const sign  = chgPct >= 0 ? '+' : '';
    vEl.textContent = isYield ? val.toFixed(2) + '%' : val.toLocaleString(undefined, { maximumFractionDigits: val > 100 ? 2 : 4 });
    vEl.className = 'ca-val';
    if (chgAbs != null && !isYield) {
      const absSign = chgAbs >= 0 ? '+' : '';
      const absFmt  = Math.abs(chgAbs) >= 1000
        ? chgAbs.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : Math.abs(chgAbs) >= 10
          ? (absSign + chgAbs.toFixed(1))
          : (absSign + chgAbs.toFixed(2));
      cEl.textContent = arrow + ' ' + absFmt + ' (' + sign + chgPct.toFixed(2) + '%)';
    } else {
      cEl.textContent = arrow + ' ' + sign + chgPct.toFixed(2) + '%';
    }
    cEl.className = 'ca-chg ' + cls;
  }

  let _repoUs10y = null;
  try {
    const usdExt = await fetch('./extended-data/USD.json').then(r => r.ok ? r.json() : null).catch(() => null);
    if (usdExt?.data?.bond10y != null && !isNaN(usdExt.data.bond10y)) {
      _repoUs10y = { close: usdExt.data.bond10y, chg: 0, pct: 0, fromRepo: true };
      setCA('us10y', _repoUs10y.close, null, true);
    }
  } catch {}

  const _caIntraday = await loadIntradayQuotes();  
  let _caGold   = _caIntraday ? intradayQuote(_caIntraday, 'gold')   : null;
  let _caWti    = _caIntraday ? intradayQuote(_caIntraday, 'wti')    : null;
  let _caSpx    = _caIntraday ? intradayQuote(_caIntraday, 'spx')    : null;
  let _caNikkei = _caIntraday ? intradayQuote(_caIntraday, 'nikkei') : null;
  let _caStoxx  = _caIntraday ? intradayQuote(_caIntraday, 'stoxx')  : null;
  let _caDxy    = _caIntraday ? intradayQuote(_caIntraday, 'dxy')    : null;

  if (_caSpx)    setCA('spx',    _caSpx.close,    _caSpx.pct,    false, _caSpx.chg);
  if (_caGold) {
    setCA('gold', _caGold.close, _caGold.pct, false, _caGold.chg);
    const gEl = document.getElementById('q-xauusd'), gcEl = document.getElementById('qc-xauusd');
    if (gEl)  { gEl.textContent  = _caGold.close.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); gEl.className  = 'q-price ' + clsDir(_caGold.chg); }
    if (gcEl) { gcEl.textContent = pctStr(_caGold.pct); gcEl.className = 'q-chg '   + clsDir(_caGold.chg); }
  }
  if (_caWti)    setCA('wti',    _caWti.close,    _caWti.pct,    false, _caWti.chg);
  if (_caNikkei) setCA('nikkei', _caNikkei.close, _caNikkei.pct, false, _caNikkei.chg);
  if (_caStoxx)  setCA('stoxx',  _caStoxx.close,  _caStoxx.pct,  false, _caStoxx.chg);
  const _caUs10yEarly = _caIntraday ? intradayQuote(_caIntraday, 'us10y') : null;
  if (_caUs10yEarly && _caUs10yEarly.close > 0) setCA('us10y', _caUs10yEarly.close, _caUs10yEarly.pct, true);
  if (_caGold && _caSpx && _caSpx.close > 0) {
    const ratio = (_caGold.close / _caSpx.close).toFixed(3);
    const rNum  = parseFloat(ratio);
    const sig   = rNum > 0.75 ? 'Risk-Off signal' : rNum > 0.55 ? 'Neutral' : 'Risk-On signal';
    const cls   = rNum > 0.75 ? 'down' : rNum < 0.55 ? 'up' : 'flat';
    setEl('ri-gold-spx', ratio);
    setEl('ri-gold-spx-sig', sig, cls);
  }
  if (_caDxy) {
    setCA('dxy', _caDxy.close, _caDxy.pct, false, _caDxy.chg);
    const dEl = document.getElementById('q-dxy'), dcEl = document.getElementById('qc-dxy');
    if (dEl)  { dEl.textContent  = _caDxy.close.toFixed(1); dEl.className  = 'q-price ' + clsDir(_caDxy.chg); }
    if (dcEl) { dcEl.textContent = pctStr(_caDxy.pct);      dcEl.className = 'q-chg '   + clsDir(_caDxy.chg); }
  }
  const _caBtcEarly = _caIntraday ? intradayQuote(_caIntraday, 'btc') : null;
  if (_caBtcEarly) {
    const btcFmtE = _caBtcEarly.close.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0});
    const bEl = document.getElementById('ca-btc'), bcEl = document.getElementById('cac-btc');
    const qbEl = document.getElementById('q-btcusd'), qbcEl = document.getElementById('qc-btcusd');
    if (bEl)  { bEl.textContent  = btcFmtE; bEl.className  = 'ca-val'; }
    if (bcEl) {
      const _btcArrow = (_caBtcEarly.chg??0) > 0 ? '▲' : (_caBtcEarly.chg??0) < 0 ? '▼' : '→';
      const _btcSign  = (_caBtcEarly.pct??0) >= 0 ? '+' : '';
      if (_caBtcEarly.chg != null) {
        const _btcAbs = _caBtcEarly.chg.toLocaleString(undefined,{maximumFractionDigits:0});
        bcEl.textContent = _btcArrow + ' ' + (_caBtcEarly.chg>=0?'+':'') + _btcAbs + ' (' + _btcSign + (_caBtcEarly.pct??0).toFixed(2) + '%)';
      } else {
        bcEl.textContent = _btcArrow + ' ' + _btcSign + (_caBtcEarly.pct??0).toFixed(2) + '%';
      }
      bcEl.className = 'ca-chg ' + clsDir(_caBtcEarly.chg);
    }
    if (qbEl)  { qbEl.textContent  = btcFmtE; qbEl.className  = 'q-price ' + clsDir(_caBtcEarly.chg); }
    if (qbcEl) { qbcEl.textContent = pctStr(_caBtcEarly.pct); qbcEl.className = 'q-chg ' + clsDir(_caBtcEarly.chg); }
    STOOQ_RT_CACHE['btc'] = _caBtcEarly;
  }
  const _caEthEarly = _caIntraday ? intradayQuote(_caIntraday, 'eth') : null;
  if (_caEthEarly) STOOQ_RT_CACHE['eth'] = _caEthEarly;

  const finalSpx    = _caSpx;
  const finalGold   = _caGold;
  const finalWti    = _caWti;
  const finalNikkei = _caNikkei;
  const finalStoxx  = _caStoxx;
  const finalDxy    = _caDxy;
  const us10y       = (_caIntraday ? intradayQuote(_caIntraday, 'us10y') : null) || _repoUs10y;

  if (finalSpx)    { STOOQ_RT_CACHE['spx']    = finalSpx;    setCA('spx',    finalSpx.close,    finalSpx.pct,    false, finalSpx.chg); }
  if (finalGold) {
    STOOQ_RT_CACHE['xauusd'] = STOOQ_RT_CACHE['gold'] = finalGold;
    setCA('gold', finalGold.close, finalGold.pct, false, finalGold.chg);
    const gEl = document.getElementById('q-xauusd'), gcEl = document.getElementById('qc-xauusd');
    if (gEl)  { gEl.textContent  = finalGold.close.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); gEl.className  = 'q-price ' + clsDir(finalGold.chg); }
    if (gcEl) { gcEl.textContent = pctStr(finalGold.pct); gcEl.className = 'q-chg ' + clsDir(finalGold.chg); }
  }
  if (finalWti)    { STOOQ_RT_CACHE['wti']    = finalWti;    setCA('wti',    finalWti.close,    finalWti.pct,    false, finalWti.chg); }
  if (finalNikkei) { STOOQ_RT_CACHE['nikkei'] = finalNikkei; setCA('nikkei', finalNikkei.close, finalNikkei.pct, false, finalNikkei.chg); }
  if (finalStoxx)  { STOOQ_RT_CACHE['stoxx']  = finalStoxx;  setCA('stoxx',  finalStoxx.close,  finalStoxx.pct,  false, finalStoxx.chg); }
  if (us10y)       { if (!us10y.fromRepo) STOOQ_RT_CACHE['us10y'] = us10y; setCA('us10y', us10y.close, us10y.fromRepo ? null : us10y.pct, true); }

  const dxyData = finalDxy;
  if (dxyData) {
    STOOQ_RT_CACHE['dxy'] = dxyData;
    setCA('dxy', dxyData.close, dxyData.pct, false, dxyData.chg);
    const dEl = document.getElementById('q-dxy');
    const dcEl = document.getElementById('qc-dxy');
    if (dEl) { dEl.textContent = dxyData.close.toFixed(1); dEl.className = 'q-price ' + clsDir(dxyData.chg); }
    if (dcEl) { dcEl.textContent = pctStr(dxyData.pct); dcEl.className = 'q-chg ' + clsDir(dxyData.chg); }
  }

  const btcEl = document.getElementById('ca-btc');
  const btcCEl = document.getElementById('cac-btc');
  const qBtc = document.getElementById('q-btcusd');
  const qBtcC = document.getElementById('qc-btcusd');
  const _btcIntraday = _caIntraday ? intradayQuote(_caIntraday, 'btc') : null;
  if (_btcIntraday) STOOQ_RT_CACHE['btc'] = _btcIntraday;  
  const _ethIntraday = _caIntraday ? intradayQuote(_caIntraday, 'eth') : null;
  if (_ethIntraday) STOOQ_RT_CACHE['eth'] = _ethIntraday;  
  if (_btcIntraday && btcEl) {
    const btcFmt = _btcIntraday.close.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    btcEl.textContent  = btcFmt;
    btcEl.className    = 'ca-val';
    if (btcCEl) {
      const _biArrow = (_btcIntraday.chg??0) > 0 ? '▲' : (_btcIntraday.chg??0) < 0 ? '▼' : '→';
      const _biSign  = (_btcIntraday.pct??0) >= 0 ? '+' : '';
      if (_btcIntraday.chg != null) {
        const _biAbs = _btcIntraday.chg.toLocaleString(undefined,{maximumFractionDigits:0});
        btcCEl.textContent = _biArrow + ' ' + (_btcIntraday.chg>=0?'+':'') + _biAbs + ' (' + _biSign + (_btcIntraday.pct??0).toFixed(2) + '%)';
      } else {
        btcCEl.textContent = _biArrow + ' ' + _biSign + (_btcIntraday.pct??0).toFixed(2) + '%';
      }
      btcCEl.className = 'ca-chg ' + clsDir(_btcIntraday.chg);
    }
    if (qBtc) {
      qBtc.textContent  = btcFmt;
      qBtc.className    = 'q-price ' + clsDir(_btcIntraday.chg);
      if (qBtcC) { qBtcC.textContent = pctStr(_btcIntraday.pct); qBtcC.className = 'q-chg ' + clsDir(_btcIntraday.chg); }
    }
  } else if (btcEl && qBtc && qBtc.textContent !== '—') {
    btcEl.textContent = qBtc.textContent;
    btcEl.className = qBtc.className.replace('q-price', 'ca-val');
    if (btcCEl && qBtcC) { btcCEl.textContent = qBtcC.textContent; btcCEl.className = qBtcC.className.replace('q-chg', 'ca-chg'); }
  }

  const upd = document.getElementById('ca-updated');
  const now = new Date();
  const localHHMM = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
  let sourceLabel = 'Delayed';
  if (_caIntraday?.source && _caIntraday.source !== 'repo') {
    const fileAge = _caIntraday.updated
      ? (Date.now() - new Date(_caIntraday.updated).getTime()) / 60000
      : 999;
    sourceLabel = fileAge < 8 ? `Live · ~5min delay` : 'Delayed';
  }
  if (upd) upd.textContent = sourceLabel + ' · ' + localHHMM + ' ' + tzAbbr;

  if (finalGold && finalSpx && finalSpx.close > 0) {
    const ratio = (finalGold.close / finalSpx.close).toFixed(3);
    const rNum  = parseFloat(ratio);
    const sig   = rNum > 0.75 ? 'Risk-Off signal' : rNum > 0.55 ? 'Neutral' : 'Risk-On signal';
    const cls   = rNum > 0.75 ? 'down' : rNum < 0.55 ? 'up' : 'flat';
    setEl('ri-gold-spx', ratio);
    setEl('ri-gold-spx-sig', sig, cls);
  }

  _lwUpdateTodayBar();
}

async function fetchFedExpectations() {
  try {
    const tbody = document.getElementById('fed-exp-tbody');
    if (!tbody) return;

    const currencies = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK'];

    const [meetingsRes, bond2yHistRes, ...rateResponses] = await Promise.all([
      fetch('./meetings-data/meetings.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      Promise.all(currencies.map(c =>
        fetch(`./bond2y-data/${c}.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
      )),
      ...currencies.map(c =>
        fetch(`./rates/${c}.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ]);

    const bond2yDelta5d = {};
    currencies.forEach((c, i) => {
      const hist = bond2yHistRes[i];
      if (!Array.isArray(hist) || hist.length < 6) { bond2yDelta5d[c] = null; return; }
      const sorted = [...hist].sort((a, b) => a.date < b.date ? -1 : 1);
      const last = sorted[sorted.length - 1]?.value;
      const prior = sorted[sorted.length - 6]?.value;
      bond2yDelta5d[c] = (last != null && prior != null) ? Math.round((last - prior) * 100) : null; 
    });
    const _validDeltas = currencies.map(c => bond2yDelta5d[c]).filter(v => v != null);
    let _deltaMean = null, _deltaStd = null;
    if (_validDeltas.length >= 4) {
      _deltaMean = _validDeltas.reduce((a, b) => a + b, 0) / _validDeltas.length;
      const variance = _validDeltas.reduce((a, b) => a + (b - _deltaMean) ** 2, 0) / _validDeltas.length;
      _deltaStd = Math.sqrt(variance);
    }
    const Z_THRESHOLD = 1.5;
    const bankMeta = {
      USD: { flag:'us', short:'Fed'    },
      EUR: { flag:'eu', short:'ECB'    },
      GBP: { flag:'gb', short:'BoE'    },
      JPY: { flag:'jp', short:'BoJ'    },
      AUD: { flag:'au', short:'RBA'    },
      CAD: { flag:'ca', short:'BoC'    },
      CHF: { flag:'ch', short:'SNB'    },
      NZD: { flag:'nz', short:'RBNZ'  },
      NOK: { flag:'no', short:'NB'     },
      SEK: { flag:'se', short:'Riksbank' },
    };

    const rows = [];
    currencies.forEach((ccy, i) => {
      const rateData = rateResponses[i];
      if (!rateData) return;
      const obs = rateData.observations || [];
      if (obs.length < 2) return;

      const current = parseFloat(obs[0].value);

      const meetings = meetingsRes?.meetings?.[ccy];
      const nextMtg = meetings?.nextMeeting || '—';

      const trendDir     = computeCBTrend(obs);   
      const meetingsBias = meetings?.bias;
      const biasMethod   = meetings?.biasMethod ?? null;
      const biasSource   = meetings?.biasSource ?? null;
      const biasUpdated  = meetings?.biasUpdated ?? null;

      function buildBiasTooltip() {
        const isOIS  = biasMethod === 'ois' || biasMethod === 'ois-preserved';
        const src    = biasSource || (isOIS ? 'OIS/overnight rate' : 'rate trajectory');
        const upd    = biasUpdated ? ` · updated ${biasUpdated}` : '';
        const pres   = biasMethod === 'ois-preserved' ? ' (OIS source temporarily unavailable — last known signal preserved)' : '';
        const heur   = biasMethod === 'heuristic' ? ' (OIS source unavailable — estimated from rate trajectory)' : '';
        return `Market forward direction · ${src}${upd}${pres}${heur}`;
      }
      const biasTip = buildBiasTooltip();

      const cutProb  = meetings?.cutProb  ?? null;  
      const hikeProb = meetings?.hikeProb ?? null;  
      const probSrc  = biasSource || 'OIS/futures';
      const _haveProbData = cutProb !== null || hikeProb !== null;
      const CONVICTION_THRESHOLD = 60; 
      let probSuffix = '';
      let leanPrefix = '';
      let convictionNote = '';
      if (_haveProbData) {
        if (meetingsBias === 'hike') {
          const hp = hikeProb ?? 0;
          const probCls = hp >= 60 ? 'up' : hp >= 40 ? '' : 'flat';
          probSuffix = ` <span class="${probCls}" style="font-size:8px;font-family:var(--font-mono);opacity:0.85;white-space:nowrap;" title="Market-implied probability of a hike at next meeting · ${probSrc}">${hp}%↑</span>`;
          if (hp < CONVICTION_THRESHOLD) { leanPrefix = 'Lean '; convictionNote = ` (leaning — ${hp}% priced, below ${CONVICTION_THRESHOLD}% conviction)`; }
        } else if (meetingsBias === 'cut') {
          const cp = cutProb ?? 0;
          const probCls = cp >= 60 ? 'down' : cp >= 40 ? '' : 'flat';
          probSuffix = ` <span class="${probCls}" style="font-size:8px;font-family:var(--font-mono);opacity:0.85;white-space:nowrap;" title="Market-implied probability of a cut at next meeting · ${probSrc}">${cp}%↓</span>`;
          if (cp < CONVICTION_THRESHOLD) { leanPrefix = 'Lean '; convictionNote = ` (leaning — ${cp}% priced, below ${CONVICTION_THRESHOLD}% conviction)`; }
        } else {
          const holdProb = Math.max(0, 100 - (cutProb ?? 0) - (hikeProb ?? 0));
          const probCls = holdProb >= 60 ? 'flat' : '';
          probSuffix = ` <span class="${probCls}" style="font-size:8px;font-family:var(--font-mono);opacity:0.85;white-space:nowrap;" title="Market-implied probability of no change at next meeting · ${probSrc}">${holdProb}%→</span>`;
          if (holdProb < CONVICTION_THRESHOLD) { leanPrefix = 'Lean '; convictionNote = ` (leaning — ${holdProb}% priced, below ${CONVICTION_THRESHOLD}% conviction)`; }
        }
      }
      const leanStyle = leanPrefix ? 'opacity:0.7;' : '';
      const biasTipFull = biasTip + convictionNote;

      let biasLabel;
      if (meetingsBias === 'cut') {
        biasLabel = `<span class="down" style="${leanStyle}" title="${biasTipFull}">↓ ${leanPrefix}Cut</span>` + probSuffix;
      } else if (meetingsBias === 'hike') {
        biasLabel = `<span class="up" style="${leanStyle}" title="${biasTipFull}">↑ ${leanPrefix}Hike</span>` + probSuffix;
      } else if (meetingsBias === 'hold') {
        biasLabel = `<span class="flat" style="${leanStyle}" title="${biasTipFull}">→ ${leanPrefix}Hold</span>` + probSuffix;
      } else {
        const fbTip = 'Estimated from rate trajectory · OIS source unavailable';
        biasLabel = trendDir === 'down' ? `<span class="down" title="${fbTip}">~ ↓ Cut</span>`
                  : trendDir === 'up'   ? `<span class="up" title="${fbTip}">~ ↑ Hike</span>`
                  :                       `<span class="flat" title="${fbTip}">~ → Hold</span>`;
        biasLabel += probSuffix;
      }

      let fwdDisplay = '—';
      const meetingBias = (() => {
        if (!meetings) return null;
        const b = meetings.bias;
        if (!b) return null;
        if (/cut|dovish/i.test(b))  return 'down';
        if (/hike|hawkish/i.test(b)) return 'up';
        return 'flat';
      })();
      const CB_STEP_P1 = { JPY: 0.10, CHF: 0.25 };
      const cbStepP1 = CB_STEP_P1[ccy] ?? 0.25;
      const fwdRateRaw = meetings?.fwdRate;
      const fwdRateStale = fwdRateRaw != null && !isNaN(fwdRateRaw) &&
        (fwdRateRaw < current - cbStepP1 - 0.001 || fwdRateRaw > current + cbStepP1 + 0.001);
      if (fwdRateRaw != null && !isNaN(fwdRateRaw) && fwdRateRaw > 0 && !fwdRateStale) {
        fwdDisplay = fwdRateRaw.toFixed(2) + '%';
      } else {
        const pCut  = (meetings?.cutProb  != null && !isNaN(meetings.cutProb))  ? Math.min(100, Math.max(0, meetings.cutProb))  : null;
        const pHike = (meetings?.hikeProb != null && !isNaN(meetings.hikeProb)) ? Math.min(100, Math.max(0, meetings.hikeProb)) : null;

        const CB_STEP = { JPY: 0.10, CHF: 0.25 };
        const cbStep  = CB_STEP[ccy] ?? 0.25;

        if (pCut !== null || pHike !== null) {
          const cut  = pCut  ?? 0;
          const hike = pHike ?? 0;
          const cutC  = Math.min(cut,  100);
          const hikeC = Math.min(hike, 100 - cutC);
          const implied = current + (hikeC / 100) * cbStep - (cutC / 100) * cbStep;
          fwdDisplay = Math.max(0, implied).toFixed(2) + '%';
        } else {
          const dir  = meetingBias ?? trendDir;
          const step = dir === 'down' ? -cbStep : dir === 'up' ? cbStep : 0;
          fwdDisplay = '~' + Math.max(0, current + step).toFixed(2) + '%';
        }
      }

      const meta = bankMeta[ccy];
      const flag = `<span class="fi fi-${meta.flag}" style="margin-right:4px;border-radius:2px;vertical-align:middle;"></span>`;

      let chk2yIcon = '';
      const d5 = bond2yDelta5d[ccy];
      if (_haveProbData && d5 != null && _deltaStd != null) {
        const z = _deltaStd > 0 ? (d5 - _deltaMean) / _deltaStd : 0;
        const movedSig = Math.abs(z) >= Z_THRESHOLD;
        const actualDir = movedSig ? (d5 > 0 ? 1 : -1) : 0;
        const expectedDir = meetingsBias === 'hike' ? 1 : meetingsBias === 'cut' ? -1 : 0;
        const diverges = actualDir !== 0 && actualDir !== expectedDir;
        const biasWord = meetingsBias === 'hike' ? 'Hike' : meetingsBias === 'cut' ? 'Cut' : 'Hold';
        const probPct = meetingsBias === 'hike' ? (hikeProb ?? null) : meetingsBias === 'cut' ? (cutProb ?? null) : Math.max(0, 100 - (cutProb ?? 0) - (hikeProb ?? 0));
        const probTxt = probPct != null ? ` (${probPct}%)` : '';
        const d5Txt = (d5 > 0 ? '+' : '') + d5 + 'bp';
        if (diverges) {
          chk2yIcon = `<span class="warning" style="font-size:11px;cursor:default;" title="2Y running ahead of the OIS-implied path — OIS: ${biasWord}${probTxt} · 2Y 5d: ${d5Txt} (${z.toFixed(1)}σ vs G10)">${d5 > 0 ? '▲' : '▼'}</span>`;
        } else {
          chk2yIcon = `<span style="font-size:11px;cursor:default;color:var(--border2);" title="2Y aligned with the OIS-implied path — OIS: ${biasWord}${probTxt} · 2Y 5d: ${d5Txt}">●</span>`;
        }
      }

      rows.push(`<tr title="Next meeting: ${nextMtg} · CIP 30d fwd">
        <td style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${flag}<span style="font-size:10px;">${meta.short}</span> <span style="color:var(--text3);font-size:9px;">${nextMtg}</span></td>
        <td style="overflow:hidden;white-space:nowrap;">${biasLabel}</td>
        <td style="color:var(--text2);font-family:var(--font-mono);font-size:10px;white-space:nowrap;padding-left:3px;padding-right:3px;">${fwdDisplay}</td>
        <td style="text-align:center;white-space:nowrap;">${chk2yIcon}</td>
      </tr>`);
    });

    if (rows.length) tbody.innerHTML = rows.join('');

    if (meetingsRes?.meetings) window._STATE_meetings = meetingsRes; 
  } catch(e) { console.warn('CB expectations failed:', e); }
}

async function fetchOptionSkew() {
  try {
    const tbody = document.getElementById('skew-tbody');

    const pairs = [
      { pair:'EUR/USD', cot:'EUR', etfId:'eurusd', rrKey:'EURUSD' },
      { pair:'GBP/USD', cot:'GBP', etfId:'gbpusd', rrKey:'GBPUSD' },
      { pair:'USD/JPY', cot:'JPY', etfId:'usdjpy', rrKey:'USDJPY' },
      { pair:'AUD/USD', cot:'AUD', etfId:'audusd', rrKey:'AUDUSD' },
      { pair:'USD/CAD', cot:'CAD', etfId:'usdcad',  rrKey:'USDCAD' },
      { pair:'USD/CHF', cot:'CHF', etfId:'usdchf',  rrKey:'USDCHF' },
      { pair:'NZD/USD', cot:'NZD', etfId:null,     rrKey:'NZDUSD' },
    ];

    const intradayData = await loadIntradayQuotes().catch(() => null);
    const etfIvMap = intradayData?.fx_etf_iv || {};

    const cotFiles = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD'];
    const cotResults = await Promise.all(cotFiles.map(async ccy => {
      try {
        const r = await fetch('./cot-data/' + ccy + '.json');
        if (!r.ok) return null;
        const d = await r.json();
        return { ccy, net: d.netPosition || 0, long: d.longPositions||0, short: d.shortPositions||0 };
      } catch { return null; }
    }));
    const cotMap = {};
    cotResults.filter(Boolean).forEach(c => { cotMap[c.ccy] = c; });

    let rrMap = {};
    try {
      const rrRes = await fetch('./rr-data/rr.json').catch(() => null);
      if (rrRes?.ok) {
        const rrJson = await rrRes.json();
        if (rrJson?.pairs) rrMap = rrJson.pairs;  
        Object.assign(RR_DATA_CACHE, rrMap);
      }
    } catch {  }

    function netToSkew(net, invert) {
      const scale = Math.abs(net) / 50000;
      const val = Math.min(1.5, scale * 1.2);
      const signed = net > 0 ? val : -val;
      return invert ? -signed : signed;
    }

    const hasAnyEtfIv = pairs.some(p => etfIvMap[p.etfId]?.iv != null);
    const hasIvRank   = pairs.some(p => etfIvMap[p.etfId]?.iv_rank != null);
    const thead = tbody ? tbody.closest('table')?.querySelector('thead tr') : null;
    if (thead) {
      if (hasAnyEtfIv) {
        thead.innerHTML = hasIvRank
          ? '<th style="text-align:left" scope="col">Pair</th><th scope="col">ATM IV</th><th scope="col" title="IV Rank: position of current IV within 52-week range (0=historically low, 100=historically high)">IV Rnk</th><th scope="col">Direction</th>'
          : '<th style="text-align:left" scope="col">Pair</th><th scope="col">ATM IV</th><th scope="col">COT bias</th><th scope="col">Direction</th>';
      } else {
        thead.innerHTML = '<th style="text-align:left" scope="col">Pair</th><th scope="col" title="Current CFTC COT net (LF longs minus shorts)">Net</th><th scope="col" title="Net ~4 weeks ago — direction of change">4W</th><th scope="col">Bias</th>';
      }
    }

    const skewCellTips = {
      'EUR/USD': { body: 'EUR/USD skew derived from CFTC Leveraged Funds net EUR positioning (Options+Futures Combined). Positive = EUR calls bid (market positioned for EUR upside). Negative = EUR puts bid (downside protection).', ex: 'Most reliable when Leveraged Funds and Asset Manager positioning agree in direction. Divergence between the two signals uncertainty or a potential positioning squeeze.' },
      'GBP/USD': { body: 'GBP/USD skew from CFTC Leveraged Funds net GBP positioning. Reflects speculative appetite for sterling vs dollar.', ex: 'GBP skew is especially sensitive to UK macro surprises (CPI, PMI). Watch for regime shifts around BoE meetings.' },
      'USD/JPY': { body: 'USD/JPY skew from CFTC Leveraged Funds net JPY positioning (inverted). Positive = USD calls bid / JPY puts bid (USD upside expected). Negative = JPY safe-haven demand dominant.', ex: 'Risk-off events flip USD/JPY skew negative quickly as JPY is bought as safe haven. Monitor against VIX for confirmation.' },
      'AUD/USD': { body: 'AUD/USD skew from CFTC Leveraged Funds net AUD positioning. AUD is a risk/commodity proxy — positive skew aligns with global risk appetite and commodity strength.', ex: 'AUD skew often leads iron ore and copper price expectations. Negative skew on AUD/USD with rising VIX = classic risk-off setup.' },
      'USD/CAD': { body: 'USD/CAD bias from CFTC Leveraged Funds net CAD positioning (inverted). Positive = USD calls bid / CAD puts bid (USD upside, CAD weakness). Negative = CAD demand dominant, often driven by oil strength or risk-on.', ex: 'CAD is tightly linked to WTI crude. Watch for divergence between COT bias and oil price direction — that spread often resolves in oil\'s favour.' },
      'USD/CHF': { body: 'USD/CHF bias from CFTC Leveraged Funds net CHF positioning (inverted). Positive = USD calls bid / CHF puts bid. Negative = CHF safe-haven demand dominant.', ex: 'CHF safe-haven flows can override COT positioning quickly during risk-off episodes. Treat CHF bias as a risk sentiment barometer alongside JPY.' },
      'NZD/USD': { body: 'NZD/USD bias from CFTC Leveraged Funds net NZD positioning. NZD is a high-beta risk/commodity proxy — positive bias aligns with global risk appetite and dairy/agricultural strength.', ex: 'NZD often moves in tandem with AUD. Divergence between the two — e.g. NZD negative while AUD positive — can signal idiosyncratic NZ macro risk (RBNZ, trade data).' },
    };

    if (tbody) tbody.innerHTML = pairs.map(p => {
      const cotData = cotMap[p.cot];
      const etfIv   = etfIvMap[p.etfId];
      const invert  = p.pair.startsWith('USD/');

      if (!cotData && !etfIv) {
        return `<tr><td>${p.pair}</td><td colspan="3" style="color:var(--text3)">—</td></tr>`;
      }

      const cotSkew = cotData ? netToSkew(cotData.net, invert) : 0;
      const bias    = Math.abs(cotSkew) < 0.1 ? 'Neutral'
                    : cotSkew > 0 ? p.pair.split('/')[0]+'+'
                    : p.pair.split('/')[1]+'+';
      const biasCls = Math.abs(cotSkew) < 0.1 ? 'flat' : cotSkew > 0 ? 'up' : 'down';
      const fmtRR   = v => (v >= 0 ? '+' : '') + v.toFixed(2);

      if (etfIv?.iv != null) {
        const ivStr  = etfIv.iv.toFixed(1) + '%';
        const ivCls  = etfIv.iv > 12 ? 'down' : etfIv.iv > 7 ? '' : 'up';

        let col2Html, col2Title;
        if (etfIv.iv_rank != null) {
          const rnk    = etfIv.iv_rank;
          const pct    = etfIv.iv_pct_rank ?? rnk;
          const n      = etfIv.iv_hist_n   ?? '?';
          const rnkCls = rnk > 75 ? 'down' : rnk < 25 ? 'up' : '';
          const rnkStr = Math.round(rnk) + 'rnk';  
          col2Html  = `<td class="${rnkCls}" style="font-family:var(--font-mono);font-size:10px">${rnkStr}</td>`;
          col2Title = `IV Rank ${rnk.toFixed(0)} (${n}w history) · IV Percentile ${pct.toFixed(0)} · High rank = historically expensive vol`;
        } else {
          const cotStr = cotData ? fmtRR(cotSkew) : '—';
          const cotCls = cotData ? (cotSkew >= 0 ? 'up' : 'down') : 'flat';
          col2Html  = `<td class="${cotCls}" style="font-size:10px">${cotStr}</td>`;
          col2Title = `ETF: ${etfIv.source} · exp ${etfIv.expiry} · ATM strike ${etfIv.atm} · IV Rank building (need ≥4 weekly snapshots)`;
        }

        const rrEntry  = rrMap[p.rrKey];
        const rrVal    = rrEntry?.rr25d ?? null;
        const rrTipText = rrVal !== null
          ? `25-delta Risk Reversal (1M) · Saxo Bank · ${rrVal > 0 ? 'calls bid — upside skew on ' + p.pair.split('/')[0] : 'puts bid — downside skew on ' + p.pair.split('/')[0]}`
          : '';
        const rrChip   = rrVal !== null
          ? `<div style="font-size:8px;font-family:var(--font-mono);opacity:0.8;margin-top:1px;color:${rrVal > 0 ? 'var(--up)' : rrVal < 0 ? 'var(--down)' : 'var(--text3)'};"
              data-rr-tip-title="25d RR · Saxo Bank (1M)"
              data-rr-tip-body="${rrTipText}"
             >RR ${rrVal >= 0 ? '+' : ''}${rrVal.toFixed(2)}</div>`
          : '';

        const pairTip  = skewCellTips[p.pair];
        const td0Title = p.pair + ' — Positioning Bias';
        const td0Body  = pairTip?.body || '';
        const td0Ex    = pairTip?.ex   || '';
        const td1Title = 'ATM Implied Volatility · ' + p.pair;
        const td1Body  = `ATM IV ${ivStr} from ${_ivSourceLabel(etfIv.source)} — institutional-grade source for OTC interbank implied vol. Green ≤7% (cheap vol); red >12% (expensive).`;
        const td1Ex    = 'Sourced from an institutional-grade options market — an exchange-computed volatility index (same variance-swap methodology as VIX) where available, otherwise a named options market. All values have ~15min delay.';
        const td3Title = p.pair + ' — Directional Bias';
        const td3Body  = pairTip?.body || '';
        const td3Ex    = pairTip?.ex   || '';

        return `<tr>
          <td data-tip-title="${td0Title}" data-tip-body="${td0Body}" data-tip-ex="${td0Ex}">${p.pair}</td>
          <td class="${ivCls}" style="font-family:var(--font-mono)"
              data-tip-title="${td1Title}" data-tip-body="${td1Body}" data-tip-ex="${td1Ex}">${ivStr}</td>
          ${col2Html.replace('<td ', `<td data-tip-title="IV Rank · ${p.pair}" data-tip-body="${col2Title}" `)}
          <td class="${biasCls}" style="line-height:1.3;"
              data-tip-title="${td3Title}" data-tip-body="${td3Body}" data-tip-ex="${td3Ex}">${bias}${rrChip}</td>
        </tr>`;
      } else {
        const skew1w = cotData ? netToSkew(cotData.net, invert) : 0;
        const _hist4w = window.COT_DATA_STORE?.[cotData?.ccy]?.history;
        const _net4w = (_hist4w && _hist4w.length >= 5) ? (_hist4w[_hist4w.length - 5]?.levNet ?? null) : null;
        const skew1m = cotData ? netToSkew(_net4w ?? cotData.net * 0.85, invert) : 0;
        const rrEntryCot = rrMap[p.rrKey];
        const rrValCot   = rrEntryCot?.rr25d ?? null;
        const rrTipTextCot = rrValCot !== null
          ? `25-delta Risk Reversal (1M) · Saxo Bank · ${rrValCot > 0 ? 'calls bid — upside skew on ' + p.pair.split('/')[0] : 'puts bid — downside skew on ' + p.pair.split('/')[0]}`
          : '';
        const rrChipCot  = rrValCot !== null
          ? `<div style="font-size:8px;font-family:var(--font-mono);opacity:0.8;margin-top:1px;color:${rrValCot > 0 ? 'var(--up)' : rrValCot < 0 ? 'var(--down)' : 'var(--text3)'};"
              data-rr-tip-title="25d RR · Saxo Bank (1M)"
              data-rr-tip-body="${rrTipTextCot}"
             >RR ${rrValCot >= 0 ? '+' : ''}${rrValCot.toFixed(2)}</div>`
          : '';

        const pairTipCot = skewCellTips[p.pair];
        const td0TitleCot = p.pair + ' — Positioning Bias';
        const td0BodyCot  = pairTipCot?.body || '';
        const td0ExCot    = pairTipCot?.ex   || '';
        const td12Title   = 'COT Directional Skew · ' + p.pair;
        const td12Body    = 'est. via COT — no CBOE/CME volatility index available for this pair. Derived from CFTC Leveraged Funds net positioning (TFF · Options+Futures Combined). Net = current week; 4W = net ~4 weeks ago (real CFTC history, v7.88.0).';
        const td3TitleCot = p.pair + ' — Directional Bias';
        const td3BodyCot  = pairTipCot?.body || '';
        const td3ExCot    = pairTipCot?.ex   || '';

        return `<tr>
          <td data-tip-title="${td0TitleCot}" data-tip-body="${td0BodyCot}" data-tip-ex="${td0ExCot}">${p.pair}</td>
          <td class="${skew1w >= 0 ? 'up':'down'}"
              data-tip-title="${td12Title}" data-tip-body="${td12Body}">${fmtRR(skew1w)}</td>
          <td class="${skew1m >= 0 ? 'up':'down'}"
              data-tip-title="${td12Title} (1M)" data-tip-body="${td12Body}">${fmtRR(skew1m)}</td>
          <td class="${biasCls}" style="line-height:1.3;"
              data-tip-title="${td3TitleCot}" data-tip-body="${td3BodyCot}" data-tip-ex="${td3ExCot}">${bias}${rrChipCot}</td>
        </tr>`;
      }
    }).join('');

    const panelHead = document.getElementById('skew-source-label');
    const hasRR = Object.keys(rrMap).length > 0;
    if (panelHead) {
      if (hasAnyEtfIv) {
        panelHead.textContent = hasRR ? 'CBOE/CME Vol · 25d RR · Saxo' : 'CBOE/CME Vol Index · IV';
      } else {
        panelHead.textContent = hasRR ? 'COT · 25d RR · Saxo' : 'COT-derived · IV unavailable';
      }
    }

  } catch(e) { console.warn('Option skew failed:', e); }
}

async function loadAIRegime() {
  try {
    const res = await fetch('./ai-analysis/index.json', { cache: 'no-store' });
    if (!res.ok) return;
    const d = await res.json();
    if (d.generated_at) { _narrativeGeneratedAt = d.generated_at; window._narrativeGeneratedAt = d.generated_at; }
  } catch {  }
}

async function buildRichNarrative() {
  try {
    const [narRes, newsRes] = await Promise.all([
      fetch('./ai-analysis/index.json', { cache: 'no-store' }),
      fetch('./news-data/news.json'),
    ]);

    let baseNarrative = '';
    let regime = 'RISK-OFF';

    if (narRes.ok) {
      const d = await narRes.json();
      baseNarrative = d.narrative || '';
      regime = d.regime || 'RISK-OFF';
      _narrativeGeneratedAt = d.generated_at || null;
      window._narrativeGeneratedAt = _narrativeGeneratedAt; 
      _narrativeAiRegime   = regime.replace(/^__STALE__/, '') || null; 

      if (_narrativeGeneratedAt) {
        const ageMinutes = (Date.now() - new Date(_narrativeGeneratedAt).getTime()) / 60000;
        if (ageMinutes > 240) {
          regime = '__STALE__' + regime;
        }
      }
    }

    let newsContext = [];
    if (newsRes.ok) {
      const nd = await newsRes.json();
      const articles = nd.articles || [];
      newsContext = articles
        .filter(a => a.impact === 'high' && (!a.lang || a.lang === 'en'))
        .slice(0, 6);
    }

    const curMentions = {};
    newsContext.forEach(a => {
      if (a.cur) curMentions[a.cur] = (curMentions[a.cur] || 0) + 1;
    });
    const topCur = Object.entries(curMentions).sort((a,b) => b[1]-a[1]).map(e=>e[0]).slice(0,3);

    const fxLines = [];
    const r = STATE.rates;
    const p = STATE.prevRates;
    if (r && Object.keys(r).length) {
      if (r.EUR && p.EUR) {
        const eurusd = 1/r.EUR, prevEurusd = 1/p.EUR;
        const pct = (eurusd - prevEurusd)/prevEurusd*100;
        if (Math.abs(pct) > 0.05)
          fxLines.push(`EUR/USD ${pct>0?'bid':'offered'} at ${eurusd.toFixed(4)} (${pct>=0?'+':''}${pct.toFixed(2)}%)`);
      }
      if (r.JPY && p.JPY) {
        const usdjpy = r.JPY, prevJpy = p.JPY;
        const pct = (usdjpy - prevJpy)/prevJpy*100;
        if (Math.abs(pct) > 0.05)
          fxLines.push(`USD/JPY ${pct>0?'extends gains':'retreats'} to ${usdjpy.toFixed(2)}`);
      }
      const majors = ['EUR','GBP','AUD','NZD'];
      const avgPct = majors.filter(c=>r[c]&&p[c]).map(c=>(r[c]-p[c])/p[c]*100);
      if (avgPct.length) {
        const usdAvg = -(avgPct.reduce((a,b)=>a+b,0)/avgPct.length);
        if (Math.abs(usdAvg) > 0.03)
          fxLines.push(`DXY ${usdAvg>0?'firming':'weakening'} — USD ${usdAvg>0?'broadly bid':'broadly offered'}`);
      }
    }

    let headlineSnippet = '';
    if (newsContext.length) {
      const topItem = newsContext[0];
      const title = (topItem.title || '').replace(/\s+/g,' ').trim().slice(0,100);
      if (title.length > 20) headlineSnippet = title + (title.length === 100 ? '…' : '');
    }

    let finalNarrative = '';

    if (baseNarrative.length > 40) {
      finalNarrative = baseNarrative;
    } else if (fxLines.length || headlineSnippet) {
      const parts = [];
      if (fxLines.length) parts.push(fxLines.join('. '));
      if (topCur.length && topCur.length <= 4) parts.push(`${topCur.join(', ')} in focus`);
      if (headlineSnippet) parts.push(headlineSnippet);
      finalNarrative = parts.join('. ') + '.';
    }

    const el = document.getElementById('narrative-text');
    if (el && finalNarrative) el.textContent = finalNarrative;
    if (el && _narrativeGeneratedAt) {
      const _tsD = new Date(_narrativeGeneratedAt);
      const _tz = _tsD.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
      el.title = 'Updated ' + _tsD.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) + ' ' + _tz;
    }

    try {
      const sigR = await fetch('./ai-analysis/signals.json', { cache: 'no-store' });
      if (sigR.ok) {
        const _sigRaw = await sigR.json();
        const signals = Array.isArray(_sigRaw) ? _sigRaw : (Array.isArray(_sigRaw?.signals) ? _sigRaw.signals : []);
        if (Array.isArray(signals) && signals.length) {
          const container = document.getElementById('alerts-container');
          const sub = document.getElementById('alerts-sub');
          if (container) {
            function localizeSignalTime(timeStr) {
              if (!timeStr || timeStr === '--:--') return timeStr || '--:--';
              try {
                const [h, m] = timeStr.split(':').map(Number);
                if (isNaN(h) || isNaN(m)) return timeStr;
                const now = new Date();
                const utcDate = new Date(Date.UTC(
                  now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m
                ));
                return utcDate.toLocaleTimeString(navigator.language || 'en', {
                  hour: '2-digit', minute: '2-digit', hour12: false
                });
              } catch { return timeStr; }
            }
            function _dshEscHtml(s) {
              return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                .replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            function parseTitle(title) {
              if (!title) return null;
              const parts = title.split(' — ');
              if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null;
              return { pair: parts[0].trim(), badge: parts[1].trim() };
            }
            const FOOTER_RE = /Trade bias:\s*([\s\S]+?)\s*Catalyst:\s*([\s\S]+?)\s*Risk:\s*([\s\S]+)$/;
            function parseFooter(text) {
              if (!text) return null;
              const m = text.match(FOOTER_RE);
              if (!m) return null;
              const body = text.slice(0, m.index).trim();
              return { body, bias: m[1].trim(), catalyst: m[2].trim(), risk: m[3].trim() };
            }

            container.innerHTML = signals.map(s => {
              const sevCls = s.priority === 'critical' ? 'a-sev-crit' : s.priority === 'warning' ? 'a-sev-warn' : 'a-sev-info';
              const sevTitle = s.priority === 'critical' ? 'High priority' : s.priority === 'warning' ? 'Medium priority' : 'Low priority';
              const dotCls = s.priority === 'critical' ? 'a-crit' : s.priority === 'warning' ? 'a-warn' : 'a-info';
              const localTime = localizeSignalTime(s.time);
              const ev = Array.isArray(s.evidence) && s.evidence.length ? s.evidence : [];
              const evTooltip = ev.length ? ev.join(' · ') : '';
              const evHtml = ev.length
                ? `<div class="a-evidence" aria-label="Signal data sources">${ev.map(e => `<span class="a-ev-chip">${_dshEscHtml(e)}</span>`).join('')}</div>`
                : '';
              const evTooltipEsc = _dshEscHtml(evTooltip);

              const titleParts = parseTitle(s.title);
              const footerParts = parseFooter(s.text);

              if (titleParts && footerParts) {
                return `<div class="alert-row" ${evTooltipEsc ? `title="${evTooltipEsc}"` : ''}>
                  <div class="a-text">
                    <div class="a-head">
                      <span class="a-name"><span class="a-sev ${sevCls}" role="img" aria-label="${sevTitle}" title="${sevTitle}"></span><span class="a-pair">${_dshEscHtml(titleParts.pair)}</span></span>
                      <span class="a-badge">Regime: ${_dshEscHtml(titleParts.badge)} · ${localTime}</span>
                    </div>
                    <span class="a-desc">${_dshEscHtml(footerParts.body)}</span>
                    <div class="a-foot">
                      <div class="a-foot-line"><span class="a-foot-lbl">Trade bias:</span> ${_dshEscHtml(footerParts.bias)}</div>
                      <div class="a-foot-line"><span class="a-foot-lbl">Catalyst:</span> ${_dshEscHtml(footerParts.catalyst)}</div>
                      <div class="a-foot-line"><span class="a-foot-lbl">Risk:</span> ${_dshEscHtml(footerParts.risk)}</div>
                    </div>
                  </div>
                </div>`;
              }

              return `<div class="alert-row${ev.length ? ' a-has-ev' : ''}" ${evTooltipEsc ? `title="${evTooltipEsc}"` : ''}>
                <span class="a-time">${localTime}</span>
                <span class="a-dot ${dotCls}"></span>
                <div class="a-text"><strong>${_dshEscHtml(s.title || '')}</strong>${s.title ? ' — ' : ''}${_dshEscHtml(s.text || '')}${evHtml}</div>
              </div>`;
            }).join('');
          }
          if (sub) {
            const now = new Date();
            const hhmm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
            const tzAbbr = now.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
            sub.textContent = signals.length + ' active · AI-generated · loaded ' + hhmm + ' ' + tzAbbr + ' · Not investment advice';
          }

          maybeNotifyNewSignals(signals);
        }
      }
    } catch {}

  } catch(e) { console.warn('Narrative build failed:', e); }
}

async function fetchReferenceSpreads() {
  try {
    const ECN_FLOOR = {
      eurusd: 0.1, gbpusd: 0.2, usdjpy: 0.1,
      audusd: 0.2, usdchf: 0.2, usdcad: 0.2, nzdusd: 0.3,
    };
    const VOL_COEF = {
      eurusd: 0.035, gbpusd: 0.045, usdjpy: 0.030,
      audusd: 0.060, usdchf: 0.055, usdcad: 0.050, nzdusd: 0.070,
    };

    const intradayData = await loadIntradayQuotes();
    if (!intradayData) return;   

    const quotes = intradayData.quotes || {};
    const hv30   = intradayData.hv30  || {};

    const vix  = quotes.vix?.close  || 15;
    const move = quotes.move?.close  || 80;

    const vixMult  = Math.min(2.0, Math.max(1.0, 1.0 + (vix  - 15) / 30));
    const moveMult = Math.min(1.3, Math.max(1.0, 1.0 + (move - 80) / 200));

    const computed = {};
    for (const pair of Object.keys(ECN_FLOOR)) {
      const hv      = hv30[pair] ?? quotes[pair]?.hv30 ?? 8.0;
      const isRates = pair === 'usdjpy' || pair === 'usdchf';
      const volMult = isRates ? vixMult * moveMult : vixMult;
      const raw     = ECN_FLOOR[pair] + hv * VOL_COEF[pair] * volMult;
      computed[pair] = Math.max(ECN_FLOOR[pair], Math.round(raw * 10) / 10);
    }

    let _spreadsChanged = false;
    for (const [pair, pips] of Object.entries(computed)) {
      if (LIVE_SPREADS[pair] !== pips) { LIVE_SPREADS[pair] = pips; _spreadsChanged = true; }
    }
    if (_spreadsChanged && Object.keys(STOOQ_RT_CACHE).length > 0) updateFxPairsTableRT();

    const MAX_PIP = 5.0;
    const pairMap = {
      eurusd: 'spr-eurusd', gbpusd: 'spr-gbpusd', usdjpy: 'spr-usdjpy',
      audusd: 'spr-audusd', usdchf: 'spr-usdchf', usdcad: 'spr-usdcad',
      nzdusd: 'spr-nzdusd',
    };

    for (const [pair, elId] of Object.entries(pairMap)) {
      const pips = computed[pair];
      if (pips == null) continue;
      const el = document.getElementById(elId);
      if (!el) continue;
      const fillEl = el.closest('.spread-row')?.querySelector('.spr-fill');

      const color = pips <= 1.0 ? 'var(--up)' : pips <= 2.0 ? 'var(--orange)' : 'var(--down)';
      const cls   = pips <= 1.0 ? 'up'        : pips <= 2.0 ? ''              : 'down';

      el.textContent = pips.toFixed(1) + ' pip';
      el.className   = 'spr-val' + (cls ? ' ' + cls : '');
      el.style.color = cls ? '' : 'var(--orange)';

      if (fillEl) {
        fillEl.style.width      = Math.min(100, (pips / MAX_PIP) * 100) + '%';
        fillEl.style.background = color;
      }
    }

    const sub = document.getElementById('spreads-sub');
    if (sub) {
      const _sprNow = new Date();
      const _sprHHMM = _sprNow.getHours().toString().padStart(2,'0') + ':' + _sprNow.getMinutes().toString().padStart(2,'0');
      const _sprTZ = _sprNow.toLocaleTimeString('en', {timeZoneName:'short'}).split(' ').pop() || 'LT';
      const regime = vix < 20 ? 'Low vol' : vix < 28 ? 'Elevated vol' : 'High vol';
      sub.textContent = `ECN est. · ${regime} · VIX ${vix.toFixed(1)} · ${_sprHHMM} ${_sprTZ}`;
    }

  } catch(e) { console.warn('[Spreads] Failed:', e); }
}

async function computeSessionVol() {
  try {
    const data = await loadIntradayQuotes();
    if (!data?.quotes) return;

    const eur = data.quotes.eurusd;
    const jpy = data.quotes.usdjpy;
    if (!eur?.hv30 || !jpy?.hv30) return;

    const SESSION_RATIO_EUR = { syd: 0.28, tok: 0.50, lon: 0.87, ny: 0.83 };
    const SESSION_RATIO_JPY = { syd: 0.25, tok: 0.65, lon: 0.72, ny: 0.80 };  

    const dailyEur = eur.close * (eur.hv30 / 100) / Math.sqrt(252) * 10000;
    const dailyJpy = jpy.close * (jpy.hv30 / 100) / Math.sqrt(252) * 100;

    const sessions = [
      { key: 'syd', eurId: 'svol-syd-eur', jpyId: 'svol-syd-jpy' },
      { key: 'tok', eurId: 'svol-tok-eur', jpyId: 'svol-tok-jpy' },
      { key: 'lon', eurId: 'svol-lon-eur', jpyId: 'svol-lon-jpy' },
      { key: 'ny',  eurId: 'svol-ny-eur',  jpyId: 'svol-ny-jpy'  },
    ];

    sessions.forEach(({ key, eurId, jpyId }) => {
      const eurPips = Math.round(dailyEur * SESSION_RATIO_EUR[key]);
      const jpyPips = Math.round(dailyJpy * SESSION_RATIO_JPY[key]);

      const eurCls = eurPips < 25 ? 'flat' : eurPips < 55 ? '' : 'up';
      const jpyCls = jpyPips < 30 ? 'flat' : jpyPips < 60 ? '' : 'up';

      const elEur = document.getElementById(eurId);
      const elJpy = document.getElementById(jpyId);
      if (elEur) { elEur.textContent = `±${eurPips}p`; elEur.className = eurCls; }
      if (elJpy) { elJpy.textContent = `±${jpyPips}p`; elJpy.className = jpyCls; }
    });

    const sub = document.getElementById('svol-sub');
    if (sub) sub.textContent = `HV30 ${eur.hv30.toFixed(1)}% · 5yr historical session ratios`;  

  } catch(e) { console.warn('[SessionVol] Failed:', e); }
}

async function boot() {
  fetchFrankfurter();                

  await loadIntradayQuotes();

  window._quotesReadyPromise = fetchQuoteBarRT();
  await window._quotesReadyPromise;
  if (typeof initFxWebSocket === 'function') initFxWebSocket();
  await window._quotesReadyPromise;
  loadFxPerfData().then(() => populateFxPairsTable()); 
  populateCorrelations(); 

  fetchCBRates().then(() => fetchCarryRanking());   
  fetchVolLeaderboard();
  fetchCOTData();
  fetchFedExpectations();
  fetchOptionSkew().then(() => attachRiskMonitorTooltips());
  fetchCarryData();
  initAlerts();
  fetchNewsData();
  fetchReferenceSpreads();          
  computeSessionVol();              

  await loadAIRegime();

  fetchRiskData();
  fetchCrossAssetData();
  fetchCommodityQuotes();
  renderFairValue();
  renderDollarSmile(); 
  buildRichNarrative().then(() => {
    const _m = document.getElementById('main');
    if (_m) _m.scrollTop = 0;
    setTimeout(() => { if (_m) _m.scrollTop = 0; }, 300);
  });
  setTimeout(fetchSentiment, 800);   

  const _rp = document.getElementById('rightpanel');
  if (_rp) _rp.scrollTop = 0;
  const _main = document.getElementById('main');
  if (_main) _main.scrollTop = 0;
}

boot();

setInterval(fetchQuoteBarRT, 60 * 1000);
setInterval(fetchFrankfurter, 30 * 60 * 1000);
setInterval(fetchNewsData, 2 * 60 * 1000);
setInterval(buildRichNarrative, 3 * 60 * 1000);

(function initCBRatesPoll() {
  let _lastRatesRun = null;  
  async function _pollCBRates() {
    try {
      const res = await fetch('./rates/health.json', { cache: 'no-store' });
      if (!res.ok) return;
      const h = await res.json();
      const runTs = h.run || h.timestamp || null;
      if (!runTs) return;
      if (_lastRatesRun === null) {
        _lastRatesRun = runTs;
        return;
      }
      if (runTs !== _lastRatesRun) {
        _lastRatesRun = runTs;
        console.log('[CB Rates poll] New rates run detected (' + runTs + ') — refreshing…');
        await fetchCBRates();
        fetchCarryRanking();
        if (typeof fetchFedExpectations === 'function') fetchFedExpectations();
      }
    } catch (_e) {  }
  }
  setInterval(_pollCBRates, 5 * 60 * 1000);  
})();

(function() {
  const main = document.getElementById('main');
  const rightPanel = document.getElementById('rightpanel');
  const RIGHT_PANEL_TARGETS = new Set(['section-cbrates']);

  document.querySelectorAll('.top-nav a[data-target]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.dataset.target;
      document.querySelectorAll('.top-nav a').forEach(a => a.classList.remove('active'));
      this.classList.add('active');

      if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const el = document.getElementById(target);
      if (!el) return;

      if (RIGHT_PANEL_TARGETS.has(target) && rightPanel) {
        const mainScrollable = main && main.scrollHeight > main.clientHeight && getComputedStyle(main).overflowY !== 'visible';
        if (mainScrollable) {
          const offset = el.offsetTop - rightPanel.offsetTop;
          rightPanel.scrollTo({ top: offset - 4, behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      const mainScrollable = main && main.scrollHeight > main.clientHeight && getComputedStyle(main).overflowY !== 'visible';
      if (mainScrollable) {
        const offset = el.offsetTop - (main.offsetTop || 0);
        main.scrollTo({ top: offset - 4, behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

const LIQ_BASE = [18,14,11,10,12,20,30,42,58,68,72,70,72,82,95,100,95,80,68,55,42,30,22,20];

let _liqData     = null;
let _liqBaseline = null;
let _liqSource   = null;
let _narrativeGeneratedAt = null; 
let _narrativeAiRegime   = null; 

function _liqTo48(arr24) {
  return Array.from({length:48}, (_,i) => {
    const h = i/2, idx=Math.floor(h)%24, next=(idx+1)%24, frac=h-Math.floor(h);
    return arr24[idx]*(1-frac) + arr24[next]*frac;
  });
}

async function fetchLiquidityData() {
  const utcDay = new Date().getUTCDay(), utcHour = new Date().getUTCHours();
  const isWeekend = utcDay === 6 || (utcDay === 0 && utcHour < 21) || (utcDay === 5 && utcHour >= 21);

  try {
    const r = await fetch('/fx-data/fx-liquidity.json');
    if (!r.ok) throw new Error('fx-liquidity.json not available');
    const d = await r.json();

    if (!d.baseline_30d || d.baseline_30d.length !== 24) throw new Error('malformed baseline');

    _liqBaseline = _liqTo48(isWeekend ? Array(24).fill(2) : d.baseline_30d);

    const todayRaw = (d.today && d.today.length === 24) ? d.today : d.baseline_30d;
    const hoursComplete = d.hours_complete || 0;
    const nowH = new Date().getUTCHours() + new Date().getUTCMinutes()/60;

    const today24 = Array.from({length:24}, (_,h) => {
      if (isWeekend) return 2;
      if (h < hoursComplete && todayRaw[h] > 0) return todayRaw[h];   
      if (h >= Math.floor(nowH)) return d.baseline_30d[h];             
      return d.baseline_30d[h];                                          
    });

    _liqData   = _liqTo48(today24);
    _liqSource = d.fallback ? 'Historical avg · fixed reference' : 'H-L range proxy · 30d avg';
    return;
  } catch(e) {
  }

  try {
    const r = await fetch('/fx-data/frankfurter.json');
    if (!r.ok) throw new Error('FX rates cache not available');
    const cacheData = await r.json();
    const rates = Object.values((cacheData.series && cacheData.series.rates) ? cacheData.series.rates : {});
    let volScalar = 1.0;
    if (rates.length >= 2) {
      const changes = [];
      for (let i = 1; i < rates.length; i++) {
        const prev = rates[i-1], cur = rates[i];
        if (prev.USD && cur.USD) changes.push(Math.abs(cur.USD - prev.USD) / prev.USD);
        if (prev.GBP && cur.GBP) changes.push(Math.abs(cur.GBP - prev.GBP) / prev.GBP);
        if (prev.JPY && cur.JPY) changes.push(Math.abs(cur.JPY - prev.JPY) / prev.JPY);
      }
      const avgChange = changes.reduce((a,b)=>a+b,0)/changes.length || 0.005;
      volScalar = Math.min(2.0, Math.max(0.5, avgChange / 0.005));
    }
    const nowUTC = new Date().getUTCHours() + new Date().getUTCMinutes()/60;
    _liqData = Array.from({length:48}, (_,i) => {
      if (isWeekend) return 2;
      const h=i/2, idx=Math.floor(h)%24, next=(idx+1)%24, frac=h-Math.floor(h);
      const v = LIQ_BASE[idx]*(1-frac)+LIQ_BASE[next]*frac;
      return Math.max(2, v * (h > nowUTC ? 0.75 : volScalar));
    });
    _liqBaseline = _liqTo48(isWeekend ? Array(24).fill(2) : LIQ_BASE);
    _liqSource   = 'Historical avg · fixed reference';
    return;
  } catch(e) {  }

  const base48 = _liqTo48(isWeekend ? Array(24).fill(2) : LIQ_BASE);
  _liqData     = base48;
  _liqBaseline = base48;
  _liqSource   = 'Historical avg · fixed reference';
}

function drawLiquidityChart() {
  const canvas = document.getElementById('liquidity-canvas');
  if (!canvas) return;
  const W = canvas.parentElement.clientWidth - 16, H = 110;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const utcDay = new Date().getUTCDay();
  const utcHour = new Date().getUTCHours();
  const isWeekend = utcDay === 6 || (utcDay === 0 && utcHour < 21) || (utcDay === 5 && utcHour >= 21);

  const hours = _liqData || _liqTo48(isWeekend ? Array(24).fill(2) : LIQ_BASE);
  const baseline = _liqBaseline || hours;

  const PAD_L=4, PAD_R=4, PAD_T=8, PAD_B=18;
  const cW=W-PAD_L-PAD_R, cH=H-PAD_T-PAD_B;
  const maxV=Math.max(...hours, ...baseline, 10);

  const OFFSET = 42; 
  const sa = i => (i + OFFSET) % 48;            
  const sc = i => (i - OFFSET + 48) % 48;       

  const px = i => PAD_L + (i / 47) * cW;        
  const py = v => PAD_T + (1 - v / maxV) * cH;

  const nowH = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  const nowArraySlot = Math.min(47, Math.floor(nowH * 2));
  const nowCanvasSlot = sc(nowArraySlot);
  const nowX = PAD_L + (nowCanvasSlot / 47) * cW;

  ctx.clearRect(0, 0, W, H);

  if (!isWeekend) {
    const _liqNow = new Date();
    const _liqBandColors = { sydney:'rgba(120,100,255,0.07)', tokyo:'rgba(79,127,255,0.07)', london:'rgba(38,166,154,0.08)', newyork:'rgba(246,148,28,0.06)' };
    const drawBand = (aStart, aEnd, color) => {
      let cStart = sc(aStart), cEnd = sc(aEnd);
      if (cEnd <= cStart) cEnd = 47; 
      ctx.fillStyle = color;
      ctx.fillRect(PAD_L + (cStart/47)*cW, PAD_T, ((cEnd-cStart)/47)*cW, cH);
    };
    SESSION_DEFS.forEach(s => {
      const openUTC  = localHourToUTC(s.zone, s.openLocal, _liqNow);
      const closeUTC = localHourToUTC(s.zone, s.closeLocal, _liqNow);
      const aStart = openUTC * 2;
      const aEnd   = (closeUTC <= openUTC ? closeUTC + 24 : closeUTC) * 2; 
      drawBand(aStart, aEnd, _liqBandColors[s.id]);
    });
  }

  if (!isWeekend) {
    const gradPast = ctx.createLinearGradient(0,PAD_T,0,PAD_T+cH);
    gradPast.addColorStop(0,'rgba(79,127,255,0.32)');
    gradPast.addColorStop(1,'rgba(79,127,255,0.03)');
    ctx.beginPath();
    for (let ci=0; ci<=nowCanvasSlot; ci++) {
      const v = hours[sa(ci)];
      ci===0 ? ctx.moveTo(px(ci),py(v)) : ctx.lineTo(px(ci),py(v));
    }
    ctx.lineTo(nowX,PAD_T+cH); ctx.lineTo(px(0),PAD_T+cH); ctx.closePath();
    ctx.fillStyle=gradPast; ctx.fill();

    const gradFut = ctx.createLinearGradient(0,PAD_T,0,PAD_T+cH);
    gradFut.addColorStop(0,'rgba(79,127,255,0.10)');
    gradFut.addColorStop(1,'rgba(79,127,255,0.01)');
    ctx.beginPath();
    ctx.moveTo(nowX, py(hours[sa(nowCanvasSlot)]));
    for (let ci=nowCanvasSlot+1; ci<48; ci++) ctx.lineTo(px(ci),py(hours[sa(ci)]));
    ctx.lineTo(px(47),PAD_T+cH); ctx.lineTo(nowX,PAD_T+cH); ctx.closePath();
    ctx.fillStyle=gradFut; ctx.fill();

    ctx.beginPath(); ctx.strokeStyle=_themeColor('--chart-line'); ctx.lineWidth=1.5; ctx.setLineDash([]);
    for (let ci=0; ci<=nowCanvasSlot; ci++) {
      const v = hours[sa(ci)];
      ci===0 ? ctx.moveTo(px(ci),py(v)) : ctx.lineTo(px(ci),py(v));
    }
    ctx.stroke();

    ctx.beginPath(); ctx.strokeStyle='rgba(79,127,255,0.35)'; ctx.lineWidth=1.2; ctx.setLineDash([3,4]);
    ctx.moveTo(nowX, py(hours[sa(nowCanvasSlot)]));
    for (let ci=nowCanvasSlot+1; ci<48; ci++) ctx.lineTo(px(ci),py(hours[sa(ci)]));
    ctx.stroke(); ctx.setLineDash([]);

    ctx.strokeStyle='rgba(246,148,28,0.6)'; ctx.lineWidth=1; ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.moveTo(nowX,PAD_T); ctx.lineTo(nowX,PAD_T+cH); ctx.stroke();
    ctx.setLineDash([]);

  } else {
    const grad=ctx.createLinearGradient(0,PAD_T,0,PAD_T+cH);
    grad.addColorStop(0,'rgba(120,123,134,0.15)'); grad.addColorStop(1,'rgba(79,127,255,0.03)');
    ctx.beginPath();
    for (let ci=0; ci<48; ci++) {
      const v = hours[sa(ci)];
      ci===0 ? ctx.moveTo(px(ci),py(v)) : ctx.lineTo(px(ci),py(v));
    }
    ctx.lineTo(px(47),PAD_T+cH); ctx.lineTo(px(0),PAD_T+cH); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.strokeStyle=_themeColor('--border2'); ctx.lineWidth=1.5;
    for (let ci=0; ci<48; ci++) {
      const v = hours[sa(ci)];
      ci===0 ? ctx.moveTo(px(ci),py(v)) : ctx.lineTo(px(ci),py(v));
    }
    ctx.stroke();
    ctx.fillStyle='rgba(120,123,134,0.5)'; ctx.font='9px Courier New'; ctx.textAlign='center';
    ctx.fillText('MARKET CLOSED — WEEKEND', W/2, PAD_T+cH/2);
  }

  ctx.fillStyle=_themeColor('--text3'); ctx.font='8px Courier New'; ctx.textAlign='center';
  [0, 8, 16, 24, 32, 40, 47].forEach(ci => {
    const arraySlot = sa(ci);
    const d = new Date();
    d.setUTCHours(Math.floor(arraySlot / 2), arraySlot % 2 === 0 ? 0 : 30, 0, 0);
    const lh = d.getHours(), lm = d.getMinutes();
    const lbl = lm === 0 ? lh.toString().padStart(2, '0') : lh.toString().padStart(2, '0') + ':' + lm.toString().padStart(2, '0');
    ctx.fillText(lbl, PAD_L+(ci/47)*cW, H-4);
  });

  const now = new Date();
  const localH = now.getHours().toString().padStart(2,'0');
  const localM = now.getMinutes().toString().padStart(2,'0');
  const tzShort = now.toLocaleTimeString('en',{timeZoneName:'short'}).split(' ').pop() || 'LT';
  setEl('liq-time-label', localH + ':' + localM + ' ' + tzShort);
  if (isWeekend) {
    const reopenDate = new Date();
    const daysUntilSun = (7 - reopenDate.getUTCDay()) % 7;
    reopenDate.setUTCDate(reopenDate.getUTCDate() + (daysUntilSun === 0 ? 0 : daysUntilSun));
    reopenDate.setUTCHours(21, 0, 0, 0);
    const rH = reopenDate.getHours().toString().padStart(2,'0');
    const rM = reopenDate.getMinutes().toString().padStart(2,'0');
    setEl('liq-peak-label', 'Sun ' + rH + ':' + rM);
  } else {
    const peakCanvasSlot = hours.indexOf(Math.max(...hours));
    const peakArraySlot = (peakCanvasSlot + OFFSET) % 48;
    const peakUTC = new Date(); peakUTC.setUTCHours(Math.floor(peakArraySlot/2), peakArraySlot%2===0?0:30, 0, 0);
    const pH = peakUTC.getHours().toString().padStart(2,'0');
    const pM = peakUTC.getMinutes().toString().padStart(2,'0');
    setEl('liq-peak-label', 'Peak ' + pH + ':' + pM);
  }
}

fetchLiquidityData().then(() => {
  if (_liqSource) setEl('liq-source-label', _liqSource);
  drawLiquidityChart();
});
setInterval(() => fetchLiquidityData().then(() => {
  if (_liqSource) setEl('liq-source-label', _liqSource);
  drawLiquidityChart();
}), 30 * 60 * 1000);
setInterval(drawLiquidityChart, 60 * 1000);
window.addEventListener('resize', drawLiquidityChart);

(function() {
  function getActiveSessions(utcH) {
    const now = new Date();
    const active = SESSION_DEFS.map(s => {
      const openUTC  = localHourToUTC(s.zone, s.openLocal, now);
      const closeUTC = localHourToUTC(s.zone, s.closeLocal, now);
      const isActive = closeUTC < openUTC
        ? (utcH >= openUTC || utcH < closeUTC)   
        : (utcH >= openUTC && utcH < closeUTC);
      return isActive ? (s.id === 'newyork' ? 'New York' : s.id.charAt(0).toUpperCase() + s.id.slice(1)) : null;
    }).filter(Boolean);
    return active.length ? active.join(' + ') : 'Inter-session';
  }

  function volLabel(pct) {
    if (pct >= 85) return 'Very High (' + pct + '%)';
    if (pct >= 60) return 'High (' + pct + '%)';
    if (pct >= 35) return 'Moderate (' + pct + '%)';
    if (pct >= 15) return 'Low (' + pct + '%)';
    return 'Very Low (' + pct + '%)';
  }

  const canvas = document.getElementById('liquidity-canvas');
  const tooltip = document.getElementById('liq-tooltip');
  if (!canvas || !tooltip) return;

  canvas.addEventListener('mousemove', function(e) {
    const hours = _liqData;
    if (!hours) return;
    const baseline = _liqBaseline || hours;

    const rect = canvas.getBoundingClientRect();
    const PAD_L = 4, PAD_R = 4, PAD_T = 8, PAD_B = 18;
    const W = canvas.width, H = canvas.height;
    const cW = W - PAD_L - PAD_R;

    const scaleX = W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    if (mouseX < PAD_L || mouseX > W - PAD_R) { tooltip.style.display = 'none'; return; }

    const frac = (mouseX - PAD_L) / cW;
    const canvasSlot = Math.max(0, Math.min(47, Math.round(frac * 47)));
    const OFFSET = 42;
    const slot = (canvasSlot + OFFSET) % 48;  
    const utcH = slot / 2;

    const hh = Math.floor(utcH).toString().padStart(2,'0');
    const mm = utcH % 1 === 0 ? '00' : '30';

    const d = new Date(); d.setUTCHours(Math.floor(utcH), utcH%1===0?0:30, 0, 0);
    const localHH = d.getHours().toString().padStart(2,'0');
    const localMM = d.getMinutes().toString().padStart(2,'0');
    const tzShort = d.toLocaleTimeString('en',{timeZoneName:'short'}).split(' ').pop() || 'LT';

    const maxBaseline = Math.max(...baseline, 10);
    const v    = hours[slot];
    const vRef = baseline[slot];
    const pct  = Math.round((v / maxBaseline) * 100);

    const nowArraySlot = Math.floor(new Date().getUTCHours()*2 + new Date().getUTCMinutes()/30);
    const nowCanvasSlot = (nowArraySlot - OFFSET + 48) % 48;
    const isPast = canvasSlot <= nowCanvasSlot;

    let vsAvg = '';
    if (isPast && vRef > 0 && _liqBaseline && _liqBaseline !== _liqData) {
      const diff = Math.round(((v - vRef) / vRef) * 100);
      if (diff > 8)       vsAvg = '  ↑ +' + diff + '% vs 30d avg';
      else if (diff < -8) vsAvg = '  ↓ ' + diff + '% vs 30d avg';
      else                vsAvg = '  ≈ in line with 30d avg';
    }

    const ttW = tooltip.style.display === 'block' ? (tooltip.offsetWidth || 170) : 170;
    const ttH = tooltip.style.display === 'block' ? (tooltip.offsetHeight || 56) : 56;

    document.getElementById('liq-tt-time').textContent = hh + ':' + mm + ' UTC  (' + localHH + ':' + localMM + ' ' + tzShort + ')';
    document.getElementById('liq-tt-session').textContent = '▸ ' + getActiveSessions(Math.floor(utcH));
    document.getElementById('liq-tt-vol').textContent = (isPast ? '⬤' : '○') + ' ' + (isPast ? '' : '(est.) ') + volLabel(pct) + vsAvg;

    let left = e.clientX + 14;
    let top  = e.clientY - ttH / 2;
    if (left + ttW > window.innerWidth - 8) left = e.clientX - ttW - 14;
    if (top < 4) top = 4;
    if (top + ttH > window.innerHeight - 4) top = window.innerHeight - ttH - 4;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = top  + 'px';
    tooltip.style.display = 'block';
  });

  canvas.addEventListener('mouseleave', function() {
    tooltip.style.display = 'none';
  });
})();

setInterval(() => { fetchRiskData(); fetchCrossAssetData(); fetchCommodityQuotes(); fetchOptionSkew().then(() => attachRiskMonitorTooltips()); fetchVolLeaderboard(); }, 2 * 60 * 1000);
setInterval(fetchCarryData,    30 * 60 * 1000);
setInterval(fetchCarryRanking, 30 * 60 * 1000);
setInterval(fetchSentiment, 10 * 60 * 1000);   
setInterval(fetchFedExpectations, 30 * 60 * 1000);

(function() {
  function reloadActiveTVChart() {
    const activeTab = document.querySelector('.tv-tab.active');
    if (!activeTab) return;
    const sym = activeTab.dataset.sym;
    if (!sym) {
      activeTab.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      return;
    }
    const wrap = document.getElementById('tv-chart-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.cssText = 'height:100%;width:100%;';
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.cssText = 'height:100%;width:100%;';
    container.appendChild(widget);
    const copyright = document.createElement('div');
    copyright.className = 'tradingview-widget-copyright';
    copyright.style.display = 'none';
    container.appendChild(copyright);
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.text = JSON.stringify({
      allow_symbol_change:false, calendar:false, details:true,
      hide_side_toolbar:true, hide_top_toolbar:true, hide_legend:false,
      hide_volume:true, interval:'D', locale:'en', save_image:false,
      style:'1', symbol:sym, theme:'dark', timezone:'Etc/UTC',
      backgroundColor:_themeColor('--bg'), gridColor:_themeColorAlpha('--border', 0.8),
      withdateranges:false, studies:[{id:'MASimple@tv-basicstudies',inputs:{length:20}}], autosize:true
    });
    container.appendChild(script);
    wrap.appendChild(container);
  }

  function reloadTVCalendar() {
    const scaleWrap = document.getElementById('tvcal-scale');
    if (!scaleWrap) return;
    const container = scaleWrap.querySelector('.tradingview-widget-container');
    if (!container) return;
    const existingScript = container.querySelector('script');
    if (!existingScript) return;
    const clone = container.cloneNode(true);
    container.parentNode.replaceChild(clone, container);
  }

  function redrawLiquidityIfVisible() {
    const canvas = document.getElementById('liquidity-canvas');
    if (!canvas) return;
    if (canvas.parentElement.clientWidth > 0) drawLiquidityChart();
  }

  var isMobile = window.matchMedia('(pointer: coarse)').matches;

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState !== 'visible') return;
    setTimeout(function() {
      redrawLiquidityIfVisible();
      if (isMobile && _chartMode === 'tv') {
        reloadActiveTVChart();
        setTimeout(reloadTVCalendar, 800);
      }
    }, 350);
  });

  window.addEventListener('pageshow', function(e) {
    if (!e.persisted) return; 
    if (isMobile) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    const _rp = document.getElementById('rightpanel');
    if (_rp) _rp.scrollTop = 0;
    const _main = document.getElementById('main');
    if (_main) _main.scrollTop = 0;
    setTimeout(function() {
      redrawLiquidityIfVisible();
      if (isMobile && _chartMode === 'tv') {
        reloadActiveTVChart();
        setTimeout(reloadTVCalendar, 800);
      }
    }, 350);
  });

  const liqCanvas = document.getElementById('liquidity-canvas');
  if (liqCanvas && typeof IntersectionObserver !== 'undefined') {
    const obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          drawLiquidityChart();
          obs.unobserve(entry.target); 
        }
      });
    }, { threshold: 0.1 });
    obs.observe(liqCanvas);
  }
})();

(function initA11y() {
  const menuBtn = document.querySelector('.site-menu-btn');
  const siteMenu = document.querySelector('.site-menu');
  if (menuBtn && siteMenu) {
    siteMenu.addEventListener('focusin',  () => menuBtn.setAttribute('aria-expanded', 'true'));
    siteMenu.addEventListener('focusout', (e) => {
      if (!siteMenu.contains(e.relatedTarget)) {
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    siteMenu.addEventListener('mouseenter', () => menuBtn.setAttribute('aria-expanded', 'true'));
    siteMenu.addEventListener('mouseleave', () => menuBtn.setAttribute('aria-expanded', 'false'));
  }

  const tablist = document.getElementById('tv-pair-tabs');
  if (tablist) {
    tablist.addEventListener('click', (e) => {
      const btn = e.target.closest('.tv-tab');
      if (!btn) return;
      tablist.querySelectorAll('.tv-tab').forEach(t => {
        t.setAttribute('aria-selected', t === btn ? 'true' : 'false');
      });
    });
  }

  const topNavLinks = document.querySelectorAll('.top-nav a');
  topNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      topNavLinks.forEach(l => l.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'location');
    });
  });
  const firstNavLink = document.querySelector('.top-nav a.active');
  if (firstNavLink) firstNavLink.setAttribute('aria-current', 'location');

  if (!document.getElementById('sr-announce')) {
    const announce = document.createElement('div');
    announce.id = 'sr-announce';
    announce.setAttribute('role', 'status');
    announce.setAttribute('aria-live', 'polite');
    announce.setAttribute('aria-atomic', 'true');
    announce.className = 'sr-only';
    document.body.appendChild(announce);
  }
})();

(function () {
  function hideSkeleton(container) {
    const sk = container.querySelector('.tv-skeleton');
    if (!sk) return;
    sk.classList.add('loaded');
    setTimeout(() => sk.remove(), 350);
  }

  function watchForIframe(widgetEl) {
    if (!widgetEl) return;
    if (widgetEl.querySelector('iframe')) {
      hideSkeleton(widgetEl);
      return;
    }
    const obs = new MutationObserver(() => {
      if (widgetEl.querySelector('iframe')) {
        obs.disconnect();
        hideSkeleton(widgetEl);
      }
    });
    obs.observe(widgetEl, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); hideSkeleton(widgetEl); }, 8000);
  }

  watchForIframe(document.getElementById('tv-chart-widget'));
  watchForIframe(document.getElementById('tvcal-inner'));
}());

(function initTVWidgets() {
  var _chartLoaded   = false;
  var _eventsLoaded  = false;

  function loadTVEvents() {
    var scaleWrap = document.getElementById('tvcal-scale');
    if (!scaleWrap) return;
    var container = scaleWrap.querySelector('.tradingview-widget-container__widget');
    if (!container) return;
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src  = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    s.async = true;
    s.textContent = JSON.stringify({
      colorTheme: 'dark', isTransparent: true, locale: 'en',
      countryFilter: 'us,nz,au,ch,eu,ca,jp,gb',
      importanceFilter: '-1,0,1', width: '100%', height: '100%'
    });
    var skel = document.querySelector('#tvcal-inner .tv-skeleton');
    if (skel) skel.style.display = 'none';
    container.appendChild(s);
    _eventsLoaded = true;
  }

  if (typeof IntersectionObserver === 'undefined') {
    if (typeof loadTVChart === 'function') loadTVChart(window._tvCurrentSym || 'FX_IDC:EURUSD');
    loadTVEvents();
    return;
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      if (id === 'tv-chart-wrap' && !_chartLoaded) {
        if (typeof loadTVChart === 'function') {
          loadTVChart(window._tvCurrentSym || 'FX_IDC:EURUSD');
        }
        _chartLoaded = true;
        io.unobserve(entry.target);
      } else if (id === 'tvcal-inner' && !_eventsLoaded) {
        loadTVEvents();
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '150px' });

  function attachObservers() {
    var chartWrap = document.getElementById('tv-chart-wrap');
    var calInner  = document.getElementById('tvcal-inner');
    if (chartWrap) io.observe(chartWrap);
    if (calInner)  io.observe(calInner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachObservers);
  } else {
    attachObservers();
  }
}());

(function initKeyboardShortcuts() {
  const NAV_KEYS = {
    g: 'section-fxpairs',
    c: 'section-positioning',
    r: 'section-risk',
    x: 'section-crossasset',
    m: 'section-econmap',
    y: 'section-cbrates',
    k: 'section-tvcalendar',
    d: 'section-derivatives',
    n: 'section-news',
  };

  function navTo(target) {
    if (target === 'section-derivatives') {
      if (window._activeExclusivePanel === 'section-derivatives') {
        if (typeof window._derivNavHide === 'function') window._derivNavHide();
      } else {
        if (typeof window._derivNavShow === 'function') window._derivNavShow();
      }
      return;
    }
    if (target === 'section-news') {
      if (window._activeExclusivePanel === 'section-news') {
        if (typeof window._newsNavHide === 'function') window._newsNavHide();
      } else {
        if (typeof window._newsNavShow === 'function') window._newsNavShow();
      }
      return;
    }
    const link = document.querySelector(`.top-nav a[data-target="${target}"]`);
    if (link) link.click();
  }

  let _focusedRow = -1;

  function fxRows() {
    return Array.from(document.querySelectorAll('#fx-pairs-tbody tr[data-sym]'));
  }

  function activateFxRow(idx) {
    const rows = fxRows();
    if (!rows.length) return;
    _focusedRow = Math.max(0, Math.min(idx, rows.length - 1));
    const row = rows[_focusedRow];
    rows.forEach(r => r.classList.remove('kb-focus'));
    row.classList.add('kb-focus');
    row.scrollIntoView({ block: 'nearest' });
    const sym = row.dataset.sym;
    if (sym) loadTVChart(sym);
  }

  function toggleLegend() {
    let overlay = document.getElementById('kb-legend');
    if (overlay) { overlay.remove(); return; }
    overlay = document.createElement('div');
    overlay.id = 'kb-legend';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Keyboard shortcuts');
    overlay.innerHTML = `
      <div class="kbl-inner">
        <div class="kbl-title">Keyboard shortcuts</div>
        <div class="kbl-grid">
          <span class="kbl-key">G</span><span class="kbl-desc">FX Pairs table</span>
          <span class="kbl-key">C</span><span class="kbl-desc">COT Positioning</span>
          <span class="kbl-key">R</span><span class="kbl-desc">Risk Monitor</span>
          <span class="kbl-key">X</span><span class="kbl-desc">Cross-Asset</span>
          <span class="kbl-key">M</span><span class="kbl-desc">Macro map</span>
          <span class="kbl-key">Y</span><span class="kbl-desc">Rates &amp; Yield Curve</span>
          <span class="kbl-key">K</span><span class="kbl-desc">Economic Calendar</span>
          <span class="kbl-key">D</span><span class="kbl-desc">Derivatives (toggle)</span>
          <span class="kbl-key">N</span><span class="kbl-desc">News Feed (toggle)</span>
          <span class="kbl-key">B</span><span class="kbl-desc">Research (toggle)</span>
          <span class="kbl-key">&uarr;&darr;</span><span class="kbl-desc">Navigate FX rows</span>
          <span class="kbl-key">?</span><span class="kbl-desc">Close this panel</span>
        </div>
        <div class="kbl-footer">Press any key or click to close</div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => overlay.remove());
  }

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select'
        || document.activeElement?.isContentEditable) return;

    const key = e.key;

    if (key === '?') { e.preventDefault(); toggleLegend(); return; }

    const legend = document.getElementById('kb-legend');
    if (legend && key !== '?') { legend.remove(); }

    if (NAV_KEYS[key.toLowerCase()]) {
      e.preventDefault();
      navTo(NAV_KEYS[key.toLowerCase()]);
      return;
    }

    if (key === 'ArrowDown') {
      e.preventDefault();
      activateFxRow(_focusedRow < 0 ? 0 : _focusedRow + 1);
      return;
    }
    if (key === 'ArrowUp') {
      e.preventDefault();
      activateFxRow(_focusedRow <= 0 ? 0 : _focusedRow - 1);
      return;
    }
  });
})();

(function wireExportButtons() {
  function bind(id, type, format) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      exportPanel(type, format);
    });
  }
  bind('export-fx-csv',   'fx',    'csv');
  bind('export-fx-json',  'fx',    'json');
  bind('export-cot-csv',  'cot',   'csv');
  bind('export-cot-json', 'cot',   'json');
}());

function exportPanel(type, format = 'csv') {
  const ts = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '');
  let rows, headers, filename;

  if (type === 'fx') {
    headers = ['Pair', 'Price', '1D_Pct', '1W_Pct', 'HV30', 'Session_High', 'Session_Low'];
    rows = PAIRS.map(p => {
      const rt  = STOOQ_RT_CACHE[p.id];
      const p1w = rt?.pct1w ?? null;
      return [
        p.label || (p.base + '/' + p.quote),
        rt?.close  ?? '',
        rt?.pct    != null ? rt.pct.toFixed(4)  : '',
        p1w        != null ? p1w.toFixed(4)      : '',
        rt?.hv30   != null ? rt.hv30.toFixed(2) : '',
        rt?.high   ?? '',
        rt?.low    ?? '',
      ];
    }).filter(r => r[1] !== '');
    filename = 'gi_fx_pairs_' + ts;
  }

  else if (type === 'cot') {
    headers = ['Currency', 'LF_Net', 'Long_Pct', 'Short_Pct', 'AM_Net', 'Week_Ending'];
    rows = Object.entries(COT_DATA_CACHE).map(([ccy, d]) => {
      const total = (d.long || 0) + (d.short || 0);
      const lPct  = total > 0 ? (d.long  / total * 100).toFixed(1) : '';
      const sPct  = total > 0 ? (d.short / total * 100).toFixed(1) : '';
      return [ccy, d.net ?? '', lPct, sPct, d.amNet ?? '', d.weekEnding ?? ''];
    });
    filename = 'gi_cot_' + ts;
  }

  else if (type === 'yield') {
    headers = ['Tenor', 'Yield_Pct', 'Change'];
    rows = [];
    document.querySelectorAll('#yield-tbody tr, #yield-table-body tr').forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length >= 2) {
        const t = cells[0]?.textContent?.trim() || '';
        const y = cells[1]?.textContent?.trim() || '';
        const c = cells[2]?.textContent?.trim() || '';
        if (t && y) rows.push([t, y, c]);
      }
    });
    if (!rows.length) {
      [['US 3M','yc-3m'],['US 2Y','yc-2y'],['US 5Y','yc-5y'],
       ['US 10Y','yc-10y'],['US 30Y','yc-30y'],['DE 10Y','yc-de10y'],['JP 10Y','yc-jp10y']
      ].forEach(([label, id]) => {
        const el = document.getElementById(id);
        const v = el?.textContent?.trim();
        if (v && v !== '—') rows.push([label, v, '']);
      });
    }
    filename = 'gi_yield_curve_' + ts;
  }

  else if (type === 'carry') {
    headers = ['Long', 'Short', 'Carry_Diff_Pct', 'Long_Rate_Pct', 'Short_Rate_Pct'];
    const G8 = ['USD','EUR','GBP','JPY','AUD','CHF','CAD','NZD','NOK','SEK'];
    const rates = {};
    G8.forEach(ccy => {
      if (r != null) rates[ccy] = r;
    });
    const pairs = [];
    for (let i = 0; i < G8.length; i++) {
      for (let j = i + 1; j < G8.length; j++) {
        const a = G8[i], b = G8[j];
        if (rates[a] == null || rates[b] == null) continue;
        const diff = rates[a] - rates[b];
        pairs.push(diff >= 0
          ? [a, b, diff.toFixed(4), rates[a].toFixed(2), rates[b].toFixed(2)]
          : [b, a, (-diff).toFixed(4), rates[b].toFixed(2), rates[a].toFixed(2)]);
      }
    }
    pairs.sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));
    rows = pairs;
    filename = 'gi_carry_' + ts;
  }

  else { console.warn('[Export] Unknown panel type:', type); return; }

  if (!rows || !rows.length) {
    document.querySelectorAll('.export-btn').forEach(b => {
      if (b.textContent.trim() === format.toUpperCase()) {
        const orig = b.textContent;
        b.textContent = 'NO DATA'; b.style.color = 'var(--orange)';
        setTimeout(() => { b.textContent = orig; b.style.color = ''; }, 1800);
      }
    });
    console.warn('[Export] No data available for:', type);
    return;
  }

  let blob_content, mime, ext;
  if (format === 'json') {
    const data = rows.map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] !== '' ? r[i] : null; });
      return obj;
    });
    blob_content = JSON.stringify({ exported: new Date().toISOString(), panel: type, data }, null, 2);
    mime = 'application/json';
    ext = '.json';
  } else {
    const esc = v => (v == null || v === '') ? '' : String(v).includes(',') ? '"' + String(v) + '"' : String(v);
    blob_content = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
    mime = 'text/csv';
    ext = '.csv';
  }

  const encoded = 'data:' + mime + ';charset=utf-8,' + encodeURIComponent(blob_content);
  const a    = document.createElement('a');
  a.href = encoded;
  a.download = filename + ext;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 500);

  document.querySelectorAll('.export-btn').forEach(b => {
    if (b.textContent.trim() === ext.slice(1).toUpperCase()) {
      const orig = b.textContent;
      b.textContent = '✓'; b.style.color = 'var(--up)';
      setTimeout(() => { b.textContent = orig; b.style.color = ''; }, 1400);
    }
  });
}

const ALERTS_KEY = 'gi_alerts';

const ALERTS_LABELS = {
  vix:'VIX', eurusd:'EUR/USD', usdjpy:'USD/JPY', gbpusd:'GBP/USD',
  audusd:'AUD/USD', usdchf:'USD/CHF', xauusd:'Gold', us10y:'US 10Y', move:'MOVE',
  nzdusd:'NZD/USD', usdcad:'USD/CAD', dxy:'DXY', spx:'SPX', wti:'WTI', btc:'BTC',
};

const ADV_ALERT_TYPES = {
  'hv_iv_eurusd': {
    label: 'EUR/USD HV30 vs IV', category: 'spread',
    description: 'Fires when realised vol (HV30) diverges from implied vol (ATM IV). HV > IV = vol is cheap; HV < IV = vol is expensive.',
    getValue(intra) {
      const hv = STOOQ_RT_CACHE['eurusd']?.hv30 ?? null;
      const iv = intra?.fx_etf_iv?.eurusd?.iv ?? null;
      return (hv != null && iv != null) ? parseFloat((hv - iv).toFixed(2)) : null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)} vol pts`,
  },
  'hv_iv_gbpusd': {
    label: 'GBP/USD HV30 vs IV', category: 'spread',
    description: 'HV30 minus ATM IV for GBP/USD. Positive = realised vol above implied (vol cheap).',
    getValue(intra) {
      const hv = STOOQ_RT_CACHE['gbpusd']?.hv30 ?? null;
      const iv = intra?.fx_etf_iv?.gbpusd?.iv ?? null;
      return (hv != null && iv != null) ? parseFloat((hv - iv).toFixed(2)) : null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)} vol pts`,
  },
  'hv_iv_usdjpy': {
    label: 'USD/JPY HV30 vs IV', category: 'spread',
    description: 'HV30 minus ATM IV for USD/JPY. Positive = vol cheap relative to implied.',
    getValue(intra) {
      const hv = STOOQ_RT_CACHE['usdjpy']?.hv30 ?? null;
      const iv = intra?.fx_etf_iv?.usdjpy?.iv ?? null;
      return (hv != null && iv != null) ? parseFloat((hv - iv).toFixed(2)) : null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)} vol pts`,
  },
  'hv_iv_audusd': {
    label: 'AUD/USD HV30 vs IV', category: 'spread',
    description: 'HV30 minus ATM IV for AUD/USD.',
    getValue(intra) {
      const hv = STOOQ_RT_CACHE['audusd']?.hv30 ?? null;
      const iv = intra?.fx_etf_iv?.audusd?.iv ?? null;
      return (hv != null && iv != null) ? parseFloat((hv - iv).toFixed(2)) : null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)} vol pts`,
  },

  'ivrank_eurusd': {
    label: 'EUR/USD IV Rank', category: 'ivrank',
    description: 'IV Rank 0–100. Above 70 = historically expensive vol. Below 30 = historically cheap vol.',
    getValue(intra) { return intra?.fx_etf_iv?.eurusd?.iv_rank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'ivrank_gbpusd': {
    label: 'GBP/USD IV Rank', category: 'ivrank',
    description: 'IV Rank for GBP/USD (0–100 scale).',
    getValue(intra) { return intra?.fx_etf_iv?.gbpusd?.iv_rank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'ivrank_usdjpy': {
    label: 'USD/JPY IV Rank', category: 'ivrank',
    description: 'IV Rank for USD/JPY.',
    getValue(intra) { return intra?.fx_etf_iv?.usdjpy?.iv_rank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'ivrank_audusd': {
    label: 'AUD/USD IV Rank', category: 'ivrank',
    description: 'IV Rank for AUD/USD.',
    getValue(intra) { return intra?.fx_etf_iv?.audusd?.iv_rank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },

  'corr_usdjpy_vix': {
    label: 'USD/JPY vs VIX corr Z', category: 'corr',
    description: 'Z-score of rolling 60d correlation between USD/JPY and VIX vs its 252d historical norm. |Z| > 1.5 = regime break.',
    getValue(intra) {
      const c = (intra?.correlations || []).find(r => r.a === 'USD/JPY' && r.b === 'VIX');
      return c?.z_score ?? null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}σ`,
  },
  'corr_dxy_spx': {
    label: 'DXY vs SPX corr Z', category: 'corr',
    description: 'Z-score of DXY/SPX rolling correlation. Positive = both rising together (USD funding stress).',
    getValue(intra) {
      const c = (intra?.correlations || []).find(r => r.a === 'DXY' && r.b === 'SPX');
      return c?.z_score ?? null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}σ`,
  },
  'corr_gold_dxy': {
    label: 'Gold vs DXY corr Z', category: 'corr',
    description: 'Z-score of Gold/DXY rolling correlation. Positive break = Gold and USD rising together (inflation/safe-haven demand).',
    getValue(intra) {
      const c = (intra?.correlations || []).find(r => r.a === 'Gold' && r.b === 'DXY');
      return c?.z_score ?? null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}σ`,
  },
  'corr_audusd_gold': {
    label: 'AUD/USD vs Gold corr Z', category: 'corr',
    description: 'Z-score of AUD/USD vs Gold correlation. Break signals China/domestic risk overriding the commodity link.',
    getValue(intra) {
      const c = (intra?.correlations || []).find(r => r.a === 'AUD/USD' && r.b === 'Gold');
      return c?.z_score ?? null;
    },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}σ`,
  },

  'var_eurusd': {
    label: 'EUR/USD VaR 95% (1d)', category: 'var',
    description: '1-day Historical VaR 95% for EUR/USD, expressed as % of price. Rises during stressed regimes.',
    getValue(intra) { return intra?.var_cvar?.eurusd?.var_pct ?? null; },
    formatValue: v => `${v.toFixed(3)}%`,
  },
  'var_usdjpy': {
    label: 'USD/JPY VaR 95% (1d)', category: 'var',
    description: '1-day Historical VaR 95% for USD/JPY.',
    getValue(intra) { return intra?.var_cvar?.usdjpy?.var_pct ?? null; },
    formatValue: v => `${v.toFixed(3)}%`,
  },
  'var_gbpusd': {
    label: 'GBP/USD VaR 95% (1d)', category: 'var',
    description: '1-day Historical VaR 95% for GBP/USD.',
    getValue(intra) { return intra?.var_cvar?.gbpusd?.var_pct ?? null; },
    formatValue: v => `${v.toFixed(3)}%`,
  },
  'var_xauusd': {
    label: 'Gold VaR 95% (1d)', category: 'var',
    description: '1-day Historical VaR 95% for Gold (XAU/USD).',
    getValue(intra) { return intra?.var_cvar?.gold?.var_pct ?? null; },
    formatValue: v => `${v.toFixed(3)}%`,
  },
  'var_spx': {
    label: 'SPX VaR 95% (1d)', category: 'var',
    description: '1-day Historical VaR 95% for S&P 500.',
    getValue(intra) { return intra?.var_cvar?.spx?.var_pct ?? null; },
    formatValue: v => `${v.toFixed(3)}%`,
  },

  'rr_eurusd': {
    label: 'EUR/USD 25d RR (1M)', category: 'rr',
    description: '1-month 25-delta risk reversal for EUR/USD. Positive = call skew (market pays up for upside); negative = put skew (downside hedging demand).',
    getValue(ctx) { return ctx?.rr?.EURUSD?.rr25d ?? null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
  },
  'rr_gbpusd': {
    label: 'GBP/USD 25d RR (1M)', category: 'rr',
    description: '1-month 25-delta risk reversal for GBP/USD.',
    getValue(ctx) { return ctx?.rr?.GBPUSD?.rr25d ?? null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
  },
  'rr_usdjpy': {
    label: 'USD/JPY 25d RR (1M)', category: 'rr',
    description: '1-month 25-delta risk reversal for USD/JPY.',
    getValue(ctx) { return ctx?.rr?.USDJPY?.rr25d ?? null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
  },
  'rr_audusd': {
    label: 'AUD/USD 25d RR (1M)', category: 'rr',
    description: '1-month 25-delta risk reversal for AUD/USD.',
    getValue(ctx) { return ctx?.rr?.AUDUSD?.rr25d ?? null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
  },
  'rr_usdchf': {
    label: 'USD/CHF 25d RR (1M)', category: 'rr',
    description: '1-month 25-delta risk reversal for USD/CHF.',
    getValue(ctx) { return ctx?.rr?.USDCHF?.rr25d ?? null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
  },
  'rr_usdcad': {
    label: 'USD/CAD 25d RR (1M)', category: 'rr',
    description: '1-month 25-delta risk reversal for USD/CAD.',
    getValue(ctx) { return ctx?.rr?.USDCAD?.rr25d ?? null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
  },
  'cot_eur': {
    label: 'EUR COT Positioning Rank', category: 'cot',
    description: 'Leveraged Funds net position vs its own trailing 52-week range, 0–100. Same methodology as the COT Full Breakdown panel\u2019s Net Exposure % Rank chart. Above 80 / below 20 = crowded positioning relative to this currency\u2019s own recent history — not a fixed contract-count threshold.',
    getValue(ctx) { return _cotNetExposureRankDetail(ctx?.cot?.EUR)?.currentRank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'cot_gbp': {
    label: 'GBP COT Positioning Rank', category: 'cot',
    description: 'GBP Leveraged Funds net position 52-week rank (0\u2013100).',
    getValue(ctx) { return _cotNetExposureRankDetail(ctx?.cot?.GBP)?.currentRank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'cot_jpy': {
    label: 'JPY COT Positioning Rank', category: 'cot',
    description: 'JPY Leveraged Funds net position 52-week rank (0\u2013100).',
    getValue(ctx) { return _cotNetExposureRankDetail(ctx?.cot?.JPY)?.currentRank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'cot_aud': {
    label: 'AUD COT Positioning Rank', category: 'cot',
    description: 'AUD Leveraged Funds net position 52-week rank (0\u2013100).',
    getValue(ctx) { return _cotNetExposureRankDetail(ctx?.cot?.AUD)?.currentRank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'cot_cad': {
    label: 'CAD COT Positioning Rank', category: 'cot',
    description: 'CAD Leveraged Funds net position 52-week rank (0\u2013100).',
    getValue(ctx) { return _cotNetExposureRankDetail(ctx?.cot?.CAD)?.currentRank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'cot_chf': {
    label: 'CHF COT Positioning Rank', category: 'cot',
    description: 'CHF Leveraged Funds net position 52-week rank (0\u2013100).',
    getValue(ctx) { return _cotNetExposureRankDetail(ctx?.cot?.CHF)?.currentRank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },
  'cot_nzd': {
    label: 'NZD COT Positioning Rank', category: 'cot',
    description: 'NZD Leveraged Funds net position 52-week rank (0\u2013100).',
    getValue(ctx) { return _cotNetExposureRankDetail(ctx?.cot?.NZD)?.currentRank ?? null; },
    formatValue: v => `${v.toFixed(0)} rnk`,
  },

  'fv_eurusd': {
    label: 'EUR/USD Fair Value Z', category: 'fairvalue',
    description: 'FX Fair Value model Z-score (rate differential + risk sentiment, 60-business-day rolling regression). |Z| > 1 = spot trading away from the model\u2019s fair value estimate.',
    getValue(ctx) { const d = ctx?.fairValue?.eurusd; return (d && !d.accumulating) ? d.z ?? null : null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}\u03c3`,
  },
  'fv_gbpusd': {
    label: 'GBP/USD Fair Value Z', category: 'fairvalue',
    description: 'GBP/USD Fair Value model Z-score.',
    getValue(ctx) { const d = ctx?.fairValue?.gbpusd; return (d && !d.accumulating) ? d.z ?? null : null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}\u03c3`,
  },
  'fv_usdjpy': {
    label: 'USD/JPY Fair Value Z', category: 'fairvalue',
    description: 'USD/JPY Fair Value model Z-score.',
    getValue(ctx) { const d = ctx?.fairValue?.usdjpy; return (d && !d.accumulating) ? d.z ?? null : null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}\u03c3`,
  },
  'fv_audusd': {
    label: 'AUD/USD Fair Value Z', category: 'fairvalue',
    description: 'AUD/USD Fair Value model Z-score.',
    getValue(ctx) { const d = ctx?.fairValue?.audusd; return (d && !d.accumulating) ? d.z ?? null : null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}\u03c3`,
  },
  'fv_usdchf': {
    label: 'USD/CHF Fair Value Z', category: 'fairvalue',
    description: 'USD/CHF Fair Value model Z-score.',
    getValue(ctx) { const d = ctx?.fairValue?.usdchf; return (d && !d.accumulating) ? d.z ?? null : null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}\u03c3`,
  },
  'fv_usdcad': {
    label: 'USD/CAD Fair Value Z', category: 'fairvalue',
    description: 'USD/CAD Fair Value model Z-score.',
    getValue(ctx) { const d = ctx?.fairValue?.usdcad; return (d && !d.accumulating) ? d.z ?? null : null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}\u03c3`,
  },
  'fv_nzdusd': {
    label: 'NZD/USD Fair Value Z', category: 'fairvalue',
    description: 'NZD/USD Fair Value model Z-score.',
    getValue(ctx) { const d = ctx?.fairValue?.nzdusd; return (d && !d.accumulating) ? d.z ?? null : null; },
    formatValue: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}\u03c3`,
  },
};

function _liveRegime() {
  return document.getElementById('risk-regime')?.textContent?.trim() ?? null;
}

const ECO_FP_KEY = 'gi_eco_fp';

async function _buildEcoActualFp(currencies) {
  try {
    const res = await fetch('./calendar-data/economic-events.json', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return null;
    const ffj = await res.json();
    const todayISO = new Date().toISOString().slice(0, 10);
    const events = (ffj?.events || []).filter(ev => {
      const matchDate = ev.dateISO === todayISO;
      const hasActual = ev.actual && ev.actual !== '' && ev.actual !== '-';
      const matchCcy  = !currencies.length || currencies.includes(ev.currency);
      return matchDate && hasActual && matchCcy;
    });
    if (!events.length) return '';
    return events.map(ev => `${ev.currency}|${ev.dateISO}|${ev.timeUTC || ''}|${ev.event||ev.title||''}|${ev.actual}`).sort().join(';;');
  } catch { return null; }
}

function _ecoFpLoad() {
  try {
    const raw = localStorage.getItem(ECO_FP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const todayISO = new Date().toISOString().slice(0, 10);
    if (parsed.date !== todayISO) return {};
    return parsed;
  } catch { return {}; }
}

function _ecoFpSave(fp, date) {
  try { localStorage.setItem(ECO_FP_KEY, JSON.stringify({ fp, date })); } catch {}
}

window._ADV_OPTS      = ADV_ALERT_TYPES;
window.ALERTS_LABELS  = ALERTS_LABELS;

const SIG_NOTIF_KEY      = 'gi_sig_notif';
const SIG_NOTIF_SEEN_KEY = 'gi_sig_seen';   

function sigNotifEnabled() {
  return localStorage.getItem(SIG_NOTIF_KEY) === 'on';
}

function updateSignalNotifBtn() {
  const btn   = document.getElementById('sig-notif-btn');
  if (!btn) return;
  const on      = sigNotifEnabled();
  const blocked = typeof Notification !== 'undefined' && Notification.permission === 'denied';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.setAttribute('aria-label', on ? 'Signal notifications on' : 'Signal notifications off');
  btn.classList.toggle('sig-notif-on',      on && !blocked);
  btn.classList.toggle('sig-notif-blocked', blocked);
  btn.title = blocked
    ? 'Notifications blocked by browser — enable in site settings'
    : on ? 'Signal notifications ON — click to disable' : 'Signal notifications OFF — click to enable';
}

async function toggleSignalNotifications() {
  const wasOn = sigNotifEnabled();
  if (!wasOn) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { updateSignalNotifBtn(); return; }
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      updateSignalNotifBtn(); return;
    }
    localStorage.setItem(SIG_NOTIF_KEY, 'on');
  } else {
    localStorage.setItem(SIG_NOTIF_KEY, 'off');
  }
  updateSignalNotifBtn();
}

function sigFingerprint(signals) {
  if (!Array.isArray(signals) || !signals.length) return '';
  return signals.map(s => `${s.time}|${s.title}|${s.priority}`).join(';;');
}

function maybeNotifyNewSignals(signals) {
  if (!sigNotifEnabled()) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const fp     = sigFingerprint(signals);
  if (!fp) return;
  const lastFp = localStorage.getItem(SIG_NOTIF_SEEN_KEY) || '';
  if (!lastFp) {
    localStorage.setItem(SIG_NOTIF_SEEN_KEY, fp);
    return;
  }
  if (fp === lastFp) return;
  localStorage.setItem(SIG_NOTIF_SEEN_KEY, fp);
  const critCount = signals.filter(s => s.priority === 'critical').length;
  const warnCount = signals.filter(s => s.priority === 'warning').length;
  const parts = [];
  if (critCount) parts.push(`${critCount} critical`);
  if (warnCount) parts.push(`${warnCount} warning`);
  const body = parts.length
    ? `${signals.length} signals — ${parts.join(', ')}`
    : `${signals.length} market signals updated`;
  giFireAlert('New Signals', body, critCount ? 'critical' : warnCount ? 'warning' : 'info');
  try {
    new Notification('GI Terminal — New Signals', {
      body,
      icon: '/favicon-192x192.png',
      tag : 'gi-signals-update',
    });
  } catch {}
}

function alertsLoad() {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]'); } catch { return []; }
}
function alertsSave(arr) {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(arr)); } catch {}
}

function alertsCurrentValue(a, intra) {
  if (a.type === 'price' || !a.type) {
    const sym = a.sym;
    if (sym === 'vix')   return STOOQ_RT_CACHE['vix']?.close  ?? null;
    if (sym === 'move')  return STOOQ_RT_CACHE['move']?.close ?? null;
    if (sym === 'us10y') {
      const el = document.getElementById('yc-10y');
      const v  = parseFloat(el?.textContent);
      return isNaN(v) ? null : v;
    }
    return STOOQ_RT_CACHE[sym]?.close ?? null;
  }
  if (a.type === 'regime') {
    return _liveRegime();
  }
  const def = ADV_ALERT_TYPES[a.sym];
  if (!def) return null;
  return def.getValue(intra);
}

function alertFormatValue(a, v) {
  if (v == null) return null;
  if (a.type === 'regime') return v;
  if (a.type === 'eco_actual') {
    if (a.lastActuals?.length) return a.lastActuals.map(n => `${n.ccy}: ${n.actual}`).join(' · ');
    return 'new actual';
  }
  const def = ADV_ALERT_TYPES[a.sym];
  if (def?.formatValue) return def.formatValue(v);
  return v.toFixed(v > 10 ? 2 : 5);
}

function alertDescribeCondition(a) {
  if (a.type === 'regime') return `Regime = ${a.target}`;
  if (a.type === 'eco_actual') {
    const ccyLabel = a.currencies?.length ? a.currencies.join('/') : 'All G10';
    return `Eco actual released — ${ccyLabel}`;
  }
  const label = ADV_ALERT_TYPES[a.sym]?.label ?? ALERTS_LABELS[a.sym] ?? a.sym;
  const dirSym = a.dir === 'above' ? '>' : '<';
  return `${label} ${dirSym} ${a.threshold}`;
}

function alertsRender(intra) {
  const container = document.getElementById('alerts-rows');
  if (!container) return;
  const arr = alertsLoad();

  const firedCount = arr.filter(a => a.fired).length;
  const badge = document.getElementById('alerts-fired-badge');
  if (badge) {
    badge.textContent = firedCount;
    badge.style.display = firedCount > 0 ? 'inline-block' : 'none';
  }

  if (!arr.length) {
    container.innerHTML = '<div style="padding:5px 8px;font-size:10px;color:var(--text3);">No alerts set. Add one below.</div>';
    return;
  }

  container.innerHTML = arr.map(a => {
    const cls      = a.fired ? 'alert-row alert-row-active' : 'alert-row';
    const firedTxt = a.fired ? ` <span class="alert-fired">FIRED ${a.firedAt || ''}</span>` : '';
    const cur      = alertsCurrentValue(a, intra);
    const curFmt   = alertFormatValue(a, cur);
    const curTxt   = curFmt != null ? ` · now ${curFmt}` : '';
    const condTxt  = alertDescribeCondition(a);
    const cat = a.type === 'regime' ? 'regime' : a.type === 'eco_actual' ? 'eco' : (ADV_ALERT_TYPES[a.sym]?.category ?? 'price');
    const catColors = { price:'var(--text2)', spread:'#1D9E75', ivrank:'#185FA5', corr:'#854F0B', var:'#A32D2D', rr:'#0E7490', cot:'#9333EA', fairvalue:'#C2410C', regime:'#533AB7', eco:'#B87A0A' };
    const catStyle  = `color:${catColors[cat]||'var(--text2)'};font-size:9px;margin-right:4px;`;
    return `<div class="${cls}" data-id="${a.id}">
      <span class="alert-lbl"><span style="${catStyle}">[${cat.toUpperCase()}]</span>${condTxt}${curTxt}${firedTxt}</span>
      <span class="alert-del" title="Remove alert" onclick="alertsRemove('${a.id}')">✕</span>
    </div>`;
  }).join('');
}

function alertsRemove(id) {
  alertsSave(alertsLoad().filter(a => a.id !== id));
  alertsRender(null);
}

function alertsAddFromUI() {
  const typeEl  = document.getElementById('alert-type-sel');
  const symEl   = document.getElementById('alert-sym-sel');
  const dirEl   = document.getElementById('alert-dir-sel');
  const valEl   = document.getElementById('alert-val-inp');
  const regEl   = document.getElementById('alert-regime-sel');

  const alertType = typeEl?.value || 'price';

  const arr = alertsLoad();

  if (alertType === 'regime') {
    const target = regEl?.value;
    if (!target) return;
    if (arr.find(a => a.type === 'regime' && a.target === target)) return;
    arr.push({ id: Date.now().toString(36), type: 'regime', target, fired: false, firedAt: null });
  } else {
    const sym = symEl?.value;
    const dir = dirEl?.value;
    const val = parseFloat(valEl?.value);
    if (!sym || !dir || isNaN(val)) return;
    const label = ADV_ALERT_TYPES[sym]?.label ?? ALERTS_LABELS[sym] ?? sym;
    arr.push({ id: Date.now().toString(36), type: alertType, sym, dir, threshold: val, label, fired: false, firedAt: null });
    if (valEl) valEl.value = '';
  }

  alertsSave(arr);
  alertsRender(null);
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

async function alertsCheckEco() {
  const arr      = alertsLoad();
  const ecoAlerts = arr.filter(a => a.type === 'eco_actual');
  if (!ecoAlerts.length) return;

  const todayISO = new Date().toISOString().slice(0, 10);
  const stored   = _ecoFpLoad();
  const prevFp   = stored.fp ?? null;
  const allCcys  = [...new Set(ecoAlerts.flatMap(a => a.currencies || []))];
  const newFp    = await _buildEcoActualFp(allCcys);

  if (newFp === null) return;   

  if (prevFp === null) {
    _ecoFpSave(newFp, todayISO);   
    return;
  }

  if (newFp === prevFp || newFp === '') return;   

  const prevSet = new Set(prevFp.split(';;').filter(Boolean));
  const newSet  = new Set(newFp.split(';;').filter(Boolean));
  const added   = [...newSet].filter(x => !prevSet.has(x));
  _ecoFpSave(newFp, todayISO);

  if (!added.length) return;

  const newActuals = added.map(s => {
    const [ccy, , time, title, actual] = s.split('|');
    return { ccy, time, title, actual };
  });

  let changed = false;
  ecoAlerts.forEach(a => {
    const matching = newActuals.filter(n => !a.currencies.length || a.currencies.includes(n.ccy));
    if (!matching.length) return;

    a.fired       = true;
    a.firedAt     = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    a.lastActuals = matching.slice(0, 3);
    changed       = true;

    const ccyLabel = a.currencies.length ? a.currencies.join('/') : 'G10';
    const preview  = matching.slice(0, 2).map(n => `${n.ccy} ${n.title}: ${n.actual}`).join(' · ');
    const ecoBody  = preview || `${matching.length} new actual(s)`;
    giFireAlert(`${ccyLabel} Economic Release`, ecoBody, 'info');

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`GI Terminal — ${ccyLabel} Economic Release`, {
          body : ecoBody,
          icon : '/favicon-192x192.png',
          tag  : 'gi-eco-' + a.id,
        });
      } catch {}
    }
  });

  if (changed) { alertsSave(arr); alertsRender(null); }
}

let _alertsFVCache = null, _alertsFVCacheTime = 0;
async function _alertsLoadFairValue() {
  const now = Date.now();
  if (_alertsFVCache && (now - _alertsFVCacheTime) < 600_000) return _alertsFVCache;
  try {
    const res = await fetch('./fair-value-data/summary.json', { cache: 'no-store' }).catch(() => null);
    if (res?.ok) {
      const j = await res.json();
      if (j?.pairs) { _alertsFVCache = j.pairs; _alertsFVCacheTime = now; }
    }
  } catch {}
  return _alertsFVCache;
}

async function _alertsLoadRR() {
  if (window.RR_DATA_CACHE && Object.keys(window.RR_DATA_CACHE).length) return window.RR_DATA_CACHE;
  try {
    const res = await fetch('./rr-data/rr.json').catch(() => null);
    if (res?.ok) {
      const j = await res.json();
      if (j?.pairs) {
        if (!window.RR_DATA_CACHE) window.RR_DATA_CACHE = {};
        Object.assign(window.RR_DATA_CACHE, j.pairs);
      }
    }
  } catch {}
  return window.RR_DATA_CACHE || {};
}

async function _alertsLoadCot() {
  if (window.COT_DATA_STORE && Object.keys(window.COT_DATA_STORE).length >= COT_CURRENCIES.length) {
    return window.COT_DATA_STORE;
  }
  const store = { ...(window.COT_DATA_STORE || {}) };
  try {
    const results = await Promise.all(COT_CURRENCIES.map(async ccy => {
      try {
        const r = await fetch('./cot-data/' + ccy + '.json');
        if (!r.ok) return null;
        const data = await r.json();
        return { ccy, ...data };
      } catch { return null; }
    }));
    results.filter(Boolean).forEach(d => { store[d.ccy] = d; });
  } catch {}
  return store;
}

async function alertsCheck() {
  const arr = alertsLoad();
  if (!arr.length) return;

  const activeCats = new Set(
    arr.filter(a => !a.fired && a.type && a.type !== 'price' && a.type !== 'regime' && a.type !== 'eco_actual')
       .map(a => ADV_ALERT_TYPES[a.sym]?.category)
       .filter(Boolean)
  );
  const needsIntra = activeCats.has('spread') || activeCats.has('ivrank') || activeCats.has('corr') || activeCats.has('var');

  let intra = null, rr = null, cot = null, fairValue = null;
  const loaders = [];
  if (needsIntra)                loaders.push(loadIntradayQuotes().catch(() => null).then(v => { intra = v; }));
  if (activeCats.has('rr'))        loaders.push(_alertsLoadRR().catch(() => null).then(v => { rr = v; }));
  if (activeCats.has('cot'))       loaders.push(_alertsLoadCot().catch(() => null).then(v => { cot = v; }));
  if (activeCats.has('fairvalue')) loaders.push(_alertsLoadFairValue().catch(() => null).then(v => { fairValue = v; }));
  if (loaders.length) await Promise.all(loaders);

  const ctx = { ...(intra || {}), rr, cot, fairValue };

  let changed = false;

  arr.forEach(a => {
    if (a.fired) return;
    if (a.type === 'eco_actual') return;
    const cur = alertsCurrentValue(a, ctx);
    if (cur == null) return;

    let triggered = false;

    if (a.type === 'regime') {
      triggered = (cur === a.target);
    } else {
      triggered = (a.dir === 'above' && cur > a.threshold) ||
                  (a.dir === 'below' && cur < a.threshold);
    }

    if (!triggered) return;

    a.fired   = true;
    a.firedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    changed   = true;

    const curFmt   = alertFormatValue(a, cur);
    const condTxt  = alertDescribeCondition(a);
    const alertBody = curFmt ? `${condTxt}  ·  Now: ${curFmt}` : condTxt;
    giFireAlert('Terminal Alert', alertBody, 'warning');

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('GI Terminal Alert', {
          body: alertBody,
          icon: '/favicon-192x192.png',
          tag : 'gi-alert-' + a.id,
        });
      } catch {}
    }
  });

  if (changed) { alertsSave(arr); alertsRender(ctx); }
}

const GI_ALERT_HISTORY_KEY     = 'gi_alert_history_v1';
const GI_ALERT_SOUND_KEY       = 'gi_alert_sound_v1';
const GI_ALERT_MAX_HISTORY     = 50;
const GI_TOAST_AUTO_DISMISS_MS = 8000;

let _giAudioCtx = null;

function giAlertSoundEnabled() {
  const v = localStorage.getItem(GI_ALERT_SOUND_KEY);
  return v === null ? true : v === 'on';
}

function giSetAlertSoundEnabled(on) {
  try { localStorage.setItem(GI_ALERT_SOUND_KEY, on ? 'on' : 'off'); } catch {}
  const btn = document.getElementById('gi-alertsound-btn');
  if (btn) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Alert sound on' : 'Alert sound off');
    btn.title = on ? 'Alert sound — click to mute' : 'Alert sound muted — click to enable';
  }
}

function giPlayAlertChime(severity) {
  if (!giAlertSoundEnabled()) return;
  try {
    if (!_giAudioCtx) _giAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_giAudioCtx.state === 'suspended') _giAudioCtx.resume();
    const ctx  = _giAudioCtx;
    const freq = severity === 'critical' ? 660 : severity === 'warning' ? 587 : 523;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {}
}

function giAlertHistoryLoad() {
  try { return JSON.parse(localStorage.getItem(GI_ALERT_HISTORY_KEY) || '[]'); } catch { return []; }
}
function giAlertHistorySave(arr) {
  try { localStorage.setItem(GI_ALERT_HISTORY_KEY, JSON.stringify(arr.slice(0, GI_ALERT_MAX_HISTORY))); } catch {}
}

function giEscHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function giUpdateBellBadge() {
  const countEl = document.getElementById('gi-alertbell-count');
  if (!countEl) return;
  const unread = giAlertHistoryLoad().filter(a => !a.read).length;
  if (unread > 0) {
    countEl.textContent = unread > 99 ? '99+' : String(unread);
    countEl.hidden = false;
  } else {
    countEl.hidden = true;
  }
}

function giRenderAlertTray() {
  const list = document.getElementById('gi-alertbell-tray-list');
  if (!list) return;
  const items = giAlertHistoryLoad();
  if (!items.length) {
    list.innerHTML = '<div class="gi-alertbell-empty">No alerts yet</div>';
    return;
  }
  list.innerHTML = items.map(a => `
    <div class="gi-alertbell-item${a.read ? '' : ' unread'}">
      <div class="gi-alertbell-item-title">${giEscHtml(a.title)}</div>
      <div class="gi-alertbell-item-body">${giEscHtml(a.body)}</div>
      <div class="gi-alertbell-item-time">${giEscHtml(a.time)}</div>
    </div>
  `).join('');
}

function giEnsureToastStack() {
  let stack = document.getElementById('gi-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'gi-toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  return stack;
}

function giShowToast(title, body, severity) {
  const stack = giEnsureToastStack();
  const el = document.createElement('div');
  el.className = 'gi-toast' +
    (severity === 'warning' ? ' gi-toast-warning' : severity === 'critical' ? ' gi-toast-critical' : '');
  el.innerHTML = `
    <div class="gi-toast-row">
      <span class="gi-toast-title">${giEscHtml(title)}</span>
      <span class="gi-toast-close" aria-hidden="true">&times;</span>
    </div>
    <div class="gi-toast-body">${giEscHtml(body)}</div>
  `;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('gi-toast-in'));
  const dismiss = () => {
    el.classList.remove('gi-toast-in');
    el.classList.add('gi-toast-out');
    setTimeout(() => el.remove(), 220);
  };
  const timer = setTimeout(dismiss, GI_TOAST_AUTO_DISMISS_MS);
  el.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}

function giFireAlert(title, body, severity) {
  severity = severity || 'info';
  const arr = giAlertHistoryLoad();
  arr.unshift({
    title, body, severity,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  });
  giAlertHistorySave(arr);
  giUpdateBellBadge();
  giRenderAlertTray();
  giShowToast(title, body, severity);
  giPlayAlertChime(severity);
}

function giInitAlertSystem() {
  giEnsureToastStack();
  giUpdateBellBadge();
  giRenderAlertTray();
  giSetAlertSoundEnabled(giAlertSoundEnabled());

  const bellBtn  = document.getElementById('gi-alertbell-btn');
  const tray     = document.getElementById('gi-alertbell-tray');
  const soundBtn = document.getElementById('gi-alertsound-btn');
  const clearBtn = document.getElementById('gi-alertbell-clear');

  if (bellBtn && tray) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !tray.hidden;
      tray.hidden = isOpen;
      bellBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      if (!isOpen) {
        const arr = giAlertHistoryLoad().map(a => ({ ...a, read: true }));
        giAlertHistorySave(arr);
        giUpdateBellBadge();
        giRenderAlertTray();
      }
    });
    document.addEventListener('click', (e) => {
      if (!tray.hidden && !tray.contains(e.target) && e.target !== bellBtn) {
        tray.hidden = true;
        bellBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      if (!_giAudioCtx) {
        try { _giAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
      } else if (_giAudioCtx.state === 'suspended') {
        _giAudioCtx.resume();
      }
      giSetAlertSoundEnabled(!giAlertSoundEnabled());
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      giAlertHistorySave([]);
      giUpdateBellBadge();
      giRenderAlertTray();
    });
  }
}

window.giFireAlert = giFireAlert;

function initAlerts() {
  giInitAlertSystem();
  alertsRender(null);
  setTimeout(alertsCheck, 8000);

  setInterval(alertsCheckEco, 30 * 1000);
  setInterval(alertsCheck,    5 * 60 * 1000);

  let _lastVisCheck = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - _lastVisCheck < 30 * 1000) return;   
    _lastVisCheck = now;
    alertsCheckEco();
  });

  updateSignalNotifBtn();

  _newsLoadDensity();

  _newsLoadFontSize();

  document.addEventListener('click', e => {
    const anchor = document.getElementById('alerts-anchor');
    if (anchor && !anchor.contains(e.target)) {
      const pop = document.getElementById('alerts-popover');
      if (pop) pop.style.display = 'none';
      const btn = document.getElementById('alerts-bell-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const pop = document.getElementById('alerts-popover');
    if (!pop || pop.style.display === 'none') return;
    pop.style.display = 'none';
    const btn = document.getElementById('alerts-bell-btn');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  });
}

function toggleAlertsPopover() {
  const pop = document.getElementById('alerts-popover');
  const btn = document.getElementById('alerts-bell-btn');
  if (!pop) return;
  const isOpen = pop.style.display !== 'none';
  if (isOpen) {
    pop.style.display = 'none';
    if (btn) btn.setAttribute('aria-expanded', 'false');
    return;
  }
  alertsRender();
  pop.style.display = 'block';
  if (btn) btn.setAttribute('aria-expanded', 'true');
  const rect = btn.getBoundingClientRect();
  const popW = 280;
  const PAD = 8;
  let left = rect.right - popW;
  if (left < PAD) left = PAD;
  pop.style.left = left + 'px';
  pop.style.top  = (rect.top - pop.offsetHeight - 8) + 'px';
  requestAnimationFrame(() => {
    const h = pop.offsetHeight;
    pop.style.top = (rect.top - h - 8) + 'px';
  });
}

(function initSplitLayout(){
  var LS_KEY = 'gi_split_layout';
  var main   = document.getElementById('main');
  var btn    = document.getElementById('split-layout-btn');
  var handle = document.getElementById('split-drag-handle');
  var upper  = document.getElementById('split-upper');
  var lower  = document.getElementById('split-lower');

  var alertsPanel      = document.getElementById('section-macro');
  var alertsOrigParent = alertsPanel ? alertsPanel.parentNode : null;
  var alertsOrigNext   = alertsPanel ? alertsPanel.nextSibling : null;

  function isMobile(){ return window.innerWidth <= 900; }

  function applyState(active, leftPct){
    if(!main||!btn||!handle||!upper||!lower) return;
    if(isMobile()) active = false;
    btn.style.display = isMobile() ? 'none' : '';
    if(active){
      main.classList.add('split-layout');
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed','true');
      handle.style.display = '';
      var pct = leftPct || 55;
      upper.style.width = pct + '%';
      upper.style.flex  = 'none';
      if(alertsPanel && alertsPanel.parentNode !== upper){
        upper.appendChild(alertsPanel);
      }
    } else {
      main.classList.remove('split-layout');
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','false');
      handle.style.display = 'none';
      upper.style.width = '';
      upper.style.flex  = '';
      if(alertsPanel && alertsOrigParent && alertsPanel.parentNode !== alertsOrigParent){
        alertsOrigParent.insertBefore(alertsPanel, alertsOrigNext);
      }
    }
  }

  try {
    var saved = JSON.parse(localStorage.getItem(LS_KEY)||'null');
    if(saved === null){
      applyState(true, 55);
      localStorage.setItem(LS_KEY, JSON.stringify({active:true, leftPct:55}));
    } else if(saved.active){
      applyState(true, saved.leftPct||55);
    } else {
      applyState(false);
    }
  } catch(e){ applyState(true, 55); }

  var TIP_KEY = 'gi_split_tip_seen';
  var tip = document.getElementById('split-tip');
  function hideTip(){
    if(!tip) return;
    tip.classList.remove('visible');
    try { localStorage.setItem(TIP_KEY,'1'); } catch(e){}
  }
  try {
    if(!localStorage.getItem(TIP_KEY) && tip){
      setTimeout(function(){ tip.classList.add('visible'); }, 800);
      setTimeout(function(){ hideTip(); }, 6000);
    }
  } catch(e){}

  if(btn){
    btn.addEventListener('click', function(){
      hideTip();
      var isActive = main.classList.contains('split-layout');
      applyState(!isActive, 55);
      try { localStorage.setItem(LS_KEY, JSON.stringify({active:!isActive, leftPct:55})); } catch(e){}
      if (typeof _repaintAfterExclusivePanelClosed === 'function') {
        _repaintAfterExclusivePanelClosed();
      }
    });
  }

  window.addEventListener('resize', function(){
    btn.style.display = isMobile() ? 'none' : '';
    if(isMobile() && main.classList.contains('split-layout')){
      applyState(false);
    }
  });

  (function _watchLayoutResize(){
    var layout = document.getElementById('layout');
    if(!layout || typeof ResizeObserver === 'undefined') return;
    var _lastW = layout.offsetWidth;
    var _rafPending = false;
    var ro = new ResizeObserver(function(entries){
      if(_rafPending) return;
      var newW = entries[0].contentRect.width;
      if(Math.abs(newW - _lastW) < 20) return;
      _lastW = newW;
      _rafPending = true;
      requestAnimationFrame(function(){
        _rafPending = false;
        layout.classList.add('_reflow');
        requestAnimationFrame(function(){ layout.classList.remove('_reflow'); });
        var isActive = main.classList.contains('split-layout');
        if(isActive){
          var pct = upper.offsetWidth > 0
            ? parseFloat((upper.offsetWidth / main.offsetWidth * 100).toFixed(1))
            : 55;
          upper.style.width = pct + '%';
        }
      });
    });
    ro.observe(layout);
  })();
  (function _watchScreenChange(){
    var _lastW = window.screen.width;
    var _lastH = window.screen.height;
    var _lastDPR = window.devicePixelRatio;
    var _reloadPending = false;

    function _onScreenChange(){
      if(_reloadPending) return;
      var w = window.screen.width;
      var h = window.screen.height;
      var dpr = window.devicePixelRatio;
      if(w !== _lastW || h !== _lastH || Math.abs(dpr - _lastDPR) > 0.05){
        _reloadPending = true;
        setTimeout(function(){ window.location.reload(); }, 300);
      }
    }

    try{
      var _mq = window.matchMedia('(resolution: ' + _lastDPR + 'dppx)');
      _mq.addEventListener('change', _onScreenChange);
    }catch(e){}

    setInterval(function(){
      if(!_reloadPending) _onScreenChange();
    }, 2000);
  })();

  if(handle){
    var dragging = false, startX = 0, startW = 0;
    handle.addEventListener('mousedown', function(e){
      dragging = true;
      startX = e.clientX;
      startW = upper.offsetWidth;
      handle.classList.add('dragging');
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e){
      if(!dragging) return;
      var dx    = e.clientX - startX;
      var mainW = main.offsetWidth;
      var newW  = Math.min(Math.max(startW + dx, 240), mainW - 200);
      var pct   = (newW / mainW * 100).toFixed(1);
      upper.style.width = pct + '%';
    });
    document.addEventListener('mouseup', function(){
      if(!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
      var pct = parseFloat((upper.offsetWidth / main.offsetWidth * 100).toFixed(1));
      try { localStorage.setItem(LS_KEY, JSON.stringify({active:true, leftPct:pct})); } catch(e){}
    });
    handle.addEventListener('touchstart', function(e){
      dragging = true;
      startX = e.touches[0].clientX;
      startW = upper.offsetWidth;
      handle.classList.add('dragging');
    }, {passive:true});
    document.addEventListener('touchmove', function(e){
      if(!dragging) return;
      var dx    = e.touches[0].clientX - startX;
      var mainW = main.offsetWidth;
      var newW  = Math.min(Math.max(startW + dx, 240), mainW - 200);
      upper.style.width = (newW / mainW * 100).toFixed(1) + '%';
    }, {passive:true});
    document.addEventListener('touchend', function(){
      if(!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
    });
  }
})();

const GI_OB_KEY = 'gi_ob_done';

function giOnboardShouldShow() {
  if (localStorage.getItem(GI_OB_KEY)) return false;
  try { if (!localStorage.getItem('gi_welcome_done')) return false; } catch {  }
  try {
    const existing = JSON.parse(localStorage.getItem('gi_alerts') || '[]');
    if (existing.length > 0) return false;
  } catch {  }
  return true;
}

function giOnboardDismiss() {
  localStorage.setItem(GI_OB_KEY, '1');
  const el = document.getElementById('gi-onboard');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity .2s';
    setTimeout(() => { el.style.display = 'none'; }, 220);
  }
}

async function giOnboardActivate() {
  const btn = document.getElementById('gi-onboard-cta');
  if (btn) { btn.textContent = '…'; btn.disabled = true; }

  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  try {
    const arr = alertsLoad();
    const alreadyHasRegime = arr.some(a => a.type === 'regime' && a.target === 'RISK-OFF');
    if (!alreadyHasRegime) {
      arr.push({
        id: Date.now().toString(36),
        type: 'regime',
        target: 'RISK-OFF',
        label: 'Regime: RISK-OFF',
        fired: false,
        firedAt: null
      });
      alertsSave(arr);
      alertsRender(null);
    }
  } catch (e) {
    console.warn('giOnboardActivate: could not add alert', e);
  }

  const pop = document.getElementById('alerts-popover');
  const bellBtn = document.getElementById('alerts-bell-btn');
  if (pop && bellBtn) {
    toggleAlertsPopover();
    setTimeout(() => {
      pop.scrollIntoView && pop.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  giOnboardDismiss();
}

function giOnboardInit() {
  function attemptShow() {
    if (!giOnboardShouldShow()) return;
    setTimeout(() => {
      if (!giOnboardShouldShow()) return; 
      const el = document.getElementById('gi-onboard');
      if (!el) return;
      el.style.opacity = '0';
      el.style.display = 'block';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'opacity .35s ease';
          el.style.opacity = '1';
        });
      });
      setTimeout(() => {
        if (el.style.display !== 'none') giOnboardDismiss();
      }, 18000);
    }, 4000);
  }

  if (window.giOnTerminalShown) {
    window.giOnTerminalShown(attemptShow);
  } else {
    attemptShow();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', giOnboardInit);
} else {
  giOnboardInit();
}

window._CB_RATES_CACHE = window._CB_RATES_CACHE || {};

window._OIS_RATES_CACHE  = window._OIS_RATES_CACHE  || {};
window._OIS_RATE_SOURCES = window._OIS_RATE_SOURCES || {};  

function computeCIPForward(spot, rLeft, rRight, T) {
  if (spot == null || rLeft == null || rRight == null) return null;
  const rL = rLeft  / 100;
  const rR = rRight / 100;
  return spot * ((1 + rR * T) / (1 + rL * T));
}

function _resolveRate(ccy) {
  const ois = window._OIS_RATES_CACHE[ccy];
  if (ois != null) return [ois, window._OIS_RATE_SOURCES[ccy] || 'OIS'];
  const policy = window._CB_RATES_CACHE[ccy];
  if (policy != null) return [policy, 'policy'];
  return [null, null];
}

const CIP_CCY_RATES = new Set([
  'EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CHF','USD/CAD','NZD/USD',
  'EUR/GBP','EUR/JPY','GBP/JPY','AUD/JPY','EUR/AUD','EUR/CHF',
  'USD/NOK','USD/SEK','EUR/NOK','EUR/SEK',
]);

async function renderCIPForwards() {
  const fxTbody = document.getElementById('fx-pairs-tbody');
  if (!fxTbody) return;

  const rows = fxTbody.querySelectorAll('tr');
  for (const row of rows) {
    const symCell = row.querySelector('td.sym');
    if (!symCell) continue;
    const pair = symCell.textContent.trim();
    if (!CIP_CCY_RATES.has(pair)) continue;
    const tds = row.querySelectorAll('td');
    if (tds.length < 12) continue;

    const [leftCcy, rightCcy] = pair.split('/');
    const pairId = pair.replace('/', '').toLowerCase();

    let spot = STOOQ_RT_CACHE[pairId]?.close ?? null;
    if (spot == null) {
      try {
        const freshIntra = await loadIntradayQuotes().catch(() => null);
        if (freshIntra) {
          const matched = Object.entries(freshIntra).find(
            ([k]) => k.toLowerCase().replace('=x', '').replace('-', '').replace('/', '') === pairId
          );
          if (matched) spot = matched[1]?.close ?? matched[1]?.price ?? null;
        }
      } catch {  }
    }

    const [rLeft,  srcLeft]  = _resolveRate(leftCcy);
    const [rRight, srcRight] = _resolveRate(rightCcy);

    const tenors  = [1/12, 3/12];
    const indices = [7, 8];
    const pairCfg = PAIRS.find(p => p.id === pairId);
    const dec = pairCfg?.dec ?? 4;

    tenors.forEach((T, i) => {
      const fwd = computeCIPForward(spot, rLeft, rRight, T);
      const el  = tds[indices[i]];
      if (!el) return;
      if (fwd != null && spot != null) {
        el.textContent = fwd.toFixed(dec);
        const atDiscount = fwd < spot;
        el.style.color = atDiscount ? 'var(--down)' : 'var(--up)';
        const tLabel = T === 1/12 ? '1M' : '3M';
        el.title = `CIP ${tLabel} fwd · ${leftCcy}=${rLeft?.toFixed(2)}% (${srcLeft}) vs ${rightCcy}=${rRight?.toFixed(2)}% (${srcRight}) · ${leftCcy} at forward ${atDiscount ? 'discount' : 'premium'}`;
      } else {
        el.textContent = '—';
        el.style.color = 'var(--text3)';
      }
    });
  }
}

async function renderRRInFXTable() {
  let rrMap = window.RR_DATA_CACHE || {};
  if (Object.keys(rrMap).length === 0) {
    try {
      const res = await fetch('./rr-data/rr.json').catch(() => null);
      if (res?.ok) {
        const j = await res.json();
        if (j?.pairs) { rrMap = j.pairs; Object.assign(window.RR_DATA_CACHE, rrMap); }
      }
    } catch {  }
  }
  const fxTbody = document.getElementById('fx-pairs-tbody');
  if (!fxTbody) return;

  const rrKeys = {
    'EUR/USD': 'EURUSD', 'GBP/USD': 'GBPUSD', 'USD/JPY': 'USDJPY',
    'AUD/USD': 'AUDUSD', 'USD/CHF': 'USDCHF', 'USD/CAD': 'USDCAD', 'NZD/USD': 'NZDUSD'
  };

  const rows = fxTbody.querySelectorAll('tr');
  rows.forEach(row => {
    const symCell = row.querySelector('td.sym');
    if (!symCell) return;
    const pair = symCell.textContent.trim();
    const rrKey = rrKeys[pair];
    if (!rrKey) return;
    const tds = row.querySelectorAll('td');
    const el = tds[9];
    if (!el) return;

    const rrVal = rrMap[rrKey]?.rr25d ?? null;
    if (rrVal != null) {
      el.textContent = (rrVal >= 0 ? '+' : '') + rrVal.toFixed(2);
      el.style.color = rrVal > 0.1 ? 'var(--up)' : rrVal < -0.1 ? 'var(--down)' : 'var(--text2)';
      el.title = `25d RR 1M · ${rrKey} · Saxo Bank indicative mid`;
    } else {
      el.textContent = '—';
      el.style.color = 'var(--text3)';
    }
  });
}

async function renderDerivativesSection() {
  const ratesCache = window._CB_RATES_CACHE;
  const intraday = await loadIntradayQuotes().catch(() => null);

  let rrMap = window.RR_DATA_CACHE || {};
  if (Object.keys(rrMap).length === 0) {
    try {
      const res = await fetch('./rr-data/rr.json').catch(() => null);
      if (res?.ok) {
        const j = await res.json();
        if (j?.pairs) {
          rrMap = j.pairs;
          if (!window.RR_DATA_CACHE) window.RR_DATA_CACHE = {};
          Object.assign(window.RR_DATA_CACHE, rrMap);
        }
      }
    } catch {  }
  } else {
    rrMap = window.RR_DATA_CACHE;
  }

  let rr2Map = {};
  try {
    const rr2Res = await fetch('./rr-data/rr2.json').catch(() => null);
    if (rr2Res?.ok) {
      const rr2Json = await rr2Res.json();
      if (rr2Json?.pairs) rr2Map = rr2Json.pairs;
    }
  } catch {  }

  const pairs = ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CHF','USD/CAD','NZD/USD','USD/NOK','USD/SEK'];
  const rrKeys = {
    'EUR/USD':'EURUSD','GBP/USD':'GBPUSD','USD/JPY':'USDJPY',
    'AUD/USD':'AUDUSD','USD/CHF':'USDCHF','USD/CAD':'USDCAD','NZD/USD':'NZDUSD',
    'USD/NOK':'USDNOK','USD/SEK':'USDSEK'
  };

  const fwdTbody = document.getElementById('fwd-tbody');
  if (fwdTbody) {
    const rows = fwdTbody.querySelectorAll('tr');
    pairs.forEach((pair, idx) => {
      const row = rows[idx];
      if (!row) return;
      if (!CIP_CCY_RATES.has(pair)) return;
      const [leftCcy, rightCcy] = pair.split('/');
      const pairId = pair.replace('/','').toLowerCase();
      const pairCfg = PAIRS.find(p => p.id === pairId);
      const dec = pairCfg?.dec ?? 4;
      const spot  = STOOQ_RT_CACHE[pairId]?.close ?? intraday?.quotes?.[pairId]?.close ?? null;

      const [rLeft,  srcLeft]  = _resolveRate(leftCcy);
      const [rRight, srcRight] = _resolveRate(rightCcy);

      const tds = row.querySelectorAll('td');

      if (tds[1]) tds[1].textContent = spot != null ? spot.toFixed(dec) : '—';

      const tenors = [1/12, 3/12, 6/12, 1];
      tenors.forEach((T, ti) => {
        const fwd = computeCIPForward(spot, rLeft, rRight, T);
        const el = tds[2 + ti];
        if (!el) return;
        if (fwd != null && spot != null) {
          el.textContent = fwd.toFixed(dec);
          const atDiscount = fwd < spot; 
          el.style.color = atDiscount ? 'var(--down)' : 'var(--up)';
        } else {
          el.textContent = '—';
          el.style.color = 'var(--text3)';
        }
      });

      if (tds[6]) {
        const diff = (rLeft != null && rRight != null) ? (rLeft - rRight) : null;
        if (diff != null) {
          tds[6].textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2) + '%';
          tds[6].style.color = diff > 0.1 ? 'var(--down)' : diff < -0.1 ? 'var(--up)' : 'var(--text2)';
          tds[6].title = `OIS rate diff: ${leftCcy}=${rLeft?.toFixed(2)}% (${srcLeft}) − ${rightCcy}=${rRight?.toFixed(2)}% (${srcRight}) · positive = ${leftCcy} at forward discount · Used for CIP forward pricing`;
        } else {
          tds[6].textContent = '—';
        }
      }
    });

    const crossFwdPairs = ['EUR/GBP','EUR/JPY','GBP/JPY','AUD/JPY','EUR/AUD','EUR/CHF','EUR/NOK','EUR/SEK'];
    crossFwdPairs.forEach(pair => {
      const row = fwdTbody.querySelector(`tr[data-pair="${pair}"]`);
      if (!row) return;
      const [leftCcy, rightCcy] = pair.split('/');
      const pairId = pair.replace('/','').toLowerCase();
      const pairCfg = PAIRS.find(p => p.id === pairId);
      const dec = pairCfg?.dec ?? 5;
      const spot  = STOOQ_RT_CACHE[pairId]?.close ?? intraday?.quotes?.[pairId]?.close ?? null;

      const [rLeft,  srcLeft]  = _resolveRate(leftCcy);
      const [rRight, srcRight] = _resolveRate(rightCcy);

      const tds = row.querySelectorAll('td');

      if (tds[1]) tds[1].textContent = spot != null ? spot.toFixed(dec) : '—';

      const tenors = [1/12, 3/12, 6/12, 1];
      tenors.forEach((T, ti) => {
        const fwd = computeCIPForward(spot, rLeft, rRight, T);
        const el = tds[2 + ti];
        if (!el) return;
        if (fwd != null && spot != null) {
          el.textContent = fwd.toFixed(dec);
          const atDiscount = fwd < spot;
          el.style.color = atDiscount ? 'var(--down)' : 'var(--up)';
        } else {
          el.textContent = '—';
          el.style.color = 'var(--text3)';
        }
      });

      if (tds[6]) {
        const diff = (rLeft != null && rRight != null) ? (rLeft - rRight) : null;
        if (diff != null) {
          tds[6].textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2) + '%';
          tds[6].style.color = diff > 0.1 ? 'var(--down)' : diff < -0.1 ? 'var(--up)' : 'var(--text2)';
          tds[6].title = `OIS rate diff: ${leftCcy}=${rLeft?.toFixed(2)}% (${srcLeft}) − ${rightCcy}=${rRight?.toFixed(2)}% (${srcRight}) · positive = ${leftCcy} at forward discount`;
        } else {
          tds[6].textContent = '—';
        }
      }
    });
  }

  const rrSurfaceTbody = document.getElementById('rr-surface-tbody');
  if (rrSurfaceTbody) {
    const rrPairs = ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CHF','USD/CAD','EUR/JPY','EUR/GBP','EUR/CHF'];
    const rrPairKeys = {
      'EUR/USD':'EURUSD','GBP/USD':'GBPUSD','USD/JPY':'USDJPY',
      'AUD/USD':'AUDUSD','USD/CHF':'USDCHF','USD/CAD':'USDCAD',
      'EUR/JPY':'EURJPY','EUR/GBP':'EURGBP','EUR/CHF':'EURCHF'
    };
    const rows = rrSurfaceTbody.querySelectorAll('tr');
    rrPairs.forEach((pair, idx) => {
      const row = rows[idx];
      if (!row) return;
      const rrKey = rrPairKeys[pair];
      const tds = row.querySelectorAll('td');
      const rr2 = rr2Map[rrKey] || {};
      const rr1m = rr2['1M'] ?? rrMap[rrKey]?.rr25d ?? null;
      const tenorData = [
        rr2['1W'] ?? null,
        rr1m,
        rr2['3M'] ?? null,
        rr2['6M'] ?? null,
        rr2['1Y'] ?? null,
      ];
      tenorData.forEach((v, ti) => {
        const el = tds[1 + ti];
        if (!el) return;
        if (v != null) {
          el.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
          el.style.color = v > 0.1 ? 'var(--up)' : v < -0.1 ? 'var(--down)' : 'var(--text2)';
        } else {
          el.textContent = '—';
          el.style.color = 'var(--text3)';
        }
      });
      if (tds[6] && rr1m != null) {
        const skewLbl = rr1m < -0.3 ? 'Put skew' : rr1m > 0.3 ? 'Call skew' : 'Balanced';
        tds[6].textContent = skewLbl;
        tds[6].style.color = rr1m < -0.3 ? 'var(--down)' : rr1m > 0.3 ? 'var(--up)' : 'var(--text3)';
      }
    });
  }

  const hvTermTbody = document.getElementById('hv-term-tbody');
  if (hvTermTbody) {
    const rows = hvTermTbody.querySelectorAll('tr');
    const termPairs = ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CHF','USD/CAD','NZD/USD','USD/NOK','USD/SEK'];
    termPairs.forEach((pair, idx) => {
      const row = rows[idx];
      if (!row) return;
      const pairId = pair.replace('/','').toLowerCase();
      const q = intraday?.quotes?.[pairId];
      const tds = row.querySelectorAll('td');

      const hv30 = q?.hv30 ?? STOOQ_RT_CACHE[pairId]?.hv30 ?? null;
      const hv10 = q?.hv10 ?? null;
      const rrKey = rrKeys[pair] ?? pair.replace('/','');
      const rr1m = rrMap[rrKey]?.rr25d ?? null;

      if (tds[1]) {
        tds[1].textContent = hv30 != null ? hv30.toFixed(1) + '%' : '—';
        tds[1].style.textAlign = 'right';
        tds[1].style.color = hv30 != null ? (hv30 > 12 ? 'var(--down)' : hv30 < 5 ? 'var(--up)' : 'var(--text)') : 'var(--text3)';
        tds[1].style.fontFamily = 'var(--font-mono)';
        tds[1].style.fontSize = '10px';
      }
      if (tds[2]) {
        tds[2].textContent = rr1m != null ? (rr1m >= 0 ? '+' : '') + rr1m.toFixed(2) : '—';
        tds[2].style.textAlign = 'right';
        tds[2].style.color = rr1m != null ? (rr1m > 0.1 ? 'var(--up)' : rr1m < -0.1 ? 'var(--down)' : 'var(--text2)') : 'var(--text3)';
        tds[2].style.fontFamily = 'var(--font-mono)';
        tds[2].style.fontSize = '10px';
      }
      if (tds[3]) {
        if (rr1m != null && hv30 != null && hv30 > 0) {
          const ratio = (rr1m / hv30) * 100;
          tds[3].textContent = (ratio >= 0 ? '+' : '') + ratio.toFixed(0) + '%';
          tds[3].style.color = ratio > 5 ? 'var(--up)' : ratio < -5 ? 'var(--down)' : 'var(--text3)';
          tds[3].title = `RR 1M (${rr1m.toFixed(2)}) ÷ HV30 (${hv30.toFixed(1)}%) — options skew premium vs realized vol`;
        } else {
          tds[3].textContent = '—';
          tds[3].style.color = 'var(--text3)';
        }
        tds[3].style.textAlign = 'right';
        tds[3].style.fontFamily = 'var(--font-mono)';
        tds[3].style.fontSize = '10px';
      }
      if (tds[4]) {
        if (hv10 != null && hv30 != null) {
          const diff = hv10 - hv30;
          let arrow, color, tip;
          if (diff > 1) {
            arrow = '↑'; color = 'var(--down)';  
            tip = `HV10 (${hv10.toFixed(1)}%) > HV30 (${hv30.toFixed(1)}%) — short-term vol expanding`;
          } else if (diff < -1) {
            arrow = '↓'; color = 'var(--up)';    
            tip = `HV10 (${hv10.toFixed(1)}%) < HV30 (${hv30.toFixed(1)}%) — short-term vol contracting`;
          } else {
            arrow = '→'; color = 'var(--text3)';
            tip = `HV10 (${hv10.toFixed(1)}%) ≈ HV30 (${hv30.toFixed(1)}%) — vol stable (within 1pp)`;
          }
          tds[4].textContent = arrow;
          tds[4].style.color = color;
          tds[4].title = tip;
        } else {
          tds[4].textContent = '—';
          tds[4].style.color = 'var(--text3)';
          tds[4].title = 'HV 10d not yet available — pipeline computes on next run';
        }
        tds[4].style.textAlign = 'right';
        tds[4].style.fontSize = '11px';
      }
    });
  }

  const crossVolTbody = document.getElementById('cross-vol-tbody');
  if (crossVolTbody && intraday) {
    const crossPairs = [
      { label: 'EUR/GBP', id: 'eurgbp' },
      { label: 'EUR/JPY', id: 'eurjpy' },
      { label: 'GBP/JPY', id: 'gbpjpy' },
      { label: 'AUD/JPY', id: 'audjpy' },
      { label: 'EUR/AUD', id: 'euraud' },
      { label: 'EUR/NZD', id: 'eurnzd' },
    ];
    const rows = crossVolTbody.querySelectorAll('tr');
    crossPairs.forEach((cp, idx) => {
      const row = rows[idx];
      if (!row) return;
      const q = intraday?.quotes?.[cp.id];
      const tds = row.querySelectorAll('td');
      const hv30 = q?.hv30 ?? null;
      const hv10 = q?.hv10 ?? null;
      const pct  = q?.pct  ?? null;

      if (tds[1]) {
        tds[1].textContent = hv30 != null ? hv30.toFixed(1) + '%' : '—';
        tds[1].style.color = hv30 != null ? (hv30 > 10 ? 'var(--down)' : hv30 < 4 ? 'var(--up)' : 'var(--text)') : 'var(--text3)';
        tds[1].style.fontFamily = 'var(--font-mono)'; tds[1].style.fontSize = '10px';
      }
      if (tds[2]) {
        tds[2].textContent = hv10 != null ? hv10.toFixed(1) + '%' : '—';
        tds[2].style.color = 'var(--text2)';
        tds[2].style.fontFamily = 'var(--font-mono)'; tds[2].style.fontSize = '10px';
      }
      if (tds[3]) {
        if (hv10 != null && hv30 != null) {
          const diff = hv10 - hv30;
          const arrow = diff > 1 ? '↑' : diff < -1 ? '↓' : '→';
          const color = diff > 1 ? 'var(--down)' : diff < -1 ? 'var(--up)' : 'var(--text3)';
          tds[3].textContent = arrow; tds[3].style.color = color;
          tds[3].title = `HV10 ${hv10.toFixed(1)}% vs HV30 ${hv30.toFixed(1)}%`;
        } else {
          tds[3].textContent = '—'; tds[3].style.color = 'var(--text3)';
        }
        tds[3].style.fontSize = '11px';
      }
      if (tds[4]) {
        tds[4].textContent = pct != null ? (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '—';
        tds[4].style.color = pct != null ? (pct > 0 ? 'var(--up)' : pct < 0 ? 'var(--down)' : 'var(--text3)') : 'var(--text3)';
        tds[4].style.fontFamily = 'var(--font-mono)'; tds[4].style.fontSize = '10px';
      }
    });
  }

  const ecbTbody = document.getElementById('ecb-fixings-tbody');
  if (ecbTbody) {
    try {
      const fxRes = await fetch('./fx-data/frankfurter.json').catch(() => null);
      if (fxRes?.ok) {
        const fxJson = await fxRes.json();
        const todayRates = fxJson?.today_eur?.rates ?? fxJson?.today?.rates ?? {};
        const prevRates  = fxJson?.prev_eur?.rates  ?? fxJson?.prev?.rates  ?? {};
        const fxDate     = fxJson?.today?.date  ?? '';

        const ecbPairs = [
          { label: 'EUR/USD', ccy: 'USD' },
          { label: 'EUR/GBP', ccy: 'GBP' },
          { label: 'EUR/JPY', ccy: 'JPY' },
          { label: 'EUR/CHF', ccy: 'CHF' },
          { label: 'EUR/AUD', ccy: 'AUD' },
          { label: 'EUR/CAD', ccy: 'CAD' },
          { label: 'EUR/NZD', ccy: 'NZD' },
          { label: 'EUR/NOK', ccy: 'NOK' },
          { label: 'EUR/SEK', ccy: 'SEK' },
        ];

        const rows = ecbTbody.querySelectorAll('tr');
        const MN = { USD: 4, GBP: 4, JPY: 2, CHF: 4, AUD: 4, CAD: 4, NZD: 4, NOK: 4, SEK: 4 };

        ecbPairs.forEach(({ label, ccy }, i) => {
          const row = rows[i];
          if (!row) return;
          const tds = row.querySelectorAll('td');
          const dec = MN[ccy] ?? 4;
          const today = todayRates[ccy];
          const prev  = prevRates[ccy];
          const chg   = (today != null && prev != null) ? today - prev : null;
          const chgPct = (chg != null && prev != null && prev !== 0) ? (chg / prev) * 100 : null;

          const pairId = ('eur' + ccy).toLowerCase();
          const spot = STOOQ_RT_CACHE?.[pairId]?.close ?? intraday?.quotes?.[pairId]?.close ?? null;
          const vsSpot = (spot != null && today != null) ? spot - today : null;

          const monoStyle = 'font-family:var(--font-mono);font-size:10px;text-align:right;';

          if (tds[0]) tds[0].textContent = label;
          if (tds[1]) { tds[1].textContent = today != null ? today.toFixed(dec) : '—'; tds[1].setAttribute('style', monoStyle); }
          if (tds[2]) { tds[2].textContent = prev  != null ? prev.toFixed(dec)  : '—'; tds[2].setAttribute('style', monoStyle + 'color:var(--text2);'); }
          if (tds[3]) {
            tds[3].textContent = chg != null ? (chg >= 0 ? '+' : '') + chg.toFixed(dec) : '—';
            tds[3].setAttribute('style', monoStyle + `color:${chg == null ? 'var(--text3)' : chg > 0 ? 'var(--up)' : chg < 0 ? 'var(--down)' : 'var(--text3)'};`);
          }
          if (tds[4]) {
            tds[4].textContent = chgPct != null ? (chgPct >= 0 ? '+' : '') + chgPct.toFixed(3) + '%' : '—';
            tds[4].setAttribute('style', monoStyle + `color:${chgPct == null ? 'var(--text3)' : chgPct > 0 ? 'var(--up)' : chgPct < 0 ? 'var(--down)' : 'var(--text3)'};`);
          }
          if (tds[5]) {
            tds[5].textContent = vsSpot != null ? (vsSpot >= 0 ? '+' : '') + vsSpot.toFixed(dec) : '—';
            tds[5].title       = vsSpot != null ? `Spot (${spot.toFixed(dec)}) minus ECB fix (${today.toFixed(dec)})` : 'Spot not available';
            tds[5].setAttribute('style', monoStyle + `color:${vsSpot == null ? 'var(--text3)' : Math.abs(vsSpot) < 0.001 ? 'var(--text3)' : 'var(--text2)'};`);
          }
        });

        const footer = document.getElementById('ecb-fixings-footer');
        if (footer && fxDate) footer.textContent = `ECB · official reference fixing · ${fxDate} · published ~16:00 CET · source: ECB official reference rates`;
      }
    } catch {  }
  }

  const dtccTbody = document.getElementById('dtcc-tbody');
  if (dtccTbody) {
    try {
      const dtccRes = await fetch('./dtcc-data/dtcc_fx.json').catch(() => null);
      if (dtccRes?.ok) {
        const dtcc = await dtccRes.json();
        const pairs = dtcc?.pairs ?? {};
        const totals = dtcc?.totals ?? {};
        const totalNotional = totals?.notional_usd_bn ?? 0;

        const pairKeys = Object.keys(pairs);
        if (dtcc.status === 'pending' || pairKeys.length === 0) {
          dtccTbody.innerHTML = '<tr><td colspan="7" style="color:var(--text3);text-align:center;padding:12px 0;font-size:10px;">Data pending — workflow runs Mon-Fri 14:00 UTC · DTCC GTR T+1</td></tr>';
        } else {
          const maxNotional = pairs[pairKeys[0]]?.notional_usd_bn ?? 1; 

          const rows = pairKeys.map(pair => {
            const d = pairs[pair];
            const byProduct = d.by_product ?? {};
            const swapBn  = byProduct['FxSwap']?.notional_usd_bn    ?? 0;
            const fwdBn   = (byProduct['FxForward']?.notional_usd_bn ?? 0)
                          + (byProduct['FxNDF']?.notional_usd_bn     ?? 0);  
            const spotBn  = byProduct['FxSpot']?.notional_usd_bn    ?? 0;
            const sharePct = totalNotional > 0 ? (d.notional_usd_bn / totalNotional) * 100 : 0;
            const barPct = maxNotional > 0 ? Math.min((d.notional_usd_bn / maxNotional) * 100, 100) : 0;

            const mono = 'font-family:var(--font-mono);font-size:10px;text-align:right;';
            const shareCell = `<td style="${mono}color:var(--text3);position:relative;padding-right:6px;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:${barPct.toFixed(1)}%;background:var(--accent);opacity:0.18;border-radius:0 2px 2px 0;"></div>
              <span style="position:relative;">${sharePct.toFixed(1)}%</span>
            </td>`;
            return `<tr>
              <td style="font-size:10px;">${pair}</td>
              <td style="${mono}color:var(--text);">${d.notional_usd_bn.toFixed(1)}</td>
              <td style="${mono}color:var(--text2);">${d.trade_count.toLocaleString()}</td>
              <td style="${mono}color:var(--text2);">${swapBn > 0 ? swapBn.toFixed(1) : '—'}</td>
              <td style="${mono}color:var(--text2);">${fwdBn  > 0 ? fwdBn.toFixed(1)  : '—'}</td>
              <td style="${mono}color:var(--text2);">${spotBn > 0 ? spotBn.toFixed(1) : '—'}</td>
              ${shareCell}
            </tr>`;
          }).join('');

          const byProd = totals.by_product ?? {};
          const totalSwap = byProd['FxSwap']?.notional_usd_bn ?? 0;
          const totalFwd  = (byProd['FxForward']?.notional_usd_bn ?? 0)
                          + (byProd['FxNDF']?.notional_usd_bn     ?? 0);
          const totalSpot = byProd['FxSpot']?.notional_usd_bn ?? 0;
          const mono = 'font-family:var(--font-mono);font-size:10px;text-align:right;';
          const totRow = `<tr style="border-top:1px solid var(--border2);font-weight:600;">
            <td style="font-size:10px;color:var(--text2);">TOTAL (G10)</td>
            <td style="${mono}color:var(--text);">${totalNotional.toFixed(1)}</td>
            <td style="${mono}color:var(--text2);">${totals.trade_count.toLocaleString()}</td>
            <td style="${mono}color:var(--text2);">${totalSwap > 0 ? totalSwap.toFixed(1) : '—'}</td>
            <td style="${mono}color:var(--text2);">${totalFwd  > 0 ? totalFwd.toFixed(1)  : '—'}</td>
            <td style="${mono}color:var(--text2);">${totalSpot > 0 ? totalSpot.toFixed(1) : '—'}</td>
            <td style="${mono}color:var(--text3);">100%</td>
          </tr>`;

          dtccTbody.innerHTML = rows + totRow;
        }

        const footer = document.getElementById('dtcc-footer');
        if (footer && dtcc.trade_date) {
          footer.textContent = `DTCC GTR · CFTC Recast · trade date ${dtcc.trade_date} · fetched ${dtcc.fetched} · Notional capped at $250M/trade · subset of total OTC FX volume`;
        }
      } else {
        dtccTbody.innerHTML = '<tr><td colspan="7" style="color:var(--text3);text-align:center;padding:12px 0;font-size:10px;">DTCC data unavailable</td></tr>';
      }
    } catch { dtccTbody.innerHTML = '<tr><td colspan="7" style="color:var(--text3);text-align:center;padding:12px 0;font-size:10px;">DTCC data error</td></tr>'; }
  }
}

function initG8RatesTabs() {
  const tabBar = document.getElementById('rates-country-tabs');
  if (!tabBar) return;
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.rates-ctab');
    if (!btn) return;
    const cty = btn.dataset.cty;

    tabBar.querySelectorAll('.rates-ctab').forEach(b => {
      const isActive = b === btn;
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.style.background = isActive ? 'var(--accent)' : 'none';
      b.style.color = isActive ? '#fff' : ((b.dataset.cty === 'spreads' || b.dataset.cty === 'momentum') ? 'var(--accent)' : 'var(--text2)');
      b.style.border = isActive ? 'none' : '1px solid var(--border2)';
    });

    document.querySelectorAll('.rates-country-pane').forEach(p => { p.style.display = 'none'; });
    const pane = document.getElementById('rates-pane-' + cty);
    if (pane) pane.style.display = '';

    if (cty !== 'us' && cty !== 'spreads' && cty !== 'momentum') renderG8YieldPane(cty);
    if (cty === 'spreads') renderSovereignSpreads();
    if (cty === 'momentum') renderMomentumScreener();
  });

  const spreadsSel = document.getElementById('spreads-base-sel');
  if (spreadsSel) spreadsSel.addEventListener('change', () => renderSovereignSpreads(spreadsSel.value));
  const momentumSel = document.getElementById('momentum-base-sel');
  if (momentumSel) momentumSel.addEventListener('change', () => renderMomentumScreener(momentumSel.value));
}

const G8_YIELD_MAP = {
  de: { file: 'EUR', label: 'Germany', subtitle: 'GERMANY · SOVEREIGN BOND YIELDS', tenors: [{ k: 'bond2y', label: '2Y Bund' }, { k: 'bond10y', label: '10Y Bund' }] },
  gb: { file: 'GBP', label: 'UK',      subtitle: 'UK · SOVEREIGN BOND YIELDS',      tenors: [{ k: 'bond2y', label: '2Y Gilt' }, { k: 'bond10y', label: '10Y Gilt' }] },
  jp: { file: 'JPY', label: 'Japan',   subtitle: 'JAPAN · SOVEREIGN BOND YIELDS',   tenors: [{ k: 'bond2y', label: '2Y JGB' }, { k: 'bond10y', label: '10Y JGB' }] },
  au: { file: 'AUD', label: 'Australia', subtitle: 'AUSTRALIA · SOVEREIGN BOND YIELDS', tenors: [{ k: 'bond2y', label: '2Y ACGB' }, { k: 'bond10y', label: '10Y ACGB' }] },
  ca: { file: 'CAD', label: 'Canada',  subtitle: 'CANADA · SOVEREIGN BOND YIELDS',  tenors: [{ k: 'bond2y', label: '2Y CGB' }, { k: 'bond10y', label: '10Y CGB' }] },
  nz: { file: 'NZD', label: 'New Zealand', subtitle: 'NEW ZEALAND · SOVEREIGN BOND YIELDS', tenors: [{ k: 'bond2y', label: '2Y NZGB' }, { k: 'bond10y', label: '10Y NZGB' }] },
  no: { file: 'NOK', label: 'Norway',   subtitle: 'NORWAY · SOVEREIGN BOND YIELDS',   tenors: [{ k: 'bond2y', label: '2Y NGB' }, { k: 'bond10y', label: '10Y NGB' }] },
  se: { file: 'SEK', label: 'Sweden',   subtitle: 'SWEDEN · SOVEREIGN BOND YIELDS',   tenors: [{ k: 'bond2y', label: '2Y SGB' }, { k: 'bond10y', label: '10Y SGB' }] },
  ch: { file: 'CHF', label: 'Switzerland', subtitle: 'SWITZERLAND · SOVEREIGN BOND YIELDS', tenors: [{ k: 'bond2y', label: '2Y Conf.' }, { k: 'bond10y', label: '10Y Conf.' }] },
};

async function renderG8YieldPane(cty) {
  const pane = document.getElementById('rates-pane-' + cty);
  const contentEl = document.getElementById('rates-g8-content-' + cty);
  if (!pane || !contentEl) return;
  if (contentEl.dataset.loaded) return; 

  const cfg = G8_YIELD_MAP[cty];
  if (!cfg) return;

  try {
    const [ext, hist2y, hist10y] = await Promise.all([
      fetch('./extended-data/' + cfg.file + '.json').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('./bond2y-data/' + cfg.file + '.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('./bond10y-data/' + cfg.file + '.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (!ext) { contentEl.textContent = 'Data unavailable — extended-data/' + cfg.file + '.json'; return; }

    const d = ext.data ?? ext;
    let chg2y = null;
    if (Array.isArray(hist2y) && hist2y.length >= 2) {
      const sorted = [...hist2y].sort((a, b) => a.date < b.date ? -1 : 1);
      const last = sorted[sorted.length - 1], prev = sorted[sorted.length - 2];
      if (last?.value != null && prev?.value != null) chg2y = (last.value - prev.value) * 100;
    }
    let chg10y = null;
    if (Array.isArray(hist10y) && hist10y.length >= 2) {
      const sorted = [...hist10y].sort((a, b) => a.date < b.date ? -1 : 1);
      const last = sorted[sorted.length - 1], prev = sorted[sorted.length - 2];
      if (last?.value != null && prev?.value != null) chg10y = (last.value - prev.value) * 100;
    }

    let html = `<div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">${cfg.subtitle}</div>`;
    const cols = cfg.tenors.length === 1 ? '1fr' : '1fr 1fr';
    html += `<div class="rates-grid" style="margin-bottom:6px;grid-template-columns:${cols};">`;
    cfg.tenors.forEach(t => {
      const val = d[t.k];
      const valStr = val != null ? val.toFixed(2) + '%' : '—';
      let chgStr = '—', chgCls = 'flat', chgTitle = 'No daily history pipeline for this tenor yet';
      if (t.k === 'bond2y') {
        chgTitle = 'Day-over-day change · sourced from bond2y-data/';
        if (chg2y != null) {
          chgStr = (chg2y >= 0 ? '+' : '') + chg2y.toFixed(1) + 'bp';
          chgCls = chg2y > 0 ? 'up' : chg2y < 0 ? 'down' : 'flat';
        }
      } else if (t.k === 'bond10y') {
        chgTitle = 'Day-over-day change · sourced from bond10y-data/';
        if (chg10y != null) {
          chgStr = (chg10y >= 0 ? '+' : '') + chg10y.toFixed(1) + 'bp';
          chgCls = chg10y > 0 ? 'up' : chg10y < 0 ? 'down' : 'flat';
        } else {
          chgTitle = 'Accumulating history — bond10y-data/ has no prior-day observation yet for this currency';
        }
      }
      html += `<div class="rate-cell">` +
        `<div class="rate-cty">${t.label}</div>` +
        `<div class="rate-val">${valStr}</div>` +
        `<div class="rate-chg ${chgCls}" title="${chgTitle}">${chgStr}</div>` +
        `</div>`;
    });
    html += '</div>';
    const dateLbl = ext?.dates?.bond10y ? ext.dates.bond10y : '';
    html += `<div style="font-size:9px;color:var(--text3);">Daily sovereign yield pipeline${dateLbl ? ' · ' + dateLbl : ''}</div>`;
    contentEl.innerHTML = html;
    contentEl.dataset.loaded = '1';
  } catch {
    contentEl.textContent = 'Failed to load yield data.';
  }
}

const G10_RATE_CCYS = [
  { code: 'us', ccy: 'USD', label: 'United States' },
  { code: 'de', ccy: 'EUR', label: 'Germany' },
  { code: 'gb', ccy: 'GBP', label: 'UK' },
  { code: 'jp', ccy: 'JPY', label: 'Japan' },
  { code: 'au', ccy: 'AUD', label: 'Australia' },
  { code: 'ca', ccy: 'CAD', label: 'Canada' },
  { code: 'nz', ccy: 'NZD', label: 'New Zealand' },
  { code: 'no', ccy: 'NOK', label: 'Norway' },
  { code: 'se', ccy: 'SEK', label: 'Sweden' },
  { code: 'ch', ccy: 'CHF', label: 'Switzerland' },
];

let _spreadsBaseCcy = 'USD';
const _spreadsRowsCache = {}; 

async function renderSovereignSpreads(base) {
  base = base || _spreadsBaseCcy;
  _spreadsBaseCcy = base;

  const tbody = document.getElementById('sovereign-spreads-tbody');
  if (!tbody) return;

  const baseInfo = G10_RATE_CCYS.find(c => c.ccy === base) || G10_RATE_CCYS[0];
  const baseShort = baseInfo.code.toUpperCase();
  const baseLabelEl = document.getElementById('spreads-base-label');
  if (baseLabelEl) baseLabelEl.textContent = baseShort;
  const th10 = document.getElementById('spreads-th-10y');
  const th2 = document.getElementById('spreads-th-2y');
  if (th10) { th10.textContent = 'vs ' + baseShort + ' (bp)'; th10.title = 'Spread vs ' + baseShort + ' 10Y in basis points'; }
  if (th2) { th2.textContent = 'vs ' + baseShort + ' (bp)'; th2.title = 'Spread vs ' + baseShort + ' 2Y in basis points'; }

  if (_spreadsRowsCache[base]) { tbody.innerHTML = _spreadsRowsCache[base]; return; }
  tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text3);text-align:center;padding:8px 0;">Loading…</td></tr>';

  const countries = G10_RATE_CCYS.filter(c => c.ccy !== base);

  try {
    const baseExt = await fetch('./extended-data/' + base + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
    const baseData = baseExt?.data ?? baseExt;
    const base10y = baseData?.bond10y ?? null;
    const base2y = baseData?.bond2y ?? null;

    const fmtSpread = v => v == null ? '—' : (v >= 0 ? '+' : '') + Math.round(v) + ' bp';
    const colorSpread = v => v == null ? '' : v > 20 ? 'var(--up)' : v < -20 ? 'var(--down)' : 'var(--text2)';

    const rowsHtml = await Promise.all(countries.map(async c => {
      try {
        const ext = await fetch('./extended-data/' + c.ccy + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
        const d = ext?.data ?? ext;
        const cty10y = d?.bond10y ?? null;
        const cty2y = d?.bond2y ?? null;
        const stale2y = ext?.sources?.bond2y === 'stale-cached';

        const spread10 = (cty10y != null && base10y != null) ? (cty10y - base10y) * 100 : null;
        const spread2 = (cty2y != null && base2y != null && !stale2y) ? (cty2y - base2y) * 100 : null;
        const slope = (cty2y != null && cty10y != null && !stale2y) ? (cty10y - cty2y) * 100 : null;

        return `<tr>` +
          `<td><span class="fi fi-${c.code}" style="margin-right:4px;border-radius:1px;vertical-align:middle;"></span><span>${c.code.toUpperCase()}</span></td>` +
          `<td>${cty10y != null ? cty10y.toFixed(2) + '%' : '—'}</td>` +
          `<td style="color:${colorSpread(spread10)}">${fmtSpread(spread10)}</td>` +
          `<td style="color:${stale2y ? 'var(--text3)' : ''}" title="${stale2y ? `Stale — no fresh 2Y source available this run (cached ${ext?.dates?.bond2y || 'unknown date'})` : ''}">${cty2y != null ? cty2y.toFixed(2) + '%' : '—'}</td>` +
          `<td style="color:${colorSpread(spread2)}" title="${stale2y ? '2Y is stale-cached — spread excluded to avoid a false reading' : ''}">${fmtSpread(spread2)}</td>` +
          `<td style="color:${slope == null ? '' : slope < 0 ? 'var(--down)' : slope > 50 ? 'var(--up)' : 'var(--text2)'}" title="${slope == null ? (stale2y ? '2Y is stale-cached — slope excluded to avoid a false reading' : '') : slope < 0 ? 'Inverted curve' : slope < 25 ? 'Flat curve' : 'Normal curve'}">${slope == null ? '—' : (slope >= 0 ? '+' : '') + slope.toFixed(0) + ' bp'}</td>` +
        `</tr>`;
      } catch {
        return `<tr><td><span class="fi fi-${c.code}" style="margin-right:4px;border-radius:1px;vertical-align:middle;"></span><span>${c.code.toUpperCase()}</span></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>`;
      }
    }));

    const html = rowsHtml.join('');
    _spreadsRowsCache[base] = html;
    tbody.innerHTML = html;
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text3);text-align:center;padding:8px 0;">Data unavailable</td></tr>';
  }
}

let _momentumBaseCcy = 'USD';
const _momentumRowsCache = {}; 

async function renderMomentumScreener(base) {
  base = base || _momentumBaseCcy;
  _momentumBaseCcy = base;

  const tbody = document.getElementById('momentum-screener-tbody');
  if (!tbody) return;

  const baseInfo = G10_RATE_CCYS.find(c => c.ccy === base) || G10_RATE_CCYS[0];
  const baseShort = baseInfo.code.toUpperCase();
  const baseLabelEl = document.getElementById('momentum-base-label');
  if (baseLabelEl) baseLabelEl.textContent = baseShort;
  const th2y = document.getElementById('mom-th-2y');
  if (th2y) { th2y.textContent = '2Y vs ' + baseShort + ' (bp)'; th2y.title = 'Current 2Y yield spread vs ' + baseShort + ', in basis points'; }

  if (_momentumRowsCache[base]) { tbody.innerHTML = _momentumRowsCache[base]; return; }
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text3);text-align:center;padding:8px 0;">Loading…</td></tr>';

  const countries = G10_RATE_CCYS.filter(c => c.ccy !== base);

  const [baseHist, ...histRes] = await Promise.all([
    fetch(`./bond2y-data/${base}.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ...countries.map(c => fetch(`./bond2y-data/${c.ccy}.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)),
  ]);

  const baseByDate = {};
  (Array.isArray(baseHist) ? baseHist : []).forEach(r => { baseByDate[r.date] = r.value; });

  const results = countries.map((c, i) => {
    const hist = histRes[i];
    if (!Array.isArray(hist) || !hist.length) return { ...c, insufficient: true };

    const spreadSeries = hist
      .filter(r => baseByDate[r.date] != null)
      .map(r => ({ date: r.date, spread: (r.value - baseByDate[r.date]) * 100 }))
      .sort((a, b) => a.date < b.date ? -1 : 1);

    if (spreadSeries.length < 6) return { ...c, insufficient: true };

    const n = spreadSeries.length;
    const now = spreadSeries[n - 1].spread;
    const d5 = spreadSeries[n - 6].spread != null ? now - spreadSeries[n - 6].spread : null;
    const d20 = n >= 21 ? now - spreadSeries[n - 21].spread : null;
    return { ...c, now, d5, d20, insufficient: false };
  });

  results.sort((a, b) => {
    const av = (!a.insufficient && a.d5 != null) ? Math.abs(a.d5) : -1;
    const bv = (!b.insufficient && b.d5 != null) ? Math.abs(b.d5) : -1;
    return bv - av;
  });

  const fmtBp = v => v == null ? '—' : (v >= 0 ? '+' : '') + Math.round(v) + ' bp';
  const colorBp = v => v == null ? 'var(--text2)' : v > 20 ? 'var(--up)' : v < -20 ? 'var(--down)' : 'var(--text2)';
  const momBarHtml = (v, ccy, baseCcy) => {
    if (v == null) return '<span class="mom-bar-wrap"><span class="mom-bar-tick"></span></span>';
    const pct = Math.min(Math.abs(v) * 2, 50);
    const dir = v >= 0 ? 'pos' : 'neg';
    const leader = v >= 0 ? ccy : baseCcy;
    const title = `${leader} has the stronger 2Y rate momentum (20D spread change ${v >= 0 ? '+' : ''}${v.toFixed(0)} bp in ${leader}'s favor)`;
    return `<span class="mom-bar-wrap" title="${title}"><span class="mom-bar-tick"></span><span class="mom-bar ${dir}" style="width:${pct}%;"></span></span>`;
  };

  const html = results.map(r => {
    const flagHtml = `<span class="fi fi-${r.code}" style="margin-right:4px;border-radius:1px;vertical-align:middle;"></span><span>${r.ccy}</span>`;
    if (r.insufficient) {
      return `<tr><td>${flagHtml}</td><td colspan="4" style="color:var(--text3);">Accumulating history…</td></tr>`;
    }
    return `<tr class="mom-row" data-ccy="${r.ccy}" style="cursor:pointer;" title="Compare ${r.ccy} 2Y vs ${base} 2Y on the price chart">
      <td>${flagHtml}</td>
      <td style="color:${colorBp(r.now)}">${fmtBp(r.now)}</td>
      <td style="color:${colorBp(r.d5)}">${fmtBp(r.d5)}</td>
      <td style="color:${colorBp(r.d20)}">${fmtBp(r.d20)}</td>
      <td>${momBarHtml(r.d20, r.ccy, base)}</td>
    </tr>`;
  }).join('');
  _momentumRowsCache[base] = html;
  tbody.innerHTML = html;

  if (!tbody.dataset.clickBound) {
    tbody.dataset.clickBound = '1';
    tbody.addEventListener('click', function (e) {
      const row = e.target.closest('.mom-row');
      if (!row || !row.dataset.ccy) return;
      if (typeof _lwEnterYieldSpreadView === 'function') {
        _lwEnterYieldSpreadView(_momentumBaseCcy, row.dataset.ccy);
      }
      document.getElementById('section-fxpairs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

let _lwYieldViewActive = false;
let _lwYieldSeriesA = null;
let _lwYieldSeriesB = null;
let _lwYieldResizeObs = null;
let _lwYieldReturnOhlcId = null;

function _lwCcyFlagCode(ccy) {
  const m = G10_RATE_CCYS.find(c => c.ccy === ccy);
  return m ? m.code : ccy.slice(0, 2).toLowerCase();
}

function _lwTeardownYieldView() {
  if (_lwYieldResizeObs) { try { _lwYieldResizeObs.disconnect(); } catch(_e) {} _lwYieldResizeObs = null; }
  if (_lwChart) { try { _lwChart.remove(); } catch(_e) {} _lwChart = null; }
  _lwYieldSeriesA = null;
  _lwYieldSeriesB = null;
  const banner = document.getElementById('lw-yield-banner');
  if (banner) banner.remove();
}

function _lwExitYieldSpreadView() {
  if (!_lwYieldViewActive) return;
  _lwYieldViewActive = false;
  _lwTeardownYieldView();
  const _returnId = _lwYieldReturnOhlcId;
  _lwYieldReturnOhlcId = null;
  if (_returnId) {
    _renderLWChart(_returnId).catch(function (e) { console.warn('[yield-spread-view] exit re-render failed:', e.message); });
  }
}

async function _lwEnterYieldSpreadView(baseCcy, rowCcy) {
  const wrap = document.getElementById('tv-chart-wrap');
  if (!wrap) return;
  await _ensureLWLib();
  const LWC = window.LightweightCharts;
  if (!LWC) return;

  if (_lwYieldViewActive) { _lwTeardownYieldView(); }
  else {
    _lwYieldReturnOhlcId = _lwActiveOhlcId;
    _destroyLWChart();
  }
  wrap.innerHTML = '';
  wrap.style.marginBottom = '0';
  wrap.style.pointerEvents = 'auto';
  _lwYieldViewActive = true;

  const _yieldHdrEl = document.getElementById('lw-chart-header');
  if (_yieldHdrEl) _yieldHdrEl.style.display = 'none';

  const chartDiv = document.createElement('div');
  chartDiv.style.cssText = 'width:100%;height:100%;touch-action:none;';
  wrap.appendChild(chartDiv);

  const chartW = wrap.offsetWidth  || wrap.clientWidth  || 600;
  const chartH = wrap.offsetHeight || wrap.clientHeight || 290;

  _lwChart = LWC.createChart(chartDiv, {
    layout:      { background: { color: _themeColor('--bg') }, textColor: _themeColor('--text'), attributionLogo: false },
    grid:        { vertLines: { color: _themeColorAlpha('--border', 0.5) }, horzLines: { color: _themeColorAlpha('--border', 0.5) } },
    crosshair:   { mode: LWC.CrosshairMode.Normal,
                   vertLine: { color: _themeColorAlpha('--text2', 0.5), labelBackgroundColor: _themeColor('--bg3') },
                   horzLine: { color: _themeColorAlpha('--text2', 0.5), labelBackgroundColor: _themeColor('--bg3') } },
    rightPriceScale: { borderColor: _themeColor('--border'), minimumWidth: 65, scaleMargins: { top: 0.06, bottom: 0.06 } },
    timeScale:   { borderColor: _themeColor('--border'), timeVisible: false, secondsVisible: false,
                   rightOffset: 4, minBarSpacing: 1, fixLeftEdge: false, fixRightEdge: false },
    handleScroll:  { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale:   { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true } },
    width:  chartW,
    height: chartH,
  });

  if (typeof ResizeObserver !== 'undefined') {
    _lwYieldResizeObs = new ResizeObserver(function (entries) {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (_lwChart && width > 0 && height > 0) { try { _lwChart.resize(width, height); } catch(_e) {} }
      }
    });
    _lwYieldResizeObs.observe(chartDiv);
  }

  const YIELD_COLORS = ['#42a5f5', '#ffa726']; 
  const legs = [
    { ccy: baseCcy, color: YIELD_COLORS[0] },
    { ccy: rowCcy,  color: YIELD_COLORS[1] },
  ];
  const priceFormat = { type: 'custom', formatter: v => v.toFixed(2) + '%' };

  const banner = document.createElement('div');
  banner.id = 'lw-yield-banner';
  banner.style.cssText = 'position:absolute;top:8px;left:8px;z-index:5;display:flex;align-items:center;gap:14px;padding:6px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:4px;font-family:var(--font-mono,monospace);font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,.25);';
  banner.innerHTML = legs.map(function (l) {
    return `<span class="lw-yield-leg" data-ccy="${l.ccy}" style="display:flex;align-items:center;gap:5px;">` +
      `<span class="fi fi-${_lwCcyFlagCode(l.ccy)}" style="border-radius:1px;"></span>` +
      `<span style="color:var(--text2);">${l.ccy}<span class="lw-yield-2y-tag"> 2Y</span></span>` +
      `<span class="lw-yield-val" style="color:${l.color};font-weight:700;">—</span></span>`;
  }).join('') +
    `<span class="lw-yield-spread" style="color:var(--text2);border-left:1px solid var(--border);padding-left:14px;">spread —</span>` +
    `<button id="lw-yield-close" title="Back to price chart" aria-label="Back to price chart" style="margin-left:4px;background:none;border:none;color:var(--text2);cursor:pointer;font-size:13px;line-height:1;padding:2px 4px;">&#10005;</button>`;
  wrap.style.position = 'relative';
  wrap.appendChild(banner);
  document.getElementById('lw-yield-close')?.addEventListener('click', _lwExitYieldSpreadView);

  const valEls = banner.querySelectorAll('.lw-yield-val');
  const spreadEl = banner.querySelector('.lw-yield-spread');

  try {
    const [seriesA, seriesB] = await Promise.all(legs.map(async function (l) {
      const seriesOpts = {
        lineColor: l.color, topColor: l.color + '26', bottomColor: l.color + '02',
        lineWidth: 2, priceScaleId: 'right', priceFormat,
        lastValueVisible: true, priceLineVisible: false,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
      };
      const mk = LWC.AreaSeries
        ? _lwChart.addSeries(LWC.AreaSeries, seriesOpts)
        : _lwChart.addAreaSeries(seriesOpts);
      const r = await fetch(`./bond2y-data/${l.ccy}.json`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const hist = await r.json();
      const seriesData = (Array.isArray(hist) ? hist : [])
        .filter(o => o.date && o.value != null)
        .map(o => ({ time: o.date, value: parseFloat(o.value) }))
        .sort((a, b) => a.time < b.time ? -1 : 1);
      if (seriesData.length < 2) throw new Error('insufficient 2Y yield points for ' + l.ccy);
      mk.setData(seriesData);
      return { series: mk, data: seriesData, ccy: l.ccy };
    }));

    if (!_lwYieldViewActive || !_lwChart) return; 

    _lwYieldSeriesA = seriesA.series;
    _lwYieldSeriesB = seriesB.series;
    try { _lwChart.timeScale().fitContent(); } catch(_e) {}

    const lastA = seriesA.data[seriesA.data.length - 1].value;
    const lastB = seriesB.data[seriesB.data.length - 1].value;
    const setLegend = (vA, vB) => {
      valEls[0].textContent = vA == null ? '—' : vA.toFixed(2) + '%';
      valEls[1].textContent = vB == null ? '—' : vB.toFixed(2) + '%';
      const sp = (vA != null && vB != null) ? Math.round((vA - vB) * 100) : null;
      spreadEl.textContent = sp == null ? 'spread —' : `spread ${sp >= 0 ? '+' : ''}${sp} bp`;
    };
    setLegend(lastA, lastB);

    _lwChart.subscribeCrosshairMove(function (param) {
      if (!_lwYieldViewActive) return;
      if (!param || !param.time || !param.seriesData) { setLegend(lastA, lastB); return; }
      const vA = param.seriesData.get(seriesA.series);
      const vB = param.seriesData.get(seriesB.series);
      setLegend(vA ? vA.value : null, vB ? vB.value : null);
    });
  } catch (err) {
    console.warn('[yield-spread-view] Failed to load 2Y yield data:', err.message);
    _lwExitYieldSpreadView();
  }
}

const _CCY_PFXS = ['united states ','euro area ','united kingdom ','japan ',
  'australia ','canada ','switzerland ','new zealand ','norway ','sweden '];
const _ESI_VENDOR_ALIASES = {
  'core retail sales mom': 'retail sales ex autos mom',
  'prelim gdp qoq': 'gdp growth rate qoq',
  'cpi mom': 'inflation rate mom',
  'cpi yoy': 'inflation rate yoy',
  'trimmed mean cpi mom': 'rba trimmed mean cpi mom',
  'unemployment claims': 'initial jobless claims',
  'revised uom consumer sentiment': 'michigan consumer sentiment',
  'revised uom inflation expectations': 'michigan inflation expectations',
  'prelim gdp price index qoq': 'gdp price index qoq',
  'gdp qoq': 'gdp growth rate qoq',
  'ivey pmi': 'ivey pmi s.a',
  'nonfarm payrolls': 'non farm payrolls',
  'trade balance': 'balance of trade',
  'core cpi yoy': 'core inflation rate yoy',
  'nationwide hpi mom': 'nationwide housing prices mom',
  'nationwide hpi yoy': 'nationwide housing prices yoy',
};
const _canonEsi = t => {
  let s = t.replace(/\s*\([^)]*\)/g,'').trim();
  s = s.replace(/\bm\/m\b/gi, 'mom').replace(/\by\/y\b/gi, 'yoy').replace(/\bq\/q\b/gi, 'qoq');
  for (const p of _CCY_PFXS) { if (s.startsWith(p)) { s = s.slice(p.length); break; } }
  if (_ESI_VENDOR_ALIASES[s]) s = _ESI_VENDOR_ALIASES[s];
  return s;
};

const _parseNum = s => {
  if (s == null || s === '') return NaN;
  const str = String(s).replace(/,/g, '');
  const neg  = str.includes('-');
  const digits = str.replace(/[^\d.]/g, '');
  const n = parseFloat(digits);
  return isNaN(n) ? NaN : (neg ? -n : n);
};

const NOISE_KW = [
  'cftc','baker hughes','rig count','auction','api weekly',
  'milk auction','fed\'s balance sheet','reserve balances',
  'redbook','ibd/tipp','tips auction','note auction','bond auction',
  'gilt auction','jgb auction','obligaciones','speculative net',
  'nc net position','crude oil inventories','crude oil imports',
  'distillate','gasoline inventorie','gasoline production',
  'refinery','heating oil','natural gas storage',
  'foreign bonds buying','foreign investments in japanese',
  'foreign bond investment','foreign investment in japan',
  'm2 money','m3 money','m4 money','reserve assets total',
  'cb leading index','atlanta fed gdpnow','ny fed','cleveland cpi',
  'ibd','3-month bill','4-week bill','52-week bill',
  '4-week average','4-week avg',
  'tic net','net long-term tic','total net tic',
  'interest rate projection',
  'eia crude oil','eia crude',
  'myfxbook',
];

const INVERSE_KW = ['unemployment', 'unemployed', 'jobless', 'claims', 'deficit'];

async function renderEconSurprises() {
  const tbody = document.getElementById('econ-surprise-tbody');
  if (!tbody) return;

  const nowMs = Date.now();
  const LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
  window._ES_SEEN = new Set(); 

  let calEvents = [];
  let calSource = '';
  try {
    const res = await fetch('./calendar-data/calendar.json', { cache: 'no-store' }).catch(() => null);
    if (res?.ok) {
      const calj = await res.json();
      const evts = (calj?.events || []).map(ev => ({
        title:    ev.event || ev.title || '',
        currency: ev.currency || '',
        dateISO:  ev.dateISO || '',
        impact:   ev.impact || 'low',
        forecast: ev.forecast || null,
        previous: ev.previous || null,
        actual:   ev.actual || null,
        released: !!(ev.actual && ev.actual !== '' && ev.actual !== '-'),
      }));
      const hasReleased = evts.some(ev => {
        const t = new Date(ev.dateISO).getTime();
        return !isNaN(t) && nowMs - t <= LOOKBACK_MS && ev.released;
      });
      if (hasReleased) { calEvents = evts; calSource = calj.source || ''; }
      window._ECON_SURPRISE_STATS = calj.surpriseStats || {};
    }
  } catch {  }

  if (!calEvents.length) {
    try {
      const res2 = await fetch('./calendar-data/economic-events.json').catch(() => null);
      if (res2?.ok) {
        const ffj = await res2.json();
        const win21 = 21 * 24 * 60 * 60 * 1000;
        const evts = (ffj?.events || []).map(ev => ({
          title: ev.event || ev.title || '', currency: ev.currency || '',
          dateISO: ev.dateISO || '', impact: ev.impact || 'low',
          forecast: ev.forecast || null, previous: ev.previous || null,
          actual: ev.actual || null,
          released: !!(ev.actual && ev.actual !== '' && ev.actual !== '-'),
        }));
        const hasReleased = evts.some(ev => {
          const t = new Date(ev.dateISO).getTime();
          return !isNaN(t) && nowMs - t <= win21 && ev.released && ev.actual != null;
        });
        if (hasReleased) { calEvents = evts; calSource = ffj.source || 'calendar-primary'; }
      }
    } catch {  }
  }

  const DECAY_LAMBDA = Math.LN2 / 45;

  const WIDE_LOOKBACK_MS = 180 * 24 * 60 * 60 * 1000;
  const ccyScores  = {};
  const widenedCcys = new Set();

  function _scorePass(minAgeMs, maxAgeMs, limitCcys) {
    calEvents.forEach(ev => {
      const evTime = new Date(ev.dateISO).getTime();
      if (isNaN(evTime) || evTime > nowMs) return;
      const ageMs = nowMs - evTime;
      if (ageMs <= minAgeMs || ageMs > maxAgeMs) return;
      if (!ev.released || ev.actual == null) return;
      if (!['medium','high'].includes(ev.impact)) return;
      const ccy = ev.currency;
      if (!['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK'].includes(ccy)) return;
      if (limitCcys && !limitCcys.has(ccy)) return;

      const evTitle = (ev.event || ev.title || '').toLowerCase();
      if (NOISE_KW.some(kw => evTitle.includes(kw))) return;

      const canonEvent = _canonEsi(evTitle);
      const dedupKey = `${ccy}/${canonEvent}/${String(ev.actual).replace(/[%,\s]/g,'')}/${String(ev.forecast||ev.previous||'').replace(/[%,\s]/g,'')}`;
      if (!window._ES_SEEN) window._ES_SEEN = new Set();
      if (window._ES_SEEN.has(dedupKey)) return;
      window._ES_SEEN.add(dedupKey);

      const actual   = _parseNum(ev.actual);
      const forecast = _parseNum(ev.forecast || ev.previous);
      if (isNaN(actual) || isNaN(forecast)) return;

      const isInverse = INVERSE_KW.some(kw => evTitle.includes(kw));
      const beat = isInverse ? actual < forecast : actual > forecast;
      const miss = isInverse ? actual > forecast : actual < forecast;
      const rawSurprise = actual - forecast;
      const surprise    = isInverse ? -rawSurprise : rawSurprise;

      const ageDays    = (nowMs - evTime) / 86400000;
      const impactMult = ev.impact === 'high' ? 1.0 : 0.5;
      const w = Math.exp(-DECAY_LAMBDA * ageDays) * impactMult;

      const CANONICAL_MIN_N = 5;
      const statsKey = `${ccy}/${_canonEsi(evTitle)}`;
      const stats = (window._ECON_SURPRISE_STATS || {})[statsKey];
      const useZScore = stats && stats.n >= CANONICAL_MIN_N && stats.std > 0;
      const zScore = useZScore ? (surprise - stats.mean) / stats.std : null;

      if (!ccyScores[ccy]) ccyScores[ccy] = {
        total: 0, beats: 0, misses: 0,
        wTotal: 0, wBeats: 0, wMisses: 0,
        zWSum: 0, zWTotal: 0, zWBeats: 0, zWMisses: 0,
      };
      ccyScores[ccy].total++;
      ccyScores[ccy].wTotal += w;
      if (beat) { ccyScores[ccy].beats++;  ccyScores[ccy].wBeats  += w; }
      if (miss) { ccyScores[ccy].misses++; ccyScores[ccy].wMisses += w; }
      if (zScore !== null) {
        ccyScores[ccy].zWSum   += zScore * w;
        ccyScores[ccy].zWTotal += w;
        if (beat) ccyScores[ccy].zWBeats += w;
        if (miss) ccyScores[ccy].zWMisses += w;
      }
    });
  }

  _scorePass(0, LOOKBACK_MS, null);

  const G10_CCYS = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK'];
  const sparseCcys = new Set(G10_CCYS.filter(c => !ccyScores[c] || ccyScores[c].wTotal === 0));
  if (sparseCcys.size > 0) {
    _scorePass(LOOKBACK_MS, WIDE_LOOKBACK_MS, sparseCcys);
    G10_CCYS.forEach(c => { if (sparseCcys.has(c) && ccyScores[c]?.wTotal > 0) widenedCcys.add(c); });
  }

  const G8 = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK'];
  const rows = tbody.querySelectorAll('tr');

  G8.forEach((ccy, idx) => {
    const row = rows[idx];
    if (!row) return;
    const tds = row.querySelectorAll('td');
    const barFill = row.querySelector('.es-bar-fill');
    const s = ccyScores[ccy];
    const isWidened = widenedCcys.has(ccy);

    if (!s || s.total === 0) {
      if (barFill) { barFill.style.width = '0%'; barFill.style.left = '50%'; barFill.style.background = 'var(--border2)'; }
      if (tds[2]) { tds[2].textContent = '—'; tds[2].style.color = 'var(--text3)'; }
      row.title = `${ccy}: no released events with actuals in 90d window`;
      return;
    }

    let idx100;
    const zFraction = s.zWTotal / s.wTotal;
    if (s.zWTotal >= 10 || (s.zWTotal > 0 && zFraction >= 0.30)) {
      const nonZWTotal = s.wTotal  - s.zWTotal;
      const nonZWBeat  = s.wBeats  - s.zWBeats;
      const nonZWMiss  = s.wMisses - s.zWMisses;
      const zPart  = s.zWTotal   > 0 ? (s.zWSum / s.zWTotal) * 50 : 0;
      const bmPart = nonZWTotal  > 0 ? ((nonZWBeat - nonZWMiss) / nonZWTotal) * 100 : 0;
      idx100 = (zPart * s.zWTotal + bmPart * nonZWTotal) / s.wTotal;
    } else {
      idx100 = s.wTotal > 0 ? ((s.wBeats - s.wMisses) / s.wTotal) * 100 : 0;
    }
    const CONFIDENCE_MIN_N = 15;
    const confidence = Math.min(1, s.total / CONFIDENCE_MIN_N);
    idx100 *= confidence;

    const halfPct = Math.min(Math.abs(idx100), 100) / 2; 
    const positive = idx100 >= 0;
    const color = positive ? 'var(--up)' : 'var(--down)';

    const lowConf = s.total < 15;

    if (barFill) {
      barFill.style.width      = halfPct.toFixed(1) + '%';
      barFill.style.left       = positive ? '50%' : (50 - halfPct).toFixed(1) + '%';
      barFill.style.background = color;
      barFill.style.opacity    = '1';
    }

    if (tds[2]) {
      tds[2].textContent = s.total;
      tds[2].style.color = lowConf ? 'var(--text4, rgba(255,255,255,0.3))' : 'var(--text3)';
      tds[2].title = isWidened
        ? 'Window extended to 180d (sparse coverage in 90d — same impact filter and decay)'
        : (lowConf ? 'Low sample size — interpret with caution' : '');
    }

    const pct = (s.beats / s.total * 100).toFixed(0);
    const inLine = s.total - s.beats - s.misses;
    const windowNote = isWidened ? ' · 90d/180d adaptive window' : ' · 90d window';
    row.title = `${ccy}: ${s.beats} beat · ${s.misses} miss · ${inLine} in-line · ${pct}% beat rate · index ${idx100 >= 0 ? '+' : ''}${idx100.toFixed(0)} · decay-weighted (45d half-life)${windowNote} · click for detail`;
  });

  (function _writeSourceLabel() {
    const srcEl = document.getElementById('econ-surprise-source');
    if (!srcEl) return;
    if (!calSource) {
      srcEl.textContent = 'Calendar data unavailable';
      srcEl.style.display = '';
    } else if (widenedCcys.size > 0) {
      srcEl.textContent = 'Window extended to 180d for sparse-coverage currencies';
      srcEl.style.display = '';
    } else {
      srcEl.textContent = '';
      srcEl.style.display = 'none';
    }
  })();

  if (tbody && !tbody._esmKeyBound) {
    tbody._esmKeyBound = true;
    tbody.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        const row = ev.target.closest('tr');
        const ccy = row?.querySelector('td')?.textContent?.trim();
        if (ccy && window.openEconSurprisesModal) {
          ev.preventDefault();
          window.openEconSurprisesModal(ccy);
        }
      }
    });
  }
}

function initDerivativesNav() {
  const allNavLinks = document.querySelectorAll('.top-nav a[data-target]');
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.target;
      const derivSection = document.getElementById('section-derivatives');
      if (!derivSection) return;
      if (target === 'section-derivatives') {
        derivSection.style.display = '';
        renderDerivativesSection();
      } else {
        derivSection.style.display = 'none';
      }
    });
  });
}

async function loadCBRatesCache() {
  const ccyFiles = {
    USD: 'rates/USD.json', EUR: 'rates/EUR.json', GBP: 'rates/GBP.json',
    JPY: 'rates/JPY.json', AUD: 'rates/AUD.json', CAD: 'rates/CAD.json',
    CHF: 'rates/CHF.json', NZD: 'rates/NZD.json',
  };
  await Promise.all(Object.entries(ccyFiles).map(async ([ccy, path]) => {
    try {
      const r = await fetch('./' + path, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const obs = d.observations;
      const raw = Array.isArray(obs) && obs.length > 0
        ? obs[0].value           
        : (d.rate ?? d.value ?? null); 
      if (raw != null && !isNaN(+raw)) window._CB_RATES_CACHE[ccy] = +raw;
    } catch {  }
  }));
}

async function loadOISRatesCache() {
  try {
    const r = await fetch('./ois-rates/rates.json', { cache: 'no-store' });
    if (!r.ok) return;
    const d = await r.json();
    const rates   = d.rates   || {};
    const sources = d.sources || {};
    for (const [ccy, val] of Object.entries(rates)) {
      if (val != null && !isNaN(+val)) {
        window._OIS_RATES_CACHE[ccy]  = +val;
        window._OIS_RATE_SOURCES[ccy] = sources[ccy] || 'OIS';
      }
    }
  } catch {
  }
}

let _newsAllItems = [];
let _newsMeta     = {};
let _newsFilter   = { cur: 'ALL', impact: 'ALL' };

const NEWS_DENSITY_KEY = 'gi_news_density';
let _newsDensity = 'expanded';

function _newsLoadDensity() {
  try { _newsDensity = localStorage.getItem(NEWS_DENSITY_KEY) || 'expanded'; } catch { _newsDensity = 'expanded'; }
  if (_newsDensity !== 'compact' && _newsDensity !== 'expanded') _newsDensity = 'expanded';
  _newsApplyDensity();
}

function _newsApplyDensity() {
  const section = document.getElementById('section-news');
  const scroll  = document.getElementById('intel-scroll');
  if (section) section.classList.toggle('ns-compact', _newsDensity === 'compact');
  if (scroll)  scroll.classList.toggle('ns-compact', _newsDensity === 'compact');
  document.querySelectorAll('.ns-density-btn').forEach(function(btn) {
    btn.classList.toggle('ns-density-active', btn.dataset.density === _newsDensity);
  });
}

function _newsSetDensity(mode) {
  if (mode !== 'compact' && mode !== 'expanded') return;
  _newsDensity = mode;
  try { localStorage.setItem(NEWS_DENSITY_KEY, mode); } catch {}
  _newsApplyDensity();
}
window._newsSetDensity = _newsSetDensity;

const NEWS_FONTSIZE_KEY = 'gi_news_fontsize';
const NEWS_FONTSIZE_STEPS = [9, 10, 12, 14];
let _newsFontSizeIdx = 1;

function _newsLoadFontSize() {
  try {
    const raw = parseInt(localStorage.getItem(NEWS_FONTSIZE_KEY), 10);
    _newsFontSizeIdx = Number.isInteger(raw) && raw >= 0 && raw < NEWS_FONTSIZE_STEPS.length ? raw : 1;
  } catch { _newsFontSizeIdx = 1; }
  _newsApplyFontSize();
}

function _newsApplyFontSize() {
  const section = document.getElementById('section-news');
  const scroll  = document.getElementById('intel-scroll');
  [section, scroll].forEach(function (el) {
    if (!el) return;
    for (let i = 0; i < NEWS_FONTSIZE_STEPS.length; i++) el.classList.remove('ns-fontsize-' + i);
    el.classList.add('ns-fontsize-' + _newsFontSizeIdx);
  });
  const dec = document.getElementById('ns-fontsize-dec');
  const inc = document.getElementById('ns-fontsize-inc');
  if (dec) dec.disabled = _newsFontSizeIdx === 0;
  if (inc) inc.disabled = _newsFontSizeIdx === NEWS_FONTSIZE_STEPS.length - 1;
}

function _newsFontSizeAdjust(delta) {
  const next = _newsFontSizeIdx + delta;
  if (next < 0 || next >= NEWS_FONTSIZE_STEPS.length) return;
  _newsFontSizeIdx = next;
  try { localStorage.setItem(NEWS_FONTSIZE_KEY, String(_newsFontSizeIdx)); } catch {}
  _newsApplyFontSize();
}
window._newsFontSizeAdjust = _newsFontSizeAdjust;

const _ANALYSIS_SOURCES = new Set([
  'Barchart', 'BabyPips', 'ForexCrunch',
  'DailyForex TA', 'InvestingLive', 'ActionForex',
  'MyFXBook', 'Investing.com',
  'MarketPulse', 'FX Empire',        
]);

const _RESEARCH_NEWS_SOURCES = new Set([
  'InvestMacro',     
  'Marc to Market',  
  'FX Markets',      
]);

function _buildNsItem(item, containerEl) {
  let time = item.time || '--:--';
  let ageMs = 0;
  let pubDate = null;
  if (item.ts) {
    pubDate = new Date(item.ts);
    time = pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    ageMs = Date.now() - item.ts;
  } else if (item.datetime) {
    const d = new Date(item.datetime);
    if (!isNaN(d)) {
      pubDate = d;
      time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      ageMs = Date.now() - d.getTime();
    }
  }

  let timeLabel = time;
  if (ageMs > 0) {
    const ageMin  = Math.floor(ageMs / 60000);
    const ageHr   = Math.floor(ageMs / 3600000);
    const ageDays = Math.floor(ageMs / 86400000);
    if (ageDays >= 1 && pubDate) {
      timeLabel = time + ' \u00b7 ' + pubDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (ageHr >= 1) {
      timeLabel = time + ' \u00b7 ' + ageHr + 'h';
    } else if (ageMin >= 1) {
      timeLabel = time + ' \u00b7 ' + ageMin + 'm';
    } else {
      timeLabel = time + ' \u00b7 now';
    }
  }

  const headline = item.title  || '';
  const cur      = item.cur    || '';
  const source   = item.source || '';
  const rawLink  = item.link   || '';
  const safeLink = rawLink.startsWith('https://') ? rawLink : '';

  let body = (item.expand || '').replace(/\s+/g, ' ').trim();
  if (body.length > 500) {
    const cut = body.slice(0, 500);
    const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
    body = (lastPeriod > 200 ? cut.slice(0, lastPeriod + 1) : cut) + '\u2026';
  }

  const wrap = document.createElement('div');
  wrap.className = 'ns-article' + (item.featured ? ' ns-featured' : '');

  const meta = document.createElement('div');
  meta.className = 'ns-art-meta';

  if (source) {
    const srcEl = document.createElement('span');
    srcEl.className = 'ns-art-source';
    srcEl.textContent = source;
    meta.appendChild(srcEl);
  }

  const timeEl = document.createElement('span');
  timeEl.className = 'ns-art-time';
  timeEl.textContent = timeLabel;
  meta.appendChild(timeEl);

  if (cur) {
    const curTag = document.createElement('span');
    curTag.className = 'ns-cur-tag';
    curTag.textContent = cur;
    meta.appendChild(curTag);
  }
  wrap.appendChild(meta);

  const titleEl = document.createElement('div');
  titleEl.className = 'ns-art-title';
  titleEl.title = headline; 
  if (safeLink) {
    const a = document.createElement('a');
    a.href = safeLink;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = headline;
    titleEl.appendChild(a);
  } else {
    titleEl.textContent = headline;
  }
  wrap.appendChild(titleEl);

  if (body) {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'ns-art-body';
    bodyEl.textContent = body;
    wrap.appendChild(bodyEl);
  }

  return wrap;
}

function renderNewsSection(items, meta) {
  if (Array.isArray(items)) _newsAllItems = items;
  if (meta) _newsMeta = meta;

  const newsFeed    = document.getElementById('news-section-feed');
  const tradingFeed = document.getElementById('trading-section-feed');
  if (!newsFeed) return;

  const filtered = _newsAllItems.filter(function(item) {
    return _newsFilter.cur === 'ALL' || item.cur === _newsFilter.cur;
  });

  const newsItems     = filtered.filter(function(i) { return !_ANALYSIS_SOURCES.has(i.source) && !_RESEARCH_NEWS_SOURCES.has(i.source); });
  const analysisItems = filtered.filter(function(i) { return  _ANALYSIS_SOURCES.has(i.source); });
  const researchNews  = filtered.filter(function(i) { return  _RESEARCH_NEWS_SOURCES.has(i.source); });

  if (researchNews.length) {
    window._researchNewsItems = researchNews;
    renderResearchSection();
  }

  const newsCountEl = document.getElementById('news-section-count');
  if (newsCountEl) newsCountEl.textContent = newsItems.length + ' stories';

  const tradingCountEl = document.getElementById('trading-section-count');
  if (tradingCountEl) tradingCountEl.textContent = analysisItems.length + ' items';

  newsFeed.innerHTML = '';
  if (!newsItems.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:14px;color:var(--text3);font-size:11px;';
    empty.textContent = 'No stories match current filter.';
    newsFeed.appendChild(empty);
  } else {
    newsItems.forEach(function(item) {
      newsFeed.appendChild(_buildNsItem(item, newsFeed));
    });
  }

  if (tradingFeed) {
    tradingFeed.innerHTML = '';
    if (!analysisItems.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:14px;color:var(--text3);font-size:11px;';
      empty.textContent = 'No analysis items match current filter.';
      tradingFeed.appendChild(empty);
    } else {
      analysisItems.forEach(function(item) {
        tradingFeed.appendChild(_buildNsItem(item, tradingFeed));
      });
    }
  }

  _intelApplyColumnSplit('news-section-feed');
  _intelApplyColumnSplit('trading-section-feed');
}

function _newsSetFilter(type, value) {
  _newsFilter[type] = value;
  const selector = type === 'cur' ? '.ns-cur-pill' : '.ns-imp-pill';
  document.querySelectorAll(selector).forEach(btn => {
    btn.classList.toggle('ns-pill-active', btn.dataset.val === value);
  });
  renderNewsSection();
  const intelFsOverlay = document.getElementById('intel-fullscreen-overlay');
  const inIntelFullscreen = !!(intelFsOverlay && intelFsOverlay.classList.contains('intel-fs-active'));
  if (_researchAllItems.length && type === 'cur' && !inIntelFullscreen) {
    _researchFilter.cur = value;
    renderResearchSection();
  }
}

let _intelFsOriginalScrollParent = null;
let _intelFsOriginalScrollNext   = null;
let _intelFsOriginalFilterParent = null;
let _intelFsOriginalFilterNext   = null;
let _intelFsActiveTab = 'news'; 

function _intelFsSetTab(tab) {
  if (!['news', 'research', 'analysis'].includes(tab)) return;
  _intelFsActiveTab = tab;
  document.querySelectorAll('#intel-fullscreen-overlay .intel-fs-tab').forEach(function (btn) {
    btn.classList.toggle('intel-fs-tab-active', btn.dataset.tab === tab);
    btn.setAttribute('aria-selected', btn.dataset.tab === tab ? 'true' : 'false');
  });
  document.querySelectorAll('.intel-group').forEach(function (grp) {
    grp.classList.toggle('intel-group-active', grp.id === 'intel-group-' + tab);
  });
}
window._intelFsSetTab = _intelFsSetTab;

function shouldSplitIntelColumns() {
  const overlay = document.getElementById('intel-fullscreen-overlay');
  return !!(overlay && overlay.classList.contains('intel-fs-active') && window.innerWidth >= 1400);
}

function _intelApplyColumnSplit(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.classList.remove('intel-cols-active');
  if (!shouldSplitIntelColumns()) return;
  const items = Array.from(container.children);
  if (items.length < 2) return; 
  const mid  = Math.ceil(items.length / 2);
  const colA = document.createElement('div');
  colA.className = 'intel-col-wrap';
  const colB = document.createElement('div');
  colB.className = 'intel-col-wrap';
  items.slice(0, mid).forEach(function (el) { colA.appendChild(el); }); 
  items.slice(mid).forEach(function (el) { colB.appendChild(el); });
  container.appendChild(colA);
  container.appendChild(colB);
  container.classList.add('intel-cols-active');
}
window._intelApplyColumnSplit = _intelApplyColumnSplit;

function _intelRelayoutColumns() {
  ['news-section-feed', 'research-section-feed', 'trading-section-feed'].forEach(_intelApplyColumnSplit);
}
window._intelRelayoutColumns = _intelRelayoutColumns;

let _intelResizeRaf = null;
function _intelOnResize() {
  if (!document.getElementById('intel-fullscreen-overlay')?.classList.contains('intel-fs-active')) return;
  if (_intelResizeRaf) return;
  _intelResizeRaf = requestAnimationFrame(function () {
    _intelResizeRaf = null;
    _intelRelayoutColumns();
  });
}

function openIntelFullscreen() {
  const overlay    = document.getElementById('intel-fullscreen-overlay');
  const inner      = document.getElementById('intel-fullscreen-inner');
  const scroll     = document.getElementById('intel-scroll');
  const filterBar  = document.getElementById('ns-filter-bar');
  const newsGroup  = document.getElementById('intel-group-news');
  if (!overlay || !inner || !scroll || !newsGroup) return;
  if (overlay.classList.contains('intel-fs-active')) return;

  _intelFsOriginalScrollParent = scroll.parentNode;
  _intelFsOriginalScrollNext   = scroll.nextSibling;
  inner.appendChild(scroll);

  if (filterBar) {
    _intelFsOriginalFilterParent = filterBar.parentNode;
    _intelFsOriginalFilterNext   = filterBar.nextSibling;
    const newsHead = newsGroup.querySelector('.intel-sub-head');
    newsGroup.insertBefore(filterBar, newsHead ? newsHead.nextSibling : newsGroup.firstChild);
  }

  overlay.classList.add('intel-fs-active');
  document.body.style.overflow = 'hidden';
  _intelFsSetTab('news'); 
  _intelRelayoutColumns(); 
  _giOpenFocusTrap(overlay);
}

function closeIntelFullscreen() {
  const overlay = document.getElementById('intel-fullscreen-overlay');
  const scroll  = document.getElementById('intel-scroll');
  const filterBar = document.getElementById('ns-filter-bar');
  if (!overlay || !overlay.classList.contains('intel-fs-active')) return;

  overlay.classList.remove('intel-fs-active');
  _giCloseFocusTrap();
  document.body.style.overflow = '';

  if (_intelFsOriginalScrollParent && scroll) {
    _intelFsOriginalScrollParent.insertBefore(scroll, _intelFsOriginalScrollNext);
  }
  if (_intelFsOriginalFilterParent && filterBar) {
    _intelFsOriginalFilterParent.insertBefore(filterBar, _intelFsOriginalFilterNext);
  }
  _intelFsOriginalScrollParent = null;
  _intelFsOriginalScrollNext   = null;
  _intelFsOriginalFilterParent = null;
  _intelFsOriginalFilterNext   = null;
  _intelRelayoutColumns(); 
}

function _intelFsWireUp() {
  document.getElementById('intel-fs-btn')?.addEventListener('click', openIntelFullscreen);
  document.getElementById('intel-fs-close')?.addEventListener('click', closeIntelFullscreen);
  document.querySelectorAll('#intel-fullscreen-overlay .intel-fs-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { _intelFsSetTab(btn.dataset.tab); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('intel-fullscreen-overlay')?.classList.contains('intel-fs-active')) {
      closeIntelFullscreen();
    }
  });
  window.addEventListener('resize', _intelOnResize);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _intelFsWireUp);
} else {
  _intelFsWireUp();
}

const _EXCLUSIVE_PANEL_IDS = ['section-news', 'section-derivatives'];
window._activeExclusivePanel = null;

const _origSiblingDisplay = new WeakMap();
(function _cacheOriginalSiblingDisplay() {
  const splitLowerRight = document.getElementById('split-lower-right');
  if (!splitLowerRight) return;
  Array.from(splitLowerRight.children).forEach(el => {
    if (!_EXCLUSIVE_PANEL_IDS.includes(el.id)) {
      _origSiblingDisplay.set(el, el.style.display || '');
    }
  });
})();

function _setExclusivePanel(targetId) {
  const splitLowerRight = document.getElementById('split-lower-right');
  if (!splitLowerRight) return;
  Array.from(splitLowerRight.children).forEach(el => {
    if (_EXCLUSIVE_PANEL_IDS.includes(el.id)) {
      if (el.id === targetId) {
        el.style.display = (el.id === 'section-news') ? 'flex' : '';
      } else {
        el.style.display = 'none';
      }
    } else {
      el.style.display = targetId ? 'none' : (_origSiblingDisplay.get(el) || '');
    }
  });
  window._activeExclusivePanel = targetId || null;
}

function _repaintAfterExclusivePanelClosed() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof drawYieldCurve === 'function' && typeof _lastDrawnYields !== 'undefined') {
        drawYieldCurve(_lastDrawnYields, typeof _lastDrawnPrior !== 'undefined' ? _lastDrawnPrior : null);
      }
      const activeRatesTab = document.querySelector('.rates-ctab[aria-selected="true"]');
      if (activeRatesTab) {
        const cty = activeRatesTab.dataset.cty;
        if (cty && cty !== 'us') {
          if (cty === 'spreads' && typeof renderSovereignSpreads === 'function') {
            renderSovereignSpreads();
          } else if (cty === 'momentum' && typeof renderMomentumScreener === 'function') {
            renderMomentumScreener();
          } else if (typeof renderG8YieldPane === 'function') {
            const contentEl = document.getElementById('rates-g8-content-' + cty);
            if (contentEl) delete contentEl.dataset.loaded;
            renderG8YieldPane(cty);
          }
        }
      }
      const _chartWrap = document.getElementById('tv-chart-wrap');
      if (typeof _lwChart !== 'undefined' && _lwChart && _chartWrap) {
        const w = _chartWrap.offsetWidth, h = _chartWrap.offsetHeight;
        if (w > 0 && h > 0) try { _lwChart.resize(w, h); _lwReapplyPaneHeights(); _lwReprojectDrawings(); } catch(_) {}
      }
      if (typeof drawLiquidityChart === 'function') drawLiquidityChart();
    });
  });
}

function showNews() {
  _setExclusivePanel('section-news');
  const splitLower = document.getElementById('split-lower');
  if (splitLower) splitLower.scrollTo({ top: 0, behavior: 'smooth' });
  renderNewsSection();
  if (!_researchAllItems.length) {
    loadBankResearch();
  } else {
    renderResearchSection();
  }
}

function hideNews() {
  _setExclusivePanel(null);
  _repaintAfterExclusivePanelClosed();
}

function showDerivatives() {
  _setExclusivePanel('section-derivatives');
  const splitLower = document.getElementById('split-lower');
  if (splitLower) splitLower.scrollTo({ top: 0, behavior: 'smooth' });
  renderDerivativesSection();
}

function hideDerivatives() {
  _setExclusivePanel(null);
  _repaintAfterExclusivePanelClosed();
}

function initExclusivePanelNav() {
  const newsSection  = document.getElementById('section-news');
  const derivSection = document.getElementById('section-derivatives');
  if (!newsSection || !derivSection) return;
  if (!document.getElementById('split-lower-right')) return;

  document.querySelectorAll('.top-nav a[data-target]').forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.target;
      if (target === 'section-news') {
        showNews();
      } else if (target === 'section-derivatives') {
        showDerivatives();
      } else if (window._activeExclusivePanel) {
        _setExclusivePanel(null);
        _repaintAfterExclusivePanelClosed();
      }
    }, true);
  });

  window._newsNavShow     = showNews;
  window._newsNavHide     = hideNews;
  window._newsNavSection  = newsSection;
  window._derivNavShow    = showDerivatives;
  window._derivNavHide    = hideDerivatives;
  window._derivNavSection = derivSection;

  window._newsSetFilter   = _newsSetFilter;
}

(function bootNewFeatures() {
  const run = async () => {
    initG8RatesTabs();
    initCOTAssetTabs();
    initCorrAssetTabs();
    _corrMtxWireHover();
    _corrMtxFsWireUp();
    _cotBreakdownFsWireUp();
    initSentimentAssetTabs();
    initExclusivePanelNav();

    function _waitForQuotesPromise(timeoutMs) {
      return new Promise(function (resolve) {
        var deadline = Date.now() + (timeoutMs || 8000);
        (function poll() {
          if (window._quotesReadyPromise) {
            Promise.resolve(window._quotesReadyPromise).then(resolve, resolve);
          } else if (Date.now() < deadline) {
            setTimeout(poll, 20);
          } else {
            resolve(); 
          }
        })();
      });
    }
    await Promise.all([
      loadCBRatesCache(),
      loadOISRatesCache(),
      _waitForQuotesPromise(8000),
    ]);

    await Promise.all([
      renderCIPForwards(),
      renderRRInFXTable(),
      renderEconSurprises(),
    ]);

    setInterval(async () => {
      await Promise.all([loadCBRatesCache(), loadOISRatesCache()]);
      await renderCIPForwards();
      await renderRRInFXTable();
    }, 5 * 60 * 1000);

    setInterval(renderEconSurprises, 3 * 60 * 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

(function initWatchlist() {
  'use strict';

  var WL_KEY = 'gi_watchlist';

  var SYMBOL_MAP = {
    'EURUSD': 'EURUSD', 'GBPUSD': 'GBPUSD', 'USDJPY': 'USDJPY',
    'AUDUSD': 'AUDUSD', 'USDCAD': 'USDCAD', 'USDCHF': 'USDCHF',
    'NZDUSD': 'NZDUSD', 'GBPJPY': 'GBPJPY', 'EURJPY': 'EURJPY',
    'EURGBP': 'EURGBP', 'AUDJPY': 'AUDJPY', 'EURAUD': 'EURAUD',
    'EURCHF': 'EURCHF', 'EURCAD': 'EURCAD', 'GBPCHF': 'GBPCHF',
    'GBPCAD': 'GBPCAD', 'GBPAUD': 'GBPAUD', 'CADJPY': 'CADJPY',
    'CHFJPY': 'CHFJPY', 'NZDJPY': 'NZDJPY', 'AUDNZD': 'AUDNZD',
    'EURNZD': 'EURNZD', 'GBPNZD': 'GBPNZD', 'AUDCHF': 'AUDCHF',
    'AUDCAD': 'AUDCAD', 'NZDCHF': 'NZDCHF', 'NZDCAD': 'NZDCAD',
    'CADCHF': 'CADCHF', 'USDNOK': 'USDNOK', 'USDSEK': 'USDSEK',
    'EURNOK': 'EURNOK', 'EURSEK': 'EURSEK',
    'XAUUSD': 'XAUUSD', 'XAGUSD': 'XAGUSD',
  };

  var QUOTE_KEY_ALIAS = { 'XAUUSD': 'gold', 'XAGUSD': 'silver' };

  var TV_SYM_PREFIX = 'FX_IDC:';
  var METAL_TV_SYM = { 'XAUUSD': 'OANDA:XAUUSD', 'XAGUSD': 'OANDA:XAGUSD' };

  var _memList = null; 

  function _lsAvailable() {
    if (typeof _lsAvailable._ok !== 'undefined') return _lsAvailable._ok;
    try {
      var t = '__gi_wl_test__';
      localStorage.setItem(t, '1');
      var ok = localStorage.getItem(t) === '1';
      localStorage.removeItem(t);
      _lsAvailable._ok = ok;
    } catch (e) {
      _lsAvailable._ok = false;
    }
    return _lsAvailable._ok;
  }

  function load() {
    if (_lsAvailable()) {
      try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); } catch (e) {}
    }
    if (_memList === null) _memList = [];
    return _memList.slice();
  }
  function save(list) {
    if (_lsAvailable()) {
      try { localStorage.setItem(WL_KEY, JSON.stringify(list)); return; } catch (e) {}
    }
    _memList = list.slice();
  }

  function render() {
    var tbody = document.getElementById('watchlist-rows');
    if (!tbody) return;
    var list = load();
    if (list.length === 0) {
      tbody.innerHTML = '<div style="padding:4px 8px;font-size:10px;color:var(--text3);">No pairs added</div>';
      return;
    }
    var quotes = (window._intradayQuotes && window._intradayQuotes.quotes) || {};
    var quotesReady = Object.keys(quotes).length > 0;
    tbody.innerHTML = list.map(function (sym) {
      var qKey = (QUOTE_KEY_ALIAS[sym] || sym).toLowerCase();
      var q = quotes[qKey] || {};
      var price = (q.close != null) ? String(q.close) : (quotesReady ? '—' : '···');
      var chg = (q.pct != null) ? q.pct : null;
      var chgStr = (chg != null) ? ((chg >= 0 ? '+' : '') + chg.toFixed(2) + '%') : (quotesReady ? '—' : '···');
      var chgColor = (chg == null) ? 'var(--text3)' : (chg >= 0 ? 'var(--up)' : 'var(--down)');
      var tvSym = METAL_TV_SYM[sym] || (TV_SYM_PREFIX + sym);
      return '<div class="sb-row" data-sym="' + tvSym + '" style="display:flex;align-items:center;gap:0;cursor:pointer;" title="Click to open chart">' +
        '<span class="sb-sym" style="flex:1;">' + sym + '</span>' +
        '<span class="sb-price" style="min-width:52px;text-align:right;font-family:var(--font-mono);font-size:10px;">' + price + '</span>' +
        '<span style="min-width:42px;text-align:right;font-family:var(--font-mono);font-size:10px;color:' + chgColor + ';">' + chgStr + '</span>' +
        '<button data-wl-remove="' + sym + '" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:11px;padding:0 4px;line-height:1;" aria-label="Remove ' + sym + '" title="Remove">&times;</button>' +
        '</div>';
    }).join('');
    if (!quotesReady) {
      setTimeout(render, 800);
    }
  }

  function addSymbol(rawInput) {
    var sym = rawInput.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!sym) return;
    if (!(sym in SYMBOL_MAP)) return; 
    var list = load();
    if (list.indexOf(sym) !== -1) return; 
    if (list.length >= 8) { list.shift(); } 
    list.push(sym);
    save(list);
    render();
  }

  function init() {
    var addBtn = document.getElementById('wl-add-btn');
    var inputRow = document.getElementById('wl-input-row');
    var input = document.getElementById('wl-input');
    var tbody = document.getElementById('watchlist-rows');
    if (!addBtn || !inputRow || !input || !tbody) return;

    render();

    addBtn.addEventListener('click', function () {
      var visible = inputRow.style.display !== 'none';
      inputRow.style.display = visible ? 'none' : 'block';
      if (!visible) {
        input.value = '';
        input.focus();
        setTimeout(function () { inputRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var sym = input.value.trim().toUpperCase().replace(/[^A-Z]/g, '');
        if (sym && !(sym in SYMBOL_MAP)) {
          input.style.outline = '1px solid var(--down)';
          setTimeout(function () { input.style.outline = ''; }, 800);
          return;
        }
        addSymbol(input.value);
        input.value = '';
        inputRow.style.display = 'none';
        setTimeout(function () {
          var rows = tbody.querySelectorAll('.sb-row');
          if (rows.length) rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      } else if (e.key === 'Escape') {
        inputRow.style.display = 'none';
      }
    });

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-wl-remove]');
      if (!btn) return;
      e.stopPropagation();
      var sym = btn.getAttribute('data-wl-remove');
      save(load().filter(function (s) { return s !== sym; }));
      render();
    });

    document.addEventListener('gi:quotesLoaded', render);
    setInterval(render, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

const _TF_RANGE_SETS = {
  H1: [{days:1,label:'1D'},{days:5,label:'1W'},{days:14,label:'2W'},{days:30,label:'1M'}],
  H4: [{days:14,label:'2W'},{days:30,label:'1M'},{days:91,label:'3M'},{days:182,label:'6M'}],
  D1: [{days:91,label:'3M'},{days:182,label:'6M'},{days:365,label:'1Y'},{days:1095,label:'3Y'},{days:0,label:'ALL'}],
  W1: [{days:182,label:'6M'},{days:365,label:'1Y'},{days:730,label:'2Y'},{days:1095,label:'3Y'},{days:0,label:'ALL'}],
  MN: [{days:365,label:'1Y'},{days:1095,label:'3Y'},{days:1825,label:'5Y'},{days:0,label:'ALL'}],
};
const _TF_DEFAULT_DAYS = {H1:5,H4:14,get D1(){ return _lwDefaultD1Days(); },W1:365,MN:1095};

function _lwUpdateRangeBtns() {
  const wrap = document.getElementById('lw-range-btns');
  if (!wrap) return;
  const set = _TF_RANGE_SETS[_lwActiveTf] || _TF_RANGE_SETS.D1;
  wrap.innerHTML = set.map(r =>
    `<button class="lw-range-btn${r.days === _lwActiveDays ? ' active' : ''}" data-days="${r.days}" aria-label="${r.label}" style="flex-shrink:0;">${r.label}</button>`
  ).join('');
}

document.getElementById('lw-range-bar')?.addEventListener('click', e => {
  const tfBtn = e.target.closest('.lw-tf-btn');
  if (!tfBtn) return;
  const newTf = tfBtn.dataset.tf;
  if (!newTf || newTf === _lwActiveTf) return;
  _lwActiveTf   = newTf;
  _lwActiveDays = _TF_DEFAULT_DAYS[newTf] ?? 91;
  document.querySelectorAll('#lw-range-bar .lw-tf-btn').forEach(b => b.classList.toggle('sel', b.dataset.tf === newTf));
  _lwUpdateRangeBtns();
  if (_lwActiveOhlcId) _renderLWChart(_lwActiveOhlcId);
});

(function _lwCmpDropdownToBody() {
  const dd = document.getElementById('lw-cmp-dropdown');
  if (dd && dd.parentElement !== document.body) document.body.appendChild(dd);
})();

document.getElementById('lw-cmp-btn')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const dd = document.getElementById('lw-cmp-dropdown');
  if (!dd) return;
  if (dd.parentElement !== document.body) document.body.appendChild(dd); 
  const open = dd.style.display === 'none' || !dd.style.display;
  if (open) {
    const rect = this.getBoundingClientRect();
    dd.style.position  = 'fixed';
    dd.style.zIndex    = '9100';
    dd.style.display   = 'block';
    const ddW = dd.offsetWidth  || 175;
    const ddH = dd.offsetHeight || 260;
    let left = rect.right - ddW;
    if (left < 8) left = 8;
    if (left + ddW > window.innerWidth - 8) left = window.innerWidth - ddW - 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= 80 ? rect.bottom + 4 : Math.max(8, rect.top - ddH - 4);
    dd.style.left  = left + 'px';
    dd.style.right = 'auto';
    dd.style.top   = top + 'px';
  } else {
    dd.style.display = 'none';
  }
  this.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', () => {
  const dd = document.getElementById('lw-cmp-dropdown');
  if (dd) dd.style.display = 'none';
  document.getElementById('lw-cmp-btn')?.setAttribute('aria-expanded','false');
});

document.getElementById('lw-cmp-dropdown')?.addEventListener('click', e => {
  e.stopPropagation();
  const item = e.target.closest('.lw-cmp-item');
  if (!item || !_lwActiveOhlcId) return;
  const cmpId   = item.dataset.cmpid;
  const cmpType = item.dataset.cmptype || 'ohlc';
  if (!cmpId) return;
  if (cmpType === 'ohlc' && cmpId === _lwActiveOhlcId) return;
  const uid = cmpType + ':' + cmpId;
  if (_lwCompareSeriesMap[uid]) { _lwClearCompareOne(uid); return; }
  _lwLoadCompare(cmpId, item.textContent.trim(), cmpType);
  document.getElementById('lw-cmp-dropdown').style.display = 'none';
});

function _lwClearCompareOne(uid, keepPersisted) {
  const series = _lwCompareSeriesMap[uid];
  if (series && _lwChart) { try { _lwChart.removeSeries(series); } catch(_e) {} }
  delete _lwCompareSeriesMap[uid];
  delete _lwCompareMeta[uid];
  document.querySelectorAll('.lw-cmp-pill').forEach(function (p) {
    if (p.dataset.uid === uid) p.remove();
  });
  const entry = (window._lwCompareList || []).find(function (e) { return e.uid === uid; });
  const uType = entry ? entry.cmpType : uid.slice(0, uid.indexOf(':'));
  const uId   = entry ? entry.cmpId   : uid.slice(uid.indexOf(':') + 1);
  document.querySelectorAll('.lw-cmp-item').forEach(function (i) {
    if ((i.dataset.cmptype || 'ohlc') === uType && i.dataset.cmpid === uId) i.classList.remove('active');
  });
  if (!keepPersisted) {
    window._lwCompareList = (window._lwCompareList || []).filter(function (e) { return e.uid !== uid; });
    _lsSetCompare(window._lwCompareList);
  }
}

async function _lwLoadCompare(cmpId, cmpLabel, cmpType = 'ohlc', fromRestore) {
  if (!_lwChart || !_lwCandleSeries) return;
  const LWC = window.LightweightCharts;
  const uid = cmpType + ':' + cmpId;
  if (_lwCompareSeriesMap[uid]) return; 

  const CMP_PALETTES = {
    cot:  ['#9c27b0', '#ce93d8', '#6a1b9a'],
    rate: [_themeColor('--up'), '#66bb6a', '#00897b'],
    esi:  [_themeColor('--chart-line'), '#4fc3f7', '#1565c0'],
    ohlc: [_themeColor('--orange'), '#ffb74d', '#e65100'],
  };
  const palette = CMP_PALETTES[cmpType] || CMP_PALETTES.ohlc;
  const sameTypeCount = Object.keys(_lwCompareSeriesMap)
    .filter(function (k) { return k.indexOf(cmpType + ':') === 0; }).length;
  const CMP_COLOR = palette[sameTypeCount % palette.length];
  _lwCompareSeriesMap[uid] = 'pending';

  try {
    let seriesData = [];
    let priceFormat;
    let cmpDecisions = null;

    if (cmpType === 'ohlc') {
      let cmpPath;
      if (_lwActiveTf === 'H1')      cmpPath = `./ohlc-data/h1/${cmpId}.json`;
      else if (_lwActiveTf === 'H4') cmpPath = `./ohlc-data/h4/${cmpId}.json`;
      else                           cmpPath = `./ohlc-data/${cmpId}.json`;

      const r = await fetch(cmpPath, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      let cmpBars = await r.json();
      if (!Array.isArray(cmpBars) || cmpBars.length < 4) throw new Error('no data');

      if (_lwActiveTf === 'W1' || _lwActiveTf === 'MN') {
        const agg = {};
        for (const b of cmpBars) {
          let key;
          if (_lwActiveTf === 'W1') {
            const d = new Date(b.time + 'T00:00:00Z');
            const dow = d.getUTCDay() || 7;
            const mon = new Date(d); mon.setUTCDate(d.getUTCDate() - (dow-1));
            key = mon.toISOString().slice(0, 10);
          } else { key = b.time.slice(0,7) + '-01'; }
          if (!agg[key]) agg[key] = {time:key, open:b.open, high:b.high, low:b.low, close:b.close};
          else { const a=agg[key]; a.high=Math.max(a.high,b.high); a.low=Math.min(a.low,b.low); a.close=b.close; }
        }
        cmpBars = Object.values(agg).sort((a,b) => a.time < b.time ? -1 : 1);
      }

      let baseIdx = 0;
      try {
        const range = _lwChart.timeScale().getVisibleLogicalRange();
        if (range && range.from > 0) baseIdx = Math.max(0, Math.floor(range.from));
      } catch(_e) {}
      const basePrice = cmpBars[Math.min(baseIdx, cmpBars.length-1)]?.close;
      if (!basePrice || basePrice <= 0) throw new Error('no base price');

      seriesData  = cmpBars.map(b => ({ time: b.time, value: ((b.close - basePrice) / basePrice) * 100 }));
      priceFormat = { type: 'custom', formatter: v => (v >= 0 ? '+' : '') + v.toFixed(2) + '%' };

    } else if (cmpType === 'cot') {
      const r = await fetch(`./cot-data/${cmpId}.json`, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const history = Array.isArray(d.history) ? d.history : [];
      if (history.length < 2) throw new Error('no COT history');

      const allPoints = [
        ...history,
        { weekEnding: d.weekEnding, levNet: d.netPosition }
      ];

      seriesData = allPoints
        .filter(h => h.weekEnding && h.weekEnding.length === 10)
        .map(h => ({
          time:  h.weekEnding,
          value: h.levNet ?? ((h.levLong || 0) - (h.levShort || 0)),
        }))
        .sort((a, b) => a.time < b.time ? -1 : 1);

      seriesData = seriesData.filter((p, i) => i === 0 || p.time !== seriesData[i-1].time);
      if (seriesData.length < 2) throw new Error('insufficient COT points');

      priceFormat = {
        type: 'custom',
        formatter: v => {
          const abs = Math.abs(v);
          const str = abs >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toFixed(0);
          return (v >= 0 ? '+' : '') + str;
        }
      };

    } else if (cmpType === 'rate') {
      const r = await fetch(`./rates/${cmpId}.json`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const obs = Array.isArray(d.observations) ? d.observations : [];
      if (obs.length < 2) throw new Error('no rate observations');

      seriesData = obs
        .filter(o => o.date && o.value != null)
        .map(o => ({ time: o.date, value: parseFloat(o.value) }))
        .sort((a, b) => a.time < b.time ? -1 : 1);

      priceFormat = {
        type: 'custom',
        formatter: v => v.toFixed(2) + '%'
      };

      cmpDecisions = {};
      for (let i = 1; i < seriesData.length; i++) {
        const delta = seriesData[i].value - seriesData[i - 1].value;
        if (Math.abs(delta) >= 0.01) cmpDecisions[seriesData[i].time] = { delta };
      }

    } else if (cmpType === 'esi') {
      const r = await fetch('./calendar-data/calendar.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const calj = await r.json();
      const allEvents = calj.events || [];
      if (calj.surpriseStats) window._ECON_SURPRISE_STATS = calj.surpriseStats;

      if (typeof _esmBuildSeries === 'function') {
        seriesData = _esmBuildSeries(allEvents, cmpId);
      } else {
        const DECAY_LAMBDA = Math.LN2 / 45;
        const WINDOW_MS    = 90 * 24 * 60 * 60 * 1000;
        const STEP_MS      =  7 * 24 * 60 * 60 * 1000;
        const stats        = window._ECON_SURPRISE_STATS || {};

        function _scoreWin(startMs, endMs) {
          const seen = new Set();
          let total=0, wTotal=0, wBeats=0, wMisses=0;
          let zWSum=0, zWTotal=0, zWBeats=0, zWMisses=0;
          allEvents.forEach(ev => {
            if (ev.currency !== cmpId) return;
            const t = new Date(ev.dateISO).getTime();
            if (isNaN(t) || t > endMs || t < startMs) return;
            if (!ev.actual || ev.actual === '' || ev.actual === '-') return;
            if (!['medium','high'].includes(ev.impact)) return;
            const name = (ev.event || '').toLowerCase();
            if (NOISE_KW.some(k => name.includes(k))) return;
            const canon = _canonEsi(name);
            const aS = String(ev.actual||'').replace(/[%,\s]/g,'');
            const fS = String(ev.forecast||ev.previous||'').replace(/[%,\s]/g,'');
            const key = `${cmpId}/${canon}/${aS}/${fS}`;
            if (seen.has(key)) return;
            seen.add(key);
            const actual   = _parseNum(ev.actual);
            const forecast = _parseNum(ev.forecast || ev.previous);
            if (isNaN(actual) || isNaN(forecast)) return;
            const inv     = INVERSE_KW.some(k => name.includes(k));
            const beat    = inv ? actual < forecast : actual > forecast;
            const miss    = inv ? actual > forecast : actual < forecast;
            const surp    = inv ? -(actual-forecast) : (actual-forecast);
            const ageDays    = (endMs - t) / 86400000;
            const impactMult = ev.impact === 'high' ? 1.0 : 0.5;
            const w          = Math.exp(-DECAY_LAMBDA * ageDays) * impactMult;
            const st      = stats[`${cmpId}/${canon}`];
            const useZ    = st && st.n >= 5 && st.std > 0;
            const z       = useZ ? (surp - st.mean) / st.std : null;
            total++; wTotal += w;
            if (beat) { wBeats  += w; }
            if (miss) { wMisses += w; }
            if (z !== null) {
              zWSum += z*w; zWTotal += w;
              if (beat) zWBeats += w;
              if (miss) zWMisses += w;
            }
          });
          if (!total) return null;
          const zFrac = zWTotal / wTotal;
          let idx100;
          if (zWTotal >= 10 || (zWTotal > 0 && zFrac >= 0.30)) {
            const nZW=wTotal-zWTotal, nZWB=wBeats-zWBeats, nZWM=wMisses-zWMisses;
            const zP  = zWTotal>0 ? (zWSum/zWTotal)*50 : 0;
            const bmP = nZW>0 ? ((nZWB-nZWM)/nZW)*100 : 0;
            idx100 = (zP*zWTotal + bmP*nZW) / wTotal;
          } else {
            idx100 = wTotal>0 ? ((wBeats-wMisses)/wTotal)*100 : 0;
          }
          return idx100;
        }

        const ccyEvts = allEvents.filter(ev =>
          ev.currency === cmpId && ev.actual && ev.actual !== '' && ev.actual !== '-'
        );
        if (!ccyEvts.length) throw new Error('no ESI events for ' + cmpId);

        const minDate = Math.min(...ccyEvts.map(ev => new Date(ev.dateISO).getTime()).filter(t => !isNaN(t)));
        const nowMs = Date.now();
        let cursor = minDate + WINDOW_MS;
        while (cursor <= nowMs + STEP_MS) {
          const endMs   = Math.min(cursor, nowMs);
          const startMs = endMs - WINDOW_MS;
          const idx     = _scoreWin(startMs, endMs);
          if (idx !== null) {
            const dt = new Date(endMs);
            seriesData.push({
              time:  `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`,
              value: parseFloat(idx.toFixed(2)),
            });
          }
          cursor += STEP_MS;
        }
      }

      if (seriesData.length < 2) throw new Error('insufficient ESI data');

      priceFormat = {
        type: 'custom',
        formatter: v => (v >= 0 ? '+' : '') + v.toFixed(1)
      };
    }

    if (!seriesData.length) throw new Error('empty data');

    const cmpScaleId = 'cmp-' + cmpType;
    const cmpSeries = LWC.LineSeries
      ? _lwChart.addSeries(LWC.LineSeries, {
          color: CMP_COLOR, lineWidth: cmpType === 'rate' ? 2 : 1.5,
          priceScaleId: cmpScaleId, priceFormat,
          lastValueVisible: false, priceLineVisible: false,
          crosshairMarkerVisible: cmpType !== 'ohlc' })
      : _lwChart.addLineSeries({
          color: CMP_COLOR, lineWidth: cmpType === 'rate' ? 2 : 1.5,
          priceScaleId: cmpScaleId, priceFormat,
          lastValueVisible: false, priceLineVisible: false,
          crosshairMarkerVisible: cmpType !== 'ohlc' });

      if (cmpType === 'rate') {
        const expanded = [];
        for (let i = 0; i < seriesData.length; i++) {
          const cur  = seriesData[i];
          const next = seriesData[i + 1];
          expanded.push(cur);
          if (next) {
            let d = new Date(cur.time + 'T00:00:00Z');
            d.setUTCMonth(d.getUTCMonth() + 1);
            while (d.toISOString().slice(0,10) < next.time) {
              expanded.push({ time: d.toISOString().slice(0,10), value: cur.value });
              d.setUTCMonth(d.getUTCMonth() + 1);
            }
          }
        }
        const today = new Date().toISOString().slice(0,10);
        const last  = seriesData[seriesData.length - 1];
        let d = new Date(last.time + 'T00:00:00Z');
        d.setUTCMonth(d.getUTCMonth() + 1);
        while (d.toISOString().slice(0,10) <= today) {
          expanded.push({ time: d.toISOString().slice(0,10), value: last.value });
          d.setUTCMonth(d.getUTCMonth() + 1);
        }
        seriesData = expanded;
      }

    try {
      _lwChart.priceScale(cmpScaleId).applyOptions({
        scaleMargins: { top: 0.1, bottom: 0.1 },
        borderVisible: false, textColor: CMP_COLOR,
      });
    } catch(_e) {}

    cmpSeries.setData(seriesData);
    _lwCompareSeriesMap[uid] = cmpSeries;
    _lwCompareMeta[uid] = {
      cmpLabel, color: CMP_COLOR,
      formatter: (priceFormat && priceFormat.type === 'custom') ? priceFormat.formatter : (v => v.toFixed(2)),
      decisions: cmpDecisions,
    };

    document.querySelectorAll('.lw-cmp-item').forEach(i =>
      i.classList.toggle('active',
        (i.dataset.cmptype || 'ohlc') === cmpType && i.dataset.cmpid === cmpId));

    const indPills = document.getElementById('lw-ind-pills');
    if (indPills && !Array.from(document.querySelectorAll('.lw-cmp-pill')).some(function (p) { return p.dataset.uid === uid; })) {
      const pill = document.createElement('span');
      pill.className = 'lw-cmp-pill';
      pill.dataset.uid = uid;
      pill.title = 'Remove compare overlay';
      pill.innerHTML = `<span style="width:8px;height:2px;background:${CMP_COLOR};display:inline-block;border-radius:1px;"></span> ${cmpLabel} ×`;
      pill.addEventListener('click', function () { _lwClearCompareOne(uid); });
      indPills.parentNode.insertBefore(pill, indPills);
    }

    if (!fromRestore) {
      window._lwCompareList = (window._lwCompareList || []).filter(function (e) { return e.uid !== uid; });
      window._lwCompareList.push({ uid: uid, cmpId: cmpId, cmpLabel: cmpLabel, cmpType: cmpType });
      _lsSetCompare(window._lwCompareList);
    }
  } catch(err) {
    delete _lwCompareSeriesMap[uid];
    console.warn('[lw-compare] Failed to load compare data:', err.message);
    if (fromRestore) {
      window._lwCompareList = (window._lwCompareList || []).filter(function (e) { return e.uid !== uid; });
      _lsSetCompare(window._lwCompareList);
      document.querySelectorAll('.lw-cmp-pill').forEach(function (p) {
        if (p.dataset.uid === uid) p.remove();
      });
    }
  }
}

let _lwFsOriginalParent = null;
let _lwFsOriginalNext   = null;
let _lwFsOriginalHeight = null;

function _lwReapplyPaneHeights() {
  if (!_lwChart || !window._indPaneIndex) return;
  try {
    const panes = _lwChart.panes();
    Object.keys(window._indPaneIndex).forEach(id => {
      const idx = window._indPaneIndex[id];
      if (idx == null) return;
      const paneH = (id === 'macd' || id === 'adx') ? 90 : 80;
      panes[idx]?.setHeight(paneH);
    });
  } catch(_) {}
}

function _lwReprojectDrawings() {
  if (typeof window._lwRenderDrawings === 'function') window._lwRenderDrawings();
}

function _lwOpenFullscreen() {
  const overlay   = document.getElementById('lw-fullscreen-overlay');
  const inner     = document.getElementById('lw-fullscreen-inner');
  const rangeBar  = document.getElementById('lw-range-bar');
  const sznPanel  = document.getElementById('szn-panel');
  const chartHdr  = document.getElementById('lw-chart-header');
  const chartWrap = document.getElementById('tv-chart-wrap');
  if (!overlay || !inner || !chartWrap || _chartMode !== 'lw') return;
  if (overlay.classList.contains('lw-fs-active')) return;

  _lwFsOriginalParent = rangeBar ? rangeBar.parentNode : chartWrap.parentNode;
  _lwFsOriginalNext   = chartWrap.nextSibling;     
  _lwFsOriginalHeight = chartWrap.style.height;

  if (rangeBar)  inner.appendChild(rangeBar);
  if (sznPanel)  inner.appendChild(sznPanel);
  if (chartHdr)  inner.appendChild(chartHdr);
  inner.appendChild(chartWrap);

  chartWrap.style.height    = '100%';
  chartWrap.style.minHeight = '0';
  chartWrap.style.flex      = '1';

  _lwFsPopulateTabs();

  overlay.classList.add('lw-fs-active');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (_lwChart && chartWrap) {
      const w = chartWrap.offsetWidth  || inner.offsetWidth;
      const h = chartWrap.offsetHeight || inner.offsetHeight;
      if (w > 0 && h > 0) { _lwChart.resize(w, h, true); _lwReapplyPaneHeights(); _lwReprojectDrawings(); }
    }
    if (typeof window._sznResizeChart === 'function') window._sznResizeChart();
  }));
  _giOpenFocusTrap(overlay);
}

function _lwCloseFullscreen() {
  const overlay   = document.getElementById('lw-fullscreen-overlay');
  const inner     = document.getElementById('lw-fullscreen-inner');
  const rangeBar  = document.getElementById('lw-range-bar');
  const sznPanel  = document.getElementById('szn-panel');
  const chartHdr  = document.getElementById('lw-chart-header');
  const chartWrap = document.getElementById('tv-chart-wrap');
  if (!overlay || !overlay.classList.contains('lw-fs-active')) return;

  overlay.classList.remove('lw-fs-active');
  _giCloseFocusTrap();
  document.body.style.overflow = '';

  if (_lwFsOriginalParent) {
    if (chartWrap) _lwFsOriginalParent.insertBefore(chartWrap, _lwFsOriginalNext);
    if (chartHdr)  _lwFsOriginalParent.insertBefore(chartHdr,  chartWrap || _lwFsOriginalNext);
    if (sznPanel)  _lwFsOriginalParent.insertBefore(sznPanel,  chartHdr || chartWrap || _lwFsOriginalNext);
    if (rangeBar)  _lwFsOriginalParent.insertBefore(rangeBar,  sznPanel || chartHdr || chartWrap || _lwFsOriginalNext);
  }

  if (chartWrap) {
    chartWrap.style.height    = _lwFsOriginalHeight || '';
    chartWrap.style.minHeight = '';
    chartWrap.style.flex      = '';
  }

  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (_lwChart && chartWrap) {
      const w = chartWrap.offsetWidth, h = chartWrap.offsetHeight;
      if (w > 0 && h > 0) { _lwChart.resize(w, h, true); _lwReapplyPaneHeights(); _lwReprojectDrawings(); }
    }
    if (typeof window._sznResizeChart === 'function') window._sznResizeChart();
  }));

  _lwFsOriginalParent = null;
  _lwFsOriginalNext   = null;
}

function _lwFsPopulateTabs() {
  const fsOuter = document.getElementById('lw-fs-tab-outer');
  const fsTabs  = document.getElementById('lw-fs-tabs');
  if (!fsTabs) return;
  const realTabs = document.querySelectorAll('#tv-pair-tabs .tv-tab');
  if (!realTabs.length) return;
  fsTabs.innerHTML = '';
  realTabs.forEach(realTab => {
    const btn = document.createElement('button');
    btn.className = realTab.className;  
    btn.textContent = realTab.textContent;
    btn.dataset.sym = realTab.dataset.sym;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', realTab.getAttribute('aria-selected'));
    btn.addEventListener('click', () => {
      realTab.click();
      fsTabs.querySelectorAll('.tv-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.sym === realTab.dataset.sym);
        b.setAttribute('aria-selected', b.dataset.sym === realTab.dataset.sym ? 'true' : 'false');
      });
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
    fsTabs.appendChild(btn);
  });

  if (fsOuter) {
    const prevBtn = fsOuter.querySelector('#lw-fs-tabs-prev');
    const nextBtn = fsOuter.querySelector('#lw-fs-tabs-next');
    const updateArrows = () => {
      if (!prevBtn || !nextBtn) return;
      prevBtn.style.display = fsTabs.scrollLeft > 1 ? 'flex' : 'none';
      nextBtn.style.display = fsTabs.scrollLeft < fsTabs.scrollWidth - fsTabs.clientWidth - 1 ? 'flex' : 'none';
    };
    if (prevBtn) prevBtn.onclick = () => { fsTabs.scrollBy({ left: -160, behavior: 'smooth' }); setTimeout(updateArrows, 320); };
    if (nextBtn) nextBtn.onclick = () => { fsTabs.scrollBy({ left:  160, behavior: 'smooth' }); setTimeout(updateArrows, 320); };
    fsTabs.addEventListener('scroll', updateArrows, { passive: true });
    setTimeout(updateArrows, 50);
  }
}

document.getElementById('tv-pair-tabs')?.addEventListener('click', e => {
  const clicked = e.target.closest('.tv-tab');
  if (!clicked) return;
  const fsTabs = document.getElementById('lw-fs-tabs');
  if (!fsTabs) return;
  fsTabs.querySelectorAll('.tv-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.sym === clicked.dataset.sym);
    b.setAttribute('aria-selected', b.dataset.sym === clicked.dataset.sym ? 'true' : 'false');
  });
});

document.getElementById('lw-fs-btn')?.addEventListener('click', _lwOpenFullscreen);
document.getElementById('lw-fs-close')?.addEventListener('click', _lwCloseFullscreen);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('lw-fullscreen-overlay')?.classList.contains('lw-fs-active'))
    _lwCloseFullscreen();
});

let _researchAllItems  = [];
let _researchMeta      = {};
let _researchFilter    = { bank: 'ALL', cur: 'ALL' };
let _researchNewsItems = [];  

function _resBankClass(bank) {
  const map = { ING: 'ING', Saxo: 'Saxo', MUFG: 'MUFG', DailyFX: 'DailyFX', BIS: 'BIS', CME: 'CME', UBS: 'UBS' };
  return 'rs-bank-' + (map[bank] || 'other');
}

function renderResearchSection(items, meta) {
  if (Array.isArray(items)) _researchAllItems = items;
  if (meta) _researchMeta = meta;

  const feed = document.getElementById('research-section-feed');
  if (!feed) return;

  const newsAsResearch = (_researchNewsItems || []).map(function(ni) {
    return {
      bank:      ni.source || '',
      bank_full: ni.source || '',
      title:     ni.title  || '',
      series:    '',
      author:    '',
      url:       ni.link   || ni.url || '',
      currencies: ni.cur ? [ni.cur] : [],
      pairs:     [],
      category:  'macro',
      ts:        ni.ts || (ni.datetime ? new Date(ni.datetime).getTime() : 0),
    };
  });

  const merged = _researchAllItems.concat(newsAsResearch).sort(function(a, b) {
    return (b.ts || 0) - (a.ts || 0);
  });
  const filtered = merged.filter(function(item) {
    const bankOk = _researchFilter.bank === 'ALL' || item.bank === _researchFilter.bank;
    const curOk  = _researchFilter.cur  === 'ALL' ||
                   (Array.isArray(item.currencies) && item.currencies.includes(_researchFilter.cur));
    return bankOk && curOk;
  });

  const tsEl = document.getElementById('research-section-ts');
  if (tsEl && _researchMeta.updated_label) tsEl.textContent = _researchMeta.updated_label;

  const countEl = document.getElementById('research-section-count');
  if (countEl) countEl.textContent = filtered.length + ' notes';

  feed.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'rs-empty';
    empty.textContent = 'No research notes match current filter.';
    feed.appendChild(empty);
    _intelApplyColumnSplit('research-section-feed');
    return;
  }

  filtered.forEach(function(item) {
    let timeLabel = '--:--';
    if (item.ts) {
      const pubDate = new Date(item.ts);
      const hm      = pubDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const ageMs   = Date.now() - item.ts;
      const ageMin  = Math.floor(ageMs / 60000);
      const ageHr   = Math.floor(ageMs / 3600000);
      const ageDays = Math.floor(ageMs / 86400000);
      if (ageDays >= 1) {
        timeLabel = hm + ' \u00b7 ' + pubDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else if (ageHr >= 1) {
        timeLabel = hm + ' \u00b7 ' + ageHr + 'h';
      } else if (ageMin >= 1) {
        timeLabel = hm + ' \u00b7 ' + ageMin + 'm';
      } else {
        timeLabel = hm + ' \u00b7 now';
      }
    }

    const bank       = item.bank       || '';
    const bankFull   = item.bank_full  || bank;
    const title      = item.title      || '';
    const series     = item.series     || '';
    const url        = item.url        || '';
    const excerpt    = item.excerpt    || '';
    const currencies = item.currencies || [];
    const pairs      = item.pairs      || [];
    const category   = item.category   || 'macro';
    const safeUrl    = url.startsWith('https://') ? url : '';
    const isTradeIdea = category === 'trade_idea';

    let displayTitle = title;
    if (series && title.toLowerCase().startsWith(series.toLowerCase())) {
      displayTitle = title.slice(series.length).replace(/^[\s:–—]+/, '');
    }
    displayTitle = displayTitle || title;

    const wrap = document.createElement('div');
    wrap.className = 'rs-article' + (isTradeIdea ? ' rs-art-trade-idea' : '');

    const meta = document.createElement('div');
    meta.className = 'rs-art-meta';

    if (bank) {
      const srcEl = document.createElement('span');
      srcEl.className = 'rs-art-source';
      srcEl.textContent = bank;
      srcEl.title = bankFull;
      meta.appendChild(srcEl);
    }

    const timeEl = document.createElement('span');
    timeEl.className = 'rs-art-time';
    timeEl.textContent = timeLabel;
    meta.appendChild(timeEl);

    currencies.slice(0, 2).forEach(function(cur) {
      const tag = document.createElement('span');
      tag.className = 'rs-cur-tag';
      tag.textContent = cur;
      meta.appendChild(tag);
    });
    wrap.appendChild(meta);

    const titleEl = document.createElement('div');
    titleEl.className = 'rs-art-title';
    titleEl.title = displayTitle; 
    if (safeUrl) {
      const a = document.createElement('a');
      a.href = safeUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = displayTitle;
      titleEl.appendChild(a);
    } else {
      titleEl.textContent = displayTitle;
    }
    wrap.appendChild(titleEl);

    let body = excerpt;
    if (!body && (series || pairs.length)) {
      const parts = [];
      if (series) parts.push(series);
      if (pairs.length) parts.push(pairs.slice(0, 3).join(' \u00b7 '));
      body = parts.join('  \u00b7  ');
    }
    if (body) {
      const bodyEl = document.createElement('div');
      bodyEl.className = 'rs-art-body';
      bodyEl.textContent = body;
      wrap.appendChild(bodyEl);
    }

    feed.appendChild(wrap);
  });

  _intelApplyColumnSplit('research-section-feed');
}

function _researchSetFilter(type, value) {
  _researchFilter[type] = value;
  const selector = type === 'bank' ? '.rs-bank-pill' : '.rs-cur-pill';
  document.querySelectorAll(selector).forEach(function(btn) {
    btn.classList.toggle('rs-pill-active', btn.dataset.val === value);
  });
  renderResearchSection();
}
window._researchSetFilter = _researchSetFilter;

async function loadBankResearch() {
  try {
    const resp = await fetch('research-data/bank-research.json?v=' + Date.now());
    if (!resp.ok) {
      console.warn('[Research] bank-research.json not found — pipeline may not have run yet');
      const feed = document.getElementById('research-section-feed');
      if (feed) {
        feed.innerHTML = '<div class="rs-empty">Research data not yet available. Pipeline runs every 4 hours.</div>';
      }
      return;
    }
    const data = await resp.json();
    renderResearchSection(data.items || [], {
      updated_label: data.updated_label || '',
      total:         data.total || 0,
    });
  } catch (e) {
    console.error('[Research] Load failed:', e);
  }
}

window.addEventListener('gi-theme-change', function() {
  if (typeof _lwChart !== 'undefined' && _lwChart) {
    try {
      _lwChart.applyOptions({
        layout: {
          background: { color: _themeColor('--bg') },
          textColor:  _themeColor('--text'),
        },
        grid: {
          vertLines: { color: _themeColorAlpha('--border', 0.5) },
          horzLines: { color: _themeColorAlpha('--border', 0.5) },
        },
        rightPriceScale: { borderColor: _themeColor('--border') },
        timeScale:       { borderColor: _themeColor('--border') },
      });
    } catch(_) {}

    if (window._candleSeries) {
      try {
        const t = window._candleSeriesType;
        if (t === 'line') {
          window._candleSeries.applyOptions({ color: _themeColor('--chart-line') });
        } else if (t === 'area') {
          window._candleSeries.applyOptions({
            lineColor: _themeColor('--chart-line'),
            topColor:  _themeColorAlpha('--chart-line', 0.28),
            bottomColor: _themeColorAlpha('--chart-line', 0.02),
          });
        } else {
          window._candleSeries.applyOptions({
            upColor:         _themeColor('--candle-up'),
            downColor:       _themeColor('--candle-down'),
            borderUpColor:   _themeColor('--candle-up'),
            borderDownColor: _themeColor('--candle-down'),
            wickUpColor:     _themeColor('--candle-up'),
            wickDownColor:   _themeColor('--candle-down'),
          });
        }
      } catch(_) {}
    }
  }

  if (typeof drawYieldCurve === 'function' &&
      typeof _lastDrawnYields !== 'undefined' && _lastDrawnYields) {
    drawYieldCurve(_lastDrawnYields, _lastDrawnPrior);
  }

  if (typeof drawLiquidityChart === 'function') {
    try { drawLiquidityChart(); } catch(_) {}
  }
});

(function () {
  const SZN_PAIRS = new Set([
    'eurusd','gbpusd','usdjpy','audusd','usdchf','usdcad','nzdusd',
    'usdnok','usdsek','eurnok','eursek','eurgbp','eurjpy','eurchf',
    'eurcad','euraud','gbpjpy','gbpchf','gbpcad','audjpy','audnzd',
    'audchf','cadjpy','chfjpy','nzdjpy','eurnzd','gbpaud','gbpnzd',
    'audcad','cadchf','nzdcad','nzdchf',
    'gold','silver','wti','brent','btc','eth','dxy','vix','move',
    'us10y','us5y','spx','nasdaq','nikkei','stoxx','dax','ftse',
    'hsi','dji',
  ]);

  let _sznChart = null, _sznSeries = null, _sznOpen = false, _sznLoadedPair = null, _sznCrosshairHandler = null;
  let _sznRightScaleWidth = 0;

  function _sznPairLabel(pair) {
    return pair.length === 6 ? (pair.slice(0, 3) + '/' + pair.slice(3)).toUpperCase() : pair.toUpperCase();
  }

  function _sznDestroyChart() {
    if (_sznChart) { try { _sznChart.remove(); } catch (_) {} }
    _sznChart = null; _sznSeries = null; _sznCrosshairHandler = null;
  }

  async function _sznRenderChart(curve) {
    const el = document.getElementById('szn-chart');
    if (typeof window._ensureLWLib === 'function') {
      try { await window._ensureLWLib(); } catch (_) {}
    }
    const LWC = window.LightweightCharts;
    if (!el || typeof LWC === 'undefined') return;
    _sznDestroyChart();
    el.innerHTML = '';

    _sznChart = LWC.createChart(el, {
      layout: { background: { color: _themeColor('--bg') }, textColor: _themeColor('--text'), attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: _themeColorAlpha('--border', 0.5) } },
      rightPriceScale: { borderColor: _themeColor('--border'), minimumWidth: 50 },
      timeScale: { visible: false, borderVisible: false },
      handleScroll: false, handleScale: false,
      crosshair: {
        mode: LWC.CrosshairMode.Normal,
        vertLine: { color: _themeColorAlpha('--text2', 0.5), labelVisible: false },
        horzLine: { color: _themeColorAlpha('--text2', 0.5), labelBackgroundColor: _themeColor('--bg3') },
      },
      localization: { priceFormatter: v => v.toFixed(2) + '%' },
      width: el.clientWidth || 580,
      height: 120,
    });

    const seriesOpts = {
      lineColor: _themeColor('--chart-line'), lineWidth: 1.6,
      topColor: _themeColorAlpha('--chart-line', 0.10), bottomColor: _themeColorAlpha('--chart-line', 0.01),
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: true,
    };
    _sznSeries = (typeof LWC.AreaSeries !== 'undefined')
      ? _sznChart.addSeries(LWC.AreaSeries, seriesOpts)
      : _sznChart.addAreaSeries(seriesOpts);

    const REF_YEAR = 2024; 
    const pts = curve.map(pt => {
      const d = (pt.month === 0)
        ? new Date(Date.UTC(REF_YEAR - 1, 11, 31)) 
        : new Date(Date.UTC(REF_YEAR, pt.month - 1, pt.day));
      return {
        time: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
        value: pt.cum_pct,
      };
    });
    _sznSeries.setData(pts);
    _sznChart.timeScale().fitContent();

    try {
      const w = _sznChart.priceScale('right').width();
      if (w > 0) _sznRightScaleWidth = w;
    } catch (_) {  }

    const pointByTime = {};
    pts.forEach((p, i) => { pointByTime[p.time] = curve[i]; });
    let tip = document.getElementById('szn-chart-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'szn-chart-tooltip';
      tip.style.cssText = 'position:absolute;display:none;pointer-events:none;z-index:5;background:var(--bg3);border:1px solid var(--border2);border-radius:3px;padding:3px 7px;font-size:10px;font-family:var(--font-mono,monospace);color:var(--text);white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.35);';
      el.style.position = el.style.position || 'relative';
      el.appendChild(tip);
    }
    const MONTH_FULL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    _sznCrosshairHandler = param => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        tip.style.display = 'none';
        return;
      }
      const pt = pointByTime[param.time];
      if (!pt) { tip.style.display = 'none'; return; }
      const dateLabel = (pt.month === 0) ? 'Baseline' : `${MONTH_FULL[pt.month - 1]} ${pt.day}`;
      const valTxt = (pt.cum_pct >= 0 ? '+' : '') + pt.cum_pct.toFixed(2) + '%';
      tip.innerHTML = `${dateLabel} &middot; <span style="color:${pt.cum_pct >= 0 ? 'var(--up)' : 'var(--down)'};">${valTxt}</span>`;
      tip.style.display = 'block';
      const maxLeft = el.clientWidth - tip.offsetWidth - 4;
      const left = Math.max(4, Math.min(param.point.x + 10, maxLeft));
      const top = Math.max(2, param.point.y - 28);
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    };
    _sznChart.subscribeCrosshairMove(_sznCrosshairHandler);
  }

  const _SZN_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let _sznMonthlyCols = []; 
  function _sznRenderMonthLabels(curve) {
    const row = document.getElementById('szn-months');
    if (!row) return;
    const monthStarts = [];
    curve.forEach((p, i) => { if (p.month >= 1 && p.day === 1) monthStarts.push({ month: p.month, idx: i }); });

    const cols = monthStarts.map((m, i) => {
      const nextIdx = (i + 1 < monthStarts.length) ? monthStarts[i + 1].idx : curve.length;
      const span = nextIdx - m.idx; 
      const startPct = curve[m.idx].cum_pct;
      const endPct = (nextIdx < curve.length) ? curve[nextIdx].cum_pct : curve[curve.length - 1].cum_pct;
      const monthPct = endPct - startPct;
      return { month: m.month, span, monthPct };
    });

    _sznMonthlyCols = cols; 

    row.style.display = 'grid';
    row.style.gridTemplateColumns = cols.map(c => `${c.span}fr`).join(' ');
    row.style.gridTemplateRows = '1fr'; 
    row.style.gridAutoFlow = 'row'; 
    row.style.gap = '1px';
    row.style.flexWrap = ''; 

    row.style.width = _sznRightScaleWidth > 0 ? `calc(100% - ${_sznRightScaleWidth}px)` : '100%';

    row.innerHTML = cols.map(c =>
      `<span style="text-align:center;line-height:22px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_SZN_MONTH_LABELS[c.month - 1]}</span>`
    ).join('');

    _sznRenderMonthlyTable(cols);
  }

  function _sznRenderMonthlyTable(cols) {
    const head = document.getElementById('szn-monthly-h-head');
    const row = document.getElementById('szn-monthly-h-row');
    if (!head || !row) return;
    const cellStyle = 'padding:5px 4px;text-align:center;border-left:1px solid var(--border2);';
    head.innerHTML = '<th style="padding:5px 4px;text-align:left;font-weight:400;background:transparent;">Month</th>'
      + cols.map(c => `<th style="${cellStyle}font-weight:400;background:transparent;">${_SZN_MONTH_LABELS[c.month - 1]}</th>`).join('')
      + `<th style="${cellStyle}font-weight:400;border-left:2px solid var(--border);background:transparent;">Yearly</th>`;

    const yearly = cols.reduce((sum, c) => sum + c.monthPct, 0);
    const fmtCell = (v, wideDivider) => {
      const flat = Math.abs(v) < 0.05;
      const color = flat ? 'var(--text3)' : (v > 0 ? 'var(--up)' : 'var(--down)');
      const bg = flat ? 'transparent' : (v > 0 ? 'rgba(38,166,154,0.14)' : 'rgba(239,83,80,0.14)');
      const txt = (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
      const border = wideDivider ? 'border-left:2px solid var(--border);' : 'border-left:1px solid var(--border2);';
      return `<td style="padding:5px 4px;text-align:center;${border}background:${bg};color:${color};">${txt}</td>`;
    };
    row.innerHTML = '<td style="padding:5px 4px;color:var(--text);text-align:left;background:transparent;">Average</td>'
      + cols.map(c => fmtCell(c.monthPct)).join('')
      + fmtCell(yearly, true);
  }

  function _sznRenderWindows(windows) {
    const tbody = document.getElementById('szn-windows-tbody');
    if (!tbody) return;
    if (!windows || !windows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text3);padding:4px 0;">No window reached statistical significance (one-sample t-test, p&lt;0.05) for this pair over the available history.</td></tr>';
      return;
    }
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    tbody.innerHTML = windows.map(w => `
      <tr style="color:var(--text);border-top:1px solid var(--border2);">
        <td style="padding:3px 0;">${M[w.start_month - 1]} \u2192 ${M[w.end_month - 1]}</td>
        <td style="text-align:right;color:${w.dir === 'Short' ? 'var(--down)' : 'var(--up)'};">${w.dir}</td>
        <td style="text-align:right;color:${w.avg_return < 0 ? 'var(--down)' : 'var(--up)'};">${w.avg_return > 0 ? '+' : ''}${w.avg_return}% \u00b1 ${w.std_dev != null ? w.std_dev : '\u2014'}%</td>
        <td style="text-align:right;color:var(--text3);">${w.win_rate}%</td>
        <td style="text-align:right;color:var(--text3);">${w.p_value != null ? w.p_value : '\u2014'}</td>
        <td style="text-align:right;">${w.q_value != null ? w.q_value : '\u2014'}</td>
      </tr>`).join('');
  }

  function _sznRenderInsight(data, pair) {
    const insight = document.getElementById('szn-insight');
    if (!insight) return;
    const top = data.windows && data.windows[0];
    const label = _sznPairLabel(pair);
    if (!top) {
      insight.textContent = `${label}: no window reached statistical significance (p<0.05) over ${data.years}y \u2014 no recurring seasonal pattern found.`;
      return;
    }
    const M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dirWord = top.dir === 'Short' ? 'weakness' : 'strength';
    let sampleNote;
    if (data.years < 15) {
      sampleNote = `${data.years}y history, below the 15-25y recommended sample`;
    } else if (data.years <= 25) {
      sampleNote = `${data.years}y history, within the 15-25y recommended sample`;
    } else {
      sampleNote = `${data.years}y history, above the 15-25y recommended sample`;
    }
    insight.textContent = `${label}: ${dirWord} ${M[top.start_month - 1]}\u2192${M[top.end_month - 1]} over ${top.n_years}y (avg ${top.avg_return > 0 ? '+' : ''}${top.avg_return}% \u00b1 ${top.std_dev}%, win rate ${top.win_rate}%, p=${top.p_value} [q=${top.q_value} FDR-adj., context only]). Historical tendency, not a signal \u2014 ${sampleNote}.`;
  }

  async function _sznLoad(pair) {
    const insight = document.getElementById('szn-insight');
    const title = document.getElementById('szn-title');
    const tbody = document.getElementById('szn-windows-tbody');
    const monthsRow = document.getElementById('szn-months');
    const monthlyHead = document.getElementById('szn-monthly-h-head');
    const monthlyRow = document.getElementById('szn-monthly-h-row');
    const chartSection = document.getElementById('szn-chart-section');
    const windowsSection = document.getElementById('szn-windows-section');

    if (!pair || !SZN_PAIRS.has(pair)) {
      if (title) title.textContent = 'Daily \u00b7 10y lookback';
      if (insight) insight.textContent = 'Seasonality isn\u2019t available for this symbol \u2014 select an FX pair, metal, index, or other supported instrument on the Price Chart above.';
      if (tbody) tbody.innerHTML = '';
      if (monthsRow) monthsRow.innerHTML = '';
      if (monthlyHead) monthlyHead.innerHTML = '';
      if (monthlyRow) monthlyRow.innerHTML = '';
      if (chartSection) chartSection.style.display = 'none';
      if (windowsSection) windowsSection.style.display = 'none';
      if (typeof window._sznSwitchTab === 'function') window._sznSwitchTab('chart');
      _sznDestroyChart();
      _sznLoadedPair = null;
      return;
    }
    if (pair === _sznLoadedPair) return; 

    if (title) title.textContent = `${_sznPairLabel(pair)} \u00b7 Daily \u00b7 10y lookback`;
    if (insight) insight.textContent = 'Loading seasonality data\u2026';
    if (chartSection) chartSection.style.display = '';
    if (windowsSection) windowsSection.style.display = '';

    try {
      const res = await fetch(`./seasonality-data/${pair}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await _sznRenderChart(data.curve);
      _sznRenderMonthLabels(data.curve);
      _sznRenderWindows(data.windows);
      _sznRenderInsight(data, pair);
      if (title) title.textContent = `${_sznPairLabel(pair)} \u00b7 Daily \u00b7 ${data.years}y lookback`;
      _sznLoadedPair = pair;
    } catch (e) {
      if (insight) insight.textContent = `No seasonality data yet for ${_sznPairLabel(pair)} \u2014 needs at least 5 years of stored daily history.`;
      if (tbody) tbody.innerHTML = '';
      if (monthsRow) monthsRow.innerHTML = '';
      if (monthlyHead) monthlyHead.innerHTML = '';
      if (monthlyRow) monthlyRow.innerHTML = '';
      if (chartSection) chartSection.style.display = 'none';
      if (windowsSection) windowsSection.style.display = 'none';
      if (typeof window._sznSwitchTab === 'function') window._sznSwitchTab('chart');
      _sznDestroyChart();
      _sznLoadedPair = null;
    }
  }

  function _sznToggle(open) {
    const panel = document.getElementById('szn-panel');
    const btn = document.getElementById('szn-btn');
    if (!panel) return;
    _sznOpen = open != null ? open : panel.style.display === 'none';
    panel.style.display = _sznOpen ? 'block' : 'none';
    if (btn) btn.setAttribute('aria-expanded', String(_sznOpen));
    if (btn) btn.classList.toggle('on', _sznOpen);
    if (_sznOpen) _sznLoad(window._sznActiveOhlcId);
    if (typeof window._lwResizeAfterLayoutChange === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(window._lwResizeAfterLayoutChange));
    }
  }

  window._sznOnSymbolChange = function (ohlcId) {
    window._sznActiveOhlcId = ohlcId;
    if (_sznOpen) _sznLoad(ohlcId);
  };

  window._sznResizeChart = function () {
    if (!_sznChart) return;
    const el = document.getElementById('szn-chart');
    if (!el) return;
    const w = el.clientWidth || 580;
    _sznChart.resize(w, 120, true);
    _sznChart.timeScale().fitContent();
  };

  window._sznSwitchTab = function (tab) {
    ['chart', 'monthly'].forEach(t => {
      const btn = document.querySelector(`.szn-tab[data-szn-tab="${t}"]`);
      const panel = document.getElementById(`szn-tab-${t}`);
      const active = t === tab;
      if (btn) {
        btn.style.color = active ? 'var(--text)' : 'var(--text3)';
        btn.style.borderBottomColor = active ? 'var(--accent)' : 'transparent';
      }
      if (panel) panel.style.display = active ? '' : 'none';
    });
    if (tab === 'chart' && typeof window._sznResizeChart === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(window._sznResizeChart));
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('szn-btn');
    const closeBtn = document.getElementById('szn-close');
    if (btn) btn.addEventListener('click', () => _sznToggle());
    if (closeBtn) closeBtn.addEventListener('click', () => _sznToggle(false));
    window.addEventListener('resize', () => window._sznResizeChart());
  });
})();

(function () {
  const row = document.getElementById('lw-tb-row2');
  const btnPrev = document.getElementById('lw-tb-row2-prev');
  const btnNext = document.getElementById('lw-tb-row2-next');
  if (!row || !btnPrev || !btnNext) return;

  row.addEventListener('wheel', function (e) {
    if (e.deltaY === 0) return;
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  }, { passive: false });

  function updateArrows() {
    const atStart = row.scrollLeft <= 2;
    const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;
    btnPrev.style.display = atStart ? 'none' : 'flex';
    btnNext.style.display = atEnd ? 'none' : 'flex';
  }
  row.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);

  const mo = new MutationObserver(() => updateArrows());
  mo.observe(row, { childList: true, subtree: true, characterData: true });
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(row);
  }
  [0, 200, 800, 2000].forEach(ms => setTimeout(updateArrows, ms));

  btnPrev.addEventListener('click', () => row.scrollBy({ left: -160, behavior: 'smooth' }));
  btnNext.addEventListener('click', () => row.scrollBy({ left: 160, behavior: 'smooth' }));
})();

(function () {
  const row = document.getElementById('lw-tb-row1');
  const btnPrev = document.getElementById('lw-tb-row1-prev');
  const btnNext = document.getElementById('lw-tb-row1-next');
  if (!row || !btnPrev || !btnNext) return;

  row.addEventListener('wheel', function (e) {
    if (e.deltaY === 0) return;
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  }, { passive: false });

  function updateArrows() {
    const atStart = row.scrollLeft <= 2;
    const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;
    btnPrev.style.display = atStart ? 'none' : 'flex';
    btnNext.style.display = atEnd ? 'none' : 'flex';
  }
  row.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);

  const mo = new MutationObserver(() => updateArrows());
  mo.observe(row, { childList: true, subtree: true, characterData: true });
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(row);
  }
  [0, 200, 800, 2000].forEach(ms => setTimeout(updateArrows, ms));

  btnPrev.addEventListener('click', () => row.scrollBy({ left: -160, behavior: 'smooth' }));
  btnNext.addEventListener('click', () => row.scrollBy({ left: 160, behavior: 'smooth' }));
})();

const _GROWTHDIFF_LABELS = {
  'GLOBAL-RISK-OFF': 'Global Risk-Off',
  'CALM-MUDDLING-THROUGH': 'Calm / Muddling Through',
  'USD-GROWTH-OUTPERFORMING': 'USD Growth Outperforming',
};
const _GROWTHDIFF_SMILE_ORDER = ['GLOBAL-RISK-OFF', 'CALM-MUDDLING-THROUGH', 'USD-GROWTH-OUTPERFORMING'];
const GROWTHDIFF_MIN_SAMPLES = 5; 

async function renderDollarSmile() {
  const chartEl = document.getElementById('dsmile-chart');
  const insightEl = document.getElementById('dsmile-insight');
  const currentEl = document.getElementById('dsmile-current');
  const tbody = document.getElementById('growthdiff-tbody');
  if (!chartEl) return; 

  let doc;
  try {
    const res = await fetch('./growth-differential-data/history.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc = await res.json();
    if (!doc || !Array.isArray(doc.quarters) || !doc.quarters.length) throw new Error('malformed history.json');
  } catch (e) {
    if (insightEl) insightEl.textContent = 'Dollar Smile data unavailable right now.';
    if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="padding:4px;color:var(--text3);">No data yet.</td></tr>';
    if (currentEl) currentEl.textContent = '';
    return;
  }

  const cur = doc.current;
  const rawStats = doc.regime_stats || {};
  const stats = {};
  _GROWTHDIFF_SMILE_ORDER.forEach(r => {
    const s = rawStats[r] || { n: 0, n_dxy: 0, avg_dxy_qret: null };
    stats[r] = {
      n: s.n_dxy || 0,
      avg: s.avg_dxy_qret,
      ready: (s.n_dxy || 0) >= GROWTHDIFF_MIN_SAMPLES && s.avg_dxy_qret !== null,
    };
  });

  if (currentEl && cur) {
    const diffTxt = `${cur.diff >= 0 ? '+' : ''}${cur.diff.toFixed(2)}pp`;
    const vixTxt = cur.regime === 'GLOBAL-RISK-OFF' && cur.vix_max != null ? `, VIX max ${cur.vix_max.toFixed(1)}` : '';
    const pending = cur.pending || [];
    const coverage = cur.coverage || { reported: 10, total: 10 };
    const coverageTxt = pending.length
      ? ` \u2014 ${coverage.reported}/${coverage.total} reporting, ${pending.join('/')} pending`
      : '';
    currentEl.textContent = `Current: ${cur.quarter} \u2014 ${_GROWTHDIFF_LABELS[cur.regime] || cur.regime} (${diffTxt}${vixTxt})${coverageTxt}`;
  }

  const dxyFirstQ = doc.quarters.find(q => q.dxy_qret !== undefined && q.dxy_qret !== null);
  const dxyStartYear = dxyFirstQ ? dxyFirstQ.quarter.slice(0, 4) : null;

  _dsmileRenderSVG(chartEl, _GROWTHDIFF_SMILE_ORDER, stats, cur ? cur.regime : null);
  _dsmileRenderInsight(insightEl, doc, cur, stats);
  _growthdiffRenderTable(tbody, rawStats, cur, dxyStartYear);
}

function _dsmileRenderSVG(el, regimes, stats, currentRegime, fmtOpts) {
  const fmt = Object.assign({ decimals: 2, mult: 1, unit: '%' }, fmtOpts || {});
  const W = 620, H = 130, padL = 60, padR = 60;
  const curveTop = 22, curveBottom = 78, midY = (curveTop + curveBottom) / 2, ampY = (curveBottom - curveTop) / 2;
  const rowLabelY = 108, valueLabelGap = 12;
  const xs = regimes.map((_, i) => padL + i * ((W - padL - padR) / (regimes.length - 1)));

  const readyVals = regimes.map(r => stats[r].ready ? stats[r].avg : null).filter(v => v !== null);
  const maxAbs = readyVals.length ? Math.max(0.05, ...readyVals.map(Math.abs)) : 0.3;
  function yFor(r) {
    if (!stats[r].ready || stats[r].avg === null) return midY;
    const raw = midY - (stats[r].avg / maxAbs) * ampY;
    return Math.min(curveBottom, Math.max(curveTop, raw)); 
  }

  const pts = regimes.map((r, i) => ({ x: xs[i], y: yFor(r), r, isCurrent: r === currentRegime }));
  const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');

  const up = _themeColor('--up'), text3 = _themeColor('--text3'),
        accent = _themeColor('--accent'), bg = _themeColor('--bg');

  const circles = pts.map(p => {
    const ready = stats[p.r].ready;
    const color = !ready ? text3 : (p.isCurrent ? up : text3);
    const r = p.isCurrent ? 4.5 : 3;
    const hollow = !ready ? ` fill="${bg}" stroke="${text3}" stroke-width="1.3"` : ` fill="${color}"${p.isCurrent ? ` stroke="${bg}" stroke-width="2"` : ''}`;
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}"${hollow}></circle>`;
  }).join('');

  const labels = pts.map(p => {
    const ready = stats[p.r].ready;
    const dispVal = ready ? stats[p.r].avg * fmt.mult : null;
    const valTxt = ready ? `${dispVal >= 0 ? '+' : ''}${dispVal.toFixed(fmt.decimals)}${fmt.unit}` : `n=${stats[p.r].n}`;
    const valColor = !ready ? text3 : (p.isCurrent ? up : text3);
    const currentTag = p.isCurrent ? ' \u25cf latest' : '';
    const rowLabel = _GROWTHDIFF_LABELS[p.r] || p.r;
    const valueY = Math.max(12, p.y - valueLabelGap);
    return `
      <text x="${p.x.toFixed(1)}" y="${rowLabelY}" font-size="9.5" fill="${text3}" text-anchor="middle">${rowLabel}${currentTag}</text>
      <text x="${p.x.toFixed(1)}" y="${valueY.toFixed(1)}" font-size="9.5" fill="${valColor}" text-anchor="middle">${valTxt}</text>`;
  }).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:120px;display:block;">
      <line x1="${padL}" y1="${midY}" x2="${W - padR}" y2="${midY}" stroke="${_themeColorAlpha('--border', 0.9)}" stroke-width="1"></line>
      <path d="${pathD}" fill="none" stroke="${accent}" stroke-width="1.8"></path>
      ${circles}
      ${labels}
    </svg>`;
}

function _dsmileRenderInsight(el, doc, cur, stats) {
  if (!el) return;
  const regimeLabel = cur ? (_GROWTHDIFF_LABELS[cur.regime] || cur.regime) : '\u2014';
  const curTxt = cur
    ? `USD ${cur.usd_yoy >= 0 ? '+' : ''}${cur.usd_yoy.toFixed(1)}% vs G9 ${cur.g9_avg_yoy >= 0 ? '+' : ''}${cur.g9_avg_yoy.toFixed(1)}% YoY (${cur.diff >= 0 ? '+' : ''}${cur.diff.toFixed(2)}pp)`
    : 'no current reading';

  el.innerHTML = `${cur ? cur.quarter : '\u2014'}: ${curTxt} \u00b7 <span style="color:var(--up);">${regimeLabel}</span>`;

  const pendingTxt = cur && cur.pending && cur.pending.length
    ? ` G9 average uses each currency's own latest available quarter, not all same-quarter: ${cur.pending.map(c => `${c} ${cur.vintages && cur.vintages[c] ? cur.vintages[c] : '\u2014'}`).join(', ')} still on an earlier print than USD's ${cur.quarter}.`
    : '';
  el.title = `Regime = real GDP YoY differential (USD vs G9, FRED) with a VIX\u226540 crisis override \u2014 a genuine panic quarter is Global Risk-Off regardless of growth. ` +
    `Table below shows DXY's historical q/q return by regime, same quarter as the GDP reading (which lags ~1 quarter on release): context on dollar behavior by macro backdrop, not a trade signal.` +
    `${pendingTxt}`;
}

function _growthdiffRenderTable(tbody, rawStats, cur, dxyStartYear) {
  if (!tbody) return;
  const dxyTag = dxyStartYear ? `, DXY ${dxyStartYear}\u2013` : '';
  tbody.innerHTML = _GROWTHDIFF_SMILE_ORDER.map(r => {
    const s = rawStats[r] || { n: 0, avg_dxy_qret: null, n_dxy: 0 };
    const isCurrent = cur && cur.regime === r;
    const avgTxt = s.avg_dxy_qret === null
      ? `\u2014 (n=${s.n_dxy || 0}${dxyTag})`
      : `${s.avg_dxy_qret >= 0 ? '+' : ''}${s.avg_dxy_qret.toFixed(2)}% (n=${s.n_dxy}${dxyTag})`;
    const rowStyle = isCurrent ? ` style="color:var(--up);"` : '';
    return `<tr${rowStyle}><td style="padding:2px 4px;">${_GROWTHDIFF_LABELS[r] || r}${isCurrent ? ' \u25cf' : ''}</td>` +
           `<td style="padding:2px 4px;">${s.n}</td>` +
           `<td style="padding:2px 4px;">${avgTxt}</td></tr>`;
  }).join('');
}

