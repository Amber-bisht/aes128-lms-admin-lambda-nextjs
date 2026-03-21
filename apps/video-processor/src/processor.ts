
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
    console.log(`Downloading input from ${process.env.S3_BUCKET_RAW}/${fileKey}...`);
    const downloadParams = { Bucket: process.env.S3_BUCKET_RAW, Key: fileKey };
    const { Body } = await s3.send(new GetObjectCommand(downloadParams));
    if (!Body) throw new Error('Failed to download from S3');

    const fileStream = fs.createWriteStream(inputPath);
    await new Promise((resolve, reject) => {
        (Body as any).pipe(fileStream).on('finish', resolve).on('error', reject);
    });

    // 2. Generate Encryption Key & IV
    const key = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16).toString('hex');
    fs.writeFileSync(keyPath, key);

    let apiBase = process.env.API_URL || "";
    if (apiBase && !apiBase.includes('/api/v1/lms')) {
        apiBase = `${apiBase.replace(/\/$/, '')}/api/v1/lms`;
    }
    const keyUrl = `${apiBase}/api/videos/${videoId}/key`;
    fs.writeFileSync(keyInfoPath, `${keyUrl}\n${keyPath}\n${iv}`);

    // 3. Transcode & Encrypt
    console.log('Starting FFmpeg...');
    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-hls_time 10',
                '-hls_list_size 0',
                `-hls_key_info_file ${keyInfoPath}`,
            ])
            .output(outputPath)
            .on('end', resolve)
            .on('error', (err) => reject(err))
            .run();
    });

    // 4. Upload HLS segments to Public Bucket
    console.log('Uploading HLS segments...');
    const hlsFiles = fs.readdirSync(workDir).filter(f => f.endsWith('.m3u8') || f.endsWith('.ts'));
    for (const file of hlsFiles) {
        const fileContent = fs.readFileSync(path.join(workDir, file));
        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_PUBLIC,
            Key: `videos/${videoId}/${file}`,
            Body: fileContent,
            ContentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t'
        }));
    }

    return {
        key: key.toString('hex'),
        iv,
        playlistUrl: `https://${process.env.S3_BUCKET_PUBLIC}.s3.amazonaws.com/videos/${videoId}/output.m3u8`
    };
};
