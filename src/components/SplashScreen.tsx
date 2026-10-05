import { useEffect, useState } from 'react';

interface Props { onComplete: () => void; }

const PHASES = ['enter', 'reveal', 'hold', 'exit'] as const;
type Phase = typeof PHASES[number];

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('enter');
  const [progress, setProgress] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    // Smooth easing progress
    let p = 0;
    const interval = setInterval(() => {
      p += (100 - p) * 0.09;
      if (p > 99.5) p = 100;
      setProgress(p);
    }, 40);

    // Tick for scanline movement
    const tickInterval = setInterval(() => setTick(t => t + 1), 50);

    const t1 = setTimeout(() => setPhase('reveal'), 150);
    const t2 = setTimeout(() => setPhase('hold'),   1200);
    const t3 = setTimeout(() => setPhase('exit'),   3000);
    const t4 = setTimeout(() => onComplete(),       3700);

    return () => {
      clearInterval(interval);
      clearInterval(tickInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const isVisible = phase !== 'enter';
  const isExiting = phase === 'exit';

  return (
    <>
      <style>{`
        @keyframes splash-logo-in {
          0%   { opacity: 0; transform: scale(0.7) translateY(20px); filter: blur(20px) brightness(3); }
          60%  { opacity: 1; filter: blur(0px) brightness(1.2); transform: scale(1.04) translateY(-2px); }
          100% { opacity: 1; filter: blur(0px) brightness(1); transform: scale(1) translateY(0); }
        }
        @keyframes splash-title-in {
          0%   { opacity: 0; transform: translateY(18px); letter-spacing: 0.5em; filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 0.25em; filter: blur(0); }
        }
        @keyframes splash-sub-in {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 0.4; transform: translateY(0); }
        }
        @keyframes splash-orb {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.06; }
          50%       { transform: translate(-50%, -50%) scale(1.2); opacity: 0.12; }
        }
        @keyframes splash-bar-shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(300%); }
        }
        @keyframes splash-particle {
          0%   { opacity: 0; transform: translateY(0) scale(0); }
          20%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
        }
        @keyframes blink-caret {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes splash-bg-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#020202',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.7, 0, 0.3, 1)',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>

        {/* Central ambient glow orb */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '70vw', height: '70vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,200,200,0.08) 0%, transparent 65%)',
          animation: 'splash-orb 5s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '40px 40px',
          opacity: 1,
        }} />

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        }}>

          {/* Logo */}
          <div style={{
            width: 140, height: 140,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            animation: isVisible ? 'splash-logo-in 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
            opacity: isVisible ? undefined : 0,
            position: 'relative', zIndex: 10,
          }}>
            <img
              src="/logo.png"
              alt=""
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                filter: 'grayscale(100%) brightness(2.2) drop-shadow(0 0 40px rgba(255,255,255,0.4))',
              }}
            />
          </div>

          {/* Title */}
          <div style={{
            animation: isVisible ? 'splash-title-in 1.3s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none',
            opacity: isVisible ? undefined : 0,
            position: 'relative',
            marginTop: -10, // Bring it closer to logo
          }}>
            <span style={{
              fontSize: 68, fontWeight: 900,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              background: 'linear-gradient(180deg, #ffffff 0%, #666666 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Inter', system-ui, sans-serif",
              display: 'block',
              textAlign: 'center',
              textShadow: '0 10px 40px rgba(255,255,255,0.1)'
            }}>
              Asteria
            </span>
          </div>

          {/* Tagline */}
          <div style={{
            animation: isVisible ? 'splash-sub-in 0.9s 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none',
            opacity: 0,
            marginTop: 10,
          }}>
            <span style={{
              fontSize: 10, letterSpacing: '0.45em', textTransform: 'uppercase',
              color: '#9ca3af', fontWeight: 400,
            }}>
              AI Development Environment
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            marginTop: 48,
            width: 200, height: 1,
            background: 'rgba(255,255,255,0.06)',
            position: 'relative', overflow: 'hidden',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s 0.6s',
          }}>
            {/* Fill */}
            <div style={{
              position: 'absolute', inset: 0, right: `${100 - progress}%`,
              background: 'linear-gradient(90deg, #333 0%, #e5e5e5 80%, #fff 100%)',
              boxShadow: '0 0 14px rgba(255,255,255,0.7)',
              transition: 'right 0.12s linear',
            }} />
            {/* Shimmer sweep */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
              animation: 'splash-bar-shimmer 1.4s linear infinite',
            }} />
          </div>

          {/* Boot text */}
          <div style={{
            marginTop: 22,
            opacity: isVisible ? 0.35 : 0,
            transition: 'opacity 0.6s 1s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
              color: '#6b7280', fontFamily: "'JetBrains Mono', monospace",
            }}>
              {Math.round(progress)}%
            </span>
            <span style={{
              width: 6, height: 12,
              background: '#6b7280',
              animation: 'blink-caret 1s step-end infinite',
              display: 'inline-block',
            }} />
          </div>
        </div>
      </div>
    </>
  );
}
