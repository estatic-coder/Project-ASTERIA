import { useEffect, useRef } from 'react';

interface Props { onComplete: () => void; }

export default function SplashScreen({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2 - 40; // Shifted up slightly for the wordmark

    let raf: number;
    const startTime = performance.now();

    // ─── Meteors ──────────────────────────────────────────────────
    interface Meteor {
      x: number; y: number; len: number; speed: number; delay: number;
      angle: number; opacity: number; thickness: number;
    }

    const meteors: Meteor[] = [];
    for (let i = 0; i < 20; i++) {
      meteors.push({
        x: Math.random() * W * 1.5 - W * 0.2,
        y: -100 - Math.random() * 400,
        len: 40 + Math.random() * 100,
        speed: 5 + Math.random() * 8,
        delay: Math.random() * 4000,
        angle: Math.PI / 2.5 + (Math.random() - 0.5) * 0.1, // slanted down-right
        opacity: 0.1 + Math.random() * 0.5,
        thickness: 0.5 + Math.random() * 1.0,
      });
    }

    const lateMeteors: Meteor[] = [];
    for (let i = 0; i < 15; i++) {
      lateMeteors.push({
        x: Math.random() * W * 1.5 - W * 0.2,
        y: -100 - Math.random() * 400,
        len: 30 + Math.random() * 80,
        speed: 8 + Math.random() * 10,
        delay: 3500 + Math.random() * 2000,
        angle: Math.PI / 3 + (Math.random() - 0.5) * 0.1,
        opacity: 0.1 + Math.random() * 0.6,
        thickness: 0.5 + Math.random() * 1.5,
      });
    }

    // ─── Background stars ─────────────────────────────────────────
    const bgStars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
      alphaBase: Math.random() * 0.5 + 0.1,
    }));

    // ─── Easing helpers ───────────────────────────────────────────
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

    // ─── Draw 4-pointed star ──────────────────────────────────────
    function drawFourPointStar(
      x: number, y: number, outerR: number, innerR: number, alpha: number, glowR: number
    ) {
      ctx.save();
      ctx.translate(x, y);

      // Deep wide outer glow
      if (glowR > 0) {
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR * 1.5);
        glow.addColorStop(0, `rgba(100, 140, 255, ${alpha * 0.2})`);
        glow.addColorStop(0.5, `rgba(60, 90, 200, ${alpha * 0.05})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, glowR * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Star shape
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const outerAngle = (i * Math.PI) / 2 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 4;

        const ox = Math.cos(outerAngle) * outerR;
        const oy = Math.sin(outerAngle) * outerR;
        const ix = Math.cos(innerAngle) * innerR;
        const iy = Math.sin(innerAngle) * innerR;

        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();

      // Sharp white/blue fill
      const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
      starGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      starGrad.addColorStop(0.2, `rgba(220, 235, 255, ${alpha})`);
      starGrad.addColorStop(1, `rgba(150, 180, 255, ${alpha * 0.5})`);
      ctx.fillStyle = starGrad;
      ctx.fill();

      // Intense core
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      // Cross flares (horizontal/vertical lines extending from star)
      const flareLen = outerR * 1.8;
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, -flareLen); ctx.lineTo(0, flareLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-flareLen, 0); ctx.lineTo(flareLen, 0); ctx.stroke();

      ctx.restore();
    }

    // ─── Draw orbital rings & planet ──────────────────────────────
    function drawOrbits(x: number, y: number, radiusX: number, radiusY: number, tilt: number, alpha: number, t: number) {
      if (alpha <= 0) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);

      // Solid inner ring
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150, 180, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Ring glow
      ctx.strokeStyle = `rgba(100, 140, 255, ${alpha * 0.2})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Dashed outer ring
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX * 1.15, radiusY * 1.15, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150, 180, 255, ${alpha * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 4]);
      ctx.lineDashOffset = -t * 0.01;
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Little constellation dots on dashed ring
      const dotCount = 4;
      for(let i=0; i<dotCount; i++) {
        const dotAng = (i / dotCount) * Math.PI * 2 + t * 0.0005;
        const dx = Math.cos(dotAng) * (radiusX * 1.15);
        const dy = Math.sin(dotAng) * (radiusY * 1.15);
        ctx.beginPath();
        ctx.arc(dx, dy, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.8})`;
        ctx.fill();
      }

      // Orbiting Planet
      const planetProgress = (t * 0.0003) % (Math.PI * 2);
      const px = Math.cos(planetProgress) * radiusX;
      const py = Math.sin(planetProgress) * radiusY;
      
      // Planet glow
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 210, 255, ${alpha * 0.2})`;
      ctx.fill();

      // Planet core
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      ctx.restore();
    }

    // ─── Main render loop ─────────────────────────────────────────
    function draw(now: number) {
      const t = now - startTime;
      const W2 = window.innerWidth;
      const H2 = window.innerHeight;

      ctx.clearRect(0, 0, W2, H2);

      // Deep space background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W2, H2));
      bgGrad.addColorStop(0, '#0a0d1a');
      bgGrad.addColorStop(0.5, '#05070f');
      bgGrad.addColorStop(1, '#020308');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W2, H2);

      // Starfield with glowing effect
      const starFade = easeOutCubic(clamp01((t - 500) / 1500));
      bgStars.forEach(s => {
        const twinkle = s.alphaBase + 0.3 * Math.sin(now * 0.001 * s.speed + s.phase);
        const alpha = twinkle * starFade;
        
        // Star core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.fill();

        // Star glow for larger stars
        if (s.r > 0.8) {
          const glowR = s.r * 6;
          ctx.beginPath();
          ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
          const glowGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
          glowGrad.addColorStop(0, `rgba(150, 180, 255, ${alpha * 0.4})`);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }
      });

      // Falling meteors
      meteors.forEach(m => drawMeteor(m, t));
      lateMeteors.forEach(m => drawMeteor(m, t));

      function drawMeteor(m: Meteor, time: number) {
        if (time < m.delay) return;
        const progress = (time - m.delay) * m.speed / 1000;
        const hx = m.x + Math.cos(m.angle) * progress * 200;
        const hy = m.y + Math.sin(m.angle) * progress * 200;
        
        if (hy > H2 + 100 || hx > W2 + 100) return;

        const tx = hx - Math.cos(m.angle) * m.len;
        const ty = hy - Math.sin(m.angle) * m.len;

        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.8, `rgba(150, 180, 255, ${m.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${m.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(hx, hy, m.thickness * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`;
        ctx.fill();
      }

      // ── Sequence Timings ──────────────────────────────────────────
      // 0.0s - 1.0s: Meteors (handled above)
      // 1.0s - 2.0s: Star blooms
      // 2.0s - 3.5s: Orbital rings appear and spin
      // 3.5s - 5.0s: Text fades in
      // 5.8s: Done

      const phaseStar = clamp01((t - 1000) / 1000);
      const phaseOrbit = clamp01((t - 2000) / 1500);
      const phaseText = clamp01((t - 3500) / 1500);

      // Draw Star
      if (phaseStar > 0) {
        const starEased = easeOutExpo(phaseStar);
        
        // Gentle breathing pulse once fully appeared
        const pulse = phaseStar === 1 ? (1 + 0.03 * Math.sin(t * 0.003)) : 1;
        
        const outerR = 45 * starEased * pulse;
        const innerR = 8 * starEased * pulse;
        const glowR = 150 * starEased * pulse;

        drawFourPointStar(cx, cy, outerR, innerR, starEased, glowR);
      }

      // Draw Orbital Rings
      if (phaseOrbit > 0) {
        const orbitEased = easeOutCubic(phaseOrbit);
        
        // Tilt -0.3 radians, expand out
        const rX = 110 * orbitEased;
        const rY = 40 * orbitEased;
        
        drawOrbits(cx, cy, rX, rY, -0.25, orbitEased, t);
      }

      // Draw Text (Λ S T E R I Λ)
      if (phaseText > 0) {
        const textEased = easeInOutCubic(phaseText);
        
        ctx.save();
        ctx.globalAlpha = textEased;
        
        const textY = cy + 110;
        
        // Text glow
        ctx.shadowColor = 'rgba(150, 180, 255, 0.4)';
        ctx.shadowBlur = 15;
        
        ctx.font = '300 28px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '0.4em'; // Wide spacing
        ctx.fillStyle = `rgba(255, 255, 255, ${textEased})`;
        
        // Use Λ instead of A to match the exact storyboard typography
        ctx.fillText('Λ S T E R I Λ', cx, textY);
        
        ctx.shadowBlur = 0;

        // Subtitle (tagline) fading in slightly after
        const tagEased = easeInOutCubic(clamp01((t - 4200) / 1000));
        if (tagEased > 0) {
          ctx.globalAlpha = tagEased * 0.6;
          ctx.font = '300 12px "Inter", system-ui, sans-serif';
          ctx.letterSpacing = '0.2em';
          ctx.fillStyle = '#a0b0d0';
          ctx.fillText('YOUR NOCTURNAL ORACLE', cx, textY + 35);
        }

        ctx.restore();
      }

      // Fade out transition at the very end (5.4s - 6.0s)
      if (t > 5400) {
        const fadeOut = clamp01((t - 5400) / 600);
        ctx.fillStyle = `rgba(2, 3, 8, ${fadeOut})`;
        ctx.fillRect(0, 0, W2, H2);
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    // Give it 6 seconds to complete the euphoric smooth sequence
    const timer = setTimeout(onComplete, 6000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#020308', // pure dark
    }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}
