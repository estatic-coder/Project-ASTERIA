import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AsteriaAPI } from '../core/AsteriaAPI';
import type { ChatMessage } from '../store/useAppStore';

// ─── Oracle status config ─────────────────────────────────────────
const STATUS_CONFIG = {
  idle:      { icon: '●', label: 'Ready',     color: '#333' },
  observing: { icon: '◌', label: 'Observing', color: '#525252' },
  thinking:  { icon: '✦', label: 'Thinking',  color: '#a3a3a3' },
  planning:  { icon: '◇', label: 'Planning',  color: '#737373' },
  executing: { icon: '◆', label: 'Executing', color: '#d4d4d4' },
  completed: { icon: '✓', label: 'Complete',  color: '#525252' },
  failed:    { icon: '✕', label: 'Failed',    color: '#525252' },
} as const;

// ─── Neural Thinking Canvas ─────────────────────────────────────────
function ThinkingAnimation({ status }: { status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width = 260;
    const H = canvas.height = 50;

    const nodes = [
      { x: 18, y: 25, r: 4.5 }, { x: 60, y: 13, r: 3 }, { x: 60, y: 37, r: 3 },
      { x: 105, y: 25, r: 4 }, { x: 148, y: 13, r: 2.8 }, { x: 148, y: 37, r: 2.8 },
      { x: 193, y: 25, r: 3.5 }, { x: 238, y: 25, r: 2.8 },
    ];
    const edges = [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[6,7]];

    type Pulse = { edge: number[]; t: number; speed: number };
    const pulses: Pulse[] = [];
    let tick = 0;
    const phases = nodes.map((_, i) => (i / nodes.length) * Math.PI * 2);

    const spawnPulse = () => {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      pulses.push({ edge, t: 0, speed: 0.014 + Math.random() * 0.01 });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      tick++;
      if (tick % 16 === 0) spawnPulse();
      const t = tick * 0.018;

      // Edges
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.strokeStyle = 'rgba(163,163,163,0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const na = nodes[p.edge[0]], nb = nodes[p.edge[1]];
        const px = na.x + (nb.x - na.x) * p.t;
        const py = na.y + (nb.y - na.y) * p.t;
        const fade = p.t < 0.1 ? p.t / 0.1 : p.t > 0.9 ? (1 - p.t) / 0.1 : 1;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 6);
        g.addColorStop(0, `rgba(200,200,200,${0.85 * fade})`);
        g.addColorStop(0.5, `rgba(163,163,163,${0.3 * fade})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,230,230,${fade})`; ctx.fill();
      }

      // Nodes
      nodes.forEach((n, i) => {
        const breathe = 0.7 + 0.3 * Math.sin(t * 1.3 + phases[i]);
        const r = n.r * breathe;
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.8);
        glow.addColorStop(0, `rgba(180,180,180,${0.15 * breathe})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        const ng = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, 0, n.x, n.y, r);
        ng.addColorStop(0, `rgba(220,220,220,${breathe})`);
        ng.addColorStop(1, `rgba(80,80,80,${breathe * 0.8})`);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = ng; ctx.fill();
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    for (let i = 0; i < 3; i++) setTimeout(spawnPulse, i * 250);
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10 }}>
        <span style={{ fontSize: 9.5, color: '#2a2a2a', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
          {status}…
        </span>
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 9 }}>
          {[1, 1.4, 0.7, 1.2, 0.9, 1.5, 0.8, 1.1].map((h, i) => (
            <div key={i} style={{
              width: 2, borderRadius: 1, background: 'rgba(163,163,163,0.3)',
              height: `${h * 6}px`,
              animation: `oracle-bar ${0.65 + i * 0.1}s ${i * 0.06}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes oracle-bar {
          from { transform: scaleY(0.25); opacity: 0.2; }
          to   { transform: scaleY(1); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

// ─── Code block renderer ───────────────────────────────────────────
function renderContent(content: string, streaming?: boolean) {
  const lines = content.split('\n');
  const output: React.ReactNode[] = [];
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];

  const flushCode = (key: string) => {
    output.push(
      <div key={key} style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 7, overflow: 'hidden', marginTop: 4, marginBottom: 4,
      }}>
        {codeLang && (
          <div style={{ padding: '4px 12px', fontSize: 10, color: '#333', borderBottom: '1px solid rgba(255,255,255,0.04)', letterSpacing: '0.1em' }}>
            {codeLang}
          </div>
        )}
        <pre style={{ margin: 0, padding: '10px 12px', fontSize: 11.5, color: '#a3a3a3', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", overflowX: 'auto', lineHeight: 1.6 }}>
          {codeLines.join('\n')}
        </pre>
      </div>
    );
    codeLines = [];
    codeLang = '';
  };

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
      } else {
        inCode = false;
        flushCode(`code-${i}`);
      }
      return;
    }
    if (inCode) { codeLines.push(line); return; }

    if (line.startsWith('### ')) output.push(<div key={i} style={{ fontSize: 12, fontWeight: 600, color: '#c4c4c4', margin: '8px 0 3px' }}>{line.slice(4)}</div>);
    else if (line.startsWith('## ')) output.push(<div key={i} style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d4', margin: '10px 0 4px' }}>{line.slice(3)}</div>);
    else if (line.startsWith('- ') || line.startsWith('* '))
      output.push(<div key={i} style={{ display: 'flex', gap: 7, marginLeft: 4, color: '#737373', fontSize: 12 }}><span style={{ flexShrink: 0, marginTop: 2 }}>·</span><span style={{ color: '#8f8f8f' }}>{line.slice(2)}</span></div>);
    else if (line.match(/^\d+\./))
      output.push(<div key={i} style={{ display: 'flex', gap: 7, marginLeft: 4, fontSize: 12 }}><span style={{ color: '#525252', flexShrink: 0 }}>{line.match(/^\d+/)?.[0]}.</span><span style={{ color: '#8f8f8f' }}>{line.replace(/^\d+\.\s*/, '')}</span></div>);
    else
      output.push(<span key={i} style={{ fontSize: 12.5, color: '#737373', lineHeight: 1.7 }}>{line}{i < lines.length - 1 ? '\n' : ''}</span>);
  });

  if (inCode) flushCode('code-final');

  return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}{streaming && <span style={{ color: '#2a2a2a', animation: 'cursor-blink 0.8s step-end infinite' }}>▌</span>}</div>;
}

// ─── Message ───────────────────────────────────────────────────────
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
          maxWidth: '90%', padding: '9px 13px', borderRadius: '10px 10px 3px 10px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#c4c4c4', fontSize: 12.5, lineHeight: 1.65, whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 9.5, color: '#1e1e1e' }}>{msg.timestamp}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {/* Oracle label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e1e1e, #333)',
          border: '1px solid rgba(163,163,163,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 8, color: '#a3a3a3' }}>✦</span>
        </div>
        <span style={{ fontSize: 10.5, color: '#333', fontWeight: 500 }}>Oracle</span>
      </div>

      {/* Activity accordion */}
      {msg.activities && msg.activities.length > 0 && (
        <div>
          <button onClick={() => setActOpen(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
            display: 'flex', alignItems: 'center', gap: 5, color: '#333', fontSize: 11,
          }}>
            <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: actOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M2 1.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            Worked for {msg.activities.length * 2}s
          </button>
          {actOpen && (
            <div style={{ marginTop: 5, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {msg.activities.map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ color: act.status === 'success' ? '#525252' : act.status === 'running' ? '#a3a3a3' : '#2a2a2a' }}>
                    {act.status === 'success' ? '✓' : act.status === 'running' ? '◌' : '○'}
                  </span>
                  <span style={{ color: '#404040' }}>{act.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {renderContent(msg.content, msg.streaming)}

      {/* Files changed */}
      {msg.filesChanged !== undefined && (
        <div style={{
          padding: '8px 12px', borderRadius: 7,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2,
        }}>
          <div style={{ fontSize: 11, color: '#525252' }}>
            {msg.filesChanged} files changed
            {' '}<span style={{ color: '#3f3f3f' }}>+{msg.additions}</span>
            {' '}<span style={{ color: '#2a2a2a' }}>−{msg.deletions}</span>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 5, padding: '3px 10px', fontSize: 10.5, color: '#525252', cursor: 'pointer',
          }}>Review</button>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 1 }}>
        <span style={{ fontSize: 9.5, color: '#1e1e1e' }}>{msg.timestamp}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: copied ? '✓' : '⎘', title: 'Copy', action: copy },
            { icon: '↑', title: 'Upvote', action: () => {} },
            { icon: '↓', title: 'Downvote', action: () => {} },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} title={btn.title} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#222', fontSize: 11, padding: 0, transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#737373')}
              onMouseLeave={e => (e.currentTarget.style.color = '#222')}
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
  const { conversations, addMessage, oracleStatus, setOracleStatus, currentModel, setCurrentModel, availableModels, workspacePath, mode } = useAppStore();
  const msgs = (conversations[mode === 'home' ? 'home' : mode as keyof typeof conversations] || []) as ChatMessage[];
  const [input, setInput] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);



  const handleSend = useCallback(async () => {
    if (!input.trim() || oracleStatus !== 'idle') return;
    const text = input.trim();
    setInput('');
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const oracleMsgId = (Date.now() + 1).toString();
    const targetMode = mode === 'home' ? 'home' : mode as any;

    addMessage(targetMode, { id: Date.now().toString(), role: 'user', content: text, timestamp: now });
    setOracleStatus('observing');
    setTimeout(() => setOracleStatus('thinking'), 700);
    setTimeout(() => {
      setOracleStatus('executing');
      addMessage(targetMode, {
        id: oracleMsgId, role: 'oracle',
        content: `I've analyzed the request and the project structure.\n\n### Plan\n\n1. Inspect relevant project files\n2. Identify dependencies and existing patterns\n3. Implement the requested changes\n4. Run validation\n5. Report results`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        streaming: false,
        activities: [
          { id: '1', tool: 'list_directory', status: 'success', detail: `Scanned ${workspacePath ?? 'project'}` },
          { id: '2', tool: 'read_file', status: 'success', detail: 'Read package.json' },
          { id: '3', tool: 'search_files', status: 'success', detail: 'Found 4 relevant files' },
        ],
      });
    }, 2000);
    setTimeout(() => setOracleStatus('completed'), 3000);
    setTimeout(() => setOracleStatus('idle'), 4000);
  }, [input, oracleStatus, addMessage, mode, workspacePath, setOracleStatus]);

  return (
    <>
      <style>{`
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: '#0a0a0a',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {msgs.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.5 }}>
              <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="rgba(163,163,163,0.15)" strokeWidth="1" strokeDasharray="3 5" />
                <circle cx="40" cy="40" r="4" fill="rgba(163,163,163,0.15)" />
              </svg>
              <div style={{ fontSize: 11.5, color: '#1e1e1e', textAlign: 'center', lineHeight: 1.6 }}>
                The night is quiet.<br />
                <span style={{ fontSize: 10, color: '#161616' }}>Ask the Oracle to begin.</span>
              </div>
            </div>
          ) : (
            msgs.map(msg => <Message key={msg.id} msg={msg} />)
          )}

          {oracleStatus !== 'idle' && oracleStatus !== 'completed' && oracleStatus !== 'failed' && (
            <ThinkingAnimation status={STATUS_CONFIG[oracleStatus].label} />
          )}

          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 12px 12px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, position: 'relative',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          >
            {/* Context bar */}
            <div style={{
              padding: '5px 11px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 10.5, color: '#222',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {workspacePath ? workspacePath.split('/').pop() : 'No project'}
              </span>
              <button style={{ background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer', fontSize: 10.5 }}>Review ›</button>
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything, @ to mention, / for actions"
              rows={1}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: '#a3a3a3', fontSize: 12.5, padding: '9px 12px',
                resize: 'none', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.55,
                boxSizing: 'border-box',
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />

            {/* Bottom toolbar */}
            <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    if (AsteriaAPI && AsteriaAPI.openFolder) {
                      AsteriaAPI.openFolder().then(async (path: string | null) => {
                        if (path) {
                          const name = path.split('/').pop() || path;
                          const tree = await AsteriaAPI.readTree(path);
                          useAppStore.getState().setWorkspace(path, name, tree);
                        }
                      }).catch((e: any) => console.error(e));
                    }
                  }}
                  style={{ background: 'none', border: 'none', outline: 'none', color: '#a3a3a3', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#d4d4d4')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}
                >+</button>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setModelOpen(p => !p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: '#a3a3a3',
                      background: 'rgba(255,255,255,0.03)', padding: '2px 7px', borderRadius: 10, cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#d4d4d4')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}
                  >
                    {currentModel || 'No model'}
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  {modelOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setModelOpen(false)} />
                      <div style={{
                        position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 99,
                        background: '#161616', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '4px', minWidth: 140, maxHeight: 250, overflowY: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                      }}>
                        {availableModels.length === 0 ? (
                          <div style={{ padding: '6px 10px', color: '#737373', fontSize: 11 }}>No local models detected</div>
                        ) : availableModels.map(m => (
                          <button key={m.name}
                            onClick={() => { setCurrentModel(m.name); setModelOpen(false); }}
                            style={{
                              display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
                              background: currentModel === m.name ? 'rgba(255,255,255,0.05)' : 'transparent',
                              border: 'none', color: currentModel === m.name ? '#e5e5e5' : '#8f8f8f',
                              fontSize: 11, cursor: 'pointer', borderRadius: 4
                            }}
                            onMouseEnter={e => { if (currentModel !== m.name) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                            onMouseLeave={e => { if (currentModel !== m.name) e.currentTarget.style.background = 'transparent' }}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || oracleStatus !== 'idle'}
                style={{
                  width: 26, height: 26, borderRadius: '50%', border: 'none',
                  background: input.trim() && oracleStatus === 'idle' ? 'rgba(163,163,163,0.6)' : 'rgba(255,255,255,0.04)',
                  color: input.trim() && oracleStatus === 'idle' ? '#fff' : '#1e1e1e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() && oracleStatus === 'idle' ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
