<!-- filename: mega-checklist.md -->
# Fraternal Admonition — Homepage (MEGA Phase)
**Content & Design Planning Document**  
_Last updated: 2025-10-06_

---

## 🏛️ Purpose

This document defines the **temporary homepage** of **Fraternal Admonition (FA)**, the official web presence to be shown during the **MEGA Dubrovnik networking event**.  
All other pages (About, Contest, Contact, etc.) will remain accessible as **navigation placeholders** triggering an *“Under Construction”* modal.  
The homepage must visually communicate credibility, moral depth, artistic seriousness, and faith-based authenticity.

---

## 🧭 Structure Overview

### Navigation Bar
**Elements:**
- Logo: *Fraternal Admonition* (simple serif type, gold accent)
- Links (all trigger modal):
  - About
  - Contest
  - Contact
  - Updates
- Right-aligned CTA Button → “Get Updates”

**Modal text:**  
> “This section is under construction. Please check back after the Make Europe Great Again Conference in Dubrovnik.”  

**Design notes:**
- Sticky top bar with subtle paper texture background.
- Font: *Inter* or *Merriweather Sans* (uppercase, letter-spacing 0.05em).
- On scroll: light border-bottom fade-in animation (300ms).

---

## 🦁 Hero Section

### Headline (formatted copy)
> **Fraternal Admonition – *Mt 18:15–17***

### Subheadline (formatted copy)
> *Fraternal Admonition (Latin: Admonitio Fraterna)* is the biblical principle of love expressed through admonition—an act of warning before public judgment. It is not condemnation, but a final appeal to conscience, spoken with the aim of preserving dignity before exposure.

### Design notes
- Layout: Center-aligned column, ~70% viewport height.
- Background: light paper texture (subtle grain, off-white #F9F9F7).
- Text color: #222, serif typography (Playfair Display).
- Add soft gold underline flourish below headline (svg decorative line).
- Two buttons below subheadline:
  - **Learn More (About)** → triggers modal.
  - **Get Updates** → triggers same modal.

### 🎨 Image Prompt #1 — Hero Visual
**Placement:** Right side of hero (50% split layout).  
**Prompt:**  
> *“Conceptual art installation representing moral confrontation and divine reflection — a symbolic David vs. Goliath moment rendered abstractly in light and shadow. Include elements of parchment, ink, and faint cross silhouettes. Style: editorial photography + light texture overlay. Aspect ratio 3:2, non-transparent background.”*

---

## ✨ Introduction Section

### Text Copy
> **Fraternal Admonition is not an organization, but a principle.**  
> It is a call to moral action in today’s world: the responsibility to speak truthfully when power denies justice, and to do so in a way that still honors the one who has done wrong.  
>
> The project’s first expression is the book *Letters to Goliath.* After more than 25 years of seeking justice through courts and institutions, a Croatian entrepreneur who suffered great injustice now turns his personal struggle into a universal voice.  
>
> The book gathers **50 letters and 50 paintings**—a final *fraternal admonition* addressed to a modern Goliath: a powerful state and its corporation, left unnamed to keep the book universal and academic in tone.

**CTA:**  
Button: “👉 To learn more about the story and the book” → triggers same “Under Construction” modal.

### 🎨 Image Prompt #2 — Introduction Illustration
**Placement:** Right-aligned, beside text block (desktop), above text (mobile).  
**Prompt:**  
> *“An open handmade book lying on a wooden desk with faint sunlight. Pages show handwritten letters and painted symbols. Style: cinematic realism, shallow depth of field, warm lighting, off-white tones. Aspect ratio 3:2, non-transparent.”*

---

## 🎨 Teaser – The Cover Installation

### Text Copy
> **Our cover is not a graphic design but an installation:** painting, wood, and engraved text, photographed in motion.  
>  
> *Because real battles are never still.*  

**Subtext (caption):**
> (Visual: painting by Viktoriia + red-gold frame + hanging wooden slats with engraved text, photographed mid-swing.)

### 🎨 Image Prompt #3 — Cover Installation Visual
**Placement:** Centered full-width banner.  
**Prompt:**  
> *“Fine art installation composed of a red-gold framed painting with suspended wooden slats engraved with text. The whole piece in mid-motion swing, captured in warm studio lighting. Include dynamic blur to suggest motion. Aspect ratio 16:9, non-transparent background.”*

---

## 🙏 What Comes After This Book?

### Text Copy
> This book is my attempt to turn personal injustice into what, for me, an ideal book should be: a union of morality, philosophy, and art—rooted in a deep, painful, almost lifelong experience. It says what needs to be said now, without noise or spectacle.  
>
> As readers move through the paintings, editorial selections, and brief reflections, quiet connections begin to appear.  
> When it is finished, I will thank the Lord—and ask what more, if anything, He would have me do in this situation, to His glory.

**Design notes:**
- Layout: single centered column (~700px max width).
- Font: *Source Serif Pro*, italics for “quiet connections…” line.
- Decorative background: faint vignette with gold gradient edges.

### 🎨 Image Prompt #4 — Reflection Visual
**Placement:** Right side or background behind the section.  
**Prompt:**  
> *“Softly lit symbolic photograph: open Bible on a wooden table, candlelight glow, and subtle gold reflection. Mood: reflective, reverent, warm tone. Aspect ratio 3:2, non-transparent background.”*

---

## 🚀 Call-To-Action Section

**Buttons:**  
- **Join the Contest**  
- **Get Updates**  

Both trigger modal identical to “About” modal.  

**Design notes:**  
- Horizontal alignment on desktop, stacked on mobile.  
- Button color: deep teal (#004D40) with white text, hover → darker teal.  
- Subtext below buttons:  
  > “Stay informed. The story continues.”

### 🎨 Image Prompt #5 — CTA Decorative Visual
**Placement:** Background accent behind buttons.  
**Prompt:**  
> *“Minimalist abstract texture of parchment folds and ink brush strokes forming subtle circular flow behind buttons. No text. Style: semi-abstract digital art, beige and gold tones. Aspect ratio 16:9, transparent background.”*

---

## 🧾 Footer

**Content:**  
- Left: small FA logo + © 2025 Fraternal Admonition  
- Center: links (About, Contest, Contact, Terms) — same modal trigger.  
- Right: small gold cross icon (SVG).  

**Design notes:**  
- Background: slightly darker paper tone (#F3F3EF).  
- Font size: 14px, line-height 1.6.  
- Hover color: muted gold.

---

## ⚙️ Behavior Summary

- **Modals:** triggered by all nav links and CTAs. Smooth fade-in (300ms), gold accent border, close icon (top right).  
- **Scroll effects:** gentle fade-ins between sections (Framer Motion).  
- **Responsive:** each section stacks vertically with consistent spacing.  
- **Initial animation:** hero headline fades up, underline draws in SVG motion.  
- **Load time:** target <1.5s on Vercel preview.

---

## 📸 Sora AI Image Summary Table

| Section | Aspect | Transparency | Description Summary |
|----------|---------|---------------|----------------------|
| Hero Visual | 3:2 | No | Abstract moral confrontation (light & shadow, parchment motifs) |
| Introduction Illustration | 3:2 | No | Open handmade book, sunlight, handwritten letters |
| Cover Installation | 16:9 | No | Painting with wood slats, photographed mid-swing |
| Reflection Visual | 3:2 | No | Bible, candlelight, reverent mood |
| CTA Decorative Visual | 16:9 | Yes | Parchment + ink abstract background texture |

---

**End of mega-checklist.md — For Windsurf Design & Content Planning**