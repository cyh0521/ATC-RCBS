import { RWY, CONNECTORS, TWY_Z, GATES, PERF } from './data.mjs';
import { isGround } from './sim.mjs';
// Fixed oblique projection. All ground positions remain in official chart metres.
export function createAirport(stage,onSelect){
 const canvas=document.createElement('canvas');stage.append(canvas);canvas.setAttribute('aria-label','手繪金門機場，可拖曳縮放及點選航機');const c=canvas.getContext('2d');
 const images={};let loaded=0;for(const [key,file] of Object.entries({ground:'airport-ground.svg',terminal:'terminal.png',atr:'atr-directions.png',jet:'jet-directions.png',tree:'tree.png'})){const im=new Image();im.onload=()=>{loaded++;document.body.dataset.assets=String(loaded)};im.onerror=()=>{document.body.dataset.assetError=file};im.src='assets/images/'+file;images[key]=im;}
 let width=1,height=1,zoom=1,mode='apron',lastSim=null,hits=[],drag=null,moved=false,pan={x:0,y:0};
 const project=(x,z)=>({x:x*.97+z*.18,y:x*.11+z*.72});
 function viewport(){let left=1150,right=3210;if(width<700){left=2290;right=3160;} if(mode==='overview'){left=-120;right=3180}const s=width/(right-left)/.97*zoom;const center=project((left+right)/2,-90);return {s,ox:width/2-center.x*s+pan.x,oy:height*.53-center.y*s+pan.y};}
 function point(x,z){const v=viewport(),p=project(x,z);return {x:p.x*v.s+v.ox,y:p.y*v.s+v.oy}}
 function resize(){width=stage.clientWidth;height=stage.clientHeight;const d=Math.min(devicePixelRatio,2);canvas.width=width*d;canvas.height=height*d;canvas.style.width=width+'px';canvas.style.height=height+'px';c.setTransform(d,0,0,d,0,0)}
 const observer=new ResizeObserver(resize);observer.observe(stage);resize();
 function imageAt(im,x,z,w,h){if(!im.complete||!im.naturalWidth)return;const p=point(x,z),s=viewport().s;c.drawImage(im,p.x-w*s/2,p.y-h*s,w*s,h*s)}
 function label(text,x,y,selected=false){c.font='600 11px Consolas,monospace';const w=c.measureText(text).width+16;c.fillStyle=selected?'#286f62':'#f6f1df';c.strokeStyle=selected?'#a0dfc5':'#8b9b7d';c.lineWidth=1;c.beginPath();c.roundRect(x-w/2,y-23,w,22,4);c.fill();c.stroke();c.fillStyle=selected?'#fff9e6':'#294e44';c.fillText(text,x-w/2+8,y-8);}
 function update(sim,time){lastSim=sim;if(mode==='aircraft'&&isGround(sim.selectedAircraft)){const p=point(sim.selectedAircraft.x,sim.selectedAircraft.z);pan.x+=width*.5-p.x;pan.y+=height*.55-p.y;}
 c.clearRect(0,0,width,height);c.fillStyle='#b7c5a1';c.fillRect(0,0,width,height);const v=viewport();
 if(images.ground.complete&&images.ground.naturalWidth)c.drawImage(images.ground,v.ox-500*v.s,v.oy-660*v.s,4100*v.s,1600*v.s);
 // Trees stand behind the apron. Building and sprites have independent files.
 for(let i=0;i<54;i++){const x=460+i*53+Math.sin(i*3)*22;imageAt(images.tree,x,-485-(i%7)*24,46+(i%3)*8,62+(i%3)*8)}
 imageAt(images.terminal,2785,-340,620,225);
 c.font='600 10px Microsoft JhengHei';c.fillStyle='#536d54';let p=point(2780,-330);c.fillText('金門航空站',p.x-28,p.y+11);
 // Painted hangars west of the civil apron.
 function building(x,z,w,h){const p=point(x,z),s=v.s;c.fillStyle='#d5d5b5';c.strokeStyle='#74856a';c.lineWidth=1;c.fillRect(p.x-w*s/2,p.y-h*s,w*s,h*s);c.strokeRect(p.x-w*s/2,p.y-h*s,w*s,h*s);c.fillStyle='#a2b39a';c.beginPath();c.moveTo(p.x-w*s/2,p.y-h*s);c.lineTo(p.x-w*s/2+15*s,p.y-h*s-14*s);c.lineTo(p.x+w*s/2+15*s,p.y-h*s-14*s);c.lineTo(p.x+w*s/2,p.y-h*s);c.closePath();c.fill();c.stroke();c.fillStyle='#6d8277';c.fillRect(p.x-w*.35*s,p.y-h*.65*s,w*.7*s,h*.65*s)}
 building(1850,-330,135,38);building(2220,-332,95,28);building(2490,-340,48,24);
 for(const g of GATES){p=point(g.x,g.z);c.fillStyle='#8b9475';c.font='10px Consolas';c.fillText(g.id,p.x-3,p.y+22)}
 for(const [name,g] of Object.entries(CONNECTORS)){p=point(g.x,-85);c.font='italic bold 20px Georgia';c.fillStyle='#e7ce77';c.fillText(name,p.x-8,p.y+5)}
 p=point(2180,TWY_Z);c.font='italic bold 13px Georgia';c.fillStyle='#ecd17c';c.fillText('N',p.x,p.y-10);
 const a=sim.selectedAircraft;if(a&&isGround(a)&&a.groundRoute.length){c.strokeStyle='#8edbc6';c.lineWidth=2;c.setLineDash([7,6]);c.beginPath();p=point(a.x,a.z);c.moveTo(p.x,p.y);for(const q of a.groundRoute.slice(a.groundIndex)){p=point(q.x,q.z);c.lineTo(p.x,p.y)}c.stroke();c.setLineDash([])}
 hits=[];for(const a of [...sim.aircraft].sort((a,b)=>a.z-b.z)){if(!a.active||!isGround(a))continue;p=point(a.x,a.z);const selected=a.id===sim.selected;const size=Math.max(width<700?50:84,Math.min(145,(a.type==='JET'?170:135)*v.s));if(selected){c.strokeStyle='#71c7ad';c.lineWidth=1.5;c.fillStyle='#99d7bc25';c.beginPath();c.ellipse(p.x,p.y,size*.54,size*.22,.1,0,Math.PI*2);c.fill();c.stroke()}
 const im=images[a.type==='JET'?'jet':'atr'];let index=a.hdg>=225&&a.hdg<315?3:a.hdg>=45&&a.hdg<135?2:a.hdg>=135&&a.hdg<225?1:0;
 if(im.complete&&im.naturalWidth){const sw=im.naturalWidth/2,sh=im.naturalHeight/2;c.drawImage(im,index%2*sw,Math.floor(index/2)*sh,sw,sh,p.x-size/2,p.y-size*.56,size,size*.67)}
 label(a.id,p.x,p.y-size*.42,selected);hits.push({id:a.id,x:p.x,y:p.y,r:Math.max(23,size*.55)})}
 // Scale and compass remain HTML so they stay sharp at every zoom level.
 }
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};moved=false;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(moved){mode='apron';pan={x:drag.px+dx,y:drag.py+dy}}});canvas.addEventListener('pointerup',e=>{if(!moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const h=hits.slice().reverse().find(h=>Math.hypot(x-h.x,y-h.y)<h.r);if(h)onSelect(h.id)}drag=null});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.7,Math.min(3,zoom*(e.deltaY<0?1.1:1/1.1)))},{passive:false});
 function setView(v){mode=v;zoom=1;pan={x:0,y:0}}return {update,setView,reset(){setView('apron')},resize,renderer:{domElement:canvas},get assetsLoaded(){return loaded}};
}
