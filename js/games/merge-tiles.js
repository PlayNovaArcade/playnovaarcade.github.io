/* ==========================================================================
   PlayNova - Merge Tiles
   Slide the tiles. Two tiles with the same number join into one with double
   the value. Every move adds a new tile. Reach 2048, then keep going.

   States:  playing -> won (can keep going) -> over (no moves left)
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound;

  var N = 4; // 4 x 4 board
  var GOAL = 2048;
  var ANIM_MS = 110; // keep in sync with the transition in games.css

  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };
  var VECTORS = { up: { r: -1, c: 0 }, down: { r: 1, c: 0 }, left: { r: 0, c: -1 }, right: { r: 0, c: 1 } };

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'merge-tiles';
    var lc = Lifecycle.create();

    var grid = []; // grid[r][c] = tile or null; a tile is { value, r, c, el }
    var score = 0;
    var best = Storage.numberFrom(Storage.getBest(GAME_ID), 'score');
    var state = 'playing';
    var keepGoing = false; // true after the player chose to continue past 2048
    var dying = []; // tile elements that slid into a merge and are about to be removed
    var biggest = 2;

    /* ----- Build the screen ----- */

    var scoreStat = D.stat('Score', '0');
    var bestStat = D.stat('Best', best === null ? '-' : best);
    var tileStat = D.stat('Biggest tile', '2');

    var cellsLayer = D.el('div', { class: 'mt-cells', attrs: { 'aria-hidden': 'true' } });
    for (var i = 0; i < N * N; i++) cellsLayer.appendChild(D.el('div', { class: 'mt-cell' }));
    var tilesLayer = D.el('div', { class: 'mt-tiles', attrs: { 'aria-hidden': 'true' } });

    var overlayTitle = D.el('h2');
    var overlayText = D.el('p');
    var continueButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'Keep going',
      attrs: { type: 'button' },
      on: { click: continueAfterWin }
    });
    var newGameOverlayButton = D.el('button', {
      class: 'btn btn-ghost',
      text: 'New game',
      attrs: { type: 'button' },
      on: { click: newGame }
    });
    var overlay = D.el('div', { class: 'game-overlay', attrs: { hidden: true } }, [
      overlayTitle,
      overlayText,
      D.el('div', { class: 'overlay-actions' }, [continueButton, newGameOverlayButton])
    ]);

    var board = D.el('div', {
      class: 'mt-board',
      attrs: { tabindex: '0', role: 'group', 'aria-label': 'Merge Tiles board. Use the arrow keys or swipe to slide the tiles.', 'aria-describedby': 'mt-summary' }
    }, [cellsLayer, tilesLayer, overlay]);

    // A text version of the board for screen readers.
    var summary = D.el('p', { class: 'sr-only', attrs: { id: 'mt-summary' } });
    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });

    var newGameButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'New game',
      attrs: { type: 'button' },
      on: { click: newGame }
    });

    root.appendChild(D.statsBar([scoreStat, bestStat, tileStat]));
    root.appendChild(board);
    root.appendChild(summary);
    root.appendChild(status);
    root.appendChild(D.el('div', { class: 'controls' }, [newGameButton]));
    root.appendChild(D.el('p', { class: 'note', text: 'Arrow keys or W A S D to slide. On a phone, swipe on the board.' }));

    var stage = root.closest('.game-stage') || root;

    /* ----- Tiles ----- */

    function paintTile(tile) {
      tile.el.style.setProperty('--r', String(tile.r));
      tile.el.style.setProperty('--c', String(tile.c));
      tile.el.setAttribute('data-value', String(Math.min(tile.value, 4096)));
      tile.el.setAttribute('data-digits', String(String(tile.value).length));
      tile.el.firstChild.textContent = String(tile.value);
    }

    function addTile(r, c, value, kind) {
      var el = D.el('div', { class: 'mt-tile' + (kind ? ' is-' + kind : '') }, [D.el('span')]);
      var tile = { value: value, r: r, c: c, el: el };
      grid[r][c] = tile;
      paintTile(tile);
      tilesLayer.appendChild(el);
      return tile;
    }

    function emptyCells() {
      var list = [];
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (!grid[r][c]) list.push({ r: r, c: c });
        }
      }
      return list;
    }

    function spawn() {
      var cells = emptyCells();
      if (!cells.length) return;
      var spot = cells[Math.floor(Math.random() * cells.length)];
      addTile(spot.r, spot.c, Math.random() < 0.9 ? 2 : 4, 'new');
    }

    function flushDying() {
      dying.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      dying = [];
    }

    function canMove() {
      if (emptyCells().length) return true;
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          var v = grid[r][c].value;
          if (c + 1 < N && grid[r][c + 1].value === v) return true;
          if (r + 1 < N && grid[r + 1][c].value === v) return true;
        }
      }
      return false;
    }

    function describeBoard() {
      var rows = [];
      for (var r = 0; r < N; r++) {
        var row = [];
        for (var c = 0; c < N; c++) row.push(grid[r][c] ? grid[r][c].value : 'empty');
        rows.push('Row ' + (r + 1) + ': ' + row.join(', '));
      }
      summary.textContent = rows.join('. ') + '.';
    }

    function floatScore(points) {
      var pop = D.el('span', { class: 'score-pop', text: '+' + points, attrs: { 'aria-hidden': 'true' } });
      scoreStat.root.appendChild(pop);
      lc.setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 700);
    }

    /* ----- Moving ----- */

    function move(direction) {
      if (state === 'over' || (state === 'won' && !keepGoing)) return;
      flushDying();

      var v = VECTORS[direction];
      var rows = [0, 1, 2, 3];
      var cols = [0, 1, 2, 3];
      if (v.r === 1) rows.reverse();
      if (v.c === 1) cols.reverse();

      var merged = {}; // cells that already merged this move ("r,c")
      var moved = false;
      var gained = 0;
      var biggestMerge = 0;

      rows.forEach(function (r) {
        cols.forEach(function (c) {
          var tile = grid[r][c];
          if (!tile) return;

          // Slide as far as possible in the chosen direction.
          var nr = r;
          var nc = c;
          while (true) {
            var tr = nr + v.r;
            var tc = nc + v.c;
            if (tr < 0 || tr >= N || tc < 0 || tc >= N) break;
            var other = grid[tr][tc];
            if (!other) {
              nr = tr;
              nc = tc;
              continue;
            }
            if (other.value === tile.value && !merged[tr + ',' + tc]) {
              // Merge: both old tiles slide to the spot, then a new tile replaces them.
              grid[r][c] = null;
              tile.r = tr;
              tile.c = tc;
              paintTile(tile);
              dying.push(tile.el, other.el);
              var value = tile.value * 2;
              addTile(tr, tc, value, 'merged');
              merged[tr + ',' + tc] = true;
              gained += value;
              biggestMerge = Math.max(biggestMerge, value);
              moved = true;
              return;
            }
            break;
          }

          if (nr !== r || nc !== c) {
            grid[r][c] = null;
            grid[nr][nc] = tile;
            tile.r = nr;
            tile.c = nc;
            paintTile(tile);
            moved = true;
          }
        });
      });

      if (!moved) return;

      lc.setTimeout(flushDying, ANIM_MS + 20);
      spawn();

      if (gained) {
        score += gained;
        scoreStat.set(score);
        floatScore(gained);
        Sound.play('merge', biggestMerge);
        if (biggestMerge > biggest) {
          biggest = biggestMerge;
          tileStat.set(biggest);
        }
      } else {
        Sound.play('slide');
      }

      if (best === null || score > best) {
        best = score;
        Storage.setBest(GAME_ID, null, { score: score });
        bestStat.set(best);
      }
      describeBoard();

      if (biggestMerge >= GOAL && state === 'playing' && !keepGoing) {
        state = 'won';
        lc.setTimeout(function () { Sound.play('best'); }, 150);
        showOverlay('You made ' + GOAL + '!', 'Amazing. Score ' + score + '. Keep going for an even bigger tile?', true);
        status.textContent = 'You reached ' + GOAL + '!';
        return;
      }

      if (!canMove()) {
        state = 'over';
        lc.setTimeout(function () { Sound.play('lose'); }, 150);
        showOverlay('No more moves', 'Score ' + score + '. Biggest tile ' + biggest + '.', false);
        status.textContent = 'Game over. You scored ' + score + '.';
      }
    }

    function showOverlay(title, text, canContinue) {
      overlayTitle.textContent = title;
      overlayText.textContent = text;
      continueButton.hidden = !canContinue;
      newGameOverlayButton.textContent = canContinue ? 'New game' : 'Try again';
      newGameOverlayButton.className = canContinue ? 'btn btn-ghost' : 'btn btn-primary';
      overlay.hidden = false;
      (canContinue ? continueButton : newGameOverlayButton).focus();
    }

    function continueAfterWin() {
      keepGoing = true;
      state = 'playing';
      overlay.hidden = true;
      status.textContent = 'Keep going!';
      focusBoard();
    }

    function focusBoard() {
      try { board.focus({ preventScroll: true }); } catch (error) { board.focus(); }
    }

    function newGame() {
      lc.clearTimers();
      flushDying();
      D.clear(tilesLayer);
      grid = [];
      for (var r = 0; r < N; r++) grid.push([null, null, null, null]);
      score = 0;
      biggest = 2;
      keepGoing = false;
      state = 'playing';
      overlay.hidden = true;
      scoreStat.set('0');
      tileStat.set('2');
      status.textContent = '';
      spawn();
      spawn();
      for (var rr = 0; rr < N; rr++) {
        for (var cc = 0; cc < N; cc++) {
          if (grid[rr][cc] && grid[rr][cc].value > biggest) biggest = grid[rr][cc].value;
        }
      }
      tileStat.set(biggest);
      describeBoard();
    }

    /* ----- Input ----- */

    function isTyping(target) {
      var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    }

    lc.on(document, 'keydown', function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      var direction = KEYS[event.key];
      if (!direction) return;
      var active = document.activeElement;
      if (active && active !== document.body && !stage.contains(active)) return; // let the page scroll
      event.preventDefault();
      move(direction);
    });

    // Swipe: measure from where the finger went down to where it came up.
    var startX = null;
    var startY = null;
    lc.on(board, 'pointerdown', function (event) {
      if (event.target.closest && event.target.closest('button')) return;
      startX = event.clientX;
      startY = event.clientY;
    });
    lc.on(window, 'pointerup', function (event) {
      if (startX === null) return;
      var dx = event.clientX - startX;
      var dy = event.clientY - startY;
      startX = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    lc.on(window, 'pointercancel', function () { startX = null; });

    newGame();

    return { destroy: function () { lc.destroy(); } };
  });
})();
