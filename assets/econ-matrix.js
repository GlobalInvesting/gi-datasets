(function () {
  'use strict';

  const CCY_ORDER = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'CAD', 'NZD', 'NOK', 'SEK'];
  const FLAG = { USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', AUD: 'au', CHF: 'ch', CAD: 'ca', NZD: 'nz', NOK: 'no', SEK: 'se' };

  const COLUMNS = [
    { key: 'gdp',     label: 'GDP',       title: 'Latest GDP growth rate \u2014 QoQ where published, YoY otherwise, falling back to the freshest monthly print for GBP/CAD between quarterly releases (see subtext on each cell for the period actually shown). Note: USD\u2019s QoQ is seasonally-adjusted ANNUALIZED (SAAR) per BEA convention \u2014 tagged \u201cQoQ SAAR\u201d, not directly comparable in magnitude to the raw non-annualized QoQ shown for other currencies.' },
    { key: 'cpi',     label: 'CPI YoY',   title: 'Latest headline CPI / inflation rate, year-on-year \u2014 the primary inflation gauge central banks reference against their target when setting policy rates.' },
    { key: 'cpimom',  label: 'CPI MoM',   title: 'Latest headline CPI / inflation rate, month-on-month \u2014 can reveal a trend reversal the YoY figure masks via base effects' },
    { key: 'core',    label: 'Core CPI',  title: 'Latest core/underlying inflation, year-on-year \u2014 excludes volatile food & energy components; the measure central banks weight most heavily. AUD shows the RBA Trimmed Mean CPI, Australia\u2019s standard core-equivalent.' },
    { key: 'ppi',     label: 'PPI',       title: 'Latest producer-price inflation \u2014 YoY where published, QoQ/MoM otherwise (see subtext on each cell for the period actually shown). EUR shows Germany\u2019s national PPI as a proxy \u2014 no genuine Euro Area-aggregate PPI title exists in the current source. Blank where the currency\u2019s economy has no standalone PPI release in the current source.' },
    { key: 'emp',     label: 'Emp Chg',   title: 'Latest employment change \u2014 net jobs created, a flow/leading labor-market indicator distinct from the Unemployment Rate (a stock/lagging indicator). US shows Non-Farm Payrolls, the single most market-watched G10 print. Blank where the currency\u2019s economy has no standalone employment-change release in the current source \u2014 see column-specific per-currency notes.' },
    { key: 'unemp',   label: 'Unemp',     title: 'Latest unemployment rate \u2014 a lagging labor-market indicator central banks weigh alongside inflation when assessing how much slack remains in the economy.' },
    { key: 'prod',    label: 'Ind Prod',  title: 'Latest industrial / manufacturing production change \u2014 a real-economy activity gauge and a common input to leading-indicator composites, typically less market-moving on release day than PMI surveys.' },
    { key: 'conf',    label: 'Bus Cond',  title: 'Latest manufacturing PMI, or the economy\u2019s standard business/industrial confidence survey where no PMI is published. PMI readings are on a 0\u2013100 scale where 50 is the expansion/contraction cutoff \u2014 non-PMI substitutes (Ifo, NAB Business Confidence, Industrial Confidence, etc.) use their own survey-specific scale with no fixed 50 threshold.' },
    { key: 'rtl',     label: 'Rtl Sales', title: 'Latest retail sales change \u2014 a timely proxy for consumer spending, the largest single component of GDP in most G10 economies.' },
    { key: 'ca',      label: 'Cur Acct',  title: 'Latest current account, native reporting units \u2014 not normalized to %GDP. A persistent deficit or surplus reflects a currency\u2019s external financing needs, a slower-moving structural driver than higher-frequency flow data.' },
    { key: 'trade',   label: 'Trade Bal', title: 'Latest trade balance, native reporting units \u2014 the goods-and-services component of the current account; a narrower, higher-frequency read on external demand for a currency\u2019s exports.' },
    { key: 'pce',     label: 'PCE YoY',   title: 'Latest PCE Price Index, year-on-year \u2014 the U.S. Federal Reserve\u2019s preferred inflation gauge. US-specific; other economies target CPI/HICP-based measures shown in the CPI/Core CPI columns instead.' },
  ];

  const CCY_PFXS = {
    USD: 'united states ', GBP: 'united kingdom ', JPY: 'japan ', AUD: 'australia ',
    CAD: 'canada ', CHF: 'switzerland ', NZD: 'new zealand ', NOK: 'norway ', SEK: 'sweden ',
  };
  function normNotation(title) {
    return title
      .replace(/\bm\/m\b/g, 'MoM')
      .replace(/\by\/y\b/g, 'YoY')
      .replace(/\bq\/q\b/g, 'QoQ');
  }

  function canon(ccy, title) {
    const pfx = CCY_PFXS[ccy];
    const stripped = (pfx && title.toLowerCase().indexOf(pfx) === 0) ? title.slice(pfx.length) : title;
    return normNotation(stripped);
  }

  function strictMatch(title, prefix) {
    if (title.length < prefix.length || title.slice(0, prefix.length) !== prefix) return false;
    const rest = title.slice(prefix.length);
    return rest === '' || rest.charAt(0) === '(';
  }

  const CATS = {
    USD: {
      gdp:   ['GDP Growth Rate QoQ', 'GDP QoQ'],
      cpi:   ['Inflation Rate YoY', 'CPI YoY'],
      cpimom:['Inflation Rate MoM', 'CPI MoM'],
      core:  ['Core Inflation Rate YoY', 'Core CPI YoY'],
      ppi:   ['PPI MoM'],
      emp:   ['Non Farm Payrolls', 'Nonfarm Payrolls'],
      unemp: ['Unemployment Rate'],
      prod:  ['Industrial Production MoM', 'Fed Industrial Production MoM'],
      conf:  ['ISM Manufacturing PMI'],
      rtl:   ['Retail Sales MoM', 'Retail Sales YoY'],
      ca:    ['Current Account'],
      trade: ['Balance of Trade', 'Goods Trade Balance', 'Trade Balance'],
      pce:   ['PCE Price Index YoY'],
    },
    GBP: {
      gdp:   ['GDP Growth Rate QoQ', 'GDP MoM'],
      cpi:   ['Inflation Rate YoY', 'CPI YoY'],
      cpimom:['Inflation Rate MoM', 'CPI MoM'],
      core:  ['Core Inflation Rate YoY'],
      ppi:   ['PPI Output YoY', 'PPI Output MoM'],
      emp:   ['Employment Change', 'Employment Change 3-months'],
      unemp: ['Unemployment Rate'],
      prod:  ['Industrial Production MoM'],
      conf:  ['Flash Manufacturing PMI', 'CBI Industrial Trends Orders', 'S&P Global/CIPS Manufacturing PMI'],
      rtl:   ['Retail Sales MoM', 'Retail Sales YoY'],
      ca:    ['Current Account'],
      trade: ['Goods Trade Balance', 'Balance of Trade', 'Trade Balance'],
      pce:   [],
    },
    JPY: {
      gdp:   ['GDP Growth Rate QoQ Final', 'GDP Growth Rate QoQ Prel', 'GDP Growth Rate QoQ', 'GDP QoQ'],
      cpi:   ['Inflation Rate YoY'],
      cpimom:['Inflation Rate MoM'],
      core:  ['Core Inflation Rate YoY', 'Core CPI YoY'],
      ppi:   ['PPI YoY', 'PPI MoM'],
      emp:   ['Employment Change MoM'],
      unemp: ['Unemployment Rate'],
      prod:  ['Industrial Production MoM Prel', 'Industrial Production MoM'],
      conf:  ['Jibun Bank Manufacturing PMI', 'Tankan Large Manufacturers Index'],
      rtl:   ['Retail Sales MoM', 'Retail Sales YoY'],
      ca:    ['Current Account', 'Current Account n.s.a.'],
      trade: ['Balance of Trade', 'Trade Balance'],
      pce:   [],
    },
    AUD: {
      gdp:   ['GDP Growth Rate QoQ', 'GDP Growth Rate YoY', 'GDP QoQ', 'GDP YoY'],
      cpi:   ['Inflation Rate YoY'],
      cpimom:['Inflation Rate MoM'],
      core:  ['RBA Trimmed Mean CPI YoY', 'Quarterly RBA Trimmed Mean CPI YoY'],
      ppi:   ['PPI QoQ'], 
      emp:   ['Employment Change'],
      unemp: ['Unemployment Rate'],
      prod:  ['Ai Group Industry Index'], 
      conf:  ['NAB Business Confidence'],
      rtl:   ['Retail Sales MoM'],
      ca:    ['Current Account'], 
      trade: ['Balance of Trade', 'Trade Balance'],
      pce:   [],
    },
    CAD: {
      gdp:   ['GDP MoM', 'GDP Growth Rate Annualized', 'GDP Annualized QoQ'],
      cpi:   ['Inflation Rate YoY'],
      cpimom:['Inflation Rate MoM', 'CPI MoM'],
      core:  ['Core Inflation Rate YoY', 'Core CPI YoY'],
      ppi:   ['PPI YoY', 'PPI MoM'],
      emp:   ['Employment Change'],
      unemp: ['Unemployment Rate'],
      prod:  ['Manufacturing Sales MoM', 'Manufacturing Sales YoY'], 
      conf:  ['Ivey PMI s.a', 'S&P Global Manufacturing PMI'],
      rtl:   ['Retail Sales MoM', 'Retail Sales MoM Final', 'Retail Sales Ex Autos MoM', 'Retail Sales YoY'],
      ca:    ['Current Account'],
      trade: ['Balance of Trade', 'Trade Balance'],
      pce:   [],
    },
    CHF: {
      gdp:   ['GDP Growth Rate QoQ', 'GDP Growth Rate YoY', 'GDP QoQ', 'GDP YoY'],
      cpi:   ['Inflation Rate YoY'],
      cpimom:['Inflation Rate MoM', 'CPI MoM'],
      core:  ['Core Inflation Rate YoY'],
      ppi:   ['Producer & Import Prices YoY', 'Producer & Import Prices MoM'],
      emp:   ['Employment Change QoQ'],
      unemp: ['Unemployment Rate'],
      prod:  ['Industrial Production YoY'],
      conf:  ['procure.ch Manufacturing PMI'],
      rtl:   ['Retail Sales MoM', 'Retail Sales YoY'],
      ca:    ['Current Account'],
      trade: ['Balance of Trade', 'Trade Balance'],
      pce:   [],
    },
    NZD: {
      gdp:   ['GDP Growth Rate QoQ', 'GDP Growth Rate YoY', 'GDP QoQ', 'GDP Annual Change'],
      cpi:   ['Inflation Rate YoY', 'Inflation Rate QoQ'],
      cpimom:[], 
      core:  ['Core Inflation Rate YoY'],
      ppi:   ['PPI Output QoQ'],
      emp:   ['Employment Change QoQ'],
      unemp: ['Unemployment Rate'],
      prod:  ['Industrial Production YoY'],
      conf:  ['Business NZ PMI'],
      rtl:   ['Retail Sales QoQ', 'Retail Sales YoY'],
      ca:    ['Current Account', 'Current Account 12-Months'],
      trade: ['Balance of Trade', 'Trade Balance 12-Months'],
      pce:   [],
    },
    SEK: {
      gdp:   ['GDP Growth Rate QoQ', 'GDP QoQ'],
      cpi:   ['CPIF YoY'],
      cpimom:['CPIF MoM', 'Inflation Rate MoM', 'CPI MoM'],
      core:  ['Inflation Rate YoY', 'CPI YoY'],
      ppi:   ['PPI YoY', 'PPI MoM'], 
      rtl:   ['Retail Sales MoM', 'Retail Sales YoY'],
      emp:   ['Employment Change QoQ'],
      unemp: ['Unemployment Rate'],
      prod:  ['Industrial Production MoM', 'Industrial Production YoY'],
      conf:  ['Swedbank Manufacturing PMI'],
      ca:    ['Current Account'],
      trade: ['Balance of Trade', 'Trade Balance'],
      pce:   [],
    },
    NOK: {
      gdp:   ['GDP Growth Mainland QoQ', 'GDP Growth Rate QoQ'],
      cpi:   ['Inflation Rate YoY'],
      cpimom:['Inflation Rate MoM'],
      core:  ['Core Inflation Rate YoY'],
      ppi:   ['PPI YoY'], 
      emp:   ['Employment Change QoQ'],
      unemp: ['Unemployment Rate'],
      prod:  ['Manufacturing Production MoM'],
      conf:  ['Industrial Confidence'],
      rtl:   ['Retail Sales MoM'],
      ca:    ['Current Account'],
      trade: ['Balance of Trade', 'Trade Balance'],
      pce:   [],
    },
  };

  const CATS_EUR = {
    gdp:   ['Euro Area GDP Growth Rate QoQ', 'Euro Area GDP QoQ'],
    cpi:   ['Euro Area Inflation Rate YoY', 'Euro Area CPI YoY'],
    cpimom:['Euro Area Inflation Rate MoM', 'Euro Area CPI MoM'],
    core:  ['Euro Area Core Inflation Rate YoY', 'Euro Area Core CPI YoY'],
    ppi:   ['Germany PPI YoY', 'PPI YoY'],
    emp:   ['Euro Area Employment Change QoQ', 'Euro Area Employment Change YoY'],
    unemp: ['Euro Area Unemployment Rate'],
    prod:  ['Euro Area Industrial Production MoM'],
    conf:  ['Germany Ifo Business Climate', 'Ifo Business Climate'],
    rtl:   ['Euro Area Retail Sales MoM', 'Euro Area Retail Sales YoY'],
    ca:    ['Euro Area Current Account'],
    trade: ['Euro Area Balance of Trade', 'Euro Area Trade Balance'],
    pce:   [],
  };

  const GAP_TITLE = {
    prod: 'Not published as a standalone release in the current source for this currency',
    ca:   'Not currently tracked in the source feed for this currency',
    rtl:  'Not currently tracked in the source feed for this currency',
    core: 'No core/underlying inflation release in the current source for this currency',
    cpimom: 'No monthly headline CPI release in the current source for this currency',
    pce:  'PCE is a U.S.-specific series (the Fed\u2019s preferred inflation gauge) \u2014 not published for this economy. See the CPI / Core CPI columns for this currency\u2019s targeted measure.',
    ppi:  'No producer-price release in the current source for this currency',
  };

  const EMP_COMPUTED_CCY = new Set(['JPY']);
  const EMP_COMPUTED_NOTE = 'In-house estimate, not an officially-tracked headline release ' +
    '(unlike USD/AUD/CAD/GBP/NZD/EUR\u2019s native Employment Change-equivalent).';
  const EMP_EUROSTAT_CCY = new Set(['CHF', 'NOK', 'SEK']);
  const EMP_EUROSTAT_NOTE = 'Eurostat-compiled Employment Change (harmonized Labour Force ' +
    'Survey) \u2014 a real, published release, just a different national series than ' +
    'USD/AUD/CAD/GBP/NZD/EUR\u2019s own headline Employment Change.';
  const EMP_PROXY_CCY = new Set([...EMP_COMPUTED_CCY, ...EMP_EUROSTAT_CCY]);

  const SEK_CORE_IS_HEADLINE_NOTE = 'This is Sweden\u2019s headline CPI YoY, not an ' +
    'ex-food/ex-energy core measure \u2014 shown here instead of the more volatile CPIF ' +
    'excl. Energy series, for reliability. See CPI YoY column for CPIF, ' +
    'the Riksbank\u2019s actual target measure.';
  const SEK_MOM_IS_HEADLINE_NOTE = 'This is Sweden\u2019s headline CPI MoM, not CPIF MoM ' +
    '(the Riksbank\u2019s target measure, shown here whenever a fresher CPIF MoM print is ' +
    'available) \u2014 shown as a fallback for the most recent period covered by the current source.';

  function periodLabel(title, ccy, colKey) {
    const t = title.toLowerCase();
    if (colKey === 'gdp' && ccy === 'USD' && t.indexOf('qoq') !== -1) return 'QoQ SAAR';
    if (t.indexOf('qoq') !== -1) return 'QoQ';
    if (t.indexOf('yoy') !== -1) return 'YoY';
    if (t.indexOf('mom') !== -1) return 'MoM';
    if (t.indexOf('annualized') !== -1) return 'Annualized';
    if (t.indexOf('3-month avg') !== -1) return '3M Avg';
    return '';
  }

  function refLabel(ev) {
    const d = new Date(ev.dateISO + 'T00:00:00Z');
    if (isNaN(d)) return ev.dateISO;
    if (ev.dayPrecision === 'month') {
      return d.toLocaleDateString('en', { month: 'short', timeZone: 'UTC' });
    }
    return d.toLocaleDateString('en', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  }

  function refDateForTooltip(ev) {
    if (ev.dayPrecision === 'month') {
      const d = new Date(ev.dateISO + 'T00:00:00Z');
      if (!isNaN(d)) return d.toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    }
    return ev.dateISO;
  }

  function parseNum(s) {
    if (s == null) return null;
    const str = String(s).trim().replace(/,/g, '');
    const digitIdx = str.search(/\d/);
    if (digitIdx === -1) return null;
    const prefix = str.slice(0, digitIdx);
    const neg = prefix.indexOf('-') !== -1 || prefix.indexOf('(') !== -1;
    const m = str.slice(digitIdx).match(/\d+\.?\d*/);
    if (!m) return null;
    const v = parseFloat(m[0]);
    return neg ? -v : v;
  }

  const MX_INVERSE_KW = ['unemployment', 'unemployed', 'jobless', 'claims', 'deficit'];

  function trendClass(actual, previous, eventTitle) {
    const a = parseNum(actual), p = parseNum(previous);
    if (a == null || p == null) return '';
    const titleLower = (eventTitle || '').toLowerCase();
    const inverse = MX_INVERSE_KW.some(kw => titleLower.indexOf(kw) !== -1);
    if (a > p) return inverse ? 'down' : 'up';
    if (a < p) return inverse ? 'up' : 'down';
    return 'flat';
  }

  function findLatestGeneric(ccy, byCcy, prefixes) {
    if (!prefixes || !prefixes.length) return null;
    const list = byCcy[ccy];
    if (!list) return null;
    let bestDate = null;
    for (let i = 0; i < list.length; i++) {
      if (list[i].actual == null || list[i].actual === '') continue;
      const c = canon(ccy, list[i].event);
      for (let j = 0; j < prefixes.length; j++) {
        if (strictMatch(c, prefixes[j])) {
          if (bestDate === null || list[i].dateISO > bestDate) bestDate = list[i].dateISO;
          break;
        }
      }
    }
    if (bestDate === null) return null;
    for (let j = 0; j < prefixes.length; j++) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].dateISO === bestDate && list[i].actual != null && list[i].actual !== '' &&
            strictMatch(canon(ccy, list[i].event), prefixes[j])) {
          return list[i];
        }
      }
    }
    return null;
  }

  function findLatestEUR(byCcy, prefixes) {
    if (!prefixes || !prefixes.length) return null;
    const list = byCcy.EUR;
    if (!list) return null;
    let bestDate = null;
    for (let i = 0; i < list.length; i++) {
      if (list[i].actual == null || list[i].actual === '') continue;
      const c = normNotation(list[i].event);
      for (let j = 0; j < prefixes.length; j++) {
        if (strictMatch(c, prefixes[j])) {
          if (bestDate === null || list[i].dateISO > bestDate) bestDate = list[i].dateISO;
          break;
        }
      }
    }
    if (bestDate === null) return null;
    for (let j = 0; j < prefixes.length; j++) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].dateISO === bestDate && list[i].actual != null && list[i].actual !== '' &&
            strictMatch(normNotation(list[i].event), prefixes[j])) {
          return list[i];
        }
      }
    }
    return null;
  }

  async function loadCalendarData() {
    const res = await fetch(GI_DATA_BASE + 'calendar-data/calendar.json', { cache: 'no-store' }).catch(() => null);
    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.events)) return null;

    const byCcy = {};
    data.events.forEach(ev => {
      if (!ev || !ev.currency || !ev.dateISO || !ev.event) return;
      if (!byCcy[ev.currency]) byCcy[ev.currency] = [];
      byCcy[ev.currency].push(ev);
    });
    Object.keys(byCcy).forEach(c => byCcy[c].sort((a, b) => a.dateISO < b.dateISO ? -1 : 1));

    const out = {};
    CCY_ORDER.forEach(ccy => {
      out[ccy] = {};
      const cats = ccy === 'EUR' ? CATS_EUR : (CATS[ccy] || {});
      COLUMNS.forEach(col => {
        const prefixes = cats[col.key];
        out[ccy][col.key] = ccy === 'EUR'
          ? findLatestEUR(byCcy, prefixes)
          : findLatestGeneric(ccy, byCcy, prefixes);
      });
    });
    return { byCategory: out, lastUpdate: data.lastUpdate || null };
  }

  function fmtDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + 'T00:00:00Z' : dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  }

  async function load10y(ccy) {
    const ext = await fetch(GI_DATA_BASE + 'extended-data/' + ccy + '.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
    const v = ext && ext.data && ext.data.bond10y;
    if (v == null || isNaN(v)) return null;
    const date = (ext.dates && ext.dates.bond10y) || '';
    return { value: v, date };
  }

  function waitForCBRates(timeoutMs) {
    return new Promise(resolve => {
      const start = Date.now();
      (function poll() {
        if (window._STATE_cbRates && Object.keys(window._STATE_cbRates).length) {
          resolve(window._STATE_cbRates);
        } else if (Date.now() - start > timeoutMs) {
          resolve(window._STATE_cbRates || null);
        } else {
          setTimeout(poll, 200);
        }
      }());
    });
  }

  function simpleTrend(obs) {
    if (!obs || obs.length < 2) return 'flat';
    const a = parseFloat(obs[0].value), b = parseFloat(obs[1].value);
    if (isNaN(a) || isNaN(b)) return 'flat';
    if (a > b) return 'up';
    if (a < b) return 'down';
    return 'flat';
  }

  function waitForMeetings(timeoutMs) {
    return new Promise(resolve => {
      const start = Date.now();
      (function poll() {
        if (window._STATE_meetings && window._STATE_meetings.meetings) {
          resolve(window._STATE_meetings.meetings);
        } else if (Date.now() - start > timeoutMs) {
          resolve((window._STATE_meetings && window._STATE_meetings.meetings) || null);
        } else {
          setTimeout(poll, 200);
        }
      }());
    });
  }

  async function lastMeetingDate(ccy) {
    let meetings = await waitForMeetings(1500);
    if (!meetings) {
      const data = await fetch(GI_DATA_BASE + 'meetings-data/meetings.json').then(r => r.ok ? r.json() : null).catch(() => null);
      meetings = data && data.meetings;
    }
    const rec = meetings && meetings[ccy];
    const all = rec && rec.allMeetings;
    if (!all || !all.length) return null;
    const todayISO = new Date().toISOString().slice(0, 10);
    const past = all.filter(d => d <= todayISO);
    if (!past.length) return null;
    return past[past.length - 1]; 
  }

  async function getCBRate(ccy) {
    const store = await waitForCBRates(3000);
    const rec = store && store[ccy.toLowerCase()];
    const meetingDate = await lastMeetingDate(ccy);
    if (rec && rec.rate != null) {
      const trend = (typeof window.computeCBTrend === 'function') ? window.computeCBTrend(rec.obs) : simpleTrend(rec.obs);
      return { rate: rec.rate, date: meetingDate || rec.date, trend };
    }
    const data = await fetch(GI_DATA_BASE + 'rates/' + ccy + '.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
    const obs = data && data.observations;
    if (!obs || !obs.length) return null;
    const rate = parseFloat(obs[0].value);
    if (isNaN(rate)) return null;
    return { rate, date: meetingDate || obs[0].date, trend: simpleTrend(obs) };
  }

  function _emxEscHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function cellHTML(ev, gapKey, ccy) {
    if (!ev) {
      const title = (gapKey && GAP_TITLE[gapKey]) || 'No data available';
      return '<td class="flat" title="' + _emxEscHtml(title) + '">\u2014</td>';
    }
    const cls = trendClass(ev.actual, ev.previous, ev.event);
    const period = periodLabel(ev.event, ccy, gapKey);
    const ref = refLabel(ev);
    const sub = (period ? period + ' \u00b7 ' : '') + ref;
    const isEmpProxy = gapKey === 'emp' && EMP_PROXY_CCY.has(ccy);
    const isSekCoreHeadline = gapKey === 'core' && ccy === 'SEK';
    const isSekMomHeadline = gapKey === 'cpimom' && ccy === 'SEK' && !/CPIF/i.test(ev.event);
    let title = ev.event + ' \u00b7 ' + refDateForTooltip(ev) + (ev.previous != null ? ' \u00b7 prev ' + ev.previous : '');
    if (gapKey === 'emp' && EMP_COMPUTED_CCY.has(ccy)) title += ' \u00b7 ' + EMP_COMPUTED_NOTE;
    else if (gapKey === 'emp' && EMP_EUROSTAT_CCY.has(ccy)) title += ' \u00b7 ' + EMP_EUROSTAT_NOTE;
    else if (isSekCoreHeadline) title += ' \u00b7 ' + SEK_CORE_IS_HEADLINE_NOTE;
    else if (isSekMomHeadline) title += ' \u00b7 ' + SEK_MOM_IS_HEADLINE_NOTE;
    const marker = (isEmpProxy || isSekCoreHeadline || isSekMomHeadline)
      ? '<sup style="color:var(--text3);font-size:8px;margin-left:2px;">\u2020</sup>'
      : '';
    return '<td' + (cls ? ' class="' + cls + '"' : '') + ' title="' + _emxEscHtml(title) + '">' +
      '<div class="econmx-val">' + (ev.actual != null ? _emxEscHtml(ev.actual) : '\u2014') + marker + '</div>' +
      '<div class="econmx-ref">' + _emxEscHtml(sub) + '</div>' +
      '</td>';
  }

  function rowHTML(ccy, calRow, y10, cb) {
    const flag = FLAG[ccy] ? '<span class="fi fi-' + FLAG[ccy] + '" style="margin-right:5px;border-radius:2px;"></span>' : '';
    let html = '<tr><td style="white-space:nowrap;">' + flag + '<span style="font-size:10px;">' + ccy + '</span></td>';
    COLUMNS.forEach(col => {
      html += cellHTML(calRow[col.key], col.key, ccy);
    });
    if (y10) {
      const y10ref = fmtDateShort(y10.date);
      const y10sub = y10ref || '\u2014';
      html += '<td class="flat" title="10Y \u00b7 as of ' + (y10.date || '\u2014') + '">' +
        '<div class="econmx-val">' + y10.value.toFixed(2) + '%</div>' +
        '<div class="econmx-ref">' + y10sub + '</div>' +
        '</td>';
    } else {
      html += '<td class="flat" title="No data available">\u2014</td>';
    }
    if (cb) {
      const cls = cb.trend === 'up' ? 'up' : cb.trend === 'down' ? 'down' : 'flat';
      const cbref = fmtDateShort(cb.date);
      const cbsub = cbref || '\u2014';
      html += '<td class="' + cls + '" title="CB policy rate \u00b7 as of ' + (cb.date || '\u2014') + '">' +
        '<div class="econmx-val">' + cb.rate.toFixed(2) + '%</div>' +
        '<div class="econmx-ref">' + cbsub + '</div>' +
        '</td>';
    } else {
      html += '<td class="flat" title="No data available">\u2014</td>';
    }
    html += '</tr>';
    return html;
  }

  const ECONMX_POLL_MS = 90 * 1000; 

  const EXTRA_HEADER_TITLES = {
    ccy:     'G10 currency (ISO code) covered by this matrix.',
    bond10y: 'Latest 10-year government bond yield \u2014 the benchmark long-end rate used in cross-currency rate-differential and carry-trade comparisons.',
    cbrate:  'Current central bank policy rate \u2014 the anchor for short-term rate differentials and a primary input to carry-trade positioning across G10 FX.',
  };

  function applyHeaderTooltips() {
    const table = document.querySelector('.econmx-table');
    const ths = table ? table.querySelectorAll('thead th') : null;
    if (!ths || !ths.length) return;
    if (ths[0]) ths[0].title = EXTRA_HEADER_TITLES.ccy;
    COLUMNS.forEach((col, i) => {
      const th = ths[i + 1];
      if (th && col.title) th.title = col.title;
    });
    const y10Th = ths[1 + COLUMNS.length];
    const cbTh  = ths[2 + COLUMNS.length];
    if (y10Th) y10Th.title = EXTRA_HEADER_TITLES.bond10y;
    if (cbTh)  cbTh.title  = EXTRA_HEADER_TITLES.cbrate;
  }

  let _loading = false;
  let _y10Cache = null;
  let _cbCache  = null;

  function renderMatrix(cal, y10All, cbAll) {
    const tbody = document.getElementById('econmx-tbody');
    const sub   = document.getElementById('econmx-sub');
    if (!cal) {
      if (sub) sub.textContent = 'Economic Calendar \u00b7 data unavailable';
      return;
    }

    const rows = CCY_ORDER.map((ccy, i) => rowHTML(ccy, cal.byCategory[ccy] || {}, y10All[i], cbAll[i]));
    if (tbody) tbody.innerHTML = rows.join('');

    if (sub) {
      let label = 'Economic Calendar \u00b7 latest actuals \u00b7 G10';
      if (cal.lastUpdate) {
        const d = new Date(cal.lastUpdate);
        if (!isNaN(d)) label += ' \u00b7 updated ' + d.toLocaleDateString('en', { day: '2-digit', month: 'short' });
      }
      sub.textContent = label;
    }
  }

  async function loadEconMatrix() {
    if (_loading) return;
    _loading = true;
    const sub = document.getElementById('econmx-sub');
    try {
      const [cal, y10All, cbAll] = await Promise.all([
        loadCalendarData(),
        Promise.all(CCY_ORDER.map(load10y)),
        Promise.all(CCY_ORDER.map(getCBRate)),
      ]);
      _y10Cache = y10All;
      _cbCache  = cbAll;
      renderMatrix(cal, y10All, cbAll);
    } catch (e) {
      if (sub) sub.textContent = 'Economic Calendar \u00b7 data unavailable';
    } finally {
      _loading = false;
    }
  }

  async function refreshPanel() {
    if (_loading || !_y10Cache || !_cbCache) return;
    _loading = true;
    try {
      const [cal, y10All, cbAll] = await Promise.all([
        loadCalendarData(),
        Promise.all(CCY_ORDER.map(load10y)),
        Promise.all(CCY_ORDER.map(getCBRate)),
      ]);
      if (y10All.some(v => v != null)) _y10Cache = y10All;
      if (cbAll.some(v => v != null)) _cbCache = cbAll;
      if (cal) renderMatrix(cal, _y10Cache, _cbCache);
    } catch (e) {
    } finally {
      _loading = false;
    }
  }

  function attach() {
    const section = document.getElementById('section-econmap');
    if (!section) return;

    applyHeaderTooltips(); 

    function start() {
      loadEconMatrix();
      setInterval(refreshPanel, ECONMX_POLL_MS);
    }

    if (typeof IntersectionObserver === 'undefined') {
      start();
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          start();
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '150px' });
    io.observe(section);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
}());
