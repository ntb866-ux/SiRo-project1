# Bài di chuyển: tiến, lùi, quay (gói G4)

Tài liệu cho giáo viên. Sáu bài trên sân **Lưới tọa độ** (200 × 200 cm, ô 25 cm, cột A–H, hàng 1–8), dùng robot chuẩn `co-ban` (bánh chu vi 20 cm) và chế độ khối **Cơ bản**. Bài 1 có từ gói G3; G4 thêm 5 bài còn lại.

Mở trang chọn bài: `san-robot-ao/` trên trang web của dự án. Giáo viên mở khóa mọi bài bằng `san-robot-ao/?moKhoa=1`.

## Hai nguyên lí dùng xuyên suốt

**1. Quãng đường = số vòng bánh × chu vi bánh.** Bánh lăn không trượt thì mỗi vòng quay, điểm tiếp xúc với sàn "trải" ra một đoạn bằng chu vi bánh (C = π × d). Robot chuẩn có chu vi 20 cm, nên muốn đi 1 ô (25 cm) bánh quay 1,25 vòng, đi 100 cm thì quay 5 vòng. Khối "đi tới … cm" tự làm phép tính này; ở chế độ Nâng cao học sinh tự tính số vòng hoặc số độ (1 vòng = 360°).

> Nói với học sinh: bánh xe giống cái thước cuộn tròn. Lăn một vòng là đo được một đoạn bằng vòng ngoài của bánh.

**2. Quay tại chỗ khi hai bánh quay ngược chiều.** Bánh trái lăn tới, bánh phải lăn lùi cùng tốc độ thì hai bánh vạch hai cung tròn quanh **điểm giữa trục bánh**: điểm này đứng yên, robot chỉ đổi hướng. Mỗi bánh lăn trên đường tròn đường kính bằng khoảng cách hai bánh (16 cm), nên quay 90° thì mỗi bánh lăn ¼ × π × 16 ≈ 12,6 cm. Vị trí của robot vì vậy cần hai thông tin: tọa độ (ở đâu) và hướng (nhìn về đâu, 360° là một vòng).

> Nói với học sinh: giống chèo thuyền, một mái chèo tới, một mái chèo lùi thì thuyền xoay tại chỗ.

Trong bài, "vị trí robot" là **điểm giữa hai bánh** (cũng là chỗ đặt bút vẽ), vì đó là điểm đứng yên khi robot quay.

## Sáu bài và buổi dạy

Bám lộ trình 12 buổi: chặng 1 (buổi 1–4, chuyển động tuần tự) và đầu chặng 2 (buổi 5, vòng lặp).

| Buổi | Mã bài | Bài | Kĩ năng mới | Lời giải ngắn nhất |
|---|---|---|---|---|
| 1 | `01-di-chuyen/01-tien-toi-o-dich` | Tiến tới ô đích | đi tới N cm, đổi ô ra cm | đi tới 100 (1 khối) |
| 2 | `01-di-chuyen/02-re-toi-o-dich` | Rẽ tới ô đích | quay 90°, tránh vùng cấm | đi 100, quay phải 90, đi 100 (3 khối) |
| 2–3 | `01-di-chuyen/03-do-xe-vao-bai` | Đỗ xe vào bãi | đi lùi, hướng ≠ chiều chuyển động | đi 75, quay trái 90, lùi 85 (3 khối) |
| 3 | `01-di-chuyen/04-qua-ba-diem` | Đi qua 3 điểm theo thứ tự | chia bài thành chặng, chạy thử từng chặng | đi 75, quay phải 90, đi 75, lùi 125 (4 khối) |
| 4 | `01-di-chuyen/05-ve-hinh-vuong` | Vẽ hình vuông | bút vẽ, góc ngoài, tổng góc 360° | hạ bút + 4 × (đi 75, quay phải 90) (9 khối) |
| 5 | `02-vong-lap/01-hinh-vuong-vong-lap` | Hình vuông bằng vòng lặp | khối "lặp lại … lần" | lặp 4 { đi 100, quay phải 90 } (3 khối) |

### Bài 2. Rẽ tới ô đích
Xuất phát B2 nhìn lên, đích F6. Giữa sân có **hồ nước** (C3–E5) nên không đi chéo được. Có hai đường đúng (lên rồi rẽ phải, hoặc rẽ phải rồi lên); đường thứ hai cần thêm một lần quay nên chỉ được 2 sao. Câu hỏi thảo luận: vì sao đi chéo lại ngắn hơn (định lí Pi-ta-go là chuyện lớp 7–8, lớp 6 chỉ cần thấy "đường chéo của hình vuông dài hơn cạnh").

### Bài 3. Đỗ xe vào bãi
Bãi ở G5, có tường hai bên, cửa mở sang trái. Yêu cầu: dừng trong bãi và **đầu xe quay ra cửa**, tức là phải lùi vào. Lỗi hay gặp: quay phải rồi tiến đầu vào (robot nằm trong bãi nhưng sai hướng, bài báo "hướng cuối 90°, lệch 180°"). Sao 3 đòi đỗ ngay ngắn ở giữa bãi.
Hoạt động gợi ý: cho một em đi giật lùi trong lớp, cả lớp nhận xét "mặt nhìn đâu, người đi về đâu".

### Bài 4. Đi qua 3 điểm theo thứ tự
D2 → điểm 1 (D5) → điểm 2 (G5) → điểm 3 (B5). Ba điểm cùng hàng 5, điểm 3 ở phía bên kia điểm 1, nên từ điểm 2 có thể **lùi thẳng** 125 cm thay vì quay đầu 180°. Quay đầu vẫn đúng (2 sao); dùng lùi thì được 3 sao vì chỉ cần 4 khối. Đây là bài luyện chia nhỏ và chạy thử sau mỗi chặng, như Number Maze ở buổi 3.

### Bài 5. Vẽ hình vuông
Hình vuông cạnh 75 cm, các góc C3 (xuất phát), C6, F6, F3. Ô đỏ ở giữa ngăn đi tắt chéo. Sao 2 đòi robot về tới nơi **nhìn đúng hướng ban đầu**: học sinh quên lần quay cuối sẽ chỉ được 1 sao, đó là dịp hỏi "đi hết hình vuông robot đã quay tổng cộng bao nhiêu độ?" (360°). Sao 3 đòi hạ bút để thấy quỹ đạo. Chương trình 9 khối, dài và lặp lại: để học sinh thấy khó chịu với sự lặp này, làm mồi cho buổi 5.
Mở rộng nhóm B: vẽ tam giác đều (quay 120°, không phải 60°) ngoài bài chấm.

### Bài 6. Hình vuông bằng vòng lặp (chặng 2)
Hình vuông to hơn (cạnh 100 cm, góc B2, B6, F6, F2) để học sinh không chép nguyên bài 5. **Bắt buộc dùng khối "lặp lại … lần"**, viết 8 khối rời sẽ không được sao nào và bài nói rõ lí do. Sao 3: chỉ 3 khối. So sánh với bài 5: 9 khối so với 3 khối mà robot làm đúng các việc như nhau.

## Phân hóa

- **Nhóm A (mới học):** mở gợi ý theo bậc trong bài (gợi ý 2 mở sau lần chạy thứ nhất, gợi ý 3 có lời giải mở sau lần thứ hai). Có thể in lưới A–H × 1–8 để vẽ đường đi trước khi kéo khối.
- **Nhóm B (đã biết kéo thả):** săn sao 3 (ít khối nhất); chuyển sang chế độ Nâng cao và tính số vòng bánh thay vì dùng khối "đi tới … cm"; giải thích bằng lời vì sao lời giải của mình ngắn nhất.

## Kiểm tra tự động

`scripts/thu-thach/kiem-tra-bai.js` chạy lời giải mẫu và vài lời giải sai của từng bài trong giả lập (Playwright, trình duyệt không màn hình) rồi so số sao. Chạy `python3 -m http.server 1337` trong `public/`, rồi `node scripts/thu-thach/kiem-tra-bai.js` ở thư mục gốc. Thêm bài mới thì thêm lời giải vào bảng `CA` đầu tệp.

## Điều kiện mới: `dungKhoi`

G4 thêm loại điều kiện `dungKhoi` (xem [huong-dan-them-bai.md](huong-dan-them-bai.md)): đạt khi chương trình có dùng khối thuộc loại đã cho. Bài 6 dùng nó để bắt buộc khối lặp, bài 5 dùng để chấm sao "hạ bút".
