/* ==========================================================================
   PlayNova - storage.js
   Everything PlayNova remembers lives in the visitor's own browser
   (localStorage). Nothing is sent to a server.

   What is stored (all under the "playnova:v1:" prefix):
     favorites      list of game ids the visitor hearted
     recent         list of game ids, most recent first
     plays          how many times each game was opened on this device
     best:<game>    best score for each game
     setting:sound  whether game sound effects are on (all games)

   Safety: localStorage can be blocked (private mode) or contain junk if
   someone edits it by hand. Every read below is checked, and falls back to a
   sensible default instead of crashing.
   ========================================================================== */
(function () {
  'use strict';

  var PREFIX = 'playnova:v1:';
  var MAX_RECENT = 8;
  var memory = {}; // used only if localStorage is not available
  var storage = null;

  try {
    storage = window.localStorage;
    storage.setItem(PREFIX + 'probe', '1');
    storage.removeItem(PREFIX + 'probe');
  } catch (error) {
    storage = null;
  }

  function rawGet(key) {
    try {
      if (storage) return storage.getItem(PREFIX + key);
    } catch (error) { /* fall through to memory */ }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
  }

  function rawSet(key, text) {
    try {
      if (storage) {
        storage.setItem(PREFIX + key, text);
        return;
      }
    } catch (error) { /* quota or privacy mode: keep it in memory instead */ }
    memory[key] = text;
  }

  function readJSON(key, fallback, isValid) {
    var text = rawGet(key);
    if (text === null || text === undefined) return fallback;
    try {
      var value = JSON.parse(text);
      return !isValid || isValid(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    rawSet(key, JSON.stringify(value));
  }

  function isKnownGame(id) {
    var catalog = window.PlayNovaCatalog;
    return typeof id === 'string' && (!catalog || catalog.getById(id) !== null);
  }

  function cleanIdList(list) {
    var seen = {};
    return (Array.isArray(list) ? list : []).filter(function (id) {
      if (seen[id] || !isKnownGame(id)) return false;
      seen[id] = true;
      return true;
    });
  }

  function announce(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (error) { /* very old browsers: ignore */ }
  }

  /* ---------- Favorites ---------- */

  function getFavorites() {
    return cleanIdList(readJSON('favorites', [], Array.isArray));
  }

  function isFavorite(id) {
    return getFavorites().indexOf(id) !== -1;
  }

  /** Adds or removes a favorite and returns true if the game is now a favorite. */
  function toggleFavorite(id) {
    if (!isKnownGame(id)) return false;
    var list = getFavorites();
    var index = list.indexOf(id);
    if (index === -1) list.push(id);
    else list.splice(index, 1);
    writeJSON('favorites', list);
    announce('playnova:favorites-changed', { id: id });
    return index === -1;
  }

  /* ---------- Recently played and play counts ---------- */

  function getRecent() {
    return cleanIdList(readJSON('recent', [], Array.isArray)).slice(0, MAX_RECENT);
  }

  function addRecent(id) {
    if (!isKnownGame(id)) return;
    var list = getRecent().filter(function (existing) { return existing !== id; });
    list.unshift(id);
    writeJSON('recent', list.slice(0, MAX_RECENT));
  }

  function getPlayCounts() {
    var raw = readJSON('plays', {}, function (v) { return v && typeof v === 'object' && !Array.isArray(v); });
    var clean = {};
    Object.keys(raw).forEach(function (id) {
      var n = raw[id];
      if (isKnownGame(id) && typeof n === 'number' && isFinite(n) && n > 0) clean[id] = Math.floor(n);
    });
    return clean;
  }

  function incrementPlays(id) {
    if (!isKnownGame(id)) return;
    var counts = getPlayCounts();
    counts[id] = (counts[id] || 0) + 1;
    writeJSON('plays', counts);
  }

  /* ---------- Best scores ---------- */

  function bestKey(gameId, variant) {
    return 'best:' + gameId + (variant ? ':' + variant : '');
  }

  /** Returns the saved best result (a plain object) or null. */
  function getBest(gameId, variant) {
    return readJSON(bestKey(gameId, variant), null, function (v) {
      return v && typeof v === 'object' && !Array.isArray(v);
    });
  }

  function setBest(gameId, variant, value) {
    writeJSON(bestKey(gameId, variant), value);
  }

  /** Read a number from a saved best result, ignoring anything that is not a finite number. */
  function numberFrom(best, field) {
    return best && typeof best[field] === 'number' && isFinite(best[field]) ? best[field] : null;
  }

  /* ---------- Small settings ---------- */

  function getSetting(name, fallback) {
    return readJSON('setting:' + name, fallback);
  }

  function setSetting(name, value) {
    writeJSON('setting:' + name, value);
  }

  // If favorites change in another browser tab, tell this tab too.
  window.addEventListener('storage', function (event) {
    if (event.key === PREFIX + 'favorites') announce('playnova:favorites-changed', {});
  });

  window.PlayNovaStorage = {
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    getRecent: getRecent,
    addRecent: addRecent,
    getPlayCounts: getPlayCounts,
    incrementPlays: incrementPlays,
    getBest: getBest,
    setBest: setBest,
    numberFrom: numberFrom,
    getSetting: getSetting,
    setSetting: setSetting
  };
})();
