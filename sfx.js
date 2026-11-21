// เสียงประกอบ: สังเคราะห์สดด้วย Web Audio ไม่มีไฟล์เสียง โหลดเร็ว ใช้ออฟไลน์ได้
// เบราว์เซอร์ให้เริ่มเสียงได้หลังผู้ใช้แตะครั้งแรกเท่านั้น จึงปลุก AudioContext ตอน pointerdown/keydown แรก
// ปุ่มปิด/เปิดเสียงมุมขวาล่าง จำค่าไว้ในเครื่อง (ถ้าเบราว์เซอร์ไม่ให้เก็บก็แค่จำไม่ได้)
const Sfx = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const KEY = "imagineCity.sound";
  let on = true;
  try { on = localStorage.getItem(KEY) !== "off"; } catch (e) {}
  let ctx = null, master = null, noiseBuf = null;

  function wake() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      // กันเสียงซ้อนแล้วแตก
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 6;
      master.connect(comp).connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  const unlock = () => { if (on) wake(); };
  addEventListener("pointerdown", unlock, { capture: true, passive: true });
  addEventListener("keydown", unlock, { capture: true });

  // ยังปลุกไม่เสร็จก็ตั้งคิวเสียงไว้ได้ เสียงจะออกทันทีที่ AudioContext ทำงาน
  const ready = () => on && ctx && ctx.state !== "closed";

  // โน้ตเดียว: รูปคลื่น ความถี่ (ไถลไปได้) เอนเวโลปแบบเร็วขึ้น-ค่อย ๆ จาง
  function tone(freq, dur, { type = "sine", gain = 0.2, at = 0, to = null, attack = 0.005 } = {}) {
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  // เสียงซ่า: noise ผ่านฟิลเตอร์ ใช้ทำเสียงหวือ เสียงสีกระเซ็น
  function noise(dur, { gain = 0.15, at = 0, type = "bandpass", f0 = 800, f1 = null, q = 1.2 } = {}) {
    const t0 = ctx.currentTime + at;
    const s = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    flt.type = type; flt.Q.value = q;
    flt.frequency.setValueAtTime(f0, t0);
    if (f1) flt.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.03, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(flt).connect(g).connect(master);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }

  // แต่ละสาขามีโน้ตของตัวเอง (เพนทาโทนิก ฟังกี่ข้อซ้อนกันก็ไม่เพี้ยน)
  const NOTE = { DGA: 523.25, DGD: 587.33, IGD: 659.25, AFX: 783.99, DEN: 880 };
  const noteOf = color => {
    for (const k in MAJORS) if (MAJORS[k].color === color) return NOTE[k];
    return 659.25;
  };

  let lastHover = 0;
  const SOUNDS = {
    // ชี้ผ่านตัวเลือก: ติ๊กเบามาก
    hover() {
      const now = performance.now();
      if (now - lastHover < 45) return;
      lastHover = now;
      tone(2100, 0.035, { gain: 0.025 });
    },
    // กดปุ่มทั่วไป
    tap() { tone(520, 0.06, { type: "square", gain: 0.05, to: 760 }); tone(1040, 0.05, { gain: 0.04, at: 0.02 }); },
    back() { tone(700, 0.07, { type: "square", gain: 0.045, to: 440 }); },
    chipOn() { tone(880, 0.06, { type: "triangle", gain: 0.12 }); tone(1320, 0.08, { type: "triangle", gain: 0.09, at: 0.05 }); },
    chipOff() { tone(660, 0.07, { type: "triangle", gain: 0.09, to: 440 }); },
    // เลือกคำตอบ: ป๊อป + โน้ตประจำสาขา
    pick(color) {
      const f = noteOf(color);
      tone(950, 0.09, { gain: 0.16, to: 260 });
      tone(f, 0.35, { type: "triangle", gain: 0.14, at: 0.03 });
      tone(f * 1.5, 0.3, { gain: 0.06, at: 0.06 });
    },
    // หยดสีบินขึ้นตึก
    comet() { noise(0.5, { gain: 0.09, f0: 500, f1: 3800, q: 2.5 }); tone(400, 0.48, { gain: 0.035, to: 1300 }); },
    // สีหยดลงตึก: ซ่าเปียก + คอร์ดสั้น
    splash(color) {
      const f = noteOf(color);
      noise(0.28, { gain: 0.16, type: "lowpass", f0: 2600, f1: 300, q: 0.7 });
      tone(f, 0.6, { type: "triangle", gain: 0.12 });
      tone(f * 1.25, 0.55, { type: "sine", gain: 0.07, at: 0.04 });
      tone(f * 2, 0.4, { gain: 0.04, at: 0.08 });
    },
    // แตะไกด์: ดึ๋ง + ประกาย
    poke() {
      tone(280, 0.28, { gain: 0.16, to: 720 });
      tone(330, 0.32, { type: "triangle", gain: 0.07, at: 0.05, to: 990 });
      [1568, 2093, 2637].forEach((f, i) => tone(f, 0.18, { gain: 0.05, at: 0.12 + i * 0.05 }));
    },
    // ไกด์พูด: เสียงพึมพำสั้น ๆ แบบตัวละครเกม
    say(text = "") {
      const n = Math.min(6, Math.max(2, Math.round(text.length / 6)));
      for (let i = 0; i < n; i++) {
        const f = 620 + Math.random() * 380;
        tone(f, 0.055, { type: "square", gain: 0.022, at: i * 0.075, to: f * (0.9 + Math.random() * 0.25) });
      }
    },
    // เปิดบทใหม่: หวือ + ตึ้งแบบตราประทับ
    chapter() {
      noise(0.35, { gain: 0.12, f0: 300, f1: 2400, q: 1.5 });
      tone(150, 0.32, { gain: 0.28, at: 0.18, to: 48 });
      noise(0.12, { gain: 0.1, type: "lowpass", f0: 900, at: 0.18 });
      tone(784, 0.25, { type: "triangle", gain: 0.06, at: 0.45 });
    },
    // พลิกหน้าบัตรผ่าน
    page() { noise(0.18, { gain: 0.08, f0: 1800, f1: 600, q: 0.9 }); },
    // สีกลับมาครบ: อาร์เปจจิโอขึ้นไปจบที่คอร์ดเต็ม
    fanfare() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, { type: "triangle", gain: 0.13, at: i * 0.11 }));
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(f => tone(f, 1.3, { gain: 0.05, at: 0.48, attack: 0.03 }));
      for (let i = 0; i < 8; i++) tone(1800 + Math.random() * 1600, 0.12, { gain: 0.03, at: 0.5 + i * 0.09 });
    },
    // เผยผลลัพธ์: ตูมตอนชื่อกระแทกลง
    slam() { tone(110, 0.45, { gain: 0.3, to: 40 }); noise(0.3, { gain: 0.14, type: "lowpass", f0: 1500, f1: 200 }); },
    // ---------- หน้าผลลัพธ์ ----------
    // กลองรัวเร่งขึ้นก่อนบอกผล + เสียงไต่ขึ้น
    drumroll(dur = 0.9) {
      let t = 0, gap = 0.085;
      while (t < dur) {
        noise(0.05, { gain: 0.05 + 0.1 * (t / dur), type: "highpass", f0: 1800, q: 0.6, at: t });
        t += gap; gap = Math.max(0.028, gap * 0.9);
      }
      tone(220, dur, { type: "sawtooth", gain: 0.03, to: 880, attack: dur * 0.8 });
    },
    // ชื่อผลลัพธ์กระแทกลง: ตูม + คอร์ดของสาขาที่ได้ (ผลผสมได้สองโน้ตราก)
    reveal(colors = []) {
      tone(110, 0.5, { gain: 0.32, to: 38 });
      noise(0.35, { gain: 0.16, type: "lowpass", f0: 1800, f1: 200 });
      const roots = colors.length ? colors.map(noteOf) : [523.25];
      roots.forEach((f, i) => {
        [1, 1.25, 1.5, 2].forEach((m, j) => tone(f * m / 2, 1.6, { type: j ? "sine" : "triangle", gain: 0.09 - j * 0.015, at: 0.02 + i * 0.12, attack: 0.02 }));
      });
    },
    // มุมกรอบชมพูดีดเข้าที่
    snap() { tone(1800, 0.04, { type: "square", gain: 0.05 }); tone(2400, 0.04, { type: "square", gain: 0.04, at: 0.06 }); },
    // ตัวละครเด้งขึ้น
    rise() { tone(300, 0.35, { type: "triangle", gain: 0.1, to: 900 }); noise(0.3, { gain: 0.05, f0: 600, f1: 3000, q: 2 }); },
    // ชิปอาชีพเด้งทีละอัน: เสียงฟองสูงขึ้นเรื่อย ๆ
    bubble(i = 0) {
      const f = 660 * Math.pow(2, ((i * 2) % 12) / 12) * (i >= 6 ? 2 : 1);
      tone(f * 0.6, 0.08, { gain: 0.08, to: f * 1.4 });
    },
    // ป้ายสาขาประทับเหมือนตรายาง + โน้ตจบประจำสาขา
    stamp(color) {
      tone(180, 0.18, { gain: 0.22, to: 60 });
      noise(0.1, { gain: 0.12, type: "lowpass", f0: 1200 });
      const f = noteOf(color);
      tone(f, 0.25, { type: "triangle", gain: 0.1, at: 0.12 });
      tone(f * 1.5, 0.5, { type: "triangle", gain: 0.1, at: 0.24 });
      tone(f * 2, 0.7, { gain: 0.05, at: 0.24 });
    },
    // สีตัวละครกระจายทั่วเมือง: เสียงซ่าไล่ขึ้น + คอร์ดค้างของสีตัวละคร
    swell(colors = []) {
      noise(1.4, { gain: 0.1, f0: 200, f1: 4200, q: 0.8 });
      const f = colors.length ? noteOf(colors[0]) : 523.25;
      [0.5, 0.75, 1, 1.5].forEach((m, i) => tone(f * m, 2.2, { type: i % 2 ? "sine" : "triangle", gain: 0.06, at: 0.1 + i * 0.08, attack: 0.5 }));
      for (let i = 0; i < 6; i++) tone(f * 2 * (1 + i * 0.25), 0.2, { gain: 0.025, at: 0.6 + i * 0.1 });
    },
    success() { tone(784, 0.12, { type: "triangle", gain: 0.12 }); tone(1175, 0.3, { type: "triangle", gain: 0.12, at: 0.1 }); },
    error() { tone(330, 0.13, { type: "square", gain: 0.05 }); tone(247, 0.2, { type: "square", gain: 0.05, at: 0.12 }); },
  };

  function play(name, arg) {
    if (!ready() || !SOUNDS[name]) return;
    try { SOUNDS[name](arg); } catch (e) {}
  }

  // ---------- เพลงประกอบ (BGM) สองช่วง: ตอนทำควิซ / ตอนได้ผลลัพธ์ ----------
  // ไฟล์อยู่ใน assets/ ถ้ายังไม่มีไฟล์ก็เงียบไปเฉย ๆ ไม่พัง
  const BGM_SRC = { play: "assets/bgm-play.mp3", result: "assets/bgm-result.mp3" };
  const BGM_VOL = { play: 0.28, result: 0.32 };
  // เริ่มเล่น (และวนกลับมา) ที่วินาทีนี้ ข้ามอินโทรของเพลง
  const BGM_START = { play: 0, result: 13 };
  const tracks = {};
  let want = null; // ช่วงที่ควรเล่นอยู่ตอนนี้
  function track(name) {
    if (!tracks[name]) {
      const a = new Audio(BGM_SRC[name]);
      const start = BGM_START[name] || 0;
      a.preload = "auto"; a.volume = 0;
      a.loop = !start;
      // วนเพลงเองเพื่อกลับไปที่จุดเริ่ม ไม่ใช่ 0:00
      if (start) a.addEventListener("ended", () => { a.currentTime = start; if (on && want === name) a.play().catch(() => {}); });
      a.addEventListener("error", () => {}, { once: true });
      tracks[name] = { a, raf: 0 };
    }
    return tracks[name];
  }
  // ไฟล์ยังโหลดข้อมูลเพลงไม่เสร็จ ตั้งตำแหน่งไม่ได้ ต้องรอ loadedmetadata ก่อน
  function seek(name) {
    const a = tracks[name].a, start = BGM_START[name] || 0;
    if (a.readyState >= 1) a.currentTime = start;
    else a.addEventListener("loadedmetadata", () => { a.currentTime = start; }, { once: true });
  }
  // ค่อย ๆ ปรับระดับเสียง (เบราว์เซอร์บางตัวไม่ให้ตั้ง volume เช่น iOS ก็แค่เล่น/หยุดทันที)
  function fade(t, to, ms, then) {
    cancelAnimationFrame(t.raf);
    const from = t.a.volume, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      t.a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) t.raf = requestAnimationFrame(step); else if (then) then();
    };
    t.raf = requestAnimationFrame(step);
  }
  function syncBgm(restart) {
    for (const name in BGM_SRC) {
      const active = on && name === want;
      if (!active && !tracks[name]) continue;
      const t = track(name);
      if (active) {
        if (restart) seek(name);
        const p = t.a.play();
        if (p && p.catch) p.catch(() => {}); // ยังไม่มีการแตะครั้งแรก: จะลองใหม่ตอน unlock
        fade(t, BGM_VOL[name], 900);
      } else if (!t.a.paused) {
        fade(t, 0, 700, () => t.a.pause());
      }
    }
  }
  function bgm(name) {
    if (name === want) return;
    want = name;
    syncBgm(true);
  }
  // เปิดหน้ามาเพลงยังเล่นไม่ได้ (ต้องรอแตะก่อน) พอแตะครั้งแรกก็เริ่มเพลงที่ค้างไว้
  const resumeBgm = () => { const t = want && tracks[want]; if (on && t && t.a.paused) syncBgm(false); };
  addEventListener("pointerdown", resumeBgm, { capture: true, passive: true });
  addEventListener("keydown", resumeBgm, { capture: true });
  // สลับแท็บไปที่อื่น: หยุดเพลงไว้ก่อน กลับมาค่อยเล่นต่อ
  document.addEventListener("visibilitychange", () => {
    const t = want && tracks[want];
    if (!t) return;
    if (document.hidden) t.a.pause(); else if (on) syncBgm(false);
  });

  // ---------- ปุ่มเปิด/ปิดเสียง ----------
  const NS = "http://www.w3.org/2000/svg";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sound-toggle";
  btn.setAttribute("aria-label", "เสียงประกอบ");
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true");
  const body = document.createElementNS(NS, "path");
  body.setAttribute("d", "M3 9h4l5-4v14l-5-4H3z");
  const waves = document.createElementNS(NS, "path");
  waves.setAttribute("class", "waves");
  waves.setAttribute("d", "M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10");
  const cross = document.createElementNS(NS, "path");
  cross.setAttribute("class", "cross");
  cross.setAttribute("d", "M16 9.5l5 5M21 9.5l-5 5");
  svg.append(body, waves, cross);
  btn.append(svg);
  const sync = () => btn.setAttribute("aria-pressed", String(on));
  sync();
  btn.addEventListener("click", () => {
    on = !on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {}
    sync();
    if (on) { wake(); setTimeout(() => play("chipOn"), 30); }
    syncBgm(false);
  });
  document.body.append(btn);

  return { play, bgm, get on() { return on; } };
})();
