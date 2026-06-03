export const storage = {
	get(key, fallback) {
		try {
			const v = localStorage.getItem(key);
			return v !== null ? v : fallback;
		} catch {
			return fallback;
		}
	},
	set(key, value) {
		try {
			localStorage.setItem(key, value);
		} catch {
			/* localStorage unavailable */
		}
	},
	getJSON(key, fallback) {
		try {
			return JSON.parse(localStorage.getItem(key)) ?? fallback;
		} catch {
			return fallback;
		}
	},
};
