// Đo các cảm biến của xe lắp mô-đun trong những tình huống biết trước đáp số.
// Chạy: node scripts/xe/kiem-tra-cam-bien.js
const { mo, napXe, BaoCao } = require('./chung.js');
const RAD = Math.PI / 180;

(async () => {
  const { browser, page } = await mo();
  const bc = new BaoCao();
  const cho = (ms) => page.waitForTimeout(ms);
  await napXe(page);
  // Tiện ích trong trang: tìm cảm biến, đặt/xoá vật thử
  await page.evaluate(() => {
    window.T = {
      cb: (loai) => robot.components.filter((c) => c.sraLoai == loai),
      vat: [],
      xoa: function() { this.vat.forEach((m) => { if (m.physicsImpostor) m.physicsImpostor.dispose(); m.dispose(); }); this.vat = []; },
      // điểm trong hệ trục xe → toạ độ sân
      raSan: function(p) {
        const tam = robot.sraKhoiLuong.than.tam, H = SRAHinhKhoi, q = robot.body.rotationQuaternion, b = robot.body.position;
        return H.V.cong([b.x, b.y, b.z], H.Q.quay([q.x, q.y, q.z, q.w], H.V.tru(p, tam)));
      },
      // tường phẳng trước cảm biến siêu âm: mặt tường cách mặt cảm biến d cm, xoay quanh trục đứng gocNghieng độ
      tuong: function(d, gocNghieng, rong, lechNgang, vatLi) {
        const sa = this.cb('sieuAm')[0], g = sa.body.getAbsolutePosition();
        const w = BABYLON.MeshBuilder.CreateBox('tuongThu', { width: rong || 80, height: 30, depth: 2 }, babylon.scene);
        w.rotation.y = (gocNghieng || 0) * Math.PI / 180;
        // lùi tâm hộp 1 cm dọc theo pháp tuyến để MẶT TRƯỚC của tường đi qua điểm cách cảm biến d cm
        w.position = new BABYLON.Vector3(g.x + (lechNgang || 0) + Math.sin(w.rotation.y) * 1, 15, g.z + d + Math.cos(w.rotation.y) * 1);
        if (vatLi) w.physicsImpostor = new BABYLON.PhysicsImpostor(w, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5 }, babylon.scene);
        w.computeWorldMatrix(true);
        this.vat.push(w); return w;
      },
      // tấm màu phẳng dưới mắt dò line (mép trước của tấm tại z, tính trong hệ trục sân)
      tam: function(mau, x0, x1, z0, z1) {
        const m = BABYLON.MeshBuilder.CreateGround('tamThu', { width: x1 - x0, height: z1 - z0 }, babylon.scene);
        m.position = new BABYLON.Vector3((x0 + x1) / 2, 0.02, (z0 + z1) / 2);
        const vl = new BABYLON.StandardMaterial('tamThu' + mau, babylon.scene); vl.diffuseColor = BABYLON.Color3.FromHexString(mau);
        m.material = vl; m.computeWorldMatrix(true);
        this.vat.push(m); return m;
      },
      // cho siêu âm bỏ qua tường bao của sân (để thử được khoảng cách xa hơn kích thước sân)
      boQuaSan: function(bat) { babylon.scene.meshes.forEach((m) => { if (!m.sraXe && this.vat.indexOf(m) == -1) { if (bat) { m._sraCu = m.ultrasonicDetection; m.ultrasonicDetection = 'invisible'; } else m.ultrasonicDetection = m._sraCu; } }); },
      doSA: function() { const sa = this.cb('sieuAm')[0]; sa.do(); return { d: sa.khoangCach, us: sa.thoiGianVong }; },
      doDL: function() { return this.cb('doLine').map((c) => { c.do(); return Math.round(c.tinHieu * 1023); }); }
    };
  });
  // gọi một tiện ích trong trang; kết quả là lưới Babylon thì không gửi về (quá lớn)
  const T = (fn, ...a) => page.evaluate(([f, a]) => { const r = T[f](...a); return (r && r.getClassName) ? null : r; }, [fn, a]);

  console.log('1. HC-SR04: tường phẳng vuông góc ở khoảng cách biết trước');
  await T('boQuaSan', true);
  for (const d of [3, 10, 25, 60, 150, 390]) {
    await T('xoa'); await T('tuong', d, 0, 300);
    const k = await T('doSA');
    bc.dong(Math.abs(k.d - d) <= 0.3, 'tường cách ' + d + ' cm', 'đo ' + k.d.toFixed(1) + ' cm, tiếng vọng về sau ' + k.us + ' µs (lí thuyết ' + Math.round(2 * d / 34300 * 1e6) + ')');
  }
  await T('xoa'); await T('tuong', 420, 0, 300);
  let k = await T('doSA');
  bc.dong(k.d == 400 && k.us == null, 'tường ngoài tầm (420 cm): không có tiếng vọng', 'trả về ' + k.d + ' cm');
  await T('xoa'); await T('tuong', 1, 0, 300);
  k = await T('doSA');
  bc.dong(k.d >= 2 && k.d <= 2.3, 'tường trong vùng mù (1 cm): báo mức thấp nhất', 'trả về ' + k.d.toFixed(1) + ' cm');

  console.log('2. HC-SR04: tường nghiêng (sóng phản xạ lệch hướng) và vật nhỏ lệch trục');
  await T('xoa'); await T('tuong', 40, 20, 300); k = await T('doSA');
  bc.dong(k.us != null && k.d > 36 && k.d <= 40.3, 'tường nghiêng 20°: còn tiếng vọng', 'đo ' + k.d.toFixed(1) + ' cm (điểm gần nhất trong chùm sóng)');
  await T('xoa'); await T('tuong', 40, 50, 300); k = await T('doSA');
  bc.dong(k.us == null, 'tường nghiêng 50°: sóng hắt đi nơi khác, không thấy tường', 'trả về ' + k.d.toFixed(1) + ' cm (không có tiếng vọng)');
  // cột rộng 4 cm cách 50 cm: lệch 5 cm (≈ 5,7°, trong chùm 15°) thì thấy; lệch 15 cm (≈ 17°) thì không
  await T('xoa'); await T('tuong', 50, 0, 4, 5); k = await T('doSA');
  bc.dong(Math.abs(k.d - 50) < 1.5, 'cột 4 cm lệch trục 5 cm ở 50 cm: nằm trong chùm sóng', 'đo ' + k.d.toFixed(1) + ' cm');
  await T('xoa'); await T('tuong', 50, 0, 4, 15); k = await T('doSA');
  bc.dong(k.us == null, 'cột 4 cm lệch trục 15 cm ở 50 cm: nằm ngoài chùm sóng', 'trả về ' + k.d.toFixed(1) + ' cm (không có tiếng vọng)');
  await T('xoa');
  await T('boQuaSan', false);

  console.log('3. TCRT5000: hệ số phản xạ hồng ngoại của mặt sân');
  // vị trí hai mắt trên sân
  const mat = await page.evaluate(() => robot.sraBanLap.camBien.filter((c) => c.loai == 'doLine').map((c) => T.raSan(c.vt)));
  const zM = mat[0][2];
  const doc = async (mau) => { await T('xoa'); await T('tam', mau, -20, 20, zM - 10, zM + 10); return (await T('doDL'))[0]; };
  const trang = await doc('#ffffff'), den = await doc('#000000'), xam = await doc('#808080'), doTuoi = await doc('#ff0000'), lam = await doc('#0000ff'), luc = await doc('#00a000');
  bc.dong(trang > 880 && trang < 1000, 'nền trắng', trang + ' / 1023');
  bc.dong(den < 80, 'nền đen', den + ' / 1023');
  bc.dong(Math.abs(xam / trang - (0.04 + 0.86 * 128 / 255) / 0.9) < 0.03, 'nền xám 50 %', xam + ' / 1023 (tỉ lệ với hệ số phản xạ)');
  bc.dong(doTuoi > 0.9 * trang && lam > 0.9 * trang, 'mực đỏ, mực xanh dương: hồng ngoại gần như không bị hấp thụ, đọc như nền trắng', 'đỏ ' + doTuoi + ', xanh dương ' + lam + ', xanh lá đậm ' + luc);

  console.log('4. TCRT5000: mép vạch đen và khoảng cách tới mặt sân');
  // mép vạch đen chạy ngang, dời dần qua dưới mắt trái: tín hiệu giảm từ trắng xuống đen trong khoảng bằng đường kính vùng nhìn
  const quet = [];
  for (let dz = -0.8; dz <= 0.8001; dz += 0.1) {
    await T('xoa'); await T('tam', '#ffffff', -20, 20, zM - 10, zM + 10); await page.evaluate(([z0]) => { const m = T.tam('#000000', -20, 20, z0, z0 + 10); m.position.y = 0.021; m.computeWorldMatrix(true); }, [zM + dz]);
    quet.push([dz, (await T('doDL'))[0]]);
  }
  const nua = (trang + den) / 2;
  let mep = null;
  for (let i = 1; i < quet.length; i++) if ((quet[i - 1][1] - nua) * (quet[i][1] - nua) <= 0) { const [a, b] = [quet[i - 1], quet[i]]; mep = a[0] + (nua - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); }
  const rong = quet.filter((q) => q[1] > den + 0.1 * (trang - den) && q[1] < trang - 0.1 * (trang - den)).length * 0.1;
  bc.dong(mep != null && Math.abs(mep) < 0.08, 'tín hiệu qua mức giữa đúng lúc mép vạch nằm ngay dưới mắt', 'lệch ' + (mep * 10).toFixed(2) + ' mm');
  bc.dong(rong >= 0.3 && rong <= 1.0, 'vùng chuyển tiếp rộng cỡ đường kính vùng nhìn', rong.toFixed(1) + ' cm (10 % → 90 %)');
  // đổi khoảng cách tới mặt phản xạ (nền xám để tín hiệu không chạm trần 1023): đỉnh ở 2,5 mm, yếu dần khi xa
  const theoCao = [];
  for (const kc of [0.1, 0.25, 0.4, 0.6]) {
    await T('xoa'); await page.evaluate(([z, y]) => { const m = T.tam('#808080', -20, 20, z - 10, z + 10); m.position.y = y; m.computeWorldMatrix(true); }, [zM, mat[0][1] - kc]);
    theoCao.push([kc, (await T('doDL'))[0]]);
  }
  const giam = theoCao.slice(1).every((c, i) => i == 0 || c[1] < theoCao[i][1]);
  bc.dong(giam && theoCao[0][1] < theoCao[1][1], 'tín hiệu mạnh nhất khi mặt sân cách mắt 2,5 mm, yếu dần khi xa hơn (nền xám)',
    theoCao.map((c) => (c[0] * 10) + ' mm: ' + c[1]).join(', '));
  await T('xoa'); await page.evaluate(([z, y]) => { const m = T.tam('#ffffff', -20, 20, z - 10, z + 10); m.position.y = y; m.computeWorldMatrix(true); }, [zM, mat[0][1] - 0.25]);
  const sat = (await T('doDL'))[0];
  bc.dong(sat == 1023, 'nền trắng ở 2,5 mm: tín hiệu chạm trần (bão hoà) như mô-đun thật khi để quá gần', sat + ' / 1023');
  await T('xoa');

  console.log('5. Cảm biến chạm: tấm cản bị ép khi xe tì vào tường');
  await T('tuong', 12, 0, 80, 0, true);
  let cham = await page.evaluate(() => T.cb('cham')[0].isPressed());
  bc.dong(!cham, 'chưa chạm: công tắc mở');
  await page.evaluate(() => { for (const w of [robot.leftWheel, robot.rightWheel]) { w.speed_sp = 200; w.runForever(); } });
  const tCham = await page.evaluate(() => new Promise((ok) => { const t0 = robot.sraVatLi.thoiGian; const h = setInterval(() => { if (T.cb('cham')[0].isPressed() || robot.sraVatLi.thoiGian - t0 > 6) { clearInterval(h); ok(robot.sraVatLi.thoiGian - t0); } }, 5); }));
  const luc_ = await page.evaluate(() => ({ kc: T.cb('sieuAm')[0].getDistance(), goc: T.cb('cham')[0].goc, an: T.cb('cham')[0].isPressed() }));
  bc.dong(luc_.an && tCham < 5, 'tì vào tường: công tắc đóng', 'sau ' + tCham.toFixed(2) + ' s, siêu âm lúc đó đo ' + luc_.kc.toFixed(1) + ' cm');
  await page.evaluate(() => { for (const w of [robot.leftWheel, robot.rightWheel]) { w.speed_sp = -200; w.runForever(); } });
  await cho(700);
  cham = await page.evaluate(() => T.cb('cham')[0].isPressed());
  bc.dong(!cham, 'lùi ra: lò xo đẩy tấm cản về, công tắc mở');
  await page.evaluate(() => { for (const w of [robot.leftWheel, robot.rightWheel]) w.stop(); });
  await T('xoa');

  console.log('6. Gyro: so với hướng thật của xe');
  await napXe(page);
  await page.evaluate(() => { robot.leftWheel.speed_sp = 250; robot.rightWheel.speed_sp = -250; robot.leftWheel.runForever(); robot.rightWheel.runForever(); });
  await cho(3200);
  let g = await page.evaluate(() => ({ goc: T.cb('gyro')[0].getYawAngle(), tocDo: T.cb('gyro')[0].getYawRate(), wy: robot.body.physicsImpostor.getAngularVelocity().y * 180 / Math.PI }));
  bc.dong(Math.abs(g.tocDo - g.wy) < 2, 'tốc độ xoay', 'gyro ' + g.tocDo.toFixed(1) + ' °/s, thật ' + g.wy.toFixed(1) + ' °/s');
  await page.evaluate(() => { robot.leftWheel.stop(); robot.rightWheel.stop(); });
  await cho(800);
  g = await page.evaluate(() => {
    const f = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, 1), robot.body.getWorldMatrix());
    return { goc: T.cb('gyro')[0].getYawAngle(), that: Math.atan2(f.x, f.z) * 180 / Math.PI };
  });
  const lech = ((g.goc - g.that + 540) % 360) - 180;
  bc.dong(Math.abs(lech) < 0.3, 'góc cộng dồn sau khi xoay ' + g.goc.toFixed(0) + '°', 'lệch ' + lech.toFixed(3) + '° so với hướng thật');

  console.log('7. GPS: toạ độ ăng-ten, nhịp cập nhật');
  g = await page.evaluate(() => { const c = T.cb('gps')[0]; c.reset(); const p = c.getPosition(); const vt = robot.sraBanLap.camBien.find((x) => x.loai == 'gps').vt; return { p, that: T.raSan(vt), tanSo: c.tuyChon.tanSo }; });
  const saiGPS = Math.hypot(g.p[0] - g.that[0], g.p[1] - g.that[1], g.p[2] - g.that[2]);
  bc.dong(saiGPS < 0.01, 'vị trí ăng-ten', '[' + g.p.map((x) => x.toFixed(2)).join(', ') + '] cm, sai ' + (saiGPS * 10).toFixed(3) + ' mm');
  await page.evaluate(() => { for (const w of [robot.leftWheel, robot.rightWheel]) { w.speed_sp = 400; w.runForever(); } });
  await cho(600);
  const nhip = await page.evaluate(() => new Promise((ok) => {
    const c = T.cb('gps')[0], vl = robot.sraVatLi; let truoc = c.getPosition()[2], lan = [], t0 = null;
    const h = (dt) => { const z = c.getPosition()[2]; if (z != truoc) { if (t0 != null) lan.push(vl.thoiGian - t0); t0 = vl.thoiGian; truoc = z; } if (lan.length >= 10) { vl.sauBuoc.splice(vl.sauBuoc.indexOf(h), 1); ok(lan.reduce((s, x) => s + x, 0) / lan.length); } };
    vl.sauBuoc.push(h);
  }));
  bc.dong(Math.abs(nhip - 1 / g.tanSo) < 0.01, 'cập nhật ' + g.tanSo + ' lần mỗi giây', 'đo được mỗi ' + (nhip * 1000).toFixed(0) + ' ms');

  await browser.close();
  process.exit(bc.ket());
})();
