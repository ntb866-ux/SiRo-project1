// Chụp ảnh xem trước (200 × 200) của các robot mẫu xe khung mBot cho hộp Robot → Chọn robot.
// Ảnh lưu ở public/images/robots/xe-mbot/<tên robot>.jpg (ảnh robot GEARS cũ cùng tên vẫn giữ cho trang Tự lắp robot); tệp robot trỏ tới ảnh qua trường thumbnail (scripts/robot/tao-xe.js).
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337), Playwright, Python có Pillow.
// Chạy: node scripts/robot/chup-anh-robot.js [tên-robot …]      (không ghi tên: chụp hết)
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { mo } = require('../xe/chung.js');

const THU_MUC = process.env.SIRO_THU_MUC_ANH || path.join(__dirname, '../../public/images/robots/xe-mbot');

// Mỗi robot: góc phương vị a và góc từ đỉnh b (độ) của máy quay so với mũi xe, khoảng cách r (cm),
// lech: điểm nhìn dời so với tâm xe (hệ xe, cm); tay: góc nâng cánh tay trước khi chụp.
const ROBOT = [
  { ten: 'siro_xeLapRap' },
  { ten: 'singleFollower' },
  { ten: 'doubleFollower' },
  { ten: 'maze', r: 36 },
  { ten: 'maze2', lech: [0, 3, 1] },
  { ten: 'tow', tay: 30, lech: [0, 4, 10], r: 44, a: 150, b: 55 },
  { ten: 'crane', tay: 45, lech: [0, 8, 12], r: 52, a: 150, b: 55 },
  { ten: 'paintball', tay: 25, lech: [0, 4, 10], r: 46, a: 150, b: 55 },
  { ten: 'cage', lech: [0, 2, 5], r: 38 },
  { ten: 'football', lech: [0, 2, 1], r: 36 },
  { ten: 'WROSport', lech: [0, 4, 3], r: 38 },
];

(async () => {
  const chon = process.argv.slice(2);
  let { browser, page } = await mo({ viewport: { width: 900, height: 700 } });
  // sân lưới trống, như ảnh robot của GEARS
  await page.evaluate(async () => { babylon.world = worlds.find((w) => w.name == 'grid'); });
  const tam = fs.mkdtempSync(path.join(require('os').tmpdir(), 'anh-robot-'));
  for (const s of ROBOT) {
    if (chon.length && chon.indexOf(s.ten) < 0) continue;
    let du = await page.evaluate(async (s) => {
      const cho = (ms) => new Promise((r) => setTimeout(r, ms));
      let t = robotTemplates.find((x) => x.name == s.ten);
      if (!t || !t.sraXe) return null;      // robot chưa đổi sang xe mBot
      await main.loadRobot(JSON.stringify(t));
      let t0 = Date.now();
      while (!(robot.sraVatLi && robot.sraVatLi.thoiGian > 0.8) && Date.now() - t0 < 20000) await cho(100);
      if (s.tay != null) {
        let tay = (robot.sraTacDong || []).find((x) => x.sraLoai == 'tay');
        if (tay) { tay.quayToi(s.tay); await cho(5000); }
      }
      await cho(500);
      let goc = robot.body;
      let q = goc.absoluteRotationQuaternion;
      let dich = goc.getAbsolutePosition().add(new BABYLON.Vector3(...(s.lech || [0, 2, 1])).rotateByQuaternionToRef(q, new BABYLON.Vector3()));
      let huong = q.toEulerAngles().y;
      // máy quay riêng: nhìn chéo từ phía trước bên trái (mũi xe là +z, bên trái là −x), hơi trên cao
      let cam = new BABYLON.ArcRotateCamera('mayChupRobot', -huong + (s.a != null ? s.a : 125) * Math.PI / 180, (s.b != null ? s.b : 60) * Math.PI / 180, s.r || 32, dich, babylon.scene);
      cam.fov = 0.8; cam.minZ = 1; cam.maxZ = 10000;
      await cho(300);
      let url = await new Promise((r) => BABYLON.Tools.CreateScreenshotUsingRenderTarget(babylon.engine, cam, { width: 400, height: 400 }, r, 'image/png', 4, true));
      cam.dispose();
      return url;
    }, s);
    if (!du) { console.log(s.ten, ': bỏ qua (chưa phải xe mBot)'); continue; }
    let tep = path.join(tam, s.ten + '.png');
    fs.writeFileSync(tep, Buffer.from(du.split(',')[1], 'base64'));
    execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").resize((200, 200), Image.LANCZOS).save(sys.argv[2], quality=88)', tep, path.join(THU_MUC, s.ten + '.jpg')]);
    console.log(s.ten, '→', s.ten + '.jpg');
  }
  await browser.close();
})();
