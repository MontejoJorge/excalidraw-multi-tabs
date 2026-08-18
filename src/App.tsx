import { Excalidraw } from '@excalidraw/excalidraw';

import TabBar from './components/TabBar';
import { useExcalidrawSync } from './hooks/useExcalidrawSync';

function App() {
  const { excalidrawProps } = useExcalidrawSync();

  return (
    <>
      <TabBar />
      <Excalidraw {...excalidrawProps} />
    </>
  );
}

export default App;
