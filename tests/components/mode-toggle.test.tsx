import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn() }),
}));

import { ModeToggle } from "@/components/mode-toggle";

describe("ModeToggle", () => {
  it("exposes a theme toggle", () => {
    render(<ModeToggle />);
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });
});
