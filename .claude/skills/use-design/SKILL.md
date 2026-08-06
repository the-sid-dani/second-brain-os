---
name: use-design
description: Swap the active design system at workspace root. Copies a brand token file from <workspace.root>/<workspace.resources>/design-systems/<brand>/DESIGN.md to ./DESIGN.md so all design-* skills pick up the new palette, type system, and layout rules. Use for "/use-design <brand>", "switch the design system to X", "use the Stripe look", "what brands are available?". Lists available brands when invoked with no argument or an unknown brand.
---

# use-design — swap the active design system

The design-* skills read `./DESIGN.md` at the workspace root for their tokens (palette, typography, layout rules). This skill swaps that file for a different brand from the design-system catalog.

Resolve `<workspace.root>` and `<workspace.resources>` from the Configuration section in root CLAUDE.md before using any path below.

## Steps

1. **Resolve the brand argument.** The invocation is `/use-design <brand>` (e.g. `/use-design stripe`). If no brand is given, or the brand doesn't match a folder, list what's available and stop:

   ```bash
   ls <workspace.root>/<workspace.resources>/design-systems/
   ```

   Match case-insensitively and accept close variants (`linear` → `linear-app`). If the match is ambiguous, show the candidates and ask.

2. **Verify the source exists** at `<workspace.root>/<workspace.resources>/design-systems/<brand>/DESIGN.md`. If the folder exists but has no `DESIGN.md`, say so — don't invent tokens.

3. **Preserve the current root `DESIGN.md`** if it has been customized: before overwriting, check whether root `DESIGN.md` differs from every catalog brand. If it matches a catalog brand, it's safe to overwrite (the catalog still has it). If it matches nothing, it's custom — copy it to `<workspace.root>/<workspace.resources>/design-systems/custom-<YYYY-MM-DD>/DESIGN.md` first and tell the user.

4. **Copy the brand file** to the workspace root:

   ```bash
   cp <workspace.root>/<workspace.resources>/design-systems/<brand>/DESIGN.md ./DESIGN.md
   ```

5. **Confirm** in one line: which brand is now active, and remind that all design-* skills pick it up on their next invocation.

## Boundaries

- Never edit the catalog files under `design-systems/` — they're the library; only root `DESIGN.md` changes.
- This skill swaps tokens only. It does not restyle existing artifacts — re-run the relevant design-* skill to regenerate them under the new brand.
