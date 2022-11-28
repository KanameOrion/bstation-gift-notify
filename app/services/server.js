const Express = require('express');
const app = Express();
const router = Express.Router();
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const WebSocketServer = require('ws');
const clc = require('cli-color');
let EventEmitter = require('events').EventEmitter;

let fileContents = fs.readFileSync('./config.yml', 'utf8');
let appConfig = yaml.load(fileContents);

class Server extends EventEmitter {
    #wss;
    ws;
    arrClients = {};

    #status = {
        webServer: false,
        webSocket: false,
    };

    Start() {
        this.Web();
        this.Socket();
    }

    Web() {
        app.set('view engine', 'pug');
        app.set('views','./app/static/views');

        app.get('/giftnotify', function (req, res) {
            // res.sendFile('app/static/giftNotify.html', { root: '.' });
            res.render('giftNotify', { 
                title: 'Hey', 
                message: 'Hello there!',
                configAudio: 'aaa.mp3',
            })
        });

        app.use(Express.static(path.join(__dirname, '../static/assets')));

        //add the router
        app.use('/giftnotify', router);

        app.listen(appConfig.webserver_port, () => {
            console.log(clc.bgGreen.black(`Webserver berhasil berjalan di port ${appConfig.webserver_port}!`));

            this.#status.webServer = true;
            this.emit("serverStatus", this.#status);
        }).on("error", (error) => {
            if (error.code == 'EADDRINUSE') {
                console.log(clc.bgRed.white(`Webserver tidak bisa berjalan di port ${appConfig.webserver_port}! Mohon ganti port untuk webserver.`));
                process.exit();
            }
        });
    }

    Socket() {
        // Creating a new websocket server
        this.#wss = new WebSocketServer.Server({ port: appConfig.websocket_port });
        // Creating connection using websocket
        this.#wss.on("connection", (ws, req) => {
            console.log(clc.bgYellow.black("Klien terhubung."));

            this.ws = ws;
            let requestData = req;
            this.arrClients[req.headers['sec-websocket-key']] = {
                appIns: {},
                ws: ws,
            }

            // sending message
            ws.on("message", (data, req) => {

                // //Check if data is JSON and request something
                // try {
                //     let arrData = JSON.parse(data);
                //     this.RequestHandler(arrData);
                // } catch (e) {
                //     //Noting happened if data is other than JSON
                // }

                console.log(clc.bgYellow.black(`Client has sent us: ${data} ${requestData.headers['sec-websocket-key']}`))
            });
            // handling what to do when clients disconnects from server
            ws.on("close", () => {
                console.log(clc.red("Klien terputus."));
            });
            // handling client connection error
            ws.onerror = function () {
                console.log(clc.bgRed.white("Some Error occurred"))
            }
        }).on('error', (error) => {
            if (error.code == 'EADDRINUSE') {
                console.log(clc.bgRed.white(`Websocket tidak bisa berjalan di port ${appConfig.websocket_port}! Mohon ganti port untuk websocket.`));
                process.exit();
            }
        }).on('listening', () => {
            console.log(clc.bgGreen.black(`Websocket berhasil berjalan di port ${appConfig.websocket_port}!`));

            this.#status.webSocket = true;
            this.emit("serverStatus", this.#status);
        })
    }

    SendMessage(message) {
        if (this.ws != null)
            this.ws.send(message);
    }

    // RequestHandler(data)
    // {
    //     if (this.arrClients.hasOwnProperty("key1"))
    // }

    WrapMessage(message, type) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            if (typeof yourVariable !== 'object' && yourVariable === null)
            {
                console.log(clc.bgRed.white(`Message must be an object or a JSON.`));
                return message;
            }
        }

        return JSON.stringify({
            type: type,
            content: message,
        });
    }
}

module.exports = Server;