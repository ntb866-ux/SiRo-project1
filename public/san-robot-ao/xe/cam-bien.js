// Sân Robot Ảo – xe lắp mô-đun: mô phỏng cảm biến theo nguyên lí của linh kiện thật.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Không dùng mã đo của GEARS. Mỗi cảm biến chỉ giữ TÊN HÀM mà thư viện Python và các khối
// lệnh có sẵn gọi (getDistance, getRGB, isPressed, getYawAngle, getPosition…), còn cách đo viết lại:
//
//   HC-SR04   Phát chùm siêu âm 40 kHz hình nón 15°, đo thời gian sóng đi và về; khoảng cách =
//             thời gian × tốc độ âm ÷ 2. Tầm 2–400 cm, mỗi lần đo cách nhau 50 ms. Mặt phẳng nghiêng
//             quá 30° hắt sóng đi hướng khác nên không có tiếng vọng.
//   TCRT5000  LED hồng ngoại 950 nm chiếu xuống sân, phototransistor đặt cạnh đèn đo phần phản xạ.
//             Mặt sân phản xạ khuếch tán theo định luật Lambert: tín hiệu phụ thuộc hệ số phản xạ hồng
//             ngoại, khoảng cách từ đèn và bộ thu tới mặt sân, góc tới và góc thu (cảm biến nghiêng,
//             xe chúi, mặt dốc).
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
  function tuyChon(macDinh, rieng, rieng2) { return Object.assign({}, macDinh, rieng || {}, rieng2 || {}); }

  // Điểm và hướng trong hệ trục xe → toạ độ sân, theo vị trí hiện tại của thân.
  // Cảm biến trên tay quay servo (cb.servo != null): theo vật thể tay quay; điểm và hướng cho theo lúc lắp (servo ở 90°).
  function Khung(r, cb) {
    let trenServo = cb && cb.servo != null && r.sraServoNut;
    let nut = trenServo ? r.sraServoNut : r.body;
    let tam = trenServo ? V.cong(r.sraBanLap.servo.tam, r.sraKhoiLuong.servo.tam) : r.sraKhoiLuong.than.tam;
    this.docQ = function() { let q = nut.rotationQuaternion; return [q.x, q.y, q.z, q.w]; };
    this.diem = function(p) {
      let b = nut.position;
      return V.cong([b.x, b.y, b.z], Q.quay(this.docQ(), V.tru(p, tam)));
    };
    this.huong = function(n) { return Q.quay(this.docQ(), n); };
    this.nut = nut; this.tam = tam;
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
    let self = this, kh = new Khung(r, cb);
    this.type = 'UltrasonicSensor';
    this.sraLoai = 'sieuAm';
    this.tuyChon = tuyChon(SA_MAC_DINH, (r.options.sraCamBien || {}).sieuAm);
    let o = this.tuyChon;
    // Nút đặt tại điểm giữa hai đầu phát/thu (để mã vẽ tia có sẵn của khung thử thách dùng được)
    this.body = new BABYLON.TransformNode('sraSieuAm', scene);
    this.body.parent = kh.nut;                 // trên tay quay servo thì quay theo tay quay
    this.body.position = bVec(V.tru(cb.vt, kh.tam));
    // mô-đun xoay trên giá: chùm sóng xoay theo (hướng phát là trục +z của nút)
    if (cb.xoay) this.body.rotationQuaternion = new BABYLON.Quaternion(cb.xoay[0], cb.xoay[1], cb.xoay[2], cb.xoay[3]);
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
    moHinh: 'lambert',      // 'lambert': đèn và bộ thu tách rời, phản xạ khuếch tán; 'cu': mô hình cũ (đường đáp ứng nhập tay)
    khoangCachChuan: 0.6,   // cm từ mặt đầu đo tới sân khi xe đứng trên sân phẳng
    khoangCachDenThu: 0.3,  // cm giữa tâm đèn phát và tâm bộ thu
    nuaGocPhat: 85,         // độ: lệch khỏi trục bấy nhiêu thì cường độ đèn còn một nửa
    nuaGocThu: 20,          // độ: lệch khỏi trục bấy nhiêu thì độ nhạy bộ thu còn một nửa
    nuaGocNhin: 16,         // độ (mô hình cũ)
    banKinhMat: 0.15,       // cm, bán kính cửa sổ quang (mô hình cũ)
    trangChuan: 0.92,       // tín hiệu (0–1) khi soi nền trắng ở khoảng cách chuẩn: do biến trở trên mô-đun đặt
    nguong: 0.5,            // ngưỡng của mạch so sánh cho ngõ ra số
    doTre: 0.03,
    nhieu: 0
  };

  // ---------- Mô hình Lambert ----------
  // Đèn E và bộ thu D đặt cạnh nhau, cùng nhìn theo hướng n̂ (trục quang). Bộ thu "nhìn" ra theo nhiều tia;
  // mỗi tia chạm mặt sân tại P, pháp tuyến N. Phần công suất bộ thu nhận từ mảnh sân dA quanh P:
  //   độ rọi tại P:       Ev = I(α) · cos θᵢ / r_E²        (θᵢ: góc tới, giữa N và PE; α: lệch khỏi trục đèn)
  //   độ chói phản xạ:    L  = ρ · Ev / π                  (mặt khuếch tán Lambert: sáng như nhau từ mọi hướng)
  //   bộ thu nhận:        dΦ = L · cos θᵣ · dA · S(β) · cos β / r_D²   (θᵣ: góc thu, giữa N và PD; β: lệch khỏi trục thu)
  // Tia của bộ thu chiếm góc khối dΩ thì quét được mảnh sân dA = r_D² · dΩ / cos θᵣ. Nghiêng mặt sân đi,
  // mảnh sân rộng ra đúng bằng phần cos θᵣ làm tối đi, nên mặt Lambert trông sáng như nhau từ mọi góc nhìn;
  // còn cos θᵢ thì ở lại: đèn chiếu xiên thì mỗi cm² sân nhận ít ánh sáng hơn.
  // Giản đồ phát I(α) và độ nhạy S(β) dạng chuông: bằng 1/2 khi lệch nửa góc. Đường tín hiệu theo khoảng cách
  // (đỉnh ở 2,5 mm, rồi giảm như 1/d²) không nhập tay mà tự sinh ra từ hình học: quá gần thì vùng đèn rọi và
  // vùng bộ thu nhìn chưa chồng lên nhau, xa thì ánh sáng loãng theo bình phương khoảng cách.
  // Cảm biến màu TCS34725: đèn LED trắng góc phát rộng, chip có thấu kính nhỏ, đặt cạnh nhau như TCRT5000
  const MAU_MAC_DINH = { nuaGocPhat: 60, nuaGocThu: 20, trangChuan: 1 };
  const LN2 = Math.log(2);
  const chuong = (goc, nua) => Math.exp(-LN2 * (goc / nua) * (goc / nua));
  // Các tia của bộ thu: 1 tia giữa và 3 vòng, mỗi tia mang trọng số S(β)·cos β·dΩ
  function taoTiaThu(nuaGoc) {
    const VONG = [1, 6, 10, 14];
    let bMax = Math.min(80 * RAD, 2.2 * nuaGoc), buoc = bMax / (VONG.length - 0.5), ds = [];
    VONG.forEach(function(so, j) {
      let b = j * buoc, tren = Math.max(0, b - buoc / 2), duoi = b + buoc / 2;
      let dOm = 2 * Math.PI * (Math.cos(tren) - Math.cos(duoi)) / so;
      for (let k = 0; k < so; k++) {
        let p = 2 * Math.PI * k / so + (j % 2) * Math.PI / so;
        ds.push({ b: b, u: Math.sin(b) * Math.cos(p), w: Math.sin(b) * Math.sin(p), c: Math.cos(b), trong: chuong(b, nuaGoc) * Math.cos(b) * dOm });
      }
    });
    return ds;
  }
  // Phần đóng góp của một điểm chạm. E, P, N, h (hướng tia thu), truc: mảng 3 số; rD: chiều dài tia.
  function dongGopLambert(o, E, P, N, h, rD, truc, trong) {
    let cosR = -V.cham(N, h);
    if (cosR < 0) { N = V.nhan(N, -1); cosR = -cosR; }   // mặt hai phía: lấy phía quay về bộ thu
    if (cosR < 1e-3) return 0;
    let PE = V.tru(E, P), rE2 = V.cham(PE, PE), rE = Math.sqrt(rE2);
    let cosI = V.cham(N, PE) / rE;                         // cos góc tới
    let cosA = -V.cham(truc, PE) / rE;                     // cos góc lệch khỏi trục đèn
    if (cosI <= 0 || cosA <= 0) return 0;                  // đèn ở sau mặt, hoặc sau lưng đèn
    let I = chuong(Math.acos(Math.min(1, cosA)), o.nuaGocPhat * RAD);
    let Ev = I * cosI / rE2;
    let L = Ev / Math.PI;                                   // nhân ρ ở ngoài
    // trong = S(β)·cos β·dΩ của tia; mảnh sân tia quét được dA = r_D²·dΩ/cos θᵣ
    let dA_chia_dOm = rD * rD / cosR;
    return L * cosR * dA_chia_dOm * trong / (rD * rD);
  }
  // Tín hiệu (chưa nhân hệ số khuếch đại) khi đầu đo nhìn thẳng xuống một mặt phẳng phản xạ ρ ở độ cao d.
  // Dùng để đặt hệ số khuếch đại và để vẽ đường đáp ứng theo khoảng cách.
  function tinHieuMatPhang(o, d, rho) {
    let s = o.khoangCachDenThu, tia = taoTiaThu(o.nuaGocThu * RAD), t = 0;
    let E = [s / 2, 0, 0], D = [-s / 2, 0, 0], truc = [0, -1, 0], N = [0, 1, 0];
    for (let q of tia) {
      let h = [q.u, -q.c, q.w], rD = d / q.c;
      t += dongGopLambert(o, E, V.cong(D, V.nhan(h, rD)), N, h, rD, truc, q.trong);
    }
    return (rho == null ? 1 : rho) * t;
  }

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

  // rgb: cảm biến màu TCS34725 (đèn trắng, chip đo riêng ba kênh đỏ, lục, lam qua kính lọc màu).
  // Cùng hình học Lambert với TCRT5000, chỉ khác hệ số phản xạ: mỗi kênh lấy đúng thành phần màu đó của mặt sân.
  function DoLine(cb, r, scene, rgb) {
    let self = this, kh = new Khung(r, cb);
    this.type = 'ColorSensor';            // để thư viện Python và khối "độ sáng phản xạ" có sẵn đọc được
    this.sraLoai = rgb ? 'mau' : 'doLine';
    this.sraGam = cb.gam != null || cb.servo != null;    // mắt không ở thanh dưới mũi (dưới gầm hoặc trên tay quay servo)
    this.tuyChon = tuyChon(DL_MAC_DINH, rgb ? MAU_MAC_DINH : null, (r.options.sraCamBien || {})[rgb ? 'mau' : 'doLine']);
    let o = this.tuyChon;
    this.position = bVec(cb.vt);          // x < 0 là mắt trái (khối "cảm biến trái/giữa/phải" dựa vào đây)
    this.renderTarget = { sraGia: true }; // mã số đo của G7 chỉ nhận cảm biến có trường này
    this.options = {};
    this.tinHieu = 0;                     // 0–1, tỉ lệ với dòng qua phototransistor
    this.so = false;                      // ngõ ra số: true = nền sáng (phản xạ mạnh)
    let khungDo = -1;
    let lambert = o.moHinh != 'cu';
    // Hệ số khuếch đại: nền trắng (phản xạ 0,9) ở khoảng cách chuẩn cho tín hiệu trangChuan
    let K = lambert ? o.trangChuan / tinHieuMatPhang(o, o.khoangCachChuan, 0.9) : o.trangChuan / (0.9 * dapUng(o.khoangCachChuan));
    let KRGB = lambert ? 1 / tinHieuMatPhang(o, o.khoangCachChuan, 1) : 1 / dapUng(o.khoangCachChuan);
    this.kenh = [0, 0, 0];                // cảm biến màu: ba kênh đỏ, lục, lam (0–1)
    // Mô hình cũ: các điểm mẫu trong vùng nhìn: tâm, vòng giữa, vòng ngoài (trọng số giảm dần ra mép)
    let mau = [[0, 0, 1]];
    for (let i = 0; i < 6; i++) mau.push([0.5 * Math.cos(Math.PI / 3 * i), 0.5 * Math.sin(Math.PI / 3 * i), 0.8]);
    for (let i = 0; i < 8; i++) mau.push([0.92 * Math.cos(Math.PI / 4 * i + 0.3), 0.92 * Math.sin(Math.PI / 4 * i + 0.3), 0.4]);
    let tongTrong = mau.reduce((s, m) => s + m[2], 0);
    let tiaThu = taoTiaThu(o.nuaGocThu * RAD);
    // Hướng từ bộ thu sang đèn (hệ trục xe): cho sẵn trong cấu hình, không thì lấy hướng về mũi xe
    let denThu = cb.den || (function() {
      let t = V.tru([0, 0, 1], V.nhan(cb.huong, V.cham([0, 0, 1], cb.huong)));
      return V.cham(t, t) < 1e-6 ? [1, 0, 0] : V.donVi(t);
    })();
    // Nạp sẵn ảnh của các mặt có hoạ tiết (thảm sân) để lần đo đầu tiên đã đọc được màu thật
    scene.meshes.forEach(function(m) {
      let vl = m.origMaterial || m.material;
      if (!vl || m.sraXe) return;
      (vl.subMaterials || [vl]).forEach((x) => { if (x) anhCuaTexture(x.diffuseTexture || x.albedoTexture || x.emissiveTexture); });
    });
    // Hệ số phản xạ của mặt sân theo từng kênh đo: TCRT5000 chỉ có một kênh hồng ngoại (ba số bằng nhau),
    // cảm biến màu đo ba kênh đỏ, lục, lam.
    const phanXaCua = rgb
      ? (c) => c.phanXa != null ? [c.phanXa, c.phanXa, c.phanXa] : [c.mau[0] / 255, c.mau[1] / 255, c.mau[2] / 255]
      : (c) => { let p = c.phanXa != null ? c.phanXa : phanXaHongNgoai(c.mau[0], c.mau[1], c.mau[2]); return [p, p, p]; };
    // Đi từ lớp trên cùng xuống: lớp trong mờ (vùng tô màu) chỉ che một phần lớp dưới
    function quaCacLop(ds, gop) {
      ds.sort((a, b) => a.distance - b.distance);
      let conLai = 1, s = [0, 0, 0];
      for (let hit of ds) {
        let c = mauTaiDiem(hit), p = phanXaCua(c), w = conLai * c.duc * gop(hit);
        s[0] += w * p[0]; s[1] += w * p[1]; s[2] += w * p[2];
        conLai *= 1 - c.duc;
        if (conLai < 0.02) break;
      }
      return s;
    }
    // Lần đo gần nhất, để vẽ và giải thích: điểm chạm, góc tới, góc thu (độ) và phần đóng góp của từng tia
    this.chiTiet = [];

    function doLambert(goc, xuong, ngang, doc) {
      let dh = kh.huong(denThu), s2 = o.khoangCachDenThu / 2;
      let E = V.cong(goc, V.nhan(dh, s2)), D = V.tru(goc, V.nhan(dh, s2));
      let tong = [0, 0, 0], ct = [];
      for (let q of tiaThu) {
        let h = V.donVi(V.cong(V.nhan(xuong, q.c), V.cong(V.nhan(ngang, q.u), V.nhan(doc, q.w))));
        let ds = scene.multiPickWithRay(new BABYLON.Ray(bVec(D), bVec(h), 8), khongPhaiXe) || [];
        let dau = null;
        let them = quaCacLop(ds, function(hit) {
          let p = hit.pickedPoint, n = hit.getNormal(true, true);
          let P = [p.x, p.y, p.z], N = n ? [n.x, n.y, n.z] : [0, 1, 0];
          let g = dongGopLambert(o, E, P, N, h, hit.distance, xuong, q.trong);
          if (!dau) {
            let PE = V.donVi(V.tru(E, P)), Nm = V.cham(N, h) > 0 ? V.nhan(N, -1) : N;
            dau = { P: P, gocToi: Math.acos(Math.max(-1, Math.min(1, V.cham(Nm, PE)))) / RAD, gocThu: Math.acos(Math.min(1, -V.cham(Nm, h))) / RAD, r: hit.distance, gop: g };
          }
          return g;
        });
        tong = V.cong(tong, them);
        if (dau) ct.push(dau);
      }
      self.chiTiet = ct;
      return tong;
    }
    function doCu(goc, xuong, ngang, doc) {
      let tanG = Math.tan(o.nuaGocNhin * RAD), tong = [0, 0, 0];
      for (let m of mau) {
        // tia xuất phát trong cửa sổ quang, toả ra theo góc nhìn
        let lech = V.cong(V.nhan(ngang, m[0]), V.nhan(doc, m[1]));
        let p = V.cong(goc, V.nhan(lech, o.banKinhMat));
        let h = V.donVi(V.cong(xuong, V.nhan(lech, tanG)));
        let ds = scene.multiPickWithRay(new BABYLON.Ray(bVec(p), bVec(h), 8), khongPhaiXe) || [];
        tong = V.cong(tong, V.nhan(quaCacLop(ds, (hit) => dapUng(hit.distance)), m[2]));
      }
      return V.nhan(tong, 1 / tongTrong);
    }

    this.do = function() {
      let goc = kh.diem(cb.vt), xuong = kh.huong(cb.huong);
      // hai hướng vuông góc với hướng nhìn để trải các tia (mắt dưới mũi: ngang và dọc xe)
      let ngang = kh.huong(Math.abs(cb.huong[0]) > 0.9 ? [0, 0, 1] : [1, 0, 0]);
      ngang = V.donVi(V.tru(ngang, V.nhan(xuong, V.cham(ngang, xuong))));
      let doc = V.co(xuong, ngang);
      let v = lambert ? doLambert(goc, xuong, ngang, doc) : doCu(goc, xuong, ngang, doc);
      if (rgb) {
        // Mỗi kênh chia cho tín hiệu của mặt trắng tuyệt đối ở độ cao chuẩn (cân bằng trắng lúc xuất xưởng)
        self.kenh = v.map((x) => Math.max(0, Math.min(1, KRGB * x + (o.nhieu > 0 ? nhieuChuan() * o.nhieu : 0))));
      }
      let t = rgb ? (self.kenh[0] + self.kenh[1] + self.kenh[2]) / 3 : K * v[0];
      if (o.nhieu > 0 && !rgb) t += nhieuChuan() * o.nhieu;
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
    // Mức chương trình đọc được (0–1). Chế độ tương tự (chân A0): đúng mức tín hiệu. Chế độ số (chân D0):
    // ngõ ra của mạch so sánh, chỉ có 0 (vạch tối) hoặc 1 (nền sáng).
    this.che = cb.che == 'so' ? 'so' : 'tuongTu';
    const mucDoc = () => self.che == 'so' ? (self.so ? 1 : 0) : self.tinHieu;
    // TCRT5000 không phân biệt được màu: ba kênh bằng nhau, tỉ lệ với hồng ngoại phản xạ.
    // Cảm biến màu trả về đúng ba kênh đo được.
    this.getRGB = function() {
      capNhat();
      if (rgb) return self.kenh.map((x) => x * 255);
      let v = mucDoc() * 255; return [v, v, v];
    };
    this.getHSV = function() {
      capNhat();
      if (!rgb) return [0, 0, mucDoc() * 100];
      let [R, G, B] = self.kenh, mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn, h = 0;
      if (d > 0) h = mx == R ? 60 * (((G - B) / d) % 6) : mx == G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4);
      return [(h + 360) % 360, mx > 0 ? d / mx * 100 : 0, mx * 100];
    };

    // ---------- Đèn báo phía trước mắt đo ----------
    // Chế độ số: đèn xanh lá sáng khi ngõ ra số bật (nền sáng), tắt (xám) khi gặp vạch tối, như đèn báo D0
    // trên mô-đun thật. Chế độ tương tự: đèn cam, càng đậm khi tín hiệu càng mạnh.
    // Đèn chỉ để nhìn (không bắt tia, không có khối lượng) và luôn vẽ đè lên xe để thấy được từ mọi góc.
    if (rgb) { this.render = function() {}; return; }     // cảm biến màu không có đèn báo D0
    let lechDen = cb.servo != null ? V.nhan(cb.huong, 0.6) : [0, 0.35, 0.95];
    let viTriDen = bVec(V.tru(V.cong(cb.vt, lechDen), kh.tam));
    function taoDen(ten, hinh, cao) {
      let m = hinh == 'cau' ? BABYLON.MeshBuilder.CreateSphere(ten, { diameter: cao, segments: 8 }, scene)
        : BABYLON.MeshBuilder.CreateDisc(ten, { radius: cao / 2, tessellation: 24 }, scene);
      m.parent = kh.nut; m.position = viTriDen.clone();
      m.isPickable = false; m.sraXe = true; m.sraDenBao = true; m.renderingGroupId = 1;
      let vl = new BABYLON.StandardMaterial(ten + 'Vl', scene);
      vl.disableLighting = true; vl.backFaceCulling = false;
      vl.diffuseColor = BABYLON.Color3.Black(); vl.specularColor = BABYLON.Color3.Black();
      m.material = vl;
      if (hinh != 'cau') m.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      return m;
    }
    this.denBao = taoDen('sraDenBao', 'cau', 0.6);
    const XANH = BABYLON.Color3.FromHexString('#2ee86a'), TAT = BABYLON.Color3.FromHexString('#3b3f45');
    const NHAT = BABYLON.Color3.FromHexString('#fff1e0'), DAM = BABYLON.Color3.FromHexString('#e04a0b');
    function toDen() {
      let loi = self.denBao.material;
      if (self.che == 'so') {
        loi.emissiveColor = self.so ? XANH : TAT; loi.alpha = 1;
      } else {
        let t = self.tinHieu;
        // tín hiệu yếu: đèn nhạt, gần như trong suốt; tín hiệu mạnh: cam đậm, đục hẳn
        loi.emissiveColor = BABYLON.Color3.Lerp(NHAT, DAM, t); loi.alpha = 0.2 + 0.8 * t;
      }
    }
    let lanToDen = 0;
    this.render = function() {
      let bay = performance.now();
      if (bay - lanToDen < 50) return;      // 20 lần mỗi giây là đủ cho mắt nhìn
      lanToDen = bay;
      capNhat(); toDen();
    };
    toDen();
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

  // ======================================================================
  // Bút vẽ (bút dạ trong ống giữ ở tâm quay, cuộn nâng nhấc bút)
  // ======================================================================
  // Giữ tên hàm của bút GEARS (down, up, isDown, setTraceColor, setWidth, tip) để thư viện Python, khối
  // "hạ bút"/"nhấc bút" và phần chấm nét vẽ (core/net-ve.js) dùng được. Nét mực là dải phẳng sát mặt sân
  // vẽ theo đường ngòi bút đi qua; chỉ để nhìn, cảm biến không thấy nó.
  const BUT_MAC_DINH = { thoiGianNang: 0.06, buocNet: 0.15 };
  function But(cb, r, scene, banLap) {
    let self = this, mb = banLap.but, tam = r.sraKhoiLuong.than.tam;
    this.type = 'Pen';
    this.sraLoai = 'but';
    this.tuyChon = tuyChon(BUT_MAC_DINH, (r.options.sraCamBien || {}).but);
    let o = this.tuyChon;
    this.options = { doubleSided: false, traceVisibleToSensors: false };
    this.isDown = false;
    this.traceColor = '000000';
    this.traceWidth = mb.rongNet / 2;     // nửa bề rộng nét (cm), như GEARS
    this.traceMeshes = [];
    let doNang = mb.nang;                 // ngòi đang cách sân bao nhiêu (cm), 0 = chạm sân
    // Cây bút: lưới riêng gắn vào thân, dời lên xuống theo cuộn nâng
    this.luoi = SRAXeDungHinh.dungVat(scene, 'sraBut', [{ khoi: mb.khoi.map((k) => k.q ? k : H.chuanHoa(k)), trangTri: [] }], tam, r.body);
    this.tip = new BABYLON.TransformNode('sraNgoiBut', scene);
    this.tip.parent = r.body;
    let goc = V.tru(mb.ngoi, tam);
    function datCao() {
      self.luoi.forEach((m) => { m.position.y = doNang; });
      self.tip.position = bVec(V.cong(goc, [0, doNang, 0]));
    }
    datCao();

    let vlNet = null, net = null, duong = null, cuoi = null, ban = false, lanDung = 0;
    function vatLieuNet() {
      vlNet = new BABYLON.StandardMaterial('sraNetBut' + self.traceColor, scene);
      vlNet.emissiveColor = BABYLON.Color3.FromHexString('#' + self.traceColor);
      vlNet.disableLighting = true;
      vlNet.zOffset = -2;
    }
    function ketThucNet() {
      if (ban) dungNet();
      if (net) self.traceMeshes.push(net);
      net = null; duong = null; cuoi = null; ban = false;
    }
    this.down = function() { if (!self.isDown) { ketThucNet(); self.isDown = true; } };
    this.up = function() { self.isDown = false; ketThucNet(); };
    this.setTraceColor = function(R, G, B) {
      let hex = (x) => ('0' + Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16)).slice(-2);
      self.traceColor = hex(R) + hex(G) + hex(B);
      vlNet = null;
      if (self.isDown) ketThucNet();      // đổi màu: bắt đầu nét mới
    };
    this.setWidth = function(w) { self.traceWidth = Math.max(0.05, Number(w) || 0) / 2; if (self.isDown) ketThucNet(); };

    function dungNet() {
      if (!duong || duong[0].length < 2) return;
      if (!vlNet) vatLieuNet();
      if (net) net.dispose();
      net = BABYLON.MeshBuilder.CreateRibbon('sraNetBut', { pathArray: duong }, scene);
      net.material = vlNet;
      net.isPickable = false; net.sraNetBut = true;
      ban = false;
    }
    this.render = function(delta) {
      // cuộn nâng: ngòi đi tới vị trí lệnh trong thoiGianNang giây
      let dich = self.isDown ? 0 : mb.nang, buoc = mb.nang * (delta || 0) / 1000 / o.thoiGianNang;
      if (doNang != dich) {
        doNang = doNang < dich ? Math.min(dich, doNang + buoc) : Math.max(dich, doNang - buoc);
        datCao();
      }
      if (!self.isDown || doNang > 0.02) return;
      let p = self.tip.getAbsolutePosition().clone();
      p.y += 0.03;                        // dải mực sát trên mặt sân
      if (!cuoi) { cuoi = p; duong = [[], []]; return; }
      let d = p.subtract(cuoi);
      if (d.lengthSquared() < o.buocNet * o.buocNet) return;
      let ngang = BABYLON.Vector3.Cross(d.normalize(), BABYLON.Axis.Y).scale(self.traceWidth);
      if (!duong[0].length) { duong[0].push(cuoi.add(ngang)); duong[1].push(cuoi.subtract(ngang)); }
      duong[0].push(p.add(ngang)); duong[1].push(p.subtract(ngang));
      cuoi = p; ban = true;
      let bay = performance.now();
      if (bay - lanDung > 80) { dungNet(); lanDung = bay; }
    };
    // nét đang vẽ dở được dựng nốt trước khi chấm (net-ve đọc vị trí ngòi, không đọc lưới)
    this.dungNot = function() { if (ban) dungNet(); };
  }

  function tao(cb, r, scene, banLap) {
    if (cb.loai == 'sieuAm') return new SieuAm(cb, r, scene);
    if (cb.loai == 'doLine') return new DoLine(cb, r, scene);
    if (cb.loai == 'mau') return new DoLine(cb, r, scene, true);
    if (cb.loai == 'but') return new But(cb, r, scene, banLap);
    if (cb.loai == 'cham') return new Cham(cb, r, scene, banLap);
    if (cb.loai == 'gyro') return new Gyro(cb, r, scene);
    if (cb.loai == 'gps') return new GPS(cb, r, scene);
    return null;
  }

  return { tao: tao, dapUng: dapUng, phanXaHongNgoai: phanXaHongNgoai, tinHieuMatPhang: tinHieuMatPhang,
    MAC_DINH: { sieuAm: SA_MAC_DINH, doLine: DL_MAC_DINH, mau: MAU_MAC_DINH, gyro: GYRO_MAC_DINH, gps: GPS_MAC_DINH, but: BUT_MAC_DINH } };
})();
