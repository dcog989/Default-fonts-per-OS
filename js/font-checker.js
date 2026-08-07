import { fontconfigAliases } from './constants.js';

const GENERICS = ['serif', 'sans-serif', 'monospace'];

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
    const els = [];
    for (const font of fonts) {
      const el = document.createElement('span');
      el.textContent = this.testString;
      el.style.fontSize = this.testSize;
      el.style.fontFamily = font;
      this.testContainer.appendChild(el);
      els.push(el);
    }
    const widths = els.map((el) => el.offsetWidth);
    for (const el of els) {
      this.testContainer.removeChild(el);
    }
    return widths;
  },

  isAvailable(font) {
    return this.areAvailable([font]).get(font.toLowerCase());
  },

  areAvailable(fonts) {
    this.init();
    const result = new Map();
    const pending = [];
    for (const font of new Set(fonts)) {
      const key = font.toLowerCase();
      if (this.cache[key] !== undefined) {
        result.set(key, this.cache[key]);
      } else {
        pending.push(font);
      }
    }
    if (pending.length === 0) return result;

    const rows = [];
    for (const font of pending) {
      const pairEls = GENERICS.map((generic) => {
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
      rows.push({ font, pairEls });
    }

    const available = new Map();
    for (const { font, pairEls } of rows) {
      let differs = 0;
      for (const { testEl, baseEl } of pairEls) {
        if (testEl.offsetWidth !== baseEl.offsetWidth || testEl.offsetHeight !== baseEl.offsetHeight) {
          differs++;
        }
      }
      available.set(font, differs >= 2);
    }

    for (const { pairEls } of rows) {
      for (const { testEl, baseEl } of pairEls) {
        this.testContainer.removeChild(testEl);
        this.testContainer.removeChild(baseEl);
      }
    }

    const aliasFonts = pending.filter((font) => available.get(font) && fontconfigAliases[font]);
    if (aliasFonts.length > 0) {
      const queryList = [];
      const bounds = new Map();
      for (const font of aliasFonts) {
        const queries = [`"${font}", serif`, ...fontconfigAliases[font].map((alias) => `"${alias}", serif`)];
        bounds.set(font, [queryList.length, queries.length]);
        queryList.push(...queries);
      }
      const widths = this.measureWidths(queryList);
      for (const font of aliasFonts) {
        const [start, count] = bounds.get(font);
        const wTarget = widths[start];
        if (widths.slice(start + 1, start + count).some((w) => w === wTarget)) {
          available.set(font, false);
        }
      }
    }

    for (const font of pending) {
      const key = font.toLowerCase();
      this.cache[key] = available.get(font);
      result.set(key, available.get(font));
    }
    return result;
  },
};
