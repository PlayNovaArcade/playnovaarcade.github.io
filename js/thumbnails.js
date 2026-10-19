/* ==========================================================================
   PlayNova - thumbnails.js
   Original artwork for the game cards, drawn with SVG (no image files to
   download). The coloured gradient behind each picture comes from the
   catalogue (thumbA / thumbB) through CSS variables.

   These strings are written by us and never contain visitor input,
   so it is safe to place them in the page as markup.
   ========================================================================== */
(function () {
  'use strict';

  var HEAD = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">';
  var TAIL = '</svg>';

  // Simple 24x24 icon outlines reused by the memory-card art.
  var STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';
  var HEART = 'M12 20.5C5 16 2.5 12.2 2.5 8.8 2.5 6.1 4.5 4.2 7 4.2c1.9 0 3.7 1.1 5 3 1.3-1.9 3.1-3 5-3 2.5 0 4.5 1.9 4.5 4.6 0 3.4-2.5 7.2-9.5 11.7z';
  var BOLT = 'M13.5 2L4.5 13.5h6L9.5 22l9-12h-6z';

  function memoryCard(x, y, faceUp, iconPath, iconColor) {
    if (faceUp) {
      return '<rect x="' + x + '" y="' + y + '" width="60" height="72" rx="12" fill="#fff"/>' +
        '<path transform="translate(' + (x + 10) + ',' + (y + 16) + ') scale(1.7)" d="' + iconPath + '" fill="' + iconColor + '"/>';
    }
    return '<rect x="' + x + '" y="' + y + '" width="60" height="72" rx="12" fill="#fff" fill-opacity=".22" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>' +
      '<circle cx="' + (x + 30) + '" cy="' + (y + 36) + '" r="9" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>';
  }

  var art = {
    'reaction-speed':
      HEAD +
      '<circle cx="160" cy="100" r="70" fill="#04210f" fill-opacity=".28"/>' +
      '<circle cx="160" cy="100" r="55" fill="#34d399"/>' +
      '<path d="M170 58L140 106h19l-7 36 31-50h-19z" fill="#04210f"/>' +
      '<path d="M44 168h232" stroke="#fff" stroke-opacity=".55" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 15"/>' +
      '<path d="M44 34h52M224 34h52" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>' +
      TAIL,

    'memory-match':
      HEAD +
      memoryCard(48, 20, true, STAR, '#7a4dff') +
      memoryCard(130, 20, false) +
      memoryCard(212, 20, false) +
      memoryCard(48, 106, false) +
      memoryCard(130, 106, true, HEART, '#d6479b') +
      memoryCard(212, 106, true, BOLT, '#2f6bff') +
      TAIL,

    'number-guessing':
      HEAD +
      '<rect x="100" y="38" width="120" height="124" rx="28" fill="#fff" fill-opacity=".94"/>' +
      '<path d="M136 86c0-14 10-22 24-22s24 8 24 21c0 12-8 17-17 22-5 3-7 6-7 12" fill="none" stroke="#2f6bff" stroke-width="12" stroke-linecap="round"/>' +
      '<circle cx="160" cy="141" r="7.5" fill="#2f6bff"/>' +
      '<path d="M48 116l20-22 20 22" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M232 84l20 22 20-22" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
      TAIL,

    'tic-tac-toe':
      HEAD +
      '<path d="M130 20v160M190 20v160M80 70h160M80 130h160" stroke="#fff" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M86 26l28 28M114 26L86 54" stroke="#ff8ab3" stroke-width="10" stroke-linecap="round"/>' +
      '<circle cx="160" cy="100" r="17" fill="none" stroke="#7fe0ff" stroke-width="10"/>' +
      '<path d="M206 146l28 28M234 146l-28 28" stroke="#ff8ab3" stroke-width="10" stroke-linecap="round"/>' +
      '<circle cx="100" cy="160" r="17" fill="none" stroke="#7fe0ff" stroke-width="10"/>' +
      TAIL,

    'clicker-challenge':
      HEAD +
      '<circle cx="150" cy="96" r="78" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="5"/>' +
      '<circle cx="150" cy="96" r="58" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="5"/>' +
      '<circle cx="150" cy="96" r="38" fill="#fff" fill-opacity=".95"/>' +
      '<path d="M176 112v54l15-14 10 25 13-6-10-24 20-2z" fill="#0a0f1f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>' +
      TAIL,

    'snake-rush':
      HEAD +
      '<rect x="40" y="128" width="40" height="40" rx="12" fill="#7a4dff"/>' +
      '<rect x="84" y="128" width="40" height="40" rx="12" fill="#6a72f0"/>' +
      '<rect x="128" y="128" width="40" height="40" rx="12" fill="#5b9ae0"/>' +
      '<rect x="128" y="84" width="40" height="40" rx="12" fill="#4fc0d4"/>' +
      '<rect x="128" y="40" width="40" height="40" rx="12" fill="#55dcc4"/>' +
      '<rect x="172" y="38" width="44" height="44" rx="13" fill="#5ef0c8"/>' +
      '<circle cx="200" cy="52" r="6" fill="#fff"/><circle cx="200" cy="68" r="6" fill="#fff"/>' +
      '<circle cx="202" cy="52" r="3" fill="#0a0f1f"/><circle cx="202" cy="68" r="3" fill="#0a0f1f"/>' +
      '<circle cx="262" cy="60" r="17" fill="#ff6b88"/><circle cx="256" cy="54" r="5" fill="#fff" fill-opacity=".75"/>' +
      '<path d="M262 118l6 13 14 2-10 9 3 14-13-7-13 7 3-14-10-9 14-2z" fill="#ffc552"/>' +
      TAIL,

    'merge-tiles':
      HEAD +
      '<rect x="62" y="22" width="76" height="76" rx="14" fill="#34478c"/>' +
      '<rect x="146" y="22" width="76" height="76" rx="14" fill="#2a63f0"/>' +
      '<rect x="62" y="104" width="76" height="76" rx="14" fill="#7a4dff"/>' +
      '<rect x="146" y="104" width="76" height="76" rx="14" fill="#ffc552"/>' +
      '<g font-family="system-ui,sans-serif" font-weight="800" text-anchor="middle" fill="#fff">' +
      '<text x="100" y="72" font-size="36">4</text><text x="184" y="72" font-size="36">8</text>' +
      '<text x="100" y="154" font-size="34">32</text><text x="184" y="152" font-size="26" fill="#2b1d00">2048</text></g>' +
      '<path d="M236 60h36m-12-12l12 12-12 12" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      TAIL,

    'sky-hopper':
      HEAD +
      '<circle cx="40" cy="40" r="2" fill="#fff"/><circle cx="290" cy="28" r="2.5" fill="#fff"/><circle cx="250" cy="170" r="2" fill="#fff"/><circle cx="70" cy="160" r="1.8" fill="#fff"/>' +
      '<rect x="196" y="0" width="46" height="62" fill="#9b7bff"/><rect x="190" y="50" width="58" height="14" fill="#c9b6ff"/>' +
      '<rect x="196" y="140" width="46" height="60" fill="#9b7bff"/><rect x="190" y="138" width="58" height="14" fill="#c9b6ff"/>' +
      '<circle cx="84" cy="112" r="15" fill="#ff8a4c" fill-opacity=".35"/><circle cx="102" cy="108" r="19" fill="#ff8a4c" fill-opacity=".55"/>' +
      '<circle cx="126" cy="102" r="26" fill="#ffc552"/>' +
      '<ellipse cx="118" cy="108" rx="12" ry="7" fill="#ff8a4c" transform="rotate(-30 118 108)"/>' +
      '<circle cx="136" cy="94" r="8" fill="#fff"/><circle cx="139" cy="94" r="4" fill="#0a0f1f"/>' +
      TAIL,

    'pop-up-bop':
      HEAD +
      '<ellipse cx="70" cy="160" rx="42" ry="13" fill="#05081a" fill-opacity=".75"/>' +
      '<ellipse cx="250" cy="160" rx="42" ry="13" fill="#05081a" fill-opacity=".75"/>' +
      '<ellipse cx="160" cy="166" rx="50" ry="15" fill="#05081a" fill-opacity=".85"/>' +
      '<ellipse cx="160" cy="112" rx="44" ry="46" fill="#7aa2ff"/>' +
      '<ellipse cx="160" cy="124" rx="27" ry="22" fill="#a9c1ff"/>' +
      '<circle cx="144" cy="102" r="11" fill="#fff"/><circle cx="176" cy="102" r="11" fill="#fff"/>' +
      '<circle cx="146" cy="103" r="5.5" fill="#0a0f1f"/><circle cx="174" cy="103" r="5.5" fill="#0a0f1f"/>' +
      '<path d="M148 128q12 10 24 0" stroke="#0a0f1f" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M160 66v-14" stroke="#b9cbff" stroke-width="5" stroke-linecap="round"/><circle cx="160" cy="48" r="7" fill="#ffc552"/>' +
      '<path d="M226 64l5 12 13 2-9 9 2 13-11-6-11 6 2-13-9-9 13-2z" fill="#ffc552"/>' +
      '<path d="M90 70l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#fff" fill-opacity=".8"/>' +
      TAIL,

    'pattern-echo':
      HEAD +
      '<rect x="84" y="22" width="72" height="72" rx="20" fill="#36d6b4" fill-opacity=".5"/>' +
      '<rect x="164" y="22" width="72" height="72" rx="20" fill="#ff6b88" stroke="#fff" stroke-width="5"/>' +
      '<rect x="84" y="102" width="72" height="72" rx="20" fill="#ffc552" fill-opacity=".5"/>' +
      '<rect x="164" y="102" width="72" height="72" rx="20" fill="#7aa2ff" fill-opacity=".5"/>' +
      '<circle cx="200" cy="58" r="15" fill="#fff" fill-opacity=".9"/>' +
      TAIL
  };

  var fallback = HEAD + '<circle cx="160" cy="100" r="50" fill="#fff" fill-opacity=".85"/>' + TAIL;

  window.PlayNovaThumbs = {
    html: function (id) {
      return Object.prototype.hasOwnProperty.call(art, id) ? art[id] : fallback;
    }
  };
})();
