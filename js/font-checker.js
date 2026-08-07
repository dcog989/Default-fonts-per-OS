import { fontconfigAliases } from './constants.js';

export const fontChecker = {
  cache: {},
  testString: 'mw_il',
  testSize: '72px',
  testContainer: null,

  init() {
    if (this.testContainer) return;
    this.testContainer = document.createElement('div');
    this.testContainer.style.cssText = 'position:absolute;top:-9999px;left:-9999px;';
    document.body.appendChild(this.testContainer);
  },

  measureWidths(fonts) {
    this.init();
    const els = fonts.map((font) => {
      const el = document.createElement('span');
      el.textContent = this.testString;
      el.style.fontSize = this.testSize;
      el.style.fontFamily = font;
      this.testContainer.appendChild(el);
      return el;
    });
    const widths = els.map((el) => el.offsetWidth);
    for (const el of els) {
      this.testContainer.removeChild(el);
    }
    return widths;
  },

  isAvailable(font) {
    const fontLower = font.toLowerCase();
    if (this.cache[fontLower] !== undefined) return this.cache[fontLower];

    this.init();

    const generics = ['serif', 'sans-serif', 'monospace'];
    const pairs = generics.map((generic) => {
      const testEl = document.createElement('span');
      const baseEl = document.createElement('span');
      testEl.textContent = baseEl.textContent = this.testString;
      testEl.style.fontSize = baseEl.style.fontSize = this.testSize;
      testEl.style.fontFamily = `"${font}", ${generic}`;
      baseEl.style.fontFamily = generic;

      this.testContainer.appendChild(testEl);
      this.testContainer.appendChild(baseEl);
      return { testEl, baseEl };
    });

    let differs = 0;
    for (const { testEl, baseEl } of pairs) {
      if (testEl.offsetWidth !== baseEl.offsetWidth || testEl.offsetHeight !== baseEl.offsetHeight) {
        differs++;
      }
    }

    for (const { testEl, baseEl } of pairs) {
      this.testContainer.removeChild(testEl);
      this.testContainer.removeChild(baseEl);
    }

    let isAvailable = differs >= 2;
    if (isAvailable) {
      const candidates = fontconfigAliases[font];
      if (candidates) {
        const widths = this.measureWidths([`"${font}", serif`, ...candidates.map((alias) => `"${alias}", serif`)]);
        const wTarget = widths[0];
        if (widths.slice(1).some((w) => w === wTarget)) {
          isAvailable = false;
        }
      }
    }

    this.cache[fontLower] = isAvailable;
    return isAvailable;
  },
};
