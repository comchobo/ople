---
targets: ["/planners", "/planners/new", "/planners/[id]"]
mode: operate
---

# Planner app

## Scope and mode

- `/planners`, `/planners/new`, `/planners/[id]`; shared masthead, footer, and modals.
- Mode: Operate.

## Task, information, states

- Task: return to saved planners, run the 10-question voice interview, read and edit three 5-year plans, rate, and export.
- Information: planner name/date/count, generation status, question/progress, plan kind/title/description, activities (title/category/start/duration), four ratings, errors.
- States: loading, empty, error, generating, retry, recording/paused/submitting, selected/editing activity, overlong names and descriptions, 0/미평가, 60-month boundaries.

## Constraints

- Preserve routes, API behavior, accessible names, keyboard operation, and 44px targets.
- Tablet-first; mobile shows the timeline first, details below, with standard controls.

## Direction contract

THESIS: The working app is the same quarterly opened to its planner spread: editorial hierarchy makes the three plans and the chronology scannable without turning them into a dashboard.
OWN-WORLD: the home palette and type system; A/B/C section markers in olive, cobalt, and persimmon; category colors on a shared data palette; 12-column grid, hairline rules, large numerals, folios; standard web controls only.
STORY: the visitor sees what is saved, opens one planner, switches between three futures, edits activities in place, rates them, and leaves with an image.
FIRST VIEWPORT: `/planners` as an editorial index: masthead, large `내 플래너` title with count and folio, primary `새 플래너 만들기` action, then a ruled list of planners with dates and quiet row actions; empty state as a blank issue.
FORM: editorial system, the user's chosen family after rounds 1–3; seed: d1c95d0f2a671ff1 (the safer-register round that produced the selection).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
