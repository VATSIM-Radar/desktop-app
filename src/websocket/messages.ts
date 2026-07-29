export interface Bookmark {
  label: string;
  id: number;
  order: number;
}

export interface Dashboard {
  name: string;
  id: number;
}

export interface GetBookmarksMessage {
  type: "get-bookmarks";
}

export interface GetDashboardsMessage {
  type: "get-dashboards";
}

export interface ActivateBookmarkMessage {
  type: "activate-bookmark";
  data: {
    id: number;
  };
}

export interface ActivateDashboardMessage {
  type: "activate-dashboard";
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

export interface DashboardsMessage {
  type: "dashboards";
  data: {
    dashboards: Dashboard[];
  };
}

export type WebsocketMessage =
  | ActivateBookmarkMessage
  | ActivateDashboardMessage
  | BookmarksMessage
  | DashboardsMessage
  | GetBookmarksMessage
  | GetDashboardsMessage;

export function isGetBookmarksMessage(
  message: WebsocketMessage,
): message is GetBookmarksMessage {
  return message && message.type === "get-bookmarks";
}

export function isGetDashboardsMessage(
  message: WebsocketMessage,
): message is GetDashboardsMessage {
  return message && message.type === "get-dashboards";
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

export function isActivateDashboardMessage(
  message: WebsocketMessage,
): message is ActivateDashboardMessage {
  return message && message.type === "activate-dashboard";
}
