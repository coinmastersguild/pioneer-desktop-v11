# Cycle Testing Protocol

**Version**: 1.0  
**Last Updated**: 2025-03-24  
**Status**: Active

## 1. Introduction

The Cycle Testing Protocol is a critical component of the Guild Protocol that defines how testing should be conducted during and at the conclusion of each sprint. This document outlines the principles, requirements, and processes for effective cycle testing.

## 2. Core Principles

### 2.1 Definition of a Cycle

A **cycle** in the Guild Protocol is defined as:

1. **Change**: Implementing a modification to the system
2. **Restart**: Restarting the environment with the change applied
3. **Test**: Verifying that the environment is functioning correctly after the change

### 2.2 Cycle Time

**Cycle time** refers to the total time required to complete one full cycle, from initiating a change to confirming system stability after the change. Minimizing cycle time is a key performance indicator for team efficiency.

### 2.3 Key Objectives

- **Validate System Stability**: Ensure that any change does not destabilize the environment
- **Measure Cycle Efficiency**: Track and optimize the time required to implement and validate changes
- **Standardize Testing**: Establish consistent testing patterns across all environments
- **Detect Regression**: Identify any regressions introduced by changes

## 3. Required Process

### 3.1 Pre-Cycle Requirements

Before initiating a cycle test, ensure:

- All code changes are committed
- The environment is in a known state
- The cycle testing tools are available (`test-cycle.sh`)

### 3.2 Cycle Testing Steps

Every cycle test MUST follow these steps:

1. **Baseline Status Check**:
   - Verify the current state of the environment
   - Document any existing issues

2. **Implement Change**:
   - Make the required code/configuration changes
   - Build the application if necessary

3. **Environment Restart**:
   - Stop the current environment
   - Start the environment with the new changes
   - Record restart time

4. **Validation Testing**:
   - Perform health checks to verify system functionality
   - Run specific tests relevant to the change
   - Record test results

5. **Cycle Time Measurement**:
   - Calculate the total time from change initiation to validation completion
   - Record and analyze the cycle time

### 3.3 Documentation Requirements

For each cycle test, document:

- Date and time of the test
- Environment tested (local, docker, dev, prod)
- Nature of the change implemented
- Cycle time measurements
- Any issues encountered
- Resolution of issues (if any)

## 4. Sprint Integration

### 4.1 Sprint Planning

During sprint planning, teams MUST:

- Include cycle testing tasks for all major changes
- Allocate time for cycle testing in sprint estimates
- Define success criteria for cycle tests

### 4.2 Sprint Execution

During sprint execution:

- Conduct cycle tests for all significant changes
- Track cycle times and look for optimization opportunities
- Address any issues identified during cycle testing immediately

### 4.3 Sprint Review

During sprint review:

- Present results of cycle tests
- Analyze cycle time trends
- Identify improvements for future sprints

### 4.4 Definition of Done

A sprint is NOT considered complete until:

- All planned changes have been cycle tested
- All environments are stable after changes
- Cycle test results are documented
- Any cycle testing issues are resolved

## 5. Tools and Implementation

### 5.1 Standard Tools

The Guild Protocol provides standard tools for cycle testing:

- `test-cycle.sh`: Script for executing standardized cycle tests
- Cycle time measurement utilities
- Health check endpoints in applications

### 5.2 Tool Usage

```bash
# Execute a cycle test in the local environment
./skills/test-cycle.sh local

# Execute a cycle test in the Docker environment
./skills/test-cycle.sh docker

# Execute a cycle test in the development environment
./skills/test-cycle.sh dev

# Execute a cycle test in the production environment
./skills/test-cycle.sh prod
```

## 6. Best Practices

### 6.1 Optimizing Cycle Time

To improve cycle time:

- Implement efficient build processes
- Automate environment setup and teardown
- Optimize test execution
- Parallelize tests where possible
- Minimize external dependencies

### 6.2 Common Mistakes to Avoid

| ❌ Incorrect Practice | ✅ Correct Practice |
|----------------------|-------------------|
| Skipping cycle testing in a sprint | Including cycle testing for all significant changes |
| Manual, unstandardized testing | Using the standardized `test-cycle.sh` tool |
| Not measuring cycle time | Recording and analyzing cycle time metrics |
| Ignoring failed cycle tests | Resolving all issues before marking a sprint as complete |
| Testing only in one environment | Conducting cycle tests across all relevant environments |

## 7. Conclusion

Adherence to the Cycle Testing Protocol is mandatory for all Guild Protocol projects. By following these guidelines, teams ensure stable, reliable systems and continuously improve their development efficiency through cycle time optimization.

**Remember**: A sprint without cycle testing is an incomplete sprint.
