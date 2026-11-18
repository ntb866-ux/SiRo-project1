// Sinh tệp robot của xe lắp mô-đun (public/san-robot-ao/robots/xe-*.json).
// Chạy: node scripts/robot/tao-xe.js
// Các trường kích thước (wheelDiameter, bodyLength…) là để mã có sẵn của GEARS và khung
// thử thách đọc; chúng được tính từ cùng danh mục linh kiện mà trình duyệt dùng để dựng xe.
const fs = require('fs');
const path = require('path');
const L = require('../../public/san-robot-ao/xe/linh-kien.js');

function taoXe(o) {
  const banLap = L.lapXe(o.cauHinh);
  const kl = L.tinhXe(banLap);
  return Object.assign({
    name: o.name,
    shortDescription: o.tenNgan,
    longDescription: '<p>' + o.moTa + '</p>',
    longerDescription: '',
    thumbnail: '',
    color: '#F09C0D', imageType: 'all', imageURL: '',
    wheelFriction: 0.9, bodyFriction: 0.4, casterFriction: 0.25,
    components: [],
    options: {}
  }, L.moTaRobot(banLap, kl));
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
  const r = taoXe(o);
  fs.writeFileSync(path.join(outDir, o.file + '.json'), JSON.stringify(r, null, 2) + '\n');
  // Bản .js nạp ngay sau js/robotTemplates.js: xe đứng đầu danh sách robot nên là robot mặc định
  // của mọi sân ngay từ lúc trang mở (robot cũ của GEARS không còn là mặc định).
  fs.writeFileSync(path.join(outDir, o.file + '.js'),
    '// Sinh bằng scripts/robot/tao-xe.js, đừng sửa tay. Xe lắp mô-đun là robot mặc định của mọi sân.\n' +
    'robotTemplates.unshift(' + JSON.stringify(r) + ');\n');
  console.log(o.file);
});
