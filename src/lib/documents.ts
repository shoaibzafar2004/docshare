import { randomUUID } from 'node:crypto';
import { db, toPlain, toPlainList } from './db';
import { canEdit, canView } from './access';
import type { DocumentRow, Permission, ShareRow } from './types';

export function getDocument(id: string): DocumentRow | undefined {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRow | undefined;
  return row ? toPlain(row) : undefined;
}

export function getSharesForDocument(documentId: string): ShareRow[] {
  const rows = db
    .prepare('SELECT * FROM shares WHERE document_id = ?')
    .all(documentId) as unknown as ShareRow[];
  return toPlainList(rows);
}

export interface ShareWithUser extends ShareRow {
  user_name: string;
  user_email: string;
  user_color: string;
}

export function getSharesWithUsers(documentId: string): ShareWithUser[] {
  const rows = db
    .prepare(
      `SELECT s.*, u.name as user_name, u.email as user_email, u.color as user_color
       FROM shares s JOIN users u ON u.id = s.user_id
       WHERE s.document_id = ?
       ORDER BY u.name`
    )
    .all(documentId) as unknown as ShareWithUser[];
  return toPlainList(rows);
}

export function listOwnedDocuments(userId: string): DocumentRow[] {
  const rows = db
    .prepare('SELECT * FROM documents WHERE owner_id = ? ORDER BY updated_at DESC')
    .all(userId) as unknown as DocumentRow[];
  return toPlainList(rows);
}

export function listSharedDocuments(userId: string): (DocumentRow & { permission: Permission })[] {
  const rows = db
    .prepare(
      `SELECT d.*, s.permission as permission
       FROM documents d
       JOIN shares s ON s.document_id = d.id
       WHERE s.user_id = ?
       ORDER BY d.updated_at DESC`
    )
    .all(userId) as unknown as (DocumentRow & { permission: Permission })[];
  return toPlainList(rows);
}

export function createDocument(ownerId: string, title: string, content = ''): DocumentRow {
  const id = randomUUID();
  db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)').run(
    id,
    title,
    content,
    ownerId
  );
  return getDocument(id)!;
}

export function updateDocument(id: string, fields: { title?: string; content?: string }): void {
  const current = getDocument(id);
  if (!current) throw new Error('Document not found');
  const title = fields.title ?? current.title;
  const content = fields.content ?? current.content;
  db.prepare(
    `UPDATE documents SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(title, content, id);
}

export function deleteDocument(id: string): void {
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

/**
 * Fetches a document and checks the user can at least view it, in one call.
 * Returns null for both "doesn't exist" and "exists but no access" so
 * callers can respond identically to either (a 404, not a 403) without
 * leaking whether a document they can't see exists.
 */
export function getViewableDocument(
  userId: string,
  documentId: string
): { doc: DocumentRow; shares: ShareRow[] } | null {
  const doc = getDocument(documentId);
  if (!doc) return null;
  const shares = getSharesForDocument(doc.id);
  if (!canView(userId, doc, shares)) return null;
  return { doc, shares };
}

/**
 * Fetches a document and checks the user can edit it, in one call. Used by
 * every mutating server action (save, import, attach, delete-attachment) so
 * the owner/share lookup and canEdit check live in exactly one place.
 */
export function requireEditAccess(
  userId: string,
  documentId: string,
  action = 'edit'
): { ok: true; doc: DocumentRow } | { ok: false; error: string } {
  const doc = getDocument(documentId);
  if (!doc) return { ok: false, error: 'Document not found' };
  const shares = getSharesForDocument(doc.id);
  if (!canEdit(userId, doc, shares)) {
    return { ok: false, error: `You do not have permission to ${action} this document` };
  }
  return { ok: true, doc };
}
