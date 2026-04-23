/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Ancient' | 'God';

export interface Gear {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  rarity: Rarity;
  atk: number;
  def: number;
  atkSpd: number;
  set: string;
}

export interface PlayerState {
  gold: number;
  level: number;
  exp: number;
  equippedWeapon: Gear | null;
  equippedArmor: Gear | null;
  hp: number;
  maxHp: number;
  inventory: Gear[];
}

export interface Monster {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  goldReward: number;
  expReward: number;
  image: string;
  isBoss?: boolean;
}
