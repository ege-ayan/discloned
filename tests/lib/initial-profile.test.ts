import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, currentUser, findUnique, create } = vi.hoisted(() => ({
  authMock: vi.fn(),
  currentUser: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: { findUnique, create },
  },
}));

import { initialProfile } from "@/lib/initial-profile";
import { profile } from "../helpers/http";

describe("initialProfile", () => {
  const redirectToSignIn = vi.fn(() => "SIGN_IN");

  beforeEach(() => {
    authMock.mockReset();
    currentUser.mockReset();
    findUnique.mockReset();
    create.mockReset();
    redirectToSignIn.mockClear();
    authMock.mockResolvedValue({ redirectToSignIn });
  });

  it("redirects to sign-in when Clerk has no user", async () => {
    currentUser.mockResolvedValue(null);

    await expect(initialProfile()).resolves.toBe("SIGN_IN");
    expect(redirectToSignIn).toHaveBeenCalledOnce();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns an existing profile", async () => {
    currentUser.mockResolvedValue({
      id: "user-1",
      firstName: "Ege",
      imageUrl: profile.imageUrl,
      emailAddresses: [{ emailAddress: profile.email }],
    });
    findUnique.mockResolvedValue(profile);

    await expect(initialProfile()).resolves.toEqual(profile);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a profile from Clerk user fields", async () => {
    currentUser.mockResolvedValue({
      id: "user-1",
      firstName: "Ege",
      imageUrl: profile.imageUrl,
      emailAddresses: [{ emailAddress: profile.email }],
    });
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(profile);

    await expect(initialProfile()).resolves.toEqual(profile);
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "Ege",
        imageUrl: profile.imageUrl,
        email: profile.email,
      },
    });
  });
});
