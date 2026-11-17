// Máy quay góc thứ ba kiểu game đua xe, và mặt sân trong suốt nhẹ khi nhìn từ dưới lên.
//
// Góc thứ ba: máy quay luôn đặt chếch phía sau (hoặc phía trước, bên trái, bên phải) xe và quay theo hướng xe.
// Hướng máy quay bám theo hướng xe với độ trễ nhỏ (hằng số thời gian TRE giây) như game đua xe, nên khi xe
// rẽ gắt ta thấy được thân xe xoay chứ không thấy cả sân xoay theo. Con lăn chuột vẫn đổi khoảng cách.
//
// Nhìn từ dưới lên: khi máy quay xuống thấp hơn mặt sân, các vật phẳng sát sân (mặt sân, vạch, ô màu) mờ đi
// còn TRONG_SUOT độ đục và vẽ cả mặt sau, để thấy được vạch kẻ trên sân lẫn cấu tạo gầm xe. Chỉ ảnh trên
// màn hình bị đổi: trước khi vẽ cho camera của cảm biến (cảm biến màu kiểu cũ), mặt sân trở lại đục.
var SRAMayQuay = new function() {
  let self = this;
  const TRE = 0.25;                       // giây: hằng số thời gian bám hướng xe
  const TRONG_SUOT = 0.35;                // độ đục của mặt sân khi nhìn từ dưới lên
  const BETA = 1.15;                      // rad từ phương thẳng đứng: máy quay chếch xuống khoảng 24° so với mặt sân
  const BAN_KINH = 45;                    // cm: khoảng cách mặc định tới xe
  // Lệch so với hướng ngay sau xe (rad): sau, trước, trái, phải
  const LECH = { sau: 0, truoc: Math.PI, trai: -Math.PI / 2, phai: Math.PI / 2 };
  const TEN = { sau: 'phía sau', truoc: 'phía trước', trai: 'bên trái', phai: 'bên phải' };
  this.TEN = TEN;

  this.goc = null;                        // 'sau' | 'truoc' | 'trai' | 'phai' | null (không bám)
  let alpha = null, lanTruoc = 0;

  // Hướng xe (rad, quanh trục đứng; 0 là nhìn về +z)
  function huongXe() {
    try {
      let q = robot.body.absoluteRotationQuaternion || robot.body.rotationQuaternion;
      // hướng mũi xe chiếu xuống mặt sân (bền hơn góc Euler khi xe nghiêng)
      let v = new BABYLON.Vector3(0, 0, 1);
      v.rotateByQuaternionToRef(q, v);
      return Math.atan2(v.x, v.z);
    } catch (e) { return 0; }
  }
  // Góc alpha của ArcRotateCamera để máy quay nằm ở hướng lech so với phía sau xe
  // (vị trí máy quay = tâm + r·(cos α·sin β, cos β, sin α·sin β); phía sau xe hướng h ứng với α = −π/2 − h)
  const alphaDich = (h, lech) => -Math.PI / 2 - h + lech;
  const chuanGoc = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  // Chọn góc thứ ba; goc null là thôi bám (trở về máy quay theo xe bình thường)
  this.chon = function(goc) {
    if (typeof babylon == 'undefined' || !babylon.cameraArc) return;
    self.goc = LECH[goc] != null ? goc : null;
    alpha = null;
    if (!self.goc) return;
    babylon.setCameraMode('follow');
    let cam = babylon.cameraArc;
    cam.radius = BAN_KINH;
    cam.beta = BETA;
    cam.targetScreenOffset = new BABYLON.Vector2(0, 0);
  };

  function bam() {
    if (!self.goc || typeof babylon == 'undefined' || !babylon.cameraArc || typeof robot == 'undefined' || !robot.body) return;
    if (babylon.cameraMode != 'follow') { self.goc = null; return; }
    let cam = babylon.cameraArc, bay = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, bay - lanTruoc));
    lanTruoc = bay;
    let dich = alphaDich(huongXe(), LECH[self.goc]);
    if (alpha == null) alpha = dich;
    else alpha += chuanGoc(dich - alpha) * (1 - Math.exp(-dt / TRE));
    cam.alpha = alpha;
    cam.beta = BETA;
  }

  // ---------- Mặt sân trong suốt khi nhìn từ dưới lên ----------
  let canhDaMoc = null, dangMo = false, dsMat = [], denCu = null;
  const laCuaXe = (m) => m.sraXe || (typeof robot != 'undefined' && robot.body && (m == robot.body || m.isDescendantOf(robot.body)));
  // Các vật phẳng sát mặt sân (không phải xe): mặt sân, tấm vạch, ô màu
  function matSan(scene) {
    return scene.meshes.filter(function(m) {
      if (!m.isVisible || laCuaXe(m) || !m.getTotalVertices || m.getTotalVertices() == 0) return false;
      let b = m.getBoundingInfo().boundingBox;
      return b.maximumWorld.y <= 0.5 && (b.maximumWorld.x - b.minimumWorld.x) > 2 && (b.maximumWorld.z - b.minimumWorld.z) > 2;
    });
  }
  function moDi(scene) {
    if (dangMo) return;
    dsMat = matSan(scene).map(function(m) {
      let vl = m.material, cu = { m: m, vis: m.visibility, vl: vl, mat: vl ? vl.backFaceCulling : null };
      m.visibility = TRONG_SUOT;
      if (vl) vl.backFaceCulling = false;
      return cu;
    });
    // gầm xe chỉ được chiếu bởi phần "ánh sáng từ dưới" của đèn bầu trời (rất tối): tạm làm sáng lên để thấy cấu tạo
    let den = scene.getLightByName('light1');
    if (den && den.groundColor) { denCu = { den: den, mau: den.groundColor.clone() }; den.groundColor = new BABYLON.Color3(0.55, 0.55, 0.55); }
    dangMo = true;
  }
  function traLai() {
    if (!dangMo) return;
    dsMat.forEach(function(cu) {
      cu.m.visibility = cu.vis;
      if (cu.vl && cu.mat != null) cu.vl.backFaceCulling = cu.mat;
    });
    dsMat = [];
    if (denCu) { denCu.den.groundColor = denCu.mau; denCu = null; }
    dangMo = false;
  }
  this.dangTrongSuot = () => dangMo;

  function mocCanh(scene) {
    if (canhDaMoc == scene) return;
    canhDaMoc = scene;
    dangMo = false; dsMat = []; denCu = null;
    scene.onBeforeCameraRenderObservable.add(function(cam) {
      if (cam != babylon.cameraArc) { traLai(); return; }
      if (cam.globalPosition.y < -0.5) moDi(scene); else traLai();
    });
    scene.onAfterRenderObservable.add(traLai);
  }
  // Camera của cảm biến (render target) luôn thấy mặt sân đục như thật
  function mocRTT(scene) {
    (scene.customRenderTargets || []).forEach(function(rt) {
      if (rt.sraMayQuay) return;
      rt.sraMayQuay = true;
      let dang = false;
      rt.onBeforeRenderObservable.add(function() { dang = dangMo; traLai(); });
      rt.onAfterRenderObservable.add(function() { if (dang) moDi(scene); });
    });
  }

  function moiKhung() {
    if (typeof babylon == 'undefined' || !babylon.scene) return;
    mocCanh(babylon.scene);
    mocRTT(babylon.scene);
    bam();
  }

  // Phím C: đổi vòng sau → trước → trái → phải → thôi bám (khi con trỏ không ở ô nhập chữ)
  this.doiVong = function() {
    let ds = ['sau', 'truoc', 'trai', 'phai', null];
    let k = ds[(ds.indexOf(self.goc) + 1) % ds.length];
    self.chon(k);
    return k;
  };

  this.khoiDong = function() {
    if (typeof babylon == 'undefined' || !babylon.engine) { setTimeout(self.khoiDong, 300); return; }
    babylon.engine.onBeginFrameObservable.add(moiKhung);
    // kéo xoay máy quay bằng chuột thì thôi bám góc thứ ba
    let canvas = babylon.canvas || document.getElementById('renderCanvas');
    if (canvas) canvas.addEventListener('pointerdown', function(e) {
      if (!self.goc || e.button != 0) return;
      let x0 = e.clientX, y0 = e.clientY;
      let di = function(ev) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) { self.goc = null; capNhatNut(); xong(); } };
      let xong = function() { canvas.removeEventListener('pointermove', di); window.removeEventListener('pointerup', xong); };
      canvas.addEventListener('pointermove', di);
      window.addEventListener('pointerup', xong);
    });
  };
  // Biểu tượng trên nút máy quay theo góc đang dùng
  function capNhatNut() {
    let $nut = typeof $ != 'undefined' ? $('.cameraSelector .camera') : null;
    if (!$nut || !$nut.length) return;
    let $o = self.goc ? $('.cameraSelector .cameraChase[data-goc="' + self.goc + '"]') : null;
    if ($o && $o.length) $nut.html($o.html());
    else if (babylon.cameraMode == 'follow') $nut.html('<span class="icon-cameraFollow"></span>');
  }
  if (typeof document != 'undefined') document.addEventListener('keydown', function(ev) {
    if (ev.key != 'c' && ev.key != 'C' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    let t = ev.target, ten = t && t.tagName;
    if (ten == 'INPUT' || ten == 'TEXTAREA' || ten == 'SELECT' || (t && t.isContentEditable) || (t && t.closest && t.closest('.blocklyWidgetDiv, .ace_editor, .joystick, .sra-lr-bang'))) return;
    if (!$('#simPanel').is(':visible')) return;
    self.doiVong();
    capNhatNut();
  });

  if (typeof window != 'undefined') {
    if (document.readyState == 'loading') document.addEventListener('DOMContentLoaded', () => self.khoiDong());
    else self.khoiDong();
  }
}();
