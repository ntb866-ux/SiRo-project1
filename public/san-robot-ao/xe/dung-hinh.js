// Sân Robot Ảo – xe lắp mô-đun: dựng lưới 3D từ các khối đặc của linh kiện.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Lưới được sinh từ CÙNG bản mô tả khối dùng cho hitbox (linh-kien.js), nên hình nhìn
// thấy và hình va chạm trùng nhau. Phần làm đẹp (vát cạnh, nhãn, lưới, gai lốp, nan vành)
// chỉ lệch khỏi mặt khối dưới 1 mm; bộ kiểm tra scripts/xe/kiem-tra-hitbox.js đo lại điều đó.
// Mọi khối cùng vật liệu trong một vật thể được gộp thành một lưới để vẽ nhanh.
var SRAXeDungHinh = (function() {
  'use strict';
  const H = SRAHinhKhoi, V = H.V, Q = H.Q;
  const PI = Math.PI;

  // ---------- Vật liệu ----------
  // mau: màu khuếch tán; bong: [cường độ phản chiếu, độ gắt]; trong: độ trong suốt; phat: tự phát sáng
  const VAT_LIEU = {
    nhom: { mau: '#b9c0c7', bong: [0.75, 48] },
    thep: { mau: '#a9adb3', bong: [0.9, 96] },
    thep_ma: { mau: '#c9ccd1', bong: [0.9, 80] },
    bac: { mau: '#d7d9dc', bong: [1.0, 110] },
    dong: { mau: '#c9a24a', bong: [0.8, 64] },
    cao_su: { mau: '#1d1e21', bong: [0.08, 8] },
    nhua_vanh: { mau: '#f09c0d', bong: [0.35, 32] },
    nhua_vang: { mau: '#f2c318', bong: [0.3, 24] },
    nhua_den: { mau: '#26282c', bong: [0.3, 28] },
    nhua_xam: { mau: '#5d646d', bong: [0.3, 28] },
    nhua_xanh: { mau: '#1f6fb5', bong: [0.35, 32] },
    nhua_tim: { mau: '#6a4bb3', bong: [0.35, 32] },
    nhua_xanh_duong: { mau: '#2453b8', bong: [0.35, 32] },
    nhua_trang: { mau: '#f3f4f2', bong: [0.4, 36] },
    nhua_cam: { mau: '#f07a1a', bong: [0.35, 32] },
    nhua_o: { mau: '#ecebe6', bong: [0.4, 36] },
    nhua_trong: { mau: '#e9f1f4', bong: [0.6, 64], trong: 0.55 },
    nap_mach: { mau: '#2b3440', bong: [0.7, 72], trong: 0.82 },
    mach_in: { mau: '#17603a', bong: [0.3, 24] },
    mach_den: { mau: '#1b1d22', bong: [0.3, 24] },
    pin: { mau: '#2f7fd1', bong: [0.5, 48] },
    day_xam: { mau: '#8f959c', bong: [0.2, 16] },
    gom: { mau: '#e7dcc1', bong: [0.3, 24] },
    do: { mau: '#d43a2f', bong: [0.4, 36] },
    den_xanh: { mau: '#3ddc84', bong: [0.2, 16], phat: '#1f9d55' },
    led_hong_ngoai: { mau: '#7fb6ff', bong: [0.9, 96], trong: 0.85 },
    kinh_den: { mau: '#0c0c0e', bong: [1.0, 128] },
    lo: { mau: '#3a3f46', bong: [0.05, 8] },
    mach_xanh_la: { mau: '#1c7a4a', bong: [0.3, 24] },
    led_trang: { mau: '#fbfbf2', bong: [0.9, 96], phat: '#d8d8c8' },
    ni_muc: { mau: '#15171a', bong: [0.05, 8] }
  };

  function mau3(hex) { return BABYLON.Color3.FromHexString(hex); }
  // Sơn do người dùng chọn: tên vật liệu 'son:#rrggbb' (sơn tĩnh điện, bóng vừa)
  function laySon(ten) {
    let m = /^son:(#[0-9a-f]{6})$/i.exec(ten || '');
    return m ? { mau: m[1], bong: [0.45, 40] } : null;
  }
  function vatLieu(scene, ten) {
    let id = 'sraXe_' + ten;
    let m = scene.getMaterialByID(id);
    if (m) return m;
    let d = laySon(ten) || VAT_LIEU[ten] || VAT_LIEU.nhua_den;
    m = new BABYLON.StandardMaterial(id, scene);
    m.diffuseColor = mau3(d.mau);
    m.specularColor = new BABYLON.Color3(d.bong[0], d.bong[0], d.bong[0]);
    m.specularPower = d.bong[1];
    if (d.trong != null) m.alpha = d.trong;
    if (d.phat) m.emissiveColor = mau3(d.phat);
    return m;
  }

  // ---------- Bộ gom lưới ----------
  function Gom() {
    this.vt = []; this.ph = []; this.uv = []; this.cs = [];
  }
  // Thêm một mặt phẳng lồi (các đỉnh theo thứ tự quanh mặt), pháp tuyến n hướng ra ngoài
  Gom.prototype.mat = function(dinh, n, uv) {
    let goc = this.vt.length / 3;
    for (let i = 0; i < dinh.length; i++) {
      this.vt.push(dinh[i][0], dinh[i][1], dinh[i][2]);
      this.ph.push(n[0], n[1], n[2]);
      if (uv) this.uv.push(uv[i][0], uv[i][1]); else this.uv.push(0, 0);
    }
    // Chọn chiều tam giác sao cho mặt trước quay theo n (Babylon: hệ trục tay trái)
    let a = dinh[0], b = dinh[1], c = dinh[2];
    let thuan = V.cham(V.co(V.tru(b, a), V.tru(c, a)), n) < 0;
    for (let i = 1; i < dinh.length - 1; i++) {
      if (thuan) this.cs.push(goc, goc + i, goc + i + 1); else this.cs.push(goc, goc + i + 1, goc + i);
    }
  };
  // Mặt cong: đỉnh có pháp tuyến riêng (làm trơn)
  Gom.prototype.tu = function(p4, n4) {
    let goc = this.vt.length / 3;
    for (let i = 0; i < 4; i++) { this.vt.push(p4[i][0], p4[i][1], p4[i][2]); this.ph.push(n4[i][0], n4[i][1], n4[i][2]); this.uv.push(0, 0); }
    let nTb = V.donVi(V.cong(V.cong(n4[0], n4[1]), V.cong(n4[2], n4[3])));
    let thuan = V.cham(V.co(V.tru(p4[1], p4[0]), V.tru(p4[2], p4[0])), nTb) < 0;
    if (thuan) this.cs.push(goc, goc + 1, goc + 2, goc, goc + 2, goc + 3); else this.cs.push(goc, goc + 2, goc + 1, goc, goc + 3, goc + 2);
  };
  Gom.prototype.luoi = function(scene, ten, vl) {
    if (!this.cs.length) return null;
    let mesh = new BABYLON.Mesh(ten, scene);
    let vd = new BABYLON.VertexData();
    vd.positions = this.vt; vd.normals = this.ph; vd.uvs = this.uv; vd.indices = this.cs;
    vd.applyToMesh(mesh);
    mesh.material = vl;
    return mesh;
  };

  // Sắp các điểm đồng phẳng quanh tâm mặt để thành đa giác lồi
  function sapQuanhTam(dinh, n) {
    let tam = [0, 0, 0];
    dinh.forEach((p) => { tam = V.cong(tam, V.nhan(p, 1 / dinh.length)); });
    let ex = V.donVi(V.tru(dinh[0], tam)), ey = V.co(n, ex);
    return dinh.map((p) => ({ p: p, g: Math.atan2(V.cham(V.tru(p, tam), ey), V.cham(V.tru(p, tam), ex)) }))
      .sort((a, b) => a.g - b.g).map((x) => x.p);
  }

  // ---------- Lưới của từng loại khối (trong hệ riêng của khối) ----------
  function luoiHop(g, kt, vat, bien) {
    let a = kt[0] / 2, b = kt[1] / 2, c = kt[2] / 2, h = [a, b, c];
    let t = Math.max(0, Math.min(vat || 0, Math.min(a, b, c) * 0.45));
    let them = (ds, n) => g.mat(sapQuanhTam(ds.map(bien), bien.quay(n)), bien.quay(n));
    for (let i = 0; i < 3; i++) {
      let j = (i + 1) % 3, k = (i + 2) % 3;
      for (let s of [-1, 1]) {
        // mặt chính
        let ds = [];
        for (let sj of [-1, 1]) for (let sk of [-1, 1]) { let p = [0, 0, 0]; p[i] = s * h[i]; p[j] = sj * (h[j] - t); p[k] = sk * (h[k] - t); ds.push(p); }
        let n = [0, 0, 0]; n[i] = s; them(ds, n);
      }
      if (t > 0) {
        // 4 mặt vát dọc theo trục k (giữa mặt i và mặt j)
        for (let si of [-1, 1]) for (let sj of [-1, 1]) {
          let ds = [];
          for (let sk of [-1, 1]) {
            let p = [0, 0, 0]; p[i] = si * h[i]; p[j] = sj * (h[j] - t); p[k] = sk * (h[k] - t); ds.push(p);
            let q = [0, 0, 0]; q[i] = si * (h[i] - t); q[j] = sj * h[j]; q[k] = sk * (h[k] - t); ds.push(q);
          }
          let n = [0, 0, 0]; n[i] = si; n[j] = sj; them(ds, V.donVi(n));
        }
      }
    }
    if (t > 0) {
      for (let sx of [-1, 1]) for (let sy of [-1, 1]) for (let sz of [-1, 1]) {
        them([[sx * a, sy * (b - t), sz * (c - t)], [sx * (a - t), sy * b, sz * (c - t)], [sx * (a - t), sy * (b - t), sz * c]], V.donVi([sx, sy, sz]));
      }
    }
  }

  // Trụ trục y; vat: bo mép hai đầu (cm); nMat: số mặt quanh trục
  // rTrong: bán kính lõi rỗng (lốp): hai đầu thành hình vành khăn, có thành trong
  function luoiTru(g, d, h, bien, vat, nMat, rTrong) {
    let r = d / 2, n = nMat || Math.max(16, Math.min(40, Math.round(d * 14)));
    let t = Math.max(0, Math.min(vat || 0, r * 0.4, h * 0.4));
    let vong = (rr, y) => { let ds = []; for (let i = 0; i < n; i++) ds.push([rr * Math.cos(2 * PI * i / n), y, rr * Math.sin(2 * PI * i / n)]); return ds; };
    let duoi = vong(r, -h / 2 + t), tren = vong(r, h / 2 - t);
    for (let i = 0; i < n; i++) {
      let j = (i + 1) % n;
      let ni = [Math.cos(2 * PI * i / n), 0, Math.sin(2 * PI * i / n)], nj = [Math.cos(2 * PI * j / n), 0, Math.sin(2 * PI * j / n)];
      g.tu([duoi[i], duoi[j], tren[j], tren[i]].map(bien), [ni, nj, nj, ni].map(bien.quay));
    }
    for (let s of [-1, 1]) {
      let mep = s < 0 ? duoi : tren, nap = vong(r - t, s * h / 2);
      if (t > 0) for (let i = 0; i < n; i++) {
        let j = (i + 1) % n, gm = 2 * PI * (i + 0.5) / n;
        g.mat([mep[i], mep[j], nap[j], nap[i]].map(bien), bien.quay(V.donVi([Math.cos(gm), s, Math.sin(gm)])));
      }
      if (rTrong) {
        let trong = vong(rTrong, s * h / 2), sau = vong(rTrong, s * (h / 2 - 0.2));
        for (let i = 0; i < n; i++) {
          let j = (i + 1) % n, gi = 2 * PI * i / n, gj = 2 * PI * j / n;
          g.mat([nap[i], nap[j], trong[j], trong[i]].map(bien), bien.quay([0, s, 0]));
          g.tu([trong[i], trong[j], sau[j], sau[i]].map(bien), [[-Math.cos(gi), 0, -Math.sin(gi)], [-Math.cos(gj), 0, -Math.sin(gj)], [-Math.cos(gj), 0, -Math.sin(gj)], [-Math.cos(gi), 0, -Math.sin(gi)]].map(bien.quay));
        }
      } else g.mat(nap.map(bien), bien.quay([0, s, 0]));
    }
  }

  // Lốp mặt cắt tròn, trục y: mặt tròn xoay của biên dạng "mặt phẳng hẹp ở giữa + hai cung bo mép",
  // chỉ lấy phần nằm ngoài vành (bán kính > rTrong), thêm gờ lốp ôm mép vành.
  function luoiLop(g, d, h, bo, rTrong, bien, nMat) {
    let R = d / 2, n = nMat || 48, hp = h / 2 - bo, bd = [];      // bd: [toạ độ dọc trục, bán kính, pháp tuyến dọc trục, pháp tuyến hướng kính]
    let gMax = Math.acos(Math.max(-1, Math.min(1, (rTrong - (R - bo)) / bo)));
    let nc = 10;
    for (let i = 0; i <= nc; i++) { let a = gMax * (1 - i / nc); bd.push([-(hp + bo * Math.sin(a)), R - bo + bo * Math.cos(a), -Math.sin(a), Math.cos(a)]); }
    for (let i = 0; i <= nc; i++) { let a = gMax * i / nc; bd.push([hp + bo * Math.sin(a), R - bo + bo * Math.cos(a), Math.sin(a), Math.cos(a)]); }
    let diem = (b, i) => { let t = 2 * PI * i / n; return [b[1] * Math.cos(t), b[0], b[1] * Math.sin(t)]; };
    let phap = (b, i) => { let t = 2 * PI * i / n; return [b[3] * Math.cos(t), b[2], b[3] * Math.sin(t)]; };
    for (let j = 0; j < bd.length - 1; j++) for (let i = 0; i < n; i++) {
      g.tu([diem(bd[j], i), diem(bd[j], i + 1), diem(bd[j + 1], i + 1), diem(bd[j + 1], i)].map(bien),
        [phap(bd[j], i), phap(bd[j], i + 1), phap(bd[j + 1], i + 1), phap(bd[j + 1], i)].map(bien.quay));
    }
    // gờ lốp: vành khăn nhỏ nối chân lốp với mặt bên của vành
    for (let s of [-1, 1]) {
      let chan = s < 0 ? bd[0] : bd[bd.length - 1];
      for (let i = 0; i < n; i++) {
        let t0 = 2 * PI * i / n, t1 = 2 * PI * (i + 1) / n, r0 = chan[1], r1 = rTrong - 0.12;
        g.mat([[r0 * Math.cos(t0), chan[0], r0 * Math.sin(t0)], [r0 * Math.cos(t1), chan[0], r0 * Math.sin(t1)], [r1 * Math.cos(t1), chan[0], r1 * Math.sin(t1)], [r1 * Math.cos(t0), chan[0], r1 * Math.sin(t0)]].map(bien), bien.quay([0, s, 0]));
      }
    }
  }

  function luoiCau(g, d, bien) {
    let r = d / 2, nv = 12, nk = 20;
    let p = (i, j) => { let th = PI * i / nv, ph = 2 * PI * j / nk; return [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; };
    for (let i = 0; i < nv; i++) for (let j = 0; j < nk; j++) {
      let n4 = [p(i, j), p(i, j + 1), p(i + 1, j + 1), p(i + 1, j)];
      if (i == 0) { g.mat([n4[0], n4[2], n4[3]].map((x) => bien(V.nhan(x, r))), bien.quay(V.donVi(V.cong(n4[0], V.cong(n4[2], n4[3]))))); continue; }
      if (i == nv - 1) { g.mat([n4[0], n4[1], n4[2]].map((x) => bien(V.nhan(x, r))), bien.quay(V.donVi(V.cong(n4[0], V.cong(n4[1], n4[2]))))); continue; }
      g.tu(n4.map((x) => bien(V.nhan(x, r))), n4.map(bien.quay));
    }
  }

  function luoiLangTru(g, k, bien) {
    let da = k.da, n = da.length;
    for (let s of [-1, 1]) g.mat(da.map((p) => bien(H.uvw(k.truc, p[0], p[1], s * k.h / 2))), bien.quay(H.uvw(k.truc, 0, 0, s)));
    for (let i = 0; i < n; i++) {
      let a = da[i], b = da[(i + 1) % n];
      let nn = V.donVi(H.uvw(k.truc, b[1] - a[1], -(b[0] - a[0]), 0));
      g.mat([H.uvw(k.truc, a[0], a[1], -k.h / 2), H.uvw(k.truc, b[0], b[1], -k.h / 2), H.uvw(k.truc, b[0], b[1], k.h / 2), H.uvw(k.truc, a[0], a[1], k.h / 2)].map(bien), bien.quay(nn));
    }
  }

  // Phép đổi từ hệ riêng của khối sang hệ chứa nó (và chỉ quay cho pháp tuyến)
  function phepBien(k, goc) {
    let f = (p) => V.tru(V.cong(k.vt, Q.quay(k.q, p)), goc || [0, 0, 0]);
    f.quay = (n) => Q.quay(k.q, n);
    return f;
  }

  function themKhoi(g, k, goc) {
    let bien = phepBien(k, goc);
    if (k.k == 'hop') luoiHop(g, k.kt, k.vat, bien);
    else if (k.k == 'tru') luoiTru(g, k.d, k.h, bien, k.vat == null ? 0.04 : k.vat);
    else if (k.k == 'cau') luoiCau(g, k.d, bien);
    else if (k.k == 'lang') luoiLangTru(g, k, bien);
  }

  // ---------- Hoạ tiết ----------
  const CAO = 0.012;   // nhãn nổi trên mặt khối 0,12 mm để không nhấp nháy

  function khungNhan(tt) {
    let n = V.donVi(tt.phap), len = tt.len ? V.donVi(tt.len) : (Math.abs(n[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0]);
    len = V.donVi(V.tru(len, V.nhan(n, V.cham(len, n))));
    return { n: n, len: len, ngang: V.co(len, n) };
  }

  function veHoaTiet(ctx, S, tt) {
    ctx.clearRect(0, 0, S, S);
    let chuGiua = (chu, co, mau, y) => { ctx.fillStyle = mau; ctx.font = 'bold ' + co + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(chu, S / 2, y == null ? S / 2 : y); };
    if (tt.ve == 'mieng_rj25') {
      ctx.fillStyle = '#17181b'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#0a0a0b'; ctx.fillRect(S * 0.3, 0, S * 0.4, S * 0.22);          // rãnh khoá
      ctx.fillStyle = '#d6b24a';
      for (let i = 0; i < 6; i++) ctx.fillRect(S * (0.2 + i * 0.11), S * 0.62, S * 0.05, S * 0.38);   // 6 tiếp điểm
    } else if (tt.ve == 'so') {
      ctx.fillStyle = '#1b1d22'; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.46, 0, 2 * PI); ctx.fill();
      chuGiua(tt.chu, S * 0.62, '#ffffff', S * 0.54);
    } else if (tt.ve == 'nhan_motor') {
      ctx.fillStyle = '#f6f2e2'; ctx.fillRect(0, 0, S, S);
      chuGiua('TT 1:48', S * 0.24, '#222', S * 0.36); chuGiua('6 V DC', S * 0.2, '#444', S * 0.68);
    } else if (tt.ve == 'nhan_mach') {
      ctx.fillStyle = 'rgba(240,156,13,0.95)'; ctx.fillRect(0, 0, S, S);
      chuGiua('SÂN ROBOT ẢO', S * 0.13, '#1b1d22', S * 0.38); chuGiua('MẠCH CHỦ · 8 CỔNG RJ25', S * 0.07, '#1b1d22', S * 0.66);
    } else if (tt.ve == 'luoi_sieu_am') {
      ctx.fillStyle = '#9aa0a6'; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.5, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = '#23262b'; ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.43, 0, 2 * PI); ctx.fill();
      ctx.strokeStyle = '#8b9096'; ctx.lineWidth = S * 0.018;
      for (let i = -8; i <= 8; i++) {
        let x = S / 2 + i * S * 0.055, hgt = Math.sqrt(Math.max(0, 0.43 * 0.43 - Math.pow(i * 0.055, 2))) * S;
        ctx.beginPath(); ctx.moveTo(x, S / 2 - hgt); ctx.lineTo(x, S / 2 + hgt); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(S / 2 - hgt, x); ctx.lineTo(S / 2 + hgt, x); ctx.stroke();
      }
    } else if (tt.ve == 'chu') {
      chuGiua(tt.chu, S * 0.42, tt.mauChu || '#ffffff');
    } else if (tt.ve == 'nhan_gyro') {
      ctx.fillStyle = '#efeaff'; ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = '#4a2f8f'; ctx.lineWidth = S * 0.05;
      ctx.beginPath(); ctx.arc(S / 2, S * 0.48, S * 0.24, PI * 0.15, PI * 1.75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(S * 0.66, S * 0.2); ctx.lineTo(S * 0.75, S * 0.36); ctx.lineTo(S * 0.57, S * 0.36); ctx.closePath(); ctx.fillStyle = '#4a2f8f'; ctx.fill();
      chuGiua('GYRO', S * 0.16, '#4a2f8f', S * 0.86);
    } else if (tt.ve == 'antenna') {
      ctx.fillStyle = '#e7dcc1'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#c9ccd1'; ctx.fillRect(S * 0.14, S * 0.14, S * 0.72, S * 0.72);
      ctx.fillStyle = '#8b8f95'; ctx.beginPath(); ctx.arc(S * 0.62, S * 0.5, S * 0.05, 0, 2 * PI); ctx.fill();
    }
  }

  function vatLieuNhan(scene, tt) {
    let id = 'sraXeNhan_' + tt.ve + '_' + (tt.chu || '');
    let m = scene.getMaterialByID(id);
    if (m) return m;
    let S = 128;
    let tex = new BABYLON.DynamicTexture(id, { width: S, height: S }, scene, true);
    tex.hasAlpha = true;
    veHoaTiet(tex.getContext(), S, tt);
    tex.update(true);
    m = new BABYLON.StandardMaterial(id, scene);
    m.diffuseTexture = tex; m.useAlphaFromDiffuseTexture = true;
    m.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    m.zOffset = -2;
    return m;
  }

  // Thêm hoạ tiết vào các bộ gom (theo khoá vật liệu); goc: điểm gốc của vật thể chứa nó
  function themTrangTri(nhom, scene, tt, goc) {
    let lay = function(khoa, vl) { if (!nhom[khoa]) nhom[khoa] = { g: new Gom(), vl: vl, nhan: true }; return nhom[khoa].g; };
    let dich = (p) => V.tru(p, goc || [0, 0, 0]);
    if (tt.k == 'nhan') {
      let kh = khungNhan(tt), w = tt.kt[0] / 2, h = tt.kt[1] / 2;
      let tam = V.cong(tt.vt, V.nhan(kh.n, CAO));
      let goc4 = [[-w, -h], [w, -h], [w, h], [-w, h]];
      let g = lay('nhan:' + tt.ve + ':' + (tt.chu || ''), vatLieuNhan(scene, tt));
      if (tt.tron) {
        let ds = [], uv = [];
        for (let i = 0; i < 24; i++) { let c = Math.cos(2 * PI * i / 24), s = Math.sin(2 * PI * i / 24); ds.push(dich(V.cong(tam, V.cong(V.nhan(kh.ngang, c * w), V.nhan(kh.len, s * h))))); uv.push([0.5 - c / 2, 0.5 + s / 2]); }
        g.mat(ds, kh.n, uv);
      } else {
        g.mat(goc4.map((c) => dich(V.cong(tam, V.cong(V.nhan(kh.ngang, c[0]), V.nhan(kh.len, c[1]))))), kh.n, [[1, 0], [0, 0], [0, 1], [1, 1]]);     // u đảo chiều: Babylon dùng hệ trục tay trái, không đảo thì chữ bị lộn ngược gương
      }
    } else if (tt.k == 'dia') {
      let kh = khungNhan(tt), r = tt.d / 2, ds = [];
      let tam = V.cong(tt.vt, V.nhan(kh.n, CAO));
      for (let i = 0; i < 16; i++) ds.push(dich(V.cong(tam, V.cong(V.nhan(kh.ngang, r * Math.cos(2 * PI * i / 16)), V.nhan(kh.len, r * Math.sin(2 * PI * i / 16))))));
      lay('vl:' + tt.vl, vatLieu(scene, tt.vl)).mat(ds, kh.n);
    } else if (tt.k == 'luoiLo') {
      let kh = khungNhan(tt), g = lay('vl:lo', vatLieu(scene, 'lo'));
      let nx = Math.floor(tt.kt[0] / tt.buoc), nz = Math.floor(tt.kt[1] / tt.buoc);
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
        let tam = V.cong(tt.vt, V.cong(V.nhan(kh.n, CAO), V.cong(V.nhan(kh.ngang, (i - nx / 2) * tt.buoc), V.nhan(kh.len, (j - nz / 2) * tt.buoc))));
        let ds = [];
        for (let a = 0; a < 10; a++) ds.push(dich(V.cong(tam, V.cong(V.nhan(kh.ngang, tt.d / 2 * Math.cos(2 * PI * a / 10)), V.nhan(kh.len, tt.d / 2 * Math.sin(2 * PI * a / 10))))));
        g.mat(ds, kh.n);
      }
    } else if (tt.k == 'dai') {
      // dây dẹt: quét mặt cắt chữ nhật dọc theo các khung
      let g = lay('khoi:' + tt.vl, vatLieu(scene, tt.vl)), w = tt.rong / 2, t = tt.day / 2, K = tt.khung;
      let gocMat = (f) => [[-w, -t], [w, -t], [w, t], [-w, t]].map((c) => dich(V.cong(f.p, V.cong(V.nhan(f.n, c[0]), V.nhan(f.b, c[1])))));
      for (let i = 0; i < K.length - 1; i++) {
        let A = gocMat(K[i]), B = gocMat(K[i + 1]);
        let nA = [V.nhan(K[i].b, -1), K[i].n, K[i].b, V.nhan(K[i].n, -1)], nB = [V.nhan(K[i + 1].b, -1), K[i + 1].n, K[i + 1].b, V.nhan(K[i + 1].n, -1)];
        for (let e = 0; e < 4; e++) { let f = (e + 1) % 4; g.tu([A[e], A[f], B[f], B[e]], [nA[e], nA[e], nB[e], nB[e]]); }
      }
      nhom['khoi:' + tt.vl].nhan = false;
    } else if (tt.k == 'vanhNan') {
      // nan hoa và moay-ơ nổi 0,6 mm trên mặt vành (vành thụt vào 0,8 mm so với mặt lốp)
      let g = lay('khoi:nhua_vanh2', vatLieu(scene, 'nhua_den')); nhom['khoi:nhua_vanh2'].nhan = false;
      let x0 = tt.x, s = tt.ben, day = 0.06;
      let moay = H.chuanHoa({ k: 'tru', d: 1.5, h: day, truc: 'x', vt: [x0 + s * day / 2, 0, 0] });
      luoiTru(g, moay.d, moay.h, phepBien(moay, goc), 0.02, 20);
      for (let i = 0; i < 5; i++) {
        let nan = H.chuanHoa({ k: 'hop', kt: [day, 0.5, 1.75], vt: [x0 + s * day / 2, 0, 0], xoay: [0, 0, 0] });
        let q = Q.truc([1, 0, 0], 72 * i);
        nan.vt = V.cong([x0 + s * day / 2, 0, 0], Q.quay(q, [0, 0, 1.6])); nan.q = q;
        luoiHop(g, nan.kt, 0.02, phepBien(nan, goc));
      }
      let vien = lay('khoi:thep', vatLieu(scene, 'thep')); nhom['khoi:thep'].nhan = false;
      let dau = H.chuanHoa({ k: 'tru', d: 0.5, h: 0.03, truc: 'x', vt: [x0 + s * (day + 0.015), 0, 0] });
      luoiTru(vien, dau.d, dau.h, phepBien(dau, goc), 0, 12);
    } else if (tt.k == 'gaiLop') {
      // gai lốp: các gờ cao su nổi 0,4 mm, xếp chữ V theo biên dạng lốp (lốp bo tròn thì gờ nằm trên cung bo)
      let g = lay('khoi:cao_su2', vatLieu(scene, 'cao_su')); nhom['khoi:cao_su2'].nhan = false;
      let n = 36, r = tt.d / 2, bo = tt.bo || 0, hp = tt.rong / 2 - bo;
      // các làn gai: góc a trên cung bo (0 = giữa mặt lốp), mỗi bên 2 làn
      let lan = bo ? [[-52, -1], [-22, -1], [22, 1], [52, 1]] : [[0, -1], [0, 1]];
      for (let i = 0; i < n; i++) {
        let q = Q.truc([1, 0, 0], 360 / n * i);
        for (let l of lan) {
          let a = l[0] * PI / 180, s = l[1];
          let x = bo ? s * hp + bo * Math.sin(a) : s * tt.rong * 0.24;
          let rr = bo ? r - bo + bo * Math.cos(a) : r;
          // hộp gai: dài theo bề ngang lốp, nghiêng theo cung, lệch nhau giữa hai bên thành hình chữ V
          let qNghieng = Q.nhan(q, Q.truc([0, 0, 1], -l[0]));
          let gai = { kt: [bo ? 0.3 : tt.rong * 0.42, 0.05, 0.3], vt: Q.quay(q, [x, rr - 0.005, s * 0.14 + (Math.abs(l[0]) > 40 ? s * 0.12 : 0)]), q: qNghieng };
          luoiHop(g, gai.kt, 0, phepBien(gai, goc));
        }
      }
    }
  }

  // ---------- Dựng một vật thể ----------
  // ds: [{ khoi: [khối đã chuẩn hoá], trangTri: [] }], goc: điểm gốc (trọng tâm) của vật thể,
  // cha: nút mà các lưới gắn vào. Trả về danh sách lưới.
  function dungVat(scene, ten, ds, goc, cha, tuyChon) {
    let nhom = {}, o = tuyChon || {};
    for (let ct of ds) {
      for (let k of ct.khoi) {
        if (k.an) continue;        // khối chỉ có hitbox, phần nhìn do hoạ tiết đảm nhận (dây quét trơn)
        let khoa = 'khoi:' + k.vl;
        if (!nhom[khoa]) nhom[khoa] = { g: new Gom(), vl: vatLieu(scene, k.vl) };
        if (k.kieu == 'lop' && k.bo) luoiLop(nhom[khoa].g, k.d, k.h, k.bo, k.dTrong / 2, phepBien(k, goc), 56);
        else if (k.kieu == 'lop') luoiTru(nhom[khoa].g, k.d, k.h, phepBien(k, goc), 0.09, 48, k.dTrong / 2);
        else themKhoi(nhom[khoa].g, k, goc);
      }
      for (let tt of (ct.trangTri || [])) themTrangTri(nhom, scene, tt, goc);
    }
    let kq = [];
    for (let khoa in nhom) {
      let mesh = nhom[khoa].g.luoi(scene, ten + '_' + khoa.replace(/[^a-zA-Z0-9_]/g, '_'), nhom[khoa].vl);
      if (!mesh) continue;
      mesh.parent = cha;
      mesh.sraXe = true;
      mesh.sraNhan = !!nhom[khoa].nhan;
      if (nhom[khoa].vl.alpha < 1 || mesh.sraNhan) mesh.receiveShadows = false; else mesh.receiveShadows = !!o.nhanBong;
      if (!mesh.sraNhan && scene.shadowGenerator && o.doBong !== false) scene.shadowGenerator.addShadowCaster(mesh);
      kq.push(mesh);
    }
    return kq;
  }

  // Khung dây hitbox để xem (nút "Hiện hitbox")
  function dungKhungHitbox(scene, ten, dsKhoi, goc, cha) {
    let g = new Gom();
    for (let k of dsKhoi) { if (!k.trong) themKhoi(g, Object.assign({}, k, { vat: 0 }), goc); }
    let vl = scene.getMaterialByID('sraXe_hitbox');
    if (!vl) {
      vl = new BABYLON.StandardMaterial('sraXe_hitbox', scene);
      vl.wireframe = true; vl.emissiveColor = new BABYLON.Color3(0.1, 1, 0.3); vl.disableLighting = true;
    }
    let mesh = g.luoi(scene, ten + '_hitbox', vl);
    if (!mesh) return null;
    mesh.parent = cha; mesh.isPickable = false; mesh.sraXe = true; mesh.sraHitbox = true;
    mesh.setEnabled(false);
    return mesh;
  }

  return { VAT_LIEU: VAT_LIEU, laySon: laySon, vatLieu: vatLieu, dungVat: dungVat, dungKhungHitbox: dungKhungHitbox, Gom: Gom, themKhoi: themKhoi };
})();
