# Sinh 5 sân cho bài cảm biến màu và dò đường (gói G7).
# Chạy: python3 scripts/san/tao-san-cam-bien.py
# Kết quả: public/san-robot-ao/san/<tên>/{nen.png, thumb.png, world.json}
#
# Quy ước: sân 200 × 200 cm, ảnh 2000 × 2000 px (10 px/cm, imageScale 1).
# Tọa độ cm, gốc ở tâm sân, y lên trên; hướng 0 = lên (+y), quay phải thì góc tăng.
#
# Lưu ý màu: cảm biến "độ sáng phản xạ" của GEARS chỉ đo kênh ĐỎ (giống cảm biến EV3
# chiếu đèn đỏ). Mọi thứ trang trí trên đường robot đi phải có kênh đỏ cao (≥ 190),
# nếu không robot sẽ tưởng là vạch đen. Xanh lá có kênh đỏ thấp nên "tối" như đen.
import json
import math
import os
from PIL import Image, ImageDraw, ImageFont

GOC = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'san-robot-ao', 'san')
PX = 10          # điểm ảnh mỗi cm
CO = 200         # cạnh sân (cm)
DEN = (20, 20, 20)
TRANG = (255, 255, 255)
LUOI = (236, 240, 245)
XANH_LA = (46, 158, 68)
CHU = (110, 118, 130)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def px(x, y):
    return ((x + CO / 2) * PX, (CO / 2 - y) * PX)


def nen_trang(luoi=True):
    im = Image.new('RGB', (CO * PX, CO * PX), TRANG)
    d = ImageDraw.Draw(im)
    if luoi:
        for k in range(-100, 101, 25):
            d.line([px(k, -100), px(k, 100)], fill=LUOI, width=3)
            d.line([px(-100, k), px(100, k)], fill=LUOI, width=3)
    return im, d


def chu(d, x, y, s, co=48, mau=CHU):
    f = ImageFont.truetype(FONT, co)
    d.text(px(x, y), s, fill=mau, font=f, anchor='mm')


def hcn(d, x, y, rong, dai, mau):
    x0, y0 = px(x - rong / 2, y + dai / 2)
    x1, y1 = px(x + rong / 2, y - dai / 2)
    d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=mau)


def vi_tri_xuat_phat(d, x, y, goc):
    # Dấu xuất phát: chữ V nhạt màu cam dưới tâm quay (kênh đỏ cao, cảm biến coi như trắng)
    g = math.radians(goc)
    tx, ty = math.sin(g), math.cos(g)
    nx, ny = ty, -tx
    pts = [(x + nx * 7 - tx * 4, y + ny * 7 - ty * 4), (x + tx * 4, y + ty * 4), (x - nx * 7 - tx * 4, y - ny * 7 - ty * 4)]
    d.line([px(*p) for p in pts], fill=(255, 196, 120), width=12, joint='curve')


class Duong:
    """Đường dò: chuỗi đoạn thẳng ('S', dài) và cung ('A', bán kính, góc; dương = rẽ phải)."""

    def __init__(self, x, y, goc):
        self.diem = [(x, y)]
        self.x, self.y, self.goc = x, y, goc
        self.dai = 0.0

    def buoc(self, ds):
        x, y = self.x, self.y
        self.x += ds * math.sin(math.radians(self.goc))
        self.y += ds * math.cos(math.radians(self.goc))
        self.dai += ds
        self.diem.append((self.x, self.y))

    def S(self, L):
        n = max(1, int(L / 0.4))
        for _ in range(n):
            self.buoc(L / n)
        return self

    def A(self, R, goc):
        if R == 0:            # góc gắt: đổi hướng ngay tại chỗ
            self.goc += goc
            return self
        L = abs(goc) * math.pi / 180 * R
        n = max(2, int(L / 0.4))
        for _ in range(n):
            self.goc += goc / n / 2
            self.buoc(L / n)
            self.goc += goc / n / 2
        return self

    def ve(self, d, rong=2.0, mau=DEN):
        r = rong / 2 * PX
        for (x, y) in self.diem:
            cx, cy = px(x, y)
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=mau)

    def diem_tai(self, ti_le):
        # điểm trên đường ở ti_le (0..1) chiều dài
        mt = ti_le * self.dai
        s = 0
        for a, b in zip(self.diem, self.diem[1:]):
            l = math.dist(a, b)
            if s + l >= mt:
                return b
            s += l
        return self.diem[-1]


def luu(ten, im, world_ten, mo_ta, thong_tin=None):
    thu_muc = os.path.join(GOC, ten)
    os.makedirs(thu_muc, exist_ok=True)
    im.save(os.path.join(thu_muc, 'nen.png'), optimize=True)
    im.resize((200, 200), Image.LANCZOS).save(os.path.join(thu_muc, 'thumb.png'), optimize=True)
    world = {
        'worldName': 'custom',
        'tenSan': world_ten,
        'moTaSan': mo_ta,
        'options': {
            'imageURL': 'san-robot-ao/san/' + ten + '/nen.png',
            'groundType': 'box', 'imageScale': 1, 'uScale': 1, 'vScale': 1,
            'wall': True, 'wallHeight': 7.7, 'wallThickness': 4.5, 'wallColor': '#3A4A5A',
            'groundFriction': 1, 'wallFriction': 0.1, 'groundRestitution': 0, 'wallRestitution': 0.1,
            'timer': 'none', 'objects': [], 'startPos': 'center'
        }
    }
    with open(os.path.join(thu_muc, 'world.json'), 'w', encoding='utf-8') as f:
        json.dump(world, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(ten, thong_tin or '')


# 1. Một vạch đen ngang sân ---------------------------------------------------
def san_mot_vach():
    im, d = nen_trang()
    hcn(d, 0, 30, 200, 4, DEN)               # vạch dày 4 cm, tâm y = 30
    for y in (-80, -60, -40):
        vi_tri_xuat_phat(d, 0, y, 0)
    luu('mot-vach', im, 'Một vạch đen',
        'Sân trắng 200 × 200 cm, một vạch đen dày 4 cm chạy ngang sân ở y = 30 cm. Dấu chữ V màu cam là các chỗ xuất phát.')


# 2. Đường thẳng có 6 vạch ----------------------------------------------------
VACH_DEM = [-45, -20, 0, 30, 50, 75]


def san_nhieu_vach():
    im, d = nen_trang()
    hcn(d, 0, 0, 44, 196, (226, 230, 236))   # làn đường xám rất nhạt (kênh đỏ 89 %)
    for i, y in enumerate(VACH_DEM):
        hcn(d, 0, y, 44, 3, DEN)
        chu(d, 34, y, str(i + 1), 60)
    for y in (-85, -75, -65):
        vi_tri_xuat_phat(d, 0, y, 0)
    luu('nhieu-vach', im, 'Sáu vạch đen',
        'Làn đường dọc giữa sân, rộng 44 cm, có 6 vạch đen dày 3 cm ở y = ' + ', '.join(map(str, VACH_DEM)) + ' cm. Số thứ tự vạch ghi bên phải.')


# 3. Sân trắng cho ô màu (ô màu đặt bằng vật thể trong tệp bài) -----------------
def san_o_mau():
    im, d = nen_trang()
    vi_tri_xuat_phat(d, 0, -80, 0)
    luu('o-mau', im, 'Sân ô màu',
        'Sân trắng 200 × 200 cm có lưới nhạt 25 cm. Các ô màu do từng bài đặt lên.')


# 4. Đường cong mềm, dò bằng 1 cảm biến ----------------------------------------
def duong_cong():
    return (Duong(-70, -80, 0).S(35).A(40, 90).S(30).A(40, -90).S(15).A(30, -90).S(25))


def san_duong_cong():
    im, d = nen_trang()
    p = duong_cong()
    hcn(d, p.x - 12, p.y, 24, 24, XANH_LA)   # ô đích xanh lá ở cuối đường
    vi_tri_xuat_phat(d, -71, -80, 0)
    p.ve(d)
    chu(d, -45, -86, 'XUẤT PHÁT', 40)
    chu(d, p.x - 12, p.y - 19, 'ĐÍCH', 40)
    kt = [p.diem_tai(t) for t in (0.25, 0.5, 0.75)]
    luu('duong-cong', im, 'Đường cong',
        'Đường đen rộng 2 cm, khúc cua bán kính 30–40 cm, cuối đường là ô đích xanh lá 24 × 24 cm.',
        {'dai': round(p.dai), 'cuoi': (round(p.x, 1), round(p.y, 1)), 'kiemTra': [(round(a, 1), round(b, 1)) for a, b in kt]})


# 5. Đường có góc vuông và khúc cua gắt, dò bằng 3 cảm biến ----------------------
def cua_gat():
    return (Duong(-70, -80, 0).S(50).A(0, 90).S(45).A(0, -90).S(30).A(15, 180)
            .S(20).A(0, -90).S(40).A(0, -90).S(25).A(15, 90).S(20).A(0, 90).S(30))


def san_cua_gat():
    im, d = nen_trang()
    p = cua_gat()
    g = math.radians(p.goc)
    cx, cy = p.x + 12 * math.sin(g), p.y + 12 * math.cos(g)
    hcn(d, cx, cy, 24, 24, XANH_LA)
    vi_tri_xuat_phat(d, -70, -80, 0)
    p.ve(d)
    chu(d, -45, -86, 'XUẤT PHÁT', 40)
    kt = [p.diem_tai(t) for t in (0.2, 0.4, 0.6, 0.8)]
    luu('cua-gat', im, 'Đường cua gắt',
        'Đường đen rộng 2 cm có 4 góc vuông và 2 khúc cua hẹp (bán kính 15 cm), cuối đường là ô đích xanh lá.',
        {'dai': round(p.dai), 'cuoi': (round(p.x, 1), round(p.y, 1)), 'huong': p.goc, 'dich': (round(cx, 1), round(cy, 1)),
         'kiemTra': [(round(a, 1), round(b, 1)) for a, b in kt]})


if __name__ == '__main__':
    san_mot_vach()
    san_nhieu_vach()
    san_o_mau()
    san_duong_cong()
    san_cua_gat()
