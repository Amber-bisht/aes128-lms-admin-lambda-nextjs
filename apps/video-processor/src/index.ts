
import { S3Client } from '@aws-sdk/client-s3';
// Note: In a real monorepo with shared packages, we'd import the PrismaClient from a shared lib.
// For now, we'll assume a direct DB connection or API call. 
// Using fetch to call the Main API is cleaner for a lambda to avoid shipping the whole Prisma binary if potential cold starts are a concern, 
// but direct DB is also fine. Let's use a mocked API call for simplicity and separation.

import { processVideo } from './processor';

export const handler = async (event: any) => {
    console.log('Video Processor Triggered');

    try {
        // 1. Parse S3 Event
        const record = event.Records[0];
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing file from bucket: ${bucket}, key: ${key}`);

        // Extract videoId/lectureId from key (e.g., "lecture-videos/UUID.mp4")
        const videoId = key.split('/').pop()?.split('.')[0];
        if (!videoId) throw new Error("Could not extract videoId from key");

        // 2. Process Video (Transcode + Generate Unique Keys)
        const result = await processVideo(key, videoId);

        console.log("Processing complete. Updating DB...", result);

        // 3. Update Main API with Keys
        let apiBase = process.env.API_URL;
        if (!apiBase) throw new Error("API_URL environment variable is not set");
        if (!apiBase.includes('/api/v1/lms')) {
            apiBase = `${apiBase.replace(/\/$/, '')}/api/v1/lms`;
        }

        const apiResponse = await fetch(`${apiBase}/admin/videos/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ADMIN_SERVICE_TOKEN}`
            },
            body: JSON.stringify({
                videoId: videoId,
                videoUrl: result.playlistUrl,
                encryptionKey: result.key, // Unique Hex Key
                iv: result.iv             // Unique Hex VI
            })
        });

        if (!apiResponse.ok) {
            throw new Error(`API Update failed: ${apiResponse.statusText}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Processing successful', result }),
        };

    } catch (error: any) {
        console.error("Handler Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error processing video', error: error.message }),
        };
    }
};
