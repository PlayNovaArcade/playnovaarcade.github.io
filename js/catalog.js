/* ==========================================================================
   PlayNova - catalog.js
   The list of games. This is the one place to edit when you add a game:
   the homepage, search, filters, favorites and "related games" all read
   from this list. (See README.md, "Adding a new game".)

   Fields:
     id          unique short name, also used for saving scores
     title       name shown on cards and pages
     url         page address, relative to the site root
     categories  the first one is shown on the card; all of them are used by the filters
     description short text for cards and search
     featured    true = shown in the "Featured" row on the homepage
     thumbA/B    the two gradient colours behind the card artwork
   ========================================================================== */
(function () {
  'use strict';

  var categories = ['Arcade', 'Puzzle', 'Brain Training', 'Reaction', 'Casual', 'Strategy'];

  var games = [
    {
      id: 'snake-rush',
      title: 'Snake Rush',
      url: 'games/snake-rush.html',
      categories: ['Arcade', 'Casual'],
      description: 'Eat glowing orbs, grow longer and grab the golden stars. It gets faster with every bite. Do not crash!',
      featured: true,
      thumbA: '#13805f',
      thumbB: '#7a4dff'
    },
    {
      id: 'merge-tiles',
      title: 'Merge Tiles',
      url: 'games/merge-tiles.html',
      categories: ['Puzzle', 'Strategy', 'Brain Training'],
      description: 'Slide the tiles and merge matching numbers. Plan your moves, keep the board clear and reach 2048.',
      featured: true,
      thumbA: '#1a2f8a',
      thumbB: '#d6479b'
    },
    {
      id: 'sky-hopper',
      title: 'Sky Hopper',
      url: 'games/sky-hopper.html',
      categories: ['Arcade', 'Reaction', 'Casual'],
      description: 'Tap to hop and guide Nova the comet through the crystal pillars. One more try? Win bronze, silver and gold medals.',
      featured: true,
      thumbA: '#1b1550',
      thumbB: '#2f6bff'
    },
    {
      id: 'pop-up-bop',
      title: 'Pop-Up Bop',
      url: 'games/pop-up-bop.html',
      categories: ['Reaction', 'Arcade', 'Casual'],
      description: 'Bop the critters before they hide, chase golden ones and dodge the spiky ones. Build combos in 30 fast seconds.',
      featured: false,
      thumbA: '#0e8a7a',
      thumbB: '#7a4dff'
    },
    {
      id: 'reaction-speed',
      title: 'Reaction Speed Test',
      url: 'games/reaction-speed.html',
      categories: ['Reaction', 'Casual'],
      description: 'Wait for the screen to turn green, then tap as fast as you can. How quick are your reflexes?',
      featured: false,
      thumbA: '#0f6b57',
      thumbB: '#2f6bff'
    },
    {
      id: 'memory-match',
      title: 'Memory Match',
      url: 'games/memory-match.html',
      categories: ['Brain Training', 'Puzzle', 'Casual'],
      description: 'Flip cards, find every matching pair, and finish in as few moves as you can. Three difficulty levels.',
      featured: true,
      thumbA: '#7a4dff',
      thumbB: '#d6479b'
    },
    {
      id: 'number-guessing',
      title: 'Number Guessing',
      url: 'games/number-guessing.html',
      categories: ['Puzzle', 'Casual'],
      description: 'Find the secret number using only "too high" and "too low" clues. Can you beat the smart-guess limit?',
      featured: false,
      thumbA: '#2f6bff',
      thumbB: '#17b3d6'
    },
    {
      id: 'tic-tac-toe',
      title: 'Tic-Tac-Toe',
      url: 'games/tic-tac-toe.html',
      categories: ['Strategy', 'Casual'],
      description: 'The classic X and O showdown. Play a friend on the same screen or take on the computer.',
      featured: false,
      thumbA: '#3b2a8f',
      thumbB: '#2f6bff'
    },
    {
      id: 'clicker-challenge',
      title: 'Clicker Challenge',
      url: 'games/clicker-challenge.html',
      categories: ['Arcade', 'Reaction'],
      description: 'Click or tap as many times as you can in 15 seconds. Beat your own best score.',
      featured: false,
      thumbA: '#d6479b',
      thumbB: '#ff8a4c'
    },
    {
      id: 'pattern-echo',
      title: 'Pattern Echo',
      url: 'games/pattern-echo.html',
      categories: ['Brain Training', 'Arcade'],
      description: 'Watch the glowing pattern, then repeat it. Every round adds one more step. How long can you last?',
      featured: false,
      thumbA: '#1a2f8a',
      thumbB: '#7a4dff'
    }
  ];

  function getById(id) {
    for (var i = 0; i < games.length; i++) {
      if (games[i].id === id) return games[i];
    }
    return null;
  }

  window.PlayNovaCatalog = {
    categories: categories,
    games: games,
    getById: getById,
    featured: function () {
      return games.filter(function (game) { return game.featured; });
    }
  };
})();
