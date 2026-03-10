
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { generateUploadUrl, uploadToS3 } from '../services/s3';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import sharp from 'sharp';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Use middleware to ensure only admins can access
router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/courses/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await prisma.course.findFirst({
        where: {
            OR: [
                { id: id as string },
                { slug: id as string }
            ]
        },
        include: { lectures: { orderBy: { order: 'asc' } } }
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
});

// Create Course
router.post('/courses', async (req: Request, res: Response) => {
    const { title, description, imageUrl, price, slug, active } = req.body;
    try {
        const course = await prisma.course.create({
            data: {
                title,
                slug,
                description,
                imageUrl,
                price: parseFloat(price) || 0,
                active: active ?? true
            }
        });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create course' });
    }
});

// Update Course
router.put('/courses/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, imageUrl, price, slug, active } = req.body;

    try {
        // Find by ID or Slug
        const existingCourse = await prisma.course.findFirst({
            where: {
                OR: [
                    { id: id as string },
                    { slug: id as string }
                ]
            }
        });

        if (!existingCourse) return res.status(404).json({ error: 'Course not found' });

        const updatedCourse = await prisma.course.update({
            where: { id: existingCourse.id },
            data: {
                title,
                description,
                imageUrl,
                price: price !== undefined ? parseFloat(price) : undefined,
                slug,
                active: active ?? undefined
            }
        });
        res.json(updatedCourse);
    } catch (error) {
        console.error('Update Course Error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// Add Lecture to Course
router.post('/courses/:courseId/lectures', async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { title, videoUrl, order } = req.body; // videoUrl here implies the processed URL or raw? 
    // Actually, usually we start with raw upload, then processing updates it.
    // But for simplicity, we might create the lecture entry first with status pending.

    try {
        const lecture = await prisma.lecture.create({
            data: {
                title,
                courseId: courseId as string,
                order: order || 0,
                // videoUrl might be empty initially until processed
            }
        });
        res.json(lecture);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create lecture' });
    }
});

// Get Upload URL for Video or Image
router.post('/upload-url', async (req: Request, res: Response) => {
    const { filename, contentType, type } = req.body; // type: 'course-image' or 'lecture-video'
    const ext = filename.split('.').pop();
    const key = `${type}s/${uuidv4()}.${ext}`;

    const bucket = type === 'course-image' ? process.env.S3_BUCKET_PUBLIC : process.env.S3_BUCKET_RAW;

    try {
        const url = await generateUploadUrl(key, contentType, bucket);
        res.json({ url, key });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

// Direct Backend Image Upload to S3
router.post('/upload-image', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.body; // 'course-image' or 'avatar' etc.
    const fileType = type || 'course-image';
    const ext = req.file.originalname.split('.').pop();
    const key = `${fileType}s/${uuidv4()}.${ext}`;
    const bucket = fileType === 'course-image' ? process.env.S3_BUCKET_PUBLIC : process.env.S3_BUCKET_RAW;

    try {
        // Optimize image with Sharp
        const optimizedBuffer = await sharp(req.file.buffer)
            .resize({ width: 1200, withoutEnlargement: true }) // Standard resize for web
            .webp({ quality: 80 }) // Convert to WebP with 80% quality
            .toBuffer();

        const webpKey = key.replace(/\.[^/.]+$/, "") + ".webp"; // Ensure .webp extension

        const imageUrl = await uploadToS3(optimizedBuffer, webpKey, 'image/webp', bucket);
        res.json({ imageUrl, key: webpKey });
    } catch (error) {
        console.error('Sharp/S3 Upload Error:', error);
        res.status(500).json({ error: 'Failed to process and upload image' });
    }
});

export default router;
