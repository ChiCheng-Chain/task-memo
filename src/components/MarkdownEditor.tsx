interface MarkdownEditorProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function MarkdownEditor({ title, value, onChange, onSave }: MarkdownEditorProps) {
  return (
    <section className="markdown-editor">
      <header className="editor-header">
        <h2>{title}</h2>
        <button onClick={onSave}>保存修改</button>
      </header>
      <textarea aria-label="Markdown 内容" value={value} onChange={(event) => onChange(event.target.value)} />
    </section>
  );
}
