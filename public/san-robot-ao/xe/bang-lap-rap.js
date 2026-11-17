// Sân Robot Ảo – xe lắp mô-đun: bảng lắp ráp (kéo thả cảm biến vào chỗ gắn trên xe).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Bảng gồm khay linh kiện và sơ đồ xe nhìn từ trên xuống. Kéo một cảm biến từ khay vào chỗ gắn
// (hoặc bấm cảm biến rồi bấm chỗ gắn) thì cấu hình lắp đổi theo, xe 3D bên cạnh được dựng lại ngay:
// hình, hitbox, khối lượng và số cổng đều tính lại từ cùng danh mục linh kiện (linh-kien.js).
//
// Chỗ gắn (xem linh-kien.js):
//   gia     giá phía mũi           nhận cảm biến siêu âm
//   lo:0…4  5 lỗ dưới mũi xe       nhận mắt dò line (tối đa 3) hoặc cảm biến chạm (tối đa 1)
//   nap:0,1 2 chỗ trên nắp mạch    nhận gyro hoặc GPS
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
    sieuAm: { ten: 'Siêu âm', tenDay: 'cảm biến siêu âm HC-SR04', cho: 'gia', moTa: 'Đo khoảng cách tới vật phía trước' },
    doLine: { ten: 'Dò line', tenDay: 'mắt dò line TCRT5000', cho: 'lo', moTa: 'Phân biệt nền sáng và vạch tối dưới gầm' },
    cham: { ten: 'Chạm', tenDay: 'cảm biến chạm', cho: 'lo', moTa: 'Báo khi tấm cản ở mũi xe bị ép vào' },
    gyro: { ten: 'Gyro', tenDay: 'cảm biến gyro', cho: 'nap', moTa: 'Đo góc xe đã quay' },
    gps: { ten: 'GPS', tenDay: 'mô-đun GPS', cho: 'nap', moTa: 'Cho biết toạ độ của xe trên sân' }
  };
  const THU_TU = ['sieuAm', 'doLine', 'cham', 'gyro', 'gps'];
  const TEN_CHO = { gia: 'giá phía mũi', lo: 'lỗ dưới mũi xe', nap: 'nắp mạch chủ' };
  const TEN_LO = ['ngoài cùng bên trái', 'bên trái', 'chính giữa', 'bên phải', 'ngoài cùng bên phải'];

  // Sơ đồ: đơn vị cm, x sang phải, z (phía trước xe) hướng lên trên màn hình
  // Chỗ gắn vẽ to hơn thật và tách khỏi thân xe (kiểu hình vẽ tháo rời) để dễ kéo thả bằng chuột lẫn ngón tay.
  const SD = { x0: -7.4, x1: 7.4, z0: -4.9, z1: 19.6 };
  const Y = (z) => -z;
  function hinhCho(id) {
    if (id == 'gia') return { x: 0, z: 17.6, w: 6.6, h: 3.0, tiLe: 1.2 };
    let p = id.split(':'), i = Number(p[1]);
    if (p[0] == 'lo') return { x: (i - 2) * 2.85, z: 13.2, w: 2.6, h: 3.4, tiLe: 1.4 };
    return { x: (i ? 1 : -1) * 2.1, z: 3.55, w: 3.7, h: 4.3, tiLe: 1.2 };
  }
  const DS_CHO = ['gia', 'lo:0', 'lo:1', 'lo:2', 'lo:3', 'lo:4', 'nap:0', 'nap:1'];

  const GOI_Y = 'Kéo cảm biến vào chỗ gắn trên xe. Kéo ra ngoài bảng để tháo.';

  this.dangMo = false;
  this.cauHinh = null;
  let $bang = null, dangCam = null, keo = null, henDung = null, dangDung = false, canDungLai = false, camTruoc = null;

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

  // ---------- Thao tác trên cấu hình ----------
  function layCho(c, id) {
    if (id == 'gia') return c.sieuAm ? 'sieuAm' : null;
    let p = id.split(':');
    return c[p[0]][Number(p[1])] || null;
  }
  function datCho(c, id, loai) {
    if (id == 'gia') { c.sieuAm = !!loai; return; }
    let p = id.split(':');
    c[p[0]][Number(p[1])] = loai || null;
  }
  const nhanDuoc = (id, loai) => LOAI[loai].cho == id.split(':')[0];
  const demLoai = (c, loai) => DS_CHO.filter((id) => layCho(c, id) == loai).length;
  const conLai = (c, loai) => L.TOI_DA[loai] - demLoai(c, loai);
  function saoChep(c) { c = L.chuanHoaCauHinh(c); if (!c.lo) c.lo = L.X_LO.map(() => null); return c; }

  // Cấu hình cũ có mắt dò line đặt lệch lỗ (lo = null): đưa mỗi mắt về lỗ gần nhất để hiện được trên bảng
  function veLuoi(c) {
    c = L.chuanHoaCauHinh(c);
    if (c.lo) return c;
    let lo = L.X_LO.map(() => null), n = c.doLine;
    for (let i = 0; i < n; i++) {
      let x = (i - (n - 1) / 2) * c.cachMat, j = 0;
      L.X_LO.forEach(function(xl, k) { if (!lo[k] && (lo[j] || Math.abs(xl - x) < Math.abs(L.X_LO[j] - x))) j = k; });
      lo[j] = 'doLine';
    }
    if (c.cham) { let j = [4, 0, 2, 3, 1].find((k) => !lo[k]); lo[j] = 'cham'; }
    return L.chuanHoaCauHinh({ banh: c.banh, sieuAm: c.sieuAm, lo: lo, nap: c.nap });
  }

  // Đặt loai vào chỗ den. tu: chỗ đang gắn (hoặc 'khay'). Trả về câu thông báo, hoặc null nếu không làm được.
  function chuyen(loai, tu, den) {
    let c = saoChep(self.cauHinh);
    if (den == 'khay') {
      if (tu == 'khay') return null;
      datCho(c, tu, null);
      self.cauHinh = L.chuanHoaCauHinh(c);
      return 'Đã tháo ' + LOAI[loai].tenDay + '.';
    }
    if (!nhanDuoc(den, loai)) return null;
    if (tu == den) return null;
    let dangO = layCho(c, den);
    if (tu == 'khay') {
      // thay cho linh kiện đang nằm ở đó (nó trở về khay)
      if (conLai(c, loai) + (dangO == loai ? 1 : 0) <= 0) return null;
      datCho(c, den, loai);
    } else {
      datCho(c, tu, dangO && nhanDuoc(tu, dangO) ? dangO : null);    // đổi chỗ cho nhau
      datCho(c, den, loai);
    }
    self.cauHinh = L.chuanHoaCauHinh(c);
    return 'Đã gắn ' + LOAI[loai].tenDay + ' vào ' + tenCho(den) + '.';
  }
  function tenCho(id) {
    let p = id.split(':');
    if (p[0] == 'lo') return 'lỗ ' + TEN_LO[Number(p[1])] + ' dưới mũi xe';
    if (p[0] == 'nap') return 'nắp mạch chủ, bên ' + (p[1] == '0' ? 'trái' : 'phải');
    return TEN_CHO.gia;
  }
  function lyDoKhongNhan(id, loai) {
    let nhom = id.split(':')[0];
    if (nhom == 'gia') return 'Giá phía mũi chỉ gắn được cảm biến siêu âm.';
    if (nhom == 'lo') return 'Lỗ dưới mũi xe chỉ gắn được mắt dò line hoặc cảm biến chạm.';
    return 'Trên nắp mạch chủ chỉ gắn được gyro hoặc GPS.';
  }

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

  // Thân xe chưa gắn cảm biến, nhìn từ trên xuống (vẽ một lần)
  let hinhNen = null;
  function veNen(cha) {
    if (!hinhNen) {
      let tran = L.lapXe({ sieuAm: false, lo: L.X_LO.map(() => null), nap: [null, null] });
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

  function veSoDo() {
    let c = self.cauHinh, banLap = L.lapXe(c), kl = L.tinhXe(banLap);
    let s = svg('svg', { viewBox: [SD.x0, Y(SD.z1), SD.x1 - SD.x0, SD.z1 - SD.z0].join(' '), 'class': 'sra-lr-so-do', role: 'group', 'aria-label': 'Sơ đồ xe nhìn từ trên xuống, mũi xe ở phía trên' });
    veNen(s);
    // chú thích hướng
    svg('text', { x: SD.x0 + 0.3, y: Y(SD.z1) + 1.0, 'class': 'sra-lr-chu-mo' }, s).textContent = 'Mũi xe';
    svg('text', { x: SD.x0 + 0.3, y: Y(SD.z0) - 0.35, 'class': 'sra-lr-chu-mo' }, s).textContent = 'Đuôi xe';
    // đường nối từ giá siêu âm (vẽ tách ra phía trước cho dễ nhìn) về mũi xe
    svg('path', { d: 'M -1.42 ' + Y(16.1) + ' L -1.42 ' + Y(11.4) + ' M 1.42 ' + Y(16.1) + ' L 1.42 ' + Y(11.4), 'class': 'sra-lr-gia' }, s);
    // thanh gắn 5 lỗ dưới mũi xe
    svg('rect', { x: -7.15, y: Y(13.2) - 1.95, width: 14.3, height: 3.9, rx: 0.5, 'class': 'sra-lr-thanh' }, s);

    // dây nối từ mỗi cảm biến về ổ trên mạch chủ
    let gDay = svg('g', { 'class': 'sra-lr-day' }, s);
    let congCua = {};
    banLap.camBien.forEach(function(cb) {
      let id = cb.loai == 'sieuAm' ? 'gia' : (cb.lo != null ? 'lo:' + cb.lo : 'nap:' + cb.nap);
      congCua[id] = cb.cong.slice(2);
      let h = hinhCho(id), truoc = cb.oMach <= 5;
      let xo = truoc ? (cb.oMach - 3) * 1.7 : (cb.oMach - 7) * 3, zo = truoc ? 7.55 : -0.45;
      let z1 = h.z - h.h / 2;
      let d = id.indexOf('nap') == 0
        ? 'M ' + so(h.x) + ' ' + so(Y(z1)) + ' C ' + so(h.x) + ' ' + so(Y(z1 - 1.2)) + ', ' + so(xo) + ' ' + so(Y(zo - 2.2)) + ', ' + so(xo) + ' ' + so(Y(zo - 0.9))
        : 'M ' + so(h.x) + ' ' + so(Y(z1)) + ' C ' + so(h.x) + ' ' + so(Y(z1 - 1.6)) + ', ' + so(xo) + ' ' + so(Y(zo + 2.4)) + ', ' + so(xo) + ' ' + so(Y(zo));
      svg('path', { d: d }, gDay);
      svg('circle', { cx: so(xo), cy: so(Y(truoc ? zo : zo - 0.9)), r: 0.28 }, gDay);
    });

    // chỗ gắn
    DS_CHO.forEach(function(id) {
      let h = hinhCho(id), loai = layCho(c, id);
      let g = svg('g', { 'class': 'sra-lr-cho' + (loai ? ' co' : ' trong'), 'data-cho': id, tabindex: 0, role: 'button',
        transform: 'translate(' + so(h.x) + ' ' + so(Y(h.z)) + ')' }, s);
      g.setAttribute('aria-label', (loai ? LOAI[loai].tenDay + ' ở ' + tenCho(id) + ', cổng ' + congCua[id] + '. Bấm để cầm lên.' : 'Chỗ trống: ' + tenCho(id)));
      svg('rect', { 'class': 'sra-lr-o', x: -h.w / 2, y: -h.h / 2, width: h.w, height: h.h, rx: 0.4 }, g);
      if (loai) {
        g.setAttribute('data-loai', loai);
        veLinhKien(loai, g, h.tiLe);
        // số cổng
        let bx = h.w / 2 - 0.25, by = -h.h / 2 + 0.25;
        svg('circle', { 'class': 'sra-lr-cong', cx: bx, cy: by, r: 0.74 }, g);
        svg('text', { 'class': 'sra-lr-so-cong', x: bx, y: by + 0.37 }, g).textContent = congCua[id];
      } else {
        svg('path', { 'class': 'sra-lr-cong-them', d: 'M -0.45 0 L 0.45 0 M 0 -0.45 L 0 0.45' }, g);
      }
    });
    return { svg: s, banLap: banLap, kl: kl };
  }

  function veKhay() {
    let $k = $('<div class="sra-lr-khay" data-cho="khay" role="group" aria-label="Khay linh kiện"></div>');
    THU_TU.forEach(function(loai) {
      let con = conLai(self.cauHinh, loai);
      let $the = $('<button type="button" class="sra-lr-the"></button>').attr('data-loai', loai).attr('data-tu', 'khay')
        .attr('title', LOAI[loai].moTa).prop('disabled', con <= 0)
        .attr('aria-label', LOAI[loai].tenDay + ', còn ' + con + ' trong khay. ' + LOAI[loai].moTa + '.');
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

  function veDanhSachCong(banLap, kl) {
    let $d = $('<div class="sra-lr-thong-tin"></div>');
    let $ds = $('<ol class="sra-lr-ds-cong"></ol>');
    banLap.camBien.forEach(function(cb) {
      let ten = LOAI[cb.loai].ten + (cb.loai == 'doLine' && cb.ten ? ' ' + cb.ten : '');
      $ds.append($('<li></li>').append($('<span class="sra-lr-huy-hieu"></span>').text(cb.cong.slice(2))).append(document.createTextNode(' ' + ten)));
    });
    $d.append('<div class="sra-lr-tieu-de-nho">Cổng trong chương trình</div>');
    if (banLap.camBien.length) $d.append($ds); else $d.append('<p class="sra-lr-trong-khong">Xe chưa có cảm biến nào. Kéo một cảm biến từ khay vào xe.</p>');
    return $d;
  }

  function veLai(thongBao) {
    if (!$bang) return;
    let sd = veSoDo();
    $bang.find('.sra-lr-vung-khay').empty().append(veKhay());
    $bang.find('.sra-lr-vung-so-do').empty().append(sd.svg);
    $bang.find('.sra-lr-vung-thong-tin').empty().append(veDanhSachCong(sd.banLap, sd.kl));
    $bang.find('.sra-lr-khoi-luong').text('Xe nặng ' + Math.round(sd.kl.tong) + ' g, ' + Math.round(sd.kl.taiBanh * 100) + ' % trọng lượng đè lên hai bánh chủ động.');
    if (thongBao != null) $bang.find('.sra-lr-thong-bao').text(thongBao || GOI_Y).toggleClass('goi-y', !thongBao);
    danhDau();
  }

  // Tô sáng các chỗ nhận được linh kiện đang cầm hoặc đang kéo
  function danhDau() {
    if (!$bang) return;
    let dang = keo && keo.dangKeo ? keo : dangCam;
    $bang.toggleClass('dang-cam', !!dang);
    $bang.find('[data-cho]').each(function() {
      let id = this.getAttribute('data-cho'), duoc = false;
      if (dang) duoc = id == 'khay' ? dang.tu != 'khay' : (nhanDuoc(id, dang.loai) && id != dang.tu);
      this.classList.toggle('nhan-duoc', duoc);
      this.classList.toggle('dang-chon', !!dang && id == dang.tu && id != 'khay');
    });
    $bang.find('.sra-lr-the').each(function() {
      this.classList.toggle('dang-chon', !!dang && dang.tu == 'khay' && this.getAttribute('data-loai') == dang.loai);
    });
  }

  // ---------- Kéo thả và bấm chọn ----------
  function thucHien(loai, tu, den) {
    let tb = chuyen(loai, tu, den);
    dangCam = null;
    if (tb == null) {
      let ly = den == 'khay' || tu == den ? '' : (nhanDuoc(den, loai) ? 'Trong khay không còn ' + LOAI[loai].tenDay + '.' : lyDoKhongNhan(den, loai));
      veLai(ly);
      return;
    }
    luu(self.cauHinh);
    veLai(tb);
    henDungLai();
  }

  function choTai(x, y) {
    let e = document.elementFromPoint(x, y);
    while (e && e != document.body) {
      if (e.getAttribute && e.getAttribute('data-cho')) return e.getAttribute('data-cho');
      e = e.parentNode;
    }
    return null;
  }
  function nguonTu(e) {
    while (e && e != document.body) {
      if (e.getAttribute && e.getAttribute('data-loai')) {
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
    keo = { loai: n.loai, tu: n.tu, x0: ev.clientX, y0: ev.clientY, dangKeo: false, id: ev.pointerId, bong: null };
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
    let den = choTai(ev.clientX, ev.clientY);
    $bang.find('.dang-tren').removeClass('dang-tren');
    if (den) $bang.find('[data-cho="' + den + '"].nhan-duoc').addClass('dang-tren');
    ev.preventDefault();
  }
  function gocKeo() {
    document.removeEventListener('pointermove', diChuyen);
    document.removeEventListener('pointerup', tha);
    document.removeEventListener('pointercancel', huyKeo);
    if (keo && keo.bong) keo.bong.remove();
    let k = keo; keo = null;
    return k;
  }
  function huyKeo() { gocKeo(); danhDau(); }
  function tha(ev) {
    if (!keo || ev.pointerId != keo.id) return;
    let k = gocKeo();
    if (!k.dangKeo) return;         // chỉ là bấm: sự kiện click xử lí
    self._vuaKeo = Date.now();
    let den = choTai(ev.clientX, ev.clientY);
    // thả ra ngoài bảng lắp ráp: tháo linh kiện đang gắn; thả vào chỗ khác trong bảng: để nguyên
    let trongBang = $bang && $bang[0].contains(document.elementFromPoint(ev.clientX, ev.clientY));
    if (!den) {
      if (!trongBang && k.tu != 'khay') den = 'khay';
      else { veLai(''); return; }
    }
    thucHien(k.loai, k.tu, den);
  }

  function bam(ev) {
    if (self._vuaKeo && Date.now() - self._vuaKeo < 350) return;
    let n = nguonTu(ev.target), den = null, e = ev.target;
    while (e && e != $bang[0]) { if (e.getAttribute && e.getAttribute('data-cho')) { den = e.getAttribute('data-cho'); break; } e = e.parentNode; }
    if (dangCam) {
      if (n && n.loai == dangCam.loai && n.tu == dangCam.tu) { dangCam = null; veLai(''); return; }     // bấm lại: đặt xuống
      if (den && (den == 'khay' ? dangCam.tu != 'khay' && !(n && n.tu == 'khay') : true)) {
        if (den != 'khay' && !nhanDuoc(den, dangCam.loai)) {
          // bấm vào một linh kiện khác đang gắn ở chỗ không hợp: chuyển sang cầm linh kiện đó
          if (n) { dangCam = { loai: n.loai, tu: n.tu }; veLai('Đang cầm ' + LOAI[n.loai].tenDay + '. Bấm vào chỗ gắn được tô sáng.'); return; }
          let ly = lyDoKhongNhan(den, dangCam.loai); dangCam = null; veLai(ly); return;
        }
        thucHien(dangCam.loai, dangCam.tu, den);
        return;
      }
    }
    if (n) {
      dangCam = { loai: n.loai, tu: n.tu };
      veLai('Đang cầm ' + LOAI[n.loai].tenDay + '. Bấm vào chỗ gắn được tô sáng' + (n.tu != 'khay' ? ', hoặc bấm vào khay để tháo.' : '.'));
      return;
    }
    if (den && den != 'khay') veLai('Chỗ này đang trống. Kéo một cảm biến từ khay vào đây.');
  }
  function phim(ev) {
    if (ev.key == 'Escape') { if (dangCam) { dangCam = null; veLai(''); ev.stopPropagation(); } return; }
    if ((ev.key == 'Enter' || ev.key == ' ') && ev.target.getAttribute && ev.target.getAttribute('data-cho') && ev.target.tagName != 'BUTTON') {
      ev.preventDefault();
      let id = ev.target.getAttribute('data-cho');
      bam(ev);
      let e = $bang.find('[data-cho="' + id + '"]')[0];
      if (e && e.focus) e.focus();
    }
    if ((ev.key == 'Delete' || ev.key == 'Backspace') && ev.target.getAttribute && ev.target.getAttribute('data-loai') && ev.target.getAttribute('data-cho')) {
      ev.preventDefault();
      thucHien(ev.target.getAttribute('data-loai'), ev.target.getAttribute('data-cho'), 'khay');
    }
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
      self.cauHinh = veLuoi(robot.options.sraXe === true ? {} : robot.options.sraXe);
      self.dangMo = true;
      dangCam = null;
      $bang = $(
        '<section class="sra-lr-bang" aria-label="Bảng lắp ráp xe">' +
          '<header><h2>Lắp ráp xe</h2><button type="button" class="sra-lr-dong" aria-label="Đóng bảng lắp ráp">&times;</button></header>' +
          '<div class="sra-lr-than">' +
            '<div class="sra-lr-cot"><div class="sra-lr-vung-so-do"></div><p class="sra-lr-khoi-luong"></p></div>' +
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
      $bang.on('keydown', phim);
      $bang.on('dragstart', (e) => e.preventDefault());
      $bang.find('.sra-lr-dong').on('click', self.dong);
      $bang.find('.sra-lr-mac-dinh').on('click', function() {
        self.cauHinh = L.chuanHoaCauHinh({}); dangCam = null; xoaLuu();
        veLai('Đã đưa xe về bản lắp mặc định.'); henDungLai();
      });
      $bang.find('.sra-lr-thao-het').on('click', function() {
        self.cauHinh = L.chuanHoaCauHinh({ sieuAm: false, lo: L.X_LO.map(() => null), nap: [null, null] }); dangCam = null; luu(self.cauHinh);
        veLai('Đã tháo hết cảm biến.'); henDungLai();
      });
      veLai('');
      cameraGan();
      // cấu hình cũ được đưa về lưới lỗ: dựng lại nếu bản lắp vì thế mà khác đi
      if (JSON.stringify(L.chuanHoaCauHinh(robot.options.sraXe === true ? {} : robot.options.sraXe)) != JSON.stringify(self.cauHinh)) henDungLai();
      $bang.find('.sra-lr-dong').trigger('focus');
    });
  };
  this.dong = function() {
    if (!self.dangMo) return;
    gocKeo();
    self.dangMo = false;
    dangCam = null;
    if ($bang) $bang.remove();
    $bang = null;
    $('#simPanel').removeClass('sra-lr-dang-mo');
    cameraVe();
  };
  this.batTat = function() { return self.dangMo ? self.dong() : self.mo(); };

  // Dùng cho kiểm tra tự động và cho ai muốn lắp bằng lệnh: SRABangLapRap.dat('sieuAm', 'khay', 'gia')
  this.dat = function(loai, tu, den) { thucHien(loai, tu, den); return self.choDungXong(); };
  this.hinhCho = hinhCho;

  // Đổi robot khác trong lúc bảng đang mở thì đóng bảng
  if (typeof window != 'undefined') {
    setInterval(function() { if (self.dangMo && !dangDung && !laXe()) self.dong(); }, 500);
  }
};
