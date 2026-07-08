import "../styles/tokens.css";
import "../styles/app.css";

export function App() {
  return (
    <main className="app-shell">
      <aside className="app-rail" aria-label="Primary">
        <div className="rail-mark">TM</div>
        <button className="rail-item rail-item-active">Today</button>
        <button className="rail-item">Library</button>
        <button className="rail-item">Dates</button>
        <button className="rail-item">Search</button>
      </aside>
      <section className="workbench">
        <header className="workbench-header">
          <div>
            <p className="eyebrow">Task Memo</p>
            <h1>Today</h1>
          </div>
        </header>
        <div className="empty-state">Ready to capture the next action.</div>
      </section>
      <aside className="inspector" aria-label="Inspector">
        <p className="eyebrow">Inspector</p>
      </aside>
    </main>
  );
}
