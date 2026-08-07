const KEY_PREFIX = 'dfpo:';

export const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`${KEY_PREFIX}${key}`);
      return v !== null ? v : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`${KEY_PREFIX}${key}`, value);
    } catch {
      /* localStorage unavailable */
    }
  },
  getJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`${KEY_PREFIX}${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  },
};
