// Creative coding: เมืองลายเส้นแบบมังงะ วาดด้วยโค้ดล้วน ๆ
// เริ่มเป็นลายเส้นขาวดำบนกระดาษ แล้วสีชมพู มินต์ และสีของสาขาค่อย ๆ ลงตามคำตอบ
// #city = เมือง  #fx = ดวงไฟนำทาง + เศษสี
//
// ประสิทธิภาพ: พื้นกระดาษ แถบสี และตึกแต่ละชั้นวาดครั้งเดียวลง offscreen canvas แล้วนำมาแปะต่อเฟรม
// "สีที่กลับมา" คือความทึบของชั้นสี (ไม่มี filter ทั้งจอ) และวาดเมืองแค่ ~20 เฟรม/วินาที
const City = (() => {
  const cityCv = document.getElementById("city");
  const fxCv = document.getElementById("fx");
  const c = cityCv.getContext("2d");
  const f = fxCv.getContext("2d");
  const PALETTE = Object.values(MAJORS).map(m => m.color);
  const INK = "#15121c", PAPER = "#f4f2f7", PINK = "#ff3ea5", MINT = "#35e0b4";
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  let reduce = mq.matches;

  const CITY_FRAME_MS = 50;   // เมืองขยับช้า วาด ~20 fps พอ
  const REBAKE_MS = 900;      // หน้าต่างเปิดปิดทีละชั้นตึก
  const SAT_MS = 1400, SAT_MS_REDUCED = 250;
  const PAINT_MS = 700;

  let W = 0, H = 0, dpr = 1, paper, wash, layers = [], particles = [];
  let t = 0, raf = 0, lastCity = -1e9, lastBake = 0, bakeIdx = 0;
  const sat = { now: 0, from: 0, to: 0, start: 0, moving: false };
  const orb = { x: 0, y: 0 };
  const cam = { z: 1, x: 0.5, tz: 1, tx: 0.5, moving: false };
  let painted = [];   // { idx: ตึกในแถวหลังที่สูงสุด, color, at }
  let dirty = false;  // มีอะไรเปลี่ยนที่ต้องวาดใหม่ (ใช้ตอนลดการเคลื่อนไหว)

  // seeded random ให้หน้าตาเมืองเหมือนเดิมทุกครั้ง
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function offscreen(w, h) {
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
    cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    return cv;
  }

  // ชั้นตึก: li 0 = แถวหลัง สูง เส้นจาง / li 2 = แถวหน้า เตี้ย เส้นหมึกเข้ม
  const FACE = ["#ffffff", "#f1eff5", "#e6e3ec"];
  const STROKE = ["#6b6680", "#37324a", INK];
  const WIN_OFF = ["#dcd8e4", "#cdc8d7", "#bdb8c9"];
  const WIN_ON = ["#a39db3", "#7f7992", "#514b63"];

  function build() {
    seed = 7;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    for (const cv of [cityCv, fxCv]) {
      cv.width = W * dpr; cv.height = H * dpr;
      cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // กระดาษ + วงแหวนกลางฟ้า + เครื่องหมายกากบาทแบบแผ่นพิมพ์ (นิ่ง)
    paper = offscreen(W, H);
    const s = paper.getContext("2d");
    const g = s.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f8f6fb"); g.addColorStop(1, "#ebe8f0");
    s.fillStyle = g; s.fillRect(0, 0, W, H);
    const rx = W * 0.76, ry = H * 0.2, rr = Math.min(W, H) * 0.13;
    s.strokeStyle = "#a9a4b8"; s.lineWidth = 6;
    s.beginPath(); s.ellipse(rx, ry, rr, rr * 0.62, -0.25, 0, 6.28); s.stroke();
    s.strokeStyle = INK; s.lineWidth = 1.2;
    s.beginPath(); s.ellipse(rx, ry, rr + 5, rr * 0.62 + 4, -0.25, 0, 6.28); s.stroke();
    s.beginPath(); s.ellipse(rx, ry, rr - 5, rr * 0.62 - 4, -0.25, 0, 6.28); s.stroke();
    s.strokeStyle = "rgba(21,18,28,.45)"; s.lineWidth = 1;
    const marks = Math.round(W * H / 42000);
    for (let i = 0; i < marks; i++) {
      const x = Math.round(rnd() * W) + 0.5, y = Math.round(rnd() * H * 0.62) + 0.5, r = 4 + rnd() * 5;
      s.beginPath(); s.moveTo(x - r, y); s.lineTo(x + r, y); s.moveTo(x, y - r); s.lineTo(x, y + r); s.stroke();
    }

    // แถบสีชมพูกับมินต์ + จุดฮาล์ฟโทน: โผล่ตามสีที่กลับมา
    wash = offscreen(W, H);
    const w = wash.getContext("2d");
    w.fillStyle = PINK;
    w.beginPath(); w.moveTo(W * 0.42, 0); w.lineTo(W, 0); w.lineTo(W, H * 0.34); w.lineTo(W * 0.7, H * 0.2); w.lineTo(W * 0.9, H * 0.12); w.closePath(); w.fill();
    w.fillStyle = MINT;
    w.beginPath(); w.moveTo(0, H * 0.1); w.lineTo(W * 0.3, H * 0.22); w.lineTo(W * 0.12, H * 0.3); w.lineTo(W * 0.38, H * 0.46); w.lineTo(0, H * 0.5); w.closePath(); w.fill();
    w.fillStyle = PINK;
    for (let y = 0; y < H * 0.34; y += 9)
      for (let x = W * 0.34; x < W * 0.62; x += 9) {
        const k = (x - W * 0.34) / (W * 0.28) - y / (H * 0.5);
        if (k > 0.05) { w.beginPath(); w.arc(x + (y / 9 % 2) * 4.5, y, Math.min(3.4, k * 4.2), 0, 6.28); w.fill(); }
      }

    layers = [0.42, 0.3, 0.18].map((hFrac, li) => {
      const blds = [];
      let x = -20;
      while (x < W + 20) {
        const bw = 30 + rnd() * (70 - li * 12);
        const h = H * (hFrac * (0.45 + rnd() * 0.75));
        const hue = PALETTE[Math.floor(rnd() * PALETTE.length)];
        const wins = [];
        for (let wy = 12; wy < h - 12; wy += 14)
          for (let wx = 7; wx < bw - 9; wx += 11)
            if (rnd() < 0.55) wins.push({ x: wx, y: wy, on: rnd() < 0.5 });
        blds.push({ x, w: bw, h, hue, wins, roof: rnd() < 0.25 ? Math.floor(rnd() * 3) : -1 });
        x += bw + rnd() * 6;
      }
      const L = { blds, li, line: offscreen(W + 40, H), color: offscreen(W + 40, H) };
      bake(L, false);
      return L;
    });
    orb.x = W * 0.5; orb.y = H * 0.22;
  }

  // วาดตึกหนึ่งชั้น: line = ลายเส้นขาวดำ, color = หน้าต่างและคิ้วหลังคาสี (ซ้อนตามสีที่กลับมา)
  // flicker = สุ่มสลับไฟบางบานให้เมืองดูมีชีวิต
  function bake(L, flicker) {
    const x = L.line.getContext("2d"), k = L.color.getContext("2d"), li = L.li;
    x.clearRect(0, 0, W + 40, H); k.clearRect(0, 0, W + 40, H);
    x.lineWidth = [1.5, 1.8, 2.2][li]; x.strokeStyle = STROKE[li]; x.lineJoin = "miter";
    for (const b of L.blds) {
      const bx = Math.round(b.x + 20) + 0.5, by = Math.round(H - b.h) + 0.5;
      x.fillStyle = FACE[li];
      x.beginPath();
      if (b.roof === 1) { x.moveTo(bx, H + 4); x.lineTo(bx, by); x.lineTo(bx + b.w / 2, by - 14); x.lineTo(bx + b.w, by); x.lineTo(bx + b.w, H + 4); }
      else x.rect(bx, by, b.w, b.h + 4);
      x.fill(); x.stroke();
      if (b.roof === 0) { x.beginPath(); x.moveTo(bx + b.w / 2, by); x.lineTo(bx + b.w / 2, by - 20); x.stroke(); }
      // เงาแรเงาแบบมังงะที่ขอบขวา
      if (li > 0) { x.fillStyle = "rgba(21,18,28,.07)"; x.fillRect(bx + b.w * 0.72, by + 1, b.w * 0.28 - 1, b.h); }
      k.fillStyle = b.hue;
      k.fillRect(bx, by, b.w, 4);
      for (const wn of b.wins) {
        const on = flicker && Math.random() < 0.04 ? !wn.on : wn.on;
        x.fillStyle = on ? WIN_ON[li] : WIN_OFF[li];
        x.fillRect(bx + wn.x, by + wn.y, 5, 7);
        if (on) k.fillRect(bx + wn.x, by + wn.y, 5, 7);
      }
    }
  }

  const swayOf = li => reduce ? 0 : Math.sin(t * 0.0002 + li) * (li + 1) * 1.5;
  // กล้อง: ซูมโดยยึดขอบล่างที่ตำแหน่ง x ของจุดสนใจ (พื้นกระดาษไม่ขยับ)
  function applyCam() {
    const ax = W * cam.x;
    c.translate(ax, H); c.scale(cam.z, cam.z); c.translate(-ax, -H);
  }

  function drawPainted() {
    if (!painted.length) return;
    const L = layers[0], sway = swayOf(0), now = performance.now();
    for (const p of painted) {
      const b = L.blds[p.idx];
      if (!b) continue;
      const k = reduce ? 1 : Math.min(1, (now - p.at) / PAINT_MS);
      const bx = Math.round(b.x + sway) + 0.5, by = Math.round(H - b.h) + 0.5;
      // สีไหลขึ้นจากฐานตึก
      const hh = (b.h + 4) * (1 - Math.pow(1 - k, 3));
      c.fillStyle = p.color;
      c.fillRect(bx, H + 4 - hh, b.w, hh);
      c.strokeStyle = INK; c.lineWidth = 2;
      c.strokeRect(bx, by, b.w, b.h + 4);
      c.fillStyle = "#ffffff";
      for (const w of b.wins) if (H + 4 - hh <= by + w.y) c.fillRect(bx + w.x, by + w.y, 5, 7);
    }
  }

  function drawCity() {
    c.drawImage(paper, 0, 0, W, H);
    if (sat.now > 0.01) {
      // แถบสีเลื่อนเข้ามาจากนอกจอเล็กน้อยขณะที่ชัดขึ้น
      c.globalAlpha = sat.now;
      c.drawImage(wash, 0, (1 - sat.now) * -30, W, H);
      c.globalAlpha = 1;
    }

    c.save();
    applyCam();
    for (let li = 0; li < 3; li++) {
      const dx = -20 + swayOf(li);
      c.drawImage(layers[li].line, dx, 0, W + 40, H);
      if (sat.now > 0.01) { c.globalAlpha = sat.now; c.drawImage(layers[li].color, dx, 0, W + 40, H); c.globalAlpha = 1; }
      // ตึกที่ผู้เล่นทาสีด้วยคำตอบอยู่แถวหลังที่สูงสุด สีเต็มเสมอ แม้เมืองยังเป็นลายเส้น
      if (li === 0) drawPainted();
    }
    c.restore();

    const fog = c.createLinearGradient(0, H * 0.84, 0, H);
    fog.addColorStop(0, "rgba(244,242,247,0)"); fog.addColorStop(1, "rgba(244,242,247,.55)");
    c.fillStyle = fog; c.fillRect(0, H * 0.84, W, H * 0.16);
  }

  function drawFx() {
    f.clearRect(0, 0, W, H);
    if (!reduce) {
      const tx = W * (0.5 + 0.32 * Math.sin(t * 0.00023));
      const ty = H * (0.22 + 0.06 * Math.sin(t * 0.00051));
      orb.x += (tx - orb.x) * 0.03;
      orb.y += (ty - orb.y) * 0.03;
    }
    // ดวงไฟนำทาง: แกนสว่าง แสงส้มอุ่น และวงหมึกบาง ๆ ให้อ่านออกบนกระดาษ
    const pulse = reduce ? 1 : 1 + 0.12 * Math.sin(t * 0.004);
    const g = f.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 44 * pulse);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.22, "rgba(255,196,92,.95)");
    g.addColorStop(0.55, "rgba(255,150,60,.35)");
    g.addColorStop(1, "rgba(255,150,60,0)");
    f.fillStyle = g;
    f.beginPath(); f.arc(orb.x, orb.y, 44 * pulse, 0, 6.28); f.fill();
    f.strokeStyle = INK; f.lineWidth = 1.5;
    f.beginPath(); f.arc(orb.x, orb.y, 13, 0, 6.28); f.stroke();
    f.fillStyle = INK;
    for (let i = 0; i < 3; i++) {
      const a = (reduce ? 0 : t * 0.002) + i * 2.09;
      f.fillRect(orb.x + Math.cos(a) * 24 - 1.5, orb.y + Math.sin(a) * 24 - 1.5, 3, 3);
    }

    // เศษสีเป็นสี่เหลี่ยมเล็ก ๆ
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.vy += 0.04; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.life -= 1;
      f.globalAlpha = Math.max(0, p.life / p.max);
      f.fillStyle = p.color;
      f.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    f.globalAlpha = 1;
  }

  function stepSat(now) {
    if (!sat.moving) return;
    // timestamp ของ rAF อาจเก่ากว่าเวลาเริ่มเล็กน้อย จึงกันค่าติดลบ
    const k = Math.min(1, Math.max(0, (now - sat.start) / (reduce ? SAT_MS_REDUCED : SAT_MS)));
    const e = 1 - Math.pow(1 - k, 3);
    sat.now = sat.from + (sat.to - sat.from) * e;
    if (k >= 1) sat.moving = false;
  }

  function stepCam() {
    if (reduce) { cam.z = cam.tz; cam.x = cam.tx; cam.moving = false; return; }
    cam.z += (cam.tz - cam.z) * 0.045;
    cam.x += (cam.tx - cam.x) * 0.045;
    cam.moving = Math.abs(cam.tz - cam.z) > 0.0005 || Math.abs(cam.tx - cam.x) > 0.0005;
  }

  function frame(now) {
    raf = 0;
    t = now;
    const satWasMoving = sat.moving;
    stepSat(now);
    stepCam();
    const painting = !reduce && painted.some(p => performance.now() - p.at < PAINT_MS);
    if (!reduce && now - lastBake > REBAKE_MS) {
      bake(layers[bakeIdx++ % 3], true);
      lastBake = now;
    }
    // ช่วงกล้องเคลื่อนหรือกำลังทาสี วาดทุกเฟรมให้ลื่น นอกนั้น ~20 fps
    if (satWasMoving || cam.moving || painting || dirty || reduce || now - lastCity >= CITY_FRAME_MS) {
      drawCity();
      lastCity = now;
      dirty = false;
    }
    drawFx();
    schedule();
  }

  // ลดการเคลื่อนไหว: วาดเฉพาะตอนมีอะไรเปลี่ยน แล้วหยุด
  function schedule() {
    if (raf) return;
    if (!reduce || sat.moving || dirty || particles.length) raf = requestAnimationFrame(frame);
  }

  // ทาสีตึกแถวสูงหนึ่งหลังด้วยสีของคำตอบ คืนค่าตำแหน่ง x (0..1) ให้กล้องเล็ง
  // เมื่อทาครบแล้วจะทาทับหลังเดิม เมืองจึงค่อย ๆ เป็นสีของผู้เล่น
  function paint(color) {
    const L = layers[0];
    const inView = L.blds.map((b, i) => i).filter(i => L.blds[i].x > W * 0.06 && L.blds[i].x + L.blds[i].w < W * 0.94);
    const used = new Set(painted.map(p => p.idx));
    const fresh = inView.filter(i => !used.has(i));
    // เลือกตึกที่สูงพอจะโผล่พ้นแถวหน้าก่อน สีจะได้เห็นชัด
    const tall = fresh.filter(i => L.blds[i].h > H * 0.3);
    const pool = tall.length ? tall : fresh.length ? fresh : inView;
    if (!pool.length) return 0.5;
    const idx = pool[Math.floor(Math.random() * pool.length)];
    painted = painted.filter(p => p.idx !== idx).concat([{ idx, color, at: performance.now() }]);
    dirty = true; schedule();
    const b = L.blds[idx];
    return (b.x + b.w / 2) / W;
  }

  function focus(x = 0.5, z = 1) {
    cam.tx = Math.min(0.9, Math.max(0.1, x)); cam.tz = z;
    dirty = true; schedule();
  }

  function clearPaint() { painted = []; focus(0.5, 1); }

  function burst(x, y, color, n = 36) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, s = 1.5 + Math.random() * 4;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
        r: 1.5 + Math.random() * 3, color: color || PALETTE[i % 5],
        life: 60 + Math.random() * 40, max: 100,
      });
    }
    schedule();
  }

  function celebrate(colors) {
    if (reduce) return;
    const cols = colors && colors.length ? colors : PALETTE;
    let k = 0;
    const id = setInterval(() => {
      burst(W * (0.15 + Math.random() * 0.7), H * (0.15 + Math.random() * 0.35), cols[k % cols.length], 50);
      if (++k > 9) clearInterval(id);
    }, 180);
  }

  // p: 0..1 = สีของเมืองที่กลับมา (ค่อย ๆ ไล่ไปหาค่าใหม่)
  function setProgress(p) {
    const to = Math.min(1, Math.max(0, p));
    if (to === sat.to && !sat.moving) return;
    sat.from = sat.now; sat.to = to; sat.start = performance.now(); sat.moving = true;
    schedule();
  }

  function redrawStill() { drawCity(); drawFx(); }

  // แถบที่อยู่บนมือถือหดขยายบ่อย: สร้างเมืองใหม่เฉพาะตอนความกว้างเปลี่ยนหรือความสูงเปลี่ยนมาก
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (innerWidth === W && Math.abs(innerHeight - H) / H < 0.25) return;
      build(); redrawStill();
    }, 150);
  });

  mq.addEventListener("change", () => {
    reduce = mq.matches;
    if (reduce) { particles = []; redrawStill(); }
    schedule();
  });

  build();
  redrawStill();
  schedule();
  return { burst, celebrate, setProgress, paint, focus, clearPaint };
})();
