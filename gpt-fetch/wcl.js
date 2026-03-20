const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  console.log("Browser launched. Opening page...");
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await page.goto('https://www.warcraftlogs.com/reports/mqLBPGYdZ97RJAxT?view=rankings&boss=-2&difficulty=0&wipes=2', { waitUntil: 'domcontentloaded' });
    console.log("Page domcontentloaded. Waiting 8 seconds for JS render / Cloudflare...");
    await new Promise(r => setTimeout(r, 8000));
    
    const text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('wcl_output.txt', text);
    console.log("Dumped to wcl_output.txt. Length:", text.length);
  } catch(e) {
    console.error("Error:", e);
  }
  
  await browser.close();
})();
