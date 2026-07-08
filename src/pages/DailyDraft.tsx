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
      .catch(() => setError("Could not load daily draft."));
  }, [date]);

  async function saveDraft() {
    const saved = await dailyApi.saveDraft(date, content);
    setContent(saved.content);
  }

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">{date}</p>
          <h1>Daily draft</h1>
        </div>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      <MarkdownEditor title="Daily draft" value={content} onChange={setContent} onSave={saveDraft} />
    </section>
  );
}
