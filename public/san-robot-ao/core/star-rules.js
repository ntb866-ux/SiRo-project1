// Sân Robot Ảo – luật kiểm tra điều kiện (dùng cho mục tiêu và cho sao).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Mỗi luật nhận một điều kiện `dk` (lấy nguyên từ tệp bài) và bản ghi lượt chạy
// `ctx`, trả về { dat: true/false, lyDo: 'câu giải thích cho học sinh' }.
//
// ctx gồm:
//   vung        : { ten: {x, y, rong, dai} }   các vùng khai báo trong bài
//   daVao       : Set tên vùng robot đã đi vào ít nhất một lần
//   thuTuVao    : mảng tên vùng theo thứ tự lần đầu đi vào
//   cuoi        : { x, y, goc }                 vị trí và hướng robot khi kết thúc
//   soLanCham   : số lần robot chạm tường hoặc vật cản cố định
//   thoiGian    : thời gian chạy (giây)
//   soKhoi      : số khối lệnh, hoặc null nếu học sinh viết Python
//   loaiKhoi    : { loạiKhối: số lần dùng }, hoặc null nếu học sinh viết Python
//
// Thêm một luật mới: viết thêm một mục trong SRA.luat với moTa() và kiemTra().

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.trongVung = function(v, x, y) {
  return Math.abs(x - v.x) <= v.rong / 2 && Math.abs(y - v.y) <= v.dai / 2;
};

// Hiệu hai góc, đưa về khoảng -180..180 độ
SRA.hieuGoc = function(a, b) {
  let d = ((a - b) % 360 + 540) % 360 - 180;
  return d;
};

SRA.tenVung = function(ctx, ten) {
  let v = ctx.vung[ten];
  return (v && v.ten) ? v.ten : ten;
};

// Tên khối đọc cho học sinh, dùng trong điều kiện dungKhoi
SRA.TEN_KHOI = {
  controls_repeat_ext: '"lặp lại … lần"',
  controls_repeat: '"lặp lại … lần"',
  sra_lap_mai: '"lặp mãi"',
  controls_whileUntil: '"lặp cho đến khi"',
  sra_ha_but: '"hạ bút"',
  penDown: '"hạ bút"',
  sra_di: '"đi … cm"',
  sra_quay: '"quay … độ"',
  controls_if: '"nếu … thì"',
  sra_goc_quay: '"góc quay (độ)"',
  gyro_sensor: '"góc quay (độ)"',
  sra_xoay: '"quay … mãi"',
  sra_chay_banh: '"chạy bánh trái … bánh phải …"'
};

SRA.tenKhoi = function(dk) {
  if (dk.tenKhoi) return dk.tenKhoi;
  let ten = [];
  for (let k of [].concat(dk.khoi)) {
    let t = SRA.TEN_KHOI[k] || k;
    if (!ten.includes(t)) ten.push(t);
  }
  return ten.join(' hoặc ');
};

SRA.luat = {
  // Robot dừng lại bên trong vùng khi chương trình kết thúc
  dungTrongVung: {
    moTa: function(dk, bai) {
      return 'Robot dừng trong ' + SRA.tenVung({ vung: bai.vung || {} }, dk.vung);
    },
    kiemTra: function(dk, ctx) {
      let v = ctx.vung[dk.vung];
      if (!v) return { dat: false, lyDo: 'Bài chưa khai báo vùng "' + dk.vung + '".' };
      let dat = SRA.trongVung(v, ctx.cuoi.x, ctx.cuoi.y);
      return {
        dat: dat,
        lyDo: dat ? 'Robot đã dừng trong ' + SRA.tenVung(ctx, dk.vung) + '.'
                  : 'Robot chưa dừng trong ' + SRA.tenVung(ctx, dk.vung) + '.'
      };
    }
  },

  // Robot đi qua vùng ít nhất một lần (không cần dừng)
  denVung: {
    moTa: function(dk, bai) {
      return 'Robot đi qua ' + SRA.tenVung({ vung: bai.vung || {} }, dk.vung);
    },
    kiemTra: function(dk, ctx) {
      let dat = ctx.daVao.has(dk.vung);
      return {
        dat: dat,
        lyDo: dat ? 'Robot đã đi qua ' + SRA.tenVung(ctx, dk.vung) + '.'
                  : 'Robot chưa đi qua ' + SRA.tenVung(ctx, dk.vung) + '.'
      };
    }
  },

  // Robot đi qua tất cả các vùng trong danh sách, có thể bắt buộc đúng thứ tự
  quaCacVung: {
    moTa: function(dk, bai) {
      let ten = dk.vung.map(t => SRA.tenVung({ vung: bai.vung || {} }, t));
      return 'Robot đi qua ' + ten.join(', ') + (dk.theoThuTu ? ' theo đúng thứ tự' : '');
    },
    kiemTra: function(dk, ctx) {
      let thieu = dk.vung.filter(t => !ctx.daVao.has(t));
      if (thieu.length > 0) {
        return { dat: false, lyDo: 'Robot còn thiếu ' + thieu.length + ' vùng: ' + thieu.map(t => SRA.tenVung(ctx, t)).join(', ') + '.' };
      }
      if (dk.theoThuTu) {
        let thuTu = ctx.thuTuVao.filter(t => dk.vung.includes(t));
        let dung = dk.vung.every((t, i) => thuTu[i] == t);
        if (!dung) return { dat: false, lyDo: 'Robot đi qua đủ vùng nhưng sai thứ tự.' };
      }
      return { dat: true, lyDo: 'Robot đã đi qua đủ các vùng.' };
    }
  },

  // Robot không bao giờ đi vào vùng cấm
  khongVaoVung: {
    moTa: function(dk, bai) {
      return 'Robot không đi vào ' + SRA.tenVung({ vung: bai.vung || {} }, dk.vung);
    },
    kiemTra: function(dk, ctx) {
      let dat = !ctx.daVao.has(dk.vung);
      return {
        dat: dat,
        lyDo: dat ? 'Robot tránh được ' + SRA.tenVung(ctx, dk.vung) + '.'
                  : 'Robot đã đi vào ' + SRA.tenVung(ctx, dk.vung) + '.'
      };
    }
  },

  // Robot không chạm tường bao quanh sân và vật cản cố định
  khongChamTuong: {
    moTa: function() { return 'Không chạm tường'; },
    kiemTra: function(dk, ctx) {
      let dat = ctx.soLanCham == 0;
      return {
        dat: dat,
        lyDo: dat ? 'Robot không chạm tường lần nào.' : 'Robot đã chạm tường ' + ctx.soLanCham + ' lần.'
      };
    }
  },

  // Hoàn thành trong thời gian không quá N giây
  thoiGianDuoi: {
    moTa: function(dk) { return 'Hoàn thành trong tối đa ' + dk.giay + ' giây'; },
    kiemTra: function(dk, ctx) {
      let dat = ctx.thoiGian <= dk.giay;
      return {
        dat: dat,
        lyDo: 'Thời gian ' + ctx.thoiGian.toFixed(1) + ' giây' + (dat ? '' : ', cần tối đa ' + dk.giay + ' giây') + '.'
      };
    }
  },

  // Dùng tối đa N khối lệnh (không tính khối mũ "khi bắt đầu")
  soKhoiToiDa: {
    moTa: function(dk) { return 'Dùng tối đa ' + dk.khoi + ' khối lệnh'; },
    kiemTra: function(dk, ctx) {
      if (ctx.soKhoi === null) {
        return { dat: false, lyDo: 'Điều kiện số khối chỉ tính khi lập trình bằng khối.' };
      }
      let dat = ctx.soKhoi <= dk.khoi;
      return {
        dat: dat,
        lyDo: 'Bạn dùng ' + ctx.soKhoi + ' khối' + (dat ? '' : ', cần tối đa ' + dk.khoi + ' khối') + '.'
      };
    }
  },

  // Chương trình có dùng ít nhất `toiThieu` (mặc định 1) khối thuộc một trong các loại `khoi`
  // (chuỗi hoặc mảng tên loại khối Blockly). Tên đọc cho học sinh: SRA.TEN_KHOI hoặc `tenKhoi`.
  dungKhoi: {
    moTa: function(dk) {
      return 'Dùng khối ' + SRA.tenKhoi(dk);
    },
    kiemTra: function(dk, ctx) {
      if (!ctx.loaiKhoi) {
        return { dat: false, lyDo: 'Điều kiện này chỉ tính khi lập trình bằng khối.' };
      }
      let ds = [].concat(dk.khoi);
      let n = ds.reduce((tong, k) => tong + (ctx.loaiKhoi[k] || 0), 0);
      let can = dk.toiThieu || 1;
      let dat = n >= can;
      return {
        dat: dat,
        lyDo: dat ? 'Chương trình có dùng khối ' + SRA.tenKhoi(dk) + '.'
                  : 'Chương trình chưa dùng khối ' + SRA.tenKhoi(dk) + (can > 1 ? ' (cần ' + can + ' khối)' : '') + '.'
      };
    }
  },

  // Robot kết thúc quay về hướng `goc` (độ), sai số cho phép `saiSo` (mặc định 10)
  huongCuoi: {
    moTa: function(dk) {
      return 'Robot quay mặt về hướng ' + dk.goc + '° (±' + (dk.saiSo || 10) + '°)';
    },
    kiemTra: function(dk, ctx) {
      let lech = Math.abs(SRA.hieuGoc(ctx.cuoi.goc, dk.goc));
      let dat = lech <= (dk.saiSo || 10);
      return {
        dat: dat,
        lyDo: 'Hướng cuối ' + Math.round(ctx.cuoi.goc) + '°, lệch ' + Math.round(lech) + '° so với ' + dk.goc + '°.'
      };
    }
  }
};

// Kiểm tra một danh sách điều kiện. Trả về { dat, chiTiet: [{dk, dat, lyDo}] }
SRA.kiemTraDanhSach = function(dsDieuKien, ctx) {
  let chiTiet = [];
  for (let dk of (dsDieuKien || [])) {
    let luat = SRA.luat[dk.loai];
    if (!luat) {
      chiTiet.push({ dk: dk, dat: false, lyDo: 'Không biết loại điều kiện "' + dk.loai + '".' });
      continue;
    }
    let kq = luat.kiemTra(dk, ctx);
    chiTiet.push({ dk: dk, dat: kq.dat, lyDo: kq.lyDo });
  }
  return { dat: chiTiet.every(c => c.dat), chiTiet: chiTiet };
};

SRA.moTaDieuKien = function(dk, bai) {
  let luat = SRA.luat[dk.loai];
  if (dk.moTa) return dk.moTa;
  return luat ? luat.moTa(dk, bai) : dk.loai;
};
