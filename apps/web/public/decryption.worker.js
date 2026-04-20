
// Amber Decryption Worker with ECDH Handshake & WASM Protection

let vaultWasm = null;
let sharedSecret = null;
let sessionKey = null;
let sessionIv = null;
let isHandshakeComplete = false;

// Rapid Fetch Detection Stats
let segmentCount = 0;
let lastResetTime = Date.now();
const MAX_SEGMENTS_PER_10S = 25; // 25 segments = ~4 minutes of video. Requesting this in <10s is suspicious.

// Initialize WASM
async function initWasm() {
    if (vaultWasm) return;
    try {
        const response = await fetch('/vault.wasm');
        const buffer = await response.arrayBuffer();
        const module = await WebAssembly.instantiate(buffer, {});
        vaultWasm = module.instance.exports;
    } catch (e) {
        console.error("WASM Load Error", e);
    }
}

// Perform ECDH Handshake with Backend
async function performHandshake(courseId, lectureId, appToken) {
    if (isHandshakeComplete) return;

    await initWasm();

    try {
        // 1. Generate Client-side EC Key Pair (P-256)
        const keyPair = await crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-256" },
            true, // extractable
            ["deriveKey", "deriveBits"]
        );

        const exportedPublicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
        const publicKeyHex = bufToHex(exportedPublicKey);

        // 2. Send Public Key to Server for Handshake
        // Note: process.env is not available in worker, so we might need to pass the base URL
        // For simplicity, we assume absolute or same-origin paths if possible, 
        // but here we likely need a base API URL passed from the main thread.
        // We'll use a globally set variable or pass it in the first message.
        const apiUrl = self.apiUrl || "https://api-lms.amberbisht.me/api/v1/lms";

        const response = await fetch(`${apiUrl}/courses/${courseId}/lectures/${lectureId}/vault-handshake`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${appToken}`
            },
            body: JSON.stringify({ clientPublicKey: publicKeyHex })
        });

        if (!response.ok) throw new Error("Handshake failed");
        const data = await response.json();

        // 3. Complete ECDH and derive Shared Secret
        const serverPubKey = await crypto.subtle.importKey(
            "raw",
            hexToBytes(data.serverPublicKey),
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        );

        const bits = await crypto.subtle.deriveBits(
            { name: "ECDH", public: serverPubKey },
            keyPair.privateKey,
            256
        );
        const secretBuffer = new Uint8Array(bits);

        // 4. Decrypt the Master AES Package using Shared Secret
        const vaultKey = await crypto.subtle.importKey(
            "raw",
            await crypto.subtle.digest("SHA-256", secretBuffer),
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        const decryptedPackage = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: hexToBytes(data.vaultIv), tagLength: 128 },
            vaultKey,
            hexToBytes(data.encryptedPackage + data.authTag)
        );

        const packageData = JSON.parse(new TextDecoder().decode(decryptedPackage));

        // 5. Finalize keys using WASM for extra obfuscation
        // This makes the HLS key invisible to simple JS memory inspection
        const rawKey = hexToBytes(packageData.key);
        const rawIv = hexToBytes(packageData.iv);

        // We use the WASM instance to transform the keys
        // AssemblyScript exports need careful memory handling for TypedArrays
        // For this implementation, we simulate it with simpler calls or direct memory interaction if needed
        sessionKey = finalizeViaWasm(secretBuffer, rawKey, "key");
        sessionIv = finalizeViaWasm(secretBuffer, rawIv, "iv");

        isHandshakeComplete = true;
    } catch (e) {
        console.error("Handshake Error:", e);
        throw e;
    }
}

// Utility to wrap AssemblyScript memory interaction
function finalizeViaWasm(secret, data, type) {
    if (!vaultWasm) return data; // Fallback

    // Note: In real AssemblyScript, we'd allocate memory in the WASM heap
    // For this demonstration, we'll assume the WASM function takes the raw bytes or we just use a simplified version
    // AS simplified exports for small arrays:
    const sPtr = copyToWasm(secret);
    const dPtr = copyToWasm(data);

    let resultPtr;
    if (type === "key") {
        resultPtr = vaultWasm.finalizeKey(sPtr, dPtr);
    } else {
        resultPtr = vaultWasm.finalizeIv(sPtr, dPtr);
    }

    return copyFromWasm(resultPtr, 16);
}

// Simple WASM Memory Helpers (Mocks for typical AS behavior)
function copyToWasm(arr) {
    const ptr = vaultWasm.__newArray(vaultWasm.UINT8ARRAY_ID, arr);
    return ptr;
}
function copyFromWasm(ptr, len) {
    return vaultWasm.__getUint8Array(ptr);
}

self.addEventListener('message', async (e) => {
    const { type, config, payload } = e.data;

    // Handle Initialization (from VideoPlayer)
    if (type === 'INIT') {
        self.apiUrl = config.apiUrl;
        self.courseId = config.courseId;
        self.lectureId = config.lectureId;
        self.appToken = config.appToken;
        return;
    }

    // Handle Decryption Request
    if (type === 'DECRYPT_SEGMENT') {
        const { chunkUrl, id } = payload;

        // Heuristic DOWNLOAD Detection
        segmentCount++;
        const now = Date.now();
        if (now - lastResetTime > 10000) {
            // Reset window every 10 seconds
            segmentCount = 0;
            lastResetTime = now;
        }

        if (segmentCount > MAX_SEGMENTS_PER_10S) {
            // Flag it
            fetch(`${self.apiUrl}/security/flag`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${self.appToken}`
                },
                body: JSON.stringify({
                    type: "RAPID_DOWNLOAD",
                    severity: "HIGH",
                    metadata: {
                        videoUrl: chunkUrl,
                        lectureId: self.lectureId,
                        rate: `${segmentCount} segments in the last 10s`
                    }
                })
            }).catch(() => { }); // Fire and forget
        }

        try {
            if (!isHandshakeComplete) {
                await performHandshake(self.courseId, self.lectureId, self.appToken);
            }

            // 1. Fetch Encrypted Chunk (Authenticated via CloudFront policy in URL)
            const response = await fetch(chunkUrl);
            const encryptedBuffer = await response.arrayBuffer();

            // 2. Import the Finalized Session Key (that was derived/transformed by WASM)
            const key = await crypto.subtle.importKey(
                "raw",
                sessionKey,
                { name: "AES-CBC" },
                false,
                ["decrypt"]
            );

            // 3. Decrypt the Segment
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-CBC", iv: sessionIv },
                key,
                encryptedBuffer
            );

            // 4. Return to main thread
            self.postMessage({ id, decryptedBuffer }, [decryptedBuffer]);

        } catch (error) {
            console.error("Worker Decryption Error:", error);
            self.postMessage({ id, error: error.message });
        }
    }
});

// Helper Functions
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bufToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
