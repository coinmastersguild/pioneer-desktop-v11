# Manual Release Branch Creation Instructions

Since we're experiencing issues with running git commands through scripts, this document provides step-by-step instructions for manually creating release branches following our Git Flow model.

## Prerequisites

- Git installed on your machine
- Access to the DegenQuest repository
- Permission to create branches and push to the repository

## Step 1: Make Sure You're on Develop Branch

```bash
# Check current branch
git status

# If not on develop, switch to it
git checkout develop

# Pull latest changes
git pull origin develop
```

## Step 2: Ensure Develop is Clean

Make sure you don't have any uncommitted changes on develop:

```bash
# Check for uncommitted changes
git status
```

If you see any uncommitted changes, either commit them appropriately or stash them:

```bash
# Option 1: Commit changes
git add .
git commit -m "Your commit message"

# Option 2: Stash changes
git stash
```

## Step 3: Create the Release Branch

You can create a release branch using one of two methods:

### Method 1: Using the automated script (Recommended)

We've created a script that automates version incrementing and branch creation:

```bash
# For a patch release (1.0.0 → 1.0.1)
./scripts/increment-version.sh patch --create-branch

# For a minor release (1.0.0 → 1.1.0)
./scripts/increment-version.sh minor --create-branch

# For a major release (1.0.0 → 2.0.0)
./scripts/increment-version.sh major --create-branch
```

The script will:
1. Increment the version in package.json
2. Create a release branch with the correct naming convention
3. Commit the version change
4. Provide instructions for pushing the branch

### Method 2: Manual process

If you prefer to create the release branch manually:

```bash
# Format should be release/vX.Y.Z
git checkout -b release/v1.0.0
```

Adjust the version number according to your release plan:
- Major version (X): Significant changes that may break compatibility
- Minor version (Y): New features that don't break compatibility
- Patch version (Z): Bug fixes and minor changes

## Step 4: Update Version in package.json

Skip this step if you used the automated script in Method 1, as it already updates the version.

If you created the branch manually, edit the package.json file to reflect the new version number:

1. Open package.json in your text editor
2. Find the "version" field
3. Update it to match your release version
4. Save the file

Then commit this change:

```bash
git add package.json
git commit -m "Bump version to 1.0.0"
```

## Step 5: Push the Release Branch

Push the release branch to the remote repository:

```bash
git push -u origin release/v1.0.0
```

## Step 6: Monitor Deployment to Staging

Once the release branch is pushed, CI/CD should automatically deploy to staging:

1. Check CircleCI for build status
2. Monitor the deployment process
3. Verify the application in the staging environment

## Step 7: Create Release Pull Request

When staging testing is complete and you're ready to deploy to production:

1. Go to GitHub
2. Create a new pull request
3. Set the base branch to `main`
4. Set the compare branch to your release branch (`release/v1.0.0`)
5. Add a description of the release changes
6. Submit the pull request for review

## Step 8: After Release PR is Merged

After the release PR is merged to `main`:

```bash
# Checkout main
git checkout main

# Pull latest changes
git pull origin main

# Create a tag for the release
git tag -a v1.0.0 -m "Version 1.0.0"

# Push the tag
git push origin v1.0.0

# Checkout develop
git checkout develop

# Pull latest changes
git pull origin develop

# Merge the release branch back to develop
git merge --no-ff release/v1.0.0

# Push the updated develop branch
git push origin develop

# Optionally, delete the release branch locally and remotely
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

## Troubleshooting

If you encounter any issues during this process:

- **Permission issues**: Ensure you have the necessary repository permissions
- **Merge conflicts**: Resolve conflicts carefully, consulting with team members if needed
- **Failed CI/CD builds**: Check the logs for specific errors and fix them
- **Deployment issues**: Verify environment configuration and credentials

For any persistent issues, contact the DevOps team. 