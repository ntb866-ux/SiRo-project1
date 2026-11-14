# Bài cảm biến màu và dò đường (gói G7)

Tài liệu cho giáo viên. Năm bài của **chặng 3**, robot nhìn xuống sân bằng cảm biến màu: dừng ở vạch, đếm vạch, nhận màu để rẽ, dò đường bằng 1 rồi 3 cảm biến. Bài 1–4 dùng robot chuẩn `co-ban` (1 cảm biến màu, cổng 1); bài 5 dùng robot `do-line` (3 cảm biến: trái cổng 6, giữa cổng 1, phải cổng 7, cách nhau 3 cm). Cả năm bài ở chế độ khối **Cơ bản**.

Mở trang chọn bài: `san-robot-ao/`, chặng "Chặng 3 · Cảm biến màu". Giáo viên mở khóa mọi bài bằng `san-robot-ao/?moKhoa=1`.

## Nguyên lí dùng xuyên suốt

### 1. Phản xạ và hấp thụ ánh sáng

Cảm biến màu có một **đèn** chiếu xuống sân và một **tế bào quang điện** (photodiode) đo lượng ánh sáng hắt ngược lên. Ánh sáng chiếu tới một bề mặt thì một phần bị **hấp thụ** (biến thành nhiệt), phần còn lại bị **phản xạ** khuếch tán theo mọi hướng, trong đó có hướng về cảm biến.

- Mặt **trắng** phản xạ gần hết mọi màu của ánh sáng → số đo cao, gần 100.
- Mặt **đen** hấp thụ gần hết → số đo thấp, gần 0.
- Mặt **có màu** hấp thụ một số màu và phản xạ màu còn lại. Ô đỏ dưới ánh sáng trắng hắt lại chủ yếu ánh sáng đỏ, ô xanh lá hắt lại chủ yếu ánh sáng lục.

Khối **"độ sáng phản xạ"** cho số từ 0 đến 100. Khối **"cảm biến … thấy màu …?"** đo riêng ba phần đỏ, lục, lam rồi đoán màu.

> Nói với học sinh: soi đèn pin xuống sàn. Chỗ giấy trắng sáng lóa, chỗ vải đen gần như không thấy ánh đèn hắt lại. Cảm biến của robot cũng chỉ hỏi: "chỗ này sáng hay tối?"

**Chi tiết đáng giảng cho học sinh khá:** giống cảm biến EV3 thật, chế độ "độ sáng phản xạ" của giả lập chiếu **đèn đỏ** và đo ánh sáng đỏ hắt lại. Vì vậy ô **đỏ** cho số đo cao như trắng, còn ô **xanh lá** cho số đo thấp gần như đen (mặt xanh lá hấp thụ ánh sáng đỏ). Thí nghiệm nhanh: cho robot đứng trên ô xanh lá ở bài 4, xem bảng số đo: độ sáng khoảng 18 nhưng màu vẫn là "xanh lá". Đây là lí do muốn phân biệt màu phải dùng khối "thấy màu", không dùng độ sáng.

### 2. Ngưỡng

Chương trình biến một số đo liên tục (0–100) thành câu trả lời có/không bằng cách so với **ngưỡng**. Ngưỡng tốt nằm giữa số đo trên trắng và trên đen. Trong giả lập: nền trắng 100, làn xám nhạt ở bài 2 khoảng 88, vạch đen 3–4 cm khoảng 7, mép vạch khoảng 50. Ngưỡng 50 dùng được cho cả năm bài.

Bảng số đo góc trên bên trái sân hiện số đo và màu **theo thời gian thực**, kể cả khi robot đứng yên (kéo robot bằng chuột để thử). Bên dưới là **biểu đồ độ sáng 10 giây gần nhất** với đường ngưỡng đỏ đứt nét: học sinh thấy số đo "tụt xuống" mỗi khi qua vạch. Bấm tiêu đề biểu đồ để thu gọn.

> Nói với học sinh: ngưỡng giống vạch kẻ trên cốc đo. Nước dưới vạch thì "chưa đầy", trên vạch thì "đầy". Robot cũng chỉ cần biết số đo ở trên hay dưới vạch 50.

### 3. Cảm biến nhìn một vùng, không nhìn một điểm

Mỗi cảm biến nhìn một vòng tròn rộng khoảng **2,6 cm** trên mặt sân và lấy trung bình. Vì vậy trên vạch 2 cm số đo không về 0, và ở **mép vạch** (nửa đen nửa trắng) số đo khoảng 50. Bài 4 dùng đúng tính chất này để bám mép vạch.

### 4. Cảm biến nằm trước bánh xe, robot không dừng tức thì

Cảm biến màu gắn **trước điểm giữa hai bánh 3 cm**. Robot đang chạy còn trôi thêm khoảng 1–2 cm sau lệnh dừng (quán tính). Ở bài 1, lúc dừng, điểm giữa hai bánh cách mép vạch khoảng 1–2 cm, cảm biến nằm trên vạch. Ở bài 3, cảm biến vừa chạm mép ô thì bánh xe còn cách tâm ô 10 + 3 = 13 cm, nên phải đi thêm 13 cm rồi mới rẽ.

### 5. Vòng điều khiển có phản hồi

Bài 4 và 5 là **điều khiển vòng kín**: đo → so với ngưỡng → sửa hướng → đo lại, lặp vài chục lần mỗi giây. Cách "nếu tối thì lái phải, không thì lái trái" gọi là **bật – tắt**. Tốc độ càng cao thì mỗi lần sửa càng trễ, robot càng dễ văng khỏi vạch ở khúc cua. Học sinh khá có thể thử **điều khiển tỉ lệ**: lái mạnh hay nhẹ tùy theo số đo lệch khỏi 50 bao nhiêu (ví dụ bánh trái = 30 + 0,5 × (độ sáng − 50), bánh phải = 30 − 0,5 × (độ sáng − 50)).

## Từ ngữ

| Từ | Gốc | Ghi chú |
|---|---|---|
| **phản xạ** | Hán Việt 反射: *phản* (ngược lại) + *xạ* (bắn ra) | "Bắn ngược trở lại". Tiếng Anh *reflect* từ Latin *re-* (trở lại) + *flectere* (uốn, bẻ cong): ánh sáng "bị bẻ quay lại". |
| **hấp thụ** | Hán Việt 吸收: *hấp* (hút vào) + *thụ* (nhận) | Tiếng Anh *absorb* từ Latin *ab-* (khỏi) + *sorbere* (hút, nuốt). |
| **ngưỡng** | Hán Việt 閾/檻: bậu cửa | Đúng nghĩa đen là bậc cửa phải bước qua. Tiếng Anh *threshold* cũng là "bậu cửa" (tiếng Anh cổ *þerscold*), tiếng Pháp *seuil* và tiếng Đức *Schwelle* cũng vậy: nhiều ngôn ngữ cùng lấy hình ảnh "bước qua bậu cửa" để chỉ mức mà vượt qua thì trạng thái đổi khác. |
| **cảm biến** | *cảm* (cảm nhận) + *biến* (biến đổi) | Thiết bị cảm nhận một đại lượng và đổi nó thành tín hiệu điện. Tiếng Anh *sensor* từ Latin *sentire* (cảm thấy), cùng gốc với *sense*. |
| **dò đường** | | Tiếng Anh *line following*; trong cuộc thi robot thường gọi là "dò line". |

## Năm bài và buổi dạy

Chặng 3 trong lộ trình 12 buổi (sau chặng 2 về vòng lặp). Gợi ý chia thành 2–3 buổi: buổi đầu bài 1–2 (cảm biến và ngưỡng, đếm), buổi sau bài 3 (quyết định theo màu), buổi cuối bài 4–5 (dò đường).

| Buổi | Mã bài | Bài | Kĩ năng mới | Lời giải mẫu |
|---|---|---|---|---|
| 1 | `03-cam-bien-mau/01-dung-o-vach` | Dừng ở vạch đen | "đi mãi", "chờ đến khi", so với ngưỡng | đi tới mãi; chờ đến khi độ sáng < 50; dừng (3 khối) |
| 1 | `03-cam-bien-mau/02-dem-vach` | Đếm vạch, dừng ở vạch số 4 | đếm theo lúc chuyển trạng thái, biến đếm | xem bài 2 bên dưới (7 khối) |
| 2 | `03-cam-bien-mau/03-phan-loai-mau` | Phân loại màu: đỏ rẽ trái, xanh rẽ phải | "nếu … thì … không thì", nhận màu | xem bài 3 (11 khối) |
| 3 | `03-cam-bien-mau/04-do-line-1-cam-bien` | Dò đường bằng 1 cảm biến | bám mép vạch, điều khiển bật – tắt | lặp đến khi thấy xanh lá { nếu tối thì lái trái, không thì lái phải } |
| 3 | `03-cam-bien-mau/05-do-line-3-cam-bien` | Dò đường cua gắt bằng 3 cảm biến | dùng nhiều cảm biến, "nếu" lồng nhau | xem bài 5 |

**Vì sao vị trí xuất phát hay màu ô đổi mỗi lần chạy?** Bài 1–3 dùng trường `bienThe`: mỗi lần bấm Chạy, robot xuất phát ở một trong vài chỗ (bài 1, 2) hoặc màu các ô đổi ngẫu nhiên (bài 3). Học sinh không thể đo sẵn quãng đường rồi dùng "đi tới … cm"; phải dùng cảm biến. Nếu em nào làm đúng một lần rồi sai lần sau, đó thường là dấu hiệu chương trình đang "học thuộc sân".

### Bài 1. Dừng ở vạch đen

Robot xuất phát ở một trong ba dấu chữ V (cách vạch 70, 90 hoặc 110 cm). Lời giải 3 khối: **đi tới mãi**, **chờ đến khi** < độ sáng phản xạ cảm biến giữa < 50 >, **dừng lại**. Dùng "thấy màu đen" cũng đạt nhưng chỉ 2 sao: sao 2 đòi so độ sáng với ngưỡng, vì đó là nguyên lí của bài.

Hoạt động gợi ý trước khi lập trình: kéo robot bằng chuột từ nền trắng vào vạch, cả lớp đọc số đo trên bảng, ghi lại "trắng ≈ …, đen ≈ …, mép ≈ …", rồi thảo luận chọn ngưỡng. Câu hỏi: nếu chọn ngưỡng 95 hay 5 thì sao? (95: robot dừng ngay khi lướt qua vết bẩn hay bóng; 5: có thể đi qua vạch mà không nhận ra.)

Lỗi hay gặp: dùng "chờ 1 giây" thay vì "chờ đến khi"; đặt "dừng lại" trước "chờ đến khi"; quên "đi tới mãi" nên robot đứng yên chờ mãi (hết giờ).

### Bài 2. Đếm vạch, dừng ở vạch số 4

Làn đường có 6 vạch dày 3 cm, khoảng cách không đều (25, 20, 30, 20, 25 cm); robot xuất phát ở một trong ba chỗ. Hai lời giải:

- **2 sao:** đi tới mãi; **lặp lại 3 lần** { chờ đến khi thấy đen; chờ đến khi thấy trắng }; chờ đến khi thấy đen; dừng lại.
- **3 sao (biến đếm):** đặt *số vạch* = 0; đi tới mãi; **lặp cho đến khi** *số vạch* = 4 { chờ đến khi độ sáng > 50; chờ đến khi độ sáng < 50; thay đổi *số vạch* thêm 1 }; dừng lại.

Điểm mấu chốt là **đếm lúc chuyển từ sáng sang tối**, không đếm "đang tối". Robot cần khoảng 0,1 giây để đi qua vạch 3 cm, trong lúc đó vòng lặp đã đọc cảm biến hàng chục lần. Chương trình quên "chờ đến khi sáng" thì đếm một vạch thành 4 lần và dừng ngay ở vạch số 1 (kiểm thử của dự án cho đúng kết quả này). Cho học sinh chạy bản sai này trước rồi tìm lỗi là một hoạt động tốt.

> Nói với học sinh: đếm bậc thang thì đếm lúc đặt chân lên bậc mới, đứng trên một bậc bao lâu cũng chỉ là một bậc.

Liên hệ: máy đếm người qua cổng, máy đếm sản phẩm trên băng chuyền, đếm vòng quay bánh xe đạp bằng nam châm đều đếm "lúc chuyển".

### Bài 3. Phân loại màu: đỏ rẽ trái, xanh rẽ phải

Ô màu thứ nhất cách chỗ xuất phát 40 cm (từ tâm quay tới mép ô), ô thứ hai cách ô thứ nhất 60 cm. Mỗi lần chạy, màu hai ô được chọn ngẫu nhiên trong 4 tổ hợp, nên đích vàng ở 4 chỗ khác nhau.

Lời giải 3 sao (11 khối): **lặp lại 2 lần** { đi tới mãi; chờ đến khi < thấy đỏ > hoặc < thấy xanh lá >; đi tới 13 cm; **nếu** thấy đỏ **thì** quay trái 90 **không thì** quay phải 90; đi tới 15 cm }; đi tới mãi; chờ đến khi thấy vàng; dừng lại.

Hai chỗ học sinh hay vấp, nên để các em tự phát hiện:

1. **Rẽ ngay khi thấy màu** (quên "đi tới 13 cm"): robot rẽ lúc bánh xe còn cách tâm ô 13 cm, nên cả đoạn sau lệch 13 cm. Robot vẫn có thể tới ô vàng nhưng lệch khỏi giữa ô, mất sao 2. Đây là chỗ giảng "cảm biến nằm trước bánh xe".
2. **Quên "đi tới 15 cm" sau khi rẽ:** cảm biến vẫn đang đứng trên ô màu, nên "chờ đến khi thấy đỏ hoặc xanh" đúng ngay lập tức và robot rẽ thêm lần nữa tại chỗ.

> Nói với học sinh: robot giống người đi đường nhìn biển báo. Mắt (cảm biến) thấy màu, não (khối "nếu") chọn rẽ trái hay phải.

### Bài 4. Dò đường bằng 1 cảm biến

Đường đen rộng 2 cm, dài khoảng 280 cm, các khúc cua bán kính 30–40 cm, cuối đường là ô xanh lá. Robot xuất phát với cảm biến ở **mép trái** của vạch. Khi bám mép trái: thấy tối (lấn vào vạch) thì lái **trái** ra phía trắng, thấy sáng thì lái **phải** vào phía vạch.

Lời giải: **lặp cho đến khi** < cảm biến giữa thấy màu xanh lá > { **nếu** độ sáng < 50 **thì** chạy bánh trái 10 % bánh phải 40 % **không thì** chạy bánh trái 40 % bánh phải 10 % }; dừng lại.

Sao 2 và 3 tính theo thời gian, để học sinh thử nghiệm tốc độ: tăng tốc thì nhanh hơn nhưng dễ văng khỏi đường. Kết quả đo trong giả lập (máy 60 khung hình/giây):

| Tốc độ bánh (nhanh/chậm, %) | Thời gian | Sao |
|---|---|---|
| 25 / 5 | 32,5 giây | 2 |
| 40 / 10 (lời giải gợi ý) | 20,0 giây | 2 |
| 60 / 0 (bánh chậm đứng yên) | 18,3 giây | 2 |
| 60 / 15 | 14,4 giây | 3 |
| 80 / 20 | 12–14 giây khi qua được, nhưng có lượt văng khỏi đường ở khúc cua | 3 hoặc 0 |

Sao 2: tới đích trong 40 giây; sao 3: trong 16 giây. Câu hỏi thảo luận: vì sao 60/0 chậm hơn 60/15 dù bánh nhanh như nhau? (Bánh chậm đứng yên thì mỗi lần sửa robot ngoặt mạnh, đi zíc zắc nhiều hơn nên quãng đường thực dài hơn.)

Lỗi hay gặp: lái ngược chiều (thấy tối lại lái vào trong vạch): robot vượt qua vạch sang mép bên kia rồi quay vòng tròn. Gợi ý cho học sinh tự kiểm tra: đứng sau robot, tay trái giả làm bánh trái, nghĩ xem bánh nào phải quay nhanh hơn.

> Nói với học sinh: đi trên bờ ruộng nhắm mắt, chân chạm nước thì bước sang phía khô, chạm đất khô thì bước sang phía nước. Mỗi bước sửa một chút nên vẫn đi hết bờ.

### Bài 5. Dò đường cua gắt bằng 3 cảm biến

Đường dài khoảng 330 cm, có 4 góc vuông và 2 khúc cua chữ U hẹp (bán kính 15 cm). Nên cho học sinh **chạy lại chương trình bài 4** trước: robot mất vạch ở góc vuông đầu tiên. Thảo luận vì sao: một cảm biến chỉ biết "đen hay trắng", không biết vạch nằm bên nào; ở góc vuông vạch rẽ ngoặt mà robot đã đi quá.

Ba cảm biến cho biết **vạch đang ở bên nào**:

- cảm biến **trái** thấy đen → vạch lệch trái → quay trái;
- cảm biến **phải** thấy đen → vạch lệch phải → quay phải;
- còn lại (giữa thấy đen) → đi thẳng.

Lời giải: **lặp cho đến khi** < cảm biến giữa thấy xanh lá > { **nếu** độ sáng cảm biến trái < 50 **thì** chạy bánh trái −20 % phải 40 % **không thì** { **nếu** độ sáng cảm biến phải < 50 **thì** chạy bánh trái 40 % phải −20 % **không thì** chạy bánh trái 35 % phải 35 % } }; dừng lại.

Số âm cho bánh quay lùi: robot gần như quay tại chỗ, nên qua được góc vuông. Kết quả đo:

| Chương trình | Thời gian | Sao |
|---|---|---|
| Lời giải trên (35 %, quay −20/40) | khoảng 22–23 giây | 3 |
| Chậm (18 %, quay −10/20) | khoảng 40–41 giây | 2 |
| Quá nhanh (60 %, quay −30/60) | văng khỏi đường ở khúc cua hẹp | 0 |
| Chương trình 1 cảm biến của bài 4 (40/10 hoặc 25/5) | mất vạch ở góc vuông | 0 |

Sao 2: dùng cả 3 cảm biến; sao 3: tới đích trong 30 giây.

Vì sao các cảm biến cách nhau 3 cm: vạch rộng 2 cm, mỗi cảm biến nhìn vòng tròn 2,6 cm. Đặt cách nhau khoảng "bề rộng vạch + đường kính vùng nhìn" trở xuống thì lúc nào cũng có ít nhất một cảm biến thấy vạch, không có "vùng mù". Thử nghiệm của dự án: cách 6 cm robot chạy lệch hẳn một bên và mất vạch khi chạy nhanh, cách 10 cm mất vạch gần như mọi lượt.

> Nói với học sinh: nhắm một mắt rồi chạm hai đầu bút vào nhau thì khó hơn hẳn. Nhiều "mắt" giúp robot biết vạch đang chạy sang trái hay sang phải.

## Ghi chú kĩ thuật

- **Khối mới** (tệp `san-robot-ao/khoi-cam-bien-mau.js`): "độ sáng phản xạ cảm biến [giữa/trái/phải]", "cảm biến [giữa/trái/phải] thấy màu [..]?" (thay khối "cảm biến màu thấy …?" cũ trong bảng Cơ bản; khối cũ vẫn mở được). Bài 4–5 dùng thêm khối "chạy bánh trái … % bánh phải … %" của gói G5. Cảm biến giữa/trái/phải được đổi ra cổng theo vị trí gắn trên robot, nên cùng chương trình chạy được trên robot 1 hay 3 cảm biến; chọn cảm biến không có thì báo lỗi dễ hiểu khi chạy.
- **Đi mãi giữ hướng:** trong giả lập, bánh dễ trượt nên "đi tới mãi" có thể lệch hướng. Khối "đi tới mãi" (G6) tăng tốc dần có giữ hướng trong 0,3 giây đầu; khi chương trình có khối cảm biến màu mới, mỗi lần đọc cảm biến còn sửa hướng tiếp theo con quay, nên vòng "chờ đến khi …" đi thẳng suốt quãng đường như xe thật.
- **Số đo và biểu đồ** (tệp `core/cam-bien-mau.js`): đăng kí dòng vào bảng số đo chung `core/so-do.js`. Bật trong tệp bài bằng `"soDo": ["doSangGiua", "mauGiua"]` (các mã: `doSangGiua/Trai/Phai`, `mauGiua/Trai/Phai`); biểu đồ hiện khi có dòng `doSang…`; ngưỡng vẽ trên biểu đồ lấy từ trường `"nguong"` (mặc định 50).
- **Luật chấm mới** `dungCamBien` (`toiThieu`: số cảm biến màu khác nhau chương trình phải dùng).
- **Sân** sinh bằng `python3 scripts/san/tao-san-cam-bien.py`, **tệp bài** sinh bằng `python3 scripts/san/tao-bai-cam-bien.py`. Muốn đổi vị trí vạch hay đường thì sửa hai tệp này rồi chạy lại, đừng sửa tay ảnh hay JSON. Màu trang trí trên đường robot đi phải có kênh đỏ cao (≥ 190), nếu không cảm biến "độ sáng phản xạ" sẽ tưởng là vạch đen.
- **Kiểm tra tự động:** `node scripts/thu-thach/kiem-tra-bai.js 03-cam-bien-mau/01-dung-o-vach …` (cần máy chủ ở cổng 1337 và Playwright). Bài có `bienThe` được chạy trên mọi phiên bản sân.
