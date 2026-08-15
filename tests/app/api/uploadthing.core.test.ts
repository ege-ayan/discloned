import { describe, expect, it, vi } from "vitest";

vi.mock("uploadthing/next", () => ({
  createUploadthing: () => {
    const chain = {
      middleware: vi.fn().mockReturnThis(),
      onUploadComplete: vi.fn().mockReturnThis(),
    };
    const f = vi.fn(() => chain);
    return f;
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { ourFileRouter } from "@/app/api/uploadthing/core";

describe("uploadthing file router", () => {
  it("registers server image and message file endpoints", () => {
    expect(Object.keys(ourFileRouter)).toEqual(["serverImage", "messageFile"]);
  });
});
