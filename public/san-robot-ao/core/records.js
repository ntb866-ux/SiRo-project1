// Sân Robot Ảo – lưu tiến độ và chương trình của học sinh trong trình duyệt.
// Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. GPL v3.
//
// Dữ liệu chỉ nằm trên máy đang dùng (localStorage). Đổi máy hoặc xóa dữ liệu
// trình duyệt thì mất. Mọi thao tác đều bọc try/catch để trang vẫn chạy
// khi trình duyệt chặn bộ nhớ (chế độ ẩn danh).

var SRA = window.SRA || {};
window.SRA = SRA;

SRA.tienDo = new function() {
  const KHOA = 'sanRobotAo.tienDo.v1';
  const KHOA_MA = 'sanRobotAo.ma.v1.';
  let self = this;

  function doc() {
    try {
      return JSON.parse(localStorage.getItem(KHOA)) || {};
    } catch (e) {
      return {};
    }
  }

  function ghi(duLieu) {
    try {
      localStorage.setItem(KHOA, JSON.stringify(duLieu));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Toàn bộ tiến độ: { idBai: {...} }
  this.tatCa = doc;

  // Tiến độ một bài
  this.bai = function(id) {
    return doc()[id] || { sao: 0, saoDat: [false, false, false], soLanChay: 0, goiYDaXem: 0 };
  };

  function capNhat(id, ham) {
    let duLieu = doc();
    let ban = duLieu[id] || { sao: 0, saoDat: [false, false, false], soLanChay: 0, goiYDaXem: 0 };
    ham(ban);
    ban.capNhat = new Date().toISOString();
    duLieu[id] = ban;
    ghi(duLieu);
    return ban;
  }

  // Ghi một lượt chạy. Giữ kết quả tốt nhất: số sao cao nhất, từng sao đã từng đạt,
  // thời gian ngắn nhất và số khối ít nhất trong các lượt hoàn thành.
  this.ghiLuotChay = function(id, kq) {
    return capNhat(id, function(ban) {
      ban.soLanChay = (ban.soLanChay || 0) + 1;
      if (!kq.hoanThanh) return;
      ban.saoDat = (ban.saoDat || [false, false, false]).map((d, i) => d || !!kq.saoDat[i]);
      ban.sao = Math.max(ban.sao || 0, kq.sao);
      if (typeof ban.thoiGianTotNhat != 'number' || kq.thoiGian < ban.thoiGianTotNhat) {
        ban.thoiGianTotNhat = kq.thoiGian;
      }
      if (kq.soKhoi !== null && (typeof ban.soKhoiItNhat != 'number' || kq.soKhoi < ban.soKhoiItNhat)) {
        ban.soKhoiItNhat = kq.soKhoi;
      }
    });
  };

  // Ghi thêm dữ liệu riêng của một loại bài vào bản ghi tiến độ (vd. robotDaXong của G5)
  this.ghiThem = function(id, ham) {
    return capNhat(id, ham);
  };

  this.ghiGoiY = function(id, soGoiY) {
    return capNhat(id, function(ban) {
      ban.goiYDaXem = Math.max(ban.goiYDaXem || 0, soGoiY);
    });
  };

  this.xoaBai = function(id) {
    let duLieu = doc();
    delete duLieu[id];
    ghi(duLieu);
    try { localStorage.removeItem(KHOA_MA + id); } catch (e) {}
  };

  this.xoaTatCa = function() {
    ghi({});
    try {
      Object.keys(localStorage)
        .filter(k => k.indexOf(KHOA_MA) == 0)
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  };

  // Chương trình khối (XML) của từng bài, để quay lại bài vẫn còn bài làm
  this.luuMa = function(id, xml) {
    try { localStorage.setItem(KHOA_MA + id, xml); } catch (e) {}
  };

  this.docMa = function(id) {
    try { return localStorage.getItem(KHOA_MA + id); } catch (e) { return null; }
  };

  // Xuất tiến độ thành chuỗi JSON để học sinh nộp cho giáo viên
  this.xuat = function() {
    return JSON.stringify({ ung: 'san-robot-ao', phienBan: 1, ngay: new Date().toISOString(), tienDo: doc() }, null, 2);
  };
};
