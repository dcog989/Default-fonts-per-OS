import { storage } from './storage.js';
import { presets, themeIcons } from './constants.js';
import {
	renderListView,
	renderTableView,
	renderCompareView,
	runFontAvailabilityChecks,
} from './renderer.js';

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
			this.elements.viewSelector.addEventListener("change", () =>
				this.render(),
			);
			this.elements.fontSizeSelector.addEventListener("change", (e) =>
				this.applyFontSize(e.target.value),
			);
			this.elements.themeToggle.addEventListener("click", () =>
				this.cycleTheme(),
			);

			this.elements.searchInput.addEventListener("input", (e) => {
				this.state.filters.search = e.target.value.toLowerCase();
				this.saveFilters();
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
				this.saveFilters();
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
					if (storage.get("theme", "auto") === "auto")
						this.applyTheme("auto");
				});

			this.elements.content.addEventListener("change", (e) => {
				if (e.target.matches(".compare-checkbox")) {
					const fontName = e.target.dataset.fontName;
					if (e.target.checked) this.state.comparisonSet.add(fontName);
					else this.state.comparisonSet.delete(fontName);
					this.updateCompareLabel();
					this.saveComparisonSet();
				}
			});

			this.elements.content.addEventListener("dragstart", (e) =>
				this.onDragStart(e),
			);
			this.elements.content.addEventListener("dragover", (e) =>
				this.onDragOver(e),
			);
			this.elements.content.addEventListener("drop", (e) => this.onDrop(e));
			this.elements.content.addEventListener("dragend", (e) =>
				this.onDragEnd(e),
			);
			this.elements.content.addEventListener("click", (e) =>
				this.onCollapseClick(e),
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
			this.saveFilters();

			this.state.comparisonSet.clear();
			this.saveComparisonSet();
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

		// --- Drag & Drop ---
		dragSrc: null,
		onDragStart(e) {
			const set = e.target.closest(".os-set");
			if (!set) return;
			this.dragSrc = set;
			set.classList.add("dragging");
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", "");
		},
		onDragOver(e) {
			if (!this.dragSrc) return;
			e.preventDefault();
			const target = e.target.closest(".os-set");
			if (!target || target === this.dragSrc) return;
			const rect = target.getBoundingClientRect();
			const midY = rect.top + rect.height / 2;
			if (e.clientY < midY) {
				target.parentNode.insertBefore(this.dragSrc, target);
			} else {
				target.parentNode.insertBefore(this.dragSrc, target.nextSibling);
			}
		},
		onDrop(e) {
			e.preventDefault();
		},
		onDragEnd() {
			if (this.dragSrc) this.dragSrc.classList.remove("dragging");
			this.dragSrc = null;
			this.persistOrder();
		},

		persistOrder() {
			const domOrder = [
				...this.elements.content.querySelectorAll(".os-set"),
			].map((el) => el.dataset.osName);

			if (!this.state.fontData) return;
			const map = {};
			this.state.fontData.operatingSystems.forEach((os) => {
				map[os.name] = os;
			});
			const reordered = domOrder.map((name) => map[name]).filter(Boolean);
			const remaining = this.state.fontData.operatingSystems.filter(
				(os) => !domOrder.includes(os.name),
			);
			this.state.fontData.operatingSystems = reordered.concat(remaining);

			const finalOrder = this.state.fontData.operatingSystems.map(
				(os) => os.name,
			);
			storage.set("osOrder", JSON.stringify(finalOrder));
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

		applyTheme(theme) {
			const osPrefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			if (theme === "light" || (theme === "auto" && !osPrefersDark)) {
				document.documentElement.classList.add("light-theme");
			} else {
				document.documentElement.classList.remove("light-theme");
			}
			storage.set("theme", theme);
			this.updateThemeIcon();
		},

		cycleTheme() {
			const order = ["auto", "light", "dark"];
			const current = storage.get("theme", "auto");
			const next = order[(order.indexOf(current) + 1) % order.length];
			this.applyTheme(next);
		},

		updateThemeIcon() {
			this.elements.themeToggle.innerHTML =
				themeIcons[storage.get("theme", "auto")];
		},

		saveComparisonSet() {
			storage.set(
				"comparisonSet",
				JSON.stringify(Array.from(this.state.comparisonSet)),
			);
		},

		saveFilters() {
			storage.set("filters", JSON.stringify(this.state.filters));
		},

		loadPreferences() {
			const savedTheme = storage.get("theme", "auto");
			this.applyTheme(savedTheme);

			const savedFontSize = storage.get("fontSize", "16");
			this.elements.fontSizeSelector.value = savedFontSize;
			document.documentElement.style.setProperty(
				"--sample-font-size",
				`${savedFontSize}px`,
			);

			this.state.comparisonSet = new Set(
				storage.getJSON("comparisonSet", []),
			);
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

			this.restoreOsOrder();
		},

		restoreOsOrder() {
			const raw = storage.get("osOrder", null);
			if (!raw) return;
			let savedOrder;
			try {
				savedOrder = JSON.parse(raw);
			} catch {
				return;
			}
			if (
				!savedOrder ||
				!Array.isArray(savedOrder) ||
				!this.state.fontData
			)
				return;

			const map = {};
			this.state.fontData.operatingSystems.forEach((os) => {
				map[os.name] = os;
			});
			const reordered = savedOrder
				.map((name) => map[name])
				.filter(Boolean);
			const remaining = this.state.fontData.operatingSystems.filter(
				(os) => !savedOrder.includes(os.name),
			);
			this.state.fontData.operatingSystems =
				reordered.concat(remaining);
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
					if (!r.ok)
						throw new Error(`Failed to load ${f}.json (${r.status})`);
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
