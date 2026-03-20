const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log("Fetching Wowhead XML for item 212395...");
  await page.goto('https://www.wowhead.com/item=212395&xml', { waitUntil: 'domcontentloaded' });
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 1500));

  await browser.close();
})();
