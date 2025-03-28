# DegenQuest Server Deployment Guide

This guide provides instructions for setting up and deploying the DegenQuest game server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Deployment](#local-development-deployment)
3. [Production Deployment](#production-deployment)
4. [Monitoring and Maintenance](#monitoring-and-maintenance)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the DegenQuest server, ensure you have:

- Docker and Docker Compose installed
- Git for version control
- Node.js (v16 or higher) for local testing
- MongoDB (optional, for local development without Docker)

## Local Development Deployment

### Using the CLI Tool

The easiest way to manage the DegenQuest server locally is using the provided CLI tool:

```bash
# Display available commands
./cli.sh help

# Start the server
./cli.sh start

# Check server status
./cli.sh status

# View logs
./cli.sh logs

# Stop the server
./cli.sh stop
```

### Manual Setup

If you prefer to set up manually:

1. Navigate to the docker directory:
   ```bash
   cd docker
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   # Edit the .env file with your settings
   ```

3. Start the Docker containers:
   ```bash
   docker-compose up -d
   ```

4. Test the connection:
   ```bash
   ./test-connection.sh
   ```

## Production Deployment

For production environments, follow these additional steps:

### Server Requirements

- Recommended: 4 CPU cores, 8GB RAM
- Storage: At least 20GB SSD
- Operating System: Ubuntu 20.04 LTS or later
- Ports: 80, 443, 2567 open in firewall

### Setup Steps

1. Clone the repository on your production server:
   ```bash
   git clone https://github.com/yourusername/DegenQuest.git
   cd DegenQuest
   ```

2. Create a production-ready environment file:
   ```bash
   cd docker
   cp .env.example .env.production
   # Edit the .env.production file with production settings
   ```

3. Set up SSL/TLS (required for production):
   - Obtain SSL certificates for your domain
   - Place them in the `docker/certs` directory
   - Update the Docker Compose configuration to use SSL

4. Start the production environment:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

5. Set up monitoring (optional but recommended):
   ```bash
   # Set up Prometheus and Grafana for monitoring
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
   ```

### Scaling

For larger player bases, consider:

1. Setting up a load balancer (e.g., Nginx, HAProxy)
2. Creating a MongoDB replica set
3. Implementing horizontal scaling with multiple game server instances

## Monitoring and Maintenance

### Regular Maintenance

1. Database Backups:
   ```bash
   # Create a backup
   ./cli.sh backup
   
   # Restore from backup if needed
   ./cli.sh restore
   ```

2. System Updates:
   ```bash
   # Pull latest changes
   git pull
   
   # Rebuild and restart containers
   cd docker
   docker-compose up -d --build
   ```

3. Log Rotation:
   - Configure log rotation for Docker containers
   - Set up automated log archiving for long-term storage

### Health Monitoring

- The server exposes a health endpoint at `/health` that can be used for monitoring
- Set up external monitoring to check this endpoint regularly
- Configure alerts for server downtime or performance issues

## Troubleshooting

### Common Issues

1. **Server Won't Start:**
   - Check Docker logs: `docker-compose logs`
   - Ensure all ports are available
   - Verify environment variables are set correctly

2. **Database Connection Issues:**
   - Check MongoDB container is running: `docker ps | grep mongodb`
   - Verify connection string in environment file
   - Check network connectivity between containers

3. **Performance Problems:**
   - Monitor resource usage: `docker stats`
   - Check for memory leaks or high CPU usage
   - Ensure database indexes are properly set up

4. **Client Connection Issues:**
   - Verify firewall settings allow connections on port 2567
   - Check SSL/TLS configuration if using secure connections
   - Ensure client is using correct server address

### Getting Help

If you encounter persistent issues:

1. Check the GitHub repository for known issues
2. Join our Discord community for support
3. Create a detailed bug report if necessary

---

This deployment guide will be updated as the DegenQuest server evolves.
Last updated: June 2023 