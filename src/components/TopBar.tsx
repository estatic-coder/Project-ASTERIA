import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';


interface Props {
  onOpenSettings: () => void;
  onCommandPalette: () => void;
  onToggleSidebar: () => void;
  onToggleOracle: () => void;
  onToggleTerminal: () => void;
  sidebarOpen?: boolean;
  oraclePanelOpen?: boolean;
  terminalOpen?: boolean;
}

const STATUS_CONF: Record<string, { dot: string; label: string; anim?: string }> = {
  idle:      { dot: '#3f3f3f',  label: 'Idle' },
  observing: { dot: '#737373',  label: 'Observing', anim: 'pulse-dot 1.2s ease-in-out infinite' },
  thinking:  { dot: '#a3a3a3', label: 'Thinking',  anim: 'pulse-dot 0.8s ease-in-out infinite' },
  planning:  { dot: '#d4d4d4', label: 'Planning',  anim: 'pulse-dot 1s ease-in-out infinite' },
  executing: { dot: '#e5e5e5', label: 'Executing', anim: 'pulse-dot 0.6s ease-in-out infinite' },
  completed: { dot: '#525252', label: 'Complete' },
  failed:    { dot: '#525252', label: 'Failed' },
};

function IconBtn({
  title, onClick, children, active,
}: {
  title: string; onClick?: () => void; children: React.ReactNode; active?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active
          ? 'rgba(255,255,255,0.07)'
          : hover ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none', cursor: 'pointer',
        color: active ? '#d4d4d4' : hover ? '#c4c4c4' : '#525252',
        padding: '5px 6px', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}
    >
      {children}
    </button>
  );
}

export default function CodeTopBar({ onOpenSettings, onCommandPalette, onToggleSidebar, onToggleOracle, onToggleTerminal, sidebarOpen, oraclePanelOpen, terminalOpen }: Props) {
  const { workspaceName, setMode, oracleStatus } = useAppStore();

  const sc = STATUS_CONF[oracleStatus] ?? STATUS_CONF.idle;



  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>

      <div style={{
        height: 40, display: 'flex', alignItems: 'center', padding: '0 10px',
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0, gap: 0, position: 'relative', zIndex: 50,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}>

        {/* Left: Logo → Home */}
        <button
          onClick={() => setMode('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, marginRight: 8,
            background: 'none', border: 'none', cursor: 'pointer', padding: '3px 7px',
            borderRadius: 6, WebkitAppRegion: 'no-drag', flexShrink: 0,
          } as React.CSSProperties}
          title="Go to Home"
        >
          <img src="/logo.png" alt="Asteria" style={{ width: 17, height: 17, objectFit: 'contain', filter: 'grayscale(100%) brightness(1.5)' }} />
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            background: 'linear-gradient(135deg, #c4c4c4, #737373)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ASTERIA</span>
        </button>



        {/* Center: Oracle status pill — absolute center */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '4px 12px', borderRadius: 20,
          background: oracleStatus !== 'idle' ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: oracleStatus !== 'idle' ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'all 0.3s',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: sc.dot,
            flexShrink: 0,
            animation: sc.anim,
            boxShadow: oracleStatus !== 'idle' ? `0 0 6px ${sc.dot}` : 'none',
          }} />
          <span style={{ fontSize: 11, color: '#2a2a2a', letterSpacing: '0.04em' }}>
            Oracle {sc.label}
          </span>
          {workspaceName && (
            <>
              <span style={{ color: '#1e1e1e', fontSize: 11 }}>·</span>
              <span style={{ fontSize: 11, color: '#1e1e1e' }}>{workspaceName}</span>
            </>
          )}
        </div>

        {/* Right: Plus Button, Model, Icons */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Removed Plus Button and Model Selector as requested */}

          {/* Icon buttons */}
          <IconBtn title="Toggle Sidebar (⌘B)" onClick={onToggleSidebar} active={sidebarOpen}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconBtn>

          <IconBtn title="Toggle Terminal (⌘`)" onClick={onToggleTerminal} active={terminalOpen}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polyline points="4 17 10 11 4 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </IconBtn>

          <IconBtn title="Toggle Oracle (⌘J)" onClick={onToggleOracle} active={oraclePanelOpen}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </IconBtn>

          <IconBtn title="Command Palette (⌘⇧P)" onClick={onCommandPalette}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconBtn>

          <IconBtn title="Settings" onClick={onOpenSettings}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </IconBtn>
        </div>
      </div>
    </>
  );
}
