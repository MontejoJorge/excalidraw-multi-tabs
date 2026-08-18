import { useSortable } from '@dnd-kit/react/sortable';
import clsx from 'clsx';
import { useState } from 'react';

import { useAppStore } from '../../store';
import type { ITab } from '../../types';
import { GripIcon, TrashIcon } from '../icons';
import styles from './style.module.css';

interface TabProps {
  tab: ITab;
  index: number;
}

const Tab = ({ tab, index }: TabProps) => {
  const { currentTabId, setCurrentTabId, updateTab, deleteTab } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(tab.title);

  const { ref, handleRef, isDragging } = useSortable({
    id: tab.id,
    index,
    group: 'tabs',
    disabled: isEditing,
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
    setTitle(tab.title);
  };

  const onSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== tab.title) {
      const newTab = { ...tab, title: trimmedTitle };
      updateTab(tab.id, newTab);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(tab.title);
  };

  return (
    <div
      ref={ref}
      data-testid="tab"
      data-tab-id={tab.id}
      data-color={tab.color || 'default'}
      className={clsx(styles.tab, {
        [styles.active]: isActive,
        [styles.dragging]: isDragging,
      })}
      onClick={() => setCurrentTabId(tab.id)}
    >
      <button
        ref={handleRef}
        type="button"
        data-testid="tab-drag-handle"
        className={styles.dragHandle}
        title="Drag to reorder tab"
        aria-label="Drag to reorder tab"
      >
        <GripIcon />
      </button>

      {!isEditing && (
        <span
          data-testid="tab-title"
          className={clsx(styles.title, { [styles.active]: isActive })}
          onClick={handleTitleClick}
          title={tab.title}
        >
          {tab.title}
        </span>
      )}
      {isEditing && (
        <form onSubmit={onSubmit} className={styles.editForm}>
          <input
            data-testid="tab-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
            type="text"
            autoFocus
            onBlur={() => onSubmit()}
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
          type="button"
          data-testid="tab-delete-button"
          className={styles.deleteButton}
          onClick={handleDelete}
          title="Delete tab"
          aria-label="Delete tab"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

export default Tab;
