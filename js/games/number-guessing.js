/* ==========================================================================
   PlayNova - Number Guessing
   Find the secret number using only "too high" and "too low" clues.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound; // shared sound effects (js/sound.js)

  var LEVELS = {
    easy: { label: 'Easy', min: 1, max: 50 },
    medium: { label: 'Medium', min: 1, max: 100 },
    hard: { label: 'Hard', min: 1, max: 500 }
  };

  /** The most guesses a perfect player ever needs: cut the range in half every time. */
  function smartLimit(config) {
    return Math.ceil(Math.log(config.max - config.min + 1) / Math.LN2);
  }

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'number-guessing';
    var lc = Lifecycle.create();

    var level = 'easy';
    var secret = 0;
    var low = 1; // the secret is at least this
    var high = 50; // ...and at most this
    var guesses = [];
    var won = false;

    /* ----- Build the screen ----- */

    var attemptsStat = D.stat('Attempts', '0');
    var limitStat = D.stat('Smart limit', '-');
    var bestStat = D.stat('Fewest guesses', '-');

    var levelPicker = D.segmented(
      'Difficulty',
      Object.keys(LEVELS).map(function (key) { return { value: key, label: LEVELS[key].label }; }),
      level,
      function (value) { newRound(value); }
    );

    var rangeText = D.el('p', { class: 'range-bar' });

    var input = D.el('input', {
      class: 'guess-input',
      attrs: { id: 'guess-input', type: 'number', inputmode: 'numeric', step: '1', autocomplete: 'off', 'aria-describedby': 'guess-status' }
    });
    var label = D.el('label', { attrs: { for: 'guess-input' } });
    var submitButton = D.el('button', { class: 'btn btn-primary', text: 'Guess', attrs: { type: 'submit' } });
    var form = D.el('form', { class: 'guess-form', attrs: { novalidate: true } }, [
      D.el('div', { class: 'field' }, [label, input]),
      submitButton
    ]);

    var status = D.el('p', { class: 'status-line', attrs: { id: 'guess-status', role: 'status', 'aria-live': 'polite' } });
    var history = D.el('ol', { class: 'history', attrs: { 'aria-label': 'Your guesses' } });

    var resultTitle = D.el('h2');
    var resultText = D.el('p');
    var againButton = D.el('button', {
      class: 'btn btn-primary',
      text: 'New round',
      attrs: { type: 'button' },
      on: { click: function () { newRound(level); } }
    });
    var resultCard = D.el('div', { class: 'result-card', attrs: { hidden: true } }, [resultTitle, resultText, againButton]);

    var restartButton = D.el('button', {
      class: 'btn btn-ghost btn-small',
      text: 'New round',
      attrs: { type: 'button' },
      on: { click: function () { newRound(level); } }
    });

    root.appendChild(D.el('div', { class: 'controls', attrs: { style: 'margin:0 0 16px' } }, [levelPicker.root]));
    root.appendChild(D.statsBar([attemptsStat, limitStat, bestStat]));
    root.appendChild(rangeText);
    root.appendChild(form);
    root.appendChild(status);
    root.appendChild(history);
    root.appendChild(resultCard);
    root.appendChild(D.el('div', { class: 'controls' }, [restartButton]));

    /* ----- Helpers ----- */

    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'status-line' + (kind ? ' is-' + kind : '');
    }

    function paintRange() {
      rangeText.textContent = 'The number is between ' + low + ' and ' + high + '.';
    }

    function paintBest() {
      var best = Storage.numberFrom(Storage.getBest(GAME_ID, level), 'attempts');
      bestStat.set(best === null ? '-' : best);
    }

    function addChip(text, kind) {
      history.appendChild(D.el('li', { class: 'guess-chip is-' + kind, text: text }));
    }

    /* ----- Game flow ----- */

    function newRound(nextLevel) {
      lc.clearTimers();
      level = nextLevel;
      levelPicker.set(level);
      var config = LEVELS[level];

      secret = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
      low = config.min;
      high = config.max;
      guesses = [];
      won = false;

      label.textContent = 'Your guess (' + config.min + ' to ' + config.max + ')';
      input.min = String(config.min);
      input.max = String(config.max);
      input.value = '';
      input.disabled = false;
      submitButton.removeAttribute('aria-disabled');

      attemptsStat.set('0');
      limitStat.set(smartLimit(config));
      paintBest();
      paintRange();
      D.clear(history);
      resultCard.hidden = true;
      setStatus('Type a number and press Guess.');
    }

    function winRound() {
      won = true;
      input.disabled = true;
      submitButton.setAttribute('aria-disabled', 'true');

      var attempts = guesses.length;
      var previousBest = Storage.numberFrom(Storage.getBest(GAME_ID, level), 'attempts');
      var isNewBest = previousBest === null || attempts < previousBest;
      if (isNewBest) Storage.setBest(GAME_ID, level, { attempts: attempts });
      paintBest();

      var limit = smartLimit(LEVELS[level]);
      resultTitle.textContent = 'You found it: ' + secret + '!';
      resultText.textContent =
        'It took you ' + attempts + (attempts === 1 ? ' guess. ' : ' guesses. ') +
        (attempts <= limit ? 'That is within the smart limit of ' + limit + '.' : 'A perfect player needs at most ' + limit + '.') +
        (isNewBest ? ' New best!' : '');
      resultCard.hidden = false;
      setStatus('Correct! The number was ' + secret + '.', 'good');
      Sound.play(isNewBest ? 'best' : 'win');
      againButton.focus();
    }

    function handleGuess(event) {
      event.preventDefault();
      if (won) return;

      var config = LEVELS[level];
      var raw = input.value.trim();
      var message = 'Enter a whole number from ' + config.min + ' to ' + config.max + '.';

      if (!/^\d+$/.test(raw)) {
        Sound.play('bad');
        setStatus(message, 'bad');
        input.focus();
        return;
      }
      var guess = parseInt(raw, 10);
      if (guess < config.min || guess > config.max) {
        Sound.play('bad');
        setStatus(message, 'bad');
        input.focus();
        return;
      }
      if (guesses.indexOf(guess) !== -1) {
        Sound.play('bad');
        setStatus('You already tried ' + guess + '. Pick a different number.', 'bad');
        input.select();
        return;
      }

      guesses.push(guess);
      attemptsStat.set(guesses.length);
      input.value = '';

      if (guess === secret) {
        addChip(guess + ': correct', 'win');
        winRound();
        return;
      }

      if (guess < secret) {
        low = Math.max(low, guess + 1);
        addChip(guess + ': too low', 'low');
        Sound.play('up');
        setStatus(guess + ' is too low.', 'bad');
      } else {
        high = Math.min(high, guess - 1);
        addChip(guess + ': too high', 'high');
        Sound.play('down');
        setStatus(guess + ' is too high.', 'bad');
      }
      paintRange();
      input.focus();
    }

    lc.on(form, 'submit', handleGuess);

    newRound('easy');

    return { destroy: function () { lc.destroy(); } };
  });
})();
