// Constants based on Excalidraw code
export const IV_LENGTH_BYTES = 12;
export const ENCRYPTION_KEY_BITS = 128;

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
