// Sân Robot Ảo – khung thử thách chạy trên GEARS (GearsBot).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Tệp này được nạp khi trang GEARS mở với tham số ?baiTap=<mã-bài>.
// Nó đọc tệp bài (thu-thach/<mã-bài>.json) và tệp sân (san/<sân>/world.json),
// dựng sân, đặt robot, hiển thị khung đề bài bên cạnh sân, theo dõi robot
// trong lúc chạy, chấm 1–3 sao và lưu tiến độ vào trình duyệt.
//
// Mã GEARS gốc không bị sửa, ngoài một dòng <script> nạp loader.js trong index.html.

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.GOC = 'san-robot-ao/';           // đường dẫn tính từ public/
SRA.THOI_GIAN_TOI_DA = 90;           // giây, nếu bài không ghi thoiGianToiDa
SRA.CHO_DUNG_MS = 400;               // robot đứng yên bao lâu thì coi là đã dừng

// ---------------------------------------------------------------------------
// Thế giới GEARS cho chế độ thử thách
// ---------------------------------------------------------------------------
SRA.world = new function() {
  World_Base.call(this);
  this.parent = {};
  for (let p in this) {
    this.parent[p] = this[p];
  }
  let self = this;

  this.name = 'sanRobotAo_thuThach';
  this.shortDescription = 'Thử thách Sân Robot Ảo';
  this.longDescription = '<p>Thế giới dùng cho các bài thử thách của Sân Robot Ảo.</p>';
  this.thumbnail = 'san-robot-ao/san/luoi-toa-do/thumb.png';
  this.optionsConfigurations = [];

  this.setOptions = function(options) {
    self.options = JSON.parse(JSON.stringify(self.defaultOptions));
    Object.assign(self.options, options || {});
    return self.parent.setOptions(self.options);
  };

  // Gọi mỗi khi cảnh được dựng lại (bấm Đặt lại, đổi robot…)
  this.reset = function() {
    self.trangThai = 'san-sang';     // san-sang | dang-chay | xong | huy
    self.vatCan = null;
    if (SRA.giaoDien) SRA.giaoDien.hienTrangThai('Sẵn sàng. Bấm ▶ Chạy để bắt đầu.', '');
  };

  this.startSim = function() {
    self.parent.startSim && self.parent.startSim();
    if (self.trangThai != 'san-sang') {
      // Robot chưa về chỗ xuất phát: lượt này không chấm
      self.trangThai = 'huy';
      SRA.giaoDien && SRA.giaoDien.hienTrangThai(
        'Robot chưa về vị trí xuất phát nên lượt này không được chấm. Hãy dùng nút ▶ Chạy ở khung đề bài, nút này tự đặt lại sân trước khi chạy.',
        'canh-bao');
      return;
    }
    self.luot = {
      t: 0,
      tDung: 0,
      daVao: new Set(),
      thuTuVao: [],
      soLanCham: 0,
      dangCham: false
    };
    self.trangThai = 'dang-chay';
    SRA.giaoDien && SRA.giaoDien.hienTrangThai('Robot đang chạy…', 'dang-chay');
  };

  this.stopSim = function() {
    if (self.trangThai == 'dang-chay') {
      self.trangThai = 'huy';
      SRA.giaoDien && SRA.giaoDien.hienTrangThai('Bạn đã dừng chương trình. Bấm ▶ Chạy để thử lại.', 'canh-bao');
    }
  };

  this.manualMoved = function() {
    if (self.trangThai == 'dang-chay' || self.trangThai == 'san-sang') {
      self.trangThai = 'huy';
      SRA.giaoDien && SRA.giaoDien.hienTrangThai('Robot đã được điều khiển bằng tay nên lượt này không chấm. Bấm ▶ Chạy để thử lại.', 'canh-bao');
    }
  };

  // Các mesh tính là "tường": 4 tường bao và vật thể cố định có vật lí
  function timVatCan() {
    let ds = [];
    for (let m of babylon.scene.meshes) {
      if (['wallTop', 'wallBottom', 'wallLeft', 'wallRight'].includes(m.name)) {
        ds.push(m);
      } else if (
        m.id && m.id.indexOf('worldBaseObject') == 0
        && m.physicsImpostor && m.physicsImpostor.mass == 0
      ) {
        ds.push(m);
      }
    }
    return ds;
  }

  function cacMeshRobot() {
    let ds = [robot.body].concat(robot.body.getChildMeshes(false));
    if (robot.leftWheel && robot.leftWheel.mesh) ds.push(robot.leftWheel.mesh);
    if (robot.rightWheel && robot.rightWheel.mesh) ds.push(robot.rightWheel.mesh);
    return ds.filter(m => m && m.isEnabled() && m.getTotalVertices && m.getTotalVertices() > 0);
  }

  // Vị trí robot = tâm quay (điểm giữa hai bánh, cũng là chỗ đặt bút vẽ), không phải tâm thân.
  // Robot quay tại chỗ quanh điểm này nên nó đứng yên khi quay, vùng tính đúng theo vết bút.
  this.viTriRobot = function() {
    let p = robot.body.absolutePosition;
    let q = robot.body.rotationQuaternion;
    let goc = q ? q.toEulerAngles().y : robot.body.rotation.y;
    goc = goc * 180 / Math.PI;
    goc = ((goc % 360) + 360) % 360;
    let lech = SRA.lechTrucBanh();
    let g = goc * Math.PI / 180;
    return { x: p.x + lech * Math.sin(g), y: p.z + lech * Math.cos(g), goc: goc };
  };

  function robotDungYen() {
    let l = robot.leftWheel ? Math.abs(robot.leftWheel.speed) : 0;
    let r = robot.rightWheel ? Math.abs(robot.rightWheel.speed) : 0;
    return l < 5 && r < 5;
  }

  this.render = function(delta) {
    self.parent.render(delta);
    if (self.trangThai != 'dang-chay' || !robot.body || !SRA.bai) return;

    let luot = self.luot;
    luot.t += delta / 1000;
    let vt = self.viTriRobot();

    // Vùng robot đi qua
    let vung = SRA.baiHienTai().vung || {};
    for (let ten in vung) {
      if (!luot.daVao.has(ten) && SRA.trongVung(vung[ten], vt.x, vt.y)) {
        luot.daVao.add(ten);
        luot.thuTuVao.push(ten);
      }
    }

    // Chạm tường: đếm mỗi lần bắt đầu chạm
    if (!self.vatCan) self.vatCan = timVatCan();
    let cham = false;
    let meshRobot = cacMeshRobot();
    for (let vc of self.vatCan) {
      for (let m of meshRobot) {
        if (m.intersectsMesh(vc, true)) { cham = true; break; }
      }
      if (cham) break;
    }
    // Một lần chạm = từ lúc bắt đầu chạm tới khi rời tường ít nhất 0,3 giây
    // (robot bị dội lại rồi chạm tiếp vẫn tính là một lần)
    if (cham) {
      if (!luot.dangCham) luot.soLanCham++;
      luot.dangCham = true;
      luot.tRoi = 0;
    } else if (luot.dangCham) {
      luot.tRoi = (luot.tRoi || 0) + delta;
      if (luot.tRoi > 300) luot.dangCham = false;
    }

    // Hết giờ
    let toiDa = SRA.bai.thoiGianToiDa || SRA.THOI_GIAN_TOI_DA;
    if (luot.t > toiDa) {
      skulpt.hardInterrupt = true;
      simPanel.setRunIcon('run');
      self.ketThuc(true);
      return;
    }

    // Chương trình đã chạy xong và robot đứng yên đủ lâu
    if (luot.t > 0.5 && !skulpt.running && robotDungYen()) {
      luot.tDung += delta;
      if (luot.tDung >= SRA.CHO_DUNG_MS) self.ketThuc(false);
    } else {
      luot.tDung = 0;
    }
  };

  this.ketThuc = function(hetGio) {
    self.trangThai = 'xong';
    let luot = self.luot;
    let ctx = {
      vung: SRA.baiHienTai().vung || {},
      daVao: luot.daVao,
      thuTuVao: luot.thuTuVao,
      cuoi: self.viTriRobot(),
      soLanCham: luot.soLanCham,
      thoiGian: Math.max(0, luot.t - luot.tDung / 1000),
      soKhoi: SRA.demKhoi(),
      loaiKhoi: SRA.demLoaiKhoi()
    };
    SRA.ctxCuoi = ctx;   // để kiểm thử tự động đọc được
    SRA.chamDiem(ctx, hetGio);
  };
};

// ---------------------------------------------------------------------------
// Đếm khối lệnh: các khối lệnh nằm dưới khối mũ (khi bắt đầu, hàm…),
// không tính khối mũ, khối giá trị (số, phép toán) và khối bị tắt.
// Trả về null nếu học sinh đang chạy chương trình Python tự viết.
// ---------------------------------------------------------------------------
SRA.demKhoi = function() {
  if (typeof filesManager != 'undefined' && filesManager.modified) return null;
  let n = 0;
  for (let top of blockly.workspace.getTopBlocks(false)) {
    if (top.previousConnection || top.outputConnection) continue;  // khối rời, không chạy
    for (let b of top.getDescendants(false)) {
      if (b === top) continue;
      if (typeof b.isEnabled == 'function' && !b.isEnabled()) continue;
      if (b.previousConnection || b.nextConnection) n++;
    }
  }
  return n;
};

// Đếm từng loại khối lệnh đang dùng, ví dụ { controls_repeat_ext: 1, sra_di: 2 }.
// Cùng quy tắc với demKhoi; trả về null nếu học sinh chạy chương trình Python tự viết.
SRA.demLoaiKhoi = function() {
  if (typeof filesManager != 'undefined' && filesManager.modified) return null;
  let dem = {};
  for (let top of blockly.workspace.getTopBlocks(false)) {
    if (top.previousConnection || top.outputConnection) continue;
    for (let b of top.getDescendants(false)) {
      if (b === top) continue;
      if (typeof b.isEnabled == 'function' && !b.isEnabled()) continue;
      dem[b.type] = (dem[b.type] || 0) + 1;
    }
  }
  return dem;
};

// ---------------------------------------------------------------------------
// Chấm điểm một lượt chạy
// ---------------------------------------------------------------------------
SRA.chamDiem = function(ctx, hetGio) {
  let bai = SRA.bai;
  let mucTieu = SRA.kiemTraDanhSach(bai.mucTieu, ctx);
  let hoanThanh = mucTieu.dat && !hetGio;
  let sao = bai.sao || [{}, {}, {}];
  let saoDat = [];
  let chiTietSao = [];
  for (let i = 0; i < 3; i++) {
    let s = sao[i] || {};
    let kq = SRA.kiemTraDanhSach(s.dieuKien || [], ctx);
    saoDat.push(hoanThanh && kq.dat);
    chiTietSao.push(kq);
  }
  let soSao = saoDat.filter(Boolean).length;
  let kq = {
    hoanThanh: hoanThanh,
    hetGio: hetGio,
    sao: soSao,
    saoDat: saoDat,
    thoiGian: Math.round(ctx.thoiGian * 10) / 10,
    soKhoi: ctx.soKhoi,
    soLanCham: ctx.soLanCham,
    mucTieu: mucTieu,
    chiTietSao: chiTietSao
  };
  SRA.ketQuaCuoi = kq;   // để kiểm thử tự động đọc được
  let banGhi = SRA.tienDo.ghiLuotChay(bai.id, kq);
  SRA.giaoDien.hienKetQua(kq, banGhi);
};

// ---------------------------------------------------------------------------
// Nạp bài
// ---------------------------------------------------------------------------
SRA.docJSON = function(url) {
  return fetch(url, { cache: 'no-cache' }).then(function(r) {
    if (!r.ok) throw new Error('Không tải được ' + url + ' (' + r.status + ')');
    return r.json();
  });
};

// Trục bánh nằm trước tâm thân robot bao nhiêu cm (theo hướng đầu robot)
SRA.lechTrucBanh = function() {
  let ro = (typeof robot != 'undefined' && robot.options) || {};
  if (ro.wheels === false || !ro.bodyLength || ro.bodyEdgeToWheelCenterZ == null) return 0;
  return ro.bodyLength / 2 - ro.bodyEdgeToWheelCenterZ;
};

// Bài có "bienThe" (các phiên bản sân): mỗi lượt chạy chọn ngẫu nhiên một phiên bản.
// Mỗi phiên bản ghi đè viTriBatDau, vatThe và vị trí các vùng (giữ tên vùng của bài).
// Kiểm thử tự động đặt SRA.bienTheCoDinh = số thứ tự để chọn cố định.
SRA.chonBienThe = function() {
  let ds = SRA.bai && SRA.bai.bienThe;
  if (!Array.isArray(ds) || !ds.length) { SRA.soBienThe = null; return; }
  let i = (SRA.bienTheCoDinh != null) ? SRA.bienTheCoDinh % ds.length : Math.floor(Math.random() * ds.length);
  SRA.soBienThe = i;
};

// Bài với phiên bản sân đang dùng
SRA.baiHienTai = function() {
  let bai = SRA.bai;
  if (!bai || SRA.soBienThe == null) return bai;
  let bt = bai.bienThe[SRA.soBienThe] || {};
  let kq = Object.assign({}, bai);
  if (bt.viTriBatDau) kq.viTriBatDau = bt.viTriBatDau;
  if (bt.vatThe) kq.vatThe = (bai.vatThe || []).concat(bt.vatThe);
  if (bt.vung) {
    kq.vung = Object.assign({}, bai.vung);
    for (let ten in bt.vung) kq.vung[ten] = Object.assign({}, (bai.vung || {})[ten], bt.vung[ten]);
  }
  return kq;
};

SRA.dungOptionsSan = function(san, bai) {
  let o = JSON.parse(JSON.stringify(san.options));
  o.objects = o.objects || [];

  // Vật thể riêng của bài (vật cản, đồ vật…) theo định dạng vật thể của GEARS
  for (let vt of (bai.vatThe || [])) o.objects.push(vt);

  // Vẽ các vùng lên mặt sân: tấm mỏng trong suốt, không có vật lí
  let MAU = { xanh: '22c55e80', vang: 'facc1599', do: 'ef444480', lam: '3b82f680', tim: 'a855f780' };
  let vung = bai.vung || {};
  for (let ten in vung) {
    let v = vung[ten];
    if (v.an) continue;
    let mau = v.mau || 'xanh';
    mau = MAU[mau] || mau.replace('#', '');
    if (mau.length == 6) mau += '80';
    o.objects.push({
      type: 'box',
      position: [v.x, v.y, 0.05],
      size: [v.rong, v.dai, 0.1],
      color: mau,
      physicsOptions: false,
      castShadows: false,
      receiveShadows: false
    });
  }

  // viTriBatDau là vị trí tâm quay (điểm giữa hai bánh). GEARS đặt tâm thân robot,
  // nên lùi tâm thân lại một đoạn bằng khoảng lệch giữa trục bánh và tâm thân.
  let bd = bai.viTriBatDau || {};
  let lech = SRA.lechTrucBanh();
  let g = (bd.goc || 0) * Math.PI / 180;
  let x0 = (bd.x || 0) - lech * Math.sin(g);
  let y0 = (bd.y || 0) - lech * Math.cos(g);
  o.startPos = 'center';
  o.startPosXYZStr = x0.toFixed(2) + ',' + y0.toFixed(2) + ',0';
  o.startRotStr = String(bd.goc || 0);
  return o;
};

// Góc nhìn: 'toanSan' (nhìn thẳng từ trên xuống, thấy cả sân), 'follow' (bám robot)
// hoặc 'arc' (xoay tự do) như các nút camera của GEARS.
SRA.datCamera = function(kieu) {
  SRA.kieuCamera = kieu;
  babylon.resetCamera();
  if (kieu == 'toanSan') {
    babylon.setCameraMode('orthoTop');
    let o = babylon.world.processedOptions || {};
    let dai = Math.max(o.groundLength || 200, o.groundWidth || 200);
    babylon.cameraArc.setTarget(BABYLON.Vector3.Zero());
    // Nửa chiều cao nhìn thấy = orthoRadius / 2,5; chừa thêm chỗ cho tường
    let tiLe = babylon.canvas.width / babylon.canvas.height;
    babylon.cameraArc.orthoRadius = (dai / 2 + 10) * 2.5 / Math.min(tiLe, 1);
    babylon.zoomOrtho();
    simPanel.$camera && simPanel.$camera.html('<span class="icon-cameraTop"></span>');
  } else {
    babylon.setCameraMode(kieu);
  }
};

SRA.napRobot = function(ten) {
  if (!ten) return Promise.resolve();
  return SRA.docJSON(SRA.GOC + 'robots/' + ten + '.json')
    .then(function(data) {
      robot.options = data;
      let i = robotTemplates.findIndex(r => r.name == data.name);
      if (i == -1) robotTemplates.push({ ...data }); else robotTemplates[i] = { ...data };
    })
    .catch(function(e) {
      // Chưa có robot chuẩn (gói G2): dùng robot mặc định của GEARS
      console.warn('[Sân Robot Ảo] Không có robot "' + ten + '", dùng robot mặc định.', e);
      robot.options = {};
      Object.assign(robot.options, robotTemplates[0]);
    });
};

SRA.napBai = async function(id) {
  let bai = await SRA.docJSON(SRA.GOC + 'thu-thach/' + id + '.json');
  bai.id = id;
  let san = await SRA.docJSON(SRA.GOC + 'san/' + bai.san + '/world.json');
  let danhSach = null;
  try { danhSach = await SRA.docJSON(SRA.GOC + 'thu-thach/danh-sach.json'); } catch (e) {}
  SRA.bai = bai;
  SRA.san = san;
  SRA.danhSach = danhSach;

  SRA.giaoDien.dung(bai, san, danhSach);

  await SRA.napRobot(bai.robot);

  babylon.world = SRA.world;
  SRA.chonBienThe();
  simPanel.worldOptionsSetting = SRA.dungOptionsSan(san, SRA.baiHienTai());
  await simPanel.resetSim();
  SRA.datCamera(bai.camera || 'toanSan');

  // Chế độ khối Cơ bản / Nâng cao (gói G1). Bỏ qua nếu bản này chưa có chế độ.
  if (bai.cheDo && window.sanRobotAo && typeof sanRobotAo.datCheDo == 'function') {
    sanRobotAo.datCheDo(bai.cheDo);
  }
  if (bai.locKhoi) blockly.loadToolboxFilter(bai.locKhoi);
  if (SRA.soDo) SRA.soDo.bat(bai.soDo);

  // Chương trình: bài làm đã lưu, hoặc chương trình mở đầu của bài, hoặc trống
  let ma = SRA.tienDo.docMa(id) || bai.maBatDau;
  if (ma) blockly.loadXmlText(ma); else blockly.loadDefaultWorkspace();
  setTimeout(function() {
    let ws = blockly.displayedWorkspace;
    let dau = ws && ws.getTopBlocks(true)[0];
    if (dau) ws.scrollBoundsIntoView ? ws.scrollBoundsIntoView(dau.getBoundingRectangle()) : ws.scrollCenter();
  }, 300);
  if (typeof filesManager != 'undefined') filesManager.modified = false;

  let henGio = null;
  blockly.workspace.addChangeListener(function(e) {
    if (e.isUiEvent) return;
    clearTimeout(henGio);
    henGio = setTimeout(function() { SRA.tienDo.luuMa(id, blockly.getXmlText()); }, 500);
  });

  SRA.daSanSang = true;
};

// Nút ▶ Chạy ở khung đề bài: luôn đặt lại sân rồi mới chạy
SRA.chay = function() {
  if (skulpt.running) {
    simPanel.stopSim();
    return;
  }
  SRA.tienDo.luuMa(SRA.bai.id, blockly.getXmlText());
  if (SRA.bai.bienThe) {
    SRA.chonBienThe();
    simPanel.worldOptionsSetting = SRA.dungOptionsSan(SRA.san, SRA.baiHienTai());
  }
  simPanel.resetSim().then(function() {
    simPanel.runSim();
  });
};

SRA.datLai = function() {
  simPanel.resetSim();
};
