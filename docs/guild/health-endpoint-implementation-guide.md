# Health Endpoint Implementation Guide

**Version**: 1.0  
**Last Updated**: 2025-03-24  
**Status**: Active  

## Overview

This guide defines the standards and requirements for implementing health endpoints in KeepKey services. Health endpoints are critical for monitoring, deployment verification, and system diagnostics.

## Guild Protocol Requirements

All health endpoints MUST conform to the following requirements:

1. **Endpoint Path**: Accessible at `/health` 
2. **HTTP Method**: Respond to GET requests
3. **Required Response Fields**:
   - `status`: Current health status (string: "healthy" or "unhealthy")
   - `version`: Application version number (string)
   - `timestamp`: Current UTC timestamp in ISO format (string)
   - `env`: Current environment (string: "development", "staging", "production")
4. **Status Code**: Return 200 if healthy, 503 if unhealthy
5. **Response Time**: Maximum 500ms response time
6. **Content Type**: application/json

## Implementation Pattern

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = determineHealthStatus();
  
  if (!healthStatus.healthy) {
    res.status(503);
  }
  
  res.json({
    status: healthStatus.healthy ? 'healthy' : 'unhealthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    // Optional additional fields
    details: healthStatus.details
  });
});
```

## Extended Health Checks

For more comprehensive health monitoring, consider implementing:

1. **Dependencies Endpoint** at `/health/dependencies` that checks:
   - Database connectivity
   - External API availability 
   - Cache service status
   - Queue system status

2. **Metrics Endpoint** at `/health/metrics` that provides:
   - Memory usage
   - Request throughput
   - Error rates
   - Response times

## Verification

To verify the health endpoint implementation:

```bash
# Basic health check
curl http://localhost:3000/health

# Verify required fields
curl http://localhost:3000/health | jq 'has("status") and has("version") and has("timestamp") and has("env")'

# Check dependencies (if implemented)
curl http://localhost:3000/health/dependencies
```

## Lessons Learned from Sprint 1

1. **Protocol Compliance is Critical**: Missing the `version` field in the health endpoint initially caused compliance issues with Guild protocols. Always refer to this guide when implementing health endpoints.

2. **Automated Verification**: Include automated checks in CI/CD pipeline to verify health endpoint compliance before deployment.

3. **Health Checks in Deployment**: The deployment process should always verify health endpoint functionality after starting a service.

## Related Documentation

- [Deployment Verification Checklist](/docs/guild/deployment-verification-checklist.md)
- [Cycle Testing Protocol](/docs/guild/cycle-testing-protocol.md)
- [Sprint Writing Protocol](/docs/guild/sprint-writing-protocol.md)

---

*This guide is part of the KeepKey Guild documentation and should be updated as standards evolve.*
