import { ChannelType } from "@/lib/prisma";
import { beforeEach, describe, expect, it } from "vitest";

import { useModal, type ModalType } from "@/hooks/use-modal-store";

const modalTypes: ModalType[] = [
  "createServer",
  "invite",
  "editServer",
  "members",
  "createChannel",
  "leaveServer",
  "deleteServer",
  "deleteChannel",
  "editChannel",
  "messageFile",
  "deleteMessage",
];

describe("useModal", () => {
  beforeEach(() => {
    useModal.setState({ type: null, data: {}, isOpen: false });
  });

  it("starts closed", () => {
    const state = useModal.getState();
    expect(state.isOpen).toBe(false);
    expect(state.type).toBeNull();
    expect(state.data).toEqual({});
  });

  it("opens with a type and payload", () => {
    useModal.getState().onOpen("createChannel", {
      channelType: ChannelType.AUDIO,
    });
    const state = useModal.getState();
    expect(state.isOpen).toBe(true);
    expect(state.type).toBe("createChannel");
    expect(state.data.channelType).toBe(ChannelType.AUDIO);
  });

  it("defaults data to an empty object", () => {
    useModal.getState().onOpen("invite");
    expect(useModal.getState().data).toEqual({});
  });

  it("replaces previous modal state on a later open", () => {
    useModal.getState().onOpen("invite", { apiUrl: "/old" });
    useModal.getState().onOpen("messageFile", {
      apiUrl: "/api/messages",
      query: { channelId: "c1" },
    });

    const state = useModal.getState();
    expect(state.type).toBe("messageFile");
    expect(state.data).toEqual({
      apiUrl: "/api/messages",
      query: { channelId: "c1" },
    });
  });

  it("closes and clears the type but keeps last data", () => {
    useModal.getState().onOpen("invite", { apiUrl: "/invite" });
    useModal.getState().onClose();
    const state = useModal.getState();
    expect(state.isOpen).toBe(false);
    expect(state.type).toBeNull();
    expect(state.data).toEqual({ apiUrl: "/invite" });
  });

  it.each(modalTypes)("can open the %s modal", (type) => {
    useModal.getState().onOpen(type);
    expect(useModal.getState().type).toBe(type);
    expect(useModal.getState().isOpen).toBe(true);
  });
});
