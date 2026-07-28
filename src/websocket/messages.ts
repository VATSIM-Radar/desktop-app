export type Bookmark = string;

export interface GetBookmarksMessage {
  type: "get-bookmarks";
}

export interface BookmarksMessage {
  type: "bookmarks";
  data: {
    bookmarks: Bookmark[];
  };
}

export type WebsocketMessage = GetBookmarksMessage | BookmarksMessage;

export function isGetBookmarksMessage(
  message: WebsocketMessage,
): message is GetBookmarksMessage {
  return message && message.type === "get-bookmarks";
}

export function isBookmarksMessage(
  message: WebsocketMessage,
): message is BookmarksMessage {
  return message && message.type === "bookmarks";
}
