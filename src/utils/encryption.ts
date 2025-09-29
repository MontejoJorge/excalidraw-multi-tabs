// Constants based on Excalidraw code
export const IV_LENGTH_BYTES = 12;
export const ENCRYPTION_KEY_BITS = 128;

export const createIV = () => {
  const arr = new Uint8Array(IV_LENGTH_BYTES);
  return window.crypto.getRandomValues(arr);
};

export const generateEncryptionKey = async <
  T extends 'string' | 'cryptoKey' = 'string',
>(
  returnAs?: T,
): Promise<T extends 'cryptoKey' ? CryptoKey : string> => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: ENCRYPTION_KEY_BITS,
    },
    true, // extractable
    ['encrypt', 'decrypt'],
  );
  return (
    returnAs === 'cryptoKey'
      ? key
      : (await window.crypto.subtle.exportKey('jwk', key)).k
  ) as T extends 'cryptoKey' ? CryptoKey : string;
};

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

export const encryptData = async (
  key: string | CryptoKey,
  data: Uint8Array,
): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array }> => {
  const importedKey =
    typeof key === 'string' ? await getCryptoKey(key, 'encrypt') : key;
  const iv = createIV();
  const buffer: Uint8Array = data;

  // We use symmetric encryption. AES-GCM is the recommended algorithm and
  // includes checks that the ciphertext has not been modified by an attacker.
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    importedKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer as any,
  );

  return { encryptedBuffer, iv };
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
