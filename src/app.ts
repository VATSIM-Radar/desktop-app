import * as Squirell from 'electron-squirrel-startup';
import { app, ipcMain, autoUpdater } from 'electron';
import { makeUserNotifier, updateElectronApp, UpdateSourceType } from 'update-electron-app';
import { addTray } from './utils/tray';
import { nativeImage } from 'electron/common';
import { store } from './utils/store';
import * as path from 'node:path';
import { logAutoUpdate } from './utils/auto-updater-log';
import { startServer } from './utils/server';
import { initApplicationMenu } from './utils/application-menu';
import { stopWebSocketServer } from './websocket/server';
import { sendBookmarks } from './websocket/send-bookmarks';
import { sendDashboards } from './websocket/send-dashboards';
import { createMainWindowManager } from './utils/main-window';

// @ts-expect-error Non-esm
if (Squirell.default) {
    app.quit();
}

const domain = process.env.VITE_DOMAIN!;
const isNextRelease = domain.includes('next.');
const updateBaseUrl =
    process.env.VITE_UPDATE_BASE_URL ??
    `https://r2.vatsim-radar.com/app/${isNextRelease ? 'next' : 'prod'}`;
const appDisplayName = isNextRelease ? 'VATSIM Radar Next' : 'VATSIM Radar';
const appUserModelId = 'com.squirrel.vatsim_radar_desktop.vatsim-radar';
const getAssetPath = (...parts: string[]) => {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'assets', ...parts)
        : path.join(app.getAppPath(), 'src', 'assets', ...parts);
};
const icon = nativeImage.createFromPath(
    getAssetPath(process.platform === 'win32' ? 'favicon.ico' : 'icon.png'),
);
const mainWindowManager = createMainWindowManager({
    domain,
    title: appDisplayName,
    icon,
    offlinePagePath: getAssetPath('offline.html'),
});

app.setName(appDisplayName);

if (process.platform === 'win32') {
    app.setAppUserModelId(appUserModelId);
}

const initAutoUpdates = () => {
    const updateFeedBaseUrl = `${updateBaseUrl}/${process.platform}/${process.arch}`;

    logAutoUpdate(app, 'info', 'init', {
        appVersion: app.getVersion(),
        isPackaged: app.isPackaged,
        platform: process.platform,
        arch: process.arch,
        updateFeedBaseUrl,
    });

    autoUpdater.on('error', (error) => logAutoUpdate(app, 'error', 'error', error));
    autoUpdater.on('checking-for-update', () => logAutoUpdate(app, 'info', 'checking-for-update'));
    autoUpdater.on('update-available', () => logAutoUpdate(app, 'info', 'update-available'));
    autoUpdater.on('update-not-available', () =>
        logAutoUpdate(app, 'info', 'update-not-available'),
    );
    autoUpdater.on(
        'update-downloaded',
        (_event, releaseNotes, releaseName, releaseDate, updateUrl) => {
            logAutoUpdate(app, 'info', 'update-downloaded', {
                releaseNotes,
                releaseName,
                releaseDate,
                updateUrl,
            });
        },
    );

    updateElectronApp({
        updateSource: {
            type: UpdateSourceType.StaticStorage,
            baseUrl: updateFeedBaseUrl,
        },
        onNotifyUser: makeUserNotifier({
            title: `${appDisplayName} Update`,
            detail: `A new version of ${appDisplayName} has been downloaded. Restart the app to apply it.`,
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

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('vatsim-radar', process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    }
} else {
    app.setAsDefaultProtocolClient('vatsim-radar');
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
    app.quit();
}

if (hasSingleInstanceLock) {
    app.on('second-instance', (_event, commandLine) => {
        const deepLink = commandLine.find((argument) => argument.startsWith('vatsim-radar:'));
        if (deepLink) mainWindowManager.handleDeepLink(deepLink);

        void mainWindowManager.open();
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        mainWindowManager.handleDeepLink(url);
    });

    const startupDeepLink = process.argv.find((argument) => argument.startsWith('vatsim-radar:'));
    if (startupDeepLink) mainWindowManager.handleDeepLink(startupDeepLink);
}

const onWindowAllClosed = () => {
    // having this listener active will prevent the app from quitting.
};

if (hasSingleInstanceLock) {
    app.whenReady().then(() => {
        initApplicationMenu();
        void mainWindowManager.create();
        initAutoUpdates();

        addTray(app, mainWindowManager.open);
    });

    if (store.get('tray') === true) {
        app.on('window-all-closed', onWindowAllClosed);
    }

    app.on('activate', function () {
        void mainWindowManager.open();
    });

    app.on('before-quit', () => {
        stopWebSocketServer();
        mainWindowManager.prepareToQuit();
    });
}

store.onDidChange('tray', () => {
    app.off('window-all-closed', onWindowAllClosed);

    if (store.get('tray') === true) {
        app.on('window-all-closed', onWindowAllClosed);
    }
});

ipcMain.on('reload', () => {
    void mainWindowManager.reload();
});

ipcMain.on('tray:set', (_event, value: boolean) => {
    store.set('tray', value);
});

// The bookmarks message comes from the renderer in response to a
// get-bookmarks request. Pass the received bookmarks to connected
// websocket clients.
ipcMain.on('bookmarks', (_event, message) => {
    sendBookmarks(message.data.bookmarks);
});

// The dashboards message comes from the renderer in response to a
// get-dashboards request. Pass the received dashboards to connected
// websocket clients.
ipcMain.on('dashboards', (_event, message) => {
    sendDashboards(message.data.dashboards);
});

ipcMain.handle('tray:get', (): boolean => store.get('tray') === true);

startServer();
