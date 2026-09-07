import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-2 text-xl font-semibold">Not found</h1>
      <p className="mb-6 text-sm text-gray-500">
        This document doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/documents" className="text-sm font-medium text-ink underline">
        Back to your documents
      </Link>
    </main>
  );
}
