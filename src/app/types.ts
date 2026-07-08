export type TaskStatus = "active" | "completed";

export interface Task {
  id: string;
  title: string;
  note: string;
  status: TaskStatus;
  taskDate: string;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  note: string;
  taskDate: string;
}

export type LibraryNodeType = "category" | "folder" | "document";

export interface LibraryNode {
  id: string;
  parentId: string | null;
  nodeType: LibraryNodeType;
  category: string | null;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  nodeId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyDraft {
  id: string;
  draftDate: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
