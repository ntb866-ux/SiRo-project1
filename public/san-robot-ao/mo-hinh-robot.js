// Sân Robot Ảo – gắn vỏ 3D (tệp .glb) lên robot GEARS.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Robot nào có trường "sraMoHinh" trong tệp cấu hình thì được khoác vỏ 3D:
//   "sraMoHinh": { "url": "models/...glb", "tiLe": 100, "dichChuyen": [x, y, z], "xoayY": 0 }
// - tiLe: hệ số phóng (tệp tính bằng mét, sân tính bằng cm nên thường là 100)
// - dichChuyen: lệch tâm vỏ so với tâm thân robot (cm, trục của thân: y lên, z tới trước)
// - xoayY: xoay vỏ quanh trục đứng (độ), dùng khi mô hình quay mặt sai hướng
//
// Vỏ chỉ để nhìn. Va chạm, bánh xe và cảm biến vẫn là các khối của GEARS (bị ẩn đi).
// Vỏ được nạp SAU khi GEARS đã đăng kí lưới cho cảm biến màu, và không "pick" được,
// nên cảm biến màu và cảm biến khoảng cách không nhìn thấy nó.
//
// Tệp này cũng thêm các robot có vỏ 3D vào danh sách chọn robot của GEARS.
(function() {
  if (typeof robot == 'undefined' || typeof BABYLON == 'undefined') return;

  const ROBOT_CO_VO = ['san-robot-ao/robots/mbot.json'];

  function anRobotGoc(r) {
    let ds = [r.body].concat(r.body.getChildMeshes(false));
    ds.forEach(function(m) {
      if (m.sraVo) return;
      m.visibility = 0;
    });
  }

  function ganVo(r) {
    let mh = r.options && r.options.sraMoHinh;
    if (!mh || !mh.url || !r.body || !r.scene) return Promise.resolve();
    let scene = r.scene;
    let body = r.body;
    return BABYLON.SceneLoader.ImportMeshAsync(null, '', mh.url, scene).then(function(kq) {
      // Thế giới đã nạp lại trong lúc chờ tải: bỏ vỏ cũ
      if (r.body !== body || body.isDisposed()) {
        kq.meshes.forEach(m => m.dispose());
        return;
      }
      let tiLe = Number(mh.tiLe) || 1;
      let d = mh.dichChuyen || [0, 0, 0];
      // Bọc nút gốc __root__ của glTF (giữ nguyên phép đổi hệ trục mà Babylon đã đặt)
      let vo = new BABYLON.TransformNode('sraVo', scene);
      vo.parent = body;
      vo.position = new BABYLON.Vector3(d[0] || 0, d[1] || 0, d[2] || 0);
      vo.rotation = new BABYLON.Vector3(0, (Number(mh.xoayY) || 0) * Math.PI / 180, 0);
      vo.scaling = new BABYLON.Vector3(tiLe, tiLe, tiLe);
      kq.meshes[0].parent = vo;
      kq.meshes.forEach(function(m) {
        m.sraVo = true;
        m.isPickable = false;
        m.ultrasonicDetection = 'invisible';
        m.laserDetection = 'invisible';
        if (mh.doBong && scene.shadowGenerator && m.getTotalVertices && m.getTotalVertices() > 0) {
          scene.shadowGenerator.addShadowCaster(m);
        }
      });
      anRobotGoc(r);
    }).catch(function(e) {
      console.warn('[Sân Robot Ảo] Không nạp được vỏ 3D', mh.url, e);
    });
  }

  // babylon.js gọi robot.loadMeshes khi mọi thứ trong sân đã nạp xong
  // (cảm biến màu lấy danh sách lưới ở bước này). Gắn vỏ ngay sau đó.
  let napLuoiGoc = robot.loadMeshes;
  robot.loadMeshes = function(meshes) {
    let kq = napLuoiGoc.apply(this, arguments);
    ganVo(this);
    return kq;
  };

  // Thêm robot có vỏ 3D vào danh sách chọn robot (menu Robot → Chọn robot)
  ROBOT_CO_VO.forEach(function(url) {
    fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(function(data) {
      if (!data || typeof robotTemplates == 'undefined') return;
      if (robotTemplates.some(t => t.name == data.name)) return;
      robotTemplates.push(data);
    }).catch(function() {});
  });
})();
