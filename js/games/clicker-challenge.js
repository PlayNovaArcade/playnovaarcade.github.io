/* ==========================================================================
   PlayNova - Clicker Challenge
   Click or tap as many times as you can in 15 seconds.

   States:  idle -> running -> done
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound; // shared sound effects (js/sound.js)

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'clicker-challenge';
    var DURATION_MS = 15000;
    var TICK_MS = 100;

    var lc = Lifecycle.create();

    var state = 'idle';
    var clicks = 0;
    var startedAt = 0;
    var bestClicks = Storage.numberFrom(Storage.getBest(GAME_ID), 'clicks');

    /* ----- Build the screen ----- */

    var clicksStat = D.stat('Clicks', '0');
    var timeStat = D.stat('Time left', (DURATION_MS / 1000).toFixed(1));
    var bestStat = D.stat('Best', bestClicks === null ? '-' : bestClicks);

    var pad = D.el('button', { class: 'click-pad', attrs: { type: 'button' } });
    var timeFill = D.el('div', { class: 'time-bar-fill' });
    var timeBar = D.el('div', { class: 'time-bar', attrs: { 'aria-hidden': 'true' } }, [timeFill]);

    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });

    var resultTitle = D.el('h2');
    var resultText = D.el('p');
    var againButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'Play again',
      attrs: { type: 'button' },
      on: { click: reset }
    });
    var resultCard = D.el('div', { class: 'result-card', attrs: { hidden: true } }, [resultTitle, resultText, againButton]);

    var restartButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'Restart',
      attrs: { type: 'button' },
      on: { click: reset }
    });

    root.appendChild(D.statsBar([clicksStat, timeStat, bestStat]));
    root.appendChild(D.el('div', { class: 'click-stage' }, [pad]));
    root.appendChild(timeBar);
    root.appendChild(status);
    root.appendChild(resultCard);
    root.appendChild(D.el('div', { class: 'controls' }, [restartButton]));

    /* ----- Helpers ----- */

    function remainingMs() {
      return Math.max(0, DURATION_MS - (performance.now() - startedAt));
    }

    function paintPad() {
      if (state === 'idle') pad.textContent = 'Tap to start';
      else if (state === 'running') pad.textContent = String(clicks);
      else pad.textContent = "Time's up!";
      if (state === 'done') pad.setAttribute('aria-disabled', 'true');
      else pad.removeAttribute('aria-disabled');
      pad.setAttribute('aria-label', state === 'running' ? 'Click. Clicks so far: ' + clicks : pad.textContent);
    }

    function paintTime() {
      var left = state === 'running' ? remainingMs() : state === 'done' ? 0 : DURATION_MS;
      timeStat.set((left / 1000).toFixed(1));
      timeFill.style.transform = 'scaleX(' + (left / DURATION_MS).toFixed(3) + ')';
    }

    /* ----- Game flow ----- */

    function start() {
      state = 'running';
      clicks = 0;
      startedAt = performance.now();
      status.textContent = 'Go! Keep clicking.';
      Sound.play('go');
      lc.setInterval(function () {
        paintTime();
      }, TICK_MS);
      lc.setTimeout(finish, DURATION_MS); // the hard stop
    }

    function registerClick() {
      if (state === 'done') return;
      if (state === 'idle') start();

      // Double-check the clock so a late timer can never let extra clicks through.
      if (remainingMs() <= 0) {
        finish();
        return;
      }
      clicks++;
      clicksStat.set(clicks);
      Sound.play('click', clicks % 60);
      paintPad();
    }

    function finish() {
      if (state !== 'running') return;
      state = 'done';
      lc.clearTimers();
      paintTime();
      paintPad();

      var perSecond = (clicks / (DURATION_MS / 1000)).toFixed(1);
      var isNewBest = bestClicks === null || clicks > bestClicks;
      if (isNewBest && clicks > 0) {
        bestClicks = clicks;
        Storage.setBest(GAME_ID, null, { clicks: clicks });
        bestStat.set(clicks);
      }

      resultTitle.textContent = isNewBest && clicks > 0 ? 'New best: ' + clicks + ' clicks!' : clicks + ' clicks';
      resultText.textContent = 'That is ' + perSecond + ' clicks per second over ' + DURATION_MS / 1000 + ' seconds.';
      resultCard.hidden = false;
      status.textContent = "Time's up! You clicked " + clicks + ' times.';
      Sound.play(isNewBest && clicks > 0 ? 'best' : 'win');
      againButton.focus();
    }

    function reset() {
      lc.clearTimers();
      state = 'idle';
      clicks = 0;
      clicksStat.set('0');
      resultCard.hidden = true;
      status.textContent = '';
      paintPad();
      paintTime();
      pad.focus();
    }

    /* ----- Input ----- */

    // One "click" event covers mouse, touch and keyboard (Enter / Space).
    lc.on(pad, 'click', registerClick);

    // Holding Enter would repeat clicks automatically, so block key-repeat.
    lc.on(pad, 'keydown', function (event) {
      if (event.repeat) event.preventDefault();
    });

    paintPad();
    paintTime();

    return { destroy: function () { lc.destroy(); } };
  });
})();
