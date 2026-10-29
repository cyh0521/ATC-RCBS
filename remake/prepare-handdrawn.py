# LEGACY first handdrawn layout generator. Current isometric scene uses assets/images/isometric/.
# Do not run to rebuild current assets/css/game.css; edit that file directly.
from pathlib import Path
import re,math
r=Path(__file__).resolve().parent.parent
# The exact geometry is defined in data.mjs. Same oblique projection as world-handdrawn.mjs.
def p(x,z):return (x*.97+z*.18+500,x*.11+z*.72+660)
def points(coords):return ' '.join('%.2f,%.2f'%p(x,z) for x,z in coords)
s=['<svg xmlns="http://www.w3.org/2000/svg" width="4100" height="1600" viewBox="0 0 4100 1600"><defs><filter id="paper"><feTurbulence baseFrequency=".55" numOctaves="3" seed="8"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".065"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><g filter="url(#paper)"><rect width="4100" height="1600" fill="#b3c19a"/>']
def poly(coords,fill,stroke='none',width=1):s.append(f'<polygon points="{points(coords)}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>')
def rect(x,z,w,d,color,stroke='none'):poly([(x,z),(x+w,z),(x+w,z+d),(x,z+d)],color,stroke)
def line(coords,color,width=1,dash=''):s.append(f'<polyline points="{points(coords)}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" '+(f'stroke-dasharray="{dash}"' if dash else '')+'/>')
poly([(-600,375),(500,405),(1000,390),(1600,420),(2200,405),(3400,440),(3800,1000),(-600,1000)],'#75a5a3')
poly([(-600,290),(500,310),(1000,300),(1600,330),(2200,320),(3400,350),(3400,440),(2200,405),(1600,420),(1000,390),(500,405),(-600,375)],'#e7d8b2')
for j in range(5):line([(x,425+j*35+math.sin(x*.013+j)*7) for x in range(-500,3550,35)],'#bad0bf',1.3)
for j in range(16):
    x=700+j*145;rect(x,-600,30,12,'#819574');rect(x+18,-570,14,7,'#96a77c')
# North parallel taxiway and apron footprints.
rect(1375,-189,1640,26,'#8b9380','#7b8671')
for x,w in [(1720,260),(2100,240),(2500,510)]:rect(x,-345,w,160,'#d8d4b8','#a9ad91')
for x in range(1710,3010,45):line([(x,-340),(x,-192)],'#c3c6a8',.6)
for z in [-315,-270,-225]:line([(1720,z),(1980,z)],'#c3c6a8',.6);line([(2500,z),(3010,z)],'#c3c6a8',.6)
for x in [1401,1862,2573,2985]:
    rect(x-12,-176,24,176,'#8b9380','#7b8671')
    # Rounded transition shoulders preserve the connector centreline.
    line([(x-30,-176),(x,-176),(x,-145)],'#8b9380',30)
    line([(x-30,0),(x,0),(x,-30)],'#8b9380',30)
    line([(x,-176),(x,-12)],'#e6ca76',1.6)
    for dz in [-67,-63]:line([(x-12,dz),(x+12,dz)],'#e8d58f',1.2)
line([(1390,-176),(2985,-176)],'#e6ca76',1.5)
# Runway 3004 x 45 m, 480 m displaced threshold for runway 06.
rect(-12,-30,3028,60,'#a3aa91')
rect(0,-22.5,3004,45,'#6a746d','#626e61')
for z in [-21,21]:line([(0,z),(3004,z)],'#eee9d3',1)
line([(540,0),(2930,0)],'#f3edda',1.5,'30 32')
for x in [490,2970]:
 for z in [-17,-12,-7,5,10,15]:rect(x,z,24,2,'#f4efdb')
for x in [80,180,280,380]:line([(x-13,-4),(x,0),(x-13,4)],'#ece9d6',1.4)
poly([(450,-22),(500,-22),(516,-37),(454,-37)],'#6a746d')
for x,t,angle in [(550,'06',0),(2935,'24',180)]:
 u,v=p(x,0);s.append(f'<text x="{u}" y="{v+7}" fill="#f2eedc" font-family="Arial" font-size="23" font-weight="bold" text-anchor="middle" transform="rotate({angle+6.47} {u} {v})">{t}</text>')
for x in [780,2700]:
 for z in [-14,10]:rect(x,z,32,4,'#eee9d3')
# Gate lead-in lines use locations transcribed in data.mjs, not the old pixel diagram.
# Values read from the same data module through generated JSON below.
import json
for g in json.loads((r/'tmp/gates.json').read_text()):
 x,z=g['x'],g['z'];line([(x,-176),(x,z)],'#d2b962',1.2);line([(x-7,z),(x+7,z)],'#d2b962',1.2)
line([(200,-400),(3200,-400)],'#d4d3b5',14)
line([(200,255),(3200,255)],'#7f9275',1)
for x in range(200,3200,38):line([(x,255),(x,240)],'#7f9275',.7)
s.append('</g></svg>');(r/'assets/images/airport-ground.svg').write_text(''.join(s),encoding='utf-8')
css=(r/'remake/style.css').read_text(encoding='utf-8')
css+='''
/* Hand-painted layout: reference image proportions, shared bottom command dock. */
:root{--ink:#173b3a;--paper:#f5f1e4;--edge:#d5d2be;--green:#286c60}body{background:#f5f1e4}.topbar{height:58px;padding:0 22px;gap:22px;background:#f5f1e4}.brand-icon,.brand .eyebrow{display:none}.brand h1{font-size:31px;letter-spacing:4px;margin:0}.brand h1 span{font-size:17px;letter-spacing:1px;margin-left:22px;color:#244441}.watch small,.weather small,.rwy-indicator small{display:none}.watch strong{font-size:19px}.rwy-indicator strong{font-size:19px;letter-spacing:0}.rwy-indicator strong:before{content:'RWY ';font-size:15px}.toolbar button{font-size:11px}.dashboard{padding:0;gap:0;grid-template-columns:22% 78%;grid-template-rows:minmax(300px,1fr) 310px}.panel{border-radius:0;border:0;background:var(--paper)}.radar-panel{border-right:2px solid #ece8d8;border-radius:0 7px 0 0}.scene-panel{border:0;border-radius:0;background:#b8c7a3}.scene-top{top:12px;left:16px;right:16px}.scene-top>div:first-child{display:none}.view-buttons{margin-left:auto;opacity:.85}.scene-bottom{bottom:10px}.comms-panel{border-top:2px solid #d9d5c2;border-right:1px solid #d5d2be}.operations{position:relative;display:grid;grid-template-rows:minmax(0,1fr) 88px;gap:0;padding:12px 18px 8px;border-top:2px solid #d9d5c2;background:var(--paper)}.strips-grid{grid-row:1;gap:24px;display:grid;grid-template-columns:1fr 1fr}.selected-panel{grid-row:2;display:flex;align-items:center;gap:16px;padding:8px 0 0;border-top:1px solid #d7d5c2;overflow:visible}.selected-info{min-width:225px;gap:8px}.selected-info .eyebrow,.aircraft-symbol,.selected-details,.status-chip{display:none}.selected-title{display:block;margin:0}.selected-title strong{font-size:24px}.selected-title>span{display:block;font-size:11px;margin-top:4px}.commands{margin:0;flex:1;flex-wrap:nowrap;gap:7px;align-items:center}.commands button{min-width:0;flex:1;font-size:13px;min-height:48px;padding:8px 10px;white-space:normal;border-radius:7px}.guidance{position:absolute;left:18px;right:18px;bottom:0;font-size:9px;display:none}.strip-heading{padding:0 7px 10px;border-bottom:1px solid #d8d5c4}.strip-heading h2{font-size:21px;letter-spacing:1px}.flight-direction{display:none}.strip-columns{font-size:11px;margin:8px 7px 0;grid-template-columns:1.05fr 1fr 1fr}.strip-list{padding:3px 0}.flight-strip{border-radius:3px;min-height:43px;padding:6px 8px;margin:0;border-bottom:1px solid #dedbc9;grid-template-columns:1.05fr 1fr 1fr}.flight-strip strong{font-size:16px}.flight-strip small{font-size:10px}.flight-strip .city,.flight-strip .state{font-size:13px}.flight-strip.selected{background:#cde3d6;border-color:#bcd9cc;box-shadow:inset 4px 0 #159d83}.panel-heading{padding:15px 20px 12px}.panel-heading h2{font-size:22px;margin:0}.panel-heading .eyebrow{display:none}.channels{margin:0 16px 12px;gap:6px}.channels button{font-size:13px;padding:9px 5px}.channels small{display:inline;font-size:11px;margin-left:5px}.channels button[data-channel=ALL],.channels button[data-channel=APP]{flex:.65;font-size:11px}.radio-log{margin:0 15px 14px;border:1px solid #ddd8c6;border-radius:9px;padding:4px 12px}.radio-entry{font-size:13px;padding:8px 0;border:0}.radio-entry .speaker{font-size:12px}.radio-entry p{color:#34534c}.radio-channel{font-size:9px}.footer{height:24px;padding:0 15px;font-size:10px}.footer button{font-size:10px}.radar-panel .panel-heading h2{font-size:18px}.radar-panel .panel-heading{padding:17px 20px}.radar-note{top:8px}.radar-controls{font-size:10px}.plane-label{font-size:11px}#render-error{display:none}
@media(max-width:1100px) and (min-width:701px){.topbar{gap:12px;padding:0 12px}.brand h1{font-size:24px}.brand h1 span{font-size:13px;margin-left:10px}.toolbar #sound{display:none}.dashboard{grid-template-columns:25% 75%;grid-template-rows:minmax(280px,1fr) 290px}.operations{padding:12px}.selected-info{min-width:150px}.selected-title strong{font-size:20px}.commands button{font-size:11px;padding:5px}.channels{margin:0 8px 10px}.channels button{font-size:11px}.channels small{font-size:9px}.panel-heading{padding:14px}.panel-heading h2{font-size:19px}.flight-strip strong{font-size:13px}.flight-strip .city,.flight-strip .state{font-size:11px}.strips-grid{gap:14px}.strip-heading h2{font-size:18px}.strip-columns{font-size:10px}.radio-log{margin:0 8px 10px}.radio-entry{font-size:11px}}
@media(max-width:700px){body{height:auto;overflow:auto}.topbar{height:auto;min-height:64px;padding:10px 12px;gap:10px}.brand h1{font-size:23px}.brand h1 span{font-size:12px;margin-left:8px}.toolbar{width:100%}.dashboard{display:grid;grid-template-columns:1fr;grid-template-rows:370px 240px auto 290px}.scene-panel{grid-column:1;grid-row:1}.radar-panel{grid-column:1;grid-row:2}.operations{grid-column:1;grid-row:3;display:flex;min-height:380px;padding:14px}.strips-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:205px;flex:1}.selected-panel{display:block;padding-top:12px}.selected-info{min-width:0}.selected-title{display:flex}.commands{margin-top:10px;flex-wrap:wrap}.commands button{min-width:100px;min-height:42px}.comms-panel{grid-column:1;grid-row:4;height:290px}.strip-heading h2{font-size:18px}.flight-strip strong{font-size:13px}.flight-strip .city,.flight-strip .state{font-size:11px}.strip-columns{font-size:9px}.view-buttons{opacity:1}.footer{min-height:36px}.watch strong{font-size:17px}}
'''
css+='\n.radar-panel,.radar-panel .panel-heading,.radar-controls{background:#1e3933}.radar-panel .panel-heading h2{color:#e5eddc}.commands button:first-child{max-width:240px}.commands button{font-weight:600}.flight-strip.inactive{opacity:.82}@media(max-width:700px){.selected-panel{order:2}.strips-grid{order:1}.commands button:first-child{max-width:none}.flight-strip{grid-template-columns:1fr 1fr}.flight-strip .city{display:none}.strip-columns{display:none}}\n'
(r/'assets/css/game.css').write_text(css,encoding='utf-8')
print('Painted ground SVG and interface stylesheet ready')
