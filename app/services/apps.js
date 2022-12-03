const { app, BrowserWindow, Menu } = require("electron");
const setupPug = require('electron-pug')
const Server = require("./server");
const notifier = require('node-notifier');
const path = require('path');
const StringHelper = require("../helper/String");
const webProtectCode = StringHelper.GenerateRandomString(32);

class Apps {
    mainWindow;

    constructor(height, width) {
        Menu.setApplicationMenu(false);
    }

    Init = () => {
        app.on("ready", async () => {
            this.CreateWindow();
            try {
                let pug = await setupPug({ pretty: true })
            } catch (err) {
                // Could not initiate 'electron-pug'
            }
        });

        // app.on("resize", function (e, x, y) {
        //      main .setSize(x, y);
        // });

        app.on("window-all-closed", function () {
            if (process.platform !== "darwin") {
                app.quit();
            }
        });

        // app.on("activate", function () {
        //     if (mainWindow === null) {
        //         createWindow();
        //     }
        // });

        const AppServer = new Server;

        AppServer.webProtectCode = webProtectCode;
        AppServer.Start();

        AppServer.on("serverStatus", (status) => {
            if (status.webServer && status.webSocket) {
                // notifier.notify({
                //     title: 'Bstation Live Chat Tools',
                //     message: 'Semua server telah terhubung!',

                // });
                console.log("Semua terhubung");
            }
        });
    }

    CreateWindow = () => {
        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                devTools: true,
            },
            resizable: false,
        });

        this.mainWindow.openDevTools();

        this.mainWindow.loadURL("http://localhost:3000/welcome");
        // this.mainWindow.loadURL(path.join(__dirname, '../static/welcome.pug'))

        this.mainWindow.on("closed", function () {
            this.mainWindow = null;
        });
    }
}

module.exports = Apps;