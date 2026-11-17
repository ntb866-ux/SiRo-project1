// Kiểm tra bảng lắp ráp kéo thả của xe lắp mô-đun.
// Phần 1 (không cần trình duyệt): mọi bản lắp có thể tạo ra từ bảng đều dựng được, cổng liền nhau, không mô-đun nào chồng lên nhau.
// Phần 2 (trình duyệt): kéo thả bằng chuột, bấm chọn, bàn phím; xe 3D và cảm biến đổi theo; cấu hình được lưu lại.
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
        let mod = b.than.filter((ct) => ['doLine', 'cham', 'sieuAm', 'gyro', 'gps'].indexOf(ct.nhom) >= 0);
        for (let i = 0; i < mod.length; i++) for (let j = i + 1; j < mod.length; j++) {
          if (mod[i].nhom == mod[j].nhom && mod[i].nhom != 'doLine') continue;
          for (const a of mod[i].khoi) for (const c of mod[j].khoi) {
            let A = hopBao(a), C = hopBao(c);
            if ([0, 1, 2].every((t) => A[t][0] < C[t][1] - 0.01 && C[t][0] < A[t][1] - 0.01)) loi.push(mod[i].id + ' lấn vào ' + mod[j].id + ': ' + ten);
          }
        }
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
    const a = await tam(tu), b = typeof den == 'string' ? await tam(den) : den;
    await page.mouse.move(a[0], a[1]); await page.mouse.down();
    await page.mouse.move(a[0] + 8, a[1] + 8, { steps: 3 }); await page.mouse.move(b[0], b[1], { steps: 8 });
    await page.mouse.up();
    await page.evaluate(() => SRABangLapRap.choDungXong());
    await page.waitForFunction(() => robot.sraVatLi && robot.sraVatLi.thoiGian > 0.2, null, { timeout: 30000 });
    return trangThai();
  };

  // mở từ menu Robot
  await page.click('.menuItem.robotMenu');
  await page.locator('.robotMenuDropDown li', { hasText: 'Lắp ráp xe' }).click();
  await page.waitForSelector('.sra-lr-bang');
  await page.waitForTimeout(800);
  let t = await trangThai();
  bc.dong(await page.locator('.sra-lr-cho.co').count() == 6 && t.klBang.indexOf(t.kl + ' g') >= 0, 'Mở bảng từ menu Robot: thấy 6 cảm biến đang gắn, khối lượng trên bảng khớp xe 3D', t.klBang);
  await chup('bang-lap-rap-mac-dinh');

  t = await keo('.sra-lr-the[data-loai=doLine]', '[data-cho="lo:2"]');
  bc.dong(t.c.doLine == 3 && t.cb == 'in1:ColorSensor in2:ColorSensor in3:ColorSensor in4:UltrasonicSensor in5:TouchSensor in6:GyroSensor in7:GPSSensor' && t.luoi.indexOf('doLine3') >= 0,
    'Kéo mắt dò line thứ ba từ khay vào lỗ giữa: xe có 3 mắt, 7 cổng', t.cb.replace(/Sensor/g, ''));
  bc.dong(await page.locator('.sra-lr-the[data-loai=doLine]').isDisabled(), 'Khay hết mắt dò line thì thẻ bị khoá');

  t = await keo('[data-cho="lo:4"]', '[data-cho="lo:0"]');
  bc.dong(t.c.lo[0] == 'cham' && t.c.lo[4] === null && await page.evaluate(() => Math.abs(robot.sraBanLap.than.find((ct) => ct.id == 'cham').khoi[1].vt[0] + 3) < 1e-6),
    'Kéo cảm biến chạm từ lỗ phải sang lỗ trái: công tắc trên xe 3D dời sang x = −3 cm', JSON.stringify(t.c.lo));

  t = await keo('[data-cho="nap:0"]', '[data-cho="nap:1"]');
  bc.dong(t.c.nap.join() == 'gps,gyro' && t.cb.indexOf('in6:GyroSensor in7:GPSSensor') >= 0, 'Kéo gyro sang chỗ của GPS: hai mô-đun đổi chỗ, số cổng giữ nguyên', t.c.nap.join());

  t = await keo('[data-cho="lo:1"]', '[data-cho="lo:0"]');
  bc.dong(t.c.lo[0] == 'doLine' && t.c.lo[1] == 'cham', 'Kéo mắt dò line vào lỗ đang có cảm biến chạm: đổi chỗ cho nhau', JSON.stringify(t.c.lo));

  let truoc = JSON.stringify(t.c);
  t = await keo('[data-cho="nap:0"]', '[data-cho="lo:4"]');
  bc.dong(JSON.stringify(t.c) == truoc && /chỉ gắn được/.test(t.tb), 'Kéo GPS vào lỗ dưới mũi: không nhận, có lời giải thích', t.tb);

  t = await keo('[data-cho="gia"]', [900, 420]);
  bc.dong(!t.c.sieuAm && t.cb.indexOf('Ultrasonic') < 0 && t.luoi.indexOf('sieuAm') < 0, 'Kéo siêu âm ra ngoài bảng: tháo khỏi xe, mô-đun và giá biến mất', t.kl + ' g');
  await chup('bang-lap-rap-da-doi');

  // bấm chọn rồi bấm chỗ gắn
  await page.click('.sra-lr-the[data-loai=sieuAm]');
  let sang = await page.locator('.sra-lr-cho.nhan-duoc').count();
  await chup('bang-lap-rap-dang-cam');
  await page.click('[data-cho="gia"]');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(sang == 1 && t.c.sieuAm, 'Bấm thẻ siêu âm rồi bấm giá phía mũi: chỉ giá được tô sáng, cảm biến được gắn', t.tb);

  // bàn phím
  await page.focus('[data-cho="nap:1"]');
  await page.keyboard.press('Delete');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(!t.c.gyro && t.cb.indexOf('Gyro') < 0, 'Phím Delete trên gyro: tháo gyro', t.cb.replace(/Sensor/g, ''));
  await page.focus('.sra-lr-the[data-loai=gyro]');
  await page.keyboard.press('Enter');
  await page.focus('[data-cho="nap:1"]');
  await page.keyboard.press('Enter');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(t.c.nap[1] == 'gyro', 'Phím Enter trên thẻ gyro rồi trên chỗ trống: gắn lại gyro', t.c.nap.join());

  // xe vừa lắp chạy và đọc cảm biến bình thường
  await page.waitForFunction(() => robot.sraVatLi && robot.sraVatLi.thoiGian > 0.5, null, { timeout: 30000 });
  let doc = await page.evaluate(async () => {
    let sa = robot.getComponentByPort('in4'), mat = robot.getComponentByPort('in1');
    robot.leftWheel.speed_sp = 300; robot.rightWheel.speed_sp = 300; robot.leftWheel.runForever(); robot.rightWheel.runForever();
    let z0 = robot.body.position.z, x0 = robot.body.position.x;
    await new Promise((r) => setTimeout(r, 1500));
    let d = Math.hypot(robot.body.position.z - z0, robot.body.position.x - x0);
    robot.leftWheel.stop(); robot.rightWheel.stop();
    return { loai: sa.type + ' ' + mat.type, kc: sa.getDistance(), d: d };
  });
  bc.dong(doc.loai == 'UltrasonicSensor ColorSensor' && doc.kc > 2 && doc.d > 5, 'Xe vừa lắp chạy được và đọc được siêu âm ở cổng 4', 'đi ' + doc.d.toFixed(1) + ' cm, siêu âm ' + doc.kc.toFixed(1) + ' cm');

  // lưu lại: nạp lại trang, chọn xe thì ra đúng bản đã lắp
  let luu = t.luu;
  await page.reload();
  await page.waitForFunction(() => typeof robotTemplates != 'undefined' && robotTemplates.some((r) => r.name == 'siro_xeLapRap'), null, { timeout: 90000 });
  let mau = await page.evaluate(() => JSON.stringify(robotTemplates.find((r) => r.name == 'siro_xeLapRap').sraXe));
  bc.dong(luu == mau && JSON.parse(mau).doLine == 3, 'Nạp lại trang: mẫu "Xe lắp mô-đun" mang đúng bản lắp đã lưu', JSON.parse(mau).lo.join());
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
  bc.dong(t.cb == '' && t.kl < 460 && await page.locator('.sra-lr-cho.co').count() == 0, 'Nút "Tháo hết cảm biến": xe không còn cảm biến', t.kl + ' g');
  await chup('bang-lap-rap-trong');
  await page.click('.sra-lr-mac-dinh');
  await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await trangThai();
  bc.dong(t.c.doLine == 2 && t.cb.split(' ').length == 6 && t.luu === null, 'Nút "Về mặc định": 6 cảm biến như ban đầu, xoá bản đã lưu', t.kl + ' g');

  // khung hẹp
  await page.setViewportSize({ width: 600, height: 760 });
  await page.waitForTimeout(600);
  let hep = await page.evaluate(() => { let b = $('.sra-lr-bang')[0].getBoundingClientRect(), o = $('[data-cho="lo:0"]')[0].getBoundingClientRect(); return { hep: $('.sra-lr-bang').hasClass('hep'), trai: b.left, phai: window.innerWidth - b.right, o: Math.round(o.width) }; });
  bc.dong(hep.hep && hep.trai >= 0 && hep.phai >= 0 && hep.o >= 24, 'Khung 600 px: bảng nằm phía dưới, không tràn, chỗ gắn rộng ' + hep.o + ' px');
  await chup('bang-lap-rap-hep');
  await page.setViewportSize({ width: 1280, height: 760 });

  await page.click('.sra-lr-dong');
  bc.dong(await page.locator('.sra-lr-bang').count() == 0 && !(await page.evaluate(() => $('#simPanel').hasClass('sra-lr-dang-mo'))), 'Đóng bảng: bảng biến mất, các nút trở về chỗ cũ');

  await browser.close();
  process.exit(bc.ket());
})();
