/* ==========================================================================
   PlayNova - Tic-Tac-Toe
   Two players on one screen, or one player against a simple computer.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound; // shared sound effects (js/sound.js)

  // The eight ways to win: three rows, three columns, two diagonals (cell numbers 0 to 8).
  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  var COMPUTER_DELAY_MS = 450;

  var MARKS = {
    X: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M8 8l24 24M32 8L8 32" stroke="#ff8ab3" stroke-width="6" stroke-linecap="round" fill="none"/></svg>',
    O: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="12.5" stroke="#7fe0ff" stroke-width="6" fill="none"/></svg>'
  };

  function findWinner(board) {
    for (var i = 0; i < LINES.length; i++) {
      var line = LINES[i];
      if (board[line[0]] && board[line[0]] === board[line[1]] && board[line[0]] === board[line[2]]) {
        return { player: board[line[0]], line: line };
      }
    }
    return null;
  }

  function emptyCells(board) {
    var cells = [];
    board.forEach(function (value, index) {
      if (!value) cells.push(index);
    });
    return cells;
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * A simple computer opponent (it plays O):
   *   1. win if it can   2. block your win   3. take the centre
   *   4. take a corner   5. take whatever is left
   * It is easy to beat with a "fork" (two threats at once).
   */
  function chooseComputerMove(board) {
    var open = emptyCells(board);

    function findFinishingMove(player) {
      for (var i = 0; i < open.length; i++) {
        var test = board.slice();
        test[open[i]] = player;
        if (findWinner(test)) return open[i];
      }
      return -1;
    }

    var win = findFinishingMove('O');
    if (win !== -1) return win;
    var block = findFinishingMove('X');
    if (block !== -1) return block;
    if (!board[4]) return 4;
    var corners = [0, 2, 6, 8].filter(function (c) { return !board[c]; });
    if (corners.length) return pickRandom(corners);
    return pickRandom(open);
  }

  window.PlayNovaGamePage.start(function mount(root) {
    var lc = Lifecycle.create();

    var mode = 'two'; // 'two' or 'cpu'
    var board = [];
    var turn = 'X';
    var over = false;
    var thinking = false;
    var scores = { X: 0, O: 0, draw: 0 };
    var cells = [];

    /* ----- Build the screen ----- */

    var xStat = D.stat('X wins', '0');
    var oStat = D.stat('O wins', '0');
    var drawStat = D.stat('Draws', '0');

    var modePicker = D.segmented(
      'Game mode',
      [{ value: 'two', label: 'Two players' }, { value: 'cpu', label: 'Vs computer' }],
      mode,
      function (value) { setMode(value); }
    );

    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });
    var boardEl = D.el('div', { class: 'ttt-board', attrs: { role: 'group', 'aria-label': 'Tic-Tac-Toe board' } });

    for (var i = 0; i < 9; i++) {
      (function (index) {
        var cell = D.el('button', { class: 'ttt-cell', attrs: { type: 'button' } });
        cell.addEventListener('click', function () { handleCell(index); });
        cells.push(cell);
        boardEl.appendChild(cell);
      })(i);
    }

    var newGameButton = D.el('button', {
      class: 'btn btn-primary btn-small',
      text: 'New game',
      attrs: { type: 'button' },
      on: { click: newGame }
    });
    var resetScoresButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'Reset scores',
      attrs: { type: 'button' },
      on: { click: resetScores }
    });

    root.appendChild(D.el('div', { class: 'controls', attrs: { style: 'margin:0 0 16px' } }, [modePicker.root]));
    root.appendChild(D.statsBar([xStat, oStat, drawStat]));
    root.appendChild(boardEl);
    root.appendChild(status);
    root.appendChild(D.el('div', { class: 'controls' }, [newGameButton, resetScoresButton]));

    /* ----- Drawing the board ----- */

    function who(player) {
      if (mode === 'cpu') return player === 'X' ? 'You' : 'The computer';
      return 'Player ' + player;
    }

    function cellLabel(index) {
      var row = Math.floor(index / 3) + 1;
      var column = (index % 3) + 1;
      return 'Row ' + row + ', column ' + column + ', ' + (board[index] ? board[index] : 'empty');
    }

    function paintBoard(winningLine) {
      cells.forEach(function (cell, index) {
        D.clear(cell);
        if (board[index]) cell.appendChild(D.svg(MARKS[board[index]]));
        cell.setAttribute('aria-label', cellLabel(index));
        // aria-disabled (instead of disabled) keeps keyboard focus where it is.
        if (board[index] || over) cell.setAttribute('aria-disabled', 'true');
        else cell.removeAttribute('aria-disabled');
        cell.classList.toggle('is-win', !!winningLine && winningLine.indexOf(index) !== -1);
      });
    }

    function paintScores() {
      xStat.set(scores.X);
      oStat.set(scores.O);
      drawStat.set(scores.draw);
    }

    function paintLabels() {
      xStat.root.firstChild.textContent = mode === 'cpu' ? 'You (X) win' : 'X wins';
      oStat.root.firstChild.textContent = mode === 'cpu' ? 'Computer (O) wins' : 'O wins';
    }

    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'status-line' + (kind ? ' is-' + kind : '');
    }

    function paintTurn() {
      setStatus(mode === 'cpu' ? 'Your turn (X).' : 'Player ' + turn + ', it is your turn.');
    }

    /* ----- Game flow ----- */

    function place(index) {
      board[index] = turn;
      Sound.play(turn === 'X' ? 'tap' : 'tap2');
      var winner = findWinner(board);

      if (winner) {
        over = true;
        scores[winner.player]++;
        paintScores();
        paintBoard(winner.line);
        var text = mode === 'cpu'
          ? (winner.player === 'X' ? 'You win! Three in a row.' : 'The computer wins. Better luck next time.')
          : 'Player ' + winner.player + ' wins!';
        setStatus(text, winner.player === 'X' || mode === 'two' ? 'good' : 'bad');
        lc.setTimeout(function () { Sound.play(mode === 'cpu' && winner.player === 'O' ? 'lose' : 'win'); }, 120);
        return;
      }

      if (emptyCells(board).length === 0) {
        over = true;
        scores.draw++;
        paintScores();
        paintBoard(null);
        setStatus('It is a draw. Nobody wins this round.');
        lc.setTimeout(function () { Sound.play('draw'); }, 120);
        return;
      }

      turn = turn === 'X' ? 'O' : 'X';
      paintBoard(null);
    }

    function handleCell(index) {
      if (over || thinking || board[index]) return; // cannot overwrite a filled square

      place(index);
      if (over) return;

      if (mode === 'cpu') {
        thinking = true;
        setStatus('The computer is thinking...');
        lc.setTimeout(function () {
          place(chooseComputerMove(board));
          thinking = false;
          if (!over) paintTurn();
        }, COMPUTER_DELAY_MS);
      } else {
        paintTurn();
      }
    }

    function newGame() {
      lc.clearTimers();
      board = [null, null, null, null, null, null, null, null, null];
      turn = 'X';
      over = false;
      thinking = false;
      paintBoard(null);
      paintTurn();
    }

    function resetScores() {
      scores = { X: 0, O: 0, draw: 0 };
      paintScores();
      newGame();
    }

    function setMode(nextMode) {
      mode = nextMode;
      modePicker.set(mode);
      paintLabels();
      resetScores();
    }

    paintLabels();
    newGame();

    return { destroy: function () { lc.destroy(); } };
  });
})();
