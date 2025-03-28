# Health Check Strategy for Headless Services

## Overview

This document outlines the strategy for health checking headless services like KeepKey Support Email that don't require public ingress but still need health monitoring for operational integrity.

## Current Protocol (Immediate Term)

For headless services without ingress, the current Guild protocol requires:

1. **Manual Port Forwarding**: 
   ```bash
   kubectl -n keepkey port-forward deployment/support-email 3000:3000
   ```

2. **Direct Health Endpoint Check**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Expected Response**:
   ```json
   {
     "status": "ok",
     "version": "1.0.x",
     "timestamp": "2025-03-24T14:55:41-03:00"
   }
   ```

## Medium-Term Strategy (Redis Integration)

For improved monitoring of headless services:

1. **Health Status in Redis**:
   - Service periodically writes health status to Redis
   - Includes version, timestamp, and component status
   - TTL-based entries to detect service failure

2. **Centralized Health Dashboard**:
   - Single dashboard reads all service health from Redis
   - Color-coded status display
   - Alerting when health checks fail

3. **Implementation Plan**:
   ```javascript
   // Example implementation
   async function updateHealthStatus() {
     const health = {
       status: "ok", 
       version: process.env.VERSION,
       timestamp: new Date().toISOString(),
       components: { db: "ok", queue: "ok" }
     };
     
     await redis.setex(
       `health:support-email:${process.env.ENVIRONMENT}`, 
       60, // 1-minute TTL
       JSON.stringify(health)
     );
   }
   
   // Run every 30 seconds
   setInterval(updateHealthStatus, 30000);
   ```

## Long-Term Strategy (Full Health System)

Comprehensive health monitoring system:

1. **Direct /health Endpoint** (Kubernetes liveness/readiness probes)
2. **Redis Status Updates** (for centralized dashboard)
3. **Prometheus Metrics** (for trend analysis)
4. **Automated Recovery** (based on health signals)

## Implementation Timeline

| Phase | Feature | Target Date | Status |
|-------|---------|-------------|--------|
| 1 | Basic /health endpoint (PM2) | Completed | ✅ |
| 1 | Kubernetes port-forward protocol | Completed | ✅ |
| 2 | Redis health status integration | Sprint 2 | 🟡 |
| 2 | Basic health dashboard | Sprint 2 | 🟡 |
| 3 | Full monitoring with Prometheus | Sprint 3 | 🔴 |

## Health Check Best Practices

1. **Deep Health Checks**: Verify all critical dependencies (DB, queues, etc.)
2. **Standardized Response Format**: Follow Guild protocol for health endpoints
3. **Appropriate Timeouts**: Health checks must complete within 500ms
4. **Minimal Resource Usage**: Health checks should be efficient
5. **Separate Liveness/Readiness**: Different checks for Kubernetes probes
