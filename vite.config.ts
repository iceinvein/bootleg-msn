import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Read package.json to get version
	const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
	
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
		},
	},
	define: {
		"import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
		"import.meta.env.VITE_BUILD_TIMESTAMP": JSON.stringify(Date.now().toString()),
	},
};});
