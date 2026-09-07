import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getViewableDocument, getSharesWithUsers } from '@/lib/documents';
import { listUsers } from '@/lib/users';
import { listAttachments } from '@/lib/attachments';
import { canEdit, isOwner } from '@/lib/access';
import { deleteDocumentAction } from '@/lib/actions';
import { DocumentEditor } from '@/components/Editor';
import { ShareDialog } from '@/components/ShareDialog';
import { AttachmentsPanel } from '@/components/AttachmentsPanel';

export default function DocumentPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) redirect('/login');

  const result = getViewableDocument(user.id, params.id);
  if (!result) notFound();
  const { doc, shares } = result;

  const editable = canEdit(user.id, doc, shares);
  const owner = isOwner(user.id, doc);

  const sharesWithUsers = owner ? getSharesWithUsers(doc.id) : [];
  const candidateUsers = owner ? listUsers().filter((u) => u.id !== user.id) : [];
  const attachments = listAttachments(doc.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/documents" className="text-sm text-gray-500 hover:text-gray-800">
          ← All documents
        </Link>
        <div className="flex items-center gap-2">
          {owner && (
            <ShareDialog
              documentId={doc.id}
              candidateUsers={candidateUsers}
              initialShares={sharesWithUsers}
            />
          )}
          {owner && (
            <form action={deleteDocumentAction.bind(null, doc.id)}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
              >
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      <DocumentEditor
        documentId={doc.id}
        initialTitle={doc.title}
        initialContent={doc.content}
        editable={editable}
      />

      <AttachmentsPanel documentId={doc.id} initialAttachments={attachments} editable={editable} />
    </main>
  );
}
