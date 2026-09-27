(function () {
  'use strict';

  const G10_CURRENCIES     = new Set(['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK']);
  const G10_LIST            = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK'];
  const IMPACTS = new Set(['medium','high']);

  const CAL_CCY_FILTER_KEY = 'gi_cal_ccy_filter';
  function loadCcyFilter() {
    try {
      const raw = localStorage.getItem(CAL_CCY_FILTER_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw);
      return (typeof v === 'string' && G10_CURRENCIES.has(v)) ? v : null;
    } catch { return null; }
  }
  function saveCcyFilter(v) {
    try {
      if (v == null) localStorage.removeItem(CAL_CCY_FILTER_KEY);
      else localStorage.setItem(CAL_CCY_FILTER_KEY, JSON.stringify(v));
    } catch {}
  }
  let _ccyFilter = loadCcyFilter(); 

  const IMPACT_MODES = new Set(['default', 'all', 'high']);
  const CAL_IMPACT_FILTER_KEY = 'gi_cal_impact_filter';
  function loadImpactFilter() {
    try {
      const raw = localStorage.getItem(CAL_IMPACT_FILTER_KEY);
      if (raw === '1') return 'high';
      return IMPACT_MODES.has(raw) ? raw : 'default';
    } catch { return 'default'; }
  }
  function saveImpactFilter(v) {
    try {
      if (v === 'default') localStorage.removeItem(CAL_IMPACT_FILTER_KEY);
      else localStorage.setItem(CAL_IMPACT_FILTER_KEY, v);
    } catch {}
  }
  let _impactMode = loadImpactFilter();
  function passesImpactFilter(ev) {
    if (_impactMode === 'all') return true;
    if (_impactMode === 'high') return ev.impact === 'high';
    return IMPACTS.has(ev.impact);
  }

  let _calWeekOffsetDays = 0;

  let _lastEvents   = null;
  let _lastSource   = null;
  let _lastHolidays = null;

  let _lastFullHistory = [];
  let _seriesIndex     = {};

  const IMPACT_DOT = {
    high:   { color: 'var(--down)',   label: 'High'   },
    medium: { color: 'var(--orange)', label: 'Medium' },
    low:    { color: 'var(--text3)',  label: 'Low'    },
  };

  const FLAG = { USD:'us', EUR:'eu', GBP:'gb', JPY:'jp', AUD:'au', CAD:'ca', CHF:'ch', NZD:'nz', NOK:'no', SEK:'se' };

  const CAL_INVERSE_KW = ['unemployment', 'unemployed', 'jobless', 'claims', 'deficit'];

  const CAL_RATE_KW = ['interest rate decision', 'rate decision', 'cash rate', 'official cash rate', 'refinancing rate', 'ocr'];

  const _calParseNum = s => {
    if (s == null || s === '') return NaN;
    const str = String(s).replace(/,/g, '');
    const neg = str.includes('-');
    const digits = str.replace(/[^\d.]/g, '');
    const n = parseFloat(digits);
    return isNaN(n) ? NaN : (neg ? -n : n);
  };

  function _surpriseTier(actualN, forecastN) {
    if (forecastN === 0) return Math.abs(actualN) > 0 ? 'strong' : 'mild';
    const rel = Math.abs((actualN - forecastN) / forecastN);
    if (rel >= 0.20) return 'strong';
    if (rel >= 0.08) return 'moderate';
    return 'mild';
  }

  function _escAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const _CAL_CCY_PFXS = ['united states ', 'euro area ', 'united kingdom ', 'japan ',
    'australia ', 'canada ', 'switzerland ', 'new zealand ', 'norway ', 'sweden '];
  const _CAL_VENDOR_ALIASES = {
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
    'adp non-farm employment change': 'adp employment change',
    'non-farm employment change': 'non farm payrolls',
    'official cash rate': 'rbnz interest rate decision',
    'nonfarm payrolls': 'non farm payrolls',
    'trade balance': 'balance of trade',
    'core cpi yoy': 'core inflation rate yoy',
    'nationwide hpi mom': 'nationwide housing prices mom',
    'nationwide hpi yoy': 'nationwide housing prices yoy',
  };
  function _calCanonTitle(t) {
    let s = (t || '').toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
    s = s.replace(/\bm\/m\b/g, 'mom').replace(/\by\/y\b/g, 'yoy').replace(/\bq\/q\b/g, 'qoq');
    for (const p of _CAL_CCY_PFXS) { if (s.startsWith(p)) { s = s.slice(p.length); break; } }
    if (_CAL_VENDOR_ALIASES[s]) s = _CAL_VENDOR_ALIASES[s];
    return s;
  }
  function _calSeriesKey(ev) { return `${ev.currency}/${_calCanonTitle(ev.title)}`; }

  function buildSeriesIndex(fullHistory) {
    const idx = {};
    fullHistory.forEach(ev => {
      if (ev.actual == null || ev.actual === '' || ev.actual === '-') return;
      const key = _calSeriesKey(ev);
      (idx[key] = idx[key] || []).push({
        dateISO: ev.dateISO, timeUTC: ev.timeUTC,
        actual: ev.actual, forecast: ev.forecast, previous: ev.previous,
      });
    });
    Object.values(idx).forEach(arr => arr.sort((a, b) => a.dateISO < b.dateISO ? -1 : (a.dateISO > b.dateISO ? 1 : 0)));
    return idx;
  }

  function inferCadence(seriesArr) {
    if (!seriesArr || seriesArr.length < 3) return null;
    const dates = seriesArr.map(e => Date.parse(e.dateISO + 'T00:00:00Z'));
    const gaps = [];
    for (let i = 1; i < dates.length; i++) gaps.push((dates[i] - dates[i - 1]) / 86400000);
    const sorted = gaps.slice().sort((a, b) => a - b);
    const median = n => {
      const mid = Math.floor(n.length / 2);
      return n.length % 2 ? n[mid] : (n[mid - 1] + n[mid]) / 2;
    };
    const gapMedian = median(sorted);
    if (gapMedian <= 0) return null;
    const absDevs = gaps.map(g => Math.abs(g - gapMedian)).sort((a, b) => a - b);
    const mad = median(absDevs);
    const relMad = mad / gapMedian;
    if (relMad > 0.5) return null; 
    if (gapMedian <= 10)  return 'Weekly';
    if (gapMedian <= 40)  return 'Monthly';
    if (gapMedian <= 100) return 'Quarterly';
    if (gapMedian <= 200) return 'Semi-Annual';
    if (gapMedian <= 400) return 'Annual';
    return null;
  }

  const CAL_LIVE_WINDOW_MS     = 3  * 60 * 60 * 1000; 
  const CAL_LIVE_IMMINENT_MS   = 15 * 60 * 1000;       

  function findNextHighImpactEvent(filtered, nowMs) {
    let best = null;
    filtered.forEach(ev => {
      if (ev.impact !== 'high') return;
      const isReleased = !!(ev.actual && ev.actual !== '' && ev.actual !== '-');
      if (isReleased) return;
      if (!ev.timeUTC) return;
      if (ev.timeMode === 'tentative') return;
      const [h, m] = ev.timeUTC.split(':').map(Number);
      const evMs = Date.UTC(+ev.dateISO.slice(0,4), +ev.dateISO.slice(5,7)-1, +ev.dateISO.slice(8,10), h, m);
      const delta = evMs - nowMs;
      if (delta <= 0 || delta > CAL_LIVE_WINDOW_MS) return;
      if (!best || evMs < best.evMs) best = { ev, evMs };
    });
    return best;
  }

  function fmtCountdown(ms) {
    if (ms <= 0) return 'now';
    const totalMin = Math.round(ms / 60000);
    if (totalMin < 1) return '<1m';
    if (totalMin < 60) return totalMin + 'm';
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  }

  function ensureLiveStyles() {
    if (document.getElementById('cal-live-style')) return;
    const s = document.createElement('style');
    s.id = 'cal-live-style';
    s.textContent = `
      @keyframes calLivePulse { 0%,100% { opacity:1; } 50% { opacity:.35; } }
      .cal-event-row.cal-live-soon     { background: rgba(255,167,38,.06); }
      .cal-event-row.cal-live-soon:hover { background: rgba(255,167,38,.12); }
      .cal-event-row.cal-live-imminent { background: rgba(239,83,80,.10); }
      .cal-event-row.cal-live-imminent:hover { background: rgba(239,83,80,.16); }
      .cal-card.cal-live-soon     { background: rgba(255,167,38,.06); }
      .cal-card.cal-live-soon:hover { background: rgba(255,167,38,.12); }
      .cal-card.cal-live-imminent { background: rgba(239,83,80,.10); }
      .cal-card.cal-live-imminent:hover { background: rgba(239,83,80,.16); }
      .cal-live-countdown { animation: calLivePulse 1.1s ease-in-out infinite; color: var(--down); }
    `;
    document.head.appendChild(s);
  }

  function ensureDockedCalStyles() {
    if (document.getElementById('cal-docked-style')) return;
    const s = document.createElement('style');
    s.id = 'cal-docked-style';
    s.textContent = `
      #cal-events-body.cal-docked .cal-time-block { display: flex; gap: 8px; padding: 0 8px; }
      #cal-events-body.cal-docked .cal-time-label {
        flex: 0 0 40px; padding-top: 8px; text-align: right;
        font-size: 10px; font-weight: 500; color: var(--text2);
        font-family: var(--font-mono); white-space: nowrap;
      }
      #cal-events-body.cal-docked .cal-time-rail {
        flex: 1; min-width: 0; border-left: 1px solid var(--border); padding-left: 8px;
      }
      #cal-events-body.cal-docked .cal-card {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--border);
        transition: background .1s;
      }
      #cal-events-body.cal-docked .cal-time-rail .cal-card:last-child { border-bottom: none; }
      #cal-events-body.cal-docked .cal-card:hover { background: var(--bg3); }
      #cal-events-body.cal-docked .cal-card.cal-released { opacity: .55; }
      #cal-events-body.cal-docked .cal-card.cal-holiday-row { opacity: .75; }
      #cal-events-body.cal-docked .cal-card-left {
        display: flex; align-items: flex-start; gap: 5px; min-width: 0;
      }
      #cal-events-body.cal-docked .cal-col.cal-title {
        white-space: normal; overflow: visible; text-overflow: clip;
        font-size: 12px; color: var(--text); line-height: 1.3; padding-right: 0;
      }
      #cal-events-body.cal-docked .cal-card-right { text-align: right; flex: 0 0 auto; padding-left: 4px; }
      #cal-events-body.cal-docked .cal-card-actual {
        font-size: 12px; font-family: var(--font-mono); color: var(--text); white-space: nowrap;
      }
      #cal-events-body.cal-docked .cal-card-sub {
        font-size: 9px; font-family: var(--font-mono); color: var(--text3);
        margin-top: 2px; white-space: nowrap;
      }
      #cal-view-all-link {
        display: block; text-align: center; padding: 8px 10px;
        font-size: 11px; color: var(--text2); cursor: pointer;
        border-top: 1px solid var(--border); background: var(--head-bg);
      }
      #cal-view-all-link:hover { color: var(--text); background: var(--bg3); }
    `;
    document.head.appendChild(s);
  }

  function tickLiveCountdown() {
    document.querySelectorAll('[data-live-ms]').forEach(el => {
      const target = Number(el.dataset.liveMs);
      if (!target) return;
      el.textContent = fmtCountdown(target - Date.now());
    });
  }

  let _syntheticTargetMs = null;
  function getSyntheticLiveEvent(nowMs) {
    if (_syntheticTargetMs == null) _syntheticTargetMs = nowMs + 20 * 60 * 1000;
    const d = new Date(_syntheticTargetMs);
    return {
      dateISO: d.toISOString().slice(0, 10),
      timeUTC: d.toISOString().slice(11, 16),
      currency: 'USD', impact: 'high',
      title: '[TEST FIXTURE] Non-Farm Payrolls',
      forecast: '180K', previous: '175K', actual: null,
    };
  }
  function calDebugLiveEnabled() {
    try { return new URLSearchParams(location.search).get('calDebugLive') === '1'; }
    catch { return false; }
  }

  const CAL_METHODOLOGY = [
    { kw: ['nonfarm payrolls private', 'private nonfarm payrolls', 'nonfarm employment private', 'private payrolls'],
      text: 'Private-sector change in nonfarm jobs — the same net-jobs concept as headline payrolls, but with government employment stripped out. Watched as a cleaner read on private hiring momentum, since public-sector swings (elections, furloughs, census hiring) can distort the headline number without reflecting the private economy.' },
    { kw: ['non-farm payrolls', 'nonfarm payrolls', 'non farm payrolls', 'employment change'],
      text: 'Net change in jobs outside farming, private households, and nonprofits — includes both private and government employment. The single most-watched US labor print — a big beat/miss can move every USD pair within seconds of release.' },
    { kw: ['unemployment rate'],
      text: 'Share of the labor force that is jobless and actively looking for work. A rising rate is a negative surprise for the currency even though the headline number is numerically larger.' },
    { kw: ['average hourly earnings', 'wage price index', 'labour cost index', 'labor cost index'],
      text: 'Wage growth over the period. Central banks watch this as a leading indicator of sticky, demand-driven inflation — hot wage growth tends to firm up rate-hike expectations.' },
    { kw: ['initial jobless claims', 'continuing jobless claims', 'jobless claims'],
      text: 'Weekly count of new (or ongoing) unemployment benefit filings. A high-frequency, low-noise read on labor-market health between the monthly jobs reports.' },
    { kw: ['adp employment'],
      text: "Private-sector payrolls processor ADP's own employment estimate, released two days ahead of official Non-Farm Payrolls. Treated as an imperfect early read, not a reliable predictor of the NFP print." },
    { kw: ['cpi', 'consumer price index', 'inflation rate'],
      text: 'Headline consumer price inflation. Directly feeds central bank rate decisions — a hot print usually firms up hawkish rate expectations and supports the currency, and vice versa.' },
    { kw: ['core inflation', 'core cpi', 'core pce', 'pce price index'],
      text: 'Inflation excluding volatile food and energy prices. Central banks weight this more heavily than headline CPI when setting policy, since it better reflects underlying price pressure.' },
    { kw: ['ppi', 'producer price index'],
      text: "Prices received by producers at the factory gate. A leading indicator for consumer inflation a month or two out, since producer cost pressure tends to pass through to retail prices." },
    { kw: ['gdp'],
      text: 'Gross Domestic Product — the broadest measure of economic output. Quarterly growth (or contraction) versus consensus shapes the market\u2019s view of the whole economic cycle, not just one sector.' },
    { kw: ['retail sales'],
      text: 'Change in consumer spending at the retail level. Consumption drives the majority of GDP in most G10 economies, so this is a fast, monthly proxy for overall demand.' },
    { kw: ['ism manufacturing', 'ism services', 'ism non-manufacturing'],
      text: 'Institute for Supply Management survey of purchasing managers. Above 50 = sector expanding, below 50 = contracting. One of the earliest-available reads on the current month\u2019s activity.' },
    { kw: ['manufacturing pmi', 'services pmi', 'composite pmi', 'flash pmi'],
      text: 'Purchasing Managers\u2019 Index survey. Above 50 = sector expanding, below 50 = contracting — a timely, forward-looking gauge of business activity ahead of harder monthly data.' },
    { kw: CAL_RATE_KW,
      text: "Central bank policy rate announcement. Directly sets the currency's carry/funding cost — the decision itself usually matters less than the accompanying guidance on the path ahead." },
    { kw: ['fomc statement', 'fomc minutes', 'fomc press conference', 'monetary policy statement', 'monetary policy report', 'rate statement'],
      text: 'Central bank\u2019s own account of its policy discussion and forward guidance. Markets parse the language itself for hints on the future rate path, independent of the rate decision.' },
    { kw: ['balance of trade', 'trade balance'],
      text: 'Exports minus imports of goods and services. A signed net level, not a rate — a widening deficit or narrowing surplus can pressure the currency via the current-account channel.' },
    { kw: ['current account'],
      text: 'Broadest measure of a country\u2019s transactions with the rest of the world (trade plus income and transfers). Persistent deficits can weigh on a currency\u2019s longer-term valuation.' },
    { kw: ['industrial production', 'manufacturing production'],
      text: 'Output of factories, mines, and utilities. A real-activity read that complements survey-based PMI data with actual production volumes.' },
    { kw: ['durable goods', 'factory orders', 'core durable goods'],
      text: 'New orders for goods meant to last three years or more (autos, machinery, aircraft). A forward-looking proxy for business investment appetite.' },
    { kw: ['building permits', 'housing starts'],
      text: 'New residential construction authorized (permits) or begun (starts). An early-cycle housing indicator that feeds into broader growth and employment expectations.' },
    { kw: ['existing home sales', 'new home sales', 'pending home sales', 'home sales'],
      text: 'Volume of homes sold. Tracks the health of the housing market and, by extension, consumer wealth and willingness to spend.' },
    { kw: ['consumer confidence', 'consumer sentiment', 'michigan'],
      text: 'Survey of household attitudes toward current and expected economic conditions. A sentiment leading-indicator for future consumer spending.' },
    { kw: ['zew'],
      text: 'ZEW Institute survey of financial analysts\u2019 economic expectations for the next six months. A closely watched early-cycle sentiment gauge for the Eurozone/Germany.' },
    { kw: ['ifo'],
      text: 'Ifo Institute survey of German businesses on current conditions and expectations. One of the most-watched single-country business-climate indicators in the Eurozone.' },
    { kw: ['gdt price index', 'global dairy trade'],
      text: "Global Dairy Trade auction price index. Dairy is one of New Zealand's largest export categories, so this auction result is a direct NZD terms-of-trade signal." },
    { kw: ['housing price index', 'house price index', 'home price index'],
      text: 'Change in residential property prices. A wealth-effect and financial-stability indicator that central banks monitor alongside credit growth.' },
    { kw: ['claimant count'],
      text: 'UK measure of people claiming unemployment-related benefits. The UK\u2019s closest equivalent to the US jobless-claims series for tracking labor-market momentum between official unemployment reports.' },
  ];
  function _calMethodologyFor(title) {
    const t = (title || '').toLowerCase();
    for (const entry of CAL_METHODOLOGY) {
      if (entry.kw.some(k => t.includes(k))) return entry.text;
    }
    return '';
  }

  function ensureMethodologyTooltip() {
    if (document.getElementById('cal-tt-style')) return;
    const s = document.createElement('style');
    s.id = 'cal-tt-style';
    s.textContent = `
      #cal-tt {
        position:fixed;z-index:99999;width:min(240px, calc(100vw - 24px));
        background:var(--bg3);border:1px solid var(--border2);border-radius:4px;
        padding:9px 11px;font-size:11px;color:var(--text);line-height:1.55;
        pointer-events:none;display:none;font-family:var(--font-ui);box-sizing:border-box;
      }
      #cal-tt .tt-title { font-weight:700;font-size:11px;color:#fff;margin-bottom:3px; }
      .cal-col.cal-title[data-cal-tip] { border-bottom:1px dashed rgba(255,255,255,0.2); cursor:help; }
    `;
    document.head.appendChild(s);
    const ttEl = document.createElement('div');
    ttEl.id = 'cal-tt';
    ttEl.innerHTML = '<div class="tt-title" id="cal-tt-title"></div><div id="cal-tt-body"></div>';
    document.body.appendChild(ttEl);
    document.addEventListener('mousemove', ev => {
      const tt = document.getElementById('cal-tt');
      if (tt && tt.style.display === 'block') _calTTPos(ev.clientX, ev.clientY);
    });
  }
  function _calTTPos(cx, cy) {
    const tt = document.getElementById('cal-tt');
    if (!tt) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const ttW = Math.min(240, vw - 24);
    const ttH = tt.offsetHeight || 90;
    const PAD = 8;
    let x = cx + 14, y = cy + 14;
    if (x + ttW > vw - PAD) x = cx - ttW - 8;
    if (x < PAD) x = PAD;
    if (y + ttH > vh - PAD) y = cy - ttH - 8;
    if (y < PAD) y = PAD;
    tt.style.left = x + 'px'; tt.style.top = y + 'px';
  }
  function setupMethodologyTooltipDelegation(container) {
    if (!container || container.dataset.calTipInit === '1') return;
    container.dataset.calTipInit = '1';
    const show = (el, cx, cy) => {
      const tt = document.getElementById('cal-tt');
      if (!tt) return;
      document.getElementById('cal-tt-title').textContent = el.dataset.calTipTitle || '';
      document.getElementById('cal-tt-body').textContent  = el.dataset.calTipBody  || '';
      tt.style.display = 'block';
      requestAnimationFrame(() => _calTTPos(cx, cy));
    };
    const hide = () => { const tt = document.getElementById('cal-tt'); if (tt) tt.style.display = 'none'; };
    container.addEventListener('mouseover', e => {
      const el = e.target.closest('.cal-col.cal-title[data-cal-tip]');
      if (el) show(el, e.clientX, e.clientY);
    });
    container.addEventListener('mouseout', e => {
      if (e.target.closest('.cal-col.cal-title[data-cal-tip]')) hide();
    });
    container.addEventListener('touchstart', e => {
      const el = e.target.closest('.cal-col.cal-title[data-cal-tip]');
      if (el) { e.stopPropagation(); const t = e.touches[0]; show(el, t.clientX, t.clientY); }
    }, { passive: true });
  }

  const CAL_REF_PAIR = { USD:'dxy', EUR:'eurusd', GBP:'gbpusd', JPY:'usdjpy',
    AUD:'audusd', CAD:'usdcad', CHF:'usdchf', NZD:'nzdusd' };
  function _pairMoveUnit(pairKey) {
    if (pairKey === 'dxy')    return { div: 1,      unit: 'pts',  dp: 3 };
    if (pairKey === 'usdjpy') return { div: 0.01,    unit: 'pips', dp: 0 };
    return                         { div: 0.0001,  unit: 'pips', dp: 0 };
  }

  let _calHistLwcPromise = null;
  function _calEnsureLWC() {
    if (window.LightweightCharts) return Promise.resolve();
    if (_calHistLwcPromise) return _calHistLwcPromise;
    _calHistLwcPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/lightweight-charts@5.0.7/dist/lightweight-charts.standalone.production.js';
      s.onload  = resolve;
      s.onerror = () => { _calHistLwcPromise = null; reject(new Error('LWC load failed')); };
      document.head.appendChild(s);
    });
    return _calHistLwcPromise;
  }

  let _calHistChart = null;
  let _calHistOpenToken = 0;
  let _calHistResizeApply = null;
  let _calHistRo = null;
  let _calHistTimers = [];
  function _calDestroyHistChart() {
    _calHistTimers.forEach(id => clearTimeout(id));
    _calHistTimers = [];
    if (_calHistRo) { try { _calHistRo.disconnect(); } catch (_) {} _calHistRo = null; }
    if (_calHistResizeApply) { window.removeEventListener('resize', _calHistResizeApply); _calHistResizeApply = null; }
    if (_calHistChart) { try { _calHistChart.remove(); } catch (_) {} _calHistChart = null; }
  }

  const _CAL_MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function _calFmtDateISO(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    const mon = _CAL_MONTH_ABBR[parseInt(m[2], 10) - 1] || m[2];
    return `${mon} ${parseInt(m[3], 10)} ${m[1]}`;
  }

  function _calRenderHistChart(seriesArr, isInverse, isRateEvent) {
    const LWC = window.LightweightCharts;
    const container = document.getElementById('cal-hist-chart');
    if (!LWC || !container) return;
    _calDestroyHistChart();

    const byDateDedup = new Map();
    seriesArr.forEach(h => byDateDedup.set(h.dateISO, h));
    const dedupedArr = Array.from(byDateDedup.values());

    const pts = dedupedArr.slice(-8)
      .map(h => ({
        time: h.dateISO,
        actual: _calParseNum(h.actual),
        forecast: _calParseNum(h.forecast ? String(h.forecast).replace(/\*$/, '') : (h.previous || '')),
      }))
      .filter(p => isFinite(p.actual) && isFinite(p.forecast));
    if (pts.length < 2) { container.style.display = 'none'; return; }
    container.style.display = '';

    const _cs    = getComputedStyle(document.documentElement);
    const _bg2   = _cs.getPropertyValue('--bg2').trim();
    const _bg3   = _cs.getPropertyValue('--bg3').trim();
    const _bg    = _bg2 || _bg3 || '#1e222d';
    const _text2 = _cs.getPropertyValue('--text2').trim() || '#9096a0';
    const _brd2  = _cs.getPropertyValue('--bg3').trim() || '#2a2e39';

    const rect = container.getBoundingClientRect();
    const chart = LWC.createChart(container, {
      width: Math.round(rect.width) || container.offsetWidth || 380,
      height: 190,
      layout: { background: { type: 'solid', color: _bg }, textColor: _text2, fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 10, attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.10, bottom: 0.10 } },
      timeScale: {
        borderVisible: false, fixRightEdge: true, fixLeftEdge: true, rightOffset: 2,
        tickMarkFormatter: (time) => _calFmtDateISO(typeof time === 'string' ? time : ''),
      },
      crosshair: {
        mode: LWC.CrosshairMode?.Normal ?? 1,
        vertLine: { color: 'rgba(255,255,255,0.2)', style: 2, labelVisible: false },
        horzLine: { color: 'rgba(255,255,255,0.15)', style: 2, labelVisible: true, labelBackgroundColor: _brd2 },
      },
      handleScroll: false, handleScale: false,
    });
    _calHistChart = chart;

    window.__calHistDebug = {
      chart, container,
      axisCanvas: () => [...container.querySelectorAll('canvas')].filter(c => c.height < 40).sort((a,b) => b.width - a.width)[0],
      dump: () => {
        const c = window.__calHistDebug.axisCanvas();
        return c ? { attrW: c.width, attrH: c.height, cssW: c.style.width, cssH: c.style.height, dpr: window.devicePixelRatio } : null;
      },
    };

    const _rateLineType = isRateEvent ? (LWC.LineType?.WithSteps ?? 1) : undefined;

    const actualSeries = chart.addSeries(LWC.LineSeries, {
      color: '#2596ff', lineWidth: 2, priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerVisible: true, crosshairMarkerRadius: 3,
      ...(isRateEvent ? { lineType: _rateLineType } : {}),
    });
    actualSeries.setData(pts.map(p => ({ time: p.time, value: p.actual })));

    const forecastSeries = chart.addSeries(LWC.LineSeries, {
      color: 'rgba(144,150,160,0.85)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerVisible: true, crosshairMarkerRadius: 3,
      ...(isRateEvent ? { lineType: _rateLineType } : {}),
    });
    forecastSeries.setData(pts.map(p => ({ time: p.time, value: p.forecast })));

    chart.timeScale().fitContent();

    const applyHistResize = () => {
      requestAnimationFrame(() => {
        if (!_calHistChart) return;
        const r = container.getBoundingClientRect();
        const w = Math.round(r.width) || container.offsetWidth || 380;
        if (w > 0) { try { _calHistChart.resize(w, 190, true); } catch (_) {} }
      });
    };
    if (window.ResizeObserver) {
      _calHistRo = new ResizeObserver(() => applyHistResize());
      _calHistRo.observe(container);
    }
    _calHistTimers = [
      setTimeout(applyHistResize, 60),
      setTimeout(applyHistResize, 250),
      setTimeout(applyHistResize, 600),
    ];

    container.style.position = 'relative';
    const tip = document.createElement('div');
    tip.className = 'ch-chart-tooltip';
    container.appendChild(tip);
    const byTime = {};
    pts.forEach(p => { byTime[p.time] = p; });
    const TW = 150, TM = 10;
    chart.subscribeCrosshairMove(param => {
      if (!param?.point || !param.time) { tip.style.display = 'none'; return; }
      const p = byTime[param.time];
      if (!p) { tip.style.display = 'none'; return; }
      const diff = p.actual - p.forecast;
      const beat = diff === 0 ? null : (isInverse ? diff < 0 : diff > 0);
      const col  = beat === null ? _text2 : (beat ? '#26a69a' : '#ef5350');
      tip.innerHTML = `
        <div style="color:var(--text2,#9096a0);margin-bottom:3px;">${_calFmtDateISO(param.time)}</div>
        <div><span style="color:#2596ff;">Actual</span> ${p.actual}</div>
        <div><span style="color:rgba(144,150,160,0.9);">Forecast</span> ${p.forecast}</div>
        <div style="color:${col};margin-top:2px;">${diff >= 0 ? '+' : ''}${diff.toFixed(2)} vs. forecast${isInverse ? ' (inverse)' : ''}</div>
      `;
      tip.style.display = 'block';
      const cW = container.clientWidth || 380;
      const cx = param.point.x, cy = param.point.y;
      const th = tip.offsetHeight || 60;
      const tx = (cx + TM + TW <= cW - 4) ? cx + TM : cx - TM - TW;
      const ty = (cy - th - TM >= 4) ? cy - th - TM : cy + TM;
      tip.style.left = Math.max(0, tx) + 'px';
      tip.style.top  = Math.max(0, ty) + 'px';
    });

    _calHistResizeApply = applyHistResize;
    window.addEventListener('resize', applyHistResize);
  }
  const _ohlcCache = {};
  async function fetchRefPairOHLC(ccy) {
    const pairKey = CAL_REF_PAIR[ccy];
    if (!pairKey) return null;
    if (_ohlcCache[pairKey]) return _ohlcCache[pairKey];
    try {
      const res = await fetch(`${GI_DATA_BASE}ohlc-data/${pairKey}.json`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      _ohlcCache[pairKey] = data;
      return data;
    } catch { return null; }
  }
  function computeReleaseDayMove(bars, releaseDatesISO, unit) {
    if (!bars || !bars.length) return null;
    const byDate = {};
    bars.forEach(b => { byDate[b.time] = b; });
    const allRanges = bars
      .map(b => (b.high - b.low) / unit.div)
      .filter(n => isFinite(n) && n >= 0);
    if (!allRanges.length) return null;
    const overallAvg = allRanges.reduce((a, b) => a + b, 0) / allRanges.length;
    const relBars = releaseDatesISO.map(d => byDate[d]).filter(Boolean);
    if (relBars.length < 2) return null; 
    const relRanges = relBars.map(b => (b.high - b.low) / unit.div);
    const relAvg = relRanges.reduce((a, b) => a + b, 0) / relRanges.length;
    return { relAvg, overallAvg, n: relRanges.length, unit: unit.unit, dp: unit.dp };
  }

  function _calBeatClass(actualN, forecastN, isInverse) {
    if (isNaN(actualN) || isNaN(forecastN) || actualN === forecastN) return '';
    const beat = isInverse ? actualN < forecastN : actualN > forecastN;
    return beat ? 'up' : 'down';
  }

  function ensureHistModal() {
    if (document.getElementById('cal-hist-style')) return;
    const s = document.createElement('style');
    s.id = 'cal-hist-style';
    s.textContent = `
      #cal-hist-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100000;
        display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;
      }
      #cal-hist-modal {
        background:var(--bg2, var(--bg3));border:1px solid var(--border2);border-radius:6px;
        width:min(420px, 100%);max-height:min(680px, 90vh);overflow-y:auto;
        font-family:var(--font-ui);color:var(--text);box-sizing:border-box;
      }
      
      #cal-hist-modal .ch-body { overflow-x:auto; }
      #cal-hist-modal table { min-width:0; }
      @media (max-width: 480px) {
        #cal-hist-overlay { padding:8px; }
        #cal-hist-modal { max-height:min(680px, 92dvh, 92vh); }
        #cal-hist-modal th, #cal-hist-modal td { padding:3px 3px;font-size:9px; }
      }
      #cal-hist-modal .ch-head {
        display:flex;align-items:center;justify-content:space-between;gap:8px;
        padding:10px 12px;border-bottom:1px solid var(--border2);position:sticky;top:0;
        background:var(--bg2, var(--bg3));
      }
      #cal-hist-modal .ch-title { font-size:12px;font-weight:700;color:#fff; }
      #cal-hist-modal .ch-close {
        background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;line-height:1;padding:2px 4px;
      }
      #cal-hist-modal .ch-body { padding:10px 12px;font-size:11px;line-height:1.55;color:var(--text2); }
      #cal-hist-modal .ch-tag {
        display:inline-block;font-size:8px;padding:1px 5px;border-radius:2px;margin-right:4px;
        background:var(--bg3);border:1px solid var(--border2);color:var(--text3);
      }
      #cal-hist-modal table { width:100%;border-collapse:collapse;margin-top:8px;font-size:10px; }
      #cal-hist-modal th { text-align:right;color:var(--text3);font-weight:400;font-size:9px;padding:3px 4px;text-transform:uppercase;letter-spacing:.03em; }
      #cal-hist-modal th:first-child, #cal-hist-modal td:first-child { text-align:left; }
      #cal-hist-modal td { text-align:right;padding:3px 4px;border-top:1px solid var(--border2); }
      #cal-hist-modal td.up { color:var(--up); }
      #cal-hist-modal td.down { color:var(--down); }
      #cal-hist-modal .ch-move { margin-top:10px;padding-top:8px;border-top:1px solid var(--border2);font-size:10px;color:var(--text3); }
      #cal-hist-modal .ch-chart-wrap { margin-top:10px;padding-top:8px;padding-bottom:4px;border-top:1px solid var(--border2); }
      #cal-hist-modal .ch-chart-title {
        font-size:9px;text-transform:uppercase;letter-spacing:.03em;color:var(--text3);margin-bottom:4px;
        display:flex;align-items:center;gap:10px;
      }
      #cal-hist-modal .ch-chart-legend { display:flex;align-items:center;gap:4px;font-size:9px;text-transform:none;letter-spacing:0; }
      #cal-hist-modal .ch-chart-swatch { display:inline-block;width:8px;height:2px; }
      #cal-hist-chart { height:190px;position:relative; }
      .ch-chart-tooltip {
        position:absolute;display:none;pointer-events:none;
        background:var(--bg2,#1e222d);border:1px solid var(--border2);
        border-radius:4px;padding:6px 8px;font-size:9px;line-height:1.6;
        font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);
        color:var(--text,#d1d4dc);z-index:50;
        box-shadow:0 4px 16px rgba(0,0,0,.45);white-space:nowrap;
      }
    `;
    document.head.appendChild(s);
    const overlay = document.createElement('div');
    overlay.id = 'cal-hist-overlay';
    overlay.innerHTML = `<div id="cal-hist-modal" role="dialog" aria-modal="true" aria-labelledby="cal-hist-title">
      <div class="ch-head">
        <span class="ch-title" id="cal-hist-title"></span>
        <button type="button" class="ch-close" id="cal-hist-close" aria-label="Close">&#x2715;</button>
      </div>
      <div class="ch-body" id="cal-hist-body"></div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => { overlay.style.display = 'none'; _calHistOpenToken++; _calDestroyHistChart(); };
    document.getElementById('cal-hist-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.style.display === 'flex') close();
    });
  }

  function openHistModal(ev) {
    ensureHistModal();
    const overlay = document.getElementById('cal-hist-overlay');
    const titleEl = document.getElementById('cal-hist-title');
    const bodyEl  = document.getElementById('cal-hist-body');
    if (!overlay || !titleEl || !bodyEl) return;

    const flag = FLAG[ev.currency] || '';
    const flagHtml = flag ? `<span class="fi fi-${flag}" style="margin-right:4px;font-size:10px;"></span>` : '';
    titleEl.innerHTML = `${flagHtml}${_escAttr(ev.currency)} \u00b7 ${_escAttr(ev.title)}`;

    const methodText = _calMethodologyFor(ev.title);
    const key         = _calSeriesKey(ev);
    const seriesArr   = _seriesIndex[key] || [];
    const cadence     = inferCadence(seriesArr);
    const evTitleLower = (ev.title || '').toLowerCase();
    const isInverse   = CAL_INVERSE_KW.some(kw => evTitleLower.includes(kw));
    const isRateEvent = CAL_RATE_KW.some(kw => evTitleLower.includes(kw));

    let html = '';
    if (methodText) html += `<div>${_escAttr(methodText)}</div>`;
    if (cadence) html += `<div style="margin-top:6px;"><span class="ch-tag">${cadence}</span></div>`;
    if (isInverse) html += `<div style="margin-top:6px;color:var(--text3);font-style:italic;">Inverse indicator — a higher actual than forecast is colored as a miss, not a beat.</div>`;

    const last8 = seriesArr.slice(-8).reverse();
    if (last8.length) {
      html += `<table><thead><tr>
        <th>Date</th><th>Actual</th><th>Forecast</th><th>Previous</th>
      </tr></thead><tbody>`;
      last8.forEach(h => {
        const actualN   = _calParseNum(h.actual);
        const forecastN = _calParseNum(h.forecast ? String(h.forecast).replace(/\*$/, '') : (h.previous || ''));
        const cls = _calBeatClass(actualN, forecastN, isInverse);
        html += `<tr>
          <td>${_escAttr(h.dateISO)}</td>
          <td class="${cls}">${_escAttr(h.actual)}</td>
          <td>${_escAttr(h.forecast || '\u2014')}</td>
          <td>${_escAttr(h.previous || '\u2014')}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    } else {
      html += `<div style="margin-top:8px;color:var(--text3);">No prior actual/forecast history for this event in the last year.</div>`;
    }

    if (last8.length >= 2) {
      html += `<div class="ch-chart-wrap" id="cal-hist-chart-wrap" style="display:none;">
        <div class="ch-chart-title">Actual vs. forecast
          <span class="ch-chart-legend"><span class="ch-chart-swatch" style="background:#2596ff;"></span>Actual</span>
          <span class="ch-chart-legend"><span class="ch-chart-swatch" style="background:rgba(144,150,160,0.85);border-top:1px dashed rgba(144,150,160,0.85);height:0;"></span>Forecast</span>
        </div>
        <div id="cal-hist-chart"></div>
      </div>`;
    }

    html += `<div class="ch-move" id="cal-hist-move">Loading reference-pair context\u2026</div>`;

    bodyEl.innerHTML = html;
    overlay.style.display = 'flex';

    if (last8.length >= 2) {
      const openToken = ++_calHistOpenToken;
      const chartWrap = document.getElementById('cal-hist-chart-wrap');
      _calEnsureLWC().then(() => {
        if (openToken !== _calHistOpenToken || overlay.style.display !== 'flex') return;
        if (chartWrap) chartWrap.style.display = '';
        _calRenderHistChart(seriesArr, isInverse, isRateEvent);
      }).catch(() => { if (chartWrap) chartWrap.style.display = 'none'; });
    } else {
      _calDestroyHistChart();
    }

    const pairKey = CAL_REF_PAIR[ev.currency];
    const moveEl  = document.getElementById('cal-hist-move');
    if (!pairKey || last8.length < 2) {
      if (moveEl) moveEl.textContent = '';
    } else {
      fetchRefPairOHLC(ev.currency).then(bars => {
        const el = document.getElementById('cal-hist-move');
        if (!el) return;
        const unit = _pairMoveUnit(pairKey);
        const releaseDates = seriesArr.map(h => h.dateISO);
        const move = computeReleaseDayMove(bars, releaseDates, unit);
        if (!move) { el.textContent = ''; return; }
        el.innerHTML = `${pairKey.toUpperCase()} avg daily range on this series\u2019 release days ` +
          `(${move.n} obs.): <b style="color:var(--text2);">${move.relAvg.toFixed(move.dp)} ${move.unit}</b> ` +
          `vs. <b style="color:var(--text2);">${move.overallAvg.toFixed(move.dp)} ${move.unit}</b> typical day. ` +
          `Daily-bar proxy, not an intraday post-release reaction measurement.`;
      });
    }
  }

  function setupHistModalDelegation(container) {
    if (!container || container.dataset.calHistInit === '1') return;
    container.dataset.calHistInit = '1';
    container.addEventListener('click', e => {
      const el = e.target.closest('.cal-col.cal-title[data-cal-hist-idx]');
      if (!el) return;
      const idx = Number(el.dataset.calHistIdx);
      const ev = _calRenderIndex[idx];
      if (ev) openHistModal(ev);
    });
  }
  let _calRenderIndex = []; 

  function buildRevisionIndex(events) {
    const idx = {};
    events.forEach(ev => {
      if (ev.actual == null || ev.actual === '' || ev.actual === '-') return;
      const k = `${ev.currency}|${ev.title}`;
      (idx[k] = idx[k] || []).push({ dateISO: ev.dateISO, actual: ev.actual });
    });
    Object.values(idx).forEach(arr => arr.sort((a, b) => a.dateISO < b.dateISO ? -1 : 1));
    return idx;
  }
  function detectRevision(ev, revIdx) {
    if (!ev.previous) return null;
    const k = `${ev.currency}|${ev.title}`;
    const hist = revIdx[k];
    if (!hist || hist.length < 2) return null;
    let priorActual = null;
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].dateISO < ev.dateISO) { priorActual = hist[i].actual; break; }
    }
    if (priorActual == null) return null;
    const prevN  = _calParseNum(ev.previous);
    const priorN = _calParseNum(priorActual);
    if (isNaN(prevN) || isNaN(priorN)) return priorActual !== ev.previous ? { old: priorActual, new: ev.previous } : null;
    return prevN !== priorN ? { old: priorActual, new: ev.previous } : null;
  }

  function tzLabel() {
    const off = -new Date().getTimezoneOffset();
    const sign = off >= 0 ? '+' : '-';
    const h = Math.floor(Math.abs(off) / 60);
    const m = Math.abs(off) % 60;
    return 'GMT' + sign + h + (m ? ':' + String(m).padStart(2,'0') : '');
  }

  function toLocalTime(dateISO, timeUTC) {
    if (!timeUTC) return 'Tentative';
    const [h, m] = timeUTC.split(':').map(Number);
    const d = new Date(Date.UTC(
      +dateISO.slice(0,4), +dateISO.slice(5,7)-1, +dateISO.slice(8,10), h, m
    ));
    return d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
  }

  function formatDate(dateISO) {
    const [y, mo, d] = dateISO.split('-').map(Number);
    const dt = new Date(y, mo - 1, d);   
    return dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  }

  function toLocalDateISO(dateISO, timeUTC, timeMode) {
    if (!timeUTC || timeMode === 'tentative') return dateISO;
    const [h, m] = timeUTC.split(':').map(Number);
    const d = new Date(Date.UTC(
      +dateISO.slice(0,4), +dateISO.slice(5,7)-1, +dateISO.slice(8,10), h, m
    ));
    const ly = d.getFullYear();
    const lm = String(d.getMonth() + 1).padStart(2, '0');
    const ld = String(d.getDate()).padStart(2, '0');
    return `${ly}-${lm}-${ld}`;
  }

  function isPastEvent(dateISO, timeUTC) {
    const [h, m] = (timeUTC || '23:59').split(':').map(Number);
    const evMs = Date.UTC(
      +dateISO.slice(0,4), +dateISO.slice(5,7)-1, +dateISO.slice(8,10), h, m
    );
    return evMs < Date.now();
  }

  function todayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function _isoFromLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function _calWeekStartISO(offsetDays) {
    const now = new Date();
    const day = now.getDay();
    const toMonday = (day === 0) ? -6 : (1 - day);
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + toMonday + offsetDays);
    return _isoFromLocalDate(monday);
  }

  function _calWeekEndISO(startISO) {
    const [y, m, d] = startISO.split('-').map(Number);
    const end = new Date(y, m - 1, d + 6);
    return _isoFromLocalDate(end);
  }

  function _formatWeekRange(startISO, endISO) {
    const [sy, sm, sd] = startISO.split('-').map(Number);
    const [, em, ed] = endISO.split('-').map(Number);
    const sMonth = new Date(sy, sm - 1, sd).toLocaleDateString('en-US', { month: 'short' });
    const eMonth = new Date(sy, em - 1, ed).toLocaleDateString('en-US', { month: 'short' });
    return sMonth === eMonth ? `${sMonth} ${sd}\u2013${ed}` : `${sMonth} ${sd}\u2013${eMonth} ${ed}`;
  }

  function scrollCalTo(container, target) {
    if (!target) { container.scrollTop = 0; return; }
    const offset = target.offsetTop - container.offsetTop;
    container.scrollTop = Math.max(0, offset - 2);
  }

  function setupNextEventButton(container, firstUpcomingEl) {
    const prev = document.getElementById('cal-next-btn');
    if (prev) prev.remove();

    if (!firstUpcomingEl) return;

    const timeEl  = firstUpcomingEl.querySelector('.cal-time');
    const ccyEl   = firstUpcomingEl.querySelector('.cal-ccy');
    const titleEl = firstUpcomingEl.querySelector('.cal-title');
    const dotEl   = firstUpcomingEl.querySelector('.cal-dot');

    const timeStr  = timeEl  ? timeEl.textContent.trim()  : '';
    const ccyStr   = ccyEl  ? ccyEl.textContent.trim()   : '';
    const titleStr = titleEl ? titleEl.textContent.trim() : 'Next event';
    const shortTitle = titleStr.length > 28 ? titleStr.slice(0, 26) + '…' : titleStr;
    const dotColor = dotEl ? dotEl.style.background : 'var(--text3)';

    const btn = document.createElement('button');
    btn.id = 'cal-next-btn';
    btn.title = `Jump to next event: ${titleStr}`;
    btn.setAttribute('aria-label', `Jump to next event: ${titleStr}`);
    btn.innerHTML = `
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${dotColor};margin-right:5px;flex-shrink:0;"></span>
      <span style="color:var(--text2);margin-right:4px;font-family:var(--font-mono);font-size:10px;">${_escAttr(timeStr)}</span>
      <span style="color:var(--text2);margin-right:4px;font-size:9px;">${_escAttr(ccyStr)}</span>
      <span style="color:var(--text2);font-size:10px;">${_escAttr(shortTitle)}</span>
      <span id="cal-next-btn-arrow" style="color:var(--text2);margin-left:5px;font-size:10px;">↓</span>`;
    btn.style.cssText = [
      'position:absolute',
      'bottom:6px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'align-items:center',
      'padding:4px 10px',
      'background:var(--bg3)',
      'border:1px solid var(--border2)',
      'border-radius:12px',
      'cursor:pointer',
      'white-space:nowrap',
      'z-index:10',
      'transition:opacity .15s',
      'opacity:0',
      'pointer-events:none',
    ].join(';');

    const wrapper = container.parentElement;
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.appendChild(btn);
    } else {
      return;
    }

    btn.addEventListener('click', () => {
      const prev = firstUpcomingEl.previousElementSibling;
      const target = (prev && prev.classList.contains('cal-date-row')) ? prev : firstUpcomingEl;
      scrollCalTo(container, target);
    });

    function updateBtnVisibility() {
      const cTop    = container.scrollTop;
      const cBottom = cTop + container.clientHeight;
      const eTop    = firstUpcomingEl.offsetTop - container.offsetTop;
      const eBottom = eTop + firstUpcomingEl.offsetHeight;
      const visible = eTop >= cTop && eBottom <= cBottom + 4;
      btn.style.opacity        = visible ? '0' : '0.92';
      btn.style.pointerEvents  = visible ? 'none' : 'auto';
      const arrowEl = document.getElementById('cal-next-btn-arrow');
      if (arrowEl) arrowEl.textContent = eTop < cTop ? '↑' : '↓';
    }

    container.addEventListener('scroll', updateBtnVisibility, { passive: true });
    requestAnimationFrame(() => requestAnimationFrame(updateBtnVisibility));
  }

  function cleanSourceLabel(raw) {
    if (!raw) return 'calendar-primary';
    const stripped = String(raw).replace(/\s*\([^)]*\)\s*$/, '').trim();
    return stripped || 'calendar-primary';
  }

  function buildPanel(events, source, holidays) {
    source   = cleanSourceLabel(source);
    holidays = holidays || [];
    const container = document.getElementById('cal-events-body');
    const sourceEl  = document.getElementById('cal-panel-sub');
    if (!container) return;
    ensureLiveStyles();          
    ensureDockedCalStyles();
    ensureMethodologyTooltip();  
    ensureHistModal();           
    _calRenderIndex = [];
    const isDocked = !isCalFullscreenActive() && window.innerWidth <= 900;

    const _now       = new Date();
    const nowMs      = _now.getTime();
    const _yISO = _calWeekStartISO(_calWeekOffsetDays);
    const _mISO = _calWeekEndISO(_yISO);

    let filtered = events.filter(ev =>
      G10_CURRENCIES.has(ev.currency) && passesImpactFilter(ev) &&      
      (_ccyFilter == null || ev.currency === _ccyFilter) &&         
      ev.dateISO >= _yISO && ev.dateISO <= _mISO
    );

    let _hiddenByImpactCount = 0;
    if (_impactMode === 'high') {
      const _withoutImpactGate = events.filter(ev =>
        G10_CURRENCIES.has(ev.currency) && IMPACTS.has(ev.impact) &&
        (_ccyFilter == null || ev.currency === _ccyFilter) &&
        ev.dateISO >= _yISO && ev.dateISO <= _mISO
      );
      _hiddenByImpactCount = _withoutImpactGate.length - filtered.length;
    }

    const revIdx = buildRevisionIndex(events);

    const liveTarget = _calWeekOffsetDays === 0 ? findNextHighImpactEvent(filtered, nowMs) : null;

    if (!filtered.length && _calWeekOffsetDays === 0) {
      const g10 = events.filter(ev => G10_CURRENCIES.has(ev.currency) && passesImpactFilter(ev));
      if (g10.length) {
        const latestISO = g10.reduce((max, ev) => ev.dateISO > max ? ev.dateISO : max, g10[0].dateISO);
        const fallbackFrom = new Date(latestISO + 'T00:00:00Z');
        fallbackFrom.setUTCDate(fallbackFrom.getUTCDate() - 3);
        const fallbackFromISO = fallbackFrom.toISOString().slice(0, 10);
        filtered = g10.filter(ev => ev.dateISO >= fallbackFromISO && ev.dateISO <= latestISO);
      }
    }

    const holidayByDate = {};
    holidays.forEach(h => {
      if (!h.dateISO) return;
      if (h.dateISO < _yISO || h.dateISO > _mISO) return;
      if (!holidayByDate[h.dateISO]) holidayByDate[h.dateISO] = [];
      holidayByDate[h.dateISO].push(h);
    });

    const allDates = new Set([
      ...filtered.map(ev => toLocalDateISO(ev.dateISO, ev.timeUTC, ev.timeMode)),
      ...Object.keys(holidayByDate),
    ]);

    if (!allDates.size) {
      const emptyMsg = (_impactMode === 'high' && _hiddenByImpactCount > 0)
        ? `No high-impact events in this window (${_hiddenByImpactCount} medium-impact event${_hiddenByImpactCount === 1 ? '' : 's'} hidden — switch to "Med+High" or "All" to see them).`
        : 'No events available.';
      container.innerHTML = `<div style="padding:12px 10px;color:var(--text3);font-size:11px;">${emptyMsg}</div>`;
      return;
    }

    const byDate = {};
    filtered.forEach(ev => {
      const localDate = toLocalDateISO(ev.dateISO, ev.timeUTC, ev.timeMode);
      if (!byDate[localDate]) byDate[localDate] = [];
      byDate[localDate].push(ev);
    });

    const today = todayISO();
    const groups = [];

    Array.from(allDates).sort().forEach(dateISO => {
      const dayEvs = (byDate[dateISO] || []).slice().sort((a, b) => {
        const ams = Date.UTC(+a.dateISO.slice(0,4), +a.dateISO.slice(5,7)-1, +a.dateISO.slice(8,10),
          ...(a.timeUTC ? a.timeUTC.split(':').map(Number) : [23, 59]));
        const bms = Date.UTC(+b.dateISO.slice(0,4), +b.dateISO.slice(5,7)-1, +b.dateISO.slice(8,10),
          ...(b.timeUTC ? b.timeUTC.split(':').map(Number) : [23, 59]));
        return ams - bms;
      });
      const dayHols = holidayByDate[dateISO] || [];
      const isToday = dateISO === today;
      let gHtml = `<div class="cal-date-row" data-date="${dateISO}"${isToday ? ' data-today="1"' : ''}>${formatDate(dateISO)}</div>`;

      const dockedGroups = [];
      const pushDockedCard = (label, cardHtml) => {
        const last = dockedGroups[dockedGroups.length - 1];
        if (last && last.label === label) { last.html += cardHtml; }
        else dockedGroups.push({ label, html: cardHtml });
      };

      dayHols.forEach(hol => {
        const ccy = hol.currency || '';
        const f   = FLAG[ccy] || '';
        const flagHtml = f
          ? `<span class="fi fi-${f}" style="font-size:10px;margin-right:3px;flex-shrink:0;" title="${ccy}"></span>`
          : '';
        const holTitle  = hol.title || 'Bank Holiday';
        const tooltipTx = `${_escAttr(holTitle)} — ${_escAttr(ccy)} market closed`;

        if (isDocked) {
          pushDockedCard('All day', `<div class="cal-card cal-holiday-row" title="${tooltipTx}">` +
            `<div class="cal-card-left">` +
            `<span class="cal-dot" style="background:var(--text3);margin-top:5px;" title="Market holiday"></span>` +
            `${flagHtml}<div class="cal-col cal-title">${_escAttr(holTitle)}</div>` +
            `</div>` +
            `<div class="cal-card-right"><div class="cal-card-actual" style="color:var(--text3)">${_escAttr(ccy)}</div></div>` +
            `</div>`);
          return;
        }

        gHtml += `<div class="cal-event-row cal-holiday-row" title="${tooltipTx}">` +
          `<div class="cal-col cal-time">All Day</div>` +
          `<div class="cal-col cal-ccy">${flagHtml}<span style="font-size:10px;">${_escAttr(ccy)}</span></div>` +
          `<div class="cal-col cal-impact"><span class="cal-dot" style="background:var(--text3);" title="Market holiday"></span></div>` +
          `<div class="cal-col cal-title">${_escAttr(holTitle)}</div>` +
          `<div class="cal-col cal-num"><span style="color:var(--text3)">—</span></div>` +
          `<div class="cal-col cal-num"><span style="color:var(--text3)">—</span></div>` +
          `<div class="cal-col cal-num"><span style="color:var(--text3)">—</span></div>` +
          `</div>`;
      });

      dayEvs.forEach(ev => {
        const dot        = IMPACT_DOT[ev.impact];
        const flag       = FLAG[ev.currency] || '';
        const flagHtml   = flag ? `<span class="fi fi-${flag}" style="margin-right:4px;font-size:10px;flex-shrink:0;"></span>` : '';
        const isReleased = !!(ev.actual && ev.actual !== '' && ev.actual !== '-');
        const isPast     = isPastEvent(ev.dateISO, ev.timeUTC);
        const dimmed     = isPast && isReleased;

        let actualHtml = '<span style="color:var(--text3)">—</span>';
        if (isReleased && ev.actual != null) {
          const forecastRaw = ev.forecast ? String(ev.forecast).replace(/\*$/, '') : null;
          const actualN   = _calParseNum(ev.actual);
          const forecastN = _calParseNum(forecastRaw || ev.previous || '');
          const evTitle   = (ev.title || '').toLowerCase();
          const isInverse = CAL_INVERSE_KW.some(kw => evTitle.includes(kw));
          let cls = '';
          let styleAttr = '';
          if (!isNaN(actualN) && !isNaN(forecastN) && actualN !== forecastN) {
            const beat = isInverse ? actualN < forecastN : actualN > forecastN;
            cls = beat ? ' class="up"' : ' class="down"';
            const tier = _surpriseTier(actualN, forecastN);
            if (tier === 'moderate') styleAttr = ' style="font-weight:600;"';
            if (tier === 'strong')   styleAttr = ` style="font-weight:700;background:${beat ? 'rgba(38,166,154,.14)' : 'rgba(239,83,80,.14)'};border-radius:2px;padding:0 3px;"`;
          }
          actualHtml = `<span${cls}${styleAttr}>${_escAttr(ev.actual)}</span>`;
        }

        let forecastHtml;
        if (!ev.forecast) {
          forecastHtml = '<span style="color:var(--text3)">—</span>';
        } else if (String(ev.forecast).endsWith('*')) {
          const displayVal = String(ev.forecast).slice(0, -1); 
          forecastHtml = `<span style="color:var(--text3)" title="Last known consensus (provider estimate unavailable)">${_escAttr(displayVal)}*</span>`;
        } else {
          forecastHtml = `<span style="color:var(--text2)">${_escAttr(ev.forecast)}</span>`;
        }
        const revision = ev.previous ? detectRevision(ev, revIdx) : null;
        const revMarkHtml = revision
          ? ` <sup title="Revised from ${_escAttr(revision.old)} to ${_escAttr(revision.new)}" style="color:var(--orange);font-size:8px;cursor:help;">R</sup>`
          : '';
        const previousHtml = ev.previous
          ? `<span style="color:var(--text3)">${_escAttr(ev.previous)}</span>${revMarkHtml}`
          : '<span style="color:var(--text3)">—</span>';

        const localTime = toLocalTime(ev.dateISO, ev.timeUTC);
        const upcomingAttr = (!isPast) ? ' data-upcoming="1"' : '';
        const isTentative = ev.timeMode === 'tentative';
        const tentativeTimeText = ev.timeUTC ? `~${localTime}` : 'Tentative';

        const isLiveTarget = !!(liveTarget && liveTarget.ev === ev);
        let liveClass = '';
        let timeCellHtml = localTime;
        let dockedTimeLabel = localTime;
        if (!ev.timeUTC) {
          timeCellHtml = `<span class="cal-time-tentative" title="Day confirmed by the data provider; exact release time not yet published">${localTime}</span>`;
        } else if (isTentative) {
          timeCellHtml = `<span class="cal-time-tentative" title="Estimated release time \u2014 provisional, not yet confirmed by the data provider. Shown in your local time (${tzLabel()}); the calendar day this event is grouped under stays anchored to the data provider's confirmed date, not to this estimate.">${tentativeTimeText}</span>`;
          dockedTimeLabel = tentativeTimeText;
        }
        let liveBadgeHtml = '';
        if (isLiveTarget) {
          const delta = liveTarget.evMs - nowMs;
          liveClass = delta <= CAL_LIVE_IMMINENT_MS ? ' cal-live-imminent' : ' cal-live-soon';
          const countdownHtml = `<span class="cal-live-countdown" data-live-ms="${liveTarget.evMs}" ` +
            `title="${localTime} local \u2014 next high-impact release">${fmtCountdown(delta)}</span>`;
          timeCellHtml = countdownHtml;
          liveBadgeHtml = ` ${countdownHtml}`;
        }

        const methodText  = _calMethodologyFor(ev.title);
        const histIdx     = _calRenderIndex.push(ev) - 1;
        const titleInner  = _escAttr(ev.title);

        if (isDocked) {
          const titleAttrs = methodText
            ? ` data-cal-tip="1" data-cal-tip-title="${_escAttr(ev.title)}" data-cal-tip-body="${_escAttr(methodText)}" data-cal-hist-idx="${histIdx}"`
            : ` title="${_escAttr(ev.title)}" data-cal-hist-idx="${histIdx}"`;
          const fcstOrDash = ev.forecast ? forecastHtml : '<span style="color:var(--text3)">—</span>';
          const dockedSub  = `${previousHtml} \u2192 ${fcstOrDash}`;
          const cardHtml = `<div class="cal-card${dimmed ? ' cal-released' : ''}${liveClass}"${upcomingAttr}>` +
            `<div class="cal-card-left">` +
            `<span class="cal-dot" style="background:${dot.color};margin-top:5px;" title="${dot.label} impact"></span>` +
            `${flagHtml}` +
            `<div class="cal-col cal-title" style="cursor:pointer;"${titleAttrs}>${titleInner}${liveBadgeHtml}</div>` +
            `</div>` +
            `<div class="cal-card-right">` +
            `<div class="cal-card-actual">${actualHtml}</div>` +
            `<div class="cal-card-sub">${dockedSub}</div>` +
            `</div>` +
            `</div>`;
          pushDockedCard(dockedTimeLabel, cardHtml);
          return;
        }

        const titleCellHtml = methodText
          ? `<div class="cal-col cal-title" data-cal-tip="1" data-cal-tip-title="${_escAttr(ev.title)}" data-cal-tip-body="${_escAttr(methodText)}" data-cal-hist-idx="${histIdx}" style="cursor:pointer;">${titleInner}</div>`
          : `<div class="cal-col cal-title" title="${_escAttr(ev.title)}" data-cal-hist-idx="${histIdx}" style="cursor:pointer;">${titleInner}</div>`;

        gHtml += `<div class="cal-event-row${dimmed ? ' cal-released' : ''}${liveClass}"${upcomingAttr}>
  <div class="cal-col cal-time">${timeCellHtml}</div>
  <div class="cal-col cal-ccy">${flagHtml}${_escAttr(ev.currency)}</div>
  <div class="cal-col cal-impact"><span class="cal-dot" style="background:${dot.color}" title="${dot.label} impact"></span></div>
  ${titleCellHtml}
  <div class="cal-col cal-num">${actualHtml}</div>
  <div class="cal-col cal-num">${forecastHtml}</div>
  <div class="cal-col cal-num">${previousHtml}</div>
</div>`;
      });

      if (isDocked && dockedGroups.length) {
        gHtml += dockedGroups.map(g =>
          `<div class="cal-time-block">` +
          `<div class="cal-time-label">${_escAttr(g.label)}</div>` +
          `<div class="cal-time-rail">${g.html}</div>` +
          `</div>`
        ).join('');
      }

      groups.push({ dateISO, html: gHtml, rowCount: 1 + dayHols.length + dayEvs.length });
    });

    const splitCols = shouldSplitCalColumns() && groups.length > 1;
    container.classList.toggle('cal-cols-active', splitCols);
    container.classList.toggle('cal-docked', isDocked);
    const staticHdr = document.getElementById('cal-static-col-header');
    if (staticHdr) staticHdr.style.display = (splitCols || isDocked) ? 'none' : 'grid';
    document.getElementById('section-tvcalendar')?.classList.toggle('cal-fs-split', splitCols);

    const ccyBox      = document.getElementById('cal-ccy-filter');
    const headActions = document.getElementById('cal-panel-head-actions');
    const filterRow   = document.getElementById('cal-filter-row');
    if (ccyBox) {
      if (splitCols && headActions) {
        if (ccyBox.parentNode !== headActions) headActions.insertBefore(ccyBox, headActions.firstChild);
        ccyBox.style.borderLeft  = 'none';
        ccyBox.style.padding     = '0';
        ccyBox.style.marginRight = '0';
      } else if (filterRow) {
        if (ccyBox.parentNode !== filterRow) filterRow.appendChild(ccyBox);
        ccyBox.style.borderLeft  = 'none';
        ccyBox.style.padding     = '0';
        ccyBox.style.marginRight = '0';
      }
    }

    const toolBox = document.getElementById('cal-toolbar');
    if (toolBox && ccyBox && ccyBox.parentNode) {
      const targetParent = ccyBox.parentNode;
      if (toolBox.parentNode !== targetParent || toolBox.previousSibling !== ccyBox) {
        targetParent.insertBefore(toolBox, ccyBox.nextSibling);
      }
      toolBox.style.borderRight = 'none';
      toolBox.style.padding     = '0';
      toolBox.style.marginRight = '0';
      toolBox.style.marginLeft  = splitCols ? '4px' : '0';
    }

    if (filterRow) filterRow.style.display = splitCols ? 'none' : 'flex';

    let html;
    if (splitCols) {
      const totalRows = groups.reduce((s, g) => s + g.rowCount, 0);
      let acc = 0, splitAt = groups.length;
      for (let i = 0; i < groups.length; i++) {
        const prevAcc = acc;
        acc += groups[i].rowCount;
        if (acc >= totalRows / 2) {
          const diffAfter  = Math.abs(acc - totalRows / 2);
          const diffBefore = Math.abs(prevAcc - totalRows / 2);
          splitAt = (diffBefore <= diffAfter) ? i : i + 1;
          break;
        }
      }
      if (splitAt <= 0) splitAt = 1;                           
      if (splitAt >= groups.length) splitAt = Math.ceil(groups.length / 2); 
      const colHdr  = buildCalColHeaderHtml();
      const col1Html = groups.slice(0, splitAt).map(g => g.html).join('');
      const col2Html = groups.slice(splitAt).map(g => g.html).join('');
      html = `<div class="cal-events-cols">` +
        `<div class="cal-col-wrap">${colHdr}${col1Html}</div>` +
        `<div class="cal-col-wrap">${colHdr}${col2Html}</div>` +
        `</div>`;
    } else {
      html = groups.map(g => g.html).join('');
      if (isDocked) {
        html += `<div id="cal-view-all-link" role="button" tabindex="0">Ver todos los eventos <i class="ti ti-chevron-down" aria-hidden="true"></i></div>`;
      }
    }

    const isFirstRender     = container.dataset.calInitialized !== '1';
    const scrollRootsBefore = container.querySelectorAll('.cal-col-wrap');
    const savedScrollTops   = isFirstRender
      ? []
      : (scrollRootsBefore.length ? Array.from(scrollRootsBefore).map(r => r.scrollTop) : [container.scrollTop]);

    const impactNoteHtml = (_impactMode === 'high' && _hiddenByImpactCount > 0)
      ? `<div class="cal-impact-hidden-note" style="padding:5px 10px;font-size:10px;` +
        `color:var(--text3);background:var(--bg3);border-bottom:1px solid var(--border2);">` +
        `Showing high-impact only — ${_hiddenByImpactCount} medium-impact event` +
        `${_hiddenByImpactCount === 1 ? '' : 's'} hidden this window.</div>`
      : '';
    container.innerHTML = impactNoteHtml + html;

    if (!isFirstRender) {
      const roots = container.querySelectorAll('.cal-col-wrap');
      if (roots.length) {
        const shapeMatches = roots.length === savedScrollTops.length;
        roots.forEach((r, i) => { r.scrollTop = shapeMatches ? (savedScrollTops[i] || 0) : 0; });
      } else {
        container.scrollTop = savedScrollTops[0] || 0;
      }
    }

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const todayRow      = container.querySelector('[data-today="1"]');
      const firstUpcoming = container.querySelector('[data-upcoming="1"]');
      const scrollRootFor = el => (el && el.closest('.cal-col-wrap')) || container;

      if (isFirstRender) {
        if (todayRow) {
          scrollCalTo(scrollRootFor(todayRow), todayRow);
        } else if (firstUpcoming) {
          const prev = firstUpcoming.previousElementSibling;
          const target = (prev && prev.classList.contains('cal-date-row')) ? prev : firstUpcoming;
          scrollCalTo(scrollRootFor(firstUpcoming), target);
        } else {
          const allDateRows = container.querySelectorAll('.cal-date-row[data-date]');
          let scrolled = false;
          for (const row of allDateRows) {
            if (row.dataset.date > today) {
              scrollCalTo(scrollRootFor(row), row);
              scrolled = true;
              break;
            }
          }
          if (!scrolled) {
            const roots = container.querySelectorAll('.cal-col-wrap');
            if (roots.length) roots.forEach(r => { r.scrollTop = 0; }); else container.scrollTop = 0;
          }
        }
        container.dataset.calInitialized = '1';
      }

      setupNextEventButton(scrollRootFor(firstUpcoming), firstUpcoming);
    }));

    if (sourceEl) {
      const _srcSuffix = _impactMode === 'all' ? 'all impact levels'
        : _impactMode === 'high' ? 'high impact only'
        : 'medium & high impact';
      sourceEl.textContent = `G10 currencies · ${_srcSuffix}`;
    }
    const thTime = document.getElementById('cal-th-time');
    if (thTime) thTime.textContent = tzLabel();

    setupCcyFilterUI(); 
    setupImpactFilterUI(); 
    setupWeekNavUI(); 
    setupMethodologyTooltipDelegation(container); 
    setupHistModalDelegation(container); 
    setupViewAllLinkUI();
    tickLiveCountdown(); 
  }

  function setupCcyFilterUI() {
    const box = document.getElementById('cal-ccy-filter');
    if (!box) return;

    const btnStyle = active =>
      `font-size:8px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);` +
      `color:${active ? '#fff' : 'var(--text3)'};border-radius:2px;cursor:pointer;line-height:1.4;`;

    if (box.dataset.calCcyInit !== '1') {
      box.dataset.calCcyInit = '1';
      box.innerHTML =
        G10_LIST.map(ccy =>
          `<button type="button" class="cal-ccy-btn" data-ccy="${ccy}" style="${btnStyle(_ccyFilter === ccy)}">${ccy}</button>`
        ).join('') +
        `<button type="button" id="cal-ccy-all" style="${btnStyle(_ccyFilter == null)}">All</button>`;

      box.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const ccy = btn.dataset.ccy;
        if (btn.id === 'cal-ccy-all') {
          _ccyFilter = null;
        } else if (_ccyFilter === ccy) {
          _ccyFilter = null; 
        } else {
          _ccyFilter = ccy;  
        }
        saveCcyFilter(_ccyFilter);
        updateCcyFilterButtonStates();
        relayoutCalendar();
      });
    } else {
      updateCcyFilterButtonStates();
    }
  }

  function updateCcyFilterButtonStates() {
    const box = document.getElementById('cal-ccy-filter');
    if (!box) return;
    box.querySelectorAll('.cal-ccy-btn').forEach(b => {
      b.style.color = (_ccyFilter === b.dataset.ccy) ? '#fff' : 'var(--text3)';
    });
    const allBtn = document.getElementById('cal-ccy-all');
    if (allBtn) allBtn.style.color = (_ccyFilter == null) ? '#fff' : 'var(--text3)';
  }

  const IMPACT_MODE_BUTTONS = [
    { mode: 'default', label: 'Med+High', title: 'Show medium and high impact events (default)' },
    { mode: 'all',     label: 'All',      title: 'Show all events, including low impact' },
    { mode: 'high',    label: 'High only', title: 'Show only high-impact events' },
  ];

  function setupImpactFilterUI() {
    const box = document.getElementById('cal-impact-filter');
    if (!box) return;

    const btnStyle = active =>
      `font-size:8px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);` +
      `color:${active ? '#fff' : 'var(--text3)'};border-radius:2px;cursor:pointer;line-height:1.4;`;

    if (box.dataset.calImpactInit !== '1') {
      box.dataset.calImpactInit = '1';
      box.innerHTML = IMPACT_MODE_BUTTONS.map(b =>
        `<button type="button" data-impact-mode="${b.mode}" style="${btnStyle(_impactMode === b.mode)}" ` +
        `title="${b.title}">${b.label}</button>`
      ).join('');

      box.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-impact-mode]');
        if (!btn) return;
        const mode = btn.dataset.impactMode;
        if (mode === _impactMode) return;
        _impactMode = mode;
        saveImpactFilter(_impactMode);
        updateImpactFilterButtonStates();
        relayoutCalendar();
      });
    } else {
      updateImpactFilterButtonStates();
    }
  }

  function updateImpactFilterButtonStates() {
    const box = document.getElementById('cal-impact-filter');
    if (!box) return;
    box.querySelectorAll('button[data-impact-mode]').forEach(btn => {
      btn.style.color = (btn.dataset.impactMode === _impactMode) ? '#fff' : 'var(--text3)';
    });
  }

  function setupWeekNavUI() {
    const box = document.getElementById('cal-week-nav');
    if (!box) return;

    const btnStyle = () =>
      `font-size:8px;padding:1px 5px;background:var(--bg3);border:1px solid var(--border2);` +
      `color:var(--text3);border-radius:2px;cursor:pointer;line-height:1.4;`;

    if (box.dataset.calWeekInit !== '1') {
      box.dataset.calWeekInit = '1';
      box.innerHTML =
        `<button type="button" id="cal-week-prev" style="${btnStyle()}" title="Previous week" aria-label="Previous week">&#8249;</button>` +
        `<button type="button" id="cal-week-label" style="${btnStyle()}"></button>` +
        `<button type="button" id="cal-week-next" style="${btnStyle()}" title="Next week" aria-label="Next week">&#8250;</button>`;

      box.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.id === 'cal-week-prev') _calWeekOffsetDays -= 7;
        else if (btn.id === 'cal-week-next') _calWeekOffsetDays += 7;
        else if (btn.id === 'cal-week-label') _calWeekOffsetDays = 0; 
        else return;
        updateWeekNavUI();
        relayoutCalendar();
      });
    }
    updateWeekNavUI(); 
  }

  function weekNavLabel() {
    if (_calWeekOffsetDays === 0) return 'This week';
    const wk = _calWeekOffsetDays / 7;
    return wk > 0 ? `Week +${wk}` : `Week ${wk}`;
  }

  function updateWeekNavUI() {
    const label = document.getElementById('cal-week-label');
    if (!label) return;
    label.textContent = weekNavLabel();
    const atCurrent = _calWeekOffsetDays === 0;
    label.style.color  = atCurrent ? 'var(--text3)' : '#fff';
    const startISO = _calWeekStartISO(_calWeekOffsetDays);
    const endISO   = _calWeekEndISO(startISO);
    const range    = _formatWeekRange(startISO, endISO);
    label.title = atCurrent ? range : `${range} — click to return to the current week`;
  }

  async function fetchEconomicCalendar() {
    try {
      const _cb = '?_=' + Math.floor(Date.now() / 120000);
      const [ffRes, calRes] = await Promise.all([
        fetch(GI_DATA_BASE + 'calendar-data/economic-events.json' + _cb, { cache: 'no-store' }).catch(() => null),
        fetch(GI_DATA_BASE + 'calendar-data/calendar.json' + _cb, { cache: 'no-store' }).catch(() => null)
      ]);
      const ffJson  = ffRes?.ok  ? await ffRes.json().catch(() => null)  : null;
      const calJson = calRes?.ok ? await calRes.json().catch(() => null) : null;

      const normalize = ev => { if (ev.title == null && ev.event != null) ev.title = ev.event; return ev; };
      const ffEvents  = (ffJson?.events  || []).map(normalize);
      const calEvents = (calJson?.events || []).map(normalize);

      _lastFullHistory = calEvents;
      _seriesIndex     = buildSeriesIndex(calEvents);

      let events   = ffEvents.filter(ev => !((ev.title || ev.event || '').toLowerCase().includes('myfxbook')));
      let source   = ffJson?.source || 'calendar-primary';
      let holidays = Array.isArray(ffJson?.holidays) ? ffJson.holidays : [];

      const _relIdx = {};
      for (const ev of events) {
        if (ev.actual != null || ev.released) {
          const k = (ev.title || ev.event || '') + '|' + ev.currency + '|' + (ev.timeUTC || ev.hourUTC || '');
          (_relIdx[k] = _relIdx[k] || []).push(ev.dateISO);
        }
      }
      events = events.filter(ev => {
        if (ev.actual != null || ev.released) return true;
        const k = (ev.title || ev.event || '') + '|' + ev.currency + '|' + (ev.timeUTC || ev.hourUTC || '');
        const prior = _relIdx[k] || [];
        const evMs = new Date(ev.dateISO).getTime();
        return !prior.some(d => { const diff = (evMs - new Date(d).getTime()) / 86400000; return diff > 0 && diff <= 7; });
      });

      const _laterIdx = {};
      for (const ev of events) {
        const k = (ev.title || ev.event || '') + '|' + ev.currency + '|' + (ev.timeUTC || ev.hourUTC || '');
        (_laterIdx[k] = _laterIdx[k] || []).push(ev);
      }
      const _nowMs = Date.now();
      events = events.filter(ev => {
        if (ev.actual != null || ev.forecast == null) return true;
        const timeStr = ev.timeUTC || ev.hourUTC || '00:00';
        const evMs = new Date(`${ev.dateISO}T${timeStr}:00Z`).getTime();
        if (evMs >= _nowMs) return true; 
        const k = (ev.title || ev.event || '') + '|' + ev.currency + '|' + timeStr;
        const later = _laterIdx[k] || [];
        const isStale = later.some(other => {
          if (other.dateISO === ev.dateISO || other.forecast == null) return false;
          const diff = (new Date(other.dateISO).getTime() - new Date(ev.dateISO).getTime()) / 86400000;
          return diff > 0 && diff <= 7;
        });
        return !isStale;
      });

      if (calDebugLiveEnabled()) events = [getSyntheticLiveEvent(Date.now())].concat(events);

      _lastEvents = events; _lastSource = source; _lastHolidays = holidays;
      buildPanel(events, source, holidays);
    } catch {
      const c = document.getElementById('cal-events-body');
      if (c) c.innerHTML = '<div style="padding:12px 10px;color:var(--text3);font-size:11px;">Calendar unavailable.</div>';
    }
  }

  let _calFsOriginalParent = null;
  let _calFsOriginalNext   = null;

  function shouldSplitCalColumns() {
    const overlay = document.getElementById('cal-fullscreen-overlay');
    return !!(overlay && overlay.classList.contains('cal-fs-active') && window.innerWidth >= 1400);
  }

  function isCalFullscreenActive() {
    const overlay = document.getElementById('cal-fullscreen-overlay');
    return !!(overlay && overlay.classList.contains('cal-fs-active'));
  }

  function setupViewAllLinkUI() {
    const link = document.getElementById('cal-view-all-link');
    if (!link) return;
    link.setAttribute('aria-label', 'View all calendar events in fullscreen');
    link.addEventListener('click', openCalFullscreen);
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCalFullscreen(); }
    });
  }

  function buildCalColHeaderHtml() {
    return `<div class="cal-col-header">` +
      `<span>${tzLabel()}</span>` +
      `<span>Ccy</span>` +
      `<span>·</span>` +
      `<span>Event</span>` +
      `<span class="cal-th-num">Actual</span>` +
      `<span class="cal-th-num">Forecast</span>` +
      `<span class="cal-th-num">Previous</span>` +
      `</div>`;
  }

  function relayoutCalendar() {
    if (_lastEvents) buildPanel(_lastEvents, _lastSource, _lastHolidays);
  }

  function openCalFullscreen() {
    const overlay = document.getElementById('cal-fullscreen-overlay');
    const inner   = document.getElementById('cal-fullscreen-inner');
    const panel   = document.getElementById('section-tvcalendar');
    if (!overlay || !inner || !panel) return;
    if (overlay.classList.contains('cal-fs-active')) return;

    _calFsOriginalParent = panel.parentNode;
    _calFsOriginalNext   = panel.nextSibling;

    inner.appendChild(panel);
    overlay.classList.add('cal-fs-active');
    document.body.style.overflow = 'hidden';
    relayoutCalendar();
    if (typeof window._giOpenFocusTrap === 'function') window._giOpenFocusTrap(overlay);
  }

  function closeCalFullscreen() {
    const overlay = document.getElementById('cal-fullscreen-overlay');
    const panel   = document.getElementById('section-tvcalendar');
    if (!overlay || !overlay.classList.contains('cal-fs-active')) return;

    overlay.classList.remove('cal-fs-active');
    document.body.style.overflow = '';
    if (typeof window._giCloseFocusTrap === 'function') window._giCloseFocusTrap();

    if (_calFsOriginalParent && panel) {
      _calFsOriginalParent.insertBefore(panel, _calFsOriginalNext);
    }
    _calFsOriginalParent = null;
    _calFsOriginalNext   = null;
    relayoutCalendar();
  }

  let _calResizeTimer = null;
  let _calWasMobile = window.innerWidth <= 900;
  window.addEventListener('resize', function () {
    const overlay = document.getElementById('cal-fullscreen-overlay');
    if (overlay && overlay.classList.contains('cal-fs-active')) {
      clearTimeout(_calResizeTimer);
      _calResizeTimer = setTimeout(relayoutCalendar, 150);
      return;
    }
    const isMobileNow = window.innerWidth <= 900;
    if (isMobileNow !== _calWasMobile) {
      _calWasMobile = isMobileNow;
      clearTimeout(_calResizeTimer);
      _calResizeTimer = setTimeout(function () {
        if (_lastEvents) buildPanel(_lastEvents, _lastSource, _lastHolidays);
      }, 150);
    }
  });

  document.getElementById('cal-fs-btn')?.addEventListener('click', openCalFullscreen);
  document.getElementById('cal-fs-close')?.addEventListener('click', closeCalFullscreen);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('cal-fullscreen-overlay')?.classList.contains('cal-fs-active')) {
      closeCalFullscreen();
    }
  });

  setInterval(tickLiveCountdown, 20 * 1000);

  setInterval(fetchEconomicCalendar, 90 * 1000); 

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') fetchEconomicCalendar();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchEconomicCalendar);
  } else {
    fetchEconomicCalendar();
  }
})();
