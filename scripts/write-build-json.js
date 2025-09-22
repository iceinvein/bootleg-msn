#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Netlify environment variables: https://docs.netlify.com/configure-builds/environment-variables/
// COMMIT_REF: The commit SHA that triggered the build
// DEPLOY_ID: Unique identifier for the deploy
const commit = process.env.COMMIT_REF || process.env.GIT_SHA || 'local';
const deployId = process.env.DEPLOY_ID || Date.now().toString();
const buildId = process.env.BUILD_ID || `${commit}.${deployId}`;
const channel = process.env.VITE_CHANNEL || 'prod';

// Debug: Log environment variables to help troubleshoot
console.log('Environment variables:');
console.log('  COMMIT_REF:', process.env.COMMIT_REF);
console.log('  GIT_SHA:', process.env.GIT_SHA);
console.log('  DEPLOY_ID:', process.env.DEPLOY_ID);
console.log('  BUILD_ID:', process.env.BUILD_ID);
console.log('  VITE_CHANNEL:', process.env.VITE_CHANNEL);

// Validate that we have a proper commit hash
if (!process.env.COMMIT_REF && !process.env.GIT_SHA) {
  console.warn('⚠️  Warning: No commit hash found in environment variables');
  console.warn('   This might indicate an issue with Netlify environment setup');
}
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

const out = {
  buildId,
  version: pkg.version,
  timestamp: Date.now(),
  commit,
  channel,
};

fs.writeFileSync(path.join(__dirname, '..', 'public', 'build.json'), JSON.stringify(out));
console.log('Wrote public/build.json:', out);