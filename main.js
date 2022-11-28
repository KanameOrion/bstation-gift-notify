const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const Server = require('./app/services/server');
const Livechat = require('./app/services/livechat');

const notifier = require('node-notifier');

(async () => {
    const AppServer = new Server;
    const LivechatServer = new Livechat;

    AppServer.Start();
    LivechatServer.Start();

    AppServer.on("serverStatus", (status) => {
        if (status.webServer && status.webSocket) {
            notifier.notify({
                title: 'Bstation Live Chat Tools',
                message: 'Semua server telah terhubung!',
                
            });
        }
    });
    LivechatServer.on("incomingChat", (message) => {
        AppServer.SendMessage(AppServer.WrapMessage(message, "GIFTNOTIFYCONTENT"));
    });



})();