
// Export constants for loader to identify types
export const UINT8ARRAY_ID = idof<Uint8Array>();

export function finalizeKey(sharedSecret: Uint8Array, encryptedKey: Uint8Array): Uint8Array {
  const finalKey = new Uint8Array(16);
  
  // Scramble the shared secret with the encrypted key bytes
  // This logic is hidden in WASM binary
  for (let i = 0; i < 16; i++) {
    const s = sharedSecret[i % sharedSecret.length];
    const e = encryptedKey[i % encryptedKey.length];
    
    // Custom non-linear transformation
    finalKey[i] = (s ^ e) ^ (i * 7);
  }
  
  return finalKey;
}

export function finalizeIv(sharedSecret: Uint8Array, encryptedIv: Uint8Array): Uint8Array {
  const finalIv = new Uint8Array(16);
  
  for (let i = 0; i < 16; i++) {
    const s = sharedSecret[(i + 5) % sharedSecret.length];
    const e = encryptedIv[i % encryptedIv.length];
    
    finalIv[i] = (s ^ e) ^ 0xAA;
  }
  
  return finalIv;
}
