import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Rarity } from '../types';
import { RARITY_CONFIG } from '../constants';

interface CrackEffectProps {
  rarity: Rarity;
  onComplete: () => void;
  onStageChange?: (color: string, intensity: number) => void;
}

export const CrackEffect: React.FC<CrackEffectProps> = ({ rarity, onComplete, onStageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raritiesOrder: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ancient', 'God'];
  const rarityIndex = raritiesOrder.indexOf(rarity);
  const intensity = RARITY_CONFIG[rarity].effectIntensity;
  const finalColor = RARITY_CONFIG[rarity].color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: Particle[] = [];
    let cracks: Crack[] = [];
    let frame = 0;
    
    // Stage thresholds (frames) - 1s per stage at 60fps
    const STAGE_INTERVAL = 60; 
    
    // Rarity Color Sequence
    const COLOR_SEQUENCE = [
      '#9ca3af', // Common (0)
      '#3b82f6', // Rare (1)
      '#a855f7', // Epic (2)
      '#eab308', // Legendary (3)
      '#ef4444', // Mythic (4)
      '#10b981', // Ancient (5)
      '#ffffff', // God (6)
    ];

    // Determine how many stages to show
    const startStage = 0;
    const totalStages = rarityIndex + 1;
    const maxFrames = STAGE_INTERVAL * totalStages + 30; // Further reduced for speed

    class Particle {
      x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string;
      constructor(x: number, y: number, color: string, speedMult: number) {
        this.x = x; this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 3 + 3) * speedMult * (1 + rarityIndex * 0.2);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.maxLife = Math.random() * 30 + 10;
        this.life = this.maxLife;
        this.color = color;
      }
      update() { this.x += this.vx; this.y += this.vy; this.life--; }
      draw() {
        if (!ctx) return;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const size = rarityIndex >= 5 ? 4 : 2;
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    class Crack {
      x: number; y: number; angle: number; 
      currentLength: number; 
      targetLength: number;
      width: number; 
      branches: number; 
      color: string; 
      growthSpeed: number;
      
      constructor(x: number, y: number, angle: number, targetLength: number, width: number, branches: number, color: string) {
        this.x = x; this.y = y; this.angle = angle;
        this.currentLength = 0;
        this.targetLength = targetLength;
        this.width = width;
        this.branches = branches;
        this.color = color;
        this.growthSpeed = 1 + Math.random() * 2;
      }

      burst(newTargetLength: number, newWidth: number, newColor: string) {
        this.targetLength = newTargetLength;
        this.width = newWidth;
        this.color = newColor;
        this.growthSpeed = 15 + rarityIndex * 5; // Faster for better rarities
      }

      update() {
        if (this.currentLength < this.targetLength) {
          this.currentLength += this.growthSpeed;
          if (this.growthSpeed > 3) this.growthSpeed -= 0.8;
        } else {
          this.currentLength = this.targetLength;
          this.growthSpeed = 0.5;
        }

        if (this.branches > 0 && Math.random() < 0.08 && this.currentLength >= this.targetLength * 0.7) {
          const nextX = this.x + Math.cos(this.angle) * this.currentLength;
          const nextY = this.y + Math.sin(this.angle) * this.currentLength;
          cracks.push(new Crack(
            nextX, nextY,
            this.angle + (Math.random() - 0.5) * 1.5,
            this.targetLength * 0.7,
            this.width * 0.8,
            this.branches - 1,
            this.color
          ));
          this.branches = 0;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.shadowBlur = rarityIndex >= 3 ? 20 : 0;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const endX = this.x + Math.cos(this.angle) * this.currentLength;
        const endY = this.y + Math.sin(this.angle) * this.currentLength;
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    const initCracks = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const numRootCracks = 10 + rarityIndex * 2;
      const initialColor = COLOR_SEQUENCE[startStage];
      
      onStageChange?.(initialColor, startStage);

      for (let i = 0; i < numRootCracks; i++) {
        cracks.push(new Crack(
          centerX, centerY,
          (Math.PI * 2 * i) / numRootCracks + (Math.random() - 0.2),
          40 + rarityIndex * 5,
          2,
          Math.min(5, 1 + rarityIndex),
          initialColor
        ));
      }
    };

    initCracks();

    let currentStageIndex = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Subtle background glow for high rarities
      if (rarityIndex >= 5) {
        const pulse = Math.sin(frame * 0.1) * 0.05 + 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const nextStageIndex = Math.floor(frame / STAGE_INTERVAL);
      if (nextStageIndex > currentStageIndex && nextStageIndex < totalStages) {
        currentStageIndex = nextStageIndex;
        const stageRarityIndex = startStage + currentStageIndex;
        const stageColor = COLOR_SEQUENCE[stageRarityIndex];
        
        onStageChange?.(stageColor, stageRarityIndex);

        const growthMult = 1.35 + (rarityIndex * 0.05); // Slower growth
        
        cracks.forEach(c => {
          let nextLength = c.targetLength * growthMult;
          
          // For Ancient and God, make sure the final result fills the screen
          if (stageRarityIndex === rarityIndex && rarityIndex >= 5) {
            nextLength = Math.max(canvas.width, canvas.height);
          }
          
          c.burst(nextLength, c.width * 1.5, stageColor);
        });

        for (let i = 0; i < 40 + rarityIndex * 10; i++) {
          particles.push(new Particle(canvas.width / 2, canvas.height / 2, stageColor, 3 + currentStageIndex));
        }
      }

      if (Math.random() < 0.2 + rarityIndex * 0.1) {
        particles.push(new Particle(canvas.width / 2, canvas.height / 2, COLOR_SEQUENCE[startStage + currentStageIndex], 1));
      }

      cracks.forEach(c => {
        c.update();
        c.draw();
      });

      particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
      });

      // God Flash
      if (rarity === 'God' && frame > maxFrames - 15) {
        ctx.fillStyle = 'white';
        ctx.globalAlpha = (15 - (maxFrames - frame)) / 15;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();
  }, [intensity, rarity, onComplete, finalColor, rarityIndex, onStageChange]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ filter: intensity > 10 ? 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' : 'none' }}
    />
  );
};
