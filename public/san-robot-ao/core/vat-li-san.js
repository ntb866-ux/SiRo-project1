// Sân Robot Ảo – tác động vật lí riêng của từng bài (gói G8): mặt sân trơn, cú đẩy.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Trường thêm trong tệp bài:
//
//   "matSan": { "maSat": 0.15 }
//       Hệ số ma sát của mặt sân (sân thường là 1). Số nhỏ thì sân trơn như băng:
//       bánh dễ trượt, robot phanh lại vẫn còn trôi.
//
//   "cuDay": [ { "vung": "gio", "phia": "phai", "manh": 1 } ]
//       Lần đầu tâm robot đi vào vùng `vung`, robot bị một cú đẩy ngang vào mũi,
//       từ bên trái sang (`phia: "phai"`, mũi bị lệch sang phải) hoặc ngược lại.
//       `manh` = 1 làm robot chuẩn đang chạy tốc độ 40–50 % lệch khoảng 30°.
//       Cú đẩy là một xung lực (đổi động lượng tức thời), nên robot nặng hơn, chạy
//       chậm hơn hay sân bám hơn thì lệch ít hơn.

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.XUNG_LUC_DAY = 40000;   // xung lực ứng với manh = 1 (đơn vị của GEARS)

// Sửa lỗi làm tròn của Babylon 4.2: GetAngleBetweenVectors gọi Math.acos(tích vô hướng)
// mà không kẹp về [−1, 1]. Khi hai vectơ gần như trùng nhau, tích vô hướng thành
// 1,0000000002 và acos trả NaN. GEARS dùng hàm này để đọc góc quay bánh xe, nên từ lúc đó
// vị trí và tốc độ bánh thành NaN mãi: robot không bao giờ được coi là "đứng yên", lượt
// chạy không kết thúc, lệnh đếm vòng bánh không dừng. Hay gặp sau nhiều lần quay (vẽ ngôi sao).
(function() {
  let V = BABYLON.Vector3;
  V.GetAngleBetweenVectors = function(v0, v1, phapTuyen) {
    let a = v0.normalizeToNew(), b = v1.normalizeToNew();
    let cos = Math.max(-1, Math.min(1, V.Dot(a, b)));
    return V.Dot(V.Cross(a, b), phapTuyen) > 0 ? Math.acos(cos) : -Math.acos(cos);
  };
})();

(function() {
  let dungGoc = SRA.dungOptionsSan;
  SRA.dungOptionsSan = function(san, bai) {
    let o = dungGoc.apply(this, arguments);
    if (bai.matSan && typeof bai.matSan.maSat == 'number') o.groundFriction = bai.matSan.maSat;
    return o;
  };

  let w = SRA.world;
  let startGoc = w.startSim;
  w.startSim = function() {
    w.daDay = {};
    return startGoc.apply(this, arguments);
  };

  function day(cd) {
    let b = robot.body;
    if (!b || !b.physicsImpostor) return;
    let q = b.rotationQuaternion;
    let g = q ? q.toEulerAngles().y : b.rotation.y;
    let dau = (cd.phia == 'trai') ? -1 : 1;
    let J = SRA.XUNG_LUC_DAY * (cd.manh || 1) * dau;
    let mui = b.absolutePosition.add(new BABYLON.Vector3(Math.sin(g) * 8, 0, Math.cos(g) * 8));
    // Hướng sang phải của robot là (cos g, −sin g) trong mặt phẳng x–z của Babylon
    b.physicsImpostor.applyImpulse(new BABYLON.Vector3(Math.cos(g) * J, 0, -Math.sin(g) * J), mui);
    if (SRA.giaoDien) {
      SRA.giaoDien.hienTrangThai(cd.thongBao || 'Ối! Robot bị đẩy lệch sang ' + (dau > 0 ? 'phải' : 'trái') + '.', 'dang-chay');
    }
  }

  let renderGoc = w.render;
  w.render = function(delta) {
    let kq = renderGoc.apply(this, arguments);
    let bai = SRA.bai;
    if (w.trangThai != 'dang-chay' || !bai || !bai.cuDay || !robot.body) return kq;
    let vt = w.viTriRobot();
    bai.cuDay.forEach(function(cd, i) {
      if (w.daDay[i]) return;
      let v = (bai.vung || {})[cd.vung];
      if (v && SRA.trongVung(v, vt.x, vt.y)) {
        w.daDay[i] = true;
        day(cd);
      }
    });
    return kq;
  };
})();
