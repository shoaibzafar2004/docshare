'use client';

import { useRef, useState, useTransition } from 'react';

interface ActionResult {
  error?: string;
}

/**
 * Shared plumbing for "pick a file, POST it to a server action via
 * FormData" — the pattern behind file upload, attachments, and content
 * import. Handles the file input ref, building the FormData, running the
 * action inside a transition, surfacing its error, and resetting the input
 * afterward so the same file can be re-selected.
 */
export function useFileUploadAction<TResult extends ActionResult>(
  action: (formData: FormData) => Promise<TResult>,
  onSuccess?: (result: TResult) => void
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set('file', file);

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess?.(result);
      }
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return { inputRef, error, isPending, handleChange };
}
