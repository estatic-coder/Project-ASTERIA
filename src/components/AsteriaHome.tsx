import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AsteriaAPI } from '../core/AsteriaAPI';

// ─── Subtle star field canvas ──────────────────────────────────────
function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    let raf: number;

    const resize = () => {
      c.width = c.offsetWidth;
      c.height = c.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.8 + 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
    }));

    let t = 0;
    const draw = () => {
      t += 0.016;
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const a = 0.04 + 0.08 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,200,200,${a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ─── Mode definitions ─────────────────────────────────────────────
const MODES = [
  { id: 'general',  label: 'General',  icon: '✦', desc: 'Open-ended reasoning, questions, and exploration.' },
  { id: 'code',     label: 'Code',     icon: '◇', desc: 'Build, debug, refactor, and understand software.' },
  { id: 'image',    label: 'Image',    icon: '⬡', desc: 'Generate and edit images with AI.' },
] as const;

type ModeId = (typeof MODES)[number]['id'];

function AliveThinking() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px' }}>
      <div style={{ position: 'relative', width: 24, height: 24 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.05)', borderTopColor: '#e5e5e5', animation: 'spin-fast 0.8s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.05)', borderRightColor: '#a3a3a3', animation: 'spin-slow 1.2s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: '#fff', boxShadow: '0 0 12px rgba(255,255,255,0.8)', animation: 'pulse-glow 1.5s ease-in-out infinite alternate' }} />
      </div>
      <span style={{ fontSize: 11, color: '#a3a3a3', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, animation: 'pulse-glow-text 1.5s ease-in-out infinite alternate' }}>Thinking</span>
      <style>{`
        @keyframes spin-fast { to { transform: rotate(360deg); } }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes pulse-glow { from { opacity: 0.4; transform: scale(0.85); } to { opacity: 1; transform: scale(1.15); } }
        @keyframes pulse-glow-text { from { opacity: 0.5; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default function AsteriaHome() {
  const { conversations, addMessage, currentModel, availableModels, setCurrentModel, setMode, setWorkspace, addRecentProject, recentProjects, sidebarOpen, setSidebarOpen } = useAppStore();
  const [selectedMode, setSelectedMode] = useState<ModeId>('general');
  const [input, setInput] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgs = conversations['home'] || [];

  const isChatInitiated = msgs.length > 0;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input, isChatInitiated]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    if (selectedMode === 'code') {
      handleEnterCode(text);
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    addMessage('home', { id: Date.now().toString(), role: 'user', content: text, timestamp: now });

    const replyId = (Date.now() + 1).toString();
    addMessage('home', {
      id: replyId, role: 'oracle', content: '', streaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    });

    try {
      const res = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: 'system', content: 'You are Asteria, a brilliant AI assistant.' },
            ...((conversations['home'] || []).filter(m => !m.streaming).map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            }))),
            { role: 'user', content: text },
          ],
          stream: true,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Ollama error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const lines = decoder.decode(value).split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              const chunk = json?.message?.content || '';
              if (chunk) {
                useAppStore.setState(s => ({
                  conversations: {
                    ...s.conversations,
                    home: s.conversations.home.map(m =>
                      m.id === replyId ? { ...m, content: m.content + chunk } : m
                    ),
                  },
                }));
              }
            } catch { /* skip bad json */ }
          }
        }
      }
      useAppStore.setState(s => ({
        conversations: {
          ...s.conversations,
          home: s.conversations.home.map(m =>
            m.id === replyId ? { ...m, streaming: false } : m
          ),
        },
      }));
    } catch {
      useAppStore.setState(s => ({
        conversations: {
          ...s.conversations,
          home: s.conversations.home.map(m =>
            m.id === replyId ? { ...m, content: "Could not reach Ollama. Make sure it's running on port 11434 with the selected model.", streaming: false } : m
          ),
        },
      }));
    }
  };

  const handleEnterCode = async (_prompt?: string) => {
    setEntering(true);
    try {
      const folderPath = await AsteriaAPI.openFolder();
      if (!folderPath) { setEntering(false); return; }
      const name = folderPath.split('/').pop() || folderPath;
      const tree = await AsteriaAPI.readTree(folderPath);
      setWorkspace(folderPath, name, tree);
      addRecentProject(folderPath, name);
      setMode('code');
    } catch {
      setMode('code');
    }
    setEntering(false);
  };

  const [showFreeOffer, setShowFreeOffer] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const handleNewChat = useCallback(() => {
    useAppStore.setState(s => ({
      conversations: { ...s.conversations, home: [] }
    }));
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText('https://github.com/estatic-coder/Project-ASTERIA').catch(() => {});
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  if (isChatInitiated) {
    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#101010', color: '#e5e5e5', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}
        onClick={() => { if (showUserMenu) setShowUserMenu(false); }}>

        {shareToast && (
          <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 20px', fontSize: 13, color: '#d4d4d4', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Repo link copied!
          </div>
        )}

        {showFreeOffer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFreeOffer(false)}>
            <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 36, width: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }} onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 38, marginBottom: 12, color: '#d4d4d4' }}>✦</div>
                <h2 style={{ fontSize: 21, fontWeight: 600, color: '#e5e5e5', margin: '0 0 8px' }}>Asteria Pro</h2>
                <p style={{ fontSize: 14, color: '#737373', margin: 0, lineHeight: 1.6 }}>Unlock unlimited AI capabilities across all modes.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {['Unlimited conversations', 'Priority model access', 'Advanced code analysis', 'Image generation credits'].map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#a3a3a3' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {feat}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowFreeOffer(false)} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3a3a3a, #636363)', color: '#f5f5f5', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Claim Free Offer
              </button>
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#404040' }}>No credit card required during beta</div>
            </div>
          </div>
        )}

        {sidebarOpen && (
          <div style={{ width: 256, minWidth: 200, maxWidth: 380, background: '#0a0a0a', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo.png" alt="Asteria Logo" style={{ width: 34, height: 34, objectFit: 'contain', filter: 'grayscale(100%) brightness(1.5)' }} />
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.04em', background: 'linear-gradient(90deg, #e5e5e5, #a3a3a3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Asteria</span>
              </div>
              <button title="Close Sidebar" onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#404040', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a3a3a3')}
                onMouseLeave={e => (e.currentTarget.style.color = '#404040')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
              </button>
            </div>

            <div style={{ padding: '6px 10px 10px' }}>
              <button onClick={handleNewChat} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#a3a3a3', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '9px 10px', borderRadius: 8, transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.08)'); (e.currentTarget.style.color = '#e5e5e5'); }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.04)'); (e.currentTarget.style.color = '#a3a3a3'); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New chat
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
              <div style={{ fontSize: 10, color: '#333', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 4px 6px' }}>Today</div>
              <div style={{ padding: '8px 10px', fontSize: 13, color: '#c4c4c4', cursor: 'pointer', borderRadius: 7, background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {msgs[0]?.content?.slice(0, 36) || 'New Conversation'}...
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0, background: '#101010' }}>
          <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-end' : 'space-between', padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} title="Open Sidebar" style={{ background: 'transparent', border: 'none', color: '#404040', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a3a3a3')}
                onMouseLeave={e => (e.currentTarget.style.color = '#404040')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
              </button>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleShare} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '5px 12px', color: '#626262', fontSize: 12, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a3a3a3')}
                onMouseLeave={e => (e.currentTarget.style.color = '#626262')}>Share</button>
              <button onClick={() => setShowFreeOffer(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 14px', color: '#d4d4d4', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>Upgrade</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26, padding: '0 28px' }}>
              {msgs.map(m => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, color: '#e5e5e5', fontSize: 15, lineHeight: 1.75, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.role === 'user' ? (
                    <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.06)', padding: '11px 17px', borderRadius: 16, maxWidth: '80%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14.5, color: '#d4d4d4' }}>
                      {m.content}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 13, width: '100%', alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0, width: 27, height: 27, borderRadius: '50%', background: 'linear-gradient(135deg, #1e1e1e, #3a3a3a)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#a3a3a3' }}>✦</div>
                      <div style={{ flex: 1, paddingTop: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#c4c4c4', lineHeight: 1.75 }}>
                        {m.streaming && !m.content ? <AliveThinking /> : m.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ height: 180 }} />
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 20px', background: 'linear-gradient(180deg, transparent 0%, #101010 50%)' }}>
            <div style={{ width: '100%', maxWidth: 720, position: 'relative', margin: '0 auto' }}>
              <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything" rows={1}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e5e5e5', fontSize: 15, padding: '15px 18px 10px', resize: 'none', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6, minHeight: 50, boxSizing: 'border-box' }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '7px 13px' }}>
                  <button onClick={handleSend} disabled={!input.trim()} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: input.trim() ? '#e5e5e5' : '#222', color: input.trim() ? '#111' : '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#333', marginTop: 9 }}>Asteria can make mistakes. Verify important information.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LANDING ──
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#080808', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StarCanvas />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />

      <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 10 }}>
        <div onClick={() => setModelOpen(!modelOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#737373', fontSize: 12, transition: 'all 0.2s' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#737373', display: 'inline-block' }} />
          <span style={{ color: '#c4c4c4' }}>{currentModel}</span>
          <span style={{ opacity: 0.4, fontSize: 11 }}>LOCAL</span>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        {modelOpen && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 4, minWidth: 200, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}>
            {availableModels.length === 0
              ? <div style={{ padding: '10px 14px', color: '#444', fontSize: 12 }}>No local models detected.</div>
              : availableModels.map(m => (
                <div key={m.name} onClick={() => { setCurrentModel(m.name); setModelOpen(false); }} style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: m.name === currentModel ? '#e5e5e5' : '#a3a3a3', background: m.name === currentModel ? 'rgba(255,255,255,0.07)' : 'transparent', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{m.name}</span>
                  {m.name === currentModel && <span style={{ color: '#737373' }}>✓</span>}
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 44, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Asteria Logo" style={{ width: 86, height: 86, objectFit: 'contain', marginBottom: 20, filter: 'grayscale(100%) brightness(1.8) drop-shadow(0 0 20px rgba(255,255,255,0.07))' }} />
          <h1 style={{ fontSize: 38, fontWeight: 200, letterSpacing: '0.45em', color: '#e5e5e5', margin: 0, textTransform: 'uppercase' }}>ASTERIA</h1>
          <p style={{ fontSize: 13, color: 'rgba(163,163,163,0.4)', margin: '10px 0 0', letterSpacing: '0.08em', fontWeight: 300 }}>What shall we explore tonight?</p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => {
              if (m.id === 'image') {
                setMode(m.id as any);
              } else {
                setSelectedMode(m.id);
              }
            }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 20, background: selectedMode === m.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedMode === m.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, color: selectedMode === m.id ? '#e5e5e5' : '#525252', fontSize: 13, cursor: 'pointer', fontWeight: 400, transition: 'all 0.2s' }}
              onMouseEnter={e => { if (selectedMode !== m.id) { e.currentTarget.style.color = '#a3a3a3'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; } }}
              onMouseLeave={e => { if (selectedMode !== m.id) { e.currentTarget.style.color = '#525252'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; } }}>
              <span style={{ opacity: 0.7, fontSize: 11 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: 720, position: 'relative', margin: '0 auto' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} placeholder={selectedMode === 'code' ? 'Describe what to build, or open a folder...' : 'Ask anything'} rows={1}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e5e5e5', fontSize: 15, padding: '18px 20px 12px', resize: 'none', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6, minHeight: 52, boxSizing: 'border-box' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  {selectedMode === 'code' && (
                    <button onClick={() => handleEnterCode()} disabled={entering} style={{ padding: '5px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {entering ? '◌ Opening...' : '◇ Open Folder'}
                    </button>
                  )}
                </div>
                <button onClick={handleSend} disabled={!input.trim()} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: input.trim() ? '#e5e5e5' : '#1e1e1e', color: input.trim() ? '#111' : '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </button>
              </div>
            </div>
          </div>

        {recentProjects.length > 0 && selectedMode === 'code' && (
          <div style={{ marginTop: 36, width: '100%', maxWidth: 720 }}>
            <div style={{ fontSize: 10, color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Recent Projects</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 8 }}>
              {recentProjects.slice(0, 4).map(p => (
                <button key={p.path} onClick={async () => { const tree = await AsteriaAPI.readTree(p.path); setWorkspace(p.path, p.name, tree); setMode('code'); }}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
                  <div style={{ fontSize: 13, color: '#d4d4d4', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#333', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: 11, color: '#282828', letterSpacing: '0.06em' }}>
        <span>Ollama</span>
        <span style={{ width: 2, height: 2, background: '#282828', borderRadius: '50%', display: 'inline-block' }} />
        <span>LOCAL</span>
        <span style={{ width: 2, height: 2, background: '#282828', borderRadius: '50%', display: 'inline-block' }} />
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
