
# Base stage
FROM node:18-alpine AS base

# Builder stage
FROM base AS builder
WORKDIR /app
# Copy root package.json and lockfile (if existing)
COPY package*.json ./
# Copy workspace packages
COPY apps/api/package*.json ./apps/api/
# Install dependencies
RUN npm install
# Copy source code
COPY apps/api ./apps/api
# Build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx tsc

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["node", "dist/index.js"]
