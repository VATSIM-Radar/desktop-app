import { GetBookmarksMessage } from "./messages";
import { getWindow } from "./server";

export function handleGetBookmarks(message: GetBookmarksMessage) {
  console.log(`Processing ${message.type} message`);
  getWindow().webContents.send("get-bookmarks", message);
}
