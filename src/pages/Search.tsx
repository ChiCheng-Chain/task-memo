import { useState } from "react";
import { searchApi } from "../app/api";
import type { SearchResult } from "../app/types";
import { SearchBar } from "../components/SearchBar";

export function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(query: string) {
    setError(null);
    try {
      setResults(await searchApi.all(query));
    } catch {
      setError("Could not run search.");
    }
  }

  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">Search</p>
          <h1>Find</h1>
        </div>
      </header>
      <SearchBar onSearch={runSearch} />
      {error ? <p className="error-text">{error}</p> : null}
      <div className="search-results">
        {results.map((result) => (
          <article className="search-result" key={`${result.source}:${result.id}`}>
            <span className="search-source">{result.source.replace(/_/g, " ")}</span>
            <h2>{result.title}</h2>
            <p>{result.snippet}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
