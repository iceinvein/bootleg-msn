# Version Management

This document explains how automatic version bumping works in the Bootleg MSN Messenger project.

## How It Works

### Automatic Version Bumping

Every push to the `main` branch triggers an automatic version bump based on the commit message:

- **Patch version** (0.0.X): Default for most commits
- **Minor version** (0.X.0): Commits containing "feat" or "[minor]"
- **Major version** (X.0.0): Commits containing "BREAKING CHANGE" or "[major]"

### GitHub Action Workflow

The `.github/workflows/version-bump.yml` workflow:

1. Analyzes commit messages to determine bump type
2. Updates `package.json` version
3. Updates deployment info in Convex database
4. Creates a Git tag
5. Pushes changes back to main
6. Creates a GitHub release

### Required Secrets

For the workflow to work, you need these GitHub repository secrets:

- `VITE_CONVEX_URL`: Your Convex deployment URL
- `CONVEX_DEPLOY_KEY`: Your Convex deployment key

### Manual Version Bumping

You can also bump versions manually:

```bash
# Bump patch version (0.0.X)
pnpm version:patch

# Bump minor version (0.X.0)
pnpm version:minor

# Bump major version (X.0.0)
pnpm version:major
```

### Version Display

The current version is displayed in the app using:

- `VersionInfo` component: Shows version and deployment time
- `VersionBadge` component: Compact version display

### Database Integration

Version information is stored in the `deploymentInfo` table in Convex:

- `version`: The semantic version string
- `timestamp`: Unix timestamp of deployment
- Only the last 10 deployments are kept

### Skipping Version Bumps

To skip automatic version bumping, include `[skip ci]` in your commit message.

## Example Commit Messages

```bash
# Patch version bump
git commit -m "fix: resolve login issue"

# Minor version bump  
git commit -m "feat: add dark mode support"

# Major version bump
git commit -m "BREAKING CHANGE: redesign authentication flow"

# Skip version bump
git commit -m "docs: update README [skip ci]"
```

## Troubleshooting

### Workflow Fails

1. Check that required secrets are set in GitHub repository settings
2. Ensure Convex deployment is accessible
3. Verify the workflow has write permissions to the repository

### Version Not Updating in App

1. Check that the Convex function `deployment.updateDeploymentInfo` exists
2. Verify the database schema includes the `deploymentInfo` table
3. Ensure the app is querying `api.deployment.getCurrentVersion`

### Manual Version Bump Fails

1. Ensure you have the latest changes: `git pull origin main`
2. Check that the `scripts/update-deployment-info.js` file exists
3. Verify your `.env.local` has the correct `VITE_CONVEX_URL`
