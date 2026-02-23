import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessage, onMessage } from "../../src/lib/messaging/bridge";
import type { Message, PageContentData, SummaryData } from "../../src/lib/messaging/types";

const mockSendMessage = vi.fn();
const mockAddListener = vi.fn();

globalThis.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
    onMessage: { addListener: mockAddListener },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
} as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendMessage", () => {
  it("calls chrome.runtime.sendMessage with the message", async () => {
    mockSendMessage.mockResolvedValue(undefined);
    const msg: Message = { type: "OPEN_SIDE_PANEL" };
    await sendMessage(msg);
    expect(mockSendMessage).toHaveBeenCalledWith(msg);
  });

  it("returns the response from chrome.runtime.sendMessage", async () => {
    const pageContent: PageContentData = {
      url: "https://example.com",
      title: "Test",
      text: "Content",
      readingTimeMinutes: 1,
    };
    mockSendMessage.mockResolvedValue(pageContent);
    const msg: Message = { type: "GET_PAGE_CONTENT", tabId: 1 };
    const result = await sendMessage(msg);
    expect(result).toEqual(pageContent);
  });

  it("returns null when cached summary is not found", async () => {
    mockSendMessage.mockResolvedValue(null);
    const msg: Message = {
      type: "GET_CACHED_SUMMARY",
      url: "https://example.com",
    };
    const result = await sendMessage(msg);
    expect(result).toBeNull();
  });

  it("returns SummaryData when cache hit", async () => {
    const summary: SummaryData = {
      summary: "Test summary",
      keyPoints: ["k1", "k2", "k3"],
      techLevel: "beginner",
      readingTimeMinutes: 2,
      timestamp: 123456,
    };
    mockSendMessage.mockResolvedValue(summary);
    const msg: Message = {
      type: "GET_CACHED_SUMMARY",
      url: "https://example.com",
    };
    const result = await sendMessage(msg);
    expect(result).toEqual(summary);
  });

  it("passes OPEN_SIDE_PANEL message without tabId", async () => {
    mockSendMessage.mockResolvedValue(undefined);
    const msg: Message = { type: "OPEN_SIDE_PANEL" };
    await sendMessage(msg);
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "OPEN_SIDE_PANEL" })
    );
  });

  it("passes OPEN_SIDE_PANEL message with optional tabId", async () => {
    mockSendMessage.mockResolvedValue(undefined);
    const msg: Message = { type: "OPEN_SIDE_PANEL", tabId: 7 };
    await sendMessage(msg);
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "OPEN_SIDE_PANEL", tabId: 7 })
    );
  });
});

describe("onMessage", () => {
  it("registers a listener with chrome.runtime.onMessage.addListener", () => {
    const handler = vi.fn();
    onMessage(handler);
    expect(mockAddListener).toHaveBeenCalledTimes(1);
  });

  it("calls the handler when a message arrives", () => {
    const handler = vi.fn();
    onMessage(handler);

    // Simulate chrome calling the registered listener
    const registeredListener = mockAddListener.mock.calls[0][0];
    const fakeMsg: Message = { type: "GET_PAGE_CONTENT", tabId: 1 };
    const fakeSender = { tab: { id: 1 } };
    const fakeSendResponse = vi.fn();
    registeredListener(fakeMsg, fakeSender, fakeSendResponse);

    expect(handler).toHaveBeenCalledWith(fakeMsg, fakeSender, fakeSendResponse);
  });

  it("forwards sendResponse to the handler", () => {
    const handler = vi.fn();
    onMessage(handler);

    const registeredListener = mockAddListener.mock.calls[0][0];
    const fakeMsg: Message = { type: "GET_PAGE_CONTENT", tabId: 1 };
    const fakeSendResponse = vi.fn();
    registeredListener(fakeMsg, {}, fakeSendResponse);

    // The third argument the handler received must be the same sendResponse
    // function that chrome passed to the listener.
    const receivedSendResponse = handler.mock.calls[0][2];
    expect(receivedSendResponse).toBe(fakeSendResponse);
  });

  it("passes the correct message type to the handler", () => {
    const handler = vi.fn();
    onMessage(handler);

    const registeredListener = mockAddListener.mock.calls[0][0];
    const msg: Message = {
      type: "GET_CACHED_SUMMARY",
      url: "https://example.com",
    };
    const fakeSendResponse = vi.fn();
    registeredListener(msg, {}, fakeSendResponse);

    expect(handler).toHaveBeenCalledWith(msg, {}, fakeSendResponse);
  });

  it("propagates true returned by the handler to keep the channel open", () => {
    // A handler that returns true signals an async response is coming.
    const asyncHandler = vi.fn().mockReturnValue(true);
    onMessage(asyncHandler);

    const registeredListener = mockAddListener.mock.calls[0][0];
    const fakeMsg: Message = { type: "GET_PAGE_CONTENT", tabId: 1 };
    const returnValue = registeredListener(fakeMsg, {}, vi.fn());

    expect(returnValue).toBe(true);
  });

  it("propagates void/undefined returned by a sync handler", () => {
    // A sync handler that returns nothing (void).
    const syncHandler = vi.fn().mockReturnValue(undefined);
    onMessage(syncHandler);

    const registeredListener = mockAddListener.mock.calls[0][0];
    const fakeMsg: Message = { type: "OPEN_SIDE_PANEL" };
    const returnValue = registeredListener(fakeMsg, {}, vi.fn());

    // undefined (falsy) tells chrome the channel can be closed immediately.
    expect(returnValue).toBeUndefined();
  });

  it("can register multiple handlers independently", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    onMessage(handler1);
    onMessage(handler2);
    expect(mockAddListener).toHaveBeenCalledTimes(2);
  });
});
