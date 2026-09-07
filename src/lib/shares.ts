import { randomUUID } from 'node:crypto';
import { db } from './db';
import type { Permission } from './types';

export function shareDocument(documentId: string, userId: string, permission: Permission): void {
  db.prepare(
    `INSERT INTO shares (id, document_id, user_id, permission)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission`
  ).run(randomUUID(), documentId, userId, permission);
}

export function revokeShare(documentId: string, userId: string): void {
  db.prepare('DELETE FROM shares WHERE document_id = ? AND user_id = ?').run(documentId, userId);
}
