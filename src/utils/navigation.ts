import { app } from 'electron';
import type { BrowserWindow } from 'electron';
import { store } from './store';

const domain = process.env.VITE_DOMAIN!;
const domainOrigin = new URL(domain).origin;

export const loadAppUrl = (win: BrowserWindow, url: string) => {
    return win.loadURL(url, {
        extraHeaders: `radarWebview: ${ app.getVersion() }
`,
    });
};

export const isApiUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);

        return parsedUrl.origin === domainOrigin &&
            (parsedUrl.pathname === '/api' || parsedUrl.pathname.startsWith('/api/'));
    }
    catch {
        return false;
    }
};

export const resetAppWindow = (win: BrowserWindow) => {
    store.delete('lastUrl');
    return loadAppUrl(win, domain);
};
