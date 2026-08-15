import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest } from "next";

const { currentProfilePages, conversationFind, messageFind, messageUpdate } =
  vi.hoisted(() => ({
    currentProfilePages: vi.fn(),
    conversationFind: vi.fn(),
    messageFind: vi.fn(),
    messageUpdate: vi.fn(),
  }));

vi.mock("@/lib/current-profile-pages", () => ({ currentProfilePages }));
vi.mock("@/lib/db", () => ({
  db: {
    conversation: { findFirst: conversationFind },
    directMessage: { findFirst: messageFind, update: messageUpdate },
  },
}));

import handler from "@/pages/api/socket/direct-messages/[directMessageId]";
import { MemberRole } from "@/lib/prisma";
import { createPagesApiResponse, profile } from "../../../helpers/http";

function req(partial: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "DELETE",
    body: { content: "edited" },
    query: { directMessageId: "dm-1", conversationId: "d1" },
    ...partial,
  } as NextApiRequest;
}

describe("/api/socket/direct-messages/[directMessageId]", () => {
  beforeEach(() => {
    currentProfilePages.mockReset();
    conversationFind.mockReset();
    messageFind.mockReset();
    messageUpdate.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects unsupported methods and missing conversation", async () => {
    const { res } = createPagesApiResponse();
    await handler(req({ method: "GET" }), res as never);
    expect(res.status).toHaveBeenCalledWith(405);

    currentProfilePages.mockResolvedValue(profile);
    const { res: missing } = createPagesApiResponse();
    await handler(
      req({ query: { directMessageId: "dm-1" } }),
      missing as never,
    );
    expect(missing.status).toHaveBeenCalledWith(400);
  });

  it("soft-deletes an owned DM", async () => {
    currentProfilePages.mockResolvedValue(profile);
    conversationFind.mockResolvedValue({
      id: "d1",
      memberOne: {
        id: "mem-1",
        profileId: profile.id,
        role: MemberRole.GUEST,
      },
      memberTwo: { id: "mem-2", profileId: "other", role: MemberRole.GUEST },
    });
    messageFind.mockResolvedValue({
      id: "dm-1",
      memberId: "mem-1",
      deleted: false,
    });
    messageUpdate.mockResolvedValue({
      id: "dm-1",
      deleted: true,
      content: "This message has been deleted",
    });

    const { res, emit } = createPagesApiResponse();
    await handler(req(), res as never);

    expect(emit).toHaveBeenCalledWith(
      "chat:d1:messages:update",
      expect.objectContaining({ deleted: true }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("blocks a guest from patching someone else's DM", async () => {
    currentProfilePages.mockResolvedValue(profile);
    conversationFind.mockResolvedValue({
      id: "d1",
      memberOne: {
        id: "mem-1",
        profileId: profile.id,
        role: MemberRole.GUEST,
      },
      memberTwo: { id: "mem-2", profileId: "other", role: MemberRole.GUEST },
    });
    messageFind.mockResolvedValue({
      id: "dm-1",
      memberId: "mem-2",
      deleted: false,
    });

    const { res } = createPagesApiResponse();
    await handler(req({ method: "PATCH" }), res as never);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
