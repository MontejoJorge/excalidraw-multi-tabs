import { Excalidraw } from '@excalidraw/excalidraw';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import { useCallback } from 'react';

import TabBar from './components/TabBar';
import useAppData from './hooks/useAppData';

function App() {
  const { tabs, currentTabId, setCurrentTabId, createTab, saveTab, deleteTab } =
    useAppData();

  const currentTab = tabs.find((t) => t.id === currentTabId) || tabs[0];

  const handleOnChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], state: AppState) => {
      if (!currentTab) return;

      const updatedTab = {
        ...currentTab,
        elements: elements,
        appState: {
          viewBackgroundColor: state.viewBackgroundColor,
          theme: state.theme,
          zoom: state.zoom,
          scrollX: state.scrollX,
          scrollY: state.scrollY,
        },
      };

      saveTab(currentTabId, updatedTab);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTabId],
  );

  if (!currentTab) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <TabBar
        tabs={tabs}
        currentTabId={currentTabId}
        setCurrentTabId={setCurrentTabId}
        createTab={createTab}
        deleteTab={deleteTab}
      />
      <Excalidraw
        key={currentTabId}
        onChange={handleOnChange}
        initialData={{
          elements: currentTab.elements,
          appState: currentTab.appState,
        }}
      />
    </>
  );
}

export default App;
