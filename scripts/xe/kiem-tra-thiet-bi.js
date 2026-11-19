// Kiểm tra laze, lidar, camera, cảm biến màu nhìn xa và súng bắn bi của xe lắp mô-đun; robot mẫu Bắn bóng sơn, Chạy mê cung đời 2.
// Chạy: node scripts/xe/kiem-tra-thiet-bi.js [thư-mục-lưu-ảnh]
const path = require('path');
const { mo, napXe, BaoCao } = require('./chung.js');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');

const bc = new BaoCao();
const anh = process.argv[2];

console.log('1. Cấu hình');
{
  let c = L.chuanHoaCauHinh({ sa: [{ gia: 'truoc', u: 0, loai: 'laze' }, { gia: 'trai', u: 2, loai: 'camera' }, { gia: 'phai', u: 2, loai: 'laze' }, { gia: 'sau', u: 0, loai: 'laze' }] });
  bc.dong(c.sa.filter((m) => m.loai == 'laze').length == L.TOI_DA.laze, 'Tối đa ' + L.TOI_DA.laze + ' laze trên giá', c.sa.map((m) => m.gia + ':' + m.loai).join(' '));
  let b = L.lapXe({ sa: [{ gia: 'truoc', u: 0, loai: 'laze' }], duoi: [], tren: [{ loai: 'lidar', x: 0, z: 4.5 }], co: { loai: 'tay', doan: 1, dau: 'sung' } });
  let s = b.camBien.map((x) => x.cong + ':' + x.loai).join(' ') + ' | ' + b.tacDong.map((t) => t.cong + ':' + t.loai).join(' ');
  bc.dong(s == 'in1:laze in2:lidar | outC:tay outD:sung', 'Laze, lidar, cánh tay mang súng nhận cổng', s);
}

(async () => {
  let { browser, page } = await mo({ viewport: { width: 800, height: 560 }, dsf: anh ? 2 : 1 });
  const cho = (ms) => page.waitForTimeout(ms);
  // tấm thử đứng yên cách tâm xe d cm theo hướng huong (hệ xe: [0, 1] mũi, [-1, 0] bên trái), mặt vuông góc với hướng đó
  const datKhoi = (d, mau, huong, cao) => page.evaluate(({ d, mau, huong, cao }) => {
    robot.body.computeWorldMatrix(true);
    let q = robot.body.absoluteRotationQuaternion, f = new BABYLON.Vector3(huong[0], 0, huong[1]).rotateByQuaternionToRef(q, new BABYLON.Vector3());
    f.y = 0; f.normalize();
    let p = robot.body.getAbsolutePosition().add(f.scale(d));
    let k = BABYLON.MeshBuilder.CreateBox('khoiThu', { width: 40, height: cao || 30, depth: 2 }, babylon.scene);
    k.position = new BABYLON.Vector3(p.x, (cao || 30) / 2, p.z);
    k.rotation.y = Math.atan2(f.x, f.z);
    let m = new BABYLON.StandardMaterial('mauThu', babylon.scene);
    m.diffuseColor = BABYLON.Color3.FromHexString(mau); m.emissiveColor = BABYLON.Color3.FromHexString(mau).scale(0.6);
    k.material = m;
    return { x: p.x, z: p.z };
  }, { d, mau, huong, cao });
  const xoaKhoi = () => page.evaluate(() => babylon.scene.meshes.filter((m) => m.name == 'khoiThu').forEach((m) => m.dispose()));
  const tim = (loai) => page.evaluate((loai) => robot.components.findIndex((c) => c.sraLoai == loai), loai);

  console.log('2. Laze và lidar');
  await napXe(page, { sraXe: { sa: [{ gia: 'truoc', u: 0, loai: 'laze' }, { gia: 'trai', u: 2, loai: 'camera' }], duoi: [], tren: [{ loai: 'lidar', x: 0, z: 4.5 }] } });
  await datKhoi(80, '#888888', [0, 1]);
  await cho(400);
  let d = await page.evaluate(() => {
    let lz = robot.components.find((c) => c.sraLoai == 'laze'), ld = robot.components.find((c) => c.sraLoai == 'lidar');
    let k = babylon.scene.getMeshByName('khoiThu'), q = robot.body.absoluteRotationQuaternion;
    let f = new BABYLON.Vector3(0, 0, 1).rotateByQuaternionToRef(q, new BABYLON.Vector3()); f.y = 0; f.normalize();
    let mat = (p) => BABYLON.Vector3.Dot(k.position.subtract(p), f) - 1;    // khoảng cách theo hướng mũi tới mặt khối
    lz.reset(); ld.reset();
    let kc = lz.getDistance(), ds = ld.getDistances();
    return { kc, kcDung: mat(lz.body.getAbsolutePosition()), n: ds.length, d0: ds[0], d0Dung: mat(ld.body.getAbsolutePosition()), d180: ds[180], d90: ds[90], d270: ds[270], type: lz.type + ' ' + ld.type, port: lz.port + ' ' + ld.port };
  });
  bc.dong(Math.abs(d.kc - d.kcDung) < 0.6, 'Laze đo tới tường phía trước', d.kc.toFixed(1) + ' cm (hình học ' + d.kcDung.toFixed(1) + ' cm), ' + d.type + ', ' + d.port);
  bc.dong(d.n == 360 && Math.abs(d.d0 - d.d0Dung) < 1, 'Lidar trả 360 số đo, số đo 0° nhìn thẳng mũi xe', 'd[0] = ' + d.d0.toFixed(1) + ' cm (hình học ' + d.d0Dung.toFixed(1) + '), d[90] = ' + d.d90.toFixed(0) + ', d[180] = ' + d.d180.toFixed(0) + ', d[270] = ' + d.d270.toFixed(0));
  await xoaKhoi();

  console.log('3. Camera');
  // camera trên giá trái nhìn sang trái: đặt tấm đỏ bên trái
  await datKhoi(30, '#e02020', [-1, 0], 40);
  await cho(1500);
  let cam = await page.evaluate(async () => {
    let c = robot.components.find((x) => x.sraLoai == 'camera');
    // camera chỉ vẽ các vật có lúc nạp sân: thêm tấm thử vào danh sách vẽ
    c.renderTarget.renderList.push(babylon.scene.getMeshByName('khoiThu'));
    for (let i = 0; i < 10; i++) { c.captureImage(); await new Promise((r) => setTimeout(r, 100)); }
    let a = c.getRGB(), n = a.length, s = [0, 0, 0];
    for (let y = n * 0.4 | 0; y < n * 0.6; y++) for (let x = n * 0.4 | 0; x < n * 0.6; x++) for (let k = 0; k < 3; k++) s[k] += a[y][x][k];
    let blobs = c.findBlobs ? c.findBlobs([[0, 20], [50, 100], [30, 100]], 50) : null;
    return { n, s: s.map((v) => Math.round(v / ((n * 0.2) ** 2))), type: c.type, port: c.port, blobs: blobs ? blobs.length : -1 };
  });
  bc.dong(cam.n == 100 && cam.s[0] > cam.s[1] + 60 && cam.s[0] > cam.s[2] + 60, 'Camera nhìn sang trái thấy tấm đỏ ở giữa ảnh', 'ảnh ' + cam.n + '×' + cam.n + ', RGB giữa ' + cam.s.join(', ') + ', ' + cam.type + ' ' + cam.port);
  if (anh) await page.screenshot({ path: path.join(anh, 'thiet-bi-laze-camera.png') });
  await xoaKhoi();

  console.log('4. Robot mẫu Chạy mê cung đời 2: servo mang laze và màu nhìn xa');
  await page.evaluate(async () => {
    await main.loadRobot(JSON.stringify(robotTemplates.find((x) => x.name == 'maze2')));
    let t0 = Date.now();
    while (!(robot.sraVatLi && robot.sraVatLi.thoiGian > 0.5) && Date.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 100));
  });
  let m2 = [];
  for (const [ten, huong, gocServo] of [['trước', [0, 1], 90], ['trái', [-1, 0], 180]]) {
    await page.evaluate((g) => { let s = robot.sraServo; s.position_target = g; s.quayToi ? s.quayToi(g) : s.runToPosition(); }, gocServo);
    await cho(1500);
    await datKhoi(14, '#2050e0', huong, 30);
    await cho(300);
    m2.push(await page.evaluate((ten) => {
      let lz = robot.components.find((c) => c.sraLoai == 'laze'), mx = robot.components.find((c) => c.sraLoai == 'mauXa');
      lz.reset();
      return { ten, kc: lz.getDistance(), rgb: mx.getRGB().map(Math.round), goc: Math.round(robot.sraServo.position), port: mx.port + ' ' + mx.type };
    }, ten));
    await xoaKhoi();
  }
  for (const k of m2) bc.dong(k.kc < 16 && k.rgb[2] > k.rgb[0] + 30 && k.rgb[2] > k.rgb[1] + 20, 'Servo ' + k.goc + '°: laze và màu nhìn xa thấy tấm xanh phía ' + k.ten, 'laze ' + k.kc.toFixed(1) + ' cm, RGB ' + k.rgb.join(', ') + ', ' + k.port);

  console.log('5. Robot mẫu Bắn bóng sơn: súng ở đầu cánh tay');
  await page.evaluate(async () => {
    await main.loadRobot(JSON.stringify(robotTemplates.find((x) => x.name == 'paintball')));
    let t0 = Date.now();
    while (!(robot.sraVatLi && robot.sraVatLi.thoiGian > 0.5) && Date.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 100));
  });
  let sg = await page.evaluate(async () => {
    let tay = robot.sraTacDong.find((t) => t.sraLoai == 'tay'), g = robot.sraTacDong.find((t) => t.sraLoai == 'sung');
    tay.quayToi(30);
    await new Promise((r) => setTimeout(r, 2000));
    g.speed_sp = 600; g.position_target = -1000; g.runToPosition();
    await new Promise((r) => setTimeout(r, 2500));
    let keo = g.position;
    g.time_target = Date.now() + 200; g.runTimed();
    await new Promise((r) => setTimeout(r, 60));
    let bi = g.sraBiCuoi;
    if (!bi) return { keo, loi: 'không có bi' };
    let v = g.sraVBan, p0 = g.sraPBan;
    let vTo = v.length(), gocBan = Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180 / Math.PI, m = bi.physicsImpostor.mass;
    // nội suy chỗ bi đi qua độ cao 1,5 cm giữa hai lần đọc liên tiếp
    let yMax = p0.y, t0 = Date.now(), cham = null, truoc = p0.clone();
    while (Date.now() - t0 < 4000) {
      await new Promise((r) => setTimeout(r, 10));
      if (bi.isDisposed()) break;
      let p = bi.position.clone();
      yMax = Math.max(yMax, p.y);
      if (p.y < 1.5) { let k = (truoc.y - 1.5) / (truoc.y - p.y); cham = truoc.add(p.subtract(truoc).scale(k)); break; }
      truoc = p;
    }
    let xa = cham ? Math.hypot(cham.x - p0.x, cham.z - p0.z) : null;
    return { keo, vTo, gocBan, m, xa, cao: p0.y, yMax, port: g.port + ' ' + g.type, tay: Math.round(tay.position) };
  });
  bc.dong(sg.keo <= -990, 'Lên dây hết 1000°', String(sg.keo && sg.keo.toFixed(0)));
  bc.dong(!sg.loi && Math.abs(sg.vTo - 630) < 40 && Math.abs(sg.gocBan - sg.tay) < 6, 'Bắn: bi 0,5 g bay 6,3 m/s theo hướng nòng', sg.loi || (sg.vTo.toFixed(0) + ' cm/s, góc ' + sg.gocBan.toFixed(1) + '° (tay ' + sg.tay + '°), m = ' + sg.m + ' g, ' + sg.port));
  if (!sg.loi) {
    // tầm xa ném xiên từ độ cao h: x = v·cos·(v·sin + √((v·sin)² + 2gh))/g
    let v = sg.vTo, a = sg.gocBan * Math.PI / 180, gg = 981, h = sg.cao - 1.5;
    let xLi = v * Math.cos(a) * (v * Math.sin(a) + Math.sqrt((v * Math.sin(a)) ** 2 + 2 * gg * h)) / gg;
    bc.dong(sg.xa != null && Math.abs(sg.xa - xLi) / xLi < 0.03, 'Tầm xa khớp công thức ném xiên (g = 9,81 m/s²)', (sg.xa ? sg.xa.toFixed(0) : '—') + ' cm, lí thuyết ' + xLi.toFixed(0) + ' cm (v ' + v.toFixed(0) + ', góc ' + sg.gocBan.toFixed(1) + '°, cao ' + sg.cao.toFixed(1) + ', đỉnh ' + sg.yMax.toFixed(1) + ')');
  }

  console.log('6. Bảng lắp ráp');
  await napXe(page, { sraXe: { sa: [], duoi: [], tren: [] } });
  await page.evaluate(() => SRABangLapRap.mo());
  await page.evaluate(() => SRABangLapRap.choDungXong());
  let kq = await page.evaluate(async () => {
    let r = [];
    r.push(SRABangLapRap.dat('laze', 'khay', { vung: 'gia:truoc', u: 0 }));
    r.push(SRABangLapRap.dat('camera', 'khay', { vung: 'gia:trai', u: 2 }));
    r.push(SRABangLapRap.dat('laze', 'khay', { vung: 'gia:truoc', u: 0 }));
    r.push(SRABangLapRap.dat('lidar', 'khay', { vung: 'nap', x: 0, z: 4.5 }));
    await SRABangLapRap.choDungXong();
    let c = SRABangLapRap.cauHinh;
    return { the: $('.sra-lr-the').map((i, e) => e.getAttribute('data-loai')).get().join(','), sa: c.sa.map((m) => m.gia + ':' + m.loai).join(' '), tren: c.tren.map((m) => m.loai).join(' '),
      loai: robot.components.filter((x) => x.sraLoai).map((x) => x.port + ':' + x.sraLoai).join(' '), tb: $('.sra-lr-thong-bao').text() };
  });
  bc.dong(/laze/.test(kq.the) && /camera/.test(kq.the) && /lidar/.test(kq.the), 'Khay có laze, camera, lidar', kq.the);
  bc.dong(kq.sa == 'truoc:laze trai:camera' && kq.tren == 'lidar', 'Kéo vào giá và nắp: một mô-đun mỗi giá', kq.sa + ' | ' + kq.tren + ' | ' + kq.loai);
  await page.evaluate(() => { SRABangLapRap.chon(null); return SRABangLapRap.coCau({ loai: 'tay', doan: 1, dau: 'sung' }); });
  await page.evaluate(() => SRABangLapRap.choDungXong());
  let nutSung = await page.evaluate(() => ({ n: $('[data-thu-sung]').length, dau: $('[data-co-dau="sung"]').hasClass('chon') }));
  bc.dong(nutSung.n == 2 && nutSung.dau, 'Chọn đầu "Súng bắn bi": có nút Lên dây và Bắn', JSON.stringify(nutSung));
  if (anh) await page.screenshot({ path: path.join(anh, 'bang-lap-rap-thiet-bi.png') });
  await page.click('[data-thu-sung][data-viec="keo"]');
  await cho(2500);
  await page.click('[data-thu-sung][data-viec="ban"]');
  await cho(100);
  let banNut = await page.evaluate(() => { let g = robot.sraTacDong.find((t) => t.sraLoai == 'sung'); return !!g.sraBiCuoi; });
  bc.dong(banNut, 'Bấm Lên dây rồi Bắn: bi bay ra');

  console.log('7. Mã Python');
  await page.evaluate(() => SRABangLapRap.dong());
  await page.evaluate(async () => {
    await main.loadRobot(JSON.stringify(robotTemplates.find((x) => x.name == 'paintball')));
    let t0 = Date.now();
    while (!(robot.sraVatLi && robot.sraVatLi.thoiGian > 0.3) && Date.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 100));
  });
  let py = await page.evaluate(() => { try { return ev3dev2_generator.genCode(); } catch (e) { return 'LỖI ' + e.message; } });
  bc.dong(/INPUT_3\).*Laser|LaserRange.*INPUT_3/.test(py) && /OUTPUT_E/.test(py), 'Python khai báo laze cổng 3 và súng cổng E', (py.match(/.*(INPUT_3|OUTPUT_[C-E]).*/g) || [py.slice(0, 200)]).join(' | '));

  await browser.close();
  process.exit(bc.ket());
})();
