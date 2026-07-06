---
name: design-tweaks
description: 'Modifies an EXISTING HTML artifact — the user has something and wants it changed, not judged and not regenerated. Two modes: (A) surgical edit — apply the user''s named changes ("make the hero darker", "swap slides 3 and 5", "shrink the type") and re-emit the artifact; (B) tweak panel — wrap the artifact with a live side panel of parameterized knobs (accent / type scale / density / light-dark / motion, via `assets/wrap.html`) so the user explores variants themselves without re-prompting. Use when the brief says "tweak this", "change X on the page you made", "adjust the deck", "let me play with variants", "side-by-side options", "live knobs". Do NOT trigger for generating something new (the design-* generators), or for judgment on quality without changes (design-critique — written verdict, no artifact). Rule of thumb: user wants CHANGES → this skill; user wants an OPINION → design-critique.'
---

# design-tweaks

Change an existing artifact. Never regenerate from scratch; never critique — edit.

Scope boundary (mutually exclusive with `design-critique`):
- **tweaks** — user has an artifact and wants *changes*. Output: modified HTML artifact.
- **critique** — user wants *judgment*. Output: written markdown, no artifact. If they want the critique's fixes applied afterward, that follow-up lands here.

## When to use

- "make the hero darker" / "change the accent" / "swap slide 3 and 5" — Mode A
- "tighten the spacing on the deck you just made" — Mode A
- "let me adjust it myself" / "give me variants side by side" / "live knobs" — Mode B

Do NOT trigger for:
- No existing artifact — route to the right generator (`design-saas-landing`, `design-simple-deck`, …).
- "what's wrong with this design" — `design-critique`.
- A change so large it's a re-brief ("make the landing page a deck instead") — regenerate with the right skill.

## Step 1 — Acquire the artifact (both modes)

1. **Project file** — user names an HTML file; Read it.
2. **Pasted HTML** — read it from the message.
3. **Generated earlier this conversation** — re-read your own `<artifact>` output.

If multiple candidates exist, ask which one. Never guess, never edit two.

## Step 2 — Pick the mode

| Signal | Mode |
|---|---|
| User names concrete changes ("darker", "bigger", "move X") | **A — surgical edit** |
| User wants to explore/dial-in themselves, present variants, ship a playable demo | **B — tweak panel** |
| Ambiguous ("can I adjust this?") | Ask one question: "want me to make specific changes, or give you a live panel to play with?" |

## Mode A — Surgical edit

1. **Restate the change list** in one line ("Changing: hero → dark, accent → 1 use, slide 5 stat → 38×"). If any requested change is ambiguous, ask before editing — a wrong surgical edit costs a full round-trip.
2. **Edit minimally.** Touch only the CSS rules / elements the change requires. Preserve everything else byte-for-byte: nav scripts, `data-od-id` / `data-screen-label` attributes, `:root` token structure, the accent budget.
3. **Stay inside the design system.** New colors must be DESIGN.md tokens (root `DESIGN.md`) or `color-mix()` of existing tokens. If the user asks for an off-system color, say so and offer the nearest token — apply the literal request only if they insist.
4. **Guard the invariants** of the source skill: deck theme-rhythm rules, accent ≤ 2 per screen, serif display font, no `scrollIntoView()`, no external requests. If a requested change breaks one, flag it in your one pre-artifact sentence and do it anyway if the user already confirmed.
5. **Re-emit the FULL artifact with the SAME identifier** so it replaces the original in place.

## Mode B — Tweak panel

Wrap the artifact with a fixed sidebar (drawer under 720px) of live controls bound to CSS custom properties via the vanilla-JS bridge in `assets/wrap.html`. Choices persist to `localStorage`; <kbd>T</kbd> toggles the panel, <kbd>R</kbd> resets.

### The 5 standard knobs — ship a subset, 3 is the sweet spot

| Knob | Values | Include when | Mechanism |
|---|---|---|---|
| `--accent` | 5–8 curated swatches (never a free color picker) | Artifact has 1 accent used ≥ 3 times | All accent uses read `var(--accent)` |
| `--scale` | Compact 0.85 / Normal 1.0 / Generous 1.15 (never beyond ±15%) | Type-driven artifact (article, deck, pricing) | `font-size: calc(base * var(--scale))` |
| `--density` | Tight 0.75 / Normal 1.0 / Roomy 1.4 | Consistent gap/padding rhythm (deck, dashboard, landing) | `padding/gap/margin: calc(base * var(--density))` |
| `--mode` | light / dark via `data-mode` on `<html>` | Artifact has dark tokens or you can derive them | Two color sets on `:root`; replaces any media-query dark mode (user choice beats OS) |
| `--motion-mult` | Off 0s / Subtle 1.0 / Lively 1.6 | Any transition/animation worth scaling | `transition-duration: calc(base * var(--motion-mult))`; default Off when `prefers-reduced-motion` |

### Build steps

1. **Read the artifact's CSS** and decide yes/no per knob (table above). Fewer, working knobs beat five fragile ones.
2. **Lift hard-coded values into custom properties.** Copy the naming scheme from `assets/wrap.html`'s `<style>` block:
   - `color: #c96442` → `color: var(--accent)`
   - `font-size: 18px` → `font-size: calc(18px * var(--scale))`
   - `padding: 24px 32px` → `padding: calc(24px * var(--density)) calc(32px * var(--density))`
   - `transition: opacity 200ms` → `transition: opacity calc(200ms * var(--motion-mult))`
   - For `clamp()` / `vw` values, multiply the *outer* expression — don't tear the `clamp()` apart.
3. **Paste** the artifact's `<style>` and `<body>` into the marked regions of `wrap.html`. Keep the panel + bridge intact — it loads `localStorage[STORAGE_KEY]`, applies values via `setProperty`, writes back on every `change`, and wires <kbd>T</kbd>/<kbd>R</kbd>.
4. **Trim `KNOBS`** in the bridge to only the knobs you kept. Set `STORAGE_KEY` to `tweaks-<artifact-slug>` — unique per artifact so two open tabs never share state. Accent swatches must be DESIGN.md-compatible curated values, e.g.:

   ```js
   const ACCENT_PRESETS = [
     { id: 'rosso',    val: '#DA291C', label: 'Rosso' },     // from DESIGN.md
     { id: 'graphite', val: '#303030', label: 'Graphite' },
     { id: 'navy',     val: '#3860BE', label: 'Navy' },
   ];
   ```

5. **Test the loop mentally:** each knob changed once → layout survives → refresh → choice persists. A knob that breaks layout gets *removed*, not shipped.

When *not* to wrap: one-shot artifacts nobody will iterate on (runbooks), or artifacts whose value is fixed ratios (carefully balanced data viz) — knobs would degrade them. Say so and offer Mode A instead.

## Output contract

Mode A — same identifier as the original so it replaces in place:

```
<artifact identifier="<original-slug>" type="text/html" title="<Original Title>">
<!doctype html>
<html>...</html>
</artifact>
```

Mode B — new identifier prefixed `tweaks-`:

```
<artifact identifier="tweaks-<artifact-slug>" type="text/html" title="<Artifact Title> · Tweaks">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact (Mode A: what changed; Mode B: which knobs shipped, e.g. "Wrapped the deck with a 3-knob panel — accent / scale / mode."). Nothing after.

## Example — great Mode A result (the whole visible exchange)

```
User: "On the Relay landing you made — hero background to black,
       and the testimonial section is too tall."

One sentence emitted: "Hero flipped to the black cinematic surface and
proof section padding halved — everything else untouched."

<artifact identifier="relay-landing" type="text/html" title="Relay — Landing">
  <!-- diff vs original, everything else byte-identical:
       .hero { background: var(--bg-dark); color: var(--fg-inverse); }
       .hero .btn-primary unchanged (accent budget intact)
       .proof { padding-block: calc(var(--space-xl) / 2); }        -->
</artifact>
```

## Hard rules

- **Never a free color picker** — curated swatches only, drawn from or compatible with DESIGN.md.
- **Persist per artifact** — `tweaks-<slug>`, never a global key.
- **Respect `prefers-reduced-motion`** — motion defaults Off for those users; explicit click overrides.
- **Single file** — panel + bridge inlined; no external CSS/JS/fonts beyond what the artifact already had; no network requests.
- **≤ 5 knobs, 3 is the sweet spot.** A broken knob is removed, not shipped.
- **Mode A preserves everything not named in the change list** — including nav scripts and `data-*` attributes.

## Failure modes

| Symptom | Fix |
|---------|-----|
| No artifact found | This is a generation request — route to the right design-* generator |
| Multiple HTML files match | Ask which one; never edit two |
| Requested color off-system | Offer nearest DESIGN.md token; apply literal only on insistence |
| Change breaks a source-skill invariant (rhythm, nav script) | Flag it in the pre-artifact sentence; get confirmation for destructive ones |
| `--density` knob collapses the layout | The artifact lacks consistent spacing custom properties — drop the knob |
| User actually wants an opinion, not edits | Hand off to `design-critique` |
