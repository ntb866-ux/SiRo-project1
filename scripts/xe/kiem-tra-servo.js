// Kiểm tra servo SG90 trên nắp mạch chủ: hướng lắp, tay quay, cảm biến trên tay quay, điều khiển bằng chương trình.
// Chạy: node scripts/xe/kiem-tra-servo.js [thư-mục-lưu-ảnh]
const path = require('path');
const { mo, napXe, BaoCao } = require('./chung.js');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');
const H = require('../../public/san-robot-ao/xe/hinh-khoi.js');
const Q = H.Q, V = H.V;

const bc = new BaoCao();
const anh = process.argv[2];
const servo = (m) => Object.assign({ loai: 'servo', x: 0, z: 4.5 }, m);
// hướng tay chính ở góc servo g (độ) theo hướng lắp, trong hệ xe
const huongTay = (m, g) => Q.quay(L.quayServo(m), [Math.cos(g * Math.PI / 180), 0, Math.sin(g * Math.PI / 180)]);
const gan = (v, w) => v.every((x, i) => Math.abs(x - w[i]) < 0.02);

console.log('1. Cấu hình và hình học');
{
  let kq = [];
  // ba kiểu lắp: hướng tay ở 0°, 90°, 180°
  const ds = [
    ['trục đứng', { nghieng: 0, xoay: 0 }, [[1, 0, 0], [0, 0, 1], [-1, 0, 0]]],
    ['trục nằm dọc', { nghieng: 90, xoay: 0 }, [[1, 0, 0], [0, 1, 0], [-1, 0, 0]]],
    ['trục nằm ngang (gật)', { nghieng: 90, xoay: 90 }, [[0, 0, 1], [0, 1, 0], [0, 0, -1]]]
  ];
  for (const [ten, m, mong] of ds) {
    let thuc = [0, 90, 180].map((g) => huongTay(m, g));
    let dat = thuc.every((v, i) => gan(v, mong[i]));
    bc.dong(dat, 'Lắp ' + ten + ': tay quay ở 0°, 90°, 180° chỉ đúng hướng', thuc.map((v) => v.map((x) => +x.toFixed(2)).join(',')).join(' | '));
  }
  let m45 = { nghieng: 45, xoay: 90 }, h45 = huongTay(m45, 90);
  bc.dong(gan(h45, [-Math.SQRT1_2, Math.SQRT1_2, 0]), 'Tuỳ chọn nghiêng 45°, xoay 90° sang trái: giữa hành trình chếch lên 45° về bên trái', h45.map((x) => x.toFixed(2)).join(', '));

  let c = L.chuanHoaCauHinh({ tren: [servo({ nghieng: 100, xoay: 200, tay: 'chuThap', gan: ['sieuAm', 'sieuAm', 'doLine', 'gyro'] })] });
  let sv = c.tren[0];
  bc.dong(sv.nghieng == 90 && sv.xoay == -160 && sv.gan.join() == 'sieuAm,,doLine,', 'Chuẩn hoá: nghiêng kẹp 90°, xoay quy về −180…180°, siêu âm thứ hai chồng siêu âm đầu (tay chữ thập ngắn) bị bỏ, gyro không gắn lên tay quay', JSON.stringify(sv));
  let c2 = L.chuanHoaCauHinh({ tren: [servo({ tay: 'doi', gan: ['sieuAm', 'sieuAm'] })] });
  bc.dong(c2.tren[0].gan.join() == 'sieuAm,sieuAm', 'Tay đôi: hai siêu âm quay lưng vào nhau gắn được', c2.tren[0].gan.join());
  let c3 = L.chuanHoaCauHinh({ sa: L.DS_GIA.map((g) => ({ gia: g })), duoi: [], tren: [servo({ tay: 'doi', gan: ['sieuAm', 'doLine'] })] });
  bc.dong(c3.sa.length + c3.tren[0].gan.filter((x) => x == 'sieuAm').length <= 4, 'Khay có 4 siêu âm: đủ 4 giá thì siêu âm trên tay quay bị bỏ', c3.sa.length + ' giá, tay quay ' + c3.tren[0].gan.join());
  let b = L.lapXe({ sa: [{ gia: 'truoc' }], tren: [servo({ tay: 'doi', gan: ['sieuAm', 'doLine'] }), { loai: 'gyro', x: -3 }] });
  bc.dong(b.camBien.map((x) => x.cong + ':' + x.loai + (x.servo != null ? '@' + x.servo : '')).join(' ') == 'in1:doLine in2:doLine in3:sieuAm in4:cham in5:gyro in6:sieuAm@0 in7:doLine@1'
    && new Set(b.camBien.map((x) => x.oMach).concat([b.servo.oMach])).size == 8,
    'Số cổng: cảm biến trên tay quay đứng sau cùng; servo và 7 cảm biến dùng đủ 8 ổ, không trùng ổ', b.camBien.map((x) => x.cong + ' ổ ' + x.oMach).join(', ') + ', servo ổ ' + b.servo.oMach);
  // trụ servo và thân servo không lấn vào mô-đun khác trên nắp; tay quay ở trên mọi thứ
  let loi = [];
  for (const tay of L.DS_TAY) for (const [ng, xv] of [[0, 0], [90, 0], [90, 90], [45, 45], [30, -120]]) {
    let cc = { tren: [servo({ x: 2.5, nghieng: ng, xoay: xv, tay: tay, gan: L.TAY[tay].diem.map((d, i) => i % 2 ? 'doLine' : 'sieuAm') }), { loai: 'gyro', x: -3 }] };
    try {
      let bl = L.lapXe(cc), kl = L.tinhXe(bl);
      if (!isFinite(kl.tong) || !bl.servo || bl.servo.khoi.length < 2) loi.push('không dựng được ' + JSON.stringify(cc.tren[0]));
      let yNap = bl.than.find((ct) => ct.id == 'servoThan').khoi[4].vt[1];
      let gy = bl.than.find((ct) => ct.id == 'gyro');
      if (gy && Math.abs(gy.khoi[1].vt[0] - 2.5) < 2.1) loi.push('gyro sát servo');
      if (!isFinite(yNap)) loi.push('trụ lỗi');
    } catch (e) { loi.push(tay + ' ' + ng + '/' + xv + ': ' + e.message); }
  }
  bc.dong(loi.length == 0, '4 loại tay quay × 5 hướng lắp đều dựng được, có khối lượng và quán tính', loi.slice(0, 3).join(' | '));
}

(async () => {
  console.log('2. Trong trình duyệt');
  const { browser, page } = await mo({ viewport: { width: 1200, height: 860 }, dsf: anh ? 2 : 1 });
  const chup = async (ten) => { if (anh) await page.screenshot({ path: path.join(anh, ten + '.png') }); };
  await page.evaluate(() => localStorage.removeItem('sanRobotAo.xeLapRap'));
  // xe có servo trục đứng, tay đôi, siêu âm ở đầu trước
  await napXe(page, { sraXe: { sa: [], tren: [{ loai: 'servo', x: 0, z: 4.5, tay: 'doi', gan: ['sieuAm', null] }] } });
  const docServo = () => page.evaluate(() => {
    let s = robot.sraServo, sa = robot.components.find((c) => c.sraLoai == 'sieuAm');
    sa.body.computeWorldMatrix(true);
    let h = new BABYLON.Vector3(0, 0, 1).rotateByQuaternionToRef(sa.body.absoluteRotationQuaternion, new BABYLON.Vector3());
    robot.body.computeWorldMatrix(true);
    let qi = BABYLON.Quaternion.Inverse(robot.body.absoluteRotationQuaternion), hx = h.rotateByQuaternionToRef(qi, new BABYLON.Vector3());
    return { goc: s.position, trangThai: s.state, huong: [hx.x, hx.y, hx.z].map((v) => +v.toFixed(2)), kc: sa.getDistance() };
  });
  let p = await docServo();
  bc.dong(Math.abs(p.goc - 90) < 0.5 && p.huong[2] > 0.99, 'Lúc lắp servo ở 90°, siêu âm trên tay quay nhìn thẳng ra trước', JSON.stringify(p));

  // chương trình Python: quay tới 0° (bên phải), đọc siêu âm, rồi 180°
  await page.evaluate(() => {
    filesManager.files['main.py'] = [
      '#!/usr/bin/env python3', 'from ev3dev2.motor import *', 'from ev3dev2.sensor import *', 'from ev3dev2.sensor.lego import *', 'import time',
      'motorC = LargeMotor(OUTPUT_C)', 'sa = UltrasonicSensor(INPUT_' + robot.components.find((c) => c.sraLoai == 'sieuAm').port.slice(2) + ')',
      'motorC.on_to_position(50, 0)', 'print("phai", motorC.position, sa.distance_centimeters)',
      'motorC.on_to_position(50, 180)', 'print("trai", motorC.position, sa.distance_centimeters)',
      'motorC.on_to_position(20, 400)', 'print("kep", motorC.position)'
    ].join('\n');
    filesManager.modified = true;
    window._inRa = [];
    let ghi = simPanel.consoleWrite, loi = simPanel.consoleWriteErrors;
    simPanel.consoleWrite = function(t) { window._inRa.push(String(t)); return ghi.apply(this, arguments); };
    simPanel.consoleWriteErrors = function(t) { window._inRa.push('LỖI ' + t); return loi.apply(this, arguments); };
    simPanel.runSim();
  });
  await page.waitForFunction(() => !skulpt.running, null, { timeout: 30000 }).catch(() => {});
  let ra = await page.evaluate(() => (window._inRa || []).join(' '));
  p = await docServo();
  let so = (re) => { let m = re.exec(ra); return m ? Number(m[1]) : NaN; };
  let gPhai = so(/phai (-?[\d.]+)/), gTrai = so(/trai (-?[\d.]+)/), gKep = so(/kep (-?[\d.]+)/);
  bc.dong(Math.abs(gPhai) < 2 && Math.abs(gTrai - 180) < 2 && Math.abs(gKep - 180) < 2 && p.huong[0] < -0.99,
    'Python: motorC.on_to_position tới 0° rồi 180°: servo tới đúng góc; lệnh 400° bị giữ ở 180°; siêu âm quay theo (cuối cùng nhìn sang trái)', ra.replace(/\s+/g, ' ').slice(0, 200) + ' | ' + JSON.stringify(p.huong));

  // bảng lắp ráp: kéo servo từ khay lên nắp, đổi hướng, tay quay, gắn cảm biến
  await napXe(page);
  await page.evaluate(() => SRABangLapRap.mo());
  await page.waitForSelector('.sra-lr-bang');
  await page.evaluate(() => SRABangLapRap.dat('gps', 'tren:1', 'khay'));
  const the = await page.locator('.sra-lr-the[data-loai="servo"]').boundingBox();
  const dich = await page.evaluate(() => SRABangLapRap.toaDoManHinh({ vung: 'nap', x: 2.4, z: 4.6 }));
  await page.mouse.move(the.x + the.width / 2, the.y + the.height / 2); await page.mouse.down();
  await page.mouse.move(dich[0] - 10, dich[1], { steps: 4 }); await page.mouse.move(dich[0], dich[1], { steps: 4 }); await page.mouse.up();
  await page.evaluate(() => SRABangLapRap.choDungXong());
  const tt = () => page.evaluate(() => ({ sv: SRABangLapRap.cauHinh.tren.find((m) => m.loai == 'servo'), cb: robot.components.map((c) => c.port + ':' + c.type).join(' '), tb: $('.sra-lr-thong-bao').text(),
    // danh sách cổng nằm trong bảng thuộc tính của cả xe: bỏ chọn để đọc rồi chọn lại
    ds: (() => { let k = SRABangLapRap.dangChon(); SRABangLapRap.chon(null); let d = $('.sra-lr-ds-cong li').map((i, e) => $(e).find('.sra-lr-huy-hieu').text()).get().join(','); SRABangLapRap.chon(k); return d; })() }));
  let t = await tt();
  bc.dong(t.sv && t.sv.x == 2.5 && t.sv.z == 4.5 && /^outC:SwivelActuator/.test(t.cb) && /C$/.test(t.ds) && await page.locator('.sra-lr-servo').count() == 1,
    'Kéo servo từ khay lên nắp: bám lưới, xe có động cơ C, danh sách cổng có dòng "C", hiện mục Servo', JSON.stringify(t.sv) + ' ' + t.ds);
  await page.click('[data-servo-tay="doi"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  await page.click('[data-servo-gan="0"][data-loai-gan="sieuAm"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  await page.click('[data-servo-gan="1"][data-loai-gan="doLine"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await tt();
  bc.dong(t.sv.tay == 'doi' && t.sv.gan.join() == 'sieuAm,doLine' && /in6:UltrasonicSensor in7:ColorSensor$/.test(t.cb), 'Chọn tay đôi, gắn siêu âm đầu trước và dò line đầu sau: xe 3D có thêm hai cảm biến ở cổng cuối', t.cb);
  await page.click('[data-servo-truc="gat"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await tt();
  let hSa = await page.evaluate(() => { let c = robot.components.find((x) => x.port == 'in6'); return c.body.position.y; });
  bc.dong(t.sv.nghieng == 90 && t.sv.xoay == 90 && /gật/.test(t.tb), 'Nút "Trục nằm ngang": servo gật lên xuống (nghiêng 90°, xoay 90°)', t.tb);
  await page.click('[data-servo-goc="xoay"][data-buoc="-15"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await tt();
  bc.dong(t.sv.xoay == 75 && /xoay 75° sang trái/.test(t.tb), 'Nút − ở "Xoay": hướng lắp tuỳ chọn, lời mô tả đổi theo', t.tb);
  let tat = await page.locator('[data-servo-gan="0"][data-loai-gan="doLine"]').isDisabled();
  await page.click('[data-servo-tay="chuThap"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await tt();
  let tat2 = await page.evaluate(() => $('[data-servo-gan="3"][data-loai-gan="sieuAm"]').prop('disabled') + ' ' + $('[data-servo-gan="3"][data-loai-gan="sieuAm"]').attr('title'));
  bc.dong(t.sv.tay == 'chuThap' && t.sv.gan.join() == 'sieuAm,doLine,,' && /chồng/.test(tat2), 'Đổi sang tay chữ thập: giữ hai cảm biến, nút siêu âm ở nhánh cạnh siêu âm bị khoá kèm lí do', t.sv.gan.join() + ' | ' + tat2);
  await page.locator('.sra-lr-thanh-goc').fill('30');
  await page.waitForTimeout(1200);
  let gThu = await page.evaluate(() => robot.sraServo.position);
  bc.dong(Math.abs(gThu - 30) < 1.5, 'Kéo thanh "Thử góc" tới 30°: servo trên xe 3D quay tới 30°', gThu.toFixed(1));
  await chup('servo-bang-lap-rap');
  await page.evaluate(() => SRABangLapRap.chon(null));
  await page.click('.sra-lr-cong-servo .sra-lr-nut-thao'); await page.evaluate(() => SRABangLapRap.choDungXong());
  t = await tt();
  bc.dong(!t.sv && !/outC/.test(t.cb) && await page.locator('.sra-lr-servo').count() == 0, 'Nút "Tháo" ở dòng servo: tháo servo cùng các cảm biến trên tay quay', t.cb);
  await browser.close();
  process.exit(bc.ket());
})();
