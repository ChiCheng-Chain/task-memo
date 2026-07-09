import { Check, RotateCcw } from "lucide-react";
import type { Task } from "../app/types";

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function TaskList({ tasks, onComplete, onRestore }: TaskListProps) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <article className={`task-row task-row-${task.status}`} key={task.id}>
          <button
            className="icon-button"
            aria-label={task.status === "active" ? `完成 ${task.title}` : `恢复 ${task.title}`}
            onClick={() => (task.status === "active" ? onComplete(task.id) : onRestore(task.id))}
          >
            {task.status === "active" ? <Check size={16} /> : <RotateCcw size={16} />}
          </button>
          <div>
            <p className="task-title">{task.title}</p>
            {task.note ? <p className="task-note">{task.note}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
