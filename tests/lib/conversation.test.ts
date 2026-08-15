import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, create } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    conversation: {
      findFirst,
      create,
    },
  },
}));

import { getOrCreateConversation } from "@/lib/conversation";

describe("getOrCreateConversation", () => {
  beforeEach(() => {
    findFirst.mockReset();
    create.mockReset();
  });

  it("returns an existing conversation in the given member order", async () => {
    const existing = { id: "c1", memberOneId: "a", memberTwoId: "b" };
    findFirst.mockResolvedValueOnce(existing);

    await expect(getOrCreateConversation("a", "b")).resolves.toEqual(existing);
    expect(findFirst).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
  });

  it("falls back to the reversed member order", async () => {
    const existing = { id: "c1", memberOneId: "b", memberTwoId: "a" };
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);

    await expect(getOrCreateConversation("a", "b")).resolves.toEqual(existing);
    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a conversation when none exists", async () => {
    const created = { id: "c2", memberOneId: "a", memberTwoId: "b" };
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    create.mockResolvedValueOnce(created);

    await expect(getOrCreateConversation("a", "b")).resolves.toEqual(created);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { memberOneId: "a", memberTwoId: "b" },
      }),
    );
  });

  it("treats a thrown find as a miss and still creates", async () => {
    const created = { id: "c3", memberOneId: "a", memberTwoId: "b" };
    findFirst
      .mockRejectedValueOnce(new Error("db"))
      .mockRejectedValueOnce(new Error("db"));
    create.mockResolvedValueOnce(created);

    await expect(getOrCreateConversation("a", "b")).resolves.toEqual(created);
  });

  it("returns null when create fails", async () => {
    findFirst.mockResolvedValue(null);
    create.mockRejectedValueOnce(new Error("unique"));

    await expect(getOrCreateConversation("a", "b")).resolves.toBeNull();
  });

  it("includes member profiles on lookup", async () => {
    findFirst.mockResolvedValueOnce({ id: "c1" });
    await getOrCreateConversation("one", "two");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ memberOneId: "one" }, { memberTwoId: "two" }],
        },
        include: {
          memberOne: { include: { profile: true } },
          memberTwo: { include: { profile: true } },
        },
      }),
    );
  });
});
