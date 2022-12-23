const puppeteer = require('puppeteer');
const fs = require('fs');
const print = console.log;

const sleep = async (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

async function ProxyInfo(proxy) {
    return { url: `${proxy.split(':')[0]}:${proxy.split(':')[1]}`, ussername: proxy.split(':')[2], password: proxy.split(':')[3] };
};

async function ProxyAuth(url, proxy, browserPath) {
    const proxty = await ProxyInfo(proxy);
    const browser = await puppeteer.launch(
        {
            headless: false, defaultViewport: null, executablePath: browserPath,
            args: [
                `--proxy-server=${proxty.url}`,
                '--start-maximized',
                '--disable-notifications',
                '--disable-infobars',
                '--disable-extensions',
                '--disable-features=site-per-process',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        }
    );
    const page = await browser.newPage();
    await page.authenticate({ username: proxty.ussername, password: proxty.password });
    await page.goto(url, { timeout: 0 });
    print("Page loaded");
    await page.reload({ timeout: 0 });
    print("Page reloaded");
    await page.waitForSelector(".favorite-button");
    await page.click(".favorite-button");
    print("Clicked favorite button");
    await page.waitForSelector("ul[role='tablist'] > li > button");
    await page.click("ul[role='tablist'] > li > button");
    print("Clicked swap button");
    await page.waitForSelector(".btn.swap-button.ng-tns-c161-3.ng-star-inserted");
    await page.click(".btn.swap-button.ng-tns-c161-3.ng-star-inserted");
    print("Clicked trade button");
    await page.waitForSelector(".social-icons");
    const sociallinks1 = await page.evaluate(() => {
        const links = document.querySelectorAll(".social-icons > div > a");
        return Array.from(links).map(link => link.href);
    });
    const sociallinks2 = await page.evaluate(() => {
        const links = document.querySelectorAll(".social-icons > a");
        return Array.from(links).map(link => link.href);
    });
    const sociallinks = sociallinks1.concat(sociallinks2);
    for (const iterator of sociallinks) {
        const page = await browser.newPage();
        try {
            await page.goto(iterator, { timeout: 5000 });
            await page.close();
        }
        catch{}
    }
    print("All social media links opened");
    await browser.close();
    print(`Done with ${proxty.url}:${proxty.ussername}:${proxty.password}`)
}

(async () => {
    if (!fs.existsSync('proxy.conf') || fs.readFileSync('proxy.conf', 'utf8').length == 0) {
        print("proxy.conf not found or empty");
        return;
    }
    if (!fs.existsSync('dextools.json') || fs.readFileSync('dextools.json', 'utf8').length == 0) {
        print("dextools.json not found or empty");
        return;
    }

    const proxies = fs.readFileSync('proxy.conf', 'utf8').split('\n');
    const settings = JSON.parse(fs.readFileSync('dextools.json', 'utf8'));

    for (let index = 0; index < settings.proxyNumber; index++) {
        print(`Trying : ${proxies[index % proxies.length]}`);
        ProxyAuth(settings.url, proxies[index % proxies.length], settings.browserPath);
        if ((index % proxies.length + 1) % settings.numOfBrowsers == 0) {
            await sleep(settings.delayTime * 60 * 1000);
        }
    }
})()