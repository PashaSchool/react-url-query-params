import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useUrlParams from "./useUrlParams";

let mockIsReady = false;
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

describe("useUrlParams (Pages Router)", () => {
  beforeEach(() => {
    mockIsReady = false;
    mockQuery = {};
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("returns null for all values when router is not ready", () => {
    mockIsReady = false;
    mockQuery = { view: "grid" };
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    expect(result.current.view).toBeNull();
    expect(result.current.isViewGrid).toBe(false);
    expect(result.current.isViewTable).toBe(false);
  });

  it("initiate with all provided params following correct interface", () => {
    mockIsReady = true;
    mockQuery = { view: "grid" };
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    expect(result.current.view).toBe("grid");
    expect(result.current.isViewGrid).toBe(true);
    expect(result.current.isViewTable).toBe(false);
    expect(result.current.setView).toBeTypeOf("function");
    expect(result.current.toggleView).toBeTypeOf("function");
    expect(result.current.clearView).toBeTypeOf("function");
  });

  it("returns null when URL value is not in options", () => {
    mockIsReady = true;
    mockQuery = { view: "list" };
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    expect(result.current.view).toBeNull();
  });

  it("set<Key> calls router.push with shallow navigation", () => {
    mockIsReady = true;
    mockQuery = { view: "grid" };
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.setView("table"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/test", query: { view: "table" } }, undefined, {
      shallow: true,
    });
  });

  it("set<Key> calls router.replace when replace: true", () => {
    mockIsReady = true;
    mockQuery = {};
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.setView("grid", { replace: true }));
    expect(mockReplace).toHaveBeenCalledWith({ pathname: "/test", query: { view: "grid" } }, undefined, {
      shallow: true,
    });
  });

  it("clear<Key> removes the param from query", () => {
    mockIsReady = true;
    mockQuery = { other: "preserved", view: "table" };
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.clearView());
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/test", query: { other: "preserved" } }, undefined, {
      shallow: true,
    });
  });

  it("toggle<Key> alternates between two options", () => {
    mockIsReady = true;
    mockQuery = { view: "grid" };
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.toggleView());
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/test", query: { view: "table" } }, undefined, {
      shallow: true,
    });
  });

  it("toggle<Key> not possible for more than two options", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockIsReady = true;
    mockQuery = { view: "grid" };
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table", "dashboard"] }));
    act(() => result.current.toggleView());
    expect(mockPush).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
