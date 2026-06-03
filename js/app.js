import { presets } from "./constants.js";
import { onDragEnd, onDragOver, onDragStart, onDrop } from "./dragdrop.js";
import {
	restoreOsOrder,
	saveComparisonSet,
	saveFilters,
} from "./preferences.js";
import {
	renderCompareView,
	renderListView,
	renderTableView,
	runFontAvailabilityChecks,
} from "./renderer.js";
import { storage } from "./storage.js";
import { fontChecker } from "./font-checker.js";
import { applyTheme, cycleTheme } from "./theme.js";

document.addEventListener("DOMContentLoaded", async () => {
	const App = {
		elements: {},

		state: {
			fontData: null,
			webSafeFonts: new Set(),
			comparisonSet: new Set(),
			filters: { search: "", text: "", category: "all" },
			collapsed: null,
		},

		cacheElements() {
			this.elements = {
				content: document.getElementById("content"),
				viewSelector: document.getElementById("view-selector"),
				fontSizeSelector: document.getElementById("font-size-selector"),
				themeToggle: document.getElementById("theme-toggle"),
				searchInput: document.getElementById("search-input"),
				customTextInput: document.getElementById("custom-text-input"),
				categorySelector: document.getElementById("category-selector"),
				categoryControls: document.getElementById("category-controls"),
				compareLabel: document.getElementById("compare-label"),
				backToTopButton: document.getElementById("back-to-top"),
				clearAllButton: document.getElementById("clear-all-button"),
				copySelectedButton: document.getElementById("copy-selected-button"),
				presetSelector: document.getElementById("preset-selector"),
			};
		},

		init(data) {
			this.cacheElements();
			this.state.fontData = data;
			this.populateFontSizeSelector();
			this.calculateWebSafeFonts();
			this.setupCategoryFilter();
			this.setupEventListeners();
			this.loadPreferences();
			this.render();
		},

		populateFontSizeSelector() {
			for (let i = 10; i <= 28; i++) {
				const option = document.createElement("option");
				option.value = i;
				option.textContent = `${i}px`;
				this.elements.fontSizeSelector.appendChild(option);
			}
		},

		calculateWebSafeFonts() {
			const fontCounts = new Map();
			this.state.fontData.operatingSystems.forEach((os) => {
				os.fonts.forEach((font) => {
					fontCounts.set(font.name, (fontCounts.get(font.name) || 0) + 1);
				});
			});
			fontCounts.forEach((count, fontName) => {
				if (count >= 3) this.state.webSafeFonts.add(fontName);
			});
		},

		setupCategoryFilter() {
			const categories = new Set(["all"]);
			this.state.fontData.operatingSystems.forEach((os) => {
				os.fonts.forEach((font) => {
					categories.add(font.category);
				});
			});
			this.elements.categorySelector.innerHTML = [...categories]
				.sort()
				.map(
					(cat) => `
				<input type="radio" id="cat-${cat}" name="category" value="${cat}">
				<label for="cat-${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</label>
			`,
				)
				.join("");
			this.elements.categoryControls.style.display = "flex";
		},

		setupEventListeners() {
			this.elements.modalClose = document.querySelector(".modal-close");
			this.elements.modalOverlay = document.getElementById("font-modal");

			this.elements.modalClose.addEventListener("click", () =>
				this.closeFontModal(),
			);
			this.elements.modalOverlay.addEventListener("click", (e) => {
				if (e.target === this.elements.modalOverlay) this.closeFontModal();
			});
			document.addEventListener("keydown", (e) => {
				if (e.key === "Escape") this.closeFontModal();
			});

			this.elements.viewSelector.addEventListener("change", () =>
				this.render(),
			);
			this.elements.fontSizeSelector.addEventListener("change", (e) =>
				this.applyFontSize(e.target.value),
			);
			this.elements.themeToggle.addEventListener("click", () =>
				cycleTheme(this),
			);

			this.elements.searchInput.addEventListener("input", (e) => {
				this.state.filters.search = e.target.value.toLowerCase();
				saveFilters(this);
				this.render();
			});
			this.elements.customTextInput.addEventListener("input", (e) => {
				this.state.filters.text = e.target.value;
				this.elements.presetSelector.value = "";
				this.render();
			});
			this.elements.presetSelector.addEventListener("change", (e) => {
				this.state.filters.text = presets[e.target.value] ?? "";
				this.render();
			});
			this.elements.categorySelector.addEventListener("change", (e) => {
				this.state.filters.category = e.target.value;
				saveFilters(this);
				this.render();
			});

			this.elements.clearAllButton.addEventListener("click", () =>
				this.clearAll(),
			);
			this.elements.copySelectedButton.addEventListener("click", () =>
				this.copySelectedFonts(),
			);

			window.addEventListener("scroll", () =>
				this.elements.backToTopButton.classList.toggle(
					"show",
					window.scrollY > 200,
				),
			);
			this.elements.backToTopButton.addEventListener("click", () =>
				window.scrollTo(0, 0),
			);

			window
				.matchMedia("(prefers-color-scheme: dark)")
				.addEventListener("change", () => {
					if (storage.get("theme", "auto") === "auto") applyTheme(this, "auto");
				});

			this.elements.content.addEventListener("change", (e) => {
				if (e.target.matches(".compare-checkbox")) {
					const fontName = e.target.dataset.fontName;
					if (e.target.checked) this.state.comparisonSet.add(fontName);
					else this.state.comparisonSet.delete(fontName);
					this.updateCompareLabel();
					saveComparisonSet(this);
				}
			});

			this.elements.content.addEventListener("dragstart", (e) =>
				onDragStart(this, e),
			);
			this.elements.content.addEventListener("dragover", (e) =>
				onDragOver(this, e),
			);
			this.elements.content.addEventListener("drop", (e) => onDrop(this, e));
			this.elements.content.addEventListener("dragend", (e) =>
				onDragEnd(this, e),
			);
			this.elements.content.addEventListener("click", (e) =>
				this.onCollapseClick(e),
			);
			this.elements.content.addEventListener("click", (e) =>
				this.onFontClick(e),
			);
		},

		clearAll() {
			this.state.filters.search = "";
			this.state.filters.category = "all";
			this.state.filters.text = "";
			this.elements.searchInput.value = "";
			this.elements.customTextInput.value = "";
			this.elements.presetSelector.value = "";
			this.elements.categorySelector.querySelector(
				'input[value="all"]',
			).checked = true;
			saveFilters(this);

			this.state.comparisonSet.clear();
			saveComparisonSet(this);
			this.updateCompareLabel();

			this.render();
		},

		applyFilters(osData) {
			const { search, category } = this.state.filters;
			return osData
				.map((os) => ({
					...os,
					fonts: os.fonts.filter(
						(font) =>
							font.name.toLowerCase().includes(search) &&
							(category === "all" || font.category === category),
					),
				}))
				.filter((os) => os.fonts.length > 0);
		},

		render(skipFontCheck = false) {
			this.closeFontModal();
			const filteredData = this.applyFilters(
				this.state.fontData.operatingSystems,
			);
			const view =
				this.elements.viewSelector.querySelector("input:checked").value;
			if (view === "list") renderListView(this, filteredData);
			else if (view === "table") renderTableView(this, filteredData);
			else if (view === "compare") renderCompareView(this);
			if (!skipFontCheck) runFontAvailabilityChecks(this);
		},

		// --- Font Modal ---
		onFontClick(e) {
			const item = e.target.closest(".font-display-item");
			if (!item) return;
			if (e.target.closest(".compare-checkbox")) return;
			const fontName = item.dataset.fontName;
			if (!fontName) return;
			this.showFontModal(fontName);
		},

		findFontDetails(fontName) {
			const oses = [];
			let category = "";
			for (const os of this.state.fontData.operatingSystems) {
				for (const font of os.fonts) {
					if (font.name === fontName) {
						oses.push(os.name);
						category = font.category;
						break;
					}
				}
			}
			return { category, oses };
		},

		showFontModal(fontName) {
			const { category, oses } = this.findFontDetails(fontName);
			const cssName = fontName.includes(" ")
				? `'${fontName}'`
				: fontName;
			const available = fontChecker.isAvailable(fontName);
			const webSafe = this.state.webSafeFonts.has(fontName);
			const specimenText =
				"MANY YEARS LATER as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice. At that time Macondo was a village of twenty adobe houses, built on the bank of a river of clear water that ran along a bed of polished stones, which were white and enormous, like prehistoric eggs. The world was so recent that many things lacked names, and in order to indicate them it was necessary to point. Every year during the month of March a family of ragged gypsies would set up their tents near the village, and with a great uproar of pipes and kettledrums they would display new inventions.	... 1234567890 ... !\"£$%^&*()[];'#,./";

			const tags = [];
			if (webSafe) tags.push(`<span class="modal-tag web-safe" title="Found on 3+ OSes">Web safe</span>`);
			if (!available) tags.push(`<span class="modal-tag not-available" title="Using nearest equivalent font.">Not installed</span>`);

			this.elements.modalBody = document.getElementById("modal-body");
			this.elements.modalBody.innerHTML = `
				<p class="modal-font-name" style="font-family: ${cssName}">${fontName} ${tags.join(" ")}</p>
				<p class="modal-specimen" style="font-family: ${cssName}">${specimenText}</p>
				<div class="modal-details">
					<span><strong>Category:</strong> ${category || "—"}</span>
					<span><strong>Found on:</strong> ${oses.join(", ") || "—"}</span>
				</div>
			`;
			this.elements.modalOverlay.classList.remove("hidden");
		},

		closeFontModal() {
			this.elements.modalOverlay.classList.add("hidden");
		},

		// --- Collapse ---
		onCollapseClick(e) {
			const toggle = e.target.closest(".collapse-toggle");
			if (!toggle) return;
			const set = toggle.closest(".os-set");
			if (!set) return;
			const name = set.dataset.osName;
			set.classList.toggle("collapsed");
			if (!this.state.collapsed) this.state.collapsed = {};
			this.state.collapsed[name] = set.classList.contains("collapsed");
			storage.set("collapsed", JSON.stringify(this.state.collapsed));
		},

		updateCompareLabel() {
			const size = this.state.comparisonSet.size;
			this.elements.compareLabel.textContent = `Compare (${size})`;
			this.elements.copySelectedButton.disabled = size === 0;
		},

		copySelectedFonts() {
			if (this.state.comparisonSet.size === 0) return;
			const fontList = Array.from(this.state.comparisonSet)
				.map((font) => (font.includes(" ") ? `'${font}'` : font))
				.join(", ");
			const cssString = `font-family: ${fontList};`;
			navigator.clipboard
				.writeText(cssString)
				.then(() => {
					const button = this.elements.copySelectedButton;
					const originalText = button.textContent;
					const currentWidth = button.offsetWidth;
					button.style.minWidth = `${currentWidth}px`;
					button.textContent = "Copied!";
					setTimeout(() => {
						button.textContent = originalText;
						button.style.minWidth = "";
					}, 1500);
				})
				.catch(() => {
					const button = this.elements.copySelectedButton;
					const originalText = button.textContent;
					button.textContent = "Failed";
					setTimeout(() => {
						button.textContent = originalText;
					}, 1500);
				});
		},

		applyFontSize(size) {
			document.documentElement.style.setProperty(
				"--sample-font-size",
				`${size}px`,
			);
			storage.set("fontSize", size);
		},

		loadPreferences() {
			const savedTheme = storage.get("theme", "auto");
			applyTheme(this, savedTheme);

			const savedFontSize = storage.get("fontSize", "16");
			this.elements.fontSizeSelector.value = savedFontSize;
			document.documentElement.style.setProperty(
				"--sample-font-size",
				`${savedFontSize}px`,
			);

			this.state.comparisonSet = new Set(storage.getJSON("comparisonSet", []));
			this.updateCompareLabel();

			const savedFilters = storage.getJSON("filters", null);
			if (savedFilters) {
				this.state.filters = savedFilters;
				this.elements.searchInput.value = savedFilters.search;
				const categoryInput = this.elements.categorySelector.querySelector(
					`input[value="${savedFilters.category}"]`,
				);
				if (categoryInput) {
					categoryInput.checked = true;
				}
			}

			this.state.collapsed = storage.getJSON("collapsed", null);

			restoreOsOrder(this);
		},
	};

	const files = [
		"windows-11",
		"macos-tahoe",
		"ios-26",
		"android",
		"linux-gnome",
		"linux-kde-plasma",
		"linux-xfce",
		"linux-cinnamon",
	];
	let operatingSystems;
	try {
		const responses = await Promise.all(
			files.map((f) =>
				fetch(`data/${f}.json`).then((r) => {
					if (!r.ok) throw new Error(`Failed to load ${f}.json (${r.status})`);
					return r;
				}),
			),
		);
		operatingSystems = await Promise.all(responses.map((r) => r.json()));
	} catch (err) {
		document.getElementById("content").innerHTML =
			`<p>Failed to load font data: ${err.message}</p>`;
		return;
	}
	App.init({ operatingSystems });
});
