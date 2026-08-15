import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, update } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { update } },
}));

import { PATCH } from "@/app/api/servers/[serverId]/leave/route";
import { jsonRequest, profile } from "../../helpers/http";

describe("PATCH /api/servers/[serverId]/leave", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    update.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await PATCH(
      jsonRequest("http://localhost/api/servers/s1/leave"),
      {
        params: Promise.resolve({ serverId: "s1" }),
      },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 without a server id", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await PATCH(
      jsonRequest("http://localhost/api/servers//leave"),
      {
        params: Promise.resolve({ serverId: "" }),
      },
    );
    expect(res.status).toBe(400);
  });

  it("removes the member when they are not the owner", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1" });

    const res = await PATCH(
      jsonRequest("http://localhost/api/servers/s1/leave"),
      {
        params: Promise.resolve({ serverId: "s1" }),
      },
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: {
        id: "s1",
        profileId: { not: profile.id },
        members: { some: { profileId: profile.id } },
      },
      data: {
        members: { deleteMany: { profileId: profile.id } },
      },
    });
  });

  it("returns 500 on database errors", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockRejectedValue(new Error("db"));
    const res = await PATCH(
      jsonRequest("http://localhost/api/servers/s1/leave"),
      {
        params: Promise.resolve({ serverId: "s1" }),
      },
    );
    expect(res.status).toBe(500);
  });
});
