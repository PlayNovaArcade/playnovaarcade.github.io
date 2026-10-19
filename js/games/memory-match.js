/* ==========================================================================
   PlayNova - Memory Match
   Flip two cards at a time and find every matching pair.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound; // shared sound effects (js/sound.js)

  // Each symbol has its own SHAPE and colour, so the game is playable without colour vision.
  var SYMBOLS = [
    { name: 'Star', color: '#ffc552', path: 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z' },
    { name: 'Heart', color: '#ff6b88', path: 'M12 20.5C5 16 2.5 12.2 2.5 8.8 2.5 6.1 4.5 4.2 7 4.2c1.9 0 3.7 1.1 5 3 1.3-1.9 3.1-3 5-3 2.5 0 4.5 1.9 4.5 4.6 0 3.4-2.5 7.2-9.5 11.7z' },
    { name: 'Moon', color: '#b196ff', path: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z' },
    { name: 'Bolt', color: '#6ea1ff', path: 'M13.5 2L4.5 13.5h6L9.5 22l9-12h-6z' },
    { name: 'Diamond', color: '#36d6b4', path: 'M12 2l8 10-8 10-8-10z' },
    { name: 'Circle', color: '#ff9f5a', path: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
    { name: 'Triangle', color: '#d6479b', path: 'M12 3l9.5 17h-19z' },
    { name: 'Hexagon', color: '#7fe0ff', path: 'M12 2.5l8.5 5v9L12 21.5l-8.5-5v-9z' },
    { name: 'Drop', color: '#5ab0ff', path: 'M12 2.5s7 7.3 7 12a7 7 0 0 1-14 0c0-4.7 7-12 7-12z' },
    { name: 'Plus', color: '#9be15d', path: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z' },
    { name: 'Pentagon', color: '#ffd166', path: 'M12 2.5l9.5 6.9-3.6 11.1H6.1L2.5 9.4z' },
    { name: 'Arrowhead', color: '#c792ff', path: 'M12 2.5l8 18-8-4.5-8 4.5z' }
  ];

  var LEVELS = {
    easy: { label: 'Easy', cols: 4, pairs: 6 },
    medium: { label: 'Medium', cols: 4, pairs: 8 },
    hard: { label: 'Hard', cols: 6, pairs: 12 }
  };

  var MISMATCH_DELAY_MS = 800;

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'memory-match';
    var lc = Lifecycle.create();

    var level = 'easy';
    var cards = [];
    var firstPick = null;
    var locked = false; // true while two mismatched cards are showing
    var moves = 0;
    var matchedPairs = 0;
    var startedAt = 0;
    var timerId = null;
    var finished = false;

    /* ----- Build the screen ----- */

    var movesStat = D.stat('Moves', '0');
    var timeStat = D.stat('Time', '0:00');
    var pairsStat = D.stat('Pairs', '0');
    var bestStat = D.stat('Best moves', '-');

    var levelPicker = D.segmented(
      'Difficulty',
      Object.keys(LEVELS).map(function (key) { return { value: key, label: LEVELS[key].label }; }),
      level,
      function (value) { newGame(value); }
    );

    var board = D.el('div', { class: 'mm-board', attrs: { role: 'group', 'aria-label': 'Memory cards' } });
    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });

    var resultTitle = D.el('h2');
    var resultText = D.el('p');
    var againButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'Play again',
      attrs: { type: 'button' },
      on: { click: function () { newGame(level); } }
    });
    var resultCard = D.el('div', { class: 'result-card', attrs: { hidden: true } }, [resultTitle, resultText, againButton]);

    var restartButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'Restart',
      attrs: { type: 'button' },
      on: { click: function () { newGame(level); } }
    });

    root.appendChild(D.el('div', { class: 'controls', attrs: { style: 'margin:0 0 16px' } }, [levelPicker.root]));
    root.appendChild(D.statsBar([movesStat, timeStat, pairsStat, bestStat]));
    root.appendChild(board);
    root.appendChild(status);
    root.appendChild(resultCard);
    root.appendChild(D.el('div', { class: 'controls' }, [restartButton]));

    /* ----- Timer ----- */

    function elapsedSeconds() {
      return startedAt ? Math.floor((performance.now() - startedAt) / 1000) : 0;
    }

    function startTimer() {
      startedAt = performance.now();
      timerId = lc.setInterval(function () {
        timeStat.set(formatTime(elapsedSeconds()));
      }, 250);
    }

    function stopTimer() {
      if (timerId !== null) lc.clearInterval(timerId);
      timerId = null;
    }

    /* ----- Cards ----- */

    function cardLabel(card) {
      var position = 'Card ' + (card.index + 1);
      if (card.matched) return position + ', ' + card.symbol.name + ', matched';
      if (card.flipped) return position + ', ' + card.symbol.name;
      return position + ', face down';
    }

    function paintCard(card) {
      card.button.classList.toggle('is-flipped', card.flipped);
      card.button.classList.toggle('is-matched', card.matched);
      card.button.setAttribute('aria-label', cardLabel(card));
      if (card.matched) card.button.setAttribute('aria-disabled', 'true');
    }

    function buildBoard() {
      D.clear(board);
      var config = LEVELS[level];
      board.style.setProperty('--cols', String(config.cols));

      var deck = [];
      SYMBOLS.slice(0, config.pairs).forEach(function (symbol) {
        deck.push(symbol, symbol);
      });

      cards = shuffle(deck).map(function (symbol, index) {
        var button = D.el('button', { class: 'mm-card', attrs: { type: 'button' } });
        var icon = D.svg(
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + symbol.path + '" fill="' + symbol.color + '"/></svg>'
        );
        var front = D.el('span', { class: 'mm-face mm-front' }, [icon]);
        var back = D.el('span', { class: 'mm-face mm-back' });
        button.appendChild(D.el('span', { class: 'mm-card-inner' }, [back, front]));

        var card = { index: index, symbol: symbol, button: button, flipped: false, matched: false };
        button.addEventListener('click', function () { flip(card); });
        paintCard(card);
        board.appendChild(button);
        return card;
      });
    }

    function flip(card) {
      if (finished || locked || card.flipped || card.matched) return;
      if (!startedAt) startTimer();

      card.flipped = true;
      paintCard(card);
      Sound.play('flip');

      if (!firstPick) {
        firstPick = card;
        return;
      }

      var secondPick = card;
      moves++;
      movesStat.set(moves);

      if (firstPick.symbol === secondPick.symbol) {
        firstPick.matched = secondPick.matched = true;
        paintCard(firstPick);
        paintCard(secondPick);
        matchedPairs++;
        pairsStat.set(matchedPairs + '/' + LEVELS[level].pairs);
        status.textContent = 'Match: ' + secondPick.symbol.name + '!';
        lc.setTimeout(function () { Sound.play('match'); }, 120);
        firstPick = null;
        if (matchedPairs === LEVELS[level].pairs) finish();
      } else {
        locked = true;
        status.textContent = 'Not a match. Try again.';
        lc.setTimeout(function () { Sound.play('miss'); }, 120);
        var a = firstPick;
        var b = secondPick;
        firstPick = null;
        lc.setTimeout(function () {
          a.flipped = b.flipped = false;
          paintCard(a);
          paintCard(b);
          locked = false;
        }, MISMATCH_DELAY_MS);
      }
    }

    /* ----- Finish and best result ----- */

    function isBetter(moves, seconds, best) {
      var bestMoves = Storage.numberFrom(best, 'moves');
      var bestSeconds = Storage.numberFrom(best, 'seconds');
      if (bestMoves === null || bestSeconds === null) return true;
      return moves < bestMoves || (moves === bestMoves && seconds < bestSeconds);
    }

    function paintBest() {
      var best = Storage.getBest(GAME_ID, level);
      var bestMoves = Storage.numberFrom(best, 'moves');
      bestStat.set(bestMoves === null ? '-' : bestMoves);
    }

    function finish() {
      finished = true;
      var seconds = elapsedSeconds();
      stopTimer();
      timeStat.set(formatTime(seconds));

      var best = Storage.getBest(GAME_ID, level);
      var isNewBest = isBetter(moves, seconds, best);
      if (isNewBest) Storage.setBest(GAME_ID, level, { moves: moves, seconds: seconds });
      paintBest();

      resultTitle.textContent = isNewBest ? 'New best result!' : 'You matched every pair!';
      resultText.textContent = 'It took ' + moves + ' moves and ' + formatTime(seconds) + ' on ' + LEVELS[level].label + '.';
      resultCard.hidden = false;
      status.textContent = 'All pairs found.';
      lc.setTimeout(function () { Sound.play(isNewBest ? 'best' : 'win'); }, 350);
      againButton.focus();
    }

    function newGame(nextLevel) {
      lc.clearTimers();
      level = nextLevel;
      levelPicker.set(level);
      firstPick = null;
      locked = false;
      moves = 0;
      matchedPairs = 0;
      startedAt = 0;
      timerId = null;
      finished = false;

      movesStat.set('0');
      timeStat.set('0:00');
      pairsStat.set('0/' + LEVELS[level].pairs);
      status.textContent = '';
      resultCard.hidden = true;
      paintBest();
      buildBoard();
    }

    /* ----- Keyboard: arrow keys move between cards ----- */

    lc.on(board, 'keydown', function (event) {
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -LEVELS[level].cols, ArrowDown: LEVELS[level].cols }[event.key];
      if (!step) return;
      var current = cards.findIndex(function (card) { return card.button === document.activeElement; });
      if (current === -1) return;
      var target = current + step;
      if (target >= 0 && target < cards.length) {
        event.preventDefault();
        cards[target].button.focus();
      }
    });

    newGame('easy');

    return { destroy: function () { lc.destroy(); } };
  });
})();
