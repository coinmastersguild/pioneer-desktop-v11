# Deployment Workflow and Responsibilities

## Core Principles

1. **DevOps Team Ownership**
   - All initial infrastructure setup for new projects
   - Management of Pulumi infrastructure code
   - Major infrastructure changes and updates
   - Production environment configuration
   - Security and compliance monitoring

2. **Developer Responsibilities**
   - Push container images to DigitalOcean Registry
   - Use k8s tools for inspection and monitoring
   - Make minor configuration tweaks through approved processes
   - Report infrastructure issues to DevOps team

## New Project Setup Process

1. **Initial Request**
   - Developer creates project setup request ticket
   - Includes project requirements and specifications
   - DevOps team reviews and approves request

2. **Infrastructure Setup by DevOps**
   - Create Pulumi infrastructure code
   - Set up Kubernetes namespace and resources
   - Configure CI/CD pipelines
   - Set up monitoring and logging
   - Create necessary DigitalOcean resources

3. **Handoff to Development Team**
   - DevOps provides documentation
   - Sets up access controls
   - Conducts knowledge transfer session
   - Establishes monitoring alerts

## Ongoing Development Workflow

### Developer Actions
✅ **Allowed**:
- Push images to DigitalOcean Registry
- View logs and monitoring data
- Scale resources within predefined limits
- Make minor configuration updates
- Request infrastructure changes

❌ **Not Allowed**:
- Direct Kubernetes YAML modifications
- Manual kubectl apply commands
- Infrastructure changes without DevOps review
- Direct production access without approval

### DevOps Team Actions
- Review and approve infrastructure changes
- Manage Pulumi state and configurations
- Handle major version upgrades
- Manage cluster-wide resources
- Monitor system health and performance

## Infrastructure Change Process

1. **Minor Changes (Developers)**
   ```
   Developer identifies need
          ↓
   Use approved k8s tools
          ↓
   Document changes made
          ↓
   Monitor for issues
   ```

2. **Major Changes (DevOps Required)**
   ```
   Developer creates request
          ↓
   DevOps team reviews
          ↓
   Infrastructure update plan
          ↓
   Implementation by DevOps
          ↓
   Validation and monitoring
   ```

## Deployment Protocol

1. **Image Management**
   - All images must be pushed to DigitalOcean Registry
   - Follow standard naming convention:
     ```
     registry.digitalocean.com/[project]/[service]:{GIT_SHA}-{ENV}
     ```
   - Tag latest images appropriately:
     ```
     registry.digitalocean.com/[project]/[service]:latest-{ENV}
     ```

2. **Deployment Process**
   - CircleCI builds and pushes images
   - Pulumi handles all infrastructure updates
   - DevOps team manages Pulumi state
   - Developers monitor deployment health

3. **Monitoring and Maintenance**
   - Developers use provided dashboards
   - Report issues to DevOps team
   - Follow incident response procedures
   - Document any temporary fixes

## Emergency Procedures

1. **Production Issues**
   - Immediately notify DevOps team
   - Use approved rollback procedures
   - Document incident details
   - Wait for DevOps team guidance

2. **Urgent Changes**
   - Request emergency DevOps review
   - Follow expedited approval process
   - Document all actions taken
   - Schedule post-incident review

## Communication Channels

1. **Regular Changes**
   - Create JIRA ticket
   - Tag appropriate DevOps team
   - Include all relevant details
   - Follow up in team channels

2. **Urgent Issues**
   - Use emergency Slack channel
   - Call on-call DevOps engineer
   - Create incident ticket
   - Update status page

## Compliance and Auditing

1. **Change Documentation**
   - Log all infrastructure changes
   - Record deployment details
   - Document configuration updates
   - Maintain audit trail

2. **Regular Reviews**
   - Weekly deployment audits
   - Monthly security reviews
   - Quarterly compliance checks
   - Annual process evaluation

Remember: When in doubt, always consult with the DevOps team before making any infrastructure changes. This ensures system stability and maintains our security standards. 