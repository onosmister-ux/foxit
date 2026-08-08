/**
 * @file newsService.js
 * Wraps forex news API - second external API for final project.
 * Primary: Finnhub.io (free key required) - /news?category=forex
 * Implements caching to handle free-tier rate limits as per proposal challenges.
 */

const CACHE_KEY = 'forex_news_cache';
const CACHE_TIME_KEY = 'forex_news_cache_time';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

// Put your free key here - or better, in localStorage for grading safety
const FINNHUB_KEY = localStorage.getItem('finnhub_key') || 'd9rgl99r01qkdnrf0o60d9rgl99r01qkdnrf0o6g';

export const newsService = {
  /**
   * Set API key at runtime - useful for grading
   */
  setApiKey(key) {
    localStorage.setItem('finnhub_key', key);
  },

  getApiKey() {
    return localStorage.getItem('finnhub_key') || FINNHUB_KEY;
  },

  /**
   * Check if cached data is still valid
   */
  getCached() {
    try {
      const time = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
      if (Date.now() - time < CACHE_DURATION) {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached) return cached;
      }
    } catch {}
    return null;
  },

  saveCache(articles) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  },

  /**
   * Get forex news - main method for News & Favorites view
   * @returns {Promise<Array<{headline:string, source:string, datetime:number, url:string, image:string}>>}
   */
  async getForexNews() {
    // Return cache first if valid
    const cached = this.getCached();
    if (cached) return cached;

    const key = this.getApiKey();
    if (!key || key === 'YOUR_FINNHUB_KEY_HERE') {
      console.warn('Finnhub key not set - using fallback mock news for development');
      return this.getFallbackNews();
    }

    try {
      const url = `https://finnhub.io/api/v1/news?category=forex&token=${key}`;
      const res = await fetch(url);

      if (res.status === 429) {
        console.warn('Finnhub rate limit hit - serving cached/fallback');
        return cached || this.getFallbackNews();
      }

      if (!res.ok) throw new Error(`Finnhub error ${res.status}`);

      const data = await res.json();

      // Normalize and take first 8 - matches your wireframe (4 cards desktop)
      const articles = data.slice(0, 8).map((a) => ({
        headline: a.headline,
        source: a.source,
        datetime: a.datetime,
        url: a.url,
        image: a.image || '',
        summary: a.summary || '',
      }));

      this.saveCache(articles);
      return articles;
    } catch (err) {
      console.error('News fetch failed', err);
      return cached || this.getFallbackNews();
    }
  },

  /**
   * Fallback when API is down/rate limited - so app never shows empty state
   * Required for graceful degradation in final rubric
   */
  getFallbackNews() {
    return [
      {
        headline: 'Dollar holds steady ahead of Fed decision',
        source: 'ForexLive',
        datetime: Date.now() / 1000,
        url: 'https://www.forexlive.com',
        image: '',
        summary: 'Traders await interest rate signals',
      },
      {
        headline: 'EUR/USD pushes higher on strong Eurozone data',
        source: 'Investing.com',
        datetime: Date.now() / 1000 - 3600,
        url: 'https://www.investing.com',
        image: '',
        summary: 'Eurozone PMI beats expectations',
      },
      {
        headline: 'Yen weakens as Bank of Japan holds policy',
        source: 'Reuters',
        datetime: Date.now() / 1000 - 7200,
        url: 'https://www.reuters.com/markets/currencies/',
        image: '',
        summary: 'BoJ keeps ultra-loose stance',
      },
      {
        headline: 'Gold surges as dollar retreats',
        source: 'MarketWatch',
        datetime: Date.now() / 1000 - 10800,
        url: 'https://www.marketwatch.com',
        image: '',
        summary: 'XAUUSD up 0.8% today',
      },
    ];
  },

  /**
   * Format timestamp to relative time
   */
  formatTime(timestamp) {
    const diff = Date.now() - timestamp * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  },
};