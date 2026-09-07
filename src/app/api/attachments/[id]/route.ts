import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAttachment } from '@/lib/attachments';
import { getViewableDocument } from '@/lib/documents';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return new NextResponse('Not authenticated', { status: 401 });

  const attachment = getAttachment(params.id);
  if (!attachment) return new NextResponse('Not found', { status: 404 });

  if (!getViewableDocument(user.id, attachment.document_id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(Buffer.from(attachment.data), {
    status: 200,
    headers: {
      'Content-Type': attachment.mime_type,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.file_name)}"`,
      'Content-Length': String(attachment.size),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
