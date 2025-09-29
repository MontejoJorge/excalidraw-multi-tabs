import { Excalidraw } from '@excalidraw/excalidraw';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import { useCallback } from 'react';

import ShareButton from './components/ShareButton';
import TabBar from './components/TabBar';
import { useAppStore } from './store';

function App() {
  const { tabs, currentTabId, updateTab } = useAppStore();

  const currentTab = tabs.find((t) => t.id === currentTabId) || tabs[0];

  const handleOnChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], state: AppState) => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTabId],
  );

  const renderTopRightUI = useCallback(() => <ShareButton />, []);

  if (!currentTab) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <TabBar />
      <Excalidraw
        key={currentTabId}
        onChange={handleOnChange}
        initialData={{
          elements: currentTab.elements,
          appState: currentTab.appState,
        }}
        renderTopRightUI={renderTopRightUI}
      />
    </>
  );
}

export default App;
