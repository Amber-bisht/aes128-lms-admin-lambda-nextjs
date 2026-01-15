"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideo = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3 = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
const processVideo = async (fileKey, videoId) => {
    const workDir = path_1.default.join('/tmp', videoId);
    if (!fs_1.default.existsSync(workDir))
        fs_1.default.mkdirSync(workDir);
    const inputPath = path_1.default.join(workDir, 'input.mp4');
    const keyPath = path_1.default.join(workDir, 'enc.key');
    const keyInfoPath = path_1.default.join(workDir, 'enc.keyinfo');
    const outputPath = path_1.default.join(workDir, 'output.m3u8');
    // 1. Download Input
    console.log('Downloading input...');
    // Mock for build: await downloadFromS3(fileKey, inputPath); 
    // 2. Generate Encryption Key & IV
    const key = crypto_1.default.randomBytes(16);
    const iv = crypto_1.default.randomBytes(16).toString('hex');
    // Save Key to file
    fs_1.default.writeFileSync(keyPath, key);
    // Create Key Info File
    // Format: Key URI (API endpoint), Key File Path, IV (Optional)
    const keyUrl = `http://localhost:4000/api/videos/${videoId}/key`;
    fs_1.default.writeFileSync(keyInfoPath, `${keyUrl}\n${keyPath}\n${iv}`);
    // 3. Transcode & Encrypt (Mocking the ffmpeg structure to be valid TS, logic is same)
    console.log('Starting FFmpeg...');
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
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
exports.processVideo = processVideo;
