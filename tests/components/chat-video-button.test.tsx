import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/servers/s1/channels/c1",
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

import { ChatVideoButton } from "@/components/chat/chat-video-button";

describe("ChatVideoButton", () => {
  it("starts a video call from the current path", async () => {
    render(<ChatVideoButton />);

    fireEvent.click(screen.getByRole("button"));
    expect(push).toHaveBeenCalledWith("/servers/s1/channels/c1?video=true");
  });
});
