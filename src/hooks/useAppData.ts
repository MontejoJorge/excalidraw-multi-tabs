import { useEffect, useState } from 'react';

import type { ITab } from '../types';
import { getAppData, saveAppData } from '../utils/storage-utils';

const defaultAppData = {
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

const useAppData = () => {
  const [appData, setAppData] = useState(() => {
    const storedData = getAppData();
    return storedData || defaultAppData;
  });

  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const setCurrentTabId = (id: number) => {
    setAppData((data) => ({ ...data, currentTabId: id }));
  };

  const createTab = () => {
    setAppData((data) => {
      const newTab = {
        id: data.tabs.length,
        title: `Tab ${data.tabs.length + 1}`,
        elements: [],
        appState: {},
      };
      return {
        tabs: [...data.tabs, newTab],
        currentTabId: newTab.id,
      };
    });
  };

  const saveTab = (id: number, updatedTab: ITab) => {
    setAppData((data) => {
      const newTabs = data.tabs.map((tab) => {
        if (tab.id !== id) return tab;
        return { ...tab, ...updatedTab };
      });
      return {
        tabs: newTabs,
        currentTabId: data.currentTabId,
      };
    });
  };

  const deleteTab = (tabId: number) => {
    setAppData((data) => {
      if (data.tabs.length === 1) return data;
      const newTabs = data.tabs.filter((tab) => tab.id !== tabId);
      return {
        tabs: newTabs,
        currentTabId: newTabs[0].id,
      };
    });
  };

  return {
    tabs: appData.tabs,
    currentTabId: appData.currentTabId,
    setCurrentTabId,
    createTab,
    saveTab,
    deleteTab,
  };
};

export default useAppData;
