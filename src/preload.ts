import {ipcRenderer} from 'electron';

const appOrigin = import.meta.env.VITE_DOMAIN
    ? new URL(import.meta.env.VITE_DOMAIN).origin
    : undefined;

window.addEventListener('message', (event) => {
    const isReloadRequest = event.data?.type === 'reload';
    const isFromApp = event.origin === appOrigin;
    const isFromOfflinePage =
        window.location.protocol === 'file:' &&
        event.origin === 'null' &&
        event.source === window;

    if (isReloadRequest && (isFromApp || isFromOfflinePage)) {
        ipcRenderer.send('reload');
    }
});
