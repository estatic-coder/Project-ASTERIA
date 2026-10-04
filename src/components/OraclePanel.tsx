import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage } from '../store/useAppStore';

// ─── Oracle status config ─────────────────────────────────────────
const STATUS_CONFIG = {
  idle:      { icon: '●', label: 'Ready',     color: '#4b5563' },
  observing: { icon: '◌', label: 'Observing', color: '#a3a3a3' },
  thinking:  { icon: '✦', label: 'Thinking',  color: '#d4d4d4' },
  planning:  { icon: '◇', label: 'Planning',  color: '#737373' },
  executing: { icon: '◆', label: 'Executing', color: '#e5e5e5' },
  completed: { icon: '✓', label: 'Complete',  color: '#a3a3a3' },
  failed:    { icon: '✕', label: 'Failed',    color: '#737373' },
} as const;

// ─── Alive Thinking Animation (canvas) ───────────────────────────
function ThinkingAnimation({ status }: { status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width = 260;
    const H = canvas.height = 54;

    // Neural nodes
    const nodes = [
      { x: 20,  y: 27, r: 5 },
      { x: 65,  y: 14, r: 3.5 },
      { x: 65,  y: 40, r: 3.5 },
      { x: 110, y: 27, r: 4.5 },
      { x: 155, y: 14, r: 3 },
      { x: 155, y: 40, r: 3 },
      { x: 200, y: 27, r: 4 },
      { x: 240, y: 27, r: 3 },
    ];
    const edges = [
      [0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[6,7]
    ];

    // Traveling pulses: { edge, t (0-1), speed }
    type Pulse = { edge: number[]; t: number; speed: number; opacity: number };
    const pulses: Pulse[] = [];
    let tick = 0;

    // Node breathe phase
    const phases = nodes.map((_, i) => (i / nodes.length) * Math.PI * 2);

    const spawnPulse = () => {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      pulses.push({ edge, t: 0, speed: 0.012 + Math.random() * 0.012, opacity: 1 });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      tick++;

      // Spawn pulses
      if (tick % 18 === 0) spawnPulse();

      const t = tick * 0.02;

      // Draw edges
      edges.forEach(([a, b]) => {
        const na = nodes[a], nb = nodes[b];
        const grad = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        grad.addColorStop(0, 'rgba(163,163,163,0.08)');
        grad.addColorStop(1, 'rgba(163,163,163,0.08)');
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Animate + draw pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const na = nodes[p.edge[0]], nb = nodes[p.edge[1]];
        const px = na.x + (nb.x - na.x) * p.t;
        const py = na.y + (nb.y - na.y) * p.t;
        const fade = p.t < 0.1 ? p.t / 0.1 : p.t > 0.9 ? (1 - p.t) / 0.1 : 1;
        // Glow trail
        const trail = ctx.createRadialGradient(px, py, 0, px, py, 7);
        trail.addColorStop(0, `rgba(210,210,210,${0.9 * fade})`);
        trail.addColorStop(0.4, `rgba(163,163,163,${0.35 * fade})`);
        trail.addColorStop(1, 'rgba(163,163,163,0)');
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = trail;
        ctx.fill();
        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,230,230,${fade})`;
        ctx.fill();
      }

      // Draw nodes
      nodes.forEach((n, i) => {
        const breathe = 0.7 + 0.3 * Math.sin(t * 1.4 + phases[i]);
        const r = n.r * breathe;
        // Glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        glow.addColorStop(0, `rgba(180,180,180,${0.18 * breathe})`);
        glow.addColorStop(1, 'rgba(163,163,163,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        // Node body
        const ng = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, 0, n.x, n.y, r);
        ng.addColorStop(0, `rgba(220,220,220,${breathe})`);
        ng.addColorStop(1, `rgba(100,100,100,${breathe * 0.8})`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = ng;
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    // Seed initial pulses
    for (let i = 0; i < 3; i++) setTimeout(spawnPulse, i * 300);
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2 }}>
      <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'pixelated' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
        <span style={{
          fontSize: 10, color: '#3a3a3a', letterSpacing: '0.25em', textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
        }}>{status}…</span>
        {/* Live mini-bars */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 10 }}>
          {[1,1.4,0.7,1.2,0.9,1.5,0.8,1.1].map((h, i) => (
            <div key={i} style={{
              width: 2, borderRadius: 1,
              background: 'rgba(163,163,163,0.35)',
              height: `${h * 6}px`,
              animation: `think-bar-live ${0.7 + i * 0.11}s ${i * 0.07}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes think-bar-live {
            from { transform: scaleY(0.3); opacity: 0.25; }
            to   { transform: scaleY(1);   opacity: 0.9; }
          }
        `}</style>
      </div>
    </div>
  );
}


// ─── Message component ─────────────────────────────────────────────
function Message({ msg }: { msg: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const [actOpen, setActOpen] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{
          maxWidth: '88%', padding: '10px 14px', borderRadius: '12px 12px 2px 12px',
          background: 'rgba(163,163,163,0.1)', border: '1px solid rgba(163,163,163,0.18)',
          color: '#d1d5db', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 10, color: '#2a2a2a' }}>{msg.timestamp}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Oracle label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, #262626, #404040)',
          border: '1px solid rgba(163,163,163,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, color: '#e5e5e5' }}>✦</span>
        </div>
        <span style={{ fontSize: 11, color: '#6b7280' }}>Oracle</span>
      </div>

      {/* Activity accordion */}
      {msg.activities && msg.activities.length > 0 && (
        <div>
          <button onClick={() => setActOpen(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12,
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: actOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
              <path d="M2.5 1.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            Worked for {msg.activities.length * 2}m
          </button>
          {actOpen && (
            <div style={{
              marginTop: 6, paddingLeft: 14,
              borderLeft: '1px solid rgba(163,163,163,0.2)',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              {msg.activities.map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: act.status === 'success' ? '#a3a3a3' : act.status === 'failed' ? '#737373' : act.status === 'running' ? '#d4d4d4' : '#2a2a2a' }}>
                    {act.status === 'success' ? '✓' : act.status === 'failed' ? '✕' : act.status === 'running' ? '◌' : '○'}
                  </span>
                  <span style={{ color: '#6b7280' }}>{act.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content - simple markdown-like rendering */}
      <div style={{ color: '#c9d1d9', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {msg.content.split('\n').map((line, i) => {
          if (line.startsWith('### ')) return <h3 key={i} style={{ margin: '8px 0 4px', fontSize: 13, color: '#e5e7eb', fontWeight: 600 }}>{line.slice(4)}</h3>;
          if (line.startsWith('## ')) return <h2 key={i} style={{ margin: '10px 0 4px', fontSize: 14, color: '#e5e7eb', fontWeight: 600 }}>{line.slice(3)}</h2>;
          if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} style={{ color: '#e5e7eb' }}>{line.slice(2, -2)}</strong>;
          if (line.startsWith('- ') || line.startsWith('* ')) return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
              <span style={{ color: '#6b7280', flexShrink: 0 }}>·</span>
              <span>{line.slice(2)}</span>
            </div>
          );
          if (line.match(/^\d+\./)) return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
              <span style={{ color: '#a3a3a3', flexShrink: 0 }}>{line.match(/^\d+/)?.[0]}.</span>
              <span>{line.replace(/^\d+\.\s*/, '')}</span>
            </div>
          );
          return <span key={i}>{line}{i < msg.content.split('\n').length - 1 ? '\n' : ''}</span>;
        })}
        {msg.streaming && <span style={{ color: '#4b5563' }}>▌</span>}
      </div>

      {/* Files changed card */}
      {msg.filesChanged !== undefined && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4,
        }}>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            {msg.filesChanged} files changed
            {' '}<span style={{ color: '#a3a3a3' }}>+{msg.additions}</span>
            {' '}<span style={{ color: '#737373' }}>−{msg.deletions}</span>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '3px 10px', fontSize: 11, color: '#9ca3af', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            Review
          </button>
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#2a2a2a' }}>{msg.timestamp}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: copied ? '✓' : 'copy', action: copy },
            { icon: '↑', action: () => { } },
            { icon: '↓', action: () => { } },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#2a2a2a', fontSize: 11, padding: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
              onMouseLeave={e => (e.currentTarget.style.color = '#2a2a2a')}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Oracle Panel ─────────────────────────────────────────────────
export default function OraclePanel() {
  const { conversations, addMessage, oracleStatus, setOracleStatus, currentModel, workspacePath, mode } = useAppStore();
  const msgs = conversations[mode === 'home' ? 'home' : mode] as ChatMessage[];
  const [input, setInput] = useState('');
  const messagesEnd = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const statusConf = STATUS_CONFIG[oracleStatus];

  const handleSend = useCallback(async () => {
    if (!input.trim() || oracleStatus !== 'idle') return;
    const text = input.trim();
    setInput('');

    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const userMsgId = Date.now().toString();
    const oracleMsgId = (Date.now() + 1).toString();

    addMessage(mode === 'home' ? 'home' : mode as any, { id: userMsgId, role: 'user', content: text, timestamp: now });
    setOracleStatus('observing');

    // Simulate Oracle pipeline
    setTimeout(() => setOracleStatus('thinking'), 800);
    setTimeout(() => {
      setOracleStatus('executing');
      addMessage(mode === 'home' ? 'home' : mode as any, {
        id: oracleMsgId, role: 'oracle',
        content: `I've analyzed the request and the project structure.\n\n### Plan\n\n1. Inspect relevant project files\n2. Identify dependencies and existing patterns\n3. Implement the requested changes\n4. Run validation\n5. Report results`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        streaming: false,
        activities: [
          { id: '1', tool: 'list_directory', status: 'success', detail: `Scanned ${workspacePath ?? 'project'}` },
          { id: '2', tool: 'read_file', status: 'success', detail: 'Read package.json' },
          { id: '3', tool: 'search_files', status: 'success', detail: `Found 4 relevant files` },
        ],
      });
    }, 2200);
    setTimeout(() => setOracleStatus('completed'), 3200);
    setTimeout(() => setOracleStatus('idle'), 4000);
  }, [input, oracleStatus, addMessage, mode, workspacePath, setOracleStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0e0e0e', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0a0a0a', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #262626, #404040)', border: '1px solid rgba(163,163,163,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#e5e5e5' }}>✦</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#d1d5db' }}>Oracle</span>
          <span style={{ fontSize: 11, color: statusConf.color, marginLeft: 4 }}>
            {statusConf.icon} {statusConf.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#1e1e1e', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a3a3a3', display: 'inline-block' }} />
          LOCAL
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {msgs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1e1e1e', textAlign: 'center', gap: 10 }}>
            <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="rgba(163,163,163,0.1)" strokeWidth="1" strokeDasharray="3 5" />
              <circle cx="40" cy="40" r="4" fill="rgba(163,163,163,0.2)" />
            </svg>
            <div style={{ fontSize: 12 }}>The night is quiet.</div>
            <div style={{ fontSize: 11 }}>Ask the Oracle to begin.</div>
          </div>
        ) : (
          msgs.map(msg => <Message key={msg.id} msg={msg} />)
        )}
        
        {oracleStatus !== 'idle' && oracleStatus !== 'completed' && oracleStatus !== 'failed' && (
          <ThinkingAnimation status={STATUS_CONFIG[oracleStatus].label} />
        )}
        
        <div ref={messagesEnd} />
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 14px 12px', flexShrink: 0 }}>
        <div style={{
          background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        }}>
          {/* Context bar */}
          <div style={{
            padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 11, color: '#2a2a2a',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
              {workspacePath ? workspacePath.split('/').pop() : '0 files'}
            </span>
            <button style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 11 }}>Review Changes</button>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything, @ to mention, / for actions"
            rows={1}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: '#c9d1d9', fontSize: 13, padding: '10px 12px',
              resize: 'none', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5,
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />

          {/* Bottom toolbar */}
          <div style={{
            padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>+</button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#2a2a2a',
                background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 12, cursor: 'pointer',
              }}>
                {currentModel}
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 13 }}>⌫</button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || oracleStatus !== 'idle'}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: input.trim() && oracleStatus === 'idle' ? 'rgba(163,163,163,0.7)' : 'rgba(255,255,255,0.05)',
                  color: input.trim() && oracleStatus === 'idle' ? '#fff' : '#2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() && oracleStatus === 'idle' ? 'pointer' : 'default', transition: 'all 0.2s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
