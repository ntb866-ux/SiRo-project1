# Mắt dò line TCRT5000: mô hình phản xạ khuếch tán Lambert

Tài liệu cho giáo viên. Mã nằm ở `public/san-robot-ao/xe/cam-bien.js` (hàm `DoLine`), kiểm tra ở `scripts/xe/kiem-tra-lambert.js`.

## 1. Cảm biến thật hoạt động thế nào

TCRT5000 gồm hai linh kiện đặt cạnh nhau trong một vỏ nhựa đen:

- **Đèn phát**: một LED hồng ngoại 950 nm, chiếu xuống mặt sân.
- **Bộ thu**: một phototransistor. Dòng qua nó tỉ lệ với công suất ánh sáng hồng ngoại hắt về.

Trên xe của giả lập, đèn nằm phía mũi xe, bộ thu nằm phía sau, hai tâm cách nhau 3 mm.

Mặt sân (giấy, thảm in) là **mặt khuếch tán**: ánh sáng chiếu tới bị tán ra mọi hướng. Định luật Lambert (Johann Heinrich Lambert, sách *Photometria*, 1760) nói rằng một mặt khuếch tán lí tưởng có **độ chói như nhau theo mọi hướng nhìn**. Vì vậy, cường độ ánh sáng phát ra từ một mảnh mặt theo một hướng tỉ lệ với cos của góc giữa hướng đó và pháp tuyến.

## 2. Công thức trong giả lập

Bộ thu "nhìn" ra theo 31 tia (1 tia giữa và 3 vòng). Mỗi tia chạm mặt sân tại điểm P, có pháp tuyến N. Phần công suất bộ thu nhận được từ mảnh sân dA quanh P tính qua ba bước:

| Đại lượng | Công thức | Ý nghĩa |
|---|---|---|
| Độ rọi tại P | E = I(α) · cos θᵢ / r_E² | θᵢ là **góc tới** (giữa N và hướng PE); r_E là khoảng cách từ đèn tới P; α là góc lệch khỏi trục đèn |
| Độ chói của mặt | L = ρ · E / π | ρ là hệ số phản xạ hồng ngoại; mặt Lambert sáng như nhau từ mọi hướng |
| Công suất bộ thu nhận | dΦ = L · cos θᵣ · dA · S(β) · cos β / r_D² | θᵣ là **góc thu** (giữa N và hướng PD); β là góc lệch khỏi trục thu |

- I(α) là giản đồ phát của đèn, S(β) là độ nhạy của bộ thu theo góc. Cả hai có dạng chuông, còn một nửa khi lệch một "nửa góc": đèn 85° (chiếu rất rộng), bộ thu 20° (nhìn hẹp).
- Mỗi tia của bộ thu chiếm một góc khối dΩ và quét được mảnh sân dA = r_D² · dΩ / cos θᵣ. Khi mặt sân nghiêng so với tia, mảnh sân rộng ra đúng bằng phần cos θᵣ làm tối đi. Đây là lí do mặt Lambert trông sáng như nhau từ mọi góc nhìn.
- Còn cos θᵢ thì ở lại: đèn chiếu xiên thì mỗi cm² sân nhận ít ánh sáng hơn.
- ρ tính từ màu: ρ = 0,04 + 0,86 · max(R, G, B) / 255. Mực màu (lục lam, đỏ tươi, vàng) gần như trong suốt với hồng ngoại; chỉ thành phần đen (muội than) hấp thụ. Trắng có ρ = 0,90, đen có ρ = 0,04.
- Hệ số khuếch đại được chọn sao cho nền trắng ở 6 mm đọc 92% (như khi chỉnh biến trở trên mô-đun).

### Đường tín hiệu theo khoảng cách không nhập tay

Mô hình cũ dùng đường đáp ứng chép từ đồ thị của tài liệu kĩ thuật. Mô hình mới tự sinh ra đường đó từ hình học, với cùng ba tham số ở trên (khoảng cách đèn–thu 3 mm, nửa góc 85° và 20°):

| Khoảng cách tới sân | 1 mm | 2,5 mm | 5 mm | 7,5 mm | 10 mm | 15 mm | 20 mm |
|---|---|---|---|---|---|---|---|
| Mô hình Lambert | 0,57 | 1,00 | 0,61 | 0,33 | 0,20 | 0,10 | 0,05 |
| Tài liệu kĩ thuật TCRT5000 | 0,60 | 1,00 | 0,62 | 0,36 | 0,22 | 0,10 | 0,06 |

- **Quá gần thì yếu**: vùng đèn rọi và vùng bộ thu nhìn chưa chồng lên nhau.
- **Đỉnh ở 2,5 mm**.
- **Xa hơn 1 cm** thì giảm như 1/d², vì ánh sáng loãng theo bình phương khoảng cách.

## 3. Mắt ở vị trí mặc định: số đọc theo khoảng cách tới vạch đen

Điều kiện: mặt đo cách sân 6 mm, nhìn thẳng xuống, vạch đen rộng 2 cm trên nền trắng. ADC là số 0–1023; % là số khối "độ sáng phản xạ" hiển thị.

**Vạch chạy dọc xe** (khi dò line). Lệch trái hay lệch phải cho cùng một số.

| Mép vạch so với tâm mắt | ADC | % |
|---|---|---|
| Vào trong vạch từ 5 mm trở lên | 42 | 4 |
| Vào trong 2,5 mm | 87 | 9 |
| Vào trong 1 mm | 302 | 30 |
| Mép ngay dưới tâm mắt | 610 | 60 |
| Ra ngoài 1 mm | 681 | 67 |
| Ra ngoài 2,5 mm | 896 | 88 |
| Ra ngoài từ 5 mm trở lên | 941 | 92 |

**Vạch cắt ngang xe** (khi đếm vạch, dừng ở vạch). Số đọc lệch hai phía vì đèn và bộ thu đặt trước sau.

| Mép vạch so với tâm mắt | Vạch ở phía mũi | Vạch ở phía đuôi |
|---|---|---|
| Vào trong 2,5 mm | 188 | 72 |
| Vào trong 1 mm | 441 | 189 |
| Mép ngay dưới tâm mắt | 715 | 268 |
| Ra ngoài 1 mm | 794 | 542 |
| Ra ngoài 2,5 mm | 911 | 795 |

Bộ thu nhìn hẹp còn đèn chiếu rộng, nên vùng nhạy nhất lùi về phía bộ thu khoảng 1 mm. Các bậc hơi lởm chởm vì giả lập chỉ dùng 31 tia. Trên sân thật của giả lập, xe lún nhẹ nên trắng thường đọc cao hơn vài phần trăm.

**So với mô hình cũ** (vạch dọc xe, ADC): mép vào trong 2,5 mm: cũ 118, Lambert 87; mép dưới tâm mắt: 531 / 610; ra ngoài 2,5 mm: 844 / 896; trắng 921 / 941. Với vạch ngang, mô hình cũ đối xứng hai phía (mép dưới tâm mắt đọc 610), còn mô hình Lambert đọc 715 khi vạch ở phía mũi và 268 khi vạch ở phía đuôi.

## 4. Nghiêng và nâng cao (số đo trên nền xám, ADC)

| Tình huống | Kết quả |
|---|---|
| Nâng mặt đo: 3 / 6 / 9 / 12 mm | 1023 (bão hoà) / 518 / 265 / 156 |
| Gắn chúc về phía đuôi (phía bộ thu): 0° / 10° / 20° / 30° | 518 / 451 / 367 / 278 |
| Gắn chúc về phía mũi (phía đèn): 0° / 10° / 20° / 30° | 518 / 555 / 555 / 510 |
| Mô hình cũ, nghiêng 0° / 10° / 20° / 30° (hai chiều như nhau) | 503 / 493 / 463 / 413 |
| Sân nghiêng sang ngang 0° / 10° / 20° / 30° | 518 / 512 / 493 / 463 (gần như cos góc) |

Chúc về phía đèn thì vùng bộ thu nhìn trượt vào chỗ đèn rọi mạnh nhất, bù lại phần ánh sáng tới xiên. Vì thế tín hiệu gần như giữ nguyên tới 20°. Chúc về phía ngược lại thì hai hiệu ứng cộng vào nhau làm tín hiệu yếu đi nhanh.

Đây là điều mô hình dự đoán. Nên thử lại với mô-đun thật: nghiêng mô-đun về hai phía trên cùng một tờ giấy xám rồi so số đọc.

## 5. Cấu hình

- **Bảng lắp ráp**, mục "Mắt dò line": hai hàng **Nghiêng** (−30° đến 30°, bước 5°; dương là chúc về phía mũi) và **Độ cao** (3–12 mm). Khi nghiêng, độ cao thấp nhất được nâng lên để mép mặt đo không chạm sân. Hai giá trị dùng chung cho mắt dưới mũi và mắt dưới gầm. Mắt trên tay quay servo theo hướng của tay quay.
- **Tệp robot**: các trường `sraXe.nghiengIR` (độ) và `sraXe.caoIR` (cm).
- **So với mô hình cũ**: đặt `sraCamBien: { doLine: { moHinh: 'cu' } }` trong tệp robot.
- Các tham số `khoangCachDenThu`, `nuaGocPhat`, `nuaGocThu` cũng đổi được trong `sraCamBien.doLine`.

## 6. Giải thích cho học sinh

- Cảm biến có một "đèn pin" hồng ngoại và một "con mắt" đứng cạnh nhau. Mắt chỉ thấy phần ánh sáng do đèn chiếu xuống rồi hắt ngược lên.
- Giấy trắng hắt lại nhiều, mực đen nuốt gần hết. Nhờ vậy số đọc trên vạch đen nhỏ, trên nền trắng lớn.
- Mắt nhìn một vòng tròn nhỏ trên sân, cỡ 5 mm. Khi vòng đó nằm một nửa trên vạch, số đọc ở khoảng giữa. Chương trình dò line bám theo con số ở giữa đó.
- Để cảm biến quá cao thì ánh sáng tỏa rộng ra, mắt nhận được ít. Ánh sáng yếu theo bình phương khoảng cách: xa gấp đôi còn một phần tư.
- Để quá sát (dưới 2 mm) thì chỗ đèn chiếu và chỗ mắt nhìn không trùng nhau, nên số đọc lại giảm.
- Nghiêng cảm biến thì ánh sáng chiếu xiên xuống sân. Giống như nắng buổi chiều chiếu xiên kém nóng hơn nắng trưa, mỗi phần sân nhận ít ánh sáng hơn.
