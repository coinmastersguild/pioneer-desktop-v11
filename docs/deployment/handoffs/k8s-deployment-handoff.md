# Kubernetes Deployment Handoff

## Application: keepkey-support-email

**Date:** 2025-03-24
**Status:** Ready for Deployment (Pre-Production)
**Protocol:** Following Pre-Production Forward Progression

## Docker Image Details

- **Registry:** registry.digitalocean.com/pioneer/support-email
- **Tags:**
  - `latest-dev`
  - *(Specific SHA tag from latest build)*
- **Verified:** Yes ✅ (CircleCI build successful)
- **Build Pipeline:** https://app.circleci.com/pipelines/github/keepkey/keepkey-support-email/6/workflows/aa77e6a2-f1bd-40fc-8053-fe53f0033b1d

## Deployment Requirements

### Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 100m    | 200m        |
| Memory   | 256Mi   | 512Mi       |
| Storage  | 100Mi   | 256Mi       |

### Network Configuration

- **Ingress Required:** No
  - Application serves internal API endpoints for email processing
  - No direct user-facing UI requirements
- **Service Type:** ClusterIP (internal service)
- **Ports:**
  - Main application: 3000

### Environment Variables Required

```
NODE_ENV=production
LOG_LEVEL=info
GMAIL_API_ENABLED=true
```

## Special Considerations

1. **Tokens Directory:**
   - Application requires a persistent volume for `.tokens` directory
   - Must be writable by app (Permission: 700)
   - Used for Gmail API authentication tokens

2. **Backup Strategy:**
   - No database, but token files should be backed up
   - Consider volume snapshot strategy for tokens

3. **Health Checks:**
   - Readiness: HTTP GET /health
   - Liveness: HTTP GET /health
   - Initial delay: 30s

## Deployment URL

As per the Kubernetes deployment guide, the application should be deployed internally and not exposed via public ingress. The recommended service endpoint will be:

`http://keepkey-support-email.keepkey-dev.svc.cluster.local:3000`

## Deployment Process

Following the Guild protocol and Kubernetes deployment rules:

1. **DevOps Responsibility:**
   - Update Pulumi configuration to enable `keepkeySupport` in `deploy/config.ts`
   - Deploy using Pulumi infrastructure code
   - No manual YAML modifications required

2. **Verification After Deployment:**
   - Check pod health and logs
   - Verify Gmail API connectivity
   - Test email processing functionality

## Sign-off

This handoff document has been prepared according to the Guild protocols for Pre-Production state, focusing on forward progression toward Production readiness. The Docker image has been successfully built and verified, and is ready for Kubernetes deployment by the DevOps team.

---

*Note: As per deployment rules, no manual Kubernetes YAML files have been created. All deployment configurations should be managed through the Pulumi infrastructure as code by the DevOps team.*
