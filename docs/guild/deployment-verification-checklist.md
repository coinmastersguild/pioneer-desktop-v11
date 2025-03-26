# Deployment Verification Checklist

**Version**: 1.0  
**Last Updated**: 2025-03-24  
**Status**: Active  

## Overview

This checklist provides a standardized procedure for verifying deployments across all environments. Following these steps ensures that deployments are complete, successful, and compliant with Guild protocols.

## Pre-Deployment Checks

- [ ] All lint checks pass
- [ ] All tests pass
- [ ] No high or critical security vulnerabilities in dependencies
- [ ] Branch is up to date with target branch
- [ ] Environment configuration files are correctly set up
- [ ] Required secrets are available in the environment

## Deployment Process Verification

- [ ] Build process completes successfully
- [ ] Build artifacts are correctly generated
- [ ] Previous version is gracefully stopped
- [ ] New version starts successfully
- [ ] Health check passes
- [ ] Deployment cycle time is within acceptable range (target: <10 seconds)
- [ ] Deployment metrics are recorded

## Protocol Compliance Verification

- [ ] Health endpoint returns 200 status code
- [ ] Health endpoint returns required fields:
  - [ ] `status` field is present and correct
  - [ ] `version` field is present and matches expected version
  - [ ] `timestamp` field is present and current
  - [ ] `env` field is present and matches target environment
- [ ] Root endpoint returns correct application information
- [ ] Logs are being generated in correct format

## Post-Deployment Checks

- [ ] Application responds to requests
- [ ] Performance metrics are within expected ranges
- [ ] No unexpected errors in logs
- [ ] No unexpected process restarts
- [ ] All required environment variables are correctly loaded
- [ ] Graceful shutdown works when triggered

## Environment-Specific Checks

### Local Development

- [ ] PM2 process is running in correct mode
- [ ] Development tools (e.g., hot reloading) are working
- [ ] Local build optimizations are applied

### Docker Environment

- [ ] Container starts successfully
- [ ] Container exposes correct ports
- [ ] Container health check passes
- [ ] Container resource limits are applied
- [ ] Volume mounts are correct (if applicable)

### Development/Staging Environment

- [ ] Deployed to correct environment
- [ ] Environment-specific configurations are applied
- [ ] Integration with other development services works
- [ ] Monitoring alerts are configured

### Production Environment

- [ ] Zero-downtime deployment successful
- [ ] Production-specific optimizations are applied
- [ ] Backup procedures verified
- [ ] Security headers and settings are correctly configured
- [ ] Production monitoring is active

## Verification Commands

### Local Deployment
```bash
# Build and start
./skills/deploy.sh cycle local

# Verify health endpoint and protocol compliance
curl http://localhost:3000/health | jq '.'

# Check that version is included in health response
curl http://localhost:3000/health | jq 'has("version")'

# Check logs for errors
./skills/deploy.sh logs local
```

### Docker Deployment
```bash
# Build and start Docker container
./skills/deploy.sh cycle docker

# Check container health
docker ps -a
curl http://localhost:3000/health

# Check container logs
docker logs $(docker ps -q --filter "name=keepkey-support-email")
```

## Troubleshooting Common Issues

### Missing or Incorrect Health Response Fields
If health check is missing required fields:
1. Check implementation of health endpoint in `/src/index.ts`
2. Ensure proper compilation with `npm run build`
3. Restart the application with `./skills/deploy.sh restart local`

### Slow Deployment Cycle
If deployment cycle is taking too long:
1. Check TypeScript compilation times
2. Review PM2 startup configuration
3. Optimize build process if necessary

### Failed Health Checks
If health check is failing:
1. Check application logs with `./skills/deploy.sh logs local`
2. Verify port availability with `lsof -i :3000`
3. Check for environment configuration issues

## Conclusion

Following this verification checklist ensures that deployments are consistent, reliable, and protocol-compliant. The checklist should be updated as deployment procedures evolve.

---

*This checklist is part of the KeepKey Guild documentation and should be updated as standards evolve.*
