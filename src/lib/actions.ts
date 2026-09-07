'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser, setCurrentUserCookie, clearCurrentUserCookie } from './auth';
import { getUser } from './users';
import {
  createDocument,
  deleteDocument,
  getDocument,
  getSharesWithUsers,
  requireEditAccess,
  updateDocument,
  type ShareWithUser,
} from './documents';
import { shareDocument, revokeShare } from './shares';
import { isOwner } from './access';
import {
  parseUploadedFile,
  fileTextToHtml,
  MAX_UPLOAD_BYTES,
  UnsupportedFileTypeError,
} from './upload';
import {
  createAttachment,
  deleteAttachment,
  getAttachment,
  MAX_ATTACHMENT_BYTES,
  type AttachmentWithUploader,
} from './attachments';

type ActionResult = { error?: string; ok?: true; id?: string };

export async function loginAction(formData: FormData): Promise<void> {
  const userId = String(formData.get('userId') || '');
  const user = getUser(userId);
  // Unknown id means a tampered request -- fail back to login, don't throw.
  if (!user) redirect('/login');
  setCurrentUserCookie(user.id);
  redirect('/documents');
}

export async function logoutAction(): Promise<void> {
  clearCurrentUserCookie();
  redirect('/login');
}

export async function createDocumentAction(): Promise<void> {
  const user = getCurrentUser();
  if (!user) redirect('/login');
  const doc = createDocument(user.id, 'Untitled document', '<p></p>');
  revalidatePath('/documents');
  redirect(`/documents/${doc.id}`);
}

const saveSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title cannot be empty').max(200).optional(),
  content: z.string().max(500_000).optional(),
});

export async function saveDocumentAction(input: {
  id: string;
  title?: string;
  content?: string;
}): Promise<ActionResult> {
  const user = getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const access = requireEditAccess(user.id, parsed.data.id);
  if (!access.ok) return { error: access.error };

  updateDocument(access.doc.id, { title: parsed.data.title, content: parsed.data.content });
  revalidatePath('/documents');
  revalidatePath(`/documents/${access.doc.id}`);
  return { ok: true };
}

export async function deleteDocumentAction(documentId: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) redirect('/login');
  const doc = getDocument(documentId);
  if (!doc || !isOwner(user.id, doc)) redirect('/documents');
  deleteDocument(documentId);
  revalidatePath('/documents');
  redirect('/documents');
}

const shareSchema = z.object({
  documentId: z.string().min(1),
  userId: z.string().min(1),
  permission: z.enum(['view', 'edit']),
});

type ShareDocumentResult = ActionResult & { share?: ShareWithUser };

export async function shareDocumentAction(input: {
  documentId: string;
  userId: string;
  permission: 'view' | 'edit';
}): Promise<ShareDocumentResult> {
  const user = getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = shareSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const doc = getDocument(parsed.data.documentId);
  if (!doc) return { error: 'Document not found' };
  if (!isOwner(user.id, doc)) return { error: 'Only the owner can share this document' };
  if (parsed.data.userId === user.id) return { error: 'You already own this document' };
  if (!getUser(parsed.data.userId)) return { error: 'Unknown user' };

  shareDocument(parsed.data.documentId, parsed.data.userId, parsed.data.permission);
  revalidatePath(`/documents/${doc.id}`);
  // Return the real persisted row so the client can't drift from the DB.
  const share = getSharesWithUsers(doc.id).find((s) => s.user_id === parsed.data.userId);
  return { ok: true, share };
}

export async function revokeShareAction(documentId: string, userId: string): Promise<ActionResult> {
  const user = getCurrentUser();
  if (!user) return { error: 'Not authenticated' };
  const doc = getDocument(documentId);
  if (!doc) return { error: 'Document not found' };
  if (!isOwner(user.id, doc)) return { error: 'Only the owner can manage sharing' };

  revokeShare(documentId, userId);
  revalidatePath(`/documents/${documentId}`);
  return { ok: true };
}

export async function uploadFileAction(formData: FormData): Promise<ActionResult> {
  const user = getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Please choose a file to upload' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: 'File is too large (1MB max)' };
  }

  try {
    const text = await file.text();
    const { title, content } = await parseUploadedFile(file.name, text);
    const doc = createDocument(user.id, title, content);
    revalidatePath('/documents');
    return { ok: true, id: doc.id };
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return { error: err.message };
    }
    return { error: 'Could not import this file' };
  }
}

type ImportContentResult = ActionResult & { content?: string };

export async function importContentAction(
  documentId: string,
  formData: FormData
): Promise<ImportContentResult> {
  const user = getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const access = requireEditAccess(user.id, documentId);
  if (!access.ok) return { error: access.error };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Please choose a file to import' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: 'File is too large (1MB max)' };
  }

  try {
    const text = await file.text();
    const importedHtml = await fileTextToHtml(file.name, text);
    const isBlankDraft =
      access.doc.content.trim() === '' || access.doc.content.trim() === '<p></p>';
    const newContent = isBlankDraft ? importedHtml : `${access.doc.content}\n${importedHtml}`;
    updateDocument(access.doc.id, { content: newContent });
    revalidatePath(`/documents/${access.doc.id}`);
    return { ok: true, content: newContent };
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return { error: err.message };
    }
    return { error: 'Could not import this file' };
  }
}

type UploadAttachmentResult = ActionResult & { attachment?: AttachmentWithUploader };

export async function uploadAttachmentAction(
  documentId: string,
  formData: FormData
): Promise<UploadAttachmentResult> {
  const user = getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const access = requireEditAccess(user.id, documentId, 'add attachments to');
  if (!access.ok) return { error: access.error };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Please choose a file to attach' };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: 'File is too large (5MB max)' };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const attachment = createAttachment({
    documentId: access.doc.id,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    data: buffer,
    uploadedBy: user.id,
  });
  revalidatePath(`/documents/${access.doc.id}`);
  // Return the real created row so the client has a working download/delete link.
  return { ok: true, attachment };
}

export async function deleteAttachmentAction(
  documentId: string,
  attachmentId: string
): Promise<ActionResult> {
  const user = getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const access = requireEditAccess(user.id, documentId, 'remove attachments from');
  if (!access.ok) return { error: access.error };

  const attachment = getAttachment(attachmentId);
  if (!attachment || attachment.document_id !== documentId) {
    return { error: 'Attachment not found' };
  }

  deleteAttachment(attachmentId);
  revalidatePath(`/documents/${access.doc.id}`);
  return { ok: true };
}
