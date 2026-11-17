// Sân Robot Ảo – xe lắp mô-đun: danh mục linh kiện và cách lắp thành xe.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Xe 2 bánh kiểu xe kit bán lẻ (khung nhôm chữ U, motor TT, mạch chủ có nắp, mô-đun
// cắm dây RJ25). Hình dáng tự thiết kế, không sao chép sản phẩm thương mại nào.
//
// Mỗi chi tiết là một nhóm KHỐI ĐẶC (xem hinh-khoi.js). Từ cùng bản mô tả này sinh ra
// lưới 3D, hitbox và khối lượng, nên ba thứ luôn khớp nhau. "trangTri" là hoạ tiết
// chỉ để nhìn, nằm sát mặt khối (không lệch quá 1 mm) nên không cần hitbox riêng.
//
// Đơn vị: cm, gam. Hệ trục xe: gốc ở MẶT SÂN ngay dưới điểm giữa trục hai bánh
// (tâm quay của xe), x sang phải, y lên trên, z về phía trước.
//
// Nguồn số đo (kích thước danh định của linh kiện phổ biến):
//   - Motor TT 1:48: hộp số 37 × 22,5 × 19 mm, thân motor Ø20 × 27 mm, trục ra 5,4 mm; 6 V: không tải
//     khoảng 200 vòng/phút, mô-men kẹt khoảng 0,8 kgf·cm, nặng khoảng 29 g.
//   - HC-SR04: mạch 45 × 20 mm, hai đầu phát/thu Ø16 × 12 mm cách nhau 26 mm, tầm 2–400 cm, góc đo 15°.
//   - TCRT5000: thân 10,2 × 5,8 × 7 mm, khoảng cách làm việc tốt nhất 2,5 mm, bước sóng 950 nm.
//   - Công tắc hành trình KW11: 20 × 10 × 6,4 mm, lực tác động khoảng 0,5 N.
//   - Ổ RJ25 (6P6C): khoảng 15 × 13 × 19 mm; dây dẹt 6 lõi khoảng 6 × 2,5 mm.
//   - Pin 18650: Ø18 × 65 mm, khoảng 46 g mỗi viên.
(function(goc, tao) {
  if (typeof module == 'object' && module.exports) module.exports = tao(require('./hinh-khoi.js'));
  else goc.SRALinhKien = tao(goc.SRAHinhKhoi);
})(typeof self != 'undefined' ? self : this, function(H) {
  'use strict';
  const V = H.V, Q = H.Q;
  const PI = Math.PI;

  // ---------- Thông số chung ----------
  const TS = {
    chuViBanh: 20,                 // cm; đường kính 6,366 cm (bánh xe kit 65 mm)
    rongBanh: 1.8,
    boLop: 0.85,           // bán kính bo mép lốp (cm): mặt cắt lốp gần như nửa hình tròn
    xBanh: 5.7,                    // tâm bánh cách trục dọc xe (khoảng cách hai bánh 11,4 cm)
    zBi: 10.5,                     // bi tự do ở phía trước
    dBi: 1.6,
    dayKhung: 0.2,                 // tôn nhôm 2 mm
    yDay: 1.8,                     // mặt dưới tấm đáy cách sân 1,8 cm
    // Khối lượng riêng (g/cm³)
    nhom: 2.70, thep: 7.85, dongThau: 8.5, abs: 1.05, caoSu: 1.15
  };
  TS.dBanh = TS.chuViBanh / PI;
  TS.rBanh = TS.dBanh / 2;

  // Motor TT 1:48 ở 6 V (thông số tại trục ra, sau hộp số)
  const DONG_CO = {
    ten: 'Motor TT 1:48',
    dienAp: 6,
    tocDoKhongTai: 200 / 60 * 360,          // độ/giây (200 vòng/phút)
    momenKet: 0.8 * 0.0980665 * 1e7,        // g·cm²/s² (0,8 kgf·cm = 0,0785 N·m)
    momenMaSat: 0.06 * 0.0980665 * 1e7,     // ma sát hộp số khi không cấp điện (0,06 kgf·cm)
    tiSoTruyen: 48,
    quanTinhRoto: 1.3,                      // g·cm² của rôto; quy về trục ra nhân với tỉ số truyền bình phương
    tocDoLenhToiDa: 800                     // độ/giây ứng với lệnh 100 % (giữ quy ước của GEARS)
  };

  // ---------- Hàm viết gọn ----------
  const hop = (kt, vt, vl, them) => Object.assign({ k: 'hop', kt: kt, vt: vt, vl: vl }, them);
  const tru = (d, h, truc, vt, vl, them) => Object.assign({ k: 'tru', d: d, h: h, truc: truc, vt: vt, vl: vl }, them);
  const cau = (d, vt, vl, them) => Object.assign({ k: 'cau', d: d, vt: vt, vl: vl }, them);
  const lang = (da, h, truc, vt, vl, them) => Object.assign({ k: 'lang', da: da, h: h, truc: truc, vt: vt, vl: vl }, them);
  function lucGiac(d) {   // đa giác 6 cạnh, d = khoảng cách hai cạnh đối
    let r = d / Math.sqrt(3), ds = [];
    for (let i = 0; i < 6; i++) ds.push([r * Math.cos(PI / 3 * i), r * Math.sin(PI / 3 * i)]);
    return ds;
  }
  const KT_O = [1.5, 1.3, 1.9];   // ổ RJ25: rộng, cao, sâu (miệng ổ ở mặt vuông góc với chiều sâu)

  // Ổ RJ25. huong: 'sau' (miệng quay về -z), 'len' (miệng quay lên)
  function oRJ25(tam, huong, so) {
    let k, mieng, phap, len;
    if (huong == 'len') {
      k = hop([KT_O[0], KT_O[2], KT_O[1]], tam, 'nhua_o');
      mieng = [tam[0], tam[1] + KT_O[2] / 2, tam[2]]; phap = [0, 1, 0]; len = [0, 0, 1];
    } else {
      k = hop([KT_O[0], KT_O[1], KT_O[2]], tam, 'nhua_o');
      mieng = [tam[0], tam[1], tam[2] - KT_O[2] / 2]; phap = [0, 0, -1]; len = [0, 1, 0];
    }
    let tt = [{ k: 'nhan', kt: [1.16, 0.84], vt: mieng, phap: phap, len: len, ve: 'mieng_rj25' }];
    if (so != null) {
      // số cổng in cạnh ổ
      let vtSo = huong == 'len' ? [tam[0], tam[1] + KT_O[2] / 2 - 0.45, tam[2] + KT_O[1] / 2] : [tam[0], tam[1] + KT_O[1] / 2, tam[2] + 0.3];
      let phSo = huong == 'len' ? [0, 0, 1] : [0, 1, 0];
      let lenSo = huong == 'len' ? [0, 1, 0] : [0, 0, 1];
      tt.push({ k: 'nhan', kt: [0.7, 0.7], vt: vtSo, phap: phSo, len: lenSo, ve: 'so', chu: String(so) });
    }
    return { khoi: k, trangTri: tt, mieng: mieng, huong: phap };
  }

  // ---------- Dây RJ25 ----------
  // Đường tâm dây đi qua các điểm mốc (làm trơn Catmull-Rom), dây dẹt 0,6 × 0,25 cm.
  // Hitbox: chuỗi hộp ngắn bám theo đường tâm; hình vẽ: dải quét qua đúng các mặt cắt đó.
  const DAY = { rong: 0.6, day: 0.25, buoc: 0.45, matDo: 1.4, dauCam: [1.15, 0.9, 0.9] };

  function catmull(p0, p1, p2, p3, t) {
    let kq = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      let a = 2 * p1[i], b = p2[i] - p0[i], c = 2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i], d = -p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i];
      kq[i] = 0.5 * (a + b * t + c * t * t + d * t * t * t);
    }
    return kq;
  }
  function duongTron(moc, buoc) {
    // Lấy mẫu dày, rồi cắt thành đoạn: mỗi đoạn dài không quá buoc và không đổi hướng quá GOC_DOAN.
    // Chỗ dây uốn gắt sẽ có nhiều đoạn ngắn, nhờ vậy chuỗi hộp hitbox bám sát dải dây vẽ trơn (lệch dưới 1 mm).
    const GOC_DOAN = 14 * Math.PI / 180, SO_MAU = 48;
    let day = [];
    for (let i = 0; i < moc.length - 1; i++) {
      let p0 = moc[Math.max(0, i - 1)], p1 = moc[i], p2 = moc[i + 1], p3 = moc[Math.min(moc.length - 1, i + 2)];
      for (let j = 0; j < SO_MAU; j++) day.push(catmull(p0, p1, p2, p3, j / SO_MAU));
    }
    day.push(moc[moc.length - 1]);
    let kq = [day[0]], tong = 0, daiDoan = 0, gocDoan = 0, huongTruoc = null;
    for (let i = 1; i < day.length; i++) {
      let d = V.tru(day[i], day[i - 1]), l = V.dai(d);
      if (l < 1e-9) continue;
      let h = V.nhan(d, 1 / l);
      if (huongTruoc) gocDoan += Math.acos(Math.max(-1, Math.min(1, V.cham(h, huongTruoc))));
      huongTruoc = h;
      // mẫu này làm đoạn đang dựng quá dài hoặc quá cong: kết thúc đoạn ở mẫu trước
      if (daiDoan > 0 && (daiDoan + l > buoc || gocDoan > GOC_DOAN)) { kq.push(day[i - 1]); daiDoan = 0; gocDoan = 0; }
      daiDoan += l; tong += l;
    }
    kq.push(day[day.length - 1]);
    return { diem: kq, dai: tong };
  }
  // dau, cuoi: { mieng, huong } của hai ổ; moc: các điểm mốc ở giữa; ngang: hướng bề rộng dây lúc đầu
  function dayRJ25(id, ten, dau, cuoi, moc, ngang) {
    let L = DAY.dauCam[2];
    let a = V.cong(dau.mieng, V.nhan(dau.huong, L)), b = V.cong(cuoi.mieng, V.nhan(cuoi.huong, L));
    let a2 = V.cong(a, V.nhan(dau.huong, 0.5)), b2 = V.cong(b, V.nhan(cuoi.huong, 0.5));
    let d = duongTron([a, a2].concat(moc || [], [b2, b]), DAY.buoc);
    // Khung di chuyển song song dọc dây: tiếp tuyến t, bề rộng n, pháp tuyến mặt dẹt b
    let khung = [], n = V.donVi(ngang || [1, 0, 0]);
    for (let i = 0; i < d.diem.length; i++) {
      let t = V.donVi(V.tru(d.diem[Math.min(i + 1, d.diem.length - 1)], d.diem[Math.max(i - 1, 0)]));
      n = V.donVi(V.tru(n, V.nhan(t, V.cham(n, t))));
      khung.push({ p: d.diem[i], t: t, n: n, b: V.co(t, n) });
    }
    let khoi = [];
    for (let i = 0; i < khung.length - 1; i++) {
      let p = khung[i].p, q = khung[i + 1].p, t = V.donVi(V.tru(q, p));
      let nn = V.donVi(V.tru(khung[i].n, V.nhan(t, V.cham(khung[i].n, t))));
      khoi.push({ k: 'hop', kt: [DAY.rong, DAY.day, V.dai(V.tru(q, p))], vt: V.nhan(V.cong(p, q), 0.5),
        xoay: Q.tuTruc(nn, V.co(t, nn), t), vl: 'day_xam', an: true });
    }
    // Đầu cắm (phần vỏ nhựa trong ló ra ngoài ổ)
    function dauCam(o) {
      let t = o.huong, nn = Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
      nn = V.donVi(V.tru(nn, V.nhan(t, V.cham(nn, t))));
      return { k: 'hop', kt: DAY.dauCam, vt: V.cong(o.mieng, V.nhan(t, L / 2)), xoay: Q.tuTruc(nn, V.co(t, nn), t), vl: 'nhua_trong' };
    }
    khoi.push(dauCam(dau), dauCam(cuoi));
    let theTich = DAY.rong * DAY.day * d.dai;
    return { id: id, ten: ten, nhom: 'day', khoiLuong: theTich * DAY.matDo + 2 * 1.0, khoi: khoi,
      trangTri: [{ k: 'dai', khung: khung, rong: DAY.rong, day: DAY.day, vl: 'day_xam' }] };
  }

  // ---------- Cấu hình mặc định ----------
  const MAC_DINH = {
    banh: 'thuong',     // hiện chỉ có bánh thường (vi sai 2 bánh + bi tự do)
    sieuAm: true,
    doLine: 2,          // số mắt TCRT5000: 0–3
    cachMat: 3,         // cm giữa hai mắt cạnh nhau (1,5 … 3)
    cham: true,
    gyro: true,
    gps: true
  };

  // ---------- Lắp xe ----------
  function lapXe(cauHinhVao) {
    let c = Object.assign({}, MAC_DINH, cauHinhVao || {});
    c.doLine = Math.max(0, Math.min(3, Math.round(Number(c.doLine) || 0)));
    c.cachMat = Math.max(1.5, Math.min(3, Number(c.cachMat) || 3));
    let R = TS.rBanh, e = TS.dayKhung, y0 = TS.yDay, y1 = y0 + e;   // y1: mặt trên tấm đáy
    let than = [], day = [], camBien = [];
    let them = (ct) => { than.push(ct); return ct; };

    // --- Khung nhôm chữ U ---
    let yVach = 5.0;   // mép trên vách bên
    them({ id: 'khung', ten: 'Khung nhôm', nhom: 'khung', matDo: TS.nhom, khoi: [
      hop([9.0, e, 17.0], [0, y0 + e / 2, 4.5], 'nhom', { vat: 0.04 }),                           // tấm đáy z -4…13
      hop([e, yVach - y1, 11.0], [-4.4, (y1 + yVach) / 2, 1.5], 'nhom'),                          // vách trái z -4…7
      hop([e, yVach - y1, 11.0], [4.4, (y1 + yVach) / 2, 1.5], 'nhom'),
      lang([[7.0, y1], [10.0, y1], [7.0, yVach]], e, 'x', [-4.4, 0, 0], 'nhom'),                  // vách vát xuống phía mũi
      lang([[7.0, y1], [10.0, y1], [7.0, yVach]], e, 'x', [4.4, 0, 0], 'nhom'),
      hop([8.6, yVach - y1, e], [0, (y1 + yVach) / 2, -3.9], 'nhom'),                             // vách sau
      hop([1.0, e, 11.0], [-3.8, yVach - e / 2, 1.5], 'nhom'),                                    // mép gập trong đỡ mạch chủ
      hop([1.0, e, 11.0], [3.8, yVach - e / 2, 1.5], 'nhom')
    ], trangTri: [
      // lỗ bắt vít trên tấm đáy (vẽ, không khoét), đầu vít giữ motor trên vách
      { k: 'luoiLo', vt: [0, y1, 8.9], phap: [0, 1, 0], len: [0, 0, 1], kt: [7.2, 4.8], buoc: 0.8, d: 0.4 },
      { k: 'dia', d: 0.5, vt: [-4.5, R + 0.75, -0.6], phap: [-1, 0, 0], vl: 'thep' },
      { k: 'dia', d: 0.5, vt: [-4.5, R - 0.75, -0.6], phap: [-1, 0, 0], vl: 'thep' },
      { k: 'dia', d: 0.5, vt: [4.5, R + 0.75, -0.6], phap: [1, 0, 0], vl: 'thep' },
      { k: 'dia', d: 0.5, vt: [4.5, R - 0.75, -0.6], phap: [1, 0, 0], vl: 'thep' }
    ] });

    // --- Hai motor TT (gắn vào khung) ---
    // Trục ra là hình trụ quay quanh chính trục của nó, nên hình dạng không đổi khi quay: hitbox của trục
    // nằm cùng motor trên thân. Nhờ vậy mỗi bánh chỉ còn một hình va chạm (xem vat-li.js, mục hình đơn).
    for (let s of [-1, 1]) {
      them({ id: 'motor_' + (s < 0 ? 'trai' : 'phai'), ten: 'Động cơ giảm tốc TT ' + (s < 0 ? 'trái' : 'phải'), nhom: 'dongCo', khoiLuong: 29, khoi: [
        hop([1.9, 2.25, 3.7], [s * 3.3, R, 0.75], 'nhua_vang', { vat: 0.06 }),                   // hộp số
        tru(2.0, 2.3, 'z', [s * 3.3, R, 3.75], 'thep_ma'),                                        // thân motor
        tru(1.9, 0.5, 'z', [s * 3.3, R, 5.15], 'nhua_den'),                                       // nắp chổi than
        hop([0.5, 0.9, 0.3], [s * 2.6, R, 5.55], 'dong'),                                         // hai cực điện
        tru(0.54, 0.6, 'x', [s * (TS.xBanh - TS.rongBanh / 2 - 0.3), R, 0], 'thep')               // trục ra
      ], trangTri: [
        { k: 'nhan', kt: [1.5, 1.2], vt: [s * 2.35, R, 0.75], phap: [-s, 0, 0], len: [0, 1, 0], ve: 'nhan_motor' }
      ] });
    }

    // --- Hộp pin 2 × 18650 nằm giữa hai motor ---
    them({ id: 'pin', ten: 'Hộp pin 2 × 18650', nhom: 'pin', khoiLuong: 104, khoi: [
      hop([4.1, 0.5, 7.7], [0, y1 + 0.25, 0.25], 'nhua_den', { vat: 0.05 }),                      // đế hộp
      hop([4.1, 1.6, 0.3], [0, y1 + 0.8, -3.45], 'nhua_den'), hop([4.1, 1.6, 0.3], [0, y1 + 0.8, 3.95], 'nhua_den'),
      tru(1.8, 6.5, 'z', [-0.98, y1 + 1.4, 0.25], 'pin'), tru(1.8, 6.5, 'z', [0.98, y1 + 1.4, 0.25], 'pin')
    ], trangTri: [] });

    // --- Mạch chủ: trụ đồng, mạch in, nắp, 8 ổ RJ25 ---
    let yMach = yVach + 0.6, yMat = yMach + 0.16;     // mặt trên mạch in
    let khoiMach = [
      hop([8.6, 0.16, 9.9], [0, yMach + 0.08, 3.55], 'mach_in'),                                 // z -1,4…8,5
      hop([8.6, 1.24, 6.3], [0, yMat + 0.62, 3.55], 'nap_mach', { vat: 0.08 })                    // nắp che linh kiện z 0,4…6,7
    ];
    let ttMach = [
      { k: 'nhan', kt: [5.2, 2.4], vt: [0, yMat + 1.24, 3.55], phap: [0, 1, 0], len: [0, 0, 1], ve: 'nhan_mach' },
      { k: 'dia', d: 0.5, vt: [-3.2, yMat + 1.24, 5.9], phap: [0, 1, 0], vl: 'den_xanh' }
    ];
    let oMach = {};
    let xTruoc = [-3.4, -1.7, 0, 1.7, 3.4], xSau = [-3, 0, 3];
    xTruoc.forEach(function(x, i) {
      let o = oRJ25([x, yMat + KT_O[2] / 2, 7.55], 'len', i + 1);
      khoiMach.push(o.khoi); ttMach = ttMach.concat(o.trangTri); oMach[i + 1] = o;
    });
    xSau.forEach(function(x, i) {
      let o = oRJ25([x, yMat + KT_O[1] / 2, -0.45], 'sau', i + 6);
      khoiMach.push(o.khoi); ttMach = ttMach.concat(o.trangTri); oMach[i + 6] = o;
    });
    them({ id: 'machChu', ten: 'Mạch chủ có nắp', nhom: 'machChu', khoiLuong: 52, khoi: khoiMach, trangTri: ttMach });
    them({ id: 'truDo', ten: 'Trụ đỡ mạch chủ', nhom: 'machChu', matDo: TS.dongThau, khoi: [
      lang(lucGiac(0.5), 0.6, 'y', [-3.8, yVach + 0.3, -0.6], 'dong'), lang(lucGiac(0.5), 0.6, 'y', [3.8, yVach + 0.3, -0.6], 'dong'),
      lang(lucGiac(0.5), 0.6, 'y', [-3.8, yVach + 0.3, 6.4], 'dong'), lang(lucGiac(0.5), 0.6, 'y', [3.8, yVach + 0.3, 6.4], 'dong')
    ], trangTri: [] });

    // --- Vỏ bi tự do (viên bi là vật thể riêng, lăn tự do trong vỏ) ---
    them({ id: 'voBi', ten: 'Vỏ bi tự do', nhom: 'bi', khoiLuong: 6, khoi: [
      tru(2.2, y0 - 0.95, 'y', [0, (y0 + 0.95) / 2, TS.zBi], 'thep_ma'),
      hop([3.2, 0.15, 1.2], [0, y0 - 0.075, TS.zBi], 'thep_ma')
    ], trangTri: [] });

    // Số cổng phần mềm ('in1', 'in2', …) đánh theo thứ tự lắp; ổ trên mạch chủ ghi cùng số.
    let soCong = 0;
    let cong = () => 'in' + (++soCong);

    // --- Cảm biến dò line TCRT5000: mỗi mắt một mô-đun (đầu đo dưới gầm, ổ RJ25 phía trên tấm đáy) ---
    let xMat = [];
    for (let i = 0; i < c.doLine; i++) xMat.push((i - (c.doLine - 1) / 2) * c.cachMat);
    let oMat = [1, 3, 5];                       // ổ mạch chủ cho mắt trái, giữa, phải
    if (c.doLine == 1) oMat = [3];
    if (c.doLine == 2) oMat = [1, 5];
    let zMat = 12.35, yMatDo = 0.6;             // mặt đầu đo cách sân 6 mm
    xMat.forEach(function(x, i) {
      let ten = c.doLine == 1 ? 'giữa' : (i == 0 ? 'trái' : (i == c.doLine - 1 ? 'phải' : 'giữa'));
      let o = oRJ25([x, y1 + KT_O[1] / 2, 12.05], 'sau');
      let ct = them({ id: 'doLine' + (i + 1), ten: 'Cảm biến dò line TCRT5000 (' + ten + ')', nhom: 'doLine', khoiLuong: 7.5, khoi: [
        o.khoi,
        hop([1.4, 0.5, 1.5], [x, y0 - 0.25, zMat], 'mach_den', { vat: 0.04 }),                    // mạch có vỏ dưới gầm
        hop([1.02, 0.7, 0.58], [x, y0 - 0.5 - 0.35, zMat], 'nhua_den')                            // thân TCRT5000
      ], trangTri: o.trangTri.concat([
        { k: 'dia', d: 0.3, vt: [x - 0.25, yMatDo, zMat], phap: [0, -1, 0], vl: 'led_hong_ngoai' },
        { k: 'dia', d: 0.3, vt: [x + 0.25, yMatDo, zMat], phap: [0, -1, 0], vl: 'kinh_den' }
      ]) });
      let cg = cong();
      camBien.push({ loai: 'doLine', cong: cg, chiTiet: ct.id, x: x, vt: [x, yMatDo, zMat], huong: [0, -1, 0], oMach: oMat[i], ten: ten });
      let xo = oMach[oMat[i]].mieng[0];
      day.push(dayRJ25('day_' + ct.id, 'Dây RJ25 dò line ' + ten, o, oMach[oMat[i]],
        [[x + (xo - x) * 0.15, 2.9, 9.7], [x + (xo - x) * 0.6, 5.2, 9.25], [xo, 7.9, 9.15], [xo, 9.35, 8.45]], [1, 0, 0]));
    });

    // --- Cảm biến siêu âm kiểu HC-SR04 trên giá phía mũi ---
    if (c.sieuAm) {
      let ySa = 5.6, zVo = 11.9;                  // tâm vỏ mô-đun
      let o = oRJ25([0, 5.75, 10.55], 'len');
      let ct = them({ id: 'sieuAm', ten: 'Cảm biến siêu âm HC-SR04', nhom: 'sieuAm', khoiLuong: 12, khoi: [
        hop([4.7, 2.2, 1.0], [0, ySa, zVo], 'nhua_xanh', { vat: 0.08 }),                          // vỏ mô-đun
        tru(1.6, 1.2, 'z', [-1.3, ySa, zVo + 1.1], 'bac'),                                        // đầu phát (T)
        tru(1.6, 1.2, 'z', [1.3, ySa, zVo + 1.1], 'bac'),                                         // đầu thu (R)
        o.khoi
      ], trangTri: o.trangTri.concat([
        { k: 'nhan', kt: [1.3, 1.3], vt: [-1.3, ySa, zVo + 1.7], phap: [0, 0, 1], len: [0, 1, 0], ve: 'luoi_sieu_am', tron: true },
        { k: 'nhan', kt: [1.3, 1.3], vt: [1.3, ySa, zVo + 1.7], phap: [0, 0, 1], len: [0, 1, 0], ve: 'luoi_sieu_am', tron: true },
        { k: 'nhan', kt: [0.8, 0.5], vt: [0, ySa + 0.6, zVo + 0.5], phap: [0, 0, 1], len: [0, 1, 0], ve: 'chu', chu: 'T  R' }
      ]) });
      them({ id: 'giaSieuAm', ten: 'Giá đỡ cảm biến siêu âm', nhom: 'sieuAm', matDo: TS.nhom, khoi: [
        hop([0.6, 2.7, e], [-4.15, y1 + 1.35, 11.3], 'nhom'), hop([0.6, 2.7, e], [4.15, y1 + 1.35, 11.3], 'nhom'),   // hai chân
        hop([8.9, 2.4, e], [0, ySa, 11.3], 'nhom', { vat: 0.04 })                                                   // thanh ngang
      ], trangTri: [] });
      let cg = cong();
      camBien.push({ loai: 'sieuAm', cong: cg, chiTiet: ct.id, vt: [0, ySa, zVo + 1.7], huong: [0, 0, 1],
        dau: [[-1.3, ySa, zVo + 1.7], [1.3, ySa, zVo + 1.7]], oMach: 2 });
      day.push(dayRJ25('day_sieuAm', 'Dây RJ25 siêu âm', o, oMach[2], [[-0.5, 8.9, 10.1], [-1.4, 9.5, 8.8]], [1, 0, 0]));
    }

    // --- Cảm biến chạm: công tắc hành trình + tấm cản treo bản lề phía mũi ---
    let canGat = null;
    if (c.cham) {
      // Chỗ đặt khối công tắc: vị trí đầu tiên không đụng các mô-đun dò line
      let xCham = [0, -1.5, 1.5, -3, 3].find((x) => xMat.every((m) => Math.abs(m - x) >= 1.5 - 1e-6));
      if (xCham == null) xCham = 0;
      let o = oRJ25([xCham, y1 + KT_O[1] / 2, 12.05], 'sau');
      let yCt = y1 + KT_O[1] + 0.5;
      let ct = them({ id: 'cham', ten: 'Cảm biến chạm (công tắc hành trình)', nhom: 'cham', khoiLuong: 9, khoi: [
        o.khoi,
        hop([1.5, 1.0, 0.64], [xCham, yCt, 12.7], 'nhua_den', { vat: 0.04 }),                     // thân công tắc
        tru(0.3, 0.5, 'x', [xCham, yCt, 13.14], 'do')                                             // nút bấm tì vào tấm cản
      ], trangTri: o.trangTri });
      them({ id: 'giaCham', ten: 'Tai bản lề tấm cản', nhom: 'cham', matDo: TS.nhom, khoi: [
        hop([e, 2.5, 0.5], [-4.2, y1 + 1.25, 13.0], 'nhom'), hop([e, 2.5, 0.5], [4.2, y1 + 1.25, 13.0], 'nhom')
      ], trangTri: [] });
      // Tấm cản: vật thể riêng, quay quanh bản lề nằm ngang ở mép trên, lò xo đẩy ra trước
      let yBanLe = y1 + 2.3, zBanLe = 13.3;
      canGat = {
        id: 'tamCan', ten: 'Tấm cản', nhom: 'cham', matDo: TS.abs,
        tam: [0, yBanLe, zBanLe], truc: [1, 0, 0],
        // khối viết trong hệ gắn với bản lề (tấm treo thẳng xuống, mặt sau trùng mặt phẳng bản lề)
        khoi: [
          hop([10.0, 2.2, 0.4], [0, -1.1, 0.2], 'nhua_cam', { vat: 0.06 }),
          tru(0.3, 8.1, 'x', [0, 0, 0], 'thep')                                                    // chốt bản lề
        ],
        trangTri: [],
        gocNghi: 6,             // độ: lúc nghỉ tấm cản chĩa ra trước 6°
        gocDong: 3,             // công tắc đóng khi tấm bị ép vào còn dưới 3°
        gocNha: 4,              // và nhả khi bung ra quá 4° (độ trễ cơ khí của công tắc)
        lucLoXo: 0.5e5,         // dyn (0,5 N) tại điểm tì của nút bấm
        tayDon: 1.2             // cm từ bản lề tới nút bấm
      };
      let cg = cong();
      camBien.push({ loai: 'cham', cong: cg, chiTiet: ct.id, oMach: 4 });
      let xo = oMach[4].mieng[0];
      day.push(dayRJ25('day_cham', 'Dây RJ25 cảm biến chạm', o, oMach[4],
        [[xCham + (xo - xCham) * 0.15, 2.9, 9.7], [xCham + (xo - xCham) * 0.6, 5.2, 9.25], [xo, 7.9, 9.15], [xo, 9.35, 8.45]], [1, 0, 0]));
    }

    // --- Gyro và GPS đặt trên nắp mạch chủ ---
    let yNap = yMat + 1.24;
    function dayVongSau(id, ten, o, so) {
      let m = oMach[so].mieng, zc = m[2] - DAY.dauCam[2] - 0.5;
      let yg = (o.mieng[1] + m[1]) / 2, r = (o.mieng[1] - m[1]) / 2;
      return dayRJ25(id, ten, o, oMach[so], [[(o.mieng[0] + m[0]) / 2, o.mieng[1], zc - 0.25], [m[0], yg, zc - 0.25 - r]], [1, 0, 0]);
    }
    if (c.gyro) {
      let o = oRJ25([-3, yNap + KT_O[1] / 2, 2.0], 'sau');
      let ct = them({ id: 'gyro', ten: 'Cảm biến gyro (con quay)', nhom: 'gyro', khoiLuong: 6, khoi: [
        o.khoi, hop([2.2, 0.8, 2.0], [-3, yNap + 0.4, 3.95], 'nhua_tim', { vat: 0.06 })
      ], trangTri: o.trangTri.concat([
        { k: 'nhan', kt: [1.8, 1.6], vt: [-3, yNap + 0.8, 3.95], phap: [0, 1, 0], len: [0, 0, 1], ve: 'nhan_gyro' }
      ]) });
      camBien.push({ loai: 'gyro', cong: cong(), chiTiet: ct.id, vt: [-3, yNap + 0.4, 3.95], oMach: 6 });
      day.push(dayVongSau('day_gyro', 'Dây RJ25 gyro', o, 6));
    }
    if (c.gps) {
      let o = oRJ25([3, yNap + KT_O[1] / 2, 2.0], 'sau');
      let ct = them({ id: 'gps', ten: 'Mô-đun GPS', nhom: 'gps', khoiLuong: 13, khoi: [
        o.khoi, hop([2.6, 0.9, 2.6], [3, yNap + 0.45, 4.25], 'nhua_xam', { vat: 0.06 }),
        hop([1.5, 0.4, 1.5], [3, yNap + 1.1, 4.25], 'gom', { vat: 0.04 })                         // ăng-ten gốm
      ], trangTri: o.trangTri.concat([
        { k: 'nhan', kt: [1.1, 1.1], vt: [3, yNap + 1.3, 4.25], phap: [0, 1, 0], len: [0, 0, 1], ve: 'antenna' }
      ]) });
      camBien.push({ loai: 'gps', cong: cong(), chiTiet: ct.id, vt: [3, yNap + 1.3, 4.25], oMach: 8 });
      day.push(dayVongSau('day_gps', 'Dây RJ25 GPS', o, 8));
    }

    // --- Bánh xe (vật thể riêng, nối với khung bằng khớp bản lề có motor) ---
    let banh = [];
    for (let s of [-1, 1]) {
      let khoi = [
        // Lốp cao su mặt cắt tròn (bo mép gần hết bề rộng, còn 1 mm mặt phẳng ở giữa): lốp chạm sân ở đúng
        // giữa bề rộng, nên khoảng cách hai điểm chạm sân bằng đúng khoảng cách hai bánh. Lốp trụ phẳng tuyệt
        // đối cứng thì điểm chạm có thể nằm bất kì đâu trên bề rộng lốp: đo được xe quay lệch ±4 % so với lí thuyết.
        tru(TS.dBanh, TS.rongBanh, 'x', [0, 0, 0], 'cao_su', { dTrong: 5.0, kieu: 'lop', bo: TS.boLop }),
        tru(5.0, TS.rongBanh - 0.16, 'x', [0, 0, 0], 'nhua_vanh', { trong: true, kieu: 'vanh' })  // vành (nằm trong hình trụ của lốp)
      ];
      banh.push({
        id: s < 0 ? 'trai' : 'phai', ten: s < 0 ? 'Bánh trái' : 'Bánh phải', cong: s < 0 ? 'outA' : 'outB', ben: s,
        tam: [s * TS.xBanh, R, 0], truc: [1, 0, 0], d: TS.dBanh, rong: TS.rongBanh,
        phan: [{ chiSo: [0], khoiLuong: 20 }, { chiSo: [1], khoiLuong: 9 }],
        khoi: khoi,
        trangTri: [{ k: 'vanhNan', ben: s, d: 5.0, x: s * (TS.rongBanh / 2 - 0.08) }, { k: 'gaiLop', d: TS.dBanh, rong: TS.rongBanh, bo: TS.boLop }],
        dongCo: DONG_CO, maSat: 0.9
      });
    }

    let bi = { id: 'bi', ten: 'Bi tự do', tam: [0, TS.dBi / 2, TS.zBi], d: TS.dBi, matDo: TS.thep, vl: 'thep', maSat: 0.25 };

    than = than.concat(day);
    return { cauHinh: c, than: than, banh: banh, bi: bi, canGat: canGat, camBien: camBien, thongSo: TS, dongCo: DONG_CO };
  }

  // Chuẩn hoá mọi khối của một chi tiết và tính khối lượng nếu cho theo khối lượng riêng
  function chuanBi(ct) {
    ct.khoi = ct.khoi.map((k) => k.q ? k : H.chuanHoa(k));
    if (ct.khoiLuong == null) {
      ct.khoiLuong = ct.khoi.reduce((s, k) => s + H.hinhHoc(k).V, 0) * ct.matDo;
    }
    return ct;
  }

  // Khối lượng, trọng tâm, quán tính của thân xe (khung + mọi thứ gắn cứng vào khung)
  // và của từng vật thể chuyển động; số liệu dùng chung cho vật lí và tài liệu.
  function tinhXe(banLap) {
    banLap.than.forEach(chuanBi);
    let than = H.khoiLuongTong(banLap.than.map((ct) => ({ khoi: ct.khoi, khoiLuong: ct.khoiLuong })));
    let banh = banLap.banh.map(function(b) {
      b.khoi = b.khoi.map((k) => k.q ? k : H.chuanHoa(k));
      let nhom = b.phan.map(function(p) {
        let ks = p.chiSo.map((i) => b.khoi[i]);
        let Vt = ks.reduce((s, k) => s + H.hinhHoc(k).V, 0);
        return { khoi: ks, khoiLuong: p.khoiLuong != null ? p.khoiLuong : Vt * p.matDo };
      });
      let kl = H.khoiLuongTong(nhom);
      // Quán tính rôto motor quy về trục bánh (nhân tỉ số truyền bình phương): rôto quay nhanh gấp 48 lần bánh
      let roto = b.dongCo.quanTinhRoto * b.dongCo.tiSoTruyen * b.dongCo.tiSoTruyen;
      return { m: kl.m, tam: kl.tam, I: kl.I, quanTinhRoto: roto };
    });
    let bi = { m: 4 / 3 * PI * Math.pow(banLap.bi.d / 2, 3) * banLap.bi.matDo };
    bi.I = 0.4 * bi.m * Math.pow(banLap.bi.d / 2, 2);
    let canGat = null;
    if (banLap.canGat) {
      chuanBi(banLap.canGat);
      canGat = H.khoiLuongTong([{ khoi: banLap.canGat.khoi, khoiLuong: banLap.canGat.khoiLuong }]);
    }
    // Trọng tâm cả xe (để báo cáo và chia tải lên bánh)
    let tong = than.m, tam = V.nhan(than.tam, than.m);
    banLap.banh.forEach(function(b, i) { tong += banh[i].m; tam = V.cong(tam, V.nhan(V.cong(b.tam, banh[i].tam), banh[i].m)); });
    tong += bi.m; tam = V.cong(tam, V.nhan(banLap.bi.tam, bi.m));
    if (canGat) { tong += canGat.m; tam = V.cong(tam, V.nhan(V.cong(banLap.canGat.tam, canGat.tam), canGat.m)); }
    tam = V.nhan(tam, 1 / tong);
    return { than: than, banh: banh, bi: bi, canGat: canGat, tong: tong, tam: tam,
      taiBanh: 1 - tam[2] / banLap.thongSo.zBi };   // phần trọng lượng đè lên hai bánh chủ động
  }

  // Các trường tương thích với GEARS và khung thử thách (đọc bởi mã có sẵn):
  //   wheelDiameter, bodyWidth + wheelWidth + 2·wheelToBodyOffset = khoảng cách hai bánh,
  //   bodyLength / 2 − bodyEdgeToWheelCenterZ = trục bánh nằm trước tâm thân bao nhiêu.
  function truongTuongThich(banLap, kl) {
    let TSx = banLap.thongSo;
    let L = 17, lech = -kl.than.tam[2];    // gốc vật thể của thân là trọng tâm thân
    return {
      wheels: true, caster: true,
      wheelDiameter: Math.round(TSx.dBanh * 10000) / 10000,
      wheelWidth: TSx.rongBanh,
      wheelToBodyOffset: 0.3,
      bodyWidth: 2 * TSx.xBanh - TSx.rongBanh - 0.6,
      bodyLength: L,
      bodyHeight: 9,
      bodyEdgeToWheelCenterZ: Math.round((L / 2 - lech) * 10000) / 10000,
      bodyEdgeToWheelCenterY: 1,
      bodyMass: Math.round(kl.than.m), wheelMass: Math.round(kl.banh[0].m), casterMass: Math.round(kl.bi.m),
      casterDiameter: TSx.dBi
    };
  }

  return { TS: TS, DONG_CO: DONG_CO, DAY: DAY, MAC_DINH: MAC_DINH, lapXe: lapXe, tinhXe: tinhXe, chuanBi: chuanBi, truongTuongThich: truongTuongThich };
});
