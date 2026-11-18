// Kiểm tra mô hình phản xạ khuếch tán Lambert của mắt dò line TCRT5000:
// đường tín hiệu theo khoảng cách, cảm biến gắn nghiêng, nâng cao, mặt sân nghiêng, vạch lệch khỏi mắt.
// Chạy: node scripts/xe/kiem-tra-lambert.js [thư-mục-lưu-ảnh]
// Cần web server phục vụ thư mục public ở cổng 1337 (xem chung.js).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { mo, napXe, BaoCao } = require('./chung.js');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');

const bc = new BaoCao();
const anh = process.argv[2];

console.log('1. Đường tín hiệu theo khoảng cách sinh ra từ hình học (so với tài liệu kĩ thuật TCRT5000)');
{
  const ngCanh = { BABYLON: {} };
  vm.createContext(ngCanh);
  const goc = path.join(__dirname, '../../public/san-robot-ao/xe/');
  vm.runInContext(fs.readFileSync(goc + 'hinh-khoi.js', 'utf8') + fs.readFileSync(goc + 'cam-bien.js', 'utf8') + ';this.C = SRAXeCamBien;', ngCanh);
  const C = ngCanh.C, o = C.MAC_DINH.doLine;
  const ds = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5];
  const dinh = C.tinHieuMatPhang(o, 0.25);
  let lechMax = 0;
  const bang = ds.map(function(d) {
    let m = C.tinHieuMatPhang(o, d) / dinh, t = C.dapUng(d);
    lechMax = Math.max(lechMax, Math.abs(m - t));
    return (d * 10) + ' mm: ' + m.toFixed(2) + ' (tài liệu ' + t.toFixed(2) + ')';
  });
  const dinhThat = ds.reduce((a, d) => C.tinHieuMatPhang(o, d) > C.tinHieuMatPhang(o, a) ? d : a, ds[0]);
  bc.dong(dinhThat == 0.25 && lechMax < 0.05, 'đỉnh ở 2,5 mm, lệch so với đồ thị tài liệu dưới 0,05', bang.join(', '));
  bc.dong(Math.abs(C.tinHieuMatPhang(o, 2) / C.tinHieuMatPhang(o, 4) - 4) < 0.6, 'xa hơn 1 cm thì tín hiệu giảm như 1/d² (2 cm so với 4 cm gần gấp 4)',
    (C.tinHieuMatPhang(o, 2) / C.tinHieuMatPhang(o, 4)).toFixed(2));
  bc.dong(Math.abs(C.tinHieuMatPhang(o, 0.6, 0.45) / C.tinHieuMatPhang(o, 0.6, 0.9) - 0.5) < 1e-9, 'tín hiệu tỉ lệ thuận với hệ số phản xạ ρ');
}

console.log('2. Cấu hình tư thế đầu đo');
{
  let c = L.chuanHoaCauHinh({});
  bc.dong(c.nghiengIR == 0 && c.caoIR == 0.6, 'mặc định: nhìn thẳng xuống, mặt đầu đo cách sân 6 mm');
  c = L.chuanHoaCauHinh({ nghiengIR: 47, caoIR: 9 });
  bc.dong(c.nghiengIR == 30 && c.caoIR == 1.2, 'nghiêng tối đa 30°, cao tối đa 12 mm', JSON.stringify([c.nghiengIR, c.caoIR]));
  c = L.chuanHoaCauHinh({ nghiengIR: -30, caoIR: 0.3 });
  bc.dong(c.caoIR >= 0.2 + 0.51 * Math.sin(30 * Math.PI / 180), 'nghiêng 30° thì không cho hạ quá thấp (mép mặt đo chạm sân)', 'cao thấp nhất ' + c.caoIR + ' cm');
  let b = L.lapXe({ nghiengIR: 20, caoIR: 0.8, gam: [{ loai: 'doLine', x: 0, z: 5 }] });
  let dl = b.camBien.filter((m) => m.loai == 'doLine');
  bc.dong(dl.length == 3 && dl.every((m) => Math.abs(m.vt[1] - 0.8) < 1e-9 && Math.abs(m.huong[2] - Math.sin(20 * Math.PI / 180)) < 1e-9 && m.den[2] > 0.9),
    'mắt dưới mũi và dưới gầm cùng nhận độ cao, hướng nhìn và hướng đèn–thu', dl.map((m) => m.ten).join(', '));
}

(async () => {
  console.log('3. Trong trình duyệt');
  const { browser, page } = await mo({ viewport: { width: 1000, height: 700 }, dsf: anh ? 2 : 1 });
  // Tấm phẳng dưới mắt trái (đặt theo vị trí thật của mắt trên sân), có thể nghiêng quanh trục ngang của xe.
  // vachX: vạch đen rộng 2 cm chạy dọc xe, tâm vạch lệch vachX cm sang phải so với mắt.
  const doc = (mau, opt = {}) => page.evaluate(([mau, opt]) => {
    (window._tam || []).forEach((m) => m.dispose());
    window._tam = [];
    robot.body.computeWorldMatrix(true);
    let cfg = robot.sraBanLap.camBien.filter((m) => m.loai == 'doLine' && m.duoi != null).sort((a, b) => a.vt[0] - b.vt[0])[0];
    let c = robot.components.find((k) => k.sraLoai == 'doLine' && !k.sraGam && k.position.x == cfg.vt[0]);
    let kh = robot.sraKhoiLuong.than.tam, q = robot.body.rotationQuaternion, b = robot.body.position, H = SRAHinhKhoi;
    let mat = H.V.cong([b.x, b.y, b.z], H.Q.quay([q.x, q.y, q.z, q.w], H.V.tru(cfg.vt, kh)));
    const tam = (ten, mau, w, h, x, y, z, nghieng, lan) => {
      let m = BABYLON.MeshBuilder.CreateGround(ten, { width: w, height: h }, babylon.scene);
      m.position = new BABYLON.Vector3(x, y, z);
      m.rotation.x = (nghieng || 0) * Math.PI / 180;
      m.rotation.z = (lan || 0) * Math.PI / 180;
      let vl = new BABYLON.StandardMaterial(ten + 'Vl', babylon.scene); vl.diffuseColor = BABYLON.Color3.FromHexString(mau);
      m.material = vl; m.computeWorldMatrix(true); window._tam.push(m); return m;
    };
    let y = opt.y == null ? 0.02 : opt.y;   // tấm cao hơn mặt sân 0,2 mm cho khỏi trùng mặt sân
    tam('tamL', mau, 12, 12, mat[0], y, mat[2], opt.nghieng, opt.lan);
    if (opt.vachX != null) tam('vachL', '#000000', 2, 12, mat[0] + opt.vachX, y + 0.002, mat[2]);
    // tấm nghiêng thì một nửa chui xuống dưới mặt sân: tạm cho mắt chỉ thấy tấm thử
    let an = (opt.nghieng || opt.lan) ? babylon.scene.meshes.filter((m) => !m.sraXe && window._tam.indexOf(m) < 0 && m.isPickable) : [];
    an.forEach((m) => { m.isPickable = false; });
    c.do();
    an.forEach((m) => { m.isPickable = true; });
    let giua = c.chiTiet[0] || {};
    return { v: Math.round(c.tinHieu * 1023), mat: mat.map((a) => +a.toFixed(3)), gocToi: giua.gocToi, gocThu: giua.gocThu };
  }, [mau, opt]);
  const XAM = '#808080';

  // 3a. Gắn nghiêng. Dương: chúc về phía mũi, tức về phía đèn (đèn phía mũi, bộ thu phía sau).
  // Hai trục quang song song nhưng tách nhau 3 mm: chúc về phía đèn thì vùng bộ thu nhìn trượt vào vùng đèn
  // rọi mạnh, bù lại phần ánh sáng tới xiên, nên tín hiệu gần như giữ nguyên tới 20°; chúc ngược lại thì
  // cả hai hiệu ứng cùng làm yếu đi. Mô hình cũ không phân biệt hai chiều.
  let nghieng = [], nghiengCu = [];
  for (const g of [-30, -20, -10, 0, 10, 20, 30]) {
    await napXe(page, { sraXe: { duoi: [{ loai: 'doLine', x: -1.5 }, { loai: 'doLine', x: 1.5 }], nghiengIR: g } });
    let k = await doc(XAM);
    nghieng.push([g, k.v, k.gocToi, k.gocThu]);
    await napXe(page, { sraXe: { duoi: [{ loai: 'doLine', x: -1.5 }, { loai: 'doLine', x: 1.5 }], nghiengIR: g }, sraCamBien: { doLine: { moHinh: 'cu' } } });
    nghiengCu.push([g, (await doc(XAM)).v]);
  }
  const ng = (g) => nghieng.find((x) => x[0] == g);
  bc.dong(ng(-10)[1] < ng(0)[1] && ng(-20)[1] < ng(-10)[1] && ng(-30)[1] < 0.7 * ng(0)[1], 'chúc về phía bộ thu (đuôi xe): tín hiệu giảm mạnh dần',
    nghieng.filter((x) => x[0] <= 0).map((x) => x[0] + '°: ' + x[1]).join(', '));
  bc.dong(Math.abs(ng(10)[1] / ng(0)[1] - 1) < 0.12 && ng(30)[1] < ng(20)[1], 'chúc về phía đèn (mũi xe): gần như giữ nguyên tới 20°, rồi mới giảm',
    nghieng.filter((x) => x[0] >= 0).map((x) => x[0] + '°: ' + x[1]).join(', '));
  bc.dong(Math.abs(ng(20)[3] - 20) < 1 && Math.abs(ng(-20)[3] - 20) < 1, 'tia giữa của bộ thu: góc thu bằng góc nghiêng',
    'nghiêng 20°: góc thu ' + ng(20)[3].toFixed(1) + '°, góc tới ' + ng(20)[2].toFixed(1) + '°; nghiêng −20°: góc thu ' + ng(-20)[3].toFixed(1) + '°, góc tới ' + ng(-20)[2].toFixed(1) + '°');
  console.log('  (mô hình cũ, để so sánh: ' + nghiengCu.map((x) => x[0] + '°: ' + x[1]).join(', ') + ')');

  // 3b. Nâng cao
  let cao = [];
  for (const h of [0.3, 0.6, 0.9, 1.2]) {
    await napXe(page, { sraXe: { duoi: [{ loai: 'doLine', x: -1.5 }, { loai: 'doLine', x: 1.5 }], caoIR: h } });
    cao.push([h, (await doc(XAM)).v]);
  }
  // theo đồ thị tài liệu: 12 mm còn 0,17 / 0,52 ≈ 1/3 so với 6 mm
  bc.dong(cao.every((x, i) => i == 0 || x[1] < cao[i - 1][1]) && cao[3][1] / cao[1][1] > 0.25 && cao[3][1] / cao[1][1] < 0.45,
    'nâng cao: tín hiệu giảm theo đường khoảng cách (12 mm còn khoảng 1/3 so với 6 mm)', cao.map((x) => (x[0] * 10) + ' mm: ' + x[1]).join(', '));

  // 3c. Mặt sân nghiêng dưới mắt nhìn thẳng (xe đứng trên dốc nghiêng ngang, hoặc chúi mũi).
  // Nghiêng quanh trục dọc xe (trục đèn–thu): đối xứng hai bên, giảm gần như cos góc. Nghiêng quanh trục
  // ngang: phía đèn của mặt sân lại gần thì mạnh lên, ra xa thì yếu đi.
  await napXe(page, { sraXe: { duoi: [{ loai: 'doLine', x: -1.5 }, { loai: 'doLine', x: 1.5 }] } });
  let ngang = [], doc_ = [];
  for (const g of [0, 10, 20, 30]) ngang.push([g, (await doc(XAM, { lan: g })).v, (await doc(XAM, { lan: -g })).v]);
  for (const g of [-20, -10, 0, 10, 20]) doc_.push([g, (await doc(XAM, { nghieng: g })).v]);
  bc.dong(ngang.every((x, i) => (i == 0 || x[1] < ngang[i - 1][1]) && Math.abs(x[1] - x[2]) <= 0.03 * x[1]) && Math.abs(ngang[3][1] / ngang[0][1] - Math.cos(30 * Math.PI / 180)) < 0.08,
    'sân nghiêng sang ngang: hai bên như nhau, giảm gần như cos góc (cos 30° = 0,87)', ngang.map((x) => x[0] + '°: ' + x[1] + '/' + x[2]).join(', ') + ' → ' + (ngang[3][1] / ngang[0][1]).toFixed(2));
  bc.dong((doc_[0][1] - doc_[2][1]) * (doc_[4][1] - doc_[2][1]) < 0, 'sân nghiêng dọc: một chiều mạnh lên, chiều kia yếu đi (vì đèn và bộ thu đặt trước sau)', doc_.map((x) => x[0] + '°: ' + x[1]).join(', '));

  // 3d. Vạch đen lệch dần khỏi mắt
  let vach = [];
  for (const dx of [0, 0.5, 0.75, 1, 1.25, 1.5, 2]) vach.push([dx, (await doc('#ffffff', { vachX: dx })).v]);
  bc.dong(vach.every((x, i) => i == 0 || x[1] >= vach[i - 1][1]) && vach[0][1] < 80 && vach[6][1] > 900, 'vạch lệch khỏi mắt: tín hiệu tăng dần từ đen lên trắng, qua mức giữa khi mép vạch dưới mắt',
    vach.map((x) => (x[0] * 10) + ' mm: ' + x[1]).join(', '));

  // 4. Bảng lắp ráp
  await page.evaluate(() => SRABangLapRap.mo());
  await page.waitForSelector('.sra-lr-bang');
  await page.evaluate(() => SRABangLapRap.chon('duoi:0'));       // tư thế đầu đo nằm trong bảng thuộc tính của mắt dò line
  for (let i = 0; i < 2; i++) { await page.click('[data-ir-tu-the="nghiengIR"][data-buoc="5"]'); await page.evaluate(() => SRABangLapRap.choDungXong()); }
  await page.click('[data-ir-tu-the="caoIR"][data-buoc="0.1"]'); await page.evaluate(() => SRABangLapRap.choDungXong());
  let b = await page.evaluate(() => ({ g: SRABangLapRap.cauHinh.nghiengIR, h: SRABangLapRap.cauHinh.caoIR, tb: $('.sra-lr-thong-bao').text(),
    luu: JSON.parse(localStorage.getItem('sanRobotAo.xeLapRap') || '{}').nghiengIR,
    huong: robot.sraBanLap.camBien.filter((m) => m.loai == 'doLine').map((m) => +m.huong[2].toFixed(3)) }));
  bc.dong(b.g == 10 && b.h == 0.7 && b.luu == 10 && b.huong.every((z) => Math.abs(z - Math.sin(10 * Math.PI / 180)) < 1e-3), 'bấm + nghiêng hai lần, + độ cao một lần: nghiêng 10°, cao 7 mm, có lưu lại', JSON.stringify(b));
  if (anh) await page.screenshot({ path: path.join(anh, 'lambert-bang-lap-rap.png') });
  await page.click('.sra-lr-mac-dinh'); await page.evaluate(() => SRABangLapRap.choDungXong());
  bc.dong(await page.evaluate(() => SRABangLapRap.cauHinh.nghiengIR == 0 && SRABangLapRap.cauHinh.caoIR == 0.6), '"Về mặc định" trả về nhìn thẳng, cao 6 mm');
  await browser.close();
  process.exit(bc.ket());
})();
