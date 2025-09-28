import axios from 'axios';

import { decompressData } from './encode';

export const getExcalidrawBoard = async (url: string) => {
  const frag = url.split('#')[1];

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

  try {
    const { data: decompressedData } = await decompressData(uint8Array, {
      decryptionKey: privateKey,
    });

    const jsonString = new TextDecoder().decode(decompressedData);
    return JSON.parse(jsonString);
  } catch (error) {
    console.log(error);
    throw new Error('Could not decrypt or decompress the board data');
  }
};
