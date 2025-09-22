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

// Check if this is a force deployment by looking at commit message
// Netlify provides commit message in different env vars depending on trigger
const commitMessage = process.env.HEAD_COMMIT_MESSAGE ||
                     process.env.COMMIT_MESSAGE ||
                     process.env.CACHED_COMMIT_REF ||
                     '';
const isForceDeployment = commitMessage.toLowerCase().includes('[force]');

// Debug: Log all commit-related env vars
console.log('🔍 Commit environment variables:');
console.log('  HEAD_COMMIT_MESSAGE:', process.env.HEAD_COMMIT_MESSAGE);
console.log('  COMMIT_MESSAGE:', process.env.COMMIT_MESSAGE);
console.log('  CACHED_COMMIT_REF:', process.env.CACHED_COMMIT_REF);
console.log('  COMMIT_REF:', process.env.COMMIT_REF);

console.log('🚀 Starting deployment tracking...');
console.log(`📍 Site URL: ${siteUrl}`);
console.log(`🔗 Build JSON URL: ${buildJsonUrl}`);
console.log(`📝 Commit message: ${commitMessage}`);
if (isForceDeployment) {
  console.log('⚡ Force deployment detected!');
}

try {
  // Step 1: Begin deployment tracking
  console.log('📝 Registering deployment with Convex...');
  const beginArgs = JSON.stringify({
    buildId,
    version,
    commit,
    channel,
    timestamp: buildInfo.timestamp,
    forceDeployment: isForceDeployment
  });
  
  execSync(`npx convex run deployment:beginDeployment '${beginArgs}'`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Deployment registered successfully');

  // Step 2: Mark as live immediately (Netlify only runs post-deploy on success)
  console.log('🔍 Marking deployment as live...');
  const markLiveArgs = JSON.stringify({
    buildId,
    channel
  });

  execSync(`npx convex run deployment:markReleaseAsLive '${markLiveArgs}'`, {
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
