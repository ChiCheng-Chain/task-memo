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
        <button onClick={onSave}>Save changes</button>
      </header>
      <textarea aria-label="Markdown content" value={value} onChange={(event) => onChange(event.target.value)} />
    </section>
  );
}
