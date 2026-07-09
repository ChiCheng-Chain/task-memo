import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";

interface TaskEditorProps {
  onCreate: (title: string) => void;
}

export function TaskEditor({ onCreate }: TaskEditorProps) {
  const [title, setTitle] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setTitle("");
  }

  return (
    <form className="task-editor" onSubmit={submit}>
      <input
        aria-label="新任务"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="记录下一步要做什么"
      />
      <button type="submit">
        <Plus size={16} />
        添加任务
      </button>
    </form>
  );
}
