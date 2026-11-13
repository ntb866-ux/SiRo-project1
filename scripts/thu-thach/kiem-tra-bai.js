// Chạy lời giải mẫu (và vài lời giải sai) của các bài thử thách trong giả lập, kiểm tra số sao.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337)
//       và Playwright.
// Chạy: node scripts/thu-thach/kiem-tra-bai.js [mã-bài ...]
const { chromium } = require('playwright');

const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';

// Lời giải viết gọn: ['di', cm] ['lui', cm] ['phai', độ] ['trai', độ] ['but'] ['lap', n, [...]]
const CA = {
  '01-di-chuyen/01-tien-toi-o-dich': [
    { ten: 'đúng', sao: 3, ma: [['di', 100]] },
    { ten: 'thiếu quãng', sao: 0, ma: [['di', 60]] },
  ],
  '01-di-chuyen/02-re-toi-o-dich': [
    { ten: 'lên rồi rẽ phải', sao: 3, ma: [['di', 100], ['phai', 90], ['di', 100]] },
    { ten: 'rẽ phải rồi lên', sao: 2, ma: [['phai', 90], ['di', 100], ['trai', 90], ['di', 100]], },
    { ten: 'đi chéo qua hồ', sao: 0, ma: [['phai', 45], ['di', 141.4]] },
  ],
  '01-di-chuyen/06-lai-mbot': [
    { ten: 'mBot lên rồi rẽ phải', sao: 3, ma: [['di', 100], ['phai', 90], ['di', 100]] },
    { ten: 'mBot đi chéo qua hồ', sao: 0, ma: [['phai', 45], ['di', 141.4]] },
  ],
  '01-di-chuyen/03-do-xe-vao-bai': [
    { ten: 'lùi vào bãi', sao: 3, ma: [['di', 75], ['trai', 90], ['lui', 85]] },
    { ten: 'tiến đầu vào bãi', sao: 0, ma: [['di', 75], ['phai', 90], ['di', 85]] },
    { ten: 'lùi quá đà, đụng tường', sao: 1, ma: [['di', 75], ['trai', 90], ['lui', 110]] },
  ],
  '01-di-chuyen/04-qua-ba-diem': [
    { ten: 'tiến, rẽ, tiến, lùi', sao: 3, ma: [['di', 75], ['phai', 90], ['di', 75], ['lui', 125]] },
    { ten: 'quay đầu thay vì lùi', sao: 2, ma: [['di', 75], ['phai', 90], ['di', 75], ['phai', 180], ['di', 125]] },
    { ten: 'sai thứ tự', sao: 0, ma: [['di', 75], ['trai', 90], ['di', 50], ['lui', 125]] },
  ],
  '01-di-chuyen/05-ve-hinh-vuong': [
    { ten: 'hạ bút, 4 cạnh', sao: 3, ma: [['but'], ['di', 75], ['phai', 90], ['di', 75], ['phai', 90], ['di', 75], ['phai', 90], ['di', 75], ['phai', 90]] },
    { ten: 'quên góc cuối, không bút', sao: 1, ma: [['di', 75], ['phai', 90], ['di', 75], ['phai', 90], ['di', 75], ['phai', 90], ['di', 75]] },
    { ten: 'cắt chéo', sao: 0, ma: [['di', 75], ['phai', 135], ['di', 106.07], ['trai', 135], ['di', 75], ['phai', 135], ['di', 106.07]] },
  ],
  '02-vong-lap/01-hinh-vuong-vong-lap': [
    { ten: 'lặp 4 lần', sao: 3, ma: [['lap', 4, [['di', 100], ['phai', 90]]]] },
    { ten: 'có bút, 4 khối', sao: 2, ma: [['but'], ['lap', 4, [['di', 100], ['phai', 90]]]] },
    { ten: 'không dùng lặp', sao: 0, ma: [['di', 100], ['phai', 90], ['di', 100], ['phai', 90], ['di', 100], ['phai', 90], ['di', 100], ['phai', 90]] },
    { ten: 'lặp 3 lần', sao: 0, ma: [['lap', 3, [['di', 100], ['phai', 90]]]] },
  ],
};

function so(ten, v) {
  return '<value name="' + ten + '"><shadow type="math_number"><field name="NUM">' + v + '</field></shadow></value>';
}
function khoi(l) {
  switch (l[0]) {
    case 'di': return '<block type="sra_di"><field name="HUONG">TOI</field>' + so('CM', l[1]);
    case 'lui': return '<block type="sra_di"><field name="HUONG">LUI</field>' + so('CM', l[1]);
    case 'phai': return '<block type="sra_quay"><field name="HUONG">PHAI</field>' + so('DO', l[1]);
    case 'trai': return '<block type="sra_quay"><field name="HUONG">TRAI</field>' + so('DO', l[1]);
    case 'but': return '<block type="sra_ha_but">';
    case 'lap': return '<block type="controls_repeat_ext">' + so('TIMES', l[1]) + '<statement name="DO">' + chuoi(l[2]) + '</statement>';
  }
  throw new Error('khối lạ ' + l[0]);
}
function chuoi(ds) {
  if (!ds.length) return '';
  return khoi(ds[0]) + (ds.length > 1 ? '<next>' + chuoi(ds.slice(1)) + '</next>' : '') + '</block>';
}
function xml(ds) {
  return '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '<block type="when_started" x="60" y="40" deletable="false"><data>Main</data><next>' + chuoi(ds) + '</next></block></xml>';
}

(async () => {
  const chon = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let loi = 0;
  for (const ma of Object.keys(CA)) {
    if (chon.length && !chon.includes(ma)) continue;
    // Khung nhìn nhỏ để trình duyệt không màn hình vẫn chạy đủ 60 khung hình/giây
    const page = await browser.newPage({ viewport: { width: 480, height: 360 } });
    page.on('pageerror', (e) => console.log('  Lỗi trang:', e.message));
    await page.goto(URL + '?baiTap=' + ma);
    await page.waitForFunction(() => window.SRA && SRA.daSanSang, null, { timeout: 90000 });
    await page.evaluate(() => { $('.dialogScreen').remove(); $('#navSim').click(); });
    console.log(ma + ' · ' + await page.evaluate(() => SRA.bai.tieuDe));
    for (const ca of CA[ma]) {
      await page.evaluate((x) => {
        blockly.workspace.clear();
        blockly.loadXmlText(x);
        filesManager.modified = false;
        SRA.ketQuaCuoi = null;
      }, xml(ca.ma));
      await page.waitForTimeout(800);
      await page.evaluate(() => SRA.chay());
      await page.waitForFunction(() => SRA.ketQuaCuoi, null, { timeout: 120000, polling: 500 });
      const kq = await page.evaluate(() => {
        const k = SRA.ketQuaCuoi;
        const vt = SRA.world.viTriRobot();
        return {
          sao: k.sao, khoi: k.soKhoi, loai: JSON.stringify(SRA.ctxCuoi && SRA.ctxCuoi.loaiKhoi), vao: SRA.ctxCuoi && SRA.ctxCuoi.thuTuVao.join('>'), t: k.thoiGian, cham: k.soLanCham,
          vt: vt.x.toFixed(1) + ', ' + vt.y.toFixed(1) + ' @' + vt.goc.toFixed(0) + '°',
          lyDo: k.mucTieu.chiTiet.concat(...k.chiTietSao.map(s => s.chiTiet)).filter(c => !c.dat).map(c => c.lyDo)
        };
      });
      const ok = kq.sao == ca.sao;
      if (!ok) loi++;
      console.log('  ' + (ok ? 'ĐẠT ' : 'SAI ') + ca.ten + ': ' + kq.sao + ' sao (cần ' + ca.sao + '), ' +
        kq.khoi + ' khối ' + (process.env.SIRO_DEBUG ? kq.loai + ' [' + kq.vao + '] ' : '') + ', ' + kq.t + ' s, chạm ' + kq.cham + ', cuối ' + kq.vt +
        (kq.lyDo.length ? ' | ' + kq.lyDo.join(' ') : ''));
    }
    await page.close();
  }
  await browser.close();
  console.log(loi ? loi + ' trường hợp sai.' : 'Tất cả đúng.');
  process.exit(loi ? 1 : 0);
})();
