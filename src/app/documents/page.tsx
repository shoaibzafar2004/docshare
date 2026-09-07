import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listOwnedDocuments, listSharedDocuments } from '@/lib/documents';
import { logoutAction, createDocumentAction } from '@/lib/actions';
import { UploadForm } from '@/components/UploadForm';

function formatDate(iso: string): string {
  return new Date(iso + 'Z').toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function DocumentsPage() {
  const user = getCurrentUser();
  if (!user) redirect('/login');

  const owned = listOwnedDocuments(user!.id);
  const shared = listSharedDocuments(user!.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: user!.color }}
          >
            {user!.name[0]}
          </span>
          <div>
            <div className="font-medium">{user!.name}</div>
            <div className="text-xs text-gray-500">{user!.email}</div>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-800">
            Switch user
          </button>
        </form>
      </header>

      <div className="mb-10 flex flex-wrap items-start gap-4">
        <form action={createDocumentAction}>
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            New document
          </button>
        </form>
        <UploadForm />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          My documents
        </h2>
        {owned.length === 0 ? (
          <p className="text-sm text-gray-500">No documents yet — create one above.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {owned.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-gray-300"
                >
                  <span className="font-medium">{doc.title}</span>
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      Owner
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(doc.updated_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Shared with me
        </h2>
        {shared.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing has been shared with you yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shared.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-gray-300"
                >
                  <span className="font-medium">{doc.title}</span>
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {doc.permission === 'edit' ? 'Can edit' : 'Can view'}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(doc.updated_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
