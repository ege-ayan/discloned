import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatWelcome } from "@/components/chat/chat-welcome";

describe("ChatWelcome", () => {
  it("welcomes the user to a channel", () => {
    render(<ChatWelcome name="general" type="channel" />);

    expect(screen.getByText(/Welcome to #/)).toBeInTheDocument();
    expect(
      screen.getByText("This is the start of the #general channel."),
    ).toBeInTheDocument();
  });

  it("welcomes the user to a conversation", () => {
    render(<ChatWelcome name="Ada" type="conversation" />);

    expect(screen.queryByText(/Welcome to #/)).not.toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(
      screen.getByText("This is the start of your conversatin with Ada"),
    ).toBeInTheDocument();
  });
});
