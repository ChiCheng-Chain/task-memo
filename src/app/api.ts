import { invoke } from "@tauri-apps/api/core";
import type { CreateTaskInput, Task } from "./types";

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
