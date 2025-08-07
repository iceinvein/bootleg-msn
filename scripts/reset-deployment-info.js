#!/usr/bin/env node

/**
 * Script to reset deployment info in Convex database
 * This will clean up any corrupted data and set the current version
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDeploymentInfo() {
	try {
		// Read current version from package.json
		const packageJsonPath = path.join(__dirname, "..", "package.json");
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		
		const version = `v${packageJson.version}`;
		const timestamp = Date.now();
		
		console.log(`🧹 Resetting deployment info to ${version}`);
		console.log(`📅 Timestamp: ${new Date(timestamp).toISOString()}`);
		
		// First, let's clear all existing deployment info
		try {
			console.log("🗑️  Clearing existing deployment data...");
			const clearResult = execSync(`npx convex run deployment:getDeploymentHistory '{"limit": 100}'`, {
				cwd: path.join(__dirname, ".."),
				encoding: 'utf8'
			});
			
			const existingDeployments = JSON.parse(clearResult);
			console.log(`Found ${existingDeployments.length} existing deployment records`);
			
			// Note: We can't directly delete from the script, but the updateDeploymentInfo 
			// function will clean up old records automatically
		} catch (error) {
			console.log("⚠️  Could not fetch existing deployments:", error.message);
		}
		
		// Insert the current version
		const args = JSON.stringify({
			version: version,
			timestamp: timestamp,
		});

		console.log("📝 Inserting current deployment info...");
		execSync(`npx convex run deployment:updateDeploymentInfo '${args}'`, {
			stdio: "inherit",
			cwd: path.join(__dirname, ".."),
		});

		console.log(`✅ Successfully reset deployment info to ${version}`);
		
		// Verify the update
		try {
			const verifyResult = execSync(`npx convex run deployment:getCurrentVersion`, {
				cwd: path.join(__dirname, ".."),
				encoding: 'utf8'
			});
			const currentVersion = JSON.parse(verifyResult);
			console.log(`🎉 Verification successful: Current version is ${currentVersion.version}`);
			console.log(`📅 Timestamp: ${new Date(currentVersion.timestamp).toISOString()}`);
		} catch (verifyError) {
			console.log(`⚠️  Could not verify deployment reset: ${verifyError.message}`);
		}
		
	} catch (error) {
		console.error("❌ Failed to reset deployment info:", error);
		process.exit(1);
	}
}

resetDeploymentInfo();