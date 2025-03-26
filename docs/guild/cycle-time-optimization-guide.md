# Cycle Time Optimization Guide

**Version**: 1.0  
**Last Updated**: 2025-03-24  
**Status**: Active  

## Overview

Deployment cycle time is a critical metric that directly impacts development velocity and operational efficiency. This guide provides best practices for optimizing deployment cycle times across all environments.

## Current Baselines

Based on our Sprint 1 metrics, we've established the following baselines:

| Environment | Operation | Target Cycle Time |
|-------------|-----------|------------------|
| Local | Full Cycle (build→start→verify) | < 5 seconds |
| Local | Build | < 2 seconds |
| Local | Start | < 1 second |
| Local | Restart | < 2 seconds |
| Docker | Full Cycle | < 15 seconds |
| Development | Full Cycle | < 30 seconds |
| Production | Full Cycle | < 60 seconds |

## Optimization Strategies

### Build Process Optimization

1. **TypeScript Optimization**:
   - Use `tsconfig.json` incremental builds
   - Enable compiler caching
   - Optimize target settings for faster compilation

2. **Dependency Management**:
   - Minimize dependencies
   - Use modular imports where possible
   - Regularly audit and remove unused dependencies

3. **Parallelization**:
   - Parallelize independent build steps
   - Use worker threads for CPU-intensive operations

### Deployment Process Optimization

1. **Process Management**:
   - Optimize PM2 configuration for faster restarts
   - Use PM2 cluster mode for zero-downtime reloads
   - Implement graceful shutdown with reasonable timeouts

2. **Health Check Optimization**:
   - Minimize health check dependencies
   - Implement progressive health checks (basic → comprehensive)
   - Optimize retry intervals and timeout configurations

### Docker Optimization

1. **Image Size Reduction**:
   - Use multi-stage builds
   - Implement proper .dockerignore file
   - Use Alpine or slim base images

2. **Build Caching**:
   - Optimize layer caching order (dependencies → code → config)
   - Use BuildKit for improved caching
   - Implement CI caching for Docker builds

### Environment-Specific Strategies

1. **Local Environment**:
   - Use development builds with minimal optimization
   - Implement watch mode for faster incremental builds
   - Skip non-essential verification steps

2. **Production Environment**:
   - Pre-compile assets during build phase
   - Implement blue-green deployment patterns
   - Progressive traffic shifting

## Measuring and Monitoring

1. **Automated Measurement**:
   - Continue using `./skills/deploy.sh` cycle time recording
   - Review `/docs/metrics/cycle-times.md` regularly

2. **Metrics to Track**:
   - Overall cycle time
   - Time per deployment phase
   - Success rate
   - Recovery time from failures

3. **Continuous Improvement**:
   - Set cycle time improvement goals for each sprint
   - Analyze slowest components and prioritize optimization

## Lessons from Sprint 1

1. **Build-Time Efficiency**: Our build process is already quite efficient (~1 second) due to the small codebase size and optimized TypeScript configuration.

2. **Process Management**: PM2 provides excellent restart speeds, enabling sub-second service restarts.

3. **Health Check Performance**: The simple health check implementation allows for quick verification without adding significant overhead.

4. **Areas for Improvement**:
   - Docker build and deployment processes need optimization
   - Health check verification could be more comprehensive
   - Parallel execution of certain deployment steps could further reduce cycle time

## Implementation Example

The following script pattern can help optimize cycle time:

```bash
# Parallel execution example
build_app() {
  npm run build &
  BUILD_PID=$!
}

prepare_env() {
  # Prepare environment in parallel with build
  configure_environment
}

deploy() {
  # Wait for build to complete
  wait $BUILD_PID
  
  # Start application
  pm2 restart ecosystem.config.js
  
  # Perform health check with optimized retry intervals
  verify_health "http://localhost:3000/health" 5 0.5
}

# Execute with timing
start_time=$(date +%s)
build_app & prepare_env
deploy
end_time=$(date +%s)
echo "Deployment completed in $((end_time - start_time)) seconds"
```

## Conclusion

Optimizing cycle time is an ongoing process that requires continuous measurement, analysis, and improvement. By following these guidelines and regularly reviewing our metrics, we can maintain and improve our already excellent deployment cycle times.

---

*This guide is part of the KeepKey Guild documentation and should be updated as standards evolve.*
