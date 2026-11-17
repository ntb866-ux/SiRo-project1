// Sân Robot Ảo – xe lắp mô-đun: toán hình khối dùng chung cho hình vẽ, hitbox và khối lượng.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Mỗi chi tiết của xe được mô tả bằng các KHỐI ĐẶC (hộp, trụ, cầu, lăng trụ đáy lồi).
// Cùng một bản mô tả này sinh ra ba thứ, nên chúng luôn khớp nhau:
//   1. lưới 3D để vẽ (dung-hinh.js),
//   2. hình va chạm trong Bullet/Ammo (vat-li.js),
//   3. khối lượng, trọng tâm, mô-men quán tính (tệp này).
// Tệp không phụ thuộc Babylon hay Ammo, chạy được cả trong trình duyệt lẫn Node
// (script sinh tệp robot và bộ kiểm tra dùng lại đúng các hàm này).
//
// Đơn vị: cm, gam, giây. Hệ trục của xe: x sang phải, y lên trên, z về phía trước.
// Phép quay viết bằng quaternion [x, y, z, w]; v' = q v q*.
(function(goc, tao) {
  if (typeof module == 'object' && module.exports) module.exports = tao();
  else goc.SRAHinhKhoi = tao();
})(typeof self != 'undefined' ? self : this, function() {
  'use strict';
  const PI = Math.PI;
  const RAD = PI / 180;

  // ---------- Vector và quaternion ----------
  const V = {
    cong: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    tru: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    nhan: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    cham: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    co: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    dai: (a) => Math.hypot(a[0], a[1], a[2]),
    donVi: (a) => { let d = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / d, a[1] / d, a[2] / d]; },
  };

  const Q = {
    DON_VI: [0, 0, 0, 1],
    truc: function(truc, doGoc) {
      let h = doGoc * RAD / 2, s = Math.sin(h), t = V.donVi(truc);
      return [t[0] * s, t[1] * s, t[2] * s, Math.cos(h)];
    },
    nhan: function(a, b) {   // quay b trước, rồi a
      return [
        a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
      ];
    },
    lienHop: (q) => [-q[0], -q[1], -q[2], q[3]],
    quay: function(q, v) {
      let u = [q[0], q[1], q[2]], s = q[3];
      let t = V.nhan(V.co(u, v), 2);
      return V.cong(V.cong(v, V.nhan(t, s)), V.co(u, t));
    },
    // [rx, ry, rz] độ: quay quanh z trước, rồi x, rồi y (cùng thứ tự yaw-pitch-roll của Babylon)
    tuGoc: function(g) {
      if (!g) return [0, 0, 0, 1];
      if (g.length == 4) return g;
      let q = Q.truc([0, 0, 1], g[2] || 0);
      q = Q.nhan(Q.truc([1, 0, 0], g[0] || 0), q);
      return Q.nhan(Q.truc([0, 1, 0], g[1] || 0), q);
    },
    // Quaternion từ ba trục vuông góc (cột của ma trận quay)
    tuTruc: function(ex, ey, ez) {
      let m00 = ex[0], m01 = ey[0], m02 = ez[0], m10 = ex[1], m11 = ey[1], m12 = ez[1], m20 = ex[2], m21 = ey[2], m22 = ez[2];
      let tr = m00 + m11 + m22, x, y, z, w;
      if (tr > 0) { let s = Math.sqrt(tr + 1) * 2; w = s / 4; x = (m21 - m12) / s; y = (m02 - m20) / s; z = (m10 - m01) / s; }
      else if (m00 > m11 && m00 > m22) { let s = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / s; x = s / 4; y = (m01 + m10) / s; z = (m02 + m20) / s; }
      else if (m11 > m22) { let s = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / s; x = (m01 + m10) / s; y = s / 4; z = (m12 + m21) / s; }
      else { let s = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = s / 4; }
      return [x, y, z, w];
    },
    maTran: function(q) {
      let x = q[0], y = q[1], z = q[2], w = q[3];
      return [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]
      ];
    }
  };

  // Trục của khối trụ/lăng trụ: trục riêng là y; 'x' và 'z' là phép quay đưa y về trục đó
  const Q_TRUC = { y: [0, 0, 0, 1], x: Q.truc([0, 0, 1], -90), z: Q.truc([1, 0, 0], 90) };

  // ---------- Ma trận 3x3 ----------
  const M = {
    nhan: function(a, b) {
      let c = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
      return c;
    },
    chuyenVi: (a) => [[a[0][0], a[1][0], a[2][0]], [a[0][1], a[1][1], a[2][1]], [a[0][2], a[1][2], a[2][2]]],
    cong: (a, b) => a.map((h, i) => h.map((x, j) => x + b[i][j])),
    nhanSo: (a, k) => a.map((h) => h.map((x) => x * k)),
    cheo: (x, y, z) => [[x, 0, 0], [0, y, 0], [0, 0, z]],
    // Tenxơ quán tính quay theo R: I' = R I Rᵀ
    quay: (I, R) => M.nhan(M.nhan(R, I), M.chuyenVi(R)),
    // Định lí trục song song: thêm phần của chất điểm khối lượng m đặt tại d (so với gốc tính)
    songSong: function(m, d) {
      let dd = V.cham(d, d);
      return [
        [m * (dd - d[0] * d[0]), -m * d[0] * d[1], -m * d[0] * d[2]],
        [-m * d[1] * d[0], m * (dd - d[1] * d[1]), -m * d[1] * d[2]],
        [-m * d[2] * d[0], -m * d[2] * d[1], m * (dd - d[2] * d[2])]
      ];
    }
  };

  // ---------- Chuẩn hoá khối ----------
  // Khối viết gọn trong danh mục linh kiện:
  //   { k: 'hop',  kt: [rộng x, cao y, dài z], vt: [x, y, z], xoay: [rx, ry, rz] }
  //   { k: 'tru',  d: đường kính, h: chiều dài, truc: 'x' | 'y' | 'z', vt, xoay, dTrong: lõi rỗng (chỉ để tính khối lượng),
  //                bo: bán kính bo tròn hai mép (lốp xe); khối lượng và quán tính vẫn tính như trụ không bo }
  //   { k: 'cau',  d, vt }
  //   { k: 'lang', da: [[u, v], …] đa giác lồi, h, truc, vt, xoay }
  //     truc 'y': u → x, v → z;   truc 'x': u → z, v → y;   truc 'z': u → x, v → y
  // Sau chuẩn hoá khối có vt (vị trí tâm), q (quaternion) trong hệ trục của chi tiết.
  function chuanHoa(k) {
    let kq = Object.assign({}, k);
    kq.vt = (k.vt || [0, 0, 0]).slice();
    let q = Q.tuGoc(k.xoay);
    if (k.k == 'tru' && k.truc && k.truc != 'y') q = Q.nhan(q, Q_TRUC[k.truc]);
    kq.q = q;
    if (k.k == 'lang') {
      kq.truc = k.truc || 'y';
      kq.da = huongNguocKim(k.da);
      kq.dinh = dinhLangTru(kq);
    }
    return kq;
  }

  function dienTichDaGiac(da) {
    let s = 0;
    for (let i = 0; i < da.length; i++) { let a = da[i], b = da[(i + 1) % da.length]; s += a[0] * b[1] - b[0] * a[1]; }
    return s / 2;
  }
  function huongNguocKim(da) { return dienTichDaGiac(da) < 0 ? da.slice().reverse() : da.slice(); }

  // (u, v, w) của lăng trụ → toạ độ riêng của khối
  function uvw(truc, u, v, w) {
    if (truc == 'x') return [w, v, u];
    if (truc == 'z') return [u, v, w];
    return [u, w, v];
  }
  function veUvw(truc, p) {
    if (truc == 'x') return [p[2], p[1], p[0]];
    if (truc == 'z') return [p[0], p[1], p[2]];
    return [p[0], p[2], p[1]];
  }
  function dinhLangTru(k) {
    let ds = [];
    for (let w of [-k.h / 2, k.h / 2]) for (let p of k.da) ds.push(uvw(k.truc, p[0], p[1], w));
    return ds;
  }

  // Đặt khối (đã chuẩn hoá) vào hệ trục ngoài: vị trí vt, quay q
  function dat(k, vt, q) {
    let kq = Object.assign({}, k);
    kq.vt = V.cong(vt, Q.quay(q, k.vt));
    kq.q = Q.nhan(q, k.q);
    return kq;
  }

  // ---------- Thể tích và quán tính ----------
  // Trả về { V, tam: trọng tâm trong hệ riêng của khối, I1: tenxơ quán tính quanh trọng tâm cho khối lượng 1 }
  function hinhHoc(k) {
    if (k.k == 'hop') {
      let [a, b, c] = k.kt;
      return { V: a * b * c, tam: [0, 0, 0], I1: M.cheo((b * b + c * c) / 12, (a * a + c * c) / 12, (a * a + b * b) / 12) };
    }
    if (k.k == 'tru') {
      let r = k.d / 2, r0 = (k.dTrong || 0) / 2, h = k.h;
      let Vv = PI * (r * r - r0 * r0) * h;
      let iy = (r * r + r0 * r0) / 2, ix = (3 * (r * r + r0 * r0) + h * h) / 12;
      return { V: Vv, tam: [0, 0, 0], I1: M.cheo(ix, iy, ix) };
    }
    if (k.k == 'cau') {
      let r = k.d / 2;
      return { V: 4 / 3 * PI * r * r * r, tam: [0, 0, 0], I1: M.cheo(0.4 * r * r, 0.4 * r * r, 0.4 * r * r) };
    }
    if (k.k == 'lang') {
      // Mô-men diện tích của đa giác (công thức Green)
      let A = 0, cu = 0, cv = 0, juu = 0, jvv = 0, juv = 0, da = k.da;
      for (let i = 0; i < da.length; i++) {
        let [x0, y0] = da[i], [x1, y1] = da[(i + 1) % da.length];
        let c = x0 * y1 - x1 * y0;
        A += c; cu += (x0 + x1) * c; cv += (y0 + y1) * c;
        juu += (y0 * y0 + y0 * y1 + y1 * y1) * c;                 // ∫v² dA × 12
        jvv += (x0 * x0 + x0 * x1 + x1 * x1) * c;                 // ∫u² dA × 12
        juv += (x0 * y1 + 2 * x0 * y0 + 2 * x1 * y1 + x1 * y0) * c; // ∫uv dA × 24
      }
      A /= 2; cu /= 6 * A; cv /= 6 * A;
      let Suu = jvv / 12 / A - cu * cu, Svv = juu / 12 / A - cv * cv, Suv = juv / 24 / A - cu * cv;  // quanh tâm, cho diện tích 1
      let h2 = k.h * k.h / 12;
      // Trong hệ (u, v, w): Iuu = Svv + h², Ivv = Suu + h², Iww = Suu + Svv, Iuv = -Suv
      let T = { uu: Svv + h2, vv: Suu + h2, ww: Suu + Svv, uv: -Suv };
      let I1;
      if (k.truc == 'x') I1 = [[T.ww, 0, 0], [0, T.vv, T.uv], [0, T.uv, T.uu]];        // x=w, y=v, z=u
      else if (k.truc == 'z') I1 = [[T.uu, T.uv, 0], [T.uv, T.vv, 0], [0, 0, T.ww]];   // x=u, y=v, z=w
      else I1 = [[T.uu, 0, T.uv], [0, T.ww, 0], [T.uv, 0, T.vv]];                      // x=u, y=w, z=v
      return { V: A * k.h, tam: uvw(k.truc, cu, cv, 0), I1: I1 };
    }
    throw new Error('Khối lạ: ' + k.k);
  }

  // Khối lượng, trọng tâm và tenxơ quán tính (quanh trọng tâm) của một nhóm khối.
  // ds: [{ khoi: [khối đã đặt vào hệ chung], khoiLuong: gam }] – khối lượng chia theo thể tích trong nhóm.
  function khoiLuongTong(ds) {
    let chat = [];
    for (let n of ds) {
      let hh = n.khoi.map(hinhHoc);
      let Vt = hh.reduce((s, h) => s + h.V, 0);
      n.khoi.forEach(function(k, i) {
        let m = n.khoiLuong * hh[i].V / Vt;
        let R = Q.maTran(k.q);
        chat.push({ m: m, tam: V.cong(k.vt, Q.quay(k.q, hh[i].tam)), I: M.nhanSo(M.quay(hh[i].I1, R), m) });
      });
    }
    let m = chat.reduce((s, c) => s + c.m, 0);
    let tam = [0, 0, 0];
    for (let c of chat) tam = V.cong(tam, V.nhan(c.tam, c.m / m));
    let I = M.cheo(0, 0, 0);
    for (let c of chat) I = M.cong(I, M.cong(c.I, M.songSong(c.m, V.tru(c.tam, tam))));
    return { m: m, tam: tam, I: I };
  }

  // ---------- Khoảng cách có dấu tới mặt khối (âm = ở trong) ----------
  function kcDaGiac(da, u, v) {
    let d2 = Infinity, trong = true;
    for (let i = 0; i < da.length; i++) {
      let a = da[i], b = da[(i + 1) % da.length];
      let ex = b[0] - a[0], ey = b[1] - a[1], px = u - a[0], py = v - a[1];
      let t = Math.max(0, Math.min(1, (px * ex + py * ey) / (ex * ex + ey * ey)));
      let dx = px - ex * t, dy = py - ey * t;
      d2 = Math.min(d2, dx * dx + dy * dy);
      if (ex * py - ey * px < 0) trong = false;   // đa giác ngược chiều kim đồng hồ: điểm trong nằm bên trái mọi cạnh
    }
    return (trong ? -1 : 1) * Math.sqrt(d2);
  }
  function kcKhoi(k, p) {
    let l = Q.quay(Q.lienHop(k.q), V.tru(p, k.vt));
    if (k.k == 'hop') {
      let q = [Math.abs(l[0]) - k.kt[0] / 2, Math.abs(l[1]) - k.kt[1] / 2, Math.abs(l[2]) - k.kt[2] / 2];
      return Math.hypot(Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0)) + Math.min(Math.max(q[0], q[1], q[2]), 0);
    }
    if (k.k == 'tru') {
      // bo: bán kính bo tròn hai mép (trụ bo mép = trụ nhỏ hơn "phồng" đều ra một khoảng bo)
      let bo = k.bo || 0;
      let a = Math.hypot(l[0], l[2]) - (k.d / 2 - bo), b = Math.abs(l[1]) - (k.h / 2 - bo);
      return Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0) - bo;
    }
    if (k.k == 'cau') return V.dai(l) - k.d / 2;
    if (k.k == 'lang') {
      let t = veUvw(k.truc, l);
      let a = kcDaGiac(k.da, t[0], t[1]), b = Math.abs(t[2]) - k.h / 2;
      return Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0);
    }
    return Infinity;
  }
  function kcNhom(ds, p) {
    let d = Infinity;
    for (let k of ds) d = Math.min(d, kcKhoi(k, p));
    return d;
  }

  // Điểm rải đều trên mặt khối (để kiểm tra hitbox so với lưới vẽ), trong hệ chứa khối
  function diemTrenMat(k, buoc) {
    let ds = [];
    let them = (l) => ds.push(V.cong(k.vt, Q.quay(k.q, l)));
    let chia = (dai) => Math.max(1, Math.ceil(dai / buoc));
    if (k.k == 'hop') {
      let h = k.kt.map((x) => x / 2);
      for (let truc = 0; truc < 3; truc++) {
        let a = (truc + 1) % 3, b = (truc + 2) % 3, na = chia(k.kt[a]), nb = chia(k.kt[b]);
        for (let i = 0; i <= na; i++) for (let j = 0; j <= nb; j++) for (let s of [-1, 1]) {
          let p = [0, 0, 0];
          p[truc] = s * h[truc]; p[a] = -h[a] + k.kt[a] * i / na; p[b] = -h[b] + k.kt[b] * j / nb;
          them(p);
        }
      }
    } else if (k.k == 'tru') {
      let bo = k.bo || 0, r = k.d / 2, n = Math.max(8, chia(PI * k.d)), nh = chia(k.h - 2 * bo), nr = chia(r - bo);
      let nb = bo ? Math.max(3, chia(PI / 2 * bo)) : 0;
      for (let i = 0; i < n; i++) {
        let c = Math.cos(2 * PI * i / n), s = Math.sin(2 * PI * i / n);
        for (let j = 0; j <= nh; j++) them([r * c, -(k.h / 2 - bo) + (k.h - 2 * bo) * j / nh, r * s]);
        for (let j = 0; j < nr; j++) for (let y of [-k.h / 2, k.h / 2]) them([(r - bo) * j / nr * c, y, (r - bo) * j / nr * s]);
        // cung bo mép
        if (bo) for (let j = 0; j <= nb; j++) for (let sy of [-1, 1]) {
          let g = PI / 2 * j / nb, rr = r - bo + bo * Math.cos(g);
          them([rr * c, sy * (k.h / 2 - bo + bo * Math.sin(g)), rr * s]);
        }
      }
    } else if (k.k == 'cau') {
      let r = k.d / 2, n = Math.max(6, chia(PI * r));
      for (let i = 0; i <= n; i++) {
        let th = PI * i / n, m = Math.max(1, Math.round(2 * n * Math.sin(th)));
        for (let j = 0; j < m; j++) them([r * Math.sin(th) * Math.cos(2 * PI * j / m), r * Math.cos(th), r * Math.sin(th) * Math.sin(2 * PI * j / m)]);
      }
    } else if (k.k == 'lang') {
      let da = k.da, nh = chia(k.h);
      for (let i = 0; i < da.length; i++) {
        let a = da[i], b = da[(i + 1) % da.length], n = chia(Math.hypot(b[0] - a[0], b[1] - a[1]));
        for (let t = 0; t < n; t++) for (let j = 0; j <= nh; j++) {
          them(uvw(k.truc, a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n, -k.h / 2 + k.h * j / nh));
        }
      }
      // hai mặt đáy: lưới điểm trong hộp bao, giữ điểm nằm trong đa giác
      let us = da.map((p) => p[0]), vs = da.map((p) => p[1]);
      let u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
      let nu = chia(u1 - u0), nv = chia(v1 - v0);
      for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
        let u = u0 + (u1 - u0) * i / nu, v = v0 + (v1 - v0) * j / nv;
        if (kcDaGiac(da, u, v) <= 0) for (let w of [-k.h / 2, k.h / 2]) them(uvw(k.truc, u, v, w));
      }
    }
    return ds;
  }

  // Khoảng cách từ điểm tới tam giác (cho phép kiểm tra chiều ngược: hitbox → lưới vẽ)
  function kcTamGiac(p, a, b, c) {
    let ab = V.tru(b, a), ac = V.tru(c, a), ap = V.tru(p, a);
    let d1 = V.cham(ab, ap), d2 = V.cham(ac, ap);
    if (d1 <= 0 && d2 <= 0) return V.dai(ap);
    let bp = V.tru(p, b), d3 = V.cham(ab, bp), d4 = V.cham(ac, bp);
    if (d3 >= 0 && d4 <= d3) return V.dai(bp);
    let vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) return V.dai(V.tru(ap, V.nhan(ab, d1 / (d1 - d3))));
    let cp = V.tru(p, c), d5 = V.cham(ab, cp), d6 = V.cham(ac, cp);
    if (d6 >= 0 && d5 <= d6) return V.dai(cp);
    let vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) return V.dai(V.tru(ap, V.nhan(ac, d2 / (d2 - d6))));
    let va = d3 * d6 - d5 * d4;
    if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
      let w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
      return V.dai(V.tru(p, V.cong(b, V.nhan(V.tru(c, b), w))));
    }
    let dn = 1 / (va + vb + vc), v = vb * dn, w = vc * dn;
    return V.dai(V.tru(ap, V.cong(V.nhan(ab, v), V.nhan(ac, w))));
  }

  return {
    V: V, Q: Q, M: M, Q_TRUC: Q_TRUC, RAD: RAD,
    chuanHoa: chuanHoa, dat: dat, uvw: uvw, veUvw: veUvw,
    hinhHoc: hinhHoc, khoiLuongTong: khoiLuongTong,
    kcKhoi: kcKhoi, kcNhom: kcNhom, kcDaGiac: kcDaGiac, diemTrenMat: diemTrenMat, kcTamGiac: kcTamGiac,
    dienTichDaGiac: dienTichDaGiac
  };
});
