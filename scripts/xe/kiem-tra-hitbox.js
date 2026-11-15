// Kiểm tra hitbox của xe lắp mô-đun khớp với hình nhìn thấy, từng chi tiết một.
//   A. Lưới vẽ → khối: không đỉnh nào của lưới vẽ nhô ra ngoài các khối hitbox quá DUNG_SAI.
//   B. Khối → lưới vẽ: mọi điểm trên mặt hitbox (phần lộ ra ngoài) cách lưới vẽ không quá DUNG_SAI.
//   C. Bullet → khối: bắn tia vào vật thể trong bộ vật lí, điểm trúng phải nằm trên mặt khối
//      (xác nhận hình va chạm đang chạy thật đúng là các khối đó, không phải hộp bao).
// Chạy: node scripts/xe/kiem-tra-hitbox.js
const { mo, napXe, BaoCao } = require('./chung.js');
const DUNG_SAI = 0.1;      // cm (1 mm)

(async () => {
  const { browser, page } = await mo();
  await napXe(page);
  const kq = await page.evaluate((DUNG_SAI) => {
    const H = SRAHinhKhoi, V = H.V, Q = H.Q;
    const r = robot, bl = r.sraBanLap, kl = r.sraKhoiLuong, vl = r.sraVatLi;
    // Các vật thể của xe: nút gốc, khối (trong hệ trục riêng của vật thể: toạ độ khối − goc), vật thể Bullet
    const vat = [];
    vat.push({ ten: 'thân', nut: r.body, goc: kl.than.tam, khoi: bl.than.reduce((a, ct) => a.concat(ct.khoi), []), body: vl.than.physicsBody,
      chiTiet: bl.than.map((ct) => ({ ten: ct.ten, khoi: ct.khoi })) });
    bl.banh.forEach((b, i) => vat.push({ ten: b.ten.toLowerCase(), nut: vl.banh[i].imp.object, goc: [0, 0, 0], khoi: b.khoi, body: vl.banh[i].body }));
    if (vl.bi) vat.push({ ten: 'bi tự do', nut: vl.bi.object, goc: [0, 0, 0], khoi: [H.chuanHoa({ k: 'cau', d: bl.bi.d })], body: vl.bi.physicsBody });
    if (vl.canGat) vat.push({ ten: 'tấm cản', nut: vl.canGat.object, goc: kl.canGat.tam, khoi: bl.canGat.khoi, body: vl.canGat.physicsBody });

    const out = [];
    for (const v of vat) {
      const luoi = r.sraLuoi.filter((m) => m.parent == v.nut && !m.sraHitbox);
      // --- A ---
      let soDinh = 0, raNgoai = 0, noiRa = null, tamGiac = [];
      for (const m of luoi) {
        const p = m.getVerticesData(BABYLON.VertexBuffer.PositionKind), cs = m.getIndices();
        const dinh = [];
        for (let i = 0; i < p.length; i += 3) {
          const q = V.cong([p[i], p[i + 1], p[i + 2]], v.goc);
          dinh.push(q); soDinh++;
          const d = H.kcNhom(v.khoi, q);
          if (d > raNgoai) { raNgoai = d; noiRa = m.name + ' tại ' + JSON.stringify(q.map((x) => +x.toFixed(2))); }
        }
        for (let i = 0; i < cs.length; i += 3) tamGiac.push([dinh[cs[i]], dinh[cs[i + 1]], dinh[cs[i + 2]]]);
      }
      // --- B --- lưới ô để tìm tam giác gần một điểm
      const O = 0.5, LE = DUNG_SAI * 2, o = {};
      const khoa = (i, j, k) => i + ',' + j + ',' + k;
      for (const t of tamGiac) {
        const mn = [0, 1, 2].map((a) => Math.floor((Math.min(t[0][a], t[1][a], t[2][a]) - LE) / O));
        const mx = [0, 1, 2].map((a) => Math.floor((Math.max(t[0][a], t[1][a], t[2][a]) + LE) / O));
        for (let i = mn[0]; i <= mx[0]; i++) for (let j = mn[1]; j <= mx[1]; j++) for (let k = mn[2]; k <= mx[2]; k++) (o[khoa(i, j, k)] = o[khoa(i, j, k)] || []).push(t);
      }
      let soDiem = 0, xaLuoi = 0, noiXa = null;
      const vaCham = v.khoi.filter((k) => !k.trong);
      for (const k of vaCham) {
        const khac = v.khoi.filter((x) => x != k);
        for (const p of H.diemTrenMat(k, 0.25)) {
          if (khac.length && H.kcNhom(khac, p) < -0.02) continue;     // điểm chìm trong khối khác: không lộ ra ngoài
          soDiem++;
          const ds = o[khoa(Math.floor(p[0] / O), Math.floor(p[1] / O), Math.floor(p[2] / O))] || [];
          let d = LE;
          for (const t of ds) { d = Math.min(d, H.kcTamGiac(p, t[0], t[1], t[2])); if (d < 1e-3) break; }
          if (d > xaLuoi) { xaLuoi = d; noiXa = p.map((x) => +x.toFixed(2)); }
        }
      }
      out.push({ ten: v.ten, soKhoi: vaCham.length, soLuoi: luoi.length, soDinh, soTamGiac: tamGiac.length, raNgoai, noiRa, soDiem, xaLuoi, noiXa });
    }

    // --- C --- tia vào bộ vật lí
    const world = babylon.scene.getPhysicsEngine().getPhysicsPlugin().world;
    const tamXe = [r.body.position.x, r.body.position.y, r.body.position.z];
    const con = vat.map((v) => ({ v, ptr: Ammo.getPointer(v.body), n: 0, lech: 0, noi: null }));
    // số ngẫu nhiên có hạt giống (mulberry32) để mỗi lần chạy bắn cùng một bộ tia
    let seed = 12345;
    const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const banTia = (tu, toi) => {
      const a = new Ammo.btVector3(tu[0], tu[1], tu[2]), b = new Ammo.btVector3(toi[0], toi[1], toi[2]);
      const cb = new Ammo.ClosestRayResultCallback(a, b);
      world.rayTest(a, b, cb);
      let kq = null;
      if (cb.hasHit()) { const hp = cb.get_m_hitPointWorld(), n = cb.get_m_hitNormalWorld(); kq = { ptr: Ammo.getPointer(cb.get_m_collisionObject()), p: [hp.x(), hp.y(), hp.z()], n: [n.x(), n.y(), n.z()] }; }
      Ammo.destroy(a); Ammo.destroy(b); Ammo.destroy(cb);
      return kq;
    };
    let tiaSuot = 0;
    let trung = 0;
    for (let i = 0; i < 12000; i++) {
      const th = Math.acos(2 * rnd() - 1), ph = 2 * Math.PI * rnd();
      let tu = [30 * Math.sin(th) * Math.cos(ph), Math.abs(30 * Math.cos(th)) * 0.9 + 0.05, 30 * Math.sin(th) * Math.sin(ph)];
      tu = V.cong(tamXe, [tu[0], tu[1] - tamXe[1], tu[2]]);
      const dich = V.cong(tamXe, [(rnd() - 0.5) * 16, (rnd() - 0.5) * 9 + 1, (rnd() - 0.5) * 20 + 2]);
      const toi = V.cong(tu, V.nhan(V.tru(dich, tu), 2));
      const hit = banTia(tu, toi);
      const c = hit && con.find((x) => x.ptr == hit.ptr);
      if (!c) continue;
      const tf = c.v.body.getWorldTransform(), og = tf.getOrigin(), rq = tf.getRotation();
      const veVat = (p) => V.cong(Q.quay(Q.lienHop([rq.x(), rq.y(), rq.z(), rq.w()]), [p[0] - og.x(), p[1] - og.y(), p[2] - og.z()]), c.v.goc);
      const khoiVC = c.v.khoi.filter((k) => !k.trong);
      const d = Math.abs(H.kcNhom(khoiVC, veVat(hit.p)));
      if (d > DUNG_SAI) {
        // Phép bắn tia của Bullet đôi khi trả điểm sai khi tia sượt qua mép một khối. Hỏi lại bằng một tia
        // vuông góc với mặt tại điểm đó: nếu ở đó có mặt thật thì tia này phải trúng đúng điểm ấy.
        const lai = banTia(V.cong(hit.p, V.nhan(hit.n, 3)), V.tru(hit.p, V.nhan(hit.n, 3)));
        if (!lai || lai.ptr != hit.ptr || V.dai(V.tru(lai.p, hit.p)) > 0.05) { tiaSuot++; continue; }
      }
      c.n++; trung++;
      if (d > c.lech) { c.lech = d; c.noi = veVat(hit.p).map((x) => +x.toFixed(2)); }
    }
    return { vat: out, tia: con.map((c) => ({ ten: c.v.ten, n: c.n, lech: c.lech, noi: c.noi })), trung, tiaSuot,
      tongKhoi: vat.reduce((s, v) => s + v.khoi.filter((k) => !k.trong).length, 0) };
  }, DUNG_SAI);

  const bc = new BaoCao();
  console.log('Hitbox của xe lắp mô-đun: ' + kq.tongKhoi + ' khối va chạm, dung sai ' + DUNG_SAI * 10 + ' mm');
  console.log('A. Lưới vẽ nằm trong hitbox (đỉnh nhô ra ngoài nhiều nhất)');
  for (const v of kq.vat) bc.dong(v.raNgoai <= DUNG_SAI, v.ten, (v.raNgoai * 10).toFixed(2) + ' mm (' + v.soDinh + ' đỉnh, ' + v.soLuoi + ' lưới' + (v.raNgoai > DUNG_SAI || process.env.CHI_TIET ? ', ' + v.noiRa : '') + ')');
  console.log('B. Mặt hitbox có hình vẽ phủ lên (điểm trên mặt khối xa lưới vẽ nhất)');
  for (const v of kq.vat) bc.dong(v.xaLuoi <= DUNG_SAI, v.ten, (v.xaLuoi * 10).toFixed(2) + ' mm (' + v.soDiem + ' điểm trên ' + v.soKhoi + ' khối' + (v.xaLuoi > DUNG_SAI || process.env.CHI_TIET ? ', tại ' + JSON.stringify(v.noiXa) : '') + ')');
  console.log('C. Hình va chạm trong Bullet trùng với các khối (' + kq.trung + ' tia trúng xe' + (kq.tiaSuot ? ', bỏ ' + kq.tiaSuot + ' tia sượt mép mà Bullet trả điểm sai' : '') + ')');
  for (const t of kq.tia) bc.dong(t.n > 0 && t.lech <= DUNG_SAI, t.ten, t.n ? (t.lech * 10).toFixed(2) + ' mm lệch lớn nhất trên ' + t.n + ' tia' + (t.lech > DUNG_SAI || process.env.CHI_TIET ? ' tại ' + JSON.stringify(t.noi) : '') : 'không tia nào trúng');
  await browser.close();
  process.exit(bc.ket());
})();
