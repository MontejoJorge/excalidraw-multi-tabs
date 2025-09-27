import { inflate } from 'pako';

// Constants based on Excalidraw code
export const IV_LENGTH_BYTES = 12;
export const ENCRYPTION_KEY_BITS = 128;

export interface FileEncodingInfo {
  version: 2;
  compression: 'pako@1';
  encryption: 'AES-GCM';
}

export const getCryptoKey = async (
  key: string,
  usage: KeyUsage,
): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'jwk',
    {
      alg: 'A128GCM',
      ext: true,
      k: key,
      key_ops: ['encrypt', 'decrypt'],
      kty: 'oct',
    },
    {
      name: 'AES-GCM',
      length: ENCRYPTION_KEY_BITS,
    },
    false,
    [usage],
  );
};

export const decryptData = async (
  iv: Uint8Array,
  encrypted: Uint8Array | ArrayBuffer,
  privateKey: string,
): Promise<ArrayBuffer> => {
  const key = await getCryptoKey(privateKey, 'decrypt');
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    encrypted as BufferSource,
  );
};

export const splitBuffers = (concatenatedBuffer: Uint8Array): Uint8Array[] => {
  const buffers: Uint8Array[] = [];
  const VERSION_DATAVIEW_BYTES = 4;
  const NEXT_CHUNK_SIZE_DATAVIEW_BYTES = 4;

  const view = new DataView(
    concatenatedBuffer.buffer,
    concatenatedBuffer.byteOffset,
    concatenatedBuffer.byteLength,
  );

  let cursor = VERSION_DATAVIEW_BYTES;

  while (cursor < concatenatedBuffer.byteLength) {
    const chunkSize = view.getUint32(cursor);
    cursor += NEXT_CHUNK_SIZE_DATAVIEW_BYTES;

    if (cursor + chunkSize > concatenatedBuffer.byteLength) {
      break;
    }

    buffers.push(concatenatedBuffer.slice(cursor, cursor + chunkSize));
    cursor += chunkSize;
  }

  return buffers;
};

export const decompressData = async <T extends Record<string, unknown>>(
  bufferView: Uint8Array,
  options: { decryptionKey: string },
) => {
  const [encodingMetadataBuffer, iv, buffer] = splitBuffers(bufferView);

  const encodingMetadata: FileEncodingInfo = JSON.parse(
    new TextDecoder().decode(encodingMetadataBuffer),
  );

  try {
    let decryptedBuffer = new Uint8Array(
      await decryptData(iv, buffer, options.decryptionKey),
    );

    if (encodingMetadata.compression) {
      decryptedBuffer = inflate(decryptedBuffer);
    }

    const [contentsMetadataBuffer, contentsBuffer] =
      splitBuffers(decryptedBuffer);

    const metadata = JSON.parse(
      new TextDecoder().decode(contentsMetadataBuffer),
    ) as T;

    return {
      metadata,
      data: contentsBuffer,
    };
  } catch (error) {
    console.error('Coudnt decompress the data');
    throw error;
  }
};
