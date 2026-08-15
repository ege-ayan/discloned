import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-mounted", () => ({
  useMounted: vi.fn(),
}));

import { useMounted } from "@/hooks/use-mounted";
import { useOrigin } from "@/hooks/use-origin";

describe("useOrigin", () => {
  it("returns null before mount to avoid hydration mismatch", () => {
    vi.mocked(useMounted).mockReturnValue(false);
    const { result } = renderHook(() => useOrigin());
    expect(result.current).toBeNull();
  });

  it("returns window.location.origin after mount", () => {
    vi.mocked(useMounted).mockReturnValue(true);
    const { result } = renderHook(() => useOrigin());
    expect(result.current).toBe(window.location.origin);
  });
});
