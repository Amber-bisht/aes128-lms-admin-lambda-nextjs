"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = exports.generateUploadUrl = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const cloudfront_1 = require("./cloudfront");
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});
const generateUploadUrl = (key, contentType, bucket) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucket || process.env.S3_BUCKET_RAW,
        Key: key,
        ContentType: contentType
    });
    return (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
});
exports.generateUploadUrl = generateUploadUrl;
const uploadToS3 = (buffer, key, contentType, bucket) => __awaiter(void 0, void 0, void 0, function* () {
    const targetBucket = bucket || process.env.S3_BUCKET_RAW;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: targetBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
    });
    yield s3.send(command);
    // Construct CloudFront URL if available, otherwise fallback to S3
    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (cloudFrontUrl) {
        // We use the same signing utility for images and videos
        return (0, cloudfront_1.getSignedVideoUrl)(key);
    }
    return `https://${targetBucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
});
exports.uploadToS3 = uploadToS3;
