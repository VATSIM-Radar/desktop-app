import { BrowserWindow, Menu } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { resetAppWindow } from './navigation';

export const initApplicationMenu = () => {
    const template: MenuItemConstructorOptions[] = [];

    if (process.platform === 'darwin') template.push({ role: 'appMenu' });

    template.push(
        { role: 'fileMenu' },
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
