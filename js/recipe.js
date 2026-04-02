const RECIPE_PATH = './data/recipes-v2.json';
const FAV_KEY = 'grannys_recipe_book_favourites';

const params = new URLSearchParams(window.location.search);
const recipeId = params.get('id');

const els = {
  year: document.getElementById('year'),
  container: document.getElementById('recipe-root'),
  printButton: document.getElementById('print-button')
};

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

function isFavourite(id) {
  return getFavourites().includes(id);
}

function toggleFavourite(id) {
  const favourites = getFavourites();
  const updated = favourites.includes(id)
    ? favourites.filter(item => item !== id)
    : [...favourites, id];

  saveFavourites(updated);
}

function metaMarkup(recipe) {
  const meta = [];
  if (recipe.category) meta.push(recipe.category);
  if (recipe.serves) meta.push(`Serves ${recipe.serves}`);
  if (recipe.prepTime) meta.push(`Prep ${recipe.prepTime}`);
  if (recipe.cookTime) meta.push(`Cook ${recipe.cookTime}`);

  if (!meta.length) return '';
  return `
    <div class="meta-row">
      ${meta.map(item => `<span class="meta-pill">${escapeHtml(item)}</span>`).join('')}
    </div>
  `;
}

function listMarkup(items, className) {
  if (!items || !items.length) {
    return '<p class="source-note">Not provided in the original recipe note.</p>';
  }
  return `<ol class="${className}">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`;
}

function unorderedMarkup(items, className) {
  if (!items || !items.length) {
    return '<p class="source-note">Not provided in the original recipe note.</p>';
  }
  return `<ul class="${className}">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function bindRecipeButtons(recipe) {
  const printButton = document.getElementById('inner-print-button');
  printButton?.addEventListener('click', () => window.print());

  const favouriteButton = document.getElementById('recipe-fav-button');
  favouriteButton?.addEventListener('click', () => {
    toggleFavourite(recipe.id);
    const favourite = isFavourite(recipe.id);
    favouriteButton.textContent = favourite ? '★ Favourite' : '☆ Favourite';
    favouriteButton.classList.toggle('is-favourite', favourite);
    favouriteButton.setAttribute('aria-pressed', String(favourite));
    favouriteButton.setAttribute(
      'aria-label',
      favourite ? 'Remove from favourites' : 'Add to favourites'
    );
  });
}

function renderRecipe(recipe) {
  document.title = `${recipe.title} · Granny’s Recipe Book`;

  const favourite = isFavourite(recipe.id);

  els.container.innerHTML = `
    <section class="recipe-card-shell">
      <div class="breadcrumb-row">
        <a class="back-link" href="./index.html">← Back to all recipes</a>
        <div class="recipe-actions">
          <button class="action-button fav-action ${favourite ? 'is-favourite' : ''}" id="recipe-fav-button" type="button" aria-pressed="${favourite}" aria-label="${favourite ? 'Remove from favourites' : 'Add to favourites'}">
            ${favourite ? '★ Favourite' : '☆ Favourite'}
          </button>
          <button class="action-button" id="inner-print-button" type="button">Print recipe</button>
        </div>
      </div>

      <header class="recipe-heading">
        <h1 class="recipe-page-title">${escapeHtml(recipe.title)}</h1>
        ${metaMarkup(recipe)}
        <p class="recipe-page-description">${escapeHtml(recipe.description || 'Family recipe')}</p>
        ${recipe.source ? `<div class="source-note">Source note: ${escapeHtml(recipe.source)}</div>` : ''}
      </header>

      <div class="recipe-layout">
        <section class="recipe-panel">
          <h2 class="panel-title">Ingredients</h2>
          ${unorderedMarkup(recipe.ingredients, 'list-clean')}
        </section>

        <section class="recipe-panel">
          <h2 class="panel-title">Method</h2>
          ${listMarkup(recipe.method, 'steps-list')}
        </section>

        ${recipe.notes && recipe.notes.length ? `
          <section class="recipe-panel full-width">
            <h2 class="panel-title">Notes</h2>
            ${unorderedMarkup(recipe.notes, 'notes-list')}
          </section>
        ` : ''}
      </div>
    </section>
  `;

  bindRecipeButtons(recipe);
}

function renderError(message) {
  document.title = 'Recipe not found · Granny’s Recipe Book';
  els.container.innerHTML = `
    <div class="error-box">
      <strong>${escapeHtml(message)}</strong><br>
      Return to the home page and choose another recipe.
    </div>
  `;
}

async function loadRecipe() {
  if (!recipeId) {
    renderError('No recipe was selected.');
    return;
  }

  try {
    const response = await fetch(RECIPE_PATH);
    if (!response.ok) {
      throw new Error('Could not load recipes.');
    }

    const recipes = await response.json();
    const recipe = recipes.find(item => item.id === recipeId);

    if (!recipe) {
      renderError('The selected recipe could not be found.');
      return;
    }

    renderRecipe(recipe);
  } catch (error) {
    renderError('Sorry — the recipe could not be loaded.');
  }
}

if (els.printButton) {
  els.printButton.addEventListener('click', () => window.print());
}

els.year.textContent = new Date().getFullYear();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => { });
}

loadRecipe();