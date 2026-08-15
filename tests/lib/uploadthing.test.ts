import { describe, expect, it, vi } from "vitest";

vi.mock("@uploadthing/react", () => ({
  generateUploadButton: vi.fn(() => "UploadButton"),
  generateUploadDropzone: vi.fn(() => "UploadDropzone"),
}));

import { UploadButton, UploadDropzone } from "@/lib/uploadthing";

describe("uploadthing helpers", () => {
  it("exports generated upload components", () => {
    expect(UploadButton).toBe("UploadButton");
    expect(UploadDropzone).toBe("UploadDropzone");
  });
});
