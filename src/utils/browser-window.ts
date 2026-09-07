import { BrowserWindow, shell } from 'electron';
import type { BrowserWindowConstructorOptions, NativeImage } from 'electron';
import * as path from 'node:path';

const domainOrigin = new URL(process.env.VITE_DOMAIN!).origin;
const configuredWindows = new WeakSet<BrowserWindow>();
const windowVisibility = new WeakMap<BrowserWindow, boolean>();

export interface AppWindowConfig {
    title: string;
    icon: NativeImage;
}

const getWebPreferences = (): NonNullable<BrowserWindowConstructorOptions['webPreferences']> => ({
    devTools: true,
    nodeIntegration: false,
    contextIsolation: true,
    partition: 'persist:main',
    preload: path.join(__dirname, 'preload.js'),
});

export const getAppWindowOptions = (config: AppWindowConfig): BrowserWindowConstructorOptions => ({
    title: config.title,
    accentColor: '#1A1A1A',
    backgroundColor: '#1A1A1A',
    autoHideMenuBar: true,
    fullscreenable: true,
    tabbingIdentifier: 'vatsim-radar',
    icon: config.icon,
    webPreferences: getWebPreferences(),
});

export const isAppUrl = (url: string) => {
    try {
        return new URL(url).origin === domainOrigin;
    } catch {
        return false;
    }
};

const notifyVisibilityChange = (win: BrowserWindow, force = false) => {
    if (win.isDestroyed() || win.webContents.isDestroyed()) return;

    const isVisible = win.isVisible() && !win.isMinimized();
    if (!force && windowVisibility.get(win) === isVisible) return;

    windowVisibility.set(win, isVisible);
    win.webContents.send('efbX', isVisible ? 'resume' : 'pause');
};

export const configureAppWindow = (win: BrowserWindow, config: AppWindowConfig) => {
    if (configuredWindows.has(win)) return;
    configuredWindows.add(win);

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!isAppUrl(url)) {
            void shell.openExternal(url);
            return { action: 'deny' };
        }

        return {
            action: 'allow',
            overrideBrowserWindowOptions: getAppWindowOptions(config),
        };
    });

    win.webContents.on('did-create-window', (childWindow) => {
        configureAppWindow(childWindow, config);
    });

    win.webContents.on('will-navigate', (event) => {
        if (event.url.startsWith('file://')) return;

        if (event.url.includes('/redirect')) {
            const url = new URL(event.url);
            url.searchParams.set('app', '1');
            void shell.openExternal(url.toString());
            event.preventDefault();
            return;
        }

        if (!isAppUrl(event.url)) {
            void shell.openExternal(event.url);
            event.preventDefault();
        }
    });

    win.on('show', () => notifyVisibilityChange(win));
    win.on('hide', () => notifyVisibilityChange(win));
    win.on('minimize', () => notifyVisibilityChange(win));
    win.on('restore', () => notifyVisibilityChange(win));
    win.webContents.on('did-finish-load', () => notifyVisibilityChange(win, true));
    win.on('closed', () => windowVisibility.delete(win));
};
