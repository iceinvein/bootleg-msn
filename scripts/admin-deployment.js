#!/usr/bin/env node
/**
 * Admin CLI for deployment management
 * Usage: node scripts/admin-deployment.js <command> [options]
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS = {
  'list-releases': 'List recent releases for a channel',
  'set-force-update': 'Set force update policy for a channel',
  'clear-force-update': 'Clear force update policy for a channel',
  'rollback': 'Mark a previous release as live',
  'status': 'Show current deployment status',
  'help': 'Show this help message'
};

function showHelp() {
  console.log('🔧 Deployment Admin CLI\n');
  console.log('Available commands:');
  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(20)} ${desc}`);
  });
  console.log('\nExamples:');
  console.log('  node scripts/admin-deployment.js list-releases prod');
  console.log('  node scripts/admin-deployment.js set-force-update prod 1703980800000 "Critical security update required"');
  console.log('  node scripts/admin-deployment.js clear-force-update prod');
  console.log('  node scripts/admin-deployment.js rollback prod abc123.1703980800000');
}

function runConvexQuery(functionName, args = '{}') {
  try {
    const result = execSync(`npx convex run ${functionName} '${args}'`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    return JSON.parse(result);
  } catch (error) {
    console.error(`❌ Failed to run ${functionName}:`, error.message);
    process.exit(1);
  }
}

function runConvexMutation(functionName, args = '{}') {
  try {
    execSync(`npx convex run ${functionName} '${args}'`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`❌ Failed to run ${functionName}:`, error.message);
    process.exit(1);
  }
}

function listReleases(channel = 'prod') {
  console.log(`📋 Recent releases for channel: ${channel}\n`);

  try {
    const releases = runConvexQuery('deployment:listReleases',
      JSON.stringify({ channel, limit: 10 }));

    if (releases.length === 0) {
      console.log('📦 No releases found for this channel');
      return;
    }

    releases.forEach((release, index) => {
      const date = new Date(release.timestamp).toISOString();
      const status = release.status === 'live' ? '🟢' :
                    release.status === 'publishing' ? '🟡' : '🔴';
      const forceFlag = release.forceDeployment ? ' ⚡' : '';

      console.log(`${index + 1}. ${status} ${release.buildId}${forceFlag}`);
      console.log(`   Status: ${release.status}`);
      console.log(`   Version: ${release.version || 'N/A'}`);
      console.log(`   Date: ${date}`);
      if (release.forceDeployment) {
        console.log(`   🚀 Force deployment`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to list releases:', error.message);
  }
}

function setForceUpdate(channel, minTimestamp, message) {
  if (!channel || !minTimestamp) {
    console.error('❌ Usage: set-force-update <channel> <minTimestamp> [message]');
    process.exit(1);
  }
  
  const args = JSON.stringify({
    channel,
    minSupportedTimestamp: parseInt(minTimestamp),
    forceMessage: message || 'A new version is required. Please update to continue.',
    updatedAt: Date.now()
  });
  
  console.log(`🚨 Setting force update policy for ${channel}...`);
  runConvexMutation('deployment:setAppPolicy', args);
  console.log('✅ Force update policy set successfully');
}

function clearForceUpdate(channel) {
  if (!channel) {
    console.error('❌ Usage: clear-force-update <channel>');
    process.exit(1);
  }
  
  // Set minSupportedTimestamp to 0 to effectively disable force updates
  const args = JSON.stringify({
    channel,
    minSupportedTimestamp: 0,
    forceMessage: null,
    updatedAt: Date.now()
  });
  
  console.log(`🔓 Clearing force update policy for ${channel}...`);
  runConvexMutation('deployment:setAppPolicy', args);
  console.log('✅ Force update policy cleared successfully');
}

function rollback(channel, buildId) {
  if (!channel || !buildId) {
    console.error('❌ Usage: rollback <channel> <buildId>');
    process.exit(1);
  }
  
  console.log(`⏪ Rolling back ${channel} to ${buildId}...`);
  console.log('⚠️  This command needs additional implementation in deployment.ts');
  console.log('   You would need to find the release by buildId and mark it as live');
}

function showStatus(channel = 'prod') {
  console.log(`📊 Deployment status for channel: ${channel}\n`);
  
  try {
    // Get latest release
    const latest = runConvexQuery('deployment:internalLatestReleaseForChannel', 
      JSON.stringify({ channel }));
    
    if (latest) {
      console.log('📦 Latest Release:');
      console.log(`   Build ID: ${latest.buildId}`);
      console.log(`   Status: ${latest.status}`);
      console.log(`   Version: ${latest.version || 'N/A'}`);
      console.log(`   Timestamp: ${new Date(latest.timestamp).toISOString()}`);
    } else {
      console.log('📦 No releases found for this channel');
    }
    
    // Get force update policy
    const policy = runConvexQuery('deployment:getLatestAppPolicy', 
      JSON.stringify({ channel }));
    
    if (policy && policy.minSupportedTimestamp > 0) {
      console.log('\n🚨 Force Update Policy:');
      console.log(`   Min Timestamp: ${policy.minSupportedTimestamp} (${new Date(policy.minSupportedTimestamp).toISOString()})`);
      console.log(`   Message: ${policy.forceMessage || 'Default message'}`);
    } else {
      console.log('\n🔓 No active force update policy');
    }
    
  } catch (error) {
    console.error('❌ Failed to get status:', error.message);
  }
}

// Main CLI logic
const [,, command, ...args] = process.argv;

switch (command) {
  case 'list-releases':
    listReleases(args[0]);
    break;
  case 'set-force-update':
    setForceUpdate(args[0], args[1], args[2]);
    break;
  case 'clear-force-update':
    clearForceUpdate(args[0]);
    break;
  case 'rollback':
    rollback(args[0], args[1]);
    break;
  case 'status':
    showStatus(args[0]);
    break;
  case 'help':
  case undefined:
    showHelp();
    break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
