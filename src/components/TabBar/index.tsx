import { useAppStore } from '../../store';
import type { ITab } from '../../types';
import { getExcalidrawBoard } from '../../utils/import';
import { PlusIcon } from '../icons';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, currentTabId, setCurrentTabId, createTab, deleteTab, saveTab } =
    useAppStore();

  const handleLoadBtnClick = async () => {
    const excalidrawUrl = prompt('Excalidraw url');
    if (!excalidrawUrl) return;

    const excalidrawBoard = await getExcalidrawBoard(excalidrawUrl);

    const newTabId = createTab();

    const newTabData: ITab = {
      id: newTabId,
      title: 'Imported board',
      elements: excalidrawBoard.elements,
      appState: {
        viewBackgroundColor: excalidrawBoard.appState.viewBackgroundColor,
      },
    };

    saveTab(newTabId, newTabData);
    setCurrentTabId(newTabId);
  };

  const handleCreateTabBtnClicl = () => {
    const newTabId = createTab();
    setCurrentTabId(newTabId);
  };

  return (
    <div className={style.container}>
      <div className={style.tabBar}>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            tab={tab}
            setCurrentTabId={setCurrentTabId}
            currentTabId={currentTabId}
            deleteTab={deleteTab}
          />
        ))}
      </div>
      <button
        className={style.createTabButton}
        onClick={handleCreateTabBtnClicl}
      >
        <PlusIcon />
      </button>
      <button className={style.loadButton} onClick={handleLoadBtnClick}>
        Import from Excalidraw
      </button>
    </div>
  );
};

export default TabBar;
