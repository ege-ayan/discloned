import { describe, expect, it } from "vitest";

import { ChannelType, MemberRole } from "@/lib/prisma";

describe("schema enums", () => {
  it("exposes Discord-like member roles", () => {
    expect(MemberRole).toEqual({
      ADMIN: "ADMIN",
      MODERATOR: "MODERATOR",
      GUEST: "GUEST",
    });
  });

  it("exposes channel types", () => {
    expect(ChannelType).toEqual({
      VIDEO: "VIDEO",
      AUDIO: "AUDIO",
      TEXT: "TEXT",
    });
  });

  it("keeps role values stable for authorization checks", () => {
    expect(Object.values(MemberRole)).toEqual(["ADMIN", "MODERATOR", "GUEST"]);
    expect(MemberRole.ADMIN).not.toBe(MemberRole.GUEST);
  });

  it("keeps channel type values stable for UI maps", () => {
    expect(new Set(Object.values(ChannelType))).toEqual(
      new Set(["VIDEO", "AUDIO", "TEXT"]),
    );
  });
});
