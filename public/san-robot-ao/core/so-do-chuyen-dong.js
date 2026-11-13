// Sân Robot Ảo – số đo chuyển động và chọn robot trong bài (gói G5: hiệu chỉnh động cơ).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Tệp này nạp sau challenge-engine.js. Nó:
//   1. Theo dõi robot trong mỗi lượt chạy: số vòng từng bánh, quãng đường, tốc độ,
//      góc thân xe đã quay, độ lệch ngang, thời gian chuyển động.
//      Các số này hiện trên bảng số đo (SRA.soDo, tệp so-do.js) khi bài bật "soDo".
//      (Motor yếu và gia tốc bánh nằm ở san-robot-ao/dong-co.js.)
//   2. Cho học sinh đổi robot ngay trong bài, nếu bài có trường "robotChon":
//        "robotChon": [ { "tep": "banh-to", "ten": "Robot bánh to" }, … ]
//   3. Thêm các loại điều kiện chấm sao dựa trên số đo: diDuoc, lechNgangToiDa, chenhVongToiDa,
//      quayThan, thoiGianChuyenDong, hoanThanhVoiCacRobot, khongDungKhoi (xem docs/huong-dan-them-bai.md).

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.chuyenDong = new function() {
  let self = this;
  const NGUONG_DI_CHUYEN = 0.02;   // cm mỗi khung hình: nhỏ hơn coi như rung tại chỗ

  // Số đo của lượt gần nhất (giữ nguyên sau khi lượt kết thúc để học sinh đọc)
  let s = null;
  let luotDangTheoDoi = null;

  function moi() {
    return {
      x0: 0, y0: 0, goc0: 0, l0: 0, r0: 0,
      x: 0, y: 0, goc: 0, vongTrai: 0, vongPhai: 0,
      quangDuong: 0, tocDo: 0, vongGiay: 0,
      tBatDau: null, tCuoi: null, t: 0
    };
  }

  function coRobot() {
    return typeof robot != 'undefined' && robot && robot.body && robot.leftWheel && robot.rightWheel;
  }

  // Vị trí điểm giữa hai bánh, lấy thẳng từ tâm hai bánh. Khác SRA.world.viTriRobot()
  // (tính từ tâm thân): khi phanh, thân xe chúi tới chúi lui quanh trục bánh làm
  // tâm thân dao động gần 1 cm, còn trục bánh thì đứng yên.
  this.viTri = function() {
    let vt = SRA.world.viTriRobot();
    let a = robot.leftWheel.mesh, b = robot.rightWheel.mesh;
    // Bánh không có mesh cha (GEARS tách bánh khỏi thân để gắn khớp vật lí), nên
    // position là tọa độ thế giới. Đừng dùng getAbsolutePosition() ở đây: gọi trong
    // vòng render của babylon nó trả về (0, 0, 0).
    if (a && b && !a.parent && !b.parent) {
      let pa = a.position, pb = b.position;
      vt.x = (pa.x + pb.x) / 2;
      vt.y = (pa.z + pb.z) / 2;
    }
    return vt;
  };

  // Bánh có đang được lệnh chạy không (chạy mãi, chạy tới góc, chạy theo giờ)
  function duocLenhChay(w) {
    return w.mode != w.modes.STOP && w.speed_sp != 0;
  }

  // Lấy mốc ban đầu: vị trí, hướng và góc bánh lúc robot đứng ở chỗ xuất phát
  function batDau() {
    s = moi();
    if (!coRobot()) return;
    let vt = self.viTri();
    s.x0 = s.x = vt.x;
    s.y0 = s.y = vt.y;
    s.goc0 = s.goc = vt.goc;
    s.l0 = robot.leftWheel.position;
    s.r0 = robot.rightWheel.position;
  }

  this.render = function(delta) {
    if (!SRA.world || !SRA.bai || !coRobot()) return;
    let w = SRA.world;

    if (w.trangThai == 'san-sang') {
      // Chưa chạy: bảng số đo về 0, mốc là chỗ robot đang đứng (cập nhật liên tục
      // vì robot vừa đặt lại còn rơi xuống mặt sân một chút)
      batDau();
      luotDangTheoDoi = 'san-sang';
      return;
    }
    if (w.trangThai != 'dang-chay' || !w.luot) return;
    if (luotDangTheoDoi !== w.luot) {
      // Lượt mới: giữ mốc lấy lúc san-sang (robot vừa được đặt lại)
      if (luotDangTheoDoi !== 'san-sang') batDau();
      luotDangTheoDoi = w.luot;
    }

    // Thời gian chạy = thời gian bánh được lệnh quay (từ lệnh chạy đầu tiên tới
    // lệnh dừng cuối cùng), khớp với số giây học sinh ghi trong khối "chờ".
    // Không tính lúc robot vừa đặt lại còn rơi, nảy trên mặt sân.
    let lenh = duocLenhChay(robot.leftWheel) || duocLenhChay(robot.rightWheel);
    let dt = delta / 1000;
    if (s.tBatDau === null) {
      if (!lenh) { batDau(); return; }   // chưa chạy: dời mốc theo robot
      s.tBatDau = w.luot.t - dt;
    }
    if (lenh) s.tCuoi = w.luot.t;
    let vt = self.viTri();
    let dx = vt.x - s.x, dy = vt.y - s.y;
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d > NGUONG_DI_CHUYEN) s.quangDuong += d;
    if (dt > 0) s.tocDo = 0.8 * s.tocDo + 0.2 * (d / dt);
    s.x = vt.x; s.y = vt.y; s.goc = vt.goc;
    s.vongTrai = (robot.leftWheel.position - s.l0) / 360;
    s.vongPhai = (robot.rightWheel.position - s.r0) / 360;
    s.vongGiay = (Math.abs(robot.leftWheel.speed) + Math.abs(robot.rightWheel.speed)) / 2 / 360;
    s.t = w.luot.t;
  };

  this.duLieuTho = function() { return s; };   // cho kiểm thử

  // Giá trị đọc ra (dùng cho bảng số đo và cho điều kiện chấm sao)
  this.so = function() {
    if (!s) return null;
    let g0 = s.goc0 * Math.PI / 180;
    let dx = s.x - s.x0, dy = s.y - s.y0;
    // Hướng đầu xe lúc xuất phát: (sin g0, cos g0); bên phải: (cos g0, -sin g0)
    let tien = dx * Math.sin(g0) + dy * Math.cos(g0);
    let ngang = dx * Math.cos(g0) - dy * Math.sin(g0);
    let dangChay = SRA.world && SRA.world.trangThai == 'dang-chay';
    let thoiGian = s.tBatDau === null ? 0 : s.tCuoi - s.tBatDau;
    return {
      vongTrai: s.vongTrai,
      vongPhai: s.vongPhai,
      quangDuong: s.quangDuong,
      dichChuyen: Math.sqrt(dx * dx + dy * dy),
      tien: tien,
      lechNgang: ngang,
      quayThan: SRA.hieuGoc(s.goc, s.goc0),
      tocDo: dangChay ? s.tocDo : 0,
      vongGiay: dangChay ? s.vongGiay : 0,
      thoiGian: Math.max(0, thoiGian)
    };
  };

  function doc(ten) {
    return function() { let v = self.so(); return v ? v[ten] : null; };
  }

  // Các dòng của bảng số đo. Bài chọn dòng bằng "soDo": [id, …]
  this.DONG = [
    { id: 'thoiGian', ten: 'Thời gian chạy', doc: doc('thoiGian'), donVi: 's', soLe: 2 },
    { id: 'vongTrai', ten: 'Bánh trái đã quay', doc: doc('vongTrai'), donVi: 'vòng', soLe: 2 },
    { id: 'vongPhai', ten: 'Bánh phải đã quay', doc: doc('vongPhai'), donVi: 'vòng', soLe: 2 },
    { id: 'vongGiay', ten: 'Bánh quay nhanh', doc: doc('vongGiay'), donVi: 'vòng/s', soLe: 2 },
    { id: 'quangDuong', ten: 'Quãng đường', doc: doc('quangDuong'), donVi: 'cm', soLe: 1 },
    { id: 'tien', ten: 'Đi tới được', doc: doc('tien'), donVi: 'cm', soLe: 1 },
    { id: 'tocDo', ten: 'Tốc độ', doc: doc('tocDo'), donVi: 'cm/s', soLe: 1 },
    { id: 'quayThan', ten: 'Thân xe đã quay', doc: doc('quayThan'), donVi: '°', soLe: 1 },
    { id: 'lechNgang', ten: 'Lệch ngang (+ là phải)', doc: doc('lechNgang'), donVi: 'cm', soLe: 1 },
  ];
  if (SRA.soDo) self.DONG.forEach(d => SRA.soDo.them(Object.assign({ nhom: 'Chuyển động' }, d)));

  // -------------------------------------------------------------------------
  // Chọn robot trong bài
  // -------------------------------------------------------------------------
  this.robotDangDung = null;

  function veChonRobot(bai) {
    let ds = bai.robotChon;
    if (!Array.isArray(ds) || !ds.length) return;
    self.robotDangDung = bai.robot;
    let html = '<section class="sra-chon-robot"><h2>Chọn robot</h2><div class="sra-nut-hang" style="flex-wrap:wrap">';
    ds.forEach(function(r) {
      html += '<button type="button" class="sra-nut phu" data-tep="' + r.tep + '">' + r.ten + '</button>';
    });
    html += '</div></section>';
    let $s = $(html);
    $('#sraKhung .sra-de').after($s);
    function toMau() {
      $s.find('button').each(function() {
        let chon = $(this).attr('data-tep') == self.robotDangDung;
        $(this).toggleClass('chinh', chon).toggleClass('phu', !chon).attr('aria-pressed', chon);
      });
    }
    toMau();
    $s.on('click', 'button', function() {
      let tep = $(this).attr('data-tep');
      if (tep == self.robotDangDung || skulpt.running) return;
      self.robotDangDung = tep;
      toMau();
      SRA.napRobot(tep).then(function() {
        simPanel.worldOptionsSetting = SRA.dungOptionsSan(SRA.san, SRA.bai);
        return simPanel.resetSim();
      }).then(function() {
        SRA.datCamera(SRA.kieuCamera || 'toanSan');
      });
    });
  }

  // Bọc SRA.napBai để vẽ thêm phần chọn robot sau khi khung đề bài đã dựng
  let napBaiGoc = SRA.napBai;
  SRA.napBai = async function(id) {
    await napBaiGoc.apply(this, arguments);
    veChonRobot(SRA.bai);
  };

  babylon.renders.push(self.render);
};

// ---------------------------------------------------------------------------
// Điều kiện chấm sao dựa trên số đo
// ---------------------------------------------------------------------------
(function() {
  function so(x, le) {
    return Number(x).toFixed(le == null ? 1 : le).replace('.', ',');
  }
  // Số gọn: bỏ phần thập phân thừa (2,5 · 3 · 0,05)
  function gon(x) {
    return String(Math.round(Number(x) * 1000) / 1000).replace('.', ',');
  }
  function soDo() {
    return SRA.chuyenDong.so() || {};
  }

  Object.assign(SRA.TEN_KHOI, {
    sra_quay_banh: '"quay bánh trái … bánh phải …"',
    sra_chay_banh: '"chạy bánh trái … % bánh phải … %"',
    sra_chay: '"đi … mãi"'
  });

  Object.assign(SRA.luat, {
    // Robot đi tới (theo hướng đầu xe lúc xuất phát) được cm ± saiSo
    diDuoc: {
      moTa: function(dk) {
        return 'Robot đi tới được ' + gon(dk.cm) + ' cm (sai số ±' + gon(dk.saiSo || 2) + ' cm)';
      },
      kiemTra: function(dk) {
        let v = soDo().tien || 0;
        let dat = Math.abs(v - dk.cm) <= (dk.saiSo || 2);
        return { dat: dat, lyDo: 'Robot đi tới được ' + so(v) + ' cm, cần ' + gon(dk.cm) + ' ± ' + gon(dk.saiSo || 2) + ' cm.' };
      }
    },

    // Lúc dừng, robot lệch khỏi đường thẳng xuất phát không quá cm
    lechNgangToiDa: {
      moTa: function(dk) {
        return 'Lệch ngang không quá ' + gon(dk.cm) + ' cm so với đường thẳng';
      },
      kiemTra: function(dk) {
        let v = soDo().lechNgang || 0;
        let dat = Math.abs(v) <= dk.cm;
        return {
          dat: dat,
          lyDo: 'Robot lệch ' + so(Math.abs(v)) + ' cm sang ' + (v >= 0 ? 'phải' : 'trái') + (dat ? '.' : ', chỉ được lệch tối đa ' + gon(dk.cm) + ' cm.')
        };
      }
    },

    // Thân xe quay được `do` độ so với lúc xuất phát (dương = quay phải)
    quayThan: {
      moTa: function(dk) {
        return 'Thân xe quay ' + (dk.do >= 0 ? 'phải ' : 'trái ') + so(Math.abs(dk.do), 0) + '° (sai số ±' + gon(dk.saiSo || 2) + '°)';
      },
      kiemTra: function(dk) {
        let v = soDo().quayThan || 0;
        let dat = Math.abs(SRA.hieuGoc(v, dk.do)) <= (dk.saiSo || 2);
        return {
          dat: dat,
          lyDo: 'Thân xe quay ' + (v >= 0 ? 'phải ' : 'trái ') + so(Math.abs(v)) + '°, cần ' + so(Math.abs(dk.do), 0) + ' ± ' + gon(dk.saiSo || 2) + '°.'
        };
      }
    },

    // Lúc dừng, số vòng hai bánh đã quay chênh nhau không quá `vong`
    chenhVongToiDa: {
      moTa: function(dk) {
        return 'Hai bánh quay số vòng chênh nhau không quá ' + gon(dk.vong) + ' vòng';
      },
      kiemTra: function(dk) {
        let v = soDo();
        let chenh = Math.abs((v.vongTrai || 0) - (v.vongPhai || 0));
        let dat = chenh <= dk.vong;
        return {
          dat: dat,
          lyDo: 'Bánh trái quay ' + so(v.vongTrai || 0, 2) + ' vòng, bánh phải ' + so(v.vongPhai || 0, 2) + ' vòng: chênh ' + so(chenh, 2) +
            (dat ? ' vòng.' : ' vòng, chỉ được chênh tối đa ' + gon(dk.vong) + ' vòng.')
        };
      }
    },

    // Chương trình không dùng các loại khối này (vd. khối đi/quay có con quay tự sửa sai)
    khongDungKhoi: {
      moTa: function(dk) {
        return 'Không dùng khối ' + SRA.tenKhoi(dk);
      },
      kiemTra: function(dk, ctx) {
        if (!ctx.loaiKhoi) return { dat: false, lyDo: 'Bài này cần làm bằng khối lệnh, không dùng Python tự viết.' };
        let co = [].concat(dk.khoi).filter(k => ctx.loaiKhoi[k]);
        return {
          dat: co.length == 0,
          lyDo: co.length == 0 ? 'Không dùng khối ' + SRA.tenKhoi(dk) + '.' : 'Bài này không được dùng khối ' + SRA.tenKhoi(dk) + '.'
        };
      }
    },

    // Thời gian bánh được lệnh chạy (từ lệnh chạy đầu tiên đến lệnh dừng) nằm trong [tu, den] giây
    thoiGianChuyenDong: {
      moTa: function(dk) {
        return 'Thời gian chạy từ ' + gon(dk.tu) + ' đến ' + gon(dk.den) + ' giây';
      },
      kiemTra: function(dk) {
        let v = soDo().thoiGian || 0;
        let dat = v >= dk.tu && v <= dk.den;
        return { dat: dat, lyDo: 'Robot chạy ' + so(v, 2) + ' giây, cần từ ' + gon(dk.tu) + ' đến ' + gon(dk.den) + ' giây.' };
      }
    },

    // Đã hoàn thành nhiệm vụ của bài với mỗi robot trong danh sách (cộng dồn qua các lượt chạy)
    hoanThanhVoiCacRobot: {
      moTa: function(dk, bai) {
        let ten = [].concat(dk.robot).map(function(t) {
          let r = (bai.robotChon || []).find(x => x.tep == t);
          return r ? r.ten : t;
        });
        return 'Hoàn thành với cả ' + ten.join(' và ');
      },
      kiemTra: function(dk, ctx) {
        let bai = SRA.bai;
        let can = [].concat(dk.robot);
        let dung = SRA.chuyenDong.robotDangDung || bai.robot;
        let ban = SRA.tienDo.bai(bai.id);
        let daXong = (ban.robotDaXong || []).slice();
        if (SRA.kiemTraDanhSach(bai.mucTieu, ctx).dat && daXong.indexOf(dung) == -1) {
          daXong.push(dung);
          SRA.tienDo.ghiThem(bai.id, function(b) { b.robotDaXong = daXong; });
        }
        let thieu = can.filter(t => daXong.indexOf(t) == -1);
        let tenRobot = function(t) {
          let r = (bai.robotChon || []).find(x => x.tep == t);
          return r ? r.ten.toLowerCase() : t;
        };
        return {
          dat: thieu.length == 0,
          lyDo: thieu.length == 0 ? 'Đã hoàn thành với mọi robot cần thử.' : 'Còn phải hoàn thành với ' + thieu.map(tenRobot).join(' và ') + '.'
        };
      }
    }
  });
})();
