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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const s3_1 = require("../services/s3");
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
// Use middleware to ensure only admins can access
router.use(auth_1.authenticateJWT);
router.use(auth_1.requireAdmin);
router.get('/courses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const course = yield prisma.course.findFirst({
        where: {
            OR: [
                { id: id },
                { slug: id }
            ]
        },
        include: { lectures: { orderBy: { order: 'asc' } } }
    });
    if (!course)
        return res.status(404).json({ error: 'Course not found' });
    res.json(course);
}));
// GET /admin/courses/:id/full - Detailed fetch with lectures and assets
router.get('/courses/:id/full', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const course = yield prisma.course.findFirst({
        where: {
            OR: [
                { id: id },
                { slug: id }
            ]
        },
        include: {
            lectures: {
                orderBy: { order: 'asc' },
                include: { videoAsset: true }
            }
        }
    });
    if (!course)
        return res.status(404).json({ error: 'Course not found' });
    res.json(course);
}));
// Create Course
router.post('/courses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, imageUrl, price, slug, active } = req.body;
    try {
        const course = yield prisma.course.create({
            data: {
                title,
                slug,
                description,
                imageUrl,
                price: parseFloat(price) || 0,
                active: active !== null && active !== void 0 ? active : true
            }
        });
        res.json(course);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create course' });
    }
}));
// Update Course
router.put('/courses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, description, imageUrl, price, slug, active } = req.body;
    try {
        // Find by ID or Slug
        const existingCourse = yield prisma.course.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ]
            }
        });
        if (!existingCourse)
            return res.status(404).json({ error: 'Course not found' });
        const updatedCourse = yield prisma.course.update({
            where: { id: existingCourse.id },
            data: {
                title,
                description,
                imageUrl,
                price: price !== undefined ? parseFloat(price) : undefined,
                slug,
                active: active !== null && active !== void 0 ? active : undefined
            }
        });
        res.json(updatedCourse);
    }
    catch (error) {
        console.error('Update Course Error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
}));
// Add Lecture to Course
router.post('/courses/:courseId/lectures', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const { title, videoUrl, order, section, description } = req.body;
    try {
        const lecture = yield prisma.lecture.create({
            data: {
                title,
                section,
                description,
                courseId: courseId,
                order: order || 0,
                videoUrl: videoUrl || "",
            }
        });
        res.json(lecture);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create lecture' });
    }
}));
// Get Upload URL for Video or Image
router.post('/upload-url', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename, contentType, type } = req.body; // type: 'course-image' or 'lecture-video'
    const ext = filename.split('.').pop();
    const key = `${type}s/${(0, uuid_1.v4)()}.${ext}`;
    const bucket = type === 'course-image' ? process.env.S3_BUCKET_PUBLIC : process.env.S3_BUCKET_RAW;
    try {
        const url = yield (0, s3_1.generateUploadUrl)(key, contentType, bucket);
        res.json({ url, key });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
}));
// Direct Backend Image Upload to S3
router.post('/upload-image', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const { type } = req.body; // 'course-image' or 'avatar' etc.
    const fileType = type || 'course-image';
    const ext = req.file.originalname.split('.').pop();
    const key = `${fileType}s/${(0, uuid_1.v4)()}.${ext}`;
    const bucket = fileType === 'course-image' ? process.env.S3_BUCKET_PUBLIC : process.env.S3_BUCKET_RAW;
    try {
        // Optimize image with Sharp
        const optimizedBuffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize({ width: 1200, withoutEnlargement: true }) // Standard resize for web
            .webp({ quality: 80 }) // Convert to WebP with 80% quality
            .toBuffer();
        const webpKey = key.replace(/\.[^/.]+$/, "") + ".webp"; // Ensure .webp extension
        const imageUrl = yield (0, s3_1.uploadToS3)(optimizedBuffer, webpKey, 'image/webp', bucket);
        res.json({ imageUrl, key: webpKey });
    }
    catch (error) {
        console.error('Sharp/S3 Upload Error:', error);
        res.status(500).json({ error: 'Failed to process and upload image' });
    }
}));
// Get All Users and their Enrollments
router.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            include: {
                courses: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                },
                ipLogs: {
                    select: {
                        ip: true,
                        userAgent: true,
                        lastSeen: true
                    },
                    orderBy: { lastSeen: 'desc' }
                },
                flags: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Fetch Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// Update Lecture
router.patch('/lectures/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, description, section, order, videoAssetId, videoUrl, imageUrl } = req.body;
    try {
        const lecture = yield prisma.lecture.update({
            where: { id: id },
            data: {
                title,
                description,
                section,
                order,
                videoAssetId,
                videoUrl,
                imageUrl
            },
            include: { videoAsset: true }
        });
        res.json(lecture);
    }
    catch (error) {
        console.error('Update Lecture Error:', error);
        res.status(500).json({ error: 'Failed to update lecture' });
    }
}));
// Delete Lecture
router.delete('/lectures/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.lecture.delete({ where: { id: id } });
        res.json({ message: 'Lecture deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete lecture' });
    }
}));
// GET /admin/videos - Fetch available video assets
router.get('/videos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assets = yield prisma.videoAsset.findMany({
            where: { lecture: null },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch video assets' });
    }
}));
// POST /admin/videos/complete - Lambda Callback
router.post('/videos/complete', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoUrl, encryptionKey, iv, name, videoId, qualities } = req.body;
    try {
        const asset = yield prisma.videoAsset.create({
            data: {
                id: videoId || (0, uuid_1.v4)(),
                name: name || "Processed Video",
                videoUrl,
                encryptionKey,
                iv,
                qualities: qualities || []
            }
        });
        res.json(asset);
    }
    catch (error) {
        console.error('Video Complete Error:', error);
        res.status(500).json({ error: 'Failed to record video asset' });
    }
}));
// Bulk Reorder Lectures
router.put('/lectures/reorder', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lectures } = req.body; // Array of { id: string, order: number }
    try {
        yield prisma.$transaction(lectures.map((l) => prisma.lecture.update({
            where: { id: l.id },
            data: { order: l.order }
        })));
        res.json({ message: 'Order updated successfully' });
    }
    catch (error) {
        console.error('Reorder Error:', error);
        res.status(500).json({ error: 'Failed to reorder lectures' });
    }
}));
exports.default = router;
