// Kiểm tra robot mẫu xe mBot trong hộp Robot → Chọn robot: cổng giữ đúng như robot GEARS cùng tên,
// lồng của Xe lồng giữ được khối khi quay và lùi, nam châm nhìn ngang của Bóng đá / Thể thao robot WRO hút bi sắt.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337) và Playwright.
// Chạy: node scripts/xe/kiem-tra-robot-mau.js
const { mo, BaoCao } = require('./chung.js');

// Cổng của robot GEARS cùng tên (js/robotTemplates.js)
const CONG = {
  singleFollower: { in1: 'mau', in2: 'sieuAm', in3: 'gyro', in4: 'gps', in5: 'but', outC: 'namCham' },
  doubleFollower: { in1: 'mau', in2: 'mau', in3: 'sieuAm', in4: 'gyro', in5: 'gps', outC: 'namCham' },
  maze: { in1: 'mau', in2: 'sieuAm', in3: 'sieuAm', in4: 'sieuAm', in5: 'gyro', outC: 'namCham' },
  maze2: { in1: 'mau', in2: 'gyro', in3: 'laze', in4: 'mauXa', outC: 'namCham', outD: 'servo' },
  tow: { in1: 'mau', in2: 'mau', in3: 'sieuAm', in4: 'gyro', outC: 'tay', outD: 'namCham' },
  crane: { in1: 'mau', in2: 'mau', in3: 'sieuAm', in4: 'gyro', in5: 'mau', outC: 'tay', outD: 'tay', outE: 'namCham' },
  paintball: { in1: 'mau', in2: 'mau', in3: 'laze', in4: 'gyro', in5: 'gps', outC: 'namCham', outD: 'tay', outE: 'sung' },
  cage: { in1: 'mau', in2: 'mau', in3: 'mauXa', in4: 'sieuAm', in5: 'gyro', in6: 'gps', outC: 'tay' },
  football: { in1: 'gyro', in2: 'gps', outC: 'namCham', outD: 'namCham' },
  WROSport: { in1: 'mau', in2: 'gyro', in3: 'camera', in4: 'mauXa', in5: 'gps', outC: 'namCham' }
};

(async () => {
  const bc = new BaoCao();
  const { browser, page } = await mo();
  const nap = (ten) => page.evaluate(async (ten) => {
    const cho = (ms) => new Promise((r) => setTimeout(r, ms));
    babylon.world = worlds.find((w) => w.name == 'grid');
    await main.loadRobot(JSON.stringify(robotTemplates.find((x) => x.name == ten)));
    let t0 = Date.now();
    while (!(robot.sraVatLi && robot.sraVatLi.thoiGian > 1.0) && Date.now() - t0 < 20000) await cho(100);
  }, ten);

  console.log('1. Cổng của robot mẫu');
  for (const ten of Object.keys(CONG)) {
    await nap(ten);
    let co = await page.evaluate(() => {
      let kq = {};
      for (let i = 1; i <= 8; i++) { let s = robot.getComponentByPort('in' + i); if (s) kq['in' + i] = s.sraLoai || (s.type == 'CameraSensor' ? 'camera' : s.type); }
      (robot.sraTacDong || []).forEach((t) => kq[t.port] = t.sraLoai);
      if (robot.sraServo) kq[robot.sraServo.port] = 'servo';
      return kq;
    });
    let muon = CONG[ten], sai = Object.keys(muon).filter((p) => co[p] != muon[p]).concat(Object.keys(co).filter((p) => !muon[p]));
    bc.dong(!sai.length, ten, sai.length ? 'lệch ở ' + sai.map((p) => p + ' ' + co[p] + '≠' + muon[p]).join(', ') : Object.keys(co).map((p) => p + ' ' + co[p]).join(', '));
  }

  console.log('2. Xe lồng: úp lồng lên khối, quay tại chỗ rồi lùi');
  await nap('cage');
  let l = await page.evaluate(async () => {
    const cho = (ms) => new Promise((r) => setTimeout(r, ms));
    let tay = robot.sraTacDong.find((x) => x.sraLoai == 'tay'), mau = robot.getComponentByPort('in3');
    let com = robot.sraKhoiLuong.than.tam;
    let truc = () => robot.body.position.subtract(new BABYLON.Vector3(...com).rotateByQuaternionToRef(robot.body.absoluteRotationQuaternion, new BABYLON.Vector3()));
    let huong = (v) => new BABYLON.Vector3(...v).rotateByQuaternionToRef(robot.body.absoluteRotationQuaternion, new BABYLON.Vector3());
    tay.quayToi(60); await cho(3000);
    let c = truc().add(huong([0, 0, 16.6]));
    let hop = BABYLON.MeshBuilder.CreateBox('khoiDo', { size: 4 }, babylon.scene);
    hop.position = new BABYLON.Vector3(c.x, 2, c.z);
    hop.material = new BABYLON.StandardMaterial('khoiDo', babylon.scene); hop.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    hop.physicsImpostor = new BABYLON.PhysicsImpostor(hop, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 30, friction: 0.5 }, babylon.scene);
    await cho(500);
    let rgb = mau.getRGB();
    tay.quayToi(0); await cho(3000);
    let vt = () => { let d = hop.position.subtract(truc()); return [BABYLON.Vector3.Dot(d, huong([1, 0, 0])), BABYLON.Vector3.Dot(d, huong([0, 0, 1]))]; };
    let banh = [robot.leftWheel, robot.rightWheel];
    let chay = async (t, p, ms) => { banh[0].speed_sp = t; banh[1].speed_sp = p; banh.forEach((w) => w.runForever()); await cho(ms); banh.forEach((w) => w.stop()); await cho(500); };
    let g0 = robot.body.absoluteRotationQuaternion.toEulerAngles().y;
    await chay(300, -300, 2500);
    let sauQuay = vt(), goc = Math.abs(robot.body.absoluteRotationQuaternion.toEulerAngles().y - g0) * 180 / Math.PI;
    await chay(-300, -300, 1500);
    let sauLui = vt();
    hop.physicsImpostor.dispose(); hop.dispose();
    return { rgb, sauQuay, goc, sauLui };
  });
  let trong = (p) => Math.abs(p[0]) < 3 && p[1] > 13 && p[1] < 20;
  bc.dong(l.rgb[0] > 150 && l.rgb[1] < 80, 'Cảm biến màu nhìn ra trước thấy khối đỏ trước mũi', 'RGB ' + l.rgb.map(Math.round).join(', '));
  bc.dong(trong(l.sauQuay) && l.goc > 30, 'Quay tại chỗ ' + l.goc.toFixed(0) + '°: khối vẫn trong lồng', 'ngang ' + l.sauQuay[0].toFixed(1) + ' cm, trước trục bánh ' + l.sauQuay[1].toFixed(1) + ' cm');
  bc.dong(trong(l.sauLui), 'Lùi: thanh trước của lồng kéo khối theo', 'ngang ' + l.sauLui[0].toFixed(1) + ' cm, trước trục bánh ' + l.sauLui[1].toFixed(1) + ' cm');

  console.log('3. Nam châm nhìn ngang trên giá');
  for (const [ten, cong] of [['football', 'outC'], ['football', 'outD'], ['WROSport', 'outC']]) {
    await nap(ten);
    let r = await page.evaluate(async (cong) => {
      const cho = (ms) => new Promise((r) => setTimeout(r, ms));
      let n = robot.sraTacDong.find((x) => x.port == cong), me = robot.sraVatLi.namCham.find((x) => x.moTa.cong == cong);
      const mat = () => {
        let tf = me.me.body.getWorldTransform(), o = tf.getOrigin(), q = tf.getRotation(), qq = new BABYLON.Quaternion(q.x(), q.y(), q.z(), q.w());
        let p = new BABYLON.Vector3(...me.moTa.vt.map((v, i) => v - me.me.com[i])).rotateByQuaternionToRef(qq, new BABYLON.Vector3()).addInPlace(new BABYLON.Vector3(o.x(), o.y(), o.z()));
        return { p, h: new BABYLON.Vector3(...me.moTa.huong).rotateByQuaternionToRef(qq, new BABYLON.Vector3()) };
      };
      const thu = async (khe) => {
        const R = 3;
        let { p, h } = mat(), c = p.add(h.scale(R + khe));
        let bi = BABYLON.MeshBuilder.CreateSphere('biSat', { diameter: 2 * R }, babylon.scene);
        bi.position = new BABYLON.Vector3(c.x, R, c.z); bi.isMagnetic = true;
        bi.physicsImpostor = new BABYLON.PhysicsImpostor(bi, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 20, friction: 0.5, restitution: 0.2 }, babylon.scene);
        await cho(400);
        let kc = () => { let m = mat(); return BABYLON.Vector3.Dot(bi.position.subtract(m.p), m.h) - R; };
        n.bat(); await cho(1500);
        let k = kc();
        n.tat(); await cho(300); bi.physicsImpostor.dispose(); bi.dispose();
        return k;
      };
      return { cao: mat().p.y, gan: await thu(1.5), xa: await thu(5) };
    }, cong);
    bc.dong(r.gan < 0.2 && r.xa > 4.5, ten + ' ' + cong + ': hút bi sắt cách 1,5 cm, không hút bi cách 5 cm', 'khe còn ' + r.gan.toFixed(2) + ' cm và ' + r.xa.toFixed(2) + ' cm; mặt hút cao ' + r.cao.toFixed(1) + ' cm');
  }

  await browser.close();
  process.exit(bc.ket());
})();
