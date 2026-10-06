# ==============================================================================
# Multi-stage Dockerfile for Starlight Notes (Node.js + Express + EJS)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Security: Use unprivileged node user
USER node

# Copy dependencies from builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY --chown=node:node package.json ./
COPY --chown=node:node server.js ./
COPY --chown=node:node views/ ./views/
COPY --chown=node:node public/ ./public/

# Expose server port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "server.js"]
