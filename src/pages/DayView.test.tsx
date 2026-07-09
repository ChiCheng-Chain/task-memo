import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dayApi } from "../app/api";
import { DayView } from "./DayView";

vi.mock("../app/api", async () => {
  const actual = await vi.importActual<typeof import("../app/api")>("../app/api");
  return {
    ...actual,
    dayApi: {
      trace: vi.fn(),
    },
  };
});

describe("DayView", () => {
  it("loads trace for the selected date", async () => {
    const user = userEvent.setup();
    vi.mocked(dayApi.trace).mockResolvedValue([]);

    render(<DayView date="2026-07-09" />);

    await waitFor(() => {
      expect(dayApi.trace).toHaveBeenCalledWith("2026-07-09");
    });

    await user.clear(screen.getByLabelText("选择日期"));
    await user.type(screen.getByLabelText("选择日期"), "2026-07-08");

    await waitFor(() => {
      expect(dayApi.trace).toHaveBeenLastCalledWith("2026-07-08");
    });
  });
});
