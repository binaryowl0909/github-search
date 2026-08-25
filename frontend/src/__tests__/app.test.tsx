import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import * as client from "../api/client";

const flushDebounce = () => act(async () => { await vi.advanceTimersByTimeAsync(300); });

describe("App", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows the centered empty screen initially", () => {
    render(<App />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(document.querySelector(".app--centered")).not.toBeNull();
  });

  it("shows loading then results after typing 3+ chars", async () => {
    vi.spyOn(client, "searchGithub").mockResolvedValue({
      total_count: 1,
      incomplete_results: false,
      items: [
        {
          id: 1,
          login: "octocat",
          avatar_url: "https://example.com/a.png",
          html_url: "https://github.com/octocat",
          type: "User",
        },
      ],
    });
    render(<App />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "oct" } });
    expect(screen.getByText(/searching/i)).toBeInTheDocument();

    await flushDebounce();
    expect(screen.getByText("octocat")).toBeInTheDocument();
    expect(document.querySelector(".app--centered")).toBeNull();
  });

  it("shows the error state message", async () => {
    vi.spyOn(client, "searchGithub").mockRejectedValue(new Error("rate limited"));
    render(<App />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "oct" } });
    await flushDebounce();

    expect(screen.getByRole("alert")).toHaveTextContent("rate limited");
  });

  it("returns to the centered empty screen when input is cleared", async () => {
    vi.spyOn(client, "searchGithub").mockResolvedValue({
      total_count: 0,
      incomplete_results: false,
      items: [],
    });
    render(<App />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "oct" } });
    await flushDebounce();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });

    expect(document.querySelector(".app--centered")).not.toBeNull();
  });

  it("does not crash when switching entity type before new results arrive", async () => {
    vi.spyOn(client, "searchGithub").mockResolvedValue({
      total_count: 1,
      incomplete_results: false,
      items: [
        {
          id: 1,
          login: "octocat",
          avatar_url: "https://example.com/a.png",
          html_url: "https://github.com/octocat",
          type: "User",
        },
      ],
    });
    render(<App />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "react" } });
    await flushDebounce();
    expect(screen.getByText("octocat")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "repositories" } });

    expect(screen.getByText(/searching/i)).toBeInTheDocument();
  });
});
