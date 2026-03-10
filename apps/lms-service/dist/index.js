"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Adjust for production
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const courses_1 = __importDefault(require("./routes/courses"));
const videos_1 = __importDefault(require("./routes/videos"));
app.use('/auth', auth_1.default);
app.use('/admin', admin_1.default);
app.use('/courses', courses_1.default);
app.use('/api/videos', videos_1.default); // Match the path used in processor.ts
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api' });
});
app.listen(PORT, () => {
    console.log(`API Gateway service running on port ${PORT}`);
});
