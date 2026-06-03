import { storage } from './storage.js';
import { themeIcons } from './constants.js';

export function applyTheme(app, theme) {
	const osPrefersDark = window.matchMedia(
		"(prefers-color-scheme: dark)",
	).matches;
	if (theme === "light" || (theme === "auto" && !osPrefersDark)) {
		document.documentElement.classList.add("light-theme");
	} else {
		document.documentElement.classList.remove("light-theme");
	}
	storage.set("theme", theme);
	updateThemeIcon(app);
}

export function cycleTheme(app) {
	const order = ["auto", "light", "dark"];
	const current = storage.get("theme", "auto");
	const next = order[(order.indexOf(current) + 1) % order.length];
	applyTheme(app, next);
}

export function updateThemeIcon(app) {
	app.elements.themeToggle.innerHTML =
		themeIcons[storage.get("theme", "auto")];
}
