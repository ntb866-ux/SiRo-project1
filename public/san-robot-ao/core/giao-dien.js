// Sân Robot Ảo – khung đề bài bên cạnh sân và hộp thông báo kết quả.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.giaoDien = new function() {
  let self = this;
  let $khung, $trangThai, $goiY, $nutGoiY, $saoTrenDau, $phu;
  let soGoiYDaMo = 0;

  // Chữ thường → HTML an toàn; hỗ trợ **đậm** và xuống dòng
  function vanBan(s) {
    if (Array.isArray(s)) return s.map(vanBan).join('');
    let an = String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    return an.split(/\n\s*\n/).map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
  }
  this.vanBan = vanBan;

  function veSao(n, kichCo) {
    let h = '';
    for (let i = 0; i < 3; i++) {
      h += '<span class="sra-sao' + (i < n ? ' dat' : '') + '">' + (i < n ? '★' : '☆') + '</span>';
    }
    return '<span class="sra-hang-sao ' + (kichCo || '') + '">' + h + '</span>';
  }
  this.veSao = veSao;

  function dsBaiPhang(danhSach) {
    let ds = [];
    if (!danhSach) return ds;
    for (let c of danhSach.chang) for (let b of c.bai) ds.push({ id: b, chang: c });
    return ds;
  }

  function baiKeTiep() {
    let ds = dsBaiPhang(SRA.danhSach);
    let i = ds.findIndex(b => b.id == SRA.bai.id);
    return (i >= 0 && i + 1 < ds.length) ? ds[i + 1].id : null;
  }

  function changCuaBai() {
    let ds = dsBaiPhang(SRA.danhSach);
    let b = ds.find(b => b.id == SRA.bai.id);
    return b ? b.chang : null;
  }

  function moBai(id) {
    if (typeof blockly != 'undefined') blockly.unsaved = false;
    if (typeof filesManager != 'undefined') filesManager.unsaved = false;
    location.href = 'index.html?baiTap=' + encodeURIComponent(id);
  }

  function veLaiSaoTrenDau() {
    let td = SRA.tienDo.bai(SRA.bai.id);
    $saoTrenDau.html(veSao(td.sao || 0, 'lon'));
    $khung.find('.sra-tieu-chi li').each(function(i) {
      $(this).toggleClass('dat', !!(td.saoDat && td.saoDat[i]));
    });
  }

  this.dung = function(bai, san, danhSach) {
    document.body.classList.add('sra-che-do');
    document.title = bai.tieuDe + ' · Sân Robot Ảo';

    let chang = changCuaBai();
    let sao = bai.sao || [{}, {}, {}];
    let tieuChi = '';
    for (let i = 0; i < 3; i++) {
      let s = sao[i] || {};
      let moTa = s.moTa;
      if (!moTa) {
        let phan = (s.dieuKien || []).map(dk => SRA.moTaDieuKien(dk, bai));
        moTa = i == 0 && phan.length == 0 ? 'Hoàn thành nhiệm vụ' : phan.join(', ');
      }
      tieuChi += '<li><span class="so">' + '★'.repeat(i + 1) + '</span> ' + vanBan(moTa).replace(/^<p>|<\/p>$/g, '') + '</li>';
    }
    let mucTieu = (bai.mucTieu || []).map(dk => '<li>' + SRA.moTaDieuKien(dk, bai) + '</li>').join('');

    let html =
      '<aside id="sraKhung">' +
        '<div class="sra-dau">' +
          '<a class="sra-ve" href="san-robot-ao/index.html">← Danh sách bài</a>' +
          (chang ? '<div class="sra-chang">' + chang.ten + '</div>' : '') +
          '<h1>' + bai.tieuDe + '</h1>' +
          '<div class="sra-sao-dau"></div>' +
        '</div>' +
        '<div class="sra-than">' +
          '<section class="sra-de">' + vanBan(bai.deBai || bai.moTa) + '</section>' +
          (mucTieu ? '<section><h2>Nhiệm vụ</h2><ul class="sra-muc-tieu">' + mucTieu + '</ul></section>' : '') +
          '<section><h2>Cách nhận sao</h2><p class="sra-nho">Sao 1 cần hoàn thành nhiệm vụ. Sao 2 và sao 3 chỉ tính khi đã hoàn thành.</p><ol class="sra-tieu-chi">' + tieuChi + '</ol></section>' +
          (bai.nguyenLi ? '<details class="sra-nguyen-li"><summary>Vì sao robot làm được vậy?</summary>' + vanBan(bai.nguyenLi) + '</details>' : '') +
          ((bai.goiY || []).length ? '<section><h2>Gợi ý</h2><div class="sra-goi-y"></div><button class="sra-nut phu sra-nut-goi-y"></button></section>' : '') +
          (bai.phieu ? '<p><a href="' + SRA.GOC + bai.phieu + '" target="_blank">Phiếu học tập của bài</a></p>' : '') +
          (san && san.tenSan ? '<p class="sra-nho">Sân: ' + san.tenSan + (san.moTaSan ? '. ' + san.moTaSan : '') + '</p>' : '') +
        '</div>' +
        '<div class="sra-chan">' +
          '<div class="sra-trang-thai">Đang tải sân…</div>' +
          '<div class="sra-nut-hang">' +
            '<button class="sra-nut chinh sra-nut-chay">▶ Chạy</button>' +
            '<button class="sra-nut phu sra-nut-dat-lai">↺ Đặt lại</button>' +
          '</div>' +
        '</div>' +
      '</aside>';
    $khung = $(html);
    $('main').prepend($khung);
    $saoTrenDau = $khung.find('.sra-sao-dau');
    $trangThai = $khung.find('.sra-trang-thai');
    $goiY = $khung.find('.sra-goi-y');
    $nutGoiY = $khung.find('.sra-nut-goi-y');

    $khung.find('.sra-nut-chay').on('click', SRA.chay);
    $khung.find('.sra-nut-dat-lai').on('click', SRA.datLai);
    $khung.find('.sra-ve').on('click', function(e) { e.preventDefault(); moBaiDanhSach(); });

    soGoiYDaMo = SRA.tienDo.bai(bai.id).goiYDaXem || 0;
    veGoiY();
    $nutGoiY.on('click', function() {
      soGoiYDaMo++;
      SRA.tienDo.ghiGoiY(bai.id, soGoiYDaMo);
      veGoiY();
    });

    veLaiSaoTrenDau();
    batCheDoCanhNhau();
  };

  function moBaiDanhSach() {
    if (typeof blockly != 'undefined') blockly.unsaved = false;
    if (typeof filesManager != 'undefined') filesManager.unsaved = false;
    location.href = 'san-robot-ao/index.html';
  }

  // Gợi ý theo bậc: mở lần lượt; gợi ý có moSauLanThu chỉ mở sau ngần ấy lượt chạy
  function veGoiY() {
    let ds = SRA.bai.goiY || [];
    if (!ds.length) return;
    let soLan = SRA.tienDo.bai(SRA.bai.id).soLanChay || 0;
    let html = '';
    for (let i = 0; i < Math.min(soGoiYDaMo, ds.length); i++) {
      let g = typeof ds[i] == 'string' ? { noiDung: ds[i] } : ds[i];
      html += '<div class="sra-mot-goi-y"><b>Gợi ý ' + (i + 1) + '.</b> ' + vanBan(g.noiDung).replace(/^<p>|<\/p>$/g, '') + '</div>';
    }
    $goiY.html(html);
    if (soGoiYDaMo >= ds.length) {
      $nutGoiY.hide();
      return;
    }
    let ke = typeof ds[soGoiYDaMo] == 'string' ? {} : ds[soGoiYDaMo];
    let canThem = (ke.moSauLanThu || 0) - soLan;
    if (canThem > 0) {
      $nutGoiY.prop('disabled', true).text('Gợi ý ' + (soGoiYDaMo + 1) + ' mở sau ' + canThem + ' lần chạy nữa');
    } else {
      $nutGoiY.prop('disabled', false).text('Xem gợi ý ' + (soGoiYDaMo + 1) + ' / ' + ds.length);
    }
  }

  // Khối lệnh bên trái, sân bên phải, cùng hiện một lúc
  function batCheDoCanhNhau() {
    $('#navSim').hide();
    simPanel.onInActive = function() {};
    // GEARS chỉ chạy vòng vẽ khi đang mở tab Simulator. Ở đây sân luôn hiện,
    // nên sau mỗi lần dựng lại cảnh ta bật lại vòng vẽ.
    let resetSceneGoc = babylon.resetScene;
    babylon.resetScene = function() {
      let kq = resetSceneGoc.apply(babylon, arguments);
      simPanel.onActive();
      // GEARS đặt lại độ phóng khi dựng cảnh; giữ góc nhìn toàn sân của bài
      return kq.then(function(x) {
        if (SRA.kieuCamera == 'toanSan' && babylon.cameraMode == 'orthoTop') SRA.datCamera('toanSan');
        return x;
      });
    };
    simPanel.onActive();
    main.tabClicked('navBlocks');
    // Nút ▶ trên sân của GEARS cũng đi qua SRA.chay để luôn đặt lại sân trước khi chạy.
    // Ẩn nút chọn thế giới để học sinh không rời khỏi sân của bài.
    simPanel.$runSim.off('click').on('click', SRA.chay);
    $('#simPanel .world').hide();
    setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 50);
  }

  this.hienTrangThai = function(chu, loai) {
    if (!$trangThai) return;
    $trangThai.attr('class', 'sra-trang-thai ' + (loai || '')).text(chu);
    $khung.find('.sra-nut-chay').text(loai == 'dang-chay' ? '■ Dừng' : '▶ Chạy');
    if (loai != 'dang-chay') veGoiY();
  };

  this.hienKetQua = function(kq, banGhi) {
    veLaiSaoTrenDau();
    veGoiY();
    let dong = [];
    for (let c of kq.mucTieu.chiTiet) dong.push('<li class="' + (c.dat ? 'dat' : 'chua') + '">' + c.lyDo + '</li>');
    if (kq.hetGio) dong.push('<li class="chua">Hết thời gian ' + (SRA.bai.thoiGianToiDa || SRA.THOI_GIAN_TOI_DA) + ' giây cho một lượt chạy.</li>');
    let dongSao = '';
    if (kq.hoanThanh) {
      for (let i = 0; i < 3; i++) {
        let chiTiet = kq.chiTietSao[i].chiTiet;
        let lyDo = chiTiet.length ? chiTiet.map(c => c.lyDo).join(' ') : 'Hoàn thành nhiệm vụ.';
        dongSao += '<li class="' + (kq.saoDat[i] ? 'dat' : 'chua') + '"><span class="so">' + '★'.repeat(i + 1) + '</span> ' + lyDo + '</li>';
      }
    }
    let ke = baiKeTiep();
    let tieuDe = kq.hoanThanh
      ? (kq.sao == 3 ? 'Xuất sắc!' : 'Đạt rồi!')
      : 'Chưa đạt, thử lại nhé!';
    let html =
      '<div class="sra-phu">' +
        '<div class="sra-hop ' + (kq.hoanThanh ? 'dat' : 'chua') + '">' +
          '<h2>' + tieuDe + '</h2>' +
          veSao(kq.sao, 'rat-lon') +
          '<ul class="sra-ly-do">' + dong.join('') + '</ul>' +
          (dongSao ? '<ol class="sra-ly-do sao">' + dongSao + '</ol>' : '') +
          '<p class="sra-nho">Thời gian ' + kq.thoiGian.toFixed(1) + ' giây' +
            (kq.soKhoi !== null ? ' · ' + kq.soKhoi + ' khối' : ' · chương trình Python') +
            ' · chạm tường ' + kq.soLanCham + ' lần' +
            (banGhi.sao ? '<br>Tốt nhất của bạn: ' + banGhi.sao + ' sao' : '') + '</p>' +
          '<div class="sra-nut-hang">' +
            '<button class="sra-nut phu sra-dong">Sửa chương trình</button>' +
            (kq.hoanThanh && ke ? '<button class="sra-nut chinh sra-ke">Bài tiếp theo →</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    if ($phu) $phu.remove();
    $phu = $(html);
    $('body').append($phu);
    $phu.find('.sra-dong').on('click', function() { $phu.remove(); $phu = null; });
    $phu.find('.sra-ke').on('click', function() { moBai(ke); });
    $phu.on('click', function(e) { if (e.target === $phu[0]) { $phu.remove(); $phu = null; } });

    let tom = kq.hoanThanh ? 'Đạt ' + kq.sao + ' sao.' : 'Chưa đạt.';
    self.hienTrangThai(tom + ' Sửa chương trình rồi bấm ▶ Chạy để thử lại.', kq.hoanThanh ? 'dat' : 'chua');
  };
};
