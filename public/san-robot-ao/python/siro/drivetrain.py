# Bộ điều khiển "đi thẳng X cm" và "quay X độ" cho robot chuẩn Sân Robot Ảo (G2).
#
# Vì sao cần: lệnh motor trần (on_for_degrees) chỉ đếm góc quay của bánh. Khi bánh
# tăng tốc hay phanh gấp, bánh trượt trên sân nên robot đi thiếu/thừa vài cm và
# quay lệch vài độ. Bộ điều khiển này:
#   - tăng tốc và giảm tốc dần (bánh ít trượt hơn),
#   - giữ hướng bằng gyro khi đi thẳng,
#   - quay theo gyro, chậm dần khi gần tới góc đích.
#
# Dùng:
#   from siro.drivetrain import Drivetrain
#   robot = Drivetrain()            # bánh trái cổng A, phải cổng B, gyro cổng 3
#   robot = Drivetrain(wheel_diameter=9.5493)   # robot bánh to
#   robot.drive_for(50)             # đi tới 50 cm (số âm: đi lùi)
#   robot.turn_for(90)              # quay phải 90 độ (số âm: quay trái)

import math
import time
from ev3dev2.motor import MoveTank, OUTPUT_A, OUTPUT_B
from ev3dev2.sensor.lego import GyroSensor

LOOP_DELAY = 0.005


def _clamp(x, lo, hi):
    if x < lo:
        return lo
    if x > hi:
        return hi
    return x


# Thông số robot chuẩn (co-ban.json). Biến thể khác truyền vào khi tạo Drivetrain;
# khối lệnh tiếng Việt (G4) sẽ tự điền từ cấu hình robot đang chọn.
WHEEL_DIAMETER_CM = 6.3662   # chu vi 20 cm
WHEEL_SPACING_CM = 16.0      # tâm bánh trái đến tâm bánh phải


class Drivetrain:
    def __init__(self, left_port=OUTPUT_A, right_port=OUTPUT_B, gyro_port='in3',
                 wheel_diameter=WHEEL_DIAMETER_CM, wheel_spacing=WHEEL_SPACING_CM):
        self.tank = MoveTank(left_port, right_port)
        self.gyro = GyroSensor(gyro_port)
        self.gyro.float = True
        self.wheel_diameter = wheel_diameter
        self.wheel_spacing = wheel_spacing
        self.wheel_circumference = math.pi * wheel_diameter
        self.drive_velocity = 50   # % tốc độ tối đa
        self.turn_velocity = 30
        # Hướng mong muốn, cộng dồn qua các lệnh để sai số không tích lũy
        self.heading = self.gyro.angle

    def set_drive_velocity(self, percent):
        self.drive_velocity = _clamp(abs(percent), 5, 100)

    def set_turn_velocity(self, percent):
        self.turn_velocity = _clamp(abs(percent), 5, 100)

    def _wheel_pos(self):
        return (self.tank.left_motor.position + self.tank.right_motor.position) / 2.0

    def drive_for(self, cm, velocity=None):
        vmax = self.drive_velocity if velocity is None else _clamp(abs(velocity), 5, 100)
        sign = 1 if cm >= 0 else -1
        target = abs(cm) / self.wheel_circumference * 360.0   # góc bánh cần quay (độ)
        start = self._wheel_pos()
        while True:
            done = abs(self._wheel_pos() - start)
            remaining = target - done
            if remaining <= 0.5:
                break
            # Tăng tốc dần từ 8%, giảm tốc tỉ lệ với quãng còn lại
            v = min(vmax, 8 + done * 0.15, 3 + remaining * 0.08)
            err = self.gyro.angle - self.heading                 # dương = lệch sang phải
            corr = _clamp(err * 2.0, -15, 15)
            left = sign * v - corr
            right = sign * v + corr
            self.tank.on(_clamp(left, -100, 100), _clamp(right, -100, 100))
            time.sleep(LOOP_DELAY)
        self.tank.off(brake=True)
        time.sleep(0.3)

    def turn_for(self, degrees, velocity=None):
        vmax = self.turn_velocity if velocity is None else _clamp(abs(velocity), 5, 100)
        self.heading = self.heading + degrees
        settled = 0
        t0 = time.time()
        while time.time() - t0 < 10:
            err = self.heading - self.gyro.angle                 # dương = cần quay phải
            if abs(err) < 0.3:
                settled += 1
                self.tank.off(brake=True)
                if settled >= 5:
                    break
            else:
                settled = 0
                v = _clamp(abs(err) * 0.6, 2, vmax)
                if err > 0:
                    self.tank.on(v, -v)
                else:
                    self.tank.on(-v, v)
            time.sleep(LOOP_DELAY)
        self.tank.off(brake=True)
        time.sleep(0.3)

    def turn_right(self, degrees=90):
        self.turn_for(abs(degrees))

    def turn_left(self, degrees=90):
        self.turn_for(-abs(degrees))
