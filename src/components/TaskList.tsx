import { Check, Pencil, RotateCcw, Save, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Task } from "../app/types";

interface TaskListProps {
  tasks: Task[];
  onUpdate: (id: string, title: string) => void;
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function TaskList({ tasks, onUpdate, onComplete, onRestore }: TaskListProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setDraftTitle(task.title);
  }

  function cancelEditing() {
    setEditingTaskId(null);
    setDraftTitle("");
  }

  function saveEditing(event: FormEvent, task: Task) {
    event.preventDefault();
    const nextTitle = draftTitle.trim();
    if (!nextTitle) return;
    onUpdate(task.id, nextTitle);
    cancelEditing();
  }

  return (
    <div className="task-list">
      {tasks.map((task) => {
        const isEditing = editingTaskId === task.id;

        return (
          <article className={`task-row task-row-${task.status}`} key={task.id}>
            <button
              className="icon-button"
              aria-label={task.status === "active" ? `完成 ${task.title}` : `回退完成 ${task.title}`}
              onClick={() => (task.status === "active" ? onComplete(task.id) : onRestore(task.id))}
            >
              {task.status === "active" ? <Check size={16} /> : <RotateCcw size={16} />}
            </button>
            {isEditing ? (
              <form className="task-edit-form" onSubmit={(event) => saveEditing(event, task)}>
                <input
                  aria-label={`编辑任务 ${task.title}`}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                />
                <button className="icon-button" type="submit" aria-label={`保存 ${task.title}`}>
                  <Save size={15} />
                </button>
                <button className="icon-button" type="button" aria-label={`取消编辑 ${task.title}`} onClick={cancelEditing}>
                  <X size={15} />
                </button>
              </form>
            ) : (
              <div className="task-content">
                <div>
                  <p className="task-title">{task.title}</p>
                  {task.note ? <p className="task-note">{task.note}</p> : null}
                </div>
                <button className="icon-button" aria-label={`编辑 ${task.title}`} onClick={() => startEditing(task)}>
                  <Pencil size={15} />
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
