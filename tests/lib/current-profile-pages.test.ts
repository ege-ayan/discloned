import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest } from "next";

const { getAuth, findUnique } = vi.hoisted(() => ({
  getAuth: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  getAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: { findUnique },
  },
}));

import { currentProfilePages } from "@/lib/current-profile-pages";
import { profile } from "../helpers/http";

const req = {} as NextApiRequest;

describe("currentProfilePages", () => {
  beforeEach(() => {
    getAuth.mockReset();
    findUnique.mockReset();
  });

  it("returns null when Pages Router auth has no user", async () => {
    getAuth.mockReturnValue({ userId: null });

    await expect(currentProfilePages(req)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("looks up the profile for the request user", async () => {
    getAuth.mockReturnValue({ userId: "user-1" });
    findUnique.mockResolvedValue(profile);

    await expect(currentProfilePages(req)).resolves.toEqual(profile);
    expect(getAuth).toHaveBeenCalledWith(req);
    expect(findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });
});
