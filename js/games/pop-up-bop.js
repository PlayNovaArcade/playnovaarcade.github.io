/* ==========================================================================
   PlayNova - Pop-Up Bop
   Little critters pop out of nine holes. Bop them before they hide!
   Golden ones are worth 5. Spiky red ones cost you 3 points, so leave them.
   Hit in a row to build a combo multiplier (up to x4). 30 seconds a round.

   States:  idle -> countdown -> playing -> done
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound;

  var ROUND_MS = 30000;
  var HOLES = 9;
  var SPIKE_PENALTY = 3;
  var GOLD_POINTS = 5;

  // Three critters with clearly different shapes, so colour is never the only clue.
  var ART = {
    blip:
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<path d="M50 14v10" stroke="#b9cbff" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="12" r="5" fill="#ffc552"/>' +
      '<ellipse cx="50" cy="62" rx="36" ry="34" fill="#7aa2ff"/>' +
      '<ellipse cx="50" cy="70" rx="22" ry="18" fill="#a9c1ff"/>' +
      '<circle cx="37" cy="54" r="9" fill="#fff"/><circle cx="63" cy="54" r="9" fill="#fff"/>' +
      '<circle cx="39" cy="55" r="4.5" fill="#0a0f1f"/><circle cx="61" cy="55" r="4.5" fill="#0a0f1f"/>' +
      '<path d="M41 73q9 8 18 0" stroke="#0a0f1f" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '</svg>',
    gold:
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<path d="M28 30l8-16 14 12 14-12 8 16z" fill="#fff3c4" stroke="#b07a10" stroke-width="3" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="62" rx="36" ry="34" fill="#ffc552"/>' +
      '<path d="M50 70l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff3c4"/>' +
      '<circle cx="37" cy="54" r="8" fill="#fff"/><circle cx="63" cy="54" r="8" fill="#fff"/>' +
      '<circle cx="38" cy="55" r="4" fill="#3d2a00"/><circle cx="62" cy="55" r="4" fill="#3d2a00"/>' +
      '</svg>',
    spike:
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<path d="M50 6l8 18 16-10-2 19 19-2-11 16 14 10-18 4 6 18-17-8-7 18-8-17-16 9 5-18-18-5 15-10-10-16 19 3-1-19 15 11z" fill="#ff6b88"/>' +
      '<circle cx="50" cy="56" r="27" fill="#ff8aa1"/>' +
      '<path d="M32 44l14 6M68 44l-14 6" stroke="#2a0a12" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="40" cy="56" r="5" fill="#2a0a12"/><circle cx="60" cy="56" r="5" fill="#2a0a12"/>' +
      '<path d="M40 72q10-7 20 0" stroke="#2a0a12" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '</svg>'
  };

  var NAMES = { blip: 'critter, bop it', gold: 'golden critter, worth 5', spike: 'spiky critter, do not hit' };

  function lerp(a, b, t) { return a + (b - a) * t; }

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'pop-up-bop';
    var lc = Lifecycle.create();

    var state = 'idle';
    var runId = 0;
    var holes = []; // { button, critter, type, token, hit }
    var score = 0;
    var combo = 0;
    var bestCombo = 0;
    var bops = 0;
    var mistakes = 0;
    var startedAt = 0;
    var lastTick = 0;
    var best = Storage.numberFrom(Storage.getBest(GAME_ID), 'score');

    /* ----- Build the screen ----- */

    var scoreStat = D.stat('Score', '0');
    var timeStat = D.stat('Time', '30.0');
    var comboStat = D.stat('Combo', 'x1');
    var bestStat = D.stat('Best', best === null ? '-' : best);

    var grid = D.el('div', { class: 'bop-grid', attrs: { role: 'group', 'aria-label': 'Holes. Keys 1 to 9 bop them, top row is 1 2 3.' } });
    for (var i = 0; i < HOLES; i++) {
      (function (index) {
        var critter = D.el('span', { class: 'bop-critter' });
        var button = D.el('button', {
          class: 'bop-hole',
          attrs: { type: 'button', 'aria-label': 'Hole ' + (index + 1) + ': empty' }
        }, [
          D.el('span', { class: 'bop-pit', attrs: { 'aria-hidden': 'true' } }),
          critter,
          D.el('span', { class: 'bop-key', text: String(index + 1), attrs: { 'aria-hidden': 'true' } })
        ]);
        lc.on(button, 'pointerdown', function (event) {
          if (event.button > 0) return;
          event.preventDefault(); // react on touch-down: faster than waiting for "click"
          bop(index);
        });
        // Enter / Space on a focused hole, and screen readers, send a "click" with no
        // pointer (detail is 0). Mouse and touch were already handled on pointerdown.
        lc.on(button, 'click', function (event) {
          if (event.detail === 0) bop(index);
        });
        lc.on(button, 'keydown', function (event) {
          if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); // no auto-repeat
        });
        holes.push({ button: button, critter: critter, type: null, token: 0, hit: false });
        grid.appendChild(button);
      })(i);
    }

    var countdown = D.el('div', { class: 'bop-countdown', attrs: { 'aria-hidden': 'true', hidden: true } });
    var board = D.el('div', { class: 'bop-board' }, [grid, countdown]);

    var timeFill = D.el('div', { class: 'time-bar-fill' });
    var timeBar = D.el('div', { class: 'time-bar', attrs: { 'aria-hidden': 'true' } }, [timeFill]);
    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });

    var resultTitle = D.el('h2');
    var resultText = D.el('p');
    var againButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'Play again',
      attrs: { type: 'button' },
      on: { click: startRound }
    });
    var resultCard = D.el('div', { class: 'result-card', attrs: { hidden: true } }, [resultTitle, resultText, againButton]);

    var startButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'Start',
      attrs: { type: 'button' },
      on: { click: startRound }
    });

    root.appendChild(D.statsBar([scoreStat, timeStat, comboStat, bestStat]));
    root.appendChild(board);
    root.appendChild(timeBar);
    root.appendChild(status);
    root.appendChild(resultCard);
    root.appendChild(D.el('div', { class: 'controls' }, [startButton]));

    /* ----- Helpers ----- */

    function multiplier() { return Math.min(4, 1 + Math.floor(combo / 5)); }

    function progress() {
      return state === 'playing' ? Math.min(1, (performance.now() - startedAt) / ROUND_MS) : 0;
    }

    function setComboText() {
      comboStat.set('x' + multiplier());
    }

    function float(index, text, kind) {
      var pop = D.el('span', { class: 'bop-float is-' + kind, text: text, attrs: { 'aria-hidden': 'true' } });
      holes[index].button.appendChild(pop);
      lc.setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 650);
    }

    function show(index, type) {
      var hole = holes[index];
      hole.type = type;
      hole.hit = false;
      hole.token++;
      D.clear(hole.critter);
      hole.critter.appendChild(D.svg(ART[type]));
      hole.critter.className = 'bop-critter is-' + type;
      hole.button.classList.add('is-up');
      hole.button.classList.remove('is-hit');
      hole.button.setAttribute('aria-label', 'Hole ' + (index + 1) + ': ' + NAMES[type]);
      return hole.token;
    }

    function hide(index) {
      var hole = holes[index];
      hole.type = null;
      hole.token++;
      hole.button.classList.remove('is-up');
      hole.button.setAttribute('aria-label', 'Hole ' + (index + 1) + ': empty');
    }

    /* ----- Game flow ----- */

    function startRound() {
      lc.clearTimers();
      runId++;
      for (var h = 0; h < HOLES; h++) {
        hide(h);
        holes[h].button.classList.remove('is-hit');
      }
      score = 0;
      combo = 0;
      bestCombo = 0;
      bops = 0;
      mistakes = 0;
      scoreStat.set('0');
      timeStat.set((ROUND_MS / 1000).toFixed(1));
      timeFill.style.transform = 'scaleX(1)';
      setComboText();
      resultCard.hidden = true;
      startButton.textContent = 'Restart';
      state = 'countdown';
      status.textContent = 'Get ready...';

      var myRun = runId;
      var count = 3;
      function tick() {
        if (myRun !== runId) return;
        if (count > 0) {
          countdown.textContent = String(count);
          countdown.hidden = false;
          Sound.play('tick');
          count--;
          lc.setTimeout(tick, 600);
        } else {
          countdown.hidden = true;
          beginPlaying();
        }
      }
      tick();
    }

    function beginPlaying() {
      state = 'playing';
      startedAt = performance.now();
      lastTick = 0;
      status.textContent = 'Bop them!';
      Sound.play('go');
      lc.setInterval(updateTime, 100);
      lc.setTimeout(finish, ROUND_MS);
      spawnLoop(runId);
    }

    function spawnLoop(myRun) {
      if (myRun !== runId || state !== 'playing') return;
      var p = progress();
      var active = holes.filter(function (h) { return h.type; }).length;
      var maxActive = 1 + Math.floor(p * 2.5);
      if (active < maxActive) {
        var empty = [];
        holes.forEach(function (h, index) { if (!h.type) empty.push(index); });
        if (empty.length) {
          var index = empty[Math.floor(Math.random() * empty.length)];
          var roll = Math.random();
          var type = roll < 0.1 ? 'gold' : p > 0.12 && roll < 0.36 ? 'spike' : 'blip';
          var stay = lerp(1150, 640, p) * (type === 'gold' ? 0.75 : 1);
          var token = show(index, type);
          lc.setTimeout(function () { expire(index, token); }, stay);
        }
      }
      lc.setTimeout(function () { spawnLoop(myRun); }, lerp(800, 380, p));
    }

    function expire(index, token) {
      var hole = holes[index];
      if (hole.token !== token || !hole.type || hole.hit) return;
      if (hole.type !== 'spike' && state === 'playing') {
        combo = 0; // a critter got away
        setComboText();
      }
      hide(index);
    }

    function bop(index) {
      if (state !== 'playing') return;
      var hole = holes[index];

      if (!hole.type || hole.hit) {
        // Bopping an empty hole breaks the combo, so random mashing does not pay.
        combo = 0;
        mistakes++;
        setComboText();
        Sound.play('miss');
        return;
      }

      hole.hit = true;
      hole.button.classList.add('is-hit');

      if (hole.type === 'spike') {
        score = Math.max(0, score - SPIKE_PENALTY);
        combo = 0;
        mistakes++;
        Sound.play('spike');
        float(index, '-' + SPIKE_PENALTY, 'bad');
      } else {
        var points = (hole.type === 'gold' ? GOLD_POINTS : 1) * multiplier();
        score += points;
        combo++;
        bops++;
        bestCombo = Math.max(bestCombo, combo);
        Sound.play(hole.type === 'gold' ? 'coin' : 'pop', combo);
        float(index, '+' + points, hole.type === 'gold' ? 'gold' : 'good');
      }
      scoreStat.set(score);
      setComboText();

      var token = hole.token;
      lc.setTimeout(function () {
        if (holes[index].token === token) hide(index);
      }, 170);
    }

    function updateTime() {
      if (state !== 'playing') return;
      var left = Math.max(0, ROUND_MS - (performance.now() - startedAt));
      timeStat.set((left / 1000).toFixed(1));
      timeFill.style.transform = 'scaleX(' + (left / ROUND_MS).toFixed(3) + ')';
      var whole = Math.ceil(left / 1000);
      if (whole <= 3 && whole > 0 && whole !== lastTick) {
        lastTick = whole;
        Sound.play('tick'); // final countdown
      }
    }

    function finish() {
      if (state !== 'playing') return;
      state = 'done';
      lc.clearTimers();
      runId++;
      for (var h = 0; h < HOLES; h++) hide(h);
      timeStat.set('0.0');
      timeFill.style.transform = 'scaleX(0)';

      var isNewBest = score > 0 && (best === null || score > best);
      if (isNewBest) {
        best = score;
        Storage.setBest(GAME_ID, null, { score: score });
        bestStat.set(best);
      }
      var tries = bops + mistakes;
      var accuracy = tries ? Math.round((bops / tries) * 100) : 0;

      Sound.play(isNewBest ? 'best' : 'win');
      resultTitle.textContent = isNewBest ? 'New best: ' + score + '!' : "Time's up! Score: " + score;
      resultText.textContent = bops + ' bops, best combo ' + bestCombo + ', accuracy ' + accuracy + '%.' + (best !== null && !isNewBest ? ' Your best is ' + best + '.' : '');
      resultCard.hidden = false;
      startButton.textContent = 'Start';
      status.textContent = "Time's up! You scored " + score + '.';
      againButton.focus();
    }

    /* ----- Keyboard: 1 to 9 ----- */

    lc.on(document, 'keydown', function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      var tag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      var n = parseInt(event.key, 10);
      if (n >= 1 && n <= 9 && state === 'playing') {
        event.preventDefault();
        bop(n - 1);
      }
    });

    status.textContent = 'Press Start. You have 30 seconds.';

    return { destroy: function () { runId++; lc.destroy(); } };
  });
})();
