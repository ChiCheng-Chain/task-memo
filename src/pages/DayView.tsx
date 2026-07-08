import { useEffect, useState } from "react";
import { dayApi } from "../app/api";
import type { DayTraceItem } from "../app/types";
import { DayTimeline } from "../components/DayTimeline";

interface DayViewProps {
  date: string;
}

export function DayView({ date }: DayViewProps) {
  const [items, setItems] = useState<DayTraceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dayApi
      .trace(date)
      .then(setItems)
      .catch(() => setError("Could not load day trace."));
  }, [date]);

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">{date}</p>
          <h1>Day trace</h1>
        </div>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <DayTimeline items={items} />
    </section>
  );
}
