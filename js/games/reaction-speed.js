/* ==========================================================================
   PlayNova - Reaction Speed Test
   Wait for the pad to turn green, then react as fast as you can.

   States:  idle -> waiting -> ready -> result -> (waiting ...)
                      \-> locked (false start penalty) -> early
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound; // shared sound effects (js/sound.js)

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'reaction-speed';
    var MIN_WAIT_MS = 1500;
    var MAX_WAIT_MS = 4500;
    var PENALTY_MS = 1000; // how long the pad is locked after a false start
    var KEEP_LAST = 5;

    var lc = Lifecycle.create();

    var state = 'idle';
    var signalTime = 0;
    var recent = []; // last few valid reaction times
    var falseStarts = 0;
    var bestMs = Storage.numberFrom(Storage.getBest(GAME_ID), 'ms');

    /* ----- Build the screen ----- */

    var lastStat = D.stat('Last');
    var averageStat = D.stat('Average');
    var bestStat = D.stat('Best', bestMs === null ? '-' : bestMs + ' ms');
    var falseStat = D.stat('False starts', '0');

    var pad = D.el('button', { class: 'reaction-pad', attrs: { type: 'button', 'data-state': 'idle' } });
    var padTitle = D.el('span');
    var padSub = D.el('small');
    pad.appendChild(padTitle);
    pad.appendChild(padSub);

    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });
    var history = D.el('ol', { class: 'history', attrs: { 'aria-label': 'Your last results' } });

    var resetButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'Reset session',
      attrs: { type: 'button' },
      on: { click: resetSession }
    });

    root.appendChild(D.statsBar([lastStat, averageStat, bestStat, falseStat]));
    root.appendChild(pad);
    root.appendChild(status);
    root.appendChild(history);
    root.appendChild(D.el('div', { class: 'controls' }, [resetButton]));
    root.appendChild(D.el('p', {
      class: 'note',
      text: 'Results are approximate. Your screen, device and browser add a small delay, so compare your own scores over time.'
    }));

    function setPad(name, title, sub) {
      pad.setAttribute('data-state', name); // the data-state attribute drives the colours in games.css
      padTitle.textContent = title;
      padSub.textContent = sub || '';
    }

    /* ----- Game flow ----- */

    function showIdle() {
      state = 'idle';
      pad.removeAttribute('aria-disabled');
      setPad('idle', 'Press to start', 'Then wait for green');
    }

    function startRound() {
      state = 'waiting';
      setPad('waiting', 'Wait for green...', 'Do not click yet');
      Sound.play('tap2');
      status.textContent = '';
      status.className = 'status-line';
      var delay = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
      lc.setTimeout(showSignal, delay);
    }

    function showSignal() {
      state = 'ready';
      signalTime = performance.now();
      setPad('ready', 'Click now!', '');
      Sound.play('go');
    }

    function recordReaction() {
      var ms = Math.round(performance.now() - signalTime);
      state = 'result';

      recent.push(ms);
      if (recent.length > KEEP_LAST) recent.shift();

      var isNewBest = bestMs === null || ms < bestMs;
      if (isNewBest) {
        bestMs = ms;
        Storage.setBest(GAME_ID, null, { ms: ms });
        bestStat.set(ms + ' ms');
      }

      Sound.play(isNewBest ? 'best' : 'good');
      lastStat.set(ms + ' ms');
      averageStat.set(average() + ' ms');
      renderHistory();

      setPad('result', ms + ' ms', isNewBest ? 'New best! Press to go again' : 'Press to go again');
      status.textContent = 'Your reaction time was ' + ms + ' milliseconds.' + (isNewBest ? ' That is a new best.' : '');
      status.className = 'status-line is-good';
    }

    function falseStart() {
      lc.clearTimers(); // the green signal must not fire any more
      falseStarts++;
      falseStat.set(falseStarts);
      Sound.play('bad');
      state = 'locked';
      pad.setAttribute('aria-disabled', 'true');
      setPad('early', 'Too early!', 'Penalty: locked for 1 second');
      status.textContent = 'Too early. Wait until the pad turns green.';
      status.className = 'status-line is-bad';

      lc.setTimeout(function () {
        state = 'early';
        pad.removeAttribute('aria-disabled');
        setPad('early', 'Too early!', 'Press to try again');
      }, PENALTY_MS);
    }

    function average() {
      if (!recent.length) return 0;
      var sum = recent.reduce(function (a, b) { return a + b; }, 0);
      return Math.round(sum / recent.length);
    }

    function renderHistory() {
      D.clear(history);
      recent.forEach(function (ms) {
        history.appendChild(D.el('li', { text: ms + ' ms' }));
      });
    }

    function resetSession() {
      lc.clearTimers();
      recent = [];
      falseStarts = 0;
      lastStat.set('-');
      averageStat.set('-');
      falseStat.set('0');
      renderHistory();
      status.textContent = 'Session reset. Your best time is kept.';
      status.className = 'status-line';
      showIdle();
    }

    /* ----- Input: mouse, touch and keyboard ----- */

    function handleInput() {
      if (state === 'idle' || state === 'result' || state === 'early') startRound();
      else if (state === 'waiting') falseStart();
      else if (state === 'ready') recordReaction();
      // 'locked' (penalty) ignores input
    }

    // pointerdown fires the instant you touch or press, which gives the most accurate time.
    lc.on(pad, 'pointerdown', function (event) {
      if (event.button > 0) return; // ignore right/middle click
      event.preventDefault();
      handleInput();
    });

    // Keyboard: Space or Enter. Held-down keys repeat, so ignore repeats.
    lc.on(pad, 'keydown', function (event) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) handleInput();
    });

    showIdle();
    renderHistory();

    return { destroy: function () { lc.destroy(); } };
  });
})();
