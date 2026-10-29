from pathlib import Path
r=Path.cwd();p=r/'assets/README.md';old=p.read_text(encoding='utf-8');p.write_text('''# 精緻等角手繪場景（目前版本）

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

'''+old,encoding='utf-8')
p=r/'操作說明.md';old=p.read_text(encoding='utf-8');p.write_text('''目前畫面已更新為與「靶場見習日.html」相同的2:1等角投影，預設為民航機坪近景。右上「全景」看完整跑道；「航機」跟隨選取飛機；拖曳及滾輪可自由調整。新繪場景美術存於 assets/images/isometric/，詳細製作紀錄見 assets/README.md。

'''+old,encoding='utf-8')
p=r/'remake/prepare-handdrawn.py';s=p.read_text(encoding='utf-8-sig');s='''# LEGACY first handdrawn layout generator. Current isometric scene uses assets/images/isometric/.
# Do not run to rebuild current assets/css/game.css; edit that file directly.
'''+s;p.write_text(s,encoding='utf-8')
