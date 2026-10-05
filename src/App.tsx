import { Component, ReactNode, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { AsteriaAPI } from './core/AsteriaAPI';

import SplashScreen from './components/SplashScreen';
import AsteriaHome from './components/AsteriaHome';
import CodeTopBar from './components/TopBar';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/Editor';
import OraclePanel from './components/OraclePanel';
import TerminalPanel from './components/TerminalPanel';
import CommandPalette from './components/CommandPalette';
import ProjectDashboard from './components/ProjectDashboard';

const MODE_BG: Record<string, string> = {
  home: '/home_loading.png',
  code: '/code_loading.png',
  image: '/img_creation.png',
};

// ─── Mode transition overlay ───────────────────────────────────────
function ModeTransition({ target, onDone }: { target: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = MODE_BG[target] || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: bg ? `#080808 url(${bg}) center / auto 100% no-repeat` : '#080808',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        overflow: 'hidden',
      }}
    >

      {/* Dark overlay on top */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <div style={{ fontSize: 10, letterSpacing: '0.25em', color: '#525252', marginBottom: 10, textTransform: 'uppercase' }}>Entering</div>
        <div style={{ fontSize: 26, fontWeight: 200, letterSpacing: '0.3em', background: 'linear-gradient(135deg, #e5e5e5, #737373)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {target === 'home' ? 'ASTERIA HOME' : `${target.toUpperCase()} MODE`}
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 100 }}
          transition={{ delay: 0.5, duration: 0.9, ease: 'easeInOut' }}
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(163,163,163,0.4), transparent)', margin: '18px auto 0' }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Code Mode layout ─────────────────────────────────────────────
function CodeMode({ onSettings, onCommandPalette }: { onSettings: () => void; onCommandPalette: () => void }) {
  const { sidebarOpen, oraclePanelOpen, terminalOpen, setSidebarOpen, setOraclePanelOpen, setTerminalOpen, workspacePath } = useAppStore();
  const SIDEBAR_W = sidebarOpen ? 236 : 0;
  const ORACLE_W = oraclePanelOpen ? 360 : 0;
  const TERMINAL_H = terminalOpen ? 220 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0c0c0c', overflow: 'hidden' }}>
      {workspacePath && (
        <CodeTopBar
          onOpenSettings={onSettings}
          onCommandPalette={onCommandPalette}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleOracle={() => setOraclePanelOpen(!oraclePanelOpen)}
          onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
          sidebarOpen={sidebarOpen}
          oraclePanelOpen={oraclePanelOpen}
          terminalOpen={terminalOpen}
        />
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {workspacePath ? (
          <>
            {/* Sidebar */}
            <motion.div
              animate={{ width: SIDEBAR_W }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ height: '100%', overflow: 'hidden', background: '#090909', borderRight: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}
            >
              {sidebarOpen && <FileExplorer />}
            </motion.div>

            {/* Editor + Terminal */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <CodeEditor />
              </div>
              <motion.div
                animate={{ height: TERMINAL_H }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden', flexShrink: 0 }}
              >
                {terminalOpen && <TerminalPanel />}
              </motion.div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <ProjectDashboard />
          </div>
        )}

        {/* Oracle panel */}
        <motion.div
          animate={{ width: ORACLE_W }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ height: '100%', overflow: 'hidden', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.04)' }}
        >
          {oraclePanelOpen && <OraclePanel />}
        </motion.div>
      </div>

      {/* Status bar */}
      {workspacePath && (
        <div style={{
          height: 21, background: '#070707',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', padding: '0 12px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/logo.png" alt="" style={{ width: 10, height: 10, objectFit: 'contain', filter: 'grayscale(100%) brightness(1.3)', opacity: 0.3 }} />
            <span style={{ fontSize: 9.5, color: '#222', letterSpacing: '0.16em' }}>ASTERIA</span>
            <div style={{ width: 1, height: 9, background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ fontSize: 9.5, color: '#1c1c1c', letterSpacing: '0.12em' }}>CODE</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 9.5, color: '#181818', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#242424', display: 'inline-block' }} />
              LOCAL
            </span>
            <span style={{ fontSize: 9.5, color: '#141414' }}>Ollama</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Image Mode layout ────────────────────────────────────────────
function ImageMode({ onCommandPalette }: { onCommandPalette: () => void }) {
  const { availableModels, currentModel, setCurrentModel } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [style, setStyle] = useState('Realistic');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [steps, setSteps] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'loading' | 'ready' | 'offline'>('checking');

  // Dimension map for aspect ratio
  const DIMS: Record<string, [number, number]> = {
    '1:1':  [1024, 1024],
    '16:9': [1344, 768],
    '9:16': [768, 1344],
    '4:3':  [1152, 896],
    '3:4':  [896, 1152],
  };

  // Poll server status
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await fetch('http://127.0.0.1:7860/status', { signal: AbortSignal.timeout(2000) });
        if (cancelled) return;
        const j = await r.json();
        if (j.loading) setServerStatus('loading');
        else if (j.loaded) setServerStatus('ready');
        else setServerStatus('offline');
      } catch {
        if (!cancelled) setServerStatus('offline');
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setImageData(null);
    setElapsed(null);
    const [width, height] = DIMS[aspectRatio] ?? [1024, 1024];
    try {
      const res = await fetch('http://127.0.0.1:7860/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), negative_prompt: negPrompt.trim(), style, steps, width, height }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Generation failed');
      setImageData(json.image);
      setElapsed(json.elapsed);
    } catch (e: any) {
      setError(e.message || 'Connection failed — is sdxl_server.py running?');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageData) return;
    const a = document.createElement('a');
    a.href = imageData;
    a.download = `asteria_${Date.now()}.png`;
    a.click();
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0e0e0e', color: '#e5e5e5', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ height: 48, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, flexShrink: 0, background: '#0a0a0a' }}>
        <img src="/logo.png" alt="Asteria" style={{ width: 22, height: 22, objectFit: 'contain', filter: 'grayscale(100%) brightness(1.6)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#a3a3a3' }}>ASTERIA</span>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span style={{ fontSize: 11, color: '#525252', letterSpacing: '0.12em' }}>IMAGE CREATION</span>
        {/* Server status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 12, padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: serverStatus === 'ready' ? '#4ade80' : serverStatus === 'loading' ? '#fbbf24' : '#525252', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: '#525252', letterSpacing: '0.1em' }}>
            {serverStatus === 'ready' ? 'SDXL READY' : serverStatus === 'loading' ? 'LOADING MODEL' : serverStatus === 'checking' ? 'CONNECTING' : 'SERVER OFFLINE'}
          </span>
        </div>
        <button onClick={onCommandPalette} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#525252', padding: '5px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
          title="Command Palette (⌘⇧P)"
          onMouseEnter={e => { e.currentTarget.style.color = '#c4c4c4'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#525252'; e.currentTarget.style.background = 'transparent'; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left — Controls */}
        <div style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '24px 20px', gap: 20, overflowY: 'auto', background: '#0a0a0a', flexShrink: 0 }}>
          <div>
            <label style={{ fontSize: 11, color: '#525252', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={5}
              style={{ width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e5e5e5', fontSize: 13.5, padding: '12px 14px', resize: 'vertical', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#525252', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Style</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Realistic', 'Artistic', 'Minimal', 'Dark', 'Cinematic'].map(s => (
                <button key={s} onClick={() => setStyle(s)} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${style === s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, background: style === s ? 'rgba(255,255,255,0.08)' : 'transparent', color: style === s ? '#e5e5e5' : '#525252', fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (style !== s) e.currentTarget.style.color = '#a3a3a3'; }}
                  onMouseLeave={e => { if (style !== s) e.currentTarget.style.color = '#525252'; }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Negative prompt */}
          <div>
            <label style={{ fontSize: 11, color: '#525252', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Negative Prompt</label>
            <textarea
              value={negPrompt}
              onChange={e => setNegPrompt(e.target.value)}
              placeholder="What to avoid..."
              rows={2}
              style={{ width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#737373', fontSize: 12, padding: '10px 12px', resize: 'vertical', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: 11, color: '#525252', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Model</label>
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#141414', color: '#e5e5e5', fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {currentModel || 'Select a model'}
              <span style={{ color: '#525252', fontSize: 10, transform: modelDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>
            {modelDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: 200, overflowY: 'auto' }}>
                {availableModels.length > 0 ? availableModels.map(m => (
                  <button key={m.name}
                    onClick={() => { setCurrentModel(m.name); setModelDropdownOpen(false); }}
                    style={{ padding: '10px 14px', border: 'none', background: currentModel === m.name ? 'rgba(255,255,255,0.05)' : 'transparent', color: currentModel === m.name ? '#e5e5e5' : '#8B94A8', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#e5e5e5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = currentModel === m.name ? 'rgba(255,255,255,0.05)' : 'transparent'; e.currentTarget.style.color = currentModel === m.name ? '#e5e5e5' : '#8B94A8'; }}>
                    {m.name}
                  </button>
                )) : (
                  <div style={{ color: '#525252', fontSize: 12, padding: '10px 14px' }}>No models found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#525252', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Aspect Ratio</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['1:1', '16:9', '9:16', '4:3', '3:4'].map(r => (
                <button key={r} onClick={() => setAspectRatio(r)} style={{ flex: 1, minWidth: 48, padding: '7px 4px', borderRadius: 7, border: `1px solid ${aspectRatio === r ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`, background: aspectRatio === r ? 'rgba(255,255,255,0.08)' : 'transparent', color: aspectRatio === r ? '#e5e5e5' : '#525252', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (aspectRatio !== r) e.currentTarget.style.color = '#a3a3a3'; }}
                  onMouseLeave={e => { if (aspectRatio !== r) e.currentTarget.style.color = '#525252'; }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Steps slider */}
          <div>
            <label style={{ fontSize: 11, color: '#525252', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span>Steps</span>
              <span style={{ color: '#737373' }}>{steps}</span>
            </label>
            <input type="range" min={10} max={60} value={steps} onChange={e => setSteps(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#737373', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#2a2a2a', marginTop: 4 }}>
              <span>Fast (10)</span><span>Quality (60)</span>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!prompt.trim() || generating || serverStatus !== 'ready'}
            style={{ padding: '12px', borderRadius: 10, border: 'none', background: prompt.trim() && !generating && serverStatus === 'ready' ? 'linear-gradient(135deg, #3a3a3a, #686868)' : '#1a1a1a', color: prompt.trim() && !generating && serverStatus === 'ready' ? '#f0f0f0' : '#444', fontSize: 14, fontWeight: 600, cursor: prompt.trim() && !generating && serverStatus === 'ready' ? 'pointer' : 'default', transition: 'all 0.2s', letterSpacing: '0.04em' }}>
            {generating ? '⬡  Generating...' : serverStatus !== 'ready' ? `⬡  ${serverStatus === 'loading' ? 'Model Loading...' : 'Server Offline'}` : '⬡  Generate Image'}
          </button>

          {serverStatus === 'offline' && (
            <div style={{ fontSize: 11, color: '#525252', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
              Start the server:<br />
              <code style={{ color: '#737373', fontSize: 10 }}>python sdxl_server.py</code>
            </div>
          )}
        </div>

        {/* Right — Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', position: 'relative', padding: 32 }}>
          {generating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 480, height: 480, borderRadius: 16, background: '#141414', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.025), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                {/* Think animation inside canvas too */}
                <div style={{ position: 'relative', width: 48, height: 48 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(163,163,163,0.2)', animation: 'img-spin 3s linear infinite' }} />
                  <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1px solid rgba(163,163,163,0.1)', borderTopColor: 'rgba(163,163,163,0.6)', animation: 'img-spin-r 1.5s linear infinite' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: 'radial-gradient(circle, #ccc, #444)', boxShadow: '0 0 10px rgba(255,255,255,0.2)' }} />
                </div>
                <div style={{ fontSize: 12, color: '#404040', letterSpacing: '0.15em', textTransform: 'uppercase', zIndex: 1 }}>Generating · {style}</div>
                <div style={{ fontSize: 11, color: '#2a2a2a', zIndex: 1 }}>{aspectRatio} · {steps} steps</div>
              </div>
            </div>
          ) : imageData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
                <img src={imageData} alt="Generated" style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }} />
              </div>
              {elapsed !== null && (
                <div style={{ fontSize: 11, color: '#525252', letterSpacing: '0.1em' }}>Generated in {elapsed}s</div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDownload} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#a3a3a3', fontSize: 12, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                  ↓ Download PNG
                </button>
                <button onClick={() => { setImageData(null); setPrompt(''); setElapsed(null); }} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#737373', fontSize: 12, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a3a3a3'}
                  onMouseLeave={e => e.currentTarget.style.color = '#737373'}>
                  ↺ New Image
                </button>
              </div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 420, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#525252' }}>✕</div>
              <div style={{ color: '#737373', fontSize: 13 }}>{error}</div>
              <button onClick={() => setError(null)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#525252', fontSize: 12, cursor: 'pointer' }}>Try Again</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: 0.35 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="14" width="48" height="36" rx="4" stroke="#525252" strokeWidth="1.5" />
                <circle cx="22" cy="26" r="5" stroke="#525252" strokeWidth="1.5" />
                <path d="M8 40l14-12 10 10 8-8 14 12" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ color: '#525252', fontSize: 13 }}>Your image will appear here</div>
              <div style={{ color: '#333', fontSize: 11 }}>Enter a prompt and click Generate</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes img-spin   { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes img-spin-r { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────
export default function App() {
  const { mode, setMode, setAvailableModels } = useAppStore();
  const [showSplash, setShowSplash] = useState(true);
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState(mode);
  const [, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    AsteriaAPI.listModels().then(resp => {
      if (resp?.models?.length) setAvailableModels(resp.models);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.mode !== prev.mode) {
        setTransitionTarget(state.mode);
      }
    });
    return unsub;
  }, []);

  const handleTransitionDone = useCallback(() => {
    setActiveMode(transitionTarget as any);
    setTransitionTarget(null);
  }, [transitionTarget]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setMode('home');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setMode]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080808' }}>
      <AnimatePresence>
        {transitionTarget && (
          <ModeTransition target={transitionTarget} onDone={handleTransitionDone} />
        )}
      </AnimatePresence>

      {activeMode === 'home' && (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%' }}>
          <AsteriaHome />
        </motion.div>
      )}

      {activeMode === 'code' && (
        <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%' }}>
          <CodeMode onSettings={() => setShowSettings(true)} onCommandPalette={() => setShowCommandPalette(true)} />
        </motion.div>
      )}

      {activeMode === 'image' && (
        <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%' }}>
          <ImageMode onCommandPalette={() => setShowCommandPalette(true)} />
        </motion.div>
      )}

      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  );
}
