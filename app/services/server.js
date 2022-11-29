const Express = require('express');
const app = Express();
const router = Express.Router();
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const WebSocketServer = require('ws');
const clc = require('cli-color');
const Crypto = require("../helper/Crypto");
const StringHelper = require("../helper/String");
let EventEmitter = require('events').EventEmitter;

let fileContents = fs.readFileSync('./config.yml', 'utf8');
let appConfig = yaml.load(fileContents);

class Server extends EventEmitter {
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
            let pageId = StringHelper.GenerateRandomString(16);
            res.render('giftNotify', { 
                title: 'Hey', 
                key: Crypto.Encrypt(JSON.stringify({
                    type: "GIFTNOTIFYCLIENT",
                    id: pageId,
                })),
                id: pageId,
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
        let wss = new WebSocketServer.Server({ port: appConfig.websocket_port });
        // Creating connection using websocket
        wss.on("connection", (ws, req) => {
            let arrConnectionKey = req.url.substring(1).split("_");
            if (arrConnectionKey == null)
                return;

            let arrConnectionParamsDecrypt;
            let arrConnectionParams;
            
            try {
                arrConnectionParamsDecrypt = Crypto.Decrypt(arrConnectionKey[1], arrConnectionKey[0]);   
                arrConnectionParams = JSON.parse(arrConnectionParamsDecrypt);
            } catch (error) {
                return;
            }

            let connId = req.headers['sec-websocket-key'];

            this.arrClients[connId] = {
                ws: ws,
                type: arrConnectionParams.type
            };
            console.log(clc.bgYellow.black(`Klien ${arrConnectionParams.type} dengan key ${connId} terhubung.`));

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

    SendMessageByArrType(message, arrType) {
        let arrKeyFound = [];
        Object.keys(this.arrClients).forEach((key) => {
            if (arrType.includes(this.arrClients[key]['type']))
                arrKeyFound.push(this.arrClients[key]);
        });
        arrKeyFound.forEach((items) => {
            items.ws.send(message);
        })  
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