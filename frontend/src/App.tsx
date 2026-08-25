import { useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { ResultsGrid } from "./components/ResultsGrid";
import { useGithubSearch } from "./hooks/useGithubSearch";
import type { SearchType } from "./types";

export default function App() {
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("users");
  const state = useGithubSearch(searchText, searchType);

  return (
    <div className={`app ${state.status === "idle" ? "app--centered" : ""}`}>
      <header className="app__header">
        <h1 className="app__title">GitHub Search</h1>
        <p className="app__subtitle">
          Search users and repositories. Type at least 3 characters.
        </p>
        <SearchBar
          searchText={searchText}
          searchType={searchType}
          onTextChange={setSearchText}
          onTypeChange={setSearchType}
        />
      </header>

      <main className="app__results">
        {state.status === "loading" && <p className="status">Searching…</p>}
        {state.status === "error" && (
          <p className="status status--error" role="alert">
            {state.message}
          </p>
        )}
        {state.status === "success" && (
          <ResultsGrid searchType={searchType} response={state.results} />
        )}
      </main>
    </div>
  );
}
