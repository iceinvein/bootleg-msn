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
		
		if (!fs.existsSync(deploymentInfoPath)) {
			console.log("No deployment-info.json found, skipping database update");
			return;
		}

		const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
		
		// Use Convex CLI to call the mutation
		const args = JSON.stringify({
			version: deploymentInfo.version,
			timestamp: deploymentInfo.timestamp,
		});

		console.log(`Updating deployment info: ${deploymentInfo.version}`);
		
		// Call the Convex function using the CLI
		execSync(`npx convex run deployment:updateDeploymentInfo '${args}'`, {
			stdio: "inherit",
			cwd: path.join(__dirname, ".."),
		});

		console.log(`✅ Updated deployment info: ${deploymentInfo.version}`);
		
		// Clean up the temporary file
		fs.unlinkSync(deploymentInfoPath);
		
	} catch (error) {
		console.error("❌ Failed to update deployment info:", error);
		process.exit(1);
	}
}

updateDeploymentInfo();