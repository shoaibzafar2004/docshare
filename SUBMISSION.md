# Submission — DocShare

## Live product

**URL:** _TODO: paste Railway deployment URL here_

## Walkthrough video

**URL:** _TODO: paste Loom/YouTube link here (see `WALKTHROUGH_VIDEO.txt`)_

## Test accounts

No password needed — this app uses seeded demo users selected on the login screen (see [README.md § Seeded users](./README.md#seeded-users)):

- **Alice** — `alice@example.com`
- **Bob** — `bob@example.com`
- **Carol** — `carol@example.com`

To review the sharing flow: log in as Alice, create a document, click **Share**, grant Bob view or edit access. Open a private/incognito window (or log out via "Switch user"), log in as Bob, and confirm the document appears under "Shared with me" with the right permission. Log in as Carol to confirm she has no access to it (a "not found" page, not an error).

## What's included in this folder

- **Source code** — the full `docshare` repository (see `.git` history for commit-by-commit progression; branch `main` is the reviewed, CI-passing state).
- **`README.md`** — local setup, run, test, lint, and deployment instructions.
- **`ARCHITECTURE.md`** — what was prioritized, key trade-offs and why, and an explicit working/incomplete status split.
- **`AI_WORKFLOW.md`** — which AI tools were used, where they helped, what was changed/rejected, and how output was verified.
- **`SUBMISSION.md`** — this file.
- **`WALKTHROUGH_VIDEO.txt`** — the walkthrough video link.
- Screenshots: not included — local setup is a single `npm install && npm run dev`, with no extra manual steps, so a screenshot/GIF walkthrough of setup didn't add information beyond the README's copy-pasteable commands.

## Status (see `ARCHITECTURE.md § Status` for detail)

**Working end to end:** rich-text document editing with autosave and persistence; file upload to create a new document; importing file content into an open document; file attachments (any type, ≤5MB) with access-checked download; sharing with view/edit permission and correct access enforcement.

**Incomplete / out of scope:** real authentication, `.docx` import, concurrent-edit conflict handling, version history, real-time presence. Full reasoning for each cut is in `ARCHITECTURE.md`.
