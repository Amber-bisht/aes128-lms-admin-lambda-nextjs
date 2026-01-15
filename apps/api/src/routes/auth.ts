
import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

router.post('/google', async (req: Request, res: Response) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const { email, sub } = payload; // 'sub' is the Google User ID

        // Upsert User
        // Note: In real app, you might want to ask role or default to USER.
        // For this project, we might manually set ADMIN in DB for specific emails.
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                role: 'USER', // Default role
            },
        });

        // Generate Application JWT
        const appToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token: appToken, user });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

export default router;
