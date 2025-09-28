import { useAppStore } from '../../store';
import { PlusIcon } from '../icons';
import ImportModal from '../ImportButton';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, currentTabId, setCurrentTabId, createTab, deleteTab } =
    useAppStore();

  const handleCreateTabBtnClick = () => {
    const newTabId = createTab();
    setCurrentTabId(newTabId);
  };

  return (
    <>
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
