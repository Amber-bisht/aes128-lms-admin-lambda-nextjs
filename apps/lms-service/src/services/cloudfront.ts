
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

    try {
        const signedUrl = getSignedUrl({
            url,
            keyPairId: KEY_PAIR_ID,
            privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines in .env
            dateLessThan,
        });

        return signedUrl;
    } catch (error) {
        console.error("Error signing CloudFront URL:", error);
        return url; // Return unsigned URL as fallback
    }
};
