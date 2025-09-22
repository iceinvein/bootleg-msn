# Deployment System Documentation

## Overview

The deployment system provides real-time update notifications to users when new versions are available. It uses Convex as the source of truth for deployment state and service workers for fast client-side detection.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │     Convex      │    │     Client      │
│   Deployment    │    │   (Source of    │    │   (Browser)     │
│                 │    │    Truth)       │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 1. Build        │    │ • Deployment    │    │ • Service       │
│ 2. Generate     │───▶│   Releases      │◀───│   Worker        │
│    build.json   │    │ • App Policies  │    │ • Update        │
│ 3. Deploy       │    │ • Verification  │    │   Notifications │
│ 4. Post-deploy  │    │                 │    │ • Force Update  │
│    hooks        │    │                 │    │   Overlay       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Components

### 1. Build Metadata
- **BUILD_ID**: Format `{commit}.{timestamp}` (e.g., `abc123.1703980800000`)
- **CHANNEL**: Deployment channel (`prod`, `staging`, etc.)
- **build.json**: Public artifact containing build metadata

### 2. Convex Backend
- **deploymentReleases**: Tracks all deployments per channel
- **appPolicies**: Manages force update policies
- **Verification**: Ensures Netlify is serving the new build before marking as live

### 3. Client Detection
- **Service Worker**: Broadcasts BUILD_ID on activation
- **UpdateNotification**: Shows toast when updates available
- **ForceUpdateOverlay**: Blocks UI when force update required

## Deployment Flow

### Automatic (Production)

1. **Build Phase**:
   ```bash
   # Netlify runs:
   npx convex deploy --cmd 'pnpm build:netlify'
   # Which includes:
   node scripts/write-build-json.js && vite build
   ```

2. **Post-Deploy Phase**:
   ```bash
   # After successful deployment:
   node scripts/post-deploy.js
   ```

3. **Convex Integration**:
   - `beginDeployment`: Registers new build as "publishing"
   - `verifyAndPublish`: Polls build.json until available, marks as "live"

4. **Client Detection**:
   - Service worker fetches `/build.json` on activation
   - Broadcasts BUILD_ID to all clients
   - Clients query Convex to check for updates

### Manual Testing

```bash
# Test the complete flow
pnpm test:deployment

# Test individual components
pnpm test  # Unit tests
```

## Admin Operations

### List Recent Deployments
```bash
pnpm deployment:admin list-releases prod
pnpm deployment:admin list-releases staging
```

### Check Deployment Status
```bash
pnpm deployment:admin status prod
```

### Force Update Management

#### Set Force Update Policy
```bash
# Force all clients older than timestamp to update
pnpm deployment:admin set-force-update prod 1703980800000 "Critical security update required"
```

#### Clear Force Update Policy
```bash
pnpm deployment:admin clear-force-update prod
```

### Rollback (Manual Process)
1. Find the target build ID:
   ```bash
   pnpm deployment:admin list-releases prod
   ```

2. Mark previous build as live (requires manual Convex function call):
   ```bash
   npx convex run deployment:internalMarkReleaseLive '{"id":"<release-id>"}'
   ```

## Environment Variables

### Netlify Build Environment
```toml
# netlify.toml
[build.environment]
  BUILD_ID = "${COMMIT_REF}.${DEPLOY_ID}"
  GIT_SHA = "${COMMIT_REF}"
  VITE_CHANNEL = "prod"
```

### Local Development
```bash
# .env.local (optional)
VITE_CHANNEL=dev
```

## Troubleshooting

### Update Notifications Not Showing

1. **Check build.json**:
   ```bash
   curl https://your-site.netlify.app/build.json
   ```
   Should return valid JSON with buildId.

2. **Check Convex deployment records**:
   ```bash
   pnpm deployment:admin status prod
   ```

3. **Check service worker**:
   - Open DevTools → Application → Service Workers
   - Verify service worker is active
   - Check console for BUILD_ID broadcasts

4. **Enable debug mode**:
   ```javascript
   // In browser console
   localStorage.setItem('debugUpdates', 'true');
   ```

### Force Update Not Working

1. **Check policy**:
   ```bash
   pnpm deployment:admin status prod
   ```

2. **Verify client timestamp**:
   ```javascript
   // In browser console
   console.log('Client timestamp:', Number(import.meta.env.VITE_BUILD_TIMESTAMP));
   ```

### Deployment Tracking Failed

1. **Check post-deploy logs** in Netlify deploy log
2. **Verify Convex connection**:
   ```bash
   npx convex run deployment:listReleases '{"channel":"prod","limit":1}'
   ```

3. **Manual recovery**:
   ```bash
   # If post-deploy failed, run manually:
   BUILD_ID=your-build-id node scripts/post-deploy.js
   ```

## Cache Headers

Critical for proper operation:

```toml
# netlify.toml
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/build.json"
  [headers.values]
    Cache-Control = "no-store"
```

## Development

### Enable Dev Updates
```javascript
// In browser console
localStorage.setItem('enableDevUpdates', 'true');
```

### Test Locally
```bash
# Generate test build.json
BUILD_ID=test.123 node scripts/write-build-json.js

# Run E2E test
pnpm test:deployment
```

## Security Considerations

- `beginDeployment` and `verifyAndPublish` are internal functions
- Client queries are rate-limited by Convex
- Force update policies should be used sparingly
- Build verification prevents premature "live" marking

## Performance

- Update checks are cached by Convex
- Service worker broadcasts are lightweight
- Toast notifications are rate-limited (5-minute minimum)
- Force update checks happen on every page load (minimal overhead)

## Monitoring

Key metrics to monitor:
- Deployment success rate
- Time from deploy to "live" status
- Client update adoption rate
- Force update policy usage
