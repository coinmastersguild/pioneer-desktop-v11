# CircleCI Setup Guide for KeepKey Support Email

This guide outlines how to set up CircleCI for the KeepKey Support Email application following Guild MAGA protocol standards.

## Environment Variables

Set the following environment variables in the CircleCI project settings:

1. **DIGITALOCEAN_ACCESS_TOKEN** (required)
   - Used for authentication with DigitalOcean Container Registry and Kubernetes
   - Get this from DigitalOcean's API section
   - Ensure token has write access to registry and Kubernetes permissions

2. **DO_CLUSTER_NAME** (required)
   - The name/ID of your DigitalOcean Kubernetes cluster
   - Example: `do-cluster-keepkey`

3. **DOCKER_USERNAME** and **DOCKER_PASSWORD** (optional)
   - For Docker Hub access if needed

## Branch-Based Workflows

CircleCI is configured to handle different branches according to Guild protocol:

### Feature Branches

- Automatically run tests
- Build and tag image with feature branch name
- Deploy to feature environment with unique DNS
- Run E2E tests against feature environment

### Develop Branch

- Run all tests
- Build and tag development image
- Deploy to development environment 
- Run E2E tests against development DNS

### Master Branch

- Require manual approval
- Build and tag production image
- Deploy to production environment
- Run production verification tests

## Triggering Builds

### Initial Setup

1. After connecting your repository in CircleCI:
   - Visit https://app.circleci.com/pipelines/github/keepkey/keepkey-support-email
   - The project will automatically start building on all configured branches

### Manually Triggering Builds

1. **Via UI**:
   - Go to the project page on CircleCI
   - Click "Trigger Pipeline" button
   - Specify the branch to build

2. **Via API**:
   ```bash
   curl -X POST https://circleci.com/api/v2/project/github/keepkey/keepkey-support-email/pipeline \
     -H "Content-Type: application/json" \
     -H "Circle-Token: $CIRCLECI_API_TOKEN" \
     -d '{"branch":"develop"}'
   ```

## Health Check Verification

CircleCI performs health checks after deployment to verify:

1. Service availability
2. Correct version number is returned
3. Response time is under threshold

Example health check in CircleCI config:
```yaml
- run:
    name: Verify Health Endpoint
    command: |
      # Wait for deployment to be ready
      sleep 10
      # Check health endpoint
      HEALTH=$(curl -s https://dev.support-email.keepkey.com/health)
      VERSION=$(echo $HEALTH | jq -r '.version')
      # Verify version matches build
      if [[ "$VERSION" != "$SERVICE_VERSION" ]]; then
        echo "Version mismatch! Expected $SERVICE_VERSION, got $VERSION"
        exit 1
      fi
```

## Common Issues

### Container Registry Authentication

If you see errors like `unauthorized: authentication required`:

1. Verify the `DIGITALOCEAN_ACCESS_TOKEN` is correctly set in CircleCI
2. Ensure the token hasn't expired
3. Check that the token has Container Registry write permissions

### Kubernetes Access Issues

If deployment restarts fail:

1. Verify the cluster name is correct in the config
2. Check that the `DIGITALOCEAN_ACCESS_TOKEN` has Kubernetes admin permissions
3. Ensure that the deployment name in Kubernetes matches configuration

### Test and Build Failures

For initial setup, we've configured the pipeline to continue even if tests fail. Once your application is properly set up:

1. Remove the `|| echo "..."` parts from the test commands
2. Set up proper test and lint scripts in package.json
3. Fix any failing tests before merging to production

## Multiple Environment Setup

Per MAGA protocol, we have three environments:

1. **Development** (deploy from `develop` branch)
   - Namespace: `keepkey`
   - DNS: `dev.support-email.keepkey.com`

2. **Feature** (deploy from feature branches)
   - Namespace: `keepkey-feature`
   - DNS pattern: `[branch-name].support-email.keepkey.com`

3. **Production** (deploy from `master` branch)
   - Namespace: `keepkey-prod`
   - DNS: `support-email.keepkey.com`

## Deployment Verification Metrics

After each deployment, CircleCI records cycle times and deployment metrics in `docs/metrics/cycle-times.md` for tracking purposes.

## Related Documentation

- [Guild Deployment Protocol](/docs/guild/DEPLOYMENT_PROTOCOL.md)
- [KKSE-CD Process](/docs/deployment/processes/KKSE-CD-process.md)
- [Kubernetes Configuration](/docs/deployment/kubernetes-config.md)
