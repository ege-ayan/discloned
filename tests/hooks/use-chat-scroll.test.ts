import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useChatScroll } from "@/hooks/use-chat-scroll";

function createScrollDiv(init?: Partial<HTMLDivElement>) {
  const el = document.createElement("div");
  Object.defineProperties(el, {
    scrollTop: { value: init?.scrollTop ?? 40, writable: true },
    scrollHeight: { value: init?.scrollHeight ?? 400, writable: true },
    clientHeight: { value: init?.clientHeight ?? 200, writable: true },
  });
  return el;
}

describe("useChatScroll", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads more when the user scrolls to the top", () => {
    const chatEl = createScrollDiv({
      scrollTop: 40,
    } as Partial<HTMLDivElement>);
    const chatRef = createRef<HTMLDivElement>();
    const bottomRef = createRef<HTMLDivElement>();
    Object.defineProperty(chatRef, "current", {
      value: chatEl,
      writable: true,
    });
    Object.defineProperty(bottomRef, "current", {
      value: document.createElement("div"),
      writable: true,
    });

    const loadMore = vi.fn();
    renderHook(() =>
      useChatScroll({
        chatRef,
        bottomRef,
        shouldLoadMore: true,
        loadMore,
        count: 1,
      }),
    );

    Object.defineProperty(chatEl, "scrollTop", { value: 0, writable: true });
    chatEl.dispatchEvent(new Event("scroll"));

    expect(loadMore).toHaveBeenCalledOnce();
  });

  it("does not load more when shouldLoadMore is false", () => {
    const chatEl = createScrollDiv({ scrollTop: 0 } as Partial<HTMLDivElement>);
    const chatRef = createRef<HTMLDivElement>();
    const bottomRef = createRef<HTMLDivElement>();
    Object.defineProperty(chatRef, "current", {
      value: chatEl,
      writable: true,
    });
    Object.defineProperty(bottomRef, "current", {
      value: document.createElement("div"),
      writable: true,
    });

    const loadMore = vi.fn();
    renderHook(() =>
      useChatScroll({
        chatRef,
        bottomRef,
        shouldLoadMore: false,
        loadMore,
        count: 1,
      }),
    );

    chatEl.dispatchEvent(new Event("scroll"));
    expect(loadMore).not.toHaveBeenCalled();
  });

  it("auto-scrolls to the bottom on first paint", () => {
    vi.useFakeTimers();
    const bottomEl = document.createElement("div");
    const scrollIntoView = vi.fn();
    bottomEl.scrollIntoView = scrollIntoView;

    const chatRef = createRef<HTMLDivElement>();
    const bottomRef = createRef<HTMLDivElement>();
    Object.defineProperty(chatRef, "current", {
      value: createScrollDiv(),
      writable: true,
    });
    Object.defineProperty(bottomRef, "current", {
      value: bottomEl,
      writable: true,
    });

    renderHook(() =>
      useChatScroll({
        chatRef,
        bottomRef,
        shouldLoadMore: false,
        loadMore: vi.fn(),
        count: 3,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });
});
