import { describe, expect, it } from 'vitest';
import {
  createDocument,
  getSharesForDocument,
  listOwnedDocuments,
  listSharedDocuments,
} from '@/lib/documents';
import { shareDocument, revokeShare } from '@/lib/shares';
import { canEdit, canView } from '@/lib/access';

// Runs against a real in-memory SQLite database (DATABASE_PATH=':memory:',
// set in vitest.config.ts) rather than mocks, so it exercises the actual
// schema and queries used in production.

describe('document sharing (integration)', () => {
  it('lets an owner grant and revoke access to another user', () => {
    const doc = createDocument('alice', 'Roadmap', '<p>draft</p>');

    expect(listOwnedDocuments('alice').map((d) => d.id)).toContain(doc.id);
    expect(listSharedDocuments('bob').map((d) => d.id)).not.toContain(doc.id);

    shareDocument(doc.id, 'bob', 'view');

    const sharedWithBob = listSharedDocuments('bob');
    expect(sharedWithBob.map((d) => d.id)).toContain(doc.id);
    expect(sharedWithBob.find((d) => d.id === doc.id)?.permission).toBe('view');

    const shares = getSharesForDocument(doc.id);
    expect(canView('bob', doc, shares)).toBe(true);
    expect(canEdit('bob', doc, shares)).toBe(false);
    expect(canView('carol', doc, shares)).toBe(false);

    revokeShare(doc.id, 'bob');
    expect(listSharedDocuments('bob').map((d) => d.id)).not.toContain(doc.id);
  });

  it('upgrades permission when shared again with a different level', () => {
    const doc = createDocument('alice', 'Notes', '<p>x</p>');
    shareDocument(doc.id, 'carol', 'view');
    shareDocument(doc.id, 'carol', 'edit');

    const shares = getSharesForDocument(doc.id);
    expect(shares.filter((s) => s.user_id === 'carol')).toHaveLength(1);
    expect(canEdit('carol', doc, shares)).toBe(true);
  });
});
