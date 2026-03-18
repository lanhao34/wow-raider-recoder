export * from './types';
export * from './equipmentData';

// Re-export SLOT_NAMES from types (not from equipmentData to avoid conflict)
export { SLOT_NAMES } from './types';

// Re-export WoWItem type
export type { WoWItem, WoWBoss, WoWRaid } from './equipmentData';
