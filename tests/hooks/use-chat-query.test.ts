import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/providers/socket-provider", () => ({
  useSocket: vi.fn(),
}));

import { useSocket } from "@/components/providers/socket-provider";
import { useChatQuery } from "@/hooks/use-chat-query";
import { renderHookWithQueryClient } from "../helpers/react-query";

describe("useChatQuery", () => {
  beforeEach(() => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the first page with the channel query", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ items: [{ id: "m1" }], nextCursor: null }),
        {
          status: 200,
        },
      ),
    );

    const { result } = renderHookWithQueryClient(() =>
      useChatQuery({
        queryKey: "chat:c1",
        apiUrl: "/api/messages",
        paramKey: "channelId",
        paramValue: "c1",
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/messages?channelId=c1");
    expect(result.current.data?.pages[0].items).toEqual([{ id: "m1" }]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("polls when the socket is disconnected", async () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: false,
    });
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: null }), {
        status: 200,
      }),
    );

    const { result } = renderHookWithQueryClient(() =>
      useChatQuery({
        queryKey: "chat:dm1",
        apiUrl: "/api/direct-messages",
        paramKey: "conversationId",
        paramValue: "dm1",
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(result.current.hasNextPage).toBe(false);
  });
});
