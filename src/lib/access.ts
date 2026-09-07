import type { DocumentRow, ShareRow } from './types';

/**
 * Pure access-control logic, decoupled from the database so it can be
 * unit tested directly against fixtures.
 */

export function canView(userId: string, doc: DocumentRow, shares: ShareRow[]): boolean {
  if (doc.owner_id === userId) return true;
  return shares.some((s) => s.document_id === doc.id && s.user_id === userId);
}

export function canEdit(userId: string, doc: DocumentRow, shares: ShareRow[]): boolean {
  if (doc.owner_id === userId) return true;
  return shares.some((s) => s.document_id === doc.id && s.user_id === userId && s.permission === 'edit');
}

export function isOwner(userId: string, doc: DocumentRow): boolean {
  return doc.owner_id === userId;
}
