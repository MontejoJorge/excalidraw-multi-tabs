import { deflate, inflate } from 'pako';

import { decryptData, encryptData } from './encryption';

export interface FileEncodingInfo {
  version: 2;
  compression: 'pako@1';
  encryption: 'AES-GCM';
}

const VERSION_DATAVIEW_BYTES = 4;
const NEXT_CHUNK_SIZE_DATAVIEW_BYTES = 4;
const CONCAT_BUFFERS_VERSION = 1;

const DATA_VIEW_BITS_MAP = { 1: 8, 2: 16, 4: 32 } as const;

export const splitBuffers = (concatenatedBuffer: Uint8Array): Uint8Array[] => {
  const buffers: Uint8Array[] = [];

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

const concatBuffers = (...buffers: Uint8Array[]) => {
  const bufferView = new Uint8Array(
    VERSION_DATAVIEW_BYTES +
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES * buffers.length +
      buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0),
  );

  let cursor = 0;

  // as the first chunk we'll encode the version for backwards compatibility
  dataView(bufferView, VERSION_DATAVIEW_BYTES, cursor, CONCAT_BUFFERS_VERSION);
  cursor += VERSION_DATAVIEW_BYTES;

  for (const buffer of buffers) {
    dataView(
      bufferView,
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES,
      cursor,
      buffer.byteLength,
    );
    cursor += NEXT_CHUNK_SIZE_DATAVIEW_BYTES;

    bufferView.set(buffer, cursor);
    cursor += buffer.byteLength;
  }

  return bufferView;
};

export const decompressData = async <T extends Record<string, unknown>>(
  bufferView: Uint8Array,
  options: { decryptionKey: string },
) => {
  const [encodingMetadataBuffer, iv, buffer] = splitBuffers(bufferView);

  const encodingMetadata: FileEncodingInfo = JSON.parse(
    new TextDecoder().decode(encodingMetadataBuffer),
  );
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const compressData = async <T extends Record<string, any> = never>(
  dataBuffer: Uint8Array,
  options: {
    encryptionKey: string;
  } & ([T] extends [never]
    ? {
        metadata?: T;
      }
    : {
        metadata: T;
      }),
) => {
  const fileInfo: FileEncodingInfo = {
    version: 2,
    compression: 'pako@1',
    encryption: 'AES-GCM',
  };

  const encodingMetadataBuffer = new TextEncoder().encode(
    JSON.stringify(fileInfo),
  );

  const contentsMetadataBuffer = new TextEncoder().encode(
    JSON.stringify(options.metadata || null),
  );

  const { iv, buffer } = await _encryptAndCompress(
    concatBuffers(contentsMetadataBuffer, dataBuffer),
    options.encryptionKey,
  );

  return concatBuffers(encodingMetadataBuffer, iv, buffer);
};

const _encryptAndCompress = async (
  data: Uint8Array | string,
  encryptionKey: string,
) => {
  const { encryptedBuffer, iv } = await encryptData(
    encryptionKey,
    deflate(data),
  );

  return { iv, buffer: new Uint8Array(encryptedBuffer) };
};

function dataView(
  buffer: Uint8Array,
  bytes: 1 | 2 | 4,
  offset: number,
  value?: number,
): Uint8Array | number {
  if (value != null) {
    if (value > Math.pow(2, DATA_VIEW_BITS_MAP[bytes]) - 1) {
      throw new Error(
        `attempting to set value higher than the allocated bytes (value: ${value}, bytes: ${bytes})`,
      );
    }
    const method = `setUint${DATA_VIEW_BITS_MAP[bytes]}` as const;
    new DataView(buffer.buffer)[method](offset, value);
    return buffer;
  }
  const method = `getUint${DATA_VIEW_BITS_MAP[bytes]}` as const;
  return new DataView(buffer.buffer)[method](offset);
}
