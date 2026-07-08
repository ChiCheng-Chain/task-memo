import { useEffect, useState } from "react";
import { Today } from "../pages/Today";
import { Library } from "../pages/Library";
import { DailyDraft } from "../pages/DailyDraft";
import "../styles/tokens.css";
import "../styles/app.css";
import { taskApi, todayKey } from "./api";
import type { Task } from "./types";

export function App() {
  const [activeView, setActiveView] = useState<"today" | "library" | "draft">("today");
  const [date] = useState(todayKey());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setTasks(await taskApi.list(date));
  }

  useEffect(() => {
    refresh().catch(() => setError("Could not load today's tasks."));
  }, [date]);

  async function createTask(title: string) {
    await taskApi.create({ title, note: "", taskDate: date });
    await refresh();
  }

  async function completeTask(id: string) {
    await taskApi.complete(id);
    await refresh();
  }

  async function restoreTask(id: string) {
    await taskApi.restore(id);
    await refresh();
  }

  return (
    <main className="app-shell">
      <aside className="app-rail" aria-label="Primary">
        <div className="rail-mark">TM</div>
        <button className={`rail-item ${activeView === "today" ? "rail-item-active" : ""}`} onClick={() => setActiveView("today")}>
          Today
        </button>
        <button className={`rail-item ${activeView === "library" ? "rail-item-active" : ""}`} onClick={() => setActiveView("library")}>
          Library
        </button>
        <button className={`rail-item ${activeView === "draft" ? "rail-item-active" : ""}`} onClick={() => setActiveView("draft")}>
          Draft
        </button>
        <button className="rail-item">Dates</button>
        <button className="rail-item">Search</button>
      </aside>
      <section className="workbench">
        {activeView === "today" ? (
          <>
            {error ? <p className="error-text">{error}</p> : null}
            <Today date={date} tasks={tasks} onCreate={createTask} onComplete={completeTask} onRestore={restoreTask} />
          </>
        ) : activeView === "library" ? (
          <Library />
        ) : (
          <DailyDraft date={date} />
        )}
      </section>
      <aside className="inspector" aria-label="Inspector">
        <p className="eyebrow">Inspector</p>
      </aside>
    </main>
  );
}
