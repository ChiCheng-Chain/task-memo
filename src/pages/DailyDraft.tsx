import { useEffect, useState } from "react";
import { dailyApi } from "../app/api";
import { MarkdownEditor } from "../components/MarkdownEditor";

interface DailyDraftProps {
  date: string;
}

export function DailyDraft({ date }: DailyDraftProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dailyApi
      .getDraft(date)
      .then((draft) => setContent(draft.content))
      .catch(() => setError("无法加载日报草稿。"));
  }, [date]);

  async function saveDraft() {
    const saved = await dailyApi.saveDraft(date, content);
    setContent(saved.content);
  }

  async function clearDraft() {
    if (!window.confirm(`确认清空 ${date} 的日报草稿吗？`)) return;
    const saved = await dailyApi.saveDraft(date, "");
    setContent(saved.content);
  }

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">{date}</p>
          <h1>日报草稿</h1>
        </div>
        <div className="toolbar">
          <button onClick={clearDraft}>清空草稿</button>
        </div>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <MarkdownEditor title="日报草稿" value={content} onChange={setContent} onSave={saveDraft} />
    </section>
  );
}
