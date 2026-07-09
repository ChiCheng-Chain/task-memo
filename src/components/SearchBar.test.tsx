import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("submits trimmed non-empty queries with selected scopes", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByLabelText("记录箱"));
    await user.click(screen.getByLabelText("日报"));
    await user.type(screen.getByLabelText("搜索内容"), "  SQLite  ");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(onSearch).toHaveBeenCalledWith("SQLite", ["task"]);
  });
});
