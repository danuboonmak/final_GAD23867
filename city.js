// Creative coding: เมืองลายเส้นแบบมังงะ วาดด้วย p5.js (instance mode)
// เริ่มเป็นลายเส้นขาวดำบนกระดาษ แล้วสีชมพู มินต์ และสีของสาขาค่อย ๆ ลงตามคำตอบ
// #city = เมือง (แคนวาสของ p5)  #fx = ดวงไฟนำทาง (ตัวไกด์) + ฝน + เศษสี
//
// ฉาก (หลังไปหน้า): กระดาษ + ไม้บรรทัด + วงแหวนลอยฟ้าที่หมุน → พู่กันสีชมพูมินต์ → เมฆลายเส้นลอย → ฝูงนก
//   → แถวหลัง: หอคอยทะลุวงแหวน เครน ตึกยอดแหลม/ขั้นบันได/เสาอากาศ/ถังน้ำ (ตึกที่ผู้เล่นทาสี)
//   → แถวกลาง: ตึกติดป้ายโฆษณา + รางโมโนเรลยกระดับ และรถไฟที่วิ่งผ่าน
//   → แถวหน้า: ร้านกันสาดลาย เสาไฟกับธงงานเทศกาล แมวบนหลังคา ต้นซากุระสองข้าง + กลีบที่ปลิว
// ช่วงต้นเมืองหม่นแบบมังงะ: สกรีนโทนเม็ดเทาทับฟ้า + ฝนเส้นหมึก
// แสงของตัวไกด์ดันความหม่นออกเป็นวงรอบตัว และในวงนั้นเผยสีจริงของเมืองให้เห็นก่อน
//
// ประสิทธิภาพ: ส่วนที่นิ่งวาดครั้งเดียวลง offscreen canvas แล้วแปะต่อเฟรม
// ส่วนที่ขยับ (รถไฟ เมฆ นก กลีบดอก วงแหวน) วาดด้วย p5 ราว 30 fps; "สีที่กลับมา" คือความทึบของชั้นสี
const City = (() => {
  const NOOP = { burst() {}, celebrate() {}, setProgress() {}, paint() { return 0.5; }, focus() {}, clearPaint() {}, follow() {}, attend() {}, say() {}, hush() {}, poke() {} };
  // โหลด p5 ไม่ได้ (เช่น ออฟไลน์) ควิซยังเล่นได้ แค่ไม่มีเมือง
  if (typeof p5 === "undefined") return NOOP;

  const oldCv = document.getElementById("city");
  const fxCv = document.getElementById("fx");
  const f = fxCv.getContext("2d");
  const PALETTE = Object.values(MAJORS).map(m => m.color);
  const INK = "#15121c", PAPER = "#f4f2f7", PINK = "#ff3ea5", MINT = "#35e0b4";
  const sfx = (name, arg) => { if (typeof Sfx !== "undefined") Sfx.play(name, arg); };
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  let reduce = mq.matches;

  const SAT_MS = 1400, SAT_MS_REDUCED = 250;
  const PAINT_MS = 700;
  const COMET_MS = 480;       // หยดสีบินจากแถวคำตอบไปถึงยอดตึก
  const STILL_T = 5200;       // เวลาที่ใช้วาดฉากนิ่งตอนลดการเคลื่อนไหว (รถไฟอยู่กลางจอพอดี)

  let P = null, c = null, ready = false, looping = true, odd = false;
  let W = 0, H = 0, dpr = 1, paper, wash, gloom, gloomFrame, peek, layers = [], particles = [], rain = [];
  let petals = [], trees = [], clouds = [], flock = [], ring = { rx: 0, ry: 0, rr: 0 };
  let gloomCss = -1, monoCss = -1, fogGrad = null;

  // ผสมสี rgb แบบเดียวกับ lerpColor แต่ไม่ต้องสร้างอ็อบเจกต์สีของ p5 ทุกเฟรม
  const mix = (a, b, k) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;

  // แปะเฉพาะสี่เหลี่ยม (หน่วยพิกเซลจริง) จาก offscreen canvas ที่ขนาดเท่าจอ
  function blit(ctx, src, X0, Y0, X1, Y1) {
    ctx.drawImage(src, X0, Y0, X1 - X0, Y1 - Y0, X0 / dpr, Y0 / dpr, (X1 - X0) / dpr, (Y1 - Y0) / dpr);
  }

  // ตัวไกด์: ดาวเคราะห์น้อยเรืองแสง (ถ้ารูปโหลดไม่ได้ จะกลับไปวาดดวงไฟแบบเดิม)
  const guide = new Image();
  guide.decoding = "async";
  guide.onload = () => { dirty = true; schedule(); };
  guide.src = "assets/guide.webp";
  const guideReady = () => guide.complete && guide.naturalWidth > 0;
  let comets = [];
  let rings = [];
  const RING_MS = 620;
  let cheer = null;   // { idx, start, until }
  let spinAt = -1e9;
  const SPIN_MS = 1000;
  let t = 0;
  const sat = { now: 0, from: 0, to: 0, start: 0, moving: false };
  const orb = { x: 0, y: 0, vx: 0, gy: 0 };
  // หางแสงของไกด์: ตำแหน่งย้อนหลังไม่กี่เฟรม
  const trail = [];
  const TRAIL_N = 16;
  // โหมดตามเมาส์ (หน้าแรก): สปริงไล่ตามเคอร์เซอร์
  let following = false;
  const mouse = { x: 0, y: 0, on: false };
  let guideFacing = 1;
  let blinkAt = null;
  const spring = { vx: 0, vy: 0, t: 0 };   // ความเร็วเป็น px/วินาที
  const SPRING = { k: 50, c: 3, m: 1 };    // stiffness, damping, mass ตามตัวอย่างของ Motion
  addEventListener("pointermove", e => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
    const dx = mouse.x - orb.x;
    if (reduce && Math.abs(dx) > 8 && -Math.sign(dx) !== guideFacing) schedule();
  }, { passive: true });
  document.addEventListener("pointerout", e => { if (!e.relatedTarget) mouse.on = false; });
  addEventListener("blur", () => { mouse.on = false; });
  // ไกด์มองตามสิ่งที่ผู้เล่นกำลังชี้ (ตัวเลือก ปุ่ม) ไปลอยข้างการ์ด ถ้าจอแคบไม่มีที่ข้างการ์ดก็ลอยตามปกติ
  let attendEl = null;
  // แตะ/คลิกที่ไกด์: หมุน เด้ง สีกระจาย แล้วพูด
  let bounceAt = -1e9, pokeAt = -1e9;
  const POKE_LINES = [
    "จั๊กจี้นะ!", "ฉันจะส่องทางให้เธอเอง", "เลือกตามใจเธอเลย ไม่มีข้อไหนผิด",
    "เมืองยังรอเธออยู่นะ", "ฮึบ! พลังสีเต็มเปี่ยม", "อีกนิดเดียว สีจะกลับมาทั้งเมือง",
  ];
  let pokeN = Math.floor(Math.random() * POKE_LINES.length);
  // ลูกโป่งคำพูดของไกด์ (ตกแต่งเท่านั้น ข้อความสำคัญอยู่ในการ์ดเสมอ)
  const bubble = document.createElement("div");
  bubble.className = "guide-say";
  bubble.setAttribute("aria-hidden", "true");
  document.body.append(bubble);
  let sayUntil = 0, sayTimer = 0, bubbleW = 0, bubbleH = 0;
  const guideW = () => Math.min(150, Math.max(92, W * 0.15)) * (1 + 0.28 * gloomAmt());
  guide.className = "city-guide";
  guide.alt = "";
  guide.draggable = false;
  document.body.append(guide);

  function keepGuideVisible(radius, bob) {
    orb.y = Math.max(radius, Math.min(H - radius, orb.y + bob)) - bob;
    orb.x = Math.max(radius, Math.min(W - radius, orb.x));
  }
  const clearR = () => guideW() * 1.9;
  const cam = { z: 1, x: 0.5, tz: 1, tx: 0.5, moving: false };
  let painted = [];   // { idx: ตึกในแถวหลัง, color, at }
  let dirty = false;

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
  const LW = [1.3, 1.7, 2.1];
  const WIN_OFF = ["#dcd8e4", "#cdc8d7", "#bdb8c9"];
  const WIN_ON = ["#a39db3", "#7f7992", "#514b63"];
  const WIN = [
    { sx: 3, sy: 6, dx: 16, dy: 22, p: 0.32 },
    { sx: 5, sy: 7, dx: 18, dy: 22, p: 0.42 },
    { sx: 7, sy: 9, dx: 19, dy: 24, p: 0.45 },
  ];

  // รางโมโนเรล: เอียงขึ้นทางขวาเล็กน้อย ให้ฉากมีมิติ (x เป็นพิกัดจอ)
  const railY = x => H * 0.69 - (x / W) * H * 0.06;
  const railBeam = () => Math.max(8, Math.min(13, H * 0.012));

  // ---------- โครงตึก ----------
  function bodyPath(ctx, b, bx, by) {
    const r = bx + b.w, g = H + 4;
    ctx.beginPath();
    ctx.moveTo(bx, g);
    if (b.top === "setback") {
      ctx.lineTo(bx, by + b.sb); ctx.lineTo(bx + b.inset, by + b.sb); ctx.lineTo(bx + b.inset, by);
      ctx.lineTo(r - b.inset, by); ctx.lineTo(r - b.inset, by + b.sb); ctx.lineTo(r, by + b.sb);
    } else if (b.top === "spire") {
      ctx.lineTo(bx, by); ctx.lineTo(bx + b.w / 2, by - b.tip); ctx.lineTo(r, by);
    } else if (b.top === "slant") {
      ctx.lineTo(bx, by + b.tip); ctx.lineTo(r, by);
    } else {
      ctx.lineTo(bx, by); ctx.lineTo(r, by);
    }
    ctx.lineTo(r, g);
    ctx.closePath();
  }

  function makeBuilding(li, x, hFrac) {
    const bw = li === 2 ? 40 + rnd() * 52 : 30 + rnd() * (70 - li * 12);
    const h = H * (hFrac * (0.45 + rnd() * 0.75));
    const hue = PALETTE[Math.floor(rnd() * PALETTE.length)];
    const r = rnd();
    const top = li === 2
      ? (r < 0.68 ? "flat" : r < 0.86 ? "slant" : "tank")
      : (r < 0.2 ? "antenna" : r < 0.36 ? "spire" : r < 0.56 ? "setback" : r < 0.7 ? "tank" : r < 0.8 ? "slant" : "flat");
    const b = {
      x, w: bw, h, hue, top,
      sb: top === "setback" ? 14 + rnd() * Math.min(36, h * 0.14) : 0,
      inset: top === "setback" ? bw * (0.14 + rnd() * 0.12) : 0,
      tip: top === "spire" ? Math.min(48, bw * 0.95) : top === "slant" ? 8 + rnd() * 12 : 0,
      ant: 14 + rnd() * 28, antX: 0.25 + rnd() * 0.5,
      wins: [], bill: null, awn: false,
    };
    if (li === 1 && bw > 44 && rnd() < 0.24) {
      const roof = rnd() < 0.5, bbw = Math.min(bw * 0.86, 66);
      b.bill = { roof, bw: bbw, bh: bbw * 0.58, kind: Math.floor(rnd() * 3), col: rnd() < 0.5 ? PINK : MINT };
      if (roof) { b.top = "flat"; b.tip = 0; b.sb = 0; b.inset = 0; }
    }
    if (li === 2 && rnd() < 0.62) b.awn = true;
    const ws = WIN[li];
    const y0 = (b.top === "setback" ? b.sb : b.top === "slant" ? b.tip : 0) + 9;
    const yEnd = h - (li === 2 ? 42 : 12);
    for (let wy = y0; wy < yEnd; wy += ws.dy)
      for (let wx = 6; wx < bw - ws.sx - 5; wx += ws.dx)
        if (rnd() < ws.p) b.wins.push({ x: wx, y: wy, on: rnd() < 0.5 });
    return b;
  }

  function build() {
    seed = 7;
    // จอ retina dpr 2 = พิกเซลมากกว่า 1.5 ถึง ~1.8 เท่า ทุกชั้นวาดเต็มจอ เพดาน 1.5 ยังคมพอสำหรับลายเส้น
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    P.pixelDensity(dpr);
    P.resizeCanvas(W, H, true);
    c = P.drawingContext;
    fxCv.width = W * dpr; fxCv.height = H * dpr;
    f.setTransform(dpr, 0, 0, dpr, 0, 0);

    ring = { rx: W * 0.76, ry: H * 0.2, rr: Math.min(W, H) * 0.13 };
    buildPaper();
    buildWash();

    layers = [0.42, 0.3, 0.18].map((hFrac, li) => {
      const blds = [];
      let x = -20;
      while (x < W + 20) {
        const b = makeBuilding(li, x, hFrac);
        blds.push(b);
        x += b.w + rnd() * (li === 2 ? 3 : 6);
      }
      const L = { blds, li, line: offscreen(W + 40, H), color: offscreen(W + 40, H) };
      bake(L);
      return L;
    });

    buildGloom();

    rain = Array.from({ length: Math.min(36, Math.round(W * H / 24000)) }, () => ({
      x: rnd() * (W + 80), y: rnd() * H, len: 18 + rnd() * 30, v: 7 + rnd() * 6, heavy: rnd() < 0.18,
    }));

    const cr = Math.min(W, H);
    clouds = [
      { x: W * 0.02, y: H * 0.19, s: 0.84, v: 0.004 },
      { x: W * 0.45, y: H * 0.12, s: 0.58, v: 0.003 },
      { x: W * 0.83, y: H * 0.34, s: 0.75, v: 0.005 },
      { x: W * 0.18, y: H * 0.42, s: 0.52, v: 0.0035 },
    ].map(cl => {
      const base = cr * 0.055 * cl.s;
      const bumps = [];
      let bx = 0;
      for (let i = 0; i < 6; i++) {
        const r = base * (0.55 + Math.sin(i / 5 * Math.PI) * 0.75 + rnd() * 0.25);
        bumps.push({ dx: bx, r });
        bx += r * 0.95;
      }
      return cloudSprite({ ...cl, bumps, span: bx });
    });

    fogGrad = c.createLinearGradient(0, H * 0.84, 0, H);
    fogGrad.addColorStop(0, "rgba(244,242,247,0)"); fogGrad.addColorStop(1, "rgba(244,242,247,.55)");

    flock = Array.from({ length: 3 }, (_, i) => ({
      dx: i * 17 + rnd() * 8, dy: (i % 2 ? -1 : 1) * (4 + i * 3) + rnd() * 6, s: 1 - i * 0.07, ph: rnd() * 6.28,
    }));

    petals = Array.from({ length: Math.max(5, Math.min(16, Math.round(W * H / 48000))) }, () => spawnPetal({}, true));

    orb.x = W * 0.5; orb.y = orb.gy = H * 0.22;
  }

  // ---------- กระดาษ วงแหวน ไม้บรรทัด เครื่องหมายแผ่นพิมพ์ (นิ่ง) ----------
  function buildPaper() {
    paper = offscreen(W, H);
    const sky = paper.getContext("2d");
    const gradient = sky.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#dedeea");
    gradient.addColorStop(0.47, "#f8f4ef");
    gradient.addColorStop(0.72, "#efe4dc");
    gradient.addColorStop(1, "#d3cedd");
    sky.fillStyle = gradient;
    sky.fillRect(0, 0, W, H);

    const { rx, ry, rr } = ring;
    sky.fillStyle = "#fffbf2";
    sky.beginPath();
    sky.arc(rx, ry, rr * 0.82, 0, Math.PI * 2);
    sky.fill();
    sky.strokeStyle = "rgba(77,72,89,.36)";
    sky.lineWidth = 1.5;
    sky.beginPath();
    sky.ellipse(rx, ry, rr * 1.2, rr * 0.46, -0.25, 0, Math.PI * 2);
    sky.stroke();

    paintSkySplashes(sky, "#b9c4c2", "#c9bfc5");
  }

  function paintSkySplashes(sky, leftColor, rightColor) {
    const scale = Math.min(W * 0.003, H * 0.002);
    skySplash(sky, W * 0.045, H * 0.30, scale, -0.42, leftColor);
    skySplash(sky, W * 0.955, H * 0.10, scale * 0.82, 2.85, rightColor);
  }

  function skySplash(sky, x, y, scale, angle, color) {
    sky.save();
    sky.translate(x, y);
    sky.rotate(angle);
    sky.scale(scale, scale);
    sky.fillStyle = color;
    sky.globalAlpha = 0.64;
    sky.beginPath();
    sky.moveTo(-52, 4);
    sky.bezierCurveTo(-61, -10, -37, -24, -23, -18);
    sky.bezierCurveTo(-15, -14, -16, -34, -9, -31);
    sky.bezierCurveTo(-5, -29, -12, -13, 1, -14);
    sky.bezierCurveTo(16, -15, 38, -25, 41, -22);
    sky.bezierCurveTo(45, -18, 19, -10, 23, -6);
    sky.bezierCurveTo(28, -2, 53, -7, 54, -3);
    sky.bezierCurveTo(55, 2, 16, 1, 12, 12);
    sky.bezierCurveTo(7, 28, -2, 16, -14, 20);
    sky.bezierCurveTo(-32, 27, -46, 20, -52, 4);
    sky.fill();
    for (const [dx, dy, r] of [[50, -26, 2.7], [65, -28, 1.5], [68, -4, 3.2], [24, 12, 2], [-16, -40, 2.1]]) {
      sky.beginPath();
      sky.ellipse(dx, dy, r * 1.5, r, -0.18, 0, Math.PI * 2);
      sky.fill();
    }
    sky.restore();
  }

  function buildWash() {
    wash = offscreen(W, H);
    const w = wash.getContext("2d");
    w.save();
    w.scale(W, H * 0.76);
    for (const [x, y, tint] of [[0.06, 0.26, "123,218,199"], [0.91, 0.1, "244,170,198"]]) {
      const glow = w.createRadialGradient(x, y, 0, x, y, 0.78);
      glow.addColorStop(0, `rgba(${tint},.72)`);
      glow.addColorStop(0.52, `rgba(${tint},.32)`);
      glow.addColorStop(1, `rgba(${tint},0)`);
      w.fillStyle = glow;
      w.fillRect(0, 0, 1, 1.32);
    }
    w.restore();
    paintSkySplashes(w, MINT, PINK);
  }

  function buildGloom() {
    gloom = offscreen(W, H);
    gloomFrame = offscreen(W, H);
    peek = offscreen(W, H);
    const m = gloom.getContext("2d");
    const mg = m.createLinearGradient(0, 0, 0, H);
    mg.addColorStop(0, "rgb(186,189,204)");
    mg.addColorStop(0.55, "rgb(181,183,198)");
    mg.addColorStop(1, "rgb(153,157,177)");
    m.fillStyle = mg; m.fillRect(0, 0, W, H);
    const vg = m.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.22, W / 2, H * 0.42, Math.hypot(W, H) * 0.6);
    vg.addColorStop(0, "rgba(255,255,255,0)");
    vg.addColorStop(1, "rgba(52,56,76,.32)");
    m.fillStyle = vg; m.fillRect(0, 0, W, H);
  }

  // ---------- ของประกอบฉาก (อบลงชั้นตึก) ----------
  // หอคอยโครงเหล็กใต้วงแหวน: ยอดเสาทะลุกลางวง
  function tower(x, k) {
    const cx = ring.rx + 20, top = H * 0.15, base = H + 4;
    const half = y => (3 + (y - top) / (base - top) * 18);
    x.save();
    x.lineWidth = 1.3; x.strokeStyle = STROKE[0]; x.fillStyle = FACE[0];
    x.beginPath(); x.moveTo(cx - half(base), base); x.lineTo(cx - 3, top); x.lineTo(cx + 3, top); x.lineTo(cx + half(base), base); x.closePath();
    x.fill(); x.stroke();
    x.strokeStyle = "rgba(107,102,128,.6)"; x.lineWidth = 1;
    x.beginPath();
    for (let y = top + 8; y < base; y += 11) {
      const a = half(y), b = half(y + 11);
      x.moveTo(cx - a, y); x.lineTo(cx + b, y + 11); x.moveTo(cx + a, y); x.lineTo(cx - b, y + 11);
    }
    x.stroke();
    x.strokeStyle = STROKE[0]; x.lineWidth = 1.3;
    x.beginPath(); x.moveTo(cx, top); x.lineTo(cx, top - 26); x.stroke();
    for (const [py, pw] of [[H * 0.3, 40], [H * 0.215, 24]]) {
      x.fillStyle = FACE[0];
      x.beginPath(); x.ellipse(cx, py, pw / 2, pw * 0.24, 0, 0, 6.28); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(cx - pw / 2, py); x.lineTo(cx + pw / 2, py); x.stroke();
      x.fillStyle = WIN_ON[0];
      for (let i = -pw / 2 + 5; i < pw / 2 - 4; i += 5) x.fillRect(cx + i, py - pw * 0.13, 2, 3);
      k.fillStyle = PINK;
      k.beginPath(); k.ellipse(cx, py + pw * 0.08, pw / 2 - 1, pw * 0.13, 0, 0, Math.PI); k.fill();
    }
    k.fillStyle = PINK; k.fillRect(cx - 2, top - 30, 4, 4);
    x.restore();
  }

  // เครนก่อสร้างโครงถัก (เมืองกำลังถูกสร้างใหม่)
  function crane(x, k, mx, topY, L, dir) {
    mx += 20;
    const c0 = mx + 3.5, jx0 = c0 - dir * L * 0.3, jx1 = c0 + dir * L, hx = c0 + dir * L * 0.68;
    x.save();
    x.strokeStyle = "#9d98ae"; x.lineWidth = 1;
    x.beginPath();
    x.moveTo(mx, H + 4); x.lineTo(mx, topY); x.moveTo(mx + 7, H + 4); x.lineTo(mx + 7, topY);
    for (let y = topY; y < H; y += 8) { x.moveTo(mx, y); x.lineTo(mx + 7, y + 8); }
    x.moveTo(jx0, topY); x.lineTo(jx1, topY); x.moveTo(jx0, topY + 6); x.lineTo(jx1, topY + 6);
    x.moveTo(jx0, topY + 6);
    for (let s = 0; s < L * 1.3 - 8; s += 8) { x.lineTo(jx0 + dir * (s + 4), topY); x.lineTo(jx0 + dir * (s + 8), topY + 6); }
    x.moveTo(jx1, topY); x.lineTo(c0, topY - 18); x.lineTo(jx0, topY);
    x.moveTo(hx, topY + 6); x.lineTo(hx, topY + 72);
    x.stroke();
    x.fillStyle = "#9d98ae";
    x.fillRect(jx0 - (dir > 0 ? 0 : 14), topY + 6, 14, 9);
    x.fillRect(hx - 3, topY + 72, 6, 5);
    x.restore();
    k.fillStyle = PINK; k.fillRect(c0 - 2, topY - 22, 4, 4);
  }

  // ป้ายโฆษณาภาพสเก็ตช์ (ขาวดำ / เมื่อสีกลับมาพื้นป้ายเป็นชมพูหรือมินต์)
  function billboard(ctx, bx, by, bw, bh, kind, fill, content) {
    ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
    ctx.lineWidth = 1; ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);
    ctx.strokeStyle = content; ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (kind === 0) {
      for (let i = 0; i < 4; i++) { ctx.moveTo(bx + 7 + i * 6, by + bh - 6); ctx.lineTo(bx + bw * 0.55 + i * 6, by + 6); }
    } else if (kind === 1) {
      ctx.moveTo(bx + 5, by + bh - 6);
      let px = bx + 5;
      while (px < bx + bw - 8) { const hh = 6 + ((px * 7) % 11); ctx.lineTo(px, by + bh - 6 - hh); px += 5; ctx.lineTo(px, by + bh - 6 - hh); }
      ctx.lineTo(bx + bw - 5, by + bh - 6);
    } else {
      ctx.arc(bx + bw * 0.32, by + bh / 2, bh * 0.24, 0, 6.28);
      ctx.moveTo(bx + bw * 0.55, by + bh * 0.38); ctx.lineTo(bx + bw - 7, by + bh * 0.38);
      ctx.moveTo(bx + bw * 0.55, by + bh * 0.58); ctx.lineTo(bx + bw - 12, by + bh * 0.58);
    }
    ctx.stroke();
  }

  // รางโมโนเรลยกระดับ: เสาตอม่อ + โครงถัก + คานราง
  function rail(x, k) {
    const bt = railBeam(), tr = 14, x0 = -20, x1 = W + 20;
    x.save();
    x.lineWidth = 1.6; x.strokeStyle = INK;
    const pw = 12, step = Math.max(120, W * 0.17);
    for (let px = 50; px < W + 20; px += step) {
      const top = railY(px) + bt + tr, X = px + 20;
      x.fillStyle = FACE[1];
      x.beginPath();
      x.moveTo(X - pw, top); x.lineTo(X + pw, top); x.lineTo(X + pw / 2, top + 12);
      x.lineTo(X + pw / 2, H + 4); x.lineTo(X - pw / 2, H + 4); x.lineTo(X - pw / 2, top + 12); x.closePath();
      x.fill(); x.stroke();
      x.fillStyle = "rgba(21,18,28,.16)"; x.fillRect(X + 1, top + 12, pw / 2 - 2, H - top);
    }
    x.strokeStyle = STROKE[1]; x.lineWidth = 1.1;
    x.beginPath();
    for (let xw = x0; xw < x1; xw += 16) {
      x.moveTo(xw + 20, railY(xw) + bt);
      x.lineTo(xw + 28, railY(xw + 8) + bt + tr);
      x.lineTo(xw + 36, railY(xw + 16) + bt);
    }
    x.moveTo(x0 + 20, railY(x0) + bt + tr); x.lineTo(x1 + 20, railY(x1) + bt + tr);
    x.stroke();
    x.fillStyle = FACE[0]; x.strokeStyle = INK; x.lineWidth = 1.8;
    x.beginPath();
    x.moveTo(x0 + 20, railY(x0)); x.lineTo(x1 + 20, railY(x1));
    x.lineTo(x1 + 20, railY(x1) + bt); x.lineTo(x0 + 20, railY(x0) + bt); x.closePath();
    x.fill(); x.stroke();
    x.fillStyle = STROKE[1];
    for (let xw = x0; xw < x1; xw += 22) x.fillRect(xw + 20, railY(xw) + bt * 0.5 - 1, 2, 2);
    x.restore();
    k.fillStyle = MINT;
    k.beginPath();
    k.moveTo(x0 + 20, railY(x0) + bt - 3.5); k.lineTo(x1 + 20, railY(x1) + bt - 3.5);
    k.lineTo(x1 + 20, railY(x1) + bt - 1); k.lineTo(x0 + 20, railY(x0) + bt - 1); k.closePath();
    k.fill();
  }

  // เสาไฟฟ้า สายไฟห้อย และธงราวงานเทศกาล
  function wires(x, k) {
    const yT = H * 0.73;
    const poles = [W * 0.17, W * 0.83];
    x.save();
    for (const px of poles) {
      const X = px + 20;
      x.strokeStyle = INK; x.lineWidth = 4;
      x.beginPath(); x.moveTo(X, H + 4); x.lineTo(X, yT - 8); x.stroke();
      x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(X - 16, yT); x.lineTo(X + 16, yT); x.moveTo(X - 10, yT + 9); x.lineTo(X + 10, yT + 9); x.stroke();
      x.fillStyle = INK;
      for (const o of [-14, 0, 14]) x.fillRect(X + o - 1.5, yT - 5, 3, 5);
    }
    const spans = [[-20, yT + 26, poles[0], yT], [poles[0], yT, poles[1], yT], [poles[1], yT, W + 20, yT + 22]];
    x.strokeStyle = "rgba(21,18,28,.75)"; x.lineWidth = 1;
    for (const [ax, ay, bx2, by2] of spans)
      for (const o of [-14, 0, 14]) {
        const sag = Math.abs(bx2 - ax) * 0.07 + 6;
        x.beginPath();
        x.moveTo(ax + o + 20, ay - 3);
        x.quadraticCurveTo((ax + bx2) / 2 + 20, (ay + by2) / 2 + sag, bx2 + o + 20, by2 - 3);
        x.stroke();
      }
    // ธงราวบนสายกลาง
    const [ax, ay, bx2, by2] = spans[1];
    const cxq = (ax + bx2) / 2, cyq = (ay + by2) / 2 + Math.abs(bx2 - ax) * 0.1 + 8;
    const n = Math.max(6, Math.round((bx2 - ax) / 24));
    x.beginPath(); x.moveTo(ax + 20, ay + 6); x.quadraticCurveTo(cxq + 20, cyq, bx2 + 20, by2 + 6); x.stroke();
    for (let i = 1; i < n; i++) {
      const u = i / n, v = 1 - u;
      const px = v * v * ax + 2 * v * u * cxq + u * u * bx2 + 20;
      const py = v * v * (ay + 6) + 2 * v * u * cyq + u * u * (by2 + 6);
      const tri = ctx => { ctx.beginPath(); ctx.moveTo(px - 6, py); ctx.lineTo(px + 6, py); ctx.lineTo(px, py + 13); ctx.closePath(); };
      x.fillStyle = "#ffffff"; x.strokeStyle = INK; x.lineWidth = 1.2; tri(x); x.fill(); x.stroke();
      k.fillStyle = PALETTE[i % PALETTE.length]; tri(k); k.fill();
      k.strokeStyle = INK; k.lineWidth = 1.2; k.stroke();
    }
    x.restore();
  }

  // ต้นซากุระ: ลายเส้นดอกขาว / ชั้นสีเป็นชมพู
  function tree(x, k, cx, R, dir) {
    const X = cx + 20;
    const ccx = X + dir * R * 0.4, ccy = H - R * 1.55;
    trees.push({ cx: ccx - 20, cy: ccy, R });
    x.save();
    x.strokeStyle = "#2a2535"; x.lineCap = "round";
    x.lineWidth = R * 0.14;
    x.beginPath(); x.moveTo(X, H + 4); x.quadraticCurveTo(X + dir * R * 0.05, H - R * 0.6, X + dir * R * 0.3, H - R * 1.15); x.stroke();
    x.lineWidth = R * 0.06;
    x.beginPath();
    for (const [ex, ey] of [[-0.5, -1.7], [0.2, -2.05], [0.85, -1.75], [1.1, -1.3], [-0.2, -1.35]]) {
      x.moveTo(X + dir * R * 0.28, H - R * 1.1);
      x.quadraticCurveTo(X + dir * R * (0.28 + ex * 0.4), H - R * 1.5, X + dir * R * ex, H + R * ey + R * 0.2);
    }
    x.stroke();
    x.restore();

    const circles = [];
    for (let i = 0; i < 6; i++) {
      const a = rnd() * 6.28, d = rnd() * R * 0.62;
      const gx = ccx + Math.cos(a) * d * 1.25, gy = ccy + Math.sin(a) * d * 0.7;
      for (let j = 0; j < 8; j++) {
        circles.push({ x: gx + (rnd() - 0.5) * R * 0.5, y: gy + (rnd() - 0.5) * R * 0.35, r: R * (0.13 + rnd() * 0.15), shade: rnd() });
      }
    }
    // ลายเส้น: วาดขอบก่อน แล้วถมขาวทับ ให้เหลือแต่เส้นรอบนอกของพุ่ม
    x.fillStyle = "#8d8799";
    for (const o of circles) { x.beginPath(); x.arc(o.x, o.y, o.r + 1.6, 0, 6.28); x.fill(); }
    x.fillStyle = "#fbfafd";
    for (const o of circles) { x.beginPath(); x.arc(o.x, o.y, o.r, 0, 6.28); x.fill(); }
    x.strokeStyle = "#a8a2b6"; x.lineWidth = 1;
    x.beginPath();
    for (const o of circles) if (o.shade < 0.5) { x.moveTo(o.x - 3, o.y); x.lineTo(o.x, o.y + 2.5); x.lineTo(o.x + 3, o.y); }
    x.stroke();

    k.fillStyle = "#c2186f";
    for (const o of circles) { k.beginPath(); k.arc(o.x, o.y, o.r + 1.6, 0, 6.28); k.fill(); }
    for (const o of circles) {
      const low = (o.y - ccy) / R;
      k.fillStyle = low > 0.12 ? "#ff6fb8" : o.shade < 0.35 ? "#ffd0e6" : "#ff9fd0";
      k.beginPath(); k.arc(o.x, o.y, o.r, 0, 6.28); k.fill();
    }
    k.fillStyle = "rgba(255,255,255,.85)";
    for (const o of circles) if (o.shade > 0.7) { k.beginPath(); k.arc(o.x - o.r * 0.3, o.y - o.r * 0.3, o.r * 0.22, 0, 6.28); k.fill(); }
  }

  function cat(x, cx, by) {
    x.save();
    x.fillStyle = INK; x.strokeStyle = INK; x.lineWidth = 2.5; x.lineCap = "round";
    x.beginPath(); x.ellipse(cx, by - 9, 6.5, 9, 0, 0, 6.28); x.fill();
    x.beginPath(); x.arc(cx + 1, by - 21, 5.5, 0, 6.28); x.fill();
    x.beginPath();
    x.moveTo(cx - 4, by - 24); x.lineTo(cx - 3.5, by - 31); x.lineTo(cx, by - 26);
    x.moveTo(cx + 2, by - 26); x.lineTo(cx + 5.5, by - 31); x.lineTo(cx + 6, by - 23);
    x.fill();
    x.beginPath(); x.moveTo(cx + 5, by - 2); x.quadraticCurveTo(cx + 15, by - 1, cx + 14, by - 13); x.stroke();
    x.restore();
  }

  // ---------- อบตึกหนึ่งชั้น: line = ลายเส้นขาวดำ, color = สีที่ซ้อนตามสีที่กลับมา ----------
  function bake(L) {
    const x = L.line.getContext("2d"), k = L.color.getContext("2d"), li = L.li, ws = WIN[li];
    x.clearRect(0, 0, W + 40, H); k.clearRect(0, 0, W + 40, H);
    x.lineJoin = "miter";

    if (li === 0) {
      crane(x, k, W * 0.16, H * 0.43, W * 0.22, 1);
      tower(x, k);
    }

    let catDone = false;
    for (const b of L.blds) {
      const bx = Math.round(b.x + 20) + 0.5, by = Math.round(H - b.h) + 0.5, r = bx + b.w;
      x.fillStyle = FACE[li]; x.strokeStyle = STROKE[li]; x.lineWidth = LW[li];
      bodyPath(x, b, bx, by); x.fill(); x.stroke();

      // รายละเอียดในตัวตึก (ตัดตามรูปตึก)
      x.save(); bodyPath(x, b, bx, by); x.clip();
      const shade = b.w * 0.20;
      x.fillStyle = "rgba(55,50,74,.08)";
      x.fillRect(r - shade, by - b.tip, shade, b.h + b.tip);
      for (const wn of b.wins) {
        x.fillStyle = wn.on ? WIN_ON[li] : WIN_OFF[li];
        x.fillRect(bx + wn.x, by + wn.y, ws.sx, ws.sy);
      }
      x.restore();

      // ยอดตึก
      x.strokeStyle = STROKE[li]; x.lineWidth = LW[li] * 0.8;
      if (b.top === "antenna") {
        const ax = Math.round(bx + b.w * b.antX) + 0.5;
        x.beginPath();
        x.moveTo(ax, by); x.lineTo(ax, by - b.ant);
        x.moveTo(ax - 5, by - b.ant * 0.55); x.lineTo(ax + 5, by - b.ant * 0.55);
        x.moveTo(ax + 7, by); x.lineTo(ax + 7, by - b.ant * 0.45);
        x.stroke();
        k.fillStyle = PINK; k.fillRect(ax - 1.5, by - b.ant - 3, 3, 3);
      } else if (b.top === "spire") {
        x.beginPath(); x.moveTo(bx + b.w / 2, by - b.tip); x.lineTo(bx + b.w / 2, by - b.tip - 12); x.stroke();
      } else if (b.top === "tank") {
        const tw = Math.min(16, b.w * 0.34), th = tw * 0.8, tx = bx + b.w * 0.22;
        x.beginPath();
        x.moveTo(tx + 2, by); x.lineTo(tx + 2, by - 6); x.moveTo(tx + tw - 2, by); x.lineTo(tx + tw - 2, by - 6);
        x.stroke();
        x.fillStyle = FACE[li];
        x.beginPath(); x.rect(tx, by - 6 - th, tw, th); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(tx - 1, by - 6 - th); x.lineTo(tx + tw / 2, by - 11 - th); x.lineTo(tx + tw + 1, by - 6 - th); x.stroke();
      } else if (b.top === "flat") {
        x.lineWidth = 1;
        x.beginPath(); x.moveTo(bx + 2, by + 4); x.lineTo(r - 2, by + 4); x.stroke();
      }

      // ชั้นสี: แถบสีของสาขาที่ยอดตึก + หน้าต่างที่เปิดไฟ
      k.save(); bodyPath(k, b, bx, by); k.clip();
      k.fillStyle = b.hue;
      k.fillRect(bx, by - b.tip, b.w, b.tip + (b.sb || 0) + 4);
      for (const wn of b.wins) if (wn.on) k.fillRect(bx + wn.x, by + wn.y, ws.sx, ws.sy);
      k.restore();

      if (b.bill) {
        const B = b.bill, px = bx + (b.w - B.bw) / 2;
        const py = B.roof ? by - B.bh - 9 : by + 16;
        if (B.roof) {
          x.strokeStyle = INK; x.lineWidth = 1.5;
          x.beginPath();
          x.moveTo(px + B.bw * 0.2, by); x.lineTo(px + B.bw * 0.2, py + B.bh);
          x.moveTo(px + B.bw * 0.8, by); x.lineTo(px + B.bw * 0.8, py + B.bh);
          x.moveTo(px + B.bw * 0.2, by); x.lineTo(px + B.bw * 0.8, py + B.bh);
          x.stroke();
        }
        billboard(x, px, py, B.bw, B.bh, B.kind, "#ffffff", "#8d8799");
        billboard(k, px, py, B.bw, B.bh, B.kind, B.col, INK);
      }

      if (b.awn) {
        const ay = H - 36, aw = b.w - 6;
        const awn = ctx => { ctx.beginPath(); ctx.moveTo(bx + 3, ay); ctx.lineTo(bx + 3 + aw, ay); ctx.lineTo(bx + 6 + aw, ay + 11); ctx.lineTo(bx, ay + 11); ctx.closePath(); };
        x.fillStyle = "#3a3548"; x.fillRect(bx + 6, ay + 11, b.w - 12, 25);
        x.fillStyle = "#ffffff"; x.strokeStyle = INK; x.lineWidth = 1.5;
        awn(x); x.fill();
        x.save(); awn(x); x.clip();
        x.fillStyle = "#b9b4c6";
        for (let sx = bx; sx < r + 6; sx += 12) x.fillRect(sx, ay, 6, 11);
        x.restore();
        awn(x); x.stroke();
        k.save(); awn(k); k.clip();
        k.fillStyle = b.hue;
        for (let sx = bx; sx < r + 6; sx += 12) k.fillRect(sx, ay, 6, 11);
        k.restore();
        // แสงในร้าน
        k.fillStyle = "rgba(255,206,120,.9)"; k.fillRect(bx + 9, ay + 15, b.w - 18, 6);
      }

      if (li === 2 && !catDone && b.top === "flat" && b.x > W * 0.58 && b.x < W * 0.8) {
        cat(x, bx + b.w * 0.6, by);
        catDone = true;
      }
    }

    if (li === 1) rail(x, k);
    if (li === 2) {
      trees = [];
      wires(x, k);
      const R = Math.max(48, Math.min(130, Math.min(W, H) * 0.16));
      tree(x, k, W * 0.03, R, 1);
      tree(x, k, W * 0.97, R * 0.9, -1);
    }
  }

  // 1 = หม่นเต็มที่ (เพิ่งเริ่ม) → 0 เมื่อสีกลับมาราว 60%
  const gloomAmt = () => {
    const k = Math.min(1, Math.max(0, 1 - sat.now / 0.6));
    return k * k * (3 - 2 * k);
  };

  const swayOf = li => reduce ? 0 : Math.sin(t * 0.0002 + li) * (li + 1) * 1.5;
  function applyCam(ctx = c) {
    const ax = W * cam.x;
    ctx.translate(ax, H); ctx.scale(cam.z, cam.z); ctx.translate(-ax, -H);
  }

  // ---------- ส่วนที่ขยับ (วาดด้วย p5) ----------
  // p5 จำ fill/stroke ล่าสุดไว้แล้วข้ามการตั้งค่าซ้ำ แต่ในไฟล์นี้มีโค้ด canvas ตรง ๆ แทรกบน context เดียวกัน
  // จึงล้างค่าที่จำไว้ก่อนวาดด้วย p5 ทุกครั้ง
  function p5Sync() {
    const r = P._renderer;
    if (r) { r._cachedFillStyle = null; r._cachedStrokeStyle = null; }
  }

  function cloudSprite(cl) {
    const maxR = Math.max(...cl.bumps.map(b => b.r)) + 4;
    const ox = maxR, oy = maxR, w = cl.span + maxR * 2, h = maxR + 3;
    const cv = offscreen(w, h), s = cv.getContext("2d");
    s.save();
    s.beginPath(); s.rect(0, 0, w, oy); s.clip();
    s.fillStyle = "rgb(160,154,178)";
    s.beginPath();
    for (const b of cl.bumps) { s.moveTo(ox + b.dx + b.r + 1.4, oy); s.arc(ox + b.dx, oy, b.r + 1.4, 0, 6.2832); }
    s.fill();
    const light = s.createLinearGradient(0, 0, 0, oy);
    light.addColorStop(0, "#fffefa");
    light.addColorStop(0.66, "#fbf9fc");
    light.addColorStop(1, "#e2deeb");
    s.fillStyle = light;
    s.beginPath();
    for (const b of cl.bumps) { s.moveTo(ox + b.dx + b.r, oy); s.arc(ox + b.dx, oy, b.r, 0, 6.2832); }
    s.fill();
    // ลอนเส้นด้านในแบบมังงะ
    s.strokeStyle = "rgb(185,180,200)"; s.lineWidth = 1;
    s.beginPath();
    for (let i = 1; i < cl.bumps.length - 1; i += 2) {
      const b = cl.bumps[i], cx = ox + b.dx, cy = oy - b.r * 0.15, a0 = Math.PI * 1.1;
      s.moveTo(cx + Math.cos(a0) * b.r * 0.45, cy + Math.sin(a0) * b.r * 0.35);
      s.ellipse(cx, cy, b.r * 0.45, b.r * 0.35, 0, a0, Math.PI * 1.75);
    }
    s.stroke();
    s.restore();
    s.strokeStyle = "rgb(160,154,178)"; s.lineWidth = 1.3;
    s.beginPath(); s.moveTo(ox - cl.bumps[0].r, oy); s.lineTo(ox + cl.span, oy); s.stroke();
    return { ...cl, sprite: cv, ox, oy, sw: w, sh: h };
  }

  function drawClouds(T) {
    for (const cl of clouds) {
      const span = W + cl.span + 160;
      const x = (cl.x + cl.span + 80 + T * cl.v) % span - cl.span - 80;
      c.drawImage(cl.sprite, x - cl.ox, cl.y - cl.oy, cl.sw, cl.sh);
    }
  }

  function drawBirds(T) {
    const period = 24000;
    const u = (T % period) / period;
    const lx = W + 80 - u * (W + 360);
    const ly = H * 0.17 + Math.sin(T * 0.0004) * 14;
    p5Sync();
    P.noFill(); P.stroke(40, 36, 52); P.strokeWeight(1.5);
    for (const b of flock) {
      const x = lx + b.dx, y = ly + b.dy, s = b.s * 1.2;
      const fl = Math.sin(T * 0.013 + b.ph) * s * 3.5;
      P.beginShape();
      P.vertex(x - 7 * s, y + fl);
      P.quadraticVertex(x - 3 * s, y - 2.5 * s, x, y);
      P.quadraticVertex(x + 3 * s, y - 2.5 * s, x + 7 * s, y + fl);
      P.endShape();
    }
  }

  // รถไฟโมโนเรล 4 ตู้ วิ่งซ้ายไปขวาบนราง (อยู่ในกล้องเดียวกับแถวกลาง)
  function drawTrain(T) {
    p5Sync();
    const sx = swayOf(1);
    const n = 4, gap = 4, len = Math.min(W * 0.78, 440), cl = (len - gap * (n - 1)) / n;
    const ch = Math.max(17, Math.min(26, H * 0.028));
    const period = 15000;
    const u = (T % period) / period;
    const headX = -len - 40 + u * (W + len * 2.6);
    const ang = Math.atan2(railY(W) - railY(0), W);
    const stripe = P.lerpColor(P.color(184, 179, 196), P.color(PINK), sat.now);
    const band = P.lerpColor(P.color(184, 179, 196), P.color(MINT), sat.now);
    for (let i = 0; i < n; i++) {
      const cx = headX - i * (cl + gap) - cl / 2;
      if (cx + cl < -30 || cx - cl > W + 30) continue;
      P.push();
      P.translate(cx + sx, railY(cx) - 0.5);
      P.rotate(ang);
      const head = i === 0, tail = i === n - 1;
      P.stroke(21, 18, 28); P.strokeWeight(1.7); P.fill(255);
      P.rect(-cl / 2, -ch, cl, ch, tail ? ch * 0.55 : 3, head ? ch * 0.85 : 3, 2, 2);
      P.noStroke();
      P.fill(58, 53, 72);
      const wl = -cl / 2 + (tail ? ch * 0.4 : 4), wr = cl / 2 - (head ? ch * 0.55 : 4);
      P.rect(wl, -ch + 4, wr - wl, ch * 0.34, 2);
      P.fill(226, 223, 233);
      for (let wx = wl + 3; wx < wr - 7; wx += 11) P.rect(wx, -ch + 5.5, 7, ch * 0.34 - 3);
      P.fill(stripe); P.rect(-cl / 2 + 1.5, -ch * 0.4, cl - 3, 3.2);
      P.fill(band); P.rect(-cl / 2 + 1.5, -ch * 0.4 + 4.5, cl - 3, 1.6);
      P.stroke(21, 18, 28); P.strokeWeight(1);
      P.line(-cl * 0.12, -ch * 0.55, -cl * 0.12, -3);
      P.line(cl * 0.12, -ch * 0.55, cl * 0.12, -3);
      if (head) {
        P.noStroke(); P.fill(255, 214, 140, 230);
        P.circle(cl / 2 - 4, -ch * 0.3, 4);
      }
      P.pop();
    }
    // เส้นความเร็วตามหลังขบวน
    if (!reduce) {
      const tx = headX - len;
      P.stroke(21, 18, 28, 90); P.strokeWeight(1);
      for (let k = 0; k < 4; k++) {
        const yy = railY(tx) - ch * (0.25 + k * 0.18), l = 26 + k * 12;
        P.line(tx - 8 + sx, yy, tx - 8 - l + sx, yy - l * Math.tan(ang));
      }
    }
  }

  function spawnPetal(p, anywhere) {
    const tr = trees.length && Math.random() < 0.75 ? trees[Math.floor(Math.random() * trees.length)] : null;
    if (tr) { p.x = tr.cx + (Math.random() - 0.5) * tr.R * 1.6; p.y = anywhere ? tr.cy - tr.R + Math.random() * H * 0.4 : tr.cy + (Math.random() - 0.5) * tr.R * 0.6; }
    else { p.x = Math.random() * W; p.y = anywhere ? Math.random() * H : -10; }
    p.vx = (Math.random() - 0.5) * 0.4;
    p.vy = 0.45 + Math.random() * 0.6;
    p.rot = Math.random() * 6.28;
    p.spin = (Math.random() - 0.5) * 0.08;
    p.s = 2.2 + Math.random() * 2.2;
    p.seed = Math.random() * 100;
    return p;
  }

  function drawPetals(T) {
    if (!petals.length) return;
    const n = Math.round(petals.length * (reduce ? 0.4 : 0.35 + 0.65 * sat.now));
    // กลีบทั้งหมดเป็น path เดียว: fill 1 ครั้ง + stroke 1 ครั้ง (เดิม push/rotate/ellipse ทีละกลีบ)
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const p = petals[i];
      if (!reduce) {
        const wind = (P.noise(p.seed, T * 0.00025) - 0.55) * 2.4;
        p.x += wind + p.vx; p.y += p.vy; p.rot += p.spin;
        if (p.y > H + 10 || p.x < -24 || p.x > W + 24) spawnPetal(p, false);
      }
      const rx = p.s * 1.1, ry = p.s * (0.35 + Math.abs(Math.sin(p.rot * 1.7))) * 0.65;
      c.moveTo(p.x + Math.cos(p.rot) * rx, p.y + Math.sin(p.rot) * rx);
      c.ellipse(p.x, p.y, rx, ry, p.rot, 0, 6.2832);
    }
    c.fillStyle = mix([214, 209, 222], [255, 143, 196], sat.now);
    c.fill();
    c.strokeStyle = mix([140, 134, 156], [194, 24, 111], sat.now);
    c.lineWidth = 0.8;
    c.stroke();
  }

  function drawPainted() {
    if (!painted.length) return;
    const L = layers[0], sway = swayOf(0), now = performance.now(), ws = WIN[0];
    for (const p of painted) {
      const b = L.blds[p.idx];
      if (!b) continue;
      const k = reduce ? 1 : Math.min(1, Math.max(0, (now - p.at) / PAINT_MS));
      const bx = Math.round(b.x + sway) + 0.5, by = Math.round(H - b.h) + 0.5;
      // สีไหลขึ้นจากฐานตึก
      const full = b.h + b.tip + 4;
      const fill = H + 4 - full * (1 - Math.pow(1 - k, 3));
      c.save();
      c.beginPath(); c.rect(bx - 2, fill, b.w + 4, H + 8 - fill); c.clip();
      c.fillStyle = p.color; bodyPath(c, b, bx, by); c.fill();
      c.fillStyle = "#ffffff";
      for (const w of b.wins) c.fillRect(bx + w.x, by + w.y, ws.sx + 1, ws.sy);
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 2;
      bodyPath(c, b, bx, by); c.stroke();
    }
  }

  function drawCity() {
    const T = reduce ? STILL_T : t;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    c.drawImage(paper, 0, 0, W, H);
    if (sat.now > 0.01) {
      c.globalAlpha = sat.now;
      c.drawImage(wash, 0, 0, W, H);
      c.globalAlpha = 1;
    }
    drawClouds(T);
    drawBirds(T);

    c.save();
    applyCam();
    for (let li = 0; li < 3; li++) {
      const dx = -20 + swayOf(li);
      c.drawImage(layers[li].line, dx, 0, W + 40, H);
      if (sat.now > 0.01) { c.globalAlpha = sat.now; c.drawImage(layers[li].color, dx, 0, W + 40, H); c.globalAlpha = 1; }
      if (li === 0) drawPainted();
      if (li === 1) drawTrain(T);
    }
    c.restore();

    drawPetals(T);

    c.fillStyle = fogGrad; c.fillRect(0, H * 0.84, W, H * 0.16);

    const gl = gloomAmt();
    if (gl > 0.01) {
      // วงแสงของไกด์ทำงานแค่ในกรอบสี่เหลี่ยมรอบวงแสง (เดิมประมวลผล offscreen เต็มจอ 2 แผ่นทุกเฟรม)
      // กรอบชิดพิกเซลจริง ให้รอยต่อระหว่างในกรอบกับนอกกรอบไม่เห็นเส้น
      const R = clearR();
      const X0 = Math.max(0, Math.floor((orb.x - R) * dpr)), Y0 = Math.max(0, Math.floor((orb.gy - R) * dpr));
      const X1 = Math.min(gloom.width, Math.ceil((orb.x + R) * dpr)), Y1 = Math.min(gloom.height, Math.ceil((orb.gy + R) * dpr));
      const box = X1 > X0 && Y1 > Y0;
      const bx = X0 / dpr, by = Y0 / dpr, bw = (X1 - X0) / dpr, bh = (Y1 - Y0) / dpr;

      if (box) {
        // เผยพู่กันชมพูมินต์และสีของเมืองที่ยังซ่อนอยู่ เฉพาะในวงแสง
        const p = peek.getContext("2d");
        p.save();
        p.beginPath(); p.rect(bx, by, bw, bh); p.clip();
        p.clearRect(bx, by, bw, bh);
        blit(p, wash, X0, Y0, X1, Y1);
        p.save(); applyCam(p);
        for (let li = 0; li < 3; li++) p.drawImage(layers[li].color, -20 + swayOf(li), 0, W + 40, H);
        p.restore();
        p.globalCompositeOperation = "destination-in";
        const lit = p.createRadialGradient(orb.x, orb.gy, R * 0.15, orb.x, orb.gy, R);
        lit.addColorStop(0, "rgba(0,0,0,1)");
        lit.addColorStop(0.55, "rgba(0,0,0,.65)");
        lit.addColorStop(1, "rgba(0,0,0,0)");
        p.fillStyle = lit; p.fillRect(bx, by, bw, bh);
        p.restore();
        c.globalAlpha = gl * 0.9;
        blit(c, peek, X0, Y0, X1, Y1);
      }

      // ความหม่น: นอกกรอบแปะแผ่นหม่นตรง ๆ / ในกรอบแปะแผ่นที่เจาะรูวงแสงแล้ว
      c.globalAlpha = gl; c.globalCompositeOperation = "multiply";
      c.save();
      c.beginPath(); c.rect(0, 0, W, H);
      if (box) c.rect(bx, by, bw, bh);
      c.clip("evenodd");
      c.drawImage(gloom, 0, 0, W, H);
      c.restore();
      if (box) {
        const s = gloomFrame.getContext("2d");
        s.clearRect(bx, by, bw, bh);
        blit(s, gloom, X0, Y0, X1, Y1);
        s.globalCompositeOperation = "destination-out";
        const hole = s.createRadialGradient(orb.x, orb.gy, 0, orb.x, orb.gy, R);
        hole.addColorStop(0, "rgba(0,0,0,1)");
        hole.addColorStop(0.45, "rgba(0,0,0,.6)");
        hole.addColorStop(1, "rgba(0,0,0,0)");
        s.fillStyle = hole; s.fillRect(bx, by, bw, bh);
        s.globalCompositeOperation = "source-over";
        blit(c, gloomFrame, X0, Y0, X1, Y1);
      }
      c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
    }
    const q = Math.round(gl * 100) / 100;
    if (q !== gloomCss) { gloomCss = q; document.documentElement.style.setProperty("--gloom", q); }
    const m = Math.round((1 - sat.now) * 100) / 100;
    if (m !== monoCss) { monoCss = m; document.documentElement.style.setProperty("--mono", m); }
  }

  // ริบบอนเรียวจากหาง (บาง จาง) ไปหัว (กว้าง สว่าง) วาดหลังรัศมีของไกด์
  function drawTrail(gw, gl) {
    const n = trail.length;
    if (n < 3) return;
    const tail = trail[0], head = trail[n - 1];
    if (Math.hypot(head.x - tail.x, head.y - tail.y) < gw * 0.08) return;
    const left = [], right = [];
    let nx = 0, ny = -1;
    for (let i = 0; i < n; i++) {
      const a = trail[Math.max(0, i - 1)], b = trail[Math.min(n - 1, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0.01) { nx = -dy / d; ny = dx / d; }
      const k = i / (n - 1);
      const w = gw * 0.14 * k * (2 - k);
      left.push(trail[i].x + nx * w, trail[i].y + ny * w);
      right.push(trail[i].x - nx * w, trail[i].y - ny * w);
    }
    const ribbon = (scale) => {
      f.beginPath();
      f.moveTo(tail.x, tail.y);
      for (let i = 0; i < n; i++) {
        const px = trail[i].x, py = trail[i].y;
        f.lineTo(px + (left[i * 2] - px) * scale, py + (left[i * 2 + 1] - py) * scale);
      }
      for (let i = n - 1; i >= 0; i--) {
        const px = trail[i].x, py = trail[i].y;
        f.lineTo(px + (right[i * 2] - px) * scale, py + (right[i * 2 + 1] - py) * scale);
      }
      f.closePath();
    };
    const grad = (r, g, b, a) => {
      const lg = f.createLinearGradient(tail.x, tail.y, head.x, head.y);
      lg.addColorStop(0, `rgba(${r},${g},${b},0)`);
      lg.addColorStop(1, `rgba(${r},${g},${b},${a})`);
      return lg;
    };
    f.save();
    f.globalCompositeOperation = "lighter";
    f.fillStyle = grad(255, 160, 90, 0.22 + 0.18 * gl);
    ribbon(1); f.fill();
    f.fillStyle = grad(255, 226, 180, 0.4 + 0.2 * gl);
    ribbon(0.38); f.fill();
    f.restore();
  }

  function drawFx() {
    f.clearRect(0, 0, W, H);
    // ฝนเส้นหมึกแบบมังงะ: ไม่ตกในวงแสงของไกด์
    const gl = gloomAmt();
    if (gl > 0.02 && !reduce) {
      const R2 = Math.pow(clearR() * 0.8, 2);
      for (const heavy of [false, true]) {
        f.strokeStyle = heavy ? `rgba(21,18,28,${0.5 * gl})` : `rgba(37,40,60,${0.32 * gl})`;
        f.lineWidth = heavy ? 1.7 : 1;
        f.beginPath();
        for (const r of rain) {
          if (r.heavy !== heavy) continue;
          if (!heavy) { r.y += r.v; r.x -= r.v * 0.22; if (r.y - r.len > H) { r.y = -10; r.x = Math.random() * (W + 80); } }
          const dx = r.x - orb.x, dy = r.y - r.len / 2 - orb.gy;
          if (dx * dx + dy * dy < R2) continue;
          f.moveTo(r.x, r.y); f.lineTo(r.x + r.len * 0.22, r.y - r.len);
        }
        f.stroke();
        if (heavy) for (const r of rain) if (r.heavy) { r.y += r.v * 1.25; r.x -= r.v * 0.275; if (r.y - r.len > H) { r.y = -10; r.x = Math.random() * (W + 80); } }
      }
    }

    const joy = 1 - gl;
    let hop = 0;
    let guideAlpha = 1;
    if (!reduce) {
      const nowMs = performance.now();
      let tx, ty, ease = 0.03;
      const cb = cheer && nowMs < cheer.until && layers[0].blds[cheer.idx];
      const slot = attendSlot();
      if (cb) {
        const ax = W * cam.x;
        tx = ax + (cb.x + swayOf(0) + cb.w / 2 - ax) * cam.z;
        ty = H + (H - cb.h - cb.tip - H) * cam.z - guideW() * 0.75;
        ease = 0.085;
        if (nowMs > cheer.start) hop = -Math.abs(Math.sin((nowMs - cheer.start) * 0.011)) * 16;
      } else if (slot) {
        tx = slot.x; ty = slot.y; ease = 0.09;
        if (blinkAt !== null) {
          const elapsed = nowMs - blinkAt;
          ease = elapsed < 110 ? 0 : 1;
          guideAlpha = elapsed < 110 ? 1 - elapsed / 110 : Math.min(1, (elapsed - 110) / 150);
          if (elapsed >= 110) trail.length = 0;
          if (elapsed >= 260) blinkAt = null;
        }
      } else if (following && mouse.on) {
        // จุดกึ่งกลางของไกด์อยู่ตรงเคอร์เซอร์พอดี
        const radius = guideReady() ? guideW() * Math.hypot(1, guide.naturalHeight / guide.naturalWidth) / 2 : 15;
        const sx = Math.max(radius, Math.min(W - radius, mouse.x));
        const sy = Math.max(radius, Math.min(H - radius, mouse.y));
        // สปริงฟิสิกส์แบบ Motion (motion.dev follow-pointer): m·a = -k·(x - เป้า) - c·v
        // ใช้เวลาจริง (วินาที) แบ่งเป็นสเต็ปย่อยให้เสถียรแม้เฟรมกระตุก
        let dt = Math.min(0.064, (nowMs - (spring.t || nowMs)) / 1000);
        const { k, c, m } = SPRING;
        while (dt > 0) {
          const h = Math.min(dt, 1 / 240);
          spring.vx += ((-k * (orb.x - sx) - c * spring.vx) / m) * h;
          spring.vy += ((-k * (orb.y - sy) - c * spring.vy) / m) * h;
          orb.x += spring.vx * h;
          orb.y += spring.vy * h;
          dt -= h;
        }
        orb.vx += (spring.vx / 60 - orb.vx) * 0.1;
      } else {
        cheer = null;
        const pace = 0.6 + 0.6 * joy;
        tx = W * (0.5 + 0.32 * Math.sin(t * 0.00023 * pace));
        ty = H * (0.25 - 0.05 * joy + 0.06 * Math.sin(t * 0.00051 * pace));
      }
      if (tx !== undefined) {
        const nx = orb.x + (tx - orb.x) * ease;
        orb.vx += ((nx - orb.x) - orb.vx) * 0.1;
        const vy = (ty - orb.y) * ease;
        spring.vx = ease === 1 ? 0 : (nx - orb.x) * 60; spring.vy = ease === 1 ? 0 : vy * 60;   // px/เฟรม → px/วินาที ส่งต่อแรงเฉื่อยให้สปริง
        orb.x = nx;
        orb.y += vy;
      }
      spring.t = nowMs;

      const bk = (nowMs - bounceAt) / 700;
      if (bk >= 0 && bk < 1) hop += -Math.abs(Math.sin(bk * Math.PI * 2)) * 22 * (1 - bk);
    }
    const pulse = reduce ? 1 : 1 + 0.12 * Math.sin(t * 0.004);
    guide.style.opacity = guideAlpha;
    bubble.style.opacity = guideAlpha < 1 ? String(guideAlpha) : "";
    if (!sayUntil) bubble.style.opacity = "";
    f.save();
    f.globalAlpha = guideAlpha;

    if (guideReady()) {
      const diagonal = Math.hypot(1, guide.naturalHeight / guide.naturalWidth);
      const gw = following ? guideW() : Math.min(guideW(), W * 0.14);
      const gh = gw * guide.naturalHeight / guide.naturalWidth;
      const bob = reduce || (following && mouse.on) ? hop : Math.sin(t * (0.0016 + 0.0016 * joy)) * (3 + 4 * joy) + hop;
      const spinK = (performance.now() - spinAt) / SPIN_MS;
      const spin = !reduce && spinK >= 0 && spinK < 1 ? (1 - Math.pow(1 - spinK, 3)) * Math.PI * 2 : 0;
      const tilt = reduce ? 0 : Math.max(-0.22, Math.min(0.22, orb.vx * 0.08)) + Math.sin(t * 0.0017) * 0.04 + 0.1 * gl + spin;
      keepGuideVisible(gw * diagonal / 2, bob);
      const gy = orb.gy = orb.y + bob;
      if (!reduce) {
        trail.push({ x: orb.x, y: gy });
        if (trail.length > TRAIL_N) trail.shift();
        drawTrail(gw, gl);
      } else trail.length = 0;
      const halo = f.createRadialGradient(orb.x, gy, 0, orb.x, gy, gw * 0.75 * pulse);
      halo.addColorStop(0, `rgba(255,206,150,${0.5 + 0.3 * gl})`);
      halo.addColorStop(0.5, `rgba(255,170,100,${0.18 + 0.17 * gl})`);
      halo.addColorStop(1, "rgba(255,170,100,0)");
      f.fillStyle = halo;
      f.beginPath(); f.arc(orb.x, gy, gw * 0.75 * pulse, 0, 6.28); f.fill();
      guide.style.width = gw + "px";
      const pointerOffset = mouse.x - orb.x;
      if (mouse.on && Math.abs(pointerOffset) > 8) guideFacing = -Math.sign(pointerOffset);
      guide.style.transform = `translate3d(${orb.x - gw / 2}px, ${gy - gh / 2}px, 0) rotate(${tilt}rad) scaleX(${guideFacing})`;
      placeBubble(gh);
    } else {
      keepGuideVisible(15, 0);
      orb.gy = orb.y;
      const g = f.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 44 * pulse);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.22, "rgba(255,196,92,.95)");
      g.addColorStop(0.55, "rgba(255,150,60,.35)");
      g.addColorStop(1, "rgba(255,150,60,0)");
      f.fillStyle = g;
      f.beginPath(); f.arc(orb.x, orb.y, 44 * pulse, 0, 6.28); f.fill();
      f.strokeStyle = INK; f.lineWidth = 1.5;
      f.beginPath(); f.arc(orb.x, orb.y, 13, 0, 6.28); f.stroke();
      placeBubble(60);
    }

    f.restore();
    // หยดสีของคำตอบ: บินโค้งจากแถวที่เลือกไปยอดตึก
    if (comets.length) {
      const now = performance.now();
      comets = comets.filter(cm => {
        const b = layers[0].blds[cm.idx];
        if (!b) return false;
        const ax = W * cam.x;
        const tx = ax + (b.x + swayOf(0) + b.w / 2 - ax) * cam.z;
        const ty = H + (H - b.h - b.tip - H) * cam.z;
        const k = (now - cm.t0) / COMET_MS;
        if (k >= 1) {
          burst(tx, ty, cm.color, 22);
          sparkle(tx, ty, cm.color);
          rings.push({ x: tx, y: ty, color: cm.color, t0: now });
          sfx("splash", cm.color);
          return false;
        }
        const arc = Math.min(170, Math.hypot(tx - cm.x0, ty - cm.y0) * 0.35);
        for (let i = 5; i >= 0; i--) {
          const kk = k - i * 0.045;
          if (kk < 0) continue;
          const e = kk < 0.5 ? 2 * kk * kk : 1 - 2 * (1 - kk) * (1 - kk);
          const x = cm.x0 + (tx - cm.x0) * e, y = cm.y0 + (ty - cm.y0) * e - Math.sin(Math.PI * e) * arc;
          const r = 6.5 - i;
          f.globalAlpha = 1 - i * 0.15;
          f.fillStyle = cm.color;
          f.fillRect(x - r, y - r, r * 2, r * 2);
          if (i === 0) { f.strokeStyle = INK; f.lineWidth = 1.5; f.strokeRect(x - r, y - r, r * 2, r * 2); }
        }
        f.globalAlpha = 1;
        return true;
      });
    }

    // คลื่นกระแทกตอนสีหยดลงยอดตึก: วงสีขยายออก + เส้นหมึกบางตาม
    if (rings.length) {
      const now = performance.now();
      rings = rings.filter(rg => {
        const k = (now - rg.t0) / RING_MS;
        if (k >= 1) return false;
        const e = 1 - Math.pow(1 - k, 3);
        f.globalAlpha = 1 - k;
        f.lineWidth = 5 * (1 - k) + 1;
        f.strokeStyle = rg.color;
        f.beginPath(); f.arc(rg.x, rg.y, 8 + e * 78, 0, 6.28); f.stroke();
        f.lineWidth = 1.2; f.strokeStyle = INK;
        f.beginPath(); f.arc(rg.x, rg.y, 4 + e * 52, 0, 6.28); f.stroke();
        return true;
      });
      f.globalAlpha = 1;
    }

    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.vy += p.star ? 0.015 : 0.04; p.vx *= p.star ? 0.95 : 0.99; p.x += p.vx; p.y += p.vy; p.life -= 1;
      f.globalAlpha = Math.max(0, p.life / p.max);
      f.fillStyle = p.color;
      if (p.star) {
        // ประกายสี่แฉก: กะพริบขยายแล้วหด
        const s = p.r * (0.6 + 0.8 * Math.sin(Math.PI * (1 - p.life / p.max)));
        f.fillRect(p.x - s * 2, p.y - s * 0.3, s * 4, s * 0.6);
        f.fillRect(p.x - s * 0.3, p.y - s * 2, s * 0.6, s * 4);
      } else f.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    f.globalAlpha = 1;
  }

  function stepSat(now) {
    if (!sat.moving) return;
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

  // ลูปของ p5: ตัวไกด์/ฝน 60 fps, เมือง ~30 fps (ทุกเฟรมตอนกล้องเคลื่อนหรือกำลังทาสี)
  function frame() {
    const now = performance.now();
    t = now;
    const satWasMoving = sat.moving;
    stepSat(now);
    stepCam();
    const painting = !reduce && painted.some(p => now - p.at < PAINT_MS);
    odd = !odd;
    if (odd || satWasMoving || cam.moving || painting || dirty || reduce) {
      drawCity();
      dirty = false;
    }
    drawFx();
    // ลดการเคลื่อนไหว: วาดเฉพาะตอนมีอะไรเปลี่ยน แล้วหยุด
    if (reduce && !sat.moving && !dirty && !particles.length) { P.noLoop(); looping = false; }
  }

  function schedule() {
    if (!ready || looping) return;
    looping = true;
    P.loop();
  }

  // ทาสีตึกแถวหลังหนึ่งหลังด้วยสีของคำตอบ คืนค่าตำแหน่ง x (0..1) ให้กล้องเล็ง
  function paint(color, from) {
    const L = layers[0];
    if (!L) return 0.5;
    const inView = L.blds.map((b, i) => i).filter(i => L.blds[i].x > W * 0.06 && L.blds[i].x + L.blds[i].w < W * 0.94);
    const used = new Set(painted.map(p => p.idx));
    const fresh = inView.filter(i => !used.has(i));
    const tall = fresh.filter(i => L.blds[i].h > H * 0.3);
    const pool = tall.length ? tall : fresh.length ? fresh : inView;
    if (!pool.length) return 0.5;
    const idx = pool[Math.floor(Math.random() * pool.length)];
    const delay = from && !reduce ? COMET_MS : 0;
    const t0 = performance.now();
    painted = painted.filter(p => p.idx !== idx).concat([{ idx, color, at: t0 + delay }]);
    if (delay) {
      comets.push({ x0: from.x, y0: from.y, idx, color, t0 });
      sfx("comet");
      cheer = { idx, start: t0 + delay, until: t0 + delay + 1200 };
    }
    dirty = true; schedule();
    const b = L.blds[idx];
    return (b.x + b.w / 2) / W;
  }

  function focus(x = 0.5, z = 1) {
    cam.tx = Math.min(0.9, Math.max(0.1, x)); cam.tz = z;
    dirty = true; schedule();
  }

  function follow(on) { following = !!on; schedule(); }

  // ---------- ไกด์โต้ตอบกับหน้าเว็บ ----------
  // จุดลอยข้างการ์ด ระดับเดียวกับสิ่งที่ชี้อยู่ (ฝั่งที่มีที่ว่างพอ)
  function attendSlot() {
    if (!attendEl) return null;
    if (!attendEl.isConnected) { attendEl = null; return null; }
    const r = attendEl.getBoundingClientRect();
    const box = r;
    const gw = Math.min(guideW(), W * 0.14), need = gw * 1.15;
    const y = Math.min(H - gw * 0.6, Math.max(gw * 0.6, r.top + r.height / 2));
    if (W - box.right > need) return { x: box.right + gw * 0.62, y };
    if (box.left > need) return { x: box.left - gw * 0.62, y };
    return { x: Math.max(gw / 2, r.left), y: r.top - gw * 0.65 };
  }

  function attend(node, selected = false) {
    if (attendEl === node && !selected) return;
    const glide = attendEl?.isConnected && !selected;
    attendEl = node || null;
    blinkAt = attendEl && !glide && !reduce ? performance.now() : null;
    schedule();
  }

  let lastGh = 60;
  function placeBubble(gh) {
    lastGh = gh;
    if (!sayUntil) return;
    const half = bubbleW / 2;
    const x = Math.min(W - half - 8, Math.max(half + 8, orb.x));
    let y = orb.gy - gh * 0.5 - bubbleH - 12;
    const below = y < 8;
    if (below) y = orb.gy + gh * 0.5 + 12;
    const left = x - half;
    bubble.style.transform = `translate(${left.toFixed(1)}px, ${y.toFixed(1)}px)`;
    bubble.style.setProperty("--tail", `${Math.min(bubbleW - 16, Math.max(16, orb.x - left)).toFixed(1)}px`);
    bubble.classList.toggle("below", below);
  }

  // ให้ไกด์พูดสั้น ๆ แล้วลูกโป่งหายเอง
  function say(text, ms = 2800, quiet = false) {
    if (!text) return;
    if (!quiet) sfx("say", text);
    bubble.textContent = text;
    bubble.classList.remove("on");
    void bubble.offsetWidth;   // เริ่มแอนิเมชันเด้งใหม่ทุกครั้ง
    bubble.classList.add("on");
    bubbleW = bubble.offsetWidth; bubbleH = bubble.offsetHeight;
    sayUntil = performance.now() + ms;
    placeBubble(lastGh);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(hush, ms);
    schedule();
  }

  function hush() {
    clearTimeout(sayTimer);
    bubble.classList.remove("on");
    sayUntil = 0;
  }

  function poke() {
    const now = performance.now();
    if (now - pokeAt < 600) return;
    pokeAt = now;
    if (!reduce) { spinAt = now; bounceAt = now; burst(orb.x, orb.gy, null, 28); }
    sfx("poke");
    say(POKE_LINES[pokeN++ % POKE_LINES.length], 2800, true);
  }

  // ไกด์อยู่หลังการ์ด: แตะได้เฉพาะตอนนิ้ว/เมาส์อยู่บนพื้นหลัง ไม่ใช่บนเนื้อหา
  const onGuide = (x, y) => Math.hypot(x - orb.x, y - orb.gy) < guideW() * 0.5;
  const onBackdrop = n => n === document.documentElement || n === document.body ||
    (n instanceof Element && n.matches("#stage, .cover, .cover-foot, .reveal"));
  addEventListener("pointermove", e => {
    document.documentElement.classList.toggle("guide-hot", onBackdrop(e.target) && onGuide(e.clientX, e.clientY));
  }, { passive: true });
  addEventListener("pointerdown", e => {
    if (e.button > 0 || !onBackdrop(e.target) || !onGuide(e.clientX, e.clientY)) return;
    poke();
  }, { passive: true });

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

  // ประกายรอบยอดตึกที่เพิ่งได้สี (สีคำตอบสลับกับสีขาว)
  function sparkle(x, y, color, n = 9) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + Math.random() * 0.5, s = 1.2 + Math.random() * 2.2;
      particles.push({
        x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
        r: 2.5 + Math.random() * 2.5, color: i % 3 ? color : "#ffffff", star: true,
        life: 40 + Math.random() * 25, max: 65,
      });
    }
    schedule();
  }

  function celebrate(colors) {
    if (reduce) return;
    spinAt = performance.now();
    const cols = colors && colors.length ? colors : PALETTE;
    let k = 0;
    const id = setInterval(() => {
      burst(W * (0.15 + Math.random() * 0.7), H * (0.15 + Math.random() * 0.35), cols[k % cols.length], 50);
      if (++k > 9) clearInterval(id);
    }, 180);
  }

  function setProgress(p) {
    const to = Math.min(1, Math.max(0, p));
    if (to === sat.to && !sat.moving) return;
    sat.from = sat.now; sat.to = to; sat.start = performance.now(); sat.moving = true;
    schedule();
  }

  new p5(sk => {
    P = sk;
    sk.setup = () => {
      const cnv = sk.createCanvas(innerWidth, innerHeight);
      // ใช้แคนวาสของ p5 แทน #city เดิม (คง id และตำแหน่งในหน้าไว้ ให้ CSS เดิมใช้ได้)
      cnv.elt.id = "city";
      cnv.elt.setAttribute("aria-hidden", "true");
      oldCv.replaceWith(cnv.elt);
      c = sk.drawingContext;
      sk.frameRate(60);
      sk.noiseSeed(11);
      build();
      ready = true;
      dirty = true;
    };
    sk.draw = frame;
  }, document.body);

  // แถบที่อยู่บนมือถือหดขยายบ่อย: สร้างเมืองใหม่เฉพาะตอนความกว้างเปลี่ยนหรือความสูงเปลี่ยนมาก
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!ready) return;
      if (innerWidth === W && Math.abs(innerHeight - H) / H < 0.25) return;
      build(); dirty = true; schedule();
    }, 150);
  });

  mq.addEventListener("change", () => {
    reduce = mq.matches;
    if (reduce) particles = [];
    dirty = true; schedule();
  });

  return { burst, celebrate, setProgress, paint, focus, clearPaint, follow, attend, say, hush, poke };
})();
