import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { move } from '@dnd-kit/helpers';
import { type DragDropEventHandlers, DragDropProvider } from '@dnd-kit/react';
import { useRef } from 'react';

import { useAppStore } from '../../store';
import { MoonIcon, PlusIcon, SunIcon } from '../icons';
import ImportModal from '../ImportButton';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, setCurrentTabId, createTab, setTabs, theme, toggleTheme } =
    useAppStore();
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
      <div className={style.container} data-testid="tab-bar-container">
        <DragDropProvider
          onDragEnd={handleDragEnd}
          modifiers={[RestrictToHorizontalAxis]}
        >
          <div className={style.tabBar} ref={tabBarRef} data-testid="tab-bar">
            {tabs.map((tab, index) => (
              <Tab key={tab.id} tab={tab} index={index} />
            ))}
          </div>
        </DragDropProvider>
        <button
          className={style.createTabButton}
          onClick={handleCreateTabBtnClick}
          title="New Tab"
          aria-label="New Tab"
          data-testid="new-tab-button"
        >
          <PlusIcon />
        </button>
        <div className={style.actionsRight}>
          <button
            className={style.themeToggleButton}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            data-testid="theme-toggle-button"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <ImportModal />
        </div>
      </div>
    </>
  );
};

export default TabBar;
