import { Rarity } from './types';

export const RARITY_CONFIG: Record<Rarity, { name: string; color: string; chance: number; effectIntensity: number }> = {
  Common: { name: '일반', color: '#909090', chance: 0.60, effectIntensity: 0 },
  Rare: { name: '레어', color: '#00a0ff', chance: 0.25, effectIntensity: 1 },
  Epic: { name: '에픽', color: '#b000ff', chance: 0.10, effectIntensity: 3 },
  Legendary: { name: '전설', color: '#ffcc00', chance: 0.04, effectIntensity: 5 },
  Mythic: { name: '신화', color: '#ff0050', chance: 0.008, effectIntensity: 10 },
  Ancient: { name: '고대', color: '#00ffa0', chance: 0.0015, effectIntensity: 20 },
  God: { name: '신의', color: '#ffffff', chance: 0.0005, effectIntensity: 50 },
};

export type GachaTier = 'basic' | 'advanced' | 'supreme';

export const GACHA_CONFIG: Record<GachaTier, { name: string; cost: number; chances: Record<Rarity, number> }> = {
  basic: {
    name: '하급 뽑기',
    cost: 50,
    chances: {
      Common: 0.65, Rare: 0.20, Epic: 0.10, Legendary: 0.04, Mythic: 0.01, Ancient: 0, God: 0
    }
  },
  advanced: {
    name: '중급 뽑기',
    cost: 500,
    chances: {
      Common: 0.15, Rare: 0.35, Epic: 0.30, Legendary: 0.15, Mythic: 0.05, Ancient: 0, God: 0
    }
  },
  supreme: {
    name: '상급 뽑기',
    cost: 5000,
    chances: {
      Common: 0, Rare: 0, Epic: 0, Legendary: 0, Mythic: 0, Ancient: 0, God: 1.0
    }
  }
};

export const SETS = ['유적', '심연', '노바', '공허', '타이탄', '제니스', '새벽', '황혼'];

export const GEAR_NAMES: Record<'weapon' | 'armor', string[]> = {
  weapon: ['검', '대검', '지팡이', '단검', '활', '도끼', '창', '망치'],
  armor: ['갑옷', '흉갑', '망토', '의복', '판금', '가죽', '슈트', '로브'],
};

export const MONSTERS = [
  { name: '슬라임', hp: 20, atk: 1, gold: 10, exp: 5 },
  { name: '고블린', hp: 60, atk: 3, gold: 25, exp: 12 },
  { name: '스켈레톤', hp: 150, atk: 7, gold: 60, exp: 30 },
  { name: '오크', hp: 400, atk: 15, gold: 150, exp: 80 },
  { name: '드래곤', hp: 1200, atk: 40, gold: 500, exp: 250 },
  { name: '공허의 망령', hp: 5000, atk: 150, gold: 2000, exp: 1000 },
];
