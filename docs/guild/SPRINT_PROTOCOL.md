# Guild Sprint Protocol

## Overview

This document defines the Guild's sprint protocol for managing AI-assisted development iterations. Each user prompt is treated as a sprint, with formal tracking, documentation, and status reporting.

## Project States

The project can exist in one of two states which affect protocol requirements:

### 1. Pre-Production State

**Definition**: The project has not yet been deployed to production environment.

**Rules**:
- Focus on "forward progression" (Local → Docker → Dev → Feature → Prod)
- Keep Local environment GREEN at all times
- Other environments may be YELLOW or RED while being developed
- Success measured by forward progress toward production readiness

### 2. Production State

**Definition**: The project has been deployed to production environment.

**Rules**:
- Focus on "backward protection" (Prod → Feature → Dev → Docker → Local)
- ALL environments must be GREEN before new feature work
- RED statuses must be fixed immediately, starting with Production
- Success measured by stability and reliability across all environments

## Sprint Structure

### 1. Sprint Initialization

Every sprint begins with:
- Sprint number assignment (incremental)
- Timestamp recording
- Initial status report review
- Red flag identification and prioritization

### 2. Sprint Components

Each sprint must include:
```
/docs/sprints/
  └── sprint_[NUMBER]/
      ├── sprint.md             # Sprint details and prompt
      ├── status_report.md      # Pre and post sprint status
      ├── changes.md            # Changes made during sprint
      └── review.md             # Sprint retrospective
```

### 3. Sprint Documentation Format

#### sprint.md
```markdown
# Sprint [NUMBER]
Timestamp: [ISO 8601 FORMAT]

## Original Prompt
[EXACT USER PROMPT]

## Interpreted Goals
- [GOAL 1]
- [GOAL 2]
...

## Focus Areas
- [AREA 1]
- [AREA 2]
...

## Red Flags from Previous Sprint
- [RED FLAG 1] - [MITIGATION PLAN]
- [RED FLAG 2] - [MITIGATION PLAN]
...
```

#### status_report.md
```markdown
# Sprint [NUMBER] Status Report

## Pre-Sprint Status
### System Health
- 🟢 [GREEN ITEM]
- 🔴 [RED ITEM]
- 🟡 [YELLOW ITEM]

### Critical Metrics
- [METRIC 1]: [VALUE]
- [METRIC 2]: [VALUE]
...

## Post-Sprint Status
[SAME FORMAT AS PRE-SPRINT]

## Status Changes
- [ITEM]: 🔴 → 🟢
- [ITEM]: 🟡 → 🔴
...
```

### 4. Red Flag Protocol

When a red flag is identified:
1. Document in status report
2. Prioritize addressing in current sprint
3. If cannot be resolved in current sprint:
   - Document mitigation plan
   - Carry forward to next sprint
   - Track in sprint.md red flags section

## Sprint Workflow

1. **Sprint Initialization**
   ```
   New user prompt received
          ↓
   Create sprint directory
          ↓
   Generate status report
          ↓
   Identify red flags
   ```

2. **Sprint Execution**
   ```
   Document interpreted goals
          ↓
   Address red flags
          ↓
   Implement changes
          ↓
   Update documentation
   ```

3. **Sprint Completion**
   ```
   Generate final status
          ↓
   Document changes
          ↓
   Create retrospective
          ↓
   Prepare for next sprint
   ```

## Status Reporting Requirements

### Full Environment Status Reporting

**CRITICAL REQUIREMENT**: Every sprint must end with a complete status report of ALL environments, not just production.

The status report must include:
- Local Environment status (GREEN/YELLOW/RED)
- Local Docker status (GREEN/YELLOW/RED)
- Development Environment status (GREEN/YELLOW/RED)
- Feature Environments status (GREEN/YELLOW/RED)
- Production Environment status (GREEN/YELLOW/RED)

This comprehensive reporting is required regardless of project state (Pre-Production or Production).

### Status Format

Status must be reported in a consistent format:
```
Environment: STATUS - Last updated: [datetime] - [details]
```

Example:
```
Local: GREEN - Last updated: 2025-03-24 - Health endpoint with version verified
```

### Status Visualization

Where possible, statuses should be visualized for at-a-glance understanding:
- GREEN (🟢) - Environment is fully functional and tested
- YELLOW (🟡) - Environment is partially functional or tests pending
- RED (🔴) - Environment is non-functional or not configured

## Status Report Categories

### System Components
- 🟢 Healthy/Complete
- 🟡 Warning/Needs Attention
- 🔴 Critical/Broken

### Required Categories
1. Documentation Health
2. Test Coverage
3. Build Status
4. Deployment Status
5. Performance Metrics
6. Security Status
7. Technical Debt
8. User Experience

## Status Priority Rules

### Pre-Production State Priority

1. Keep Local GREEN at all times
2. Focus on moving forward in the pipeline:
   - Local Docker → GREEN
   - Develop Environment → GREEN
   - Feature Environments → GREEN
   - Production → GREEN

### Production State Priority

If any environment has a RED status:

1. Fix Production first
2. Fix Feature Environments second
3. Fix Develop Environment third
4. Fix Local Docker fourth
5. Fix Local last

## YELLOW Status Protocol

If any environment has a YELLOW status:

1. The cause of the YELLOW status must be documented
2. Work should include steps to move YELLOW to GREEN if possible
3. A plan for reaching GREEN must be outlined

## Implementation Rules

1. **Every** user prompt must be treated as a sprint
2. **Every** sprint must have complete documentation
3. **All** red flags must be addressed or have mitigation plans
4. Status reports must be generated pre and post sprint
5. Sprint numbers must be sequential
6. Timestamps must be in ISO 8601 format
7. All documentation must be in Markdown format

## Automation Requirements

The following scripts should be maintained:
- `create_sprint.sh`: Initialize sprint directory and files
- `generate_status.sh`: Create status reports
- `finalize_sprint.sh`: Complete sprint documentation

## Auditing and Compliance

- All sprints must be trackable
- Status changes must be justified
- Red flags must have resolution or mitigation
- Sprint documentation must be immutable once finalized
- **ALL environment statuses must be reported at sprint completion**

## Protocol Violation Handling

Violations of this protocol must be:
1. Documented in a Protocol Violation Report
2. Addressed with specific corrective actions
3. Reviewed to prevent recurrence
4. Used to improve documentation and tooling

## Conclusion

This protocol ensures consistent tracking and documentation of all development iterations, with a focus on maintaining system health and addressing issues proactively.
