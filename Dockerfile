# Multi-service Production Dockerfile
# Uses Node 22 Alpine (required for native node:sqlite support)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Ensure SQLite data storage directories exist
RUN mkdir -p \
    services/user-service/data \
    services/product-service/data \
    services/order-service/data \
    services/payment-service/data \
    services/notification-service/data

# Environment configuration
ENV NODE_ENV=production

# Expose all microservice and gateway ports
EXPOSE 3000 3001 3002 3003 3004 3005

# Default entrypoint starts all services via orchestrator
# Can be overridden per-service in docker-compose.yml
CMD ["node", "start-all.js"]
