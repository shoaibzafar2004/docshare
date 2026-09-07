import { randomUUID } from 'node:crypto';
import { db, toPlain, toPlainList } from './db';
import { getUser } from './users';
import type { AttachmentMeta, AttachmentRow } from './types';

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB

export interface AttachmentWithUploader extends AttachmentMeta {
  uploader_name: string;
}

export function listAttachments(documentId: string): AttachmentWithUploader[] {
  const rows = db
    .prepare(
      `SELECT a.id, a.document_id, a.file_name, a.mime_type, a.size, a.uploaded_by, a.created_at,
              u.name as uploader_name
       FROM attachments a JOIN users u ON u.id = a.uploaded_by
       WHERE a.document_id = ? ORDER BY a.created_at DESC`
    )
    .all(documentId) as unknown as AttachmentWithUploader[];
  return toPlainList(rows);
}

export function getAttachment(id: string): AttachmentRow | undefined {
  const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as
    AttachmentRow | undefined;
  return row ? toPlain(row) : undefined;
}

export function createAttachment(input: {
  documentId: string;
  fileName: string;
  mimeType: string;
  data: Uint8Array;
  uploadedBy: string;
}): AttachmentWithUploader {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO attachments (id, document_id, file_name, mime_type, size, data, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.documentId,
    input.fileName,
    input.mimeType,
    input.data.length,
    input.data,
    input.uploadedBy
  );
  // Build the result from what we already know plus one cheap primary-key
  // lookup for the DB-generated timestamp, rather than re-running the full
  // listAttachments() JOIN (which scans every attachment on the document)
  // just to find the row we just inserted.
  const created = db.prepare('SELECT created_at FROM attachments WHERE id = ?').get(id) as {
    created_at: string;
  };
  const uploader = getUser(input.uploadedBy)!;
  return {
    id,
    document_id: input.documentId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size: input.data.length,
    uploaded_by: input.uploadedBy,
    created_at: created.created_at,
    uploader_name: uploader.name,
  };
}

export function deleteAttachment(id: string): void {
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
}
