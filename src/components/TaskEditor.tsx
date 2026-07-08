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
        aria-label="New task"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Capture next action"
      />
      <button type="submit">
        <Plus size={16} />
        Add task
      </button>
    </form>
  );
}
