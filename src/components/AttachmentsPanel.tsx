'use client';

import { useState, useTransition } from 'react';
import { uploadAttachmentAction, deleteAttachmentAction } from '@/lib/actions';
import type { AttachmentWithUploader } from '@/lib/attachments';
import { useFileUploadAction } from '@/hooks/useFileUploadAction';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsPanel({
  documentId,
  initialAttachments,
  editable,
}: {
  documentId: string;
  initialAttachments: AttachmentWithUploader[];
  editable: boolean;
}) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isRemoving, startRemoveTransition] = useTransition();

  const {
    inputRef,
    error: uploadError,
    isPending: isUploading,
    handleChange: handleUpload,
  } = useFileUploadAction(
    (formData) => uploadAttachmentAction(documentId, formData),
    (result) => {
      if (result.attachment) setAttachments((prev) => [result.attachment!, ...prev]);
    }
  );

  function handleRemove(id: string) {
    setRemoveError(null);
    startRemoveTransition(async () => {
      const result = await deleteAttachmentAction(documentId, id);
      if (result.error) {
        setRemoveError(result.error);
        return;
      }
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    });
  }

  const error = uploadError ?? removeError;

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </h3>
        {editable && (
          <label className="cursor-pointer text-xs font-medium text-ink underline">
            {isUploading ? 'Uploading…' : 'Attach a file'}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {attachments.length === 0 ? (
        <p className="text-xs text-gray-500">No attachments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <a
                href={`/api/attachments/${a.id}`}
                className="truncate text-ink underline hover:no-underline"
              >
                {a.file_name}
              </a>
              <span className="ml-3 flex shrink-0 items-center gap-3 text-xs text-gray-400">
                <span>{formatSize(a.size)}</span>
                <span>{a.uploader_name}</span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleRemove(a.id)}
                    disabled={isRemoving}
                    className="text-red-500 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-gray-400">Any file type, up to 5MB.</p>
    </div>
  );
}
