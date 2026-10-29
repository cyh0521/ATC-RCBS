from pathlib import Path
r=Path.cwd();p=r/'remake/build-handdrawn.py';s=p.read_text(encoding='utf-8').replace("['hold','原地等待']","['stop','原地等待']");p.write_text(s,encoding='utf-8')
(r/'assets/README.md').write_text('''# 手繪場景分檔版

直接以 Edge 或 Chrome 開啟專案根目錄 index.html。請一起保留 assets 資料夾；不需要伺服器或網路。

- images/terminal.png：手繪航廈與西側塔台，獨立透明素材。
- images/atr-directions.png：ATR72 四方向透明圖集，程式依機頭方向取用各區。
- images/jet-directions.png：A321 四方向透明圖集。
- images/tree.png：沿用同一使用者 RookieDay 專案的手繪樹木素材。
- images/airport-ground.svg：依官方公尺座標製作的可編輯場景底圖。
- css/game.css：獨立介面樣式。
- js/game.js：可直接從本機開啟的遊戲程式，來源為 remake 內模組。

## 修改與建置

修改 remake/data.mjs、sim.mjs、app.mjs、world-handdrawn.mjs。
執行 python remake/prepare-handdrawn.py 產生底圖與樣式；該工具使用 tmp/gates.json，座標來自 data.mjs 的 GATES。
執行 python remake/build-handdrawn.py 產生 index.html 與 assets/js/game.js。請勿用舊 build.py 覆寫入口；舊工具是單檔 3D 版。

## 配置依據

_Data/010-Aerodrome Chart.pdf：3004 × 45 m 跑道、480 m 位移入口、北側 N、D/C/B/A 連接道、民航機位 1–9、軍用機坪及航廈／塔台相對位置。
_Data/020-Appropriate TWY Center Line Points.pdf：滑行道座標。
_UI/airport/airport_view.jpg：機坪、海岸與建築群的視覺位置對照；此圖不是精確測繪，與官方座標衝突時採官方圖。
金門航空站主要設施：https://www.kma.gov.tw/DefPage/index.aspx?MenuID=469&Print=1
另搜尋金門日報、中央社與金門航空站停機坪照片作外觀參考；沒有下載或嵌入其照片。

## 美術生成紀錄

使用內建 imagegen，非 CLI。風格參考為使用者核可的小樣；透明素材各自保存。
航廈提示：手繪細橄欖線、米色低矮長航廈、六座登機走廊、藍綠窗、固定俯視角、透明背景；後續將塔台移至航廈西側。
ATR 提示：同一架綠白 ATR72，四方向 2×2 圖集，高翼、雙螺旋槳、T 尾翼、起落架放下、透明背景、無商標。
噴射機提示：同風格 A321 四方向圖集，低翼雙噴射引擎、透明背景、無商標。

## 本版範圍

這是介面與場景第一版。底圖配置依封存航圖，建築外型與地景為手繪簡化；飛機圖示放大以方便點選，四方向切換尚非連續轉向動畫。空中飛行顯示於雷達。海岸線、建築輪廓與植栽不作精確測量。全景可查看完整跑道；預設機坪視角著重 D 至 A 與民航機坪，可拖曳縮放。
''',encoding='utf-8')
p=r/'操作說明.md';old=p.read_text(encoding='utf-8');p.write_text('''# 手繪分檔版（目前入口）

直接開啟根目錄 index.html，旁邊 assets 資料夾需保留。
點「開始」讓時間運行；點航班管制條或飛機選取航班，再按底部可用指令。灰色指令代表目前階段不適用；滑鼠停留可查看原因。
拖曳平移、滾輪縮放；右上「全景／機坪／航機」切換視角。空白鍵暫停，問號可查流程與資料依據。

美術圖片、CSS、JS 已分檔，詳細結構及限制見 assets/README.md。以下保留原有流程說明。

---

'''+old,encoding='utf-8')
