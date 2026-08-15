import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UserAvatar } from "@/components/user-avatar";

describe("UserAvatar", () => {
  it("applies the default and extra avatar classes", () => {
    const { container } = render(
      <UserAvatar src="https://example.com/a.png" className="ring-2" />,
    );

    const avatar = container.firstElementChild;
    expect(avatar).toHaveClass("h-7", "w-7", "ring-2");
  });
});
