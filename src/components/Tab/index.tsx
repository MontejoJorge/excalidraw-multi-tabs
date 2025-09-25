import clsx from 'clsx';

import type { ITab } from '../../types';
import { TrashIcon } from '../icons';
import styles from './style.module.css';

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
      className={clsx(styles.tab, { [styles.active]: isActive })}
      onClick={() => setCurrentTabId(tab.id)}
    >
      {tab.title}
      {isActive && (
        <button
          className={clsx({ [styles.active]: isActive })}
          onClick={(e) => {
            e.stopPropagation();
            deleteTab(tab.id);
          }}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

export default Tab;
