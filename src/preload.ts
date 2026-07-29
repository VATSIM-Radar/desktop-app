import { ipcRenderer, contextBridge } from "electron";
import { BookmarksMessage, DashboardsMessage } from "./websocket/messages";

const appOrigin = import.meta.env.VITE_DOMAIN
  ? new URL(import.meta.env.VITE_DOMAIN).origin
  : undefined;

window.addEventListener("message", (event) => {
  const isFromApp = event.origin === appOrigin;
  const isFromOfflinePage =
    window.location.protocol === "file:" &&
    event.origin === "null" &&
    event.source === window;

  if (!isFromApp && !isFromOfflinePage) return;

  if (event.data?.type === "reload") {
    ipcRenderer.send("reload");
  } else if (event.data?.type === "bookmarks") {
    ipcRenderer.send("bookmarks", event.data as BookmarksMessage);
  } else if (event.data?.type === "dashboards") {
    ipcRenderer.send("dashboards", event.data as DashboardsMessage);
  } else if (event.data?.type === "tray") {
    ipcRenderer.send("tray:set", event.data.value === true);
  }
});

ipcRenderer.on("efbX", (_event, action: "pause" | "resume") => {
  window.postMessage({ type: "efbX", action }, appOrigin ?? "*");
});

ipcRenderer.on("get-bookmarks", (_event, message) => {
  console.log(
    "Received get-bookmarks message from main process:",
    JSON.stringify(message),
  );
  window.postMessage(message, appOrigin ?? "*");
});

ipcRenderer.on("get-dashboards", (_event, message) => {
  console.log(
    "Received get-dashboards message from main process:",
    JSON.stringify(message),
  );
  window.postMessage(message, appOrigin ?? "*");
});

ipcRenderer.on("activate-bookmark", (_event, message) => {
  console.log(
    "Received activate-bookmark message from main process:",
    JSON.stringify(message),
  );
  window.postMessage(message, appOrigin ?? "*");
});

ipcRenderer.on("activate-dashboard", (_event, message) => {
  console.log(
    "Received activate-dashboard message from main process:",
    JSON.stringify(message),
  );
  window.postMessage(message, appOrigin ?? "*");
});

contextBridge.exposeInMainWorld("vatsimRadar", {
  getTrayValue: (): Promise<boolean> => ipcRenderer.invoke("tray:get"),
});
