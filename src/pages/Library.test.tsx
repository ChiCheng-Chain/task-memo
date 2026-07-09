import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { libraryApi } from "../app/api";
import type { DocumentRecord, LibraryNode } from "../app/types";
import { Library } from "./Library";

vi.mock("../app/api", async () => {
  const actual = await vi.importActual<typeof import("../app/api")>("../app/api");
  return {
    ...actual,
    libraryApi: {
      listNodes: vi.fn(),
      createFolder: vi.fn(),
      createDocument: vi.fn(),
      getDocument: vi.fn(),
      saveDocument: vi.fn(),
      renameNode: vi.fn(),
      deleteNode: vi.fn(),
    },
  };
});

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

const documentRecord: DocumentRecord = {
  id: "document-1",
  nodeId: "doc-1",
  title: "useEffect closure",
  content: "Remember stale closures.",
  createdAt: "2026-07-08T01:00:00Z",
  updatedAt: "2026-07-08T01:00:00Z",
};

describe("Library", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a document inside the selected folder", async () => {
    const user = userEvent.setup();
    vi.mocked(libraryApi.listNodes).mockResolvedValue(nodes);
    vi.mocked(libraryApi.createDocument).mockResolvedValue({
      id: "document-2",
      nodeId: "doc-2",
      title: "Hooks",
      content: "",
      createdAt: "2026-07-08T01:00:00Z",
      updatedAt: "2026-07-08T01:00:00Z",
    });
    vi.spyOn(window, "prompt").mockReturnValue("Hooks");

    render(<Library />);

    await user.click(await screen.findByRole("button", { name: /React/i }));
    await user.click(screen.getByRole("button", { name: "新建文件" }));

    await waitFor(() => {
      expect(libraryApi.createDocument).toHaveBeenCalledWith("folder-1", "Hooks");
    });
  });

  it("deletes the selected document after confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(libraryApi.listNodes).mockResolvedValue(nodes);
    vi.mocked(libraryApi.getDocument).mockResolvedValue(documentRecord);
    vi.mocked(libraryApi.deleteNode).mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Library />);

    await user.click(await screen.findByRole("button", { name: /useEffect closure/i }));
    await screen.findByDisplayValue("Remember stale closures.");
    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => {
      expect(libraryApi.deleteNode).toHaveBeenCalledWith("doc-1");
    });
  });

  it("renames the selected document", async () => {
    const user = userEvent.setup();
    vi.mocked(libraryApi.listNodes).mockResolvedValue(nodes);
    vi.mocked(libraryApi.getDocument).mockResolvedValue(documentRecord);
    vi.mocked(libraryApi.renameNode).mockResolvedValue({
      ...nodes[2],
      title: "Hooks closure",
    });
    vi.spyOn(window, "prompt").mockReturnValue("Hooks closure");

    render(<Library />);

    await user.click(await screen.findByRole("button", { name: /useEffect closure/i }));
    await screen.findByDisplayValue("Remember stale closures.");
    await user.click(screen.getByRole("button", { name: "重命名" }));

    await waitFor(() => {
      expect(libraryApi.renameNode).toHaveBeenCalledWith("doc-1", "Hooks closure");
    });
  });
});
