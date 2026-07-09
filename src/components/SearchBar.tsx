import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import type { SearchScope } from "../app/types";

interface SearchBarProps {
  onSearch: (query: string, sources: SearchScope[]) => void;
}

const scopeOptions: Array<{ label: string; value: SearchScope }> = [
  { label: "任务", value: "task" },
  { label: "记录箱", value: "document" },
  { label: "日报", value: "daily_draft" },
];

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<SearchScope[]>(scopeOptions.map((scope) => scope.value));

  function toggleSource(source: SearchScope) {
    setSources((current) => (current.includes(source) ? current.filter((item) => item !== source) : [...current, source]));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || sources.length === 0) return;
    onSearch(trimmed, sources);
  }

  return (
    <form className="search-panel" onSubmit={submit}>
      <div className="search-bar">
        <input aria-label="搜索内容" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务和记录" />
        <button type="submit" disabled={sources.length === 0}>
          <Search size={16} />
          搜索
        </button>
      </div>
      <fieldset className="scope-controls">
        <legend>检索范围</legend>
        {scopeOptions.map((scope) => (
          <label key={scope.value}>
            <input
              type="checkbox"
              checked={sources.includes(scope.value)}
              onChange={() => toggleSource(scope.value)}
            />
            {scope.label}
          </label>
        ))}
      </fieldset>
    </form>
  );
}
