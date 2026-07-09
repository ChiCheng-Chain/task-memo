import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "../app/types";
import { Today } from "./Today";

const tasks: Task[] = [
  {
    id: "1",
    title: "Wire SQLite",
    note: "",
    status: "active",
    taskDate: "2026-07-08",
    sortOrder: 0,
    completedAt: null,
    createdAt: "2026-07-08T01:00:00Z",
    updatedAt: "2026-07-08T01:00:00Z",
  },
];

describe("Today", () => {
  it("renders active tasks and creates a new task", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(
      <Today
        date="2026-07-08"
        tasks={tasks}
        onCreate={onCreate}
        onComplete={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(screen.getByText("Wire SQLite")).toBeInTheDocument();

    await user.type(screen.getByLabelText("新任务"), "构建今日视图");
    await user.click(screen.getByRole("button", { name: "添加任务" }));

    expect(onCreate).toHaveBeenCalledWith("构建今日视图");
  });
});
