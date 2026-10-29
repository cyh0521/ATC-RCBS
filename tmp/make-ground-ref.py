from pathlib import Path
import re,math
r=Path(__file__).resolve().parent.parent
# The exact geometry is defined in data.mjs. Same oblique projection as world-handdrawn.mjs.
def p(x,z):return (x+500,z+1000)
def points(coords):return ' '.join('%.2f,%.2f'%p(x,z) for x,z in coords)
s=['<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="1850" viewBox="0 0 4000 1850"><defs><filter id="paper"><feTurbulence baseFrequency=".55" numOctaves="3" seed="8"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".065"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><g filter="url(#paper)"><rect width="4000" height="1850" fill="#b3c19a"/>']
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
s.append('</g></svg>');(r/'tmp/ground-plan-reference.svg').write_text(''.join(s),encoding='utf-8')
