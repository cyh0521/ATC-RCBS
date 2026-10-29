# 精緻等角手繪場景（目前版本）

本版已實際開啟並對照 RookieDay/靶場見習日.html 的預設近景。地面投影採相同 2:1 比例，預設聚焦民航機坪；全景查看完整機場。所有靜態場景以外部美術素材組合，程式只負責投影、排序、互動和資訊標示。

## 目前使用的素材

全部位於 images/isometric/：
- ground-painted.png：手繪草地、海岸、跑滑道及機坪底圖。以官方配置參考圖作 imagegen 輸入；跑道端點與寬度在組圖時依官方座標對位。
- apron-material.png：獨立混凝土材質，補上機位7–9的機坪。
- ground-markings.svg：機位7–9精確位置的獨立導引線美術檔。
- terminal.png：等角航廈、西側塔台、登機走廊、屋頂設備、窗框與細部。
- infrastructure.png：機棚、消防站、行李拖車、登機梯與服務車的透明圖集。
- scenery.png：樹叢、灌木、海岸岩石、照明柱、圍籬與安全設備的透明圖集。
- atr-directions.png、jet-directions.png：配合等角視角重新製作的四方向航機透明圖集。

圖集以來源矩形直接取用，各物件都有自己的場景座標與前後順序。未使用舊版簡易機棚方塊或程序繪製海浪。

## 程式與建置

入口 index.html、樣式 assets/css/game.css、執行程式 assets/js/game.js 相互獨立，直接本機開啟可運作。
場景原始碼：remake/world-handdrawn.mjs。
重新建置入口與執行程式：python remake/build-handdrawn.py。
目前樣式請直接修改 assets/css/game.css。舊 prepare-handdrawn.py 與 build.py 屬前一版工具，請勿用來覆寫本版樣式或入口。
瀏覽器驗證：node remake/tests/handdrawn-browser.cjs（從專案根目錄執行）。

## 本次美術製作紀錄

使用內建 imagegen；參考圖為實際靶場見習日.html 截圖 tmp/rookieday-actual.png，以及按官方座標輸出的平面定位圖 tmp/ground-plan-reference.png。
提示組：
1. 依定位圖重繪平面底圖，保留跑滑道相對位置；細描邊、米色混凝土接縫、草叢、瀝青磨耗、海岸碎石與浪花，不含建築與航機。
2. 2:1等角航廈，西側塔台、六座登機走廊，加入屋瓦接縫、通風設備、窗框、欄杆與服務門；透明背景。
3. 等角機棚／消防站／行李車／登機梯圖集，金屬接縫、捲門、輪胎、行李、反光條與燈具；透明背景。
4. 等角植栽／岩石／照明／圍籬／安全設備圖集；透明背景。
5. ATR72及A321同一架機的四個等角方向，細描邊、接縫與機窗；透明背景。
6. 獨立手繪混凝土材質，細接縫、磨痕、油漬與紙感顆粒。

建築外型、植栽分布及海岸為風格化表現，地面運動及機位仍使用 data.mjs 的官方座標。飛機為便於操作而放大，方向圖集目前仍為四方向切換。

---
以下保留上一版來源紀錄，舊頂層 images 素材目前未使用：

# 手繪場景分檔版

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
