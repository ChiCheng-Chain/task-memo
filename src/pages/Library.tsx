import { useEffect, useMemo, useState } from "react";
import { libraryApi } from "../app/api";
import type { DocumentRecord, LibraryNode } from "../app/types";
import { LibraryTree } from "../components/LibraryTree";
import { MarkdownEditor } from "../components/MarkdownEditor";

export function Library() {
  const [nodes, setNodes] = useState<LibraryNode[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("category:experience");
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === (document?.nodeId ?? selectedParentId)),
    [document?.nodeId, nodes, selectedParentId],
  );

  async function loadNodes() {
    setNodes(await libraryApi.listNodes());
  }

  useEffect(() => {
    loadNodes().catch(() => setError("Could not load library."));
  }, []);

  async function selectDocument(nodeId: string) {
    const next = await libraryApi.getDocument(nodeId);
    setDocument(next);
    setSelectedParentId(nodeId);
    setContent(next.content);
  }

  async function saveDocument() {
    if (!document) return;
    const saved = await libraryApi.saveDocument(document.nodeId, content);
    setDocument(saved);
    setContent(saved.content);
    await loadNodes();
  }

  async function createFolder() {
    const title = window.prompt("Folder name");
    if (!title?.trim()) return;
    const parentId = selectedNode?.nodeType === "document" ? selectedNode.parentId ?? "category:experience" : selectedParentId;
    const folder = await libraryApi.createFolder(parentId, title.trim());
    setSelectedParentId(folder.id);
    await loadNodes();
  }

  async function createDocument() {
    const title = window.prompt("Document name");
    if (!title?.trim()) return;
    const parentId = selectedNode?.nodeType === "document" ? selectedNode.parentId ?? "category:experience" : selectedParentId;
    const next = await libraryApi.createDocument(parentId, title.trim());
    setDocument(next);
    setSelectedParentId(next.nodeId);
    setContent(next.content);
    await loadNodes();
  }

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Notes</h1>
        </div>
        <div className="toolbar">
          <button onClick={createFolder}>New folder</button>
          <button onClick={createDocument}>New document</button>
        </div>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="library-layout">
        <LibraryTree nodes={nodes} selectedNodeId={document?.nodeId ?? null} onSelectDocument={selectDocument} />
        {document ? (
          <MarkdownEditor title={document.title} value={content} onChange={setContent} onSave={saveDocument} />
        ) : (
          <div className="empty-state">Select a document from the library.</div>
        )}
      </div>
    </section>
  );
}
