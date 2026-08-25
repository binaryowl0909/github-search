import type { SearchType } from "../types";

interface SearchBarProps {
  searchText: string;
  searchType: SearchType;
  onTextChange: (value: string) => void;
  onTypeChange: (value: SearchType) => void;
}

export function SearchBar({
  searchText,
  searchType,
  onTextChange,
  onTypeChange,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        className="search-bar__input"
        type="text"
        placeholder="Start typing to search…"
        value={searchText}
        onChange={(event) => onTextChange(event.target.value)}
        autoFocus
      />
      <select
        className="search-bar__select"
        aria-label="Entity type"
        value={searchType}
        onChange={(event) => onTypeChange(event.target.value as SearchType)}
      >
        <option value="users">Users</option>
        <option value="repositories">Repositories</option>
      </select>
    </div>
  );
}
