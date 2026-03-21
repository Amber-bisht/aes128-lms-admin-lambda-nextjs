
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 5004;

app.use(cors());

// Simple JWT Auth Middleware
const authenticateJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        // Allow unauthenticated requests for now, let services decide
        next();
    }
};

// Route mapping
const ROUTES = [
    {
        url: '/api/v1/lms', // Content/Admin
        auth: false,
        proxy: {
            target: process.env.LMS_SERVICE_URL || 'http://localhost:5002',
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/lms`]: '',
            },
        }
    },
    {
        url: '/api/v1/student', // Payments/Enrollment
        auth: false,
        proxy: {
            target: process.env.STUDENT_SERVICE_URL || 'http://localhost:5003',
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1/student`]: '',
            },
        }
    }
];

ROUTES.forEach(route => {
    if (route.auth) {
        app.use(route.url, authenticateJWT, createProxyMiddleware(route.proxy as any));
    } else {
        app.use(route.url, createProxyMiddleware(route.proxy as any));
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Gateway is healthy' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
