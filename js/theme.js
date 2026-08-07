import { themeIcons } from "./constants.js";
import { storage } from "./storage.js";

export function applyTheme(theme, toggleEl) {
	const osPrefersDark = window.matchMedia(
		"(prefers-color-scheme: dark)"
	).matches;
	if (theme === "light" || (theme === "auto" && !osPrefersDark)) {
		document.documentElement.classList.add("light-theme");
	} else {
		document.documentElement.classList.remove("light-theme");
	}
	storage.set("theme", theme);
	updateThemeIcon(toggleEl);
}

export function cycleTheme(toggleEl) {
	const order = ["auto", "light", "dark"];
	const current = storage.get("theme", "auto");
	const next = order[(order.indexOf(current) + 1) % order.length];
	applyTheme(next, toggleEl);
}

export function updateThemeIcon(toggleEl) {
	toggleEl.innerHTML = themeIcons[storage.get("theme", "auto")];
}
