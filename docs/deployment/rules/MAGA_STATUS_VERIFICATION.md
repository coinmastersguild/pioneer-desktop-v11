# MAGA Status Verification Guide

## Overview

The Master Always Green Approach (MAGA) is a workflow philosophy that ensures the `master` branch is always in a stable, deployable state. This guide outlines the procedures for verifying MAGA compliance and explains the verification scripts provided in this repository.

## Why MAGA Status Verification Matters

- **Prevents Broken Deployments**: By verifying service health before merging to master, we prevent broken code from affecting players
- **Reduces Downtime**: Early detection of deployment issues helps maintain service availability
- **Increases Developer Confidence**: When all health checks pass, developers can be confident that their changes won't disrupt the game
- **Supports Continuous Delivery**: Reliable health verification enables more frequent and safer deployments

## Verification Scripts

Two primary scripts are provided for MAGA verification:

1. **verify-deployment-health.sh**: Checks the health of individual deployments
2. **validate-maga-workflow.sh**: Performs comprehensive MAGA compliance checks

### verify-deployment-health.sh

This script performs comprehensive health checks on a specified deployment:

```bash
./scripts/verify-deployment-health.sh [service_name] [environment]
```

**Features:**
- Verifies Kubernetes deployment status (replicas are ready)
- Checks for service availability and ingress IPs
- Tests TCP connectivity to the service
- Validates the HTTP health endpoint
- Verifies WebSocket connectivity (for game servers)
- Collects and displays detailed health information

**Example:**
```bash
./scripts/verify-deployment-health.sh game-server production
```

### validate-maga-workflow.sh

This script validates overall MAGA workflow compliance:

```bash
./scripts/validate-maga-workflow.sh [branch]
```

**Features:**
- Checks CircleCI build status
- Verifies all deployments are healthy
- Tests client connectivity to services
- Validates API response schemas
- Generates a MAGA status report

**Example:**
```bash
./scripts/validate-maga-workflow.sh master
```

## Health Endpoint Requirements

All services should implement a `/health` endpoint that returns a JSON response with the following structure:

```json
{
  "status": "UP",
  "version": "1.0.0",
  "uptime": 3600,
  "components": {
    "database": {
      "status": "UP"
    },
    "externalApi": {
      "status": "UP"
    }
  }
}
```

The status field should be one of:
- `UP`: The service is fully operational
- `DEGRADED`: The service is operational but with limited functionality
- `DOWN`: The service is not operational

## MAGA Compliance Checklist

- [ ] CircleCI build passes on the branch
- [ ] All deployments are healthy (all replicas ready)
- [ ] Services are accessible via their expected endpoints
- [ ] API responses match expected schemas
- [ ] Health endpoints return valid responses
- [ ] WebSocket connections can be established (for game servers)
- [ ] Client can properly connect to all services
- [ ] Game sessions can be created and joined

## Resolving MAGA Verification Failures

### Build Failures
1. Check CircleCI logs for specific errors
2. Fix failing tests or build issues
3. Push changes and verify build passes

### Deployment Health Issues
1. Check deployment logs: `kubectl logs deployment/[deployment-name]`
2. Verify container health: `kubectl describe pod [pod-name]`
3. Check resource constraints: `kubectl describe deployment [deployment-name]`
4. Verify configuration values: `kubectl get configmap [config-name] -o yaml`

### Connectivity Issues
1. Verify service configuration: `kubectl get service [service-name]`
2. Check firewall rules and network policies
3. Verify DNS resolution if applicable
4. Test connectivity from within the cluster: `kubectl run curl --image=curlimages/curl -i --rm --restart=Never -- curl [service-url]`

### API Schema Issues
1. Verify API endpoint implementation
2. Check for schema changes or version mismatches
3. Update validation to match current schema if changed intentionally

## Integration With Workflow

### Pre-Merge Verification
Before merging to `master`:
1. Run MAGA validation on your feature branch
2. Ensure all checks pass
3. Include MAGA validation results in PR description

### Post-Deployment Verification
After deploying to production:
1. Run MAGA validation on `master`
2. Verify all services are healthy
3. Log the verification results for audit purposes

## Conclusion

MAGA status verification is a critical component of our development workflow. By ensuring all services are healthy and accessible before merging to master, we maintain a stable and reliable gaming experience for our users.

Remember: **A green build doesn't mean a working deployment**. Always verify service health before considering work complete. 