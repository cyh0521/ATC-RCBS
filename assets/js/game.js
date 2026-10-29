(()=>{
'use strict';
// RCBS data transcribed from the user's archived eAIP, not from the former game.
// Coordinates: local EN metres, ARP origin. Ground x along true 063.39°, z south.
const NM = 1852;
const DEG = Math.PI / 180;
function dms(s) {
  const n = s.slice(0, -1), degCount = /[EW]$/.test(s) ? 3 : 2;
  return (+n.slice(0, degCount) + +n.slice(degCount, degCount + 2) / 60 + +n.slice(degCount + 2) / 3600) * (/[SW]$/.test(s) ? -1 : 1);
}
const arp = { lat: dms('242544N'), lon: dms('1182140E') };
function en(lat, lon) {
  return { x: (dms(lon) - arp.lon) * 111320 * Math.cos(arp.lat * DEG), y: (dms(lat) - arp.lat) * 111320 };
}
const RWY = { length: 3004, width: 45, displaced: 480, heading: 63.39, lda06: 2524, lda24: 3004 };
const ORIGIN = en('242518.70N', '1182044.40E');
const sn = Math.sin(RWY.heading * DEG), cs = Math.cos(RWY.heading * DEG);
function toAir(x, z) { return { x: ORIGIN.x + x * sn + z * cs, y: ORIGIN.y + x * cs - z * sn }; }
function toGround(p) { const dx = p.x - ORIGIN.x, dy = p.y - ORIGIN.y; return { x: dx * sn + dy * cs, z: dx * cs - dy * sn }; }
function bearing(a, b) { return (Math.atan2(b.x - a.x, b.y - a.y) / DEG + 360) % 360; }
function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
function polar(center, nm, heading) { return { x: center.x + nm * NM * Math.sin(heading * DEG), y: center.y + nm * NM * Math.cos(heading * DEG) }; }
const fix = (name, lat, lon) => ({ name, ...en(lat, lon) });
const FIXES = {
  ARP: { name: 'RCBS', x: 0, y: 0 },
  CUBON: fix('CUBON', '235702.40N', '1185726.39E'),
  BS001: fix('BS001', '241758.00N', '1184002.00E'),
  BS002: fix('BS002', '241738.68N', '1181634.45E'),
  INDIA: fix('INDIA', '240604.23N', '1185126.99E'),
  POSTY: fix('POSTY', '241048.70N', '1185251.30E'),
  SPICA: fix('SPICA', '241543.82N', '1182141.78E'),
  MELOG: fix('MELOG', '242401.60N', '1183039.89E'),
  SANDY: fix('SANDY', '241659.78N', '1183425.31E'),
  // AD 2.19: DME is co-located with GP, NOT the LOC antenna or ARP.
  ICKM: fix('ICKM', '242527.10N', '1182112.60E'),
  ICSY: fix('ICSY', '242554.50N', '1182210.50E'),
  BSN: fix('BSN', '242535.70N', '1182057.30E'),
};
FIXES.SKIRT = { name: 'SKIRT', ...polar(FIXES.ICKM, 9.7, 243.36) };
FIXES.FAP06 = { name: 'FAP06', ...polar(FIXES.ICKM, 4.6, 243.36) };
// ILS24 chart: final magnetic 248°, VAR 4°W -> true 244°.
FIXES.INDOK = { name: 'INDOK', ...polar(FIXES.ICSY, 7.9, 64) };
FIXES.FAP24 = { name: 'FAP24', ...polar(FIXES.ICSY, 4.2, 64) };
FIXES.AMTIK = { name: 'AMTIK', ...polar(FIXES.BSN, 9, 100) };
const CONNECTORS = Object.fromEntries([
  ['A', '242602.11N', '1182219.17E', '242607.23N', '1182216.38E'],
  ['B', '242556.13N', '1182206.12E', '242601.24N', '1182203.31E'],
  ['C', '242545.77N', '1182143.51E', '242550.89N', '1182140.72E'],
  ['D', '242539.08N', '1182128.89E', '242544.20N', '1182126.10E'],
].map(([id, lat, lon, nl, no]) => [id, { id, ...toGround(en(lat, lon)), north: toGround(en(nl, no)) }]));
const TWY_Z = -176;
const GATES = [
  ['1', '242608.87N', '1182210.37E'], ['2', '242608.14N', '1182209.05E'],
  ['3', '242607.49N', '1182207.55E'], ['4', '242606.85N', '1182206.25E'],
  ['5', '242605.99N', '1182204.97E'], ['6', '242605.46N', '1182203.52E'],
  ['7', '242602.42N', '1182158.43E'], ['8', '242601.85N', '1182156.89E'],
  ['9', '242601.01N', '1182155.35E'],
].map(([id, lat, lon]) => ({ id, ...toGround(en(lat, lon)) }));
const CHANNELS = { GND: { name: '金門地面', freq: '126.2' }, TWR: { name: '金門塔台', freq: '118.0' }, APP: { name: '高雄進近', freq: '124.6' } };
const PERF = {
  ATR: { label: 'ATR 72-600', short: 'ATR72', length: 27.2, span: 27.1, taxi: 7, roll: 1250, takeoff: 115, landing: 112, approach: 180, climb: 175, vs: 1350, color: '#397b67' },
  JET: { label: 'A321-200', short: 'A321', length: 44.5, span: 35.8, taxi: 7, roll: 1850, takeoff: 145, landing: 137, approach: 210, climb: 230, vs: 1800, color: '#6486a5' },
};
function sid(rwy) { return rwy === '06' ? 'CUBON 1A' : 'CUBON 1B'; }
function star(rwy) { return rwy === '06' ? 'CUBON 1C' : 'CUBON 2D'; }
const wp = (id, alt, speed) => ({ ...FIXES[id], alt, speed });
function starRoute(rwy) { return rwy === '06' ? [wp('CUBON', 7000, 210), wp('SPICA', 4000, 200)] : [wp('CUBON', 7000, 210), wp('POSTY', 5000, 210), wp('MELOG', 2000, 200)]; }
function sidRoute(rwy) { return rwy === '06' ? [wp('BS001', 7000, 210), wp('INDIA', 11000, 230), wp('CUBON', 13000, 230)] : [wp('BS002', 7000, 230), wp('CUBON', 13000, 230)]; }
function arc(center, radius, from, to, alt, prefix) {
  let start = bearing(center, from), end = bearing(center, to);
  // Both charted arcs here progress clockwise: SPICA south -> SKIRT southwest,
  // MELOG east -> INDOK northeast runs counter-clockwise.
  let delta = ((end - start + 540) % 360) - 180;
  const count = Math.max(4, Math.ceil(Math.abs(delta) / 5));
  return Array.from({ length: count }, (_, i) => ({ name: `${prefix} ${i + 1}`, ...polar(center, radius, start + delta * (i + 1) / count), alt, speed: 180 }));
}
function approachRoute(rwy, fromSandy = false) {
  if (rwy === '06') return [
    ...(fromSandy ? [wp('SPICA', 4000, 180)] : []),
    ...arc(FIXES.ICKM, 9.7, FIXES.SPICA, FIXES.SKIRT, 2300, 'ICKM 9.7D'),
    { ...wp('SKIRT', 2300, 180), stage: 'IF' }, { ...wp('FAP06', 1500, 150), stage: 'FAP' },
    { name: 'RWY06', ...toAir(480, 0), alt: 45, speed: 112, stage: 'THR' },
  ];
  return [
    ...(fromSandy ? [wp('AMTIK', 3000, 180), wp('MELOG', 2000, 180)] : []),
    ...arc(FIXES.BSN, 9, FIXES.MELOG, FIXES.INDOK, 2000, 'BSN 9.0D'),
    { ...wp('INDOK', 2000, 180), stage: 'IF' }, { ...wp('FAP24', 1400, 150), stage: 'FAP' },
    { name: 'RWY24', ...toAir(3004, 0), alt: 18, speed: 137, stage: 'THR' },
  ];
}
const SCENARIOS = {
  morning: { name: '晨光・第一班', subtitle: 'RWY 06 · 4 架航班 · 入門', rwy: '06', wind: '050° / 12 KT', flights: [
    { id: 'B78642', kind: 'DEP', type: 'ATR', gate: '2', city: '松山', at: 0, due: 480 },
    { id: 'AE1268', kind: 'ARR', type: 'ATR', gate: '5', city: '臺中', at: 45, near: true, due: 900 },
    { id: 'AE1270', kind: 'DEP', type: 'ATR', gate: '8', city: '臺中', at: 350, due: 1080 },
    { id: 'B78651', kind: 'ARR', type: 'ATR', gate: '3', city: '松山', at: 500, due: 1800 },
  ] },
  west: { name: '海風・西向運作', subtitle: 'RWY 24 · 4 架航班 · 進階', rwy: '24', wind: '240° / 14 KT', flights: [
    { id: 'B78642', kind: 'DEP', type: 'ATR', gate: '2', city: '松山', at: 0, due: 360 },
    { id: 'AE1268', kind: 'ARR', type: 'ATR', gate: '5', city: '臺中', at: 70, near: true, due: 900 },
    { id: 'B78646', kind: 'DEP', type: 'JET', gate: '8', city: '松山', at: 380, due: 1080 },
    { id: 'B78651', kind: 'ARR', type: 'JET', gate: '3', city: '松山', at: 550, due: 1800 },
  ] },
};
const SOURCES = [
  { title: '機場圖・跑道與滑行道配置', file: '010-Aerodrome Chart.pdf', detail: 'RWY 06/24、A/B/C/D/N、航廈／機坪、TWR 118.0／GND 126.2。' },
  { title: '滑行道中心線座標', file: '020-Appropriate TWY Center Line Points.pdf', detail: '各連接道與跑道／N 的交點，以 WGS84 換算成本機公尺座標。' },
  { title: 'CUBON 離場與座標', file: '040-CUBON 1A1B RNAV DEP.pdf', detail: '1A：600 ft → BS001 → INDIA → CUBON；1B：600 ft → BS002 → CUBON。1A 至 2,000 ft 最低梯度 6.8%；1B 至 BS002 限 250 kt。另依 050 航點表。' },
  { title: 'CUBON 進場與座標', file: '100-CUBON 1C2D RNAV ARR.pdf', detail: '1C 經 SPICA（≥4,000 ft）；2D 經 POSTY（≥5,000 ft）、MELOG（≥2,000 ft）。另依 110 航點表。' },
  { title: 'ILS RWY06', file: '120-ILS RWY06.pdf', detail: 'ICKM 9.7D 弧、SKIRT 2,300 ft、FAP 4.6D／1,500 ft；磁航向 067°；重飛通過 500 ft 後右轉 SANDY，爬升 3,000 ft。' },
  { title: 'ILS RWY24', file: '130-ILS RWY24.pdf', detail: 'BSN 9D 弧、INDOK／ICSY 7.9D 2,000 ft、FAP 4.2D／1,400 ft；本張 ILS 圖為磁航向 248°；重飛至 ICSY 2D 左轉 SANDY，爬升 3,000 ft。' },
  { title: 'eAIP RCBS AD 2', file: 'RC-AD 2 RCBS 金門KINMEN.mhtml', detail: '2.8 機位 1–9 座標；2.13：06 可用 2,524 m、位移 480 m，24 可用 3,004 m；2.19 DME 站座標；2.20：06 全長起飛於跑道頭迴轉區 180° 掉頭。' },
];


const STATUS = {
  SCHEDULED: '準備中', PARKED: '請求出發許可', READY_PUSH: '請求後推', PUSH: '後推中', READY_TAXI: '請求滑行',
  TAXI: '滑行中', HOLD: '跑道外等待', LINEUP: '進跑道／回滑', LINED: '跑道頭等待', TAKEOFF: '起飛滑跑',
  DEPARTURE: '離場爬升', ENROUTE: '進場中', HOLD_ROUTE: '前往 SANDY 等待', HOLDING: 'SANDY 等待',
  APPROACH: 'ILS 進場', FINAL: '最後進場', MISSED: '重飛中', ROLLOUT: '落地滑跑', EXIT: '脫離跑道',
  VACATED: '請求滑回機位', TAXI_IN: '滑回機位', PARKED_IN: '已到位', DONE: '已移交區管',
};
const groundStates = new Set(['SCHEDULED','PARKED','READY_PUSH','PUSH','READY_TAXI','TAXI','HOLD','LINEUP','LINED','TAKEOFF','ROLLOUT','EXIT','VACATED','TAXI_IN','PARKED_IN']);
const isGround = a => groundStates.has(a.state);
const isAir = a => !isGround(a) && a.state !== 'DONE' && a.active;
const movingGround = new Set(['PUSH','TAXI','LINEUP','EXIT','TAXI_IN']);
const wrap = a => (a + 360) % 360;
const delta = (a,b) => ((b-a+540)%360)-180;
const point = (x,z) => ({x,z});
function rounded(points) {
  const result=[points[0]];
  for(let i=1;i<points.length-1;i++) {
    const a=points[i-1],b=points[i],c=points[i+1],l1=Math.hypot(b.x-a.x,b.z-a.z),l2=Math.hypot(c.x-b.x,c.z-b.z),r=Math.min(13,l1/3,l2/3);
    if(l1<.1||l2<.1){result.push(b);continue;}
    const p=point(b.x-(b.x-a.x)/l1*r,b.z-(b.z-a.z)/l1*r),q=point(b.x+(c.x-b.x)/l2*r,b.z+(c.z-b.z)/l2*r);
    result.push(p);
    for(let k=1;k<=6;k++){const t=k/6;result.push(point((1-t)**2*p.x+2*(1-t)*t*b.x+t*t*q.x,(1-t)**2*p.z+2*(1-t)*t*b.z+t*t*q.z));}
  }
  result.push(points.at(-1));return result;
}
class Simulation {
  constructor(scenario='morning') { this.reset(scenario); }
  reset(id) {
    this.scenarioId=id;this.scenario=SCENARIOS[id]||SCENARIOS.morning;this.rwy=this.scenario.rwy;
    this.time=0;this.paused=true;this.speed=4;this.score=0;this.penalties=0;this.finished=false;this.events=[];this.log=[];
    this.runwayOwner=null;this.radio={GND:[],TWR:[],APP:[]};this.message='點選航班，開始第一班管制。';
    this.aircraft=this.scenario.flights.map((f,i)=>{
      const gate=GATES.find(g=>g.id===f.gate),route=starRoute(this.rwy),start=f.near?route.at(-1):route[0];
      const a={...f,gateData:gate,active:f.kind==='DEP',state:'SCHEDULED',x:gate.x,z:gate.z,hdg:270,
        ax:start.x,ay:start.y,alt:start.alt,airspeed:PERF[f.type].approach,airHeading:0,airRoute:[],airIndex:0,
        groundRoute:[],groundIndex:0,groundSpeed:0,pending:false,manualHold:false,trafficHold:false,
        channel:f.kind==='DEP'?'GND':'APP',completed:false,request:false,requestSince:0,trail:[],lastTrail:0,
        ils:false,tower:false,landing:false,handed:false,squawk:String(4201+i),connector:this.rwy==='06'?'D':'A',
        airline:f.id.startsWith('B7')?'立榮航空':'華信航空',color:f.id.startsWith('B7')?'#397b67':'#6486a5',
      };
      if(f.kind==='ARR')a.active=false;return a;
    });
    this.selected=this.aircraft[0].id;
    this.record('ATIS','ATIS',`金門機場資訊 A。使用跑道 ${this.rwy}，地面風 ${this.scenario.wind}，能見度 10 公里，QNH 1013。`, 'info');
    this.activate();
  }
  get selectedAircraft(){return this.aircraft.find(a=>a.id===this.selected);}
  get completed(){return this.aircraft.filter(a=>a.completed).length;}
  record(channel,who,text,type='pilot') {
    const e={id:this.events.length+this.log.length+this.time,time:this.time,channel,who,text,type};
    this.log.push(e);if(this.log.length>160)this.log.shift();this.events.push(e);if(this.events.length>100)this.events.shift();
  }
  request(a,state,text,channel=a.channel) {
    a.state=state;a.channel=channel;a.request=true;a.requestSince=this.time;this.record(channel,a.id,text);
  }
  activate(){
    for(const a of this.aircraft){
      if(a.state!=='SCHEDULED'||this.time<a.at)continue;
      a.active=true;
      if(a.kind==='DEP')this.request(a,'PARKED',`金門地面，${a.id}，機位 ${a.gate}，前往${a.city}，請求出發許可。`);
      else {
        const full=starRoute(this.rwy);a.airRoute=a.near?[]:full.slice(1);a.airIndex=0;
        if(a.near){ // start just before the last STAR fix, still on the published leg
          const last=full.at(-1),previous=full.at(-2),hd=bearing(previous,last),p=polar(last,3,hd+180);
          a.ax=p.x;a.ay=p.y;a.alt=this.rwy==='06'?4500:2600;a.airRoute=[last];
        }
        a.airHeading=bearing({x:a.ax,y:a.ay},a.airRoute[0]);
        this.request(a,'ENROUTE',`高雄進近，${a.id}，${star(this.rwy)} 進場，通過 ${Math.round(a.alt/100)*100} 呎，請求進場許可。`,'APP');
      }
    }
  }
  radioCall(a,channel,atc,readback,finish){
    a.pending=true;a.request=false;
    this.radio[channel].push({a,atc,readback,finish,phase:0,left:0});
  }
  updateRadio(dt){
    for(const [channel,queue] of Object.entries(this.radio)){
      const c=queue[0];if(!c)continue;
      c.left-=dt;if(c.left>0)continue;
      if(c.phase===0){this.record(channel,CHANNELS[channel].name,`${c.a.id}，${c.atc}`,'atc');c.phase=1;c.left=3;}
      else if(c.phase===1){this.record(channel,c.a.id,`${c.readback}，${c.a.id}。`);c.phase=2;c.left=3;}
      else{queue.shift();c.a.pending=false;c.finish();}
    }
  }
  runwayBlock(a,arrival=false){
    if(this.runwayOwner&&this.runwayOwner!==a.id)return `跑道由 ${this.runwayOwner} 使用，請等待脫離。`;
    const reserved=this.aircraft.find(b=>b.id!==a.id&&b.landing&&['APPROACH','FINAL'].includes(b.state));
    if(reserved)return `${reserved.id} 已取得降落許可，請等待。`;
    if(!arrival){
      const final=this.aircraft.find(b=>b.id!==a.id&&['APPROACH','FINAL'].includes(b.state)&&this.distanceToThreshold(b)<(this.rwy==='06'?9:5)*NM);
      if(final)return `${final.id} 已進入進場保護範圍，請先完成降落或安排重飛。`;
    }
    return '';
  }
  distanceToThreshold(a){return distance({x:a.ax,y:a.ay},toAir(this.rwy==='06'?480:3004,0));}
  trafficBlock(a,toX){
    const sign=Math.sign(toX-a.x);
    const other=this.aircraft.find(b=>b.id!==a.id&&b.active&&['TAXI','TAXI_IN'].includes(b.state)&&
      Math.abs(b.z-TWY_Z)<45&&b.groundRoute.length&&Math.sign(b.groundRoute.at(-1).x-b.x)===-sign&&
      b.x>=Math.min(a.x,toX)-50&&b.x<=Math.max(a.x,toX)+50);
    return other?`TWY N 有迎面航班 ${other.id}，請等候通過。`:'';
  }
  commands(a=this.selectedAircraft){
    if(!a||!a.active||a.completed)return [];
    if(a.pending)return [{id:'pending',label:'通話／回讀中',disabled:true,reason:'收到回讀後才執行指令。'}];
    const cmd=(id,label,reason='')=>({id,label,disabled:!!reason,reason});
    const runway=this.runwayBlock(a),traffic=this.trafficBlock(a,CONNECTORS[a.connector].x);
    switch(a.state){
      case 'PARKED':return [cmd('clearance','出發許可')];
      case 'READY_PUSH':return [cmd('push','後推許可',this.pushBlock(a))];
      case 'READY_TAXI':return [cmd('taxi',`沿 N → ${a.connector} 等待`,traffic)];
      case 'TAXI':case 'TAXI_IN':case 'PUSH':return [cmd('stop',a.manualHold?'繼續移動':'原地等待')];
      case 'HOLD':return [cmd('lineup','進跑道等待',runway)];
      case 'LINED':return [cmd('takeoff','許可起飛',runway)];
      case 'DEPARTURE':return a.handed?[]:[cmd('departure','移交高雄進近',a.alt<600?'先維持跑道航向，通過 600 ft。':'')];
      case 'ENROUTE':return a.ils?[cmd('hold','改往 SANDY 等待')]:[cmd('ils',`ILS ${this.rwy} 進場許可`),cmd('hold','SANDY 等待')];
      case 'HOLD_ROUTE':return [];
      case 'HOLDING':return [cmd('ils',`離開等待・ILS ${this.rwy}`)];
      case 'APPROACH':case 'FINAL':{
        const out=[];
        if(!a.tower)out.push(cmd('tower','移交金門塔台',this.distanceToThreshold(a)>11*NM?'等待完成 DME 弧線並接近 IF。':''));
        else if(!a.landing)out.push(cmd('land','降落許可',this.runwayBlock(a,true)));
        out.push(cmd('goaround','重飛'));return out;
      }
      case 'VACATED':return [cmd('taxiin',`滑回機位 ${a.gate}`,this.gateBlock(a)||this.trafficBlock(a,a.gateData.x))];
      default:return [];
    }
  }
  pushBlock(a){const b=this.aircraft.find(b=>b.id!==a.id&&b.active&&isGround(b)&&Math.hypot(a.x-b.x,TWY_Z-b.z)<65);return b?`${b.id} 正在後推區附近，請稍候。`:'';}
  gateBlock(a){const b=this.aircraft.find(b=>b.id!==a.id&&b.active&&isGround(b)&&Math.hypot(a.gateData.x-b.x,a.gateData.z-b.z)<35);return b?`機位 ${a.gate} 尚由 ${b.id} 占用。`:'';}
  execute(id,aircraftId=this.selected){
    const a=this.aircraft.find(a=>a.id===aircraftId),item=this.commands(a).find(c=>c.id===id);
    if(!item||item.disabled)return {ok:false,reason:item?.reason||'目前狀態無法下達此指令。'};
    const rwy=this.rwy, channel=a.channel;
    switch(id){
      case 'clearance':this.radioCall(a,'GND',`許可至${a.city}，${sid(rwy)} 離場，初始爬升 5,000 呎，應答機 ${a.squawk}。`,`前往${a.city}，${sid(rwy)}，初始 5,000 呎，應答機 ${a.squawk}`,()=>this.request(a,'READY_PUSH','準備完成，請求後推。'));break;
      case 'push':this.radioCall(a,'GND',`機位 ${a.gate} 後推許可，退至 N，機頭朝${rwy==='06'?'西':'東'}。`,`後推至 N，機頭朝${rwy==='06'?'西':'東'}`,()=>{
        const block=this.pushBlock(a);if(block){this.message=block;a.request=true;return;}
        a.state='PUSH';this.setGround(a,[point(a.x,a.z),point(a.x,TWY_Z)],2.5);
      });break;
      case 'taxi':this.radioCall(a,'GND',`沿 N 滑行至 ${a.connector}，跑道 ${rwy} 外等待。`,`沿 N 至 ${a.connector}，跑道 ${rwy} 外等待`,()=>{
        if(this.trafficBlock(a,CONNECTORS[a.connector].x)){a.request=true;return;}
        a.state='TAXI';this.setGround(a,[point(a.x,a.z),point(CONNECTORS[a.connector].x,TWY_Z),point(CONNECTORS[a.connector].x,-78)],PERF[a.type].taxi);
      });break;
      case 'stop':this.radioCall(a,channel,a.manualHold?'繼續先前核准的滑行路線。':'原地等待。',a.manualHold?'繼續滑行':'原地等待',()=>{a.manualHold=!a.manualHold;});break;
      case 'lineup':this.radioCall(a,'TWR',`跑道 ${rwy}，${rwy==='06'?'經 D 進入，回滑至跑道頭，於迴轉區掉頭，':'經 A 進入，'}進跑道等待。`,`跑道 ${rwy}，${rwy==='06'?'回滑後進跑道等待':'進跑道等待'}`,()=>{
        const blocked=this.runwayBlock(a);if(blocked){this.message=blocked;a.request=true;this.record('TWR','金門塔台','跑道狀態改變，取消進跑道，維持等待。','atc');return;}
        this.runwayOwner=a.id;a.state='LINEUP';a.channel='TWR';
        const x=CONNECTORS[a.connector].x;
        const pts=rwy==='06'?[point(a.x,a.z),point(x,0),point(510,0),point(490,-10),point(475,-13),point(462,-8),point(459,3),point(468,12),point(486,12),point(510,0)]:[point(a.x,a.z),point(x,0),point(2945,0)];
        this.setGround(a,pts,6);
      });break;
      case 'takeoff':this.radioCall(a,'TWR',`風 ${this.scenario.wind}，跑道 ${rwy}，可以起飛。`,`跑道 ${rwy}，可以起飛`,()=>{
        if(this.runwayOwner!==a.id)return;a.state='TAKEOFF';a.roll=0;a.groundSpeed=0;a.rollStart=a.x;a.request=false;
      });break;
      case 'departure':this.radioCall(a,'TWR','聯繫高雄進近 124.6，再見。','聯繫高雄進近 124.6，再見',()=>{
        a.handed=true;a.channel='APP';a.completed=true;this.score+=100;
        this.record('APP',a.id,`高雄進近，${a.id}，${sid(rwy)} 離場，通過 ${Math.round(a.alt/100)*100} 呎。`);
        this.record('APP','高雄進近',`${a.id}，雷達識別，繼續 ${sid(rwy)}，爬升 13,000 呎。`,'atc');
      });break;
      case 'ils':this.radioCall(a,'APP',`許可 ILS 跑道 ${rwy} 進場，依程序高度，報告建立航道。`,`ILS 跑道 ${rwy} 進場，依程序高度`,()=>{
        a.ils=true;a.request=false;
        if(a.state==='HOLDING'){a.assignedHoldAlt=null;a.state='APPROACH';a.airRoute=[{...FIXES.SANDY,alt:a.alt,speed:180},...approachRoute(rwy,true)];a.airIndex=0;}
        else if(a.state==='ENROUTE'&&a.airIndex>=a.airRoute.length)this.startApproach(a);
      });break;
      case 'hold':{
        const level=this.holdingLevel(a,4000);a.assignedHoldAlt=level;
        this.radioCall(a,'APP',`前往 SANDY，爬升或維持 ${level} 呎，等待。`,`前往 SANDY，${level} 呎等待`,()=>{
          a.ils=false;a.landing=false;a.state='HOLD_ROUTE';a.airRoute=[{...FIXES.SANDY,alt:level,speed:180}];a.airIndex=0;
        });break;
      }
      case 'tower':this.radioCall(a,'APP','聯繫金門塔台 118.0，再見。','金門塔台 118.0，再見',()=>{
        if(!['APPROACH','FINAL'].includes(a.state))return;
        a.tower=true;a.channel='TWR';a.request=true;this.record('TWR',a.id,`金門塔台，${a.id}，ILS 跑道 ${rwy} 進場，請求降落。`);
      });break;
      case 'land':this.radioCall(a,'TWR',`風 ${this.scenario.wind}，跑道 ${rwy}，可以降落。`,`跑道 ${rwy}，可以降落`,()=>{
        if(!['APPROACH','FINAL'].includes(a.state))return;
        const blocked=this.runwayBlock(a,true);if(blocked){this.message=blocked;a.request=true;return;}
        a.landing=true;a.request=false;
      });break;
      case 'goaround':this.radioCall(a,a.channel,`重飛，依公布程序至 SANDY，爬升 3,000 呎。`,'重飛至 SANDY，爬升 3,000 呎',()=>this.goAround(a,false));break;
      case 'taxiin':this.radioCall(a,'GND',`沿 N 滑行至機位 ${a.gate}。`,`沿 N 至機位 ${a.gate}`,()=>{
        if(this.gateBlock(a)){a.request=true;return;}
        a.state='TAXI_IN';this.setGround(a,[point(a.x,a.z),point(a.x,TWY_Z),point(a.gateData.x,TWY_Z),point(a.gateData.x,a.gateData.z)],6);
      });break;
    }
    return {ok:true};
  }
  setGround(a,pts,speed){a.groundRoute=rounded(pts);a.groundIndex=1;a.groundSpeed=speed;a.manualHold=false;a.trafficHold=false;}
  startApproach(a){a.state='APPROACH';a.airRoute=approachRoute(this.rwy);a.airIndex=0;a.request=false;}
  groundFinished(a){
    a.groundSpeed=0;
    if(a.state==='PUSH'){a.hdg=this.rwy==='06'?180:0;this.request(a,'READY_TAXI','後推完成，請求滑行。');}
    else if(a.state==='TAXI')this.request(a,'HOLD',`在 ${a.connector}，跑道 ${this.rwy} 外等待，準備起飛。`,'TWR');
    else if(a.state==='LINEUP'){a.hdg=this.rwy==='06'?0:180;this.request(a,'LINED',`跑道 ${this.rwy}，準備起飛。`,'TWR');}
    else if(a.state==='EXIT'){
      if(this.runwayOwner===a.id)this.runwayOwner=null;
      this.record('TWR',a.id,'已脫離跑道。');this.record('TWR','金門塔台',`${a.id}，聯繫金門地面 126.2。`,'atc');
      this.request(a,'VACATED',`地面，已由 ${a.exit} 脫離，請求滑回機位 ${a.gate}。`,'GND');
    } else if(a.state==='TAXI_IN'){
      a.hdg=270;a.state='PARKED_IN';a.completed=true;a.request=false;this.score+=100;
      this.record('GND',a.id,`機位 ${a.gate} 到位，停車，謝謝。`);this.message=`${a.id} 已安全到位。`;
    }
  }
  updateGround(a,dt){
    if(a.manualHold)return;
    const p=a.groundRoute[a.groundIndex];if(!p){this.groundFinished(a);return;}
    const dx=p.x-a.x,dz=p.z-a.z,dist=Math.hypot(dx,dz),step=Math.min(dist,a.groundSpeed*dt);
    if(dist<.01){a.groundIndex++;return;}
    const nx=a.x+dx/dist*step,nz=a.z+dz/dist*step;
    a.trafficHold=this.aircraft.some(b=>b.id!==a.id&&b.active&&isGround(b)&&!['SCHEDULED','PARKED','READY_PUSH','PARKED_IN'].includes(b.state)&&Math.hypot(nx-b.x,nz-b.z)<48&&Math.hypot(nx-b.x,nz-b.z)<Math.hypot(a.x-b.x,a.z-b.z));
    if(a.trafficHold)return;
    a.x=nx;a.z=nz;
    if(a.state!=='PUSH')a.hdg=wrap(a.hdg+Math.max(-70*dt,Math.min(70*dt,delta(a.hdg,Math.atan2(dz,dx)/DEG))));
    if(step>=dist-.001){a.groundIndex++;if(a.groundIndex>=a.groundRoute.length)this.groundFinished(a);}
  }
  goAround(a,automatic){
    if(!['APPROACH','FINAL'].includes(a.state))return;
    a.state='MISSED';a.ils=false;a.landing=false;a.tower=false;a.channel='APP';a.request=false;
    a.airRoute=[];a.airIndex=0;a.missedTurn=false;a.assignedHoldAlt=null;
    // First fly to THR along approach course, then charted initial missed leg.
    a.missedThreshold=toAir(this.rwy==='06'?480:3004,0);a.passedThreshold=false;
    this.penalties+=automatic?1:0;this.score=Math.max(0,this.score-(automatic?15:0));
    this.record('TWR',a.id,automatic?'未取得安全降落條件，執行重飛，爬升 3,000 呎。':'執行公布重飛程序，爬升 3,000 呎。');
    this.message=`${a.id} 重飛至 SANDY。`;
  }
  enterHolding(a){
    const desired=a.assignedHoldAlt||this.holdingLevel(a,a.alt<3500?3000:4000);
    a.state='HOLDING';a.holdTime=0;a.holdAlt=desired;a.assignedHoldAlt=desired;a.request=true;a.channel='APP';
    this.record('APP',a.id,`SANDY，${a.holdAlt} 呎等待，請求後續進場。`);
  }
  holdingLevel(a,base){
    const used=this.aircraft.filter(b=>b.id!==a.id&&b.active&&(['HOLDING','HOLD_ROUTE','MISSED'].includes(b.state)||b.pending&&b.assignedHoldAlt)).map(b=>b.assignedHoldAlt||b.holdAlt||3000);
    let level=base;while(used.includes(level))level+=1000;return level;
  }
  updateHolding(a,dt){
    // Published inbound 309°M; rounded game racetrack stays southeast of SANDY.
    a.holdTime+=dt;const theta=a.holdTime/140*Math.PI*2,dir=this.rwy==='06'?1:-1;
    const outward=125*DEG,right=215*DEG,along=(1-Math.cos(theta))*1.2*NM,side=Math.sin(theta)*.5*NM*dir;
    const x=FIXES.SANDY.x+Math.sin(outward)*along+Math.sin(right)*side,y=FIXES.SANDY.y+Math.cos(outward)*along+Math.cos(right)*side;
    a.airHeading=bearing({x:a.ax,y:a.ay},{x,y});a.ax=x;a.ay=y;a.alt+=Math.sign(a.holdAlt-a.alt)*Math.min(Math.abs(a.holdAlt-a.alt),20*dt);a.airspeed=180;
  }
  updateAir(a,dt){
    const perf=PERF[a.type];
    if(a.state==='HOLDING'){this.updateHolding(a,dt);return;}
    if(a.state==='MISSED'&&!a.missedTurn){
      if(!a.passedThreshold){
        const d=distance({x:a.ax,y:a.ay},a.missedThreshold),move=a.airspeed*NM/3600*dt;
        a.airHeading=bearing({x:a.ax,y:a.ay},a.missedThreshold);
        if(d<=move+40){a.ax=a.missedThreshold.x;a.ay=a.missedThreshold.y;a.passedThreshold=true;}
        else{a.ax+=Math.sin(a.airHeading*DEG)*move;a.ay+=Math.cos(a.airHeading*DEG)*move;}
      }else{
        a.airHeading=this.rwy==='06'?63.36:244;
        a.ax+=Math.sin(a.airHeading*DEG)*a.airspeed*NM/3600*dt;a.ay+=Math.cos(a.airHeading*DEG)*a.airspeed*NM/3600*dt;
      }
      a.alt=Math.min(3000,a.alt+perf.vs/60*dt);
      const turn=this.rwy==='06'?a.passedThreshold&&a.alt>=500:a.passedThreshold&&distance({x:a.ax,y:a.ay},FIXES.ICSY)>=2*NM;
      if(turn){a.missedTurn=true;a.airRoute=[{...FIXES.SANDY,alt:3000,speed:180}];a.airIndex=0;}
      return;
    }
    if(a.state==='DEPARTURE'&&!a.sidStarted){
      a.airHeading=this.rwy==='06'?63.36:243.39;
      a.ax+=Math.sin(a.airHeading*DEG)*a.airspeed*NM/3600*dt;a.ay+=Math.cos(a.airHeading*DEG)*a.airspeed*NM/3600*dt;
      a.alt+=Math.max(perf.vs/60,a.airspeed*NM/3600*.068/0.3048)*dt;
      if(a.alt>=600){a.sidStarted=true;a.airRoute=sidRoute(this.rwy);a.airIndex=0;a.request=true;this.record('TWR',a.id,'通過 600 呎，依離場程序轉彎。');}
      return;
    }
    const target=a.airRoute[a.airIndex];
    if(!target){
      if(a.state==='ENROUTE'){
        if(a.ils)this.startApproach(a);else if(!a.pending){a.assignedHoldAlt=this.holdingLevel(a,4000);a.state='HOLD_ROUTE';a.airRoute=[{...FIXES.SANDY,alt:a.assignedHoldAlt,speed:180}];a.airIndex=0;this.penalties++;this.record('APP',a.id,`尚未取得進場許可，依遊戲等待安排前往 SANDY，${a.assignedHoldAlt} 呎。`);}
      }else if(['HOLD_ROUTE','MISSED'].includes(a.state))this.enterHolding(a);
      else if(a.state==='DEPARTURE'){
        if(a.handed){a.state='DONE';a.active=false;this.record('APP','高雄進近',`${a.id}，通過 CUBON，聯繫臺北管制，再見。`,'atc');}
      }
      return;
    }
    const here={x:a.ax,y:a.ay},dist=distance(here,target),targetSpeed=Math.min(target.speed||perf.approach,(a.state==='FINAL'?perf.landing:perf.approach));
    const dep=a.state==='DEPARTURE';
    const spd=dep?Math.min(a.handed?230:perf.climb,target.speed||230):targetSpeed;
    a.airspeed+=Math.max(-3*dt,Math.min(3*dt,spd-a.airspeed));
    const move=a.airspeed*NM/3600*dt;
    a.airHeading=bearing(here,target);
    let desiredAlt=target.alt??a.alt;
    if(dep)desiredAlt=Math.min(desiredAlt,a.handed?13000:5000);
    // Descend to each published fix constraint, with exact constraint at crossing.
    const rate=Math.max(dep?perf.vs/60:12,Math.abs(desiredAlt-a.alt)/Math.max(dist/(a.airspeed*NM/3600),1));
    a.alt+=Math.sign(desiredAlt-a.alt)*Math.min(Math.abs(desiredAlt-a.alt),rate*dt);
    if(move>=dist){a.ax=target.x;a.ay=target.y;a.airIndex++;
      if(target.stage==='IF'){a.request=!a.tower;this.record('APP',a.id,`${target.name}，建立航道。`);}
      if(target.stage==='FAP'){a.state='FINAL';a.request=!a.landing;this.message=`${a.id} 已在最後進場，確認降落許可。`;}
      if(target.stage==='THR')this.touchdown(a);
    }else{a.ax+=(target.x-a.ax)/dist*move;a.ay+=(target.y-a.ay)/dist*move;}
    if(a.state==='FINAL'&&this.distanceToThreshold(a)<.7*NM&&(!a.landing||this.runwayOwner&&this.runwayOwner!==a.id))this.goAround(a,true);
  }
  touchdown(a){
    if(!a.landing||this.runwayOwner&&this.runwayOwner!==a.id){this.goAround(a,true);return;}
    a.state='ROLLOUT';a.channel='TWR';a.request=false;this.runwayOwner=a.id;a.alt=0;
    a.x=this.rwy==='06'?480:3004;a.z=0;a.hdg=this.rwy==='06'?0:180;a.groundSpeed=PERF[a.type].landing*NM/3600;
    a.exit=this.rwy==='06'?'B':'C';a.exitX=CONNECTORS[a.exit].x;
    this.record('TWR','金門塔台',`${a.id}，由 ${a.exit} 脫離跑道，脫離後聯繫地面。`,'atc');
  }
  updateRoll(a,dt){
    const direction=this.rwy==='06'?1:-1,perf=PERF[a.type];
    if(a.state==='TAKEOFF'){
      a.groundSpeed=Math.min(perf.takeoff*NM/3600,a.groundSpeed+1.5*dt);a.x+=direction*a.groundSpeed*dt;a.roll=Math.abs(a.x-a.rollStart);
      if(a.roll>=perf.roll){
        const p=toAir(a.x,0);a.ax=p.x;a.ay=p.y;a.alt=80;a.airspeed=perf.climb;a.state='DEPARTURE';a.sidStarted=false;
        this.runwayOwner=null;this.record('TWR',a.id,'已離地。');
      }
    }else{
      const remaining=Math.abs(a.exitX-a.x);
      // Reach the selected exit at taxi speed, without teleporting or overrunning it.
      const decel=Math.max(.8,(a.groundSpeed*a.groundSpeed-36)/Math.max(2*remaining,1));
      a.groundSpeed=Math.max(6,a.groundSpeed-decel*dt);const step=Math.min(remaining,a.groundSpeed*dt);a.x+=direction*step;
      if(remaining<step+.1){a.state='EXIT';a.x=a.exitX;this.setGround(a,[point(a.x,0),point(a.x,-105)],5);}
    }
  }
  update(dt){
    if(this.paused||this.finished)return;
    // Fixed maximum step makes fast-forward and all radio callbacks deterministic.
    let remaining=dt;while(remaining>0){const step=Math.min(.2,remaining);this.step(step);remaining-=step;}
  }
  step(dt){
    this.time+=dt;this.activate();this.updateRadio(dt);
    for(const a of this.aircraft){
      if(!a.active)continue;
      if(movingGround.has(a.state))this.updateGround(a,dt);
      else if(['TAKEOFF','ROLLOUT'].includes(a.state))this.updateRoll(a,dt);
      else if(isAir(a))this.updateAir(a,dt);
      if(isAir(a)&&this.time-a.lastTrail>8){a.lastTrail=this.time;a.trail.push({x:a.ax,y:a.ay});if(a.trail.length>24)a.trail.shift();}
    }
    if(this.completed===this.aircraft.length){this.finished=true;this.paused=true;this.message='本班管制完成，所有航班皆已安全移交或到位。';}
  }
  advisory(a=this.selectedAircraft){
    if(!a)return '選取航班管制條，查看下一步。';
    if(a.completed)return a.kind==='DEP'?'已移交高雄進近，航機沿 SID 繼續離場。':'航班已安全到位。';
    if(a.pending)return '正在通話與回讀；回讀完成後才會執行。';
    if(a.trafficHold)return '前方有地面航班，自動保持間隔。可選取前機處理。';
    if(a.manualHold)return '已停止移動。下達「繼續移動」可恢復原路線。';
    const guides={PARKED:'先發出出發許可，確認 SID 與初始高度。',READY_PUSH:'後推至 N，之後再給滑行許可。',READY_TAXI:`沿 N 至 ${a.connector}，停在跑道外等待。`,HOLD:'確認跑道與進場航班，再允許進入跑道。',LINEUP:this.rwy==='06'?'正回滑至 06 跑道頭，在迴轉區 180° 掉頭。':'經 A 進入 24 跑道頭。',LINED:'航機已對正跑道，可發出起飛許可。',DEPARTURE:'通過 600 ft 後移交高雄進近。',ENROUTE:`核准 ILS ${this.rwy}；有需要可安排 SANDY 等待。`,APPROACH:'跟隨 DME 弧線。接近 IF 後移交塔台，再給降落許可。',FINAL:'確認已移交塔台並取得降落許可；需要時下達重飛。',VACATED:'已脫離跑道，給予沿 N 返回機位的滑行許可。',HOLDING:'跑道可用時，可再次核准 ILS 進場。',SCHEDULED:'航班尚在準備，請先處理其他航班。',PARKED_IN:'航班已安全到位。'};
    return guides[a.state]||'觀察移動與通話，等待下一個航機請求。';
  }
}



// Same 2:1 isometric projection as RookieDay: both horizontal axes slope 1:2.
// Static scenery is exclusively external painted artwork. Canvas paths are UI overlays.
function createAirport(stage,onSelect){
 const canvas=document.createElement('canvas');stage.append(canvas);canvas.setAttribute('aria-label','精緻手繪等角金門機場，可拖曳、縮放、點選飛機');const c=canvas.getContext('2d');
 const files={ground:'ground-painted.png',apron:'apron-material.png',markings:'ground-markings.svg',terminal:'terminal.png',infra:'infrastructure.png',scenery:'scenery.png',atr:'atr-directions.png',jet:'jet-directions.png'};
 const images={};let loaded=0;const status=document.createElement('div');status.className='art-loading';status.textContent='載入手繪機場素材…';stage.append(status);
 for(const [key,file]of Object.entries(files)){const im=new Image();im.onload=()=>{loaded++;document.body.dataset.assets=String(loaded);if(loaded===8)status.remove()};im.onerror=()=>{document.body.dataset.assetError=file;status.textContent='素材載入失敗：'+file+'，請保留 assets 資料夾。'};im.src='assets/images/isometric/'+file;images[key]=im;}
 const P=(x,z)=>({x:(x-z)*.89442719,y:(x+z)*.447213595});let width=1,height=1,zoom=1,mode='apron',center={x:2775,z:-190},pan={x:0,y:0},hits=[],drag=null,moved=false,lastSim=null;
 function camera(){const base=mode==='overview'?Math.min(width/3650,height/1950):Math.min(width/(width<700?540:1050),height/490);const s=base*zoom,p=P(center.x,center.z);return {s,ox:width*.5-p.x*s+pan.x,oy:height*.58-p.y*s+pan.y}}
 function point(x,z){const v=camera(),p=P(x,z);return{x:p.x*v.s+v.ox,y:p.y*v.s+v.oy}}
 function resize(){width=stage.clientWidth;height=stage.clientHeight;const d=Math.min(devicePixelRatio,2);canvas.width=width*d;canvas.height=height*d;canvas.style.width=width+'px';canvas.style.height=height+'px';c.setTransform(d,0,0,d,0,0)}new ResizeObserver(resize).observe(stage);resize();
 const ready=im=>im.complete&&im.naturalWidth;
 function sprite(key,x,z,w,h,region=null,anchor=.76){const im=images[key];if(!ready(im))return;const p=point(x,z),s=camera().s;if(p.x+w*s<0||p.x-w*s>width||p.y+h*s<0||p.y-h*s>height)return;let r=region||[0,0,1,1];c.drawImage(im,r[0]*im.naturalWidth,r[1]*im.naturalHeight,r[2]*im.naturalWidth,r[3]*im.naturalHeight,p.x-w*s/2,p.y-h*s*anchor,w*s,h*s)}
 const props=[];const add=(key,x,z,w,h,region,anchor)=>props.push({key,x,z,w,h,region,anchor});
 const regions={hangar:[0,0,.535,.645],fire:[.535,0,.465,.605],baggage:[0,.655,.535,.345],stairs:[.56,.555,.44,.445]};
 // Major footprints follow the archived chart; no objects sit on taxiway N.
 add('terminal',2780,-400,560,280,null,.69);
 add('infra',1835,-370,150,91,regions.hangar,.72);add('infra',2185,-370,115,70,regions.hangar,.72);add('infra',2490,-365,85,58,regions.fire,.74);add('infra',1370,-385,82,56,regions.fire,.74);
 // Scenery atlas: three columns, two rows, all external painted sprites.
 const scenery=i=>[(i%3)/3,Math.floor(i/3)/2,1/3,.5];
 for(let i=0;i<70;i++){const x=1060+((i*173)%2180),z=-590-((i*79)%260);add('scenery',x,z,58+(i%4)*8,56+(i%4)*8,scenery(0),.86)}
 for(let i=0;i<23;i++){const x=1420+i*69,z=-460-(i%3)*14;if(x>2510&&x<3080)continue;add('scenery',x,z,44,31,scenery(1),.8)}
 for(let i=0;i<34;i++){const x=850+i*68,z=345+Math.sin(i*2)*13;add('scenery',x,z,32+(i%4)*6,24+(i%4)*4,scenery(2),.8)}
 for(let x=900;x<3160;x+=58)add('scenery',x,248,61,48,scenery(4),.91);
 for(const x of [2530,2650,2780,2910,3000])add('scenery',x,-340,25,93,scenery(3),.93);
 for(const g of GATES){if(['1','3','5','8'].includes(g.id))add('infra',g.x+22,g.z-18,46,28,regions.baggage,.78);add('scenery',g.x-18,g.z-15,16,19,scenery(5),.86)}
 for(const [x,z]of [[2680,-320],[2900,-325],[2240,-280]])add('infra',x,z,37,34,regions.stairs,.81);
 // A second shrub border and small rocks make the apron perimeter readable at close zoom.
 for(let i=0;i<17;i++)add('scenery',2510+i*30,-456,26,20,scenery(1),.8);
 function label(text,p,selected){c.font='600 12px Consolas,monospace';const w=c.measureText(text).width+16;c.fillStyle=selected?'#286c60':'#faf3dd';c.strokeStyle=selected?'#91d0b7':'#72856a';c.lineWidth=1;c.beginPath();c.roundRect(p.x-w/2,p.y-25,w,23,4);c.fill();c.stroke();c.fillStyle=selected?'#fff7e5':'#294b40';c.fillText(text,p.x-w/2+8,p.y-9)}
 function ground(){const im=images.ground;if(!ready(im))return;const v=camera();c.save();c.transform(.89442719*v.s,.447213595*v.s,-.89442719*v.s,.447213595*v.s,v.ox,v.oy);c.drawImage(im,-500,-1000,4000,1850);if(ready(images.apron)){for(let x=2330;x<2520;x+=95)c.drawImage(images.apron,x,-338,95,150);}if(ready(images.markings))c.drawImage(images.markings,-500,-1000,4000,1850);
 // Keep surveyed runway endpoints and width independent of generated map proportions.
 // Paint from the same artwork atlas, rather than creating procedural asphalt or grass.
 const sw=im.naturalWidth,sh=im.naturalHeight;
 c.drawImage(im,sw*.22,sh*.15,sw*.2,sh*.08,-235,-43,3480,92);
 c.drawImage(im,sw*.079,sh*.523,sw*.842,sh*.041,0,-27,3004,54);
 c.restore();}
 function update(sim,time){lastSim=sim;if(mode==='aircraft'&&isGround(sim.selectedAircraft)){center={x:sim.selectedAircraft.x,z:sim.selectedAircraft.z};pan={x:0,y:0}}c.clearRect(0,0,width,height);c.fillStyle='#d9e2cd';c.fillRect(0,0,width,height);ground();
 const s=camera().s;const objects=props.map(p=>({...p,depth:p.z< -450?-10000+P(p.x,p.z).y:P(p.x,p.z).y}));for(const a of sim.aircraft)if(a.active&&isGround(a))objects.push({aircraft:a,x:a.x,z:a.z,depth:P(a.x,a.z).y});objects.sort((a,b)=>a.depth-b.depth);hits=[];
 const selected=sim.selectedAircraft;if(selected&&isGround(selected)&&selected.groundRoute.length){c.strokeStyle='#84d6bf';c.lineWidth=2;c.setLineDash([7,5]);c.beginPath();let p=point(selected.x,selected.z);c.moveTo(p.x,p.y);for(const q of selected.groundRoute.slice(selected.groundIndex)){p=point(q.x,q.z);c.lineTo(p.x,p.y)}c.stroke();c.setLineDash([])}
 const labels=[];for(const o of objects){if(!o.aircraft){sprite(o.key,o.x,o.z,o.w,o.h,o.region,o.anchor);continue}const a=o.aircraft,p=point(a.x,a.z),selected=a.id===sim.selected;let index=a.hdg>=225&&a.hdg<315?3:a.hdg>=45&&a.hdg<135?2:a.hdg>=135&&a.hdg<225?1:0;const w=(a.type==='JET'?91:72)*s,h=w*2/3;
 if(selected){c.strokeStyle='#55ac91';c.fillStyle='#8bd7b126';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,w*.53,w*.24,-.4,0,Math.PI*2);c.fill();c.stroke()}
 sprite(a.type==='JET'?'jet':'atr',a.x,a.z,w/s,h/s,[(index%2)/2,Math.floor(index/2)/2,.5,.5],.7);labels.push({id:a.id,p:{x:p.x,y:p.y-h*.69},selected});hits.push({id:a.id,x:p.x,y:p.y-h*.3,r:Math.max(20,w*.5)})}
 // Only information overlays (not scenery) use text or paths at runtime.
 c.save();for(const [id,g]of Object.entries(CONNECTORS)){const p=point(g.x,-86);c.font=`italic bold ${Math.max(11,16*s)}px Georgia`;c.lineWidth=3;c.strokeStyle='#6e775b';c.strokeText(id,p.x-5,p.y);c.fillStyle='#efdb91';c.fillText(id,p.x-5,p.y)}
 for(const g of GATES){const p=point(g.x,g.z+12);c.font=`600 ${Math.max(9,10*s)}px Consolas`;c.fillStyle='#6c7759';c.fillText(g.id,p.x,p.y)}
 for(const [x,t]of [[550,'06'],[2920,'24']]){const p=point(x,0);c.save();c.translate(p.x,p.y);c.rotate(Math.atan(.5)+(t==='24'?Math.PI:0));c.font=`bold ${Math.max(10,16*s)}px Arial`;c.fillStyle='#f4eed9';c.fillText(t,-9,5);c.restore()}
 c.restore();for(const l of labels)label(l.id,l.p,l.selected);document.body.dataset.sceneReady=String(loaded===8);
 }
 function setView(v){mode=v;zoom=1;pan={x:0,y:0};center=v==='overview'?{x:1530,z:-80}:{x:2775,z:-190};stage.dataset.view=v}
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};moved=false;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(moved){if(mode==='aircraft')mode='apron';pan={x:drag.px+dx,y:drag.py+dy}}});canvas.addEventListener('pointerup',e=>{if(!moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const h=hits.slice().reverse().find(h=>Math.hypot(x-h.x,y-h.y)<h.r);if(h)onSelect(h.id)}drag=null});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(3,zoom*(e.deltaY<0?1.1:1/1.1)))},{passive:false});
 return {update,setView,reset(){setView('apron')},resize,renderer:{domElement:canvas},get assetsLoaded(){return loaded},get staticSpriteCount(){return props.length},get projection(){return P}};
}




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
  const availableCommands=sim.commands();const common=a.kind==='DEP'?[['taxi','滑行許可'],['stop','原地等待'],['lineup','進跑道等待'],['takeoff','起飛許可']]:[['ils','進場許可'],['land','降落許可'],['goaround','重飛']];const commands=[...availableCommands,...common.filter(([id])=>!availableCommands.some(c=>c.id===id)).map(([id,label])=>({id,label,disabled:true,reason:'目前航班階段尚不適用此指令。'}))],cs=JSON.stringify(commands)+a.id;
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
function sourceHelp(){const base=location.pathname.replace(/\\/g,'/').includes('/remake/')?'../_Data/':'_Data/';return `<h3>依據你提供的官方文件</h3><p>本版採用專案封存版本。數據以原始 PDF 與 eAIP 為準，沒有採用舊版整理文件中的估算座標。</p>${SOURCES.map(s=>`<div class="source-card"><strong>${s.title}</strong><p>${s.detail}</p><a href="${base+encodeURIComponent(s.file)}" target="_blank" rel="noopener">開啟原始文件 ↗</a></div>`).join('')}<h3>本版實作範圍</h3><p>支援 06／24 跑道、CUBON 1A／1B 離場、CUBON 1C／2D 進場、ILS 06／24 與 SANDY 等待／重飛。RNP、LOC、其他 SID、軍機、低能見度及地面車輛管制尚未加入。</p><h3>為遊戲而簡化的部分</h3><p>班表、初始 5,000 ft 許可、機型性能、離地與滑跑距離、減速、管制移交觸發點、地面 48 m 間隔、等待線距離、跑道保護範圍與 0.7 NM 自動重飛觸發皆為遊戲設定。航圖未列出的 SKIRT／INDOK／FAP 位置依台站、距離與航向推算。等待圈、轉彎與下降採簡化運動，不是完整飛行動力學。06 與 24 的最後進場高度依圖中 FAP 約束內插；飛機離地後只顯示於雷達。</p><p>航廈與植栽是簡化造型，飛機圖示為便於辨識而放大，非等比例。機位與滑行道位置依座標換算，軍用機坪只作場景。06 落地由 B、24 落地由 C 脫離是本關卡安排，非所有飛機的固定官方規定。雷達海岸線為示意。</p><p class="note">這是一個依封存航圖設計的航管遊戲，供遊玩與理解流程；不是實際飛航或管制工具。</p>`;}
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
function openWelcome(){sim.paused=true;if('speechSynthesis'in window)speechSynthesis.cancel();sim.paused=true;updateUI();}
$('#restart').onclick=openWelcome;$('#next-shift').onclick=()=>{$('#finish-dialog').close();openWelcome();};
document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{chosenScenario=b.dataset.scenario;document.querySelectorAll('[data-scenario]').forEach(o=>o.classList.toggle('active',o===b));});
$('#start').onclick=()=>{sim.reset(chosenScenario);sim.paused=false;finishedShown=false;logSignature='';stripSignature='';commandSignature='';airport?.reset();view('apron');updateUI();};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();if(!sim.finished){sim.paused=!sim.paused;updateUI();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!sim.paused){sim.paused=true;updateUI();}});
try{airport=createAirport($('#stage'),selectAircraft);$('#loading').remove();document.body.dataset.renderer='handdrawn';}
catch(error){console.error(error);$('#loading').remove();$('#render-error').hidden=false;document.body.dataset.webgl='false';}
document.body.dataset.ready='true';resizeRadar();updateUI();sim.paused=true;
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

})();