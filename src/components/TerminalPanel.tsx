

const IconDot = ({ color }: { color: string }) => (
  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', cursor: 'pointer', transition: 'opacity 0.15s' }} />
);

export default function TerminalPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="terminal-header">
        <span style={{ display: 'flex', gap: 6, marginRight: 10 }}>
          <IconDot color="#737373" />
          <IconDot color="#f59e0b" />
          <IconDot color="#a3a3a3" />
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
          Terminal
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-ghost)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>
          bash — asteria
        </span>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        padding: '10px 16px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 12.5,
        lineHeight: 1.65,
        overflowY: 'auto',
        color: '#94a87a',
      }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: '#7c9b6e' }}>asteria@local</span>
          <span style={{ color: 'var(--text-muted)' }}>:</span>
          <span style={{ color: '#6b8fdf' }}>~/Projects/asteria</span>
          <span style={{ color: 'var(--text-muted)' }}>$ </span>
          <span style={{ color: 'var(--text-primary)' }}>npm run dev</span>
        </div>

        <div style={{ color: '#a3a3a3', marginBottom: 4 }}>
          &nbsp;&gt; asteria@1.0.0 dev
        </div>
        <div style={{ color: '#a3a3a3', marginBottom: 8 }}>
          &nbsp;&gt; vite-plugin-electron/simple
        </div>

        <div style={{ color: '#d4d4d4', marginBottom: 2 }}>
          VITE v5.4.21 &nbsp;ready in 304 ms
        </div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 1 }}>
          &nbsp;➜ &nbsp;<span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Local:</span>
          &nbsp;&nbsp; <span style={{ color: '#6b8fdf' }}>http://localhost:5173/</span>
        </div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
          &nbsp;➜ &nbsp;<span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Network:</span> use --host to expose
        </div>

        <div>
          <span style={{ color: '#7c9b6e' }}>asteria@local</span>
          <span style={{ color: 'var(--text-muted)' }}>:</span>
          <span style={{ color: '#6b8fdf' }}>~/Projects/asteria</span>
          <span style={{ color: 'var(--text-muted)' }}>$ </span>
          <span style={{ color: 'var(--text-primary)', animation: 'twinkle 1s ease-in-out infinite', display: 'inline-block' }}>█</span>
        </div>
      </div>
    </div>
  );
}
