// Flow + ระบบคำนวณคะแนน
const ORDER = ["DGA", "DGD", "IGD", "AFX", "DEN"];
const SCORED = ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "gate", "4.1", "4.2", "5.1", "5.2"];
const stage = document.getElementById("stage");
const hud = document.getElementById("hud");
const hudLabel = document.getElementById("hudLabel");
const meter = document.getElementById("meter");
const hudCount = document.getElementById("hudCount");
// เว้นที่บนสุดของฉากเท่ากับความสูง HUD จริง (HUD สูงไม่เท่ากันตามขนาดจอ) ไม่ต้องเผื่อเกินจนต้องเลื่อน
const syncHud = () => document.documentElement.style.setProperty("--hud-h", `${hud.hidden ? 0 : hud.offsetHeight}px`);
if (window.ResizeObserver) new ResizeObserver(syncHud).observe(hud);

// สีของสาขามาจาก MAJORS ที่เดียว (data.js)
// ตัวนับ 11 ช่อง: แต่ละช่องรับสีของสาขาที่ตอบในฉากนั้น
const segs = SCORED.map(() => meter.appendChild(document.createElement("i")));
meter.setAttribute("aria-valuemax", SCORED.length);

const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const newId = () => (window.crypto && crypto.randomUUID)
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
let uidN = 0;
const uid = p => `${p}-${++uidN}`;

let state;
// ธีมหน้าผลลัพธ์: ทั้งเว็บ (พื้นหลัง ปุ่ม ชิป กรอบ) เปลี่ยนเป็นสีหลักของตัวละครที่ได้
// ผลผสมใช้ตัวละครแรกเป็นสีหลัก ตัวที่สองเป็นสีรอง / null = กลับธีมปกติ
const themeMeta = document.querySelector('meta[name="theme-color"]');
function setTheme(codes) {
  const root = document.documentElement;
  if (!codes) {
    root.classList.remove("themed");
    root.style.removeProperty("--theme"); root.style.removeProperty("--theme2");
    themeMeta.setAttribute("content", "#f4f2f7");
    return;
  }
  const a = CHAR_COLOR[codes[0]], b = CHAR_COLOR[codes[codes.length - 1]];
  root.style.setProperty("--theme", a);
  root.style.setProperty("--theme2", b);
  root.classList.add("themed");
  themeMeta.setAttribute("content", a);
}

function reset() {
  setTheme(null);
  state = {
    id: newId(),        // หนึ่งรอบเล่น = หนึ่งเรคคอร์ด
    scores: Object.fromEntries(ORDER.map(k => [k, 0])),
    answers: {},        // sceneId -> code
    districtPicks: {},  // code -> career ที่เลือกในย่าน
    form: {},
    subscribed: false,
    queue: [
      // ไม่มีการ์ดบทคั่น: ชื่อบทขึ้นเป็นหัวของฉากแรกในบทนั้นเลย (ch = เลขบท) ไม่ต้องกดเพิ่ม
      { type: "intro" },
      { type: "scene", id: "1.1", ch: 1 }, { type: "scene", id: "1.2" }, { type: "scene", id: "1.3" },
      { type: "scene", id: "2.1", ch: 2 }, { type: "scene", id: "2.2" }, { type: "scene", id: "2.3" },
      { type: "districts" }, // แตกเป็นย่านจริงหลังฉาก 2.3
      { type: "scene", id: "gate" },
      { type: "scene", id: "4.1", ch: 4 }, { type: "scene", id: "4.2" },
      { type: "scene", id: "5.1", ch: 5 }, { type: "scene", id: "5.2" },
      { type: "form" }, { type: "result" },
    ],
  };
  City.clearPaint();
  updateHud();
}

// ---------- คะแนน ----------
function ranking() {
  const tie52 = state.answers["5.2"];
  return ORDER.slice().sort((a, b) =>
    state.scores[b] - state.scores[a] ||
    (b === tie52) - (a === tie52) ||
    ORDER.indexOf(a) - ORDER.indexOf(b));
}

// ย่านในบทที่ 3: สาขาที่นำหลังฉาก 2.3 + อันดับ 2 ถ้าห่างไม่เกิน 1
function districtCodes() {
  const r = ranking();
  return state.scores[r[0]] - state.scores[r[1]] <= 1 ? [r[0], r[1]] : [r[0]];
}

// ผลลัพธ์: เดี่ยว หรือผสมถ้าอันดับ 2 ห่างไม่เกิน 1
// (เสมอกันพอดีก็นับเป็นผสม ใช้คำตอบฉาก 5.2 จัดว่าสาขาไหนขึ้นก่อน)
function finalResult() {
  const r = ranking();
  const mixed = state.scores[r[0]] - state.scores[r[1]] <= 1;
  return mixed ? [r[0], r[1]] : [r[0]];
}

function careersFor(code) {
  const pick = state.districtPicks[code];
  const rest = RESULTS[code].careers.filter(c => !pick || !pick.includes(c.split(" /")[0]));
  return { pick, rest };
}

// อาชีพของทุกสาขาในผลลัพธ์รวมเป็นชุดเดียว ข้อที่เลือกในย่านขึ้นก่อน ไม่ซ้ำกัน
function careerPills(codes) {
  const parts = codes.map(careersFor);
  const seen = new Set();
  const items = [...parts.filter(p => p.pick).map(p => [p.pick, true]), ...parts.flatMap(p => p.rest.map(c => [c, false]))];
  return items.filter(([c]) => !seen.has(c) && seen.add(c))
    .map(([c, top]) => el("li", { class: top ? "top" : null }, c));
}

// ---------- HUD ----------
function updateHud() {
  const done = SCORED.filter(id => state.answers[id]).length;
  SCORED.forEach((id, k) => {
    const code = state.answers[id];
    segs[k].className = code ? "on" : "";
    segs[k].style.setProperty("--c", code ? MAJORS[code].color : "");
  });
  hudCount.textContent = `${String(done).padStart(2, "0")} / ${SCORED.length}`;
  meter.setAttribute("aria-valuenow", done);
  meter.setAttribute("aria-valuetext", `คืนสีแล้ว ${done} จาก ${SCORED.length} ฉาก`);
  City.setProgress(done / SCORED.length);
}

const HUD_LABEL = {
  scene: s => CHAPTERS[SCENES[s.id].chapter].title,
  district: () => CHAPTERS[3].title,
  form: () => "ก่อนขึ้นเวทีใหญ่",
};

// ---------- render helpers ----------
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k);
  return n;
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ลูกศรคู่ วาดด้วย SVG
const chev = (flip = false) => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 18 14"); svg.setAttribute("class", "chev"); svg.setAttribute("aria-hidden", "true");
  if (flip) svg.style.transform = "scaleX(-1)";
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", "M1 1l6 6-6 6M9 1l6 6-6 6");
  path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "2.4");
  svg.append(path);
  return svg;
};
// ไอคอนเส้นหมึกชุดเดียวกับลูกศร: ติ๊กถูก (ข้อที่เลือก) กับเครื่องหมายเตือน (ข้อผิดพลาด)
const icon = (cls, d, box = "0 0 18 14") => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", box); svg.setAttribute("class", cls); svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d); path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2.4"); path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
};
const tick = () => icon("chev", "M2 7l5 5 9-10");
const warn = () => icon("warn", "M9 1.5l7.5 13h-15zM9 6.5v3.6M9 11.6v1.2", "0 0 18 16");

// โหมดทีมพัฒนา: เปิดด้วย ?dev ท้าย URL จะเห็นป้ายรอภาพ
// โหมด dev (?dev): แถบเครื่องมือกระโดดข้ามฉาก
const DEV = new URLSearchParams(location.search).has("dev");

// ช่องภาพประกอบจากทีมวาด: ถ้ายังไม่มีไฟล์ ช่องจะหายไปให้เมืองลายเส้นเต็มพื้นที่แทน
function artSlot(src, what, size, cls = "") {
  const box = el("figure", { class: "art " + cls });
  const img = el("img", { src, alt: "" });
  img.addEventListener("error", () => box.classList.add("absent"));
  box.append(img);
  return box;
}

// ---------- ไกด์ ----------
// ไกด์ลอยไปข้างการ์ดตรงกับสิ่งที่เธอชี้หรือโฟกัสอยู่ (ตัวเลือก ชิป ปุ่ม)
const ATTEND = ".option, .chip, .btn, .card input, .card select, .card textarea";
const attendable = n => n instanceof Element && n.closest(ATTEND) && !n.closest(".options.locked");
stage.addEventListener("pointerover", e => { const n = attendable(e.target); if (n) City.attend(n); });
stage.addEventListener("pointerout", e => { if (attendable(e.target) && !attendable(e.relatedTarget)) City.attend(null); });
stage.addEventListener("focusin", e => { const n = attendable(e.target); City.attend(n || null); });
const pickLine = a => a[Math.floor(Math.random() * a.length)];
// ---------- เสียงประกอบ (sfx.js) ----------
const sfx = (name, arg) => { if (typeof Sfx !== "undefined") Sfx.play(name, arg); };
const bgm = name => { if (typeof Sfx !== "undefined" && Sfx.bgm) Sfx.bgm(name); };
let hoverEl = null;
stage.addEventListener("pointerover", e => {
  const n = e.pointerType === "mouse" && attendable(e.target);
  if (n && n !== hoverEl && n.matches(".option, .chip, .btn") && !n.disabled) sfx("hover");
  hoverEl = n || null;
});
// ปุ่มทั่วไปมีเสียงกด / ชิปมีเสียงติด-ดับ / ตัวเลือกคำตอบเล่นเสียงของตัวเองใน choiceList
stage.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b || b.matches(".option")) return;
  if (b.matches(".chip")) sfx(b.getAttribute("aria-pressed") === "true" ? "chipOn" : "chipOff");
  else sfx("tap");
});
const CHEER = ["สีกลับมาแล้ว!", "ตึกนั้นสว่างขึ้นแล้ว", "เยี่ยมเลย!", "เห็นไหม เมืองตอบรับเธอ", "สวยมาก!"];
const IDLE = ["ไม่ต้องรีบนะ เลือกข้อที่เป็นเธอที่สุด", "ไม่มีข้อไหนผิด ตามใจเธอเลย", "ข้อไหนที่ทำให้เธอยิ้มได้?"];
// คิดนานแล้ว ไกด์ชวนคุยเบา ๆ ครั้งเดียวต่อฉาก
let idleT = 0;
const idleHint = (ms = 14000) => { idleT = setTimeout(() => City.say(pickLine(IDLE), 3600), ms); };

let busy = false; // กันกดซ้ำระหว่างเปลี่ยนฉาก (ไม่งั้นฉากถัดไปจะถูกข้าม)
function show(card) {
  busy = true;
  clearTimeout(idleT);
  sfxT.forEach(clearTimeout); sfxT = [];
  City.attend(null);
  const old = stage.firstElementChild;
  const put = () => {
    busy = false;
    stage.replaceChildren(card);
    (document.scrollingElement || document.documentElement).scrollTop = 0;
    // โฟกัสที่หัวเรื่อง: โปรแกรมอ่านหน้าจออ่านเรื่องและคำถามก่อน แล้วค่อยถึงตัวเลือก
    const f = card.querySelector("[data-focus]") || card.querySelector("h1, h2");
    if (f) { if (!f.matches("button")) f.tabIndex = -1; f.focus({ preventScroll: true }); }
  };
  // การ์ดที่ถอยออกไปก่อนแล้ว (หลังเลือกคำตอบ) ไม่ต้องรอซ้ำ
  if (old && old.classList.contains("leaving")) put();
  else if (old) { old.classList.add("leaving"); setTimeout(put, reduceMotion() ? 150 : 300); } else put();
}

function next() {
  if (busy) return;
  const step = state.queue.shift();
  if (step.type === "districts") {
    const codes = districtCodes();
    state.queue.unshift(...codes.map((code, i) => ({ type: "district", code, ...(i === 0 && { ch: 3, codes }) })));
    return next();
  }
  hud.hidden = ["intro", "result"].includes(step.type);
  bgm(step.type === "result" ? "result" : "play");
  syncHud();
  City.follow(step.type === "intro");
  if (HUD_LABEL[step.type]) hudLabel.textContent = HUD_LABEL[step.type](step);
  const run = () => ({ intro, scene, district, form, result })[step.type](step);
  if (step.ch && !reduceMotion()) chapterSplash(step.ch, run);
  else run();
  if (step.type === "form") idleT = setTimeout(() => City.say("กรอกเท่าที่สะดวกนะ ข้ามได้ทุกช่อง", 3400), 900);
}

// ฉากคั่นบทสั้น ๆ (~1.6 วิ) แบบหน้าเปิดบทมังงะ: แถบหมึกพาดเฉียง เลขบทเด้งขึ้น ชื่อบทกวาดเข้า แล้วไปฉากแรกเอง
// ไม่ต้องกดอะไร (แตะเพื่อข้ามได้) ผู้ใช้ที่ลดการเคลื่อนไหวจะข้ามไปเลย
function chapterSplash(n, then) {
  const m = CHAPTERS[n].title.match(/^(บทที่\s*\d+)\s*(.*)$/) || [, `บทที่ ${n}`, CHAPTERS[n].title];
  let done = false;
  sfx("chapter");
  const go = () => {
    if (done) return;
    if (busy) return void setTimeout(go, 50);
    done = true; clearTimeout(t); then();
  };
  show(el("section", { class: "chapter-splash", "aria-hidden": "true", onclick: go },
    el("div", { class: "cs-text" },
      el("i", { class: "cs-band" }),
      el("i", { class: "cs-band b2" }),
      el("span", { class: "cs-kicker" }, "CHAPTER"),
      el("b", { class: "cs-num" }, String(n)),
      el("span", { class: "cs-title" }, m[2]))));
  const t = setTimeout(go, 1700);
}

// ---------- screens ----------
function intro() {
  show(el("section", { class: "cover" },
    // ลำดับอ่าน: หัวปก > กล่องเรื่อง (คำโปรยหนา + เรื่องย่อ) > ปุ่ม > บอกว่าจะเจออะไร
    el("div", { class: "cover-head" },
      el("span", { class: "splash", "aria-hidden": "true" }),
      el("span", { class: "corner tl", "aria-hidden": "true" }),
      el("span", { class: "corner br", "aria-hidden": "true" }),
      el("h1", {}, el("span", { class: "ln" }, "คืนสุดท้าย"), el("span", { class: "ln" }, "ก่อนสีจะหายไป")),
      el("p", { class: "kicker" }, el("span", {}, "IMAGINE CITY ·"), el("span", {}, "STORY QUIZ"))),
    artSlot(ART.hero, "ตัวละครหลักกับเมือง Imagine City (พื้นหลังโปร่งใส)", "1080×1350"),
    el("div", { class: "cover-foot" },
      el("div", { class: "cover-story" },
        el("p", { class: "tagline" }, "คืนนี้สีสันของ Imagine City กำลังจะหายไปทั้งเมือง และมีเธอเป็นคนเดียวที่ช่วยได้"),
        el("p", {}, "ทุกอย่างซีดเป็นสีเทา เหลือเวลาอีกแค่คืนเดียว ถ้ามีใครขึ้นเวทีในเทศกาล Imagine Design Event แล้วทำให้คนทั้งเมืองกลับมายิ้มได้ สีทั้งหมดก็จะกลับมา")),
      el("div", { class: "actions" }, el("button", { type: "button", class: "btn", onclick: next }, "ลืมตาตื่น", chev())))));
  idleT = setTimeout(() => City.say("สวัสดี! ลองแตะฉันดูสิ", 3200), 1800);
}

// หัวบท: ชื่อบท + เรื่องย่อ วางบนฉากแรกของบท แทนการ์ดบทที่ต้องกด "ไปต่อ"
function chapterHead(n, codes) {
  if (!n) return null;
  const ch = CHAPTERS[n];
  // หัวบทเป็นบริบทรอง: ป้ายบทตัวหมึก + เรื่องย่อเล็ก จาง ให้คำถามของฉากเป็นพระเอก
  const [, tag, name] = ch.title.match(/^(บทที่ \d+)\s*(.*)$/) || [, "", ch.title];
  return el("div", { class: "chapter-head", "data-focus": "" },
    el("b", {}, tag && el("span", { class: "ch-tag" }, tag), el("span", {}, name)),
    el("p", {}, ch.text));
}

// ---------- หลังเลือกคำตอบ ----------
// ช่วงเดียวที่ตั้งใจออกแบบ: การ์ดถอยออกให้เห็นเมือง สีของคำตอบพุ่งจากแถวที่เลือกไปหยดบนยอดตึก
// แล้วตึกค่อย ๆ เติมสีจากฐาน กล้องซูมไปดูแวบหนึ่ง จากนั้นไปคำถามถัดไป (ไม่มี cutscene คั่น)
function paintThen(color, from) {
  const r = from && from.getBoundingClientRect();
  const x = City.paint(color, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);
  const card = stage.firstElementChild;
  if (card) card.classList.add("leaving");
  City.focus(x, 1.1);
  setTimeout(() => City.say(pickLine(CHEER), 1300), reduceMotion() ? 0 : 480);
  setTimeout(() => {
    City.focus(0.5, 1);
    const go = () => (busy ? setTimeout(go, 50) : next());
    go();
  }, reduceMotion() ? 300 : 950);
}

function choiceList(options, onPick, colorOf, labelId, onDone) {
  const box = el("div", { class: "options", role: "group", "aria-labelledby": labelId });
  shuffle(options).forEach((opt, i) => {
    const b = el("button", { type: "button", class: "option", style: `--i:${i}` },
      el("span", {}, opt[0]), chev());
    b.addEventListener("click", ev => {
      if (box.classList.contains("locked")) return;
      box.classList.add("locked");
      clearTimeout(idleT);
      City.attend(null);
      box.querySelectorAll(".option").forEach(o => o !== b && o.setAttribute("aria-disabled", "true"));
      const color = colorOf(opt);
      b.style.setProperty("--pick", color);
      b.classList.add("picked");
      b.setAttribute("aria-pressed", "true");
      b.lastChild.replaceWith(tick());
      sfx("pick", color);
      const r = b.getBoundingClientRect();
      City.burst(ev.clientX || r.left + r.width / 2, ev.clientY || r.top + r.height / 2, color);
      onPick(opt);
      setTimeout(() => onDone(opt, color, b), 400);
    });
    box.append(b);
  });
  return box;
}

function scene({ id, ch }) {
  const s = SCENES[id];
  const pid = uid("prompt");
  show(el("section", { class: ch ? "card chapter" : "card" },
    chapterHead(ch),
    el("h2", {}, s.title.replace(/^ฉาก [\d.]+ /, "")),
    el("p", { id: pid, class: "prompt" }, s.prompt),
    choiceList(s.options, ([, code]) => {
      state.answers[id] = code;
      state.scores[code]++;
      updateHud();
    }, ([, code]) => MAJORS[code].color, pid,
    (opt, color, row) => paintThen(color, row))));
  idleHint();
}

function district({ code, ch, codes }) {
  const d = DISTRICTS[code];
  const pid = uid("prompt");
  show(el("section", { class: ch ? "card chapter" : "card" },
    chapterHead(ch, codes),
    el("h2", {}, d.title),
    el("p", { id: pid, class: "prompt" }, d.prompt),
    choiceList(d.options, ([, career]) => { state.districtPicks[code] = career; }, () => MAJORS[code].color, pid,
      (opt, color, row) => paintThen(color, row))));
  idleHint();
}

// ---------- ช่องทางติดต่อ ----------
const CONTACT = {
  "LINE": { short: "LINE ID", label: "LINE ID ของเธอ" },
  "อีเมล": {
    short: "อีเมล", label: "อีเมลของเธอ", type: "email", autocomplete: "email", inputmode: "email",
    check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    error: "อีเมลนี้ยังไม่ครบ ลองเช็กว่ามี @ และชื่อโดเมน เช่น name@gmail.com",
  },
  "Facebook": { short: "ชื่อ Facebook", label: "ชื่อหรือลิงก์ Facebook ของเธอ" },
  "Instagram": { short: "ชื่อ Instagram", label: "ชื่อ Instagram ของเธอ" },
  "โทรศัพท์": {
    short: "เบอร์โทรศัพท์", label: "เบอร์โทรศัพท์ของเธอ", type: "tel", autocomplete: "tel", inputmode: "tel",
    check: v => /^0\d{8,9}$/.test(v.replace(/[\s-]/g, "")),
    error: "เบอร์โทรควรขึ้นต้นด้วย 0 และมี 9–10 หลัก",
  },
};
const CONTACT_FIELD = FORM_FIELDS.find(fd => fd.id === "contact");

// ปุ่มตัวเลือกแบบชิป (เลือกข้อเดียวหรือหลายข้อ)
function chipGroup(fd, data, onChange) {
  const qid = uid("q");
  const chips = el("div", { class: "chips", role: "group", "aria-labelledby": qid });
  // เลือกครบจำนวนแล้วกดเพิ่ม: บอกให้รู้ แทนที่จะเงียบ
  const full = fd.max ? el("p", { class: "chip-note", role: "status" }) : null;
  for (const ch of fd.choices) {
    const b = el("button", { type: "button", class: "chip", "aria-pressed": String(fd.type === "single" ? data[fd.id] === ch : (data[fd.id] || []).includes(ch)) }, ch);
    b.addEventListener("click", () => {
      if (fd.type === "single") {
        const on = data[fd.id] !== ch;
        data[fd.id] = on ? ch : undefined;
        chips.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(on && c === b)));
      } else {
        const arr = data[fd.id] || (data[fd.id] = []);
        const i = arr.indexOf(ch);
        if (full) full.textContent = "";
        if (i >= 0) arr.splice(i, 1);
        else {
          if (fd.max && arr.length >= fd.max) { full.textContent = `เลือกครบ ${fd.max} ข้อแล้ว แตะข้อที่เลือกไว้เพื่อเอาออกก่อน`; return; }
          arr.push(ch);
        }
        b.setAttribute("aria-pressed", String(arr.includes(ch)));
      }
      onChange && onChange();
    });
    chips.append(b);
  }
  if (full) chips.append(full);
  return { qid, chips };
}

// ช่องกรอก ID ที่โผล่ตามช่องทางที่เลือก
function contactHandle(data) {
  const slot = el("div", { class: "handle" });
  let input, err;
  const setError = msg => {
    if (msg) sfx("error");
    if (!input) return;
    err.replaceChildren(...(msg ? [warn(), el("span", {}, msg)] : []));
    err.hidden = !msg;
    if (msg) { input.setAttribute("aria-invalid", "true"); input.focus(); }
    else input.removeAttribute("aria-invalid");
  };
  const render = () => {
    const spec = CONTACT[data.contact];
    input = err = null;
    if (!spec) { slot.replaceChildren(); data.contactHandle = undefined; return; }
    const id = uid("handle");
    err = el("p", { class: "field-error", id: id + "-err", hidden: true });
    input = el("input", {
      type: spec.type || "text", id, value: data.contactHandle || null,
      autocomplete: spec.autocomplete || "off", inputmode: spec.inputmode || null,
      "aria-describedby": err.id,
      oninput: e => { data.contactHandle = e.target.value.trim() || undefined; setError(""); },
    });
    slot.replaceChildren(el("label", { for: id, class: "handle-label" }, spec.label), input, err);
  };
  // required = ต้องมีค่า (ตอนกดรับข่าวสาร) / ไม่ required = ว่างได้ แต่ถ้ากรอกต้องถูกรูปแบบ
  const validate = (required = false) => {
    const spec = CONTACT[data.contact];
    if (!spec) return !required;
    const v = data.contactHandle;
    if (!v) { if (required) { setError(`กรอก ${spec.short} ก่อน เราจะได้ส่งข่าวไปถูกที่`); return false; } return true; }
    if (spec.check && !spec.check(v)) { setError(spec.error); return false; }
    setError("");
    return true;
  };
  render();
  return { slot, render, validate };
}

// บัตรผ่านแบ่งเป็น 3 หน้าสั้น ๆ (ลำดับคำถามเท่าเดิมใน FORM_FIELDS)
const FORM_PAGES = [
  { title: "เธอคือใคร", ids: ["nickname", "grade", "track", "province"] },
  { title: "เส้นทางเลือกคณะ", ids: ["source", "factors", "stage", "experience"] },
  { title: "ส่งข่าวถึงเธอทางไหน", ids: ["contact"] },
];

function formField(fd, data, ctx) {
  if (fd.type === "text") {
    const id = uid("f_" + fd.id);
    return el("div", { class: "field" },
      el("label", { for: id }, fd.label),
      el("input", { type: "text", id, autocomplete: "off", value: data[fd.id] || null, oninput: e => (data[fd.id] = e.target.value.trim() || undefined) }));
  }
  const isContact = fd.id === "contact";
  if (isContact) ctx.handle = contactHandle(data);
  const other = !isContact && fd.choices.includes(OTHER) ? otherInput(fd, data) : null;
  const { qid, chips } = chipGroup(fd, data, isContact ? () => ctx.handle.render() : other && (() => other.render(true)));
  return el("div", { class: "field" }, el("span", { class: "q", id: qid }, fd.label), chips,
    isContact && ctx.handle.slot, other && other.slot);
}

// เลือก "อื่น ๆ" แล้วมีช่องให้พิมพ์คำตอบเอง (ไม่บังคับกรอก) เอาออกแล้วคำตอบที่พิมพ์ไว้ก็หายไปด้วย
const OTHER = "อื่น ๆ";
function otherInput(fd, data) {
  const key = fd.id + "Other";
  const slot = el("div", { class: "handle" });
  const render = (focus = false) => {
    const on = fd.type === "single" ? data[fd.id] === OTHER : (data[fd.id] || []).includes(OTHER);
    if (!on) { slot.replaceChildren(); data[key] = undefined; return; }
    if (slot.firstChild) return;
    const id = uid("other");
    const input = el("input", { type: "text", id, autocomplete: "off", value: data[key] || null,
      oninput: e => (data[key] = e.target.value.trim() || undefined) });
    slot.replaceChildren(el("label", { for: id, class: "handle-label" }, "พิมพ์คำตอบของเธอ"), input);
    if (focus) input.focus();
  };
  render();
  return { slot, render };
}

function form(_, page = 0) {
  const data = state.form;
  const p = FORM_PAGES[page];
  const last = page === FORM_PAGES.length - 1;
  const ctx = {};
  const fields = p.ids.map(id => formField(FORM_FIELDS.find(fd => fd.id === id), data, ctx));

  // ข้าม = ไม่ส่งข้อมูลในบัตร (บอกไว้ตรง ๆ) แต่ผลลัพธ์ยังรออยู่เหมือนเดิม
  const skip = () => { state.form = {}; saveRecord(); next(); };
  const submit = () => {
    if (ctx.handle && !ctx.handle.validate()) return;
    if (data.contact && data.contactHandle) state.subscribed = true;
    saveRecord(); next();
  };
  const go = n => { if (!busy) { sfx("page"); form(null, n); } };

  show(el("section", { class: "card pass" },
    el("div", { class: "pass-top" },
      el("span", { class: "pass-step" }, `บัตรหน้า ${page + 1} / ${FORM_PAGES.length}`),
      el("button", { type: "button", class: "link-btn", onclick: skip, "aria-describedby": "passNote" }, "ข้ามไปดูผลลัพธ์", chev()),
      el("span", { class: "pass-note", id: "passNote" }, "ข้ามแล้ว ข้อมูลในบัตรจะไม่ถูกส่ง")),
    el("h2", {}, page === 0 ? "บัตรผ่านนักเดินทาง" : p.title),
    page === 0
      ? el("p", { class: "dim" }, `ก่อนเธอจะก้าวขึ้นเวทีใหญ่ ผู้เฝ้าประตูขอดูบัตรผ่านสักใบ ผลลัพธ์ของเธอรออยู่หน้าถัดไปเสมอ จะกรอกเท่าที่สะดวกหรือข้ามทั้งหมดก็ได้`)
      : null,
    page === 0 && el("h3", { class: "pass-sub" }, p.title),
    ...fields,
    last && el("p", { class: "consent" }, FORM_CONSENT),
    el("div", { class: "actions" },
      last
        ? el("button", { type: "button", class: "btn", onclick: submit }, "ยื่นบัตรผ่าน")
        : el("button", { type: "button", class: "btn", onclick: () => go(page + 1) }, "หน้าถัดไป", chev()),
      page > 0 && el("button", { type: "button", class: "btn ghost", onclick: () => go(page - 1) }, chev(true), "ย้อนกลับ"))));
}

// ---------- ส่งข้อมูลถึง SDM ----------
// ส่งไปที่ leadEndpoint (config.js) ถ้าส่งไม่ออกจะเข้าคิวในเครื่องแล้วลองใหม่เมื่อกลับมาออนไลน์
const Leads = (() => {
  const LOCAL = "imagineCity.records", PENDING = "imagineCity.pending";
  const endpoint = (window.IMAGINE_CONFIG || {}).leadEndpoint || "";
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage ใช้ไม่ได้ ก็เล่นต่อได้ */ } };
  const upsert = (k, rec) => write(k, read(k).filter(r => r.id !== rec.id).concat([rec]));
  const drop = (k, id) => write(k, read(k).filter(r => r.id !== id));

  if (!endpoint) console.warn("[Imagine City] ยังไม่ได้ตั้ง leadEndpoint ใน config.js: ข้อมูลผู้เล่นถูกเก็บในเครื่องเท่านั้น ไม่ถึง SDM");

  async function post(rec) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(rec),
      keepalive: true,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
  }

  // คืนค่า "sent" | "queued" | "local"
  async function save(rec) {
    upsert(LOCAL, rec);
    if (!endpoint) return "local";
    try { await post(rec); drop(PENDING, rec.id); return "sent"; }
    catch (e) { upsert(PENDING, rec); return "queued"; }
  }

  let flushing = false;
  async function flush() {
    if (!endpoint || flushing) return;
    flushing = true;
    for (const rec of read(PENDING)) {
      try { await post(rec); drop(PENDING, rec.id); } catch (e) { break; }
    }
    flushing = false;
  }
  addEventListener("online", flush);
  flush();
  return { save };
})();

function saveRecord() {
  return Leads.save({
    id: state.id, at: new Date().toISOString(),
    scores: state.scores, answers: state.answers, districtPicks: state.districtPicks,
    result: finalResult(), form: state.form, subscribed: state.subscribed,
  });
}

// ---------- ภาพผลลัพธ์สำหรับแชร์ (แนวตั้ง 4:5 ลงสตอรี่/ฟีดได้) ----------
// วาดด้วย canvas จากของจริงบนหน้า: กระดาษ ปาดสีชมพู/มินต์ มาสคอต ชื่อผลลัพธ์ และสาขา
const segmentTH = text => (window.Intl && Intl.Segmenter)
  ? [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map(s => s.segment)
  : [...text];
function wrapCanvas(ctx, text, maxW) {
  const lines = [""];
  for (const w of segmentTH(text)) {
    const t = lines[lines.length - 1] + w;
    if (ctx.measureText(t).width > maxW && lines[lines.length - 1].trim()) lines.push(w.trimStart());
    else lines[lines.length - 1] = t;
  }
  return lines;
}
async function shareImage(codes, title, leadIn) {
  const W = 1080, H = 1350, INK = "#15121c", PAPER = "#f4f2f7";
  await Promise.all(['italic 700 90px "Chakra Petch"', '600 36px "Chakra Petch"', '500 34px "Bai Jamjuree"']
    .map(f => document.fonts.load(f).catch(() => {})));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
  const slash = (y, h, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, y + 120); x.lineTo(W, y); x.lineTo(W, y + h); x.lineTo(0, y + h + 120); x.fill(); };
  // ปาดสีตามธีมของตัวละคร ให้ภาพแชร์ตรงกับหน้าผลลัพธ์
  slash(430, 120, CHAR_COLOR[codes[0]]); slash(560, 70, CHAR_COLOR[codes[codes.length - 1]]);
  slash(660, 40, INK);
  // มาสคอต
  try {
    const img = new Image();
    img.src = ART.result[codes[0]];
    await img.decode();
    const iw = 1000, ih = iw * img.naturalHeight / img.naturalWidth;
    x.drawImage(img, (W - iw) / 2, 330, iw, ih);
  } catch (e) { /* ไม่มีภาพ ก็ยังได้การ์ดตัวหนังสือ */ }
  // มุมกรอบ HUD
  x.strokeStyle = INK; x.lineWidth = 8;
  x.beginPath(); x.moveTo(48, 110); x.lineTo(48, 48); x.lineTo(110, 48); x.stroke();
  x.beginPath(); x.moveTo(W - 48, H - 110); x.lineTo(W - 48, H - 48); x.lineTo(W - 110, H - 48); x.stroke();
  // หัว: ชื่อโปรเจกต์ + ประโยคนำ + ชื่อผลลัพธ์ (ย่อให้พอดีบรรทัดเดียวก่อน ถ้าไม่พอค่อยตัดสองบรรทัด)
  x.fillStyle = INK; x.textBaseline = "alphabetic";
  x.font = '600 34px "Chakra Petch"'; x.fillText("IMAGINE CITY", 96, 132);
  x.font = '500 38px "Bai Jamjuree"'; x.fillStyle = "#4d4859"; x.fillText(leadIn, 96, 196);
  x.fillStyle = INK;
  let size = 96, lines;
  do { x.font = `italic 700 ${size}px "Chakra Petch"`; lines = [title]; size -= 4; } while (x.measureText(title).width > W - 192 && size >= 64);
  if (x.measureText(title).width > W - 192) { x.font = 'italic 700 76px "Chakra Petch"'; lines = wrapCanvas(x, title, W - 192); size = 72; }
  // เงาหัวข้อเป็นสีหลักของตัวละคร ให้ตรงกับหน้าเว็บ
  lines.slice(0, 2).forEach((l, k) => {
    x.fillStyle = CHAR_COLOR[codes[0]]; x.fillText(l, 102, 296 + k * (size + 18));
    x.fillStyle = INK; x.fillText(l, 96, 290 + k * (size + 18));
  });
  // ป้ายสาขา
  let y = 1090;
  x.font = '600 36px "Chakra Petch"';
  for (const code of codes) {
    const label = `สาขา ${MAJORS[code].name}`;
    const w = Math.min(W - 192, x.measureText(label).width + 48);
    x.fillStyle = CHAR_COLOR[code]; x.fillRect(96, y, w, 70);
    x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(96, y, w, 70);
    x.fillStyle = INK; x.fillText(label, 120, y + 48, w - 48);
    y += 88;
  }
  x.font = '500 30px "Bai Jamjuree"'; x.fillStyle = "#4d4859";
  x.fillText("คืนสุดท้ายก่อนสีจะหายไป", 96, H - 80);
  return new Promise(res => c.toBlob(res, "image/png"));
}

function shareBlock(codes, title, leadIn) {
  const status = el("p", { class: "toast", role: "status" });
  const btn = el("button", { type: "button", class: "btn" }, "แชร์ผลลัพธ์");
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "กำลังทำภาพ…";
    status.textContent = "";
    try {
      const blob = await shareImage(codes, title, leadIn);
      const file = new File([blob], `imagine-city-${codes.join("-").toLowerCase()}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Imagine City", text: `ฉันคือ "${title}" ใน Imagine City` }); }
        catch (e) { if (e.name !== "AbortError") throw e; }
      } else {
        const a = el("a", { href: URL.createObjectURL(blob), download: file.name });
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        status.textContent = "บันทึกภาพผลลัพธ์แล้ว เอาไปลงสตอรี่ได้เลย";
        sfx("success");
      }
    } catch (e) {
      status.textContent = "ทำภาพไม่สำเร็จ ลองอีกครั้ง หรือแคปหน้าจอส่วนบนไปแชร์แทนก็ได้";
    }
    btn.disabled = false;
    btn.textContent = label;
  });
  return { btn, status };
}

// ชื่อผลลัพธ์: ย่อให้อยู่บรรทัดเดียวก่อน (ไม่ตัดกลางคำ) ถ้าเล็กสุดแล้วยังไม่พอ ค่อยยอมให้ตัดบรรทัด
function fitLine(n, min = 22) {
  if (!n.isConnected) return;
  n.style.fontSize = ""; n.style.whiteSpace = "nowrap";
  let s = parseFloat(getComputedStyle(n).fontSize);
  while (n.scrollWidth > n.clientWidth && s > min) { s -= 1; n.style.fontSize = s + "px"; }
  if (n.scrollWidth > n.clientWidth) n.style.whiteSpace = "";
}

// รับข่าวสาร: ถ้ายังไม่มีช่องทางติดต่อ ขอในการ์ดเลย (ไม่ใช้ modal)
function subscribeBlock() {
  const status = el("p", { class: "toast", role: "status" });
  const panelId = uid("subscribe");
  const openBtn = el("button", { type: "button", class: "btn ghost", "aria-expanded": "false", "aria-controls": panelId }, "รับข่าวกิจกรรมและทุน");
  const panel = el("div", { class: "subscribe-panel", id: panelId, hidden: true });
  const data = state.form;
  let handle, chErr;

  const done = res => {
    sfx("success");
    panel.hidden = true;
    openBtn.disabled = true;
    openBtn.textContent = "รับข่าวสารแล้ว";
    openBtn.setAttribute("aria-expanded", "false");
    status.textContent = res === "queued"
      ? "ตอนนี้ยังส่งไม่ออก เพราะอินเทอร์เน็ตขัดข้อง เราเก็บไว้ให้แล้ว และจะส่งให้เองเมื่อกลับมาออนไลน์"
      : `เรียบร้อย! SDM จะส่งข่าวกิจกรรมและทุนให้เธอทาง ${data.contact} ก่อนใคร`;
  };
  const send = async btn => {
    btn.disabled = true;
    btn.textContent = "กำลังส่ง…";
    state.subscribed = true;
    done(await saveRecord());
  };

  openBtn.addEventListener("click", () => {
    if (data.contact && data.contactHandle && contactHandle(data).validate(true)) return send(openBtn);
    if (!panel.hidden) return;
    handle = contactHandle(data);
    chErr = el("p", { class: "field-error", hidden: true });
    const { qid, chips } = chipGroup(CONTACT_FIELD, data, () => { chErr.hidden = true; handle.render(); });
    const sendBtn = el("button", { type: "button", class: "btn" }, "ส่งให้ SDM");
    sendBtn.addEventListener("click", () => {
      if (!data.contact) { chErr.replaceChildren(warn(), el("span", {}, "เลือกก่อนว่าจะให้ส่งข่าวไปทางไหน")); chErr.hidden = false; sfx("error"); chips.querySelector(".chip").focus(); return; }
      if (!handle.validate(true)) return;
      send(sendBtn);
    });
    panel.replaceChildren(
      el("div", { class: "field" }, el("span", { class: "q", id: qid }, "ให้ SDM ส่งข่าวไปทางไหนดี"), chips, chErr, handle.slot),
      el("div", { class: "actions" }, sendBtn));
    panel.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    chips.querySelector(".chip").focus();
  });

  return { openBtn, panel, status };
}

// กรอกฟอร์มเสร็จแล้วไปการ์ดผลลัพธ์ทันที (การ์ดจุดพลุสีทั่วเมืองเอง)
function result() {
  City.setProgress(1);
  resultCard(finalResult());
}

// เสียงตอนบอกผล: ตั้งจังหวะตรงกับแอนิเมชันของการ์ดผลลัพธ์ใน style.css
let sfxT = [];
const later = (ms, fn) => sfxT.push(setTimeout(fn, ms));
function resultSounds(card, codes) {
  const colors = codes.map(c => MAJORS[c].color);
  if (reduceMotion()) {   // ลดการเคลื่อนไหว: เหลือแค่เสียงบอกผลกับป้ายประทับ
    later(150, () => sfx("reveal", colors));
    later(900, () => sfx("stamp", colors[0]));
    return;
  }
  const dOf = n => parseFloat((n && n.style.getPropertyValue("--d")) || 0) * 1000;
  sfx("drumroll", 0.88);
  later(930, () => sfx("reveal", colors));
  later(720, () => sfx("snap"));
  if (!card.querySelector(".result-art.absent")) later(860, () => sfx("rise"));
  const pills = card.querySelectorAll(".career-pills li");
  const pd = dOf(pills[0] && pills[0].closest(".result-block"));
  pills.forEach((li, i) => later(pd + 260 + i * 50, () => sfx("bubble", i)));
  const majors = card.querySelectorAll(".result-major");
  const md = dOf(majors[0] && majors[0].closest(".result-block"));
  majors.forEach((m, i) => later(md + 620 + i * 140, () => sfx("stamp", colors[i] || colors[0])));
}

// สีตัวละครกระจายจากป้ายสาขาออกไปทั้งจอ + สีพุ่ง เสียงขยาย ไกด์ดีใจ
function themeSpread(card, codes) {
  const mb = [...card.querySelectorAll(".result-major")].pop() || card;
  const r = mb.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const root = document.documentElement.style;
  root.setProperty("--ox", `${Math.round(x)}px`);
  root.setProperty("--oy", `${Math.round(y)}px`);
  setTheme(codes);
  const colors = codes.map(c => CHAR_COLOR[c]);
  sfx("swell", colors);
  City.burst(x, y, colors[0], 40);
  later(250, () => City.celebrate(colors));
  later(900, () => City.say("สีของเธอเต็มเมืองแล้ว!", 2400));
}

function resultCard(codes) {
  const title = codes.length === 2
    ? (MIXED[codes.join("+")] || MIXED[codes.slice().reverse().join("+")])
    : RESULTS[codes[0]].title;
  const leadIn = codes.length === 2 ? "เธอเป็นสองแบบพอ ๆ กัน" : "เธอคือนักเดินทางแบบ";

  // ให้ช่องทางติดต่อไว้แล้วในบัตรผ่าน: ไม่ต้องขอซ้ำ บอกแค่ว่าข่าวจะไปทางไหน
  const sub = state.subscribed ? null : subscribeBlock();
  const share = shareBlock(codes, title, leadIn);
  const name = el("span", { class: "name" }, title);
  const art = artSlot(ART.result[codes[0]], `ตัวละครของผลลัพธ์ "${RESULTS[codes[0]].title}" (พื้นหลังโปร่งใส)`, "1600×1131", "result-art");

  const card = el("section", { class: "card result", style: `--c:${CHAR_COLOR[codes[0]]};--c2:${CHAR_COLOR[codes[codes.length - 1]]};--char:${CHAR_COLOR[codes[0]]}` },
    el("h1", { class: "result-title" }, el("span", { class: "burst", "aria-hidden": "true" }), el("span", { class: "lead-in" }, leadIn), name),
    art,
    // ผลผสมไม่เล่าสองเรื่องซ้อนกัน: บอกว่าเข้ากับใคร > อาชีพรวมเป็นชิปชุดเดียว > เรียนที่ไหนบรรทัดเดียว
    codes.length === 1 && el("p", {}, RESULTS[codes[0]].story),
    codes.length === 2 && el("div", { class: "result-block" },
      el("h2", { class: "result-h" }, "เธอมีความเข้ากันได้กับ"),
      el("p", { class: "match" }, codes.map(c => RESULTS[c].title).join(" และ "))),
    el("div", { class: "result-block" },
      el("h2", { class: "result-h" }, "อาชีพที่อาจจะเหมาะกับเธอ"),
      el("ul", { class: "career-pills" }, careerPills(codes))),
    el("div", { class: "result-block" },
      el("h2", { class: "result-h" }, "เรียนได้ที่ School of Digital Media (SDM)"),
      el("p", { class: "majors" }, codes.flatMap((c, i) => [
        i > 0 && el("span", { class: "and" }, "และ"),
        el("span", { class: "result-major", style: `--c:${CHAR_COLOR[c]}` }, MAJORS[c].name)]))),
    el("p", { class: "closing" }, "ไม่ว่าเธอจะเป็นนักเดินทางแบบไหน เมืองนี้ยังมีที่ว่างรออยู่"),
    el("div", { class: "actions" },
      share.btn,
      sub && sub.openBtn,
      el("button", { type: "button", class: "link-btn", onclick: () => { reset(); next(); } }, "เล่นอีกครั้ง")),
    share.status,
    sub ? [sub.panel, sub.status] : el("p", { class: "toast" }, `SDM จะส่งข่าวกิจกรรมและทุนให้เธอทาง ${state.form.contact} ก่อนใคร`));

  // ลำดับการโผล่: ชื่อกระแทก > ภาพตัวละคร > บล็อกที่เหลือทยอยตามกัน (CSS อ่าน --d เป็นวินาที)
  [...card.children].slice(2).forEach((c, i) => c.style && c.style.setProperty("--d", (1.05 + i * 0.12).toFixed(2)));
  card.querySelectorAll(".career-pills li").forEach((li, i) => li.style.setProperty("--i", i));
  show(card);
  resultSounds(card, codes);
  // พื้นหลังเปลี่ยนเป็นสีตัวละครหลังการ์ดเผยผลครบ (ป้ายสาขาประทับเสร็จ) ไม่แย่งจังหวะบอกผล
  const mb = card.querySelector(".result-major");
  const stampAt = parseFloat((mb && mb.closest(".result-block").style.getPropertyValue("--d")) || 1.6) * 1000 + 700;
  later(reduceMotion() ? 500 : stampAt + 350, () => themeSpread(card, codes));
  const fit = () => fitLine(name);
  setTimeout(() => document.fonts.ready.then(fit), reduceMotion() ? 160 : 320);
  const onResize = () => (name.isConnected ? fit() : removeEventListener("resize", onResize));
  addEventListener("resize", onResize);
}

// ---------- เครื่องมือ dev (เปิดด้วย ?dev) ----------
// กระโดดไปหน้าผลลัพธ์แบบไหนก็ได้ทันที ไม่ต้องเล่น 11 ฉาก (สุ่มอาชีพที่เลือกในย่านให้)
function devJump(codes) {
  if (busy) return;
  reset();
  state.queue = [];
  for (const c of codes) {
    const opts = DISTRICTS[c].options;
    state.districtPicks[c] = opts[Math.floor(Math.random() * opts.length)][1];
  }
  hud.hidden = true;
  bgm("result");
  syncHud();
  City.setProgress(1);
  resultCard(codes);
}
if (DEV) {
  const pick = el("select", { "aria-label": "เลือกผลลัพธ์" },
    ORDER.map(c => el("option", { value: c }, `${c} · ${RESULTS[c].title}`)),
    Object.keys(MIXED).map(k => el("option", { value: k.replace("+", ",") }, `${k} · ${MIXED[k]}`)));
  document.body.append(el("div", { class: "dev-bar" },
    el("b", {}, "DEV"), pick,
    el("button", { type: "button", onclick: () => devJump(pick.value.split(",")) }, "ไปหน้าผลลัพธ์")));
}

reset();
next();
