import { Rarity, Gear } from '../types';
import { RARITY_CONFIG, SETS, GEAR_NAMES, GACHA_CONFIG, GachaTier } from '../constants';

export const generateGear = (type: 'weapon' | 'armor', tier: GachaTier = 'basic'): Gear => {
  const rarities: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancient', 'God'];
  let rarity: Rarity = 'Common';
  
  const roll = Math.random();
  let cumulative = 0;
  const chances = GACHA_CONFIG[tier].chances;
  for (const r of rarities) {
    cumulative += chances[r];
    if (roll <= cumulative) {
      rarity = r;
      break;
    }
  }

  const rarityIndex = rarities.indexOf(rarity);
  const set = SETS[Math.floor(Math.random() * SETS.length)];
  const gearName = GEAR_NAMES[type][Math.floor(Math.random() * GEAR_NAMES[type].length)];
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG['Common'];
  const name = `${rarityConfig.name} ${set} ${gearName}`;

  // Stats scale with rarity index
  const baseStat = (rarityIndex + 1) * 10 * Math.pow(1.5, rarityIndex);
  const atk = type === 'weapon' ? Math.floor(baseStat * (0.8 + Math.random() * 0.4)) : 0;
  const def = 0; // Simplified for now since user prioritized AtkSpd
  const atkSpd = type === 'armor' ? Math.floor((rarityIndex + 1) * 20 * (0.9 + Math.random() * 0.2)) : 0;

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.floor(Math.random() * 1000)}`,
    name,
    type,
    rarity,
    atk,
    def,
    atkSpd,
    set,
  };
};

export const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
