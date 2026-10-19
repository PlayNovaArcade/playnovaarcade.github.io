/* ==========================================================================
   PlayNova - lifecycle.js
   Keeps track of every timer and event listener a game creates, so they can
   all be switched off in one call.

   Why: if a game starts a timer every time you press "Restart" and never stops
   the old one, timers pile up and the game starts behaving strangely.
   Games use this helper instead of calling setTimeout / addEventListener
   directly, which makes "restart" and "leave the page" safe.
   ========================================================================== */
(function () {
  'use strict';

  function create() {
    var timeouts = [];
    var intervals = [];
    var listeners = [];

    return {
      setTimeout: function (fn, ms) {
        var id = window.setTimeout(function () {
          var index = timeouts.indexOf(id);
          if (index !== -1) timeouts.splice(index, 1);
          fn();
        }, ms);
        timeouts.push(id);
        return id;
      },

      setInterval: function (fn, ms) {
        var id = window.setInterval(fn, ms);
        intervals.push(id);
        return id;
      },

      clearTimeout: function (id) {
        window.clearTimeout(id);
        var index = timeouts.indexOf(id);
        if (index !== -1) timeouts.splice(index, 1);
      },

      clearInterval: function (id) {
        window.clearInterval(id);
        var index = intervals.indexOf(id);
        if (index !== -1) intervals.splice(index, 1);
      },

      /** Stop every running timer (use this inside "restart"). */
      clearTimers: function () {
        timeouts.forEach(function (id) { window.clearTimeout(id); });
        intervals.forEach(function (id) { window.clearInterval(id); });
        timeouts.length = 0;
        intervals.length = 0;
      },

      /** Add an event listener that will be removed automatically by destroy(). */
      on: function (target, type, handler, options) {
        target.addEventListener(type, handler, options);
        listeners.push({ target: target, type: type, handler: handler, options: options });
      },

      /** Stop all timers and remove all listeners (use this when the game is closed). */
      destroy: function () {
        this.clearTimers();
        listeners.forEach(function (l) {
          l.target.removeEventListener(l.type, l.handler, l.options);
        });
        listeners.length = 0;
      }
    };
  }

  window.PlayNovaLifecycle = { create: create };
})();
