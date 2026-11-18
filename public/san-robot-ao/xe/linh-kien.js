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

  // ---------- Cấu hình lắp ----------
  // Chỗ gắn cảm biến trên xe (toạ độ x, z tính bằng cm, gốc ở giữa trục bánh, x sang phải, z về phía mũi):
  //   - Thanh dưới mũi xe: mắt dò line (tối đa 3) và cảm biến chạm (tối đa 1) đặt ở bất kì x nào trong
  //     khoảng ±X_DUOI[loai], hai mô-đun cách nhau (tâm đến tâm) ít nhất KC_DUOI vì mỗi mô-đun rộng 1,5 cm.
  //     X_LO là 5 lỗ của bản cũ (cách nhau 1,5 cm), vẫn dùng làm vị trí gợi ý và cho kiểu cấu hình "lo".
  //   - Giá phía mũi: cảm biến siêu âm, trượt ngang (sieuAmX) và xoay quanh trục đứng (sieuAmGoc, độ,
  //     dương là quay sang trái) trong giới hạn của thanh giá.
  //   - Nắp mạch chủ: gyro và GPS đặt ở bất kì (x, z) nào miễn là cả mô-đun lẫn ổ cắm nằm trên nắp
  //     và hai mô-đun không chồng lên nhau. X_NAP là hai chỗ của bản cũ.
  // Mô-đun dưới mũi cắm vào ổ trước (1…5) theo thứ tự trái sang phải, chọn ổ gần nhất để dây không bắt chéo;
  // siêu âm lấy ổ trước còn trống gần nó nhất; gyro, GPS cắm ổ sau (6…8) cũng theo thứ tự trái sang phải.
  const X_LO = [-3, -1.5, 0, 1.5, 3];
  const X_NAP = [-3, 3], O_NAP = [6, 8];
  const TOI_DA = { doLine: 7, cham: 1, sieuAm: 4, gyro: 1, gps: 1, servo: 1 };   // số có trong khay (mắt dò line: 3 dưới mũi + 4 dưới gầm)
  const TOI_DA_DUOI = { doLine: 3, cham: 1 };      // thanh dưới mũi
  // Gầm xe (dưới tấm đáy): mắt dò line TCRT5000 đặt ở (x, z) bất kì. Mạch đầu đo 1,4 × 1,5 cm treo dưới tấm đáy,
  // ổ RJ25 nằm ngay sau mạch (cũng treo dưới tấm đáy, cách sân 5 mm), dây chạy dọc gầm ra phía đuôi rồi vòng lên.
  //   x: tâm mạch cách giữa tối đa GAM.x để mạch nằm gọn dưới tấm đáy (rộng 9 cm)
  //   z: từ GAM.z0 (ổ cắm và đầu cắm phía sau còn nằm dưới tấm đáy) tới GAM.z1 (trước đó là thanh dưới mũi)
  //   vỏ bi tự do chiếm |x| < 1,6, z 9,4…11,6: mạch không được lấn vào
  //   dây của mô-đun chạy thẳng ra sau, nên hai mô-đun gầm phải lệch nhau ít nhất KC_GAM theo bề ngang
  const GAM = { x: 3.75, z0: -0.5, z1: 10.5, toiDa: 4, nuaRong: 0.75, nuaDai: 0.75, xBi: 1.6, zBi: 9.4 };
  const KC_GAM = 1.5;
  const SO_O = 8;                                  // mạch chủ có 8 ổ RJ25: tổng số cảm biến không quá 8
  // Bốn giá siêu âm, mỗi giá một cảm biến. Mỗi giá có: mặt bắt mô-đun (mat, theo trục pháp tuyến n), độ cao
  // tâm mô-đun (y), trục trượt (truc: toạ độ u là x hoặc z) và góc quay từ hướng +z tới hướng n (gocN, độ).
  //   truoc  thanh ngang phía mũi (có từ trước), cảm biến nhìn ra trước
  //   sau    tấm bắt vào vách sau, nhìn ra sau
  //   trai, phai  tấm bắt vào vách bên, nâng cao hơn bánh xe, nhìn sang ngang
  const GIA = {
    truoc: { ten: 'trước', n: [0, 0, 1], mat: 11.4, y: 5.6, truc: 'x', gocN: 0, cao: [5.6, 10.6] },
    trai: { ten: 'trái', n: [-1, 0, 0], mat: -4.7, y: 8.0, truc: 'z', gocN: -90, u: [-2.5, 8.0], cao: [3.0, 13.0], caoTrenBanh: 7.5 },
    phai: { ten: 'phải', n: [1, 0, 0], mat: 4.7, y: 8.0, truc: 'z', gocN: 90, u: [-2.5, 8.0], cao: [3.0, 13.0], caoTrenBanh: 7.5 },
    sau: { ten: 'sau', n: [0, 0, -1], mat: -4.2, y: 5.6, truc: 'x', gocN: 180, cao: [3.0, 10.6] }
  };
  // y: độ cao mặc định của tâm cảm biến so với mặt sân (cm); cao: khoảng chỉnh độ cao (giá có dãy lỗ bắt vít).
  // Thấp hơn khoảng đó thì vỏ đụng: giá mũi đụng công tắc chạm; giá đuôi hạ được tới sát sân. Giá bên: khi cảm biến
  // còn nằm ngang bánh xe thì phải cao ít nhất caoTrenBanh (vỏ ở trên lốp); dời lên trước qua khỏi bánh thì hạ được tới cao[0].
  const DS_GIA = ['truoc', 'trai', 'phai', 'sau'];
  // Màu sơn cho phép (khung nhôm, tấm cản, vành bánh); null là màu gốc
  const SON = ['#c62828', '#ef6c00', '#f9a825', '#2e7d32', '#00838f', '#1565c0', '#6a1b9a', '#d81b60', '#263238', '#eceff1'];
  // Ổ RJ25 trên mô-đun rộng 1,5 cm: ra ngoài 3 cm thì ổ đụng chân giá siêu âm, công tắc chạm đụng tai bản lề tấm cản
  const X_DUOI = { doLine: 3.0, cham: 3.0 };
  const KC_DUOI = 1.5;
  const GOC_SA = 45;                               // siêu âm xoay tối đa ±45°
  const NUA_THANH_GIA = 4.45;                      // nửa bề dài thanh ngang của giá siêu âm
  // Hình chiếu từ trên xuống của mô-đun trên nắp (gồm cả ổ RJ25 phía sau), tính từ tâm thân mô-đun
  const KHUON_NAP = { gyro: { nx: 1.1, z0: -2.9, z1: 1.0, z: 3.95 }, gps: { nx: 1.3, z0: -3.2, z1: 1.3, z: 4.25 },
    servo: { nx: 1.0, z0: -3.0, z1: 1.0, z: 4.5 } };     // servo: đế 2 × 2 cm và ổ RJ25 của mạch chuyển servo phía sau
  // ---------- Servo SG90 trên trụ đỡ ----------
  // Trục servo đặt theo hướng tuỳ chọn. Trong "hệ servo" (servo dựng đứng, trước khi xoay): trục ra hướng lên,
  // mặt tay quay ở y = 0…0,2 cm, thân servo ở dưới. Góc servo θ: tay quay chỉ hướng (cos θ, 0, sin θ), tức là
  // 0° bên phải, 90° phía trước, 180° bên trái; lúc lắp servo ở 90°.
  // Hướng lắp: nghieng (0…90°) là góc nâng của hướng giữa hành trình (θ = 90°) khỏi mặt ngang, tức là mặt quét
  // nghiêng đi bấy nhiêu; xoay (−180…180°, dương sang trái) là hướng của hướng giữa quanh trục đứng.
  //   trục đứng, quét ngang: nghieng 0;  trục nằm, lắc lên qua đỉnh: nghieng 90;  gật lên xuống trước–sau: nghieng 90, xoay 90.
  const SERVO = {
    ten: 'Servo SG90', dienAp: 5,
    tocDoKhongTai: 600,                      // độ/giây (0,1 s cho 60°)
    momenKet: 1.8 * 0.0980665 * 1e7,         // g·cm²/s² (1,8 kgf·cm)
    momenMaSat: 0.3 * 0.0980665 * 1e7,       // hộp số nhựa tỉ số lớn: giữ chặt khi không cấp điện
    tocDoLenhToiDa: 600,
    tiSoTruyen: 300, quanTinhRoto: 0.05,     // g·cm²: rôto motor nhỏ; quy về trục ra là 0,05 × 300² = 4500 g·cm²
    gocMin: 0, gocMax: 180, gocDau: 90,
    caoTruc: 4.2,                            // mặt tay quay cao hơn mặt nắp (cm): thân servo luôn ở trên các mô-đun khác
    BUOC_GOC: 5
  };
  // Tay quay: các điểm gắn cảm biến, mỗi điểm ở góc phi so với tay chính, cách trục r cm; cảm biến quay mặt ra ngoài
  const TAY = {
    don: { ten: 'Tay đơn', diem: [{ phi: 0, r: 1.9 }] },
    doi: { ten: 'Tay đôi', diem: [{ phi: 0, r: 1.6 }, { phi: 180, r: 1.6 }] },
    chuThap: { ten: 'Tay chữ thập', diem: [{ phi: 0, r: 1.0 }, { phi: 90, r: 1.0 }, { phi: 180, r: 1.0 }, { phi: 270, r: 1.0 }] },
    dia: { ten: 'Đĩa tròn', diem: [{ phi: 0, r: 0 }] }
  };
  const DS_TAY = ['don', 'doi', 'chuThap', 'dia'];
  const GAN_SERVO = ['sieuAm', 'doLine'];
  // Hướng tay quay ở góc lệch phi (độ) so với tay chính, lúc servo ở 90°, trong hệ servo
  const huongTay = (phi) => [-Math.sin(phi * PI / 180), 0, Math.cos(phi * PI / 180)];
  // Hình chiếu của cảm biến trên mặt tay quay (hệ riêng: t ngang, n hướng ra ngoài) để xét hai cảm biến có chồng nhau
  function khuonGan(loai, r) {
    let rb = r > 0 ? r : -0.5;
    return loai == 'sieuAm' ? { t: 2.35, n0: rb, n1: rb + 2.2 } : { t: 0.7, n0: r, n1: r + 1.4 };
  }
  // Hai hình chữ nhật xoay trên mặt tay quay có chồng nhau không (định lí trục phân tách)
  function chongGan(a, b) {
    let goc = (m) => {
      let d = huongTay(m.phi), t = [d[2], -d[0]], n = [d[0], d[2]], k = m.k, ds = [];
      for (let s of [-1, 1]) for (let u of [k.n0, k.n1]) ds.push([s * k.t * t[0] + u * n[0], s * k.t * t[1] + u * n[1]]);
      return { ds: ds, truc: [t, n] };
    };
    let A = goc(a), B = goc(b);
    for (let tr of A.truc.concat(B.truc)) {
      let pa = A.ds.map((p) => p[0] * tr[0] + p[1] * tr[1]), pb = B.ds.map((p) => p[0] * tr[0] + p[1] * tr[1]);
      if (Math.max.apply(null, pa) < Math.min.apply(null, pb) + 0.05 || Math.max.apply(null, pb) < Math.min.apply(null, pa) + 0.05) return false;
    }
    return true;
  }
  // Lỗi khi gắn cảm biến loai vào điểm i của tay quay (gan: các điểm khác đã gắn)
  function loiGanServo(tay, gan, i, loai) {
    let ds = TAY[tay].diem;
    if (!ds[i]) return 'Tay quay này không có điểm gắn đó.';
    if (GAN_SERVO.indexOf(loai) < 0) return 'Tay quay chỉ gắn được cảm biến siêu âm hoặc mắt dò line.';
    let moi = { phi: ds[i].phi, k: khuonGan(loai, ds[i].r) };
    for (let j = 0; j < ds.length; j++) {
      if (j == i || !gan[j]) continue;
      if (chongGan(moi, { phi: ds[j].phi, k: khuonGan(gan[j], ds[j].r) })) return 'Hai cảm biến trên tay quay chồng lên nhau. Chọn tay quay dài hơn hoặc gắn ở hai đầu đối nhau.';
    }
    return null;
  }
  // Quaternion xoay hệ servo vào hệ xe
  const quayServo = (m) => Q.nhan(Q.truc([0, 1, 0], -m.xoay), Q.truc([1, 0, 0], -m.nghieng));
  const NAP = { x0: -4.3, x1: 4.3, z0: 0.4, z1: 6.7 };   // mặt nắp mạch chủ
  const MAC_DINH = {
    banh: 'thuong',     // hiện chỉ có bánh thường (vi sai 2 bánh + bi tự do)
    sieuAm: true,
    lo: [null, 'doLine', null, 'doLine', 'cham'],   // 5 lỗ dưới mũi, từ trái sang phải: 'doLine', 'cham' hoặc null
    nap: ['gyro', 'gps']                            // 2 chỗ trên nắp mạch chủ: 'gyro', 'gps' hoặc null
  };
  const tron2 = (x) => Math.round(x * 100) / 100;
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));

  // Đầu đo TCRT5000 của mắt dò line: nghiêng quanh trục ngang của xe (dương: chúc về phía mũi) và độ cao
  // của mặt đầu đo so với sân. Thân đầu đo xoay quanh mép trên (chỗ gắn vào mạch), nên nghiêng thì mép
  // trước/sau của mặt đo hạ thấp hơn tâm: giữ mép thấp nhất cách sân ít nhất 2 mm.
  const IR = { caoChuan: 0.6, caoMax: 1.2, nghiengMax: 30, buocNghieng: 5, dai: 0.7, nuaMat: 0.51, hoTia: 0.15 };
  function gioiHanIR(nghieng) {
    let g = Math.round((Number(nghieng) || 0) / IR.buocNghieng) * IR.buocNghieng;
    g = kep(g, -IR.nghiengMax, IR.nghiengMax);
    let caoMin = Math.max(0.3, Math.ceil((0.2 + IR.nuaMat * Math.sin(Math.abs(g) * PI / 180)) * 10 - 1e-9) / 10);
    return { nghieng: g, caoMin: tron2(caoMin) };
  }

  // Nửa bề ngang (theo x) của cảm biến siêu âm khi xoay một góc (độ): vỏ 4,7 × 1,0 cm và hai đầu tròn
  function nuaRongSieuAm(goc) {
    let a = Math.abs(goc) * PI / 180, c = Math.cos(a), s = Math.sin(a);
    return Math.max(2.35 * c + 1.0 * s, 2.1 * c + 1.7 * s);
  }
  const gioiHanSieuAmX = (goc) => Math.max(0, Math.floor((NUA_THANH_GIA - nuaRongSieuAm(goc)) * 100) / 100);
  // Khoảng trượt (u nhỏ nhất, lớn nhất) của cảm biến siêu âm trên giá, khi xoay một góc
  function gioiHanU(gia, goc) {
    if (GIA[gia].u) return GIA[gia].u.slice();
    let g = gioiHanSieuAmX(goc);
    return [-g, g];
  }

  // Cảm biến trên giá bên ở vị trí u, góc goc có nằm ngang bánh xe không (theo chiều dọc thân xe)
  const nganBanh = (gia, u, goc) => !!GIA[gia].caoTrenBanh && u - nuaRongSieuAm(goc) < TS.rBanh + 0.45;      // 0,45 cm: khi xoay, vỏ còn bị đẩy ra và lệch về phía bánh
  // Khoảng độ cao (tâm cảm biến so với mặt sân, cm) cho phép tại vị trí u, góc goc
  function gioiHanCao(gia, u, goc) {
    let g = GIA[gia];
    return [nganBanh(gia, u, goc) ? g.caoTrenBanh : g.cao[0], g.cao[1]];
  }

  // Hai mô-đun trên nắp có chồng lên nhau không
  function chongNap(a, b) {
    let ka = KHUON_NAP[a.loai], kb = KHUON_NAP[b.loai];
    return Math.abs(a.x - b.x) < ka.nx + kb.nx - 1e-6 && a.z + ka.z0 < b.z + kb.z1 - 1e-6 && b.z + kb.z0 < a.z + ka.z1 - 1e-6;
  }
  // Khoảng tâm của mô-đun trên nắp nằm gọn trong nắp
  function mienNap(loai) {
    let k = KHUON_NAP[loai];
    return { x0: NAP.x0 + k.nx, x1: NAP.x1 - k.nx, z0: NAP.z0 - k.z0, z1: NAP.z1 - k.z1 };
  }

  // Kiểm tra một vị trí: trả về null nếu đặt được, hoặc câu giải thích vì sao không.
  // ds: các mô-đun khác cùng chỗ gắn (không kể mô-đun đang đặt).
  function loiDuoi(loai, x, ds) {
    if (Math.abs(x) > X_DUOI[loai] + 1e-6) return 'Mô-đun dưới mũi chỉ đặt được cách giữa tối đa ' + so1(X_DUOI[loai]) + ' cm, xa hơn thì đụng chân giá.';
    let gan = ds.find((m) => Math.abs(m.x - x) < KC_DUOI - 1e-6);
    if (gan) return 'Hai mô-đun dưới mũi phải cách nhau ít nhất ' + so1(KC_DUOI) + ' cm vì mỗi mô-đun rộng 1,5 cm.';
    return null;
  }
  function loiGam(x, z, ds) {
    if (Math.abs(x) > GAM.x + 1e-6) return 'Mắt dò line dưới gầm chỉ đặt được cách giữa tối đa ' + so1(GAM.x) + ' cm, xa hơn thì mạch lòi ra ngoài tấm đáy.';
    if (z < GAM.z0 - 1e-6) return 'Mắt dò line dưới gầm phải đặt từ z = ' + so1(GAM.z0) + ' cm trở lên: phía sau mạch còn ổ cắm và đầu dây.';
    if (z > GAM.z1 + 1e-6) return 'Mắt dò line dưới gầm chỉ đặt tới z = ' + so1(GAM.z1) + ' cm, trước đó là thanh dưới mũi xe.';
    if (Math.abs(x) < GAM.xBi + GAM.nuaRong - 1e-6 && z + GAM.nuaDai > GAM.zBi + 1e-6) return 'Chỗ này đụng vỏ bi tự do. Dời mắt dò line ra sau hoặc sang bên.';
    if (ds.some((m) => Math.abs(m.x - x) < KC_GAM - 1e-6)) return 'Hai mắt dò line dưới gầm phải lệch nhau ít nhất ' + so1(KC_GAM) + ' cm theo bề ngang, vì dây của mỗi mắt chạy thẳng dọc gầm ra phía đuôi.';
    return null;
  }
  function loiNap(m, ds) {
    let mi = mienNap(m.loai);
    if (m.x < mi.x0 - 1e-6 || m.x > mi.x1 + 1e-6 || m.z < mi.z0 - 1e-6 || m.z > mi.z1 + 1e-6) return 'Mô-đun và ổ cắm của nó phải nằm gọn trên nắp mạch chủ.';
    if (ds.some((n) => chongNap(m, n))) return 'Hai mô-đun trên nắp không được chồng lên nhau.';
    return null;
  }
  const so1 = (x) => String(tron2(x)).replace('.', ',');

  // Đưa cấu hình về dạng chuẩn:
  //   { banh, sieuAm, sieuAmX, sieuAmGoc, duoi: [{loai, x}] (trái sang phải), tren: [{loai, x, z}] (trái sang phải) }
  // kèm các trường suy ra: lo, nap (null nếu có mô-đun lệch khỏi lỗ/chỗ cũ), doLine, cham, cachMat, gyro, gps.
  // Vẫn nhận kiểu viết cũ: lo, nap (mảng) hoặc doLine (số mắt), cachMat (cm giữa hai mắt), cham, gyro, gps.
  // Mô-đun vượt số lượng, ra ngoài chỗ gắn hoặc chồng lên mô-đun đứng trước nó trong danh sách thì bị bỏ.
  function chuanHoaCauHinh(vao) {
    vao = vao || {};
    let c = { banh: vao.banh || MAC_DINH.banh };
    // --- Siêu âm: mỗi giá nhiều nhất một cảm biến ---
    let saVao = Array.isArray(vao.sa) ? vao.sa
      : ((vao.sieuAm == null ? MAC_DINH.sieuAm : !!vao.sieuAm) ? [{ gia: 'truoc', u: vao.sieuAmX, goc: vao.sieuAmGoc }] : []);
    c.sa = [];
    saVao.forEach(function(m) {
      if (!m || !GIA[m.gia] || c.sa.some((n) => n.gia == m.gia)) return;
      let goc = tron2(kep(Number(m.goc) || 0, -GOC_SA, GOC_SA)), gh = gioiHanU(m.gia, goc);
      let u = tron2(kep(Number(m.u) || 0, gh[0], gh[1])), ch = gioiHanCao(m.gia, u, goc), cao = m.cao == null || !isFinite(Number(m.cao)) ? GIA[m.gia].y : Number(m.cao);
      c.sa.push({ gia: m.gia, u: u, goc: goc, cao: tron2(kep(Math.round(cao * 10) / 10, ch[0], ch[1])) });
    });
    c.sa.sort((a, b) => DS_GIA.indexOf(a.gia) - DS_GIA.indexOf(b.gia));

    // --- Dưới mũi ---
    let duoiVao;
    if (Array.isArray(vao.duoi)) duoiVao = vao.duoi;
    else if (Array.isArray(vao.lo)) duoiVao = X_LO.map((x, i) => ({ loai: vao.lo[i], x: x }));
    else if (vao.doLine != null || vao.cachMat != null || vao.cham != null) {
      let n = Math.max(0, Math.min(3, Math.round(Number(vao.doLine == null ? 2 : vao.doLine) || 0)));
      let cach = Math.max(1.5, Math.min(3, Number(vao.cachMat) || 3));
      let cham = vao.cham == null ? true : !!vao.cham;
      duoiVao = [];
      for (let i = 0; i < n; i++) duoiVao.push({ loai: 'doLine', x: (i - (n - 1) / 2) * cach });
      if (cham) {
        let xs = duoiVao.map((m) => m.x), tren5 = xs.every((x) => X_LO.some((l) => Math.abs(l - x) < 1e-6));
        let thu = tren5 ? [3, -3, 0, 1.5, -1.5] : [0, -1.5, 1.5, -3, 3];
        let xc = thu.find((x) => xs.every((m) => Math.abs(m - x) >= KC_DUOI - 1e-6));
        if (xc != null) duoiVao.push({ loai: 'cham', x: xc });
      }
    } else duoiVao = X_LO.map((x, i) => ({ loai: MAC_DINH.lo[i], x: x }));
    let dem = { doLine: 0, cham: 0 };
    c.duoi = [];
    duoiVao.forEach(function(m) {
      if (!m || (m.loai != 'doLine' && m.loai != 'cham') || dem[m.loai] >= TOI_DA_DUOI[m.loai]) return;
      let x = tron2(Number(m.x) || 0);
      if (loiDuoi(m.loai, x, c.duoi)) return;
      dem[m.loai]++;
      c.duoi.push({ loai: m.loai, x: x });
    });
    c.duoi.sort((a, b) => a.x - b.x);

    // --- Dưới gầm ---
    c.gam = [];
    (Array.isArray(vao.gam) ? vao.gam : []).forEach(function(m) {
      if (!m || m.loai != 'doLine' || c.gam.length >= GAM.toiDa) return;
      let x = tron2(Number(m.x) || 0), z = tron2(Number(m.z) || 0);
      if (loiGam(x, z, c.gam)) return;
      c.gam.push({ loai: 'doLine', x: x, z: z });
    });
    c.gam.sort((a, b) => a.x - b.x);

    // --- Trên nắp ---
    let trenVao;
    if (Array.isArray(vao.tren)) trenVao = vao.tren;
    else {
      let nap = Array.isArray(vao.nap) ? vao.nap
        : (vao.gyro != null || vao.gps != null ? [(vao.gyro == null ? true : vao.gyro) ? 'gyro' : null, (vao.gps == null ? true : vao.gps) ? 'gps' : null] : MAC_DINH.nap);
      trenVao = X_NAP.map((x, i) => ({ loai: nap[i], x: x }));
    }
    c.tren = [];
    trenVao.forEach(function(m) {
      if (!m || !KHUON_NAP[m.loai] || c.tren.some((n) => n.loai == m.loai)) return;
      let n = { loai: m.loai, x: tron2(Number(m.x) || 0), z: tron2(m.z == null ? KHUON_NAP[m.loai].z : Number(m.z) || 0) };
      if (m.loai == 'servo') {
        let b = SERVO.BUOC_GOC;
        n.nghieng = kep(Math.round((Number(m.nghieng) || 0) / b) * b, 0, 90);
        let xv = Math.round((Number(m.xoay) || 0) / b) * b;
        n.xoay = ((xv % 360) + 540) % 360 - 180;
        n.tay = TAY[m.tay] ? m.tay : 'don';
        let vaoGan = Array.isArray(m.gan) ? m.gan : [];
        n.gan = TAY[n.tay].diem.map(() => null);
        n.gan.forEach(function(x, i) {
          let l = vaoGan[i];
          if (l && !loiGanServo(n.tay, n.gan, i, l)) n.gan[i] = l;
        });
      }
      if (loiNap(n, c.tren)) return;
      c.tren.push(n);
    });
    c.tren.sort((a, b) => a.x - b.x);

    // --- Mạch chủ chỉ có 8 ổ: bớt siêu âm (từ giá cuối danh sách), rồi mô-đun trên nắp, rồi dưới mũi ---
    let sv = c.tren.find((m) => m.loai == 'servo');
    let soGan = () => sv ? sv.gan.filter(Boolean).length : 0;
    let boGan = () => { let i = sv.gan.map((x) => !!x).lastIndexOf(true); sv.gan[i] = null; };
    // khay có 4 siêu âm, 7 mắt dò line: cảm biến trên tay quay dùng chung số đó
    if (sv) {
      while (c.sa.length + sv.gan.filter((x) => x == 'sieuAm').length > TOI_DA.sieuAm) sv.gan[sv.gan.lastIndexOf('sieuAm')] = null;
      while (c.duoi.concat(c.gam).filter((m) => m.loai == 'doLine').length + sv.gan.filter((x) => x == 'doLine').length > TOI_DA.doLine) sv.gan[sv.gan.lastIndexOf('doLine')] = null;
    }
    while (c.sa.length + c.duoi.length + c.tren.length + c.gam.length + soGan() > SO_O) {
      if (c.sa.length > 1) c.sa.pop(); else if (c.gam.length) c.gam.pop(); else if (soGan()) boGan(); else if (c.tren.length) { c.tren.pop(); sv = c.tren.find((m) => m.loai == 'servo'); } else c.duoi.pop();
    }

    // --- Chế độ đọc của mắt dò line: 'tuongTu' (chân A0, mức 0–100) hoặc 'so' (chân D0, chỉ bật/tắt) ---
    c.ir = vao.ir == 'so' ? 'so' : 'tuongTu';
    // --- Tư thế đầu đo TCRT5000 (chung cho mắt dưới mũi và dưới gầm) ---
    let gioi = gioiHanIR(vao.nghiengIR);
    c.nghiengIR = gioi.nghieng;
    c.caoIR = vao.caoIR == null || !isFinite(Number(vao.caoIR)) ? IR.caoChuan : tron2(kep(Math.round(Number(vao.caoIR) * 10) / 10, gioi.caoMin, IR.caoMax));

    // --- Sơn ---
    let sonVao = vao.son || {};
    c.son = {};
    ['khung', 'canGat', 'vanh'].forEach(function(k) {
      let m = typeof sonVao[k] == 'string' ? sonVao[k].toLowerCase() : null;
      c.son[k] = /^#[0-9a-f]{6}$/.test(m || '') ? m : null;
    });

    // --- Trường suy ra (cho mã cũ và cho kiểu viết lo/nap) ---
    let tenLo = X_LO.map(() => null), deuTrenLo = c.duoi.every(function(m) {
      let i = X_LO.findIndex((x) => Math.abs(x - m.x) < 1e-6);
      if (i >= 0) tenLo[i] = m.loai;
      return i >= 0;
    });
    c.lo = deuTrenLo ? tenLo : null;
    let tenNap = [null, null], deuTrenNap = c.tren.every(function(m) {
      let i = X_NAP.findIndex((x) => Math.abs(x - m.x) < 1e-6);
      if (i >= 0 && m.loai != 'servo' && Math.abs(m.z - KHUON_NAP[m.loai].z) < 1e-6) { tenNap[i] = m.loai; return true; }
      return false;
    });
    c.nap = deuTrenNap ? tenNap : null;
    let mat = c.duoi.filter((m) => m.loai == 'doLine');
    c.doLine = mat.length;
    c.doLineGam = c.gam.length;
    c.cham = c.duoi.some((m) => m.loai == 'cham');
    if (mat.length == 2) c.cachMat = tron2(mat[1].x - mat[0].x);
    c.gyro = c.tren.some((m) => m.loai == 'gyro');
    let truoc = c.sa.find((m) => m.gia == 'truoc');
    c.sieuAm = !!truoc;
    c.sieuAmX = truoc ? truoc.u : 0;
    c.sieuAmGoc = truoc ? truoc.goc : 0;
    c.soSieuAm = c.sa.length;
    c.gps = c.tren.some((m) => m.loai == 'gps');
    c.servo = !!c.tren.find((m) => m.loai == 'servo');
    return c;
  }

  // Gán n mô-đun (toạ độ xs, đã xếp tăng dần) vào n trong các ổ ở toạ độ xo, giữ thứ tự trái sang phải
  // để dây không bắt chéo, tổng độ lệch nhỏ nhất. Trả về chỉ số ổ cho từng mô-đun.
  function ganO(xs, xo) {
    let n = xs.length, m = xo.length, tot = null;
    (function thu(i, j, chon, tong) {
      if (i == n) { if (!tot || tong < tot.tong - 1e-9) tot = { chon: chon.slice(), tong: tong }; return; }
      for (let k = j; k <= m - (n - i); k++) { chon.push(k); thu(i + 1, k + 1, chon, tong + Math.abs(xs[i] - xo[k])); chon.pop(); }
    })(0, 0, [], 0);
    return tot ? tot.chon : [];
  }

  // ---------- Lắp xe ----------
  function lapXe(cauHinhVao) {
    let c = chuanHoaCauHinh(cauHinhVao);
    // Vị trí (x) và ổ mạch chủ của các mô-đun dưới mũi xe
    const X_O_TRUOC = [-3.4, -1.7, 0, 1.7, 3.4], X_O_SAU = [-3, 0, 3];
    let oDuoi = ganO(c.duoi.map((m) => m.x), X_O_TRUOC).map((k) => k + 1);
    let xMat = [], oMat = [], iMat = [], xCham = null, oCham = 4, iCham = null;
    c.duoi.forEach(function(m, i) {
      if (m.loai == 'doLine') { xMat.push(m.x); oMat.push(oDuoi[i]); iMat.push(i); }
      else { xCham = m.x; oCham = oDuoi[i]; iCham = i; }
    });
    let oTren = ganO(c.tren.map((m) => m.x), X_O_SAU).map((k) => k + 6);
    // Siêu âm: mỗi cảm biến lấy ổ còn trống gần chỗ cắm dây của nó nhất (giá trước chỉ xét hàng ổ trước,
    // vì hàng trước luôn còn ít nhất một ổ: dưới mũi có tối đa 4 mô-đun)
    let viTriO = (o) => o <= 5 ? [X_O_TRUOC[o - 1], 7.55] : [X_O_SAU[o - 6], -0.45];
    let daDung = oDuoi.concat(oTren), oSa = {};
    c.sa.forEach(function(m) {
      let g = GIA[m.gia], p = g.truc == 'x' ? [m.u, m.gia == 'truoc' ? 10.55 : g.mat - 0.85] : [g.mat + Math.sign(g.mat) * 0.85, m.u];
      let ung = [1, 2, 3, 4, 5, 6, 7, 8].filter((o) => daDung.indexOf(o) < 0 && (m.gia != 'truoc' || o <= 5));
      ung.sort((a, b) => Math.hypot(viTriO(a)[0] - p[0], viTriO(a)[1] - p[1]) - Math.hypot(viTriO(b)[0] - p[0], viTriO(b)[1] - p[1]) || a - b);
      oSa[m.gia] = ung[0];
      daDung.push(ung[0]);
    });
    // Mắt dò line dưới gầm: dây vòng lên sau vách đuôi, nên lấy ổ còn trống gần phía đuôi nhất (hàng sau trước)
    let oGam = c.gam.map(function(m) {
      let ung = [1, 2, 3, 4, 5, 6, 7, 8].filter((o) => daDung.indexOf(o) < 0);
      ung.sort((a, b) => Math.hypot(viTriO(a)[0] - m.x, viTriO(a)[1] + 4.6) - Math.hypot(viTriO(b)[0] - m.x, viTriO(b)[1] + 4.6) || a - b);
      daDung.push(ung[0]);
      return ung[0];
    });
    // Cảm biến trên tay quay servo: ổ còn trống gần servo nhất
    let sv = c.tren.find((m) => m.loai == 'servo');
    let oGanServo = sv ? sv.gan.map(function(l) {
      if (!l) return null;
      let ung = [1, 2, 3, 4, 5, 6, 7, 8].filter((o) => daDung.indexOf(o) < 0);
      ung.sort((a, b) => Math.hypot(viTriO(a)[0] - sv.x, viTriO(a)[1] - sv.z) - Math.hypot(viTriO(b)[0] - sv.x, viTriO(b)[1] - sv.z) || a - b);
      daDung.push(ung[0]);
      return ung[0];
    }) : [];
    let R = TS.rBanh, e = TS.dayKhung, y0 = TS.yDay, y1 = y0 + e;   // y1: mặt trên tấm đáy
    let than = [], day = [], camBien = [];
    let them = (ct) => { than.push(ct); return ct; };

    // --- Khung nhôm chữ U ---
    let yVach = 5.0;   // mép trên vách bên
    let vlKhung0 = c.son.khung ? 'son:' + c.son.khung : 'nhom';     // khung sơn màu hay để nhôm trần
    them({ id: 'khung', ten: 'Khung nhôm', nhom: 'khung', matDo: TS.nhom, khoi: [
      hop([9.0, e, 17.0], [0, y0 + e / 2, 4.5], vlKhung0, { vat: 0.04 }),                           // tấm đáy z -4…13
      hop([e, yVach - y1, 11.0], [-4.4, (y1 + yVach) / 2, 1.5], vlKhung0),                          // vách trái z -4…7
      hop([e, yVach - y1, 11.0], [4.4, (y1 + yVach) / 2, 1.5], vlKhung0),
      lang([[7.0, y1], [10.0, y1], [7.0, yVach]], e, 'x', [-4.4, 0, 0], vlKhung0),                  // vách vát xuống phía mũi
      lang([[7.0, y1], [10.0, y1], [7.0, yVach]], e, 'x', [4.4, 0, 0], vlKhung0),
      hop([8.6, yVach - y1, e], [0, (y1 + yVach) / 2, -3.9], vlKhung0),                             // vách sau
      hop([1.0, e, 11.0], [-3.8, yVach - e / 2, 1.5], vlKhung0),                                    // mép gập trong đỡ mạch chủ
      hop([1.0, e, 11.0], [3.8, yVach - e / 2, 1.5], vlKhung0)
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
    let zMat = 12.35;                           // mặt đầu đo cách sân c.caoIR (mặc định 6 mm)
    // Mạch có vỏ treo dưới tấm đáy (cột đệm nếu hạ thấp), thân TCRT5000 dưới mạch, xoay quanh mép trên theo
    // c.nghiengIR; tâm mặt đầu đo cách sân c.caoIR. Đèn phát phía mũi, bộ thu phía sau, tâm cách nhau 3 mm.
    function dauDo(x, z) {
      let g = c.nghiengIR * PI / 180, cao = c.caoIR;
      let huong = [0, -Math.cos(g), Math.sin(g)], len = [0, Math.cos(g), -Math.sin(g)], toi = [0, Math.sin(g), Math.cos(g)];
      let yTruc = cao + IR.dai * Math.cos(g);                 // mép trên của thân đầu đo
      let mat = [x, cao, z + IR.dai * Math.sin(g)];            // tâm mặt đầu đo
      let khoi = [hop([1.4, 0.5, 1.5], [x, yTruc + 0.25, z], 'mach_den', { vat: 0.04 })];
      let dem = y0 - (yTruc + 0.5);
      if (dem > 0.01) khoi.push(tru(0.5, dem, 'y', [x, y0 - dem / 2, z], 'nhua_den'));
      khoi.push(hop([0.58, IR.dai, 1.02], V.cong(mat, V.nhan(len, IR.dai / 2)), 'nhua_den', { xoay: [-c.nghiengIR, 0, 0] }));
      let mat2 = V.cong(mat, V.nhan(huong, 0.005));
      return { khoi: khoi, vt: mat, huong: huong, den: toi,
        trangTri: [
          { k: 'dia', d: 0.26, vt: V.cong(mat2, V.nhan(toi, IR.hoTia)), phap: huong, vl: 'led_hong_ngoai' },
          { k: 'dia', d: 0.26, vt: V.cong(mat2, V.nhan(toi, -IR.hoTia)), phap: huong, vl: 'kinh_den' }
        ] };
    }
    xMat.forEach(function(x, i) {
      let ten = c.doLine == 1 ? 'giữa' : (i == 0 ? 'trái' : (i == c.doLine - 1 ? 'phải' : 'giữa'));
      let o = oRJ25([x, y1 + KT_O[1] / 2, 12.05], 'sau');
      // thân TCRT5000 xoay dọc theo thân xe: đầu phát hồng ngoại phía mũi, đầu thu phía sau, cùng nằm trên một đường dọc
      let dd = dauDo(x, zMat);
      let ct = them({ id: 'doLine' + (i + 1), ten: 'Cảm biến dò line TCRT5000 (' + ten + ')', nhom: 'doLine', khoiLuong: 7.5, khoi: [o.khoi].concat(dd.khoi),
        trangTri: o.trangTri.concat(dd.trangTri) });
      let cg = cong();
      camBien.push({ loai: 'doLine', cong: cg, chiTiet: ct.id, x: x, lo: c.lo ? X_LO.indexOf(x) : null, duoi: iMat[i], vt: dd.vt, huong: dd.huong, den: dd.den, oMach: oMat[i], ten: ten, che: c.ir });
      let xo = oMach[oMat[i]].mieng[0];
      day.push(dayRJ25('day_' + ct.id, 'Dây RJ25 dò line ' + ten, o, oMach[oMat[i]],
        [[x + (xo - x) * 0.15, 2.9, 9.7], [x + (xo - x) * 0.6, 5.2, 9.25], [xo, 7.9, 9.15], [xo, 9.35, 8.45]], [1, 0, 0]));
    });

    // --- Mắt dò line dưới gầm: mạch đầu đo treo dưới tấm đáy, ổ RJ25 ngay sau mạch, dây chạy dọc gầm ra đuôi ---
    c.gam.forEach(function(m, i) {
      let x = m.x, z = m.z, ten = 'gầm ' + (i + 1);
      let o = oRJ25([x, y0 - KT_O[1] / 2, z - GAM.nuaDai - KT_O[2] / 2], 'sau');
      let dd = dauDo(x, z);
      let ct = them({ id: 'doLineGam' + (i + 1), ten: 'Cảm biến dò line TCRT5000 (' + ten + ')', nhom: 'doLine', khoiLuong: 7.5, khoi: [o.khoi].concat(dd.khoi),
        trangTri: o.trangTri.concat(dd.trangTri) });
      let cg = cong(), so = oGam[i], om = oMach[so];
      camBien.push({ loai: 'doLine', cong: cg, chiTiet: ct.id, x: x, z: z, gam: i, vt: dd.vt, huong: dd.huong, den: dd.den, oMach: so, ten: ten, che: c.ir });
      // dây: dọc gầm (sát tấm đáy) ra quá vách đuôi, vòng lên sát mặt ngoài vách đuôi, qua mép trên vách rồi tới ổ
      let zRa = o.mieng[2] - DAY.dauCam[2] - 0.5, xo = om.mieng[0];
      let moc = [];
      if (zRa - 1.0 > -3.4) moc.push([x, y0 - 0.25, zRa - 1.0]);
      moc.push([x, y0 - 0.3, -3.9], [x, y0 + 0.4, -4.35], [x, 4.4, -4.3], [x + (xo - x) * 0.3, 5.75, -4.1]);
      if (so <= 5) moc.push([x + (xo - x) * 0.7, 9.8, -1.0], [xo, 10.2, 4.5]);
      day.push(dayRJ25('day_' + ct.id, 'Dây RJ25 dò line ' + ten, o, om, moc, [1, 0, 0]));
    });

    // --- Cảm biến siêu âm kiểu HC-SR04 trên các giá (trước, trái, phải, sau) ---
    let vlKhung = c.son.khung ? 'son:' + c.son.khung : 'nhom';
    c.sa.forEach(function(m) {
      // Mô-đun bắt vào giá qua một khớp xoay ở giữa mặt sau. Khi xoay, mô-đun được đẩy ra ngoài vừa đủ để
      // góc vỏ không lấn vào giá, chốt khớp xoay nối mặt sau vỏ với giá.
      let g = GIA[m.gia], goc = m.goc, u = m.u, ySa = m.cao, dy = ySa - g.y;      // dy: nâng (+) hoặc hạ (−) so với mặc định
      let day0 = 2.35 * Math.sin(Math.abs(goc) * PI / 180);
      let q = Q.nhan(Q.truc([0, 1, 0], -goc), Q.truc([0, 1, 0], g.gocN));   // quay theo hướng giá, rồi xoay (dương: sang trái)
      let mat0 = g.truc == 'x' ? [u, ySa, g.mat] : [g.mat, ySa, u];          // giữa mặt giá chỗ bắt mô-đun
      let goc0 = V.cong(mat0, V.nhan(g.n, day0));                            // giữa mặt sau vỏ
      let ra = (p) => V.cong(goc0, Q.quay(q, p));
      let xoay = [0, g.gocN - goc, 0];
      let hau = m.gia == 'truoc' ? '' : '_' + m.gia;
      // ổ cắm dây: giá trước có ổ sau thanh ngang; giá khác có một tai ngang phía trên mô-đun, ổ nằm trên tai
      let o, khoiGia = [];
      if (m.gia == 'truoc') {
        o = oRJ25([u, 5.75 + dy, 10.55], 'len');
        let hc = 2.7 + dy;                                                                                            // chân dài thêm khi nâng giá
        khoiGia = [
          hop([0.6, hc, e], [-4.15, y1 + hc / 2, 11.3], vlKhung), hop([0.6, hc, e], [4.15, y1 + hc / 2, 11.3], vlKhung),   // hai chân
          hop([8.9, 2.4, e], [0, ySa, 11.3], vlKhung, { vat: 0.04 })                                                    // thanh ngang
        ];
      } else if (m.gia == 'sau') {
        let yTai = ySa + 1.1 + e / 2;
        o = oRJ25([u, yTai + e / 2 + KT_O[2] / 2, -5.05], 'len');
        khoiGia = [
          // tấm bắt vào vách sau: chân tấm luôn bắt ở chỗ cũ, nâng thì tấm dài lên, hạ thì tấm thòng xuống
          hop([8.9, 3.0 + Math.abs(dy), e], [0, g.y - 0.2 + dy / 2, g.mat + e / 2], vlKhung, { vat: 0.04 }),
          hop([1.7, e, 1.7], [u, yTai, -5.05], vlKhung)                                                               // tai đỡ ổ cắm
        ];
      } else {
        let s = Math.sign(g.mat), yTai = ySa + 1.1 + e / 2;
        o = oRJ25([s * 5.55, yTai + e / 2 + KT_O[2] / 2, u], 'len');
        khoiGia = [
          // tấm bắt vào vách bên: từ mép dưới (4 cm, hoặc thấp hơn khi hạ cảm biến) lên tới đỉnh vỏ cảm biến
          hop([e, ySa + 1.1 - Math.min(4.0, ySa - 1.5), 3.0], [g.mat - s * e / 2, (ySa + 1.1 + Math.min(4.0, ySa - 1.5)) / 2, u], vlKhung, { vat: 0.04 }),
          hop([1.7, e, 1.7], [s * 5.55, yTai, u], vlKhung)                                                            // tai đỡ ổ cắm
        ];
      }
      let khoiSa = [
        hop([4.7, 2.2, 1.0], ra([0, 0, 0.5]), 'nhua_xanh', { vat: 0.08, xoay: xoay }),           // vỏ mô-đun
        tru(1.6, 1.2, 'z', ra([-1.3, 0, 1.6]), 'bac', { xoay: xoay }),                            // đầu phát (T)
        tru(1.6, 1.2, 'z', ra([1.3, 0, 1.6]), 'bac', { xoay: xoay }),                             // đầu thu (R)
        o.khoi
      ];
      if (day0 > 0.05) khoiSa.push(tru(0.8, day0, g.truc == 'x' ? 'z' : 'x', V.cong(mat0, V.nhan(g.n, day0 / 2)), vlKhung));   // chốt khớp xoay
      let huong = Q.quay(q, [0, 0, 1]);
      let ct = them({ id: 'sieuAm' + hau, ten: 'Cảm biến siêu âm HC-SR04 (' + g.ten + ')', nhom: 'sieuAm', khoiLuong: 12, khoi: khoiSa,
        trangTri: o.trangTri.concat([
          { k: 'nhan', kt: [1.3, 1.3], vt: ra([-1.3, 0, 2.2]), phap: huong, len: [0, 1, 0], ve: 'luoi_sieu_am', tron: true },
          { k: 'nhan', kt: [1.3, 1.3], vt: ra([1.3, 0, 2.2]), phap: huong, len: [0, 1, 0], ve: 'luoi_sieu_am', tron: true },
          { k: 'nhan', kt: [0.8, 0.5], vt: ra([0, 0.6, 1.0]), phap: huong, len: [0, 1, 0], ve: 'chu', chu: 'T  R' }
        ]) });
      them({ id: 'giaSieuAm' + hau, ten: 'Giá đỡ cảm biến siêu âm (' + g.ten + ')', nhom: 'sieuAm', matDo: TS.nhom, khoi: khoiGia, trangTri: [] });
      let so = oSa[m.gia];
      camBien.push({ loai: 'sieuAm', cong: cong(), chiTiet: ct.id, vt: ra([0, 0, 2.2]), huong: huong, xoay: q, gia: m.gia, u: u, x: g.truc == 'x' ? u : g.mat, goc: goc, cao: ySa,
        ten: c.sa.length > 1 ? g.ten : '', dau: [ra([-1.3, 0, 2.2]), ra([1.3, 0, 2.2])], oMach: so });
      let mo = oMach[so].mieng, xo = mo[0];
      let moc;
      if (m.gia == 'truoc' && so <= 5) moc = [[u + (xo - u) * 0.3, 8.9 + dy, 10.1], [u + (xo - u) * 0.8, 9.5 + Math.max(0, dy * 0.6), 8.8]];
      else {
        // từ ổ trên tai, vòng lên trên rồi đi tới ổ trên mạch chủ (hàng trước: ổ hướng lên; hàng sau: ổ hướng ra sau)
        let dau = V.cong(o.mieng, [0, 1.6, 0]), cao = Math.max(o.mieng[1] + 1.6, 10.6);
        let toi = so <= 5 ? [xo, cao, mo[2]] : [xo, mo[1] + 1.4, mo[2] - 1.6];
        moc = [dau, [(dau[0] + toi[0]) / 2, cao, (dau[2] + toi[2]) / 2], toi];
      }
      day.push(dayRJ25('day_sieuAm' + hau, 'Dây RJ25 siêu âm ' + g.ten, o, oMach[so], moc, [1, 0, 0]));
    });

    // --- Cảm biến chạm: công tắc hành trình + tấm cản treo bản lề phía mũi ---
    let canGat = null;
    if (c.cham) {
      let o = oRJ25([xCham, y1 + KT_O[1] / 2, 12.05], 'sau');
      let yCt = y1 + KT_O[1] + 0.5;
      let ct = them({ id: 'cham', ten: 'Cảm biến chạm (công tắc hành trình)', nhom: 'cham', khoiLuong: 9, khoi: [
        o.khoi,
        hop([1.5, 1.0, 0.64], [xCham, yCt, 12.7], 'nhua_den', { vat: 0.04 }),                     // thân công tắc
        tru(0.3, 0.5, 'x', [xCham, yCt, 13.14], 'do')                                             // nút bấm tì vào tấm cản
      ], trangTri: o.trangTri });
      them({ id: 'giaCham', ten: 'Tai bản lề tấm cản', nhom: 'cham', matDo: TS.nhom, khoi: [
        hop([e, 2.5, 0.5], [-4.2, y1 + 1.25, 13.0], vlKhung0), hop([e, 2.5, 0.5], [4.2, y1 + 1.25, 13.0], vlKhung0)
      ], trangTri: [] });
      // Tấm cản: vật thể riêng, quay quanh bản lề nằm ngang ở mép trên, lò xo đẩy ra trước
      let yBanLe = y1 + 2.3, zBanLe = 13.3;
      canGat = {
        id: 'tamCan', ten: 'Tấm cản', nhom: 'cham', matDo: TS.abs,
        tam: [0, yBanLe, zBanLe], truc: [1, 0, 0],
        // khối viết trong hệ gắn với bản lề (tấm treo thẳng xuống, mặt sau trùng mặt phẳng bản lề)
        khoi: [
          hop([10.0, 2.2, 0.4], [0, -1.1, 0.2], c.son.canGat ? 'son:' + c.son.canGat : 'nhua_cam', { vat: 0.06 }),
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
      camBien.push({ loai: 'cham', cong: cg, chiTiet: ct.id, x: xCham, oMach: oCham, lo: c.lo ? X_LO.indexOf(xCham) : null, duoi: iCham });
      let xo = oMach[oCham].mieng[0];
      day.push(dayRJ25('day_cham', 'Dây RJ25 cảm biến chạm', o, oMach[oCham],
        [[xCham + (xo - xCham) * 0.15, 2.9, 9.7], [xCham + (xo - xCham) * 0.6, 5.2, 9.25], [xo, 7.9, 9.15], [xo, 9.35, 8.45]], [1, 0, 0]));
    }

    // --- Gyro và GPS đặt trên nắp mạch chủ ---
    let yNap = yMat + 1.24;
    function dayVongSau(id, ten, o, so) {
      let m = oMach[so].mieng, zc = m[2] - DAY.dauCam[2] - 0.5;
      let yg = (o.mieng[1] + m[1]) / 2, r = (o.mieng[1] - m[1]) / 2;
      return dayRJ25(id, ten, o, oMach[so], [[(o.mieng[0] + m[0]) / 2, o.mieng[1], zc - 0.25], [m[0], yg, zc - 0.25 - r]], [1, 0, 0]);
    }
    for (let loai of ['gyro', 'gps']) {      // gyro luôn nhận số cổng trước GPS
      let ben = c.tren.findIndex((m) => m.loai == loai);
      if (ben < 0) continue;
      let x = c.tren[ben].x, z = c.tren[ben].z, so = oTren[ben], dz = z - KHUON_NAP[loai].z;
      let o = oRJ25([x, yNap + KT_O[1] / 2, 2.0 + dz], 'sau');
      if (loai == 'gyro') {
        let ct = them({ id: 'gyro', ten: 'Cảm biến gyro (con quay)', nhom: 'gyro', khoiLuong: 6, khoi: [
          o.khoi, hop([2.2, 0.8, 2.0], [x, yNap + 0.4, z], 'nhua_tim', { vat: 0.06 })
        ], trangTri: o.trangTri.concat([
          { k: 'nhan', kt: [1.8, 1.6], vt: [x, yNap + 0.8, z], phap: [0, 1, 0], len: [0, 0, 1], ve: 'nhan_gyro' }
        ]) });
        camBien.push({ loai: 'gyro', cong: cong(), chiTiet: ct.id, vt: [x, yNap + 0.4, z], oMach: so, nap: c.nap ? X_NAP.indexOf(x) : null, tren: ben });
        day.push(dayVongSau('day_gyro', 'Dây RJ25 gyro', o, so));
      } else {
        let ct = them({ id: 'gps', ten: 'Mô-đun GPS', nhom: 'gps', khoiLuong: 13, khoi: [
          o.khoi, hop([2.6, 0.9, 2.6], [x, yNap + 0.45, z], 'nhua_xam', { vat: 0.06 }),
          hop([1.5, 0.4, 1.5], [x, yNap + 1.1, z], 'gom', { vat: 0.04 })                         // ăng-ten gốm
        ], trangTri: o.trangTri.concat([
          { k: 'nhan', kt: [1.1, 1.1], vt: [x, yNap + 1.3, z], phap: [0, 1, 0], len: [0, 0, 1], ve: 'antenna' }
        ]) });
        camBien.push({ loai: 'gps', cong: cong(), chiTiet: ct.id, vt: [x, yNap + 1.3, z], oMach: so, nap: c.nap ? X_NAP.indexOf(x) : null, tren: ben });
        day.push(dayVongSau('day_gps', 'Dây RJ25 GPS', o, so));
      }
    }

    // --- Servo SG90 trên trụ đỡ, tay quay và cảm biến gắn trên tay quay (vật thể riêng, khớp bản lề) ---
    let servo = null;
    if (sv) {
      let iSv = c.tren.indexOf(sv), so = oTren[iSv], q = quayServo(sv);
      let truc = [sv.x, yNap + SERVO.caoTruc, sv.z];            // tâm mặt dưới tay quay, trên trục servo
      let raXe = (p) => V.cong(truc, Q.quay(q, p));               // điểm trong hệ servo → hệ xe
      let raTay = (p) => Q.quay(q, p);                            // điểm trong hệ servo → so với tâm tay quay (hệ xe)
      let qCua = (ez) => Q.nhan(q, Q.tuTruc(V.co([0, 1, 0], ez), [0, 1, 0], ez));     // hệ riêng: z theo ez, y theo trục servo
      // thân servo (cố định vào xe): vỏ, tai bắt vít, cổ trục; trục ra lệch về phía tay chính
      let khoiThan = [
        hop([1.22, 2.25, 2.27], raXe([0, -1.525, -0.55]), 'nhua_xanh_duong', { xoay: q, vat: 0.08 }),
        hop([1.22, 0.25, 3.2], raXe([0, -0.75, -0.55]), 'nhua_xanh_duong', { xoay: q }),
        tru(1.1, 0.3, 'y', raXe([0, -0.25, 0]), 'nhua_xanh_duong', { xoay: q }),
        tru(0.5, 0.1, 'y', raXe([0, -0.05, 0]), 'thep_ma', { xoay: q })
      ];
      // trụ đỡ: đế bắt trên nắp, cột lên tới giữa thân servo
      let tamThan = raXe([0, -1.525, -0.55]), yDe = yNap + 0.15;
      let khoiTru = [
        hop([2.0, 0.3, 2.0], [sv.x, yDe, sv.z], 'nhom', { vat: 0.04 }),
        hop([0.8, Math.max(0.2, tamThan[1] - yDe), 0.8], [tamThan[0], (tamThan[1] + yDe) / 2, tamThan[2]], 'nhom')
      ];
      let o = oRJ25([sv.x, yNap + KT_O[1] / 2, sv.z - 1.0 - KT_O[2] / 2], 'sau');
      them({ id: 'servoThan', ten: 'Servo SG90 (thân) và trụ đỡ', nhom: 'servo', khoiLuong: 9 + 6, khoi: khoiThan.concat(khoiTru, [o.khoi, hop([1.6, 0.5, 1.0], [sv.x, yNap + 0.25, sv.z - 1.0 - KT_O[2] - 0.5], 'mach_den')]),
        trangTri: o.trangTri.concat([{ k: 'nhan', kt: [1.0, 0.6], vt: raXe([0.62, -1.525, -0.55]), phap: Q.quay(q, [1, 0, 0]), len: Q.quay(q, [0, 1, 0]), ve: 'chu', chu: 'SG90' }]) });
      day.push(dayVongSau('day_servo', 'Dây RJ25 servo', o, so));
      // phần quay: tay quay và cảm biến (toạ độ so với tâm tay quay, theo hướng xe)
      let khoiTay = [tru(0.75, 0.35, 'y', raTay([0, 0.025, 0]), 'nhua_trang', { xoay: q })], tt = [];
      let td = (phi, dai, rong, tam) => hop([rong, 0.2, dai], raTay(V.nhan(huongTay(phi), tam).map((x, i) => i == 1 ? 0.1 : x)), 'nhua_trang', { xoay: qCua(Q.quay([0, 0, 0, 1], huongTay(phi))) });
      if (sv.tay == 'don') khoiTay.push(td(0, 2.6, 0.5, 0.9));
      else if (sv.tay == 'doi') khoiTay.push(td(0, 4.0, 0.5, 0));
      else if (sv.tay == 'chuThap') khoiTay.push(td(0, 2.6, 0.45, 0), td(90, 2.6, 0.45, 0));
      else khoiTay.push(tru(2.1, 0.2, 'y', raTay([0, 0.1, 0]), 'nhua_trang', { xoay: q }));
      let camServo = [];
      TAY[sv.tay].diem.forEach(function(d, i) {
        let l = sv.gan[i];
        if (!l) return;
        let ez = huongTay(d.phi), qs = qCua(ez);
        let ex = V.co([0, 1, 0], ez);
        let cuc = (p) => raTay(V.cong(V.cong(V.nhan(ex, p[0]), [0, p[1], 0]), V.nhan(ez, p[2])));      // điểm trong hệ riêng của cảm biến
        if (l == 'sieuAm') {
          let rb = d.r > 0 ? d.r : -0.5, hc = 1.45;
          khoiTay.push(
            hop([2.0, 0.15, 1.2], cuc([0, 0.275, rb + 0.5]), 'nhom', { xoay: qs }),
            hop([4.7, 2.2, 1.0], cuc([0, hc, rb + 0.5]), 'nhua_xanh', { xoay: qs, vat: 0.08 }),
            tru(1.6, 1.2, 'z', cuc([-1.3, hc, rb + 1.6]), 'bac', { xoay: qs }),
            tru(1.6, 1.2, 'z', cuc([1.3, hc, rb + 1.6]), 'bac', { xoay: qs }));
          let h = Q.quay(q, ez);
          tt.push({ k: 'nhan', kt: [1.3, 1.3], vt: cuc([-1.3, hc, rb + 2.2]), phap: h, len: Q.quay(q, [0, 1, 0]), ve: 'luoi_sieu_am', tron: true },
            { k: 'nhan', kt: [1.3, 1.3], vt: cuc([1.3, hc, rb + 2.2]), phap: h, len: Q.quay(q, [0, 1, 0]), ve: 'luoi_sieu_am', tron: true });
          camServo.push({ loai: 'sieuAm', vtTay: cuc([0, hc, rb + 2.2]), huong: h, xoay: qs, dau: [cuc([-1.3, hc, rb + 2.2]), cuc([1.3, hc, rb + 2.2])], i: i, khoiLuong: 10.5 });
        } else {
          khoiTay.push(
            hop([1.4, 1.5, 0.5], cuc([0, 1.1, d.r + 0.25]), 'mach_den', { xoay: qs, vat: 0.04 }),
            hop([0.58, 1.02, 0.7], cuc([0, 1.1, d.r + 0.85]), 'nhua_den', { xoay: qs }));
          let h = Q.quay(q, ez);
          tt.push({ k: 'dia', d: 0.3, vt: cuc([0, 1.35, d.r + 1.21]), phap: h, vl: 'led_hong_ngoai' },
            { k: 'dia', d: 0.3, vt: cuc([0, 0.85, d.r + 1.21]), phap: h, vl: 'kinh_den' });
          camServo.push({ loai: 'doLine', vtTay: cuc([0, 1.1, d.r + 1.2]), huong: h, i: i, khoiLuong: 6 });
        }
      });
      servo = { id: 'servo', ten: SERVO.ten + ' (tay quay)', tam: truc, truc: Q.quay(q, [0, -1, 0]), khoi: khoiTay, trangTri: tt,
        khoiLuong: 1 + camServo.reduce((s, x) => s + x.khoiLuong, 0), dongCo: SERVO, oMach: so, cauHinh: sv };
      // cảm biến trên tay quay nhận số cổng sau cùng
      camServo.forEach(function(x) {
        let cb = { loai: x.loai, cong: cong(), chiTiet: 'servo', servo: x.i, vtTay: x.vtTay, vt: V.cong(truc, x.vtTay), huong: x.huong, oMach: oGanServo[x.i], ten: 'servo' + (camServo.length > 1 ? ' ' + (x.i + 1) : '') };
        if (x.loai == 'sieuAm') Object.assign(cb, { xoay: x.xoay, dau: x.dau.map((p) => V.cong(truc, p)), gia: null });
        else cb.che = c.ir;
        camBien.push(cb);
      });
    }

    // --- Bánh xe (vật thể riêng, nối với khung bằng khớp bản lề có motor) ---
    let banh = [];
    for (let s of [-1, 1]) {
      let khoi = [
        // Lốp cao su mặt cắt tròn (bo mép gần hết bề rộng, còn 1 mm mặt phẳng ở giữa): lốp chạm sân ở đúng
        // giữa bề rộng, nên khoảng cách hai điểm chạm sân bằng đúng khoảng cách hai bánh. Lốp trụ phẳng tuyệt
        // đối cứng thì điểm chạm có thể nằm bất kì đâu trên bề rộng lốp: đo được xe quay lệch ±4 % so với lí thuyết.
        tru(TS.dBanh, TS.rongBanh, 'x', [0, 0, 0], 'cao_su', { dTrong: 5.0, kieu: 'lop', bo: TS.boLop }),
        tru(5.0, TS.rongBanh - 0.16, 'x', [0, 0, 0], c.son.vanh ? 'son:' + c.son.vanh : 'nhua_vanh', { trong: true, kieu: 'vanh' })  // vành (nằm trong hình trụ của lốp)
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
    return { cauHinh: c, than: than, banh: banh, bi: bi, canGat: canGat, servo: servo, camBien: camBien, thongSo: TS, dongCo: DONG_CO };
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
    let servo = null;
    if (banLap.servo) {
      chuanBi(banLap.servo);
      servo = H.khoiLuongTong([{ khoi: banLap.servo.khoi, khoiLuong: banLap.servo.khoiLuong }]);
    }
    // Trọng tâm cả xe (để báo cáo và chia tải lên bánh)
    let tong = than.m, tam = V.nhan(than.tam, than.m);
    banLap.banh.forEach(function(b, i) { tong += banh[i].m; tam = V.cong(tam, V.nhan(V.cong(b.tam, banh[i].tam), banh[i].m)); });
    tong += bi.m; tam = V.cong(tam, V.nhan(banLap.bi.tam, bi.m));
    if (canGat) { tong += canGat.m; tam = V.cong(tam, V.nhan(V.cong(banLap.canGat.tam, canGat.tam), canGat.m)); }
    if (servo) { tong += servo.m; tam = V.cong(tam, V.nhan(V.cong(banLap.servo.tam, servo.tam), servo.m)); }
    tam = V.nhan(tam, 1 / tong);
    return { than: than, banh: banh, bi: bi, canGat: canGat, servo: servo, tong: tong, tam: tam,
      taiBanh: 1 - tam[2] / banLap.thongSo.zBi };   // phần trọng lượng đè lên hai bánh chủ động
  }

  // Phần mô tả (HTML) và các trường tương thích của tệp robot, tính từ bản lắp.
  // Dùng chung cho scripts/robot/tao-xe.js và bảng lắp ráp trong trình duyệt.
  const TEN_CB = { doLine: 'Cảm biến dò line TCRT5000', sieuAm: 'Cảm biến siêu âm HC-SR04', cham: 'Cảm biến chạm', gyro: 'Gyro (con quay)', gps: 'GPS' };
  function moTaRobot(banLap, kl) {
    const so = (x, n) => x.toFixed(n == null ? 1 : n).replace('.', ',');
    let cb = banLap.camBien.map((c) => '<li>Cổng ' + c.cong.slice(2) + ' (ổ ' + c.oMach + ' trên mạch chủ): ' + TEN_CB[c.loai] + (c.ten ? ' ' + c.ten : '') + '</li>');
    return Object.assign({
      longerDescription:
        '<h3>Kích thước</h3><ul>' +
        '<li>Đường kính bánh: ' + so(banLap.thongSo.dBanh, 2) + ' cm (chu vi ' + banLap.thongSo.chuViBanh + ' cm)</li>' +
        '<li>Khoảng cách hai bánh (tâm đến tâm): ' + so(2 * banLap.thongSo.xBanh) + ' cm</li>' +
        '<li>Khối lượng: ' + Math.round(kl.tong) + ' g, ' + Math.round(kl.taiBanh * 100) + ' % đè lên hai bánh chủ động</li></ul>' +
        '<h3>Động cơ</h3><ul><li>Cổng A: Bánh trái</li><li>Cổng B: Bánh phải</li></ul>' +
        '<h3>Cảm biến</h3><ul>' + (cb.length ? cb.join('') : '<li>Chưa lắp cảm biến nào</li>') + '</ul>',
      sraXe: banLap.cauHinh
    }, truongTuongThich(banLap, kl));
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

  return { TS: TS, DONG_CO: DONG_CO, DAY: DAY, MAC_DINH: MAC_DINH, X_LO: X_LO, X_NAP: X_NAP, TOI_DA: TOI_DA, SO_O: SO_O, GIA: GIA, DS_GIA: DS_GIA, SON: SON, gioiHanU: gioiHanU, gioiHanCao: gioiHanCao, nganBanh: nganBanh, X_DUOI: X_DUOI, KC_DUOI: KC_DUOI, GOC_SA: GOC_SA, KHUON_NAP: KHUON_NAP, NAP: NAP,
    gioiHanSieuAmX: gioiHanSieuAmX, nuaRongSieuAm: nuaRongSieuAm, loiDuoi: loiDuoi, loiNap: loiNap, loiGam: loiGam, GAM: GAM, SERVO: SERVO, TAY: TAY, DS_TAY: DS_TAY, GAN_SERVO: GAN_SERVO, loiGanServo: loiGanServo, quayServo: quayServo, huongTay: huongTay, KC_GAM: KC_GAM, TOI_DA_DUOI: TOI_DA_DUOI, chongNap: chongNap, mienNap: mienNap, ganO: ganO, IR: IR, gioiHanIR: gioiHanIR, chuanHoaCauHinh: chuanHoaCauHinh, moTaRobot: moTaRobot, lapXe: lapXe, tinhXe: tinhXe, chuanBi: chuanBi, truongTuongThich: truongTuongThich };
});
