import { NM, DEG, RWY, FIXES, CONNECTORS, TWY_Z, GATES, CHANNELS, PERF, SCENARIOS, sid, star, sidRoute, starRoute, approachRoute, toAir, bearing, distance, polar } from './data.mjs';

export const STATUS = {
  SCHEDULED: '準備中', PARKED: '請求出發許可', READY_PUSH: '請求後推', PUSH: '後推中', READY_TAXI: '請求滑行',
  TAXI: '滑行中', HOLD: '跑道外等待', LINEUP: '進跑道／回滑', LINED: '跑道頭等待', TAKEOFF: '起飛滑跑',
  DEPARTURE: '離場爬升', ENROUTE: '進場中', HOLD_ROUTE: '前往 SANDY 等待', HOLDING: 'SANDY 等待',
  APPROACH: 'ILS 進場', FINAL: '最後進場', MISSED: '重飛中', ROLLOUT: '落地滑跑', EXIT: '脫離跑道',
  VACATED: '請求滑回機位', TAXI_IN: '滑回機位', PARKED_IN: '已到位', DONE: '已移交區管',
};
const groundStates = new Set(['SCHEDULED','PARKED','READY_PUSH','PUSH','READY_TAXI','TAXI','HOLD','LINEUP','LINED','TAKEOFF','ROLLOUT','EXIT','VACATED','TAXI_IN','PARKED_IN']);
export const isGround = a => groundStates.has(a.state);
export const isAir = a => !isGround(a) && a.state !== 'DONE' && a.active;
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
export class Simulation {
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
