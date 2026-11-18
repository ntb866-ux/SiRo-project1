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
  return (v && v.ten) ? sraT(v.ten, v.tenEn || v.ten) : ten;
};

// Tên khối đọc cho học sinh, dùng trong điều kiện dungKhoi
SRA.TEN_KHOI = {
  controls_repeat_ext: sraT('"lặp lại … lần"', '"repeat … times"'),
  controls_repeat: sraT('"lặp lại … lần"', '"repeat … times"'),
  sra_lap_mai: sraT('"lặp mãi"', '"forever"'),
  controls_whileUntil: sraT('"lặp cho đến khi"', '"repeat until"'),
  sra_ha_but: sraT('"hạ bút"', '"pen down"'),
  penDown: sraT('"hạ bút"', '"pen down"'),
  sra_di: sraT('"đi … cm"', '"move … cm"'),
  sra_quay: sraT('"quay … độ"', '"turn … degrees"'),
  controls_if: sraT('"nếu … thì"', '"if … then"'),
  sra_goc_quay: sraT('"góc quay (độ)"', '"heading (degrees)"'),
  gyro_sensor: sraT('"góc quay (độ)"', '"heading (degrees)"'),
  sra_xoay: sraT('"quay … mãi"', '"keep turning …"'),
  sra_chay_banh: sraT('"chạy bánh trái … bánh phải …"', '"run left wheel … right wheel …"')
};

SRA.tenKhoi = function(dk) {
  if (dk.tenKhoi) return sraT(dk.tenKhoi, dk.tenKhoiEn || dk.tenKhoi);
  let ten = [];
  for (let k of [].concat(dk.khoi)) {
    let t = SRA.TEN_KHOI[k] || k;
    if (!ten.includes(t)) ten.push(t);
  }
  return ten.join(sraT(' hoặc ', ' or '));
};

SRA.luat = {
  // Robot dừng lại bên trong vùng khi chương trình kết thúc
  dungTrongVung: {
    moTa: function(dk, bai) {
      return sraT('Robot dừng trong ', 'Robot stops in ') + SRA.tenVung({ vung: bai.vung || {} }, dk.vung);
    },
    kiemTra: function(dk, ctx) {
      let v = ctx.vung[dk.vung];
      if (!v) return { dat: false, lyDo: sraT('Bài chưa khai báo vùng "', 'The lesson has no zone "') + dk.vung + '".' };
      let dat = SRA.trongVung(v, ctx.cuoi.x, ctx.cuoi.y);
      return {
        dat: dat,
        lyDo: dat ? sraT('Robot đã dừng trong ', 'The robot stopped in ') + SRA.tenVung(ctx, dk.vung) + '.'
                  : sraT('Robot chưa dừng trong ', 'The robot did not stop in ') + SRA.tenVung(ctx, dk.vung) + '.'
      };
    }
  },

  // Robot đi qua vùng ít nhất một lần (không cần dừng)
  denVung: {
    moTa: function(dk, bai) {
      return sraT('Robot đi qua ', 'Robot passes through ') + SRA.tenVung({ vung: bai.vung || {} }, dk.vung);
    },
    kiemTra: function(dk, ctx) {
      let dat = ctx.daVao.has(dk.vung);
      return {
        dat: dat,
        lyDo: dat ? sraT('Robot đã đi qua ', 'The robot passed through ') + SRA.tenVung(ctx, dk.vung) + '.'
                  : sraT('Robot chưa đi qua ', 'The robot did not pass through ') + SRA.tenVung(ctx, dk.vung) + '.'
      };
    }
  },

  // Robot đi qua tất cả các vùng trong danh sách, có thể bắt buộc đúng thứ tự
  quaCacVung: {
    moTa: function(dk, bai) {
      let ten = dk.vung.map(t => SRA.tenVung({ vung: bai.vung || {} }, t));
      return sraT('Robot đi qua ', 'Robot passes through ') + ten.join(', ') + (dk.theoThuTu ? sraT(' theo đúng thứ tự', ' in the right order') : '');
    },
    kiemTra: function(dk, ctx) {
      let thieu = dk.vung.filter(t => !ctx.daVao.has(t));
      if (thieu.length > 0) {
        return { dat: false, lyDo: sraT('Robot còn thiếu ' + thieu.length + ' vùng: ', 'The robot missed ' + thieu.length + (thieu.length > 1 ? ' zones: ' : ' zone: ')) + thieu.map(t => SRA.tenVung(ctx, t)).join(', ') + '.' };
      }
      if (dk.theoThuTu) {
        let thuTu = ctx.thuTuVao.filter(t => dk.vung.includes(t));
        let dung = dk.vung.every((t, i) => thuTu[i] == t);
        if (!dung) return { dat: false, lyDo: sraT('Robot đi qua đủ vùng nhưng sai thứ tự.', 'The robot passed every zone but in the wrong order.') };
      }
      return { dat: true, lyDo: sraT('Robot đã đi qua đủ các vùng.', 'The robot passed through every zone.') };
    }
  },

  // Robot không bao giờ đi vào vùng cấm
  khongVaoVung: {
    moTa: function(dk, bai) {
      return sraT('Robot không đi vào ', 'Robot stays out of ') + SRA.tenVung({ vung: bai.vung || {} }, dk.vung);
    },
    kiemTra: function(dk, ctx) {
      let dat = !ctx.daVao.has(dk.vung);
      return {
        dat: dat,
        lyDo: dat ? sraT('Robot tránh được ', 'The robot avoided ') + SRA.tenVung(ctx, dk.vung) + '.'
                  : sraT('Robot đã đi vào ', 'The robot entered ') + SRA.tenVung(ctx, dk.vung) + '.'
      };
    }
  },

  // Robot không chạm tường bao quanh sân và vật cản cố định
  khongChamTuong: {
    moTa: function() { return sraT('Không chạm tường', 'Do not hit the wall'); },
    kiemTra: function(dk, ctx) {
      let dat = ctx.soLanCham == 0;
      return {
        dat: dat,
        lyDo: dat ? sraT('Robot không chạm tường lần nào.', 'The robot never hit the wall.') : sraT('Robot đã chạm tường ' + ctx.soLanCham + ' lần.', 'The robot hit the wall ' + ctx.soLanCham + ' times.')
      };
    }
  },

  // Hoàn thành trong thời gian không quá N giây
  thoiGianDuoi: {
    moTa: function(dk) { return sraT('Hoàn thành trong tối đa ' + dk.giay + ' giây', 'Finish within ' + dk.giay + ' s'); },
    kiemTra: function(dk, ctx) {
      let dat = ctx.thoiGian <= dk.giay;
      return {
        dat: dat,
        lyDo: sraT('Thời gian ' + ctx.thoiGian.toFixed(1) + ' giây' + (dat ? '' : ', cần tối đa ' + dk.giay + ' giây') + '.', 'Time ' + ctx.thoiGian.toFixed(1) + ' s' + (dat ? '' : ', needs at most ' + dk.giay + ' s') + '.')
      };
    }
  },

  // Dùng tối đa N khối lệnh (không tính khối mũ "khi bắt đầu")
  soKhoiToiDa: {
    moTa: function(dk) { return sraT('Dùng tối đa ' + dk.khoi + ' khối lệnh', 'Use at most ' + dk.khoi + ' blocks'); },
    kiemTra: function(dk, ctx) {
      if (ctx.soKhoi === null) {
        return { dat: false, lyDo: sraT('Điều kiện số khối chỉ tính khi lập trình bằng khối.', 'The block count only applies to block programs.') };
      }
      let dat = ctx.soKhoi <= dk.khoi;
      return {
        dat: dat,
        lyDo: sraT('Bạn dùng ' + ctx.soKhoi + ' khối' + (dat ? '' : ', cần tối đa ' + dk.khoi + ' khối') + '.', 'You used ' + ctx.soKhoi + ' blocks' + (dat ? '' : ', at most ' + dk.khoi + ' allowed') + '.')
      };
    }
  },

  // Chương trình có dùng ít nhất `toiThieu` (mặc định 1) khối thuộc một trong các loại `khoi`
  // (chuỗi hoặc mảng tên loại khối Blockly). Tên đọc cho học sinh: SRA.TEN_KHOI hoặc `tenKhoi`.
  dungKhoi: {
    moTa: function(dk) {
      return sraT('Dùng khối ', 'Use the block ') + SRA.tenKhoi(dk);
    },
    kiemTra: function(dk, ctx) {
      if (!ctx.loaiKhoi) {
        return { dat: false, lyDo: sraT('Điều kiện này chỉ tính khi lập trình bằng khối.', 'This condition only applies to block programs.') };
      }
      let ds = [].concat(dk.khoi);
      let n = ds.reduce((tong, k) => tong + (ctx.loaiKhoi[k] || 0), 0);
      let can = dk.toiThieu || 1;
      let dat = n >= can;
      return {
        dat: dat,
        lyDo: dat ? sraT('Chương trình có dùng khối ', 'The program uses the block ') + SRA.tenKhoi(dk) + '.'
                  : sraT('Chương trình chưa dùng khối ', 'The program does not use the block ') + SRA.tenKhoi(dk) + (can > 1 ? sraT(' (cần ' + can + ' khối)', ' (needs ' + can + ')') : '') + '.'
      };
    }
  },

  // Robot kết thúc quay về hướng `goc` (độ), sai số cho phép `saiSo` (mặc định 10)
  huongCuoi: {
    moTa: function(dk) {
      return sraT('Robot quay mặt về hướng ', 'Robot ends facing ') + dk.goc + '° (±' + (dk.saiSo || 10) + '°)';
    },
    kiemTra: function(dk, ctx) {
      let lech = Math.abs(SRA.hieuGoc(ctx.cuoi.goc, dk.goc));
      let dat = lech <= (dk.saiSo || 10);
      return {
        dat: dat,
        lyDo: sraT('Hướng cuối ' + Math.round(ctx.cuoi.goc) + '°, lệch ' + Math.round(lech) + '° so với ' + dk.goc + '°.', 'Final heading ' + Math.round(ctx.cuoi.goc) + '°, ' + Math.round(lech) + '° off ' + dk.goc + '°.')
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
      chiTiet.push({ dk: dk, dat: false, lyDo: sraT('Không biết loại điều kiện "', 'Unknown condition type "') + dk.loai + '".' });
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
