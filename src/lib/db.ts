import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { DatabaseSync } from 'node:sqlite';

// node:sqlite is a Node-only-prefixed built-in (no bare "sqlite" module
// exists), which trips up Vite/webpack's static built-in detection. Loading
// it via createRequire sidesteps bundler resolution entirely and just asks
// the real Node module system for it at runtime.
const sqlite = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
const DatabaseSyncCtor = sqlite.DatabaseSync;

const DATABASE_PATH = process.env.DATABASE_PATH || './data/app.db';

function ensureParentDir(filePath: string) {
  if (filePath === ':memory:') return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createConnection(): DatabaseSync {
  ensureParentDir(DATABASE_PATH);
  const database = new DatabaseSyncCtor(DATABASE_PATH);
  // Next's build process can load this module from multiple workers at
  // once; busy_timeout makes concurrent writers wait/retry instead of
  // failing immediately with SQLITE_BUSY.
  database.exec('PRAGMA busy_timeout = 5000');
  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA foreign_keys = ON');
  return database;
}

// Reuse a single connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __docshareDb?: DatabaseSync };

export const db = globalForDb.__docshareDb ?? createConnection();
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__docshareDb = db;
}

export function initSchema(database: DatabaseSync = db) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(document_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
    CREATE INDEX IF NOT EXISTS idx_shares_document ON shares(document_id);
    CREATE INDEX IF NOT EXISTS idx_shares_user ON shares(user_id);
  `);
}

const SEED_USERS = [
  { id: 'alice', name: 'Alice', email: 'alice@example.com', color: '#e07a5f' },
  { id: 'bob', name: 'Bob', email: 'bob@example.com', color: '#3d5a80' },
  { id: 'carol', name: 'Carol', email: 'carol@example.com', color: '#81b29a' },
];

export function seedUsers(database: DatabaseSync = db) {
  // INSERT OR IGNORE rather than "check count, then insert": Next's build
  // process can load this module from several workers at once, and a
  // check-then-act race would otherwise trip the UNIQUE constraint when two
  // workers both see zero rows and both try to insert the same seed users.
  const insert = database.prepare(
    'INSERT OR IGNORE INTO users (id, name, email, color) VALUES (@id, @name, @email, @color)'
  );
  for (const user of SEED_USERS) insert.run(user);
}

initSchema();
seedUsers();

// node:sqlite returns rows as null-prototype objects, which React Server
// Components refuses to serialize into Client Component props. Spreading
// into a fresh object literal gives back a normal Object.prototype object.
export function toPlain<T extends object>(row: T): T {
  return { ...row };
}

export function toPlainList<T extends object>(rows: T[]): T[] {
  return rows.map(toPlain);
}
