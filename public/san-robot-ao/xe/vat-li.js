// Sân Robot Ảo – xe lắp mô-đun: vật lí (Bullet/Ammo qua Babylon).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Khác với robot gốc của GEARS, xe này dùng số đo thật:
//   - Đơn vị cm, gam, giây; trọng lực 981 cm/s² (GEARS đặt 98,1 cho cả sân, nên ở đây
//     từng vật thể của xe được gán trọng lực riêng).
//   - Hitbox của thân là tổ hợp (btCompoundShape) các khối đặc của TỪNG chi tiết,
//     không rút gọn thành hộp bao.
//   - Khối lượng, trọng tâm và mô-men quán tính tính từ các chi tiết (linh-kien.js).
//   - Bánh, bi tự do, tấm cản là các vật thể riêng nối với thân bằng khớp.
//   - Motor DC có đường đặc tính mô-men – tốc độ, điều khiển tốc độ bằng encoder.
//   - Mỗi khung hình chia thành nhiều bước vật lí nhỏ (1/240 giây) để vật nhẹ nối với
//     vật nặng không bị rung, và để bộ điều khiển motor chạy đủ nhanh.
var SRAXeVatLi = (function() {
  'use strict';
  const H = SRAHinhKhoi, V = H.V, Q = H.Q;
  const G = 981;                 // cm/s²
  const BUOC = 1 / 240;          // giây mỗi bước vật lí
  const BUOC_TOI_DA = 30;        // dưới 8 khung hình/giây thì giả lập chậm lại thay vì mất ổn định
  // Số vòng lặp của bộ giải ràng buộc (mặc định Bullet: 10). Thân nặng tì lên bánh nhẹ qua khớp nên bộ giải
  // hội tụ chậm; phần dư chưa hội tụ làm xe đang đứng yên vẫn trôi ngang. Đo trong 6 giây: 10 vòng trôi 1,4 mm,
  // 30 vòng 0,4 mm, 120 vòng 0,03 mm. Xe chỉ có vài ràng buộc nên 120 vòng không làm chậm đáng kể.
  const SO_LAN_GIAI = 120;
  const LE_LOI = 0.01;           // lề va chạm của khối lồi (cm)
  const RAD = Math.PI / 180;

  function bv(v) { return new Ammo.btVector3(v[0], v[1], v[2]); }
  function plugin(scene) { return scene.getPhysicsEngine().getPhysicsPlugin(); }

  // ---------- Hình va chạm ----------
  // Với Bullet, hình trụ là "trụ nhỏ hơn + lề": mép trụ được bo tròn đúng bằng lề. Khối trụ có trường bo
  // (lốp xe mặt cắt tròn) dùng lề bằng bán kính bo; các trụ khác dùng lề nhỏ 0,4 mm.
  function leTru(k) { return k.bo ? Math.min(k.bo, k.h / 2 - 0.01, k.d / 2 - 0.01) : Math.min(0.04, Math.min(k.d, k.h) / 4); }

  // Một khối đặc → hình Bullet tương ứng (đặt tại gốc, chưa quay)
  function hinhKhoi(k, rac) {
    let hinh;
    if (k.k == 'hop') {
      let v = bv([k.kt[0] / 2, k.kt[1] / 2, k.kt[2] / 2]); hinh = new Ammo.btBoxShape(v); Ammo.destroy(v);
      // hộp mỏng (dây, tôn): lề mặc định 0,04 lớn hơn nửa bề dày, phải thu nhỏ lề
      hinh.setMargin(Math.min(0.04, Math.min(k.kt[0], k.kt[1], k.kt[2]) / 4));
    } else if (k.k == 'tru') {
      let v = bv([k.d / 2, k.h / 2, k.d / 2]); hinh = new Ammo.btCylinderShape(v); Ammo.destroy(v);
      hinh.setMargin(leTru(k));
    } else if (k.k == 'cau') {
      hinh = new Ammo.btSphereShape(k.d / 2);
    } else if (k.k == 'lang') {
      hinh = new Ammo.btConvexHullShape();
      // Bullet cộng lề ra ngoài khối lồi, nên lùi các đỉnh vào trong đúng bằng lề
      let tam = [0, 0, 0];
      k.dinh.forEach((p) => { tam = V.cong(tam, V.nhan(p, 1 / k.dinh.length)); });
      k.dinh.forEach(function(p, i) {
        let d = V.tru(p, tam), l = V.dai(d);
        let q = V.cong(tam, V.nhan(d, Math.max(0, l - LE_LOI) / (l || 1)));
        let v = bv(q); hinh.addPoint(v, i == k.dinh.length - 1); Ammo.destroy(v);
      });
      hinh.setMargin(LE_LOI);
    } else throw new Error('Khối lạ: ' + k.k);
    rac.push(hinh);
    return hinh;
  }

  // Nhiều khối (trong cùng một hệ trục) → hình ghép, gốc toạ độ dời về điểm goc (trọng tâm)
  function hinhGhep(dsKhoi, goc) {
    let rac = [], ghep = new Ammo.btCompoundShape(true);
    let tf = new Ammo.btTransform();
    for (let k of dsKhoi) {
      if (k.trong) continue;     // khối nằm hẳn trong khối khác: không cần hình va chạm riêng
      let hinh = hinhKhoi(k, rac);
      let p = V.tru(k.vt, goc);
      tf.setIdentity();
      let o = bv(p), q = new Ammo.btQuaternion(k.q[0], k.q[1], k.q[2], k.q[3]);
      tf.setOrigin(o); tf.setRotation(q);
      ghep.addChildShape(tf, hinh);
      Ammo.destroy(o); Ammo.destroy(q);
    }
    Ammo.destroy(tf);
    return { hinh: ghep, rac: rac };
  }

  // Hình đơn: vật thể chỉ có một khối va chạm đặt đúng trọng tâm (bánh xe, viên bi) thì dùng thẳng hình đó,
  // không bọc trong hình ghép. Lí do: với hình ghép, Bullet (bản trong Ammo) thử hộp bao của từng khối con
  // mà không cộng khoảng dung sai tiếp xúc; vật đang tựa đúng lên mặt sân (khoảng hở bằng 0) thỉnh thoảng
  // mất tiếp xúc trong một bước rồi rơi g·h² ≈ 0,017 cm. Đo được ở viên bi: rung 0,16 mm mỗi 1,1 cm lăn.
  // Hình đơn đi qua đường va chạm lồi–lồi của Bullet, có dung sai tiếp xúc, nên không bị như vậy.
  function hinhVat(dsKhoi, goc) {
    let ds = dsKhoi.filter((k) => !k.trong);
    let k = ds[0];
    if (ds.length == 1 && V.dai(V.tru(k.vt, goc)) < 1e-9) {
      if (k.k == 'cau') return { hinh: new Ammo.btSphereShape(k.d / 2), rac: [] };
      if (k.k == 'tru' && !k.xoay) {
        let r = k.d / 2, n = k.h / 2;
        let v = bv(k.truc == 'x' ? [n, r, r] : k.truc == 'z' ? [r, r, n] : [r, n, r]);
        let hinh = k.truc == 'x' ? new Ammo.btCylinderShapeX(v) : k.truc == 'z' ? new Ammo.btCylinderShapeZ(v) : new Ammo.btCylinderShape(v);
        Ammo.destroy(v);
        hinh.setMargin(leTru(k));
        return { hinh: hinh, rac: [] };
      }
    }
    return hinhGhep(dsKhoi, goc);
  }

  // ---------- Vật thể ----------
  // mesh: nút gốc (không có parent) đã đặt đúng vị trí và hướng; I: [Ixx, Iyy, Izz] quanh trọng tâm
  function taoVat(scene, mesh, ghep, m, I, maSat, nay) {
    let pl = plugin(scene);
    pl.onCreateCustomShape = function() { return ghep.hinh; };
    let imp = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.CustomImpostor,
      { mass: m, friction: maSat, restitution: nay == null ? 0.1 : nay }, scene);
    pl.onCreateCustomShape = null;
    mesh.physicsImpostor = imp;
    let body = imp.physicsBody;
    let v = bv(I); body.setMassProps(m, v); body.updateInertiaTensor(); Ammo.destroy(v);
    let g = bv([0, -G, 0]); body.setGravity(g); Ammo.destroy(g);
    body.setDamping(0, 0);
    body.setActivationState(4);          // không cho "ngủ": motor và cảm biến cần vật thể luôn hoạt động
    imp._pluginData.toDispose = imp._pluginData.toDispose.concat(ghep.rac);
    return imp;
  }

  function docQuay(body) {
    let r = body.getWorldTransform().getRotation();
    return [r.x(), r.y(), r.z(), r.w()];
  }
  function docVanTocGoc(body) {
    let w = body.getAngularVelocity();
    return [w.x(), w.y(), w.z()];
  }

  // ---------- Motor DC có encoder ----------
  // Đặc tính tại trục ra:  mô-men = momenKet × (u − ω / ω0),  u ∈ [−1, 1] là độ rộng xung PWM.
  // Thực hiện bằng motor của khớp bản lề: tốc độ đích u·ω0, xung lực tối đa mỗi bước bằng
  // mô-men theo đặc tính × thời gian bước. Khi tải nặng, bánh quay chậm lại đúng theo đường đặc tính;
  // khi kẹt, mô-men đạt cực đại momenKet.
  function DongCo(ts, khop, dau) {
    let self = this;
    this.ts = ts;
    this.w0 = ts.tocDoKhongTai * RAD;        // rad/s
    this.goc = 0;                            // rad, góc bánh so với thân (encoder)
    this.omega = 0;                          // rad/s
    this.u = 0;                              // PWM đang cấp
    this.momen = 0;                          // g·cm²/s², mô-men motor đang tạo (ước lượng theo đặc tính)
    this.cheDo = 'tha';                      // 'tocDo' | 'giu' | 'phanh' | 'tha'
    this.dich = 0;                           // rad/s (chế độ tocDo) hoặc rad (chế độ giu)
    this.tich = 0;                           // phần tích phân của bộ điều khiển tốc độ
    this.heSo = 1;                           // motor yếu/mạnh hơn danh định (1 = chuẩn)
    // Quay tới góc đích (chế độ tocDo): đặt gocDung (rad) thì bộ điều khiển tự giảm tốc theo
    // v = √(2·a·quãng còn lại) rồi giữ đúng góc đó, như bộ điều khiển motor có encoder.
    this.gocDung = null;
    this.giaTocHam = 1500 * RAD;             // rad/s²
    this.vungGiu = 3 * RAD;                  // còn cách đích ít hơn thế này thì chuyển sang giữ vị trí

    this.buoc = function(h, omega) {
      self.omega = omega;
      self.goc += omega * h;
      let w0 = self.w0 * self.heSo, Ts = ts.momenKet * self.heSo, Tf = ts.momenMaSat;
      let u = 0, capDien = true;
      let cheDo = self.cheDo, dich = self.dich;
      if (cheDo == 'tocDo' && self.gocDung != null) {
        let con = self.gocDung - self.goc, xa = Math.abs(con);
        if (xa < self.vungGiu) { cheDo = 'giu'; dich = self.gocDung; }
        else { let v = Math.min(Math.abs(dich), Math.sqrt(2 * self.giaTocHam * xa)); dich = con >= 0 ? v : -v; }
      }
      if (cheDo == 'tocDo') {
        // PI theo tốc độ đo từ encoder, cộng phần bù thẳng (PWM ứng với tốc độ không tải)
        let e = (dich - omega) / w0;
        let thu = dich / w0 + 4 * e + self.tich;
        // chống tích luỹ quá mức: khi PWM đã kịch thì không cộng dồn thêm theo chiều đó
        if (Math.abs(thu) < 1 || thu * e < 0) self.tich = Math.max(-0.6, Math.min(0.6, self.tich + 40 * e * h));
        u = dich / w0 + 4 * e + self.tich;
      } else if (cheDo == 'giu') {
        u = 12 * (dich - self.goc) - 0.4 * omega;
        self.tich = 0;
      } else {
        capDien = false; self.tich = 0;
      }
      u = Math.max(-1, Math.min(1, u));
      self.u = capDien ? u : 0;
      let dichKhop, xungMax;
      if (capDien) {
        let T = Ts * (u - omega / w0);
        self.momen = T;
        dichKhop = (T >= 0 ? 1 : -1) * 4 * self.w0;     // kéo về phía mô-men; giới hạn thật là xung lực
        xungMax = Math.abs(T) * h;
      } else if (self.cheDo == 'phanh') {
        // chập hai cực motor: sức phản điện động hãm tỉ lệ với tốc độ, cộng ma sát hộp số
        self.momen = -Ts * omega / w0;
        dichKhop = 0; xungMax = (Math.abs(self.momen) + Tf) * h;
      } else {
        self.momen = 0;
        dichKhop = 0; xungMax = Tf * h;                // thả trôi: chỉ còn ma sát hộp số
      }
      khop.enableAngularMotor(true, dau * dichKhop, xungMax);
    };
  }

  // ---------- Xe ----------
  // banLap, kl: từ SRALinhKien.lapXe / tinhXe.  nut: { than, banh: [mesh], bi, canGat } các nút gốc đã đặt chỗ.
  function Xe(scene, banLap, kl, nut) {
    let self = this;
    let pl = plugin(scene), world = pl.world;
    this.scene = scene;
    this.khop = [];
    this.dongCo = [];
    this.banh = [];
    this.thoiGian = 0;
    this.truocBuoc = [];     // hàm (h) gọi trước mỗi bước vật lí nhỏ
    this.sauBuoc = [];

    let giai = world.getSolverInfo();
    giai.set_m_numIterations(SO_LAN_GIAI);
    // Sửa lún bằng xung "tách riêng" (chỉ dời vị trí, không cộng vào vận tốc) cho mọi tiếp xúc, kể cả lún rất nông;
    // mặc định Bullet đẩy vật lún nông ra bằng vận tốc thật, tức là bơm thêm năng lượng vào xe đang đứng yên.
    giai.set_m_splitImpulse(1);
    giai.set_m_splitImpulsePenetrationThreshold(1);

    // Thân: tổ hợp mọi khối của mọi chi tiết gắn cứng vào khung
    let dsKhoi = [];
    banLap.than.forEach((ct) => { dsKhoi = dsKhoi.concat(ct.khoi); });
    let I = kl.than.I;
    this.than = taoVat(scene, nut.than, hinhGhep(dsKhoi, kl.than.tam), kl.than.m, [I[0][0], I[1][1], I[2][2]], 0.4, 0.2);
    let thanBody = this.than.physicsBody;

    function themKhop(k) {
      world.addConstraint(k, true);       // true: hai vật nối khớp không va chạm với nhau
      self.khop.push(k);
      return k;
    }

    // Bánh: khớp bản lề quanh trục x của xe
    banLap.banh.forEach(function(b, i) {
      let klb = kl.banh[i];
      let Ib = [klb.I[0][0] + klb.quanTinhRoto, klb.I[1][1], klb.I[2][2]];
      let imp = taoVat(scene, nut.banh[i], hinhVat(b.khoi, [0, 0, 0]), klb.m, Ib, b.maSat, 0.1);
      let pA = bv(V.tru(b.tam, kl.than.tam)), pB = bv([0, 0, 0]), aA = bv(b.truc), aB = bv(b.truc);
      let khop = themKhop(new Ammo.btHingeConstraint(thanBody, imp.physicsBody, pA, pB, aA, aB, true));
      [pA, pB, aA, aB].forEach((x) => Ammo.destroy(x));
      let dc = new DongCo(b.dongCo, khop, 1);
      self.dongCo.push(dc);
      self.banh.push({ imp: imp, body: imp.physicsBody, khop: khop, dongCo: dc, truc: b.truc, moTa: b });
    });

    // Bi tự do: quả cầu thép lăn tự do, giữ trong vỏ bằng khớp cầu
    if (banLap.bi && nut.bi) {
      let ghep = hinhVat([H.chuanHoa({ k: 'cau', d: banLap.bi.d })], [0, 0, 0]);
      this.bi = taoVat(scene, nut.bi, ghep, kl.bi.m, [kl.bi.I, kl.bi.I, kl.bi.I], banLap.bi.maSat, 0.1);
      let pA = bv(V.tru(banLap.bi.tam, kl.than.tam)), pB = bv([0, 0, 0]);
      themKhop(new Ammo.btPoint2PointConstraint(thanBody, this.bi.physicsBody, pA, pB));
      Ammo.destroy(pA); Ammo.destroy(pB);
    }

    // Tấm cản: bản lề có giới hạn góc và lò xo
    if (banLap.canGat && nut.canGat) {
      let cg = banLap.canGat, klc = kl.canGat;
      let Ic = klc.I;
      this.canGat = taoVat(scene, nut.canGat, hinhGhep(cg.khoi, klc.tam), klc.m, [Ic[0][0], Ic[1][1], Ic[2][2]], 0.4, 0.1);
      let pA = bv(V.tru(cg.tam, kl.than.tam)), pB = bv(V.nhan(klc.tam, -1)), aA = bv(cg.truc), aB = bv(cg.truc);
      let khop = themKhop(new Ammo.btHingeConstraint(thanBody, this.canGat.physicsBody, pA, pB, aA, aB, true));
      [pA, pB, aA, aB].forEach((x) => Ammo.destroy(x));
      this.khopCanGat = khop;
      this.gocCanGat = -cg.gocNghi;
      this.truocBuoc.push(function(h) {
        // lò xo của công tắc ép tấm cản ra phía trước (mô-men gần như không đổi trong hành trình ngắn)
        khop.enableAngularMotor(true, self.dauCanGat * 8, cg.lucLoXo * cg.tayDon * h);
      });
    }

    // Chiều dương của góc bản lề theo quy ước của Bullet (đã đo: tấm cản bung ra là góc âm)
    this.dauCanGat = -1;

    // --- Bước vật lí chia nhỏ ---
    function buocNho(h) {
      let qThan = docQuay(thanBody), wThan = docVanTocGoc(thanBody);
      for (let b of self.banh) {
        let truc = Q.quay(qThan, b.truc);
        let w = docVanTocGoc(b.body);
        b.dongCo.buoc(h, V.cham(V.tru(w, wThan), truc));
      }
      for (let f of self.truocBuoc) f(h);
      world.stepSimulation(h, 0);
      self.thoiGian += h;
      for (let f of self.sauBuoc) f(h);
    }

    let buocGoc = pl.executeStep.bind(pl);
    pl.executeStep = function(delta, impostors) {
      if (self.daHuy) return buocGoc(delta, impostors);
      for (let imp of impostors) if (!imp.soft) imp.beforeStep();
      let n = Math.max(1, Math.min(BUOC_TOI_DA, Math.round(delta / BUOC)));
      let h = Math.min(delta / n, 1.5 * BUOC);
      for (let i = 0; i < n; i++) buocNho(h);
      for (let imp of impostors) {
        if (imp.soft) { pl._afterSoftStep(imp); continue; }
        imp.afterStep();
        if (imp._onPhysicsCollideCallbacks.length > 0 && pl._isImpostorInContact(imp)) {
          for (let cb of imp._onPhysicsCollideCallbacks) for (let khac of cb.otherImpostors) {
            if ((imp.physicsBody.isActive() || khac.physicsBody.isActive()) && pl._isImpostorPairInContact(imp, khac)) {
              imp.onCollide({ body: khac.physicsBody, point: pl._tmpContactPoint });
              khac.onCollide({ body: imp.physicsBody, point: pl._tmpContactPoint });
            }
          }
        }
      }
    };

    // Góc tấm cản (độ; 0 = ép sát, −gocNghi = bung hết), đọc từ hướng của hai vật thể
    this.docGocCanGat = function() {
      if (!self.canGat) return null;
      let q = Q.nhan(Q.lienHop(docQuay(thanBody)), docQuay(self.canGat.physicsBody));
      return 2 * Math.atan2(q[0], q[3]) / RAD;
    };

    // Gỡ khớp trước khi Babylon gỡ vật thể (khớp trỏ tới vật thể đã xoá sẽ làm hỏng bộ giải)
    this.huy = function() {
      if (self.daHuy) return;
      self.daHuy = true;
      try { for (let k of self.khop) { world.removeConstraint(k); Ammo.destroy(k); } } catch (e) {}
      self.khop = [];
    };
    [this.than, this.bi, this.canGat].concat(this.banh.map((b) => b.imp)).forEach(function(imp) {
      if (!imp) return;
      let huyGoc = imp.dispose.bind(imp);
      imp.dispose = function() { self.huy(); return huyGoc(); };
    });
    scene.onDisposeObservable.add(function() { self.huy(); });

    // Giới hạn hành trình của tấm cản: từ ép sát (0) tới bung hết (gocNghi)
    this.datGioiHanCanGat = function(dau) {
      if (!self.khopCanGat) return;
      self.dauCanGat = dau;
      let g = banLap.canGat.gocNghi * RAD;
      if (dau < 0) self.khopCanGat.setLimit(-g, 0, 0.9, 0.3, 1.0);
      else self.khopCanGat.setLimit(0, g, 0.9, 0.3, 1.0);
    };
  }

  return { G: G, BUOC: BUOC, DAU_CAN_GAT: -1, Xe: Xe, DongCo: DongCo, hinhGhep: hinhGhep, hinhVat: hinhVat, hinhKhoi: hinhKhoi, docQuay: docQuay };
})();
