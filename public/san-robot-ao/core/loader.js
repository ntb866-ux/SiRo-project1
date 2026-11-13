// Sân Robot Ảo – nạp khung thử thách khi trang GEARS mở với ?baiTap=<mã-bài>.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
// Không có ?baiTap thì tệp này không làm gì, GEARS chạy như bản gốc.
(function() {
  let id = new URLSearchParams(location.search).get('baiTap');
  if (!id) return;

  // Chỉ cho phép mã bài dạng thu-muc/ten-bai (chữ thường, số, gạch nối)
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(id)) {
    console.error('[Sân Robot Ảo] Mã bài không hợp lệ:', id);
    return;
  }

  const GOC = 'san-robot-ao/core/';
  const PB = '?v=1';

  let css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = GOC + 'thu-thach.css' + PB;
  document.head.appendChild(css);
  document.body.classList.add('sra-che-do');

  // Đóng hộp "What's New" của GEARS (loader chạy ngay sau main.init nên lúc này
  // chỉ có hộp đó đang mở) để học sinh vào thẳng bài.
  if (typeof $ != 'undefined') $('.dialogScreen').find('button.ok').click();

  function napScript(ten) {
    return new Promise(function(xong, loi) {
      let s = document.createElement('script');
      s.src = GOC + ten + PB;
      s.onload = xong;
      s.onerror = loi;
      document.body.appendChild(s);
    });
  }

  function choSanSang() {
    return new Promise(function(xong) {
      (function kiemTra() {
        if (
          typeof babylon != 'undefined' && babylon.scene && babylon.scene.isReady()
          && typeof blockly != 'undefined' && blockly.workspace && blockly.displayedWorkspace
        ) {
          // Đợi thêm để GEARS nạp xong chương trình cũ từ bộ nhớ trước khi ta thay
          setTimeout(xong, 800);
        } else {
          setTimeout(kiemTra, 100);
        }
      })();
    });
  }

  napScript('star-rules.js')
    .then(() => napScript('records.js'))
    .then(() => napScript('giao-dien.js'))
    .then(() => napScript('challenge-engine.js'))
    .then(() => napScript('net-ve.js'))
    .then(() => napScript('vat-li-san.js'))
    .then(choSanSang)
    .then(() => SRA.napBai(id))
    .catch(function(e) {
      console.error('[Sân Robot Ảo]', e);
      let p = document.createElement('div');
      p.className = 'sra-loi';
      p.textContent = 'Không mở được bài "' + id + '". ' + (e && e.message ? e.message : '');
      document.body.appendChild(p);
    });
})();
