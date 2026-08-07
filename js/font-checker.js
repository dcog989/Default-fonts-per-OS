import { fontconfigAliases } from './constants.js';

const GENERICS = ['serif', 'sans-serif', 'monospace'];

export const fontChecker = {
  cache: {},
  testString: 'mw_il',
  testSize: '72px',
  ctx: null,

  init() {
    if (this.ctx) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    this.ctx = canvas.getContext('2d');
  },

  measureWidth(font) {
    this.init();
    this.ctx.font = `${this.testSize} ${font}`;
    return this.ctx.measureText(this.testString).width;
  },

  isAvailable(font) {
    return this.areAvailable([font]).get(font.toLowerCase());
  },

  areAvailable(fonts) {
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

    for (const font of pending) {
      let differs = 0;
      for (const generic of GENERICS) {
        if (this.measureWidth(`"${font}", ${generic}`) !== this.measureWidth(generic)) {
          differs++;
        }
      }
      let available = differs >= 2;
      const aliases = fontconfigAliases[font];
      if (available && aliases) {
        const wTarget = this.measureWidth(`"${font}", serif`);
        if (aliases.some((alias) => this.measureWidth(`"${alias}", serif`) === wTarget)) {
          available = false;
        }
      }
      const key = font.toLowerCase();
      this.cache[key] = available;
      result.set(key, available);
    }
    return result;
  },
};
