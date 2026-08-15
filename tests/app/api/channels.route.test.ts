import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, update } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { update } },
}));

import { POST } from "@/app/api/channels/route";
import { ChannelType, MemberRole } from "@/lib/prisma";
import { jsonRequest, profile } from "../../helpers/http";

describe("POST /api/channels", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    update.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await POST(
      jsonRequest("http://localhost/api/channels?serverId=s1", {
        method: "POST",
        json: { name: "voice", type: ChannelType.AUDIO },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 without a server id", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await POST(
      jsonRequest("http://localhost/api/channels", {
        method: "POST",
        json: { name: "voice", type: ChannelType.AUDIO },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects the reserved general name", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await POST(
      jsonRequest("http://localhost/api/channels?serverId=s1", {
        method: "POST",
        json: { name: "general", type: ChannelType.TEXT },
      }),
    );
    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("creates a channel for admins and moderators", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1" });

    const res = await POST(
      jsonRequest("http://localhost/api/channels?serverId=s1", {
        method: "POST",
        json: { name: "voice", type: ChannelType.AUDIO },
      }),
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
          create: {
            profileId: profile.id,
            name: "voice",
            type: ChannelType.AUDIO,
          },
        },
      },
    });
  });

  it("returns 500 on database errors", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockRejectedValue(new Error("db"));
    const res = await POST(
      jsonRequest("http://localhost/api/channels?serverId=s1", {
        method: "POST",
        json: { name: "voice", type: ChannelType.AUDIO },
      }),
    );
    expect(res.status).toBe(500);
  });
});
