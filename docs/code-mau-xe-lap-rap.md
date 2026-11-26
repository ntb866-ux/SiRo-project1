# Kho code mẫu cho xe lắp mô-đun

Tệp này sinh tự động bằng `node scripts/code-mau/tao-tai-lieu.js` từ các tệp `public/san-robot-ao/code-mau/<mã-bài>.json`. Sửa tệp JSON rồi chạy lại lệnh, đừng sửa tay tệp này.

## Dùng trong lớp

Mọi bài chạy bằng xe lắp mô-đun (kiểu mBot); robot cũ của GEARS đã bỏ. Mỗi bài lắp xe theo cách lắp ghi bên dưới. Dưới đề bài có mục **Xe của bài** giải thích vì sao lắp như vậy.

- Nút **Mở code mẫu** nạp chương trình mẫu vào vùng khối (thay chương trình đang có).
- Muốn đổi chỗ cảm biến: menu **Robot → Lắp ráp xe (kéo thả cảm biến)**. Nút **Lắp lại xe của bài** trả xe về đúng cách lắp của bài.

Gửi thẳng cho học sinh bài kèm chương trình mẫu: thêm `&xe=mau` vào địa chỉ bài, ví dụ `index.html?baiTap=03-cam-bien-mau/01-dung-o-vach&xe=mau`.

## Kiểm tra

```bash
cd public && python3 -m http.server 1337 &
node scripts/code-mau/kiem-tra-code-mau.js            # mọi bài
node scripts/code-mau/kiem-tra-code-mau.js cam-bien-mau   # một nhóm bài
```

Mỗi tệp ghi số sao mong đợi (`sao`); lệnh chạy code mẫu trên mọi phiên bản sân và báo sai nếu số sao khác.

## Định dạng tệp

| Trường | Nghĩa |
|---|---|
| `tenXe` | Tên ngắn của cách lắp xe |
| `giaiThichXe` | Vì sao gắn cảm biến ở những chỗ đó |
| `xe` | Cấu hình lắp ráp, cùng định dạng trường `sraXe` (xem `public/san-robot-ao/xe/README.md`) |
| `robotThem` | (tuỳ chọn) Trường thêm vào tệp robot, ví dụ `sraMotorYeu` |
| `chuongTrinh` | Chương trình viết gọn, xem chú thích đầu `public/san-robot-ao/core/code-mau.js` |
| `giaiThichCode` | Chương trình làm gì |
| `sao` | Số sao code mẫu đạt được trên mọi phiên bản sân (mảng nếu số sao thay đổi giữa các lượt) |
| `ghiChu` | (tuỳ chọn) Giới hạn của xe trong bài này |

## Chặng 1 · Di chuyển

### Tiến tới ô đích

`01-di-chuyen/01-tien-toi-o-dich` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 1 khối

**Xe: Xe gọn chỉ có con quay.** con quay trên nắp.

Chỉ giữ con quay (gyro) trên nắp mạch chủ, tháo hết cảm biến khác cho xe nhẹ. Khối "đi … cm" và "quay … độ" dùng con quay để tự sửa hướng, nên xe đi thẳng và quay đúng góc.

```
khi bắt đầu
    đi tới 100 cm
```

Ô đích cách 100 cm phía trước: một khối "đi tới 100 cm".

### Rẽ tới ô đích

`01-di-chuyen/02-re-toi-o-dich` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 3 khối

**Xe: Xe gọn chỉ có con quay.** con quay trên nắp.

Chỉ giữ con quay (gyro) trên nắp mạch chủ, tháo hết cảm biến khác cho xe nhẹ. Khối "đi … cm" và "quay … độ" dùng con quay để tự sửa hướng, nên xe đi thẳng và quay đúng góc.

```
khi bắt đầu
    đi tới 100 cm
    quay phải 90 độ
    đi tới 100 cm
```

Đi lên 100 cm, quay phải 90°, đi tiếp 100 cm. Đi lên trước để tránh hồ nước.

### Đỗ xe vào bãi

`01-di-chuyen/03-do-xe-vao-bai` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 3 khối

**Xe: Xe gọn chỉ có con quay.** con quay trên nắp.

Chỉ giữ con quay (gyro) trên nắp mạch chủ, tháo hết cảm biến khác cho xe nhẹ. Khối "đi … cm" và "quay … độ" dùng con quay để tự sửa hướng, nên xe đi thẳng và quay đúng góc.

```
khi bắt đầu
    đi tới 75 cm
    quay trái 90 độ
    đi lùi 85 cm
```

Đi tới ngang cửa bãi, quay trái để đầu xe hướng ra cửa, rồi lùi vào bãi.

### Đi qua 3 điểm theo thứ tự

`01-di-chuyen/04-qua-ba-diem` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 4 khối

**Xe: Xe gọn chỉ có con quay.** con quay trên nắp.

Chỉ giữ con quay (gyro) trên nắp mạch chủ, tháo hết cảm biến khác cho xe nhẹ. Khối "đi … cm" và "quay … độ" dùng con quay để tự sửa hướng, nên xe đi thẳng và quay đúng góc.

```
khi bắt đầu
    đi tới 75 cm
    quay phải 90 độ
    đi tới 75 cm
    đi lùi 125 cm
```

Tiến tới điểm 1, rẽ phải tới điểm 2, rồi lùi thẳng về điểm 3 thay vì quay đầu.

### Vẽ hình vuông

`01-di-chuyen/05-ve-hinh-vuong` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 4 khối

**Xe: Xe vẽ: bút ở tâm quay và con quay.** con quay trên nắp.

Bút vẽ cắm qua lỗ giữa tấm đáy, ngay dưới điểm giữa trục hai bánh. Đó là tâm quay của xe: khi xe quay tại chỗ, ngòi bút đứng yên nên các góc của hình vẽ nhọn, không bị vẽ thành cung tròn. Con quay (gyro) trên nắp mạch chủ giúp khối "đi … cm" và "quay … độ" đi thẳng, quay đúng góc. Tháo hết cảm biến khác cho xe nhẹ.

```
khi bắt đầu
    but
    lặp lại 4 lần
        đi tới 75 cm
        quay phải 90 độ
```

Hạ bút rồi lặp 4 lần: đi 75 cm, quay phải 90°. Xe vẽ đúng hình vuông và về ô xuất phát.

## Chặng 2 · Vòng lặp và biến

### Hình vuông bằng vòng lặp

`02-vong-lap/01-hinh-vuong-vong-lap` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 3 khối

**Xe: Xe gọn chỉ có con quay.** con quay trên nắp.

Chỉ giữ con quay (gyro) trên nắp mạch chủ, tháo hết cảm biến khác cho xe nhẹ. Khối "đi … cm" và "quay … độ" dùng con quay để tự sửa hướng, nên xe đi thẳng và quay đúng góc.

```
khi bắt đầu
    lặp lại 4 lần
        đi tới 100 cm
        quay phải 90 độ
```

Vòng lặp 4 lần, mỗi lần đi 100 cm rồi quay phải 90°: 3 khối thay cho 8 khối.

## Chặng 2 · Hiệu chỉnh động cơ

### Một vòng bánh đi bao xa?

`03-hieu-chinh/01-chu-vi-banh` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 1 khối

**Xe: Xe trần (không cảm biến).** không gắn cảm biến.

Bài hiệu chỉnh động cơ chỉ cần hai motor và bộ đếm vòng (encoder) trong motor, nên tháo hết cảm biến. Không có con quay thì xe đi đúng như bánh quay, sai ở đâu thấy ngay ở đó.

```
khi bắt đầu
    quay bánh trái 4,5 bánh phải 4,5 vòng
```

Bánh xe đường kính 6,37 cm nên chu vi 20 cm. 90 cm ÷ 20 cm = 4,5 vòng.

### Quay đúng một góc vuông

`03-hieu-chinh/02-quay-goc-vuong` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 2 khối

**Xe: Xe trần (không cảm biến).** không gắn cảm biến.

Bài hiệu chỉnh động cơ chỉ cần hai motor và bộ đếm vòng (encoder) trong motor, nên tháo hết cảm biến. Không có con quay thì xe đi đúng như bánh quay, sai ở đâu thấy ngay ở đó.

```
khi bắt đầu
    quay bánh trái 161 bánh phải -161 độ
    quay bánh trái 3 bánh phải 3 vòng
```

Quay tại chỗ: mỗi bánh lăn trên vòng tròn đường kính bằng khoảng cách hai bánh (11,4 cm). Thân quay 90° thì mỗi bánh lăn 90 × 11,4 ÷ 6,37 ≈ 161° quanh trục của nó. Sau đó đi 3 vòng = 60 cm.

### Bánh to, bánh nhỏ

`03-hieu-chinh/03-banh-to-banh-nho` · sân `luoi-toa-do` · code mẫu đạt **2 sao** · 1 khối

**Xe: Xe trần (không cảm biến).** không gắn cảm biến.

Bài hiệu chỉnh động cơ chỉ cần hai motor và bộ đếm vòng (encoder) trong motor, nên tháo hết cảm biến. Không có con quay thì xe đi đúng như bánh quay, sai ở đâu thấy ngay ở đó.

```
khi bắt đầu
    quay bánh trái 3 bánh phải 3 vòng
```

Chu vi 20 cm, 60 cm ÷ 20 cm = 3 vòng.

> Bài này so robot bánh to với robot bánh nhỏ; xe lắp mô-đun chỉ có một cỡ bánh nên không lấy được sao 2.

### Xe bị lệch: bù cho motor yếu

`03-hieu-chinh/04-bu-motor-lech` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 3 khối

**Xe: Xe trần, motor phải yếu 8 %.** không gắn cảm biến.

Bài hiệu chỉnh động cơ chỉ cần hai motor và bộ đếm vòng (encoder) trong motor, nên tháo hết cảm biến. Không có con quay thì xe đi đúng như bánh quay, sai ở đâu thấy ngay ở đó. Motor bên phải được cho yếu đi 8 % giống robot của bài.

```
khi bắt đầu
    chạy bánh trái 50 % bánh phải 54,3 %
    chờ 3,5 giây
    dừng lại
```

Motor phải yếu 8 % nên cho bánh phải nhiều điện hơn: 50 ÷ 0,92 ≈ 54,3 %. Hai bánh quay đều thì xe đi thẳng.

### Đi 1 mét trong đúng 4 giây

`03-hieu-chinh/05-mot-met-bon-giay` · sân `luoi-toa-do` · code mẫu đạt **1 đến 3 sao** · 3 khối

**Xe: Xe trần (không cảm biến).** không gắn cảm biến.

Bài hiệu chỉnh động cơ chỉ cần hai motor và bộ đếm vòng (encoder) trong motor, nên tháo hết cảm biến. Không có con quay thì xe đi đúng như bánh quay, sai ở đâu thấy ngay ở đó.

```
khi bắt đầu
    chạy bánh trái 45,5 % bánh phải 45,5 %
    chờ 3,72 giây
    dừng lại
```

Cần 25 cm/s. Chạy thử đo tốc độ rồi chỉnh phần trăm và thời gian: bánh còn quay thêm chừng 0,3 giây sau lệnh dừng, nên chờ khoảng 3,7 giây thì tổng thời gian bánh chạy gần 4 giây, và tăng tốc độ lên khoảng 45,5 % cho đủ 100 cm.

> Sao 2 và sao 3 đòi thời gian chạy đúng tới 0,05 giây, mà lệnh "chờ" đếm theo đồng hồ máy tính: máy chậm hay bận thì mỗi lượt lệch vài phần trăm giây. Code mẫu luôn hoàn thành nhiệm vụ, còn số sao thay đổi giữa các lượt (đo được từ 1 đến 3 sao). Đây cũng là một bài học: hẹn giờ không chính xác bằng đếm vòng bánh.

## Chặng 2 · Bút vẽ và đa giác

### Vẽ tam giác đều

`07-but-ve/01-tam-giac-deu` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 4 khối

**Xe: Xe vẽ: bút ở tâm quay và con quay.** con quay trên nắp.

Bút vẽ cắm qua lỗ giữa tấm đáy, ngay dưới điểm giữa trục hai bánh. Đó là tâm quay của xe: khi xe quay tại chỗ, ngòi bút đứng yên nên các góc của hình vẽ nhọn, không bị vẽ thành cung tròn. Con quay (gyro) trên nắp mạch chủ giúp khối "đi … cm" và "quay … độ" đi thẳng, quay đúng góc. Tháo hết cảm biến khác cho xe nhẹ.

```
khi bắt đầu
    but
    lặp lại 3 lần
        đi tới 100 cm
        quay phải 120 độ
```

Hạ bút rồi lặp 3 lần: đi 100 cm, quay phải 120°. Xe phải quay góc ngoài 120° (180° − 60°), không phải góc trong 60° của tam giác đều.

### Vẽ lục giác đều (tổ ong)

`07-but-ve/02-luc-giac-deu` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 4 khối

**Xe: Xe vẽ: bút ở tâm quay và con quay.** con quay trên nắp.

Bút vẽ cắm qua lỗ giữa tấm đáy, ngay dưới điểm giữa trục hai bánh. Đó là tâm quay của xe: khi xe quay tại chỗ, ngòi bút đứng yên nên các góc của hình vẽ nhọn, không bị vẽ thành cung tròn. Con quay (gyro) trên nắp mạch chủ giúp khối "đi … cm" và "quay … độ" đi thẳng, quay đúng góc. Tháo hết cảm biến khác cho xe nhẹ.

```
khi bắt đầu
    but
    lặp lại 6 lần
        đi tới 50 cm
        quay phải 60 độ
```

Hạ bút rồi lặp 6 lần: đi 50 cm, quay phải 60°. Tổng các góc quay là 6 × 60° = 360°: xe quay đúng một vòng là khép hình.

### Vẽ ngôi sao năm cánh

`07-but-ve/03-ngoi-sao-5-canh` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 4 khối

**Xe: Xe vẽ: bút ở tâm quay và con quay.** con quay trên nắp.

Bút vẽ cắm qua lỗ giữa tấm đáy, ngay dưới điểm giữa trục hai bánh. Đó là tâm quay của xe: khi xe quay tại chỗ, ngòi bút đứng yên nên các góc của hình vẽ nhọn, không bị vẽ thành cung tròn. Con quay (gyro) trên nắp mạch chủ giúp khối "đi … cm" và "quay … độ" đi thẳng, quay đúng góc. Tháo hết cảm biến khác cho xe nhẹ.

```
khi bắt đầu
    but
    lặp lại 5 lần
        đi tới 100 cm
        quay phải 144 độ
```

Hạ bút rồi lặp 5 lần: đi 100 cm, quay phải 144°. Tổng góc quay 5 × 144° = 720°: xe quay hai vòng mới khép được ngôi sao.

### Vẽ ngôi nhà theo hình mẫu

`07-but-ve/04-ve-ngoi-nha-theo-mau` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 11 khối

**Xe: Xe vẽ: bút ở tâm quay và con quay.** con quay trên nắp.

Bút vẽ cắm qua lỗ giữa tấm đáy, ngay dưới điểm giữa trục hai bánh. Đó là tâm quay của xe: khi xe quay tại chỗ, ngòi bút đứng yên nên các góc của hình vẽ nhọn, không bị vẽ thành cung tròn. Con quay (gyro) trên nắp mạch chủ giúp khối "đi … cm" và "quay … độ" đi thẳng, quay đúng góc. Tháo hết cảm biến khác cho xe nhẹ.

```
khi bắt đầu
    but
    đi tới 75 cm
    quay phải 30 độ
    đi tới 75 cm
    quay phải 120 độ
    đi tới 75 cm
    quay phải 30 độ
    đi tới 75 cm
    quay phải 90 độ
    đi tới 75 cm
    quay phải 90 độ
```

Hạ bút, đi lên tường trái, quay 30° vẽ mái trái, quay 120° vẽ mái phải, quay 30° đi xuống tường phải, quay 90° vẽ nền, quay 90° về hướng xuất phát.

## Chặng 3 · Cảm biến chạm và khoảng cách

### Chạm tường thì dừng

`03-cam-bien-cham-khoang-cach/01-cham-tuong-thi-dung` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 5 khối

**Xe: Xe có tấm cản trước.** công tắc chạm dưới mũi (x = 0 cm); con quay trên nắp.

Công tắc chạm gắn giữa thanh dưới mũi, ngay sau tấm cản: tường ép tấm cản thì công tắc đóng. Thêm con quay để xe chạy thẳng tới tường.

```
khi bắt đầu
    đi tới mãi
    chờ đến khi đang chạm
    dừng lại
    bíp
```

Chạy mãi, chờ đến khi cảm biến chạm bị nhấn, dừng lại rồi kêu bíp.

> Vùng "sát tường" của bài đo theo tâm quay của robot của bài, mũi robot đó cách trục bánh khoảng 8 cm. Tấm cản của xe lắp mô-đun cách trục bánh 15,5 cm, nên khi chạy bằng xe này vùng chấm được dời lùi 7,5 cm: vẫn là "mũi xe chạm tường".

### Dừng cách tường 20 cm

`03-cam-bien-cham-khoang-cach/02-dung-cach-tuong-20cm` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 6 khối

**Xe: Xe siêu âm mũi.** siêu âm trên giá mũi; con quay trên nắp.

Một siêu âm HC-SR04 trên giá phía mũi, nhìn thẳng ra trước. Không cần công tắc chạm vì xe không được đụng tường.

```
khi bắt đầu
    đặt tốc độ 30 %
    đi tới mãi
    chờ đến khi (khoảng cách < 20,5)
    dừng lại
```

Đi chậm (30 %) để quãng trôi khi phanh ngắn, chờ khoảng cách nhỏ hơn 20,5 cm thì dừng.

### Đỗ xe giữa hai xe

`03-cam-bien-cham-khoang-cach/03-do-xe-giua-hai-xe` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 4 khối

**Xe: Xe siêu âm mũi.** siêu âm trên giá mũi; con quay trên nắp.

Một siêu âm trên giá phía mũi đo khe trống tới xe đỗ phía trước.

```
khi bắt đầu
    đi tới ((khoảng cách - 3) / 2) cm
```

Khe trước còn kc cm, đi một nửa khe (trừ phần hở phía sau) là xe nằm giữa hai xe.

> Robot của bài có đuôi dài (12 cm sau trục bánh), xe lắp mô-đun đuôi ngắn (4 cm) mà mũi dài. Khi chạy bằng xe này, chỗ xuất phát được dời để đuôi xe vẫn cách xe đỏ 3 cm, và vùng chấm được dời theo để "đỗ chính giữa" vẫn đúng nghĩa.

### Đi men theo tường

`03-cam-bien-cham-khoang-cach/04-men-theo-tuong` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 7 khối

**Xe: Xe siêu âm mũi.** siêu âm trên giá mũi; con quay trên nắp.

Một siêu âm trên giá phía mũi. Mỗi cạnh phòng, xe chạy tới khi gần tường phía trước rồi quay phải.

```
khi bắt đầu
    lặp lại 4 lần
        đi tới mãi
        chờ đến khi (khoảng cách < 20)
        dừng lại
        quay phải 90 độ
```

Lặp 4 lần: chạy, chờ khoảng cách nhỏ hơn 20 cm, dừng, quay phải 90°.

### Thoát mê cung nhỏ

`03-cam-bien-cham-khoang-cach/05-thoat-me-cung-nho` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 7 khối

**Xe: Xe siêu âm mũi.** siêu âm trên giá mũi; con quay trên nắp.

Một siêu âm trên giá phía mũi. Quay xe để "nhìn" sang phải, sang trái: một cảm biến dùng cho cả ba hướng.

```
khi bắt đầu
    lặp mãi
        quay phải 90 độ
        lặp đến khi (khoảng cách > 30)
            quay trái 90 độ
        đi tới 50 cm
```

Quy tắc bàn tay phải: mỗi ô, quay phải trước; còn tường trước mặt thì quay trái cho tới khi trống; đi 50 cm sang ô kế.

## Chặng 4 · Cảm biến màu

### Dừng ở vạch đen

`03-cam-bien-mau/01-dung-o-vach` · sân `mot-vach` · code mẫu đạt **3 sao** · 5 khối

**Xe: Xe một mắt dưới gầm.** mắt dò line dưới gầm (x = 0, z = 0 cm); con quay trên nắp.

Một mắt dò line TCRT5000 dưới gầm, nằm đúng giữa hai bánh. Mắt thấy vạch là tâm xe đang ở trên vạch, nên dừng ngay là đúng chỗ (mắt dưới mũi thì xe dừng sớm 12 cm).

```
khi bắt đầu
    đi tới mãi
    chờ đến khi (độ sáng giữa < 50)
    dừng lại
```

Chạy mãi, chờ đến khi độ sáng phản xạ nhỏ hơn 50 (vạch đen), dừng.

### Đếm vạch, dừng ở vạch số 4

`03-cam-bien-mau/02-dem-vach` · sân `nhieu-vach` · code mẫu đạt **3 sao** · 13 khối

**Xe: Xe một mắt dưới gầm.** mắt dò line dưới gầm (x = 0, z = 0 cm); con quay trên nắp.

Một mắt dò line dưới gầm, giữa hai bánh: đếm tới vạch 4 thì tâm xe đang trên vạch 4.

```
khi bắt đầu
    đặt số vạch = 0
    đi tới mãi
    lặp đến khi (số vạch = 4)
        chờ đến khi (độ sáng giữa > 50)
        chờ đến khi (độ sáng giữa < 50)
        thay đổi số vạch thêm 1
    dừng lại
```

Biến đếm số vạch. Mỗi vạch: chờ ra nền trắng rồi chờ gặp đen, cộng 1. Đủ 4 thì dừng.

### Phân loại màu: đỏ rẽ trái, xanh rẽ phải

`03-cam-bien-mau/03-phan-loai-mau` · sân `o-mau` · code mẫu đạt **3 sao** · 16 khối

**Xe: Xe một cảm biến màu dưới gầm.** mắt dò line dưới gầm (x = 0, z = 0 cm); con quay trên nắp.

Một cảm biến màu TCS34725 dưới gầm, giữa hai bánh, để khi đọc biển màu thì tâm xe đang ở giữa ô. Cảm biến có đèn LED trắng chiếu xuống sân và chip đo riêng ba kênh đỏ, lục, lam qua kính lọc màu, nên nhận ra được màu thật của ô (khác mắt dò line TCRT5000 chỉ đo ánh sáng hồng ngoại hắt lại). Con quay trên nắp giúp quay đúng 90°.

```
khi bắt đầu
    lặp lại 2 lần
        đi tới mãi
        chờ đến khi (mắt giữa thấy RED hoặc mắt giữa thấy GREEN)
        đi tới 7 cm
        nếu mắt giữa thấy RED thì
            quay trái 90 độ
        không thì
            quay phải 90 độ
        đi tới 15 cm
    đi tới mãi
    chờ đến khi mắt giữa thấy YELLOW
    đi tới 7 cm
```

Lặp 2 lần: chạy tới khi cảm biến thấy màu đỏ hoặc xanh lá (gặp ô màu), đi thêm 7 cm vào giữa ô (xe còn trôi thêm vài cm sau lệnh "đi mãi"); thấy đỏ thì quay trái, không thì (ô xanh) quay phải; đi 15 cm ra khỏi ô. Sau hai biển báo: chạy tới khi thấy vàng, đi thêm 7 cm vào giữa ô vàng.

### Dò đường bằng 1 cảm biến

`03-cam-bien-mau/04-do-line-1-cam-bien` · sân `duong-cong` · code mẫu đạt **3 sao** · 11 khối

**Xe: Xe một mắt dưới mũi và con quay.** mắt dò line dưới mũi (x = 0 cm); con quay trên nắp.

Một mắt dò line giữa thanh dưới mũi: mắt nằm trước trục bánh 12 cm nên xe "nhìn trước" đường và rẽ kịp. TCRT5000 không nhận ra màu xanh của ô đích, nên dùng thêm con quay: đường này chỉ có khúc cua cuối cùng làm xe quay về hướng trái (góc âm).

```
khi bắt đầu
    đặt lại góc quay
    lặp đến khi (góc quay < -80)
        nếu (độ sáng giữa < 50) thì
            chạy bánh trái 30 % bánh phải 60 %
        không thì
            chạy bánh trái 60 % bánh phải 30 %
    đi tới 30 cm
    dừng lại
```

Bám mép trái của đường: mắt thấy đen thì bánh phải nhanh hơn (lái sang trái), thấy trắng thì bánh trái nhanh hơn (lái sang phải). Lặp đến khi con quay báo xe đã quay trái quá 80° (khúc cua cuối), rồi đi thẳng 30 cm vào ô đích. Chênh lệch 30/60 % đủ để bám các khúc cua mà vẫn nhanh: lái gắt hơn (15/60) thì mắt đặt xa trục bánh văng khỏi đường.

### Dò đường cua gắt bằng 3 cảm biến

`03-cam-bien-mau/05-do-line-3-cam-bien` · sân `cua-gat` · code mẫu đạt **3 sao** · 23 khối

**Xe: Xe ba mắt dưới gầm.** mắt dò line dưới gầm (x = -3, z = 4 cm); mắt dò line dưới gầm (x = 0, z = 4 cm); mắt dò line dưới gầm (x = 3, z = 4 cm); con quay trên nắp.

Ba mắt dò line dưới gầm, cách nhau 3 cm, đặt trước trục bánh chỉ 4 cm (không đặt dưới mũi). Ở góc vuông xe phải quay tại chỗ; mắt càng xa trục bánh thì khi quay càng quét ngang nhanh, lướt qua đường rộng 2 cm mà chương trình không kịp đọc. Đặt gần trục, mắt quét chậm và bắt được đường.

```
khi bắt đầu
    lặp đến khi (độ sáng trái < 75) và (độ sáng phải < 75) và (độ sáng giữa > 30)
        nếu (độ sáng trái < 50) thì
            chạy bánh trái -15 % bánh phải 30 %
        không thì
            nếu (độ sáng phải < 50) thì
                chạy bánh trái 30 % bánh phải -15 %
            không thì
                nếu (độ sáng giữa < 50) thì
                    chạy bánh trái 30 % bánh phải 30 %
    đi tới 21 cm
    dừng lại
```

Mắt trái thấy đen thì quay trái tại chỗ, mắt phải thấy đen thì quay phải, chỉ mắt giữa thấy đen thì đi thẳng. Cả ba mắt đều thấy trắng thì giữ nguyên lệnh trước (đang quay thì quay tiếp cho tới khi bắt lại đường), nên khối "nếu" cuối không có nhánh "không thì". Ô đích xanh lá hắt hồng ngoại khoảng 57 (nền trắng 90, đường đen 11): khi hai mắt ngoài cùng dưới 75 mà mắt giữa trên 30 thì xe đã vào ô đích (ở góc vuông luôn có một mắt ngoài còn thấy trắng), đi thêm 21 cm cho tâm xe vào giữa ô.

### Ngã ba chữ T: rẽ phải

`03-cam-bien-mau/06-nga-ba-chu-t` · sân `nga-ba` · code mẫu đạt **3 sao** · 39 khối

**Xe: Xe ba mắt dưới gầm.** mắt dò line dưới gầm (x = -3, z = 4 cm); mắt dò line dưới gầm (x = 0, z = 4 cm); mắt dò line dưới gầm (x = 3, z = 4 cm); con quay trên nắp.

Ba mắt dò line dưới gầm, cách nhau 3 cm, đặt trước trục bánh 4 cm (giống xe ở bài dò đường cua gắt). Ngã rẽ có thanh ngang đối xứng nên khi thanh ngang chạy qua gầm xe thì mắt trái và mắt phải cùng thấy đen: đó là dấu hiệu "đang ở ngã rẽ". Thấy dấu hiệu xong xe đi thêm 4 cm để trục bánh vào giữa ngã rẽ rồi mới quay.

```
khi bắt đầu
    lặp đến khi (độ sáng trái < 65) và (độ sáng phải < 65)
        nếu (độ sáng trái < 65) thì
            chạy bánh trái -12 % bánh phải 25 %
        không thì
            nếu (độ sáng phải < 65) thì
                chạy bánh trái 25 % bánh phải -12 %
            không thì
                nếu (độ sáng giữa < 65) thì
                    chạy bánh trái 20 % bánh phải 20 %
    đi tới 4 cm
    quay phải 90 độ
    lặp đến khi (độ sáng trái < 65) và (độ sáng phải < 65)
        nếu (độ sáng trái < 65) thì
            chạy bánh trái -12 % bánh phải 25 %
        không thì
            nếu (độ sáng phải < 65) thì
                chạy bánh trái 25 % bánh phải -12 %
            không thì
                nếu (độ sáng giữa < 65) thì
                    chạy bánh trái 20 % bánh phải 20 %
    dừng lại
```

Hai vòng lặp bám vạch giống hệt nhau, mỗi vòng dừng khi hai mắt ngoài cùng thấy đen (gặp thanh ngang). Vòng đầu dừng ở ngã ba: xe đi 4 cm cho trục bánh tới giữa ngã ba rồi quay phải 90°. Vòng sau dừng ở vạch đích. Ngưỡng 65 thay vì 50 vì mắt nằm đúng mép vạch đọc khoảng 60: ngưỡng 50 để lọt những chỗ cả ba mắt cùng thấy "trắng" dù vạch còn nằm giữa hai mắt.

### Ngã tư: đếm ngã rẽ

`03-cam-bien-mau/07-nga-tu-dem-nga-re` · sân `nga-tu` · code mẫu đạt **3 sao** · 33 khối

**Xe: Xe ba mắt dưới gầm.** mắt dò line dưới gầm (x = -3, z = 4 cm); mắt dò line dưới gầm (x = 0, z = 4 cm); mắt dò line dưới gầm (x = 3, z = 4 cm); con quay trên nắp.

Ba mắt dò line dưới gầm, cách nhau 3 cm, đặt trước trục bánh 4 cm (giống xe ở bài dò đường cua gắt). Ngã rẽ có thanh ngang đối xứng nên khi thanh ngang chạy qua gầm xe thì mắt trái và mắt phải cùng thấy đen: đó là dấu hiệu "đang ở ngã rẽ". Thấy dấu hiệu xong xe đi thêm 4 cm để trục bánh vào giữa ngã rẽ rồi mới quay.

```
khi bắt đầu
    đặt đếm = 0
    lặp đến khi (đếm = 3)
        nếu (độ sáng trái < 65) và (độ sáng phải < 65) thì
            thay đổi đếm thêm 1
            nếu (đếm = 1) thì
                đi tới 6 cm
            không thì
                nếu (đếm = 2) thì
                    đi tới 4 cm
                    quay phải 90 độ
        không thì
            nếu (độ sáng trái < 65) thì
                chạy bánh trái -12 % bánh phải 25 %
            không thì
                nếu (độ sáng phải < 65) thì
                    chạy bánh trái 25 % bánh phải -12 %
                không thì
                    nếu (độ sáng giữa < 65) thì
                        chạy bánh trái 20 % bánh phải 20 %
    dừng lại
```

Biến "đếm" ghi số thanh ngang đã gặp. Mỗi lần hai mắt ngoài cùng thấy đen: tăng đếm. Ngã tư 1 (đếm = 1) thì đi thẳng 6 cm cho gầm xe qua khỏi thanh ngang, ngã tư 2 (đếm = 2) thì đi 4 cm cho trục bánh vào giữa rồi quay phải 90°, vạch đích (đếm = 3) thì vòng lặp kết thúc và xe dừng. Ngoài thanh ngang thì bám vạch như bài 6.

### Lưới phố: lộ trình 5 ngã tư

`03-cam-bien-mau/08-luoi-pho-nhieu-nga-re` · sân `luoi-pho` · code mẫu đạt **3 sao** · 47 khối

**Xe: Xe ba mắt dưới gầm.** mắt dò line dưới gầm (x = -3, z = 4 cm); mắt dò line dưới gầm (x = 0, z = 4 cm); mắt dò line dưới gầm (x = 3, z = 4 cm); con quay trên nắp.

Ba mắt dò line dưới gầm, cách nhau 3 cm, đặt trước trục bánh 4 cm (giống xe ở bài dò đường cua gắt). Ngã rẽ có thanh ngang đối xứng nên khi thanh ngang chạy qua gầm xe thì mắt trái và mắt phải cùng thấy đen: đó là dấu hiệu "đang ở ngã rẽ". Thấy dấu hiệu xong xe đi thêm 4 cm để trục bánh vào giữa ngã rẽ rồi mới quay.

```
khi bắt đầu
    đặt đếm = 0
    lặp đến khi (đếm = 6)
        nếu (độ sáng trái < 65) và (độ sáng phải < 65) thì
            thay đổi đếm thêm 1
            nếu (đếm = 1) thì
                đi tới 6 cm
            không thì
                nếu (đếm = 2) thì
                    đi tới 4 cm
                    quay phải 90 độ
                không thì
                    nếu (đếm = 3) thì
                        đi tới 6 cm
                    không thì
                        nếu (đếm = 4) thì
                            đi tới 4 cm
                            quay trái 90 độ
                        không thì
                            nếu (đếm = 5) thì
                                đi tới 4 cm
                                quay phải 90 độ
        không thì
            nếu (độ sáng trái < 65) thì
                chạy bánh trái -12 % bánh phải 25 %
            không thì
                nếu (độ sáng phải < 65) thì
                    chạy bánh trái 25 % bánh phải -12 %
                không thì
                    nếu (độ sáng giữa < 65) thì
                        chạy bánh trái 20 % bánh phải 20 %
    dừng lại
```

Biến "đếm" cho biết đang ở thanh ngang thứ mấy; chuỗi "nếu đếm = …" là bảng lộ trình: 1 thẳng, 2 phải, 3 thẳng, 4 trái, 5 phải. Thanh ngang thứ 6 là vạch đích: vòng lặp kết thúc, xe dừng. Đi thẳng = đi 6 cm (qua khỏi thanh ngang), rẽ = đi 4 cm cho trục bánh vào giữa ngã tư rồi quay 90°.

## Chặng 5 · Con quay (gyro)

### Quay đúng 90° trên sân băng

`06-gyro/01-quay-90-do-tren-san-bang` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 12 khối

**Xe: Xe gọn chỉ có con quay.** con quay trên nắp.

Chỉ giữ con quay (gyro) trên nắp mạch chủ, tháo hết cảm biến khác cho xe nhẹ. Khối "đi … cm" và "quay … độ" dùng con quay để tự sửa hướng, nên xe đi thẳng và quay đúng góc.

```
khi bắt đầu
    đặt lại góc quay
    đặt tốc độ 40 %
    quay phải mãi
    chờ đến khi (góc quay > 45)
    đặt tốc độ 10 %
    quay phải mãi
    chờ đến khi (góc quay > 88)
    dừng lại
```

Đặt góc về 0, quay nhanh tới 45°, rồi quay chậm tới 88° và dừng: quay chậm thì quán tính nhỏ, xe dừng gần đúng 90° trên sân trơn.

### Giữ hướng khi bị đẩy lệch

`06-gyro/02-giu-huong-khi-bi-day` · sân `luoi-toa-do` · code mẫu đạt **3 sao** · 12 khối

**Xe: Xe siêu âm mũi và con quay.** siêu âm trên giá mũi; con quay trên nắp.

Con quay để biết xe bị đẩy lệch bao nhiêu, siêu âm phía mũi để dừng trước tường đích.

```
khi bắt đầu
    đặt lại góc quay
    lặp đến khi (khoảng cách < 20)
        chạy bánh trái (40 - (2 * góc quay)) % bánh phải (40 + (2 * góc quay)) %
    dừng lại
```

Lái tỉ lệ: lặp đến khi tường còn dưới 20 cm, mỗi vòng cho bánh trái chạy 40 − 2 × góc %, bánh phải 40 + 2 × góc %. Xe lệch phải (góc dương) thì bánh phải nhanh hơn, xe lái về trái; lệch càng nhiều lái càng mạnh, về đúng hướng thì hai bánh bằng nhau.

