
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { generateUploadUrl, uploadToS3 } from '../services/s3';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import sharp from 'sharp';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

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

// GET /admin/courses/:id/full - Detailed fetch with lectures and assets
router.get('/courses/:id/full', async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await prisma.course.findFirst({
        where: {
            OR: [
                { id: id as string },
                { slug: id as string }
            ]
        },
        include: {
            lectures: {
                orderBy: { order: 'asc' },
                include: { videoAsset: true }
            }
        }
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
    const { title, videoUrl, order, section, description } = req.body;

    try {
        const lecture = await prisma.lecture.create({
            data: {
                title,
                section,
                description,
                courseId: courseId as string,
                order: order || 0,
                videoUrl: videoUrl || "",
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

// Get All Users and their Enrollments
router.get('/users', async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                courses: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error('Fetch Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update Lecture
router.patch('/lectures/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, section, order, videoAssetId, videoUrl, imageUrl } = req.body;

    try {
        const lecture = await prisma.lecture.update({
            where: { id: id as string },
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
    } catch (error) {
        console.error('Update Lecture Error:', error);
        res.status(500).json({ error: 'Failed to update lecture' });
    }
});

// Delete Lecture
router.delete('/lectures/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.lecture.delete({ where: { id: id as string } });
        res.json({ message: 'Lecture deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete lecture' });
    }
});

// GET /admin/videos - Fetch available video assets
router.get('/videos', async (req: Request, res: Response) => {
    try {
        const assets = await prisma.videoAsset.findMany({
            where: { lecture: null },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video assets' });
    }
});

// POST /admin/videos/complete - Lambda Callback
router.post('/videos/complete', async (req: Request, res: Response) => {
    const { videoUrl, encryptionKey, iv, name, videoId, qualities } = req.body;

    try {
        const asset = await prisma.videoAsset.create({
            data: {
                id: videoId || uuidv4(),
                name: name || "Processed Video",
                videoUrl,
                encryptionKey,
                iv,
                qualities: qualities || []
            }
        });
        res.json(asset);
    } catch (error) {
        console.error('Video Complete Error:', error);
        res.status(500).json({ error: 'Failed to record video asset' });
    }
});

// Bulk Reorder Lectures
router.put('/lectures/reorder', async (req: Request, res: Response) => {
    const { lectures } = req.body; // Array of { id: string, order: number }

    try {
        await prisma.$transaction(
            lectures.map((l: any) =>
                prisma.lecture.update({
                    where: { id: l.id },
                    data: { order: l.order }
                })
            )
        );
        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Reorder Error:', error);
        res.status(500).json({ error: 'Failed to reorder lectures' });
    }
});

export default router;
