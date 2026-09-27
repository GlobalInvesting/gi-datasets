(function(){
  if(document.getElementById('cbr-modal-css'))return;
  const s=document.createElement('style');s.id='cbr-modal-css';
  s.textContent=`
#cbr-bd{display:block!important;flex:1;min-height:0;}
#cbr-modal{
  width:100%!important;max-width:none!important;height:auto!important;max-height:none!important;
  border-radius:0!important;border:none!important;box-shadow:none!important;animation:none!important;
  background:var(--bg)!important;position:static!important;
  font-family:var(--font-ui,'Inter',-apple-system,sans-serif);color:var(--text);
  display:flex;flex-direction:column;
}
#cbr-modal::before{display:none;}
#cbr-m-hd{display:flex;align-items:center;justify-content:space-between;padding:7px 14px 6px;border-bottom:1px solid var(--border2);flex-shrink:0;background:var(--bg2);}
#cbr-m-title{font-size:12px;font-weight:600;color:var(--text);letter-spacing:-.01em;}
#cbr-m-sub{font-size:9px;color:var(--text2);margin-top:2px;font-family:var(--font-mono);letter-spacing:.02em;}
#cbr-m-close{background:none;border:none;color:var(--text2);font-size:16px;cursor:pointer;padding:3px 6px;border-radius:4px;line-height:1;transition:color .1s,background .1s;}
#cbr-m-close:hover{color:var(--text);background:var(--bg3);}
#cbr-m-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:var(--bg);border-bottom:1px solid var(--border2);flex-shrink:0;}
.cbr-mm{background:var(--bg);padding:5px 10px;display:flex;flex-direction:column;gap:1px;border-right:1px solid var(--border2);}
.cbr-mm:last-child{border-right:none;}
.cbr-mm-lbl{font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;font-family:var(--font-mono);}
.cbr-mm-val{font-size:13px;font-weight:600;font-family:var(--font-mono);color:var(--text);}
.cbr-mm-sub{font-size:8px;color:var(--text2);font-family:var(--font-mono);}
#cbr-m-tabs{display:flex;padding:0 14px;border-bottom:1px solid var(--border,#252d3d);flex-shrink:0;overflow-x:auto;scrollbar-width:none;background:var(--bg2);}
#cbr-m-tabs::-webkit-scrollbar{display:none;}
.cbr-tab{font-size:11px;font-weight:500;padding:9px 13px;cursor:pointer;color:var(--text2);border-bottom:2px solid transparent;transition:color .12s;white-space:nowrap;user-select:none;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.cbr-tab:hover{color:var(--text2);}
.cbr-tab.on{color:var(--text);border-bottom-color:var(--blue);}
#cbr-m-body{flex:1;min-height:0;overflow-y:hidden;padding:0;display:flex;flex-direction:column;background:var(--bg);scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;}
#cbr-m-body::-webkit-scrollbar{width:3px!important;}
#cbr-m-body::-webkit-scrollbar-track{background:transparent;}
#cbr-m-body::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
#cbr-m-body::-webkit-scrollbar-thumb:hover{background:var(--text2);}
.cbr-panel{display:none;}
.cbr-panel.on{display:flex;flex:1;flex-direction:column;min-height:0;}
#cbr-p-chart.on{overflow-y:hidden;}
#cbr-p-decisions.on{display:flex;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;}
#cbr-p-decisions.on::-webkit-scrollbar{width:3px!important;}
#cbr-p-decisions.on::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
.cbr-cw{background:var(--bg);border:none;border-radius:0;padding:0;margin-bottom:0;display:flex;flex-direction:column;}
.cbr-cw.fill{height:240px;flex-shrink:0;}
.cbr-ct{display:none;}
.cbr-chart-area{flex:1;min-height:0;height:100%;position:relative;}
.cbr-lw-wrap{width:100%;height:100%;min-height:220px;position:relative;}
.cbr-lw-tooltip{position:absolute;display:none;pointer-events:none;background:var(--bg2);border:1px solid var(--border2);border-radius:4px;padding:6px 10px;font-size:10px;line-height:1.5;font-family:var(--font-mono);color:var(--text);z-index:50;box-shadow:0 4px 16px rgba(0,0,0,.4);white-space:nowrap;}
.cbr-tbl{width:100%;border-collapse:collapse;font-size:10px;font-family:var(--font-mono);}
.cbr-tbl th{text-align:right;color:var(--text2);font-weight:500;font-size:8px;text-transform:uppercase;letter-spacing:.08em;padding:4px 6px 3px;border-bottom:1px solid var(--border2);}
.cbr-tbl th:first-child{text-align:left;}
.cbr-tbl td{text-align:right;padding:4px 6px;border-bottom:1px solid rgba(54,60,78,.4);color:var(--text);}
.cbr-tbl td:first-child{text-align:left;color:var(--text2);}
.cbr-tbl tr:last-child td{border-bottom:none;}
.cbr-tbl tr:hover td{background:rgba(255,255,255,.02);}
.cbr-tbl .now-row td{background:rgba(79,127,255,.05);}
.cu{color:var(--up);}.cd{color:var(--down);}.cf{color:var(--text2);}
.cbr-ctx-wrap{flex-shrink:0;border-top:1px solid var(--border,#252d3d);padding:0 0 6px;background:var(--bg);}
.cbr-ctx-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.cbr-ctx-cell{padding:7px 12px;border-right:1px solid var(--border,#252d3d);border-bottom:1px solid var(--border,#252d3d);}
.cbr-ctx-cell:nth-child(4n){border-right:none;}
.cbr-ctx-cell:nth-last-child(-n+4){border-bottom:none;}
.cbr-ctx-lbl{font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;font-family:var(--font-mono);}
.cbr-ctx-val{font-size:13px;font-weight:600;font-family:var(--font-mono);color:var(--text);}
.cbr-next-fwd{display:grid;grid-template-columns:1fr 1fr;flex-shrink:0;border-top:1px solid var(--border,#252d3d);}
.cbr-ps-wrap{flex:1;min-height:120px;border-top:1px solid var(--border,#252d3d);overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border2,#2e3a50) transparent;background:var(--bg);}
.cbr-ps-wrap::-webkit-scrollbar{width:3px!important;}
.cbr-ps-wrap::-webkit-scrollbar-thumb{background:var(--border2,#2e3a50);border-radius:2px;}
.cbr-ps-hdr{display:flex;align-items:center;justify-content:space-between;padding:5px 14px 4px;border-bottom:1px solid var(--border,#252d3d);flex-shrink:0;}
.cbr-ps-hdr-lbl{font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;font-family:var(--font-mono);}
.cbr-ps-hdr-src{font-size:8px;color:var(--text2);font-family:var(--font-mono);}
.cbr-ps-article{padding:9px 14px 10px;border-bottom:1px solid rgba(54,60,78,.35);}
.cbr-ps-article:last-child{border-bottom:none;}
.cbr-ps-art-meta{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.cbr-ps-art-source{font-size:8px;font-weight:600;color:var(--accent,var(--blue));font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.05em;}
.cbr-ps-art-time{font-size:8px;color:var(--text2);font-family:var(--font-mono);}
.cbr-ps-art-title{font-size:10px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:5px;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.cbr-ps-art-title a{color:inherit;text-decoration:none;}
.cbr-ps-art-title a:hover{text-decoration:underline;text-decoration-color:var(--text2);}
.cbr-ps-art-body{font-size:10px;color:var(--text2);line-height:1.55;font-family:var(--font-ui,'Inter',-apple-system,sans-serif);}
.cbr-ps-loading{padding:14px;font-size:10px;color:var(--text2);font-family:var(--font-mono);}
.cbr-ps-empty{padding:14px;font-size:10px;color:var(--text2);font-family:var(--font-mono);}
@media(max-width:480px){
  #cbr-m-metrics{grid-template-columns:repeat(3,1fr);}
  .cbr-ctx-grid{grid-template-columns:repeat(2,1fr);}
  .cbr-ctx-cell:nth-child(4n){border-right:1px solid var(--border,#252d3d);}
  .cbr-ctx-cell:nth-child(2n){border-right:none;}
  .cbr-ctx-cell:nth-last-child(-n+4){border-bottom:1px solid var(--border,#252d3d);}
  .cbr-ctx-cell:nth-last-child(-n+2){border-bottom:none;}
}
`;
  document.head.appendChild(s);
})();

const _cbrMonoF="var(--font-mono,'JetBrains Mono','Courier New',monospace)";
let _cbrLwChart=null;
function _destroyCBRChart(){if(_cbrLwChart){try{_cbrLwChart.remove();}catch(_){}  _cbrLwChart=null;}}

function _cbrBuildContextStrip(decisions, chronData, currentRate, meetingData, nMonths){
  if(!decisions||!chronData||!chronData.length)return'';

  const now=new Date();

  let daysToNext='—';
  if(meetingData?.nextMeetingISO){
    const diff=Math.round((new Date(meetingData.nextMeetingISO)-now)/(864e5));
    daysToNext=diff>=0?diff+'d':'—';
  }

  let mtgsLeft='—';
  if(Array.isArray(meetingData?.allMeetings)){
    const future=meetingData.allMeetings.filter(d=>new Date(d)>now);
    mtgsLeft=future.length;
  }

  const lastDec=decisions[decisions.length-1];
  const lastDir=lastDec?Math.sign(lastDec.delta):0;
  let cycleStart=null;
  if(lastDir!==0){
    for(let i=decisions.length-1;i>=0;i--){
      if(Math.sign(decisions[i].delta)===lastDir)cycleStart=decisions[i].time;
      else break;
    }
  }
  let cycleDurTxt='—';
  if(cycleStart){
    const ms=now-new Date(cycleStart);
    const mo=Math.round(ms/(1000*60*60*24*30.44));
    cycleDurTxt=mo+'m';
  }

  const rates=chronData.map(d=>d.value);
  const hi=Math.max(...rates),lo=Math.min(...rates);

  let avgChg='—';
  if(decisions.length){
    const totalBp=decisions.reduce((s,d)=>s+Math.abs(d.delta),0);
    avgChg=(Math.round(totalBp/decisions.length*100))+'bp';
  }

  let holdStreak='—';
  if(lastDec){
    const msSinceLast=now-new Date(lastDec.time);
    const moSinceLast=Math.floor(msSinceLast/(1000*60*60*24*30.44));
    holdStreak=moSinceLast>0?moSinceLast+'m':' <1m';
  }

  function _cell(lbl,val,valCol){
    return`<div class="cbr-ctx-cell"><div class="cbr-ctx-lbl">${lbl}</div><div class="cbr-ctx-val"${valCol?` style="color:${valCol}"`:''}>${val}</div></div>`;
  }

  return`<div class="cbr-ctx-wrap">` +
    `<div class="cbr-ct" style="padding:6px 12px 4px;">RATE CONTEXT</div>` +
    `<div class="cbr-ctx-grid">` +
      _cell('Days to Mtg', daysToNext) +
      _cell('Mtgs Left '+now.getFullYear(), mtgsLeft) +
      _cell('Cycle Duration', cycleDurTxt) +
      _cell('Period High', hi.toFixed(2)+'%','var(--up)') +
      _cell('Period Low', lo.toFixed(2)+'%','var(--down)') +
      _cell('Avg Move', avgChg) +
      _cell('Hold Streak', holdStreak) +
      _cell('Decisions', decisions.length) +
    `</div></div>`;
}

function _processCBRateData(obs){
  if(!obs||!obs.length)return{chronData:[],decisions:[]};
  const chron=[...obs].reverse();
  const chronData=chron.map(o=>({time:o.date.length===7?o.date+'-01':o.date,value:parseFloat(o.value)}));
  const decisions=[];
  for(let i=1;i<chronData.length;i++){
    const delta=chronData[i].value-chronData[i-1].value;
    if(Math.abs(delta)>=0.01)decisions.push({time:chronData[i].time,delta,rate:chronData[i].value});
  }
  return{chronData,decisions};
}

function _cbrLwOptions(){
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#131722';
  const text2=getComputedStyle(document.documentElement).getPropertyValue('--text2').trim()||'#9096a0';
  return{
    layout:{background:{type:'solid',color:bg},textColor:text2,fontFamily:getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()||"'Courier New',monospace",fontSize:9,attributionLogo:false},
    grid:{vertLines:{color:'rgba(255,255,255,0.04)'},horzLines:{color:'rgba(255,255,255,0.04)'}},
    crosshair:{mode:window.LightweightCharts?.CrosshairMode?.Normal??1,vertLine:{color:'rgba(255,255,255,0.2)',style:2,labelVisible:false},horzLine:{color:'rgba(255,255,255,0.12)',style:2,labelVisible:true}},
    rightPriceScale:{borderVisible:false,scaleMargins:{top:0.15,bottom:0.1}},
    timeScale:{borderVisible:false,timeVisible:false,fixLeftEdge:false,fixRightEdge:true,animation:{duration:0}},
    handleScroll:{mouseWheel:true,pressedMouseMove:true},
    handleScale:{mouseWheel:true,pinch:true},
    localization:{priceFormatter:v=>v!=null?v.toFixed(2)+'%':'—'},
  };
}

function _attachCBRTooltip(container,lwChart,mainSeries,fwdSeries,decisions){
  const tip=document.createElement('div');tip.className='cbr-lw-tooltip';container.style.position='relative';container.appendChild(tip);
  const TW=180,TM=10,decMap={};decisions.forEach(d=>{decMap[d.time]=d;});
  lwChart.subscribeCrosshairMove(param=>{
    if(!param?.point||!param.seriesData){tip.style.display='none';return;}
    const mv=param.seriesData.get(mainSeries);if(!mv){tip.style.display='none';return;}
    const timeStr=typeof param.time==='string'?param.time:'',dec=decMap[timeStr],rate=mv.value,mon=timeStr.slice(0,7);
    let html=`<div style="font-size:8px;color:var(--text2);letter-spacing:.05em;margin-bottom:3px;">${mon}</div>`;
    html+=`<div>Rate &nbsp;<span style="color:var(--blue);font-weight:700;">${rate.toFixed(2)}%</span></div>`;
    if(dec){const col=dec.delta>0?'var(--up)':'var(--down)',sign=dec.delta>0?'+':'';html+=`<div style="margin-top:2px;color:${col};font-weight:600;">${sign}${Math.round(dec.delta*100)}bp decision</div>`;}
    if(fwdSeries){const fv=param.seriesData.get(fwdSeries);if(fv)html+=`<div style="color:var(--text2);">OIS fwd ${fv.value.toFixed(2)}%</div>`;}
    tip.innerHTML=html;tip.style.display='block';
    const cW=container.offsetWidth,cx=param.point.x,cy=param.point.y,th=tip.offsetHeight||50;
    const tx=(cx+TM+TW<=cW-4)?cx+TM:cx-TM-TW,ty=(cy-th-TM>=4)?cy-th-TM:cy+TM;
    tip.style.left=Math.max(0,tx)+'px';tip.style.top=Math.max(0,ty)+'px';
  });
}

function _cbrDims(){
  const modal=document.getElementById('cbr-modal');
  if(!modal)return{w:600,h:240};

  const w=Math.max(modal.offsetWidth-28,200);

  if(window.innerWidth<=600) return{w,h:220};

  return{w,h:240};
}

function _buildCBRChart(data){
  const container=document.querySelector('.cbr-lw-wrap');if(!container)return;
  const LWC=window.LightweightCharts;if(!LWC)return;
  _destroyCBRChart();
  const parent=container.parentElement;
  const{w:initW,h:initH}=_cbrDims();
  container.style.width=initW+'px';
  container.style.height=initH+'px';
  const opts=_cbrLwOptions();
  opts.width=initW;opts.height=initH;
  opts.kineticScroll={touch:false,mouse:false};
  _cbrLwChart=LWC.createChart(container,opts);
  const{chronData,decisions,fwdRate,bias}=data;
  const blue=getComputedStyle(document.documentElement).getPropertyValue('--chart-line').trim()||'#4f7fff';
  const mainSeries=_cbrLwChart.addSeries(LWC.AreaSeries,{lineColor:blue,topColor:'rgba(79,127,255,0.16)',bottomColor:'rgba(79,127,255,0.01)',lineWidth:2,lineType:LWC.LineType?.WithSteps??1,crosshairMarkerVisible:true,crosshairMarkerRadius:4,crosshairMarkerBorderColor:'rgba(0,0,0,.5)',crosshairMarkerBorderWidth:2,priceLineVisible:false,lastValueVisible:true});
  mainSeries.setData(chronData);
  let fwdSeries=null;
  if(fwdRate!=null&&chronData.length>0){
    const last=chronData[chronData.length-1],ld=new Date(last.time);
    ld.setMonth(ld.getMonth()+1);
    const fwdTime=ld.toISOString().slice(0,10);
    const fwdCol=bias==='cut'?'var(--down,#ef5350)':bias==='hike'?'var(--up,#26a69a)':'var(--text2,#9096a0)';
    fwdSeries=_cbrLwChart.addSeries(LWC.LineSeries,{color:fwdCol,lineWidth:1,lineStyle:LWC.LineStyle?.Dashed??1,crosshairMarkerVisible:true,crosshairMarkerRadius:4,priceLineVisible:false,lastValueVisible:true});
    fwdSeries.setData([{time:last.time,value:last.value},{time:fwdTime,value:fwdRate}]);
  }
  _cbrLwChart.timeScale().fitContent();
  _attachCBRTooltip(container,_cbrLwChart,mainSeries,fwdSeries,decisions);
  const apply=()=>{
    const{w,h}=_cbrDims();
    if(_cbrLwChart&&w>0&&h>10){
      container.style.width=w+'px';container.style.height=h+'px';
      _cbrLwChart.applyOptions({width:w,height:h});_cbrLwChart.timeScale().fitContent();
    }
  };
  window.addEventListener('resize',apply);container._cbrResize=apply;
}

async function openCBRatesModal(ccy,obs,bankInfo,meetingData){
  closeCBRatesModal();
  if(!meetingData){
    try{
      const st=window._STATE_meetings;
      if(st?.meetings?.[ccy]){meetingData=st.meetings[ccy];}
      else{const res=await fetch(GI_DATA_BASE + 'meetings-data/meetings.json').then(r=>r.ok?r.json():null).catch(()=>null);if(res?.meetings?.[ccy])meetingData=res.meetings[ccy];}
    }catch(_){}
  }
  const{chronData,decisions}=_processCBRateData(obs);
  const rates=chronData.map(d=>d.value);
  const currentRate=rates[rates.length-1]??0,rateStart=rates[0]??0,totalChange=currentRate-rateStart;
  const nDecisions=decisions.length,nMonths=obs.length;
  const lastDec=decisions[decisions.length-1];
  const PAUSE_THRESHOLD_DAYS=90;let pauseDetected=false;
  if(lastDec){const daysSinceLast=(Date.now()-new Date(lastDec.time).getTime())/(864e5);if(daysSinceLast>PAUSE_THRESHOLD_DAYS)pauseDetected=true;}
  const trend=!lastDec||pauseDetected?'flat':lastDec.delta>0?'hiking':'cutting';
  const trendLabel=trend==='hiking'?'\u2191 Hiking cycle':trend==='cutting'?'\u2193 Cutting cycle':'\u2014 On hold';
  const trendCol=trend==='hiking'?'var(--up)':trend==='cutting'?'var(--down)':'var(--text2)';
  const lastDir=lastDec?Math.sign(lastDec.delta):0;
  let cycleCum=0;
  for(let i=decisions.length-1;i>=0;i--){if(Math.sign(decisions[i].delta)===lastDir)cycleCum+=decisions[i].delta;else break;}
  const cycleStr=lastDir!==0?(lastDir>0?'+':'')+Math.round(cycleCum*100)+'bp this cycle':'—';
  const bias=meetingData?.bias??null,nextMtg=meetingData?.nextMeeting??'—';
  const biasLabel=bias==='cut'?'\u2193 Cut':bias==='hike'?'\u2191 Hike':'\u2192 Hold';
  const biasCol=bias==='cut'?'var(--down)':bias==='hike'?'var(--up)':'var(--text2)';
  let fwdRate=null,fwdDisplay='—',fwdIsEst=false,fwdIsProbEst=false;
  if(meetingData?.fwdRate!=null&&!isNaN(meetingData.fwdRate)){fwdRate=parseFloat(meetingData.fwdRate);fwdDisplay=fwdRate.toFixed(2)+'%';}
  else{
    const pCut=meetingData?.cutProb!=null?Math.min(100,Math.max(0,meetingData.cutProb)):null;
    const pHike=meetingData?.hikeProb!=null?Math.min(100,Math.max(0,meetingData.hikeProb)):null;
    if(pCut!==null||pHike!==null){const cut=pCut??0,hike=Math.min(pHike??0,100-cut);const cbStepModal=ccy==='JPY'?0.10:0.25;fwdRate=currentRate+(hike/100)*cbStepModal-(cut/100)*cbStepModal;fwdDisplay=fwdRate.toFixed(2)+'%';fwdIsProbEst=true;}
    else{const step=bias==='cut'?-0.25:bias==='hike'?0.25:0;fwdRate=Math.max(0,currentRate+step);fwdDisplay='~'+fwdRate.toFixed(2)+'%';fwdIsEst=true;}
  }
  const bankName=bankInfo?.name||ccy,bankShort=bankInfo?.short||ccy;
  const flagHtml=bankInfo?.flag?`<span class="fi fi-${bankInfo.flag}" style="margin-right:6px;border-radius:2px;font-size:14px;vertical-align:middle;"></span>`:'';

  const bd=document.createElement('div');bd.id='cbr-bd';
  bd.innerHTML=`
<div id="cbr-modal">
  <div id="cbr-m-hd">
    <div>
      <div id="cbr-m-title">${flagHtml}${bankName} \u2014 Policy Rate History</div>
      <div id="cbr-m-sub">${nMonths} months \u00b7 ${nDecisions} decisions \u00b7 CB rates cache \u00b7 monthly</div>
    </div>
    <button id="cbr-m-close" onclick="closeCBRatesModal()" aria-label="Close">\u00d7</button>
  </div>
  <div id="cbr-m-metrics">
    <div class="cbr-mm"><div class="cbr-mm-lbl">Current Rate</div><div class="cbr-mm-val">${currentRate.toFixed(2)}%</div><div class="cbr-mm-sub">${bankShort}</div></div>
    <div class="cbr-mm"><div class="cbr-mm-lbl">Cycle</div><div class="cbr-mm-val" style="font-size:11px;color:${trendCol}">${trendLabel}</div><div class="cbr-mm-sub">${cycleStr}</div></div>
    <div class="cbr-mm"><div class="cbr-mm-lbl">Total Change</div><div class="cbr-mm-val ${totalChange>0?'cu':totalChange<0?'cd':'cf'}">${totalChange>0?'+':''}${Math.round(totalChange*100)}bp</div><div class="cbr-mm-sub">${nMonths}m period</div></div>
  </div>
  <div id="cbr-m-tabs" role="tablist" aria-label="CB rate chart views">
    <div class="cbr-tab on" data-tab="chart"    onclick="cbRatesTab(this,'chart')"    role="tab" aria-selected="true">Rate Chart</div>
    <div class="cbr-tab"    data-tab="decisions" onclick="cbRatesTab(this,'decisions')" role="tab" aria-selected="false">Decisions</div>
  </div>
  <div id="cbr-m-body">
    <div id="cbr-p-chart" class="cbr-panel on">
      <div class="cbr-cw fill">
        <div class="cbr-ct">POLICY RATE \u00b7 MONTHLY \u00b7 STEP CHART \u00b7 DECISION MARKERS</div>
        <div class="cbr-chart-area" style="padding:8px 12px 4px;"><div class="cbr-lw-wrap"></div></div>
      </div>
      <div class="cbr-next-fwd">
        <div style="padding:10px 14px;border-right:1px solid var(--border,#252d3d);"><div style="font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;font-family:var(--font-mono)">Next Meeting</div><div style="font-size:13px;font-weight:600;font-family:var(--font-mono);color:var(--text)">${nextMtg}</div><div style="font-size:9px;font-family:var(--font-mono);color:${biasCol};margin-top:2px;">${biasLabel}</div></div>
        <div style="padding:10px 14px;" title="${fwdIsEst?'Bias-only estimate — no OIS probability data.':'Probability-weighted expected rate at next meeting: E[rate] = current + P(hike)×step − P(cut)×step, where step = 25bp (10bp for BoJ). Derived from OIS/futures market probabilities (OIS-implied probability methodology).'}" ><div style="font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;font-family:var(--font-mono)">Fwd Rate</div><div style="font-size:13px;font-weight:600;font-family:var(--font-mono);color:${bias==='cut'?'var(--down)':bias==='hike'?'var(--up)':'var(--text)'}">${fwdDisplay}</div><div style="font-size:9px;font-family:var(--font-mono);color:var(--text2);margin-top:2px;">${fwdIsEst?'~ est \u00b7 bias only':'prob. weighted \u00b7 OIS'}</div></div>
      </div>
      ${_cbrBuildContextStrip(decisions,chronData,currentRate,meetingData,nMonths)}
      <div id="cbr-policy-summary" class="cbr-ps-wrap">
        <div class="cbr-ps-loading">Loading market commentary…</div>
      </div>
    </div>
    <div id="cbr-p-decisions" class="cbr-panel">
      <div class="cbr-cw" style="flex:1;min-height:0;overflow:auto;">
        <div class="cbr-ct">RATE DECISIONS \u00b7 ${nDecisions} CHANGES IN ${nMonths} MONTHS</div>
        <div style="overflow-x:auto;">
          <table class="cbr-tbl" aria-label="Rate decisions table">
            <thead><tr><th scope="col" style="text-align:left">Date</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Change</th><th scope="col">Cumulative</th></tr></thead>
            <tbody id="cbr-decisions-body"></tbody>
          </table>
        </div>
      </div>
      <div style="flex-shrink:0;border-top:1px solid var(--border,#252d3d);display:grid;grid-template-columns:1fr 1fr 1fr;">
        <div style="padding:10px 14px;border-right:1px solid var(--border,#252d3d);"><div style="font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;font-family:var(--font-mono)">Period High</div><div style="font-size:16px;font-weight:600;font-family:var(--font-mono);color:var(--up)">${Math.max(...rates).toFixed(2)}%</div></div>
        <div style="padding:10px 14px;border-right:1px solid var(--border,#252d3d);"><div style="font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;font-family:var(--font-mono)">Period Low</div><div style="font-size:16px;font-weight:600;font-family:var(--font-mono);color:var(--down)">${Math.min(...rates).toFixed(2)}%</div></div>
        <div style="padding:10px 14px;"><div style="font-size:8px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;font-family:var(--font-mono)">Decisions</div><div style="font-size:16px;font-weight:600;font-family:var(--font-mono);color:var(--text)">${nDecisions}</div></div>
      </div>
    </div>
  </div>
</div>`;

  document.body.appendChild(bd);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ bd.scrollIntoView({behavior:'smooth',block:'start'}); }));
  const dBody=document.getElementById('cbr-decisions-body');
  if(dBody&&decisions.length){
    let running=0;
    const cumuls=decisions.map(d=>{running+=d.delta;return running;});
    const rev=[...decisions].map((d,i)=>({...d,cumul:cumuls[decisions.length-1-i]})).reverse();
    dBody.innerHTML=rev.map((d,i)=>{
      const before=(d.rate-d.delta).toFixed(2),after=d.rate.toFixed(2);
      const chgBp=Math.round(d.delta*100),cumBp=Math.round(d.cumul*100);
      return`<tr${i===0?' class="now-row"':''}><td>${d.time.slice(0,7)}${i===0?' <span style="color:var(--up);font-size:8px">latest</span>':''}</td><td>${before}%</td><td>${after}%</td><td class="${chgBp>0?'cu':chgBp<0?'cd':'cf'}">${chgBp>0?'+':''}${chgBp}bp</td><td class="${cumBp>0?'cu':cumBp<0?'cd':'cf'}">${cumBp>0?'+':''}${cumBp}bp</td></tr>`;
    }).join('');
  }else if(dBody){dBody.innerHTML=`<tr><td colspan="5" style="color:var(--text2);padding:10px 6px;">No rate changes in the available history.</td></tr>`;}

  bd.addEventListener('click',e=>{if(e.target===bd)closeCBRatesModal();});
  const esc=e=>{if(e.key==='Escape')closeCBRatesModal();};
  document.addEventListener('keydown',esc);bd._esc=esc;
  bd._chartData={chronData,decisions,fwdRate,bias,currentRate};
  bd._ccy=ccy;
  requestAnimationFrame(()=>requestAnimationFrame(()=>_buildCBRChart(bd._chartData)));
  setTimeout(()=>_cbrLoadPolicySummary(ccy, bankShort), 100);
}

function _escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function _cbrLoadPolicySummary(ccy, bankShort){
  const wrap=document.getElementById('cbr-policy-summary');
  if(!wrap)return;
  try{
    const res=await fetch(GI_DATA_BASE + 'news-data/news.json',{cache:'no-store'}).catch(()=>null);
    if(!res?.ok)throw new Error('fetch failed');
    const j=await res.json();
    const CB_KW=['rate','hike','cut','hold','hawkish','dovish','inflation','gdp','policy','central bank',
      'meeting','basis point','monetary','forecast','outlook','economy'];
    const articles=(j.articles||[])
      .filter(a=>{
        if(a.cur!==ccy)return false;
        const exp=(a.expand||'').replace(/<[^>]+>/g,'').trim();
        if(exp.length<80)return false;
        const combined=(a.title+' '+exp).toLowerCase();
        return CB_KW.some(k=>combined.includes(k));
      })
      .sort((a,b)=>(b.ts||0)-(a.ts||0))
      .slice(0,6);

    const updLabel=j.updated_label||'';

    if(!articles.length){
      wrap.innerHTML=`<div class="cbr-ps-empty">No ${bankShort} commentary available.</div>`;
      return;
    }

    const hdrHtml=`<div class="cbr-ps-hdr">
      <span class="cbr-ps-hdr-lbl">Market Commentary · ${bankShort}</span>
      <span class="cbr-ps-hdr-src">Institutional RSS · ${updLabel}</span>
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
      return`<div class="cbr-ps-article">
        <div class="cbr-ps-art-meta">
          <span class="cbr-ps-art-source">${_escHtml(a.source||'')}</span>
          <span class="cbr-ps-art-time">${_escHtml(timeStr)}</span>
        </div>
        <div class="cbr-ps-art-title">${titleHtml}</div>
        <div class="cbr-ps-art-body">${_escHtml(body)}</div>
      </div>`;
    }).join('');

    wrap.innerHTML=hdrHtml+articlesHtml;
  }catch{
    wrap.innerHTML=`<div class="cbr-ps-empty">Market commentary unavailable.</div>`;
  }
}

function cbRatesTab(el,tabId){
  document.querySelectorAll('.cbr-tab').forEach(t=>{t.classList.remove('on');t.setAttribute('aria-selected','false');});
  document.querySelectorAll('.cbr-panel').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');el.setAttribute('aria-selected','true');
  const panel=document.getElementById('cbr-p-'+tabId);if(panel)panel.classList.add('on');
  const body=document.getElementById('cbr-m-body');
  if(body)body.style.overflowY=tabId==='decisions'?'auto':'hidden';
  if(tabId==='chart'){const bd=document.getElementById('cbr-bd');if(bd?._chartData)requestAnimationFrame(()=>requestAnimationFrame(()=>_buildCBRChart(bd._chartData)));}
}

function closeCBRatesModal(){
  const bd=document.getElementById('cbr-bd');
  if(bd){if(bd._esc)document.removeEventListener('keydown',bd._esc);bd.remove();}
  const wrap=document.querySelector('.cbr-lw-wrap');
  if(wrap?._cbrResize)window.removeEventListener('resize',wrap._cbrResize);
  if(wrap?._cbrRo)wrap._cbrRo.disconnect();
  _destroyCBRChart();
}

window.openCBRatesModal=openCBRatesModal;window.closeCBRatesModal=closeCBRatesModal;window.cbRatesTab=cbRatesTab;
