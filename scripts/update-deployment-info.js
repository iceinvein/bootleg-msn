#!/usr/bin/env node

/**
 * Script to update deployment info in Convex after version bump
 * This script uses the Convex CLI to call the internal mutation
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateDeploymentInfo() {
	try {
		// Read deployment info
		const deploymentInfoPath = path.join(__dirname, "..", "deployment-info.json");
		
		let deploymentInfo;
		
		if (fs.existsSync(deploymentInfoPath)) {
			// Use deployment-info.json if it exists (from GitHub Actions)
			deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
		} else {
			// Fallback to reading from package.json (for local runs)
			const packageJsonPath = path.join(__dirname, "..", "package.json");
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
			
			deploymentInfo = {
				version: packageJson.version,
				timestamp: Date.now(),
				commit: "local",
				branch: "local"
			};
			
			console.log("Using package.json version for local deployment update");
		}
		
		// Ensure version has 'v' prefix for consistency
		const version = deploymentInfo.version.startsWith('v') 
			? deploymentInfo.version 
			: `v${deploymentInfo.version}`;

		// Use Convex CLI to call the mutation
		const args = JSON.stringify({
			version: version,
			timestamp: deploymentInfo.timestamp,
		});

		console.log(`🚀 Updating deployment info: ${deploymentInfo.version} → ${version}`);
		console.log(`📅 Timestamp: ${new Date(deploymentInfo.timestamp).toISOString()}`);
		
		// Call the Convex function using the CLI
		execSync(`npx convex run deployment:updateDeploymentInfo '${args}'`, {
			stdio: "inherit",
			cwd: path.join(__dirname, ".."),
		});

		console.log(`✅ Successfully updated deployment info: ${version}`);
		
		// Verify the update
		try {
			const verifyResult = execSync(`npx convex run deployment:getCurrentVersion`, {
				cwd: path.join(__dirname, ".."),
				encoding: 'utf8'
			});
			const currentVersion = JSON.parse(verifyResult);
			if (currentVersion && currentVersion.version === version) {
				console.log(`🎉 Verification successful: Current version is ${currentVersion.version}`);
			} else {
				console.log(`⚠️  Verification warning: Expected ${version}, got ${currentVersion?.version || 'null'}`);
			}
		} catch (verifyError) {
			console.log(`⚠️  Could not verify deployment update: ${verifyError.message}`);
		}
		
		// Clean up the temporary file if it exists
		if (fs.existsSync(deploymentInfoPath)) {
			fs.unlinkSync(deploymentInfoPath);
		}
		
	} catch (error) {
		console.error("❌ Failed to update deployment info:", error);
		process.exit(1);
	}
}

updateDeploymentInfo();