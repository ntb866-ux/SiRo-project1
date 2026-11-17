// Kiểm tra máy quay góc thứ ba (sau, trước, trái, phải xe) và mặt sân trong suốt khi nhìn từ dưới lên.
// Chạy: node scripts/xe/kiem-tra-may-quay.js [thư-mục-lưu-ảnh]
const path = require('path');
const { mo, napXe, BaoCao } = require('./chung.js');

(async () => {
  const bc = new BaoCao();
  const anh = process.argv[2];
  const { browser, page } = await mo({ viewport: { width: 1000, height: 640 }, dsf: anh ? 2 : 1 });
  await napXe(page);
  const chup = async (ten) => { if (anh) await page.screenshot({ path: path.join(anh, ten + '.png') }); };
  // vị trí máy quay so với xe, tính trong hệ toạ độ của xe: [ngang (+ phải), cao, dọc (+ trước)]
  const viTri = () => page.evaluate(() => {
    let c = babylon.cameraArc.position, t = robot.body.getAbsolutePosition();
    let v = new BABYLON.Vector3(0, 0, 1); v.rotateByQuaternionToRef(robot.body.absoluteRotationQuaternion, v);
    let d = c.subtract(t), h = Math.hypot(d.x, d.z);
    return { ngang: (d.x * v.z - d.z * v.x) / h, cao: d.y, doc: (d.x * v.x + d.z * v.z) / h };
  });

  // mở hộp chọn máy quay, bấm nút "phía sau"
  await page.click('.cameraSelector .camera');
  await page.waitForTimeout(400);
  let hien = await page.locator('.cameraChase').count();
  await page.click('.cameraChase[data-goc="sau"]');
  await page.waitForTimeout(600);
  let p = await viTri();
  bc.dong(hien == 4 && p.doc < -0.95 && p.cao > 10, 'Nút "phía sau": máy quay đặt chếch sau xe, nhìn xuống', JSON.stringify(p));
  await chup('may-quay-sau');

  // xe quay tại chỗ 90°: máy quay bám theo, vẫn ở sau xe
  await page.evaluate(() => { robot.leftWheel.speed_sp = 300; robot.rightWheel.speed_sp = -300; robot.leftWheel.runForever(); robot.rightWheel.runForever(); });
  await page.waitForTimeout(1500);
  let dangQuay = await viTri();
  await page.evaluate(() => { robot.leftWheel.stop(); robot.rightWheel.stop(); });
  await page.waitForTimeout(1500);
  p = await viTri();
  bc.dong(p.doc < -0.98 && dangQuay.doc < -0.5, 'Xe quay tại chỗ: máy quay bám theo hướng xe (trễ một chút khi đang quay), dừng thì lại ngay sau xe', 'đang quay ' + dangQuay.doc.toFixed(2) + ', dừng ' + p.doc.toFixed(2));

  for (const [goc, kt, ten] of [['truoc', (p) => p.doc > 0.98, 'phía trước'], ['trai', (p) => p.ngang < -0.98, 'bên trái'], ['phai', (p) => p.ngang > 0.98, 'bên phải']]) {
    await page.click('.cameraSelector .camera');
    await page.waitForTimeout(300);
    await page.click('.cameraChase[data-goc="' + goc + '"]');
    await page.waitForTimeout(600);
    p = await viTri();
    bc.dong(kt(p) && p.cao > 10, 'Nút "' + ten + '": máy quay đặt chếch ' + ten + ' xe', JSON.stringify(p));
    await chup('may-quay-' + goc);
  }
  // phím C đổi vòng: phải → thôi bám
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press('c');
  let goc = await page.evaluate(() => SRAMayQuay.goc);
  await page.keyboard.press('c');
  let goc2 = await page.evaluate(() => SRAMayQuay.goc);
  bc.dong(goc === null && goc2 == 'sau', 'Phím C: đổi vòng (bên phải → thôi bám → phía sau)', goc + ' → ' + goc2);

  // nhìn từ dưới lên ở chế độ máy quay tự do
  await page.click('.cameraSelector .camera');
  await page.waitForTimeout(300);
  await page.click('.cameraSelector > .cameraArc');
  await page.waitForTimeout(300);
  await page.evaluate(() => { let c = babylon.cameraArc; c.setTarget(robot.body.getAbsolutePosition().clone()); c.radius = 40; c.beta = 2.2; c.alpha = -Math.PI / 2 - 0.6; });
  await page.waitForTimeout(800);
  let duoi = await page.evaluate(() => {
    let o = {};
    babylon.scene.onBeforeCameraRenderObservable.addOnce(() => {});
    let m = babylon.scene.getMeshByName('box');
    let ghi = babylon.scene.onAfterCameraRenderObservable.add(function(cam) { if (cam == babylon.cameraArc) { o.vis = m.visibility; o.mat = m.material.backFaceCulling; } });
    return new Promise((xong) => setTimeout(() => { babylon.scene.onAfterCameraRenderObservable.remove(ghi); o.sau = m.visibility; o.y = babylon.cameraArc.globalPosition.y; xong(o); }, 500));
  });
  bc.dong(duoi.y < 0 && duoi.vis < 0.5 && duoi.mat === false && duoi.sau == 1, 'Máy quay tự do xuống dưới mặt sân: mặt sân mờ (độ đục ' + duoi.vis + ') khi vẽ màn hình, xong khung lại đục như cũ', JSON.stringify(duoi));
  await chup('may-quay-duoi-len');
  await page.evaluate(() => { babylon.cameraArc.beta = 1.0; });
  await page.waitForTimeout(500);
  let tren = await page.evaluate(() => new Promise((xong) => { let m = babylon.scene.getMeshByName('box'), o = {}; let g = babylon.scene.onAfterCameraRenderObservable.add((cam) => { if (cam == babylon.cameraArc) o.vis = m.visibility; }); setTimeout(() => { babylon.scene.onAfterCameraRenderObservable.remove(g); xong(o); }, 400); }));
  bc.dong(tren.vis == 1, 'Máy quay trở lên trên mặt sân: mặt sân đục bình thường', JSON.stringify(tren));

  await browser.close();
  process.exit(bc.ket());
})();
