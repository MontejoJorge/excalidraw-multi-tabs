import { useState } from 'react';

import Button from '../Button';
import Modal from '../Modal';
import styles from './styles.module.css';

const ShareButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Share link</Button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className={styles.modalContainer}>
          <h2 className={styles.title}>Shareable link</h2>
          <div className={styles.linksContainer}>
            <div className={styles.linkGroup}>
              <p>Link</p>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  readOnly
                  value="https://excalidraw.com/#json="
                  className={styles.linkInput}
                />
                <Button className={styles.button}>Copy link</Button>
              </div>
            </div>
            <div className={styles.linkGroup}>
              <p>Link</p>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  readOnly
                  value={window.location + '#json='}
                  className={styles.linkInput}
                />
                <Button className={styles.button}>Copy link</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ShareButton;
