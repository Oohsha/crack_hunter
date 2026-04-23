/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Shield, 
  ShieldCheck, 
  Coins, 
  Trophy, 
  Package, 
  Zap, 
  Info,
  ChevronRight,
  Sparkles,
  Dna
} from 'lucide-react';
import { PlayerState, Monster, Gear, Rarity } from './types';
import { MONSTERS, RARITY_CONFIG, GACHA_CONFIG, GachaTier } from './constants';
import { generateGear, formatNumber } from './utils/gameUtils';
import { CrackEffect } from './components/CrackEffect';
import { GodEffect } from './components/GodEffect';

export default function App() {
  // --- State ---
  const [player, setPlayer] = useState<PlayerState>({
    gold: 999999999,
    level: 1,
    exp: 0,
    equippedWeapon: null,
    equippedArmor: null,
    hp: 100,
    maxHp: 100,
    inventory: [],
  });

  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const [unlockedMonsterIndex, setUnlockedMonsterIndex] = useState(0);
  const [monster, setMonster] = useState<Monster | null>(null);
  const [monstersKilledInStage, setMonstersKilledInStage] = useState(0);
  const [isBossStage, setIsBossStage] = useState(false);
  const [bossTimer, setBossTimer] = useState(7);
  const [battleLog, setBattleLog] = useState<{ text: string; id: string }[]>([]);
  const [isGachaActive, setIsGachaActive] = useState(false);
  const [gachaResults, setGachaResults] = useState<Gear[]>([]);
  const [activeCrackRarity, setActiveCrackRarity] = useState<Rarity | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [currentEffectRarityIndex, setCurrentEffectRarityIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'inventory' | 'shop'>('inventory');
  const [gachaBorderColor, setGachaBorderColor] = useState<string>('transparent');
  const [currentGodEffectGear, setCurrentGodEffectGear] = useState<Gear | null>(null);
  const [isGodCinematicRunning, setIsGodCinematicRunning] = useState(false);

  // --- Derived Stats ---
  const setBonusActive = useMemo(() => {
    return !!(player.equippedWeapon && player.equippedArmor && player.equippedWeapon.set === player.equippedArmor.set);
  }, [player]);

  const rarityBonus = useMemo(() => {
    if (!setBonusActive || !player.equippedWeapon || !player.equippedArmor) return 1.0;
    
    const rarities: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancient', 'God'];
    const weaponIdx = rarities.indexOf(player.equippedWeapon.rarity);
    const armorIdx = rarities.indexOf(player.equippedArmor.rarity);
    
    // Average rarity index + base multiplier
    // Common/Common: 20%, God/God: 140%
    const avgIdx = (weaponIdx + armorIdx) / 2;
    return 1.2 + (avgIdx * 0.2);
  }, [player.equippedWeapon, player.equippedArmor, setBonusActive]);

  const playerAtk = useMemo(() => {
    const base = 10 + player.level * 5;
    const gearAtk = player.equippedWeapon?.atk || 0;
    let total = base + gearAtk;
    
    // 세트 효과: 등급에 따라 변동 (20% ~ 140% 증가)
    if (setBonusActive) {
      total = Math.floor(total * rarityBonus);
    }
    return total;
  }, [player, setBonusActive, rarityBonus]);

  const playerAtkSpd = useMemo(() => {
    const baseSpd = 0;
    const gearSpd = player.equippedArmor?.atkSpd || 0;
    let total = baseSpd + gearSpd;
    
    // 세트 효과: 등급에 따라 변동 (15% ~ 100% 증가)
    if (setBonusActive) {
      const spdBonus = 1.15 + (rarityBonus - 1.2) * 0.7; 
      total = Math.floor(total * spdBonus);
    }
    return total;
  }, [player, setBonusActive, rarityBonus]);

  const attackIntervalMs = useMemo(() => {
    return Math.max(200, 1000 / (1 + playerAtkSpd / 100));
  }, [playerAtkSpd]);

  // --- Combat Logic ---
  const spawnMonster = useCallback(() => {
    const baseM = MONSTERS[currentMonsterIndex];
    if (!baseM) return;
    
    const isBoss = monstersKilledInStage >= 10;
    const scaling = 1 + (player.level - 1) * 0.2 + (isBoss ? 3 : 0);
    
    setMonster({
      name: isBoss ? `[BOSS] ${baseM.name}` : `${baseM.name} (Lv.${player.level})`,
      hp: Math.floor(baseM.hp * scaling),
      maxHp: Math.floor(baseM.hp * scaling),
      atk: Math.floor(baseM.atk * scaling),
      goldReward: Math.floor(baseM.gold * scaling * (isBoss ? 5 : 1)),
      expReward: Math.floor(baseM.exp * scaling * (isBoss ? 5 : 1)),
      image: `https://picsum.photos/seed/${baseM.name}${isBoss ? 'boss' : ''}/200/200`,
      isBoss,
    });
    setIsBossStage(isBoss);
  }, [currentMonsterIndex, player.level, monstersKilledInStage]);

  useEffect(() => {
    spawnMonster();
    if (monstersKilledInStage >= 10) {
      setBossTimer(7);
    }
  }, [spawnMonster, monstersKilledInStage]);

  // 보스 타이머 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBossStage && monster && !isGachaActive) {
      timer = setInterval(() => {
        setBossTimer(prev => {
          if (prev <= 1) {
            // 시간 초과: 보스전 실패
            setMonstersKilledInStage(0);
            setBattleLog(l => [{ text: `보스 토벌 실패! (시간 초과)`, id: `fail-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }, ...l]);
            return 7;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBossStage, monster, isGachaActive]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!monster || isGachaActive) return;

      setMonster(prev => {
        if (!prev) return null;
        const newHp = Math.max(0, prev.hp - playerAtk);
        if (newHp <= 0) {
          // 처치 완료
          setPlayer(p => ({
            ...p,
            gold: p.gold + prev.goldReward,
            exp: p.exp + prev.expReward,
          }));
          
          setBattleLog(prevLog => [
            { text: `${prev?.name || '몬스터'} 처치! +${prev?.goldReward || 0}골드`, id: `kill-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` },
            ...prevLog.slice(0, 4)
          ]);

          if (prev.isBoss) {
            setMonstersKilledInStage(0);
            if (currentMonsterIndex === unlockedMonsterIndex) {
              if (currentMonsterIndex < MONSTERS.length - 1) {
                setUnlockedMonsterIndex(idx => idx + 1);
                // 자동 이동은 하지 않고 해금만 하거나, 원하면 이동 코드 유지
                setCurrentMonsterIndex(idx => idx + 1);
                setBattleLog(l => [{ text: `새로운 지역 발견!`, id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }, ...l]);
              }
            } else {
              // 이미 해금된 지역에서 보스를 잡은 경우
              setBattleLog(l => [{ text: `보스 재처치 완료!`, id: `reboss-${Date.now()}-${Math.random()}` }, ...l]);
            }
          } else {
            setMonstersKilledInStage(count => count + 1);
          }
          return null;
        }
        return { ...prev, hp: newHp };
      });
    }, attackIntervalMs);

    return () => clearInterval(interval);
  }, [monster, playerAtk, isGachaActive, attackIntervalMs, currentMonsterIndex, unlockedMonsterIndex]);

  useEffect(() => {
    if (!monster) {
      spawnMonster();
    }
  }, [monster, spawnMonster]);

  // 레벨업
  useEffect(() => {
    const expNeeded = player.level * 100;
    if (player.exp >= expNeeded) {
      setPlayer(p => ({
        ...p,
        level: p.level + 1,
        exp: p.exp - expNeeded,
        maxHp: p.maxHp + 20,
        hp: p.maxHp + 20,
      }));
      setBattleLog(prevLog => [
        { text: `레벨 업! (LV.${player.level + 1})`, id: `lvup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` },
        ...prevLog.slice(0, 4)
      ]);
    }
  }, [player.exp, player.level]);

  // --- Gacha Logic ---
  const pullGacha = (count: number, type: 'weapon' | 'armor', tier: GachaTier = 'basic') => {
    const config = GACHA_CONFIG[tier];
    const cost = count * config.cost;
    if (player.gold < cost) return;

    setPlayer(p => ({ ...p, gold: p.gold - cost }));
    setIsGachaActive(true);
    setShowResults(false);
    setIsGodCinematicRunning(false);

    const pullResults = Array.from({ length: count }, () => generateGear(type, tier));
    setGachaResults(pullResults);

    // Find highest rarity for effect
    const rarities: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancient', 'God'];
    let topRarity: Rarity = 'Common';
    let topGear: Gear | null = null;

    for (const item of pullResults) {
      if (rarities.indexOf(item.rarity) >= rarities.indexOf(topRarity)) {
        topRarity = item.rarity;
        topGear = item;
      }
    }

    if (topRarity === 'God') {
      setCurrentGodEffectGear(topGear);
    } else {
      setCurrentGodEffectGear(null);
    }

    // 1초 뒤에 균열 효과 시작 (암전 후 긴장감 조성)
    setIsShaking(true);
    setCurrentEffectRarityIndex(0); 
    
    setTimeout(() => {
      setActiveCrackRarity(topRarity);
    }, 1000);
  };

  const equipGear = (gear: Gear) => {
    setPlayer(p => {
      const isWeapon = gear.type === 'weapon';
      const currentEquipped = isWeapon ? p.equippedWeapon : p.equippedArmor;
      
      let newInventory = p.inventory.filter(i => i.id !== gear.id);
      if (currentEquipped) {
        newInventory = [...newInventory, currentEquipped];
      }

      return {
        ...p,
        equippedWeapon: isWeapon ? gear : p.equippedWeapon,
        equippedArmor: !isWeapon ? gear : p.equippedArmor,
        inventory: newInventory,
      };
    });
  };

  const sellGear = (gear: Gear) => {
    const rarities: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancient', 'God'];
    const price = (rarities.indexOf(gear.rarity) + 1) * 20;
    setPlayer(p => ({
      ...p,
      gold: p.gold + price,
      inventory: p.inventory.filter(i => i.id !== gear.id)
    }));
  };

  const handleCrackComplete = useCallback(() => {
    if (activeCrackRarity === 'God') {
      // Transition to cinematic
      setIsGodCinematicRunning(true);
      setActiveCrackRarity(null);
      setIsShaking(false); // Stop the global CSS shake here
    } else {
      setActiveCrackRarity(null);
      setCurrentGodEffectGear(null);
      setShowResults(true);
      setIsShaking(false);
      setCurrentEffectRarityIndex(-1);
      setGachaBorderColor('transparent');
    }
  }, [activeCrackRarity]);

  const handleGodCinematicComplete = useCallback(() => {
    setIsGodCinematicRunning(false);
    setCurrentGodEffectGear(null);
    setShowResults(true);
    setIsShaking(false);
    setCurrentEffectRarityIndex(-1);
    setGachaBorderColor('transparent');
  }, []);

  const handleStageChange = useCallback((color: string, effectRarityIndex: number) => {
    setGachaBorderColor(color);
    setIsShaking(true);
    setCurrentEffectRarityIndex(effectRarityIndex);
  }, []);

  const closeResults = useCallback(() => {
    // We use setGachaResults to "consume" the items atomically.
    // This prevents double-clicks from adding the same items twice.
    setGachaResults(results => {
      if (results.length === 0) return [];

      setPlayer(p => {
        // Double safety: filter out any potential duplicate IDs already in inventory
        const uniqueNewItems = results.filter(
          newItem => !p.inventory.some(existing => existing.id === newItem.id)
        );
        
        return {
          ...p,
          inventory: [...p.inventory, ...uniqueNewItems]
        };
      });

      return []; // Clear gachaResults immediately
    });

    setIsGachaActive(false);
    setShowResults(false);
  }, []);

  // --- Sub-Components ---
  const rarityColors = useMemo(() => {
    const colors: Record<Rarity, string> = {
      Common: 'text-gray-400',
      Rare: 'text-blue-400',
      Epic: 'text-purple-400',
      Legendary: 'text-yellow-400',
      Mythic: 'text-red-500',
      Ancient: 'text-emerald-400',
      God: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] font-bold',
    };
    return colors;
  }, []);

  const rarityBgs = useMemo(() => {
    const bgs: Record<Rarity, string> = {
      Common: 'bg-gray-800/50',
      Rare: 'bg-blue-900/30 ring-1 ring-blue-500/50',
      Epic: 'bg-purple-900/30 ring-1 ring-purple-500/50',
      Legendary: 'bg-yellow-900/30 ring-1 ring-yellow-500/50',
      Mythic: 'bg-red-900/30 ring-1 ring-red-500/50',
      Ancient: 'bg-emerald-900/30 ring-1 ring-emerald-500/50',
      God: 'bg-white/10 ring-2 ring-white drop-shadow-xl animate-pulse',
    };
    return bgs;
  }, []);

  const shakeClass = useMemo(() => {
    if (!isShaking) return '';
    
    const idx = currentEffectRarityIndex;
    if (idx >= 6) return 'animate-shake-god';
    if (idx >= 4) return 'animate-shake-crazy';
    if (idx >= 2) return 'animate-shake-mild';
    if (idx >= 1) return 'animate-shake-small';
    return idx >= 0 ? 'animate-shake-minimal' : '';
  }, [isShaking, currentEffectRarityIndex]);

  const topRarityColor = useMemo(() => {
    if (gachaResults.length === 0) return 'transparent';
    const rarities: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancient', 'God'];
    let topRarity: Rarity = 'Common';
    gachaResults.forEach(item => {
      if (rarities.indexOf(item.rarity) > rarities.indexOf(topRarity)) {
        topRarity = item.rarity;
      }
    });
    return RARITY_CONFIG[topRarity].color;
  }, [gachaResults]);

  return (
    <div className={`fixed inset-0 bg-[#050505] text-[#e5e7eb] font-sans overflow-hidden select-none border-4 ${shakeClass}`} style={{ borderColor: isGachaActive ? (showResults ? topRarityColor : (activeCrackRarity ? gachaBorderColor : 'transparent')) : '#1a1a1a' }}>
      {/* 뽑기 진행 중 검은 화면 레이어 */}
      <AnimatePresence>
        {isGachaActive && !showResults && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[40] bg-black"
          />
        )}
      </AnimatePresence>

      {/* 소환 효과 (균열 or 갓 애니메이션) */}
      <AnimatePresence>
        {activeCrackRarity && (
          <CrackEffect 
            rarity={activeCrackRarity} 
            onComplete={handleCrackComplete} 
            onStageChange={handleStageChange}
          />
        )}
        {isGodCinematicRunning && currentGodEffectGear && (
          <GodEffect 
            setName={currentGodEffectGear.set || '공허'}
            onComplete={handleGodCinematicComplete} 
          />
        )}
      </AnimatePresence>

      {/* Modern Layout following "Artistic Flair" */}
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-[#0a0a0a] border-b border-[#222]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-[#fbbf24] flex items-center justify-center bg-black">
              <span className="text-[#fbbf24] font-bold text-xs">LV.{player.level}</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter italic text-white uppercase leading-none">Crack: Relic Hunter</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] font-bold mt-1 uppercase">프리 세타 v1.0.0</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-sm font-mono">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">소지금</span>
              <span className="text-[#fbbf24] font-bold">{formatNumber(player.gold)} G</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">전투력</span>
              <span className="text-[#06b6d4] font-bold italic underline">{formatNumber(playerAtk)} CP</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 overflow-hidden">
          {/* Left Sidebar: Progress & Stages */}
          <aside className="w-64 flex flex-col border-r border-[#222] bg-[#080808]">
            <div className="p-4 border-b border-[#222]">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">현재 탐사 지역</h3>
              <div className="relative overflow-hidden h-32 rounded-lg border border-[#333] group">
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-3 z-20">
                  <p className="text-xs font-bold uppercase text-[#06b6d4]">ZONE_{currentMonsterIndex + 1}</p>
                  <h4 className="text-lg font-black italic">{monster ? monster.name.split(' (')[0].replace('[BOSS] ', '') : '대기 중...'}</h4>
                </div>
                <img 
                  src={monster?.image || undefined} 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-1000 grayscale" 
                  alt="zone" 
                />
                <div className="absolute top-0 right-0 w-12 h-12 bg-[#222] rotate-45 translate-x-6 -translate-y-6"></div>
              </div>
            </div>
            
            <div className="p-4 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">사냥터 리스트</h3>
              <div className="space-y-1">
                {MONSTERS.map((m, idx) => {
                  const isUnlocked = idx <= unlockedMonsterIndex;
                  const isActive = idx === currentMonsterIndex;
                  return (
                    <button 
                      key={m.name}
                      onClick={() => isUnlocked && setCurrentMonsterIndex(idx)}
                      disabled={!isUnlocked}
                      className={`w-full p-3 rounded border transition-all flex items-center justify-between text-left ${
                        isActive 
                          ? 'bg-white text-black border-white' 
                          : isUnlocked 
                            ? 'border-[#222] bg-black/40 text-gray-300 hover:border-white/50' 
                            : 'border-[#111] opacity-20 pointer-events-none'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono opacity-50">0{idx + 1}</span>
                        <span className="text-xs font-black italic uppercase">{m.name}</span>
                      </div>
                      {isUnlocked && !isActive && <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full"></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EXP Progress in Aside */}
            <div className="p-4 bg-black border-t border-[#222]">
              <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold mb-1">
                <span>보스 조우까지</span>
                <span>{monstersKilledInStage} / 10</span>
              </div>
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${isBossStage ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-orange-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: isBossStage ? '100%' : `${(monstersKilledInStage / 10) * 100}%` }}
                />
              </div>
            </div>
          </aside>

          {/* Center Stage: Combat */}
          <section className="flex-1 flex flex-col bg-[#050505] p-6 justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <AnimatePresence mode="wait">
              {monster && (
                <motion.div 
                  key={monster.name}
                  className="relative z-10 w-full max-w-md flex flex-col items-center gap-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                >
                  <div className={`w-48 h-48 relative border-4 ${monster.isBoss ? 'border-red-500' : 'border-[#333]'} bg-black/40 rounded-full flex items-center justify-center p-4`}>
                    {monster.isBoss && <div className="absolute inset-0 border-2 border-red-500 animate-ping rounded-full opacity-20"></div>}
                    <div className="text-center relative z-20">
                      <h2 className="text-2xl font-black italic mb-1 uppercase tracking-tighter text-white">{monster?.name?.split(' (')[0].replace('[BOSS] ', '') || ''}</h2>
                      <div className="w-32 h-2 bg-red-950 mx-auto rounded-full overflow-hidden border border-black/50">
                        <motion.div 
                          className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                          initial={{ width: '100%' }}
                          animate={{ width: `${((monster?.hp || 0) / (monster?.maxHp || 1)) * 100}%` }}
                        />
                      </div>
                      {monster.isBoss && (
                        <div className="mt-2 text-center">
                          <p className="text-[10px] text-red-500 font-bold uppercase mb-1">BOSS ENCOUNTER</p>
                          <div className="text-xl font-black text-white italic drop-shadow-[0_0_8px_red]">
                            {bossTimer}s
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl font-black italic text-white flex gap-2 items-baseline">
                      <span className="text-[#ef4444]">{formatNumber(playerAtk)}</span>
                      <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">공격력</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="px-4 py-1 border border-[#333] text-[10px] font-mono text-gray-400 tracking-tighter bg-black/50 uppercase">
                        공속: {playerAtkSpd}%
                      </div>
                      <div className="px-4 py-1 border border-[#333] text-[10px] font-mono text-gray-400 tracking-tighter bg-black/50 uppercase">
                        전투 중...
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Battle Log (Miniified) */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col items-center gap-1 pointer-events-none">
              {battleLog.slice(0, 2).map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1 - i * 0.5, y: 0 }}
                  key={log.id} 
                  className="text-[10px] font-mono text-[#06b6d4] uppercase"
                >
                  &gt; {log.text}
                </motion.div>
              ))}
            </div>
          </section>

          {/* Right Sidebar: Equipment */}
          <aside className="w-80 flex flex-col border-l border-[#222] bg-[#0a0a0a]">
            {/* Equipment Header */}
            <div className="p-6 space-y-6">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500">Equipment Slots</h3>
              
              <div className="space-y-4">
                {/* Weapon Card */}
                <div className={`flex items-center gap-4 p-3 bg-gradient-to-r from-[#111] to-transparent border-l-4 ${player.equippedWeapon ? 'border-[#06b6d4]' : 'border-neutral-800'}`}>
                  <div className={`w-14 h-14 bg-black border ${player.equippedWeapon ? 'border-[#06b6d4]/50' : 'border-neutral-800'} flex items-center justify-center rounded shadow-[0_0_15px_rgba(6,182,212,0.1)]`}>
                    {player.equippedWeapon ? <Sword size={24} className={rarityColors[player.equippedWeapon.rarity]} /> : <Sword size={24} className="opacity-10" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-[10px] uppercase font-bold ${player.equippedWeapon ? 'text-[#06b6d4]' : 'text-neutral-600'}`}>
                      {player.equippedWeapon ? `${player.equippedWeapon.rarity} Weapon` : 'No Weapon'}
                    </p>
                    <p className="text-sm font-bold truncate text-white uppercase italic tracking-tight">
                      {player.equippedWeapon?.name ? player.equippedWeapon.name.split(' ').slice(1).join(' ') : '---'}
                    </p>
                    <div className="flex gap-2 text-[10px] text-gray-500 mt-1 font-mono">
                      <span>ATK +{player.equippedWeapon?.atk || 0}</span>
                      <span className="text-[#06b6d4]">{player.equippedWeapon?.set}</span>
                    </div>
                  </div>
                </div>

                {/* Armor Card */}
                <div className={`flex items-center gap-4 p-3 bg-gradient-to-r from-[#111] to-transparent border-l-4 ${player.equippedArmor ? 'border-[#06b6d4]' : 'border-neutral-800'}`}>
                  <div className={`w-14 h-14 bg-black border ${player.equippedArmor ? 'border-[#06b6d4]/50' : 'border-neutral-800'} flex items-center justify-center rounded shadow-[0_0_15px_rgba(6,182,212,0.1)]`}>
                    {player.equippedArmor ? <Shield size={24} className={rarityColors[player.equippedArmor.rarity]} /> : <Shield size={24} className="opacity-10" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-[10px] uppercase font-bold ${player.equippedArmor ? 'text-[#06b6d4]' : 'text-neutral-600'}`}>
                      {player.equippedArmor ? `${player.equippedArmor.rarity} Armor` : '방어구 없음'}
                    </p>
                    <p className="text-sm font-bold truncate text-white uppercase italic tracking-tight">
                      {player.equippedArmor?.name ? player.equippedArmor.name.split(' ').slice(2).join(' ') : '---'}
                    </p>
                    <div className="flex gap-2 text-[10px] text-gray-500 mt-1 font-mono">
                      <span>공속 +{player.equippedArmor?.atkSpd || 0}%</span>
                      <span className="text-[#06b6d4]">{player.equippedArmor?.set}</span>
                    </div>
                  </div>
                </div>

                {/* Set Bonus Card */}
                {setBonusActive && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 border border-[#06b6d4]/30 bg-[#06b6d4]/5 rounded-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-[#06b6d4] italic uppercase">세트: {player.equippedWeapon?.set} (2/2)</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse"></span>
                    </div>
                    <p className="text-[11px] text-cyan-200/50 italic">
                      공격력 {Math.round((rarityBonus - 1) * 100)}% 증가 / 공격 속도 {Math.round((1.15 + (rarityBonus - 1.2) * 0.7 - 1) * 100)}% 증가
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Sub-Tab Navigation for Inventory */}
            <div className="mt-auto border-t border-[#222]">
               <div className="flex p-2 gap-2">
                 <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 rounded transition-all ${activeTab === 'inventory' ? 'bg-[#111] text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                   가방
                 </button>
                 <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 rounded transition-all ${activeTab === 'shop' ? 'bg-[#111] text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                   분해
                 </button>
               </div>
            </div>
          </aside>
        </main>

        {/* Footer Area: Inventory & Summon */}
        <footer className="h-48 bg-[#080808] border-t-2 border-[#222] p-4 flex gap-4">
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase text-gray-400">가방 (Inventory)</span>
              <span className="text-[10px] font-mono text-gray-500">{player.inventory.length} / 100</span>
            </div>
            <div className="flex-1 grid grid-cols-10 gap-1.5 p-2 bg-black border border-[#1a1a1a] overflow-y-auto custom-scrollbar">
              {player.inventory.length === 0 && (
                <div className="col-span-10 flex items-center justify-center opacity-10 text-[10px] uppercase font-black tracking-widest h-full">인벤토리가 비어있습니다</div>
              )}
              {player.inventory.map(item => (
                <div 
                  key={item.id}
                  className="relative border border-[#222] bg-[#050505] rounded flex flex-col items-center justify-center aspect-square group cursor-pointer hover:border-white/20 transition-all active:scale-95"
                  onClick={() => equipGear(item)}
                >
                  <span className={`text-xl ${rarityColors[item.rarity]} drop-shadow-sm`}>
                    {item.type === 'weapon' ? '🗡️' : '🛡️'}
                  </span>
                  <div className={`absolute bottom-0 w-full h-[3px]`} style={{ backgroundColor: RARITY_CONFIG[item.rarity].color }}></div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); sellGear(item); }} className="w-5 h-5 bg-red-950 flex items-center justify-center rounded border border-red-500/30 shadow-lg">
                      <Coins size={10} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[440px] flex flex-col gap-2 border-l border-[#222] pl-4">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 px-1 font-black">소환 센터 (Summon)</h3>
            <div className="flex-1 grid grid-cols-3 gap-2">
              {(['basic', 'advanced', 'supreme'] as GachaTier[]).map(tier => (
                <div key={tier} className="flex flex-col gap-1.5 h-full">
                  <div className="text-[9px] font-black text-center text-gray-400 truncate tracking-tighter">
                    {GACHA_CONFIG[tier].name}
                  </div>
                  <button 
                    onClick={() => pullGacha(10, 'weapon', tier)}
                    disabled={isGachaActive || player.gold < GACHA_CONFIG[tier].cost * 10}
                    className="flex-1 bg-white hover:bg-neutral-200 text-black font-black uppercase text-[10px] flex flex-col items-center justify-center p-1 transition-all disabled:opacity-30 border-2 border-black active:translate-y-0.5 shadow-md"
                  >
                    <span className="flex items-center gap-1"><Sword size={10} />무기 x10</span>
                    <span className="text-[8px] font-mono mt-0.5">{formatNumber(GACHA_CONFIG[tier].cost * 10)} G</span>
                  </button>
                  <button 
                    onClick={() => pullGacha(10, 'armor', tier)}
                    disabled={isGachaActive || player.gold < GACHA_CONFIG[tier].cost * 10}
                    className="flex-1 bg-red-950/40 border-2 border-red-500/60 text-red-100 font-bold text-[10px] uppercase flex flex-col items-center justify-center transition-all disabled:opacity-30 active:translate-y-0.5 shadow-md"
                  >
                    <span className="flex items-center gap-1"><Shield size={10} />방어구 x10</span>
                    <span className="text-[8px] font-mono mt-0.5 opacity-70">{formatNumber(GACHA_CONFIG[tier].cost * 10)} G</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* Gacha Results Overlay (Themed) */}
      <AnimatePresence>
        {showResults && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 border-[12px] border-[#111]"
          >
            <div className="max-w-4xl w-full">
              <div className="flex items-center gap-4 mb-12">
                <div className="h-[2px] flex-1 bg-white/20" />
                <div className="text-center">
                  <motion.h2 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black italic tracking-tighter uppercase text-white"
                  >
                    소환 결과
                  </motion.h2>
                  <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] mt-2 font-mono">데이터 동기화 완료</p>
                </div>
                <div className="h-[2px] flex-1 bg-white/20" />
              </div>

              <div className="grid grid-cols-5 gap-3">
                {gachaResults.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`aspect-square p-4 border flex flex-col items-center justify-center gap-2 group cursor-default transition-all ${rarityBgs[item.rarity]}`}
                  >
                    <span className="text-2xl">{item.type === 'weapon' ? '🗡️' : '🛡️'}</span>
                    <div className={`text-[9px] font-black italic text-center uppercase tracking-tighter ${rarityColors[item.rarity]}`}>
                       {item.name}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-16 flex justify-center"
              >
                <button 
                  onClick={closeResults}
                  className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest italic text-sm hover:scale-105 active:scale-95 transition-all outline outline-offset-4 outline-white/20"
                >
                  확인
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shake-minimal {
          0% { transform: translate(0.5px, 0.5px); }
          25% { transform: translate(-0.5px, 0.5px); }
          50% { transform: translate(-0.5px, -0.5px); }
          75% { transform: translate(0.5px, -0.5px); }
          100% { transform: translate(0.5px, 0.5px); }
        }
        @keyframes shake-small {
          0% { transform: translate(1px, 1px); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(-1px, -1px); }
          75% { transform: translate(1px, -1px); }
          100% { transform: translate(1px, 1px); }
        }
        @keyframes shake-mild {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-2px, 0px) rotate(1deg); }
          30% { transform: translate(2px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-2px, 1px) rotate(0deg); }
          70% { transform: translate(2px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes shake-crazy {
          0% { transform: translate(2px, 2px) rotate(0deg); }
          10% { transform: translate(-2px, -4px) rotate(-2deg); }
          20% { transform: translate(-6px, 0px) rotate(2deg); }
          30% { transform: translate(6px, 4px) rotate(0deg); }
          40% { transform: translate(2px, -2px) rotate(2deg); }
          50% { transform: translate(-2px, 4px) rotate(-2deg); }
          60% { transform: translate(-6px, 2px) rotate(0deg); }
          70% { transform: translate(6px, 2px) rotate(-2deg); }
          80% { transform: translate(-2px, -2px) rotate(2deg); }
          90% { transform: translate(2px, 4px) rotate(0deg); }
          100% { transform: translate(2px, -4px) rotate(-2deg); }
        }
        @keyframes shake-god {
          0% { transform: translate(4px, 4px) rotate(0deg) scale(1.02); }
          10% { transform: translate(-4px, -8px) rotate(-4deg) scale(0.98); }
          20% { transform: translate(-10px, 0px) rotate(4deg) scale(1.05); }
          30% { transform: translate(10px, 8px) rotate(0deg) scale(1.0); }
          40% { transform: translate(4px, -4px) rotate(4deg) scale(1.08); }
          50% { transform: translate(-4px, 8px) rotate(-4deg) scale(0.95); }
          60% { transform: translate(-10px, 4px) rotate(0deg) scale(1.1); }
          70% { transform: translate(10px, 4px) rotate(-4deg) scale(0.9); }
          80% { transform: translate(-4px, -4px) rotate(4deg) scale(1.05); }
          90% { transform: translate(4px, 8px) rotate(0deg) scale(1.02); }
          100% { transform: translate(4px, -8px) rotate(-4deg) scale(0.98); }
        }
        .animate-shake-minimal { animation: shake-minimal 0.5s infinite; }
        .animate-shake-small { animation: shake-small 0.4s infinite; }
        .animate-shake-mild { animation: shake-mild 0.3s infinite; }
        .animate-shake-crazy { animation: shake-crazy 0.2s infinite; }
        .animate-shake-god { animation: shake-god 0.15s infinite; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
