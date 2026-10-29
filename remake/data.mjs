// RCBS data transcribed from the user's archived eAIP, not from the former game.
// Coordinates: local EN metres, ARP origin. Ground x along true 063.39°, z south.
export const NM = 1852;
export const DEG = Math.PI / 180;
export function dms(s) {
  const n = s.slice(0, -1), degCount = /[EW]$/.test(s) ? 3 : 2;
  return (+n.slice(0, degCount) + +n.slice(degCount, degCount + 2) / 60 + +n.slice(degCount + 2) / 3600) * (/[SW]$/.test(s) ? -1 : 1);
}
const arp = { lat: dms('242544N'), lon: dms('1182140E') };
export function en(lat, lon) {
  return { x: (dms(lon) - arp.lon) * 111320 * Math.cos(arp.lat * DEG), y: (dms(lat) - arp.lat) * 111320 };
}
export const RWY = { length: 3004, width: 45, displaced: 480, heading: 63.39, lda06: 2524, lda24: 3004 };
export const ORIGIN = en('242518.70N', '1182044.40E');
const sn = Math.sin(RWY.heading * DEG), cs = Math.cos(RWY.heading * DEG);
export function toAir(x, z) { return { x: ORIGIN.x + x * sn + z * cs, y: ORIGIN.y + x * cs - z * sn }; }
export function toGround(p) { const dx = p.x - ORIGIN.x, dy = p.y - ORIGIN.y; return { x: dx * sn + dy * cs, z: dx * cs - dy * sn }; }
export function bearing(a, b) { return (Math.atan2(b.x - a.x, b.y - a.y) / DEG + 360) % 360; }
export function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
export function polar(center, nm, heading) { return { x: center.x + nm * NM * Math.sin(heading * DEG), y: center.y + nm * NM * Math.cos(heading * DEG) }; }
const fix = (name, lat, lon) => ({ name, ...en(lat, lon) });
export const FIXES = {
  ARP: { name: 'RCBS', x: 0, y: 0 },
  CUBON: fix('CUBON', '235702.40N', '1185726.39E'),
  BS001: fix('BS001', '241758.00N', '1184002.00E'),
  BS002: fix('BS002', '241738.68N', '1181634.45E'),
  INDIA: fix('INDIA', '240604.23N', '1185126.99E'),
  POSTY: fix('POSTY', '241048.70N', '1185251.30E'),
  SPICA: fix('SPICA', '241543.82N', '1182141.78E'),
  MELOG: fix('MELOG', '242401.60N', '1183039.89E'),
  SANDY: fix('SANDY', '241659.78N', '1183425.31E'),
  // AD 2.19: DME is co-located with GP, NOT the LOC antenna or ARP.
  ICKM: fix('ICKM', '242527.10N', '1182112.60E'),
  ICSY: fix('ICSY', '242554.50N', '1182210.50E'),
  BSN: fix('BSN', '242535.70N', '1182057.30E'),
};
FIXES.SKIRT = { name: 'SKIRT', ...polar(FIXES.ICKM, 9.7, 243.36) };
FIXES.FAP06 = { name: 'FAP06', ...polar(FIXES.ICKM, 4.6, 243.36) };
// ILS24 chart: final magnetic 248°, VAR 4°W -> true 244°.
FIXES.INDOK = { name: 'INDOK', ...polar(FIXES.ICSY, 7.9, 64) };
FIXES.FAP24 = { name: 'FAP24', ...polar(FIXES.ICSY, 4.2, 64) };
FIXES.AMTIK = { name: 'AMTIK', ...polar(FIXES.BSN, 9, 100) };
export const CONNECTORS = Object.fromEntries([
  ['A', '242602.11N', '1182219.17E', '242607.23N', '1182216.38E'],
  ['B', '242556.13N', '1182206.12E', '242601.24N', '1182203.31E'],
  ['C', '242545.77N', '1182143.51E', '242550.89N', '1182140.72E'],
  ['D', '242539.08N', '1182128.89E', '242544.20N', '1182126.10E'],
].map(([id, lat, lon, nl, no]) => [id, { id, ...toGround(en(lat, lon)), north: toGround(en(nl, no)) }]));
export const TWY_Z = -176;
export const GATES = [
  ['1', '242608.87N', '1182210.37E'], ['2', '242608.14N', '1182209.05E'],
  ['3', '242607.49N', '1182207.55E'], ['4', '242606.85N', '1182206.25E'],
  ['5', '242605.99N', '1182204.97E'], ['6', '242605.46N', '1182203.52E'],
  ['7', '242602.42N', '1182158.43E'], ['8', '242601.85N', '1182156.89E'],
  ['9', '242601.01N', '1182155.35E'],
].map(([id, lat, lon]) => ({ id, ...toGround(en(lat, lon)) }));
export const CHANNELS = { GND: { name: '金門地面', freq: '126.2' }, TWR: { name: '金門塔台', freq: '118.0' }, APP: { name: '高雄進近', freq: '124.6' } };
export const PERF = {
  ATR: { label: 'ATR 72-600', short: 'ATR72', length: 27.2, span: 27.1, taxi: 7, roll: 1250, takeoff: 115, landing: 112, approach: 180, climb: 175, vs: 1350, color: '#397b67' },
  JET: { label: 'A321-200', short: 'A321', length: 44.5, span: 35.8, taxi: 7, roll: 1850, takeoff: 145, landing: 137, approach: 210, climb: 230, vs: 1800, color: '#6486a5' },
};
export function sid(rwy) { return rwy === '06' ? 'CUBON 1A' : 'CUBON 1B'; }
export function star(rwy) { return rwy === '06' ? 'CUBON 1C' : 'CUBON 2D'; }
const wp = (id, alt, speed) => ({ ...FIXES[id], alt, speed });
export function starRoute(rwy) { return rwy === '06' ? [wp('CUBON', 7000, 210), wp('SPICA', 4000, 200)] : [wp('CUBON', 7000, 210), wp('POSTY', 5000, 210), wp('MELOG', 2000, 200)]; }
export function sidRoute(rwy) { return rwy === '06' ? [wp('BS001', 7000, 210), wp('INDIA', 11000, 230), wp('CUBON', 13000, 230)] : [wp('BS002', 7000, 230), wp('CUBON', 13000, 230)]; }
function arc(center, radius, from, to, alt, prefix) {
  let start = bearing(center, from), end = bearing(center, to);
  // Both charted arcs here progress clockwise: SPICA south -> SKIRT southwest,
  // MELOG east -> INDOK northeast runs counter-clockwise.
  let delta = ((end - start + 540) % 360) - 180;
  const count = Math.max(4, Math.ceil(Math.abs(delta) / 5));
  return Array.from({ length: count }, (_, i) => ({ name: `${prefix} ${i + 1}`, ...polar(center, radius, start + delta * (i + 1) / count), alt, speed: 180 }));
}
export function approachRoute(rwy, fromSandy = false) {
  if (rwy === '06') return [
    ...(fromSandy ? [wp('SPICA', 4000, 180)] : []),
    ...arc(FIXES.ICKM, 9.7, FIXES.SPICA, FIXES.SKIRT, 2300, 'ICKM 9.7D'),
    { ...wp('SKIRT', 2300, 180), stage: 'IF' }, { ...wp('FAP06', 1500, 150), stage: 'FAP' },
    { name: 'RWY06', ...toAir(480, 0), alt: 45, speed: 112, stage: 'THR' },
  ];
  return [
    ...(fromSandy ? [wp('AMTIK', 3000, 180), wp('MELOG', 2000, 180)] : []),
    ...arc(FIXES.BSN, 9, FIXES.MELOG, FIXES.INDOK, 2000, 'BSN 9.0D'),
    { ...wp('INDOK', 2000, 180), stage: 'IF' }, { ...wp('FAP24', 1400, 150), stage: 'FAP' },
    { name: 'RWY24', ...toAir(3004, 0), alt: 18, speed: 137, stage: 'THR' },
  ];
}
export const SCENARIOS = {
  morning: { name: '晨光・第一班', subtitle: 'RWY 06 · 4 架航班 · 入門', rwy: '06', wind: '050° / 12 KT', flights: [
    { id: 'B78642', kind: 'DEP', type: 'ATR', gate: '2', city: '松山', at: 0, due: 480 },
    { id: 'AE1268', kind: 'ARR', type: 'ATR', gate: '5', city: '臺中', at: 45, near: true, due: 900 },
    { id: 'AE1270', kind: 'DEP', type: 'ATR', gate: '8', city: '臺中', at: 350, due: 1080 },
    { id: 'B78651', kind: 'ARR', type: 'ATR', gate: '3', city: '松山', at: 500, due: 1800 },
  ] },
  west: { name: '海風・西向運作', subtitle: 'RWY 24 · 4 架航班 · 進階', rwy: '24', wind: '240° / 14 KT', flights: [
    { id: 'B78642', kind: 'DEP', type: 'ATR', gate: '2', city: '松山', at: 0, due: 360 },
    { id: 'AE1268', kind: 'ARR', type: 'ATR', gate: '5', city: '臺中', at: 70, near: true, due: 900 },
    { id: 'B78646', kind: 'DEP', type: 'JET', gate: '8', city: '松山', at: 380, due: 1080 },
    { id: 'B78651', kind: 'ARR', type: 'JET', gate: '3', city: '松山', at: 550, due: 1800 },
  ] },
};
export const SOURCES = [
  { title: '機場圖・跑道與滑行道配置', file: '010-Aerodrome Chart.pdf', detail: 'RWY 06/24、A/B/C/D/N、航廈／機坪、TWR 118.0／GND 126.2。' },
  { title: '滑行道中心線座標', file: '020-Appropriate TWY Center Line Points.pdf', detail: '各連接道與跑道／N 的交點，以 WGS84 換算成本機公尺座標。' },
  { title: 'CUBON 離場與座標', file: '040-CUBON 1A1B RNAV DEP.pdf', detail: '1A：600 ft → BS001 → INDIA → CUBON；1B：600 ft → BS002 → CUBON。1A 至 2,000 ft 最低梯度 6.8%；1B 至 BS002 限 250 kt。另依 050 航點表。' },
  { title: 'CUBON 進場與座標', file: '100-CUBON 1C2D RNAV ARR.pdf', detail: '1C 經 SPICA（≥4,000 ft）；2D 經 POSTY（≥5,000 ft）、MELOG（≥2,000 ft）。另依 110 航點表。' },
  { title: 'ILS RWY06', file: '120-ILS RWY06.pdf', detail: 'ICKM 9.7D 弧、SKIRT 2,300 ft、FAP 4.6D／1,500 ft；磁航向 067°；重飛通過 500 ft 後右轉 SANDY，爬升 3,000 ft。' },
  { title: 'ILS RWY24', file: '130-ILS RWY24.pdf', detail: 'BSN 9D 弧、INDOK／ICSY 7.9D 2,000 ft、FAP 4.2D／1,400 ft；本張 ILS 圖為磁航向 248°；重飛至 ICSY 2D 左轉 SANDY，爬升 3,000 ft。' },
  { title: 'eAIP RCBS AD 2', file: 'RC-AD 2 RCBS 金門KINMEN.mhtml', detail: '2.8 機位 1–9 座標；2.13：06 可用 2,524 m、位移 480 m，24 可用 3,004 m；2.19 DME 站座標；2.20：06 全長起飛於跑道頭迴轉區 180° 掉頭。' },
];
