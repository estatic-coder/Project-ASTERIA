import React, { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AsteriaAPI, FileNode } from '../core/AsteriaAPI';

// ─── File extension → color ────────────────────────────────────────
function getExtColor(ext: string): string {
  const map: Record<string, string> = {
    ts: '#3178c6', tsx: '#3178c6', js: '#f7df1e', jsx: '#f7df1e',
    py: '#3572a5', rs: '#ce4a2e', go: '#00add8', json: '#cbcb41',
    md: '#6db1e8', css: '#563d7c', scss: '#c6538c', html: '#e34c26',
    yml: '#cb171e', yaml: '#cb171e', sh: '#89e051', toml: '#9c4221',
    lock: '#525252', svg: '#ff9800',
  };
  return map[ext] || '#525252';
}

// ─── File Icon ──────────────────────────────────────────────────────
function FileIcon({ name, isFolder, expanded }: { name: string; isFolder: boolean; expanded?: boolean }) {
  if (isFolder) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path
          d={expanded
            ? "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2z"
            : "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"}
          stroke={expanded ? '#737373' : '#525252'}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          fill={expanded ? 'rgba(115,115,115,0.15)' : 'none'}
        />
      </svg>
    );
  }
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const color = getExtColor(ext);
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <polyline points="13 2 13 9 20 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

// ─── Context Menu ──────────────────────────────────────────────────
interface CtxMenu { x: number; y: number; node: FileNode }

function ContextMenu({ menu, onClose, onAction }: { menu: CtxMenu; onClose: () => void; onAction: (a: string, n: FileNode) => void }) {
  const folderItems = [
    { id: 'newFile', label: 'New File', icon: '＋' },
    { id: 'newFolder', label: 'New Folder', icon: '＋' },
    null,
    { id: 'reveal', label: 'Reveal in Explorer', icon: '⎋' },
    { id: 'copyPath', label: 'Copy Path', icon: '⎘' },
    null,
    { id: 'rename', label: 'Rename', icon: '✎' },
    { id: 'delete', label: 'Delete', icon: '⌫', danger: true },
    null,
    { id: 'askOracle', label: '✦ Ask Oracle', icon: '' },
  ];
  const fileItems = [
    { id: 'open', label: 'Open', icon: '↗' },
    { id: 'openSide', label: 'Open to the Side', icon: '▥' },
    null,
    { id: 'reveal', label: 'Reveal in Explorer', icon: '⎋' },
    { id: 'copyPath', label: 'Copy Path', icon: '⎘' },
    null,
    { id: 'rename', label: 'Rename', icon: '✎' },
    { id: 'delete', label: 'Delete', icon: '⌫', danger: true },
    null,
    { id: 'askOracle', label: '✦ Ask Oracle', icon: '' },
    { id: 'explainFile', label: '✦ Explain File', icon: '' },
  ];
  const items = menu.node.type === 'folder' ? folderItems : fileItems;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      <div style={{
        position: 'fixed', left: menu.x, top: menu.y, zIndex: 1000,
        background: 'rgba(12,12,12,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '4px 0', minWidth: 200,
        boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.4)',
      }}>
        {items.map((item, i) =>
          item === null ? (
            <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '3px 0' }} />
          ) : (
            <div key={item.id} onClick={() => { onAction(item.id, menu.node); onClose(); }}
              style={{
                padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                color: (item as any).danger ? '#525252'
                  : item.id.startsWith('ask') || item.id.startsWith('explain') ? '#a3a3a3'
                  : '#8f8f8f',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {item.label}
            </div>
          )
        )}
      </div>
    </>
  );
}

// ─── Inline Input ─────────────────────────────────────────────────
function InlineInput({ defaultValue, onConfirm, onCancel }: {
  defaultValue: string; onConfirm: (v: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  React.useEffect(() => { inputRef.current?.select(); }, []);
  return (
    <input
      ref={inputRef} value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onConfirm(val); } if (e.key === 'Escape') onCancel(); }}
      onBlur={() => onConfirm(val)}
      style={{
        flex: 1, background: 'rgba(163,163,163,0.08)', border: '1px solid rgba(163,163,163,0.3)',
        borderRadius: 3, color: '#d4d4d4', fontSize: 12, padding: '1px 5px',
        outline: 'none', fontFamily: 'inherit',
      }}
      autoFocus
    />
  );
}

// ─── Tree Node ─────────────────────────────────────────────────────
interface TreeNodeProps {
  node: FileNode; depth: number;
  onFileOpen: (node: FileNode) => void; onRefresh: () => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  activeFilePath: string | null;
}

function TreeNode({ node, depth, onFileOpen, onRefresh, onContextMenu, activeFilePath }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [renaming, setRenaming] = useState(false);
  const [creating, setCreating] = useState<'file' | 'folder' | null>(null);
  const isActive = activeFilePath === node.path;
  const isFolder = node.type === 'folder';

  const handleRename = async (newName: string) => {
    setRenaming(false);
    if (!newName || newName === node.name) return;
    const newPath = node.path.replace(/[^/\\]+$/, newName);
    await AsteriaAPI.rename(node.path, newPath);
    onRefresh();
  };

  const handleCreate = async (name: string) => {
    setCreating(null);
    if (!name) return;
    const basePath = node.type === 'folder' ? node.path : node.path.replace(/[^/\\]+$/, '');
    const newPath = `${basePath}/${name}`;
    if (creating === 'file') await AsteriaAPI.createFile(newPath);
    else await AsteriaAPI.createFolder(newPath);
    onRefresh();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          paddingLeft: `${6 + depth * 14}px`, paddingRight: 6,
          paddingTop: 2.5, paddingBottom: 2.5, cursor: 'pointer',
          borderRadius: 5, margin: '0 4px',
          background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
          position: 'relative',
          transition: 'background 0.1s',
        }}
        onClick={() => { if (isFolder) setExpanded(p => !p); else onFileOpen(node); }}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, node); }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Active indicator */}
        {isActive && (
          <div style={{ position: 'absolute', left: 0, top: '15%', height: '70%', width: 2, borderRadius: 1, background: '#525252' }} />
        )}

        {/* Chevron */}
        {isFolder ? (
          <svg width="8" height="8" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}>
            <path d="M2.5 1.5l3 3-3 3" stroke="#3f3f3f" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <span style={{ width: 8, flexShrink: 0 }} />
        )}

        <FileIcon name={node.name} isFolder={isFolder} expanded={isFolder ? expanded : undefined} />

        {renaming ? (
          <InlineInput defaultValue={node.name} onConfirm={handleRename} onCancel={() => setRenaming(false)} />
        ) : (
          <span style={{
            fontSize: 12, color: isActive ? '#d4d4d4' : '#737373',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            userSelect: 'none', letterSpacing: '0.01em', lineHeight: 1,
          }}>
            {node.name}
          </span>
        )}
      </div>

      {creating && (
        <div style={{ paddingLeft: `${6 + (depth + 1) * 14}px`, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <FileIcon name={creating === 'file' ? 'new.ts' : ''} isFolder={creating === 'folder'} />
          <InlineInput defaultValue="" onConfirm={handleCreate} onCancel={() => setCreating(null)} />
        </div>
      )}

      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode key={child.path + i} node={child} depth={depth + 1}
              onFileOpen={onFileOpen} onRefresh={onRefresh}
              onContextMenu={onContextMenu} activeFilePath={activeFilePath} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Explorer ─────────────────────────────────────────────────
export default function FileExplorer() {
  const { workspaceName, fileTree, setFileTree, workspacePath, tabs, openTab, activeTabId } = useAppStore();
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileNode | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const activeFilePath = tabs.find(t => t.id === activeTabId)?.filePath ?? null;

  const refreshTree = useCallback(async () => {
    if (!workspacePath) return;
    const tree = await AsteriaAPI.readTree(workspacePath);
    setFileTree(tree);
  }, [workspacePath, setFileTree]);

  const handleFileOpen = async (node: FileNode) => {
    if (node.type !== 'file') return;
    const content = await AsteriaAPI.readFile(node.path);
    const ext = node.name.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', rs: 'rust', go: 'go', json: 'json', md: 'markdown',
      css: 'css', scss: 'scss', html: 'html', yml: 'yaml', yaml: 'yaml',
    };
    openTab({ id: node.path, filePath: node.path, fileName: node.name, content: content || '', isDirty: false, language: langMap[ext] || 'plaintext' });
  };

  const handleContextAction = async (action: string, node: FileNode) => {
    switch (action) {
      case 'open': handleFileOpen(node); break;
      case 'reveal': AsteriaAPI.revealInExplorer(node.path); break;
      case 'copyPath': navigator.clipboard.writeText(node.path); break;
      case 'delete': setDeleteTarget(node); break;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await AsteriaAPI.deleteItem(deleteTarget.path);
    setDeleteTarget(null);
    refreshTree();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', userSelect: 'none', background: '#090909' }}>
      {/* Header */}
      <div style={{
        padding: '8px 10px 7px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#333' }}>
          Explorer
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          {/* Search toggle */}
          <button onClick={() => setShowSearch(p => !p)} title="Search files" style={{
            background: showSearch ? 'rgba(255,255,255,0.06)' : 'none', border: 'none', color: '#2a2a2a',
            cursor: 'pointer', padding: '3px 4px', borderRadius: 4, display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#737373')}
            onMouseLeave={e => (e.currentTarget.style.color = showSearch ? '#525252' : '#2a2a2a')}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          {/* Refresh */}
          <button onClick={refreshTree} title="Refresh" style={{
            background: 'none', border: 'none', color: '#2a2a2a',
            cursor: 'pointer', padding: '3px 4px', borderRadius: 4, display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#737373')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2a2a2a')}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter files…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 5, color: '#737373', fontSize: 11.5, padding: '4px 8px',
              outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box',
            }}
            autoFocus
          />
        </div>
      )}

      {/* Workspace name */}
      {workspaceName && (
        <div style={{ padding: '6px 10px 3px', fontSize: 10.5, fontWeight: 600, color: '#2a2a2a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {workspaceName}
        </div>
      )}

      {/* Tree */}
      {!workspacePath ? (
        <div style={{ padding: 16, color: '#1e1e1e', fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
          No folder open.<br />
          <span style={{ fontSize: 11 }}>Open via Projects menu.</span>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '3px 0 8px' }}>
          {fileTree.map((node, i) => (
            <TreeNode
              key={node.path + i} node={node} depth={0}
              onFileOpen={handleFileOpen} onRefresh={refreshTree}
              onContextMenu={(e, n) => setCtxMenu({ x: e.clientX, y: e.clientY, node: n })}
              activeFilePath={activeFilePath}
            />
          ))}
        </div>
      )}

      {ctxMenu && <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} onAction={handleContextAction} />}

      {/* Delete dialog */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{
            background: 'rgba(14,14,14,0.98)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 24, maxWidth: 340,
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          }}>
            <div style={{ fontSize: 13.5, color: '#c4c4c4', marginBottom: 6, fontWeight: 500 }}>Delete "{deleteTarget.name}"?</div>
            <div style={{ fontSize: 12, color: '#333', marginBottom: 22, lineHeight: 1.6 }}>
              {deleteTarget.type === 'folder' ? 'This will permanently delete the folder and all its contents.' : 'This file will be permanently deleted.'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: '#525252', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '6px 16px', background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(127,29,29,0.4)', color: '#9ca3af', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
