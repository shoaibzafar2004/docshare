import { describe, expect, it } from 'vitest';
import { createDocument } from '@/lib/documents';
import { createAttachment, deleteAttachment, listAttachments } from '@/lib/attachments';

describe('attachments (integration)', () => {
  it('lets a document owner attach and remove a file', () => {
    const doc = createDocument('alice', 'Notes with a file', '<p>x</p>');

    expect(listAttachments(doc.id)).toHaveLength(0);

    const data = new TextEncoder().encode('attachment bytes');
    const attachment = createAttachment({
      documentId: doc.id,
      fileName: 'notes.pdf',
      mimeType: 'application/pdf',
      data,
      uploadedBy: 'alice',
    });

    const listed = listAttachments(doc.id);
    expect(listed).toHaveLength(1);
    expect(listed[0].file_name).toBe('notes.pdf');
    expect(listed[0].size).toBe(data.length);
    expect(listed[0].uploader_name).toBe('Alice');

    deleteAttachment(attachment.id);
    expect(listAttachments(doc.id)).toHaveLength(0);
  });
});
