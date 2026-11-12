# Đề xuất cấu trúc thư mục cho Sân Robot Ảo

## Ý tưởng chính

VEXcode VR tổ chức theo ba tầng: **playground** (một sân cố định, ví dụ Grid Map, Wall Maze, Line Detector), **robot** (một robot chuẩn có sẵn cảm biến) và **activity** (một bài trên một playground, có mục tiêu, gợi ý, mức đạt). Một playground dùng lại cho nhiều activity.

GEARS gốc đã có sẵn cách gần giống: sân là tệp JSON trong `public/worlds/…`, robot là mẫu trong `js/robotTemplates.js` hoặc tệp JSON, và thử thách nằm trong `js/worlds/extra/challenges_basic.js` (một danh sách sân kèm luật kiểm tra hoàn thành bằng `if` theo tên tệp, có mã hoàn thành). Cách đó khó mở rộng vì luật nằm cứng trong mã JS.

Đề xuất của tôi: giữ nguyên mã GEARS, đặt mọi thứ mới trong một thư mục riêng, và mô tả thử thách bằng dữ liệu JSON thay vì viết `if` trong JS.

## Cây thư mục

```
public/
├── (toàn bộ mã GEARS gốc, sửa càng ít càng tốt)
└── san-robot-ao/
    ├── index.html                 Trang chủ tiếng Việt: chọn chặng → sân → thử thách
    ├── vi.js                      Bản dịch tiếng Việt bổ sung (G1)
    ├── core/
    │   ├── challenge-engine.js    Đọc tệp thử thách, kiểm tra mục tiêu, chấm sao (G3)
    │   ├── star-rules.js          Các luật chấm: tới đích, thời gian, số khối, va chạm
    │   └── records.js             Lưu kỉ lục trên máy (localStorage), xuất mã kết quả
    ├── robots/
    │   ├── co-ban.json            Robot chuẩn lớp 6: 2 motor, bút, chạm, khoảng cách, màu, gyro (G2)
    │   ├── do-line.json           Biến thể 2–3 cảm biến màu dưới gầm
    │   └── thi-dau.json           Robot cho sumo/bóng đá (G11)
    ├── san/                       Mỗi sân một thư mục: hình nền + JSON thế giới
    │   ├── luoi-toa-do/           ≈ Grid Map / Numbered Grid Map
    │   │   ├── world.json
    │   │   ├── nen.png
    │   │   └── thumb.jpg
    │   ├── me-cung-tuong/         ≈ Wall Maze
    │   ├── do-line/               ≈ Line Detector
    │   ├── ve-tranh/              ≈ Art Canvas / Shape Tracer
    │   ├── cham-va-tranh/         Sân cho cảm biến chạm và khoảng cách
    │   ├── nhat-dia/              ≈ Disk Mover / Disk Maze (dùng nam châm)
    │   ├── me-cung-so/            Mê cung sinh từ mã 001–100 (G9, sinh bằng JS, không cần 100 tệp)
    │   ├── sumo/                  (G12, dựa trên world_Sumo.js có sẵn)
    │   ├── bong-da/               (G13, dựa trên world_Football.js có sẵn)
    │   └── ban-bong/              (G14, dựa trên world_Paintball.js có sẵn)
    ├── thu-thach/
    │   ├── danh-sach.json         Mục lục: chặng, thứ tự bài, bài nào mở khóa bài nào
    │   ├── 01-di-chuyen/
    │   │   ├── 01-tien-toi-o-dich.json
    │   │   ├── 02-tien-lui-chinh-xac.json
    │   │   └── 03-quay-90-do.json
    │   ├── 02-hieu-chinh-motor/
    │   ├── 03-cam-bien-cham/
    │   ├── 04-cam-bien-khoang-cach/
    │   ├── 05-cam-bien-mau/
    │   ├── 06-gyro/
    │   ├── 07-but-ve/
    │   └── 08-me-cung-ki-luc/
    └── tai-lieu/                  (G15)
        ├── phieu-hoc-tap/         Một phiếu cho mỗi thử thách, cùng tên tệp
        └── huong-dan-gv/
```

Tên thư mục viết không dấu, gạch nối, để URL gọn và tránh lỗi mã hóa trên GitHub Pages.

## Một tệp thử thách trông thế nào

```json
{
  "id": "01-di-chuyen/03-quay-90-do",
  "tieuDe": "Quay 90 độ và về đích",
  "chang": 1,
  "san": "luoi-toa-do",
  "robot": "co-ban",
  "viTriBatDau": { "x": -40, "y": -40, "goc": 0 },
  "moTa": "Robot đi tới ô B3 rồi quay phải, dừng trong ô vàng.",
  "nguyenLi": "Hai bánh quay ngược chiều nhau thì robot quay tại chỗ quanh tâm trục bánh.",
  "mucTieu": [ { "loai": "dungTrongVung", "vung": [10, 30, 20, 40] } ],
  "sao": [
    { "so": 1, "dieuKien": "hoanThanh" },
    { "so": 2, "dieuKien": "thoiGianDuoi", "giay": 15 },
    { "so": 3, "dieuKien": "soKhoiToiDa", "khoi": 6 }
  ],
  "goiY": ["Thử khối 'quay phải 90 độ' trước.", "Đếm số ô robot cần đi."],
  "khoiChoPhep": ["di_chuyen", "quay", "doi"],
  "phieu": "tai-lieu/phieu-hoc-tap/01-03-quay-90-do.pdf"
}
```

Lợi ích: giáo viên thêm bài mới chỉ bằng một tệp JSON, không cần đụng mã; cùng một sân dùng cho nhiều bài như cách VEXcode VR làm; luật chấm sao gom về một chỗ (`core/star-rules.js`).

## Ánh xạ sang lộ trình 12 buổi

| Chặng | Thư mục thử thách | Sân dùng | Gói |
|---|---|---|---|
| Tuần tự | 01-di-chuyen | luoi-toa-do | G4 |
| Tuần tự | 02-hieu-chinh-motor | luoi-toa-do | G5 |
| Lặp, biến | 07-but-ve | ve-tranh | G8 |
| Cảm biến | 03, 04 | cham-va-tranh, me-cung-tuong | G6 |
| Cảm biến | 05-cam-bien-mau | do-line | G7 |
| Cảm biến | 06-gyro | luoi-toa-do | G8 |
| Kỉ lục | 08-me-cung-ki-luc | me-cung-so | G9 |

## Những điều tôi phát hiện khi đọc mã GEARS

- GEARS **đã có sẵn** sân Sumo, Football và Paintball (bắn bóng sơn). Như vậy G12–G14 nhẹ hơn nhiều so với kế hoạch, nhất là G14 bắn đạn.
- Đã có Maze và bộ "Basic Challenges" phát mã hoàn thành, có thể học theo cách chúng kiểm tra robot chạm vùng đích.
- Hình nền nhiều sân đang tải từ máy chủ ngoài `files.aposteriori.com.sg`. Sân mới của mình nên để hình ngay trong repo để không phụ thuộc máy chủ khác.
- Trang chạy nằm trong thư mục `public/`, nên GitHub Pages sẽ triển khai thư mục này qua GitHub Actions để địa chỉ gọn là `…github.io/<tên-repo>/`.
