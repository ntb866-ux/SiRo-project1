# Sinh 5 tệp bài chặng 3 (cảm biến màu, dò đường) – gói G7.
# Chạy: python3 scripts/san/tao-bai-cam-bien.py
# Các tọa độ (vạch, ô màu, điểm kiểm tra) khớp với scripts/san/tao-san-cam-bien.py.
import json, os

GOC = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'san-robot-ao', 'thu-thach', '03-cam-bien-mau')
os.makedirs(GOC, exist_ok=True)
KHOI_CAM_BIEN = ['sra_do_sang', 'sra_mau_thay', 'sra_thay_mau']


def luu(ten, bai):
    with open(os.path.join(GOC, ten + '.json'), 'w', encoding='utf-8') as f:
        json.dump(bai, f, ensure_ascii=False, indent=2)
        f.write('\n')


def o(x, y, mau, co=20):
    return {'type': 'box', 'position': [x, y, 0.05], 'size': [co, co, 0.1], 'color': mau,
            'physicsOptions': False, 'castShadows': False, 'receiveShadows': False}


DO, XANH, VANG = '#E53935', '#2E9E44', '#FACC15'


# ---------------------------------------------------------------------------
# Bài 1. Dừng ở vạch đen
# ---------------------------------------------------------------------------
luu('01-dung-o-vach', {
    'tieuDe': 'Dừng ở vạch đen',
    'san': 'mot-vach',
    'robot': 'co-ban',
    'cheDo': 'co-ban',
    'viTriBatDau': {'x': 0, 'y': -60, 'goc': 0},
    'bienThe': [
        {'viTriBatDau': {'x': 0, 'y': -80, 'goc': 0}},
        {'viTriBatDau': {'x': 0, 'y': -60, 'goc': 0}},
        {'viTriBatDau': {'x': 0, 'y': -40, 'goc': 0}},
    ],
    'vung': {
        'vach': {'ten': 'vạch đen', 'x': 0, 'y': 27, 'rong': 60, 'dai': 8, 'an': True},
    },
    'soDo': ['doSangGiua', 'mauGiua'],
    'nguong': 50,
    'deBai': 'Phía trước robot có một **vạch đen** chạy ngang sân. Hãy cho robot **đi thẳng và dừng lại ngay trên vạch**.\n\n'
             'Mỗi lần bấm Chạy, robot xuất phát ở **một chỗ khác** (một trong ba dấu chữ V màu cam), nên không đo trước quãng đường được. '
             'Hãy dùng **cảm biến màu** dưới gầm robot: nó nhìn xuống sân và cho biết mặt sân sáng hay tối.\n\n'
             'Quan sát bảng số đo góc trên bên trái: độ sáng đổi thế nào khi robot đi từ nền trắng vào vạch đen?',
    'nguyenLi': 'Cảm biến màu có một đèn chiếu xuống sân và một tế bào quang điện đo **ánh sáng hắt ngược lại**. '
                'Mặt trắng **phản xạ** gần hết ánh sáng nên số đo cao (gần 100); mặt đen **hấp thụ** gần hết ánh sáng nên số đo thấp (gần 0). '
                'Chương trình chọn một **ngưỡng** ở giữa, ví dụ 50: số đo nhỏ hơn ngưỡng thì coi là "đang ở trên vạch đen".\n\n'
                'Nói với học sinh: giống như bạn soi đèn pin xuống sàn. Chỗ sàn trắng sáng lóa, chỗ thảm đen gần như không thấy ánh đèn hắt lại. Robot chỉ cần hỏi: "chỗ này sáng hay tối?"',
    'mucTieu': [
        {'loai': 'dungTrongVung', 'vung': 'vach', 'moTa': 'Robot dừng với cảm biến nằm trên vạch đen'},
        {'loai': 'dungKhoi', 'khoi': KHOI_CAM_BIEN, 'tenKhoi': 'cảm biến màu', 'moTa': 'Dùng cảm biến màu'},
    ],
    'sao': [
        {'moTa': 'Dừng trên vạch đen nhờ cảm biến màu'},
        {'moTa': 'So độ sáng phản xạ với ngưỡng (dùng khối "độ sáng phản xạ")',
         'dieuKien': [{'loai': 'dungKhoi', 'khoi': 'sra_do_sang', 'tenKhoi': '"độ sáng phản xạ"'}]},
        {'moTa': 'Gọn: tối đa 3 khối lệnh',
         'dieuKien': [{'loai': 'soKhoiToiDa', 'khoi': 3}]},
    ],
    'goiY': [
        'Robot không biết trước vạch ở xa bao nhiêu. Nó phải **vừa đi vừa nhìn** xuống sân. Khối nào cho robot đi mãi, không dừng sau một số cm?',
        {'noiDung': 'Ba bước: **đi tới mãi** → **chờ đến khi** cảm biến thấy tối → **dừng lại**. Khối "chờ đến khi" nằm ở nhóm Điều khiển.', 'moSauLanThu': 1},
        {'noiDung': 'Lời giải: **đi tới mãi**, **chờ đến khi** < **độ sáng phản xạ cảm biến giữa** nhỏ hơn **50** >, **dừng lại**. Phép so sánh "nhỏ hơn" ở nhóm Phép toán.', 'moSauLanThu': 2},
    ],
    'thoiGianToiDa': 30,
})

# ---------------------------------------------------------------------------
# Bài 2. Đếm vạch
# ---------------------------------------------------------------------------
VACH = [-45, -20, 0, 30, 50, 75]
luu('02-dem-vach', {
    'tieuDe': 'Đếm vạch, dừng ở vạch số 4',
    'san': 'nhieu-vach',
    'robot': 'co-ban',
    'cheDo': 'co-ban',
    'viTriBatDau': {'x': 0, 'y': -75, 'goc': 0},
    'bienThe': [
        {'viTriBatDau': {'x': 0, 'y': -85, 'goc': 0}},
        {'viTriBatDau': {'x': 0, 'y': -75, 'goc': 0}},
        {'viTriBatDau': {'x': 0, 'y': -65, 'goc': 0}},
    ],
    'vung': {
        'vach4': {'ten': 'vạch số 4', 'x': 0, 'y': 27, 'rong': 40, 'dai': 7, 'an': True},
        'quaVach5': {'ten': 'vạch số 5', 'x': 0, 'y': 48, 'rong': 40, 'dai': 4, 'an': True},
    },
    'soDo': ['doSangGiua', 'mauGiua'],
    'nguong': 50,
    'deBai': 'Robot chạy trên một làn đường có **6 vạch đen** cắt ngang. Hãy cho robot **dừng đúng ở vạch số 4**.\n\n'
             'Robot xuất phát ở một trong ba chỗ khác nhau, khoảng cách giữa các vạch cũng không đều, nên phải **đếm** số vạch đã đi qua bằng cảm biến màu.\n\n'
             'Gợi ý quan sát: trên biểu đồ độ sáng, mỗi lần robot đi qua một vạch thì đường đo **tụt xuống rồi lên lại**. Đếm số lần tụt xuống là biết đã qua mấy vạch.',
    'nguyenLi': 'Mỗi vạch đen làm số đo độ sáng **đổi trạng thái hai lần**: sáng → tối (bắt đầu vào vạch) rồi tối → sáng (ra khỏi vạch). '
                'Muốn đếm đúng, chương trình phải đếm **lúc chuyển** từ sáng sang tối, không đếm "đang tối": robot đi qua vạch dày 3 cm mất khoảng 0,1 giây, trong lúc đó vòng lặp đã kiểm tra cảm biến rất nhiều lần. '
                'Vì vậy sau khi thấy tối, robot phải **chờ sáng trở lại** rồi mới đếm vạch tiếp theo. Máy đếm trong đời sống (cổng đếm người, máy đếm sản phẩm trên băng chuyền) cũng đếm theo cách này.\n\n'
                'Nói với học sinh: giống đếm bậc thang khi đi lên, mỗi bậc chỉ đếm một lần lúc đặt chân lên, đứng trên bậc lâu bao nhiêu cũng không đếm thêm.',
    'mucTieu': [
        {'loai': 'dungTrongVung', 'vung': 'vach4', 'moTa': 'Robot dừng với cảm biến nằm trên vạch số 4'},
        {'loai': 'dungKhoi', 'khoi': KHOI_CAM_BIEN, 'tenKhoi': 'cảm biến màu', 'moTa': 'Dùng cảm biến màu'},
    ],
    'sao': [
        {'moTa': 'Dừng đúng ở vạch số 4'},
        {'moTa': 'Dùng vòng lặp để lặp lại việc đi qua một vạch',
         'dieuKien': [{'loai': 'dungKhoi', 'khoi': ['controls_repeat_ext', 'controls_repeat', 'controls_whileUntil', 'sra_lap_mai'], 'tenKhoi': 'vòng lặp'}]},
        {'moTa': 'Đếm bằng một biến (ví dụ biến "số vạch")',
         'dieuKien': [{'loai': 'dungKhoi', 'khoi': ['math_change', 'variables_set'], 'toiThieu': 2, 'tenKhoi': '"đặt biến" và "thay đổi biến"'}]},
    ],
    'goiY': [
        'Đi qua một vạch gồm hai việc: **chờ đến khi thấy đen**, rồi **chờ đến khi thấy trắng** (ra khỏi vạch). Vạch số 4 thì cần qua mấy vạch trước nó?',
        {'noiDung': 'Cách 1: **đi tới mãi**, **lặp lại 3 lần** { chờ đến khi thấy đen; chờ đến khi thấy trắng }, rồi **chờ đến khi thấy đen** lần nữa và **dừng lại**.', 'moSauLanThu': 1},
        {'noiDung': 'Cách 2 (3 sao): tạo biến **số vạch**, đặt bằng 0. **Đi tới mãi**, **lặp cho đến khi** số vạch = 4 { chờ đến khi độ sáng > 50; chờ đến khi độ sáng < 50; thay đổi số vạch thêm 1 }, rồi **dừng lại**. Thử bỏ khối "chờ đến khi độ sáng > 50" xem robot đếm sai thế nào.', 'moSauLanThu': 2},
    ],
    'thoiGianToiDa': 40,
})

# ---------------------------------------------------------------------------
# Bài 3. Phân loại ô màu: đỏ rẽ trái, xanh rẽ phải
# ---------------------------------------------------------------------------
A = (0, -30)
def bien_the(mauA, mauB):
    bx = -60 if mauA == 'do' else 60
    huong_a = 270 if mauA == 'do' else 90                       # đỏ: quay trái, xanh: quay phải
    huong_b = (huong_a + (-90 if mauB == 'do' else 90)) % 360
    dy = 60 if huong_b == 0 else -50                            # đi lên hay đi xuống tới ô vàng
    gx, gy = bx, A[1] + dy
    mau = {'do': DO, 'xanh': XANH}
    # vùng đích: ô vàng + đoạn 14 cm phía robot đi tới (cảm biến ở trước tâm quay 3 cm, robot phanh trễ)
    lui = -1 if huong_b == 0 else 1
    return {
        'vatThe': [o(A[0], A[1], mau[mauA]), o(bx, A[1], mau[mauB]), o(gx, gy, VANG)],
        'vung': {'dich': {'x': gx, 'y': gy + lui * 7, 'rong': 24, 'dai': 34},
                 'giuaDich': {'x': gx, 'y': gy + lui * 7, 'rong': 12, 'dai': 34}},
    }

luu('03-phan-loai-mau', {
    'tieuDe': 'Phân loại màu: đỏ rẽ trái, xanh rẽ phải',
    'san': 'o-mau',
    'robot': 'co-ban',
    'cheDo': 'co-ban',
    'viTriBatDau': {'x': 0, 'y': -80, 'goc': 0},
    'bienThe': [bien_the('do', 'do'), bien_the('do', 'xanh'), bien_the('xanh', 'do'), bien_the('xanh', 'xanh')],
    'vung': {
        'dich': {'ten': 'ô vàng (đích)', 'x': -60, 'y': -73, 'rong': 24, 'dai': 34, 'an': True},
        'giuaDich': {'ten': 'giữa ô vàng', 'x': -60, 'y': -73, 'rong': 12, 'dai': 34, 'an': True},
    },
    'soDo': ['mauGiua', 'doSangGiua'],
    'deBai': 'Robot là xe chở hàng trong kho. Trên đường có **biển báo màu**: gặp ô **đỏ** thì **rẽ trái**, gặp ô **xanh lá** thì **rẽ phải**. Rẽ ở **giữa ô**. Đi theo biển báo tới **ô vàng** thì dừng.\n\n'
             'Mỗi lần chạy, màu các ô thay đổi ngẫu nhiên nên đường đi cũng khác. Robot phải **nhìn màu rồi quyết định**.\n\n'
             'Ô màu thứ nhất cách chỗ xuất phát 40 cm; ô thứ hai cách ô thứ nhất 60 cm (tính từ tâm ô). Mỗi ô rộng 20 cm.',
    'nguyenLi': 'Cảm biến màu đo riêng lượng ánh sáng **đỏ, lục, lam** hắt lại từ mặt sân. Một bề mặt có màu vì nó **hấp thụ** một số màu của ánh sáng trắng và **phản xạ** màu còn lại: ô đỏ hắt lại chủ yếu ánh sáng đỏ, ô xanh lá hắt lại chủ yếu ánh sáng lục, ô vàng hắt lại cả đỏ lẫn lục. '
                'So tỉ lệ ba phần này, cảm biến đoán ra màu. Chương trình dùng khối **nếu … thì … không thì** để chọn hành động theo màu: đó là một **quyết định**.\n\n'
                'Cảm biến nằm **trước** điểm giữa hai bánh 3 cm. Lúc cảm biến vừa chạm mép ô thì bánh xe còn cách tâm ô khoảng 10 + 3 = 13 cm, nên phải đi thêm chừng đó rồi mới rẽ.\n\n'
                'Nói với học sinh: robot giống người đi đường nhìn biển báo. Mắt (cảm biến) thấy màu, não (chương trình) chọn rẽ trái hay phải.',
    'mucTieu': [
        {'loai': 'dungTrongVung', 'vung': 'dich', 'moTa': 'Robot đi theo biển báo và dừng ở ô vàng'},
        {'loai': 'dungKhoi', 'khoi': KHOI_CAM_BIEN, 'tenKhoi': 'cảm biến màu', 'moTa': 'Dùng cảm biến màu'},
    ],
    'sao': [
        {'moTa': 'Tới ô vàng theo đúng biển báo'},
        {'moTa': 'Rẽ đúng giữa ô nên dừng ngay chính giữa ô vàng (lệch tối đa 6 cm)',
         'dieuKien': [{'loai': 'dungTrongVung', 'vung': 'giuaDich'}]},
        {'moTa': 'Dùng vòng lặp cho hai lần gặp biển báo, tối đa 12 khối',
         'dieuKien': [{'loai': 'dungKhoi', 'khoi': ['controls_repeat_ext', 'controls_repeat', 'controls_whileUntil'], 'tenKhoi': 'vòng lặp'},
                      {'loai': 'soKhoiToiDa', 'khoi': 12}]},
    ],
    'goiY': [
        'Mỗi lần gặp biển báo, robot làm cùng một việc: đi tới khi thấy ô màu, đi vào giữa ô, nhìn màu rồi rẽ. Việc đó lặp lại mấy lần trước khi tới ô vàng?',
        {'noiDung': 'Khi robot đứng trên ô màu và **chờ đến khi thấy đỏ hoặc xanh**, điều kiện đúng ngay lập tức! Sau khi rẽ, hãy cho robot **đi tới khoảng 15 cm** để ra khỏi ô rồi mới chờ ô tiếp theo.', 'moSauLanThu': 1},
        {'noiDung': 'Lời giải: **lặp lại 2 lần** { đi tới mãi; chờ đến khi < thấy đỏ > hoặc < thấy xanh lá >; đi tới 13 cm; **nếu** thấy đỏ **thì** quay trái 90 **không thì** quay phải 90; đi tới 15 cm }, rồi đi tới mãi, chờ đến khi thấy vàng, dừng lại.', 'moSauLanThu': 2},
    ],
    'thoiGianToiDa': 60,
})

# ---------------------------------------------------------------------------
# Bài 4. Dò đường bằng 1 cảm biến
# ---------------------------------------------------------------------------
luu('04-do-line-1-cam-bien', {
    'tieuDe': 'Dò đường bằng 1 cảm biến',
    'san': 'duong-cong',
    'robot': 'co-ban',
    'cheDo': 'co-ban',
    'viTriBatDau': {'x': -71, 'y': -80, 'goc': 0},
    'vung': {
        'kt1': {'ten': 'điểm kiểm tra 1', 'x': -55.8, 'y': -14.4, 'rong': 20, 'dai': 20, 'an': True},
        'kt2': {'ten': 'điểm kiểm tra 2', 'x': 11.1, 'y': -3.4, 'rong': 20, 'dai': 20, 'an': True},
        'kt3': {'ten': 'điểm kiểm tra 3', 'x': 39.9, 'y': 52.8, 'rong': 20, 'dai': 20, 'an': True},
        'dich': {'ten': 'ô đích xanh lá', 'x': -22, 'y': 80, 'rong': 36, 'dai': 24, 'an': True},
    },
    'soDo': ['doSangGiua', 'mauGiua'],
    'nguong': 50,
    'deBai': 'Cho robot **đi theo đường đen** từ chỗ xuất phát tới **ô đích xanh lá** rồi dừng. Robot chỉ có **một cảm biến màu**.\n\n'
             'Mẹo của thợ làm robot: đừng cố cho cảm biến nằm giữa vạch, hãy cho nó **bám mép** vạch. Cảm biến thấy đen thì lái ra phía trắng, thấy trắng thì lái vào phía đen. Robot sẽ đi ngoằn ngoèo dọc theo mép vạch.\n\n'
             'Robot xuất phát với cảm biến nằm ở **mép trái** của vạch.',
    'nguyenLi': 'Đây là **điều khiển có phản hồi** (vòng kín): robot liên tục đo, so với ngưỡng, rồi sửa hướng. '
                'Ở mép vạch, vùng nhìn của cảm biến (đường kính khoảng 2,6 cm) nằm một nửa trên đen, một nửa trên trắng, nên số đo khoảng 50. '
                'Lệch vào trong vạch thì số đo giảm, lệch ra ngoài thì tăng: số đo cho biết robot **lệch về phía nào**. '
                'Cách "nếu tối thì lái phải, không thì lái trái" gọi là điều khiển **bật – tắt**; muốn đi êm và nhanh hơn thì lái mạnh hay nhẹ **tùy theo độ lệch** (điều khiển tỉ lệ).\n\n'
                'Nói với học sinh: giống đi trên bờ ruộng nhắm mắt, chân trái chạm nước thì bước sang phải, chạm cỏ khô thì bước sang trái. Mỗi bước sửa một chút nên vẫn đi hết bờ.',
    'mucTieu': [
        {'loai': 'quaCacVung', 'vung': ['kt1', 'kt2', 'kt3'], 'theoThuTu': True, 'moTa': 'Robot đi theo đường qua 3 điểm kiểm tra'},
        {'loai': 'dungTrongVung', 'vung': 'dich', 'moTa': 'Robot dừng ở ô đích xanh lá'},
    ],
    'sao': [
        {'moTa': 'Đi hết đường và dừng ở ô đích'},
        {'moTa': 'Tới đích trong tối đa 40 giây',
         'dieuKien': [{'loai': 'thoiGianDuoi', 'giay': 40}]},
        {'moTa': 'Chạy nhanh mà không văng khỏi đường: tới đích trong tối đa 16 giây',
         'dieuKien': [{'loai': 'thoiGianDuoi', 'giay': 16}]},
    ],
    'goiY': [
        'Chương trình phải lặp lại việc "nhìn rồi lái" cho tới khi gặp ô xanh lá. Khối nào lặp cho đến khi một điều kiện đúng?',
        {'noiDung': 'Dùng khối **chạy bánh trái … % bánh phải … %**: bánh trái nhanh hơn thì robot cong sang phải. Cảm biến bám mép trái của vạch, vậy thấy đen (đi lấn vào vạch) thì phải lái sang trái hay phải?', 'moSauLanThu': 1},
        {'noiDung': 'Lời giải: **lặp cho đến khi** < cảm biến giữa thấy màu xanh lá > { **nếu** độ sáng phản xạ < 50 **thì** chạy bánh trái 10 % bánh phải 40 % **không thì** chạy bánh trái 40 % bánh phải 10 % }, rồi **dừng lại**. Muốn nhanh hơn: tăng cả hai số, nhưng tăng quá thì robot văng khỏi đường ở khúc cua.', 'moSauLanThu': 2},
    ],
    'thoiGianToiDa': 90,
})

# ---------------------------------------------------------------------------
# Bài 5. Dò đường cua gắt bằng 3 cảm biến
# ---------------------------------------------------------------------------
luu('05-do-line-3-cam-bien', {
    'tieuDe': 'Dò đường cua gắt bằng 3 cảm biến',
    'san': 'cua-gat',
    'robot': 'do-line',
    'cheDo': 'co-ban',
    'viTriBatDau': {'x': -70, 'y': -80, 'goc': 0},
    'vung': {
        'kt1': {'ten': 'điểm kiểm tra 1', 'x': -53.5, 'y': -30.0, 'rong': 20, 'dai': 20, 'an': True},
        'kt2': {'ten': 'điểm kiểm tra 2', 'x': -23.1, 'y': 7.3, 'rong': 20, 'dai': 20, 'an': True},
        'kt3': {'ten': 'điểm kiểm tra 3', 'x': 11.4, 'y': -20.0, 'rong': 20, 'dai': 20, 'an': True},
        'kt4': {'ten': 'điểm kiểm tra 4', 'x': 46.9, 'y': 12.4, 'rong': 20, 'dai': 20, 'an': True},
        'dich': {'ten': 'ô đích xanh lá', 'x': 80, 'y': -18, 'rong': 24, 'dai': 34, 'an': True},
    },
    'soDo': ['doSangTrai', 'doSangGiua', 'doSangPhai'],
    'nguong': 50,
    'deBai': 'Đường này có **góc vuông** và **khúc cua hẹp**. Robot dò đường có **ba cảm biến màu** cạnh nhau: trái, giữa, phải (cách nhau 3 cm). Hãy cho robot đi hết đường tới **ô đích xanh lá** rồi dừng.\n\n'
             'Thử trước: chương trình một cảm biến của bài 4 có qua được góc vuông không? Sau đó dùng thêm cảm biến trái và phải.',
    'nguyenLi': 'Một cảm biến chỉ biết "đang trên đen hay trắng", không biết vạch nằm **bên nào**. Ở góc vuông, vạch rẽ ngoặt mà cảm biến đã đi quá: robot mất vạch. '
                'Ba cảm biến đặt cạnh nhau cho biết **vị trí** của vạch: giữa thấy đen thì đi thẳng, trái thấy đen thì vạch lệch sang trái nên quay trái, phải thấy đen thì quay phải. '
                'Khoảng cách 3 cm được chọn để không có "vùng mù": vạch rộng 2 cm, mỗi cảm biến nhìn một vòng tròn rộng khoảng 2,6 cm, nên lúc nào ít nhất một cảm biến cũng thấy vạch (thử nghiệm của dự án: cách 6 cm trở lên thì robot hay mất vạch ở khúc cua gắt).\n\n'
                'Nói với học sinh: một mắt nhắm lại thì khó biết đồ vật ở bên nào, hai ba "mắt" thì robot biết vạch đang chạy sang trái hay sang phải.',
    'mucTieu': [
        {'loai': 'quaCacVung', 'vung': ['kt1', 'kt2', 'kt3', 'kt4'], 'theoThuTu': True, 'moTa': 'Robot đi theo đường qua 4 điểm kiểm tra'},
        {'loai': 'dungTrongVung', 'vung': 'dich', 'moTa': 'Robot dừng ở ô đích xanh lá'},
    ],
    'sao': [
        {'moTa': 'Đi hết đường cua gắt và dừng ở ô đích'},
        {'moTa': 'Dùng cả 3 cảm biến màu',
         'dieuKien': [{'loai': 'dungCamBien', 'toiThieu': 3}]},
        {'moTa': 'Tới đích trong tối đa 30 giây',
         'dieuKien': [{'loai': 'thoiGianDuoi', 'giay': 30}]},
    ],
    'goiY': [
        'Có ba trường hợp: vạch ở giữa, vạch lệch trái, vạch lệch phải. Mỗi trường hợp robot nên làm gì?',
        {'noiDung': 'Dùng khối **nếu … thì … không thì** lồng nhau: nếu cảm biến **trái** thấy đen thì quay trái tại chỗ (chạy bánh trái -20 % bánh phải 40 %), không thì nếu cảm biến **phải** thấy đen thì quay phải, không thì đi thẳng.', 'moSauLanThu': 1},
        {'noiDung': 'Lời giải: **lặp cho đến khi** < cảm biến giữa thấy xanh lá > { **nếu** độ sáng cảm biến trái < 50 **thì** chạy bánh trái -20 % phải 40 % **không thì** { **nếu** độ sáng cảm biến phải < 50 **thì** chạy bánh trái 40 % phải -20 % **không thì** chạy bánh trái 35 % phải 35 % } }, rồi **dừng lại**.', 'moSauLanThu': 2},
    ],
    'thoiGianToiDa': 90,
})
