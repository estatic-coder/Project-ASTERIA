import { useEffect, useRef, useState } from 'react';
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

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.0 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
    }));

    let t = 0;
    const draw = () => {
      t += 0.016;
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const a = 0.06 + 0.12 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
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
  { id: 'general', label: 'General', icon: '✦', desc: 'Open-ended reasoning, questions, and exploration.' },
  { id: 'code', label: 'Code', icon: '◇', desc: 'Build, debug, refactor, and understand software.' },
  { id: 'research', label: 'Research', icon: '◌', desc: 'Explore ideas, read documents, and reason deeply.' },
  { id: 'writing', label: 'Write', icon: '✧', desc: 'Draft, rewrite, and refine text and documents.' },
  { id: 'analysis', label: 'Analyze', icon: '◎', desc: 'Examine data, patterns, and draw conclusions.' },
] as const;

type ModeId = (typeof MODES)[number]['id'];

export default function AsteriaHome() {
  const { conversations, addMessage, currentModel, availableModels, setCurrentModel, setMode, setWorkspace, addRecentProject, recentProjects } = useAppStore();
  const [selectedMode, setSelectedMode] = useState<ModeId>('general');
  const [input, setInput] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgs = conversations['home'];

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    // If code mode selected, handle project transition
    if (selectedMode === 'code') {
      handleEnterCode(text);
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    addMessage('home', { id: Date.now().toString(), role: 'user', content: text, timestamp: now });

    // Mock oracle response
    setTimeout(() => {
      addMessage('home', {
        id: (Date.now() + 1).toString(),
        role: 'oracle',
        content: `I understand you want to explore: "${text}"\n\nI'm ready to help. What would you like to dive into first?`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      });
    }, 1000);
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
      // Fallback to code mode without project
      setMode('code');
    }
    setEntering(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#04060e', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <StarCanvas />

      {/* Radial nebula glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(60,20,140,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 30% 30% at 70% 20%, rgba(30,10,80,0.08) 0%, transparent 60%)
        `
      }} />

      {/* Top right: model indicator */}
      <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          onClick={() => setModelOpen(!modelOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '6px 12px', borderRadius: 20,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#9ca3af', fontSize: 12,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />
          <span style={{ color: '#d1d5db' }}>{currentModel}</span>
          <span style={{ opacity: 0.5 }}>LOCAL</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>

        {modelOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: 4, minWidth: 200, zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            {availableModels.length === 0
              ? <div style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>No local models detected.<br/>Start Ollama to use local models.</div>
              : availableModels.map(m => (
                <div key={m.name} onClick={() => { setCurrentModel(m.name); setModelOpen(false); }} style={{
                  padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                  color: m.name === currentModel ? '#c4b5fd' : '#d1d5db',
                  background: m.name === currentModel ? 'rgba(139,92,246,0.1)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{m.name}</span>
                  {m.name === currentModel && <span style={{ color: '#8b5cf6' }}>✓</span>}
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Main centered content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', position: 'relative', zIndex: 1, gap: 0,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ marginBottom: 12 }}>
            <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="3 5" />
              <circle cx="40" cy="40" r="18" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
              <line x1="40" y1="22" x2="40" y2="8" stroke="rgba(160,130,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="40" y1="58" x2="40" y2="72" stroke="rgba(160,130,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="22" y1="40" x2="8" y2="40" stroke="rgba(160,130,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="58" y1="40" x2="72" y2="40" stroke="rgba(160,130,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="40" cy="40" r="5" fill="rgba(139,92,246,0.8)" />
              <circle cx="40" cy="40" r="2" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 200, letterSpacing: '0.35em',
            color: '#ede9fe', margin: 0, textTransform: 'uppercase',
          }}>
            ASTERIA
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(139,92,246,0.6)', margin: '8px 0 0', letterSpacing: '0.05em', fontWeight: 300 }}>
            What shall we explore tonight?
          </p>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 20,
                background: selectedMode === m.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedMode === m.id ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: selectedMode === m.id ? '#c4b5fd' : '#6b7280',
                fontSize: 12.5, cursor: 'pointer', fontWeight: 400,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ opacity: 0.8 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Main input */}
        <div style={{ width: '100%', maxWidth: 620, position: 'relative' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
            onFocus={() => { }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={selectedMode === 'code' ? 'Describe what you want to build, or just open a folder...' : 'Ask the Oracle...'}
              rows={1}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: '#e5e7eb', fontSize: 14, padding: '16px 16px 12px',
                resize: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: 1.6, minHeight: 52,
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 11, color: '#374151' }}>
                ↵ to send  •  Shift+↵ for newline
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedMode === 'code' && (
                  <button
                    onClick={() => handleEnterCode()}
                    disabled={entering}
                    style={{
                      padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                      background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                      color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {entering ? '◌ Opening...' : '◇ Open Folder'}
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', border: 'none',
                    background: input.trim() ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.05)',
                    color: input.trim() ? '#fff' : '#374151',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent conversations or recent projects */}
        {msgs.length === 0 && (
          <div style={{ marginTop: 40, width: '100%', maxWidth: 620 }}>
            {recentProjects.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Recent Projects
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                  {recentProjects.slice(0, 4).map(p => (
                    <button key={p.path} onClick={async () => {
                      const tree = await AsteriaAPI.readTree(p.path);
                      setWorkspace(p.path, p.name, tree);
                      setMode('code');
                    }}
                      style={{
                        textAlign: 'left', padding: '12px 14px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    >
                      <div style={{ fontSize: 12.5, color: '#d1d5db', fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.path}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#1f2937', fontSize: 13 }}>
                Every system begins as a few scattered stars.
              </div>
            )}
          </div>
        )}

        {/* Conversation history in home */}
        {msgs.length > 0 && (
          <div style={{ marginTop: 32, width: '100%', maxWidth: 620, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {msgs.slice(-6).map(m => (
              <div key={m.id} style={{
                padding: '12px 16px', borderRadius: 10,
                background: m.role === 'user' ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${m.role === 'user' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.06)'}`,
                color: m.role === 'user' ? '#c4b5fd' : '#9ca3af',
                fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {m.role === 'oracle' && <span style={{ color: '#4b5563', fontSize: 11, display: 'block', marginBottom: 4 }}>Oracle</span>}
                {m.content}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom minimal bar */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20, borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 11, color: '#1f2937',
      }}>
        <span>Ollama</span>
        <span>•</span>
        <span>LOCAL</span>
        <span>•</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
