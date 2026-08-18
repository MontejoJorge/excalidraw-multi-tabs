import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  type AppData,
  type AppTheme,
  getRandomTabColor,
  type ITab,
} from '../types';

interface AppStoreState extends AppData {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setCurrentTabId: (id: number) => void;
  createTab: () => number;
  updateTab: (id: number, updatedTab: Partial<ITab>) => void;
  setTabs: (tabs: ITab[]) => void;
  deleteTab: (tabId: number) => void;
}

const getInitialTheme = (): AppTheme => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
};

const defaultAppData: AppData = {
  tabs: [
    {
      id: 0,
      title: 'Tab 1',
      elements: [],
      appState: {},
      color: 'default',
    },
  ],
  currentTabId: 0,
};

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      tabs: defaultAppData.tabs,
      currentTabId: defaultAppData.currentTabId,
      theme: getInitialTheme(),

      setTheme: (theme: AppTheme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setCurrentTabId: (id: number) => set({ currentTabId: id }),

      createTab: () => {
        let newTabId: number = -1;
        set((state) => {
          const maxId =
            state.tabs.length > 0
              ? Math.max(...state.tabs.map((tab) => tab.id))
              : -1;
          newTabId = maxId + 1;

          const newTab: ITab = {
            id: newTabId,
            title: `Tab ${newTabId + 1}`,
            elements: [],
            appState: {},
            color: getRandomTabColor(),
          };

          return { tabs: [...state.tabs, newTab] };
        });
        return newTabId;
      },

      updateTab: (id: number, updatedTab: Partial<ITab>) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id !== id ? tab : { ...tab, ...updatedTab },
          ),
        })),

      setTabs: (tabs: ITab[]) => set({ tabs }),

      deleteTab: (tabId: number) =>
        set((state) => {
          if (state.tabs.length === 1) return state;

          const delTabIndex = state.tabs.findIndex((tab) => tab.id === tabId);
          const newTabs = [...state.tabs];
          newTabs.splice(delTabIndex, 1);

          const newCurrentTabId =
            delTabIndex > 0 ? newTabs[delTabIndex - 1].id : newTabs[0].id;

          return {
            tabs: newTabs,
            currentTabId: newCurrentTabId,
          };
        }),
    }),
    {
      name: 'excalidraw-tabs-data',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            // Backward compatibility with legacy un-wrapped state format: { tabs: [...], currentTabId: 0 }
            if (parsed && Array.isArray(parsed.tabs) && !parsed.state) {
              return {
                state: {
                  tabs: parsed.tabs.map((tab: ITab) => ({
                    ...tab,
                    color: tab.color || 'default',
                  })),
                  currentTabId:
                    typeof parsed.currentTabId === 'number'
                      ? parsed.currentTabId
                      : 0,
                  theme: getInitialTheme(),
                },
                version: 0,
              };
            }
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    },
  ),
);
