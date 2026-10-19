/* ==========================================================================
   PlayNova - game-page.js
   The shared part of every game page. It:
     - remembers that the game was opened (recently played / popular on this device)
     - adds the favorite heart and the "More games to try" row
     - starts the game and cleans it up when you leave the page
     - shows a friendly message if a game ever fails to start

   Each game file (js/games/*.js) calls PlayNovaGamePage.start(mount),
   where mount(root) builds the game inside <div id="game-root"> and
   returns { destroy() } so timers and listeners can be removed.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Catalog = window.PlayNovaCatalog;
  var Storage = window.PlayNovaStorage;
  var Cards = window.PlayNovaCards;

  var gameId = document.body.getAttribute('data-game-id');
  var game = Catalog.getById(gameId);

  function sharedCategories(other) {
    return other.categories.filter(function (name) { return game.categories.indexOf(name) !== -1; }).length;
  }

  function renderRelated() {
    var list = document.getElementById('related-games');
    if (!list || !game) return;
    var others = Catalog.games.filter(function (g) { return g.id !== game.id; });
    // Games that share more categories with this one come first.
    others.sort(function (a, b) { return sharedCategories(b) - sharedCategories(a); });
    Cards.renderInto(list, others.slice(0, 3));
  }

  function addFavoriteButton() {
    var host = document.getElementById('game-favorite-host');
    if (host && game) host.appendChild(Cards.favoriteButton(game));
  }

  // One Sound button for every game, plus the M key as a shortcut.
  function addSoundButton() {
    var Sound = window.PlayNovaSound;
    var host = document.getElementById('game-favorite-host');
    if (!Sound || !host || !host.parentNode) return;
    host.parentNode.insertBefore(Sound.button(), host);
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'm' && event.key !== 'M') return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      var tag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return; // do not steal typing
      Sound.toggle();
    });
  }

  function showStartError(root) {
    D.clear(root);
    root.appendChild(D.el('div', { class: 'empty-state' }, [
      D.el('h2', { text: 'This game could not start' }),
      D.el('p', { text: 'Something went wrong while loading the game. Reloading the page usually fixes it.' }),
      D.el('button', {
        class: 'btn btn-primary',
        text: 'Reload the page',
        attrs: { type: 'button' },
        on: { click: function () { window.location.reload(); } }
      })
    ]));
  }

  function start(mount) {
    var root = document.getElementById('game-root');
    if (!root || !game) return;

    Storage.addRecent(game.id);
    Storage.incrementPlays(game.id);
    addSoundButton();
    addFavoriteButton();
    renderRelated();

    var instance = null;
    try {
      D.clear(root); // removes the "needs JavaScript" message
      instance = mount(root, { game: game });
    } catch (error) {
      if (window.console) console.error('PlayNova: game failed to start', error);
      showStartError(root);
    }

    // Stop timers and listeners when the visitor leaves the page.
    window.addEventListener('pagehide', function () {
      if (instance && typeof instance.destroy === 'function') instance.destroy();
    });
  }

  window.PlayNovaGamePage = { start: start };
})();
