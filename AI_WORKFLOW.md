# AI Workflow Note

## Which AI tools I used

**Claude Code** (Anthropic's agentic CLI, running Claude Sonnet 5) was the only AI tool used, for the entire build: architecture planning, writing every line of application code, running the terminal (installs, builds, git), and driving a real headless Chrome browser (via Puppeteer) to exercise the app end to end. No other AI coding tool (Copilot, Cursor, etc.) was involved.

## Where AI materially sped up the work

- **Zero-to-scaffolded-app in one pass.** The initial Next.js app (schema, server actions, Tiptap editor, auth cookie flow, sharing model) went from a blank directory to a working build in one continuous session, rather than assembling it file-by-file by hand.
- **Fast root-causing of environment problems.** `better-sqlite3` failed to install (no native build tools in this environment). Claude diagnosed the `node-gyp`/`make` failure, recognized Node's built-in `node:sqlite` as a viable zero-compile replacement, and rewrote the persistence layer around it within a few minutes — including a follow-up fix when `node:sqlite`'s null-prototype row objects broke React Server Component serialization, and another when Next's parallel build workers raced on first-run user seeding.
- **Real, not assumed, verification.** For every feature and every bug fix, Claude wrote a short throwaway Puppeteer script and actually drove the running app in headless Chrome — logging in, typing into the rich-text editor, reloading to check persistence, sharing with two different users, downloading an attachment and diffing the bytes — rather than reasoning about correctness from the code alone. This is what caught real bugs (see below).
- **Structural code review on request.** When asked to review for structural improvements, Claude found and fixed six real issues (duplicated authorization-check logic across four server actions, a wasteful full-table re-query on every attachment upload, a client component fabricating data instead of using the server's real response, a weak type) with a regression suite rerun after each fix to confirm behavior didn't change.

## What AI-generated output I changed or rejected

- **`better-sqlite3` → `node:sqlite`.** The first persistence-layer implementation didn't survive contact with this environment (no native compiler). Rather than patching around it, the whole approach was swapped for Node's built-in driver.
- **Deployment target.** The first plan assumed Vercel; once I flagged that reviewers shouldn't need to pay and that Vercel's serverless filesystem breaks a local SQLite file, Claude proposed and I picked Railway (persistent process + volume) instead — a real architectural pivot, not a config tweak.
- **A shipped bug I caught by using the app.** After an early version of the sharing dialog was built and marked "done," I reported that sharing with a second person silently overwrote the first person's permission instead of adding them. Claude found the actual root cause (a stale client-side selection that desynced from the dropdown once its user was shared) and fixed it — this is called out explicitly because it's a case where the AI's own output was wrong until it was pushed to verify against real usage, not just code review.
- **Scope cuts I made, not the AI.** `.docx` import, real authentication, and conflict resolution for concurrent edits were all things Claude could have built; I chose to cut them to keep the assessed areas (editing, sharing, persistence, upload) solid rather than spreading thin, which the AI then reflected in the architecture note and README rather than silently building anyway.

## How I verified correctness, UX quality, and implementation reliability

- **Automated tests** (Vitest, 13 tests) run against a real in-memory SQLite database — not mocks — covering access-control logic and document/sharing/attachment persistence.
- **Real browser regression scripts** (Puppeteer + headless Chrome), rerun after every meaningful change: full user journey (login → create → format → rename → reload-and-verify-persisted → share → second user sees correct permission → third user denied → upload), plus a dedicated pass for attachments/import and for the sharing-dialog bug fix. These assert on actual rendered DOM and network responses (e.g. diffing downloaded attachment bytes against the uploaded file), not on the code's intent.
- **Static checks before every push:** TypeScript strict-mode typecheck, ESLint, Prettier, and a production build (`next build`), enforced locally and via a GitHub Actions CI gate on every PR into `main`.
- **Manual product judgment stayed with me:** what to build, what to cut, when "it passed the tests" wasn't good enough (the sharing dialog close/second-user bugs were both reported from actually using the product, not found by the test suite), and reviewing every AI-proposed architectural pivot (SQLite driver, deploy target) before accepting it.
