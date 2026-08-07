import { toCSSFontFamily } from "./constants.js";

export function copySelectedFonts(comparisonSet, button) {
	if (comparisonSet.size === 0) return;
	const fontList = Array.from(comparisonSet).map(toCSSFontFamily).join(", ");
	const cssString = `font-family: ${fontList};`;
	navigator.clipboard
		.writeText(cssString)
		.then(() => flashButton(button, "Copied!", true))
		.catch(() => flashButton(button, "Failed", false));
}

function flashButton(button, message, preserveWidth) {
	const originalText = button.textContent;
	if (preserveWidth) button.style.minWidth = `${button.offsetWidth}px`;
	button.textContent = message;
	setTimeout(() => {
		button.textContent = originalText;
		if (preserveWidth) button.style.minWidth = "";
	}, 1500);
}
