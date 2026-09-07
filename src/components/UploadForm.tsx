'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFileAction } from '@/lib/actions';

export function UploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleChange() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set('file', file);

    startTransition(async () => {
      const result = await uploadFileAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        router.push(`/documents/${result.id}`);
      }
      if (inputRef.current) inputRef.current.value = '';
    });
  }

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
