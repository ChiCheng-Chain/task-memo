import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { searchApi } from "../app/api";
import { SearchPage } from "./Search";

vi.mock("../app/api", async () => {
  const actual = await vi.importActual<typeof import("../app/api")>("../app/api");
  return {
    ...actual,
    searchApi: {
      all: vi.fn(),
    },
  };
});

describe("SearchPage", () => {
  it("passes selected search scopes to the API", async () => {
    const user = userEvent.setup();
    vi.mocked(searchApi.all).mockResolvedValue([]);

    render(<SearchPage />);

    await user.click(screen.getByLabelText("任务"));
    await user.click(screen.getByLabelText("日报"));
    await user.type(screen.getByLabelText("搜索内容"), "SQLite");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    await waitFor(() => {
      expect(searchApi.all).toHaveBeenCalledWith("SQLite", ["document"]);
    });
  });
});
