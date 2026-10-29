from pathlib import Path
r=Path.cwd();p=r/'remake/world-handdrawn.mjs';s=p.read_text(encoding='utf-8-sig')
s=s.replace("ground:'ground-painted.png'","ground:'ground-painted.png',apron:'apron-material.png',markings:'ground-markings.svg'").replace('loaded===6','loaded===8')
s=s.replace("for(let i=0;i<56;i++){const x=1120+i*38,z=-610-(i%5)*31;add('scenery',x,z,67+(i%3)*8,64+(i%3)*8,scenery(0),.86)}","for(let i=0;i<70;i++){const x=1060+((i*173)%2180),z=-590-((i*79)%260);add('scenery',x,z,58+(i%4)*8,56+(i%4)*8,scenery(0),.86)}")
s=s.replace("for(const g of GATES){add('infra',g.x+19,g.z-30,43,28,regions.baggage,.78);add('scenery',g.x-18,g.z-15,20,24,scenery(5),.86)}", "for(const g of GATES){if(['1','3','5','8'].includes(g.id))add('infra',g.x+22,g.z-18,46,28,regions.baggage,.78);add('scenery',g.x-18,g.z-15,16,19,scenery(5),.86)}")
s=s.replace("depth:P(p.x,p.z).y", "depth:p.z< -450?-10000+P(p.x,p.z).y:P(p.x,p.z).y")
s=s.replace("c.drawImage(im,-500,-1000,4000,1850);", "c.drawImage(im,-500,-1000,4000,1850);if(ready(images.apron)){for(let x=2330;x<2520;x+=95)c.drawImage(images.apron,x,-338,95,150);}if(ready(images.markings))c.drawImage(images.markings,-500,-1000,4000,1850);")
p.write_text(s,encoding='utf-8')
import json
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="1850" viewBox="0 0 4000 1850"><g fill="none" stroke="#c5a958" stroke-width="1.3">']
for g in json.loads((r/'tmp/gates.json').read_text()):
 if g['id'] not in ['7','8','9']:continue
 x=g['x']+500;y=g['z']+1000;parts.append(f'<path d="M {x} 814 V {y} M {x-6} {y} H {x+6}"/>')
parts.append('</g></svg>');(r/'assets/images/isometric/ground-markings.svg').write_text(''.join(parts),encoding='utf-8')
for name in ['tmp/handdrawn-qa.cjs','remake/tests/handdrawn-browser.cjs']:
 p=r/name;s=p.read_text(encoding='utf-8-sig').replace("dataset.assets==='6'","dataset.assets==='8'");p.write_text(s,encoding='utf-8')
