const {app, BrowserWindow, WebContentsView} = require('electron')
const express = require('express')
const server = express();
const RPC = require('@xhayper/discord-rpc');

const RichPresence = require("rich-presence-builder")

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    const win = new BrowserWindow({
        show: false,
        title: 'VATSIM Radar',
        autoHideMenuBar: true,
        tabbingIdentifier: 'vatsim-radar',
        webPreferences: {
            devTools: true,
            nodeIntegration: true,
        }
    })

    win.maximize();
    win.show();

    const view1 = new WebContentsView({
        webPreferences: {
            partition: 'persist:main'
        }
    })
    win.contentView.addChildView(view1)
    view1.webContents.loadURL('https://vatsim-radar.com')
    const size = win.getSize()
    view1.setBounds({x: 0, y: 0, width: size[0], height: size[1]})

    win.on('resize', () => {
        const size = win.getSize()
        view1.setBounds({x: 0, y: 0, width: size[0], height: size[1]})
    })

}

app.whenReady().then(() => {
    createWindow()


})


const client = new RPC.Client({
    clientId: '1229876151602905220'
});

client.on('ready', async () => {
    await client.user?.setActivity({
        name: 'VATSIM',
        details: 'Flying across',
        state: 'Watching traffic'
    });
});

client.login();