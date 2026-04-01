# Granny’s Recipe Book

A simple installable family recipe web app built as a static site for GitHub Pages.

## Project structure

- `index.html` — home page with search, section filters, and recipe cards
- `recipe.html` — individual recipe page
- `css/style.css` — styles
- `js/app.js` — home page logic
- `js/recipe.js` — recipe page logic
- `data/recipes.json` — recipe data
- `manifest.json` — installable app settings
- `sw.js` — service worker for basic offline support
- `icons/` — app icons

## Local preview

Open `index.html` in a browser, or use a simple local server if you prefer.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder to the repository root.
3. In GitHub, go to **Settings** → **Pages**.
4. Under **Build and deployment**, choose:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Save the settings.
6. Wait for GitHub Pages to publish the site.

## Editing recipes

Open `data/recipes.json` and add or edit recipe entries.
Optional fields can be left as `null` or omitted.
