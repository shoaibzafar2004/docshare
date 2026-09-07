'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { saveDocumentAction, importContentAction } from '@/lib/actions';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm font-medium disabled:opacity-40 ${
        active ? 'bg-ink text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, disabled }: { editor: TiptapEditor | null; disabled: boolean }) {
  if (!editor) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">
      <ToolbarButton
        label="Bold"
        disabled={disabled}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        disabled={disabled}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        disabled={disabled}
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-gray-200" />
      <ToolbarButton
        label="Heading 1"
        disabled={disabled}
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        disabled={disabled}
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Paragraph"
        disabled={disabled}
        active={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-gray-200" />
      <ToolbarButton
        label="Bulleted list"
        disabled={disabled}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        disabled={disabled}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
    </div>
  );
}

function ImportContentButton({
  documentId,
  editor,
  onImported,
}: {
  documentId: string;
  editor: TiptapEditor | null;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    const file = inputRef.current?.files?.[0];
    if (!file || !editor) return;
    setError(null);

    const formData = new FormData();
    formData.set('file', file);

    startTransition(async () => {
      const result = await importContentAction(documentId, formData);
      if (result.error) {
        setError(result.error);
      } else if (result.content) {
        editor.commands.setContent(result.content);
        onImported();
      }
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div className="mb-3 flex items-center gap-2">
      <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50">
        {isPending ? 'Importing…' : 'Import content'}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={handleChange}
          disabled={isPending}
        />
      </label>
      <span className="text-xs text-gray-500">
        Appends a .txt or .md file's content to this draft
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  editable,
}: {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  editable: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Title and content update independently (e.g. typing in the editor then
  // immediately renaming), so pending changes accumulate here across calls
  // rather than each scheduleSave() replacing the last one's fields.
  const pendingFields = useRef<{ title?: string; content?: string }>({});

  const scheduleSave = useCallback(
    (fields: { title?: string; content?: string }) => {
      pendingFields.current = { ...pendingFields.current, ...fields };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setStatus('saving');
      saveTimer.current = setTimeout(async () => {
        const toSave = pendingFields.current;
        pendingFields.current = {};
        const result = await saveDocumentAction({ id: documentId, ...toSave });
        setStatus(result.error ? 'error' : 'saved');
      }, 700);
    },
    [documentId]
  );

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      scheduleSave({ content: editor.getHTML() });
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    scheduleSave({ title: e.target.value });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <input
          value={title}
          onChange={handleTitleChange}
          disabled={!editable}
          placeholder="Untitled document"
          className="w-full border-none bg-transparent text-2xl font-semibold outline-none disabled:text-gray-500"
        />
        <span className="shrink-0 text-xs text-gray-400">
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && <span className="text-red-500">Could not save</span>}
        </span>
      </div>

      {editable && (
        <ImportContentButton
          documentId={documentId}
          editor={editor}
          onImported={() => setStatus('saved')}
        />
      )}
      {editable && <Toolbar editor={editor} disabled={!editable} />}
      {!editable && (
        <p className="mb-3 text-xs text-gray-500">
          You have view-only access to this document.
        </p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
