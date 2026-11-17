// Sân Robot Ảo – xe lắp mô-đun: bảng lắp ráp (kéo thả cảm biến lên xe, kiểu Tinkercad).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Bảng gồm khay linh kiện và sơ đồ xe nhìn từ trên xuống. Kéo một cảm biến từ khay thả vào một vùng gắn
// (hoặc bấm cảm biến rồi bấm vào vùng gắn) thì cấu hình lắp đổi theo, xe 3D bên cạnh được dựng lại ngay:
// hình, hitbox, khối lượng và số cổng đều tính lại từ cùng danh mục linh kiện (linh-kien.js).
//
// Vùng gắn (giới hạn xem linh-kien.js):
//   duoi   thanh dưới mũi xe     mắt dò line (tối đa 3), cảm biến chạm (tối đa 1), đặt ở x bất kì
//   gia:truoc, gia:trai, gia:phai, gia:sau   bốn giá siêu âm (mỗi giá một cảm biến), trượt và xoay quanh trục đứng
//   nap    nắp mạch chủ          gyro, GPS, đặt ở (x, z) bất kì trên nắp
//   gam    gầm xe (dưới tấm đáy)  mắt dò line (tối đa 4), đặt ở (x, z) bất kì; chỉ hiện ở chế độ "Nhìn gầm xe"
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
    sieuAm: { ten: 'Siêu âm', tenDay: 'cảm biến siêu âm HC-SR04', vung: 'gia', moTa: 'Đo khoảng cách tới vật phía trước (gắn được trước, trái, phải, sau)' },
    doLine: { ten: 'Dò line', tenDay: 'mắt dò line TCRT5000', vung: 'duoi', moTa: 'Phân biệt nền sáng và vạch tối dưới gầm' },
    cham: { ten: 'Chạm', tenDay: 'cảm biến chạm', vung: 'duoi', moTa: 'Báo khi tấm cản ở mũi xe bị ép vào' },
    gyro: { ten: 'Gyro', tenDay: 'cảm biến gyro', vung: 'nap', moTa: 'Đo góc xe đã quay' },
    gps: { ten: 'GPS', tenDay: 'mô-đun GPS', vung: 'nap', moTa: 'Cho biết toạ độ của xe trên sân' }
  };
  const THU_TU = ['sieuAm', 'doLine', 'cham', 'gyro', 'gps'];
  const TEN_VUNG = { gam: 'gầm xe', duoi: 'thanh dưới mũi xe', gia: 'giá siêu âm', 'gia:truoc': 'giá phía mũi', 'gia:trai': 'giá bên trái', 'gia:phai': 'giá bên phải', 'gia:sau': 'giá phía đuôi', nap: 'nắp mạch chủ' };
  // vùng v có nhận được loại cảm biến này không
  const hopVung = (loai, v) => !!v && (LOAI[loai].vung == 'gia' ? v.indexOf('gia:') == 0 : v == LOAI[loai].vung || (loai == 'doLine' && v == 'gam'));
  // mô-đun m (trong cấu hình hoặc bóng thử) có nằm dưới gầm không: chỉ mắt dò line dưới gầm có toạ độ z
  const laGam = (m) => !!m && m.loai == 'doLine' && m.z != null;
  const SON_GOC = { khung: '#b9c0c7', canGat: '#f07a1a', vanh: '#f09c0d' };
  const TEN_SON = { khung: 'Khung', canGat: 'Tấm cản', vanh: 'Vành bánh' };
  const TEN_MAU = { '#c62828': 'đỏ', '#ef6c00': 'cam', '#f9a825': 'vàng', '#2e7d32': 'xanh lá', '#00838f': 'xanh ngọc', '#1565c0': 'xanh dương', '#6a1b9a': 'tím', '#d81b60': 'hồng', '#263238': 'đen', '#eceff1': 'trắng' };

  // Sơ đồ: đơn vị cm, x sang phải, z (phía trước xe) hướng lên trên màn hình.
  // Thân xe và nắp mạch vẽ đúng tỉ lệ. Thanh dưới mũi và giá siêu âm vẽ tách ra phía trước (kiểu hình vẽ
  // tháo rời); thanh dưới mũi phóng to theo chiều ngang KX lần để dễ kéo thả bằng chuột lẫn ngón tay.
  const SD = { x0: -10.2, x1: 10.2, z0: -9.2, z1: 22.0 };
  const SD_GAM = { x0: -7.5, x1: 7.5, z0: -6.6, z1: 16.35 };     // nhìn gầm: phóng to (cùng tỉ lệ khung với SD)
  const Y = (z) => -z;
  const KX = 2.4, ZB = 13.4, TI_LE_DUOI = 1.8;           // thanh dưới mũi: x sơ đồ = KX · x thật
  const ZG = 16.9;                                        // giá siêu âm phía mũi (đúng tỉ lệ): đường mặt trước thanh giá trên sơ đồ
  const VUNG = {
    duoi: { x0: -8.6, x1: 8.6, z0: ZB - 2.2, z1: ZB + 2.2 },
    'gia:truoc': { x0: -4.9, x1: 4.9, z0: ZG - 0.45, z1: SD.z1 },
    'gia:sau': { x0: -4.9, x1: 4.9, z0: SD.z0, z1: -4.05 },
    'gia:trai': { x0: SD.x0 + 0.1, x1: -4.55, z0: -4.6, z1: 8.6 },
    'gia:phai': { x0: 4.55, x1: SD.x1 - 0.1, z0: -4.6, z1: 8.6 },
    nap: { x0: L.NAP.x0, x1: L.NAP.x1, z0: L.NAP.z0, z1: L.NAP.z1 },
    // gầm xe (chỉ ở chế độ nhìn gầm): đúng tỉ lệ, cả mạch đầu đo lẫn ổ cắm phía sau nằm gọn dưới tấm đáy
    gam: { x0: -L.GAM.x - L.GAM.nuaRong, x1: L.GAM.x + L.GAM.nuaRong, z0: -4.0, z1: L.GAM.z1 + L.GAM.nuaDai }
  };
  const BIEN_HUT = { gam: 0.8, duoi: 0.9, 'gia:truoc': 0.6, 'gia:sau': 0.6, 'gia:trai': 0.4, 'gia:phai': 0.4, nap: 1.0 };      // vùng nhận rộng thêm ra ngoài khung (cm sơ đồ)
  const HUT = 1.5;                                        // bán kính hút tới chỗ trống gần nhất (cm thật)

  const GOI_Y = 'Kéo cảm biến vào vùng gắn trên xe. Kéo ra ngoài bảng để tháo. Giữ Alt để đặt mịn hơn.';

  this.dangMo = false;
  this.cauHinh = null;
  let $bang = null, dangCam = null, keo = null, xoay = null, henDung = null, dangDung = false, canDungLai = false, camTruoc = null;
  let xemTruoc = null;       // kết quả đang vẽ thử (lúc kéo hoặc lúc cầm rê chuột)
  let xemGam = false;        // sơ đồ đang nhìn gầm xe (từ dưới lên) thay vì nhìn từ trên xuống

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
  // Mỗi mô-đun đang gắn có một khoá: 'duoi:i', 'tren:i', 'gam:i' (i: thứ tự trái sang phải trong vùng), 'sa:<giá>'
  const tho = (c) => ({ banh: c.banh, sa: c.sa.map((m) => Object.assign({}, m)), son: Object.assign({}, c.son),
    duoi: c.duoi.map((m) => Object.assign({}, m)), tren: c.tren.map((m) => Object.assign({}, m)), gam: c.gam.map((m) => Object.assign({}, m)) });
  const DS_KHOA = ['duoi', 'tren', 'gam'];
  function layMoDun(c, khoa) {
    if (!khoa || khoa == 'khay') return null;
    if (khoa.indexOf('sa:') == 0) { let m = c.sa.find((n) => 'sa:' + n.gia == khoa); return m ? Object.assign({ loai: 'sieuAm' }, m) : null; }
    let p = khoa.split(':'), ds = DS_KHOA.indexOf(p[0]) >= 0 ? c[p[0]] : [];
    return ds[Number(p[1])] || null;
  }
  function demLoai(c, loai) {
    if (loai == 'sieuAm') return c.sa.length;
    return c.duoi.concat(c.tren, c.gam).filter((m) => m.loai == loai).length;
  }
  const tongMoDun = (c) => c.sa.length + c.duoi.length + c.tren.length + c.gam.length;
  const demDuoi = (c, loai) => c.duoi.filter((m) => m.loai == loai).length;
  const conLai = (c, loai) => L.TOI_DA[loai] - demLoai(c, loai);
  const hetO = (c) => tongMoDun(c) >= L.SO_O;
  const LOI_HET_O = 'Mạch chủ chỉ có ' + L.SO_O + ' ổ cắm và đã cắm đủ. Tháo bớt một cảm biến trước.';
  // Khoá của mô-đun loai ở vị trí (x, z) trong cấu hình c
  function timKhoa(c, loai, x, z) {
    if (loai == 'sieuAm') return c.sa.some((m) => m.gia == x) ? 'sa:' + x : null;      // x: tên giá
    let ten = loai == 'doLine' && z != null ? 'gam' : (LOAI[loai].vung == 'duoi' ? 'duoi' : 'tren'), ds = c[ten];
    let i = ds.findIndex((m) => m.loai == loai && Math.abs(m.x - x) < 1e-6 && (z == null || Math.abs(m.z - z) < 1e-6));
    return i < 0 ? null : ten + ':' + i;
  }
  function boMoDun(c, khoa) {
    if (khoa.indexOf('sa:') == 0) { c.sa = c.sa.filter((m) => 'sa:' + m.gia != khoa); return; }
    let p = khoa.split(':');
    c[p[0]].splice(Number(p[1]), 1);
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
    if (!hopVung(loai, diem.vung)) return { loi: lyDoKhongNhan(diem.vung, loai) };
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
    if (tuKhay && hetO(c0)) return { loi: LOI_HET_O };

    if (vung == 'gia') {
      let gia = diem.vung.slice(4), tenGia = TEN_VUNG[diem.vung];
      let dangCo = c.sa.find((m) => m.gia == gia);         // giá đích đã có cảm biến khác (không kể cái đang kéo)
      let gocXoay = goc && goc.gia == gia ? goc.goc : (dangCo ? dangCo.goc : 0);
      let gh = L.gioiHanU(gia, gocXoay), u = tron2(kep(lam(diem.u, buoc), gh[0], gh[1]));
      let doi = null;
      if (dangCo) {
        if (!goc) return { loi: viet(tenGia) + ' đã có cảm biến siêu âm. Mỗi giá gắn một cái; kéo vào giá khác còn trống.' };
        // đổi chỗ: cảm biến đang ở giá đích chuyển sang giá của cảm biến đang kéo
        c.sa = c.sa.filter((m) => m.gia != gia);
        let gh2 = L.gioiHanU(goc.gia, goc.goc);
        doi = { gia: goc.gia, u: tron2(kep(goc.u, gh2[0], gh2[1])), goc: goc.goc, cao: goc.cao };      // độ cao gắn với giá: mỗi giá giữ độ cao của mình
        c.sa.push(doi);
      }
      c.sa.push({ gia: gia, u: u, goc: gocXoay, cao: goc && goc.gia == gia ? goc.cao : (dangCo ? dangCo.cao : null) });
      let cc = L.chuanHoaCauHinh(c), den = 'sa:' + gia;
      if (JSON.stringify(cc) == JSON.stringify(c0) && tu == den) return { loi: '', khongDoi: true, den: den, c: cc };
      return { c: cc, den: den, doi: doi ? 'sa:' + doi.gia : null,
        tb: doi ? 'Đã đổi chỗ hai cảm biến siêu âm.' : 'Đã gắn ' + LOAI[loai].tenDay + ' lên ' + tenGia + ', ' + (L.GIA[gia].truc == 'x' ? 'x' : 'z') + ' = ' + soViet(u) + ' cm.' + ghiNang(goc && goc.gia == gia ? goc.cao : null, cc, gia) };
    }

    if (diem.vung == 'gam') {
      let G = L.GAM, p0 = { loai: loai, x: tron2(kep(lam(diem.x, buoc), -G.x, G.x)), z: tron2(kep(lam(diem.z, buoc), G.z0, G.z1)) };
      // thả ngay lên mắt dò line khác dưới gầm (kéo từ gầm): đổi chỗ hai mắt
      let tren = c.gam.findIndex((m) => Math.abs(diem.x - m.x) < G.nuaRong && diem.z > m.z - G.nuaDai - 1.9 && diem.z < m.z + G.nuaDai);
      if (tren >= 0 && goc && laGam(goc)) {
        let m = c.gam[tren], ds = c.gam.slice(); ds.splice(tren, 1);
        let moi = { loai: loai, x: m.x, z: m.z }, cu = { loai: m.loai, x: goc.x, z: goc.z };
        if (!L.loiGam(moi.x, moi.z, ds) && !L.loiGam(cu.x, cu.z, ds.concat([moi]))) {
          c.gam = ds.concat([moi, cu]);
          return ketQua(c, 'gam', moi, cu, 'Đã đổi chỗ hai mắt dò line dưới gầm.');
        }
      }
      if (c.gam.length >= G.toiDa) return { loi: 'Gầm xe gắn tối đa ' + G.toiDa + ' mắt dò line.' };
      let n = Math.round(HUT / buoc), ung = [];
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
        let p = { loai: loai, x: tron2(p0.x + i * buoc), z: tron2(p0.z + j * buoc) };
        if (Math.hypot(i, j) * buoc <= HUT + 1e-6) ung.push({ p: p, d: Math.hypot(p.x - diem.x, p.z - diem.z) });
      }
      ung.sort((a, b) => a.d - b.d);
      for (let u of ung) {
        if (L.loiGam(u.p.x, u.p.z, c.gam)) continue;
        c.gam.push(u.p);
        return ketQua(c, 'gam', u.p, null, 'Đã gắn ' + LOAI[loai].tenDay + ' dưới gầm xe, x = ' + soViet(u.p.x) + ' cm, z = ' + soViet(u.p.z) + ' cm.');
      }
      return { loi: L.loiGam(p0.x, p0.z, c.gam) || 'Không còn chỗ trống ở đây.' };
    }

    if (diem.vung == 'duoi') {
      if (demDuoi(c, loai) >= L.TOI_DA_DUOI[loai] && !c.duoi.some((m) => Math.abs(m.x - diem.x) < 0.7 && m.loai == loai)) {
        return { loi: 'Thanh dưới mũi gắn tối đa ' + L.TOI_DA_DUOI[loai] + ' ' + LOAI[loai].tenDay + '.' + (loai == 'doLine' ? ' Chuyển sang "Nhìn gầm xe" để gắn thêm mắt dưới gầm.' : '') };
      }
      let lim = L.X_DUOI[loai], x0 = tron2(kep(lam(diem.x, buoc), -lim, lim));
      // thả ngay lên một mô-đun khác: đổi chỗ (kéo từ xe) hoặc thay thế (kéo từ khay)
      let tren = c.duoi.findIndex((m) => Math.abs(m.x - diem.x) < 0.7);
      if (tren >= 0) {
        let m = c.duoi[tren];
        if (goc && LOAI[goc.loai].vung == 'duoi' && !laGam(goc)) {
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
    if (hetO(self.cauHinh)) return { loi: LOI_HET_O };
    if (vung == 'gia') {
      let gia = L.DS_GIA.find((g) => !self.cauHinh.sa.some((m) => m.gia == g));
      return timCho(loai, 'khay', { vung: 'gia:' + gia, u: L.GIA[gia].u ? 1.5 : 0 }, 0.5);
    }
    if (vung == 'duoi' && (xemGam || demDuoi(self.cauHinh, loai) >= L.TOI_DA_DUOI[loai]) && loai == 'doLine') {
      // đang nhìn gầm, hoặc thanh dưới mũi đã đủ mắt: gắn dưới gầm, thử từ giữa xe ra hai bên
      for (let z of [4, 6, 2, 8, 0]) for (let x of [0, -1.5, 1.5, -3, 3, -3.75, 3.75]) {
        if (!L.loiGam(x, z, self.cauHinh.gam)) return timCho(loai, 'khay', { vung: 'gam', x: x, z: z }, 0.5);
      }
      return { loi: 'Gầm xe không còn chỗ trống.' };
    }
    if (vung == 'duoi') {
      if (demDuoi(self.cauHinh, loai) >= L.TOI_DA_DUOI[loai]) return { loi: 'Thanh dưới mũi đã đủ ' + LOAI[loai].tenDay + '.' };
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
      if (m.loai == 'sieuAm') {
        let doc = L.GIA[m.gia].truc == 'z', d = doc ? dz : dx, gh = L.gioiHanU(m.gia, m.goc), u = tron2(m.u + d);
        if (d == 0) return null;
        if (u < gh[0] - 1e-6 || u > gh[1] + 1e-6) return { loi: 'Cảm biến siêu âm đã ra tới mép giá.' };
        c.sa.push({ gia: m.gia, u: u, goc: m.goc, cao: m.cao });
        let cc = L.chuanHoaCauHinh(c);
        return { c: cc, den: tu, tb: 'Siêu âm ' + L.GIA[m.gia].ten + ' ở ' + (doc ? 'z' : 'x') + ' = ' + soViet(u) + ' cm.' + ghiNang(m.cao, cc, m.gia) };
      }
      if (laGam(m)) {
        let x = tron2(m.x + k * dx), z = tron2(m.z + k * dz), G = L.GAM;
        if (Math.abs(x) > G.x + 1e-6 || z < G.z0 - 1e-6 || z > G.z1 + 1e-6) return { loi: L.loiGam(x, z, []) || '' };
        if (L.loiGam(x, z, c.gam)) { if (L.loiGam(x, z, []) || k * Math.abs(dz) > 3) return { loi: L.loiGam(x, z, c.gam) }; continue; }
        c.gam.push({ loai: m.loai, x: x, z: z });
        let cc = L.chuanHoaCauHinh(c);
        return { c: cc, den: timKhoa(cc, m.loai, x, z), tb: 'Mắt dò line dưới gầm ở x = ' + soViet(x) + ' cm, z = ' + soViet(z) + ' cm.' };
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
  function datGoc(khoa, g) {
    let c = tho(self.cauHinh), m = c.sa.find((n) => 'sa:' + n.gia == khoa);
    if (!m) return null;
    g = kep(g, -L.GOC_SA, L.GOC_SA);
    let gh = L.gioiHanU(m.gia, g);
    m.goc = g; m.u = tron2(kep(m.u, gh[0], gh[1]));
    return { c: L.chuanHoaCauHinh(c), den: khoa, tb: 'Siêu âm ' + L.GIA[m.gia].ten + ' ' + moTaGoc(g) + '.' };
  }
  // Sơn một phần của xe (khung, tấm cản, vành bánh); mau null là trả về màu gốc
  function datSon(phan, mau) {
    if (!TEN_SON[phan]) return null;
    let c = tho(self.cauHinh);
    c.son = Object.assign({}, c.son); c.son[phan] = mau || null;
    return { c: L.chuanHoaCauHinh(c), tb: mau ? 'Đã sơn ' + TEN_SON[phan].toLowerCase() + ' màu ' + (TEN_MAU[mau] || mau) + '.' : TEN_SON[phan] + ' về màu gốc.' };
  }
  // Vị trí u nhỏ nhất (bước 0,5 cm) để cảm biến trên giá bên qua khỏi bánh xe
  function zQuaBanh(gia, goc) {
    let u = L.GIA[gia].u[0];
    while (u < L.GIA[gia].u[1] && L.nganBanh(gia, u, goc)) u += 0.5;
    return u;
  }
  // Đổi độ cao (cm, tâm cảm biến so với mặt sân) của cảm biến siêu âm khoa
  function datCao(khoa, cao) {
    let c = tho(self.cauHinh), m = c.sa.find((n) => 'sa:' + n.gia == khoa);
    if (!m) return null;
    let gh = L.gioiHanCao(m.gia, m.u, m.goc);
    cao = tron2(kep(Math.round(cao * 10) / 10, gh[0], gh[1]));
    if (cao == m.cao) {
      if (cao > gh[0] + 1e-6) return { loi: 'Siêu âm ' + L.GIA[m.gia].ten + ' đã ở cao nhất (' + soViet(gh[1]) + ' cm).' };
      let lyDo = m.gia == 'truoc' ? 'hạ nữa thì đụng công tắc chạm.' : (m.gia == 'sau' ? 'hạ nữa thì quá sát mặt sân.'
        : (L.nganBanh(m.gia, m.u, m.goc) ? 'cảm biến đang nằm ngang bánh xe. Dời nó lên phía mũi (z từ ' + soViet(zQuaBanh(m.gia, m.goc)) + ' cm) thì hạ được tới ' + soViet(L.GIA[m.gia].cao[0]) + ' cm.' : 'hạ nữa thì quá sát mặt sân.'));
      return { loi: 'Siêu âm ' + L.GIA[m.gia].ten + ' đã ở thấp nhất (' + soViet(gh[0]) + ' cm): ' + lyDo };
    }
    m.cao = cao;
    return { c: L.chuanHoaCauHinh(c), den: khoa, tb: 'Siêu âm ' + L.GIA[m.gia].ten + ' cao ' + soViet(cao) + ' cm so với mặt sân.' };
  }
  // Câu ghi thêm khi độ cao bị nâng lên tự động vì cảm biến đã dời về chỗ ngang bánh xe
  function ghiNang(cu, cc, gia) {
    let moi = cc.sa.find((n) => n.gia == gia);
    return cu != null && moi && moi.cao > cu + 1e-6 ? ' Cảm biến được nâng lên ' + soViet(moi.cao) + ' cm để vỏ không đụng bánh xe.' : '';
  }
  const moTaGoc = (g) => Math.abs(g) < 1e-6 ? 'nhìn thẳng ra trước' : 'xoay ' + soViet(Math.abs(g)) + '° sang ' + (g > 0 ? 'trái' : 'phải');

  function tenMoDun(khoa, banLap, c) {
    let m = layMoDun(c || self.cauHinh, khoa);
    if (!m) return '';
    let cb = banLap && banLap.camBien.find((x) => khoaCua(x) == khoa);
    let ten = LOAI[m.loai].tenDay + (cb && cb.ten && m.loai != 'cham' ? ' (' + cb.ten + ')' : '');
    let viTri = m.loai == 'sieuAm' ? 'trên ' + TEN_VUNG['gia:' + m.gia] + ', ' + (L.GIA[m.gia].truc == 'x' ? 'x' : 'z') + ' = ' + soViet(m.u) + ' cm, cao ' + soViet(m.cao) + ' cm, ' + moTaGoc(m.goc)
      : laGam(m) ? 'dưới gầm xe, x = ' + soViet(m.x) + ' cm, z = ' + soViet(m.z) + ' cm'
      : (LOAI[m.loai].vung == 'duoi' ? 'dưới mũi xe, ' + moTaX(m.x) : 'trên nắp mạch chủ, x = ' + soViet(m.x) + ' cm, z = ' + soViet(m.z) + ' cm');
    return viet(ten) + ' ' + viTri + (cb ? '. Cổng ' + cb.cong.slice(2) + ' trong chương trình, cắm ổ ' + cb.oMach + ' trên mạch chủ.' : '.');
  }
  function lyDoKhongNhan(vung, loai) {
    if (!vung) return '';
    let dung = THU_TU.filter((l) => hopVung(l, vung)).map((l) => LOAI[l].tenDay);
    let o = LOAI[loai].vung == 'gia' ? 'một trong bốn giá siêu âm (trước, trái, phải, sau)' : TEN_VUNG[LOAI[loai].vung] + (loai == 'doLine' ? ' hoặc gầm xe' : '');
    if (vung == 'gam') return 'Gầm xe chỉ gắn được mắt dò line. ' + viet(LOAI[loai].tenDay) + ' gắn ở ' + o + ': bấm "Nhìn từ trên" để thấy chỗ đó.';
    return viet(TEN_VUNG[vung]) + ' chỉ gắn được ' + dung.join(' hoặc ') + '. ' + viet(LOAI[loai].tenDay) + ' gắn ở ' + o + '.';
  }
  const khoaCua = (cb) => cb.loai == 'sieuAm' ? 'sa:' + cb.gia : (cb.gam != null ? 'gam:' + cb.gam : (cb.duoi != null ? 'duoi:' + cb.duoi : 'tren:' + cb.tren));

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
    if (k.k == 'cau') { let c = ra([0, 0, 0]); return { tron: [c[0], c[2], k.d / 2], cao: c[1] + k.d / 2, thap: c[1] - k.d / 2 }; }
    if (k.k == 'tru') {
      let a = Q.quay(k.q, [0, 1, 0]), c = ra([0, 0, 0]);
      if (Math.abs(a[1]) > 0.95) return { tron: [c[0], c[2], k.d / 2], cao: c[1] + k.h / 2, thap: c[1] - k.h / 2 };
      let d = V.donVi([a[0], 0, a[2]]), n = [-d[2], 0, d[0]], ds = [];
      for (let s of [-1, 1]) for (let t of [-1, 1]) ds.push([c[0] + s * d[0] * k.h / 2 + t * n[0] * k.d / 2, c[2] + s * d[2] * k.h / 2 + t * n[2] * k.d / 2]);
      return { da: baoLoi(ds), cao: c[1] + k.d / 2, thap: c[1] - k.d / 2 };
    }
    let dinh = [];
    if (k.k == 'hop') { for (let i = 0; i < 8; i++) dinh.push([(i & 1 ? 1 : -1) * k.kt[0] / 2, (i & 2 ? 1 : -1) * k.kt[1] / 2, (i & 4 ? 1 : -1) * k.kt[2] / 2]); }
    else dinh = k.dinh;
    let w = dinh.map(ra);
    return { da: baoLoi(w.map((p) => [p[0], p[2]])), cao: Math.max.apply(null, w.map((p) => p[1])), thap: Math.min.apply(null, w.map((p) => p[1])) };
  }
  function mauVatLieu(ten) {
    let v = (typeof SRAXeDungHinh != 'undefined' && (SRAXeDungHinh.laySon(ten) || SRAXeDungHinh.VAT_LIEU[ten])) || { mau: '#888' };
    return v.mau;
  }

  // Thân xe chưa gắn cảm biến, nhìn từ trên xuống (tính lại khi đổi màu sơn)
  let hinhNen = null, sonNen = null;
  function veNen(cha, son) {
    if (!hinhNen || JSON.stringify(son) != sonNen) {
      sonNen = JSON.stringify(son);
      let tran = L.lapXe({ sa: [], duoi: [], tren: [], son: son });
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

  // Gầm xe nhìn từ dưới lên (không lật trái phải để bên trái sơ đồ vẫn là bên trái xe): chỉ vẽ các chi tiết
  // thò xuống dưới mặt trên tấm đáy, chi tiết càng thấp (càng gần người nhìn) vẽ càng sau
  let hinhGam = null, khoaGam = null;
  function veNenGam(cha, c) {
    let khoa = JSON.stringify([c.son, c.duoi]);
    if (!hinhGam || khoa != khoaGam) {
      khoaGam = khoa;
      let tran = L.lapXe({ sa: [], duoi: c.duoi, tren: [], gam: [], son: c.son });
      L.tinhXe(tran);
      let ds = [], yTren = L.TS.yDay + L.TS.dayKhung - 0.05;
      tran.than.forEach(function(ct) {
        if (ct.id.indexOf('day_') == 0) return;
        ct.khoi.forEach(function(k) { let h = chieu(k); if (h.thap < yTren) ds.push(Object.assign(h, { vl: k.vl })); });
      });
      tran.banh.forEach(function(b) { b.khoi.forEach(function(k) { if (!k.trong) ds.push(Object.assign(chieu(k, b.tam), { vl: k.vl })); }); });
      ds.push({ tron: [0, L.TS.zBi, L.TS.dBi / 2], thap: 0, vl: 'thep_ma' });          // viên bi tự do
      ds.sort((a, b) => b.thap - a.thap);
      hinhGam = ds;
    }
    let g = svg('g', { 'class': 'sra-lr-nen sra-lr-nen-gam' }, cha);
    hinhGam.forEach(function(h) {
      let thuoc = { fill: mauVatLieu(h.vl) };
      if (h.tron) svg('circle', Object.assign(thuoc, { cx: so(h.tron[0]), cy: so(Y(h.tron[1])), r: so(h.tron[2]) }), g);
      else svg('polygon', Object.assign(thuoc, { points: h.da.map((p) => so(p[0]) + ',' + so(Y(p[1]))).join(' ') }), g);
    });
    return g;
  }
  function veGam(s, c, opt, banLap) {
    veNenGam(s, c);
    let K = SD_GAM;
    svg('text', { x: K.x1 - 0.25, y: Y(K.z1) + 0.8, 'class': 'sra-lr-chu-mo', 'text-anchor': 'end' }, s).textContent = 'Mũi xe';
    svg('text', { x: K.x0 + 0.25, y: Y(K.z0) - 0.3, 'class': 'sra-lr-chu-mo' }, s).textContent = 'Đuôi xe';
    svg('text', { x: K.x0 + 0.25, y: Y(K.z1) + 0.8, 'class': 'sra-lr-chu-mo' }, s).textContent = 'Nhìn từ dưới lên';
    svg('text', { x: K.x0 + 0.25, y: Y(0) - 0.15, 'class': 'sra-lr-chu-mo' }, s).textContent = 'z = 0';
    let v = VUNG.gam, nhan = !!opt.dangKeo && hopVung(opt.dangKeo, 'gam');
    svg('rect', { 'class': 'sra-lr-vung sra-lr-vung-gam' + (nhan ? ' nhan-duoc' : '') + (opt.vungTren == 'gam' ? ' dang-tren' : ''), 'data-vung': 'gam',
      x: v.x0, y: Y(v.z1), width: v.x1 - v.x0, height: v.z1 - v.z0, rx: 0.5 }, s);
    // trục dọc của xe và trục bánh (z = 0) làm mốc đo
    svg('path', { 'class': 'sra-lr-truc', d: 'M 0 ' + Y(v.z1 - 0.1) + ' L 0 ' + Y(v.z0 + 0.1) + ' M ' + v.x0 + ' 0 L ' + v.x1 + ' 0' }, s);
    // dây: từ ổ cắm chạy thẳng dọc gầm ra mép đuôi rồi vòng lên mạch chủ
    let gDay = svg('g', { 'class': 'sra-lr-day' }, s);
    banLap.camBien.forEach(function(cb) {
      if (cb.gam == null) return;
      let khoa = 'gam:' + cb.gam, m = layMoDun(c, khoa);
      if (!m) return;
      let a = hinhMoDun(m).ra;
      svg('path', { d: 'M ' + so(a[0]) + ' ' + so(Y(a[1])) + ' L ' + so(a[0]) + ' ' + so(Y(-4.4)), 'data-day': khoa, 'class': opt.moi && opt.moi.indexOf(khoa) >= 0 ? 'xem-truoc' : '' }, gDay);
      svg('circle', { cx: so(a[0]), cy: so(Y(-4.4)), r: 0.28 }, gDay);
    });
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
      // TCRT5000 dọc theo thân xe: đầu phát (xanh nhạt) phía mũi, đầu thu (đen) phía sau
      hcn(0, -0.35, 0.62, 1.0, '#34373d', 0.08);
      tron(0, -0.6, 0.17, '#7fb6ff'); tron(0, -0.1, 0.17, '#0c0c0e', { stroke: '#555a61', 'stroke-width': 0.05 });
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
  // Siêu âm: điểm đặt là khớp xoay (giữa mặt sau vỏ); goc SVG = hướng của giá (gocN) trừ góc xoay
  const GOC_SVG = { truoc: 0, trai: -90, phai: 90, sau: 180 };
  function hinhMoDun(m) {
    if (m.loai == 'sieuAm') {
      let g = L.GIA[m.gia], day0 = 2.35 * Math.sin(Math.abs(m.goc) * Math.PI / 180), p, ra;
      if (m.gia == 'truoc') { p = [m.u, ZG + day0]; ra = [m.u, ZG - 0.3]; }
      else if (m.gia == 'sau') { p = [m.u, g.mat - day0]; ra = [m.u, -5.05]; }
      else { let sg = Math.sign(g.mat); p = [g.mat + sg * day0, m.u]; ra = [sg * 5.55, m.u]; }
      return { x: p[0], z: p[1], goc: GOC_SVG[m.gia] - m.goc, goc0: GOC_SVG[m.gia], tiLe: 1, w: 4.7, h: 1.9, lech: 0.95, ra: ra };
    }
    if (laGam(m)) return { x: m.x, z: m.z, goc: 0, tiLe: 1, w: 1.5, h: 2.0, lech: 0, ra: [m.x, m.z - L.GAM.nuaDai - 1.9] };
    if (LOAI[m.loai].vung == 'duoi') return { x: KX * m.x, z: ZB, goc: 0, tiLe: TI_LE_DUOI, w: 1.5, h: 2.0, lech: 0, ra: [KX * m.x, ZB - 1.0 * TI_LE_DUOI] };
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
    if (laGam(m)) {
      // ổ RJ25 ngay sau mạch đầu đo (cũng treo dưới tấm đáy)
      svg('rect', { 'class': 'sra-lr-o-cam', x: -0.75, y: so(L.GAM.nuaDai), width: 1.5, height: 1.9, rx: 0.15 }, trong);
    }
    if (LOAI[m.loai].vung == 'nap') {
      // ổ RJ25 phía sau mô-đun
      let k = L.KHUON_NAP[m.loai], tz = m.z + k.z0 + 0.95;
      svg('rect', { 'class': 'sra-lr-o-cam', x: -0.75, y: so(Y(tz) - Y(m.z) - 0.95), width: 1.5, height: 1.9, rx: 0.15 }, trong);
    }
    svg('rect', { 'class': 'sra-lr-khung', x: so(-h.w / 2 * h.tiLe - 0.15), y: so(-h.h / 2 * h.tiLe - 0.15), width: so(h.w * h.tiLe + 0.3), height: so(h.h * h.tiLe + 0.3), rx: 0.35 }, trong);
    veLinhKien(m.loai, trong, h.tiLe);
    if (khoa != 'loi') {
      // nút tháo (×) ở góc trên bên trái, hiện khi rê chuột, khi chọn hoặc khi đang cầm
      let nx = -h.w / 2 * h.tiLe - 0.1, ny = -h.h / 2 * h.tiLe - 0.1;
      let t = svg('g', { 'class': 'sra-lr-thao', 'data-thao': khoa, role: 'button', 'aria-label': 'Tháo cảm biến này' }, trong);
      svg('circle', { cx: so(nx), cy: so(ny), r: 0.62 }, t);
      svg('path', { d: 'M ' + so(nx - 0.26) + ' ' + so(ny - 0.26) + ' l 0.52 0.52 M ' + so(nx + 0.26) + ' ' + so(ny - 0.26) + ' l -0.52 0.52' }, t);
    }
    return g;
  }

  // Vẽ sơ đồ theo cấu hình c. opt.moi: các khoá vẽ dạng xem trước; opt.an: khoá đang kéo (vẽ mờ đi);
  // opt.loi: { loai, vung, x, z } vẽ bóng đỏ ở chỗ không thả được; opt.dangKeo: loại đang kéo (tô vùng nhận)
  function veSoDo(c, opt) {
    opt = opt || {};
    let banLap = L.lapXe(c), kl = L.tinhXe(banLap);
    let gam = opt.gam != null ? opt.gam : xemGam, K = gam ? SD_GAM : SD;
    let s = svg('svg', { viewBox: [K.x0, Y(K.z1), K.x1 - K.x0, K.z1 - K.z0].join(' '), 'class': 'sra-lr-so-do', role: 'group', 'aria-label': 'Sơ đồ xe nhìn từ trên xuống, mũi xe ở phía trên' });
    if (gam) {
      s.setAttribute('aria-label', 'Sơ đồ gầm xe nhìn từ dưới lên, mũi xe ở phía trên, bên trái sơ đồ là bên trái xe');
      veGam(s, c, opt, banLap);
    } else {
      veNen(s, c.son);
      svg('text', { x: SD.x1 - 0.3, y: Y(SD.z1) + 1.0, 'class': 'sra-lr-chu-mo', 'text-anchor': 'end' }, s).textContent = 'Mũi xe';
      svg('text', { x: SD.x0 + 0.3, y: Y(SD.z0) - 0.35, 'class': 'sra-lr-chu-mo' }, s).textContent = 'Đuôi xe';

      // vùng gắn
      let veVung = function(ten, lop) {
        let v = VUNG[ten], nhan = !!opt.dangKeo && hopVung(opt.dangKeo, ten);
        return svg('rect', { 'class': 'sra-lr-vung ' + lop + (nhan ? ' nhan-duoc' : '') + (opt.vungTren == ten ? ' dang-tren' : ''), 'data-vung': ten,
          x: v.x0, y: Y(v.z1), width: v.x1 - v.x0, height: v.z1 - v.z0, rx: 0.5 }, s);
      };
      // giá siêu âm phía mũi (vẽ tách ra phía trước): hai chân nối về mũi xe và thanh ngang
      svg('path', { d: 'M -4.15 ' + Y(ZG - 0.4) + ' L -4.15 ' + Y(VUNG.duoi.z1 + 0.05) + ' M 4.15 ' + Y(ZG - 0.4) + ' L 4.15 ' + Y(VUNG.duoi.z1 + 0.05), 'class': 'sra-lr-gia' }, s);
      veVung('gia:truoc', 'sra-lr-vung-gia');
      svg('rect', { x: -4.45, y: Y(ZG), width: 8.9, height: 0.3, rx: 0.1, 'class': 'sra-lr-thanh-gia' }, s);
      // ba giá còn lại đúng chỗ thật: hai bên (trên bánh xe) và phía đuôi
      ['gia:trai', 'gia:phai', 'gia:sau'].forEach((ten) => veVung(ten, 'sra-lr-vung-gia sra-lr-vung-gia-phu'));
      c.sa.forEach(function(m) {
        if (m.gia == 'truoc') return;
        let g = L.GIA[m.gia];
        if (m.gia == 'sau') {
          svg('rect', { x: -4.45, y: Y(-4.0), width: 8.9, height: 0.2, 'class': 'sra-lr-thanh-gia' }, s);
          svg('rect', { x: so(m.u - 0.85), y: Y(-4.2), width: 1.7, height: 1.7, 'class': 'sra-lr-thanh-gia' }, s);
        } else {
          let sg = Math.sign(g.mat);
          svg('rect', { x: so(sg < 0 ? -4.7 : 4.5), y: so(Y(m.u + 1.5)), width: 0.2, height: 3.0, 'class': 'sra-lr-thanh-gia' }, s);
          svg('rect', { x: so(sg < 0 ? -6.4 : 4.7), y: so(Y(m.u + 0.85)), width: 1.7, height: 1.7, 'class': 'sra-lr-thanh-gia' }, s);
        }
      });
      veVung('duoi', 'sra-lr-thanh');
      veVung('nap', 'sra-lr-vung-nap');
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

    }

    // mô-đun đang gắn
    let congCua = {};
    banLap.camBien.forEach((cb) => { congCua[khoaCua(cb)] = cb.cong.slice(2); });
    let dsKhoa = gam ? c.gam.map((m, i) => 'gam:' + i) : c.sa.map((m) => 'sa:' + m.gia).concat(c.duoi.map((m, i) => 'duoi:' + i), c.tren.map((m, i) => 'tren:' + i));
    dsKhoa.forEach(function(khoa) {
      let m = layMoDun(c, khoa);
      let lop = 'sra-lr-mo-dun' + (opt.moi && opt.moi.indexOf(khoa) >= 0 ? ' xem-truoc' : '') + (opt.an == khoa ? ' dang-keo' : '') + (opt.chon == khoa ? ' dang-chon' : '');
      let g = veMoDun(s, m, khoa, { 'class': lop });
      g.setAttribute('aria-label', tenMoDun(khoa, banLap, c) + ' Bấm để cầm lên, dùng phím mũi tên để dời' + (khoa.indexOf('sa:') == 0 ? ', Q hoặc E để xoay' : '') + ', Delete để tháo.');
      // số cổng ở góc trên bên phải của mô-đun (tính theo góc xoay của mô-đun)
      let h = hinhMoDun(m), t = h.goc * Math.PI / 180;
      let lx = h.w / 2 * h.tiLe - 0.1, ly = -(h.lech + h.h / 2) * h.tiLe + 0.1;
      if (m.loai == 'sieuAm') { lx = h.w / 2 * h.tiLe + 0.45; ly = -0.4; }     // siêu âm: cạnh sau bên phải (núm xoay ở phía trước)
      let bx = h.x + lx * Math.cos(t) - ly * Math.sin(t), by = Y(h.z) + lx * Math.sin(t) + ly * Math.cos(t);
      let gc = svg('g', { 'class': 'sra-lr-nhan-cong' }, s);
      svg('circle', { 'class': 'sra-lr-cong', cx: so(bx), cy: so(by), r: 0.74 }, gc);
      svg('text', { 'class': 'sra-lr-so-cong', x: so(bx), y: so(by + 0.37) }, gc).textContent = congCua[khoa];
      if (m.loai == 'sieuAm') veNumXoay(s, m, h, khoa);
    });
    if (opt.loi) {
      // bóng đỏ ở chỗ không thả được
      let g = veMoDun(s, opt.loi, 'loi', { 'class': 'sra-lr-mo-dun loi', tabindex: -1, role: 'presentation' });
      g.removeAttribute('data-cho'); g.removeAttribute('data-loai');
    }
    return { svg: s, banLap: banLap, kl: kl };
  }
  // Núm xoay của cảm biến siêu âm: một cung tròn quanh khớp xoay và một núm ở đầu cung
  // Điểm trên vòng tròn bán kính r quanh khớp xoay, ứng với góc xoay t (độ) của cảm biến
  function diemCung(h, t, r) {
    let a = (h.goc0 - t) * Math.PI / 180;
    return [h.x + r * Math.sin(a), h.z + r * Math.cos(a)];
  }
  function veNumXoay(s, m, h, khoa) {
    let r = 2.9;
    let g = svg('g', { 'class': 'sra-lr-xoay' }, s);
    let a0 = diemCung(h, -L.GOC_SA, r), a1 = diemCung(h, L.GOC_SA, r);
    svg('path', { 'class': 'sra-lr-cung', d: 'M ' + so(a0[0]) + ' ' + so(Y(a0[1])) + ' A ' + r + ' ' + r + ' 0 0 0 ' + so(a1[0]) + ' ' + so(Y(a1[1])) }, g);
    for (let t = -L.GOC_SA; t <= L.GOC_SA; t += 15) {
      let p = diemCung(h, t, r), q = diemCung(h, t, r - 0.35);
      svg('path', { 'class': 'sra-lr-vach-goc', d: 'M ' + so(p[0]) + ' ' + so(Y(p[1])) + ' L ' + so(q[0]) + ' ' + so(Y(q[1])) }, g);
    }
    let n = diemCung(h, m.goc, r);
    let num = svg('g', { 'class': 'sra-lr-num', 'data-xoay': khoa, tabindex: 0, role: 'slider', 'aria-label': 'Xoay cảm biến siêu âm ' + L.GIA[m.gia].ten,
      'aria-valuemin': -L.GOC_SA, 'aria-valuemax': L.GOC_SA, 'aria-valuenow': m.goc, 'aria-valuetext': moTaGoc(m.goc) }, g);
    svg('circle', { cx: so(n[0]), cy: so(Y(n[1])), r: 0.62 }, num);
    svg('path', { d: 'M ' + so(n[0] - 0.3) + ' ' + so(Y(n[1]) - 0.05) + ' a 0.36 0.36 0 1 1 0.6 0.1', fill: 'none' }, num);
    if (Math.abs(m.goc) > 1e-6) {
      let c = diemCung(h, m.goc, r + 1.25);
      svg('text', { 'class': 'sra-lr-chu-goc', x: so(c[0]), y: so(Y(c[1]) + 0.3), 'text-anchor': 'middle' }, g).textContent = soViet(Math.abs(m.goc)) + '°';
    }
  }

  function veKhay() {
    let $k = $('<div class="sra-lr-khay" data-cho="khay" role="group" aria-label="Khay linh kiện"></div>');
    let het = hetO(self.cauHinh);
    THU_TU.forEach(function(loai) {
      let con = conLai(self.cauHinh, loai);
      let $the = $('<button type="button" class="sra-lr-the"></button>').attr('data-loai', loai).attr('data-tu', 'khay')
        .attr('title', het && con > 0 ? LOI_HET_O : LOAI[loai].moTa).prop('disabled', con <= 0 || het)
        .attr('aria-label', LOAI[loai].tenDay + ', còn ' + con + ' trong khay. ' + (het ? LOI_HET_O : LOAI[loai].moTa + '. Enter để tự gắn vào chỗ trống.'));
      let kich = { sieuAm: [5.2, 2.4], doLine: [2.2, 2.4], cham: [2.2, 2.4], gyro: [3.0, 3.0], gps: [3.0, 3.3] }[loai];
      let s = svg('svg', { viewBox: [-kich[0] / 2, -kich[1] / 2, kich[0], kich[1]].join(' '), width: kich[0] * 12.5, height: kich[1] * 12.5, 'aria-hidden': 'true' });
      veLinhKien(loai, s);
      $the.append(s);
      $the.append($('<span class="sra-lr-ten"></span>').text(LOAI[loai].ten));
      $the.append($('<span class="sra-lr-con"></span>').text(con <= 0 ? 'đã gắn' : (het ? 'hết ổ' : 'còn ' + con)));
      $k.append($the);
    });
    return $k;
  }

  function veDanhSachCong(banLap) {
    let $d = $('<div class="sra-lr-thong-tin"></div>');
    let $ds = $('<ol class="sra-lr-ds-cong"></ol>');
    banLap.camBien.forEach(function(cb) {
      let ten = LOAI[cb.loai].ten + ((cb.loai == 'doLine' || cb.loai == 'sieuAm') && cb.ten ? ' ' + cb.ten : '');
      let khoa = khoaCua(cb);
      $ds.append($('<li></li>').attr('data-khoa', khoa)
        .append($('<span class="sra-lr-huy-hieu"></span>').text(cb.cong.slice(2)))
        .append($('<span class="sra-lr-ten-cong"></span>').text(ten).append(cb.oMach ? $('<small></small>').text(' ổ ' + cb.oMach) : ''))
        .append($('<button type="button" class="sra-lr-nut-thao">Tháo</button>').attr('data-thao', khoa).attr('aria-label', 'Tháo ' + LOAI[cb.loai].tenDay + (cb.ten ? ' ' + cb.ten : ''))));
    });
    $d.append($('<div class="sra-lr-tieu-de-nho"></div>').text('Cổng trong chương trình (' + tongMoDun(self.cauHinh) + '/' + L.SO_O + ' ổ cắm)'));
    if (banLap.camBien.length) $d.append($ds); else $d.append('<p class="sra-lr-trong-khong">Xe chưa có cảm biến nào. Kéo một cảm biến từ khay vào xe.</p>');
    if (self.cauHinh.sa.length) $d.append(veDoCao());
    return $d;
  }

  // Độ cao từng cảm biến siêu âm (tâm cảm biến so với mặt sân): nút − và + bước 0,5 cm
  function veDoCao() {
    let $s = $('<div class="sra-lr-do-cao"></div>');
    $s.append('<div class="sra-lr-tieu-de-nho">Độ cao siêu âm (tâm cảm biến so với mặt sân)</div>');
    self.cauHinh.sa.forEach(function(m) {
      let gh = L.gioiHanCao(m.gia, m.u, m.goc), khoa = 'sa:' + m.gia, ten = 'siêu âm ' + L.GIA[m.gia].ten;
      $s.append($('<div class="sra-lr-hang-cao"></div>').attr('data-khoa', khoa)
        .append($('<span class="sra-lr-ten-cao"></span>').text(viet(L.GIA[m.gia].ten)))
        .append($('<button type="button" class="sra-lr-nut-cao">−</button>').attr({ 'data-cao': khoa, 'data-buoc': -0.5, 'aria-label': 'Hạ ' + ten + ' 0,5 cm' }).prop('disabled', m.cao <= gh[0] && !L.nganBanh(m.gia, m.u, m.goc)))      // ngang bánh: vẫn bấm được để xem gợi ý dời lên trước
        .append($('<output class="sra-lr-gia-tri-cao"></output>').text(soViet(m.cao) + ' cm').attr('aria-label', ten + ' cao ' + soViet(m.cao) + ' cm'))
        .append($('<button type="button" class="sra-lr-nut-cao">+</button>').attr({ 'data-cao': khoa, 'data-buoc': 0.5, 'aria-label': 'Nâng ' + ten + ' 0,5 cm' }).prop('disabled', m.cao >= gh[1]))
        .append($('<span class="sra-lr-mien-cao"></span>').text(soViet(gh[0]) + '–' + soViet(gh[1]))));
    });
    return $s;
  }

  // Ô chọn màu sơn: mỗi phần một hàng, ô đầu là màu gốc
  function veSon() {
    let $s = $('<div class="sra-lr-son"></div>');
    $s.append('<div class="sra-lr-tieu-de-nho">Sơn xe</div>');
    Object.keys(TEN_SON).forEach(function(phan) {
      let dang = self.cauHinh.son[phan] || null;
      let $h = $('<div class="sra-lr-hang-son" role="radiogroup"></div>').attr('aria-label', 'Màu ' + TEN_SON[phan].toLowerCase());
      $h.append($('<span class="sra-lr-ten-son"></span>').text(TEN_SON[phan]));
      [null].concat(L.SON).forEach(function(mau) {
        let chon = mau == dang;
        $h.append($('<button type="button" class="sra-lr-o-son" role="radio"></button>').toggleClass('goc', !mau).toggleClass('chon', chon)
          .attr('data-son-phan', phan).attr('data-son-mau', mau || '').attr('aria-checked', chon ? 'true' : 'false')
          .attr('title', mau ? TEN_MAU[mau] : 'màu gốc').attr('aria-label', mau ? TEN_MAU[mau] : 'màu gốc')
          .css('background', mau || SON_GOC[phan]));
      });
      $s.append($h);
    });
    return $s;
  }
  function bamThongTin(ev) {
    let e = $(ev.target).closest('[data-thao], [data-son-phan], [data-cao]')[0];
    if (!e) return;
    if (e.getAttribute('data-cao')) {
      let khoa = e.getAttribute('data-cao'), buoc = Number(e.getAttribute('data-buoc'));
      if (apDung(datCao(khoa, layMoDun(self.cauHinh, khoa).cao + buoc))) {
        let n = $bang.find('.sra-lr-nut-cao[data-cao="' + khoa + '"][data-buoc="' + buoc + '"]')[0];
        if (n && !n.disabled) n.focus();
      }
      return;
    }
    if (e.getAttribute('data-thao')) { dangCam = null; apDung(thao(e.getAttribute('data-thao'))); return; }
    let phan = e.getAttribute('data-son-phan'), mau = e.getAttribute('data-son-mau') || null;
    if (apDung(datSon(phan, mau))) {
      let o = $bang.find('.sra-lr-o-son[data-son-phan="' + phan + '"][data-son-mau="' + (mau || '') + '"]')[0];
      if (o) o.focus();
    }
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
    $bang.find('.sra-lr-vung-son').empty().append(veSon());
    $bang.find('.sra-lr-che-do [data-xem]').each(function() {
      let chon = (this.getAttribute('data-xem') == 'gam') == xemGam;
      this.classList.toggle('chon', chon); this.setAttribute('aria-checked', chon ? 'true' : 'false');
    });
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
      if (diem && kq && kq.loi && hopVung(loai, diem.vung)) loi = loai == 'sieuAm' ? { loai: loai, gia: diem.vung.slice(4), u: diem.u, goc: 0 } : { loai: loai, x: diem.x, z: diem.vung == 'duoi' ? undefined : diem.z, goc: 0 };
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
    $bang.find('.sra-lr-ds-cong li, .sra-lr-hang-cao').each(function() { this.classList.toggle('sang', !!khoa && this.getAttribute('data-khoa') == khoa); });
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
      if (giuFocus == 'xoay') e = $bang.find('.sra-lr-num[data-xoay="' + kq.den + '"]')[0];
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
    let thu = xemGam ? ['gam'] : ['duoi', 'gia:truoc', 'gia:trai', 'gia:phai', 'gia:sau', 'nap'];
    if (loai) thu.sort((a, b) => hopVung(loai, b) - hopVung(loai, a));
    for (let ten of thu) {
      if (!trong(ten, loai && hopVung(loai, ten) ? BIEN_HUT[ten] : 0)) continue;
      if (ten == 'duoi') return { vung: ten, x: bx / KX };
      if (ten.indexOf('gia:') == 0) return { vung: ten, u: L.GIA[ten.slice(4)].truc == 'x' ? bx : bz };
      return { vung: ten, x: bx, z: bz };
    }
    return null;
  }
  const buocLuoi = (ev) => ev && ev.altKey ? 0.1 : 0.5;

  // ---------- Kéo thả và bấm chọn ----------
  function nguonTu(e) {
    while (e && e != document.body) {
      if (e.getAttribute && e.getAttribute('data-thao')) return { thao: e.getAttribute('data-thao') };
      if (e.getAttribute && e.getAttribute('data-son-phan')) return { son: true };
      if (e.getAttribute && e.getAttribute('data-xoay')) return { xoay: e.getAttribute('data-xoay') };
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
    if (n.thao || n.son) return;
    if (n.xoay) { batDauXoay(ev, n.xoay); return; }
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
  function batDauXoay(ev, khoa) {
    let m = layMoDun(self.cauHinh, khoa);
    if (!m) return;
    xoay = { id: ev.pointerId, kq: null, khoa: khoa };
    document.addEventListener('pointermove', diXoay);
    document.addEventListener('pointerup', thaXoay);
    document.addEventListener('pointercancel', thaXoay);
    ev.preventDefault();
  }
  function gocTai(ev) {
    let s = $bang.find('.sra-lr-so-do')[0], mt = s.getScreenCTM();
    let p = s.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    p = p.matrixTransform(mt.inverse());
    let m = layMoDun(self.cauHinh, xoay.khoa), h = hinhMoDun(m);
    // góc của con trỏ quanh khớp xoay (0 = hướng lên, dương theo chiều kim đồng hồ), đổi sang góc xoay của cảm biến
    let a = Math.atan2(p.x - h.x, -p.y - h.z) * 180 / Math.PI;
    let g = ((h.goc0 - a) % 360 + 540) % 360 - 180;
    let buoc = ev.shiftKey ? 45 : (ev.altKey ? 5 : 15);
    return kep(lam(g, buoc), -L.GOC_SA, L.GOC_SA);
  }
  function diXoay(ev) {
    if (!xoay || ev.pointerId != xoay.id) return;
    xoay.kq = datGoc(xoay.khoa, gocTai(ev));
    if (xoay.kq) {
      let sd = veSoDo(xoay.kq.c, { moi: [xoay.khoa] });
      $bang.find('.sra-lr-vung-so-do').empty().append(sd.svg);
      let m = layMoDun(xoay.kq.c, xoay.khoa);
      $bang.find('.sra-lr-thong-bao').text('Thả ra: siêu âm ' + L.GIA[m.gia].ten + ' ' + moTaGoc(m.goc) + '. Giữ Shift để bám 45°.').removeClass('goi-y');
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
    if (n && n.thao) { dangCam = null; apDung(thao(n.thao)); return; }
    if (n && n.son) return;
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
        if (!hopVung(dangCam.loai, diem.vung) && n) { dangCam = { loai: n.loai, tu: n.tu }; veLai(loiCam(n)); return; }
        apDung(timCho(dangCam.loai, dangCam.tu, diem, buocLuoi(ev)));
        return;
      }
    }
    if (n) { dangCam = { loai: n.loai, tu: n.tu }; veLai(loiCam(n)); return; }
    let diem = diemTai(ev.clientX, ev.clientY);
    if (diem) veLai('Vùng này là ' + TEN_VUNG[diem.vung] + '. Kéo một cảm biến từ khay vào đây.');
  }
  const loiCam = (n) => 'Đang cầm ' + LOAI[n.loai].tenDay + '. Bấm vào ' + (xemGam && n.loai == 'doLine' ? TEN_VUNG.gam : TEN_VUNG[LOAI[n.loai].vung]) + ' (được tô sáng) để đặt' + (n.tu != 'khay' ? ', hoặc bấm vào khay để tháo.' : '.') +
    (n.loai == 'doLine' && !xemGam ? ' Muốn gắn dưới gầm thì bấm "Nhìn gầm xe".' : '');

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
    if (num || (khoa && khoa.indexOf('sa:') == 0 && /^[qQeE]$/.test(ev.key))) {
      let kx = num || khoa, g = layMoDun(self.cauHinh, kx).goc, buoc = ev.shiftKey ? 45 : (ev.altKey ? 5 : 15), moi = null;
      if (ev.key == 'ArrowLeft' || ev.key == 'ArrowUp' || ev.key == 'q' || ev.key == 'Q') moi = g + buoc;
      if (ev.key == 'ArrowRight' || ev.key == 'ArrowDown' || ev.key == 'e' || ev.key == 'E') moi = g - buoc;
      if (moi != null) { ev.preventDefault(); let kq = datGoc(kx, kep(lam(moi, buoc), -L.GOC_SA, L.GOC_SA)); if (kq) apDung(kq, num ? 'xoay' : true); }
      return;
    }
    if (!khoa || !loai || e.getAttribute('data-tu')) return;
    if (ev.key == 'Delete' || ev.key == 'Backspace') { ev.preventDefault(); apDung(thao(khoa)); return; }
    if ((ev.key == 'PageUp' || ev.key == 'PageDown') && loai == 'sieuAm') {
      ev.preventDefault();
      let m = layMoDun(self.cauHinh, khoa), kq = datCao(khoa, m.cao + (ev.key == 'PageUp' ? 1 : -1) * (ev.altKey ? 0.1 : 0.5));
      if (kq) apDung(kq, true);
      return;
    }
    let b = ev.altKey ? 0.1 : 0.5, d = { ArrowLeft: [-b, 0], ArrowRight: [b, 0], ArrowUp: [0, b], ArrowDown: [0, -b] }[ev.key];
    if (d) {
      ev.preventDefault();
      if (khoa.indexOf('duoi:') == 0 && d[0] == 0) return;
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
  // Máy quay 3D theo hướng nhìn của sơ đồ: nhìn gầm thì hạ xuống dưới mặt sân (mặt sân tự trong suốt nhẹ)
  function gocNhin() {
    if (!self.dangMo || typeof babylon == 'undefined' || !babylon.cameraArc) return;
    try {
      let cam = babylon.cameraArc;
      if (typeof SRAMayQuay != 'undefined' && SRAMayQuay.goc) SRAMayQuay.chon(null);
      if (babylon.cameraMode != 'follow') { babylon.setCameraMode('follow'); cam = babylon.cameraArc; }
      let huong = robot.body.absoluteRotationQuaternion.toEulerAngles().y;
      cam.radius = xemGam ? 34 : 50;
      cam.beta = xemGam ? 2.35 : 1.0;
      cam.alpha = -Math.PI / 2 - huong + Math.PI + (xemGam ? 0.5 : 0.75);
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
      xemGam = false;
      $bang = $(
        '<section class="sra-lr-bang" aria-label="Bảng lắp ráp xe">' +
          '<header><h2>Lắp ráp xe</h2><button type="button" class="sra-lr-dong" aria-label="Đóng bảng lắp ráp">&times;</button></header>' +
          '<div class="sra-lr-than">' +
            '<div class="sra-lr-cot"><div class="sra-lr-che-do" role="radiogroup" aria-label="Hướng nhìn sơ đồ">' +
              '<button type="button" role="radio" data-xem="tren">Nhìn từ trên</button><button type="button" role="radio" data-xem="gam">Nhìn gầm xe</button></div>' +
              '<div class="sra-lr-vung-so-do"></div><p class="sra-lr-chi-tiet" aria-live="polite"></p><p class="sra-lr-khoi-luong"></p><div class="sra-lr-vung-son"></div></div>' +
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
      $bang.on('click', '.sra-lr-vung-thong-tin, .sra-lr-vung-son', bamThongTin);
      $bang.on('pointermove', rePhuot);
      $bang.on('pointerleave', function() { if (!keo && !xoay && dangCam) veThu(null, dangCam.loai, dangCam.tu, null); });
      $bang.on('focusin', function(e) { let k = e.target.getAttribute && e.target.getAttribute('data-cho'); if (k && e.target.getAttribute('data-loai') && !e.target.getAttribute('data-tu')) chiTiet(k); });
      $bang.on('keydown', phim);
      $bang.on('dragstart', (e) => e.preventDefault());
      $bang.find('.sra-lr-dong').on('click', self.dong);
      $bang.find('.sra-lr-che-do').on('click', '[data-xem]', function() { self.xemGam(this.getAttribute('data-xem') == 'gam'); });
      $bang.find('.sra-lr-mac-dinh').on('click', function() {
        self.cauHinh = L.chuanHoaCauHinh({}); dangCam = null; xoaLuu();
        veLai('Đã đưa xe về bản lắp mặc định.'); henDungLai();
      });
      $bang.find('.sra-lr-thao-het').on('click', function() {
        self.cauHinh = L.chuanHoaCauHinh({ sa: [], duoi: [], tren: [], gam: [], son: self.cauHinh.son }); dangCam = null; luu(self.cauHinh);
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
  //   SRABangLapRap.xemGam(true)              sơ đồ nhìn gầm xe (gắn mắt dò line dưới gầm), máy quay xuống dưới gầm
  this.xemGam = function(bat) {
    bat = !!bat;
    if (bat == xemGam) return;
    xemGam = bat;
    dangCam = null;
    veLai(bat ? 'Đang nhìn gầm xe từ dưới lên. Kéo mắt dò line vào vùng dưới tấm đáy.' : '');
    gocNhin();
  };
  this.dangXemGam = () => xemGam;
  //   SRABangLapRap.cao(9, 'sa:trai')          đặt tâm siêu âm bên trái cao 9 cm so với mặt sân
  this.cao = function(cao, khoa) { apDung(datCao(khoa || 'sa:truoc', cao)); return self.choDungXong(); };
  this.xoay = function(goc, khoa) { apDung(datGoc(khoa || 'sa:truoc', goc)); return self.choDungXong(); };
  //   SRABangLapRap.son('khung', '#c62828')    sơn khung xe; mau null là màu gốc
  this.son = function(phan, mau) { apDung(datSon(phan, mau)); return self.choDungXong(); };
  // Toạ độ trên màn hình của một vị trí thật trên xe (để kiểm tra tự động kéo chuột tới đó)
  this.toaDoManHinh = function(diem) {
    let s = $bang && $bang.find('.sra-lr-so-do')[0];
    if (!s) return null;
    if (diem.vung == 'xoay') {      // điểm trên cung xoay của siêu âm diem.khoa ứng với góc diem.goc
      let h = hinhMoDun(layMoDun(self.cauHinh, diem.khoa || 'sa:truoc')), q = diemCung(h, diem.goc, 2.9);
      diem = { vung: 'tho', x: q[0], z: q[1] };
    }
    let bx = diem.x, bz = diem.z;
    if (diem.vung == 'duoi') { bx = KX * diem.x; bz = ZB; }
    if (diem.vung == 'gam' && !xemGam) return null;
    if (diem.vung && diem.vung.indexOf('gia:') == 0) {     // giữa vùng giá, tại toạ độ u dọc giá
      let v = VUNG[diem.vung], doc = L.GIA[diem.vung.slice(4)].truc == 'x';
      bx = doc ? diem.u : (v.x0 + v.x1) / 2; bz = doc ? (diem.vung == 'gia:truoc' ? ZG + 1.1 : -5.6) : diem.u;
    }
    let p = s.createSVGPoint(); p.x = bx; p.y = Y(bz);
    p = p.matrixTransform(s.getScreenCTM());
    return [p.x, p.y];
  };

  // Đổi robot khác trong lúc bảng đang mở thì đóng bảng
  if (typeof window != 'undefined') {
    setInterval(function() { if (self.dangMo && !dangDung && !laXe()) self.dong(); }, 500);
  }
};
