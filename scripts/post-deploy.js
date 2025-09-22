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
// Netlify doesn't provide commit message environment variables, so we use git directly
console.log('🔍 Netlify Git environment variables:');
console.log('  COMMIT_REF:', process.env.COMMIT_REF);
console.log('  CACHED_COMMIT_REF:', process.env.CACHED_COMMIT_REF);
console.log('  HEAD:', process.env.HEAD);
console.log('  BRANCH:', process.env.BRANCH);

// Get commit messages for this release (Netlify doesn't provide commit message env vars)
let commitMessages = [];
let isForceDeployment = false;

try {
  // Get all commit messages since the last cached commit (i.e., this release)
  const cachedCommitRef = process.env.CACHED_COMMIT_REF;
  const currentCommitRef = process.env.COMMIT_REF;

  if (cachedCommitRef && currentCommitRef && cachedCommitRef !== currentCommitRef) {
    // Get all commits in this release: from cached (exclusive) to current (inclusive)
    const commitRange = `${cachedCommitRef}..${currentCommitRef}`;
    const allMessages = execSync(`git log ${commitRange} --pretty=%B`, { encoding: 'utf8' }).trim();
    commitMessages = allMessages.split('\n').filter(line => line.trim());
    console.log('📝 Commit messages in this release:', commitMessages);
  } else {
    // Fallback: just get the latest commit message
    const latestMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    commitMessages = [latestMessage];
    console.log('📝 Latest commit message:', latestMessage);
  }

  // Check if any commit message contains [force]
  isForceDeployment = commitMessages.some(msg =>
    msg.toLowerCase().includes('[force]')
  );

  if (isForceDeployment) {
    const forceCommits = commitMessages.filter(msg =>
      msg.toLowerCase().includes('[force]')
    );
    console.log('⚡ Force deployment commits found:', forceCommits);
  }

} catch (error) {
  console.log('❌ Failed to get commit messages via git:', error.message);
  // Fallback: try just the latest commit
  try {
    const latestMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    commitMessages = [latestMessage];
    isForceDeployment = latestMessage.toLowerCase().includes('[force]');
    console.log('📝 Fallback to latest commit:', latestMessage);
  } catch (fallbackError) {
    console.log('❌ Fallback also failed:', fallbackError.message);
  }
}

console.log('⚡ Force deployment detected:', isForceDeployment);

console.log('🚀 Starting deployment tracking...');
console.log(`📍 Site URL: ${siteUrl}`);
console.log(`🔗 Build JSON URL: ${buildJsonUrl}`);
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
