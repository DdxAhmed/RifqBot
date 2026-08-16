# Production Dockerfile for RIFQ (Bot & Worker)
FROM node:20-alpine AS base

# Install openssl for Prisma runtime compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and Prisma schema first for layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev && npx prisma generate

# Copy application source code
COPY src ./src

# Use non-root node user
USER node

ENV NODE_ENV=production

# Default command runs the bot (can be overridden in docker-compose for worker)
CMD ["npm", "run", "start:bot"]
