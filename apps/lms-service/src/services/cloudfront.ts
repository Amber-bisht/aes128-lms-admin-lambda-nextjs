
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
const KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
const PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY; // Should be the Multi-line RSA Private Key

/**
 * Generates a signed URL for a CloudFront asset.
 * @param s3Key The key of the asset in S3 (e.g., 'videos/lesson1.mp4')
 * @param expiresIn Time in seconds until the URL expires (default: 3600s / 1 hour)
 */
export const getSignedVideoUrl = (s3Key: string, expiresIn: number = 3600) => {
    if (!CLOUDFRONT_URL || !KEY_PAIR_ID || !PRIVATE_KEY) {
        console.warn("CloudFront signing credentials missing:", {
            hasUrl: !!CLOUDFRONT_URL,
            hasKeyPair: !!KEY_PAIR_ID,
            hasPrivateKey: !!PRIVATE_KEY
        });
        return `${CLOUDFRONT_URL?.replace(/\/$/, '')}/${s3Key}`;
    }

    const url = `${CLOUDFRONT_URL.replace(/\/$/, '')}/${s3Key}`;
    const dateLessThan = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Robust PEM Fixer: Ensures headers are on their own lines and base64 content is clean
    const rawKey = PRIVATE_KEY.replace(/"/g, '').trim();
    
    // Extract everything between the BEGIN and END markers
    const match = rawKey.match(/-----BEGIN RSA PRIVATE KEY-----([\s\S]*)-----END RSA PRIVATE KEY-----/);
    
    let cleanedKey = rawKey;
    if (match && match[1]) {
        // Remove all whitespace and literal \n from the middle content
        const base64Content = match[1].replace(/\\n/g, '').replace(/\s+/g, '');
        // Reconstruct a valid PEM
        cleanedKey = `-----BEGIN RSA PRIVATE KEY-----\n${base64Content}\n-----END RSA PRIVATE KEY-----`;
    } else {
        // Fallback: just try to fix common escaping if headers weren't found correctly
        cleanedKey = rawKey.replace(/\\n/g, '\n');
    }

    try {
        const signedUrl = getSignedUrl({
            url,
            keyPairId: KEY_PAIR_ID,
            privateKey: cleanedKey,
            dateLessThan,
        });

        return signedUrl;
    } catch (error: any) {
        console.error("Error signing CloudFront URL:", {
            error: error.message,
            code: error.code,
            keyLength: cleanedKey.length,
            keyStart: cleanedKey.substring(0, 30),
            keyEnd: cleanedKey.substring(cleanedKey.length - 30)
        });
        return url; // Return unsigned URL as fallback
    }
};
