import type { Task } from "../app/types";
import { TaskEditor } from "../components/TaskEditor";
import { TaskList } from "../components/TaskList";

interface TodayProps {
  date: string;
  tasks: Task[];
  onCreate: (title: string) => void;
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function Today({ date, tasks, onCreate, onComplete, onRestore }: TodayProps) {
  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">{date}</p>
          <h1>今日</h1>
        </div>
      </header>
      <TaskEditor onCreate={onCreate} />
      <TaskList tasks={tasks} onComplete={onComplete} onRestore={onRestore} />
    </section>
  );
}
