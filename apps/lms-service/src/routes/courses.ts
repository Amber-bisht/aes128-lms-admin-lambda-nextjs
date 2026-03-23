
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

// GET all active courses - Public with Optional Auth
router.get('/', async (req: Request, res: Response) => {
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
        const courses = await prisma.course.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });

        // If user is logged in, mark purchased courses
        let purchasedCourseIds: string[] = [];
        let isAdmin = false;

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { courses: { select: { id: true } } }
            });
            purchasedCourseIds = user?.courses.map(c => c.id) || [];
            isAdmin = user?.role === 'ADMIN';
        }

        const signedCourses = courses.map(course => ({
            ...course,
            imageUrl: course.imageUrl ? getSignedVideoUrl(extractKey(course.imageUrl), 604800) : course.imageUrl,
            purchased: isAdmin || purchasedCourseIds.includes(course.id)
        }));

        res.json(signedCourses);
    } catch (error) {
        console.error('Fetch All Courses Error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// GET purchased courses for logged in user
router.get('/purchased', authenticateJWT, async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { 
                courses: { 
                    where: { active: true },
                    orderBy: { createdAt: 'desc' }
                } 
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const signedCourses = user.courses.map(course => ({
            ...course,
            imageUrl: course.imageUrl ? getSignedVideoUrl(extractKey(course.imageUrl), 604800) : course.imageUrl
        }));

        res.json(signedCourses);
    } catch (error) {
        console.error('Fetch Purchased Courses Error:', error);
        res.status(500).json({ error: 'Failed to fetch enrolled courses' });
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
                orderBy: { order: 'asc' },
                include: { videoAsset: true }
            });

            // Sign the video URLs using only the object key
            const signedLectures = fullLectures.map(lecture => {
                const rawVideoUrl = lecture.videoAsset?.videoUrl || lecture.videoUrl;
                if (!rawVideoUrl) return lecture;

                // Extract key from URL (everything after the domain)
                let key = rawVideoUrl;
                try {
                    const url = new URL(rawVideoUrl);
                    key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                    // Auto-Correct raw S3 Path-Style URLs
                    if (key.startsWith('lms.amberbisht/')) key = key.replace('lms.amberbisht/', '');
                } catch (e) {
                    // Fallback to original if not a valid URL
                }

                // Append the fully signed CloudFront URL to the videoAsset layer
                const signedUrl = getSignedVideoUrl(key);

                return {
                    ...lecture,
                    videoUrl: signedUrl,
                    videoAsset: lecture.videoAsset ? {
                        ...lecture.videoAsset,
                        videoUrl: signedUrl
                    } : null
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
