import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface Props { onClose: () => void; }

type CommandItem = {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
};

export default function CommandPalette({ onClose }: Props) {
  const { setMode, setTerminalOpen, setSidebarOpen, setOraclePanelOpen } = useAppStore();
  const [query, setQuery] = useState('');

  const commands: CommandItem[] = [
    { id: 'home', label: 'Go to ASTERIA Home', category: 'Navigate', icon: '⌂', shortcut: '⌘⇧H', action: () => { setMode('home'); onClose(); } },
    { id: 'codeMode', label: 'Enter Code Mode', category: 'Navigate', icon: '◇', action: () => { setMode('code'); onClose(); } },
    { id: 'imageMode', label: 'Enter Image Creation Mode', category: 'Navigate', icon: '✦', action: () => { setMode('image'); onClose(); } },
    { id: 'toggleTerminal', label: 'Toggle Terminal', category: 'View', icon: '›_', shortcut: '⌘`', action: () => { setTerminalOpen(!useAppStore.getState().terminalOpen); onClose(); } },
    { id: 'toggleSidebar', label: 'Toggle Sidebar', category: 'View', icon: '▪', shortcut: '⌘B', action: () => { setSidebarOpen(!useAppStore.getState().sidebarOpen); onClose(); } },
    { id: 'toggleOracle', label: 'Toggle Oracle Panel', category: 'View', icon: '✦', shortcut: '⌘J', action: () => { setOraclePanelOpen(!useAppStore.getState().oraclePanelOpen); onClose(); } },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 560, background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder="Search commands..."
            autoFocus
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e5e7eb', fontSize: 13.5, fontFamily: 'inherit' }}
            onKeyDown={e => { 
              if (e.key === 'Escape') onClose(); 
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(i => (i + 1) % (filtered.length || 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(i => (i - 1 + (filtered.length || 1)) % (filtered.length || 1));
              }
              if (e.key === 'Enter' && filtered.length > 0) {
                filtered[activeIndex].action();
              }
            }}
          />
          <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: '#4b5563', fontSize: 10 }}>ESC</kbd>
        </div>

        {/* Commands */}
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '6px 0 8px' }}>
          {Object.entries(grouped).map(([cat, cmds]) => (
            <div key={cat}>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#374151' }}>{cat}</div>
              {cmds.map((cmd) => {
                const isActive = filtered.indexOf(cmd) === activeIndex;
                return (
                  <div key={cmd.id} onClick={cmd.action}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', cursor: 'pointer', background: isActive ? 'rgba(163,163,163,0.08)' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={() => setActiveIndex(filtered.indexOf(cmd))}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {cmd.icon && <span style={{ fontSize: 12, color: '#4b5563', width: 16, textAlign: 'center' }}>{cmd.icon}</span>}
                      <span style={{ fontSize: 13, color: '#d1d5db' }}>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#4b5563', fontSize: 11 }}>{cmd.shortcut}</kbd>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#374151', fontSize: 12 }}>No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
}
