# KKSE-CD: KeepKey Support Email Continuous Deployment Process

## Process Overview

This document defines the continuous deployment process for the KeepKey Support Email application, following the Guild's MAGA deployment protocol.

**Process ID**: KKSE-CD-001  
**Version**: 1.3  
**Created**: 2025-03-24  
**Last Updated**: 2025-03-24  
**Status**: Active  

## Prerequisites

- GitHub repository access with proper branch permissions
- CircleCI account with access to the repository
- DigitalOcean Container Registry access (`DIGITALOCEAN_ACCESS_TOKEN`)
- DigitalOcean Kubernetes cluster access
- Configured DNS for all environments (dev, feature, production)

## Status Tracking

All deployment environments are tracked in the [Deployment Status Tracker](/docs/deployment/status-tracker.md) which serves as the central source of truth for deployment health:

1. **Status must be GREEN** in all environments before promoting to master
2. **Each environment status** is updated automatically and manually:
   - CircleCI updates develop/feature/production environments
   - Developers update local/local-docker environments
3. **Status History** is maintained for audit and troubleshooting

## Branch Strategy

Following Guild protocol:
- Feature development occurs in `feature/*` branches
- Integration testing in `develop` branch
- Production deployment from `master` branch

## Deployment Process Flow

### 1. Local Development (Feature Branch)

1. Developer creates feature branch from `develop`
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/new-feature
   ```

2. Code is developed and tested locally
   - Run tests: `npm run test`
   - Verify locally: `npm run start`
   - Check health endpoint: `curl http://localhost:3000/health`
   - Update status: `./skills/update-status-tracker.sh local GREEN "All tests passing"`

3. Local Docker testing
   ```bash
   npm run docker:build
   npm run docker:run
   curl http://localhost:3000/health
   ./skills/update-status-tracker.sh local-docker GREEN "Container verified with health endpoint"
   ```

### 2. Integration (Develop Branch)

1. Developer creates pull request to `develop`
2. Operator performs web-based code review
3. Upon approval, code is merged to `develop`
4. CircleCI automatically:
   - Builds Docker image tagged with Git SHA
   - Pushes to DigitalOcean Registry
   - Deploys to development environment
   - Runs E2E tests against real DNS name
   - Updates status tracker: `./skills/update-status-tracker.sh develop GREEN "All tests passing"`

### 3. Feature Environment Testing

1. CircleCI creates feature-specific environment
2. Near-production environment with dedicated DNS:
   - `[feature-name].support-email.keepkey.com`
3. E2E tests run against feature environment
4. Results recorded for verification
5. Status tracker updated: `./skills/update-status-tracker.sh feature GREEN "Feature environment healthy"`

### 4. Production Deployment (Master Branch)

1. **ALL ENVIRONMENTS MUST BE GREEN** before PR to master - verified by:
   ```bash
   ./skills/verify-all-green.sh
   ```
2. After successful testing in all previous environments, PR from `develop` to `master`
3. Requires specific operator approval
4. CircleCI:
   - Builds production Docker image
   - Pushes to DigitalOcean Registry with production tag
   - Deploys to production Kubernetes namespace
   ```bash
   kubectl -n keepkey-prod rollout restart deployment/support-email
   ```
5. Production health verification
   ```bash
   curl https://support-email.keepkey.com/health
   ```
6. Production E2E tests run
7. Status tracker updated: `./skills/update-status-tracker.sh production GREEN "Deployed version x.y.z"`

## Verification Process

1. Health endpoint must return:
   ```json
   {
     "status": "ok",
     "version": "x.y.z",
     "timestamp": "ISO-timestamp"
   }
   ```

2. Version number must match expected build version
3. E2E tests must pass in all environments
4. Cycle times are recorded in `docs/metrics/cycle-times.md`
5. All environments must show GREEN in status tracker

## Rollback Procedure

If verification fails:

1. Update status tracker: `./skills/update-status-tracker.sh [environment] RED "Deployment failed"`
2. Identify last known good deployment
3. Rollback to previous version:
   ```bash
   kubectl -n keepkey-prod set image deployment/support-email support-email=registry.digitalocean.com/keepkey/support-email:{PREVIOUS_SHA}-production
   ```
4. Verify rollback was successful
5. Update status tracker: `./skills/update-status-tracker.sh [environment] GREEN "Rolled back to version x.y.z"`

## Environment Configuration

| Environment | Namespace | DNS | Replicas | Status Tracking |
|-------------|-----------|-----|----------|----------------|
| Development | keepkey | dev.support-email.keepkey.com | 2 | Automated |
| Feature | keepkey-feature | [feature].support-email.keepkey.com | 1 | Automated |
| Production | keepkey-prod | support-email.keepkey.com | 3 | Automated |
| Local | N/A | localhost:3000 | N/A | Manual |
| Local Docker | N/A | localhost:3000 | N/A | Manual |

## Related Documentation

- [Guild Deployment Protocol](/docs/guild/DEPLOYMENT_PROTOCOL.md)
- [CircleCI Setup Guide](/docs/deployment/circleci-setup.md)
- [Dockerfile Reference](/docs/deployment/dockerfile-reference.md)
- [Kubernetes Configuration](/docs/deployment/kubernetes-config.md)
- [Deployment Status Tracker](/docs/deployment/status-tracker.md)
