import { vi } from "vitest";

export function jsonRequest(
  url: string,
  init?: RequestInit & { json?: unknown },
) {
  const { json, headers, ...rest } = init ?? {};
  return new Request(url, {
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: json === undefined ? rest.body : JSON.stringify(json),
    ...rest,
  });
}

export function createPagesApiResponse() {
  const emit = vi.fn();
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn(),
    socket: {
      server: {
        io: { emit },
      },
    },
  };

  return { res, emit };
}

export const profile = {
  id: "profile-1",
  userId: "user-1",
  name: "Ege",
  imageUrl: "https://example.com/a.png",
  email: "ege@example.com",
};
