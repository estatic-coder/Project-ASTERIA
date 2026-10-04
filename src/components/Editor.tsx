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
      background: '#0e0e0e', borderBottom: '1px solid rgba(255,255,255,0.06)',
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
              background: isActive ? '#111111' : 'transparent',
              borderTop: isActive ? '1px solid rgba(163,163,163,0.5)' : '1px solid transparent',
              position: 'relative', flexShrink: 0, userSelect: 'none',
            }}>
            {/* File type dot */}
            <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: tab.isDirty ? '#a3a3a3' : 'rgba(163,163,163,0.3)' }} />
            <span style={{ fontSize: 12.5, color: isActive ? '#e5e7eb' : '#6b7280', whiteSpace: 'nowrap' }}>
              {tab.fileName}
            </span>
            {tab.isDirty && <span style={{ fontSize: 10, color: '#a3a3a3', marginLeft: -2 }}>●</span>}
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
      color: '#2a2a2a', gap: 10,
    }}>
      <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="36" stroke="rgba(163,163,163,0.1)" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="40" cy="40" r="16" stroke="rgba(163,163,163,0.15)" strokeWidth="1" />
        <circle cx="40" cy="40" r="3" fill="rgba(163,163,163,0.3)" />
      </svg>
      <div style={{ fontSize: 13 }}>
        {workspacePath ? 'Open a file from the Explorer' : 'No folder open'}
      </div>
      <div style={{ fontSize: 11, color: '#1e1e1e' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0e0e0e' }}>
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
                  { token: 'comment',  foreground: '404040', fontStyle: 'italic' },
                  { token: 'keyword',  foreground: 'a3a3a3', fontStyle: 'bold' },
                  { token: 'string',   foreground: '8a8a8a' },
                  { token: 'number',   foreground: 'c4c4c4' },
                  { token: 'function', foreground: 'd4d4d4' },
                  { token: 'type',     foreground: 'b5b5b5' },
                ],
                colors: {
                  'editor.background':                '#0e0e0e',
                  'editor.foreground':                '#c4c4c4',
                  'editor.lineHighlightBackground':   '#141414',
                  'editorLineNumber.foreground':      '#2a2a2a',
                  'editorLineNumber.activeForeground':'#525252',
                  'editor.selectionBackground':       '#2a2a2a',
                  'editor.inactiveSelectionBackground':'#1e1e1e',
                  'editorCursor.foreground':          '#a3a3a3',
                  'scrollbarSlider.background':       '#1a1a1a',
                  'scrollbarSlider.hoverBackground':  '#2a2a2a',
                  'minimap.background':               '#0a0a0a',
                  'editor.wordHighlightBackground':   '#222222',
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
