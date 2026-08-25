import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGithubSearch } from "../hooks/useGithubSearch";
import * as client from "../api/client";

const payload = { total_count: 1, incomplete_results: false, items: [] };
const flushDebounce = () => act(async () => { await vi.advanceTimersByTimeAsync(300); });

describe("useGithubSearch", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stays idle and never calls the API under 3 characters", async () => {
    const spy = vi.spyOn(client, "searchGithub");
    const { result, rerender } = renderHook(
      ({ text }) => useGithubSearch(text, "users"),
      { initialProps: { text: "" } },
    );

    rerender({ text: "re" });
    await flushDebounce();

    expect(result.current.status).toBe("idle");
    expect(spy).not.toHaveBeenCalled();
  });

  it("debounces: rapid keystrokes produce a single API call", async () => {
    const spy = vi.spyOn(client, "searchGithub").mockResolvedValue(payload);
    const { rerender } = renderHook(
      ({ text }) => useGithubSearch(text, "users"),
      { initialProps: { text: "rea" } },
    );

    rerender({ text: "reac" });
    rerender({ text: "react" });
    await flushDebounce();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("users", "react");
  });

  it("goes loading then success with results", async () => {
    vi.spyOn(client, "searchGithub").mockResolvedValue(payload);
    const { result } = renderHook(() => useGithubSearch("react", "repositories"));

    expect(result.current.status).toBe("loading");
    await flushDebounce();

    expect(result.current).toEqual({ status: "success", results: payload });
  });

  it("serves a repeated term from cache without a second API call", async () => {
    const spy = vi.spyOn(client, "searchGithub").mockResolvedValue(payload);
    const { result, rerender } = renderHook(
      ({ text }) => useGithubSearch(text, "users"),
      { initialProps: { text: "react" } },
    );
    await flushDebounce();

    rerender({ text: "re" });      // clear
    rerender({ text: "react" });   // same term again
    await flushDebounce();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("success");
  });

  it("changing entity type with >=3 chars refreshes results", async () => {
    const spy = vi.spyOn(client, "searchGithub").mockResolvedValue(payload);
    const { rerender } = renderHook(
      ({ type }) => useGithubSearch("react", type),
      { initialProps: { type: "users" as const } },
    );
    await flushDebounce();

    rerender({ type: "repositories" as const });
    await flushDebounce();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith("repositories", "react");
  });

  it("clearing the input returns to idle", async () => {
    vi.spyOn(client, "searchGithub").mockResolvedValue(payload);
    const { result, rerender } = renderHook(
      ({ text }) => useGithubSearch(text, "users"),
      { initialProps: { text: "react" } },
    );
    await flushDebounce();

    rerender({ text: "" });

    expect(result.current.status).toBe("idle");
  });

  it("exposes the error message on failure", async () => {
    vi.spyOn(client, "searchGithub").mockRejectedValue(new Error("rate limited"));
    const { result } = renderHook(() => useGithubSearch("react", "users"));
    await flushDebounce();

    expect(result.current).toEqual({ status: "error", message: "rate limited" });
  });
});
