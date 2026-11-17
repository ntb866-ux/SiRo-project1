// Vẽ ảnh 2D các vị trí có thể gắn cảm biến, servo và phụ kiện lên xe lắp mô-đun (nhìn từ trên, từ dưới, từ bên).
// Hình thân xe lấy thẳng từ danh mục linh kiện (linh-kien.js) nên đúng kích thước thật; các vị trí gắn là dữ liệu ở VI_TRI.
// Chạy: node scripts/xe/ve-vi-tri-gan.js [thư-mục-ra]   (cần Playwright để xuất PNG)
const fs = require('fs');
const path = require('path');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');
const H = require('../../public/san-robot-ao/xe/hinh-khoi.js');
const V = H.V, Q = H.Q;

// Màu vật liệu: lấy từ dung-hinh.js (tệp đó cần trình duyệt nên chỉ trích bảng màu)
const mauVl = (function() {
  const src = fs.readFileSync(path.join(__dirname, '../../public/san-robot-ao/xe/dung-hinh.js'), 'utf8');
  const a = src.indexOf('const VAT_LIEU = {'), b = src.indexOf('};', a);
  return new Function('return ' + src.slice(a + 'const VAT_LIEU = '.length, b + 1))();
})();

// ---------- Vị trí gắn đề xuất ----------
// nhom: màu theo loại thiết bị. co: đã có trên bảng lắp ráp (nét liền), không có = đề xuất mới (nét đứt).
// p: [x, y, z] cm trong hệ trục xe (gốc ở mặt sân dưới điểm giữa trục bánh; x phải, y lên, z ra trước)
// h: hướng nhìn/đo. xem: các hình có hiện điểm (t = từ trên, d = từ dưới, b = từ bên)
const NHOM = {
  sieuAm: ['#1f6fb5', 'Siêu âm HC-SR04'], laser: ['#0e9aa7', 'Laser ToF (đo khoảng cách)'], doLine: ['#2e9e4f', 'Dò line TCRT5000 / cảm biến màu RGB'],
  cham: ['#e67e22', 'Cảm biến chạm (tấm cản)'], nap: ['#7e57c2', 'Gyro, GPS (trên nắp mạch chủ)'], but: ['#d6336c', 'Bút vẽ'],
  servo: ['#c2255c', 'Servo'], cao: ['#6d4c41', 'LiDAR hoặc camera (bệ cao)'], phuKien: ['#546e7a', 'Còi, nút bấm'], motor: ['#455a64', 'Cổng motor phụ']
};
const VI_TRI = [
  { id: 'U1', nhom: 'sieuAm', co: 1, ten: 'Siêu âm trước (giá mũi)', p: [0, 5.6, 13.6], h: [0, 0, 1], xem: 'tb', ghi: 'Cố định, hoặc đặt trên servo S1', ob: 'ổ 3' },
  { id: 'U2', nhom: 'sieuAm', ten: 'Siêu âm bên trái', p: [-5.4, 3.0, 8.4], h: [-1, 0, 0], xem: 'tb', ghi: 'Đứng trước bánh trái; cho bài bám tường', ob: 'ổ trống' },
  { id: 'U3', nhom: 'sieuAm', ten: 'Siêu âm bên phải', p: [5.4, 3.0, 8.4], h: [1, 0, 0], xem: 'tb', ghi: 'Đứng trước bánh phải', ob: 'ổ trống' },
  { id: 'U4', nhom: 'sieuAm', ten: 'Siêu âm sau (đuôi)', p: [0, 3.2, -4.6], h: [0, 0, -1], xem: 'tb', ghi: 'Cho bài đỗ xe lùi', ob: 'ổ trống' },
  { id: 'L1', nhom: 'laser', ten: 'Laser ToF trái mũi', p: [-3.4, 5.6, 12.6], h: [0, 0, 1], xem: 'tb', ghi: 'Tia hẹp, đo vật nhỏ', ob: 'ổ trống' },
  { id: 'L2', nhom: 'laser', ten: 'Laser ToF phải mũi', p: [3.4, 5.6, 12.6], h: [0, 0, 1], xem: 'tb', ghi: 'Cặp với L1 để dóng song song với tường', ob: 'ổ trống' },
  { id: 'D1', nhom: 'doLine', co: 1, ten: 'Lỗ gầm 1 (ngoài trái)', p: [-3, 0.6, 12.35], h: [0, -1, 0], xem: 'd', ghi: 'Dò line hoặc màu RGB hoặc công tắc chạm', ob: 'ổ 1 (mạch)' },
  { id: 'D2', nhom: 'doLine', co: 1, ten: 'Lỗ gầm 2', p: [-1.5, 0.6, 12.35], h: [0, -1, 0], xem: 'd', ghi: 'như D1', ob: 'ổ 2' },
  { id: 'D3', nhom: 'doLine', co: 1, ten: 'Lỗ gầm 3 (giữa)', p: [0, 0.6, 12.35], h: [0, -1, 0], xem: 'd', ghi: 'như D1', ob: 'ổ 3' },
  { id: 'D4', nhom: 'doLine', co: 1, ten: 'Lỗ gầm 4', p: [1.5, 0.6, 12.35], h: [0, -1, 0], xem: 'd', ghi: 'như D1', ob: 'ổ 4' },
  { id: 'D5', nhom: 'doLine', co: 1, ten: 'Lỗ gầm 5 (ngoài phải)', p: [3, 0.6, 12.35], h: [0, -1, 0], xem: 'd', ghi: 'như D1', ob: 'ổ 5' },
  { id: 'D6', nhom: 'doLine', ten: 'Lỗ gầm sau trái', p: [-3, 0.6, -3.1], h: [0, -1, 0], xem: 'd', ghi: 'Dò line khi đi lùi', ob: 'ổ trống' },
  { id: 'D7', nhom: 'doLine', ten: 'Lỗ gầm sau giữa', p: [0, 0.6, -3.1], h: [0, -1, 0], xem: 'd', ghi: 'như D6', ob: 'ổ trống' },
  { id: 'D8', nhom: 'doLine', ten: 'Lỗ gầm sau phải', p: [3, 0.6, -3.1], h: [0, -1, 0], xem: 'd', ghi: 'như D6', ob: 'ổ trống' },
  { id: 'K1', nhom: 'cham', co: 1, ten: 'Tấm cản trước', p: [0, 3.2, 13.9], h: [0, 0, 1], xem: 'tb', ghi: 'Công tắc đặt trên một lỗ gầm (D1 đến D5)', ob: 'ổ như lỗ chọn' },
  { id: 'G1', nhom: 'nap', co: 1, ten: 'Chỗ trên nắp bên trái', p: [-3, 7.8, 4.0], h: [0, 1, 0], xem: 'tb', ghi: 'Gyro hoặc GPS', ob: 'ổ 6' },
  { id: 'G2', nhom: 'nap', co: 1, ten: 'Chỗ trên nắp bên phải', p: [3, 7.8, 4.25], h: [0, 1, 0], xem: 'tb', ghi: 'Gyro hoặc GPS', ob: 'ổ 8' },
  { id: 'P1', nhom: 'but', ten: 'Bút vẽ ở tâm quay', p: [0, 1.0, 0], h: [0, -1, 0], xem: 'dtb', ghi: 'Nét vẽ đi qua đúng tâm xe, hình vuông và tam giác ra đúng cạnh', ob: 'không cần ổ' },
  { id: 'P2', nhom: 'but', ten: 'Bút vẽ phía sau', p: [0, 1.0, -3.0], h: [0, -1, 0], xem: 'dtb', ghi: 'Nét vẽ nằm sau xe như xe rùa', ob: 'không cần ổ' },
  { id: 'S1', nhom: 'servo', ten: 'Servo xoay siêu âm (radar quét)', p: [0, 4.3, 11.4], h: [0, 1, 0], xem: 'tb', ghi: 'Thay giá cố định của U1; quét ±90°', ob: 'cổng motor C', lech: { t: [-26, 0], b: [0, 36] } },
  { id: 'S2', nhom: 'servo', ten: 'Servo tay gắp', p: [0, 8.2, 5.6], h: [0, 0, 1], xem: 'tb', ghi: 'Gắn trên nắp, càng vươn ra trước qua giá siêu âm', ob: 'cổng motor D' },
  { id: 'T1', nhom: 'cao', ten: 'Bệ cao giữa nắp', p: [0, 7.0, 2.2], h: [0, 1, 0], xem: 'tb', ghi: 'LiDAR quay 360° hoặc camera; cao hơn mọi thứ để không bị che', ob: 'ổ trống' },
  { id: 'Z1', nhom: 'phuKien', ten: 'Còi', p: [-3.4, 3.4, -4.4], h: [0, 0, -1], xem: 'tb', ghi: 'Phát tiếng cho khối "kêu bíp"', ob: 'không cần ổ' },
  { id: 'Z2', nhom: 'phuKien', ten: 'Nút bấm', p: [3.4, 3.4, -4.4], h: [0, 0, -1], xem: 'tb', ghi: 'Nút bắt đầu chạy trên xe', ob: 'không cần ổ' },
  { id: 'M3', nhom: 'motor', ten: 'Cổng motor C', p: [-1.5, 6.5, -0.45], h: [0, 0, -1], xem: 'tb', ghi: 'Cho S1 hoặc bánh thứ 3', ob: 'cổng motor' },
  { id: 'M4', nhom: 'motor', ten: 'Cổng motor D', p: [1.5, 6.5, -0.45], h: [0, 0, -1], xem: 'tb', ghi: 'Cho S2 hoặc bánh thứ 4', ob: 'cổng motor' },
];

// ---------- Hình thân xe ----------
const banLap = L.lapXe({});
L.tinhXe(banLap);
function diemKhoi(k, goc) {
  goc = goc || [0, 0, 0];
  const ra = (p) => V.cong(goc, V.cong(k.vt, Q.quay(k.q, p)));
  let ds = [];
  if (k.k == 'hop') { for (let i = 0; i < 8; i++) ds.push(ra([(i & 1 ? 1 : -1) * k.kt[0] / 2, (i & 2 ? 1 : -1) * k.kt[1] / 2, (i & 4 ? 1 : -1) * k.kt[2] / 2])); }
  else if (k.k == 'tru') { for (let s of [-1, 1]) for (let j = 0; j < 28; j++) { let a = 2 * Math.PI * j / 28; ds.push(ra([k.d / 2 * Math.cos(a), s * k.h / 2, k.d / 2 * Math.sin(a)])); } }
  else if (k.k == 'cau') { for (let a = 0; a < 3; a++) for (let j = 0; j < 24; j++) { let t = 2 * Math.PI * j / 24, c = Math.cos(t) * k.d / 2, s = Math.sin(t) * k.d / 2; ds.push(ra(a == 0 ? [c, s, 0] : a == 1 ? [c, 0, s] : [0, c, s])); } }
  else if (k.k == 'lang') ds = k.dinh.map(ra);
  return ds;
}
const vatThe = [];
function them(ds, vl, ten) { if (ds.length) vatThe.push({ ds: ds, vl: vl, ten: ten }); }
banLap.than.forEach(function(ct) {
  if (ct.nhom == 'day') return;                       // bỏ dây RJ25 cho ảnh gọn
  ct.khoi.forEach((k) => { if (!k.trong) them(diemKhoi(k), k.vl, ct.id); });
});
banLap.banh.forEach((b) => b.khoi.forEach((k) => { if (!k.trong) them(diemKhoi(k, b.tam), k.vl, 'banh'); }));
them(diemKhoi(H.chuanHoa({ k: 'cau', d: banLap.bi.d, vt: banLap.bi.tam, vl: 'thep' })), 'thep', 'bi');
banLap.canGat.khoi.forEach((k) => them(diemKhoi(k, banLap.canGat.tam), k.vl, 'tamCan'));

// ---------- Phép chiếu ----------
const S = 29;     // px mỗi cm
const VIEW = {
  t: { ten: 'Nhìn từ trên xuống', u: (p) => p[0], v: (p) => -p[2], sx: (a, b) => a.cao - b.cao, cao: (ds) => Math.max(...ds.map((p) => p[1])), rongCm: [-7.8, 7.8], daiCm: [-17.6, 8.2] },
  d: { ten: 'Nhìn từ dưới lên (trái xe vẫn ở bên trái ảnh)', u: (p) => p[0], v: (p) => -p[2], sx: (a, b) => b.cao - a.cao, cao: (ds) => Math.min(...ds.map((p) => p[1])), rongCm: [-7.8, 7.8], daiCm: [-17.6, 8.2] },
  b: { ten: 'Nhìn từ bên trái xe (mũi xe bên phải ảnh)', u: (p) => p[2], v: (p) => -p[1], sx: (a, b) => b.cao - a.cao, cao: (ds) => Math.min(...ds.map((p) => p[0])), rongCm: [-8.4, 17.6], daiCm: [-11.8, 0.8] }
};
function hull(pts) {
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  let lo = [], up = [];
  for (let p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 1e-9) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { let p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 1e-9) up.pop(); up.push(p); }
  lo.pop(); up.pop();
  return lo.concat(up);
}
const f = (x) => Math.round(x * 10) / 10;

function veHinh(ma) {
  const vw = VIEW[ma];
  const X = (p) => f((vw.u(p) - vw.rongCm[0]) * S), Y = (p) => f((vw.v(p) - vw.daiCm[0]) * S);
  const W = f((vw.rongCm[1] - vw.rongCm[0]) * S), Hh = f((vw.daiCm[1] - vw.daiCm[0]) * S);
  let s = '<svg class="hinh" width="' + W + '" height="' + Hh + '" viewBox="0 0 ' + W + ' ' + Hh + '">';
  // lưới 5 cm làm thước
  const lo = (a) => Math.ceil(a / 5) * 5;
  for (let x = lo(vw.rongCm[0]); x <= vw.rongCm[1]; x += 5) s += '<line class="luoi" x1="' + f((x - vw.rongCm[0]) * S) + '" y1="0" x2="' + f((x - vw.rongCm[0]) * S) + '" y2="' + Hh + '"/>';
  for (let y = lo(vw.daiCm[0]); y <= vw.daiCm[1]; y += 5) s += '<line class="luoi" x1="0" y1="' + f((y - vw.daiCm[0]) * S) + '" x2="' + W + '" y2="' + f((y - vw.daiCm[0]) * S) + '"/>';
  if (ma == 'b') s += '<line class="san" x1="0" y1="' + f((0 - vw.daiCm[0]) * S) + '" x2="' + W + '" y2="' + f((0 - vw.daiCm[0]) * S) + '"/>';
  let ds = vatThe.map((v) => ({ v: v, cao: vw.cao(v.ds) })).sort(vw.sx);
  for (let o of ds) {
    let h = hull(o.v.ds.map((p) => [vw.u(p), vw.v(p)]));
    if (h.length < 3) continue;
    let mau = (mauVl[o.v.vl] || { mau: '#888' }).mau;
    s += '<polygon points="' + h.map((p) => f((p[0] - vw.rongCm[0]) * S) + ',' + f((p[1] - vw.daiCm[0]) * S)).join(' ') + '" fill="' + mau + '" stroke="rgba(15,23,42,.45)" stroke-width="0.6"' + (o.v.vl == 'nap_mach' ? ' fill-opacity=".75"' : '') + '/>';
  }
  // vị trí gắn: mũi tên hướng, rồi chấm số
  for (let t of VI_TRI) {
    if (t.xem.indexOf(ma) < 0) continue;
    let mau = NHOM[t.nhom][0], x = X(t.p), y = Y(t.p);
    let d = [vw.u(t.h), vw.v(t.h)];
    let dai = Math.hypot(d[0], d[1]);
    let lech = (t.lech && t.lech[ma]) || [0, 0];
    if (dai > 0.01) {
      let ux = d[0] / dai, uy = d[1] / dai;
      if (t.nhom == 'sieuAm' || t.nhom == 'laser') {   // chùm tia
        let L1 = t.nhom == 'sieuAm' ? 70 : 60, ang = (t.nhom == 'sieuAm' ? 15 : 4) * Math.PI / 180 / 1;
        let rot = (a) => [ux * Math.cos(a) - uy * Math.sin(a), ux * Math.sin(a) + uy * Math.cos(a)];
        let a = rot(ang), b = rot(-ang);
        s += '<polygon points="' + x + ',' + y + ' ' + f(x + a[0] * L1) + ',' + f(y + a[1] * L1) + ' ' + f(x + b[0] * L1) + ',' + f(y + b[1] * L1) + '" fill="' + mau + '" fill-opacity=".16" stroke="' + mau + '" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3 3"/>';
      } else {
        s += '<line x1="' + x + '" y1="' + y + '" x2="' + f(x + ux * 24) + '" y2="' + f(y + uy * 24) + '" stroke="' + mau + '" stroke-width="2.2" marker-end="url(#mui-' + t.nhom + ')"/>';
      }
    }
    s += '<g transform="translate(' + f(x + lech[0]) + ' ' + f(y + lech[1]) + ')"><circle r="11" fill="' + (t.co ? mau : '#fff') + '" stroke="' + mau + '" stroke-width="2"' + (t.co ? '' : ' stroke-dasharray="3.2 2.4"') + '/><text y="3.9" text-anchor="middle" class="so" fill="' + (t.co ? '#fff' : mau) + '">' + t.id + '</text></g>';
  }
  // thước 5 cm
  s += '<g class="thuoc" transform="translate(10 ' + (Hh - 12) + ')"><line x1="0" y1="0" x2="' + 5 * S + '" y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/><line x1="' + 5 * S + '" y1="-4" x2="' + 5 * S + '" y2="4"/><text x="' + 2.5 * S + '" y="-6" text-anchor="middle">5 cm</text></g>';
  // nhãn hướng
  if (ma == 'b') s += '<text class="huong" x="' + (W - 10) + '" y="16" text-anchor="end">Mũi xe →</text>';
  else s += '<text class="huong" x="' + (W / 2) + '" y="16" text-anchor="middle">▲ Mũi xe</text>';
  return '<div class="khung"><h3>' + vw.ten + '</h3>' + s + '</svg></div>';
}

const mui = Object.keys(NHOM).map((n) => '<marker id="mui-' + n + '" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="' + NHOM[n][0] + '"/></marker>').join('');
const hang = VI_TRI.map(function(t) {
  return '<tr class="' + (t.co ? 'co' : 'moi') + '"><td><span class="chip" style="--m:' + NHOM[t.nhom][0] + '" data-co="' + (t.co ? 1 : 0) + '">' + t.id + '</span></td><td>' + t.ten + '</td><td class="vt">' + t.p[0] + ' ; ' + t.p[2] + ' ; ' + t.p[1] + '</td><td>' + t.ob + '</td><td class="gc">' + t.ghi + '</td></tr>';
}).join('');
const chuThich = Object.keys(NHOM).map((n) => '<span class="ct"><i style="background:' + NHOM[n][0] + '"></i>' + NHOM[n][1] + '</span>').join('');
const html = '<!doctype html><html lang="vi"><meta charset="utf-8"><style>' +
  'body{margin:0;background:#f4f6f9;color:#1f2937;font:13px/1.35 "Segoe UI",Roboto,Arial,sans-serif}' +
  '.trang{width:1740px;padding:20px 24px 24px;box-sizing:border-box}' +
  'h1{font-size:22px;margin:0 0 2px}.phu{color:#5b6472;margin:0 0 12px}' +
  '.luoi-trang{display:grid;grid-template-columns:auto auto auto;gap:16px;align-items:start}' +
  '.khung{background:#fff;border:1px solid #d6dbe3;border-radius:10px;padding:8px 10px 10px}.khung h3{margin:0 0 6px;font-size:13.5px}' +
  '.hinh{display:block;background:#eef1f5;border-radius:6px}.luoi{stroke:#d3d9e2;stroke-width:.7}.san{stroke:#6b7280;stroke-width:1.4}.thuoc line{stroke:#334155;stroke-width:1.4}.thuoc text{font-size:11px;fill:#334155}' +
  '.so{font-size:10.5px;font-weight:700;font-family:inherit}.huong{font-size:12px;fill:#475569;font-weight:600}' +
  '.cot{display:flex;flex-direction:column;gap:12px}.hang-chu-thich{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 10px;font-size:12.5px}.ct i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}' +
  '.quy{font-size:12.5px;color:#475569;margin:0 0 8px}.quy b{color:#1f2937}' +
  'table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #d6dbe3;border-radius:10px;overflow:hidden}th{background:#e8ecf2;text-align:left;font-size:12px;padding:5px 7px}td{padding:3px 7px;border-top:1px solid #edf0f4;vertical-align:top;font-size:12.3px}' +
  '.chip{display:inline-block;min-width:26px;text-align:center;font-weight:700;font-size:11.5px;border:2px solid var(--m);color:var(--m);background:#fff;border-radius:12px;padding:0 5px}.chip[data-co="1"]{background:var(--m);color:#fff}' +
  '.vt{white-space:nowrap;font-variant-numeric:tabular-nums}.gc{color:#475569}' +
  '</style><div class="trang"><h1>Vị trí gắn cảm biến, servo và phụ kiện trên xe lắp mô-đun</h1>' +
  '<p class="phu">Hình xe vẽ từ danh mục linh kiện thật. Chấm đặc: đã có trên bảng lắp ráp. Chấm viền đứt: đề xuất mới, chờ duyệt. Vùng tô mờ hình quạt là hướng đo.</p>' +
  '<div class="hang-chu-thich">' + chuThich + '</div>' +
  '<svg width="0" height="0" style="position:absolute"><defs>' + mui + '</defs></svg><div class="luoi-trang">' + veHinh('t') + veHinh('d') +
  '<div class="cot">' + veHinh('b') +
  '<div class="quy"><b>Tọa độ (x ; z ; độ cao, cm):</b> gốc ở mặt sân ngay dưới điểm giữa trục hai bánh, x sang phải, z ra phía mũi.<br><b>Mạch chủ có 8 ổ RJ25.</b> Gắn thêm thiết bị khi đã hết ổ thì bảng sẽ báo hết ổ. Còi, nút bấm, bút không cần ổ.</div></div></div>' +
  '<table style="margin-top:14px"><tr><th>Mã</th><th>Thiết bị</th><th>Vị trí x ; z ; cao</th><th>Cắm vào</th><th>Ghi chú</th></tr>' + hang + '</table></div></html>';
const ra = process.argv[2] || path.join(process.cwd(), 'vi-tri-gan');
fs.mkdirSync(ra, { recursive: true });
fs.writeFileSync(path.join(ra, 'vi-tri-lap-dat.html'), html);
(async () => {
  const { chromium } = require('playwright');
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1740, height: 900 }, deviceScaleFactor: 2 });
  await pg.setContent(html);
  await pg.screenshot({ path: path.join(ra, 'vi-tri-lap-dat.png'), fullPage: true });
  await br.close();
  console.log('xong', ra);
})();
