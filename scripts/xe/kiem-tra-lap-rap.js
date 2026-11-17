// Kiểm tra bảng lắp ráp kéo thả của xe lắp mô-đun.
// Phần 1 (không cần trình duyệt): mọi bản lắp có thể tạo ra từ bảng (cả kiểu 5 lỗ cũ lẫn đặt tự do trên lưới 0,5 cm)
// đều dựng được, cổng liền nhau, dây không bắt chéo, không mô-đun nào chồng lên nhau.
// Phần 2 (trình duyệt): kéo thả bằng chuột (bám lưới, hút, đổi chỗ, xem trước), núm xoay, bấm chọn, bàn phím;
// xe 3D và cảm biến đổi theo; cấu hình được lưu lại.
// Chạy: node scripts/xe/kiem-tra-lap-rap.js [thư-mục-lưu-ảnh]
const path = require('path');
const { mo, napXe, BaoCao } = require('./chung.js');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');
const H = require('../../public/san-robot-ao/xe/hinh-khoi.js');

function hopBao(k) {      // hộp bao theo trục của một khối đã chuẩn hoá
  let r = k.k == 'hop' ? k.kt.map((x) => x / 2) : (k.k == 'cau' ? [k.d / 2, k.d / 2, k.d / 2] : [k.d / 2, k.h / 2, k.d / 2]);
  let goc = [];
  for (let i = 0; i < 8; i++) goc.push(H.V.cong(k.vt, H.Q.quay(k.q, [(i & 1 ? 1 : -1) * r[0], (i & 2 ? 1 : -1) * r[1], (i & 4 ? 1 : -1) * r[2]])));
  return [0, 1, 2].map((j) => [Math.min(...goc.map((p) => p[j])), Math.max(...goc.map((p) => p[j]))]);
}

// Kiểm tra va chạm giữa thân các mô-đun cảm biến (không kể dây) của một bản lắp; trả về danh sách lỗi
function lanNhau(b, ten) {
  let loi = [];
  let mod = b.than.filter((ct) => ['doLine', 'cham', 'sieuAm', 'gyro', 'gps'].indexOf(ct.nhom) >= 0);
  for (let i = 0; i < mod.length; i++) for (let j = i + 1; j < mod.length; j++) {
    if (mod[i].nhom == mod[j].nhom && mod[i].nhom != 'doLine') continue;
    for (const a of mod[i].khoi) for (const c of mod[j].khoi) {
      let A = hopBao(a), C = hopBao(c);
      if ([0, 1, 2].every((t) => A[t][0] < C[t][1] - 0.01 && C[t][0] < A[t][1] - 0.01)) loi.push(mod[i].id + ' lấn vào ' + mod[j].id + ': ' + ten);
    }
  }
  return loi;
}

// Đặt tự do: mọi vị trí trên lưới 0,5 cm mà bảng cho phép đều dựng được và không mô-đun nào lấn nhau
function phanTuDo(bc) {
  let soBan = 0, loi = [];
  const thu = (cv, ten) => {
    soBan++;
    try {
      let b = L.lapXe(cv), kl = L.tinhXe(b), c = b.cauHinh;
      if (JSON.stringify(L.chuanHoaCauHinh(c)) != JSON.stringify(c)) loi.push('chuẩn hoá hai lần ra khác nhau: ' + ten);
      if (!b.camBien.every((x, i) => x.cong == 'in' + (i + 1))) loi.push('cổng không liền nhau: ' + ten);
      let o = b.camBien.map((x) => x.oMach);
      if (new Set(o).size != o.length) loi.push('hai cảm biến chung một ổ: ' + ten);
      // mô-đun dưới mũi cắm ổ theo thứ tự trái sang phải (dây không bắt chéo)
      let od = b.camBien.filter((x) => x.duoi != null).sort((p, q) => p.x - q.x).map((x) => x.oMach);
      if (od.some((v, i) => i && v <= od[i - 1])) loi.push('dây dưới mũi bắt chéo: ' + ten);
      if (!isFinite(kl.tong) || !kl.tam.every(isFinite)) loi.push('khối lượng lạ: ' + ten);
      loi = loi.concat(lanNhau(b, ten));
      return c;
    } catch (e) { loi.push('không dựng được ' + ten + ': ' + e.message); }
  };
  // 3 mắt dò line ở mọi bộ vị trí trên lưới 0,5 cm, kèm cảm biến chạm ở chỗ trống đầu tiên
  let xs = []; for (let x = -3.5; x <= 3.5 + 1e-9; x += 0.5) xs.push(Math.round(x * 10) / 10);
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) for (let k = j + 1; k < xs.length; k++) {
    let mat = [xs[i], xs[j], xs[k]];
    if (mat[1] - mat[0] < 1.5 || mat[2] - mat[1] < 1.5) continue;
    let duoi = mat.map((x) => ({ loai: 'doLine', x: x }));
    let xc = xs.find((x) => Math.abs(x) <= 3 && mat.every((m) => Math.abs(m - x) >= 1.5));
    if (xc != null) duoi.push({ loai: 'cham', x: xc });
    let c = thu({ duoi: duoi }, JSON.stringify(duoi));
    let hopLe = mat.every((x) => Math.abs(x) <= L.X_DUOI.doLine);
    if (c && hopLe && c.duoi.length != duoi.length) loi.push('bỏ mất mô-đun hợp lệ: ' + JSON.stringify(duoi));
    if (c && !hopLe && c.duoi.some((m) => Math.abs(m.x) > L.X_DUOI[m.loai])) loi.push('giữ mô-đun ra ngoài thanh: ' + JSON.stringify(duoi));
  }
  // siêu âm: mọi góc (bước 15°) và x ở hai mép giá
  for (let g = -45; g <= 45; g += 15) for (const s of [-1, 0, 1]) {
    let x = s * L.gioiHanSieuAmX(g);
    let c = thu({ sieuAmGoc: g, sieuAmX: x }, 'siêu âm ' + g + '° x = ' + x);
    if (c && (c.sieuAmGoc != g || Math.abs(c.sieuAmX - x) > 1e-6)) loi.push('siêu âm bị đổi vị trí: ' + g + '°, ' + x);
  }
  // siêu âm trên từng giá trái, phải, sau (cùng giá trước), mọi góc bước 15°, u ở hai đầu và giữa khoảng trượt
  for (const gia of ['trai', 'phai', 'sau']) for (let g = -45; g <= 45; g += 15) {
    let gh = L.gioiHanU(gia, g);
    for (const u of [gh[0], (gh[0] + gh[1]) / 2, gh[1]]) {
      let c = thu({ sa: [{ gia: 'truoc' }, { gia: gia, u: u, goc: g }] }, 'siêu âm ' + gia + ' ' + g + '° u = ' + u);
      if (c && c.sa.length != 2) loi.push('bỏ mất siêu âm ' + gia);
    }
  }
  // đủ 4 siêu âm cùng xoay 45° (cùng chiều và ngược chiều), kèm 2 mắt dò line, chạm, gyro: vừa đủ 8 ổ
  for (const g of [-45, 45]) for (const s of [1, -1]) {
    let sa = L.DS_GIA.map((gia, i) => ({ gia: gia, u: L.gioiHanU(gia, g)[i % 2], goc: (i % 2 ? s : 1) * g }));
    let c = thu({ sa: sa, tren: [{ loai: 'gyro', x: -3 }] }, '4 siêu âm ' + JSON.stringify(sa));
    if (c && (c.sa.length != 4 || c.duoi.length + c.tren.length + c.sa.length != 8)) loi.push('4 siêu âm không đủ: ' + JSON.stringify(c.sa));
  }
  // gyro, GPS: mọi vị trí trên lưới 0,5 cm trong miền cho phép, từng cặp không chồng nhau
  let diem = (loai) => { let m = L.mienNap(loai), ds = []; for (let x = Math.ceil(m.x0 * 2) / 2; x <= m.x1 + 1e-9; x += 0.5) for (let z = Math.ceil(m.z0 * 2) / 2; z <= m.z1 + 1e-9; z += 0.5) ds.push({ loai: loai, x: x, z: z }); return ds; };
  let dg = diem('gyro'), dp = diem('gps'), soCap = 0;
  for (const a of dg) for (const b of dp) {
    if (L.chongNap(a, b)) continue;
    soCap++;
    let c = thu({ tren: [a, b] }, 'nắp ' + JSON.stringify([a, b]));
    if (c && c.tren.length != 2) loi.push('bỏ mất mô-đun trên nắp: ' + JSON.stringify([a, b]));
  }
  // chỗ không hợp lệ thì bị bỏ
  let c = L.chuanHoaCauHinh({ duoi: [{ loai: 'doLine', x: 0 }, { loai: 'doLine', x: 1 }, { loai: 'cham', x: 3.5 }], tren: [{ loai: 'gyro', x: 0, z: 4 }, { loai: 'gps', x: 1, z: 4 }] });
  bc.dong(loi.length == 0, soBan + ' bản lắp đặt tự do (' + soCap + ' cặp vị trí gyro, GPS) đều dựng được, mô-đun không lấn nhau, dây không bắt chéo', loi.length ? loi.slice(0, 4).join(' | ') : '');
  let c9 = L.chuanHoaCauHinh({ sa: L.DS_GIA.map((g) => ({ gia: g })) });
  bc.dong(c9.sa.length == 3 && c9.sa.length + c9.duoi.length + c9.tren.length == 8, 'Bản mặc định thêm 4 siêu âm (9 cảm biến): bỏ bớt siêu âm sau cho vừa 8 ổ', c9.sa.map((m) => m.gia).join());
  bc.dong(c.duoi.length == 1 && c.tren.length == 1, 'Mắt cách nhau dưới 1,5 cm, cảm biến chạm ra ngoài 3 cm, hai mô-đun chồng nhau trên nắp: bị bỏ', JSON.stringify([c.duoi, c.tren]));
}

function phanMot(bc) {
  console.log('1. Mọi bản lắp tạo được từ bảng');
  let soBan = 0, loi = [], klMin = Infinity, klMax = 0;
  const giaTri = [null, 'doLine', 'cham'];
  const dsNap = [[null, null], ['gyro', null], [null, 'gyro'], ['gps', null], [null, 'gps'], ['gyro', 'gps'], ['gps', 'gyro']];
  for (let m = 0; m < 243; m++) {
    let lo = [], n = m;
    for (let i = 0; i < 5; i++) { lo.push(giaTri[n % 3]); n = Math.floor(n / 3); }
    if (lo.filter((v) => v == 'doLine').length > 3 || lo.filter((v) => v == 'cham').length > 1) continue;
    for (const nap of dsNap) for (const sieuAm of [false, true]) {
      soBan++;
      let ten = JSON.stringify({ sieuAm, lo, nap });
      try {
        let b = L.lapXe({ sieuAm, lo, nap }), kl = L.tinhXe(b);
        klMin = Math.min(klMin, kl.tong); klMax = Math.max(klMax, kl.tong);
        if (JSON.stringify(b.cauHinh.lo) != JSON.stringify(lo) || JSON.stringify(b.cauHinh.nap) != JSON.stringify(nap)) loi.push('cấu hình bị đổi: ' + ten);
        // lắp lại từ cấu hình đã chuẩn hoá phải ra đúng xe đó
        if (JSON.stringify(L.lapXe(b.cauHinh).cauHinh) != JSON.stringify(b.cauHinh)) loi.push('chuẩn hoá hai lần ra khác nhau: ' + ten);
        if (!b.camBien.every((c, i) => c.cong == 'in' + (i + 1))) loi.push('cổng không liền nhau: ' + ten);
        let o = b.camBien.map((c) => c.oMach);
        if (new Set(o).size != o.length || o.some((x) => !(x >= 1 && x <= 8))) loi.push('hai cảm biến chung một ổ: ' + ten);
        if (!(kl.tong > 400 && kl.tong < 600) || !isFinite(kl.than.m) || !kl.tam.every(isFinite)) loi.push('khối lượng lạ: ' + ten);
        // thân các mô-đun cảm biến (không kể dây) không được lấn vào nhau
        loi = loi.concat(lanNhau(b, ten));
      } catch (e) { loi.push('không dựng được ' + ten + ': ' + e.message); }
    }
  }
  bc.dong(loi.length == 0, soBan + ' bản lắp đều dựng được, cổng liền nhau, mỗi cảm biến một ổ, mô-đun không lấn nhau', loi.length ? loi.slice(0, 4).join(' | ') : 'xe nặng từ ' + klMin.toFixed(0) + ' đến ' + klMax.toFixed(0) + ' g');

  let c = L.chuanHoaCauHinh({ doLine: 3, cachMat: 1.5 });
  bc.dong(JSON.stringify(c.lo) == JSON.stringify([null, 'doLine', 'doLine', 'doLine', 'cham']), 'Kiểu viết cũ doLine: 3, cachMat: 1,5 thành 3 lỗ giữa', JSON.stringify(c.lo));
  c = L.chuanHoaCauHinh({ doLine: 2, cachMat: 2 });
  bc.dong(c.lo === null && c.cachMat == 2 && L.lapXe(c).camBien.filter((x) => x.loai == 'doLine').map((x) => x.x).join() == '-1,1', 'Hai mắt cách nhau 2 cm (lệch lỗ) vẫn lắp đúng chỗ', 'lo = ' + c.lo);
  c = L.chuanHoaCauHinh({ lo: ['doLine', 'doLine', 'doLine', 'doLine', 'cham'], nap: ['gyro', 'gyro'] });
  bc.dong(c.doLine == 3 && c.lo[3] === null && c.nap[1] === null, 'Quá số lượng thì bỏ bớt: 4 mắt còn 3, 2 gyro còn 1', JSON.stringify([c.lo, c.nap]));
  phanTuDo(bc);
  c = L.chuanHoaCauHinh({});
  bc.dong(c.doLine == 2 && c.cachMat == 3 && c.cham && c.sieuAm && c.gyro && c.gps, 'Bản mặc định: 2 mắt cách 3 cm, chạm, siêu âm, gyro, GPS', JSON.stringify(c.lo));
}

(async () => {
  const bc = new BaoCao();
  const thuMucAnh = process.argv[2];
  phanMot(bc);

  console.log('2. Kéo thả trong trình duyệt');
  const { browser, page } = await mo({ viewport: { width: 1280, height: 760 }, dsf: thuMucAnh ? 2 : 1 });
  await page.evaluate(() => localStorage.removeItem('sanRobotAo.xeLapRap'));
  await napXe(page);
  const chup = async (ten) => { if (thuMucAnh) await page.screenshot({ path: path.join(thuMucAnh, ten + '.png') }); };
  const tam = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const trangThai = () => page.evaluate(() => ({
    c: SRABangLapRap.cauHinh, tb: $('.sra-lr-thong-bao').text(),
    cb: robot.components.map((c) => c.port + ':' + c.type).join(' '),
    kl: Math.round(robot.sraKhoiLuong.tong), klBang: $('.sra-lr-khoi-luong').text(),
    luoi: robot.sraBanLap.than.map((ct) => ct.id).join(' '), soKhoi: robot.sraBanLap.than.reduce((s, ct) => s + ct.khoi.length, 0),
    luu: localStorage.getItem('sanRobotAo.xeLapRap')
  }));
  const keo = async (tu, den) => {
    const a = typeof tu == 'string' ? await tam(tu) : tu, b = typeof den == 'string' ? await tam(den) : den;
    await page.mouse.move(a[0], a[1]); await page.mouse.down();
    await page.mouse.move(a[0] + 8, a[1] + 8, { steps: 3 }); await page.mouse.move(b[0], b[1], { steps: 8 });
    await page.mouse.up();
    await page.evaluate(() => SRABangLapRap.choDungXong());
    await page.waitForFunction(() => robot.sraVatLi && robot.sraVatLi.thoiGian > 0.2, null, { timeout: 30000 });
    return trangThai();
  };

  const diem = (d) => page.evaluate((d) => SRABangLapRap.toaDoManHinh(d), d);
  const soModun = () => page.locator('.sra-lr-so-do .sra-lr-mo-dun:not(.loi)').count();
  const xDuoi = (c) => c.duoi.map((m) => m.loai[0] + m.x).join(' ');

  // mở từ menu Robot
  await page.click('.menuItem.robotMenu');
  await page.locator('.robotMenuDropDown li', { hasText: 'Lắp ráp xe' }).click();
  await page.waitForSelector('.sra-lr-bang');
  await page.waitForTimeout(800);
  let t = await trangThai();
  bc.dong(await soModun() == 6 && t.klBang.indexOf(t.kl + ' g') >= 0, 'Mở bảng từ menu Robot: thấy 6 cảm biến đang gắn, khối lượng trên bảng khớp xe 3D', t.klBang);
  await chup('bang-lap-rap-mac-dinh');

  t = await keo('.sra-lr-the[data-loai=doLine]', await diem({ vung: 'duoi', x: 0.1 }));
  bc.dong(t.c.doLine == 3 && t.cb == 'in1:ColorSensor in2:ColorSensor in3:ColorSensor in4:UltrasonicSensor in5:TouchSensor in6:GyroSensor in7:GPSSensor' && t.luoi.indexOf('doLine3') >= 0,
    'Kéo mắt dò line thứ ba từ khay vào giữa thanh (bám lưới về x = 0): xe có 3 mắt, 7 cổng', xDuoi(t.c));
  bc.dong(await page.locator('.sra-lr-the[data-loai=doLine]').isDisabled(), 'Khay hết mắt dò line thì thẻ bị khoá');

  // đang kéo: sơ đồ vẽ trước kết quả, chưa đổi cấu hình
  let a = await diem({ vung: 'duoi', x: 0 }), b = await diem({ vung: 'duoi', x: -2.6 });
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  await page.mouse.move(a[0] - 8, a[1], { steps: 3 }); await page.mouse.move(b[0], b[1], { steps: 8 });
  await page.waitForTimeout(150);
  let dangKeo = await page.evaluate(() => ({ xt: $('.sra-lr-so-do .sra-lr-mo-dun.xem-truoc').length, tb: $('.sra-lr-thong-bao').text(), c: SRABangLapRap.cauHinh.duoi.map((m) => m.x).join(), vung: $('.sra-lr-vung.nhan-duoc').length }));
  await chup('bang-lap-rap-dang-keo');
  await page.mouse.up();
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(dangKeo.xt >= 1 && /^Thả ra/.test(dangKeo.tb) && dangKeo.c == '-1.5,0,1.5,3' && dangKeo.vung == 1, 'Đang kéo: bóng mờ ở chỗ sẽ đặt, thanh dưới mũi được tô sáng, cấu hình chưa đổi', dangKeo.tb);
  bc.dong(xDuoi(t.c) == 'd-3 d-1.5 d1.5 c3', 'Thả mắt dò line ở x = −2,6 cm (quá gần mắt bên cạnh): tự hút tới chỗ trống gần nhất x = −3 cm', xDuoi(t.c));

  t = await keo('[data-cho="duoi:2"]', await diem({ vung: 'duoi', x: 1.1 }));
  let thuoc = await page.locator('.sra-lr-thuoc text').allTextContents();
  let xMat = await page.evaluate(() => robot.sraBanLap.camBien.filter((c) => c.loai == 'doLine').map((c) => c.x).join());
  bc.dong(xDuoi(t.c) == 'd-3 d-1.5 d1 c3' && xMat == '-3,-1.5,1' && thuoc.join('|') == '1,5 cm|2,5 cm|2 cm',
    'Kéo mắt phải tới x = 1,1 cm: bám lưới về 1 cm, xe 3D dời mắt theo, thước đo ghi 1,5 / 2,5 / 2 cm', thuoc.join(' | '));

  t = await keo('[data-cho="duoi:0"]', '[data-cho="duoi:3"]');
  bc.dong(xDuoi(t.c) == 'c-3 d-1.5 d1 d3' && t.cb.indexOf('in4:UltrasonicSensor in5:TouchSensor') >= 0, 'Thả mắt dò line lên cảm biến chạm: hai mô-đun đổi chỗ', xDuoi(t.c));

  let truoc = JSON.stringify(t.c);
  t = await keo('[data-cho="tren:1"]', await diem({ vung: 'duoi', x: 0 }));
  bc.dong(JSON.stringify(t.c) == truoc && /chỉ gắn được/.test(t.tb), 'Kéo GPS vào thanh dưới mũi: không nhận, có lời giải thích', t.tb);

  t = await keo('[data-cho="tren:1"]', await diem({ vung: 'nap', x: 0.6, z: 5.2 }));
  bc.dong(t.c.tren[1].loai == 'gps' && t.c.tren[1].x == 0.5 && t.c.tren[1].z == 5,
    'Kéo GPS trên nắp tới (0,6; 5,2): bám lưới về (0,5; 5)', JSON.stringify(t.c.tren[1]));

  t = await keo(await diem({ vung: 'gia:truoc', u: 0 }), [900, 420]);
  bc.dong(!t.c.sieuAm && t.cb.indexOf('Ultrasonic') < 0 && t.luoi.indexOf('sieuAm') < 0, 'Kéo siêu âm ra ngoài bảng: tháo khỏi xe, mô-đun và giá biến mất', t.kl + ' g');
  await chup('bang-lap-rap-da-doi');

  // bấm chọn rồi bấm vào vùng gắn
  await page.click('.sra-lr-the[data-loai=sieuAm]');
  let sang = await page.evaluate(() => $('.sra-lr-vung.nhan-duoc').attr('data-vung') + ' ' + $('.sra-lr-vung.nhan-duoc').length);
  await chup('bang-lap-rap-dang-cam');
  let g = await diem({ vung: 'gia:truoc', u: -1.2 });
  await page.mouse.click(g[0], g[1]);
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(sang == 'gia:truoc 4' && t.c.sieuAm && t.c.sieuAmX == -1, 'Bấm thẻ siêu âm rồi bấm giá mũi ở x = −1,2 cm: chỉ bốn giá siêu âm được tô sáng, siêu âm gắn ở x = −1 cm', sang + ', x = ' + t.c.sieuAmX);

  // núm xoay
  a = await diem({ vung: 'xoay', khoa: 'sa:truoc', goc: 0 }); b = await diem({ vung: 'xoay', khoa: 'sa:truoc', goc: 33 });
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  await page.mouse.move(b[0], b[1], { steps: 8 }); await page.mouse.up();
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  let quay = await page.evaluate(() => { let c = robot.components.find((x) => x.type == 'UltrasonicSensor'); let q = c.body.rotationQuaternion || BABYLON.Quaternion.Identity(); let v = new BABYLON.Vector3(0, 0, 1); v.rotateByQuaternionToRef(q, v); return [v.x, v.z]; });
  bc.dong(t.c.sieuAmGoc == 30 && Math.abs(quay[0] + 0.5) < 0.02, 'Kéo núm xoay tới 33°: bám về 30°, chùm siêu âm trên xe 3D lệch sang trái 30°', 'hướng (' + quay.map((x) => x.toFixed(2)).join(', ') + ')');
  await chup('bang-lap-rap-xoay');
  await page.focus('.sra-lr-num[data-xoay="sa:truoc"]');
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(t.c.sieuAmGoc == 15, 'Phím mũi tên phải trên núm xoay: bớt 15°', t.c.sieuAmGoc + '°');

  // bàn phím
  await page.focus('[data-cho="tren:0"]');
  await page.keyboard.press('Delete');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(!t.c.gyro && t.cb.indexOf('Gyro') < 0, 'Phím Delete trên gyro: tháo gyro', t.cb.replace(/Sensor/g, ''));
  await page.focus('.sra-lr-the[data-loai=gyro]');
  await page.keyboard.press('Enter');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  let gy = t.c.tren.find((m) => m.loai == 'gyro');
  bc.dong(!!gy && gy.x == -3 && gy.z == 3.95, 'Phím Enter trên thẻ gyro: tự gắn vào chỗ cũ trên nắp', JSON.stringify(gy));
  await page.keyboard.press('ArrowUp');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  gy = t.c.tren.find((m) => m.loai == 'gyro');
  bc.dong(gy.z == 4.45 && /gyro/i.test(await page.locator('.sra-lr-chi-tiet').textContent()), 'Phím mũi tên lên: gyro dời 0,5 cm về phía mũi, dòng chi tiết ghi vị trí mới', JSON.stringify(gy));
  await page.focus('[data-cho="duoi:2"]');
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(xDuoi(t.c) == 'c-3 d-1.5 d1.5 d3', 'Phím mũi tên phải trên mắt dò line ở x = 1 cm: sang 1,5 cm', xDuoi(t.c));

  // thêm siêu âm bên trái: đủ 8 ổ cắm thì khay khoá
  t = await keo('.sra-lr-the[data-loai=sieuAm]', await diem({ vung: 'gia:trai', u: 1.6 }));
  let huongSa = () => page.evaluate(() => robot.sraBanLap.camBien.filter((c) => c.loai == 'sieuAm').map((cb) => {
    let c = robot.components.find((x) => x.port == cb.cong); let q = c.body.rotationQuaternion || BABYLON.Quaternion.Identity();
    let v = new BABYLON.Vector3(0, 0, 1); v.rotateByQuaternionToRef(q, v); return cb.gia + ' ' + v.x.toFixed(2) + ' ' + v.z.toFixed(2);
  }));
  let hsa = await huongSa();
  let khay = await page.evaluate(() => ({ tat: $('.sra-lr-the:not([disabled])').length, chu: $('.sra-lr-the[data-loai=sieuAm] .sra-lr-con').text(), de: $('.sra-lr-vung-thong-tin .sra-lr-tieu-de-nho').first().text() }));
  bc.dong(t.c.sa.map((m) => m.gia + m.u).join() == 'truoc-1,trai1.5' && (t.cb.match(/Ultrasonic/g) || []).length == 2 && /^trai -1\.00 0\.00$/.test(hsa[1]),
    'Kéo siêu âm thứ hai vào giá bên trái ở z = 1,6 cm: bám về 1,5 cm, xe có 2 siêu âm, cái bên trái nhìn sang trái (−x)', hsa.join(' | '));
  bc.dong(khay.tat == 0 && khay.chu == 'hết ổ' && /8\/8/.test(khay.de), 'Đủ 8 ổ cắm: mọi thẻ trong khay bị khoá, ghi "hết ổ"', khay.de);
  await chup('bang-lap-rap-hai-sieu-am');
  await page.focus('.sra-lr-num[data-xoay="sa:trai"]');
  await page.keyboard.press('ArrowLeft');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai(); hsa = await huongSa();
  bc.dong(t.c.sa[1].goc == 15 && /^trai -0\.97 -0\.26$/.test(hsa[1]), 'Núm xoay của giá trái: phím mũi tên trái xoay 15° sang trái (chếch về đuôi xe)', hsa[1]);
  // nút × trên sơ đồ
  await page.hover('[data-cho="sa:trai"] .sra-lr-khung', { force: true });
  await page.click('[data-cho="sa:trai"] .sra-lr-thao');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(t.c.sa.length == 1 && (t.cb.match(/Ultrasonic/g) || []).length == 1, 'Rê chuột lên siêu âm trái rồi bấm nút ×: tháo đúng cái đó', t.c.sa.map((m) => m.gia).join());
  // nút Tháo trong danh sách cổng
  await page.click('.sra-lr-nut-thao[data-thao="duoi:0"]');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(!t.c.cham && t.cb.indexOf('Touch') < 0 && xDuoi(t.c) == 'd-1.5 d1.5 d3', 'Nút "Tháo" cạnh cảm biến chạm trong danh sách cổng: tháo cảm biến chạm', xDuoi(t.c));
  await page.evaluate(() => SRABangLapRap.dat('cham', 'khay', { vung: 'duoi', x: -3 }));
  // sơn
  await page.click('.sra-lr-o-son[data-son-phan=khung][data-son-mau="#1565c0"]');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  await page.click('.sra-lr-o-son[data-son-phan=vanh][data-son-mau="#263238"]');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  let son = await page.evaluate(() => ({ khung: babylon.scene.meshes.filter((m) => m.material && m.material.id == 'sraXe_son:#1565c0').length, vanh: babylon.scene.meshes.filter((m) => m.material && m.material.id == 'sraXe_son:#263238').length,
    chon: $('.sra-lr-o-son.chon').map((i, e) => e.getAttribute('data-son-mau')).get().join() }));
  bc.dong(t.c.son.khung == '#1565c0' && t.c.son.vanh == '#263238' && son.khung > 0 && son.vanh > 0 && son.chon == '#1565c0,,#263238',
    'Sơn khung xanh dương và vành bánh đen: xe 3D đổi màu, ô màu đang chọn được đánh dấu', son.khung + ' khối khung, ' + son.vanh + ' khối vành');
  await chup('bang-lap-rap-son');

  // xe vừa lắp chạy và đọc cảm biến bình thường
  await page.waitForFunction(() => robot.sraVatLi && robot.sraVatLi.thoiGian > 0.5, null, { timeout: 30000 });
  let doc = await page.evaluate(async () => {
    let sa = robot.components.find((c) => c.type == 'UltrasonicSensor'), mat = robot.getComponentByPort('in1');
    robot.leftWheel.speed_sp = 300; robot.rightWheel.speed_sp = 300; robot.leftWheel.runForever(); robot.rightWheel.runForever();
    let z0 = robot.body.position.z, x0 = robot.body.position.x;
    await new Promise((r) => setTimeout(r, 1500));
    let d = Math.hypot(robot.body.position.z - z0, robot.body.position.x - x0);
    robot.leftWheel.stop(); robot.rightWheel.stop();
    return { loai: sa.type + ' ' + mat.type, kc: sa.getDistance(), d: d };
  });
  bc.dong(doc.loai == 'UltrasonicSensor ColorSensor' && doc.kc > 2 && doc.d > 5, 'Xe vừa lắp chạy được và đọc được siêu âm xoay 15°', 'đi ' + doc.d.toFixed(1) + ' cm, siêu âm ' + doc.kc.toFixed(1) + ' cm');

  // lưu lại: nạp lại trang, chọn xe thì ra đúng bản đã lắp
  let luu = t.luu;
  await page.reload();
  await page.waitForFunction(() => typeof robotTemplates != 'undefined' && robotTemplates.some((r) => r.name == 'siro_xeLapRap'), null, { timeout: 90000 });
  let mau = await page.evaluate(() => JSON.stringify(robotTemplates.find((r) => r.name == 'siro_xeLapRap').sraXe));
  bc.dong(luu == mau && JSON.parse(mau).doLine == 3 && JSON.parse(mau).sieuAmGoc == 15 && JSON.parse(mau).son.khung == '#1565c0', 'Nạp lại trang: mẫu "Xe lắp mô-đun" mang đúng bản lắp đã lưu', xDuoi(JSON.parse(mau)));
  await page.waitForFunction(() => typeof babylon != 'undefined' && babylon.world && robot.body, null, { timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { $('.dialogScreen').remove(); try { $('#navSim').click(); } catch (e) {} });
  await page.waitForTimeout(800);
  // đang dùng robot khác: mục menu chuyển sang xe rồi mở bảng
  await page.evaluate(() => SRABangLapRap.mo());
  await page.waitForSelector('.sra-lr-bang');
  t = await trangThai();
  bc.dong(t.c.doLine == 3 && t.cb.split(' ').length == 7, 'Mở bảng khi đang dùng robot khác: chuyển sang xe với bản lắp đã lưu', t.cb.replace(/Sensor/g, ''));

  await page.click('.sra-lr-thao-het');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(t.cb == '' && t.kl < 460 && await soModun() == 0 && t.c.son.khung == '#1565c0', 'Nút "Tháo hết cảm biến": xe không còn cảm biến, giữ màu sơn', t.kl + ' g');
  await chup('bang-lap-rap-trong');
  await page.click('.sra-lr-mac-dinh');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(t.c.doLine == 2 && t.cb.split(' ').length == 6 && t.luu === null && !t.c.son.khung, 'Nút "Về mặc định": 6 cảm biến như ban đầu, xoá bản đã lưu', t.kl + ' g');

  // khung hẹp
  await page.setViewportSize({ width: 600, height: 760 });
  await page.waitForTimeout(600);
  let hep = await page.evaluate(() => { let b = $('.sra-lr-bang')[0].getBoundingClientRect(), o = $('.sra-lr-so-do [data-cho="duoi:0"]')[0].getBoundingClientRect(); return { hep: $('.sra-lr-bang').hasClass('hep'), trai: b.left, phai: window.innerWidth - b.right, o: Math.round(o.width) }; });
  bc.dong(hep.hep && hep.trai >= 0 && hep.phai >= 0 && hep.o >= 20, 'Khung 600 px: bảng nằm phía dưới, không tràn, mắt dò line rộng ' + hep.o + ' px');
  await chup('bang-lap-rap-hep');
  await page.setViewportSize({ width: 1280, height: 760 });

  await page.click('.sra-lr-dong');
  bc.dong(await page.locator('.sra-lr-bang').count() == 0 && !(await page.evaluate(() => $('#simPanel').hasClass('sra-lr-dang-mo'))), 'Đóng bảng: bảng biến mất, các nút trở về chỗ cũ');

  await browser.close();
  process.exit(bc.ket());
})();
