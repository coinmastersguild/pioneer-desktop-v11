# Connection Testing Checklist

## Overview

This checklist helps verify all connection points between web portal and game client before deployment to production. Comprehensive connection testing is crucial to prevent the issues experienced in previous deployment sprints.

## Pre-Deployment Connection Tests

### 1. Server Health Endpoint Verification

- [ ] **Development Server Health Check**
  - Access `http://localhost:3000/health` directly in browser
  - Verify JSON response with status field
  - Check CORS headers allow cross-origin requests

- [ ] **Production Server Health Check**
  - Access `http://134.199.184.182:80/health` directly in browser
  - Verify JSON response with status field
  - Check for consistent format with development server

- [ ] **Health Check with Fetch API**
  - Test health endpoint from console using:
    ```javascript
    fetch('http://134.199.184.182:80/health')
      .then(res => res.json())
      .then(data => console.log('Health data:', data))
      .catch(err => console.error('Health check failed:', err));
    ```
  - Verify no CORS or network errors

### 2. Game Data Loading Verification

- [ ] **Development Server Data Loading**
  - Access `http://localhost:3000/load_game_data` directly in browser
  - Verify data structure is as expected
  - Verify response size is reasonable

- [ ] **Production Server Data Loading**
  - Access `http://134.199.184.182:80/load_game_data` directly in browser
  - Verify same data structure as development
  - Check for any missing assets or resources

### 3. Web Portal to Game Client Integration

- [ ] **Local-to-Local Integration**
  - Launch web portal at `http://localhost:4000`
  - Select development server
  - Verify game client launches with correct parameters
  - Check console for connection errors

- [ ] **Local-to-Production Integration**
  - Launch web portal at `http://localhost:4000`
  - Select production server
  - Verify game client connects to production server
  - Check localStorage for correct server data

- [ ] **Production-to-Production Integration**
  - Access production web portal
  - Select production game server
  - Verify seamless connection to game client
  - Confirm no parameter loss between components

### 4. URL Parameter Handling Tests

- [ ] **Direct Game Client Access**
  - Test `http://localhost:8080/` (should show server selection)
  - Verify server selection screen appears and functions

- [ ] **Game Client with Server ID**
  - Test `http://localhost:8080/?server=production`
  - Verify direct connection to production server
  - Check localStorage values are set correctly

- [ ] **Game Client with Encoded Server**
  - Base64 encode the production URL: `btoa('http://134.199.184.182:80')`
  - Test with the encoded parameter:
    `http://localhost:8080/?encodedServer=aHR0cDovLzEzNC4xOTkuMTg0LjE4Mjo4MA==`
  - Verify connection to the correct server

- [ ] **Game Client with Full Parameters**
  - Test with complete set of parameters:
    `http://localhost:8080/?server=production&encodedServer=aHR0cDovLzEzNC4xOTkuMTg0LjE4Mjo4MA==&token=demo-12345&showServerSelect=false`
  - Verify correct server connection and parameter handling

## Network Configuration Tests

- [ ] **Firewall Configuration**
  - Verify production server allows incoming connections on port 80
  - Check for any IP restrictions or rate limiting
  - Test from different network environments

- [ ] **CORS Configuration**
  - Verify CORS headers on production server:
    ```
    Access-Control-Allow-Origin: *
    Access-Control-Allow-Methods: GET, POST, OPTIONS
    Access-Control-Allow-Headers: Content-Type, Authorization
    ```
  - Test preflight OPTIONS requests
  - Verify WebSocket connections are permitted

- [ ] **CDN and Asset Loading**
  - Verify all game assets load from production URLs
  - Check browser network tab for 404 errors
  - Validate asset loading speed and compression

## Load and Stress Testing

- [ ] **Connection Concurrency**
  - Simulate multiple concurrent connections
  - Verify server handles connection pool properly
  - Check for any degradation under load

- [ ] **Network Latency Simulation**
  - Use browser dev tools to simulate slow connection
  - Test reconnection behavior under poor network conditions
  - Verify appropriate timeout handling

## Error Scenario Tests

- [ ] **Server Unavailable Scenario**
  - Simulate server being down
  - Verify appropriate error messages are displayed
  - Check fallback behavior works as expected

- [ ] **Invalid Authentication Test**
  - Test with invalid or expired tokens
  - Verify proper error handling and user feedback
  - Confirm security measures work as intended

## Connection Monitoring Setup

- [ ] **Health Check Monitoring**
  - Set up automated health checks for production URLs
  - Configure alerts for service disruptions
  - Document response time baselines

- [ ] **Error Logging**
  - Verify all connection errors are properly logged
  - Set up error aggregation and reporting
  - Create dashboards for connection metrics

## Final Verification

- [ ] **End-to-End User Flow**
  - Complete full user journey from web portal to in-game
  - Verify all connection points work seamlessly
  - Document any warnings or potential issues

- [ ] **Cross-Browser Testing**
  - Test connections in Chrome, Firefox, Safari, and Edge
  - Verify mobile browser compatibility
  - Check for any browser-specific connection issues

---

## Action Items After Failed Tests

If any tests fail, document the following:

1. **Specific Error Messages**: Capture exact error output
2. **Network Request Details**: Headers, payload, response codes
3. **Environmental Factors**: Browser, OS, network conditions
4. **Reproducibility Steps**: Detailed steps to consistently reproduce
5. **Attempted Solutions**: What was tried and the results

## Deployment Approval

The following stakeholders must approve the connection test results before proceeding with deployment:

- [ ] Lead Engineer
- [ ] DevOps Engineer
- [ ] QA Lead
- [ ] Product Manager

## Checklist Completion

**Date Completed**: _________________

**Completed By**: _________________

**Signature**: _________________ 