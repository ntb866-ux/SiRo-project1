// Sân Robot Ảo – chia vùng làm việc trong bài: thu gọn bảng thông tin bài,
// kéo thanh chia giữa vùng lập trình (khối / Python) và sân mô phỏng (có bảng lắp ráp xe).
// Kích thước được nhớ trong localStorage. GPL v3.
(function() {
  const KHOA = 'sra.chiaVung';
  const MAC_DINH = { ngang: 52, doc: 50, khungThu: false };
  const NGANG = [22, 78];       // % rộng vùng lập trình khi kéo
  const DOC = [20, 80];         // % cao vùng lập trình khi xếp dọc (màn hẹp)
  let tt = Object.assign({}, MAC_DINH);
  try { Object.assign(tt, JSON.parse(localStorage.getItem(KHOA) || '{}')); } catch (e) {}

  function luu() { try { localStorage.setItem(KHOA, JSON.stringify(tt)); } catch (e) {} }
  function kep(x, [a, b]) { return Math.max(a, Math.min(b, x)); }
  function xepDoc() { return window.matchMedia('(max-width: 900px)').matches; }
  function baoDoiKichThuoc() { window.dispatchEvent(new Event('resize')); }
  let hen = 0;
  function baoDoiNhe() { if (!hen) hen = requestAnimationFrame(function() { hen = 0; baoDoiKichThuoc(); }); }

  function ap() {
    let b = document.body;
    b.style.setProperty('--sra-ti-le-khoi', tt.ngang + '%');
    b.style.setProperty('--sra-ti-le-doc', tt.doc + '%');
    b.classList.toggle('sra-khung-thu', !!tt.khungThu);
    let nut = document.querySelector('#sraKhung .sra-thu-nut');
    if (nut) {
      nut.setAttribute('aria-expanded', tt.khungThu ? 'false' : 'true');
      nut.title = tt.khungThu ? sraT('Mở bảng thông tin bài', 'Show lesson info') : sraT('Thu gọn bảng thông tin bài', 'Collapse lesson info');
    }
    let ch = document.getElementById('sraChia');
    if (ch) {
      let doc = xepDoc();
      ch.setAttribute('aria-orientation', doc ? 'horizontal' : 'vertical');
      ch.setAttribute('aria-valuenow', Math.round(doc ? tt.doc : tt.ngang));
    }
  }

  function datThuGon(thu) {
    tt.khungThu = thu; luu(); ap();
    setTimeout(baoDoiKichThuoc, 30);
  }

  function datTiLe(x) {
    if (xepDoc()) tt.doc = kep(x, DOC); else tt.ngang = kep(x, NGANG);
    luu(); ap(); baoDoiNhe();
  }
  function tiLeHienTai() { return xepDoc() ? tt.doc : tt.ngang; }

  function dung() {
    let khung = document.getElementById('sraKhung');
    let panels = document.querySelector('main .panels');
    if (!khung || !panels || document.getElementById('sraChia')) return !!document.getElementById('sraChia');

    // Nút thu gọn nằm ở đầu bảng thông tin
    let nut = document.createElement('button');
    nut.type = 'button'; nut.className = 'sra-thu-nut';
    nut.innerHTML = '<span class="mui" aria-hidden="true"></span><span class="chu">' + sraT('Đề bài', 'Lesson') + '</span>';
    nut.addEventListener('click', function() { datThuGon(!tt.khungThu); });
    khung.insertBefore(nut, khung.firstChild);

    // Thanh chia giữa vùng lập trình và sân
    let ch = document.createElement('div');
    ch.id = 'sraChia'; ch.setAttribute('role', 'separator'); ch.tabIndex = 0;
    ch.setAttribute('aria-valuemin', 22); ch.setAttribute('aria-valuemax', 78);
    ch.setAttribute('aria-label', sraT('Kéo để đổi chỗ giữa vùng lập trình và sân mô phỏng', 'Drag to trade space between coding area and simulator'));
    ch.innerHTML =
      '<button type="button" class="sra-chia-nut sra-chia-ve-sau" tabindex="-1" title="' + sraT('Cho sân mô phỏng rộng hơn', 'Give the simulator more room') + '">◂</button>' +
      '<span class="sra-chia-tay" aria-hidden="true"></span>' +
      '<button type="button" class="sra-chia-nut sra-chia-ve-truoc" tabindex="-1" title="' + sraT('Cho vùng lập trình rộng hơn', 'Give the coding area more room') + '">▸</button>';
    panels.appendChild(ch);

    let keo = false;
    ch.addEventListener('pointerdown', function(e) {
      if (e.target.closest('.sra-chia-nut') || e.button > 0) return;
      keo = true; ch.setPointerCapture(e.pointerId);
      document.body.classList.add('sra-dang-chia');
      e.preventDefault();
    });
    ch.addEventListener('pointermove', function(e) {
      if (!keo) return;
      let r = panels.getBoundingClientRect();
      datTiLe(xepDoc() ? (e.clientY - r.top) / r.height * 100 : (e.clientX - r.left) / r.width * 100);
    });
    function thoi(e) {
      if (!keo) return;
      keo = false; document.body.classList.remove('sra-dang-chia');
      try { ch.releasePointerCapture(e.pointerId); } catch (x) {}
      baoDoiKichThuoc();
    }
    ch.addEventListener('pointerup', thoi);
    ch.addEventListener('pointercancel', thoi);
    ch.addEventListener('dblclick', function(e) {
      if (e.target.closest('.sra-chia-nut')) return;
      datTiLe(xepDoc() ? MAC_DINH.doc : MAC_DINH.ngang);
    });
    ch.addEventListener('keydown', function(e) {
      let doc = xepDoc(), buoc = e.shiftKey ? 10 : 2, t = tiLeHienTai();
      let giam = doc ? 'ArrowUp' : 'ArrowLeft', tang = doc ? 'ArrowDown' : 'ArrowRight';
      if (e.key == giam) t -= buoc; else if (e.key == tang) t += buoc;
      else if (e.key == 'Home') t = 0; else if (e.key == 'End') t = 100;
      else if (e.key == 'Enter') t = doc ? MAC_DINH.doc : MAC_DINH.ngang;
      else return;
      e.preventDefault(); datTiLe(t);
    });
    // Hai nút mũi tên: nhường hẳn chỗ cho một bên; bấm lần nữa thì về mặc định
    function nhuong(muc, mac) {
      let t = tiLeHienTai();
      datTiLe(Math.abs(t - muc) < 1 ? mac : muc);
    }
    ch.querySelector('.sra-chia-ve-sau').addEventListener('click', function() { nhuong(xepDoc() ? DOC[0] : NGANG[0], xepDoc() ? MAC_DINH.doc : MAC_DINH.ngang); });
    ch.querySelector('.sra-chia-ve-truoc').addEventListener('click', function() { nhuong(xepDoc() ? DOC[1] : NGANG[1], xepDoc() ? MAC_DINH.doc : MAC_DINH.ngang); });

    window.matchMedia('(max-width: 900px)').addListener(function() { ap(); baoDoiNhe(); });
    ap();
    setTimeout(baoDoiKichThuoc, 50);
    return true;
  }

  (function cho() { if (!dung()) setTimeout(cho, 150); })();
  window.SRA = window.SRA || {};
  SRA.chiaVung = { thuGon: datThuGon, datTiLe: datTiLe, trangThai: function() { return Object.assign({}, tt); } };
})();
