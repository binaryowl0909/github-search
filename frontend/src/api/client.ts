import type { SearchResponse, SearchType } from "../types";

export async function searchGithub(
  searchType: SearchType,
  searchText: string,
): Promise<SearchResponse> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ search_type: searchType, search_text: searchText }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Search failed (${response.status})`);
  }
  return response.json();
}
