/**
 * @file favoritesManager.js
 * Manages favorite currency pairs - add/remove/reorder + alerts
 * Persists via storage.js (localStorage) as per proposal
 */

import { storage } from '../utils/storage.js';
import { exchangeRateService } from '../services/exchangeRateService.js';

export class FavoritesManager {
  /**
   * @param {Object} options
   * @param {string} options.containerId - id of favorites list container
   * @param {Function} options.onUpdate - callback when favorites change
   */
  constructor({ containerId, onUpdate }) {
    this.container = document.getElementById(containerId);
    this.onUpdate = onUpdate || (() => {});
    this.favorites = storage.getFavorites();
  }

  /**
   * Add new pair - e.g., "USD/EUR"
   */
  add(pair) {
    if (!pair || this.favorites.includes(pair)) return this.favorites;
    this.favorites = storage.addFavorite(pair);
    this.render();
    this.onUpdate(this.favorites);
    return this.favorites;
  }

  remove(pair) {
    this.favorites = storage.removeFavorite(pair);
    this.render();
    this.onUpdate(this.favorites);
    return this.favorites;
  }

  /**
   * Render favorites list - matches your News & Favorites wireframe
   * Desktop: right panel "Favorites Manager" with PAIR + [pin][x]
   */
  async render() {
    if (!this.container) return;

    if (this.favorites.length === 0) {
      this.container.innerHTML = `
        <div style="padding:20px; text-align:center; color:#8A9BAE; font-size:12.5px;">
          No favorites yet.<br/>Pin pairs from dashboard.
        </div>`;
      return;
    }

    // Fetch live rates for each favorite to show current rate + alert check
    const alerts = storage.getAlerts();

    const cards = await Promise.all(
      this.favorites.map(async (pair) => {
        const { from, to } = this.parsePair(pair);
        try {
          const { rate } = await exchangeRateService.getRatePair(from, to);
          const alertThreshold = alerts[pair];
          const isAlertTriggered = alertThreshold && this.checkAlert(rate, alertThreshold);

          return `
            <div class="fav-card ${isAlertTriggered? 'alert-triggered' : ''}" data-pair="${pair}">
              <div class="fav-info">
                <b>${pair}</b>
                <span class="fav-rate">${rate.toFixed(4)}</span>
                ${alertThreshold? `<small class="fav-alert">Alert: ${alertThreshold}</small>` : ''}
              </div>
              <div class="fav-actions">
                <button class="icon-btn fav-pin" title="Remove" data-remove="${pair}">✕</button>
              </div>
            </div>
          `;
        } catch {
          return `
            <div class="fav-card" data-pair="${pair}">
              <div class="fav-info"><b>${pair}</b><span>—</span></div>
              <button class="icon-btn" data-remove="${pair}">✕</button>
            </div>
          `;
        }
      })
    );

    this.container.innerHTML = cards.join('');

    // Bind remove buttons
    this.container.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => this.remove(btn.dataset.remove));
    });
  }

  parsePair(pair) {
    const [from, to] = pair.split('/');
    return { from: from.trim(), to: to.trim() };
  }

  /**
   * Check if current rate crossed threshold - for Rate Alerts feature
   */
  checkAlert(currentRate, threshold) {
    // Simple: alert if rate >= threshold (can expand to above/below)
    return currentRate >= threshold;
  }

  /**
   * Set alert threshold for a pair
   */
  setAlert(pair, threshold) {
    storage.setAlert(pair, threshold);
    this.render();
  }

  /**
   * Helper to render add-button state on dashboard cards
   */
  updatePinButtons() {
    document.querySelectorAll('[data-pair]').forEach((btn) => {
      const pair = btn.dataset.pair;
      const isFav = storage.isFavorite(pair);
      btn.textContent = isFav? '★ Pinned' : '☆ Pin';
      btn.classList.toggle('pinned', isFav);
    });
  }
}