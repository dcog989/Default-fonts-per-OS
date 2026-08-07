import { toCSSFontFamily, specimenText } from "./constants.js";
import { fontChecker } from "./font-checker.js";

export function findFontDetails(fontData, fontName) {
	const oses = [];
	let category = "";
	for (const os of fontData.operatingSystems) {
		for (const font of os.fonts) {
			if (font.name === fontName) {
				oses.push(os.name);
				category = font.category;
				break;
			}
		}
	}
	return { category, oses };
}

export function openFontModal(state, elements, fontName) {
	const { category, oses } = findFontDetails(state.fontData, fontName);
	const cssName = toCSSFontFamily(fontName);
	const available = fontChecker.isAvailable(fontName);
	const webSafe = state.webSafeFonts.has(fontName);

	const tags = [];
	if (webSafe) tags.push(`<span class="modal-tag web-safe" title="Found on 3+ OSes">Web safe</span>`);
	if (!available) tags.push(`<span class="modal-tag not-available" title="Using nearest equivalent font.">Not installed</span>`);

	elements.modalBody.innerHTML = `
		<p class="modal-font-name" style="font-family: ${cssName}">${fontName} ${tags.join(" ")}</p>
		<p class="modal-specimen" style="font-family: ${cssName}">${specimenText}</p>
		<div class="modal-details">
			<span><strong>Category:</strong> ${category || "—"}</span>
			<span><strong>Found on:</strong> ${oses.join(", ") || "—"}</span>
		</div>
	`;
	elements.modalOverlay.classList.remove("hidden");
}

export function closeFontModal(elements) {
	elements.modalOverlay.classList.add("hidden");
}

export function onFontClick(state, elements, e) {
	const item = e.target.closest(".font-display-item");
	if (!item) return;
	const fontName = item.dataset.fontName;
	if (!fontName) return;
	openFontModal(state, elements, fontName);
}
