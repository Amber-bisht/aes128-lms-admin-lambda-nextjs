
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';
import { getSignedVideoUrl } from '../services/cloudfront';
import crypto from 'crypto';

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

        // Return course and limited lecture metadata
        res.json({ ...course, purchased: isPurchased });
    } catch (error) {
        console.error('Fetch Course Error:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

// GET /api/v1/lms/courses/:courseId/lectures/:lectureId/play-info
router.get('/:courseId/lectures/:lectureId/play-info', authenticateJWT, async (req: any, res: Response) => {
    const { courseId, lectureId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Verify Enrollment
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                courses: { where: { id: courseId } }
            }
        });

        const isPurchased = (user?.courses.length || 0) > 0 || user?.role === 'ADMIN';
        if (!isPurchased) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }

        // 2. Fetch Lecture with Video Asset
        const lecture = await prisma.lecture.findFirst({
            where: { 
                id: lectureId,
                courseId: courseId
            },
            include: { videoAsset: true }
        });

        if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

        const rawVideoUrl = lecture.videoAsset?.videoUrl || lecture.videoUrl;
        if (!rawVideoUrl) return res.status(404).json({ error: 'Video not found for this lecture' });

        // 3. Sign Video URL
        let key = rawVideoUrl;
        try {
            const url = new URL(rawVideoUrl);
            key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            if (key.startsWith('lms.amberbisht/')) key = key.replace('lms.amberbisht/', '');
        } catch (e) {}

        const signedUrl = getSignedVideoUrl(key);

        res.json({
            videoUrl: signedUrl,
            encryptionKey: lecture.videoAsset?.encryptionKey || lecture.encryptionKey,
            iv: lecture.videoAsset?.iv || lecture.iv
        });
    } catch (error) {
        console.error('Play Info Error:', error);
        res.status(500).json({ error: 'Failed to fetch play information' });
    }
// POST /api/v1/lms/courses/:courseId/lectures/:lectureId/vault-handshake
router.post('/:courseId/lectures/:lectureId/vault-handshake', authenticateJWT, async (req: any, res: Response) => {
    const { courseId, lectureId } = req.params;
    const { clientPublicKey } = req.body;
    const userId = req.user.id;

    if (!clientPublicKey) {
        return res.status(400).json({ error: 'Client public key is required' });
    }

    try {
        // 1. Verify Enrollment
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                courses: { where: { id: courseId } }
            }
        });

        const isPurchased = (user?.courses.length || 0) > 0 || user?.role === 'ADMIN';
        if (!isPurchased) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }

        // 2. Fetch Lecture
        const lecture = await prisma.lecture.findFirst({
            where: { id: lectureId, courseId: courseId },
            include: { videoAsset: true }
        });

        if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

        const rawVideoUrl = lecture.videoAsset?.videoUrl || lecture.videoUrl;
        const encryptionKey = lecture.videoAsset?.encryptionKey || lecture.encryptionKey;
        const iv = lecture.videoAsset?.iv || lecture.iv;

        if (!rawVideoUrl || !encryptionKey || !iv) {
            return res.status(404).json({ error: 'Video or encryption data missing' });
        }

        // 3. Perform ECDH Handshake
        const serverECDH = crypto.createECDH('prime256v1');
        const serverPublicKey = serverECDH.generateKeys();

        // 4. Log IP and User Agent for Multi-IP Tracking
        const currentIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (currentIp) {
            await prisma.iPLog.upsert({
                where: { id: `iplog_${userId}_${currentIp}` }, // We'll need a unique constraint or just create a new one
                update: { lastSeen: new Date() },
                create: {
                   // id: `iplog_${userId}_${currentIp}`,
                    userId: userId,
                    ip: currentIp.toString(),
                    userAgent: req.headers['user-agent']
                }
            }).catch(e => {
                // If id constraint fails, just create a new record
                return prisma.iPLog.create({
                    data: {
                        userId: userId,
                        ip: currentIp.toString(),
                        userAgent: req.headers['user-agent']
                    }
                });
            });
        }

        // Compute shared secret using client's public key (hex)
        const sharedSecret = serverECDH.computeSecret(Buffer.from(clientPublicKey, 'hex'));

        // Derive a 256-bit key from shared secret for vault encryption
        const vaultKey = crypto.createHash('sha256').update(sharedSecret).digest();

        // 4. Encrypt the actual Video AES Key using the vaultKey (AES-256-GCM)
        const vaultIv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', vaultKey, vaultIv);
        
        // Prepare the payload (the real AES key and IV)
        const payload = JSON.stringify({
            key: encryptionKey,
            iv: iv
        });

        let encryptedPayload = cipher.update(payload, 'utf8', 'hex');
        encryptedPayload += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        res.json({
            serverPublicKey: serverPublicKey.toString('hex'),
            vaultIv: vaultIv.toString('hex'),
            authTag: authTag,
            encryptedPackage: encryptedPayload
        });

    } catch (error) {
        console.error('Vault Handshake Error:', error);
        res.status(500).json({ error: 'Failed to perform secure handshake' });
    }
});

// POST /api/v1/lms/security/flag
router.post('/security/flag', authenticateJWT, async (req: any, res: Response) => {
    const { type, severity, metadata } = req.body;
    const userId = req.user.id;

    try {
        const flag = await prisma.securityFlag.create({
            data: {
                userId,
                type,
                severity: severity || 'MEDIUM',
                metadata: metadata || {}
            }
        });
        res.json({ success: true, flagId: flag.id });
    } catch (error) {
        console.error('Security Flag Error:', error);
        res.status(500).json({ error: 'Failed to record security incident' });
    }
});

export default router;
