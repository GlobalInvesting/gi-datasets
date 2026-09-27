
(function () {
  if (document.getElementById('cot-modal2-css')) return;
  const s = document.createElement('style');
  s.id = 'cot-modal2-css';
  s.textContent = `
#cot-bd {
  display:block!important;
}


#cot-modal {
  width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;
  border-radius:0!important;border:none!important;box-shadow:none!important;animation:none!important;
  background:var(--bg)!important;position:static!important;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);color:var(--text);
  display:flex;flex-direction:column;
}
#cot-modal::before {
  display:none;
}
#cot-m-hd {
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 14px 9px;
  border-bottom:1px solid var(--border,#252d3d);
  flex-shrink:0;background:var(--bg2);
}
#cot-m-title { font-size:14px;font-weight:600;color:var(--text);letter-spacing:-.01em;line-height:1.2;font-family:var(--font-ui,'Inter',-apple-system,sans-serif); }
#cot-m-sub   { font-size:10px;color:var(--text2);margin-top:2px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);letter-spacing:.02em; }
#cot-m-close {
  background:none;border:none;color:var(--text3,#4e5c70);font-size:16px;
  cursor:pointer;padding:3px 6px;border-radius:3px;line-height:1;
  transition:color .1s,background .1s;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);
}
#cot-m-close:hover { color:var(--text);background:var(--bg3); }


#cot-m-title-row { display:flex;align-items:center;gap:5px; }
.cot-ccy-arrow {
  background:none;border:none;color:var(--text3,#4e5c70);font-size:11px;
  cursor:pointer;padding:2px 4px;border-radius:3px;line-height:1;
  transition:color .1s,background .1s;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);
}
.cot-ccy-arrow:hover { color:var(--text);background:var(--bg3); }
.cot-ccy-arrow:disabled { opacity:.3;cursor:default; }
.cot-ccy-arrow:disabled:hover { background:none;color:var(--text3,#4e5c70); }
#cot-ccy-switch { position:relative;display:inline-flex; }
#cot-ccy-chip {
  background:var(--bg3,#151b26);border:1px solid var(--border,#252d3d);border-radius:4px;
  color:var(--text);font-size:13px;font-weight:600;padding:1px 7px;cursor:pointer;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);letter-spacing:-.01em;
  display:inline-flex;align-items:center;gap:4px;transition:border-color .1s,background .1s;
}
#cot-ccy-chip:hover { border-color:var(--blue);background:var(--bg2); }
#cot-ccy-chip::after {
  content:'';width:0;height:0;margin-left:1px;
  border-left:3.5px solid transparent;border-right:3.5px solid transparent;
  border-top:4px solid var(--text3,#4e5c70);
}
#cot-ccy-dd {
  display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:20;
  background:var(--bg2);border:1px solid var(--border,#252d3d);border-radius:5px;
  box-shadow:0 6px 18px rgba(0,0,0,.4);padding:4px;min-width:64px;
  grid-template-columns:repeat(2,1fr);gap:2px;
}
#cot-ccy-dd.open { display:grid; }
.cot-ccy-dd-item {
  background:none;border:none;color:var(--text2);font-size:11px;font-weight:600;
  padding:5px 6px;border-radius:3px;cursor:pointer;text-align:center;
  font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);
  transition:color .1s,background .1s;
}
.cot-ccy-dd-item:hover { color:var(--text);background:var(--bg3); }
.cot-ccy-dd-item.on { color:var(--blue);background:var(--bg3); }
.cot-ccy-dd-item:disabled { opacity:.3;cursor:default; }
.cot-ccy-dd-item:disabled:hover { background:none;color:var(--text2); }
#cot-m-metrics {
  display:grid;grid-template-columns:repeat(6,1fr);
  border-bottom:1px solid var(--border,#252d3d);
  flex-shrink:0;
  background:var(--bg);
}
.cot-mm { padding:9px 14px;border-right:1px solid var(--border,#252d3d);display:flex;flex-direction:column;gap:1px; }
.cot-mm:last-child { border-right:none; }
.cot-mm-lbl { font-size:9px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.09em; }
.cot-mm-val { font-size:13px;font-weight:600;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);line-height:1;margin-top:2px; }
.cot-mm-sub { font-size:9px;color:var(--text2);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);margin-top:1px; }
#cot-m-tabs {
  display:flex;padding:0 14px;
  border-bottom:1px solid var(--border,#252d3d);
  flex-shrink:0;overflow-x:auto;scrollbar-width:none;
  background:var(--bg2);
}
#cot-m-tabs::-webkit-scrollbar { display:none; }
.cot-tab {
  font-size:11px;font-weight:500;padding:9px 13px;cursor:pointer;
  color:var(--text2);border-bottom:2px solid transparent;
  transition:color .12s;white-space:nowrap;user-select:none;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);
}
.cot-tab:hover { color:var(--text2); }
.cot-tab.on { color:var(--text);border-bottom-color:var(--blue); }
#cot-m-body {
  flex:1;min-height:0;overflow-y:auto;
  padding:0;
  display:flex;flex-direction:column;
  background:var(--bg);
  scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;
}
#cot-m-body::-webkit-scrollbar { width:3px!important; }
#cot-m-body::-webkit-scrollbar-track { background:transparent; }
#cot-m-body::-webkit-scrollbar-thumb { background:var(--border2,#2e3a50);border-radius:2px; }
#cot-m-body::-webkit-scrollbar-thumb:hover { background:var(--text2); }
#cot-m-body.cot-body--chart,
#cot-m-body.cot-body--overview { overflow-y:hidden; }
.cot-panel { display:none; }
.cot-panel.on { display:flex;flex:1;flex-direction:column;min-height:0; }
#p-history.on { display:block;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent; }
#p-history.on::-webkit-scrollbar { width:3px!important; }
#p-history.on::-webkit-scrollbar-thumb { background:var(--border2,#2e3a50);border-radius:2px; }
#p-overview.on { display:flex;flex:1;flex-direction:column;min-height:0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent; }
#p-overview.on::-webkit-scrollbar { width:3px!important; }
#p-overview.on::-webkit-scrollbar-thumb { background:var(--border2,#2e3a50);border-radius:2px; }

#p-overview .cot-ov-sec {
  display:flex;align-items:center;justify-content:space-between;
  padding:6px 14px 5px;
  border-top:1px solid var(--border2,#1e2636);
  border-bottom:1px solid var(--border2,#1e2636);
  background:var(--bg,#0d1117);
  flex-shrink:0;
}
#p-overview .cot-ov-sec:first-child { border-top:none; }
#p-overview .cot-ov-sec-lbl { font-size:8.5px;font-weight:600;color:var(--text3,#4e5c70);text-transform:uppercase;letter-spacing:.1em;font-family:var(--font-ui,'Inter',-apple-system,sans-serif); }
#p-overview .cot-ov-sec-note { font-size:8.5px;color:var(--text3,#4e5c70);opacity:.6;letter-spacing:.02em;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }

#p-overview .cot-ov-top-row { display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--border,#252d3d);flex-shrink:0; }
#p-overview .cot-ov-top-row > .cot-ov-half { padding:12px 14px; }
#p-overview .cot-ov-top-row > .cot-ov-half:first-child { border-right:1px solid var(--border,#252d3d); }

#p-overview .cot-kfv { display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid rgba(255,255,255,.04);min-height:28px;flex-shrink:0; }
#p-overview .cot-kfv:last-child { border-bottom:none; }
#p-overview .cot-kfv-key { font-size:10px;color:var(--text2,#8b949e);flex:1;min-width:0;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }
#p-overview .cot-kfv-bar { flex:0 0 80px;margin:0 10px;height:3px;background:rgba(255,255,255,.07);border-radius:2px;position:relative;flex-shrink:0; }
#p-overview .cot-kfv-bar-fill { position:absolute;left:0;top:0;height:100%;border-radius:2px; }
#p-overview .cot-kfv-val { font-size:11px;font-weight:600;text-align:right;flex-shrink:0;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }
#p-overview .cot-kfv-badge { font-size:8px;font-weight:700;letter-spacing:.06em;padding:2px 6px;border-radius:2px;margin-left:8px;flex-shrink:0;font-family:var(--font-ui,'Inter',-apple-system,sans-serif); }
.cot-badge-l { background:color-mix(in srgb, var(--up) 15%, transparent);color:var(--up); }
.cot-badge-s { background:color-mix(in srgb, var(--down) 15%, transparent);color:var(--down); }
.cot-badge-n { background:rgba(88,166,255,.1);color:#58a6ff; }
.cot-badge-w { background:rgba(243,156,18,.12);color:#f39c12; }

#p-overview .cot-ov-spark-row { padding:10px 0 12px;flex-shrink:0; }
#p-overview .cot-ov-spark-top { display:flex;justify-content:space-between;margin-bottom:8px;padding:0 14px; }
#p-overview .cot-ov-spark-trend { font-size:9px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }
#p-overview .cot-ov-spark-row .cot-spark { max-width:100%;width:100%;height:72px;display:block;box-sizing:border-box; }
#cot-ov-spark-lw { width:100%;max-width:100%!important;box-sizing:border-box;overflow:hidden; }

#p-net.on .cot-cw { min-height:0;margin-bottom:0;border-bottom:none;display:flex;flex-direction:column; }
#p-net.on .cot-cw > .cot-chart-area { flex:1;min-height:0;display:flex;flex-direction:column; }
#p-net.on .cot-cw > .cot-chart-area > .cot-lw-wrap { flex:1;min-height:0;height:100%; }
#p-split.on { display:flex;flex:1;flex-direction:column;min-height:0; }
#p-split.on .cot-cw > .cot-chart-area { flex:1;min-height:0;display:flex;flex-direction:column; }
#p-split.on .cot-cw > .cot-chart-area > .cot-lw-wrap { flex:1;min-height:0;height:100%; }
#p-participants .cot-chart-area { height:300px;position:relative; }
#p-participants.on { overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent; }
#p-participants.on::-webkit-scrollbar { width:3px!important; }
#p-participants.on::-webkit-scrollbar-thumb { background:var(--border2,#2e3a50);border-radius:2px; }
.cot-chart-area { position:relative;flex:1;min-height:0;display:flex;flex-direction:column; }
.cot-lw-wrap { width:100%;flex:1;min-height:180px;position:relative;min-width:0; }
.cot-lw-tooltip {
  position:absolute;display:none;pointer-events:none;
  background:var(--bg2);border:1px solid var(--border2);border-radius:4px;
  padding:7px 11px;font-size:11px;line-height:1.55;
  font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);
  color:var(--text);z-index:50;box-shadow:0 4px 16px rgba(0,0,0,.7);white-space:nowrap;
}
.cot-cw {
  background:var(--bg);
  border:none;
  border-radius:0;
  padding:14px;
  margin-bottom:0;
  border-bottom:1px solid var(--border,#252d3d);
  display:flex;flex-direction:column;
}
.cot-cw:last-child { border-bottom:none; }
.cot-ct {
  font-size:8.5px;color:var(--text3,#4e5c70);margin-bottom:10px;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);
  letter-spacing:.07em;flex-shrink:0;text-transform:uppercase;font-weight:600;
}
.cot-gauge-track { height:6px;background:rgba(255,255,255,.06);border-radius:3px;position:relative;margin:10px 0 6px; }
.cot-gauge-fill { position:absolute;left:0;top:0;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--down) 0%,var(--down) 20%,var(--orange) 20%,var(--orange) 27%,var(--blue) 27%,var(--blue) 73%,var(--orange) 73%,var(--orange) 80%,var(--up) 80%,var(--up) 100%);width:100%; }
.cot-gauge-pin {
  position:absolute;top:-4px;width:10px;height:10px;border-radius:50%;
  background:var(--text);border:2px solid var(--bg2);
  box-shadow:0 0 0 1px rgba(255,255,255,.2);
  transition:left .4s cubic-bezier(.25,.46,.45,.94);transform:translateX(-50%);
}
.cot-gauge-lbls { display:flex;justify-content:space-between;font-size:8px;color:var(--text2);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }
.cot-ov-bignum { font-size:24px;font-weight:700;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);margin:4px 0 2px; }
.cot-ov-sub { font-size:9px;color:var(--text2);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }
.cot-ls-row { display:flex;justify-content:space-between;align-items:center;gap:12px;margin:4px 0; }
.cot-ls-num { font-size:18px;font-weight:600;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }
.cot-ls-vs { font-size:11px;color:var(--text2);flex-shrink:0; }
.cot-ls-bar { height:4px;background:rgba(255,255,255,.06);border-radius:2px;position:relative;overflow:hidden;margin-top:8px; }
.cot-ls-bar-fill { height:100%;border-radius:2px; }
.cot-sig-dot { display:inline-block;border-radius:50%;width:8px;height:8px;flex-shrink:0; }
.cot-spark { display:block;width:100%;max-width:200px;overflow:visible; }
.cot-tbl { width:100%;border-collapse:collapse;font-size:11px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace); }
.cot-tbl thead th { text-align:right;color:var(--text2);font-weight:500;font-size:9px;text-transform:uppercase;letter-spacing:.08em;padding:7px 10px;border-bottom:1px solid var(--border2);white-space:nowrap; }
.cot-tbl thead th:first-child { text-align:left; }
.cot-tbl tbody tr { transition:background .08s; }
.cot-tbl tbody tr:nth-child(even) td { background:rgba(255,255,255,.015); }
.cot-tbl tbody tr:hover td { background:rgba(88,166,255,.05); }
.cot-tbl td { text-align:right;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:var(--text);vertical-align:middle;white-space:nowrap; }
.cot-tbl td:first-child { text-align:left;color:var(--text2); }
.cot-tbl tr:last-child td { border-bottom:none; }
.cot-tbl td.cu { color:var(--up); }
.cot-tbl td.cd { color:var(--down); }
.cot-tbl td.cn { color:var(--text2); }
.cu { color:var(--up); }
.cd { color:var(--down); }
.cn { color:var(--text2); }


#cot-net-legend { display:flex;align-items:center;justify-content:space-between;padding:0 14px 8px;flex-shrink:0; }
#cot-net-legend .cot-nl-items { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:9.5px;font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);color:var(--text2); }
#cot-net-legend .cot-nl-item { display:flex;align-items:center;gap:5px; }
#cot-net-legend .cot-nl-dot { display:inline-block;width:14px;height:3px;border-radius:2px; }
#cot-net-price-status { font-size:9px;color:var(--text3);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);transition:opacity .2s; }

#p-split .cot-oi-section { flex-shrink:0; }
.cot-oi-note { font-size:9px;color:var(--text3);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);margin-top:4px; }
@media (max-width:480px){
  #cot-modal{width:100%;height:93vh;border-radius:12px 12px 0 0;border-bottom:none;}
  #cot-m-metrics{grid-template-columns:repeat(3,1fr);}
  .cot-mm{padding:6px 10px;}.cot-mm-val{font-size:11px;}
  #cot-m-tabs{padding:0 8px;}.cot-tab{font-size:10px;padding:8px 8px;}
  #cot-m-body{padding:0;}.cot-cw{padding:10px 12px;}
  #p-overview .cot-ov-top-row{grid-template-columns:1fr;}
  #p-overview .cot-ov-top-row > .cot-ov-half:first-child{border-right:none;border-bottom:1px solid var(--border,#252d3d);}
  #p-overview .cot-kfv-bar{flex:0 0 50px;}
  .cot-ls-vs{display:block !important;text-align:center;}
  #p-history .cot-cw > div{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  #p-history .cot-tbl{min-width:540px;font-size:9px;}
  #p-history .cot-tbl th,#p-history .cot-tbl td{padding:4px 5px;}
  #p-participants .cot-chart-area{height:260px;}
  #p-overview{flex:none;}
  #p-overview .cot-ov-bignum{font-size:20px !important;}
  .cot-gauge-lbls{font-size:7.5px;}.cot-ls-num{font-size:16px !important;}
  .cot-tbl{min-width:0;}.cot-tbl td,.cot-tbl th{font-size:9px;padding:4px 5px;white-space:nowrap;}
}
`;
  document.head.appendChild(s);
})();

const _monoF = "'JetBrains Mono','Courier New',monospace";

function _cotTC(cssVar, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || fallback;
}
function _cotTCA(cssVar, alpha, fallback) {
  return (_cotTC(cssVar, fallback) + alpha);
}

function _cotFmt(v) {
  if (v == null || isNaN(v)) return '—';
  return (v > 0 ? '+' : '') + Math.round(v).toLocaleString();
}
function _cotCls(v) {
  if (v == null || isNaN(v) || Math.abs(v) < 1) return '';
  return v > 0 ? 'cu' : 'cd';
}
function _calcZ(history) {
  const vals = history.map(h => h.levNet ?? ((h.levLong||0)-(h.levShort||0))).filter(v=>v!=null);
  if (vals.length < 4) return null;
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const std  = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/(vals.length-1));
  if (std < 1) return null;
  return (vals[vals.length-1]-mean)/std;
}
function _calcPct(history) {
  const vals = history.map(h => h.levNet ?? ((h.levLong||0)-(h.levShort||0))).filter(v=>v!=null);
  if (vals.length < 4) return null;
  const cur = vals[vals.length-1];
  return Math.round(vals.filter(v=>v<=cur).length/vals.length*100);
}
function _cotPartRow(label,long_,short_,net,wow){
  const total=(long_||0)+(short_||0);
  const lPct=total>0&&long_!=null?Math.round(long_/total*100):null;
  return `<tr>
    <td>${label}</td>
    <td>${long_!=null?Math.round(long_).toLocaleString():'—'}</td>
    <td>${short_!=null?Math.round(short_).toLocaleString():'—'}</td>
    <td class="${_cotCls(net)}">${_cotFmt(net)}</td>
    <td>${lPct!=null?lPct+'%':'—'}</td>
    <td class="${_cotCls(wow)}">${_cotFmt(wow)}</td>
  </tr>`;
}
function _posLabel(z) {
  if (z == null) return {txt:'—',col:_cotTC('--text2','#8b949e')};
  if (z >  2)   return {txt:'Extreme Long',  col:_cotTC('--down','#ef5350')};
  if (z >  1.5) return {txt:'Crowded Long',  col:_cotTC('--orange','#ff9800')};
  if (z >  0.5) return {txt:'Long',          col:_cotTC('--up','#26a69a')};
  if (z > -0.5) return {txt:'Neutral',        col:_cotTC('--text2','#8b949e')};
  if (z > -1.5) return {txt:'Short',          col:_cotTC('--up','#26a69a')};
  if (z > -2)   return {txt:'Crowded Short',  col:_cotTC('--orange','#ff9800')};
  return {txt:'Extreme Short',col:_cotTC('--down','#ef5350')};
}

function _cotSparkline(history, nWeeks) {
  const vals = history.slice(-nWeeks).map(h => h.levNet ?? ((h.levLong||0)-(h.levShort||0)));
  if (vals.length < 2) return '<div style="height:72px;display:flex;align-items:center;font-size:9px;color:var(--text3)">Insufficient data</div>';

  const last = vals[vals.length - 1];
  const isPos = last >= 0;
  const lineCol = isPos ? _cotTC('--up','#26a69a') : _cotTC('--down','#ef5350');
  const fillCol = isPos ? _cotTCA('--up','2e','#26a69a') : _cotTCA('--down','2e','#ef5350'); 

  const W = 1000, H = 72; 
  const PAD = { t: 6, b: 6, l: 14, r: 14 }; 
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const n = vals.length;
  const xOf = i => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const yOf = v => PAD.t + (1 - (v - minV) / range) * (H - PAD.t - PAD.b);

  const pts = vals.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
  const firstX = xOf(0).toFixed(1), lastX = xOf(n-1).toFixed(1), baseY = (H - PAD.b).toFixed(1);

  const areaPts = `${firstX},${baseY} ${pts} ${lastX},${baseY}`;

  const dotX = xOf(n-1).toFixed(1), dotY = yOf(last).toFixed(1);
  const dotBg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#131722';

  return `<svg id="cot-ov-spark-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
    style="width:100%;height:72px;display:block;overflow:visible;"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cot-spark-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lineCol}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${lineCol}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="${areaPts}" fill="url(#cot-spark-grad)" stroke="none"/>
    <polyline points="${pts}" fill="none" stroke="${lineCol}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${dotX}" cy="${dotY}" r="4" fill="${lineCol}" stroke="${dotBg}" stroke-width="1.5"/>
  </svg>`;
}

function _buildSparklineChart(container, history, nWeeks) {
}

function _cotTrendLabel(history) {
  const n = Math.min(history.length,4);
  if (n<2) return '—';
  const recent = history.slice(-n).map(h=>h.levNet??((h.levLong||0)-(h.levShort||0)));
  let up=0,dn=0;
  for(let i=1;i<recent.length;i++){if(recent[i]>recent[i-1])up++;else if(recent[i]<recent[i-1])dn++;}
  if (up===n-1) return 'Accumulating · '+(n-1)+' consecutive '+(n-1===1?'week':'weeks');
  if (dn===n-1) return 'Distributing · '+(n-1)+' consecutive '+(n-1===1?'week':'weeks');
  return 'Mixed';
}

function _cotRangeCard(history, current) {
  const vals = history.map(h=>h.levNet??((h.levLong||0)-(h.levShort||0))).filter(v=>v!=null);
  if (vals.length<2) return '<div style="font-size:9px;color:var(--text3,#6e7681)">Insufficient data</div>';
  const hi=Math.max(...vals),lo=Math.min(...vals);
  const pct = hi!==lo?Math.round((current-lo)/(hi-lo)*100):50;
  const bar=`<div style="margin:10px 0 8px;height:6px;background:rgba(255,255,255,.06);border-radius:3px;position:relative;">
    <div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:var(--up);border-radius:3px;"></div>
    <div style="position:absolute;top:-4px;left:calc(${pct}% - 5px);width:10px;height:10px;border-radius:50%;background:#e6edf3;border:2px solid #161b22;box-shadow:0 0 0 1px rgba(255,255,255,.2)"></div>
  </div>`;
  const rows=[{label:vals.length+'w High',val:hi,cls:'cu'},{label:'Current',val:current,cls:_cotCls(current)},{label:vals.length+'w Low',val:lo,cls:'cd'}];
  return bar+rows.map(r=>`<div style="display:flex;justify-content:space-between;align-items:baseline;font-family:${_monoF};padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);">
    <span style="font-size:11px;color:var(--text3,#6e7681)">${r.label}</span>
    <span style="font-size:14px;font-weight:600" class="${r.cls}">${_cotFmt(r.val)}</span>
  </div>`).join('');
}

function _cotSignalSummary(net, amNet, ddNet, aligned, isCrowded) {
  const signals=[];
  const _up=_cotTC('--up','#26a69a'), _dn=_cotTC('--down','#ef5350'), _or=_cotTC('--orange','#ff9800'), _t2=_cotTC('--text2','#8b949e');
  if(net>0) signals.push({col:_up,text:'LF net long — bullish signal'});
  else if(net<0) signals.push({col:_dn,text:'LF net short — bearish signal'});
  else signals.push({col:_t2,text:'LF neutral'});
  if(amNet!=null){
    if(aligned) signals.push({col:_up,text:'LF/AM aligned — reinforced'});
    else signals.push({col:_or,text:'LF/AM diverging — exercise caution'});
  }
  if(isCrowded) signals.push({col:_or,text:'Crowded trade (z >= 1.5σ)'});
  else signals.push({col:_up,text:'Not crowded (z < 1.5σ)'});
  if(ddNet!=null){
    const contra=(net>0&&ddNet<0)||(net<0&&ddNet>0);
    if(contra) signals.push({col:_or,text:'Dealers contra-positioned'});
    else signals.push({col:_t2,text:'Dealers aligned with LF'});
  }
  return signals.map(s=>`<div style="display:flex;align-items:center;gap:8px;font-size:11px;font-family:${_monoF};padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);">
    <span class="cot-sig-dot" style="background:${s.col}"></span>
    <span style="color:${_t2}">${s.text}</span>
  </div>`).join('');
}

const _COT_SPOT = {
  AUD: { file: 'audusd', inv: false },
  EUR: { file: 'eurusd', inv: false },
  GBP: { file: 'gbpusd', inv: false },
  JPY: { file: 'usdjpy', inv: true  },
  CHF: { file: 'usdchf', inv: true  },
  CAD: { file: 'usdcad', inv: true  },
  NZD: { file: 'nzdusd', inv: false },
  NOK: { file: 'usdnok', inv: true  },
  SEK: { file: 'usdsek', inv: true  },
  XAU:  { file: 'gold',   inv: false },
  XAG:  { file: 'silver', inv: false },
  WTI:  { file: 'wti',    inv: false },
  SPX:    { file: 'spx',     inv: false },
  DJ30:   { file: 'dji',     inv: false },
  NAS100: { file: 'nasdaq',  inv: false },
};

async function _fetchCOTSpot(ccy) {
  const cfg = _COT_SPOT[ccy];
  if (!cfg) return null;
  try {
    const resp = await fetch(`${GI_DATA_BASE}ohlc-data/${cfg.file}.json`);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const rows = await resp.json(); 
    return rows
      .map(r => (r.time && r.close) ? { time: r.time, value: cfg.inv ? 1 / r.close : r.close } : null)
      .filter(Boolean);
  } catch (_) { return null; }
}

function _cotSpotLabel(ccy, assetClass) {
  return assetClass === 'commodity' || assetClass === 'equityIndex' ? ccy : ccy + '/USD';
}


const _cotLwCharts=[];
function _destroyCOTCharts(){
  _cotLwCharts.forEach(c=>{try{c.remove();}catch(_){}});
  _cotLwCharts.length=0;
}

function _lwOpts(W,H){
  const cs=getComputedStyle(document.documentElement);
  const _bg=cs.getPropertyValue('--bg').trim()||'#131722';
  const _t2=cs.getPropertyValue('--text3').trim()||'#6e7681';
  const _border=cs.getPropertyValue('--border').trim()||'#2e2e2e';
  const _text2=cs.getPropertyValue('--text2').trim()||'#9096a0';
  const _grid=_border+'28'; 
  return {
    width:W,height:H,
    layout:{background:{type:'solid',color:_bg},textColor:_t2,fontFamily:_monoF,fontSize:10,attributionLogo:false},
    grid:{vertLines:{color:_grid},horzLines:{color:_grid}},
    crosshair:{
      mode:window.LightweightCharts?.CrosshairMode?.Normal??1,
      vertLine:{color:_text2+'55',style:2,labelVisible:false},
      horzLine:{color:_text2+'33',style:2,labelVisible:true},
    },
    rightPriceScale:{borderVisible:false,scaleMargins:{top:0.12,bottom:0.08}},
    timeScale:{borderVisible:false,lockVisibleTimeRangeOnResize:true,fixRightEdge:true},
    handleScroll:{mouseWheel:true,pressedMouseMove:true},
    handleScale:{mouseWheel:true,pinch:true},
    localization:{priceFormatter:v=>v!=null?Math.round(v).toLocaleString():'—'},
  };
}

function _mkTooltip(container,lwChart,getSeries,fmtFn){
  const tip=document.createElement('div');
  tip.className='cot-lw-tooltip';
  container.style.position='relative';
  container.appendChild(tip);
  const TW=200,TM=12;
  lwChart.subscribeCrosshairMove(param=>{
    if(!param?.point||!param.seriesData){tip.style.display='none';return;}
    const html=fmtFn(param);
    if(!html){tip.style.display='none';return;}
    tip.innerHTML=html;tip.style.display='block';
    const cW=container.offsetWidth,cx=param.point.x,cy=param.point.y,th=tip.offsetHeight||50;
    const tx=(cx+TM+TW<=cW-4)?cx+TM:cx-TM-TW;
    const ty=(cy-th-TM>=4)?cy-th-TM:cy+TM;
    tip.style.left=Math.max(0,tx)+'px';tip.style.top=Math.max(0,ty)+'px';
  });
}

function _lwResize(container,lwChart){
  const apply=()=>{
    requestAnimationFrame(()=>{
      const rect=container.getBoundingClientRect();
      const h=Math.round(rect.height)||container.offsetHeight||container.parentElement?.getBoundingClientRect().height||240;
      const w=Math.round(rect.width)||container.offsetWidth||600;
      if(lwChart&&w>0&&h>10)lwChart.applyOptions({width:w,height:h});
    });
  };
  if(window.ResizeObserver){const ro=new ResizeObserver(()=>apply());ro.observe(container);container._lwRo=ro;}
  window.addEventListener('resize',apply);container._lwResize=apply;
  setTimeout(apply,60);setTimeout(apply,200);setTimeout(apply,500);
  return apply;
}

function _lwDefaultWindow(chart, times, yearsBack) {
  yearsBack = yearsBack || 2;
  chart.timeScale().fitContent();
  if (!times || times.length < 2) return;
  const first = times[0], last = times[times.length - 1];
  if (!first || !last) return;
  const lastD = new Date(last + 'T00:00:00Z');
  if (isNaN(lastD.getTime())) return;
  const cutoff = new Date(lastD);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - yearsBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  if (cutoffStr <= first) return; 
  try { chart.timeScale().setVisibleRange({ from: cutoffStr, to: last }); } catch (_) {}
}

function _lwSyncTimeRanges(chartA, chartB, elA, elB) {
  if (!chartA || !chartB) return;
  let active = null; 
  const markA = () => { active = 'A'; };
  const markB = () => { active = 'B'; };
  if (elA) { elA.addEventListener('pointerdown', markA); elA.addEventListener('pointerenter', markA); elA.addEventListener('wheel', markA, { passive: true }); }
  if (elB) { elB.addEventListener('pointerdown', markB); elB.addEventListener('pointerenter', markB); elB.addEventListener('wheel', markB, { passive: true }); }
  let syncing = false;
  function relay(which, to, range) {
    if (active !== which || syncing || !range) return;
    syncing = true;
    try { to.timeScale().setVisibleRange(range); } catch (_) {}
    requestAnimationFrame(() => { syncing = false; });
  }
  chartA.timeScale().subscribeVisibleTimeRangeChange(range => relay('A', chartB, range));
  chartB.timeScale().subscribeVisibleTimeRangeChange(range => relay('B', chartA, range));
}

function _buildNetChart(container, dates, netData, ccy, meta) {
  meta = meta || { primaryAbbr: 'LF' };
  const LWC = window.LightweightCharts; if (!LWC || !container) return null;
  const W = container.offsetWidth || 600, H = container.offsetHeight || container.parentElement?.offsetHeight || 280;
  const opts = _lwOpts(W, H);
  const chart = LWC.createChart(container, opts);
  _cotLwCharts.push(chart);
  const _up = _cotTC('--up', '#26a69a'), _dn = _cotTC('--down', '#ef5350');
  const hist = chart.addSeries(LWC.HistogramSeries, {
    color: '#4f7fff', priceLineVisible: false, lastValueVisible: true, base: 0,
  });
  hist.setData(dates.map((d, i) => ({ time: d, value: netData[i] ?? 0, color: (netData[i] ?? 0) >= 0 ? (_up + 'd1') : (_dn + 'd1') })));
  _lwDefaultWindow(chart, dates, 1);
  _lwResize(container, chart);
  _mkTooltip(container, chart, () => hist, param => {
    const v = param.seriesData.get(hist); if (!v) return null;
    const col = v.value >= 0 ? _cotTC('--up', '#26a69a') : _cotTC('--down', '#ef5350');
    return `<div style="font-size:9px;color:var(--text3,#6e7681);margin-bottom:4px;">${typeof param.time === 'string' ? param.time : ''}</div>` +
      `<div>${ccy} ${meta.primaryAbbr} Net &nbsp;<span style="color:${col};font-weight:700">${_cotFmt(v.value)}</span></div>`;
  });
  return chart;
}

function _buildOIChart(container, dates, oiData, ccy, meta) {
  meta = meta || { primaryAbbr: 'LF' };
  const LWC = window.LightweightCharts; if (!LWC || !container) return null;
  const W = container.offsetWidth || 600, H = container.offsetHeight || container.parentElement?.offsetHeight || 160;
  const chart = LWC.createChart(container, _lwOpts(W, H));
  _cotLwCharts.push(chart);
  const _bl = _cotTC('--blue', '#4f7fff');
  const oiS = chart.addSeries(LWC.AreaSeries, {
    lineColor: _bl + 'bb', topColor: _bl + '28', bottomColor: _bl + '04',
    lineWidth: 2, priceLineVisible: false, lastValueVisible: true, crosshairMarkerRadius: 4,
  });
  oiS.setData(dates.map((d, i) => ({ time: d, value: oiData[i] ?? 0 })).filter(p => p.value > 0));
  _lwDefaultWindow(chart, dates, 2);
  _lwResize(container, chart);
  _mkTooltip(container, chart, () => oiS, param => {
    const v = param.seriesData.get(oiS); if (!v) return null;
    return `<div style="font-size:9px;color:var(--text3,#6e7681);margin-bottom:4px;">${typeof param.time === 'string' ? param.time : ''}</div>` +
      `<div>${meta.primaryAbbr} OI &nbsp;<span style="color:var(--blue,#4f7fff);font-weight:700">${Math.round(v.value).toLocaleString()}</span></div>`;
  });
  return chart;
}



function _buildSpotChart(container, spotData, label) {
  const LWC = window.LightweightCharts; if (!LWC || !container || !spotData?.length) return null;
  const W = container.offsetWidth || 600, H = container.offsetHeight || container.parentElement?.offsetHeight || 140;
  const opts = _lwOpts(W, H);
  const _maxAbs = spotData.reduce((m, p) => Math.max(m, Math.abs(p.value || 0)), 0);
  const _dec = _maxAbs >= 3 ? 2 : (_maxAbs >= 0.02 ? 4 : 5);
  opts.localization = { priceFormatter: v => v != null ? v.toFixed(_dec) : '—' };
  const chart = LWC.createChart(container, opts);
  _cotLwCharts.push(chart);
  const _bl = _cotTC('--blue', '#4f7fff');
  const spotS = chart.addSeries(LWC.LineSeries, {
    color: _bl, lineWidth: 1.5,
    priceLineVisible: false, lastValueVisible: true, crosshairMarkerRadius: 4,
  });
  spotS.setData(spotData);
  _lwDefaultWindow(chart, spotData.map(p => p.time), 1);
  _lwResize(container, chart);
  _mkTooltip(container, chart, () => spotS, param => {
    const v = param.seriesData.get(spotS); if (!v) return null;
    return `<div style="font-size:9px;color:var(--text3,#6e7681);margin-bottom:4px;">${typeof param.time === 'string' ? param.time : ''}</div>` +
      `<div>${label} &nbsp;<span style="color:${_bl};font-weight:700">${v.value.toFixed(_dec)}</span></div>`;
  });
  return chart;
}

function _buildSplitChart(container,dates,lngData,shrtData,ccy){
  const LWC=window.LightweightCharts;if(!LWC||!container)return null;
  const W=container.offsetWidth||600,H=container.offsetHeight||container.parentElement?.offsetHeight||280;
  const chart=LWC.createChart(container,_lwOpts(W,H));_cotLwCharts.push(chart);
  const _up=_cotTC('--up','#26a69a'),_dn=_cotTC('--down','#ef5350');
  const lS=chart.addSeries(LWC.AreaSeries,{lineColor:_up,topColor:_up+'26',bottomColor:_up+'03',lineWidth:2,priceLineVisible:false,lastValueVisible:true,crosshairMarkerRadius:4});
  const sS=chart.addSeries(LWC.AreaSeries,{lineColor:_dn,topColor:_dn+'26',bottomColor:_dn+'03',lineWidth:2,priceLineVisible:false,lastValueVisible:true,crosshairMarkerRadius:4});
  lS.setData(dates.map((d,i)=>({time:d,value:lngData[i]??0})));
  sS.setData(dates.map((d,i)=>({time:d,value:shrtData[i]??0})));
  _lwDefaultWindow(chart,dates,2);_lwResize(container,chart);
  _mkTooltip(container,chart,()=>lS,param=>{
    const lv=param.seriesData.get(lS),sv=param.seriesData.get(sS);if(!lv)return null;
    const mon=typeof param.time==='string'?param.time.slice(0,7):'';
    const _u=_cotTC('--up','#26a69a'),_d=_cotTC('--down','#ef5350');
    return `<div style="font-size:9px;color:var(--text3,#6e7681);margin-bottom:4px;">${mon}</div>`+
      `<div>Long &nbsp;<span style="color:${_u};font-weight:700">${lv.value!=null?Math.round(lv.value).toLocaleString():'—'}</span></div>`+
      (sv?`<div>Short<span style="color:${_d};font-weight:700"> ${sv.value!=null?Math.round(sv.value).toLocaleString():'—'}</span></div>`:'');
  });
  return chart;
}

function _buildParticipantsChart(container,dates,netData,amData,ddData,ccy,meta){
  meta = meta || { primaryAbbr:'LF', secondaryAbbr:'AM', tertiaryAbbr:'DD', primaryLabel:'Leveraged Funds', secondaryLabel:'Asset Managers', tertiaryLabel:'Dealers' };
  const LWC=window.LightweightCharts;if(!LWC||!container)return null;
  const W=container.offsetWidth||600,H=container.offsetHeight||280;
  const chart=LWC.createChart(container,_lwOpts(W,H));_cotLwCharts.push(chart);
  const _bl=_cotTC('--blue','#4f7fff'),_or=_cotTC('--orange','#ff9800'),_dn=_cotTC('--down','#ef5350');
  const lfS=chart.addSeries(LWC.LineSeries,{color:_bl,lineWidth:2,priceLineVisible:false,lastValueVisible:true,crosshairMarkerRadius:4});
  lfS.setData(dates.map((d,i)=>({time:d,value:netData[i]??null})).filter(p=>p.value!=null));
  let amS=null,ddS=null;
  if(amData.some(v=>v!=null)){
    amS=chart.addSeries(LWC.LineSeries,{color:_or,lineWidth:2,priceLineVisible:false,lastValueVisible:true,crosshairMarkerRadius:4});
    amS.setData(dates.map((d,i)=>({time:d,value:amData[i]})).filter(p=>p.value!=null));
  }
  if(ddData.some(v=>v!=null)){
    ddS=chart.addSeries(LWC.LineSeries,{color:_dn,lineWidth:2,priceLineVisible:false,lastValueVisible:true,crosshairMarkerRadius:4});
    ddS.setData(dates.map((d,i)=>({time:d,value:ddData[i]})).filter(p=>p.value!=null));
  }
  _lwDefaultWindow(chart,dates,2);_lwResize(container,chart);
  const legendEl=container.parentElement?.querySelector('#cot-part-legend');
  if(legendEl){
    legendEl.innerHTML=[[meta.primaryLabel,_bl],[meta.secondaryLabel,_or],[meta.tertiaryLabel,_dn]].map(([lbl,col])=>
      `<span style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:18px;height:2px;background:${col};border-radius:1px"></span><span>${lbl}</span></span>`
    ).join('');
  }
  _mkTooltip(container,chart,()=>lfS,param=>{
    const lf=param.seriesData.get(lfS);if(!lf)return null;
    const mon=typeof param.time==='string'?param.time.slice(0,7):'';
    const _b=_cotTC('--blue','#4f7fff'),_o=_cotTC('--orange','#ff9800'),_d=_cotTC('--down','#ef5350');
    let html=`<div style="font-size:9px;color:var(--text3,#6e7681);margin-bottom:4px;">${mon}</div>`;
    html+=`<div style="color:${_b}">${meta.primaryAbbr} &nbsp;&nbsp;${_cotFmt(lf.value)}</div>`;
    if(amS){const av=param.seriesData.get(amS);if(av)html+=`<div style="color:${_o}">${meta.secondaryAbbr} &nbsp;&nbsp;${_cotFmt(av.value)}</div>`;}
    if(ddS){const dv=param.seriesData.get(ddS);if(dv)html+=`<div style="color:${_d}">${meta.tertiaryAbbr} &nbsp;&nbsp;${_cotFmt(dv.value)}</div>`;}
    return html;
  });
  return chart;
}

let _cotLwLibPromise = null;
function _cotEnsureLWLib() {
  if (window.LightweightCharts) return Promise.resolve();
  if (_cotLwLibPromise) return _cotLwLibPromise;
  _cotLwLibPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lightweight-charts@5.0.7/dist/lightweight-charts.standalone.production.js';
    s.onload  = resolve;
    s.onerror = () => { _cotLwLibPromise = null; reject(new Error('LW lib load failed')); };
    document.head.appendChild(s);
  });
  return _cotLwLibPromise;
}

function openCOTModal(ccy,data,opts){
  const _preserveTab = opts && opts.preserveTab;
  closeCOTModal();
  const meta = (typeof _cotReportMeta === 'function')
    ? _cotReportMeta(data)
    : { report:'TFF', primaryLabel:'Leveraged Funds', primaryAbbr:'LF', secondaryLabel:'Asset Manager', secondaryAbbr:'AM', tertiaryLabel:'Dealers', tertiaryAbbr:'DD' };
  const history=Array.isArray(data.history)?[...data.history]:[];
  const net=data.netPosition||0,long_=data.longPositions||0,short_=data.shortPositions||0;
  const total=long_+short_,lPct=total>0?Math.round(long_/total*100):50;
  const amNet=data.assetManagerNet,ddNet=data.dealerNet,weekEnd=data.weekEnding||'',nWks=history.length;
  const amLong_=data.assetManagerLong,amShort_=data.assetManagerShort,ddLong_=data.dealerLong,ddShort_=data.dealerShort;
  const zHist=history.slice(-52),zWindow=zHist.length;
  const zScore=_calcZ(zHist),pctHist=_calcPct(zHist),zInfo=_posLabel(zScore),isCrowded=Math.abs(zScore||0)>=1.5;
  let wow=null,amWow=null,ddWow=null;
  if(history.length>=2){
    const prev=history[history.length-2];
    wow=net-(prev.levNet??((prev.levLong||0)-(prev.levShort||0)));
    if(amNet!=null&&prev.assetManagerNet!=null)amWow=amNet-prev.assetManagerNet;
    if(ddNet!=null&&prev.dealerNet!=null)ddWow=ddNet-prev.dealerNet;
  }
  const netPctOI=total>0?(net/total*100):null;
  const netPctStr=netPctOI!=null?(netPctOI>0?'+':'')+netPctOI.toFixed(1)+'%':'—';
  const zStr=zScore!=null?(zScore>0?'+':'')+zScore.toFixed(2):'—';
  const pStr=pctHist!=null?pctHist+'%':'—';
  const zCol=isCrowded?'#ff9800':'#e6edf3';
  const lfDir=Math.sign(net),amDir=amNet!=null?Math.sign(amNet):0,aligned=lfDir!==0&&amDir!==0&&lfDir===amDir;
  const gaugeLeft=zScore!=null?((Math.max(-3,Math.min(3,zScore))+3)/6*90+5).toFixed(1)+'%':'50%';
  const dates=history.map(h=>{const d=h.weekEnding||'';return d.length===10?d:d.slice(0,10);});
  const netData=history.map(h=>h.levNet??((h.levLong||0)-(h.levShort||0)));
  const lngData=history.map(h=>h.levLong??null);
  const shrtData=history.map(h=>h.levShort??null);
  const amData=history.map(h=>h.assetManagerNet??null);
  const ddData=history.map(h=>h.dealerNet??null);

  const _assetClass=data.assetClass||'currency';
  const _storeByClass={
    commodity:   {store:window.COT_DATA_STORE_COMMODITIES, order:(typeof COT_COMMODITIES!=='undefined'?COT_COMMODITIES:['XAU','XAG','COPPER','WTI'])},
    equityIndex: {store:window.COT_DATA_STORE_INDICES,      order:(typeof COT_INDICES!=='undefined'?COT_INDICES:['SPX','NAS100','DJ30'])},
    currency:    {store:window.COT_DATA_STORE,              order:(typeof G10_CCYS!=='undefined'?G10_CCYS:['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','NOK','SEK'])},
  };
  const _sel=_storeByClass[_assetClass]||_storeByClass.currency;
  const _store=_sel.store||{};
  const _order=_sel.order;
  const _avail=_order.filter(c=>_store[c]);
  const _idx=_avail.indexOf(ccy);

  const bd=document.createElement('div');
  bd.id='cot-bd';
  bd.innerHTML=`
<div id="cot-modal">
  <div id="cot-m-hd">
    <div>
      <div id="cot-m-title-row">
        <span>CFTC Positioning ·</span>
        <button class="cot-ccy-arrow" onclick="cotCycleCcy(-1)" aria-label="Previous currency" title="Previous (←)" ${_idx<=0?'disabled':''}>‹</button>
        <div id="cot-ccy-switch">
          <button id="cot-ccy-chip" onclick="cotToggleCcyDropdown(event)" aria-haspopup="listbox" aria-expanded="false" title="Switch currency">${ccy}</button>
          <div id="cot-ccy-dd" role="listbox" aria-label="Select currency">
            ${_avail.map(c=>`<button class="cot-ccy-dd-item ${c===ccy?'on':''}" role="option" aria-selected="${c===ccy}" onclick="cotSwitchCcy('${c}')">${c}</button>`).join('')}
          </div>
        </div>
        <button class="cot-ccy-arrow" onclick="cotCycleCcy(1)" aria-label="Next currency" title="Next (→)" ${_idx===-1||_idx>=_avail.length-1?'disabled':''}>›</button>
        <span>· ${meta.primaryLabel}</span>
      </div>
      <div id="cot-m-sub">week ending ${weekEnd} · ${nWks}w history · CFTC ${meta.report} · Options+Futures Combined</div>
    </div>
    <button id="cot-m-close" onclick="closeCOTModal()" aria-label="Close">✕</button>
  </div>
  <div id="cot-m-metrics">
    <div class="cot-mm"><div class="cot-mm-lbl">Net ${meta.primaryAbbr}</div><div class="cot-mm-val ${_cotCls(net)}">${_cotFmt(net)}</div><div class="cot-mm-sub">contracts</div></div>
    <div class="cot-mm"><div class="cot-mm-lbl">Long %</div><div class="cot-mm-val ${_cotCls(lPct-50)}">${lPct}%</div><div class="cot-mm-sub">of own OI</div></div>
    <div class="cot-mm"><div class="cot-mm-lbl">WoW Delta</div><div class="cot-mm-val ${_cotCls(wow)}">${_cotFmt(wow)}</div><div class="cot-mm-sub">weekly change</div></div>
    <div class="cot-mm"><div class="cot-mm-lbl">Net%OI</div><div class="cot-mm-val ${_cotCls(netPctOI)}">${netPctStr}</div><div class="cot-mm-sub">normalised</div></div>
    <div class="cot-mm"><div class="cot-mm-lbl">Z-Score</div><div class="cot-mm-val" style="color:${zCol}">${zStr}</div><div class="cot-mm-sub">${pStr} pctile</div></div>
    <div class="cot-mm"><div class="cot-mm-lbl">Positioning</div><div class="cot-mm-val" style="color:${zInfo.col};font-size:11px">${zInfo.txt}</div><div class="cot-mm-sub">${isCrowded?'crowded':'not crowded'}</div></div>
  </div>
  <div id="cot-m-tabs" role="tablist" aria-label="COT chart views">
    <div class="cot-tab on" data-tab="overview"    onclick="cotTab(this,'overview')"    role="tab" aria-selected="true">Overview</div>
    <div class="cot-tab"    data-tab="net"          onclick="cotTab(this,'net')"          role="tab" aria-selected="false">Net Position</div>
    <div class="cot-tab"    data-tab="split"        onclick="cotTab(this,'split')"        role="tab" aria-selected="false">Long / Short</div>
    <div class="cot-tab"    data-tab="participants" onclick="cotTab(this,'participants')" role="tab" aria-selected="false">Participants</div>
    <div class="cot-tab"    data-tab="history"      onclick="cotTab(this,'history')"      role="tab" aria-selected="false">History</div>
  </div>
  <div id="cot-m-body" class="cot-body--overview">
    <div id="p-overview" class="cot-panel on">

      <!-- TOP ROW: Positioning Gauge + L/S Split side by side -->
      <div class="cot-ov-top-row">
        <div class="cot-ov-half">
          <div class="cot-ct">POSITIONING · Z-SCORE</div>
          <div class="cot-ov-bignum" style="color:${zCol}">${zStr}σ <span style="font-size:12px;color:var(--text2);font-weight:400">· ${pStr} pctile</span></div>
          <div class="cot-ov-sub" style="margin-bottom:8px">${zInfo.txt} · ${zWindow}w window</div>
          <div class="cot-gauge-track"><div class="cot-gauge-fill"></div><div id="cot-pin" class="cot-gauge-pin" style="left:50%"></div></div>
          <div class="cot-gauge-lbls"><span>Extreme Short</span><span>Neutral</span><span>Extreme Long</span></div>
        </div>
        <div class="cot-ov-half">
          <div class="cot-ct">LONG / SHORT SPLIT</div>
          <div class="cot-ls-row">
            <div><div class="cot-ls-num cu">${long_.toLocaleString()}</div><div class="cot-ov-sub">Longs</div></div>
            <div class="cot-ls-vs">vs</div>
            <div style="text-align:right"><div class="cot-ls-num cd">${short_.toLocaleString()}</div><div class="cot-ov-sub">Shorts</div></div>
          </div>
          <div class="cot-ls-bar"><div class="cot-ls-bar-fill" style="width:100%;background:linear-gradient(90deg,var(--up) ${lPct}%,var(--down) ${lPct}%)"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:9px;font-family:${_monoF};color:var(--text3,#6e7681)"><span>${lPct}% Long</span><span>${100-lPct}% Short</span></div>
        </div>
      </div>

      <!-- SECTION: KEY METRICS -->
      <div class="cot-ov-sec">
        <span class="cot-ov-sec-lbl">Key Metrics</span>
      </div>
      <div class="cot-kfv">
        <span class="cot-kfv-key">Net as % of Open Interest</span>
        <span class="cot-kfv-val ${_cotCls(netPctOI)}">${netPctStr}</span>
        ${Math.abs(netPctOI||0)>15?'<span class="cot-kfv-badge cot-badge-w">ELEVATED</span>':''}
      </div>
      <div class="cot-kfv">
        <span class="cot-kfv-key">Week-on-Week Change</span>
        <span class="cot-kfv-val ${_cotCls(wow)}">${_cotFmt(wow)}</span>
        ${wow!=null&&wow>0?'<span class="cot-kfv-badge cot-badge-l">BUYING</span>':wow!=null&&wow<0?'<span class="cot-kfv-badge cot-badge-s">SELLING</span>':''}
      </div>
      <div class="cot-kfv">
        <span class="cot-kfv-key">Crowd Alignment (${meta.primaryAbbr} + ${meta.secondaryAbbr})</span>
        <span class="cot-kfv-val ${aligned?_cotCls(net):'cn'}">${aligned?(net>0?'Both Long':'Both Short'):'Diverging'}</span>
        ${isCrowded?'<span class="cot-kfv-badge cot-badge-w">CROWDED</span>':aligned?'<span class="cot-kfv-badge cot-badge-l">ALIGNED</span>':'<span class="cot-kfv-badge cot-badge-n">MIXED</span>'}
      </div>
      <div class="cot-kfv">
        <span class="cot-kfv-key">Trend Pattern (last 4w)</span>
        <span class="cot-kfv-val" style="color:var(--text)">${_cotTrendLabel(history).split(' · ')[0]}</span>
      </div>

      <!-- SECTION: PARTICIPANTS -->
      <div class="cot-ov-sec">
        <span class="cot-ov-sec-lbl">Participants · Current Week</span>
        <span class="cot-ov-sec-note">Net contracts by category</span>
      </div>
      ${(()=>{
        const maxAbs = Math.max(Math.abs(net), Math.abs(amNet||0), Math.abs(ddNet||0), 1);
        const pRow = (label, val) => {
          if (val == null) return '';
          const pct = Math.round(Math.abs(val) / maxAbs * 100);
          const col = val >= 0 ? _cotTC('--up','#26a69a') : _cotTC('--down','#ef5350');
          const dir = val > 0 ? 'LONG' : val < 0 ? 'SHORT' : 'FLAT';
          const badgeCls = val > 0 ? 'cot-badge-l' : val < 0 ? 'cot-badge-s' : 'cot-badge-n';
          return `<div class="cot-kfv">
            <span class="cot-kfv-key">${label}</span>
            <div class="cot-kfv-bar"><div class="cot-kfv-bar-fill" style="width:${pct}%;background:${col}"></div></div>
            <span class="cot-kfv-val ${_cotCls(val)}">${_cotFmt(val)}</span>
            <span class="cot-kfv-badge ${badgeCls}">${dir}</span>
          </div>`;
        };
        return pRow(meta.primaryLabel, net) +
               pRow(meta.secondaryLabel, amNet) +
               pRow(meta.tertiaryLabel, ddNet);
      })()}

      <!-- SECTION: 52-WEEK RANGE -->
      <div class="cot-ov-sec">
        <span class="cot-ov-sec-lbl">52-Week Range</span>
      </div>
      ${(()=>{
        const vals = history.slice(-52).map(h=>h.levNet??((h.levLong||0)-(h.levShort||0))).filter(v=>v!=null);
        if (vals.length < 2) return '<div class="cot-kfv"><span class="cot-kfv-key" style="color:var(--text3)">Insufficient data</span></div>';
        const hi = Math.max(...vals), lo = Math.min(...vals);
        const pct = hi !== lo ? Math.round((net - lo) / (hi - lo) * 100) : 50;
        const rangeBar = `<div style="margin:6px 14px 2px;height:5px;background:rgba(255,255,255,.06);border-radius:3px;position:relative;">
          <div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:var(--up);border-radius:3px;"></div>
          <div style="position:absolute;top:-3px;left:calc(${pct}% - 4px);width:8px;height:8px;border-radius:50%;background:var(--text,#e6edf3);border:2px solid var(--bg2,#161b22);box-shadow:0 0 0 1px rgba(255,255,255,.2)"></div>
        </div>`;
        return rangeBar +
          `<div class="cot-kfv"><span class="cot-kfv-key">${vals.length}w High</span><span class="cot-kfv-val cu">${_cotFmt(hi)}</span></div>` +
          `<div class="cot-kfv"><span class="cot-kfv-key">Current</span><span class="cot-kfv-val ${_cotCls(net)}">${_cotFmt(net)}</span><span class="cot-kfv-badge cot-badge-n">${pct}th PCTILE</span></div>` +
          `<div class="cot-kfv"><span class="cot-kfv-key">${vals.length}w Low</span><span class="cot-kfv-val cd">${_cotFmt(lo)}</span></div>`;
      })()}

      <!-- SECTION: 12-WEEK TREND -->
      <div class="cot-ov-sec">
        <span class="cot-ov-sec-lbl">12-Week Net Trend</span>
        <span class="cot-ov-sec-note">${meta.primaryLabel} · weekly snapshot</span>
      </div>
      <div class="cot-ov-spark-row">
        <div class="cot-ov-spark-top">
          <span class="cot-ct" style="margin-bottom:0">Net contracts — last 12 weeks</span>
          <span class="cot-ov-spark-trend ${_cotCls(net)}">${_cotTrendLabel(history)}</span>
        </div>
        ${_cotSparkline(history,12)}
        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:8.5px;color:var(--text3,#4e5c70);font-family:${_monoF};padding:0 14px"><span>12w ago</span><span>Now · ${_cotFmt(net)}</span></div>
      </div>

    </div>
    <div id="p-net" class="cot-panel">
      <div class="cot-cw" style="flex:3;min-height:0;display:flex;flex-direction:column;">
        <div class="cot-ct">NET POSITION · ${meta.primaryLabel.toUpperCase()} · WEEKLY CONTRACTS</div>
        <div id="cot-net-legend">
          <div class="cot-nl-items">
            <span class="cot-nl-item">
              <span class="cot-nl-dot" style="background:var(--up);opacity:.82"></span>
              <span>${meta.primaryAbbr} Net</span>
            </span>
          </div>
        </div>
        <div class="cot-chart-area" style="flex:1;min-height:0;"><div class="cot-lw-wrap" id="cot-lw-net"></div></div>
      </div>
      <div class="cot-cw" style="flex:2;min-height:0;display:flex;flex-direction:column;">
        <div class="cot-ct" id="cot-spot-ct">·/USD · DAILY SPOT CLOSE</div>
        <span id="cot-net-price-status" style="font-size:9px;color:var(--text3);font-family:var(--font-mono,'JetBrains Mono','Courier New',monospace);">Loading…</span>
        <div class="cot-chart-area" style="flex:1;min-height:0;margin-top:4px;"><div class="cot-lw-wrap" id="cot-lw-spot"></div></div>
      </div>
    </div>
    <div id="p-split" class="cot-panel">
      <div class="cot-cw" style="flex:3;min-height:0;display:flex;flex-direction:column;">
        <div class="cot-ct">LONGS VS SHORTS · ${meta.primaryLabel.toUpperCase()} · CONTRACTS</div>
        <div class="cot-chart-area" style="flex:1;min-height:0;"><div class="cot-lw-wrap" id="cot-lw-split"></div></div>
      </div>
      <div class="cot-cw cot-oi-section" style="flex:2;min-height:0;display:flex;flex-direction:column;">
        <div class="cot-ct">${meta.primaryAbbr} OPEN INTEREST · ${meta.primaryLabel.toUpperCase()} · CONTRACTS</div>
        <div class="cot-oi-note">Total contracts held by ${meta.primaryLabel} (longs + shorts). Rising OI = growing participation. Declining OI = de-risking.</div>
        <div class="cot-chart-area" style="flex:1;min-height:0;margin-top:6px;"><div class="cot-lw-wrap" id="cot-lw-oi"></div></div>
      </div>
    </div>
    <div id="p-participants" class="cot-panel">
      <div class="cot-cw">
        <div class="cot-ct">${meta.primaryAbbr} vs ${meta.secondaryAbbr} vs ${meta.tertiaryAbbr} · NET BY CATEGORY</div>
        <div id="cot-part-legend" style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:8px;font-size:10px;font-family:${_monoF};color:#8b949e"></div>
        <div class="cot-chart-area"><div class="cot-lw-wrap" id="cot-lw-part"></div></div>
      </div>
      <div class="cot-cw"><div style="font-size:10px;color:var(--text3,#6e7681);font-family:${_monoF};line-height:1.7">
        ${data.assetClass === 'commodity' ? `
        <strong style="color:#8b949e">MM (Managed Money):</strong> Hedge funds and CTAs. Primary speculative momentum signal.<br>
        <strong style="color:#8b949e">SD (Swap Dealers):</strong> Banks and swap dealers hedging OTC/index exposure. Confluence with MM = stronger signal.<br>
        <strong style="color:#8b949e">PM (Producer/Merchant):</strong> Commercial hedgers (producers, processors, users). Typically contra-positioned to speculators. Useful contrarian signal.
        ` : `
        <strong style="color:#8b949e">LF (Leveraged Funds):</strong> Hedge funds and CTAs. Primary speculative momentum signal.<br>
        <strong style="color:#8b949e">AM (Asset Managers):</strong> Mutual funds and pensions. Slow trend-followers. Confluence with LF = stronger signal.<br>
        <strong style="color:#8b949e">DD (Dealers):</strong> Market-makers. Typically contra-positioned to speculators. Useful contrarian signal.
        `}
      </div></div>
      <div class="cot-cw">
        <div class="cot-ct">PARTICIPANT BREAKDOWN · WEEK ENDING ${weekEnd}</div>
        <table class="cot-tbl">
          <thead><tr><th>Category</th><th>Long</th><th>Short</th><th>Net</th><th>Long%</th><th>WoW Δ</th></tr></thead>
          <tbody>
            ${_cotPartRow(meta.primaryLabel,long_,short_,net,wow)}
            ${_cotPartRow(meta.secondaryLabel,amLong_,amShort_,amNet,amWow)}
            ${_cotPartRow(meta.tertiaryLabel,ddLong_,ddShort_,ddNet,ddWow)}
          </tbody>
        </table>
      </div>
    </div>
    <div id="p-history" class="cot-panel">
      <div class="cot-cw">
        <div class="cot-ct">WEEKLY HISTORY · ${nWks} WEEKS</div>
        <div style="overflow-x:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent">
          <table class="cot-tbl"><thead><tr>
            <th>Week</th><th>Net ${meta.primaryAbbr}</th><th>WoW Δ</th><th>Longs</th><th>Shorts</th><th>Long%</th><th>Net%OI</th><th>${meta.secondaryAbbr} Net</th><th>${meta.tertiaryAbbr}</th>
          </tr></thead><tbody id="cot-hist-body"></tbody></table>
        </div>
      </div>
    </div>
  </div>
</div>`;

  document.body.appendChild(bd);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const pin=document.getElementById('cot-pin');if(pin)pin.style.left=gaugeLeft;
    bd.scrollIntoView({behavior:'smooth',block:'start'});
  }));

  const tbody=document.getElementById('cot-hist-body');
  if(tbody){
    const rev=[...history].reverse();
    tbody.innerHTML=rev.map((h,i)=>{
      const hNet=h.levNet??((h.levLong||0)-(h.levShort||0));
      const hL=h.levLong,hS=h.levShort,hTot=(hL||0)+(hS||0);
      const hLP=hTot>0?Math.round(hL/hTot*100):null;
      const hPctOI=hTot>0?(hNet/hTot*100):null;
      const prevH=rev[i+1];
      const hWow=prevH?hNet-(prevH.levNet??((prevH.levLong||0)-(prevH.levShort||0))):null;
      return`<tr style="${i===0?'background:rgba(255,255,255,.04)':''}">
        <td>${h.weekEnding}${i===0?' <span style="color:var(--up);font-size:9px">now</span>':''}</td>
        <td class="${_cotCls(hNet)}">${_cotFmt(hNet)}</td>
        <td class="${_cotCls(hWow)}">${hWow!=null?_cotFmt(hWow):'—'}</td>
        <td style="color:var(--up)">${hL!=null?hL.toLocaleString():'—'}</td>
        <td style="color:var(--down)">${hS!=null?hS.toLocaleString():'—'}</td>
        <td class="${_cotCls(hLP!=null?hLP-50:null)}">${hLP!=null?hLP+'%':'—'}</td>
        <td class="${_cotCls(hPctOI)}">${hPctOI!=null?(hPctOI>0?'+':'')+hPctOI.toFixed(1)+'%':'—'}</td>
        <td class="${_cotCls(h.assetManagerNet)}">${h.assetManagerNet!=null?_cotFmt(h.assetManagerNet):'—'}</td>
        <td class="${_cotCls(h.dealerNet)}">${h.dealerNet!=null?_cotFmt(h.dealerNet):'—'}</td>
      </tr>`;
    }).join('');
  }

  bd.addEventListener('click',e=>{
    if(e.target===bd)closeCOTModal();
    const dd=document.getElementById('cot-ccy-dd');
    if(dd&&dd.classList.contains('open')&&!e.target.closest('#cot-ccy-switch')){dd.classList.remove('open');document.getElementById('cot-ccy-chip')?.setAttribute('aria-expanded','false');}
  });
  const esc=e=>{
    const dd=document.getElementById('cot-ccy-dd');
    if(e.key==='Escape'){
      if(dd&&dd.classList.contains('open')){dd.classList.remove('open');document.getElementById('cot-ccy-chip')?.setAttribute('aria-expanded','false');return;}
      closeCOTModal();return;
    }
    if(e.key==='ArrowLeft')cotCycleCcy(-1);
    if(e.key==='ArrowRight')cotCycleCcy(1);
  };
  document.addEventListener('keydown',esc);bd._esc=esc;
  bd._cotData={dates,netData,lngData,shrtData,amData,ddData,ccy,history,meta,assetClass:_assetClass};
  bd._ccy=ccy;bd._availCcys=_avail;bd._assetClass=_assetClass;

  if(_preserveTab&&_preserveTab!=='overview'){
    const tabEl=document.querySelector(`.cot-tab[data-tab="${_preserveTab}"]`);
    if(tabEl)cotTab(tabEl,_preserveTab);
  }
}

function cotSwitchCcy(newCcy){
  const bd=document.getElementById('cot-bd');
  if(!bd||newCcy===bd._ccy)return;
  const _storeMap={
    commodity:   window.COT_DATA_STORE_COMMODITIES,
    equityIndex: window.COT_DATA_STORE_INDICES,
    currency:    window.COT_DATA_STORE,
  };
  const _newStore=_storeMap[bd._assetClass||'currency']||window.COT_DATA_STORE;
  const data=_newStore&&_newStore[newCcy];
  if(!data)return;
  const activeTabEl=document.querySelector('.cot-tab.on');
  const activeTab=activeTabEl?activeTabEl.getAttribute('data-tab'):'overview';
  openCOTModal(newCcy,data,{preserveTab:activeTab});
}

function cotCycleCcy(dir){
  const bd=document.getElementById('cot-bd');
  if(!bd||!bd._availCcys)return;
  const idx=bd._availCcys.indexOf(bd._ccy);
  const next=idx+dir;
  if(next<0||next>=bd._availCcys.length)return;
  cotSwitchCcy(bd._availCcys[next]);
}

function cotToggleCcyDropdown(e){
  e.stopPropagation();
  const dd=document.getElementById('cot-ccy-dd');
  const chip=document.getElementById('cot-ccy-chip');
  if(!dd)return;
  const open=dd.classList.toggle('open');
  chip?.setAttribute('aria-expanded',open?'true':'false');
}

function cotTab(el,tabId){
  document.querySelectorAll('.cot-tab').forEach(t=>{t.classList.remove('on');t.setAttribute('aria-selected','false');});
  document.querySelectorAll('.cot-panel').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');el.setAttribute('aria-selected','true');
  const panel=document.getElementById('p-'+tabId);if(panel)panel.classList.add('on');
  const body=document.getElementById('cot-m-body');
  if(body){body.classList.toggle('cot-body--chart',tabId==='net'||tabId==='split');body.classList.toggle('cot-body--overview',tabId==='overview');}
  const bd=document.getElementById('cot-bd');if(!bd?._cotData)return;
  const d=bd._cotData;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(tabId==='net'){
      const w=document.getElementById('cot-lw-net');
      const ws=document.getElementById('cot-lw-spot');
      if((w&&!w._built)||(ws&&!ws._built)){
        const statusEl=document.getElementById('cot-net-price-status');
        const titleEl=document.getElementById('cot-spot-ct');
        const spotLabel=_cotSpotLabel(d.ccy,d.assetClass);
        if(titleEl)titleEl.textContent=spotLabel+' · DAILY SPOT CLOSE';
        const spotPromise=_fetchCOTSpot(d.ccy);
        setTimeout(()=>requestAnimationFrame(()=>{
          let _netChart=null,_spotChart=null;
          if(w&&!w._built){w._built=true;_netChart=_buildNetChart(w,d.dates,d.netData,d.ccy,d.meta);w._lwChart=_netChart;}
          else if(w&&w._lwChart){_netChart=w._lwChart;}
          if(ws&&!ws._built){
            ws._built=true;
            spotPromise.then(spotData=>{
              const filtered=(spotData||[]).filter(p=>p.time>=d.dates[0]);
              if(filtered.length){
                if(statusEl)statusEl.textContent='';
                _spotChart=_buildSpotChart(ws,filtered,spotLabel);
                ws._lwChart=_spotChart;
                if(_netChart&&_spotChart)_lwSyncTimeRanges(_netChart,_spotChart,w,ws);
              } else {
                if(statusEl)statusEl.textContent='Spot data unavailable';
                ws._built=false;
              }
            }).catch(()=>{if(statusEl)statusEl.textContent='Spot data unavailable';ws._built=false;});
          }
          setTimeout(()=>{[w,ws].forEach(el=>{if(el&&el._lwResize)el._lwResize();});},250);
        }),150);
      } else {
        if(w&&w._lwResize)w._lwResize();
        if(ws&&ws._lwResize)ws._lwResize();
      }
    }
    if(tabId==='split'){
      const w=document.getElementById('cot-lw-split');
      const wo=document.getElementById('cot-lw-oi');
      if((w&&!w._built)||(wo&&!wo._built)){
        setTimeout(()=>requestAnimationFrame(()=>{
          if(w&&!w._built){w._built=true;_buildSplitChart(w,d.dates,d.lngData,d.shrtData,d.ccy);}
          if(wo&&!wo._built){
            wo._built=true;
            const oiData=d.lngData.map((l,i)=>(l??0)+(d.shrtData[i]??0));
            _buildOIChart(wo,d.dates,oiData,d.ccy,d.meta);
          }
          setTimeout(()=>{[w,wo].forEach(el=>{if(el&&el._lwResize)el._lwResize();});},250);
        }),150);
      } else {
        if(w&&w._lwResize)w._lwResize();
        if(wo&&wo._lwResize)wo._lwResize();
      }
    }
    if(tabId==='participants'){const w=document.getElementById('cot-lw-part');if(w&&!w._built){w._built=true;_buildParticipantsChart(w,d.dates,d.netData,d.amData,d.ddData,d.ccy,d.meta);}else if(w&&w._lwResize)w._lwResize();}
    if(tabId==='overview'){  }
    setTimeout(()=>{['cot-lw-net','cot-lw-spot','cot-lw-split','cot-lw-oi','cot-lw-part'].forEach(id=>{const w=document.getElementById(id);if(w&&w._lwResize)w._lwResize();});},120);
  }));
}

function closeCOTModal(){
  const bd=document.getElementById('cot-bd');
  if(bd){
    if(bd._esc)document.removeEventListener('keydown',bd._esc);
    document.querySelectorAll('.cot-lw-wrap').forEach(w=>{if(w._lwResize)window.removeEventListener('resize',w._lwResize);if(w._lwRo)w._lwRo.disconnect();});
    bd.remove();
  }
  _destroyCOTCharts();
}

window.openCOTModal=openCOTModal;window.closeCOTModal=closeCOTModal;window.cotTab=cotTab;
window.cotSwitchCcy=cotSwitchCcy;window.cotCycleCcy=cotCycleCcy;window.cotToggleCcyDropdown=cotToggleCcyDropdown;

window.addEventListener('gi-theme-change', function() {
  const bd = document.getElementById('cot-bd');
  if (!bd) return; 

  _destroyCOTCharts();

  ['cot-lw-net','cot-lw-spot','cot-lw-split','cot-lw-oi','cot-lw-part'].forEach(function(id) {
    const w = document.getElementById(id);
    if (w) { w._built = false; if (w._lwResize) { window.removeEventListener('resize', w._lwResize); w._lwResize = null; } if (w._lwRo) { w._lwRo.disconnect(); w._lwRo = null; } }
  });

  const activeTab = bd.querySelector('.cot-tab.active, .cot-tab.on');
  if (activeTab && typeof cotTab === 'function') {
    cotTab(activeTab, activeTab.dataset.tab || 'overview');
  }
});
