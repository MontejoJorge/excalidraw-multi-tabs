import { Excalidraw } from '@excalidraw/excalidraw';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { useCallback } from 'react';

import TabBar from './components/TabBar';
import { useAppStore } from './store';
import { useExcalidrawFilesStore } from './store/excalidrawFiles';

function App() {
  const { tabs, currentTabId, updateTab } = useAppStore();
  const { setFiles, getFiles } = useExcalidrawFilesStore();

  const currentTab = tabs.find((t) => t.id === currentTabId) || tabs[0];

  const handleOnChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      state: AppState,
      files: BinaryFiles,
    ) => {
      if (!currentTab) return;

      const updatedTab = {
        elements: elements,
        appState: {
          viewBackgroundColor: state.viewBackgroundColor,
          theme: state.theme,
          zoom: state.zoom,
          scrollX: state.scrollX,
          scrollY: state.scrollY,
        },
      };

      updateTab(currentTabId, updatedTab);
      setFiles(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTabId],
  );

  if (!currentTab) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <TabBar />
      <Excalidraw
        key={currentTabId}
        onChange={handleOnChange}
        initialData={async () => ({
          elements: currentTab.elements,
          appState: currentTab.appState,
          files: await getFiles(),
        })}
      />
    </>
  );
}

export default App;
