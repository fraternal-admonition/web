<!-- filename: design-style.md -->
# Fraternal Admonition — Global Design Style Guide  
**Master Visual & UX Language**  
_Last updated: 2025-10-06_

---

## 🕊️ 1. Design Philosophy

Fraternal Admonition’s design language unites **moral gravity**, **artistic restraint**, and **modern clarity**.  
It should evoke *truth, conscience, and transcendence* — while feeling clean, credible, and digital‑first.

The interface embodies the **principle of admonitio fraterna**: dignity in critique, compassion in truth.  
This is reflected visually through balance — between **light and shadow**, **tradition and modernity**, **emotion and restraint**.

### Core attributes:
- **Moral:** rooted in faith and ethical clarity  
- **Editorial:** text-centered, structured, confident typography  
- **Artistic:** handmade details, textures, natural materials  
- **Modern:** smooth motion, responsive precision, generous whitespace  
- **Human:** no corporate gloss; honesty through design simplicity  

---

## ✒️ 2. Typography

Typography is the project’s voice. It must feel timeless, articulate, and literate — like a modern journal of moral essays.

### Primary Typeface
**Playfair Display** (serif)  
→ for headlines, hero text, and major quotes  
- Weight range: 400–700  
- Line height: 1.2–1.4  
- Tracking: slightly reduced (‑0.02em)  
- Emotion: classical, contemplative, moral authority  

### Secondary Typeface
**Source Serif Pro** or **Literata**  
→ for long-form reading, body copy, and quotations  
- Weight range: 300–600  
- Line height: 1.6–1.8 for readability  
- Tone: academic, gentle, respectful  

### Sans-Serif Accent
**Inter** or **IBM Plex Sans**  
→ for UI, buttons, navigation, system elements  
- Clean, rational, readable at all sizes  
- Used for clarity — not decoration  

### Hierarchy Examples
| Level | Font | Size | Use |
|-------|------|------|-----|
| H1 | Playfair 700 | 48–64px | Hero / page titles |
| H2 | Playfair 600 | 32–40px | Section titles |
| H3 | Source Serif 600 | 24–28px | Subsections |
| Body | Source Serif 400 | 18–20px | Paragraphs |
| Small | Inter 400 | 14–16px | Captions, metadata |

---

## 🎨 3. Color System

Fraternal Admonition’s palette expresses solemnity, warmth, and timelessness — inspired by **parchment, ink, wood, and gold**.

### Core Palette

| Tone | Color | Usage |
|------|--------|-------|
| Base Background | #F9F9F7 | Paper texture background |
| Primary Text | #222222 | Main text / headings |
| Secondary Text | #444444 | Subtext / metadata |
| Divider Grey | #E5E5E0 | Borders, structure lines |
| Deep Teal | #004D40 | Buttons, accents, focus |
| Muted Gold | #C19A43 | Highlights, details, icons |
| Burgundy | #6C1E2B | Emotional highlights |
| Pure White | #FFFFFF | Contrast areas / modal surfaces |

### Dark Mode Palette (optional)
- Background: #121212  
- Text: #F0F0F0  
- Accents: Gold shifts warmer (#D7B55D)  
- Buttons: #1B3B3B with white text  

### Application Guidelines
- Prefer **off-white**, not pure white backgrounds.  
- Gold should *never* feel metallic or flashy — matte, symbolic, sacred.  
- Burgundy sparingly for emotional or literary emphasis (quotes, errors).  
- Teal is the functional color — used for actionable elements.  

---

## 📐 4. Layout & Spacing

### Grid
- **12-column responsive grid**
  - Container max-width: 1280px  
  - Reading width: ~720px  
- **Vertical rhythm:** baseline 8px  
  - Section spacing: 80–120px  
  - Component spacing: 24–40px  
  - Inner padding: 16–24px  

### Alignment
- Text-heavy pages: center or left-aligned depending on density  
- Mixed-content pages (art + text): use split layout (image 40–50%, text 50–60%)  
- Always maintain strong top margins to allow breathing space  

### Composition
- Combine rigid geometry (grids) with **organic contrast** — textures, light shadows, or line art.  
- Use **asymmetry** occasionally (hero layout, image offset) to evoke tension and balance.

---

## 📜 5. Texture & Material

Subtle, analog materials connect the moral and artistic foundation of FA.

- **Paper grain:** ultra-soft overlay (opacity 5–8%) across main backgrounds.  
- **Wood / linen patterns:** light accent on banners or section dividers.  
- **Ink motifs:** use sparingly (strokes, faint lines, flourishes).  
- **Gold foil effect:** only for logo or important divider icons.  
- **Shadow depth:** 8–16px soft blur, warm tone (no harsh black shadows).  

These create warmth without noise — the site should feel *printed*, not *plastic*.

---

## 🧭 6. Navigation

- **Top Nav:** fixed, translucent paper backdrop with light border.  
- **Typography:** Inter uppercase, spaced lettering.  
- **Hover:** underline with gold accent animation (150ms ease).  
- **Mobile nav:** sliding panel (full-height, fade blur backdrop).  
- **Dropdowns:** avoided — prefer scroll or anchor sections.  

---

## 🔘 7. Buttons & Interactive Elements

### Shape
- Rounded‑md (8px radius), no heavy borders.  
- Focus ring: gold (2px glow).  

### States
| State | BG | Text | Shadow |
|--------|----|------|--------|
| Default | Deep teal | White | Subtle |
| Hover | Darker teal | White | Slight lift |
| Active | Teal | White | Inner shadow |
| Disabled | Grey #E0E0E0 | #777 | None |

### Secondary Buttons
- Transparent with gold border (#C19A43)  
- Hover → soft gold fill, white text.  

### Links
- No underlines by default.  
- On hover: animated underline draw‑in (0.3s ease).

---

## 🗂️ 8. Components

### Cards
- Paper‑like surface (#FFFFFF with 4% texture overlay).  
- Shadow: 4px 8px rgba(0,0,0,0.05).  
- Header serif title, body text serif or sans.  
- Rounded corners (12px).  

### Modals
- Centered, fixed width (600–700px).  
- Background: slightly transparent overlay (#000000AA).  
- Border: 1px gold accent, soft shadow.  
- Open/close animation: fade + scale (250ms).  

### Tables
- Minimal lines (#E5E5E0).  
- Row hover → light gold tint (#FFF9ED).  
- Header row bold serif.  

### Forms
- Inputs: border 1px #D8D8D8, padding 12–16px.  
- Focus → border teal, glow gold.  
- Labels: uppercase Inter 12px.  
- Error → burgundy text, gold underline.  

---

## 🌗 9. Motion & Transitions

**Motion Philosophy:** subtle, intentional, editorial — like the turning of a page or the moving of light.

- **Page transitions:** fade + slide‑up (250–400ms).  
- **Text reveal:** fade + translate‑Y (Framer Motion).  
- **Scroll animations:** trigger once, gentle opacity easing.  
- **Icons:** rotate or pulse slightly on hover.  
- **Modal in/out:** scale 0.95 → 1.0 with easing.  

Avoid overanimation. Motion should feel like **breathing** — rhythmic, reverent, soft.

---

## 🕯️ 10. Imagery & Illustration Style

**Visual Tone:** contemplative, painterly, cinematic stillness.  
All imagery should appear as if taken or painted in natural light, avoiding synthetic or cartoonish styles.

### Characteristics
- Soft focus, shallow depth of field  
- Warm light tones (sunset, candle, amber)  
- Parchment, fabric, wood textures  
- Gold, red, and dark teal accents  
- Never use stock-photo smiles or generic business imagery  
- Symbolic over literal (hands, letters, scales, shadows, water, light)  

---

## 🧩 11. Iconography

- **Style:** line icons with minimal stroke (1.5–2px).  
- **Color:** text grey or muted gold.  
- **Corner radius:** rounded ends.  
- **Behavior:** fade-in hover, no pop effects.  
- Use icons sparingly — they support, not dominate, meaning.  

---

## ⚙️ 12. Accessibility & Usability

- Contrast ratio ≥ 4.5:1 for all text.  
- Keyboard focus visible everywhere.  
- Alt text mandatory for all decorative images (or marked role="presentation").  
- Responsive up to 320px width.  
- Avoid motion-triggered content for accessibility reasons.  

---

## 💬 13. Tone of Content

Typography and copy presentation should align with FA’s mission: dignified, reflective, universal.  

- Avoid slogans; prefer statements of principle.  
- Use italics for biblical or literary references.  
- Limit exclamation marks entirely.  
- Section introductions should feel like essays — calm, reasoned.  
- Always prioritize *voice over decoration.*  

---

## 🧱 14. Composition Examples

1. **Landing page** — large hero, text-centered, balanced negative space.  
2. **Editorial page** — narrow reading column, drop caps, pull quotes, alternating text + visual.  
3. **Gallery / Art section** — grid with paper-card frames, hover zoom, caption overlay.  
4. **Form / Submission page** — minimalist, warm tones, reduced distractions.  
5. **Admin / CMS area** — neutral palette, sans-serif UI, subtle teal focus states.

---

## 🌌 15. Future Extensions

This design system must seamlessly scale to:  
- **Letters to Goliath Contest Portal** — maintain editorial tone, introduce anonymity-driven design (codes, initials).  
- **WWGS? Essay Contest** — preserve FA’s dignity, introduce academic minimalism.  
- **Book & Exhibition Microsite** — more texture, light photography, and narrative scrolls.  

All share the same foundation: moral serenity meets contemporary craftsmanship.

---

**End of design-style.md — Global Visual Language for Fraternal Admonition**