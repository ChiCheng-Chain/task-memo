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
