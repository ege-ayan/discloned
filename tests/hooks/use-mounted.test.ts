import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMounted } from "@/hooks/use-mounted";

describe("useMounted", () => {
  it("is a client/server-safe hook export", () => {
    expect(typeof useMounted).toBe("function");
  });

  it("returns true after client hydration", () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });
});
