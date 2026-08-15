import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { protect, addGrant, toJwt } = vi.hoisted(() => ({
  protect: vi.fn(),
  addGrant: vi.fn(),
  toJwt: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: { protect },
}));

vi.mock("livekit-server-sdk", () => ({
  AccessToken: class {
    addGrant = addGrant;
    toJwt = toJwt;
  },
}));

import { GET } from "@/app/api/livekit/route";

function request(query: string) {
  return new NextRequest(`http://localhost/api/livekit${query}`);
}

describe("GET /api/livekit", () => {
  beforeEach(() => {
    protect.mockClear();
    protect.mockResolvedValue(undefined);
    addGrant.mockReset();
    toJwt.mockReset();
    vi.stubEnv("LIVEKIT_API_KEY", "key");
    vi.stubEnv("LIVEKIT_API_SECRET", "secret");
    vi.stubEnv("NEXT_PUBLIC_LIVEKIT_URL", "wss://livekit.local");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires a room", async () => {
    const res = await GET(request("?username=ege"));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/room/);
  });

  it("requires a username", async () => {
    const res = await GET(request("?room=lobby"));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/username/);
  });

  it("returns 500 when LiveKit env is missing", async () => {
    vi.stubEnv("LIVEKIT_API_KEY", "");
    const res = await GET(request("?room=lobby&username=ege"));
    expect(res.status).toBe(500);
  });

  it("issues a room token", async () => {
    toJwt.mockResolvedValue("signed-jwt");
    const res = await GET(request("?room=lobby&username=ege"));
    const body = await res.json();

    expect(protect).toHaveBeenCalledOnce();
    expect(addGrant).toHaveBeenCalledWith({
      room: "lobby",
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    expect(res.status).toBe(200);
    expect(body).toEqual({ token: "signed-jwt" });
  });
});
