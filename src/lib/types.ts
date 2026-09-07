export type Permission = 'view' | 'edit';

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface DocumentRow {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShareRow {
  id: string;
  document_id: string;
  user_id: string;
  permission: Permission;
  created_at: string;
}

export interface AttachmentMeta {
  id: string;
  document_id: string;
  file_name: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
}

export interface AttachmentRow extends AttachmentMeta {
  data: Uint8Array;
}
