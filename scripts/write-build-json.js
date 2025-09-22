#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Netlify provides COMMIT_REF and DEPLOY_ID, fallback to local values
const commit = process.env.GIT_SHA || process.env.COMMIT_REF || 'local';
const deployId = process.env.DEPLOY_ID || Date.now().toString();
const buildId = process.env.BUILD_ID || `${commit}.${deployId}`;
const channel = process.env.VITE_CHANNEL || 'prod';
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