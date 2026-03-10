
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require login
router.use(authenticateJWT);

router.get('/', async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;

    try {
        const course = await prisma.course.findFirst({
            where: {
                OR: [
                    { id: id as string },
                    { slug: id as string }
                ]
            },
            include: {
                users: {
                    where: { id: userId },
                    select: { id: true }
                },
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

        const isPurchased = course.users.length > 0;

        // If purchased, fetch full lecture details
        if (isPurchased) {
            const fullLectures = await prisma.lecture.findMany({
                where: { courseId: course.id },
                orderBy: { order: 'asc' }
            });
            return res.json({ ...course, lectures: fullLectures, purchased: true });
        }

        // If not purchased, return limited details
        res.json({ ...course, users: undefined, purchased: false });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

export default router;
