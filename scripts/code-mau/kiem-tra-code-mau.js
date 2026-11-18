// Chạy code mẫu của xe lắp mô-đun (public/san-robot-ao/code-mau/) trên từng bài, kiểm tra số sao.
// Mỗi tệp code mẫu ghi số sao mong đợi ở trường "sao"; bài có nhiều phiên bản sân (bienThe)
// thì chạy trên mọi phiên bản, phiên bản nào cũng phải đạt đúng số sao đó. "sao" là mảng (ví dụ [1, 2, 3])
// khi số sao thay đổi giữa các lượt (bài chấm theo thời gian), mỗi lượt chỉ cần đạt một trong các số đó.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337)
//       và Playwright.
// Chạy: node scripts/code-mau/kiem-tra-code-mau.js [phần mã bài ...]
//       SIRO_ANH=thu-muc  → chụp ảnh sân lúc kết thúc mỗi lượt
//       SIRO_THU='[["di",50]]' → thử chương trình khác thay cho code mẫu (khi chỉnh mẫu)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';
const GOC = path.join(__dirname, '../../public/san-robot-ao');
const ANH = process.env.SIRO_ANH;

function dsMau() {
  let ds = [];
  let dm = JSON.parse(fs.readFileSync(path.join(GOC, 'thu-thach/danh-sach.json'), 'utf8'));
  for (const c of dm.chang) for (const id of c.bai) {
    let tep = path.join(GOC, 'code-mau', id + '.json');
    if (fs.existsSync(tep)) ds.push({ id, mau: JSON.parse(fs.readFileSync(tep, 'utf8')) });
  }
  return ds;
}

(async () => {
  const chon = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  if (ANH) fs.mkdirSync(ANH, { recursive: true });
  let loi = 0, soLuot = 0;
  for (const { id, mau } of dsMau()) {
    if (chon.length && !chon.some((c) => id.includes(c))) continue;
    // Mỗi bài một ngữ cảnh mới: bộ nhớ trình duyệt trống, chương trình nạp là code mẫu
    const ctx = await browser.newContext({ viewport: { width: 480, height: 360 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('  Lỗi trang:', e.message));
    await page.goto(URL + '?baiTap=' + id + '&xe=mau');
    await page.waitForFunction(() => window.SRA && SRA.daSanSang, null, { timeout: 90000 });
    await page.evaluate(() => { $('.dialogScreen').remove(); $('#navSim').click(); });
    await page.waitForTimeout(1500);
    const tt = await page.evaluate(() => ({
      tieuDe: SRA.bai.tieuDe, soBT: (SRA.bai.bienThe || []).length, xe: !!(robot.options && robot.options.sraXe),
      coMuc: $('#sraKhung .sra-code-mau.dang-dung').length == 1,
      camBien: (robot.components || []).filter((c) => c.port).map((c) => c.port + ':' + (c.sraLoai || c.type)).join(' '),
    }));
    console.log(id + ' · ' + tt.tieuDe + ' · ' + mau.tenXe + ' [' + tt.camBien + ']');
    if (!tt.xe || !tt.coMuc) { loi++; console.log('  SAI: trang không ở chế độ xe mẫu'); }
    const ds = tt.soBT ? [...Array(tt.soBT).keys()] : [null];
    for (const bt of ds) {
      soLuot++;
      await page.evaluate((bt) => { SRA.bienTheCoDinh = bt; }, bt);
      await page.evaluate((thu) => {
        blockly.workspace.clear();
        blockly.loadXmlText(thu ? SRACodeMau.xml(JSON.parse(thu)) : SRA.codeMau.xml());
        filesManager.modified = false;
        SRA.ketQuaCuoi = null;
      }, process.env.SIRO_THU || null);
      await page.waitForTimeout(800);
      await page.evaluate(() => SRA.chay());
      await page.waitForFunction(() => SRA.ketQuaCuoi, null, { timeout: 400000, polling: 500 });
      const kq = await page.evaluate(() => {
        const k = SRA.ketQuaCuoi;
        const vt = SRA.world.viTriRobot();
        return {
          sao: k.sao, khoi: k.soKhoi, t: k.thoiGian, cham: k.soLanCham,
          vt: vt.x.toFixed(1) + ', ' + vt.y.toFixed(1) + ' @' + vt.goc.toFixed(0) + '°',
          lyDo: k.mucTieu.chiTiet.concat(...k.chiTietSao.map((s) => s.chiTiet)).filter((c) => !c.dat).map((c) => c.lyDo),
        };
      });
      if (ANH) await page.screenshot({ path: path.join(ANH, id.replace(/\//g, '_') + (bt != null ? '_' + bt : '') + '.png') });
      const ok = Array.isArray(mau.sao) ? mau.sao.includes(kq.sao) : kq.sao == mau.sao;
      if (!ok) loi++;
      console.log('  ' + (ok ? 'ĐẠT ' : 'SAI ') + (bt != null ? '[bản ' + bt + '] ' : '') + kq.sao + ' sao (cần ' + [].concat(mau.sao).join(' hoặc ') + '), ' +
        kq.khoi + ' khối, ' + kq.t + ' s, chạm ' + kq.cham + ', cuối ' + kq.vt + (kq.lyDo.length ? ' | ' + kq.lyDo.join(' ') : ''));
    }
    await ctx.close();
  }
  await browser.close();
  console.log(loi ? loi + ' / ' + soLuot + ' lượt sai.' : 'Tất cả ' + soLuot + ' lượt đúng.');
  process.exit(loi ? 1 : 0);
})();
