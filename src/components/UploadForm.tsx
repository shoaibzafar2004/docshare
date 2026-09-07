'use client';

import { useRouter } from 'next/navigation';
import { uploadFileAction } from '@/lib/actions';
import { useFileUploadAction } from '@/hooks/useFileUploadAction';

export function UploadForm() {
  const router = useRouter();
  const { inputRef, error, isPending, handleChange } = useFileUploadAction(
    uploadFileAction,
    (result) => {
      if (result.id) router.push(`/documents/${result.id}`);
    }
  );

  return (
    <div className="flex flex-col items-start gap-1">
      <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50">
        {isPending ? 'Importing…' : 'Upload file'}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={handleChange}
          disabled={isPending}
        />
      </label>
      <span className="text-xs text-gray-500">Supports .txt and .md files only</span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
