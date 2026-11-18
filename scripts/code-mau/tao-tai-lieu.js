// Sinh docs/code-mau-xe-lap-rap.md từ các tệp public/san-robot-ao/code-mau/**.json.
// Chạy: node scripts/code-mau/tao-tai-lieu.js
const fs = require('fs');
const path = require('path');

const GOC = path.join(__dirname, '../../public/san-robot-ao');
const RA = path.join(__dirname, '../../docs/code-mau-xe-lap-rap.md');
const C = require(path.join(GOC, 'core/code-mau.js'));

const VT = { GIUA: 'giữa', TRAI: 'trái', PHAI: 'phải' };
const so = (x) => String(x).replace('.', ',');
function gt(v) {
  if (typeof v == 'number') return so(v);
  switch (v[0]) {
    case 'kc': return 'khoảng cách';
    case 'cham': return 'đang chạm';
    case 'goc': return 'góc quay';
    case 'sang': return 'độ sáng ' + VT[v[1]];
    case 'mau': return 'mắt ' + VT[v[1]] + ' thấy ' + v[2];
    case 'bien': return v[1];
    case 'va': return gt(v[1]) + ' và ' + gt(v[2]);
    case 'hoac': return '(' + gt(v[1]) + ' hoặc ' + gt(v[2]) + ')';
    case 'khong': return 'không ' + gt(v[1]);
  }
  return '(' + gt(v[1]) + ' ' + v[0] + ' ' + gt(v[2]) + ')';
}
function dong(ds, lui) {
  let r = [];
  const t = '    '.repeat(lui);
  for (const l of ds) {
    switch (l[0]) {
      case 'di': r.push(t + 'đi tới ' + gt(l[1]) + ' cm'); break;
      case 'lui': r.push(t + 'đi lùi ' + gt(l[1]) + ' cm'); break;
      case 'phai': r.push(t + 'quay phải ' + gt(l[1]) + ' độ'); break;
      case 'trai': r.push(t + 'quay trái ' + gt(l[1]) + ' độ'); break;
      case 'chay': r.push(t + 'đi tới mãi'); break;
      case 'chayLui': r.push(t + 'đi lùi mãi'); break;
      case 'xoay': r.push(t + 'quay ' + (l[1] == 'TRAI' ? 'trái' : 'phải') + ' mãi'); break;
      case 'dung': r.push(t + 'dừng lại'); break;
      case 'toc': r.push(t + 'đặt tốc độ ' + gt(l[1]) + ' %'); break;
      case 'banh': r.push(t + 'chạy bánh trái ' + gt(l[1]) + ' % bánh phải ' + gt(l[2]) + ' %'); break;
      case 'quayBanh': r.push(t + 'quay bánh trái ' + gt(l[1]) + ' bánh phải ' + gt(l[2]) + ' ' + (l[3] == 'DO' ? 'độ' : 'vòng')); break;
      case 'nghi': r.push(t + 'chờ ' + gt(l[1]) + ' giây'); break;
      case 'cho': r.push(t + 'chờ đến khi ' + gt(l[1])); break;
      case 'bip': r.push(t + 'bíp'); break;
      case 'goc0': r.push(t + 'đặt lại góc quay'); break;
      case 'datBien': r.push(t + 'đặt ' + l[1] + ' = ' + gt(l[2])); break;
      case 'tangBien': r.push(t + 'thay đổi ' + l[1] + ' thêm ' + gt(l[2])); break;
      case 'lap': r.push(t + 'lặp lại ' + gt(l[1]) + ' lần'); r.push(...dong(l[2], lui + 1)); break;
      case 'lapMai': r.push(t + 'lặp mãi'); r.push(...dong(l[1], lui + 1)); break;
      case 'lapDen': r.push(t + 'lặp đến khi ' + gt(l[1])); r.push(...dong(l[2], lui + 1)); break;
      case 'neu':
        r.push(t + 'nếu ' + gt(l[1]) + ' thì'); r.push(...dong(l[2], lui + 1));
        if (l[3]) { r.push(t + 'không thì'); r.push(...dong(l[3], lui + 1)); }
        break;
      default: r.push(t + l[0]);
    }
  }
  return r;
}
function camBien(x) {
  let ds = [];
  for (const s of x.sa || []) ds.push('siêu âm trên giá ' + { truoc: 'mũi', trai: 'trái', phai: 'phải', sau: 'đuôi' }[s.gia] + (s.goc ? ' xoay ' + s.goc + '°' : ''));
  for (const d of x.duoi || []) ds.push((d.loai == 'cham' ? 'công tắc chạm' : 'mắt dò line') + ' dưới mũi (x = ' + so(d.x) + ' cm)');
  for (const g of x.gam || []) ds.push('mắt dò line dưới gầm (x = ' + so(g.x) + ', z = ' + so(g.z) + ' cm)');
  for (const t of x.tren || []) ds.push({ gyro: 'con quay', gps: 'GPS', servo: 'servo' }[t.loai] + ' trên nắp');
  return ds.length ? ds.join('; ') : 'không gắn cảm biến';
}

const dm = JSON.parse(fs.readFileSync(path.join(GOC, 'thu-thach/danh-sach.json'), 'utf8'));
let md = '# Kho code mẫu cho xe lắp mô-đun\n\n' +
  'Tệp này sinh tự động bằng `node scripts/code-mau/tao-tai-lieu.js` từ các tệp `public/san-robot-ao/code-mau/<mã-bài>.json`. Sửa tệp JSON rồi chạy lại lệnh, đừng sửa tay tệp này.\n\n' +
  '## Dùng trong lớp\n\n' +
  'Mọi bài chạy bằng xe lắp mô-đun (kiểu mBot); robot cũ của GEARS đã bỏ. Mỗi bài lắp xe theo cách lắp ghi bên dưới. Dưới đề bài có mục **Xe của bài** giải thích vì sao lắp như vậy.\n\n' +
  '- Nút **Mở code mẫu** nạp chương trình mẫu vào vùng khối (thay chương trình đang có).\n' +
  '- Muốn đổi chỗ cảm biến: menu **Robot → Lắp ráp xe (kéo thả cảm biến)**. Nút **Lắp lại xe của bài** trả xe về đúng cách lắp của bài.\n\n' +
  'Gửi thẳng cho học sinh bài kèm chương trình mẫu: thêm `&xe=mau` vào địa chỉ bài, ví dụ `index.html?baiTap=03-cam-bien-mau/01-dung-o-vach&xe=mau`.\n\n' +
  '## Kiểm tra\n\n' +
  '```bash\ncd public && python3 -m http.server 1337 &\nnode scripts/code-mau/kiem-tra-code-mau.js            # mọi bài\nnode scripts/code-mau/kiem-tra-code-mau.js cam-bien-mau   # một nhóm bài\n```\n\n' +
  'Mỗi tệp ghi số sao mong đợi (`sao`); lệnh chạy code mẫu trên mọi phiên bản sân và báo sai nếu số sao khác.\n\n' +
  '## Định dạng tệp\n\n' +
  '| Trường | Nghĩa |\n|---|---|\n' +
  '| `tenXe` | Tên ngắn của cách lắp xe |\n| `giaiThichXe` | Vì sao gắn cảm biến ở những chỗ đó |\n' +
  '| `xe` | Cấu hình lắp ráp, cùng định dạng trường `sraXe` (xem `public/san-robot-ao/xe/README.md`) |\n' +
  '| `robotThem` | (tuỳ chọn) Trường thêm vào tệp robot, ví dụ `sraMotorYeu` |\n' +
  '| `chuongTrinh` | Chương trình viết gọn, xem chú thích đầu `public/san-robot-ao/core/code-mau.js` |\n' +
  '| `giaiThichCode` | Chương trình làm gì |\n| `sao` | Số sao code mẫu đạt được trên mọi phiên bản sân (mảng nếu số sao thay đổi giữa các lượt) |\n| `ghiChu` | (tuỳ chọn) Giới hạn của xe trong bài này |\n\n';

let khongCo = [];
for (const c of dm.chang) {
  let phan = '';
  for (const id of c.bai) {
    let tep = path.join(GOC, 'code-mau', id + '.json');
    let bai = JSON.parse(fs.readFileSync(path.join(GOC, 'thu-thach', id + '.json'), 'utf8'));
    if (!fs.existsSync(tep)) { khongCo.push('- ' + bai.tieuDe + ' (`' + id + '`)'); continue; }
    let m = JSON.parse(fs.readFileSync(tep, 'utf8'));
    phan += '### ' + bai.tieuDe + '\n\n' +
      '`' + id + '` · sân `' + bai.san + '` · code mẫu đạt **' + (Array.isArray(m.sao) ? Math.min(...m.sao) + ' đến ' + Math.max(...m.sao) : m.sao) + ' sao** · ' + C.demKhoi(m.chuongTrinh) + ' khối\n\n' +
      '**Xe: ' + m.tenXe + '.** ' + camBien(m.xe) + '.\n\n' + m.giaiThichXe + '\n\n' +
      '```\nkhi bắt đầu\n' + dong(m.chuongTrinh, 1).join('\n') + '\n```\n\n' + m.giaiThichCode + '\n\n' +
      (m.ghiChu ? '> ' + m.ghiChu + '\n\n' : '');
  }
  if (phan) md += '## ' + c.ten + '\n\n' + phan;
}
if (khongCo.length) {
  md += '## Bài chưa có code mẫu\n\n' +
    'Xe lắp mô-đun chưa có bút vẽ, nên các bài vẽ hình theo mẫu (chấm điểm bằng nét bút) chưa làm được bằng xe này:\n\n' + khongCo.join('\n') + '\n';
}
fs.writeFileSync(RA, md);
console.log('Đã ghi ' + path.relative(process.cwd(), RA));
