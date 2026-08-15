import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, update } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { update } },
}));

import { DELETE, PATCH } from "@/app/api/channels/[channelId]/route";
import { ChannelType, MemberRole } from "@/lib/prisma";
import { jsonRequest, profile } from "../../helpers/http";

const params = Promise.resolve({ channelId: "ch1" });

describe("/api/channels/[channelId]", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    update.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("DELETE returns 401 / 400 for missing auth and ids", async () => {
    currentProfile.mockResolvedValue(null);
    const unauthorized = await DELETE(
      jsonRequest("http://localhost/api/channels/ch1?serverId=s1"),
      { params },
    );
    expect(unauthorized.status).toBe(401);

    currentProfile.mockResolvedValue(profile);
    const noServer = await DELETE(
      jsonRequest("http://localhost/api/channels/ch1"),
      { params },
    );
    const noChannel = await DELETE(
      jsonRequest("http://localhost/api/channels/?serverId=s1"),
      { params: Promise.resolve({ channelId: "" }) },
    );
    expect(noServer.status).toBe(400);
    expect(noChannel.status).toBe(400);
  });

  it("DELETE removes a non-general channel", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1" });

    const res = await DELETE(
      jsonRequest("http://localhost/api/channels/ch1?serverId=s1"),
      { params },
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: {
        id: "s1",
        members: {
          some: {
            profileId: profile.id,
            role: { in: [MemberRole.ADMIN, MemberRole.MODERATOR] },
          },
        },
      },
      data: {
        channels: {
          delete: { id: "ch1", name: { not: "general" } },
        },
      },
    });
  });

  it("PATCH rejects renaming to general", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await PATCH(
      jsonRequest("http://localhost/api/channels/ch1?serverId=s1", {
        method: "PATCH",
        json: { name: "general", type: ChannelType.TEXT },
      }),
      { params },
    );
    expect(res.status).toBe(400);
  });

  it("PATCH updates a non-general channel", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1" });

    const res = await PATCH(
      jsonRequest("http://localhost/api/channels/ch1?serverId=s1", {
        method: "PATCH",
        json: { name: "voice", type: ChannelType.AUDIO },
      }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          channels: {
            update: {
              where: { id: "ch1", NOT: { name: "general" } },
              data: { name: "voice", type: ChannelType.AUDIO },
            },
          },
        },
      }),
    );
  });

  it("returns 500 on database errors", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockRejectedValue(new Error("db"));

    const del = await DELETE(
      jsonRequest("http://localhost/api/channels/ch1?serverId=s1"),
      { params },
    );
    const patch = await PATCH(
      jsonRequest("http://localhost/api/channels/ch1?serverId=s1", {
        method: "PATCH",
        json: { name: "voice", type: ChannelType.AUDIO },
      }),
      { params },
    );

    expect(del.status).toBe(500);
    expect(patch.status).toBe(500);
  });
});
