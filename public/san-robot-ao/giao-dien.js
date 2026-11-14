/*
 * Sân Robot Ảo – giao diện tiếng Việt, khối kiểu Scratch và chế độ Cơ bản / Nâng cao.
 * Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. Phát hành theo GPL v3.
 *
 * Tệp này nạp sau js/main.js và trước lệnh blockly.init() trong index.html.
 * Nó chỉ "bọc" các hàm có sẵn của GEARS chứ không sửa mã gốc, để sau này
 * cập nhật GEARS bản mới dễ dàng.
 *
 * Nguyên tắc giữ tương thích: không đổi tên (type) của khối nào có sẵn,
 * nên chương trình GEARS cũ vẫn mở được. Khối mới đều có tiền tố "sra_".
 */
var sanRobotAo = new function() {
  var self = this;

  self.TEN_SAN_PHAM = 'Sân Robot Ảo';
  self.KHOA_CHE_DO = 'sraCheDo';
  self.CO_BAN = 'co-ban';
  self.NANG_CAO = 'nang-cao';

  // ==========================================================================
  // 1. Màu nhóm khối kiểu Scratch
  // ==========================================================================
  // [màu chính, màu phụ, viền]
  self.MAU = {
    su_kien: ['#FFBF00', '#E6AC00', '#CC9900'],
    chuyen_dong: ['#4C97FF', '#4280D7', '#3373CC'],
    dong_co: ['#3D7DD8', '#3570C4', '#2C5FA8'],
    but_ve: ['#0FBD8C', '#0DA57A', '#0B8E69'],
    am_thanh: ['#CF63CF', '#C94FC9', '#BD42BD'],
    cam_bien: ['#5CB1D6', '#47A8D1', '#2E8EB8'],
    dieu_khien: ['#FFAB19', '#EC9C13', '#CF8B17'],
    phep_toan: ['#59C059', '#46B946', '#389438'],
    bien: ['#FF8C1A', '#FF8000', '#DB6E00'],
    danh_sach: ['#FF661A', '#FF5500', '#E64D00'],
    khoi_cua_toi: ['#FF6680', '#FF4D6A', '#FF3355'],
    thu_nghiem: ['#9966FF', '#855CD6', '#774DCB'],
    ghi_chu: ['#9AA0A6', '#8A9096', '#7A8086'],
  };

  // Khối của GEARS → nhóm màu
  self.NHOM_KHOI = {
    when_started: 'su_kien',

    stop: 'chuyen_dong', move_steering: 'chuyen_dong', move_steering_for: 'chuyen_dong',
    move_tank: 'chuyen_dong', move_tank_for: 'chuyen_dong', set_movement_motors: 'chuyen_dong',
    tw_fwd: 'chuyen_dong', tw_rev: 'chuyen_dong', tw_left: 'chuyen_dong', tw_right: 'chuyen_dong',

    stop_motor: 'dong_co', position: 'dong_co', speed: 'dong_co', reset_motor: 'dong_co',
    run_motor: 'dong_co', run_motor_for: 'dong_co', run_motor_to: 'dong_co',

    color_sensor: 'cam_bien', ultrasonic_sensor: 'cam_bien', laser_sensor: 'cam_bien',
    lidar_sensor: 'cam_bien', gyro_sensor: 'cam_bien', reset_gyro: 'cam_bien',
    gps_sensor: 'cam_bien', touch_state: 'cam_bien', wait_for_state: 'cam_bien',
    wait_until_button: 'cam_bien', button_state: 'cam_bien', color: 'cam_bien',
    tw_color: 'cam_bien', camera_capture_image: 'cam_bien', camera_get_rgb: 'cam_bien',
    camera_get_hsv: 'cam_bien', camera_find_blobs: 'cam_bien', time: 'cam_bien',

    say: 'am_thanh', beep: 'am_thanh', play_tone: 'am_thanh',

    penDown: 'but_ve', penUp: 'but_ve', penSetColor: 'but_ve', penSetWidth: 'but_ve',

    sleep: 'dieu_khien', exit: 'dieu_khien', wait_until: 'dieu_khien',

    comment: 'ghi_chu',

    radio_send: 'thu_nghiem', radio_available: 'thu_nghiem', radio_read: 'thu_nghiem',
    radio_read_content: 'thu_nghiem', radio_empty: 'thu_nghiem', object_tracker: 'thu_nghiem',
    plotter_init: 'thu_nghiem', plotter_showHide: 'thu_nghiem', plotter_clear: 'thu_nghiem',
    plotter_setColor: 'thu_nghiem', plotter_setPointSize: 'thu_nghiem', plotter_drawPoint: 'thu_nghiem',
    plotter_drawLine: 'thu_nghiem', plotter_drawTriangle: 'thu_nghiem', plotter_drawGrid: 'thu_nghiem',
  };

  // Nhóm trong toolbox.xml (theo id) → nhóm màu
  self.NHOM_DANH_MUC = {
    Movement: 'chuyen_dong', Conditions: 'dieu_khien',
    Motion: 'chuyen_dong', Motor: 'dong_co', Sensors: 'cam_bien', Sound: 'am_thanh',
    Pen: 'but_ve', Experimental: 'thu_nghiem', Control: 'dieu_khien', Logic: 'dieu_khien',
    Loops: 'dieu_khien', Math: 'phep_toan', Text: 'phep_toan', Lists: 'danh_sach',
    Variables: 'bien', Functions: 'khoi_cua_toi',
  };

  function kieuKhoi(mau) {
    return { colourPrimary: mau[0], colourSecondary: mau[1], colourTertiary: mau[2] };
  }

  this.taoGiaoDienMau = function() {
    let blockStyles = {};
    for (let nhom in self.MAU) {
      blockStyles['sra_' + nhom] = kieuKhoi(self.MAU[nhom]);
    }
    // Khối dựng sẵn của Blockly
    blockStyles.logic_blocks = kieuKhoi(self.MAU.dieu_khien);
    blockStyles.loop_blocks = kieuKhoi(self.MAU.dieu_khien);
    blockStyles.math_blocks = kieuKhoi(self.MAU.phep_toan);
    blockStyles.text_blocks = kieuKhoi(self.MAU.phep_toan);
    blockStyles.list_blocks = kieuKhoi(self.MAU.danh_sach);
    blockStyles.variable_blocks = kieuKhoi(self.MAU.bien);
    blockStyles.variable_dynamic_blocks = kieuKhoi(self.MAU.bien);
    blockStyles.procedure_blocks = kieuKhoi(self.MAU.khoi_cua_toi);
    blockStyles.colour_blocks = kieuKhoi(self.MAU.but_ve);
    blockStyles.hat_blocks = Object.assign(kieuKhoi(self.MAU.su_kien), { hat: 'cap' });

    return Blockly.Theme.defineTheme('sanRobotAo', {
      base: Blockly.Themes.Classic,
      startHats: true,
      blockStyles: blockStyles,
      componentStyles: {
        workspaceBackgroundColour: '#F9F9F9',
        toolboxBackgroundColour: '#FFFFFF',
        flyoutBackgroundColour: '#F2F4F7',
        flyoutOpacity: 1,
        scrollbarColour: '#CECDCE',
      },
      fontStyle: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', weight: '500', size: 12 },
    });
  };

  // ==========================================================================
  // 2. Khối Cơ bản cho lớp 6 (tiền tố sra_)
  // ==========================================================================
  i18n.append({
    '#sra-di#': { en: 'move %1 %2 cm', vi: 'đi %1 %2 cm' },
    '#sra-toi#': { en: 'forward', vi: 'tới' },
    '#sra-lui#': { en: 'backward', vi: 'lùi' },
    '#sra-di_tooltip#': { en: 'Move straight for the given distance, then stop', vi: 'Robot đi thẳng đúng quãng đường này rồi dừng' },
    '#sra-quay#': { en: 'turn %1 %2 degrees', vi: 'quay %1 %2 độ' },
    '#sra-phai#': { en: 'right ↻', vi: 'phải ↻' },
    '#sra-trai#': { en: 'left ↺', vi: 'trái ↺' },
    '#sra-quay_tooltip#': { en: 'Turn on the spot: one wheel forward, the other backward', vi: 'Quay tại chỗ: một bánh quay tới, bánh kia quay lùi' },
    '#sra-chay#': { en: 'keep moving %1', vi: 'đi %1 mãi' },
    '#sra-chay_tooltip#': { en: 'The robot keeps moving until another movement block or stop', vi: 'Robot đi liên tục cho đến khi gặp lệnh di chuyển khác hoặc lệnh dừng' },
    '#sra-dung#': { en: 'stop moving', vi: 'dừng lại' },
    '#sra-xoay#': { en: 'keep turning %1', vi: 'quay %1 mãi' },
    '#sra-xoay_tooltip#': { en: 'The robot keeps turning on the spot until another movement block or stop', vi: 'Robot quay tại chỗ liên tục cho đến khi gặp lệnh di chuyển khác hoặc lệnh dừng' },
    '#sra-quay_banh#': { en: 'spin left wheel %1 right wheel %2 %3', vi: 'quay bánh trái %1 bánh phải %2 %3' },
    '#sra-vong#': { en: 'rotations', vi: 'vòng' },
    '#sra-do#': { en: 'degrees', vi: 'độ' },
    '#sra-quay_banh_tooltip#': { en: 'Spin each wheel by the given amount (negative = backward). No gyro correction: the robot does exactly what the wheels do', vi: 'Quay mỗi bánh đúng số vòng (hoặc số độ) này, số âm là quay lùi. Không có con quay sửa hướng: robot đi đúng như bánh quay' },
    '#sra-chay_banh#': { en: 'run left wheel %1 %% right wheel %2 %%', vi: 'chạy bánh trái %1 %% bánh phải %2 %%' },
    '#sra-chay_banh_tooltip#': { en: 'Run each wheel at its own speed (0 to 100 %, negative = backward) until stop', vi: 'Cho mỗi bánh chạy với tốc độ riêng (0 đến 100 %, số âm là lùi) cho đến lệnh dừng' },
    '#sra-dat_toc_do#': { en: 'set speed to %1 %%', vi: 'đặt tốc độ %1 %%' },
    '#sra-dat_toc_do_tooltip#': { en: 'Speed from 0 to 100 % for the move and turn blocks', vi: 'Tốc độ từ 0 đến 100 % cho các khối đi và quay' },
    '#sra-lap_mai#': { en: 'forever %1 %2', vi: 'lặp mãi %1 %2' },
    '#sra-lap_mai_tooltip#': { en: 'Repeat the blocks inside forever', vi: 'Lặp lại các khối bên trong mãi mãi' },
    '#sra-ha_but#': { en: 'pen down', vi: 'hạ bút' },
    '#sra-nhac_but#': { en: 'pen up', vi: 'nhấc bút' },
    '#sra-mau_but#': { en: 'set pen color to %1', vi: 'đặt màu bút %1' },
    '#sra-net_but#': { en: 'set pen width to %1', vi: 'đặt nét bút dày %1' },
    '#sra-khoang_cach#': { en: 'distance ahead (cm)', vi: 'khoảng cách phía trước (cm)' },
    '#sra-khoang_cach_tooltip#': { en: 'Distance from the ultrasonic sensor to the nearest obstacle', vi: 'Khoảng cách từ cảm biến siêu âm đến vật cản gần nhất' },
    '#sra-thay_mau#': { en: 'color sensor sees %1 ?', vi: 'cảm biến màu thấy %1 ?' },
    '#sra-dang_cham#': { en: 'touch sensor pressed?', vi: 'cảm biến chạm đang bị nhấn?' },
    '#sra-goc_quay#': { en: 'heading (degrees)', vi: 'góc quay (độ)' },
    '#sra-goc_quay_tooltip#': { en: 'How many degrees the robot has turned. Turning right increases it', vi: 'Robot đã quay được bao nhiêu độ. Quay phải thì số tăng' },
    '#sra-dat_lai_goc#': { en: 'reset heading to 0', vi: 'đặt lại góc quay về 0' },
    '#sra-cam#': { en: 'orange', vi: 'cam' },
    '#sra-tim#': { en: 'purple', vi: 'tím' },
    '#sra-hong#': { en: 'pink', vi: 'hồng' },
    '#sra-xam#': { en: 'grey', vi: 'xám' },
    '#sra-co_ban#': { en: 'Basic', vi: 'Cơ bản' },
    '#sra-nang_cao#': { en: 'Advanced', vi: 'Nâng cao' },
    '#sra-che_do_tooltip#': { en: 'Basic: simple blocks for beginners. Advanced: all blocks and Python', vi: 'Cơ bản: ít khối, dễ dùng cho người mới học. Nâng cao: đầy đủ khối và Python' },
  });

  const MAU_BUT = [
    ['#blk-red#', 'DO', '1, 0, 0'],
    ['#sra-cam#', 'CAM', '1, 0.5, 0'],
    ['#blk-yellow#', 'VANG', '1, 0.85, 0'],
    ['#blk-green#', 'XANH_LA', '0, 0.7, 0'],
    ['#blk-blue#', 'XANH_DUONG', '0, 0.3, 1'],
    ['#sra-tim#', 'TIM', '0.6, 0.2, 0.9'],
    ['#sra-hong#', 'HONG', '1, 0.4, 0.7'],
    ['#blk-black#', 'DEN', '0, 0, 0'],
    ['#sra-xam#', 'XAM', '0.5, 0.5, 0.5'],
  ];

  const MAU_CAM_BIEN = [
    ['#blk-black#', 'BLACK'], ['#blk-white#', 'WHITE'], ['#blk-red#', 'RED'],
    ['#blk-green#', 'GREEN'], ['#blk-blue#', 'BLUE'], ['#blk-yellow#', 'YELLOW'], ['#blk-brown#', 'BROWN'],
  ];

  function soVao(ten) {
    return { type: 'input_value', name: ten, check: 'Number' };
  }

  this.dinhNghiaKhoiMoi = function() {
    return [
      {
        type: 'sra_di', message0: '#sra-di#',
        args0: [
          { type: 'field_dropdown', name: 'HUONG', options: [['#sra-toi#', 'TOI'], ['#sra-lui#', 'LUI']] },
          soVao('CM'),
        ],
        inputsInline: true, previousStatement: null, nextStatement: null,
        style: 'sra_chuyen_dong', tooltip: '#sra-di_tooltip#',
      },
      {
        type: 'sra_quay', message0: '#sra-quay#',
        args0: [
          { type: 'field_dropdown', name: 'HUONG', options: [['#sra-phai#', 'PHAI'], ['#sra-trai#', 'TRAI']] },
          soVao('DO'),
        ],
        inputsInline: true, previousStatement: null, nextStatement: null,
        style: 'sra_chuyen_dong', tooltip: '#sra-quay_tooltip#',
      },
      {
        type: 'sra_chay', message0: '#sra-chay#',
        args0: [
          { type: 'field_dropdown', name: 'HUONG', options: [['#sra-toi#', 'TOI'], ['#sra-lui#', 'LUI']] },
        ],
        previousStatement: null, nextStatement: null,
        style: 'sra_chuyen_dong', tooltip: '#sra-chay_tooltip#',
      },
      {
        type: 'sra_xoay', message0: '#sra-xoay#',
        args0: [
          { type: 'field_dropdown', name: 'HUONG', options: [['#sra-phai#', 'PHAI'], ['#sra-trai#', 'TRAI']] },
        ],
        previousStatement: null, nextStatement: null,
        style: 'sra_chuyen_dong', tooltip: '#sra-xoay_tooltip#',
      },
      {
        type: 'sra_dung', message0: '#sra-dung#',
        previousStatement: null, nextStatement: null, style: 'sra_chuyen_dong',
      },
      {
        type: 'sra_quay_banh', message0: '#sra-quay_banh#',
        args0: [
          soVao('TRAI'), soVao('PHAI'),
          { type: 'field_dropdown', name: 'DON_VI', options: [['#sra-vong#', 'VONG'], ['#sra-do#', 'DO']] },
        ],
        inputsInline: true, previousStatement: null, nextStatement: null,
        style: 'sra_dong_co', tooltip: '#sra-quay_banh_tooltip#',
      },
      {
        type: 'sra_chay_banh', message0: '#sra-chay_banh#',
        args0: [soVao('TRAI'), soVao('PHAI')],
        inputsInline: true, previousStatement: null, nextStatement: null,
        style: 'sra_dong_co', tooltip: '#sra-chay_banh_tooltip#',
      },
      {
        type: 'sra_dat_toc_do', message0: '#sra-dat_toc_do#',
        args0: [soVao('TOC_DO')],
        inputsInline: true, previousStatement: null, nextStatement: null,
        style: 'sra_chuyen_dong', tooltip: '#sra-dat_toc_do_tooltip#',
      },
      {
        type: 'sra_lap_mai', message0: '#sra-lap_mai#',
        args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        style: 'sra_dieu_khien', tooltip: '#sra-lap_mai_tooltip#',
      },
      {
        type: 'sra_ha_but', message0: '#sra-ha_but#',
        previousStatement: null, nextStatement: null, style: 'sra_but_ve',
      },
      {
        type: 'sra_nhac_but', message0: '#sra-nhac_but#',
        previousStatement: null, nextStatement: null, style: 'sra_but_ve',
      },
      {
        type: 'sra_mau_but', message0: '#sra-mau_but#',
        args0: [{ type: 'field_dropdown', name: 'MAU', options: MAU_BUT.map(m => [m[0], m[1]]) }],
        previousStatement: null, nextStatement: null, style: 'sra_but_ve',
      },
      {
        type: 'sra_net_but', message0: '#sra-net_but#',
        args0: [soVao('width')],
        inputsInline: true, previousStatement: null, nextStatement: null, style: 'sra_but_ve',
      },
      {
        type: 'sra_khoang_cach', message0: '#sra-khoang_cach#',
        output: 'Number', style: 'sra_cam_bien', tooltip: '#sra-khoang_cach_tooltip#',
      },
      {
        type: 'sra_thay_mau', message0: '#sra-thay_mau#',
        args0: [{ type: 'field_dropdown', name: 'color', options: MAU_CAM_BIEN }],
        output: 'Boolean', style: 'sra_cam_bien',
      },
      {
        type: 'sra_dang_cham', message0: '#sra-dang_cham#',
        output: 'Boolean', style: 'sra_cam_bien',
      },
      {
        type: 'sra_goc_quay', message0: '#sra-goc_quay#',
        output: 'Number', style: 'sra_cam_bien', tooltip: '#sra-goc_quay_tooltip#',
      },
      {
        type: 'sra_dat_lai_goc', message0: '#sra-dat_lai_goc#',
        previousStatement: null, nextStatement: null, style: 'sra_cam_bien',
      },
    ];
  };

  // ---------- Sinh mã Python cho khối mới ----------
  // Lấy kích thước bánh xe của robot đang chọn để đổi cm và độ sang góc quay bánh.
  this.kichThuocRobot = function() {
    let o = (typeof robot != 'undefined' && robot.options) ? robot.options : {};
    let banh = Number(o.wheelDiameter) || 5.6;
    let truc = (Number(o.bodyWidth) || 14) + (Number(o.wheelWidth) || 0.8) + 2 * (Number(o.wheelToBodyOffset) || 0.2);
    let conQuay = null;
    if (typeof robot != 'undefined' && robot.getComponentByPort) {
      for (let i = 1; i <= 10; i++) {
        let c = robot.getComponentByPort('in' + i);
        if (!c) break;
        if (c.type == 'GyroSensor') { conQuay = i; break; }
      }
    }
    return { banh: banh, truc: truc, conQuay: conQuay };
  };

  // Nếu robot có con quay và có mô-đun siro.drivetrain (G2), khối đi/quay dùng bộ
  // điều khiển theo con quay: tăng/giảm tốc dần, giữ hướng, sai số ±1 cm, ±2°.
  // Không có thì giữ cách đổi cm/độ sang góc bánh ở trên.
  this.maDrivetrain = function(k) {
    let ma =
      'def sra_dong_bo_huong():\n' +
      '    pass\n' +
      '\n';
    if (!k.conQuay) return ma;
    return (
      '# Bo dieu khien chinh xac theo con quay (siro.drivetrain), neu co\n' +
      'sra_dt = None\n' +
      'try:\n' +
      '    from siro.drivetrain import Drivetrain\n' +
      '    sra_dt = Drivetrain(gyro_port=\'in' + k.conQuay + '\', wheel_diameter=SRA_BANH_CM, wheel_spacing=SRA_TRUC_CM)\n' +
      'except Exception:\n' +
      '    sra_dt = None\n' +
      '\n' +
      'def sra_dong_bo_huong():\n' +
      '    if sra_dt is not None:\n' +
      '        sra_dt.heading = sra_dt.gyro.angle\n' +
      '\n' +
      'if sra_dt is not None:\n' +
      '    def sra_di(cm):\n' +
      '        if abs(sra_dt.gyro.angle - sra_dt.heading) > 15:\n' +
      '            sra_dong_bo_huong()\n' +
      '        sra_dt.drive_for(cm, sra[\'toc_do\'])\n' +
      '\n' +
      '    def sra_quay(do):\n' +
      '        if abs(sra_dt.gyro.angle - sra_dt.heading) > 15:\n' +
      '            sra_dong_bo_huong()\n' +
      '        sra_dt.turn_for(do, sra[\'toc_do\'])\n' +
      '\n' +
      '    # Chay khong gioi han: tang toc dan 0,3 s co giu huong theo gyro de banh\n' +
      '    # khong truot (bat motor dot ngot o 100% lam robot lech 20-25 do), roi chay deu.\n' +
      '    def sra_chay(huong):\n' +
      '        if abs(sra_dt.gyro.angle - sra_dt.heading) > 15:\n' +
      '            sra_dong_bo_huong()\n' +
      '        v_dich = sra[\'toc_do\'] * huong\n' +
      '        t0 = time.time()\n' +
      '        while time.time() - t0 < 0.3:\n' +
      '            v = v_dich * (0.15 + 0.85 * (time.time() - t0) / 0.3)\n' +
      '            lech = max(-15, min(15, (sra_dt.gyro.angle - sra_dt.heading) * 2.0))\n' +
      '            sra_dt.tank.on(max(-100, min(100, v - lech)), max(-100, min(100, v + lech)))\n' +
      '            time.sleep(0.005)\n' +
      '        sra_dt.tank.on(v_dich, v_dich)\n' +
      '\n'
    );
  };

  // Gọi bộ sinh mã có sẵn của GEARS với các trường đặt sẵn (vd. cổng = AUTO),
  // để khối mới chạy đúng ở cả chế độ ev3dev lẫn Pybricks.
  function uyQuyen(gen, kieu, truong) {
    return function(block) {
      let gia = Object.create(block);
      gia.getFieldValue = function(ten) {
        return (ten in truong) ? truong[ten] : block.getFieldValue(ten);
      };
      return gen.generators[kieu](gia);
    };
  }

  function so(block, ten, macDinh) {
    let ma = Blockly.Python.valueToCode(block, ten, Blockly.Python.ORDER_NONE);
    return ma || macDinh;
  }

  function lenhLapMai(block) {
    let than = Blockly.Python.statementToCode(block, 'DO');
    than = Blockly.Python.addLoopTrap(than, block) || Blockly.Python.PASS;
    return 'while True:\n' + than;
  }

  this.boSinhMa = function(gen) {
    return {
      sra_di: function(block) {
        let dau = block.getFieldValue('HUONG') == 'LUI' ? '-' : '';
        return 'sra_di(' + dau + '(' + so(block, 'CM', '0') + '))\n';
      },
      sra_quay: function(block) {
        let dau = block.getFieldValue('HUONG') == 'TRAI' ? '-' : '';
        return 'sra_quay(' + dau + '(' + so(block, 'DO', '0') + '))\n';
      },
      sra_chay: function(block) {
        return 'sra_chay(' + (block.getFieldValue('HUONG') == 'LUI' ? '-1' : '1') + ')\n';
      },
      sra_xoay: function(block) {
        return 'sra_xoay(' + (block.getFieldValue('HUONG') == 'TRAI' ? '-1' : '1') + ')\n';
      },
      sra_dung: function() {
        return 'sra_dung()\n';
      },
      sra_quay_banh: function(block) {
        let heSo = block.getFieldValue('DON_VI') == 'DO' ? '' : ' * 360';
        return 'sra_quay_banh((' + so(block, 'TRAI', '0') + ')' + heSo + ', (' + so(block, 'PHAI', '0') + ')' + heSo + ')\n';
      },
      sra_chay_banh: function(block) {
        return 'sra_chay_banh(' + so(block, 'TRAI', '0') + ', ' + so(block, 'PHAI', '0') + ')\n';
      },
      sra_dat_toc_do: function(block) {
        return 'sra[\'toc_do\'] = max(0, min(100, ' + so(block, 'TOC_DO', '50') + '))\n';
      },
      sra_lap_mai: lenhLapMai,
      sra_ha_but: uyQuyen(gen, 'penDown', { port: 'AUTO' }),
      sra_nhac_but: uyQuyen(gen, 'penUp', { port: 'AUTO' }),
      sra_mau_but: function(block) {
        let m = MAU_BUT.find(x => x[1] == block.getFieldValue('MAU')) || MAU_BUT[0];
        return 'pen_in' + gen.getPort('AUTO', 'Pen') + '.setColor(' + m[2] + ')\n';
      },
      sra_net_but: uyQuyen(gen, 'penSetWidth', { port: 'AUTO' }),
      sra_khoang_cach: uyQuyen(gen, 'ultrasonic_sensor', { port: 'AUTO', units: 'CM' }),
      sra_thay_mau: function(block) {
        let mau = block.getFieldValue('color');
        let doc = uyQuyen(gen, 'color_sensor', { port: 'AUTO', type: 'COLOR' })(block)[0];
        let ten = uyQuyen(gen, 'color', { color: mau, type: 'NUMBER' })(block)[0];
        return [doc + ' == ' + ten, Blockly.Python.ORDER_RELATIONAL];
      },
      sra_dang_cham: uyQuyen(gen, 'touch_state', { port: 'AUTO', state: 'PRESSED' }),
      sra_goc_quay: uyQuyen(gen, 'gyro_sensor', { port: 'AUTO', type: 'ANGLE' }),
      // Bộ sinh mã Pybricks của GEARS quên tham số angle của reset_angle(), nên tự viết.
      sra_dat_lai_goc: function(block) {
        let ma = gen === pybricks_generator
          ? 'gyro_sensor_in' + gen.getPort('AUTO', 'GyroSensor') + '.reset_angle(0)\n'
          : uyQuyen(gen, 'reset_gyro', { port: 'AUTO' })(block);
        return ma + 'sra_dong_bo_huong()\n';
      },
    };
  };

  // Hàm Python dùng chung, chỉ chèn vào khi chương trình có khối sra_.
  this.maDauEv3dev = function(k) {
    return (
      '# San Robot Ao: lenh co ban (di, quay, dung)\n' +
      'sra = {\'toc_do\': 50}\n' +
      'SRA_BANH_CM = ' + k.banh + '  # duong kinh banh xe\n' +
      'SRA_TRUC_CM = ' + k.truc + '  # khoang cach giua hai banh\n' +
      '\n' +
      'def sra_di(cm):\n' +
      '    goc_banh = abs(cm) * 360 / (math.pi * SRA_BANH_CM)\n' +
      '    v = sra[\'toc_do\'] if cm >= 0 else -sra[\'toc_do\']\n' +
      '    tank_drive.on_for_degrees(v, v, goc_banh)\n' +
      '\n' +
      'def sra_quay(do):\n' +
      '    goc_banh = abs(do) * SRA_TRUC_CM / SRA_BANH_CM\n' +
      '    v = sra[\'toc_do\']\n' +
      '    if do >= 0:\n' +
      '        tank_drive.on_for_degrees(v, -v, goc_banh)\n' +
      '    else:\n' +
      '        tank_drive.on_for_degrees(-v, v, goc_banh)\n' +
      '\n' +
      'def sra_chay(huong):\n' +
      '    v = sra[\'toc_do\'] * huong\n' +
      '    tank_drive.on(v, v)\n' +
      '\n' +
      'def sra_xoay(huong):\n' +
      '    v = sra[\'toc_do\'] * huong\n' +
      '    tank_drive.on(v, -v)\n' +
      '\n' +
      'def sra_dung():\n' +
      '    tank_drive.off(brake=True)\n' +
      '\n' +
      '# Quay tung banh dung so do, khong dung con quay (G5: hieu chinh dong co).\n' +
      '# Toc do moi banh ti le voi so do can quay, tang/giam toc dan theo tien do cua chinh banh do;\n' +
      '# banh nao xong truoc thi dung truoc.\n' +
      'def sra_toc_do_doc(xong, con, vmax):\n' +
      '    return min(vmax, 8 + xong * 0.15, 3 + con * 0.08)\n' +
      '\n' +
      'def sra_quay_banh(trai, phai):\n' +
      '    lon = max(abs(trai), abs(phai))\n' +
      '    if lon < 0.5:\n' +
      '        return\n' +
      '    vmax = max(5, sra[\'toc_do\'])\n' +
      '    l0 = left_motor.position\n' +
      '    r0 = right_motor.position\n' +
      '    while True:\n' +
      '        pl = abs(left_motor.position - l0) / abs(trai) if abs(trai) >= 0.5 else 1\n' +
      '        pr = abs(right_motor.position - r0) / abs(phai) if abs(phai) >= 0.5 else 1\n' +
      '        if pl >= 1 - 0.5 / lon and pr >= 1 - 0.5 / lon:\n' +
      '            break\n' +
      '        vl = 0 if pl >= 1 else sra_toc_do_doc(pl * lon, (1 - pl) * lon, vmax) * trai / lon\n' +
      '        vr = 0 if pr >= 1 else sra_toc_do_doc(pr * lon, (1 - pr) * lon, vmax) * phai / lon\n' +
      '        tank_drive.on(vl, vr)\n' +
      '        time.sleep(0.005)\n' +
      '    tank_drive.off(brake=True)\n' +
      '    time.sleep(0.3)\n' +
      '\n' +
      'def sra_chay_banh(trai, phai):\n' +
      '    tank_drive.on(max(-100, min(100, trai)), max(-100, min(100, phai)))\n' +
      '\n'
    );
  };

  this.maDauPybricks = function(k) {
    return (
      '# San Robot Ao: lenh co ban (di, quay, dung)\n' +
      'import math\n' +
      'sra = {\'toc_do\': 50}\n' +
      'SRA_BANH_CM = ' + k.banh + '  # duong kinh banh xe\n' +
      'SRA_TRUC_CM = ' + k.truc + '  # khoang cach giua hai banh\n' +
      '\n' +
      'def sra_dps():\n' +
      '    return sra[\'toc_do\'] / 100 * 1050\n' +
      '\n' +
      'def sra_di(cm):\n' +
      '    goc_banh = abs(cm) * 360 / (math.pi * SRA_BANH_CM)\n' +
      '    v = sra_dps() if cm >= 0 else -sra_dps()\n' +
      '    move_tank_for_degrees(v, v, goc_banh)\n' +
      '\n' +
      'def sra_quay(do):\n' +
      '    goc_banh = abs(do) * SRA_TRUC_CM / SRA_BANH_CM\n' +
      '    v = sra_dps()\n' +
      '    if do >= 0:\n' +
      '        move_tank_for_degrees(v, -v, goc_banh)\n' +
      '    else:\n' +
      '        move_tank_for_degrees(-v, v, goc_banh)\n' +
      '\n' +
      'def sra_chay(huong):\n' +
      '    v = sra_dps() * huong\n' +
      '    move_tank(v, v)\n' +
      '\n' +
      'def sra_xoay(huong):\n' +
      '    v = sra_dps() * huong\n' +
      '    move_tank(v, -v)\n' +
      '\n' +
      'def sra_dung():\n' +
      '    left_motor.brake()\n' +
      '    right_motor.brake()\n' +
      '\n' +
      'def sra_toc_do_doc(xong, con, vmax):\n' +
      '    return min(vmax, 8 + xong * 0.15, 3 + con * 0.08)\n' +
      '\n' +
      'def sra_quay_banh(trai, phai):\n' +
      '    lon = max(abs(trai), abs(phai))\n' +
      '    if lon < 0.5:\n' +
      '        return\n' +
      '    vmax = max(5, sra[\'toc_do\'])\n' +
      '    l0 = left_motor.angle()\n' +
      '    r0 = right_motor.angle()\n' +
      '    while True:\n' +
      '        pl = abs(left_motor.angle() - l0) / abs(trai) if abs(trai) >= 0.5 else 1\n' +
      '        pr = abs(right_motor.angle() - r0) / abs(phai) if abs(phai) >= 0.5 else 1\n' +
      '        if pl >= 1 - 0.5 / lon and pr >= 1 - 0.5 / lon:\n' +
      '            break\n' +
      '        vl = 0 if pl >= 1 else sra_toc_do_doc(pl * lon, (1 - pl) * lon, vmax) * trai / lon\n' +
      '        vr = 0 if pr >= 1 else sra_toc_do_doc(pr * lon, (1 - pr) * lon, vmax) * phai / lon\n' +
      '        left_motor.run(vl / 100 * 1050)\n' +
      '        right_motor.run(vr / 100 * 1050)\n' +
      '        wait(5)\n' +
      '    left_motor.brake()\n' +
      '    right_motor.brake()\n' +
      '    wait(300)\n' +
      '\n' +
      'def sra_chay_banh(trai, phai):\n' +
      '    left_motor.run(max(-100, min(100, trai)) / 100 * 1050)\n' +
      '    right_motor.run(max(-100, min(100, phai)) / 100 * 1050)\n' +
      '\n'
    );
  };

  this.ganBoSinhMa = function() {
    [[ev3dev2_generator, self.maDauEv3dev], [pybricks_generator, self.maDauPybricks]].forEach(function(cap) {
      let gen = cap[0];
      Object.assign(gen.generators, self.boSinhMa(gen));
      let genCodeGoc = gen.genCode;
      gen.genCode = function() {
        let code = genCodeGoc.apply(gen, arguments);
        if (/\bsra(_[a-z_]+\(|\[)/.test(code)) {
          let moc = '# Here is where your code starts';
          let k = self.kichThuocRobot();
          code = code.replace(moc, cap[1](k) + self.maDrivetrain(k) + moc);
        }
        return code;
      };
    });
    Blockly.Python.addReservedWords('sra_quay_banh,sra_chay_banh,sra_toc_do_doc,sra,sra_di,sra_quay,sra_chay,sra_xoay,sra_dung,sra_dps,sra_dt,sra_dong_bo_huong,Drivetrain,SRA_BANH_CM,SRA_TRUC_CM');
  };

  // ==========================================================================
  // 3. Bảng khối Cơ bản
  // ==========================================================================
  function soBong(ten, gt) {
    return '<value name="' + ten + '"><shadow type="math_number"><field name="NUM">' + gt + '</field></shadow></value>';
  }
  function danhMuc(ten, nhom, noiDung, them) {
    return '<category name="' + ten + '" colour="' + self.MAU[nhom][0] + '" ' + (them || '') + '>' + noiDung + '</category>';
  }

  this.toolboxCoBan = function() {
    let xml =
      '<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">' +
      danhMuc('Chuyển động', 'chuyen_dong',
        '<block type="sra_di"><field name="HUONG">TOI</field>' + soBong('CM', 20) + '</block>' +
        '<block type="sra_di"><field name="HUONG">LUI</field>' + soBong('CM', 20) + '</block>' +
        '<block type="sra_quay"><field name="HUONG">PHAI</field>' + soBong('DO', 90) + '</block>' +
        '<block type="sra_quay"><field name="HUONG">TRAI</field>' + soBong('DO', 90) + '</block>' +
        '<block type="sra_chay"></block>' +
        '<block type="sra_xoay"></block>' +
        '<block type="sra_dung"></block>' +
        '<block type="sra_dat_toc_do">' + soBong('TOC_DO', 50) + '</block>'
      , 'id="sraChuyenDong"') +
      danhMuc('Động cơ', 'dong_co',
        '<block type="sra_quay_banh">' + soBong('TRAI', 1) + soBong('PHAI', 1) + '<field name="DON_VI">VONG</field></block>' +
        '<block type="sra_chay_banh">' + soBong('TRAI', 50) + soBong('PHAI', 50) + '</block>' +
        '<block type="sra_dung"></block>' +
        '<block type="sleep"><field name="units">SECONDS</field>' + soBong('seconds', 1) + '</block>' +
        '<block type="sra_dat_toc_do">' + soBong('TOC_DO', 50) + '</block>'
      , 'id="sraDongCo"') +
      danhMuc('Bút vẽ', 'but_ve',
        '<block type="sra_ha_but"></block>' +
        '<block type="sra_nhac_but"></block>' +
        '<block type="sra_mau_but"></block>' +
        '<block type="sra_net_but">' + soBong('width', 3) + '</block>'
      , 'id="sraButVe"') +
      danhMuc('Âm thanh', 'am_thanh',
        '<block type="beep"><field name="block">BLOCK</field></block>'
      , 'id="sraAmThanh"') +
      danhMuc('Cảm biến', 'cam_bien',
        '<block type="sra_khoang_cach"></block>' +
        '<block type="sra_thay_mau"></block>' +
        '<block type="sra_dang_cham"></block>' +
        '<block type="sra_goc_quay"></block>' +
        '<block type="sra_dat_lai_goc"></block>'
      , 'id="sraCamBien"') +
      danhMuc('Điều khiển', 'dieu_khien',
        '<block type="sleep"><field name="units">SECONDS</field>' + soBong('seconds', 1) + '</block>' +
        '<block type="controls_repeat_ext">' + soBong('TIMES', 4) + '</block>' +
        '<block type="sra_lap_mai"></block>' +
        '<block type="controls_if"></block>' +
        '<block type="controls_if"><mutation else="1"></mutation></block>' +
        '<block type="wait_until"></block>' +
        '<block type="controls_whileUntil"><field name="MODE">UNTIL</field></block>' +
        '<block type="exit"></block>'
      , 'id="sraDieuKhien"') +
      danhMuc('Phép toán', 'phep_toan',
        '<block type="math_arithmetic"><field name="OP">ADD</field>' + soBong('A', 1) + soBong('B', 1) + '</block>' +
        '<block type="math_arithmetic"><field name="OP">MINUS</field>' + soBong('A', 1) + soBong('B', 1) + '</block>' +
        '<block type="math_arithmetic"><field name="OP">MULTIPLY</field>' + soBong('A', 1) + soBong('B', 1) + '</block>' +
        '<block type="math_arithmetic"><field name="OP">DIVIDE</field>' + soBong('A', 1) + soBong('B', 1) + '</block>' +
        '<block type="math_random_int">' + soBong('FROM', 1) + soBong('TO', 10) + '</block>' +
        '<block type="logic_compare"><field name="OP">LT</field>' + soBong('A', 0) + soBong('B', 50) + '</block>' +
        '<block type="logic_compare"><field name="OP">EQ</field>' + soBong('A', 0) + soBong('B', 50) + '</block>' +
        '<block type="logic_compare"><field name="OP">GT</field>' + soBong('A', 0) + soBong('B', 50) + '</block>' +
        '<block type="logic_operation"><field name="OP">AND</field></block>' +
        '<block type="logic_operation"><field name="OP">OR</field></block>' +
        '<block type="logic_negate"></block>' +
        '<block type="math_number"><field name="NUM">0</field></block>'
      , 'id="sraPhepToan"') +
      '<category name="Biến" colour="' + self.MAU.bien[0] + '" custom="VARIABLE2" id="sraBien"></category>' +
      '<category name="Khối của tôi" colour="' + self.MAU.khoi_cua_toi[0] + '" custom="PROCEDURE2" id="sraKhoiCuaToi"></category>' +
      '</xml>';
    let toolbox = (new DOMParser()).parseFromString(xml, 'text/xml').getElementById('toolbox');
    let loc = self.locCoBan || {};
    for (let b of Array.from(toolbox.querySelectorAll('block'))) {
      if ((loc.blocks || []).includes(b.getAttribute('type')) && b.parentNode.tagName == 'category') b.remove();
    }
    for (let c of Array.from(toolbox.querySelectorAll('category'))) {
      if ((loc.categories || []).includes(c.getAttribute('name')) || (loc.categories || []).includes(c.getAttribute('id'))) c.remove();
    }
    return toolbox;
  };

  // Thêm nhóm "Chuyển động dễ" vào bảng khối Nâng cao để chương trình làm ở
  // chế độ Cơ bản vẫn có đủ khối khi chuyển sang Nâng cao.
  this.chinhToolboxNangCao = function(toolboxXml) {
    let toolbox = toolboxXml.getElementById('toolbox');
    if (!toolbox || toolboxXml.getElementById('sraDe')) return;
    for (let cat of toolbox.querySelectorAll('category')) {
      let nhom = self.NHOM_DANH_MUC[cat.getAttribute('id')];
      if (nhom) cat.setAttribute('colour', self.MAU[nhom][0]);
    }
    if (LANG == 'vi') {
      for (let f of toolbox.querySelectorAll('field[name="TEXT"]')) {
        if (f.textContent == 'Hello world') f.textContent = 'Xin chào';
      }
    }
    let coBan = self.toolboxCoBan();
    let de = toolboxXml.createElement('category');
    de.setAttribute('name', i18n.get('#sra-co_ban#') + ' – ' + i18n.get('#blk-motion#'));
    de.setAttribute('id', 'sraDe');
    de.setAttribute('colour', self.MAU.chuyen_dong[0]);
    ['sraChuyenDong', 'sraDongCo', 'sraButVe', 'sraCamBien'].forEach(function(id) {
      coBan.querySelector('[id="' + id + '"]').querySelectorAll(':scope > block').forEach(function(b) {
        // Nhóm Động cơ lặp lại vài khối của nhóm khác cho tiện, chỉ lấy hai khối riêng
        if (id == 'sraDongCo' && !/^sra_(quay|chay)_banh$/.test(b.getAttribute('type'))) return;
        de.appendChild(toolboxXml.importNode(b, true));
      });
    });
    let lap = coBan.querySelector('block[type="sra_lap_mai"]');
    de.appendChild(toolboxXml.importNode(lap, true));
    let motion = toolbox.querySelector('category[id="Motion"]');
    toolbox.insertBefore(de, motion);
  };

  // ==========================================================================
  // 4. Chế độ Cơ bản / Nâng cao
  // ==========================================================================
  this.cheDo = function() {
    try {
      return localStorage.getItem(self.KHOA_CHE_DO) == self.NANG_CAO ? self.NANG_CAO : self.CO_BAN;
    } catch (e) {
      return self.CO_BAN;
    }
  };
  this.laCoBan = function() {
    return self.cheDo() == self.CO_BAN;
  };

  this.datCheDo = function(cheDo) {
    try { localStorage.setItem(self.KHOA_CHE_DO, cheDo); } catch (e) { /* bỏ qua */ }
    self.apDungCheDo();
  };

  this.apDungCheDo = function() {
    let coBan = self.laCoBan();
    document.body.classList.toggle('sra-co-ban', coBan);
    document.body.classList.toggle('sra-nang-cao', !coBan);
    $('.sraCheDo button').each(function() {
      $(this).toggleClass('active', $(this).data('che-do') == self.cheDo());
    });
    if (coBan && $('#navPython').hasClass('active')) {
      $('#navBlocks').click();
    }
    if (blockly.displayedWorkspace) {
      blockly.displayedWorkspace.updateToolbox(coBan ? self.toolboxCoBan() : blockly.toolboxXml.getElementById('toolbox'));
    }
  };

  // ==========================================================================
  // 5. Bọc các hàm của GEARS
  // ==========================================================================
  this.bocBlockly = function() {
    // Nạp gói chữ tiếng Việt của Blockly đúng phiên bản 12.5.1 (GEARS mặc định nạp bản 9.0.0).
    let initGoc = blockly.init;
    blockly.init = function() {
      if (LANG != 'vi') {
        return initGoc.apply(blockly, arguments);
      }
      const script = document.createElement('script');
      script.src = 'blockly-12.5.1/msg/vi.js';
      script.addEventListener('load', function() {
        Object.assign(Blockly.Msg, self.BLOCKLY_MSG_VI);
        blockly.loadCustomBlocks()
          .then(blockly.loadToolBox)
          .then(blockly.generator.load());
      });
      document.head.appendChild(script);
    };

    // Khối của GEARS: đổi màu sang kiểu nhóm, dịch nhãn còn sót, thêm khối sra_.
    blockly.loadCustomBlocks = function() {
      return fetch('customBlocks.json?v=3cd8436f')
        .then(response => response.text())
        .then(function(response) {
          let json = JSON.parse(i18n.replace(response));
          for (let def of json) {
            let nhom = self.NHOM_KHOI[def.type];
            if (nhom) {
              delete def.colour;
              def.style = 'sra_' + nhom;
            }
            if (LANG == 'vi') self.dichKhoi(def);
          }
          let moi = JSON.parse(i18n.replace(JSON.stringify(self.dinhNghiaKhoiMoi())));
          Blockly.defineBlocksWithJsonArray(json.concat(moi));
        });
    };

    // Renderer Zelos (khối tròn kiểu Scratch) và bộ màu mới cho cả hai vùng làm việc.
    let injectGoc = Blockly.inject;
    let theme = null;
    Blockly.inject = function(container, options) {
      theme = theme || self.taoGiaoDienMau();
      options = Object.assign({}, options, { renderer: 'zelos', theme: theme });
      options.zoom = Object.assign({ startScale: 0.75, controls: true, wheel: false }, options.zoom);
      let laVungHien = container == 'blocklyDiv' || (container && container.id == 'blocklyDiv');
      if (laVungHien && blockly.toolboxXml) {
        self.chinhToolboxNangCao(blockly.toolboxXml);
        if (self.laCoBan()) {
          options.toolbox = self.toolboxCoBan();
        }
      }
      return injectGoc.call(Blockly, container, options);
    };

    // Lọc khối theo URL (filterBlocksJSON) chỉ áp dụng cho bảng Nâng cao.
    // Riêng bộ lọc chỉ "deny" (ẩn bớt khối, như trường locKhoi của bài thử thách) thì
    // áp dụng cho bảng Cơ bản và giữ nguyên chế độ (bảng Nâng cao không bị lọc).
    let locGoc = blockly.loadToolboxFilter;
    blockly.loadToolboxFilter = function(filter) {
      if (self.laCoBan() && filter && filter.deny && !filter.allow) {
        self.locCoBan = filter.deny;
        self.apDungCheDo();
        return;
      } else if (self.laCoBan()) {
        self.datCheDo(self.NANG_CAO);
      }
      return locGoc.apply(blockly, arguments);
    };
  };

  // Nhãn chữ cứng trong customBlocks.json (không có khóa dịch)
  self.NHAN_KHOI = {
    'Auto': 'tự động', 'Show': 'hiện', 'Hide': 'ẩn',
    'Black': 'đen', 'Red': 'đỏ', 'Green': 'xanh lá', 'Blue': 'xanh dương', 'Orange': 'cam',
    'Cartesian': 'ô vuông', 'Polar': 'tròn đồng tâm',
  };
  this.dichKhoi = function(def) {
    for (let k in def) {
      if (k.startsWith('message')) {
        def[k] = def[k].replace(/\bgps\b/, 'định vị GPS').replace(' Hz ', ' Hz ').replace(' / s', '/giây');
      }
      if (k.startsWith('args')) {
        for (let a of def[k]) {
          if (a.type == 'field_dropdown') {
            for (let o of a.options) {
              if (typeof o[0] == 'string') {
                o[0] = self.NHAN_KHOI[o[0]] || o[0].replace(' / s', '/giây');
              }
            }
          }
        }
      }
    }
    if (def.type == 'comment') {
      for (let a of def.args0 || []) {
        if (a.text == 'Your comment here') a.text = 'Ghi chú của bạn';
      }
    }
    if (def.tooltip == 'Returns a list of distances in cm') {
      def.tooltip = 'Trả về danh sách khoảng cách theo mọi hướng, tính bằng cm';
    }
  };

  // Sửa vài chữ của Blockly cho gần với cách nói của học sinh lớp 6
  self.BLOCKLY_MSG_VI = {
    ADD_COMMENT: 'Thêm ghi chú',
    REMOVE_COMMENT: 'Xóa ghi chú',
    DELETE_BLOCK: 'Xóa khối',
    DELETE_X_BLOCKS: 'Xóa %1 khối',
    DUPLICATE_BLOCK: 'Nhân bản',
    COLLAPSE_BLOCK: 'Thu gọn khối',
    COLLAPSE_ALL: 'Thu gọn mọi khối',
    EXPAND_BLOCK: 'Mở rộng khối',
    EXPAND_ALL: 'Mở rộng mọi khối',
    DISABLE_BLOCK: 'Tạm tắt khối',
    ENABLE_BLOCK: 'Bật lại khối',
    INLINE_INPUTS: 'Xếp ô nhập trên một hàng',
    EXTERNAL_INPUTS: 'Xếp ô nhập xuống dòng',
    CLEAN_UP: 'Sắp xếp các khối',
    HELP: 'Trợ giúp',
    UNDO: 'Hoàn tác',
    REDO: 'Làm lại',
    CLOSE: 'Đóng',
    COPY_SHORTCUT: 'Sao chép',
    CUT_SHORTCUT: 'Cắt',
    PASTE_SHORTCUT: 'Dán',
    MOVE_BLOCK: 'Di chuyển khối',
    EDIT_BLOCK_CONTENTS: 'Sửa nội dung khối',
    UNKNOWN: 'Không rõ',
    SHORTCUTS_GENERAL: 'Chung',
    SHORTCUTS_EDITING: 'Chỉnh sửa',
    SHORTCUTS_CODE_NAVIGATION: 'Di chuyển trong chương trình',
    HELP_PROMPT: 'Bấm %1 để xem phím tắt',
    KEYBOARD_NAV_COPIED_HINT: 'Đã chép. Bấm %1 để dán.',
    KEYBOARD_NAV_CUT_HINT: 'Đã cắt. Bấm %1 để dán.',
    KEYBOARD_NAV_CONSTRAINED_MOVE_HINT: 'Dùng phím mũi tên để di chuyển, rồi bấm %1 để đặt khối',
    KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT: 'Giữ %1 và dùng phím mũi tên để di chuyển tự do, rồi bấm %2 để đặt khối',
    PROCEDURES_CALL_DISABLED_DEF_WARNING: 'Không chạy được khối "%1" vì khối định nghĩa đang bị tắt.',
    NEW_VARIABLE: 'Tạo biến mới',
    NEW_VARIABLE_TITLE: 'Tên biến mới:',
    RENAME_VARIABLE: 'Đổi tên biến...',
    DELETE_VARIABLE: 'Xóa biến "%1"',
    VARIABLES_SET: 'đặt %1 bằng %2',
    MATH_CHANGE_TITLE: 'tăng %1 thêm %2',
    VARIABLES_DEFAULT_NAME: 'bien',
    CONTROLS_REPEAT_TITLE: 'lặp lại %1 lần',
    CONTROLS_REPEAT_INPUT_DO: '',
    CONTROLS_WHILEUNTIL_INPUT_DO: '',
    CONTROLS_IF_MSG_IF: 'nếu',
    CONTROLS_IF_MSG_THEN: 'thì',
    CONTROLS_IF_MSG_ELSE: 'nếu không thì',
    CONTROLS_IF_MSG_ELSEIF: 'nếu không, nếu',
    CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'lặp lại khi',
    CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'lặp lại cho đến khi',
    CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'thoát khỏi vòng lặp',
    CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'sang lượt lặp tiếp theo',
    LOGIC_BOOLEAN_TRUE: 'đúng',
    LOGIC_BOOLEAN_FALSE: 'sai',
    LOGIC_NEGATE_TITLE: 'không phải %1',
    LOGIC_OPERATION_AND: 'và',
    LOGIC_OPERATION_OR: 'hoặc',
    MATH_RANDOM_INT_TITLE: 'số ngẫu nhiên từ %1 đến %2',
    PROCEDURES_DEFNORETURN_TITLE: 'tạo khối',
    PROCEDURES_DEFRETURN_TITLE: 'tạo khối',
    PROCEDURES_DEFNORETURN_PROCEDURE: 'khối_mới',
    PROCEDURES_DEFRETURN_PROCEDURE: 'khối_mới',
    PROCEDURES_DEFRETURN_RETURN: 'trả về',
    PROCEDURES_BEFORE_PARAMS: 'với:',
    PROCEDURES_CALL_BEFORE_PARAMS: 'với:',
    PROCEDURES_MUTATORCONTAINER_TITLE: 'các đầu vào',
    PROCEDURES_MUTATORARG_TITLE: 'tên đầu vào:',
  };

  // ==========================================================================
  // 6. Chữ tiếng Anh viết cứng trong mã GEARS (menu, hộp thoại, sân)
  // ==========================================================================
  self.CHU_CUNG = {
    'GearsBot': 'Sân Robot Ảo',
    'Project Name': 'Tên chương trình',
    'Blocks': 'Khối lệnh',
    'Simulator': 'Sân mô phỏng',
    'File': 'Tệp',
    'Robot': 'Robot',
    'Worlds': 'Sân',
    'Help': 'Trợ giúp',
    'Save Now': 'Lưu ngay',
    'Main': 'Chính',
    'Clear Console': 'Xóa màn hình kết quả',
    'Ok': 'Đồng ý',
    'OK': 'Đồng ý',
    'Cancel': 'Hủy',
    'Error': 'Lỗi',
    'Errors': 'Lỗi',
    'Close': 'Đóng',
    'About': 'Giới thiệu',
    'Wiki': 'Hướng dẫn GEARS (tiếng Anh)',
    'Github': 'Mã nguồn GEARS gốc',
    'URL Generator': 'Tạo đường dẫn',
    'Ev3dev Mode': 'Kiểu Python ev3dev',
    'Pybricks Mode': 'Kiểu Python Pybricks',
    'Zoom In': 'Phóng to chữ',
    'Zoom Out': 'Thu nhỏ chữ',
    'Reset Zoom': 'Cỡ chữ mặc định',
    'Keyboard Controls': 'Điều khiển bằng bàn phím',
    'Delete File?': 'Xóa tệp?',
    'Rename File': 'Đổi tên tệp',
    'Distance:': 'Khoảng cách:',
    'Angle:': 'Góc:',
    'Alt:': 'Độ cao:',
    'File does not appear to be a valid XML': 'Tệp này không phải chương trình khối hợp lệ',
    'Error loading blocks': 'Lỗi khi mở khối lệnh',
    'Invalid Blocks': 'Khối lệnh không hợp lệ',
    'Type to search for blocks': 'Gõ để tìm khối',

    // Sân và tùy chọn sân
    'Grid Map (20cm)': 'Lưới tọa độ (ô 20 cm)',
    '<p>This is a plain grid map.</p><p>Each large square is 20cm, while each small square is 5cm.</p>':
      '<p>Sân phẳng kẻ lưới.</p><p>Mỗi ô lớn 20 cm, mỗi ô nhỏ 5 cm.</p>',
    'Line Following Challenges': 'Thử thách dò đường',
    '<p>A series of challenges relating to line following.</p><p>Meta challenge: Write a single program that can complete all of the challenges except "Junctions 1".</p>':
      '<p>Chuỗi thử thách robot đi theo vạch kẻ.</p><p>Thử thách lớn: viết một chương trình duy nhất vượt được mọi thử thách, trừ "Ngã ba 1".</p>',
    'Gyro Challenges': 'Thử thách con quay',
    '<p>A series of challenges that focuses on gyro usage.</p>': '<p>Chuỗi thử thách luyện dùng cảm biến con quay.</p>',
    'Maze Map': 'Mê cung',
    '<p>This generates a maze of configurable size.</p><p>See the <a href="https://github.com/QuirkyCort/gears/wiki/Maze-Map" target="_blank">wiki page</a> for some challenges to try out.</p><p>By default, the generated maze is randomized unless you set a random seed.</p>':
      '<p>Tạo mê cung với kích thước tùy chọn.</p><p>Mỗi lần mở là một mê cung ngẫu nhiên, trừ khi bạn nhập mã mê cung.</p>',
    'Custom world': 'Sân tự tạo từ ảnh',
    '<p>This world is automatically generated from the provided image.</p><p>There are many more options available through editing of the JSON file. Please read the wiki for more details.</p>':
      '<p>Sân được tạo từ ảnh bạn đưa vào.</p>',
    'Sumo Challenges': 'Đấu sumo',
    'Football Arena': 'Sân bóng đá',
    'Fire Rescue': 'Giải cứu đám cháy',
    'Missions (FLL, WRO, etc)': 'Sân thi đấu (FLL, WRO…)',
    'Multi-Robot Arena': 'Đấu trường nhiều robot',
    'Length of field (cm)': 'Chiều dài sân (cm)',
    'Width of field (cm)': 'Chiều rộng sân (cm)',
    'Wall': 'Tường bao',
    'Wall Present': 'Có tường bao',
    'Wall Height (cm)': 'Chiều cao tường (cm)',
    'Wall Thickness (cm)': 'Độ dày tường (cm)',
    'Starting Position': 'Vị trí xuất phát',
    'Center': 'Giữa sân',
    'Bottom Left': 'Góc dưới bên trái',
    'Bottom Center': 'Giữa cạnh dưới',
    'Bottom Right': 'Góc dưới bên phải',
    'Player 0': 'Người chơi 0',
    'Player 1': 'Người chơi 1',
    'Player 2': 'Người chơi 2',
    'Player 3': 'Người chơi 3',
    'Starting Position (x, y)': 'Vị trí xuất phát (x, y)',
    'Enter using this format "x, y" (without quotes) and it will override the above. Center of image is "0, 0".':
      'Nhập theo dạng x, y (không cần ngoặc kép). Ô này được ưu tiên hơn lựa chọn ở trên. Tâm sân là 0, 0.',
    'Enter using this format "x, y" (in cm, without quotes) and it will override the above. Center of image is "0, 0".':
      'Nhập theo dạng x, y (đơn vị cm, không cần ngoặc kép). Ô này được ưu tiên hơn lựa chọn ở trên. Tâm sân là 0, 0.',
    'Starting Rotation (degrees)': 'Hướng xuất phát (độ)',
    'Set the starting rotation in degrees. Positive rotation is clockwise.': 'Hướng ban đầu của robot, tính bằng độ. Số dương là quay theo chiều kim đồng hồ.',
    'Select Challenge': 'Chọn thử thách',
    'Simple Curves': 'Đường cong đơn giản',
    'Sharp Turns': 'Khúc cua gắt',
    'Gaps 1': 'Vạch đứt 1',
    'Gaps 2': 'Vạch đứt 2',
    'Obstacles 1': 'Vật cản 1',
    'Obstacles 2': 'Vật cản 2',
    'Obstacles 3': 'Vật cản 3',
    'Obstacles 4': 'Vật cản 4',
    'Junctions 1': 'Ngã ba 1',
    'Junctions 2': 'Ngã ba 2',
    'Straight Run': 'Chạy thẳng',
    'Square Loops': 'Chạy vòng hình vuông',
    'Random Direction': 'Hướng ngẫu nhiên',
    'Width of Straight Run challenge': 'Bề rộng đường chạy thẳng',
    'Maze Type': 'Kiểu mê cung',
    'Perfect': 'Chỉ một đường đi',
    'Imperfect': 'Nhiều đường đi',
    'Number of columns': 'Số cột',
    'Number of rows': 'Số hàng',
    'Cell size (cm)': 'Cỡ ô (cm)',
    'Maze Seed': 'Mã mê cung',
    'Leave this blank to generate a random maze': 'Để trống thì mỗi lần mở là một mê cung ngẫu nhiên',
    'Image URL': 'Đường dẫn ảnh nền',
    'URL for ground image. Will not work with most webhosts; Imgur will work.': 'Đường dẫn tới ảnh làm mặt sân.',
    'Upload Image': 'Tải ảnh lên',
    'This will override both "Image URL". Will not work if map configuration is saved to a file. You must upload it manually everytime.':
      'Ảnh tải lên được ưu tiên hơn đường dẫn ảnh. Ảnh không được lưu cùng tệp sân, mỗi lần mở phải tải lại.',
    'Ground Type': 'Kiểu mặt sân',
    'Walls only work with a Box ground. If None is selected, there will be no ground! This is only useful if a custom object is added to act as the ground.':
      'Tường bao chỉ có với mặt sân hình hộp. Chọn "Không có" thì sân không có mặt đất.',
    'Box': 'Hình hộp',
    'Cylinder': 'Hình trụ',
    'None': 'Không có',
    'Display Timer': 'Hiện đồng hồ',
    'Count up from 0': 'Đếm lên từ 0',
    'Count down from duration': 'Đếm ngược',
    'Timer Duration (s)': 'Thời gian đếm (giây)',
    'At Timer End': 'Khi hết giờ',
    'What will happend when timer ends.': 'Điều gì xảy ra khi hết giờ.',
    'Continue running': 'Chạy tiếp',
    'Stop the timer only': 'Chỉ dừng đồng hồ',
    'Stop the timer and robot': 'Dừng đồng hồ và robot',
    'Image Scale Factor': 'Tỉ lệ phóng ảnh',
    'Scales the image (eg. when set to 2, each pixel will equal 2mm). Default to 1.': 'Phóng to ảnh (vd. đặt 2 thì mỗi điểm ảnh bằng 2 mm). Mặc định là 1.',
    'Starting Position (x, y, z)': 'Vị trí xuất phát (x, y, z)',
    'Enter using this format "x, y, z" (in cm, without quotes) and it will override the above. Center of image is "0, 0, 0".':
      'Nhập theo dạng x, y, z (đơn vị cm, không cần ngoặc kép). Ô này được ưu tiên hơn lựa chọn ở trên. Tâm sân là 0, 0, 0.',
  };

  // Các sân hiện ở chế độ Cơ bản (các sân khác chỉ hiện ở Nâng cao)
  self.SAN_CO_BAN = ['grid', 'lineFollowing', 'gyro', 'maze'];

  // Tên màu cảm biến màu báo về (robotComponents.js)
  self.TEN_MAU = {
    'None': 'không màu', 'Black': 'đen', 'Blue': 'xanh dương', 'Green': 'xanh lá', 'Yellow': 'vàng',
    'Red': 'đỏ', 'White': 'trắng', 'Brown': 'nâu',
  };

  this.dich = function(chu) {
    if (typeof chu != 'string') return chu;
    let t = chu.trim();
    if (t in self.CHU_CUNG) {
      return chu.replace(t, self.CHU_CUNG[t]);
    }
    // Bảng số đo cảm biến: "outA: Động cơ trái" → "Cổng A: Động cơ trái", "in1: ..." → "Cổng 1: ..."
    let cong = t.match(/^(out|in)([A-Z0-9]+): (.*)$/);
    if (cong) {
      return chu.replace(t, 'Cổng ' + cong[2] + ': ' + cong[3]);
    }
    // Ô màu: "6 : White" → "6 : trắng"
    let mau = t.match(/^(-?\d+) : ([A-Za-z]+)$/);
    if (mau && self.TEN_MAU[mau[2]]) {
      return chu.replace(t, mau[1] + ' : ' + self.TEN_MAU[mau[2]]);
    }
    return chu;
  };

  // Dịch thẳng vào dữ liệu sân để hộp chọn sân hiện tiếng Việt.
  this.dichSan = function() {
    if (typeof worlds == 'undefined') return;
    for (let w of worlds) {
      w.shortDescription = self.dich(w.shortDescription);
      w.longDescription = self.dich(w.longDescription);
      for (let o of (w.optionsConfigurations || [])) {
        o.title = self.dich(o.title);
        if (o.help) o.help = self.dich(o.help);
        if (o.label) o.label = self.dich(o.label);
        for (let x of (o.options || [])) {
          if (Array.isArray(x)) x[0] = self.dich(x[0]);
        }
      }
    }
  };

  // Dịch chữ cứng còn lại trên trang (menu, hộp thoại, bảng đo...).
  this.dichNut = function(node) {
    if (node.nodeType == Node.TEXT_NODE) {
      let moi = self.dich(node.nodeValue);
      if (moi != node.nodeValue) node.nodeValue = moi;
      return;
    }
    if (node.nodeType != Node.ELEMENT_NODE) return;
    if (node.closest && node.closest('.ace_editor, .console .content, svg')) return;
    for (let attr of ['placeholder', 'title']) {
      if (node.hasAttribute && node.hasAttribute(attr)) {
        let moi = self.dich(node.getAttribute(attr));
        if (moi != node.getAttribute(attr)) node.setAttribute(attr, moi);
      }
    }
    for (let con of node.childNodes) self.dichNut(con);
  };

  this.theoDoiTrang = function() {
    self.dichNut(document.body);
    document.title = self.TEN_SAN_PHAM;
    let quanSat = new MutationObserver(function(thayDoi) {
      for (let td of thayDoi) {
        if (td.type == 'characterData') {
          self.dichNut(td.target);
        } else {
          for (let n of td.addedNodes) self.dichNut(n);
        }
      }
    });
    quanSat.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  // ==========================================================================
  // 7. Menu, đầu trang, hộp thoại
  // ==========================================================================
  // Mục menu ẩn ở chế độ Cơ bản
  this.mucAnCoBan = function() {
    return [
      '#main-load_python#', '#main-save_python#', '#main-export_zip#', '#main-import_zip#',
      '#main-robot_configurator#', '#main-world_builder#', '#main-arena#',
      '#main-whats_new#', '#main-display_fps#', '#main-privacy#',
      '#main-display_position#', '#main-save_position#', '#main-clear_position#',
      '#blockly-move_selected#',
    ].map(k => i18n.get(k)).concat(['Wiki', 'Github', 'URL Generator']);
  };

  this.bocMenu = function() {
    let menuGoc = window.menuDropDown;
    window.menuDropDown = function($menuBtn, menuItems, options) {
      if (LANG == 'vi' || self.laCoBan()) {
        let an = self.laCoBan() ? self.mucAnCoBan() : [];
        menuItems = menuItems.filter(function(m) {
          let chu = String(m.html).replace(/<span class="tick">.*?<\/span>\s*/, '');
          return an.indexOf(chu) == -1;
        });
        if (LANG == 'vi') {
          menuItems = menuItems.map(m => Object.assign({}, m, { html: self.dich(m.html) }));
        }
      }
      return menuGoc($menuBtn, menuItems, options);
    };

    // Tên chương trình: GEARS chỉ giữ chữ không dấu, nên "Bài 1 đi tới" thành "Bi 1 i ti". Cho phép chữ có dấu.
    main.saveProjectName = function() {
      let ten = main.$projectName.val().replace(/[^\p{L}\p{N}_\- ]/gu, '').trim();
      main.$projectName.val(ten);
      localStorage.setItem('projectName', ten);
    };
    main.$projectName.off('change').change(main.saveProjectName);

    // Thêm Tiếng Việt vào menu ngôn ngữ
    main.toggleLanguageMenu = function(e) {
      if ($('.languageMenuDropDown').length == 0) {
        $('.menuDropDown').remove();
        e.stopPropagation();
        function setLang(lang) {
          localStorage.setItem('LANG', lang);
          window.location.reload();
        }
        let ds = [['vi', 'Tiếng Việt'], ['de', 'Deutsch'], ['el', 'Ελληνικά'], ['en', 'English'],
          ['es', 'Español'], ['fr', 'Français'], ['ko', '한국어'], ['he', 'עברית'], ['nl', 'Nederlands'],
          ['pt', 'Português'], ['ru', 'Русский'], ['hu', 'Magyar'], ['it', 'Italiano']];
        let menuItems = ds.map(d => ({ html: d[1], line: d[0] == 'vi', callback: function() { setLang(d[0]); } }));
        menuDropDown(main.$languageMenu, menuItems, { className: 'languageMenuDropDown', align: 'right' });
      }
    };
    main.$languageMenu.off('click').click(main.toggleLanguageMenu);

    // Chỉ hiện "Có gì mới" (tiếng Anh) khi người dùng tự mở.
    let whatsNewGoc = main.showWhatsNew;
    main.showWhatsNew = function(forceShow) {
      if (forceShow === true) return whatsNewGoc.call(main, true);
    };
    $('.dialogScreen').has('.whatsNew, h3').each(function() {
      // GEARS đã mở hộp "What's New" lúc main.init(); đóng lại.
      if ($(this).text().indexOf('Omni Wheels') != -1) $(this).remove();
    });

    // Hộp Giới thiệu bằng tiếng Việt, giữ đầy đủ ghi công GEARS theo GPL v3.
    main.openAbout = function() {
      let $body = $(
        '<div class="about">' +
          '<h3>' + self.TEN_SAN_PHAM + '</h3>' +
          '<p>Giả lập robot lập trình bằng khối lệnh và Python, chạy trên trình duyệt, dành cho học sinh THCS.</p>' +
          '<p>Tên "Sân Robot Ảo" là tên tạm. Dự án không liên kết với VEX Robotics, Innovation First hay LEGO.</p>' +
          '<h3>Dựa trên GEARS (GearsBot)</h3>' +
          '<p>Sân Robot Ảo là bản phái sinh của <a href="https://github.com/QuirkyCort/gears" target="_blank">GEARS</a>, ' +
          'do Cort Wee @ <a href="https://aposteriori.com.sg" target="_blank">A Posteriori</a> tạo ra.</p>' +
          '<p>Người đóng góp cho GEARS: Steven Murray, humbug99, Yuvix25 và nhiều người khác.</p>' +
          '<p>GEARS được xây trên <a href="https://www.babylonjs.com/" target="_blank">Babylon.js</a>, ' +
          '<a href="https://developers.google.com/blockly" target="_blank">Blockly</a>, ' +
          '<a href="https://ace.c9.io/" target="_blank">Ace Editor</a>, ' +
          '<a href="https://skulpt.org/" target="_blank">Skulpt</a> và ' +
          '<a href="https://github.com/kripken/ammo.js/" target="_blank">Ammo.js</a>.</p>' +
          '<h3>Giấy phép</h3>' +
          '<p>GNU General Public License phiên bản 3 (GPL v3). Phần mềm tự do, mã nguồn mở: ' +
          'bạn được dùng, sửa và chia sẻ lại, miễn là giữ cùng giấy phép và công khai mã nguồn.</p>' +
          '<p>Copyright (C) 2020 Cort Wee. Phần chỉnh sửa: Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo.</p>' +
        '</div>'
      );
      let $buttons = $('<button type="button" class="confirm btn-success">Đồng ý</button>');
      let $dialog = dialog('Giới thiệu', $body, $buttons);
      $buttons.click(function() { $dialog.close(); });
    };

    // Chọn sân: ở chế độ Cơ bản chỉ hiện các sân học tập.
    let chonSanGoc = simPanel.selectWorld;
    simPanel.$world.off('click', chonSanGoc);
    simPanel.$world.click(function() { simPanel.selectWorld(); });
    simPanel.selectWorld = function() {
      if (!self.laCoBan()) return chonSanGoc.apply(simPanel, arguments);
      let tatCa = worlds;
      worlds = tatCa.filter(w => self.SAN_CO_BAN.indexOf(w.name) != -1);
      try {
        return chonSanGoc.apply(simPanel, arguments);
      } finally {
        worlds = tatCa;
      }
    };
  };

  // Tên sản phẩm và công tắc chế độ ở đầu trang
  this.dauTrang = function() {
    $('header > div').first().text(self.TEN_SAN_PHAM);
    $('header .gearsIcon').attr('alt', self.TEN_SAN_PHAM);
    let $cong = $(
      '<div class="sraCheDo" role="group">' +
        '<button type="button" data-che-do="' + self.CO_BAN + '"></button>' +
        '<button type="button" data-che-do="' + self.NANG_CAO + '"></button>' +
      '</div>'
    );
    $cong.attr('title', i18n.get('#sra-che_do_tooltip#'));
    $cong.find('button').eq(0).text(i18n.get('#sra-co_ban#'));
    $cong.find('button').eq(1).text(i18n.get('#sra-nang_cao#'));
    $cong.find('button').click(function() {
      self.datCheDo($(this).data('che-do'));
    });
    $cong.insertBefore('header .language');

    let css =
      '.sraCheDo{display:inline-flex;margin:0 12px;border:1px solid rgba(255,255,255,.6);border-radius:16px;overflow:hidden;vertical-align:middle}' +
      '.sraCheDo button{background:transparent;color:inherit;border:0;padding:4px 12px;font:inherit;font-size:14px;cursor:pointer}' +
      '.sraCheDo button.active{background:#fff;color:#0b5394;font-weight:600}' +
      'body.sra-co-ban #navPython, body.sra-co-ban .pythonMenu{display:none !important}';
    $('<style id="sraCss"></style>').text(css).appendTo('head');
  };

  // ==========================================================================
  // 8. Thông báo lỗi Python trong khung kết quả
  // ==========================================================================
  self.LOI_PYTHON = [
    [/^SystemExit:.*$/, function() { return 'Chương trình đã dừng.'; }],
    [/^NameError: name '([^']+)' is not defined on line (\d+)/, function(m) {
      if (/_sensor_in|pen_in/.test(m[1])) {
        return 'Lỗi: robot này không có bộ phận "' + m[1] + '" (dòng ' + m[2] + '). Hãy chọn robot có đủ cảm biến (menu Robot → Chọn robot).';
      }
      return 'Lỗi: chưa có tên "' + m[1] + '" (dòng ' + m[2] + '). Có thể bạn dùng biến chưa đặt giá trị.';
    }],
    [/^ZeroDivisionError:.*on line (\d+)/, function(m) { return 'Lỗi: chia cho 0 (dòng ' + m[1] + ').'; }],
    [/^TypeError:(.*)on line (\d+)/, function(m) { return 'Lỗi: sai kiểu dữ liệu, ví dụ đem chữ cộng với số (dòng ' + m[2] + '). Chi tiết:' + m[1]; }],
    [/^ValueError:(.*)on line (\d+)/, function(m) { return 'Lỗi: giá trị không hợp lệ (dòng ' + m[2] + '). Chi tiết:' + m[1]; }],
    [/^(\w+Error):(.*)$/, function(m) { return 'Lỗi (' + m[1] + '):' + m[2]; }],
  ];

  this.dichLoi = function(text) {
    let t = String(text).trim();
    for (let cap of self.LOI_PYTHON) {
      let m = t.match(cap[0]);
      if (m) return cap[1](m);
    }
    return text;
  };

  this.bocKhungKetQua = function() {
    let ghiLoiGoc = simPanel.consoleWriteErrors;
    simPanel.consoleWriteErrors = function(text) {
      return ghiLoiGoc.call(simPanel, self.dichLoi(text));
    };
  };

  // ==========================================================================
  // Khởi động
  // ==========================================================================
  this.khoiDong = function() {
    // Motor yếu và gia tốc bánh (gói G5), chạy cả ở chế độ tự do lẫn thử thách
    let dongCo = document.createElement('script');
    dongCo.src = 'san-robot-ao/dong-co.js';
    document.body.appendChild(dongCo);
    self.ganBoSinhMa();
    self.bocBlockly();
    if (LANG == 'vi') {
      self.dichSan();
      // Hai nhãn còn viết cứng trong mô tả robot
      for (let t of robotTemplates) {
        if (t.longerDescription) {
          t.longerDescription = t.longerDescription
            .replace(/: Pen</g, ': #robot-pen#<')
            .replace(/: GPS</g, ': Định vị (GPS)<');
        }
      }
      // GEARS đã gán chữ cho vài nút trước khi tệp này chạy; gán lại.
      main.updateTextLanguage();
      blocklyPanel.updateTextLanguage();
    }
    self.bocMenu();
    self.dauTrang();
    self.apDungCheDo();
    if (LANG == 'vi') {
      self.bocKhungKetQua();
      self.theoDoiTrang();
    }
  };

  self.khoiDong();
};
