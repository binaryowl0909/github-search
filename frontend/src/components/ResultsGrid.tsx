import type { GithubRepo, GithubUser, SearchResponse, SearchType } from "../types";
import { RepoCard } from "./RepoCard";
import { UserCard } from "./UserCard";

interface ResultsGridProps {
  searchType: SearchType;
  response: SearchResponse;
}

export function ResultsGrid({ searchType, response }: ResultsGridProps) {
  if (response.items.length === 0) {
    return <p className="status">No results found. Try a different term.</p>;
  }

  return (
    <div className="results-grid">
      {searchType === "users"
        ? (response.items as GithubUser[]).map((item) => (
            <UserCard key={item.id} user={item} />
          ))
        : (response.items as GithubRepo[]).map((item) => (
            <RepoCard key={item.id} repo={item} />
          ))}
    </div>
  );
}
