import { CONNECTORS, GATES } from './data.mjs';
import { isGround } from './sim.mjs';
// Same 2:1 isometric projection as RookieDay: both horizontal axes slope 1:2.
// Static scenery is exclusively external painted artwork. Canvas paths are UI overlays.
export function createAirport(stage,onSelect){
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
