# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Thai upper-secondary and vocational students (ม.4–ม.6, ปวช., ปวส.) who are deciding which faculty and major to apply for. Most arrive on a phone from social media (Facebook, Instagram, TikTok), from friends or older students, from guidance teachers, or from events. They are anywhere from "just started looking" to "already decided". Many have some creative experience (drawing, design, video editing, making games, running events, shooting content), and some have none yet. The job they're doing: find out which creative path fits them, in a way that's fun enough to finish and worth sharing.

## Product Purpose

Imagine City (คืนสุดท้ายก่อนสีจะหายไป, "The last night before the colors disappear") is a live recruitment campaign for SDM. It's a story-driven personality quiz. Each answer returns color to a city that has gone gray, and the player ends up matched to one of SDM's five majors, or a mix of two, with matching careers.

Success means all four of these:
- **Finish the story:** players reach the result screen without dropping off.
- **Major fit clarity:** players understand which SDM major and careers fit them, and why.
- **Shared results:** players share their result on social media.
- **Leads captured:** players complete the traveler-pass form (บัตรผ่านนักเดินทาง) and subscribe for SDM news on activities and scholarships.

## Positioning

The quiz is a story, not a survey. The player is the last person who can bring the city's color back before the Imagine Design Event festival. The city itself is the progress meter: it moves from grayscale to full color as the player answers. Every choice maps to a real SDM major, so the result is a concrete study path and set of careers, not a generic personality label.

## Operating Context

- Format (changed 2026-11-21): still a quiz, and the user removed the cutscenes between questions. After each answer, including district picks, one building is painted in the answer's major color and the camera zooms in on it for about 0.9s, then the next question appears. The story is carried by the chapter cards, the scene prompts, and the city itself. All answers share one story spine; the ending differs by major result.
- Flow: intro → how-to → 5 chapters with 11 scored scenes → Chapter 3 branches into the player's leading "district" (or the top two if they're within 1 point) → the gate scene → optional traveler-pass form (every field can be skipped) → result.
- Majors: DGA Digital Arts, DGD Digital Graphic Design, IGD Interactive and Game Design, AFX Computer Animation and Visual Effects, DEN Digital Entertainment. Each major has a fixed signature color that appears in both the city and the results.
- Results: a single major, or a mixed result with its own title (MIXED in `data.js`) when the runner-up is within 1 point. Ties are broken by the answer to scene 5.2.
- The form collects nickname, grade, track, province, source, decision factors, decision stage, creative experience, and preferred contact channel. Its data is marketing input for SDM.
- The content comes from the campaign brief document, in Thai. The player is addressed as เธอ in a warm, story-telling voice.

## Capabilities and Constraints

- Static HTML/CSS/vanilla JS (`index.html`, `style.css`, `data.js`, `city.js`, `app.js`). There's no build step today. The user did not make "stay static" binding.
- Planned deployment: a static host with a form backend that receives lead records, for example Google Sheets or similar. The exact host and backend are **undecided**. The current MVP only saves records to the player's browser (`localStorage` key `imagineCity.records`), so leads don't reach SDM yet.
- The city and result badge are currently drawn entirely in code (canvas/SVG). The user did not make code-only art binding.
- The user did not mark quiz text and scoring as locked. They still come from the brief, so changes to them need the user's approval.
- **Open:** a share mechanism for results. Sharing is a success goal, but there's no share or export feature yet.

## Brand Commitments

- The product name is **Imagine City**, and the in-story festival is **Imagine Design Event**. The client is **SDM**.
- Official SDM brand assets (logo, colors, official faculty and university name) exist and must appear, but **they haven't been supplied yet**. Don't invent a logo, a full institutional name, or official colors in the meantime.
- Each major keeps its signature color (DGA #ff5d8f, DGD #ffb627, IGD #3ddc97, AFX #4cc9f0, DEN #9b5de5) unless SDM's official brand says otherwise.

## Evidence on Hand

- The full quiz content lives in `data.js`: chapters, scenes, districts, results, careers, mixed titles, and form fields.
- There are no testimonials, student work, enrollment numbers, scholarship details, or official program facts in the repo. Don't fabricate any of these.

## Product Principles

1. **Story before survey.** Every screen should keep the player inside the narrative. Lead capture is optional and must never block the result.
2. **Progress you can see.** The returning color is the reward, so each answer should feel like it changes the world.
3. **The result is a real path.** It should name the SDM major and concrete careers clearly enough to act on.
4. **Worth sharing.** A result should be something a teenager is happy to post.
5. **Phone-first, Thai-first.** Most players come from social apps on mobile. Thai typography and copy come first.

## Accessibility & Inclusion

- Respect `prefers-reduced-motion`: cards switch to short fades, and the city's color still returns, quickly (about 250ms). There are no particles, rain or camera movement, and the canvas stops drawing when nothing changes. The pause after an answer shortens to about 0.3s.
- Every form field can be skipped. Answers are never framed as right or wrong.
