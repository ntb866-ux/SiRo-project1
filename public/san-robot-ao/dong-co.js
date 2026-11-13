// Sân Robot Ảo – động cơ không hoàn hảo: motor yếu và gia tốc bánh (gói G5).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Nạp từ giao-dien.js, chạy cả ở chế độ tự do lẫn chế độ thử thách.
//
// 1. Motor yếu. Tệp robot có trường
//        "sraMotorYeu": { "banh": "phai", "phanTram": 8 }
//    thì bánh phải chỉ quay được 92 % tốc độ được lệnh (như motor thật bị mòn,
//    pin yếu, bánh bị kẹt). Lệnh "quay N độ" vẫn quay đủ N độ, chỉ chậm hơn;
//    lệnh chạy theo tốc độ thì bánh yếu tụt lại nên xe đi cong.
//    Tệp bài có trường "motorYeu" (cùng dạng) thì ghi đè tệp robot;
//    "motorYeu": null tắt motor yếu.
//
// 2. Gia tốc bánh. GEARS mặc định cho bánh đạt tốc độ gần như tức thì nên bánh
//    trượt lúc khởi động, xe lệch hướng ngẫu nhiên vài độ. Tệp robot dùng trường
//    có sẵn của GEARS "wheelMaxAcceleration" (độ/giây sau mỗi mili giây);
//    tệp bài có thể ghi đè bằng "giaTocBanh" (cùng đơn vị). 2,5 nghĩa là từ đứng
//    yên lên 500 độ/giây mất 0,2 giây.

var sraDongCo = new function() {
  let self = this;

  function bai() {
    return (window.SRA && SRA.bai) ? SRA.bai : {};
  }

  this.motorYeu = function() {
    let b = bai();
    let c = ('motorYeu' in b) ? b.motorYeu : (robot.options || {}).sraMotorYeu;
    if (!c || !Number(c.phanTram)) return null;
    return { banh: c.banh == 'trai' ? 'leftWheel' : 'rightWheel', heSo: 1 - Number(c.phanTram) / 100 };
  };

  function lamYeu(w, heSo) {
    // Chỉ giảm tốc độ khi bánh đang được lệnh chạy (setMotorSpeed),
    // không giảm lực giữ bánh lúc dừng.
    let dangChay = false;
    let chayGoc = w.setMotorSpeed;
    w.setMotorSpeed = function() {
      dangChay = true;
      try { return chayGoc.apply(w, arguments); } finally { dangChay = false; }
    };
    let joint = w.joint;
    let datGoc = joint.setMotor.bind(joint);
    joint.setMotor = function(tocDo, luc) {
      return datGoc(dangChay ? tocDo * heSo : tocDo, luc);
    };
  }

  // Robot được dựng lại mỗi lần đặt lại sân, nên kiểm tra mỗi khung hình
  // và áp lên bánh mới (đánh dấu trên khớp bánh để không áp hai lần).
  this.render = function() {
    if (typeof robot == 'undefined' || !robot || !robot.leftWheel || !robot.rightWheel) return;
    let l = robot.leftWheel, r = robot.rightWheel;
    if (!l.joint || !r.joint || l.joint._sraDongCo) return;
    l.joint._sraDongCo = r.joint._sraDongCo = true;

    let giaToc = Number(bai().giaTocBanh);
    if (giaToc > 0) l.maxAcceleration = r.maxAcceleration = giaToc;

    let yeu = self.motorYeu();
    if (yeu) lamYeu(robot[yeu.banh], yeu.heSo);
  };

  if (typeof babylon != 'undefined' && babylon.renders) babylon.renders.push(self.render);
};
