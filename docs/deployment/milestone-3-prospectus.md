# Milestone 3: Deployment to Kubernetes Cluster with Pulumi

## Core Principles & Critical Rules

> ⚠️ **CRITICAL DEPLOYMENT RULES** ⚠️
>
> 1. **NEVER write Kubernetes YAML manually** - All infrastructure must be defined as code using Pulumi
> 2. **NEVER deploy without Pulumi** - Manual `kubectl` commands are strictly prohibited for production deployments
> 3. **Images must ONLY be built via CircleCI** - Local image builds are forbidden for production
> 4. **All infrastructure changes must be code-reviewed** - No exceptions

This document outlines the plan for Milestone 3: deploying DegenQuest-v3 to a Kubernetes cluster using infrastructure as code with Pulumi. This milestone builds upon the successful implementation of the first-person camera enhancements while ensuring robust, repeatable deployments.

## 1. Overview

### 1.1 Purpose

Following the successful implementation of Milestone 1 (Camera Height Adjustment and Controls) and Milestone 2 (Player Body Visibility and Particle Effects), Milestone 3 focuses on reliable production deployment using modern DevOps practices.

### 1.2 Goals

- Establish a fully automated deployment pipeline using Pulumi and CircleCI
- Implement proper environment separation (dev/staging/production)
- Configure autoscaling, health checks, and resource monitoring
- Set up persistent storage for game state and user data
- Document the entire deployment process for future reference

### 1.3 Anti-Goals

- Manual Kubernetes deployments or YAML editing
- Direct server access for deployment purposes
- Local Docker image builds for production
- One-off scripts for infrastructure tasks

## 2. Infrastructure-as-Code Strategy

### 2.1 Pulumi Implementation

Pulumi will be used to define and manage all infrastructure. This approach offers several advantages:

- **Real programming languages** instead of YAML templates
- **Type checking** helps catch errors before deployment
- **Modular components** for reusable infrastructure patterns
- **State management** across deployments
- **Secret management** for sensitive values

### 2.2 Prohibited Practices

The following practices are explicitly prohibited:

- Writing Kubernetes YAML files directly
- Using `kubectl apply -f` for deployments
- Making changes directly to the cluster via `kubectl edit`
- Storing credentials in plaintext or environment variables
- One-off deployments outside the deployment pipeline

## 3. Implementation Plan

### 3.1 Pulumi Project Setup

```typescript
// Example Pulumi TypeScript code structure - NEVER write YAML directly
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as docker from "@pulumi/docker";

// Configuration (separate for each environment)
const config = new pulumi.Config();
const dbPath = config.require("dbPath");
const containerRegistry = config.require("containerRegistry");

// Deploy the game server
const appLabels = { app: "degen-server" };
const deployment = new k8s.apps.v1.Deployment("degen-server", {
    spec: {
        selector: { matchLabels: appLabels },
        replicas: 2,
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: "degen-server",
                    image: `${containerRegistry}/degen-server:latest`,
                    ports: [{ containerPort: 8888 }],
                    env: [
                        { name: "DB_PATH", value: dbPath },
                        { name: "NODE_ENV", value: "production" }
                    ],
                    resources: {
                        requests: {
                            cpu: "100m",
                            memory: "128Mi"
                        },
                        limits: {
                            cpu: "500m",
                            memory: "512Mi"
                        }
                    },
                    livenessProbe: {
                        httpGet: {
                            path: "/health",
                            port: 8888
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 10
                    }
                }]
            }
        }
    }
});
```

### 3.2 Infrastructure Components

Using Pulumi, we'll define and deploy:

1. **Kubernetes Resources**
   - Deployments for game server and supporting services
   - Services for networking and load balancing
   - ConfigMaps and Secrets for configuration
   - PersistentVolumeClaims for stateful storage

2. **Autoscaling Configuration**
   - Horizontal Pod Autoscaler for traffic spikes
   - Resource quotas and limits

3. **Networking**
   - Ingress controllers
   - Network policies
   - TLS certificate management

4. **Monitoring and Logging**
   - Prometheus metrics collection
   - Grafana dashboards
   - ELK stack integration

### 3.3 CircleCI Pipeline Configuration

The CircleCI pipeline will be enhanced to include:

```yaml
# Example CircleCI config - FOR REFERENCE ONLY
# Actual deployment must use Pulumi, never direct kubectl
version: 2.1

orbs:
  pulumi: pulumi/pulumi@2.1.0
  docker: circleci/docker@2.2.0

jobs:
  build-image:
    machine: true
    steps:
      - checkout
      - docker/build:
          image: degen-server
          tag: ${CIRCLE_SHA1},latest
          registry: ${DOCKER_REGISTRY}
          
  deploy-with-pulumi:
    docker:
      - image: pulumi/pulumi:3.x
    steps:
      - checkout
      - pulumi/login
      - pulumi/update:
          stack: ${PULUMI_STACK}
          working-directory: ./infra

workflows:
  version: 2
  build-deploy:
    jobs:
      - build-image:
          filters:
            branches:
              only: master
      - deploy-with-pulumi:
          requires:
            - build-image
          filters:
            branches:
              only: master
```

## 4. Deployment Rules Enforcement

### 4.1 Engineering Practices

To enforce our deployment rules:

1. **GitHub Branch Protection**
   - Require pull request reviews for the `infra/` directory
   - Block direct pushes to main/master
   - Require status checks to pass before merging

2. **Pull Request Templates**
   - Include checklist items for infrastructure changes
   - Require documentation updates for deployment changes
   - Explicitly ask if Pulumi is being used for all infrastructure

3. **CI Validation**
   - Run `pulumi preview` on all PRs to validate changes
   - Block merges that involve manual YAML changes
   - Verify all deployment code against best practices

4. **Documentation and Training**
   - Regular team training on Pulumi best practices
   - Clear documentation for all deployment processes
   - Troubleshooting guides that follow the rules

### 4.2 Monitoring and Compliance

1. **Regular Audits**
   - Scheduled reviews of all deployment processes
   - Verification that all cluster resources are managed by Pulumi
   - Check for any manual interventions

2. **Automated Alerting**
   - Set up alerts for any deployment outside the standard pipeline
   - Monitor for direct cluster access
   - Verify image sources match our CI system

## 5. Implementation Phases

### Phase 1: Pulumi Infrastructure Setup (7-10 tool calls)
- Set up Pulumi project and stack configuration
- Define core Kubernetes resources
- Configure persistent storage solutions
- Implement secret management

### Phase 2: CI/CD Pipeline Enhancement (5-7 tool calls)
- Configure CircleCI workflows for automated builds
- Set up proper image tagging and versioning
- Implement deployment verification steps
- Configure PR validation for infrastructure changes

### Phase 3: Monitoring and Observability (5-7 tool calls)
- Deploy Prometheus and Grafana using Pulumi
- Configure application metrics collection
- Set up logging infrastructure
- Create monitoring dashboards for game performance

### Phase 4: Documentation and Testing (3-5 tool calls)
- Document deployment processes
- Create runbooks for common scenarios
- Implement chaos testing to verify resilience
- Conduct load testing and verify autoscaling

## 6. Learning from v2 Codebase

In analyzing the DegenQuest-v2 codebase, we identified several issues to avoid:

1. **Inconsistent Deployment Methods**
   - Some components used direct YAML, others used scripts
   - Manual kubectl commands were documented for some operations

2. **Lack of Environment Separation**
   - Development and production environments used the same configurations
   - No clear separation between test and production data

3. **Docker Build Issues**
   - Local builds with inconsistent architecture support
   - No standardized tagging strategy

4. **Broken Client Code**
   - The Next.js implementation had issues that broke functionality
   - Unreliable client-server communication

For Milestone 3, we will adopt a more disciplined approach that addresses these issues through strict adherence to our deployment rules.

## 7. Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Pulumi state corruption | Regular state backups, documented recovery process |
| CI pipeline failures | Fallback deployment option *using Pulumi CLI* (never manual kubectl) |
| Cluster resource exhaustion | Implement resource quotas and limits, set up monitoring |
| Data loss | Configure regular database backups with automated testing |
| Security vulnerabilities | Regular scanning of images, secrets rotation, network policies |

## 8. Success Metrics

Milestone 3 will be considered successful when:

1. 100% of infrastructure is defined and managed with Pulumi
2. Zero manual Kubernetes operations for deployments
3. All images are built and pushed exclusively through CI
4. Deployment time is reduced by at least 50%
5. Rollbacks can be performed in under 5 minutes
6. Complete documentation of the entire deployment process
7. Monitoring shows 99.9% uptime for production services

## Conclusion

Milestone 3 represents a critical evolution in our deployment practices. By adhering strictly to our deployment rules—never writing YAML directly, using Pulumi for all infrastructure, and building images only through CI—we will achieve a robust, repeatable, and maintainable deployment process for DegenQuest-v3.

The lessons learned from the v2 codebase will inform our approach, helping us avoid the pitfalls of inconsistent deployment methods, lack of environment separation, and manual operations. With this infrastructure-as-code foundation, we'll be well-positioned for future expansions and improvements to the game platform. 