export interface GetBookmarksMessage {
  type: "get-bookmarks";
}

export type WebsocketMessage = GetBookmarksMessage;

export function isGetBookmarksMessage(
  message: WebsocketMessage,
): message is GetBookmarksMessage {
  return message && message.type === "get-bookmarks";
}
