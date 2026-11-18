# PhysTracker release records

## 1.3.0 — 2026-11-17

Owner authorized preparation, PR preview verification, merge to main, and website
deployment. Owner reports the local version working after timeline and axis-order
changes. Release includes Advanced graphing, scientific typography, uncertainty
analysis, palette/welcome updates, and coordinated timeline seeks. See CHANGELOG.

Pre-release checks: 175 automated tests, lint and production build passed on the
versioned release files. Browser access host is unavailable in the
agent session, so no new interactive preview acceptance is claimed. Existing owner
local acceptance and automated component tests are recorded separately from HTTP
and deployment verification. No claim of comprehensive iPad acceptance.

Verified rollback reference from Netlify site metadata on 2026-11-17:
- Production branch: `main`; context: `production`; deploy state: `ready`.
- Commit: `79c9afe6a5de9d0ad5bc33a8a0d762db646c8c5d`.
- Deploy: `6ac84c3a4dbc690008d962bb`.
- Deploy record: https://app.netlify.com/projects/phystracker/deploys/6ac84c3a4dbc690008d962bb
- Domain: https://phystracker.org/

Restore this prior deploy through Netlify if rollback is needed. Preserve the
working tree. Pre-timeline source backup remains under the sibling backups folder;
a final source archive is also created before the release commit.

## 1.2.0 historical release record

## Owner acceptance
The owner reports good browser tracking on free fall, simple harmonic motion,
collisions and other videos. The owner also approved the production preview before publication.

## Included scope
- Earlier 13-commit component/store refactor and specification baseline.
- Native-pixel automatic tracking, mode menu, settings and loss diagnostics.
- Shared Clear Data, sidebar organization and live paused adjustments.
- Sinusoidal least-squares fitting and full calculation precision.
- Calibration binding fix and existing project-reset/autosave fixes.
- Tests, specs and reproducible offline benchmarks.

Scratch notes, source videos, backups, node_modules and dist are excluded.

## Deployment target
Netlify project phystracker; project ID
693b704b-36e3-447b-a640-36ec78a24923; custom domain phystracker.org.
Repository https://github.com/cesarurania0580/motion-tracker.
Owner screenshot confirms base directory `/`, build `npm run build`, publish
`dist`, build status Active and the repository above.

Owner confirms production branch `main`, published commit
`662d86c9e93553ac0d5ce703915a530c5b606e1d`, Netlify deploy
`6a1904c00d3b7b000800c5ab`, published May 28 at 9:15 PM.
- Deploy: https://app.netlify.com/projects/phystracker/deploys/6a1904c00d3b7b000800c5ab
- Immutable baseline: https://6a1904c00d3b7b000800c5ab--phystracker.netlify.app/

A fresh GitHub fetch confirms the same origin/main, 13 commits behind the tested
local pre-release HEAD 98ed63e. GitHub status/deployment APIs do not report the
published Netlify deploy; the owner verified it directly in Netlify.

GitHub authentication succeeds with network access. All 25 tests, lint, production
build and whitespace checks pass. The production bundle now includes the tracking
capture code. Existing Browserslist and bundle-size warnings remain.

## Rollback
Keep the prior Netlify published deploy and its commit recorded before publication.
Existing complete workspace backup:
../backups/before-autotracking-20260912-222022/workspace.tar.gz.
Rollback should republish the previous verified Netlify deploy if necessary;
never reset or overwrite the local working tree to perform a deployment rollback.

## Published release

Pull request [#4](https://github.com/cesarurania0580/motion-tracker/pull/4) merged to
`main` as `c8592387c95320034140e5ad235cab6fc9f49faf` on 2026-09-13.
Production HTML, JavaScript and CSS returned HTTP 200; the live JS and CSS
matched the owner-approved Netlify preview byte-for-byte. The prior deploy
`6a1904c00d3b7b000800c5ab` remains the recorded rollback reference.
The subsequent 1.2.0 documentation/version update does not change tracking logic.
