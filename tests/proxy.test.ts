import { describe, expect, it } from "vitest";

import proxy, { config } from "@/proxy";

describe("proxy", () => {
  it("exports Clerk middleware without route matchers", () => {
    expect(typeof proxy).toBe("function");
  });

  it("matches app and API routes while skipping static assets", () => {
    expect(config.matcher).toHaveLength(2);
    expect(config.matcher[0]).toContain("_next");
    expect(config.matcher[1]).toBe("/(api|trpc)(.*)");
  });
});
