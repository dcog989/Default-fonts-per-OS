export const defaultPangram =
	"When zombies arrive, quickly fax Judge Pat. 1234567890.";

export const presets = {
	"": "",
	alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz",
	chars: "0123456789 !@#$%^&*()_+-=[]{}|;':\",./<>?`",
	lorem: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
};

export const fontconfigAliases = {
	"Courier New": ["Liberation Mono", "FreeMono", "DejaVu Sans Mono", "Noto Sans Mono"],
	"Arial": ["Liberation Sans", "FreeSans", "DejaVu Sans", "Noto Sans"],
	"Times New Roman": ["Liberation Serif", "FreeSerif", "DejaVu Serif", "Noto Serif"],
	"Consolas": ["Liberation Mono", "DejaVu Sans Mono", "Noto Sans Mono"],
	"Helvetica": ["Liberation Sans", "FreeSans", "Noto Sans"],
	"Georgia": ["Liberation Serif", "FreeSerif", "Noto Serif"],
	"Verdana": ["DejaVu Sans", "Liberation Sans", "Noto Sans"],
};

export const themeIcons = {
	auto: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Auto theme</title><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
	light:
		'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Light theme</title><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
	dark: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Dark theme</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
};

export function escapeCSS(str) {
	return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function escapeHTML(str) {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
