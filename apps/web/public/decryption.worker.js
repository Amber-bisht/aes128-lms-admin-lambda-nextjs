
// Wrapper for AES-128 Decryption in a Web Worker

self.addEventListener('message', async (e) => {
    const { chunkUrl, keyHex, ivHex, id } = e.data;

    try {
        // 1. Fetch Encrypted Chunk
        const response = await fetch(chunkUrl);
        const encryptedBuffer = await response.arrayBuffer();

        // 2. Import Key
        const keyBuffer = hexToBytes(keyHex);
        const ivBuffer = hexToBytes(ivHex);

        const key = await crypto.subtle.importKey(
            "raw",
            keyBuffer,
            { name: "AES-CBC" }, // HLS commonly uses AES-128-CBC
            false,
            ["decrypt"]
        );

        // 3. Decrypt
        // Note: HLS AES-128 usually behaves like a stream or specific block padding.
        // Standard HLS encryption applies AES-CBC to the entire segment.
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: ivBuffer },
            key,
            encryptedBuffer
        );

        // 4. Return Decrypted Data
        self.postMessage({ id, decryptedBuffer }, [decryptedBuffer]);

    } catch (error) {
        console.error("Worker Decryption Error:", error);
        self.postMessage({ id, error: error.message });
    }
});

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
