import { useState } from 'react';

import { useAppStore } from '../../store';
import { PlusIcon } from '../icons';
import ImportModal from '../ImportButton';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, setCurrentTabId, createTab, moveTab } = useAppStore();
  const [draggedTabId, setDraggedTabId] = useState<number | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<number | null>(null);

  const handleCreateTabBtnClick = () => {
    const newTabId = createTab();
    setCurrentTabId(newTabId);
  };

  const handleDragStart =
    (tabId: number) => (e: React.DragEvent<HTMLDivElement>) => {
      setDraggedTabId(tabId);
      e.dataTransfer.effectAllowed = 'move';
    };

  const handleDragOver =
    (tabId: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverTabId !== tabId) {
        setDragOverTabId(tabId);
      }
    };

  const handleDrop =
    (targetTabId: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (draggedTabId !== null && draggedTabId !== targetTabId) {
        moveTab(draggedTabId, targetTabId);
      }
      setDraggedTabId(null);
      setDragOverTabId(null);
    };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  return (
    <>
      <div className={style.container}>
        <div className={style.tabBar}>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              draggable
              isDragging={draggedTabId === tab.id}
              isDragOver={dragOverTabId === tab.id}
              onDragStart={handleDragStart(tab.id)}
              onDragOver={handleDragOver(tab.id)}
              onDrop={handleDrop(tab.id)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
        <button
          className={style.createTabButton}
          onClick={handleCreateTabBtnClick}
        >
          <PlusIcon />
        </button>
        <ImportModal />
      </div>
    </>
  );
};

export default TabBar;
