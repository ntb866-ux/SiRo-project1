// Tiện ích dùng chung cho các bộ kiểm tra xe lắp mô-đun.
// Cần: web server phục vụ thư mục public ở cổng 1337 (cd public && python3 -m http.server 1337) và Playwright.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.SIRO_URL || 'http://localhost:1337/index.html';
const TEP_XE = path.join(__dirname, '../../public/san-robot-ao/robots/xe-lap-rap.json');

// Mở giả lập. opt.q: chuỗi truy vấn (ví dụ '?baiTap=…&robot=xe-lap-rap'); opt.viewport; opt.dsf
exports.mo = async function(opt = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  // Khung nhìn nhỏ để trình duyệt không màn hình vẫn chạy đủ nhanh
  const page = await browser.newPage({ viewport: opt.viewport || { width: 480, height: 360 }, deviceScaleFactor: opt.dsf || 1 });
  page.on('pageerror', (e) => console.log('  Lỗi trang:', e.message));
  await page.goto(URL + (opt.q || ''));
  await page.waitForFunction(() => typeof babylon != 'undefined' && babylon.world && robot.body, null, { timeout: 90000 });
  await page.waitForFunction(() => typeof blockly != 'undefined' && blockly.workspace && document.querySelector('.blocklyDropDownDiv'), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(() => { $('.dialogScreen').remove(); try { $('#navSim').click(); } catch (e) {} });
  await page.waitForTimeout(1000);
  return { browser, page };
};

// Nạp xe lắp mô-đun vào sân đang mở. suaDoi: các trường ghi đè lên tệp robot (ví dụ { sraXe: { doLine: 3 } })
exports.napXe = async function(page, suaDoi) {
  const json = JSON.parse(fs.readFileSync(TEP_XE, 'utf8'));
  if (suaDoi) Object.assign(json, suaDoi);
  await page.evaluate((j) => main.loadRobot(j), JSON.stringify(json));
  await page.waitForFunction(() => robot.sraVatLi && robot.sraVatLi.thoiGian > 0.3, null, { timeout: 30000 });
  await page.waitForTimeout(500);
};

// Nạp robot chuẩn của các bài G3–G8 (để so sánh)
exports.napRobotChuan = async function(page) {
  const json = fs.readFileSync(path.join(__dirname, '../../public/san-robot-ao/robots/co-ban.json'), 'utf8');
  await page.evaluate((j) => main.loadRobot(j), json);
  await page.waitForTimeout(1500);
};

// In một dòng kết quả và đếm lỗi
exports.BaoCao = function() {
  let loi = 0;
  this.dong = function(dat, ten, chiTiet) {
    if (!dat) loi++;
    console.log('  ' + (dat ? 'ĐẠT ' : 'SAI ') + ten + (chiTiet ? ': ' + chiTiet : ''));
  };
  this.ket = function() {
    console.log(loi ? loi + ' mục sai.' : 'Tất cả đạt.');
    return loi ? 1 : 0;
  };
};
