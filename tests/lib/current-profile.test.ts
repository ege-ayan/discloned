import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, findUnique } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: { findUnique },
  },
}));

import { currentProfile } from "@/lib/current-profile";
import { profile } from "../helpers/http";

describe("currentProfile", () => {
  beforeEach(() => {
    authMock.mockReset();
    findUnique.mockReset();
  });

  it("returns null when there is no Clerk user", async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(currentProfile()).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("looks up the profile by Clerk user id", async () => {
    authMock.mockResolvedValue({ userId: "user-1" });
    findUnique.mockResolvedValue(profile);

    await expect(currentProfile()).resolves.toEqual(profile);
    expect(findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("returns null when the signed-in user has no profile row", async () => {
    authMock.mockResolvedValue({ userId: "user-1" });
    findUnique.mockResolvedValue(null);

    await expect(currentProfile()).resolves.toBeNull();
  });
});
