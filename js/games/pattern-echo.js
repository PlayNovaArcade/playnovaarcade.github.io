/* ==========================================================================
   PlayNova - Pattern Echo
   Watch the pattern, then repeat it. Every round adds one more step.

   Phases:  idle -> showing -> input -> (showing ... ) -> over
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;

  // Each pad has its own shape and number, so colour is never the only clue.
  var PADS = [
    { name: 'circle', key: '1', tone: 262, svg: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="#0a0f1f"/></svg>' },
    { name: 'triangle', key: '2', tone: 330, svg: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3l9.5 17h-19z" fill="#0a0f1f"/></svg>' },
    { name: 'square', key: '3', tone: 392, svg: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="#0a0f1f"/></svg>' },
    { name: 'diamond', key: '4', tone: 523, svg: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2l9 10-9 10-9-10z" fill="#0a0f1f"/></svg>' }
  ];

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'pattern-echo';
    var lc = Lifecycle.create();

    var phase = 'idle';
    var sequence = [];
    var playerIndex = 0;
    var runId = 0; // changes on every restart, so old timers from a previous game do nothing
    var best = Storage.numberFrom(Storage.getBest(GAME_ID), 'rounds');
    var Sound = window.PlayNovaSound; // shared sound effects (js/sound.js)

    /* ----- Build the screen ----- */

    var roundStat = D.stat('Round', '0');
    var bestStat = D.stat('Best round', best === null ? '-' : best);

    var padButtons = PADS.map(function (pad, index) {
      var button = D.el('button', {
        class: 'echo-pad',
        attrs: { type: 'button', 'aria-label': 'Pad ' + pad.key + ': ' + pad.name, 'aria-disabled': 'true' }
      }, [D.svg(pad.svg), D.el('span', { class: 'echo-pad-key', text: pad.key, attrs: { 'aria-hidden': 'true' } })]);
      button.addEventListener('click', function () { press(index); });
      return button;
    });
    var board = D.el('div', { class: 'echo-board', attrs: { role: 'group', 'aria-label': 'Pattern pads' } }, padButtons);

    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });

    var startButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'Start',
      attrs: { type: 'button' },
      on: { click: startGame }
    });
    var resultTitle = D.el('h2');
    var resultText = D.el('p');
    var againButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'Play again',
      attrs: { type: 'button' },
      on: { click: startGame }
    });
    var resultCard = D.el('div', { class: 'result-card', attrs: { hidden: true } }, [resultTitle, resultText, againButton]);

    root.appendChild(D.statsBar([roundStat, bestStat]));
    root.appendChild(board);
    root.appendChild(status);
    root.appendChild(resultCard);
    root.appendChild(D.el('div', { class: 'controls' }, [startButton]));
    root.appendChild(D.el('p', {
      class: 'note',
      text: 'Keys 1 to 4 also press the pads. Each pad plays its own note.'
    }));

    /* ----- Helpers ----- */

    function setPadsActive(active) {
      padButtons.forEach(function (button) {
        if (active) button.removeAttribute('aria-disabled');
        else button.setAttribute('aria-disabled', 'true');
      });
      board.classList.toggle('is-listening', active);
    }

    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'status-line' + (kind ? ' is-' + kind : '');
    }

    function light(index, ms) {
      var button = padButtons[index];
      button.classList.add('is-lit');
      Sound.tone(PADS[index].tone, ms);
      lc.setTimeout(function () {
        button.classList.remove('is-lit');
      }, ms);
    }

    /* ----- Game flow ----- */

    function startGame() {
      lc.clearTimers(); // stop anything left over from the previous game
      runId++;
      sequence = [];
      playerIndex = 0;
      phase = 'showing';
      resultCard.hidden = true;
      startButton.textContent = 'Restart';
      nextRound();
    }

    function nextRound() {
      var myRun = runId;
      sequence.push(Math.floor(Math.random() * PADS.length));
      roundStat.set(sequence.length);
      phase = 'showing';
      playerIndex = 0;
      setPadsActive(false);
      setStatus('Watch the pattern...');

      // The pattern plays a little faster as the game goes on.
      var stepMs = Math.max(320, 650 - (sequence.length - 1) * 20);
      var step = 0;

      function playNext() {
        if (myRun !== runId) return;
        if (step >= sequence.length) {
          phase = 'input';
          playerIndex = 0;
          setPadsActive(true);
          setStatus('Your turn: repeat the pattern.');
          return;
        }
        light(sequence[step], Math.round(stepMs * 0.6));
        step++;
        lc.setTimeout(playNext, stepMs);
      }

      lc.setTimeout(playNext, 700);
    }

    function press(index) {
      if (phase !== 'input') return;
      light(index, 180);

      if (index !== sequence[playerIndex]) {
        gameOver();
        return;
      }

      playerIndex++;
      if (playerIndex === sequence.length) {
        phase = 'showing'; // blocks input until the next pattern has played
        setPadsActive(false);
        var completed = sequence.length;
        if (best === null || completed > best) {
          best = completed;
          Storage.setBest(GAME_ID, null, { rounds: completed });
          bestStat.set(completed);
        }
        setStatus('Nice! Round ' + completed + ' complete.', 'good');
        lc.setTimeout(function () { Sound.play('good'); }, 200);
        var myRun = runId;
        lc.setTimeout(function () {
          if (myRun === runId) nextRound();
        }, 900);
      }
    }

    function gameOver() {
      phase = 'over';
      setPadsActive(false);
      Sound.play('bad');
      lc.setTimeout(function () { Sound.play('lose'); }, 250);

      var completed = sequence.length - 1;
      setStatus('Wrong pad. Game over.', 'bad');
      resultTitle.textContent = completed === 0 ? 'Almost!' : 'You completed ' + completed + (completed === 1 ? ' round' : ' rounds');
      resultText.textContent = best !== null ? 'Your best is ' + best + (best === 1 ? ' round.' : ' rounds.') : 'Try again to set a best.';
      resultCard.hidden = false;
      startButton.textContent = 'Start';
      againButton.focus();
    }

    /* ----- Keyboard: keys 1 to 4 ----- */

    lc.on(document, 'keydown', function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      var target = event.target;
      var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return; // do not steal typing
      var index = PADS.findIndex(function (pad) { return pad.key === event.key; });
      if (index !== -1) press(index);
    });

    setPadsActive(false);
    setStatus('Press Start to begin.');

    return { destroy: function () { lc.destroy(); } };
  });
})();
