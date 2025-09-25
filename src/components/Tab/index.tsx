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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = confirm(
      'This is a destructive action. Are you sure you want to delete this tab?',
    );
    if (!isConfirmed) return;
    deleteTab(tab.id);
  };

  return (
    <div
      className={clsx(styles.tab, { [styles.active]: isActive })}
      onClick={() => setCurrentTabId(tab.id)}
    >
      {tab.title}
      {isActive && (
        <button
          className={clsx({ [styles.active]: isActive })}
          onClick={handleDelete}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

export default Tab;
