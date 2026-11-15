// Sinh tệp robot của xe lắp mô-đun (public/san-robot-ao/robots/xe-*.json).
// Chạy: node scripts/robot/tao-xe.js
// Các trường kích thước (wheelDiameter, bodyLength…) là để mã có sẵn của GEARS và khung
// thử thách đọc; chúng được tính từ cùng danh mục linh kiện mà trình duyệt dùng để dựng xe.
const fs = require('fs');
const path = require('path');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');

const TEN_CB = { doLine: 'Cảm biến dò line TCRT5000', sieuAm: 'Cảm biến siêu âm HC-SR04', cham: 'Cảm biến chạm', gyro: 'Gyro (con quay)', gps: 'GPS' };

function taoXe(o) {
  const banLap = L.lapXe(o.cauHinh);
  const kl = L.tinhXe(banLap);
  const tt = L.truongTuongThich(banLap, kl);
  const so = (x, n) => x.toFixed(n == null ? 1 : n).replace('.', ',');
  const cb = banLap.camBien.map((c) => '<li>Cổng ' + c.cong.slice(2) + ' (ổ ' + c.oMach + ' trên mạch chủ): ' + TEN_CB[c.loai] + (c.ten ? ' ' + c.ten : '') + '</li>');
  return Object.assign({
    name: o.name,
    shortDescription: o.tenNgan,
    longDescription: '<p>' + o.moTa + '</p>',
    longerDescription:
      '<h3>Kích thước</h3><ul>' +
      '<li>Đường kính bánh: ' + so(banLap.thongSo.dBanh, 2) + ' cm (chu vi ' + banLap.thongSo.chuViBanh + ' cm)</li>' +
      '<li>Khoảng cách hai bánh (tâm đến tâm): ' + so(2 * banLap.thongSo.xBanh) + ' cm</li>' +
      '<li>Khối lượng: ' + Math.round(kl.tong) + ' g, ' + Math.round(kl.taiBanh * 100) + ' % đè lên hai bánh chủ động</li></ul>' +
      '<h3>Động cơ</h3><ul><li>Cổng A: Bánh trái</li><li>Cổng B: Bánh phải</li></ul>' +
      '<h3>Cảm biến</h3><ul>' + cb.join('') + '</ul>',
    thumbnail: '',
    color: '#F09C0D', imageType: 'all', imageURL: '',
    wheelFriction: 0.9, bodyFriction: 0.4, casterFriction: 0.25,
    components: [],
    options: {},
    sraXe: banLap.cauHinh
  }, tt);
}

const xe = [
  { file: 'xe-lap-rap', name: 'siro_xeLapRap', tenNgan: 'Xe lắp mô-đun (2 bánh)',
    cauHinh: {},
    moTa: 'Xe 2 bánh kiểu xe kit: khung nhôm, hai motor giảm tốc TT, bi tự do phía trước, mạch chủ 8 cổng RJ25. ' +
      'Lắp sẵn cảm biến siêu âm HC-SR04, 2 mắt dò line TCRT5000, cảm biến chạm, gyro và GPS. ' +
      'Hình, va chạm và khối lượng đều tính từ từng linh kiện.' },
];

const outDir = path.join(__dirname, '..', '..', 'public', 'san-robot-ao', 'robots');
xe.forEach(function (o) {
  fs.writeFileSync(path.join(outDir, o.file + '.json'), JSON.stringify(taoXe(o), null, 2) + '\n');
  console.log(o.file);
});
