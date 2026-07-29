import { WebSocketServer, WebSocket } from "ws";
import {
  isActivateBookmarkMessage,
  isGetBookmarksMessage,
  WebsocketMessage,
} from "./messages";
import { BrowserWindow } from "electron";

const WS_PORT = 48073;

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
    console.log("New WebSocket client connected");

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

export function getConnectedClients(): WebSocket[] {
  if (!wss) return [];

  return Array.from(wss.clients) as WebSocket[];
}

function processMessage(message: WebsocketMessage) {
  console.log("Processing message:", message);

  if (isGetBookmarksMessage(message)) {
    getWindow().webContents.send("get-bookmarks", message);
  } else if (isActivateBookmarkMessage(message)) {
    getWindow().webContents.send("activate-bookmark", message);
  } else {
    console.log("Received unknown message: ", message);
  }
}
