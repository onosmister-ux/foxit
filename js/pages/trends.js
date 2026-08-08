import { TrendChart } from '../components/chart.js';

const chart = new TrendChart({
  svgId: 'equitySvg',
  labelsId: 'xLabels',
  tooltipId: 'tooltip'
});

// Initial load
chart.load('USD/EUR', '7D');

// Handle your range dropdown
const rangeSel = document.getElementById('rangeSel');
if (rangeSel) {
  rangeSel.addEventListener('change', (e) => {
    // Convert Monthly/Weekly to 30D/7D if needed
    const val = e.target.value.includes('Monthly')? '30D' : '7D';
    chart.load(chart.currentPair, val);
  });
}

// 4 buttons: 7D | 30D | 90D | 1Y
// If you add them with class.range-btn and data-range attribute:
document.querySelectorAll('[data-range]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chart.load(chart.currentPair, btn.dataset.range);
  });
});