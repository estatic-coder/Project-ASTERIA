import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage } from '../store/useAppStore';

// ─── Oracle status config ─────────────────────────────────────────
const STATUS_CONFIG = {
  idle:      { icon: '●', label: 'Ready',     color: '#4b5563' },
  observing: { icon: '◌', label: 'Observing', color: '#8b5cf6' },
  thinking:  { icon: '✦', label: 'Thinking',  color: '#a78bfa' },
  planning:  { icon: '◇', label: 'Planning',  color: '#6366f1' },
  executing: { icon: '◆', label: 'Executing', color: '#c4b5fd' },
  completed: { icon: '✓', label: 'Complete',  color: '#34d399' },
  failed:    { icon: '✕', label: 'Failed',    color: '#f87171' },
} as const;

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
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)',
          color: '#d1d5db', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 10, color: '#374151' }}>{msg.timestamp}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Oracle label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2e1065, #5b21b6)',
          border: '1px solid rgba(139,92,246,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, color: '#c4b5fd' }}>✦</span>
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
              borderLeft: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              {msg.activities.map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ color: act.status === 'success' ? '#34d399' : act.status === 'failed' ? '#f87171' : act.status === 'running' ? '#a78bfa' : '#374151' }}>
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
              <span style={{ color: '#8b5cf6', flexShrink: 0 }}>{line.match(/^\d+/)?.[0]}.</span>
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
            {' '}<span style={{ color: '#34d399' }}>+{msg.additions}</span>
            {' '}<span style={{ color: '#f87171' }}>−{msg.deletions}</span>
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
        <span style={{ fontSize: 10, color: '#374151' }}>{msg.timestamp}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: copied ? '✓' : 'copy', action: copy },
            { icon: '↑', action: () => { } },
            { icon: '↓', action: () => { } },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#374151', fontSize: 11, padding: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
              onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0a0d14', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #2e1065, #5b21b6)', border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#c4b5fd' }}>✦</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#d1d5db' }}>Oracle</span>
          <span style={{ fontSize: 11, color: statusConf.color, marginLeft: 4 }}>
            {statusConf.icon} {statusConf.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          LOCAL
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {msgs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1f2937', textAlign: 'center', gap: 10 }}>
            <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="rgba(139,92,246,0.1)" strokeWidth="1" strokeDasharray="3 5" />
              <circle cx="40" cy="40" r="4" fill="rgba(139,92,246,0.2)" />
            </svg>
            <div style={{ fontSize: 12 }}>The night is quiet.</div>
            <div style={{ fontSize: 11 }}>Ask the Oracle to begin.</div>
          </div>
        ) : (
          msgs.map(msg => <Message key={msg.id} msg={msg} />)
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 14px 12px', flexShrink: 0 }}>
        <div style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        }}>
          {/* Context bar */}
          <div style={{
            padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 11, color: '#374151',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
              {workspacePath ? workspacePath.split('/').pop() : '0 files'}
            </span>
            <button style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 11 }}>Review Changes</button>
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
              <button style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>+</button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#374151',
                background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 12, cursor: 'pointer',
              }}>
                {currentModel}
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 13 }}>⌫</button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || oracleStatus !== 'idle'}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: input.trim() && oracleStatus === 'idle' ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.05)',
                  color: input.trim() && oracleStatus === 'idle' ? '#fff' : '#374151',
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
