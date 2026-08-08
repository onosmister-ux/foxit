/**
 * @file exchangeRateService.js
 * Wraps all calls to Frankfurter API - live and historical FX rates.
 * Source: api.frankfurter.dev (ECB data) - free, no key.
 * Docs: https://api.frankfurter.dev/docs
 */

const BASE_URL = 'https://api.frankfurter.dev/v1';

/**
 * Handle API response with error checking
 * @param {Response} res
 */
async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Frankfurter API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const exchangeRateService = {
  /**
   * Get latest rates for a base currency
   * @param {string} base - e.g., 'USD'
   * @param {string[]} symbols - e.g., ['EUR','GBP','JPY']
   * @returns {Promise<{base:string, date:string, rates:Object}>}
   */
  async getLatestRates(base = 'USD', symbols = []) {
    const params = new URLSearchParams({ from: base });
    if (symbols.length) params.set('to', symbols.join(','));
    const url = `${BASE_URL}/latest?${params.toString()}`;
    const data = await handleResponse(await fetch(url));
    // Normalize to { base, date, rates }
    return {
      base: data.base,
      date: data.date,
      rates: data.rates,
    };
  },

  /**
   * Get single pair rate - for your ticker cards
   * @param {string} from - e.g., 'USD'
   * @param {string} to - e.g., 'EUR'
   */
  async getRatePair(from, to) {
    if (from === to) return { rate: 1, date: new Date().toISOString().split('T')[0] };
    const data = await this.getLatestRates(from, [to]);
    return {
      rate: data.rates[to],
      date: data.date,
      base: from,
      target: to,
    };
  },

  /**
   * Get historical time-series for chart - for Trends view
   * Frankfurter supports /v1/2024-01-01..2024-01-31?from=USD&to=EUR
   * @param {string} from
   * @param {string} to
   * @param {number} days - 7,30,90,365
   */
  async getHistoricalRates(from, to, days = 30) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const format = (d) => d.toISOString().split('T')[0];
    const url = `${BASE_URL}/${format(start)}..${format(end)}?from=${from}&to=${to}`;

    const data = await handleResponse(await fetch(url));

    // API returns { rates: { '2024-01-01': { EUR: 0.92 },... } }
    // Convert to array for chart: [{ date, rate },...]
    const points = Object.entries(data.rates)
     .map(([date, rates]) => ({
        date,
        rate: rates[to],
      }))
     .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      base: from,
      target: to,
      start: format(start),
      end: format(end),
      points,
    };
  },

  /**
   * Convert amount
   * @param {number} amount
   * @param {string} from
   * @param {string} to
   */
  async convert(amount, from, to) {
    if (from === to) return { amount, rate: 1, converted: amount };
    const { rate } = await this.getRatePair(from, to);
    return {
      amount: Number(amount),
      rate,
      converted: Number(amount) * rate,
      from,
      to,
    };
  },

  /**
   * Get supported currencies list
   */
  async getSupportedCurrencies() {
    const url = `${BASE_URL}/currencies`;
    return handleResponse(await fetch(url));
  },
};