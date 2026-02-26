import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useBulkUrlParams from "./useBulkUrlParams";

let mockIsReady = true;
let mockQuery: Record<string, string> = {};
const mockPathname = "/test";
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    isReady: mockIsReady,
    pathname: mockPathname,
    push: mockPush,
    query: mockQuery,
    replace: mockReplace,
  }),
}));

describe("useBulkUrlParams (Pages Router)", () => {
  beforeEach(() => {
    mockIsReady = true;
    mockQuery = {};
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("initiate hook with all needed params", () => {
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    expect(result.current.isFilterActive).toBe(false);
    expect(result.current.isFilterInactive).toBe(false);
    expect(result.current.isSortAsc).toBe(false);
    expect(result.current.isSortDesc).toBe(false);
    expect(result.current.set).toBeTypeOf("function");
  });

  it("all flags are false when router is not ready", () => {
    mockIsReady = false;
    mockQuery = { filter: "active" };
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    expect(result.current.isFilterActive).toBe(false);
    expect(result.current.isSortDesc).toBe(false);
  });

  it("set calls router.push merging with existing query", () => {
    mockQuery = { unrelated: "value" };
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    act(() => result.current.set({ filter: "active", sort: "asc" }));
    expect(mockPush).toHaveBeenCalledWith(
      { pathname: "/test", query: { filter: "active", sort: "asc", unrelated: "value" } },
      undefined,
      { shallow: true },
    );
  });

  it("set calls router.replace when replace: true", () => {
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    act(() => result.current.set({ sort: "desc" }, { replace: true }));
    expect(mockReplace).toHaveBeenCalledWith({ pathname: "/test", query: { sort: "desc" } }, undefined, {
      shallow: true,
    });
  });

  it("clearParams removes only declared keys, preserves others", () => {
    mockQuery = { extra: "keep", filter: "inactive", sort: "desc" };
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    act(() => result.current.clearParams());
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/test", query: { extra: "keep" } }, undefined, {
      shallow: true,
    });
  });
});
