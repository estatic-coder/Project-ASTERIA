import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileNode } from '../core/AsteriaAPI';

export type AppMode = 'home' | 'code' | 'image' | 'analysis';

export type OracleStatus = 'idle' | 'observing' | 'thinking' | 'planning' | 'executing' | 'completed' | 'failed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'oracle';
  content: string;
  timestamp: string;
  streaming?: boolean;
  activities?: ActivityItem[];
  filesChanged?: number;
  additions?: number;
  deletions?: number;
}

export interface ActivityItem {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  detail: string;
}

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  isDirty: boolean;
  language: string;
}

interface AppState {
  // ── Mode ──────────────────────────────────────────────────────
  mode: AppMode;
  setMode: (m: AppMode) => void;

  // ── Workspace ─────────────────────────────────────────────────
  workspacePath: string | null;
  workspaceName: string | null;
  fileTree: FileNode[];
  recentProjects: { name: string; path: string; lastOpened: string }[];
  setWorkspace: (p: string, name: string, tree: FileNode[]) => void;
  setFileTree: (tree: FileNode[]) => void;
  addRecentProject: (p: string, name: string) => void;

  // ── Editor Tabs ───────────────────────────────────────────────
  tabs: EditorTab[];
  activeTabId: string | null;
  openTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;

  // ── Oracle / AI ───────────────────────────────────────────────
  oracleStatus: OracleStatus;
  currentModel: string;
  availableModels: { name: string; size: number }[];
  conversations: Record<AppMode, ChatMessage[]>;
  setOracleStatus: (s: OracleStatus) => void;
  setCurrentModel: (m: string) => void;
  setAvailableModels: (models: { name: string; size: number }[]) => void;
  addMessage: (mode: AppMode, msg: ChatMessage) => void;
  updateStreamingMessage: (mode: AppMode, id: string, chunk: string) => void;
  finalizeMessage: (mode: AppMode, id: string, extra?: Partial<ChatMessage>) => void;

  // ── UI Prefs ──────────────────────────────────────────────────
  sidebarOpen: boolean;
  oraclePanelOpen: boolean;
  terminalOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  setOraclePanelOpen: (v: boolean) => void;
  setTerminalOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Mode
      mode: 'home',
      setMode: (mode) => set({ mode }),

      // Workspace
      workspacePath: null,
      workspaceName: null,
      fileTree: [],
      recentProjects: [],
      setWorkspace: (path, name, tree) => set({ workspacePath: path, workspaceName: name, fileTree: tree }),
      setFileTree: (tree) => set({ fileTree: tree }),
      addRecentProject: (path, name) => {
        const existing = get().recentProjects.filter(p => p.path !== path);
        set({ recentProjects: [{ name, path, lastOpened: new Date().toISOString() }, ...existing].slice(0, 10) });
      },

      // Tabs
      tabs: [],
      activeTabId: null,
      openTab: (tab) => {
        const existing = get().tabs.find(t => t.filePath === tab.filePath);
        if (existing) { set({ activeTabId: existing.id }); return; }
        set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
      },
      closeTab: (id) => {
        const tabs = get().tabs.filter(t => t.id !== id);
        const activeTabId = get().activeTabId === id ? (tabs[tabs.length - 1]?.id ?? null) : get().activeTabId;
        set({ tabs, activeTabId });
      },
      setActiveTab: (id) => set({ activeTabId: id }),
      updateTabContent: (id, content) => set(s => ({
        tabs: s.tabs.map(t => t.id === id ? { ...t, content, isDirty: true } : t)
      })),

      // Oracle
      oracleStatus: 'idle',
      currentModel: 'qwen3:8b',
      availableModels: [],
      conversations: { home: [], code: [], image: [], analysis: [] },
      setOracleStatus: (s) => set({ oracleStatus: s }),
      setCurrentModel: (m) => set({ currentModel: m }),
      setAvailableModels: (models) => set({ availableModels: models }),
      addMessage: (mode, msg) => set(s => ({
        conversations: { ...s.conversations, [mode]: [...s.conversations[mode], msg] }
      })),
      updateStreamingMessage: (mode, id, chunk) => set(s => ({
        conversations: {
          ...s.conversations,
          [mode]: s.conversations[mode].map(m =>
            m.id === id ? { ...m, content: m.content + chunk } : m
          )
        }
      })),
      finalizeMessage: (mode, id, extra = {}) => set(s => ({
        conversations: {
          ...s.conversations,
          [mode]: s.conversations[mode].map(m =>
            m.id === id ? { ...m, ...extra, streaming: false } : m
          )
        }
      })),

      // UI Prefs
      sidebarOpen: true,
      oraclePanelOpen: true,
      terminalOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setOraclePanelOpen: (v) => set({ oraclePanelOpen: v }),
      setTerminalOpen: (v) => set({ terminalOpen: v }),
    }),
    {
      name: 'asteria-state',
      partialize: (s) => ({
        currentModel: s.currentModel,
        recentProjects: s.recentProjects,
        workspacePath: s.workspacePath,
        workspaceName: s.workspaceName,
        mode: s.mode === 'home' ? 'home' : s.mode,
        conversations: s.conversations,
      }),
    }
  )
);
