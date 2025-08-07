# Version Management

This project uses a streamlined version management system that maintains consistency between `package.json` and the Convex deployment database.

## How It Works

### Single Source of Truth

- **package.json**: Contains the canonical version (e.g., `"0.1.0"`)
- **Deployment Database**: Automatically stores version with `v` prefix (e.g., `"v0.1.0"`)

### Automatic Synchronization

The system automatically handles the version format conversion:

- `package.json` version: `0.1.0` (no prefix)
- Database version: `v0.1.0` (with prefix)
- Git tags: `v0.1.0` (with prefix)

## Version Bumping

### Manual (Local Development)

```bash
# Patch version (0.1.0 → 0.1.1)
npm run version:patch

# Minor version (0.1.0 → 0.2.0)
npm run version:minor

# Major version (0.1.0 → 1.0.0)
npm run version:major
```

### Automatic (GitHub Actions)

The GitHub Actions workflow automatically bumps versions based on:

1. **Manual Trigger**: Choose patch/minor/major from workflow dispatch
2. **Commit Message Keywords**:
   - `BREAKING CHANGE` or `[major]` → major bump
   - `feat` or `[minor]` → minor bump
   - Everything else → patch bump

### What Happens During Version Bump

1. **Update package.json**: Version is bumped (e.g., `0.1.0` → `0.1.1`)
2. **Update Convex Database**: Version is stored with `v` prefix (`v0.1.1`)
3. **Create Git Tag**: Tag created with `v` prefix (`v0.1.1`)
4. **GitHub Release**: Release created with proper versioning

## Files Involved

- `package.json`: Source of truth for version number
- `scripts/update-deployment-info.js`: Handles database updates
- `.github/workflows/version-bump.yml`: Automated version management
- `convex/deployment.ts`: Database functions for version tracking

## Benefits

- **No Duplication**: Only maintain version in `package.json`
- **Consistent Format**: Automatic `v` prefix handling
- **Automated**: Works with both manual and CI/CD workflows
- **Backward Compatible**: Existing deployment data remains intact
