
(function () {
  if (document.getElementById('rcm-modal2-css')) return;

  const s = document.createElement('style');
  s.id = 'rcm-modal2-css';
  s.textContent = `

@keyframes rcm-fi{from{opacity:0}to{opacity:1}}
@keyframes rcm-su{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}

#rcm-bd{position:fixed!important;inset:0!important;z-index:9200;display:flex!important;flex-direction:column;overflow:hidden;background:var(--bg);}

#rcm-modal{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;border-radius:0!important;border:none!important;box-shadow:none!important;animation:none!important;background:var(--bg)!important;position:static!important;font-family:var(--font-ui,'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif);color:var(--text);display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;font-size:11px;flex:1;}
#rcm-modal::before{display:none;}


#rcm-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 14px 9px;border-bottom:1px solid var(--border,#252d3d);flex-shrink:0;background:var(--bg2);}
#rcm-hd-left{display:flex;align-items:center;gap:10px;}
#rcm-hd-text{display:flex;flex-direction:column;gap:1px;}
.rcm-badge{font-size:8px;font-weight:700;letter-spacing:.10em;color:var(--blue,#4d7cfe);text-transform:uppercase;display:flex;align-items:center;gap:4px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-badge::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--blue,#4d7cfe);flex-shrink:0;}
#rcm-title{font-size:14px;font-weight:600;color:var(--text);letter-spacing:-.01em;line-height:1.2;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
#rcm-sub{font-size:10px;color:var(--text2);letter-spacing:.02em;margin-top:2px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}
#rcm-close{background:none;border:none;color:var(--text3,#4e5c70);font-size:16px;cursor:pointer;padding:3px 6px;border-radius:3px;line-height:1;transition:color .1s,background .1s;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
#rcm-close:hover{color:var(--text);background:var(--bg3);}


#rcm-metrics{display:grid;grid-template-columns:repeat(5,1fr);border-bottom:1px solid var(--border,#252d3d);flex-shrink:0;}
.rcm-mm{padding:8px 12px;border-right:1px solid var(--border,#252d3d);display:flex;flex-direction:column;}
.rcm-mm:last-child{border-right:none;}
.rcm-mm-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:3px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}
.rcm-mm-val{font-size:13px;font-weight:600;line-height:1;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}
.rcm-mm-sub{font-size:9px;color:var(--text2);margin-top:2px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}


#rcm-tabs{display:flex;background:var(--bg2);border-bottom:1px solid var(--border,#252d3d);flex-shrink:0;padding:0 14px;overflow-x:auto;scrollbar-width:none;}
#rcm-tabs::-webkit-scrollbar{display:none;}
.rcm-tab{font-size:11px;font-weight:400;padding:9px 13px;cursor:pointer;color:var(--text2);border-bottom:2px solid transparent;transition:color .1s;white-space:nowrap;user-select:none;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-tab:hover{color:var(--text2);}
.rcm-tab.on{color:var(--text);border-bottom-color:var(--blue,#4d7cfe);}


#rcm-body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;background:var(--bg);scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;}
#rcm-body::-webkit-scrollbar{width:3px!important;}
#rcm-body::-webkit-scrollbar-track{background:transparent;}
#rcm-body::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
#rcm-body::-webkit-scrollbar-thumb:hover{background:var(--text2);}
.rcm-panel{display:none;}
.rcm-panel.on{display:flex;flex:1;flex-direction:column;min-height:0;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;}
.rcm-panel.on::-webkit-scrollbar{width:3px!important;}
.rcm-panel.on::-webkit-scrollbar-track{background:transparent;}
.rcm-panel.on::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
.rcm-panel.on::-webkit-scrollbar-thumb:hover{background:var(--text2);}


.rcm-cw{background:var(--bg);border:none;border-radius:0;padding:0;margin-bottom:0;flex:1;display:flex;flex-direction:column;overflow:auto;min-width:0;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;}
.rcm-cw::-webkit-scrollbar{width:3px!important;}
.rcm-cw::-webkit-scrollbar-track{background:transparent;}
.rcm-cw::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
.rcm-cw::-webkit-scrollbar-thumb:hover{background:var(--text2);}
.rcm-ct{display:none;}


.rcm-tbl{width:100%;border-collapse:collapse;}
.rcm-tbl thead th{font-size:8.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--text3,#4e5c70);font-weight:600;padding:7px 14px;text-align:right;border-bottom:1px solid var(--border,#252d3d);background:var(--bg2);font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-tbl thead th:first-child{text-align:left;}
.rcm-tbl tbody td{padding:8px 14px;font-size:11px;text-align:right;border-bottom:1px solid var(--border,#252d3d);color:var(--text);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}
.rcm-tbl tbody td:first-child{text-align:left;color:var(--text);font-weight:700;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-tbl tbody td.rcm-td-cb{color:var(--text2);font-size:9px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);font-weight:400;}
.rcm-tbl tbody tr:hover td{background:rgba(77,124,254,.04);}
.rcm-tbl tbody tr:last-child td{border-bottom:none;}



.rcm-tbl tbody td.rr-pos2,.rr-pos2{color:var(--up,#26a69a)!important;font-weight:700;}
.rcm-tbl tbody td.rr-pos1,.rr-pos1{color:var(--up,#26a69a)!important;}
.rcm-tbl tbody td.rr-neg1,.rr-neg1{color:var(--down,#ef5350)!important;}
.rcm-tbl tbody td.rr-neg2,.rr-neg2{color:var(--down,#ef5350)!important;font-weight:700;}
.rr-flat{color:var(--text2);}


.rcm-bias{display:inline-flex;align-items:center;gap:3px;font-size:9px;font-weight:700;padding:2px 8px;border-radius:2px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-bias-hike{background:rgba(38,166,154,.15);color:var(--up,#26a69a);border:1px solid rgba(38,166,154,.30);}
.rcm-bias-cut{background:rgba(239,83,80,.12);color:var(--down,#ef5350);border:1px solid rgba(239,83,80,.25);}
.rcm-bias-hold{background:rgba(122,135,153,.10);color:var(--text2);border:1px solid rgba(122,135,153,.20);}


.rcm-pd-header{padding:10px 14px 9px;background:var(--bg2);border-bottom:1px solid var(--border,#252d3d);font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3,#4e5c70);display:flex;align-items:center;gap:6px;flex-shrink:0;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-pd-pair{color:var(--text);font-size:10px;font-weight:700;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-pd-dir{color:var(--text3,#4e5c70);}

.rcm-pd-row-grid{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--border,#252d3d);}
.rcm-pd-cell{padding:10px 14px;border-right:1px solid var(--border,#252d3d);}
.rcm-pd-cell:last-child{border-right:none;}
.rcm-pd-cell-lbl{font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3,#4e5c70);margin-bottom:4px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-pd-cell-val{font-size:20px;font-weight:700;line-height:1;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}
.rcm-pd-cell-sub{font-size:9px;color:var(--text2);margin-top:3px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}


.rcm-rate-bars{padding:10px 14px;border-bottom:1px solid var(--border,#252d3d);}
.rcm-rb-title{font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3,#4e5c70);margin-bottom:8px;}
.rcm-rb-row{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
.rcm-rb-label{font-size:10px;color:var(--text2);width:36px;flex-shrink:0;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}
.rcm-rb-track{flex:1;height:4px;background:var(--bg3,#1e2433);border-radius:0;position:relative;}
.rcm-rb-zero{position:absolute;top:-3px;bottom:-3px;width:1px;background:var(--border2,#2e3a50);}
.rcm-rb-fill{height:100%;border-radius:0;position:absolute;top:0;}
.rcm-rb-val{font-size:10px;font-weight:700;width:36px;text-align:right;flex-shrink:0;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}


.rcm-vol-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--border,#252d3d);}
.rcm-vol-cell{padding:8px 14px;border-right:1px solid var(--border,#252d3d);}
.rcm-vol-cell:last-child{border-right:none;}
.rcm-vol-lbl{font-size:8px;text-transform:uppercase;letter-spacing:.07em;color:var(--text3,#4e5c70);margin-bottom:3px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-vol-val{font-size:14px;font-weight:700;color:var(--text);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);}
.rcm-vol-sub{font-size:8px;color:var(--text2);margin-top:2px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}

.rcm-ois-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--border,#252d3d);}
.rcm-ois-cell{padding:8px 14px;border-right:1px solid var(--border,#252d3d);}
.rcm-ois-cell:last-child{border-right:none;}
.rcm-ois-lbl{font-size:8px;text-transform:uppercase;letter-spacing:.07em;color:var(--text3,#4e5c70);margin-bottom:4px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-ois-sub{font-size:8px;color:var(--text3,#4e5c70);margin-top:3px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}


.rcm-sustain{padding:8px 14px;border-bottom:1px solid var(--border,#252d3d);display:flex;align-items:flex-start;gap:8px;}
.rcm-sustain-icon{width:3px;flex-shrink:0;align-self:stretch;border-radius:2px;}
.rcm-sustain-ok   .rcm-sustain-icon{background:var(--up,#26a69a);}
.rcm-sustain-warn .rcm-sustain-icon{background:var(--orange,#f59e0b);}
.rcm-sustain-bad  .rcm-sustain-icon{background:var(--down,#ef5350);}
.rcm-sustain-body{font-size:9.5px;color:var(--text2);line-height:1.55;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-sustain-body strong{color:var(--text);font-weight:700;}


.rcm-src-note{padding:8px 14px;font-size:10px;color:var(--text3,#4e5c70);line-height:1.6;border-top:1px solid var(--border,#252d3d);font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}


#rcm-matrix-wrap{overflow:auto;padding:14px;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;width:100%;min-width:0;box-sizing:border-box;}
#rcm-matrix-wrap::-webkit-scrollbar{width:4px;height:4px;}
#rcm-matrix-wrap::-webkit-scrollbar-track{background:transparent;}
#rcm-matrix-wrap::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
.rcm-matrix{border-collapse:collapse;font-size:10px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);table-layout:fixed;width:100%;}
.rcm-matrix th{font-weight:600;letter-spacing:.04em;padding:5px 0;color:var(--text2);text-align:center;white-space:nowrap;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);font-size:9px;}
.rcm-matrix td{height:36px;text-align:center;vertical-align:middle;font-weight:700;font-size:10.5px;border:1px solid var(--border,#252d3d);overflow:hidden;white-space:nowrap;}
.rcm-matrix td:hover{filter:brightness(1.28);cursor:default;}
.rcm-matrix td.row-head{text-align:left;color:var(--text3,#4e5c70);font-weight:700;padding:0 8px 0 8px;white-space:nowrap;width:52px;background:var(--bg2);border:none;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);font-size:9px;letter-spacing:.04em;}
.rcm-matrix td.diag{background:var(--bg2);color:var(--text2);font-size:10.5px;font-weight:600;}

.rcm-cell-pos-hi{background:rgba(38,166,154,.26);color:var(--up,#26a69a);}
.rcm-cell-pos{background:rgba(38,166,154,.12);color:var(--up,#26a69a);}
.rcm-cell-neg-hi{background:rgba(239,83,80,.26);color:var(--down,#ef5350);}
.rcm-cell-neg{background:rgba(239,83,80,.12);color:var(--down,#ef5350);}
.rcm-cell-flat{background:rgba(122,135,153,.07);color:var(--text3,#4e5c70);}

.rcm-matrix-legend{margin-top:10px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
.rcm-matrix-legend span{font-size:10px;display:flex;align-items:center;gap:4px;color:var(--text2);font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.rcm-legend-sw{width:10px;height:10px;display:inline-block;flex-shrink:0;}


.rcm-loading{display:flex;align-items:center;justify-content:center;flex:1;color:var(--text2);font-size:11px;letter-spacing:.06em;padding:40px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}


.rcm-pd-wrap{width:100%;box-sizing:border-box;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;}
.rcm-pd-wrap::-webkit-scrollbar{width:3px!important;}
.rcm-pd-wrap::-webkit-scrollbar-track{background:transparent;}
.rcm-pd-wrap::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
.rcm-pd-wrap::-webkit-scrollbar-thumb:hover{background:var(--text2);}


.rcm-pd-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;}
.rcm-pd-kv{display:flex;flex-direction:column;gap:3px;}


@media(max-width:900px){
  .rcm-pd-row-grid{grid-template-columns:1fr 1fr;}
  .rcm-vol-row{grid-template-columns:1fr 1fr;}
  
  .rcm-matrix{font-size:9.5px;}
  .rcm-matrix td{height:32px;font-size:9.5px;}
  .rcm-matrix td.diag{font-size:9.5px;}
  #rcm-matrix-wrap{padding:10px;}
}
@media(max-width:640px){
  #rcm-metrics{grid-template-columns:repeat(3,1fr);}
  .rcm-mm-val{font-size:14px;}
  .rcm-pd-row-grid{grid-template-columns:1fr 1fr;}
  .rcm-pd-cell-val{font-size:16px;}
  .rcm-vol-row{grid-template-columns:1fr 1fr;}
  .rcm-ois-row{grid-template-columns:1fr 1fr;}
  .rcm-rate-bars{padding:8px 10px;}
  .rcm-pd-header{padding:8px 10px;}
  .rcm-pd-cell{padding:8px 10px;}
  .rcm-vol-cell{padding:6px 10px;}
  .rcm-ois-cell{padding:6px 10px;}
  
  .rcm-matrix{font-size:9px;}
  .rcm-matrix td{height:28px;font-size:9px;}
  .rcm-matrix td.diag{font-size:9px;}
  .rcm-matrix th{font-size:8px;}
  .rcm-matrix td.row-head{font-size:8px;}
  
  #rcm-body{scrollbar-width:none;}
  #rcm-body::-webkit-scrollbar{display:none!important;}
}
@media(max-width:420px){
  .rcm-pd-row-grid{grid-template-columns:1fr;}
  .rcm-vol-row{grid-template-columns:1fr;}
  .rcm-ois-row{grid-template-columns:1fr;}
  #rcm-metrics{grid-template-columns:repeat(2,1fr);}
  .rcm-pd-cell:last-child{border-right:none;border-bottom:none;}
  .rcm-vol-cell{border-bottom:1px solid var(--border,#252d3d);}
}
`;
  document.head.appendChild(s);
})();

const _RCM_G8 = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'NOK', 'SEK'];
const _RCM_CB = { USD: 'Fed', EUR: 'ECB', GBP: 'BoE', JPY: 'BoJ', AUD: 'RBA', CAD: 'BoC', CHF: 'SNB', NZD: 'RBNZ', NOK: 'NB', SEK: 'Riksbank' };
const _RCM_FLAG = { USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', AUD: 'au', CAD: 'ca', CHF: 'ch', NZD: 'nz', NOK: 'no', SEK: 'se' };

const _RCM_IE_SRC = {
  USD: 'FRED T5YIE · 5Y TIPS breakeven',
  EUR: 'FRED T5YIFR · EUR 5Y5Y swap',
  GBP: 'BOE SDIE BEAPFF · 2Y-ahead survey',
  JPY: 'CPI YoY · IMF SDMX',
  AUD: 'CPI YoY · IMF SDMX',
  CAD: 'FRED CAINFIMPCPI · 5Y breakeven',
  CHF: 'CPI YoY · IMF SDMX',
  NZD: 'RBNZ survey · 2Y-ahead',
  NOK: 'Norges Bank Expectations Survey · 2Y-ahead',
  SEK: 'SCB CPIF YoY · Statistics Sweden (Riksbank target)',
};

function _rcmClassifyIESource(source) {
  if (!source) return { kind: 'unknown', tag: '', title: 'Source unknown' };
  const s = source.toLowerCase();
  if (s.includes('breakeven')) {
    return { kind: 'breakeven', tag: 'FWD', title: `Market-implied forward breakeven — ${source}` };
  }
  if (s.includes('survey')) {
    return { kind: 'survey', tag: 'FWD', title: `Forward-looking survey — ${source}` };
  }
  return { kind: 'cpi', tag: 'CPI', title: `Realized CPI YoY (backward-looking proxy) — ${source}` };
}

let _rcmData = null;           
let _rcmFetchPromise = null;   
let _rcmFetchedAt = 0;         
const _RCM_TTL = 15 * 60 * 1000; 
let _rcmActiveTab = 'breakdown';
let _rcmActivePair = null;



async function _rcmFetchData() {
  if (_rcmFetchPromise) return _rcmFetchPromise;

  _rcmFetchPromise = (async () => {
    try {
      const extKeys = _RCM_G8; 
      const [rateResults, extResults, meetingsRes, quotesRes, oisRes] = await Promise.all([
        Promise.all(_RCM_G8.map(ccy =>
          fetch(`${GI_DATA_BASE}rates/${ccy}.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
        )),
        Promise.all(extKeys.map(ccy =>
          fetch(`${GI_DATA_BASE}extended-data/${ccy}.json`).then(r => r.ok ? r.json() : null).catch(() => null)
        )),
        fetch(GI_DATA_BASE + 'meetings-data/meetings.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(GI_DATA_BASE + 'intraday-data/quotes.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(GI_DATA_BASE + 'ois-rates/rates.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      const oisRates   = oisRes?.rates   || {};   
      const oisSources = oisRes?.sources  || {};   
      const oisDates   = oisRes?.dates    || {};   
      const nominalRates = {};
      _RCM_G8.forEach((ccy, i) => {
        const ois = oisRates[ccy];
        if (ois != null) {
          nominalRates[ccy] = {
            rate:   ois,
            date:   oisDates[ccy] || null,
            source: oisSources[ccy] || 'OIS',
            isOIS:  true,
          };
        } else {
          const d = rateResults[i];
          if (d?.observations?.[0]?.value != null) {
            nominalRates[ccy] = {
              rate:   parseFloat(d.observations[0].value),
              date:   d.observations[0].date,
              source: 'policy',
              isOIS:  false,
            };
          }
        }
      });

      const inflExp = {};
      extKeys.forEach((ccy, i) => {
        const d = extResults[i];
        const ie = d?.data?.inflationExpectations;
        const ieDate = d?.dates?.inflationExpectations;
        const ieSrc = d?.data?.inflationExpectationsSource || null;
        if (ie != null) {
          inflExp[ccy] = { val: ie, date: ieDate || null, source: ieSrc };
        }
      });

      const biasMap = {};
      if (meetingsRes?.meetings) {
        for (const [ccy, m] of Object.entries(meetingsRes.meetings)) {
          biasMap[ccy] = {
            bias: m.bias || 'hold',
            hikeProb: m.hikeProb ?? null,
            cutProb: m.cutProb ?? null,
            method: m.biasMethod || '',
          };
        }
      }

      const hv30Map = {};
      if (quotesRes?.hv30) Object.assign(hv30Map, quotesRes.hv30);

      const realRates = {};
      for (const ccy of _RCM_G8) {
        const nom = nominalRates[ccy]?.rate;
        const ie  = inflExp[ccy]?.val;
        realRates[ccy] = (nom != null && ie != null) ? parseFloat((nom - ie).toFixed(3)) : null;
      }

      _rcmData = { nominalRates, inflExp, biasMap, hv30Map, realRates };
      _rcmFetchedAt = Date.now();


    } finally {
      _rcmFetchPromise = null; 
    }
  })();

  return _rcmFetchPromise;
}

function _rcmRrClass(rr) {
  if (rr == null) return 'rr-flat';
  if (rr >= 1.0)  return 'rr-pos2';
  if (rr >= 0.0)  return 'rr-pos1';
  if (rr >= -1.0) return 'rr-neg1';
  return 'rr-neg2';
}

function _rcmRrFmt(rr) {
  if (rr == null) return '—';
  return (rr >= 0 ? '+' : '') + rr.toFixed(2) + '%';
}

function _rcmBiasChip(biasObj) {
  if (!biasObj) return '<span class="rcm-bias rcm-bias-hold">Hold</span>';
  const { bias, hikeProb, cutProb } = biasObj;
  let pct = '';
  if (bias === 'hike' && hikeProb != null && hikeProb > 0) pct = ` ${hikeProb}%`;
  if (bias === 'cut'  && cutProb  != null && cutProb  > 0) pct = ` ${cutProb}%`;
  const label = bias === 'hike' ? 'Hike' : bias === 'cut' ? 'Cut' : 'Hold';
  const cls   = bias === 'hike' ? 'rcm-bias-hike' : bias === 'cut' ? 'rcm-bias-cut' : 'rcm-bias-hold';
  return `<span class="rcm-bias ${cls}">${label}${pct}</span>`;
}

function _rcmDateAge(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const days = Math.round((Date.now() - d) / 86400000);
    if (days < 2)  return 'today';
    if (days < 7)  return `${days}d ago`;
    if (days < 60) return `${Math.round(days / 7)}w ago`;
    return `${Math.round(days / 30)}mo ago`;
  } catch { return ''; }
}

function _rcmRenderBreakdown() {
  const d = _rcmData;
  if (!d) return '<div class="rcm-loading">Loading...</div>';

  const sorted = [..._RCM_G8].sort((a, b) => {
    const ra = d.realRates[a] ?? -99;
    const rb = d.realRates[b] ?? -99;
    return rb - ra;
  });

  const rows = sorted.map((ccy, idx) => {
    const nomEntry = d.nominalRates[ccy];
    const nom  = nomEntry?.rate;
    const ie   = d.inflExp[ccy];
    const rr   = d.realRates[ccy];
    const bias = d.biasMap[ccy];
    const rrCls = _rcmRrClass(rr);
    const nomFmt = nom != null ? nom.toFixed(2) + '%' : '—';
    const ieFmt  = ie  ? ie.val.toFixed(2) + '%' : '—';
    const rrFmt  = _rcmRrFmt(rr);
    const ieClass = _rcmClassifyIESource(ie?.source);
    const ieBadge = ie != null && ieClass.tag
      ? `<span style="font-size:8px;color:${ieClass.kind === 'cpi' ? 'var(--text3)' : 'var(--accent,#26a69a)'};margin-left:3px;vertical-align:super;" title="${ieClass.title}">${ieClass.tag}</span>`
      : '';
    const srcTitle = `${ie?.source || _RCM_IE_SRC[ccy] || ''}${ie?.date ? ' · ' + ie.date : ''}`;

    const nomSrc    = nomEntry?.source || 'policy';
    const nomIsOIS  = nomEntry?.isOIS === true;
    const nomSrcTag = nom != null
      ? `<span style="font-size:8px;color:${nomIsOIS ? 'var(--accent,#26a69a)' : 'var(--text3)'};margin-left:3px;vertical-align:super;">${nomSrc}</span>`
      : '';
    const nomTitle  = nom != null
      ? `${nomIsOIS ? nomSrc + ' overnight benchmark' : 'CB policy rate (OIS unavailable)'}${nomEntry?.date ? ' · ' + nomEntry.date : ''}`
      : '';

    const firstTdBorder = idx === 0
      ? 'border-left:3px solid var(--up,#26a69a);'
      : (idx === sorted.length - 1 ? 'border-left:3px solid var(--down,#ef5350);' : 'border-left:3px solid transparent;');
    return `<tr title="${ccy} — Real rate = ${nomFmt} nominal (${nomSrc}) − ${ieFmt} infl.exp = ${rrFmt}">
      <td style="color:var(--text3);font-size:9px;text-align:center;width:20px;padding:8px 4px 8px 11px;${firstTdBorder}">${idx + 1}</td>
      <td style="text-align:left;">
        <span class="fi fi-${_RCM_FLAG[ccy]}" style="margin-right:6px;border-radius:2px;font-size:14px;vertical-align:middle;flex-shrink:0;"></span><span style="font-weight:700;color:var(--text);">${_RCM_CB[ccy]}</span>
        <span style="color:var(--text3);font-size:9px;margin-left:4px;">${ccy}</span>
      </td>
      <td title="${nomTitle}">${nomFmt}${nomSrcTag}</td>
      <td title="${srcTitle}">${ieFmt}${ieBadge}</td>
      <td class="${rrCls}" style="font-weight:700;">${rrFmt}</td>
      <td style="text-align:right;">${_rcmBiasChip(bias)}</td>
    </tr>`;
  }).join('');

  const policyFallbacks = _RCM_G8.filter(c => d.nominalRates[c]?.isOIS === false);
  const fallbackNote = policyFallbacks.length
    ? ` ${policyFallbacks.join('/')} nominal: CB policy rate (OIS data unavailable).`
    : '';
  const cpiProxyCcys = _RCM_G8.filter(c => _rcmClassifyIESource(d.inflExp[c]?.source).kind === 'cpi');
  const proxyNote = cpiProxyCcys.length
    ? ` This run: ${cpiProxyCcys.join('/')} resolved to realized CPI YoY (backward-looking proxy) rather than a forward breakeven/survey — hover a row's Infl. Exp. cell (or its FWD/CPI badge) for the exact source used.`
    : ' This run: all currencies resolved to a forward-looking market breakeven or survey.';
  const liveNote = 'Nominal rate: OIS overnight benchmark (SOFR/€STR/SONIA/TONA/AONIA/CORRA/SARON/OCR) — institutional overnight rate standard.' + fallbackNote + ' ' +
    'Infl. Exp. methodology: market-implied breakeven where liquid (USD/EUR/CAD), forward-looking survey where published (GBP/AUD/CHF/SEK/JPY/NZD), falling back to realized CPI YoY (IMF SDMX → OECD → FRED index → World Bank, in that order) elsewhere or whenever the primary source is unavailable.' + proxyNote + ' ' +
    'Real rate = Nominal OIS − Inflation Expectation. OIS Bias reflects forward market consensus at next CB meeting. ' +
    'Note: real carry ≠ CIP — no FX forward adjustment applied. Nominal tenor (overnight) and inflation-expectation tenor (0–5Y depending on which source resolved) are not matched — a precision caveat on the real-rate figure, not a data error.';

  return `<div class="rcm-cw" style="flex:1;min-height:0;overflow:auto;">
    <table class="rcm-tbl" aria-label="Real rate carry ranking by currency">
      <thead>
        <tr>
          <th scope="col" style="text-align:center;width:20px;padding:7px 4px 7px 11px;border-left:3px solid transparent;">#</th>
          <th scope="col" style="text-align:left;">Central Bank</th>
          <th scope="col" title="OIS overnight benchmark (SOFR/€STR/SONIA/TONA/AONIA/CORRA/SARON/OCR) — institutional overnight benchmarks. Falls back to CB policy rate when OIS unavailable." style="cursor:help;">Nominal <span style="font-size:8px;color:var(--accent,#26a69a);vertical-align:super;">OIS</span></th>
          <th scope="col">Infl. Exp.</th>
          <th scope="col">Real Rate</th>
          <th scope="col">OIS Bias</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rcm-src-note">${liveNote}</div>
  </div>`;
}

function _rcmRenderMatrix() {
  const d = _rcmData;
  if (!d) return '<div class="rcm-loading">Loading...</div>';

  const G8_CURRENCIES = _RCM_G8;

  function cellClass(diff) {
    if (diff == null) return 'rcm-cell-flat';
    if (diff >= 1.5)   return 'rcm-cell-pos-hi';
    if (diff >= 0.10)  return 'rcm-cell-pos';
    if (diff <= -1.5)  return 'rcm-cell-neg-hi';
    if (diff <= -0.10) return 'rcm-cell-neg';
    return 'rcm-cell-flat';
  }

  function cellFmt(diff) {
    if (diff == null) return '—';
    if (Math.abs(diff) < 0.005) return '0';
    return (diff > 0 ? '+' : '') + diff.toFixed(2) + '%';
  }

  const header = `<tr>
    <td class="row-head" style="font-size:8.5px;font-family:var(--font-ui,'Inter',sans-serif);padding:0 8px 0 8px;">L↓/S→</td>
    ${G8_CURRENCIES.map(c => `<th scope="col">${c}</th>`).join('')}
  </tr>`;

  const rows = G8_CURRENCIES.map(rowCcy => {
    const rrRow = d.realRates[rowCcy];
    const cells = G8_CURRENCIES.map(colCcy => {
      if (rowCcy === colCcy) {
        const rr = d.realRates[rowCcy];
        const fmt = rr != null ? (rr >= 0 ? '+' : '') + rr.toFixed(2) + '%' : '—';
        return `<td class="diag" title="${rowCcy} real rate: ${fmt}">${fmt}</td>`;
      }
      const rrCol = d.realRates[colCcy];
      const diff  = (rrRow != null && rrCol != null) ? parseFloat((rrRow - rrCol).toFixed(3)) : null;
      const cls   = cellClass(diff);
      const fmt   = cellFmt(diff);
      const tip   = diff != null
        ? `Long ${rowCcy} (${_rcmRrFmt(rrRow)}) / Short ${colCcy} (${_rcmRrFmt(rrCol)}) = ${cellFmt(diff)}`
        : `${rowCcy}/${colCcy} — insufficient data`;
      return `<td class="${cls}" title="${tip}">${fmt}</td>`;
    }).join('');
    return `<tr>
      <td class="row-head">${rowCcy}</td>
      ${cells}
    </tr>`;
  }).join('');

  return `<div class="rcm-cw" style="flex:1;overflow:hidden;display:flex;flex-direction:column;min-width:0;overflow-x:auto;">
    <div id="rcm-matrix-wrap" style="flex:1;overflow-x:auto;overflow-y:auto;">
      <table class="rcm-matrix" aria-label="Real rate differential matrix 8 major currencies">
        <thead>${header}</thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:10px;display:flex;gap:14px;flex-wrap:wrap;font-size:10px;color:var(--text3);font-family:var(--font-ui,'Inter',sans-serif);">
        <span><span style="display:inline-block;width:10px;height:10px;background:rgba(38,166,154,.26);border-radius:1px;vertical-align:middle;margin-right:4px;"></span>Strong real carry (≥+1.5%)</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:rgba(38,166,154,.12);border-radius:1px;vertical-align:middle;margin-right:4px;"></span>Positive real spread</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:rgba(239,83,80,.12);border-radius:1px;vertical-align:middle;margin-right:4px;"></span>Negative real spread</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:rgba(239,83,80,.26);border-radius:1px;vertical-align:middle;margin-right:4px;"></span>Strong real drag (≤−1.5%)</span>
        <span style="color:var(--text3);">Diagonal = absolute real rate · Cell = Row real rate − Column real rate</span>
      </div>
    </div>
    <div class="rcm-src-note">Real rate = Nominal OIS rate − Inflation Expectation. Positive cell = long row currency earns higher real carry vs short column currency. No FX forward adjustment applied — this is inflation-adjusted carry, not Covered Interest Parity (CIP).</div>
  </div>`;
}

function _rcmRenderPairDetail(baseCcy, quoteCcy) {
  const d = _rcmData;
  if (!d || !baseCcy || !quoteCcy) {
    return `<div class="rcm-loading">Select a pair from the Carry Ranking to view detail.</div>`;
  }

  const highCcy = baseCcy;
  const lowCcy  = quoteCcy;
  const carryDir = `${highCcy} carry advantage`;


  const nomEntryL = d.nominalRates[highCcy];
  const nomEntryS = d.nominalRates[lowCcy];
  const nomL = nomEntryL?.rate;
  const nomS = nomEntryS?.rate;
  const nomSrcL = nomEntryL?.source || 'policy';
  const nomSrcS = nomEntryS?.source || 'policy';
  const ieL  = d.inflExp[highCcy]?.val;
  const ieS  = d.inflExp[lowCcy]?.val;
  const rrL  = d.realRates[highCcy];
  const rrS  = d.realRates[lowCcy];
  const biasL = d.biasMap[highCcy];
  const biasS = d.biasMap[lowCcy];

  const nomSpread  = (nomL != null && nomS != null) ? nomL - nomS : null;
  const realSpread = (rrL  != null && rrS  != null) ? rrL  - rrS  : null;

  function pairId(a, b) {
    const HV30_PAIRS = new Set([
      'eurusd','gbpusd','usdjpy','audusd','usdchf','usdcad','nzdusd',
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
  const pid  = pairId(baseCcy, quoteCcy);
  const hv30 = d.hv30Map[pid] ?? null;
  const nomCarryVol  = (hv30 && nomSpread  != null) ? (Math.abs(nomSpread)  / hv30).toFixed(2) : null;
  const realCarryVol = (hv30 && realSpread != null) ? (Math.abs(realSpread) / hv30).toFixed(2) : null;

  let sustainCls = 'rcm-sustain-ok', sustainText = '';
  if (rrL != null && rrS != null) {
    if (rrL > 0 && rrS < 0) {
      sustainText = `<strong>Sustainable</strong> — long leg has positive real rate (${_rcmRrFmt(rrL)}), short leg negative (${_rcmRrFmt(rrS)}). Carry unlikely to erode via inflation differential.`;
      sustainCls  = 'rcm-sustain-ok';
    } else if (rrL < 0) {
      sustainText = `<strong>Carry trap risk</strong> — long leg real rate is negative (${_rcmRrFmt(rrL)}). Nominal carry may be eroded by inflation; real return to holder is negative.`;
      sustainCls  = 'rcm-sustain-bad';
    } else if (rrL > 0 && rrS > 0) {
      if (rrL > rrS) {
        sustainText = `<strong>Moderate</strong> — both legs positive real. Spread ${_rcmRrFmt(realSpread)} real vs ${nomSpread != null ? (nomSpread >= 0 ? '+' : '') + nomSpread.toFixed(2) + '%' : '—'} nominal. Watch for inflation convergence.`;
        sustainCls  = 'rcm-sustain-warn';
      } else {
        sustainText = `<strong>Negative real spread</strong> — ${lowCcy} has higher real rate. Nominal carry favors ${highCcy}, but real carry favors ${lowCcy}.`;
        sustainCls  = 'rcm-sustain-bad';
      }
    } else {
      sustainText = 'Insufficient real rate data for sustainability assessment.';
      sustainCls  = 'rcm-sustain-warn';
    }
  }

  function fmt(v, suffix) { return v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + (suffix || '') : '—'; }

  const G8sorted = [..._RCM_G8].filter(c => d.realRates[c] != null).sort((a, b) => d.realRates[b] - d.realRates[a]);
  const maxAbs = Math.max(...G8sorted.map(c => Math.abs(d.realRates[c] ?? 0)), 0.01);
  const barRows = G8sorted.map(ccy => {
    const rr = d.realRates[ccy];
    const isHigh  = ccy === highCcy;
    const isLow   = ccy === lowCcy;
    const pct = Math.abs(rr) / maxAbs * 42; 
    const rrCls = _rcmRrClass(rr);
    let barColor = rr >= 0 ? 'var(--up,#26a69a)' : 'var(--down,#ef5350)';
    let labelStyle = isHigh ? 'color:var(--up,#26a69a);font-weight:700;' : isLow ? 'color:var(--down,#ef5350);font-weight:700;' : '';
    let valStyle = `class="${rrCls}"`;
    const fillStyle = rr >= 0
      ? `left:50%;width:${pct}%;background:${barColor};`
      : `right:50%;width:${pct}%;background:${barColor};`;
    return `<div class="rcm-rb-row">
      <div class="rcm-rb-label" style="${labelStyle}">${ccy}</div>
      <div class="rcm-rb-track">
        <div class="rcm-rb-zero" style="left:50%"></div>
        <div class="rcm-rb-fill" style="${fillStyle}"></div>
      </div>
      <div class="rcm-rb-val ${rrCls}">${_rcmRrFmt(rr)}</div>
    </div>`;
  }).join('');

  return `
  <div class="rcm-pd-wrap">
  <div class="rcm-pd-header">
    <div class="rcm-pd-pair">${baseCcy} / ${quoteCcy}</div>
    <div class="rcm-pd-dir">—</div>
    <div class="rcm-pd-dir">${carryDir}</div>
  </div>
  <div class="rcm-pd-row-grid">
    <div class="rcm-pd-cell">
      <div class="rcm-pd-cell-lbl">Nominal carry <span style="font-size:8px;color:var(--accent,#26a69a);">(OIS)</span></div>
      <div class="rcm-pd-cell-val ${_rcmRrClass(nomSpread)}">${fmt(nomSpread, '%')}</div>
      <div class="rcm-pd-cell-sub">${nomSrcL} ${nomL != null ? nomL.toFixed(2) + '%' : '—'} − ${nomSrcS} ${nomS != null ? nomS.toFixed(2) + '%' : '—'}</div>
    </div>
    <div class="rcm-pd-cell">
      <div class="rcm-pd-cell-lbl">Real carry</div>
      <div class="rcm-pd-cell-val ${_rcmRrClass(realSpread)}">${fmt(realSpread, '%')}</div>
      <div class="rcm-pd-cell-sub">After inflation expectations</div>
    </div>
    <div class="rcm-pd-cell">
      <div class="rcm-pd-cell-lbl">High real rate (${highCcy})</div>
      <div class="rcm-pd-cell-val ${_rcmRrClass(rrL)}">${_rcmRrFmt(rrL)}</div>
      <div class="rcm-pd-cell-sub">${nomL != null ? nomL.toFixed(2) + '%' : '—'} ${nomSrcL} − ${ieL != null ? ieL.toFixed(2) + '%' : '—'} infl.exp</div>
    </div>
  </div>
  <div class="rcm-rate-bars">
    <div class="rcm-rb-title">Real rate positioning — G10 (${highCcy} highlighted)</div>
    ${barRows}
  </div>
  <div class="rcm-vol-row">
    <div class="rcm-vol-cell">
      <div class="rcm-vol-lbl">Low real rate (${lowCcy})</div>
      <div class="rcm-vol-val ${_rcmRrClass(rrS)}">${_rcmRrFmt(rrS)}</div>
      <div class="rcm-vol-sub">${nomS != null ? nomS.toFixed(2) + '%' : '—'} ${nomSrcS} − ${ieS != null ? ieS.toFixed(2) + '%' : '—'} infl.exp</div>
    </div>
    <div class="rcm-vol-cell">
      <div class="rcm-vol-lbl">Nominal carry / vol</div>
      <div class="rcm-vol-val">${nomCarryVol ?? '—'}</div>
      <div class="rcm-vol-sub">HV30 ${hv30 ? hv30.toFixed(1) + '%' : 'n/a'}</div>
    </div>
    <div class="rcm-vol-cell">
      <div class="rcm-vol-lbl">Real carry / vol</div>
      <div class="rcm-vol-val">${realCarryVol ?? '—'}</div>
      <div class="rcm-vol-sub">Real spread / HV30</div>
    </div>
  </div>
  <div class="rcm-ois-row">
    <div class="rcm-ois-cell">
      <div class="rcm-ois-lbl">OIS bias (${highCcy})</div>
      ${_rcmBiasChip(biasL)}
      <div class="rcm-ois-sub">${biasL?.method || '—'}</div>
    </div>
    <div class="rcm-ois-cell">
      <div class="rcm-ois-lbl">OIS bias (${lowCcy})</div>
      ${_rcmBiasChip(biasS)}
      <div class="rcm-ois-sub">${biasS?.method || '—'}</div>
    </div>
  </div>
  ${sustainText ? `<div class="rcm-sustain ${sustainCls}">${sustainText}</div>` : ''}
  <div class="rcm-src-note" style="padding:8px 14px;font-size:8.5px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);color:var(--text2);line-height:1.6;border-top:1px solid var(--border2);">
    Infl. Exp. source — ${highCcy}: ${d.inflExp[highCcy]?.source || _RCM_IE_SRC[highCcy] || '—'} · ${lowCcy}: ${d.inflExp[lowCcy]?.source || _RCM_IE_SRC[lowCcy] || '—'}<br>
    Real carry/vol = |real spread| / HV30 (30-day realised vol, annualised)
  </div>
  </div>`;
}

function _rcmRender() {
  const modal = document.getElementById('rcm-body');
  if (!modal) return;

  let content = '';
  if (_rcmActiveTab === 'breakdown') {
    content = _rcmRenderBreakdown();
  } else if (_rcmActiveTab === 'matrix') {
    content = _rcmRenderMatrix();
  } else if (_rcmActiveTab === 'detail') {
    const [l, s] = (_rcmActivePair || '/').split('/');
    content = _rcmRenderPairDetail(l, s);
  }

  modal.innerHTML = `<div class="rcm-panel on" style="overflow-y:visible;overflow-x:hidden;width:100%;box-sizing:border-box;">${content}</div>`;

  const titleEl = document.getElementById('rcm-title');
  if (titleEl) {
    if (_rcmActiveTab === 'detail' && _rcmActivePair) {
      titleEl.textContent = _rcmActivePair.replace('/', ' / ');
    } else {
      titleEl.textContent = 'Real Rate Carry Analysis';
    }
  }

  _rcmUpdateMetrics();

  document.querySelectorAll('.rcm-tab').forEach(t => {
    t.classList.toggle('on', t.dataset.tab === _rcmActiveTab);
  });
}

function _rcmUpdateMetrics() {
  const d = _rcmData;
  if (!d) return;

  const sorted = [..._RCM_G8].filter(c => d.realRates[c] != null).sort((a, b) => d.realRates[b] - d.realRates[a]);
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];

  const elBest = document.getElementById('rcm-mm-best');
  const elWorst = document.getElementById('rcm-mm-worst');
  const elSpread = document.getElementById('rcm-mm-spread');
  const elSrc = document.getElementById('rcm-mm-src');

  if (elBest && best) {
    elBest.querySelector('.rcm-mm-val').textContent = _rcmRrFmt(d.realRates[best]);
    elBest.querySelector('.rcm-mm-lbl').textContent = `Best real (${best})`;
    elBest.querySelector('.rcm-mm-sub').textContent = _RCM_CB[best];
  }
  if (elWorst && worst) {
    elWorst.querySelector('.rcm-mm-val').textContent = _rcmRrFmt(d.realRates[worst]);
    elWorst.querySelector('.rcm-mm-lbl').textContent = `Worst real (${worst})`;
    elWorst.querySelector('.rcm-mm-sub').textContent = _RCM_CB[worst];
  }
  if (elSpread && best && worst && d.realRates[best] != null && d.realRates[worst] != null) {
    const spread = d.realRates[best] - d.realRates[worst];
    elSpread.querySelector('.rcm-mm-val').textContent = '+' + spread.toFixed(2) + '%';
    elSpread.querySelector('.rcm-mm-sub').textContent = `${best}−${worst} spread`;
  }
  if (elSrc) {
    const classes = _RCM_G8.map(c => _rcmClassifyIESource(d.inflExp[c]?.source).kind);
    const fwdCount = classes.filter(k => k === 'breakeven' || k === 'survey').length;
    elSrc.querySelector('.rcm-mm-lbl').textContent = 'Infl. Exp.';
    elSrc.querySelector('.rcm-mm-val').textContent = `${fwdCount} / ${_RCM_G8.length} FWD`;
    elSrc.querySelector('.rcm-mm-sub').textContent = fwdCount === _RCM_G8.length
      ? 'All market/survey-implied'
      : `${_RCM_G8.length - fwdCount} on CPI proxy this run`;
  }

  const elPos = document.getElementById('rcm-mm-positive');
  if (elPos) {
    const posCount = _RCM_G8.filter(c => (d.realRates[c] ?? -99) > 0).length;
    elPos.querySelector('.rcm-mm-val').textContent = `${posCount} / ${_RCM_G8.length}`;
  }
}

async function openRealCarryModal(baseCcy, quoteCcy) {
  if (!document.getElementById('rcm-bd')) {
    _rcmBuildDOM();
  }

  if (baseCcy && quoteCcy) {
    _rcmActivePair = `${baseCcy}/${quoteCcy}`;  
    _rcmActiveTab  = 'detail';
  } else {
    _rcmActiveTab = 'breakdown';
  }

  const bd = document.getElementById('rcm-bd');
  bd.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  if (_rcmData) {
    _rcmRender();
  } else {
    const body = document.getElementById('rcm-body');
    if (body) body.innerHTML = '<div class="rcm-loading">Fetching rates & inflation data...</div>';
    await _rcmFetchData();
    _rcmRender();
  }
}

function _rcmBuildDOM() {
  const bd = document.createElement('div');
  bd.id = 'rcm-bd';
  bd.style.display = 'none';
  bd.setAttribute('role', 'dialog');
  bd.setAttribute('aria-modal', 'true');
  bd.setAttribute('aria-label', 'Real Rate Carry Analysis');

  bd.innerHTML = `
  <div id="rcm-modal" role="document">
    <div id="rcm-hd">
      <div id="rcm-hd-left">
        <div id="rcm-title">Real Rate Carry Analysis</div>
        <div id="rcm-sub">Nominal OIS rate &minus; Inflation Expectation &middot; Real carry &middot; G10</div>
      </div>
      <button id="rcm-close" aria-label="Close real rate carry modal">&times;</button>
    </div>
    <div id="rcm-metrics">
      <div class="rcm-mm" id="rcm-mm-best">
        <div class="rcm-mm-lbl">Best real (—)</div>
        <div class="rcm-mm-val rr-pos1">—</div>
        <div class="rcm-mm-sub">—</div>
      </div>
      <div class="rcm-mm" id="rcm-mm-worst">
        <div class="rcm-mm-lbl">Worst real (—)</div>
        <div class="rcm-mm-val rr-neg1">—</div>
        <div class="rcm-mm-sub">—</div>
      </div>
      <div class="rcm-mm" id="rcm-mm-spread">
        <div class="rcm-mm-lbl">Max real spread</div>
        <div class="rcm-mm-val">—</div>
        <div class="rcm-mm-sub">—</div>
      </div>
      <div class="rcm-mm" id="rcm-mm-positive">
        <div class="rcm-mm-lbl">Pairs w/ + real</div>
        <div class="rcm-mm-val" style="color:var(--text2);">—</div>
        <div class="rcm-mm-sub">G10</div>
      </div>
      <div class="rcm-mm" id="rcm-mm-src">
        <div class="rcm-mm-lbl">Infl. Exp.</div>
        <div class="rcm-mm-val">—</div>
        <div class="rcm-mm-sub">—</div>
      </div>
    </div>
    <div id="rcm-tabs" role="tablist" aria-label="Real carry analysis tabs">
      <div class="rcm-tab on" role="tab" aria-selected="true"  data-tab="breakdown">Rates Breakdown</div>
      <div class="rcm-tab"    role="tab" aria-selected="false" data-tab="matrix">Real Rate Matrix</div>
      <div class="rcm-tab"    role="tab" aria-selected="false" data-tab="detail">Pair Detail</div>
    </div>
    <div id="rcm-body"></div>
  </div>`;

  document.body.appendChild(bd);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ bd.scrollIntoView({behavior:'smooth',block:'start'}); }));

  document.getElementById('rcm-close').addEventListener('click', _rcmClose);
  bd.addEventListener('click', e => { if (e.target === bd) _rcmClose(); });
  document.addEventListener('keydown', _rcmEsc, { capture: true });

  bd.querySelectorAll('.rcm-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _rcmActiveTab = tab.dataset.tab;
      bd.querySelectorAll('.rcm-tab').forEach(t => {
        t.classList.toggle('on', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      _rcmRender();
    });
  });
}

function _rcmClose() {
  const bd = document.getElementById('rcm-bd');
  if (bd) bd.style.display = 'none';
  document.body.style.overflow = '';
}

function _rcmEsc(e) {
  if (e.key === 'Escape') {
    const bd = document.getElementById('rcm-bd');
    if (bd && bd.style.display !== 'none') _rcmClose();
  }
}

setInterval(async () => {
  const isStale = (Date.now() - _rcmFetchedAt) >= _RCM_TTL;
  if (!isStale) return;

  const bd = document.getElementById('rcm-bd');
  const isOpen = bd && bd.style.display !== 'none';

  await _rcmFetchData();

  if (isOpen) _rcmRender(); 
}, 60 * 1000); 
