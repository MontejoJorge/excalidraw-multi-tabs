import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from '@excalidraw/excalidraw/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppStore } from '../store';
import { useExcalidrawFilesStore } from '../store/excalidrawFiles';

export const useExcalidrawSync = () => {
  const currentTabId = useAppStore((s) => s.currentTabId);
  const theme = useAppStore((s) => s.theme);
  const updateTab = useAppStore((s) => s.updateTab);

  const { setFiles, getFiles } = useExcalidrawFilesStore();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  const isSwitchingTabRef = useRef(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Tab switch: swap scene in-place without destroying the canvas DOM
  useEffect(() => {
    if (!api) return;
    const tab = useAppStore.getState().tabs.find((t) => t.id === currentTabId);
    if (!tab) return;

    isSwitchingTabRef.current = true;

    getFiles().then((files) => {
      api.updateScene({
        elements: tab.elements,
        appState: {
          ...tab.appState,
          theme,
        } as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
      });
      if (files && Object.keys(files).length > 0) {
        api.addFiles(Object.values(files));
      }
      setTimeout(() => {
        isSwitchingTabRef.current = false;
      }, 60);
    });
  }, [currentTabId, api, theme, getFiles]);

  const onChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      state: AppState,
      files: BinaryFiles,
    ) => {
      if (isSwitchingTabRef.current) return;

      const activeId = useAppStore.getState().currentTabId;
      updateTab(activeId, {
        elements,
        appState: {
          viewBackgroundColor: state.viewBackgroundColor,
          zoom: state.zoom,
          scrollX: state.scrollX,
          scrollY: state.scrollY,
        },
      });
      setFiles(files);
    },
    [updateTab, setFiles],
  );

  return {
    excalidrawProps: {
      excalidrawAPI: setApi,
      theme,
      onChange,
      initialData: async () => {
        const activeId = useAppStore.getState().currentTabId;
        const currentTab =
          useAppStore.getState().tabs.find((t) => t.id === activeId) ||
          useAppStore.getState().tabs[0];
        return {
          elements: currentTab?.elements || [],
          appState: {
            ...currentTab?.appState,
            theme,
          },
          files: await getFiles(),
        };
      },
    },
  };
};
