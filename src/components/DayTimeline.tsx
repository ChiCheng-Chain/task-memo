import type { DayTraceItem } from "../app/types";

interface DayTimelineProps {
  items: DayTraceItem[];
}

const traceKindLabels: Record<string, string> = {
  task_created: "任务创建",
  task_completed: "任务完成",
  document_updated: "文档更新",
  draft_updated: "日报草稿更新",
};

export function DayTimeline({ items }: DayTimelineProps) {
  return (
    <ol className="day-timeline">
      {items.map((item) => (
        <li key={`${item.kind}:${item.id}:${item.occurredAt}`} className="trace-item">
          <time>{item.occurredAt.slice(11, 16)}</time>
          <span className="trace-kind">{traceKindLabels[item.kind] ?? item.kind}</span>
          <span>{item.title}</span>
        </li>
      ))}
    </ol>
  );
}
