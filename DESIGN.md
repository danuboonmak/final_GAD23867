---
name: Imagine City
description: A manga-zine story quiz about a city that lost its color; every answer inks it back in.
colors:
  paper: "#f4f2f7"
  panel: "#ffffff"
  ink: "#15121c"
  ink-dim: "#4d4859"
  line: "rgba(21, 18, 28, .22)"
  track: "rgba(21, 18, 28, .14)"
  pink: "#ff3ea5"
  mint: "#35e0b4"
  danger: "#c4124f"
  orb: "#ffb347"
  major-dga: "#ff5d8f"
  major-dgd: "#ffb627"
  major-igd: "#3ddc97"
  major-afx: "#4cc9f0"
  major-den: "#9b5de5"
typography:
  display:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "clamp(34px, 9.6vw, 58px)"
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "clamp(30px, 8vw, 46px)"
    fontWeight: 700
    lineHeight: 1.35
  title:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "clamp(23px, 5.6vw, 30px)"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Bai Jamjuree, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
  option:
    fontFamily: "Bai Jamjuree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.6
  button:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "0.02em"
  label:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  key: "3px"
  control: "4px"
  panel: "6px"
  counter: "99px"
spacing:
  hair: "4px"
  sm: "8px"
  md: "12px"
  lg: "22px"
  card-x: "24px"
  card-y: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.button}"
    padding: "10px 34px"
    height: "54px"
  button-ghost:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    padding: "10px 34px"
    height: "54px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "28px 24px"
    width: "620px"
  option-row:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  option-key:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    rounded: "{rounded.key}"
    size: "34px"
  chip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
    padding: "6px 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "48px"
  counter-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.label}"
    rounded: "{rounded.counter}"
    padding: "6px 12px"
  career-tag:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "5px 12px"
  career-tag-top:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    rounded: "{rounded.control}"
    padding: "5px 12px"
---

# Design System: Imagine City

## Overview

**Creative North Star: "The City Inked Back In"**

Imagine City is a manga zine printed on cool paper. The city behind every screen starts as black-and-white line art: ink strokes, flat white faces, registration crosses scattered across the sky. Each answer paints one building in the chosen major's color and lets more of the hot-pink and mint wash show through, until the reveal screen shows the whole city in color. Interface pieces sit on top of the city like pasted-in zine panels: white boxes with thin ink borders, HUD corner brackets, black hex-ended buttons.

The system is light, loud only where it has earned it, and phone-first. Ink does the structural work: borders, keys, counters, focus rings, selected states. Pink and mint act as paint. They mark the button outline, link underlines, list markers, hover tints and the city wash, and they never carry text. The five major colors are the story's reward and appear only where a major is meant. This world replaces the dark night-city quiz card it grew out of; the dark ground is not coming back.

Motion keeps the "comic panel" feel. Cards rise in and sink out, the picked answer bursts into particles of its major color, a building fills with paint, and the cover masthead lines tilt into place. Under reduced motion, all of it becomes short fades, and the color still returns.

**Key Characteristics:**
- Cool paper ground (#f4f2f7) under a code-drawn line-art city that gains color with every answer
- Ink borders at 1.5px on white panels, with 3px ink HUD corner brackets at top-left and bottom-right
- Black hex-ended buttons outlined in two inks, mint and pink split hard at the middle
- Squared techno display type (Chakra Petch) set italic and heavy for headings; Bai Jamjuree for Thai body copy
- Answer rows keyed ก ข ค ง จ in black squares
- Ink focus rings on every interactive element
- Major colors used only as major signals: meter segments, picked answers, painted buildings, result chips, score bars

## Colors

Ink on cool paper, with pink and mint used as paint and five major colors kept as the story's reward.

### Primary
- **Zine Ink** (ink): Text, every 1.5px border, HUD brackets, option keys, counters, selected chips, the primary button face, focus rings, and the city's line art. It is the structural color of the whole system.
- **Hot Pink Paint** (pink): The right half of the two-ink button outline, text caret, list markers, the link-button underline, the text selection background (with ink text), and the city's wash slashes. Pink is never used as text.

### Secondary
- **Mint Paint** (mint): The left half of the two-ink button outline, option and chip hover tints (22% mix), the consent box tint (12%), and the city's wash slashes. Mint is never used as text.

### Tertiary
- **Major signatures** (major-dga Digital Arts, major-dgd Digital Graphic Design, major-igd Interactive and Game Design, major-afx Animation and VFX, major-den Digital Entertainment): Fixed per major in `data.js` MAJORS and in PRODUCT.md. They appear in meter segments, the picked option's tint (32% mix) and key, burst particles, painted buildings, the result major chip (34% mix), score bars, and the share image's color slashes.
- **Orb Amber** (orb): Only for the guide's warm light, the single warm thing in the gray opening. The guide itself is the team's planet-character sprite (`assets/guide.webp`), drawn in the city canvas; the plain amber orb is only its fallback if the sprite fails to load.

### Opening gloom
The first chapters are sad, in manga terms: a cool blue-gray multiply layer over the city, and ink rain lines with heavier strokes mixed in. The guide is drawn about 28% larger while the city is gray, and its light clears a soft circle in the tone and the rain. Inside that circle the city's hidden color shows through at full strength (the pink and mint wash and the colored windows), a preview of what the answers will bring back. All of it fades out as color returns and is gone by about 60% progress (`gloomAmt()` in `city.js`); the HUD's top fade follows it through the `--gloom` / `--sky` CSS variables. No rain under reduced motion.

### Neutral
- **Cool Paper** (paper): Page and city ground, the HUD's fade-out gradient, the theme color, and the share image ground.
- **Panel White** (panel): Card, input, option and chip surfaces. Cards sit at 95% opacity so the city faintly shows through. Panel white is also the text color on ink.
- **Faded Ink** (ink-dim): Secondary copy, captions, the result lead-in, and the scores summary.
- **Hairline** (line): Quiet dividers such as career tag borders, the pass header's dashed rule, the scores divider and the consent box border.
- **Track** (track): Empty bars, meaning score bar tracks.
- **Alarm Crimson** (danger): Field error text and the 2.5px invalid-input border, with a 6% danger tint on the field.

### Named Rules
**The Paint Never Talks Rule.** Pink and mint are paint, not type. They never color text. Pink on paper is only about 2.9:1, so anything that must be read or focused uses ink.

**The Major Means a Major Rule.** A major color appears only where that major is meant: an answer that scores it, a building it painted, or a result that names it. Never use it as decoration or as a general accent.

## Typography

**Display Font:** Chakra Petch (with sans-serif)
**Body Font:** Bai Jamjuree (with system-ui, sans-serif)

**Character:** Chakra Petch's squared, techno Thai/Latin letterforms, set italic and heavy, read like a zine masthead or HUD readout. Bai Jamjuree is a calm, open Thai sans that keeps the story text easy to read at phone sizes. Both load from Google Fonts: Chakra Petch upright 500/600/700 and italic 600/700, and Bai Jamjuree 400/500/600.

### Hierarchy
- **Display** (italic 700, clamp(40px, 11.5vw, 80px), 1.3): The cover title only, set as a masthead. It is split into two lines ("คืนสุดท้าย" / "ก่อนสีจะหายไป"). Each line is a solid ink block with panel-white text, tilted against the other (−2deg and 1.5deg, the second offset right). A pink inset stripe runs along the bottom of line one and a mint one along line two. The lines tilt in one after the other using the chip-in motion. It sits inside the HUD brackets.
- **Headline** (italic 700, clamp(30px, 8vw, 46px), 1.35): Screen-level h1. The result name uses clamp(32px, 9vw, 52px) at 1.3 and is fitted to one line by script. The reveal heading uses clamp(26px, 7vw, 40px).
- **Title** (italic 700, clamp(23px, 5.6vw, 30px), 1.35): Card headings for chapters, scenes, districts and pass pages. Sub-titles inside a mixed result use 20px. The pass section sub-head uses italic 600 at 18px.
- **Body** (Bai Jamjuree 400, 17px, 1.7; 16px at 480px and below): Story copy and prompts. Answer rows use 500 at 16px/1.6, and chips use 500 at 15px.
- **Button** (Chakra Petch upright 700, 18px, 0.02em tracking): All hex buttons.
- **Label** (Chakra Petch upright 600, 14–15px): HUD chapter label, counters, step pill, skip link, major chip, score rows (tabular numbers), and the details summary. Option keys use 600 at 17px.

### Named Rules
**The Italic Is for Headings Rule.** Italic Chakra Petch is reserved for headings (h1, h2, pass sub-head). Labels, buttons and counters stay upright so they read as interface, not story.

**The Thai Leading Rule.** Thai stacks vowels and tone marks above and below the line. Keep body text at 1.6 or more (the cover masthead uses 1.3 only because each line is a single block) and never tighten headings below 1.25.

## Layout

Single column and phone-first. One card at a time is centered in the stage at a maximum width of 620px. Stage padding is 104px top (to clear the fixed HUD), 16px sides and 32px bottom. The cover drops to a safe-area top inset and stretches into three rows: bracketed head, a flexible art slot (minimum 180px), and the foot with the start button. Everything on the cover is centered. Reading order is title, then tagline (19px/600 in an ink box with a pink left edge), then the story (15px faded ink in a hairline box), then the start button; each step is quieter than the one before. When the hero art is missing, the art row collapses and the head and foot sit together in the middle of the screen. The reveal screen sits low (aligned to the end, with 8vh bottom padding) so the fully colored city fills the view.

Spacing rhythm: 4px for meter and bar gaps, 8px for chips, tags and score rows, 10–12px for option rows and button groups, and 22px above action rows and between form fields. Cards are padded 28px by 24px, tightening to 24px by 18px at 480px and below. Long Thai lines get `text-wrap: balance` on headings and `pretty` on paragraphs.

The HUD is a fixed top bar: the chapter label on the left, a counter pill on the right, and the 11-segment meter across the full width. It fades into the paper underneath. It is hidden on the intro, how-to and result screens, and during cutscenes.

## Elevation & Depth

The system is flat and layered by line, not by shadow. Depth comes from stacking: the city canvas, then the fx canvas, then the stage card, then the HUD. Panels sit at 90–95% white so the line-art city reads faintly through them. Ink borders and corner brackets separate layers.

### Shadow Vocabulary
- **None for elevation.** Nothing in the system casts a drop shadow.
- **Paint stripe** (`box-shadow: inset 0 -.12em 0 pink | mint`): The bottom stripe on each line of the cover masthead. It is an inset band of paint, not a shadow.

### Named Rules
**The Line Not Shadow Rule.** Cards, buttons, options and inputs carry no shadow. Separate them with a 1.5px ink border, never with a drop shadow, glow or hard offset block.

## Shapes

The form language has barely softened corners, hex-ended buttons and HUD brackets. Cards and panels use a 6px radius. Controls (option rows, chips, inputs, tags) use 4px. Option keys use 3px. Only counters and the pass step indicator are full pills (99px). Buttons are never rounded: they are clipped to a hexagon with 16px angled ends (13px on the inner face).

Borders are 1.5px ink at rest and 2.5px when the state is emphatic (picked option, invalid input). HUD corner brackets are open L-shapes at top-left and bottom-right: 3px ink, 18–20px long, offset 7–8px outside the box. The meter segments and score bars are all skewed −22deg, like speed lines. Dev-mode art slots use a dashed faded-ink border.

## Components

### Buttons
Black hex plates outlined in paint, confident and arcade-like.
- **Shape:** Hexagon clip with 16px angled ends, minimum 54px tall.
- **Primary:** Ink face inset 4px inside a two-ink outline, mint on the left half and pink on the right with a hard cut at 50% (`linear-gradient(90deg, mint 50%, pink 50%)`), like a two-color print plate, never a smooth blend. Text is panel white at 18px/700. A single double-chevron follows the label in the direction of travel. Never flank a label with chevrons on both sides.
- **Hover / Press / Focus:** Presses down 1px when pressed. Lifts 2px on hover, only inside `@media (hover: hover)`. Focus is a 3px ink outline at a 4px offset. Disabled is 50% opacity. While working, the label changes to a status word, for example "กำลังทำภาพ…".
- **Hierarchy:** One primary per action row. Primary, then ghost, then link button, each step visibly smaller and quieter than the one before.
- **Ghost (secondary):** Smaller than primary (48px tall, 16px/600, 12px hex ends). A white face inset 2px inside a solid ink outline, with ink text. It has no mint offset and no pink rim, does not lift on hover (the face tints 22% mint instead), and presses 1px. Used for back and subscribe.
- **Link button (tertiary):** Ink label at 600 15px, with a 2px pink underline offset 5px (3px on hover) and an optional trailing chevron. Used for the "ข้ามไปดูผลลัพธ์" skip and "เล่นอีกครั้ง".

### Option rows (answer list)
Answer rows are the main interaction.
- **Structure:** A three-column grid: a 34px ink key square showing ก ข ค ง จ, the answer text, and a trailing chevron. Rows have a white surface, a 1.5px ink border and 4px radius, and are shuffled on every render.
- **Hover:** A 22% mint tint and a 4px nudge to the right (hover-capable devices only).
- **Picked:** Tinted 32% toward the answered major's color, with a 2.5px border (padding reduced to compensate), the key filled in the major color with ink text, the chevron swapped for an SVG tick, and `aria-pressed="true"`. The other rows lock at 40% opacity with `aria-disabled`. A particle burst in the major color fires from the tap point.

### Chips
- **Style:** White with a 1.5px ink border and 4px radius, Bai Jamjuree 500 at 15px, minimum 44px tall.
- **State:** Selected chips invert to ink with white text, exposed through `aria-pressed`. Hover is a 22% mint tint. Groups with a maximum show a live note in ink ("เลือกครบ n ข้อแล้ว…") instead of failing silently.

### Cards / Containers
- **Corner Style:** 6px radius.
- **Background:** Panel white at 95%.
- **Shadow Strategy:** None (see Elevation).
- **Border:** 1.5px ink, plus HUD corner brackets (3px ink, 20px, offset 8px).
- **Internal Padding:** 28px by 24px, or 24px by 18px on small screens. Rises 24px in over 0.6s and sinks 16px out over 0.3s.

### Inputs / Fields
- **Style:** White with a 1.5px ink border and 4px radius, minimum 48px tall, a pink caret, and bold labels above the field.
- **Focus:** 3px ink outline at a 2px offset.
- **Error:** A 2.5px danger border with a 6% danger tint, plus a message row in danger 600 at 15px led by the SVG warn icon. Focus moves to the field.

### HUD and meter
- **Label:** The chapter title at 600 14px, truncated with an ellipsis. On a chapter card, it shows only "บทที่ n" because the card heading already carries the full title. On scene cards it shows the full chapter title, and on the form it shows "ก่อนขึ้นเวทีใหญ่".
- **Counter:** An ink pill reading "0n / 11" in tabular numbers.
- **Meter:** Eleven skewed segments, each 9px tall, white with a 1.5px ink border. Each answered segment fills with that answer's major color over 0.5s. It is exposed as a progressbar with a Thai value text.

### Icons
All icons are inline SVG ink line drawings at a single stroke weight (2.4), drawn in `currentColor` with round joins: a double chevron, a tick and a warning triangle. The pause/play control and the details disclosure arrow are drawn in CSS with the same ink. There are no icon fonts or emoji.

### The guide as companion
The guide's mood follows the city. While the city is gray, it drifts slowly, sits lower, bobs gently and tips its face down a little. As color returns, it moves faster, rides higher and bobs more. When a paint drop lands, the guide flies over the newly painted building and hops above it for about 1.2s, then goes back to wandering. When the city is fully colored (the reveal celebration), it does one full spin with ease-out over 1s. With reduced motion it stays still.

### After an answer (signature motion)
There are no cutscenes between questions. This is the one authored motion sequence in the product:
1. **Tap (0s):** the row locks, its key fills with the major color, particles in that color burst from the tap point, and the newly earned meter segment stamps in (scaleY 2.4 → 1 over 0.45s, keeping its −22deg skew).
2. **0.65s:** the card sinks out so the city is visible. A paint drop in the major color (a square head with an ink outline and a five-square trail) arcs from the picked row to the top of one tall building over 0.48s, while the camera zooms in to about 1.1×.
3. **Landing:** the drop splashes into particles, and the building fills with the color from the base up over 0.7s.
4. **About 1.25s after step 2:** the camera returns and the next card rises in with no extra wait.

With reduced motion there is no drop, burst, stamp or zoom. The card fades, the building is colored at once, and the next card appears after about 0.3s.

**Chapter cards** don't rise like the other cards. They wipe open from the left behind a slanted edge, like a new manga panel (clip-path, 0.65s, ease-out), with the clip extended past the box so the HUD brackets aren't cut. With reduced motion they fade.

### Traveler pass form
A card with three short pages. The header row holds the ink step pill ("บัตรหน้า n / 3"), the underlined skip link and a small note ("ข้ามแล้ว ข้อมูลในบัตรจะไม่ถูกส่ง") above a dashed hairline. The last page ends with the consent text (FORM_CONSENT) in a mint-tinted box with a hairline border. The primary button is labeled "หน้าถัดไป" or "ยื่นบัตรผ่าน", and a ghost "ย้อนกลับ" appears from page 2 on. Every field can be skipped.

### Reveal and result
- **Reveal:** A small bracketed box low on the screen reading "สีกลับมาครบทั้งเมืองแล้ว", shown while the city celebrates in the result colors. It continues automatically after about 3.2s, or on the button.
- **Result card:** The title comes first. A faded-ink lead-in phrase reads straight into the result name, which is fitted to one line by shrinking (no mid-word breaks, minimum 22px) before wrapping is allowed. Below it comes the mascot art, shown whole and uncropped (1600×1131), with no frame and no stripe background. After that come the story, the major chip (34% major tint, ink border), career tags (the district pick inverted to ink and listed first), and actions: share (primary), subscribe (ghost), and a link-button "เล่นอีกครั้ง". Scores are folded into a `<details>` with skewed bars in the major colors.
- **Share image:** A 1080×1350 PNG drawn on canvas from the same world: a paper ground, pink, mint and major-color slashes, the mascot, ink HUD brackets, the italic title fitted to the width, and major chips. It goes out through Web Share when files are supported and falls back to a download with a status message.

### Art slots and dev mode
Illustrations come from the team. Each slot is a figure. When the file is missing, a player sees nothing: the cover keeps the space empty so the line-art city shows through, and the result card removes the slot. This is the same in `?dev` mode. With `?dev` in the URL, unscripted cutscenes show a dashed placeholder sticker. Players never see either.

## Do's and Don'ts

### Do:
- **Do** build every new surface on cool paper with white panels at a 1.5px ink border and 6px radius, with HUD brackets on the primary panel.
- **Do** use the black hex button with the two-ink (mint | pink) outline for primary actions, and the ink-outlined ghost for secondary ones.
- **Do** use the 3px ink focus ring (`--focus`) on every interactive element, with an offset of 2–4px.
- **Do** confirm selection with more than color: a thicker border, an icon or inverted fill, and `aria-pressed`.
- **Do** draw icons as inline SVG ink strokes at weight 2.4.
- **Do** keep hover effects inside `@media (hover: hover)`, and replace movement with short fades under `prefers-reduced-motion`.
- **Do** keep major colors tied to their major exactly as defined in `data.js` MAJORS.
- **Do** leave art slots for the team's illustrations and let them collapse cleanly when the file is missing.

### Don't:
- **Don't** set text in pink or mint, and don't use pink for focus rings (about 2.9:1 on paper).
- **Don't** use a major color as decoration or as a general accent.
- **Don't** give cards, buttons or controls drop shadows, glows or hard offset shadows. Nothing lifts.
- **Don't** round buttons into pills. Pills are only for counters and the step indicator.
- **Don't** bring back the dark night-city ground this world replaced.
- **Don't** invent an SDM logo, institutional name or official colors until the real brand assets are supplied.
- **Don't** draw or copy character art in code, and don't write story text that isn't in the brief.
- **Don't** let dev-mode placeholders reach players.
