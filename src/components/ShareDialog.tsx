'use client';

import { useState, useTransition } from 'react';
import { shareDocumentAction, revokeShareAction } from '@/lib/actions';
import type { ShareWithUser } from '@/lib/documents';
import type { Permission, User } from '@/lib/types';

export function ShareDialog({
  documentId,
  candidateUsers,
  initialShares,
}: {
  documentId: string;
  candidateUsers: User[];
  initialShares: ShareWithUser[];
}) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState(initialShares);
  const [selectedUserId, setSelectedUserId] = useState(candidateUsers[0]?.id ?? '');
  const [permission, setPermission] = useState<Permission>('view');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shareableUsers = candidateUsers.filter(
    (u) => !shares.some((s) => s.user_id === u.id)
  );

  function handleShare() {
    if (!selectedUserId) return;
    setError(null);
    startTransition(async () => {
      const result = await shareDocumentAction({ documentId, userId: selectedUserId, permission });
      if (result.error) {
        setError(result.error);
        return;
      }
      const user = candidateUsers.find((u) => u.id === selectedUserId)!;
      setShares((prev) => [
        ...prev.filter((s) => s.user_id !== selectedUserId),
        {
          id: `${documentId}-${selectedUserId}`,
          document_id: documentId,
          user_id: user.id,
          permission,
          created_at: new Date().toISOString(),
          user_name: user.name,
          user_email: user.email,
          user_color: user.color,
        },
      ]);
    });
  }

  function handleRevoke(userId: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeShareAction(documentId, userId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setShares((prev) => prev.filter((s) => s.user_id !== userId));
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        Share {shares.length > 0 && `(${shares.length})`}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <h3 className="mb-3 text-sm font-semibold">Share this document</h3>

          {shareableUsers.length > 0 ? (
            <div className="mb-4 flex items-center gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                {shareableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as Permission)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <button
                type="button"
                onClick={handleShare}
                disabled={isPending}
                className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          ) : (
            <p className="mb-4 text-xs text-gray-500">Everyone already has access.</p>
          )}

          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

          <ul className="flex flex-col gap-2">
            {shares.map((s) => (
              <li key={s.user_id} className="flex items-center justify-between text-sm">
                <span>
                  {s.user_name}{' '}
                  <span className="text-xs text-gray-400">
                    ({s.permission === 'edit' ? 'can edit' : 'can view'})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRevoke(s.user_id)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
