import type { App } from 'electron';
import { BrowserWindow, Menu, Tray } from 'electron';
import { nativeImage } from 'electron/common';
import * as path from 'node:path';

let tray: Tray | undefined;

const getAssetPath = (app: App, ...parts: string[]) => {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'assets', ...parts)
        : path.join(app.getAppPath(), 'src', 'assets', ...parts);
};

export function addTray(app: App, createWindow: () => any) {
    const icon = nativeImage.createFromPath(getAssetPath(app, 'tray-icon.png'));
    tray = new Tray(icon);

    function openRadar() {
        const wins = BrowserWindow.getAllWindows();
        if (wins.length === 0) {
            createWindow();
        }
        else {
            const win = wins[0];
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
        }
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: `Open ${ app.getName() }`,
            click: openRadar,
        },
        { label: 'Exit', role: 'quit' },
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', openRadar);
    tray.on('double-click', openRadar);
}
