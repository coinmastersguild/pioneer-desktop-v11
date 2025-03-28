# Dockerfile Reference for KeepKey Support Email

## Overview

This document provides a reference for the Dockerfile used in the KeepKey Support Email application. The Dockerfile is designed to create a lightweight, secure, and fast container image for production deployment.

## Base Image

We use the official Node.js Alpine image as our base to minimize container size:

```dockerfile
FROM node:18-alpine
```

## Structure

### 1. Operating System Dependencies

```dockerfile
# Install OS dependencies
RUN apk add --no-cache tini curl
```

- `tini`: Proper init process for containers
- `curl`: Used for health checks during deployment verification

### 2. Application Setup

```dockerfile
# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build
```

This approach:
- Leverages Docker layer caching by separating dependency installation from code changes
- Uses `npm ci` for reproducible installations
- Only includes production dependencies

### 3. Runtime Configuration

```dockerfile
# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use non-root user for security
USER node

# Expose application port
EXPOSE 3000

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application using PM2
CMD ["node", "dist/index.js"]
```

Key features:
- Runs as non-root user for security
- Uses tini as init process
- Explicitly defines exposed ports

## Build Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Application port | `3000` |

## Health Check

The Dockerfile includes a health check that verifies the application is responding:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

This health check:
- Runs every 30 seconds
- Checks the application's health endpoint
- Verifies version number is included in response (per Guild protocol)

## Best Practices

1. Keep the image as small as possible
2. Avoid installing unnecessary packages
3. Use multi-stage builds for complex applications
4. Never store secrets in the Dockerfile
5. Set proper permissions for files and directories

## Related Documentation

- [KKSE-CD Process](/docs/deployment/processes/KKSE-CD-process.md)
- [CircleCI Setup Guide](/docs/deployment/circleci-setup.md)
- [Kubernetes Configuration](/docs/deployment/kubernetes-config.md)
