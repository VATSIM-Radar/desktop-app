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
  type: 'get-bookmarks';
}

export interface GetDashboardsMessage {
  type: 'get-dashboards';
}

export interface ActivateBookmarkMessage {
  type: 'activate-bookmark';
  data: {
    id: number;
  };
}

export interface ActivateDashboardMessage {
  type: 'activate-dashboard';
  data: {
    id: number;
  };
}

export interface BookmarksMessage {
  type: 'bookmarks';
  data: {
    bookmarks: Bookmark[];
  };
}

export interface DashboardsMessage {
  type: 'dashboards';
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

// These message types are the messages that get forwarded directly
// to the renderer for processing.
const forwardableMessageTypes = new Set<WebsocketMessage['type']>([
  'get-bookmarks',
  'activate-bookmark',
  'get-dashboards',
  'activate-dashboard',
]);

/**
 * Checks to see if an incoming message should be forwarded to the renderer
 * for processing.
 * @param message The message to verify
 * @returns True if the message can be forwarded to the renderer for processing.
 */
export function isForwardableMessage(message: WebsocketMessage) {
  return forwardableMessageTypes.has(message.type);
}
