# briefing — HTML composition spec

Loaded on demand by `/briefing` Step 9. This is the full spec for composing and writing the brief as a self-contained HTML dashboard. The SKILL.md body keeps only the invariant summary + the pre-Write assertion checklist; everything else lives here.

Output is a **single self-contained HTML file** styled with the active DESIGN.md tokens (cached in Step 0). Layout is **email-safe** — briefings get pasted into Gmail and Gmail strips `display: grid`, `position: sticky`, and viewport units, so the template uses a centered max-width container with a horizontal top nav (not a sidebar). The `design-dashboard` skill's sidebar/grid layout is **NOT used here** for this reason — when those patterns reach Gmail, the sidebar's background colors render as a giant empty block above the content (caught 2026-05-19 when a morning brief showed ~1000px of cream void before the first KPI).

## Hard rules for the HTML file
- One file, `<!doctype html>` through `</html>`. All CSS in one inline `<style>` block. NO external links (fonts, CSS, images, JS). NO `<script>`. NO `<img src="http...">`. Inline SVG only for any chart. Briefings must open offline from disk.
- CSS custom properties at the `:root` seed from DESIGN.md tokens: `--bg`, `--fg`, `--muted`, `--border`, `--accent`, `--surface`, `--good`, `--warn`, `--bad`. If DESIGN.md is missing or omits a token, fall back to the **canonical Artifact System values** inlined below; never invent hex values and never re-derive a "close enough" semantic shade per brief (the good/warn greens drifted file-to-file historically; DESIGN.md closed that, so the semantic trio is now fixed). Canonical: `--bg:#f5f4ed; --fg:#141413; --muted:#5e5d59; --border:#e8e6dc; --accent:#c96442; --surface:#faf9f5; --good:#3f6f4f; --warn:#b07a2c; --bad:#b53333;`.
- Semantic HTML: `<header>`, `<main>`, `<section>`, `<nav>`, `<table>`. Every logical region carries `data-od-id="<slug>"` so future parsers can locate sections deterministically.
- Accent used at most twice — top-nav active state + one hero-stat highlight. Don't accent every status pill.
- Status indicators 🟢🟡🔴 stay as Unicode emoji inside `<span class="pill">` (per USER.md formatting prefs, OK in briefings).
- **No em-dashes in body copy** (matches <user.name>'s standing voice preference). Use commas, colons, periods, or parentheses instead. A pre-Write check counts `—` and `--` in text nodes; more than two is a rewrite signal. (A 2026-06-04 brief shipped with 53.)

## Email-safety invariants (T6 — `morning-briefing-*.html` renders correctly in Gmail)
- **NO** `display: grid` on `<body>` or any layout container. Use `flex` with `flex-wrap` for KPI rows; use a max-width centered `<main>` wrapper for the body. Gmail support for grid is unreliable; flex-wrap degrades gracefully to a vertical stack.
- **NO** `position: sticky` or `position: fixed` anywhere. Stripped by Gmail; leaves orphan background colors that render as huge empty blocks above content.
- **NO** viewport units (`vh`, `vw`, `vmin`, `vmax`) anywhere. Use `px` or `%`. Gmail's renderer can't compute viewport-relative sizes inside its iframe and falls back to weird intrinsic heights.
- **NO** sidebar layout. Navigation is a horizontal top nav bar above the topbar, inside `<main>`. Sidebars require grid/flex on body, which violates the rules above.
- KPI row uses `display: flex; flex-wrap: wrap; gap: 14px;` with each `.kpi` set to `flex: 1 1 200px` — gracefully wraps 4-up → 2-up → 1-up at narrow widths and in Gmail.
- Self-check before Write: grep the final HTML for `grid-template`, `position: sticky`, `100vh`, `100vw` — if any match, fix before writing (Pre-Write assertion below enforces this).

## DOM scaffold (mandatory structure — section order fixed)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Morning brief — <YYYY-MM-DD></title>
  <style>
    :root { --bg:#f5f4ed; --fg:#141413; --muted:#5e5d59; --border:#e8e6dc; --accent:#c96442; --surface:#faf9f5; --good:#3f6f4f; --warn:#b07a2c; --bad:#b53333; }
    /* Canonical Artifact System values (seed from DESIGN.md if present; these are the locked fallbacks — semantic trio is fixed, do not drift). Email-safe scaffold (no grid on body, no sticky, no vh):
       body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 ...; }
       main { max-width: 960px; margin: 0 auto; padding: 28px 32px 56px; }
       .topnav { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; margin-bottom: 24px;
                 padding-bottom: 14px; border-bottom: 1px solid var(--border); font-size: 13px; }
       .topnav .brand { font-weight: 600; font-size: 15px; color: var(--fg); margin-right: 8px; }
       .topnav a { color: var(--muted); text-decoration: none; padding: 4px 10px; border-radius: 6px; }
       .topnav a.active { background: rgba(<accent-rgb>,.12); color: var(--accent); font-weight: 500; }
       .kpis { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; }
       .kpi { flex: 1 1 200px; background: var(--surface); border: 1px solid var(--border);
              border-radius: 10px; padding: 16px 18px; }
       Same component classes for panels, pills, tables, projects-grid (use flex-wrap, not grid). */
  </style>
</head>
<body>
  <main>
    <nav class="topnav" data-od-id="topnav">
      <span class="brand"><assistant.emoji> <assistant.name></span>
      <a href="#what-needs-you" class="active">Today's priorities</a>
      <a href="#calendar">Calendar</a>
      <a href="#projects">Projects</a>
      <a href="#slack">Slack</a>          <!-- omit anchor if gate false -->
      <a href="#jira">Jira</a>            <!-- omit anchor if gate false -->
      <a href="#commitments">Commitments</a>
      <a href="#shipped">Recent shipped</a> <!-- omit anchor if gate false -->
      <a href="#notes">Notes</a>          <!-- omit anchor if Step 8 empty -->
      <a href="#tools-used">Tools used</a>
    </nav>
    <header class="topbar" data-od-id="topbar">
      <div>
        <h1>Morning brief · <YYYY-MM-DD></h1>
        <p class="tagline"><LEAD with the single highest-leverage move — the same verdict as Step 7's closing synthesis line, stated up front so a 5-second skim hits it first. Then the day's shape. E.g., "Clear the 3 Lever feedbacks before the 10:30 loop, then the Champions deploy unblock is the highest-leverage thing you can do. Light meeting day otherwise."> The synthesis line at the end of Projects restates this with the full "because Y"; the tagline is the headline version.</p>
      </div>
      <div class="right"><span class="pill"><day-of-week, e.g., Tuesday></span></div>
    </header>

    <section class="kpis" data-od-id="kpis">
      <!-- 3-4 KPI cards. Dynamic, pick from: urgent count, meetings today, unread @-mentions,
           past-due tickets, blocked projects, recent shipped count. Use only KPIs the detection
           map enables; never pad with fake stats (T3). At least 2, at most 4.
           DELTA = ONE fact only (a card is a glance, not a panel). If the delta wants to list
           3+ items (e.g. "Manish 10:30 · Amanda 2pm · Stephen 3:30"), that detail belongs in the
           Calendar / What-needs-you panel, not the card. Keep deltas to a single number or phrase. -->
      <div class="kpi"><div class="label">Urgent today</div><div class="value">3</div><div class="delta"><one fact, e.g. "all flagged required"></div></div>
      <div class="kpi"><div class="label">Meetings</div><div class="value">3</div><div class="delta"><one fact, e.g. "first 10:30"></div></div>
      <!-- ... -->
    </section>

    <section class="panel" id="what-needs-you" data-od-id="what-needs-you">
      <h3>What needs you today</h3>
      <!-- Step's 1+2+3+4 cross-section: top 5-7 items, urgent emails + next 3 cal events + past-due Jira + Slack mentions. Use <ul> with status pills. -->
    </section>

    <section class="panel" id="calendar" data-od-id="calendar">
      <!-- Gated on detection.cli.gws — OMIT this <section> entirely if false. -->
      <h3>Calendar at a glance</h3>
      <table><thead><tr><th>Time</th><th>Event</th><th>Status</th></tr></thead><tbody>...</tbody></table>
    </section>

    <section class="panel" id="projects" data-od-id="projects">
      <h3>Today's work from your projects</h3>
      <div class="projects-grid">
        <!-- One <article class="project"> per project from Step 7. Status emoji as <span class="pill"> in the card header. -->
        <article class="project">
          <header><h4><Project name></h4> <span class="pill <good|warn|bad>">🟢/🟡/🔴</span></header>
          <p class="status"><Status one-liner></p>
          <p class="latest"><strong>Latest move:</strong> ...</p>
          <p class="action"><strong>Today's recommended action:</strong> ...</p>
        </article>
      </div>
      <p class="synthesis"><strong>From what I'm seeing, the highest-leverage work today is: ...</strong></p>
    </section>

    <section class="panel" id="slack" data-od-id="slack">
      <!-- Gated on detection.mcp.slack — OMIT this <section> entirely if false. -->
      <h3>Slack digest</h3>
      <!-- @-mentions / active channels / threads owing reply, structured as <h4> + <ul>. -->
    </section>

    <section class="panel" id="jira" data-od-id="jira">
      <!-- Gated on detection.mcp.atlassian — OMIT entirely if false. -->
      <h3>Jira queue</h3>
      <table>...</table>
    </section>

    <section class="panel" id="commitments" data-od-id="commitments">
      <h3>Open commitments by person</h3>
      <!-- Per T2: status: personal contacts already filtered upstream in Step 5. WikiLinks render as plain <a href="../contacts/<slug>.md"><slug></a>. -->
    </section>

    <section class="panel" id="shipped" data-od-id="shipped">
      <!-- Gated on detection.cli.gh — OMIT entirely if false. -->
      <h3>Recent shipped</h3>
      <ul>...</ul>
    </section>

    <section class="panel" id="notes" data-od-id="notes">
      <!-- Omit if Step 8 returned nothing useful. -->
      <h3>Notes &amp; cross-references</h3>
      <ul>...</ul>
    </section>

    <section class="panel footer" id="tools-used" data-od-id="tools-used">
      <h3>Tools used</h3>
      <p class="muted">Composed from Step 0.5's detection map. Transparency footer per T4 — never fabricated.</p>
      <ul>
        <li><span class="pill good">✅ Composed</span> <comma-separated list></li>
        <li><span class="pill warn">⏳ Not configured</span> <list></li>  <!-- OMIT <li> entirely if all gated tools detected -->
        <li><span class="pill warn">⏭️ Skipped (auth error, you chose to continue)</span> <list></li>  <!-- OMIT <li> entirely if no Step 0.6 "Skip" path taken -->
        <li><span class="pill bad">⚠️ Errored at runtime</span> <list></li>  <!-- OMIT <li> entirely if no runtime errors -->
      </ul>
    </section>

    <p class="signoff">That's the lay of the land. Where do you want to start?</p>
  </main>
</body>
</html>
```

## Voice (per SOUL.md) — applies to the human-readable text rendered inside the HTML
- Topbar tagline: warm + direct, like "Morning <user.name>! Three meetings, two open Jira tickets, and Alex is waiting on you." (no "Per your request..." / "Please be advised...")
- Use phrases like "Here's what matters...", "Worth noting...", "From what I'm seeing..." in the project-synthesis closing line
- Status indicators 🟢🟡🔴 inside `<span class="pill">` — colored by status, not decoration
- Be opinionated in the projects section's closing synthesis line. "Ship X today because Y." Not "you could consider..."

## Section-omission rules (T4 — preserve order of present sections)
- Gated section with detection=false → OMIT the entire `<section>` AND remove its `<a href="#...">` from the top nav. No empty headers, no "⚠️ not configured" body content.
- Gated section with detection=true but runtime error → keep the `<section>` and its `<h3>`, render a single `<p class="warn">⚠️ <Tool> errored — <cause></p>` as the body.
- Mandatory-floor sections (what-needs-you, projects, commitments, tools-used) are ALWAYS in the DOM. Tools-used is the last `<section>` before `<p class="signoff">`.

## Pre-Write assertions (catch regressions — run ALL before Write)
- Path string ends in `.html` (not `.md`) — reject otherwise (T1).
- Contains `<!doctype html>` opening and `</html>` closing.
- Contains the `<section data-od-id="tools-used">` (T4 mandatory footer).
- Does NOT contain `<script>` or `http://` / `https://` references (self-contained rule).
- Does NOT contain any `status: personal` contact slug in commitments section (T2 sanity grep).
- Email-safety (T6): grep for `grid-template`, `position: sticky`, `position: fixed`, `100vh`, `100vw`, `<aside` — ZERO matches. If any match, rewrite the offending block before Write.
- Slack sweep (T5): at least one Slack search whose `channel_types` was omitted or contained `mpim`.
- Em-dash check: count `—` / `--` in body text nodes; >2 is a rewrite signal.

**T1 reminder: write to `<workspace.root>/<workspace.resources>/briefings/morning-briefing-${DATE}.html`** (or `-${DATE}-${TIME}.html` if collision). Confirm the path before Write. The Write tool will fail if the parent directory doesn't exist — `<workspace.root>/<workspace.resources>/briefings/` should already exist; if not, `mkdir -p` first.
