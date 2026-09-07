import { app, BrowserWindow } from 'electron';
import type { NativeImage } from 'electron';
import { getNavigraphAuthUrl, getVatsimAuthUrl } from './auth';
import { configureAppWindow, getAppWindowOptions, isAppUrl } from './browser-window';
import { isApiUrl, loadAppUrl, resetAppWindow } from './navigation';
import { store } from './store';
import { startWebSocketServer } from '../websocket/server';

interface MainWindowOptions {
    domain: string;
    title: string;
    icon: NativeImage;
    offlinePagePath: string;
}

const showWindow = (win: BrowserWindow) => {
    if (win.isDestroyed()) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
};

export const createMainWindowManager = (options: MainWindowOptions) => {
    const windowConfig = { title: options.title, icon: options.icon };
    let mainWindow: BrowserWindow | undefined;
    let pendingAuthUrl: string | undefined;
    let currentAuthUrl: string | undefined;
    let isQuitting = false;

    const getWindow = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return undefined;
        return mainWindow;
    };

    const addAppRequestHeaders = (win: BrowserWindow) => {
        win.webContents.session.webRequest.onBeforeSendHeaders(
            { urls: [`${options.domain}/*`] },
            (details, callback) => {
                details.requestHeaders.radarWebview = app.getVersion();
                callback({ requestHeaders: details.requestHeaders });
            },
        );
    };

    const create = async () => {
        const existingWindow = getWindow();
        if (existingWindow) {
            showWindow(existingWindow);
            return existingWindow;
        }

        const win = new BrowserWindow({
            ...getAppWindowOptions(windowConfig),
            show: false,
            width: store.get('width') || 640,
            height: store.get('height') || 360,
            x: store.get('x'),
            y: store.get('y'),
        });

        mainWindow = win;
        configureAppWindow(win, windowConfig);
        addAppRequestHeaders(win);
        startWebSocketServer(win);

        win.webContents.session.webRequest.onCompleted(
            { urls: [`${options.domain}/api*`] },
            (details) => {
                if (details.resourceType !== 'mainFrame' || details.statusCode < 500) return;

                void resetAppWindow(win);
            },
        );

        win.on('close', (event) => {
            if (store.get('tray') === true && !isQuitting) {
                event.preventDefault();
                win.hide();
            }
        });

        win.on('closed', () => {
            if (mainWindow === win) mainWindow = undefined;
        });

        if (!store.get('width') || store.get('maximized')) {
            win.maximize();
        }
        win.show();

        const storeLastUrl = (url: string) => {
            if (isAppUrl(url) && !isApiUrl(url)) store.set('lastUrl', url);
        };

        win.webContents.on('did-navigate', (_event, url) => {
            storeLastUrl(url);
        });

        win.webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
            if (!isMainFrame) return;

            storeLastUrl(url);
        });

        win.webContents.on('before-input-event', (event, input) => {
            const isSystemReload =
                input.type === 'keyDown' &&
                ((input.key === 'F5' && (input.control || input.meta)) ||
                    ((input.control || input.meta) &&
                        input.shift &&
                        input.key.toLowerCase() === 'r'));

            if (!isSystemReload) return;

            event.preventDefault();
            void resetAppWindow(win);
        });

        const lastUrl = store.get('lastUrl');
        let initialUrl = pendingAuthUrl ?? lastUrl ?? options.domain;

        if (lastUrl && (!isAppUrl(lastUrl) || isApiUrl(lastUrl))) {
            store.delete('lastUrl');
            if (!pendingAuthUrl) initialUrl = options.domain;
        }

        pendingAuthUrl = undefined;

        try {
            await loadAppUrl(win, initialUrl);
        } catch (error) {
            if (mainWindow !== win || win.isDestroyed()) return undefined;

            try {
                await win.loadFile(options.offlinePagePath);
            } catch {
                if (mainWindow !== win || win.isDestroyed()) return undefined;
                throw error;
            }
        }

        if (mainWindow !== win || win.isDestroyed()) return undefined;

        let storeWindowStateTimeout: NodeJS.Timeout | undefined;

        const storeWindowState = () => {
            if (win.isDestroyed() || win.isMinimized()) return;

            const { width, height, x, y } = win.getBounds();
            store.set({ width, height, x, y, maximized: win.isMaximized() });
        };

        const scheduleStoreWindowState = () => {
            if (storeWindowStateTimeout) clearTimeout(storeWindowStateTimeout);
            storeWindowStateTimeout = setTimeout(storeWindowState, 250);
        };

        win.on('resize', scheduleStoreWindowState);
        win.on('resized', storeWindowState);
        win.on('move', scheduleStoreWindowState);
        win.on('moved', storeWindowState);
        win.on('maximize', storeWindowState);
        win.on('unmaximize', storeWindowState);

        return win;
    };

    const open = async () => {
        const win = getWindow();
        if (win) {
            showWindow(win);
            return win;
        }

        if (!app.isReady()) return undefined;
        return create();
    };

    const handleDeepLink = (deepLink: string) => {
        const authUrl = getVatsimAuthUrl(deepLink) ?? getNavigraphAuthUrl(deepLink);
        if (!authUrl || authUrl === currentAuthUrl) return;

        currentAuthUrl = authUrl;
        const win = getWindow();

        if (win) {
            void loadAppUrl(win, authUrl);
            showWindow(win);
            return;
        }

        pendingAuthUrl = authUrl;
    };

    const reload = () => {
        store.delete('lastUrl');
        BrowserWindow.getAllWindows().forEach((win) => win.destroy());
        return create();
    };

    const prepareToQuit = () => {
        isQuitting = true;
    };

    return { create, handleDeepLink, open, prepareToQuit, reload };
};
