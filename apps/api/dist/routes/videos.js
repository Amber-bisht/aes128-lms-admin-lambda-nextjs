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
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Protect all video routes
router.use(auth_1.authenticateJWT);
// GET /api/videos/:id/key
router.get('/:id/key', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // 1. Check if User owns course or is Admin (Access Control)
        // For simplicity, we just check if they are logged in.
        // 2. Fetch Key
        const lecture = yield prisma.lecture.findUnique({
            where: { id: id },
            select: { encryptionKey: true }
        });
        if (!lecture || !lecture.encryptionKey) {
            return res.status(404).send('Key not found');
        }
        // 3. Convert Hex to Binary
        const keyBuffer = Buffer.from(lecture.encryptionKey, 'hex');
        res.write(keyBuffer);
        res.end();
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = router;
