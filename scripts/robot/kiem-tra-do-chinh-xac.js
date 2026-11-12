// Kiểm tra độ chính xác "đi tới 50 cm" và "quay 90 độ" của các robot G2 trong giả lập.
// Cần: một web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337)
//       và Playwright (npm i playwright, hoặc bản có sẵn trên máy).
// Chạy: node scripts/robot/kiem-tra-do-chinh-xac.js [co-ban banh-to ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';
const ROBOT_DIR = path.join(__dirname, '..', '..', 'public', 'san-robot-ao', 'robots');
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['co-ban', 'banh-to', 'banh-nho', 'do-line'];
const SPEEDS = (process.env.SIRO_SPEEDS || '25,50,100').split(',').map(Number);

const HEADER =
  'from ev3dev2.motor import *\nimport time\n' +
  'tank = MoveTank(OUTPUT_A, OUTPUT_B)\n';

// Công thức sẽ dùng cho khối "đi tới X cm" và "quay X độ":
//   góc bánh (độ) = X / chu vi bánh * 360
//   quay tại chỗ: góc bánh (độ) = góc robot * khoảng cách hai bánh / đường kính bánh
const MODE = process.env.SIRO_MODE || 'dk';   // dk = bộ điều khiển siro.drivetrain, tho = lệnh motor trần
function dkHeader(cfg) {
  const spacing = cfg.bodyWidth + cfg.wheelWidth + 2 * cfg.wheelToBodyOffset;
  return 'from siro.drivetrain import Drivetrain\nimport time\n' +
    'r = Drivetrain(wheel_diameter=' + cfg.wheelDiameter + ', wheel_spacing=' + spacing + ')\n';
}
function progDrive(cfg, cm, speed) {
  if (MODE == 'dk') return dkHeader(cfg) + 'r.drive_for(' + cm + ', ' + speed + ')\ntime.sleep(1)\n';
  const deg = cm / (Math.PI * cfg.wheelDiameter) * 360;
  return HEADER + 'tank.on_for_degrees(' + speed + ', ' + speed + ', ' + deg.toFixed(3) + ')\ntime.sleep(1)\n';
}
function progTurn(cfg, angle, speed) {
  if (MODE == 'dk') return dkHeader(cfg) + 'r.turn_for(' + angle + ', ' + speed + ')\ntime.sleep(1)\n';
  const spacing = cfg.bodyWidth + cfg.wheelWidth + 2 * cfg.wheelToBodyOffset;
  const deg = angle * spacing / cfg.wheelDiameter;
  return HEADER + 'tank.on_for_degrees(' + speed + ', ' + (-speed) + ', ' + deg.toFixed(3) + ')\ntime.sleep(1)\n';
}

// Vị trí điểm giữa hai bánh (tâm quay) và hướng của robot trên mặt sân
async function pose(page) {
  return page.evaluate(() => {
    const b = robot.body;
    const L = robot.leftWheel.mesh.getAbsolutePosition();
    const R = robot.rightWheel.mesh.getAbsolutePosition();
    const fwd = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, 1), b.getWorldMatrix());
    return { x: (L.x + R.x) / 2, z: (L.z + R.z) / 2, yaw: Math.atan2(fwd.x, fwd.z) * 180 / Math.PI };
  });
}

async function runProgram(page, code) {
  await page.evaluate(async () => { await simPanel.resetSim(); });
  await page.waitForTimeout(1500);
  const p0 = await pose(page);
  await page.evaluate((code) => {
    filesManager.files['main.py'] = code;
    filesManager.modified = true;
    simPanel.runSim();
  }, code);
  await page.waitForTimeout(500);
  const t0 = Date.now();
  while (await page.evaluate(() => skulpt.running)) {
    if (Date.now() - t0 > 60000) throw new Error('quá thời gian');
    await page.waitForTimeout(200);
  }
  const p1 = await pose(page);
  return { p0, p1, giay: (Date.now() - t0) / 1000 };
}

function angDiff(a, b) { let d = a - b; while (d > 180) d -= 360; while (d < -180) d += 360; return d; }

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  // Khung nhìn nhỏ để trình duyệt không màn hình vẫn chạy đủ 60 khung hình/giây như máy học sinh
  const page = await browser.newPage({ viewport: process.env.SIRO_VIEWPORT ? { width: +process.env.SIRO_VIEWPORT.split('x')[0], height: +process.env.SIRO_VIEWPORT.split('x')[1] } : { width: 480, height: 360 } });
  page.on('pageerror', (e) => console.log('Lỗi trang:', e.message));
  page.on('console', (m) => { if (process.env.SIRO_DEBUG) console.log('console:', m.text()); });
  await page.goto(URL);
  await page.waitForFunction(() => typeof babylon != 'undefined' && babylon.world && robot.body, null, { timeout: 60000 });
  // Đóng hộp thoại chào và mở tab Mô phỏng (vòng lặp vật lí chỉ chạy khi tab này mở)
  await page.waitForTimeout(3000);   // chờ Blockly nạp xong rồi mới đổi tab
  await page.evaluate(() => { $('.dialogScreen').remove(); try { $('#navSim').click(); } catch (e) { console.log(e); } });
  await page.waitForTimeout(2000);
  const results = [];
  console.log('FPS:', await page.evaluate(() => babylon.engine.getFps().toFixed(1)));
  for (const name of names) {
    const f = path.join(ROBOT_DIR, name + '.json');
    // Tên không có tệp: lấy mẫu robot có sẵn của GEARS (để so sánh), ví dụ singleFollower
    let json = fs.existsSync(f) ? fs.readFileSync(f, 'utf8')
      : await page.evaluate((n) => JSON.stringify(robotTemplates.find((r) => r.name == n)), name);
    let cfg = JSON.parse(json);
    // Thử nghiệm nhanh: SIRO_PATCH='{"wheelMaxAcceleration":2}' ghi đè một số thông số
    if (process.env.SIRO_PATCH) Object.assign(cfg, JSON.parse(process.env.SIRO_PATCH));
    json = JSON.stringify(cfg);
    await page.evaluate((json) => main.loadRobot(json), json);
    await page.waitForTimeout(2000);
    for (const speed of SPEEDS) {
      const d = await runProgram(page, progDrive(cfg, 50, speed));
      const dist = Math.hypot(d.p1.x - d.p0.x, d.p1.z - d.p0.z);
      if (process.env.SIRO_DEBUG) console.log(await page.evaluate(() => $('.console, #console, .simConsole').text().slice(-300)));
      const lech = Math.abs(angDiff(d.p1.yaw, d.p0.yaw));
      const t = await runProgram(page, progTurn(cfg, 90, speed));
      const quay = angDiff(t.p1.yaw, t.p0.yaw);
      const truot = Math.hypot(t.p1.x - t.p0.x, t.p1.z - t.p0.z);
      const r = { robot: name, cach: MODE, toc_do: speed, di_cm: +dist.toFixed(2), sai_di_cm: +(dist - 50).toFixed(2), lech_huong_do: +lech.toFixed(2),
        quay_do: +quay.toFixed(2), sai_quay_do: +(Math.abs(quay) - 90).toFixed(2), truot_tam_cm: +truot.toFixed(2),
        dat: Math.abs(dist - 50) <= 1 && Math.abs(Math.abs(quay) - 90) <= 2 };
      console.log(JSON.stringify(r));
      results.push(r);
    }
  }
  await browser.close();
  if (process.env.SIRO_OUT) fs.writeFileSync(process.env.SIRO_OUT, JSON.stringify(results, null, 2));
  process.exit(results.every((r) => r.dat) ? 0 : 1);
})();
