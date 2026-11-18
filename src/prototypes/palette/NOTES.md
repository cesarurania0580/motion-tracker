# App palette prototype — disposable

Question: which light-blue palette should unify Tracker, media Analysis, independent
Design A, and dialogs while retaining the logo and object/status colors?

Run `npm run dev -- --host 0.0.0.0 --port 9001` and open
`/palette-prototype.html?variant=A&view=independent`. Reuse the existing server.
Three palette variants deliberately keep the same layout so color is the only
comparison variable (owner explicitly requested a color bench, not new layouts).
Static illustrative data, no actual tracking/fitting/export, no storage. Only preview
navigation, palette/language/tool selectors and sample dialog operate.

References: the owner's MuffinGroup calm-color-palette and Color Analysis calming
palette articles. Use soft surfaces and readable text; no psychological outcome is
promised. The implemented app is unchanged by palette selection. Prototype is not
part of the production build. User visual review pending; no browser automation.
Verdict: awaiting owner choice. Absorb chosen tokens into a separate reviewed change.

2026-10-26: Owner selected C / Classic blue for light mode. Added dark comparisons
D Midnight blue, E Slate blue, F Deep ocean. Mode selector switches between light
and dark groups; each view and welcome dialog follows its palette. Dark chart preview
uses legible light text and lighter versions of series colors. Exports are illustrative
and would remain white-paper. Actual application themes are not changed. Recommended
pair to evaluate: Classic blue + Midnight blue. Dark selection remains pending.

Hybrid preview requested after app-wide palette implementation: G shows Midnight
blue header with a fully light Classic blue graphing workspace (including inspector
and worksheet); Tracker remains Midnight blue. Existing D compares fully dark
workspace. Added hybrid option to mode selector. Preview-only, app unchanged.
