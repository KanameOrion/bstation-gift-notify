const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const yaml = require('js-yaml');
const fs = require('fs');
let EventEmitter = require('events').EventEmitter;

let fileContents = fs.readFileSync('./config.yml', 'utf8');
let appConfig = yaml.load(fileContents);

class Livechat extends EventEmitter {
    browserDom = "test";
    sendDataSocket;
    refreshTimeoutIntervalObj;
    browser;
    page;

    constructor() {
        super();
    }

    async Start() {
        this.browser = await puppeteer.launch({ headless: false });
        await this.LaunchPage();
    }

    async LaunchPage()
    {
        this.page = await this.browser.newPage();
        await this.page.goto(`https://m.bilibili.tv/h5-single/chat.html?id=${appConfig.live_channel_id}&bgstyle=light`);

        await this.page.exposeFunction('puppeteerLogMutation', (mutation) => {
            const $ = cheerio.load(mutation);
            let authorDom = $(".type-name");
            let authorName = authorDom.text().split(":")[0].trim();

            let messageDom = $(".message-text-part");
            let message = messageDom.eq(1).text().trim();
            console.log("[" + authorName + "]: " + message);

            this.#IdleRefreshHandler();

            this.emit("incomingChat", JSON.stringify(this.#ParsingMessage(mutation)));
        });

        await this.page.evaluate(() => {
            const target = document.querySelector('#items');
            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        puppeteerLogMutation(mutation.addedNodes[0].innerHTML);
                    }
                }
            });
            observer.observe(target, { attributes: false, childList: true, characterData: false, subtree: true });
        });
    }

    #IdleRefreshHandler() {
        if (this.refreshTimeoutIntervalObj != null)
            clearInterval(this.refreshTimeoutIntervalObj);

        this.refreshTimeoutIntervalObj = setInterval(() => {
            this.page.close();
            this.LaunchPage();
        }, (appConfig.observe_livechat_idle_refresh * 1000));
    }

    #ParsingMessage(htmlMessage) {
        let messageReturn = {
            type: "",
            author: "",
            message: "",
            images: "",
            giftType: "",
            giftCount: 0,
        };
        const $ = cheerio.load(htmlMessage);
        let systemMessageDOM = $(".type-system");
        if (systemMessageDOM.length > 0) {
            messageReturn.type = "SYSTEM";
            messageReturn.message = systemMessageDOM.find("span").remove().closest(".type-system").eq(0).text().trim();
            return messageReturn;
        }

        let giftMessageDOM = $(".type-gift");
        if (giftMessageDOM.length > 0) {
            let giftCount = 1;
            let giftCountText = $(".type-giftnum").eq(0).text().trim();
            if (giftCountText != "")
                giftCount = giftCountText.replace(/\D/g, '');

            messageReturn.author = $(".type-name").eq(0).text().split(":")[0].trim();
            messageReturn.type = "GIFT";
            messageReturn.giftType = giftMessageDOM.eq(0).text().trim();
            messageReturn.images = $(".message-icon-part img").eq(0).attr("src");
            messageReturn.giftCount = giftCount;
            return messageReturn;
        }

        let commonMessageDOM = $(".message-item");
        messageReturn.author = commonMessageDOM.eq(0).find(".type-name").eq(0).text().split(":")[0].trim();
        messageReturn.message = commonMessageDOM.eq(0).find(".message-text-part").eq(1).text().trim();
        messageReturn.type = "CHAT";
        return messageReturn;

    }
}

module.exports = Livechat;