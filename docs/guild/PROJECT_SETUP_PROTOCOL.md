# Guild Project Setup Protocol

**Protocol ID**: GUILD-SETUP-001  
**Version**: 1.0  
**Status**: Active  
**Last Updated**: 2025-03-25

## Overview

This document defines the Guild's official protocol for project setup and deployment workflow. It provides comprehensive guidance for establishing new projects and aligning existing projects with Guild standards, with specific emphasis on deployment scripts and environment progression.

## Core Principles

1. **Environment Progression Direction**
   - **NOT_IN_PRODUCTION**: Focus on "forward progression" (Local → Docker → Dev → Feature → Prod)
   - **IN_PRODUCTION**: Focus on "backward protection" (Prod → Feature → Dev → Docker → Local)

2. **MAGA Protocol Integration**
   - All deployments must follow Master Always Green Approach (MAGA)
   - Status verification required at all stages
   - Health endpoints mandatory for all services

3. **Deployment Script Standardization**
   - Consistent script structure across projects
   - Automated verification at each stage
   - Status reporting compliance

## Project Setup Phases

### Phase 1: Architecture Documentation

1. **Required Documentation**
   - `docs/architecture/overview.md`: System components, service interactions
   - `docs/architecture/port-assignments.md`: Service port definitions
   - `docs/deployment/status-dashboard.md`: Environment status tracking

2. **Port Assignment Guidelines**
   - Assign dedicated port ranges per service type
   - Document in architecture with clear service names
   - Follow Guild port allocation standards
   - Ensure health endpoints on all services

3. **README Requirements**
   - Architecture summary (max 100 words)
   - Port assignments table
   - Setup instructions for all environments
   - Health check information
   - Deployment script usage

### Phase 2: Deployment Script Implementation

1. **Script Directory Structure**
```
scripts/
  ├── deploy/
  │   ├── deploy-local.js     # Local deployment script
  │   ├── deploy-docker.js    # Docker deployment script
  │   ├── deploy-dev.js       # Development environment script
  │   ├── deploy-feature.js   # Feature environment script
  │   └── deploy-prod.js      # Production deployment script
  ├── verify/
  │   ├── verify-health.js    # Health verification script
  │   ├── verify-maga.js      # MAGA compliance verification
  │   └── verify-status.js    # Status verification script
  └── util/
      ├── generate-report.js  # Status report generator
      └── log-utils.js        # Logging utilities
```

2. **Package.json Script Configuration**
```json
{
  "scripts": {
    "deploy:local": "node scripts/deploy/deploy-local.js",
    "deploy:docker": "node scripts/deploy/deploy-docker.js",
    "deploy:dev": "node scripts/deploy/deploy-dev.js",
    "deploy:feature": "node scripts/deploy/deploy-feature.js",
    "deploy:prod": "node scripts/deploy/deploy-prod.js",
    "verify:health": "node scripts/verify/verify-health.js",
    "verify:maga": "node scripts/verify/verify-maga.js",
    "status": "node scripts/verify/verify-status.js",
    "status:report": "node scripts/util/generate-report.js"
  }
}
```

3. **Local Deployment Script Requirements (deploy-local.js)**
   - Build all services (`npm run build`)
   - Run all tests (`npm test`)
   - Start services in correct order
   - Verify health endpoints for each service
   - Generate status report
   - Update status dashboard
   - Must exit with code 0 only if all steps succeed

4. **Docker Deployment Script Requirements (deploy-docker.js)**
   - Build Docker images for all services
   - Run Docker-specific tests
   - Start containers with proper networking
   - Verify health endpoints
   - Generate status report
   - Must fail if any service is unhealthy

### Phase 3: Verification Script Implementation

1. **Health Verification Script (verify-health.js)**
   - Check all service health endpoints
   - Validate response format and content
   - Verify response times meet requirements
   - Report individual and overall health status
   - Exit with appropriate code based on health

2. **MAGA Verification Script (verify-maga.js)**
   - Check all environment statuses
   - Verify deployment progression
   - Validate against MAGA requirements
   - Generate MAGA compliance report
   - Exit with appropriate code based on compliance

3. **Status Reporting Script (verify-status.js)**
   - Check status of all environments
   - Generate color-coded status report
   - Update status dashboard document
   - Follow Guild status visualization standards
   - Push status updates to monitoring system

## Deployment Workflow by Project State

### NOT_IN_PRODUCTION State Workflow

When a project has NOT been deployed to production:

1. **Local First Approach**
   - Local environment must always be GREEN
   - Focus on moving forward in the pipeline
   - Deploy in sequence: Local → Docker → Dev → Feature → Prod
   - Each environment must be GREEN before proceeding to next

2. **Deployment Script Usage**
   ```bash
   # Start with local deployment
   npm run deploy:local
   
   # If successful, proceed to Docker
   npm run deploy:docker
   
   # Continue through environments
   npm run deploy:dev
   npm run deploy:feature
   
   # Only when all previous are GREEN:
   npm run deploy:prod
   ```

3. **Verification Process**
   - After each deployment, run verification:
   ```bash
   npm run verify:health
   npm run verify:maga
   npm run status
   ```
   - Address any RED or YELLOW statuses before proceeding

### IN_PRODUCTION State Workflow

When a project HAS been deployed to production:

1. **Production First Approach**
   - Production environment must always be GREEN
   - Focus on backward protection
   - Fix issues in reverse order: Prod → Feature → Dev → Docker → Local
   - ALL environments must be GREEN before new feature work

2. **Issue Resolution Flow**
   - Identify and fix production issues first
   - Cascade fixes backwards to all environments
   - Verify all environments after each fix
   - Only proceed with new development when all GREEN

3. **New Feature Development**
   - Only begin when all environments are GREEN
   - Start in Local environment
   - Progress through environments only when previous is GREEN
   - Use Feature environments for parallel development

## Health Endpoint Requirements

All services **MUST** implement a `/health` endpoint that:

1. Returns HTTP 200 when healthy
2. Includes version number matching the deployment
3. Returns within 500ms maximum response time
4. Reports actual subsystem status

**Required Response Structure:**
```json
{
  "status": "healthy" | "unhealthy",
  "version": "1.0.0",
  "timestamp": "2025-03-25T12:00:00Z",
  "env": "development" | "staging" | "production"
}
```

## Status Dashboard Requirements

The status dashboard must:

1. Show status of ALL environments (not just production)
2. Use consistent color coding:
   - 🟢 GREEN: Fully functional and tested
   - 🟡 YELLOW: Partially functional or tests pending
   - 🔴 RED: Non-functional or not configured

3. Include visualization of deployment pipeline direction
4. Track recent status changes with date and details
5. Be automatically updated at start and end of each sprint

## Implementation Timeline

For new projects, this setup should be completed in Sprint 1:

| Day | Focus | Tasks |
|-----|-------|-------|
| 1-2 | Documentation | Architecture, README, port assignments |
| 3-4 | Deployment Scripts | Create script structure, implement local deployment |
| 5 | Verification | Test scripts, verify functionality |

## Compliance Verification

To verify compliance with this protocol:

1. Check for presence of all required documentation
2. Verify deployment script functionality
3. Test health endpoints on all services
4. Validate status reporting accuracy
5. Confirm proper workflow based on project state

## Related Documentation

- [Guild Deployment Protocol](/docs/guild/DEPLOYMENT_PROTOCOL.md)
- [MAGA Status Verification](/docs/deployment/rules/MAGA_STATUS_VERIFICATION.md)
- [Project State Guide](/docs/guild/PROJECT_STATE_GUIDE.md)
