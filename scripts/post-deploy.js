#!/usr/bin/env node
/**
 * Post-deploy script for Netlify
 * Triggers Convex deployment tracking after successful Netlify deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read build.json to get deployment info
const buildJsonPath = path.join(__dirname, '..', 'public', 'build.json');

if (!fs.existsSync(buildJsonPath)) {
  console.error('❌ build.json not found. Cannot proceed with deployment tracking.');
  process.exit(1);
}

const buildInfo = JSON.parse(fs.readFileSync(buildJsonPath, 'utf8'));
console.log('📦 Build info:', buildInfo);

// Extract required info
const { buildId, version, commit, channel } = buildInfo;
const siteUrl = process.env.DEPLOY_PRIME_URL || process.env.URL || 'https://your-site.netlify.app';
const buildJsonUrl = `${siteUrl}/build.json`;

console.log('🚀 Starting deployment tracking...');
console.log(`📍 Site URL: ${siteUrl}`);
console.log(`🔗 Build JSON URL: ${buildJsonUrl}`);

try {
  // Step 1: Begin deployment tracking
  console.log('📝 Registering deployment with Convex...');
  const beginArgs = JSON.stringify({
    buildId,
    version,
    commit,
    channel,
    timestamp: buildInfo.timestamp
  });
  
  execSync(`npx convex run deployment:beginDeployment '${beginArgs}'`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Deployment registered successfully');
  
  // Step 2: Verify and publish
  console.log('🔍 Starting verification and publish process...');
  const verifyArgs = JSON.stringify({
    buildId,
    channel,
    buildJsonUrl,
    timeoutMs: 180000, // 3 minutes
    intervalMs: 3000   // 3 seconds
  });
  
  execSync(`npx convex run deployment:verifyAndPublish '${verifyArgs}'`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('🎉 Deployment tracking completed successfully!');
  console.log(`📊 Build ${buildId} is now live on channel ${channel}`);
  
} catch (error) {
  console.error('❌ Deployment tracking failed:', error.message);
  // Don't fail the deployment if tracking fails
  console.log('⚠️  Deployment will continue, but update notifications may not work');
  process.exit(0);
}
