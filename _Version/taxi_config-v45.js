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
    name: '金門尚義機場',
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
  // 跑道等待點
  // ══════════════════════════════════════
  holdpoints: {
    rwy06: {
      // 使用 TWY D 連接道，等待跑道 06 起飛
      connector: 'D',
      label: 'H-D',
      // x/y 由程式從 connectors.D.x 和 airport.twy_n_y 自動計算
    },
    rwy24: {
      // 使用 TWY A 連接道，等待跑道 24 起飛
      connector: 'A',
      label: 'H-A',
    },
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
  // 滑行路線節點
  // 每條路線是一串 waypoint，程式依序跟隨
  // isPushback: true  → 後推階段（機頭鎖定朝北，向後推行）
  // isPushback: false → 正常滑行（機頭朝向下一個節點）
  // spd_mps：該段建議速度（公尺/秒）
  //   後推約 1.5 m/s（3kt），滑行約 5 m/s（10kt）
  //
  // 注意：x 為起點（機位），其餘節點由程式根據
  //       gate.x 和 connector 自動插值，
  //       此處列出的是「固定節點」，可手動覆蓋。
  // ══════════════════════════════════════
  taxi_routes: {

    // 後推：所有機位統一後推至 TWY N（y=388），x 與機位相同
    // 程式會自動用 gate.x 插入，此段不需手動設定
    // （若特定機位需要側推或轉角後推，可在 gate 裡加 pushback_override）

    // ── 前往 RWY06（向西滑至 TWY D，等待點 H-D）──
    to_rwy06: [
      // ① 沿 TWY N 向西滑行到 TWY D 連接道
      { ref: 'connector_D_twyn',  spd_mps: 5 },
      // ② 沿 TWY D 向南進入跑道等待點
      { ref: 'connector_D_rwy',   spd_mps: 3 },
    ],

    // ── 前往 RWY24（向東滑至 TWY A，等待點 H-A）──
    to_rwy24: [
      // ① 沿 TWY N 向東滑行到 TWY A 連接道
      { ref: 'connector_A_twyn',  spd_mps: 5 },
      // ② 沿 TWY A 向南進入跑道等待點
      { ref: 'connector_A_rwy',   spd_mps: 3 },
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
      destination: '臺中',
      dep_time:    '08:25',
      fl:          200,
      wait_timer:  4,
    },
  ],

};
// ── 結束 TAXI_CONFIG ──
