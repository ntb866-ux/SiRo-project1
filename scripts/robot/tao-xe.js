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

// Robot mẫu của GEARS (menu Robot → Chọn robot) dựng lại bằng xe khung mBot: giữ tên, số cảm biến, cổng
// (chương trình cũ vẫn chạy) và các bộ phận gắn kèm; vị trí lấy chỗ gần nhất mà khung mBot có.
const GYRO = { loai: 'gyro', x: -3, z: 3.95 }, GPS = { loai: 'gps', x: 3, z: 4.25 };
const SA_MUI = { gia: 'truoc', u: 0 };
const NAM_CHAM_GAM = { loai: 'namCham', x: 0, z: 4 };
const MAU_HAI = [{ loai: 'mau', x: -1.5 }, { loai: 'mau', x: 1.5 }];
const mau = [
  { name: 'singleFollower', tenNgan: '#robot-singleFollowerShort#',
    cauHinh: { sa: [SA_MUI], duoi: [{ loai: 'mau', x: 0 }], tren: [GYRO, GPS], gam: [NAM_CHAM_GAM], but: true },
    moTa: 'Xe khung mBot dò đường bằng một cảm biến màu RGB TCS34725 ở giữa thanh dưới mũi. ' +
      'Kèm siêu âm HC-SR04 ở mũi, gyro và GPS trên nắp, bút vẽ ở tâm quay và nam châm điện KK-P20/15 dưới gầm để nhặt vật bằng sắt. ' +
      'Cổng giống robot cũ cùng tên (màu 1, siêu âm 2, gyro 3, GPS 4, bút 5, nam châm C) nên chương trình cũ vẫn chạy. ' +
      'Khác robot cũ: bút nằm ở tâm quay giữa hai bánh nên nam châm dời ra trước bút 4 cm.' },
  { name: 'doubleFollower', tenNgan: '#robot-doubleFollowerShort#',
    cauHinh: { sa: [SA_MUI], duoi: MAU_HAI, tren: [GYRO, GPS], gam: [NAM_CHAM_GAM] },
    moTa: 'Xe khung mBot dò đường bằng hai cảm biến màu RGB TCS34725 dưới mũi, cách nhau 3 cm. ' +
      'Kèm siêu âm HC-SR04 ở mũi, gyro và GPS trên nắp, nam châm điện KK-P20/15 dưới gầm để nhặt vật bằng sắt. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, siêu âm 3, gyro 4, GPS 5, nam châm C). ' +
      'Khác robot cũ: hai cảm biến màu gần nhau hơn (3 cm thay vì 4 cm) cho vừa thanh dưới mũi.' },
  { name: 'maze', tenNgan: '#robot-mazeShort#',
    cauHinh: { sa: [SA_MUI, { gia: 'trai', u: 4 }, { gia: 'phai', u: 4 }], duoi: [{ loai: 'mau', x: 0 }], tren: [GYRO], gam: [NAM_CHAM_GAM] },
    moTa: 'Xe khung mBot chạy mê cung: ba siêu âm HC-SR04 nhìn trước, trái, phải (hai mắt bên đặt trên giá bên, trước trục bánh 4 cm), ' +
      'một cảm biến màu RGB dưới mũi để nhận ra đích, gyro trên nắp và nam châm điện dưới gầm. ' +
      'Cổng giống robot cũ cùng tên (màu 1, siêu âm trước 2, trái 3, phải 4, gyro 5, nam châm C).' },
  { name: 'tow', tenNgan: '#robot-towShort#',
    cauHinh: { sa: [SA_MUI], duoi: MAU_HAI, tren: [GYRO], co: { loai: 'tay', doan: 1, dau: 'namCham' } },
    moTa: 'Xe khung mBot kéo vật: cánh tay một đoạn (motor N20 1:298) mang nam châm điện ở đầu để nhặt hoặc kéo vật bằng sắt; ' +
      'hai cảm biến màu dưới mũi, siêu âm ở mũi và gyro trên nắp. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, siêu âm 3, gyro 4, cánh tay C, nam châm D). ' +
      'Khác robot cũ: tay gắn ở mũi chứ không ở đuôi, vì đuôi khung mBot là chỗ dây cảm biến đi lên mạch chủ; góc dương là nâng tay lên. ' +
      'Siêu âm mũi được nâng lên 7,3 cm cho tay đi bên dưới. Cẩn thận kẻo hất văng vật khi quay đầu!' },
  { name: 'crane', tenNgan: '#robot-craneShort#',
    cauHinh: { sa: [SA_MUI], duoi: MAU_HAI, tren: [GYRO], co: { loai: 'tay', doan: 2, dau: 'namCham', mau: true } },
    moTa: 'Xe khung mBot cần cẩu: cần hai đoạn ở mũi (khớp vai và khớp khuỷu, mỗi khớp một motor N20 1:298), ' +
      'nam châm điện và một cảm biến màu ở đầu cần để biết vật đang nhặt; thêm hai cảm biến màu dưới mũi, siêu âm ở mũi và gyro trên nắp. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, siêu âm 3, gyro 4, màu đầu cần 5, vai C, khuỷu D, nam châm E). ' +
      'Siêu âm mũi được nâng lên 7,3 cm; vai nâng quá khoảng 76° thì cần chạm siêu âm nên dừng ở đó.' },
  { name: 'paintball', tenNgan: '#robot-paintballShort#',
    cauHinh: { sa: [{ gia: 'truoc', u: 0, loai: 'laze' }], duoi: MAU_HAI, tren: [GYRO, GPS], gam: [NAM_CHAM_GAM], co: { loai: 'tay', doan: 1, dau: 'sung' } },
    moTa: 'Xe khung mBot bắn bóng sơn: súng bắn bi ở đầu cánh tay một đoạn (motor N20 1:298) để ngắm lên xuống; ' +
      'chạy motor của súng theo chiều âm để lên dây (tối đa 1000°), rồi chạy chiều dương để bắn: lên dây càng nhiều, bi bay càng nhanh (tới 6,3 m/s). ' +
      'Đo khoảng cách bằng cảm biến laze VL53L1X ở mũi (tới 4 m) thay cho siêu âm; hai cảm biến màu dưới mũi, gyro và GPS trên nắp, nam châm điện dưới gầm. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, laze 3, gyro 4, GPS 5, nam châm C, cánh tay D, súng E). ' +
      'Khác robot cũ: laze đo tới 4 m (robot cũ 5 m), tay gắn ở mũi.' },
  { name: 'maze2', tenNgan: '#robot-maze2Short#',
    cauHinh: { sa: [], duoi: [{ loai: 'mau', x: 0 }], tren: [GYRO, { loai: 'servo', x: 1.5, z: 4.5, tay: 'ngang', gan: ['laze', 'mauXa'] }], gam: [NAM_CHAM_GAM] },
    moTa: 'Xe khung mBot chạy mê cung đời 2: thay ba siêu âm bằng một servo SG90 trên nắp, tay quay ngang mang cảm biến laze VL53L1X và cảm biến màu nhìn xa (tới 30 cm, chùm 30°) đặt cạnh nhau, cùng nhìn về một hướng. ' +
      'Quay servo để nhìn trước, trái, phải. Thêm một cảm biến màu RGB dưới mũi để nhận ra đích, gyro trên nắp và nam châm điện dưới gầm. ' +
      'Cổng giống robot cũ cùng tên (màu dưới mũi 1, gyro 2, laze 3, màu nhìn xa 4, nam châm C, servo D). ' +
      'Khác robot cũ: servo quay 0–180° (90° là nhìn thẳng) thay cho bàn xoay.' },
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

// Robot mẫu: thay đúng chỗ robot GEARS cùng tên trong danh sách chọn robot
const dsMau = mau.map(function (o) {
  let r = taoXe(o);
  console.log(o.name, L.lapXe(o.cauHinh).camBien.map((c) => c.cong + ':' + c.loai).join(' '));
  return r;
});
fs.writeFileSync(path.join(outDir, 'xe-mau.js'),
  '// Sinh bằng scripts/robot/tao-xe.js, đừng sửa tay. Robot mẫu của GEARS dựng lại bằng xe khung mBot (cùng tên, cùng cổng).\n' +
  '[' + dsMau.map((r) => JSON.stringify(r)).join(',\n') + '].forEach(function(r) {\n' +
  '  let i = robotTemplates.findIndex((t) => t.name == r.name);\n' +
  '  if (i < 0) robotTemplates.push(r); else robotTemplates[i] = r;\n' +
  '});\n');
console.log('xe-mau');
