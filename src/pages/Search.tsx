import { useState } from "react";
import { searchApi } from "../app/api";
import type { SearchResult } from "../app/types";
import { SearchBar } from "../components/SearchBar";

const sourceLabels: Record<string, string> = {
  task: "任务",
  document: "文档",
  daily_draft: "日报草稿",
};

export function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(query: string) {
    setError(null);
    try {
      setResults(await searchApi.all(query));
    } catch {
      setError("无法执行搜索。");
    }
  }

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">搜索</p>
          <h1>查找</h1>
        </div>
      </header>
      <SearchBar onSearch={runSearch} />
      {error ? <p className="error-text">{error}</p> : null}
      <div className="search-results">
        {results.map((result) => (
          <article className="search-result" key={`${result.source}:${result.id}`}>
            <span className="search-source">{sourceLabels[result.source] ?? result.source}</span>
            <h2>{result.title}</h2>
            <p>{result.snippet}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
