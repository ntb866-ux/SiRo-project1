// Kiểm tra điều khiển tay trên sân mô phỏng: joystick ảo rồi phím mũi tên.
// Lỗi cũ: nhả hết phím thì simPanel đặt tốc độ bánh = undefined, motor ra NaN, xe giật lùi và quay vòng.
// Chạy: node scripts/xe/kiem-tra-dieu-khien-tay.js
const { mo, napXe, BaoCao } = require('./chung.js');

(async () => {
  const bc = new BaoCao();
  const { browser, page } = await mo({ viewport: { width: 1000, height: 700 } });
  await napXe(page);
  const tuThe = () => page.evaluate(() => ({ x: robot.body.position.x, z: robot.body.position.z, huong: robot.body.rotationQuaternion.toEulerAngles().y * 180 / Math.PI }));

  // joystick: kéo núm lên phía trước chếch phải rồi thả
  await page.click('.joystick > .icon');
  await page.waitForTimeout(300);
  const hop = await page.locator('.icon-virtualJoystick').boundingBox();
  const cx = hop.x + 75, cy = hop.y + 75;
  await page.mouse.move(cx, cy); await page.mouse.down();
  await page.mouse.move(cx + 20, cy - 60, { steps: 10 });
  await page.waitForTimeout(800);
  await page.mouse.up();
  await page.waitForTimeout(800);

  // phím: giữ mũi tên lên 0,8 s rồi nhả
  let a = await tuThe();
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(800); await page.keyboard.up('ArrowUp');
  let b = await tuThe();
  await page.waitForTimeout(1500);
  let c = await tuThe();
  let lenh = await page.evaluate(() => [robot.leftWheel.speed_sp, robot.rightWheel.speed_sp]);
  let rad = a.huong * Math.PI / 180, di = (b.x - a.x) * Math.sin(rad) + (b.z - a.z) * Math.cos(rad);
  bc.dong(di > 3 && Math.abs(b.huong - a.huong) < 3, 'Sau joystick, giữ phím lên: xe tiến thẳng', 'tiến ' + di.toFixed(1) + ' cm, lệch hướng ' + (b.huong - a.huong).toFixed(1) + '°');
  bc.dong(lenh[0] === 0 && lenh[1] === 0 && Math.hypot(c.x - b.x, c.z - b.z) < 2 && Math.abs(c.huong - b.huong) < 2,
    'Nhả phím: lệnh tốc độ về 0, xe dừng tại chỗ, không giật lùi hay xoay', 'trôi ' + Math.hypot(c.x - b.x, c.z - b.z).toFixed(2) + ' cm, xoay ' + (c.huong - b.huong).toFixed(1) + '°');

  // lệnh hỏng gửi thẳng vào motor (mã người dùng): xe không được quay loạn
  await page.evaluate(() => { robot.leftWheel.speed_sp = undefined; robot.rightWheel.speed_sp = NaN; robot.leftWheel.runForever(); robot.rightWheel.runForever(); });
  await page.waitForTimeout(1500);
  let d = await tuThe();
  let u = await page.evaluate(() => [robot.leftWheel.dongCo.u, robot.rightWheel.dongCo.u]);
  bc.dong(u.every(isFinite) && Math.hypot(d.x - c.x, d.z - c.z) < 1 && Math.abs(d.huong - c.huong) < 2, 'Tốc độ undefined/NaN gửi thẳng vào motor: coi như 0, xe đứng yên', 'trôi ' + Math.hypot(d.x - c.x, d.z - c.z).toFixed(2) + ' cm');

  await browser.close();
  process.exit(bc.ket());
})();
