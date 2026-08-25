export type SearchType = "users" | "repositories";

export interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  owner: GithubUser;
}

export interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GithubUser[] | GithubRepo[];
}

export type SearchResult = GithubUser | GithubRepo;
