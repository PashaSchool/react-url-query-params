import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useBulkUrlParams from "./useBulkUrlParams";

let mockPathname = "/";
let mockSearchParams = new URLSearchParams("");
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

describe("useBulkUrlParams (App Router)", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams("");
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

  it("set calls router.push with merged params", () => {
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    act(() => result.current.set({ filter: "active", sort: "asc" }));
    expect(mockPush).toHaveBeenCalledWith("/?filter=active&sort=asc");
  });

  it("set calls router.replace when replace: true", () => {
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    act(() => result.current.set({ sort: "desc" }, { replace: true }));
    expect(mockReplace).toHaveBeenCalledWith("/?sort=desc");
  });

  it("set correct batch data and not override unrelated params", () => {
    mockSearchParams = new URLSearchParams("unrelated=keep");
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    act(() => result.current.set({ filter: "active" }));
    expect(mockPush).toHaveBeenCalledWith("/?unrelated=keep&filter=active");
  });

  it("clearParams removes only declared keys, preserves others", () => {
    mockSearchParams = new URLSearchParams("filter=inactive&sort=desc&unrelated=keep");
    const { result } = renderHook(() => useBulkUrlParams({ filter: ["active", "inactive"], sort: ["asc", "desc"] }));
    act(() => result.current.clearParams());
    expect(mockPush).toHaveBeenCalledWith("/?unrelated=keep");
  });
});
