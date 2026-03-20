import { PrismaClient } from '@prisma/client';

const CLIENT_ID = 'a156eaab-d3b1-40b8-9273-b3fb73009677';
const CLIENT_SECRET = 'lDXbdY3JClt79iSYfJhltFwQtiaGBe6Yor9Ked8j';
const REPORT_CODE = 'mqLBPGYdZ97RJAxT';

const prisma = new PrismaClient();

const classMap: Record<string, string> = {
  'Warrior': 'warrior', 'Paladin': 'paladin', 'Hunter': 'hunter', 'Rogue': 'rogue',
  'Priest': 'priest', 'DeathKnight': 'deathknight', 'Shaman': 'shaman', 'Mage': 'mage',
  'Warlock': 'warlock', 'Monk': 'monk', 'Druid': 'druid', 'DemonHunter': 'demonhunter', 'Evoker': 'evoker'
};
const classZhMap: Record<string, string> = {
  'warrior': '战士', 'paladin': '圣骑士', 'hunter': '猎人', 'rogue': '潜行者',
  'priest': '牧师', 'deathknight': '死亡骑士', 'shaman': '萨满祭司', 'mage': '法师',
  'warlock': '术士', 'monk': '武僧', 'druid': '德鲁伊', 'demonhunter': '恶魔猎手', 'evoker': '唤魔师'
};

async function run() {
  try {
    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://www.warcraftlogs.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!tokenRes.ok) throw new Error(`OAuth failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    const token = (tokenData as any).access_token;

    const query = `
      query {
        reportData {
          report(code: "${REPORT_CODE}") {
            title
            startTime
            endTime
            masterData {
              actors(type: "Player") {
                name
                subType
              }
            }
          }
        }
      }
    `;

    const graphqlRes = await fetch('https://www.warcraftlogs.com/api/v2/client', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    
    if (!graphqlRes.ok) throw new Error(`GraphQL failed: ${graphqlRes.status}`);
    const graphqlData = await graphqlRes.json();
    const report = (graphqlData as any).data.reportData.report;
    
    const dateStr = new Date(report.startTime).toISOString().split('T')[0];
    const players = report.masterData.actors.filter((a: any) => a.subType !== 'Unknown' && a.subType !== 'NPC' && a.name !== 'Unknown');
    
    console.log(`Importing ${players.length} players for ${dateStr}...`);
    
    const memberIds: number[] = [];
    for (const p of players) {
      // Exclude multiple characters with same name but cross-realm by picking first segment
      const name = p.name.split('-')[0];
      const c = classMap[p.subType] || 'warrior';
      
      let member = await prisma.member.findFirst({ where: { displayName: name } });
      if (!member) {
        member = await prisma.member.create({
          data: {
            displayName: name,
            wowClass: c,
            wowClassZh: classZhMap[c] || '未知',
            status: 'active',
            source: 'created'
          }
        });
        console.log(`Created new member: ${name} (${classZhMap[c]})`);
      }
      memberIds.push(member.id);
    }

    const eventDate = new Date(dateStr);
    const dayNum = eventDate.getDay() || 7;
    eventDate.setDate(eventDate.getDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(eventDate.getFullYear(), 0, 1));
    const weekNo = Math.ceil((((eventDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const weekId = `${eventDate.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;

    let admin = await prisma.user.findFirst({ where: { isAdmin: true } });
    if (!admin) {
      admin = await prisma.user.findFirst();
    }
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          username: "sysadmin",
          passwordHash: "dummyhash",
          displayName: "System Admin",
          isAdmin: true
        }
      });
    }
    const createdBy = admin.id;

    const schedule = await prisma.raidSchedule.create({
      data: {
        date: dateStr,
        weekId,
        note: `WCL 自动导入: ${report.title}`,
        createdBy: createdBy,
        participantIds: JSON.stringify(memberIds),
      }
    });

    // Attach Voidspire (raid_1307)
    await prisma.scheduleRaid.create({
      data: {
        scheduleId: schedule.id,
        raidId: "raid_1307",
        raidName: "虚影尖塔",
        difficulty: "normal"
      }
    });

    // Attach Dream Rift (raid_1314) because 12.0 logs span multiple mini-raids
    await prisma.scheduleRaid.create({
      data: {
        scheduleId: schedule.id,
        raidId: "raid_1314",
        raidName: "梦境裂隙",
        difficulty: "normal"
      }
    });

    console.log(`Schedule created successfully! Schedule ID: ${schedule.id}`);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
