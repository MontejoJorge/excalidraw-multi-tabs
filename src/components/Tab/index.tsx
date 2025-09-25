import type { ITab } from '../../types';

interface TabProps {
  tab: ITab;
  setCurrentTabId: (id: number) => void;
  currentTabId: number;
  deleteTab: (id: number) => void;
}

const Tab = ({ tab, setCurrentTabId, currentTabId, deleteTab }: TabProps) => {
  const isActive = currentTabId === tab.id;

  return (
    <div
      onClick={() => setCurrentTabId(tab.id)}
      style={{
        color: isActive ? 'red' : 'inherit',
        cursor: 'pointer',
      }}
    >
      {tab.title}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteTab(tab.id);
        }}
      >
        x
      </button>
    </div>
  );
};

export default Tab;
