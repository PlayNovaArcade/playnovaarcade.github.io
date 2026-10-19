/* ==========================================================================
   PlayNova - home.js
   Everything that happens on the homepage:
     - Featured games
     - Search + category filter + sorting (all working together)
     - "Popular on this device", "Recently played" and "Favorites" sections
     - "Play a Random Game" button
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Catalog = window.PlayNovaCatalog;
  var Filter = window.PlayNovaFilter;
  var Storage = window.PlayNovaStorage;
  var Cards = window.PlayNovaCards;

  var ALL = 'All Games';
  var state = { query: '', category: ALL, sort: 'featured' };

  function $(id) {
    return document.getElementById(id);
  }

  var el = {
    featuredGrid: $('featured-grid'),
    gamesGrid: $('games-grid'),
    count: $('results-count'),
    empty: $('empty-state'),
    emptyText: $('empty-text'),
    chips: $('category-filters'),
    sort: $('sort-select'),
    search: $('site-search'),
    clear: $('clear-filters'),
    random: $('random-game'),
    popular: $('popular'),
    popularGrid: $('popular-grid'),
    recent: $('recent'),
    recentGrid: $('recent-grid'),
    favoritesGrid: $('favorites-grid'),
    favoritesEmpty: $('favorites-empty')
  };

  /* ---------- Featured (a hand-picked list, set in catalog.js) ---------- */

  function renderFeatured() {
    Cards.renderInto(el.featuredGrid, Catalog.featured(), { badge: 'Featured' });
  }

  /* ---------- All games: search + category + sort ---------- */

  function describeResults(total) {
    var text = total + (total === 1 ? ' game' : ' games');
    if (state.category !== ALL) text += ' in ' + state.category;
    if (state.query.trim()) text += ' matching “' + state.query.trim() + '”';
    return text;
  }

  function renderGames() {
    var results = Filter.apply(Catalog.games, state);
    Cards.renderInto(el.gamesGrid, results);

    el.gamesGrid.hidden = results.length === 0;
    el.empty.hidden = results.length !== 0;
    el.count.textContent = results.length === 0 ? '' : 'Showing ' + describeResults(results.length);

    if (results.length === 0) {
      var what = state.query.trim() ? '“' + state.query.trim() + '”' : 'those filters';
      var where = state.category !== ALL ? ' in ' + state.category : '';
      el.emptyText.textContent = 'Nothing matches ' + what + where + '. Check the spelling, try a shorter word like “memory” or “click”, or clear the filters to see every game.';
    }
  }

  function renderChips() {
    D.clear(el.chips);
    [ALL].concat(Catalog.categories).forEach(function (name) {
      var button = D.el('button', {
        class: 'filter-chip',
        text: name,
        attrs: { type: 'button', 'aria-pressed': name === state.category ? 'true' : 'false' },
        on: {
          click: function () {
            state.category = name;
            renderChips();
            renderGames();
          }
        }
      });
      el.chips.appendChild(D.el('li', {}, [button]));
    });
  }

  function resetFilters() {
    state.query = '';
    state.category = ALL;
    state.sort = 'featured';
    if (el.search) el.search.value = '';
    el.sort.value = 'featured';
    renderChips();
    renderGames();
  }

  /* ---------- Personal sections (stored only in this browser) ---------- */

  function gamesFromIds(ids) {
    return ids.map(function (id) { return Catalog.getById(id); }).filter(Boolean);
  }

  function renderPopular() {
    var counts = Storage.getPlayCounts();
    var ranked = Catalog.games
      .filter(function (game) { return counts[game.id]; })
      .sort(function (a, b) { return counts[b.id] - counts[a.id]; })
      .slice(0, 3);

    el.popular.hidden = ranked.length === 0;
    Cards.renderInto(el.popularGrid, ranked, function (game) {
      var n = counts[game.id];
      return { meta: 'Opened ' + n + (n === 1 ? ' time' : ' times') + ' on this device' };
    });
  }

  function renderRecent() {
    var games = gamesFromIds(Storage.getRecent());
    el.recent.hidden = games.length === 0;
    Cards.renderInto(el.recentGrid, games);
  }

  function renderFavorites() {
    var games = gamesFromIds(Storage.getFavorites());
    el.favoritesGrid.hidden = games.length === 0;
    el.favoritesEmpty.hidden = games.length !== 0;
    Cards.renderInto(el.favoritesGrid, games);
  }

  /* ---------- Wire up the controls ---------- */

  function readAddressParams() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    var category = params.get('category');
    if (q) state.query = q.slice(0, 60);
    if (category && Catalog.categories.indexOf(category) !== -1) state.category = category;
  }

  function init() {
    readAddressParams();

    if (el.search) {
      el.search.value = state.query;
      el.search.addEventListener('input', function () {
        state.query = el.search.value;
        renderGames();
      });
    }

    el.sort.addEventListener('change', function () {
      state.sort = el.sort.value;
      renderGames();
    });

    el.clear.addEventListener('click', resetFilters);

    el.random.addEventListener('click', function () {
      var pick = Catalog.games[Math.floor(Math.random() * Catalog.games.length)];
      window.location.href = pick.url;
    });

    // When a heart is clicked anywhere, refresh the Favorites section.
    document.addEventListener('playnova:favorites-changed', renderFavorites);

    renderFeatured();
    renderChips();
    renderGames();
    renderPopular();
    renderRecent();
    renderFavorites();
  }

  init();
})();
