const fs = require('fs');
const path = require('path');

const STAT_MAP = {
  hastrtng: '急速',
  mastrtng: '精通',
  critstrkrtng: '暴击',
  versrtng: '全能',
  int: '智力',
  str: '力量',
  agi: '敏捷',
  sta: '耐力',
};

function formatSecondary(stats) {
  const secondaries = [];
  let maxVal = 0;
  for (const [k, v] of Object.entries(stats)) {
    if (['hastrtng', 'mastrtng', 'critstrkrtng', 'versrtng'].includes(k)) {
      secondaries.push({ name: STAT_MAP[k], val: v });
      if (v > maxVal) maxVal = v;
    }
  }
  
  if (secondaries.length === 0) return '';
  secondaries.sort((a, b) => b.val - a.val);
  if (secondaries.length === 1) return `${secondaries[0].name}+`;
  
  const formatted = secondaries.map(s => {
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

async function scrape() {
  const dataPath = path.join(__dirname, '../packages/shared/src/wow-data.json');
  const wowData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const allItems = [];
  wowData.raids.forEach(r => r.bosses.forEach(b => b.loot.forEach(l => {
    if (!allItems.find(i => i.id === l.id)) allItems.push(l);
  })));
  
  console.log(`Starting robust native fetch extraction for ${allItems.length} items...`);
  
  let successCount = 0;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    if (item.icon && item.secondaryStats !== undefined) {
      console.log(`Skipping [${item.nameZh || item.name}] - already scraped`);
      successCount++;
      continue;
    }
    
    try {
      const res = await fetch(`https://cn.wowhead.com/item=${item.id}&xml`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      const text = await res.text();
      
      const iconMatch = text.match(/<icon.*?>([^<]+)<\/icon>/i);
      if (iconMatch) item.icon = iconMatch[1];
      
      const jsonMatch = text.match(/<jsonEquip><\!\[CDATA\[(.*?)\]\]><\/jsonEquip>/is);
      if (jsonMatch) {
         let rawJson = jsonMatch[1].trim();
         const firstBrace = rawJson.indexOf('{');
         const lastBrace = rawJson.lastIndexOf('}');
         if (firstBrace !== -1 && lastBrace !== -1) {
            rawJson = rawJson.substring(firstBrace, lastBrace + 1);
            try {
              const jsonEquip = JSON.parse(rawJson);
              item.secondaryStats = formatSecondary(jsonEquip);
              item._rawStats = jsonEquip;
              
              const mains = [];
              if (jsonEquip.int) mains.push('智力');
              if (jsonEquip.str) mains.push('力量');
              if (jsonEquip.agi) mains.push('敏捷');
              if (mains.length > 0) item.primaryStats = mains.join('/');
              if (jsonEquip.sta) item.stamina = jsonEquip.sta;
            } catch(e) { console.error(`[${item.id}] JSON parse error`, e.message); }
         }
      } else {
         // No jsonEquip usually means it's a trinket or weird item. Set to empty string so we don't scrape it again.
         item.secondaryStats = '';
      }
      
      console.log(`[${i+1}/${allItems.length}] Extracted ${item.nameZh || item.name} -> Icon: ${item.icon}, Stats: ${item.secondaryStats}`);
      successCount++;
      // Sleep to avoid rate limit
      await new Promise(r => setTimeout(r, 800));
    } catch(e) {
      console.error(`Error on ${item.id}:`, e.message);
    }
    
    if (i % 10 === 0) fs.writeFileSync(dataPath, JSON.stringify(wowData, null, 2));
  }
  
  fs.writeFileSync(dataPath, JSON.stringify(wowData, null, 2));
  console.log(`✅ Finished updating wow-data.json natively! (${successCount}/${allItems.length} successful)`);
}

scrape();
