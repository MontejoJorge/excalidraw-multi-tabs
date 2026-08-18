import { decompressData } from './encode';

export const getExcalidrawBoard = async (url: string) => {
  const [fileKey, privateKey] = url.split('#json=')[1]?.split(',') || [];

  const response = await fetch(`https://json.excalidraw.com/api/v2/${fileKey}`);
  const arrayBuffer = await response.arrayBuffer();

  const uint8Array = new Uint8Array(arrayBuffer);

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
