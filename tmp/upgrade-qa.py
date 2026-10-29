from pathlib import Path
r=Path.cwd()
for name in ['tmp/handdrawn-qa.cjs','remake/tests/handdrawn-browser.cjs']:
 p=r/name;s=p.read_text(encoding='utf-8-sig').replace("dataset.assets==='5'","dataset.assets==='6'");p.write_text(s,encoding='utf-8')
p=r/'assets/css/game.css';s=p.read_text(encoding='utf-8');s+='\n.art-loading{position:absolute;inset:0;display:grid;place-items:center;background:#e7e7cf;font-size:16px;color:#536e57;z-index:5}.scene-panel{background:#d9e2cd}\n';p.write_text(s,encoding='utf-8')
