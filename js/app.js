window.addEventListener('load', () => {

    const App = {
        elements: {
            content: document.getElementById('content'),
            viewSelector: document.getElementById('view-selector'),
            fontSizeSelector: document.getElementById('font-size-selector'),
            themeSelector: document.getElementById('theme-selector'),
            searchInput: document.getElementById('search-input'),
            customTextInput: document.getElementById('custom-text-input'),
            categorySelector: document.getElementById('category-selector'),
            categoryControls: document.getElementById('category-controls'),
            compareLabel: document.getElementById('compare-label'),
            backToTopButton: document.getElementById('back-to-top'),
            clearAllButton: document.getElementById('clear-all-button'),
            copySelectedButton: document.getElementById('copy-selected-button'),
        },

        state: {
            fontData: null,
            webSafeFonts: new Set(),
            comparisonSet: new Set(),
            filters: { search: '', text: '', category: 'all' },
        },

        defaultPangram: 'Wilma Fox’s lazy susan held quince jam, butter, pickles, olives, mustard, and vinegar. 1234567890.',

        fontChecker: {
            cache: {},
            testString: 'mw_il',
            testSize: '72px',
            testContainer: null,
            baseDims: {},
            init: function () {
                if (this.testContainer) return;
                this.testContainer = document.createElement("div");
                this.testContainer.style.cssText = `position:absolute; top:-9999px; left:-9999px; font-size:${this.testSize};`;
                document.body.appendChild(this.testContainer);
                this.baseDims.serif = this.getDimensions('serif');
                this.baseDims.sans = this.getDimensions('sans-serif');
                this.baseDims.mono = this.getDimensions('monospace');
            },
            getDimensions: function (font) {
                const span = document.createElement("span"); span.style.fontFamily = font; span.textContent = this.testString; this.testContainer.appendChild(span);
                const dims = { width: span.offsetWidth, height: span.offsetHeight }; this.testContainer.removeChild(span); return dims;
            },
            isAvailable: function (font) {
                // Lazy initialization: run init() only on the first check.
                if (!this.testContainer) {
                    this.init();
                }
                const fontLower = font.toLowerCase();
                if (this.cache[fontLower] !== undefined) return this.cache[fontLower];

                const serifTest = this.getDimensions(`"${font}", serif`);
                const sansTest = this.getDimensions(`"${font}", sans-serif`);

                const isDifferentFromSerif = serifTest.width !== this.baseDims.serif.width || serifTest.height !== this.baseDims.serif.height;
                const isDifferentFromSans = sansTest.width !== this.baseDims.sans.width || sansTest.height !== this.baseDims.sans.height;

                const isAvailable = isDifferentFromSerif && isDifferentFromSans;
                this.cache[fontLower] = isAvailable;
                return isAvailable;
            }
        },

        init(fontData) {
            this.state.fontData = fontData;
            // The fontChecker is initialized lazily to prevent forcing a layout too early.
            this.populateFontSizeSelector();
            this.calculateWebSafeFonts();
            this.setupCategoryFilter();
            this.setupEventListeners();
            this.loadPreferences();
            this.render();
        },

        populateFontSizeSelector() {
            for (let i = 10; i <= 28; i++) {
                const option = document.createElement('option'); option.value = i; option.textContent = `${i}px`;
                this.elements.fontSizeSelector.appendChild(option);
            }
        },

        calculateWebSafeFonts() {
            const fontCounts = new Map();
            this.state.fontData.operatingSystems.forEach(os => {
                os.fonts.forEach(font => fontCounts.set(font.name, (fontCounts.get(font.name) || 0) + 1));
            });
            fontCounts.forEach((count, fontName) => { if (count >= 3) this.state.webSafeFonts.add(fontName); });
        },

        setupCategoryFilter() {
            const categories = new Set(['all']);
            this.state.fontData.operatingSystems.forEach(os => os.fonts.forEach(font => categories.add(font.category)));
            this.elements.categorySelector.innerHTML = [...categories].sort().map(cat => `
                <input type="radio" id="cat-${cat}" name="category" value="${cat}">
                <label for="cat-${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</label>
            `).join('');
            this.elements.categoryControls.style.display = 'flex';
        },

        setupEventListeners() {
            this.elements.viewSelector.addEventListener('change', () => this.render());
            this.elements.fontSizeSelector.addEventListener('change', (e) => this.applyFontSize(e.target.value));
            this.elements.themeSelector.addEventListener('change', (e) => this.applyTheme(e.target.value));

            this.elements.searchInput.addEventListener('input', e => { this.state.filters.search = e.target.value.toLowerCase(); this.saveFilters(); this.render(); });
            this.elements.customTextInput.addEventListener('input', e => { this.state.filters.text = e.target.value; this.render(); });
            this.elements.categorySelector.addEventListener('change', e => { this.state.filters.category = e.target.value; this.saveFilters(); this.render(); });

            this.elements.clearAllButton.addEventListener('click', () => this.clearAll());
            this.elements.copySelectedButton.addEventListener('click', () => this.copySelectedFonts());

            window.addEventListener('scroll', () => this.elements.backToTopButton.classList.toggle('show', window.scrollY > 200));
            this.elements.backToTopButton.addEventListener('click', () => window.scrollTo(0, 0));

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if ((localStorage.getItem('theme') || 'auto') === 'auto') this.applyTheme('auto'); });

            this.elements.content.addEventListener('change', (e) => {
                if (e.target.matches('.compare-checkbox')) {
                    const fontName = e.target.dataset.fontName;
                    if (e.target.checked) this.state.comparisonSet.add(fontName); else this.state.comparisonSet.delete(fontName);
                    this.updateCompareLabel();
                    this.saveComparisonSet();
                }
            });
        },

        clearAll() {
            // Clear filters
            this.state.filters.search = '';
            this.state.filters.category = 'all';
            this.elements.searchInput.value = '';
            this.elements.categorySelector.querySelector('input[value="all"]').checked = true;
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
            return osData.map(os => ({
                ...os,
                fonts: os.fonts.filter(font => font.name.toLowerCase().includes(search) && (category === 'all' || font.category === category))
            })).filter(os => os.fonts.length > 0);
        },

        render() {
            const filteredData = this.applyFilters(this.state.fontData.operatingSystems);
            const view = this.elements.viewSelector.querySelector('input:checked').value;
            if (view === 'list') this.renderListView(filteredData);
            else if (view === 'table') this.renderTableView(filteredData);
            else if (view === 'compare') this.renderCompareView();
            this.runFontAvailabilityChecks();
        },

        createFontItemHTML(font, viewType) {
            const isChecked = this.state.comparisonSet.has(font.name) ? 'checked' : '';
            const webSafeIndicator = this.state.webSafeFonts.has(font.name) ? `<span class="web-safe-indicator" title="Web-safe (found on 3+ OSes)"></span>` : '';
            const checkboxHTML = `<input type="checkbox" class="compare-checkbox" data-font-name="${font.name}" ${isChecked}>`;
            const textToShow = this.state.filters.text || this.defaultPangram;

            if (viewType === 'list' || viewType === 'compare') {
                return `<div class="font-item-wrapper">${checkboxHTML}<p class="font-display-item" style="font-family: '${font.name}'" data-font-name="${font.name}"><span class="font-name">${font.name}${webSafeIndicator}</span> ${textToShow}</p></div>`;
            }
            if (viewType === 'table') {
                return `<div class="font-item-wrapper">${checkboxHTML}<span class="font-display-item" style="font-family: '${font.name}'" data-font-name="${font.name}">${font.name}${webSafeIndicator}</span></div>`;
            }
            return '';
        },

        renderListView(data) {
            this.elements.content.className = 'list-view';
            this.elements.content.innerHTML = data.map(os => `<h2>${os.name} (${os.fonts.length})</h2>${os.fonts.map(font => this.createFontItemHTML(font, 'list')).join('')}`).join('');
        },

        renderTableView(data) {
            this.elements.content.className = 'table-view';
            const maxRows = Math.max(0, ...data.map(os => os.fonts.length));
            let tableBodyHTML = '';
            for (let i = 0; i < maxRows; i++) {
                tableBodyHTML += `<tr>${data.map(os => `<td>${i < os.fonts.length ? this.createFontItemHTML(os.fonts[i], 'table') : ''}</td>`).join('')}</tr>`;
            }
            this.elements.content.innerHTML = `<table class="font-comparison-table"><thead><tr>${data.map(os => `<th>${os.name} (${os.fonts.length})</th>`).join('')}</tr></thead><tbody>${tableBodyHTML}</tbody></table>`;
        },

        renderCompareView() {
            this.elements.content.className = 'list-view';
            if (this.state.comparisonSet.size === 0) {
                this.elements.content.innerHTML = '<p>Select fonts to compare by clicking the checkbox next to their name in List or Table view.</p>'; return;
            }
            const allFonts = this.state.fontData.operatingSystems.flatMap(os => os.fonts);
            const fontsToCompare = [...new Map(allFonts.map(f => [f.name, f])).values()].filter(font => this.state.comparisonSet.has(font.name));
            this.elements.content.innerHTML = `<h2>Comparison (${fontsToCompare.length})</h2>${fontsToCompare.map(font => this.createFontItemHTML(font, 'compare')).join('')}`;
        },

        runFontAvailabilityChecks() {
            this.elements.content.querySelectorAll('[data-font-name]').forEach((elem) => {
                if (elem.dataset.fontName && !this.fontChecker.isAvailable(elem.dataset.fontName)) {
                    elem.closest('.font-item-wrapper').classList.add('font-unavailable');
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
                .map(font => font.includes(' ') ? `'${font}'` : font)
                .join(', ');
            const cssString = `font-family: ${fontList};`;
            navigator.clipboard.writeText(cssString).then(() => {
                const button = this.elements.copySelectedButton;
                const originalText = button.textContent;
                const currentWidth = button.offsetWidth;
                button.style.minWidth = `${currentWidth}px`;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.minWidth = '';
                }, 1500);
            });
        },

        applyFontSize(size) { document.documentElement.style.setProperty('--sample-font-size', `${size}px`); localStorage.setItem('fontSize', size); },
        applyTheme(theme) { const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.classList.toggle('light-theme', theme === 'light' || (theme === 'auto' && !osPrefersDark)); localStorage.setItem('theme', theme); },
        saveComparisonSet() { localStorage.setItem('comparisonSet', JSON.stringify(Array.from(this.state.comparisonSet))); },
        saveFilters() { localStorage.setItem('filters', JSON.stringify(this.state.filters)); },

        loadPreferences() {
            const savedTheme = localStorage.getItem('theme') || 'auto';
            this.elements.themeSelector.querySelector(`input[value="${savedTheme}"]`).checked = true;
            this.applyTheme(savedTheme);

            const savedFontSize = localStorage.getItem('fontSize') || '16';
            this.elements.fontSizeSelector.value = savedFontSize;
            this.applyFontSize(savedFontSize);

            this.state.comparisonSet = new Set(JSON.parse(localStorage.getItem('comparisonSet') || '[]'));
            this.updateCompareLabel();

            const savedFilters = JSON.parse(localStorage.getItem('filters') || 'null');
            if (savedFilters) {
                this.state.filters = savedFilters;
                this.elements.searchInput.value = savedFilters.search;
                this.elements.categorySelector.querySelector(`input[value="${savedFilters.category}"]`).checked = true;
            }
        },
    };

    fetch('./data/fonts.json')
        .then(response => { if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`); return response.json(); })
        .then(fontData => App.init(fontData))
        .catch(error => { console.error('Error fetching or initializing app:', error); App.elements.content.innerHTML = '<p style="color:red;">Error loading font data. Please check fonts.json and the browser console for details.</p>'; });
});