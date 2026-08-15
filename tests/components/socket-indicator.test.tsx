import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/providers/socket-provider", () => ({
  useSocket: vi.fn(),
}));

import { useSocket } from "@/components/providers/socket-provider";
import { SocketIndicator } from "@/components/socket-indicator";

describe("SocketIndicator", () => {
  it("shows the polling fallback when disconnected", () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: false,
    });

    render(<SocketIndicator />);
    expect(screen.getByText("Fallback: Polling every 1s")).toBeInTheDocument();
  });

  it("shows the live badge when connected", () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: true,
    });

    render(<SocketIndicator />);
    expect(screen.getByText("Live: Real-time updates")).toBeInTheDocument();
  });
});
