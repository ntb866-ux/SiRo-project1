// Sân Robot Ảo – trang chọn bài: đọc thu-thach/danh-sach.json và từng tệp bài,
// hiện các chặng, số sao đã đạt và khóa bài nếu chặng yêu cầu làm theo thứ tự.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Giáo viên mở mọi bài bị khóa bằng cách thêm ?moKhoa=1 vào địa chỉ trang.

(function() {
  const moKhoaTatCa = new URLSearchParams(location.search).get('moKhoa') == '1';

  // Chữ cố định của trang theo ngôn ngữ (cùng khoá LANG với trang chính)
  const CHU = {
    tieuDe: ['Chọn bài', 'Choose a lesson'],
    gioiThieu: ['Chọn một bài để bắt đầu. Mỗi bài có 3 sao, tiến độ được lưu ngay trên máy này.', 'Choose a lesson to start. Each lesson has 3 stars, and your progress is saved on this device.'],
    dangTai: ['Đang tải danh sách bài…', 'Loading lessons…'],
    xuat: ['Tải tiến độ về máy (.json)', 'Download progress (.json)'],
    xoa: ['Xóa tiến độ trên máy này', 'Clear progress on this device'],
    tuDo: ['Lập trình tự do', 'Free programming'],
    chuThich: ['Tiến độ chỉ lưu trong trình duyệt này. Đổi máy, dùng chế độ ẩn danh hoặc xóa dữ liệu trình duyệt thì tiến độ sẽ mất. ' +
      'Sân Robot Ảo dựa trên <a href="https://github.com/QuirkyCort/gears" target="_blank" rel="noopener">GEARS</a> (GPL v3), không liên kết với VEX Robotics hay LEGO.',
      'Progress is saved only in this browser. Switching devices, using a private window or clearing browser data will lose it. ' +
      'Sân Robot Ảo is based on <a href="https://github.com/QuirkyCort/gears" target="_blank" rel="noopener">GEARS</a> (GPL v3) and is not affiliated with VEX Robotics or LEGO.'],
  };
  const chu = (k) => sraT(CHU[k][0], CHU[k][1]);
  const en = !sraLaTiengViet();
  document.documentElement.lang = en ? 'en' : 'vi';
  document.title = chu('tieuDe') + ' · Sân Robot Ảo';
  document.querySelectorAll('[data-chu]').forEach(function(e) {
    if (e.getAttribute('data-chu') == 'chuThich') e.innerHTML = chu('chuThich');
    else e.textContent = chu(e.getAttribute('data-chu'));
  });
  document.querySelectorAll('.ngon-ngu button').forEach(function(b) {
    let dang = b.getAttribute('data-lang') == (en ? 'en' : 'vi');
    b.classList.toggle('dang-chon', dang);
    b.setAttribute('aria-pressed', dang);
    b.addEventListener('click', function() {
      try { localStorage.setItem('LANG', b.getAttribute('data-lang')); } catch (e) {}
      location.reload();
    });
  });

  function an(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function sao(n) {
    let h = '';
    for (let i = 0; i < 3; i++) h += '<span class="sao' + (i < n ? ' dat' : '') + '">' + (i < n ? '★' : '☆') + '</span>';
    return '<span class="hang-sao" aria-label="' + sraT(n + ' trên 3 sao', n + ' of 3 stars') + '">' + h + '</span>';
  }

  function docJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(url + ' (' + r.status + ')');
      return r.json();
    });
  }

  async function ve() {
    let $ds = document.getElementById('danhSach');
    let danhSach;
    try {
      danhSach = await docJSON('thu-thach/danh-sach.json');
    } catch (e) {
      $ds.innerHTML = '<p class="loi">' + sraT('Không tải được danh sách bài: ', 'Could not load the lesson list: ') + an(e.message) + '</p>';
      return;
    }

    // Đọc tiêu đề các bài song song
    let ids = [];
    danhSach.chang.forEach(c => c.bai.forEach(b => ids.push(b)));
    let bai = {};
    await Promise.all(ids.map(id =>
      docJSON('thu-thach/' + id + '.json')
        .then(d => { bai[id] = d; })
        .catch(() => { bai[id] = null; })
    ));

    let tienDo = SRA.tienDo.tatCa();
    let tongSao = 0, toiDa = 0;
    let html = '';
    danhSach.chang.forEach(function(c, ci) {
      let saoChang = 0;
      let the = '';
      c.bai.forEach(function(id, bi) {
        let d = bai[id];
        let td = tienDo[id] || {};
        let n = td.sao || 0;
        saoChang += n; tongSao += n; toiDa += 3;
        let truoc = bi > 0 ? (tienDo[c.bai[bi - 1]] || {}).sao || 0 : 1;
        let khoa = c.moKhoaTuanTu && !moKhoaTatCa && truoc < 1;
        if (!d) {
          the += '<div class="the loi-bai"><div class="so">' + (bi + 1) + '</div><div><b>' + an(id) + '</b><br>' + sraT('Không đọc được tệp bài.', 'Could not read the lesson file.') + '</div></div>';
          return;
        }
        let lop = 'the' + (khoa ? ' khoa' : '') + (n == 3 ? ' du-sao' : '');
        let noiDung =
          '<div class="so">' + (bi + 1) + '</div>' +
          '<div class="chu"><div class="ten">' + an(en && d.tieuDeEn || d.tieuDe) + '</div>' +
          (khoa ? '<div class="phu">🔒 ' + sraT('Đạt ít nhất 1 sao ở bài trước để mở', 'Earn at least 1 star in the previous lesson to unlock') + '</div>'
                : '<div class="phu">' + sao(n) + (td.soLanChay ? ' · ' + td.soLanChay + sraT(' lần chạy', td.soLanChay == 1 ? ' run' : ' runs') : '') + '</div>') +
          '</div>';
        if (khoa) the += '<div class="' + lop + '">' + noiDung + '</div>';
        else the += '<a class="' + lop + '" href="../index.html?baiTap=' + encodeURIComponent(id) + '">' + noiDung + '</a>';
      });
      html +=
        '<section class="chang">' +
          '<div class="dau-chang"><h2>' + an(en && c.tenEn || c.ten) + '</h2><span class="dem">' + saoChang + ' / ' + (c.bai.length * 3) + ' ★</span></div>' +
          (c.moTa ? '<p class="mo-ta">' + an(en && c.moTaEn || c.moTa) + '</p>' : '') +
          '<div class="luoi">' + the + '</div>' +
        '</section>';
    });
    $ds.innerHTML = html;
    document.getElementById('tongKet').innerHTML = '<span class="to">' + tongSao + '</span> / ' + toiDa + ' ★';
  }

  document.getElementById('nutXuat').addEventListener('click', function() {
    let a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(SRA.tienDo.xuat());
    a.download = 'tien-do-san-robot-ao.json';
    a.click();
  });

  document.getElementById('nutXoa').addEventListener('click', function() {
    if (confirm(sraT('Xóa toàn bộ sao và bài làm đã lưu trên máy này? Không thể hoàn tác.', 'Delete all stars and saved work on this device? This cannot be undone.'))) {
      SRA.tienDo.xoaTatCa();
      ve();
    }
  });

  ve();
})();
