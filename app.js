// Flow + ระบบคำนวณคะแนน
const ORDER = ["DGA", "DGD", "IGD", "AFX", "DEN"];
const SCORED = ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "gate", "4.1", "4.2", "5.1", "5.2"];
const stage = document.getElementById("stage");
const hud = document.getElementById("hud");
const hudLabel = document.getElementById("hudLabel");
const meter = document.getElementById("meter");
const hudCount = document.getElementById("hudCount");

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
function reset() {
  state = {
    id: newId(),        // หนึ่งรอบเล่น = หนึ่งเรคคอร์ด
    scores: Object.fromEntries(ORDER.map(k => [k, 0])),
    answers: {},        // sceneId -> code
    districtPicks: {},  // code -> career ที่เลือกในย่าน
    form: {},
    subscribed: false,
    queue: [
      { type: "intro" }, { type: "howto" },
      { type: "chapter", n: 1 }, { type: "scene", id: "1.1" }, { type: "scene", id: "1.2" }, { type: "scene", id: "1.3" },
      { type: "chapter", n: 2 }, { type: "scene", id: "2.1" }, { type: "scene", id: "2.2" }, { type: "scene", id: "2.3" },
      { type: "districts" }, // แตกเป็นย่านจริงหลังฉาก 2.3
      { type: "scene", id: "gate" },
      { type: "chapter", n: 4 }, { type: "scene", id: "4.1" }, { type: "scene", id: "4.2" },
      { type: "chapter", n: 5 }, { type: "scene", id: "5.1" }, { type: "scene", id: "5.2" },
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
  chapter: s => CHAPTERS[s.n].title,
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

// ช่องภาพประกอบจากทีมวาด: ถ้ายังไม่มีไฟล์ จะแสดงป้ายบอกว่าต้องวาดอะไร ขนาดเท่าไร วางไฟล์ที่ไหน
function artSlot(src, what, size, cls = "") {
  const box = el("figure", { class: "art " + cls });
  const img = el("img", { src, alt: "" });
  img.addEventListener("error", () => box.classList.add("missing"));
  box.append(img, el("figcaption", {}, el("b", {}, "รอภาพจากทีมวาด"), what, el("br"), el("code", {}, `${size} · ${src}`)));
  return box;
}

let busy = false; // กันกดซ้ำระหว่างเปลี่ยนฉาก (ไม่งั้นฉากถัดไปจะถูกข้าม)
function show(card) {
  busy = true;
  const old = stage.firstElementChild;
  const put = () => {
    busy = false;
    stage.replaceChildren(card);
    (document.scrollingElement || document.documentElement).scrollTop = 0;
    // โฟกัสที่หัวเรื่อง: โปรแกรมอ่านหน้าจออ่านเรื่องและคำถามก่อน แล้วค่อยถึงตัวเลือก
    const f = card.querySelector("[data-focus]") || card.querySelector("h1, h2");
    if (f) { if (!f.matches("button")) f.tabIndex = -1; f.focus({ preventScroll: true }); }
  };
  if (old) { old.classList.add("leaving"); setTimeout(put, reduceMotion() ? 150 : 300); } else put();
}

function next() {
  if (busy) return;
  const step = state.queue.shift();
  if (step.type === "districts") {
    const codes = districtCodes();
    state.queue.unshift({ type: "chapter", n: 3, codes }, ...codes.map(code => ({ type: "district", code })));
    return next();
  }
  hud.hidden = ["intro", "howto", "result"].includes(step.type);
  if (HUD_LABEL[step.type]) hudLabel.textContent = HUD_LABEL[step.type](step);
  ({ intro, howto, chapter, scene, district, form, result })[step.type](step);
}

// ---------- screens ----------
function intro() {
  show(el("section", { class: "cover" },
    el("div", { class: "cover-head bracket" },
      el("h1", {}, "คืนสุดท้ายก่อนสีจะหายไป"),
      el("p", {}, "คืนนี้สีสันของ Imagine City กำลังจะหายไปทั้งเมือง และมีเธอเป็นคนเดียวที่ช่วยได้")),
    artSlot(ART.hero, "ตัวละครหลักกับเมือง Imagine City (พื้นหลังโปร่งใส)", "1080×1350"),
    el("div", { class: "cover-foot" },
      el("p", { class: "dim" }, "ทุกอย่างซีดเป็นสีเทา เหลือเวลาอีกแค่คืนเดียว ถ้ามีใครขึ้นเวทีในเทศกาล Imagine Design Event แล้วทำให้คนทั้งเมืองกลับมายิ้มได้ สีทั้งหมดก็จะกลับมา"),
      el("div", { class: "actions" }, el("button", { type: "button", class: "btn", onclick: next }, chev(true), "ลืมตาตื่น", chev())))));
}

function howto() {
  show(el("section", { class: "card" },
    el("h2", {}, "ดวงไฟดวงเล็ก ๆ ลอยอยู่ตรงหน้า"),
    el("p", {}, "มันบอกว่าจะนำทางให้ แต่ต้องให้เธอเป็นคนตัดสินใจเองทุกอย่าง"),
    el("ul", { class: "rules" },
      el("li", {}, "ไม่มีคำตอบถูกหรือผิด เลือกข้อที่ใกล้ใจเธอที่สุดในตอนนี้"),
      el("li", {}, "อย่าคิดนาน ข้อที่นึกถึงก่อนมักเป็นข้อที่ใช่"),
      el("li", {}, "ทุกคำตอบจะคืนสีให้เมืองทีละนิด")),
    el("div", { class: "actions" }, el("button", { type: "button", class: "btn", onclick: next }, "ออกเดินทาง"))));
}

function chapter({ n, codes }) {
  const ch = CHAPTERS[n];
  const extra = codes && codes.length > 1 ? "เธอลังเลระหว่างสองทาง ดวงไฟเลยพาไปให้ดูทั้งสองย่าน" : null;
  show(el("section", { class: "card" },
    el("h2", {}, ch.title),
    el("p", {}, ch.text),
    extra && el("p", { class: "dim" }, extra),
    el("div", { class: "actions" }, el("button", { type: "button", class: "btn", onclick: next }, "ไปต่อ"))));
}

// ---------- cutscene แบบสตอรี่ ----------
// แตะขวา (2/3 ของจอ) = เฟรมถัดไป, แตะซ้าย = ย้อน, กดค้าง = หยุด, คีย์บอร์ด: ← → Space
const HOLD_MS = 220;
let missingWarned = false;
function framesFor(key, pickKey, label) {
  const f = CUTSCENES[key] && CUTSCENES[key][pickKey];
  if (f && f.length) return f;
  if (!missingWarned) { console.warn("[Imagine City] ยังไม่มีบท cutscene บางฉากใน CUTSCENES (data.js): จะแสดงป้ายรอบทแทน"); missingWarned = true; }
  return [{ text: `[รอบท cutscene: ${label} · ${pickKey}]`, placeholder: true }];
}
const frameMs = text => Math.min(7000, Math.max(3200, 2600 + text.length * 55));
// ภาษาไทยใช้ช่องว่างแบ่งวลี: ห่อแต่ละวลีเป็น inline-block ให้ตัดบรรทัดที่ช่องว่างเท่านั้น
// (ไม่ตัดกลางคำ ไม่เหลือคำเดียวโด่ง) วลีที่ยาวเกินบรรทัดจะตัดภายในกล่องของมันเอง
// CSS ย่อกล่องให้พอดีบรรทัดที่ตัดแล้วไม่ได้ จึงวัดบรรทัดที่กว้างสุดแล้วตั้งความกว้างเอง
// วัดจากกรอบของตัวอักษรจริงทุกบรรทัด (รวมวลีที่ตัดภายในตัวเอง) แล้ววัดใหม่เมื่อเปลี่ยนขนาดจอ
// กล่องหมุนแค่ 2° ทำให้ขอบเลื่อนไม่เกิน ~2px จึงเผื่อ 3px
function shrinkWrap(box) {
  box.style.width = "";
  const range = document.createRange();
  let l = Infinity, r = -Infinity;
  for (const p of box.querySelectorAll(".phrase")) {
    range.selectNodeContents(p);
    for (const rc of range.getClientRects()) { l = Math.min(l, rc.left); r = Math.max(r, rc.right); }
  }
  if (!isFinite(l)) return;
  const cs = getComputedStyle(box);
  const extra = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
  box.style.width = Math.ceil(r - l + extra + 3) + "px";
}
const phrases = text => text.split(" ").flatMap((p, k) => k ? [" ", el("span", { class: "phrase" }, p)] : [el("span", { class: "phrase" }, p)]);

function story({ frames, color, picked, done }) {
  hud.hidden = true;
  let i = -1, finished = false, holdTimer = 0, held = false;
  const bars = frames.map(() => el("i", {}, el("span")));
  const who = el("span", { class: "story-name" });
  const sticker = el("p", { class: "story-sticker", "aria-live": "polite" });
  const artImg = el("img", { alt: "" });
  const art = el("div", { class: "story-art", hidden: true }, artImg);
  artImg.addEventListener("error", () => { art.hidden = true; });
  const pauseBtn = el("button", { type: "button", class: "story-pause", "aria-label": "หยุดชั่วคราว", "aria-pressed": "false" });
  const root = el("section", { class: "story", "aria-label": "cutscene ของคำตอบ", style: `--c:${color}` },
    el("div", { class: "story-bars", "aria-hidden": "true" }, bars),
    el("div", { class: "story-who" }, el("b", { class: "orb-dot", "aria-hidden": "true" }), who),
    art,
    el("p", { class: "story-pick" }, el("span", { class: "visually-hidden" }, "เธอเลือก: "), phrases(picked)),
    sticker);
  const prev = el("button", { type: "button", class: "story-zone prev", "aria-label": "เฟรมก่อนหน้า" });
  const fwd = el("button", { type: "button", class: "story-zone next", "aria-label": "เฟรมถัดไป", "data-focus": "" });
  const skip = el("button", { type: "button", class: "story-skip" }, "ข้าม");
  root.append(prev, fwd, skip, pauseBtn);
  if (!state.storyHinted) {
    state.storyHinted = true;
    root.append(el("p", { class: "story-hint", "aria-hidden": "true" }, "แตะขวาเพื่อไปต่อ · กดค้างเพื่อหยุด"));
  }

  const focusX = City.paint(color);
  const setPaused = on => {
    root.classList.toggle("paused", on);
    pauseBtn.setAttribute("aria-pressed", String(on));
    pauseBtn.setAttribute("aria-label", on ? "เล่นต่อ" : "หยุดชั่วคราว");
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    document.removeEventListener("visibilitychange", onHide);
    City.focus(0.5, 1);
    // ถ้ากดข้ามระหว่างที่จอยังเปลี่ยนฉากอยู่ รอให้เปลี่ยนเสร็จก่อน ไม่งั้น next() จะถูกปัดทิ้ง
    const callDone = () => (busy ? setTimeout(callDone, 50) : done());
    callDone();
  };
  const go = n => {
    if (finished) return;
    if (n < 0) n = 0;
    if (n >= frames.length) return finish();
    i = n;
    const fr = frames[i];
    bars.forEach((b, k) => {
      b.className = k < i ? "done" : k === i ? "now" : "";
      b.firstChild.style.animationDuration = "";
    });
    // เริ่มแอนิเมชันแถบใหม่ทุกครั้ง (แม้ย้อนกลับมาเฟรมเดิม)
    const span = bars[i].firstChild;
    span.style.animation = "none"; void span.offsetWidth; span.style.animation = "";
    span.style.setProperty("--dur", frameMs(fr.text) + "ms");
    who.textContent = fr.speaker || "";
    art.hidden = !fr.img;
    if (fr.img) artImg.src = fr.img;
    sticker.replaceChildren(...phrases(fr.text));
    sticker.classList.toggle("placeholder", !!fr.placeholder);
    sticker.classList.remove("in"); void sticker.offsetWidth; sticker.classList.add("in");
    City.focus(focusX, 1.08 + i * 0.06);
    setPaused(false);
  };
  bars.forEach((b, k) => b.firstChild.addEventListener("animationend", () => { if (k === i && !finished) go(i + 1); }));

  // แตะ = เปลี่ยนเฟรม, กดค้าง = หยุดจนกว่าจะปล่อย
  for (const [zone, step] of [[prev, -1], [fwd, 1]]) {
    zone.addEventListener("pointerdown", () => {
      held = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => { held = true; setPaused(true); }, HOLD_MS);
    });
    const release = () => { clearTimeout(holdTimer); if (held) setPaused(false); };
    zone.addEventListener("pointerup", release);
    zone.addEventListener("pointercancel", release);
    zone.addEventListener("pointerleave", release);
    zone.addEventListener("contextmenu", e => e.preventDefault());
    zone.addEventListener("click", () => { if (held) { held = false; return; } go(i + step); });
  }
  root.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
  });
  pauseBtn.addEventListener("click", () => setPaused(!root.classList.contains("paused")));
  skip.addEventListener("click", finish);
  const onHide = () => { if (document.hidden) setPaused(true); };
  document.addEventListener("visibilitychange", onHide);

  show(root);
  const pick = root.querySelector(".story-pick");
  const fit = () => { if (pick.isConnected) shrinkWrap(pick); };
  const onResize = () => (pick.isConnected ? fit() : removeEventListener("resize", onResize));
  addEventListener("resize", onResize);
  // เริ่มเฟรมแรกหลังการ์ดเดิมจางออก
  setTimeout(() => { document.fonts.ready.then(fit); go(0); }, reduceMotion() ? 160 : 320);
}

const KEYS = ["ก", "ข", "ค", "ง", "จ"];
function choiceList(options, onPick, colorOf, labelId, onDone) {
  const box = el("div", { class: "options", role: "group", "aria-labelledby": labelId });
  for (const opt of shuffle(options)) {
    const b = el("button", { type: "button", class: "option" },
      el("span", { class: "opt-key", "aria-hidden": "true" }, KEYS[box.children.length] || ""),
      el("span", {}, opt[0]), chev());
    b.addEventListener("click", ev => {
      if (box.classList.contains("locked")) return;
      box.classList.add("locked");
      box.querySelectorAll(".option").forEach(o => o !== b && o.setAttribute("aria-disabled", "true"));
      const color = colorOf(opt);
      b.style.setProperty("--pick", color);
      b.classList.add("picked");
      const r = b.getBoundingClientRect();
      City.burst(ev.clientX || r.left + r.width / 2, ev.clientY || r.top + r.height / 2, color);
      onPick(opt);
      setTimeout(() => onDone(opt, color), 650);
    });
    box.append(b);
  }
  return box;
}

function scene({ id }) {
  const s = SCENES[id];
  const pid = uid("prompt");
  show(el("section", { class: "card" },
    el("h2", {}, s.title.replace(/^ฉาก [\d.]+ /, "")),
    el("p", { id: pid }, s.prompt),
    choiceList(s.options, ([, code]) => {
      state.answers[id] = code;
      state.scores[code]++;
      updateHud();
    }, ([, code]) => MAJORS[code].color, pid,
    ([text, code], color) => story({ frames: framesFor(id, code, `ฉาก ${id}`), color, picked: text, done: next }))));
}

function district({ code }) {
  const d = DISTRICTS[code];
  const pid = uid("prompt");
  show(el("section", { class: "card" },
    el("h2", {}, d.title),
    el("p", { id: pid }, d.prompt),
    choiceList(d.options, ([, career]) => { state.districtPicks[code] = career; }, () => MAJORS[code].color, pid,
      ([text, career], color) => story({ frames: framesFor("district:" + code, career, d.title), color, picked: text, done: next }))));
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
        if (i >= 0) arr.splice(i, 1);
        else { if (fd.max && arr.length >= fd.max) return; arr.push(ch); }
        b.setAttribute("aria-pressed", String(arr.includes(ch)));
      }
      onChange && onChange();
    });
    chips.append(b);
  }
  return { qid, chips };
}

// ช่องกรอก ID ที่โผล่ตามช่องทางที่เลือก
function contactHandle(data) {
  const slot = el("div", { class: "handle" });
  let input, err;
  const setError = msg => {
    if (!input) return;
    err.textContent = msg || "";
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

function form() {
  const data = state.form;
  let handle;
  const fields = FORM_FIELDS.map(fd => {
    if (fd.type === "text") {
      const id = uid("f_" + fd.id);
      return el("div", { class: "field" },
        el("label", { for: id }, fd.label),
        el("input", { type: "text", id, autocomplete: "off", value: data[fd.id] || null, oninput: e => (data[fd.id] = e.target.value.trim() || undefined) }));
    }
    const isContact = fd.id === "contact";
    if (isContact) handle = contactHandle(data);
    const { qid, chips } = chipGroup(fd, data, isContact ? () => handle.render() : null);
    return el("div", { class: "field" }, el("span", { class: "q", id: qid }, fd.label), chips, isContact && handle.slot);
  });

  show(el("section", { class: "card" },
    el("h2", {}, "บัตรผ่านนักเดินทาง"),
    el("p", { class: "dim" }, "ก่อนเธอจะก้าวขึ้นเวทีใหญ่ ผู้เฝ้าประตูขอดูบัตรผ่านสักใบ กรอกเท่าที่สะดวก ข้อไหนไม่อยากตอบก็ข้ามได้"),
    ...fields,
    el("div", { class: "actions" },
      el("button", { type: "button", class: "btn", onclick: () => { if (!handle.validate()) return; saveRecord(); next(); } }, "ยื่นบัตรผ่าน"),
      el("button", { type: "button", class: "btn ghost", onclick: () => { state.form = {}; saveRecord(); next(); } }, "ข้ามไปก่อน"))));
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

// ตราผลลัพธ์ วาดด้วย SVG จากคะแนนจริง (วงละสาขา)
function badge(codes) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "-60 -60 120 120");
  svg.setAttribute("class", "result-badge");
  svg.setAttribute("aria-hidden", "true");
  const max = Math.max(...Object.values(state.scores), 1);
  ORDER.forEach((code, i) => {
    const a0 = (i / 5) * Math.PI * 2 - Math.PI / 2, a1 = a0 + Math.PI * 2 / 5 - 0.08;
    const r = 18 + (state.scores[code] / max) * 36;
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", `M0 0 L${Math.cos(a0) * r} ${Math.sin(a0) * r} A${r} ${r} 0 0 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r} Z`);
    p.setAttribute("fill", MAJORS[code].color);
    p.setAttribute("opacity", codes.includes(code) ? "1" : "0.3");
    svg.append(p);
  });
  const dot = document.createElementNS(NS, "circle");
  dot.setAttribute("r", "9"); dot.setAttribute("fill", "#15121c");
  svg.append(dot);
  return svg;
}

// รับข่าวสาร: ถ้ายังไม่มีช่องทางติดต่อ ขอในการ์ดเลย (ไม่ใช้ modal)
function subscribeBlock() {
  const status = el("p", { class: "toast", role: "status" });
  const panelId = uid("subscribe");
  const openBtn = el("button", { type: "button", class: "btn", "aria-expanded": "false", "aria-controls": panelId }, "รับข่าวกิจกรรมและทุน");
  const panel = el("div", { class: "subscribe-panel", id: panelId, hidden: true });
  const data = state.form;
  let handle, chErr;

  const done = res => {
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
      if (!data.contact) { chErr.textContent = "เลือกก่อนว่าจะให้ส่งข่าวไปทางไหน"; chErr.hidden = false; chips.querySelector(".chip").focus(); return; }
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

function result() {
  const codes = finalResult();
  const title = codes.length === 2
    ? (MIXED[codes.join("+")] || MIXED[codes.slice().reverse().join("+")])
    : RESULTS[codes[0]].title;

  City.setProgress(1);
  City.celebrate(codes.map(c => MAJORS[c].color));

  const max = Math.max(...Object.values(state.scores), 1);
  const sub = subscribeBlock();

  show(el("section", { class: "card" },
    artSlot(ART.result[codes[0]], `ตัวละครของผลลัพธ์ "${RESULTS[codes[0]].title}" (พื้นหลังโปร่งใส)`, "1080×1080", "result-art"),
    badge(codes),
    el("h1", { class: "result-title" },
      el("span", { class: "lead-in" }, codes.length === 2 ? "เธอเป็นสองแบบพอ ๆ กัน" : "เธอคือนักเดินทางแบบ"),
      title),
    ...codes.map(code => {
      const { pick, rest } = careersFor(code);
      return el("div", {},
        codes.length === 2 && el("h2", { class: "sub" }, RESULTS[code].title),
        el("p", {}, RESULTS[code].story),
        el("span", { class: "result-major", style: `--c:${MAJORS[code].color}` }, `เรียนได้ที่ สาขา ${MAJORS[code].name}`),
        el("ul", { class: "careers" },
          pick && el("li", { class: "top" }, pick),
          rest.map(c => el("li", {}, c))));
    }),
    el("p", { class: "dim score-label" }, "คะแนนตลอดเส้นทาง"),
    el("div", { class: "score-bars" }, ranking().map(code =>
      el("div", { class: "score-row" },
        el("span", {}, code),
        el("div", { class: "bar" }, el("span", { style: `--c:${MAJORS[code].color};width:${state.scores[code] / max * 100}%` })),
        el("span", {}, String(state.scores[code]))))),
    el("p", {}, "ไม่ว่าเธอจะเป็นนักเดินทางแบบไหน เมืองนี้ยังมีที่ว่างรออยู่"),
    el("div", { class: "actions" },
      sub.openBtn,
      el("button", { type: "button", class: "btn ghost", onclick: () => { reset(); next(); } }, "เล่นอีกครั้ง")),
    sub.panel,
    sub.status));
}

reset();
next();
