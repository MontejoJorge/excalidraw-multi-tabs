import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { move } from '@dnd-kit/helpers';
import { type DragDropEventHandlers, DragDropProvider } from '@dnd-kit/react';
import { useRef } from 'react';

import { useAppStore } from '../../store';
import { PlusIcon } from '../icons';
import ImportModal from '../ImportButton';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, setCurrentTabId, createTab, setTabs } = useAppStore();
  const tabBarRef = useRef<HTMLDivElement>(null);

  const handleCreateTabBtnClick = () => {
    const newTabId = createTab();
    setCurrentTabId(newTabId);
  };

  const handleDragEnd: NonNullable<DragDropEventHandlers['onDragEnd']> = (
    event,
  ) => {
    if (event.canceled) return;
    const movedTabs = move(tabs, event);
    if (movedTabs === tabs) return;
    setTabs(movedTabs);
  };

  return (
    <>
      <div className={style.container}>
        <DragDropProvider
          onDragEnd={handleDragEnd}
          modifiers={[
            RestrictToHorizontalAxis,
            RestrictToElement.configure({ element: tabBarRef.current }),
          ]}
        >
          <div className={style.tabBar} ref={tabBarRef}>
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
