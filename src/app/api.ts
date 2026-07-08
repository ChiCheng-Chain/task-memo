import { invoke } from "@tauri-apps/api/core";
import type { CreateTaskInput, DocumentRecord, LibraryNode, Task } from "./types";

export const taskApi = {
  list(taskDate: string) {
    return invoke<Task[]>("list_tasks", { taskDate });
  },
  create(input: CreateTaskInput) {
    return invoke<Task>("create_task", { input });
  },
  complete(id: string) {
    return invoke<Task>("complete_task", { id });
  },
  restore(id: string) {
    return invoke<Task>("restore_task", { id });
  },
};

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const libraryApi = {
  listNodes() {
    return invoke<LibraryNode[]>("list_library_nodes");
  },
  createFolder(parentId: string, title: string) {
    return invoke<LibraryNode>("create_library_folder", { input: { parentId, title } });
  },
  createDocument(parentId: string, title: string) {
    return invoke<DocumentRecord>("create_library_document", { input: { parentId, title } });
  },
  getDocument(nodeId: string) {
    return invoke<DocumentRecord>("get_document", { nodeId });
  },
  saveDocument(nodeId: string, content: string) {
    return invoke<DocumentRecord>("save_document", { input: { nodeId, content } });
  },
};
