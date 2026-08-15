import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, update } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { update } },
}));
vi.mock("uuid", () => ({
  v4: () => "new-invite",
}));

import { PATCH } from "@/app/api/servers/[serverId]/invite-code/route";
import { jsonRequest, profile } from "../../helpers/http";

describe("PATCH /api/servers/[serverId]/invite-code", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    update.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await PATCH(jsonRequest("http://localhost/api/servers/s1"), {
      params: Promise.resolve({ serverId: "s1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 without a server id", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await PATCH(jsonRequest("http://localhost/api/servers/"), {
      params: Promise.resolve({ serverId: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("rotates the invite code", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1", inviteCode: "new-invite" });

    const res = await PATCH(jsonRequest("http://localhost/api/servers/s1"), {
      params: Promise.resolve({ serverId: "s1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.inviteCode).toBe("new-invite");
    expect(update).toHaveBeenCalledWith({
      where: { id: "s1", profileId: profile.id },
      data: { inviteCode: "new-invite" },
    });
  });

  it("returns 500 on database errors", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockRejectedValue(new Error("db"));
    const res = await PATCH(jsonRequest("http://localhost/api/servers/s1"), {
      params: Promise.resolve({ serverId: "s1" }),
    });
    expect(res.status).toBe(500);
  });
});
