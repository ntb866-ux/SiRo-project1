// Sân Robot Ảo – xe lắp mô-đun: mô phỏng cảm biến theo nguyên lí của linh kiện thật.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Không dùng mã đo của GEARS. Mỗi cảm biến chỉ giữ TÊN HÀM mà thư viện Python và các khối
// lệnh có sẵn gọi (getDistance, getRGB, isPressed, getYawAngle, getPosition…), còn cách đo viết lại:
//
//   HC-SR04   Phát chùm siêu âm 40 kHz hình nón 15°, đo thời gian sóng đi và về; khoảng cách =
//             thời gian × tốc độ âm ÷ 2. Tầm 2–400 cm, mỗi lần đo cách nhau 50 ms. Mặt phẳng nghiêng
//             quá 30° hắt sóng đi hướng khác nên không có tiếng vọng.
//   TCRT5000  LED hồng ngoại 950 nm chiếu xuống sân, phototransistor đo phần phản xạ. Tín hiệu
//             phụ thuộc hệ số phản xạ hồng ngoại của mặt sân và khoảng cách tới mặt sân.
//   Chạm      Tấm cản là vật thể có bản lề và lò xo; công tắc đóng khi tấm bị ép quá một góc.
//   Gyro      Đo vận tốc góc quanh trục đứng của xe rồi cộng dồn thành góc (có thể bật trôi, nhiễu).
//   GPS       Toạ độ ăng-ten trên sân, cập nhật theo nhịp (mặc định 10 lần/giây), có thể bật sai số.
var SRAXeCamBien = (function() {
  'use strict';
  const H = SRAHinhKhoi, V = H.V, Q = H.Q, RAD = Math.PI / 180;

  function nhieuChuan() {   // số ngẫu nhiên phân bố chuẩn (Box–Muller)
    let u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function tuyChon(macDinh, rieng) { return Object.assign({}, macDinh, rieng || {}); }

  // Điểm và hướng trong hệ trục xe → toạ độ sân, theo vị trí hiện tại của thân
  function Khung(r) {
    let tam = r.sraKhoiLuong.than.tam;
    this.docQ = function() { let q = r.body.rotationQuaternion; return [q.x, q.y, q.z, q.w]; };
    this.diem = function(p) {
      let b = r.body.position;
      return V.cong([b.x, b.y, b.z], Q.quay(this.docQ(), V.tru(p, tam)));
    };
    this.huong = function(n) { return Q.quay(this.docQ(), n); };
  }
  const bVec = (p) => new BABYLON.Vector3(p[0], p[1], p[2]);

  // Vật mà cảm biến của xe này "nhìn" được: mọi lưới bắt tia được, trừ chính chiếc xe
  function khongPhaiXe(mesh) {
    return mesh.isPickable !== false && !mesh.sraXe && mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0;
  }

  // ======================================================================
  // HC-SR04
  // ======================================================================
  const SA_MAC_DINH = {
    tamGan: 2,              // cm
    tamXa: 400,
    gocNon: 15,             // độ, toàn góc chùm sóng
    gocToiToiDa: 30,        // độ, mặt nghiêng hơn thế này không cho tiếng vọng
    chuKy: 0.05,            // giây giữa hai lần đo
    doPhanGiai: 0.3,        // cm
    tocDoAm: 34300,         // cm/s ở 20 °C
    nhieu: 0                // độ lệch chuẩn của nhiễu (cm); 0 = tắt
  };

  function SieuAm(cb, r, scene) {
    let self = this, kh = new Khung(r);
    this.type = 'UltrasonicSensor';
    this.sraLoai = 'sieuAm';
    this.tuyChon = tuyChon(SA_MAC_DINH, (r.options.sraCamBien || {}).sieuAm);
    let o = this.tuyChon;
    // Nút đặt tại điểm giữa hai đầu phát/thu (để mã vẽ tia có sẵn của khung thử thách dùng được)
    this.body = new BABYLON.TransformNode('sraSieuAm', scene);
    this.body.parent = r.body;
    let tam = r.sraKhoiLuong.than.tam;
    this.body.position = bVec(V.tru(cb.vt, tam));
    this.body.component = this;
    this.position = bVec(cb.vt);

    // Các tia mẫu trong hình nón: 1 tia giữa và 3 vòng
    this.rayVectors = [new BABYLON.Vector3(0, 0, 1)];
    let nua = o.gocNon / 2 * RAD;
    [[1 / 3, 6], [2 / 3, 12], [1, 18]].forEach(function(v) {
      for (let i = 0; i < v[1]; i++) {
        let a = nua * v[0], b = 2 * Math.PI * i / v[1];
        self.rayVectors.push(new BABYLON.Vector3(Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)));
      }
    });
    // Trường mà core/cam-bien.js (vẽ tia đo ở các bài G6) đọc
    this.options = { rayOrigin: new BABYLON.Vector3(0, 0, 0), rayLength: o.tamXa, rayIncidentLimit: Math.cos(o.gocToiToiDa * RAD) };
    this.filterRay = function(mesh) { return khongPhaiXe(mesh) && mesh.ultrasonicDetection != 'invisible'; };

    this.khoangCach = o.tamXa;       // kết quả lần đo gần nhất (cm)
    this.thoiGianVong = null;        // micro giây sóng đi và về; null = không có tiếng vọng
    let lanDo = -1;

    // Một lần phát xung: tiếng vọng sớm nhất trong chùm sóng quyết định kết quả
    this.do = function() {
      let goc = self.body.getAbsolutePosition(), q = self.body.absoluteRotationQuaternion;
      let ray = new BABYLON.Ray(goc, new BABYLON.Vector3(0, 0, 1), o.tamXa);
      let gan = Infinity, huong = new BABYLON.Vector3(0, 0, 0);
      for (let v of self.rayVectors) {
        v.rotateByQuaternionToRef(q, huong);
        ray.direction.copyFrom(huong);
        let hit = scene.pickWithRay(ray, self.filterRay);
        if (!hit || !hit.hit || hit.pickedMesh.ultrasonicDetection == 'absorb') continue;
        if (hit.distance >= gan) continue;
        let n = hit.getNormal(true);
        if (n && Math.abs(BABYLON.Vector3.Dot(n, huong)) >= self.options.rayIncidentLimit) gan = hit.distance;
      }
      if (o.nhieu > 0 && gan < Infinity) gan += nhieuChuan() * o.nhieu;
      if (gan < o.tamGan) gan = o.tamGan;                 // gần hơn tầm gần: mô-đun vẫn báo khoảng 2 cm
      if (gan > o.tamXa || gan == Infinity) {
        self.thoiGianVong = null; self.khoangCach = o.tamXa;
      } else {
        self.thoiGianVong = Math.round(2 * gan / o.tocDoAm * 1e6);
        let d = self.thoiGianVong * 1e-6 * o.tocDoAm / 2;
        self.khoangCach = o.doPhanGiai > 0 ? Math.round(d / o.doPhanGiai) * o.doPhanGiai : d;
      }
    };

    this.getDistance = function() {
      let t = r.sraVatLi.thoiGian;
      if (lanDo < 0 || t - lanDo >= o.chuKy || t < lanDo) { self.do(); lanDo = t; }
      return self.khoangCach;
    };
    this.reset = function() { lanDo = -1; };
  }

  // ======================================================================
  // TCRT5000
  // ======================================================================
  // Đáp ứng tương đối theo khoảng cách tới mặt phản xạ (đọc từ đồ thị trong tài liệu kĩ thuật TCRT5000)
  const DAP_UNG = [[0, 0.15], [0.1, 0.6], [0.25, 1], [0.5, 0.62], [0.75, 0.36], [1, 0.22], [1.5, 0.1], [2, 0.055], [2.5, 0.035], [4, 0.01], [8, 0]];
  function dapUng(d) {
    if (d <= 0) return DAP_UNG[0][1];
    for (let i = 1; i < DAP_UNG.length; i++) {
      if (d <= DAP_UNG[i][0]) {
        let a = DAP_UNG[i - 1], b = DAP_UNG[i];
        return a[1] + (b[1] - a[1]) * (d - a[0]) / (b[0] - a[0]);
      }
    }
    return 0;
  }
  const DL_MAC_DINH = {
    khoangCachChuan: 0.6,   // cm từ mặt đầu đo tới sân khi xe đứng trên sân phẳng
    nuaGocNhin: 16,         // độ
    banKinhMat: 0.15,       // cm, bán kính cửa sổ quang
    trangChuan: 0.92,       // tín hiệu (0–1) khi soi nền trắng ở khoảng cách chuẩn: do biến trở trên mô-đun đặt
    nguong: 0.5,            // ngưỡng của mạch so sánh cho ngõ ra số
    doTre: 0.03,
    nhieu: 0
  };

  // Hệ số phản xạ hồng ngoại của một màu sân. Mực màu (lục lam, đỏ tươi, vàng) gần như trong suốt
  // với hồng ngoại 950 nm; chỉ thành phần đen (muội than) hấp thụ. Thành phần đen của một màu là
  // 1 − max(R, G, B), nên: phản xạ = 0,04 + 0,86 × max(R, G, B).
  function phanXaHongNgoai(r, g, b) { return 0.04 + 0.86 * Math.max(r, g, b) / 255; }

  // Ảnh của các tấm hoạ tiết (để đọc màu tại điểm tia chạm), nạp một lần cho mỗi địa chỉ
  let khoAnh = {};
  function anhCuaTexture(tex) {
    if (!tex) return null;
    if (typeof tex.getContext == 'function') {       // DynamicTexture
      let cv = tex.getContext().canvas;
      return { ctx: tex.getContext(), w: cv.width, h: cv.height, dong: true };
    }
    let url = tex.url;
    if (!url) return null;
    let a = khoAnh[url];
    if (a) return a.sanSang ? a : null;
    a = khoAnh[url] = { sanSang: false };
    let img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      let cv = document.createElement('canvas');
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      let ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      try { a.data = ctx.getImageData(0, 0, cv.width, cv.height).data; a.w = cv.width; a.h = cv.height; a.sanSang = true; } catch (e) {}
    };
    img.src = url;
    return null;
  }
  function docDiemAnh(a, tex, uv) {
    let u = uv.x * (tex.uScale || 1) + (tex.uOffset || 0), v = uv.y * (tex.vScale || 1) + (tex.vOffset || 0);
    u -= Math.floor(u); v -= Math.floor(v);
    let x = Math.min(a.w - 1, Math.floor(u * a.w)), y = Math.min(a.h - 1, Math.floor((1 - v) * a.h));
    if (a.dong) { let d = a.ctx.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; }
    let i = (y * a.w + x) * 4;
    return [a.data[i], a.data[i + 1], a.data[i + 2], a.data[i + 3] / 255];
  }
  // Màu (0–255) và độ đục (0–1) của mặt lưới tại điểm tia chạm
  function mauTaiDiem(hit) {
    let mesh = hit.pickedMesh, m = mesh.origMaterial || mesh.material;
    if (mesh.sraPhanXaHongNgoai != null) return { phanXa: mesh.sraPhanXaHongNgoai, duc: 1 };
    if (!m) return { mau: [128, 128, 128], duc: 1 };
    if (m.subMaterials && hit.subMeshId != null && mesh.subMeshes) {
      let sm = mesh.subMeshes[hit.subMeshId];
      if (sm) m = m.subMaterials[sm.materialIndex] || m;
    }
    let duc = (m.alpha == null ? 1 : m.alpha) * mesh.visibility;
    let tex = m.diffuseTexture || m.albedoTexture || m.emissiveTexture;
    if (tex) {
      let a = anhCuaTexture(tex), uv = a ? hit.getTextureCoordinates() : null;
      if (a && uv) {
        let p = docDiemAnh(a, tex, uv);
        if (tex.hasAlpha) duc *= p[3];
        return { mau: p, duc: duc };
      }
    }
    let c = m.diffuseColor || m.albedoColor || m.emissiveColor;
    return { mau: c ? [c.r * 255, c.g * 255, c.b * 255] : [128, 128, 128], duc: duc };
  }

  function DoLine(cb, r, scene) {
    let self = this, kh = new Khung(r);
    this.type = 'ColorSensor';            // để thư viện Python và khối "độ sáng phản xạ" có sẵn đọc được
    this.sraLoai = 'doLine';
    this.tuyChon = tuyChon(DL_MAC_DINH, (r.options.sraCamBien || {}).doLine);
    let o = this.tuyChon;
    this.position = bVec(cb.vt);          // x < 0 là mắt trái (khối "cảm biến trái/giữa/phải" dựa vào đây)
    this.renderTarget = { sraGia: true }; // mã số đo của G7 chỉ nhận cảm biến có trường này
    this.options = {};
    this.tinHieu = 0;                     // 0–1, tỉ lệ với dòng qua phototransistor
    this.so = false;                      // ngõ ra số: true = nền sáng (phản xạ mạnh)
    let khungDo = -1;
    // Hệ số khuếch đại: nền trắng (phản xạ 0,9) ở khoảng cách chuẩn cho tín hiệu trangChuan
    let K = o.trangChuan / (0.9 * dapUng(o.khoangCachChuan));
    // Các điểm mẫu trong vùng nhìn: tâm, vòng giữa, vòng ngoài (trọng số giảm dần ra mép)
    let mau = [[0, 0, 1]];
    for (let i = 0; i < 6; i++) mau.push([0.5 * Math.cos(Math.PI / 3 * i), 0.5 * Math.sin(Math.PI / 3 * i), 0.8]);
    for (let i = 0; i < 8; i++) mau.push([0.92 * Math.cos(Math.PI / 4 * i + 0.3), 0.92 * Math.sin(Math.PI / 4 * i + 0.3), 0.4]);
    let tongTrong = mau.reduce((s, m) => s + m[2], 0);
    // Nạp sẵn ảnh của các mặt có hoạ tiết (thảm sân) để lần đo đầu tiên đã đọc được màu thật
    scene.meshes.forEach(function(m) {
      let vl = m.origMaterial || m.material;
      if (!vl || m.sraXe) return;
      (vl.subMaterials || [vl]).forEach((x) => { if (x) anhCuaTexture(x.diffuseTexture || x.albedoTexture || x.emissiveTexture); });
    });

    this.do = function() {
      let goc = kh.diem(cb.vt), xuong = kh.huong(cb.huong), ngang = kh.huong([1, 0, 0]), doc = kh.huong([0, 0, 1]);
      let tanG = Math.tan(o.nuaGocNhin * RAD), tong = 0;
      for (let m of mau) {
        // tia xuất phát trong cửa sổ quang, toả ra theo góc nhìn
        let lech = V.cong(V.nhan(ngang, m[0]), V.nhan(doc, m[1]));
        let p = V.cong(goc, V.nhan(lech, o.banKinhMat));
        let h = V.donVi(V.cong(xuong, V.nhan(lech, tanG)));
        let ray = new BABYLON.Ray(bVec(p), bVec(h), 8);
        let ds = scene.multiPickWithRay(ray, khongPhaiXe) || [];
        ds.sort((a, b) => a.distance - b.distance);
        // Đi từ lớp trên cùng xuống: lớp trong mờ (vùng tô màu) chỉ che một phần lớp dưới
        let conLai = 1, s = 0;
        for (let hit of ds) {
          let c = mauTaiDiem(hit);
          let px = c.phanXa != null ? c.phanXa : phanXaHongNgoai(c.mau[0], c.mau[1], c.mau[2]);
          s += conLai * c.duc * px * dapUng(hit.distance);
          conLai *= 1 - c.duc;
          if (conLai < 0.02) break;
        }
        tong += s * m[2];
      }
      let t = K * tong / tongTrong;
      if (o.nhieu > 0) t += nhieuChuan() * o.nhieu;
      self.tinHieu = Math.max(0, Math.min(1, t));
      if (self.so && self.tinHieu < o.nguong - o.doTre) self.so = false;
      else if (!self.so && self.tinHieu > o.nguong + o.doTre) self.so = true;
    };
    function capNhat() {
      let f = scene.getFrameId();
      if (f != khungDo) { self.do(); khungDo = f; }
    }
    // Ngõ ra tương tự như bộ đổi ADC 10 bit đọc được (0 = không phản xạ, 1023 = bão hoà)
    this.docTuongTu = function() { capNhat(); return Math.round(self.tinHieu * 1023); };
    // Ngõ ra số: true khi nền sáng, false khi gặp vạch đen
    this.docSo = function() { capNhat(); return self.so; };
    // TCRT5000 không phân biệt được màu: ba kênh bằng nhau, tỉ lệ với hồng ngoại phản xạ
    this.getRGB = function() { capNhat(); let v = self.tinHieu * 255; return [v, v, v]; };
    this.getHSV = function() { capNhat(); return [0, 0, self.tinHieu * 100]; };
  }

  // ======================================================================
  // Cảm biến chạm (công tắc hành trình sau tấm cản)
  // ======================================================================
  function Cham(cb, r, scene, banLap) {
    let self = this, cg = banLap.canGat;
    this.type = 'TouchSensor';
    this.sraLoai = 'cham';
    this.options = {};
    this.pressed = false;
    this.goc = -cg.gocNghi;
    this.render = function() {
      let g = r.sraVatLi.docGocCanGat();
      if (g == null) return;
      self.goc = g;
      let ep = -g;                          // độ còn lại trước khi tấm cản ép sát
      if (!self.pressed && ep < cg.gocDong) self.pressed = true;
      else if (self.pressed && ep > cg.gocNha) self.pressed = false;
    };
    this.isPressed = function() { return self.pressed; };
  }

  // ======================================================================
  // Gyro
  // ======================================================================
  const GYRO_MAC_DINH = {
    troi: 0,        // độ/giây: độ lệch không của cảm biến (làm góc trôi dần)
    nhieu: 0        // độ/giây: nhiễu trắng của vận tốc góc
  };
  function Gyro(cb, r, scene) {
    let self = this;
    this.type = 'GyroSensor';
    this.sraLoai = 'gyro';
    this.tuyChon = tuyChon(GYRO_MAC_DINH, (r.options.sraCamBien || {}).gyro);
    let o = this.tuyChon;
    this.options = {};
    this.goc = [0, 0, 0];     // [nghiêng dọc, quay quanh trục đứng, nghiêng ngang], độ, cộng dồn từ vận tốc góc
    this.tocDo = [0, 0, 0];   // độ/giây
    let body = r.sraVatLi.than.physicsBody;
    // Mỗi bước vật lí: đọc vận tốc góc trong hệ trục của cảm biến rồi cộng dồn (như vi điều khiển làm)
    r.sraVatLi.sauBuoc.push(function(h) {
      let w = body.getAngularVelocity(), q = SRAXeVatLi.docQuay(body);
      let l = Q.quay(Q.lienHop(q), [w.x(), w.y(), w.z()]);
      for (let i = 0; i < 3; i++) {
        let v = l[i] / RAD + o.troi + (o.nhieu > 0 ? nhieuChuan() * o.nhieu : 0);
        self.tocDo[i] = v;
        self.goc[i] += v * h;
      }
    });
    this.reset = function() { self.goc = [0, 0, 0]; };
    this.getYawAngle = function() { return self.goc[1]; };       // dương = quay sang phải
    this.getYawRate = function() { return self.tocDo[1]; };
    this.getPitchAngle = function() { return -self.goc[0]; };    // dương = mũi xe ngẩng lên
    this.getPitchRate = function() { return -self.tocDo[0]; };
    this.getRollAngle = function() { return -self.goc[2]; };
    this.getRollRate = function() { return -self.tocDo[2]; };
    this.getHeading = function() {
      let g = ((self.goc[1] + 180) % 360 + 360) % 360 - 180;
      return g;
    };
  }

  // ======================================================================
  // GPS
  // ======================================================================
  const GPS_MAC_DINH = {
    tanSo: 10,      // số lần cập nhật mỗi giây
    saiSo: 0        // cm, độ lệch chuẩn của sai số vị trí; 0 = tắt
  };
  function GPS(cb, r, scene) {
    let self = this, kh = new Khung(r);
    this.type = 'GPSSensor';
    this.sraLoai = 'gps';
    this.tuyChon = tuyChon(GPS_MAC_DINH, (r.options.sraCamBien || {}).gps);
    let o = this.tuyChon;
    this.options = {};
    this.viTri = kh.diem(cb.vt);
    let lanCuoi = -1;
    this.getPosition = function() {
      let t = r.sraVatLi.thoiGian;
      if (lanCuoi < 0 || t - lanCuoi >= 1 / o.tanSo || t < lanCuoi) {
        let p = kh.diem(cb.vt);
        if (o.saiSo > 0) p = [p[0] + nhieuChuan() * o.saiSo, p[1], p[2] + nhieuChuan() * o.saiSo];
        self.viTri = p; lanCuoi = t;
      }
      return self.viTri.slice();
    };
    this.reset = function() { lanCuoi = -1; };
  }

  function tao(cb, r, scene, banLap) {
    if (cb.loai == 'sieuAm') return new SieuAm(cb, r, scene);
    if (cb.loai == 'doLine') return new DoLine(cb, r, scene);
    if (cb.loai == 'cham') return new Cham(cb, r, scene, banLap);
    if (cb.loai == 'gyro') return new Gyro(cb, r, scene);
    if (cb.loai == 'gps') return new GPS(cb, r, scene);
    return null;
  }

  return { tao: tao, dapUng: dapUng, phanXaHongNgoai: phanXaHongNgoai,
    MAC_DINH: { sieuAm: SA_MAC_DINH, doLine: DL_MAC_DINH, gyro: GYRO_MAC_DINH, gps: GPS_MAC_DINH } };
})();
