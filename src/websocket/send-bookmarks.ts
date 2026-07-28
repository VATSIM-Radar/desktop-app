import { Bookmark, BookmarksMessage } from "./messages";
import { getConnectedClients } from "./server";

export function sendBookmarks(bookmarks: Bookmark[]) {
  console.log("Sending bookmarks: ", bookmarks);

  const message = {
    type: "bookmarks",
    data: {
      bookmarks,
    },
  } as BookmarksMessage;

  const clients = getConnectedClients();
  clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
}
