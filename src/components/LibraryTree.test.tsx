import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LibraryNode } from "../app/types";
import { LibraryTree } from "./LibraryTree";

const nodes: LibraryNode[] = [
  {
    id: "category:experience",
    parentId: null,
    nodeType: "category",
    category: "experience",
    title: "Experience",
    sortOrder: 0,
    createdAt: "2026-07-08T01:00:00Z",
    updatedAt: "2026-07-08T01:00:00Z",
  },
  {
    id: "folder-1",
    parentId: "category:experience",
    nodeType: "folder",
    category: null,
    title: "React",
    sortOrder: 0,
    createdAt: "2026-07-08T01:00:00Z",
    updatedAt: "2026-07-08T01:00:00Z",
  },
  {
    id: "doc-1",
    parentId: "folder-1",
    nodeType: "document",
    category: null,
    title: "useEffect closure",
    sortOrder: 0,
    createdAt: "2026-07-08T01:00:00Z",
    updatedAt: "2026-07-08T01:00:00Z",
  },
];

describe("LibraryTree", () => {
  it("renders nested nodes and selects documents", async () => {
    const user = userEvent.setup();
    const onSelectDocument = vi.fn();

    render(<LibraryTree nodes={nodes} selectedNodeId={null} onSelectDocument={onSelectDocument} />);

    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /useEffect closure/i }));

    expect(onSelectDocument).toHaveBeenCalledWith("doc-1");
  });
});
