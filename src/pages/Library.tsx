import { useEffect, useMemo, useState } from "react";
import { libraryApi } from "../app/api";
import type { DocumentRecord, LibraryNode } from "../app/types";
import { LibraryTree } from "../components/LibraryTree";
import { MarkdownEditor } from "../components/MarkdownEditor";

const defaultSelectedNodeId = "category:experience";

export function Library() {
  const [nodes, setNodes] = useState<LibraryNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState(defaultSelectedNodeId);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  async function loadNodes() {
    setNodes(await libraryApi.listNodes());
  }

  useEffect(() => {
    loadNodes().catch(() => setError("无法加载记录箱。"));
  }, []);

  function selectedParentForNewNode() {
    if (selectedNode?.nodeType === "document") {
      return selectedNode.parentId ?? defaultSelectedNodeId;
    }
    return selectedNode?.id ?? selectedNodeId;
  }

  async function selectNode(node: LibraryNode) {
    setSelectedNodeId(node.id);
    if (node.nodeType === "document") {
      const next = await libraryApi.getDocument(node.id);
      setDocument(next);
      setContent(next.content);
      return;
    }

    setDocument(null);
    setContent("");
  }

  async function saveDocument() {
    if (!document) return;
    const saved = await libraryApi.saveDocument(document.nodeId, content);
    setDocument(saved);
    setContent(saved.content);
    await loadNodes();
  }

  async function createFolder() {
    const title = window.prompt("文件夹名称");
    if (!title?.trim()) return;
    const parentId = selectedParentForNewNode();
    const folder = await libraryApi.createFolder(parentId, title.trim());
    setSelectedNodeId(folder.id);
    setDocument(null);
    setContent("");
    await loadNodes();
  }

  async function createDocument() {
    const title = window.prompt("文件名称");
    if (!title?.trim()) return;
    const parentId = selectedParentForNewNode();
    const next = await libraryApi.createDocument(parentId, title.trim());
    setDocument(next);
    setSelectedNodeId(next.nodeId);
    setContent(next.content);
    await loadNodes();
  }

  async function deleteSelectedNode() {
    if (!selectedNode || selectedNode.nodeType === "category") return;
    if (!window.confirm(`确认删除“${selectedNode.title}”吗？`)) return;

    await libraryApi.deleteNode(selectedNode.id);
    setSelectedNodeId(selectedNode.parentId ?? defaultSelectedNodeId);
    setDocument(null);
    setContent("");
    await loadNodes();
  }

  async function renameSelectedNode() {
    if (!selectedNode || selectedNode.nodeType === "category") return;
    const title = window.prompt("新名称", selectedNode.title);
    if (!title?.trim()) return;

    const renamed = await libraryApi.renameNode(selectedNode.id, title.trim());
    if (document?.nodeId === renamed.id) {
      setDocument({ ...document, title: renamed.title, updatedAt: renamed.updatedAt });
    }
    await loadNodes();
  }

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">记录箱</p>
          <h1>分类记录</h1>
        </div>
        <div className="toolbar">
          <button onClick={createFolder}>新建文件夹</button>
          <button onClick={createDocument}>新建文件</button>
          <button onClick={renameSelectedNode} disabled={!selectedNode || selectedNode.nodeType === "category"}>
            重命名
          </button>
          <button onClick={deleteSelectedNode} disabled={!selectedNode || selectedNode.nodeType === "category"}>
            删除
          </button>
        </div>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="library-layout">
        <LibraryTree nodes={nodes} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
        {document ? (
          <MarkdownEditor title={document.title} value={content} onChange={setContent} onSave={saveDocument} />
        ) : (
          <div className="empty-state">从记录箱里选择一个文件。</div>
        )}
      </div>
    </section>
  );
}
