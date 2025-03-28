# Kubernetes Deployment Guide

## Overview

The DegenQuest game server is deployed on DigitalOcean Kubernetes using Pulumi for infrastructure as code. All infrastructure and configuration management must be performed through Pulumi—no local YAML (`.yml`) files should be created or manually deployed.

## Role-Based Access Control

### Developer Access Level
- View deployments, pods, and services
- View logs and monitoring data
- Scale within predefined limits
- Access non-production namespaces

### DevOps Team Access Level
- Full cluster administration
- Manage Pulumi infrastructure
- Configure cluster-wide resources
- Access all namespaces including production

## Deployment Architecture

Key components managed by Pulumi (DevOps team only):

- **degen-server**: Main game server deployment
- **Services**: Exposing deployments via LoadBalancer
- **Infrastructure**: All cluster-wide resources

**Note:** The previous use of Persistent Volume Claims (PVC) for SQLite database persistence has been removed. Future deployment iterations will migrate to a remote database solution.

### Configuration Management

Deployment toggles are managed exclusively through the Pulumi configuration (`deploy/config.ts`) by the DevOps team:

```typescript
export const services = {
    // Enabled services
    DegenServer: true,
    pioneerServer: true,

    // Disabled services
    keepkeySupport: false,
};
```

## Allowed Developer Operations

The following operations are permitted for developers:

### Viewing Deployments
```bash
kubectl get deployments
```

### Checking Pod Status
```bash
kubectl get pods | grep degen-server
```

### Getting Pod Logs
```bash
# Get logs from a specific pod
kubectl logs <pod-name>

# Stream logs from a pod
kubectl logs -f <pod-name>

# Logs with timestamps
kubectl logs --timestamps=true <pod-name>
```

### Monitoring Resources
```bash
# View resource usage
kubectl top pods
kubectl describe pod <pod-name> | grep -A 10 "Resources"
```

## DevOps-Only Operations

The following operations are restricted to the DevOps team:

### Infrastructure Changes
```bash
# Infrastructure updates through Pulumi
cd deploy
pulumi update
```

### Deployment Management
```bash
# Scaling deployments
kubectl scale deployment <deployment-name> --replicas=<count>

# Rolling restarts
kubectl rollout restart deployment <deployment-name>
```

### Configuration Updates
```bash
# Update ConfigMaps
kubectl edit configmap <config-name>

# Secret management
kubectl edit secret <secret-name>
```

## Debug and Troubleshooting

### Developer-Level Debugging
1. Check application logs
2. Monitor resource usage
3. Verify service health
4. Report issues to DevOps

### DevOps-Level Debugging
1. Access cluster-level logs
2. Modify infrastructure
3. Update configurations
4. Manage cluster state

## Deployment Process

### Developer Responsibilities
1. Build and push images to DigitalOcean Registry
2. Monitor deployment health
3. Report issues to DevOps
4. Document application changes

### DevOps Team Responsibilities
1. Manage Pulumi infrastructure
2. Review and approve changes
3. Handle production deployments
4. Maintain cluster health

## Environment Differences

Consider:
- Persistent storage differences
- Network latency
- Container resources
- Environment variables

## Performance Monitoring

### Developer Access
- View application metrics
- Monitor pod health
- Check resource usage
- Report performance issues

### DevOps Access
- Configure monitoring tools
- Set up alerts
- Manage resource quotas
- Optimize cluster performance

This guide ensures consistent infrastructure management using Pulumi, eliminating manual YAML file creation or local deployments. Always consult the DevOps team for infrastructure changes.

