import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest } from "next";

const {
  currentProfilePages,
  serverFind,
  channelFind,
  messageFind,
  messageUpdate,
} = vi.hoisted(() => ({
  currentProfilePages: vi.fn(),
  serverFind: vi.fn(),
  channelFind: vi.fn(),
  messageFind: vi.fn(),
  messageUpdate: vi.fn(),
}));

vi.mock("@/lib/current-profile-pages", () => ({ currentProfilePages }));
vi.mock("@/lib/db", () => ({
  db: {
    server: { findFirst: serverFind },
    channel: { findFirst: channelFind },
    message: { findFirst: messageFind, update: messageUpdate },
  },
}));

import handler from "@/pages/api/socket/messages/[messageId]";
import { MemberRole } from "@/lib/prisma";
import { createPagesApiResponse, profile } from "../../../helpers/http";

function req(partial: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "DELETE",
    body: { content: "edited" },
    query: { messageId: "msg-1", serverId: "s1", channelId: "c1" },
    ...partial,
  } as NextApiRequest;
}

const member = {
  id: "mem-1",
  profileId: profile.id,
  role: MemberRole.GUEST,
};

describe("/api/socket/messages/[messageId]", () => {
  beforeEach(() => {
    currentProfilePages.mockReset();
    serverFind.mockReset();
    channelFind.mockReset();
    messageFind.mockReset();
    messageUpdate.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects unsupported methods", async () => {
    const { res } = createPagesApiResponse();
    await handler(req({ method: "GET" }), res as never);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 401 without a profile", async () => {
    currentProfilePages.mockResolvedValue(null);
    const { res } = createPagesApiResponse();
    await handler(req(), res as never);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("soft-deletes a message the member owns", async () => {
    currentProfilePages.mockResolvedValue(profile);
    serverFind.mockResolvedValue({ id: "s1", members: [member] });
    channelFind.mockResolvedValue({ id: "c1" });
    messageFind.mockResolvedValue({
      id: "msg-1",
      memberId: member.id,
      deleted: false,
    });
    messageUpdate.mockResolvedValue({
      id: "msg-1",
      deleted: true,
      content: "This message has been deleted",
    });

    const { res, emit } = createPagesApiResponse();
    await handler(req(), res as never);

    expect(messageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          fileUrl: null,
          content: "This message has been deleted",
          deleted: true,
        },
      }),
    );
    expect(emit).toHaveBeenCalledWith(
      "chat:c1:messages:update",
      expect.objectContaining({ deleted: true }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("lets an admin delete someone else's message", async () => {
    currentProfilePages.mockResolvedValue(profile);
    serverFind.mockResolvedValue({
      id: "s1",
      members: [{ ...member, role: MemberRole.ADMIN }],
    });
    channelFind.mockResolvedValue({ id: "c1" });
    messageFind.mockResolvedValue({
      id: "msg-1",
      memberId: "other",
      deleted: false,
    });
    messageUpdate.mockResolvedValue({ id: "msg-1", deleted: true });

    const { res } = createPagesApiResponse();
    await handler(req(), res as never);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("blocks a guest from editing someone else's message", async () => {
    currentProfilePages.mockResolvedValue(profile);
    serverFind.mockResolvedValue({ id: "s1", members: [member] });
    channelFind.mockResolvedValue({ id: "c1" });
    messageFind.mockResolvedValue({
      id: "msg-1",
      memberId: "other",
      deleted: false,
    });

    const { res } = createPagesApiResponse();
    await handler(req({ method: "PATCH" }), res as never);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(messageUpdate).not.toHaveBeenCalled();
  });

  it("lets the owner patch content", async () => {
    currentProfilePages.mockResolvedValue(profile);
    serverFind.mockResolvedValue({ id: "s1", members: [member] });
    channelFind.mockResolvedValue({ id: "c1" });
    messageFind.mockResolvedValue({
      id: "msg-1",
      memberId: member.id,
      deleted: false,
    });
    messageUpdate.mockResolvedValue({ id: "msg-1", content: "edited" });

    const { res } = createPagesApiResponse();
    await handler(req({ method: "PATCH" }), res as never);
    expect(messageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { content: "edited" } }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 for a deleted message", async () => {
    currentProfilePages.mockResolvedValue(profile);
    serverFind.mockResolvedValue({ id: "s1", members: [member] });
    channelFind.mockResolvedValue({ id: "c1" });
    messageFind.mockResolvedValue({ id: "msg-1", deleted: true });

    const { res } = createPagesApiResponse();
    await handler(req(), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
