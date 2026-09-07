import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { isForwardableMessage, WebsocketMessage } from './messages';
import type { BrowserWindow } from 'electron';

const WS_PORT = 48073;

let rendererWindow: BrowserWindow | undefined;
let wss: WebSocketServer | undefined;

/**
 * Provides access to the window used for IPC communication with the renderer.
 * Throws an error if the window isn't set.
 * @returns The window that handles IPC with the renderer.
 */
export function getWindow(): BrowserWindow {
    if (!rendererWindow || rendererWindow.isDestroyed()) {
        throw new Error('WebSocket server window is not initialized');
    }

    return rendererWindow;
}

/**
 * Attaches a renderer window and starts the websocket server if needed.
 * Subsequent calls only replace the renderer window, keeping existing clients.
 * @param mainWindow The window which handles IPC messages with the renderer.
 */
export function startWebSocketServer(mainWindow: BrowserWindow) {
    rendererWindow = mainWindow;

    mainWindow.once('closed', () => {
        if (rendererWindow === mainWindow) rendererWindow = undefined;
    });

    if (wss) return;

    wss = new WebSocketServer({ port: WS_PORT, host: '127.0.0.1' });

    wss.on('error', (error) => {
        console.error('WebSocket server error: ', error);
    });

    wss.on('connection', function connection(ws) {
        ws.on('error', console.error);

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString()) as WebsocketMessage;
                processMessage(message);
            } catch (error) {
                console.error('Error processing websocket message: ', error.message);
            }
        });
    });

    console.log(`WebSocket server started on port ${WS_PORT}`);
}

/**
 * Closes the websocket server.
 */
export function stopWebSocketServer() {
    rendererWindow = undefined;

    const server = wss;
    wss = undefined;
    if (!server) return;

    server.clients.forEach((client) => client.terminate());
    server.close((error) => {
        if (error) console.error('Error closing WebSocket server: ', error);
    });
}

/**
 * Gets the list of connected clients.
 * @returns The list of connected clients.
 */
export function getConnectedClients(): WebSocket[] {
    if (!wss) return [];

    return Array.from(wss.clients) as WebSocket[];
}

/**
 * Takes incoming websocket messages and routes it to the appropriate
 * function for handling.
 * @param message The incoming websocket message.
 */
function processMessage(message: WebsocketMessage) {
    // Check to make sure the incoming websocket message is a supported
    // message that's allowed to be forwarded. This prevents any random websocket
    // message from getting passed along.
    if (isForwardableMessage(message)) {
        getWindow().webContents.send(message.type, message);
        return;
    }

    console.log('Received unknown message: ', message);
}
