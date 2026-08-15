import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest } from "next";

const { currentProfilePages, findFirst, create } = vi.hoisted(() => ({
  currentProfilePages: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/current-profile-pages", () => ({ currentProfilePages }));
vi.mock("@/lib/db", () => ({
  db: {
    server: { findFirst },
    channel: { findFirst },
    message: { create },
  },
}));

import handler from "@/pages/api/socket/messages/index";
import { createPagesApiResponse, profile } from "../../../helpers/http";

function req(partial: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "POST",
    body: { content: "hello" },
    query: { serverId: "s1", channelId: "c1" },
    ...partial,
  } as NextApiRequest;
}

describe("POST /api/socket/messages", () => {
  beforeEach(() => {
    currentProfilePages.mockReset();
    findFirst.mockReset();
    create.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects non-POST methods", async () => {
    const { res } = createPagesApiResponse();
    await handler(req({ method: "GET" }), res as never);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 401 / 400 for missing auth and fields", async () => {
    const { res: unauthorized } = createPagesApiResponse();
    currentProfilePages.mockResolvedValue(null);
    await handler(req(), unauthorized as never);
    expect(unauthorized.status).toHaveBeenCalledWith(401);

    currentProfilePages.mockResolvedValue(profile);
    const { res: noServer } = createPagesApiResponse();
    await handler(req({ query: { channelId: "c1" } }), noServer as never);
    expect(noServer.status).toHaveBeenCalledWith(400);

    const { res: noContent } = createPagesApiResponse();
    await handler(
      req({ body: {}, query: { serverId: "s1", channelId: "c1" } }),
      noContent as never,
    );
    expect(noContent.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when the server or channel is missing", async () => {
    currentProfilePages.mockResolvedValue(profile);
    findFirst.mockResolvedValueOnce(null);
    const { res } = createPagesApiResponse();
    await handler(req(), res as never);
    expect(res.status).toHaveBeenCalledWith(404);

    findFirst
      .mockResolvedValueOnce({ id: "s1", members: [] })
      .mockResolvedValueOnce(null);
    const { res: noChannel } = createPagesApiResponse();
    await handler(req(), noChannel as never);
    expect(noChannel.status).toHaveBeenCalledWith(404);
  });

  it("creates a message and emits it on the channel", async () => {
    currentProfilePages.mockResolvedValue(profile);
    findFirst
      .mockResolvedValueOnce({
        id: "s1",
        members: [{ id: "mem-1", profileId: profile.id }],
      })
      .mockResolvedValueOnce({ id: "c1" });
    create.mockResolvedValue({ id: "msg-1", content: "hello" });

    const { res, emit } = createPagesApiResponse();
    await handler(req(), res as never);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: "hello",
          channelId: "c1",
          memberId: "mem-1",
        }),
      }),
    );
    expect(emit).toHaveBeenCalledWith("chat:c1:messages", {
      id: "msg-1",
      content: "hello",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
