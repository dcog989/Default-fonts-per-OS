import { fontconfigAliases } from './constants.js';

export const fontChecker = {
	cache: {},
	testString: "mw_il",
	testSize: "72px",
	testContainer: null,

	init() {
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

	isAvailable(font) {
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

			if (
				testEl.offsetWidth !== baseEl.offsetWidth ||
				testEl.offsetHeight !== baseEl.offsetHeight
			) {
				differs++;
			}

			this.testContainer.removeChild(testEl);
			this.testContainer.removeChild(baseEl);
		}

		let isAvailable = differs >= 2;

		if (isAvailable) {
			const candidates = fontconfigAliases[font];
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
};
