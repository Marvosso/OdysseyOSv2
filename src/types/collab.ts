export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  avatar?: string;
  isActive: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  sceneId: string;
  content: string;
  position: { line: number; character: number };
  timestamp: Date;
  resolved: boolean;
  replies: Comment[];
}

export interface ChangeRequest {
  id: string;
  userId: string;
  sceneId: string;
  type: 'edit' | 'delete' | 'add' | 'reorder';
  description: string;
  changes: ChangeDetail[];
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

export interface ChangeDetail {
  original: string;
  suggested: string;
  position: { line: number; character: number };
}

export interface Version {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  changes: string[];
}
