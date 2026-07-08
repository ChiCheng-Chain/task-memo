import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <input aria-label="Search query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks and notes" />
      <button type="submit">
        <Search size={16} />
        Search
      </button>
    </form>
  );
}
