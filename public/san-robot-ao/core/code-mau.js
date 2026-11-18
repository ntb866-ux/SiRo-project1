// Sân Robot Ảo – kho code mẫu cho xe lắp mô-đun (xe kéo thả cảm biến).
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Mỗi bài có thể có một tệp code-mau/<mã-bài>.json: một cấu hình xe (trường sraXe, xem
// xe/README.md) và một chương trình mẫu viết gọn (xem SRACodeMau.xml bên dưới).
// Trên khung đề bài hiện mục "Xe lắp ráp và code mẫu". Bấm "Dùng xe và code mẫu" thì trang
// mở lại bài với ?xe=mau: robot của bài được thay bằng xe lắp mô-đun lắp theo cấu hình của
// mẫu, chương trình mẫu được nạp vào vùng khối.
//
// Ở chế độ xe mẫu, bài làm và kết quả lưu riêng (khoá <mã-bài>@xe), không ghi đè bài làm và
// số sao học sinh làm bằng robot của bài.
//
// Phần chuyển chương trình viết gọn ra Blockly XML không cần trình duyệt, dùng chung với
// scripts/code-mau/kiem-tra-code-mau.js.

(function(goc, tao) {
  let m = tao();
  if (typeof module == 'object' && module.exports) module.exports = m;
  else goc.SRACodeMau = m;
})(this, function() {
  'use strict';

  // ---------- Chương trình viết gọn → Blockly XML ----------
  // Lệnh:
  //   ['di', cm] ['lui', cm] ['phai', độ] ['trai', độ]           đi/quay đúng quãng (có con quay sửa)
  //   ['chay'] ['chayLui'] ['xoay', 'PHAI'|'TRAI'] ['dung']       đi/quay mãi, dừng
  //   ['toc', %] ['banh', trái %, phải %] ['quayBanh', trái, phải, 'VONG'|'DO']
  //   ['nghi', giây] ['cho', đk] ['bip'] ['but'] ['nhacBut'] ['goc0']
  //   ['lap', n, [...]] ['lapMai', [...]] ['lapDen', đk, [...]] ['neu', đk, [...], [...không thì]]
  //   ['datBien', tên, giá trị] ['tangBien', tên, giá trị]
  // Giá trị: số, ['kc'] khoảng cách siêu âm, ['cham'] đang chạm, ['goc'] góc quay,
  //   ['sang', 'GIUA'|'TRAI'|'PHAI'] độ sáng phản xạ, ['mau', vị trí, 'BLACK'|…] thấy màu,
  //   ['bien', tên], ['<'|'>'|'=', a, b], ['+'|'-'|'*'|'/', a, b], ['va'|'hoac', a, b], ['khong', a]
  function xml(ds) {
    let bien = {};
    const idBien = (ten) => bien[ten] = bien[ten] || 'sraBien' + Object.keys(bien).length;
    const an = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const vBien = (ten) => '<field name="VAR" id="' + idBien(ten) + '">' + an(ten) + '</field>';

    function giaTri(v) {
      if (typeof v == 'number') return '<shadow type="math_number"><field name="NUM">' + v + '</field></shadow>';
      return khoiGiaTri(v);
    }
    function vao(ten, v) { return '<value name="' + ten + '">' + giaTri(v) + '</value>'; }
    const SO_SANH = { '<': 'LT', '>': 'GT', '=': 'EQ', '<=': 'LTE', '>=': 'GTE', '!=': 'NEQ' };
    const PHEP = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE' };
    function khoiGiaTri(v) {
      if (!Array.isArray(v)) throw new Error('giá trị lạ: ' + JSON.stringify(v));
      switch (v[0]) {
        case 'kc': return '<block type="sra_khoang_cach"></block>';
        case 'cham': return '<block type="sra_dang_cham"></block>';
        case 'goc': return '<block type="sra_goc_quay"></block>';
        case 'sang': return '<block type="sra_do_sang"><field name="CAM_BIEN">' + (v[1] || 'GIUA') + '</field></block>';
        case 'mau': return '<block type="sra_mau_thay"><field name="CAM_BIEN">' + (v[1] || 'GIUA') + '</field><field name="color">' + v[2] + '</field></block>';
        case 'bien': return '<block type="variables_get">' + vBien(v[1]) + '</block>';
        case 'va': case 'hoac':
          return '<block type="logic_operation"><field name="OP">' + (v[0] == 'va' ? 'AND' : 'OR') + '</field>' +
            '<value name="A">' + khoiGiaTri(v[1]) + '</value><value name="B">' + khoiGiaTri(v[2]) + '</value></block>';
        case 'khong': return '<block type="logic_negate"><value name="BOOL">' + khoiGiaTri(v[1]) + '</value></block>';
      }
      if (SO_SANH[v[0]]) return '<block type="logic_compare"><field name="OP">' + SO_SANH[v[0]] + '</field>' + vao('A', v[1]) + vao('B', v[2]) + '</block>';
      if (PHEP[v[0]]) return '<block type="math_arithmetic"><field name="OP">' + PHEP[v[0]] + '</field>' + vao('A', v[1]) + vao('B', v[2]) + '</block>';
      throw new Error('giá trị lạ: ' + v[0]);
    }
    // Mở thẻ khối (chưa đóng: chuoi() đóng sau khi gắn khối kế tiếp)
    function khoi(l) {
      switch (l[0]) {
        case 'di': return '<block type="sra_di"><field name="HUONG">TOI</field>' + vao('CM', l[1]);
        case 'lui': return '<block type="sra_di"><field name="HUONG">LUI</field>' + vao('CM', l[1]);
        case 'phai': return '<block type="sra_quay"><field name="HUONG">PHAI</field>' + vao('DO', l[1]);
        case 'trai': return '<block type="sra_quay"><field name="HUONG">TRAI</field>' + vao('DO', l[1]);
        case 'chay': return '<block type="sra_chay"><field name="HUONG">TOI</field>';
        case 'chayLui': return '<block type="sra_chay"><field name="HUONG">LUI</field>';
        case 'xoay': return '<block type="sra_xoay"><field name="HUONG">' + (l[1] || 'PHAI') + '</field>';
        case 'dung': return '<block type="sra_dung">';
        case 'toc': return '<block type="sra_dat_toc_do">' + vao('TOC_DO', l[1]);
        case 'banh': return '<block type="sra_chay_banh">' + vao('TRAI', l[1]) + vao('PHAI', l[2]);
        case 'quayBanh': return '<block type="sra_quay_banh"><field name="DON_VI">' + (l[3] || 'VONG') + '</field>' + vao('TRAI', l[1]) + vao('PHAI', l[2]);
        case 'nghi': return '<block type="sleep"><field name="units">SECONDS</field>' + vao('seconds', l[1]);
        case 'cho': return '<block type="wait_until"><value name="value">' + khoiGiaTri(l[1]) + '</value>';
        case 'bip': return '<block type="beep"><field name="block">BLOCK</field>';
        case 'but': return '<block type="sra_ha_but">';
        case 'nhacBut': return '<block type="sra_nhac_but">';
        case 'goc0': return '<block type="sra_dat_lai_goc">';
        case 'lap': return '<block type="controls_repeat_ext">' + vao('TIMES', l[1]) + '<statement name="DO">' + chuoi(l[2]) + '</statement>';
        case 'lapMai': return '<block type="sra_lap_mai"><statement name="DO">' + chuoi(l[1]) + '</statement>';
        case 'lapDen': return '<block type="controls_whileUntil"><field name="MODE">UNTIL</field><value name="BOOL">' + khoiGiaTri(l[1]) + '</value><statement name="DO">' + chuoi(l[2]) + '</statement>';
        case 'neu': return '<block type="controls_if">' + (l[3] ? '<mutation else="1"></mutation>' : '') +
          '<value name="IF0">' + khoiGiaTri(l[1]) + '</value><statement name="DO0">' + chuoi(l[2]) + '</statement>' +
          (l[3] ? '<statement name="ELSE">' + chuoi(l[3]) + '</statement>' : '');
        case 'datBien': return '<block type="variables_set">' + vBien(l[1]) + vao('VALUE', l[2]);
        case 'tangBien': return '<block type="math_change">' + vBien(l[1]) + vao('DELTA', l[2]);
      }
      throw new Error('lệnh lạ: ' + l[0]);
    }
    function chuoi(ds) {
      if (!ds || !ds.length) return '';
      return khoi(ds[0]) + (ds.length > 1 ? '<next>' + chuoi(ds.slice(1)) + '</next>' : '') + '</block>';
    }
    let than = chuoi(ds);
    let dsBien = Object.keys(bien).map((t) => '<variable id="' + bien[t] + '">' + an(t) + '</variable>').join('');
    return '<xml xmlns="https://developers.google.com/blockly/xml">' + (dsBien ? '<variables>' + dsBien + '</variables>' : '') +
      '<block type="when_started" x="60" y="40" deletable="false"><data>Main</data>' + (than ? '<next>' + than + '</next>' : '') + '</block></xml>';
  }

  // Số khối của chương trình viết gọn (không tính khối "khi bắt đầu" và ô số), để giáo viên đối chiếu
  function demKhoi(ds) {
    let n = 0;
    function gt(v) { if (Array.isArray(v)) { n++; v.slice(1).forEach(gt); } }
    function lenh(l) {
      n++;
      l.slice(1).forEach(function(x) {
        if (Array.isArray(x) && x.length && Array.isArray(x[0])) x.forEach(lenh);
        else if (Array.isArray(x) && x.length && typeof x[0] == 'string' && x !== l) gt(x);
      });
    }
    (ds || []).forEach(lenh);
    return n;
  }

  return { xml: xml, demKhoi: demKhoi };
});

// ---------- Trong trang bài ----------
(function() {
  if (typeof window == 'undefined' || typeof SRA == 'undefined' || !SRA.napBai) return;
  const C = window.SRACodeMau;
  const thamSo = new URLSearchParams(location.search);
  const DUOI = '@xe';                      // hậu tố khoá lưu bài làm và kết quả ở chế độ xe mẫu
  const TEP_XE = 'robots/xe-lap-rap.json';

  SRA.codeMau = {
    mau: null,                             // nội dung tệp code mẫu của bài (null: bài chưa có)
    dangDung: thamSo.get('xe') == 'mau',   // đang chạy bài bằng xe và code mẫu
    xml: function() { return SRA.codeMau.mau ? C.xml(SRA.codeMau.mau.chuongTrinh || []) : null; },
  };
  const CM = SRA.codeMau;

  function an(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function diaChi(xe) {
    let p = new URLSearchParams(location.search);
    if (xe) p.set('xe', 'mau'); else p.delete('xe');
    p.delete('robot');
    return 'index.html?' + p.toString().replace(/%2F/g, '/');
  }
  function roiTrang(url) {
    if (typeof blockly != 'undefined') blockly.unsaved = false;
    if (typeof filesManager != 'undefined') filesManager.unsaved = false;
    location.href = url;
  }

  // Bài làm và kết quả ở chế độ xe mẫu lưu dưới khoá riêng
  if (CM.dangDung) {
    const td = SRA.tienDo;
    const docMaGoc = td.docMa, luuMaGoc = td.luuMa, ghiLuotGoc = td.ghiLuotChay, baiGoc = td.bai;
    td.docMa = (id) => docMaGoc.call(td, id + DUOI) || CM.xml();
    td.luuMa = (id, x) => luuMaGoc.call(td, id + DUOI, x);
    td.ghiLuotChay = (id, kq) => ghiLuotGoc.call(td, id + DUOI, kq);
    td.bai = (id) => baiGoc.call(td, id + DUOI);
  }

  // Robot của bài → xe lắp mô-đun lắp theo cấu hình của mẫu
  function datXeMau(data) {
    let mau = CM.mau;
    Object.assign(data, JSON.parse(JSON.stringify(mau.robotThem || {})));
    data.sraXe = JSON.parse(JSON.stringify(mau.xe || {}));
    data.shortDescription = mau.tenXe || data.shortDescription;
    robot.options = data;
    let i = robotTemplates.findIndex((r) => r.name == data.name);
    if (i == -1) robotTemplates.push(JSON.parse(JSON.stringify(data))); else robotTemplates[i] = JSON.parse(JSON.stringify(data));
  }
  let napRobotGoc = SRA.napRobot;
  SRA.napRobot = function(ten) {
    if (!CM.dangDung || !CM.mau) return napRobotGoc.apply(this, arguments);
    return SRA.docJSON(SRA.GOC + TEP_XE).then(datXeMau);
  };

  // Chỗ xuất phát và các vùng chấm của bài đo theo tâm quay của robot của bài. Xe lắp mô-đun
  // có mũi dài hơn và đuôi ngắn hơn, nên mẫu có thể dời chúng (trường "lechBai", đơn vị cm):
  //   { "viTriBatDau": [dx, dy], "vung": { "tên vùng": [dx, dy] } }
  // để "mũi chạm tường", "đuôi cách xe sau 3 cm"… vẫn đúng nghĩa với xe này.
  let baiHienTaiGoc = SRA.baiHienTai;
  SRA.baiHienTai = function() {
    let bai = baiHienTaiGoc.apply(this, arguments);
    let lech = CM.dangDung && CM.mau && CM.mau.lechBai;
    if (!bai || !lech) return bai;
    let kq = Object.assign({}, bai);
    let doi = (p, d) => Object.assign({}, p, { x: (p.x || 0) + (d[0] || 0), y: (p.y || 0) + (d[1] || 0) });
    if (lech.viTriBatDau && kq.viTriBatDau) kq.viTriBatDau = doi(kq.viTriBatDau, lech.viTriBatDau);
    if (lech.vung && kq.vung) {
      kq.vung = Object.assign({}, kq.vung);
      for (let ten in lech.vung) if (kq.vung[ten]) kq.vung[ten] = doi(kq.vung[ten], lech.vung[ten]);
    }
    return kq;
  };

  // Nạp lại xe và chương trình mẫu ngay trong trang (bỏ mọi chỗ đã sửa)
  CM.napLai = function() {
    if (!CM.mau || (typeof skulpt != 'undefined' && skulpt.running)) return Promise.resolve();
    if (typeof SRABangLapRap != 'undefined' && SRABangLapRap.dangMo) SRABangLapRap.dong();
    blockly.workspace.clear();
    blockly.loadXmlText(CM.xml());
    if (typeof filesManager != 'undefined') filesManager.modified = false;
    return SRA.docJSON(SRA.GOC + TEP_XE).then(datXeMau).then(function() {
      simPanel.worldOptionsSetting = SRA.dungOptionsSan(SRA.san, SRA.baiHienTai());
      return simPanel.resetSim();
    }).then(function() {
      SRA.datCamera(SRA.kieuCamera || 'toanSan');
      SRA.tienDo.luuMa(SRA.bai.id, blockly.getXmlText());
    });
  };

  function veMuc() {
    let mau = CM.mau;
    if (!mau) return;
    let $de = $('#sraKhung .sra-de');
    let html;
    if (CM.dangDung) {
      $('body').addClass('sra-xe-mau');
      html =
        '<section class="sra-code-mau dang-dung">' +
          '<h2>' + sraT('Xe lắp ráp và code mẫu', 'Built car and sample code') + '</h2>' +
          '<p><b>' + an(mau.tenXe) + '.</b> ' + SRA.giaoDien.vanBan(mau.giaiThichXe).replace(/^<p>|<\/p>$/g, '') + '</p>' +
          (mau.giaiThichCode ? '<details><summary>' + sraT('Chương trình mẫu làm gì?', 'What does the sample program do?') + '</summary>' + SRA.giaoDien.vanBan(mau.giaiThichCode) + '</details>' : '') +
          (mau.ghiChu ? '<p class="sra-nho">' + SRA.giaoDien.vanBan(mau.ghiChu).replace(/^<p>|<\/p>$/g, '') + '</p>' : '') +
          '<p class="sra-nho">' + sraT('Sửa xe: menu Robot → Lắp ráp xe (kéo thả cảm biến). Kết quả ở đây lưu riêng, không tính vào số sao làm bằng robot của bài.', 'To change the car: Robot menu → Build car (drag and drop sensors). Results here are saved separately and do not count toward the stars earned with the lesson robot.') + '</p>' +
          '<div class="sra-nut-hang">' +
            '<button type="button" class="sra-nut phu sra-nap-lai-mau">↺ ' + sraT('Nạp lại xe và code mẫu', 'Reload car and sample code') + '</button>' +
            '<button type="button" class="sra-nut phu sra-bo-xe-mau">← ' + sraT('Về robot của bài', 'Back to lesson robot') + '</button>' +
          '</div>' +
          '<p class="sra-nho"><a href="san-robot-ao/huong-dan/xe-va-code-mau.html" target="_blank" rel="noopener">' + sraT('Hướng dẫn dùng xe và code mẫu', 'Guide to the sample car and code (Vietnamese)') + '</a></p>' +
        '</section>';
    } else {
      html =
        '<section class="sra-code-mau">' +
          '<h2>' + sraT('Xe lắp ráp và code mẫu', 'Built car and sample code') + '</h2>' +
          '<p>' + sraT('Có sẵn cách lắp xe kéo thả cảm biến cho sân này: ', 'A ready-made drag-and-drop sensor car for this field: ') + '<b>' + an(mau.tenXe) + '</b>' + sraT(', kèm chương trình mẫu.', ', with a sample program.') + '</p>' +
          '<div class="sra-nut-hang"><button type="button" class="sra-nut phu sra-dung-xe-mau">' + sraT('Dùng xe và code mẫu', 'Use car and sample code') + '</button></div>' +
          '<p class="sra-nho">' + sraT('Bài làm của bạn với robot của bài vẫn được giữ nguyên.', 'Your work with the lesson robot is kept as it is.') + '</p>' +
          '<p class="sra-nho"><a href="san-robot-ao/huong-dan/xe-va-code-mau.html" target="_blank" rel="noopener">' + sraT('Hướng dẫn dùng xe và code mẫu', 'Guide to the sample car and code (Vietnamese)') + '</a></p>' +
        '</section>';
    }
    let $s = $(html);
    // Đặt sau đề bài (và sau mục chọn robot nếu có)
    let $sau = $('#sraKhung .sra-chon-robot');
    ($sau.length ? $sau : $de).after($s);
    $s.on('click', '.sra-dung-xe-mau', function() { roiTrang(diaChi(true)); });
    $s.on('click', '.sra-bo-xe-mau', function() { roiTrang(diaChi(false)); });
    $s.on('click', '.sra-nap-lai-mau', function() { CM.napLai(); });
  }

  let napBaiGoc = SRA.napBai;
  SRA.napBai = async function(id) {
    try { CM.mau = await SRA.docJSON(SRA.GOC + 'code-mau/' + id + '.json'); } catch (e) { CM.mau = null; }
    if (!CM.mau) CM.dangDung = false;
    await napBaiGoc.apply(this, arguments);
    veMuc();
  };
})();
