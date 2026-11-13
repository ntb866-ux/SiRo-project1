# Cách thêm một bài thử thách mới

Tài liệu cho người viết bài (giáo viên và các gói G4–G9). Thêm bài **không cần sửa mã JS**: chỉ cần một tệp JSON cho bài và một dòng trong mục lục.

## 1. Ba bước

1. **Chọn sân** trong `public/san-robot-ao/san/`. Hiện có `luoi-toa-do` (200 × 200 cm, lưới 8 × 8 ô, mỗi ô 25 cm). Cần sân mới thì xem mục 5.
2. **Viết tệp bài** `public/san-robot-ao/thu-thach/<chặng>/<số>-<tên-bài>.json`, ví dụ `01-di-chuyen/02-lui-ve-cho-cu.json`. Tên viết thường, không dấu, nối bằng gạch ngang.
3. **Thêm mã bài vào mục lục** `public/san-robot-ao/thu-thach/danh-sach.json`, đúng chặng, đúng thứ tự. Mã bài là đường dẫn bỏ `.json`: `01-di-chuyen/02-lui-ve-cho-cu`.

Mở thử: `http://localhost:1337/san-robot-ao/` (chạy `python -m http.server 1337` trong `public/`), hoặc mở thẳng bài: `http://localhost:1337/index.html?baiTap=01-di-chuyen/02-lui-ve-cho-cu`.

Bài mẫu đầy đủ: [`thu-thach/01-di-chuyen/01-tien-toi-o-dich.json`](../public/san-robot-ao/thu-thach/01-di-chuyen/01-tien-toi-o-dich.json).

## 2. Hệ tọa độ

- Đơn vị **cm**. Gốc (0, 0) ở **tâm sân**.
- **x** tăng sang phải, **y** tăng lên trên (nhìn từ trên xuống, đúng chiều ảnh nền).
- **Vị trí robot** là **điểm giữa hai bánh** (tâm quay, cũng là chỗ đặt bút vẽ), không phải tâm thân robot. `viTriBatDau` đặt điểm này, và mọi điều kiện vùng đều xét điểm này. Robot quay tại chỗ thì điểm này đứng yên.
- **Góc** tính bằng độ: `0` = robot quay mặt lên trên (+y), `90` = quay sang phải (+x), `180` = quay xuống, `270` = quay sang trái. Robot quay phải thì góc tăng.
- Trên sân `luoi-toa-do`, tâm ô cột A…H có x = −87,5; −62,5; −37,5; −12,5; 12,5; 37,5; 62,5; 87,5. Hàng 1…8 có y cùng dãy số đó (hàng 1 ở dưới).

## 3. Các trường của tệp bài

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `tieuDe` | có | Tên bài hiện trên trang chọn bài và khung đề. |
| `san` | có | Tên thư mục sân trong `san/`. |
| `robot` | nên có | Tên tệp robot trong `robots/` (không có `.json`), ví dụ `co-ban`. Chưa có tệp đó thì dùng robot mặc định của GEARS. |
| `viTriBatDau` | có | `{ "x": …, "y": …, "goc": … }` vị trí và hướng xuất phát. |
| `vung` | thường có | Các vùng trên sân, đặt tên tùy ý. Mỗi vùng: `x`, `y` (tâm), `rong` (theo x), `dai` (theo y), `ten` (tên đọc cho học sinh, ví dụ "ô đích D6"), `mau` (`xanh`, `vang`, `do`, `lam`, `tim` hoặc mã `#rrggbb`), `an: true` nếu không muốn vẽ. |
| `deBai` | có | Đề bài. Chữ thường; `**chữ đậm**`; dòng trống để tách đoạn. |
| `mucTieu` | có | Danh sách điều kiện **phải đạt hết** mới tính là hoàn thành (sao 1). |
| `sao` | có | Đúng 3 mục, xem mục 4. |
| `nguyenLi` | nên có | Nguyên lí khoa học, hiện trong ô "Vì sao robot làm được vậy?". Nên có một câu nói đơn giản cho học sinh. |
| `goiY` | nên có | Gợi ý theo bậc, từ nhẹ đến gần đáp án. Mỗi gợi ý là một chuỗi, hoặc `{ "noiDung": "…", "moSauLanThu": 2 }` để chỉ mở sau khi học sinh đã chạy ít nhất 2 lần. |
| `thoiGianToiDa` | không | Giây tối đa cho một lượt chạy, hết giờ thì dừng và tính chưa đạt. Mặc định 90. |
| `vatThe` | không | Vật thể thêm vào sân riêng cho bài này (tường ngăn, khối hộp…), theo định dạng `objects` của GEARS (xem tệp sân). Vật thể có `"physicsOptions": "fixed"` được tính là tường. |
| `maBatDau` | không | Chương trình khối mở sẵn (XML của Blockly), dùng cho bài "sửa lỗi chương trình". |
| `cheDo` | không | `co-ban` hoặc `nang-cao`: ép chế độ khối của gói G1 (khối "đi tới … cm", "quay phải … độ" ở Cơ bản). Bỏ trống thì giữ chế độ học sinh đang dùng. |
| `locKhoi` | không | Ẩn bớt khối trong hộp công cụ, theo định dạng lọc của GEARS: `{ "deny": { "categories": [...], "blocks": [...] } }`. |
| `camera` | không | `toanSan` (mặc định: nhìn từ trên xuống thấy cả sân), `follow` (bám robot) hoặc `arc`. |
| `phieu` | không | Đường dẫn phiếu học tập, tính từ `san-robot-ao/`. |
| `soDo` | không | Bật bảng số đo nổi trên sân: `true` (mọi dòng) hoặc mảng tên dòng, ví dụ `["vongTrai", "vongPhai", "tien", "thoiGian"]`. Dòng có sẵn (G5): `thoiGian`, `vongTrai`, `vongPhai`, `vongGiay`, `quangDuong`, `tien`, `tocDo`, `quayThan`, `lechNgang`. Gói khác thêm dòng bằng `SRA.soDo.them(...)` (xem `core/so-do.js`). |
| `robotChon` | không | Cho học sinh đổi robot ngay trong bài: `[{ "tep": "banh-to", "ten": "Robot bánh to" }, …]`. Robot lúc mở bài là trường `robot`. |
| `motorYeu` | không | Làm một motor yếu đi: `{ "banh": "phai", "phanTram": 8 }` (bánh phải chỉ đạt 92 % tốc độ được lệnh). Ghi đè trường `sraMotorYeu` của tệp robot; `null` thì tắt. |
| `giaTocBanh` | không | Gia tốc tối đa của bánh (độ/giây sau mỗi mili giây). GEARS mặc định 20 (gần như tức thì, bánh trượt và xe lệch hướng lúc khởi động); `2.5` cho khởi động êm trong 0,2 giây. |

## 4. Điều kiện và cách chấm sao

**Sao 1** = đạt mọi điều kiện trong `mucTieu`.
**Sao 2, sao 3** = đã hoàn thành **và** đạt điều kiện riêng của sao đó. Hai sao này tính độc lập: học sinh có thể được sao 1 + sao 3 mà thiếu sao 2 (khi đó hiện 2 sao). Trang chọn bài ghi kết quả tốt nhất từng đạt.

```json
"sao": [
  { "moTa": "Robot dừng trong ô đích" },
  { "moTa": "Không chạm tường, tối đa 10 giây",
    "dieuKien": [ { "loai": "khongChamTuong" }, { "loai": "thoiGianDuoi", "giay": 10 } ] },
  { "moTa": "Chỉ dùng 1 khối lệnh",
    "dieuKien": [ { "loai": "soKhoiToiDa", "khoi": 1 } ] }
]
```

`moTa` là câu hiện cho học sinh; bỏ trống thì khung tự ghép từ các điều kiện.

Các loại điều kiện (`loai`) có sẵn, dùng được cả trong `mucTieu` lẫn trong `sao`:

| `loai` | Tham số | Đạt khi |
|---|---|---|
| `dungTrongVung` | `vung` | Lúc kết thúc, tâm robot nằm trong vùng. |
| `denVung` | `vung` | Tâm robot từng đi vào vùng ít nhất một lần. |
| `quaCacVung` | `vung` (mảng tên), `theoThuTu` (true/false) | Robot đi qua mọi vùng trong danh sách, đúng thứ tự nếu `theoThuTu`. |
| `khongVaoVung` | `vung` | Robot không bao giờ đi vào vùng (vùng cấm). |
| `khongChamTuong` | | Robot không chạm tường bao hay vật cản cố định. Robot dội lại rồi chạm tiếp trong 0,3 giây vẫn tính một lần. |
| `thoiGianDuoi` | `giay` | Thời gian chạy không quá số giây. |
| `soKhoiToiDa` | `khoi` | Số khối lệnh không quá `khoi`. Không tính khối mũ "When Started" và khối số/phép toán gắn bên trong. Học sinh viết Python thì điều kiện này không đạt. |
| `huongCuoi` | `goc`, `saiSo` (mặc định 10) | Lúc kết thúc, robot quay mặt về hướng `goc` ± `saiSo` độ. |
| `dungKhoi` | `khoi` (tên loại khối Blockly, chuỗi hoặc mảng), `toiThieu` (mặc định 1), `tenKhoi` (tên đọc, không bắt buộc) | Chương trình có ít nhất `toiThieu` khối thuộc các loại đó, ví dụ `["controls_repeat_ext", "controls_repeat"]` để bắt buộc dùng vòng lặp, `["sra_ha_but", "penDown"]` cho khối hạ bút. Viết Python thì không đạt. |

Các điều kiện dựa trên bảng số đo (G5, tệp `core/so-do-chuyen-dong.js`). Số đo tính từ chỗ và hướng của robot lúc bắt đầu lăn bánh:

| `loai` | Tham số | Đạt khi |
|---|---|---|
| `diDuoc` | `cm`, `saiSo` (mặc định 2) | Robot đi tới được `cm` ± `saiSo` theo hướng đầu xe lúc xuất phát. |
| `lechNgangToiDa` | `cm` | Lúc dừng, robot lệch khỏi đường thẳng xuất phát không quá `cm`. |
| `quayThan` | `do` (dương = quay phải), `saiSo` (mặc định 2) | Thân xe đã quay `do` ± `saiSo` độ so với lúc xuất phát. |
| `chenhVongToiDa` | `vong` | Số vòng hai bánh đã quay chênh nhau không quá `vong`. |
| `thoiGianChuyenDong` | `tu`, `den` | Thời gian bánh được lệnh chạy (từ lệnh chạy đầu tiên tới lệnh dừng) nằm trong khoảng, tính bằng giây. |
| `hoanThanhVoiCacRobot` | `robot` (mảng tên tệp robot) | Đã đạt `mucTieu` với từng robot trong danh sách, cộng dồn qua các lượt chạy (dùng cùng `robotChon`). |
| `khongDungKhoi` | `khoi` (tên loại khối, chuỗi hoặc mảng) | Chương trình không có khối nào thuộc các loại đó. Viết Python thì không đạt. |

Mỗi điều kiện có thể thêm `"moTa": "…"` để thay câu mô tả tự động.

**Khi nào một lượt chạy kết thúc:** chương trình chạy xong và robot đứng yên 0,4 giây, hoặc hết `thoiGianToiDa`. Học sinh bấm Dừng, kéo robot bằng tay hay dùng tay điều khiển thì lượt đó không chấm. Nút ▶ Chạy luôn đặt robot về chỗ xuất phát trước khi chạy.

Cần loại điều kiện mới (ví dụ "đẩy hộp vào vùng", "vẽ đủ hình vuông")? Thêm một mục vào `SRA.luat` trong [`core/star-rules.js`](../public/san-robot-ao/core/star-rules.js) với hai hàm `moTa()` và `kiemTra()`; dữ liệu lượt chạy (`ctx`) được ghi chú ở đầu tệp. Nếu cần theo dõi thêm dữ liệu trong lúc chạy thì sửa hàm `render` trong `core/challenge-engine.js`.

## 5. Thêm sân mới

Mỗi sân một thư mục `san/<tên-sân>/`:

- `world.json`: định dạng thế giới của GEARS (`"worldName": "custom"`), cộng hai trường `tenSan`, `moTaSan` cho học sinh đọc. Đường dẫn ảnh (`imageURL`) tính từ thư mục `public/`, ví dụ `san-robot-ao/san/luoi-toa-do/nen.png`. Để ảnh trong repo, không dùng ảnh ở máy chủ ngoài.
- `nen.png`: ảnh nền. Kích thước thật của sân = số điểm ảnh ÷ 10 × `imageScale` (cm). Ảnh 1000 px với `imageScale: 2` cho sân 200 cm.
- `thumb.png`: ảnh nhỏ (không bắt buộc).

Cách nhanh: dựng sân bằng menu Worlds → Custom của GEARS, lưu ra tệp, đổi `imageURL` về ảnh trong repo.

## 6. Mục lục `danh-sach.json`

```json
{
  "chang": [
    {
      "id": "01-di-chuyen",
      "ten": "Chặng 1 · Di chuyển",
      "moTa": "Làm quen với robot…",
      "moKhoaTuanTu": false,
      "bai": ["01-di-chuyen/01-tien-toi-o-dich", "01-di-chuyen/02-…"]
    }
  ]
}
```

`moKhoaTuanTu: true` thì bài sau chỉ mở khi bài trước đạt ít nhất 1 sao. Giáo viên mở hết bằng `san-robot-ao/?moKhoa=1`. Nút "Bài tiếp theo" sau khi đạt đi theo thứ tự trong tệp này.

## 7. Tiến độ lưu ở đâu

Trong `localStorage` của trình duyệt: `sanRobotAo.tienDo.v1` (sao, thời gian tốt nhất, số khối ít nhất, số lần chạy, số gợi ý đã xem) và `sanRobotAo.ma.v1.<mã-bài>` (chương trình khối của từng bài). Đổi tên tệp bài là mất tiến độ của bài đó, nên đừng đổi mã bài sau khi học sinh đã dùng. Trang chọn bài có nút tải tiến độ ra tệp `.json` để học sinh nộp.

## 8. Kiểm tra trước khi mở PR

- [ ] Tệp JSON hợp lệ (`python -m json.tool tep.json`).
- [ ] Mở bài, đọc đề: không lỗi, vùng hiện đúng chỗ, robot xuất phát đúng ô và đúng hướng.
- [ ] Chạy một lời giải đúng: được 3 sao. Chạy một lời giải sai: thông báo chưa đạt có lí do dễ hiểu.
- [ ] Gợi ý cuối đủ để học sinh yếu làm được, gợi ý đầu không lộ đáp án.
- [ ] Không dùng tên, logo hay hình ảnh của VEX.
