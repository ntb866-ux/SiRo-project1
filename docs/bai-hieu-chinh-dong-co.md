# Bài hiệu chỉnh động cơ (gói G5)

Tài liệu cho giáo viên. Năm bài trên sân **Lưới tọa độ** (200 × 200 cm, ô 25 cm), chế độ khối **Cơ bản**, thuộc **chặng 2** của lộ trình. Ý chung của cả năm bài: **robot thật không bao giờ hoàn hảo**. Lí thuyết cho con số gần đúng; người làm robot đo thử, so với lí thuyết, rồi chỉnh. Việc đó gọi là **hiệu chỉnh** (tiếng Anh: *calibration*).

Mở trang chọn bài: `san-robot-ao/`, chặng "Hiệu chỉnh động cơ". Mở thẳng một bài: `index.html?baiTap=03-hieu-chinh/01-chu-vi-banh`.

## Cái mới học sinh dùng

**Hai khối trong nhóm "Động cơ"** (không có con quay tự sửa sai, nên robot làm đúng như bánh quay, sai đâu thấy đó):

| Khối | Robot làm gì |
|---|---|
| quay bánh trái **a** bánh phải **b** vòng/độ | Mỗi bánh quay đúng số vòng (hoặc số độ) đã ghi, số âm là quay lùi. Tăng tốc và giảm tốc êm. |
| chạy bánh trái **a** % bánh phải **b** % | Mỗi bánh chạy liên tục với tốc độ riêng cho tới khối "dừng lại". Dùng cùng khối "chờ … giây". |

Các khối "đi tới … cm" và "quay … độ" của chặng 1 tự đo bằng con quay và sửa sai, nên năm bài này **không cho dùng** hai khối đó (bài báo rõ lí do nếu học sinh dùng).

**Bảng số đo** nổi ở góc trên trái sân, cập nhật 10 lần mỗi giây và giữ nguyên sau khi robot dừng:

| Dòng | Ý nghĩa |
|---|---|
| Thời gian chạy | Số giây bánh được lệnh quay (từ lệnh chạy đầu tiên tới lệnh dừng), khớp với số giây trong khối "chờ" |
| Bánh trái / bánh phải đã quay | Số vòng mỗi bánh, đọc từ bộ đếm vòng của motor (encoder) |
| Bánh quay nhanh | Vòng mỗi giây (tốc độ góc ω), trung bình hai bánh |
| Quãng đường | Độ dài quỹ đạo điểm giữa hai bánh |
| Đi tới được | Đi được bao xa theo hướng đầu xe lúc xuất phát |
| Tốc độ | cm mỗi giây, lúc đang chạy |
| Thân xe đã quay | Góc thân xe đổi so với lúc xuất phát, quay phải là số dương |
| Lệch ngang | Lệch bao nhiêu cm khỏi đường thẳng xuất phát, + là lệch sang phải |

Mỗi bài chỉ bật những dòng cần cho bài đó.

## Ba nguyên lí

**1. v = ω × r (bánh lăn không trượt).** Mỗi vòng bánh xe đi được một chu vi C = π × d = 2πr. Bánh quay ω vòng mỗi giây thì xe đi v = ω × C cm mỗi giây. Viết theo radian: v = ω × r (ω tính bằng rad/s). Hệ quả: cùng một motor, bánh có bán kính gấp đôi thì xe chạy nhanh gấp đôi và đi xa gấp đôi sau mỗi vòng.

> Nói với học sinh lớp 6: bánh xe như cái thước cuộn tròn. Lăn một vòng là "in" xuống sàn một đoạn dài bằng vòng ngoài của bánh. Xe đạp trẻ con và xe đạp người lớn đạp cùng nhịp, xe bánh to đi nhanh hơn.

**2. Góc quay của thân xe phụ thuộc khoảng cách hai bánh.** Xe quay tại chỗ thì hai bánh lăn trên một đường tròn có đường kính bằng khoảng cách hai bánh b. Muốn thân xe quay góc θ, mỗi bánh lăn cung s = π × b × θ / 360°. Đổi ra góc bánh: **góc bánh = θ × b / d**. Robot chuẩn có b = 16 cm, d = 6,37 cm, nên quay 90° cần 226° góc bánh (0,63 vòng). Thân xe rộng hơn (b lớn) thì bánh phải quay nhiều hơn cho cùng một góc. Khi hai bánh chạy chênh tốc độ Δv, thân xe quay với tốc độ góc Δv / b: đó là lí do xe có một motor yếu đi cong.

> Nói với học sinh: hai bạn khoác vai nhau xoay tại chỗ. Đứng càng xa nhau thì mỗi bạn phải bước càng nhiều mới xoay được một góc vuông.

**3. Sai số tích lũy khi đi xa.** Sai một chút ở góc thì sai càng nhiều ở vị trí khi đi càng xa: lệch góc α, đi thêm L thì lệch ngang khoảng L × sin α (lệch 5° mà đi 60 cm là lệch 5 cm, đi 2 m là lệch 17 cm). Chênh tốc độ hai bánh còn tệ hơn: góc lệch tăng dần theo thời gian, nên độ lệch ngang tăng theo **bình phương** quãng đường. Vì thế robot thi đấu hay đi một đoạn rồi "căn" lại vào tường hay vạch kẻ, và robot thật dùng encoder hay con quay để tự sửa sai liên tục.

> Nói với học sinh: bắn bi lệch tay một chút thì ở gần vẫn trúng, ở xa thì trượt hẳn.

## Năm bài

| # | Mã bài | Bài | Robot | Đáp án sau khi hiệu chỉnh |
|---|---|---|---|---|
| 1 | `03-hieu-chinh/01-chu-vi-banh` | Một vòng bánh đi bao xa? | chuẩn (C = 20 cm) | quay bánh 4,5 vòng |
| 2 | `03-hieu-chinh/02-quay-goc-vuong` | Quay đúng một góc vuông | chuẩn | trái 230°, phải −230°, rồi 3 vòng |
| 3 | `03-hieu-chinh/03-banh-to-banh-nho` | Bánh to, bánh nhỏ | bánh to (C = 30), bánh nhỏ (C = 15) | 2 vòng và 4 vòng |
| 4 | `03-hieu-chinh/04-bu-motor-lech` | Xe bị lệch: bù cho motor yếu | motor lệch (bánh phải yếu 8 %) | trái 50 %, phải 54,3 % trong 3,5 giây |
| 5 | `03-hieu-chinh/05-mot-met-bon-giay` | Đi 1 mét trong đúng 4 giây | chuẩn | hai bánh 44 % trong 4 giây |

Mọi bài đều mở sẵn một chương trình "chưa đúng" để học sinh chạy ngay, đọc bảng số đo, rồi sửa. Quy trình nên viết lên bảng: **Đoán → Chạy → Đọc số đo → Tính → Chỉnh → Chạy lại.**

### Bài 1. Một vòng bánh đi bao xa?
Chạy chương trình mở sẵn (1 vòng), bảng số đo báo "Đi tới được 20,0 cm": đó là chu vi bánh. Vạch đích cách 90 cm nên quay 90 ÷ 20 = 4,5 vòng. Sao 2 đòi sai số ±1 cm (giả lập cho kết quả 90,0 ± 0,1 cm). Sao 3 đòi chương trình chỉ có 1 khối: tính trước rồi chạy một lần, không chắp vá "4 vòng rồi thêm 0,5 vòng".
Hoạt động ngoài máy: lăn một cái nắp chai có chấm bút trên tờ giấy, đo đoạn giữa hai vết chấm, so với π × đường kính.

### Bài 2. Quay đúng một góc vuông
Chương trình mở sẵn cho mỗi bánh quay 90°: thân xe chỉ quay khoảng 33°, robot đi chệch khỏi ô đích. Đây là chỗ dạy **góc bánh khác góc thân xe** (nguyên lí 2). Tính theo lí thuyết được 226°; chạy thử thì thân xe quay khoảng 87–88° vì lúc quay tại chỗ bánh bị trượt ngang một chút (bi tự do và thân xe cản lại). **Hiệu chỉnh** lên khoảng 230° thì được 89–91°. Ngưỡng sao: sao 2 cần 90° ± 5°, sao 3 cần 90° ± 3° và dừng giữa ô (lệch ngang dưới 5 cm). Lời giải lí thuyết thường đã đủ 2–3 sao; điều quan trọng là học sinh thấy công thức cho con số gần đúng và dùng bảng số đo để chỉnh.
Lưu ý: giả lập dao động khoảng ±1,5° giữa các lần chạy cùng một chương trình (bánh trượt không hoàn toàn giống nhau). Đây cũng là chuyện thật: hãy cho học sinh chạy 3 lần và lấy trung bình trước khi chỉnh.
Câu hỏi thảo luận: sai 5° thì sau 60 cm lệch bao nhiêu? (khoảng 5 cm; nguyên lí 3). Robot thật thường sai nhiều hơn giả lập vì sàn, bánh và motor không đều.

### Bài 3. Bánh to, bánh nhỏ
Hai nút "Chọn robot" trong khung đề bài. Học sinh đo chu vi từng robot bằng 1 vòng (30 cm và 15 cm), tính số vòng tới vạch 60 cm (2 vòng, 4 vòng). Sao 2 cộng dồn qua các lần chạy: phải làm được với **cả hai** robot. Bảng nên cho học sinh ghi:

| Robot | Chu vi đo được | Số vòng tới vạch 60 cm | Tốc độ ở 50 % (cm/s) |
|---|---|---|---|
| Bánh to | 30 cm | 2 | ~44 |
| Bánh nhỏ | 15 cm | 4 | ~22 |

Kết luận cần rút ra: cùng tốc độ quay, bánh to đi nhanh gấp đôi (v = ω × r), nhưng sai 0,1 vòng thì bánh to sai 3 cm, bánh nhỏ chỉ sai 1,5 cm.

### Bài 4. Xe bị lệch: bù cho motor yếu
Robot `lech-motor` có motor bánh phải chỉ đạt 92 % tốc độ được lệnh. Hai bánh cùng 50 % thì sau 3,5 giây bánh trái quay khoảng 5,0 vòng, bánh phải chỉ 4,6 vòng; xe cong sang phải hơn 30° và lệch 25–30 cm, ra khỏi ô đích. Học sinh đọc hai số vòng trên bảng, suy ra tỉ lệ (≈ 0,92) rồi bù: 50 ÷ 0,92 ≈ 54,3 %. Cách dò từng nấc (52, 54, 56 %) cũng được, bảng số đo cho thấy hai số vòng xích lại gần nhau. Bù 52 % vẫn lệch 12–20 cm nên chưa vào ô. Sao 2 cần lệch ngang dưới 8 cm (giả lập có độ lệch ngẫu nhiên vài cm do bánh trượt lúc khởi động và phanh). Sao 3 chấm theo **số vòng hai bánh chênh nhau ≤ 0,05 vòng**, không chấm theo vị trí, vì đó mới là điều kiện "đi thẳng" của xe hai bánh.
Câu hỏi thảo luận: vì sao chỉ chênh 8 % tốc độ mà xe lệch xa thế? (nguyên lí 3: góc lệch tăng dần, lệch ngang tăng theo bình phương quãng đường). Robot thật tự làm việc bù này bằng encoder (vòng lặp phản hồi), sẽ học ở bài điều khiển tỉ lệ sau.

### Bài 5. Đi 1 mét trong đúng 4 giây
Tính: v = 100 ÷ 4 = 25 cm/s; bánh chu vi 20 cm nên ω = 1,25 vòng/s = 450°/s; motor 100 % là 1050°/s nên cần ≈ 43 %. Chạy 43 % thì đi được khoảng 98 cm (1 sao): thiếu vì xe mất khoảng 0,2 giây đầu để tăng tốc từ 0. Hiệu chỉnh lên 44 % thì được 100,0 cm trong 4,02 giây (3 sao: sao 2 cần ±1 cm, sao 3 cần ±0,5 cm và 4 ± 0,05 giây). Học sinh cũng có thể dùng bảng số đo: chạy 50 % thấy "Tốc độ" ≈ 29 cm/s, rồi tính tỉ lệ 50 × 25 ÷ 29.
Câu hỏi thảo luận: tại sao không nhân đôi thời gian thì đi gấp đôi quãng đường một cách chính xác? (đoạn tăng tốc lúc đầu không đổi theo thời gian chạy).

## Gợi ý dạy

- **Ghi số đo lên phiếu**, không chỉ nhìn: mỗi lần chạy một dòng (lệnh, số đo, nhận xét). Hiệu chỉnh là đi từ bảng số liệu tới con số đúng.
- **Phân hóa.** Nhóm A làm bài 1, 3, 5 với gợi ý (gợi ý 2 mở sau lần chạy đầu, gợi ý có đáp án mở sau lần chạy thứ ba). Nhóm B làm cả năm bài và giải thích bằng công thức; thử thách thêm: ở bài 2, tính góc bánh để quay 45° rồi kiểm tra; ở bài 4, đổi thời gian thành 5 giây xem số % bù có đổi không (không đổi, vì bù theo tỉ lệ).
- **Giới hạn của giả lập:** trên máy rất chậm (dưới 30 khung hình/giây) bánh trượt nhiều hơn, số đo dao động hơn. Khi đó nên thu nhỏ cửa sổ trình duyệt.

## Cho người làm bài

- Khối mới: `sra_quay_banh`, `sra_chay_banh` trong `public/san-robot-ao/giao-dien.js` (sinh mã cho cả ev3dev và Pybricks).
- Bảng số đo dùng chung: `public/san-robot-ao/core/so-do.js` (API `SRA.soDo.them({ id, ten, doc, donVi, soLe, nhom })`, bài bật bằng trường `soDo`). Các dòng chuyển động và điều kiện chấm sao mới ở `core/so-do-chuyen-dong.js`.
- Motor yếu và gia tốc bánh: `public/san-robot-ao/dong-co.js`, chạy cả ở chế độ tự do. Tệp robot có `"sraMotorYeu": { "banh": "phai", "phanTram": 8 }`; tệp bài ghi đè bằng `motorYeu`. Robot `lech-motor` sinh từ `scripts/robot/tao-robot.js`.
- Các trường bài và điều kiện mới ghi ở [huong-dan-them-bai.md](huong-dan-them-bai.md).
- Kiểm tra tự động: chạy `python3 -m http.server 1337` trong `public/`, rồi `node scripts/thu-thach/kiem-tra-hieu-chinh.js` ở thư mục gốc. Lệnh chạy lời giải đúng và sai của cả năm bài, so số sao và in bảng số đo cuối mỗi lượt.
