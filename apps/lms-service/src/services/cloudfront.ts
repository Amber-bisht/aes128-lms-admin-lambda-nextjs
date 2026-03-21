
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
    
    // Robust PEM Fixer: Ensures headers are on their own lines and base64 content is clean
    const rawKey = PRIVATE_KEY.replace(/"/g, '').trim();
    let base64Content = rawKey
        .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
        .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '');
    base64Content = base64Content.split('\\n').join('');
    base64Content = base64Content.replace(/\s+/g, '');
    const cleanedKey = `-----BEGIN RSA PRIVATE KEY-----\n${base64Content}\n-----END RSA PRIVATE KEY-----`;

    try {
        // If it's an HLS Playlist, automatically grant permissions to the ENTIRE VIDEO DIRECTORY
        if (s3Key.endsWith('.m3u8')) {
            const wildcardResource = url.replace(/[^/]+$/, '*');
            const policy = JSON.stringify({
                Statement: [
                    {
                        Resource: wildcardResource,
                        Condition: {
                            DateLessThan: {
                                "AWS:EpochTime": Math.floor(Date.now() / 1000) + expiresIn
                            }
                        }
                    }
                ]
            });

            return getSignedUrl({
                url,
                keyPairId: KEY_PAIR_ID,
                privateKey: cleanedKey,
                policy
            });
        }

        // Standard Canned Policy for static files (images, mp4)
        return getSignedUrl({
            url,
            keyPairId: KEY_PAIR_ID,
            privateKey: cleanedKey,
            dateLessThan: new Date(Date.now() + expiresIn * 1000).toISOString(),
        });
    } catch (error: any) {
        console.error("Error signing CloudFront URL:", error.message);
        return url; // Return unsigned URL as fallback
    }
};
