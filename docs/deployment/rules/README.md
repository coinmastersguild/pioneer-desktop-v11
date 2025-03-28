# DegenQuest-v3 Deployment Documentation

## Critical Deployment Rules

> ⚠️ **CORE PRINCIPLES - NO EXCEPTIONS** ⚠️
>
> 1. **NEVER write Kubernetes YAML** - All infrastructure is Pulumi code
> 2. **NEVER deploy without Pulumi** - No direct kubectl commands
> 3. **NEVER build images locally** - All production images through CircleCI
> 4. **ALWAYS code-review infrastructure changes**

## Documentation Contents

This directory contains essential documentation for Milestone 3: Deployment to Kubernetes with Pulumi.

### Key Documents

1. [**Milestone 3 Prospectus**](./milestone-3-prospectus.md) - Comprehensive plan for infrastructure deployment
2. [**Deployment Rules Checklist**](./deployment-rules-checklist.md) - Required checks for all deployments
3. [**Quick Reference Guide**](./quick-reference.md) - Common commands and workflows

## Getting Started

1. Read the Milestone 3 Prospectus to understand the overall strategy
2. Review the deployment rules checklist to ensure compliance
3. Use the quick reference guide for common tasks

## Infrastructure Directory Structure

The Pulumi code for our infrastructure is organized as follows:

```
infra/
├── index.ts              # Main entry point
├── Pulumi.yaml           # Project configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies
├── components/           # Reusable infrastructure components
│   ├── database.ts
│   ├── game-server.ts
│   └── monitoring.ts
├── environments/         # Environment-specific configurations
│   ├── dev/
│   ├── staging/
│   └── production/
└── utilities/            # Helper functions
    ├── networking.ts
    └── security.ts
```

## Work In Progress

This documentation is part of Milestone 3 and will be expanded as the implementation progresses.

## Contact

For questions about deployment, contact the DevOps team. 