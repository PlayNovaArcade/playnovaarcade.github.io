/* ==========================================================================
   PlayNova - sound.js
   Small, original sound effects for every game, made live in the browser
   with the Web Audio API. There are no sound files to download.

   - Sounds only ever play right after something the player did (a click,
     a tap, a key press, or the game they started). Nothing plays on page load.
   - One setting controls every game. Players switch it with the Sound button
     on each game page, or the M key. The choice is saved in this browser.
   - If the browser has no Web Audio, or it fails, games simply stay silent.

   Use in a game:   PlayNovaSound.play('win');
                    PlayNovaSound.play('merge', 64);   // some sounds take a number
                    PlayNovaSound.tone(440, 200);       // a plain musical note
   ========================================================================== */
(function () {
  'use strict';

  var Storage = window.PlayNovaStorage;
  var D = window.PlayNovaDom;

  var MAX_VOICES = 24; // stops very fast clicking from piling up hundreds of sounds
  var context = null;
  var master = null;
  var noiseBuffer = null;
  var unlocked = false; // browsers only allow audio after the visitor interacts
  var voices = 0;
  var on = Storage.getSetting('sound', true) !== false; // on unless the player turned it off

  function getContext() {
    if (!on || !unlocked) return null;
    try {
      if (!context) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0.55;
        master.connect(context.destination);
      }
      if (context.state === 'suspended' && context.resume) context.resume();
      return context;
    } catch (error) {
      return null;
    }
  }

  // The first click, tap or key press anywhere on the page unlocks audio.
  function unlock() {
    unlocked = true;
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown', unlock, true);
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  /** One short note. at/dur are in seconds; slideTo bends the pitch. */
  function note(frequency, at, dur, type, volume, slideTo) {
    var c = context;
    if (voices >= MAX_VOICES) return;
    var start = c.currentTime + (at || 0);
    var oscillator = c.createOscillator();
    var gain = c.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.15, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    oscillator.connect(gain);
    gain.connect(master);
    voices++;
    oscillator.onended = function () { voices = Math.max(0, voices - 1); };
    oscillator.start(start);
    oscillator.stop(start + dur + 0.03);
  }

  /** A short burst of noise, for bumps and crashes. */
  function noise(at, dur, volume, filterFrequency) {
    var c = context;
    if (voices >= MAX_VOICES) return;
    if (!noiseBuffer) {
      noiseBuffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate);
      var data = noiseBuffer.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    var start = c.currentTime + (at || 0);
    var source = c.createBufferSource();
    var filter = c.createBiquadFilter();
    var gain = c.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency || 1200;
    gain.gain.setValueAtTime(volume || 0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    voices++;
    source.onended = function () { voices = Math.max(0, voices - 1); };
    source.start(start);
    source.stop(start + dur + 0.03);
  }

  function arpeggio(frequencies, gap, dur, type, volume) {
    frequencies.forEach(function (f, i) {
      var last = i === frequencies.length - 1;
      note(f, i * gap, last ? dur * 2 : dur, type, volume);
    });
  }

  // Every named sound. "n" is an optional number some sounds use (combo, tile value...).
  var SOUNDS = {
    tap: function () { note(660, 0, 0.06, 'triangle', 0.14); },
    tap2: function () { note(495, 0, 0.07, 'triangle', 0.14); },
    click: function (n) { note(420 + Math.min(n || 0, 60) * 9, 0, 0.045, 'square', 0.05); },
    flip: function () { note(520, 0, 0.08, 'triangle', 0.12, 760); },
    start: function () { note(523, 0, 0.08, 'triangle', 0.15); note(784, 0.08, 0.13, 'triangle', 0.15); },
    go: function () { note(880, 0, 0.14, 'square', 0.08); note(1320, 0.03, 0.12, 'sine', 0.08); },
    tick: function () { note(1250, 0, 0.035, 'square', 0.04); },
    good: function () { note(660, 0, 0.09, 'triangle', 0.17); note(990, 0.08, 0.15, 'triangle', 0.17); },
    match: function () { note(784, 0, 0.08, 'triangle', 0.17); note(1175, 0.07, 0.18, 'triangle', 0.17); },
    up: function () { note(440, 0, 0.1, 'triangle', 0.14, 660); },
    down: function () { note(440, 0, 0.1, 'triangle', 0.14, 294); },
    miss: function () { note(320, 0, 0.14, 'triangle', 0.13, 200); },
    bad: function () { note(190, 0, 0.24, 'sawtooth', 0.1, 110); },
    draw: function () { note(440, 0, 0.15, 'triangle', 0.14); note(415, 0.15, 0.25, 'triangle', 0.14); },
    win: function () { arpeggio([523, 659, 784, 1047], 0.09, 0.15, 'triangle', 0.17); },
    best: function () { arpeggio([784, 988, 1175, 1568, 2093], 0.07, 0.12, 'square', 0.07); },
    lose: function () { arpeggio([392, 330, 262, 196], 0.14, 0.18, 'triangle', 0.16); },
    point: function () { note(880, 0, 0.06, 'square', 0.06); note(1320, 0.055, 0.1, 'square', 0.06); },
    coin: function () { note(988, 0, 0.06, 'square', 0.07); note(1319, 0.06, 0.22, 'square', 0.07); },
    eat: function (n) { var f = 330 + Math.min(n || 0, 40) * 8; note(f, 0, 0.09, 'square', 0.07, f * 2); },
    flap: function () { note(320, 0, 0.11, 'triangle', 0.13, 620); },
    hit: function () { noise(0, 0.18, 0.25, 900); note(150, 0, 0.3, 'sawtooth', 0.12, 55); },
    pop: function (n) { var f = 560 + Math.min(n || 0, 20) * 45; note(f, 0, 0.09, 'sine', 0.22, f * 0.45); },
    spike: function () { noise(0, 0.12, 0.2, 2400); note(220, 0, 0.2, 'square', 0.07, 140); },
    slide: function () { noise(0, 0.06, 0.06, 700); },
    merge: function (n) {
      var steps = Math.max(1, Math.round(Math.log(n || 4) / Math.LN2));
      var f = 196 * Math.pow(2, steps / 5);
      note(f, 0, 0.13, 'triangle', 0.16, f * 1.5);
    }
  };

  function play(name, n) {
    var c = getContext();
    if (!c || !SOUNDS[name]) return;
    try { SOUNDS[name](n); } catch (error) { /* sound is optional */ }
  }

  function tone(frequency, ms, type) {
    var c = getContext();
    if (!c) return;
    try { note(frequency, 0, Math.max(0.05, ms / 1000), type || 'sine', 0.2); } catch (error) { /* optional */ }
  }

  /* ---------- The on/off setting ---------- */

  function isOn() { return on; }

  function setOn(value) {
    on = !!value;
    Storage.setSetting('sound', on);
    try {
      document.dispatchEvent(new CustomEvent('playnova:sound-changed', { detail: { on: on } }));
    } catch (error) { /* very old browsers */ }
    if (on) play('tap'); // a little blip so the player hears it is on
  }

  function toggle() { setOn(!on); }

  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  /** A "Sound: On / Off" button that stays in sync with the setting. */
  function button() {
    var icon = D.el('span', { class: 'sound-icon' });
    var label = D.el('span');
    var node = D.el('button', {
      class: 'btn btn-ghost btn-small sound-toggle',
      attrs: { type: 'button', title: 'Sound on or off (M key)' },
      on: { click: toggle }
    }, [icon, label]);

    function paint() {
      D.clear(icon);
      icon.appendChild(D.svg(on ? ICON_ON : ICON_OFF));
      label.textContent = on ? 'Sound: On' : 'Sound: Off';
      node.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    document.addEventListener('playnova:sound-changed', paint);
    paint();
    return node;
  }

  window.PlayNovaSound = {
    play: play,
    tone: tone,
    isOn: isOn,
    setOn: setOn,
    toggle: toggle,
    button: button,
    names: Object.keys(SOUNDS)
  };
})();
