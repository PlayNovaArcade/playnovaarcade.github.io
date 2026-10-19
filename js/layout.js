/* ==========================================================================
   PlayNova - layout.js
   Builds the header (logo, menu, search, favorites) and footer that every
   page shares, so you only edit them in one place.

   Each page has:  <div id="site-header"></div>  and  <div id="site-footer"></div>
   and a  data-root  on <body>  that says how to get back to the site's top
   folder ("" on the homepage, "../" inside /games/).
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;

  var root = document.body.getAttribute('data-root') || '';
  var page = document.body.getAttribute('data-page') || '';

  var ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20.5C5 16 2.5 12.2 2.5 8.8 2.5 6.1 4.5 4.2 7 4.2c1.9 0 3.7 1.1 5 3 1.3-1.9 3.1-3 5-3 2.5 0 4.5 1.9 4.5 4.6 0 3.4-2.5 7.2-9.5 11.7z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    logo:
      '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="pn-logo-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6bff"/><stop offset="1" stop-color="#7a4dff"/></linearGradient></defs>' +
      '<rect width="40" height="40" rx="11" fill="url(#pn-logo-gradient)"/>' +
      '<path d="M15 11.5v17l14-8.5z" fill="#fff"/>' +
      '<circle cx="31.5" cy="9.5" r="2.6" fill="#fff" fill-opacity=".85"/></svg>'
  };

  function link(label, href, extraClass, current) {
    return D.el('a', {
      class: extraClass,
      text: label,
      attrs: { href: root + href, 'aria-current': current ? 'page' : null }
    });
  }

  /* ---------- Header ---------- */

  function buildHeader() {
    var toggle = D.el('button', {
      class: 'nav-toggle',
      attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'site-nav', 'aria-label': 'Menu' }
    }, [D.svg(ICONS.menu)]);

    var input = D.el('input', {
      attrs: {
        id: 'site-search', name: 'q', type: 'search', placeholder: 'Search games',
        autocomplete: 'off', 'aria-label': 'Search games'
      }
    });
    var form = D.el('form', { class: 'search-form', attrs: { role: 'search', action: root + 'index.html', method: 'get' } }, [
      D.svg(ICONS.search),
      input,
      D.el('button', { class: 'sr-only', text: 'Search', attrs: { type: 'submit' } })
    ]);

    var nav = D.el('nav', { class: 'site-nav', attrs: { id: 'site-nav', 'aria-label': 'Main' } }, [
      link('Home', 'index.html', 'nav-link', page === 'home'),
      link('Games', 'index.html#games', 'nav-link'),
      link('Categories', 'index.html#categories', 'nav-link'),
      form
    ]);

    var count = D.el('span', { class: 'fav-count', attrs: { 'aria-hidden': 'true' } });
    var favLink = D.el('a', { class: 'fav-link', attrs: { href: root + 'index.html#favorites' } }, [D.svg(ICONS.heart), count]);

    function paintFavoriteCount() {
      var total = Storage.getFavorites().length;
      count.textContent = String(total);
      count.hidden = total === 0;
      favLink.setAttribute('aria-label', 'Favorites (' + total + ')');
    }
    paintFavoriteCount();
    document.addEventListener('playnova:favorites-changed', paintFavoriteCount);

    // Mobile menu open / close
    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Search: on the homepage home.js filters live as you type.
    // On other pages, pressing Enter jumps to the homepage with the search applied.
    form.addEventListener('submit', function (event) {
      var query = input.value.trim();
      if (page === 'home') {
        event.preventDefault();
        setMenu(false);
        var games = document.getElementById('games');
        if (games && games.scrollIntoView) games.scrollIntoView();
        return;
      }
      event.preventDefault();
      window.location.href = root + 'index.html' + (query ? '?q=' + encodeURIComponent(query) : '') + '#games';
    });

    var header = D.el('header', { class: 'site-header' }, [
      D.el('div', { class: 'container header-inner' }, [
        D.el('a', { class: 'brand', attrs: { href: root + 'index.html', 'aria-label': 'PlayNova home' } }, [
          D.svg(ICONS.logo),
          D.el('span', { text: 'PlayNova' })
        ]),
        nav,
        favLink,
        toggle
      ])
    ]);
    return header;
  }

  /* ---------- Footer ---------- */

  function footerList(title, items) {
    return D.el('div', {}, [
      D.el('h2', { text: title }),
      D.el('ul', {}, items.map(function (item) {
        return D.el('li', {}, [D.el('a', { text: item[0], attrs: { href: root + item[1] } })]);
      }))
    ]);
  }

  function buildFooter() {
    return D.el('footer', { class: 'site-footer' }, [
      D.el('div', { class: 'container' }, [
        D.el('div', { class: 'footer-grid' }, [
          D.el('div', {}, [
            D.el('h2', { text: 'About PlayNova' }),
            D.el('p', { text: 'PlayNova is a free collection of simple browser games. Open a game and play right away: no account, no downloads, no payment.' })
          ]),
          footerList('Play', [['Home', 'index.html'], ['All games', 'index.html#games'], ['Categories', 'index.html#categories'], ['Favorites', 'index.html#favorites']]),
          footerList('Info', [['About', 'about.html'], ['Contact', 'contact.html'], ['Privacy Policy', 'privacy.html'], ['Terms of Use', 'terms.html']])
        ]),
        D.el('div', { class: 'footer-bottom' }, [
          D.el('p', { text: '© ' + new Date().getFullYear() + ' PlayNova. All rights reserved.' })
        ])
      ])
    ]);
  }

  var headerHost = document.getElementById('site-header');
  var footerHost = document.getElementById('site-footer');
  if (headerHost) headerHost.replaceWith(buildHeader());
  if (footerHost) footerHost.replaceWith(buildFooter());
})();
