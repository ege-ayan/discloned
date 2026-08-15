import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, findMany } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { message: { findMany } },
}));

import { GET } from "@/app/api/messages/route";
import { jsonRequest, profile } from "../../helpers/http";

const item = (id: string) => ({ id, content: id });

describe("GET /api/messages", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    findMany.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await GET(
      jsonRequest("http://localhost/api/messages?channelId=c1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 without a channel id", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await GET(jsonRequest("http://localhost/api/messages"));
    expect(res.status).toBe(400);
  });

  it("returns the first page without a next cursor", async () => {
    currentProfile.mockResolvedValue(profile);
    findMany.mockResolvedValue([item("m1")]);

    const res = await GET(
      jsonRequest("http://localhost/api/messages?channelId=c1"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ items: [item("m1")], nextCursor: null });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        where: { channelId: "c1" },
      }),
    );
  });

  it("uses a cursor and exposes the next page", async () => {
    currentProfile.mockResolvedValue(profile);
    const items = Array.from({ length: 10 }, (_, i) => item(`m${i}`));
    findMany.mockResolvedValue(items);

    const res = await GET(
      jsonRequest("http://localhost/api/messages?channelId=c1&cursor=m0"),
    );
    const body = await res.json();

    expect(body.nextCursor).toBe("m9");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 1,
        cursor: { id: "m0" },
      }),
    );
  });

  it("returns 500 on database errors", async () => {
    currentProfile.mockResolvedValue(profile);
    findMany.mockRejectedValue(new Error("db"));
    const res = await GET(
      jsonRequest("http://localhost/api/messages?channelId=c1"),
    );
    expect(res.status).toBe(500);
  });
});
