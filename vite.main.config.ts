import 'dotenv/config';

import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	define: {
		// Baked default for packaged builds. Runtime env var still overrides.
		__VITA_GITHUB_CLIENT_ID__: JSON.stringify(
			process.env.VITA_GITHUB_CLIENT_ID ??
				process.env.CV_PILOT_GITHUB_CLIENT_ID ??
				""
		),
		// Legacy constant retained for backwards compatibility.
		__CV_PILOT_GITHUB_CLIENT_ID__: JSON.stringify(
			process.env.CV_PILOT_GITHUB_CLIENT_ID ??
				process.env.VITA_GITHUB_CLIENT_ID ??
				""
		),
	},
});
