# Production-ready Dockerfile for General Store Backend API
# Multi-stage build to minimize image size

# ============================================================================
# Stage 1: Build Stage
# ============================================================================
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY .env.example ./

# ============================================================================
# Stage 2: Runtime Stage
# ============================================================================
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Create uploads directory with proper permissions
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Copy from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src/ ./src/
COPY --chown=nodejs:nodejs .env.example .env.example
COPY --chown=nodejs:nodejs package.json package-lock.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { if (res.statusCode !== 200) throw new Error(res.statusCode) })"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/server.js"]
