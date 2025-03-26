# Skills Implementation Guide

**Version**: 1.0  
**Last Updated**: 2025-03-24
**Status**: Active

This document provides strict guidelines and requirements for implementing skills within the Guild Protocol. Following these requirements is **MANDATORY** for all skill development.

## 1. Core Definition: What is a Skill?

### 1.1 Definition

A **skill** in the Guild Protocol is:

- A **shell script** (bash) that performs a specific, focused task
- Executable from the command line with clear input/output patterns
- Located in the `/skills` directory with the `.sh` extension
- Named descriptively according to its function (e.g., `gmail-auth.sh`, `deploy.sh`)

### 1.2 Key Properties

Skills MUST have the following properties:

- **Self-contained**: Minimal external dependencies
- **Executable**: Has proper permissions (`chmod +x`) 
- **Documented**: Contains clear header comments explaining usage
- **Focused**: Performs a specific function, following Unix philosophy
- **Parameterized**: Uses command-line arguments for configuration
- **Error-handling**: Reports errors in a standardized way
- **Status feedback**: Communicates progress and results clearly

### 1.3 ❌ PROHIBITED Implementations

The following implementations are strictly **PROHIBITED**:

- ❌ Skills implemented as TypeScript/JavaScript files
- ❌ Skills implemented in Python, Go, or other programming languages
- ❌ Skills without clear documentation headers
- ❌ Skills that have complex dependencies not documented
- ❌ Skills with hardcoded configuration that should be parameterized

## 2. Required Skill Structure

### 2.1 Mandatory File Structure

Every skill MUST follow this file structure:

```bash
#!/bin/bash
# skill-name.sh - Short description
# 
# Detailed description explaining the purpose of this skill
# and how it should be used in the workflow.
#
# Usage: ./skill-name.sh <command> [options]
#   Commands:
#     command1  - Description of command1
#     command2  - Description of command2
#
# Example: 
#   ./skill-name.sh command1 --option value
#
# Author: Your Name
# Last Updated: YYYY-MM-DD

# Exit on errors
set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Main function definitions

# Command implementations

# Main function to handle commands
main() {
  # Parse commands and arguments
  # Execute appropriate functionality
}

# Execute main function
main "$@"
```

### 2.2 Documentation Requirements

Every skill MUST include the following documentation:

- File header with name and purpose
- Usage instructions with all commands
- Examples of common use cases
- Environment variable requirements
- Error scenarios and troubleshooting

## 3. Skill Development Workflow

### 3.1 Development Process

1. **Read Documentation First**:
   - Review all existing skills in `/skills` to understand patterns
   - Read relevant protocol documentation
   - Review the skills implementation guide (this document)

2. **Plan and Document**:
   - Document the skill purpose and requirements before implementation
   - Define the interface (commands, arguments, output formats)
   - Identify dependencies and environment requirements

3. **Implementation**:
   - Create the shell script following the template
   - Implement required functionality
   - Add detailed comments
   - Ensure proper error handling

4. **Testing**:
   - Test the skill with various inputs
   - Verify error handling works correctly
   - Check documentation accuracy

### 3.2 Validation Checklist

Before submitting a skill, validate that:

- [ ] Skill is implemented as a bash script (`.sh` extension)
- [ ] File has executable permissions (`chmod +x`)
- [ ] Documentation header is complete
- [ ] All required sections are implemented
- [ ] Error handling is robust
- [ ] No hardcoded sensitive information
- [ ] Environment variable handling is correct
- [ ] Script follows shell script best practices

## 4. Skill Examples

### 4.1 Example: Authentication Skill

```bash
#!/bin/bash
# auth.sh - Authentication management skill
# 
# This skill manages authentication with external services,
# including token generation, validation, and renewal.
#
# Usage: ./auth.sh <command> <service> [options]
#   Commands:
#     login    - Authenticate with a service
#     status   - Check authentication status
#     revoke   - Revoke authentication tokens
#
# Example: 
#   ./auth.sh login gmail --user user@example.com

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/.env"

# Main command functions
cmd_login() {
  local service="$1"
  shift
  
  case "$service" in
    gmail)
      # Gmail authentication logic
      ;;
    github)
      # GitHub authentication logic
      ;;
    *)
      echo "Unknown service: $service"
      echo "Supported services: gmail, github"
      return 1
      ;;
  esac
}

cmd_status() {
  local service="$1"
  # Status check logic
}

cmd_revoke() {
  local service="$1"
  # Revocation logic
}

# Main function
main() {
  local command="$1"
  shift
  
  if [ -z "$command" ]; then
    echo "Usage: $0 <command> <service> [options]"
    echo "Commands: login, status, revoke"
    exit 1
  fi
  
  case "$command" in
    login)
      cmd_login "$@"
      ;;
    status)
      cmd_status "$@"
      ;;
    revoke)
      cmd_revoke "$@"
      ;;
    *)
      echo "Unknown command: $command"
      echo "Commands: login, status, revoke"
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
```

### 4.2 Example: Deployment Skill

```bash
#!/bin/bash
# deploy.sh - Deployment management skill
# 
# This skill handles deployment of the application to different environments.
#
# Usage: ./deploy.sh <environment> [options]
#   Environments:
#     local     - Deploy to local environment
#     staging   - Deploy to staging environment
#     production - Deploy to production environment
#
# Example: 
#   ./deploy.sh local --port 3000

set -e

# Deployment functions
deploy_local() {
  echo "Deploying to local environment..."
  # Local deployment logic
}

# Main function
main() {
  local environment="$1"
  shift
  
  if [ -z "$environment" ]; then
    echo "Usage: $0 <environment> [options]"
    echo "Environments: local, staging, production"
    exit 1
  fi
  
  case "$environment" in
    local)
      deploy_local "$@"
      ;;
    staging)
      # Staging deployment logic
      ;;
    production)
      # Production deployment logic
      ;;
    *)
      echo "Unknown environment: $environment"
      echo "Environments: local, staging, production"
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
```

## 5. Common Mistakes and How to Avoid Them

### 5.1 Prohibited Implementation Patterns

| ❌ Incorrect | ✅ Correct |
|-------------|----------|
| Implementing skills as a TypeScript file | Implementing skills as bash scripts with .sh extension |
| Complex multi-file skills | Self-contained single file bash scripts |
| Hardcoded configuration | Using environment variables or configuration files |
| No documentation | Complete documentation in header comments |
| No error handling | Robust error handling with informative messages |

### 5.2 Mistake: Programming Language Choice

❌ **INCORRECT**:
```typescript
// gmail-auth.ts
import { OAuth2Client } from 'google-auth-library';

export class GmailAuthService {
  // TypeScript implementation
}
```

✅ **CORRECT**:
```bash
#!/bin/bash
# gmail-auth.sh - Gmail authentication skill

# Bash implementation
```

### 5.3 Mistake: Missing Documentation

❌ **INCORRECT**:
```bash
#!/bin/bash
# Simple function to do stuff

function do_stuff() {
  # ...
}

do_stuff
```

✅ **CORRECT**:
```bash
#!/bin/bash
# deploy.sh - Deployment management skill
# 
# This skill handles deployment of the application to different environments.
#
# Usage: ./deploy.sh <environment> [options]
#   Environments:
#     local     - Deploy to local environment
#     staging   - Deploy to staging environment
#     production - Deploy to production environment
#
# Example: 
#   ./deploy.sh local --port 3000

# Function implementation
```

## 6. Skill Verification

Before submitting a new skill or updating an existing one, run the following verification steps:

1. Check file permissions:
   ```
   ls -la /path/to/skill.sh
   ```
   Ensure it shows executable permissions (`-rwxr-xr-x`)

2. Verify file extension:
   ```
   [[ $(basename /path/to/skill.sh) == *.sh ]] && echo "Valid" || echo "Invalid"
   ```

3. Check shebang line:
   ```
   head -n 1 /path/to/skill.sh | grep '#!/bin/bash'
   ```

4. Validate documentation:
   ```
   grep -A 10 "Usage:" /path/to/skill.sh
   ```

5. Test execution:
   ```
   /path/to/skill.sh --help
   ```

## 7. Migration Guide

If you have implemented skills in non-conformant ways, follow these steps to migrate:

1. Identify all non-bash skills in the `/skills` directory
2. For each skill:
   - Create a new bash script with the same name but `.sh` extension
   - Implement the same functionality in bash
   - Add proper documentation header
   - Make executable with `chmod +x`
   - Test thoroughly
   - Delete the non-conformant implementation

## 8. Conclusion

Adhering to these guidelines ensures that skills are implemented consistently across the project, making them easier to understand, use, and maintain. All developers are required to follow these guidelines without exception.

**IMPORTANT**: Always read this guide thoroughly before implementing any skill. Failure to follow these guidelines will result in rejection of contributions.
