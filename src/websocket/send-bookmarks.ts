import { Bookmark, BookmarksMessage } from './messages';
import { getConnectedClients } from './server';

/**
 * Sends a list of bookmarks to all connected websocket clients.
 * @param bookmarks The bookmarks to send.
 */
export function sendBookmarks(bookmarks: Bookmark[]) {
    const message = {
        type: 'bookmarks',
        data: {
            bookmarks,
        },
    } as BookmarksMessage;

    const clients = getConnectedClients();
    clients.forEach((client) => {
        client.send(JSON.stringify(message));
    });
}
