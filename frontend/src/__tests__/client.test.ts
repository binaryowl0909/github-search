import { afterEach, describe, expect, it, vi } from "vitest";
import { searchGithub } from "../api/client";

describe("searchGithub", () => {
  afterEach(() => vi.restoreAllMocks());

  it("POSTs type and text to /api/search and returns JSON", async () => {
    const payload = { total_count: 0, incomplete_results: false, items: [] };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    const result = await searchGithub("users", "octocat");

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search_type: "users", search_text: "octocat" }),
    });
  });

  it("throws the backend detail message on error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "rate limited" }), { status: 429 }),
    );

    await expect(searchGithub("users", "octocat")).rejects.toThrow("rate limited");
  });

  it("throws a generic message when the error body is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("boom", { status: 500 }),
    );

    await expect(searchGithub("repositories", "react")).rejects.toThrow(
      "Search failed (500)",
    );
  });
});
