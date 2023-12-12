// import adapter from 'sveltekit-adapter-chrome-extension';
import autoprefixer from "autoprefixer";
import preprocess from "svelte-preprocess";
import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
		preprocess({
			scss: {
				prependData: `
			@import "src/styles/root/_mixins.scss";
			`,
			},
			postcss: {
				plugins: [autoprefixer()],
			},
		}),
	],

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		appDir: 'app'
	},
	
};

export default config;
