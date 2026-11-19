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
//   - Hoàn tác / làm lại (Ctrl+Z, Ctrl+Y hoặc Ctrl+Shift+Z, hai nút trên thanh công cụ), giữ 30 bước.
//
// Bố cục học theo Tinkercad: thanh công cụ trên cùng (hoàn tác, hướng nhìn, về mặc định, tháo hết), sơ đồ
// bên trái, khay linh kiện bên phải luôn hiện khi cuộn; dưới sơ đồ là bảng thuộc tính của thứ đang chọn
// (bấm một cảm biến: chỉ hiện thông số của nó; bấm chỗ trống trên xe: khối lượng, cổng, sơn xe).
//
// Cấu hình của người dùng lưu trên máy (localStorage) và được dùng lại khi chọn "Xe lắp mô-đun".
var SRABangLapRap = new function() {
  'use strict';
  let self = this;
  const L = SRALinhKien, H = SRAHinhKhoi, V = H.V, Q = H.Q;
  const KHOA = 'sanRobotAo.xeLapRap';
  const TEN_ROBOT = 'siro_xeLapRap';
  const NS = 'http://www.w3.org/2000/svg';
  const T = typeof sraT == 'function' ? sraT : (vi) => vi;

  const LOAI = {
    sieuAm: { ten: T('Siêu âm', 'Ultrasonic'), tenDay: T('cảm biến siêu âm HC-SR04', 'HC-SR04 ultrasonic sensor'), vung: 'gia', moTa: T('Đo khoảng cách tới vật phía trước (gắn được trước, trái, phải, sau)', 'Measures the distance to an object ahead (mounts front, left, right or back)') },
    doLine: { ten: T('Dò line', 'Line sensor'), tenDay: T('mắt dò line TCRT5000', 'TCRT5000 line sensor'), vung: 'duoi', moTa: T('Phân biệt nền sáng và vạch tối dưới gầm', 'Tells a light floor from a dark line underneath') },
    mau: { ten: T('Màu', 'Color'), tenDay: T('cảm biến màu TCS34725', 'TCS34725 color sensor'), vung: 'duoi', moTa: T('Đo màu của sân (đỏ, lục, lam) bằng đèn trắng', 'Measures the floor color (red, green, blue) under a white light') },
    but: { ten: T('Bút vẽ', 'Pen'), tenDay: T('bút vẽ', 'pen'), vung: 'tam', moTa: T('Vẽ lên sân theo đường xe đi; gắn ở tâm quay giữa hai bánh', 'Draws on the field along the car path; mounts at the turning center between the wheels') },
    cham: { ten: T('Chạm', 'Touch'), tenDay: T('cảm biến chạm', 'touch sensor'), vung: 'duoi', moTa: T('Báo khi tấm cản ở mũi xe bị ép vào', 'Signals when the front bumper is pressed') },
    gyro: { ten: 'Gyro', tenDay: T('cảm biến gyro', 'gyro sensor'), vung: 'nap', moTa: T('Đo góc xe đã quay', 'Measures how far the car has turned') },
    gps: { ten: 'GPS', tenDay: T('mô-đun GPS', 'GPS module'), vung: 'nap', moTa: T('Cho biết toạ độ của xe trên sân', 'Gives the car position on the field') },
    servo: { ten: 'Servo', tenDay: T('servo SG90', 'SG90 servo'), vung: 'nap', moTa: T('Quay tay quay tới góc 0–180° (một cổng động cơ); gắn được siêu âm, laze, dò line, cảm biến màu nhìn xa lên tay quay', 'Turns its arm to 0–180° (one motor port); ultrasonic, laser, line and long-range color sensors can mount on the arm') },
    laze: { ten: 'Laze', tenDay: T('cảm biến laze VL53L1X', 'VL53L1X laser sensor'), vung: 'gia', moTa: T('Đo khoảng cách bằng tia laze tới 4 m, chùm hẹp (gắn lên giá như siêu âm, hoặc lên tay quay servo)', 'Measures distance with a laser beam up to 4 m, narrow beam (mounts on a bracket like the ultrasonic, or on the servo arm)') },
    camera: { ten: 'Camera', tenDay: T('camera OV2640', 'OV2640 camera'), vung: 'gia', moTa: T('Chụp ảnh 100 × 100 điểm, tìm vùng màu (gắn lên giá)', 'Takes 100 × 100 pixel images and finds color blobs (mounts on a bracket)') },
    mauXa: { ten: T('Màu nhìn xa', 'Far color'), tenDay: T('cảm biến màu nhìn xa', 'long-range color sensor'), vung: 'servo', moTa: T('Đọc màu vật cách tới 30 cm (chỉ gắn lên tay quay servo)', 'Reads the color of objects up to 30 cm away (servo arm only)') },
    lidar: { ten: 'Lidar', tenDay: T('lidar LD06', 'LD06 lidar'), vung: 'nap', moTa: T('Quét khoảng cách 360° quanh xe, mỗi độ một số đo, xa tới 12 m', 'Scans distance 360° around the car, one reading per degree, up to 12 m') },
    namCham: { ten: T('Nam châm', 'Magnet'), tenDay: T('nam châm điện KK-P20/15', 'KK-P20/15 electromagnet'), vung: 'gam', moTa: T('Hút vật bằng sắt khi có điện (một cổng động cơ); gắn dưới gầm, hoặc làm đầu công tác ở mục Cơ cấu công tác', 'Attracts iron objects while powered (one motor port); mounts under the car, or as the tool in the Tool mechanism section') }
  };
  const THU_TU = ['sieuAm', 'laze', 'camera', 'doLine', 'mau', 'cham', 'gyro', 'gps', 'lidar', 'servo', 'but', 'namCham'];
  const laGia = (loai) => !!LOAI[loai] && LOAI[loai].vung == 'gia';
  const TEN_VUNG = T({ gam: 'gầm xe', duoi: 'thanh dưới mũi xe', gia: 'giá cảm biến', 'gia:truoc': 'giá phía mũi', 'gia:trai': 'giá bên trái', 'gia:phai': 'giá bên phải', 'gia:sau': 'giá phía đuôi', nap: 'nắp mạch chủ', tam: 'tâm quay giữa hai bánh' },
    { gam: 'underside', duoi: 'front bar', gia: 'sensor bracket', 'gia:truoc': 'front bracket', 'gia:trai': 'left bracket', 'gia:phai': 'right bracket', 'gia:sau': 'rear bracket', nap: 'main board cover', tam: 'turning center between the wheels' });
  // vùng v có nhận được loại cảm biến này không
  const hopVung = (loai, v) => !!v && (LOAI[loai].vung == 'gia' ? v.indexOf('gia:') == 0 : v == LOAI[loai].vung || ((loai == 'doLine' || loai == 'mau') && v == 'gam'));
  // mô-đun m (trong cấu hình hoặc bóng thử) có nằm dưới gầm không: chỉ mô-đun dưới gầm có toạ độ z
  const laGam = (m) => !!m && (m.loai == 'doLine' || m.loai == 'mau' || m.loai == 'namCham') && m.z != null;
  const SON_GOC = { khung: '#b9c0c7', canGat: '#f07a1a', vanh: '#f09c0d' };
  const TEN_SON = T({ khung: 'Khung', canGat: 'Tấm cản', vanh: 'Vành bánh' }, { khung: 'Frame', canGat: 'Bumper', vanh: 'Wheel rims' });
  const TEN_MAU = T({ '#c62828': 'đỏ', '#ef6c00': 'cam', '#f9a825': 'vàng', '#2e7d32': 'xanh lá', '#00838f': 'xanh ngọc', '#1565c0': 'xanh dương', '#6a1b9a': 'tím', '#d81b60': 'hồng', '#263238': 'đen', '#eceff1': 'trắng' },
    { '#c62828': 'red', '#ef6c00': 'orange', '#f9a825': 'yellow', '#2e7d32': 'green', '#00838f': 'teal', '#1565c0': 'blue', '#6a1b9a': 'purple', '#d81b60': 'pink', '#263238': 'black', '#eceff1': 'white' });

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
    // tâm quay (điểm giữa trục hai bánh): chỗ duy nhất gắn bút vẽ
    tam: { x0: -1.3, x1: 1.3, z0: -3.4, z1: 0.35 },
    // gầm xe (chỉ ở chế độ nhìn gầm): đúng tỉ lệ, cả mạch đầu đo lẫn ổ cắm phía sau nằm gọn dưới tấm đáy
    gam: { x0: -L.GAM.x - L.GAM.nuaRong, x1: L.GAM.x + L.GAM.nuaRong, z0: -4.0, z1: L.GAM.z1 + L.GAM.nuaDai }
  };
  const BIEN_HUT = { gam: 0.8, duoi: 0.9, 'gia:truoc': 0.6, 'gia:sau': 0.6, 'gia:trai': 0.4, 'gia:phai': 0.4, nap: 1.0, tam: 1.5 };      // vùng nhận rộng thêm ra ngoài khung (cm sơ đồ)
  const HUT = 1.5;                                        // bán kính hút tới chỗ trống gần nhất (cm thật)

  const GOI_Y = T('Kéo cảm biến vào vùng gắn trên xe. Kéo ra ngoài bảng để tháo. Giữ Alt để đặt mịn hơn.', 'Drag a sensor onto a mounting area on the car. Drag it off the panel to remove it. Hold Alt for finer placement.');

  this.dangMo = false;
  this.cauHinh = null;
  let $bang = null, dangCam = null, keo = null, xoay = null, henDung = null, dangDung = false, canDungLai = false, camTruoc = null;
  let xemTruoc = null;       // kết quả đang vẽ thử (lúc kéo hoặc lúc cầm rê chuột)
  let xemGam = false;        // sơ đồ đang nhìn gầm xe (từ dưới lên) thay vì nhìn từ trên xuống
  let chon = null;           // khoá mô-đun đang chọn (bảng thuộc tính hiện thông số của nó); null: cả xe
  let lichSu = [], lamLai = [];   // các cấu hình trước đó (hoàn tác) và các cấu hình vừa hoàn tác (làm lại)
  const SO_BUOC_LUU = 30;

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
  const tho = (c) => ({ banh: c.banh, but: c.but, co: c.co ? Object.assign({}, c.co) : null, ir: c.ir, nghiengIR: c.nghiengIR, caoIR: c.caoIR, sa: c.sa.map((m) => Object.assign({}, m)), son: Object.assign({}, c.son),
    duoi: c.duoi.map((m) => Object.assign({}, m)), tren: c.tren.map((m) => Object.assign({}, m, m.gan ? { gan: m.gan.slice() } : {})), gam: c.gam.map((m) => Object.assign({}, m)) });
  // servo trên nắp và các cảm biến gắn trên tay quay của nó (khoá 'servo:i', i là điểm gắn)
  const servoCua = (c) => c.tren.find((m) => m.loai == 'servo') || null;
  const soGanServo = (c, loai) => { let sv = servoCua(c); return sv ? sv.gan.filter((x) => x && (!loai || x == loai)).length : 0; };
  // giữ hướng lắp, tay quay, cảm biến của servo khi dời servo sang chỗ khác
  const kemServo = (p, nguon) => p.loai == 'servo' && nguon ? Object.assign(p, { nghieng: nguon.nghieng, xoay: nguon.xoay, tay: nguon.tay, gan: (nguon.gan || []).slice() }) : p;
  const DS_KHOA = ['duoi', 'tren', 'gam'];
  function layMoDun(c, khoa) {
    if (!khoa || khoa == 'khay') return null;
    if (khoa.indexOf('sa:') == 0) { let m = c.sa.find((n) => 'sa:' + n.gia == khoa); return m ? Object.assign({ loai: 'sieuAm' }, m) : null; }
    if (khoa == 'but') return c.but ? { loai: 'but', x: 0, z: 0 } : null;
    if (khoa.indexOf('servo:') == 0) { let sv = servoCua(c), i = Number(khoa.slice(6)); return sv && sv.gan[i] ? { loai: sv.gan[i], servo: i } : null; }
    let p = khoa.split(':'), ds = DS_KHOA.indexOf(p[0]) >= 0 ? c[p[0]] : [];
    return ds[Number(p[1])] || null;
  }
  function demLoai(c, loai) {
    if (laGia(loai)) return c.sa.filter((m) => (m.loai || 'sieuAm') == loai).length + soGanServo(c, loai);
    if (loai == 'but') return c.but ? 1 : 0;
    let dau = c.co && (c.co.dau == loai || (loai == 'mau' && c.co.mau)) ? 1 : 0;      // trên cơ cấu công tác
    return c.duoi.concat(c.tren, c.gam).filter((m) => m.loai == loai).length + soGanServo(c, loai) + dau;
  }
  const tongMoDun = (c) => c.sa.length + c.duoi.length + c.tren.length + c.gam.length + soGanServo(c) + (c.but ? 1 : 0) + L.soOCo(c.co);
  const demDuoi = (c, loai) => c.duoi.filter((m) => m.loai == loai).length;
  const conLai = (c, loai) => L.TOI_DA[loai] - demLoai(c, loai);
  const hetO = (c) => tongMoDun(c) >= L.SO_O;
  const LOI_CHAM_CO = T('Cơ cấu công tác đang chiếm mũi xe nên không lắp được tấm cản của cảm biến chạm. Tháo cơ cấu trước.', 'The front tool mechanism takes up the nose, so the touch sensor bumper cannot fit. Remove the mechanism first.');
  const LOI_HET_O = T('Mạch chủ chỉ có ' + L.SO_O + ' ổ cắm và đã cắm đủ. Tháo bớt một cảm biến trước.', 'The main board has only ' + L.SO_O + ' sockets and they are all in use. Remove a sensor first.');
  // Khoá của mô-đun loai ở vị trí (x, z) trong cấu hình c
  function timKhoa(c, loai, x, z) {
    if (laGia(loai)) return c.sa.some((m) => m.gia == x) ? 'sa:' + x : null;      // x: tên giá
    if (loai == 'but') return c.but ? 'but' : null;
    let ten = (loai == 'doLine' || loai == 'mau' || loai == 'namCham') && z != null ? 'gam' : (LOAI[loai].vung == 'duoi' ? 'duoi' : 'tren'), ds = c[ten];
    let i = ds.findIndex((m) => m.loai == loai && Math.abs(m.x - x) < 1e-6 && (z == null || Math.abs(m.z - z) < 1e-6));
    return i < 0 ? null : ten + ':' + i;
  }
  function boMoDun(c, khoa) {
    if (khoa == 'but') { c.but = false; return; }
    if (khoa.indexOf('sa:') == 0) { c.sa = c.sa.filter((m) => 'sa:' + m.gia != khoa); return; }
    if (khoa.indexOf('servo:') == 0) { let sv = servoCua(c); if (sv) sv.gan[Number(khoa.slice(6))] = null; return; }
    let p = khoa.split(':');
    c[p[0]].splice(Number(p[1]), 1);
  }

  const lam = (x, b) => Math.round(x / b) * b;
  const tron2 = (x) => Math.round(x * 100) / 100;
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const soViet = (x) => String(tron2(x)).replace('.', T(',', '.')).replace('-', '−');

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
      if (!den) return { loi: T('Không đặt được ở đây.', 'Cannot place it here.') };
      if (JSON.stringify(cc) == JSON.stringify(c0) && tu == den) return { loi: '', khongDoi: true, den: den, c: cc };
      return { c: cc, den: den, doi: doi ? timKhoa(cc, doi.loai, doi.x, doi.z) : null, tb: tb };
    };
    let tuKhay = !goc;
    if (tuKhay && conLai(c0, loai) <= 0) {
      return { loi: T('Trong khay không còn ', 'No more in the tray: ') + LOAI[loai].tenDay + '.' };
    }
    if (tuKhay && hetO(c0)) return { loi: LOI_HET_O };

    if (vung == 'gia') {
      let gia = diem.vung.slice(4), tenGia = TEN_VUNG[diem.vung];
      let dangCo = c.sa.find((m) => m.gia == gia);         // giá đích đã có cảm biến khác (không kể cái đang kéo)
      let gocXoay = goc && goc.gia == gia ? goc.goc : (dangCo ? dangCo.goc : 0);
      let gh = L.gioiHanU(gia, gocXoay), u = tron2(kep(lam(diem.u, buoc), gh[0], gh[1]));
      let doi = null;
      if (dangCo) {
        if (!goc) return { loi: viet(tenGia) + T(' đã có ', ' already has a ') + LOAI[dangCo.loai || 'sieuAm'].tenDay + T('. Mỗi giá gắn một mô-đun; kéo vào giá khác còn trống.', '. One module per bracket; drag it to a free bracket.') };
        // đổi chỗ: cảm biến đang ở giá đích chuyển sang giá của cảm biến đang kéo
        c.sa = c.sa.filter((m) => m.gia != gia);
        let gh2 = L.gioiHanU(goc.gia, goc.goc);
        doi = { gia: goc.gia, loai: dangCo.loai, u: tron2(kep(goc.u, gh2[0], gh2[1])), goc: goc.goc, cao: goc.cao };      // độ cao gắn với giá: mỗi giá giữ độ cao của mình
        c.sa.push(doi);
      }
      c.sa.push({ gia: gia, loai: loai, u: u, goc: gocXoay, cao: goc && goc.gia == gia ? goc.cao : (dangCo ? dangCo.cao : null) });
      let cc = L.chuanHoaCauHinh(c), den = 'sa:' + gia;
      if (JSON.stringify(cc) == JSON.stringify(c0) && tu == den) return { loi: '', khongDoi: true, den: den, c: cc };
      return { c: cc, den: den, doi: doi ? 'sa:' + doi.gia : null,
        tb: doi ? T('Đã đổi chỗ hai mô-đun trên giá.', 'Swapped the two bracket modules.') : T('Đã gắn ', 'Mounted the ') + LOAI[loai].tenDay + T(' lên ', ' on the ') + tenGia + ', ' + (L.GIA[gia].truc == 'x' ? 'x' : 'z') + ' = ' + soViet(u) + ' cm.' + ghiNang(goc && goc.gia == gia ? goc.cao : null, cc, gia) };
    }

    if (diem.vung == 'tam') {
      if (c.but) return { loi: T('Xe đã có bút vẽ.', 'The car already has a pen.') };
      c.but = true;
      let cc = L.chuanHoaCauHinh(c);
      for (let m of cc.gam) if (L.loiGam(m.x, m.z, [], true)) return { loi: T('Một mắt dò line dưới gầm đang chiếm chỗ ống giữ bút ở tâm xe. Dời mắt đó đi trước.', 'An underside line sensor is in the way of the pen holder at the center. Move it first.') };
      return ketQua(c, 'but', { x: 0, z: 0 }, null, T('Đã gắn bút vẽ ở tâm quay. Hộp pin dời lên phía mũi để nhường chỗ cho ống giữ bút.', 'Mounted the pen at the turning center. The battery box moved toward the nose to make room for the pen holder.'));
    }

    if (diem.vung == 'gam') {
      let G = L.GAM, p0 = { loai: loai, x: tron2(kep(lam(diem.x, buoc), -G.x, G.x)), z: tron2(kep(lam(diem.z, buoc), G.z0, G.z1)) };
      // thả ngay lên mắt dò line khác dưới gầm (kéo từ gầm): đổi chỗ hai mắt
      let tren = c.gam.findIndex((m) => Math.abs(diem.x - m.x) < G.nuaRong && diem.z > m.z - G.nuaDai - 1.9 && diem.z < m.z + G.nuaDai);
      if (tren >= 0 && goc && laGam(goc)) {
        let m = c.gam[tren], ds = c.gam.slice(); ds.splice(tren, 1);
        let moi = { loai: loai, x: m.x, z: m.z }, cu = { loai: m.loai, x: goc.x, z: goc.z };
        if (!L.loiGam(moi.x, moi.z, ds, c.but, moi.loai) && !L.loiGam(cu.x, cu.z, ds.concat([moi]), c.but, cu.loai)) {
          c.gam = ds.concat([moi, cu]);
          return ketQua(c, 'gam', moi, cu, T('Đã đổi chỗ hai mô-đun dưới gầm.', 'Swapped the two underside modules.'));
        }
      }
      if (c.gam.length >= G.toiDa) return { loi: T('Gầm xe gắn tối đa ' + G.toiDa + ' mô-đun.', 'The underside holds at most ' + G.toiDa + ' modules.') };
      if (loai == 'namCham' && c.gam.some((m) => m.loai == 'namCham')) return { loi: T('Gầm xe gắn một nam châm điện.', 'Only one electromagnet fits under the car.') };
      let n = Math.round(HUT / buoc), ung = [];
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
        let p = { loai: loai, x: tron2(p0.x + i * buoc), z: tron2(p0.z + j * buoc) };
        if (Math.hypot(i, j) * buoc <= HUT + 1e-6) ung.push({ p: p, d: Math.hypot(p.x - diem.x, p.z - diem.z) });
      }
      ung.sort((a, b) => a.d - b.d);
      for (let u of ung) {
        if (L.loiGam(u.p.x, u.p.z, c.gam, c.but, loai)) continue;
        c.gam.push(u.p);
        return ketQua(c, 'gam', u.p, null, T('Đã gắn ', 'Mounted the ') + LOAI[loai].tenDay + T(' dưới gầm xe, x = ', ' under the car, x = ') + soViet(u.p.x) + ' cm, z = ' + soViet(u.p.z) + ' cm.');
      }
      return { loi: L.loiGam(p0.x, p0.z, c.gam, c.but, loai) || T('Không còn chỗ trống ở đây.', 'No free space here.') };
    }

    if (diem.vung == 'duoi') {
      if (loai == 'cham' && c.co) return { loi: LOI_CHAM_CO };
      if (demDuoi(c, loai) >= L.TOI_DA_DUOI[loai] && !c.duoi.some((m) => Math.abs(m.x - diem.x) < 0.7 && m.loai == loai)) {
        return { loi: T('Thanh dưới mũi gắn tối đa ' + L.TOI_DA_DUOI[loai] + ' ' + LOAI[loai].tenDay + '.', 'The front bar holds at most ' + L.TOI_DA_DUOI[loai] + ' × ' + LOAI[loai].tenDay + '.') + (loai == 'doLine' ? T(' Chuyển sang "Nhìn gầm xe" để gắn thêm mắt dưới gầm.', ' Switch to "Underside view" to add more sensors under the car.') : '') };
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
            return ketQua(c, 'duoi', moi, cu, T('Đã đổi chỗ ', 'Swapped the ') + LOAI[loai].tenDay + T(' và ', ' and the ') + LOAI[m.loai].tenDay + '.');
          }
        } else if (!goc) {
          let ds = c.duoi.slice(); ds.splice(tren, 1);
          let cc = { loai: loai, x: m.x };
          if ((m.loai == loai || conLai(c0, loai) > 0) && !L.loiDuoi(loai, cc.x, ds)) {
            c.duoi = ds.concat([cc]);
            return ketQua(c, 'duoi', cc, null, T('Đã thay ', 'Replaced the ') + LOAI[m.loai].tenDay + T(' bằng ', ' with the ') + LOAI[loai].tenDay + '. ' + viet(LOAI[m.loai].tenDay) + T(' trở về khay.', ' went back to the tray.'));
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
          return ketQua(c, 'duoi', { x: x }, null, T('Đã gắn ', 'Mounted the ') + LOAI[loai].tenDay + T(' dưới mũi xe, ', ' under the nose, ') + moTaX(x) + '.');
        }
      }
      return { loi: L.loiDuoi(loai, x0, c.duoi) || T('Không còn chỗ trống ở đây.', 'No free space here.') };
    }

    // vung == 'nap'
    let mi = L.mienNap(loai);
    let p0 = { loai: loai, x: tron2(kep(lam(diem.x, buoc), mi.x0, mi.x1)), z: tron2(kep(lam(diem.z, buoc), mi.z0, mi.z1)) };
    let tren = c.tren.findIndex(function(m) { let k = L.KHUON_NAP[m.loai]; return Math.abs(diem.x - m.x) < k.nx && diem.z > m.z + k.z0 && diem.z < m.z + k.z1; });
    if (tren >= 0) {
      let m = c.tren[tren], ds = c.tren.slice(); ds.splice(tren, 1);
      let miM = L.mienNap(m.loai);
      if (goc) {
        let moi = kemServo({ loai: loai, x: tron2(kep(m.x, mi.x0, mi.x1)), z: tron2(kep(m.z, mi.z0, mi.z1)) }, goc);
        let cu = kemServo({ loai: m.loai, x: tron2(kep(goc.x, miM.x0, miM.x1)), z: tron2(kep(goc.z, miM.z0, miM.z1)) }, m);
        if (!L.loiNap(moi, ds) && !L.loiNap(cu, ds.concat([moi]))) {
          c.tren = ds.concat([moi, cu]);
          return ketQua(c, 'tren', moi, cu, T('Đã đổi chỗ ', 'Swapped the ') + LOAI[loai].tenDay + T(' và ', ' and the ') + LOAI[m.loai].tenDay + '.');
        }
      } else {
        let moi = { loai: loai, x: tron2(kep(m.x, mi.x0, mi.x1)), z: tron2(kep(m.z, mi.z0, mi.z1)) };
        if (!L.loiNap(moi, ds)) {
          c.tren = ds.concat([moi]);
          return ketQua(c, 'tren', moi, null, T('Đã thay ', 'Replaced the ') + LOAI[m.loai].tenDay + T(' bằng ', ' with the ') + LOAI[loai].tenDay + '. ' + viet(LOAI[m.loai].tenDay) + T(' trở về khay.', ' went back to the tray.'));
        }
      }
    }
    let n = Math.round(HUT / buoc), ung = [];
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      let p = kemServo({ loai: loai, x: tron2(p0.x + i * buoc), z: tron2(p0.z + j * buoc) }, goc);
      let d = Math.hypot(p.x - diem.x, p.z - diem.z);
      if (Math.hypot(i, j) * buoc <= HUT + 1e-6) ung.push({ p: p, d: d });
    }
    ung.sort((a, b) => a.d - b.d);
    for (let u of ung) {
      if (L.loiNap(u.p, c.tren)) continue;
      c.tren.push(u.p);
      return ketQua(c, 'tren', u.p, null, T('Đã gắn ', 'Mounted the ') + LOAI[loai].tenDay + T(' lên nắp mạch chủ.', ' on the main board cover.'));
    }
    return { loi: L.loiNap(p0, c.tren) || T('Không còn chỗ trống ở đây.', 'No free space here.') };
  }
  const viet = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const moTaX = (x) => Math.abs(x) < 1e-6 ? T('ngay giữa', 'in the middle') : T('cách giữa ' + soViet(Math.abs(x)) + ' cm về bên ' + (x < 0 ? 'trái' : 'phải'), soViet(Math.abs(x)) + ' cm ' + (x < 0 ? 'left' : 'right') + ' of the middle');

  // Tháo mô-đun ở khoá tu về khay
  function thao(tu) {
    if (tu == 'co') return datCo(null);
    let c0 = self.cauHinh, m = layMoDun(c0, tu);
    if (!m) return null;
    let c = tho(c0); boMoDun(c, tu);
    return { c: L.chuanHoaCauHinh(c), boChon: true, tb: T('Đã tháo ', 'Removed the ') + LOAI[m.loai].tenDay + '.' };
  }
  // Tự gắn loai vào chỗ trống đầu tiên (dùng cho phím Enter trên thẻ khay)
  function tuGan(loai) {
    if (conLai(self.cauHinh, loai) <= 0) return { loi: T('Trong khay không còn ', 'No more in the tray: ') + LOAI[loai].tenDay + '.' };
    let vung = LOAI[loai].vung;
    if (hetO(self.cauHinh)) return { loi: LOI_HET_O };
    if (vung == 'tam') return timCho(loai, 'khay', { vung: 'tam', x: 0, z: 0 }, 0.5);
    if (vung == 'gia') {
      let gia = L.DS_GIA.find((g) => !self.cauHinh.sa.some((m) => m.gia == g));
      return timCho(loai, 'khay', { vung: 'gia:' + gia, u: L.GIA[gia].u ? 1.5 : 0 }, 0.5);
    }
    if (vung == 'gam' || (vung == 'duoi' && (xemGam || demDuoi(self.cauHinh, loai) >= L.TOI_DA_DUOI[loai]) && (loai == 'doLine' || loai == 'mau'))) {
      // đang nhìn gầm, hoặc thanh dưới mũi đã đủ mắt: gắn dưới gầm, thử từ giữa xe ra hai bên
      for (let z of [4, 6, 2, 8, 0]) for (let x of [0, -1.5, 1.5, -3, 3, -3.75, 3.75]) {
        if (!L.loiGam(x, z, self.cauHinh.gam, self.cauHinh.but, loai)) return timCho(loai, 'khay', { vung: 'gam', x: x, z: z }, 0.5);
      }
      return { loi: T('Gầm xe không còn chỗ trống.', 'No free space under the car.') };
    }
    if (vung == 'duoi') {
      if (loai == 'cham' && self.cauHinh.co) return { loi: LOI_CHAM_CO };
      if (demDuoi(self.cauHinh, loai) >= L.TOI_DA_DUOI[loai]) return { loi: T('Thanh dưới mũi đã đủ ' + LOAI[loai].tenDay + '.', 'The front bar is full of ' + LOAI[loai].tenDay + 's.') };
      for (let k = 0; k <= 2 * L.X_DUOI[loai]; k++) {
        for (let x of k ? [-k * 0.5, k * 0.5] : [0]) {
          if (Math.abs(x) > L.X_DUOI[loai] || L.loiDuoi(loai, x, self.cauHinh.duoi)) continue;
          return timCho(loai, 'khay', { vung: 'duoi', x: x }, 0.5);
        }
      }
      return { loi: T('Thanh dưới mũi không còn chỗ trống.', 'No free space on the front bar.') };
    }
    // trên nắp: thử chỗ của bản cũ (gyro bên trái, GPS bên phải) trước, rồi bên kia, rồi tìm quanh đó
    let mac = loai == 'gyro' ? L.X_NAP : L.X_NAP.slice().reverse();
    for (let x of mac) {
      let p = { loai: loai, x: x, z: L.KHUON_NAP[loai].z };
      if (L.loiNap(p, self.cauHinh.tren)) continue;
      let c = tho(self.cauHinh); c.tren.push(p);
      let cc = L.chuanHoaCauHinh(c);
      return { c: cc, den: timKhoa(cc, loai, p.x, p.z), tb: T('Đã gắn ', 'Mounted the ') + LOAI[loai].tenDay + T(' lên nắp mạch chủ.', ' on the main board cover.') };
    }
    return timCho(loai, 'khay', { vung: 'nap', x: mac[0], z: L.KHUON_NAP[loai].z }, 0.5);
  }
  // Dời mô-đun ở khoá tu đi (dx, dz) cm; nếu chỗ mới bị chiếm thì nhảy qua mô-đun bên cạnh
  function nhich(tu, dx, dz) {
    let m = layMoDun(self.cauHinh, tu);
    if (!m) return null;
    if (m.loai == 'but') return { loi: T('Bút vẽ chỉ gắn được ở tâm quay.', 'The pen only mounts at the turning center.') };
    let c = tho(self.cauHinh); boMoDun(c, tu);
    for (let k = 1; k <= 40; k++) {
      if (laGia(m.loai)) {
        let doc = L.GIA[m.gia].truc == 'z', d = doc ? dz : dx, gh = L.gioiHanU(m.gia, m.goc), u = tron2(m.u + d);
        if (d == 0) return null;
        if (u < gh[0] - 1e-6 || u > gh[1] + 1e-6) return { loi: viet(LOAI[m.loai].tenDay) + T(' đã ra tới mép giá.', ' is at the edge of the bracket.') };
        c.sa.push({ gia: m.gia, loai: m.loai, u: u, goc: m.goc, cao: m.cao });
        let cc = L.chuanHoaCauHinh(c);
        return { c: cc, den: tu, tb: LOAI[m.loai].ten + ' ' + L.GIA[m.gia].ten + T(' ở ', ' at ') + (doc ? 'z' : 'x') + ' = ' + soViet(u) + ' cm.' + ghiNang(m.cao, cc, m.gia) };
      }
      if (laGam(m)) {
        let x = tron2(m.x + k * dx), z = tron2(m.z + k * dz), G = L.GAM;
        if (L.loiGam(x, z, [], false, m.loai)) return { loi: L.loiGam(x, z, [], false, m.loai) };
        if (L.loiGam(x, z, c.gam, c.but, m.loai)) { if (k * Math.abs(dz) > 3 || k * Math.abs(dx) > 4) return { loi: L.loiGam(x, z, c.gam, c.but, m.loai) }; continue; }
        c.gam.push({ loai: m.loai, x: x, z: z });
        let cc = L.chuanHoaCauHinh(c);
        return { c: cc, den: timKhoa(cc, m.loai, x, z), tb: viet(LOAI[m.loai].tenDay) + T(' dưới gầm ở x = ', ' under the car at x = ') + soViet(x) + ' cm, z = ' + soViet(z) + ' cm.' };
      }
      if (LOAI[m.loai].vung == 'duoi') {
        let x = tron2(m.x + k * dx);
        if (Math.abs(x) > L.X_DUOI[m.loai] + 1e-6 || dx == 0) return { loi: L.loiDuoi(m.loai, x, []) || '' };
        if (L.loiDuoi(m.loai, x, c.duoi)) continue;
        c.duoi.push({ loai: m.loai, x: x });
        let cc = L.chuanHoaCauHinh(c);
        return { c: cc, den: timKhoa(cc, m.loai, x), tb: viet(LOAI[m.loai].tenDay) + ' ' + moTaX(x) + '.' };
      }
      let p = kemServo({ loai: m.loai, x: tron2(m.x + k * dx), z: tron2(m.z + k * dz) }, m), mi = L.mienNap(m.loai);
      if (p.x < mi.x0 - 1e-6 || p.x > mi.x1 + 1e-6 || p.z < mi.z0 - 1e-6 || p.z > mi.z1 + 1e-6) return { loi: T('Mô-đun đã ra tới mép nắp mạch chủ.', 'The module is at the edge of the main board cover.') };
      if (L.loiNap(p, c.tren)) continue;
      c.tren.push(p);
      let cc = L.chuanHoaCauHinh(c);
      return { c: cc, den: timKhoa(cc, p.loai, p.x, p.z), tb: viet(LOAI[m.loai].tenDay) + T(' ở x = ', ' at x = ') + soViet(p.x) + ' cm, z = ' + soViet(p.z) + ' cm.' };
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
    return { c: L.chuanHoaCauHinh(c), den: khoa, tb: T('Siêu âm ', 'Ultrasonic ') + L.GIA[m.gia].ten + ' ' + moTaGoc(g) + '.' };
  }
  // Sơn một phần của xe (khung, tấm cản, vành bánh); mau null là trả về màu gốc
  function datSon(phan, mau) {
    if (!TEN_SON[phan]) return null;
    let c = tho(self.cauHinh);
    c.son = Object.assign({}, c.son); c.son[phan] = mau || null;
    return { c: L.chuanHoaCauHinh(c), tb: mau ? T('Đã sơn ' + TEN_SON[phan].toLowerCase() + ' màu ' + (TEN_MAU[mau] || mau) + '.', 'Painted the ' + TEN_SON[phan].toLowerCase() + ' ' + (TEN_MAU[mau] || mau) + '.') : TEN_SON[phan] + T(' về màu gốc.', ' back to the original color.') };
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
    let gh = L.gioiHanCao(m.gia, m.u, m.goc, self.cauHinh);
    cao = tron2(kep(Math.round(cao * 10) / 10, gh[0], gh[1]));
    if (cao == m.cao) {
      if (cao > gh[0] + 1e-6) return { loi: T('Siêu âm ' + L.GIA[m.gia].ten + ' đã ở cao nhất (', 'Ultrasonic ' + L.GIA[m.gia].ten + ' is already at its highest (') + soViet(gh[1]) + ' cm).' };
      let lyDo = m.gia == 'truoc' && self.cauHinh.co ? T('hạ nữa thì đụng cơ cấu công tác ở mũi.', 'any lower and it hits the front tool mechanism.') : m.gia == 'truoc' ? T('hạ nữa thì đụng công tắc chạm.', 'any lower and it hits the touch switch.') : (m.gia == 'sau' ? T('hạ nữa thì quá sát mặt sân.', 'any lower and it is too close to the floor.')
        : (L.nganBanh(m.gia, m.u, m.goc) ? T('cảm biến đang nằm ngang bánh xe. Dời nó lên phía mũi (z từ ' + soViet(zQuaBanh(m.gia, m.goc)) + ' cm) thì hạ được tới ' + soViet(L.GIA[m.gia].cao[0]) + ' cm.', 'the sensor is level with the wheel. Move it toward the nose (z from ' + soViet(zQuaBanh(m.gia, m.goc)) + ' cm) to lower it down to ' + soViet(L.GIA[m.gia].cao[0]) + ' cm.') : T('hạ nữa thì quá sát mặt sân.', 'any lower and it is too close to the floor.')));
      return { loi: T('Siêu âm ' + L.GIA[m.gia].ten + ' đã ở thấp nhất (', 'Ultrasonic ' + L.GIA[m.gia].ten + ' is already at its lowest (') + soViet(gh[0]) + ' cm): ' + lyDo };
    }
    m.cao = cao;
    return { c: L.chuanHoaCauHinh(c), den: khoa, tb: T('Siêu âm ' + L.GIA[m.gia].ten + ' cao ' + soViet(cao) + ' cm so với mặt sân.', 'Ultrasonic ' + L.GIA[m.gia].ten + ' is ' + soViet(cao) + ' cm above the floor.') };
  }
  // Câu ghi thêm khi độ cao bị nâng lên tự động vì cảm biến đã dời về chỗ ngang bánh xe
  function ghiNang(cu, cc, gia) {
    let moi = cc.sa.find((n) => n.gia == gia);
    return cu != null && moi && moi.cao > cu + 1e-6 ? T(' Cảm biến được nâng lên ' + soViet(moi.cao) + ' cm để vỏ không đụng bánh xe.', ' The sensor was raised to ' + soViet(moi.cao) + ' cm so its case clears the wheel.') : '';
  }
  const moTaGoc = (g) => Math.abs(g) < 1e-6 ? T('nhìn thẳng ra trước', 'facing straight ahead') : T('xoay ' + soViet(Math.abs(g)) + '° sang ' + (g > 0 ? 'trái' : 'phải'), 'turned ' + soViet(Math.abs(g)) + '° ' + (g > 0 ? 'left' : 'right'));

  function tenMoDun(khoa, banLap, c) {
    let m = layMoDun(c || self.cauHinh, khoa);
    if (!m) return '';
    let cb = banLap && (banLap.camBien.find((x) => khoaCua(x) == khoa) || banLap.tacDong.find((t) => t.gam != null && 'gam:' + t.gam == khoa));
    let ten = LOAI[m.loai].tenDay + (cb && cb.ten && m.loai != 'cham' && m.loai != 'namCham' ? ' (' + cb.ten + ')' : '');
    let congMach = !cb ? '.' : cb.cong.indexOf('out') == 0 ? T('. Động cơ ' + cb.cong.slice(3) + ' trong chương trình, cắm ổ ' + cb.oMach + ' trên mạch chủ.', '. Motor ' + cb.cong.slice(3) + ' in the program, plugged into socket ' + cb.oMach + ' on the main board.')
      : T('. Cổng ' + cb.cong.slice(2) + ' trong chương trình, cắm ổ ' + cb.oMach + ' trên mạch chủ.', '. Port ' + cb.cong.slice(2) + ' in the program, plugged into socket ' + cb.oMach + ' on the main board.');
    if (m.loai == 'but') return T('Bút vẽ ở tâm quay, ngay giữa hai bánh: xe quay tại chỗ thì ngòi bút đứng yên', 'Pen at the turning center, right between the wheels: when the car turns on the spot the tip stays still') + congMach;
    if (m.servo != null) return viet(LOAI[m.loai].tenDay) + T(' trên tay quay servo, điểm gắn ', ' on the servo arm, mount point ') + (m.servo + 1) + congMach;
    let viTri = laGia(m.loai) && m.gia ? T('trên ', 'on the ') + TEN_VUNG['gia:' + m.gia] + ', ' + (L.GIA[m.gia].truc == 'x' ? 'x' : 'z') + ' = ' + soViet(m.u) + T(' cm, cao ', ' cm, height ') + soViet(m.cao) + ' cm, ' + moTaGoc(m.goc)
      : laGam(m) ? T('dưới gầm xe, x = ', 'under the car, x = ') + soViet(m.x) + ' cm, z = ' + soViet(m.z) + ' cm'
      : (LOAI[m.loai].vung == 'duoi' ? T('dưới mũi xe, ', 'under the nose, ') + moTaX(m.x) : T('trên nắp mạch chủ, x = ', 'on the main board cover, x = ') + soViet(m.x) + ' cm, z = ' + soViet(m.z) + ' cm');
    return viet(ten) + ' ' + viTri + congMach;
  }
  function lyDoKhongNhan(vung, loai) {
    if (!vung) return '';
    let dung = THU_TU.filter((l) => hopVung(l, vung)).map((l) => LOAI[l].tenDay);
    let o = LOAI[loai].vung == 'gia' ? T('một trong bốn giá cảm biến (trước, trái, phải, sau)', 'one of the four sensor brackets (front, left, right, back)') : TEN_VUNG[LOAI[loai].vung] + (loai == 'doLine' || loai == 'mau' ? T(' hoặc gầm xe', ' or the underside') : '');
    if (vung == 'gam') return T('Gầm xe chỉ gắn được mắt dò line, cảm biến màu và nam châm điện. ', 'Only line sensors, color sensors and the electromagnet mount under the car. ') + viet(LOAI[loai].tenDay) + T(' gắn ở ', ' mounts on the ') + o + T(': bấm "Nhìn từ trên" để thấy chỗ đó.', ': press "Top view" to see it.');
    return viet(TEN_VUNG[vung]) + T(' chỉ gắn được ', ' only takes ') + dung.join(T(' hoặc ', ' or ')) + '. ' + viet(LOAI[loai].tenDay) + T(' gắn ở ', ' mounts on the ') + o + '.';
  }
  const khoaCua = (cb) => cb.loai == 'but' ? 'but' : cb.servo != null ? 'servo:' + cb.servo : laGia(cb.loai) && cb.gia ? 'sa:' + cb.gia : (cb.gam != null ? 'gam:' + cb.gam : (cb.duoi != null ? 'duoi:' + cb.duoi : 'tren:' + cb.tren));

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
    svg('text', { x: K.x1 - 0.25, y: Y(K.z1) + 0.8, 'class': 'sra-lr-chu-mo', 'text-anchor': 'end' }, s).textContent = T('Mũi xe', 'Nose');
    svg('text', { x: K.x0 + 0.25, y: Y(K.z0) - 0.3, 'class': 'sra-lr-chu-mo' }, s).textContent = T('Đuôi xe', 'Tail');
    svg('text', { x: K.x0 + 0.25, y: Y(K.z1) + 0.8, 'class': 'sra-lr-chu-mo' }, s).textContent = T('Nhìn từ dưới lên', 'Seen from below');
    svg('text', { x: K.x0 + 0.25, y: Y(0) - 0.15, 'class': 'sra-lr-chu-mo' }, s).textContent = 'z = 0';
    let v = VUNG.gam, nhan = !!opt.dangKeo && hopVung(opt.dangKeo, 'gam');
    svg('rect', { 'class': 'sra-lr-vung sra-lr-vung-gam' + (nhan ? ' nhan-duoc' : '') + (opt.vungTren == 'gam' ? ' dang-tren' : ''), 'data-vung': 'gam',
      x: v.x0, y: Y(v.z1), width: v.x1 - v.x0, height: v.z1 - v.z0, rx: 0.5 }, s);
    // trục dọc của xe và trục bánh (z = 0) làm mốc đo
    svg('path', { 'class': 'sra-lr-truc', d: 'M 0 ' + Y(v.z1 - 0.1) + ' L 0 ' + Y(v.z0 + 0.1) + ' M ' + v.x0 + ' 0 L ' + v.x1 + ' 0' }, s);
    // dây: từ ổ cắm chạy thẳng dọc gầm ra mép đuôi rồi vòng lên mạch chủ
    let gDay = svg('g', { 'class': 'sra-lr-day' }, s);
    banLap.camBien.concat(banLap.tacDong.filter((t) => t.gam != null)).forEach(function(cb) {
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
    } else if (loai == 'laze') {
      hcn(0, 0, 3.0, 1.0, '#4b2a7a', 0.2);
      hcn(0, -0.2, 0.9, 0.45, '#1b1d22', 0.08); tron(-0.2, -0.3, 0.12, '#e8505b'); tron(0.2, -0.3, 0.12, '#7fb6ff');
      for (let s of [-1, 1]) tron(s * 1.15, 0.1, 0.18, '#d7d9dc');
    } else if (loai == 'camera') {
      hcn(0, 0, 3.6, 2.1, '#1f6fb5', 0.25);
      hcn(0, -0.35, 1.6, 1.2, '#1b1d22', 0.12); tron(0, -0.6, 0.55, '#3a3f47'); tron(0, -0.6, 0.3, '#0c0c0e', { stroke: '#7fb6ff', 'stroke-width': 0.06 });
    } else if (loai == 'lidar') {
      hcn(0, 0, 3.9, 3.9, '#1b1d22', 0.4);
      tron(0, 0, 1.75, '#2a2d33'); tron(0, 0, 1.2, '#3a3f47'); hcn(0, -0.9, 0.9, 0.35, '#e8505b', 0.08);
    } else if (loai == 'doLine') {
      hcn(0, 0, 1.3, 2.0, '#1b1d22', 0.18);
      // TCRT5000 dọc theo thân xe: đầu phát (xanh nhạt) phía mũi, đầu thu (đen) phía sau
      hcn(0, -0.35, 0.62, 1.0, '#34373d', 0.08);
      tron(0, -0.6, 0.17, '#7fb6ff'); tron(0, -0.1, 0.17, '#0c0c0e', { stroke: '#555a61', 'stroke-width': 0.05 });
      hcn(0, 0.55, 0.9, 0.5, '#ecebe6', 0.06);
    } else if (loai == 'mau') {
      // TCS34725 nhìn từ trên: mạch xanh lá, ống che sáng đen, đèn trắng phía mũi, chip phía sau
      hcn(0, 0, 1.4, 1.5, '#1c7a4a', 0.15);
      tron(0, 0, 0.52, '#26282c');
      tron(0, -0.15, 0.15, '#fbfbf2'); tron(0, 0.15, 0.12, '#0c0c0e', { stroke: '#555a61', 'stroke-width': 0.04 });
      hcn(0, 0.95, 0.9, 0.4, '#ecebe6', 0.06);
    } else if (loai == 'but') {
      // bút vẽ nhìn từ trên: vành kẹp nhôm, cuộn nâng bằng đồng, nắp bút, mạch điều khiển phía sau
      hcn(0, 0, 2.4, 2.4, '#b9c0c7', 0.2);
      tron(0, 0, 1.0, '#c9a24a');
      tron(0, 0, 0.6, '#15171a');
      tron(0, 0, 0.2, '#f3f4f2');
    } else if (loai == 'cham') {
      hcn(0, -0.78, 1.5, 0.34, '#f07a1a', 0.1);
      hcn(0, 0.2, 1.3, 1.1, '#26282c', 0.14);
      tron(0, -0.42, 0.2, '#d43a2f');
      hcn(0, 0.82, 0.9, 0.36, '#ecebe6', 0.06);
    } else if (loai == 'gyro') {
      hcn(0, 0, 2.2, 2.6, '#6a4bb3', 0.25);
      svg('path', { d: 'M -0.62 0.12 A 0.64 0.64 0 1 1 0.2 0.6', fill: 'none', stroke: '#fff', 'stroke-width': 0.17, 'stroke-linecap': 'round' }, g);
      svg('path', { d: 'M 0.02 0.3 L 0.5 0.64 L -0.02 0.92 Z', fill: '#fff' }, g);
    } else if (loai == 'servo') {
      // servo SG90 nhìn từ trên: thân xanh, tai bắt vít, tay quay trắng trên trục
      hcn(0, 0.35, 1.25, 3.2, '#2453b8', 0.12);
      hcn(0, 0.35, 1.25, 2.3, '#2f66d0', 0.15);
      hcn(0, -0.55, 0.5, 2.6, '#f3f4f2', 0.25, { transform: 'translate(0 -0.65)' });
      tron(0, -0.55, 0.42, '#f3f4f2', { stroke: '#9aa0a6', 'stroke-width': 0.06 });
      tron(0, -0.55, 0.14, '#9aa0a6');
    } else if (loai == 'namCham') {
      // nam châm điện nhìn thẳng mặt hút: lõi thép, vòng đồng ở giữa
      tron(0, 0, 1.0, '#c9ccd1', { stroke: '#8d9299', 'stroke-width': 0.08 });
      tron(0, 0, 0.55, '#c9a24a');
      tron(0, 0, 0.2, '#8d9299');
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
    if (laGia(m.loai) && m.gia) {
      let w = m.loai == 'laze' ? 3.0 : m.loai == 'camera' ? 3.6 : 4.7, hh = m.loai == 'laze' ? 1.0 : m.loai == 'camera' ? 2.1 : 1.9;
      let g = L.GIA[m.gia], day0 = w / 2 * Math.sin(Math.abs(m.goc) * Math.PI / 180), p, ra;
      if (m.gia == 'truoc') { p = [m.u, ZG + day0]; ra = [m.u, ZG - 0.3]; }
      else if (m.gia == 'sau') { p = [m.u, g.mat - day0]; ra = [m.u, -5.05]; }
      else { let sg = Math.sign(g.mat); p = [g.mat + sg * day0, m.u]; ra = [sg * 5.55, m.u]; }
      return { x: p[0], z: p[1], goc: GOC_SVG[m.gia] - m.goc, goc0: GOC_SVG[m.gia], tiLe: 1, w: w, h: hh, lech: hh / 2, ra: ra };
    }
    if (m.loai == 'but') return { x: 0, z: 0, goc: 0, tiLe: 1, w: 2.4, h: 2.4, lech: 0, ra: [0, -3.4] };
    if (laGam(m)) { let w = L.nuaGam(m.loai); return { x: m.x, z: m.z, goc: 0, tiLe: 1, w: 2 * w, h: m.loai == 'namCham' ? 2.0 : 2.0, lech: 0, ra: [m.x, m.z - (m.loai == 'namCham' ? 1.0 : L.GAM.nuaDai) - 1.9] }; }
    if (LOAI[m.loai].vung == 'duoi') return { x: KX * m.x, z: ZB, goc: 0, tiLe: TI_LE_DUOI, w: 1.5, h: 2.0, lech: 0, ra: [KX * m.x, ZB - 1.0 * TI_LE_DUOI] };
    let k = L.KHUON_NAP[m.loai];
    return { x: m.x, z: m.z, goc: 0, tiLe: 1, w: 2 * k.nx, h: m.loai == 'gyro' ? 2.6 : m.loai == 'servo' ? 2.0 : m.loai == 'lidar' ? 3.9 : 2.9, lech: 0, ra: [m.x, m.z + k.z0] };
  }
  function veMoDun(cha, m, khoa, them) {
    let h = hinhMoDun(m);
    let g = svg('g', Object.assign({ 'class': 'sra-lr-mo-dun', 'data-cho': khoa, 'data-loai': m.loai, tabindex: 0, role: 'button',
      transform: 'translate(' + so(h.x) + ' ' + so(Y(h.z)) + ')' + (h.goc ? ' rotate(' + so(h.goc) + ')' : '') }, them || {}), cha);
    let trong = svg('g', { transform: 'translate(0 ' + so(-h.lech * h.tiLe) + ')' }, g);
    if (laGia(m.loai) && m.gia) {
      // chùm sóng 15° phía trước (vẽ ngắn, chỉ để thấy hướng); laze chùm hẹp, camera góc nhìn rộng
      let nua = (m.loai == 'laze' ? 2 : m.loai == 'camera' ? 25 : 7.5) * Math.PI / 180, dai = 3.6, y0 = -h.h / 2 * h.tiLe, mo = m.loai == 'sieuAm' ? 0.9 : 0.3;
      svg('path', { 'class': 'sra-lr-chum', d: 'M 0 ' + so(y0) + ' L ' + so(-dai * Math.tan(nua) - mo) + ' ' + so(y0 - dai) + ' L ' + so(dai * Math.tan(nua) + mo) + ' ' + so(y0 - dai) + ' Z' }, trong);
    }
    if (laGam(m)) {
      // ổ RJ25 ngay sau mạch đầu đo (cũng treo dưới tấm đáy)
      svg('rect', { 'class': 'sra-lr-o-cam', x: -0.75, y: so(m.loai == 'namCham' ? 1.0 : L.GAM.nuaDai), width: 1.5, height: 1.9, rx: 0.15 }, trong);
    }
    if (m.loai == 'but') {
      // mạch điều khiển cuộn nâng và ổ RJ25 sau ống giữ bút
      svg('rect', { 'class': 'sra-lr-o-cam', x: -0.75, y: 1.45, width: 1.5, height: 1.9, rx: 0.15 }, trong);
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
      let t = svg('g', { 'class': 'sra-lr-thao', 'data-thao': khoa, role: 'button', 'aria-label': T('Tháo cảm biến này', 'Remove this sensor') }, trong);
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
    let s = svg('svg', { viewBox: [K.x0, Y(K.z1), K.x1 - K.x0, K.z1 - K.z0].join(' '), 'class': 'sra-lr-so-do', role: 'group', 'aria-label': T('Sơ đồ xe nhìn từ trên xuống, mũi xe ở phía trên', 'Car diagram seen from above, nose at the top') });
    if (gam) {
      s.setAttribute('aria-label', T('Sơ đồ gầm xe nhìn từ dưới lên, mũi xe ở phía trên, bên trái sơ đồ là bên trái xe', 'Underside diagram seen from below, nose at the top, the left of the diagram is the left of the car'));
      veGam(s, c, opt, banLap);
    } else {
      veNen(s, c.son);
      svg('text', { x: SD.x1 - 0.3, y: Y(SD.z1) + 1.0, 'class': 'sra-lr-chu-mo', 'text-anchor': 'end' }, s).textContent = T('Mũi xe', 'Nose');
      svg('text', { x: SD.x0 + 0.3, y: Y(SD.z0) - 0.35, 'class': 'sra-lr-chu-mo' }, s).textContent = T('Đuôi xe', 'Tail');

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
      veVung('tam', 'sra-lr-vung-tam');
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
      let dsDay = banLap.camBien.slice();
      if (banLap.servo) dsDay.push({ servoThan: true, oMach: banLap.servo.oMach });
      dsDay.forEach(function(cb) {
        let khoa = cb.servoThan ? 'tren:' + c.tren.indexOf(servoCua(c)) : khoaCua(cb), m = layMoDun(c, khoa);
        if (!m) return;
        if (m.servo != null) m = servoCua(c);       // cảm biến trên tay quay: dây đi xuống theo trụ servo
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
    let dsKhoa = gam ? c.gam.map((m, i) => 'gam:' + i) : c.sa.map((m) => 'sa:' + m.gia).concat(c.duoi.map((m, i) => 'duoi:' + i), c.tren.map((m, i) => 'tren:' + i), c.but ? ['but'] : []);
    dsKhoa.forEach(function(khoa) {
      let m = layMoDun(c, khoa);
      let lop = 'sra-lr-mo-dun' + (opt.moi && opt.moi.indexOf(khoa) >= 0 ? ' xem-truoc' : '') + (opt.an == khoa ? ' dang-keo' : '') + (opt.chon == khoa ? ' dang-chon' : '');
      let g = veMoDun(s, m, khoa, { 'class': lop });
      g.setAttribute('aria-label', tenMoDun(khoa, banLap, c) + T(' Bấm để cầm lên, dùng phím mũi tên để dời', ' Click to pick it up, use the arrow keys to move it') + (khoa.indexOf('sa:') == 0 ? T(', Q hoặc E để xoay', ', Q or E to rotate') : '') + T(', Delete để tháo.', ', Delete to remove.'));
      // số cổng ở góc trên bên phải của mô-đun (tính theo góc xoay của mô-đun)
      let h = hinhMoDun(m), t = h.goc * Math.PI / 180;
      let lx = h.w / 2 * h.tiLe - 0.1, ly = -(h.lech + h.h / 2) * h.tiLe + 0.1;
      if (laGia(m.loai) && m.gia) { lx = h.w / 2 * h.tiLe + 0.45; ly = -0.4; }     // siêu âm: cạnh sau bên phải (núm xoay ở phía trước)
      let bx = h.x + lx * Math.cos(t) - ly * Math.sin(t), by = Y(h.z) + lx * Math.sin(t) + ly * Math.cos(t);
      let gc = svg('g', { 'class': 'sra-lr-nhan-cong' }, s);
      svg('circle', { 'class': 'sra-lr-cong', cx: so(bx), cy: so(by), r: 0.74 }, gc);
      svg('text', { 'class': 'sra-lr-so-cong', x: so(bx), y: so(by + 0.37) }, gc).textContent = congCua[khoa];
      if (laGia(m.loai) && m.gia) veNumXoay(s, m, h, khoa);
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
    let num = svg('g', { 'class': 'sra-lr-num', 'data-xoay': khoa, tabindex: 0, role: 'slider', 'aria-label': T('Xoay cảm biến siêu âm ', 'Rotate ultrasonic sensor ') + L.GIA[m.gia].ten,
      'aria-valuemin': -L.GOC_SA, 'aria-valuemax': L.GOC_SA, 'aria-valuenow': m.goc, 'aria-valuetext': moTaGoc(m.goc) }, g);
    svg('circle', { cx: so(n[0]), cy: so(Y(n[1])), r: 0.62 }, num);
    svg('path', { d: 'M ' + so(n[0] - 0.3) + ' ' + so(Y(n[1]) - 0.05) + ' a 0.36 0.36 0 1 1 0.6 0.1', fill: 'none' }, num);
    if (Math.abs(m.goc) > 1e-6) {
      let c = diemCung(h, m.goc, r + 1.25);
      svg('text', { 'class': 'sra-lr-chu-goc', x: so(c[0]), y: so(Y(c[1]) + 0.3), 'text-anchor': 'middle' }, g).textContent = soViet(Math.abs(m.goc)) + '°';
    }
  }

  function veKhay() {
    let $k = $('<div class="sra-lr-khay" data-cho="khay" role="group" aria-label="' + T('Khay linh kiện', 'Parts tray') + '"></div>');
    let het = hetO(self.cauHinh);
    THU_TU.forEach(function(loai) {
      let con = conLai(self.cauHinh, loai);
      let $the = $('<button type="button" class="sra-lr-the"></button>').attr('data-loai', loai).attr('data-tu', 'khay')
        .attr('title', het && con > 0 ? LOI_HET_O : LOAI[loai].moTa).prop('disabled', con <= 0 || het)
        .attr('aria-label', LOAI[loai].tenDay + T(', còn ' + con + ' trong khay. ', ', ' + con + ' left in the tray. ') + (het ? LOI_HET_O : LOAI[loai].moTa + T('. Enter để tự gắn vào chỗ trống.', '. Enter to mount it in a free spot.')));
      let kich = { sieuAm: [5.2, 2.4], laze: [3.4, 2.4], camera: [4.0, 2.5], doLine: [2.2, 2.4], mau: [2.2, 2.6], but: [2.8, 2.8], cham: [2.2, 2.4], gyro: [3.0, 3.0], gps: [3.0, 3.3], lidar: [4.3, 4.3], servo: [2.6, 3.6], namCham: [2.4, 2.4] }[loai];
      let s = svg('svg', { viewBox: [-kich[0] / 2, -kich[1] / 2, kich[0], kich[1]].join(' '), width: kich[0] * 12.5, height: kich[1] * 12.5, 'aria-hidden': 'true' });
      veLinhKien(loai, s);
      $the.append(s);
      $the.append($('<span class="sra-lr-ten"></span>').text(LOAI[loai].ten));
      $the.append($('<span class="sra-lr-con"></span>').text(con <= 0 ? T('đã gắn', 'all used') : (het ? T('hết ổ', 'no socket') : T('còn ', '') + con + T('', ' left'))));
      $k.append($the);
    });
    return $k;
  }

  function veDanhSachCong(banLap) {
    let $d = $('<div class="sra-lr-thong-tin"></div>');
    let $ds = $('<ol class="sra-lr-ds-cong"></ol>');
    banLap.camBien.forEach(function(cb) {
      let ten = LOAI[cb.loai].ten + ((cb.loai == 'doLine' || cb.loai == 'mau' || laGia(cb.loai)) && cb.ten ? ' ' + cb.ten : '');
      let khoa = khoaCua(cb);
      $ds.append($('<li></li>').attr('data-khoa', khoa).attr('data-chon-khoa', khoa).attr('title', T('Bấm để chọn cảm biến này', 'Click to select this sensor'))
        .append($('<span class="sra-lr-huy-hieu"></span>').text(cb.cong.slice(2)))
        .append($('<span class="sra-lr-ten-cong"></span>').text(ten).append(cb.oMach ? $('<small></small>').text(T(' ổ ', ' socket ') + cb.oMach) : ''))
        .append($('<button type="button" class="sra-lr-nut-thao"></button>').text(T('Tháo', 'Remove')).attr('data-thao', khoa).attr('aria-label', T('Tháo ', 'Remove ') + LOAI[cb.loai].tenDay + (cb.ten ? ' ' + cb.ten : ''))));
    });
    let sv = servoCua(self.cauHinh);
    if (sv && banLap.servo) {
      let khoa = 'tren:' + self.cauHinh.tren.indexOf(sv);
      $ds.append($('<li class="sra-lr-cong-servo"></li>').attr('data-khoa', khoa).attr('data-chon-khoa', khoa).attr('title', T('Bấm để chọn servo', 'Click to select the servo'))
        .append($('<span class="sra-lr-huy-hieu"></span>').text('C'))
        .append($('<span class="sra-lr-ten-cong"></span>').text('Servo').append($('<small></small>').text(T(' ổ ', ' socket ') + banLap.servo.oMach)))
        .append($('<button type="button" class="sra-lr-nut-thao"></button>').text(T('Tháo', 'Remove')).attr('data-thao', khoa).attr('aria-label', T('Tháo servo và các cảm biến trên tay quay', 'Remove the servo and the sensors on its arm'))));
    }
    // động cơ ngoài hai bánh: nam châm dưới gầm, cơ cấu công tác
    banLap.tacDong.forEach(function(td) {
      let khoa = td.gam != null ? 'gam:' + td.gam : 'co';
      let ten = td.loai == 'namCham' ? LOAI.namCham.ten + ' ' + td.ten : TEN_TD[td.loai] + (td.ten ? ' ' + td.ten : '');
      $ds.append($('<li class="sra-lr-cong-servo"></li>').attr('data-khoa', khoa)
        .append($('<span class="sra-lr-huy-hieu"></span>').text(td.cong.slice(3)))
        .append($('<span class="sra-lr-ten-cong"></span>').text(ten).append($('<small></small>').text(T(' ổ ', ' socket ') + td.oMach)))
        .append($('<button type="button" class="sra-lr-nut-thao"></button>').text(T('Tháo', 'Remove')).attr('data-thao', khoa).attr('aria-label', T('Tháo ', 'Remove ') + ten)));
    });
    $d.append($('<div class="sra-lr-tieu-de-nho"></div>').text(T('Cổng trong chương trình (' + tongMoDun(self.cauHinh) + '/' + L.SO_O + ' ổ cắm)', 'Ports in the program (' + tongMoDun(self.cauHinh) + '/' + L.SO_O + ' sockets)')));
    if (banLap.camBien.length || sv || banLap.tacDong.length) $d.append($ds); else $d.append($('<p class="sra-lr-trong-khong"></p>').text(T('Xe chưa có cảm biến nào. Kéo một cảm biến từ khay vào xe.', 'The car has no sensors yet. Drag a sensor from the tray onto the car.')));
    return $d;
  }

  // Độ cao từng cảm biến siêu âm (tâm cảm biến so với mặt sân): nút − và + bước 0,5 cm
  function veDoCao(khoaChon) {
    let $s = $('<div class="sra-lr-do-cao"></div>');
    $s.append($('<div class="sra-lr-tieu-de-nho"></div>').text(T('Độ cao (tâm cảm biến so với mặt sân)', 'Height (sensor center above the floor)')));
    self.cauHinh.sa.filter((m) => !khoaChon || 'sa:' + m.gia == khoaChon).forEach(function(m) {
      let gh = L.gioiHanCao(m.gia, m.u, m.goc, self.cauHinh), khoa = 'sa:' + m.gia, ten = T('siêu âm ', 'ultrasonic ') + L.GIA[m.gia].ten;
      $s.append($('<div class="sra-lr-hang-cao"></div>').attr('data-khoa', khoa)
        .append($('<span class="sra-lr-ten-cao"></span>').text(viet(L.GIA[m.gia].ten)))
        .append($('<button type="button" class="sra-lr-nut-cao">−</button>').attr({ 'data-cao': khoa, 'data-buoc': -0.5, 'aria-label': T('Hạ ' + ten + ' 0,5 cm', 'Lower ' + ten + ' 0.5 cm') }).prop('disabled', m.cao <= gh[0] && !L.nganBanh(m.gia, m.u, m.goc)))      // ngang bánh: vẫn bấm được để xem gợi ý dời lên trước
        .append($('<output class="sra-lr-gia-tri-cao"></output>').text(soViet(m.cao) + ' cm').attr('aria-label', ten + ' cao ' + soViet(m.cao) + ' cm'))
        .append($('<button type="button" class="sra-lr-nut-cao">+</button>').attr({ 'data-cao': khoa, 'data-buoc': 0.5, 'aria-label': T('Nâng ' + ten + ' 0,5 cm', 'Raise ' + ten + ' 0.5 cm') }).prop('disabled', m.cao >= gh[1]))
        .append($('<span class="sra-lr-mien-cao"></span>').text(soViet(gh[0]) + '–' + soViet(gh[1]))));
    });
    return $s;
  }

  // Servo: hướng lắp, tay quay, cảm biến trên tay quay, thử góc
  const KIEU_TRUC = [
    { ma: 'dung', ten: T('Trục đứng', 'Vertical axis'), moTa: T('tay quay quét ngang, từ phải qua trước sang trái', 'the arm sweeps sideways, from right through front to left'), nghieng: 0, xoay: 0 },
    { ma: 'lac', ten: T('Trục nằm dọc', 'Lengthwise axis'), moTa: T('tay quay quét dọc: từ phải lên đỉnh rồi sang trái', 'the arm sweeps up: from right over the top to left'), nghieng: 90, xoay: 0 },
    { ma: 'gat', ten: T('Trục nằm ngang', 'Crosswise axis'), moTa: T('tay quay gật: từ trước lên đỉnh rồi ra sau', 'the arm nods: from front over the top to back'), nghieng: 90, xoay: 90 }
  ];
  const kieuTruc = (sv) => (KIEU_TRUC.find((k) => k.nghieng == sv.nghieng && (k.nghieng == 0 || k.xoay == sv.xoay)) || { ma: 'tuy' }).ma;
  const TEN_DIEM = T({ don: ['đầu tay'], doi: ['đầu trước', 'đầu sau'], chuThap: ['nhánh trước', 'nhánh trái', 'nhánh sau', 'nhánh phải'], dia: ['giữa đĩa'], ngang: ['bên trái', 'bên phải'] },
    { don: ['arm tip'], doi: ['front end', 'back end'], chuThap: ['front branch', 'left branch', 'back branch', 'right branch'], dia: ['disc center'], ngang: ['left side', 'right side'] });
  function veServo(banLap) {
    let sv = servoCua(self.cauHinh), c = self.cauHinh;
    let $s = $('<div class="sra-lr-servo"></div>');
    let cDc = banLap && banLap.servo ? banLap.servo.cong.replace('out', '') : 'C';
    $s.append($('<div class="sra-lr-tieu-de-nho"></div>').text(T('Servo (động cơ ' + cDc + ')', 'Servo (motor ' + cDc + ')')));
    let nut = (thuoc, chu, chon, tat, goiY) => $('<button type="button" class="sra-lr-nut-servo"></button>').attr(thuoc).text(chu)
      .toggleClass('chon', !!chon).prop('disabled', !!tat).attr('aria-pressed', chon ? 'true' : 'false').attr('title', goiY || '');
    // hướng lắp
    let kt = kieuTruc(sv);
    let $h = $('<div class="sra-lr-hang-servo" role="group"></div>').attr('aria-label', T('Hướng lắp servo', 'Servo mounting direction')).append($('<span class="sra-lr-ten-servo"></span>').text(T('Hướng', 'Axis')));
    KIEU_TRUC.forEach((k) => $h.append(nut({ 'data-servo-truc': k.ma }, k.ten, kt == k.ma, false, k.moTa)));
    $s.append($h);
    [['nghieng', T('Nghiêng', 'Tilt'), 0, 90], ['xoay', T('Xoay', 'Rotate'), -180, 180]].forEach(function(v) {
      let $t = $('<div class="sra-lr-hang-servo sra-lr-servo-tuy" role="group"></div>').attr('aria-label', v[1] + T(' hướng lắp', ' mounting'));
      $s.append($t);
      $t.append($('<span class="sra-lr-ten-servo"></span>').text(v[1]))
        .append(nut({ 'data-servo-goc': v[0], 'data-buoc': -15, 'aria-label': T('Giảm ', 'Decrease ') + v[1].toLowerCase() + ' 15°' }, '−', false, v[0] == 'nghieng' && sv[v[0]] <= v[2]))
        .append($('<output class="sra-lr-gia-tri-cao"></output>').text(soViet(sv[v[0]]) + '°'))
        .append(nut({ 'data-servo-goc': v[0], 'data-buoc': 15, 'aria-label': T('Tăng ', 'Increase ') + v[1].toLowerCase() + ' 15°' }, '+', false, v[0] == 'nghieng' && sv[v[0]] >= v[3]));
    });
    $s.append($('<p class="sra-lr-servo-mo-ta"></p>').text(moTaServo(sv)));
    // tay quay
    let $q = $('<div class="sra-lr-hang-servo" role="group" aria-label="Tay quay"></div>').append('<span class="sra-lr-ten-servo">Tay quay</span>');
    L.DS_TAY.forEach((t) => $q.append(nut({ 'data-servo-tay': t }, L.TAY[t].ten.replace('Tay ', '').replace(/^./, (a) => a.toUpperCase()), sv.tay == t)));
    $s.append($q);
    // cảm biến trên từng điểm gắn
    L.TAY[sv.tay].diem.forEach(function(d, i) {
      let $g = $('<div class="sra-lr-hang-servo" role="group"></div>').attr('aria-label', T('Cảm biến ở ', 'Sensor at ') + TEN_DIEM[sv.tay][i]).attr('data-khoa', 'servo:' + i);
      $g.append($('<span class="sra-lr-ten-servo"></span>').text(viet(TEN_DIEM[sv.tay][i])));
      [[null, T('Trống', 'Empty')], ['sieuAm', LOAI.sieuAm.ten], ['laze', LOAI.laze.ten], ['doLine', LOAI.doLine.ten], ['mauXa', T('Màu nhìn xa', 'Far color')]].forEach(function(l) {
        let dang = sv.gan[i] == l[0], lyDo = '';
        if (l[0] && !dang) {
          let gan = sv.gan.slice(); gan[i] = null;
          lyDo = L.loiGanServo(sv.tay, gan, i, l[0]) || (conLai(c, l[0]) <= 0 ? T('Trong khay không còn ', 'No more in the tray: ') + LOAI[l[0]].tenDay + '.' : '') || (!sv.gan[i] && hetO(c) ? LOI_HET_O : '');
        }
        $g.append(nut({ 'data-servo-gan': i, 'data-loai-gan': l[0] || '' }, l[1], dang, !!lyDo, lyDo));
      });
      $s.append($g);
    });
    // thử góc trên xe 3D
    let gocDang = typeof robot != 'undefined' && robot.sraServo ? Math.round(robot.sraServo.position_target) : L.SERVO.gocDau;
    $s.append($('<label class="sra-lr-hang-servo sra-lr-thu-goc"></label>').append($('<span class="sra-lr-ten-servo"></span>').text(T('Thử góc', 'Try angle')))
      .append($('<input type="range" min="0" max="180" step="5" class="sra-lr-thanh-goc">').val(gocDang).attr('aria-label', T('Thử quay servo tới góc', 'Try turning the servo to an angle')))
      .append($('<output class="sra-lr-gia-tri-cao"></output>').text(gocDang + '°')));
    return $s;
  }
  function moTaServo(sv) {
    let k = KIEU_TRUC.find((x) => x.ma == kieuTruc(sv));
    if (k) return viet(k.moTa) + '.';
    return T('Mặt quét nghiêng ' + soViet(sv.nghieng) + '°, hướng giữa hành trình (90°) xoay ' + soViet(Math.abs(sv.xoay)) + '° sang ' + (sv.xoay >= 0 ? 'trái' : 'phải') + '.', 'Sweep plane tilted ' + soViet(sv.nghieng) + '°, mid-travel direction (90°) turned ' + soViet(Math.abs(sv.xoay)) + '° ' + (sv.xoay >= 0 ? 'left' : 'right') + '.');
  }
  // Đổi servo: patch là các trường mới (nghieng, xoay, tay, gan)
  function datServo(patch, tb) {
    let c = tho(self.cauHinh), sv = servoCua(c);
    if (!sv) return null;
    Object.assign(sv, patch);
    if (patch.tay) sv.gan = L.TAY[patch.tay].diem.map((d, i) => sv.gan[i] || null).map((l, i, a) => l && !L.loiGanServo(sv.tay, a.slice(0, i).concat([null], a.slice(i + 1)), i, l) ? l : null);
    let cc = L.chuanHoaCauHinh(c);
    return { c: cc, den: 'tren:' + cc.tren.findIndex((m) => m.loai == 'servo'), tb: tb };
  }
  function bamServo(e) {
    let sv = servoCua(self.cauHinh);
    if (!sv) return false;
    if (e.getAttribute('data-servo-truc')) {
      let k = KIEU_TRUC.find((x) => x.ma == e.getAttribute('data-servo-truc'));
      apDung(datServo({ nghieng: k.nghieng, xoay: k.xoay }, T('Servo lắp ', 'Servo mounted on ') + k.ten.toLowerCase() + ': ' + k.moTa + '.'));
    } else if (e.getAttribute('data-servo-goc')) {
      let ten = e.getAttribute('data-servo-goc'), moi = sv[ten] + Number(e.getAttribute('data-buoc'));
      let p = {}; p[ten] = ten == 'nghieng' ? kep(moi, 0, 90) : moi;
      let kq = datServo(p, '');
      if (kq) kq.tb = moTaServo(servoCua(kq.c));
      apDung(kq);
    } else if (e.getAttribute('data-servo-tay')) {
      let t = e.getAttribute('data-servo-tay');
      apDung(datServo({ tay: t }, T('Đã lắp ', 'Fitted ') + L.TAY[t].ten.toLowerCase() + '.'));
    } else if (e.getAttribute('data-servo-gan') != null) {
      let i = Number(e.getAttribute('data-servo-gan')), l = e.getAttribute('data-loai-gan') || null, gan = sv.gan.slice();
      gan[i] = l;
      apDung(datServo({ gan: gan }, l ? T('Đã gắn ' + LOAI[l].tenDay + ' lên ' + TEN_DIEM[sv.tay][i] + ' của tay quay.', 'Mounted the ' + LOAI[l].tenDay + ' on the ' + TEN_DIEM[sv.tay][i] + ' of the arm.') : T('Đã tháo cảm biến ở ' + TEN_DIEM[sv.tay][i] + ' của tay quay.', 'Removed the sensor from the ' + TEN_DIEM[sv.tay][i] + ' of the arm.')));
    } else return false;
    let k = ['data-servo-truc', 'data-servo-goc', 'data-servo-tay', 'data-servo-gan'].find((a) => e.getAttribute(a) != null);
    let sel = '[' + k + '="' + e.getAttribute(k) + '"]' + (e.getAttribute('data-buoc') ? '[data-buoc="' + e.getAttribute('data-buoc') + '"]' : '') + (e.getAttribute('data-loai-gan') != null ? '[data-loai-gan="' + e.getAttribute('data-loai-gan') + '"]' : '');
    let n = $bang && $bang.find('.sra-lr-servo ' + sel)[0];
    if (n && !n.disabled) n.focus();
    return true;
  }

  // ---------- Cơ cấu công tác phía mũi ----------
  const TEN_TD = T({ tay: 'Cánh tay', truot: 'Thanh trượt', kep: 'Kẹp gắp', namCham: 'Nam châm' }, { tay: 'Arm', truot: 'Linear lift', kep: 'Gripper', namCham: 'Magnet' });
  const KIEU_CO = [
    { ma: null, ten: T('Không có', 'None') },
    { ma: 'coDinh', ten: T('Giá cố định', 'Fixed bracket'), moTa: T('Đầu công tác bắt cố định trước mũi xe, sát mặt sân.', 'The tool is fixed in front of the nose, close to the floor.') },
    { ma: 'tay1', ten: T('Cánh tay 1 đoạn', '1-segment arm'), moTa: T('Cánh tay nâng hạ quanh trục ngang, motor N20 1:298 (một cổng động cơ). Góc 0° là nằm ngang, dương là nâng lên.', 'An arm that swings up and down about a crosswise axis, N20 1:298 motor (one motor port). 0° is level, positive is up.') },
    { ma: 'tay2', ten: T('Cánh tay 2 đoạn', '2-segment arm'), moTa: T('Cần cẩu hai đoạn: khớp vai và khớp khuỷu, mỗi khớp một motor N20 1:298 (hai cổng động cơ). Góc khớp khuỷu tính so với đoạn 1.', 'A two-segment crane: shoulder and elbow joints, one N20 1:298 motor each (two motor ports). The elbow angle is measured from segment 1.') },
    { ma: 'truot', ten: T('Thanh trượt', 'Linear lift'), moTa: T('Xe trượt chạy lên xuống trên ray đứng nhờ motor N20 1:100 và bánh răng – thanh răng; vị trí đọc bằng độ của bánh răng.', 'A carriage runs up and down a vertical rail, driven by an N20 1:100 motor through a rack and pinion; position is read in pinion degrees.') }
  ];
  const maCo = (co) => !co ? null : co.loai == 'tay' ? 'tay' + (co.doan || 1) : co.loai;
  const coTuMa = (ma, cu) => !ma ? null : Object.assign({ dau: cu ? cu.dau : 'namCham', mau: cu ? cu.mau : false }, ma.indexOf('tay') == 0 ? { loai: 'tay', doan: Number(ma.slice(3)) } : { loai: ma });
  function datCo(co) {
    let c = tho(self.cauHinh);
    c.co = co;
    let cc = L.chuanHoaCauHinh(c);
    if (!co) return { c: cc, tb: T('Đã tháo cơ cấu công tác ở mũi xe.', 'Removed the front tool mechanism.') };
    if (!cc.co) {
      if (c.duoi.some((m) => m.loai == 'cham')) return { loi: T('Tấm cản của cảm biến chạm đang chiếm mũi xe. Tháo cảm biến chạm trước.', 'The touch sensor bumper takes up the nose. Remove the touch sensor first.') };
      if (co.loai == 'coDinh' && !co.dau) return { loi: T('Giá cố định cần một đầu công tác (nam châm hoặc kẹp).', 'The fixed bracket needs a tool (magnet or gripper).') };
      return { loi: LOI_HET_O };
    }
    if (L.soOCo(cc.co) < L.soOCo(co) && co.mau && !cc.co.mau) return { c: cc, tb: T('Không còn cảm biến màu hoặc ổ cắm cho cảm biến màu ở đầu cần.', 'No color sensor or socket left for the arm tip.') };
    let k = KIEU_CO.find((x) => x.ma == maCo(cc.co));
    let sa = cc.sa.find((m) => m.gia == 'truoc');
    return { c: cc, tb: T('Đã lắp ', 'Fitted ') + k.ten.toLowerCase() + (cc.co.dau ? T(' với ', ' with ') + (cc.co.dau == 'kep' ? T('kẹp gắp', 'a gripper') : T('nam châm điện', 'an electromagnet')) : '') + '. ' + k.moTa +
      (sa ? T(' Siêu âm mũi nâng lên ' + soViet(sa.cao) + ' cm để cao hơn cơ cấu.', ' The front ultrasonic was raised to ' + soViet(sa.cao) + ' cm to clear the mechanism.') : '') };
  }
  function veCoCau(banLap) {
    let c = self.cauHinh, co = c.co;
    let $s = $('<div class="sra-lr-servo sra-lr-co-cau"></div>');
    $s.append($('<div class="sra-lr-tieu-de-nho"></div>').text(T('Cơ cấu công tác ở mũi xe', 'Front tool mechanism')));
    let nut = (thuoc, chu, chon, tat, goiY) => $('<button type="button" class="sra-lr-nut-servo"></button>').attr(thuoc).text(chu)
      .toggleClass('chon', !!chon).prop('disabled', !!tat).attr('aria-pressed', chon ? 'true' : 'false').attr('title', goiY || '');
    let coCham = c.duoi.some((m) => m.loai == 'cham');
    let $h = $('<div class="sra-lr-hang-servo" role="group"></div>').attr('aria-label', T('Kiểu cơ cấu', 'Mechanism type')).append($('<span class="sra-lr-ten-servo"></span>').text(T('Kiểu', 'Type')));
    KIEU_CO.forEach((k) => $h.append(nut({ 'data-co-kieu': k.ma || '' }, k.ten, maCo(co) == k.ma, !!k.ma && coCham, coCham && k.ma ? T('Tháo cảm biến chạm trước: tấm cản chiếm mũi xe.', 'Remove the touch sensor first: its bumper takes up the nose.') : (k.moTa || ''))));
    $s.append($h);
    if (co) {
      let $d = $('<div class="sra-lr-hang-servo" role="group"></div>').attr('aria-label', T('Đầu công tác', 'Tool')).append($('<span class="sra-lr-ten-servo"></span>').text(T('Đầu', 'Tool')));
      [[null, T('Không có', 'None')], ['namCham', T('Nam châm điện', 'Electromagnet')], ['kep', T('Kẹp gắp', 'Gripper')], ['sung', T('Súng bắn bi', 'Ball launcher')]].forEach(function(d) {
        $d.append(nut({ 'data-co-dau': d[0] || '' }, d[1], co.dau == d[0], co.loai == 'coDinh' && !d[0]));
      });
      $s.append($d);
      if (co.dau == 'namCham') $s.append($('<div class="sra-lr-hang-servo" role="group"></div>').append($('<span class="sra-lr-ten-servo"></span>').text(T('Màu', 'Color')))
        .append(nut({ 'data-co-mau': co.mau ? '0' : '1' }, co.mau ? T('Có cảm biến màu ở đầu', 'Color sensor on the tool') : T('Thêm cảm biến màu ở đầu', 'Add a color sensor on the tool'), co.mau)));
      let k = KIEU_CO.find((x) => x.ma == maCo(co));
      $s.append($('<p class="sra-lr-servo-mo-ta"></p>').text(k.moTa + moTaGioiHan(banLap)));
      // thử trên xe 3D
      let r = typeof robot != 'undefined' && robot.sraTacDong ? robot.sraTacDong : [];
      r.forEach(function(td, i) {
        if (td.sraLoai == 'namCham') {
          if (td.sraMoTa.gam != null) return;
          $s.append($('<div class="sra-lr-hang-servo sra-lr-thu-goc"></div>').append($('<span class="sra-lr-ten-servo"></span>').text(T('Thử', 'Try')))
            .append(nut({ 'data-thu-nam-cham': i }, td.power ? T('Tắt nam châm', 'Magnet off') : T('Bật nam châm', 'Magnet on'), !!td.power)));
          return;
        }
        if (td.sraLoai == 'sung') {
          $s.append($('<div class="sra-lr-hang-servo sra-lr-thu-goc"></div>').append($('<span class="sra-lr-ten-servo"></span>').text(T('Thử', 'Try')))
            .append(nut({ 'data-thu-sung': i, 'data-viec': 'keo' }, T('Lên dây', 'Draw back')))
            .append(nut({ 'data-thu-sung': i, 'data-viec': 'ban' }, T('Bắn', 'Fire'))));
          return;
        }
        let ten = td.sraLoai == 'kep' ? T('Độ mở', 'Opening') : td.sraLoai == 'truot' ? T('Độ cao', 'Height') : (td.sraMoTa.khop == 2 ? T('Khuỷu', 'Elbow') : T('Vai', 'Shoulder'));
        let dv = td.sraLoai == 'truot' ? (v) => soViet(Math.round(v / td.doMoiCm * 10) / 10) + ' cm' : (v) => Math.round(v) + '°';
        let buoc = td.sraLoai == 'truot' ? Math.round(td.doMoiCm / 10) : 5;
        let v = Math.round(td.position_target);
        $s.append($('<label class="sra-lr-hang-servo sra-lr-thu-goc"></label>').append($('<span class="sra-lr-ten-servo"></span>').text(ten))
          .append($('<input type="range" class="sra-lr-thanh-co">').attr({ min: Math.ceil(td.gocMin), max: Math.floor(td.gocMax), step: buoc, 'data-thu-co': i, 'aria-label': T('Thử ', 'Try ') + ten.toLowerCase() }).val(v))
          .append($('<output class="sra-lr-gia-tri-cao"></output>').text(dv(v))));
      });
    }
    return $s;
  }
  function moTaGioiHan(banLap) {
    let ds = [];
    (banLap.vatPhu || []).forEach(function(v) {
      if (v.kep || !v.gioiHan) return;
      if (v.kieu == 'truot') ds.push(T('hành trình ' + soViet(v.gioiHan[1]) + ' cm', 'stroke ' + soViet(v.gioiHan[1]) + ' cm'));
      else ds.push((v.id == 'tay2' ? T('khuỷu ', 'elbow ') : T('vai ', 'shoulder ')) + soViet(v.gioiHan[0]) + '°…' + soViet(v.gioiHan[1]) + '°');
    });
    return ds.length ? T(' Với bản lắp này: ', ' With this build: ') + ds.join(', ') + T(' (tới đó thì đụng phần khác của xe).', ' (beyond that it hits another part of the car).') : '';
  }
  function bamCoCau(e) {
    if (e.getAttribute('data-co-kieu') != null) { apDung(datCo(coTuMa(e.getAttribute('data-co-kieu') || null, self.cauHinh.co))); return true; }
    if (e.getAttribute('data-co-dau') != null) { let co = Object.assign({}, self.cauHinh.co, { dau: e.getAttribute('data-co-dau') || null }); apDung(datCo(co)); return true; }
    if (e.getAttribute('data-co-mau') != null) { let co = Object.assign({}, self.cauHinh.co, { mau: e.getAttribute('data-co-mau') == '1' }); apDung(datCo(co)); return true; }
    if (e.getAttribute('data-thu-sung') != null) {
      let td = robot.sraTacDong[Number(e.getAttribute('data-thu-sung'))], S = L.SUNG;
      td.speed_sp = S.tocDoMotor;
      if (e.getAttribute('data-viec') == 'keo') { td.position_target = -S.keoMax; td.runToPosition(); }
      else { td.time_target = Date.now() + 200; td.runTimed(); }
      return true;
    }
    if (e.getAttribute('data-thu-nam-cham') != null) {
      let td = robot.sraTacDong[Number(e.getAttribute('data-thu-nam-cham'))];
      if (td.power) td.tat(); else td.bat();
      $(e).text(td.power ? T('Tắt nam châm', 'Magnet off') : T('Bật nam châm', 'Magnet on')).toggleClass('chon', !!td.power).attr('aria-pressed', td.power ? 'true' : 'false');
      return true;
    }
    return false;
  }

  // Chế độ đọc của mắt dò line (chung cho mọi mắt): tương tự (A0) hoặc số (D0)
  const CHE_IR = [
    { ma: 'tuongTu', ten: T('Tương tự (A0)', 'Analog (A0)'), moTa: T('Chương trình đọc mức 0–100: càng sáng càng lớn. Đèn cam trước mỗi mắt càng đậm khi tín hiệu càng mạnh.', 'The program reads 0–100: brighter means higher. The orange light in front of each sensor gets stronger with the signal.') },
    { ma: 'so', ten: T('Số (D0)', 'Digital (D0)'), moTa: T('Chương trình chỉ đọc 0 (vạch tối) hoặc 100 (nền sáng). Đèn xanh trước mỗi mắt sáng khi ngõ ra bật, tắt khi gặp vạch.', 'The program reads only 0 (dark line) or 100 (light floor). The green light in front of each sensor is on when the output is on, off over a line.') }
  ];
  function veIR() {
    let $s = $('<div class="sra-lr-ir"></div>');
    $s.append($('<div class="sra-lr-tieu-de-nho"></div>').text(T('Mắt dò line: chế độ đọc', 'Line sensor: reading mode')));
    let $h = $('<div class="sra-lr-hang-servo" role="radiogroup"></div>').attr('aria-label', T('Chế độ đọc của mắt dò line', 'Line sensor reading mode'));
    CHE_IR.forEach(function(k) {
      let chon = (self.cauHinh.ir || 'tuongTu') == k.ma;
      $h.append($('<button type="button" class="sra-lr-nut-servo" role="radio"></button>').attr('data-ir', k.ma).text(k.ten)
        .toggleClass('chon', chon).attr('aria-checked', chon ? 'true' : 'false').attr('title', k.moTa));
    });
    $s.append($h);
    $s.append($('<p class="sra-lr-servo-mo-ta"></p>').text(CHE_IR.find((k) => k.ma == (self.cauHinh.ir || 'tuongTu')).moTa));
    // Tư thế đầu đo (mắt dưới mũi và dưới gầm): nghiêng trước/sau và độ cao mặt đo so với sân
    let c = self.cauHinh, gh = L.gioiHanIR(c.nghiengIR);
    let nut = (thuoc, chu, tat) => $('<button type="button" class="sra-lr-nut-servo"></button>').attr(thuoc).text(chu).prop('disabled', !!tat);
    [['nghiengIR', T('Nghiêng', 'Tilt'), L.IR.buocNghieng, -L.IR.nghiengMax, L.IR.nghiengMax, (v) => soViet(v) + '°'],
     ['caoIR', T('Độ cao', 'Height'), 0.1, gh.caoMin, L.IR.caoMax, (v) => soViet(Math.round(v * 10)) + ' mm']].forEach(function(t) {
      let v = c[t[0]];
      $s.append($('<div class="sra-lr-hang-servo" role="group"></div>').attr('aria-label', t[1] + T(' đầu đo dò line', ' of the line sensor head'))
        .append($('<span class="sra-lr-ten-servo"></span>').text(t[1]))
        .append(nut({ 'data-ir-tu-the': t[0], 'data-buoc': -t[2], 'aria-label': T('Giảm ', 'Decrease ') + t[1].toLowerCase() }, '−', v <= t[3] + 1e-6))
        .append($('<output class="sra-lr-gia-tri-cao"></output>').text(t[5](v)))
        .append(nut({ 'data-ir-tu-the': t[0], 'data-buoc': t[2], 'aria-label': T('Tăng ', 'Increase ') + t[1].toLowerCase() }, '+', v >= t[4] - 1e-6)));
    });
    $s.append($('<p class="sra-lr-servo-mo-ta"></p>').text(moTaTuTheIR(c)));
    return $s;
  }
  function moTaTuTheIR(c) {
    let g = c.nghiengIR, cao = soViet(Math.round(c.caoIR * 10)) + ' mm';
    return T('Mặt đầu đo cách sân ' + cao + (g == 0 ? ', nhìn thẳng xuống.' : ', chúc ' + soViet(Math.abs(g)) + '° về phía ' + (g > 0 ? 'mũi' : 'đuôi') + ' xe.')
      + ' Cảm biến đọc mạnh nhất khi cách sân 2,5 mm; nghiêng đi thì ánh sáng tới sân xiên hơn nên tín hiệu yếu đi.',
      'Sensor face ' + cao + ' above the floor' + (g == 0 ? ', looking straight down.' : ', tilted ' + soViet(Math.abs(g)) + '° toward the ' + (g > 0 ? 'nose' : 'tail') + '.')
      + ' The sensor reads strongest 2.5 mm above the floor; tilting it makes the light hit the floor at a slant, so the signal gets weaker.');
  }
  function datTuTheIR(ten, buoc) {
    let c = tho(self.cauHinh);
    c[ten] = tron2(c[ten] + buoc);
    let cc = L.chuanHoaCauHinh(c);
    return { c: cc, tb: moTaTuTheIR(cc) };
  }
  function datIR(che) {
    let k = CHE_IR.find((x) => x.ma == che);
    if (!k) return null;
    let c = tho(self.cauHinh);
    c.ir = che;
    return { c: L.chuanHoaCauHinh(c), tb: T('Mắt dò line đọc ở chế độ ' + k.ten.replace(/^./, (a) => a.toLowerCase()) + '.', 'Line sensors now read in ' + k.ten + ' mode.') };
  }

  // Ô chọn màu sơn: mỗi phần một hàng, ô đầu là màu gốc
  function veSon() {
    let $s = $('<div class="sra-lr-son"></div>');
    $s.append($('<div class="sra-lr-tieu-de-nho"></div>').text(T('Sơn xe', 'Paint')));
    Object.keys(TEN_SON).forEach(function(phan) {
      let dang = self.cauHinh.son[phan] || null;
      let $h = $('<div class="sra-lr-hang-son" role="radiogroup"></div>').attr('aria-label', T('Màu ' + TEN_SON[phan].toLowerCase(), TEN_SON[phan] + ' color'));
      $h.append($('<span class="sra-lr-ten-son"></span>').text(TEN_SON[phan]));
      [null].concat(L.SON).forEach(function(mau) {
        let chon = mau == dang;
        $h.append($('<button type="button" class="sra-lr-o-son" role="radio"></button>').toggleClass('goc', !mau).toggleClass('chon', chon)
          .attr('data-son-phan', phan).attr('data-son-mau', mau || '').attr('aria-checked', chon ? 'true' : 'false')
          .attr('title', mau ? TEN_MAU[mau] : T('màu gốc', 'original color')).attr('aria-label', mau ? TEN_MAU[mau] : T('màu gốc', 'original color'))
          .css('background', mau || SON_GOC[phan]));
      });
      $s.append($h);
    });
    return $s;
  }
  // Bảng thuộc tính (học theo bảng Shape của Tinkercad): chỉ hiện thông số của thứ đang chọn.
  // Chưa chọn gì: thông số cả xe (khối lượng, cổng, sơn). Chọn một mô-đun: tên, cổng, các thông số riêng, nút Tháo.
  let klHien = null;
  function veThuocTinh(banLap, kl) {
    let $p = $('<div class="sra-lr-thuoc-tinh"></div>');
    let m = chon && layMoDun(self.cauHinh, chon);
    if (!m) {
      chon = null;
      $p.append($('<div class="sra-lr-tieu-de-tt"></div>').append($('<h3></h3>').text(T('Xe', 'Car'))))
        .append($('<p class="sra-lr-goi-y-tt"></p>').text(T('Bấm một cảm biến trên sơ đồ để xem và chỉnh thông số của nó.', 'Click a sensor on the diagram to see and change its settings.')))
        .append($('<p class="sra-lr-khoi-luong"></p>').text(T('Xe nặng ' + Math.round(kl.tong) + ' g, ' + Math.round(kl.taiBanh * 100) + ' % trọng lượng đè lên hai bánh chủ động.', 'The car weighs ' + Math.round(kl.tong) + ' g, ' + Math.round(kl.taiBanh * 100) + ' % of it on the two drive wheels.')))
        .append(veDanhSachCong(banLap), veCoCau(banLap), veSon());
      return $p;
    }
    let cb = banLap.camBien.find((x) => khoaCua(x) == chon);
    let ten = LOAI[m.loai].ten + (cb && cb.ten && m.loai != 'cham' ? ' ' + cb.ten : '');
    $p.append($('<div class="sra-lr-tieu-de-tt"></div>')
      .append($('<button type="button" class="sra-lr-ve-xe"></button>').attr('data-chon-khoa', '').text(T('← Xe', '← Car')).attr('title', T('Bỏ chọn, xem thông số cả xe', 'Deselect and show the whole car')))
      .append($('<h3></h3>').text(ten)));
    $p.append($('<p class="sra-lr-mo-ta-tt"></p>').text(m.loai == 'servo' && banLap.servo ? T('Servo SG90 trên nắp mạch chủ, động cơ ' + banLap.servo.cong.replace('out', '') + ', cắm ổ ' + banLap.servo.oMach + '.', 'SG90 servo on the main board cover, motor ' + banLap.servo.cong.replace('out', '') + ', plugged into socket ' + banLap.servo.oMach + '.') : tenMoDun(chon, banLap)));
    if (laGia(m.loai) && m.gia) $p.append(veDoCao(chon));
    if (m.loai == 'doLine') $p.append(veIR());
    if (m.loai == 'servo') $p.append(veServo(banLap));
    $p.append($('<button type="button" class="sra-lr-nut-thao sra-lr-thao-chon"></button>').attr('data-thao', chon)
      .text(m.loai == 'servo' ? T('Tháo servo (cùng cảm biến trên tay quay)', 'Remove the servo (and the sensors on its arm)') : T('Tháo ', 'Remove the ') + LOAI[m.loai].tenDay));
    return $p;
  }
  // Chọn mô-đun khoa (null: cả xe) mà không dựng lại sơ đồ, để giữ chỗ đang focus
  function datChon(khoa) {
    if (khoa && !layMoDun(self.cauHinh, khoa)) khoa = null;
    if (khoa == chon || !$bang) { chon = khoa; return; }
    chon = khoa;
    $bang.find('.sra-lr-so-do .sra-lr-mo-dun').each(function() { this.classList.toggle('dang-chon', !!khoa && this.getAttribute('data-cho') == khoa); });
    if (banLapHien) $bang.find('.sra-lr-vung-thuoc-tinh').empty().append(veThuocTinh(banLapHien, klHien));
    $bang.find('.sra-lr-xoa-chon').prop('disabled', !chon);
  }

  // Hoàn tác, làm lại: lưu cả cấu hình (nhỏ, vài trăm byte) trước mỗi lần đổi
  function ghiLichSu() {
    lichSu.push(JSON.stringify(self.cauHinh));
    if (lichSu.length > SO_BUOC_LUU) lichSu.shift();
    lamLai = [];
  }
  function quayLai(tu, sang, tb) {
    if (!tu.length || !$bang) return false;
    sang.push(JSON.stringify(self.cauHinh));
    self.cauHinh = L.chuanHoaCauHinh(JSON.parse(tu.pop()));
    luu(self.cauHinh);
    dangCam = null; chon = null;
    veLai(tb);
    henDungLai();
    return true;
  }
  this.hoanTac = function() { quayLai(lichSu, lamLai, T('Đã hoàn tác.', 'Undone.')); return self.choDungXong(); };
  this.lamLai = function() { quayLai(lamLai, lichSu, T('Đã làm lại.', 'Redone.')); return self.choDungXong(); };

  function bamThongTin(ev) {
    let c = $(ev.target).closest('[data-chon-khoa]')[0];
    if (c && !$(ev.target).closest('[data-thao]').length) {
      let k = c.getAttribute('data-chon-khoa') || null;
      datChon(k);
      let e = k && $bang.find('.sra-lr-so-do [data-cho="' + k + '"]')[0];
      if (e && e.focus) e.focus(); else { let n = $bang.find('.sra-lr-vung-thuoc-tinh h3')[0]; if (n) n.focus && n.focus(); }
      if (k) chiTiet(k);
      return;
    }
    let e = $(ev.target).closest('[data-thao], [data-son-phan], [data-cao], [data-servo-truc], [data-servo-goc], [data-servo-tay], [data-servo-gan], [data-ir], [data-ir-tu-the], [data-co-kieu], [data-co-dau], [data-co-mau], [data-thu-nam-cham], [data-thu-sung]')[0];
    if (!e) return;
    if (bamServo(e)) return;
    if (bamCoCau(e)) return;
    if (e.getAttribute('data-ir-tu-the')) {
      let ten = e.getAttribute('data-ir-tu-the'), buoc = Number(e.getAttribute('data-buoc'));
      if (apDung(datTuTheIR(ten, buoc))) {
        let n = $bang.find('[data-ir-tu-the="' + ten + '"][data-buoc="' + buoc + '"]')[0];
        if (n && !n.disabled) n.focus();
      }
      return;
    }
    if (e.getAttribute('data-ir')) {
      let che = e.getAttribute('data-ir');
      if (apDung(datIR(che))) { let n = $bang.find('[data-ir="' + che + '"]')[0]; if (n) n.focus(); }
      return;
    }
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
    if (chon && !layMoDun(self.cauHinh, chon)) chon = null;
    let sd = veSoDo(self.cauHinh, { chon: dangCam && dangCam.tu != 'khay' ? dangCam.tu : chon, dangKeo: dangCam ? dangCam.loai : null });
    banLapHien = sd.banLap; klHien = sd.kl;
    $bang.find('.sra-lr-vung-khay').empty().append(veKhay());
    $bang.find('.sra-lr-vung-so-do').empty().append(sd.svg);
    $bang.find('.sra-lr-vung-thuoc-tinh').empty().append(veThuocTinh(sd.banLap, sd.kl));
    $bang.find('.sra-lr-che-do [data-xem]').each(function() {
      let chon = (this.getAttribute('data-xem') == 'gam') == xemGam;
      this.classList.toggle('chon', chon); this.setAttribute('aria-checked', chon ? 'true' : 'false');
    });
    $bang.find('.sra-lr-hoan-tac').prop('disabled', !lichSu.length);
    $bang.find('.sra-lr-lam-lai').prop('disabled', !lamLai.length);
    $bang.find('.sra-lr-xoa-chon').prop('disabled', !chon);
    let so = tongMoDun(self.cauHinh);
    $bang.find('.sra-lr-so-o').text(so + '/' + L.SO_O + T(' ổ', ' sockets')).toggleClass('day', so >= L.SO_O)
      .attr('title', T('Đã cắm ' + so + ' trong ' + L.SO_O + ' ổ trên mạch chủ', so + ' of ' + L.SO_O + ' main board sockets in use'));
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
      if (diem && kq && kq.loi && hopVung(loai, diem.vung)) loi = laGia(loai) ? { loai: loai, gia: diem.vung.slice(4), u: diem.u, goc: 0 } : { loai: loai, x: diem.x, z: diem.vung == 'duoi' ? undefined : diem.z, goc: 0 };
      sd = veSoDo(self.cauHinh, { an: tu != 'khay' ? tu : null, dangKeo: loai, loi: loi, vungTren: diem && diem.vung });
    }
    $bang.find('.sra-lr-vung-so-do').empty().append(sd.svg);
    if (kq && kq.loi) $bang.find('.sra-lr-thong-bao').text(kq.loi).removeClass('goi-y');
    else if (kq && kq.c && !kq.khongDoi) $bang.find('.sra-lr-thong-bao').text(T('Thả ra: ', 'Release: ') + kq.tb.replace(/^Đã /, '').replace(/^./, (a) => a.toLowerCase())).removeClass('goi-y');
  }

  // Dòng chi tiết dưới sơ đồ: mô-đun đang rê chuột hoặc đang chọn bằng bàn phím
  function chiTiet(khoa) {
    if (!$bang) return;
    let t = khoa ? tenMoDun(khoa, banLapHien) : '';
    $bang.find('.sra-lr-chi-tiet').text(t || T('Rê chuột lên một cảm biến để xem cổng và vị trí.', 'Hover over a sensor to see its port and position.')).toggleClass('goi-y', !t);
    $bang.find('.sra-lr-day path').each(function() { this.classList.toggle('sang', !!khoa && this.getAttribute('data-day') == khoa); });
    $bang.find('.sra-lr-ds-cong li, .sra-lr-hang-cao, .sra-lr-hang-servo[data-khoa]').each(function() { this.classList.toggle('sang', !!khoa && this.getAttribute('data-khoa') == khoa); });
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
    if (JSON.stringify(kq.c) != JSON.stringify(self.cauHinh)) ghiLichSu();
    let cu = chon && layMoDun(self.cauHinh, chon);
    self.cauHinh = kq.c;
    if (kq.den) chon = kq.den;
    else if (kq.boChon) chon = null;
    else if (chon) { let moi = layMoDun(self.cauHinh, chon); if (!moi || !cu || moi.loai != cu.loai) chon = null; }
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
    let thu = xemGam ? ['gam'] : ['duoi', 'gia:truoc', 'gia:trai', 'gia:phai', 'gia:sau', 'tam', 'nap'];
    if (loai) thu.sort((a, b) => hopVung(loai, b) - hopVung(loai, a));
    for (let ten of thu) {
      if (!trong(ten, loai && hopVung(loai, ten) ? BIEN_HUT[ten] : 0)) continue;
      if (ten == 'duoi') return { vung: ten, x: bx / KX };
      if (ten.indexOf('gia:') == 0) return { vung: ten, u: L.GIA[ten.slice(4)].truc == 'x' ? bx : bz };
      return { vung: ten, x: bx, z: bz };
    }
    return null;
  }
  // Bước bám lưới chọn ở ô "Bám lưới" dưới sơ đồ (như ô Snap Grid góc dưới phải của Tinkercad); giữ Alt: 0,1 cm
  let buocChon = 0.5;
  const BUOC_LUOI = [0.1, 0.5, 1];
  const buocLuoi = (ev) => ev && ev.altKey ? 0.1 : buocChon;

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

  let chonLucBam = null;      // mô-đun đang chọn ngay trước cú bấm (focus từ cú bấm chuột cũng chọn mô-đun)
  function batDauKeo(ev) {
    chonLucBam = chon;
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
      let kich = { sieuAm: [5.2, 2.4], laze: [3.4, 2.4], camera: [4.0, 2.5], doLine: [1.8, 2.4], cham: [1.8, 2.4], gyro: [2.6, 3.0], gps: [3.0, 3.3], lidar: [4.3, 4.3], servo: [2.6, 3.6] }[keo.loai] || [3.0, 3.0];
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
    if (!diem) $bang.find('.sra-lr-thong-bao').text(keo.tu != 'khay' && !trongBang(ev) ? T('Thả ra: tháo ' + LOAI[keo.loai].tenDay + ' khỏi xe.', 'Release: remove the ' + LOAI[keo.loai].tenDay + ' from the car.') : GOI_Y).toggleClass('goi-y', !(keo.tu != 'khay' && !trongBang(ev)));
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
      $bang.find('.sra-lr-thong-bao').text(T('Thả ra: siêu âm ', 'Release: ultrasonic ') + L.GIA[m.gia].ten + ' ' + moTaGoc(m.goc) + T('. Giữ Shift để bám 45°.', '. Hold Shift to snap to 45°.')).removeClass('goi-y');
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
    // mô-đun đã gắn: bấm lần đầu là chọn (bảng thuộc tính hiện thông số), bấm lại lần nữa mới cầm lên để dời
    if (n && n.tu != 'khay' && n.tu != chonLucBam) { chonLucBam = n.tu; datChon(n.tu); chiTiet(n.tu); $bang.find('.sra-lr-thong-bao').text(T('Đã chọn ', 'Selected the ') + LOAI[n.loai].tenDay + T('. Kéo để dời, bấm lần nữa để cầm lên.', '. Drag to move it, click again to pick it up.')).removeClass('goi-y'); return; }
    if (n) { dangCam = { loai: n.loai, tu: n.tu }; veLai(loiCam(n)); return; }
    if (!$(ev.target).closest('.sra-lr-vung-so-do').length) return;
    let diem = diemTai(ev.clientX, ev.clientY);
    chon = null;       // bấm chỗ trống trên sơ đồ: bỏ chọn, bảng thuộc tính về thông số cả xe (như Tinkercad)
    veLai(diem ? T('Vùng này là ' + TEN_VUNG[diem.vung] + '. Kéo một cảm biến từ khay vào đây.', 'This area is the ' + TEN_VUNG[diem.vung] + '. Drag a sensor from the tray here.') : '');
  }
  const loiCam = (n) => T('Đang cầm ', 'Holding the ') + LOAI[n.loai].tenDay + T('. Bấm vào ', '. Click the ') + (xemGam && n.loai == 'doLine' ? TEN_VUNG.gam : TEN_VUNG[LOAI[n.loai].vung]) + T(' (được tô sáng) để đặt', ' (highlighted) to place it') + (n.tu != 'khay' ? T(', hoặc bấm vào khay để tháo.', ', or click the tray to remove it.') : '.') +
    (n.loai == 'doLine' && !xemGam ? T(' Muốn gắn dưới gầm thì bấm "Nhìn gầm xe".', ' To mount it under the car, press "Underside view".') : '');

  function phim(ev) {
    let e = ev.target, khoa = e.getAttribute && e.getAttribute('data-cho'), loai = e.getAttribute && e.getAttribute('data-loai');
    // Ctrl+Z hoàn tác, Ctrl+Y hoặc Ctrl+Shift+Z làm lại (Cmd trên máy Mac); chặn lại để Blockly không hoàn tác chương trình
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && /^[zZyY]$/.test(ev.key)) {
      ev.preventDefault(); ev.stopPropagation();
      if (keo || xoay) return;
      if (/^[yY]$/.test(ev.key) || ev.shiftKey) quayLai(lamLai, lichSu, T('Đã làm lại.', 'Redone.'));
      else quayLai(lichSu, lamLai, T('Đã hoàn tác.', 'Undone.'));
      let n = $bang && $bang.find('.sra-lr-cong-cu button:not(:disabled)')[0];
      if (n && !$.contains($bang[0], document.activeElement)) n.focus();
      return;
    }
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
    if ((ev.key == 'PageUp' || ev.key == 'PageDown') && laGia(loai) && /^sa:/.test(khoa)) {
      ev.preventDefault();
      let m = layMoDun(self.cauHinh, khoa), kq = datCao(khoa, m.cao + (ev.key == 'PageUp' ? 1 : -1) * buocLuoi(ev));
      if (kq) apDung(kq, true);
      return;
    }
    let b = buocLuoi(ev), d = { ArrowLeft: [-b, 0], ArrowRight: [b, 0], ArrowUp: [0, b], ArrowDown: [0, -b] }[ev.key];
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
      // thanh thử của cơ cấu đọc động cơ trên xe 3D vừa dựng
      if ($bang && self.cauHinh.co) $bang.find('.sra-lr-co-cau').replaceWith(veCoCau(banLapHien));
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
    let hep = rong > 0 && rong < 960;
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
      lichSu = []; lamLai = []; chon = null;
      $bang = $(
        '<section class="sra-lr-bang" aria-label="' + T('Bảng lắp ráp xe', 'Car builder') + '">' +
          '<header><h2>' + T('Lắp ráp xe', 'Build car') + '</h2><span class="sra-lr-so-o"></span><button type="button" class="sra-lr-dong" aria-label="' + T('Đóng bảng lắp ráp', 'Close car builder') + '">&times;</button></header>' +
          '<div class="sra-lr-cong-cu" role="toolbar" aria-label="' + T('Thanh công cụ lắp ráp', 'Builder toolbar') + '">' +
            '<button type="button" class="sra-lr-hoan-tac" title="' + T('Hoàn tác (Ctrl+Z)', 'Undo (Ctrl+Z)') + '" aria-label="' + T('Hoàn tác', 'Undo') + '">↶</button>' +
            '<button type="button" class="sra-lr-lam-lai" title="' + T('Làm lại (Ctrl+Y)', 'Redo (Ctrl+Y)') + '" aria-label="' + T('Làm lại', 'Redo') + '">↷</button>' +
            '<div class="sra-lr-che-do" role="radiogroup" aria-label="' + T('Hướng nhìn sơ đồ', 'Diagram view') + '">' +
              '<button type="button" role="radio" data-xem="tren">' + T('Nhìn từ trên', 'Top view') + '</button><button type="button" role="radio" data-xem="gam">' + T('Nhìn gầm xe', 'Underside view') + '</button></div>' +
            '<button type="button" class="sra-lr-xoa-chon" title="' + T('Tháo cảm biến đang chọn (Delete)', 'Remove the selected sensor (Delete)') + '" aria-label="' + T('Tháo cảm biến đang chọn', 'Remove the selected sensor') + '">' +
              '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 4h10M6.5 4V2.5h3V4M4.5 4l.7 9.5h5.6l.7-9.5M7 6.5v5M9 6.5v5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
            '<button type="button" class="sra-lr-mac-dinh">' + T('Về mặc định', 'Reset to default') + '</button>' +
            '<button type="button" class="sra-lr-thao-het">' + T('Tháo hết cảm biến', 'Remove all sensors') + '</button>' +
          '</div>' +
          '<div class="sra-lr-than">' +
            '<div class="sra-lr-cot sra-lr-cot-so-do">' +
              '<div class="sra-lr-vung-so-do"></div>' +
              '<div class="sra-lr-duoi-so-do"><p class="sra-lr-chi-tiet" aria-live="polite"></p>' +
                '<label class="sra-lr-buoc">' + T('Bám lưới', 'Snap grid') + ' <select class="sra-lr-chon-buoc">' + BUOC_LUOI.map((b) => '<option value="' + b + '"' + (b == buocChon ? ' selected' : '') + '>' + soViet(b) + ' cm</option>').join('') + '</select></label></div></div>' +
            '<div class="sra-lr-cot sra-lr-cot-tt">' +
              '<p class="sra-lr-thong-bao" role="status" aria-live="polite"></p>' +
              '<div class="sra-lr-vung-thuoc-tinh" role="region" aria-label="' + T('Thông số của thứ đang chọn', 'Settings of the selection') + '"></div></div>' +
            '<div class="sra-lr-cot sra-lr-cot-khay"><div class="sra-lr-vung-khay"></div></div>' +
          '</div>' +
        '</section>');
      $('#simPanel').append($bang);
      datBoCuc();
      $bang.on('pointerdown', batDauKeo);
      $bang.on('click', '.sra-lr-vung-khay, .sra-lr-vung-so-do', bam);
      $bang.on('click', '.sra-lr-vung-thuoc-tinh', bamThongTin);
      $bang.find('.sra-lr-hoan-tac').on('click', function() { quayLai(lichSu, lamLai, T('Đã hoàn tác.', 'Undone.')); let n = $bang.find(this.disabled ? '.sra-lr-lam-lai' : '.sra-lr-hoan-tac')[0]; if (n) n.focus(); });
      $bang.find('.sra-lr-xoa-chon').on('click', function() { if (chon) apDung(thao(chon)); });
      $bang.find('.sra-lr-chon-buoc').on('change', function() {
        buocChon = Number(this.value) || 0.5;
        $bang.find('.sra-lr-thong-bao').text(T('Kéo thả và phím mũi tên giờ bám lưới ' + soViet(buocChon) + ' cm.', 'Dragging and arrow keys now snap to ' + soViet(buocChon) + ' cm.')).removeClass('goi-y');
      });
      $bang.find('.sra-lr-lam-lai').on('click', function() { quayLai(lamLai, lichSu, T('Đã làm lại.', 'Redone.')); let n = $bang.find('.sra-lr-lam-lai:not(:disabled), .sra-lr-hoan-tac')[0]; if (n) n.focus(); });
      $bang.on('input', '.sra-lr-thanh-goc', function() {
        let g = Number(this.value);
        $(this).next('output').text(g + '°');
        if (typeof robot != 'undefined' && robot.sraServo) robot.sraServo.quayToi(g);
      });
      $bang.on('input', '.sra-lr-thanh-co', function() {
        let td = typeof robot != 'undefined' && robot.sraTacDong && robot.sraTacDong[Number(this.getAttribute('data-thu-co'))];
        if (!td) return;
        let g = Number(this.value);
        $(this).next('output').text(td.sraLoai == 'truot' ? soViet(Math.round(g / td.doMoiCm * 10) / 10) + ' cm' : g + '°');
        td.quayToi(g);
      });
      $bang.on('pointermove', rePhuot);
      $bang.on('pointerleave', function() { if (!keo && !xoay && dangCam) veThu(null, dangCam.loai, dangCam.tu, null); });
      $bang.on('focusin', function(e) { let k = e.target.getAttribute && e.target.getAttribute('data-cho'); if (k && e.target.getAttribute('data-loai') && !e.target.getAttribute('data-tu')) { datChon(k); chiTiet(k); } });
      $bang.on('keydown', phim);
      $bang.on('dragstart', (e) => e.preventDefault());
      $bang.find('.sra-lr-dong').on('click', self.dong);
      $bang.find('.sra-lr-che-do').on('click', '[data-xem]', function() { self.xemGam(this.getAttribute('data-xem') == 'gam'); });
      $bang.find('.sra-lr-mac-dinh').on('click', function() {
        apDung({ c: L.chuanHoaCauHinh({}), boChon: true, tb: T('Đã đưa xe về bản lắp mặc định. Bấm ↶ để hoàn tác.', 'The car is back to the default build. Press ↶ to undo.') }); xoaLuu();
      });
      $bang.find('.sra-lr-thao-het').on('click', function() {
        apDung({ c: L.chuanHoaCauHinh({ sa: [], duoi: [], tren: [], gam: [], son: self.cauHinh.son, ir: self.cauHinh.ir, nghiengIR: self.cauHinh.nghiengIR, caoIR: self.cauHinh.caoIR }), boChon: true, tb: T('Đã tháo hết cảm biến. Bấm ↶ để hoàn tác.', 'Removed all sensors. Press ↶ to undo.') });
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
  //   SRABangLapRap.chon('sa:trai')          chọn một mô-đun (bảng thuộc tính hiện thông số của nó); null: cả xe
  this.chon = function(khoa) { datChon(khoa || null); return chon; };
  this.dangChon = () => chon;
  //   SRABangLapRap.xemGam(true)            sơ đồ nhìn gầm xe (gắn mắt dò line dưới gầm), máy quay xuống dưới gầm
  this.xemGam = function(bat) {
    bat = !!bat;
    if (bat == xemGam) return;
    xemGam = bat;
    dangCam = null;
    veLai(bat ? T('Đang nhìn gầm xe từ dưới lên. Kéo mắt dò line vào vùng dưới tấm đáy.', 'Viewing the underside from below. Drag line sensors into the area under the base plate.') : '');
    gocNhin();
  };
  this.dangXemGam = () => xemGam;
  //   SRABangLapRap.cao(9, 'sa:trai')          đặt tâm siêu âm bên trái cao 9 cm so với mặt sân
  this.cao = function(cao, khoa) { apDung(datCao(khoa || 'sa:truoc', cao)); return self.choDungXong(); };
  this.xoay = function(goc, khoa) { apDung(datGoc(khoa || 'sa:truoc', goc)); return self.choDungXong(); };
  //   SRABangLapRap.son('khung', '#c62828')    sơn khung xe; mau null là màu gốc
  this.son = function(phan, mau) { apDung(datSon(phan, mau)); return self.choDungXong(); };
  this.cheIR = function(che) { apDung(datIR(che)); return self.choDungXong(); };
  // co: { loai: 'coDinh' | 'tay' | 'truot', doan, dau: 'namCham' | 'kep' | null, mau } hoặc null để tháo
  this.coCau = function(co) { let kq = datCo(co); apDung(kq); return self.choDungXong().then(() => kq); };
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
