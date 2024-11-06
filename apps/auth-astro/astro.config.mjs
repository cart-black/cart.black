import { defineConfig } from "astro/config";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone"
	}),
	security: {
		checkOrigin: true // TODO: I may need a custom function to check the origin for proxied requests
	}
});