import { randomUUID } from 'node:crypto';
import { db, toPlain, toPlainList } from './db';
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
}): AttachmentMeta {
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
  return listAttachments(input.documentId).find((a) => a.id === id)!;
}

export function deleteAttachment(id: string): void {
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
}
