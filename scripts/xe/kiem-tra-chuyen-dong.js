// Đo chuyển động của xe lắp mô-đun và so với lí thuyết: đứng yên, chạy thẳng, quay bánh tới góc,
// điều khiển từng bánh riêng, quay tại chỗ, phanh/thả trôi, kéo tải (đường đặc tính motor).
// Chạy: node scripts/xe/kiem-tra-chuyen-dong.js
const { mo, napXe, BaoCao } = require('./chung.js');
const RAD = Math.PI / 180;

(async () => {
  const { browser, page } = await mo();
  const bc = new BaoCao();
  const doc = () => page.evaluate(() => {
    const b = robot.body, vl = robot.sraVatLi, tam = robot.sraKhoiLuong.than.tam;
    const f = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, 1), b.getWorldMatrix());
    const v = b.physicsImpostor.getLinearVelocity(), w = b.physicsImpostor.getAngularVelocity();
    // vị trí tâm quay (điểm giữa trục hai bánh trên mặt sân)
    return { t: vl.thoiGian, x: b.position.x - f.x * tam[2], z: b.position.z - f.z * tam[2], y: b.position.y,
      huong: Math.atan2(f.x, f.z) * 180 / Math.PI, v: Math.hypot(v.x, v.z), wy: w.y,
      trai: robot.leftWheel.position, phai: robot.rightWheel.position, uT: vl.dongCo[0].u, uP: vl.dongCo[1].u,
      wT: vl.dongCo[0].omega * 180 / Math.PI, wP: vl.dongCo[1].omega * 180 / Math.PI };
  });
  const lenh = (ma) => page.evaluate(ma);
  const cho = (ms) => page.waitForTimeout(ms);
  const chay = (trai, phai) => page.evaluate(([t, p]) => {
    robot.leftWheel.speed_sp = t; robot.rightWheel.speed_sp = p; robot.leftWheel.runForever(); robot.rightWheel.runForever();
  }, [trai, phai]);
  const dung = (kieu) => page.evaluate((k) => { for (const w of [robot.leftWheel, robot.rightWheel]) { w.stop_action = k || 'hold'; w.stop(); } }, kieu);
  const lechGoc = (a, b) => ((a - b + 540) % 360) - 180;
  const pct = (do_, lt) => ((do_ / lt - 1) * 100).toFixed(1) + ' %';

  await napXe(page);
  const ts = await page.evaluate(() => ({ R: robot.sraBanLap.banh[0].d / 2, truc: robot.sraBanLap.banh[1].tam[0] - robot.sraBanLap.banh[0].tam[0],
    m: robot.sraKhoiLuong.tong, yTam: robot.sraKhoiLuong.than.tam[1], dc: robot.sraBanLap.dongCo }));
  console.log('Xe ' + ts.m.toFixed(0) + ' g, bánh Ø' + (2 * ts.R).toFixed(2) + ' cm, hai bánh cách nhau ' + ts.truc.toFixed(1) + ' cm');

  console.log('1. Đứng yên 3 giây');
  let a = await doc(); await cho(3000); let b = await doc();
  bc.dong(Math.hypot(b.x - a.x, b.z - a.z) < 0.05 && Math.abs(lechGoc(b.huong, a.huong)) < 0.1, 'không trôi, không rung',
    'trôi ' + (Math.hypot(b.x - a.x, b.z - a.z) * 10).toFixed(2) + ' mm, xoay ' + lechGoc(b.huong, a.huong).toFixed(3) + '°');
  bc.dong(Math.abs(b.y - ts.yTam) < 0.02, 'độ cao trọng tâm thân', b.y.toFixed(3) + ' cm (bản vẽ ' + ts.yTam.toFixed(3) + ')');

  console.log('2. Chạy thẳng, hai bánh 400 °/s');
  await chay(400, 400); await cho(1000); a = await doc(); await cho(2000); b = await doc();
  let vDo = Math.hypot(b.x - a.x, b.z - a.z) / (b.t - a.t), vLt = 400 * RAD * ts.R;
  bc.dong(Math.abs(vDo / vLt - 1) < 0.01, 'tốc độ', vDo.toFixed(2) + ' cm/s (lí thuyết ' + vLt.toFixed(2) + ', lệch ' + pct(vDo, vLt) + ')');
  let quang = Math.hypot(b.x - a.x, b.z - a.z);
  bc.dong(Math.abs(lechGoc(b.huong, a.huong)) / quang * 100 < 2, 'giữ hướng', 'lệch ' + (lechGoc(b.huong, a.huong) / quang * 100).toFixed(2) + '° mỗi mét');
  await dung(); await cho(800);

  console.log('3. Quay hai bánh thêm đúng 720° (2 vòng)');
  await napXe(page);
  a = await doc();
  await lenh(() => { for (const w of [robot.leftWheel, robot.rightWheel]) { w.speed_sp = 400; w.position_target = w.position + 720; w.runToPosition(); } });
  await page.waitForFunction(() => robot.leftWheel.state == 'holding' && robot.rightWheel.state == 'holding', null, { timeout: 20000 });
  await cho(300); b = await doc();
  quang = Math.hypot(b.x - a.x, b.z - a.z);
  let qLt = 720 * RAD * ts.R;
  bc.dong(Math.abs(b.trai - a.trai - 720) < 0.5 && Math.abs(b.phai - a.phai - 720) < 0.5, 'bánh dừng đúng góc', 'trái ' + (b.trai - a.trai).toFixed(2) + '°, phải ' + (b.phai - a.phai).toFixed(2) + '°');
  bc.dong(Math.abs(quang / qLt - 1) < 0.005, 'quãng đường', quang.toFixed(2) + ' cm (lí thuyết ' + qLt.toFixed(2) + ', lệch ' + pct(quang, qLt) + ')');

  console.log('4. Chỉ bánh trái quay 300 °/s, bánh phải giữ yên: xe xoay quanh bánh phải');
  await napXe(page);
  await lenh(() => { robot.leftWheel.speed_sp = 300; robot.leftWheel.runForever(); robot.rightWheel.stop(); });
  await cho(800); a = await doc(); await cho(2000); b = await doc();
  let wDo = lechGoc(b.huong, a.huong) * RAD / (b.t - a.t), wLt = 300 * RAD * ts.R / ts.truc;
  bc.dong(Math.abs(wDo / wLt - 1) < 0.08, 'tốc độ xoay', (wDo / RAD).toFixed(1) + ' °/s (lí thuyết ' + (wLt / RAD).toFixed(1) + ', lệch ' + pct(wDo, wLt) + ')');
  bc.dong(Math.abs(b.phai - a.phai) < 1, 'bánh phải không bị kéo quay theo', 'xê dịch ' + (b.phai - a.phai).toFixed(2) + '°');
  // tâm xoay: điểm giữa trục đi trên cung tròn bán kính bằng nửa khoảng cách bánh quanh bánh phải
  let banKinh = Math.hypot(b.x - a.x, b.z - a.z) / (2 * Math.sin(Math.abs(lechGoc(b.huong, a.huong)) * RAD / 2));
  bc.dong(Math.abs(banKinh / (ts.truc / 2) - 1) < 0.1, 'bán kính cung của tâm xe', banKinh.toFixed(2) + ' cm (lí thuyết ' + (ts.truc / 2).toFixed(2) + ')');
  await dung(); await cho(600);

  console.log('5. Quay tại chỗ: trái +300 °/s, phải −300 °/s');
  await napXe(page);
  let a0 = await doc();
  await chay(300, -300); await cho(800); a = await doc(); await cho(2500); b = await doc();
  // góc xoay tính bằng cách cộng dồn (có thể quá 180°)
  wDo = Math.abs(b.wy); wLt = 2 * 300 * RAD * ts.R / ts.truc;
  let gocBanh = ((b.trai - a.trai) - (b.phai - a.phai)) / 2;       // độ quay trung bình của mỗi bánh
  bc.dong(Math.abs(wDo / wLt - 1) < 0.08, 'tốc độ xoay', (wDo / RAD).toFixed(1) + ' °/s (lí thuyết ' + (wLt / RAD).toFixed(1) + ', lệch ' + pct(wDo, wLt) + ')');
  bc.dong(Math.hypot(b.x - a0.x, b.z - a0.z) < 1.0, 'tâm quay đứng yên', 'lệch ' + Math.hypot(b.x - a0.x, b.z - a0.z).toFixed(2) + ' cm sau ' + (gocBanh * ts.R / (ts.truc / 2) / 360 * 1).toFixed(1) + ' vòng');
  await dung(); await cho(600);

  console.log('6. Dừng từ 400 °/s theo ba kiểu');
  for (const [kieu, ten] of [['hold', 'giữ'], ['brake', 'phanh'], ['coast', 'thả trôi']]) {
    await napXe(page);
    await chay(400, 400); await cho(1200); a = await doc(); await dung(kieu);
    await page.waitForFunction(() => Math.abs(robot.sraVatLi.dongCo[0].omega) < 0.02 && robot.body.physicsImpostor.getLinearVelocity().length() < 0.05, null, { timeout: 20000 });
    b = await doc();
    console.log('     ' + ten + ': trôi thêm ' + Math.hypot(b.x - a.x, b.z - a.z).toFixed(1) + ' cm trong ' + (b.t - a.t).toFixed(2) + ' s');
    if (kieu == 'hold') var trHold = Math.hypot(b.x - a.x, b.z - a.z); if (kieu == 'brake') var trBrake = Math.hypot(b.x - a.x, b.z - a.z); if (kieu == 'coast') var trCoast = Math.hypot(b.x - a.x, b.z - a.z);
  }
  bc.dong(trHold < trBrake && trBrake < trCoast, 'giữ dừng nhanh hơn phanh, phanh nhanh hơn thả trôi', trHold.toFixed(1) + ' < ' + trBrake.toFixed(1) + ' < ' + trCoast.toFixed(1) + ' cm');

  console.log('7. Motor bị kẹt (xe tì vào tường, cấp 100 % PWM): mô-men phải bằng mô-men kẹt, bánh trượt tại chỗ');
  await napXe(page);
  await lenh(() => {
    const p = robot.body.position;
    const w = BABYLON.MeshBuilder.CreateBox('tuongThu', { width: 80, height: 20, depth: 4 }, babylon.scene);
    w.position = new BABYLON.Vector3(p.x, 10, p.z + 20);
    w.physicsImpostor = new BABYLON.PhysicsImpostor(w, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5 }, babylon.scene);
  });
  await chay(800, 800); await cho(2500); b = await doc();
  const dc = await page.evaluate(() => robot.sraVatLi.dongCo.map((d) => ({ u: d.u, w: d.omega, T: d.momen })));
  // Lực kéo tối đa trước khi trượt = hệ số ma sát × tải trên bánh; motor mạnh hơn thế nên bánh quay trượt
  bc.dong(b.v < 0.5, 'xe đứng yên trước tường', 'tốc độ ' + b.v.toFixed(2) + ' cm/s');
  bc.dong(dc[0].u > 0.95, 'PWM lên kịch', 'u = ' + dc[0].u.toFixed(2) + ', bánh quay ' + (dc[0].w / RAD).toFixed(0) + ' °/s, mô-men ' + (dc[0].T / 980665).toFixed(2) + ' kgf·cm (kẹt hẳn: ' + (ts.dc.momenKet / 980665).toFixed(2) + ')');
  let Tdung = ts.dc.momenKet * (dc[0].u - dc[0].w / (ts.dc.tocDoKhongTai * RAD));
  bc.dong(Math.abs(dc[0].T / Tdung - 1) < 0.02, 'mô-men theo đúng đường đặc tính T = T_kẹt·(u − ω/ω₀)', (dc[0].T / 980665).toFixed(3) + ' so với ' + (Tdung / 980665).toFixed(3) + ' kgf·cm');

  await browser.close();
  process.exit(bc.ket());
})();
