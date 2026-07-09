import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dailyApi } from "../app/api";
import { DailyDraft } from "./DailyDraft";

vi.mock("../app/api", async () => {
  const actual = await vi.importActual<typeof import("../app/api")>("../app/api");
  return {
    ...actual,
    dailyApi: {
      getDraft: vi.fn(),
      saveDraft: vi.fn(),
    },
  };
});

describe("DailyDraft", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and saves draft content", async () => {
    const user = userEvent.setup();
    vi.mocked(dailyApi.getDraft).mockResolvedValue({
      id: "draft-1",
      draftDate: "2026-07-08",
      content: "Initial draft",
      createdAt: "2026-07-08T01:00:00Z",
      updatedAt: "2026-07-08T01:00:00Z",
    });
    vi.mocked(dailyApi.saveDraft).mockResolvedValue({
      id: "draft-1",
      draftDate: "2026-07-08",
      content: "Initial draft updated",
      createdAt: "2026-07-08T01:00:00Z",
      updatedAt: "2026-07-08T02:00:00Z",
    });

    render(<DailyDraft date="2026-07-08" />);

    const editor = await screen.findByLabelText("Markdown 内容");
    expect(editor).toHaveValue("Initial draft");

    await user.type(editor, " updated");
    await user.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => {
      expect(dailyApi.saveDraft).toHaveBeenCalledWith("2026-07-08", "Initial draft updated");
    });
  });

  it("clears the current daily draft after confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(dailyApi.getDraft).mockResolvedValue({
      id: "draft-1",
      draftDate: "2026-07-08",
      content: "Initial draft",
      createdAt: "2026-07-08T01:00:00Z",
      updatedAt: "2026-07-08T01:00:00Z",
    });
    vi.mocked(dailyApi.saveDraft).mockResolvedValue({
      id: "draft-1",
      draftDate: "2026-07-08",
      content: "",
      createdAt: "2026-07-08T01:00:00Z",
      updatedAt: "2026-07-08T02:00:00Z",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<DailyDraft date="2026-07-08" />);

    const editor = await screen.findByLabelText("Markdown 内容");
    expect(editor).toHaveValue("Initial draft");

    await user.click(screen.getByRole("button", { name: "清空草稿" }));

    await waitFor(() => {
      expect(dailyApi.saveDraft).toHaveBeenCalledWith("2026-07-08", "");
      expect(editor).toHaveValue("");
    });
  });
});
