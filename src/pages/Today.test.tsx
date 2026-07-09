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
  {
    id: "2",
    title: "Review PR",
    note: "",
    status: "completed",
    taskDate: "2026-07-08",
    sortOrder: 1,
    completedAt: "2026-07-08T03:00:00Z",
    createdAt: "2026-07-08T02:00:00Z",
    updatedAt: "2026-07-08T03:00:00Z",
  },
];

describe("Today", () => {
  it("renders active tasks and creates a new task", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onRestore = vi.fn();

    render(
      <Today
        date="2026-07-08"
        tasks={tasks}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onComplete={vi.fn()}
        onRestore={onRestore}
      />,
    );

    expect(screen.getByText("Wire SQLite")).toBeInTheDocument();

    await user.type(screen.getByLabelText("新任务"), "构建今日视图");
    await user.click(screen.getByRole("button", { name: "添加任务" }));

    expect(onCreate).toHaveBeenCalledWith("构建今日视图");

    await user.click(screen.getByRole("button", { name: "编辑 Wire SQLite" }));
    const editInput = screen.getByLabelText("编辑任务 Wire SQLite");
    await user.clear(editInput);
    await user.type(editInput, "接好 SQLite");
    await user.click(screen.getByRole("button", { name: "保存 Wire SQLite" }));

    expect(onUpdate).toHaveBeenCalledWith("1", "接好 SQLite");

    await user.click(screen.getByRole("button", { name: "回退完成 Review PR" }));

    expect(onRestore).toHaveBeenCalledWith("2");
  });
});
