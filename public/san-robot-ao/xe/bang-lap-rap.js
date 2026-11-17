// Sân Robot Ảo – xe lắp mô-đun: bảng lắp ráp (kéo thả cảm biến lên xe, kiểu Tinkercad).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Bảng gồm khay linh kiện và sơ đồ xe nhìn từ trên xuống. Kéo một cảm biến từ khay thả vào một vùng gắn
// (hoặc bấm cảm biến rồi bấm vào vùng gắn) thì cấu hình lắp đổi theo, xe 3D bên cạnh được dựng lại ngay:
// hình, hitbox, khối lượng và số cổng đều tính lại từ cùng danh mục linh kiện (linh-kien.js).
//
// Vùng gắn (giới hạn xem linh-kien.js):
//   duoi   thanh dưới mũi xe     mắt dò line (tối đa 3), cảm biến chạm (tối đa 1), đặt ở x bất kì
//   gia    giá phía mũi          cảm biến siêu âm, trượt ngang và xoay quanh trục đứng
//   nap    nắp mạch chủ          gyro, GPS, đặt ở (x, z) bất kì trên nắp
//
// Cách kéo thả học theo Tinkercad:
//   - Bám lưới: vị trí làm tròn theo bước 0,5 cm (giữ Alt: 0,1 cm); góc xoay bám 15° (Shift: 45°, Alt: 5°).
//   - Hút: thả gần một chỗ đã có mô-đun khác thì mô-đun tự trượt tới chỗ trống gần nhất (trong 1,5 cm);
//     thả ngay lên mô-đun khác thì hai mô-đun đổi chỗ (hoặc mô-đun cũ về khay nếu kéo từ khay).
//   - Xem trước: trong lúc kéo, sơ đồ vẽ luôn kết quả nếu thả ở đây (bóng mờ, dây, số cổng, thước đo).
//   - Bàn phím: mũi tên dời mô-đun đang chọn, Q/E xoay siêu âm, Delete tháo, Enter trên thẻ khay tự gắn.
//
// Cấu hình của người dùng lưu trên máy (localStorage) và được dùng lại khi chọn "Xe lắp mô-đun".
var SRABangLapRap = new function() {
  'use strict';
  let self = this;
  const L = SRALinhKien, H = SRAHinhKhoi, V = H.V, Q = H.Q;
  const KHOA = 'sanRobotAo.xeLapRap';
  const TEN_ROBOT = 'siro_xeLapRap';
  const NS = 'http://www.w3.org/2000/svg';

  const LOAI = {
    sieuAm: { ten: 'Siêu âm', tenDay: 'cảm biến siêu âm HC-SR04', vung: 'gia', moTa: 'Đo khoảng cách tới vật phía trước' },
    doLine: { ten: 'Dò line', tenDay: 'mắt dò line TCRT5000', vung: 'duoi', moTa: 'Phân biệt nền sáng và vạch tối dưới gầm' },
    cham: { ten: 'Chạm', tenDay: 'cảm biến chạm', vung: 'duoi', moTa: 'Báo khi tấm cản ở mũi xe bị ép vào' },
    gyro: { ten: 'Gyro', tenDay: 'cảm biến gyro', vung: 'nap', moTa: 'Đo góc xe đã quay' },
    gps: { ten: 'GPS', tenDay: 'mô-đun GPS', vung: 'nap', moTa: 'Cho biết toạ độ của xe trên sân' }
  };
  const THU_TU = ['sieuAm', 'doLine', 'cham', 'gyro', 'gps'];
  const TEN_VUNG = { duoi: 'thanh dưới mũi xe', gia: 'giá phía mũi', nap: 'nắp mạch chủ' };

  // Sơ đồ: đơn vị cm, x sang phải, z (phía trước xe) hướng lên trên màn hình.
  // Thân xe và nắp mạch vẽ đúng tỉ lệ. Thanh dưới mũi và giá siêu âm vẽ tách ra phía trước (kiểu hình vẽ
  // tháo rời); thanh dưới mũi phóng to theo chiều ngang KX lần để dễ kéo thả bằng chuột lẫn ngón tay.
  const SD = { x0: -7.4, x1: 7.4, z0: -4.9, z1: 21.6 };
  const Y = (z) => -z;
  const KX = 1.9, ZB = 13.2, TI_LE_DUOI = 1.4;           // thanh dưới mũi: x sơ đồ = KX · x thật
  const KG = 1.0, ZG = 16.45;                             // giá siêu âm (đúng tỉ lệ): đường mặt trước thanh giá trên sơ đồ
  const VUNG = {
    duoi: { x0: -7.15, x1: 7.15, z0: ZB - 1.95, z1: ZB + 1.95 },
    gia: { x0: -4.9, x1: 4.9, z0: ZG - 0.45, z1: SD.z1 },
    nap: { x0: L.NAP.x0, x1: L.NAP.x1, z0: L.NAP.z0, z1: L.NAP.z1 }
  };
  const BIEN_HUT = { duoi: 0.9, gia: 0.6, nap: 1.0 };      // vùng nhận rộng thêm ra ngoài khung (cm sơ đồ)
  const HUT = 1.5;                                        // bán kính hút tới chỗ trống gần nhất (cm thật)

  const GOI_Y = 'Kéo cảm biến vào vùng gắn trên xe. Kéo ra ngoài bảng để tháo. Giữ Alt để đặt mịn hơn.';

  this.dangMo = false;
  this.cauHinh = null;
  let $bang = null, dangCam = null, keo = null, xoay = null, henDung = null, dangDung = false, canDungLai = false, camTruoc = null;
  let xemTruoc = null;       // kết quả đang vẽ thử (lúc kéo hoặc lúc cầm rê chuột)

  // ---------- Lưu, đọc cấu hình ----------
  function docLuu() {
    try { let c = JSON.parse(localStorage.getItem(KHOA)); return c && typeof c == 'object' ? L.chuanHoaCauHinh(c) : null; } catch (e) { return null; }
  }
  function luu(c) { try { localStorage.setItem(KHOA, JSON.stringify(c)); } catch (e) { /* trình duyệt chặn: vẫn dùng được trong phiên này */ } }
  function xoaLuu() { try { localStorage.removeItem(KHOA); } catch (e) {} }

  // Ghi cấu hình lắp vào một bản robot (tệp mẫu hoặc robot đang dùng): mô tả, kích thước, cổng
  function ghiVaoRobot(opt, c) {
    let banLap = L.lapXe(c), kl = L.tinhXe(banLap);
    Object.assign(opt, L.moTaRobot(banLap, kl));
    return { banLap: banLap, kl: kl };
  }
  // Gọi khi tệp mẫu của xe vừa nạp (xe.js): dùng lại bản lắp đã lưu của người dùng
  this.apVaoMau = function(mau) {
    let c = docLuu();
    if (mau && mau.name == TEN_ROBOT && c) ghiVaoRobot(mau, c);
  };

  const laXe = () => typeof robot != 'undefined' && robot.options && !!robot.options.sraXe;
  const trongBai = () => typeof SRA != 'undefined' && !!SRA.bai;
  this.dungDuoc = () => laXe() || !trongBai();

  // ---------- Cấu hình: mô-đun và vị trí ----------
  // Mỗi mô-đun đang gắn có một khoá: 'duoi:i', 'gia', 'tren:i' (i: thứ tự trái sang phải trong vùng)
  const tho = (c) => ({ banh: c.banh, sieuAm: c.sieuAm, sieuAmX: c.sieuAmX, sieuAmGoc: c.sieuAmGoc,
    duoi: c.duoi.map((m) => Object.assign({}, m)), tren: c.tren.map((m) => Object.assign({}, m)) });
  function layMoDun(c, khoa) {
    if (!khoa || khoa == 'khay') return null;
    if (khoa == 'gia') return c.sieuAm ? { loai: 'sieuAm', x: c.sieuAmX, goc: c.sieuAmGoc } : null;
    let p = khoa.split(':'), ds = p[0] == 'duoi' ? c.duoi : c.tren;
    return ds[Number(p[1])] || null;
  }
  function demLoai(c, loai) {
    if (loai == 'sieuAm') return c.sieuAm ? 1 : 0;
    return c.duoi.concat(c.tren).filter((m) => m.loai == loai).length;
  }
  const conLai = (c, loai) => L.TOI_DA[loai] - demLoai(c, loai);
  // Khoá của mô-đun loai ở vị trí (x, z) trong cấu hình c
  function timKhoa(c, loai, x, z) {
    if (loai == 'sieuAm') return c.sieuAm ? 'gia' : null;
    let ten = LOAI[loai].vung == 'duoi' ? 'duoi' : 'tren', ds = c[ten];
    let i = ds.findIndex((m) => m.loai == loai && Math.abs(m.x - x) < 1e-6 && (z == null || Math.abs(m.z - z) < 1e-6));
    return i < 0 ? null : ten + ':' + i;
  }
  function boMoDun(c, khoa) {
    if (khoa == 'gia') { c.sieuAm = false; return; }
    let p = khoa.split(':');
    (p[0] == 'duoi' ? c.duoi : c.tren).splice(Number(p[1]), 1);
  }

  const lam = (x, b) => Math.round(x / b) * b;
  const tron2 = (x) => Math.round(x * 100) / 100;
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const soViet = (x) => String(tron2(x)).replace('.', ',').replace('-', '−');

  // Tìm chỗ thả cho loai khi con trỏ ở vị trí thật diem = {vung, x, z} (z chỉ dùng cho nắp).
  // tu: khoá chỗ đang gắn, hoặc 'khay'. buoc: bước lưới (cm).
  // Trả về { c, den, doi, tb } nếu thả được (c: cấu hình mới đã chuẩn hoá, den: khoá mô-đun vừa đặt,
  // doi: khoá mô-đun bị đẩy sang chỗ khác nếu có), hoặc { loi } kèm câu giải thích.
  function timCho(loai, tu, diem, buoc) {
    let c0 = self.cauHinh, vung = LOAI[loai].vung;
    if (!diem) return { loi: '' };
    if (diem.vung != vung) return { loi: lyDoKhongNhan(diem.vung, loai) };
    let goc = layMoDun(c0, tu);                           // mô-đun đang kéo (null nếu từ khay)
    let c = tho(c0);
    if (goc) boMoDun(c, tu);
    let ketQua = (cMoi, ten, toaDo, doi, tb) => {
      let cc = L.chuanHoaCauHinh(cMoi);
      let den = timKhoa(cc, loai, toaDo.x, toaDo.z);
      if (!den) return { loi: 'Không đặt được ở đây.' };
      if (JSON.stringify(cc) == JSON.stringify(c0) && tu == den) return { loi: '', khongDoi: true, den: den, c: cc };
      return { c: cc, den: den, doi: doi ? timKhoa(cc, doi.loai, doi.x, doi.z) : null, tb: tb };
    };
    let tuKhay = !goc;
    if (tuKhay && conLai(c0, loai) <= 0) {
      return { loi: 'Trong khay không còn ' + LOAI[loai].tenDay + '.' };
    }

    if (vung == 'gia') {
      let gocXoay = goc ? goc.goc : c0.sieuAmGoc, gh = L.gioiHanSieuAmX(gocXoay);
      let x = tron2(kep(lam(diem.x, buoc), -gh, gh));
      c.sieuAm = true; c.sieuAmX = x; c.sieuAmGoc = gocXoay;
      return ketQua(c, 'gia', { x: x }, null, 'Đã gắn ' + LOAI[loai].tenDay + ' lên giá phía mũi, x = ' + soViet(x) + ' cm.');
    }

    if (vung == 'duoi') {
      let lim = L.X_DUOI[loai], x0 = tron2(kep(lam(diem.x, buoc), -lim, lim));
      // thả ngay lên một mô-đun khác: đổi chỗ (kéo từ xe) hoặc thay thế (kéo từ khay)
      let tren = c.duoi.findIndex((m) => Math.abs(m.x - diem.x) < 0.7);
      if (tren >= 0) {
        let m = c.duoi[tren];
        if (goc && LOAI[goc.loai].vung == 'duoi') {
          let ds = c.duoi.slice(); ds.splice(tren, 1);
          let moi = { loai: loai, x: m.x }, cu = { loai: m.loai, x: goc.x };
          if (!L.loiDuoi(loai, moi.x, ds) && !L.loiDuoi(m.loai, cu.x, ds.concat([moi]))) {
            c.duoi = ds.concat([moi, cu]);
            return ketQua(c, 'duoi', moi, cu, 'Đã đổi chỗ ' + LOAI[loai].tenDay + ' và ' + LOAI[m.loai].tenDay + '.');
          }
        } else if (!goc) {
          let ds = c.duoi.slice(); ds.splice(tren, 1);
          let cc = { loai: loai, x: m.x };
          if ((m.loai == loai || conLai(c0, loai) > 0) && !L.loiDuoi(loai, cc.x, ds)) {
            c.duoi = ds.concat([cc]);
            return ketQua(c, 'duoi', cc, null, 'Đã thay ' + LOAI[m.loai].tenDay + ' bằng ' + LOAI[loai].tenDay + '. ' + viet(LOAI[m.loai].tenDay) + ' trở về khay.');
          }
        }
      }
      // hút tới chỗ trống gần nhất
      let n = Math.round(HUT / buoc);
      for (let k = 0; k <= n; k++) {
        for (let s of k ? [1, -1].sort((a, b) => Math.abs(x0 + a * k * buoc - diem.x) - Math.abs(x0 + b * k * buoc - diem.x)) : [1]) {
          let x = tron2(x0 + s * k * buoc);
          if (L.loiDuoi(loai, x, c.duoi)) continue;
          c.duoi.push({ loai: loai, x: x });
          return ketQua(c, 'duoi', { x: x }, null, 'Đã gắn ' + LOAI[loai].tenDay + ' dưới mũi xe, ' + moTaX(x) + '.');
        }
      }
      return { loi: L.loiDuoi(loai, x0, c.duoi) || 'Không còn chỗ trống ở đây.' };
    }

    // vung == 'nap'
    let mi = L.mienNap(loai);
    let p0 = { loai: loai, x: tron2(kep(lam(diem.x, buoc), mi.x0, mi.x1)), z: tron2(kep(lam(diem.z, buoc), mi.z0, mi.z1)) };
    let tren = c.tren.findIndex(function(m) { let k = L.KHUON_NAP[m.loai]; return Math.abs(diem.x - m.x) < k.nx && diem.z > m.z + k.z0 && diem.z < m.z + k.z1; });
    if (tren >= 0) {
      let m = c.tren[tren], ds = c.tren.slice(); ds.splice(tren, 1);
      let miM = L.mienNap(m.loai);
      if (goc) {
        let moi = { loai: loai, x: tron2(kep(m.x, mi.x0, mi.x1)), z: tron2(kep(m.z, mi.z0, mi.z1)) };
        let cu = { loai: m.loai, x: tron2(kep(goc.x, miM.x0, miM.x1)), z: tron2(kep(goc.z, miM.z0, miM.z1)) };
        if (!L.loiNap(moi, ds) && !L.loiNap(cu, ds.concat([moi]))) {
          c.tren = ds.concat([moi, cu]);
          return ketQua(c, 'tren', moi, cu, 'Đã đổi chỗ ' + LOAI[loai].tenDay + ' và ' + LOAI[m.loai].tenDay + '.');
        }
      } else {
        let moi = { loai: loai, x: tron2(kep(m.x, mi.x0, mi.x1)), z: tron2(kep(m.z, mi.z0, mi.z1)) };
        if (!L.loiNap(moi, ds)) {
          c.tren = ds.concat([moi]);
          return ketQua(c, 'tren', moi, null, 'Đã thay ' + LOAI[m.loai].tenDay + ' bằng ' + LOAI[loai].tenDay + '. ' + viet(LOAI[m.loai].tenDay) + ' trở về khay.');
        }
      }
    }
    let n = Math.round(HUT / buoc), ung = [];
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      let p = { loai: loai, x: tron2(p0.x + i * buoc), z: tron2(p0.z + j * buoc) };
      let d = Math.hypot(p.x - diem.x, p.z - diem.z);
      if (Math.hypot(i, j) * buoc <= HUT + 1e-6) ung.push({ p: p, d: d });
    }
    ung.sort((a, b) => a.d - b.d);
    for (let u of ung) {
      if (L.loiNap(u.p, c.tren)) continue;
      c.tren.push(u.p);
      return ketQua(c, 'tren', u.p, null, 'Đã gắn ' + LOAI[loai].tenDay + ' lên nắp mạch chủ.');
    }
    return { loi: L.loiNap(p0, c.tren) || 'Không còn chỗ trống ở đây.' };
  }
  const viet = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const moTaX = (x) => Math.abs(x) < 1e-6 ? 'ngay giữa' : 'cách giữa ' + soViet(Math.abs(x)) + ' cm về bên ' + (x < 0 ? 'trái' : 'phải');

  // Tháo mô-đun ở khoá tu về khay
  function thao(tu) {
    let c0 = self.cauHinh, m = layMoDun(c0, tu);
    if (!m) return null;
    let c = tho(c0); boMoDun(c, tu);
    return { c: L.chuanHoaCauHinh(c), tb: 'Đã tháo ' + LOAI[m.loai].tenDay + '.' };
  }
  // Tự gắn loai vào chỗ trống đầu tiên (dùng cho phím Enter trên thẻ khay)
  function tuGan(loai) {
    if (conLai(self.cauHinh, loai) <= 0) return { loi: 'Trong khay không còn ' + LOAI[loai].tenDay + '.' };
    let vung = LOAI[loai].vung;
    if (vung == 'gia') return timCho(loai, 'khay', { vung: 'gia', x: 0 }, 0.5);
    if (vung == 'duoi') {
      for (let k = 0; k <= 2 * L.X_DUOI[loai]; k++) {
        for (let x of k ? [-k * 0.5, k * 0.5] : [0]) {
          if (Math.abs(x) > L.X_DUOI[loai] || L.loiDuoi(loai, x, self.cauHinh.duoi)) continue;
          return timCho(loai, 'khay', { vung: 'duoi', x: x }, 0.5);
        }
      }
      return { loi: 'Thanh dưới mũi không còn chỗ trống.' };
    }
    // trên nắp: thử chỗ của bản cũ (gyro bên trái, GPS bên phải) trước, rồi bên kia, rồi tìm quanh đó
    let mac = loai == 'gyro' ? L.X_NAP : L.X_NAP.slice().reverse();
    for (let x of mac) {
      let p = { loai: loai, x: x, z: L.KHUON_NAP[loai].z };
      if (L.loiNap(p, self.cauHinh.tren)) continue;
      let c = tho(self.cauHinh); c.tren.push(p);
      let cc = L.chuanHoaCauHinh(c);
      return { c: cc, den: timKhoa(cc, loai, p.x, p.z), tb: 'Đã gắn ' + LOAI[loai].tenDay + ' lên nắp mạch chủ.' };
    }
    return timCho(loai, 'khay', { vung: 'nap', x: mac[0], z: L.KHUON_NAP[loai].z }, 0.5);
  }
  // Dời mô-đun ở khoá tu đi (dx, dz) cm; nếu chỗ mới bị chiếm thì nhảy qua mô-đun bên cạnh
  function nhich(tu, dx, dz) {
    let m = layMoDun(self.cauHinh, tu);
    if (!m) return null;
    let c = tho(self.cauHinh); boMoDun(c, tu);
    for (let k = 1; k <= 40; k++) {
      if (tu == 'gia') {
        let gh = L.gioiHanSieuAmX(m.goc), x = tron2(m.x + k * dx);
        if (Math.abs(x) > gh + 1e-6 || dx == 0) return { loi: 'Cảm biến siêu âm đã ra tới mép giá.' };
        c.sieuAm = true; c.sieuAmX = x;
        return { c: L.chuanHoaCauHinh(c), den: 'gia', tb: 'Siêu âm ở x = ' + soViet(x) + ' cm.' };
      }
      if (LOAI[m.loai].vung == 'duoi') {
        let x = tron2(m.x + k * dx);
        if (Math.abs(x) > L.X_DUOI[m.loai] + 1e-6 || dx == 0) return { loi: L.loiDuoi(m.loai, x, []) || '' };
        if (L.loiDuoi(m.loai, x, c.duoi)) continue;
        c.duoi.push({ loai: m.loai, x: x });
        let cc = L.chuanHoaCauHinh(c);
        return { c: cc, den: timKhoa(cc, m.loai, x), tb: viet(LOAI[m.loai].tenDay) + ' ' + moTaX(x) + '.' };
      }
      let p = { loai: m.loai, x: tron2(m.x + k * dx), z: tron2(m.z + k * dz) }, mi = L.mienNap(m.loai);
      if (p.x < mi.x0 - 1e-6 || p.x > mi.x1 + 1e-6 || p.z < mi.z0 - 1e-6 || p.z > mi.z1 + 1e-6) return { loi: 'Mô-đun đã ra tới mép nắp mạch chủ.' };
      if (L.loiNap(p, c.tren)) continue;
      c.tren.push(p);
      let cc = L.chuanHoaCauHinh(c);
      return { c: cc, den: timKhoa(cc, p.loai, p.x, p.z), tb: viet(LOAI[m.loai].tenDay) + ' ở x = ' + soViet(p.x) + ' cm, z = ' + soViet(p.z) + ' cm.' };
    }
    return null;
  }
  // Xoay cảm biến siêu âm tới góc g (độ, dương là sang trái); x bị kéo vào trong nếu mô-đun chạm mép giá
  function datGoc(g) {
    let c = tho(self.cauHinh);
    if (!c.sieuAm) return null;
    g = kep(g, -L.GOC_SA, L.GOC_SA);
    let gh = L.gioiHanSieuAmX(g);
    c.sieuAmGoc = g; c.sieuAmX = tron2(kep(c.sieuAmX, -gh, gh));
    return { c: L.chuanHoaCauHinh(c), den: 'gia', tb: 'Siêu âm ' + moTaGoc(g) + '.' };
  }
  const moTaGoc = (g) => Math.abs(g) < 1e-6 ? 'nhìn thẳng ra trước' : 'xoay ' + soViet(Math.abs(g)) + '° sang ' + (g > 0 ? 'trái' : 'phải');

  function tenMoDun(khoa, banLap, c) {
    let m = layMoDun(c || self.cauHinh, khoa);
    if (!m) return '';
    let cb = banLap && banLap.camBien.find((x) => khoaCua(x) == khoa);
    let ten = LOAI[m.loai].tenDay + (cb && cb.ten && m.loai == 'doLine' ? ' (' + cb.ten + ')' : '');
    let viTri = m.loai == 'sieuAm' ? 'trên giá phía mũi, x = ' + soViet(m.x) + ' cm, ' + moTaGoc(m.goc)
      : (LOAI[m.loai].vung == 'duoi' ? 'dưới mũi xe, ' + moTaX(m.x) : 'trên nắp mạch chủ, x = ' + soViet(m.x) + ' cm, z = ' + soViet(m.z) + ' cm');
    return viet(ten) + ' ' + viTri + (cb ? '. Cổng ' + cb.cong.slice(2) + ' trong chương trình, cắm ổ ' + cb.oMach + ' trên mạch chủ.' : '.');
  }
  function lyDoKhongNhan(vung, loai) {
    if (!vung) return '';
    let dung = THU_TU.filter((l) => LOAI[l].vung == vung).map((l) => LOAI[l].tenDay);
    return viet(TEN_VUNG[vung]) + ' chỉ gắn được ' + dung.join(' hoặc ') + '. ' + viet(LOAI[loai].tenDay) + ' gắn ở ' + TEN_VUNG[LOAI[loai].vung] + '.';
  }
  const khoaCua = (cb) => cb.loai == 'sieuAm' ? 'gia' : (cb.duoi != null ? 'duoi:' + cb.duoi : 'tren:' + cb.tren);

  // ---------- Vẽ ----------
  function svg(ten, thuoc, cha) {
    let e = document.createElementNS(NS, ten);
    for (let k in thuoc) e.setAttribute(k, thuoc[k]);
    if (cha) cha.appendChild(e);
    return e;
  }
  const so = (x) => Math.round(x * 1000) / 1000;

  // Hình chiếu từ trên xuống của một khối đặc: { tron: [x, z, r] } hoặc { da: [[x, z]…] }, kèm độ cao mặt trên
  function baoLoi(ds) {
    ds = ds.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let cheo = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    let duoi = [], tren = [];
    for (let p of ds) { while (duoi.length >= 2 && cheo(duoi[duoi.length - 2], duoi[duoi.length - 1], p) <= 1e-9) duoi.pop(); duoi.push(p); }
    for (let i = ds.length - 1; i >= 0; i--) { let p = ds[i]; while (tren.length >= 2 && cheo(tren[tren.length - 2], tren[tren.length - 1], p) <= 1e-9) tren.pop(); tren.push(p); }
    duoi.pop(); tren.pop();
    return duoi.concat(tren);
  }
  function chieu(k, goc) {
    goc = goc || [0, 0, 0];
    let ra = (p) => V.cong(goc, V.cong(k.vt, Q.quay(k.q, p)));
    if (k.k == 'cau') { let c = ra([0, 0, 0]); return { tron: [c[0], c[2], k.d / 2], cao: c[1] + k.d / 2 }; }
    if (k.k == 'tru') {
      let a = Q.quay(k.q, [0, 1, 0]), c = ra([0, 0, 0]);
      if (Math.abs(a[1]) > 0.95) return { tron: [c[0], c[2], k.d / 2], cao: c[1] + k.h / 2 };
      let d = V.donVi([a[0], 0, a[2]]), n = [-d[2], 0, d[0]], ds = [];
      for (let s of [-1, 1]) for (let t of [-1, 1]) ds.push([c[0] + s * d[0] * k.h / 2 + t * n[0] * k.d / 2, c[2] + s * d[2] * k.h / 2 + t * n[2] * k.d / 2]);
      return { da: baoLoi(ds), cao: c[1] + k.d / 2 };
    }
    let dinh = [];
    if (k.k == 'hop') { for (let i = 0; i < 8; i++) dinh.push([(i & 1 ? 1 : -1) * k.kt[0] / 2, (i & 2 ? 1 : -1) * k.kt[1] / 2, (i & 4 ? 1 : -1) * k.kt[2] / 2]); }
    else dinh = k.dinh;
    let w = dinh.map(ra);
    return { da: baoLoi(w.map((p) => [p[0], p[2]])), cao: Math.max.apply(null, w.map((p) => p[1])) };
  }
  function mauVatLieu(ten) {
    let v = (typeof SRAXeDungHinh != 'undefined' && SRAXeDungHinh.VAT_LIEU[ten]) || { mau: '#888' };
    return v.mau;
  }

  // Thân xe chưa gắn cảm biến, nhìn từ trên xuống (tính một lần)
  let hinhNen = null;
  function veNen(cha) {
    if (!hinhNen) {
      let tran = L.lapXe({ sieuAm: false, duoi: [], tren: [] });
      L.tinhXe(tran);
      let ds = [];
      tran.than.forEach(function(ct) { ct.khoi.forEach(function(k) { ds.push(Object.assign(chieu(k), { vl: k.vl })); }); });
      tran.banh.forEach(function(b) { b.khoi.forEach(function(k) { if (!k.trong) ds.push(Object.assign(chieu(k, b.tam), { vl: k.vl })); }); });
      ds.sort((a, b) => a.cao - b.cao);
      hinhNen = ds;
    }
    let g = svg('g', { 'class': 'sra-lr-nen' }, cha);
    hinhNen.forEach(function(h) {
      let thuoc = { fill: mauVatLieu(h.vl) };
      if (h.vl == 'nap_mach') thuoc['fill-opacity'] = 0.88;
      if (h.tron) svg('circle', Object.assign(thuoc, { cx: so(h.tron[0]), cy: so(Y(h.tron[1])), r: so(h.tron[2]) }), g);
      else svg('polygon', Object.assign(thuoc, { points: h.da.map((p) => so(p[0]) + ',' + so(Y(p[1]))).join(' ') }), g);
    });
    return g;
  }

  // Hình vẽ nhỏ của từng loại cảm biến (đơn vị cm, tâm ở gốc; nhìn từ trên xuống, mũi xe hướng lên)
  function veLinhKien(loai, cha, tiLe) {
    let g = svg('g', { 'class': 'sra-lr-hinh', transform: 'scale(' + (tiLe || 1) + ')' }, cha);
    let hcn = (x, y, w, h, mau, r, them) => svg('rect', Object.assign({ x: x - w / 2, y: y - h / 2, width: w, height: h, rx: r || 0, fill: mau }, them), g);
    let tron = (x, y, r, mau, them) => svg('circle', Object.assign({ cx: x, cy: y, r: r, fill: mau }, them), g);
    if (loai == 'sieuAm') {
      hcn(0, 0, 4.7, 1.9, '#1f6fb5', 0.25);
      for (let s of [-1, 1]) { tron(s * 1.3, 0, 0.8, '#d7d9dc'); tron(s * 1.3, 0, 0.55, '#8d9299'); tron(s * 1.3, 0, 0.18, '#d7d9dc'); }
    } else if (loai == 'doLine') {
      hcn(0, 0, 1.3, 2.0, '#1b1d22', 0.18);
      hcn(0, -0.35, 1.0, 0.62, '#34373d', 0.08);
      tron(-0.25, -0.35, 0.17, '#7fb6ff'); tron(0.25, -0.35, 0.17, '#0c0c0e', { stroke: '#555a61', 'stroke-width': 0.05 });
      hcn(0, 0.55, 0.9, 0.5, '#ecebe6', 0.06);
    } else if (loai == 'cham') {
      hcn(0, -0.78, 1.5, 0.34, '#f07a1a', 0.1);
      hcn(0, 0.2, 1.3, 1.1, '#26282c', 0.14);
      tron(0, -0.42, 0.2, '#d43a2f');
      hcn(0, 0.82, 0.9, 0.36, '#ecebe6', 0.06);
    } else if (loai == 'gyro') {
      hcn(0, 0, 2.2, 2.6, '#6a4bb3', 0.25);
      svg('path', { d: 'M -0.62 0.12 A 0.64 0.64 0 1 1 0.2 0.6', fill: 'none', stroke: '#fff', 'stroke-width': 0.17, 'stroke-linecap': 'round' }, g);
      svg('path', { d: 'M 0.02 0.3 L 0.5 0.64 L -0.02 0.92 Z', fill: '#fff' }, g);
    } else if (loai == 'gps') {
      hcn(0, 0, 2.6, 2.9, '#5d646d', 0.25);
      hcn(0, -0.1, 1.5, 1.5, '#e7dcc1', 0.1);
      tron(0, -0.1, 0.22, '#a9adb3');
    }
    return g;
  }

  // Vị trí trên sơ đồ của một mô-đun: điểm đặt, góc xoay (độ, theo chiều SVG) và chỗ dây đi ra
  function hinhMoDun(m) {
    if (m.loai == 'sieuAm') {
      let day0 = 2.35 * Math.sin(Math.abs(m.goc) * Math.PI / 180);
      return { x: KG * m.x, z: ZG + KG * day0, goc: -m.goc, tiLe: KG, w: 4.7, h: 1.9, lech: 0.95, ra: [KG * m.x, ZG - 0.3] };
    }
    if (LOAI[m.loai].vung == 'duoi') return { x: KX * m.x, z: ZB, goc: 0, tiLe: TI_LE_DUOI, w: 1.5, h: 2.0, lech: 0, ra: [KX * m.x, ZB - 1.45] };
    let k = L.KHUON_NAP[m.loai];
    return { x: m.x, z: m.z, goc: 0, tiLe: 1, w: 2 * k.nx, h: m.loai == 'gyro' ? 2.6 : 2.9, lech: 0, ra: [m.x, m.z + k.z0] };
  }
  function veMoDun(cha, m, khoa, them) {
    let h = hinhMoDun(m);
    let g = svg('g', Object.assign({ 'class': 'sra-lr-mo-dun', 'data-cho': khoa, 'data-loai': m.loai, tabindex: 0, role: 'button',
      transform: 'translate(' + so(h.x) + ' ' + so(Y(h.z)) + ')' + (h.goc ? ' rotate(' + so(h.goc) + ')' : '') }, them || {}), cha);
    let trong = svg('g', { transform: 'translate(0 ' + so(-h.lech * h.tiLe) + ')' }, g);
    if (m.loai == 'sieuAm') {
      // chùm sóng 15° phía trước (vẽ ngắn, chỉ để thấy hướng)
      let nua = 7.5 * Math.PI / 180, dai = 3.6, y0 = -0.95 * h.tiLe;
      svg('path', { 'class': 'sra-lr-chum', d: 'M 0 ' + so(y0) + ' L ' + so(-dai * Math.tan(nua) - 0.9) + ' ' + so(y0 - dai) + ' L ' + so(dai * Math.tan(nua) + 0.9) + ' ' + so(y0 - dai) + ' Z' }, trong);
    }
    if (LOAI[m.loai].vung == 'nap') {
      // ổ RJ25 phía sau mô-đun
      let k = L.KHUON_NAP[m.loai], tz = m.z + k.z0 + 0.95;
      svg('rect', { 'class': 'sra-lr-o-cam', x: -0.75, y: so(Y(tz) - Y(m.z) - 0.95), width: 1.5, height: 1.9, rx: 0.15 }, trong);
    }
    svg('rect', { 'class': 'sra-lr-khung', x: so(-h.w / 2 * h.tiLe - 0.15), y: so(-h.h / 2 * h.tiLe - 0.15), width: so(h.w * h.tiLe + 0.3), height: so(h.h * h.tiLe + 0.3), rx: 0.35 }, trong);
    veLinhKien(m.loai, trong, h.tiLe);
    return g;
  }

  // Vẽ sơ đồ theo cấu hình c. opt.moi: các khoá vẽ dạng xem trước; opt.an: khoá đang kéo (vẽ mờ đi);
  // opt.loi: { loai, vung, x, z } vẽ bóng đỏ ở chỗ không thả được; opt.dangKeo: loại đang kéo (tô vùng nhận)
  function veSoDo(c, opt) {
    opt = opt || {};
    let banLap = L.lapXe(c), kl = L.tinhXe(banLap);
    let s = svg('svg', { viewBox: [SD.x0, Y(SD.z1), SD.x1 - SD.x0, SD.z1 - SD.z0].join(' '), 'class': 'sra-lr-so-do', role: 'group', 'aria-label': 'Sơ đồ xe nhìn từ trên xuống, mũi xe ở phía trên' });
    veNen(s);
    svg('text', { x: SD.x1 - 0.3, y: Y(SD.z1) + 1.0, 'class': 'sra-lr-chu-mo', 'text-anchor': 'end' }, s).textContent = 'Mũi xe';
    svg('text', { x: SD.x0 + 0.3, y: Y(SD.z0) - 0.35, 'class': 'sra-lr-chu-mo' }, s).textContent = 'Đuôi xe';

    // vùng gắn
    let vungNhan = opt.dangKeo ? LOAI[opt.dangKeo].vung : null;
    let veVung = function(ten, them) {
      let v = VUNG[ten];
      let r = svg('rect', Object.assign({ 'class': 'sra-lr-vung' + (vungNhan == ten ? ' nhan-duoc' : '') + (opt.vungTren == ten ? ' dang-tren' : ''), 'data-vung': ten,
        x: v.x0, y: Y(v.z1), width: v.x1 - v.x0, height: v.z1 - v.z0, rx: 0.5 }, them || {}), s);
      return r;
    };
    // giá siêu âm (vẽ tách ra phía trước): hai chân nối về mũi xe và thanh ngang
    svg('path', { d: 'M ' + (-4.15 * KG) + ' ' + Y(ZG - 0.4) + ' L ' + (-4.15 * KG) + ' ' + Y(VUNG.duoi.z1 + 0.05) + ' M ' + (4.15 * KG) + ' ' + Y(ZG - 0.4) + ' L ' + (4.15 * KG) + ' ' + Y(VUNG.duoi.z1 + 0.05), 'class': 'sra-lr-gia' }, s);
    veVung('gia', { 'class': 'sra-lr-vung sra-lr-vung-gia' + (vungNhan == 'gia' ? ' nhan-duoc' : '') + (opt.vungTren == 'gia' ? ' dang-tren' : '') });
    svg('rect', { x: -4.45 * KG, y: Y(ZG), width: 8.9 * KG, height: 0.3, rx: 0.1, 'class': 'sra-lr-thanh-gia' }, s);
    veVung('duoi', { 'class': 'sra-lr-vung sra-lr-thanh' + (vungNhan == 'duoi' ? ' nhan-duoc' : '') + (opt.vungTren == 'duoi' ? ' dang-tren' : '') });
    veVung('nap', { 'class': 'sra-lr-vung sra-lr-vung-nap' + (vungNhan == 'nap' ? ' nhan-duoc' : '') + (opt.vungTren == 'nap' ? ' dang-tren' : '') });
    // trục dọc của xe trên thanh dưới mũi (để thấy hai bên có cân không)
    svg('path', { 'class': 'sra-lr-truc', d: 'M 0 ' + Y(VUNG.duoi.z1 - 0.1) + ' L 0 ' + Y(VUNG.duoi.z0 + 0.1) }, s);
    // vạch lưới 0,5 cm trên thanh dưới mũi
    let gVach = svg('g', { 'class': 'sra-lr-vach' }, s);
    for (let i = -6; i <= 6; i++) {
      let x = KX * i * 0.5, dai = i % 2 == 0 ? 0.5 : 0.28;
      svg('path', { d: 'M ' + so(x) + ' ' + so(Y(VUNG.duoi.z0)) + ' l 0 ' + so(-dai) }, gVach);
    }

    // dây nối từ mỗi cảm biến về ổ trên mạch chủ
    let gDay = svg('g', { 'class': 'sra-lr-day' }, s);
    banLap.camBien.forEach(function(cb) {
      let khoa = khoaCua(cb), m = layMoDun(c, khoa);
      if (!m) return;
      let h = hinhMoDun(m), truoc = cb.oMach <= 5;
      let xo = truoc ? (cb.oMach - 3) * 1.7 : (cb.oMach - 7) * 3, zo = truoc ? 7.55 : -0.45;
      let a = h.ra, d;
      if (!truoc) d = 'M ' + so(a[0]) + ' ' + so(Y(a[1])) + ' C ' + so(a[0]) + ' ' + so(Y(a[1] - 1.2)) + ', ' + so(xo) + ' ' + so(Y(zo - 2.2)) + ', ' + so(xo) + ' ' + so(Y(zo - 0.9));
      else d = 'M ' + so(a[0]) + ' ' + so(Y(a[1])) + ' C ' + so(a[0]) + ' ' + so(Y(a[1] - 1.6)) + ', ' + so(xo) + ' ' + so(Y(zo + 2.4)) + ', ' + so(xo) + ' ' + so(Y(zo));
      svg('path', { d: d, 'data-day': khoa, 'class': opt.moi && opt.moi.indexOf(khoa) >= 0 ? 'xem-truoc' : '' }, gDay);
      svg('circle', { cx: so(xo), cy: so(Y(truoc ? zo : zo - 0.9)), r: 0.28 }, gDay);
    });

    // thước đo: khoảng cách tâm đến tâm giữa các mô-đun cạnh nhau dưới mũi xe
    let gThuoc = svg('g', { 'class': 'sra-lr-thuoc' }, s), zt = VUNG.duoi.z1 + 0.55;
    for (let i = 0; i + 1 < c.duoi.length; i++) {
      let a = KX * c.duoi[i].x, b = KX * c.duoi[i + 1].x, kc = c.duoi[i + 1].x - c.duoi[i].x;
      let moi = opt.moi && (opt.moi.indexOf('duoi:' + i) >= 0 || opt.moi.indexOf('duoi:' + (i + 1)) >= 0);
      let g = svg('g', { 'class': moi ? 'xem-truoc' : '' }, gThuoc);
      svg('path', { d: 'M ' + so(a) + ' ' + so(Y(zt)) + ' L ' + so(b) + ' ' + so(Y(zt)) + ' M ' + so(a) + ' ' + so(Y(zt - 0.25)) + ' l 0 -0.5 M ' + so(b) + ' ' + so(Y(zt - 0.25)) + ' l 0 -0.5' }, g);
      svg('text', { x: so((a + b) / 2), y: so(Y(zt) - 0.2) }, g).textContent = soViet(kc) + ' cm';
    }

    // mô-đun đang gắn
    let congCua = {};
    banLap.camBien.forEach((cb) => { congCua[khoaCua(cb)] = cb.cong.slice(2); });
    let dsKhoa = (c.sieuAm ? ['gia'] : []).concat(c.duoi.map((m, i) => 'duoi:' + i), c.tren.map((m, i) => 'tren:' + i));
    dsKhoa.forEach(function(khoa) {
      let m = layMoDun(c, khoa);
      let lop = 'sra-lr-mo-dun' + (opt.moi && opt.moi.indexOf(khoa) >= 0 ? ' xem-truoc' : '') + (opt.an == khoa ? ' dang-keo' : '') + (opt.chon == khoa ? ' dang-chon' : '');
      let g = veMoDun(s, m, khoa, { 'class': lop });
      g.setAttribute('aria-label', tenMoDun(khoa, banLap, c) + ' Bấm để cầm lên, dùng phím mũi tên để dời' + (khoa == 'gia' ? ', Q hoặc E để xoay' : '') + ', Delete để tháo.');
      // số cổng
      // số cổng ở góc trên bên phải của mô-đun (tính theo góc xoay của mô-đun)
      let h = hinhMoDun(m), t = h.goc * Math.PI / 180;
      let lx = h.w / 2 * h.tiLe - 0.1, ly = -(h.lech + h.h / 2) * h.tiLe + 0.1;
      if (khoa == 'gia') { lx = h.w / 2 * h.tiLe + 0.45; ly = -0.4; }     // siêu âm: cạnh sau bên phải (núm xoay ở phía trước)
      let bx = h.x + lx * Math.cos(t) - ly * Math.sin(t), by = Y(h.z) + lx * Math.sin(t) + ly * Math.cos(t);
      let gc = svg('g', { 'class': 'sra-lr-nhan-cong' }, s);
      svg('circle', { 'class': 'sra-lr-cong', cx: so(bx), cy: so(by), r: 0.74 }, gc);
      svg('text', { 'class': 'sra-lr-so-cong', x: so(bx), y: so(by + 0.37) }, gc).textContent = congCua[khoa];
      if (khoa == 'gia') veNumXoay(s, m, h);
    });
    if (opt.loi) {
      // bóng đỏ ở chỗ không thả được
      let g = veMoDun(s, opt.loi, 'loi', { 'class': 'sra-lr-mo-dun loi', tabindex: -1, role: 'presentation' });
      g.removeAttribute('data-cho'); g.removeAttribute('data-loai');
    }
    return { svg: s, banLap: banLap, kl: kl };
  }
  // Núm xoay của cảm biến siêu âm: một cung tròn quanh khớp xoay và một núm ở đầu cung
  function veNumXoay(s, m, h) {
    let r = 2.9, tam = [h.x, h.z], gocR = m.goc * Math.PI / 180;
    let g = svg('g', { 'class': 'sra-lr-xoay' }, s);
    let diem = (a) => [tam[0] - r * Math.sin(a), tam[1] + r * Math.cos(a)];
    let a0 = diem(-L.GOC_SA * Math.PI / 180), a1 = diem(L.GOC_SA * Math.PI / 180);
    svg('path', { 'class': 'sra-lr-cung', d: 'M ' + so(a0[0]) + ' ' + so(Y(a0[1])) + ' A ' + r + ' ' + r + ' 0 0 0 ' + so(a1[0]) + ' ' + so(Y(a1[1])) }, g);
    for (let t = -L.GOC_SA; t <= L.GOC_SA; t += 15) {
      let p = diem(t * Math.PI / 180), q = [tam[0] - (r - 0.35) * Math.sin(t * Math.PI / 180), tam[1] + (r - 0.35) * Math.cos(t * Math.PI / 180)];
      svg('path', { 'class': 'sra-lr-vach-goc', d: 'M ' + so(p[0]) + ' ' + so(Y(p[1])) + ' L ' + so(q[0]) + ' ' + so(Y(q[1])) }, g);
    }
    let n = diem(gocR);
    let num = svg('g', { 'class': 'sra-lr-num', 'data-xoay': 'gia', tabindex: 0, role: 'slider', 'aria-label': 'Xoay cảm biến siêu âm',
      'aria-valuemin': -L.GOC_SA, 'aria-valuemax': L.GOC_SA, 'aria-valuenow': m.goc, 'aria-valuetext': moTaGoc(m.goc) }, g);
    svg('circle', { cx: so(n[0]), cy: so(Y(n[1])), r: 0.62 }, num);
    svg('path', { d: 'M ' + so(n[0] - 0.3) + ' ' + so(Y(n[1]) - 0.05) + ' a 0.36 0.36 0 1 1 0.6 0.1', fill: 'none' }, num);
    if (Math.abs(m.goc) > 1e-6) {
      svg('text', { 'class': 'sra-lr-chu-goc', x: so(n[0] + (m.goc > 0 ? -0.9 : 0.9)), y: so(Y(n[1]) + 0.3), 'text-anchor': m.goc > 0 ? 'end' : 'start' }, g).textContent = soViet(Math.abs(m.goc)) + '°';
    }
  }

  function veKhay() {
    let $k = $('<div class="sra-lr-khay" data-cho="khay" role="group" aria-label="Khay linh kiện"></div>');
    THU_TU.forEach(function(loai) {
      let con = conLai(self.cauHinh, loai);
      let $the = $('<button type="button" class="sra-lr-the"></button>').attr('data-loai', loai).attr('data-tu', 'khay')
        .attr('title', LOAI[loai].moTa).prop('disabled', con <= 0)
        .attr('aria-label', LOAI[loai].tenDay + ', còn ' + con + ' trong khay. ' + LOAI[loai].moTa + '. Enter để tự gắn vào chỗ trống.');
      let kich = { sieuAm: [5.2, 2.4], doLine: [2.2, 2.4], cham: [2.2, 2.4], gyro: [3.0, 3.0], gps: [3.0, 3.3] }[loai];
      let s = svg('svg', { viewBox: [-kich[0] / 2, -kich[1] / 2, kich[0], kich[1]].join(' '), width: kich[0] * 12.5, height: kich[1] * 12.5, 'aria-hidden': 'true' });
      veLinhKien(loai, s);
      $the.append(s);
      $the.append($('<span class="sra-lr-ten"></span>').text(LOAI[loai].ten));
      $the.append($('<span class="sra-lr-con"></span>').text(con > 0 ? 'còn ' + con : 'đã gắn'));
      $k.append($the);
    });
    return $k;
  }

  function veDanhSachCong(banLap) {
    let $d = $('<div class="sra-lr-thong-tin"></div>');
    let $ds = $('<ol class="sra-lr-ds-cong"></ol>');
    banLap.camBien.forEach(function(cb) {
      let ten = LOAI[cb.loai].ten + (cb.loai == 'doLine' && cb.ten ? ' ' + cb.ten : '');
      $ds.append($('<li></li>').attr('data-khoa', khoaCua(cb)).append($('<span class="sra-lr-huy-hieu"></span>').text(cb.cong.slice(2))).append(document.createTextNode(' ' + ten)));
    });
    $d.append('<div class="sra-lr-tieu-de-nho">Cổng trong chương trình</div>');
    if (banLap.camBien.length) $d.append($ds); else $d.append('<p class="sra-lr-trong-khong">Xe chưa có cảm biến nào. Kéo một cảm biến từ khay vào xe.</p>');
    return $d;
  }

  let banLapHien = null;
  // Vẽ lại cả bảng theo cấu hình đang dùng
  function veLai(thongBao, giuChon) {
    if (!$bang) return;
    xemTruoc = null;
    let sd = veSoDo(self.cauHinh, { chon: dangCam && dangCam.tu != 'khay' ? dangCam.tu : null, dangKeo: dangCam ? dangCam.loai : null });
    banLapHien = sd.banLap;
    $bang.find('.sra-lr-vung-khay').empty().append(veKhay());
    $bang.find('.sra-lr-vung-so-do').empty().append(sd.svg);
    $bang.find('.sra-lr-vung-thong-tin').empty().append(veDanhSachCong(sd.banLap));
    $bang.find('.sra-lr-khoi-luong').text('Xe nặng ' + Math.round(sd.kl.tong) + ' g, ' + Math.round(sd.kl.taiBanh * 100) + ' % trọng lượng đè lên hai bánh chủ động.');
    if (thongBao != null) $bang.find('.sra-lr-thong-bao').text(thongBao || GOI_Y).toggleClass('goi-y', !thongBao);
    if (!giuChon) chiTiet(null);
    danhDau();
  }
  // Chỉ vẽ lại sơ đồ để xem trước kết quả (không đổi cấu hình, không dựng lại xe 3D)
  function veThu(kq, loai, tu, diem) {
    let khoa = JSON.stringify([kq && kq.c, kq && kq.loi, diem && diem.vung, kq && kq.loi != null && diem ? [diem.x, diem.z] : null]);
    if (xemTruoc == khoa) return;
    xemTruoc = khoa;
    let sd;
    if (kq && kq.c && !kq.khongDoi) {
      sd = veSoDo(kq.c, { moi: [kq.den, kq.doi].filter(Boolean), dangKeo: loai, vungTren: diem && diem.vung });
    } else {
      let loi = null;
      if (diem && kq && kq.loi && LOAI[loai].vung == diem.vung) loi = { loai: loai, x: diem.x, z: diem.z, goc: 0 };
      sd = veSoDo(self.cauHinh, { an: tu != 'khay' ? tu : null, dangKeo: loai, loi: loi, vungTren: diem && diem.vung });
    }
    $bang.find('.sra-lr-vung-so-do').empty().append(sd.svg);
    if (kq && kq.loi) $bang.find('.sra-lr-thong-bao').text(kq.loi).removeClass('goi-y');
    else if (kq && kq.c && !kq.khongDoi) $bang.find('.sra-lr-thong-bao').text('Thả ra: ' + kq.tb.replace(/^Đã /, '').replace(/^./, (a) => a.toLowerCase())).removeClass('goi-y');
  }

  // Dòng chi tiết dưới sơ đồ: mô-đun đang rê chuột hoặc đang chọn bằng bàn phím
  function chiTiet(khoa) {
    if (!$bang) return;
    let t = khoa ? tenMoDun(khoa, banLapHien) : '';
    $bang.find('.sra-lr-chi-tiet').text(t || 'Rê chuột lên một cảm biến để xem cổng và vị trí.').toggleClass('goi-y', !t);
    $bang.find('.sra-lr-day path').each(function() { this.classList.toggle('sang', !!khoa && this.getAttribute('data-day') == khoa); });
    $bang.find('.sra-lr-ds-cong li').each(function() { this.classList.toggle('sang', !!khoa && this.getAttribute('data-khoa') == khoa); });
  }

  // Tô sáng vùng nhận được linh kiện đang cầm (bấm chọn)
  function danhDau() {
    if (!$bang) return;
    let dang = keo && keo.dangKeo ? keo : dangCam;
    $bang.toggleClass('dang-cam', !!dang);
    $bang.find('.sra-lr-khay').toggleClass('nhan-duoc', !!dang && dang.tu != 'khay');
    $bang.find('.sra-lr-the').each(function() {
      this.classList.toggle('dang-chon', !!dang && dang.tu == 'khay' && this.getAttribute('data-loai') == dang.loai);
    });
  }

  // ---------- Áp kết quả ----------
  function apDung(kq, giuFocus) {
    dangCam = null;
    if (!kq || !kq.c || kq.khongDoi) { veLai(kq && kq.loi != null ? kq.loi : ''); return false; }
    self.cauHinh = kq.c;
    luu(self.cauHinh);
    veLai(kq.tb, !!giuFocus);
    if (giuFocus && kq.den) {
      let e = $bang.find('.sra-lr-so-do [data-cho="' + kq.den + '"]')[0];
      if (giuFocus == 'xoay') e = $bang.find('.sra-lr-num')[0];
      if (e && e.focus) { e.focus(); chiTiet(kq.den); }
    }
    henDungLai();
    return true;
  }

  // ---------- Toạ độ con trỏ ----------
  // Đổi toạ độ màn hình sang toạ độ sơ đồ, rồi sang vùng gắn và toạ độ thật trên xe
  function diemTai(cx, cy, loai) {
    let s = $bang && $bang.find('.sra-lr-so-do')[0];
    if (!s || !s.getScreenCTM) return null;
    let m = s.getScreenCTM();
    if (!m) return null;
    let p = s.createSVGPoint(); p.x = cx; p.y = cy;
    p = p.matrixTransform(m.inverse());
    let bx = p.x, bz = -p.y;
    let trong = (ten, bien) => { let v = VUNG[ten]; return bx >= v.x0 - bien && bx <= v.x1 + bien && bz >= v.z0 - bien && bz <= v.z1 + bien; };
    // ưu tiên vùng của loại đang kéo khi các vùng mở rộng chạm nhau
    let thu = ['duoi', 'gia', 'nap'];
    if (loai) thu.sort((a, b) => (LOAI[loai].vung == b) - (LOAI[loai].vung == a));
    for (let ten of thu) {
      if (!trong(ten, ten == (loai && LOAI[loai].vung) ? BIEN_HUT[ten] : 0)) continue;
      if (ten == 'duoi') return { vung: ten, x: bx / KX };
      if (ten == 'gia') return { vung: ten, x: bx / KG };
      return { vung: ten, x: bx, z: bz };
    }
    return null;
  }
  const buocLuoi = (ev) => ev && ev.altKey ? 0.1 : 0.5;

  // ---------- Kéo thả và bấm chọn ----------
  function nguonTu(e) {
    while (e && e != document.body) {
      if (e.getAttribute && e.getAttribute('data-xoay')) return { xoay: true };
      if (e.getAttribute && e.getAttribute('data-loai') && e.getAttribute('data-cho') != 'loi') {
        if (e.disabled) return null;
        return { loai: e.getAttribute('data-loai'), tu: e.getAttribute('data-tu') || e.getAttribute('data-cho'), phanTu: e };
      }
      e = e.parentNode;
    }
    return null;
  }

  function batDauKeo(ev) {
    if (ev.button != null && ev.button > 0) return;
    let n = nguonTu(ev.target);
    if (!n) return;
    if (n.xoay) { batDauXoay(ev); return; }
    keo = { loai: n.loai, tu: n.tu, x0: ev.clientX, y0: ev.clientY, dangKeo: false, id: ev.pointerId, bong: null, kq: null };
    document.addEventListener('pointermove', diChuyen);
    document.addEventListener('pointerup', tha);
    document.addEventListener('pointercancel', huyKeo);
  }
  function diChuyen(ev) {
    if (!keo || ev.pointerId != keo.id) return;
    if (!keo.dangKeo) {
      if (Math.hypot(ev.clientX - keo.x0, ev.clientY - keo.y0) < 6) return;
      keo.dangKeo = true;
      dangCam = null;
      chiTiet(null);
      let b = document.createElement('div');
      b.className = 'sra-lr-bong';
      let kich = { sieuAm: [5.2, 2.4], doLine: [1.8, 2.4], cham: [1.8, 2.4], gyro: [2.6, 3.0], gps: [3.0, 3.3] }[keo.loai];
      let s = svg('svg', { viewBox: [-kich[0] / 2, -kich[1] / 2, kich[0], kich[1]].join(' '), width: kich[0] * 24, height: kich[1] * 24 });
      veLinhKien(keo.loai, s);
      b.appendChild(s);
      document.body.appendChild(b);
      keo.bong = b;
      danhDau();
    }
    keo.bong.style.transform = 'translate(' + ev.clientX + 'px,' + ev.clientY + 'px) translate(-50%,-50%)';
    let diem = diemTai(ev.clientX, ev.clientY, keo.loai);
    keo.kq = diem ? timCho(keo.loai, keo.tu, diem, buocLuoi(ev)) : null;
    // trong vùng gắn: bóng theo con trỏ mờ đi, sơ đồ vẽ luôn kết quả (như Tinkercad di chuyển chính vật thể)
    keo.bong.classList.toggle('trong-vung', !!(keo.kq && keo.kq.c));
    veThu(keo.kq, keo.loai, keo.tu, diem);
    if (!diem) $bang.find('.sra-lr-thong-bao').text(keo.tu != 'khay' && !trongBang(ev) ? 'Thả ra: tháo ' + LOAI[keo.loai].tenDay + ' khỏi xe.' : GOI_Y).toggleClass('goi-y', !(keo.tu != 'khay' && !trongBang(ev)));
    ev.preventDefault();
  }
  const trongBang = (ev) => $bang && $bang[0].contains(document.elementFromPoint(ev.clientX, ev.clientY));
  function gocKeo() {
    document.removeEventListener('pointermove', diChuyen);
    document.removeEventListener('pointerup', tha);
    document.removeEventListener('pointercancel', huyKeo);
    if (keo && keo.bong) keo.bong.remove();
    let k = keo; keo = null;
    return k;
  }
  function huyKeo() { gocKeo(); veLai(''); }
  function tha(ev) {
    if (!keo || ev.pointerId != keo.id) return;
    let k = gocKeo();
    if (!k.dangKeo) return;         // chỉ là bấm: sự kiện click xử lí
    self._vuaKeo = Date.now();
    let diem = diemTai(ev.clientX, ev.clientY, k.loai);
    if (!diem) {
      // thả ra ngoài bảng lắp ráp: tháo linh kiện đang gắn; thả vào chỗ khác trong bảng: để nguyên
      if (!trongBang(ev) && k.tu != 'khay') apDung(thao(k.tu));
      else veLai('');
      return;
    }
    apDung(timCho(k.loai, k.tu, diem, buocLuoi(ev)));
  }

  // Kéo núm xoay của cảm biến siêu âm
  function batDauXoay(ev) {
    let m = layMoDun(self.cauHinh, 'gia');
    if (!m) return;
    xoay = { id: ev.pointerId, kq: null };
    document.addEventListener('pointermove', diXoay);
    document.addEventListener('pointerup', thaXoay);
    document.addEventListener('pointercancel', thaXoay);
    ev.preventDefault();
  }
  function gocTai(ev) {
    let s = $bang.find('.sra-lr-so-do')[0], mt = s.getScreenCTM();
    let p = s.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    p = p.matrixTransform(mt.inverse());
    let m = layMoDun(self.cauHinh, 'gia'), h = hinhMoDun(m);
    let g = Math.atan2(-(p.x - h.x), -p.y - h.z) * 180 / Math.PI;
    let buoc = ev.shiftKey ? 45 : (ev.altKey ? 5 : 15);
    return kep(lam(g, buoc), -L.GOC_SA, L.GOC_SA);
  }
  function diXoay(ev) {
    if (!xoay || ev.pointerId != xoay.id) return;
    xoay.kq = datGoc(gocTai(ev));
    if (xoay.kq) {
      let sd = veSoDo(xoay.kq.c, { moi: ['gia'] });
      $bang.find('.sra-lr-vung-so-do').empty().append(sd.svg);
      $bang.find('.sra-lr-thong-bao').text('Thả ra: siêu âm ' + moTaGoc(xoay.kq.c.sieuAmGoc) + '. Giữ Shift để bám 45°.').removeClass('goi-y');
    }
    ev.preventDefault();
  }
  function thaXoay(ev) {
    if (!xoay || ev.pointerId != xoay.id) return;
    document.removeEventListener('pointermove', diXoay);
    document.removeEventListener('pointerup', thaXoay);
    document.removeEventListener('pointercancel', thaXoay);
    let kq = xoay.kq; xoay = null;
    self._vuaKeo = Date.now();
    if (kq && JSON.stringify(kq.c) != JSON.stringify(self.cauHinh)) apDung(kq, 'xoay'); else veLai('');
  }

  // Cầm bằng cú bấm: rê chuột trên sơ đồ thì xem trước, bấm vào vùng gắn thì đặt
  function rePhuot(ev) {
    if (keo || xoay) return;
    if (dangCam) {
      let diem = diemTai(ev.clientX, ev.clientY, dangCam.loai);
      veThu(diem ? timCho(dangCam.loai, dangCam.tu, diem, buocLuoi(ev)) : null, dangCam.loai, dangCam.tu, diem);
      return;
    }
    let e = ev.target, khoa = null;
    while (e && e != $bang[0]) { if (e.getAttribute && e.getAttribute('data-cho') && e.getAttribute('data-loai') && !e.getAttribute('data-tu')) { khoa = e.getAttribute('data-cho'); break; } e = e.parentNode; }
    if (khoa != self._dangRe) { self._dangRe = khoa; chiTiet(khoa); }
  }

  function bam(ev) {
    if (self._vuaKeo && Date.now() - self._vuaKeo < 350) return;
    let n = nguonTu(ev.target);
    if (n && n.xoay) return;
    let trongKhay = $(ev.target).closest('.sra-lr-khay').length > 0;
    if (dangCam) {
      if (n && n.loai == dangCam.loai && n.tu == dangCam.tu) { dangCam = null; veLai(''); return; }     // bấm lại: đặt xuống
      if (trongKhay) {
        if (dangCam.tu != 'khay') { apDung(thao(dangCam.tu)); return; }
        if (n) { dangCam = { loai: n.loai, tu: 'khay' }; veLai(loiCam(n)); return; }
        return;
      }
      let diem = diemTai(ev.clientX, ev.clientY, dangCam.loai);
      if (diem) {
        if (diem.vung != LOAI[dangCam.loai].vung && n) { dangCam = { loai: n.loai, tu: n.tu }; veLai(loiCam(n)); return; }
        apDung(timCho(dangCam.loai, dangCam.tu, diem, buocLuoi(ev)));
        return;
      }
    }
    if (n) { dangCam = { loai: n.loai, tu: n.tu }; veLai(loiCam(n)); return; }
    let diem = diemTai(ev.clientX, ev.clientY);
    if (diem) veLai('Vùng này là ' + TEN_VUNG[diem.vung] + '. Kéo một cảm biến từ khay vào đây.');
  }
  const loiCam = (n) => 'Đang cầm ' + LOAI[n.loai].tenDay + '. Bấm vào ' + TEN_VUNG[LOAI[n.loai].vung] + ' (được tô sáng) để đặt' + (n.tu != 'khay' ? ', hoặc bấm vào khay để tháo.' : '.');

  function phim(ev) {
    let e = ev.target, khoa = e.getAttribute && e.getAttribute('data-cho'), loai = e.getAttribute && e.getAttribute('data-loai');
    if (ev.key == 'Escape') { if (dangCam) { dangCam = null; veLai(''); ev.stopPropagation(); } return; }
    // thẻ trong khay: Enter, Space tự gắn vào chỗ trống
    if ((ev.key == 'Enter' || ev.key == ' ') && e.getAttribute && e.getAttribute('data-tu') == 'khay') {
      ev.preventDefault();
      let kq = tuGan(loai);
      if (apDung(kq)) { let t = $bang.find('.sra-lr-so-do [data-cho="' + kq.den + '"]')[0]; if (t) { t.focus(); chiTiet(kq.den); } }
      return;
    }
    let num = e.getAttribute && e.getAttribute('data-xoay');
    if (num || (khoa == 'gia' && /^[qQeE]$/.test(ev.key))) {
      let g = self.cauHinh.sieuAmGoc, buoc = ev.shiftKey ? 45 : (ev.altKey ? 5 : 15), moi = null;
      if (ev.key == 'ArrowLeft' || ev.key == 'ArrowUp' || ev.key == 'q' || ev.key == 'Q') moi = g + buoc;
      if (ev.key == 'ArrowRight' || ev.key == 'ArrowDown' || ev.key == 'e' || ev.key == 'E') moi = g - buoc;
      if (moi != null) { ev.preventDefault(); let kq = datGoc(kep(lam(moi, buoc), -L.GOC_SA, L.GOC_SA)); if (kq) apDung(kq, num ? 'xoay' : true); }
      return;
    }
    if (!khoa || !loai || e.getAttribute('data-tu')) return;
    if (ev.key == 'Delete' || ev.key == 'Backspace') { ev.preventDefault(); apDung(thao(khoa)); return; }
    let b = ev.altKey ? 0.1 : 0.5, d = { ArrowLeft: [-b, 0], ArrowRight: [b, 0], ArrowUp: [0, b], ArrowDown: [0, -b] }[ev.key];
    if (d) {
      ev.preventDefault();
      if (LOAI[loai].vung != 'nap' && d[0] == 0) return;
      let kq = nhich(khoa, d[0], d[1]);
      if (kq && kq.c) apDung(kq, true);
      else if (kq && kq.loi) $bang.find('.sra-lr-thong-bao').text(kq.loi).removeClass('goi-y');
      return;
    }
    if (ev.key == 'Enter' || ev.key == ' ') { ev.preventDefault(); dangCam = { loai: loai, tu: khoa }; veLai(loiCam({ loai: loai, tu: khoa })); }
  }

  // ---------- Dựng lại xe 3D ----------
  let dangHen = false;
  function henDungLai() {
    dangHen = true;
    clearTimeout(henDung);
    henDung = setTimeout(function() { dangHen = false; dungLai(); }, 120);
  }
  function dungLai() {
    if (dangDung) { canDungLai = true; return; }
    if (typeof robot == 'undefined' || typeof simPanel == 'undefined') return;
    dangDung = true;
    ghiVaoRobot(robot.options, self.cauHinh);
    let mau = typeof robotTemplates != 'undefined' && robotTemplates.find((t) => t.name == robot.options.name);
    if (mau) ghiVaoRobot(mau, self.cauHinh);
    let xong = function() {
      dangDung = false;
      datCamera();
      if (canDungLai) { canDungLai = false; dungLai(); }
    };
    Promise.resolve(simPanel.resetSim()).then(xong, xong);
  }
  // Lời hứa hoàn tất khi xe 3D đã dựng xong theo cấu hình mới nhất
  this.choDungXong = function() {
    return new Promise(function(xong) {
      (function cho() { if (!dangDung && !canDungLai && !dangHen) xong(); else setTimeout(cho, 50); })();
    });
  };

  // Đưa camera lại gần xe để thấy rõ chỗ vừa lắp; bảng che bên trái nên dời xe sang phải khung hình
  function datCamera() {
    if (!self.dangMo || typeof babylon == 'undefined' || !babylon.cameraArc) return;
    let cam = babylon.cameraArc;
    try {
      let rong = $('#simPanel').width() || 0, bang = $bang ? $bang.outerWidth() : 0;
      let hep = $bang && $bang.hasClass('hep');
      // nửa bề rộng khung nhìn tại khoảng cách của xe, tính theo đơn vị sân
      let nuaRong = cam.radius * Math.tan(cam.fov / 2) * (cam.fovMode == BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED ? 1 : babylon.engine.getAspectRatio(cam));
      let nuaCao = cam.radius * Math.tan(cam.fov / 2);
      cam.targetScreenOffset = hep ? new BABYLON.Vector2(0, nuaCao * 0.6) : new BABYLON.Vector2(nuaRong * (bang + 16) / rong, 0);
    } catch (e) {}
  }
  function cameraGan() {
    if (typeof babylon == 'undefined' || !babylon.cameraArc) return;
    let cam = babylon.cameraArc;
    camTruoc = { cheDo: babylon.cameraMode, radius: cam.radius, alpha: cam.alpha, beta: cam.beta };
    try {
      babylon.setCameraMode('follow');
      cam = babylon.cameraArc;
      cam.radius = 50; cam.beta = 1.0;
      // nhìn chéo từ phía trước bên trái của xe
      let huong = robot.body.absoluteRotationQuaternion.toEulerAngles().y;
      cam.alpha = -Math.PI / 2 - huong + Math.PI + 0.75;
    } catch (e) {}
    datCamera();
  }
  function cameraVe() {
    if (typeof babylon == 'undefined' || !babylon.cameraArc) return;
    try {
      babylon.cameraArc.targetScreenOffset = new BABYLON.Vector2(0, 0);
      if (camTruoc) {
        babylon.setCameraMode(camTruoc.cheDo);
        babylon.cameraArc.radius = camTruoc.radius; babylon.cameraArc.alpha = camTruoc.alpha; babylon.cameraArc.beta = camTruoc.beta;
      }
    } catch (e) {}
    camTruoc = null;
  }

  // Khung mô phỏng hẹp thì bảng chuyển sang nằm ngang ở nửa dưới
  function datBoCuc() {
    if (!$bang) return;
    let rong = $('#simPanel').width() || 0;
    let hep = rong > 0 && rong < 760;
    $bang.toggleClass('hep', hep);
    $('#simPanel').toggleClass('sra-lr-dang-mo', !hep);     // dời các nút chạy, đặt lại… ra khỏi vùng bảng che
    datCamera();
  }
  if (typeof window != 'undefined') window.addEventListener('resize', datBoCuc);

  // ---------- Mở, đóng ----------
  this.mo = function() {
    if (self.dangMo) return Promise.resolve();
    let buoc = Promise.resolve();
    if (!laXe()) {
      // đang dùng robot khác (ngoài bài học): chuyển sang xe lắp mô-đun
      let mau = typeof robotTemplates != 'undefined' && robotTemplates.find((t) => t.name == TEN_ROBOT);
      if (!mau || trongBai()) return Promise.resolve();
      robot.options = JSON.parse(JSON.stringify(mau));
      buoc = Promise.resolve(simPanel.resetSim());
    }
    return buoc.then(function() {
      self.cauHinh = L.chuanHoaCauHinh(robot.options.sraXe === true ? {} : robot.options.sraXe);
      self.dangMo = true;
      dangCam = null;
      $bang = $(
        '<section class="sra-lr-bang" aria-label="Bảng lắp ráp xe">' +
          '<header><h2>Lắp ráp xe</h2><button type="button" class="sra-lr-dong" aria-label="Đóng bảng lắp ráp">&times;</button></header>' +
          '<div class="sra-lr-than">' +
            '<div class="sra-lr-cot"><div class="sra-lr-vung-so-do"></div><p class="sra-lr-chi-tiet" aria-live="polite"></p><p class="sra-lr-khoi-luong"></p></div>' +
            '<div class="sra-lr-cot">' +
              '<div class="sra-lr-vung-khay"></div>' +
              '<p class="sra-lr-thong-bao" role="status" aria-live="polite"></p>' +
              '<div class="sra-lr-vung-thong-tin"></div>' +
            '</div>' +
          '</div>' +
          '<footer><button type="button" class="sra-lr-mac-dinh">Về mặc định</button><button type="button" class="sra-lr-thao-het">Tháo hết cảm biến</button></footer>' +
        '</section>');
      $('#simPanel').append($bang);
      datBoCuc();
      $bang.on('pointerdown', batDauKeo);
      $bang.on('click', '.sra-lr-vung-khay, .sra-lr-vung-so-do', bam);
      $bang.on('pointermove', rePhuot);
      $bang.on('pointerleave', function() { if (!keo && !xoay && dangCam) veThu(null, dangCam.loai, dangCam.tu, null); });
      $bang.on('focusin', function(e) { let k = e.target.getAttribute && e.target.getAttribute('data-cho'); if (k && e.target.getAttribute('data-loai') && !e.target.getAttribute('data-tu')) chiTiet(k); });
      $bang.on('keydown', phim);
      $bang.on('dragstart', (e) => e.preventDefault());
      $bang.find('.sra-lr-dong').on('click', self.dong);
      $bang.find('.sra-lr-mac-dinh').on('click', function() {
        self.cauHinh = L.chuanHoaCauHinh({}); dangCam = null; xoaLuu();
        veLai('Đã đưa xe về bản lắp mặc định.'); henDungLai();
      });
      $bang.find('.sra-lr-thao-het').on('click', function() {
        self.cauHinh = L.chuanHoaCauHinh({ sieuAm: false, duoi: [], tren: [] }); dangCam = null; luu(self.cauHinh);
        veLai('Đã tháo hết cảm biến.'); henDungLai();
      });
      veLai('');
      cameraGan();
      $bang.find('.sra-lr-dong').trigger('focus');
    });
  };
  this.dong = function() {
    if (!self.dangMo) return;
    gocKeo();
    if (xoay) { document.removeEventListener('pointermove', diXoay); document.removeEventListener('pointerup', thaXoay); document.removeEventListener('pointercancel', thaXoay); xoay = null; }
    self.dangMo = false;
    dangCam = null;
    if ($bang) $bang.remove();
    $bang = null;
    $('#simPanel').removeClass('sra-lr-dang-mo');
    cameraVe();
  };
  this.batTat = function() { return self.dangMo ? self.dong() : self.mo(); };

  // Dùng cho kiểm tra tự động và cho ai muốn lắp bằng lệnh:
  //   SRABangLapRap.dat('doLine', 'khay', { vung: 'duoi', x: -1 })   gắn mắt dò line ở x = −1 cm
  //   SRABangLapRap.dat('gyro', 'tren:0', 'khay')                     tháo mô-đun đầu tiên trên nắp
  this.dat = function(loai, tu, diem, buoc) {
    let kq = diem == 'khay' ? thao(tu) : timCho(loai, tu, diem, buoc || 0.5);
    apDung(kq);
    return self.choDungXong().then(() => kq);
  };
  this.xoay = function(goc) { apDung(datGoc(goc)); return self.choDungXong(); };
  // Toạ độ trên màn hình của một vị trí thật trên xe (để kiểm tra tự động kéo chuột tới đó)
  this.toaDoManHinh = function(diem) {
    let s = $bang && $bang.find('.sra-lr-so-do')[0];
    if (!s) return null;
    if (diem.vung == 'xoay') {      // điểm trên cung xoay của siêu âm ứng với góc diem.goc
      let h = hinhMoDun(layMoDun(self.cauHinh, 'gia')), a = diem.goc * Math.PI / 180;
      diem = { vung: 'tho', x: h.x - 2.9 * Math.sin(a), z: h.z + 2.9 * Math.cos(a) };
    }
    let bx = diem.vung == 'duoi' ? KX * diem.x : (diem.vung == 'gia' ? KG * diem.x : diem.x);
    let bz = diem.vung == 'duoi' ? ZB : (diem.vung == 'gia' ? ZG + 1.1 : diem.z);
    if (diem.vung == 'tho') bx = diem.x;
    let p = s.createSVGPoint(); p.x = bx; p.y = Y(bz);
    p = p.matrixTransform(s.getScreenCTM());
    return [p.x, p.y];
  };

  // Đổi robot khác trong lúc bảng đang mở thì đóng bảng
  if (typeof window != 'undefined') {
    setInterval(function() { if (self.dangMo && !dangDung && !laXe()) self.dong(); }, 500);
  }
};
