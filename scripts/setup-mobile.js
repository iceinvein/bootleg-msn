#!/usr/bin/env node

/**
 * Mobile Setup Script
 * 
 * This script sets up both Android and iOS platforms for Capacitor,
 * handling existing platforms gracefully and configuring Android
 * for Java compatibility.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANDROID_DIR = path.join(process.cwd(), 'android');
const IOS_DIR = path.join(process.cwd(), 'ios');

function runCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Failed to ${description.toLowerCase()}`);
    console.error(error.message);
    return false;
  }
}

function setupAndroidPlatform() {
  if (fs.existsSync(ANDROID_DIR)) {
    console.log('✅ Android platform already exists');
    return true;
  }
  
  return runCommand('npx cap add android', 'Add Android platform');
}

function setupIOSPlatform() {
  if (fs.existsSync(IOS_DIR)) {
    console.log('✅ iOS platform already exists');
    return true;
  }
  
  // Check if we're on macOS before trying to add iOS
  if (process.platform !== 'darwin') {
    console.log('⚠️  iOS platform can only be added on macOS, skipping...');
    return true;
  }
  
  return runCommand('npx cap add ios', 'Add iOS platform');
}

function setupAndroidConfiguration() {
  try {
    console.log('🔧 Configuring Android for Java compatibility...');
    execSync('pnpm run setup:android', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Failed to configure Android');
    console.error(error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Setting up mobile platforms for Bootleg MSN Messenger...\n');
  
  const results = [
    setupAndroidPlatform(),
    setupIOSPlatform(),
    setupAndroidConfiguration()
  ];
  
  const success = results.every(Boolean);
  
  if (success) {
    console.log('\n✅ Mobile setup complete!');
    console.log('\n📱 Available platforms:');
    
    if (fs.existsSync(ANDROID_DIR)) {
      console.log('   • Android (configured with Java compatibility)');
    }
    
    if (fs.existsSync(IOS_DIR)) {
      console.log('   • iOS');
    } else if (process.platform !== 'darwin') {
      console.log('   • iOS (not available on this platform)');
    }
    
    console.log('\n🚀 Next steps:');
    console.log('   • pnpm run dev:android  - Build and run on Android');
    
    if (fs.existsSync(IOS_DIR)) {
      console.log('   • pnpm run dev:ios      - Build and run on iOS');
    }
    
    console.log('   • pnpm run build:mobile - Build web app and sync to platforms');
    console.log('\n📖 For detailed setup instructions, see: docs/MOBILE_SETUP.md');
    
  } else {
    console.log('\n❌ Mobile setup encountered some issues.');
    console.log('Please check the errors above and try running individual commands:');
    console.log('   • npx cap add android');
    console.log('   • npx cap add ios (macOS only)');
    console.log('   • pnpm run setup:android');
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}