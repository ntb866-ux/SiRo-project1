// Sân Robot Ảo – trang chọn bài: đọc thu-thach/danh-sach.json và từng tệp bài,
// hiện các chặng, số sao đã đạt và khóa bài nếu chặng yêu cầu làm theo thứ tự.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Giáo viên mở mọi bài bị khóa bằng cách thêm ?moKhoa=1 vào địa chỉ trang.

(function() {
  const moKhoaTatCa = new URLSearchParams(location.search).get('moKhoa') == '1';

  function an(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function sao(n) {
    let h = '';
    for (let i = 0; i < 3; i++) h += '<span class="sao' + (i < n ? ' dat' : '') + '">' + (i < n ? '★' : '☆') + '</span>';
    return '<span class="hang-sao" aria-label="' + n + ' trên 3 sao">' + h + '</span>';
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
      $ds.innerHTML = '<p class="loi">Không tải được danh sách bài: ' + an(e.message) + '</p>';
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
          the += '<div class="the loi-bai"><div class="so">' + (bi + 1) + '</div><div><b>' + an(id) + '</b><br>Không đọc được tệp bài.</div></div>';
          return;
        }
        let lop = 'the' + (khoa ? ' khoa' : '') + (n == 3 ? ' du-sao' : '');
        let noiDung =
          '<div class="so">' + (bi + 1) + '</div>' +
          '<div class="chu"><div class="ten">' + an(d.tieuDe) + '</div>' +
          (khoa ? '<div class="phu">🔒 Đạt ít nhất 1 sao ở bài trước để mở</div>'
                : '<div class="phu">' + sao(n) + (td.soLanChay ? ' · ' + td.soLanChay + ' lần chạy' : '') + '</div>') +
          '</div>';
        if (khoa) the += '<div class="' + lop + '">' + noiDung + '</div>';
        else the += '<a class="' + lop + '" href="../index.html?baiTap=' + encodeURIComponent(id) + '">' + noiDung + '</a>';
      });
      html +=
        '<section class="chang">' +
          '<div class="dau-chang"><h2>' + an(c.ten) + '</h2><span class="dem">' + saoChang + ' / ' + (c.bai.length * 3) + ' ★</span></div>' +
          (c.moTa ? '<p class="mo-ta">' + an(c.moTa) + '</p>' : '') +
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
    if (confirm('Xóa toàn bộ sao và bài làm đã lưu trên máy này? Không thể hoàn tác.')) {
      SRA.tienDo.xoaTatCa();
      ve();
    }
  });

  ve();
})();
