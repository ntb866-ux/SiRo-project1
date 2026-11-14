// Chạy lời giải mẫu (và vài lời giải sai) của các bài cảm biến chạm và khoảng cách
// (chặng 03, gói G6) trong giả lập, kiểm tra số sao trên từng biến thể sân.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337)
//       và Playwright.
// Chạy: node scripts/thu-thach/kiem-tra-cam-bien.js [mã-bài ...]
//       SIRO_ANH=thu-muc  → chụp ảnh sân lúc kết thúc mỗi trường hợp
const { chromium } = require('playwright');

const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';
const C = '03-cam-bien-cham-khoang-cach/';

// Lời giải viết gọn.
// Lệnh:  ['di', v] ['lui', v] ['phai', v] ['trai', v] ['chay'] ['chayLui'] ['dung'] ['toc', v] ['bip']
//        ['cho', đk] ['lap', n, [...]] ['lapDen', đk, [...]] ['lapMai', [...]] ['neu', đk, [...], [...]]
// Giá trị: số, ['kc'] (khoảng cách), ['cham'], ['<', a, b], ['>', a, b], ['-', a, b], ['/', a, b]
// sao: số sao cần đạt, hoặc mảng các số chấp nhận được (trường hợp sát ngưỡng).
// bienThe: danh sách chỉ số phiên bản sân cần chạy (mặc định mọi phiên bản).
const CHO_CHAM = [['chay'], ['cho', ['cham']], ['dung'], ['bip']];
const CA = {
  [C + '01-cham-tuong-thi-dung']: [
    { ten: 'chạy, chờ chạm, dừng, bíp', sao: 3, ma: CHO_CHAM },
    { ten: 'thêm khối thừa (5 khối)', sao: 2, ma: [['toc', 50]].concat(CHO_CHAM) },
    { ten: 'không bíp', sao: 2, ma: [['chay'], ['cho', ['cham']], ['dung']] },
    { ten: 'đếm cm cho tường vừa, chạy ở tường xa', sao: 0, bienThe: [2], ma: [['di', 106.5], ['bip']] },
    { ten: 'chạy mà không dừng', sao: 0, bienThe: [0], ma: [['chay'], ['cho', ['cham']]] },
  ],
  [C + '02-dung-cach-tuong-20cm']: [
    { ten: 'chậm 30%, dừng khi < 20.5', sao: 3, ma: [['toc', 30], ['chay'], ['cho', ['<', ['kc'], 20.5]], ['dung']] },
    { ten: 'tốc độ mặc định 50%, dừng khi < 20', sao: [2, 3], ma: [['chay'], ['cho', ['<', ['kc'], 20]], ['dung']] },
    { ten: 'tốc độ 100%, dừng khi < 20 (trôi lố)', sao: 0, bienThe: [2], ma: [['toc', 100], ['chay'], ['cho', ['<', ['kc'], 20]], ['dung']] },
    { ten: 'tốc độ 100%, phanh sớm khi < 27', sao: 3, ma: [['toc', 100], ['chay'], ['cho', ['<', ['kc'], 27]], ['dung']] },
    { ten: 'chờ chạm rồi dừng', sao: 0, bienThe: [1], ma: [['chay'], ['cho', ['cham']], ['dung']] },
  ],
  [C + '03-do-xe-giua-hai-xe']: [
    { ten: 'đi tới (kc − 3) ÷ 2', sao: 3, ma: [['di', ['/', ['-', ['kc'], 3], 2]]] },
    { ten: 'đi tới kc ÷ 2 (quên khe sau)', sao: 2, ma: [['di', ['/', ['kc'], 2]]] },
    { ten: 'đi tới hết kc (đâm xe trước)', sao: 0, bienThe: [0], ma: [['di', ['kc']]] },
    { ten: 'đếm cm cho khe vừa, chạy ở khe rộng', sao: 0, bienThe: [2], ma: [['di', 28.5], ['cho', ['<', ['kc'], 1000]]] },
  ],
  [C + '04-men-theo-tuong']: [
    { ten: 'lặp 4 lần: chạy, chờ < 20, dừng, quay phải', sao: 3, ma: [['lap', 4, [['chay'], ['cho', ['<', ['kc'], 20]], ['dung'], ['phai', 90]]]] },
    { ten: 'viết 4 lần không lặp', sao: 2, bienThe: [1], ma: [].concat(...[1, 2, 3, 4].map(() => [['chay'], ['cho', ['<', ['kc'], 20]], ['dung'], ['phai', 90]])) },
    { ten: 'quay trái (ngược chiều)', sao: 0, bienThe: [0], ma: [['lap', 4, [['chay'], ['cho', ['<', ['kc'], 20]], ['dung'], ['trai', 90]]]] },
    { ten: 'ngưỡng 8 cm: quẹt tường khi quay', sao: [0, 2], bienThe: [0], ma: [['lap', 4, [['chay'], ['cho', ['<', ['kc'], 8]], ['dung'], ['phai', 90]]]] },
    { ten: 'chỉ lặp 3 lần', sao: 0, bienThe: [2], ma: [['lap', 3, [['chay'], ['cho', ['<', ['kc'], 20]], ['dung'], ['phai', 90]]]] },
  ],
  [C + '05-thoat-me-cung-nho']: [
    { ten: 'bàn tay phải, 5 khối', sao: 3, ma: [['lapMai', [['phai', 90], ['lapDen', ['>', ['kc'], 30], [['trai', 90]]], ['di', 50]]]] },
    { ten: 'bàn tay phải dạng nếu/không thì', sao: 2, bienThe: [0], ma: [['lapMai', [['phai', 90], ['neu', ['<', ['kc'], 30], [['trai', 90], ['neu', ['<', ['kc'], 30], [['trai', 90], ['neu', ['<', ['kc'], 30], [['trai', 90]], []]], []]], []], ['di', 50]]]] },
    { ten: 'chỉ đi thẳng khi trống, không rẽ phải trước', sao: 0, bienThe: [1], ma: [['lapMai', [['lapDen', ['>', ['kc'], 30], [['trai', 90]]], ['di', 50]]]] },
  ],
};

function so(v) {
  if (typeof v == 'number') return '<shadow type="math_number"><field name="NUM">' + v + '</field></shadow>';
  return giaTri(v);
}
function vao(ten, v) { return '<value name="' + ten + '">' + so(v) + '</value>'; }
function giaTri(v) {
  switch (v[0]) {
    case 'kc': return '<block type="sra_khoang_cach"></block>';
    case 'cham': return '<block type="sra_dang_cham"></block>';
    case '<': case '>':
      return '<block type="logic_compare"><field name="OP">' + (v[0] == '<' ? 'LT' : 'GT') + '</field>' + vao('A', v[1]) + vao('B', v[2]) + '</block>';
    case '-': case '/': case '+': case '*':
      return '<block type="math_arithmetic"><field name="OP">' + { '-': 'MINUS', '/': 'DIVIDE', '+': 'ADD', '*': 'MULTIPLY' }[v[0]] + '</field>' + vao('A', v[1]) + vao('B', v[2]) + '</block>';
  }
  throw new Error('giá trị lạ ' + v[0]);
}
function khoi(l) {
  switch (l[0]) {
    case 'di': return '<block type="sra_di"><field name="HUONG">TOI</field>' + vao('CM', l[1]);
    case 'lui': return '<block type="sra_di"><field name="HUONG">LUI</field>' + vao('CM', l[1]);
    case 'phai': return '<block type="sra_quay"><field name="HUONG">PHAI</field>' + vao('DO', l[1]);
    case 'trai': return '<block type="sra_quay"><field name="HUONG">TRAI</field>' + vao('DO', l[1]);
    case 'chay': return '<block type="sra_chay"><field name="HUONG">TOI</field>';
    case 'chayLui': return '<block type="sra_chay"><field name="HUONG">LUI</field>';
    case 'dung': return '<block type="sra_dung">';
    case 'toc': return '<block type="sra_dat_toc_do">' + vao('TOC_DO', l[1]);
    case 'bip': return '<block type="beep"><field name="block">BLOCK</field>';
    case 'cho': return '<block type="wait_until">' + '<value name="value">' + giaTri(l[1]) + '</value>';
    case 'lap': return '<block type="controls_repeat_ext">' + vao('TIMES', l[1]) + '<statement name="DO">' + chuoi(l[2]) + '</statement>';
    case 'lapDen': return '<block type="controls_whileUntil"><field name="MODE">UNTIL</field><value name="BOOL">' + giaTri(l[1]) + '</value><statement name="DO">' + chuoi(l[2]) + '</statement>';
    case 'lapMai': return '<block type="sra_lap_mai"><statement name="DO">' + chuoi(l[1]) + '</statement>';
    case 'neu': return '<block type="controls_if"><mutation else="1"></mutation><value name="IF0">' + giaTri(l[1]) + '</value><statement name="DO0">' + chuoi(l[2]) + '</statement><statement name="ELSE">' + chuoi(l[3] || []) + '</statement>';
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
    if (chon.length && !chon.some(c => ma.includes(c))) continue;
    // Khung nhìn nhỏ để trình duyệt không màn hình vẫn chạy đủ 60 khung hình/giây
    const page = await browser.newPage({ viewport: { width: 480, height: 360 } });
    page.on('pageerror', (e) => console.log('  Lỗi trang:', e.message));
    await page.goto(URL + '?baiTap=' + ma);
    await page.waitForFunction(() => window.SRA && SRA.daSanSang, null, { timeout: 90000 });
    await page.evaluate(() => { $('.dialogScreen').remove(); $('#navSim').click(); });
    await page.waitForTimeout(1500);   // chờ GEARS nạp xong chương trình cũ rồi mới thay
    const soBienThe = await page.evaluate(() => (SRA.bai.bienThe || [0]).length);
    console.log(ma + ' · ' + await page.evaluate(() => SRA.bai.tieuDe));
    for (const ca of CA[ma]) {
      const dsBt = ca.bienThe || [...Array(soBienThe).keys()];
      for (const bt of dsBt) {
        await page.evaluate(([x, bt]) => {
          blockly.workspace.clear();
          blockly.loadXmlText(x);
          filesManager.modified = false;
          SRA.ketQuaCuoi = null;
          SRA.bienTheCoDinh = bt;
        }, [xml(ca.ma), bt]);
        await page.waitForTimeout(800);
        await page.evaluate(() => SRA.chay());
        await page.waitForFunction(() => SRA.ketQuaCuoi, null, { timeout: 300000, polling: 500 });
        const kq = await page.evaluate(() => {
          const k = SRA.ketQuaCuoi;
          const vt = SRA.world.viTriRobot();
          return {
            sao: k.sao, khoi: k.soKhoi, t: k.thoiGian, cham: k.soLanCham, kc: SRA.ctxCuoi.khoangCach,
            vt: vt.x.toFixed(1) + ', ' + vt.y.toFixed(1) + ' @' + vt.goc.toFixed(0) + '°',
            lyDo: k.mucTieu.chiTiet.concat(...k.chiTietSao.map(s => s.chiTiet)).filter(c => !c.dat).map(c => c.lyDo)
          };
        });
        if (process.env.SIRO_ANH) {
          await page.screenshot({ path: process.env.SIRO_ANH + '/' + ma.split('/').pop() + '-' + ca.ten.replace(/[^a-z0-9]+/gi, '_') + '-bt' + bt + '.png' });
        }
        const ok = [].concat(ca.sao).includes(kq.sao);
        if (!ok) loi++;
        console.log('  ' + (ok ? 'ĐẠT ' : 'SAI ') + ca.ten + ' [sân ' + (bt + 1) + ']: ' + kq.sao + ' sao (cần ' + ca.sao + '), ' +
          kq.khoi + ' khối, ' + kq.t + ' s, chạm ' + kq.cham + ', kc ' + kq.kc + ', cuối ' + kq.vt +
          (kq.lyDo.length ? ' | ' + kq.lyDo.join(' ') : ''));
      }
    }
    await page.close();
  }
  await browser.close();
  console.log(loi ? loi + ' trường hợp sai.' : 'Tất cả đúng.');
  process.exit(loi ? 1 : 0);
})();
