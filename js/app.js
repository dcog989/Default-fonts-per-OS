document.addEventListener("DOMContentLoaded", async () => {
	const storage = {
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

	const App = {
		elements: {},

		state: {
			fontData: null,
			webSafeFonts: new Set(),
			comparisonSet: new Set(),
			filters: { search: "", text: "", category: "all" },
		},

		defaultPangram:
			"Wilma Fox\u2019s lazy susan held quince jam, butter, pickles, olives, mustard, and vinegar. 1234567890.",

		presets: {
			"": "",
			alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz",
			chars: "0123456789 !@#$%^&*()_+-=[]{}|;':\",./<>?`",
			lorem: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		},

		// Common fontconfig alias pairs (source → resolved alias on Linux)
		fontconfigAliases: {
			"Courier New": ["Liberation Mono", "FreeMono", "DejaVu Sans Mono", "Noto Sans Mono"],
			"Arial": ["Liberation Sans", "FreeSans", "DejaVu Sans", "Noto Sans"],
			"Times New Roman": ["Liberation Serif", "FreeSerif", "DejaVu Serif", "Noto Serif"],
			"Consolas": ["Liberation Mono", "DejaVu Sans Mono", "Noto Sans Mono"],
			"Helvetica": ["Liberation Sans", "FreeSans", "Noto Sans"],
			"Georgia": ["Liberation Serif", "FreeSerif", "Noto Serif"],
			"Verdana": ["DejaVu Sans", "Liberation Sans", "Noto Sans"],
		},

		escapeCSS(str) {
			return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
		},
		escapeHTML(str) {
			return str
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;");
		},

		themeIcons: {
			auto: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Auto theme</title><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
			light:
				'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Light theme</title><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
			dark: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Dark theme</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
		},

		fontChecker: {
			cache: {},
			testString: "mw_il",
			testSize: "72px",
			testContainer: null,
			init: function () {
				if (this.testContainer) return;
				this.testContainer = document.createElement("div");
				this.testContainer.style.cssText = "position:absolute;top:-9999px;left:-9999px;";
				document.body.appendChild(this.testContainer);
			},
			measureWidth(font) {
				const el = document.createElement("span");
				el.textContent = this.testString;
				el.style.fontSize = this.testSize;
				el.style.fontFamily = font;
				this.testContainer.appendChild(el);
				const w = el.offsetWidth;
				this.testContainer.removeChild(el);
				return w;
			},

			isAvailable: function (font) {
				const fontLower = font.toLowerCase();
				if (this.cache[fontLower] !== undefined) return this.cache[fontLower];

				this.init();

				const generics = ["serif", "sans-serif", "monospace"];
				let differs = 0;

				for (const generic of generics) {
					const testEl = document.createElement("span");
					const baseEl = document.createElement("span");
					testEl.textContent = baseEl.textContent = this.testString;
					testEl.style.fontSize = baseEl.style.fontSize = this.testSize;
					testEl.style.fontFamily = `"${font}", ${generic}`;
					baseEl.style.fontFamily = generic;

					this.testContainer.appendChild(testEl);
					this.testContainer.appendChild(baseEl);

					if (testEl.offsetWidth !== baseEl.offsetWidth ||
						testEl.offsetHeight !== baseEl.offsetHeight) {
						differs++;
					}

					this.testContainer.removeChild(testEl);
					this.testContainer.removeChild(baseEl);
				}

				let isAvailable = differs >= 2;

				// De-alias: if the font looks available, check it isn't just a
				// fontconfig alias by comparing against known common alias targets.
				// If it renders identically to an alias target, it's not truly installed.
				if (isAvailable) {
					const candidates = App.fontconfigAliases[font];
					if (candidates) {
						const wTarget = this.measureWidth(`"${font}", serif`);
						for (const alias of candidates) {
							if (wTarget === this.measureWidth(`"${alias}", serif`)) {
								isAvailable = false;
								break;
							}
						}
					}
				}

				this.cache[fontLower] = isAvailable;
				return isAvailable;
			},
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
				const text = App.presets[e.target.value] ?? "";
				this.state.filters.text = text;
				this.elements.customTextInput.value = text;
				this.saveFilters();
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
					if (storage.get("theme", "auto") === "auto") this.applyTheme("auto");
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
		},

		clearAll() {
			// Clear filters
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

			// Clear comparison set
			this.state.comparisonSet.clear();
			this.saveComparisonSet();
			this.updateCompareLabel();

			// Re-render everything
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
			if (view === "list") this.renderListView(filteredData);
			else if (view === "table") this.renderTableView(filteredData);
			else if (view === "compare") this.renderCompareView();
			if (!skipFontCheck) this.runFontAvailabilityChecks();
		},

		createFontItemHTML(font, viewType) {
			const isChecked = this.state.comparisonSet.has(font.name)
				? "checked"
				: "";
			const safeName = this.escapeHTML(font.name);
			const cssName = this.escapeCSS(font.name);
			const webSafeIndicator = this.state.webSafeFonts.has(font.name)
				? `<span class="web-safe-indicator" title="Web-safe (found on 3+ OSes)"></span>`
				: "";
			const checkboxHTML = `<input type="checkbox" class="compare-checkbox" data-font-name="${safeName}" ${isChecked}>`;
			const textToShow = this.state.filters.text || this.defaultPangram;

			if (viewType !== "table") {
				return `<div class="font-item-wrapper">${checkboxHTML}<p class="font-display-item" style="font-family: '${cssName}'" data-font-name="${safeName}"><span class="font-name">${safeName}${webSafeIndicator}</span> ${textToShow}</p></div>`;
			}
			if (viewType === "table") {
				return `<div class="font-item-wrapper">${checkboxHTML}<span class="font-display-item" style="font-family: '${cssName}'" data-font-name="${safeName}">${safeName}${webSafeIndicator}</span></div>`;
			}
			return "";
		},

		renderListView(data) {
			this.elements.content.className = "list-view";
			this.elements.content.innerHTML = data
				.map(
					(os) =>
						`<h2>${os.name} (${os.fonts.length})</h2>${os.fonts.map((font) => this.createFontItemHTML(font, "list")).join("")}`,
				)
				.join("");
		},

		renderTableView(data) {
			this.elements.content.className = "table-view";
			const maxRows = Math.max(0, ...data.map((os) => os.fonts.length));
			let tableBodyHTML = "";
			for (let i = 0; i < maxRows; i++) {
				tableBodyHTML += `<tr>${data.map((os) => `<td>${i < os.fonts.length ? this.createFontItemHTML(os.fonts[i], "table") : ""}</td>`).join("")}</tr>`;
			}
			this.elements.content.innerHTML = `<table class="font-comparison-table"><thead><tr>${data.map((os) => `<th>${os.name} (${os.fonts.length})</th>`).join("")}</tr></thead><tbody>${tableBodyHTML}</tbody></table>`;
		},

		renderCompareView() {
			this.elements.content.className = "list-view";
			if (this.state.comparisonSet.size === 0) {
				this.elements.content.innerHTML =
					"<p>Select fonts to compare by clicking the checkbox next to their name in List or Table view.</p>";
				return;
			}
			const allFonts = this.state.fontData.operatingSystems.flatMap(
				(os) => os.fonts,
			);
			const fontsToCompare = [
				...new Map(allFonts.map((f) => [f.name, f])).values(),
			].filter((font) => this.state.comparisonSet.has(font.name));
			this.elements.content.innerHTML = `<h2>Comparison (${fontsToCompare.length})</h2>${fontsToCompare.map((font) => this.createFontItemHTML(font, "compare")).join("")}`;
		},

		runFontAvailabilityChecks() {
			this.elements.content
				.querySelectorAll("[data-font-name]")
				.forEach((elem) => {
					if (
						elem.dataset.fontName &&
						!this.fontChecker.isAvailable(elem.dataset.fontName)
					) {
						elem
							.closest(".font-item-wrapper")
							.classList.add("font-unavailable");
					}
				});
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
				this.themeIcons[storage.get("theme", "auto")];
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

			this.state.comparisonSet = new Set(storage.getJSON("comparisonSet", []));
			this.updateCompareLabel();

			const savedFilters = storage.getJSON("filters", null);
			if (savedFilters) {
				this.state.filters = savedFilters;
				this.elements.searchInput.value = savedFilters.search;
				this.elements.customTextInput.value = savedFilters.text ?? "";
				const categoryInput = this.elements.categorySelector.querySelector(
					`input[value="${savedFilters.category}"]`,
				);
				if (categoryInput) {
					categoryInput.checked = true;
				}
			}
		},
	};

	const files = ["windows-11", "macos-tahoe", "ios-26", "android", "linux-gnome", "linux-kde-plasma", "linux-xfce", "linux-cinnamon"];
	let operatingSystems;
	try {
		const responses = await Promise.all(
			files.map((f) => fetch(`data/${f}.json`).then((r) => {
				if (!r.ok) throw new Error(`Failed to load ${f}.json (${r.status})`);
				return r;
			})),
		);
		operatingSystems = await Promise.all(responses.map((r) => r.json()));
	} catch (err) {
		document.getElementById("content").innerHTML =
			`<p>Failed to load font data: ${err.message}</p>`;
		return;
	}
	App.init({ operatingSystems });
});
