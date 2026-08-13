import { ipcRenderer, contextBridge } from 'electron';
import { BookmarksMessage, DashboardsMessage } from './websocket/messages';

const appOrigin = import.meta.env.VITE_DOMAIN
    ? new URL(import.meta.env.VITE_DOMAIN).origin
    : undefined;

window.addEventListener('message', (event) => {
    const isFromApp = event.origin === appOrigin;
    const isFromOfflinePage =
        window.location.protocol === 'file:' && event.origin === 'null' && event.source === window;

    if (!isFromApp && !isFromOfflinePage) return;

    if (event.data?.type === 'reload') {
        ipcRenderer.send('reload');
    } else if (event.data?.type === 'bookmarks') {
        ipcRenderer.send('bookmarks', event.data as BookmarksMessage);
    } else if (event.data?.type === 'dashboards') {
        ipcRenderer.send('dashboards', event.data as DashboardsMessage);
    } else if (event.data?.type === 'tray') {
        ipcRenderer.send('tray:set', event.data.value === true);
    }
});

ipcRenderer.on('efbX', (_event, action: 'pause' | 'resume') => {
    window.postMessage({ type: 'efbX', action }, appOrigin ?? '*');
});

contextBridge.exposeInMainWorld('vatsimRadar', {
    getTrayValue: (): Promise<boolean> => ipcRenderer.invoke('tray:get'),
});

// Websocket request from the main app for a list of bookmarks. Pass
// the incoming message on to the renderer for processing.
ipcRenderer.on('get-bookmarks', (_event, message) => {
    window.postMessage(message, appOrigin ?? '*');
});

// Websocket request from the main app for a list of dashboards. Pass
// the incoming message on to the renderer for processing.
ipcRenderer.on('get-dashboards', (_event, message) => {
    window.postMessage(message, appOrigin ?? '*');
});

// Websocket request from the main app to activate a bookmark. Pass
// the incoming message on to the renderer for processing.
ipcRenderer.on('activate-bookmark', (_event, message) => {
    window.postMessage(message, appOrigin ?? '*');
});

// Websocket request from the main app to activate a dashboard. Pass
// the incoming message on to the renderer for processing.
ipcRenderer.on('activate-dashboard', (_event, message) => {
    window.postMessage(message, appOrigin ?? '*');
});
