from pathlib import Path
import re
root=Path(__file__).resolve().parent
parts=[]
for filename in ['data.mjs','sim.mjs','world-handdrawn.mjs','app.mjs']:
    code=(root/filename).read_text(encoding='utf-8-sig')
    code=re.sub(r'^import .*?;\s*$','',code,flags=re.M)
    code=re.sub(r'\bexport (?=(const|class|function)\b)','',code)
    if filename=='app.mjs':
        code=code.replace("$('#welcome').showModal();", "sim.paused=true;")
        code=code.replace("document.body.dataset.webgl='true'", "document.body.dataset.renderer='handdrawn'")
    if filename=='app.mjs':
        code=code.replace('const commands=sim.commands(),cs=', "const availableCommands=sim.commands();const common=a.kind==='DEP'?[['taxi','滑行許可'],['stop','原地等待'],['lineup','進跑道等待'],['takeoff','起飛許可']]:[['ils','進場許可'],['land','降落許可'],['goaround','重飛']];const commands=[...availableCommands,...common.filter(([id])=>!availableCommands.some(c=>c.id===id)).map(([id,label])=>({id,label,disabled:true,reason:'目前航班階段尚不適用此指令。'}))],cs=")
        code=code.replace('飛機顯示放大 1.75 倍','飛機圖示為便於辨識而放大，非等比例')
        code=code.replace('3D 畫面無法啟動','場景無法啟動')
    parts.append(code)
(root.parent/'assets/js/game.js').write_text("(()=>{\n'use strict';\n"+'\n'.join(parts)+'\n})();',encoding='utf-8')
html=(root/'index.html').read_text(encoding='utf-8')
html=html.replace('href="style.css"','href="assets/css/game.css"')
html=html.replace('<script type="module" src="app.mjs"></script>','<script src="assets/js/game.js" defer></script>')
(root.parent/'index.html').write_text(html,encoding='utf-8')
print('Built split HTML / CSS / JS / image assets')
