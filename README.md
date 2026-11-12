# Sân Robot Ảo

Giả lập robot lập trình bằng khối kéo thả và Python, chạy ngay trên trình duyệt, dành cho học sinh THCS (bắt đầu từ lớp 6). Học sinh làm các thử thách trên từng sân: tiến lùi, quay, hiệu chỉnh motor, làm quen từng loại cảm biến, rồi đến mê cung tính kỉ lục và các trò thi đấu như sumo, bóng đá.

**Chạy thử:** https://ntb866-ux.github.io/SiRo-project1/

> Tên "Sân Robot Ảo" là tên tạm. Dự án không liên kết với, không được tài trợ hay xác nhận bởi VEX Robotics, Innovation First hay LEGO. Các tên đó thuộc về chủ sở hữu tương ứng.

## Dự án này dựa trên GEARS (GearsBot)

Sân Robot Ảo là bản phái sinh (fork) của **GEARS – Generic Educational Autonomous Robotics Simulator**, thường gọi là GearsBot.

- Tác giả gốc: **Cort Wee** và **A Posteriori** (https://aposteriori.com.sg)
- Mã nguồn gốc: https://github.com/QuirkyCort/gears
- Bản chạy chính thức: https://gears.aposteriori.com.sg
- Những người đóng góp cho GEARS: Steven Murray (sân bóng đá, ObjectTracker, nam châm, Wheel Actuators), humbug99 (bút vẽ, nhiều tab Python), Yuvix25 (mô hình FLL Mission) và các tác giả khác trong lịch sử commit.
- GEARS được xây trên Babylon.js, Blockly, Ammo.js, Skulpt và các thư viện mã nguồn mở khác; giấy phép của từng thư viện nằm trong thư mục của thư viện đó.

Toàn bộ lịch sử commit của GEARS được giữ nguyên trong repo này. Chúng tôi chân thành cảm ơn tác giả gốc đã chia sẻ công cụ này miễn phí.

## Giấy phép: GPL v3

GEARS phát hành theo **GNU General Public License phiên bản 3** (xem [LICENSE](LICENSE)), nên Sân Robot Ảo cũng phát hành theo GPL v3. Nói ngắn gọn:

- Bạn được dùng, sao chép, sửa và phân phối lại miễn phí, kể cả cho lớp học và trường học.
- Nếu bạn phân phối bản đã sửa (kể cả đưa lên mạng cho người khác dùng), bạn phải công khai mã nguồn bản sửa đó theo cùng giấy phép GPL v3 và giữ nguyên thông báo bản quyền, ghi công tác giả gốc.
- Phần mềm được cung cấp "nguyên trạng", không kèm bảo hành.

Văn bản pháp lí đầy đủ là tệp [LICENSE](LICENSE) bằng tiếng Anh; phần tóm tắt tiếng Việt ở trên chỉ để dễ hiểu và không thay thế văn bản đó.

Copyright (C) 2020 Cort Wee. Các phần chỉnh sửa trong Sân Robot Ảo: Copyright (C) 2026 những người đóng góp cho Sân Robot Ảo.

## Những gì khác với GEARS gốc

Danh sách này cập nhật dần theo từng gói việc:

- [ ] Giao diện và khối lệnh tiếng Việt
- [ ] Khối lệnh kiểu Scratch (Zelos) cho học sinh mới học
- [ ] Robot chuẩn cho lớp 6
- [x] Khung thử thách có chấm sao: trang chọn bài `san-robot-ao/`, hướng dẫn thêm bài ở [docs/huong-dan-them-bai.md](docs/huong-dan-them-bai.md)
- [ ] Các sân học tập: di chuyển, hiệu chỉnh motor, cảm biến chạm, khoảng cách, màu, gyro, bút vẽ
- [ ] Mê cung mã 001–100 có kỉ lục
- [ ] Sân thi đấu: sumo, bóng đá, bắn bóng

Phần thêm mới được đặt trong thư mục `public/san-robot-ao/` để tách khỏi mã GEARS gốc, giúp cập nhật bản mới từ GEARS dễ hơn. Đề xuất cấu trúc chi tiết: [docs/cau-truc-thu-muc.md](docs/cau-truc-thu-muc.md).

README gốc (tiếng Anh) của GEARS được giữ ở [README.gears.md](README.gears.md).

## Chạy trên máy của bạn

Trình duyệt không cho chạy trang này từ `file://`, nên cần một web server nhỏ. Nếu máy có Python 3:

```bash
cd public
python -m http.server 1337
```

Rồi mở http://localhost:1337. Muốn học sinh cùng mạng LAN truy cập thì dùng `http://<địa-chỉ-IP-máy-bạn>:1337`.

## Đóng góp

Báo lỗi hoặc góp ý bài thử thách qua mục Issues của repo. Lỗi thuộc phần lõi giả lập (vật lí, robot, Blockly) nên báo thêm cho dự án gốc tại https://github.com/QuirkyCort/gears/issues.
