export interface Bookmark {
  label: string;
  value: string;
  order: number;
}

export interface GetBookmarksMessage {
  type: "get-bookmarks";
}

export interface ActivateBookmarkMessage {
  type: "activate-bookmark";
  data: {
    id: number;
  };
}

export interface BookmarksMessage {
  type: "bookmarks";
  data: {
    bookmarks: Bookmark[];
  };
}

export type WebsocketMessage =
  GetBookmarksMessage | BookmarksMessage | ActivateBookmarkMessage;

export function isGetBookmarksMessage(
  message: WebsocketMessage,
): message is GetBookmarksMessage {
  return message && message.type === "get-bookmarks";
}

export function isActivateBookmarkMessage(
  message: WebsocketMessage,
): message is ActivateBookmarkMessage {
  return message && message.type === "activate-bookmark";
}

export function isBookmarksMessage(
  message: WebsocketMessage,
): message is BookmarksMessage {
  return message && message.type === "bookmarks";
}
