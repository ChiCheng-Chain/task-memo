import { useEffect, useState } from "react";
import { dayApi } from "../app/api";
import type { DayTraceItem } from "../app/types";
import { DayTimeline } from "../components/DayTimeline";

interface DayViewProps {
  date: string;
}

export function DayView({ date }: DayViewProps) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [items, setItems] = useState<DayTraceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    dayApi
      .trace(selectedDate)
      .then(setItems)
      .catch(() => setError("无法加载当天记录。"));
  }, [selectedDate]);

  function shiftDate(days: number) {
    const next = new Date(`${selectedDate}T00:00:00`);
    next.setDate(next.getDate() + days);
    setSelectedDate(next.toISOString().slice(0, 10));
  }

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">{selectedDate}</p>
          <h1>当天记录</h1>
        </div>
        <div className="date-toolbar">
          <button type="button" onClick={() => shiftDate(-1)}>前一天</button>
          <label>
            选择日期
            <input aria-label="选择日期" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <button type="button" onClick={() => setSelectedDate(date)}>今天</button>
          <button type="button" onClick={() => shiftDate(1)}>后一天</button>
        </div>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <DayTimeline items={items} />
    </section>
  );
}
