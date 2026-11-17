// Đo tốc độ khung hình và thời gian tính vật lí của xe lắp mô-đun, so với robot chuẩn của các bài cũ.
// Trình duyệt không màn hình vẽ bằng CPU (SwiftShader), nên số đo ở đây thấp hơn máy có card đồ hoạ.
// Chạy: node scripts/xe/do-fps.js
const { mo, napXe, napRobotChuan } = require('./chung.js');

(async () => {
  const { browser, page } = await mo();
  const do_ = async (ten) => {
    await page.evaluate(() => {
      const pl = babylon.scene.getPhysicsEngine().getPhysicsPlugin();
      const goc = pl.executeStep.bind(pl);
      window.doVL = { t: 0, n: 0 };
      pl.executeStep = function(d, i) { const t0 = performance.now(); goc(d, i); doVL.t += performance.now() - t0; doVL.n++; };
      robot.leftWheel.speed_sp = 300; robot.rightWheel.speed_sp = 200; robot.leftWheel.runForever(); robot.rightWheel.runForever();
    });
    await page.waitForTimeout(1500);
    const kq = await page.evaluate(() => new Promise((ok) => {
      doVL.t = 0; doVL.n = 0;
      const f0 = babylon.scene.getFrameId(), t0 = performance.now();
      setTimeout(() => ok({ fps: (babylon.scene.getFrameId() - f0) / (performance.now() - t0) * 1000, vl: doVL.t / doVL.n }), 8000);
    }));
    console.log('  ' + ten.padEnd(22) + kq.fps.toFixed(1) + ' khung hình/giây, vật lí ' + kq.vl.toFixed(2) + ' ms mỗi khung hình');
    return kq;
  };
  console.log('Khung nhìn 480 × 360, không màn hình (SwiftShader):');
  await napRobotChuan(page);
  const cu = await do_('robot chuẩn (co-ban)');
  await napXe(page);
  const moi = await do_('xe lắp mô-đun');
  await browser.close();
  process.exit(moi.fps >= 30 ? 0 : 1);
})();
