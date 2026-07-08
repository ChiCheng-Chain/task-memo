import { FileText, Folder, Library as LibraryIcon } from "lucide-react";
import type { LibraryNode } from "../app/types";

interface LibraryTreeProps {
  nodes: LibraryNode[];
  selectedNodeId: string | null;
  onSelectDocument: (nodeId: string) => void;
}

export function LibraryTree({ nodes, selectedNodeId, onSelectDocument }: LibraryTreeProps) {
  const byParent = new Map<string | null, LibraryNode[]>();
  for (const node of nodes) {
    const key = node.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), node]);
  }

  function renderNodes(parentId: string | null, depth = 0) {
    return (byParent.get(parentId) ?? []).map((node) => (
      <div key={node.id}>
        <button
          className={`tree-node ${selectedNodeId === node.id ? "tree-node-active" : ""}`}
          style={{ paddingLeft: 10 + depth * 16 }}
          onClick={() => node.nodeType === "document" && onSelectDocument(node.id)}
        >
          {node.nodeType === "category" ? (
            <LibraryIcon size={15} />
          ) : node.nodeType === "folder" ? (
            <Folder size={15} />
          ) : (
            <FileText size={15} />
          )}
          <span>{node.title}</span>
        </button>
        {node.nodeType !== "document" ? renderNodes(node.id, depth + 1) : null}
      </div>
    ));
  }

  return <nav className="library-tree">{renderNodes(null)}</nav>;
}
