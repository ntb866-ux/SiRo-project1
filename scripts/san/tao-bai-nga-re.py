# Sinh 3 sân + 3 bài dò line có ngã rẽ (ngã ba chữ T, ngã tư, lưới phố) và code mẫu tương ứng.
# Chạy: python3 scripts/san/tao-bai-nga-re.py
# Kết quả: san/{nga-ba,nga-tu,luoi-pho}/, thu-thach/03-cam-bien-mau/06..08-*.json, code-mau/03-cam-bien-mau/06..08-*.json
#
# Quy ước như tao-san-cam-bien.py: cm, gốc tâm sân, y lên trên, hướng 0 = lên, quay phải góc tăng.
# Nhận ngã rẽ bằng 3 mắt dò line: ngã ba chữ T và ngã tư đều có thanh ngang đối xứng, nên khi thanh ngang
# chạy qua gầm xe thì mắt trái VÀ mắt phải cùng thấy đen. Trên đường thẳng, vạch 2 cm không bao giờ che được
# cả hai mắt ngoài (cách nhau 6 cm), nên điều kiện này chỉ đúng ở ngã rẽ.
# Mắt dò nằm trước trục bánh 4 cm: thấy ngã rẽ xong phải đi thêm 4 cm để trục bánh vào giữa ngã rẽ rồi mới quay.
import importlib.util, json, os
from PIL import ImageDraw

DAY = os.path.join(os.path.dirname(__file__), '..', '..')
spec = importlib.util.spec_from_file_location('sc', os.path.join(os.path.dirname(__file__), 'tao-san-cam-bien.py'))
sc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sc)
PUBLIC = os.path.join(DAY, 'public', 'san-robot-ao')
BAI = os.path.join(PUBLIC, 'thu-thach', '03-cam-bien-mau')
MAU = os.path.join(PUBLIC, 'code-mau', '03-cam-bien-mau')
os.makedirs(BAI, exist_ok=True)
os.makedirs(MAU, exist_ok=True)
DO_O = (229, 57, 53)      # ô đỏ: ngõ cụt (kênh đỏ cao nên cảm biến coi như nền trắng)
W = 2.0                   # bề rộng vạch


def doc(d, x, y0, y1):
    sc.hcn(d, x, (y0 + y1) / 2, W, abs(y1 - y0) + W, sc.DEN)


def ngang(d, y, x0, x1):
    sc.hcn(d, (x0 + x1) / 2, y, abs(x1 - x0) + W, W, sc.DEN)


def luu_json(duong, du_lieu):
    with open(duong, 'w', encoding='utf-8') as f:
        json.dump(du_lieu, f, ensure_ascii=False, indent=2)
        f.write('\n')


def vung(ten, tenEn, x, y, rong=20, dai=20):
    return {'ten': ten, 'tenEn': tenEn, 'x': x, 'y': y, 'rong': rong, 'dai': dai, 'an': True}


# ---- sân -----------------------------------------------------------------------------------------
# Đích là một VẠCH ĐÍCH: thanh đen ngắn vuông góc với đường, nằm trong ô vàng. Không dùng ô xanh lá như
# bài 4, 5 vì mắt hồng ngoại đọc ô xanh lá khoảng 57, gần ngưỡng 65, nên lẫn với ngã rẽ. Vạch đích cho đúng
# dấu hiệu của ngã rẽ (hai mắt ngoài cùng đen), robot đếm nó như ngã rẽ cuối cùng. Ô vàng có kênh đỏ cao
# nên mắt hồng ngoại coi như nền trắng.
VANG_NHAT = (253, 224, 102)


def vach_dich(d, x, y, doc_theo_x):
    """Ô vàng 22 × 22 cm và vạch đích dài 12 cm ở (x, y). doc_theo_x: đường tới đích chạy theo trục x."""
    sc.hcn(d, x, y, 22, 22, VANG_NHAT)
    if doc_theo_x:
        sc.hcn(d, x, y, W, 12, sc.DEN)
    else:
        sc.hcn(d, x, y, 12, W, sc.DEN)


def san_nga_ba():
    im, d = sc.nen_trang()
    sc.vi_tri_xuat_phat(d, 0, -80, 0)   # vẽ trước, vạch đen vẽ đè lên
    vach_dich(d, 65, 62, False)
    doc(d, 0, -85, 20)
    ngang(d, 20, -65, 65)
    doc(d, 65, 20, 62)
    sc.hcn(d, -73, 20, 12, 12, DO_O)
    sc.chu(d, 30, -86, 'XUẤT PHÁT', 40)
    sc.chu(d, 65, 80, 'ĐÍCH', 40)
    sc.chu(d, -35, 38, 'NGÃ BA', 36)
    sc.luu('nga-ba', im, 'Ngã ba chữ T',
           'Đường đen rộng 2 cm đi thẳng lên rồi gặp một ngã ba chữ T ở y = 20. Nhánh trái cụt (ô đỏ), nhánh phải dẫn tới vạch đích trong ô vàng.')


def san_nga_tu():
    im, d = sc.nen_trang()
    sc.vi_tri_xuat_phat(d, 0, -80, 0)
    vach_dich(d, 65, 62, False)
    doc(d, 0, -85, 75)
    ngang(d, -35, -65, 65)
    ngang(d, 25, -65, 65)
    doc(d, 65, 25, 62)
    for (x, y) in [(-73, -35), (-73, 25), (73, -35)]:
        sc.hcn(d, x, y, 12, 12, DO_O)
    sc.hcn(d, 0, 82, 12, 12, DO_O)
    sc.chu(d, 36, -86, 'XUẤT PHÁT', 40)
    sc.chu(d, 65, 80, 'ĐÍCH', 40)
    sc.chu(d, -40, -52, 'NGÃ TƯ 1', 34)
    sc.chu(d, -40, 8, 'NGÃ TƯ 2', 34)
    sc.luu('nga-tu', im, 'Hai ngã tư',
           'Đường dọc giữa sân cắt hai đường ngang ở y = -35 và y = 25 thành hai ngã tư. Vạch đích (ô vàng) ở cuối nhánh phải của đường ngang trên; các đầu đường khác là ngõ cụt (ô đỏ).')


COT = [-65, -5, 55]
HANG = [-40, 10, 60]


def san_luoi_pho():
    im, d = sc.nen_trang()
    sc.vi_tri_xuat_phat(d, -65, -80, 0)
    vach_dich(d, 70, 60, True)
    for x in COT:
        doc(d, x, -85, 75)
    for y in HANG:
        ngang(d, y, -80, 70)
    sc.chu(d, -35, -86, 'XUẤT PHÁT', 40)
    sc.chu(d, 70, 78, 'ĐÍCH', 34)
    for i, y in enumerate(HANG):
        sc.chu(d, -90, y + 6, 'H%d' % (i + 1), 26)
    sc.luu('luoi-pho', im, 'Lưới phố',
           'Lưới 3 × 3 đường đen rộng 2 cm, có 9 ngã tư. Robot xuất phát ở góc dưới bên trái, vạch đích (ô vàng) ở đầu bên phải hàng ngang trên cùng.')


# ---- code mẫu ------------------------------------------------------------------------------------
NGUONG = 65   # ngưỡng đen/trắng của mắt hồng ngoại: mép vạch đọc khoảng 60, nên 65 không để "vùng mù" giữa hai mắt
BAN_NGANG = ['va', ['<', ['sang', 'TRAI'], NGUONG], ['<', ['sang', 'PHAI'], NGUONG]]    # thanh ngang qua gầm xe
BAM_DUONG = ['neu', ['<', ['sang', 'TRAI'], NGUONG], [['banh', -12, 25]],
             [['neu', ['<', ['sang', 'PHAI'], NGUONG], [['banh', 25, -12]],
               [['neu', ['<', ['sang', 'GIUA'], NGUONG], [['banh', 20, 20]]]]]]]
XE = {
    'sa': [], 'duoi': [],
    'gam': [{'loai': 'doLine', 'x': -3, 'z': 4}, {'loai': 'doLine', 'x': 0, 'z': 4}, {'loai': 'doLine', 'x': 3, 'z': 4}],
    'tren': [{'loai': 'gyro', 'x': -3, 'z': 3.95}],
    'son': {'khung': '#ef6c00'},
}
GIAI_THICH_XE = ('Ba mắt dò line dưới gầm, cách nhau 3 cm, đặt trước trục bánh 4 cm (giống xe ở bài dò đường cua gắt). '
                 'Ngã rẽ có thanh ngang đối xứng nên khi thanh ngang chạy qua gầm xe thì mắt trái và mắt phải cùng thấy đen: '
                 'đó là dấu hiệu "đang ở ngã rẽ". Thấy dấu hiệu xong xe đi thêm 4 cm để trục bánh vào giữa ngã rẽ rồi mới quay.')


def tep_mau(ten, ma, giai_thich, sao=3):
    return {'bai': '03-cam-bien-mau/' + ten, 'tenXe': 'Xe ba mắt dưới gầm', 'giaiThichXe': GIAI_THICH_XE,
            'xe': XE, 'chuongTrinh': ma, 'giaiThichCode': giai_thich, 'sao': sao}


def bai_chung(tieu_de, tieu_de_en, san, deBai, nguyenLi, mucTieu, sao, goiY, vungs, tg):
    return {
        'tieuDe': tieu_de, 'tieuDeEn': tieu_de_en, 'san': san, 'robot': 'do-line', 'cheDo': 'co-ban',
        'viTriBatDau': {'x': 0, 'y': -80, 'goc': 0} if san != 'luoi-pho' else {'x': COT[0], 'y': -80, 'goc': 0},
        'vung': vungs, 'soDo': ['doSangTrai', 'doSangGiua', 'doSangPhai'], 'nguong': NGUONG,
        'deBai': deBai, 'nguyenLi': nguyenLi, 'mucTieu': mucTieu, 'sao': sao, 'goiY': goiY, 'thoiGianToiDa': tg,
    }


NGUYEN_LI = ('Ở ngã rẽ, một cảm biến không đủ: robot cần biết **có thanh ngang hay không**. Ba cảm biến đặt cạnh nhau (cách 3 cm) cho biết điều đó: '
             'trên đường thẳng vạch rộng 2 cm chỉ che được **một** mắt, nên hai mắt ngoài không bao giờ cùng thấy đen. Khi thanh ngang của ngã rẽ chạy qua gầm xe thì '
             '**cả mắt trái lẫn mắt phải** cùng thấy đen. Đó là tín hiệu "đang ở ngã rẽ".\n\n'
             'Mắt dò nằm trước trục bánh 4 cm. Muốn quay đúng tại giữa ngã rẽ, robot phải đi thêm 4 cm cho trục bánh (tâm quay) vào giữa ngã rẽ, rồi mới quay 90°. '
             'Quay khi trục bánh chưa tới nơi thì robot rẽ sớm, cắt góc và ra khỏi đường.\n\n')


# Giới hạn thời gian của sao 3 (giây): code mẫu chạy khoảng 22 / 24 / 37 giây, cộng rộng tay (khoảng 1,6 lần) vì máy chậm thì vòng lặp đọc cảm biến chậm, xe chạy lâu hơn.
TG_SAO3 = {'06': 35, '07': 38, '08': 60}
NGUONG_GOI_Y = ('Ngưỡng đen/trắng ở các bài này là **65** (không phải 50): mắt nằm ngay mép vạch đọc khoảng 60, '
                'ngưỡng 65 để mắt nào chạm mép vạch cũng tính là thấy đen.')


def sao_chung(sao2, so):
    return [
        {'moTa': 'Đi đúng lộ trình và dừng ở vạch đích'},
        sao2,
        {'moTa': 'Tới đích trong tối đa %d giây' % TG_SAO3[so], 'dieuKien': [{'loai': 'thoiGianDuoi', 'giay': TG_SAO3[so]}]},
    ]


SAO_BIEN = {'moTa': 'Đếm ngã rẽ bằng biến',
            'dieuKien': [{'loai': 'dungKhoi', 'khoi': ['math_change', 'variables_set'], 'tenKhoi': 'biến đếm'}]}


def bai_nga_ba():
    ten = '06-nga-ba-chu-t'
    vungs = {
        'kt1': vung('điểm kiểm tra 1', 'checkpoint 1', 35, 20),
        'kt2': vung('điểm kiểm tra 2', 'checkpoint 2', 65, 40),
        'dich': vung('vạch đích', 'finish line', 65, 58, 16, 16),
    }
    muc_tieu = [
        {'loai': 'quaCacVung', 'vung': ['kt1', 'kt2'], 'theoThuTu': True, 'moTa': 'Robot rẽ phải ở ngã ba và đi theo nhánh phải'},
        {'loai': 'dungTrongVung', 'vung': 'dich', 'moTa': 'Robot dừng ngay trước vạch đích'},
    ]
    sao = sao_chung({'moTa': 'Dùng cả 3 cảm biến (trái, giữa, phải)', 'dieuKien': [{'loai': 'dungCamBien', 'toiThieu': 3}]}, '06')
    goi_y = [
        'Đường thẳng thì bám vạch như bài 5. Chỉ thêm một câu hỏi: **làm sao biết đã tới ngã ba?** Khi thanh ngang của chữ T chạy qua gầm xe, mắt trái và mắt phải thấy gì?',
        {'noiDung': 'Chương trình có 3 phần nối tiếp: (1) **lặp cho đến khi** mắt trái **và** mắt phải cùng thấy đen { bám vạch }; (2) **đi 4 cm**, **quay phải 90°**; (3) lại **lặp cho đến khi** hai mắt ngoài cùng thấy đen { bám vạch } (đó là vạch đích), rồi **dừng lại**. ' + NGUONG_GOI_Y, 'moSauLanThu': 1},
        {'noiDung': 'Lời giải: **lặp cho đến khi** < trái < 65 **và** phải < 65 > { **nếu** trái < 65 **thì** chạy bánh -12 % / 25 % **không thì nếu** phải < 65 **thì** chạy bánh 25 % / -12 % **không thì nếu** giữa < 65 **thì** chạy bánh 20 % / 20 % }; **đi tới 4 cm**; **quay phải 90°**; lặp lại đúng vòng lặp bám vạch đó; **dừng lại**.', 'moSauLanThu': 2},
    ]
    de_bai = ('Đường đen đi thẳng rồi gặp một **ngã ba chữ T**. Nhánh trái là **ngõ cụt** (ô đỏ), nhánh phải dẫn tới **vạch đích**: một thanh đen ngắn trong ô vàng.\n\n'
              'Luật của bài: **tới ngã ba thì rẽ phải**, rồi bám vạch tới vạch đích và **dừng ngay khi gặp vạch đích**.\n\n'
              'Quan sát bảng số đo: khi xe tới ngã ba, độ sáng của mắt trái và mắt phải thay đổi thế nào? Lúc xe chạy trên đường thẳng thì sao?')
    ma = [['lapDen', BAN_NGANG, [BAM_DUONG]], ['di', 4], ['phai', 90],
          ['lapDen', BAN_NGANG, [BAM_DUONG]], ['dung']]
    return ten, bai_chung('Ngã ba chữ T: rẽ phải', 'T-junction: turn right', 'nga-ba', de_bai,
                          NGUYEN_LI + 'Vạch đích cũng là một thanh ngang nên robot nhận ra nó y như ngã ba: hai mắt ngoài cùng thấy đen.\n\n'
                          'Nói với học sinh: lái xe tới ngã ba thì phải nhìn thấy cả **hai bên** đường mới biết đang ở ngã ba. Robot cũng cần "nhìn" hai bên bằng hai mắt ngoài.',
                          muc_tieu, sao, goi_y, vungs, 90), \
        tep_mau(ten, ma,
                'Hai vòng lặp bám vạch giống hệt nhau, mỗi vòng dừng khi hai mắt ngoài cùng thấy đen (gặp thanh ngang). Vòng đầu dừng ở ngã ba: xe đi 4 cm cho trục bánh tới giữa ngã ba rồi quay phải 90°. '
                'Vòng sau dừng ở vạch đích. Ngưỡng 65 thay vì 50 vì mắt nằm đúng mép vạch đọc khoảng 60: ngưỡng 50 để lọt những chỗ cả ba mắt cùng thấy "trắng" dù vạch còn nằm giữa hai mắt.')


def bai_nga_tu():
    ten = '07-nga-tu-dem-nga-re'
    vungs = {
        'kt1': vung('ngã tư 1', 'junction 1', 0, -35),
        'kt2': vung('ngã tư 2', 'junction 2', 0, 25),
        'kt3': vung('điểm kiểm tra', 'checkpoint', 65, 42),
        'dich': vung('vạch đích', 'finish line', 65, 58, 16, 16),
    }
    muc_tieu = [
        {'loai': 'quaCacVung', 'vung': ['kt1', 'kt2', 'kt3'], 'theoThuTu': True, 'moTa': 'Robot đi thẳng qua ngã tư 1, rẽ phải ở ngã tư 2'},
        {'loai': 'dungTrongVung', 'vung': 'dich', 'moTa': 'Robot dừng ngay trước vạch đích'},
    ]
    goi_y = [
        'Hai ngã tư và vạch đích nhìn giống hệt nhau với robot (hai mắt ngoài cùng thấy đen). Robot phân biệt chúng bằng cách nào? Gợi ý: **đếm**. Dùng một biến, mỗi lần gặp thanh ngang thì tăng 1.',
        {'noiDung': 'Gặp thanh ngang thì **tăng biến đếm 1**. Nếu đếm = 1 thì **đi thẳng** (đi 6 cm cho gầm xe qua khỏi thanh ngang); nếu đếm = 2 thì **đi 4 cm rồi quay phải 90°**. Lặp cho đến khi đếm = 3 (đã gặp vạch đích) rồi dừng. ' + NGUONG_GOI_Y, 'moSauLanThu': 1},
        {'noiDung': 'Lời giải: **đặt** đếm = 0; **lặp cho đến khi** đếm = 3 { **nếu** < trái < 65 **và** phải < 65 > **thì** { **tăng** đếm 1; **nếu** đếm = 1 **thì** đi 6 cm **không thì nếu** đếm = 2 **thì** { đi 4 cm; quay phải 90° } } **không thì** bám vạch như bài 6 }; **dừng lại**.', 'moSauLanThu': 2},
    ]
    de_bai = ('Đường dọc giữa sân cắt hai đường ngang tạo thành **hai ngã tư**. Vạch đích (ô vàng) ở cuối nhánh **phải của ngã tư 2**. Mọi đầu đường khác đều là ngõ cụt (ô đỏ).\n\n'
              'Luật của bài: **đi thẳng qua ngã tư 1, rẽ phải ở ngã tư 2**, dừng ở vạch đích. Hai ngã tư giống hệt nhau, nên robot phải **đếm** xem mình đã gặp mấy thanh ngang.\n\n'
              'Thử trước: nếu chạy chương trình bài 6 ở đây thì robot rẽ ở ngã tư nào? Vì sao?')
    ma = [['datBien', 'đếm', 0],
          ['lapDen', ['=', ['bien', 'đếm'], 3],
           [['neu', BAN_NGANG,
             [['tangBien', 'đếm', 1],
              ['neu', ['=', ['bien', 'đếm'], 1], [['di', 6]],
               [['neu', ['=', ['bien', 'đếm'], 2], [['di', 4], ['phai', 90]]]]]],
             [BAM_DUONG]]]],
          ['dung']]
    return ten, bai_chung('Ngã tư: đếm ngã rẽ', 'Crossroads: count the junctions', 'nga-tu', de_bai,
                          NGUYEN_LI + 'Ngã tư có **đường đi thẳng** nên robot phải chọn: đi thẳng hay rẽ. Hai ngã tư nhìn giống nhau, nên robot cần **bộ nhớ**: một biến đếm cho nó biết "đây là thanh ngang thứ mấy". '
                          'Đi thẳng qua ngã tư thì phải đi đủ xa (6 cm) cho cả ba mắt qua khỏi thanh ngang, nếu không vòng lặp sau lại thấy thanh ngang và đếm thêm một lần.\n\n'
                          'Nói với học sinh: giống như bạn chỉ đường "tới ngã tư thứ hai thì rẽ phải": người nghe phải nhẩm đếm.',
                          muc_tieu, sao_chung(SAO_BIEN, '07'), goi_y, vungs, 120), \
        tep_mau(ten, ma,
                'Biến "đếm" ghi số thanh ngang đã gặp. Mỗi lần hai mắt ngoài cùng thấy đen: tăng đếm. Ngã tư 1 (đếm = 1) thì đi thẳng 6 cm cho gầm xe qua khỏi thanh ngang, '
                'ngã tư 2 (đếm = 2) thì đi 4 cm cho trục bánh vào giữa rồi quay phải 90°, vạch đích (đếm = 3) thì vòng lặp kết thúc và xe dừng. Ngoài thanh ngang thì bám vạch như bài 6.')


LO_TRINH = [('di', 6), ('phai', 90), ('di', 6), ('trai', 90), ('phai', 90)]


def bai_luoi_pho():
    ten = '08-luoi-pho-nhieu-nga-re'
    x0, x1, x2 = COT
    vungs = {
        'kt1': vung('ngã tư 2', 'junction 2', x0, 10, 16, 16),
        'kt2': vung('ngã tư 4', 'junction 4', x2, 10, 16, 16),
        'kt3': vung('ngã tư 5', 'junction 5', x2, 60, 16, 16),
        'dich': vung('vạch đích', 'finish line', 66, 60, 16, 16),
    }
    muc_tieu = [
        {'loai': 'quaCacVung', 'vung': ['kt1', 'kt2', 'kt3'], 'theoThuTu': True, 'moTa': 'Robot đi đúng lộ trình qua các ngã tư theo bảng'},
        {'loai': 'dungTrongVung', 'vung': 'dich', 'moTa': 'Robot dừng ngay trước vạch đích'},
    ]
    goi_y = [
        'Lộ trình có 5 ngã tư rồi tới vạch đích, mỗi ngã tư một việc. Dùng **một biến đếm** tăng 1 mỗi lần gặp thanh ngang, rồi hỏi "đếm bằng mấy?" để chọn việc làm.',
        {'noiDung': 'Sau khi **tăng đếm**, dùng các khối **nếu … thì … không thì** lồng nhau: nếu đếm = 1 thì đi thẳng, không thì nếu đếm = 2 thì rẽ phải, … "Đi thẳng" là **đi 6 cm**, "rẽ" là **đi 4 cm rồi quay 90°**. Lặp cho đến khi đếm = 6 (vạch đích). ' + NGUONG_GOI_Y, 'moSauLanThu': 1},
        {'noiDung': 'Lời giải: đặt đếm = 0; **lặp cho đến khi** đếm = 6 { **nếu** gặp thanh ngang **thì** { **tăng** đếm 1; **nếu** đếm=1 **thì** đi 6 **không thì nếu** đếm=2 **thì** {đi 4; phải 90} **không thì nếu** đếm=3 **thì** đi 6 **không thì nếu** đếm=4 **thì** {đi 4; trái 90} **không thì nếu** đếm=5 **thì** {đi 4; phải 90} } **không thì** bám vạch }; dừng lại.', 'moSauLanThu': 2},
    ]
    de_bai = ('Một **khu phố** có 3 đường dọc và 3 đường ngang (H1, H2, H3), mọi giao điểm đều là **ngã tư**. Robot xuất phát ở góc dưới bên trái, hướng lên. **Vạch đích** (ô vàng) ở đầu bên phải đường ngang trên cùng (H3).\n\n'
              'Lộ trình: robot gặp các ngã tư **theo thứ tự** (đếm cả sau khi rẽ):\n\n'
              '- Ngã tư 1: **đi thẳng**\n- Ngã tư 2: **rẽ phải**\n- Ngã tư 3: **đi thẳng**\n- Ngã tư 4: **rẽ trái**\n- Ngã tư 5: **rẽ phải**, rồi bám vạch tới vạch đích và dừng.\n\n'
              'Hãy viết **một** chương trình chung cho mọi ngã tư: robot đếm thanh ngang rồi chọn việc làm theo số đếm. Vẽ lộ trình lên giấy trước khi lập trình.')
    lenh = {'di': lambda: [['di', 6]], 'phai': lambda: [['di', 4], ['phai', 90]], 'trai': lambda: [['di', 4], ['trai', 90]]}
    chuoi = []
    for i in range(len(LO_TRINH), 0, -1):          # dựng chuỗi "nếu … không thì nếu …" từ trong ra ngoài
        viec = lenh[LO_TRINH[i - 1][0]]()
        chuoi = [['neu', ['=', ['bien', 'đếm'], i], viec] + ([chuoi] if chuoi else [])]
    ma = [['datBien', 'đếm', 0],
          ['lapDen', ['=', ['bien', 'đếm'], len(LO_TRINH) + 1],
           [['neu', BAN_NGANG, [['tangBien', 'đếm', 1]] + chuoi, [BAM_DUONG]]]],
          ['dung']]
    return ten, bai_chung('Lưới phố: lộ trình 5 ngã tư', 'City grid: a 5-junction route', 'luoi-pho', de_bai,
                          NGUYEN_LI + 'Một chương trình chung cho mọi ngã tư là **tổng quát hóa**: thay vì viết 5 đoạn lệnh riêng, robot dùng **biến đếm** và các nhánh "nếu … thì" như một **bảng tra**: số đếm → việc làm. '
                          'Robot kho hàng thật cũng đi theo lộ trình kiểu này: đếm giao lộ (hoặc đọc mã dán trên sàn) rồi tra bảng lệnh.\n\n'
                          'Nói với học sinh: giống như tờ giấy chỉ đường "ngã tư 1 đi thẳng, ngã tư 2 rẽ phải…": vừa đi vừa đếm, tới đâu tra giấy tới đó.',
                          muc_tieu, sao_chung(SAO_BIEN, '08'), goi_y, vungs, 180), \
        tep_mau(ten, ma,
                'Biến "đếm" cho biết đang ở thanh ngang thứ mấy; chuỗi "nếu đếm = …" là bảng lộ trình: 1 thẳng, 2 phải, 3 thẳng, 4 trái, 5 phải. Thanh ngang thứ 6 là vạch đích: vòng lặp kết thúc, xe dừng. '
                'Đi thẳng = đi 6 cm (qua khỏi thanh ngang), rẽ = đi 4 cm cho trục bánh vào giữa ngã tư rồi quay 90°.')


if __name__ == '__main__':
    san_nga_ba()
    san_nga_tu()
    san_luoi_pho()
    for f in (bai_nga_ba, bai_nga_tu, bai_luoi_pho):
        ten, bai, mau = f()
        luu_json(os.path.join(BAI, ten + '.json'), bai)
        luu_json(os.path.join(MAU, ten + '.json'), mau)
        print('đã ghi', ten)
