# Deployment System Quick Reference

## 🚀 Common Commands

### Check Status
```bash
pnpm deployment:admin status prod
pnpm deployment:admin status staging
```

### List Recent Deployments
```bash
pnpm deployment:admin list-releases prod
```

### Force Update (Emergency)
```bash
# Set force update (timestamp in milliseconds)
pnpm deployment:admin set-force-update prod 1703980800000 "Critical security update"

# Clear force update
pnpm deployment:admin clear-force-update prod
```

### Testing
```bash
# Full E2E test
pnpm test:deployment

# Unit tests
pnpm test
```

## 🔧 Troubleshooting Checklist

### ❌ Updates Not Showing
1. Check build.json: `curl https://your-site.netlify.app/build.json`
2. Check Convex: `pnpm deployment:admin status prod`
3. Enable debug: `localStorage.setItem('debugUpdates', 'true')`
4. Check service worker in DevTools

### ❌ Force Update Not Working
1. Check policy: `pnpm deployment:admin status prod`
2. Verify client timestamp in console
3. Clear browser cache

### ❌ Deployment Failed
1. Check Netlify deploy logs
2. Run manually: `BUILD_ID=your-id node scripts/post-deploy.js`
3. Verify Convex connection

## 📊 Key Files

| File | Purpose |
|------|---------|
| `public/build.json` | Build metadata for verification |
| `public/sw.js` | Service worker with BUILD_ID broadcast |
| `scripts/post-deploy.js` | Post-deployment Convex integration |
| `scripts/admin-deployment.js` | Admin CLI tool |
| `convex/deployment.ts` | Core deployment functions |

## 🔍 Debug Commands

```javascript
// Browser console - enable debug mode
localStorage.setItem('debugUpdates', 'true');

// Check current build info
console.log('BUILD_ID:', import.meta.env.VITE_BUILD_ID);
console.log('TIMESTAMP:', import.meta.env.VITE_BUILD_TIMESTAMP);
console.log('CHANNEL:', import.meta.env.VITE_CHANNEL);

// Enable dev updates
localStorage.setItem('enableDevUpdates', 'true');
```

## 🚨 Emergency Procedures

### Force All Users to Update
```bash
# Get current timestamp
date +%s000

# Set force update (use timestamp from above)
pnpm deployment:admin set-force-update prod <timestamp> "Emergency update required"
```

### Rollback (Manual)
```bash
# 1. Find target release
pnpm deployment:admin list-releases prod

# 2. Mark as live (replace <release-id>)
npx convex run deployment:internalMarkReleaseLive '{"id":"<release-id>"}'

# 3. Clear force update if needed
pnpm deployment:admin clear-force-update prod
```

## 📈 Monitoring

### Health Check URLs
- Build metadata: `https://your-site.netlify.app/build.json`
- Service worker: `https://your-site.netlify.app/sw.js`

### Key Metrics
- Deployment frequency
- Time to live (deploy → live status)
- Update adoption rate
- Force update usage

## 🔐 Security Notes

- Only admins should run force updates
- `beginDeployment`/`verifyAndPublish` are internal-only
- Build verification prevents race conditions
- Cache headers are critical for proper operation

## 📞 Support

For issues:
1. Check this guide first
2. Run `pnpm test:deployment` to verify system health
3. Check Netlify deploy logs
4. Verify Convex function logs
