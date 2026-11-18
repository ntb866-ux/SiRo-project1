/*
 * Sân Robot Ảo – chọn chữ theo ngôn ngữ cho phần giao diện của Sân Robot Ảo.
 * Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo. Phát hành theo GPL v3.
 *
 * Chữ của GEARS đi qua i18n (js/msg.js + vi.js). Chữ do Sân Robot Ảo tự viết
 * (khung đề bài, bảng lắp ráp xe, bảng số đo, trang chọn bài…) dùng sraT:
 *   sraT('Đặt lại', 'Reset')
 * Tiếng Việt khi LANG là 'vi', các ngôn ngữ khác dùng tiếng Anh.
 * Tệp nạp trước vi.js ở trang chính và trước chon-bai.js ở trang chọn bài.
 */
function sraNgonNgu() {
  if (typeof LANG != 'undefined' && LANG) return LANG;
  try { return localStorage.getItem('LANG') || 'vi'; } catch (e) { return 'vi'; }
}
function sraLaTiengViet() {
  return sraNgonNgu() == 'vi';
}
function sraT(vi, en) {
  return sraLaTiengViet() || en === undefined ? vi : en;
}
if (typeof module != 'undefined') module.exports = { sraT: sraT };
