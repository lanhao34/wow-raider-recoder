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
  
  console.log("Downloading ItemSparse...");
  await page.goto('https://wago.tools/api/casc/db2/ItemSparse/csv?build=latest&locale=zhCN', { waitUntil: 'networkidle0' });
  let text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('ItemSparse.csv', text);
  console.log("ItemSparse size:", text.length);
  
  console.log("Downloading Item...");
  await page.goto('https://wago.tools/api/casc/db2/Item/csv?build=latest', { waitUntil: 'networkidle0' });
  text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('Item.csv', text);
  console.log("Item size:", text.length);

  await browser.close();
})();
