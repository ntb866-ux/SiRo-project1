// Sân Robot Ảo – số đo cảm biến màu theo thời gian thực và luật chấm cho bài dò đường (gói G7).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// 1. Dòng số đo cho bảng số đo chung (so-do.js): độ sáng phản xạ và màu của từng cảm biến.
//    Bài bật bằng "soDo": ["doSangGiua", "mauGiua", ...]. Các mã dòng:
//      doSangGiua, doSangTrai, doSangPhai  độ sáng phản xạ 0–100
//      mauGiua, mauTrai, mauPhai           màu cảm biến nhận ra
// 2. Biểu đồ độ sáng phản xạ 10 giây gần nhất, có đường ngưỡng. Hiện khi bài bật
//    dòng doSang… nào đó. Ngưỡng lấy từ trường "nguong" của bài (mặc định 50).
// 3. Luật chấm dungCamBien: chương trình dùng ít nhất `toiThieu` cảm biến màu khác nhau.

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.camBienMau = new function() {
  let self = this;
  const VI_TRI = [['Giua', 'GIUA', 'giữa'], ['Trai', 'TRAI', 'trái'], ['Phai', 'PHAI', 'phải']];
  const MAU_NET = { GIUA: '#111827', TRAI: '#2563eb', PHAI: '#ea580c' };
  const TEN_MAU = ['không rõ', 'đen', 'xanh dương', 'xanh lá', 'vàng', 'đỏ', 'trắng', 'nâu'];
  const GIAY = 10;              // độ dài biểu đồ (giây)
  const CHU_KI = 50;            // lấy mẫu mỗi 50 ms

  // Cảm biến màu ở vị trí giữa/trái/phải của robot đang dùng (hoặc null)
  this.camBien = function(viTri) {
    if (typeof sanRobotAo == 'undefined' || typeof robot == 'undefined' || !robot.getComponentByPort) return null;
    let cong = sanRobotAo.congCamBienMau ? sanRobotAo.congCamBienMau()[viTri] : (viTri == 'GIUA' ? '1' : null);
    let c = cong ? robot.getComponentByPort('in' + cong) : null;
    return (c && c.type == 'ColorSensor' && c.renderTarget) ? c : null;
  };

  // Cùng công thức với thư viện Python ev3dev2: kênh đỏ / 2,55 (đèn của cảm biến EV3 màu đỏ)
  this.doSang = function(viTri) {
    let c = self.camBien(viTri);
    if (!c) return null;
    return Math.floor(c.getRGB()[0] / 2.55);
  };

  this.mau = function(viTri) {
    let c = self.camBien(viTri);
    if (!c) return null;
    return TEN_MAU[Colors.toColor(Colors.toHSV(c.getRGB()))] || 'không rõ';
  };

  function dangKiDong() {
    if (!SRA.soDo) return;
    VI_TRI.forEach(function(v) {
      SRA.soDo.them({ id: 'doSang' + v[0], ten: 'Độ sáng (' + v[2] + ')', doc: () => self.doSang(v[1]), soLe: 0, nhom: 'Cảm biến màu' });
      SRA.soDo.them({ id: 'mau' + v[0], ten: 'Màu (' + v[2] + ')', doc: () => self.mau(v[1]), nhom: 'Cảm biến màu' });
    });
  }

  // ---------- Biểu đồ ----------
  let hop = null, canvas = null, duLieu = [], henGio = null, cacDuong = [];

  function taoHop() {
    let cha = document.getElementById('simPanel');
    if (!cha) return null;
    let h = document.createElement('div');
    h.id = 'sra-bieu-do-sang';
    h.style.cssText =
      'position:absolute;left:8px;z-index:5;width:260px;background:rgba(255,255,255,0.92);color:#1f2937;' +
      'border:1px solid #d1d5db;border-radius:8px;padding:6px 8px;font:12px/1.4 system-ui,sans-serif;' +
      'box-shadow:0 1px 4px rgba(0,0,0,0.15);';
    h.innerHTML =
      '<div style="font-weight:600;font-size:13px;cursor:pointer" title="Bấm để thu gọn hoặc mở">Độ sáng phản xạ theo thời gian ▾</div>' +
      '<canvas width="488" height="200" style="width:244px;height:100px;display:block;margin-top:4px"></canvas>' +
      '<div class="sra-chu-giai" style="color:#4b5563"></div>';
    h.firstChild.addEventListener('click', function() {
      let an = canvas.style.display != 'none';
      canvas.style.display = an ? 'none' : 'block';
      h.querySelector('.sra-chu-giai').style.display = an ? 'none' : '';
      h.firstChild.textContent = 'Độ sáng phản xạ theo thời gian ' + (an ? '▸' : '▾');
    });
    cha.appendChild(h);
    canvas = h.querySelector('canvas');
    return h;
  }

  // Đặt biểu đồ sát bảng số đo chung: bảng ở nửa trên thì đặt ngay dưới, ở nửa dưới thì đặt ngay trên
  function datViTriHop() {
    let khung = document.getElementById('sra-so-do');
    let cha = hop.parentElement;
    if (!khung || khung.style.display == 'none' || !cha) {
      hop.style.top = ''; hop.style.bottom = '8px';
      return;
    }
    if (khung.offsetTop + khung.offsetHeight / 2 < cha.clientHeight / 2) {
      hop.style.bottom = ''; hop.style.top = (khung.offsetTop + khung.offsetHeight + 6) + 'px';
    } else {
      hop.style.top = ''; hop.style.bottom = (cha.clientHeight - khung.offsetTop + 6) + 'px';
    }
  }

  function nguong() {
    let n = SRA.bai && SRA.bai.nguong;
    return (typeof n == 'number') ? n : 50;
  }

  function layMau() {
    let t = performance.now() / 1000;
    let m = { t: t };
    cacDuong.forEach(function(v) { m[v] = self.doSang(v); });
    duLieu.push(m);
    while (duLieu.length && duLieu[0].t < t - GIAY) duLieu.shift();
    ve(t);
  }

  function ve(tNay) {
    if (!hop) return;
    datViTriHop();
    if (canvas.style.display == 'none') return;
    let g = canvas.getContext('2d');
    let W = canvas.width, H = canvas.height, k = 2;
    let trai = 28 * k, duoi = 14 * k, tren = 4 * k, phai = 4 * k;
    let w = W - trai - phai, h = H - tren - duoi;
    let yCua = v => tren + h * (1 - v / 100);
    let xCua = t => trai + w * (1 - (tNay - t) / GIAY);
    g.clearRect(0, 0, W, H);
    g.font = (10 * k) + 'px system-ui, sans-serif';
    g.fillStyle = '#6b7280';
    g.strokeStyle = '#e5e7eb';
    g.lineWidth = 1;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    [0, 50, 100].forEach(function(v) {
      g.beginPath(); g.moveTo(trai, yCua(v)); g.lineTo(W - phai, yCua(v)); g.stroke();
      g.fillText(String(v), trai - 4 * k, yCua(v));
    });
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (let s = 0; s <= GIAY; s += 2) {
      g.textAlign = s == 0 ? 'right' : 'center';
      g.fillText(s == 0 ? 'bây giờ' : '-' + s + ' s', xCua(tNay - s), H - duoi + 2 * k);
    }
    // Ngưỡng
    let n = nguong();
    g.strokeStyle = '#dc2626';
    g.setLineDash([6 * k, 4 * k]);
    g.lineWidth = 1.5 * k;
    g.beginPath(); g.moveTo(trai, yCua(n)); g.lineTo(W - phai, yCua(n)); g.stroke();
    g.setLineDash([]);
    // Đường số đo
    cacDuong.forEach(function(v) {
      g.strokeStyle = MAU_NET[v];
      g.lineWidth = 2 * k;
      g.beginPath();
      let bat = false;
      duLieu.forEach(function(m) {
        if (m[v] == null) { bat = false; return; }
        let x = xCua(m.t), y = yCua(m[v]);
        if (bat) g.lineTo(x, y); else g.moveTo(x, y);
        bat = true;
      });
      g.stroke();
    });
  }

  function chuGiai() {
    let ten = { GIUA: 'giữa', TRAI: 'trái', PHAI: 'phải' };
    let s = cacDuong.map(v => '<span style="color:' + MAU_NET[v] + ';font-weight:600">━ ' + ten[v] + '</span>').join('  ');
    s += '  <span style="color:#dc2626;font-weight:600">┅ ngưỡng ' + nguong() + '</span>';
    hop.querySelector('.sra-chu-giai').innerHTML = s;
  }

  this.batBieuDo = function(dsViTri) {
    cacDuong = dsViTri.filter(v => self.camBien(v));
    clearInterval(henGio); henGio = null;
    duLieu = [];
    if (!cacDuong.length) {
      if (hop) hop.style.display = 'none';
      return;
    }
    if (!hop) hop = taoHop();
    if (!hop) return;
    hop.style.display = '';
    chuGiai();
    henGio = setInterval(layMau, CHU_KI);
  };

  // Bọc SRA.soDo.bat: đăng kí dòng của gói này trước khi khung dựng, rồi bật biểu đồ
  this.gan = function() {
    if (!SRA.soDo || SRA.soDo.daGanCamBienMau) return;
    SRA.soDo.daGanCamBienMau = true;
    let batGoc = SRA.soDo.bat;
    SRA.soDo.bat = function(gt) {
      let ds = Array.isArray(gt) ? gt : [];
      let coDong = ds.some(id => /^(doSang|mau)(Giua|Trai|Phai)$/.test(id));
      if (coDong) dangKiDong();
      batGoc.apply(SRA.soDo, arguments);
      self.batBieuDo(VI_TRI.filter(v => ds.includes('doSang' + v[0])).map(v => v[1]));
    };
  };

  // Các cảm biến (giữa/trái/phải) mà chương trình khối đang dùng; null nếu học sinh viết Python
  this.camBienDangDung = function() {
    if (typeof filesManager != 'undefined' && filesManager.modified) return null;
    let ds = new Set();
    for (let top of blockly.workspace.getTopBlocks(false)) {
      if (top.previousConnection || top.outputConnection) continue;
      for (let b of top.getDescendants(false)) {
        if (typeof b.isEnabled == 'function' && !b.isEnabled()) continue;
        if (b.type == 'sra_do_sang' || b.type == 'sra_mau_thay') ds.add(b.getFieldValue('CAM_BIEN'));
        if (b.type == 'sra_thay_mau') ds.add('GIUA');
      }
    }
    return ds;
  };
};

SRA.camBienMau.gan();

SRA.luat.dungCamBien = {
  moTa: function(dk) {
    return 'Dùng ít nhất ' + (dk.toiThieu || 1) + ' cảm biến màu khác nhau';
  },
  kiemTra: function(dk, ctx) {
    let ds = SRA.camBienMau.camBienDangDung();
    if (!ds) return { dat: false, lyDo: 'Điều kiện này chỉ tính khi lập trình bằng khối.' };
    let can = dk.toiThieu || 1;
    let ten = { GIUA: 'giữa', TRAI: 'trái', PHAI: 'phải' };
    let dat = ds.size >= can;
    return {
      dat: dat,
      lyDo: 'Chương trình dùng ' + ds.size + ' cảm biến màu' +
        (ds.size ? ' (' + Array.from(ds).map(v => ten[v]).join(', ') + ')' : '') +
        (dat ? '.' : ', cần ít nhất ' + can + '.')
    };
  }
};
