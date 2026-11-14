// Chạy lời giải mẫu (và lời giải sai) của chặng "Hiệu chỉnh động cơ" (G5) trong giả lập,
// kiểm tra số sao và in bảng số đo cuối mỗi lượt.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337)
//       và Playwright.
// Chạy: node scripts/thu-thach/kiem-tra-hieu-chinh.js [mã-bài ...]
//       SIRO_THU='{"bai":"03-hieu-chinh/01-chu-vi-banh","robot":"banh-to","ma":[["qb",1,1]]}' node … (chạy thử một chương trình)
const { chromium } = require('playwright');

const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';

// Lời giải viết gọn:
//   ['qb', trái, phải]        quay bánh trái/phải … vòng      ['qbd', trái, phải]  … độ
//   ['cb', trái %, phải %]    chạy bánh trái/phải … %
//   ['cho', giây]  ['dung']  ['td', %] (đặt tốc độ)  ['chay'] (đi tới mãi)
//   ['di', cm]  ['quay', độ]  (khối đi/quay có con quay)
// robot: đổi robot bằng nút chọn robot của bài trước khi chạy.
const CA = {
  '03-hieu-chinh/01-chu-vi-banh': [
    { ten: 'quay 4,5 vòng', sao: 3, ma: [['qb', 4.5, 4.5]] },
    { ten: 'quay 4 vòng (thiếu 1 khoảng)', sao: 0, ma: [['qb', 4, 4]] },
    { ten: 'dùng khối đi 90 cm', sao: 0, ma: [['di', 90]] },
  ],
  '03-hieu-chinh/02-quay-goc-vuong': [
    { ten: 'quay 230° (đã hiệu chỉnh), đi 3 vòng', sao: 3, ma: [['qbd', 230, -230], ['qb', 3, 3]] },
    { ten: 'quay 215° (thiếu ~7°)', sao: 1, ma: [['qbd', 215, -215], ['qb', 3, 3]] },
    { ten: 'quay 90° bánh (nhầm góc bánh với góc xe)', sao: 0, ma: [['qbd', 90, -90], ['qb', 3, 3]] },
  ],
  '03-hieu-chinh/03-banh-to-banh-nho': [
    { ten: 'bánh to 2 vòng', sao: 2, ma: [['qb', 2, 2]] },
    { ten: 'bánh nhỏ 4 vòng (sau bánh to)', robot: 'banh-nho', sao: 3, ma: [['qb', 4, 4]] },
    { ten: 'bánh nhỏ 2 vòng', robot: 'banh-nho', sao: 0, ma: [['qb', 2, 2]] },
  ],
  '03-hieu-chinh/04-bu-motor-lech': [
    { ten: 'trái 50, phải 54,3', sao: 3, ma: [['cb', 50, 54.3], ['cho', 3.5], ['dung']] },
    { ten: 'trái 50, phải 52 (bù chưa đủ)', sao: 0, ma: [['cb', 50, 52], ['cho', 3.5], ['dung']] },
    { ten: 'không bù', sao: 0, ma: [['cb', 50, 50], ['cho', 3.5], ['dung']] },
  ],
  '03-hieu-chinh/05-mot-met-bon-giay': [
    { ten: 'hai bánh 44 %, 4 giây', sao: 3, ma: [['cb', 44, 44], ['cho', 4], ['dung']] },
    { ten: 'hai bánh 43 % theo lí thuyết (thiếu ~2 cm)', sao: 1, ma: [['cb', 43, 43], ['cho', 4], ['dung']] },
    { ten: 'hai bánh 50 %, 4 giây (quá đà)', sao: 0, ma: [['cb', 50, 50], ['cho', 4], ['dung']] },
    { ten: 'đi 100 cm (không để ý thời gian)', sao: 0, ma: [['di', 100]] },
  ],
};

function so(ten, v) {
  return '<value name="' + ten + '"><shadow type="math_number"><field name="NUM">' + v + '</field></shadow></value>';
}
function khoi(l) {
  switch (l[0]) {
    case 'qb': return '<block type="sra_quay_banh"><field name="DON_VI">VONG</field>' + so('TRAI', l[1]) + so('PHAI', l[2]);
    case 'qbd': return '<block type="sra_quay_banh"><field name="DON_VI">DO</field>' + so('TRAI', l[1]) + so('PHAI', l[2]);
    case 'cb': return '<block type="sra_chay_banh">' + so('TRAI', l[1]) + so('PHAI', l[2]);
    case 'cho': return '<block type="sleep"><field name="units">SECONDS</field>' + so('seconds', l[1]);
    case 'dung': return '<block type="sra_dung">';
    case 'td': return '<block type="sra_dat_toc_do">' + so('TOC_DO', l[1]);
    case 'chay': return '<block type="sra_chay"><field name="HUONG">TOI</field>';
    case 'di': return '<block type="sra_di"><field name="HUONG">TOI</field>' + so('CM', l[1]);
    case 'quay': return '<block type="sra_quay"><field name="HUONG">' + (l[1] < 0 ? 'TRAI' : 'PHAI') + '</field>' + so('DO', Math.abs(l[1]));
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

async function moBai(browser, ma) {
  const page = await browser.newPage({ viewport: { width: 480, height: 360 } });
  page.on('pageerror', (e) => console.log('  Lỗi trang:', e.message));
  await page.goto(URL + '?baiTap=' + ma);
  await page.waitForFunction(() => window.SRA && SRA.daSanSang, null, { timeout: 90000 });
  await page.evaluate(() => { $('.dialogScreen').remove(); $('#navSim').click(); });
  await page.evaluate(() => { try { SRA.tienDo.xoaBai(SRA.bai.id); } catch (e) {} });
  await page.waitForTimeout(1500);
  return page;
}

async function chay(page, ca) {
  if (ca.robot) {
    await page.evaluate((t) => $('.sra-chon-robot button[data-tep="' + t + '"]').click(), ca.robot);
    await page.waitForTimeout(2500);
  }
  await page.evaluate((x) => {
    blockly.workspace.clear();
    blockly.loadXmlText(x);
    filesManager.modified = false;
    SRA.ketQuaCuoi = null;
  }, xml(ca.ma));
  await page.waitForTimeout(800);
  await page.evaluate(() => SRA.chay());
  await page.waitForFunction(() => SRA.ketQuaCuoi, null, { timeout: 120000, polling: 500 });
  return page.evaluate(() => {
    const k = SRA.ketQuaCuoi;
    const s = SRA.chuyenDong.so();
    const f = (x, n) => (x == null ? '–' : Number(x).toFixed(n == null ? 1 : n));
    return {
      sao: k.sao,
      soDo: 't ' + f(s.thoiGian, 2) + ' s, vòng ' + f(s.vongTrai, 2) + '/' + f(s.vongPhai, 2) + ', tới ' + f(s.tien) +
        ' cm, quãng ' + f(s.quangDuong) + ' cm, lệch ' + f(s.lechNgang) + ' cm, quay ' + f(s.quayThan) + '°',
      lyDo: k.mucTieu.chiTiet.concat(...k.chiTietSao.map(x => x.chiTiet)).map(c => (c.dat ? '✓ ' : '✗ ') + c.lyDo)
    };
  });
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  if (process.env.SIRO_THU) {
    const t = JSON.parse(process.env.SIRO_THU);
    const page = await moBai(browser, t.bai);
    for (let i = 0; i < (t.lan || 1); i++) {
      const kq = await chay(page, { robot: i == 0 ? t.robot : null, ma: t.ma });
      console.log(kq.sao + ' sao | ' + kq.soDo + (process.env.SIRO_DEBUG ? '\n   ' + kq.lyDo.join('\n   ') : ''));
    }
    await browser.close();
    return;
  }
  const chon = process.argv.slice(2);
  let loi = 0;
  for (const ma of Object.keys(CA)) {
    if (chon.length && !chon.includes(ma)) continue;
    const page = await moBai(browser, ma);
    console.log(ma + ' · ' + await page.evaluate(() => SRA.bai.tieuDe));
    for (const ca of CA[ma]) {
      const kq = await chay(page, ca);
      const ok = kq.sao == ca.sao;
      if (!ok) loi++;
      console.log('  ' + (ok ? 'ĐẠT ' : 'SAI ') + ca.ten + ': ' + kq.sao + ' sao (cần ' + ca.sao + ') | ' + kq.soDo);
      if (!ok || process.env.SIRO_DEBUG) console.log('     ' + kq.lyDo.join('\n     '));
    }
    await page.close();
  }
  await browser.close();
  console.log(loi ? loi + ' trường hợp sai.' : 'Tất cả đúng.');
  process.exit(loi ? 1 : 0);
})();
