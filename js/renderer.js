import { escapeCSS, escapeHTML, defaultPangram } from './constants.js';
import { fontChecker } from './font-checker.js';

function createFontItemHTML(app, font, viewType) {
	const isChecked = app.state.comparisonSet.has(font.name) ? "checked" : "";
	const safeName = escapeHTML(font.name);
	const cssName = escapeCSS(font.name);
	const webSafeIndicator = app.state.webSafeFonts.has(font.name)
		? `<span class="web-safe-indicator" title="Web-safe (found on 3+ OSes)"></span>`
		: "";
	const checkboxHTML = `<input type="checkbox" class="compare-checkbox" data-font-name="${safeName}" ${isChecked}>`;
	const textToShow = app.state.filters.text || defaultPangram;

	if (viewType !== "table") {
		return `<div class="font-item-wrapper">${checkboxHTML}<fieldset class="font-display-item" style="font-family: '${cssName}'" data-font-name="${safeName}"><legend class="font-name">${safeName}${webSafeIndicator}</legend> ${textToShow}</fieldset></div>`;
	}
	if (viewType === "table") {
		return `<div class="font-item-wrapper">${checkboxHTML}<span class="font-display-item" style="font-family: '${cssName}'" data-font-name="${safeName}">${safeName}${webSafeIndicator}</span></div>`;
	}
	return "";
}

function renderCollapseIcon(app, osName) {
	const collapsed = app.state.collapsed?.[osName];
	return `<span class="collapse-toggle" style="transform: rotate(${collapsed ? 0 : 180}deg)"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/></svg></span>`;
}

function restoreCollapsedStates(app) {
	if (!app.state.collapsed) return;
	app.elements.content.querySelectorAll(".os-set").forEach((set) => {
		const name = set.dataset.osName;
		if (app.state.collapsed[name]) {
			set.classList.add("collapsed");
		}
	});
}

export function renderListView(app, data) {
	app.elements.content.className = "list-view";
	app.elements.content.innerHTML = data
		.map(
			(os) =>
				`<div class="os-set" draggable="true" data-os-name="${escapeHTML(os.name)}"><div class="os-set-header">${renderCollapseIcon(app, os.name)}<h2>${os.name} (${os.fonts.length})</h2></div>${os.fonts.map((font) => createFontItemHTML(app, font, "list")).join("")}</div>`,
		)
		.join("");
	restoreCollapsedStates(app);
}

export function renderTableView(app, data) {
	app.elements.content.className = "table-view";
	const maxRows = Math.max(0, ...data.map((os) => os.fonts.length));
	let tableBodyHTML = "";
	for (let i = 0; i < maxRows; i++) {
		tableBodyHTML += `<tr>${data.map((os) => `<td>${i < os.fonts.length ? createFontItemHTML(app, os.fonts[i], "table") : ""}</td>`).join("")}</tr>`;
	}
	app.elements.content.innerHTML = `<table class="font-comparison-table"><thead><tr>${data.map((os) => `<th>${os.name} (${os.fonts.length})</th>`).join("")}</tr></thead><tbody>${tableBodyHTML}</tbody></table>`;
}

export function renderCompareView(app) {
	app.elements.content.className = "compare-view";
	if (app.state.comparisonSet.size === 0) {
		app.elements.content.innerHTML =
			"<p>Select fonts to compare by clicking the checkbox next to their name in List or Table view.</p>";
		return;
	}
	const allFonts = app.state.fontData.operatingSystems.flatMap(
		(os) => os.fonts,
	);
	const fontsToCompare = [
		...new Map(allFonts.map((f) => [f.name, f])).values(),
	].filter((font) => app.state.comparisonSet.has(font.name));
	app.elements.content.innerHTML = `<h2>Comparison (${fontsToCompare.length})</h2>${fontsToCompare.map((font) => createFontItemHTML(app, font, "compare")).join("")}`;
}

export function runFontAvailabilityChecks(app) {
	app.elements.content
		.querySelectorAll("[data-font-name]")
		.forEach((elem) => {
			if (
				elem.dataset.fontName &&
				!fontChecker.isAvailable(elem.dataset.fontName)
			) {
				elem
					.closest(".font-item-wrapper")
					.classList.add("font-unavailable");
			}
		});
}
