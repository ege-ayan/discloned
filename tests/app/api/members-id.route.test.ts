import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, update } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { update } },
}));

import { DELETE, PATCH } from "@/app/api/members/[memberId]/route";
import { MemberRole } from "@/lib/prisma";
import { jsonRequest, profile } from "../../helpers/http";

const params = Promise.resolve({ memberId: "m1" });

describe("/api/members/[memberId]", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    update.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("DELETE returns 401 / 400 for missing auth and ids", async () => {
    currentProfile.mockResolvedValue(null);
    expect(
      (
        await DELETE(
          jsonRequest("http://localhost/api/members/m1?serverId=s1"),
          { params },
        )
      ).status,
    ).toBe(401);

    currentProfile.mockResolvedValue(profile);
    expect(
      (await DELETE(jsonRequest("http://localhost/api/members/m1"), { params }))
        .status,
    ).toBe(400);
    expect(
      (
        await DELETE(jsonRequest("http://localhost/api/members/?serverId=s1"), {
          params: Promise.resolve({ memberId: "" }),
        })
      ).status,
    ).toBe(400);
  });

  it("DELETE kicks another member from an owned server", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1", members: [] });

    const res = await DELETE(
      jsonRequest("http://localhost/api/members/m1?serverId=s1"),
      { params },
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1", profileId: profile.id },
        data: {
          members: {
            deleteMany: {
              id: "m1",
              profileId: { not: profile.id },
            },
          },
        },
      }),
    );
  });

  it("PATCH requires a role", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await PATCH(
      jsonRequest("http://localhost/api/members/m1?serverId=s1", {
        method: "PATCH",
        json: {},
      }),
      { params },
    );
    expect(res.status).toBe(400);
  });

  it("PATCH updates another member's role", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1" });

    const res = await PATCH(
      jsonRequest("http://localhost/api/members/m1?serverId=s1", {
        method: "PATCH",
        json: { role: MemberRole.MODERATOR },
      }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          members: {
            update: {
              where: { id: "m1", profileId: { not: profile.id } },
              data: { role: MemberRole.MODERATOR },
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
      jsonRequest("http://localhost/api/members/m1?serverId=s1"),
      { params },
    );
    const patch = await PATCH(
      jsonRequest("http://localhost/api/members/m1?serverId=s1", {
        method: "PATCH",
        json: { role: MemberRole.GUEST },
      }),
      { params },
    );

    expect(del.status).toBe(500);
    expect(patch.status).toBe(500);
  });
});
