
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
    try {
        const course = await prisma.course.findUnique({
            where: { id: id as string },
            include: {
                lectures: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        videoUrl: true,
                        encryptionKey: true,
                        iv: true,
                    }
                }
            }
        });
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

export default router;
