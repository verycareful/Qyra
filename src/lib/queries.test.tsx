import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  usePdfInfo,
  usePdfMetadata,
  useStarred,
  useSetStarred,
  useDiskSpace,
  usePdfComments,
} from "./queries";
import { mockCommand, lastCallArgs } from "../test/mockTauri";

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("read queries", () => {
  it("usePdfInfo fetches and exposes page count", async () => {
    mockCommand("get_pdf_info", { page_count: 5, file_size: 100, metadata: {} });
    const { result } = renderHook(() => usePdfInfo("a.pdf"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.page_count).toBe(5);
  });

  it("usePdfInfo stays disabled while path is null", () => {
    const { result } = renderHook(() => usePdfInfo(null), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("usePdfMetadata returns the metadata object", async () => {
    mockCommand("get_metadata", { title: "Hello" });
    const { result } = renderHook(() => usePdfMetadata("a.pdf"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe("Hello");
  });

  it("useStarred returns the library list", async () => {
    mockCommand("get_starred", [
      { path: "a.pdf", name: "a", starred: true, archived: false, addedAt: 1 },
    ]);
    const { result } = renderHook(() => useStarred(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it("useDiskSpace reports free bytes", async () => {
    mockCommand("get_disk_space", { total: 100, available: 60, used: 40 });
    const { result } = renderHook(() => useDiskSpace(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.available).toBe(60);
  });

  it("usePdfComments parses the JSON payload into typed comments", async () => {
    mockCommand("load_comments", () =>
      JSON.stringify([
        { id: "c1", pageIndex: 0, x: 1, y: 2, text: "hi", color: "#fff", resolved: false, createdAt: 1 },
      ]),
    );
    const { result } = renderHook(() => usePdfComments("a.pdf"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.id).toBe("c1");
  });

  it("usePdfComments falls back to empty on malformed JSON", async () => {
    mockCommand("load_comments", () => "not json");
    const { result } = renderHook(() => usePdfComments("a.pdf"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("mutations", () => {
  it("useSetStarred sends path, name, and flag", async () => {
    mockCommand("set_starred", null);
    mockCommand("get_starred", []);
    const { result } = renderHook(() => useSetStarred(), { wrapper: wrapper() });

    result.current.mutate({ path: "a.pdf", name: "a", starred: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lastCallArgs("set_starred")).toEqual({ path: "a.pdf", name: "a", starred: true });
  });
});
