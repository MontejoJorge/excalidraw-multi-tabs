import { create } from 'zustand';

import type { AppData, ITab } from '../types';
import { getAppData, saveAppData } from '../utils/storage-utils';

interface AppStoreState extends AppData {
  setCurrentTabId: (id: number) => void;
  createTab: () => void;
  saveTab: (id: number, updatedTab: ITab) => void;
  deleteTab: (tabId: number) => void;
}

const defaultAppData: AppData = {
  tabs: [
    {
      id: 0,
      title: 'Tab 1',
      elements: [],
      appState: {},
    },
  ],
  currentTabId: 0,
};

export const useAppStore = create<AppStoreState>()((set) => {
  const storedData = getAppData();
  const data = storedData || defaultAppData;

  return {
    tabs: data.tabs,
    currentTabId: data.currentTabId,

    setCurrentTabId: (id: number) => {
      set((state) => {
        const newAppData: AppData = {
          tabs: state.tabs,
          currentTabId: id,
        };
        saveAppData(newAppData);
        return newAppData;
      });
    },

    createTab: () => {
      set((state) => {
        const newTab: ITab = {
          id: state.tabs.length,
          title: `Tab ${state.tabs.length + 1}`,
          elements: [],
          appState: {},
        };
        const newAppData: AppData = {
          tabs: [...state.tabs, newTab],
          currentTabId: newTab.id,
        };
        saveAppData(newAppData);
        return newAppData;
      });
    },

    saveTab: (id: number, updatedTab: ITab) => {
      set((state) => {
        const newTabs = state.tabs.map((tab) =>
          tab.id !== id ? tab : { ...tab, ...updatedTab },
        );
        const newAppData: AppData = {
          tabs: newTabs,
          currentTabId: state.currentTabId,
        };
        saveAppData(newAppData);
        return newAppData;
      });
    },

    deleteTab: (tabId: number) => {
      set((state) => {
        if (state.tabs.length === 1) return state;

        const delTabIndex = state.tabs.findIndex((tab) => tab.id === tabId);
        const newTabs = [...state.tabs];
        newTabs.splice(delTabIndex, 1);

        const newCurrentTabId =
          delTabIndex > 0 ? newTabs[delTabIndex - 1].id : newTabs[0].id;

        const newAppData: AppData = {
          tabs: newTabs,
          currentTabId: newCurrentTabId,
        };
        saveAppData(newAppData);
        return newAppData;
      });
    },
  };
});
