
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedVideoUrl } from './cloudfront';

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

export const generateUploadUrl = async (key: string, contentType: string, bucket?: string) => {
    const command = new PutObjectCommand({
        Bucket: bucket || process.env.S3_BUCKET_RAW,
        Key: key,
        ContentType: contentType
    });

    return getSignedUrl(s3, command, { expiresIn: 3600 });
};

export const uploadToS3 = async (buffer: Buffer, key: string, contentType: string, bucket?: string) => {
    const targetBucket = bucket || process.env.S3_BUCKET_RAW;
    const command = new PutObjectCommand({
        Bucket: targetBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
    });

    await s3.send(command);

    // Construct CloudFront URL if available, otherwise fallback to S3
    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (cloudFrontUrl) {
        // We use the same signing utility for images and videos
        return getSignedVideoUrl(key);
    }

    return `https://${targetBucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};
