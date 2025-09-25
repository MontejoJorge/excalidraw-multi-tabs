import type { ITab } from '../../types';
import Tab from '../Tab';
import style from './style.module.css';

interface TabBarProps {
  tabs: ITab[];
  currentTabId: number;
  setCurrentTabId: (id: number) => void;
  createTab: () => void;
  deleteTab: (id: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  currentTabId,
  setCurrentTabId,
  createTab,
  deleteTab,
}) => {
  return (
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
      <button onClick={createTab}>+</button>
    </div>
  );
};

export default TabBar;
