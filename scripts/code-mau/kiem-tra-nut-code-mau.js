// Kiểm tra nút "Mở code mẫu": học sinh đã sửa xe (gắn thêm, dời cảm biến) thì bấm nút phải lắp lại đúng xe
// của mẫu (cùng cấu hình, cùng cổng) rồi mới nạp chương trình; khối cảm biến ghi cổng theo xe của mẫu.
// Chạy: node scripts/code-mau/kiem-tra-nut-code-mau.js [mã bài …]   (cần máy chủ ở cổng 1337)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';
const BAI = process.argv.slice(2).length ? process.argv.slice(2)
  : ['03-cam-bien-mau/05-do-line-3-cam-bien', '03-cam-bien-cham-khoang-cach/02-dung-cach-tuong-20cm', '03-cam-bien-cham-khoang-cach/01-cham-tuong-thi-dung', '06-gyro/01-quay-90-do-tren-san-bang'];

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let loi = 0;
  for (const id of BAI) {
    const tep = path.join(__dirname, '../../public/san-robot-ao/code-mau/' + id + '.json');
    if (!fs.existsSync(tep)) { console.log(id + ': không có code mẫu, bỏ qua'); continue; }
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => console.log('  Lỗi trang:', e.message));
    await page.goto(URL + '?baiTap=' + id);
    await page.waitForFunction(() => window.SRA && SRA.daSanSang, null, { timeout: 90000 });
    await page.evaluate(() => { $('.dialogScreen').remove(); });
    await page.waitForTimeout(2000);
    // học sinh sửa xe: thêm 4 cảm biến trên giá, dời mọi cảm biến khác sang ổ khác
    await page.evaluate(() => {
      const j = JSON.parse(JSON.stringify(robot.options));
      j.sraXe.sa = [{ loai: 'sieuAm', gia: 'trai' }, { loai: 'sieuAm', gia: 'phai' }, { loai: 'laze', gia: 'sau' }, { loai: 'sieuAm', gia: 'truoc' }];
      j.sraXe.tren = [{ loai: 'gyro', x: 3, z: 3.95 }];
      main.loadRobot(JSON.stringify(j));
    });
    await page.waitForTimeout(3000);
    const truoc = await page.evaluate(() => robot.sraBanLap.camBien.map((c) => c.cong + ':' + c.loai).join(' '));
    await page.click('.sra-nap-code-mau');
    await page.waitForFunction(() => blockly.workspace.getAllBlocks().length > 1, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    const kq = await page.evaluate(() => {
      const mau = SRA.codeMau.mau;
      const cb = robot.sraBanLap.camBien;
      const congTheoNhom = { sra_khoang_cach: ['sieuAm', 'laze'], sra_dang_cham: ['cham'], sra_goc_quay: ['gyro'], sra_dat_lai_goc: ['gyro'] };
      const khoiSai = blockly.workspace.getAllBlocks().filter((b) => congTheoNhom[b.type]).filter((b) => {
        const g = b.getFieldValue('CONG'); const c = cb.find((x) => x.cong == 'in' + g);
        return !c || congTheoNhom[b.type].indexOf(c.loai) < 0;
      }).map((b) => b.type + '=' + b.getFieldValue('CONG'));
      const xeMau = SRALinhKien.lapXe(mau.xe).camBien.map((c) => c.cong + ':' + c.loai).join(' ');
      return { sau: cb.map((c) => c.cong + ':' + c.loai).join(' '), xeMau, khoiSai, nhan: blockly.workspace.getAllBlocks().filter((b) => /sra_(khoang|dang_cham|goc|do_sang|mau_thay|thay)/.test(b.type)).map((b) => b.toString()) };
    });
    const ok = kq.sau == kq.xeMau && !kq.khoiSai.length;
    if (!ok) loi++;
    console.log(id + '\n  xe học sinh sửa: ' + truoc + '\n  ' + (ok ? 'ĐẠT ' : 'SAI ') + 'sau khi bấm: ' + kq.sau + ' | xe mẫu: ' + kq.xeMau +
      (kq.khoiSai.length ? ' | khối sai cổng: ' + kq.khoiSai.join(', ') : '') + '\n  ' + kq.nhan.slice(0, 4).join(' / '));
    await page.close();
  }
  await browser.close();
  console.log(loi ? loi + ' bài sai.' : 'Tất cả đạt.');
  process.exit(loi ? 1 : 0);
})();
