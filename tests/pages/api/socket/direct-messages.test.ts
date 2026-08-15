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
    conversation: { findFirst },
    directMessage: { create },
  },
}));

import handler from "@/pages/api/socket/direct-messages/index";
import { createPagesApiResponse, profile } from "../../../helpers/http";

function req(partial: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "POST",
    body: { content: "hey" },
    query: { conversationId: "d1" },
    ...partial,
  } as NextApiRequest;
}

describe("POST /api/socket/direct-messages", () => {
  beforeEach(() => {
    currentProfilePages.mockReset();
    findFirst.mockReset();
    create.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects non-POST methods", async () => {
    const { res } = createPagesApiResponse();
    await handler(req({ method: "PUT" }), res as never);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 401 / 400 for missing auth, conversation, or content", async () => {
    currentProfilePages.mockResolvedValue(null);
    const { res: unauthorized } = createPagesApiResponse();
    await handler(req(), unauthorized as never);
    expect(unauthorized.status).toHaveBeenCalledWith(401);

    currentProfilePages.mockResolvedValue(profile);
    const { res: noConversation } = createPagesApiResponse();
    await handler(req({ query: {} }), noConversation as never);
    expect(noConversation.status).toHaveBeenCalledWith(400);

    const { res: noContent } = createPagesApiResponse();
    await handler(req({ body: {} }), noContent as never);
    expect(noContent.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when the conversation is missing", async () => {
    currentProfilePages.mockResolvedValue(profile);
    findFirst.mockResolvedValue(null);
    const { res } = createPagesApiResponse();
    await handler(req(), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("creates a DM as member two and emits it", async () => {
    currentProfilePages.mockResolvedValue(profile);
    findFirst.mockResolvedValue({
      id: "d1",
      memberOne: { id: "mem-a", profileId: "other" },
      memberTwo: { id: "mem-b", profileId: profile.id },
    });
    create.mockResolvedValue({ id: "dm-1", content: "hey" });

    const { res, emit } = createPagesApiResponse();
    await handler(req(), res as never);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: "mem-b",
          conversationId: "d1",
        }),
      }),
    );
    expect(emit).toHaveBeenCalledWith("chat:d1:messages", {
      id: "dm-1",
      content: "hey",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
