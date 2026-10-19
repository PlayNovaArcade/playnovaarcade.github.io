/* ==========================================================================
   PlayNova - Snake Rush
   Steer the snake, eat the glowing orbs, grow longer, and do not crash.
   It speeds up a little with every orb. Golden stars are worth 5 points
   but only stay for a few seconds.

   States:  ready -> running <-> paused -> over
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound;

  var SIZE = 18; // the board is SIZE x SIZE squares
  var START_MS = 150; // time per step at the start (lower = faster)
  var MIN_MS = 70;
  var SPEEDUP_MS = 3; // each orb makes the snake this much faster
  var BONUS_EVERY = 5; // a golden star appears after every 5 orbs
  var BONUS_STEPS = 45; // how many steps the star stays
  var BONUS_POINTS = 5;

  var MOVES = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  var OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function mix(a, b, t) {
    // a, b are [r, g, b] colours
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }

  var HEAD_COLOR = [94, 240, 200];
  var TAIL_COLOR = [122, 77, 255];

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'snake-rush';
    var lc = Lifecycle.create();

    var mode = 'classic'; // 'classic' (walls) or 'wrap' (go through walls)
    var state = 'ready';
    var snake = [];
    var dir = 'right';
    var queue = []; // turns waiting to happen, so quick key presses are not lost
    var food = null;
    var bonus = null; // { x, y, life }
    var eaten = 0;
    var score = 0;
    var stepMs = START_MS;
    var best = null;
    var runId = 0;
    var crashed = null; // where the snake crashed, drawn in red

    /* ----- Build the screen ----- */

    var scoreStat = D.stat('Score', '0');
    var bestStat = D.stat('Best', '-');
    var lengthStat = D.stat('Length', '3');

    var modePicker = D.segmented(
      'Mode',
      [{ value: 'classic', label: 'Classic walls' }, { value: 'wrap', label: 'No walls' }],
      mode,
      function (value) { mode = value; reset(); }
    );

    var canvas = D.el('canvas', { class: 'game-canvas', attrs: { 'aria-hidden': 'true' } });
    var overlayTitle = D.el('h2');
    var overlayText = D.el('p');
    var overlayButton = D.el('button', {
      class: 'btn btn-primary',
      attrs: { type: 'button' },
      on: { click: startOrResume }
    });
    var overlay = D.el('div', { class: 'game-overlay' }, [overlayTitle, overlayText, overlayButton]);
    var wrap = D.el('div', {
      class: 'canvas-wrap snake-wrap',
      attrs: { tabindex: '0', role: 'group', 'aria-label': 'Snake board. Use the arrow keys or swipe to steer.' }
    }, [canvas, overlay]);

    function dpadButton(direction, label, path) {
      return D.el('button', {
        class: 'dpad-btn dpad-' + direction,
        attrs: { type: 'button', 'aria-label': label },
        on: { click: function () { steer(direction); } }
      }, [D.svg('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + path + '" fill="currentColor"/></svg>')]);
    }
    var dpad = D.el('div', { class: 'dpad', attrs: { role: 'group', 'aria-label': 'Direction buttons' } }, [
      dpadButton('up', 'Up', 'M12 5l8 10H4z'),
      dpadButton('left', 'Left', 'M5 12l10-8v16z'),
      dpadButton('right', 'Right', 'M19 12L9 4v16z'),
      dpadButton('down', 'Down', 'M12 19L4 9h16z')
    ]);

    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });
    var pauseButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'Pause',
      attrs: { type: 'button' },
      on: { click: function () { if (state === 'running') pause(); else if (state === 'paused') resume(); } }
    });
    var restartButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'Restart',
      attrs: { type: 'button' },
      on: { click: function () { reset(); start(); } }
    });

    root.appendChild(D.el('div', { class: 'controls', attrs: { style: 'margin:0 0 16px' } }, [modePicker.root]));
    root.appendChild(D.statsBar([scoreStat, bestStat, lengthStat]));
    root.appendChild(wrap);
    root.appendChild(dpad);
    root.appendChild(status);
    root.appendChild(D.el('div', { class: 'controls' }, [pauseButton, restartButton]));
    root.appendChild(D.el('p', { class: 'note', text: 'Arrow keys or W A S D to steer. Space or P to pause. On a phone, swipe on the board or use the buttons.' }));

    var stage = root.closest('.game-stage') || root;

    /* ----- Helpers ----- */

    function bestKey() { return mode; }

    function paintBest() {
      best = Storage.numberFrom(Storage.getBest(GAME_ID, bestKey()), 'score');
      bestStat.set(best === null ? '-' : best);
    }

    function showOverlay(title, text, buttonText) {
      overlayTitle.textContent = title;
      overlayText.textContent = text;
      overlayButton.textContent = buttonText;
      overlay.hidden = false;
    }

    function paintPauseButton() {
      pauseButton.textContent = state === 'paused' ? 'Resume' : 'Pause';
      if (state === 'running' || state === 'paused') pauseButton.removeAttribute('aria-disabled');
      else pauseButton.setAttribute('aria-disabled', 'true');
    }

    function isFree(x, y) {
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) return false;
      }
      if (food && food.x === x && food.y === y) return false;
      if (bonus && bonus.x === x && bonus.y === y) return false;
      return true;
    }

    function randomFreeCell() {
      var free = [];
      for (var y = 0; y < SIZE; y++) {
        for (var x = 0; x < SIZE; x++) {
          if (isFree(x, y)) free.push({ x: x, y: y });
        }
      }
      return free.length ? free[Math.floor(Math.random() * free.length)] : null;
    }

    function focusBoard() {
      try { wrap.focus({ preventScroll: true }); } catch (error) { wrap.focus(); }
    }

    /* ----- Drawing ----- */

    function resize() {
      var cssSize = Math.floor(wrap.clientWidth);
      if (!cssSize) return;
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssSize * ratio);
      canvas.height = canvas.width;
      draw();
    }

    function draw() {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      var w = canvas.width;
      var c = w / SIZE;

      ctx.fillStyle = '#0b1228';
      ctx.fillRect(0, 0, w, w);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (var y = 0; y < SIZE; y++) {
        for (var x = 0; x < SIZE; x++) {
          if ((x + y) % 2) ctx.fillRect(x * c, y * c, c, c);
        }
      }
      if (mode === 'classic') {
        ctx.strokeStyle = 'rgba(255,107,136,0.55)';
        ctx.lineWidth = Math.max(2, c * 0.12);
        ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, w - ctx.lineWidth);
      }

      // Food: a glowing pink orb
      if (food) {
        var fx = (food.x + 0.5) * c;
        var fy = (food.y + 0.5) * c;
        ctx.shadowColor = '#ff6b88';
        ctx.shadowBlur = c * 0.8;
        ctx.fillStyle = '#ff6b88';
        ctx.beginPath();
        ctx.arc(fx, fy, c * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(fx - c * 0.12, fy - c * 0.12, c * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bonus: a golden star with a shrinking ring showing the time left
      if (bonus) {
        var bx = (bonus.x + 0.5) * c;
        var by = (bonus.y + 0.5) * c;
        ctx.strokeStyle = 'rgba(255,197,82,0.6)';
        ctx.lineWidth = Math.max(1.5, c * 0.08);
        ctx.beginPath();
        ctx.arc(bx, by, c * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (bonus.life / BONUS_STEPS));
        ctx.stroke();
        ctx.shadowColor = '#ffc552';
        ctx.shadowBlur = c * 0.8;
        ctx.fillStyle = '#ffc552';
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
          var r = i % 2 ? c * 0.2 : c * 0.46;
          var a = -Math.PI / 2 + i * Math.PI / 5;
          ctx.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Snake: tail first so the head is drawn on top
      for (var s = snake.length - 1; s >= 0; s--) {
        var part = snake[s];
        var t = snake.length > 1 ? s / (snake.length - 1) : 0;
        var inset = s === 0 ? c * 0.04 : c * 0.1;
        ctx.fillStyle = mix(HEAD_COLOR, TAIL_COLOR, t);
        roundRect(ctx, part.x * c + inset, part.y * c + inset, c - inset * 2, c - inset * 2, c * 0.3);
        ctx.fill();
      }

      // Eyes on the head, looking the way the snake is going
      if (snake.length) {
        var head = snake[0];
        var move = MOVES[dir];
        var hx = (head.x + 0.5) * c;
        var hy = (head.y + 0.5) * c;
        var side = { x: -move.y, y: move.x };
        [-1, 1].forEach(function (k) {
          var ex = hx + move.x * c * 0.14 + side.x * c * 0.2 * k;
          var ey = hy + move.y * c * 0.14 + side.y * c * 0.2 * k;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex, ey, c * 0.13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0a0f1f';
          ctx.beginPath();
          ctx.arc(ex + move.x * c * 0.04, ey + move.y * c * 0.04, c * 0.065, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (crashed) {
        ctx.strokeStyle = '#ff6b88';
        ctx.lineWidth = Math.max(2, c * 0.14);
        ctx.beginPath();
        ctx.arc((crashed.x + 0.5) * c, (crashed.y + 0.5) * c, c * 0.62, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    /* ----- Game flow ----- */

    function reset() {
      runId++;
      lc.clearTimers();
      var mid = Math.floor(SIZE / 2);
      snake = [{ x: 6, y: mid }, { x: 5, y: mid }, { x: 4, y: mid }];
      dir = 'right';
      queue = [];
      bonus = null;
      food = null;
      food = randomFreeCell();
      eaten = 0;
      score = 0;
      stepMs = START_MS;
      crashed = null;
      state = 'ready';
      scoreStat.set('0');
      lengthStat.set(snake.length);
      paintBest();
      showOverlay('Snake Rush', 'Eat the glowing orbs to grow. Do not crash' + (mode === 'classic' ? ' into the walls or yourself.' : ' into yourself.'), 'Start');
      status.textContent = '';
      paintPauseButton();
      draw();
    }

    function start() {
      if (state === 'over') reset();
      if (state !== 'ready') return;
      state = 'running';
      overlay.hidden = true;
      status.textContent = '';
      paintPauseButton();
      Sound.play('start');
      focusBoard();
      try { wrap.scrollIntoView({ block: 'nearest' }); } catch (error) { /* older browsers */ }
      schedule();
    }

    function startOrResume() {
      if (state === 'paused') resume();
      else start();
    }

    function pause() {
      if (state !== 'running') return;
      state = 'paused';
      runId++; // the waiting step will do nothing
      lc.clearTimers();
      showOverlay('Paused', 'Take a breath. Press Space or the button to carry on.', 'Resume');
      paintPauseButton();
    }

    function resume() {
      if (state !== 'paused') return;
      state = 'running';
      overlay.hidden = true;
      paintPauseButton();
      focusBoard();
      schedule();
    }

    function schedule() {
      var myRun = runId;
      lc.setTimeout(function () { step(myRun); }, stepMs);
    }

    function steer(direction) {
      if (state === 'ready' || state === 'over') start();
      else if (state === 'paused') resume();
      if (state !== 'running') return;
      var last = queue.length ? queue[queue.length - 1] : dir;
      if (direction === last || direction === OPPOSITE[last]) return;
      if (queue.length < 3) queue.push(direction);
    }

    function step(myRun) {
      if (myRun !== runId || state !== 'running') return;
      if (queue.length) dir = queue.shift();

      var move = MOVES[dir];
      var next = { x: snake[0].x + move.x, y: snake[0].y + move.y };

      if (mode === 'wrap') {
        next.x = (next.x + SIZE) % SIZE;
        next.y = (next.y + SIZE) % SIZE;
      } else if (next.x < 0 || next.y < 0 || next.x >= SIZE || next.y >= SIZE) {
        gameOver(snake[0]);
        return;
      }

      var eatsFood = food && next.x === food.x && next.y === food.y;
      var eatsBonus = bonus && next.x === bonus.x && next.y === bonus.y;
      var grows = eatsFood || eatsBonus;

      // The tail moves out of the way this step, unless the snake is growing.
      var bodyLength = grows ? snake.length : snake.length - 1;
      for (var i = 0; i < bodyLength; i++) {
        if (snake[i].x === next.x && snake[i].y === next.y) {
          gameOver(next);
          return;
        }
      }

      snake.unshift(next);
      if (!grows) snake.pop();

      if (eatsFood) {
        eaten++;
        score += 1;
        stepMs = Math.max(MIN_MS, stepMs - SPEEDUP_MS);
        Sound.play('eat', eaten);
        food = randomFreeCell();
        if (eaten % BONUS_EVERY === 0 && !bonus) {
          var spot = randomFreeCell();
          if (spot) bonus = { x: spot.x, y: spot.y, life: BONUS_STEPS };
        }
      }
      if (eatsBonus) {
        score += BONUS_POINTS;
        bonus = null;
        Sound.play('coin');
      }
      if (bonus && !eatsBonus) {
        bonus.life--;
        if (bonus.life <= 0) bonus = null;
      }

      scoreStat.set(score);
      lengthStat.set(snake.length);
      draw();

      if (!food) {
        gameOver(null, true); // the board is full: a perfect game
        return;
      }
      schedule();
    }

    function gameOver(where, perfect) {
      state = 'over';
      runId++;
      lc.clearTimers();
      crashed = where;
      draw();
      paintPauseButton();

      var isNewBest = score > 0 && (best === null || score > best);
      if (isNewBest) {
        Storage.setBest(GAME_ID, bestKey(), { score: score });
        paintBest();
      }

      Sound.play(perfect ? 'best' : 'hit');
      var myRun = runId;
      lc.setTimeout(function () {
        if (myRun === runId && !perfect) Sound.play(isNewBest ? 'best' : 'lose');
      }, 260);

      var title = perfect ? 'You filled the board!' : isNewBest ? 'New best: ' + score + '!' : 'Game over';
      var text = 'Score ' + score + '. Length ' + snake.length + '.' + (best !== null && !isNewBest ? ' Your best is ' + best + '.' : '');
      showOverlay(title, text, 'Play again');
      status.textContent = 'Game over. You scored ' + score + '.';
    }

    /* ----- Input ----- */

    function isTyping(target) {
      var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    }

    function focusIsOnGame() {
      var active = document.activeElement;
      return !active || active === document.body || stage.contains(active);
    }

    lc.on(document, 'keydown', function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      var direction = KEYS[event.key];
      if (direction) {
        if (state !== 'running' && !focusIsOnGame()) return; // let the page scroll
        event.preventDefault();
        steer(direction);
        return;
      }
      if (event.key === ' ' || event.key === 'p' || event.key === 'P') {
        if (state === 'running') {
          event.preventDefault();
          pause();
        } else if (state === 'paused') {
          event.preventDefault();
          resume();
        } else if (event.key === ' ' && focusIsOnGame() && !(event.target && event.target.tagName === 'BUTTON')) {
          event.preventDefault();
          start();
        }
      }
    });

    // Swipe on the board (touch screens). A drag of 24px or more counts as a swipe.
    var swipeX = null;
    var swipeY = null;
    lc.on(wrap, 'pointerdown', function (event) {
      if (event.target.closest && event.target.closest('button')) return;
      swipeX = event.clientX;
      swipeY = event.clientY;
    });
    lc.on(wrap, 'pointermove', function (event) {
      if (swipeX === null) return;
      var dx = event.clientX - swipeX;
      var dy = event.clientY - swipeY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      swipeX = event.clientX;
      swipeY = event.clientY;
    });
    lc.on(window, 'pointerup', function () { swipeX = null; });
    lc.on(window, 'pointercancel', function () { swipeX = null; });

    // Pause automatically when the visitor switches tab or app.
    lc.on(document, 'visibilitychange', function () { if (document.hidden) pause(); });
    lc.on(window, 'blur', pause);
    lc.on(window, 'resize', resize);

    reset();
    resize();

    return { destroy: function () { runId++; lc.destroy(); } };
  });
})();
