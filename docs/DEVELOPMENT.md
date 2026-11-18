# Local development and recovery

Run in `physics-app`:

```
npm ci
npm run dev -- --host 127.0.0.1
npm test
npm run lint
npm run build
```

Open the localhost URL printed by Vite. Automatic tracking is now enabled in both
development and production builds for release preparation. `npm run preview`
serves the production build locally; neither command deploys. Netlify settings
are verified separately before release.

## Baseline backup

`../backups/before-autotracking-20260912-222022/workspace.tar.gz` contains the
app (including Git history, uncommitted changes and specs), standalone prototype,
and test video. `node_modules` and `dist` were excluded because they are generated.
The sibling manifest records the starting commit, dirty status and archive SHA256.
The working branch is `local/autotracking-integration`.

Restore into a NEW empty directory, not on top of current work:

```
mkdir -p ../recovery-before-autotracking
tar -xzf ../backups/before-autotracking-20260912-222022/workspace.tar.gz -C ../recovery-before-autotracking
```

Then run `npm ci` and `npm run dev -- --host 127.0.0.1` from its `physics-app`.
Stop the current dev server first or use a different port. Keep the current work
until the recovered copy is verified. The archive preserves uncommitted files,
which switching branches alone would not restore. Browser localStorage is not in
this backup: export valuable projects as JSON before experimental testing.

## Release gates

Owner acceptance of real-video and manual-regression checks; no unchecked critical
AT requirements; deliberate decision to expose the feature in production; verify
Netlify branch/commit and test its preview; then obtain the owner's release
instruction. Local readiness is not release approval.

Test-runner compatibility requirement: `npm test` must execute all individual
tests on the installed Node 22 and Node 26 runtimes and return a nonzero status
for failures. Keep in-process execution to avoid child-process restrictions in
this local environment. Acceptance: 167 individual tests pass, plus lint and build.

Use `--experimental-test-isolation=none`, supported by both runtimes; Node 22
does not recognize the newer `--test-isolation=none` spelling.

Verified 2026-11-17: 167 individual tests pass on Node 22.23.3 and 26.13.0;
`npm run lint`, `npm run build`, and `git diff --check` pass. Existing build
warnings remain. Browser acceptance is still pending; no release action taken.
