#!/usr/bin/env node
/**
 * E2E test for deployment flow
 * Tests the complete deployment detection system
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_CHANNEL = 'test';
const TEST_BUILD_ID = `test.${Date.now()}`;

console.log('🧪 Testing Deployment Flow E2E\n');

function runConvex(functionName, args = '{}') {
  try {
    const result = execSync(`npx convex run ${functionName} '${args}'`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    return result.trim() ? JSON.parse(result) : null;
  } catch (error) {
    console.error(`❌ Failed to run ${functionName}:`, error.message);
    throw error;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBuildJsonGeneration() {
  console.log('1️⃣ Testing build.json generation...');
  
  // Set test environment variables
  process.env.BUILD_ID = TEST_BUILD_ID;
  process.env.GIT_SHA = 'test-commit';
  process.env.VITE_CHANNEL = TEST_CHANNEL;
  
  // Run the build json script
  execSync('node scripts/write-build-json.js', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  // Verify build.json was created
  const buildJsonPath = path.join(__dirname, '..', 'public', 'build.json');
  if (!fs.existsSync(buildJsonPath)) {
    throw new Error('build.json was not created');
  }
  
  const buildInfo = JSON.parse(fs.readFileSync(buildJsonPath, 'utf8'));
  
  if (buildInfo.buildId !== TEST_BUILD_ID) {
    throw new Error(`Expected buildId ${TEST_BUILD_ID}, got ${buildInfo.buildId}`);
  }
  
  if (buildInfo.channel !== TEST_CHANNEL) {
    throw new Error(`Expected channel ${TEST_CHANNEL}, got ${buildInfo.channel}`);
  }
  
  console.log('✅ build.json generated correctly');
  return buildInfo;
}

async function testConvexIntegration(buildInfo) {
  console.log('2️⃣ Testing Convex integration...');
  
  // Test beginDeployment
  console.log('   📝 Testing beginDeployment...');
  await runConvex('deployment:beginDeployment', JSON.stringify({
    buildId: buildInfo.buildId,
    version: buildInfo.version,
    commit: buildInfo.commit,
    channel: buildInfo.channel,
    timestamp: buildInfo.timestamp
  }));
  
  // Verify deployment was created
  const releases = await runConvex('deployment:listReleases', JSON.stringify({
    channel: buildInfo.channel,
    limit: 1
  }));
  
  if (!releases || releases.length === 0) {
    throw new Error('No deployment release found after beginDeployment');
  }
  
  const release = releases[0];
  if (release.buildId !== buildInfo.buildId) {
    throw new Error(`Expected release buildId ${buildInfo.buildId}, got ${release.buildId}`);
  }
  
  if (release.status !== 'publishing') {
    throw new Error(`Expected status 'publishing', got ${release.status}`);
  }
  
  console.log('✅ beginDeployment working correctly');
  
  // Test marking as live
  console.log('   🟢 Testing mark as live...');
  await runConvex('deployment:internalMarkReleaseLive', JSON.stringify({
    id: release._id
  }));
  
  // Verify it's marked as live
  const updatedReleases = await runConvex('deployment:listReleases', JSON.stringify({
    channel: buildInfo.channel,
    limit: 1
  }));
  
  if (updatedReleases[0].status !== 'live') {
    throw new Error(`Expected status 'live', got ${updatedReleases[0].status}`);
  }
  
  console.log('✅ Mark as live working correctly');
  
  return release;
}

async function testUpdateDetection(buildInfo) {
  console.log('3️⃣ Testing update detection...');
  
  // Test with same build ID (should show no update)
  console.log('   🔍 Testing same build ID...');
  const sameResult = await runConvex('deployment:checkForUpdatesByBuild', JSON.stringify({
    clientBuildId: buildInfo.buildId,
    channel: buildInfo.channel
  }));
  
  if (sameResult.hasUpdate !== false) {
    throw new Error(`Expected hasUpdate false for same build, got ${sameResult.hasUpdate}`);
  }
  
  console.log('✅ Same build ID correctly shows no update');
  
  // Test with different build ID (should show update)
  console.log('   🔍 Testing different build ID...');
  const differentResult = await runConvex('deployment:checkForUpdatesByBuild', JSON.stringify({
    clientBuildId: 'old.123',
    channel: buildInfo.channel
  }));
  
  if (differentResult.hasUpdate !== true) {
    throw new Error(`Expected hasUpdate true for different build, got ${differentResult.hasUpdate}`);
  }
  
  console.log('✅ Different build ID correctly shows update available');
}

async function testForceUpdatePolicy(buildInfo) {
  console.log('4️⃣ Testing force update policy...');
  
  const oldTimestamp = buildInfo.timestamp - 60000; // 1 minute ago
  const minSupportedTimestamp = buildInfo.timestamp - 30000; // 30 seconds ago
  
  // Set force update policy
  console.log('   🚨 Setting force update policy...');
  await runConvex('deployment:setAppPolicy', JSON.stringify({
    channel: buildInfo.channel,
    minSupportedTimestamp,
    forceMessage: 'Test force update message'
  }));
  
  // Test old client (should be forced to update)
  const oldClientResult = await runConvex('deployment:checkForceUpdatePolicy', JSON.stringify({
    clientBuildTimestamp: oldTimestamp,
    channel: buildInfo.channel
  }));
  
  if (oldClientResult.mustUpdate !== true) {
    throw new Error(`Expected mustUpdate true for old client, got ${oldClientResult.mustUpdate}`);
  }
  
  // Test new client (should not be forced to update)
  const newClientResult = await runConvex('deployment:checkForceUpdatePolicy', JSON.stringify({
    clientBuildTimestamp: buildInfo.timestamp,
    channel: buildInfo.channel
  }));
  
  if (newClientResult.mustUpdate !== false) {
    throw new Error(`Expected mustUpdate false for new client, got ${newClientResult.mustUpdate}`);
  }
  
  console.log('✅ Force update policy working correctly');
  
  // Clear the policy
  console.log('   🔓 Clearing force update policy...');
  await runConvex('deployment:setAppPolicy', JSON.stringify({
    channel: buildInfo.channel,
    minSupportedTimestamp: 0
    // Don't include forceMessage to clear it
  }));
  
  console.log('✅ Force update policy cleared');
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  // Remove test build.json
  const buildJsonPath = path.join(__dirname, '..', 'public', 'build.json');
  if (fs.existsSync(buildJsonPath)) {
    fs.unlinkSync(buildJsonPath);
  }
  
  console.log('✅ Cleanup completed');
}

async function main() {
  try {
    const buildInfo = await testBuildJsonGeneration();
    const release = await testConvexIntegration(buildInfo);
    await testUpdateDetection(buildInfo);
    await testForceUpdatePolicy(buildInfo);
    
    console.log('\n🎉 All tests passed! Deployment flow is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();
