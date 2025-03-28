# Kubernetes Configuration for KeepKey Support Email

## Overview

This document outlines the Kubernetes configuration for the KeepKey Support Email application deployed to DigitalOcean Kubernetes. The deployment is managed through CircleCI with direct Kubernetes commands for deployment management.

## Namespace and Environment Separation

The application runs in dedicated namespaces to isolate environments:

- Development: `keepkey` namespace
- Production: `keepkey-prod` namespace

## Deployment Configuration

### Development Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: support-email
  namespace: keepkey
spec:
  replicas: 2
  selector:
    matchLabels:
      app: support-email
  template:
    metadata:
      labels:
        app: support-email
    spec:
      containers:
      - name: support-email
        image: registry.digitalocean.com/keepkey/support-email:latest-dev
        ports:
        - containerPort: 3000
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "200m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 3
          periodSeconds: 5
        env:
        - name: NODE_ENV
          value: "development"
        - name: PORT
          value: "3000"
        # Additional environment variables loaded from secrets
```

### Production Deployment

The production deployment configuration is similar but with different resource allocations and environment variables:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: support-email
  namespace: keepkey-prod
spec:
  replicas: 3  # Higher replica count for production
  # ... similar to development but with production-specific values
```

## Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: support-email
  namespace: keepkey  # or keepkey-prod for production
spec:
  selector:
    app: support-email
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

## Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: support-email-ingress
  namespace: keepkey  # or keepkey-prod for production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  rules:
  - host: support-email.keepkey.com  # or another domain for production
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: support-email
            port:
              number: 80
  tls:
  - hosts:
    - support-email.keepkey.com
    secretName: support-email-tls
```

## Deployment Commands

These commands are executed by CircleCI to manage the deployment:

### Development Deployment

```bash
# Authenticate with DigitalOcean Kubernetes
doctl kubernetes cluster kubeconfig save $DO_CLUSTER_NAME

# Restart the deployment to pick up the new image
kubectl -n keepkey rollout restart deployment/support-email

# Wait for rollout to complete
kubectl -n keepkey rollout status deployment/support-email --timeout=120s
```

### Production Deployment

```bash
# Similar to development but with production namespace
kubectl -n keepkey-prod rollout restart deployment/support-email
kubectl -n keepkey-prod rollout status deployment/support-email --timeout=180s
```

## Deployment Verification

After deployment, the following checks are performed to verify success:

1. **Health Check**:
   ```bash
   # For development
   curl -s https://support-email.keepkey.com/health | jq
   
   # For production
   curl -s https://support-email-prod.keepkey.com/health | jq
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "version": "1.0.123",
     "timestamp": "2025-03-24T14:28:00Z"
   }
   ```

2. **Version Verification**:
   The version in the health response should match the expected build version from CircleCI.

## Secrets Management

Kubernetes secrets are used to store sensitive information:

```bash
# Create secrets (example)
kubectl -n keepkey create secret generic support-email-secrets \
  --from-literal=DB_PASSWORD=xxxx \
  --from-literal=API_KEY=xxxx
```

## Resource Monitoring

Resource utilization is monitored via:

1. DigitalOcean Kubernetes dashboard
2. Datadog metrics collection
3. Custom Prometheus exporters

## Maintenance and Troubleshooting

### Viewing Logs

```bash
# Get pod names
kubectl -n keepkey get pods -l app=support-email

# View logs for a specific pod
kubectl -n keepkey logs support-email-pod-name

# Stream logs in real-time
kubectl -n keepkey logs -f support-email-pod-name
```

### Debugging Issues

1. Check deployment status:
   ```bash
   kubectl -n keepkey describe deployment support-email
   ```

2. Check pod status:
   ```bash
   kubectl -n keepkey describe pod support-email-pod-name
   ```

3. Check recent events:
   ```bash
   kubectl -n keepkey get events --sort-by='.lastTimestamp'
   ```

## Security Considerations

1. All secrets are managed via Kubernetes secrets
2. Pod security policies enforce non-root container execution
3. Network policies restrict communication between services
4. Regular security scanning of container images

## Related Documentation

- [KKSE-CD Process](/docs/deployment/processes/KKSE-CD-process.md)
- [CircleCI Setup Guide](/docs/deployment/circleci-setup.md)
- [Dockerfile Reference](/docs/deployment/dockerfile-reference.md)
