
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const processVideo = async (fileKey: string, videoId: string): Promise<{ key: string; iv: string; playlistUrl: string }> => {
    const workDir = path.join('/tmp', videoId);
    if (!fs.existsSync(workDir)) fs.mkdirSync(workDir);

    const inputPath = path.join(workDir, 'input.mp4');
    const keyPath = path.join(workDir, 'enc.key');
    const keyInfoPath = path.join(workDir, 'enc.keyinfo');
    const outputPath = path.join(workDir, 'output.m3u8');

    // 1. Download Input
    console.log('Downloading input...');
    // Mock for build: await downloadFromS3(fileKey, inputPath); 

    // 2. Generate Encryption Key & IV
    const key = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16).toString('hex');

    // Save Key to file
    fs.writeFileSync(keyPath, key);

    // Create Key Info File
    // Format: Key URI (API endpoint), Key File Path, IV (Optional)
    // Format: Key URI (API endpoint), Key File Path, IV (Optional)
    const apiBase = process.env.API_URL || 'http://localhost:4000';
    const keyUrl = `${apiBase}/api/videos/${videoId}/key`;
    fs.writeFileSync(keyInfoPath, `${keyUrl}\n${keyPath}\n${iv}`);

    // 3. Transcode & Encrypt (Mocking the ffmpeg structure to be valid TS, logic is same)
    console.log('Starting FFmpeg...');
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-hls_time 10',
                '-hls_list_size 0',
                `-hls_key_info_file ${keyInfoPath}`,
            ])
            .output(outputPath)
            .on('end', async () => {
                console.log('FFmpeg finished.');

                resolve({
                    key: key.toString('hex'),
                    iv,
                    playlistUrl: `https://${process.env.S3_BUCKET_PUBLIC}.s3.amazonaws.com/videos/${videoId}/output.m3u8`
                });
            })
            .on('error', (err) => reject(err))
            .run();
    });
};
