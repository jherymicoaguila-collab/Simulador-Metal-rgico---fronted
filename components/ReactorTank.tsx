import React, { useRef, useEffect } from 'react';
import { SimulationParams } from '../types';

interface Props {
  params: SimulationParams;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  z: number; // Depth for 3D effect (0 to 1)
  vx: number;
  vy: number;
  size: number;
  type: 'rock' | 'gold' | 'bubble';
  state: 'trapped' | 'free' | 'rising';
  parentId?: number; // For gold trapped in rock
  life?: number;
}

const ReactorTank: React.FC<Props> = ({ params }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const nextId = useRef<number>(0);

  // Constants derived from params
  const bubbleRate = Math.max(1, params.h2o2Concentration * 4); // More H2O2 = More bubbles
  const oxidationPower = params.h2o2Concentration / 10; // Probability to liberate gold
  const rockSizeBase = 15 + (100 - params.granulometry) * 0.3; // Coarser granulometry = bigger rocks

  const initParticles = (width: number, height: number) => {
    particles.current = [];
    // Spawn initial rocks with gold
    const rockCount = 50; // Density
    for (let i = 0; i < rockCount; i++) {
      const z = Math.random();
      const size = rockSizeBase * (0.8 + Math.random() * 0.4) * (0.5 + 0.5 * z); // Scale by depth
      const x = Math.random() * width;
      const y = height - Math.random() * (height * 0.3) - 30; // Bottom area
      
      const rockId = nextId.current++;
      
      // The Rock
      particles.current.push({
        id: rockId,
        x, y, z,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size,
        type: 'rock',
        state: 'trapped'
      });

      // The Gold (Trapped)
      // 80% of rocks have gold
      if (Math.random() > 0.2) {
        particles.current.push({
          id: nextId.current++,
          x, y, z, // Same pos
          vx: 0, vy: 0,
          size: size * 0.3, // Gold is smaller
          type: 'gold',
          state: 'trapped',
          parentId: rockId
        });
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const resize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = 500; // Good height for footer view
        initParticles(canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Animation Loop
    const loop = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      // Clear & Background Gradient (Deep Professional Black)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#000000'); // Pure black top
      grad.addColorStop(1, '#080808'); // Very subtle bottom change
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw "Liquid" atmosphere (Subtle Cyan tint for chemical look)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.015)'; 
      ctx.fillRect(0, 0, width, height);

      // Spawn Bubbles based on H2O2
      if (Math.random() < bubbleRate * 0.08) {
        const z = Math.random();
        particles.current.push({
          id: nextId.current++,
          x: Math.random() * width,
          y: height + 10,
          z,
          vx: (Math.random() - 0.5) * 0.5,
          vy: - (1.5 + Math.random() * 2 + params.h2o2Concentration * 0.3), // Speed up with conc
          size: (2 + Math.random() * 3) * (0.8 + 0.4 * z),
          type: 'bubble',
          state: 'rising'
        });
      }

      // Physics & Logic Update
      particles.current.forEach(p => {
        // Movement
        p.x += p.vx;
        p.y += p.vy;

        // Jitter for rocks (brownian-ish)
        if (p.type === 'rock') {
          p.x += Math.sin(Date.now() * 0.001 + p.id) * 0.1;
          p.y += Math.cos(Date.now() * 0.001 + p.id) * 0.1;
          // Constrain to bottom area
          if (p.y < height * 0.65) p.vy += 0.05; // Gravity
          if (p.y > height - 10) p.vy -= 0.05; // Floor bounce
          p.vx *= 0.95;
          p.vy *= 0.95;
        }

        // Gold Logic
        if (p.type === 'gold') {
          if (p.state === 'trapped' && p.parentId !== undefined) {
            // Stick to parent rock
            const parent = particles.current.find(r => r.id === p.parentId);
            if (parent) {
              p.x = parent.x;
              p.y = parent.y;
              p.z = parent.z;
            } else {
              // Parent gone? Free it
              p.state = 'free';
            }
          } else if (p.state === 'free') {
            // Rising logic (Flotation)
            p.vy -= 0.08; // Buoyancy
            if (p.vy < -3) p.vy = -3; // Max speed
            // Wiggle
            p.x += Math.sin(p.y * 0.05) * 0.5;
            
            // Reached surface? (Froth zone)
            if (p.y < 30) {
               p.y = 30;
               p.vy = 0;
               p.vx = (Math.random() - 0.5) * 0.5;
            }
          }
        }

        // Interaction: Bubbles hitting Rocks
        if (p.type === 'bubble') {
           particles.current.forEach(other => {
             if (other.type === 'rock' && Math.abs(other.z - p.z) < 0.2) { // Similar depth
                const dx = p.x - other.x;
                const dy = p.y - other.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < other.size + p.size) {
                  // Collision!
                  // Chance to liberate gold attached to this rock
                  if (Math.random() < oxidationPower * 0.15) {
                     // Find gold attached to this rock
                     const gold = particles.current.find(g => g.type === 'gold' && g.parentId === other.id);
                     if (gold) {
                       gold.state = 'free';
                       gold.parentId = undefined;
                       // Visual kick
                       gold.vy = -1.5; 
                     }
                  }
                }
             }
           });
        }

        // Bubble cleanup
        if (p.type === 'bubble' && p.y < -10) {
          p.life = 0; // Mark for deletion
        }
      });

      // Remove dead particles
      particles.current = particles.current.filter(p => p.life !== 0);

      // Sort by Z for 3D draw order (deepest first)
      particles.current.sort((a, b) => a.z - b.z);

      // DRAWING
      particles.current.forEach(p => {
        const scale = 0.5 + p.z * 1.0; // Perspective scale
        const drawSize = p.size * scale;
        
        ctx.beginPath();
        
        if (p.type === 'rock') {
          // Dark grey matte rock
          const shade = 30 + (p.z * 30);
          ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 5})`; 
          ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'gold') {
          const alpha = p.state === 'free' ? 1 : 0.4; // Dimmer when trapped
          ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
          
          if (p.state === 'free') {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15 * scale;
          } else {
            ctx.shadowBlur = 0;
          }
          
          ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Shine
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x - drawSize*0.3, p.y - drawSize*0.3, drawSize*0.3, 0, Math.PI*2);
          ctx.fill();
        } else if (p.type === 'bubble') {
          // More ethereal blue glow
          ctx.fillStyle = `rgba(34, 211, 238, ${0.1 + p.z * 0.2})`;
          ctx.strokeStyle = `rgba(165, 243, 252, ${0.2 + p.z * 0.3})`;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';
          ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        
        ctx.shadowBlur = 0; // Reset
      });
      
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationRef.current);
  }, [params.h2o2Concentration, params.granulometry]);

  return (
    <div ref={containerRef} className="w-full h-[500px] relative overflow-hidden group">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Overlay Labels */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <div className="text-xs font-mono text-cyan-500 bg-black/50 px-3 py-1 rounded-full border border-cyan-900/50 backdrop-blur-sm inline-block mb-2">
          REACTOR DE OXIDACIÓN AVANZADA
        </div>
        <h3 className="text-white font-bold text-2xl tracking-tighter opacity-80">
          Simulación en Tiempo Real
        </h3>
      </div>
      
      <div className="absolute bottom-6 left-6 text-gray-500 text-xs font-mono pointer-events-none flex flex-col gap-1 bg-black/40 p-3 rounded-lg border border-white/5 backdrop-blur-md">
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2 shadow-[0_0_8px_gold]"></span>
          Oro (Liberado)
        </div>
        <div className="flex items-center">
           <span className="w-2 h-2 rounded-full bg-yellow-400/40 mr-2"></span>
           Oro (Atrapado/Refractario)
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span>
          Matriz Rocosa
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_cyan]"></span>
          Agente Oxidante
        </div>
      </div>
      
      {/* Dynamic Indicators */}
      <div className="absolute top-6 right-6 text-right pointer-events-none space-y-2">
        <div className={`transition-all duration-700 transform ${params.h2o2Concentration > 5 ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
          <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 px-4 py-2 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <p className="font-bold text-sm">⚠️ OXIDACIÓN INTENSIVA</p>
          </div>
        </div>
        <div className={`transition-all duration-700 transform ${params.granulometry < 50 ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg backdrop-blur-md">
            <p className="font-bold text-sm">📉 BAJA LIBERACIÓN</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactorTank;