import { describe, expect, it } from 'vitest';
import { canEdit, canView, isOwner } from '@/lib/access';
import type { DocumentRow, ShareRow } from '@/lib/types';

const doc: DocumentRow = {
  id: 'doc-1',
  title: 'Q3 plan',
  content: '<p>hello</p>',
  owner_id: 'alice',
  created_at: '2026-01-01 00:00:00',
  updated_at: '2026-01-01 00:00:00',
};

function shareFixture(overrides: Partial<ShareRow>): ShareRow {
  return {
    id: 'share-1',
    document_id: 'doc-1',
    user_id: 'bob',
    permission: 'view',
    created_at: '2026-01-01 00:00:00',
    ...overrides,
  };
}

describe('isOwner', () => {
  it('is true only for the owning user', () => {
    expect(isOwner('alice', doc)).toBe(true);
    expect(isOwner('bob', doc)).toBe(false);
  });
});

describe('canView', () => {
  it('always allows the owner', () => {
    expect(canView('alice', doc, [])).toBe(true);
  });

  it('denies a user with no share record', () => {
    expect(canView('carol', doc, [])).toBe(false);
  });

  it('allows a user with a view share', () => {
    const shares = [shareFixture({ user_id: 'bob', permission: 'view' })];
    expect(canView('bob', doc, shares)).toBe(true);
  });

  it('allows a user with an edit share (edit implies view)', () => {
    const shares = [shareFixture({ user_id: 'bob', permission: 'edit' })];
    expect(canView('bob', doc, shares)).toBe(true);
  });

  it('ignores shares scoped to a different document', () => {
    const shares = [shareFixture({ document_id: 'doc-2', user_id: 'bob', permission: 'view' })];
    expect(canView('bob', doc, shares)).toBe(false);
  });
});

describe('canEdit', () => {
  it('always allows the owner', () => {
    expect(canEdit('alice', doc, [])).toBe(true);
  });

  it('denies a view-only share', () => {
    const shares = [shareFixture({ user_id: 'bob', permission: 'view' })];
    expect(canEdit('bob', doc, shares)).toBe(false);
  });

  it('allows an edit share', () => {
    const shares = [shareFixture({ user_id: 'bob', permission: 'edit' })];
    expect(canEdit('bob', doc, shares)).toBe(true);
  });

  it('denies a user not shared with at all', () => {
    expect(canEdit('carol', doc, [])).toBe(false);
  });
});
