import { Excalidraw } from '@excalidraw/excalidraw';

import TabBar from './components/TabBar';

function App() {
  return (
    <>
      <TabBar />
      <Excalidraw key={1} />
    </>
  );
}

export default App;
