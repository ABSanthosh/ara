import { browser } from '$app/environment';
// export const ssr = false;
import options from '$lib/OptionStore';

export function load() {
	// if (typeof window === 'undefined') return;
	if (!browser) {
		return {
			options: false
		};
	}
	if (localStorage.getItem('options')) {
		options.set({
			...options,
			sidebarIsClosed: JSON.parse(localStorage.getItem('options')!).sidebarIsClosed
		});
	}
	return {
		options: JSON.parse(localStorage.getItem('options')!)
	};
}
