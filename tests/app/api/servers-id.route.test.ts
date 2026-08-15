import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, update, remove } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { update, delete: remove } },
}));

import { DELETE, PATCH } from "@/app/api/servers/[serverId]/route";
import { jsonRequest, profile } from "../../helpers/http";

const params = Promise.resolve({ serverId: "s1" });

describe("/api/servers/[serverId]", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    update.mockReset();
    remove.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("PATCH returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await PATCH(
      jsonRequest("http://localhost/api/servers/s1", {
        method: "PATCH",
        json: { name: "New", imageUrl: "https://img" },
      }),
      { params },
    );
    expect(res.status).toBe(401);
  });

  it("PATCH updates the owned server", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockResolvedValue({ id: "s1", name: "New" });

    const res = await PATCH(
      jsonRequest("http://localhost/api/servers/s1", {
        method: "PATCH",
        json: { name: "New", imageUrl: "https://img" },
      }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: "s1", profileId: profile.id },
      data: { name: "New", imageUrl: "https://img" },
    });
  });

  it("DELETE removes the owned server", async () => {
    currentProfile.mockResolvedValue(profile);
    remove.mockResolvedValue({ id: "s1" });

    const res = await DELETE(
      jsonRequest("http://localhost/api/servers/s1", { method: "DELETE" }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(remove).toHaveBeenCalledWith({
      where: { id: "s1", profileId: profile.id },
    });
  });

  it("DELETE returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await DELETE(
      jsonRequest("http://localhost/api/servers/s1", { method: "DELETE" }),
      { params },
    );
    expect(res.status).toBe(401);
  });

  it("returns 500 when the database throws", async () => {
    currentProfile.mockResolvedValue(profile);
    update.mockRejectedValue(new Error("db"));
    remove.mockRejectedValue(new Error("db"));

    const patch = await PATCH(
      jsonRequest("http://localhost/api/servers/s1", {
        method: "PATCH",
        json: { name: "New", imageUrl: "https://img" },
      }),
      { params },
    );
    const del = await DELETE(
      jsonRequest("http://localhost/api/servers/s1", { method: "DELETE" }),
      { params },
    );

    expect(patch.status).toBe(500);
    expect(del.status).toBe(500);
  });
});
