import { db, toPlain, toPlainList } from './db';
import type { User } from './types';

export function listUsers(): User[] {
  const rows = db
    .prepare('SELECT id, name, email, color FROM users ORDER BY name')
    .all() as unknown as User[];
  return toPlainList(rows);
}

export function getUser(id: string): User | undefined {
  const row = db.prepare('SELECT id, name, email, color FROM users WHERE id = ?').get(id) as
    User | undefined;
  return row ? toPlain(row) : undefined;
}
