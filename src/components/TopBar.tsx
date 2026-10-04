import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AsteriaAPI } from '../core/AsteriaAPI';

interface Props {
  onOpenSettings: () => void;
  onCommandPalette: () => void;
  onToggleSidebar: () => void;
  onToggleOracle: () => void;
  onToggleTerminal: () => void;
}

export default function CodeTopBar({ onOpenSettings, onCommandPalette, onToggleSidebar, onToggleOracle, onToggleTerminal }: Props) {
  const { workspaceName, currentModel, availableModels, setCurrentModel, setMode, oracleStatus, setWorkspace, addRecentProject } = useAppStore();
  const [modelOpen, setModelOpen] = useState(false);

  const statusConf: Record<string, { icon: string; color: string }> = {
    idle:      { icon: '●', color: '#4b5563' },
    observing: { icon: '◌', color: '#8b5cf6' },
    thinking:  { icon: '✦', color: '#a78bfa' },
    planning:  { icon: '◇', color: '#6366f1' },
    executing: { icon: '◆', color: '#c4b5fd' },
    completed: { icon: '✓', color: '#34d399' },
    failed:    { icon: '✕', color: '#f87171' },
  };
  const sc = statusConf[oracleStatus] ?? statusConf.idle;

  const handleOpenFolder = async () => {
    const path = await AsteriaAPI.openFolder();
    if (!path) return;
    const name = path.split('/').pop() || path;
    const tree = await AsteriaAPI.readTree(path);
    setWorkspace(path, name, tree);
    addRecentProject(path, name);
  };

  return (
    <div style={{
      height: 40, display: 'flex', alignItems: 'center', padding: '0 12px',
      background: '#080c14', borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0, gap: 0, position: 'relative', zIndex: 50,
    }}>
      {/* Left: Logo + Brand → Home */}
      <button
        onClick={() => setMode('home')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, marginRight: 16,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
          borderRadius: 6, transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="16" height="16" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="2 4" />
          <circle cx="40" cy="40" r="5" fill="rgba(139,92,246,0.7)" />
          <circle cx="40" cy="40" r="2" fill="white" fillOpacity="0.9" />
        </svg>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.2em', background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ASTERIA
        </span>
      </button>

      {/* Workspace breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
        <button onClick={handleOpenFolder} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
        </button>
        {workspaceName && (
          <span style={{ fontSize: 12, color: '#6b7280', cursor: 'default' }}>{workspaceName}</span>
        )}
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.07)', marginRight: 12 }} />

      {/* File menu buttons */}
      {['File', 'Edit', 'View', 'Git'].map(m => (
        <button key={m} style={{
          background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer',
          fontSize: 12, padding: '4px 8px', borderRadius: 4,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent'; }}
        >
          {m}
        </button>
      ))}

      {/* Center: Oracle status */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: sc.color }}>
          {sc.icon}
        </span>
        <span style={{ fontSize: 11.5, color: '#374151' }}>
          Oracle {oracleStatus.charAt(0).toUpperCase() + oracleStatus.slice(1)}
        </span>
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Model selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setModelOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6, cursor: 'pointer', color: '#9ca3af', fontSize: 11.5,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
            {currentModel}
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
          {modelOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setModelOpen(false)} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 99,
                background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: 4, minWidth: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              }}>
                {availableModels.length === 0
                  ? <div style={{ padding: '10px 14px', color: '#4b5563', fontSize: 12 }}>No local models detected</div>
                  : availableModels.map((m: { name: string; size: number }) => (
                    <div key={m.name} onClick={() => { setCurrentModel(m.name); setModelOpen(false); }}
                      style={{
                        padding: '7px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12.5,
                        color: m.name === currentModel ? '#c4b5fd' : '#9ca3af',
                        background: m.name === currentModel ? 'rgba(139,92,246,0.1)' : 'transparent',
                        display: 'flex', justifyContent: 'space-between',
                      }}>
                      <span>{m.name}</span>
                      {m.name === currentModel && <span style={{ color: '#8b5cf6' }}>✓</span>}
                    </div>
                  ))
                }
              </div>
            </>
          )}
        </div>

        {/* Icon buttons */}
        {[
          { title: 'Toggle Sidebar', onClick: onToggleSidebar, icon: <path d="M3 3h18v18H3V3zM9 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> },
          { title: 'Toggle Terminal', onClick: onToggleTerminal, icon: <><polyline points="4 17 10 11 4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="12" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></> },
          { title: 'Toggle Oracle', onClick: onToggleOracle, icon: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></> },
          { title: 'Command Palette', onClick: onCommandPalette, icon: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></> },
          { title: 'Settings', onClick: onOpenSettings, icon: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></> },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} title={btn.title} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563',
            padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">{btn.icon}</svg>
          </button>
        ))}
      </div>
    </div>
  );
}
