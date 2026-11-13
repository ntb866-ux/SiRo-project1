// Sân Robot Ảo – bảng số đo nổi trên sân (dùng chung cho mọi gói bài).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Mỗi gói tự đăng kí dòng số đo của mình:
//   SRA.soDo.them({ id: 'quangDuong', ten: 'Quãng đường', doc: () => 12.3, donVi: 'cm', soLe: 1, nhom: 'Chuyển động' });
// doc() trả về số (hoặc chuỗi, hoặc null để hiện "–").
// Bài bật khung bằng trường "soDo" trong tệp bài:
//   "soDo": true                         hiện mọi dòng đã đăng kí
//   "soDo": ["thoiGian", "quangDuong"]   chỉ hiện các dòng này, đúng thứ tự này
// Khung nằm ở góc dưới-trái vùng sân (góc trên có nút camera của GEARS),
// tự cập nhật khoảng 10 lần/giây,
// tự ẩn khi bài không bật hoặc không có dòng nào.

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.soDo = new function() {
  let self = this;
  let dong = [];          // các dòng đã đăng kí, theo thứ tự đăng kí
  let chon = false;       // false | true | [id...]
  let khung = null;
  let henGio = null;

  this.them = function(d) {
    if (!d || !d.id || typeof d.doc != 'function') return;
    let i = dong.findIndex(x => x.id == d.id);
    if (i == -1) dong.push(d); else dong[i] = d;
    if (chon) self.ve();
  };

  this.xoa = function(id) {
    dong = dong.filter(x => x.id != id);
    if (chon) self.ve();
  };

  this.cacDong = function() {
    if (!chon) return [];
    if (chon === true) return dong.slice();
    return chon.map(id => dong.find(x => x.id == id)).filter(Boolean);
  };

  // Bật/tắt khung theo trường soDo của bài
  this.bat = function(gt) {
    chon = Array.isArray(gt) ? gt.slice() : !!gt;
    self.ve();
  };

  function dinhDang(d) {
    let v;
    try { v = d.doc(); } catch (e) { v = null; }
    if (v === null || v === undefined || (typeof v == 'number' && !isFinite(v))) return '–';
    if (typeof v == 'number') {
      let s = v.toFixed(d.soLe != null ? d.soLe : 1);
      if (s.indexOf('-') == 0 && Number(s) == 0) s = s.slice(1);   // bỏ "-0,0"
      v = s.replace('.', ',');
    }
    return v + (d.donVi ? (d.donVi == '°' ? '' : ' ') + d.donVi : '');
  }

  function taoKhung() {
    let cha = document.getElementById('simPanel');
    if (!cha) return null;
    let k = document.createElement('div');
    k.id = 'sra-so-do';
    k.setAttribute('aria-live', 'off');
    k.style.cssText =
      'position:absolute;left:8px;bottom:8px;z-index:5;min-width:170px;max-width:260px;' +
      'background:rgba(255,255,255,0.92);color:#1f2937;border:1px solid #d1d5db;border-radius:8px;' +
      'padding:6px 10px;font:13px/1.5 system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.15);' +
      'pointer-events:auto;user-select:text;';
    cha.appendChild(k);
    return k;
  }

  // Dựng lại toàn bộ khung (khi đổi danh sách dòng)
  this.ve = function() {
    let ds = self.cacDong();
    if (!ds.length) {
      if (khung) khung.style.display = 'none';
      clearInterval(henGio); henGio = null;
      return;
    }
    if (!khung) khung = taoKhung();
    if (!khung) return;
    khung.style.display = '';
    let html = '<div style="font-weight:600;margin-bottom:2px">Bảng số đo</div><table style="border-collapse:collapse;width:100%">';
    let nhomTruoc = null;
    ds.forEach(function(d, i) {
      if (d.nhom && d.nhom != nhomTruoc && ds.some(x => x.nhom && x.nhom != d.nhom)) {
        html += '<tr><td colspan="2" style="color:#6b7280;font-size:12px;padding-top:3px">' + d.nhom + '</td></tr>';
      }
      nhomTruoc = d.nhom;
      html += '<tr><td style="padding-right:10px;white-space:nowrap">' + d.ten + '</td>' +
        '<td data-so-do="' + i + '" style="text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:600"></td></tr>';
    });
    html += '</table>';
    khung.innerHTML = html;
    self.capNhat();
    if (!henGio) henGio = setInterval(self.capNhat, 100);
  };

  this.capNhat = function() {
    if (!khung || khung.style.display == 'none') return;
    let ds = self.cacDong();
    khung.querySelectorAll('[data-so-do]').forEach(function(o) {
      let d = ds[Number(o.getAttribute('data-so-do'))];
      if (d) o.textContent = dinhDang(d);
    });
  };

  // Giá trị hiện tại của mọi dòng đang hiện, dùng cho kiểm thử tự động
  this.giaTri = function() {
    let kq = {};
    self.cacDong().forEach(function(d) {
      try { kq[d.id] = d.doc(); } catch (e) { kq[d.id] = null; }
    });
    return kq;
  };
};
