/*
 * Sân Robot Ảo – khối cảm biến màu nhiều cổng (gói G7).
 * Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. Phát hành theo GPL v3.
 *
 * Nạp ngay sau san-robot-ao/giao-dien.js, trước blockly.init(). Tệp này chỉ bọc
 * các hàm của giao-dien.js (định nghĩa khối, bảng khối Cơ bản, sinh mã), không sửa chúng.
 *
 * Khối mới:
 *   sra_do_sang   "độ sáng phản xạ cảm biến [giữa/trái/phải]"   → số 0..100
 *   sra_mau_thay  "cảm biến [giữa/trái/phải] thấy màu [đen…] ?"  → đúng/sai
 * Khối "chạy bánh trái … % bánh phải … %" (sra_chay_banh) do gói G5 định nghĩa trong giao-dien.js.
 *
 * Cảm biến "giữa/trái/phải" được đổi ra cổng lúc sinh mã, theo vị trí gắn trên robot
 * (x < 0 là bên trái), nên cùng chương trình chạy được trên robot 1 hay 3 cảm biến.
 */
(function() {
  if (typeof sanRobotAo == 'undefined') return;

  i18n.append({
    '#sra-do_sang#': { en: 'reflected light read by %1', vi: 'độ sáng phản xạ đo bởi %1' },
    '#sra-do_sang_tooltip#': {
      en: 'Light reflected back to the sensor: 0 = black (absorbs light), 100 = white (reflects light)',
      vi: 'Ánh sáng hắt ngược về cảm biến: 0 là đen (hấp thụ hết ánh sáng), 100 là trắng (phản xạ gần hết)'
    },
    '#sra-mau_thay#': { en: '%1 sees %2 ?', vi: '%1 thấy màu %2 ?' },
    '#sra-mau_thay_tooltip#': { en: 'True when the color sensor sees this color', vi: 'Đúng khi cảm biến màu nhận ra màu này' },
  });

  const TEN_VI_TRI = { GIUA: 'giữa', TRAI: 'trái', PHAI: 'phải' };
  const TEN_CONG = (viTri) => TEN_VI_TRI[viTri] || ('o cong ' + String(viTri).replace('CONG', ''));
  const MAU = [
    ['#blk-black#', 'BLACK'], ['#blk-white#', 'WHITE'], ['#blk-red#', 'RED'],
    ['#blk-green#', 'GREEN'], ['#blk-blue#', 'BLUE'], ['#blk-yellow#', 'YELLOW'], ['#blk-brown#', 'BROWN'],
  ];

  // ---------- Định nghĩa khối ----------
  let dinhNghiaGoc = sanRobotAo.dinhNghiaKhoiMoi;
  sanRobotAo.dinhNghiaKhoiMoi = function() {
    return dinhNghiaGoc.apply(sanRobotAo, arguments).concat([
      {
        type: 'sra_do_sang', message0: '#sra-do_sang#',
        args0: [{ type: 'field_cam_bien', name: 'CAM_BIEN', nhom: 'mau' }],
        output: 'Number', style: 'sra_cam_bien', tooltip: '#sra-do_sang_tooltip#',
      },
      {
        type: 'sra_mau_thay', message0: '#sra-mau_thay#',
        args0: [
          { type: 'field_cam_bien', name: 'CAM_BIEN', nhom: 'mau' },
          { type: 'field_dropdown', name: 'color', options: MAU },
        ],
        output: 'Boolean', style: 'sra_cam_bien', tooltip: '#sra-mau_thay_tooltip#',
      },
    ]);
  };

  // ---------- Bảng khối Cơ bản ----------
  function themKhoi(toolbox, idNhom, xml, sauLoai) {
    let nhom = toolbox.querySelector('[id="' + idNhom + '"]');
    if (!nhom) return;
    let doc = (new DOMParser()).parseFromString('<xml>' + xml + '</xml>', 'text/xml');
    let moc = sauLoai ? nhom.querySelector(':scope > block[type="' + sauLoai + '"]') : null;
    for (let b of Array.from(doc.documentElement.children)) {
      let nut = toolbox.ownerDocument.importNode(b, true);
      if (moc) { moc.after(nut); moc = nut; } else nhom.appendChild(nut);
    }
  }

  let toolboxGoc = sanRobotAo.toolboxCoBan;
  sanRobotAo.toolboxCoBan = function() {
    let toolbox = toolboxGoc.apply(sanRobotAo, arguments);
    // Khối "cảm biến … thấy màu" chọn được cảm biến, thay khối một cảm biến cũ trong bảng
    // (khối cũ vẫn được định nghĩa nên chương trình cũ vẫn mở được).
    let cu = toolbox.querySelector('block[type="sra_thay_mau"]');
    let moc = cu ? cu.previousElementSibling : null;
    themKhoi(toolbox, 'sraCamBien',
      '<block type="sra_do_sang"></block>' +
      '<block type="sra_mau_thay"><field name="color">BLACK</field></block>',
      moc ? moc.getAttribute('type') : null);
    if (cu) cu.remove();
    return toolbox;
  };

  // ---------- Đổi giữa/trái/phải ra cổng ----------
  // Trả về số cổng { GIUA: '1', TRAI: '6', PHAI: '7' } theo vị trí gắn cảm biến màu (x < 0 là bên trái),
  // kèm CONG<n>: '<n>' cho mọi cảm biến màu của robot (để chọn đúng cổng, kể cả cảm biến dưới gầm).
  sanRobotAo.congCamBienMau = function() {
    let ds = sanRobotAo.dsCamBien('mau').map(function(cb) {
      let c = cb.c;
      return { cong: cb.cong, x: c.position ? c.position.x : 0, gam: !!c.sraGam || c.sraLoai == 'mauXa' };   // màu nhìn xa không phải mắt dưới mũi
    });
    let kq = { GIUA: null, TRAI: null, PHAI: null };
    ds.forEach((c) => { kq['CONG' + c.cong] = c.cong; });
    // Trái/giữa/phải chọn trong các mắt dưới mũi (thanh dưới mũi, nơi xe để mắt dò line). Xe không có
    // mắt nào dưới mũi thì chọn trong mọi cảm biến màu (ví dụ xe chỉ có mắt dưới gầm).
    if (ds.some((c) => !c.gam)) ds = ds.filter((c) => !c.gam);
    if (!ds.length) return kq;
    kq.GIUA = ds.reduce((a, b) => Math.abs(b.x) < Math.abs(a.x) ? b : a).cong;
    let trai = ds.filter(c => c.x < -0.5).sort((a, b) => b.x - a.x)[0];   // gần giữa nhất bên trái
    let phai = ds.filter(c => c.x > 0.5).sort((a, b) => a.x - b.x)[0];
    kq.TRAI = trai ? trai.cong : null;
    kq.PHAI = phai ? phai.cong : null;
    return kq;
  };

  // ---------- Sinh mã Python ----------
  function uyQuyen(gen, kieu, truong, block) {
    let gia = Object.create(block);
    gia.getFieldValue = function(ten) {
      return (ten in truong) ? truong[ten] : block.getFieldValue(ten);
    };
    return gen.generators[kieu](gia);
  }

  // Cảm biến được chọn không có trên robot: sinh lời gọi báo lỗi dễ hiểu khi chạy
  function thieuCamBien(viTri) {
    return 'sra_thieu_cam_bien(\'' + TEN_CONG(viTri) + '\')';
  }

  function boSinhMa(gen) {
    return {
      sra_do_sang: function(block) {
        let viTri = block.getFieldValue('CAM_BIEN');
        let cong = sanRobotAo.congCamBienMau()[viTri];
        if (!cong) return [thieuCamBien(viTri), Blockly.Python.ORDER_FUNCTION_CALL];
        return ['sra_doc_sang(color_sensor_in' + cong + ')', Blockly.Python.ORDER_FUNCTION_CALL];
      },
      sra_mau_thay: function(block) {
        let viTri = block.getFieldValue('CAM_BIEN');
        let cong = sanRobotAo.congCamBienMau()[viTri];
        if (!cong) return [thieuCamBien(viTri), Blockly.Python.ORDER_FUNCTION_CALL];
        let ten = uyQuyen(gen, 'color', { color: block.getFieldValue('color'), type: 'NUMBER' }, block)[0];
        return ['sra_doc_mau(color_sensor_in' + cong + ') == ' + ten, Blockly.Python.ORDER_RELATIONAL];
      },
    };
  }

  // Hàm Python dùng chung. sra_doc_sang / sra_doc_mau đọc cảm biến; nếu robot đang "đi mãi"
  // thì mỗi lần đọc cũng sửa hướng theo con quay. Lí do: trong giả lập, lệnh motor trần
  // làm bánh trượt lúc tăng tốc nên "đi mãi" lệch 5–15°, trong khi xe thật đi gần thẳng.
  // Vòng "chờ đến khi …" đọc cảm biến liên tục nên giữ được hướng mà học sinh không phải lo.
  const MA_EV3DEV =
    '# San Robot Ao: cam bien mau (G7)\n' +
    'sra_giu = {\'bat\': False, \'v\': 0}\n' +
    '\n' +
    'def sra_gioi_han(v):\n' +
    '    return max(-100, min(100, v))\n' +
    '\n' +
    'def sra_sua_huong():\n' +
    '    pass\n' +
    '\n' +
    'def sra_doc_sang(cb):\n' +
    '    sra_sua_huong()\n' +
    '    return cb.reflected_light_intensity\n' +
    '\n' +
    'def sra_doc_mau(cb):\n' +
    '    sra_sua_huong()\n' +
    '    return cb.color\n' +
    '\n';
  // Chỉ thêm khi robot có con quay và đã có bộ điều khiển siro.drivetrain (sra_dt)
  const MA_GIU_HUONG =
    'if sra_dt is not None:\n' +
    '    def sra_sua_huong():\n' +
    '        if sra_giu[\'bat\']:\n' +
    '            sai = sra_dt.gyro.angle - sra_dt.heading\n' +
    '            sua = max(-15, min(15, sai * 2.0))\n' +
    '            v = sra_giu[\'v\']\n' +
    '            tank_drive.on(sra_gioi_han(v - sua), sra_gioi_han(v + sua))\n' +
    '\n' +
    '    sra_chay_goc = sra_chay\n' +
    '\n' +
    '    def sra_chay(huong):\n' +
    '        sra_chay_goc(huong)\n' +
    '        sra_giu[\'bat\'] = True\n' +
    '        sra_giu[\'v\'] = sra[\'toc_do\'] * huong\n' +
    '\n' +
    '    def sra_tat_giu(ham):\n' +
    '        def moi(*so):\n' +
    '            sra_giu[\'bat\'] = False\n' +
    '            return ham(*so)\n' +
    '        return moi\n' +
    '\n' +
    '    sra_di = sra_tat_giu(sra_di)\n' +
    '    sra_quay = sra_tat_giu(sra_quay)\n' +
    '    sra_dung = sra_tat_giu(sra_dung)\n' +
    '    sra_chay_banh = sra_tat_giu(sra_chay_banh)\n' +
    '\n';
  const MA_PYBRICKS =
    '# San Robot Ao: cam bien mau (G7)\n' +
    'def sra_gioi_han(v):\n' +
    '    return max(-100, min(100, v))\n' +
    '\n' +
    'def sra_doc_sang(cb):\n' +
    '    return cb.reflection()\n' +
    '\n' +
    'def sra_doc_mau(cb):\n' +
    '    return cb.color()\n' +
    '\n';
  const MA_THIEU =
    'def sra_thieu_cam_bien(ten):\n' +
    '    raise ValueError("Robot nay khong co cam bien mau ben " + ten + ". Hay chon cam bien khac hoac doi sang robot do duong.")\n' +
    '\n' +
    'def sra_thieu_cb(ten):\n' +
    '    raise ValueError("Robot nay chua gan " + ten + ". Hay mo Robot > Lap rap xe de gan cam bien, roi chon lai cong trong khoi lenh.")\n' +
    '\n';

  [[ev3dev2_generator, MA_EV3DEV], [pybricks_generator, MA_PYBRICKS]].forEach(function(cap) {
    let gen = cap[0];
    Object.assign(gen.generators, boSinhMa(gen));
    let genCodeGoc = gen.genCode;
    gen.genCode = function() {
      let code = genCodeGoc.apply(gen, arguments);
      let moc = '# Here is where your code starts';
      let them = '';
      if (/\bsra_(doc_sang|doc_mau)\(/.test(code)) {
        them += cap[1];
        if (gen === ev3dev2_generator && /^sra_dt = None$/m.test(code) && /\bdef sra_dung\(/.test(code)) them += MA_GIU_HUONG;
      }
      if (/\bsra_thieu_(cam_bien|cb)\(/.test(code)) them += MA_THIEU;
      if (them) code = code.replace(moc, them + moc);
      return code;
    };
  });
  Blockly.Python.addReservedWords('sra_gioi_han,sra_chay_goc,sra_thieu_cam_bien,sra_thieu_cb,sra_giu,sra_sua_huong,sra_doc_sang,sra_doc_mau,sra_tat_giu');
})();
