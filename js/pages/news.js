import { newsService } from '../services/newsService.js';

const container = document.getElementById('newsContainer');
const refreshBtn = document.getElementById('refreshNews');

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function renderNews() {
  if (!container) return;

  container.innerHTML = '<div class="news-status">Loading forex news…</div>';

  try {
    const articles = await newsService.getForexNews();

    if (!articles || !articles.length) {
      container.innerHTML = '<div class="news-status">No news available right now.</div>';
      return;
    }

    container.innerHTML = articles
      .map(
        (a) => `
      <a class="news-item" href="${a.url}" target="_blank" rel="noopener noreferrer">
        <div class="news-item-top">
          <span class="news-source">${escapeHtml(a.source)}</span>
          <span class="news-time">${newsService.formatTime(a.datetime)}</span>
        </div>
        <p class="news-headline">${escapeHtml(a.headline)}</p>
      </a>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to render news', err);
    container.innerHTML = '<div class="news-status">Unable to load news right now.</div>';
  }
}

renderNews();

refreshBtn?.addEventListener('click', renderNews);
