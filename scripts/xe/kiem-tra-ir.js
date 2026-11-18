// Kiểm tra chế độ đọc của mắt dò line TCRT5000: tương tự (A0) và số (D0), cùng đèn báo trước mỗi mắt.
// Chạy: node scripts/xe/kiem-tra-ir.js [thư-mục-lưu-ảnh]
const path = require('path');
const { mo, napXe, BaoCao } = require('./chung.js');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');

const bc = new BaoCao();
const anh = process.argv[2];

console.log('1. Cấu hình');
{
  bc.dong(L.chuanHoaCauHinh({}).ir == 'tuongTu' && L.chuanHoaCauHinh({ ir: 'so' }).ir == 'so' && L.chuanHoaCauHinh({ ir: 'xyz' }).ir == 'tuongTu',
    'Mặc định là tương tự; "so" được giữ; giá trị lạ trở về tương tự');
  let b = L.lapXe({ ir: 'so', gam: [{ loai: 'doLine', x: 2, z: 5 }], tren: [{ loai: 'servo', x: 0, z: 4.5, tay: 'doi', gan: ['doLine', null] }] });
  let dl = b.camBien.filter((c) => c.loai == 'doLine');
  bc.dong(dl.length == 4 && dl.every((c) => c.che == 'so'), 'Mọi mắt dò line (dưới mũi, dưới gầm, trên tay quay servo) nhận chế độ của xe', dl.map((c) => c.ten + ':' + c.che).join(', '));
}

(async () => {
  console.log('2. Trong trình duyệt');
  const { browser, page } = await mo({ viewport: { width: 1000, height: 700 }, dsf: anh ? 2 : 1 });
  // mắt trái trên nền trắng, mắt phải trên vạch đen (cả hai mắt dưới mũi), tấm xám để thử mức giữa
  const datNen = (mauTrai, mauPhai) => page.evaluate(([a, b]) => {
    (window._tam || []).forEach((m) => m.dispose());
    window._tam = [];
    robot.body.computeWorldMatrix(true);
    robot.components.filter((c) => c.sraLoai == 'doLine' && !c.sraGam).forEach(function(c, i) {
      let p = c.denBao.getAbsolutePosition();
      let m = BABYLON.MeshBuilder.CreateGround('tamIR', { width: 2.4, height: 6 }, babylon.scene);
      m.position = new BABYLON.Vector3(p.x, 0.02, p.z - 1);
      let vl = new BABYLON.StandardMaterial('tamIR' + i, babylon.scene); vl.diffuseColor = BABYLON.Color3.FromHexString(i == 0 ? a : b);
      m.material = vl; m.computeWorldMatrix(true); window._tam.push(m);
    });
  }, [mauTrai, mauPhai]);
  const doc = () => page.evaluate(() => robot.components.filter((c) => c.sraLoai == 'doLine' && !c.sraGam).map(function(c) {
    let lan = c.do(); c.render(); 
    let rgb = c.getRGB(), d = c.denBao.material.emissiveColor;
    return { che: c.che, rgb: Math.round(rgb[0]), tin: +c.tinHieu.toFixed(2), den: [d.r, d.g, d.b].map((v) => +v.toFixed(2)), alpha: +c.denBao.material.alpha.toFixed(2), x: c.position.x };
  }).sort((a, b) => a.x - b.x));
  const cho = () => page.waitForTimeout(120);

  await napXe(page, { sraXe: { duoi: [{ loai: 'doLine', x: -1.5 }, { loai: 'doLine', x: 1.5 }], sa: [{ gia: 'truoc' }] } });
  await datNen('#ffffff', '#000000'); await cho();
  let t = await doc();
  bc.dong(t[0].che == 'tuongTu' && t[0].rgb > 200 && t[1].rgb < 60 && t[1].rgb > 0, 'Tương tự: nền trắng đọc gần 255, vạch đen đọc thấp nhưng chưa về 0 (còn phản xạ chút ít)', JSON.stringify(t.map((x) => x.rgb)));
  bc.dong(t[0].den[1] < t[1].den[1] && t[0].alpha > t[1].alpha, 'Tương tự: đèn trước mắt trên nền trắng đậm hơn đèn trước mắt trên vạch đen', JSON.stringify(t.map((x) => x.den)));
  await datNen('#8a8a8a', '#000000'); await cho();
  let x = await doc();
  bc.dong(x[0].rgb > t[1].rgb + 40 && x[0].rgb < t[0].rgb - 40, 'Tương tự: nền xám cho mức ở giữa', x[0].rgb + ' (trắng ' + t[0].rgb + ', đen ' + t[1].rgb + ')');

  await napXe(page, { sraXe: { ir: 'so', duoi: [{ loai: 'doLine', x: -1.5 }, { loai: 'doLine', x: 1.5 }], sa: [{ gia: 'truoc' }] } });
  await datNen('#ffffff', '#000000'); await cho();
  t = await doc();
  bc.dong(t.every((c) => c.che == 'so') && t[0].rgb == 255 && t[1].rgb == 0, 'Số: nền trắng đọc đúng 255, vạch đen đọc đúng 0', JSON.stringify(t.map((x) => x.rgb)));
  bc.dong(t[0].den[1] > 0.8 && t[1].den[1] < 0.3, 'Số: đèn xanh sáng trên nền trắng, tắt (xám) trên vạch đen', JSON.stringify(t.map((x) => x.den)));
  await datNen('#8a8a8a', '#3a3a3a'); await cho();
  x = await doc();
  bc.dong(x.every((c) => c.rgb == 0 || c.rgb == 255), 'Số: nền xám cũng chỉ ra 0 hoặc 255 (tuỳ ngưỡng của mạch so sánh)', JSON.stringify(x.map((c) => c.tin + '→' + c.rgb)));

  // chương trình Python đọc độ sáng phản xạ
  await datNen('#ffffff', '#000000');
  let ra = await page.evaluate(() => new Promise(function(xong) {
    filesManager.files['main.py'] = ['#!/usr/bin/env python3', 'from ev3dev2.sensor import *', 'from ev3dev2.sensor.lego import *',
      'a = ColorSensor(INPUT_1)', 'b = ColorSensor(INPUT_2)', 'print("doc", a.reflected_light_intensity, b.reflected_light_intensity)'].join('\n');
    filesManager.modified = true;
    let ghi = simPanel.consoleWrite, ds = [];
    simPanel.consoleWrite = function(s) { ds.push(String(s)); return ghi.apply(this, arguments); };
    simPanel.consoleWriteErrors = function(s) { ds.push('LỖI ' + s); };
    simPanel.runSim();
    let h = setInterval(function() { if (!skulpt.running) { clearInterval(h); simPanel.consoleWrite = ghi; xong(ds.join(' ')); } }, 100);
  }));
  bc.dong(/doc 100 0/.test(ra), 'Python ở chế độ số: reflected_light_intensity chỉ ra 100 hoặc 0', ra.trim());
  if (anh) {
    await page.evaluate(() => { let c = babylon.cameraArc; babylon.setCameraMode('follow'); c.alpha = -Math.PI / 2 + 0.6; c.beta = 1.0; c.radius = 32; });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(anh, 'ir-so.png') });
  }

  // bảng lắp ráp: đổi chế độ
  await napXe(page);
  await page.evaluate(() => SRABangLapRap.mo());
  await page.waitForSelector('.sra-lr-bang');
  await page.evaluate(() => SRABangLapRap.chon('duoi:0'));     // chế độ đọc nằm trong bảng thuộc tính của mắt dò line
  await page.click('[data-ir="so"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  let b = await page.evaluate(() => ({ ir: SRABangLapRap.cauHinh.ir, che: robot.components.filter((c) => c.sraLoai == 'doLine').map((c) => c.che).join(), tb: $('.sra-lr-thong-bao').text(),
    chon: $('[data-ir].chon').attr('data-ir'), luu: JSON.parse(localStorage.getItem('sanRobotAo.xeLapRap') || '{}').ir }));
  bc.dong(b.ir == 'so' && /^(so,?)+$/.test(b.che) && b.chon == 'so' && b.luu == 'so', 'Bảng lắp ráp: bấm "Số (D0)" thì mọi mắt chuyển sang số, nút sáng lên, lưu lại', JSON.stringify(b));
  await page.click('.sra-lr-thao-het'); await page.evaluate(() => SRABangLapRap.choDungXong());
  bc.dong(await page.evaluate(() => SRABangLapRap.cauHinh.ir) == 'so', '"Tháo hết cảm biến" giữ chế độ đọc');
  if (anh) { await page.click('.sra-lr-mac-dinh'); await page.evaluate(() => SRABangLapRap.choDungXong()); await page.evaluate(() => SRABangLapRap.chon('duoi:0')); await page.click('[data-ir="tuongTu"]'); await page.evaluate(() => SRABangLapRap.choDungXong()); await page.screenshot({ path: path.join(anh, 'ir-bang.png') }); }
  await page.click('.sra-lr-mac-dinh'); await page.evaluate(() => SRABangLapRap.choDungXong());
  bc.dong(await page.evaluate(() => SRABangLapRap.cauHinh.ir) == 'tuongTu', '"Về mặc định" trả về tương tự');
  await browser.close();
  process.exit(bc.ket());
})();
