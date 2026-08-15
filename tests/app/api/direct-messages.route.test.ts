import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentProfile, findMany } = vi.hoisted(() => ({
  currentProfile: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { directMessage: { findMany } },
}));

import { GET } from "@/app/api/direct-messages/route";
import { jsonRequest, profile } from "../../helpers/http";

const item = (id: string) => ({ id, content: id });

describe("GET /api/direct-messages", () => {
  beforeEach(() => {
    currentProfile.mockReset();
    findMany.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns 401 without a profile", async () => {
    currentProfile.mockResolvedValue(null);
    const res = await GET(
      jsonRequest("http://localhost/api/direct-messages?conversationId=d1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 without a conversation id", async () => {
    currentProfile.mockResolvedValue(profile);
    const res = await GET(jsonRequest("http://localhost/api/direct-messages"));
    expect(res.status).toBe(400);
  });

  it("returns the first page without a next cursor", async () => {
    currentProfile.mockResolvedValue(profile);
    findMany.mockResolvedValue([item("dm1")]);

    const res = await GET(
      jsonRequest("http://localhost/api/direct-messages?conversationId=d1"),
    );
    const body = await res.json();

    expect(body).toEqual({ items: [item("dm1")], nextCursor: null });
  });

  it("pages with a cursor", async () => {
    currentProfile.mockResolvedValue(profile);
    const items = Array.from({ length: 10 }, (_, i) => item(`dm${i}`));
    findMany.mockResolvedValue(items);

    const res = await GET(
      jsonRequest(
        "http://localhost/api/direct-messages?conversationId=d1&cursor=dm0",
      ),
    );
    const body = await res.json();

    expect(body.nextCursor).toBe("dm9");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        cursor: { id: "dm0" },
        where: { conversationId: "d1" },
      }),
    );
  });

  it("returns 500 on database errors", async () => {
    currentProfile.mockResolvedValue(profile);
    findMany.mockRejectedValue(new Error("db"));
    const res = await GET(
      jsonRequest("http://localhost/api/direct-messages?conversationId=d1"),
    );
    expect(res.status).toBe(500);
  });
});
