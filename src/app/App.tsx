import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import { Today } from "../pages/Today";
import { Library } from "../pages/Library";
import { DailyDraft } from "../pages/DailyDraft";
import { DayView } from "../pages/DayView";
import { SearchPage } from "../pages/Search";
import "../styles/tokens.css";
import "../styles/app.css";
import { taskApi, todayKey } from "./api";
import type { Task } from "./types";

export function App() {
  const [activeView, setActiveView] = useState<"today" | "library" | "draft" | "day" | "search">("today");
  const [date] = useState(todayKey());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setTasks(await taskApi.list(date));
  }

  useEffect(() => {
    refresh().catch(() => setError("无法加载今天的任务。"));
  }, [date]);

  async function createTask(title: string) {
    await taskApi.create({ title, note: "", taskDate: date });
    await refresh();
  }

  async function completeTask(id: string) {
    await taskApi.complete(id);
    await refresh();
  }

  async function updateTask(id: string, title: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    await taskApi.update({ id, title, note: task.note, taskDate: task.taskDate });
    await refresh();
  }

  async function restoreTask(id: string) {
    await taskApi.restore(id);
    await refresh();
  }

  return (
    <main className="app-shell">
      <aside className="app-rail" aria-label="主导航">
        <div className="rail-mark" aria-hidden="true">
          <NotebookPen size={22} strokeWidth={1.8} />
        </div>
        <button className={`rail-item ${activeView === "today" ? "rail-item-active" : ""}`} onClick={() => setActiveView("today")}>
          今日
        </button>
        <button className={`rail-item ${activeView === "library" ? "rail-item-active" : ""}`} onClick={() => setActiveView("library")}>
          记录箱
        </button>
        <button className={`rail-item ${activeView === "draft" ? "rail-item-active" : ""}`} onClick={() => setActiveView("draft")}>
          日报
        </button>
        <button className={`rail-item ${activeView === "day" ? "rail-item-active" : ""}`} onClick={() => setActiveView("day")}>
          日期
        </button>
        <button className={`rail-item ${activeView === "search" ? "rail-item-active" : ""}`} onClick={() => setActiveView("search")}>
          搜索
        </button>
      </aside>
      <section className="workbench">
        {activeView === "today" ? (
          <>
            {error ? <p className="error-text">{error}</p> : null}
            <Today date={date} tasks={tasks} onCreate={createTask} onUpdate={updateTask} onComplete={completeTask} onRestore={restoreTask} />
          </>
        ) : activeView === "library" ? (
          <Library />
        ) : activeView === "draft" ? (
          <DailyDraft date={date} />
        ) : activeView === "day" ? (
          <DayView date={date} />
        ) : (
          <SearchPage />
        )}
      </section>
      <aside className="inspector" aria-label="侧栏">
        <p className="eyebrow">侧栏</p>
      </aside>
    </main>
  );
}
