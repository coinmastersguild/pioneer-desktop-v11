# Container Registry Integration Guide

This document outlines the integration between CircleCI and the Digital Ocean Container Registry for the KeepKey Support Email application, following Guild MAGA protocol for Pre-Production state.

## Overview

The application follows a containerized deployment approach:

1. CircleCI builds Docker images from our Alpine-based Dockerfile
2. Images are pushed to Digital Ocean Container Registry with appropriate tags
3. In Pre-Production state, we verify images in the registry using CLI tools
4. DevOps team deploys containers to production Kubernetes via Pulumi

## Image Naming Convention

Images follow this naming pattern in the registry:

```
registry.digitalocean.com/keepkey/support-email:<tag>
```

Where `<tag>` follows these conventions:
- `<commit-sha>-<environment>` - Specific build version (e.g., `abc123-dev`)
- `latest-<environment>` - Latest build for an environment (e.g., `latest-dev`)
- `latest` - Production release version

## Environment Mappings

| Git Branch | Environment Tag | Use Case |
|------------|----------------|----------|
| `develop`  | `dev`          | Development environment |
| `main`     | `dev`/`production` | Staging/Production (requires approval) |
| `feature/*` | `feature-*`    | Feature testing environments |

## Verification Process

To verify that images are properly built and pushed to the registry:

1. Run the verification script:
   ```bash
   ./skills/verify-registry-image.sh latest-dev
   ```

2. Update the Development environment status:
   ```bash
   ./skills/verify-registry-image.sh latest-dev --update-status
   ```

## CircleCI Configuration Details

Our `.circleci/config.yml` implements:

1. **Test Job**: Runs linting and unit tests
2. **Build-and-Push Job**: 
   - Builds Docker image using our Alpine-based Dockerfile
   - Tags with both commit SHA and "latest" tags
   - Pushes to Digital Ocean Container Registry
3. **Deploy-Develop Job**:
   - Triggered only for the develop branch
   - Updates environment status
4. **Production Deployment**:
   - Requires manual approval
   - Prepares production image from main branch

## Pulumi Integration Notes

When requesting DevOps to add this service to Pulumi, provide:

1. Full image URL: `registry.digitalocean.com/keepkey/support-email:latest-dev`
2. Note that this service does NOT require ingress configuration
3. Container listens on port 5001 (per Guild protocol)

## Environment Status Impact

The Development environment status moves to GREEN when:
- CircleCI successfully builds and pushes the image
- The image is verified in the registry
- DevOps confirms successful deployment

## Troubleshooting

If image verification fails:

1. Check CircleCI build logs for errors
2. Verify DIGITALOCEAN_ACCESS_TOKEN is set correctly in CircleCI
3. Ensure the repository exists in the Digital Ocean Container Registry
4. Check that branch naming follows conventions

## Next Steps After Verification

1. Contact DevOps team to add service to Pulumi
2. Provide image URL and container specifications
3. Update environment status after successful deployment
4. Continue focus on Feature environments per Pre-Production protocol
