import React, { useRef, useEffect } from 'react';

interface GodEffectProps {
  onComplete: () => void;
  onStageChange?: (color: string, intensity: number) => void;
  setName: string;
}

/**
 * REVOLUTIONARY CINEMATIC GOD REVEAL (Hybrid Version)
 * Starts AFTER CrackEffect whiteout.
 * Steps: 
 * 1. Heavy Black Fissures on white screen
 * 2. Burst transition to Space
 * 3. Planet Reveal & Piercing Beam
 * 4. Planet Destruction
 */
export const GodEffect: React.FC<GodEffectProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // --- State & Constants ---
    let frame = 0;
    let stateFrame = 0;
    // States: burst -> gather -> blackhole -> aim -> shoot -> destroy -> end
    let state: 'burst' | 'gather' | 'blackhole' | 'aim' | 'shoot' | 'destroy' | 'end' = 'burst';
    let shake = 0;
    
    // --- Assets ---
    const stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * width, y: Math.random() * height, size: 1 + Math.random() * 2, blink: Math.random() * Math.PI
    }));

    const energyLines = Array.from({ length: 50 }, () => ({
        angle: Math.random() * Math.PI * 2, dist: 500 + Math.random() * 700, speed: 12 + Math.random() * 8, width: 1.5 + Math.random() * 2
    }));

    // Divine Petals (Tsurune style)
    const petals = Array.from({ length: 80 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        speedX: (Math.random() - 0.5) * 2,
        speedY: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI
    }));

    let rafId: number;
    const animate = () => {
      const cx = width / 2; const cy = height / 2;

      // --- Clear & Reset Frame ---
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);

      // --- Background (Sacred Cinematic Void) ---
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 1.2);
      bgGrad.addColorStop(0, '#fff'); 
      bgGrad.addColorStop(0.4, '#f8fafc');
      bgGrad.addColorStop(1, '#1e293b'); 
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);

      // --- DIVINE PETALS LAYER ---
      ctx.fillStyle = '#fff';
      petals.forEach(p => {
          p.y += p.speedY; p.x += Math.sin(frame * 0.02 + p.phase) * p.speedX;
          if (p.y > height) p.y = -20;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(frame * 0.01 + p.phase);
          ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI*2); ctx.fill();
          ctx.restore();
      });
      ctx.globalAlpha = 1;

      stateFrame++; frame++;
      
      // (Shake and movement removed for stability)

      // --- 1. BURST & 2. GATHER ---
      if (state === 'burst') if (stateFrame > 5) { state = 'gather'; stateFrame = 0; }
      if (state === 'gather') {
          const duration = 50; const p = stateFrame / duration;
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          energyLines.forEach(l => {
              const d = l.dist * (1 - p);
              if (d > 0) {
                  ctx.lineWidth = l.width; ctx.beginPath();
                  ctx.moveTo(cx + Math.cos(l.angle) * d, cy + Math.sin(l.angle) * d);
                  ctx.lineTo(cx + Math.cos(l.angle) * (d + 120), cy + Math.sin(l.angle) * (d + 120));
                  ctx.stroke();
              }
          });
          if (stateFrame > duration) { state = 'blackhole'; stateFrame = 0; }
      }

      // --- 3. CINEMATIC BLACK HOLE ---
      if (state === 'blackhole' || state === 'shoot' || state === 'destroy') {
          const p_bh = state === 'blackhole' ? Math.min(1, stateFrame / 40) : 1;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(p_bh * 1.3, p_bh * 1.3);
          
          let split = 0;
          if (state === 'destroy' && stateFrame > 30) {
              split = Math.min(500, (stateFrame - 30) * 45);
          }
          
          const drawBH = (dir: number) => {
              ctx.save(); ctx.translate(dir * split, 0);
              ctx.beginPath(); if(dir === -1) ctx.rect(-1000,-1000,1000,2000); else ctx.rect(0,-1000,1000,2000); ctx.clip();
              
              // 1. Distant Accretion Nebula (Asymmetric)
              ctx.save();
              ctx.rotate(0.3 + Math.sin(frame * 0.01) * 0.05);
              const nebulaGrad = ctx.createRadialGradient(0,0,100, 0,0,350);
              nebulaGrad.addColorStop(0, '#000');
              nebulaGrad.addColorStop(0.2, 'rgba(15, 23, 42, 0.9)');
              nebulaGrad.addColorStop(0.5, 'rgba(30, 41, 59, 0.3)');
              nebulaGrad.addColorStop(1, 'transparent');
              ctx.fillStyle = nebulaGrad;
              ctx.beginPath(); ctx.ellipse(0, 0, 380, 100, 0, 0, Math.PI*2); ctx.fill();
              ctx.restore();

              // 2. Accretion Disk - Internal Flow
              ctx.save();
              ctx.rotate(-0.1);
              for(let i=0; i<6; i++) {
                ctx.strokeStyle = `rgba(15, 23, 42, ${0.4 - i*0.05})`;
                ctx.lineWidth = 1 + Math.random() * 2;
                ctx.beginPath(); 
                ctx.ellipse(0, 0, 200 + i*25 + Math.sin(frame*0.04)*10, 20 + i*8, Math.sin(frame*0.02 + i), 0, Math.PI*2); 
                ctx.stroke();
              }
              ctx.restore();

              // 3. Photon Sphere & Lensing
              const photonGrad = ctx.createRadialGradient(0,0,96, 0,0,110);
              photonGrad.addColorStop(0, '#000');
              photonGrad.addColorStop(0.5, '#475569');
              photonGrad.addColorStop(1, '#000');
              ctx.fillStyle = photonGrad; ctx.beginPath(); ctx.arc(0,0,110,0,Math.PI*2); ctx.fill();

              // 4. Main Lensed Disk Overlay
              ctx.save();
              ctx.rotate(-0.15 + Math.cos(frame*0.015)*0.03);
              ctx.globalAlpha = 0.95;
              ctx.strokeStyle = 'rgba(0,0,0,0.98)'; ctx.lineWidth = 26;
              ctx.beginPath(); ctx.ellipse(0, 0, 290, 30, 0, 0, Math.PI + 0.4); ctx.stroke();
              ctx.restore();
              
              // 5. EVENT HORIZON (Shadow)
              ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0,0,102,0,Math.PI*2); ctx.fill();
              
              ctx.restore();
          };
          drawBH(-1); drawBH(1);
          ctx.restore();
          
          if (state === 'blackhole' && stateFrame > 70) { state = 'aim'; stateFrame = 0; }
      }

      // --- 4. THE CINEMATIC ARCHER (Long Charge & Energy Gathering) ---
      if (state === 'aim') {
          const duration = 150; // Long charging
          const p = Math.min(1, stateFrame / duration);
          ctx.fillStyle = 'rgba(255,255,245, 0.9)'; ctx.fillRect(0,0,width,height);
          
          ctx.save(); ctx.translate(cx + 100, cy + 50); 
          
          // ENERGY GATHERING PARTICLES
          if (stateFrame < duration) {
            for(let i=0; i<15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = (1 - p) * 400 + Math.random() * 50;
                const size = Math.random() * 3 + 1;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath();
                ctx.arc(Math.cos(angle)*dist - 120, Math.sin(angle)*dist, size, 0, Math.PI*2);
                ctx.fill();
            }
          }

          ctx.shadowBlur = (1 - p) * 10; ctx.shadowColor = '#000';
          ctx.fillStyle = '#000';
          // Head
          ctx.beginPath(); ctx.ellipse(50, -220, 30, 40, 0, 0, Math.PI*2); ctx.fill();
          // Torso
          ctx.beginPath(); ctx.moveTo(60, -180); ctx.lineTo(-40, -170); ctx.lineTo(-80, -30); ctx.lineTo(80, -40); ctx.closePath(); ctx.fill();
          // Arm
          ctx.beginPath(); ctx.moveTo(20, -160); ctx.lineTo(120, -130); ctx.lineTo(160, -180); ctx.lineTo(20, -200); ctx.closePath(); ctx.fill();

          // THE DIVINE BOW
          const bowH = 600; const bowX = -120; const drawDist = p * 240;
          ctx.strokeStyle = '#000'; ctx.lineWidth = 14; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bowX, -bowH/2);
          ctx.quadraticCurveTo(bowX - (drawDist*0.3), 0, bowX, bowH/2);
          ctx.stroke();

          // String
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bowX, -bowH/2);
          ctx.lineTo(bowX + drawDist, 0); 
          ctx.lineTo(bowX, bowH/2);
          ctx.stroke();

          // ARROW with Core Glow
          ctx.save();
          ctx.translate(bowX + drawDist, 0); 
          ctx.fillStyle = '#000'; ctx.fillRect(-450, -2.5, 450, 5); 
          ctx.beginPath(); ctx.moveTo(-450, 0); ctx.lineTo(-410, -10); ctx.lineTo(-410, 10); ctx.closePath(); ctx.fill();
          
          // Concentrated Energy Core at Tip
          if (p > 0.5) {
            ctx.beginPath(); ctx.arc(-450, 0, (p-0.5)*40, 0, Math.PI*2);
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();
          }
          ctx.restore();

          ctx.restore();
          
          if (stateFrame > duration) { state = 'shoot'; stateFrame = 0; }
      }

      // --- 5. ULTRA-FAST ARROW FLIGHT & AFTER-IMAGE ---
      if (state === 'shoot') {
          const duration = 12; // Extremely fast
          const p = stateFrame / duration;
          
          // Background Streaks
          ctx.save();
          for(let i=0; i<15; i++) {
              ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
              ctx.lineWidth = 1; const y = (height / 15) * i;
              ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
          }
          ctx.restore();

          // Persistent Trail (After-image)
          const arrowX = (width + 500) - (width + 1000) * p;
          ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 8;
          ctx.beginPath(); ctx.moveTo(width + 500, cy); ctx.lineTo(arrowX, cy); ctx.stroke();
          
          // High Velocity Blur Lines
          for(let i=0; i<5; i++) {
              ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2;
              const offset = (Math.random()-0.5)*40;
              ctx.setLineDash([100, 50]);
              ctx.beginPath(); ctx.moveTo(width, cy + offset); ctx.lineTo(arrowX, cy + offset); ctx.stroke();
              ctx.setLineDash([]);
          }

          // Arrow Head
          ctx.save(); ctx.translate(arrowX, cy);
          ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(40, -12); ctx.lineTo(40, 12); ctx.closePath(); ctx.fill();
          ctx.restore();

          if (stateFrame > duration) { state = 'destroy'; stateFrame = 0; }
      }

      // --- 6. SHATTERING IMPACT (Delayed & Explosive) ---
      if (state === 'destroy') {
          const alpha = Math.min(1, stateFrame / 20);
          
          if (stateFrame > 30) {
              const p_shatter = (stateFrame - 30) / 30;
              if (stateFrame < 35) {
                  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height);
              } else {
                  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fillRect(0,0,width,height);
              }
              
              // Shatter Particles
              ctx.save(); ctx.translate(cx, cy);
              for(let i=0; i<60; i++) {
                  const angle = (i / 60) * Math.PI * 2 + Math.sin(frame * 0.1);
                  const dist = (stateFrame - 30) * (20 + Math.random() * 30);
                  const size = 5 + Math.random() * 15;
                  ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000';
                  ctx.beginPath();
                  ctx.moveTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
                  ctx.lineTo(Math.cos(angle + 0.2) * (dist + size), Math.sin(angle + 0.2) * (dist + size));
                  ctx.lineTo(Math.cos(angle - 0.2) * (dist + size), Math.sin(angle - 0.2) * (dist + size));
                  ctx.fill();
              }
              ctx.restore();
          }

          if (stateFrame > 60) { onComplete(); return; }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => { 
        if (rafId) cancelAnimationFrame(rafId); 
        window.removeEventListener('resize', handleResize); 
    };
  }, [onComplete]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
};
