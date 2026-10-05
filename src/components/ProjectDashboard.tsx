
import { useAppStore } from '../store/useAppStore';
import { AsteriaAPI } from '../core/AsteriaAPI';

export default function ProjectDashboard() {
  const { setWorkspace, addRecentProject, recentProjects } = useAppStore();

  const handleOpenFolder = async () => {
    try {
      const path = await AsteriaAPI.openFolder();
      if (!path) return;
      const name = path.split('/').pop() || path;
      const tree = await AsteriaAPI.readTree(path);
      setWorkspace(path, name, tree);
      addRecentProject(path, name);
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#161616',
      color: '#e5e5e5',
      fontFamily: 'Inter, system-ui, sans-serif',
      height: '100%',
      WebkitAppRegion: 'drag'
    } as React.CSSProperties}>
      <div style={{ width: 340, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 12, filter: 'brightness(1.5)' }} />
          <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0, letterSpacing: '0.02em', color: '#f0f0f0' }}>Antigravity IDE</h1>
        </div>

        {/* Main Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
          <button
            onClick={handleOpenFolder}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px', borderRadius: 4,
              background: '#0e639c', color: '#ffffff', border: 'none',
              fontSize: 13, cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1177bb'}
            onMouseLeave={e => e.currentTarget.style.background = '#0e639c'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Open Folder
          </button>
          <button
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px', borderRadius: 4,
              background: '#2d2d2d', color: '#cccccc', border: 'none',
              fontSize: 13, cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#363636'}
            onMouseLeave={e => e.currentTarget.style.background = '#2d2d2d'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Clone Repository
          </button>
        </div>

        {/* Workspaces */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 12 }}>Workspaces</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #2d2d2d', borderRadius: 6, overflow: 'hidden' }}>
            {recentProjects.slice(0, 3).map((proj, i) => (
              <div key={proj.path} style={{
                padding: '12px 14px',
                background: '#1e1e1e',
                borderBottom: i < 2 ? '1px solid #2d2d2d' : 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#262626'}
              onMouseLeave={e => e.currentTarget.style.background = '#1e1e1e'}
              onClick={() => {
                AsteriaAPI.readTree(proj.path).then(tree => {
                  setWorkspace(proj.path, proj.name, tree);
                });
              }}
              >
                <div style={{ fontSize: 13, color: '#e0e0e0', marginBottom: 4 }}>{proj.name}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{proj.path.replace(/\/home\/[^/]+/, '~')}</div>
              </div>
            ))}
            {recentProjects.length === 0 && (
              <div style={{ padding: '20px', background: '#1e1e1e', color: '#666', fontSize: 12, textAlign: 'center' }}>
                No recent workspaces
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 11, color: '#666', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#888'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>
              Show More...
            </span>
          </div>
        </div>

        {/* Google Extensions */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 12 }}>Google Extensions</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#1e1e1e', border: '1px solid #2d2d2d', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, background: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#e0e0e0', fontWeight: 500 }}>Google Data Cloud</div>
                <div style={{ fontSize: 11, color: '#666' }}>Google Data Cloud for your intelligent IDE.</div>
              </div>
            </div>
            <button style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: 4, fontSize: 11, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#ddd'} onMouseLeave={e => e.currentTarget.style.color = '#aaa'}>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
