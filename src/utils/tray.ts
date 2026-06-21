import type { App } from 'electron';
import { BrowserWindow, Menu, Tray } from 'electron';
import { nativeImage } from 'electron/common';

let tray: Tray | undefined;

export function addTray(app: App, createWindow: () => any) {
    const icon = nativeImage.createFromPath('./src/assets/tray-icon.png');
    tray = new Tray(icon);

    function openRadar() {
        const wins = BrowserWindow.getAllWindows();
        if (wins.length === 0) {
            createWindow();
        }
        else {
            wins[0].focus();
        }
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open VATSIM Radar',
            click: openRadar,
        },
        { label: 'Exit', role: 'quit' },
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', openRadar);
    tray.on('double-click', openRadar);
}
