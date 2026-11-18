# Unified Classic blue / Midnight blue themes

Owner authorized app-wide palette change after choosing Classic blue light and
Midnight blue dark. Use shared semantic tokens for surfaces, text, controls, borders,
focus, graphing and dialogs. Keep navy header in both modes and original logo.
Preserve A/B/COM identities, RGB spectrum semantics, error/warning/success semantics.
Independent worksheet follows app theme; standalone graphing provides its own toggle.
Dark graph previews use theme colors without mutating white-paper export figures or
saved graph settings. No layout, numerical, tracking or project-format changes.

Acceptance: EN/ES theme controls; main/standalone and dialogs share palette; readable
inputs and selected buttons; theme changes preserve data/settings. Automated preview
clone/export invariance and contrast checks, existing full suite, lint/main+trial
builds. Owner checks PC/iPad visually; no automated browser or deployment.

## Implementation evidence

Shared CSS tokens and scoped utility compatibility rules cover app surfaces, header,
controls and dialogs. Portal tooltips carry theme scope. Graphing UI uses those same
tokens; embedded worksheet receives theme without remounting, standalone has EN/ES
Light/Dark toggle. Default new independent series is Classic blue; saved custom colors
remain supported. Preview-only cloned Plotly styling adapts axes, text and trace
luminance in dark mode; publication figures remain white and unmodified. Original
object hues, spectrum RGB channels and semantic status accents are retained.

121 tests pass, including preview/export invariance and main text/action contrast
pairs. Lint and main/trial builds pass; existing size warnings remain. No browser
automation performed. Owner should check both themes in Tracker, media analysis,
independent worksheet and standalone, welcome/FPS/help dialogs, input/select focus,
exports and PC/iPad layouts. No commit/push/deployment.

## Approved hybrid revision

Owner approved preview G: keep existing app/header theme, but use a consistently
light Classic blue workspace for media analysis, independent worksheet and standalone
graphing. Graph, table, inspector and source bar are light together, including a
soft light results strip. Do not change global tracker theme when entering graphing.
Remove standalone dark toggle to keep graphing consistent. Preserve drafts, exports,
calculations and navigation. IB programme audit awaits the user's document.

Hybrid validation: 122 tests pass; added explicit graphing-light/global-dark isolation
check. Lint, main/trial builds and whitespace checks pass. User visual testing pending;
no deployment. IB source document has not yet been received.

Regression requirement: base and hover tokens must differ for primary and secondary
buttons in light/dark/header themes. Scope hover to enabled actions, preserve focus,
active/selected and warning/destructive colors. Add gentle shared feedback for
buttons without utility hover classes (including graph tools); honor reduced motion.

Hover repair evidence: palette rules assigned identical normal/hover colors to
Play and secondary frame-step controls. A failing CSS mapping regression confirmed
this. Added distinct light/dark/header hover tokens, gentle 160 ms feedback shared
by buttons (including graph controls), enabled-state guards and reduced-motion
transition opt-out. Pressed frame buttons retain their accent; existing toolbar
breathing, focus and semantic colors remain. Expanded contrast tests to hover
colors. Code review covered utility buttons and graph-specific rules; no browser
animation check is claimed. Full 135 tests/lint/main and trial builds pass.
