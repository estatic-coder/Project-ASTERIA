import { useEffect, useState, useCallback } from 'react';
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

// ─── Mode transition overlay ───────────────────────────────────────
function ModeTransition({ target, onDone }: { target: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: '#04060e',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#4b5563', marginBottom: 12, textTransform: 'uppercase' }}>Entering</div>
        <div style={{ fontSize: 28, fontWeight: 200, letterSpacing: '0.25em', background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {target.toUpperCase()} MODE
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)', margin: '16px auto 0' }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Code Mode layout ─────────────────────────────────────────────
function CodeMode({ onSettings, onCommandPalette }: { onSettings: () => void; onCommandPalette: () => void }) {
  const { sidebarOpen, oraclePanelOpen, terminalOpen, setSidebarOpen, setOraclePanelOpen, setTerminalOpen } = useAppStore();
  const SIDEBAR_W = sidebarOpen ? 230 : 0;
  const ORACLE_W = oraclePanelOpen ? 360 : 0;
  const TERMINAL_H = terminalOpen ? 220 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117', overflow: 'hidden' }}>
      <CodeTopBar
        onOpenSettings={onSettings}
        onCommandPalette={onCommandPalette}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleOracle={() => setOraclePanelOpen(!oraclePanelOpen)}
        onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar (Explorer) */}
        <motion.div
          animate={{ width: SIDEBAR_W }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ height: '100%', overflow: 'hidden', background: '#0a0d14', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}
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

        {/* Oracle panel */}
        <motion.div
          animate={{ width: ORACLE_W }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ height: '100%', overflow: 'hidden', flexShrink: 0 }}
        >
          {oraclePanelOpen && <OraclePanel />}
        </motion.div>
      </div>

      {/* Status bar */}
      <div style={{
        height: 24, background: '#0a0d14', borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16,
        fontSize: 11, color: '#374151', flexShrink: 0,
      }}>
        <span style={{ color: '#4b5563' }}>✦ ASTERIA</span>
        <span>CODE MODE</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <span style={{ color: '#10b981' }}>● LOCAL</span>
          <span>Ollama</span>
        </span>
      </div>
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

  // Load Ollama models on startup
  useEffect(() => {
    AsteriaAPI.listModels().then(resp => {
      if (resp?.models?.length) setAvailableModels(resp.models);
    }).catch(() => { });
  }, []);

  // Intercept mode changes to show transition overlay
  useEffect(() => {
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.mode !== prev.mode && state.mode !== 'home') {
        // Show transition
        setTransitionTarget(state.mode);
      } else if (state.mode !== prev.mode) {
        setActiveMode(state.mode);
      }
    });
    return unsub;
  }, []);

  const handleTransitionDone = useCallback(() => {
    setActiveMode(transitionTarget as any);
    setTransitionTarget(null);
  }, [transitionTarget]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setMode('home');
        setActiveMode('home');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setMode]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#04060e' }}>
      <AnimatePresence>
        {transitionTarget && (
          <ModeTransition target={transitionTarget} onDone={handleTransitionDone} />
        )}
      </AnimatePresence>

      {activeMode === 'home' && (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ width: '100%', height: '100%' }}
        >
          <AsteriaHome />
        </motion.div>
      )}

      {activeMode === 'code' && (
        <motion.div
          key="code"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ width: '100%', height: '100%' }}
        >
          <CodeMode
            onSettings={() => setShowSettings(true)}
            onCommandPalette={() => setShowCommandPalette(true)}
          />
        </motion.div>
      )}

      {(activeMode === 'research' || activeMode === 'writing' || activeMode === 'analysis') && (
        <motion.div
          key={activeMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {/* Placeholder for other modes — show Oracle chat with home button */}
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#04060e' }}>
            <div style={{
              height: 40, background: '#080c14', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
            }}>
              <button onClick={() => { setMode('home'); setActiveMode('home'); }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>
                ← Home
              </button>
              <span style={{ fontSize: 11.5, letterSpacing: '0.2em', color: '#4b5563' }}>
                {activeMode.toUpperCase()} MODE
              </span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 13 }}>
              {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} mode coming soon
            </div>
          </div>
        </motion.div>
      )}

      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  );
}
