// Chạy lời giải mẫu (và vài lời giải sai) của các bài thử thách trong giả lập, kiểm tra số sao.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337)
//       và Playwright.
// Chạy: node scripts/thu-thach/kiem-tra-bai.js [mã-bài ...]
const { chromium } = require('playwright');

const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';

// Lời giải viết gọn: ['di', cm] ['lui', cm] ['phai', độ] ['trai', độ] ['but'] ['lap', n, [...]]
// Thêm cho bài cảm biến (G7): ['chay'] ['dung'] ['toc', %] ['banh', trái %, phải %] ['cho', đk]
//   ['neu', đk, [...], [...không thì]] ['lapDen', đk, [...]] ['datBien', tên, số] ['tangBien', tên, số]
// Điều kiện: ['sang', 'GIUA'|'TRAI'|'PHAI', '<'|'>', số] ['mau', vị trí, 'BLACK'|'RED'|...]
//   ['hoac', đk, đk] ['va', đk, đk] ['bien=', tên, số]
// Bài có "bienThe" thì mỗi trường hợp chạy trên mọi phiên bản sân, phải đạt cùng số sao.
// Khối con quay và lái (G8): ['goc0'] đặt lại góc quay, ['xoay', 'PHAI'|'TRAI'] quay mãi,
// ['choGoc', n] chờ đến khi góc quay > n, ['tocDo', %],
// ['lapDenKhiGan', cm, [...]] lặp cho đến khi khoảng cách phía trước < cm,
// ['neuGocDuong', [...nếu], [...nếu không]],
// ['demBanh', vòng] quay phải bằng cách đếm vòng bánh (move_tank_for 50 %, −50 %).
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
  '07-but-ve/01-tam-giac-deu': [
    { ten: 'lặp 3 lần, quay 120°', sao: 3, ma: [['but'], ['lap', 3, [['di', 100], ['phai', 120]]]] },
    { ten: 'không lặp', sao: 2, ma: [['but'], ['di', 100], ['phai', 120], ['di', 100], ['phai', 120], ['di', 100], ['phai', 120]] },
    { ten: 'quay 60° (nhầm góc trong)', sao: 0, ma: [['but'], ['lap', 3, [['di', 100], ['phai', 60]]]] },
    { ten: 'quên hạ bút', sao: 0, ma: [['lap', 3, [['di', 100], ['phai', 120]]]] },
  ],
  '07-but-ve/02-luc-giac-deu': [
    { ten: 'lặp 6 lần, quay 60°', sao: 3, ma: [['but'], ['lap', 6, [['di', 50], ['phai', 60]]]] },
    { ten: 'thiếu một cạnh', sao: 0, ma: [['but'], ['lap', 5, [['di', 50], ['phai', 60]]]] },
    { ten: 'quay 120°', sao: 0, ma: [['but'], ['lap', 6, [['di', 50], ['phai', 120]]]] },
  ],
  '07-but-ve/03-ngoi-sao-5-canh': [
    { ten: 'lặp 5 lần, quay 144°', sao: 3, ma: [['but'], ['lap', 5, [['di', 100], ['phai', 144]]]] },
    { ten: 'quay 36° (nhầm góc nhọn)', sao: 0, ma: [['but'], ['lap', 5, [['di', 100], ['phai', 36]]]] },
    { ten: 'quay 72° (ngũ giác)', sao: 0, ma: [['but'], ['lap', 5, [['di', 100], ['phai', 72]]]] },
  ],
  '07-but-ve/04-ve-ngoi-nha-theo-mau': [
    { ten: 'đúng góc 30-120-30-90-90', sao: 3, ma: [['but'], ['di', 75], ['phai', 30], ['di', 75], ['phai', 120], ['di', 75], ['phai', 30], ['di', 75], ['phai', 90], ['di', 75], ['phai', 90]] },
    { ten: 'quên lần quay cuối', sao: 2, ma: [['but'], ['di', 75], ['phai', 30], ['di', 75], ['phai', 120], ['di', 75], ['phai', 30], ['di', 75], ['phai', 90], ['di', 75]] },
    { ten: 'mái quay 60° (nhầm góc trong)', sao: 0, ma: [['but'], ['di', 75], ['phai', 30], ['di', 75], ['phai', 60], ['di', 75], ['phai', 30], ['di', 75], ['phai', 90], ['di', 75], ['phai', 90]] },
  ],
  '06-gyro/01-quay-90-do-tren-san-bang': [
    { ten: 'đếm vòng bánh (chương trình có sẵn)', sao: 0, ma: [['demBanh', 0.63]] },
    { ten: 'gyro, tốc độ 50 % (quá đà)', sao: 0, ma: [['goc0'], ['xoay', 'PHAI'], ['choGoc', 90], ['dung']] },
    { ten: 'gyro, tốc độ 10 %', sao: 1, ma: [['tocDo', 10], ['goc0'], ['xoay', 'PHAI'], ['choGoc', 90], ['dung']] },
    { ten: 'gyro, tốc độ 10 %, dừng sớm ở 87°', sao: 2, ma: [['tocDo', 10], ['goc0'], ['xoay', 'PHAI'], ['choGoc', 87], ['dung']] },
    { ten: 'gyro, nhanh rồi chậm', sao: 3, ma: [['goc0'], ['tocDo', 40], ['xoay', 'PHAI'], ['choGoc', 45], ['tocDo', 10], ['xoay', 'PHAI'], ['choGoc', 88], ['dung']] },
  ],
  '06-gyro/02-giu-huong-khi-bi-day': [
    { ten: 'gyro, lái bật tắt', sao: 3, ma: [['goc0'], ['lapDenKhiGan', 20, [['neuGocDuong', [['banh', 30, 50]], [['banh', 50, 30]]]]], ['dung']] },
    { ten: 'không sửa hướng', sao: 0, ma: [['goc0'], ['banh', 50, 50], ['lapDenKhiGan', 20, []], ['dung']] },
  ],
  '03-cam-bien-mau/01-dung-o-vach': [
    { ten: 'đi tới khi tối', sao: 3, ma: [['chay'], ['cho', ['sang', 'GIUA', '<', 50]], ['dung']] },
    { ten: 'chờ thấy màu đen', sao: 2, ma: [['chay'], ['cho', ['mau', 'GIUA', 'BLACK']], ['dung']] },
    { ten: 'đo sẵn quãng đường', sao: 0, bienThe: [0, 2], ma: [['di', 107]] },
  ],
  '03-cam-bien-mau/02-dem-vach': [
    { ten: 'biến đếm', sao: 3, ma: [['datBien', 'số vạch', 0], ['chay'], ['lapDen', ['bien=', 'số vạch', 4], [['cho', ['sang', 'GIUA', '>', 50]], ['cho', ['sang', 'GIUA', '<', 50]], ['tangBien', 'số vạch', 1]]], ['dung']] },
    { ten: 'lặp 3 lần', sao: 2, ma: [['chay'], ['lap', 3, [['cho', ['mau', 'GIUA', 'BLACK']], ['cho', ['mau', 'GIUA', 'WHITE']]]], ['cho', ['mau', 'GIUA', 'BLACK']], ['dung']] },
    { ten: 'quên chờ trắng', sao: 0, ma: [['datBien', 'số vạch', 0], ['chay'], ['lapDen', ['bien=', 'số vạch', 4], [['cho', ['sang', 'GIUA', '<', 50]], ['tangBien', 'số vạch', 1]]], ['dung']] },
  ],
  '03-cam-bien-mau/03-phan-loai-mau': [
    { ten: 'lặp 2 lần', sao: 3, ma: [['lap', 2, [['chay'], ['cho', ['hoac', ['mau', 'GIUA', 'RED'], ['mau', 'GIUA', 'GREEN']]], ['di', 13], ['neu', ['mau', 'GIUA', 'RED'], [['trai', 90]], [['phai', 90]]], ['di', 15]]], ['chay'], ['cho', ['mau', 'GIUA', 'YELLOW']], ['dung']] },
    { ten: 'không đi vào giữa ô', sao: 2, bienThe: [0, 3], ma: [['lap', 2, [['chay'], ['cho', ['hoac', ['mau', 'GIUA', 'RED'], ['mau', 'GIUA', 'GREEN']]], ['neu', ['mau', 'GIUA', 'RED'], [['trai', 90]], [['phai', 90]]], ['di', 15]]], ['chay'], ['cho', ['mau', 'GIUA', 'YELLOW']], ['dung']] },
  ],
  '03-cam-bien-mau/04-do-line-1-cam-bien': [
    { ten: 'bật tắt 25/5', sao: 2, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'GIUA', '<', 50], [['banh', 5, 25]], [['banh', 25, 5]]]]], ['dung']] },
    { ten: 'bật tắt 40/10', sao: 2, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'GIUA', '<', 50], [['banh', 10, 40]], [['banh', 40, 10]]]]], ['dung']] },
    { ten: 'bật tắt 60/15', sao: 3, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'GIUA', '<', 50], [['banh', 15, 60]], [['banh', 60, 15]]]]], ['dung']] },
    { ten: 'bật tắt 60/0', sao: 2, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'GIUA', '<', 50], [['banh', 0, 60]], [['banh', 60, 0]]]]], ['dung']] },
    { ten: 'lái ngược chiều', sao: 0, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'GIUA', '<', 50], [['banh', 40, 10]], [['banh', 10, 40]]]]], ['dung']] },
  ],
  '03-cam-bien-mau/05-do-line-3-cam-bien': [
    { ten: '3 cảm biến', sao: 3, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'TRAI', '<', 50], [['banh', -20, 40]], [['neu', ['sang', 'PHAI', '<', 50], [['banh', 40, -20]], [['banh', 35, 35]]]]]]], ['dung']] },
    { ten: '3 cảm biến chậm', sao: 2, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'TRAI', '<', 50], [['banh', -10, 20]], [['neu', ['sang', 'PHAI', '<', 50], [['banh', 20, -10]], [['banh', 18, 18]]]]]]], ['dung']] },
    { ten: '3 cảm biến quá nhanh, văng khỏi đường', sao: 0, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'TRAI', '<', 50], [['banh', -30, 60]], [['neu', ['sang', 'PHAI', '<', 50], [['banh', 60, -30]], [['banh', 60, 60]]]]]]], ['dung']] },
    { ten: '1 cảm biến bám mép chậm', sao: 0, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'GIUA', '<', 50], [['banh', 5, 25]], [['banh', 25, 5]]]]], ['dung']] },
    { ten: '1 cảm biến bám mép', sao: 0, ma: [['lapDen', ['mau', 'GIUA', 'GREEN'], [['neu', ['sang', 'GIUA', '<', 50], [['banh', 10, 40]], [['banh', 40, 10]]]]], ['dung']] },
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
const BIEN = {};
function idBien(ten) { return BIEN[ten] = BIEN[ten] || 'bien' + Object.keys(BIEN).length; }
function gt(ten, khoiGiaTri) { return '<value name="' + ten + '">' + khoiGiaTri + '</value>'; }
function dk(d) {
  switch (d[0]) {
    case 'sang': return '<block type="logic_compare"><field name="OP">' + (d[2] == '<' ? 'LT' : 'GT') + '</field>' +
      gt('A', '<block type="sra_do_sang"><field name="CAM_BIEN">' + d[1] + '</field></block>') + so('B', d[3]) + '</block>';
    case 'mau': return '<block type="sra_mau_thay"><field name="CAM_BIEN">' + d[1] + '</field><field name="color">' + d[2] + '</field></block>';
    case 'hoac': case 'va': return '<block type="logic_operation"><field name="OP">' + (d[0] == 'va' ? 'AND' : 'OR') + '</field>' +
      gt('A', dk(d[1])) + gt('B', dk(d[2])) + '</block>';
    case 'bien=': return '<block type="logic_compare"><field name="OP">EQ</field>' +
      gt('A', '<block type="variables_get"><field name="VAR" id="' + idBien(d[1]) + '">' + d[1] + '</field></block>') + so('B', d[2]) + '</block>';
  }
  throw new Error('điều kiện lạ ' + d[0]);
}
function khoi(l) {
  switch (l[0]) {
    case 'chay': return '<block type="sra_chay"><field name="HUONG">TOI</field>';
    case 'dung': return '<block type="sra_dung">';
    case 'toc': return '<block type="sra_dat_toc_do">' + so('TOC_DO', l[1]);
    case 'banh': return '<block type="sra_chay_banh">' + so('TRAI', l[1]) + so('PHAI', l[2]);
    case 'cho': return '<block type="wait_until">' + gt('value', dk(l[1]));
    case 'neu': return '<block type="controls_if">' + (l[3] ? '<mutation else="1"></mutation>' : '') + gt('IF0', dk(l[1])) +
      '<statement name="DO0">' + chuoi(l[2]) + '</statement>' + (l[3] ? '<statement name="ELSE">' + chuoi(l[3]) + '</statement>' : '');
    case 'lapDen': return '<block type="controls_whileUntil"><field name="MODE">UNTIL</field>' + gt('BOOL', dk(l[1])) +
      '<statement name="DO">' + chuoi(l[2]) + '</statement>';
    case 'datBien': return '<block type="variables_set"><field name="VAR" id="' + idBien(l[1]) + '">' + l[1] + '</field>' + so('VALUE', l[2]);
    case 'tangBien': return '<block type="math_change"><field name="VAR" id="' + idBien(l[1]) + '">' + l[1] + '</field>' + so('DELTA', l[2]);
    case 'di': return '<block type="sra_di"><field name="HUONG">TOI</field>' + so('CM', l[1]);
    case 'lui': return '<block type="sra_di"><field name="HUONG">LUI</field>' + so('CM', l[1]);
    case 'phai': return '<block type="sra_quay"><field name="HUONG">PHAI</field>' + so('DO', l[1]);
    case 'trai': return '<block type="sra_quay"><field name="HUONG">TRAI</field>' + so('DO', l[1]);
    case 'but': return '<block type="sra_ha_but">';
    case 'lap': return '<block type="controls_repeat_ext">' + so('TIMES', l[1]) + '<statement name="DO">' + chuoi(l[2]) + '</statement>';
    case 'goc0': return '<block type="sra_dat_lai_goc">';
    case 'xoay': return '<block type="sra_xoay"><field name="HUONG">' + l[1] + '</field>';
    case 'choGoc': return '<block type="wait_until"><value name="value">' + soSanh('GT', '<block type="sra_goc_quay"></block>', l[1]) + '</value>';
    case 'tocDo': return '<block type="sra_dat_toc_do">' + so('TOC_DO', l[1]);
    case 'lapDenKhiGan': return '<block type="controls_whileUntil"><field name="MODE">UNTIL</field><value name="BOOL">' +
      soSanh('LT', '<block type="sra_khoang_cach"></block>', l[1]) + '</value><statement name="DO">' + chuoi(l[2]) + '</statement>';
    case 'neuGocDuong': return '<block type="controls_if"><mutation else="1"></mutation><value name="IF0">' +
      soSanh('GT', '<block type="sra_goc_quay"></block>', 0) + '</value><statement name="DO0">' + chuoi(l[1]) +
      '</statement><statement name="ELSE">' + chuoi(l[2]) + '</statement>';
    case 'demBanh': return '<block type="move_tank_for"><field name="units">PERCENT</field><field name="units2">ROTATIONS</field>' +
      so('left', 50) + so('right', -50) + so('duration', l[1]);
  }
  throw new Error('khối lạ ' + l[0]);
}
function soSanh(op, a, b) {
  return '<block type="logic_compare"><field name="OP">' + op + '</field><value name="A">' + a + '</value>' + so('B', b) + '</block>';
}
function chuoi(ds) {
  if (!ds.length) return '';
  return khoi(ds[0]) + (ds.length > 1 ? '<next>' + chuoi(ds.slice(1)) + '</next>' : '') + '</block>';
}
function xml(ds) {
  let than = chuoi(ds);
  let bien = Object.keys(BIEN).map(t => '<variable id="' + BIEN[t] + '">' + t + '</variable>').join('');
  return '<xml xmlns="https://developers.google.com/blockly/xml">' + (bien ? '<variables>' + bien + '</variables>' : '') +
    '<block type="when_started" x="60" y="40" deletable="false"><data>Main</data><next>' + than + '</next></block></xml>';
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
    // Đợi GEARS nạp xong chương trình mở đầu, kẻo nó chèn vào sau khi ta đã nạp lời giải
    await page.waitForTimeout(1500);
    console.log(ma + ' · ' + await page.evaluate(() => SRA.bai.tieuDe));
    const soBT = await page.evaluate(() => (SRA.bai.bienThe || []).length);
    const lan = [];
    for (const ca of CA[ma]) {
      const ds = ca.bienThe || (soBT ? [...Array(soBT).keys()] : [null]);
      for (const bt of ds) lan.push({ ...ca, bt });
    }
    for (const ca of lan) {
      await page.evaluate((bt) => { SRA.bienTheCoDinh = bt; }, ca.bt);
      await page.evaluate((x) => {
        blockly.workspace.clear();
        blockly.loadXmlText(x);
        filesManager.modified = false;
        SRA.ketQuaCuoi = null;
      }, xml(ca.ma));
      await page.waitForTimeout(800);
      await page.evaluate(() => SRA.chay());
      await page.waitForFunction(() => SRA.ketQuaCuoi, null, { timeout: 300000, polling: 500 });
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
      console.log('  ' + (ok ? 'ĐẠT ' : 'SAI ') + ca.ten + (ca.bt != null ? ' [bản ' + ca.bt + ']' : '') + ': ' + kq.sao + ' sao (cần ' + ca.sao + '), ' +
        kq.khoi + ' khối ' + (process.env.SIRO_DEBUG ? kq.loai + ' [' + kq.vao + '] ' : '') + ', ' + kq.t + ' s, chạm ' + kq.cham + ', cuối ' + kq.vt +
        (kq.lyDo.length ? ' | ' + kq.lyDo.join(' ') : ''));
    }
    await page.close();
  }
  await browser.close();
  console.log(loi ? loi + ' trường hợp sai.' : 'Tất cả đúng.');
  process.exit(loi ? 1 : 0);
})();
