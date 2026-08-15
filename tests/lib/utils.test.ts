import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    expect(cn("px-2 py-1", "px-4", false && "hidden", "text-sm")).toBe(
      "py-1 px-4 text-sm",
    );
  });

  it("handles conditional classes", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("returns an empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("drops falsey class flags", () => {
    expect(cn("keep", false, 0, "", "ok")).toBe("keep ok");
  });

  it("merges conflicting background utilities", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("accepts object syntax", () => {
    expect(cn({ hidden: true, block: false, "text-sm": true })).toBe(
      "hidden text-sm",
    );
  });
});
