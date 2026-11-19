// Chụp lại ảnh xem trước (200 × 200) của các sân GEARS bằng xe khung mBot.
// Ảnh nằm ở public/images/worlds/<tên>.jpg; hộp chọn sân (Sân → Chọn sân) và trang đấu trường dùng chung các ảnh này.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337), Playwright, Python có Pillow.
// Chạy: node scripts/san/chup-anh-xem-truoc.js [tên-sân …]      (không ghi tên: chụp hết)
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { mo } = require('../xe/chung.js');

const THU_MUC = process.env.SIRO_THU_MUC_ANH || path.join(__dirname, '../../public/images/worlds');     // đổi chỗ lưu để xem thử trước
const RAD = Math.PI / 180;

// Mỗi sân: robot mẫu đặt lên sân, máy quay (góc phương vị a và góc từ đỉnh b theo độ, khoảng cách r cm, điểm nhìn t),
// thêm: các xe phụ (vị trí x, z cm; hướng độ; màu khung) cho sân nhiều xe; truocKhiChup: việc làm trên trang trước khi chụp.
const SAN = [
  { ten: 'grid', anh: 'grid.jpg', robot: 'singleFollower', a: -60, b: 50, r: 70, t: 'xe' },
  { ten: 'lineFollowing', anh: 'lineFollowing.jpg', robot: 'doubleFollower', a: -115, b: 52, r: 120, t: 'xe', lech: [25, 0, 35] },
  { ten: 'gyro', anh: 'gyro.jpg', robot: 'singleFollower', a: -50, b: 55, r: 130, t: 'xe', lech: [0, 0, 45] },
  { ten: 'paintball', anh: 'paintball.jpg', robot: 'paintball', a: -125, b: 62, r: 120, t: 'xe', lech: [25, 0, 50], tay: 25 },
  { ten: 'sumo', anh: 'sumo.jpg', robot: 'siro_xeLapRap', a: -80, b: 40, r: 150, t: 'xe', lech: [0, 0, 20] },
  { ten: 'fireRescue', anh: 'fireRescue.jpg', robot: 'doubleFollower', a: -60, b: 45, r: 160, t: 'xe', lech: [20, 0, 40] },
  { ten: 'maze', anh: 'maze.jpg', robot: 'maze', a: -90, b: 25, r: 400, t: [0, 0, -25] },
  { ten: 'missions', anh: 'missions.jpg', robot: 'crane', a: -70, b: 45, r: 140, t: 'xe', lech: [0, 0, 30], tay: 40 },
  { ten: 'football', anh: 'football.jpg', robot: 'siro_xeLapRap', a: -70, b: 50, r: 190, t: [0, 0, 0],
    them: [{ x: -50, z: 25, huong: 120, son: '#1e88e5' }, { x: 45, z: -15, huong: -60, son: '#fdd835' }, { x: -15, z: -35, huong: 30, son: '#43a047' }] },
  { ten: 'arena', anh: 'arena.jpg', robot: 'siro_xeLapRap', a: -90, b: 30, r: 140, t: [0, 0, 0],
    them: [{ x: -35, z: 30, huong: 135, son: '#00acc1' }, { x: 35, z: 30, huong: -135, son: '#c0ca33' }, { x: -35, z: -30, huong: 45, son: '#43a047' }, { x: 35, z: -30, huong: -45, son: '#e53935' }],
    anXeChinh: true }
];

(async () => {
  const chon = process.argv.slice(2);
  let { browser, page } = await mo({ viewport: { width: 900, height: 700 } });
  const tam = fs.mkdtempSync('/tmp/anh-san-');
  for (const s of SAN) {
    if (chon.length && chon.indexOf(s.ten) < 0) continue;
    let du = await page.evaluate(async (s) => {
      const cho = (ms) => new Promise((r) => setTimeout(r, ms));
      babylon.world = worlds.find((w) => w.name == s.ten);
      if (typeof babylon.world.setOptions == 'function') await babylon.world.setOptions(s.tuyChon || (s.ten == 'missions' ? { jsonFile: babylon.world.optionsConfigurations[0].options[0][1] } : {}));
      let t = JSON.parse(JSON.stringify(robotTemplates.find((x) => x.name == s.robot)));
      // sân nhiều xe: sơn khung một màu đánh dấu để tìm ra vật liệu khung khi nhân bản xe
      const DAU = '#ff00fe';
      if (s.them) t.sraXe = Object.assign({}, t.sraXe, { son: { khung: DAU, canGat: null, vanh: null } });
      await main.loadRobot(JSON.stringify(t));
      let t0 = Date.now();
      while (!(robot.sraVatLi && robot.sraVatLi.thoiGian > 0.8) && Date.now() - t0 < 20000) await cho(100);
      if (s.tay != null) {
        let tay = robot.sraTacDong.find((x) => x.sraLoai == 'tay');
        if (tay) { tay.quayToi(s.tay); await cho(2500); }
      }
      await cho(500);
      // xe phụ: nhân bản hình của xe (không có vật lí), sơn khung màu khác
      let khung = (m) => m.material && m.material.id == 'sraXe_son:' + DAU;
      // các vật gốc của xe (thân, bánh, bi, cánh tay…): không có cha
      let goc = robot.body;
      let ds = babylon.scene.meshes.filter((m) => !m.parent && (m === goc || m.sraXe || /^(wheel|sraBi|sraVat)/.test(m.name)));
      // dùng ma trận thế giới đang vẽ (vật lí ghi thẳng vào đó; position của mesh có thể đã cũ, đừng tính lại)
      let nghichB = goc.getWorldMatrix().clone().invert(), yXe = goc.getWorldMatrix().getTranslation().y;
      (s.them || []).forEach(function(x, i) {
        let N = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), BABYLON.Quaternion.RotationYawPitchRoll(x.huong * Math.PI / 180, 0, 0), new BABYLON.Vector3(x.x, yXe, x.z));
        ds.forEach(function(m) {
          let c = m.clone('xePhu' + i + '_' + m.name, null);
          [c].concat(c.getChildMeshes(false)).forEach((x) => { if (x.physicsImpostor) x.physicsImpostor.dispose(); x.physicsImpostor = null; });
          let W = m.getWorldMatrix().multiply(nghichB).multiply(N);
          let sc = new BABYLON.Vector3(), q = new BABYLON.Quaternion(), tt = new BABYLON.Vector3();
          W.decompose(sc, q, tt);
          c.position = tt; c.rotationQuaternion = q; c.scaling = sc;
          // xe phụ đứng yên: khoá ma trận để không gì dời được nó
          c.computeWorldMatrix(true); c.freezeWorldMatrix();
          c.getChildMeshes(false).forEach((x) => { x.computeWorldMatrix(true); x.freezeWorldMatrix(); });
          [c].concat(c.getChildMeshes(false)).forEach(function(mm) {
            if (!khung(mm)) return;
            let v = mm.material.clone(mm.material.id + '_phu' + i);
            v.diffuseColor = BABYLON.Color3.FromHexString(x.son);
            mm.material = v;
          });
        });
      });
      if (s.them) babylon.scene.getMaterialByID('sraXe_son:' + DAU).diffuseColor = BABYLON.Color3.FromHexString(s.sonChinh || '#fb8c00');
      if (s.anXeChinh) ds.forEach((g) => [g].concat(g.getChildMeshes(false)).forEach((m) => m.isVisible = false));
      let p = goc.getAbsolutePosition();
      let dich = s.t == 'xe' ? p.add(new BABYLON.Vector3(...(s.lech || [0, 0, 0])).rotateByQuaternionToRef(goc.absoluteRotationQuaternion, new BABYLON.Vector3())) : new BABYLON.Vector3(...s.t);
      // máy quay riêng để chụp, không đụng máy quay của người dùng
      let huong = goc.absoluteRotationQuaternion.toEulerAngles().y;
      let a = (s.t == 'xe' ? -huong : 0) + s.a * Math.PI / 180;
      let cam = new BABYLON.ArcRotateCamera('mayChup', a, s.b * Math.PI / 180, s.r, dich, babylon.scene);
      cam.fov = 0.8; cam.minZ = 1; cam.maxZ = 10000;
      await cho(300);
      let url = await new Promise((r) => BABYLON.Tools.CreateScreenshotUsingRenderTarget(babylon.engine, cam, { width: 400, height: 400 }, r, 'image/png', 4, true));
      cam.dispose();
      return url;
    }, s);
    let tep = path.join(tam, s.ten + '.png');
    fs.writeFileSync(tep, Buffer.from(du.split(',')[1], 'base64'));
    // thu về 200 × 200, lưu JPEG như ảnh gốc
    execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").resize((200, 200), Image.LANCZOS).save(sys.argv[2], quality=88)', tep, path.join(THU_MUC, s.anh)]);
    console.log(s.ten, '→', s.anh);
  }
  await browser.close();
})();
