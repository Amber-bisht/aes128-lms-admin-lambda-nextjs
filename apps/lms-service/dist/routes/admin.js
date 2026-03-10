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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const s3_1 = require("../services/s3");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Use middleware to ensure only admins can access
router.use(auth_1.requireAdmin);
router.get('/courses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const course = yield prisma.course.findUnique({
        where: { id: id },
        include: { lectures: { orderBy: { order: 'asc' } } }
    });
    if (!course)
        return res.status(404).json({ error: 'Course not found' });
    res.json(course);
}));
// Create Course
router.post('/courses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, imageUrl } = req.body;
    try {
        const course = yield prisma.course.create({
            data: {
                title,
                description,
                imageUrl
            }
        });
        res.json(course);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create course' });
    }
}));
// Add Lecture to Course
router.post('/courses/:courseId/lectures', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const { title, videoUrl, order } = req.body; // videoUrl here implies the processed URL or raw? 
    // Actually, usually we start with raw upload, then processing updates it.
    // But for simplicity, we might create the lecture entry first with status pending.
    try {
        const lecture = yield prisma.lecture.create({
            data: {
                title,
                courseId: courseId,
                order: order || 0,
                // videoUrl might be empty initially until processed
            }
        });
        res.json(lecture);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create lecture' });
    }
}));
// Get Upload URL for Video or Image
router.post('/upload-url', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename, contentType, type } = req.body; // type: 'course-image' or 'lecture-video'
    const ext = filename.split('.').pop();
    const key = `${type}s/${(0, uuid_1.v4)()}.${ext}`;
    try {
        const url = yield (0, s3_1.generateUploadUrl)(key, contentType);
        res.json({ url, key });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
}));
exports.default = router;
