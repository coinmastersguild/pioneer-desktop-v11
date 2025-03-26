# Project State Guide: Pre-Production vs. Production

**Document Version**: 1.0  
**Last Updated**: 2025-03-24 15:05  
**Status**: ACTIVE

## Overview

This guide explains the differences between Pre-Production and Production states in the KeepKey Support Email project, and how they affect sprint priorities, deployment processes, and focus areas.

## Pre-Production State (Current)

### Definition
The project is currently in **Pre-Production State** - we have not yet deployed to production and are building toward first production deployment.

### Focus: Forward Progression
In Pre-Production state, we focus on "forward progression" through environments:
```
Local → Local Docker → Development → Feature → Production
```

### Key Principles

1. **Keep Local GREEN** at all times as our stable foundation
2. **Progress forward** through each environment systematically
3. **Build for production** but don't require all environments to be GREEN yet
4. **Testing in lower environments** to ensure stability before moving up

### Example Sprint Approach
In the current Pre-Production state, our Sprint 3 would focus on:

1. Maintain Local environment's GREEN status
2. Complete Docker E2E tests to turn Local Docker GREEN
3. Set up and deploy Development environment
4. Document progress and prepare for Feature environments

## Production State (Future)

### Definition
A project enters **Production State** once it has been deployed to production and is serving real users.

### Focus: Backward Protection
In Production state, we focus on "backward protection" through environments:
```
Production → Feature → Development → Local Docker → Local
```

### Key Principles

1. **Keep Production GREEN** at all times - highest priority
2. **Fix failures starting with Production** and work backward
3. **All environments must be GREEN** before new feature work
4. **Testing in all environments** before promoting code

### Example Sprint Approach
In a hypothetical Production state, our Sprint 3 would focus on:

1. Fix any RED status in Production (top priority)
2. Fix any RED status in Feature environments
3. Fix any RED status in Development
4. Only then address Docker or Local issues
5. Only after all environments are GREEN, implement new features

## What "Backward" Means in Production State

Working "backward" in a Production state means:

1. **Priority Reversal**: Production issues are fixed before lower environment issues
2. **Change Flow**: Changes flow upward, but verification flows downward
3. **Protection Focus**: We protect Production by ensuring all lower environments replicate it
4. **Breaking Change Guard**: Any breaking change must be caught in lower environments

### Backward Workflow Example

In Production state, if a critical bug is found:

1. Fix is first verified in Local
2. Then tested in Local Docker
3. Then deployed to Development
4. Then tested in Feature environments
5. Finally deployed to Production

But the *priority* of which bugs to fix follows the reverse order:
- Production bugs fixed before Feature bugs
- Feature bugs fixed before Development bugs
- And so on...

## Current Status and Approach

As we are currently in **Pre-Production State**:

1. We maintain Local as GREEN
2. We work on Docker environment next (forward progression)
3. We don't yet require Production to be GREEN
4. We document our progress toward first production deployment

When we eventually deploy to Production and enter Production State, we will switch to the backward protection model where all environments must be GREEN and Production health is our top priority.

## Guild Protocol Compliance

Both Pre-Production and Production states must adhere to Guild Protocol:
- Honest status reporting
- Proper documentation
- Formal verification processes
- No skipping environments
