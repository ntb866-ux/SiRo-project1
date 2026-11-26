# Cách đặt tiêu chí cho một map (bài thử thách)

Tài liệu cho giáo viên. Bảng đầy đủ các trường JSON nằm ở [huong-dan-them-bai.md](huong-dan-them-bai.md); tệp này trả lời câu hỏi khác: **nên đặt tiêu chí gì, đặt ngưỡng bao nhiêu, và tiêu chí liên quan thế nào tới xe và code mẫu**.

## 1. Tiêu chí nằm ở đâu

Mỗi bài là một tệp `public/san-robot-ao/thu-thach/<chặng>/<bài>.json`. Tiêu chí nằm ở hai chỗ:

- `mucTieu`: các điều kiện **phải đạt hết** thì bài mới tính là hoàn thành (sao 1).
- `sao`: đúng 3 mục. Mục đầu là sao 1 (thường chỉ có `moTa`, không cần `dieuKien`). Mục 2 và 3 có `dieuKien` riêng. Hai sao này tính **độc lập**: học sinh có thể được sao 1 + sao 3 mà không có sao 2.

Mỗi điều kiện là một đối tượng `{ "loai": "…", tham số… }`. Thêm `"moTa": "…"` nếu muốn thay câu mô tả tự động bằng câu của bạn. Các `loai` dùng được xem mục 3 và mục 4 trong `huong-dan-them-bai.md`.

## 2. Nên thiết kế ba sao thế nào

Ba sao nên đo ba thứ khác nhau, đừng chồng lên nhau:

| Sao | Đo cái gì | Câu hỏi giáo viên | Điều kiện hay dùng |
|---|---|---|---|
| ★ | **Làm được** | Robot có tới đích, vẽ đúng, dừng đúng chỗ không? | `dungTrongVung`, `quaCacVung`, `huongCuoi`, `veGiongMau`, `diDuoc` |
| ★★ | **Làm tốt** | Có làm gọn, an toàn, nhanh không? | `khongChamTuong`, `khongVaoVung`, `thoiGianDuoi`, `lechNgangToiDa` |
| ★★★ | **Hiểu** | Có dùng đúng công cụ của bài học này không? | `soKhoiToiDa`, `dungKhoi`, `dungCamBien`, `khongDungKhoi` |

Quy tắc kinh nghiệm:

1. **Sao 1 chỉ chứa điều kiện kết quả** (đích đến, trạng thái cuối). Đừng đưa thời gian hay số khối vào `mucTieu`: học sinh yếu sẽ không có sao nào và nản.
2. **Mỗi sao thêm một ý duy nhất**, để học sinh biết mình thiếu gì. Một sao ghép ba điều kiện thì khó biết hỏng ở đâu (khung kết quả vẫn ghi từng điều kiện đạt hay chưa).
3. **Sao 3 gắn với mục tiêu bài học**, không chỉ "nhanh hơn". Bài vòng lặp thì `dungKhoi` bắt buộc dùng `controls_repeat_ext`; bài cảm biến thì `dungCamBien`; bài gyro thì `dungKhoi` khối `sra_goc_quay`.
4. **Điều kiện ngăn "ăn gian"** đặt vào `mucTieu` hoặc sao 2: `khongDungKhoi` (cấm khối "đi … cm" ở bài tập đếm vòng bánh), `khongVaoVung` (vùng cấm), `khongChamTuong`.
5. Học sinh viết Python: `soKhoiToiDa`, `dungKhoi`, `dungCamBien`, `khongDungKhoi` đều **không đạt**. Bài nào muốn cho Python thì đừng dùng bốn điều kiện này trong `mucTieu`.

## 3. Ví dụ từng loại (đoạn JSON dán thẳng được)

Vùng dùng trong ví dụ khai báo trong `vung` (tọa độ cm, gốc ở tâm sân):

```json
"vung": {
  "dich": { "ten": "ô đích D6", "x": -12.5, "y": 12.5, "rong": 20, "dai": 20, "mau": "xanh" },
  "ho":   { "ten": "hồ nước", "x": 40, "y": 0, "rong": 40, "dai": 40, "mau": "do" }
}
```

**Đến đích và dừng đúng chỗ**
```json
{ "loai": "dungTrongVung", "vung": "dich" }
```

**Đi qua một vùng (không cần dừng)**: `denVung`. **Đi qua nhiều vùng theo thứ tự**:
```json
{ "loai": "quaCacVung", "vung": ["kt1", "kt2", "kt3"], "theoThuTu": true }
```

**Vùng cấm**
```json
{ "loai": "khongVaoVung", "vung": "ho", "moTa": "Không để robot rơi xuống hồ" }
```

**Không chạm tường, giới hạn thời gian**
```json
{ "loai": "khongChamTuong" },
{ "loai": "thoiGianDuoi", "giay": 20 }
```

**Hướng lúc dừng**: góc 0 = lên, 90 = phải, 180 = xuống, 270 = trái.
```json
{ "loai": "huongCuoi", "goc": 270, "saiSo": 15 }
```

**Giới hạn số khối / bắt buộc dùng một loại khối / cấm một loại khối**
```json
{ "loai": "soKhoiToiDa", "khoi": 3 },
{ "loai": "dungKhoi", "khoi": ["controls_repeat_ext", "controls_repeat"], "toiThieu": 1, "tenKhoi": "vòng lặp" },
{ "loai": "khongDungKhoi", "khoi": "sra_di" }
```

**Đi đúng quãng / quay đúng góc / đi thẳng** (đo từ lúc bánh bắt đầu lăn)
```json
{ "loai": "diDuoc", "cm": 100, "saiSo": 2 },
{ "loai": "quayThan", "do": 90, "saiSo": 2 },
{ "loai": "lechNgangToiDa", "cm": 3 }
```

**Hai bánh quay đều nhau (bài hiệu chỉnh motor)**
```json
{ "loai": "chenhVongToiDa", "vong": 0.3 }
```

**Thời gian bánh chạy nằm trong khoảng (bài "một mét bốn giây")**
```json
{ "loai": "thoiGianChuyenDong", "tu": 3.8, "den": 4.2 }
```

**Cảm biến**
```json
{ "loai": "dungCamBien", "toiThieu": 3 },
{ "loai": "khoangCachCuoi", "tu": 18, "den": 22 }
```
`khoangCachCuoi` dùng đúng số đo của khối "khoảng cách (cm) đo bởi cảm biến siêu âm". Robot cần có cảm biến siêu âm (xem mục 5).

**Nét vẽ so với hình mẫu (bài bút vẽ)**: khai báo `hinhMau` rồi chấm bằng `veGiongMau`.
```json
"hinhMau": { "tamGiac": { "buoc": [["lap", 3, [["di", 100], ["phai", 120]]]] } },
...
{ "loai": "veGiongMau", "mau": "tamGiac", "saiSo": 4, "phu": 90, "chinhXac": 90 }
```
`phu` là % hình mẫu có nét vẽ đi qua, `chinhXac` là % nét vẽ nằm sát hình mẫu. Hai số này chống hai kiểu gian lận: vẽ thiếu hoặc vẽ thừa.

**Nhiều robot, cộng dồn qua các lượt chạy**
```json
{ "loai": "hoanThanhVoiCacRobot", "robot": ["banh-to", "banh-nho"] }
```

## 4. Chọn ngưỡng cho đúng

Ngưỡng sai là lỗi phổ biến nhất: quá chặt thì học sinh giải đúng mà không được sao, quá lỏng thì sao mất ý nghĩa.

1. **Chạy lời giải mẫu trước, rồi đặt ngưỡng từ số thật.** Thời gian giả lập khác đời thật: khoảng 6 giây cho 100 cm ở tốc độ mặc định, mỗi lần quay 90° khoảng 3 giây. Sao thời gian nên đặt **hơn lời giải mẫu 30–50 %**.
2. **Sai số góc và quãng**: quay 90° bằng bánh có sai số vài độ, để `saiSo` 10–15 độ cho `huongCuoi` nếu không muốn bắt học sinh hiệu chỉnh. Chỉ dùng `saiSo` 2 khi chính bài học là hiệu chỉnh (chặng hiệu chỉnh động cơ).
3. **Kích thước vùng đích**: vùng rộng hơn nhiều so với xe thì dễ, vùng chỉ nhỉnh hơn xe một chút thì khó. Thử bằng lời giải mẫu rồi nới ra nếu lời giải mẫu hay trượt.
4. **Số khối**: đếm bằng lời giải gọn nhất, rồi cộng 1 hoặc 2. Khối mũ "When Started" và khối số/phép toán gắn bên trong không tính.
5. **Bài có `bienThe`** (mỗi lần chạy một phiên bản sân): ngưỡng phải đạt được trên **mọi** phiên bản.
6. **Đừng dựa vào thời gian khi máy chậm**: nếu bài dài, tăng `thoiGianToiDa` (mặc định 90 giây) để lượt chạy không bị cắt giữa chừng.

## 5. Tiêu chí liên quan tới xe và code mẫu

Một số tiêu chí chỉ có nghĩa khi xe **có đúng cảm biến**:

| Điều kiện | Xe phải có |
|---|---|
| `dungCamBien` với `toiThieu: 3` | 3 cảm biến màu / dò line |
| `khoangCachCuoi` | cảm biến siêu âm, đo được hướng cần đo |
| `dungKhoi` với `sra_goc_quay` | con quay (gyro) |
| `veGiongMau` | bút vẽ |
| bài chạm tường | cảm biến chạm ở mũi |

Vì vậy khi thêm một bài cần cảm biến:

1. Đặt **cấu hình xe của bài** trong `public/san-robot-ao/code-mau/<mã-bài>.json` (trường `xe`, `tenXe`, `giaiThichXe`). Code mẫu và xe đi chung một tệp, để nút **Dùng xe và code mẫu** nạp đúng xe đúng chương trình. Xem [code-mau-xe-lap-rap.md](code-mau-xe-lap-rap.md).
2. Ghi `sao` trong tệp code mẫu là số sao mong đợi, rồi chạy `node scripts/code-mau/kiem-tra-code-mau.js <nhóm>`: lệnh sẽ chạy code mẫu trên mọi phiên bản sân và báo lệch.
3. Nếu tiêu chí cần một loại cảm biến mà xe của bài không có, học sinh sẽ không thể đạt sao đó. Kiểm tra bằng cách mở bài, bấm **Lắp lại xe của bài**, rồi đối chiếu khối cảm biến trong hộp công cụ.

(Cách nạp code mẫu và cập nhật xe theo code mẫu do một phần việc khác xử lí, không nằm trong tài liệu này.)

## 6. Thêm một map mới: quy trình từng bước

1. **Chọn hoặc dựng sân** trong `san/` (mục 5 của `huong-dan-them-bai.md`).
2. **Viết ý định bài** bằng một câu cho mỗi sao: "★ làm được gì, ★★ làm tốt thế nào, ★★★ hiểu cái gì". Viết trước khi đụng JSON.
3. **Sao chép một bài gần giống** làm khung, đổi `tieuDe`, `viTriBatDau`, `vung`, `deBai`.
4. **Khai báo vùng** (`vung`): đích, vùng cấm, điểm kiểm tra. Điểm kiểm tra dùng `"an": true` nếu không muốn vẽ ra sân.
5. **Viết `mucTieu` và `sao`** theo mục 2 và 3 ở trên. `moTa` ngắn, đọc to lên là học sinh hiểu.
6. **Viết `nguyenLi` và `goiY`**: nguyên lí một đoạn, rồi giải thích đơn giản cho học sinh; gợi ý đi từ nhẹ tới gần đáp án (dùng `moSauLanThu` để khóa gợi ý cuối).
7. **Thêm vào `danh-sach.json`** đúng chặng, đúng thứ tự.
8. **Viết code mẫu** (và xe nếu cần cảm biến) trong `code-mau/`.
9. **Chạy kiểm tra**: mở bài kiểm tra bằng tay một lời giải đúng (3 sao) và một lời giải sai (không sao, lí do dễ hiểu). Chạy tự động:
   ```bash
   cd public && python3 -m http.server 1337 &
   node scripts/thu-thach/kiem-tra-bai.js <mã-bài>
   ```
   Thêm các ca vào bảng `CA` của `scripts/thu-thach/kiem-tra-bai.js`: một lời giải đạt 3 sao, một đạt 2 sao nhưng thiếu sao 3 (ví dụ không dùng vòng lặp), một sai hẳn.

## 7. Lỗi thường gặp

| Hiện tượng | Nguyên nhân thường là |
|---|---|
| Học sinh tới đích mà không được sao nào | Điều kiện trong `mucTieu` quá chặt (ví dụ thêm `khongChamTuong` vào `mucTieu` thay vì sao 2). |
| Sao 3 không bao giờ đạt | Học sinh dùng Python (các điều kiện về khối không đạt), hoặc xe thiếu cảm biến. |
| `quaCacVung` không đạt dù robot đi đúng đường | Vùng kiểm tra quá nhỏ hoặc nằm lệch đường; robot đi hơi khác vẫn không chạm. Nới `rong`, `dai`, hoặc thử `denVung`. |
| `huongCuoi` cho kết quả ngược | Nhớ góc 90 là **phải**, 270 là **trái**; vị trí robot tính ở điểm giữa hai bánh. |
| `khongChamTuong` đạt dù robot vừa sượt qua tường | Chỉ tính chạm vào tường bao hoặc vật cố định (`physicsOptions: "fixed"`). Vật thể không cố định đẩy được thì không tính. |
| Bài hợp lệ ở máy này, lỗi khi học sinh mở | Đổi tên tệp bài làm mất tiến độ cũ; kiểm tra mã bài trong `danh-sach.json` khớp tên tệp. |

## 8. Cần điều kiện mới?

Thêm một mục vào `SRA.luat` trong [`core/star-rules.js`](../public/san-robot-ao/core/star-rules.js) với hai hàm `moTa()` và `kiemTra()`. Dữ liệu lượt chạy (`ctx`) được ghi chú ở đầu tệp: vị trí cuối, vùng đã vào, số lần chạm, thời gian, số khối, loại khối. Cần theo dõi thêm dữ liệu trong lúc chạy thì sửa `core/challenge-engine.js`. Ví dụ điều kiện ngoài danh sách hiện có: "đẩy hộp vào vùng", "đếm đủ N vạch", "không bao giờ vượt tốc độ X".
