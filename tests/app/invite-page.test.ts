import { beforeEach, describe, expect, it, vi } from "vitest";

const { protect, auth, currentProfile, findFirst, update, redirect } =
  vi.hoisted(() => ({
    protect: vi.fn(),
    auth: vi.fn(),
    currentProfile: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    redirect: vi.fn((href: string) => `REDIRECT:${href}`),
  }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: Object.assign(auth, { protect }),
}));

vi.mock("@/lib/current-profile", () => ({ currentProfile }));
vi.mock("@/lib/db", () => ({
  db: { server: { findFirst, update } },
}));
vi.mock("next/navigation", () => ({
  redirect,
}));

import InviteCodePage from "@/app/(invite)/(routes)/invite/[inviteCode]/page";
import { profile } from "../helpers/http";

describe("InviteCodePage", () => {
  const redirectToSignIn = vi.fn(() => "SIGN_IN");

  beforeEach(() => {
    protect.mockResolvedValue(undefined);
    auth.mockResolvedValue({ redirectToSignIn });
    currentProfile.mockReset();
    findFirst.mockReset();
    update.mockReset();
    redirect.mockClear();
    redirectToSignIn.mockClear();
  });

  it("sends unsigned-in users to Clerk", async () => {
    currentProfile.mockResolvedValue(null);
    const result = await InviteCodePage({
      params: Promise.resolve({ inviteCode: "abc" }),
    });
    expect(protect).toHaveBeenCalledOnce();
    expect(result).toBe("SIGN_IN");
  });

  it("redirects home when the invite code is missing", async () => {
    currentProfile.mockResolvedValue(profile);
    await InviteCodePage({
      params: Promise.resolve({ inviteCode: "" }),
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects members who already joined", async () => {
    currentProfile.mockResolvedValue(profile);
    findFirst.mockResolvedValue({ id: "s1" });

    const result = await InviteCodePage({
      params: Promise.resolve({ inviteCode: "abc" }),
    });

    expect(result).toBe("REDIRECT:/servers/s1");
    expect(update).not.toHaveBeenCalled();
  });

  it("joins the server and redirects", async () => {
    currentProfile.mockResolvedValue(profile);
    findFirst.mockResolvedValue(null);
    update.mockResolvedValue({ id: "s2" });

    const result = await InviteCodePage({
      params: Promise.resolve({ inviteCode: "abc" }),
    });

    expect(update).toHaveBeenCalledWith({
      where: { inviteCode: "abc" },
      data: { members: { create: [{ profileId: profile.id }] } },
    });
    expect(result).toBe("REDIRECT:/servers/s2");
  });
});
