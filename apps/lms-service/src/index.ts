import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.set('trust proxy', true); // Trust proxy headers for real client IP
const PORT = process.env.PORT || 5002;

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://lms.amberbisht.me'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import courseRoutes from './routes/courses';
import videoRoutes from './routes/videos';

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/courses', courseRoutes);
app.use('/api/videos', videoRoutes); // Match the path used in processor.ts

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'lms-service' });
});

app.listen(PORT, () => {
    console.log(`API Gateway service running on port ${PORT}`);
});
