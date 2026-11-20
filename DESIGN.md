---
name: Ople
description: A warm editorial quarterly for exploring three possible five-year lives.
colors:
  paper: "#f3efe6"
  paper-raised: "#fbf9f3"
  paper-deep: "#e9e3d6"
  ink: "#1b1a17"
  ink-soft: "#454239"
  muted: "#6b675d"
  faint: "#8a8578"
  rule: "#d8d2c5"
  rule-strong: "#b8b1a2"
  a: "#5c6b4f"
  a-soft: "#e4e7dc"
  b: "#2f4f8f"
  b-soft: "#dfe4ef"
  c: "#b24e30"
  c-soft: "#f0ded5"
  work: "#2f4f8f"
  creative: "#b24e30"
  relation: "#5c6b4f"
  rest: "#8a6a3f"
typography:
  display:
    fontFamily: '"Pretendard Variable", Pretendard, sans-serif'
    fontSize: "clamp(2.75rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  title:
    fontFamily: '"Pretendard Variable", Pretendard, sans-serif'
    fontSize: "clamp(2rem, 4.6vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  heading:
    fontFamily: '"Pretendard Variable", Pretendard, sans-serif'
    fontSize: "clamp(1.5rem, 2.6vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.03em"
  deck:
    fontFamily: '"Song Myung", serif'
    fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "-0.01em"
  body:
    fontFamily: '"Pretendard Variable", Pretendard, sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  reading:
    fontFamily: '"Song Myung", serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.9
  ui:
    fontFamily: '"Pretendard Variable", Pretendard, sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
  field:
    fontFamily: '"Pretendard Variable", Pretendard, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '"Pretendard Variable", Pretendard, sans-serif'
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.14em"
rounded:
  sheet: "2px"
  full: "999px"
spacing:
  page-mobile: "20px"
  page-tablet: "36px"
  page-desktop: "64px"
  section-sm: "56px"
  section-lg: "80px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.ui}"
    rounded: "{rounded.sheet}"
    padding: "12px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.sheet}"
    padding: "12px 16px"
    height: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.sheet}"
    padding: "12px 16px"
    height: "44px"
  field:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.sheet}"
    padding: "10px 14px"
    height: "44px"
  notice-error:
    backgroundColor: "{colors.c-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.sheet}"
    padding: "12px 16px"
---

# Design System: Ople

## Overview

**Creative North Star: "The Possible Lives Quarterly"**

Ople reads as a quarterly of possible lives, not a productivity dashboard. The page is a spread: warm paper, ink, an asymmetric editorial grid, and a chronology that behaves like the feature well of a cultural magazine. The product's three futures and its five-year timeline are the content and the ornament; no scene, photograph, or mascot is needed to carry the world.

The system is quiet by construction. Large Korean grotesque headlines do the announcing; Song Myung carries the decks, pull quotes, and the policy article's reading voice; hairline rules, folio metadata, and small data marks do the separating. A/B/C are a fixed color grammar, never a decorative accent. The app keeps standard web controls so the private work of editing a life stays legible.

**Key Characteristics:**
- Warm paper ground with archive ink; flat surfaces and hairline rules.
- A 12-column asymmetric grid with a 7/5 hero, 4/8 feature, 5/7 method, and 1.7/1 planner spread.
- Pretendard for display and interface; Song Myung for decks, pull quotes, and the policy body.
- Three plan roles: olive A, cobalt B, persimmon C; a separate category data palette for work, creative, relation, and rest.
- The five-year chronology is the signature component and the main visual proof.

## Colors

Warm paper and archive ink, with three plan roles and a quieter category palette for data.

### Primary
- **Archive Ink** (#1b1a17): Headlines, primary actions, selected states, and the strongest rules.

### Secondary
- **Olive A** (#5c6b4f): The "current direction" plan, relation data, and quiet affirmative states.
- **Cobalt B** (#2f4f8f): The "alternative direction" plan, work data, and the rating sliders.

### Tertiary
- **Persimmon C** (#b24e30): The "desired life" plan, creative data, the interview's active step, and errors. It is a signal, not a surface wash.

### Neutral
- **Ink Soft** (#454239): Body copy in the planner, descriptions, and metadata over colored bars.
- **Warm Paper** (#f3efe6): The page ground and the editor's desk.
- **Raised Paper** (#fbf9f3): Sheets, panels, form fields, and list surfaces.
- **Deep Paper** (#e9e3d6): Track fills, progress backgrounds, and quiet data grounds.
- **Muted Graphite** (#6b675d): Secondary copy, dates, hints, and inactive labels.
- **Faint** (#8a8578): Control boundaries and the quietest metadata; still ≥3:1 on raised paper.
- **Rule** (#d8d2c5): Hairlines and section separators.
- **Strong Rule** (#b8b1a2): Timeline frame and data panel edges.

### Named Rules
**The Three Futures Rule.** Olive, cobalt, and persimmon identify A, B, and C. They do not become generic decoration, gradients, or page backgrounds.

**The Paper Rule.** The ground is warm paper. No literal scene, photographic hero, gradient text, glass, or soft chrome stands in for the editorial material.

## Typography

**Display Font:** Pretendard Variable (with Pretendard, system sans fallbacks)
**Body Font:** Pretendard Variable (with Pretendard, system sans fallbacks)
**Deck / Article Font:** Song Myung (with serif fallbacks)
**Label / Data:** Pretendard label; monospace only for measurement such as timers and month counts

**Character:** A contemporary Korean grotesque for public voice and interface, paired with a literary Korean serif for the private reading register. The contrast is between the magazine's headlines and the pages you sit with.

### Hierarchy
- **Display** (800, clamp 2.75–5.5rem, 1.02): The home thesis and the largest page openings. Tracking stops at -0.04em.
- **Title** (800, clamp 2–3.5rem, 1.08): Planner name, policy title, and primary page headings.
- **Heading** (700, clamp 1.5–2rem, 1.3): Section headings and modal titles.
- **Deck** (Song Myung 400, clamp 1.05–1.3rem, 1.7): The home deck, interview introduction, summary, and policy lede.
- **Body** (Pretendard 400, 16px, 1.7): Interface copy and the planner description.
- **Reading** (Song Myung 400, 16px, 1.9, 65–75ch): The policy article and other long-form reading pages.
- **Label** (Pretendard 700, 10px, 0.14em, uppercase): Folios and issue metadata only; not a kicker above a heading.
- **Field** (Pretendard 400, 15px, 1.6): Inputs, selects, and textareas.

### Named Rules
**The Two Voices Rule.** Pretendard carries navigation, headlines, controls, and working copy. Song Myung carries decks, pull quotes, and the policy article. Never set the main headline in the serif.

**The No Kicker Rule.** A heading carries its own weight. Do not add a small uppercase eyebrow above a heading; keep labels for folios, panels, lists, and navigation.

## Layout

The page shell is capped at 1440px with 20px mobile, 36px tablet, and 64px desktop gutters. Layouts use a 12-column grid with deliberate asymmetry: the home places a 7-column thesis against a 5-column contents panel; the feature is 4/8; the method is 5/7; the planner board is a 1.7/1 spread at large widths and a single column below 1024px.

The masthead is sticky; pages scroll naturally and the footer closes the page. The planner board keeps the chronology first on mobile, then the activity index and the plan sidebar. The five-year timeline is horizontally scrollable below 768px with a visible swipe hint. The policy article uses a 220px contents rail at 1024px and above, and a single readable column below. Modals are centered paper sheets with 12px mobile margins and a 560px desktop measure. Section rhythm is generous above a heading and tighter below it.

## Elevation & Depth

The system is flat by default. Warm paper, tonal fills, and 1px rules create depth without cards. The only elevation is the modal sheet (`0 24px 60px rgba(27, 26, 23, 0.12)`), which separates a protected task from the page. Timeline and rating surfaces use tinted grounds and category edges, never drop shadows.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 24px 60px rgba(27, 26, 23, 0.12)`): The only shadow; used for modal sheets and nothing else.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Elevation appears only when a modal protects a task; a card shadow never substitutes for a hairline.

## Shapes

Corners are almost square. Sheets, buttons, fields, and panels use a 2px radius; data marks and timeline bars are square. Full circles belong only to status dots and the recorder controls. Structure comes from 1px hairlines and the 3px category edge on a timeline bar; it does not come from rounded cards or side stripes on boxes.

## Components

### Buttons
- **Shape:** 2px radius, 44px minimum height.
- **Primary:** Archive Ink fill, Warm Paper text, 12px × 16px padding. Carries the one action that starts or completes a task.
- **Secondary:** Raised Paper fill, Ink text, Faint 1px border, 12px × 16px padding. Used for adjacent actions and export.
- **Quiet:** Transparent, Ink text with a rule-colored underline; used for row actions such as rename and logout.
- **Icon:** 44px square, Raised Paper, Faint border; the account and edit actions.
- **Danger:** Ink text with a persimmon underline at rest; hover fills with the persimmon wash and keeps Ink text for contrast.
- **Hover / Focus:** Border shifts to Ink; focus-visible is a 2px Ink outline at 3px offset. Disabled controls drop to 40% opacity.

### Fields
- **Style:** Raised Paper, 1px Faint border, 2px radius, 44px minimum height, 15px text, Muted placeholder.
- **Focus:** Border shifts to Ink and a 2px Ink focus-visible outline appears; the caret is Ink.
- **Error / Disabled:** Errors use the Notice; disabled fields use the shared 40% opacity treatment.

### Notices
- **Style:** Full 1px border with a soft tint; errors use Persimmon's soft ground and a Persimmon border, information uses Rule on Raised Paper. No one-sided side stripe.
- **Role:** Errors announce themselves with `role="alert"`; information uses `role="status"`.

### Modal
- **Style:** Raised Paper sheet, 2px radius, Ink border, Sheet shadow, 560px desktop measure, 12px mobile margins. The title stands alone; there is no eyebrow.
- **Behavior:** Native `<dialog>` with focus restoration, escape and backdrop dismissal, and content-height scrolling.

### Planner Tabs
- **Style:** Three equal sections with a top rule; the active section takes its A/B/C accent border and Raised Paper ground. The letter and kind remain visible at mobile widths.

### Timeline
- **Style:** A 60-month grid with five year columns, a 10px year scale, 44px activity bars, and a 10px period line. Bars use the category's soft fill and a 3px category edge.
- **State:** Long-press to select, then drag the body or the 44px end handles; arrow keys adjust by month. Selected bars take a 2px Ink ring. The activity index below the grid exposes every title and period for short bars.
- **Export:** The PNG mirrors the paper ground, year rules, category tints, and Ink Soft metadata.

### Self-rating
- **Style:** Two-by-two data cells with a label, a large numeral, and a 3px Ink rule. The editor uses 0–10 sliders with a cobalt accent and a visible /10 scale.
- **Empty:** Unrated axes read "미평가"; a zero reads "0".

### Navigation
- **Style:** Sticky Warm Paper masthead with the Ople wordmark, an issue folio, "내 플래너", and the account control. The footer is a ruled colophon with the policy links.
- **Mobile:** The issue folio hides; the wordmark, planner link, and account remain. Every control keeps a 44px target.

## Do's and Don'ts

### Do:
- **Do** use the warm paper ground, archive ink, and 1px rules to carry structure.
- **Do** keep olive A, cobalt B, and persimmon C for plan identity and data, not decoration.
- **Do** set decks, pull quotes, and the policy body in Song Myung; keep headlines and controls in Pretendard.
- **Do** make the five-year chronology the hero and use the activity index to make short bars readable.
- **Do** label example data as example and keep the app's real controls standard.
- **Do** preserve 44px targets, visible focus, the sticky-header scroll offset, and the reduced-motion reset.

### Don't:
- **Don't** add a kicker or eyebrow above a heading.
- **Don't** introduce literal scenes, photography, gradients, glass, or chrome as a stand-in for the editorial material.
- **Don't** use cards, nested cards, hard offset shadows, or one-sided side stripes on boxes.
- **Don't** use Unicode glyphs or emoji as an icon system; use the drawn icons.
- **Don't** push display tracking past -0.04em or set the main headline in the serif.
- **Don't** use monospace for labels that are not measurement or data.
