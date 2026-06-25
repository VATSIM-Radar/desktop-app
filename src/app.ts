import * as Squirell from 'electron-squirrel-startup';
import { app, shell, BrowserWindow, ipcMain, autoUpdater } from 'electron';
import { makeUserNotifier, updateElectronApp, UpdateSourceType } from 'update-electron-app';
import { addTray } from './utils/tray';
import { nativeImage } from 'electron/common';
import { store } from './utils/store';
import * as path from 'node:path';
import { getNavigraphAuthUrl, getVatsimAuthUrl } from './utils/auth';
import { logAutoUpdate } from './utils/auto-updater-log';
import { startServer } from './utils/server';

// @ts-expect-error Non-esm
if (Squirell.default) {
    app.quit();
}

const domain = process.env.VITE_DOMAIN!;
const isNextRelease = domain.includes('next.');
const updateBaseUrl = process.env.VITE_UPDATE_BASE_URL ?? `https://r2.vatsim-radar.com/app/${ isNextRelease ? 'next' : 'prod' }`;
const appDisplayName = isNextRelease ? 'VATSIM Radar Next' : 'VATSIM Radar';
const appUserModelId = 'com.squirrel.vatsim_radar_desktop.vatsim-radar';
const getAssetPath = (...parts: string[]) => {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'assets', ...parts)
        : path.join(app.getAppPath(), 'src', 'assets', ...parts);
};

const icon = nativeImage.createFromPath(getAssetPath(process.platform === 'win32' ? 'favicon.ico' : 'icon.png'));
let mainWindow: BrowserWindow | undefined;
let pendingAuthUrl: string | undefined;
let currentAuthUrl: string | undefined;
let isQuitting = false;
let isMainWindowVisible: boolean | undefined;

app.setName(appDisplayName);

if (process.platform === 'win32') {
    app.setAppUserModelId(appUserModelId);
}

const initAutoUpdates = () => {
    const updateFeedBaseUrl = `${ updateBaseUrl }/${ process.platform }/${ process.arch }`;

    logAutoUpdate(app, 'info', 'init', {
        appVersion: app.getVersion(),
        isPackaged: app.isPackaged,
        platform: process.platform,
        arch: process.arch,
        updateFeedBaseUrl,
    });

    autoUpdater.on('error', error => logAutoUpdate(app, 'error', 'error', error));
    autoUpdater.on('checking-for-update', () => logAutoUpdate(app, 'info', 'checking-for-update'));
    autoUpdater.on('update-available', () => logAutoUpdate(app, 'info', 'update-available'));
    autoUpdater.on('update-not-available', () => logAutoUpdate(app, 'info', 'update-not-available'));
    autoUpdater.on('update-downloaded', (_event, releaseNotes, releaseName, releaseDate, updateUrl) => {
        logAutoUpdate(app, 'info', 'update-downloaded', {
            releaseNotes,
            releaseName,
            releaseDate,
            updateUrl,
        });
    });

    updateElectronApp({
        updateSource: {
            type: UpdateSourceType.StaticStorage,
            baseUrl: updateFeedBaseUrl,
        },
        onNotifyUser: makeUserNotifier({
            title: `${ appDisplayName } Update`,
            detail: `A new version of ${ appDisplayName } has been downloaded. Restart the app to apply it.`,
            restartButtonText: 'Restart',
            laterButtonText: 'Later',
        }),
        logger: {
            log: (...messages: unknown[]) => logAutoUpdate(app, 'info', ...messages),
            info: (...messages: unknown[]) => logAutoUpdate(app, 'info', ...messages),
            error: (...messages: unknown[]) => logAutoUpdate(app, 'error', ...messages),
            warn: (...messages: unknown[]) => logAutoUpdate(app, 'warn', ...messages),
        },
    });
};

const notifyVisibilityChange = (win: BrowserWindow) => {
    if (win.isDestroyed()) return;

    const isVisible = win.isVisible() && !win.isMinimized();
    if (isMainWindowVisible === isVisible) return;

    isMainWindowVisible = isVisible;
    win.webContents.send('efbX', isVisible ? 'resume' : 'pause');
};

const loadAppUrl = (win: BrowserWindow, url: string) => {
    return win.loadURL(url, {
        extraHeaders: `radarWebview: ${ app.getVersion() }
`,
    });
};

const addAppRequestHeaders = (win: BrowserWindow) => {
    const appOrigin = new URL(domain).origin;

    win.webContents.session.webRequest.onBeforeSendHeaders(
        { urls: [`${ appOrigin }/*`] },
        (details, callback) => {
            details.requestHeaders.radarWebview = app.getVersion();
            callback({ requestHeaders: details.requestHeaders });
        },
    );
};

const showWindow = (win: BrowserWindow) => {
    if (win.isDestroyed()) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
};

const handleDeeplinkAuth = (deepLink: string) => {
    const authUrl = getVatsimAuthUrl(deepLink) ?? getNavigraphAuthUrl(deepLink);
    if (!authUrl || authUrl === currentAuthUrl) return;

    currentAuthUrl = authUrl;

    if (mainWindow && !mainWindow.isDestroyed()) {
        loadAppUrl(mainWindow, authUrl);
        showWindow(mainWindow);
        return;
    }

    pendingAuthUrl = authUrl;
};

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('vatsim-radar', process.execPath, [path.resolve(process.argv[1])]);
    }
}
else {
    app.setAsDefaultProtocolClient('vatsim-radar');
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
    app.quit();
}

if (hasSingleInstanceLock) {
    app.on('second-instance', (_event, commandLine) => {
        const deepLink = commandLine.find(argument => argument.startsWith('vatsim-radar:'));
        if (deepLink) handleDeeplinkAuth(deepLink);

        const win = BrowserWindow.getAllWindows()[0];
        if (win) showWindow(win);
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        handleDeeplinkAuth(url);
    });

    const startupDeepLink = process.argv.find(argument => argument.startsWith('vatsim-radar:'));
    if (startupDeepLink) handleDeeplinkAuth(startupDeepLink);
}

const createWindow = async () => {
    const win = new BrowserWindow({
        show: false,
        title: appDisplayName,
        accentColor: '#1A1A1A',
        backgroundColor: '#1A1A1A',
        autoHideMenuBar: true,
        fullscreenable: true,
        tabbingIdentifier: 'vatsim-radar',
        webPreferences: {
            devTools: true,
            nodeIntegration: false,
            contextIsolation: true,
            partition: 'persist:main',
            preload: path.join(__dirname, 'preload.js'),
        },
        width: store.get('width') || 640,
        height: store.get('height') || 360,
        x: store.get('x'),
        y: store.get('y'),
        icon,
    });

    mainWindow = win;
    addAppRequestHeaders(win);

    win.on('close', event => {
        if (store.get('tray') === true && !isQuitting) {
            event.preventDefault();
            win.hide();
        }
    });

    win.on('closed', () => {
        if (mainWindow === win) mainWindow = undefined;
        isMainWindowVisible = undefined;
    });

    if (!store.get('width') || store.get('maximized')) {
        win.maximize();
    }
    win.show();

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.startsWith(domain)) {
            shell.openExternal(url);
            return { action: 'deny' };
        }

        return { action: 'allow' };
    });

    win.webContents.on('will-navigate', (event => {
        if (event.url.startsWith('file://')) return;

        if (event.url.includes('/redirect')) {
            shell.openExternal(`${ event.url }?app=1`);
            event.preventDefault();
        }

        if (!event.url.startsWith(domain)) {
            shell.openExternal(event.url);
            event.preventDefault();
            return;
        }
    }));

    const storeLastUrl = (url: string) => {
        if (url.startsWith(domain)) store.set('lastUrl', url);
    };

    win.webContents.on('did-navigate', (_event, url) => {
        storeLastUrl(url);
    });

    win.webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
        if (isMainFrame) storeLastUrl(url);
    });

    win.webContents.on('before-input-event', (event, input) => {
        const isSystemReload = input.type === 'keyDown' && (
            (input.key === 'F5' && (input.control || input.meta)) ||
            ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'r')
        );

        if (!isSystemReload) return;

        event.preventDefault();
        store.delete('lastUrl');
        void loadAppUrl(win, domain);
    });

    const initialUrl = pendingAuthUrl ?? store.get('lastUrl') ?? domain;
    pendingAuthUrl = undefined;

    try {
        await loadAppUrl(win, initialUrl);
    }
    catch {
        await win.loadFile(getAssetPath('offline.html'));
    }
    notifyVisibilityChange(win);

    let storeWindowStateTimeout: NodeJS.Timeout | undefined;

    function storeWindowState() {
        if (win.isDestroyed() || win.isMinimized()) return;

        const { width, height, x, y } = win.getBounds();
        store.set({ width, height, x, y, maximized: win.isMaximized() });
    }

    function scheduleStoreWindowState() {
        if (storeWindowStateTimeout) clearTimeout(storeWindowStateTimeout);
        storeWindowStateTimeout = setTimeout(storeWindowState, 250);
    }

    win.on('resize', scheduleStoreWindowState);
    win.on('resized', storeWindowState);
    win.on('move', scheduleStoreWindowState);
    win.on('moved', storeWindowState);
    win.on('maximize', storeWindowState);
    win.on('unmaximize', storeWindowState);

    win.on('show', () => notifyVisibilityChange(win));
    win.on('hide', () => notifyVisibilityChange(win));
    win.on('minimize', () => notifyVisibilityChange(win));
    win.on('restore', () => notifyVisibilityChange(win));
    win.webContents.on('did-finish-load', () => notifyVisibilityChange(win));
};

const onWindowAllClosed = () => {
    // having this listener active will prevent the app from quitting.
};

if (hasSingleInstanceLock) {
    app.whenReady().then(() => {
        createWindow();
        initAutoUpdates();

        addTray(app, createWindow);
    });

    if (store.get('tray') === true) {
        app.on('window-all-closed', onWindowAllClosed);
    }

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on('before-quit', () => {
        isQuitting = true;
    });
}

store.onDidChange('tray', () => {
    app.off('window-all-closed', onWindowAllClosed);

    if (store.get('tray') === true) {
        app.on('window-all-closed', onWindowAllClosed);
    }
});

ipcMain.on('reload', () => {
    store.delete('lastUrl');
    BrowserWindow.getAllWindows().forEach(x => x.destroy());
    createWindow();
});

ipcMain.on('tray:set', (_event, value: boolean) => {
    store.set('tray', value);
});

ipcMain.handle('tray:get', (): boolean => store.get('tray') === true);

startServer();
