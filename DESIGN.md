---
name: Imagine City
description: A story quiz set on the last night before a city loses its color; every answer paints it back.
colors:
  glow: "#ffe9a8"
  on-glow: "#1a1530"
  major-dga: "#ff5d8f"
  major-dgd: "#ffb627"
  major-igd: "#3ddc97"
  major-afx: "#4cc9f0"
  major-den: "#9b5de5"
  sky-zenith: "#120a3a"
  sky-dusk: "#3b1d6e"
  sky-horizon: "#ff7a6b"
  tower-front: "#2a1f55"
  tower-mid: "#1d1640"
  tower-back: "#120e2a"
  moon: "#ffe6aa"
  orb-core: "#fffae1"
  window-light: "#fff6d5"
  night: "#0d0b1a"
  panel: "rgba(18, 15, 34, 0.9)"
  ink: "#f4f1ea"
  ink-dim: "#b9b4c7"
  fill: "rgba(255, 255, 255, 0.05)"
  fill-hover: "rgba(255, 255, 255, 0.1)"
  fill-input: "rgba(255, 255, 255, 0.06)"
  track: "rgba(255, 255, 255, 0.1)"
  line: "rgba(255, 255, 255, 0.14)"
  line-strong: "rgba(255, 255, 255, 0.35)"
  danger: "#ffa3b8"
typography:
  display:
    fontFamily: "Mitr, sans-serif"
    fontSize: "clamp(30px, 7vw, 44px)"
    fontWeight: 500
    lineHeight: 1.3
  headline:
    fontFamily: "Mitr, sans-serif"
    fontSize: "clamp(22px, 5vw, 28px)"
    fontWeight: 500
    lineHeight: 1.3
  title:
    fontFamily: "Mitr, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.3
  caption:
    fontFamily: "Mitr, sans-serif"
    fontSize: "clamp(18px, 5vw, 22px)"
    fontWeight: 500
    lineHeight: 1.65
  button:
    fontFamily: "Mitr, sans-serif"
    fontSize: "17px"
    fontWeight: 500
  body:
    fontFamily: "IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  body-option:
    fontFamily: "IBM Plex Sans Thai, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Sans Thai, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  pick:
    fontFamily: "IBM Plex Sans Thai, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.75
  tag:
    fontFamily: "IBM Plex Sans Thai, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  hud:
    fontFamily: "IBM Plex Sans Thai, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  bar: "3px"
  field: "12px"
  option: "14px"
  sticker: "16px"
  card: "18px"
  pill: "99px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  card-x: "24px"
  card-y: "28px"
components:
  button-primary:
    backgroundColor: "{colors.glow}"
    textColor: "{colors.on-glow}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 26px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 26px"
    height: "48px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "28px 24px"
    width: "620px"
  option:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.body-option}"
    rounded: "{rounded.option}"
    padding: "14px 16px"
  option-hover:
    backgroundColor: "{colors.fill-hover}"
  chip:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
    height: "44px"
  chip-hover:
    backgroundColor: "{colors.fill-hover}"
  chip-selected:
    backgroundColor: "{colors.glow}"
    textColor: "{colors.on-glow}"
  input-text:
    backgroundColor: "{colors.fill-input}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 14px"
    height: "48px"
  story-sticker:
    backgroundColor: "{colors.glow}"
    textColor: "{colors.on-glow}"
    typography: "{typography.caption}"
    rounded: "{rounded.sticker}"
    padding: "16px 18px"
  story-pick:
    backgroundColor: "rgba(13, 11, 26, 0.88)"
    textColor: "{colors.ink}"
    typography: "{typography.pick}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
  story-skip:
    backgroundColor: "rgba(13, 11, 26, 0.7)"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
---

# Design System: Imagine City

## Overview

**Creative North Star: "The Last Lit Night"**

Imagine City is a night city drawn entirely in code, and the interface is something you read over that city, never in front of it. The canvas carries the world: an indigo-to-coral sky, a moon, three layers of towers with flickering windows, a drifting guide orb, and a fog that pools at street level. The city starts drained of color. Global saturation climbs with every scored answer, and each answer also paints one front tower in the chosen major's color at full strength, so by the result the skyline is the player's own palette.

The UI on top is quiet and translucent: dark panels at 90% opacity, hairline borders, one warm lamp-yellow accent, and two Thai typefaces with distinct jobs. Between questions, a story player takes the whole screen. It has segmented progress bars, the orb and speaker name, the player's own answer as a slightly tilted dark chip outlined in its major color, and a lamp-yellow caption sticker tilted the other way. The camera dollies toward the freshly painted tower while the story runs.

The world is dark only, by design (`color-scheme: dark`; `theme-color` matches night). It is phone-first and Thai-first: type sizes, leading, wrapping and touch targets are tuned for Thai script on a small screen.

**Key Characteristics:**
- Code-drawn canvas city as the full-bleed background on every screen; no raster art.
- Color is earned: the city goes from gray to full color with progress, and answers paint towers in major colors.
- Dark translucent panels, hairline borders, one lamp-yellow accent.
- Mitr speaks (headings, buttons, captions, names); IBM Plex Sans Thai reads (body, options, fields).
- Thai-safe typesetting: generous leading and phrase-level wrapping.
- Motion rises, settles, and dollies; reduced motion swaps every movement for a short fade and lets the canvas stop.

**Open item:** SDM's official brand assets (logo, official colors, official faculty and university name) have not been supplied. Nothing in this file is an SDM brand token. When they arrive, they are reconciled here; the five major colors stand unless the official brand overrides them.

## Colors

A night palette of deep indigos, one warm lamp light, and five saturated major colors that only appear when the player earns them.

### Primary
- **Lamp Glow** (glow): The single UI accent. It fills primary buttons, the caption sticker, and the selected chip. It colors focus rings on options, fields and story controls, the text caret, text selection, the top career tag, the result lead-in, and confirmation text. It is the color of the guide orb, so the interface's accent and the world's guide are the same light.
- **Ink on Glow** (on-glow): Text on any glow fill (buttons, stickers, selected chips, selection).

### Secondary: The Five Major Colors
- **DGA Pink** (major-dga), **DGD Amber** (major-dgd), **IGD Mint** (major-igd), **AFX Sky** (major-afx), **DEN Violet** (major-den).
- Where they appear: the window lights of every tower, painted towers after an answer, color particles, the HUD meter's gradient fill (all five, in order), the picked answer's outline in options and in the story chip, the result badge's segments, major tags, and score bars.
- Source: `MAJORS` in `data.js` is the single source. CSS never hardcodes them; components receive them at runtime through the `--c` and `--pick` custom properties.

### Tertiary: The World
- **Midnight Zenith** (sky-zenith) → **Dusk Violet** (sky-dusk, at 60%) → **Ember Horizon** (sky-horizon): the vertical sky gradient behind everything.
- **Tower Front / Mid / Back** (tower-front, tower-mid, tower-back): the three skyline layers. The front layer is tallest and lightest, and the back layer is darkest.
- **Moonlight** (moon), **Orb Core** (orb-core), **Window Light** (window-light): the warm whites of the moon, the guide orb's center (also the orb dot in the story header and the result badge's center), and stars and lit windows on painted towers.

### Neutral
- **Night** (night): the page, the HUD's top fade, and the base of every dark scrim. Translucent night tints (0.7–0.88 alpha) sit behind story chips, skip and pause controls, and the hint, and the story's top fade uses 0.75.
- **Panel** (panel): card surfaces, which are 90% opaque so the city still reads through.
- **Ink** (ink) and **Dim Ink** (ink-dim): primary text, and secondary text (intro and chapter prose, rule lists, the HUD, field hints, the score label).
- **Fill / Fill Hover / Fill Input** (fill, fill-hover, fill-input): white washes for options, chips, career tags and inputs.
- **Track** (track): empty meter and score-bar tracks.
- **Line / Line Strong** (line, line-strong): hairline borders at rest, and borders on hover or for the story controls.
- **Danger Rose** (danger): invalid-field borders and error text only.

### Named Rules
**The Earned Color Rule.** The city starts gray, and color comes back only through answers: saturation tracks progress, and each answer paints one tower at full strength, even while the rest of the city is still gray. Major colors carry major meaning and nothing else. Never use them as decoration.

**The One Lamp Rule.** Lamp Glow is the interface's only accent. Anything the player should press next, or anything that confirms what they chose, is lit by it. No second UI accent exists.

**The Single Source Rule.** Major colors are read from `MAJORS` at runtime. A major color typed into CSS or markup is a bug.

## Typography

**Display Font:** Mitr (with sans-serif fallback), weights 400/500/600 loaded from Google Fonts
**Body Font:** IBM Plex Sans Thai (with system-ui, sans-serif), weights 400/500/600 loaded from Google Fonts

**Character:** Mitr is round, friendly and a little playful, the voice of the story and its calls to action. Plex Sans Thai is calm and highly legible for longer Thai reading, options and form input.

### Hierarchy
- **Display** (500, clamp(30px, 7vw, 44px), 1.3): the intro title and the result title. Balanced wrapping.
- **Headline** (500, clamp(22px, 5vw, 28px), 1.3): screen titles for chapters, scenes, districts and the form. Balanced wrapping.
- **Title** (500, 20px, 1.3): the second result title in a mixed result.
- **Caption** (Mitr 500, clamp(18px, 5vw, 22px), 1.65): story sticker captions.
- **Button** (Mitr 500, 17px): every button. Mitr 500 at 15px also sets the speaker name and the skip label, and at 14px the major tag.
- **Body** (Plex 400, 17px, 1.65; 16px under 480px): prose on cards. Pretty wrapping on paragraphs and list items.
- **Option** (Plex 400, 16px): answer options.
- **Label** (Plex 400, 15px): chips, field hints and errors. Field labels and questions use weight 500 at body size.
- **Pick** (Plex 400, 15px, 1.75): the picked-answer chip in the story.
- **HUD** (Plex 400, 13px, 1.4, tabular numerals): the chapter label and counter. Score bars also use 13px tabular numerals.

### Named Rules
**The Two Voices Rule.** Mitr speaks: headings, buttons, captions, speaker names, major tags. Plex Sans Thai reads: body, options, chips, fields. Don't swap their jobs.

**The Thai Leading Rule.** Running Thai text and captions never go below 1.65 line-height (1.75 for the 15px story chip), so stacked vowels and tone marks never collide. Headings sit at 1.3 with balanced wrapping. Only the single-line HUD goes tighter (1.4).

**The Phrase Wrap Rule.** Thai has no spaces between words, so story captions and the picked-answer chip are split on spaces into inline-block phrases. Lines break only between phrases, never mid-word. A phrase longer than the line wraps inside its own box.

## Layout

A single centered column over a fixed full-screen canvas. The two canvases (city, then effects) are fixed behind everything. The stage centers one card vertically and horizontally, with top padding (84px) that clears the fixed HUD, side padding of 16px, and 32px at the bottom. Cards are full-width up to 620px.

The HUD is a fixed top strip: the label and count on one row and a 6px meter spanning the full width below, over a gradient that fades from night to transparent. It hides while a story plays.

The story player is a full-screen layer. Its progress bars run across the top at a 12px inset that respects the safe area. The orb and speaker sit just below, at top-left. The picked chip sits at 27% height (max min(76%, 420px)), and the sticker at 42% height (min(84%, 480px)). Skip is at top-right, pause at bottom-right, and the one-time hint is at bottom-left. Invisible tap zones split the screen into a back third and a forward two-thirds.

Spacing is a loose 4px-based rhythm: 8px between chips and career tags, 10px between options, 12px between action buttons, 20px below fields and above action rows, and 28/24px of card padding (22/18px under 480px). The only breakpoint is 480px. Touch targets are at least 44px (chips, story controls) or 48px (buttons, inputs, pause).

## Elevation & Depth

Depth lives in the canvas, not the UI. The city stacks three tower layers with parallax sway, a fog band over the bottom quarter, a moon halo, and the orb's radial glow and orbiting motes. A camera dolly zooms toward the painted tower, anchored at the bottom edge, while the sky stays still. The UI is flat and tonal: translucent night panels with hairline borders, and night scrims where text must read over the sky.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.7)`): on buttons while hovered (paired with a 2px rise), and resting under the story sticker, which reads as a paper sticker laid over the scene.

### Named Rules
**The Night Is the Depth Rule.** Cards and panels never take shadows. They separate from the city by opacity and a hairline. Lift is reserved for things the hand touches: a hovered button and the sticker.

## Shapes

Soft and round. Actions, tags, chips, meters and story controls are full pills (99px). Cards are gently rounded (18px), options slightly less (14px), and inputs and the story chip less again (12px). Story bars are 3px rounded slivers. The orb dot is a circle. Borders are always 1px hairlines in line or line-strong, except the picked answer and major tags, which take a 1px border in their major color.

Tilt belongs to the story only: the caption sticker leans −3° and the picked chip leans +2°, like two things stuck onto the scene from opposite sides. Everything else sits square.

## Components

### Buttons
Round, warm, and direct.
- **Shape:** full pill (99px), at least 48px tall, Mitr 500 17px.
- **Primary:** lamp-glow fill with on-glow text.
- **Hover / Focus:** rises 2px and takes the Lift shadow, then returns to 0 on press. The focus ring is a 3px ink outline offset 3px. Disabled buttons drop to 55% opacity.
- **Ghost:** transparent with ink text and a 1px line border. Used for the secondary choice in a pair ("skip for now", "play again").

### Answer Options
- **Style:** full-width, left-aligned Plex 16px on a fill wash with a 1px line border, 14px radius.
- **Hover:** a brighter fill, a stronger border, and a 4px nudge to the right.
- **Picked:** the border and a 22% wash take the picked major's color. Once locked, unpicked options fade to 35%.
- **Focus:** 2px lamp-glow outline.

### Chips (form choices)
- **Style:** pill, at least 44px tall, Plex 15px on fill with a line border.
- **Selected:** lamp-glow fill with on-glow text (toggle buttons using `aria-pressed`). Hover brightens the fill and border.

### Cards / Containers
- **Corner Style:** 18px.
- **Background:** panel at 90% opacity over the city.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px line.
- **Internal Padding:** 28px × 24px, 22px × 18px under 480px.
- **Motion:** enters by rising 24px into place over 0.6s on the standard ease-out, and leaves by sinking 16px upward and fading over 0.3s.

### Inputs / Fields
- **Style:** fill-input background, 1px line border, 12px radius, at least 48px tall, with a lamp-glow caret.
- **Focus:** 2px lamp-glow outline offset 1px.
- **Error:** danger-rose border, and a 15px danger-rose message below. Every field is optional.

### HUD and Meter
A fixed top strip in dim ink at 13px. The 6px pill meter fills with all five major colors as one left-to-right gradient, widening over 0.8s as scored scenes are completed.

### Result
- **Badge:** an SVG of five wedges, one per major in major colors, sized by score, with non-result majors at 30% opacity and an orb-core dot at the center.
- **Major tag:** a Mitr 14px pill with a 25% wash of the major color and a 1px border in it.
- **Career tags:** 14px pills on fill. The career picked in the district is outlined and lettered in lamp glow.
- **Score bars:** 6px pill tracks filled with each major's color.

### Story Player (signature)
A tap-through story played after every answer, over the full-bleed city.
- **Progress bars:** one 3px segment per frame on 30%-white tracks, filling in ink over a duration based on text length (3.2–7s). Holding pauses the fill.
- **Speaker:** the orb dot (28px orb-core circle in a translucent glow ring) and the name in Mitr 500 15px.
- **Picked chip:** the player's answer on a night scrim at 88% opacity, outlined in its major color, leaning +2°. It enters with a 0.5s tilt-and-rise.
- **Caption sticker:** lamp-glow fill with on-glow Mitr captions, 16px radius, Lift shadow, leaning −3°. Each frame it re-enters from −9°, 86% scale and 14px lower over 0.55s on the expo ease-out (cubic-bezier(.16, 1, .3, 1)).
- **Controls:** a skip pill (top-right) and a 48px pause button whose pause/play icon is drawn in CSS. Both use a 70% night scrim and a line-strong border, with lamp-glow focus rings. Tap zones show their keyboard focus as an ink outline on the sticker, solid for forward and dashed for back.
- **City response:** the answered major's color paints a front tower over 0.7s, and the camera dollies toward it, zooming slightly further each frame.
- **Placeholder state (provisional):** until the client's cutscene copy arrives, a frame without script shows a labeled placeholder: panel fill, dim ink, a dashed line-strong border, and Plex 400 15px/1.5. This is a temporary marker, not a caption style. It is removed when the script lands.

### Motion and Reduced Motion
The standard ease-out (cubic-bezier(.2, .8, .2, 1)) drives card rise, chip-in and the meter. Expo ease-out (cubic-bezier(.16, 1, .3, 1)) is reserved for the sticker. With `prefers-reduced-motion`, cards, the story chip and the sticker swap to 0.15–0.2s fades. Hover nudges are removed, and the meter shortens to 0.2s. The city drops sway, star twinkle, orb drift and particles, desaturates over 250ms instead of 1.4s, paints and moves the camera instantly, and stops its animation loop when nothing is changing.

## Do's and Don'ts

### Do:
- **Do** let the canvas city sit behind every screen, and keep UI surfaces translucent (panel at 90%, night scrims at 0.7–0.88) so it reads through.
- **Do** read major colors from `MAJORS` and pass them through `--c` or `--pick`.
- **Do** use lamp glow for the next action, the current selection and focus. Use on-glow for text on it.
- **Do** keep running Thai text at 1.65 line-height or more, and wrap story text by phrase.
- **Do** set headings, buttons and captions in Mitr 500, and reading text in IBM Plex Sans Thai.
- **Do** keep touch targets at least 44px, and 48px for primary actions and inputs.
- **Do** pair every movement with its reduced-motion fade, and let the canvas loop stop when idle.
- **Do** show a labeled placeholder wherever story copy is missing.

### Don't:
- **Don't** add a light theme. The world is a night city, and `color-scheme` stays dark.
- **Don't** use major colors for decoration, or for anything that doesn't mean that major.
- **Don't** introduce a second UI accent next to lamp glow.
- **Don't** put shadows on cards or panels. Lift is only for hovered buttons and the sticker.
- **Don't** desaturate the city with a full-screen CSS filter. Saturation is blended inside the canvas.
- **Don't** let Thai lines break mid-word in captions, or drop multi-line Thai below 1.65 leading.
- **Don't** invent SDM logos, official names or official colors before the brand assets are supplied.
- **Don't** write story copy into the sticker. Cutscene text comes only from the client's brief.
