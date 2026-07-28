import { WebSocketServer } from "ws";
import { isGetBookmarksMessage, WebsocketMessage } from "./messages";
import { handleGetBookmarks } from "./get-bookmarks";
import { BrowserWindow } from "electron";

const WS_PORT = 8443;

let window: BrowserWindow | undefined;
let wss: WebSocketServer | undefined;

export function getWindow(): BrowserWindow {
  if (!window) {
    throw new Error("WebSocket server window is not initialized");
  }

  return window;
}

export function startWebSocketServer(mainWindow: BrowserWindow) {
  window = mainWindow;

  console.log(`Window received is ${window?.title}`);

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

export function stopWebSocketServer() {
  if (wss) {
    wss.close();
    wss = undefined;
  }
}

function processMessage(message: WebsocketMessage) {
  console.log("Processing message:", message);

  if (isGetBookmarksMessage(message)) {
    handleGetBookmarks(message);
  } else {
    console.log("Received unknown message: ", message);
  }
}
