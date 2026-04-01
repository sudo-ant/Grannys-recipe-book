const RECIPE_PATH = './data/recipes.json';
const FAV_KEY = 'grannys_recipe_book_favourites';

const state = {
  recipes: [],
  query: '',
  category: 'All',
  favouritesOnly: false
};

const els = {
  search: document.getElementById('search'),
  filters: document.getElementById('filters'),
  favouritesFilter: document.getElementById('favourites-filter'),
  resultsCount: document.getElementById('results-count'),
  clearButton: document.getElementById('clear-filters'),
  cards: document.getElementById('recipe-cards'),
  year: document.getElementById('year')
};

function normalise(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getFavourites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavourites(favourites) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favourites));
}

function isFavourite(recipeId) {
  return getFavourites().includes(recipeId);
}

function toggleFavourite(recipeId) {
  const favourites = getFavourites();
  const updated = favourites.includes(recipeId)
    ? favourites.filter(id => id !== recipeId)
    : [...favourites, recipeId];

  saveFavourites(updated);
}

function getCategories(recipes) {
  return ['All', ...new Set(recipes.map(recipe => recipe.category).filter(Boolean))];
}

function matchesRecipe(recipe, query, category, favouritesOnly) {
  const inCategory = category === 'All' || recipe.category === category;
  if (!inCategory) return false;

  if (favouritesOnly && !isFavourite(recipe.id)) {
    return false;
  }

  if (!query) return true;

  const haystack = [
    recipe.title,
    recipe.category,
    recipe.description,
    recipe.serves,
    recipe.prepTime,
    recipe.cookTime,
    ...(recipe.ingredients || []),
    ...(recipe.method || []),
    ...(recipe.notes || []),
    recipe.source
  ].join(' ');

  return normalise(haystack).includes(normalise(query));
}

function getMeta(recipe) {
  const bits = [];
  if (recipe.serves) bits.push(`Serves ${recipe.serves}`);
  if (recipe.prepTime) bits.push(`Prep ${recipe.prepTime}`);
  if (recipe.cookTime) bits.push(`Cook ${recipe.cookTime}`);
  if (recipe.source) bits.push(recipe.source);
  return bits;
}

function cardTemplate(recipe) {
  const meta = getMeta(recipe)
    .map(item => `<span class="meta-pill">${escapeHtml(item)}</span>`)
    .join('');

  const favourite = isFavourite(recipe.id);

  return `
    <a class="recipe-card" href="./recipe.html?id=${encodeURIComponent(recipe.id)}" aria-label="Open recipe for ${escapeHtml(recipe.title)}">
      <div class="recipe-card-top">
        <span class="recipe-category">${escapeHtml(recipe.category || 'Recipe')}</span>
        <button class="fav-btn ${favourite ? 'is-favourite' : ''}" type="button" data-fav-id="${escapeHtml(recipe.id)}" aria-label="${favourite ? 'Remove from favourites' : 'Add to favourites'}" aria-pressed="${favourite}">
          ${favourite ? '★' : '☆'}
        </button>
      </div>
      <h2 class="recipe-title">${escapeHtml(recipe.title)}</h2>
      <p class="recipe-description">${escapeHtml(recipe.description || 'Family recipe')}</p>
      ${meta ? `<div class="meta-row">${meta}</div>` : ''}
      <div class="recipe-footer">Tap to open recipe</div>
    </a>
  `;
}

function renderFilters(categories) {
  els.filters.innerHTML = categories.map(category => `
    <button class="filter-chip ${state.category === category ? 'active' : ''}" type="button" data-category="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join('');

  [...els.filters.querySelectorAll('[data-category]')].forEach(button => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      render();
    });
  });
}

function bindFavouriteButtons() {
  [...document.querySelectorAll('.fav-btn[data-fav-id]')].forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const recipeId = button.dataset.favId;
      toggleFavourite(recipeId);
      render();
    });
  });
}

function render() {
  const categories = getCategories(state.recipes);
  renderFilters(categories);

  const filtered = state.recipes.filter(recipe =>
    matchesRecipe(recipe, state.query, state.category, state.favouritesOnly)
  );

  els.resultsCount.textContent = `${filtered.length} recipe${filtered.length === 1 ? '' : 's'}`;
  els.clearButton.hidden = !state.query && state.category === 'All' && !state.favouritesOnly;

  els.favouritesFilter.classList.toggle('active', state.favouritesOnly);
  els.favouritesFilter.setAttribute('aria-pressed', String(state.favouritesOnly));

  if (!filtered.length) {
    els.cards.innerHTML = `
      <div class="empty-state">
        <h2>No recipes found</h2>
        <p>Try a different search or choose another section.</p>
      </div>
    `;
    return;
  }

  els.cards.innerHTML = filtered.map(cardTemplate).join('');
  bindFavouriteButtons();
}

async function loadRecipes() {
  try {
    const response = await fetch(RECIPE_PATH);
    if (!response.ok) {
      throw new Error('Could not load recipes.');
    }
    state.recipes = await response.json();
    render();
  } catch (error) {
    els.cards.innerHTML = `
      <div class="error-box">
        <strong>Sorry — the recipes could not be loaded.</strong><br>
        Please check that all project files were uploaded correctly.
      </div>
    `;
  }
}

function registerEvents() {
  els.search.addEventListener('input', event => {
    state.query = event.target.value.trim();
    render();
  });

  els.clearButton.addEventListener('click', () => {
    state.query = '';
    state.category = 'All';
    state.favouritesOnly = false;
    els.search.value = '';
    render();
  });

  els.favouritesFilter.addEventListener('click', () => {
    state.favouritesOnly = !state.favouritesOnly;
    render();
  });

  els.year.textContent = new Date().getFullYear();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
  }
}

registerEvents();
loadRecipes();
registerServiceWorker();