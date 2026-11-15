// Chụp ảnh xe lắp mô-đun từ nhiều góc (có và không có khung hitbox).
// Chạy: node scripts/xe/chup-anh.js [thư-mục-lưu]
const { mo, napXe } = require('./chung.js');
const path = require('path');
const fs = require('fs');

const GOC = [
  // tên, alpha (độ, quanh trục đứng), beta (độ từ trục đứng), bán kính, điểm nhìn [x, y, z] trong hệ trục xe
  ['sau-trai', -125, 62, 34, [0, 4, 5]],
  ['sau-phai', -55, 62, 34, [0, 4, 5]],
  ['truoc', 100, 58, 34, [0, 4, 4]],
  ['truoc-trai', 135, 64, 34, [0, 4, 5]],
  ['ben', 180, 80, 32, [0, 4, 4.5]],
  ['tren', -90, 8, 36, [0, 4, 4.5]],
  ['can-canh-cam-bien', 115, 74, 17, [0, 4, 11]],
];

(async () => {
  const dir = process.argv[2] || path.join(process.cwd(), 'anh-xe');
  fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await mo({ viewport: { width: 1100, height: 760 }, dsf: 2 });
  await napXe(page);
  // chỉ chừa khung 3D
  await page.evaluate(() => {
    babylon.setCameraMode('arc');
    const c = document.getElementById('renderCanvas') || babylon.canvas;
    document.body.appendChild(c);
    Array.from(document.body.children).forEach((e) => { if (e != c) e.style.display = 'none'; });
    c.style.position = 'fixed'; c.style.left = '0'; c.style.top = '0'; c.style.width = '100vw'; c.style.height = '100vh'; c.style.zIndex = 99999;
    babylon.engine.resize();
  });
  const chup = async (ten, g, hitbox) => {
    await page.evaluate(([g, hitbox]) => {
      SRAXe.datHienHitbox(hitbox);
      if (hitbox) robot.sraLuoi.forEach((m) => { m.visibility = 0.35; }); else robot.sraLuoi.forEach((m) => { m.visibility = 1; });
      const cam = babylon.cameraArc, b = robot.body.position, tam = robot.sraKhoiLuong.than.tam;
      cam.lowerRadiusLimit = 2; cam.minZ = 0.5;
      cam.setTarget(new BABYLON.Vector3(b.x + g[4][0] - tam[0], g[4][1], b.z + g[4][2] - tam[2]));
      cam.alpha = g[1] * Math.PI / 180; cam.beta = g[2] * Math.PI / 180; cam.radius = g[3];
    }, [g, hitbox]);
    await page.waitForTimeout(700);
    const tep = path.join(dir, 'xe-' + ten + (hitbox ? '-hitbox' : '') + '.png');
    await page.screenshot({ path: tep });
    console.log(tep);
  };
  for (const g of GOC) await chup(g[0], g, false);
  await chup(GOC[0][0], GOC[0], true);
  await chup(GOC[3][0], GOC[3], true);
  await browser.close();
})();
