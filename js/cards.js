/* ==========================================================================
   PlayNova - cards.js
   Builds the game cards (thumbnail, title, description, Play button and a
   favorite heart) used on the homepage and in "related games".
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Thumbs = window.PlayNovaThumbs;

  var HEART_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path stroke-linejoin="round" d="M12 20.5C5 16 2.5 12.2 2.5 8.8 2.5 6.1 4.5 4.2 7 4.2c1.9 0 3.7 1.1 5 3 1.3-1.9 3.1-3 5-3 2.5 0 4.5 1.9 4.5 4.6 0 3.4-2.5 7.2-9.5 11.7z"/></svg>';

  function siteRoot() {
    return document.body.getAttribute('data-root') || '';
  }

  function paintFavoriteButton(button, isOn) {
    button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    button.title = isOn ? 'Remove from favorites' : 'Add to favorites';
  }

  /** A heart button that saves/removes a favorite. Stays in sync with every other heart on the page. */
  function favoriteButton(game, extraClass) {
    var button = D.el('button', {
      class: 'fav-btn' + (extraClass ? ' ' + extraClass : ''),
      attrs: { type: 'button', 'data-game-id': game.id, 'aria-label': 'Favorite: ' + game.title }
    });
    button.appendChild(D.svg(HEART_SVG));
    paintFavoriteButton(button, Storage.isFavorite(game.id));
    button.addEventListener('click', function () {
      Storage.toggleFavorite(game.id); // fires "playnova:favorites-changed", which repaints all hearts
    });
    return button;
  }

  document.addEventListener('playnova:favorites-changed', function () {
    var buttons = document.querySelectorAll('.fav-btn[data-game-id]');
    Array.prototype.forEach.call(buttons, function (button) {
      paintFavoriteButton(button, Storage.isFavorite(button.getAttribute('data-game-id')));
    });
  });

  /**
   * options.badge  small label on the picture, e.g. "Featured"
   * options.meta   small grey line under the description
   */
  function create(game, options) {
    options = options || {};
    var href = siteRoot() + game.url;

    var thumb = D.el('a', { class: 'thumb', attrs: { href: href, tabindex: '-1', 'aria-hidden': 'true' } });
    thumb.style.setProperty('--thumb-a', game.thumbA);
    thumb.style.setProperty('--thumb-b', game.thumbB);
    thumb.appendChild(D.svg(Thumbs.html(game.id)));
    if (options.badge) thumb.appendChild(D.el('span', { class: 'badge', text: options.badge }));

    var body = D.el('div', { class: 'card-body' }, [
      D.el('p', { class: 'card-category', text: game.categories[0] }),
      D.el('h3', { text: game.title }),
      D.el('p', { class: 'card-desc', text: game.description }),
      options.meta ? D.el('p', { class: 'card-meta', text: options.meta }) : null,
      D.el('div', { class: 'card-actions' }, [
        D.el('a', {
          class: 'btn btn-primary btn-small',
          text: 'Play',
          attrs: { href: href, 'aria-label': 'Play ' + game.title }
        }),
        favoriteButton(game)
      ])
    ]);

    return D.el('article', { class: 'game-card' }, [thumb, body]);
  }

  /** Replace the contents of a <ul class="card-grid"> with cards for the given games. */
  function renderInto(list, games, optionsFor) {
    D.clear(list);
    games.forEach(function (game) {
      var options = typeof optionsFor === 'function' ? optionsFor(game) : optionsFor;
      list.appendChild(D.el('li', {}, [create(game, options)]));
    });
  }

  window.PlayNovaCards = {
    create: create,
    renderInto: renderInto,
    favoriteButton: favoriteButton
  };
})();
