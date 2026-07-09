import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DayTraceItem } from "../app/types";
import { DayTimeline } from "./DayTimeline";

const items: DayTraceItem[] = [
  {
    id: "task-1",
    kind: "task_completed",
    title: "Fix login state",
    occurredAt: "2026-07-08T09:42:00Z",
  },
];

describe("DayTimeline", () => {
  it("renders trace item time, kind, and title", () => {
    render(<DayTimeline items={items} />);

    expect(screen.getByText("09:42")).toBeInTheDocument();
    expect(screen.getByText("任务完成")).toBeInTheDocument();
    expect(screen.getByText("Fix login state")).toBeInTheDocument();
  });
});
