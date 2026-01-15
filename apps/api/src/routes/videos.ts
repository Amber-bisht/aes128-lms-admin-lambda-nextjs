
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Protect all video routes
router.use(authenticateJWT);

// GET /api/videos/:id/key
router.get('/:id/key', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        // 1. Check if User owns course or is Admin (Access Control)
        // For simplicity, we just check if they are logged in.

        // 2. Fetch Key
        const lecture = await prisma.lecture.findUnique({
            where: { id: id as string },
            select: { encryptionKey: true }
        });

        if (!lecture || !lecture.encryptionKey) {
            return res.status(404).send('Key not found');
        }

        // 3. Convert Hex to Binary
        const keyBuffer = Buffer.from(lecture.encryptionKey, 'hex');

        res.write(keyBuffer);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
