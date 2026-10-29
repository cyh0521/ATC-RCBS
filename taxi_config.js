// ╔══════════════════════════════════════════════════════════════╗
// ║  taxi_config.js  —  RCBS 金門尚義機場 · 地面動線設定          ║
// ║  修改此檔案後重新整理瀏覽器即可生效，不需動遊戲程式碼           ║
// ╚══════════════════════════════════════════════════════════════╝

const TAXI_CONFIG = {

  // ══════════════════════════════════════
  // 機場基本參數（對應 airport_view.jpg 像素座標）
  // ══════════════════════════════════════
  airport: {
    icao: 'RCBS',
    name: '金門尚義',
    // 跑道中心線 y 座標（像素）
    rwy_y: 614,
    // TWY N 平行滑行道 y 座標（像素）
    twy_n_y: 388,
    // 比例尺
    px_per_m: 1.2817,
  },

  // ══════════════════════════════════════
  // 滑行道連接道 x 座標（像素）
  // 用於計算滑行道名稱對應位置
  // ══════════════════════════════════════
  connectors: {
    A: { x: 2491, name: 'TWY A' },  // 最東，靠近 RWY24
    B: { x: 1967, name: 'TWY B' },
    C: { x: 1053, name: 'TWY C' },
    D: { x:  464, name: 'TWY D' },  // 最西，靠近 DTHR06
  },

  // ══════════════════════════════════════
  // 跑道等待點（TWY N 上的停止位置）
  // connector：對應 connectors 裡的鍵值
  // label：顯示名稱
  // ══════════════════════════════════════
  holdpoints: {
    // ── RWY06 起飛可用等待點（玩家二選一）──
    'H-D': { connector: 'D', label: 'H-D', rwy: '06',
              note: 'TWY D，較靠跑道西端，起飛滑跑距離最長' },
    'H-C': { connector: 'C', label: 'H-C', rwy: '06',
              note: 'TWY C，跑道中段，起飛滑跑距離較短' },
    // ── RWY24 起飛可用等待點（玩家二選一）──
    'H-A': { connector: 'A', label: 'H-A', rwy: '24',
              note: 'TWY A，緊鄰 THR24，直接進跑道轉向西' },
    'H-B': { connector: 'B', label: 'H-B', rwy: '24',
              note: 'TWY B，需滑至 THR24 才轉頭向西' },
  },

  // ══════════════════════════════════════
  // 機位定義
  // x, y：圖片像素座標（機頭停止點）
  // cat：COM = 民航，MIL = 軍用
  // pushback_heading：後推完成後機頭朝向（度，0=正北）
  //   後推過程中機頭固定朝北，到達 TWY N 後轉為此方向
  // ══════════════════════════════════════
  gates: {
    // ── 民航機坪（北側，近航廈）──
    'N1': { x: 2331, y: 242, cat: 'COM', pushback_heading: 0 },
    'N2': { x: 2275, y: 244, cat: 'COM', pushback_heading: 0 },
    'N3': { x: 2219, y: 247, cat: 'COM', pushback_heading: 0 },
    'N4': { x: 2164, y: 251, cat: 'COM', pushback_heading: 0 },
    'N5': { x: 2108, y: 252, cat: 'COM', pushback_heading: 0 },
    'N6': { x: 2052, y: 254, cat: 'COM', pushback_heading: 0 },
    'N7': { x: 1834, y: 273, cat: 'COM', pushback_heading: 0 },
    'N8': { x: 1769, y: 276, cat: 'COM', pushback_heading: 0 },
    'N9': { x: 1705, y: 277, cat: 'COM', pushback_heading: 0 },
    // ── 軍用機坪（中段）──
    'M1': { x: 1496, y: 276, cat: 'MIL', pushback_heading: 0 },
    'M2': { x: 1417, y: 278, cat: 'MIL', pushback_heading: 0 },
    'M3': { x: 1341, y: 279, cat: 'MIL', pushback_heading: 0 },
  },

  // ══════════════════════════════════════
  // 滑行路線
  // 後推到 TWY N 後停下等「繼續滑行」，再依目標等待點滑行
  // spd_mps：建議速度（公尺/秒）
  //   後推約 1.5 m/s，TWY N 滑行約 5 m/s，連接道約 3 m/s
  // ══════════════════════════════════════
  taxi_routes: {

    // ── 後推段：所有機位統一後推至 TWY N ──
    // x 座標由程式自動取 gate.x，不需設定
    pushback: { spd_mps: 1.5 },

    // ── RWY06 等待點路線 ──
    // 後推到 TWY N 停下後，玩家選擇 H-C 或 H-D

    // 從 TWY N 滑至 H-D（TWY D 連接道北端）
    'to_H-D': [
      // ① TWY N 向西滑至 TWY D 連接道
      { ref: 'connector_D_twyn', spd_mps: 5 },
      // ② TWY D 連接道向南至跑道入口（H-D 等待點即在此）
      // 程式在到達此點後停下，等玩家選起飛/等待
    ],

    // 從 TWY N 滑至 H-C（TWY C 連接道北端）
    'to_H-C': [
      { ref: 'connector_C_twyn', spd_mps: 5 },
    ],

    // ── RWY24 等待點路線 ──

    // 從 TWY N 滑至 H-A（TWY A 連接道北端，鄰 THR24）
    'to_H-A': [
      { ref: 'connector_A_twyn', spd_mps: 5 },
    ],

    // 從 TWY N 滑至 H-B（TWY B 連接道北端）
    'to_H-B': [
      { ref: 'connector_B_twyn', spd_mps: 5 },
    ],

    // ── 從等待點進跑道起飛 ──
    // H-D → DTHR → 360° 迴轉後向東起飛
    'H-D_to_rwy06': [
      { ref: 'connector_D_rwy', spd_mps: 3 },  // 沿 TWY D 進跑道
      { ref: 'dthr06',          spd_mps: 3 },  // 向西滑至 DTHR
      // 程式在此執行 360° 迴轉（TURNING_06 狀態）
    ],

    // H-C → 跑道中段 → 向西滑至 DTHR → 360° 迴轉後向東起飛
    'H-C_to_rwy06': [
      { ref: 'connector_C_rwy', spd_mps: 3 },  // 沿 TWY C 進跑道
      { ref: 'dthr06',          spd_mps: 4 },  // 向西滑至 DTHR
    ],

    // H-A → TWY A → 直接進跑道 → 180° 轉頭向西起飛
    'H-A_to_rwy24': [
      { ref: 'connector_A_rwy', spd_mps: 3 },  // 沿 TWY A 進跑道
      // 程式在此執行 180° 轉頭（TURNING_24 狀態）
    ],

    // H-B → TWY B → 滑至 THR24 → 180° 轉頭向西起飛
    'H-B_to_rwy24': [
      { ref: 'connector_B_rwy', spd_mps: 3 },  // 沿 TWY B 進跑道
      { ref: 'thr24',           spd_mps: 3 },  // 向東滑至 THR24
      // 程式在此執行 180° 轉頭（TURNING_24 狀態）
    ],
  },

  // ══════════════════════════════════════
  // 通話席位對應表
  // 定義每個管制階段由哪個席位發話、使用哪個頻率
  // atc_seat：ATC 發話席位（顯示在通話記錄左側色塊）
  // freq：該席位頻率（僅供顯示用）
  // transfer_freq：完成後飛行員需聯繫的下一個頻率（若有）
  // ══════════════════════════════════════
  comms: {
    // ── 離場流程 ──
    clearance: {
      atc_seat: 'GND',   // 金門無獨立DEL席，由GND兼辦
      freq: '126.2',
    },
    pushback: {
      atc_seat: 'GND',
      freq: '126.2',
    },
    taxi: {
      atc_seat: 'GND',
      freq: '126.2',
    },
    lineup: {
      atc_seat: 'TWR',
      freq: '118.0',
    },
    takeoff: {
      atc_seat: 'TWR',
      freq: '118.0',
    },
    handoff_to_departure: {
      atc_seat: 'TWR',
      freq: '118.0',
      transfer_to_seat: 'APP',
      transfer_freq: '124.6',
      transfer_name: '高雄進近',
    },

    // ── 進場流程 ──
    approach: {
      atc_seat: 'APP',
      freq: '124.6',
    },
    ils_clearance: {
      atc_seat: 'APP',
      freq: '124.6',
    },
    landing: {
      atc_seat: 'TWR',
      freq: '118.0',
    },
    vacate: {
      atc_seat: 'TWR',
      freq: '118.0',
      transfer_to_seat: 'GND',
      transfer_freq: '126.2',
      transfer_name: '地面',
    },
    handoff_to_acc: {
      // 離場後由 APP 移交台北 ACC
      atc_seat: 'APP',
      freq: '124.6',
      transfer_name: '台北管制',
    },

    // ── ATIS ──
    atis: {
      atc_seat: 'ATIS',
      freq: '127.2',
    },
  },

  // ══════════════════════════════════════
  // 初始場景（遊戲開始時的飛機配置）
  // 修改這裡來改變遊戲開局場景
  // ══════════════════════════════════════
  initial_aircraft: [
    {
      callsign:    'B78642',
      airline:     '立榮航空',
      type:        'ATR 72-600',
      cat:         'COM',
      gate:        'N2',
      destination: '松山',
      dep_time:    '08:10',
      fl:          180,
      wait_timer:  10,     // 幾秒後飛行員主動呼叫（遊戲秒）
    },
    {
      callsign:    'Air Force 1352',
      airline:     '中華民國空軍',
      type:        'C-130H',
      cat:         'MIL',
      gate:        'M2',
      destination: '屏東',
      dep_time:    '08:25',
      fl:          200,
      wait_timer:  4,
    },
  ],

};
// ── 結束 TAXI_CONFIG ──
