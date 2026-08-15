import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, create } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { create } },
}));
vi.mock("uuid", () => ({
  v4: () => "invite-uuid",
}));

import { POST } from "@/app/api/servers/route";
import { MemberRole } from "@/lib/prisma";
import { jsonRequest, profile } from "../../helpers/http";

describe("POST /api/servers", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    create.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await POST(
      jsonRequest("http://localhost/api/servers", {
        method: "POST",
        json: { name: "Guild", imageUrl: "https://img" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a server with a general channel and admin member", async () => {
    currentProfile.mockResolvedValue(profile);
    create.mockResolvedValue({ id: "s1", name: "Guild" });

    const res = await POST(
      jsonRequest("http://localhost/api/servers", {
        method: "POST",
        json: { name: "Guild", imageUrl: "https://img" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ id: "s1", name: "Guild" });
    expect(create).toHaveBeenCalledWith({
      data: {
        profileId: profile.id,
        name: "Guild",
        imageUrl: "https://img",
        inviteCode: "invite-uuid",
        channels: {
          create: [{ name: "general", profileId: profile.id }],
        },
        members: {
          create: [{ profileId: profile.id, role: MemberRole.ADMIN }],
        },
      },
    });
  });

  it("returns 500 when create throws", async () => {
    currentProfile.mockResolvedValue(profile);
    create.mockRejectedValue(new Error("db"));

    const res = await POST(
      jsonRequest("http://localhost/api/servers", {
        method: "POST",
        json: { name: "Guild", imageUrl: "https://img" },
      }),
    );
    expect(res.status).toBe(500);
  });
});
