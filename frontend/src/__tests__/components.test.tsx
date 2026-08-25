import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "../components/SearchBar";
import { ResultsGrid } from "../components/ResultsGrid";
import type { GithubRepo, GithubUser } from "../types";

const user: GithubUser = {
  id: 1,
  login: "octocat",
  avatar_url: "https://example.com/a.png",
  html_url: "https://github.com/octocat",
  type: "User",
};

const repo: GithubRepo = {
  id: 2,
  name: "react",
  full_name: "facebook/react",
  html_url: "https://github.com/facebook/react",
  description: "A JS library",
  language: "JavaScript",
  stargazers_count: 220000,
  forks_count: 45000,
  open_issues_count: 900,
  owner: user,
};

describe("SearchBar", () => {
  it("reports text and entity type changes", () => {
    const onTextChange = vi.fn();
    const onTypeChange = vi.fn();
    render(
      <SearchBar
        searchText=""
        searchType="users"
        onTextChange={onTextChange}
        onTypeChange={onTypeChange}
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "rea" } });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "repositories" },
    });

    expect(onTextChange).toHaveBeenCalledWith("rea");
    expect(onTypeChange).toHaveBeenCalledWith("repositories");
  });
});

describe("ResultsGrid", () => {
  it("renders user cards with avatar and profile link", () => {
    render(
      <ResultsGrid
        searchType="users"
        response={{ total_count: 1, incomplete_results: false, items: [user] }}
      />,
    );

    expect(screen.getByText("octocat")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", user.avatar_url);
    expect(screen.getByRole("link", { name: /view profile/i })).toHaveAttribute(
      "href",
      user.html_url,
    );
  });

  it("renders repo cards with owner, stars and stats", () => {
    render(
      <ResultsGrid
        searchType="repositories"
        response={{ total_count: 1, incomplete_results: false, items: [repo] }}
      />,
    );

    expect(screen.getByText("facebook/react")).toBeInTheDocument();
    expect(screen.getByText(/220,000/)).toBeInTheDocument();
    expect(screen.getByText("A JS library")).toBeInTheDocument();
  });
});
