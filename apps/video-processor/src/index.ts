
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
        // const record = event.Records[0];
        // const bucket = record.s3.bucket.name;
        // const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        // Mock Data for demonstration
        const key = "raw/sample-video.mp4";
        // We'd parse the videoId from the filename or metadata
        const videoId = "some-uuid-from-upload";

        // 2. Process Video (Transcode + Generate Unique Keys)
        const result = await processVideo(key, videoId);

        console.log("Processing complete. Updating DB...", result);

        // 3. Update Main API (or DB directly) with Keys
        const apiBase = process.env.API_URL || 'http://localhost:4000';
        const apiResponse = await fetch(`${apiBase}/admin/courses/lectures/${videoId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ADMIN_SERVICE_TOKEN}`
            },
            body: JSON.stringify({
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
