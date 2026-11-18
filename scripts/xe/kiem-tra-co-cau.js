// Kiểm tra cơ cấu công tác của xe lắp mô-đun: nam châm điện (dưới gầm, ở đầu cần), cánh tay 1–2 đoạn, thanh trượt, kẹp gắp.
// Chạy: node scripts/xe/kiem-tra-co-cau.js [thư-mục-lưu-ảnh]
const path = require('path');
const { mo, napXe, BaoCao } = require('./chung.js');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');

const bc = new BaoCao();
const anh = process.argv[2];
const RONG = { sa: [], duoi: [], tren: [] };

console.log('1. Cấu hình');
{
  let b = L.lapXe({ gam: [{ loai: 'namCham' }] });
  let nc = b.tacDong.find((t) => t.loai == 'namCham');
  bc.dong(!!nc && nc.cong == 'outC', 'Nam châm dưới gầm nhận cổng động cơ C', nc && (nc.cong + ', ổ ' + nc.oMach));
  let c = L.chuanHoaCauHinh({ gam: [{ loai: 'namCham' }, { loai: 'namCham', x: 2 }] });
  bc.dong(c.gam.filter((m) => m.loai == 'namCham').length == 1, 'Chỉ một nam châm dưới gầm');
  let k = L.chuanHoaCauHinh({ duoi: [{ loai: 'cham', x: 0 }], co: { loai: 'tay', dau: 'namCham' } });
  bc.dong(!k.co, 'Cơ cấu ở mũi không lắp cùng tấm cản cảm biến chạm');
  let t2 = L.lapXe({ sa: [{ gia: 'truoc', u: 0 }], duoi: [], tren: [{ loai: 'gyro', x: -3, z: 3.95 }], co: { loai: 'tay', doan: 2, dau: 'namCham', mau: true }, gam: [{ loai: 'namCham' }] });
  let cong = t2.tacDong.map((t) => t.loai + ':' + t.cong).join(' ');
  bc.dong(cong == 'tay:outC tay:outD namCham:outE namCham:outF', 'Cần cẩu hai đoạn: cổng động cơ C, D cho hai khớp, E cho nam châm đầu cần, F cho nam châm gầm', cong);
  let sa = L.chuanHoaCauHinh({ sa: [{ gia: 'truoc', u: 0, cao: 2 }], duoi: [], co: { loai: 'truot', dau: 'kep' } }).sa[0];
  bc.dong(sa.cao >= L.CO.caoSa.truot - 1e-6, 'Siêu âm mũi tự nâng lên trên thanh trượt', sa.cao + ' cm');
  let crane = L.chuanHoaCauHinh({ duoi: [{ loai: 'mau', x: -1.5 }, { loai: 'mau', x: 1.5 }], tren: [{ loai: 'gyro', x: -3, z: 3.95 }], co: { loai: 'tay', doan: 2, dau: 'namCham', mau: true } });
  bc.dong(crane.co && crane.co.mau, 'Ba cảm biến màu: hai dưới mũi, một ở đầu cần');
  let v = t2.vatPhu.map((x) => x.id + ' ' + x.gioiHan.map(Math.round).join('…')).join(', ');
  bc.dong(t2.vatPhu.length == 2, 'Giới hạn khớp lấy từ hình học', v);
}

(async () => {
  let { browser, page } = await mo({ viewport: { width: 1000, height: 700 }, dsf: anh ? 2 : 1 });
  const cho = (ms) => page.waitForTimeout(ms);
  const goc = () => page.evaluate(() => robot.sraTacDong.map((t) => Math.round(t.position)));

  console.log('2. Cánh tay một đoạn');
  await napXe(page, { sraXe: Object.assign({}, RONG, { co: { loai: 'tay', dau: 'namCham' } }) });
  let h = await page.evaluate(async () => {
    let t = robot.sraTacDong.find((x) => x.sraLoai == 'tay');
    let y = () => robot.sraVatNut.tay1.nut.getAbsolutePosition().y;
    let dauY = () => { let m = robot.sraVatNut.tay1.nut; m.computeWorldMatrix(true); return BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, 7), m.getWorldMatrix()).y; };
    let y0 = dauY();
    t.quayToi(60);
    await new Promise((r) => setTimeout(r, 2500));
    let g60 = t.position, y60 = dauY();
    t.quayToi(200);
    await new Promise((r) => setTimeout(r, 2500));
    let gMax = t.position;
    return { y0, y60, g60, gMax, lim: t.gocMax, port: t.port, type: t.type };
  });
  bc.dong(Math.abs(h.g60 - 60) < 4, 'Lệnh 60°: tay tới 60°', h.g60.toFixed(1) + '°');
  bc.dong(h.y60 > h.y0 + 2, 'Góc dương là nâng lên: đầu tay lên cao', h.y0.toFixed(1) + ' → ' + h.y60.toFixed(1) + ' cm');
  bc.dong(h.gMax <= h.lim + 3, 'Lệnh quá giới hạn: dừng ở giới hạn hình học', h.gMax.toFixed(1) + '° (giới hạn ' + h.lim.toFixed(0) + '°)');
  bc.dong(h.type == 'ArmActuator' && h.port == 'outC', 'Cánh tay là ArmActuator cổng outC', h.type + ' ' + h.port);

  console.log('3. Nam châm hút vật sắt');
  // KK-P20/15 giữ 2,5 kgf khi áp sát nhưng chỉ còn ~1 % ở khe 1,5 cm: phải hạ tay chạm vật mới nhấc được
  let nc = await page.evaluate(async () => {
    let t = robot.sraTacDong.find((x) => x.sraLoai == 'tay');
    let n = robot.sraTacDong.find((x) => x.sraLoai == 'namCham');
    let me = robot.sraVatLi.namCham[0];
    // tay nằm ngang, đặt khối sắt 2 × h × 2 cm (20 g) ngay dưới mặt nam châm, khe hở 2 mm
    t.quayToi(0);
    await new Promise((r) => setTimeout(r, 1500));
    let tiGoc = t.position;
    let b = me.me.body, tf = b.getWorldTransform(), o = tf.getOrigin(), q = tf.getRotation();
    let d = new BABYLON.Vector3(me.moTa.vt[0] - me.me.com[0], me.moTa.vt[1] - me.me.com[1], me.moTa.vt[2] - me.me.com[2]);
    let p = d.rotateByQuaternionToRef(new BABYLON.Quaternion(q.x(), q.y(), q.z(), q.w()), new BABYLON.Vector3()).addInPlace(new BABYLON.Vector3(o.x(), o.y(), o.z()));
    let h = Math.max(0.6, p.y - 0.2);
    let hop = BABYLON.MeshBuilder.CreateBox('sat', { width: 2, height: h, depth: 2 }, babylon.scene);
    hop.position = new BABYLON.Vector3(p.x, h / 2, p.z);
    hop.isMagnetic = true;
    hop.physicsImpostor = new BABYLON.PhysicsImpostor(hop, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 20, friction: 0.5 }, babylon.scene);
    await new Promise((r) => setTimeout(r, 600));
    let y0 = hop.position.y;
    n.bat();
    await new Promise((r) => setTimeout(r, 500));
    t.quayToi(45);
    await new Promise((r) => setTimeout(r, 2500));
    let y1 = hop.position.y, hut = me.vatHut.length;
    n.tat();
    await new Promise((r) => setTimeout(r, 1500));
    let y2 = hop.position.y;
    hop.physicsImpostor.dispose(); hop.dispose();
    return { y0, y1, y2, hut, port: n.port, tiGoc, h, mat: p.y };
  });
  bc.dong(nc.y1 > nc.y0 + 2, 'Bật nam châm rồi nâng tay: vật sắt bị nhấc lên', nc.y0.toFixed(1) + ' → ' + nc.y1.toFixed(1) + ' cm, ' + nc.hut + ' vật đang hút; mặt hút cao ' + nc.mat.toFixed(1) + ' cm');
  bc.dong(nc.y2 < nc.y0 + 0.2, 'Tắt nam châm: vật rơi xuống sân', nc.y2.toFixed(1) + ' cm');
  if (anh) await page.screenshot({ path: path.join(anh, 'canh-tay.png') });

  console.log('4. Cần cẩu hai đoạn');
  await napXe(page, { sraXe: Object.assign({}, RONG, { co: { loai: 'tay', doan: 2, dau: 'namCham' } }) });
  let c2 = await page.evaluate(async () => {
    let [v, k] = robot.sraTacDong.filter((x) => x.sraLoai == 'tay');
    v.quayToi(40); k.quayToi(-60);
    await new Promise((r) => setTimeout(r, 3000));
    return [v.position, k.position, v.port, k.port];
  });
  bc.dong(Math.abs(c2[0] - 40) < 5 && Math.abs(c2[1] + 60) < 5, 'Vai 40°, khuỷu −60°', c2[0].toFixed(1) + '°, ' + c2[1].toFixed(1) + '° (' + c2[2] + ', ' + c2[3] + ')');

  console.log('5. Thanh trượt');
  await napXe(page, { sraXe: Object.assign({}, RONG, { co: { loai: 'truot', dau: 'namCham' } }) });
  let tr = await page.evaluate(async () => {
    let t = robot.sraTacDong.find((x) => x.sraLoai == 'truot');
    let y = () => robot.sraVatNut.truot.nut.getAbsolutePosition().y;
    let y0 = y();
    t.quayToi(t.gocMax / 2);
    await new Promise((r) => setTimeout(r, 2500));
    let y1 = y(), p = t.position;
    return { y0, y1, p, max: t.gocMax, doMoiCm: t.doMoiCm, type: t.type };
  });
  let dk = tr.max / 2 / tr.doMoiCm;
  bc.dong(Math.abs(tr.p - tr.max / 2) < 15 && Math.abs(tr.y1 - tr.y0 - dk) < 0.3, 'Thanh trượt lên nửa hành trình', (tr.y1 - tr.y0).toFixed(2) + ' cm (mong ' + dk.toFixed(2) + '), ' + tr.p.toFixed(0) + '°, ' + tr.type);

  console.log('6. Kẹp gắp');
  await napXe(page, { sraXe: Object.assign({}, RONG, { co: { loai: 'coDinh', dau: 'kep' } }) });
  let kp = await page.evaluate(async () => {
    let t = robot.sraTacDong.find((x) => x.sraLoai == 'kep');
    t.quayToi(t.gocMax);
    await new Promise((r) => setTimeout(r, 1200));
    let mo = t.position;
    // khối 1,6 cm (15 g) giữa hai má kẹp
    let a = robot.sraVatNut.hamTrai.nut.getAbsolutePosition(), b = robot.sraVatNut.hamPhai.nut.getAbsolutePosition();
    let g = a.add(b).scale(0.5);
    let hop = BABYLON.MeshBuilder.CreateBox('khoiKep', { size: 1.6 }, babylon.scene);
    hop.position = new BABYLON.Vector3(g.x, 0.8, g.z);
    hop.physicsImpostor = new BABYLON.PhysicsImpostor(hop, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 15, friction: 0.6 }, babylon.scene);
    await new Promise((r) => setTimeout(r, 500));
    let p0 = hop.position.clone();
    t.quayToi(0);
    await new Promise((r) => setTimeout(r, 1200));
    let kep = t.position;
    // lùi xe 1,5 s: khối phải đi theo
    robot.leftWheel.speed_sp = -300; robot.rightWheel.speed_sp = -300; robot.leftWheel.runForever(); robot.rightWheel.runForever();
    await new Promise((r) => setTimeout(r, 1500));
    robot.leftWheel.stop(); robot.rightWheel.stop();
    await new Promise((r) => setTimeout(r, 300));
    let p1 = hop.position.clone();
    let con = BABYLON.Vector3.Distance(hop.position, robot.sraVatNut.hamTrai.nut.getAbsolutePosition().add(robot.sraVatNut.hamPhai.nut.getAbsolutePosition()).scale(0.5));
    hop.physicsImpostor.dispose(); hop.dispose();
    t.quayToi(0);
    return { mo, kep, dong: t.position, type: t.type, port: t.port, keo: BABYLON.Vector3.Distance(p0, p1), con };
  });
  bc.dong(kp.mo > 45, 'Kẹp mở hết', kp.mo.toFixed(0) + '°, ' + kp.type + ' ' + kp.port);
  bc.dong(kp.kep > 3 && kp.keo > 3 && kp.con < 1.5, 'Kẹp khối 1,6 cm rồi lùi xe: khối đi theo xe', 'má dừng ở ' + kp.kep.toFixed(0) + '° (bị khối chặn), khối đi ' + kp.keo.toFixed(1) + ' cm, lệch tâm kẹp ' + kp.con.toFixed(1) + ' cm');

  console.log('7. Mã Python khai báo motor');
  await napXe(page, { sraXe: Object.assign({}, RONG, { co: { loai: 'tay', dau: 'kep' }, gam: [{ loai: 'namCham' }] }) });
  let py = await page.evaluate(() => { try { return ev3dev2_generator.genCode(); } catch (e) { return 'LỖI ' + e.message; } });
  bc.dong(/OUTPUT_C\).*Arm/.test(py) && /OUTPUT_D\).*Swivel/.test(py) && /OUTPUT_E\).*Magnet/.test(py), 'Phần đầu chương trình Python khai báo motor C, D, E', (py.match(/.*OUTPUT_[C-F].*/g) || [py.slice(0, 200)]).join(' | '));

  console.log('8. Bảng lắp ráp');
  await napXe(page, { sraXe: Object.assign({}, RONG) });
  await page.evaluate(() => SRABangLapRap.mo());
  await page.waitForSelector('.sra-lr-co-cau');
  const bam = async (sel) => { await page.click(sel); await page.evaluate(() => SRABangLapRap.choDungXong()); };
  await bam('[data-co-kieu="tay2"]');
  await bam('[data-co-dau="kep"]');
  let b1 = await page.evaluate(() => ({ co: SRABangLapRap.cauHinh.co, cb: robot.components.filter((c) => /^out[C-Z]/.test(c.port)).map((c) => c.port + ':' + c.type).join(' '), ds: $('.sra-lr-ds-cong li').map((i, e) => $(e).find('.sra-lr-huy-hieu').text()).get().join(','), tb: $('.sra-lr-thong-bao').text(), thanh: $('.sra-lr-thanh-co').length }));
  bc.dong(b1.co && b1.co.loai == 'tay' && b1.co.doan == 2 && b1.co.dau == 'kep' && b1.cb == 'outC:ArmActuator outD:ArmActuator outE:SwivelActuator' && /C,D,E$/.test(b1.ds) && b1.thanh == 3,
    'Chọn cần cẩu 2 đoạn và kẹp gắp: xe có motor C, D, E, danh sách cổng có C, D, E, ba thanh thử', b1.cb + ' | ' + b1.ds + ' | ' + b1.tb);
  if (anh) await page.screenshot({ path: path.join(anh, 'bang-lap-rap-co-cau.png') });
  await page.evaluate(() => SRABangLapRap.dat('cham', 'khay', { vung: 'duoi', x: 0 }));
  await page.evaluate(() => SRABangLapRap.choDungXong());
  let b2 = await page.evaluate(() => ({ co: SRABangLapRap.cauHinh.co, cham: SRABangLapRap.cauHinh.duoi.some((m) => m.loai == 'cham'), tb: $('.sra-lr-thong-bao').text() }));
  bc.dong(!!b2.co && !b2.cham, 'Đã có cơ cấu ở mũi thì không gắn được cảm biến chạm', b2.tb);
  await bam('[data-thao="co"]');
  let b3 = await page.evaluate(() => ({ co: SRABangLapRap.cauHinh.co, n: robot.components.filter((c) => /^out[C-Z]/.test(c.port)).length }));
  bc.dong(!b3.co && b3.n == 0, 'Nút "Tháo" ở dòng động cơ tháo cơ cấu');
  await bam('[data-co-kieu="coDinh"]');
  await bam('[data-co-dau="namCham"]');
  await bam('[data-co-mau="1"]');
  let b4 = await page.evaluate(() => ({ co: SRABangLapRap.cauHinh.co, mau: robot.components.filter((c) => c.sraLoai == 'mau').length, nut: $('[data-thu-nam-cham]').length }));
  bc.dong(b4.co && b4.co.loai == 'coDinh' && b4.co.mau && b4.mau == 1 && b4.nut == 1, 'Giá cố định + nam châm + cảm biến màu ở đầu, có nút thử bật nam châm', JSON.stringify(b4.co));

  console.log('9. Robot mẫu trong menu Chọn robot');
  await page.evaluate(() => SRABangLapRap.dong());
  const MONG = {
    singleFollower: 'in1:ColorSensor in2:UltrasonicSensor in3:GyroSensor in4:GPSSensor in5:Pen outC:MagnetActuator',
    doubleFollower: 'in1:ColorSensor in2:ColorSensor in3:UltrasonicSensor in4:GyroSensor in5:GPSSensor outC:MagnetActuator',
    maze: 'in1:ColorSensor in2:UltrasonicSensor in3:UltrasonicSensor in4:UltrasonicSensor in5:GyroSensor outC:MagnetActuator',
    tow: 'in1:ColorSensor in2:ColorSensor in3:UltrasonicSensor in4:GyroSensor outC:ArmActuator outD:MagnetActuator',
    crane: 'in1:ColorSensor in2:ColorSensor in3:UltrasonicSensor in4:GyroSensor in5:ColorSensor outC:ArmActuator outD:ArmActuator outE:MagnetActuator'
  };
  for (const ten in MONG) {
    let kq = await page.evaluate(async (ten) => {
      let t = robotTemplates.find((x) => x.name == ten);
      await main.loadRobot(JSON.stringify(t));
      let t0 = Date.now();
      while (!(robot.sraVatLi && robot.sraVatLi.thoiGian > 0.5) && Date.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 100));
      let cong = robot.components.filter((c) => c.port && !/^out[AB]$/.test(c.port)).map((c) => c.port + ':' + c.type).sort((a, b) => (a[0] == 'i') == (b[0] == 'i') ? a.localeCompare(b) : a[0] == 'i' ? -1 : 1).join(' ');
      let p = robot.body.getAbsolutePosition();
      return { cong, sraXe: !!t.sraXe, y: p.y, i: robotTemplates.findIndex((x) => x.name == ten) };
    }, ten);
    bc.dong(kq.sraXe && kq.cong == MONG[ten] && kq.y > 0, ten + ': xe mBot, cổng như robot cũ', kq.cong + ' (vị trí menu ' + kq.i + ')');
    if (anh) {
      await page.evaluate(() => { let c = babylon.cameraArc, p = robot.body.getAbsolutePosition(); if (c) { c.setTarget(p.add(new BABYLON.Vector3(0, 4, 0))); c.radius = 45; c.alpha = -0.6; c.beta = 1.1; } });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(anh, 'mau-' + ten + '.png') });
    }
  }

  await browser.close();
  process.exit(bc.ket());
})();
