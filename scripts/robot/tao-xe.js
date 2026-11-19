// Sinh tệp robot của xe lắp mô-đun (public/san-robot-ao/robots/xe-*.json).
// Chạy: node scripts/robot/tao-xe.js
// Các trường kích thước (wheelDiameter, bodyLength…) là để mã có sẵn của GEARS và khung
// thử thách đọc; chúng được tính từ cùng danh mục linh kiện mà trình duyệt dùng để dựng xe.
const fs = require('fs');
const path = require('path');
const TEP_LK = '../../public/san-robot-ao/xe/linh-kien.js';
const L = require(TEP_LK);
// Bản tiếng Anh của danh mục linh kiện: linh-kien.js chọn chữ bằng sraT lúc nạp, nên nạp lại một bản với sraT trả tiếng Anh
const L_EN = (function() {
  const ten = require.resolve(TEP_LK);
  delete require.cache[ten];
  global.sraT = (vi, en) => (en === undefined ? vi : en);
  const l = require(TEP_LK);
  delete global.sraT;
  delete require.cache[ten];
  return l;
})();

// Ảnh xem trước trong hộp Chọn robot (chụp bằng scripts/robot/chup-anh-robot.js, chụp xong chạy lại tệp này).
// Thêm ?v=<mã băm> để trình duyệt không giữ ảnh cũ trong bộ nhớ đệm khi chụp lại.
function anhXemTruoc(ten) {
  const tep = path.join(__dirname, '..', '..', 'public', 'images', 'robots', 'xe-mbot', ten + '.jpg');
  if (!fs.existsSync(tep)) return '';
  return 'images/robots/xe-mbot/' + ten + '.jpg?v=' + require('crypto').createHash('md5').update(fs.readFileSync(tep)).digest('hex').slice(0, 8);
}

function taoXe(o) {
  const banLap = L.lapXe(o.cauHinh);
  const kl = L.tinhXe(banLap);
  return Object.assign({
    name: o.name,
    shortDescription: o.tenNgan,
    longDescription: '<p>' + o.moTa + '</p>',
    longerDescription: '',
    thumbnail: anhXemTruoc(o.name),
    color: '#F09C0D', imageType: 'all', imageURL: '',
    wheelFriction: 0.9, bodyFriction: 0.4, casterFriction: 0.25,
    components: [],
    options: {}
  }, L.moTaRobot(banLap, kl));
}

// Robot cho hộp Chọn robot: mô tả là khóa i18n, chữ tiếng Việt và tiếng Anh nạp cùng tệp (i18n.append),
// để giao diện tiếng Anh không hiện mô tả tiếng Việt.
function taoXeSongNgu(o, chu) {
  const r = taoXe(o);
  const banLapEn = L_EN.lapXe(o.cauHinh);
  const en = L_EN.moTaRobot(banLapEn, L_EN.tinhXe(banLapEn));
  const khoa = '#siro-robot-' + o.name;
  chu[khoa + 'Long#'] = { vi: r.longDescription, en: '<p>' + o.moTaEn + '</p>' };
  chu[khoa + 'More#'] = { vi: r.longerDescription, en: en.longerDescription };
  r.longDescription = khoa + 'Long#';
  r.longerDescription = khoa + 'More#';
  if (o.tenNganEn) {
    chu[khoa + 'Short#'] = { vi: o.tenNgan, en: o.tenNganEn };
    r.shortDescription = khoa + 'Short#';
  }
  return r;
}

const xe = [
  { file: 'xe-lap-rap', name: 'siro_xeLapRap', tenNgan: 'Xe lắp mô-đun (2 bánh)', tenNganEn: 'Modular kit car (2 wheels)',
    cauHinh: {},
    moTa: 'Xe 2 bánh kiểu xe kit: khung nhôm, hai motor giảm tốc TT, bi tự do phía trước, mạch chủ 8 cổng RJ25. ' +
      'Lắp sẵn cảm biến siêu âm HC-SR04, 2 mắt dò line TCRT5000, cảm biến chạm, gyro và GPS. ' +
      'Hình, va chạm và khối lượng đều tính từ từng linh kiện.',
    moTaEn: 'A 2-wheel kit-style car: aluminium frame, two TT gear motors, a ball caster at the front and an 8-port RJ25 main board. Fitted with an HC-SR04 ultrasonic sensor, 2 TCRT5000 line sensors, a touch sensor, a gyro and a GPS. Its shape, collisions and mass are all computed from the individual parts.' },
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
      'Khác robot cũ: bút nằm ở tâm quay giữa hai bánh nên nam châm dời ra trước bút 4 cm.',
    moTaEn: 'An mBot-frame car that follows lines with one TCS34725 RGB color sensor in the middle of the bar under the nose. It also has an HC-SR04 ultrasonic sensor on the nose, a gyro and a GPS on the cover, a pen at the turning center and a KK-P20/15 electromagnet under the car to pick up iron objects. Ports match the old robot of the same name (color 1, ultrasonic 2, gyro 3, GPS 4, pen 5, magnet C), so old programs still run. Unlike the old robot, the pen sits at the turning center between the wheels, so the magnet is moved 4 cm ahead of the pen.' },
  { name: 'doubleFollower', tenNgan: '#robot-doubleFollowerShort#',
    cauHinh: { sa: [SA_MUI], duoi: MAU_HAI, tren: [GYRO, GPS], gam: [NAM_CHAM_GAM] },
    moTa: 'Xe khung mBot dò đường bằng hai cảm biến màu RGB TCS34725 dưới mũi, cách nhau 3 cm. ' +
      'Kèm siêu âm HC-SR04 ở mũi, gyro và GPS trên nắp, nam châm điện KK-P20/15 dưới gầm để nhặt vật bằng sắt. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, siêu âm 3, gyro 4, GPS 5, nam châm C). ' +
      'Khác robot cũ: hai cảm biến màu gần nhau hơn (3 cm thay vì 4 cm) cho vừa thanh dưới mũi.',
    moTaEn: 'An mBot-frame car that follows lines with two TCS34725 RGB color sensors under the nose, 3 cm apart. It also has an HC-SR04 ultrasonic sensor on the nose, a gyro and a GPS on the cover and a KK-P20/15 electromagnet under the car to pick up iron objects. Ports match the old robot of the same name (left color 1, right color 2, ultrasonic 3, gyro 4, GPS 5, magnet C). Unlike the old robot, the two color sensors are closer together (3 cm instead of 4 cm) to fit the bar under the nose.' },
  { name: 'maze', tenNgan: '#robot-mazeShort#',
    cauHinh: { sa: [SA_MUI, { gia: 'trai', u: 4 }, { gia: 'phai', u: 4 }], duoi: [{ loai: 'mau', x: 0 }], tren: [GYRO], gam: [NAM_CHAM_GAM] },
    moTa: 'Xe khung mBot chạy mê cung: ba siêu âm HC-SR04 nhìn trước, trái, phải (hai mắt bên đặt trên giá bên, trước trục bánh 4 cm), ' +
      'một cảm biến màu RGB dưới mũi để nhận ra đích, gyro trên nắp và nam châm điện dưới gầm. ' +
      'Cổng giống robot cũ cùng tên (màu 1, siêu âm trước 2, trái 3, phải 4, gyro 5, nam châm C).',
    moTaEn: 'An mBot-frame maze runner: three HC-SR04 ultrasonic sensors looking forward, left and right (the side ones sit on the side brackets, 4 cm ahead of the wheel axle), one RGB color sensor under the nose to recognise the goal, a gyro on the cover and an electromagnet under the car. Ports match the old robot of the same name (color 1, front ultrasonic 2, left 3, right 4, gyro 5, magnet C).' },
  { name: 'tow', tenNgan: '#robot-towShort#',
    cauHinh: { sa: [SA_MUI], duoi: MAU_HAI, tren: [GYRO], co: { loai: 'tay', doan: 1, dau: 'namCham' } },
    moTa: 'Xe khung mBot kéo vật: cánh tay một đoạn (motor N20 1:298) mang nam châm điện ở đầu để nhặt hoặc kéo vật bằng sắt; ' +
      'hai cảm biến màu dưới mũi, siêu âm ở mũi và gyro trên nắp. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, siêu âm 3, gyro 4, cánh tay C, nam châm D). ' +
      'Khác robot cũ: tay gắn ở mũi chứ không ở đuôi, vì đuôi khung mBot là chỗ dây cảm biến đi lên mạch chủ; góc dương là nâng tay lên. ' +
      'Siêu âm mũi được nâng lên 7,3 cm cho tay đi bên dưới. Cẩn thận kẻo hất văng vật khi quay đầu!',
    moTaEn: 'An mBot-frame tow car: a one-segment arm (N20 1:298 motor) carries an electromagnet at its tip to pick up or drag iron objects; two color sensors under the nose, an ultrasonic sensor on the nose and a gyro on the cover. Ports match the old robot of the same name (left color 1, right color 2, ultrasonic 3, gyro 4, arm C, magnet D). Unlike the old robot, the arm is on the nose rather than the tail, because the tail of the mBot frame is where the sensor cables go up to the main board; a positive angle raises the arm. The nose ultrasonic sensor is raised to 7.3 cm so the arm can pass under it. Careful not to fling the object away when turning!' },
  { name: 'crane', tenNgan: '#robot-craneShort#',
    cauHinh: { sa: [SA_MUI], duoi: MAU_HAI, tren: [GYRO], co: { loai: 'tay', doan: 2, dau: 'namCham', mau: true } },
    moTa: 'Xe khung mBot cần cẩu: cần hai đoạn ở mũi (khớp vai và khớp khuỷu, mỗi khớp một motor N20 1:298), ' +
      'nam châm điện và một cảm biến màu ở đầu cần để biết vật đang nhặt; thêm hai cảm biến màu dưới mũi, siêu âm ở mũi và gyro trên nắp. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, siêu âm 3, gyro 4, màu đầu cần 5, vai C, khuỷu D, nam châm E). ' +
      'Siêu âm mũi được nâng lên 7,3 cm; vai nâng quá khoảng 76° thì cần chạm siêu âm nên dừng ở đó.',
    moTaEn: 'An mBot-frame crane: a two-segment boom on the nose (shoulder and elbow joints, each with an N20 1:298 motor), an electromagnet and a color sensor at the boom tip to tell which object is being picked; plus two color sensors under the nose, an ultrasonic sensor on the nose and a gyro on the cover. Ports match the old robot of the same name (left color 1, right color 2, ultrasonic 3, gyro 4, boom-tip color 5, shoulder C, elbow D, magnet E). The nose ultrasonic sensor is raised to 7.3 cm; past about 76° the boom touches it, so the shoulder stops there.' },
  { name: 'paintball', tenNgan: '#robot-paintballShort#',
    cauHinh: { sa: [{ gia: 'truoc', u: 0, loai: 'laze' }], duoi: MAU_HAI, tren: [GYRO, GPS], gam: [NAM_CHAM_GAM], co: { loai: 'tay', doan: 1, dau: 'sung' } },
    moTa: 'Xe khung mBot bắn bóng sơn: súng bắn bi ở đầu cánh tay một đoạn (motor N20 1:298) để ngắm lên xuống; ' +
      'chạy motor của súng theo chiều âm để lên dây (tối đa 1000°), rồi chạy chiều dương để bắn: lên dây càng nhiều, bi bay càng nhanh (tới 6,3 m/s). ' +
      'Đo khoảng cách bằng cảm biến laze VL53L1X ở mũi (tới 4 m) thay cho siêu âm; hai cảm biến màu dưới mũi, gyro và GPS trên nắp, nam châm điện dưới gầm. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, laze 3, gyro 4, GPS 5, nam châm C, cánh tay D, súng E). ' +
      'Khác robot cũ: laze đo tới 4 m (robot cũ 5 m), tay gắn ở mũi.',
    moTaEn: 'An mBot-frame paintball car: a ball launcher at the tip of a one-segment arm (N20 1:298 motor) aims up and down; run the launcher motor backwards to draw the spring (up to 1000°), then forwards to fire: the more you draw, the faster the ball flies (up to 6.3 m/s). Distance is measured with a VL53L1X laser sensor on the nose (up to 4 m) instead of ultrasound; two color sensors under the nose, a gyro and a GPS on the cover, an electromagnet under the car. Ports match the old robot of the same name (left color 1, right color 2, laser 3, gyro 4, GPS 5, magnet C, arm D, launcher E). Unlike the old robot, the laser reaches 4 m (old robot 5 m) and the arm is on the nose.' },
  { name: 'maze2', tenNgan: '#robot-maze2Short#',
    cauHinh: { sa: [], duoi: [{ loai: 'mau', x: 0 }], tren: [GYRO, { loai: 'servo', x: 1.5, z: 4.5, tay: 'ngang', gan: ['laze', 'mauXa'] }], gam: [NAM_CHAM_GAM] },
    moTa: 'Xe khung mBot chạy mê cung đời 2: thay ba siêu âm bằng một servo SG90 trên nắp, tay quay ngang mang cảm biến laze VL53L1X và cảm biến màu nhìn xa (tới 30 cm, chùm 30°) đặt cạnh nhau, cùng nhìn về một hướng. ' +
      'Quay servo để nhìn trước, trái, phải. Thêm một cảm biến màu RGB dưới mũi để nhận ra đích, gyro trên nắp và nam châm điện dưới gầm. ' +
      'Cổng giống robot cũ cùng tên (màu dưới mũi 1, gyro 2, laze 3, màu nhìn xa 4, nam châm C, servo D). ' +
      'Khác robot cũ: servo quay 0–180° (90° là nhìn thẳng) thay cho bàn xoay.',
    moTaEn: 'An mBot-frame maze runner, generation 2: the three ultrasonic sensors are replaced by one SG90 servo on the cover whose horizontal horn carries a VL53L1X laser sensor and a long-range color sensor (up to 30 cm, 30° beam) side by side, looking the same way. Turn the servo to look forward, left and right. It also has one RGB color sensor under the nose to recognise the goal, a gyro on the cover and an electromagnet under the car. Ports match the old robot of the same name (nose color 1, gyro 2, laser 3, long-range color 4, magnet C, servo D). Unlike the old robot, the servo turns 0–180° (90° looks straight ahead) instead of a turntable.' },
  { name: 'cage', tenNgan: '#robot-cageShort#',
    cauHinh: { sa: [SA_MUI], duoi: MAU_HAI, tren: [GYRO, GPS], co: { loai: 'tay', doan: 1, dau: 'long', mau: true }, thuTuCong: [1, 2, 6, 3, 4, 5] },
    moTa: 'Xe khung mBot có lồng: cánh tay một đoạn ở mũi (motor N20 1:298) mang lồng nhôm chữ U hở về phía mũi xe. ' +
      'Tay nằm ngang (góc 0) thì lồng úp sát sân, giữ khối trước mũi để đẩy đi; nâng tay (góc dương) để mở lồng. ' +
      'Cảm biến màu nhìn xa (TCS34725 có thấu kính) trên tấm công tác nhìn ra trước, chúc xuống 15°, cho biết trước mũi có khối không và khối màu gì. ' +
      'Thêm hai cảm biến màu dưới mũi, siêu âm ở mũi (nâng lên 7,3 cm cho tay đi bên dưới), gyro và GPS trên nắp. ' +
      'Cổng giống robot cũ cùng tên (màu trái 1, màu phải 2, màu phía trước 3, siêu âm 4, gyro 5, GPS 6, cánh tay C). ' +
      'Khác robot cũ: tay và lồng ở mũi chứ không ở bên hông, lòng lồng rộng 6 cm; cảm biến màu phía trước là loại nhìn xa, trước mũi không có khối thì nó đọc ra màu mặt sân phía trước.',
    moTaEn: 'An mBot-frame cage car: a one-segment arm on the nose (N20 1:298 motor) carries a U-shaped aluminium cage that is open towards the nose. ' +
      'With the arm level (angle 0) the cage sits just above the floor and traps a block in front of the nose so the car can push it; raise the arm (positive angle) to open the cage. ' +
      'A long-range color sensor (TCS34725 with lens) on the tool plate looks forward and 15° down to tell whether there is a block in front and what color it is. ' +
      'It also has two color sensors under the nose, an ultrasonic sensor on the nose (raised to 7.3 cm so the arm can pass under it), a gyro and a GPS on the cover. ' +
      'Ports match the old robot of the same name (left color 1, right color 2, front color 3, ultrasonic 4, gyro 5, GPS 6, arm C). ' +
      'Unlike the old robot, the arm and cage are on the nose rather than the side and the cage is 6 cm wide inside; the front color sensor is a long-range type, so with no block in front it reads the color of the floor ahead.' },
  { name: 'football', tenNgan: '#robot-footballShort#',
    cauHinh: { sa: [{ gia: 'truoc', u: 0, loai: 'namCham' }, { gia: 'sau', u: 0, loai: 'namCham' }], duoi: [], tren: [GYRO, GPS] },
    moTa: 'Xe khung mBot đá bóng: hai nam châm điện KK-P20/15 nhìn ngang, một trên giá mũi (cổng C) và một trên giá đuôi (cổng D), cao 5,6 cm cho ngang tâm quả bóng, để giữ bóng ở mũi hoặc ở đuôi. ' +
      'Gyro và GPS trên nắp. Cổng giống robot cũ cùng tên (gyro 1, GPS 2, nam châm trước C, nam châm sau D). ' +
      'Khác robot cũ: nam châm thật chỉ hút được vật sắt cách mặt hút khoảng 3 cm (robot cũ hút từ 20 cm), và đảo chiều dòng điện vẫn là hút chứ không đẩy; ' +
      'muốn sút thì cho xe lao tới rồi tắt nam châm để bóng lăn đi.',
    moTaEn: 'An mBot-frame football car: two KK-P20/15 electromagnets facing outwards, one on the nose bracket (port C) and one on the tail bracket (port D), 5.6 cm high to line up with the middle of the ball, to hold the ball at the front or the back. ' +
      'A gyro and a GPS on the cover. Ports match the old robot of the same name (gyro 1, GPS 2, front magnet C, back magnet D). ' +
      'Unlike the old robot, a real magnet only pulls iron within about 3 cm of its face (the old robot pulled from 20 cm), and reversing the current still attracts rather than repels; ' +
      'to kick, drive at the ball and switch the magnet off so the ball rolls away.' },
  { name: 'WROSport', tenNgan: '#robot-WROSportShort#',
    cauHinh: { sa: [{ gia: 'truoc', u: 0, loai: 'namCham' }], duoi: [{ loai: 'mau', x: 0 }], tren: [GYRO, GPS, { loai: 'camera', x: 0, z: 4.6, mauXa: true }], thuTuCong: [1, 2, 4, 5, 3] },
    moTa: 'Xe khung mBot cho nội dung thể thao robot WRO: nam châm điện KK-P20/15 nhìn ngang trên giá mũi (cao 5,6 cm) để giữ và dắt bóng; cột nhôm giữa nắp mang camera OV2640 nhìn ra trước, chúc xuống 30°, để tìm bóng, ' +
      'và cảm biến màu nhìn xa chúc xuống 45° để biết bóng đã tới sát mũi chưa. Thêm một cảm biến màu dưới mũi để đọc vạch sân, gyro và GPS trên nắp. ' +
      'Cổng giống robot cũ cùng tên (màu dưới mũi 1, gyro 2, camera 3, màu nhìn chéo 4, GPS 5, nam châm C). ' +
      'Khác robot cũ: không có hai tấm chắn hướng bóng; nam châm thật hút trong khoảng 3 cm và không đẩy được bóng, muốn sút thì lao xe tới rồi tắt nam châm.',
    moTaEn: 'An mBot-frame car for WRO RoboSport: a KK-P20/15 electromagnet facing forward on the nose bracket (5.6 cm high) to hold and dribble the ball; an aluminium mast in the middle of the cover carries an OV2640 camera looking forward and 30° down to find the ball, ' +
      'and a long-range color sensor looking 45° down to tell when the ball is right at the nose. It also has one color sensor under the nose to read the field lines, a gyro and a GPS on the cover. ' +
      'Ports match the old robot of the same name (nose color 1, gyro 2, camera 3, angled color 4, GPS 5, magnet C). ' +
      'Unlike the old robot, there are no ball guide plates; a real magnet pulls within about 3 cm and cannot push the ball, so to kick, drive at the ball and switch the magnet off.' },
];

const outDir = path.join(__dirname, '..', '..', 'public', 'san-robot-ao', 'robots');
xe.forEach(function (o) {
  const r = taoXe(o);
  fs.writeFileSync(path.join(outDir, o.file + '.json'), JSON.stringify(r, null, 2) + '\n');
  // Bản .js nạp ngay sau js/robotTemplates.js: xe đứng đầu danh sách robot nên là robot mặc định
  // của mọi sân ngay từ lúc trang mở (robot cũ của GEARS không còn là mặc định).
  const chu = {};
  const rJs = taoXeSongNgu(o, chu);
  fs.writeFileSync(path.join(outDir, o.file + '.js'),
    '// Sinh bằng scripts/robot/tao-xe.js, đừng sửa tay. Xe lắp mô-đun là robot mặc định của mọi sân.\n' +
    'i18n.append(' + JSON.stringify(chu) + ');\n' +
    'robotTemplates.unshift(' + JSON.stringify(rJs) + ');\n');
  console.log(o.file);
});

// Robot mẫu: thay đúng chỗ robot GEARS cùng tên trong danh sách chọn robot
const chuMau = {};
const dsMau = mau.map(function (o) {
  let r = taoXeSongNgu(o, chuMau);
  console.log(o.name, L.lapXe(o.cauHinh).camBien.map((c) => c.cong + ':' + c.loai).join(' '));
  return r;
});
fs.writeFileSync(path.join(outDir, 'xe-mau.js'),
  '// Sinh bằng scripts/robot/tao-xe.js, đừng sửa tay. Robot mẫu của GEARS dựng lại bằng xe khung mBot (cùng tên, cùng cổng).\n' +
  'i18n.append(' + JSON.stringify(chuMau, null, 1) + ');\n' +
  '[' + dsMau.map((r) => JSON.stringify(r)).join(',\n') + '].forEach(function(r) {\n' +
  '  let i = robotTemplates.findIndex((t) => t.name == r.name);\n' +
  '  if (i < 0) robotTemplates.push(r); else robotTemplates[i] = r;\n' +
  '});\n');
console.log('xe-mau');
