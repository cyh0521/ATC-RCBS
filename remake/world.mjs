import * as T from './vendor/three.module.js';
import { RWY, CONNECTORS, TWY_Z, GATES, PERF } from './data.mjs';
import { isGround } from './sim.mjs';

export function createAirport(stage, onSelect) {
  const scene=new T.Scene();scene.background=new T.Color('#dae3d2');
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  renderer.domElement.setAttribute('aria-label','金門機場 3D 場景；可點選航機，拖曳平移與滾輪縮放');stage.append(renderer.domElement);
  const camera=new T.OrthographicCamera(-1800,1800,900,-900,1,12000);
  const center=new T.Vector3(2420,0,-170),offset=new T.Vector3(200,1900,2600);let zoom=1,focus='apron';
  const ambient=new T.HemisphereLight('#fff9e8','#71876a',1.8);scene.add(ambient);
  const sun=new T.DirectionalLight('#fff5df',2.5);sun.position.set(100,2100,-650);sun.target.position.set(1700,0,-70);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1900,right:1900,top:1000,bottom:-1000,near:100,far:5000});sun.shadow.normalBias=1.2;sun.shadow.bias=-.00015;
  const materials=new Map(),geometries=new Map(),staticRoot=new T.Group();scene.add(staticRoot);
  const mat=(color,other={})=>{const key=color+JSON.stringify(other);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.86,...other}));return materials.get(key);};
  function mesh(geo,m,x=0,y=0,z=0,parent=staticRoot){const o=new T.Mesh(geo,typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(w,h,d,x,y,z,color,parent=staticRoot){const key=`b${w}/${h}/${d}`;if(!geometries.has(key))geometries.set(key,new T.BoxGeometry(w,h,d));const o=mesh(geometries.get(key),color,x,y,z,parent);if(parent===staticRoot&&h<3)o.castShadow=false;if(h<.3)o.receiveShadow=false;return o;}
  function cyl(rt,rb,h,x,y,z,color,parent=staticRoot,n=10){const key=`c${rt}/${rb}/${h}/${n}`;if(!geometries.has(key))geometries.set(key,new T.CylinderGeometry(rt,rb,h,n));return mesh(geometries.get(key),color,x,y,z,parent);}
  function polygon(points,height,color,y=0,parent=staticRoot){const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});g.rotateX(Math.PI/2);const o=mesh(g,color,0,y,0,parent);if(parent===staticRoot&&height<6)o.castShadow=false;return o;}
  function line(points,color,width=.9,y=2.5,parent=staticRoot){
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);const o=box(len,.13,width,(a[0]+b[0])/2,y,(a[1]+b[1])/2,color,parent);o.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);o.castShadow=false;}
  }
  function textPlane(text,x,z,w=80,h=18,color='#e9ecd9',y=2.6,rotation=0){
    const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='700 72px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const o=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),x,y,z);o.rotation.x=-Math.PI/2;o.rotation.z=rotation;o.castShadow=false;return o;
  }
  // The world retains actual runway/taxiway geometry. Surrounding scenery is stylized.
  box(3800,25,1250,1500,-18,-300,'#9cac7b');
  box(3900,12,650,1500,-20,650,'#73a8ab');
  polygon([[-450,230],[3500,230],[3500,350],[2900,330],[2500,350],[1900,315],[1200,350],[650,310],[100,345],[-450,330]],5,'#dfd2ab',-4);
  const coast=[];for(let x=-400;x<=3500;x+=60)coast.push([x,345+Math.sin(x*.006)*12]);line(coast,'#c8ded6',3,-10);
  for(let i=0;i<12;i++){const z=400+i*27;line([[-350+(i%3)*30,z],[3400-(i%4)*40,z+5]],i%2?'#88b5b5':'#80afb0',1.3,-13);}
  // Asphalt, runway shoulder, displaced threshold, centreline and threshold markings.
  box(3025,1.8,57,1502,0,0,'#a8ad9c');box(3004,2,45,1502,1,0,'#59646a');
  for(const z of [-21,21])line([[0,z],[3004,z]],'#e5e6d7',.8,2.1);
  for(let x=570;x<2910;x+=65)box(32,.15,.9,x,2.2,0,'#e9ecdf');
  for(let i=0;i<6;i++)for(const side of [-1,1]){const z=side*(3+i*2.7);box(30,.15,1.6,502,2.2,z,'#f1f0df');box(30,.15,1.6,2980,2.2,z,'#f1f0df');}
  for(let x=75;x<450;x+=85)line([[x-15,-4],[x,0],[x-15,4]],'#f1f0df',1,2.2);
  for(const x of [780,2700])for(const z of [-12,12])box(35,.15,5,x,2.2,z,'#edeede');
  textPlane('06',554,0,33,21);textPlane('24',2926,0,33,21,'#e9ecd9',2.6,Math.PI);
  // Turn pad at the displaced 06 threshold (AD 2.20).
  polygon([[450,-22],[500,-22],[516,-37],[454,-37]],1.5,'#59646a',1.5);
  // TWY N and four connectors follow 020 centreline coordinates.
  const start=CONNECTORS.D.x-40,end=CONNECTORS.A.x+10;
  box(end-start,1.6,23,(start+end)/2,.8,TWY_Z,'#737d7b');line([[start,TWY_Z],[end,TWY_Z]],'#e8cd78',.8,1.8);
  for(const [id,c] of Object.entries(CONNECTORS)){
    box(23,1.5,176,c.x,.8,-88,'#737d7b');
    // Flared intersections leave room for rounded centreline turns.
    polygon([[c.x-28,-176],[c.x+28,-176],[c.x+11.5,-148],[c.x+11.5,-28],[c.x+28,-22],[c.x-28,-22],[c.x-11.5,-28],[c.x-11.5,-148]],1.4,'#737d7b',1.5);
    line([[c.x,TWY_Z],[c.x,0]],'#e8cd78',.75,2.3);
    for(const z of [-78,-81])box(23,.1,.7,c.x,2.35,z,'#f0d183');
    for(const z of [-84,-87])for(let dx=-10;dx<11;dx+=4)box(2,.1,.7,c.x+dx,2.35,z,'#f0d183');
    const sign=box(15,7,2,c.x+22,5,-93,'#e7bd65');textPlane(id,c.x+22,-96,17,12,'#354b43',2.9);
    textPlane(id,c.x,-115,14,14,'#e7c36a');
  }
  textPlane('N',2350,TWY_Z,15,14,'#f0d183');textPlane('N',1700,TWY_Z,15,14,'#f0d183');
  // Aprons and real stand positions from AD 2.8.
  const east=GATES.filter(g=>+g.id<=6),west=GATES.filter(g=>+g.id>6);
  for(const area of [east,west]){
    const min=Math.min(...area.map(g=>g.x))-35,max=Math.max(...area.map(g=>g.x))+35,back=Math.min(...area.map(g=>g.z))-45;
    box(max-min,1.5,Math.abs(back-TWY_Z),(max+min)/2,.9,(back+TWY_Z)/2,'#b5b6a3');
    for(let x=min;x<max;x+=30)line([[x,TWY_Z],[x,back]],'#a5ab9c',.35,1.8);
    for(let z=TWY_Z;z>back;z-=30)line([[min,z],[max,z]],'#a5ab9c',.35,1.8);
  }
  for(const g of GATES){
    line([[g.x,TWY_Z],[g.x,g.z]],'#d4b868',.85,2.05);line([[g.x-6,g.z],[g.x+6,g.z]],'#d4b868',.9,2.05);
    textPlane(g.id,g.x,g.z-14,12,12,'#faf4dd');
  }
  // Military apron is scenery only in this release.
  box(230,1.7,135,2060,.8,-252,'#abb1a0');line([[1980,-176],[1980,-300]],'#e0c16d',.75,2.2);
  function terminal(){
    const min=east.at(-1).x-28,max=east[0].x+30,cx=(min+max)/2,z=Math.min(...east.map(g=>g.z))-62,len=max-min;
    box(len,20,46,cx,11,z,'#e7dfc8');box(len+6,3.5,52,cx,22.8,z,'#ddd3b7');
    box(len-10,11,1,cx,13,z+23.2,'#628a88');box(len+8,2,18,cx,17,z+28,'#eee7ce');
    for(let x=min+5;x<max;x+=17){box(1.2,19,1.2,x,10,z+24,'#d8d5bd');box(1.2,2,17,x,17,z+28,'#c7c9b7');}
    for(let x=min+20;x<max-10;x+=55){box(18,4,12,x,27,z-6,'#a5b4aa');}
    const tx=min-38;box(17,40,17,tx,21,z+12,'#dcd6bd');cyl(14,12,10,tx,46,z+12,'#537575',staticRoot,8);cyl(16,16,2,tx,52,z+12,'#eee6ce',staticRoot,8);cyl(.8,.8,12,tx,59,z+12,'#b6bcb0');
    textPlane('KINMEN',cx,z-50,100,20,'#50685c',2.2);
    return {x:cx,z};
  }
  const term=terminal();
  // Simple gable hangar and fire station, distinct but inexpensive shapes.
  box(105,29,65,2030,15,-350,'#d7cfb3');polygon([[1974,-386],[2086,-386],[2086,-314],[1974,-314]],4,'#b8b39c',33);
  box(79,23,1,2030,12,-316.9,'#637c71');for(let x=2002;x<2070;x+=18)box(1,22,1,x,12,-315,'#aab5a2');
  box(55,15,35,2530,8,-335,'#e3d2af');box(59,2,39,2530,16,-335,'#b29f80');
  for(let x=2513;x<2550;x+=17)box(13,10,1,x,6,-317,'#7b9182');
  // Airport service road and small parking lot.
  box(1700,.8,19,2260,.4,-440,'#8e9c8a');line([[1410,-440],[3100,-440]],'#d7d8bd',.7,1);
  box(290,.8,90,term.x,1,-505,'#9aa58e');
  for(let x=term.x-125;x<term.x+130;x+=15)line([[x,-545],[x,-520]],'#d3d7bc',.7,1.8);
  let seed=342;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<17;i++){
    const x=term.x-120+i*15;box(7,3.5,13,x,3,-533,['#ddd8c2','#657f73','#b8b79e','#a4b6b0'][i%4]);box(6,2,6,x,5,-534,'#597774');
  }
  // Batched low-poly vegetation: visual density with few draw calls.
  const treeGeo=new T.IcosahedronGeometry(1,0),trunkGeo=new T.CylinderGeometry(.8,1.2,10,5);
  const trees=new T.InstancedMesh(treeGeo,mat('#648762'),250),trunks=new T.InstancedMesh(trunkGeo,mat('#8a8062'),250);
  const dummy=new T.Object3D();
  for(let i=0;i<250;i++){
    const x=-120+rand()*3400,z=-585-rand()*265,size=8+rand()*13;
    dummy.position.set(x,15+size*.5,z);dummy.scale.set(size,size*(.85+rand()*.5),size);dummy.rotation.set(rand(),rand(),rand());dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);
    dummy.position.set(x,5,z);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
    trees.setColorAt(i,new T.Color(['#68865d','#7c9567','#91a476','#57785b'][i%4]));
  }
  trees.castShadow=true;trees.receiveShadow=true;trunks.castShadow=true;scene.add(trees,trunks);
  // Sparse scrub stays clear of manoeuvring areas.
  const shrubs=new T.InstancedMesh(treeGeo,mat('#859b69'),90);
  for(let i=0;i<90;i++){dummy.position.set(rand()*3200-100,3,130+rand()*90);dummy.scale.set(4+rand()*6,3+rand()*4,4+rand()*6);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);}scene.add(shrubs);
  // Fence and edge lights.
  for(let x=0;x<=3050;x+=55){box(1,8,1,x,4,105,'#a3aa92');for(const z of [-26,26])cyl(.65,.8,1.5,x,2,z,'#e8db98',staticRoot,6);}
  line([[0,105],[3050,105]],'#9ea88e',.6,7);
  // Wind sock beside the runway, 06 apron side.
  cyl(.7,.9,20,1170,10,-85,'#e4ddc4');const sock=mesh(new T.CylinderGeometry(2,1.3,10,8),mat('#d69b71'),1175,20,-85);sock.rotation.z=Math.PI/2;

  const aircraft=new Map(),raycaster=new T.Raycaster(),mouse=new T.Vector2();
  const labels=document.createElement('div');labels.className='scene-labels';stage.append(labels);
  function makePlane(a){
    const root=new T.Group();scene.add(root);root.userData.aircraft=a.id;
    const L=PERF[a.type].length,span=PERF[a.type].span,isJet=a.type==='JET',bodyY=isJet?3.4:3.3,r=isJet?1.85:1.4;
    const profile=[[-.5,.08],[-.43,.45],[-.30,.88],[-.15,1],[.23,1],[.35,.9],[.43,.62],[.49,.22],[.5,.01]].map(([p,v])=>new T.Vector2(r*v,p*L));
    const fuselage=new T.LatheGeometry(profile,16);fuselage.rotateZ(-Math.PI/2);mesh(fuselage,'#f3efdd',0,bodyY,0,root);
    // A restrained airline stripe and windows on both sides.
    for(const sign of [-1,1]){
      box(L*.61,.35,.1,-L*.03,bodyY-.3,sign*r*.96,a.color,root);
      for(let x=-L*.27;x<L*.29;x+=isJet?1.65:1.45)box(.53,.48,.13,x,bodyY+.38,sign*r*.97,'#4d6d70',root);
      const cockpit=box(1.35,.65,.12,L*.37,bodyY+.45,sign*r*.72,'#4a6870',root);cockpit.rotation.y=sign*.35;
    }
    const wingY=isJet?2.8:4.4;
    polygon([[-3,0],[3.7,0],[-.7,span/2],[-3.4,span/2],[-2,3]],.3,'#e1e2d4',wingY,root);
    polygon([[-3,0],[3.7,0],[-.7,-span/2],[-3.4,-span/2],[-2,-3]],.3,'#e1e2d4',wingY,root);
    // Vertical fin and T-tail give the prop its recognizable silhouette.
    const tailShape=new T.Shape();tailShape.moveTo(-L*.44,bodyY);tailShape.lineTo(-L*.36,bodyY+6);tailShape.lineTo(-L*.26,bodyY+6);tailShape.lineTo(-L*.25,bodyY);tailShape.closePath();
    const tailGeo=new T.ExtrudeGeometry(tailShape,{depth:.34,bevelEnabled:false});mesh(tailGeo,a.color,0,0,-.17,root);
    const tailY=isJet?bodyY+1:bodyY+5.9;
    polygon([[-L*.43,0],[-L*.29,0],[-L*.38,span*.22],[-L*.47,span*.22]],.2,'#e6e4d3',tailY,root);
    polygon([[-L*.43,0],[-L*.29,0],[-L*.38,-span*.22],[-L*.47,-span*.22]],.2,'#e6e4d3',tailY,root);
    const props=[];
    for(const sign of [-1,1]){
      const z=sign*span*.22;
      const engine=cyl(isJet?1.2:.7,isJet?1.1:.9,isJet?4.6:4.4,.2,isJet?2.3:4,z,'#e3e3d4',root,12);engine.rotation.z=-Math.PI/2;
      if(isJet){const inlet=cyl(.93,.93,.15,2.55,2.3,z,'#465b5b',root,12);inlet.rotation.z=-Math.PI/2;}
      else{
        const prop=new T.Group();prop.position.set(2.55,4,z);root.add(prop);props.push(prop);
        for(let i=0;i<3;i++){const blade=box(.15,4.8,.28,0,0,0,'#4e5f57',prop);blade.rotation.x=i*Math.PI/3;}
        const hub=cyl(.35,.45,.6,.3,0,0,'#ddd9c4',prop,10);hub.rotation.z=-Math.PI/2;
      }
      box(.2,1.7,.2,-L*.1,1.3,sign*1.5,'#8f998e',root);
      const wheel=cyl(.62,.62,.45,-L*.1,.65,sign*1.55,'#394e46',root,10);wheel.rotation.x=Math.PI/2;
    }
    box(.2,1.7,.2,L*.3,1.3,0,'#8f998e',root);const front=cyl(.45,.45,.5,L*.3,.5,0,'#394e46',root,10);front.rotation.x=Math.PI/2;
    // Larger visual plane improves legibility; simulation distances remain in metres.
    root.scale.setScalar(1.75);
    const ring=new T.Mesh(new T.RingGeometry(26,27,60),new T.MeshBasicMaterial({color:'#fff0b5',side:T.DoubleSide,transparent:true,opacity:.95,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=3;scene.add(ring);
    const label=document.createElement('button');label.className='plane-label';label.textContent=a.id;label.onclick=e=>{e.stopPropagation();onSelect(a.id);};labels.append(label);
    root.traverse(o=>{o.userData.aircraft=a.id;});
    const plane={root,props,ring,label};aircraft.set(a.id,plane);return plane;
  }
  const routeGroup=new T.Group();scene.add(routeGroup);const routeDotGeo=new T.CircleGeometry(2.2,8),routeDotMat=new T.MeshBasicMaterial({color:'#fff1b6',side:T.DoubleSide,depthWrite:false});
  for(let i=0;i<120;i++){const o=new T.Mesh(routeDotGeo,routeDotMat);o.rotation.x=-Math.PI/2;o.visible=false;routeGroup.add(o);}
  const projected=new T.Vector3();let width=1,height=1,lastSim;
  function resize(){width=stage.clientWidth;height=stage.clientHeight;if(width<1||height<1)return;renderer.setSize(width,height);updateCamera();}
  function updateCamera(){const halfWidth=focus==='aircraft'?185:focus==='apron'?900:1720;const halfHeight=Math.max(halfWidth*height/width,focus==='aircraft'?80:focus==='apron'?240:390)/zoom;
    camera.left=-halfHeight*width/height;camera.right=halfHeight*width/height;camera.top=halfHeight;camera.bottom=-halfHeight;camera.zoom=1;camera.position.copy(center).add(offset);camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();}
  function setView(mode){focus=mode;zoom=1;const a=lastSim?.selectedAircraft;if(mode==='aircraft'&&a&&isGround(a))center.set(a.x,0,a.z);else center.set(mode==='overview'?1550:2420,0,mode==='overview'?-20:-170);updateCamera();}
  let down=null,dragged=false;
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,cx:center.x,cz:center.z};dragged=false;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>5)dragged=true;if(dragged){const scale=(camera.right-camera.left)/width;center.x=down.cx-dx*scale;center.z=down.cz-dy*scale*1.4;updateCamera();}});
  renderer.domElement.addEventListener('pointerup',e=>{if(!dragged){const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects([...aircraft.values()].filter(p=>p.root.visible).map(p=>p.root),true);if(hits[0])onSelect(hits[0].object.userData.aircraft);}down=null;});
  renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.7,Math.min(3,zoom*(e.deltaY<0?1.12:.89)));updateCamera();},{passive:false});
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  function update(sim,time){
    lastSim=sim;
    const followed=sim.selectedAircraft;
    if(focus==='aircraft'&&followed&&isGround(followed)){center.set(followed.x,0,followed.z);updateCamera();}
    for(const a of sim.aircraft){
      const p=aircraft.get(a.id)||makePlane(a),visible=a.active&&isGround(a);
      p.root.visible=visible;p.ring.visible=visible&&a.id===sim.selected;p.label.hidden=!visible;
      if(!visible)continue;
      p.root.position.set(a.x,2.2,a.z);p.root.rotation.y=-a.hdg*Math.PI/180;
      p.ring.position.set(a.x,2.7,a.z);p.label.classList.toggle('selected',a.id===sim.selected);p.label.classList.toggle('request',a.request);
      for(const prop of p.props)prop.rotation.x=time*(a.state==='PARKED_IN'||a.state==='SCHEDULED'?0:32);
      projected.set(a.x,30,a.z).project(camera);const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
      p.label.style.transform=`translate(${x}px,${y-16}px) translate(-50%,-100%)`;p.label.hidden=projected.z>1||x<0||x>width||y<0||y>height;
    }
    const a=sim.selectedAircraft,pts=[];
    if(a&&isGround(a)&&a.groundRoute.length&&a.groundIndex<a.groundRoute.length){
      let previous={x:a.x,z:a.z};
      for(const next of a.groundRoute.slice(a.groundIndex)){
        const len=Math.hypot(next.x-previous.x,next.z-previous.z),count=Math.ceil(len/17);
        for(let i=1;i<=count;i++)pts.push({x:previous.x+(next.x-previous.x)*i/count,z:previous.z+(next.z-previous.z)*i/count});previous=next;
      }
    }
    routeGroup.children.forEach((o,i)=>{o.visible=i<pts.length;if(o.visible)o.position.set(pts[i].x,3,pts[i].z);});
    renderer.render(scene,camera);
  }
  function reset(){for(const p of aircraft.values()){scene.remove(p.root,p.ring);p.label.remove();}aircraft.clear();setView('apron');}
  return {update,setView,reset,renderer,scene,camera,resize};
}
