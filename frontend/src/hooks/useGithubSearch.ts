import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { searchGithub } from "../api/client";
import type { SearchResponse, SearchType } from "../types";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; results: SearchResponse };

export function useGithubSearch(
  searchText: string,
  searchType: SearchType,
): SearchState {
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const cacheRef = useRef(new Map<string, SearchResponse>());
  const requestIdRef = useRef(0);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (type: SearchType, text: string) => {
        const requestId = ++requestIdRef.current;
        try {
          const results = await searchGithub(type, text);
          cacheRef.current.set(`${type}:${text}`, results);
          if (requestId === requestIdRef.current) {
            setState({ status: "success", results });
          }
        } catch (error) {
          if (requestId === requestIdRef.current) {
            setState({ status: "error", message: (error as Error).message });
          }
        }
      }, DEBOUNCE_MS),
    [],
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  useEffect(() => {
    const term = searchText.trim().toLowerCase();

    if (term.length < MIN_QUERY_LENGTH) {
      debouncedSearch.cancel();
      requestIdRef.current += 1; // invalidate any in-flight response
      setState({ status: "idle" });
      return;
    }

    const cached = cacheRef.current.get(`${searchType}:${term}`);
    if (cached) {
      debouncedSearch.cancel();
      requestIdRef.current += 1;
      setState({ status: "success", results: cached });
      return;
    }

    setState({ status: "loading" });
    debouncedSearch(searchType, term);
  }, [searchText, searchType, debouncedSearch]);

  return state;
}
