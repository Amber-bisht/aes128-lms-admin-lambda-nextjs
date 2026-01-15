
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth';
import { generateUploadUrl } from '../services/s3';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

// Use middleware to ensure only admins can access
router.use(requireAdmin);

router.get('/courses/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
        where: { id: id as string },
        include: { lectures: { orderBy: { order: 'asc' } } }
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
});

// Create Course
router.post('/courses', async (req: Request, res: Response) => {
    const { title, description, imageUrl } = req.body;
    try {
        const course = await prisma.course.create({
            data: {
                title,
                description,
                imageUrl
            }
        });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create course' });
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

    try {
        const url = await generateUploadUrl(key, contentType);
        res.json({ url, key });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

export default router;
