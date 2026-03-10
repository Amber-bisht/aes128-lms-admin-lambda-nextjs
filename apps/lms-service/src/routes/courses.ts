
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require login
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// GET all active courses - Public
router.get('/', async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(courses);
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
                        order: true,
                    }
                }
            }
        });

        if (!course) return res.status(404).json({ error: 'Course not found' });

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
            return res.json({ ...course, lectures: fullLectures, purchased: true });
        }

        // If not purchased, return limited details
        res.json({ ...course, purchased: false });
    } catch (error) {
        console.error('Fetch Course Error:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

export default router;
