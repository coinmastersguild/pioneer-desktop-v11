# Guild Deployment Protocol (MAGA)

## Overview

This document defines the Guild's official MAGA deployment protocol for all services, including the KeepKey Support Email application. This protocol ensures consistent, high-quality deployments across all Guild projects.

**Protocol ID**: MAGA-DEPLOY-001  
**Version**: 1.0  
**Status**: Active  
**Last Updated**: 2025-03-24

## Guiding Principles

1. **M**ultiple environment validation before production
2. **A**utomated testing at each stage
3. **G**radual promotion through environments
4. **A**uditable and consistent processes

## Branch Strategy

### Branch Structure

- `feature/*` - Feature branches for individual development
- `develop` - Integration branch for testing
- `master` - Production-ready code

### Branch Rules

1. **NEVER** push directly to `develop` or `master`
2. **ALWAYS** create feature branches from `develop`
3. **ALWAYS** merge to `develop` via pull request with review
4. **ALWAYS** merge to `master` via pull request with approval

## Deployment Flow

### 1. Local Development

1. Developer creates feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/new-feature
   ```

2. Developer implements and tests locally:
   ```bash
   npm run build
   npm run test
   npm run start
   ```

3. Developer verifies health endpoint locally:
   ```bash
   curl http://localhost:3000/health
   ```
   - Must include status and version per Guild standard
   - Must return in under 100ms

### 2. Pull Request to Develop

1. Developer pushes feature branch and creates PR to `develop`:
   ```bash
   git push -u origin feature/new-feature
   # Create PR via GitHub interface
   ```

2. Web-based PR review by operator:
   - Code quality review
   - Test coverage verification
   - Documentation updates

3. PR checks:
   - Automated linting must pass
   - Unit tests must pass
   - Integration tests must pass

### 3. Develop Environment Testing

After PR is approved and merged to `develop`:

1. CircleCI automatically builds Docker image:
   ```
   registry.digitalocean.com/keepkey/support-email:${GIT_SHA}-dev
   ```

2. CircleCI deploys to development environment:
   ```bash
   kubectl -n keepkey rollout restart deployment/support-email
   ```

3. E2E tests run against **real DNS name**:
   ```bash
   npm run test:e2e:dev -- --url https://dev.support-email.keepkey.com
   ```

4. Health endpoint verification:
   ```bash
   curl https://dev.support-email.keepkey.com/health
   ```

### 4. Feature Environment Testing

1. CircleCI creates feature-specific environment:
   ```bash
   kubectl -n keepkey-feature create deployment support-email-${BRANCH_NAME}
   ```

2. E2E tests run against feature environment:
   ```bash
   npm run test:e2e:feature -- --url https://${BRANCH_NAME}.support-email.keepkey.com
   ```

3. Feature-specific tests are executed and must pass

### 5. Production Deployment

Only after all previous stages are successful:

1. PR from `develop` to `master` with approval
2. CircleCI builds production image:
   ```
   registry.digitalocean.com/keepkey/support-email:${GIT_SHA}-production
   ```

3. CircleCI deploys to production:
   ```bash
   kubectl -n keepkey-prod rollout restart deployment/support-email
   ```

4. Production health verification:
   ```bash
   curl https://support-email.keepkey.com/health
   ```

5. Production E2E tests:
   ```bash
   npm run test:e2e:prod
   ```

## Environment Configuration

Each environment must have:

1. **Unique DNS name**:
   - Development: dev.support-email.keepkey.com
   - Feature branches: [branch-name].support-email.keepkey.com
   - Production: support-email.keepkey.com

2. **Separate Kubernetes namespace**:
   - Development: `keepkey`
   - Feature branches: `keepkey-feature`
   - Production: `keepkey-prod`

3. **Environment-specific configuration**:
   - Feature environments are near-production replicas
   - Production uses increased replicas and resources

## Health Endpoint Protocol

All services **MUST** implement a `/health` endpoint that:

1. Returns HTTP 200 when healthy
2. Includes version number matching the deployment
3. Returns quickly (< 100ms)
4. Reports actual subsystem status

Example:
```json
{
  "status": "ok",
  "version": "1.2.345",
  "timestamp": "2025-03-24T14:34:10Z"
}
```

## Process Management Protocol

All services **MUST** use PM2 for process management:

1. Proper daemon process configuration
2. Graceful shutdown handling
3. Process monitoring and restart on failure
4. Log rotation

## Metrics and Monitoring

1. Cycle times **MUST** be recorded in `docs/metrics/cycle-times.md`
2. Health endpoints **MUST** be monitored in production
3. Deployment success rates **MUST** be tracked

## Security Protocols

1. Credentials **NEVER** stored in repositories
2. Environment variables **ALWAYS** used for secrets
3. Container images **ALWAYS** scanned for vulnerabilities

## Compliance Requirements

All deployments **MUST**:

1. Include documented rollback procedures
2. Follow least-privilege principle
3. Use consistent tagging and labeling
4. Be fully auditable

## Related Documentation

- [CircleCI Setup Guide](/docs/deployment/circleci-setup.md)
- [Kubernetes Configuration](/docs/deployment/kubernetes-config.md)
- [Health Endpoint Implementation Guide](/docs/deployment/health-endpoint-guide.md)
- [Cycle Time Optimization Guide](/docs/deployment/cycle-time-guide.md)
