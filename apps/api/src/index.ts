
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
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
    res.json({ status: 'ok', service: 'api' });
});

app.listen(PORT, () => {
    console.log(`API Gateway service running on port ${PORT}`);
});
