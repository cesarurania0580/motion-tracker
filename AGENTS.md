# PhysTracker development

Read `CONTEXT.md`, `specs/README.md`, and the relevant numbered spec before changes.
Use spec-driven development: record requirements and acceptance checks first,
implement the smallest complete increment, then record evidence and remaining gaps.
Update the spec when behavior or scope changes; record architectural decisions in
`docs/adr/`. Do not mark browser checks passed based only on build or unit tests.

The repository is this `physics-app` directory. Sibling `prototypes/` and `backups/`
are local workspace resources, not tracked by this Git repository. Preserve them.
Preserve existing uncommitted work. Never publish, push, merge to production, or
change Netlify settings without the user's release instruction. Local fixes,
branches, tests, and documentation are authorized by the current development task.

Before handoff: run `npm test`, `npm run lint`, and `npm run build`; the user performs browser
testing. Do not open or automate browsers unless the user explicitly asks. Record
browser acceptance as pending when checks are code-only. Keep EN/ES text synchronized.
Protect project-file compatibility and original-media coordinate units.
