import { FavoritesManager } from '../components/favoritesManager.js';
import { storage } from '../utils/storage.js';

const favManager = new FavoritesManager({
  containerId: 'favoritesContainer',
  onUpdate: (favs) => console.log('favorites updated', favs)
});

favManager.render();

// Add pair from dropdown
document.getElementById('addFavBtn')?.addEventListener('click', () => {
  const sel = document.getElementById('addFavSelect');
  if (sel?.value) favManager.add(sel.value);
});

document.getElementById('clearFavs')?.addEventListener('click', () => {
  if (confirm('Clear all favorites?')) {
    storage.saveFavorites([]);
    favManager.favorites = [];
    favManager.render();
  }
});