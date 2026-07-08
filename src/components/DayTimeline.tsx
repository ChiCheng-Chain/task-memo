import type { DayTraceItem } from "../app/types";

interface DayTimelineProps {
  items: DayTraceItem[];
}

export function DayTimeline({ items }: DayTimelineProps) {
  return (
    <ol className="day-timeline">
      {items.map((item) => (
        <li key={`${item.kind}:${item.id}:${item.occurredAt}`} className="trace-item">
          <time>{item.occurredAt.slice(11, 16)}</time>
          <span className="trace-kind">{item.kind.replace(/_/g, " ")}</span>
          <span>{item.title}</span>
        </li>
      ))}
    </ol>
  );
}
