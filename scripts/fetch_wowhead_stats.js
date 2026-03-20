const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Stats mapping based on WoWhead jsonEquip keys
const STAT_MAP = {
  hastrtng: '急速',
  mastrtng: '精通',
  critstrkrtng: '爆击',
  versrtng: '全能',
  int: '智力',
  str: '力量',
  agi: '敏捷',
  sta: '耐力',
};

function formatSecondary(stats) {
  // stats is an object like { mastrtng: 200, hastrtng: 50 }
  const secondaries = [];
  let maxVal = 0;
  for (const [k, v] of Object.entries(stats)) {
    if (['hastrtng', 'mastrtng', 'critstrkrtng', 'versrtng'].includes(k)) {
      secondaries.push({ name: STAT_MAP[k], val: v });
      if (v > maxVal) maxVal = v;
    }
  }
  
  if (secondaries.length === 0) return '';
  
  // Sort descending by value
  secondaries.sort((a, b) => b.val - a.val);
  
  // Format based on relative difference
  if (secondaries.length === 1) return `${secondaries[0].name}+`;
  
  const formatted = secondaries.map(s => {
    // If it's the highest stat, it's +
    // If it's very high (> 1.5x the next highest), it's ++ (only main stat can be ++)
    if (s.val === maxVal) {
      if (s.val > secondaries[1].val * 1.5) return `${s.name}++`;
      return `${s.name}+`;
    } else {
      if (maxVal > s.val * 1.5) return `${s.name}--`;
      return `${s.name}-`;
    }
  });
  
  return formatted.join(' ');
}

(async () => {
  const dataPath = path.join(__dirname, '../packages/shared/src/wow-data.json');
  const wowData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Flatten items
  const allItems = [];
  wowData.raids.forEach(r => r.bosses.forEach(b => b.loot.forEach(l => {
    // avoid duplicates
    if (!allItems.find(i => i.id === l.id)) allItems.push(l);
  })));
  
  console.log(`Starting extraction for ${allItems.length} items...`);
  
  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    if (item.icon && item.secondaryStats) {
      console.log(`Skipping [${item.nameZh || item.name}] - already scraped`);
      continue;
    }
    
    try {
      await page.goto(`https://www.wowhead.com/item=${item.id}&xml`, { waitUntil: 'domcontentloaded' });
      const text = await page.evaluate(() => document.body.innerText);
      
      // Parse Icon
      const iconMatch = text.match(/<icon.*?>([^<]+)<\/icon>/i);
      if (iconMatch) item.icon = iconMatch[1];
      
      // Parse JSON Equip
      const jsonMatch = text.match(/<jsonEquip><\!\[CDATA\[(.*?)\]\]><\/jsonEquip>/is);
      if (jsonMatch) {
         try {
           const jsonEquip = JSON.parse(jsonMatch[1]);
           item.secondaryStats = formatSecondary(jsonEquip);
           item._rawStats = jsonEquip;
           
           // Extract Main Stats
           const mains = [];
           if (jsonEquip.int) mains.push('智力');
           if (jsonEquip.str) mains.push('力量');
           if (jsonEquip.agi) mains.push('敏捷');
           if (mains.length > 0) item.primaryStats = mains.join('/');
           if (jsonEquip.sta) item.stamina = jsonEquip.sta;
           
         } catch(e) { console.error('JSON parse error', e); }
      }
      
      console.log(`[${i+1}/${allItems.length}] Extracted ${item.nameZh || item.name} -> Icon: ${item.icon}, Stats: ${item.secondaryStats}`);
      // Small delay to avoid aggressive rate limits
      await new Promise(r => setTimeout(r, 600));
    } catch(e) {
      console.error(`Error on ${item.id}:`, e.message);
    }
    
    // Periodically save
    if (i % 10 === 0) {
      fs.writeFileSync(dataPath, JSON.stringify(wowData, null, 2));
    }
  }
  
  fs.writeFileSync(dataPath, JSON.stringify(wowData, null, 2));
  console.log('✅ Finished updating wow-data.json!');
  await browser.close();
})();
