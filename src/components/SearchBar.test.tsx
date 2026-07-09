import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("submits trimmed non-empty queries", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText("搜索内容"), "  SQLite  ");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(onSearch).toHaveBeenCalledWith("SQLite");
  });
});
