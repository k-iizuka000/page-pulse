import type { Message, MessageResponse } from "./types";

/**
 * Type-safe wrapper around chrome.runtime.sendMessage.
 * Returns the raw response value typed according to the message kind.
 */
export async function sendMessage<T extends Message>(
  message: T
): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message) as Promise<MessageResponse<T>>;
}

/**
 * Registers a handler for incoming messages via chrome.runtime.onMessage.
 *
 * The handler receives the typed Message union, the sender, and the
 * sendResponse callback. Returning `true` from the handler keeps the message
 * channel open so sendResponse can be called asynchronously — this is
 * required for any handler that responds after an await.
 */
export function onMessage(
  handler: (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | void
): void {
  chrome.runtime.onMessage.addListener(
    (
      message: Message,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ): boolean | void => {
      return handler(message, sender, sendResponse);
    }
  );
}
