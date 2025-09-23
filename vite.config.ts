import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Read package.json to get version
	const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

	// Channel from environment (build.json will be the source of truth for build metadata)
	const channel = process.env.VITE_CHANNEL || "prod";

	return {
	plugins: [
		react(),
		tailwindcss(),
		// The code below enables dev tools like taking screenshots of your site
		// while it is being developed on chef.convex.dev.
		// Feel free to remove this code if you're no longer developing your app with Chef.
		mode === "development"
			? {
					name: "inject-chef-dev",
					transform(code: string, id: string) {
						if (id.includes("main.tsx")) {
							return {
								code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
								map: null,
							};
						}
						return null;
					},
				}
			: null,
		// End of code for taking screenshots on chef.convex.dev.
	].filter(Boolean),
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@convex": path.resolve(__dirname, "./convex"),
			// Explicit alias for Tauri API
			"@tauri-apps/api": path.resolve(
				__dirname,
				"node_modules/@tauri-apps/api"
			),
			"@tauri-apps/plugin-shell": path.resolve(
				__dirname,
				"node_modules/@tauri-apps/plugin-shell"
			),
			"@tauri-apps/plugin-store": path.resolve(
				__dirname,
				"node_modules/@tauri-apps/plugin-store"
			),
		},
	},
	optimizeDeps: {
		include: ["@tauri-apps/api", "@tauri-apps/plugin-shell", "@tauri-apps/plugin-store"],
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		// Handle optional platform dependencies in tests
		alias: {
			// Mock Capacitor plugins for tests
			"@capacitor/app": path.resolve(__dirname, "./src/test/mocks/capacitor-app.ts"),
			"@capacitor/share": path.resolve(__dirname, "./src/test/mocks/capacitor-share.ts"),
			"@capacitor/toast": path.resolve(__dirname, "./src/test/mocks/capacitor-toast.ts"),
			"@capacitor/haptics": path.resolve(__dirname, "./src/test/mocks/capacitor-haptics.ts"),
			"@capacitor/status-bar": path.resolve(__dirname, "./src/test/mocks/capacitor-status-bar.ts"),
			"@capacitor/device": path.resolve(__dirname, "./src/test/mocks/capacitor-device.ts"),
			// Mock Tauri APIs for tests
			"@tauri-apps/api/shell": path.resolve(__dirname, "./src/test/mocks/tauri-shell.ts"),
			"@tauri-apps/api/window": path.resolve(__dirname, "./src/test/mocks/tauri-window.ts"),
			"@tauri-apps/api/event": path.resolve(__dirname, "./src/test/mocks/tauri-event.ts"),
			"@tauri-apps/api/notification": path.resolve(__dirname, "./src/test/mocks/tauri-notification.ts"),
			"@tauri-apps/api/app": path.resolve(__dirname, "./src/test/mocks/tauri-app.ts"),
			"@tauri-apps/api/clipboard": path.resolve(__dirname, "./src/test/mocks/tauri-clipboard.ts"),
		},
	},
	define: {
		"import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
		"import.meta.env.VITE_CHANNEL": JSON.stringify(channel),
		// Build info - same logic as write-build-json.js for consistency
		"import.meta.env.VITE_BUILD_ID": JSON.stringify(
			process.env.BUILD_ID ||
			`${process.env.COMMIT_REF || process.env.GIT_SHA || 'local'}.${process.env.DEPLOY_ID || Date.now()}`
		),
		"import.meta.env.VITE_BUILD_TIMESTAMP": JSON.stringify(Date.now()),
		"import.meta.env.VITE_COMMIT": JSON.stringify(
			process.env.COMMIT_REF || process.env.GIT_SHA || 'local'
		),
	},
	build: {
		target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
		// don't minify in debug mode
		minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
		sourcemap: !!process.env.TAURI_DEBUG,
		rollupOptions: {
			output: {
				manualChunks: (path) => {
					const reversedPath = path.split("/").reverse();
					return reversedPath[reversedPath.indexOf("node_modules") - 1];
				},
			},
			onwarn(warning, warn) {
				if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
				warn(warning);
			},
		},
		chunkSizeWarningLimit: 1600,
		external: [], // ensure nothing is wrongly externalized
	},
};});
