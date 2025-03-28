# Deployment Health Check Requirements

## Overview

This document outlines the requirements for implementing health checks in the DegenQuest deployment process to ensure compliance with the MAGA (Master Always Green Approach) workflow. Proper health verification is critical to maintaining a reliable and functional game environment.

## Guiding Principles

1. **True Green Status**: A "green" build status must reflect a truly functional deployment, not just successful completion of deployment scripts.
2. **Continuous Verification**: Health must be verified at multiple stages: post-deployment, periodically after deployment, and before allowing clients to connect.
3. **Comprehensive Coverage**: Health checks should cover all critical components of the system.
4. **Automatic Recovery**: Failed health checks should trigger automatic recovery procedures when possible.
5. **Transparency**: Health status should be visible and understandable to all team members.

## Required Health Checks

### Game Server Health Checks

| Check Type | Description | Implementation | Frequency |
|------------|-------------|----------------|-----------|
| Basic Connectivity | Verify TCP connection to service | `telnet <server-ip> <port>` | During deployment, every 5 minutes |
| HTTP Health Endpoint | Check /health endpoint returns 200 OK | `curl -f http://<ip>/health` | During deployment, every minute |
| WebSocket Connectivity | Verify WebSocket protocol works | Custom script in `skills/ws-health-check.js` | During deployment, every 5 minutes |
| Game Session Creation | Test complete game session creation | E2E test script | Post-deployment, daily |
| Database Connection | Verify database connectivity | Status from /health endpoint | During deployment, every 5 minutes |
| DNS Resolution | Verify domain resolves to correct IP | `dig +short <domain>` | Post-deployment, hourly |

### Web Portal Health Checks

| Check Type | Description | Implementation | Frequency |
|------------|-------------|----------------|-----------|
| Basic Connectivity | Verify HTTP connection returns 200 | `curl -f http://<ip>` | During deployment, every 5 minutes |
| Asset Loading | Verify critical assets load properly | Headless browser test | Post-deployment, hourly |
| Login Flow | Test user login process | E2E test script | Post-deployment, daily |
| API Connectivity | Verify connectivity to backend APIs | Status checks to all API endpoints | During deployment, every 5 minutes |

### API Service Health Checks

| Check Type | Description | Implementation | Frequency |
|------------|-------------|----------------|-----------|
| Basic Connectivity | Verify HTTP connection returns 200 | `curl -f http://<ip>/health` | During deployment, every 5 minutes |
| Authentication | Test authentication endpoints | API test script | Post-deployment, every 15 minutes |
| Database Connectivity | Verify database connections | Status from /health endpoint | During deployment, every 5 minutes |
| Response Time | Measure and verify acceptable latency | Performance test script | Post-deployment, hourly |

## Implementation Requirements

### CircleCI Pipeline Integration

1. **Post-Deployment Verification**:
   ```yaml
   - run:
       name: Verify Deployment Health
       command: |
         # Run verification script
         ./scripts/verify-deployment-health.sh
         
         # Exit with error if health check fails
         if [ $? -ne 0 ]; then
           echo "Deployment health check failed"
           exit 1
         fi
   ```

2. **Rollback Trigger**:
   ```yaml
   - run:
       name: Rollback on Failed Health Check
       command: |
         # If health check failed
         if [ $? -ne 0 ]; then
           echo "Rolling back to previous working version"
           ./scripts/rollback.sh
           exit 1
         fi
   ```

### Kubernetes Integration

1. **Readiness Probe**:
   ```yaml
   readinessProbe:
     httpGet:
       path: /health
       port: <container-port>
     initialDelaySeconds: 10
     periodSeconds: 5
     timeoutSeconds: 2
     successThreshold: 1
     failureThreshold: 3
   ```

2. **Liveness Probe**:
   ```yaml
   livenessProbe:
     httpGet:
       path: /health
       port: <container-port>
     initialDelaySeconds: 30
     periodSeconds: 15
     timeoutSeconds: 5
     successThreshold: 1
     failureThreshold: 3
   ```

3. **Startup Probe** (for slower-starting services):
   ```yaml
   startupProbe:
     httpGet:
       path: /health
       port: <container-port>
     initialDelaySeconds: 15
     periodSeconds: 10
     timeoutSeconds: 3
     successThreshold: 1
     failureThreshold: 12
   ```

### Health Endpoint Requirements

All services must implement a `/health` endpoint with the following requirements:

1. **Basic Format**:
   ```json
   {
     "status": "UP",
     "version": "1.2.3",
     "timestamp": 1647806304,
     "uptime": 3600,
     "components": {
       "database": { "status": "UP" },
       "cache": { "status": "UP" },
       "externalServices": { "status": "UP" }
     }
   }
   ```

2. **Status Values**:
   - `UP`: Component is fully functional
   - `DOWN`: Component is not functioning
   - `DEGRADED`: Component is functioning with reduced capability
   
3. **Required Response Codes**:
   - 200 OK: System is healthy
   - 503 Service Unavailable: System is unhealthy or degraded
   - 500 Internal Server Error: Health check itself failed

## Monitoring System Requirements

1. **Dashboard**:
   - Real-time view of all service health status
   - Historical view of health check results
   - Alerting configuration

2. **Alerts**:
   - Slack integration for immediate notification
   - Email alerts for persistent issues
   - Escalation paths for critical failures

3. **Logging**:
   - All health check results must be logged
   - Log retention of at least 30 days
   - Structured logging format for automated analysis

## Implementation Plan

| Phase | Description | Timeline |
|-------|-------------|----------|
| 1 | Define health endpoints for all services | Week 1 |
| 2 | Implement basic health check scripts | Week 1 |
| 3 | Integrate health checks into CircleCI | Week 2 |
| 4 | Configure Kubernetes probes | Week 2 |
| 5 | Set up monitoring dashboard | Week 3 |
| 6 | Implement advanced E2E health checks | Week 3 |
| 7 | Test and validate full system | Week 4 |

## Success Criteria

The health check implementation will be considered successful when:

1. All deployments automatically verify their health
2. Failed health checks prevent bad deployments from reaching production
3. Health metrics are collected and visible in dashboards
4. Automatic alerts notify the team of health issues
5. Recovery mechanisms successfully restore service after detected failures

## Conclusion

Implementing these health check requirements is critical for the reliability and stability of the DegenQuest platform. They form the foundation of our MAGA workflow and ensure that "green" truly means functional and ready for players. 