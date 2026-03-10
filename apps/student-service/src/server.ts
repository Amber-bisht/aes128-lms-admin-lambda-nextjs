
import express, { Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from './middleware/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.STUDENT_SERVICE_PORT || 4001;

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'Student Service is healthy' });
});

// Create Order for a Course
app.post('/payments/create-order', authenticateJWT, async (req: AuthRequest, res: Response) => {
    const { courseId } = req.body;

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId as string } });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const options = {
            amount: Math.round(course.price * 100),
            currency: "INR",
            receipt: `rcpt_${courseId.substring(0, 10)}_${req.user.id.substring(0, 10)}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// Verify Payment Signature
app.post('/payments/verify-payment', authenticateJWT, async (req: AuthRequest, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
        try {
            await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    courses: {
                        connect: { id: courseId as string }
                    }
                }
            });
            res.json({ success: true, message: 'Payment verified and enrollment successful' });
        } catch (error) {
            console.error('Enrollment Error:', error);
            res.status(500).json({ error: 'Payment verified but enrollment failed' });
        }
    } else {
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
});

app.listen(PORT, () => {
    console.log(`Student Service running on port ${PORT}`);
});
