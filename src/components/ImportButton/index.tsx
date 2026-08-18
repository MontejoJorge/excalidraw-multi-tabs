import { useState } from 'react';

import { useAppStore } from '../../store';
import { getRandomTabColor, type ITab } from '../../types';
import { getExcalidrawBoard } from '../../utils/import';
import Modal from '../Modal';
import styles from './styles.module.css';

const EXCALIDRAW_URL = 'https://excalidraw.com/#json=';
const INVALID_EXCALIDRAW_LINK = 'Invalid Excalidraw link';

const ImportModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const { createTab, updateTab, setCurrentTabId } = useAppStore();

  const handleModalClose = () => {
    setIsModalOpen(false);
    setUrl('');
    setError('');
  };

  const onSubmit = async (e?: React.FormEvent, urlToSubmit?: string) => {
    if (e) e.preventDefault();

    const targetUrl = urlToSubmit || url;

    if (!targetUrl.startsWith(EXCALIDRAW_URL)) {
      setError(INVALID_EXCALIDRAW_LINK);
      return;
    }

    try {
      const excalidrawBoard = await getExcalidrawBoard(targetUrl);

      const newTabId = createTab();

      const newTabData: ITab = {
        id: newTabId,
        title: 'Imported board',
        elements: excalidrawBoard.elements,
        appState: {
          viewBackgroundColor: excalidrawBoard.appState.viewBackgroundColor,
        },
        color: getRandomTabColor(),
      };

      updateTab(newTabId, newTabData);
      setCurrentTabId(newTabId);
      setIsModalOpen(false);
      setUrl('');
      setError('');
    } catch (err) {
      let errorMsg = 'Failed to load Excalidraw board. Unknown error';
      if (err instanceof Error && err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    }
  };

  return (
    <>
      <button
        className={styles.loadButton}
        onClick={() => setIsModalOpen(true)}
        data-testid="import-modal-button"
      >
        Import from Excalidraw
      </button>
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <form onSubmit={onSubmit}>
          <h2 className={styles.title}>Import from Excalidraw</h2>
          <div className={styles.body}>
            <p>
              In Excalidraw, open <strong>Share</strong>, then select{' '}
              <strong>Export to link</strong> and paste it here.
            </p>
            <input
              type="text"
              data-testid="import-url-input"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              className={styles.input}
              autoFocus={true}
              placeholder={EXCALIDRAW_URL}
              onPaste={(e) => {
                e.preventDefault();
                const pastedValue = e.clipboardData.getData('text');
                setUrl(pastedValue);
                setError('');
                onSubmit(undefined, pastedValue);
              }}
            />
            {error && (
              <p className={styles.error} data-testid="import-error-message">
                {error}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ImportModal;
