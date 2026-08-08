/**
 * @file chart.js
 * Historical trend chart component.
 * Uses exchangeRateService.getHistoricalRates() for real data
 * and renders with vanilla SVG - no external JS library needed.
 * Matches your wireframe: Historical Trends — Desktop / Mobile
 */

import { exchangeRateService } from '../services/exchangeRateService.js';
import { storage } from '../utils/storage.js';

export class TrendChart {
  /**
   * @param {Object} options
   * @param {string} options.svgId - id of <svg> element
   * @param {string} options.labelsId - id of x-labels container
   * @param {string} options.tooltipId - id of tooltip div
   */
  constructor({ svgId, labelsId, tooltipId }) {
    this.svg = document.getElementById(svgId);
    this.labelsEl = document.getElementById(labelsId);
    this.tooltip = document.getElementById(tooltipId);
    this.currentPair = storage.getLastPair() || 'USD/EUR';
    this.currentRange = storage.getChartRange() || '7D';
    this.dataPoints = [];
  }

  /**
   * Parse pair string "USD/EUR" to from/to
   */
  parsePair(pair) {
    const [from, to] = pair.split('/');
    return { from: from.trim(), to: to.trim() };
  }

  /**
   * Map range label to days
   */
  rangeToDays(range) {
    const map = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 };
    return map[range] || 30;
  }

  /**
   * Fetch and render
   * @param {string} pair - e.g., 'USD/EUR'
   * @param {string} range - e.g., '7D'
   */
  async load(pair = this.currentPair, range = this.currentRange) {
    this.currentPair = pair;
    this.currentRange = range;
    storage.setLastPair(pair);
    storage.setChartRange(range);

    const { from, to } = this.parsePair(pair);
    const days = this.rangeToDays(range);

    // Loading state
    if (this.svg) this.svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" font-size="12" fill="#8A9BAE">Loading chart...</text>';

    try {
      const history = await exchangeRateService.getHistoricalRates(from, to, days);
      this.dataPoints = history.points;
      this.render();
    } catch (err) {
      console.error(err);
      if (this.svg) this.svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" font-size="12" fill="#D92D20">Failed to load rates: ${err.message}</text>`;
    }
  }

  /**
   * Render SVG path from this.dataPoints
   */
  render() {
    if (!this.svg ||!this.dataPoints.length) return;

    const W = 700;
    const H = 200;
    const PAD = 30;
    const rates = this.dataPoints.map((p) => p.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const range = max - min || 1;

    const getX = (i) => PAD + (i / (this.dataPoints.length - 1)) * (W - PAD * 2);
    const getY = (v) => H - PAD - ((v - min) / range) * (H - PAD * 2);

    const path = this.dataPoints
    .map((d, i) => `${i === 0? 'M' : 'L'} ${getX(i)} ${getY(d.rate)}`)
    .join(' ');

    const area = `${path} L ${getX(this.dataPoints.length - 1)} ${H - PAD} L ${getX(0)} ${H - PAD} Z`;

    this.svg.innerHTML = `
      <path d="${area}" fill="#E6F4FF" opacity="0.6"/>
      <path d="${path}" fill="none" stroke="#2D9CDB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    // Add hover points
    this.dataPoints.forEach((d, i) => {
      const cx = getX(i);
      const cy = getY(d.rate);

      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hit.setAttribute('x', cx - 15);
      hit.setAttribute('y', '0');
      hit.setAttribute('width', '30');
      hit.setAttribute('height', String(H));
      hit.setAttribute('fill', 'transparent');
      hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => this.showTooltip(i, cx, cy));
      hit.addEventListener('mouseleave', () => this.tooltip?.classList.remove('show'));
      this.svg.appendChild(hit);

      if (i === this.dataPoints.length - 1) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', String(cx));
        dot.setAttribute('cy', String(cy));
        dot.setAttribute('r', '5');
        dot.setAttribute('fill', '#0A2540');
        dot.setAttribute('stroke', '#fff');
        dot.setAttribute('stroke-width', '2');
        this.svg.appendChild(dot);
      }
    });

    // X labels - show max 6 labels to avoid crowding
    if (this.labelsEl) {
      const step = Math.ceil(this.dataPoints.length / 6);
      const labels = this.dataPoints.filter((_, i) => i % step === 0 || i === this.dataPoints.length - 1);
      this.labelsEl.innerHTML = labels.map((p) => `<span>${p.date.slice(5)}</span>`).join('');
    }
  }

  showTooltip(index, cx, cy) {
    if (!this.tooltip) return;
    const point = this.dataPoints[index];
    this.tooltip.innerHTML = `<b>${point.date}</b><br/>Rate: ${point.rate.toFixed(4)}`;
    this.tooltip.style.left = `${(cx / 700) * 100}%`;
    this.tooltip.style.top = `${cy}px`;
    this.tooltip.classList.add('show');
  }
}