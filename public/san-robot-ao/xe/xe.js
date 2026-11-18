// Sân Robot Ảo – xe lắp mô-đun: nối xe mới vào GEARS (nạp robot, bánh, cảm biến, Python).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Tệp robot nào có trường "sraXe" (cấu hình lắp ráp, xem linh-kien.js) thì được dựng bằng
// bộ mô hình và vật lí riêng trong thư mục này, không dùng thân hộp, bánh và cảm biến của GEARS.
// Robot không có "sraXe" (robot chuẩn của các bài G3–G8) vẫn do GEARS dựng như cũ.
//
// Với mã có sẵn, xe mới trông giống một robot GEARS:
//   robot.body                       nút gốc của thân (đặt tại trọng tâm thân)
//   robot.leftWheel / rightWheel     bánh trái (cổng outA) / phải (outB), cùng các trường của Wheel
//   robot.getComponentByPort('inN')  cảm biến, cùng tên hàm đọc (getDistance, getRGB, getYawAngle…)
var SRAXe = new function() {
  'use strict';
  let self = this;
  const H = SRAHinhKhoi, V = H.V, Q = H.Q, RAD = Math.PI / 180;

  this.hienHitbox = false;

  // ---------- Bánh xe: cùng giao diện với Wheel của GEARS ----------
  function BanhXe(moTa, vl, mesh) {
    let b = this, dc = vl.dongCo, ts = moTa.dongCo;
    this.type = 'WheelActuator';
    this.sraXe = true;
    this.port = moTa.cong;
    this.options = { diameter: moTa.d, width: moTa.rong };
    this.components = [];
    this.mesh = mesh; this.body = mesh; this.end = mesh;
    this.dongCo = dc;
    this.modes = { STOP: 1, RUN: 2, RUN_TO_POS: 3, RUN_TIL_TIME: 4 };
    this.states = { RUNNING: 'running', RAMPING: 'ramping', HOLDING: 'holding', OVERLOADED: 'overloaded', STATE_STALLED: 'stalled', NONE: '' };
    this.state = this.states.HOLDING;
    this.mode = this.modes.STOP;
    this.MAX_SPEED = ts.tocDoLenhToiDa * RAD;
    this.maxAcceleration = 20;            // độ/giây mỗi mili giây (như GEARS); motor thật còn bị giới hạn bởi mô-men
    this.speed_sp = 0; this._speed_sp = 0;
    this.stop_action = 'hold';
    this.position = 0; this.prevPosition = 0; this.position_target = 0; this.positionAdjustment = 0;
    this.speed = 0;
    this.time_sp = 0; this.time_target = 0;

    // Mã G5 (dong-co.js) bọc joint.setMotor và setMotorSpeed để làm "motor yếu"; giữ đúng hai chỗ móc đó.
    this.joint = { setMotor: function(tocDo) { dc.cheDo = 'tocDo'; dc.dich = -tocDo; } };
    const gocMay = (doGoc) => (doGoc + b.positionAdjustment) * RAD;      // góc của bánh → góc của encoder (rad)

    this.runForever = function() { b.mode = b.modes.RUN; };
    this.runTimed = function() { b.mode = b.modes.RUN_TIL_TIME; };
    this.runToPosition = function() {
      b.positionDirectionReversed = b.position_target < b.position;
      b.mode = b.modes.RUN_TO_POS;
    };
    // giuTai: góc (độ) cần giữ; bỏ trống thì giữ tại chỗ đang đứng
    this.stop = function(giuTai) {
      b.mode = b.modes.STOP;
      b._speed_sp = 0;
      dc.gocDung = null;
      if (b.stop_action == 'hold') {
        dc.cheDo = 'giu';
        b.position_target = (typeof giuTai == 'number') ? giuTai : b.position;
        dc.dich = gocMay(b.position_target);
        b.state = b.states.HOLDING;
      } else {
        dc.cheDo = b.stop_action == 'brake' ? 'phanh' : 'tha';
        b.state = b.states.NONE;
      }
    };
    this.reset = function() {
      b.positionAdjustment += b.position;
      b.position = 0; b.prevPosition = 0; b.position_target = 0;
      b._speed_sp = 0;
      b.mode = b.modes.STOP; b.state = b.states.HOLDING;
      dc.gocDung = null;
      dc.cheDo = 'giu'; dc.dich = dc.goc;
    };

    this.setMotorSpeed = function(delta, nguoc, tocDoDich) {
      let dich = Number(tocDoDich == null ? b.speed_sp : tocDoDich);
      if (!isFinite(dich)) dich = 0;      // lệnh tốc độ hỏng (undefined, NaN): coi như 0, không để NaN lọt xuống motor
      if (!isFinite(b._speed_sp)) b._speed_sp = 0;
      let diff = dich - b._speed_sp, gh = delta * b.maxAcceleration;
      if (diff > gh) { b._speed_sp += gh; b.state = b.states.RAMPING; }
      else if (diff < -gh) { b._speed_sp -= gh; b.state = b.states.RAMPING; }
      else { b._speed_sp = dich; b.state = b.states.RUNNING; }
      let tocDo = -b._speed_sp * RAD;
      tocDo = Math.max(-b.MAX_SPEED, Math.min(b.MAX_SPEED, tocDo));
      if (nguoc) tocDo = -tocDo;
      b.joint.setMotor(tocDo, 0);
    };

    this.render = function(delta) {
      b.position = dc.goc / RAD - b.positionAdjustment;
      if (b.mode == b.modes.RUN) {
        dc.gocDung = null;
        b.setMotorSpeed(delta);
      } else if (b.mode == b.modes.RUN_TIL_TIME) {
        dc.gocDung = null;
        b.setMotorSpeed(delta);
        if (Date.now() > b.time_target) b.stop();
      } else if (b.mode == b.modes.RUN_TO_POS) {
        // Tăng tốc và chạy đều do lệnh tốc độ; giảm tốc và dừng đúng góc do bộ điều khiển motor
        // làm trong từng bước vật lí (xem DongCo.gocDung). Bánh đứng yên tại đích thì báo xong.
        let con = b.position_target - b.position;
        dc.gocDung = gocMay(b.position_target);
        if (Math.abs(con) < 0.5 && Math.abs(dc.omega) < 30 * RAD) b.stop(b.position_target);
        else b.setMotorSpeed(delta, false, con >= 0 ? Math.abs(b.speed_sp) : -Math.abs(b.speed_sp));
      }
      if (delta > 0) b.speed = 0.8 * b.speed + 0.2 * (dc.omega / RAD);
      b.prevPosition = b.position;
    };
  }

  // ---------- Servo: motor cổng C, góc tuyệt đối 0…180° (lúc lắp ở 90°) ----------
  // Dùng chung giao diện với motor của GEARS (LargeMotor(OUTPUT_C) trong Python, khối "động cơ C tới vị trí"),
  // nhưng vị trí là góc thật của tay quay và không vượt khỏi 0…180° như servo thật.
  function ServoXe(moTa, vl, mesh) {
    let ts = moTa.dongCo;
    BanhXe.call(this, { cong: 'outC', d: 2, rong: 1, dongCo: ts }, { dongCo: vl.dongCoServo }, mesh);
    let b = this, dc = vl.dongCoServo, gocBanh = ts.gocDau;
    this.type = 'SwivelActuator';         // để bộ sinh mã Python khai báo motorC
    this.sraServo = true;
    this.positionAdjustment = -gocBanh;   // góc encoder 0 ứng với 90°
    this.position = gocBanh; this.prevPosition = gocBanh; this.position_target = gocBanh;
    let kep = (g) => Math.max(ts.gocMin, Math.min(ts.gocMax, g));
    let runToPosGoc = this.runToPosition, stopGoc = this.stop, renderGoc = this.render;
    this.runToPosition = function() { b.position_target = kep(b.position_target); runToPosGoc(); };
    this.stop = function(giuTai) { stopGoc(typeof giuTai == 'number' ? kep(giuTai) : kep(b.position)); };
    // servo luôn biết góc tuyệt đối: đặt lại thì chỉ dừng và giữ tại chỗ
    this.reset = function() { b.mode = b.modes.STOP; b._speed_sp = 0; dc.gocDung = null; b.stop_action = 'hold'; b.stop(); };
    this.render = function(delta) {
      renderGoc(delta);
      // chạy mãi hoặc chạy theo thời gian: tới đầu hành trình thì dừng và giữ ở đó
      if ((b.mode == b.modes.RUN || b.mode == b.modes.RUN_TIL_TIME) && ((b.position >= ts.gocMax && b._speed_sp > 0) || (b.position <= ts.gocMin && b._speed_sp < 0))) {
        b.stop(b.position >= ts.gocMax ? ts.gocMax : ts.gocMin);
      }
    };
    // Lệnh gọn cho bảng lắp ráp và kiểm tra: quay tới góc (độ) với tốc độ tối đa
    this.quayToi = function(goc, tocDo) { b.speed_sp = tocDo || ts.tocDoLenhToiDa; b.position_target = goc; b.runToPosition(); };
    this.stop();
  }

  // ---------- Dựng xe ----------
  this.dung = function(r, scene, robotStart) {
    let o = r.options;
    r.processedOptions = Object.assign({}, r.defaultOptions, o);
    r.scene = scene;
    let banLap = SRALinhKien.lapXe(o.sraXe === true ? {} : o.sraXe);
    let kl = SRALinhKien.tinhXe(banLap);
    r.sraBanLap = banLap; r.sraKhoiLuong = kl;

    let startPos = (robotStart && robotStart.position) || new BABYLON.Vector3(0, 0, 0);
    let startRot = (robotStart && robotStart.rotation) || new BABYLON.Vector3(0, 0, 0);
    let tam = kl.than.tam;

    // Nút gốc của thân, đặt tại trọng tâm thân (Bullet yêu cầu gốc vật thể là trọng tâm)
    let than = new BABYLON.Mesh('body', scene);
    than.position = new BABYLON.Vector3(startPos.x, startPos.y + tam[1], startPos.z);
    than.rotationQuaternion = BABYLON.Quaternion.Identity();
    than.rotate(BABYLON.Axis.Y, startRot.y, BABYLON.Space.LOCAL);
    than.rotate(BABYLON.Axis.X, startRot.x, BABYLON.Space.LOCAL);
    than.rotate(BABYLON.Axis.Z, startRot.z, BABYLON.Space.LOCAL);
    than.sraXe = true;
    let q0 = [than.rotationQuaternion.x, than.rotationQuaternion.y, than.rotationQuaternion.z, than.rotationQuaternion.w];
    let p0 = [than.position.x, than.position.y, than.position.z];
    // điểm trong hệ trục xe → toạ độ sân lúc xuất phát
    let raSan = (p) => V.cong(p0, Q.quay(q0, V.tru(p, tam)));
    function nutGoc(ten, p) {
      let m = new BABYLON.Mesh(ten, scene);
      let w = raSan(p);
      m.position = new BABYLON.Vector3(w[0], w[1], w[2]);
      m.rotationQuaternion = new BABYLON.Quaternion(q0[0], q0[1], q0[2], q0[3]);
      m.sraXe = true;
      return m;
    }

    let nut = { than: than, banh: banLap.banh.map((b) => nutGoc('wheel', b.tam)) };
    if (banLap.bi) nut.bi = nutGoc('sraBi', banLap.bi.tam);
    if (banLap.canGat) nut.canGat = nutGoc('sraTamCan', V.cong(banLap.canGat.tam, kl.canGat.tam));
    if (banLap.servo) nut.servo = nutGoc('sraServo', V.cong(banLap.servo.tam, kl.servo.tam));

    // Lưới 3D
    let luoi = SRAXeDungHinh.dungVat(scene, 'sraThan', banLap.than, tam, than);
    let hitbox = [];
    let dsKhoiThan = banLap.than.reduce((a, ct) => a.concat(ct.khoi), []);
    hitbox.push(SRAXeDungHinh.dungKhungHitbox(scene, 'sraThan', dsKhoiThan, tam, than));
    banLap.banh.forEach(function(b, i) {
      luoi = luoi.concat(SRAXeDungHinh.dungVat(scene, 'sraBanh' + i, [{ khoi: b.khoi, trangTri: b.trangTri }], [0, 0, 0], nut.banh[i]));
      hitbox.push(SRAXeDungHinh.dungKhungHitbox(scene, 'sraBanh' + i, b.khoi, [0, 0, 0], nut.banh[i]));
    });
    if (nut.bi) {
      let kb = [H.chuanHoa({ k: 'cau', d: banLap.bi.d, vl: banLap.bi.vl })];
      luoi = luoi.concat(SRAXeDungHinh.dungVat(scene, 'sraBi', [{ khoi: kb }], [0, 0, 0], nut.bi));
      hitbox.push(SRAXeDungHinh.dungKhungHitbox(scene, 'sraBi', kb, [0, 0, 0], nut.bi));
    }
    if (nut.canGat) {
      luoi = luoi.concat(SRAXeDungHinh.dungVat(scene, 'sraTamCan', [banLap.canGat], kl.canGat.tam, nut.canGat));
      hitbox.push(SRAXeDungHinh.dungKhungHitbox(scene, 'sraTamCan', banLap.canGat.khoi, kl.canGat.tam, nut.canGat));
    }
    if (nut.servo) {
      luoi = luoi.concat(SRAXeDungHinh.dungVat(scene, 'sraServo', [banLap.servo], kl.servo.tam, nut.servo));
      hitbox.push(SRAXeDungHinh.dungKhungHitbox(scene, 'sraServo', banLap.servo.khoi, kl.servo.tam, nut.servo));
    }
    r.sraServoNut = nut.servo || null;
    r.sraLuoi = luoi;
    r.sraHitbox = hitbox.filter((m) => m);
    r.sraHitbox.forEach((m) => m.setEnabled(self.hienHitbox));

    // Vật lí
    let vl = new SRAXeVatLi.Xe(scene, banLap, kl, nut);
    r.sraVatLi = vl;
    vl.datGioiHanCanGat(SRAXeVatLi.DAU_CAN_GAT);

    r.body = than;
    r.leftWheel = new BanhXe(banLap.banh[0], vl.banh[0], nut.banh[0]);
    r.rightWheel = new BanhXe(banLap.banh[1], vl.banh[1], nut.banh[1]);
    r.leftWheel.stop(); r.rightWheel.stop();

    // Cảm biến
    r.components = [];
    r.sensorCount = 0;
    r.motorCount = 2;
    r.componentIndex = 0;
    if (vl.servo) {
      let s = new ServoXe(banLap.servo, vl, nut.servo);
      s.componentIndex = r.componentIndex++;
      r.motorCount++;
      r.components.push(s);
      r.sraServo = s;
    } else r.sraServo = null;
    if (typeof SRAXeCamBien != 'undefined') {
      banLap.camBien.forEach(function(cb) {
        let c = SRAXeCamBien.tao(cb, r, scene, banLap);
        if (!c) return;
        c.port = cb.cong; c.componentIndex = r.componentIndex++;
        r.sensorCount++;
        r.components.push(c);
      });
    }
    if (typeof r.addLabel == 'function') r.addLabel();
    return Promise.resolve();
  };

  // Bật/tắt khung hitbox
  this.datHienHitbox = function(bat) {
    self.hienHitbox = !!bat;
    if (typeof robot != 'undefined' && robot.sraHitbox) robot.sraHitbox.forEach((m) => m.setEnabled(self.hienHitbox));
  };

  // Mục "Lắp ráp xe" và "Hiện hitbox của xe" trong menu Robot
  if (typeof window != 'undefined' && typeof window.menuDropDown == 'function') {
    let menuGoc = window.menuDropDown;
    window.menuDropDown = function($nut, muc, tuyChon) {
      let laMenuRobot = tuyChon && tuyChon.className == 'robotMenuDropDown' && typeof robot != 'undefined';
      if (laMenuRobot && typeof SRABangLapRap != 'undefined' && SRABangLapRap.dungDuoc()) {
        muc = muc.concat([{
          html: (SRABangLapRap.dangMo ? '<span class="tick">&#x2713;</span> ' : '') + sraT('Lắp ráp xe (kéo thả cảm biến)', 'Build car (drag and drop sensors)'),
          line: false,
          callback: function() { SRABangLapRap.batTat(); }
        }]);
      }
      if (laMenuRobot && robot.sraHitbox) {
        muc = muc.concat([{
          html: (self.hienHitbox ? '<span class="tick">&#x2713;</span> ' : '') + sraT('Hiện hitbox của xe', 'Show car hitbox'),
          line: false,
          callback: function() { self.datHienHitbox(!self.hienHitbox); }
        }]);
      }
      return menuGoc($nut, muc, tuyChon);
    };
  }

  // ---------- Móc vào GEARS ----------
  function boc(r) {
    if (r._sraXeBoc) return;
    r._sraXeBoc = true;
    let napGoc = r.load;
    r.load = function(scene, robotStart) {
      if (!r.options || !r.options.sraXe) {
        r.sraVatLi = null; r.sraBanLap = null; r.sraLuoi = null; r.sraHitbox = null;
        return napGoc.apply(r, arguments);
      }
      return self.dung(r, scene, robotStart);
    };
  }
  if (typeof robots != 'undefined') robots.forEach(boc);

  // Xe đứng đầu danh sách chọn robot (menu Robot → Chọn robot) và là robot mặc định của mọi sân:
  // robots/xe-lap-rap.js đã đưa nó lên đầu robotTemplates trước khi trang tạo robot. Ở đây chỉ áp bản
  // lắp người dùng đã lưu (bảng lắp ráp) vào mẫu và vào robot đang dùng, trước khi sân được dựng.
  this.TEN = 'siro_xeLapRap';
  if (typeof robotTemplates != 'undefined') {
    let mau = robotTemplates.find((t) => t.name == self.TEN);
    if (mau && typeof SRABangLapRap != 'undefined') {
      SRABangLapRap.apVaoMau(mau);
      if (typeof robot != 'undefined' && robot.options && robot.options.name == self.TEN && !robot.body) robot.options = JSON.parse(JSON.stringify(mau));
    }
  }
};
