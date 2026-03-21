
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';
import { getSignedVideoUrl } from '../services/cloudfront';

const router = Router();
const prisma = new PrismaClient();

// All routes require login
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

const extractKey = (urlStr: string) => {
    try {
        const url = new URL(urlStr);
        return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    } catch (e) {
        return urlStr;
    }
};

// GET all active courses - Public
router.get('/', async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });

        const signedCourses = courses.map(course => ({
            ...course,
            imageUrl: course.imageUrl ? getSignedVideoUrl(extractKey(course.imageUrl), 604800) : course.imageUrl
        }));

        res.json(signedCourses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// GET course by ID or Slug - Optional Auth
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    // Optional JWT verification
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded: any = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
        } catch (e) {
            // Invalid token, treat as public
        }
    }

    try {
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
                    select: {
                        id: true,
                        title: true,
                        section: true,
                        description: true,
                        order: true,
                    }
                }
            }
        });

        if (!course) return res.status(404).json({ error: 'Course not found' });

        // Sign the main course image
        if (course.imageUrl) {
            course.imageUrl = getSignedVideoUrl(extractKey(course.imageUrl), 604800);
        }

        // Check if user is enrolled or is admin
        let isPurchased = false;
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    courses: { where: { id: course.id } }
                }
            });
            isPurchased = (user?.courses.length || 0) > 0 || user?.role === 'ADMIN';
        }

        // If purchased, fetch full lecture details (with video URLs)
        if (isPurchased) {
            const fullLectures = await prisma.lecture.findMany({
                where: { courseId: course.id },
                orderBy: { order: 'asc' }
            });

            // Sign the video URLs using only the object key
            const signedLectures = fullLectures.map(lecture => {
                if (!lecture.videoUrl) return lecture;

                // Extract key from URL (everything after the domain)
                let key = lecture.videoUrl;
                try {
                    const url = new URL(lecture.videoUrl);
                    key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (e) {
                    // Fallback to original if not a valid URL
                }

                return {
                    ...lecture,
                    videoUrl: getSignedVideoUrl(key)
                };
            });

            return res.json({ ...course, lectures: signedLectures, purchased: true });
        }

        // If not purchased, return limited details
        res.json({ ...course, purchased: false });
    } catch (error) {
        console.error('Fetch Course Error:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

export default router;
