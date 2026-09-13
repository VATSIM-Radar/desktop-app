import { app, BrowserWindow, dialog, Menu, session } from 'electron';
import type { MenuItemConstructorOptions, MessageBoxOptions } from 'electron';
import { resetAppWindow } from './navigation';
import { store } from './store';

let isClearingAppData = false;

const showAppMessageBox = (browserWindow: BrowserWindow | undefined, options: MessageBoxOptions) => {
    if (browserWindow) return dialog.showMessageBox(browserWindow, options);

    return dialog.showMessageBox(options);
};

const clearAppData = async (browserWindow: BrowserWindow | undefined) => {
    if (isClearingAppData) return;

    const dialogWindow = browserWindow ?? BrowserWindow.getFocusedWindow() ?? undefined;
    const { response } = await showAppMessageBox(dialogWindow, {
        type: 'warning',
        buttons: ['Cancel', 'Clear data'],
        defaultId: 0,
        cancelId: 0,
        title: 'Clear application data',
        message: 'Clear all application data?',
        detail: 'This will remove saved settings, login sessions, website data, and cache. The application will restart and you may need to sign in again.',
    });

    if (response !== 1) return;

    isClearingAppData = true;

    try {
        await session.fromPartition('persist:main').clearData();
        store.clear();
        app.relaunch();
        app.exit(0);
    }
    catch (error) {
        isClearingAppData = false;
        await showAppMessageBox(dialogWindow, {
            type: 'error',
            buttons: ['OK'],
            title: 'Unable to clear application data',
            message: 'Application data could not be cleared.',
            detail: error instanceof Error ? error.message : String(error),
        });
    }
};

export const initApplicationMenu = () => {
    const template: MenuItemConstructorOptions[] = [];

    if (process.platform === 'darwin') template.push({ role: 'appMenu' });

    template.push(
        {
            label: 'File',
            submenu: [
                { role: 'close' },
                { type: 'separator' },
                {
                    label: 'Clear Application Data…',
                    click: (_menuItem, browserWindow) => {
                        const menuWindow = browserWindow instanceof BrowserWindow ? browserWindow : undefined;
                        void clearAppData(menuWindow);
                    },
                },
                { type: 'separator' },
                { role: 'quit' },
            ],
        },
        { role: 'editMenu' },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: (_menuItem, browserWindow) => {
                        const menuWindow = browserWindow instanceof BrowserWindow ? browserWindow : undefined;
                        const win = menuWindow ?? BrowserWindow.getFocusedWindow() ??
                            BrowserWindow.getAllWindows()[0];

                        if (win && !win.isDestroyed()) void resetAppWindow(win);
                    },
                },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        { role: 'windowMenu' },
    );

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
