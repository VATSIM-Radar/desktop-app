import * as Squirell from 'electron-squirrel-startup';
import type {WebContents} from 'electron';
import {app, shell, BrowserWindow, WebContentsView, ipcMain} from 'electron';
import {addTray} from './utils/tray';
import {nativeImage} from 'electron/common';
import {store} from './utils/store';
import * as path from 'node:path';
import {getNavigraphAuthUrl, getVatsimAuthUrl} from "./utils/auth";
import {initDiscord} from "./utils/server";

// @ts-expect-error Non-esm
if (Squirell.default) {
    app.quit();
}

const domain = process.env.VITE_DOMAIN!;
const icon = nativeImage.createFromPath('./src/assets/icon.png');
let mainWebContents: WebContents | undefined;
let pendingAuthUrl: string | undefined;
let currentAuthUrl: string | undefined;

const handleDeeplinkAuth = (deepLink: string) => {
    const authUrl = getVatsimAuthUrl(deepLink) ?? getNavigraphAuthUrl(deepLink);
    if (!authUrl || authUrl === currentAuthUrl) return;

    currentAuthUrl = authUrl;

    if (mainWebContents) {
        mainWebContents.loadURL(authUrl);
        return;
    }

    pendingAuthUrl = authUrl;
};

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('vatsim-radar', process.execPath, [path.resolve(process.argv[1])]);
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
        const deepLink = commandLine.find(argument => argument.startsWith('vatsim-radar:'));
        if (deepLink) handleDeeplinkAuth(deepLink);

        const win = BrowserWindow.getAllWindows()[0];
        if (win?.isMinimized()) win.restore();
        win?.focus();
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
        title: 'VATSIM Radar',
        accentColor: '#1A1A1A',
        backgroundColor: '#1A1A1A',
        autoHideMenuBar: true,
        fullscreenable: true,
        tabbingIdentifier: 'vatsim-radar',
        webPreferences: {
            devTools: true,
            nodeIntegration: false,
        },
        width: store.get('width') || 640,
        height: store.get('height') || 360,
        x: store.get('x'),
        y: store.get('y'),
        icon,
    });

    if (!store.get('width') || store.get('maximized')) {
        win.maximize();
    }
    win.show();

    const mainView = new WebContentsView({
        webPreferences: {
            partition: 'persist:main',
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    mainWebContents = mainView.webContents;

    win.contentView.addChildView(mainView);

    mainView.webContents.setWindowOpenHandler(({url}) => {
        if (!url.startsWith(domain)) {
            shell.openExternal(url);
            return {action: 'deny'};
        }

        return {action: 'allow'};
    });

    mainView.webContents.on('will-navigate', (event => {
        if (event.url.includes('/redirect')) {
            shell.openExternal(`${event.url}?app=1`);
            event.preventDefault();
        }

        if (!event.url.startsWith(domain)) {
            shell.openExternal(event.url);
            event.preventDefault();
            return;
        }
    }));

    const initialUrl = pendingAuthUrl ?? domain;
    pendingAuthUrl = undefined;

    let loadError = false

    try {
        await mainView.webContents.loadURL(initialUrl);
    } catch (e) {
        loadError = true
        await mainView.webContents.loadFile('./src/assets/offline.html')
    }

    const size = win.getSize();
    mainView.setBounds({x: 0, y: 0, width: size[0], height: size[1]});

    function storeWindowState() {
        const [width, height] = win.getSize();
        const [x, y] = win.getPosition();
        store.set({width, height, x, y, maximized: win.isMaximized()});
    }

    win.on('resize', () => {
        const size = win.getSize();
        mainView.setBounds({x: 0, y: 0, width: size[0], height: size[1]});
    });

    win.on('resized', storeWindowState);
    win.on('maximize', storeWindowState);
    win.on('unmaximize', storeWindowState);
    win.on('moved', storeWindowState);
};

if (hasSingleInstanceLock) {
    app.whenReady().then(() => {
        createWindow();

        addTray(app, createWindow);
    });

    app.on('window-all-closed', () => {
        // having this listener active will prevent the app from quitting.
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
}

ipcMain.on('reload', () => {
    BrowserWindow.getAllWindows().forEach(x => x.destroy());
    createWindow();
})

initDiscord();