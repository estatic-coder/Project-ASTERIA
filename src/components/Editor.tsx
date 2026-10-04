import { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppStore } from '../store/useAppStore';
import { AsteriaAPI } from '../core/AsteriaAPI';

function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useAppStore();

  if (tabs.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)',
      overflowX: 'auto', flexShrink: 0, height: 36,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        return (
          <div key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', height: '100%', cursor: 'pointer',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              background: isActive ? '#0f1117' : 'transparent',
              borderTop: isActive ? '1px solid rgba(139,92,246,0.5)' : '1px solid transparent',
              position: 'relative', flexShrink: 0, userSelect: 'none',
            }}>
            {/* File type dot */}
            <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: tab.isDirty ? '#f59e0b' : 'rgba(139,92,246,0.4)' }} />
            <span style={{ fontSize: 12.5, color: isActive ? '#e5e7eb' : '#6b7280', whiteSpace: 'nowrap' }}>
              {tab.fileName}
            </span>
            {tab.isDirty && <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: -2 }}>●</span>}
            <button
              onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
              style={{
                background: 'none', border: 'none', color: '#4b5563',
                cursor: 'pointer', padding: '1px 2px', borderRadius: 3,
                display: 'flex', alignItems: 'center', marginLeft: 2,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function EmptyEditor({ workspacePath }: { workspacePath: string | null }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#374151', gap: 10,
    }}>
      <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke="rgba(139,92,246,0.1)" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="40" cy="40" r="16" stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
        <circle cx="40" cy="40" r="3" fill="rgba(139,92,246,0.3)" />
      </svg>
      <div style={{ fontSize: 13 }}>
        {workspacePath ? 'Open a file from the Explorer' : 'No folder open'}
      </div>
      <div style={{ fontSize: 11, color: '#1f2937' }}>
        {workspacePath ? 'Click a file in the sidebar to begin' : 'Use File → Open Folder to start'}
      </div>
    </div>
  );
}

export default function CodeEditor() {
  const { tabs, activeTabId, updateTabContent } = useAppStore();
  const workspacePath = useAppStore(s => s.workspacePath);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const editorRef = useRef<any>(null);

  const handleSave = async () => {
    if (!activeTab || !activeTab.isDirty) return;
    await AsteriaAPI.writeFile(activeTab.filePath, activeTab.content);
    // Mark as saved
    useAppStore.getState().updateTabContent(activeTab.id, activeTab.content);
    // Reset dirty flag
    useAppStore.setState(s => ({
      tabs: s.tabs.map(t => t.id === activeTab.id ? { ...t, isDirty: false } : t)
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117' }}>
      <TabBar />

      {activeTab ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <MonacoEditor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme="vs-dark"
            options={{
              fontSize: 13.5,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontLigatures: true,
              lineHeight: 1.7,
              minimap: { enabled: true, scale: 0.7 },
              scrollBeyondLastLine: false,
              renderWhitespace: 'boundary',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: 'on',
              cursorBlinking: 'phase',
              padding: { top: 16 },
              overviewRulerBorder: false,
              renderLineHighlight: 'gutter',
              wordWrap: 'off',
            }}
            onChange={val => {
              if (activeTab && val !== undefined) updateTabContent(activeTab.id, val);
            }}
            onMount={(editor, monaco) => {
              editorRef.current = editor;

              // Dark ASTERIA theme
              monaco.editor.defineTheme('asteria-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                  { token: 'comment', foreground: '3d4a60', fontStyle: 'italic' },
                  { token: 'keyword', foreground: 'a78bfa' },
                  { token: 'string', foreground: '6ee7b7' },
                  { token: 'number', foreground: 'f9a8d4' },
                  { token: 'function', foreground: '93c5fd' },
                  { token: 'type', foreground: 'fde68a' },
                ],
                colors: {
                  'editor.background': '#0d1117',
                  'editor.foreground': '#c9d1d9',
                  'editor.lineHighlightBackground': '#111827',
                  'editorLineNumber.foreground': '#2d3748',
                  'editorLineNumber.activeForeground': '#4b5563',
                  'editor.selectionBackground': '#1e3a5f',
                  'editor.inactiveSelectionBackground': '#172032',
                  'editorCursor.foreground': '#8b5cf6',
                  'scrollbarSlider.background': '#1f2937',
                  'scrollbarSlider.hoverBackground': '#374151',
                  'minimap.background': '#0a0d14',
                  'editor.wordHighlightBackground': '#1f2937',
                },
              });
              monaco.editor.setTheme('asteria-dark');

              // Ctrl+S to save
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
            }}
          />
        </div>
      ) : (
        <EmptyEditor workspacePath={workspacePath} />
      )}
    </div>
  );
}
