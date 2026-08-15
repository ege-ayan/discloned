import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig from "@/next.config";

describe("nextConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows UploadThing images", () => {
    expect(nextConfig.images?.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
    ]);
  });

  it("externalizes the Prisma pg adapter", () => {
    expect(nextConfig.serverExternalPackages).toEqual([
      "pg",
      "@prisma/adapter-pg",
    ]);
  });

  it("skips security headers outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    await expect(nextConfig.headers?.()).resolves.toEqual([]);
  });

  it("applies production security headers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const headers = await nextConfig.headers?.();

    expect(headers).toHaveLength(1);
    expect(headers?.[0].source).toBe("/(.*)");
    expect(headers?.[0].headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        }),
        expect.objectContaining({
          key: "X-Content-Type-Options",
          value: "nosniff",
        }),
        expect.objectContaining({
          key: "Content-Security-Policy",
          value: "upgrade-insecure-requests",
        }),
      ]),
    );
  });
});
