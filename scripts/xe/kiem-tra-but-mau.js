// Kiểm tra bút vẽ và cảm biến màu TCS34725 của xe lắp mô-đun, và xe là robot mặc định của mọi sân.
// Chạy: node scripts/xe/kiem-tra-but-mau.js [thư-mục-lưu-ảnh]
const path = require('path');
const { mo, napXe, BaoCao } = require('./chung.js');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');

const bc = new BaoCao();
const anh = process.argv[2];

console.log('1. Cấu hình');
{
  let b = L.lapXe({ but: true });
  let but = b.camBien.find((c) => c.loai == 'but');
  bc.dong(!!but && !!b.but, 'Xe có bút vẽ nhận một cổng và một ổ trên mạch chủ', but && (but.cong + ', ổ ' + but.oMach));
  let pin = b.than.find((c) => c.id == 'pin').khoi[0].vt[2], pin0 = L.lapXe({}).than.find((c) => c.id == 'pin').khoi[0].vt[2];
  bc.dong(pin > pin0 + 4, 'Có bút thì hộp pin dời lên phía mũi', pin0 + ' → ' + pin);
  let anBut = b.than.find((c) => c.id == 'butHitbox');
  bc.dong(anBut.khoi.every((k) => k.an && k.vt[1] - (k.d || 0) / 2 >= L.BUT.nang - 1e-6 - 0.18), 'Hitbox cây bút ở vị trí nâng, ngòi không chạm sân');
  let c = L.chuanHoaCauHinh({ but: true, gam: [{ loai: 'doLine', x: 0, z: 0.5 }, { loai: 'doLine', x: 2.5, z: 0.5 }] });
  bc.dong(c.gam.length == 1 && c.gam[0].x == 2.5, 'Mắt dưới gầm không được chồng lên ống giữ bút', JSON.stringify(c.gam));
  let m = L.lapXe({ duoi: [{ loai: 'doLine', x: -3 }, { loai: 'mau', x: 0 }, { loai: 'doLine', x: 3 }], gam: [{ loai: 'mau', x: 2, z: 4 }] });
  bc.dong(m.camBien.filter((x) => x.loai == 'mau').length == 2 && m.camBien.slice(0, 3).map((x) => x.loai).join() == 'doLine,mau,doLine',
    'Cảm biến màu dưới mũi xếp cổng trái sang phải cùng mắt dò line; gắn được cả dưới gầm', m.camBien.map((x) => x.cong + ':' + x.loai).join(' '));
  let q = L.chuanHoaCauHinh({ duoi: [{ loai: 'mau', x: -3 }, { loai: 'mau', x: 0 }, { loai: 'mau', x: 3 }] });
  bc.dong(q.duoi.length == 2, 'Khay có 2 cảm biến màu');
}

(async () => {
  console.log('2. Robot mặc định');
  let { browser, page } = await mo({ viewport: { width: 1000, height: 700 }, dsf: anh ? 2 : 1 });
  let ten = await page.evaluate(() => [robot.options.name, !!robot.options.sraXe, robotTemplates[0].name]);
  bc.dong(ten[0] == 'siro_xeLapRap' && ten[1] && ten[2] == 'siro_xeLapRap', 'Sân tự do mở bằng xe lắp mô-đun, xe đứng đầu danh sách chọn robot', ten.join(', '));

  console.log('3. Cảm biến màu trên các ô màu');
  await napXe(page, { sraXe: { duoi: [{ loai: 'mau', x: 0 }], sa: [], tren: [] } });
  const docMau = (hex) => page.evaluate((hex) => {
    (window._tam || []).forEach((m) => m.dispose());
    let c = robot.components.find((x) => x.sraLoai == 'mau');
    robot.body.computeWorldMatrix(true);
    let p = c.position, P = robot.body.getAbsolutePosition();
    let diem = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(p.x, p.y, p.z).subtract(new BABYLON.Vector3(...robot.sraKhoiLuong.than.tam)), robot.body.getWorldMatrix());
    let m = BABYLON.MeshBuilder.CreateGround('tamMau', { width: 4, height: 4 }, babylon.scene);
    m.position = new BABYLON.Vector3(diem.x, 0.01, diem.z);
    let vl = new BABYLON.StandardMaterial('tamMauVl', babylon.scene); vl.diffuseColor = BABYLON.Color3.FromHexString(hex);
    m.material = vl; m.computeWorldMatrix(true); window._tam = [m];
    c.do();
    return c.getRGB().map(Math.round);
  }, hex);
  for (const [hex, ten] of [['#ffffff', 'trắng'], ['#d32f2f', 'đỏ'], ['#2e7d32', 'xanh lá'], ['#1565c0', 'xanh dương'], ['#fbc02d', 'vàng'], ['#111111', 'đen']]) {
    let rgb = await docMau(hex);
    let dung = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    let lech = Math.max(...rgb.map((v, i) => Math.abs(v - dung[i])));
    bc.dong(lech <= 20, 'Ô ' + ten + ' ' + hex, 'đọc ' + rgb.join(', ') + ', lệch tối đa ' + lech);
  }

  console.log('4. Bút vẽ');
  await napXe(page, { sraXe: { but: true, sa: [], duoi: [], tren: [{ loai: 'gyro', x: -3, z: 3.95 }] } });
  let kq = await page.evaluate(async () => {
    let but = robot.components.find((c) => c.type == 'Pen');
    let ngoi0 = but.tip.getAbsolutePosition().y;
    but.down();
    await new Promise((r) => setTimeout(r, 300));
    let ngoi1 = but.tip.getAbsolutePosition().y;
    let p0 = but.tip.getAbsolutePosition().clone();
    // quay tại chỗ: ngòi ở tâm quay nên gần như đứng yên
    robot.leftWheel.speed_sp = 300; robot.rightWheel.speed_sp = -300; robot.leftWheel.runForever(); robot.rightWheel.runForever();
    await new Promise((r) => setTimeout(r, 1500));
    let p1 = but.tip.getAbsolutePosition().clone();
    robot.leftWheel.speed_sp = 300; robot.rightWheel.speed_sp = 300;
    await new Promise((r) => setTimeout(r, 1500));
    robot.leftWheel.stop(); robot.rightWheel.stop();
    await new Promise((r) => setTimeout(r, 400));
    but.up();
    let net = but.traceMeshes.length, dinh = but.traceMeshes.reduce((s, m) => s + m.getTotalVertices(), 0);
    return { ngoi0, ngoi1, troi: Math.hypot(p1.x - p0.x, p1.z - p0.z), net, dinh, port: but.port };
  });
  bc.dong(Math.abs(kq.ngoi0 - 0.35) < 0.05 && Math.abs(kq.ngoi1) < 0.05, 'Nhấc bút: ngòi cách sân 3,5 mm; hạ bút: ngòi chạm sân', kq.ngoi0.toFixed(2) + ' → ' + kq.ngoi1.toFixed(2) + ' cm');
  bc.dong(kq.troi < 0.6, 'Quay tại chỗ: ngòi bút gần như đứng yên', kq.troi.toFixed(2) + ' cm');
  bc.dong(kq.net >= 1 && kq.dinh > 20, 'Xe chạy thì để lại nét mực', kq.net + ' nét, ' + kq.dinh + ' đỉnh, cổng ' + kq.port);
  if (anh) await page.screenshot({ path: path.join(anh, 'but-ve.png') });

  console.log('5. Bảng lắp ráp');
  await napXe(page, { sraXe: { sa: [], duoi: [], tren: [] } });
  let lr = await page.evaluate(async () => {
    SRABangLapRap.mo();
    await SRABangLapRap.choDungXong();
    let a = await SRABangLapRap.dat('but', 'khay', { vung: 'tam', x: 0, z: 0 });
    let b = await SRABangLapRap.dat('mau', 'khay', { vung: 'duoi', x: 0 });
    let c = SRABangLapRap.cauHinh;
    return { a: a.tb || a.loi, b: b.tb || b.loi, but: c.but, mau: c.duoi.map((m) => m.loai).join(), pen: robot.components.some((x) => x.type == 'Pen'), mauXe: robot.components.some((x) => x.sraLoai == 'mau') };
  });
  bc.dong(lr.but && lr.pen, 'Kéo bút từ khay vào tâm xe', lr.a);
  bc.dong(lr.mau == 'mau' && lr.mauXe, 'Kéo cảm biến màu vào thanh dưới mũi', lr.b);
  if (anh) await page.screenshot({ path: path.join(anh, 'bang-lap-rap-but-mau.png') });
  await browser.close();
  process.exit(bc.ket());
})();
