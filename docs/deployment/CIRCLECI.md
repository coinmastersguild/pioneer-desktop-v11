# CircleCI Integration & Troubleshooting Guide for Pioneer Agent

## Overview

This document provides comprehensive guidance on monitoring, troubleshooting, and working with CircleCI for the Pioneer Agent project. CircleCI is used for continuous integration and deployment of the application to Kubernetes.

## Setup CircleCI Access

1. Create a CircleCI API token at https://app.circleci.com/settings/user/tokens
2. Set the token in your environment:

```bash
export CIRCLE_CI_TOKEN="your-token-here"
```

3. For persistent access, add to your shell configuration:

```bash
echo 'export CIRCLE_CI_TOKEN="your-token-here"' >> ~/.zshrc
```

## Monitoring Build Status

### Check Latest Build

```bash
cd /Users/highlander/WebstormProjects/pioneer-agent/eliza-multi-agent/scripts/circleci
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent?limit=1 | jq '.[0]'
```

This provides complete information about the latest build including:
- Build number
- Status (running, success, failed)
- Commit information
- Timing data
- Workflow information

### Quick Status Check

For a quick status check:

```bash
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent?limit=1 | jq '.[0].status'
```

### Check Build Subject and Failure

```bash
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent?limit=1 | \
  jq '.[0].subject, .[0].fail_reason'
```

### List Recent Builds

```bash
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent?limit=10 | \
  jq '.[] | {build_num: .build_num, status: .status, subject: .subject}'
```

## Retrieving Build Logs

### Complete Build Output

```bash
# Replace 9 with your build number
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  "https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent/9/output" | jq
```

### Filter Output for Errors

```bash
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  "https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent/9/output" | \
  jq '.[] | select(.message | contains("error") or contains("Error") or contains("ERROR"))'
```

### Using Provided Scripts

The project includes several helper scripts in the `/circleci` directory:

```bash
# Show logs for a specific job
./fetch_job_logs.sh [job-number]

# Get workflow information
./get_workflow_jobs.sh [workflow-id]

# Get complete workflow logs
./get_workflow_logs.sh [workflow-id]
```

## Working with Workflows

### Identify Workflow ID

```bash
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent?limit=1 | \
  jq '.[0].workflows'
```

Example output:
```json
{
  "workflow_id": "ca09f992-638b-4cb8-977f-d9ae042da925",
  "workflow_name": "sprint-2-eliza-deploy",
  "workspace_id": "ca09f992-638b-4cb8-977f-d9ae042da925",
  "job_name": "build-and-push-eliza",
  "job_id": "096b5552-9582-41ca-a34a-1e3a42c86579",
  "upstream_job_ids": [],
  "upstream_concurrency_map": {}
}
```

### Get Workflow Jobs

```bash
curl -s -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  "https://circleci.com/api/v2/workflow/ca09f992-638b-4cb8-977f-d9ae042da925/job" | jq
```

## Troubleshooting Common Issues

### 1. Docker Build Failures

Common in error logs:
- `ERROR: failed to solve: process "/bin/sh -c..." did not complete successfully`
- Platform compatibility issues (ARM64 vs AMD64)

Solution:
- Check the Dockerfile for errors
- Examine platform-specific settings
- Look for missing dependencies

### 2. NPM/PNPM Dependency Issues

Common in error logs:
- `Cannot find module...`
- `Error: Cannot find module @rollup/rollup-linux-arm64-gnu`

Solution:
- Check package.json dependencies
- Adjust platform-specific dependencies
- Ensure proper caching settings

Example error from a recent build:
```
Error: Cannot find module @rollup/rollup-linux-arm64-gnu. npm has a bug related to optional dependencies. 
Please try `npm i` again after removing both package-lock.json and node_modules directory.
```

### 3. Authentication/Registry Issues

Common in error logs:
- `denied: requested access to the resource is denied`
- `unauthorized: authentication required`

Solution:
- Verify CircleCI environment variables
- Check Docker registry credentials
- Confirm repository permissions

## Triggering New Builds

### Manual Trigger

```bash
curl -X POST -H "Circle-Token: ${CIRCLE_CI_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"branch":"main"}' \
  https://circleci.com/api/v1.1/project/github/coinmastersguild/pioneer-agent/build
```

### Using Helper Script

```bash
./trigger_pipeline.sh
```

## Monitoring Deployments

After a successful CircleCI build and deployment, verify:

```bash
# Check if the image was pushed
kubectl describe pods -l app=pioneer-agent | grep Image

# Check if pods are being restarted with new image
kubectl get pods -l app=pioneer-agent

# Check rollout status
kubectl rollout status deployment/pioneer-agent-kzof0f9r
```

## Monitoring CircleCI Status

### Importance of Red/Green Builds

Being able to detect if a build is red (failing) or green (passing) is critical for our MAGA (Master Always Green Approach) deployment strategy for these reasons:

1. **Deployment Gates**: We only deploy code that passes all tests (green builds). Red builds are never deployed to production.

2. **Early Problem Detection**: Identifying red builds immediately allows us to fix issues before they affect other developers or customers.

3. **Protection of Main Branches**: Our develop and master branches must always be kept in a deployable state, which means all builds must be green.

4. **Continuous Integration Integrity**: The entire CI process depends on reliable detection of build status to proceed or halt automated processes.

### Detecting Build Status

There are several ways to check if your CircleCI build is red or green:

#### 1. Via the CircleCI Dashboard

The CircleCI dashboard displays build status with clear visual indicators:
- Green check mark: Build passed
- Red X: Build failed
- Yellow circle: Build in progress

Access the dashboard at: https://app.circleci.com/pipelines/circleci/Tm49Xte1YnCKAj85vgzMr4

#### 2. Via GitHub Integration

GitHub shows CircleCI status directly on pull requests and commits:
- Green check: All checks passed
- Red X: One or more checks failed
- Yellow dot: Checks in progress

#### 3. Via CircleCI API

For automated monitoring, use the CircleCI API to check build status programmatically:

```bash
# Example using the CircleCI skills script
./skills/circleci/check_project_settings.sh

# Getting workflow status
./skills/circleci/monitor_workflow.sh <workflow-id>
```

#### 4. Via CircleCI CLI

```bash
# Install CircleCI CLI if not already installed
curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash

# Check workflow status
circleci workflow wait <workflow-id>
```

### Responding to Red Builds

When a red build is detected:

1. **Stop and Fix**: Do not push additional code until the issue is resolved
2. **Investigate Logs**: Use the CircleCI dashboard or API to access detailed error logs
3. **Reproduce Locally**: Try to reproduce the failure in your local environment
4. **Fix and Verify**: Make the necessary code changes and verify they fix the issue
5. **Push the Fix**: Push your fix and monitor to ensure the build turns green

### Best Practices

- Always check build status before pushing new code
- Set up notifications for failed builds (Slack, email)
- Fix red builds immediately - this is the highest priority task
- Document common build failure patterns and their solutions

Remember: In the MAGA workflow, red builds are a blocker for all deployment activities. Keeping builds green is everyone's responsibility.

## Advanced Troubleshooting

### SSH Into Build Environment

Enable SSH access from CircleCI interface, then:

```bash
# Follow SSH instructions from CircleCI
ssh -p [port] [username]@[host]
```

### Local Debugging

To simulate the build locally:

```bash
# Build locally
docker build -t pioneer-agent-local .

# Test container locally
docker run -p 8080:8080 -e NODE_ENV=development pioneer-agent-local
```

## Additional Resources

- [CircleCI API v1 Reference](https://circleci.com/docs/api/v1/)
- [CircleCI API v2 Reference](https://circleci.com/docs/api/v2/)
- [CircleCI Troubleshooting Guide](https://circleci.com/docs/troubleshooting/)
- [Docker Build Reference](https://docs.docker.com/engine/reference/commandline/build/) 