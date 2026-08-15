import { beforeEach, describe, expect, it, vi } from "vitest";

const { protect, initialProfile, findFirst, redirect } = vi.hoisted(() => ({
  protect: vi.fn(),
  initialProfile: vi.fn(),
  findFirst: vi.fn(),
  redirect: vi.fn((href: string) => `REDIRECT:${href}`),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: { protect },
}));

vi.mock("@/lib/initial-profile", () => ({
  initialProfile,
}));

vi.mock("@/lib/db", () => ({
  db: { server: { findFirst } },
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/components/modals/initial-modal", () => ({
  InitialModal: () => "initial-modal",
}));

import SetupPage from "@/app/(setup)/page";
import { profile } from "../helpers/http";

describe("SetupPage", () => {
  beforeEach(() => {
    protect.mockResolvedValue(undefined);
    initialProfile.mockReset();
    findFirst.mockReset();
    redirect.mockClear();
  });

  it("protects the route and redirects to an existing server", async () => {
    initialProfile.mockResolvedValue(profile);
    findFirst.mockResolvedValue({ id: "s1" });

    const result = await SetupPage();

    expect(protect).toHaveBeenCalledOnce();
    expect(findFirst).toHaveBeenCalledWith({
      where: { members: { some: { profileId: profile.id } } },
    });
    expect(result).toBe("REDIRECT:/servers/s1");
  });

  it("renders the create-server modal when the user has no server", async () => {
    initialProfile.mockResolvedValue(profile);
    findFirst.mockResolvedValue(null);

    const result = await SetupPage();
    expect(result).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});
