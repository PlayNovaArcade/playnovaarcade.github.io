/* ==========================================================================
   PlayNova - filter.js
   Search, category filter and sorting for the game list.
   One function, so the three controls always work together:
       PlayNovaFilter.apply(games, { query: 'memory', category: 'Puzzle', sort: 'az' })
   ========================================================================== */
(function () {
  'use strict';

  /** Lower-case, trim and strip accents so "Réaction" matches "reaction". */
  function normalize(text) {
    var value = String(text === undefined || text === null ? '' : text).toLowerCase().trim();
    if (value.normalize) value = value.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return value;
  }

  function matchesQuery(game, words) {
    if (!words.length) return true;
    var haystack = normalize(game.title + ' ' + game.description + ' ' + game.categories.join(' '));
    // Every word typed must appear somewhere ("memory pairs" finds Memory Match).
    return words.every(function (word) { return haystack.indexOf(word) !== -1; });
  }

  function apply(games, options) {
    options = options || {};
    var words = normalize(options.query).split(/\s+/).filter(Boolean);
    var category = options.category && options.category !== 'All Games' ? options.category : null;

    var result = games.filter(function (game) {
      var inCategory = !category || game.categories.indexOf(category) !== -1;
      return inCategory && matchesQuery(game, words);
    });

    if (options.sort === 'az') {
      result.sort(function (a, b) { return a.title.localeCompare(b.title); });
    } else if (options.sort === 'za') {
      result.sort(function (a, b) { return b.title.localeCompare(a.title); });
    }
    return result;
  }

  window.PlayNovaFilter = { apply: apply, normalize: normalize };
})();
