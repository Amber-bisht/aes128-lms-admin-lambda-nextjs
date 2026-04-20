"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const cloudfront_1 = require("../services/cloudfront");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// All routes require login
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const extractKey = (urlStr) => {
    try {
        const url = new URL(urlStr);
        return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    }
    catch (e) {
        return urlStr;
    }
};
// GET all active courses - Public with Optional Auth
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    let userId = null;
    // Optional JWT verification
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        catch (e) {
            // Invalid token, treat as public
        }
    }
    try {
        const courses = yield prisma.course.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        // If user is logged in, mark purchased courses
        let purchasedCourseIds = [];
        let isAdmin = false;
        if (userId) {
            const user = yield prisma.user.findUnique({
                where: { id: userId },
                include: { courses: { select: { id: true } } }
            });
            purchasedCourseIds = (user === null || user === void 0 ? void 0 : user.courses.map(c => c.id)) || [];
            isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
        }
        const signedCourses = courses.map(course => (Object.assign(Object.assign({}, course), { imageUrl: course.imageUrl ? (0, cloudfront_1.getSignedVideoUrl)(extractKey(course.imageUrl), 604800) : course.imageUrl, purchased: isAdmin || purchasedCourseIds.includes(course.id) })));
        res.json(signedCourses);
    }
    catch (error) {
        console.error('Fetch All Courses Error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
}));
// GET purchased courses for logged in user
router.get('/purchased', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                courses: {
                    where: { active: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const signedCourses = user.courses.map(course => (Object.assign(Object.assign({}, course), { imageUrl: course.imageUrl ? (0, cloudfront_1.getSignedVideoUrl)(extractKey(course.imageUrl), 604800) : course.imageUrl })));
        res.json(signedCourses);
    }
    catch (error) {
        console.error('Fetch Purchased Courses Error:', error);
        res.status(500).json({ error: 'Failed to fetch enrolled courses' });
    }
}));
// GET course by ID or Slug - Optional Auth
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    let userId = null;
    // Optional JWT verification
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        catch (e) {
            // Invalid token, treat as public
        }
    }
    try {
        const course = yield prisma.course.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
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
        if (!course)
            return res.status(404).json({ error: 'Course not found' });
        // Sign the main course image
        if (course.imageUrl) {
            course.imageUrl = (0, cloudfront_1.getSignedVideoUrl)(extractKey(course.imageUrl), 604800);
        }
        // Check if user is enrolled or is admin
        let isPurchased = false;
        if (userId) {
            const user = yield prisma.user.findUnique({
                where: { id: userId },
                include: {
                    courses: { where: { id: course.id } }
                }
            });
            isPurchased = ((user === null || user === void 0 ? void 0 : user.courses.length) || 0) > 0 || (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
        }
        // Return course and limited lecture metadata
        res.json(Object.assign(Object.assign({}, course), { purchased: isPurchased }));
    }
    catch (error) {
        console.error('Fetch Course Error:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
}));
// GET /api/v1/lms/courses/:courseId/lectures/:lectureId/play-info
router.get('/:courseId/lectures/:lectureId/play-info', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { courseId, lectureId } = req.params;
    const userId = req.user.id;
    try {
        // 1. Verify Enrollment
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            include: {
                courses: { where: { id: courseId } }
            }
        });
        const isPurchased = ((user === null || user === void 0 ? void 0 : user.courses.length) || 0) > 0 || (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
        if (!isPurchased) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }
        // 2. Fetch Lecture with Video Asset
        const lecture = yield prisma.lecture.findFirst({
            where: {
                id: lectureId,
                courseId: courseId
            },
            include: { videoAsset: true }
        });
        if (!lecture)
            return res.status(404).json({ error: 'Lecture not found' });
        const rawVideoUrl = ((_a = lecture.videoAsset) === null || _a === void 0 ? void 0 : _a.videoUrl) || lecture.videoUrl;
        if (!rawVideoUrl)
            return res.status(404).json({ error: 'Video not found for this lecture' });
        // 3. Sign Video URL
        let key = rawVideoUrl;
        try {
            const url = new URL(rawVideoUrl);
            key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            if (key.startsWith('lms.amberbisht/'))
                key = key.replace('lms.amberbisht/', '');
        }
        catch (e) { }
        const signedUrl = (0, cloudfront_1.getSignedVideoUrl)(key);
        res.json({
            videoUrl: signedUrl,
            encryptionKey: ((_b = lecture.videoAsset) === null || _b === void 0 ? void 0 : _b.encryptionKey) || lecture.encryptionKey,
            iv: ((_c = lecture.videoAsset) === null || _c === void 0 ? void 0 : _c.iv) || lecture.iv
        });
    }
    catch (error) {
        console.error('Play Info Error:', error);
        res.status(500).json({ error: 'Failed to fetch play information' });
    }
}));
// POST /api/v1/lms/courses/:courseId/lectures/:lectureId/vault-handshake
router.post('/:courseId/lectures/:lectureId/vault-handshake', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { courseId, lectureId } = req.params;
    const { clientPublicKey } = req.body;
    const userId = req.user.id;
    if (!clientPublicKey) {
        return res.status(400).json({ error: 'Client public key is required' });
    }
    try {
        // 1. Verify Enrollment
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            include: {
                courses: { where: { id: courseId } }
            }
        });
        const isPurchased = ((user === null || user === void 0 ? void 0 : user.courses.length) || 0) > 0 || (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
        if (!isPurchased) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }
        // 2. Fetch Lecture
        const lecture = yield prisma.lecture.findFirst({
            where: { id: lectureId, courseId: courseId },
            include: { videoAsset: true }
        });
        if (!lecture)
            return res.status(404).json({ error: 'Lecture not found' });
        const rawVideoUrl = ((_a = lecture.videoAsset) === null || _a === void 0 ? void 0 : _a.videoUrl) || lecture.videoUrl;
        const encryptionKey = ((_b = lecture.videoAsset) === null || _b === void 0 ? void 0 : _b.encryptionKey) || lecture.encryptionKey;
        const iv = ((_c = lecture.videoAsset) === null || _c === void 0 ? void 0 : _c.iv) || lecture.iv;
        if (!rawVideoUrl || !encryptionKey || !iv) {
            return res.status(404).json({ error: 'Video or encryption data missing' });
        }
        // 3. Perform ECDH Handshake
        const serverECDH = crypto_1.default.createECDH('prime256v1');
        const serverPublicKey = serverECDH.generateKeys();
        // 4. Log IP and User Agent for Multi-IP Tracking
        const currentIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (currentIp) {
            yield prisma.iPLog.upsert({
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
        const vaultKey = crypto_1.default.createHash('sha256').update(sharedSecret).digest();
        // 4. Encrypt the actual Video AES Key using the vaultKey (AES-256-GCM)
        const vaultIv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', vaultKey, vaultIv);
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
    }
    catch (error) {
        console.error('Vault Handshake Error:', error);
        res.status(500).json({ error: 'Failed to perform secure handshake' });
    }
}));
// POST /api/v1/lms/security/flag
router.post('/security/flag', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, severity, metadata } = req.body;
    const userId = req.user.id;
    try {
        const flag = yield prisma.securityFlag.create({
            data: {
                userId,
                type,
                severity: severity || 'MEDIUM',
                metadata: metadata || {}
            }
        });
        res.json({ success: true, flagId: flag.id });
    }
    catch (error) {
        console.error('Security Flag Error:', error);
        res.status(500).json({ error: 'Failed to record security incident' });
    }
}));
exports.default = router;
