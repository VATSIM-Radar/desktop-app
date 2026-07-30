import { WebSocketServer, WebSocket } from "ws";
import { isForwardableMessage, WebsocketMessage } from "./messages";
import { BrowserWindow } from "electron";

const WS_PORT = 48073;

let window: BrowserWindow | undefined;
let wss: WebSocketServer | undefined;

/**
 * Provides access to the window used for IPC communication with the renderer.
 * Throws an error if the window isn't set.
 * @returns The window that handles IPC with the renderer.
 */
export function getWindow(): BrowserWindow {
  if (!window) {
    throw new Error("WebSocket server window is not initialized");
  }

  return window;
}

/**
 * Starts the websocket server to handle messages from clients.
 * @param mainWindow The window which handles IPC messages with the renderer.
 */
export function startWebSocketServer(mainWindow: BrowserWindow) {
  window = mainWindow;

  wss = new WebSocketServer({ port: WS_PORT });

  wss.on("connection", function connection(ws) {
    ws.on("error", console.error);

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString()) as WebsocketMessage;
      processMessage(message);
    });
  });

  console.log(`WebSocket server started on port ${WS_PORT}`);
}

/**
 * Closes the websocket server.
 */
export function stopWebSocketServer() {
  if (wss) {
    wss.close();
    wss = undefined;
  }
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

  console.log("Received unknown message: ", message);
}
