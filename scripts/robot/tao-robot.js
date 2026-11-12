// Sinh các tệp cấu hình robot chuẩn lớp 6 (G2) từ một bộ thông số.
// Chạy: node scripts/robot/tao-robot.js
// Kết quả: public/san-robot-ao/robots/*.json (cùng định dạng tệp mà Robot Configurator lưu ra).
const fs = require('fs');
const path = require('path');

const PI = Math.PI;
const r4 = (x) => Math.round(x * 10000) / 10000;

// Kích thước thân và bánh, đơn vị cm.
function taoRobot(o) {
  const bodyWidth = 14.4, bodyLength = 16, bodyHeight = 4;
  const wheelWidth = 1.2, wheelToBodyOffset = 0.2;
  const wheelDiameter = r4(o.chuViBanh / PI);       // chọn chu vi tròn số cho dễ tính
  const truc = 4;                                   // trục bánh ở z = +4 cm (trước tâm thân 4 cm)
  const wheelR = wheelDiameter / 2;
  const edgeY = 1;                                  // tâm bánh cao hơn đáy thân 1 cm
  const tamThanCaoY = bodyHeight / 2 + wheelR - edgeY; // độ cao tâm thân so với mặt sân
  const caster = o.casterDiameter;   // bi tự do phía sau; GEARS tự đặt bi chạm đất
  const components = [];

  // Thứ tự linh kiện quyết định số cổng. Mọi biến thể giữ cùng cổng cho cảm biến chuẩn
  // để một chương trình chạy được trên mọi robot:
  //   cổng 1 màu (giữa), 2 khoảng cách, 3 gyro, 4 chạm, 5 bút; cảm biến màu thêm từ cổng 6.
  components.push({ type: 'ColorSensor', position: [0, -1, 7], rotation: [PI / 2, 0, 0], options: {} });
  components.push({ type: 'UltrasonicSensor', position: [0, 2.5, 7], rotation: [0, 0, 0], options: {} });
  components.push({ type: 'GyroSensor', position: [0, 2.5, 0], options: {} });
  // Cảm biến chạm ở mũi: thanh cản rộng 10 cm, tấm đỏ quay ra phía trước
  components.push({ type: 'TouchSensor', position: [0, 0, 9], rotation: [-PI / 2, 0, 0], options: { width: 10, depth: 2 } });
  // Bút đặt đúng tâm quay (giữa hai bánh), đầu bút sát mặt sân
  components.push({ type: 'Pen', position: [0, r4(-tamThanCaoY + 2.6), truc], rotation: [0, 0, 0], options: {} });
  (o.mauThem || []).forEach(function (x) {
    components.push({ type: 'ColorSensor', position: [x, -1, 7], rotation: [PI / 2, 0, 0], options: {} });
  });

  const moTaCamBien = [
    '<li>Cổng 1: Cảm biến màu dưới gầm (giữa)</li>',
    '<li>Cổng 2: Cảm biến khoảng cách (phía trước)</li>',
    '<li>Cổng 3: Gyro (con quay)</li>',
    '<li>Cổng 4: Cảm biến chạm (mũi)</li>',
    '<li>Cổng 5: Bút vẽ (ở tâm quay)</li>'
  ];
  (o.mauThem || []).forEach(function (x, i) {
    moTaCamBien.push('<li>Cổng ' + (6 + i) + ': Cảm biến màu dưới gầm (' + (x < 0 ? 'trái' : 'phải') + ', cách giữa ' + Math.abs(x) + ' cm)</li>');
  });

  const spacing = bodyWidth + wheelWidth + 2 * wheelToBodyOffset;

  return {
    name: o.name,
    shortDescription: o.tenNgan,
    longDescription: '<p>' + o.moTa + '</p>',
    longerDescription:
      '<h3>Kích thước</h3><ul>' +
      '<li>Đường kính bánh: ' + wheelDiameter.toFixed(2).replace('.', ',') + ' cm (chu vi ' + o.chuViBanh + ' cm)</li>' +
      '<li>Khoảng cách hai bánh (tâm đến tâm): ' + spacing.toFixed(1).replace('.', ',') + ' cm</li></ul>' +
      '<h3>Động cơ</h3><ul><li>Cổng A: Bánh trái</li><li>Cổng B: Bánh phải</li></ul>' +
      '<h3>Cảm biến</h3><ul>' + moTaCamBien.join('') + '</ul>',
    thumbnail: '',
    bodyHeight: bodyHeight,
    bodyWidth: bodyWidth,
    bodyLength: bodyLength,
    wheels: true,
    wheelDiameter: wheelDiameter,
    wheelWidth: wheelWidth,
    wheelToBodyOffset: wheelToBodyOffset,
    bodyEdgeToWheelCenterY: edgeY,
    bodyEdgeToWheelCenterZ: bodyLength / 2 - truc,
    bodyMass: 1000,
    wheelMass: 200,
    casterMass: 0,
    caster: true,
    casterDiameter: caster,
    wheelFriction: 10,
    bodyFriction: 0,
    casterFriction: 0,
    color: o.color,
    imageType: 'all',
    imageURL: '',
    components: components,
    options: {}
  };
}

const robots = [
  { file: 'co-ban', name: 'siro_coBan', tenNgan: 'Robot chuẩn lớp 6', color: '#F09C0D', chuViBanh: 20, casterDiameter: 4,
    moTa: 'Robot dùng chung cho mọi bài: 2 bánh chủ động, 1 bi tự do phía sau, cảm biến khoảng cách, màu, chạm, gyro và bút vẽ. Bánh có chu vi 20 cm: quay 1 vòng thì robot đi 20 cm.' },
  { file: 'banh-to', name: 'siro_banhTo', tenNgan: 'Robot bánh to', color: '#2E86DE', chuViBanh: 30, casterDiameter: 4,
    moTa: 'Giống robot chuẩn nhưng bánh to hơn: chu vi 30 cm. Cùng số vòng quay, robot đi xa hơn và nhanh hơn.' },
  { file: 'banh-nho', name: 'siro_banhNho', tenNgan: 'Robot bánh nhỏ', color: '#27AE60', chuViBanh: 15, casterDiameter: 3,
    moTa: 'Giống robot chuẩn nhưng bánh nhỏ hơn: chu vi 15 cm. Đi chậm hơn nhưng dễ dừng đúng chỗ.' },
  { file: 'do-line', name: 'siro_doLine', tenNgan: 'Robot dò đường (3 cảm biến màu)', color: '#8E44AD', chuViBanh: 20, casterDiameter: 4,
    mauThem: [-3, 3],
    moTa: 'Robot chuẩn có 3 cảm biến màu dưới gầm (trái, giữa, phải) cách nhau 3 cm, dùng cho bài dò vạch.' },
];

const outDir = path.join(__dirname, '..', '..', 'public', 'san-robot-ao', 'robots');
robots.forEach(function (o) {
  const json = taoRobot(o);
  fs.writeFileSync(path.join(outDir, o.file + '.json'), JSON.stringify(json, null, 2) + '\n');
  console.log(o.file, 'd =', json.wheelDiameter, 'cm');
});
