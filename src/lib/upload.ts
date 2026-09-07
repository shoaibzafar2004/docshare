import { marked } from 'marked';

const SUPPORTED_EXTENSIONS = ['.txt', '.md'] as const;
export const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB

export class UnsupportedFileTypeError extends Error {}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function textToHtml(text: string): string {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  if (paragraphs.length === 0) return '<p></p>';
  return paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('\n');
}

function fileNameToExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx).toLowerCase();
}

function assertSupportedExtension(fileName: string): string {
  const ext = fileNameToExtension(fileName);
  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    throw new UnsupportedFileTypeError(
      `Unsupported file type "${ext || 'unknown'}". Only .txt and .md files can be imported.`
    );
  }
  return ext;
}

export async function fileTextToHtml(fileName: string, text: string): Promise<string> {
  const ext = assertSupportedExtension(fileName);
  return ext === '.md' ? await marked.parse(text) : textToHtml(text);
}

export async function parseUploadedFile(
  fileName: string,
  text: string
): Promise<{ title: string; content: string }> {
  const content = await fileTextToHtml(fileName, text);
  const title = fileName.replace(/\.(txt|md)$/i, '') || 'Untitled';
  return { title, content };
}
