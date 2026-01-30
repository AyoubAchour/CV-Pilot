import { defineConfig } from "vite";
import path from "node:path";

// https://vitejs.dev/config
export default defineConfig({
	resolve: {
		alias: {
			lucide: path.resolve(
				__dirname,
				"node_modules/lucide/dist/esm/lucide/src/lucide.js",
			),
		},
	},
});
