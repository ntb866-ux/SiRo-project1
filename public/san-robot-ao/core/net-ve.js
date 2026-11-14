// Sân Robot Ảo – bút vẽ: ghi lại nét vẽ của robot, vẽ hình mẫu lên sân và chấm
// "vẽ giống hình mẫu" (gói G8).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Tệp bài khai báo hình mẫu trong trường `hinhMau`:
//
//   "hinhMau": {
//     "tamGiac": {
//       "batDau": { "x": -37.5, "y": -40, "goc": 0 },     // bỏ trống = viTriBatDau
//       "buoc": [ ["lap", 3, [ ["di", 75], ["phai", 120] ]] ]
//     }
//   }
//
// `buoc` là đường đi của một "robot mẫu": ["di", cm], ["lui", cm], ["phai", độ],
// ["trai", độ], ["nhac"] (nhấc bút), ["ha"] (hạ bút), ["lap", n, [...]].
// Hoặc cho thẳng tọa độ: "net": [ [[x, y], [x, y], ...], ... ] (mỗi nét một mảng điểm).
// Tùy chọn vẽ: "mau" (mã #rrggbb, mặc định xám), "day" (bề rộng nét, cm), "an": true.
//
// Điều kiện chấm `veGiongMau` (dùng trong mucTieu hoặc sao):
//   { "loai": "veGiongMau", "mau": "tamGiac", "saiSo": 4, "phu": 90, "chinhXac": 90 }
// So nét vẽ với hình mẫu theo hai chiều:
//   - độ phủ: bao nhiêu % chiều dài hình mẫu có nét vẽ đi qua (cách không quá saiSo cm),
//   - độ chính xác: bao nhiêu % chiều dài nét vẽ nằm sát hình mẫu (cách không quá saiSo cm).
// Cần cả hai: chỉ đòi độ phủ thì tô kín cả sân cũng đạt, chỉ đòi chính xác thì vẽ một
// đoạn ngắn đúng chỗ cũng đạt.

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.netVe = new function() {
  let self = this;
  const BUOC_GHI = 0.5;     // cm: ghi một điểm mới khi đầu bút đi được chừng này
  const BUOC_SO = 1;        // cm: khoảng cách giữa các điểm lấy mẫu khi so sánh

  // ---------- Hình mẫu ----------

  // Chạy "robot mẫu" theo danh sách bước, trả về các nét (mảng điểm [x, y])
  this.netTuBuoc = function(buoc, batDau) {
    let x = batDau.x || 0, y = batDau.y || 0, goc = batDau.goc || 0;
    let ha = true;
    let net = [[[x, y]]];
    function chay(ds) {
      for (let b of ds) {
        let lenh = b[0];
        if (lenh == 'lap') {
          for (let i = 0; i < b[1]; i++) chay(b[2]);
        } else if (lenh == 'di' || lenh == 'lui') {
          let d = (lenh == 'lui' ? -1 : 1) * b[1];
          let r = goc * Math.PI / 180;
          x += d * Math.sin(r);
          y += d * Math.cos(r);
          if (ha) net[net.length - 1].push([x, y]);
        } else if (lenh == 'phai') {
          goc += b[1];
        } else if (lenh == 'trai') {
          goc -= b[1];
        } else if (lenh == 'nhac') {
          ha = false;
        } else if (lenh == 'ha') {
          if (!ha) net.push([[x, y]]);
          ha = true;
        }
      }
    }
    chay(buoc || []);
    return net.filter(n => n.length > 1);
  };

  // Các nét của một hình mẫu trong bài (đã tính sẵn và lưu lại)
  this.netMau = function(bai, ten) {
    let m = (bai.hinhMau || {})[ten];
    if (!m) return null;
    if (!m._net) {
      m._net = m.net || self.netTuBuoc(m.buoc, m.batDau || bai.viTriBatDau || {});
    }
    return m._net;
  };

  // Vật thể GEARS (tấm mỏng không có vật lí) để vẽ hình mẫu lên mặt sân
  this.vatTheMau = function(bai) {
    let ds = [];
    for (let ten in (bai.hinhMau || {})) {
      let m = bai.hinhMau[ten];
      if (m.an) continue;
      let mau = (m.mau || '#9aa3ae').replace('#', '');
      if (mau.length == 6) mau += 'cc';
      let day = m.day || 2;
      for (let net of self.netMau(bai, ten)) {
        for (let i = 1; i < net.length; i++) {
          let [x1, y1] = net[i - 1], [x2, y2] = net[i];
          let dai = Math.hypot(x2 - x1, y2 - y1);
          if (dai < 0.01) continue;
          ds.push({
            type: 'box',
            // dài thêm một bề rộng nét để hai đoạn liền nhau khít ở góc
            position: [(x1 + x2) / 2, (y1 + y2) / 2, 0.08],
            size: [dai + day, day, 0.06],
            rotationMode: 'degrees',
            rotation: [0, -Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, 0],
            color: mau,
            physicsOptions: false,
            castShadows: false,
            receiveShadows: false
          });
        }
      }
    }
    return ds;
  };

  // ---------- Ghi nét vẽ trong lúc chạy ----------

  function timBut() {
    if (typeof robot == 'undefined' || !robot.getComponentByPort) return null;
    for (let i = 1; i <= 10; i++) {
      let c = robot.getComponentByPort('in' + i);
      if (c && c.type == 'Pen') return c;
    }
    return null;
  }

  this.batDauGhi = function() {
    self.cacNet = [];
    self.dangVe = false;
    self.but = timBut();
  };

  this.ghi = function() {
    let but = self.but;
    if (!but || !but.tip) return;
    if (!but.isDown) {
      self.dangVe = false;
      return;
    }
    let p = but.tip.getAbsolutePosition();
    let diem = [p.x, p.z];
    if (!self.dangVe) {
      self.cacNet.push([diem]);
      self.dangVe = true;
      return;
    }
    let net = self.cacNet[self.cacNet.length - 1];
    let cuoi = net[net.length - 1];
    if (Math.hypot(diem[0] - cuoi[0], diem[1] - cuoi[1]) >= BUOC_GHI) net.push(diem);
  };

  // ---------- So sánh hai bộ nét ----------

  function doDai(cacNet) {
    let t = 0;
    for (let n of cacNet) for (let i = 1; i < n.length; i++) t += Math.hypot(n[i][0] - n[i - 1][0], n[i][1] - n[i - 1][1]);
    return t;
  }

  // Lấy điểm đều nhau mỗi `buoc` cm dọc theo các nét
  function layMau(cacNet, buoc) {
    let ds = [];
    for (let n of cacNet) {
      if (n.length == 1) { ds.push(n[0]); continue; }
      let du = 0;
      ds.push(n[0]);
      for (let i = 1; i < n.length; i++) {
        let [x1, y1] = n[i - 1], [x2, y2] = n[i];
        let d = Math.hypot(x2 - x1, y2 - y1);
        let s = buoc - du;
        while (s <= d) {
          ds.push([x1 + (x2 - x1) * s / d, y1 + (y2 - y1) * s / d]);
          s += buoc;
        }
        du = d - (s - buoc);
      }
    }
    return ds;
  }

  function cacDoan(cacNet) {
    let ds = [];
    for (let n of cacNet) {
      if (n.length == 1) ds.push([n[0], n[0]]);
      for (let i = 1; i < n.length; i++) ds.push([n[i - 1], n[i]]);
    }
    return ds;
  }

  // Khoảng cách từ điểm p đến đoạn thẳng ab
  function kcDoan(p, a, b) {
    let dx = b[0] - a[0], dy = b[1] - a[1];
    let l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }

  function kcGanNhat(p, doan) {
    let m = Infinity;
    for (let d of doan) {
      let k = kcDoan(p, d[0], d[1]);
      if (k < m) m = k;
    }
    return m;
  }

  // Trả về { phu, chinhXac (phần trăm), lechTB, lechMax (cm), daiVe, daiMau (cm) }
  this.soSanh = function(netMau, netVe, saiSo) {
    let kq = { phu: 0, chinhXac: 0, lechTB: null, lechMax: null, daiVe: doDai(netVe), daiMau: doDai(netMau) };
    if (!netVe.length) return kq;
    let doanVe = cacDoan(netVe), doanMau = cacDoan(netMau);
    let diemMau = layMau(netMau, BUOC_SO);
    let diemVe = layMau(netVe, BUOC_SO);
    let phu = 0;
    for (let p of diemMau) if (kcGanNhat(p, doanVe) <= saiSo) phu++;
    let dung = 0, tong = 0, max = 0;
    for (let p of diemVe) {
      let k = kcGanNhat(p, doanMau);
      if (k <= saiSo) dung++;
      tong += k;
      if (k > max) max = k;
    }
    kq.phu = 100 * phu / diemMau.length;
    kq.chinhXac = 100 * dung / diemVe.length;
    kq.lechTB = tong / diemVe.length;
    kq.lechMax = max;
    return kq;
  };
};

// ---------------------------------------------------------------------------
// Luật chấm "vẽ giống hình mẫu"
// ---------------------------------------------------------------------------
SRA.luat.veGiongMau = {
  moTa: function(dk) {
    return 'Nét vẽ trùng hình mẫu (lệch không quá ' + (dk.saiSo || 4) + ' cm)';
  },
  kiemTra: function(dk, ctx) {
    let saiSo = dk.saiSo || 4;
    let canPhu = dk.phu || 90;
    let canChinhXac = dk.chinhXac || 90;
    let netMau = SRA.netVe.netMau(SRA.bai, dk.mau);
    if (!netMau) return { dat: false, lyDo: 'Bài chưa khai báo hình mẫu "' + dk.mau + '".' };
    let netVe = ctx.netVe || [];
    if (!netVe.length) {
      return { dat: false, lyDo: 'Robot chưa vẽ gì cả. Bạn đã dùng khối "hạ bút" chưa?' };
    }
    let k = SRA.netVe.soSanh(netMau, netVe, saiSo);
    ctx.soSanhNet = ctx.soSanhNet || {};
    ctx.soSanhNet[dk.mau + '@' + saiSo] = k;
    let phu = Math.floor(k.phu), cx = Math.floor(k.chinhXac);
    let datPhu = k.phu >= canPhu, datCx = k.chinhXac >= canChinhXac;
    let lyDo;
    if (datPhu && datCx) {
      lyDo = 'Nét vẽ phủ ' + phu + '% hình mẫu, ' + cx + '% nét vẽ nằm sát hình mẫu (lệch trung bình ' +
        k.lechTB.toFixed(1).replace('.', ',') + ' cm).';
    } else if (!datPhu && datCx) {
      lyDo = 'Nét vẽ mới phủ ' + phu + '% hình mẫu (cần ' + canPhu + '%): robot vẽ được ' + Math.round(k.daiVe) +
        ' cm, hình mẫu dài ' + Math.round(k.daiMau) + ' cm. Còn thiếu cạnh nào?';
    } else if (!datPhu) {
      lyDo = 'Nét vẽ mới phủ ' + phu + '% hình mẫu (cần ' + canPhu + '%), ' + (100 - cx) +
        '% nét vẽ lệch ra ngoài hình mẫu quá ' + saiSo + ' cm. Kiểm tra lại số đo góc quay và độ dài cạnh.';
    } else {
      lyDo = 'Có ' + (100 - cx) + '% nét vẽ lệch ra ngoài hình mẫu quá ' + saiSo + ' cm (chỉ được tối đa ' +
        (100 - canChinhXac) + '%). Robot vẽ thừa hay vẽ lệch ở đâu?';
    }
    return { dat: datPhu && datCx, lyDo: lyDo };
  }
};

// ---------------------------------------------------------------------------
// Gắn vào khung thử thách: vẽ hình mẫu khi dựng sân, ghi nét trong lúc chạy,
// đưa nét vẽ vào dữ liệu lượt chạy (ctx.netVe) trước khi chấm.
// ---------------------------------------------------------------------------
(function() {
  let dungGoc = SRA.dungOptionsSan;
  SRA.dungOptionsSan = function(san, bai) {
    let o = dungGoc.apply(this, arguments);
    o.objects = SRA.netVe.vatTheMau(bai).concat(o.objects);
    return o;
  };

  let w = SRA.world;
  let startGoc = w.startSim;
  w.startSim = function() {
    SRA.netVe.batDauGhi();
    return startGoc.apply(this, arguments);
  };
  let renderGoc = w.render;
  w.render = function(delta) {
    if (w.trangThai == 'dang-chay') SRA.netVe.ghi();
    return renderGoc.apply(this, arguments);
  };

  let chamGoc = SRA.chamDiem;
  SRA.chamDiem = function(ctx) {
    ctx.netVe = SRA.netVe.cacNet || [];
    return chamGoc.apply(this, arguments);
  };
})();
