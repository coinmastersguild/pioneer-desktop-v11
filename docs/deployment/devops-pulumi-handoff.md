# DevOps Pulumi Handoff Documentation

This document provides the necessary information for DevOps to add the KeepKey Support Email service to Pulumi for Kubernetes deployment.

## Service Overview

**Service Name**: keepkey-support-email  
**Service Type**: Background Node.js worker (no ingress required)  
**Environment**: Development (Pre-Production State)

## Container Image

**Registry**: Digital Ocean Container Registry  
**Image URL**: `registry.digitalocean.com/keepkey/support-email:latest-dev`  
**Image Update Strategy**: CircleCI automatically builds and pushes on commits to `develop` branch

## Container Specifications

### Resource Requirements

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Port Configuration

```yaml
ports:
  - containerPort: 5001
    name: http
```

### Environment Variables

```yaml
env:
  - name: NODE_ENV
    value: "production"
  - name: PORT
    value: "5001"
  - name: LOG_LEVEL
    value: "info"
```

### Secrets Required

The following secrets should be mounted as environment variables:

```yaml
envFrom:
  - secretRef:
      name: keepkey-support-email-secrets
```

Required secret keys:
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_ACCESS_TOKEN`

## Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5001
  initialDelaySeconds: 30
  periodSeconds: 60
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 5001
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 2
```

## Deployment Strategy

- Deployment Type: Deployment (not StatefulSet)
- Replicas: 1 (single instance is sufficient)
- Update Strategy: RollingUpdate
- No Ingress Required: This service does not need to be accessible from outside the cluster

## Service Dependencies

This service requires access to:
- Gmail API (external)
- No internal dependencies on other services

## Additional Configuration

- No persistent volume required
- No configMaps required
- No special security context or custom capabilities needed
- Standard kubernetes.io/dockerconfigjson secret for registry access

## Verification Steps

After deployment:

1. Check pod logs for successful startup:
   ```
   kubectl logs -n keepkey-dev deployment/keepkey-support-email
   ```

2. Verify the health endpoint is responding:
   ```
   kubectl exec -n keepkey-dev deployment/keepkey-support-email -- curl -s http://localhost:5001/health
   ```

## Notes for DevOps

1. This service does NOT require ingress configuration
2. Service is maintained by the KeepKey Team
3. Repository URL: `github.com/keepkey/keepkey-support-email`
4. CircleCI project: `keepkey/keepkey-support-email`

## Contact Information

For questions about this service integration, please contact:
- KeepKey Engineering Team
