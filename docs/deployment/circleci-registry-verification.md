# CircleCI Registry Verification Process

This document outlines the process for verifying that Docker images are properly built and pushed to the Digital Ocean Container Registry as part of our CircleCI pipeline, following strict Guild protocol.

## Prerequisites

Before performing registry verification, ensure:

1. You have `doctl` installed:
   ```bash
   brew install doctl
   ```

2. You have authenticated with Digital Ocean:
   ```bash
   doctl auth init
   ```

3. Your Digital Ocean credentials have registry access permissions.

## Verification Process

Our CircleCI configuration in `.circleci/config.yml` is set up to:

1. Build the Docker image from our Alpine-based Dockerfile
2. Push it to Digital Ocean Container Registry with appropriate tags
3. Record deployment information for Pulumi

To verify this has occurred successfully, run:

```bash
./skills/verify-registry-image.sh latest-dev
```

This will:
- Confirm the repository exists in Digital Ocean Container Registry
- Check if the specified tag is present
- Display information about the image if found
- Follow Guild protocol with no mocking or simulations

## Environment Status Updates

To update the environment status based on verification:

```bash
./skills/verify-registry-image.sh latest-dev --update-status
```

The status will be updated as follows:
- 🟢 **GREEN**: Image found in registry
- 🔴 **RED**: Image not found or repository missing

In Pre-Production state, if Development status is RED due to missing images:

1. Verify CircleCI workflow is correctly configured
2. Check if builds are failing in CircleCI
3. Manually trigger a CircleCI build on the develop branch

## Preparing for Pulumi Deployment

Once image verification is successful, contact DevOps to add the service to Pulumi with:

1. Image URL: `registry.digitalocean.com/keepkey/support-email:latest-dev`
2. Service specifications:
   - Port: 5001 (per Guild protocol)
   - No ingress configuration required
   - Node.js Alpine-based container 

## Troubleshooting

If verification fails:

1. Check CircleCI build logs for errors
2. Verify Digital Ocean authentication is working properly
3. Ensure the repository has been created in the registry
4. Check that CircleCI environment variables are set correctly:
   - `DIGITALOCEAN_ACCESS_TOKEN` must be configured in CircleCI project settings

Remember that per Guild protocol, we never mock verification or testing - always use real tools and actual credentials when verifying deployment status.
