// Đo hồ sơ quay tại chỗ của khối "quay phải 90 độ": góc thân xe và tốc độ hai bánh theo thời gian.
// Chạy: node scripts/xe/do-quay.js [tốc độ %, mặc định 50]
const { chromium } = require('playwright');
const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';
(async () => {
  const toc = +(process.argv[2] || 50);
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 360 } });
  page.on('pageerror', (e) => console.log('  Lỗi trang:', e.message));
  await page.goto(URL + '?baiTap=01-di-chuyen/02-re-toi-o-dich&xe=mau');
  await page.waitForFunction(() => window.SRA && SRA.daSanSang, null, { timeout: 90000 });
  await page.evaluate(() => { $('.dialogScreen').remove(); $('#navSim').click(); });
  await page.waitForTimeout(1500);
  await page.evaluate((toc) => {
    blockly.workspace.clear();
    const ct = (toc == 50 ? [] : [['toc', toc]]).concat([['phai', 90]]);
    blockly.loadXmlText(SRACodeMau.xml(ct));
    window.__mau = [];
    const f0 = () => { const b = robot.body, f = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, 1), b.getWorldMatrix()); return Math.atan2(f.x, f.z) * 180 / Math.PI; };
    window.__h0 = f0();
    setInterval(() => {
      const vl = robot.sraVatLi; if (!vl) return;
      __mau.push([vl.thoiGian, ((f0() - __h0 + 540) % 360) - 180, vl.dongCo[0].omega * 180 / Math.PI, vl.dongCo[1].omega * 180 / Math.PI]);
    }, 10);
  }, toc);
  await page.waitForTimeout(800);
  await page.evaluate(() => SRA.chay());
  await page.waitForTimeout(6000);
  const m = await page.evaluate(() => __mau);
  // bắt đầu khi bánh bắt đầu quay, kết thúc khi góc ổn định
  const i0 = m.findIndex((r) => Math.abs(r[2]) > 5);
  const t0 = m[i0][0];
  const gocCuoi = m[m.length - 1][1];
  const i1 = m.findIndex((r, i) => i > i0 && Math.abs(r[1] - gocCuoi) < 1 && m.slice(i).every((s) => Math.abs(s[1] - gocCuoi) < 1));
  const wMax = Math.max(...m.map((r) => Math.abs(r[2])));
  console.log('Tốc độ ' + toc + ' %: quay ' + gocCuoi.toFixed(1) + '° trong ' + (m[i1][0] - t0).toFixed(2) + ' s, bánh nhanh nhất ' + wMax.toFixed(0) + ' °/s');
  for (let t = 0; t <= m[i1][0] - t0 + 0.2; t += 0.1) {
    const r = m.slice(i0).find((r) => r[0] - t0 >= t); if (!r) break;
    console.log('  t=' + t.toFixed(1) + ' s  góc ' + r[1].toFixed(1).padStart(6) + '°  bánh trái ' + r[2].toFixed(0).padStart(5) + ' °/s  phải ' + r[3].toFixed(0).padStart(5) + ' °/s');
  }
  await browser.close();
})();
