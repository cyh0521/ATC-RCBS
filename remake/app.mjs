import { NM, DEG, FIXES, RWY, SOURCES, PERF, CHANNELS, SCENARIOS, sid, star, sidRoute, starRoute, approachRoute, toAir } from './data.mjs';
import { Simulation, STATUS, isAir, isGround } from './sim.mjs';
import { createAirport } from './world.mjs';

const $=s=>document.querySelector(s);
const sim=new Simulation('morning');let airport=null,chosenScenario='morning',radioFilter='ALL',range='wide',showRoutes=true;
let audioEnabled=false,audioContext,logSignature='',lastUI=0,lastRender=0,toastTimer,pauseBeforeDialog=true,finishedShown=false,elapsed=0;
const radar=$('#radar'),ctx=radar.getContext('2d');let radarWidth=1,radarHeight=1,radarHits=[];
const clock=(seconds,short=false)=>{const s=Math.floor(seconds)+8*3600;return `${String(Math.floor(s/3600)%24).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}${short?'':':'+String(s%60).padStart(2,'0')}`;};
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
function selectAircraft(id){sim.selected=id;updateUI();}
function playRadio(e){
  if(!audioEnabled||e.type==='info')return;
  try{
    audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=e.type==='atc'?780:610;gain.gain.setValueAtTime(.025,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.14);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.14);
    if('speechSynthesis'in window&&!speechSynthesis.speaking){const utterance=new SpeechSynthesisUtterance(e.text);utterance.lang='zh-TW';utterance.rate=1.25;utterance.volume=.8;const voice=speechSynthesis.getVoices().find(v=>v.lang==='zh-TW')||speechSynthesis.getVoices().find(v=>v.lang.startsWith('zh'));if(voice)utterance.voice=voice;speechSynthesis.speak(utterance);}
  }catch{}
}
function renderLog(){
  const entries=sim.log.filter(e=>radioFilter==='ALL'||e.channel===radioFilter).slice(-65),signature=radioFilter+':'+entries.map(e=>e.time+e.text).join('|');
  if(signature===logSignature)return;logSignature=signature;
  const log=$('#radio-log'),atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<70;
  log.innerHTML=entries.map(e=>`<article class="radio-entry ${e.type}"><div class="meta"><time>${clock(e.time,true)}</time><span class="speaker">${escapeHTML(e.who)}</span><span class="radio-channel">${e.channel}</span></div><p>${escapeHTML(e.text)}</p></article>`).join('');
  if(atBottom)log.scrollTop=log.scrollHeight;
}
function renderStrips(kind,el){
  el.innerHTML=sim.aircraft.filter(a=>a.kind===kind).map(a=>`<button class="flight-strip ${a.id===sim.selected?'selected':''} ${a.request?'needs':''} ${!a.active?'inactive':''} ${a.completed?'done':''}" data-flight="${a.id}" aria-pressed="${a.id===sim.selected}"><span><strong>${a.id}${a.request?'<i class="request-dot"></i>':''}</strong><small>${PERF[a.type].short} · ${a.kind==='DEP'?'機位 '+a.gate:'→ 機位 '+a.gate}</small></span><span class="city">${a.city}<small>${clock(a.due,true)}</small></span><span class="state">${!a.active&&a.state==='SCHEDULED'?'尚未進入空域':a.pending?'通話中':a.manualHold?'原地等待':a.trafficHold?'保持間隔':a.completed&&a.kind==='DEP'?'已移交進近':STATUS[a.state]}<small>${a.completed?'✓ 完成':a.kind==='ARR'&&isAir(a)?`${Math.round(a.alt/100)*100} ft`:(a.state==='SCHEDULED'?'準備中':CHANNELS[a.channel]?.freq||'')}</small></span></button>`).join('');
  el.querySelectorAll('[data-flight]').forEach(b=>b.onclick=()=>selectAircraft(b.dataset.flight));
}
let stripSignature='',commandSignature='';
function updateUI(){
  $('#clock').textContent=clock(sim.time);$('#wind').textContent=sim.scenario.wind;$('#rwy').textContent=sim.rwy;$('#scenario-name').textContent=sim.scenario.name;
  $('#pause').textContent=sim.paused?'▶ 繼續':'Ⅱ 暫停';$('#pause').setAttribute('aria-pressed',String(!sim.paused));
  if(sim.time===0&&sim.paused)$('#pause').textContent='▶ 開始';
  $('#pause').disabled=sim.finished;if(sim.finished)$('#pause').textContent='✓ 本班完成';
  document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',+b.dataset.speed===sim.speed));
  $('#progress').textContent=`完成 ${sim.completed} / ${sim.aircraft.length}`;$('#score').textContent=`效率 ${sim.score}`;
  $('#footer-message').textContent=sim.finished?sim.message:sim.paused?'模擬暫停 · 空白鍵繼續':sim.message;
  const landing=sim.aircraft.find(a=>a.landing&&['APPROACH','FINAL'].includes(a.state));
  const rwyText=sim.runwayOwner?`${sim.runwayOwner} 使用中`:landing?`${landing.id} 已准降落`:'跑道可用';
  $('#runway-status').innerHTML='<i></i> '+rwyText;$('#runway-status').classList.toggle('busy',!!sim.runwayOwner||!!landing);
  for(const b of document.querySelectorAll('[data-channel]'))b.classList.toggle('busy',!!sim.radio[b.dataset.channel]?.length);
  const ss=sim.selected+'|'+sim.aircraft.map(a=>[a.id,a.state,a.pending,a.manualHold,a.trafficHold,a.request,a.active,a.completed,Math.round(a.alt/100)].join(':')).join('|');
  if(ss!==stripSignature){stripSignature=ss;renderStrips('DEP',$('#departures'));renderStrips('ARR',$('#arrivals'));}
  for(const [kind,id] of [['DEP','departure-count'],['ARR','arrival-count']]){const list=sim.aircraft.filter(a=>a.kind===kind);$('#'+id).textContent=`${list.filter(a=>a.completed).length} / ${list.length}`;}
  const a=sim.selectedAircraft;
  $('#selected-category').textContent=a.kind==='DEP'?'離場航班 / DEPARTURE':'進場航班 / ARRIVAL';
  $('#selected-callsign').textContent=a.id;$('#selected-route').textContent=`${PERF[a.type].short} ${a.kind==='DEP'?'→':'←'} ${a.city}`;
  $('#selected-status').textContent=a.pending?'通話／回讀中':a.completed?'管制完成':a.manualHold?'原地等待':STATUS[a.state];
  $('#selected-status').classList.toggle('request',a.request);
  $('#selected-details').innerHTML=`<span>${a.kind==='DEP'?sid(sim.rwy):star(sim.rwy)+' → ILS '+sim.rwy}</span><span>機位 ${a.gate}</span><span>${CHANNELS[a.channel].name} ${CHANNELS[a.channel].freq}</span>${isAir(a)?`<span>${Math.round(a.alt/100)*100} ft · ${Math.round(a.airspeed)} kt</span>`:''}`;
  const commands=sim.commands(),cs=JSON.stringify(commands)+a.id;
  if(cs!==commandSignature){commandSignature=cs;$('#commands').innerHTML=commands.length?commands.map(c=>`<button data-command="${c.id}" ${c.disabled?'disabled':''} title="${escapeHTML(c.reason||c.label)}">${c.label}</button>`).join(''):'<span class="waiting-label">'+(a.completed?'✓ 已完成本航班管制':'觀察航機動態，等待下一次通話')+'</span>';
    $('#commands').querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>{const result=sim.execute(b.dataset.command);if(!result.ok)toast(result.reason);else if(sim.paused)toast('指令已排入通話，按「繼續」開始執行。');updateUI();});
  }
  const disabled=commands.find(c=>c.disabled&&c.reason&&c.id!=='pending');
  $('#guidance').textContent=disabled?disabled.reason:sim.advisory();
  renderLog();
  if(sim.finished&&!finishedShown){finishedShown=true;$('#finish-stats').innerHTML=`<div><strong>${sim.completed}</strong><small>完成航班</small></div><div><strong>${sim.score}</strong><small>效率分數</small></div><div><strong>${sim.penalties}</strong><small>自動等待／重飛</small></div>`;$('#finish-dialog').showModal();}
}
function resizeRadar(){const r=radar.parentElement.getBoundingClientRect();radarWidth=r.width;radarHeight=r.height;const dpr=Math.min(devicePixelRatio,2);radar.width=r.width*dpr;radar.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
new ResizeObserver(resizeRadar).observe(radar.parentElement);
function drawRadar(){
  const w=radarWidth,h=radarHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='#1e3933';ctx.fillRect(0,0,w,h);
  const bounds=range==='wide'?{cx:10*NM,cy:-14*NM,s:Math.min((w-38)/(57*NM),(h-36)/(52*NM))}:{cx:0,cy:-4*NM,s:Math.min((w-38)/(29*NM),(h-36)/(29*NM))};
  const xy=p=>({x:w/2+(p.x-bounds.cx)*bounds.s,y:h/2-(p.y-bounds.cy)*bounds.s});
  const path=(points,color,dash=[],width=1)=>{if(!points.length)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>{const q=xy(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.stroke();ctx.setLineDash([]);};
  // Coast silhouette is contextual decoration; route coordinates are from eAIP.
  const coast=[[-3,2],[-5,3],[-6,5],[-4,6],[-2,5],[0,6],[2,5],[4,7],[6,6],[7,3],[6,1],[3,0],[1,1],[-1,0],[-3,2]].map(([x,y])=>({x:x*NM,y:y*NM}));
  ctx.fillStyle='#294b3d';ctx.strokeStyle='#476650';ctx.lineWidth=.7;ctx.beginPath();coast.forEach((p,i)=>{const q=xy(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.fill();ctx.stroke();
  const zero=xy(FIXES.ARP);ctx.strokeStyle='#385447';ctx.lineWidth=.6;
  for(const radius of range==='wide'?[10,20,30,40]:[5,10,15]){ctx.beginPath();ctx.arc(zero.x,zero.y,radius*NM*bounds.s,0,Math.PI*2);ctx.stroke();}
  ctx.strokeStyle='#2e4a40';ctx.setLineDash([2,7]);ctx.beginPath();ctx.moveTo(zero.x,0);ctx.lineTo(zero.x,h);ctx.moveTo(0,zero.y);ctx.lineTo(w,zero.y);ctx.stroke();ctx.setLineDash([]);
  if(showRoutes){
    path([toAir(sim.rwy==='06'?1600:1800,0),...sidRoute(sim.rwy)],'#b7a57180',[3,4]);
    path([...starRoute(sim.rwy),...approachRoute(sim.rwy)],'#86ad9475',[],1.1);
  }
  path([toAir(0,0),toAir(3004,0)],'#c7d4aa',[],2.5);
  const points=range==='wide'?['CUBON','SPICA','POSTY','MELOG','BS001','BS002','INDIA','SANDY']:['SPICA','SANDY','MELOG','SKIRT','INDOK'];
  ctx.font='8px Consolas, monospace';
  for(const id of points){const p=xy(FIXES[id]);if(p.x<5||p.x>w-5||p.y<10||p.y>h-10)continue;ctx.strokeStyle='#93af91';ctx.beginPath();ctx.moveTo(p.x,p.y-3);ctx.lineTo(p.x+3,p.y+3);ctx.lineTo(p.x-3,p.y+3);ctx.closePath();ctx.stroke();ctx.fillStyle='#9db79c';ctx.fillText(id,p.x+5,p.y+3);}
  ctx.fillStyle='#c6d7b5';ctx.font='9px Consolas, monospace';ctx.fillText('RCBS',zero.x-14,zero.y-8);
  const selected=sim.selectedAircraft;if(isAir(selected))path([{x:selected.ax,y:selected.ay},...selected.airRoute.slice(selected.airIndex)],'#c7e5b3',[],1.2);
  radarHits=[];let labelIndex=0;
  for(const a of sim.aircraft){if(!isAir(a))continue;const p=xy({x:a.ax,y:a.ay});if(p.x<-20||p.x>w+20||p.y<-20||p.y>h+20)continue;
    const color=a.kind==='ARR'?'#bfddac':'#dfbd7a',selected=a.id===sim.selected;
    if(a.trail.length)path(a.trail,color+'50',[],1);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a.airHeading*DEG);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3,4);ctx.lineTo(0,2);ctx.lineTo(-3,4);ctx.closePath();ctx.fill();ctx.restore();
    if(selected){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.stroke();}
    const lx=Math.max(8,Math.min(w-82,p.x+11)),ly=Math.max(22,Math.min(h-26,p.y-8+(labelIndex++%2)*15));
    ctx.fillStyle='#1d372eed';ctx.fillRect(lx-3,ly-10,78,30);ctx.font=(selected?'bold ':'')+'10px Consolas, monospace';ctx.fillStyle=color;ctx.fillText(a.id,lx,ly);ctx.font='8px Consolas, monospace';ctx.fillStyle='#9eb49b';ctx.fillText(`${Math.round(a.alt/100)*100}′ ${Math.round(a.airspeed)}kt`,lx,ly+12);
    radarHits.push({id:a.id,x:p.x,y:p.y,lx,ly});
  }
  ctx.font='8px Consolas, monospace';ctx.fillStyle='#6e8e78';ctx.fillText('航點依航圖 · 海岸示意',12,h-8);
}
radar.addEventListener('click',e=>{const r=radar.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hit=radarHits.find(p=>Math.hypot(p.x-x,p.y-y)<18||(x>p.lx-5&&x<p.lx+80&&y>p.ly-14&&y<p.ly+18));if(hit)selectAircraft(hit.id);});

const operationHelp=`<h3>三個動作就能開始</h3><ol><li>點選下方航班管制條、機場裡的飛機，或雷達呼號。</li><li>閱讀中央提示，按可用指令。通話依頻道排隊，回讀完成後才執行。</li><li>觀察飛機與狀態。按空白鍵暫停思考，1×／4×／12× 調整時間。</li></ol><h3>離場順序</h3><p>出發許可 → 後推 → 沿 N 滑行至等待點 → 進跑道等待 → 起飛 → 通過 600 ft 後移交高雄進近。06 由 D 進入後回滑至位移入口迴轉區；24 由 A 進入。後推與滑行中可原地等待或繼續。</p><h3>進場順序</h3><p>核准 ILS → 沿公布 STAR 與 DME 弧線 → 接近 IF 後移交塔台 → 降落許可 → 滑跑與脫離 → 沿 N 滑回機位。有衝突時可先安排 SANDY 等待，或在進場中下達重飛。</p><h3>保持跑道可用</h3><p>06 回滑耗時較長，請及早處理離場。灰色指令下方會說明阻擋原因。落地飛機越過跑道外的等待位置後，才會釋放跑道。航機在地面接近前機時會自動停止保持間隔。</p><h3>畫面與聲音</h3><p>主畫面可拖曳、滾輪縮放，右上可切換全景／機坪。雷達有全域／近場兩種比例。語音由瀏覽器提供，開啟後會播放新通話；忙碌時保留文字紀錄，避免語音堆積。</p><p class="note">每架完成移交或停靠的航班 +100 分；未及時核准進場會自動安排等待，最後進場缺少安全降落條件會重飛。表定時間用於安排先後，不會強迫危險操作。</p>`;
function sourceHelp(){const base=location.pathname.replace(/\\/g,'/').includes('/remake/')?'../_Data/':'_Data/';return `<h3>依據你提供的官方文件</h3><p>本版採用專案封存版本。數據以原始 PDF 與 eAIP 為準，沒有採用舊版整理文件中的估算座標。</p>${SOURCES.map(s=>`<div class="source-card"><strong>${s.title}</strong><p>${s.detail}</p><a href="${base+encodeURIComponent(s.file)}" target="_blank" rel="noopener">開啟原始文件 ↗</a></div>`).join('')}<h3>本版實作範圍</h3><p>支援 06／24 跑道、CUBON 1A／1B 離場、CUBON 1C／2D 進場、ILS 06／24 與 SANDY 等待／重飛。RNP、LOC、其他 SID、軍機、低能見度及地面車輛管制尚未加入。</p><h3>為遊戲而簡化的部分</h3><p>班表、初始 5,000 ft 許可、機型性能、離地與滑跑距離、減速、管制移交觸發點、地面 48 m 間隔、等待線距離、跑道保護範圍與 0.7 NM 自動重飛觸發皆為遊戲設定。航圖未列出的 SKIRT／INDOK／FAP 位置依台站、距離與航向推算。等待圈、轉彎與下降採簡化運動，不是完整飛行動力學。06 與 24 的最後進場高度依圖中 FAP 約束內插；飛機離地後只顯示於雷達。</p><p>航廈與植栽是簡化造型，飛機顯示放大 1.75 倍。機位與滑行道位置依座標換算，軍用機坪只作場景。06 落地由 B、24 落地由 C 脫離是本關卡安排，非所有飛機的固定官方規定。雷達海岸線為示意。</p><p class="note">這是一個依封存航圖設計的航管遊戲，供遊玩與理解流程；不是實際飛航或管制工具。</p>`;}
function openHelp(tab='operate'){pauseBeforeDialog=sim.paused;sim.paused=true;$('#help-dialog').showModal();setHelpTab(tab);updateUI();}
function setHelpTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#help-body').innerHTML=tab==='sources'?sourceHelp():operationHelp;}
$('#help').onclick=()=>openHelp();$('#sources-button').onclick=()=>openHelp('sources');
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setHelpTab(b.dataset.tab));
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#help-dialog').addEventListener('close',()=>{sim.paused=pauseBeforeDialog;updateUI();});
$('#pause').onclick=()=>{if(sim.finished)return;sim.paused=!sim.paused;updateUI();};
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{sim.speed=+b.dataset.speed;updateUI();});
document.querySelectorAll('[data-channel]').forEach(b=>b.onclick=()=>{radioFilter=b.dataset.channel;document.querySelectorAll('[data-channel]').forEach(o=>o.classList.toggle('active',o===b));logSignature='';renderLog();$('#radio-log').scrollTop=$('#radio-log').scrollHeight;});
document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{range=b.dataset.range;$('#radar-range').textContent=range==='wide'?'50 NM':'25 NM';document.querySelectorAll('[data-range]').forEach(o=>o.classList.toggle('active',o===b));});
$('#routes').onclick=()=>{showRoutes=!showRoutes;$('#routes').classList.toggle('active',showRoutes);};
$('#sound').onclick=()=>{audioEnabled=!audioEnabled;$('#sound').textContent='語音 '+(audioEnabled?'開':'關');$('#sound').setAttribute('aria-pressed',String(audioEnabled));if(!audioEnabled&&'speechSynthesis'in window)speechSynthesis.cancel();if(audioEnabled)toast('已開啟通話語音；語音音色依瀏覽器可用語音而定。');};
function view(mode){airport?.setView(mode);$('#overview').classList.toggle('active',mode==='overview');$('#apron').classList.toggle('active',mode==='apron');$('#follow-plane').classList.toggle('active',mode==='aircraft');}
$('#overview').onclick=()=>view('overview');$('#apron').onclick=()=>view('apron');$('.brand').onclick=e=>{e.preventDefault();view('overview');};
$('#follow-plane').onclick=()=>view('aircraft');
function openWelcome(){sim.paused=true;if('speechSynthesis'in window)speechSynthesis.cancel();$('#welcome').showModal();updateUI();}
$('#restart').onclick=openWelcome;$('#next-shift').onclick=()=>{$('#finish-dialog').close();openWelcome();};
document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{chosenScenario=b.dataset.scenario;document.querySelectorAll('[data-scenario]').forEach(o=>o.classList.toggle('active',o===b));});
$('#start').onclick=()=>{sim.reset(chosenScenario);sim.paused=false;finishedShown=false;logSignature='';stripSignature='';commandSignature='';airport?.reset();view('apron');updateUI();};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();if(!sim.finished){sim.paused=!sim.paused;updateUI();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!sim.paused){sim.paused=true;updateUI();}});
try{airport=createAirport($('#stage'),selectAircraft);$('#loading').remove();document.body.dataset.webgl='true';}
catch(error){console.error(error);$('#loading').remove();$('#render-error').hidden=false;document.body.dataset.webgl='false';}
document.body.dataset.ready='true';resizeRadar();updateUI();$('#welcome').showModal();
let last=performance.now();
function frame(now){const dt=Math.min((now-last)/1000,.12);last=now;elapsed+=dt;sim.update(dt*sim.speed);
  if(now-lastUI>140){updateUI();lastUI=now;}
  for(const event of sim.events.splice(0))playRadio(event);
  if(now-lastRender>30){airport?.update(sim,elapsed);drawRadar();lastRender=now;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Readable QA entry point; normal gameplay uses the same simulation and commands.
window.__ATC={sim,updateUI,selectAircraft,drawRadar,get airport(){return airport;},setView:view};
