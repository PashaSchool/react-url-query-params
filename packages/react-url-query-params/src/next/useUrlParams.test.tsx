import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useUrlParams from "./useUrlParams";

let mockPathname = "/";
let mockSearchParams = new URLSearchParams("view=grid");
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe("useUrlParams (App Router)", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams("view=grid");
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("initiate with all provided params following correct interface", () => {
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    expect(result.current.view).toBe("grid");
    expect(result.current.isViewGrid).toBe(true);
    expect(result.current.isViewTable).toBe(false);
    expect(result.current.setView).toBeTypeOf("function");
    expect(result.current.toggleView).toBeTypeOf("function");
    expect(result.current.clearView).toBeTypeOf("function");
  });

  it("reads current value and produced field is<Key><Option>", () => {
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    expect(result.current.view).toBe("grid");
    expect(result.current.isViewGrid).toBe(true);
    expect(result.current.isViewTable).toBe(false);
  });

  it("set<Key> calls router.push with updated param", () => {
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.setView("table"));
    expect(mockPush).toHaveBeenCalledWith("/?view=table");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("set<Key> calls router.replace when replace: true", () => {
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.setView("table", { replace: true }));
    expect(mockReplace).toHaveBeenCalledWith("/?view=table");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("set<Key> ignores value not in options", () => {
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.setView("list" as never));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("clear<Key> removes param and calls router.push", () => {
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.clearView());
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("toggle<Key> alternates between two options", () => {
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table"] }));
    act(() => result.current.toggleView());
    expect(mockPush).toHaveBeenCalledWith("/?view=table");
  });

  it("toggle<Key> not possible for more than two options", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useUrlParams({ keyName: "view", options: ["grid", "table", "dashboard"] }));
    act(() => result.current.toggleView());
    expect(mockPush).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
