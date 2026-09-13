# Autotracking release candidate

## Owner acceptance
The owner reports good browser tracking on free fall, simple harmonic motion,
collisions and other videos. Recorded acceptance applies to the local development
app. Production preview has not yet been accepted.

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

## Remaining release steps
1. Authentication, remote refs and published Netlify baseline verified.
2. Commit the reviewed release candidate on the feature branch.
3. Push that branch and inspect its PR/deploy preview using the production build.
4. Owner checks the preview; merge/publish the approved release and verify status.

No live deployment has been performed by the release-preparation work.
