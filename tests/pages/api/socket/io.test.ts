import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest } from "next";

const { ServerMock } = vi.hoisted(() => ({
  ServerMock: vi.fn(function Server() {
    return { id: "io" };
  }),
}));

vi.mock("socket.io", () => ({
  Server: ServerMock,
}));

import ioHandler, { config } from "@/pages/api/socket/io";

describe("socket.io bootstrap", () => {
  beforeEach(() => {
    ServerMock.mockClear();
  });

  it("disables the default body parser", () => {
    expect(config.api.bodyParser).toBe(false);
  });

  it("creates the Socket.IO server once", () => {
    const server: { io?: unknown } = {};
    const res = {
      socket: { server },
      end: vi.fn(),
    };

    ioHandler({} as NextApiRequest, res as never);
    ioHandler({} as NextApiRequest, res as never);

    expect(ServerMock).toHaveBeenCalledOnce();
    expect(ServerMock).toHaveBeenCalledWith(server, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
    expect(server.io).toEqual({ id: "io" });
    expect(res.end).toHaveBeenCalledTimes(2);
  });
});
