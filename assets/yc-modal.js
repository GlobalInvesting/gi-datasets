(function () {
  if (document.getElementById('ycm-css')) return;
  const s = document.createElement('style');
  s.id = 'ycm-css';
  s.textContent = `
#ycm-bd {
  display:block!important;
  position:absolute!important;
  top:0!important; bottom:0!important;
  left:50%!important; right:0!important;
  overflow-y:auto!important;
  z-index:500!important;
  background:var(--bg)!important;
  border-left:1px solid var(--border2)!important;
  scrollbar-width:thin;
  scrollbar-color:var(--border2) transparent;
  
  flex:1;
  min-height:0;
}
#ycm-bd::-webkit-scrollbar { width:3px; }
#ycm-bd::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }

#main { position:relative; }
#ycm-modal {
  width:100%!important;max-width:none!important;height:auto!important;min-height:100%!important;max-height:none!important;
  border-radius:0!important;border:none!important;box-shadow:none!important;animation:none!important;
  background:var(--bg)!important;position:static!important;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);color:var(--text);
  display:flex;flex-direction:column;
}
#ycm-modal::before { display:none; }
#ycm-hd {
  display:flex;align-items:center;justify-content:space-between;
  padding:7px 14px 6px;border-bottom:1px solid var(--border2);flex-shrink:0;background:var(--bg2);
}
#ycm-title { font-size:12px;font-weight:600;letter-spacing:-.01em;color:var(--text); }
#ycm-sub   { font-size:9px;color:var(--text2);margin-top:1px;font-family:var(--font-mono);letter-spacing:.02em; }
#ycm-close { background:none;border:none;color:var(--text2);font-size:16px;cursor:pointer;padding:3px 6px;border-radius:4px;line-height:1;transition:color .1s,background .1s; }
#ycm-close:hover { color:var(--text);background:var(--bg3); }
#ycm-strip { display:flex;border-bottom:1px solid var(--border2);flex-shrink:0;overflow-x:auto;background:var(--bg); }
.ycm-metric { flex:1;min-width:60px;padding:5px 10px;border-right:1px solid var(--border2);background:var(--bg);text-align:center; }
.ycm-metric:last-child { border-right:none; }
.ycm-m-lbl { font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;font-family:var(--font-mono); }
.ycm-m-val { font-size:13px;font-weight:600;font-family:var(--font-mono);color:var(--text); }
.ycm-m-val.up { color:var(--up); } .ycm-m-val.down { color:var(--down); }
.ycm-m-chg { font-size:8px;margin-top:1px;font-family:var(--font-mono);color:var(--text2); }
.ycm-m-chg.up { color:var(--up); } .ycm-m-chg.down { color:var(--down); }
#ycm-chart-wrap { height:240px;flex-shrink:0;position:relative;padding:8px 14px 4px;display:flex;flex-direction:column;background:var(--bg); }
#ycm-legend { display:flex;gap:14px;margin-bottom:8px;flex-shrink:0;flex-wrap:wrap; }
.ycm-leg-item { display:flex;align-items:center;gap:4px;font-size:8.5px;color:var(--text2);font-family:var(--font-mono); }
.ycm-leg-dot  { width:16px;height:2px;border-radius:1px;flex-shrink:0; }
.ycm-leg-dot.dashed { background:repeating-linear-gradient(90deg,currentColor 0,currentColor 4px,transparent 4px,transparent 8px); }
#ycm-canvas-wrap { flex:1;position:relative;min-height:160px; }
#ycm-canvas { width:100%!important;height:100%!important; }
#ycm-shape { position:absolute;top:4px;right:4px;background:rgba(255,255,255,.04);border:1px solid var(--border2);border-radius:4px;padding:2px 7px;font-size:8.5px;color:var(--text2);font-family:var(--font-mono);pointer-events:none; }
#ycm-table-wrap { flex-shrink:0;border-top:1px solid var(--border2);overflow-x:auto;background:var(--bg); }
#ycm-table { width:100%;border-collapse:collapse;font-size:10px;font-family:var(--font-mono);background:var(--bg); }
#ycm-table th { padding:4px 8px;text-align:right;color:var(--text2);font-weight:500;font-size:8px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border2);background:var(--bg2); }
#ycm-table th:first-child { text-align:left; }
#ycm-table td { padding:4px 8px;text-align:right;border-bottom:1px solid rgba(54,60,78,.4);color:var(--text);background:var(--bg); }
#ycm-table td:first-child { text-align:left;color:var(--text2);font-weight:500; }
#ycm-table tr:last-child td { border-bottom:none; }
#ycm-table tr:hover td { background:rgba(255,255,255,.02); }
#ycm-table td.up { color:var(--up); }
#ycm-table td.down { color:var(--down); }
.ycm-ps-wrap{flex:1;min-height:120px;border-top:1px solid var(--border2);background:var(--bg);}
.ycm-ps-hdr{display:flex;align-items:center;justify-content:space-between;padding:5px 14px 4px;border-bottom:1px solid var(--border2);flex-shrink:0;}
.ycm-ps-hdr-lbl{font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;font-family:var(--font-mono);}
.ycm-ps-hdr-src{font-size:8px;color:var(--text2);font-family:var(--font-mono);}
.ycm-ps-article{padding:9px 14px 10px;border-bottom:1px solid rgba(54,60,78,.35);}
.ycm-ps-article:last-child{border-bottom:none;}
.ycm-ps-art-meta{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.ycm-ps-art-source{font-size:8px;font-weight:600;color:var(--blue);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.05em;}
.ycm-ps-art-time{font-size:8px;color:var(--text2);font-family:var(--font-mono);}
.ycm-ps-art-title{font-size:10px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:5px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.ycm-ps-art-title a{color:inherit;text-decoration:none;}
.ycm-ps-art-title a:hover{text-decoration:underline;text-decoration-color:var(--text2);}
.ycm-ps-art-body{font-size:10px;color:var(--text2);line-height:1.55;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.ycm-ps-loading{padding:14px;font-size:10px;color:var(--text2);font-family:var(--font-mono);}
.ycm-ps-empty{padding:14px;font-size:10px;color:var(--text2);font-family:var(--font-mono);}
`;
  document.head.appendChild(s);
})();

let _ycChart = null;
function _escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function _ycChg(chg) {
  if (chg == null || isNaN(chg)) return { txt: '\u2014', cls: '' };
  const sign = chg > 0 ? '+' : '';
  const cls = chg > 0.001 ? 'up' : chg < -0.001 ? 'down' : '';
  return { txt: sign + (chg * 100).toFixed(1) + 'bp', cls };
}
function _ycShape(tenors) {
  const t2y  = tenors.find(t => t.label === '2Y')?.close;
  const t10y = tenors.find(t => t.label === '10Y')?.close;
  const t3m  = tenors.find(t => t.label === '3M')?.close;
  if (t10y == null) return null;
  const spread_10_2y = t2y != null ? t10y - t2y : null;
  const spread_10_3m = t3m != null ? t10y - t3m : null;
  if (spread_10_2y != null) {
    if (spread_10_2y >= -0.2 && spread_10_2y <= 0.2) return 'Flat';
    if (spread_10_2y < 0) return 'Inverted';
    if (spread_10_2y > 0.5) return 'Steep';
    return 'Normal';
  }
  if (spread_10_3m != null) {
    if (Math.abs(spread_10_3m) <= 0.2) return 'Flat';
    if (spread_10_3m < 0) return 'Inverted';
    if (spread_10_3m > 0.5) return 'Steep';
    return 'Normal';
  }
  return null;
}

function openYCModal(tenorData) {
  closeYCModal();
  if (!Array.isArray(tenorData) || tenorData.length === 0) return;
  const shape = _ycShape(tenorData);
  const shapeColors = { Inverted: 'var(--down)', Flat: 'var(--orange)', Normal: 'var(--up)', Steep: 'var(--chart-line)' };
  const shapeCol = shapeColors[shape] || 'var(--text2)';
  const shapeTips = {
    Inverted: {
      title: 'Curve Shape: Inverted',
      body: '10Y\u20132Y spread is negative \u2014 short-term rates exceed long-term rates. Historically the most reliable recession signal: every US recession in the past 50 years was preceded by a 2Y/10Y inversion. Lag from inversion to recession has ranged 6\u201324 months, and the signal has produced occasional false positives \u2014 treat as a probability signal, not a timing tool.'
    },
    Flat: {
      title: 'Curve Shape: Flat',
      body: '10Y\u20132Y spread is within \u00b120bp of zero. Usually a transition zone \u2014 either the late stage of a Fed tightening cycle, with inversion close behind, or the early stage of a post-inversion steepening. The direction of change over the following weeks matters more than the flat reading itself.'
    },
    Normal: {
      title: 'Curve Shape: Normal',
      body: '10Y\u20132Y spread is modestly positive (20\u201350bp) \u2014 the textbook upward-sloping curve, reflecting the standard term premium investors demand for holding longer maturities. Consistent with steady growth expectations and no acute recession signal from the 2Y/10Y spread.'
    },
    Steep: {
      title: 'Curve Shape: Steep',
      body: '10Y\u20132Y spread exceeds 50bp. Common early in an economic recovery, as the Fed holds or cuts short rates while the long end prices in growth (\u201cbull steepening\u201d). Can also reflect rising inflation or fiscal risk premium pushing up long yields (\u201cbear steepening\u201d) \u2014 check whether the move is driven by falling short yields or rising long yields to tell which.'
    }
  };
  const labels    = tenorData.map(t => t.label);
  const todayVals = tenorData.map(t => t.close);
  const priorVals = tenorData.map(t => t.prev_close);
  const noPrior   = tenorData.every(t => t.prev_close == null);
  const subLabel  = noPrior
    ? 'FRED \u00b7 daily batch \u00b7 prior close unavailable until market open'
    : 'FRED \u00b7 today vs prior close \u00b7 basis points change';

  const _t = lbl => tenorData.find(t => t.label === lbl);
  const _t2y = _t('2Y'), _t10y = _t('10Y'), _t30y = _t('30Y');
  function _spreadMetric(lbl, aT, bT) {
    if (!aT || !bT || aT.close == null || bT.close == null) return '';
    const val = (aT.close - bT.close) * 100;
    const priorVal = (aT.prev_close != null && bT.prev_close != null) ? (aT.prev_close - bT.prev_close) * 100 : null;
    const chgBp = priorVal != null ? val - priorVal : null;
    const valCol = val < 0 ? 'var(--down)' : val > 0 ? 'var(--up)' : 'var(--text2)';
    const chgTxt = chgBp != null ? (chgBp > 0 ? '+' : '') + chgBp.toFixed(1) + 'bp' : '\u2014';
    const chgCls = chgBp != null ? (chgBp > 0.5 ? 'up' : chgBp < -0.5 ? 'down' : '') : '';
    return `<div class="ycm-metric"><div class="ycm-m-lbl">${lbl}</div><div class="ycm-m-val" style="color:${valCol}">${val.toFixed(0)}bp</div><div class="ycm-m-chg ${chgCls}">${chgTxt}</div></div>`;
  }
  const spreadMetrics = _spreadMetric('10Y\u20132Y', _t10y, _t2y) + _spreadMetric('30Y\u20132Y', _t30y, _t2y);

  const metricsHtml = tenorData.map(t => {
    const { txt, cls } = _ycChg(t.chg);
    const valCls = t.chg > 0.001 ? 'up' : t.chg < -0.001 ? 'down' : '';
    return `<div class="ycm-metric"><div class="ycm-m-lbl">${t.label}</div><div class="ycm-m-val ${valCls}">${t.close != null ? t.close.toFixed(2) + '%' : '\u2014'}</div><div class="ycm-m-chg ${cls}">${txt}</div></div>`;
  }).join('');

  const tableRows = tenorData.map(t => {
    const { txt, cls } = _ycChg(t.chg);
    return `<tr><td>${t.label}</td><td>${t.close != null ? t.close.toFixed(3) + '%' : '\u2014'}</td><td>${t.prev_close != null ? t.prev_close.toFixed(3) + '%' : '\u2014'}</td><td class="${cls}">${txt}</td></tr>`;
  }).join('');

  const bd = document.createElement('div');
  bd.id = 'ycm-bd';
  bd.setAttribute('role', 'dialog');
  bd.setAttribute('aria-modal', 'true');
  bd.setAttribute('aria-label', 'US Treasury Yield Curve');
  bd.innerHTML = `
<div id="ycm-modal">
  <div id="ycm-hd">
    <div><div id="ycm-title"><span class="fi fi-us" style="margin-right:6px;border-radius:2px;font-size:14px;vertical-align:middle;"></span>US Treasury Yield Curve</div><div id="ycm-sub">${subLabel}</div></div>
    <button id="ycm-close" onclick="closeYCModal()" aria-label="Close">\u00d7</button>
  </div>
  <div id="ycm-strip">${spreadMetrics}${metricsHtml}</div>
  <div id="ycm-chart-wrap">
    <div id="ycm-legend">
      <div class="ycm-leg-item"><div class="ycm-leg-dot" style="background:var(--chart-line);height:2px;"></div>Today</div>
      <div class="ycm-leg-item"><div class="ycm-leg-dot dashed" style="color:var(--text2);"></div>Prior close</div>
      ${shape ? `<div class="ycm-leg-item fx-tip" data-tip-title="${shapeTips[shape]?.title || shape}" data-tip-body="${shapeTips[shape]?.body || ''}" style="margin-left:auto;color:${shapeCol};font-weight:600;cursor:help;">${shape}</div>` : ''}
    </div>
    <div id="ycm-canvas-wrap"><canvas id="ycm-canvas"></canvas></div>
  </div>
  <div id="ycm-table-wrap">
    <table id="ycm-table" aria-label="Yield curve tenors">
      <thead><tr><th scope="col">Tenor</th><th scope="col">Today</th><th scope="col">Prior close</th><th scope="col">Change (bp)</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
  <div id="ycm-policy-summary" class="ycm-ps-wrap">
    <div class="ycm-ps-loading">Loading market commentary…</div>
  </div>
</div>`;

  (document.getElementById('main') || document.body).appendChild(bd);
  bd.querySelectorAll('.fx-tip').forEach(cell => {
    const title = cell.dataset.tipTitle || '';
    const body  = cell.dataset.tipBody  || '';
    if (!title && !body) return;
    if (typeof attachRiskTip === 'function') attachRiskTip(cell, title, body, '');
  });
  bd.addEventListener('click', e => { if (e.target === bd) closeYCModal(); });
  document.addEventListener('keydown', _ycKeydown);
  requestAnimationFrame(() => requestAnimationFrame(() => { bd.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  requestAnimationFrame(() => _ycDrawChart(labels, todayVals, noPrior ? null : priorVals));
  setTimeout(() => _ycLoadPolicySummary(), 100);
}

async function _ycLoadPolicySummary(){
  const wrap=document.getElementById('ycm-policy-summary');
  if(!wrap)return;
  try{
    const res=await fetch(GI_DATA_BASE + 'news-data/news.json',{cache:'no-store'}).catch(()=>null);
    if(!res?.ok)throw new Error('fetch failed');
    const j=await res.json();
    const YC_KW=['treasury','treasuries','yield curve','10-year yield','10-year treasury',
      '10-year note','10-year bond','2-year yield','2-year treasury','2-year note',
      '30-year yield','30-year treasury','30-year bond','t-bill','t-bond',
      'treasury auction','treasury yield','bond yield','fed funds rate','tnx','tyx',
      'gilt yield','bund yield'];
    const articles=(j.articles||[])
      .filter(a=>{
        const exp=(a.expand||'').replace(/<[^>]+>/g,'').trim();
        if(exp.length<80)return false;
        const combined=(a.title+' '+exp).toLowerCase();
        return YC_KW.some(k=>combined.includes(k));
      })
      .sort((a,b)=>(b.ts||0)-(a.ts||0))
      .slice(0,6);

    const updLabel=j.updated_label||'';

    if(!articles.length){
      wrap.innerHTML=`<div class="ycm-ps-empty">No yield curve commentary available.</div>`;
      return;
    }

    const hdrHtml=`<div class="ycm-ps-hdr">
      <span class="ycm-ps-hdr-lbl">Market Commentary · US Treasuries</span>
      <span class="ycm-ps-hdr-src">Institutional RSS · ${updLabel}</span>
    </div>`;

    const articlesHtml=articles.map(a=>{
      const timeStr=[a.date,a.time].filter(Boolean).join(' · ');
      const exp=(a.expand||'').replace(/&#\d+;/g,'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
      let body=exp;
      if(body.length>500){
        const cut=body.slice(0,500);
        const lastPeriod=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('? '),cut.lastIndexOf('! '));
        body=(lastPeriod>200?cut.slice(0,lastPeriod+1):cut)+'…';
      }
      const safeLink=(a.link||'').startsWith('https://')?a.link:'';
      const titleHtml=safeLink
        ?`<a href="${_escHtml(safeLink)}" target="_blank" rel="noopener noreferrer">${_escHtml(a.title||'')}</a>`
        :_escHtml(a.title||'');
      return`<div class="ycm-ps-article">
        <div class="ycm-ps-art-meta">
          <span class="ycm-ps-art-source">${_escHtml(a.source||'')}</span>
          <span class="ycm-ps-art-time">${_escHtml(timeStr)}</span>
        </div>
        <div class="ycm-ps-art-title">${titleHtml}</div>
        <div class="ycm-ps-art-body">${_escHtml(body)}</div>
      </div>`;
    }).join('');

    wrap.innerHTML=hdrHtml+articlesHtml;
  }catch{
    wrap.innerHTML=`<div class="ycm-ps-empty">Market commentary unavailable.</div>`;
  }
}

function _ycDrawChart(labels, todayVals, priorVals) {
  const canvas = document.getElementById('ycm-canvas');
  if (!canvas) return;
  if (typeof Chart === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    s.onload = () => _ycDrawChart(labels, todayVals, priorVals);
    document.head.appendChild(s); return;
  }
  if (_ycChart) { _ycChart.destroy(); _ycChart = null; }
  const cs = getComputedStyle(document.documentElement);
  const bg  = cs.getPropertyValue('--bg').trim()   || '#131722';
  const blue = cs.getPropertyValue('--chart-line').trim() || '#4f7fff';
  const text2 = cs.getPropertyValue('--text2').trim() || '#9096a0';
  const ctx = canvas.getContext('2d');

  const chartH = canvas.offsetHeight || document.getElementById('ycm-canvas-wrap')?.offsetHeight || 200;
  function hexAlpha(hex, a) {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return isNaN(r) ? `rgba(79,127,255,${a})` : `rgba(${r},${g},${b},${a})`;
  }
  const grad = ctx.createLinearGradient(0, 0, 0, chartH);
  grad.addColorStop(0,   hexAlpha(blue, 0.35));
  grad.addColorStop(0.6, hexAlpha(blue, 0.08));
  grad.addColorStop(1,   hexAlpha(blue, 0.00));

  _ycChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Today', data:todayVals, borderColor:blue, backgroundColor:grad, fill:true, tension:0.35, borderWidth:2, pointRadius:4, pointHoverRadius:6, pointBackgroundColor:blue, pointBorderColor:bg, pointBorderWidth:2 },
        { label:'Prior close', data:priorVals, borderColor:text2+'88', backgroundColor:'transparent', fill:false, tension:0.35, borderWidth:1.5, borderDash:[4,4], pointRadius:3, pointHoverRadius:5, pointBackgroundColor:text2+'88', pointBorderColor:bg, pointBorderWidth:1 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:bg, borderColor:'rgba(255,255,255,.12)', borderWidth:1,
          titleFont:{family:getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()||"'Courier New',monospace",size:10},
          bodyFont:{family:getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()||"'Courier New',monospace",size:10},
          padding:8,
          callbacks:{
            title:items=>items[0]?.label+' Treasury',
            label:item=>{
              const v=item.raw;if(v==null)return'';
              const today=item.datasetIndex===0;
              const other=today?item.chart.data.datasets[1].data[item.dataIndex]:item.chart.data.datasets[0].data[item.dataIndex];
              const diff=today&&other!=null?((v-other)*100).toFixed(1):null;
              let line=(today?'Today  ':'Prior  ')+v.toFixed(3)+'%';
              if(diff!=null)line+='  ('+(diff>0?'+':'')+diff+'bp)';
              return line;
            }
          }
        }
      },
      scales:{
        x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:text2,font:{family:getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()||"'Courier New',monospace",size:9}}},
        y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:text2,font:{family:getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()||"'Courier New',monospace",size:9},callback:v=>v.toFixed(2)+'%'},grace:'5%'}
      }
    }
  });
}

function _ycKeydown(e) { if (e.key === 'Escape') closeYCModal(); }
function closeYCModal() {
  if (_ycChart) { _ycChart.destroy(); _ycChart = null; }
  const bd = document.getElementById('ycm-bd');
  if (bd) bd.remove();
  document.removeEventListener('keydown', _ycKeydown);
}
window.openYCModal  = openYCModal;
window.closeYCModal = closeYCModal;
