import { DragDropProvider, type DragDropEventHandlers } from '@dnd-kit/react';

import { useAppStore } from '../../store';
import { PlusIcon } from '../icons';
import ImportModal from '../ImportButton';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, setCurrentTabId, createTab, moveTab } = useAppStore();

  const handleCreateTabBtnClick = () => {
    const newTabId = createTab();
    setCurrentTabId(newTabId);
  };

  const handleDragEnd: NonNullable<DragDropEventHandlers['onDragEnd']> = ({
    canceled,
    operation,
  }) => {
    if (canceled) return;

    const sourceId = operation.source?.id;
    const targetId = operation.target?.id;

    if (sourceId == null || targetId == null || sourceId === targetId) return;
    moveTab(Number(sourceId), Number(targetId));
  };

  return (
    <>
      <div className={style.container}>
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className={style.tabBar}>
            {tabs.map((tab, index) => (
              <Tab key={tab.id} tab={tab} index={index} />
            ))}
          </div>
        </DragDropProvider>
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
