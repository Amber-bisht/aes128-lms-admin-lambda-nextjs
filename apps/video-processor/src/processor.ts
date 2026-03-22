
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
    const keyUrl = `${apiBase}/videos/${videoId}/key`;
    fs.writeFileSync(keyInfoPath, `${keyUrl}\n${keyPath}\n${iv}`);

    // 3. Transcode & Encrypt into Multiple Variants (ABR)
    console.log('Starting FFmpeg ABR...');
    
    const dir1080p = path.join(workDir, '1080p');
    const dir480p = path.join(workDir, '480p');
    if (!fs.existsSync(dir1080p)) fs.mkdirSync(dir1080p);
    if (!fs.existsSync(dir480p)) fs.mkdirSync(dir480p);

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            // 1080p Variant
            .output(path.join(dir1080p, 'output.m3u8'))
            .outputOptions([
                '-vf scale=-2:1080',
                '-c:v libx264',
                '-b:v 3000k',
                '-maxrate 3200k',
                '-bufsize 6000k',
                '-c:a aac',
                '-b:a 128k',
                '-hls_time 10',
                '-hls_list_size 0',
                `-hls_key_info_file ${keyInfoPath}`,
                `-hls_segment_filename ${path.join(dir1080p, '%03d.ts')}`
            ])
            // 480p Variant
            .output(path.join(dir480p, 'output.m3u8'))
            .outputOptions([
                '-vf scale=-2:480',
                '-c:v libx264',
                '-b:v 800k',
                '-maxrate 850k',
                '-bufsize 1200k',
                '-c:a aac',
                '-b:a 128k',
                '-hls_time 10',
                '-hls_list_size 0',
                `-hls_key_info_file ${keyInfoPath}`,
                `-hls_segment_filename ${path.join(dir480p, '%03d.ts')}`
            ])
            .on('end', resolve)
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .run();
    });

    // 4. Generate Master Playlist
    const masterPath = path.join(workDir, 'master.m3u8');
    const masterContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080
1080p/output.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480
480p/output.m3u8
`;
    fs.writeFileSync(masterPath, masterContent);

    // 5. Upload everything to S3
    console.log('Uploading HLS Master and Variants...');
    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
            if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
                arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
            } else {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        });
        return arrayOfFiles;
    };

    const allFiles = getAllFiles(workDir).filter(f => f.endsWith('.m3u8') || f.endsWith('.ts'));
    for (const fileFullPath of allFiles) {
        const relativeKey = fileFullPath.replace(`${workDir}/`, ''); 
        const fileContent = fs.readFileSync(fileFullPath);
        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_PUBLIC,
            Key: `videos/${videoId}/${relativeKey}`,
            Body: fileContent, // Add type assertions gracefully
            ContentType: fileFullPath.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t'
        }));
    }

    return {
        key: key.toString('hex'),
        iv,
        playlistUrl: `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_PUBLIC}/videos/${videoId}/master.m3u8`
    };
};
