# DocShare

A small full-stack document editor: create and edit rich-text documents in the browser, import a `.txt`/`.md` file as a new document, and share a document with another (seeded) user with view or edit access.

## Stack

- **Next.js 14** (App Router, TypeScript) — UI + server logic (Server Actions) in one app
- **`node:sqlite`** (Node's built-in SQLite driver) for persistence — a single file on disk, no external database or account needed to run locally
- **Tiptap** for the rich-text editor
- **Tailwind CSS** for styling
- **Vitest** for automated tests
- **Zod** for request validation

No real authentication: you pick one of three seeded users (Alice, Bob, Carol) on a login screen, which sets a cookie. See [Architecture note](./ARCHITECTURE.md) for why.

## Requirements

- Node.js **22.5+** (this project uses `node:sqlite`, added in Node 22.5; developed and tested on Node 24). Check with `node -v`.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. On first run, the SQLite database is created at `./data/app.db` and seeded with three demo users automatically — nothing else to configure.

To use a different database location, copy `.env.example` to `.env.local` and set `DATABASE_PATH`.

## Running tests

```bash
npm test
```

Covers the access-control logic (`canView`/`canEdit`) with unit tests, and document creation/sharing/revoking against a real (in-memory) SQLite database.

## Production build

```bash
npm run build
npm start
```

## Features

- **Documents**: create, rename, edit, and reopen documents. Formatting: bold, italic, underline, headings (H1/H2), paragraph, bulleted and numbered lists. Changes autosave ~700ms after you stop typing, with a "Saving…/Saved" indicator.
- **File upload (new document)**: on the documents list, "Upload file" imports a **`.txt` or `.md` file only** as a new editable document (other file types are rejected with a clear error, both in the UI's `accept` filter and re-checked server-side). Markdown is converted to formatted HTML; plain text is wrapped into paragraphs.
- **Content import (into an open document)**: inside a document, "Import content" imports a **`.txt` or `.md` file only** and appends its parsed content to the end of the current draft (or fills it in directly if the draft is still empty) — for pulling outside material into a document you're already working on, as opposed to starting a new one. Requires edit access.
- **Attachments**: inside a document, "Attach a file" lets anyone with edit access upload **any file type, up to 5MB**, associated with that document — for reference material (a PDF, an image, a spreadsheet) that shouldn't be converted into editable text. Attachments are listed with size and uploader, downloadable by anyone with at least view access, and removable by anyone with edit access. Downloads are served through a small route handler (`/api/attachments/[id]`) that re-checks access on every request and forces `Content-Disposition: attachment` so an uploaded file is never rendered inline in the browser.
- **Sharing**: the document owner can open "Share" on a document, grant another seeded user **view** or **edit** access, and revoke it later. The documents list clearly separates **My documents** (owned) from **Shared with me**, and shows each shared document's permission level. A user with only view access sees a read-only editor (no toolbar, title locked, no attach/import controls); anyone with no access gets a "not found" page rather than a raw 403, so document existence isn't leaked.
- **Persistence**: documents, shares, and attachments are stored in SQLite and survive a refresh or server restart, as long as the database file itself persists (see deployment note below).

## Deployment

This app needs to run as a normal persistent Node process (`npm run build && npm start`), **not** on a serverless platform like Vercel — its filesystem is ephemeral, so the SQLite file wouldn't survive between requests.

**Recommended: [Railway](https://railway.app)** (free 30-day trial with $5 credit, includes a persistent volume; ~$1/month if you keep the service running past the trial):

1. Push this repo to GitHub.
2. In Railway, "New Project" → "Deploy from GitHub repo".
3. Add a **volume**, mounted at e.g. `/data`.
4. Set the environment variable `DATABASE_PATH=/data/app.db`.
5. Railway auto-detects the build (`npm run build`) and start (`npm start`) commands from `package.json`.

Any other host that runs a persistent Node process with a writable/persistent disk (Render's paid tier, Fly.io, a VPS, etc.) works the same way — just point `DATABASE_PATH` at a path on persistent storage.

## Seeded users

Alice, Bob, and Carol (`alice@example.com`, `bob@example.com`, `carol@example.com`) are created automatically on first run. Pick any of them on the login screen — no password needed.
