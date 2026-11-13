// Sân Robot Ảo – cảm biến chạm và khoảng cách trong khung thử thách (gói G6).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Tệp này thêm vào khung thử thách (nạp sau challenge-engine.js):
//
// 1. Tia đo: vẽ các tia của cảm biến khoảng cách (siêu âm) lên sân, tô sáng tia
//    ngắn nhất (tia quyết định số đo), chấm đỏ ở điểm chạm kèm số cm; thanh cản
//    của cảm biến chạm sáng lên khi bị ấn. Học sinh thấy cảm biến "nhìn" gì.
//    Bật bằng trường "hienTiaDo": true trong tệp bài (có ô tắt/bật trong khung đề).
// 2. Hai dòng cho bảng số đo chung (core/so-do.js): "khoangCach" và "camBienCham".
//    Bài bật bằng "soDo": ["khoangCach", "camBienCham"].
// 3. "ketThucKhiVao": tên vùng; robot vào vùng đó thì lượt chạy kết thúc ngay
//    (dùng cho bài có vòng lặp mãi như mê cung).
// 4. Luật chấm mới: khoangCachCuoi (số đo cảm biến khoảng cách lúc dừng).
// 5. Dòng tên phiên bản sân ("bienThe" của challenge-engine.js) dưới khung đề, nếu
//    phiên bản có trường "ten".
//
// Cách tính khoảng cách giống hệt UltrasonicSensor.getDistance() của GEARS
// (public/js/robotComponents.js): 21 tia hình quạt, lấy tia trúng gần nhất,
// bỏ tia chạm mặt quá xiên.

var SRA = window.SRA || {};
window.SRA = SRA;

(function() {
  // -------------------------------------------------------------------------
  // Tìm cảm biến trên robot
  // -------------------------------------------------------------------------
  SRA.timCamBien = function(loai) {
    if (typeof robot == 'undefined' || !robot.getComponentByPort) return null;
    for (let i = 1; i <= 12; i++) {
      let c = robot.getComponentByPort('in' + i);
      if (c && c.type == loai) return c;
    }
    return null;
  };

  // Đo từng tia của cảm biến khoảng cách. Trả về
  // { goc: Vector3, tia: [{ huong, dai, hop }], ganNhat: chỉ số tia, khoangCach }
  // hop = true nếu tia được tính (trúng vật, không quá xiên).
  SRA.doTia = function(cb) {
    let o = cb.options;
    let q = cb.body.absoluteRotationQuaternion;
    let lech = new BABYLON.Vector3(0, 0, 0);
    o.rayOrigin.rotateByQuaternionToRef(q, lech);
    let goc = cb.body.absolutePosition.add(lech);
    let ketQua = { goc: goc, tia: [], ganNhat: -1, khoangCach: o.rayLength };
    let ray = new BABYLON.Ray(goc, new BABYLON.Vector3(0, 0, 1), o.rayLength);
    cb.rayVectors.forEach(function(v, i) {
      let huong = new BABYLON.Vector3(0, 0, 0);
      v.rotateByQuaternionToRef(q, huong);
      ray.direction.copyFrom(huong);
      let hit = babylon.scene.pickWithRay(ray, cb.filterRay);
      let t = { huong: huong, dai: o.rayLength, hop: false, trung: false };
      if (hit && hit.hit && hit.pickedMesh.ultrasonicDetection != 'absorb') {
        t.dai = hit.distance;
        t.trung = true;
        let n = hit.getNormal(true);
        if (n) {
          let c = Math.abs(BABYLON.Vector3.Dot(n, huong));
          t.hop = c > o.rayIncidentLimit && c < (Math.PI - o.rayIncidentLimit);
        }
        if (t.hop && t.dai < ketQua.khoangCach) {
          ketQua.khoangCach = t.dai;
          ketQua.ganNhat = i;
        }
      }
      ketQua.tia.push(t);
    });
    return ketQua;
  };

  SRA.docKhoangCach = function() {
    let cb = SRA.timCamBien('UltrasonicSensor');
    if (!cb || !cb.body || typeof babylon == 'undefined' || !babylon.scene) return null;
    return SRA.doTia(cb).khoangCach;
  };

  function soDep(x) {
    return (Math.round(x * 10) / 10).toString().replace('.', ',');
  }

  // -------------------------------------------------------------------------
  // Luật chấm: số đo cảm biến khoảng cách lúc dừng
  // -------------------------------------------------------------------------
  SRA.luat.khoangCachCuoi = {
    moTa: function(dk) {
      return 'Lúc dừng, cảm biến khoảng cách đo được từ ' + soDep(dk.tu) + ' đến ' + soDep(dk.den) + ' cm';
    },
    kiemTra: function(dk, ctx) {
      if (ctx.khoangCach == null) return { dat: false, lyDo: 'Robot không có cảm biến khoảng cách.' };
      let d = ctx.khoangCach;
      let dat = d >= dk.tu && d <= dk.den;
      let lyDo = 'Lúc dừng, cảm biến đo được ' + soDep(d) + ' cm';
      if (!dat) lyDo += ' (cần từ ' + soDep(dk.tu) + ' đến ' + soDep(dk.den) + ' cm)';
      return { dat: dat, lyDo: lyDo + '.' };
    }
  };
  SRA.TEN_KHOI.sra_khoang_cach = '"khoảng cách phía trước (cm)"';
  SRA.TEN_KHOI.sra_dang_cham = '"cảm biến chạm đang bị nhấn?"';
  SRA.TEN_KHOI.wait_until = '"chờ đến khi"';

  // Bổ sung số đo cảm biến vào bản ghi lượt chạy trước khi chấm
  let chamDiemGoc = SRA.chamDiem;
  SRA.chamDiem = function(ctx, hetGio) {
    let d = SRA.docKhoangCach();
    ctx.khoangCach = d == null ? null : Math.round(d * 10) / 10;
    ctx.bienThe = SRA.soBienThe;
    return chamDiemGoc(ctx, hetGio);
  };

  // -------------------------------------------------------------------------
  // Kết thúc lượt khi robot vào vùng đích (bài lặp mãi)
  // -------------------------------------------------------------------------
  let renderGoc = SRA.world.render;
  SRA.world.render = function(delta) {
    renderGoc(delta);
    let w = SRA.world;
    let ten = SRA.bai && SRA.bai.ketThucKhiVao;
    if (!ten || w.trangThai != 'dang-chay' || !robot.body) return;
    let v = (SRA.baiHienTai().vung || {})[ten];
    if (!v) return;
    let vt = w.viTriRobot();
    if (SRA.trongVung(v, vt.x, vt.y)) {
      skulpt.hardInterrupt = true;
      simPanel.setRunIcon('run');
      if (robot.leftWheel) robot.leftWheel.stop();
      if (robot.rightWheel) robot.rightWheel.stop();
      w.ketThuc(false);
    }
  };

  // -------------------------------------------------------------------------
  // Vẽ tia đo và làm sáng thanh cản
  // -------------------------------------------------------------------------
  SRA.tiaDo = new function() {
    let self = this;
    this.bat = false;
    let canh = null;       // scene đang vẽ (GEARS dựng lại scene mỗi lần Đặt lại)
    let m = {};            // các mesh vẽ
    let nhan = { text: '' };
    let demKhung = 0;
    let thoiDiemCham = 0;
    let vatLieuSang = null;

    const DAI_HIEN = 150;  // tia không trúng gì chỉ vẽ dài chừng này (cm)

    function taoMesh() {
      let sc = babylon.scene;
      canh = sc;
      let tiaRong = [];
      for (let i = 0; i < 21; i++) tiaRong.push([BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 1)]);
      m.quat = BABYLON.MeshBuilder.CreateLineSystem('sraTiaQuat', { lines: tiaRong, updatable: true }, sc);
      m.quat.color = new BABYLON.Color3(1, 0.85, 0.2);
      m.quat.alpha = 0.45;
      m.chinh = BABYLON.MeshBuilder.CreateLines('sraTiaChinh', {
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 1)], updatable: true
      }, sc);
      m.chinh.color = new BABYLON.Color3(1, 0.1, 0.1);
      m.diem = BABYLON.MeshBuilder.CreateSphere('sraDiemCham', { diameter: 3, segments: 8 }, sc);
      let vl = new BABYLON.StandardMaterial('sraDiemChamMat', sc);
      vl.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
      vl.emissiveColor = new BABYLON.Color3(1, 0.1, 0.1);
      vl.disableLighting = true;
      m.diem.material = vl;

      // Nhãn số cm, luôn quay về phía camera
      m.nhan = BABYLON.MeshBuilder.CreatePlane('sraNhanKC', { width: 24, height: 9 }, sc);
      m.nhan.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      m.chu = new BABYLON.DynamicTexture('sraNhanKCTex', { width: 256, height: 96 }, sc, false);
      m.chu.hasAlpha = true;
      let vl2 = new BABYLON.StandardMaterial('sraNhanKCMat', sc);
      vl2.diffuseTexture = m.chu;
      vl2.emissiveColor = new BABYLON.Color3(1, 1, 1);
      vl2.disableLighting = true;
      vl2.useAlphaFromDiffuseTexture = true;
      vl2.backFaceCulling = false;
      m.nhan.material = vl2;
      nhan.text = '';

      vatLieuSang = new BABYLON.StandardMaterial('sraThanhCanSang', sc);
      vatLieuSang.diffuseColor = new BABYLON.Color3(1, 0.95, 0.2);
      vatLieuSang.emissiveColor = new BABYLON.Color3(1, 0.85, 0.1);

      for (let k in m) {
        if (m[k] && m[k].isPickable !== undefined) m[k].isPickable = false;
      }
      self.hien(self.bat);
    }

    function veChu(s) {
      if (s == nhan.text) return;
      nhan.text = s;
      let ctx = m.chu.getContext();
      ctx.clearRect(0, 0, 256, 96);
      ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(4, 8, 248, 80, 18); ctx.fill(); }
      else ctx.fillRect(4, 8, 248, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s, 128, 50);
      m.chu.update();
    }

    this.hien = function(b) {
      self.bat = b;
      for (let k of ['quat', 'chinh', 'diem', 'nhan']) {
        if (m[k] && !m[k].isDisposed()) m[k].setEnabled(b);
      }
    };

    this.render = function() {
      if (typeof babylon == 'undefined' || !babylon.scene || typeof robot == 'undefined' || !robot.body) return;
      if (!SRA.bai || SRA.bai.hienTiaDo === undefined) return;
      if (canh !== babylon.scene || !m.quat || m.quat.isDisposed()) taoMesh();

      // Thanh cản sáng lên khi bị ấn (giữ sáng 0,15 giây để mắt kịp thấy)
      let cham = SRA.timCamBien('TouchSensor');
      let dangCham = false;
      if (cham && cham.fakeSensor) {
        let now = performance.now();
        if (cham.isPressed()) thoiDiemCham = now;
        dangCham = now - thoiDiemCham < 150;
        if (!cham.vatLieuGoc) cham.vatLieuGoc = cham.fakeSensor.material;
        cham.fakeSensor.material = (dangCham && self.bat) ? vatLieuSang : cham.vatLieuGoc;
      }

      // Đo tia mỗi 2 khung hình để đỡ nặng máy
      demKhung++;
      let cb = SRA.timCamBien('UltrasonicSensor');
      if (!cb || !cb.body) return;
      if (demKhung % 2 && self.kq) { capNhatBang(self.kq.khoangCach, dangCham); return; }
      let kq = SRA.doTia(cb);
      self.kq = kq;
      capNhatBang(kq.khoangCach, dangCham);
      if (!self.bat) return;

      let duong = kq.tia.map(function(t) {
        let dai = t.trung ? Math.min(t.dai, DAI_HIEN) : DAI_HIEN;
        return [kq.goc, kq.goc.add(t.huong.scale(dai))];
      });
      BABYLON.MeshBuilder.CreateLineSystem(null, { lines: duong, instance: m.quat });

      if (kq.ganNhat >= 0) {
        let t = kq.tia[kq.ganNhat];
        let cuoi = kq.goc.add(t.huong.scale(t.dai));
        BABYLON.MeshBuilder.CreateLines(null, { points: [kq.goc, cuoi], instance: m.chinh });
        m.chinh.setEnabled(true);
        m.diem.position.copyFrom(cuoi);
        m.diem.setEnabled(true);
        let giua = kq.goc.add(cuoi).scale(0.5);
        m.nhan.position.set(giua.x, giua.y + 12, giua.z);
        m.nhan.setEnabled(true);
        veChu(Math.round(kq.khoangCach) + ' cm');
      } else {
        m.chinh.setEnabled(false);
        m.diem.setEnabled(false);
        m.nhan.setEnabled(false);
      }
    };
  };

  // -------------------------------------------------------------------------
  // Số đo trực tiếp (bảng số đo chung) và ô bật/tắt tia trong khung đề bài
  // -------------------------------------------------------------------------
  let dangChamHien = false;
  function capNhatBang(kc, cham) { dangChamHien = !!cham; }

  if (SRA.soDo) {
    SRA.soDo.them({
      id: 'khoangCach', ten: 'Khoảng cách phía trước', nhom: 'Cảm biến', donVi: 'cm', soLe: 1,
      doc: function() {
        let cb = SRA.timCamBien('UltrasonicSensor');
        if (!cb || !SRA.tiaDo.kq) return null;
        let kc = SRA.tiaDo.kq.khoangCach;
        return kc >= cb.options.rayLength ? 'không thấy vật' : kc;
      }
    });
    SRA.soDo.them({
      id: 'camBienCham', ten: 'Cảm biến chạm', nhom: 'Cảm biến',
      doc: function() {
        if (!SRA.timCamBien('TouchSensor')) return null;
        return dangChamHien ? 'đang bị nhấn' : 'không';
      }
    });
  }

  let $bang = null;
  function capNhatTenBienThe() {
    if (!$bang) return;
    let ds = SRA.bai && SRA.bai.bienThe;
    let $t = $bang.find('.sra-bien-the');
    let i = SRA.soBienThe;
    if (!ds || ds.length < 2 || i == null) { $t.hide(); return; }
    let ten = (ds[i] && ds[i].ten) || ('sân số ' + (i + 1));
    $t.show().text('Lượt này: ' + ten + '. Mỗi lần bấm ▶ Chạy, sân có thể đổi khác.');
  }

  let dungGoc = SRA.giaoDien.dung;
  SRA.giaoDien.dung = function(bai) {
    let kq = dungGoc.apply(this, arguments);
    if (bai.hienTiaDo === undefined) return kq;
    let luu = null;
    try { luu = localStorage.getItem('sanRobotAo.hienTiaDo'); } catch (e) {}
    let bat = luu == null ? !!bai.hienTiaDo : luu == '1';
    $bang = $(
      '<div class="sra-bang-cam-bien">' +
        '<label class="sra-bat-tia"><input type="checkbox"' + (bat ? ' checked' : '') + '> Hiện tia đo của cảm biến</label>' +
        '<div class="sra-bien-the sra-nho"></div>' +
      '</div>'
    );
    $('#sraKhung .sra-chan').prepend($bang);
    SRA.tiaDo.hien(bat);
    $bang.find('input').on('change', function() {
      SRA.tiaDo.hien(this.checked);
      try { localStorage.setItem('sanRobotAo.hienTiaDo', this.checked ? '1' : '0'); } catch (e) {}
    });
    return kq;
  };

  // Tên phiên bản sân cập nhật sau mỗi lần dựng lại sân
  let resetGoc = SRA.world.reset;
  SRA.world.reset = function() {
    let kq = resetGoc.apply(this, arguments);
    capNhatTenBienThe();
    return kq;
  };

  if (typeof babylon != 'undefined') babylon.renders.push(function() { SRA.tiaDo.render(); });
})();
