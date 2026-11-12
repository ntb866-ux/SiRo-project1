# Bảng thuật ngữ Sân Robot Ảo

Bảng này giữ cho chữ trên khối, giao diện, phiếu học tập và lời giáo viên dùng cùng một từ. Khi thêm khối, sân hay thử thách mới, tra bảng trước; nếu cần từ mới thì thêm vào đây trong cùng PR.

Nguyên tắc chung:

- Chữ trên khối viết thường, ngắn, đọc lên thành câu: "đi tới 20 cm", "quay phải 90 độ", "lặp lại 4 lần".
- Dùng từ học sinh lớp 6 đã biết. Từ kĩ thuật (con quay, siêu âm) đi kèm lời giải thích trong phần gợi ý của khối.
- Đơn vị viết bằng kí hiệu quốc tế: cm, mm, độ, giây, %.
- Không dùng tên hay biểu tượng của VEX, LEGO, Scratch.
- Tên trong mã (tên khối, tên tệp, khóa JSON) viết tiếng Việt không dấu, nối bằng gạch dưới hoặc gạch nối: `sra_di`, `toc_do`, `co-ban`.

## Khối Cơ bản (chế độ lớp 6)

| Chữ trên khối | Tên khối trong mã | Việc robot làm | Cách nói với học sinh |
|---|---|---|---|
| khi bấm ▶ chạy | `when_started` | Điểm bắt đầu của chương trình | "Chương trình bắt đầu từ khối mũ vàng này." |
| đi tới / lùi [20] cm | `sra_di` | Đi thẳng đúng quãng đường rồi dừng | "Robot đi 20 cm, bằng một ô lớn của sân lưới." |
| quay phải ↻ / trái ↺ [90] độ | `sra_quay` | Quay tại chỗ: một bánh tới, bánh kia lùi | "90 độ là một góc vuông, như rẽ ở ngã tư." |
| đi tới / lùi mãi | `sra_chay` | Chạy liên tục tới khi gặp lệnh khác | "Robot cứ đi cho đến khi bạn bảo dừng." |
| dừng lại | `sra_dung` | Phanh hai bánh | |
| đặt tốc độ [50] % | `sra_dat_toc_do` | Tốc độ cho khối đi và quay, 0–100 % | "Nhanh quá thì robot trượt, đi không chính xác." |
| hạ bút / nhấc bút | `sra_ha_but`, `sra_nhac_but` | Bắt đầu / thôi vẽ vết đường đi | |
| đặt màu bút [đỏ] | `sra_mau_but` | Đổi màu nét vẽ | |
| đặt nét bút dày [3] | `sra_net_but` | Đổi độ dày nét vẽ | |
| khoảng cách phía trước (cm) | `sra_khoang_cach` | Số đo của cảm biến siêu âm | "Robot phát tiếng siêu âm rồi nghe tiếng vọng, giống con dơi." |
| cảm biến màu thấy [đen]? | `sra_thay_mau` | Đúng / sai | |
| cảm biến chạm đang bị nhấn? | `sra_dang_cham` | Đúng / sai | |
| góc quay (độ) | `sra_goc_quay` | Số đo con quay; quay phải thì tăng | "Con quay nhớ robot đã xoay bao nhiêu độ." |
| đặt lại góc quay về 0 | `sra_dat_lai_goc` | Lấy hướng hiện tại làm 0 độ | |
| phát tiếng bíp và đợi xong | `beep` | | |
| đợi [1] giây | `sleep` | | |
| lặp lại [4] lần | `controls_repeat_ext` | | |
| lặp mãi | `sra_lap_mai` | Lặp không dừng | |
| nếu … thì / nếu không thì | `controls_if` | | |
| đợi đến khi … | `wait_until` | | |
| lặp lại cho đến khi … | `controls_whileUntil` | | |
| dừng chương trình | `exit` | | |
| số ngẫu nhiên từ … đến … | `math_random_int` | | |
| và / hoặc / không phải | `logic_operation`, `logic_negate` | | |
| Tạo biến mới, đặt … bằng …, tăng … thêm … | biến của Blockly | | |
| tạo khối … | `procedures_defnoreturn` | Khối tự tạo (hàm) | "Gói nhiều khối thành một khối mới có tên." |

Khối có tiền tố `sra_` là khối mới của Sân Robot Ảo. Khối không có tiền tố là khối gốc của GEARS hoặc Blockly, giữ nguyên tên để chương trình GEARS cũ vẫn mở được.

## Nhóm khối và màu

Màu theo cách chia nhóm quen thuộc của các công cụ lập trình khối cho trẻ em.

| Nhóm | Màu | Mã màu |
|---|---|---|
| Sự kiện (khối mũ) | vàng | `#FFBF00` |
| Chuyển động | xanh dương | `#4C97FF` |
| Động cơ (Nâng cao) | xanh dương đậm | `#3D7DD8` |
| Bút vẽ | xanh ngọc | `#0FBD8C` |
| Âm thanh | hồng tím | `#CF63CF` |
| Cảm biến | xanh da trời | `#5CB1D6` |
| Điều khiển (đợi, lặp, nếu) | cam vàng | `#FFAB19` |
| Phép toán, Chữ | xanh lá | `#59C059` |
| Biến | cam | `#FF8C1A` |
| Danh sách | cam đỏ | `#FF661A` |
| Khối của tôi | hồng | `#FF6680` |
| Thử nghiệm (Nâng cao) | tím | `#9966FF` |

## Từ dùng chung

| Tiếng Anh trong GEARS | Tiếng Việt dùng | Không dùng |
|---|---|---|
| Blocks | Khối lệnh | Mảnh, block |
| Simulator | Sân mô phỏng | Trình giả lập |
| World | Sân | Thế giới, bản đồ |
| Challenge | Thử thách | Nhiệm vụ |
| Robot | Robot | Rô-bốt |
| Port | Cổng | Cổng kết nối |
| Motor | Động cơ | Mô-tơ |
| Wheel | Bánh xe | |
| Sensor | Cảm biến | |
| Color sensor | Cảm biến màu | |
| Ultrasonic sensor | Cảm biến siêu âm | |
| Gyro sensor | Con quay | Gyro, con quay hồi chuyển (chỉ dùng khi giải thích) |
| Touch sensor | Cảm biến chạm | Cảm biến nút nhấn |
| Laser range sensor | Cảm biến laze | |
| LIDAR | Cảm biến quét 360° | |
| GPS | Định vị (GPS) | |
| Pen | Bút vẽ | |
| Electromagnet | Nam châm điện | |
| Move / drive | Đi | Di chuyển (dài) |
| Forward / backward | Tới / lùi | Tiến |
| Turn left / right | Quay trái / quay phải | Rẽ (chỉ dùng khi nói về đường đi) |
| Speed | Tốc độ | Vận tốc (chỉ dùng trong vật lí, có hướng) |
| Rotations | Vòng | |
| Degrees | Độ | |
| Heading / angle | Góc quay / hướng | |
| Brake / coast / hold | Phanh / thả trôi / giữ chặt | |
| Wait | Đợi | Chờ |
| Repeat | Lặp lại | |
| Forever | Lặp mãi | Lặp vô hạn |
| If / else | Nếu … thì / nếu không thì | |
| Variable | Biến | |
| Function / My Blocks | Khối của tôi, khối tự tạo | Hàm, thủ tục (chỉ dùng ở chế độ Nâng cao khi nói về Python) |
| Comment | Ghi chú | Chú giải |
| Reset | Đặt lại | |
| Run / stop | Chạy / dừng | |
| Page / Main | Trang / Chính | |
| Basic / Advanced mode | Chế độ Cơ bản / Nâng cao | |

## Chế độ Cơ bản và Nâng cao

- **Cơ bản** (mặc định): chỉ hiện các khối trong bảng trên, ẩn thẻ Python, ẩn các mục menu dẫn sang trang tiếng Anh (Tự lắp robot, Tự tạo sân, Đấu trường, Có gì mới…), chỉ cho chọn các sân học tập (Lưới tọa độ, Dò đường, Con quay, Mê cung).
- **Nâng cao**: đầy đủ khối của GEARS (đã Việt hóa), thêm nhóm "Cơ bản – Chuyển động" đứng đầu, có thẻ Python và mọi sân.
- Công tắc nằm ở đầu trang, lựa chọn được nhớ trên máy (`localStorage`, khóa `sraCheDo`).
- Chương trình làm ở chế độ nào cũng mở được ở chế độ kia; đổi chế độ chỉ đổi bảng khối, không đổi chương trình.
