import clsx from 'clsx';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAppStore } from '../../store';
import type { ITab } from '../../types';
import { TrashIcon } from '../icons';
import styles from './style.module.css';

interface TabProps {
  tab: ITab;
}

interface FormData {
  title: string;
}

const Tab = ({ tab }: TabProps) => {
  const { currentTabId, setCurrentTabId, updateTab, deleteTab } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: { title: tab.title },
  });

  const isActive = currentTabId === tab.id;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (tab.elements.length === 0) {
      deleteTab(tab.id);
      return;
    }

    const isConfirmed = confirm('Are you sure you want to delete this tab?');
    if (!isConfirmed) return;
    deleteTab(tab.id);
  };

  const handleTitleClick = () => {
    if (!isActive) return;
    setIsEditing(true);
    reset({ title: tab.title });
  };

  const onSubmit = (data: FormData) => {
    const trimmedTitle = data.title.trim();
    if (trimmedTitle && trimmedTitle !== tab.title) {
      const newTab = { ...tab, title: trimmedTitle };
      updateTab(tab.id, newTab);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({ title: tab.title });
  };

  return (
    <div
      className={clsx(styles.tab, { [styles.active]: isActive })}
      onClick={() => setCurrentTabId(tab.id)}
    >
      {!isEditing && (
        <span
          className={clsx(styles.title, { [styles.active]: isActive })}
          onClick={handleTitleClick}
          title={tab.title}
        >
          {tab.title}
        </span>
      )}
      {isEditing && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register('title')}
            className={styles.titleInput}
            type="text"
            autoFocus
            onBlur={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
          />
        </form>
      )}
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
