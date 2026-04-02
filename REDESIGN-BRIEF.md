# KINETICA AI — REDESIGN BRIEF
## Isidor vs Kinetica: Direct Comparison, Diagnosis & Implementation Spec

---

# TASK 1 — DIRECT COMPARISON

## A. On Load

### Isidor
- **What moves first:** A preloader with a rotating logo icon (4-step 90° keyframe rotation with 200ms pauses between steps) covers the page. Behind it, a full-viewport `<canvas>` element initializes a Perlin-noise wave simulation. The waves begin flowing immediately — horizontal lines with organic undulation driven by simplex noise, reacting to no input yet, just breathing.
- **Hero introduction:** Once the preloader clears, the hero text — "Frontier Enterprise AI" — is revealed using a `[data-fade-in-stagger="word"]` animation: each word fades in and slides upward in sequence with GSAP SplitText. The subheading fades in with `[data-fade-in="opacity"]`. There is a deliberate cascade: logo first, then headline words staggered, then description, then CTAs.
- **Background:** The wave canvas covers the entire viewport in dark navy/black (#010101). The wave lines are drawn in a muted lavender (#AEA6B6) with Perlin noise displacement. The lines move continuously at ~60fps — a gentle, horizontal, organic undulation. A gradient overlay (`linear-gradient(197deg, rgba(9,67,160,0) 13.93%, #0943A0 71.79%)`) tints the lower portion with deep blue.
- **"Waking up" feeling:** YES, emphatically. The preloader gives a "boot sequence" feel. The waves start flowing before the content appears. When the text lands, it lands into an already-alive environment. The page doesn't appear — it boots.

### Kinetica
- **What moves first:** The `ArchitecturalGrid` canvas renders immediately — a fixed-position full-screen grid of teal lines (0.055 alpha) and tiny 2px dots at intersections (0.035 alpha). The grid is essentially invisible on the light #f0f9f9 background — the alpha values are so low that without focused attention, the user sees a flat, pale background.
- **Hero introduction:** The brand name "KINETICA AI" runs a `useTextDecode` effect — binary 0/1 characters resolve left-to-right over 1400ms with a 400ms delay. This is the only on-load animation. The tagline and buttons appear statically (no stagger, no fade sequence).
- **Background:** The grid is static by default. Every 2–5 seconds, 1–2 random nodes pulse to ~0.22 alpha with a 1-ring neighbor propagation, then fade back over seconds. This is so subtle on the pale background that it reads as a rendering artifact, not an intentional animation.
- **"Waking up" feeling:** NO. The page appears as a static document with faint grid wallpaper. The text decode effect is nice but isolated — nothing around it moves in concert. There is no cascade, no sequence, no sense of systems coming online.

---

## B. On Hover / Pointer Movement

### Isidor
- **Wave canvas:** The Perlin noise waves respond to cursor position — mouse proximity creates a localized distortion/bulge in the wave field. This is continuous and physics-based, not a simple CSS effect.
- **Navigation links:** Smooth color transitions on hover (white → black in current state).
- **Enterprise cards (01–05):** Each card has corner SVG decorations. On hover, the card's tag component swaps background to white with black text (inverted). There's a scale animation on the button's left part (`scaleX(1)`). The effect is systemic — every card uses the same interaction logic.
- **Job posting cards:** Overlay opacity changes, tag inverts (background → white, text → black), "Learn more" button animates.
- **Investor logos:** Dim to 60% opacity on hover (counter-intuitive but creates visual feedback).
- **Shuffle text:** Elements marked `[shuffle="true"]` re-scramble on hover — text randomizes to symbols/characters then resolves back. This creates a "glitch" or "terminal" interaction.
- **Systemic?** YES. The logic is consistent: dark backgrounds, inverted hover states, wave physics response, text decode/shuffle on interaction. Every element follows the same interaction vocabulary.

### Kinetica
- **Grid canvas:** The cursor creates a proximity effect (CURSOR_RADIUS=160px) — nearby nodes brighten slightly (to 0.24 alpha). Grid line segments adjacent to the cursor get a faint emphasis (0.08 alpha stroke). This effect is technically present but nearly invisible on the pale background.
- **Buttons:** Hero buttons have CSS transitions: primary gets green fill + white text + subtle shadow. Secondary gets border color change. Standard CSS hover.
- **System items:** `.sys-item:hover` adds 4px of left padding. A whisper of movement.
- **Badges:** `.founder-badge:hover` darkens border from 0.15 to 0.30 alpha. Imperceptible.
- **Target rows:** `.fp-target-row:hover` gets a teal fill background at 0.08 alpha.
- **Links:** Color transition from sea to green. Standard.
- **Systemic?** NO. Each element has its own minimal hover, but there's no shared interaction vocabulary. Nothing feels connected. The canvas hover is invisible. The CSS hovers are CSS-default.

---

## C. On Scroll

### Isidor
- **Section appearance:** GSAP ScrollTrigger drives the entire page. Elements use `[data-fade-in="move"]` (translate + opacity) and `[data-fade-in-stagger="line"]` (line-by-line reveal via SplitText). Sections don't just appear — they construct themselves word by word, line by line.
- **Scroll decode:** Elements with `[shuffle="scroll"]` trigger a character-decode animation as they enter the viewport — text scrambles to random characters then resolves progressively. This creates a "the system is rendering this content for you right now" feeling.
- **Video section:** A scroll-triggered video plays/pauses based on viewport position via `ScrollTrigger.create()`. The user scrolls INTO the video.
- **Background behavior:** The wave canvas is fixed-position but is present in both the hero and footer (two separate instances). The enterprise section has its own gradient overlay that shifts as you scroll. The dark background creates a cinematic "deep space" scroll.
- **Rhythm:** The numbered enterprise cards (01–05) create a descending rhythm. The alternating card alignment (odd left, even right via `nth-child(even) justify-content: end`) creates a zigzag visual path. Each section transitions via gradient overlays, not hard borders.
- **Construction/birth feeling:** YES. Text decodes as you scroll to it. Lines appear one by one. Numbers count or resolve. The page is being "written" as you read it.

### Kinetica
- **Section appearance:** IntersectionObserver-based `Reveal` component. When a section crosses 15% viewport threshold, it gets `opacity: 1` and `translateY(0)` over 0.8s with a smooth ease. That's it — one animation type for every section.
- **Scroll decode:** NONE. The text decode only happens once on the hero brand name on load. Nothing decodes on scroll.
- **Background behavior:** The grid canvas is fixed and doesn't respond to scroll position at all. It doesn't shift, it doesn't intensify, it doesn't change color or density. The same faint grid is behind everything.
- **Rhythm:** Sections are separated by 1px borders (`var(--border)` at 0.15 alpha). Each section fades up identically. There's no zigzag, no stagger between child elements, no variation in reveal direction or timing.
- **Construction/birth feeling:** NO. Sections float up generically. The uniform reveal creates a "PowerPoint" cadence — every slide enters the same way. Count-up animation on metrics is the only exception, but the numbers are styled in `--text-metric: #1c322f` which is barely distinguishable from body text.

---

## D. Modules and Cards

### Isidor (Homepage)
1. **Hero** — Full viewport, wave canvas, headline + sub + 2 CTAs
2. **Investors** — Splide carousel, 5 main logos + 12 advisor logos, auto-scrolling
3. **Enterprise services** — 5 numbered cards (01–05) with corner SVG decoration, titles, descriptions. Alternating left/right alignment.
4. **Performance** — Scroll-triggered video + large statement text
5. **Careers** — 3 job posting cards with location badges, hover-inverted tags
6. **Footer** — Second wave canvas + logo + social links

**Total distinct modular blocks:** 5 enterprise cards + 3 job cards + investor carousel = ~9 interactive modules plus the immersive hero and video sections.

**How they create rhythm:** The numbered cards (01–05) provide a counting rhythm. Alternating alignment creates visual zigzag. Cards have corner decorations that echo across sections. Hover states are inverted (dark → light) creating strong visual punctuation. The carousel creates horizontal motion in a vertical page.

### Kinetica (Homepage)
1. **Hero** — Brand name + tagline + 2 buttons + scroll indicator line
2. **Clinical Signal** — Eyebrow + headline + body paragraph with green left border
3. **Flagship Proof** — 4 metrics + key finding box + expandable target table (5 rows) + GitHub link
4. **Founder** — Bio text + 4 badges + links + 6-item vertical timeline
5. **Systems** — 2 numbered items (01, 02) with badges, descriptions, stack labels, links
6. **Contact** — Centered eyebrow + headline + services + CTA button + 3 links

**Total distinct modular blocks:** 4 metrics + 5 target rows (hidden by default) + 2 system items + 4 founder badges + 6 timeline items = ~21 small blocks, but most are text-only and visually identical.

**How they create (or fail to create) rhythm:** The 2 system items (01, 02) start a numbered rhythm but it ends at 02 — too few to create a real sequence. The metrics are the strongest rhythmic element but are understyled (see E). The timeline is purely typographic with no visual weight. The founder badges are tiny pills that read as metadata, not as modules. Overall, the page reads as a single long article with section headings, not as a system of distinct interactive modules.

---

## E. Color and Contrast

### Isidor
**Distinct colors visibly used (excluding images):**
1. #010101 — Primary dark background (dominant)
2. #0943A0 — Deep blue (gradient overlays, branded sections)
3. #FFFFFF — White (text, inverted hover states)
4. #353535 / rgb(53,53,53) — Medium gray (secondary text)
5. #AEA6B6 — Lavender/gray (wave line color, hero)
6. #978EA1 — Muted purple (footer wave lines)
7. #4d65ff — Vivid blue accent (focus states)

**Distribution:** The dark background + white text creates maximum contrast everywhere. The deep blue gradients create depth and section transitions. The lavender/purple is used for subtle motion elements (waves). The focus blue is reserved for interaction. Colors are applied in zones — each section has its own gradient temperature while maintaining the dark ground.

**Why it works:** High base contrast (dark bg → white text) means EVERY accent color pops. The muted wave colors don't compete with text. The gradient transitions between sections create "rooms" within the page — color defines space.

### Kinetica
**Declared palette (10 colors):**
- --teal: #90a7a5, --green: #6b9e7a, --warm: #c4855a, --slate: #6a8690, --sea: #5d8a82, --moss: #6b8a6d, --ice: #85a8b8, --clay: #a8796e, --sand: #bfa87a, --gold: #d4a843

**Actually visibly used:**
1. --bg (#f0f9f9) — Everything. The entire page.
2. --teal (#90a7a5) — Eyebrow text, grid lines (at 5% alpha = invisible), sys-num (at 35% opacity = pale)
3. --green (#6b9e7a) — Hero button border, ClinicalSignal left border, system badge, aucColor for high values
4. --warm (#c4855a) — System 02 number, key finding border, warm badge
5. --sea (#5d8a82) — Link color, metric labels
6. --text-heading (#1c322f) — Headings, metrics

**Colors NOT visibly used on the homepage:**
- --slate (#6a8690) — Only in the grid canvas palette (invisible)
- --moss (#6b8a6d) — Only in the grid canvas palette (invisible)
- --ice (#85a8b8) — Not used anywhere visible
- --clay (#a8796e) — Not used anywhere visible
- --sand (#bfa87a) — Not used anywhere visible
- --gold (#d4a843) — Declared but not referenced in any component

**Where contrast fails:**
- **Metrics:** The big numbers (0.84, 0.86, etc.) are styled in `--text-metric: #1c322f` which is the same dark green-black as body headings. Against the pale #f0f9f9 background, these should be the most prominent elements on the page but they don't stand out from surrounding text.
- **Sys-num (01, 02):** Rendered at `opacity: 0.35` in `--teal` = effectively transparent. The numbering system that should create visual rhythm is ghosted.
- **Grid background:** All node activations max at 0.22 alpha on a pale background. The 5-color palette used in the grid (teal, green, slate, sea, moss) is invisible to the human eye at these alpha values.
- **Eyebrow labels:** `--text-dim: #7a9690` on #f0f9f9 — low contrast, reads as faded.
- **Overall:** The page uses about 3 of its 10 declared colors in any perceptible way, and those 3 are all in the same muted green-teal family. There is no warmth, no temperature contrast, no color "surprise" anywhere.

---

## F. Typography

### Isidor
- **Font system:** Fluid typography with CSS custom properties scaling from 16px (1920px viewport) to 20px (2640px viewport), with proportional downscaling for tablet and mobile. The base type is clean and large.
- **Motion contribution:** GSAP SplitText breaks headlines into words and lines, then animates them with staggered fade-in-move. The `[shuffle="scroll"]` effect decodes text character by character as you scroll to it. Combined, the typography MOVES — it enters the page, it resolves, it reacts to hover.
- **Scale:** Very large hero text, generous line height, prominent hierarchy between sections. The numbered cards (01–05) use large numbers as structural markers.
- **Alive vs static:** Typography in Isidor IS the animation system. The text doesn't just sit on the page — it arrives, it decodes, it stagger-reveals. Every heading has its own entrance choreography.

### Kinetica
- **Fonts:** Montserrat (headings, body — weights 300, 400, 500, 600) and DM Mono (eyebrows, labels, metrics, links — weights 400, 500). Good pairing.
- **Motion contribution:** The brand name "KINETICA AI" has the 0/1 decode effect on load (once). Metrics have count-up animation. Every other piece of text appears statically or with the generic reveal (fade + translateY).
- **Scale:** Hero text is `clamp(3rem, 5vw, 4rem)` — adequate but not dramatic. Section headings are `clamp(2rem, 3.5vw, 2.5rem)` — similar enough to body that the hierarchy is soft. Metric numbers at `clamp(2.5rem, 4vw, 3.5rem)` are the largest non-hero elements but are styled in the same dark color as headings.
- **Alive vs static:** Typography in Kinetica is 95% static. The one decode effect is isolated to the brand name. No scroll-triggered text animation, no staggered word reveals, no character effects beyond the hero. Type sits on the page as typeset, not as a living element.

---

# TASK 2 — KINETICA DIAGNOSIS

## Why Kinetica Feels Static

### 1. The Background is Invisible
The ArchitecturalGrid canvas operates on a LIGHT background (#f0f9f9). All its visual elements are drawn at alpha values between 0.035 and 0.24. On a light background, these are functionally invisible. The grid lines (0.055 alpha) are noise. The node pulses (0.22 alpha) look like rendering glitches. The cursor proximity effect (0.24 alpha within 160px) requires intentional searching to notice. Compare to Isidor: vivid colored lines (#AEA6B6) on a dark (#010101) background — maximum visibility for ambient motion.

**The grid doesn't create life because you can't see it.**

### 2. One Animation Vocabulary for the Entire Page
Every section except the hero uses the exact same animation: `opacity: 0 → 1` + `translateY(24px) → 0` over 0.8s. There is no variation in direction (always from below), no stagger between child elements within a section, no difference in timing or easing between a heavy metric block and a light eyebrow label. In Isidor, words stagger independently, lines reveal sequentially, text decodes character-by-character, and different sections use different reveal types.

**The monotone reveal makes the page feel like a slideshow, not a living system.**

### 3. The Palette is Wasted
10 named colors are declared. 3 are visible. The warm side of the palette (--clay, --sand, --gold) is completely absent. The cool side (--ice, --slate) appears only in the canvas at invisible alphas. The page is effectively monochrome: pale teal-green on pale mint. There are no color "events" — no moment where a different color family signals a change of context or draws the eye to a key element.

**Without color contrast, the page has no visual landmarks.**

### 4. Metrics Are Undersold
The strongest content on the page — AUC values of 0.84 and 0.86, 198 days, 5 targets — is styled identically to secondary text. The numbers use `--text-metric: #1c322f` which is indistinguishable from heading text. They have no background, no accent color, no border, no icon. Compare to Isidor's numbered cards where "01"–"05" are large, prominent structural markers with corner decorations.

**The proof that makes Kinetica credible is visually buried.**

### 5. Too Few Modular Blocks
The Systems section has only 2 items (01, 02). A numbered list of 2 is not a rhythm — it's an incomplete thought. Isidor's 5 enterprise cards create a real counting sequence. Kinetica's Flagship Proof has 5 expandable target rows, but they're hidden by default behind a toggle. The timeline has 6 items but they're tiny labels, not cards.

**The page has content for 7+ modules but renders them as paragraph text.**

### 6. No Scroll-Responsive Behavior
Nothing on the page responds to scroll position. The background doesn't shift. Text doesn't decode on scroll. No parallax, no scroll-triggered video, no progressive reveal of complex elements. The IntersectionObserver fires once at 15% threshold and that's it — the section is "done."

**After the initial reveal, every section is completely inert.**

### 7. Hover States Are Meaningless
The most prominent hover effect is 4px of left padding on system items. Badge borders go from 0.15 to 0.30 alpha. Target rows get a 0.08 alpha teal fill. None of these create a feeling of interactivity or response. There is no element that "reacts" to the user in a noticeable way.

**The page doesn't acknowledge the user's presence.**

### 8. What's Actively Wrong (Broken/Ugly)
- **Dot grid:** The ArchitecturalGrid renders as a barely-visible lattice of dots and lines that looks like a CSS background-image artifact, not a designed element.
- **Sys-num opacity:** The "01" and "02" numbers are at 0.35 opacity — they're supposed to be structural markers but they're ghosts.
- **Count-up numbers:** The metric count-up animation is good conceptually but the final values don't stand out because of identical color treatment.
- **Expandable targets:** The best proof data (5 clinical targets with AUC + CI) is hidden behind a small toggle that reads as "fine print," not as flagship evidence.
- **No Published/Research section:** There's no dedicated section showing that work is published, peer-visible, open-source. The GitHub link is buried as an inline text link.
- **Timeline:** The founder timeline is a tiny right-column sidebar with 12px mono text. It contains critical credibility data (physics background, 10+ years clinical, COVID frontline) rendered as metadata.

---

# TASK 3 — CLAUDE CODE IMPLEMENTATION BRIEF

## 0. CRITICAL CONSTRAINTS (READ FIRST)

```
DO NOT:
- Delete any existing content or data connections (usePolarData, etc.)
- Create a dark-mode site (keep light background #f0f9f9)
- Use AI gradient clichés (no purple-blue aurora, no mesh gradients)
- Create a generic startup landing page aesthetic
- Use heavy libraries (no Three.js, no Lottie, no GSAP unless absolutely needed)
- Make the grid purely decorative wallpaper
- Flatten modules into paragraphs
- Reduce the number of sections

DO:
- Keep all existing content and expand where specified
- Keep Montserrat + DM Mono font pairing
- Keep the 10-color palette but USE it fully
- Keep React + Vite + vanilla CSS approach
- Keep the canvas-based background but redesign it fundamentally
- Make every section have its own distinct reveal and interaction behavior
- Ensure performance (requestAnimationFrame, offscreen caching, intersection-gated animation)
```

---

## 1. HOMEPAGE MODULES (7 sections, in order)

### MODULE 1: HERO
**Purpose:** System boot sequence. Establish Kinetica as alive, technical, and clinical.

**Content:**
- Brand: "KINETICA AI" (text-decode 0/1 effect — KEEP existing useTextDecode)
- Tagline: "Clinical AI systems built where data meets the patient."
- Sub-tagline (NEW): DM Mono eyebrow, cycling between 3 strings with text-decode between each:
  - "autonomic signal processing"
  - "multi-symptom prediction"
  - "wearable-first architecture"
  Each string holds for 4s, then decodes into the next (0/1 transition, 600ms decode).
- CTAs: 2 buttons (keep existing)
- Scroll indicator: animated pulse line (keep existing, increase visibility)

**Appearance/Motion:**
- On load: Background field initializes first (see Section 3). Brand name decodes over 1400ms. After brand resolves, tagline fades in from below (300ms, ease-out). After tagline, sub-tagline begins its cycling. CTAs fade in 200ms after tagline. Total boot sequence: ~2.5s.
- The hero should feel like a clinical monitoring system booting up — text arriving in sequence, instruments coming online.

**Hover:** Cursor proximity makes background field nodes glow more intensely in the hero zone (already somewhat implemented, but needs to be visible — see Section 3).

---

### MODULE 2: CLINICAL SIGNAL
**Purpose:** State the problem. Why does this work matter?

**Content (keep existing):**
- Eyebrow: "THE CLINICAL QUESTION"
- Headline: "The signal lives in the autonomic nervous system..."
- Body paragraph with green left border

**NEW additions:**
- Add 3 inline stat markers after the body text (styled as small card-like blocks, horizontal row):
  - "HRV" — label: "primary biomarker" — color accent: --sea
  - "ANS" — label: "target system" — color accent: --teal
  - "N=1" — label: "longitudinal proof" — color accent: --warm

**Appearance/Motion:**
- Headline reveals word-by-word (NOT all at once). Implement a simple word-stagger: split headline into words, each word fades in and moves up with a 60ms delay between words.
- Body paragraph reveals as a single block after headline completes.
- The 3 stat markers reveal left-to-right with 120ms stagger, each with a slight scale-up (0.95 → 1.0) + opacity.
- Green left border on body paragraph animates its height from 0 to full over 600ms.

**Hover:**
- Stat markers: on hover, the accent color fill increases from 8% to 20% alpha, and the label text sharpens from --text-dim to --text-sec. Transition 200ms.

---

### MODULE 3: FLAGSHIP PROOF
**Purpose:** The evidence. This is the strongest section — it must hit hard visually.

**Content (keep existing + expand):**
- Eyebrow: "FLAGSHIP RESEARCH"
- Title: "Five symptoms, one watch, zero hospital visits"
- Context line: N=60 · 198 days · LOO-CV · Bootstrap 1000×
- 4 metrics (AUC severity, AUC autonomic, days, targets)
- Key finding block (warm border)
- Expandable 5-target table
- GitHub CTA

**CHANGES:**
1. **Metrics redesign:** Each metric gets a card-like container:
   - Background: the relevant palette color at 0.06 alpha
   - Top border: 2px solid in the accent color
   - The number: rendered in the ACCENT color (not --text-metric)
     - Severity AUC (0.84) → --green
     - Autonomic AUC (0.86) → --sea
     - Days (198) → --teal
     - Targets (5) → --warm
   - DM Mono number at current size but with the color change, they will finally POP
   - Label below in DM Mono uppercase, --text-dim

2. **Targets table: VISIBLE by default** (not hidden behind toggle):
   - Show all 5 targets with their AUC bars
   - Each bar fill uses aucColor() — this already works
   - Add a small pulsing dot (3px circle) at the end of each bar that glows at 0.3 alpha periodically (CSS animation, 3s cycle, staggered per row)

3. **Key finding block:** Add a small "⚡" or abstract SVG symbol (a simple sine wave icon, 16px, drawn with --warm stroke) before the eyebrow "KEY FINDING".

**Appearance/Motion:**
- Metrics: each card counts up (keep useCountUp) BUT also has the card container scale from 0.97 → 1.0 with 80ms stagger left-to-right.
- Target rows: reveal top-to-bottom with 60ms stagger per row.
- AUC bar fills: animate width from 0 over 800ms AFTER the row reveals (so the user sees the bar grow).

**Hover:**
- Metric cards: subtle lift (translateY(-2px)) + shadow increase. Accent color top border thickens from 2px to 3px. Transition 200ms.
- Target rows: background fill to --fill-teal (keep existing but increase to 0.12 alpha).

---

### MODULE 4: FOUNDER
**Purpose:** Credibility. This person has the background to build this.

**Content (keep existing):**
- Eyebrow, name, role, bio, badges, links, timeline

**CHANGES:**
1. **Timeline redesign:** Convert from small sidebar to a horizontal stepper:
   - 6 items in a horizontal row (wrapping on mobile)
   - Each item: year in DM Mono bold + label below
   - Connected by a horizontal line (1px --border) with small circular nodes (6px) at each point
   - The current/latest item (2025 — Kinetica AI) gets a pulsing node in --green
   - Other nodes use their section-appropriate color:
     - 2006 Physics → --ice
     - 2010 Osteopathy → --sea
     - 2014 Clinical → --teal
     - 2020 COVID → --warm
     - 2024 Post-Lyme → --clay
     - 2025 Kinetica → --green

2. **Badges:** Increase padding, give each badge a subtle left border (2px) in a different palette color:
   - "Universidad de Granada" → --ice
   - "10+ years clinical" → --teal
   - "AI Evaluator · Anthropic" → --warm
   - "Nordic-based · Remote" → --sea

**Appearance/Motion:**
- Name does a text-decode effect (like the hero brand, but faster — 800ms, delay 0).
- Timeline items reveal left-to-right with 100ms stagger. The connecting line "draws" from left to right (width animation from 0 to 100% over 1.2s, ease-out).
- Badges fade in with 80ms stagger.

**Hover:**
- Timeline nodes: on hover, show a tooltip-like expanded label. Node scales to 1.3x. Connected line segment brightens.
- Badges: border color intensifies (keep existing + make the left-color-border more vivid on hover).

---

### MODULE 5: SYSTEMS
**Purpose:** What has been built. The portfolio of work.

**Content (keep existing + ADD items):**
- Eyebrow: "SYSTEMS"
- Title: "From heartbeat to prediction"
- Item 01: ANS-Based Multi-Symptom Prediction (keep)
- Item 02: IO3 Clinical AI Agent (keep)
- **NEW Item 03:**
  - Number: 03, color: --sea
  - Badge: "ACTIVE · DAILY COLLECTION" in --sea
  - Title: "Longitudinal Biometric Pipeline"
  - Sub: "Polar API · Automated ETL · 200+ Days"
  - Desc: "Fully automated nightly data extraction from consumer wearable. RR intervals processed into 13 HRV feature families across 3 lag windows. CSV artifacts + GitHub Actions CI."
  - Stack: "Python · Polar AccessLink API · GitHub Actions · CSV"
  - Link: "View data pipeline →" → GitHub repo

- **NEW Item 04:**
  - Number: 04, color: --ice
  - Badge: "FRAMEWORK · INTERNAL" in --ice
  - Title: "ALMA Ethical Framework"
  - Sub: "EU AI Act · Clinical Safety Boundaries · Human-on-Loop"
  - Desc: "Ethical decision framework for clinical AI deployment. Defines safety boundaries, escalation triggers, and human override protocols. Designed for EU AI Act compliance from day one."
  - Stack: "Policy design · EU AI Act · Clinical ethics"
  - Link: none (internal)

**Appearance/Motion:**
- Each item reveals with its number first (number decodes from 0/1 in 400ms), then the content block slides in from the right (translateX(20px) → 0) over 500ms.
- Items stagger by 150ms as the user scrolls.
- The number should be LARGE (3rem) and use its section color at FULL opacity (not 0.35).
- Between items, the divider line "draws" from left to right (width 0 → 100%, 400ms).

**Hover:**
- The entire item card: subtle left border appears (3px in the item's accent color), background shifts to that color at 0.04 alpha. Transition 250ms.
- Number: on hover of the item, the number's opacity goes from 0.6 to 1.0 and it gains a subtle text-shadow in its color.

---

### MODULE 6: PUBLISHED / RESEARCH (NEW SECTION)
**Purpose:** Visible proof that work exists in public. Links, repos, artifacts.

**Content (NEW):**
- Eyebrow: "PUBLISHED"
- Title: "Open research, verifiable systems"
- Grid of 3–4 cards:

  **Card 1:** "polar-lyme-predictor"
  - Type badge: "REPOSITORY" in --green
  - Description: "Multi-symptom clinical prediction from wearable HRV data"
  - Stats: "5 models · 198 days · AUC 0.84"
  - Link: GitHub

  **Card 2:** "Biometric Data Archive"
  - Type badge: "DATASET" in --teal
  - Description: "200+ nights of RR interval data, daily symptom diary, processed HRV features"
  - Stats: "3 CSV files · daily updates"
  - Link: data folder or GitHub

  **Card 3:** "IO3 Architecture"
  - Type badge: "DOCUMENTATION" in --warm
  - Description: "9-node LangGraph clinical reasoning agent. Full system diagram."
  - Stats: "ReAct loop · dual-model"
  - Link: /io-architecture.html

  **Card 4 (optional):** "Clinical Diary Viewer"
  - Type badge: "APPLICATION" in --sea
  - Description: "Interactive symptom + HRV time series visualization"
  - Stats: "live data · daily sync"
  - Link: /diary.html

**Appearance/Motion:**
- Cards use a 2×2 grid on desktop, 1-column on mobile.
- Each card reveals with a slight scale (0.96 → 1.0) + opacity, staggered 100ms.
- The type badge has a small icon-like element: a 12px circle in the badge color that pulses subtly (CSS animation, opacity 0.4 → 0.7, 2.5s cycle).
- Stats line uses DM Mono and the numbers within it are colored in the card's accent color.

**Hover:**
- Card lifts (translateY(-3px)) + border-color intensifies + shadow appears.
- Badge background increases opacity from 0.08 to 0.18.
- The pulsing circle icon speeds up its pulse on hover (from 2.5s to 1s cycle).

---

### MODULE 7: COLLABORATE / CONTACT
**Purpose:** CTA. Invitation to work together.

**Content (keep existing + minor addition):**
- Eyebrow: "COLLABORATE"
- Headline: "Let's build something that works in clinical reality."
- Services line
- CTA button
- Links

**NEW:** Add a small "status" indicator above the CTA:
- A 6px circle (--green) + "Available for projects" in DM Mono, --text-dim
- The circle has a slow pulse animation (CSS, opacity 0.5 → 1.0, 2s cycle) — like a system status LED.

**Appearance/Motion:**
- Headline does word-stagger reveal (same technique as Clinical Signal headline).
- CTA button scales from 0.95 → 1.0 on reveal.
- Status indicator fades in 200ms after headline.

**Hover:**
- CTA button: (keep existing green fill transition)
- Status circle: on hover of the entire contact section, the circle brightens and the text changes from --text-dim to --text-sec.

---

## 2. PER-MODULE SUMMARY TABLE

| # | Module | Cards/Blocks | Reveal Type | Accent Color | Key Interaction |
|---|--------|-------------|-------------|--------------|-----------------|
| 1 | Hero | 0 (text only) | Sequential boot | --teal | Cycling sub-tagline decode |
| 2 | Clinical Signal | 3 stat markers | Word-stagger headline | --sea, --teal, --warm | Stat marker hover fill |
| 3 | Flagship Proof | 4 metric cards + 5 target rows | Count-up + stagger | --green, --sea, --teal, --warm | Metric card lift, bar pulse |
| 4 | Founder | 4 badges + 6 timeline nodes | Line-draw + stagger | --ice, --sea, --teal, --warm, --clay, --green | Timeline node hover expand |
| 5 | Systems | 4 numbered items | Number-decode + slide-right | --teal, --warm, --sea, --ice | Item hover border + fill |
| 6 | Published | 3–4 cards | Scale-up + stagger | --green, --teal, --warm, --sea | Card lift + pulse speed |
| 7 | Contact | 1 status + CTA | Word-stagger | --green | Status LED pulse |

---

## 3. BACKGROUND & MOTION SYSTEM (Replace ArchitecturalGrid)

### Concept: "Clinical Field" — Not a Dot Grid

Replace the current grid of uniform dots and lines with a **field visualization** that evokes clinical monitoring / signal processing.

### Architecture: `ClinicalField.jsx` (canvas, fixed position, z-index: 0)

**Layer 1 — Base Field Lines (static, cached offscreen):**
- Replace the uniform rectangular grid with a set of **horizontal flowing lines** spaced 50–60px apart.
- These lines should NOT be straight. Each line has a very subtle Perlin-noise displacement applied at render time — a gentle, organic wave with amplitude 2–4px and wavelength ~200px. Think: ECG baseline, not graph paper.
- Color: `rgba(144, 167, 165, 0.06)` — slightly more visible than current grid.
- Line weight: 0.5px.
- At every ~120px along each line, place a small **node** (2px circle, same color at 0.08 alpha). These are NOT regular grid intersections — they're positioned on the flowing lines, so they follow the organic displacement.

**Layer 2 — Ambient Signal Pulses (animated, per-frame):**
- Every 3–5 seconds, one horizontal line "activates":
  - A bright wavefront travels along the line from left to right (or right to left, alternating).
  - The wavefront is a 80–120px segment of the line that brightens to 0.15 alpha and shifts color to one of the palette colors (randomly chosen from: --teal, --green, --sea, --moss, --ice).
  - The wavefront moves at ~100px/s, taking 10–15s to cross the screen.
  - As the wavefront passes each node, the node briefly brightens (0.08 → 0.30 alpha) with a pulse that fades over 1.5s.
  - After the wavefront passes, the line returns to its idle state.
- Maximum 2–3 concurrent active lines at any time (don't overwhelm).
- This creates the feeling of data flowing through the system — clinical signals being processed.

**Layer 3 — Cursor Interaction:**
- Radius: 180px around the cursor.
- Within the radius:
  - Lines brighten from 0.06 to 0.12 alpha.
  - Nodes brighten from 0.08 to 0.20 alpha.
  - The closest node to the cursor gets a colored glow: pick the palette color assigned to the current section (based on scroll position — see below).
  - Nodes within the radius get a slight displacement TOWARD the cursor (magnetic attraction, 2–4px max).
- This makes the background respond to the user. On a LIGHT background, these alpha values will be subtle but VISIBLE (unlike the current system).

**Layer 4 — Scroll-Responsive Section Colors:**
- Track which section is currently dominant in the viewport (use scroll position / section offsets).
- When in the Hero zone → ambient pulses use --teal / --sea
- Clinical Signal → --sea / --green
- Flagship Proof → --green / --warm
- Founder → --teal / --ice
- Systems → --warm / --sea
- Published → --green / --teal
- Contact → --sea / --moss
- This means the background "temperature" shifts subtly as the user scrolls. The field reflects the content.

**Performance:**
- Cache Layer 1 to an offscreen canvas (redraw only on resize).
- Layer 2: update wavefront positions per frame, only redraw active line segments + their nearby nodes.
- Layer 3: only process nodes within cursor radius (spatial index: divide screen into 120px cells, only check cells within radius).
- Layer 4: section detection via cached offset array, updated on scroll with throttle (100ms).
- Target: 60fps on modern hardware, 30fps acceptable on lower-end. Use `devicePixelRatio` capped at 1.5.

---

## 4. PALETTE USAGE MAP

### How Each of the 10 Colors Must Be Used:

| Color | Hex | Primary Use | Secondary Use |
|-------|-----|-------------|---------------|
| --teal | #90a7a5 | Grid lines, eyebrow labels, default sys-num, metric "Days" | Badge backgrounds, border accents, cursor glow |
| --green | #6b9e7a | CTA buttons, Severity AUC metric, "Published" badge, timeline node (2025) | Status LED, bar fills for AUC ≥ 0.80, left borders |
| --warm | #c4855a | Key Finding border, sys-num 02, "In Progress" badge, timeline node (2020 COVID) | Alert/emphasis moments, warm section transitions |
| --sea | #5d8a82 | Links, Autonomic AUC metric, "Active" badge, sys-num 03 | Clinical Signal stat marker, field pulse color |
| --slate | #6a8690 | Secondary badges, less prominent labels | Field line pulse color variant |
| --moss | #6b8a6d | Background field pulse color | Contact section field accent |
| --ice | #85a8b8 | Sys-num 04 (ALMA), timeline node (2006 Physics), "Framework" badge | Founder section accents, cool-tone indicators |
| --clay | #a8796e | Timeline node (2024 Post-Lyme) | Warm secondary accent for clinical/patient content |
| --sand | #bfa87a | Dataset-related labels, "data" indicators | Expandable section headers, muted warm accent |
| --gold | #d4a843 | Rare emphasis: final CTA hover glow, exceptional metric highlight | Only for peak moments — a "gold standard" indicator |

### Contrast Fix Rules:
1. **Metric numbers:** MUST use their accent color at full saturation (not --text-metric). The numbers 0.84, 0.86, 198, 5 should each be a different color.
2. **System numbers (01–04):** MUST be at 0.6 opacity minimum (not 0.35). On hover, go to 1.0.
3. **Eyebrow text:** Increase from --text-dim to the section's accent color. "THE CLINICAL QUESTION" in --sea, "FLAGSHIP RESEARCH" in --green, etc.
4. **Badge backgrounds:** Increase from 0.08 alpha to 0.10 alpha for better visibility. On hover, increase to 0.18.

---

## 5. TYPOGRAPHIC MOTION SYSTEM

### Where Text Should Animate:

**A. Text-Decode (0/1 binary resolve) — useTextDecode (existing hook):**
- Hero brand name: on load, 1400ms (KEEP)
- Hero cycling sub-tagline: continuous, 600ms per transition, 4s hold between
- Founder name: on scroll-reveal, 800ms
- System item numbers (01–04): on scroll-reveal, 400ms each
- Published card titles: on scroll-reveal, 500ms

**B. Word-Stagger Reveal (NEW — implement as `useWordStagger` hook):**
- Clinical Signal headline
- Contact headline
- Flagship Proof title
- Implementation: split text into words via `.split(' ')`, wrap each in a `<span>` with `opacity: 0; transform: translateY(12px)`, trigger in sequence with 60ms delay per word on IntersectionObserver.

**C. Count-Up (existing useCountUp):**
- All 4 Flagship Proof metrics (KEEP)
- Published card stats numbers (NEW)

**D. Line-Draw (NEW — CSS animation):**
- Founder timeline connecting line: width 0 → 100% over 1.2s
- System item divider lines: width 0 → 100% over 400ms
- Clinical Signal green left border: height 0 → 100% over 600ms

**E. Character-by-Character (for low-priority text, NOT overused):**
- Hero scroll indicator text (if any)
- Eyebrow labels: fade in character by character over 300ms (very fast, just enough to not be static)

### Constraints:
- No more than 2 animated text elements visible simultaneously.
- All text animations should be triggered by IntersectionObserver (not by scroll position polling).
- Decoded text should resolve to its final state and STAY there — no loops except the hero sub-tagline.
- All animations use `requestAnimationFrame` or CSS transitions (no setInterval-based character swaps — update the existing useTextDecode to use rAF if it doesn't already).

---

## 6. IMPLEMENTATION PRIORITY ORDER

For Claude Code — implement in this order:

1. **ClinicalField.jsx** — Replace ArchitecturalGrid with the new field system. This is the foundation. Test that it's VISIBLE on the light background before proceeding.

2. **useWordStagger.js** — New hook for word-by-word headline reveals. Test on Clinical Signal headline.

3. **Hero.jsx** — Add cycling sub-tagline with text-decode transitions. Ensure boot sequence feels sequential.

4. **FlagshipProof.jsx** — Redesign metrics with colored cards and accent-colored numbers. Make targets visible by default. Add bar pulse animations.

5. **Systems.jsx** — Add items 03 and 04. Increase number visibility. Implement number-decode reveal and slide-right content reveal.

6. **Published.jsx** — New component. 2×2 card grid. Badges with pulse dots.

7. **Founder.jsx** — Horizontal timeline with colored nodes and line-draw animation. Badge left-border colors.

8. **ClinicalSignal.jsx** — Add 3 stat markers. Word-stagger headline.

9. **Contact.jsx** — Status LED. Word-stagger headline.

10. **tokens.css** — Update color usage: eyebrow colors, metric accent colors, badge contrast increases.

---

## 7. FINAL CHECKLIST

Before considering this redesign complete, verify:

- [ ] The background field is VISIBLE on the light #f0f9f9 background (not invisible)
- [ ] At least 8 of 10 palette colors are used somewhere visible on the page
- [ ] Metric numbers are each a DIFFERENT accent color and are the most visually prominent text on the page after the hero
- [ ] System numbers (01–04) are visible at 0.6+ opacity
- [ ] The hero has a multi-step boot sequence (brand → tagline → cycling sub-tagline → CTAs)
- [ ] At least 3 different reveal types are used across sections (word-stagger, text-decode, scale-up, slide-right)
- [ ] The Published section exists with 3+ cards
- [ ] Systems has 4 numbered items (not 2)
- [ ] Founder timeline is horizontal with colored nodes
- [ ] Target data table is visible by default (not hidden behind toggle)
- [ ] Background field changes color temperature per section on scroll
- [ ] Cursor interaction with background is noticeable (not invisible)
- [ ] No section uses the generic fade-up as its ONLY animation
- [ ] Performance: page loads in under 3s, canvas runs at 60fps, no layout thrashing
- [ ] All existing links (GitHub, LinkedIn, email, architecture page, diary page) are preserved
- [ ] Mobile responsive: field simplifies, timeline wraps, metrics stack 2×2
