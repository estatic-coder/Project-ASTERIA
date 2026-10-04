import React, { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AsteriaAPI, FileNode } from '../core/AsteriaAPI';

// ─── File type → icon color ────────────────────────────────────────
function getFileColor(name: string): string {
  return '#8f8f8f';
}

// ─── File Icon ─────────────────────────────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const color = getFileColor(name);

  // Folder
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {ext ? (
        <>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </>
      ) : (
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      )}
    </svg>
  );
}

// ─── Context Menu ──────────────────────────────────────────────────
interface CtxMenu { x: number; y: number; node: FileNode }

function ContextMenu({ menu, onClose, onAction }: { menu: CtxMenu; onClose: () => void; onAction: (a: string, n: FileNode) => void }) {
  const items = menu.node.type === 'folder'
    ? [
      { id: 'newFile', label: 'New File' },
      { id: 'newFolder', label: 'New Folder' },
      null,
      { id: 'reveal', label: 'Reveal in File Manager' },
      { id: 'copyPath', label: 'Copy Path' },
      null,
      { id: 'rename', label: 'Rename' },
      { id: 'delete', label: 'Delete', danger: true },
      null,
      { id: 'askOracle', label: '✦ Ask Oracle About Folder' },
    ]
    : [
      { id: 'open', label: 'Open' },
      { id: 'openSide', label: 'Open to the Side' },
      null,
      { id: 'reveal', label: 'Reveal in File Manager' },
      { id: 'copyPath', label: 'Copy Path' },
      null,
      { id: 'rename', label: 'Rename' },
      { id: 'delete', label: 'Delete', danger: true },
      null,
      { id: 'askOracle', label: '✦ Ask Oracle' },
      { id: 'explainFile', label: '✦ Explain File' },
      { id: 'reviewFile', label: '✦ Review File' },
    ];

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      <div style={{
        position: 'fixed', left: menu.x, top: menu.y, zIndex: 1000,
        background: '#111319', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6, padding: '4px 0', minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        animation: 'slide-in-bottom 0.1s ease-out',
      }}>
        {items.map((item, i) =>
          item === null ? (
            <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '3px 0' }} />
          ) : (
            <div key={item.id} onClick={() => { onAction(item.id, menu.node); onClose(); }}
              style={{
                padding: '6px 14px', fontSize: 12.5, cursor: 'pointer',
                color: (item as any).danger ? '#737373' : item.id.startsWith('ask') || item.id.startsWith('explain') || item.id.startsWith('review') ? '#d4d4d4' : '#d1d5db',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
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

// ─── Inline rename / create input ────────────────────────────────
function InlineInput({ defaultValue, onConfirm, onCancel }: {
  defaultValue: string; onConfirm: (v: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  React.useEffect(() => { inputRef.current?.select(); }, []);

  return (
    <input
      ref={inputRef}
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onConfirm(val); } if (e.key === 'Escape') onCancel(); }}
      onBlur={() => onConfirm(val)}
      style={{
        flex: 1, background: 'rgba(163,163,163,0.1)', border: '1px solid rgba(163,163,163,0.5)',
        borderRadius: 3, color: '#e5e7eb', fontSize: 12.5, padding: '1px 6px',
        outline: 'none', fontFamily: 'inherit',
      }}
      autoFocus
    />
  );
}

// ─── Single tree node ─────────────────────────────────────────────
interface TreeNodeProps {
  node: FileNode;
  depth: number;
  onFileOpen: (node: FileNode) => void;
  onRefresh: () => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  activeFilePath: string | null;
}

function TreeNode({ node, depth, onFileOpen, onRefresh, onContextMenu, activeFilePath }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [renaming, setRenaming] = useState(false);
  const [creating, setCreating] = useState<'file' | 'folder' | null>(null);
  const isActive = activeFilePath === node.path;

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

  const isFolder = node.type === 'folder';

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          paddingLeft: `${8 + depth * 12}px`, paddingRight: 8,
          paddingTop: 3, paddingBottom: 3, cursor: 'pointer',
          borderRadius: 4, margin: '0 4px',
          background: isActive ? 'rgba(163,163,163,0.12)' : 'transparent',
          borderLeft: isActive ? '2px solid rgba(163,163,163,0.6)' : '2px solid transparent',
          transition: 'all 0.1s',
        }}
        onClick={() => {
          if (isFolder) setExpanded(p => !p);
          else onFileOpen(node);
        }}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, node); }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Chevron for folders */}
        {isFolder && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <path d="M2.5 1.5l3 3-3 3" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
        {!isFolder && <span style={{ width: 9, flexShrink: 0 }} />}

        <FileIcon name={isFolder ? '' : node.name} />

        {renaming ? (
          <InlineInput defaultValue={node.name} onConfirm={handleRename} onCancel={() => setRenaming(false)} />
        ) : (
          <span style={{ fontSize: 12.5, color: isActive ? '#e5e5e5' : '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, userSelect: 'none' }}>
            {node.name}
          </span>
        )}
      </div>

      {/* Inline create input */}
      {creating && (
        <div style={{ paddingLeft: `${8 + (depth + 1) * 12}px`, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <FileIcon name={creating === 'file' ? 'new.ts' : ''} />
          <InlineInput defaultValue="" onConfirm={handleCreate} onCancel={() => setCreating(null)} />
        </div>
      )}

      {/* Children */}
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode
              key={child.path + i}
              node={child}
              depth={depth + 1}
              onFileOpen={onFileOpen}
              onRefresh={onRefresh}
              onContextMenu={onContextMenu}
              activeFilePath={activeFilePath}
            />
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

  const activeFilePath = tabs.find(t => t.id === activeTabId)?.filePath ?? null;

  const refreshTree = useCallback(async () => {
    if (!workspacePath) return;
    const tree = await AsteriaAPI.readTree(workspacePath);
    setFileTree(tree);
  }, [workspacePath]);

  const handleFileOpen = async (node: FileNode) => {
    if (node.type !== 'file') return;
    const content = await AsteriaAPI.readFile(node.path);
    const ext = node.name.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', rs: 'rust', go: 'go', json: 'json', md: 'markdown',
      css: 'css', scss: 'scss', html: 'html', yml: 'yaml', yaml: 'yaml',
    };
    openTab({
      id: node.path,
      filePath: node.path,
      fileName: node.name,
      content: content || '',
      isDirty: false,
      language: langMap[ext] || 'plaintext',
    });
  };

  const handleContextAction = async (action: string, node: FileNode) => {
    switch (action) {
      case 'open': handleFileOpen(node); break;
      case 'reveal': AsteriaAPI.revealInExplorer(node.path); break;
      case 'copyPath': navigator.clipboard.writeText(node.path); break;
      case 'delete': setDeleteTarget(node); break;
      case 'rename': break; // handled inline
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await AsteriaAPI.deleteItem(deleteTarget.path);
    setDeleteTarget(null);
    refreshTree();
  };

  if (!workspacePath) {
    return (
      <div style={{ padding: 16, color: '#374151', fontSize: 12, textAlign: 'center' }}>
        No folder open
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', userSelect: 'none' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#4b5563',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Explorer</span>
        <button onClick={refreshTree} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 2 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* Workspace name */}
      <div style={{ padding: '6px 8px 4px', fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {workspaceName}
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0 8px' }}>
        {fileTree.map((node, i) => (
          <TreeNode
            key={node.path + i}
            node={node}
            depth={0}
            onFileOpen={handleFileOpen}
            onRefresh={refreshTree}
            onContextMenu={(e, n) => setCtxMenu({ x: e.clientX, y: e.clientY, node: n })}
            activeFilePath={activeFilePath}
          />
        ))}
      </div>

      {ctxMenu && (
        <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} onAction={handleContextAction} />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#111319', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 24, maxWidth: 360 }}>
            <div style={{ fontSize: 14, color: '#e5e7eb', marginBottom: 8 }}>Delete "{deleteTarget.name}"?</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
              {deleteTarget.type === 'folder' ? 'This will delete the folder and all its contents.' : 'This file will be permanently deleted.'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '6px 16px', background: 'rgba(115,115,115,0.15)', border: '1px solid rgba(115,115,115,0.3)', color: '#737373', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
