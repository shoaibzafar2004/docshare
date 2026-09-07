'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
      <p className="mb-6 text-sm text-gray-500">
        An unexpected error occurred. You can try again, or head back to your documents.
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          Try again
        </button>
        <Link href="/documents" className="text-sm font-medium text-ink underline">
          Back to your documents
        </Link>
      </div>
    </main>
  );
}
