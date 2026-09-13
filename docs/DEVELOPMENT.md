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

Test runner validated on the installed Node 26.8.1. The `--test-isolation=none`
option avoids child-process restrictions in this local environment.
