# Robot chuẩn lớp 6 (gói G2)

Mọi bài học dùng chung một robot chuẩn (`co-ban.json`) và 3 biến thể. Các tệp JSON có cùng định dạng mà **Robot Configurator** của GEARS lưu ra, nên mở được bằng menu *Robot → Load from file* và chỉnh tiếp trong Configurator.

Các tệp được sinh từ một nguồn duy nhất là `scripts/robot/tao-robot.js`. Muốn đổi thông số thì sửa tệp đó rồi chạy `node scripts/robot/tao-robot.js`, đừng sửa tay từng JSON.

## Các robot

| Tệp | Tên hiện trong menu | Dùng cho |
|---|---|---|
| `co-ban.json` | Robot chuẩn lớp 6 | Mọi bài, mặc định |
| `banh-to.json` | Robot bánh to | Bài so sánh: bánh to đi nhanh hơn, xa hơn mỗi vòng |
| `banh-nho.json` | Robot bánh nhỏ | Bài so sánh: bánh nhỏ chậm hơn, dễ dừng đúng chỗ |
| `do-line.json` | Robot dò đường (3 cảm biến màu) | Bài dò vạch |
| `mbot.json` | Robot mBot (vỏ 3D) | Robot có hình xe mBot (bản quét 3D). Thân 8,2 cm, bánh rộng 2 cm, khoảng cách hai bánh 10,6 cm, trục bánh sau tâm 2,4 cm, bi tự do phía trước. Cùng cổng với robot chuẩn. Vỏ 3D chỉ để nhìn, gắn bằng `san-robot-ao/mo-hinh-robot.js` qua trường `sraMoHinh`. |

## Bảng thông số

| Thông số | Robot chuẩn | Bánh to | Bánh nhỏ | Dò đường |
|---|---|---|---|---|
| Đường kính bánh (cm) | 6,37 | 9,55 | 4,77 | 6,37 |
| Chu vi bánh (cm) | **20** | **30** | **15** | **20** |
| Bề rộng bánh (cm) | 1,2 | 1,2 | 1,2 | 1,2 |
| Khoảng cách hai bánh, tâm đến tâm (cm) | 16,0 | 16,0 | 16,0 | 16,0 |
| Thân dài × rộng × cao (cm) | 16 × 14,4 × 4 | 16 × 14,4 × 4 | 16 × 14,4 × 4 | 16 × 14,4 × 4 |
| Bề rộng toàn robot, tính cả bánh (cm) | 17,2 | 17,2 | 17,2 | 17,2 |
| Bánh tự do (bi cầu phía sau), đường kính (cm) | 4 | 4 | 3 | 4 |
| Khối lượng (kg) | 1,4 | 1,4 | 1,4 | 1,4 |
| Tốc độ quay tối đa của bánh (vòng/phút) | 133 | 133 | 133 | 133 |
| Tốc độ đi tối đa (cm/s) | 44 | 67 | 33 | 44 |

Ghi chú:

- Chu vi bánh được chọn tròn số để học sinh lớp 6 tính nhẩm: robot chuẩn quay 1 vòng bánh thì đi 20 cm, nên "đi 50 cm" là 2,5 vòng. Đường kính suy ra từ chu vi: d = C ÷ π.
- Khối lượng: thân 1,0 kg + mỗi bánh 0,2 kg. GEARS không ghi đơn vị khối lượng; dự án quy ước số 1000 trong tệp JSON (`bodyMass`) là 1 kg.
- Tốc độ tối đa: GEARS giới hạn mọi bánh ở 800 độ/giây (≈ 133 vòng/phút), kể cả khi chương trình đặt 100%. Tốc độ đi tối đa = 133 ÷ 60 × chu vi.

## Cổng và vị trí cảm biến

Mọi robot dùng **cùng số cổng** cho các bộ phận chuẩn, nên một chương trình chạy được trên cả 4 robot.

| Cổng | Bộ phận | Vị trí (so với điểm giữa hai bánh) |
|---|---|---|
| A | Bánh trái | |
| B | Bánh phải | |
| 1 | Cảm biến màu, nhìn xuống sân | Trước 3 cm, giữa thân |
| 2 | Cảm biến khoảng cách (siêu âm), nhìn thẳng phía trước | Trước 3 cm, nóc thân |
| 3 | Gyro (con quay) | Trên nóc |
| 4 | Cảm biến chạm, thanh cản rộng 10 cm ở mũi | Mũi robot |
| 5 | Bút vẽ | Đúng điểm giữa hai bánh (tâm quay), nên khi quay tại chỗ nét vẽ có góc nhọn gọn |
| 6, 7 | Chỉ robot dò đường: cảm biến màu trái, phải | Cách cảm biến giữa 3 cm mỗi bên |

Trục hai bánh nằm trước tâm thân 4 cm; bi tự do ở đuôi.

## Đi đúng cm, quay đúng độ

Lệnh motor có sẵn của GEARS (`on_for_degrees`) chỉ đếm góc quay của bánh. Trong giả lập, bánh trượt khi tăng tốc và phanh, nên robot lệch xa tiêu chí. Vì vậy G2 thêm bộ điều khiển `siro.drivetrain` (tệp `public/san-robot-ao/python/siro/drivetrain.py`):

- **Đi thẳng:** đổi cm ra góc bánh (góc = quãng đường ÷ chu vi × 360°), tăng tốc và giảm tốc dần để bánh không trượt, dùng gyro giữ hướng.
- **Quay:** quay tại chỗ theo gyro, chậm dần khi gần tới góc đích. Hướng đích cộng dồn qua các lệnh nên sai số không tích lũy (4 lần quay 90° vẫn về đúng hướng ban đầu).

```python
from siro.drivetrain import Drivetrain
robot = Drivetrain()                          # robot chuẩn
# robot = Drivetrain(wheel_diameter=9.5493)   # robot bánh to
robot.drive_for(50)        # đi tới 50 cm; số âm là đi lùi
robot.turn_for(90)         # quay phải 90 độ; số âm là quay trái
robot.drive_for(50, 100)   # tham số thứ hai: tốc độ tối đa, % (mặc định 50)
```

Khối "đi tới N cm" và "quay N độ" tiếng Việt nên sinh mã gọi `Drivetrain` này (truyền `wheel_diameter` và `wheel_spacing` đọc từ `robot.options`).

## Kết quả kiểm tra độ chính xác

Tiêu chí: "đi tới 50 cm" đúng ±1 cm, "quay 90 độ" đúng ±2°, trên sân lưới phẳng (`grid`), máy chạy 60 khung hình/giây. Đo bằng vị trí thật của điểm giữa hai bánh trong giả lập, không dùng số đọc của cảm biến.

Mỗi robot chạy ở 3 tốc độ (25%, 50%, 100%), lặp 3 lần: **36/36 lần đạt.** Sai số lớn nhất trong 3 lần:

| Robot | Tốc độ | Sai số đi 50 cm | Sai số quay 90° | Lệch hướng khi đi thẳng |
|---|---|---|---|---|
| Robot chuẩn | 25% / 50% / 100% | 0,14 / 0,22 / 0,16 cm | 0,06 / 0,12 / 0,15° | ≤ 0,13° |
| Bánh to | 25% / 50% / 100% | 0,48 / 0,30 / 0,23 cm | 0,24 / 0,16 / 0,24° | ≤ 0,24° |
| Bánh nhỏ | 25% / 50% / 100% | 0,18 / 0,15 / 0,12 cm | 0,18 / 0,11 / 0,17° | ≤ 0,08° |
| Dò đường | 25% / 50% / 100% | 0,13 / 0,10 / 0,13 cm | 0,17 / 0,22 / 0,10° | ≤ 0,15° |

So sánh với lệnh motor trần `on_for_degrees` cùng công thức đổi đơn vị: chỉ 1/12 trường hợp đạt; robot chuẩn ở 50% đi thiếu 2,1 cm, quay thiếu 6,4° và lệch hướng 14° khi đi thẳng.

**Giới hạn đã biết:** GEARS tính vật lí theo từng khung hình. Trên máy yếu chỉ chạy khoảng 12 khung hình/giây, sai số tăng lên tới 2 cm với robot bánh to (robot chuẩn vẫn trong ±1 cm). Nếu máy học sinh chậm, nên thu nhỏ cửa sổ trình duyệt hoặc dùng robot chuẩn.

### Chạy lại kiểm tra

```bash
cd public && python3 -m http.server 1337 &          # phục vụ trang ở cổng 1337
node scripts/robot/kiem-tra-do-chinh-xac.js          # cả 4 robot, 3 tốc độ
node scripts/robot/kiem-tra-do-chinh-xac.js co-ban   # một robot
SIRO_MODE=tho node scripts/robot/kiem-tra-do-chinh-xac.js   # đo lệnh motor trần để so sánh
```

Cần Playwright (`npm i playwright`). Lệnh thoát với mã 0 khi mọi lần đo đạt.
