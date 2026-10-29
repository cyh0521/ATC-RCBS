import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../sim.mjs';
import { NM, RWY, FIXES, CONNECTORS, GATES, toAir, toGround, distance, approachRoute, sidRoute, starRoute } from '../data.mjs';

const desired={PARKED:'clearance',READY_PUSH:'push',READY_TAXI:'taxi',HOLD:'lineup',LINED:'takeoff',DEPARTURE:'departure',ENROUTE:'ils',HOLDING:'ils',VACATED:'taxiin'};
function pilot(sim){
  for(const a of sim.aircraft){
    let id=desired[a.state];if(['APPROACH','FINAL'].includes(a.state))id=a.tower?'land':'tower';
    if(a.completed||a.pending)continue;
    const command=sim.commands(a).find(c=>c.id===id&&!c.disabled);
    if(command)assert.equal(sim.execute(id,a.id).ok,true);
  }
}
test('official geometry and unit conversion stay independent of scene scale',()=>{
  assert.equal(RWY.length,3004);assert.equal(RWY.lda06,2524);assert.equal(RWY.displaced,480);
  assert.deepEqual(GATES.map(g=>g.id),['1','2','3','4','5','6','7','8','9']);
  assert.ok(CONNECTORS.D.x>1390&&CONNECTORS.D.x<1415);
  assert.ok(CONNECTORS.A.x>2970&&CONNECTORS.A.x<3010);
  for(const p of [{x:480,z:0},{x:2500,z:-176}]){const result=toGround(toAir(p.x,p.z));assert.ok(Math.abs(result.x-p.x)<.001&&Math.abs(result.z-p.z)<.001);}
  assert.ok(Math.abs(distance(FIXES.ICKM,FIXES.SKIRT)/NM-9.7)<.001);
  assert.ok(Math.abs(distance(FIXES.ICSY,FIXES.FAP24)/NM-4.2)<.001);
});
test('procedures retain fix sequence, heights, DME arcs, and SID speed restriction',()=>{
  assert.deepEqual(sidRoute('06').map(p=>p.name),['BS001','INDIA','CUBON']);
  assert.deepEqual(starRoute('24').map(p=>[p.name,p.alt]),[['CUBON',7000],['POSTY',5000],['MELOG',2000]]);
  assert.equal(starRoute('06').at(-1).alt,4000);
  assert.ok(sidRoute('24')[0].speed<=250);
  for(const p of approachRoute('06').filter(p=>p.name.startsWith('ICKM')))assert.ok(Math.abs(distance(p,FIXES.ICKM)/NM-9.7)<.001);
  assert.equal(approachRoute('06').find(p=>p.stage==='FAP').alt,1500);
  assert.equal(approachRoute('24').find(p=>p.stage==='FAP').alt,1400);
});
test('paused simulation and radio readback cannot move aircraft early',()=>{
  const sim=new Simulation(),a=sim.aircraft[0];assert.equal(sim.execute('clearance',a.id).ok,true);sim.update(20);assert.equal(a.state,'PARKED');assert.equal(sim.time,0);
  sim.paused=false;sim.update(2);assert.equal(a.state,'PARKED');assert.equal(a.pending,true);sim.update(5);assert.equal(a.state,'READY_PUSH');
  assert.equal(sim.execute('push',a.id).ok,true);const z=a.z;sim.update(3);assert.equal(a.z,z);sim.update(6);assert.ok(a.z>z);
});
test('runway interlock rejects a second movement and rechecks after readback',()=>{
  const sim=new Simulation(),a=sim.aircraft[0];a.state='HOLD';a.channel='TWR';sim.runwayOwner='OTHER';
  assert.equal(sim.execute('lineup',a.id).ok,false);assert.equal(a.state,'HOLD');
  sim.runwayOwner=null;assert.equal(sim.execute('lineup',a.id).ok,true);sim.runwayOwner='OTHER';sim.paused=false;sim.update(8);assert.equal(a.state,'HOLD');assert.equal(sim.runwayOwner,'OTHER');
});
test('manual ground hold resumes its remaining route instead of discarding it',()=>{
  const sim=new Simulation(),a=sim.aircraft[0];a.state='TAXI';a.channel='GND';sim.setGround(a,[{x:2000,z:-176},{x:2200,z:-176}],7);a.x=2000;a.z=-176;sim.paused=false;
  sim.execute('stop',a.id);sim.update(8);const x=a.x,index=a.groundIndex;sim.update(20);assert.equal(a.x,x);assert.equal(a.groundIndex,index);
  sim.execute('stop',a.id);sim.update(10);assert.ok(a.x>x);
});
for(const scenario of ['morning','west'])test(`complete ${scenario}: departures, landings, clear runway, park, no automatic go-arounds`,()=>{
  const sim=new Simulation(scenario);sim.paused=false;const touched=new Set();
  for(let i=0;i<4000&&!sim.finished;i++){
    pilot(sim);sim.update(2);
    for(const a of sim.aircraft){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.ax)&&Number.isFinite(a.alt));if(a.state==='ROLLOUT')touched.add(a.id);}
  }
  assert.equal(sim.finished,true,JSON.stringify(sim.aircraft.map(a=>({id:a.id,state:a.state,x:a.x,z:a.z,alt:a.alt,groundIndex:a.groundIndex,commands:sim.commands(a)}))));
  assert.equal(touched.size,2);assert.equal(sim.completed,4);assert.equal(sim.penalties,0);assert.equal(sim.runwayOwner,null);
  for(const a of sim.aircraft.filter(a=>a.kind==='ARR')){assert.equal(a.state,'PARKED_IN');assert.ok(Math.abs(a.x-a.gateData.x)<.01&&Math.abs(a.z-a.gateData.z)<.01);}
});
test('uncleared arrival goes around, follows initial missed leg, and returns to SANDY',()=>{
  const sim=new Simulation(),a=sim.aircraft.find(a=>a.kind==='ARR');a.active=true;a.state='FINAL';a.channel='TWR';a.alt=260;a.landing=false;
  const threshold=toAir(480,0),out=toAir(480-.6*NM,0);a.ax=out.x;a.ay=out.y;a.airRoute=[{...threshold,name:'RWY06',alt:45,speed:112,stage:'THR'}];a.airIndex=0;
  sim.paused=false;sim.update(1);assert.equal(a.state,'MISSED');assert.equal(sim.penalties,1);
  let turned=false;for(let i=0;i<2000&&a.state!=='HOLDING';i++){sim.update(1);if(a.missedTurn&&!turned){assert.ok(a.alt>=500);turned=true;}}
  assert.equal(a.state,'HOLDING');assert.equal(a.alt,3000);assert.equal(a.completed,false);assert.ok(sim.commands(a).some(c=>c.id==='ils'));
});
test('a pending ILS readback at the final STAR fix does not trigger a conflicting automatic hold',()=>{
  const sim=new Simulation(),a=sim.aircraft.find(a=>a.kind==='ARR');a.active=true;a.state='ENROUTE';a.airRoute=[];a.airIndex=0;a.ax=FIXES.SPICA.x;a.ay=FIXES.SPICA.y;a.alt=4000;
  assert.equal(sim.execute('ils',a.id).ok,true);sim.paused=false;sim.update(2);assert.equal(a.state,'ENROUTE');sim.update(6);assert.equal(a.state,'APPROACH');assert.equal(sim.penalties,0);
});
test('SANDY waiting assignments reserve separate altitudes, including calls still queued',()=>{
  const sim=new Simulation(),arrivals=sim.aircraft.filter(a=>a.kind==='ARR');
  for(const a of arrivals){a.active=true;a.state='ENROUTE';a.channel='APP';assert.equal(sim.execute('hold',a.id).ok,true);}
  assert.equal(arrivals[0].assignedHoldAlt,4000);assert.equal(arrivals[1].assignedHoldAlt,5000);
});
