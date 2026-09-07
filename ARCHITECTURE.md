# Architecture note

## What I prioritized

Given a tight time budget, I optimized for a small number of features working correctly end-to-end over a larger number working partially. Concretely:

- **One deployable unit.** Next.js App Router hosts both the UI and the server logic (via Server Actions instead of hand-rolled REST endpoints + client-side fetch wiring). This cut a meaningful amount of boilerplate — no separate API layer to define, serialize, and call — while still giving a real client/server boundary with validation and access checks on the server side, not just the client.
- **Correct access control over broad access control.** Sharing has exactly two permission levels (view/edit) and one owner per document, but that logic (`canView`/`canEdit` in [`src/lib/access.ts`](./src/lib/access.ts)) is pulled out as pure, dependency-free functions and is the one thing in the app with dedicated automated tests — both as isolated unit tests against fixtures, and as an integration test that exercises the real database (share → check access → revoke → check access again). I'd rather have thin-but-correct sharing than a fuller permission model I didn't have time to verify.
- **No invented persistence complexity.** Documents, shares, and attachments live in four small SQLite tables with plain SQL (no ORM). Given the scope (a handful of tables, no migrations needed yet), an ORM would have added setup and abstraction without paying for itself.
- **Attachments stored as BLOBs in SQLite, not on the filesystem.** Keeping attachment bytes in the same database file as everything else means one thing to back up and one thing to point `DATABASE_PATH` at — no separate uploads directory to keep in sync with the DB, no orphaned files if a document is deleted (the foreign key cascade handles it). The trade-off is a 5MB-per-file cap to keep this reasonable; a real product with large or many files would want object storage instead.

## Notable trade-offs (and why)

- **`node:sqlite` instead of `better-sqlite3`.** I started with `better-sqlite3`, but this environment couldn't compile its native addon (no `make`/build tools, and no prebuilt binary yet for the installed Node version) — a risk that could easily reappear on a fresh deploy host too. Node 22.5+ ships a built-in, synchronous SQLite driver (`node:sqlite`) with a near-identical API and no native compilation step at all, so I switched to it. The trade-off is a slightly newer/less battle-tested API and a Node version floor (22.5+), documented in the README.
- **Mocked auth, not real auth.** Three seeded users, chosen via a plain "pick a user" screen that sets a cookie — no passwords, no sessions beyond that cookie. The brief explicitly allows this, and building real auth would have taken time away from the features actually being assessed (editing, sharing, persistence).
- **Upload limited to `.txt`/`.md`.** I intentionally left out `.docx` (would need a parsing library like `mammoth` and more edge-case handling) to keep the upload path small and reliable in the time available. This is stated in the UI (`accept` filter + inline copy) and in the README, per the brief's explicit allowance for stating file-type limits.
- **Autosave, not a save button as the primary flow.** Content and title save ~700ms after the user stops typing, each field independently, merged into one write. There is deliberately no manual "Save" button as the primary mechanism — the risk of a mismatch between the visible editor state and the saved state felt higher than the benefit of manual control for this scope.
- **Deploy target: Railway over Vercel.** Vercel's serverless functions have an ephemeral filesystem, which is incompatible with a local SQLite file. Rather than adding a second external service (a hosted database) to get file-per-request persistence on Vercel, I targeted a platform that runs the app as a normal persistent process with a real disk, so the same SQLite file that works locally also works in production unchanged. This was a direct trade discussed with the assessment reviewer: pay a small (~$1/month past a 30-day free trial) hosting cost in exchange for less moving infrastructure.

## What I'd do with more time

- Real password/OAuth-based auth instead of the seeded-user picker.
- `.docx` import via `mammoth`.
- Optimistic UI + conflict handling if two people edit the same document concurrently (right now, last write wins with no merge).
- Document version history / revert.
