import { describe, expect, it, vi } from "vitest";

const listeners = new Map<string, (payload: unknown) => void>();

const socket = {
  on: vi.fn((key: string, handler: (payload: unknown) => void) => {
    listeners.set(key, handler);
  }),
  off: vi.fn((key: string) => {
    listeners.delete(key);
  }),
};

vi.mock("@/components/providers/socket-provider", () => ({
  useSocket: () => ({ socket, isConnected: true }),
}));

import { useChatSocket } from "@/hooks/use-chat-socket";
import { renderHookWithQueryClient } from "../helpers/react-query";

const message = (id: string, content: string) => ({
  id,
  content,
  member: { id: "mem-1", profile: { id: "p1", name: "Ege" } },
});

describe("useChatSocket", () => {
  it("prepends added messages and replaces updated ones", () => {
    const { queryClient } = renderHookWithQueryClient(() =>
      useChatSocket({
        addKey: "chat:c1:messages",
        updateKey: "chat:c1:messages:update",
        queryKey: "chat:c1",
      }),
    );

    queryClient.setQueryData(["chat:c1"], {
      pages: [{ items: [message("m1", "hello")] }],
    });

    listeners.get("chat:c1:messages")?.(message("m2", "new"));
    expect(queryClient.getQueryData(["chat:c1"])).toEqual({
      pages: [{ items: [message("m2", "new"), message("m1", "hello")] }],
    });

    listeners.get("chat:c1:messages:update")?.(message("m1", "edited"));
    expect(queryClient.getQueryData(["chat:c1"])).toEqual({
      pages: [{ items: [message("m2", "new"), message("m1", "edited")] }],
    });
  });

  it("seeds the first page when cache is empty", () => {
    const { queryClient } = renderHookWithQueryClient(() =>
      useChatSocket({
        addKey: "chat:c1:messages",
        updateKey: "chat:c1:messages:update",
        queryKey: "chat:c1",
      }),
    );

    listeners.get("chat:c1:messages")?.(message("m1", "first"));
    expect(queryClient.getQueryData(["chat:c1"])).toEqual({
      pages: [{ items: [message("m1", "first")] }],
    });
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHookWithQueryClient(() =>
      useChatSocket({
        addKey: "chat:c1:messages",
        updateKey: "chat:c1:messages:update",
        queryKey: "chat:c1",
      }),
    );

    unmount();
    expect(socket.off).toHaveBeenCalledWith("chat:c1:messages");
    expect(socket.off).toHaveBeenCalledWith("chat:c1:messages:update");
  });
});
