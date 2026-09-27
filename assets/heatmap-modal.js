
(function () {

  if (document.getElementById('hm-modal2-css')) return;
  const s = document.createElement('style');
  s.id = 'hm-modal2-css';
  s.textContent = `


#hm-bd {
  display:block!important;
}
@keyframes hm-fadein  { from{opacity:0}                              to{opacity:1} }
@keyframes hm-slidein { from{transform:translateY(-8px);opacity:0}  to{transform:none;opacity:1} }

#hm-modal {
  width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;
  border-radius:0!important;border:none!important;box-shadow:none!important;animation:none!important;
  background:var(--bg)!important;position:static!important;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);color:var(--text);
  display:flex;flex-direction:column;
}

#hm-modal::before {
  display:none;
}


#hm-hd {
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 14px 9px;
  border-bottom:1px solid var(--border,#252d3d);
  flex-shrink:0;
  background:var(--bg2);
}
#hm-hd-left { display:flex;flex-direction:column;gap:2px; }


#hm-title-row { display:flex;align-items:center;gap:5px; }
#hm-title { font-size:14px;font-weight:600;color:var(--text);letter-spacing:-.01em;line-height:1.2;font-family:var(--font-ui,'Inter',-apple-system,sans-serif); }
#hm-title .fi { border-radius:2px;font-size:16px; }
#hm-sub { font-size:10px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);color:var(--text2);letter-spacing:.02em;margin-top:1px; }
#hm-close {
  background:none;border:none;color:var(--text3,#4e5c70);font-size:16px;
  cursor:pointer;padding:3px 6px;border-radius:3px;line-height:1;
  transition:color .1s,background .1s;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);
}
#hm-close:hover { color:var(--text);background:var(--bg3); }


.hm-ccy-arrow {
  background:none;border:none;color:var(--text3,#4e5c70);font-size:11px;
  cursor:pointer;padding:2px 4px;border-radius:3px;line-height:1;flex-shrink:0;
  transition:color .1s,background .1s;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);
}
.hm-ccy-arrow:hover { color:var(--text);background:var(--bg3); }
.hm-ccy-arrow:disabled { opacity:.3;cursor:default; }
.hm-ccy-arrow:disabled:hover { background:none;color:var(--text3,#4e5c70); }
#hm-ccy-switch { position:relative;display:inline-flex; }
#hm-ccy-chip {
  background:var(--bg3,#151b26);border:1px solid var(--border,#252d3d);border-radius:4px;
  color:var(--text);font-size:13px;font-weight:600;padding:1px 7px;cursor:pointer;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);letter-spacing:-.01em;
  display:inline-flex;align-items:center;gap:4px;transition:border-color .1s,background .1s;
}
#hm-ccy-chip:hover { border-color:var(--blue);background:var(--bg2); }
#hm-ccy-chip::after {
  content:'';width:0;height:0;margin-left:1px;
  border-left:3.5px solid transparent;border-right:3.5px solid transparent;
  border-top:4px solid var(--text3,#4e5c70);
}
#hm-ccy-dd {
  display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:20;
  background:var(--bg2);border:1px solid var(--border,#252d3d);border-radius:5px;
  box-shadow:0 6px 18px rgba(0,0,0,.4);padding:4px;min-width:64px;
  grid-template-columns:repeat(2,1fr);gap:2px;
}
#hm-ccy-dd.open { display:grid; }
.hm-ccy-dd-item {
  background:none;border:none;color:var(--text2);font-size:11px;font-weight:600;
  padding:5px 6px;border-radius:3px;cursor:pointer;text-align:center;
  font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);
  transition:color .1s,background .1s;
}
.hm-ccy-dd-item:hover { color:var(--text);background:var(--bg3); }
.hm-ccy-dd-item.on { color:var(--blue);background:var(--bg3); }


#hm-metrics {
  display:grid;grid-template-columns:repeat(6,1fr);
  border-bottom:1px solid var(--border2);
  flex-shrink:0;
  background:var(--bg);
}
.hm-mm {
  padding:9px 14px;
  border-right:1px solid var(--border2);
  display:flex;flex-direction:column;gap:1px;
}
.hm-mm:last-child { border-right:none; }
.hm-mm-lbl {
  font-size:9px;font-family:var(--font-mono,monospace);font-weight:600;
  color:var(--text2);text-transform:uppercase;letter-spacing:.09em;
}
.hm-mm-val {
  font-size:15px;font-weight:600;font-family:var(--font-mono,monospace);
  color:var(--text);line-height:1;margin-top:2px;
}
.hm-mm-val.sm   { font-size:12px; }
.hm-mm-val.up   { color:var(--up); }
.hm-mm-val.down { color:var(--down); }
.hm-mm-val.flat { color:var(--text2); }
.hm-mm-sub {
  font-size:9px;font-family:var(--font-mono,monospace);
  color:var(--text2);margin-top:1px;
}
.hm-mm-sub.up   { color:var(--up); }
.hm-mm-sub.down { color:var(--down); }


#hm-tabs {
  display:flex;padding:0 14px;
  border-bottom:1px solid var(--border,#252d3d);
  flex-shrink:0;background:var(--bg2);
  overflow-x:auto;scrollbar-width:none;
}
#hm-tabs::-webkit-scrollbar { display:none; }
.hm-tab {
  font-size:11px;font-weight:500;
  padding:9px 14px;cursor:pointer;
  color:var(--text2);
  border-bottom:2px solid transparent;
  transition:color .12s;white-space:nowrap;user-select:none;
  font-family:var(--font-ui,sans-serif);
  
  background:none;border-top:none;border-left:none;border-right:none;outline:none;
}
.hm-tab:focus-visible { outline:2px solid var(--blue);outline-offset:-2px;border-radius:2px; }
.hm-tab:hover { color:var(--text2); }
.hm-tab.on { color:var(--text);border-bottom-color:var(--blue); }


#hm-body {
  flex:1;min-height:0;
  overflow-y:auto;
  padding:0;
  background:var(--bg);
  scrollbar-width:thin;
  scrollbar-color:var(--border2,#2e3a50) transparent;
}
#hm-body::-webkit-scrollbar { width:3px!important; }
#hm-body::-webkit-scrollbar-track { background:transparent; }
#hm-body::-webkit-scrollbar-thumb { background:var(--border2,#2e3a50);border-radius:2px; }
#hm-body::-webkit-scrollbar-thumb:hover { background:var(--text2); }
.hm-panel { display:none;padding:0; }
.hm-panel.on { display:flex;flex:1;flex-direction:column;min-height:0; }


.hm-cw {
  background:var(--bg);
  border:none;
  border-radius:0;
  padding:14px;
  margin-bottom:0;
  border-bottom:1px solid var(--border,#252d3d);
  overflow-x:auto;
  scrollbar-width:thin;
  scrollbar-color:var(--border2,#2e3a50) transparent;
}
.hm-cw:last-child { border-bottom:none; }
.hm-cw::-webkit-scrollbar { height:3px; }
.hm-cw::-webkit-scrollbar-thumb { background:var(--border2,#2e3a50);border-radius:2px; }


.hm-news-wrap { flex:1;min-height:0;max-height:210px;overflow-y:auto;margin-top:8px;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent; }
.hm-news-wrap::-webkit-scrollbar { width:3px!important; }
.hm-news-wrap::-webkit-scrollbar-thumb { background:var(--border2,#2e3a50);border-radius:2px; }
.hm-news-article { padding:8px 0;border-bottom:1px solid rgba(54,60,78,.35); }
.hm-news-article:last-child { border-bottom:none; }
.hm-news-art-meta { display:flex;align-items:center;gap:6px;margin-bottom:4px; }
.hm-news-art-source { font-size:8px;font-weight:600;color:var(--blue,#4f7fff);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.05em; }
.hm-news-art-time { font-size:8px;color:var(--text2);font-family:var(--font-mono); }
.hm-news-art-title { font-size:10px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:4px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif); }
.hm-news-art-title a { color:inherit;text-decoration:none; }
.hm-news-art-title a:hover { text-decoration:underline;text-decoration-color:var(--text2); }
.hm-news-art-body { font-size:10px;color:var(--text2);line-height:1.55;font-family:var(--font-ui,'Inter',-apple-system,sans-serif); }
.hm-news-loading, .hm-news-empty { padding:14px 0;font-size:10px;color:var(--text2);font-family:var(--font-mono); }


.hm-ct {
  font-size:8.5px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);color:var(--text3,#4e5c70);
  letter-spacing:.07em;margin-bottom:10px;
  font-weight:600;
  text-transform:uppercase;
}


.hm-tbl {
  width:100%;border-collapse:collapse;
  font-size:11.5px;font-family:var(--font-mono,monospace);
}
.hm-tbl thead th {
  text-align:right;color:var(--text2);font-weight:500;
  font-size:9px;text-transform:uppercase;letter-spacing:.08em;
  padding:7px 10px;
  border-bottom:1px solid var(--border2);
  white-space:nowrap;
}
.hm-tbl thead th:first-child { text-align:left; }
.hm-tbl th { text-align:right;color:var(--text2);font-weight:500;font-size:9px;text-transform:uppercase;letter-spacing:.08em;padding:7px 10px;border-bottom:1px solid var(--border2);white-space:nowrap; }
.hm-tbl th:first-child { text-align:left; }
.hm-tbl tbody tr { transition:background .08s; }
.hm-tbl tbody tr:nth-child(even) td { background:rgba(255,255,255,.015); }
.hm-tbl tbody tr:hover td { background:rgba(88,166,255,.05); }
.hm-tbl td {
  text-align:right;padding:7px 10px;
  border-bottom:1px solid rgba(255,255,255,.04);
  color:var(--text);vertical-align:middle;white-space:nowrap;
}
.hm-tbl td:first-child { text-align:left; }
.hm-tbl tr:last-child td { border-bottom:none; }
.hm-tbl td.up   { color:var(--up); }
.hm-tbl td.down { color:var(--down); }
.hm-tbl td.flat { color:var(--text2); }
.hm-tbl .sym,.hm-tbl .hm-sym { font-weight:600;color:var(--text); }
.imp-wrap { display:flex;align-items:center;gap:6px;justify-content:flex-end; }
.imp-bar-bg { width:36px;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden; }
.imp-bar-fill { height:100%;border-radius:2px; }


.up   { color:var(--up); }
.down,.dn { color:var(--down); }
.flat { color:var(--text2); }


.hm-rank-row { display:flex;align-items:center;gap:8px;margin-bottom:5px; }
.hm-rank-ccy {
  width:34px;font-size:10px;font-weight:600;
  font-family:var(--font-mono,monospace);color:var(--text2);text-align:right;
}
.hm-rank-ccy.hl { color:var(--text); }
.hm-rank-bg { flex:1;height:14px;background:rgba(255,255,255,.04);border-radius:2px;overflow:hidden; }
.hm-rank-fill { height:100%;border-radius:2px;transition:width .35s ease; }
.hm-rank-fill.no-transition { transition:none; }
.hm-rank-fill.hl   { background:var(--blue); }
.hm-rank-fill.up   { background:rgba(38,166,154,.35); }
.hm-rank-fill.down { background:rgba(239,83,80,.30); }
.hm-rank-fill.flat { background:rgba(139,148,158,.20); }
.hm-rank-val { width:56px;text-align:right;font-size:10px;font-family:var(--font-mono,monospace);color:var(--text2); }
.hm-rank-sublbl { font-size:8.5px;font-family:var(--font-mono,monospace);color:var(--text2);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px; }


.sess-grid { display:grid;grid-template-columns:80px 1fr 60px;align-items:center;gap:5px 8px;font-family:var(--font-mono,monospace);font-size:10px; }
.sess-lbl { color:var(--text2);text-align:right;letter-spacing:.04em; }
.sess-lbl.hl { color:var(--blue); }
.sess-track { height:10px;background:rgba(255,255,255,.04);border-radius:2px;overflow:hidden; }
.sess-fill { height:100%;border-radius:2px; }
.sess-val { text-align:right; }


.state-chip {
  display:inline-flex;align-items:center;
  font-size:8px;font-family:var(--font-mono,monospace);font-weight:700;
  padding:1px 5px;border-radius:3px;letter-spacing:.06em;
  vertical-align:middle;margin-left:5px;
}
.state-live     { background:rgba(56,139,253,.15);color:var(--blue);border:1px solid rgba(56,139,253,.25); }
.state-closed   { background:transparent;color:var(--text2);border:1px solid var(--border2); }
.state-upcoming { background:rgba(210,153,34,.10);color:#d29922;border:1px solid rgba(210,153,34,.22); }

.sess-note { margin-bottom:7px; }
.sess-note-hdr { display:flex;align-items:center;gap:6px;margin-bottom:3px; }
.sess-note-name { font-size:10px;font-family:var(--font-mono,monospace);font-weight:600;letter-spacing:.04em;color:var(--text); }
.sess-note-body { font-size:10.5px;font-family:var(--font-mono,monospace);color:var(--text2);line-height:1.6;padding-left:2px; }



.corr-wrap { overflow:auto;flex:1;min-height:0;scrollbar-width:thin;scrollbar-color:#444c56 transparent; }
.corr-wrap::-webkit-scrollbar { width:4px;height:4px; }
.corr-wrap::-webkit-scrollbar-track { background:transparent; }
.corr-wrap::-webkit-scrollbar-thumb { background:#444c56;border-radius:2px; }
.corr-wrap::-webkit-scrollbar-thumb:hover { background:var(--text2); }
.corr-matrix { border-collapse:collapse;font-size:10.5px;font-family:var(--font-mono,monospace);width:100%;table-layout:fixed; }
.corr-matrix th { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:6px 4px;color:var(--text2);text-align:center;white-space:nowrap;background:var(--bg2);position:sticky;top:0;z-index:2;border-bottom:1px solid var(--border2); }
.corr-matrix th.row-head { text-align:left;width:72px;padding:6px 8px; }
.corr-matrix th.focal { color:var(--blue); }
.corr-matrix td { padding:6px 4px;text-align:center;border:1px solid rgba(255,255,255,.04);font-size:10.5px;transition:filter .1s; }
.corr-matrix td:hover { filter:brightness(1.4); }
.corr-matrix td.diag { background:#2d333b;color:var(--text2);font-size:10px;font-weight:600; }
.corr-matrix td.row-head { text-align:left;color:var(--text2);font-weight:700;font-size:10.5px;background:var(--bg2);border:none;position:sticky;left:0;z-index:1; }
.corr-matrix td.row-head.focal { color:var(--blue); }
.corr-matrix td.empty { background:transparent;border:none; }
.corr-matrix td.comp-col { border-left:2px solid rgba(255,255,255,.10); }
.corr-matrix tr.comp-row td { border-top:2px solid rgba(255,255,255,.10); }

.corr-cell-pos-hi { background:rgba(38,166,154,.25);color:var(--up);font-weight:700; }
.corr-cell-pos    { background:rgba(38,166,154,.10);color:var(--up); }
.corr-cell-neg-hi { background:rgba(239,83,80,.25);color:var(--down);font-weight:700; }
.corr-cell-neg    { background:rgba(239,83,80,.10);color:var(--down); }
.corr-cell-flat   { color:var(--text2); }
.corr-cell-focal  { outline:1px solid rgba(56,139,253,.35); }

.corr-legend { display:flex;gap:16px;flex-wrap:wrap;font-size:9px;font-family:var(--font-mono,monospace);color:var(--text2);margin-top:10px;padding-top:10px;border-top:1px solid var(--border2);align-items:center;flex-shrink:0; }


.driver-row { display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;font-family:var(--font-mono,monospace); }
.driver-pair { font-size:11px;font-weight:600;color:var(--text);width:72px;padding-top:1px;flex-shrink:0; }
.driver-body { flex:1; }
.driver-top  { display:flex;align-items:center;gap:8px; }
.driver-pct  { font-size:11px;font-weight:600; }
.driver-vs   { font-size:11px;color:var(--text2); }
.driver-note { font-size:10px;color:var(--text2);margin-top:3px;line-height:1.5; }



#hm-csi-controls { display:flex;align-items:center;gap:2px;margin-bottom:10px;flex-wrap:wrap; }
#hm-csi-wrap,.csi-wrap {
  position:relative;height:280px;
  background:var(--bg);border-radius:4px;overflow:hidden;
  margin-bottom:10px;
}
#hm-csi-chart,.csi-canvas-placeholder { width:100%;height:100%; }
.hm-csi-btn,.hm-csi-pbtn,.csi-pbtn {
  font-size:10px;padding:3px 9px;border-radius:3px;
  border:1px solid var(--border2);
  background:none;color:var(--text2);cursor:pointer;
  font-family:var(--font-mono,monospace);
  transition:background .1s,color .1s,border-color .1s;
  white-space:nowrap;
  line-height:1.4;
}
.hm-csi-btn:hover,.hm-csi-pbtn:hover,.csi-pbtn:hover { background:rgba(255,255,255,.05);color:var(--text); }
.hm-csi-btn.on,.hm-csi-pbtn.on,.csi-pbtn.on {
  background:rgba(56,139,253,.15);
  border-color:rgba(56,139,253,.35);
  color:var(--blue);
}
#hm-csi-legend,.csi-legend {
  display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px;
  font-size:9px;font-family:var(--font-mono,monospace);
}
.hm-csi-leg,.csi-leg {
  display:flex;align-items:center;gap:4px;cursor:pointer;
  padding:2px 4px;border-radius:2px;transition:background .1s;
}
.hm-csi-leg:hover,.csi-leg:hover { background:rgba(255,255,255,.06); }
.hm-csi-leg-dot,.csi-leg-dot { width:8px;height:2px;border-radius:1px;flex-shrink:0; }
.hm-csi-leg-lbl,.csi-leg-lbl { color:var(--text2);letter-spacing:.04em; }
.hm-csi-leg-val,.csi-leg-val { color:var(--text);font-weight:600;min-width:42px;text-align:right; }
#hm-csi-tooltip {
  position:absolute;pointer-events:none;z-index:10;
  background:rgba(13,17,23,.95);border:1px solid var(--border2);
  border-radius:4px;padding:7px 10px;font-size:9px;
  font-family:var(--font-mono,monospace);
  min-width:130px;display:none;
}
.hm-csi-tt-date { color:var(--text2);margin-bottom:5px;font-size:9px;letter-spacing:.04em; }
.hm-csi-tt-row  { display:flex;justify-content:space-between;gap:12px;margin-bottom:2px; }
.hm-csi-tt-ccy  { color:var(--text2); }
.hm-csi-tt-val  { font-weight:600; }
#hm-csi-loading {
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:10px;color:var(--text2);
  font-family:var(--font-mono,monospace);
  letter-spacing:.04em;background:var(--bg);
}


.hm-src-note {
  font-size:9px;font-family:var(--font-mono,monospace);color:var(--text2);
  margin-top:10px;padding-top:9px;
  border-top:1px solid var(--border2);
  line-height:1.6;
}


#hm-footer {
  padding:8px 18px;
  border-top:1px solid var(--border2);
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;background:var(--bg2);
}
#hm-footer-meta { font-size:9px;font-family:var(--font-mono,monospace);color:var(--text2);letter-spacing:.03em; }


@media (max-width:640px) {
  #hm-modal {
  width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;
  border-radius:0!important;border:none!important;box-shadow:none!important;animation:none!important;
  background:var(--bg)!important;position:static!important;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);color:var(--text);
  display:flex;flex-direction:column;
}
  #hm-metrics { grid-template-columns:repeat(3,1fr); }
  .hm-mm { border-bottom:1px solid var(--border2); }
  .hm-mm:nth-child(3),.hm-mm:nth-child(6) { border-right:none; }
  #hm-body { padding:10px; }
  .hm-tbl .col-rng,.hm-tbl .col-prev { display:none; }
}
@media (max-width:520px) {
  .hm-panel { padding:0; }
  .hm-cw { padding:10px; }
  .hm-tbl th,.hm-tbl td { padding:4px 5px; }
  .hm-tbl { font-size:10px; }
  .hm-tbl .col-prev-close { display:none; }
  .imp-bar-bg { width:28px; }
}
`;
  document.head.appendChild(s);

  const CCY_META = {
    EUR: { flag: 'eu', full: 'Euro' },
    GBP: { flag: 'gb', full: 'Brit. Pound' },
    JPY: { flag: 'jp', full: 'Japanese Yen' },
    AUD: { flag: 'au', full: 'Aus. Dollar' },
    CHF: { flag: 'ch', full: 'Swiss Franc' },
    CAD: { flag: 'ca', full: 'Can. Dollar' },
    NZD: { flag: 'nz', full: 'NZ Dollar' },
    USD: { flag: 'us', full: 'US Dollar' },
    NOK: { flag: 'no', full: 'Norwegian Krone' },
    SEK: { flag: 'se', full: 'Swedish Krona' },
  };

  const PAIR_DEFS = [
    { id:'eurusd', base:'EUR', quote:'USD', sign:1 },
    { id:'gbpusd', base:'GBP', quote:'USD', sign:1 },
    { id:'audusd', base:'AUD', quote:'USD', sign:1 },
    { id:'nzdusd', base:'NZD', quote:'USD', sign:1 },
    { id:'usdjpy', base:'USD', quote:'JPY', sign:1 },
    { id:'usdchf', base:'USD', quote:'CHF', sign:1 },
    { id:'usdcad', base:'USD', quote:'CAD', sign:1 },
    { id:'eurgbp', base:'EUR', quote:'GBP', sign:1 },
    { id:'eurjpy', base:'EUR', quote:'JPY', sign:1 },
    { id:'eurchf', base:'EUR', quote:'CHF', sign:1 },
    { id:'eurcad', base:'EUR', quote:'CAD', sign:1 },
    { id:'euraud', base:'EUR', quote:'AUD', sign:1 },
    { id:'eurnzd', base:'EUR', quote:'NZD', sign:1 },
    { id:'gbpjpy', base:'GBP', quote:'JPY', sign:1 },
    { id:'gbpchf', base:'GBP', quote:'CHF', sign:1 },
    { id:'gbpcad', base:'GBP', quote:'CAD', sign:1 },
    { id:'gbpaud', base:'GBP', quote:'AUD', sign:1 },
    { id:'gbpnzd', base:'GBP', quote:'NZD', sign:1 },
    { id:'audjpy', base:'AUD', quote:'JPY', sign:1 },
    { id:'audchf', base:'AUD', quote:'CHF', sign:1 },
    { id:'audcad', base:'AUD', quote:'CAD', sign:1 },
    { id:'audnzd', base:'AUD', quote:'NZD', sign:1 },
    { id:'nzdjpy', base:'NZD', quote:'JPY', sign:1 },
    { id:'nzdchf', base:'NZD', quote:'CHF', sign:1 },
    { id:'nzdcad', base:'NZD', quote:'CAD', sign:1 },
    { id:'cadjpy', base:'CAD', quote:'JPY', sign:1 },
    { id:'cadchf', base:'CAD', quote:'CHF', sign:1 },
    { id:'chfjpy', base:'CHF', quote:'JPY', sign:1 },
    { id:'usdnok', base:'USD', quote:'NOK', sign:1 },
    { id:'usdsek', base:'USD', quote:'SEK', sign:1 },
    { id:'eurnok', base:'EUR', quote:'NOK', sign:1 },
    { id:'eursek', base:'EUR', quote:'SEK', sign:1 },
  ];

  const SESSIONS = [
    { name:'Sydney',  utcStart:21, utcEnd:6  },
    { name:'Tokyo',   utcStart:0,  utcEnd:9  },
    { name:'London',  utcStart:7,  utcEnd:16 },
    { name:'New York',utcStart:12, utcEnd:21 },
  ];

  let _ccy      = null;
  let _strengths = null;
  let _rtCache  = null;
  let _driversCache  = null;   
  let _driversFetched = false;
  let _catalystsCache  = null; 
  let _catalystsFetched = false;
  let _sessionCtxCache = null; 
  let _sessionCtxFetched = false;
  let _sessionCtxIsWeekend = false; 

  let _csiData       = null;  
  let _csiDataLive   = null;  
  let _csiChart      = null;  
  let _csiResizeObs  = null;  
  let _csiTf         = 'D1';  
  let _csiPeriodDays = 91;    
  let _csiRange      = '3M';  
  let _csiSeriesMap  = {};    
  let _csiInited     = false;

  const _CSI_RANGE_CONFIG = [
    { key: '1D', label: '1D', tf: 'H1', days: 1   },
    { key: '1W', label: '1W', tf: 'H1', days: 7   },
    { key: '1M', label: '1M', tf: 'H4', days: 30  },
    { key: '3M', label: '3M', tf: 'D1', days: 91  },
    { key: '6M', label: '6M', tf: 'D1', days: 182 },
    { key: '1Y', label: '1Y', tf: 'D1', days: 365 },
    { key: 'All',label: 'All',tf: 'W1', days: 0   },
  ];
  const _CSI_TF_TITLE = { H1: 'H1', H4: 'H4', D1: 'DAILY', W1: 'WEEKLY' };

  function _csiCutoffDate(lastDate, days) {
    if (!days || days <= 0 || lastDate == null) return null;
    if (typeof lastDate === 'number') return lastDate - days * 86400;
    const d = new Date(lastDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
  }

  function fetchDrivers() {
    if (_driversFetched) return;
    _driversFetched = true;
    fetch(GI_DATA_BASE + 'ai-analysis/currency-drivers.json?_=' + Date.now())
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.drivers && typeof data.drivers === 'object') {
          _driversCache = data;
        }
      })
      .catch(() => {  });
  }

  function fetchCatalysts() {
    if (_catalystsFetched) return;
    _catalystsFetched = true;
    fetch(GI_DATA_BASE + 'ai-analysis/currency-catalysts.json?_=' + Date.now())
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.currencies && typeof data.currencies === 'object') {
          _catalystsCache = data;
          if (_ccy && document.getElementById('hm-bd')?.style.display !== 'none') {
            populateMacroDrivers(_ccy);
          }
        }
      })
      .catch(() => {  });
  }

  function fetchSessionContext() {
    if (_sessionCtxFetched) return;
    _sessionCtxFetched = true;
    fetch(GI_DATA_BASE + 'ai-analysis/session-context.json?_=' + Date.now())
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.sessions && typeof data.sessions === 'object') {
          _sessionCtxCache = data;
          _sessionCtxIsWeekend = !!data.market_closed;
        }
      })
      .catch(() => {  });
  }

  function fmt2(v) {
    if (v == null || isNaN(v)) return '—';
    const s = v >= 0 ? '+' : '';
    return s + v.toFixed(2) + '%';
  }

  function fmtPrice(v) {
    if (v == null || isNaN(v)) return '—';
    return v >= 100 ? v.toFixed(3) : v.toFixed(5);
  }

  function pctClass(v) {
    if (v == null || isNaN(v)) return 'flat';
    return v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  }

  function isMarketWeekend() {
    const now  = new Date();
    const day  = now.getUTCDay();
    const hour = now.getUTCHours();
    return (
      day === 6 ||                    
      (day === 5 && hour >= 21) ||    
      (day === 0 && hour < 21)        
    );
  }

  function getActiveSessions() {
    if (isMarketWeekend()) return new Set();
    const h = new Date().getUTCHours();
    const active = new Set();
    if (h >= 21 || h < 6)  active.add('Sydney');
    if (h >= 0  && h < 9)  active.add('Tokyo');
    if (h >= 7  && h < 16) active.add('London');
    if (h >= 12 && h < 21) active.add('New York');
    return active;
  }

  function currentSessionName() {
    const active = getActiveSessions();
    for (const s of ['London', 'New York', 'Tokyo', 'Sydney']) {
      if (active.has(s)) return s;
    }
    return 'London';
  }

  function buildModal() {
    if (document.getElementById('hm-bd')) return;
    const el = document.createElement('div');
    el.id = 'hm-bd';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Currency Strength Breakdown');
    el.innerHTML = `
<div id="hm-modal">
  <div id="hm-hd">
    <div id="hm-hd-left">
      <div id="hm-title-row">
        <div id="hm-title"></div>
        <button class="hm-ccy-arrow" id="hm-ccy-prev" onclick="hmCycleCcy(-1)" aria-label="Previous currency" title="Previous (←)">‹</button>
        <div id="hm-ccy-switch">
          <button id="hm-ccy-chip" onclick="hmToggleCcyDropdown(event)" aria-haspopup="listbox" aria-expanded="false" title="Switch currency"></button>
          <div id="hm-ccy-dd" role="listbox" aria-label="Select currency"></div>
        </div>
        <button class="hm-ccy-arrow" id="hm-ccy-next" onclick="hmCycleCcy(1)" aria-label="Next currency" title="Next (→)">›</button>
      </div>
      <div id="hm-sub">G10 composite · 32 pairs · Delayed ~5min</div>
    </div>
    <button id="hm-close" aria-label="Close" title="Close">&#10005;</button>
  </div>
  <div id="hm-metrics">
    <div class="hm-mm">
      <div class="hm-mm-lbl">Composite</div>
      <div class="hm-mm-val" id="hm-m-composite">—</div>
      <div class="hm-mm-sub" id="hm-m-comp-sub">avg vs 7 pairs</div>
    </div>
    <div class="hm-mm">
      <div class="hm-mm-lbl">1W Strength</div>
      <div class="hm-mm-val" id="hm-m-1w">—</div>
      <div class="hm-mm-sub" id="hm-m-1w-sub">vs prior Fri</div>
    </div>
    <div class="hm-mm">
      <div class="hm-mm-lbl">Rank</div>
      <div class="hm-mm-val flat" id="hm-m-rank">—</div>
      <div class="hm-mm-sub">of 10 G10 currencies</div>
    </div>
    <div class="hm-mm">
      <div class="hm-mm-lbl">Pairs won</div>
      <div class="hm-mm-val flat" id="hm-m-won">—</div>
      <div class="hm-mm-sub">gaining vs</div>
    </div>
    <div class="hm-mm">
      <div class="hm-mm-lbl">Strongest vs</div>
      <div class="hm-mm-val sm flat" id="hm-m-strong">—</div>
      <div class="hm-mm-sub up" id="hm-m-strong-sub">—</div>
    </div>
    <div class="hm-mm">
      <div class="hm-mm-lbl">Weakest vs</div>
      <div class="hm-mm-val sm flat" id="hm-m-weak">—</div>
      <div class="hm-mm-sub down" id="hm-m-weak-sub">—</div>
    </div>
  </div>
  <div class="hm-cw" id="hm-macro">
    <div class="hm-ct" id="hm-catalyst-title">MACRO DRIVERS</div>
    <div id="hm-catalyst"></div>
  </div>
  <div id="hm-tabs" role="tablist" aria-label="Heatmap breakdown tabs">
    <button class="hm-tab on" role="tab" aria-selected="true"  data-tab="breakdown"    onclick="hmTab(this,'breakdown')">Pair Breakdown</button>
    <button class="hm-tab"    role="tab" aria-selected="false" data-tab="session"      onclick="hmTab(this,'session')">Session</button>
    <button class="hm-tab"    role="tab" aria-selected="false" data-tab="correlations" onclick="hmTab(this,'correlations')">Rel. Strength</button>
    <button class="hm-tab"    role="tab" aria-selected="false" data-tab="csi"          onclick="hmTab(this,'csi')">CSI</button>
  </div>
  <div id="hm-body">
    <div class="hm-panel on" id="hm-p-breakdown">
      <div class="hm-cw">
        <div class="hm-ct" id="hm-pairs-title">DIRECT PAIRS · DAY % &amp; 1W % · vs PREV CLOSE / PREV FRIDAY</div>
        <table class="hm-tbl" aria-label="Direct pairs for selected currency">
          <thead>
            <tr>
              <th scope="col">Pair</th>
              <th scope="col">Close</th>
              <th scope="col" class="col-prev-close">Prev close</th>
              <th scope="col">Day %</th>
              <th scope="col">1W %</th>
              <th scope="col" title="Relative contribution vs peers — bar width = magnitude">Contribution</th>
              <th scope="col">Session range</th>
            </tr>
          </thead>
          <tbody id="hm-pair-tbody"></tbody>
        </table>
      </div>
      <div class="hm-cw">
        <div class="hm-ct">FULL RANKING · ALL 10 G10 CURRENCIES · COMPOSITE STRENGTH</div>
        <div style="display:flex;gap:16px;">
          <div style="flex:1;">
            <div class="hm-rank-sublbl">Day %</div>
            <div id="hm-ranking-rows"></div>
          </div>
          <div style="flex:1;">
            <div class="hm-rank-sublbl">1W % · vs prior Fri</div>
            <div id="hm-ranking-1w-rows"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="hm-panel" id="hm-p-session">
      <div class="hm-cw">
        <div class="hm-ct" id="hm-sess-title">COMPOSITE STRENGTH BY SESSION</div>
        <div id="hm-sess-content"></div>
      </div>
      <div class="hm-cw">
        <div class="hm-ct">SESSION CONTEXT</div>
        <div id="hm-sess-notes" style="font-size:11px;color:var(--text2,#787b86);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);line-height:1.7;"></div>
      </div>
      <div class="hm-cw" style="flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:140px;">
        <div class="hm-ct" id="hm-sess-news-title">MARKET COMMENTARY</div>
        <div id="hm-sess-news" class="hm-news-wrap">
          <div class="hm-news-loading">Loading market commentary…</div>
        </div>
      </div>
    </div>
    <div class="hm-panel" id="hm-p-correlations">
      <div class="hm-cw" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
        <div class="hm-ct">RELATIVE STRENGTH DIFFERENTIAL · ALL 10 G10 · % COMPOSITE vs PREV CLOSE</div>
        <div style="font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono);margin:-2px 0 6px;">Click a currency to pivot this panel</div>
        <div id="hm-corr-matrix" style="flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0;"></div>
      </div>
      <div class="hm-cw">
        <div class="hm-ct" id="hm-drivers-title">STRENGTH DRIVERS · TOP 3 PAIRS BY CONTRIBUTION</div>
        <div id="hm-drivers"></div>
      </div>
    </div>
    <div class="hm-panel" id="hm-p-csi">
      <div class="hm-cw">
        <div class="hm-ct" id="hm-csi-title">CURRENCY STRENGTH INDEX · ACCUMULATED % RETURN · DAILY OHLC</div>
        <div id="hm-csi-controls">
          <button class="hm-csi-btn" data-range="1D"  onclick="csiSetRange(this,'1D')"  title="1 Day, hourly">1D</button>
          <button class="hm-csi-btn" data-range="1W"  onclick="csiSetRange(this,'1W')"  title="1 Week, hourly">1W</button>
          <button class="hm-csi-btn" data-range="1M"  onclick="csiSetRange(this,'1M')"  title="1 Month, 4-hourly">1M</button>
          <button class="hm-csi-btn on" data-range="3M"  onclick="csiSetRange(this,'3M')"  title="3 Months, daily">3M</button>
          <button class="hm-csi-btn" data-range="6M"  onclick="csiSetRange(this,'6M')"  title="6 Months, daily">6M</button>
          <button class="hm-csi-btn" data-range="1Y"  onclick="csiSetRange(this,'1Y')"  title="1 Year, daily">1Y</button>
          <button class="hm-csi-btn" data-range="All" onclick="csiSetRange(this,'All')" title="Full history, weekly">All</button>
        </div>
        <div id="hm-csi-wrap">
          <div id="hm-csi-loading">Loading OHLC data…</div>
          <div id="hm-csi-chart"></div>
          <div id="hm-csi-tooltip"></div>
        </div>
        <div id="hm-csi-legend"></div>
      </div>
      <div class="hm-cw">
        <div class="hm-ct" id="hm-csi-stats-title">CSI SNAPSHOT · CURRENT PERIOD</div>
        <div id="hm-csi-stats"></div>
      </div>
    </div>
  </div>
  <div id="hm-footer">
    <div id="hm-footer-meta">Delayed ~5min · G10 composite · 32 pairs</div>
  </div>
</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.scrollIntoView({behavior:'smooth',block:'start'}); }));
    document.getElementById('hm-close').addEventListener('click', closeHeatmapModal);
    el.addEventListener('click', function(e) {
      if (e.target === el) { closeHeatmapModal(); return; }
      if (!e.target.closest('#hm-ccy-switch')) _hmCloseCcyDropdown();
    });
    document.addEventListener('keydown', _onKey);
  }

  function _onKey(e) {
    if (e.key === 'Escape') {
      const dd = document.getElementById('hm-ccy-dd');
      if (dd && dd.classList.contains('open')) { _hmCloseCcyDropdown(); return; }
      closeHeatmapModal();
      return;
    }
    if (e.key === 'ArrowLeft')  { window.hmCycleCcy(-1); return; }
    if (e.key === 'ArrowRight') { window.hmCycleCcy(1); return; }
  }

  function populateMetrics(ccy, strengths, rtCache) {
    const sorted = [...strengths].sort((a,b) => b.pct - a.pct);
    const rank   = sorted.findIndex(s => s.ccy === ccy) + 1;
    const self   = strengths.find(s => s.ccy === ccy);
    if (!self) return;

    const myPairs = PAIR_DEFS.filter(p => p.base === ccy || p.quote === ccy);
    let won = 0;
    let bestPair = null, bestPct = -Infinity;
    let worstPair = null, worstPct = Infinity;

    myPairs.forEach(p => {
      const d = rtCache[p.id];
      if (!d || d.pct == null) return;
      const impact = d.pct * p.sign * (p.base === ccy ? 1 : -1);
      if (impact > 0) won++;
      const opp = p.base === ccy ? p.quote : p.base;
      if (impact > bestPct)  { bestPct  = impact; bestPair  = { pair: p.id.toUpperCase(), opp, pct: impact }; }
      if (impact < worstPct) { worstPct = impact; worstPair = { pair: p.id.toUpperCase(), opp, pct: impact }; }
    });

    const compositeEl    = document.getElementById('hm-m-composite');
    const compositeSubEl = document.getElementById('hm-m-comp-sub');
    const v = self.pct;
    compositeEl.textContent = fmt2(v);
    compositeEl.className   = 'hm-mm-val ' + pctClass(v);

    const compPairCnt = myPairs.filter(p => {
      const d = rtCache[p.id];
      return d && d.pct != null;
    }).length;
    if (compositeSubEl) {
      compositeSubEl.textContent = compPairCnt + ' pair' + (compPairCnt !== 1 ? 's' : '') + ' · intraday';
    }

    let w1sum = 0, w1n = 0;
    myPairs.forEach(p => {
      const d = rtCache[p.id];
      if (!d || d.pct1w == null) return;
      const impact1w = d.pct1w * p.sign * (p.base === ccy ? 1 : -1);
      w1sum += impact1w;
      w1n++;
    });
    const w1El    = document.getElementById('hm-m-1w');
    const w1SubEl = document.getElementById('hm-m-1w-sub');
    if (w1n > 0) {
      const w1avg = w1sum / w1n;
      w1El.textContent    = fmt2(w1avg);
      w1El.className      = 'hm-mm-val ' + pctClass(w1avg);
      w1SubEl.textContent = w1n + ' pairs · vs prior Fri';
    } else {
      w1El.textContent    = '—';
      w1El.className      = 'hm-mm-val flat';
      w1SubEl.textContent = 'no data';
    }

    document.getElementById('hm-m-rank').textContent = '#' + rank + ' / ' + sorted.length;
    document.getElementById('hm-m-won').textContent  = won + ' / ' + myPairs.length;

    const strongEl    = document.getElementById('hm-m-strong');
    const strongSubEl = document.getElementById('hm-m-strong-sub');
    const weakEl      = document.getElementById('hm-m-weak');
    const weakSubEl   = document.getElementById('hm-m-weak-sub');

    if (bestPair) {
      strongEl.textContent    = bestPair.opp;
      strongSubEl.textContent = fmt2(bestPair.pct);
    }
    if (worstPair) {
      weakEl.textContent    = worstPair.opp;
      weakSubEl.textContent = fmt2(worstPair.pct);
    }
  }

  function populateBreakdown(ccy, strengths, rtCache, _skipAnim) {
    document.getElementById('hm-pairs-title').textContent =
      ccy + ' DIRECT PAIRS · INTRADAY % CHANGE · vs PREV CLOSE';

    const myPairs = PAIR_DEFS.filter(p => p.base === ccy || p.quote === ccy);
    const impacts = [];

    myPairs.forEach(p => {
      const d = rtCache[p.id];
      const isCcyBase = p.base === ccy;
      const opp = isCcyBase ? p.quote : p.base;
      const rawPct = d?.pct ?? null;
      const impact = rawPct != null ? rawPct * p.sign * (isCcyBase ? 1 : -1) : null;
      const raw1w  = d?.pct1w ?? null;
      const imp1w  = raw1w != null ? raw1w * p.sign * (isCcyBase ? 1 : -1) : null;
      const close  = isCcyBase ? (d?.close ?? null) : (d?.close != null ? 1/d.close : null);
      const open   = isCcyBase ? (d?.open  ?? null) : (d?.open  != null ? 1/d.open  : null);
      const hi     = isCcyBase ? (d?.high  ?? null) : (d?.high  != null ? 1/d.high  : null);
      const lo     = isCcyBase ? (d?.low   ?? null) : (d?.low   != null ? 1/d.low   : null);
      const label  = isCcyBase
        ? (p.base + '/' + p.quote)
        : (p.quote + '/' + p.base);   
      impacts.push({ label, opp, close, open, hi, lo, impact, rawPct, imp1w });
    });

    impacts.sort((a,b) => (b.impact??-99) - (a.impact??-99));
    const maxImp = Math.max(...impacts.map(i => Math.abs(i.impact ?? 0)), 0.001);

    const tbody = document.getElementById('hm-pair-tbody');
    tbody.innerHTML = impacts.map((r, _i) => {
      const iCls  = pctClass(r.impact);
      const rng   = (r.hi != null && r.lo != null)
        ? fmtPrice(r.lo) + ' – ' + fmtPrice(r.hi)
        : '—';
      const barW  = r.impact != null ? Math.round(Math.abs(r.impact)/maxImp*100) : 0;
      const barClr = r.impact != null && r.impact >= 0 ? 'var(--up,#26a69a)' : 'var(--down,#ef5350)';
      return `<tr data-pair="${r.label}">
        <td><span class="sym">${r.label}</span></td>
        <td data-cell="close">${fmtPrice(r.close)}</td>
        <td class="col-prev-close" data-cell="open">${fmtPrice(r.open)}</td>
        <td class="${iCls}" data-cell="impact">${fmt2(r.impact)}</td>
        <td class="${pctClass(r.imp1w)}" data-cell="imp1w">${r.imp1w != null ? fmt2(r.imp1w) : '—'}</td>
        <td><div class="imp-wrap" title="${fmt2(r.impact)} vs peers">
          <div class="imp-bar-bg"><div class="imp-bar-fill" data-cell="bar" style="width:${barW}%;background:${barClr}"></div></div>
        </div></td>
        <td style="font-size:9px;color:var(--text3)" data-cell="rng">${rng}</td>
      </tr>`;
    }).join('');

    const sorted   = [...strengths].sort((a,b) => b.pct - a.pct);
    const maxAbsPct = Math.max(...sorted.map(s => Math.abs(s.pct)), 0.001);
    const container = document.getElementById('hm-ranking-rows');
    container.innerHTML = '';
    sorted.forEach(s => {
      const isHL  = s.ccy === ccy;
      const cls   = isHL ? 'hl' : pctClass(s.pct);
      const fillW = Math.round(Math.abs(s.pct) / maxAbsPct * 100);
      const row   = document.createElement('div');
      row.className = 'hm-rank-row';
      row.dataset.rankCcy = s.ccy;
      const initW = _skipAnim ? fillW + '%' : '0';
      row.innerHTML = `
        <div class="hm-rank-ccy${isHL?' hl':''}">${s.ccy}</div>
        <div class="hm-rank-bg">
          <div class="hm-rank-fill ${cls}" style="width:${initW}" data-w="${fillW}"></div>
        </div>
        <div class="hm-rank-val ${pctClass(s.pct)}" data-rank-val>${fmt2(s.pct)}</div>`;
      container.appendChild(row);
    });
    if (!_skipAnim) {
      requestAnimationFrame(() => {
        container.querySelectorAll('.hm-rank-fill').forEach(el => {
          el.style.width = el.dataset.w + '%';
        });
      });
    }

    const ccys = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD','USD','NOK','SEK'];
    const w1map = {};
    ccys.forEach(c => { w1map[c] = { sum: 0, n: 0 }; });
    PAIR_DEFS.forEach(p => {
      const d = rtCache[p.id];
      if (!d || d.pct1w == null) return;
      const v = d.pct1w * p.sign;   
      w1map[p.base].sum += v;  w1map[p.base].n++;
      w1map[p.quote].sum -= v; w1map[p.quote].n++;
    });
    const w1strengths = ccys
      .map(c => ({ ccy: c, pct: w1map[c].n > 0 ? w1map[c].sum / w1map[c].n : null }))
      .filter(s => s.pct != null)
      .sort((a, b) => b.pct - a.pct);

    const cont1w = document.getElementById('hm-ranking-1w-rows');
    cont1w.innerHTML = '';
    if (w1strengths.length > 0) {
      const maxAbs1w = Math.max(...w1strengths.map(s => Math.abs(s.pct)), 0.001);
      w1strengths.forEach(s => {
        const isHL  = s.ccy === ccy;
        const cls   = isHL ? 'hl' : pctClass(s.pct);
        const fillW = Math.round(Math.abs(s.pct) / maxAbs1w * 100);
        const row   = document.createElement('div');
        row.className = 'hm-rank-row';
        row.dataset.rankCcy = s.ccy;
        const initW = _skipAnim ? fillW + '%' : '0';
        row.innerHTML = `
          <div class="hm-rank-ccy${isHL?' hl':''}">${s.ccy}</div>
          <div class="hm-rank-bg">
            <div class="hm-rank-fill ${cls}" style="width:${initW}" data-w="${fillW}"></div>
          </div>
          <div class="hm-rank-val ${pctClass(s.pct)}" data-rank-val>${fmt2(s.pct)}</div>`;
        cont1w.appendChild(row);
      });
      if (!_skipAnim) {
        requestAnimationFrame(() => {
          cont1w.querySelectorAll('.hm-rank-fill').forEach(el => {
            el.style.width = el.dataset.w + '%';
          });
        });
      }
    } else {
      cont1w.innerHTML = '<div style="font-size:10px;color:var(--text3);padding:6px 0">No 1W data available</div>';
    }
  }

  function utcHourToLocalStr(utcHour) {
    const d = new Date();
    d.setUTCHours(utcHour, 0, 0, 0);
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function localTzAbbr() {
    return new Date().toLocaleTimeString('en', { timeZoneName: 'short' }).split(' ').pop() || 'LT';
  }

  function convertUtcTimesInNote(text) {
    if (!text) return text;
    const tzAbbr = localTzAbbr();
    return text.replace(/\b(\d{1,2}):(\d{2})\s*UTC\b/g, function(_, hh, mm) {
      const d = new Date();
      d.setUTCHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
      const local = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
      return local + ' ' + tzAbbr;
    });
  }

  function getBarSessionState(sess) {
    if (isMarketWeekend()) return 'past'; 
    const now = new Date();
    const elapsed = ((now.getUTCHours() + now.getUTCMinutes() / 60) - 21 + 24) % 24;
    const off = (sess.utcStart - 21 + 24) % 24;
    const len = (sess.utcEnd - sess.utcStart + 24) % 24;
    if (elapsed >= off && elapsed < off + len) return 'active';
    return elapsed < off ? 'upcoming' : 'past';
  }

  function getSessionProgress(sess) {
    const now    = new Date();
    const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    let startMin = sess.utcStart * 60;
    let endMin   = sess.utcEnd   * 60;
    if (endMin <= startMin) endMin += 24 * 60; 
    let elapsedMin = nowMin - startMin;
    if (elapsedMin < 0) elapsedMin += 24 * 60; 
    const durationMin = endMin - startMin;
    return Math.max(0, Math.min(1, elapsedMin / durationMin));
  }

  function getOrderedSessions() {
    if (isMarketWeekend()) return SESSIONS;
    const past = [], active = [], upcoming = [];
    SESSIONS.forEach(s => {
      const state = getBarSessionState(s);
      if (state === 'active') active.push(s);
      else if (state === 'past') past.push(s);
      else upcoming.push(s);
    });
    return past.concat(active, upcoming);
  }

  function _hmEscHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  let _hmNewsCcy = null;
  async function _hmLoadSessionNews(ccy) {
    if (ccy === _hmNewsCcy) return; 
    _hmNewsCcy = ccy;
    const wrap = document.getElementById('hm-sess-news');
    if (!wrap) return;
    wrap.innerHTML = '<div class="hm-news-loading">Loading market commentary…</div>';
    try {
      const res = await fetch(GI_DATA_BASE + 'news-data/news.json', { cache: 'no-store' }).catch(() => null);
      if (!res || !res.ok) throw new Error('fetch failed');
      const j = await res.json();
      if (ccy !== _hmNewsCcy) return; 
      const articles = (j.articles || [])
        .filter(a => {
          if (a.cur !== ccy) return false;
          const exp = (a.expand || '').replace(/<[^>]+>/g, '').trim();
          return exp.length >= 80;
        })
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, 3);

      if (!articles.length) {
        wrap.innerHTML = '<div class="hm-news-empty">No ' + ccy + ' commentary available.</div>';
        return;
      }

      wrap.innerHTML = articles.map(a => {
        const timeStr = [a.date, a.time].filter(Boolean).join(' \u00b7 ');
        let body = (a.expand || '').replace(/&#\d+;/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (body.length > 400) {
          const cut = body.slice(0, 400);
          const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
          body = (lastPeriod > 150 ? cut.slice(0, lastPeriod + 1) : cut) + '\u2026';
        }
        const safeLink = (a.link || '').startsWith('https://') ? a.link : '';
        const titleHtml = safeLink
          ? '<a href="' + _hmEscHtml(safeLink) + '" target="_blank" rel="noopener noreferrer">' + _hmEscHtml(a.title || '') + '</a>'
          : _hmEscHtml(a.title || '');
        return '<div class="hm-news-article">' +
          '<div class="hm-news-art-meta">' +
          '<span class="hm-news-art-source">' + _hmEscHtml(a.source || '') + '</span>' +
          '<span class="hm-news-art-time">' + _hmEscHtml(timeStr) + '</span>' +
          '</div>' +
          '<div class="hm-news-art-title">' + titleHtml + '</div>' +
          '<div class="hm-news-art-body">' + _hmEscHtml(body) + '</div>' +
          '</div>';
      }).join('');
    } catch (e) {
      if (ccy !== _hmNewsCcy) return;
      wrap.innerHTML = '<div class="hm-news-empty">Market commentary unavailable.</div>';
    }
  }

  function populateSession(ccy, rtCache) {
    const tzAbbr   = localTzAbbr();
    const weekend  = isMarketWeekend();
    document.getElementById('hm-sess-title').textContent =
      ccy + ' INTRADAY COMPOSITE · SESSION WINDOW STATUS · ' + tzAbbr;
    const newsTitleEl = document.getElementById('hm-sess-news-title');
    if (newsTitleEl) newsTitleEl.textContent = 'MARKET COMMENTARY \u00b7 ' + ccy;
    _hmLoadSessionNews(ccy); 

    const myPairs      = PAIR_DEFS.filter(p => p.base === ccy || p.quote === ccy);
    const activeSessions = getActiveSessions();   
    const activeSess   = currentSessionName();    

    let compositeSum = 0, compositeCnt = 0;
    myPairs.forEach(p => {
      const d = rtCache[p.id];
      if (!d || d.pct == null) return;
      compositeSum += d.pct * p.sign * (p.base === ccy ? 1 : -1);
      compositeCnt++;
    });
    const dayComposite = compositeCnt > 0 ? compositeSum / compositeCnt : null;

    const volShare = { 'New York': '38%', 'London': '35%', 'Tokyo': '18%', 'Sydney': '9%' };

    const sessionData = getOrderedSessions().map(sess => {
      const barState = getBarSessionState(sess);
      const showBar  = barState === 'active' || barState === 'past';
      const pct = showBar ? dayComposite : null;
      return { ...sess, pct, barState, isActive: barState === 'active' };
    });

    const grid = document.createElement('div');
    grid.className = 'sess-grid';

    const compositePos = dayComposite != null && dayComposite >= 0;
    const barClr = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#4f7fff';

    sessionData.forEach(s => {
      const lbl = document.createElement('div');
      lbl.className = 'sess-lbl';

      let labelText = s.name.toUpperCase();
      if (s.barState === 'active') {
        labelText += ' \u25CF';        
      } else if (s.barState === 'upcoming' && !weekend) {
        labelText += ' \u25CB';        
      }
      lbl.textContent = labelText;

      const track = document.createElement('div');
      track.className = 'sess-track';

      const val = document.createElement('div');

      if (s.barState === 'upcoming' || s.pct == null) {
        lbl.style.cssText = 'opacity:.35;color:var(--orange,#f6941c)';
        track.style.opacity = '0.08';
        val.className = 'sess-val flat';
        val.style.cssText = 'opacity:.35;font-size:9px;color:var(--text3,#6b7280)';
        val.textContent = utcHourToLocalStr(s.utcStart);  
      } else {
        const fill = document.createElement('div');
        fill.className = 'sess-fill';
        const isActive  = s.barState === 'active' && !weekend;
        const dimBar    = !isActive;
        const fillWidth = isActive ? (getSessionProgress(s) * 100).toFixed(1) + '%' : '100%';
        fill.style.cssText = 'width:' + fillWidth + ';background:' + barClr +
          (dimBar ? ';opacity:.30' : ';opacity:.70');
        track.appendChild(fill);
        val.className = 'sess-val ' + (compositePos ? 'up' : 'down');
        val.textContent = fmt2(s.pct);
        if (dimBar) {
          val.style.opacity = '0.55';
          lbl.style.opacity = '0.55';
        }
      }

      grid.appendChild(lbl);
      grid.appendChild(track);
      grid.appendChild(val);
    });

    const dataNote = document.createElement('div');
    dataNote.style.cssText = 'font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono,\'JetBrains Mono\',\'Courier New\',monospace);letter-spacing:.02em;margin-top:6px;opacity:.7';
    dataNote.textContent = 'Day % vs prev close \xb7 session-specific OHLC not available';

    const content = document.getElementById('hm-sess-content');
    content.innerHTML = '';
    content.appendChild(grid);
    content.appendChild(dataNote);

    const notes = document.getElementById('hm-sess-notes');
    const _now    = new Date();
    const localHH = String(_now.getHours()).padStart(2,'0');
    const localMM = String(_now.getMinutes()).padStart(2,'0');
    const localStr = localHH + ':' + localMM;

    if (weekend) {
      const aiSessionNotes = _sessionCtxCache && _sessionCtxCache.sessions
        ? _sessionCtxCache.sessions[ccy]
        : null;

      if (aiSessionNotes && Object.keys(aiSessionNotes).length >= 3) {
        const weekendLabels = {
          'Sydney':   'FRI CLOSE',
          'Tokyo':    'WEEKLY',
          'London':   'CATALYST',
          'New York': 'MON OPEN',
        };
        const sessOrder = ['Sydney', 'Tokyo', 'London', 'New York'];
        notes.innerHTML = sessOrder.map(sName => {
          const note   = convertUtcTimesInNote(aiSessionNotes[sName] || '—');
          const wLabel = weekendLabels[sName] || sName.toUpperCase();
          return (
            '<div style="margin-bottom:5px">' +
            '<span style="color:var(--text3,#6b7280);min-width:72px;display:inline-block;' +
            'font-size:9px;letter-spacing:.04em;font-weight:600">' +
            wLabel + '</span> ' +
            '<span style="color:var(--text2,#787b86)">' + note + '</span>' +
            '</div>'
          );
        }).join('') +
        '<div style="margin-top:8px;font-size:9px;color:var(--text3,#6b7280);' +
        'font-family:var(--font-mono);letter-spacing:.03em;">' +
        'AI Analytics \xb7 Weekly recap \xb7 Resumes at Sunday 21:00 UTC</div>';
      } else {
        notes.innerHTML =
          '<div style="font-size:10px;color:var(--text3,#6b7280);' +
          'font-family:var(--font-mono,\'JetBrains Mono\',\'Courier New\',monospace);line-height:1.6;">' +
          'Weekly recap generating\u2026 Check back shortly.' +
          '<br>Session context resumes at Sunday 21:00 UTC (Sydney open).' +
          '</div>';
      }
      return;
    }

    const aiSessionNotes = _sessionCtxCache && _sessionCtxCache.sessions
      ? _sessionCtxCache.sessions[ccy]
      : null;

    if (aiSessionNotes && Object.keys(aiSessionNotes).length >= 3) {
      const sessOrder = getOrderedSessions().map(s => s.name);
      notes.innerHTML = sessOrder.map(sName => {
        const sess  = SESSIONS.find(s => s.name === sName);
        const state = getBarSessionState(sess);
        const aiNote = convertUtcTimesInNote(aiSessionNotes[sName] || '\u2014');

        const labelColor = state === 'active'   ? 'var(--blue,#4f7fff)'
                         : state === 'past'      ? 'var(--text3,#6b7280)'
                         :                         'var(--orange,#f6941c)';
        const textColor  = state === 'active'   ? 'var(--text,#d1d4dc)'
                         : state === 'past'      ? 'var(--text3,#6b7280)'
                         :                         'var(--text3,#6b7280)';
        const labelDot   = state === 'active'   ? ' \u25CF'    
                         : state === 'upcoming' ? ' \u25CB'    
                         :                        '';

        const stateChip  = state === 'active'
          ? '<span style="font-size:8px;background:rgba(79,127,255,.15);color:var(--blue,#4f7fff);border-radius:2px;padding:1px 4px;letter-spacing:.07em;font-weight:700;margin-left:6px;vertical-align:middle">LIVE</span>'
          : state === 'past'
          ? '<span style="font-size:8px;color:var(--text3,#6b7280);letter-spacing:.07em;opacity:.6;margin-left:6px;vertical-align:middle">CLOSED</span>'
          : '<span style="font-size:8px;background:rgba(246,148,28,.10);color:var(--orange,#f6941c);border-radius:2px;padding:1px 4px;letter-spacing:.07em;opacity:.8;margin-left:6px;vertical-align:middle">UPCOMING</span>';

        const displayNote = state === 'upcoming'
          ? '<span style="color:var(--text3,#6b7280);font-style:italic">Opens ' + utcHourToLocalStr(sess.utcStart) + ' ' + localTzAbbr() + '</span>'
          : aiNote;

        return (
          '<div style="margin-bottom:7px">' +
          '<div style="margin-bottom:2px">' +
          '<span style="color:' + labelColor + ';font-weight:' + (state === 'active' ? '700' : '500') + ';letter-spacing:.04em;font-size:10px">' +
          sName.toUpperCase() + labelDot + '</span>' + stateChip +
          '</div>' +
          '<div style="color:' + textColor + ';padding-left:2px;font-size:11px;' + (state === 'upcoming' ? 'opacity:.6' : '') + '">' +
          displayNote +
          '</div>' +
          '</div>'
        );
      }).join('') +
      '<div style="margin-top:6px;font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono);letter-spacing:.03em;border-top:1px solid rgba(255,255,255,.05);padding-top:6px">' +
      'AI Analytics \xb7 ' + (_sessionCtxCache && _sessionCtxCache.generated_at
        ? (() => {
            const d = new Date(_sessionCtxCache.generated_at);
            const hh = String(d.getUTCHours()).padStart(2,'0');
            const mm = String(d.getUTCMinutes()).padStart(2,'0');
            return 'Updated ' + hh + ':' + mm + ' UTC';
          })()
        : '~2h refresh') +
      ' &nbsp;|&nbsp; ' + tzAbbr + ' ' + localStr + '</div>';
    } else {
      notes.innerHTML =
        `Active session: <span class="up">${activeSess}</span> &nbsp;|&nbsp; ` +
        `${tzAbbr} ${localStr}<br>` +
        `Session attribution weighted by typical volume distribution.<br>` +
        `Intraday strength: <span class="${pctClass(0)}" id="hm-sess-intra">—</span>`;

      let sum = 0, cnt = 0;
      myPairs.forEach(p => {
        const d = rtCache[p.id];
        if (!d || d.pct == null) return;
        const impact = d.pct * p.sign * (p.base === ccy ? 1 : -1);
        sum += impact; cnt++;
      });
      const intra = cnt > 0 ? sum / cnt : null;
      const el = document.getElementById('hm-sess-intra');
      if (el && intra != null) {
        el.textContent = fmt2(intra);
        el.className   = pctClass(intra);
      }
    }
  }

  function populateMacroDrivers(ccy) {
    const titleEl = document.getElementById('hm-catalyst-title');
    if (titleEl) titleEl.textContent = ccy + ' MACRO DRIVERS';

    const catalystEl = document.getElementById('hm-catalyst');
    if (!catalystEl) return;
    const ccyCatalyst = (_catalystsCache && _catalystsCache.currencies)
      ? _catalystsCache.currencies[ccy]
      : null;
    if (ccyCatalyst && ccyCatalyst.catalyst) {
      const sources = Array.isArray(ccyCatalyst.sources) ? ccyCatalyst.sources : [];
      const sourcesHtml = sources.length
        ? `<div style="margin-top:6px;font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono);line-height:1.6;">
             Sources: ${sources.slice(0,4).map(s =>
               `<a href="${s.url}" target="_blank" rel="noopener noreferrer" style="color:var(--text3,#6b7280);text-decoration:underline;">${(s.title||s.url).slice(0,40)}</a>`
             ).join(' · ')}
           </div>`
        : '';
      catalystEl.innerHTML = `
        <div style="font-size:11px;color:var(--text2,#787b86);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);line-height:1.6;">
          ${ccyCatalyst.catalyst}
        </div>
        ${sourcesHtml}
        <div style="margin-top:4px;font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono);letter-spacing:.03em;">AI Analytics · updated 1×/day</div>
      `;
    } else {
      catalystEl.innerHTML = '<div style="font-size:11px;color:var(--text3,#6b7280);font-family:var(--font-mono)">No macro driver data available yet</div>';
    }
  }

  function populateCorrelations(ccy, strengths, rtCache) {
    document.getElementById('hm-drivers-title').textContent =
      ccy + ' STRENGTH DRIVERS · TOP 3 PAIRS BY CONTRIBUTION';

    const ccys = ['EUR','GBP','JPY','AUD','CHF','CAD','NZD','USD','NOK','SEK'];

    const pctMap = {};
    strengths.forEach(s => { pctMap[s.ccy] = s.pct; });

    function corrCellClass(diff) {
      if (diff == null) return 'corr-cell-flat';
      if (diff >=  0.40) return 'corr-cell-pos-hi';
      if (diff >=  0.06) return 'corr-cell-pos';
      if (diff <= -0.40) return 'corr-cell-neg-hi';
      if (diff <= -0.06) return 'corr-cell-neg';
      return 'corr-cell-flat';
    }
    function corrFmt(v) {
      if (v == null) return '—';
      if (Math.abs(v) < 0.005) return '0';
      return (v > 0 ? '+' : '') + v.toFixed(2);
    }

    const matrix = document.getElementById('hm-corr-matrix');
    const wrap   = document.createElement('div');
    wrap.className = 'corr-wrap';

    const headerCells = `<th class="row-head" scope="col" title="Row − Column = strength differential. Positive = row currency outperforms column currency today.">Δ Strength (row − col)</th>` +
      ccys.map(c => `<th scope="col"${c === ccy ? ' class="focal"' : ''} style="cursor:pointer" title="Click to pivot this panel to ${c}" onclick="hmPivotCcy('${c}')">${c}</th>`).join('') +
      `<th scope="col" class="focal" title="Equal-weighted composite — avg % vs all ${ccys.length - 1} major currency peers">Comp.</th>`;

    const bodyRows = ccys.map(rowCcy => {
      const isFocalRow = rowCcy === ccy;
      const cells = ccys.map(colCcy => {
        if (rowCcy === colCcy) {
          const abs = pctMap[rowCcy] ?? 0;
          return `<td class="diag" data-diag="${rowCcy}" title="${rowCcy} composite: ${corrFmt(abs)}">${corrFmt(abs)}</td>`;
        }
        const diff = (pctMap[rowCcy] ?? 0) - (pctMap[colCcy] ?? 0);
        const cls  = corrCellClass(diff);
        const focalCls = (isFocalRow || colCcy === ccy) ? ' corr-cell-focal' : '';
        return `<td class="${cls}${focalCls}" data-r="${rowCcy}" data-c="${colCcy}" title="${rowCcy} vs ${colCcy}: ${corrFmt(diff)}">${corrFmt(diff)}</td>`;
      }).join('');

      const rowComp = pctMap[rowCcy] ?? 0;
      const compCls = corrCellClass(rowComp);
      const compFocalCls = isFocalRow ? ' corr-cell-focal' : '';
      const compCell = `<td class="${compCls} comp-col${compFocalCls}" data-comp-row="${rowCcy}" style="font-weight:700" title="${rowCcy} composite vs major currency peers: ${corrFmt(rowComp)}">${corrFmt(rowComp)}</td>`;

      return `<tr><td class="row-head${isFocalRow ? ' focal' : ''}" style="cursor:pointer" title="Click to pivot this panel to ${rowCcy}" onclick="hmPivotCcy('${rowCcy}')">${rowCcy}</td>${cells}${compCell}</tr>`;
    }).join('');

    const footCells = ccys.map(colCcy => {
      const cv  = pctMap[colCcy] ?? 0;
      const cls = corrCellClass(cv);
      const focalCls = colCcy === ccy ? ' corr-cell-focal' : '';
      return `<td class="${cls}${focalCls}" data-comp-col="${colCcy}" style="font-weight:700" title="${colCcy} composite vs major currency peers: ${corrFmt(cv)}">${corrFmt(cv)}</td>`;
    }).join('');
    const footRow = `<tr class="comp-row"><td class="row-head focal" style="font-size:9px">Comp.</td>${footCells}<td class="diag" style="font-size:9px">—</td></tr>`;

    const legend = `<div class="corr-legend">
      <span><span style="display:inline-block;width:10px;height:10px;background:rgba(38,166,154,.25);border-radius:2px;vertical-align:middle;margin-right:4px;"></span>Strong outperformance (Δ ≥ +0.40%)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:rgba(38,166,154,.10);border-radius:2px;vertical-align:middle;margin-right:4px;"></span>Mild outperformance (Δ ≥ +0.06%)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:rgba(239,83,80,.10);border-radius:2px;vertical-align:middle;margin-right:4px;"></span>Mild underperformance</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:rgba(239,83,80,.25);border-radius:2px;vertical-align:middle;margin-right:4px;"></span>Strong underperformance</span>
      <span style="color:var(--text3,#4e5c70)">Diagonal = intraday composite · Values = equal-weighted Δ%, not Pearson correlations</span>
    </div>`;

    wrap.innerHTML = `<table class="corr-matrix" aria-label="Intraday strength differential matrix G10 currencies">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}${footRow}</tbody>
    </table>`;

    matrix.innerHTML = '';
    matrix.appendChild(wrap);
    matrix.insertAdjacentHTML('beforeend', legend);

    const myPairs = PAIR_DEFS.filter(p => p.base === ccy || p.quote === ccy);
    const driven  = [];
    myPairs.forEach(p => {
      const d = rtCache[p.id];
      if (!d || d.pct == null) return;
      const impact = d.pct * p.sign * (p.base === ccy ? 1 : -1);
      const opp    = p.base === ccy ? p.quote : p.base;
      const label  = p.base === ccy ? (p.base+'/'+p.quote) : (p.quote+'/'+p.base);
      const canon  = p.base + '/' + p.quote;   
      driven.push({ label, opp, impact, canon });
    });
    driven.sort((a,b) => Math.abs(b.impact) - Math.abs(a.impact));
    const top3 = driven.slice(0,3);

    const driversEl = document.getElementById('hm-drivers');
    if (top3.length === 0) {
      driversEl.innerHTML = '<div style="font-size:11px;color:var(--text3,#6b7280);font-family:var(--font-mono)">No RT data available</div>';
      return;
    }

    const ccyNotes = (_driversCache && _driversCache.drivers && _driversCache.drivers[ccy])
      ? _driversCache.drivers[ccy]
      : null;
    const ccySources = (_driversCache && _driversCache.driver_sources && _driversCache.driver_sources[ccy])
      ? _driversCache.driver_sources[ccy]
      : [];

    const sourcesLine = (ccyNotes && ccySources.length)
      ? `<div style="margin-top:8px;font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono);line-height:1.6;">
           Sources: ${ccySources.slice(0,4).map(s =>
             `<a href="${s.url}" target="_blank" rel="noopener noreferrer" style="color:var(--text3,#6b7280);text-decoration:underline;">${(s.title||s.url).slice(0,36)}</a>`
           ).join(' · ')}
         </div>`
      : '';

    driversEl.innerHTML = top3.map((d,i) => {
      const cls    = pctClass(d.impact);
      const note   = ccyNotes ? (ccyNotes[d.label] || ccyNotes[d.canon] || null) : null;
      const noteEl = note
        ? `<div style="font-size:10.5px;color:var(--text2,#787b86);font-family:var(--font-mono);margin-top:4px;line-height:1.6;">${note}</div>`
        : '';
      return `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:${note ? 14 : 6}px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);">
        <div style="font-size:11px;font-weight:600;color:var(--text);width:70px;padding-top:1px;flex-shrink:0;">${d.label}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;font-weight:600" class="${cls}" data-driver-idx="${i}">${fmt2(d.impact)}</span>
            <span style="font-size:11px;color:var(--text2,#787b86)">vs ${d.opp}</span>
          </div>
          ${noteEl}
        </div>
      </div>`;
    }).join('') + sourcesLine + (ccyNotes
      ? `<div style="margin-top:4px;font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono);letter-spacing:.03em;">AI Analytics</div>`
      : '');
  }


  const CSI_COLORS = {
    EUR: '#4f7fff',  
    GBP: '#26a69a',  
    JPY: '#ef5350',  
    AUD: '#f6941c',  
    CAD: '#a78bfa',  
    CHF: '#34d399',  
    NZD: '#fb923c',  
    USD: '#94a3b8',  
    NOK: '#0097b2',  
    SEK: '#fecc00',  
  };

  const CCY_ORDER = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD','USD','NOK','SEK'];

  const PAIR_SIGN = {};
  PAIR_DEFS.forEach(p => { PAIR_SIGN[p.id] = p.sign; });

  function _csiBasePathForTf(tf) {
    if (tf === 'H1') return GI_DATA_BASE + 'ohlc-data/h1/';
    if (tf === 'H4') return GI_DATA_BASE + 'ohlc-data/h4/';
    return GI_DATA_BASE + 'ohlc-data/'; 
  }

  async function _loadCSIData(tf) {
    tf = tf || 'D1';
    const pairIds = PAIR_DEFS.map(p => p.id);
    const basePath = _csiBasePathForTf(tf);
    const fetches = pairIds.map(id =>
      fetch(basePath + id + '.json?_=' + Date.now())
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    );
    const allOHLC = await Promise.all(fetches);

    const pairRet = {};
    const allDates = new Set();

    pairIds.forEach((id, i) => {
      const bars = allOHLC[i];
      const p    = PAIR_DEFS[i];
      pairRet[id] = {};
      for (let j = 1; j < bars.length; j++) {
        const date = bars[j].time;
        const ret  = Math.log(bars[j].close / bars[j - 1].close);
        pairRet[id][date] = ret * p.sign;  
        allDates.add(date);
      }
    });

    const dates = [...allDates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const ccyDailyRet = {};
    const ccyDailyCov = {};
    CCY_ORDER.forEach(ccy => { ccyDailyRet[ccy] = {}; ccyDailyCov[ccy] = {}; });

    dates.forEach(date => {
      PAIR_DEFS.forEach(p => {
        const ret = pairRet[p.id][date];
        if (ret == null || isNaN(ret)) return;
        if (ccyDailyRet[p.base]) {
          ccyDailyRet[p.base][date] = (ccyDailyRet[p.base][date] || 0) + ret;
          ccyDailyCov[p.base][date] = (ccyDailyCov[p.base][date] || 0) + 1;
        }
        if (ccyDailyRet[p.quote]) {
          ccyDailyRet[p.quote][date] = (ccyDailyRet[p.quote][date] || 0) - ret;
          ccyDailyCov[p.quote][date] = (ccyDailyCov[p.quote][date] || 0) + 1;
        }
      });
    });

    const series = {};
    CCY_ORDER.forEach(ccy => {
      let cum = 0;
      series[ccy] = dates.map(date => {
        const sum = ccyDailyRet[ccy][date];
        const cov = ccyDailyCov[ccy][date];
        if (sum != null && cov) cum += sum / cov;
        return { time: date, value: parseFloat((cum * 100).toFixed(4)) };
      });
    });

    if (tf === 'W1') return _resampleCSIWeekly({ dates, series });
    return { dates, series };
  }

  function _resampleCSIWeekly(daily) {
    const { dates, series } = daily;
    if (!dates.length) return daily;

    function isoMonday(dateStr) {
      const d = new Date(dateStr + 'T00:00:00Z');
      const dow = d.getUTCDay() || 7; 
      if (dow !== 1) d.setUTCDate(d.getUTCDate() - (dow - 1));
      return d.toISOString().slice(0, 10);
    }

    const lastIdxForWeek = new Map();
    dates.forEach((date, i) => lastIdxForWeek.set(isoMonday(date), i));

    const weekKeys = [...lastIdxForWeek.keys()];
    const wSeries  = {};
    CCY_ORDER.forEach(ccy => {
      const allPts = series[ccy];
      if (!allPts) { wSeries[ccy] = []; return; }
      wSeries[ccy] = weekKeys
        .map(wk => {
          const pt = allPts[lastIdxForWeek.get(wk)];
          return pt ? { time: wk, value: pt.value } : null;
        })
        .filter(Boolean);
    });

    return { dates: weekKeys, series: wSeries };
  }


  function _csiLiveDateStr() {
    const now = new Date();
    if (now.getUTCHours() >= 21) {
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      return tomorrow.toISOString().slice(0, 10);
    }
    return now.toISOString().slice(0, 10);
  }

  function _computeCSILiveView() {
    if (!_csiData) return null;
    if (_csiTf !== 'D1') return _csiData;
    if (isMarketWeekend() || !_rtCache) return _csiData;

    const { dates, series } = _csiData;
    const liveDate     = _csiLiveDateStr();
    const lastHistDate = dates.length ? dates[dates.length - 1] : null;
    if (liveDate === lastHistDate) return _csiData;  

    const liveRet = {};
    CCY_ORDER.forEach(ccy => {
      const myPairs = PAIR_DEFS.filter(p => p.base === ccy || p.quote === ccy);
      let sum = 0, cnt = 0;
      myPairs.forEach(p => {
        const d = _rtCache[p.id];
        if (!d || !d.close || !d.prev_close || d.close <= 0 || d.prev_close <= 0) return;
        const ret = Math.log(d.close / d.prev_close) * p.sign;
        sum += (p.base === ccy ? ret : -ret);
        cnt++;
      });
      liveRet[ccy] = cnt > 0 ? (sum / cnt) : null;
    });

    const liveSeries = {};
    let anyLive = false;
    CCY_ORDER.forEach(ccy => {
      const hist = series[ccy] || [];
      if (liveRet[ccy] == null) { liveSeries[ccy] = hist; return; }
      const lastVal = hist.length ? hist[hist.length - 1].value : 0;
      const liveVal = parseFloat((lastVal + liveRet[ccy] * 100).toFixed(4));
      liveSeries[ccy] = hist.concat([{ time: liveDate, value: liveVal }]);
      anyLive = true;
    });

    if (!anyLive) return _csiData;  
    return { dates: dates.concat([liveDate]), series: liveSeries };
  }

  function _renderCSIChart(ccy) {
    const LWC = window.LightweightCharts;
    if (!LWC || !_csiData) return;
    const csiView = _csiDataLive || _csiData;

    const wrap      = document.getElementById('hm-csi-wrap');
    const chartEl   = document.getElementById('hm-csi-chart');
    const tooltipEl = document.getElementById('hm-csi-tooltip');
    if (!wrap || !chartEl) return;

    const allDates  = csiView.dates;
    const lastDate  = allDates.length ? allDates[allDates.length - 1] : null;
    const cutoffDate = _csiPeriodDays > 0 ? _csiCutoffDate(lastDate, _csiPeriodDays) : (allDates.length ? allDates[0] : null);

    if (_csiResizeObs) {
      try { _csiResizeObs.disconnect(); } catch(e) {}
      _csiResizeObs = null;
    }
    if (_csiChart) {
      try { _csiChart.remove(); } catch(e) {}
      _csiChart = null;
      chartEl.innerHTML = '';
    }
    _csiSeriesMap = {};

    const _csiBg    = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()    || '#131722';
    const _csiText2 = getComputedStyle(document.documentElement).getPropertyValue('--text2').trim() || '#9096a0';
    const _csiBlue  = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim()  || '#4f7fff';

    _csiChart = LWC.createChart(chartEl, {
      layout: {
        background: { color: _csiBg },
        textColor: _csiText2,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,.04)' },
        horzLines: { color: 'rgba(255,255,255,.04)' },
      },
      crosshair: {
        mode: LWC.CrosshairMode?.Normal ?? 1,
        vertLine: { color: 'rgba(255,255,255,.25)', style: 2, labelVisible: true },
        horzLine: { color: 'rgba(255,255,255,.15)', style: 2, labelVisible: true },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,.08)',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,.08)',
        timeVisible: (_csiTf === 'H1' || _csiTf === 'H4'), 
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      width: wrap.offsetWidth,
      height: 280,
    });

    if (typeof ResizeObserver !== 'undefined') {
      _csiResizeObs = new ResizeObserver(entries => {
        const cr = entries[0] && entries[0].contentRect;
        if (!cr || !_csiChart) return;
        const w = Math.floor(cr.width);
        if (w > 0) { try { _csiChart.applyOptions({ width: w }); } catch(e) {} }
      });
      _csiResizeObs.observe(wrap);
    }

    CCY_ORDER.forEach(c => {
      const isFocus = c === ccy;
      const allPts = csiView.series[c];
      const sliceIdx = allPts.findIndex(pt => pt.time >= cutoffDate);
      const baseVal  = sliceIdx >= 0 ? allPts[sliceIdx].value : 0;
      const raw = (sliceIdx >= 0 ? allPts.slice(sliceIdx) : allPts)
        .map(pt => ({ time: pt.time, value: parseFloat((pt.value - baseVal).toFixed(4)) }));
      const ls = _csiChart.addSeries(LWC.LineSeries, {
        color: CSI_COLORS[c],
        lineWidth: isFocus ? 2.5 : 1,
        lineStyle: 0,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: isFocus,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: _csiBg,
        crosshairMarkerBackgroundColor: CSI_COLORS[c],
      });
      ls.setData(raw);
      if (!isFocus) ls.applyOptions({ lineWidth: 1, color: CSI_COLORS[c] + 'aa' });
      _csiSeriesMap[c] = ls;
    });

    _csiChart.timeScale().fitContent();

    const firstSeries = _csiSeriesMap[CCY_ORDER[0]];
    if (firstSeries) {
      firstSeries.createPriceLine({
        price: 0,
        color: 'rgba(255,255,255,.20)',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: false,
        title: '',
      });
    }

  function _csiFormatTooltipTime(t) {
    if (typeof t === 'number') {
      const d = new Date(t * 1000);
      return d.toISOString().slice(0, 10) + ' ' + d.toISOString().slice(11, 16) + ' UTC';
    }
    if (t && typeof t === 'object' && t.year) {
      return t.year + '-' + String(t.month).padStart(2, '0') + '-' + String(t.day).padStart(2, '0');
    }
    return String(t);
  }

  _csiChart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !tooltipEl) {
        if (tooltipEl) tooltipEl.style.display = 'none';
        return;
      }
      const rows = CCY_ORDER.map(c => {
        const v = param.seriesData.get(_csiSeriesMap[c]);
        return { ccy: c, val: v ? v.value : null };
      }).filter(r => r.val != null).sort((a, b) => b.val - a.val);

      if (!rows.length) { tooltipEl.style.display = 'none'; return; }

      tooltipEl.innerHTML =
        '<div class="hm-csi-tt-date">' + _csiFormatTooltipTime(param.time) + '</div>' +
        rows.map(r => {
          const cls = r.val > 0 ? 'up' : r.val < 0 ? 'down' : 'flat';
          const dot = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + CSI_COLORS[r.ccy] + ';margin-right:5px;"></span>';
          return '<div class="hm-csi-tt-row">' +
            '<span class="hm-csi-tt-ccy">' + dot + r.ccy + '</span>' +
            '<span class="hm-csi-tt-val ' + cls + '">' +
              (r.val >= 0 ? '+' : '') + r.val.toFixed(2) + '%' +
            '</span></div>';
        }).join('');
      tooltipEl.style.display = 'block';

      const wrapRect = wrap.getBoundingClientRect();
      const x = param.point ? param.point.x : 0;
      const y = param.point ? param.point.y : 0;
      const ttW = 140, ttH = 20 + rows.length * 18;
      const left = (x + ttW + 20 > wrap.offsetWidth) ? (x - ttW - 10) : (x + 16);
      const top  = Math.max(0, Math.min(y - ttH / 2, wrap.offsetHeight - ttH));
      tooltipEl.style.left = left + 'px';
      tooltipEl.style.top  = top  + 'px';
    });

    _updateCSILegend(ccy, cutoffDate);
  }

  function _updateCSILegend(ccy, cutoffDate) {
    const legendEl = document.getElementById('hm-csi-legend');
    if (!legendEl || !_csiData) return;
    const csiView = _csiDataLive || _csiData;

    const vals = CCY_ORDER.map(c => {
      const allPts   = csiView.series[c];
      const sliceIdx = allPts.findIndex(pt => pt.time >= cutoffDate);
      if (sliceIdx < 0) return { ccy: c, val: null, change: null };
      const baseVal  = allPts[sliceIdx].value;
      const filtered = allPts.slice(sliceIdx).map(pt => pt.value - baseVal);
      const last  = filtered.length ? filtered[filtered.length - 1] : null;
      const first = 0; 
      return { ccy: c, val: last != null ? parseFloat(last.toFixed(4)) : null, change: last };
    }).sort((a, b) => (b.val ?? -99) - (a.val ?? -99));

    legendEl.innerHTML = vals.map(r => {
      const isFocus = r.ccy === ccy;
      const cls = r.val > 0 ? 'up' : r.val < 0 ? 'down' : 'flat';
      const valStr = r.val != null ? (r.val >= 0 ? '+' : '') + r.val.toFixed(2) + '%' : '—';
      return '<div class="hm-csi-leg" onclick="hmPivotCcy(\'' + r.ccy + '\')" style="cursor:pointer" title="Click to view ' + r.ccy + '">' +
        '<div class="hm-csi-leg-dot" style="background:' + CSI_COLORS[r.ccy] + ';' +
          (isFocus ? 'height:3px;' : '') + '"></div>' +
        '<span class="hm-csi-leg-lbl" style="' + (isFocus ? 'color:var(--text,#d1d4dc);font-weight:600;' : '') + '">' +
          r.ccy + '</span>' +
        '<span class="hm-csi-leg-val ' + cls + '">' + valStr + '</span>' +
      '</div>';
    }).join('');
  }

  function _renderCSIStats(ccy) {
    const statsEl = document.getElementById('hm-csi-stats');
    const titleEl = document.getElementById('hm-csi-stats-title');
    if (!statsEl || !_csiData) return;
    const csiView = _csiDataLive || _csiData;

    const allDates  = csiView.dates;
    const lastDate  = allDates.length ? allDates[allDates.length - 1] : null;
    const cutoffDate = _csiPeriodDays > 0 ? _csiCutoffDate(lastDate, _csiPeriodDays) : (allDates.length ? allDates[0] : null);

    const rows = CCY_ORDER.map(c => {
      const allPts   = csiView.series[c];
      const sliceIdx = allPts.findIndex(pt => pt.time >= cutoffDate);
      if (sliceIdx < 0) return { ccy: c, val: null, min: null, max: null, range: null };
      const baseVal = allPts[sliceIdx].value;
      const vals = allPts.slice(sliceIdx).map(pt => parseFloat((pt.value - baseVal).toFixed(4)));
      return {
        ccy: c,
        val: vals[vals.length - 1],
        min: Math.min(...vals),
        max: Math.max(...vals),
        range: Math.max(...vals) - Math.min(...vals),
      };
    }).sort((a, b) => (b.val ?? -99) - (a.val ?? -99));

    const periodLabel = _csiRange;
    if (titleEl) titleEl.textContent = 'CSI SNAPSHOT · ' + periodLabel + ' · ACCUMULATED RETURN';

    statsEl.innerHTML = '<table class="hm-tbl" aria-label="CSI period statistics">' +
      '<thead><tr>' +
      '<th scope="col">Currency</th>' +
      '<th scope="col">Accum. Return</th>' +
      '<th scope="col">Drawdown (low)</th>' +
      '<th scope="col">Peak (high)</th>' +
      '<th scope="col">Peak-to-Trough</th>' +
      '</tr></thead><tbody>' +
      rows.map(r => {
        const isFocus = r.ccy === ccy;
        const cls = r.val > 0 ? 'up' : r.val < 0 ? 'down' : 'flat';
        const fmt = v => v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—';
        return '<tr style="' + (isFocus ? 'background:rgba(79,127,255,.07);' : '') + '">' +
          '<td><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' +
            CSI_COLORS[r.ccy] + ';margin-right:6px;vertical-align:middle;"></span>' +
            '<span class="sym" style="' + (isFocus ? 'color:var(--blue,#4f7fff);' : '') + '">' + r.ccy + '</span></td>' +
          '<td class="' + cls + '">' + fmt(r.val) + '</td>' +
          '<td class="' + (r.min != null && r.min < 0 ? 'down' : r.min != null && r.min > 0 ? 'up' : 'flat') + '">' + fmt(r.min) + '</td>' +
          '<td class="' + (r.max != null && r.max > 0 ? 'up' : r.max != null && r.max < 0 ? 'down' : 'flat') + '">' + fmt(r.max) + '</td>' +
          '<td style="color:var(--text2,#787b86)">' + (r.range != null ? r.range.toFixed(2) + '%' : '—') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>' +
      '<div style="margin-top:8px;font-size:9px;color:var(--text3,#6b7280);font-family:var(--font-mono);letter-spacing:.03em;">' +
      (_CSI_TF_TITLE[_csiTf] || 'DAILY') + ' OHLC history · 32-pair G10 composite CSI · Accum. Return = total from period start · Drawdown/Peak = lowest/highest CSI value within period</div>';
  }

  async function populateCSI(ccy) {
    const loadingEl = document.getElementById('hm-csi-loading');

    if (!_csiData) {
      if (loadingEl) loadingEl.style.display = 'flex';

      if (!window.LightweightCharts) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/lightweight-charts@5.0.7/dist/lightweight-charts.standalone.production.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      try {
        _csiData = await _loadCSIData(_csiTf);
      } catch(e) {
        if (loadingEl) loadingEl.textContent = 'Failed to load OHLC data';
        return;
      }
    }

    if (loadingEl) loadingEl.style.display = 'none';

    _csiDataLive = _computeCSILiveView();

    _renderCSIChart(ccy);
    _renderCSIStats(ccy);
  }

  const _G10_ORDER = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'NOK', 'SEK'];
  let _hmAvailCcys = [];

  function _hmSetTitle(ccy) {
    const meta = CCY_META[ccy] || { flag: 'un', full: ccy };
    const titleRow = document.getElementById('hm-title-row');
    const titleEl  = document.getElementById('hm-title');
    titleEl.textContent = `\u2014 ${meta.full} Strength`;
    let flagSpan = titleRow.querySelector('.fi');
    if (!flagSpan) {
      flagSpan = document.createElement('span');
      flagSpan.style.cssText = 'border-radius:2px;font-size:15px;vertical-align:middle;flex-shrink:0;';
      titleRow.insertBefore(flagSpan, titleRow.firstChild); 
    }
    flagSpan.className = `fi fi-${meta.flag}`;
  }

  function _hmUpdateCcySwitcher(ccy) {
    const avail = _G10_ORDER.filter(c => (_strengths || []).some(s => s.ccy === c));
    _hmAvailCcys = avail.length ? avail : [ccy];
    const idx = _hmAvailCcys.indexOf(ccy);
    const chip = document.getElementById('hm-ccy-chip');
    const dd   = document.getElementById('hm-ccy-dd');
    const prev = document.getElementById('hm-ccy-prev');
    const next = document.getElementById('hm-ccy-next');
    if (chip) chip.textContent = ccy;
    if (dd) {
      dd.innerHTML = _hmAvailCcys.map(c =>
        `<button class="hm-ccy-dd-item ${c === ccy ? 'on' : ''}" role="option" aria-selected="${c === ccy}" onclick="hmPivotCcy('${c}')">${c}</button>`
      ).join('');
    }
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx === -1 || idx >= _hmAvailCcys.length - 1;
  }

  window.hmCycleCcy = function(dir) {
    if (!_hmAvailCcys.length || !_ccy) return;
    const idx = _hmAvailCcys.indexOf(_ccy);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= _hmAvailCcys.length) return;
    hmPivotCcy(_hmAvailCcys[nextIdx]);
  };

  window.hmToggleCcyDropdown = function(e) {
    e.stopPropagation();
    const dd = document.getElementById('hm-ccy-dd');
    const chip = document.getElementById('hm-ccy-chip');
    if (!dd) return;
    const open = dd.classList.toggle('open');
    if (chip) chip.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  function _hmCloseCcyDropdown() {
    const dd = document.getElementById('hm-ccy-dd');
    if (dd && dd.classList.contains('open')) {
      dd.classList.remove('open');
      document.getElementById('hm-ccy-chip')?.setAttribute('aria-expanded', 'false');
    }
  }


  window.openHeatmapModal = function(ccy, strengths, rtCache) {
    _ccy       = ccy;
    _strengths = strengths;
    _rtCache   = rtCache;

    buildModal();

    _hmSetTitle(ccy);
    _hmUpdateCcySwitcher(ccy);

    document.querySelectorAll('.hm-tab').forEach(t => {
      t.classList.toggle('on', t.dataset.tab === 'breakdown');
      t.setAttribute('aria-selected', t.dataset.tab === 'breakdown' ? 'true' : 'false');
    });
    document.querySelectorAll('.hm-panel').forEach(p => {
      p.classList.toggle('on', p.id === 'hm-p-breakdown');
    });

    populateMetrics(ccy, strengths, rtCache);
    populateBreakdown(ccy, strengths, rtCache);
    populateMacroDrivers(ccy); 
    fetchDrivers();        
    fetchCatalysts();      
    fetchSessionContext(); 

    _updateModalSourceLabels();

    const bd = document.getElementById('hm-bd');
    bd.style.display = 'flex';
    document.getElementById('hm-close').focus();
  };


  window.csiSetRange = function(btn, rangeKey) {
    if (_csiRange === rangeKey) return;
    const cfg = _CSI_RANGE_CONFIG.find(r => r.key === rangeKey);
    if (!cfg) return;
    _csiRange = rangeKey;
    const tfChanged = _csiTf !== cfg.tf;
    _csiTf = cfg.tf;
    _csiPeriodDays = cfg.days;

    document.querySelectorAll('#hm-csi-controls .hm-csi-btn').forEach(b => b.classList.toggle('on', b === btn));

    const titleEl = document.getElementById('hm-csi-title');
    if (titleEl) titleEl.textContent = 'CURRENCY STRENGTH INDEX · ACCUMULATED % RETURN · ' + (_CSI_TF_TITLE[cfg.tf] || 'DAILY') + ' OHLC';

    if (!_ccy) return;

    if (!tfChanged) {
      _csiDataLive = _computeCSILiveView();
      _renderCSIChart(_ccy);
      _renderCSIStats(_ccy);
      return;
    }

    const loadingEl = document.getElementById('hm-csi-loading');
    const chartEl   = document.getElementById('hm-csi-chart');
    if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.textContent = 'Loading OHLC data…'; }
    if (chartEl) chartEl.style.display = 'none';

    _loadCSIData(cfg.tf).then(data => {
      if (_csiRange !== rangeKey) return;
      _csiData = data;
      _csiDataLive = _computeCSILiveView();
      if (loadingEl) loadingEl.style.display = 'none';
      if (chartEl) chartEl.style.display = '';
      _renderCSIChart(_ccy);
      _renderCSIStats(_ccy);
    }).catch(() => {
      if (_csiRange !== rangeKey) return;
      if (loadingEl) loadingEl.textContent = 'Failed to load OHLC data';
    });
  };

  window.closeHeatmapModal = function() {
    const bd = document.getElementById('hm-bd');
    if (bd) bd.style.display = 'none';
    document.removeEventListener('keydown', _onKey);
    if (_csiResizeObs) { try { _csiResizeObs.disconnect(); } catch(e) {} _csiResizeObs = null; }
    if (_csiChart) { try { _csiChart.remove(); } catch(e) {} _csiChart = null; }
  };

  window.hmTab = function(el, tabId) {
    document.querySelectorAll('.hm-tab').forEach(t => {
      t.classList.toggle('on', t.dataset.tab === tabId);
      t.setAttribute('aria-selected', t.dataset.tab === tabId ? 'true' : 'false');
    });
    document.querySelectorAll('.hm-panel').forEach(p => {
      p.classList.toggle('on', p.id === 'hm-p-' + tabId);
    });

    if (tabId === 'session' && _ccy) {
      populateSession(_ccy, _rtCache);
    } else if (tabId === 'correlations' && _ccy) {
      populateCorrelations(_ccy, _strengths, _rtCache);
    } else if (tabId === 'csi' && _ccy) {
      populateCSI(_ccy);
    }
  };

  window.hmPivotCcy = function(newCcy) {
    if (!newCcy || newCcy === _ccy || !_strengths || !_rtCache) return;
    _ccy = newCcy;

    _hmSetTitle(newCcy);
    _hmUpdateCcySwitcher(newCcy);
    _hmCloseCcyDropdown();

    populateMetrics(newCcy, _strengths, _rtCache);
    populateBreakdown(newCcy, _strengths, _rtCache, true);
    populateMacroDrivers(newCcy); 
    populateCorrelations(newCcy, _strengths, _rtCache);
    const sessionPanel = document.getElementById('hm-p-session');
    if (sessionPanel && sessionPanel.classList.contains('on')) populateSession(newCcy, _rtCache);
    const csiPanel = document.getElementById('hm-p-csi');
    if (csiPanel && csiPanel.classList.contains('on')) populateCSI(newCcy);
  };

  function _updateModalSourceLabels() {
    const marketClosed = typeof window.isFxMarketClosedNow === 'function'
      ? window.isFxMarketClosedNow()
      : false;
    const hasLiveFeed = window.STOOQ_RT_CACHE
      ? Object.values(window.STOOQ_RT_CACHE).some(e => e?.fromLiveFeed)
      : false;
    const srcLabel = marketClosed
      ? 'Market Closed \u00b7 G10 composite \u00b7 32 pairs'
      : hasLiveFeed
        ? 'Live \u00b7 G10 composite \u00b7 32 pairs'
        : 'G10 composite \u00b7 32 pairs \u00b7 Delayed ~5min';
    const footerLabel = marketClosed
      ? 'Market Closed \u00b7 G10 composite \u00b7 32 pairs'
      : hasLiveFeed
        ? 'Live \u00b7 G10 composite \u00b7 32 pairs'
        : 'Delayed ~5min \u00b7 G10 composite \u00b7 32 pairs';
    const subEl    = document.getElementById('hm-sub');
    const footerEl = document.getElementById('hm-footer-meta');
    if (subEl)    subEl.textContent    = srcLabel;
    if (footerEl) footerEl.textContent = footerLabel;
  }

  function _updateBreakdownRT(ccy, strengths, rtCache) {
    const tbody = document.getElementById('hm-pair-tbody');
    if (!tbody || tbody.children.length === 0) {
      populateMetrics(ccy, strengths, rtCache);
      populateBreakdown(ccy, strengths, rtCache, true); 
      return;
    }

    const myPairs = PAIR_DEFS.filter(p => p.base === ccy || p.quote === ccy);
    const impacts = [];
    myPairs.forEach(p => {
      const d = rtCache[p.id];
      const isCcyBase = p.base === ccy;
      const opp = isCcyBase ? p.quote : p.base;
      const rawPct = d?.pct ?? null;
      const impact = rawPct != null ? rawPct * p.sign * (isCcyBase ? 1 : -1) : null;
      const raw1w  = d?.pct1w ?? null;
      const imp1w  = raw1w != null ? raw1w * p.sign * (isCcyBase ? 1 : -1) : null;
      const close  = isCcyBase ? (d?.close ?? null) : (d?.close != null ? 1/d.close : null);
      const open   = isCcyBase ? (d?.open  ?? null) : (d?.open  != null ? 1/d.open  : null);
      const hi     = isCcyBase ? (d?.high  ?? null) : (d?.high  != null ? 1/d.high  : null);
      const lo     = isCcyBase ? (d?.low   ?? null) : (d?.low   != null ? 1/d.low   : null);
      const label  = isCcyBase ? (p.base+'/'+p.quote) : (p.quote+'/'+p.base);
      impacts.push({ label, opp, close, open, hi, lo, impact, rawPct, imp1w });
    });
    impacts.sort((a,b) => (b.impact??-99) - (a.impact??-99));
    const maxImp = Math.max(...impacts.map(i => Math.abs(i.impact ?? 0)), 0.001);

    const rows = Array.from(tbody.querySelectorAll('tr[data-pair]'));
    const currentOrder = rows.map(r => r.dataset.pair);
    const newOrder = impacts.map(r => r.label);
    if (currentOrder.join(',') !== newOrder.join(',')) {
      populateMetrics(ccy, strengths, rtCache);
      populateBreakdown(ccy, strengths, rtCache, true); 
      return;
    }

    impacts.forEach(r => {
      const row = tbody.querySelector(`tr[data-pair="${r.label}"]`);
      if (!row) return;
      const iCls   = pctClass(r.impact);
      const barW   = r.impact != null ? Math.round(Math.abs(r.impact)/maxImp*100) : 0;
      const barClr = r.impact != null && r.impact >= 0 ? 'var(--up,#26a69a)' : 'var(--down,#ef5350)';
      const rng    = (r.hi != null && r.lo != null) ? fmtPrice(r.lo) + ' – ' + fmtPrice(r.hi) : '—';

      const closeCell  = row.querySelector('[data-cell="close"]');
      const openCell   = row.querySelector('[data-cell="open"]');
      const impactCell = row.querySelector('[data-cell="impact"]');
      const imp1wCell  = row.querySelector('[data-cell="imp1w"]');
      const barFill    = row.querySelector('[data-cell="bar"]');
      const rngCell    = row.querySelector('[data-cell="rng"]');

      if (closeCell)  closeCell.textContent  = fmtPrice(r.close);
      if (openCell)   openCell.textContent   = fmtPrice(r.open);
      if (impactCell) { impactCell.textContent = fmt2(r.impact); impactCell.className = iCls; }
      if (imp1wCell)  { imp1wCell.textContent  = r.imp1w != null ? fmt2(r.imp1w) : '—'; imp1wCell.className = pctClass(r.imp1w); }
      if (barFill)    { barFill.style.width = barW + '%'; barFill.style.background = barClr; }
      if (rngCell)    rngCell.textContent   = rng;
    });

    populateMetrics(ccy, strengths, rtCache);

    const container = document.getElementById('hm-ranking-rows');
    if (container) {
      const sorted    = [...strengths].sort((a,b) => b.pct - a.pct);
      const maxAbsPct = Math.max(...sorted.map(s => Math.abs(s.pct)), 0.001);
      sorted.forEach(s => {
        const rankRow = container.querySelector(`[data-rank-ccy="${s.ccy}"]`);
        if (!rankRow) return;
        const fillEl = rankRow.querySelector('.hm-rank-fill');
        const valEl  = rankRow.querySelector('[data-rank-val]');
        const fillW  = Math.round(Math.abs(s.pct) / maxAbsPct * 100);
        const cls    = 'hm-rank-fill ' + ((s.ccy === ccy) ? 'hl' : pctClass(s.pct));
        const newW   = fillW + '%';
        if (fillEl) {
          if (fillEl.style.width !== newW)    fillEl.style.width = newW;
          if (fillEl.className  !== cls)      fillEl.className   = cls;
        }
        if (valEl) {
          const newTxt = fmt2(s.pct);
          const newCls = 'hm-rank-val ' + pctClass(s.pct);
          if (valEl.textContent !== newTxt) valEl.textContent = newTxt;
          if (valEl.className   !== newCls) valEl.className   = newCls;
        }
      });
    }

    const cont1w = document.getElementById('hm-ranking-1w-rows');
    if (cont1w && cont1w.querySelector('[data-rank-ccy]')) {
      const ccys = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD','USD','NOK','SEK'];
      const w1map = {};
      ccys.forEach(c => { w1map[c] = { sum: 0, n: 0 }; });
      PAIR_DEFS.forEach(p => {
        const d = rtCache[p.id];
        if (!d || d.pct1w == null) return;
        const v = d.pct1w * p.sign;
        w1map[p.base].sum += v; w1map[p.base].n++;
        w1map[p.quote].sum -= v; w1map[p.quote].n++;
      });
      const w1strengths = ccys.map(c => ({ ccy: c, pct: w1map[c].n > 0 ? w1map[c].sum / w1map[c].n : null })).filter(s => s.pct != null);
      const maxAbs1w = Math.max(...w1strengths.map(s => Math.abs(s.pct)), 0.001);
      w1strengths.forEach(s => {
        const rankRow = cont1w.querySelector(`[data-rank-ccy="${s.ccy}"]`);
        if (!rankRow) return;
        const fillEl = rankRow.querySelector('.hm-rank-fill');
        const valEl  = rankRow.querySelector('[data-rank-val]');
        const fillW  = Math.round(Math.abs(s.pct) / maxAbs1w * 100);
        const cls    = 'hm-rank-fill ' + ((s.ccy === ccy) ? 'hl' : pctClass(s.pct));
        const newW   = fillW + '%';
        if (fillEl) {
          if (fillEl.style.width !== newW)    fillEl.style.width = newW;
          if (fillEl.className  !== cls)      fillEl.className   = cls;
        }
        if (valEl) {
          const newTxt = fmt2(s.pct);
          const newCls = 'hm-rank-val ' + pctClass(s.pct);
          if (valEl.textContent !== newTxt) valEl.textContent = newTxt;
          if (valEl.className   !== newCls) valEl.className   = newCls;
        }
      });
    }
  }

  function _updateCorrelationsRT(ccy, strengths, rtCache) {
    const matrix = document.getElementById('hm-corr-matrix');
    if (!matrix || !matrix.querySelector('[data-r]')) {
      populateCorrelations(ccy, strengths, rtCache);
      return;
    }

    const ccys = ['EUR','GBP','JPY','AUD','CAD','CHF','NZD','USD','NOK','SEK'];
    const pctMap = {};
    ccys.forEach(c => { pctMap[c] = null; });
    strengths.forEach(s => { pctMap[s.ccy] = s.pct; });

    function corrFmt(v) {
      if (v == null) return '—';
      if (Math.abs(v) < 0.005) return '0';
      return (v > 0 ? '+' : '') + v.toFixed(2);
    }
    function corrCellClass(diff) {
      if (diff == null) return 'corr-cell-flat';
      if (diff >=  0.40) return 'corr-cell-pos-hi';
      if (diff >=  0.06) return 'corr-cell-pos';
      if (diff <= -0.40) return 'corr-cell-neg-hi';
      if (diff <= -0.06) return 'corr-cell-neg';
      return 'corr-cell-flat';
    }

    matrix.querySelectorAll('td[data-r][data-c]').forEach(td => {
      const r = td.dataset.r, c = td.dataset.c;
      const diff = (pctMap[r] ?? 0) - (pctMap[c] ?? 0);
      const focalCls = (r === ccy || c === ccy) ? ' corr-cell-focal' : '';
      td.className = corrCellClass(diff) + focalCls;
      td.textContent = corrFmt(diff);
      td.title = `${r} vs ${c}: ${corrFmt(diff)}`;
    });

    matrix.querySelectorAll('td[data-diag]').forEach(td => {
      const r = td.dataset.diag;
      const abs = pctMap[r] ?? 0;
      td.textContent = corrFmt(abs);
      td.title = `${r} composite: ${corrFmt(abs)}`;
    });

    matrix.querySelectorAll('td[data-comp-row]').forEach(td => {
      const r = td.dataset.compRow;
      const v = pctMap[r] ?? 0;
      const focalCls = r === ccy ? ' corr-cell-focal' : '';
      td.className = corrCellClass(v) + ' comp-col' + focalCls;
      td.textContent = corrFmt(v);
      td.title = `${r} composite vs major currency peers: ${corrFmt(v)}`;
    });

    matrix.querySelectorAll('td[data-comp-col]').forEach(td => {
      const c = td.dataset.compCol;
      const v = pctMap[c] ?? 0;
      const focalCls = c === ccy ? ' corr-cell-focal' : '';
      td.className = corrCellClass(v) + focalCls;
      td.textContent = corrFmt(v);
      td.title = `${c} composite vs major currency peers: ${corrFmt(v)}`;
    });

    const driversEl = document.getElementById('hm-drivers');
    if (driversEl) {
      const myPairs = PAIR_DEFS.filter(p => p.base === ccy || p.quote === ccy);
      const driven  = [];
      myPairs.forEach(p => {
        const d = rtCache[p.id];
        if (!d || d.pct == null) return;
        const impact = d.pct * p.sign * (p.base === ccy ? 1 : -1);
        const opp    = p.base === ccy ? p.quote : p.base;
        const label  = p.base === ccy ? (p.base+'/'+p.quote) : (p.quote+'/'+p.base);
        driven.push({ label, opp, impact });
      });
      driven.sort((a,b) => Math.abs(b.impact) - Math.abs(a.impact));
      driven.slice(0,3).forEach((d,i) => {
        const pctEl = driversEl.querySelector(`[data-driver-idx="${i}"]`);
        if (pctEl) {
          pctEl.textContent = fmt2(d.impact);
          pctEl.className   = pctClass(d.impact);
        }
      });
    }
  }

  function _updateCSILiveBar() {
    if (!_csiChart || !_csiData || !_ccy) return;

    _csiDataLive = _computeCSILiveView();
    const csiView = _csiDataLive || _csiData;

    const allDates   = csiView.dates;
    const lastDate    = allDates.length ? allDates[allDates.length - 1] : null;
    const cutoffDate  = _csiPeriodDays > 0 ? _csiCutoffDate(lastDate, _csiPeriodDays) : (allDates.length ? allDates[0] : null);

    CCY_ORDER.forEach(c => {
      const ls = _csiSeriesMap[c];
      const allPts = csiView.series[c];
      if (!ls || !allPts || !allPts.length) return;
      const sliceIdx = allPts.findIndex(pt => pt.time >= cutoffDate);
      if (sliceIdx < 0) return;
      const baseVal = allPts[sliceIdx].value;
      const lastPt  = allPts[allPts.length - 1];
      ls.update({ time: lastPt.time, value: parseFloat((lastPt.value - baseVal).toFixed(4)) });
    });

    _updateCSILegend(_ccy, cutoffDate);
    _renderCSIStats(_ccy);
  }

  window._hmRefreshIfOpen = function(newStrengths, newRtCache) {
    const bd = document.getElementById('hm-bd');
    if (!bd || bd.style.display === 'none' || !_ccy) return;

    _strengths = newStrengths;
    _rtCache   = newRtCache;

    _updateModalSourceLabels();

    const activeTab = document.querySelector('.hm-tab.on');
    if (!activeTab) return;
    const tabId = activeTab.dataset.tab;

    if (tabId === 'breakdown') {
      _updateBreakdownRT(_ccy, _strengths, _rtCache);
    } else if (tabId === 'session') {
      populateSession(_ccy, _rtCache);
    } else if (tabId === 'correlations') {
      _updateCorrelationsRT(_ccy, _strengths, _rtCache);
    } else if (tabId === 'csi') {
      _updateCSILiveBar();
    }
  };

})();
