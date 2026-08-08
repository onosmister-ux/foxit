/**
 * @file storage.js
 * Small localStorage wrapper for persisting user preferences.
 * Handles favorites, alert thresholds, last-viewed pair, chart range, and theme.
 * All data lives in browser only - no server DB as per proposal.
 */

const KEYS = {
  FAVORITES: 'forex_favorites',
  ALERTS: 'forex_alerts',
  LAST_PAIR: 'forex_last_pair',
  CHART_RANGE: 'forex_chart_range',
  THEME: 'forex_theme',
};

/**
 * Safe JSON parse with fallback
 * @param {string} key - localStorage key
 * @param {*} fallback - fallback value if parse fails
 * @returns {*}
 */
function getParsed(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export const storage = {
  // ---- Favorites ----
  getFavorites() {
    return getParsed(KEYS.FAVORITES, []);
  },

  saveFavorites(favorites) {
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
  },

  addFavorite(pair) {
    const favs = this.getFavorites();
    if (!favs.includes(pair)) {
      favs.push(pair);
      this.saveFavorites(favs);
    }
    return favs;
  },

  removeFavorite(pair) {
    const favs = this.getFavorites().filter((p) => p!== pair);
    this.saveFavorites(favs);
    return favs;
  },

  isFavorite(pair) {
    return this.getFavorites().includes(pair);
  },

  // ---- Rate Alerts ----
  getAlerts() {
    return getParsed(KEYS.ALERTS, {});
  },

  getAlert(pair) {
    return this.getAlerts()[pair] || null;
  },

  setAlert(pair, threshold) {
    const alerts = this.getAlerts();
    alerts[pair] = Number(threshold);
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
    return alerts;
  },

  removeAlert(pair) {
    const alerts = this.getAlerts();
    delete alerts[pair];
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
    return alerts;
  },

  // ---- Last Viewed Pair ----
  getLastPair() {
    return localStorage.getItem(KEYS.LAST_PAIR) || 'USD/EUR';
  },

  setLastPair(pair) {
    localStorage.setItem(KEYS.LAST_PAIR, pair);
  },

  // ---- Chart Range ----
  getChartRange() {
    return localStorage.getItem(KEYS.CHART_RANGE) || '7D';
  },

  setChartRange(range) {
    localStorage.setItem(KEYS.CHART_RANGE, range);
  },

  // ---- Theme ----
  getTheme() {
    return localStorage.getItem(KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme() {
    const newTheme = this.getTheme() === 'light'? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  },

  // Initialize theme on load
  initTheme() {
    const theme = this.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    return theme;
  },
};