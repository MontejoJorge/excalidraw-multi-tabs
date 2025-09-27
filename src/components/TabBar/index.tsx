import axios from 'axios';

import type { ITab } from '../../types';
import { decompressData } from '../../utils/encryption';
import { PlusIcon } from '../icons';
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
  const handleLoadBtnClick = async () => {
    const excalidrawUrl = prompt('Excalidraw url');
    if (!excalidrawUrl) return;

    const frag = excalidrawUrl.split('#')[1];

    const jsonParam = new URLSearchParams(frag).get('json') || '';
    const [fileKey, privateKey] = jsonParam.split(',');

    const response = (
      await axios.get(`https://json.excalidraw.com/api/v2/${fileKey}`, {
        responseType: 'arraybuffer',
      })
    ).data;

    if (!(response instanceof ArrayBuffer)) {
      throw new Error('Unexpected data');
    }

    const uint8Array = new Uint8Array(response);

    const { data: decompressedData } = await decompressData(uint8Array, {
      decryptionKey: privateKey,
    });

    const jsonString = new TextDecoder().decode(decompressedData);
    const excalidrawData = JSON.parse(jsonString);

    console.log(excalidrawData);
  };

  return (
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
      <button className={style.createTabButton} onClick={createTab}>
        <PlusIcon />
      </button>
      <button className={style.loadButton} onClick={handleLoadBtnClick}>
        Import
      </button>
    </div>
  );
};

export default TabBar;
