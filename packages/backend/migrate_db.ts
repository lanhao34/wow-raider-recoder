import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RAID_MAP: Record<string, string> = {
  'voidspire': 'raid_1307',
  'dream_rift': 'raid_1314'
};

const BOSS_MAP: Record<string, string> = {
  'averzian': 'boss_2733',
  'vorasius': 'boss_2734',
  'salhadaar': 'boss_2736',
  'vaelgor_ezzorak': 'boss_2735',
  'vanguard': 'boss_2737',
  'alleria': 'boss_2738'
};

async function run() {
  try {
    for (const [oldId, newId] of Object.entries(RAID_MAP)) {
      const res = await prisma.scheduleRaid.updateMany({
        where: { raidId: oldId },
        data: { raidId: newId }
      });
      console.log(`Updated ${res.count} ScheduleRaid records: ${oldId} -> ${newId}`);
    }

    for (const [oldId, newId] of Object.entries(BOSS_MAP)) {
      const res = await prisma.raidKill.updateMany({
        where: { bossId: oldId },
        data: { bossId: newId }
      });
      console.log(`Updated ${res.count} RaidKill records: ${oldId} -> ${newId}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
