#!/usr/bin/env node

/**
 * Android Setup Script
 * 
 * This script automatically configures the Android project with the necessary
 * Java toolchain settings to avoid Java version conflicts.
 * 
 * Run this after: npx cap add android
 */

import fs from 'fs';
import path from 'path';

const ANDROID_DIR = path.join(process.cwd(), 'android');

function ensureAndroidExists() {
  if (!fs.existsSync(ANDROID_DIR)) {
    console.error('❌ Android directory not found. Please run "npx cap add android" first.');
    process.exit(1);
  }
}

function updateAppBuildGradle() {
  const buildGradlePath = path.join(ANDROID_DIR, 'app', 'build.gradle');
  
  if (!fs.existsSync(buildGradlePath)) {
    console.error('❌ app/build.gradle not found');
    return false;
  }

  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Check if compileOptions already exists
  if (content.includes('compileOptions')) {
    console.log('✅ app/build.gradle already configured');
    return true;
  }

  // Add compileOptions after compileSdk
  const compileSdkRegex = /(compileSdk rootProject\.ext\.compileSdkVersion)/;
  const replacement = `$1
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }`;

  content = content.replace(compileSdkRegex, replacement);
  
  fs.writeFileSync(buildGradlePath, content);
  console.log('✅ Updated app/build.gradle with Java 21 compatibility settings');
  return true;
}

function updateRootBuildGradle() {
  const buildGradlePath = path.join(ANDROID_DIR, 'build.gradle');
  
  if (!fs.existsSync(buildGradlePath)) {
    console.error('❌ build.gradle not found');
    return false;
  }

  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Check if JavaCompile configuration already exists
  if (content.includes('tasks.withType(JavaCompile)')) {
    console.log('✅ build.gradle already configured');
    return true;
  }

  // Add JavaCompile configuration to allprojects
  const allProjectsRegex = /(allprojects\s*\{[\s\S]*?repositories\s*\{[\s\S]*?\})/;
  const replacement = `$1
    
    tasks.withType(JavaCompile) {
        options.compilerArgs += ["-Xlint:-deprecation"]
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }`;

  content = content.replace(allProjectsRegex, replacement);
  
  fs.writeFileSync(buildGradlePath, content);
  console.log('✅ Updated build.gradle with Java 21 compilation settings');
  return true;
}

function updateGradleProperties() {
  const gradlePropsPath = path.join(ANDROID_DIR, 'gradle.properties');
  
  if (!fs.existsSync(gradlePropsPath)) {
    console.error('❌ gradle.properties not found');
    return false;
  }

  let content = fs.readFileSync(gradlePropsPath, 'utf8');
  
  // Check if toolchain download is already enabled
  if (content.includes('org.gradle.java.installations.auto-download=true')) {
    console.log('✅ gradle.properties already configured');
    return true;
  }

  // Add toolchain auto-download
  content += '\n# Enable automatic Java toolchain download\norg.gradle.java.installations.auto-download=true\n';
  
  fs.writeFileSync(gradlePropsPath, content);
  console.log('✅ Updated gradle.properties with toolchain auto-download');
  return true;
}

function createSettingsGradle() {
  const settingsGradlePath = path.join(ANDROID_DIR, 'settings.gradle');
  
  if (fs.existsSync(settingsGradlePath)) {
    console.log('✅ settings.gradle already exists');
    return true;
  }

  const settingsContent = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id 'org.gradle.toolchains.foojay-resolver-convention' version '0.8.0'
}

include ':app'
include ':capacitor-cordova-android-plugins'

project(':capacitor-cordova-android-plugins').projectDir = new File('./capacitor-cordova-android-plugins/')

apply from: 'capacitor.settings.gradle'`;

  fs.writeFileSync(settingsGradlePath, settingsContent);
  console.log('✅ Created settings.gradle with toolchain resolver');
  return true;
}

function main() {
  console.log('🔧 Setting up Android project for Java compatibility...\n');
  
  ensureAndroidExists();
  
  const success = [
    updateAppBuildGradle(),
    updateRootBuildGradle(),
    updateGradleProperties(),
    createSettingsGradle()
  ].every(Boolean);
  
  if (success) {
    console.log('\n✅ Android setup complete! The project should now build with any Java version (21+).');
    console.log('\n📝 What was configured:');
    console.log('   • Java 21 compatibility settings (required by Capacitor 7.0)');
    console.log('   • Automatic Java toolchain download');
    console.log('   • Foojay toolchain resolver for missing Java versions');
    console.log('\n🚀 You can now run: npx cap run android');
  } else {
    console.log('\n❌ Android setup failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}